/**
 * Tests for the Speak block's Kokoro engine.
 *
 * The model itself is never loaded here: _ensureEngine is stubbed, so these
 * cover the parts that are ours, namely the phrase queue, cancellation, and
 * what happens when the model can't be fetched at all.
 */

const { KokoroSpeech } = require("../kokoro-speech");

// A fake Web Audio graph. Sources record when they start and let the test decide
// when playback "finishes".
function installAudio({ state = "running", resume = jest.fn() } = {}) {
    const started = [];
    const pending = [];

    global.window.AudioContext = function () {
        this.state = state;
        this.resume = resume;
        this.destination = {};
        this.createBuffer = (channels, length, rate) => ({
            length,
            sampleRate: rate,
            getChannelData: () => new Float32Array(length)
        });
        this.createBufferSource = () => {
            const source = {
                buffer: null,
                onended: null,
                connect: jest.fn(),
                stop: jest.fn(() => {
                    if (source.onended) source.onended();
                }),
                start: jest.fn(() => {
                    started.push(source);
                    pending.push(source);
                })
            };
            return source;
        };
    };

    return {
        started,
        // Let the phrase that is currently playing run to its end.
        finishOne() {
            const source = pending.shift();
            if (source && source.onended) source.onended();
        }
    };
}

function fakeAudio() {
    return { audio: new Float32Array(8), sampling_rate: 24000 };
}

function overrideProperty(target, name, value) {
    const descriptor = Object.getOwnPropertyDescriptor(target, name);
    Object.defineProperty(target, name, {
        configurable: true,
        enumerable: descriptor ? descriptor.enumerable : true,
        value,
        writable: true
    });
    return () => {
        if (descriptor) {
            Object.defineProperty(target, name, descriptor);
        } else {
            delete target[name];
        }
    };
}

// Lets the queue pump run between assertions.
const settle = () => new Promise(resolve => setTimeout(resolve, 0));

