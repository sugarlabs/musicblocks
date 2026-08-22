// Copyright (c) 2026 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
   exported

   KokoroSpeech
 */

/**
 * Speech for the Speak block, using Kokoro, an 82M-parameter neural
 * text-to-speech model that runs entirely in the browser.
 *
 * Nothing here is bundled. kokoro-js is pulled in with a dynamic import the
 * first time a project actually speaks, and the weights are fetched straight
 * from Hugging Face, so dist/ and the service-worker precache are untouched and
 * a child who never uses the Speak block never downloads any of it. The q8
 * build is about 92 MB; Transformers.js parks it in the Cache Storage API, so
 * it is a one-time cost per browser rather than per run.
 *
 * Phrases are queued rather than overlapped: synthesis is slow enough that two
 * Speak blocks in a row would otherwise start talking on top of each other.
 */
class KokoroSpeech {
    /** npm package that wraps the model. Pinned so a bad release can't land silently. */
    static get CDN() {
        return "https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/+esm";
    }

    /** The published ONNX conversion of Kokoro v1.0. */
    static get MODEL_ID() {
        return "onnx-community/Kokoro-82M-v1.0-ONNX";
    }

    /**
     * Weight precision. "q8" is the smallest build kokoro-js exposes, roughly
     * 92 MB against 326 MB for fp32, and the quality difference is very hard to
     * hear on short phrases.
     */
    static get DTYPE() {
        return "q8";
    }

    /** Kokoro's default American English voice. */
    static get DEFAULT_VOICE() {
        return "af_heart";
    }

    /**
     * @param {object} [options]
     * @param {string} [options.voice] - a Kokoro voice id, e.g. "af_heart"
     */
    constructor(options = {}) {
        this._voice = options.voice || KokoroSpeech._storedVoice() || KokoroSpeech.DEFAULT_VOICE;
        this._enginePromise = null;
        this._engine = null;
        this._unavailable = false;

        this._queue = [];
        this._pumping = false;
        // Bumped by cancel(). Work started under an older token is discarded,
        // which is how an in-flight synthesis gets abandoned mid-way.
        this._token = 0;

        this._audioCtx = null;
        this._source = null;
    }

    /**
     * A voice id set by the user, if any.
     * @returns {string|null}
     */
    static _storedVoice() {
        try {
            return typeof localStorage === "undefined" ? null : localStorage.getItem("kokoroVoice");
        } catch (e) {
            // Storage can be blocked outright in a locked-down profile.
            return null;
        }
    }

    /**
     * Loads kokoro-js and the model weights, once. Later calls get the same
     * promise, so ten Speak blocks in a project still only trigger one download.
     *
     * @returns {Promise<object>} the KokoroTTS instance
     */
    _ensureEngine() {
        if (this._enginePromise === null) {
            this._enginePromise = (async () => {
                // Written this way so bundlers and the AMD loader leave it
                // alone and the browser resolves the URL at runtime.
                const { KokoroTTS } = await import(/* webpackIgnore: true */ KokoroSpeech.CDN);
                return KokoroTTS.from_pretrained(KokoroSpeech.MODEL_ID, {
                    dtype: KokoroSpeech.DTYPE,
                    device: "wasm"
                });
            })();
        }
        return this._enginePromise;
    }

    /**
     * Queues a phrase to be spoken.
     *
     * Returns immediately; the actual synthesis happens in the background. The
     * first call also kicks off the model download, so there is a noticeable
     * pause before anything is heard on a cold cache.
     *
     * @param {string} text
     * @returns {void}
     */
    speak(text) {
        const phrase = text === null || text === undefined ? "" : String(text);
        if (phrase.trim() === "" || this._unavailable) {
            return;
        }

        this._queue.push({ phrase, token: this._token });
        if (!this._pumping) {
            this._pump();
        }
    }

