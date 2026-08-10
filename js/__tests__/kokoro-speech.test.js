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
function installAudio() {
    const started = [];
    const pending = [];

    global.window.AudioContext = function () {
        this.state = "running";
        this.resume = jest.fn();
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
});