describe("KokoroSpeech", () => {
    let audio;

    beforeEach(() => {
        audio = installAudio();
    });

    afterEach(() => {
        delete global.window.AudioContext;
        jest.restoreAllMocks();
    });

    test("speaks a phrase through the engine and plays the result", async () => {
        const speech = new KokoroSpeech();
        const generate = jest.fn(async () => fakeAudio());
        jest.spyOn(speech, "_ensureEngine").mockResolvedValue({ generate });

        speech.speak("hello there");
        await settle();

        expect(generate).toHaveBeenCalledWith("hello there", { voice: "af_heart" });
        expect(audio.started).toHaveLength(1);
    });

    test("plays consecutive phrases one after another, not on top of each other", async () => {
        const speech = new KokoroSpeech();
        const generate = jest.fn(async () => fakeAudio());
        jest.spyOn(speech, "_ensureEngine").mockResolvedValue({ generate });

        speech.speak("first");
        speech.speak("second");
        await settle();

        // Only one phrase is ever audible at a time.
        expect(audio.started).toHaveLength(1);

        audio.finishOne();
        await settle();

        expect(audio.started).toHaveLength(2);
        expect(generate.mock.calls.map(c => c[0])).toEqual(["first", "second"]);
    });

    test("renders the next phrase while the current one is still playing", async () => {
        const speech = new KokoroSpeech();
        const generate = jest.fn(async () => fakeAudio());
        jest.spyOn(speech, "_ensureEngine").mockResolvedValue({ generate });

        speech.speak("first");
        speech.speak("second");
        await settle();

        // "second" is already being synthesised even though "first" has not
        // finished, which is what keeps the gap between blocks short.
        expect(audio.started).toHaveLength(1);
        expect(generate).toHaveBeenCalledTimes(2);
    });

    test("imports the model once no matter how many phrases are spoken", async () => {
        const speech = new KokoroSpeech();
        const load = jest.fn(async () => ({ generate: async () => fakeAudio() }));
        // Stand in for the dynamic import plus from_pretrained, so we can count
        // how often the 92 MB download would actually have been triggered.
        speech._enginePromise = null;
        jest.spyOn(speech, "_ensureEngine").mockImplementation(function () {
            if (this._enginePromise === null) {
                this._enginePromise = load();
            }
            return this._enginePromise;
        });

        speech.speak("one");
        speech.speak("two");
        await settle();
        audio.finishOne();
        await settle();

        expect(load).toHaveBeenCalledTimes(1);
        expect(audio.started).toHaveLength(2);
    });

    test("creates the engine from the verified Kokoro module", async () => {
        const speech = new KokoroSpeech();
        const fromPretrained = jest.fn().mockResolvedValue({ generate: jest.fn() });
        jest.spyOn(speech, "_loadVerifiedModule").mockResolvedValue({
            KokoroTTS: { from_pretrained: fromPretrained }
        });

        await speech._ensureEngine();

        expect(fromPretrained).toHaveBeenCalledWith(KokoroSpeech.MODEL_ID, {
            dtype: KokoroSpeech.DTYPE,
            device: "wasm",
            progress_callback: expect.any(Function)
        });
    });

    test("verifies every executable asset before importing Kokoro", async () => {
        const speech = new KokoroSpeech();
        const assets = KokoroSpeech.ASSETS;
        const bytes = new ArrayBuffer(8);
        const fetch = jest.fn().mockResolvedValue({
            ok: true,
            arrayBuffer: async () => bytes
        });
        const digest = jest
            .spyOn(KokoroSpeech, "_sha384Hex")
            .mockResolvedValueOnce(assets.bundle.sha384)
            .mockResolvedValueOnce(assets.ortModule.sha384)
            .mockResolvedValueOnce(assets.ortWasm.sha384);
        const createObjectURL = jest.fn(
            (blob, index) => `blob:kokoro-${createObjectURL.mock.calls.length}`
        );
        const revokeObjectURL = jest.fn();
        const imported = { KokoroTTS: jest.fn(), env: {} };
        const importModule = jest
            .spyOn(speech, "_importVerifiedModule")
            .mockResolvedValue(imported);
        const restore = [
            overrideProperty(globalThis, "fetch", fetch),
            overrideProperty(globalThis, "crypto", { subtle: {} }),
            overrideProperty(URL, "createObjectURL", createObjectURL),
            overrideProperty(URL, "revokeObjectURL", revokeObjectURL)
        ];

        try {
            const result = await speech._loadVerifiedModule();

            expect(fetch.mock.calls.map(call => call[0])).toEqual([
                assets.bundle.url,
                assets.ortModule.url,
                assets.ortWasm.url
            ]);
            expect(digest).toHaveBeenCalledTimes(3);
            expect(importModule).toHaveBeenCalledWith("blob:kokoro-1");
            expect(result.env.wasmPaths).toEqual({
                mjs: "blob:kokoro-2",
                wasm: "blob:kokoro-3"
            });
        } finally {
            speech._revokeAssetURLs();
            restore.reverse().forEach(restoreProperty => restoreProperty());
        }
    });

    test("rejects an executable asset whose digest does not match", async () => {
        const speech = new KokoroSpeech();
        const asset = KokoroSpeech.ASSETS.bundle;
        const fetch = jest.fn().mockResolvedValue({
            ok: true,
            arrayBuffer: async () => new ArrayBuffer(4)
        });
        jest.spyOn(KokoroSpeech, "_sha384Hex").mockResolvedValue("bad-digest");
        const restore = [
            overrideProperty(globalThis, "fetch", fetch),
            overrideProperty(globalThis, "crypto", { subtle: {} })
        ];

        try {
            await expect(speech._fetchVerifiedAsset(asset)).rejects.toThrow(
                "Kokoro asset integrity check failed"
            );
        } finally {
            restore.reverse().forEach(restoreProperty => restoreProperty());
        }
    });

    test("cancel drops everything still queued", async () => {
        const speech = new KokoroSpeech();
        const generate = jest.fn(async () => fakeAudio());
        jest.spyOn(speech, "_ensureEngine").mockResolvedValue({ generate });

        speech.speak("first");
        speech.speak("second");
        speech.speak("third");
        await settle();

        speech.cancel();
        await settle();

        expect(speech._queue).toHaveLength(0);
        // "first" is playing and "second" was rendered ahead of it, but nothing
        // past the cancel point is touched.
        expect(generate).not.toHaveBeenCalledWith("third", expect.anything());
        expect(audio.started).toHaveLength(1);
    });

    test("cancel stops the phrase that is currently playing", async () => {
        const speech = new KokoroSpeech();
        jest.spyOn(speech, "_ensureEngine").mockResolvedValue({
            generate: async () => fakeAudio()
        });

        speech.speak("a long sentence");
        await settle();
        const source = audio.started[0];

        speech.cancel();
        expect(source.stop).toHaveBeenCalled();
    });

    test("waits for a suspended audio context before starting playback", async () => {
        let finishResume;
        const resume = jest.fn(
            () =>
                new Promise(resolve => {
                    finishResume = resolve;
                })
        );
        audio = installAudio({ state: "suspended", resume });
        const speech = new KokoroSpeech();
        jest.spyOn(speech, "_ensureEngine").mockResolvedValue({
            generate: async () => fakeAudio()
        });

        speech.speak("wait for audio");
        await settle();

        expect(resume).toHaveBeenCalledTimes(1);
        expect(audio.started).toHaveLength(0);

        finishResume();
        await settle();

        expect(audio.started).toHaveLength(1);
    });

    test("cancel settles playback while the audio context is resuming", async () => {
        const resume = jest.fn(() => new Promise(() => {}));
        audio = installAudio({ state: "suspended", resume });
        const speech = new KokoroSpeech();
        jest.spyOn(speech, "_ensureEngine").mockResolvedValue({
            generate: async () => fakeAudio()
        });

        speech.speak("do not play this");
        await settle();
        speech.cancel();
        await settle();

        expect(resume).toHaveBeenCalledTimes(1);
        expect(audio.started).toHaveLength(0);
        expect(speech._pumping).toBe(false);
    });

    test("ends cleanly when a suspended audio context cannot resume", async () => {
        const resume = jest.fn(() => Promise.reject(new Error("blocked")));
        audio = installAudio({ state: "suspended", resume });
        const speech = new KokoroSpeech();
        jest.spyOn(speech, "_ensureEngine").mockResolvedValue({
            generate: async () => fakeAudio()
        });

        speech.speak("browser blocked audio");
        await settle();

        expect(resume).toHaveBeenCalledTimes(1);
        expect(audio.started).toHaveLength(0);
        expect(speech._pumping).toBe(false);
    });

    test("cancel is safe when nothing has been spoken", () => {
        const speech = new KokoroSpeech();
        expect(() => speech.cancel()).not.toThrow();
    });

    test("ignores empty and whitespace-only phrases", async () => {
        const speech = new KokoroSpeech();
        const generate = jest.fn(async () => fakeAudio());
        jest.spyOn(speech, "_ensureEngine").mockResolvedValue({ generate });

        speech.speak("");
        speech.speak("   ");
        speech.speak(null);
        speech.speak(undefined);
        await settle();

        expect(generate).not.toHaveBeenCalled();
    });

    test("coerces non-string input", async () => {
        const speech = new KokoroSpeech();
        const generate = jest.fn(async () => fakeAudio());
        jest.spyOn(speech, "_ensureEngine").mockResolvedValue({ generate });

        speech.speak(42);
        await settle();

        expect(generate).toHaveBeenCalledWith("42", { voice: "af_heart" });
    });

    test("gives up quietly and stays quiet when the model cannot be loaded", async () => {
        const speech = new KokoroSpeech();
        const ensure = jest.spyOn(speech, "_ensureEngine").mockRejectedValue(new Error("offline"));
        const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

        speech.speak("first");
        speech.speak("second");
        await settle();

        expect(warn).toHaveBeenCalledTimes(1);
        expect(audio.started).toHaveLength(0);

        // A later block shouldn't retry the failed download.
        ensure.mockClear();
        speech.speak("third");
        await settle();
        expect(ensure).not.toHaveBeenCalled();
    });

    test("honours a voice chosen by the user", async () => {
        const speech = new KokoroSpeech({ voice: "bm_george" });
        const generate = jest.fn(async () => fakeAudio());
        jest.spyOn(speech, "_ensureEngine").mockResolvedValue({ generate });

        speech.speak("good afternoon");
        await settle();

        expect(generate).toHaveBeenCalledWith("good afternoon", { voice: "bm_george" });
    });

    test("forwards model-loading progress to the UI callback", () => {
        const onProgress = jest.fn();
        const speech = new KokoroSpeech({ onProgress });

        speech._reportProgress({ progress: 42, status: "progress" });

        expect(onProgress).toHaveBeenCalledWith({ progress: 42, status: "progress" });
    });
});