    /**
     * Stops whatever is being said and throws away anything still queued.
     *
     * @returns {void}
     */
    cancel() {
        this._token += 1;
        this._queue.length = 0;

        if (this._source !== null) {
            try {
                this._source.stop();
            } catch (e) {
                // Already finished; nothing to stop.
            }
            this._source = null;
        }
    }

    /**
     * Works through the queue, playing one phrase at a time.
     *
     * Synthesis runs a phrase ahead of playback. Rendering a short line takes a
     * few seconds on WebAssembly, so doing it only after the previous line had
     * finished left an audible gap between two Speak blocks. Starting the next
     * render while the current one is still playing hides most of that.
     *
     * @returns {Promise<void>}
     */
    async _pump() {
        this._pumping = true;
        try {
            let current = this._takeNext();
            let rendering = current === null ? null : this._render(current.phrase);

            while (rendering !== null) {
                const audio = await rendering;
                const item = current;

                // Get the following phrase under way before playing this one.
                current = this._takeNext();
                rendering = current === null ? null : this._render(current.phrase);

                // A null render means the model is gone; _render has already
                // explained why and emptied the queue.
                if (audio !== null && item.token === this._token) {
                    await this._play(audio, item.token);
                }
            }
        } finally {
            this._pumping = false;
            // Something may have been queued as the loop was winding down.
            if (this._queue.length > 0 && !this._unavailable) {
                this._pump();
            }
        }
    }

    /**
     * The next phrase still worth speaking, skipping anything a cancel() dropped.
     *
     * @returns {{phrase: string, token: number}|null}
     */
    _takeNext() {
        while (this._queue.length > 0) {
            const next = this._queue.shift();
            if (next.token === this._token) {
                return next;
            }
        }
        return null;
    }

    /**
     * Renders one phrase to audio.
     *
     * @param {string} phrase
     * @returns {Promise<object|null>} null if the model could not be used
     */
    async _render(phrase) {
        try {
            const engine = await this._ensureEngine();
            return await engine.generate(phrase, { voice: this._voice });
        } catch (e) {
            // A blocked CDN, an offline first run, or a browser without
            // WebAssembly all land here. Say so once and then stay quiet rather
            // than retrying on every block.
            this._unavailable = true;
            this._queue.length = 0;
            console.warn(`Speak block: could not load the Kokoro voice (${e.message}).`);
            return null;
        }
    }

    /**
     * Plays one rendered phrase and resolves when it finishes.
     *
     * Kokoro hands back raw mono samples, so they go straight into an
     * AudioBuffer. There is no container to decode.
     *
     * @param {object} audio - kokoro-js result, with `audio` and `sampling_rate`
     * @param {number} token - the cancel token this phrase belongs to
     * @returns {Promise<void>}
     */
    _play(audio, token) {
        const samples = audio.audio;
        const rate = audio.sampling_rate;
        if (!samples || !samples.length) {
            return Promise.resolve();
        }

        if (this._audioCtx === null) {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) {
                this._unavailable = true;
                return Promise.resolve();
            }
            this._audioCtx = new Ctx();
        }
        const ctx = this._audioCtx;

        // Autoplay policy parks the context until a gesture; pressing Run is
        // one, so this resolves in practice.
        if (ctx.state === "suspended" && typeof ctx.resume === "function") {
            ctx.resume();
        }

        const buffer = ctx.createBuffer(1, samples.length, rate);
        buffer.getChannelData(0).set(samples);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        this._source = source;

        return new Promise(resolve => {
            source.onended = () => {
                if (this._source === source) {
                    this._source = null;
                }
                resolve();
            };
            if (token !== this._token) {
                resolve();
                return;
            }
            source.start();
        });
    }
}

if (typeof define === "function" && define.amd) {
    define([], function () {
        return KokoroSpeech;
    });
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { KokoroSpeech };
}

if (typeof window !== "undefined") {
    window.KokoroSpeech = KokoroSpeech;
}
