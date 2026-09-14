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
 * Nothing here is bundled. The static kokoro-js browser bundle and its ONNX
 * runtime assets are fetched and verified the first time a project actually
 * speaks, while the model weights are fetched straight from Hugging Face. This
 * keeps dist/ and the service-worker precache untouched, and a child who never
 * uses the Speak block never downloads any of it. The q8 build is about 92 MB;
 * Transformers.js parks it in the Cache Storage API, so it is a one-time cost
 * per browser rather than per run.
 *
 * Phrases are queued rather than overlapped: synthesis is slow enough that two
 * Speak blocks in a row would otherwise start talking on top of each other.
 */
class KokoroSpeech {
    /**
     * Immutable, hashed browser assets required by kokoro-js.
     *
     * The generated jsDelivr +esm entry point has transitive CDN imports, so it
     * cannot be protected by one digest. These static files are self-contained
     * and each executable asset is verified before it is imported or configured.
     */
    static get ASSETS() {
        return {
            bundle: {
                url: "https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js",
                sha384: "b2e4754de29ee857bc7d3d27fee4d6a288673c9ae9d73bb7cf46e3e151f66a79a6abbdfdc259854a7305272318b33002",
                type: "text/javascript"
            },
            ortModule: {
                url: "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1/dist/ort-wasm-simd-threaded.jsep.mjs",
                sha384: "ec626a1f9bdcf3762ded51f0acc5d333c6cd0abb7f7bff1e0ada24f33941daee5dc2a9a1cd26a4cc29105ab7d8191378",
                type: "text/javascript"
            },
            ortWasm: {
                url: "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1/dist/ort-wasm-simd-threaded.jsep.wasm",
                sha384: "bbf6c3b31dfd73ec2dd0b6c798e0b2771b787f28a2837d75f214203937cebeb7e481270ce21468d88c13b65c72a08d36",
                type: "application/wasm"
            }
        };
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
     * @param {Function} [options.onProgress] - called with model-loading progress
     */
    constructor(options = {}) {
        this._voice = options.voice || KokoroSpeech._storedVoice() || KokoroSpeech.DEFAULT_VOICE;
        this._onProgress = typeof options.onProgress === "function" ? options.onProgress : null;
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
        this._cancelResume = null;
        this._assetURLs = [];
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
                const { KokoroTTS } = await this._loadVerifiedModule();
                try {
                    return await KokoroTTS.from_pretrained(KokoroSpeech.MODEL_ID, {
                        dtype: KokoroSpeech.DTYPE,
                        device: "wasm",
                        progress_callback: progress => this._reportProgress(progress)
                    });
                } catch (e) {
                    this._revokeAssetURLs();
                    throw e;
                }
            })();
        }
        return this._enginePromise;
    }

    /**
     * Calculates a SHA-384 digest in the browser's Web Crypto implementation.
     *
     * @param {ArrayBuffer} bytes
     * @returns {Promise<string>} lowercase hexadecimal digest
     */
    static async _sha384Hex(bytes) {
        const digest = await globalThis.crypto.subtle.digest("SHA-384", bytes);
        return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join(
            ""
        );
    }

    /**
     * Fetches one executable asset and verifies it before returning its bytes.
     *
     * @param {{url: string, sha384: string}} asset
     * @returns {Promise<ArrayBuffer>}
     */
    async _fetchVerifiedAsset(asset) {
        if (
            typeof globalThis.fetch !== "function" ||
            !globalThis.crypto ||
            !globalThis.crypto.subtle
        ) {
            throw new Error("Web Crypto is unavailable; cannot verify the Kokoro voice.");
        }

        const response = await globalThis.fetch(asset.url, {
            cache: "force-cache",
            credentials: "omit"
        });
        if (!response.ok) {
            throw new Error(`Could not download Kokoro asset (${response.status}).`);
        }

        const bytes = await response.arrayBuffer();
        const digest = await KokoroSpeech._sha384Hex(bytes);
        if (digest !== asset.sha384) {
            throw new Error(`Kokoro asset integrity check failed for ${asset.url}.`);
        }
        return bytes;
    }

    /**
     * Imports the verified static bundle through a Blob URL. Keeping the URL
     * alive is required because the bundle may load the ONNX runtime later.
     *
     * @param {string} url
     * @returns {Promise<object>}
     */
    _importVerifiedModule(url) {
        // This URL was created only after _fetchVerifiedAsset checked its digest.
        return import(/* webpackIgnore: true */ url);
    }

    /**
     * Verifies all executable assets, then imports and configures Kokoro.
     *
     * @returns {Promise<{KokoroTTS: Function, env: object}>}
     */
    async _loadVerifiedModule() {
        const assets = KokoroSpeech.ASSETS;
        const [bundleBytes, ortModuleBytes, ortWasmBytes] = await Promise.all([
            this._fetchVerifiedAsset(assets.bundle),
            this._fetchVerifiedAsset(assets.ortModule),
            this._fetchVerifiedAsset(assets.ortWasm)
        ]);
        const urls = [];

        try {
            urls.push(URL.createObjectURL(new Blob([bundleBytes], { type: assets.bundle.type })));
            urls.push(
                URL.createObjectURL(new Blob([ortModuleBytes], { type: assets.ortModule.type }))
            );
            urls.push(URL.createObjectURL(new Blob([ortWasmBytes], { type: assets.ortWasm.type })));
            this._assetURLs = urls;

            const module = await this._importVerifiedModule(urls[0]);
            if (!module || typeof module.KokoroTTS !== "function" || !module.env) {
                throw new Error("The verified Kokoro bundle has an unexpected API.");
            }
            module.env.wasmPaths = { mjs: urls[1], wasm: urls[2] };
            return module;
        } catch (e) {
            this._revokeAssetURLs(urls);
            throw e;
        }
    }

    /**
     * Releases Blob URLs after a failed engine initialization.
     *
     * @param {string[]} [urls]
     * @returns {void}
     */
    _revokeAssetURLs(urls = this._assetURLs) {
        if (typeof URL.revokeObjectURL === "function") {
            for (const url of urls) {
                URL.revokeObjectURL(url);
            }
        }
        if (urls === this._assetURLs) {
            this._assetURLs = [];
        }
    }

    /**
     * Reports model-loading progress without making the engine depend on the UI.
     *
     * @param {object} progress - Transformers.js progress information
     * @returns {void}
     */
    _reportProgress(progress) {
        if (this._onProgress !== null) {
            this._onProgress(progress);
        }
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

        if (this._cancelResume !== null) {
            this._cancelResume();
            this._cancelResume = null;
        }

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
    async _play(audio, token) {
        const samples = audio.audio;
        const rate = audio.sampling_rate;
        if (!samples || !samples.length) {
            return;
        }

        if (this._audioCtx === null) {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) {
                this._unavailable = true;
                return;
            }
            this._audioCtx = new Ctx();
        }
        const ctx = this._audioCtx;

        if (ctx.state === "suspended" && typeof ctx.resume === "function") {
            let cancelResume;
            const cancelled = new Promise(resolve => {
                cancelResume = () => resolve(false);
            });
            this._cancelResume = cancelResume;

            const resumed = Promise.resolve()
                .then(() => ctx.resume())
                .then(
                    () => true,
                    () => false
                );
            const canPlay = await Promise.race([resumed, cancelled]);

            if (this._cancelResume === cancelResume) {
                this._cancelResume = null;
            }
            if (!canPlay || token !== this._token) {
                return;
            }
        } else if (token !== this._token) {
            return;
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
            try {
                source.start();
            } catch (e) {
                if (this._source === source) {
                    this._source = null;
                }
                resolve();
            }
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