describe("Kokoro singing resynthesis", () => {
    const rate = 24000;
    const tone = frequency => ({
        audio: Float32Array.from(
            { length: rate / 2 },
            (_, i) => 0.5 * Math.sin((2 * Math.PI * frequency * i) / rate)
        ),
        sampling_rate: rate
    });

    test("renders with the real speech engine interface", async () => {
        const speech = new KokoroSpeech();
        const generate = jest.fn().mockResolvedValue(tone(220));
        jest.spyOn(speech, "_ensureEngine").mockResolvedValue({ generate });
        const source = await speech.renderSyllable("la");
        expect(generate).toHaveBeenCalledWith("la", { voice: "af_heart" });
        expect(source.rate / source.period).toBeCloseTo(220, 0);
    });

    test.each([110, 220, 440])("sings a %i Hz note for the requested duration", frequency => {
        const source = KokoroSpeech.analyzeSyllable(tone(220));
        const output = KokoroSpeech.tuneSyllable(source, frequency, 0.8);
        expect(output).toHaveLength(rate * 0.8);
        expect(output.every(Number.isFinite)).toBe(true);
        expect(output[0]).toBe(0);
        expect(Math.abs(output[output.length - 1])).toBe(0);
        const analyzed = KokoroSpeech.analyzeSyllable({ audio: output, sampling_rate: rate });
        expect(Math.abs(rate / analyzed.period - frequency) / frequency).toBeLessThan(0.03);
    });

    test("rejects silence and non-finite audio", () => {
        expect(() =>
            KokoroSpeech.analyzeSyllable({ audio: new Float32Array(rate), sampling_rate: rate })
        ).toThrow("silent");
        const bad = tone(220);
        bad.audio[20] = NaN;
        expect(() => KokoroSpeech.analyzeSyllable(bad)).toThrow("Invalid singing");
    });

    test.each([
        [NaN, 1],
        [440, Infinity],
        [440, -1],
        [440, 31]
    ])("rejects unsupported pitch or duration (%s, %s)", (frequency, duration) => {
        expect(() =>
            KokoroSpeech.tuneSyllable(KokoroSpeech.analyzeSyllable(tone(220)), frequency, duration)
        ).toThrow();
    });
});

