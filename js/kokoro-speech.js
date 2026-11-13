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

    /** Render a syllable once; the singing instrument reuses its samples across notes. */
    async renderSyllable(text) {
        const cached = await this._readSyllableCache(text);
        if (cached) return cached;
        const engine = await this._ensureEngine();
        const audio = await engine.generate(text, { voice: this._voice });
        const source = KokoroSpeech.analyzeSyllable(audio);
        await this._writeSyllableCache(text, source);
        return source;
    }

    _syllableCacheKey(text) {
        const identity = [KokoroSpeech.MODEL_ID, KokoroSpeech.DTYPE, this._voice, text];
        return new URL(
            "/_kokoro-singing/" + encodeURIComponent(JSON.stringify(identity)),
            window.location.href
        ).href;
    }

    async _readSyllableCache(text) {
        try {
            const cache = await globalThis.caches.open("musicblocks-kokoro-syllables-v1");
            const response = await cache.match(this._syllableCacheKey(text));
            if (!response) return null;
            const bytes = await response.arrayBuffer();
            if (
                bytes.byteLength === 0 ||
                bytes.byteLength > 4 * 1024 * 1024 ||
                bytes.byteLength % 4
            )
                return null;
            const rate = Number(response.headers.get("X-Sample-Rate"));
            const period = Number(response.headers.get("X-Pitch-Period"));
            const samples = new Float32Array(bytes);
            if (
                rate !== 24000 ||
                !Number.isInteger(period) ||
                period < rate / 500 ||
                period > rate / 70 ||
                samples.length < 2 * period ||
                !samples.every(Number.isFinite)
            )
                return null;
            return { samples, rate, period };
        } catch {
            // Storage may be unavailable or full; ordinary synthesis still works.
            return null;
        }
    }

    async _writeSyllableCache(text, source) {
        try {
            if (source.samples.byteLength > 4 * 1024 * 1024) return;
            const cache = await globalThis.caches.open("musicblocks-kokoro-syllables-v1");
            await cache.put(
                this._syllableCacheKey(text),
                new Response(source.samples, {
                    headers: {
                        "Content-Type": "application/octet-stream",
                        "X-Sample-Rate": String(source.rate),
                        "X-Pitch-Period": String(source.period)
                    }
                })
            );
            const keys = await cache.keys();
            await Promise.all(
                keys.slice(0, Math.max(0, keys.length - 32)).map(key => cache.delete(key))
            );
        } catch {
            // This cache is an optimization, not a prerequisite for playback.
        }
    }

    /** Trim silence and estimate a stable voiced period with normalized autocorrelation. */
    static analyzeSyllable(audio) {
        const samples = audio?.audio;
        const rate = audio?.sampling_rate;
        if (
            !samples ||
            !Number.isFinite(rate) ||
            rate < 8000 ||
            rate > 48000 ||
            samples.length < rate / 20
        ) {
            throw new Error("Kokoro returned invalid singing audio.");
        }
        let peak = 0;
        let center = 0;
        for (let i = 0; i < samples.length; i++) {
            if (!Number.isFinite(samples[i])) throw new Error("Invalid singing samples.");
            if (Math.abs(samples[i]) > peak) {
                peak = Math.abs(samples[i]);
                center = i;
            }
        }
        if (peak < 0.001) throw new Error("Kokoro returned silent singing audio.");
        let start = 0;
        let end = samples.length - 1;
        while (Math.abs(samples[start]) < peak * 0.02) start++;
        while (Math.abs(samples[end]) < peak * 0.02) end--;
        const frame = Math.min(Math.floor(rate * 0.06), end - start);
        const offset = Math.max(start, Math.min(center - Math.floor(frame / 2), end - frame));
        const correlations = [];
        let best = 0;
        for (let lag = Math.floor(rate / 500); lag <= Math.floor(rate / 70); lag++) {
            let cross = 0;
            let left = 0;
            let right = 0;
            for (let i = 0; i < frame - lag; i++) {
                const a = samples[offset + i];
                const b = samples[offset + i + lag];
                cross += a * b;
                left += a * a;
                right += b * b;
            }
            correlations[lag] = cross / Math.sqrt(left * right || 1);
            best = Math.max(best, correlations[lag]);
        }
        let period = 0;
        for (let lag = Math.floor(rate / 500) + 1; lag < correlations.length - 1; lag++) {
            if (
                correlations[lag] >= best * 0.9 &&
                correlations[lag] > correlations[lag - 1] &&
                correlations[lag] >= correlations[lag + 1]
            ) {
                period = lag;
                break;
            }
        }
        if (!period || best < 0.4)
            throw new Error("No stable vowel found. Try a syllable like la or ah.");
        return { samples: samples.slice(start, end + 1), rate, period };
    }

    /** Resample pitch-synchronous grains and overlap them to fit the requested duration. */
    static tuneSyllable(source, frequency, duration) {
        if (
            !Number.isFinite(frequency) ||
            frequency < 20 ||
            frequency > 4000 ||
            !Number.isFinite(duration) ||
            duration <= 0 ||
            duration > 30
        )
            throw new Error(
                "Singing notes must be between 20 and 4000 Hz and at most 30 seconds long."
            );
        const { samples, rate, period } = source;
        const output = new Float32Array(Math.max(1, Math.round(rate * duration)));
        const weights = new Float32Array(output.length);
        const hop = rate / frequency;
        const halfGrain = Math.ceil(hop);
        const grainWindow = Float64Array.from(
            { length: halfGrain * 2 },
            (_, i) => 0.5 + 0.5 * Math.cos((Math.PI * (i - halfGrain)) / hop)
        );
        // shortcut: grains shift formants along with pitch; use phoneme alignment
        // and formant-preserving processing before supporting whole lyric phrases.
        for (let target = 0; target < output.length + hop; target += hop) {
            const position = (target / output.length) * Math.max(0, samples.length - 2 * period);
            const mark = Math.round(position / period) * period + period;
            const center = Math.round(target);
            for (let delta = -halfGrain; delta < hop; delta++) {
                const index = center + delta;
                const from = mark + (delta * period) / hop;
                if (index < 0 || index >= output.length || from < 0 || from >= samples.length - 1)
                    continue;
                const weight = grainWindow[delta + halfGrain];
                const base = Math.floor(from);
                const sample = samples[base] + (samples[base + 1] - samples[base]) * (from - base);
                output[index] += sample * weight;
                weights[index] += weight;
            }
        }
        const fade = Math.min(rate * 0.01, output.length / 2);
        for (let i = 0; i < output.length; i++) {
            output[i] =
                (output[i] / Math.max(1, weights[i])) *
                Math.min(1, i / fade, (output.length - 1 - i) / fade);
        }
        return output;
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