describe("Persistent singing syllable cache", () => {
    let originalCaches;
    let originalResponse;
    let cache;
    let records;
    beforeEach(() => {
        originalCaches = global.caches;
        originalResponse = global.Response;
        records = new Map();
        cache = {
            match: jest.fn(async key => records.get(key)),
            put: jest.fn(async (key, value) => records.set(key, value)),
            keys: jest.fn(async () => [...records.keys()]),
            delete: jest.fn(async key => records.delete(key))
        };
        global.caches = { open: jest.fn(async () => cache) };
        global.Response = class {
            constructor(data, options) {
                this.data = data.slice();
                this.headers = { get: key => options.headers[key] };
            }
            async arrayBuffer() {
                return this.data.buffer.slice(0);
            }
        };
    });
    afterEach(() => {
        global.caches = originalCaches;
        global.Response = originalResponse;
    });
    test("a new engine instance uses saved syllables without loading the model", async () => {
        const rate = 24000;
        const first = new KokoroSpeech();
        jest.spyOn(first, "_ensureEngine").mockResolvedValue({
            generate: async () => ({
                audio: Float32Array.from(
                    { length: 12000 },
                    (_, i) => 0.5 * Math.sin((2 * Math.PI * 220 * i) / rate)
                ),
                sampling_rate: rate
            })
        });
        const source = await first.renderSyllable("la");
        const reloaded = new KokoroSpeech();
        const load = jest.spyOn(reloaded, "_ensureEngine");
        expect(await reloaded.renderSyllable("la")).toEqual(source);
        expect(load).not.toHaveBeenCalled();
        expect(reloaded._syllableCacheKey("la")).not.toBe(
            new KokoroSpeech({ voice: "am_adam" })._syllableCacheKey("la")
        );
    });
    test("corrupt cache entries are ignored and storage failure is non-fatal", async () => {
        const speech = new KokoroSpeech();
        records.set(
            speech._syllableCacheKey("la"),
            new Response(new Float32Array([NaN]), {
                headers: { "X-Sample-Rate": "24000", "X-Pitch-Period": "0" }
            })
        );
        expect(await speech._readSyllableCache("la")).toBeNull();
        global.caches.open.mockRejectedValue(new Error("quota"));
        expect(await speech._readSyllableCache("la")).toBeNull();
        await expect(
            speech._writeSyllableCache("la", {
                samples: new Float32Array(1),
                rate: 24000,
                period: 109
            })
        ).resolves.toBeUndefined();
    });
    test("keeps no more than 32 syllables on disk", async () => {
        const speech = new KokoroSpeech();
        for (let i = 0; i < 35; i++) {
            await speech._writeSyllableCache(String(i), {
                samples: new Float32Array(1000),
                rate: 24000,
                period: 109
            });
        }
        expect(records.size).toBe(32);
        expect(records.has(speech._syllableCacheKey("0"))).toBe(false);
    });
});
