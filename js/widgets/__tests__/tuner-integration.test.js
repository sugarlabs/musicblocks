/**
 * MusicBlocks
 *
 * @copyright 2026 Music Blocks Contributors
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// Tests for the Tuner in js/widgets/tuner.js with the real Synth and the Tone.js mock. These
// were in synthutils.test.js while the tuner lived in Synth. They are kept apart from
// tuner.test.js because that suite replaces document with a mock, and startTuner builds
// real DOM.

global.Tone = require("../../utils/__tests__/tonemock.js");
global.clampNumber = require("../../utils/utils-logic").clampNumber;
const { Synth: SynthClass, instruments, instrumentsSource } = require("../../utils/synthutils");
// The tuner and the synth share these, as globals, in the browser.
global.instruments = instruments;
global.instrumentsSource = instrumentsSource;
global.docById = id => document.getElementById(id);
const { Tuner } = require("../tuner");

describe("Tuner", () => {
    let tuner;

    beforeEach(() => {
        tuner = new Tuner();
    });

    describe("getTunerFrequency", () => {
        it("should return 440 when tunerAnalyser is null", () => {
            tuner.tunerAnalyser = null;
            tuner.detectPitch = jest.fn();
            expect(tuner.getTunerFrequency()).toBe(440);
            expect(tuner.detectPitch).not.toHaveBeenCalled();
        });

        it("should return 440 when detectPitch is null", () => {
            tuner.tunerAnalyser = { getValue: jest.fn() };
            tuner.detectPitch = null;
            expect(tuner.getTunerFrequency()).toBe(440);
        });

        it("should return 440 when detected pitch is zero or negative", () => {
            tuner.tunerAnalyser = { getValue: jest.fn(() => new Float32Array(16)) };
            tuner.detectPitch = jest.fn(() => 0);
            expect(tuner.getTunerFrequency()).toBe(440);

            tuner.detectPitch = jest.fn(() => -1);
            expect(tuner.getTunerFrequency()).toBe(440);
        });

        it("should return detected pitch when valid", () => {
            tuner.tunerAnalyser = { getValue: jest.fn(() => new Float32Array(16)) };
            tuner.detectPitch = jest.fn(() => 261.63);
            expect(tuner.getTunerFrequency()).toBe(261.63);
        });
    });

    describe("stopTuner", () => {
        it("should not throw when tunerMic is null", () => {
            tuner.tunerMic = null;
            tuner.tunerAnalyser = null;
            expect(() => tuner.stopTuner()).not.toThrow();
        });

        it("should call close on tunerMic and null it", () => {
            const mockClose = jest.fn();
            tuner.tunerMic = { close: mockClose };
            tuner.tunerAnalyser = null;
            tuner.stopTuner();
            expect(mockClose).toHaveBeenCalledTimes(1);
            expect(tuner.tunerMic).toBeNull();
        });

        it("should disconnect and dispose tunerAnalyser when both exist", () => {
            const mockDisconnect = jest.fn();
            const mockDispose = jest.fn();
            const mockClose = jest.fn();
            const analyser = { dispose: mockDispose };
            tuner.tunerMic = { close: mockClose, disconnect: mockDisconnect };
            tuner.tunerAnalyser = analyser;

            tuner.stopTuner();

            expect(mockDisconnect).toHaveBeenCalledWith(analyser);
            expect(mockDispose).toHaveBeenCalled();
            expect(mockClose).toHaveBeenCalled();
            expect(tuner.tunerAnalyser).toBeNull();
            expect(tuner.tunerMic).toBeNull();
        });

        it("should skip analyser disposal when tunerAnalyser is null", () => {
            const mockDisconnect = jest.fn();
            const mockClose = jest.fn();
            tuner.tunerMic = { close: mockClose, disconnect: mockDisconnect };
            tuner.tunerAnalyser = null;

            tuner.stopTuner();

            expect(mockDisconnect).not.toHaveBeenCalled();
            expect(mockClose).toHaveBeenCalled();
        });

        it("should cancel any pending tuner animation frame", () => {
            const originalCancel = global.cancelAnimationFrame;
            const mockCancel = jest.fn();
            global.cancelAnimationFrame = mockCancel;
            tuner._tunerRafId = 123;
            tuner._tunerActive = true;
            tuner.tunerMic = null;
            tuner.tunerAnalyser = null;
            tuner.stopTuner();
            expect(mockCancel).toHaveBeenCalledWith(123);
            expect(tuner._tunerRafId).toBeNull();
            expect(tuner._tunerActive).toBe(false);
            global.cancelAnimationFrame = originalCancel;
        });
    });
});

describe("Tuner with the real Synth", () => {
    let synthInstance;
    let tuner;
    let mockActivity;
    let tunerContainer;

    function bufferForFrequency(freq, sampleRate = 44100) {
        const buf = new Float32Array(2048);
        if (freq <= 0) return buf;
        for (let i = 0; i < 2048; i++) {
            buf[i] = Math.sin((2 * Math.PI * freq * i) / sampleRate);
        }
        return buf;
    }

    beforeEach(() => {
        synthInstance = new SynthClass();
        tuner = new Tuner();
        document.body.innerHTML = "";

        tunerContainer = document.createElement("div");
        tunerContainer.id = "tunerContainer";
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        // Create 11 SVG path segments to simulate tuner display
        for (let i = 0; i < 11; i++) {
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            svg.appendChild(path);
        }
        tunerContainer.appendChild(svg);
        document.body.appendChild(tunerContainer);

        mockActivity = {
            logo: {
                synth: synthInstance,
                stopTurtle: false,
                errorMsg: jest.fn()
            },
            turtles: {
                _canvas: { width: 800, height: 600 },
                ithTurtle: () => ({
                    singer: {
                        instrumentNames: ["default"],
                        activeVoices: new Set()
                    }
                })
            }
        };
        window.ActivityContext = {
            getActivity: () => mockActivity
        };
        window.wheelnav = jest.fn();
        window.Raphael = jest.fn();
        global.wheelnav = jest.fn();
        global.Raphael = jest.fn();
        global.requestAnimationFrame = cb => setTimeout(cb, 0);
        global.cancelAnimationFrame = id => clearTimeout(id);
        global.piemenuPitches = jest.fn();
        if (!global.instruments[0]) global.instruments[0] = {};
        global.instruments[0]["electronic synth"] = new Tone.PolySynth();
        global.instrumentsSource["electronic synth"] = [0, "electronic synth"];
    });

    afterEach(() => {
        if (synthInstance) {
            tuner.stopTuner();
        }
        document.body.innerHTML = "";
        delete window.ActivityContext;
    });

    test("startTuner and updatePitch in chromatic mode across all pitch and cent ranges", async () => {
        await tuner.startTuner();
        expect(tuner._tunerActive).toBe(true);

        // Test getTunerFrequency
        const freq = tuner.getTunerFrequency();
        expect(freq).toBeGreaterThan(0);

        const noteText = document.getElementById("noteText");
        const centsText = document.getElementById("centsText");
        expect(noteText).not.toBeNull();
        expect(centsText).not.toBeNull();

        const segments = tunerContainer.querySelectorAll("svg path");
        expect(segments.length).toBe(11);

        // 1. Center in-tune (440Hz -> A4, near 0 cents, center green segment lit)
        tuner.tunerAnalyser.getValue = jest.fn().mockReturnValue(bufferForFrequency(440));
        await new Promise(resolve => setTimeout(resolve, 5));
        expect(noteText.textContent).toBe("A4");
        expect(centsText.textContent).toMatch(/\+?[0-5] cents/);
        expect(segments[5].getAttribute("fill")).toBe("#00FF00");

        // 2. Frequency sweep across various pitches (flat, sharp, silence)
        const testFreqs = [
            438, // slight flat
            432, // flat
            425, // flat
            418, // flat
            400, // deep flat
            442, // slight sharp
            448, // sharp
            455, // sharp
            462, // sharp
            480, // deep sharp
            0 // silence
        ];
        for (const f of testFreqs) {
            tuner.tunerAnalyser.getValue = jest.fn().mockReturnValue(bufferForFrequency(f));
            await new Promise(resolve => setTimeout(resolve, 5));
            if (f > 0) {
                expect(noteText.textContent).toBeTruthy();
                expect(centsText.textContent).toMatch(/cents/);
                // Verify at least one segment is active/colored
                const filledSegments = Array.from(segments).filter(
                    s => s.getAttribute("fill") && s.getAttribute("fill") !== "#D3D3D3"
                );
                expect(filledSegments.length).toBeGreaterThan(0);
            }
        }
    });

    test("updatePitch keeps running when the note display is not in the page", async () => {
        await tuner.startTuner();
        document.getElementById("noteDisplayContainer").remove();

        const errors = [];
        const onError = event => {
            errors.push(event.error);
            event.preventDefault();
        };
        window.addEventListener("error", onError);
        try {
            tuner.tunerAnalyser.getValue = jest.fn().mockReturnValue(bufferForFrequency(440));
            await new Promise(resolve => setTimeout(resolve, 20));
        } finally {
            window.removeEventListener("error", onError);
        }

        expect(errors).toEqual([]);
        expect(tuner._tunerActive).toBe(true);
        const segments = tunerContainer.querySelectorAll("svg path");
        expect(segments[5].getAttribute("fill")).toBe("#00FF00");
    });

    test("startTuner and updatePitch in target pitch mode with mode switching and pie menu", async () => {
        await tuner.startTuner();

        // Switch to target mode
        const targetPitchButton = document.querySelector('div[title="Target pitch"]');
        expect(targetPitchButton).not.toBeNull();
        targetPitchButton.onclick();

        const segments = tunerContainer.querySelectorAll("svg path");
        const noteText = document.getElementById("noteText");
        const centsText = document.getElementById("centsText");

        // 1 octave above (+1200 cents, >50 cents sharp -> rightmost segment deep red)
        tuner.tunerAnalyser.getValue = jest.fn().mockReturnValue(bufferForFrequency(880));
        await new Promise(resolve => setTimeout(resolve, 5));
        expect(noteText.textContent).toBe("A5");
        expect(centsText.textContent).toContain("+1 octave");
        expect(segments[10].getAttribute("fill")).toBe("#FF0000");

        // 1 octave below (-1200 cents, >50 cents flat -> leftmost segment deep red)
        tuner.tunerAnalyser.getValue = jest.fn().mockReturnValue(bufferForFrequency(220));
        await new Promise(resolve => setTimeout(resolve, 5));
        expect(noteText.textContent).toBe("A3");
        expect(centsText.textContent).toContain("-1 octave");
        expect(segments[0].getAttribute("fill")).toBe("#FF0000");

        // Near target sharp (+20 cents)
        tuner.tunerAnalyser.getValue = jest.fn().mockReturnValue(bufferForFrequency(445));
        await new Promise(resolve => setTimeout(resolve, 5));
        expect(noteText.textContent).toBe("A4");
        expect(centsText.textContent).toMatch(/\+?[0-9]+ cents/);

        // Near target flat (-20 cents)
        tuner.tunerAnalyser.getValue = jest.fn().mockReturnValue(bufferForFrequency(435));
        await new Promise(resolve => setTimeout(resolve, 5));
        expect(noteText.textContent).toBe("A4");
        expect(centsText.textContent).toMatch(/-[0-9]+ cents/);

        // Inactive / zero frequency
        tuner.tunerAnalyser.getValue = jest.fn().mockReturnValue(bufferForFrequency(0));
        await new Promise(resolve => setTimeout(resolve, 5));

        // Switch back to chromatic mode
        await new Promise(r => setTimeout(r, 250));
        const chromaticButton = document.querySelector('div[title="Chromatic"]');
        expect(chromaticButton).not.toBeNull();
        chromaticButton.onclick();

        // Switch to target mode again and click targetNoteSelector to open pie menu
        await new Promise(r => setTimeout(r, 250));
        targetPitchButton.onclick();
        const targetNoteSelector = document.getElementById("targetNoteSelector");
        expect(targetNoteSelector).not.toBeNull();

        // Trigger hover events
        targetNoteSelector.dispatchEvent(new Event("mouseenter"));
        targetNoteSelector.dispatchEvent(new Event("mouseleave"));

        // Set up piemenuPitches mock to simulate wheels
        global.piemenuPitches = jest.fn(
            (block, solfNotes, noteNotes, solfAttrs, selSolf, selAttr) => {
                block._pitchWheel = {
                    navItems: [
                        { title: "do" },
                        { title: "re" },
                        { title: "mi" },
                        { title: "fa" },
                        { title: "sol" },
                        { title: "la" },
                        { title: "ti" }
                    ]
                };
                block._accidentalsWheel = {
                    navItems: [
                        { title: "♯" },
                        { title: "♭" },
                        { title: "𝄪" },
                        { title: "𝄫" },
                        { title: "♮" }
                    ]
                };
                block._octavesWheel = {
                    navItems: [{ title: "3" }, { title: "4" }, { title: "5" }]
                };
                block._exitWheel = {
                    navItems: [
                        {
                            navigateFunction: jest.fn()
                        }
                    ],
                    removeWheel: jest.fn()
                };
                block._pitchWheel.removeWheel = jest.fn();
                block._accidentalsWheel.removeWheel = jest.fn();
                block._octavesWheel.removeWheel = jest.fn();
            }
        );
        window.piemenuPitches = global.piemenuPitches;

        targetNoteSelector.click();
        expect(global.piemenuPitches).toHaveBeenCalled();

        // Exercise wheel navigation callbacks for all notes & accidentals
        const tempBlock = global.piemenuPitches.mock.calls[0][0];
        if (tempBlock._pitchWheel?.navItems) {
            for (const item of tempBlock._pitchWheel.navItems) {
                if (item.navigateFunction) item.navigateFunction();
            }
        }
        if (tempBlock._accidentalsWheel?.navItems) {
            for (const item of tempBlock._accidentalsWheel.navItems) {
                if (item.navigateFunction) item.navigateFunction();
            }
        }
        if (tempBlock._octavesWheel?.navItems) {
            for (const item of tempBlock._octavesWheel.navItems) {
                if (item.navigateFunction) item.navigateFunction();
            }
        }
        if (tempBlock._exitWheel?.navItems[0]?.navigateFunction) {
            tempBlock._exitWheel.navItems[0].navigateFunction();
        }

        // Exercise fallback and catch branches when frequency computation fails or throws
        const origCompute = global.computeTargetPitchFrequency;
        const navFn = tempBlock._pitchWheel.navItems[0].navigateFunction;
        expect(typeof navFn).toBe("function");

        // 1. computeTargetPitchFrequency returns NaN -> falls back to 440 Hz
        global.computeTargetPitchFrequency = jest.fn().mockReturnValue(NaN);
        navFn();
        expect(targetNoteSelector.textContent).toBe("C5");
        tuner.tunerAnalyser.getValue = jest.fn().mockReturnValue(bufferForFrequency(440));
        await new Promise(resolve => setTimeout(resolve, 5));
        expect(segments[5].getAttribute("fill")).toBe("#00FF00");

        // 2. computeTargetPitchFrequency throws error -> falls back to 440 Hz
        global.computeTargetPitchFrequency = jest.fn().mockImplementation(() => {
            throw new Error("tuner calculation error");
        });
        navFn();
        expect(targetNoteSelector.textContent).toBe("C5");
        tuner.tunerAnalyser.getValue = jest.fn().mockReturnValue(bufferForFrequency(440));
        await new Promise(resolve => setTimeout(resolve, 5));
        expect(segments[5].getAttribute("fill")).toBe("#00FF00");

        global.computeTargetPitchFrequency = origCompute;

        // Test stopTuner
        tuner.stopTuner();
        expect(tuner._tunerActive).toBe(false);
        expect(tuner.tunerMic).toBeNull();
        expect(tuner.tunerAnalyser).toBeNull();
    });

    test("getTunerFrequency returns 440 default when analyser is null", () => {
        tuner.tunerAnalyser = null;
        expect(tuner.getTunerFrequency()).toBe(440);
    });

    test("startTuner initializes with provided initialTargetPitch and starts in target mode", async () => {
        // Do NOT mock computeTargetPitchFrequency to test real calculation for non-default octaves
        await tuner.startTuner("C6");
        await new Promise(r => setTimeout(r, 10)); // wait for rAF
        expect(tuner._tunerActive).toBe(true);

        // Should be in target pitch mode
        let modeToggle = document.getElementById("modeToggle");
        let chromaticButton = modeToggle.children[0];
        let targetPitchButton = modeToggle.children[1];
        expect(targetPitchButton.getAttribute("aria-pressed")).toBe("true");

        // Assert display results for C6
        const targetNoteSelector = document.getElementById("targetNoteSelector");
        expect(targetNoteSelector.textContent).toBe("C6");

        // Also test invalid pitch falls back
        tuner.stopTuner();
        // Clear DOM to force recreation of tuner elements
        document.body.innerHTML = "";
        let newTunerContainer = document.createElement("div");
        newTunerContainer.id = "tunerContainer";
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        for (let i = 0; i < 11; i++)
            svg.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "path"));
        newTunerContainer.appendChild(svg);
        document.body.appendChild(newTunerContainer);

        await tuner.startTuner("INVALID_PITCH");
        await new Promise(r => setTimeout(r, 10)); // wait for rAF

        // Should fallback to chromatic mode because invalid pitch doesn't set target mode
        modeToggle = document.getElementById("modeToggle");
        expect(modeToggle).not.toBeNull();
        chromaticButton = modeToggle.children[0];
        expect(chromaticButton.getAttribute("aria-pressed")).toBe("true");
    });

    test("tuner mode toggle buttons respond to keyboard events (Enter and Space)", async () => {
        await tuner.startTuner();
        await new Promise(r => setTimeout(r, 10)); // wait for rAF
        const modeToggle = document.getElementById("modeToggle");
        const chromaticButton = modeToggle.children[0];
        const targetPitchButton = modeToggle.children[1];

        // Initially chromatic mode is active
        expect(chromaticButton.getAttribute("aria-pressed")).toBe("true");

        // Press Space on Target Pitch button
        const spaceEvent = new KeyboardEvent("keydown", { key: " " });
        // Must mock preventDefault
        spaceEvent.preventDefault = jest.fn();
        targetPitchButton.onkeydown(spaceEvent);
        expect(targetPitchButton.getAttribute("aria-pressed")).toBe("true");
        expect(chromaticButton.getAttribute("aria-pressed")).toBe("false");
        expect(spaceEvent.preventDefault).toHaveBeenCalled();

        // Wait for debounce (200ms in source)
        await new Promise(resolve => setTimeout(resolve, 250));

        // Press Enter on Chromatic button
        const enterEvent = new KeyboardEvent("keydown", { key: "Enter" });
        enterEvent.preventDefault = jest.fn();
        chromaticButton.onkeydown(enterEvent);
        expect(chromaticButton.getAttribute("aria-pressed")).toBe("true");
        expect(targetPitchButton.getAttribute("aria-pressed")).toBe("false");
        expect(enterEvent.preventDefault).toHaveBeenCalled();

        // Wait for debounce before next keypress
        await new Promise(resolve => setTimeout(resolve, 250));

        // Press a different key, should not do anything (no preventDefault, mode stays chromatic)
        const otherEvent = new KeyboardEvent("keydown", { key: "a" });
        otherEvent.preventDefault = jest.fn();
        targetPitchButton.onkeydown(otherEvent);
        expect(chromaticButton.getAttribute("aria-pressed")).toBe("true");
        expect(otherEvent.preventDefault).not.toHaveBeenCalled();
    });

    describe("stopping while the tuner is still starting", () => {
        let OriginalUserMedia;
        let mics;
        let releaseOpen;

        beforeEach(() => {
            // Hold the microphone's open() until the test releases it, like a browser
            // waiting on the permission prompt.
            OriginalUserMedia = Tone.UserMedia;
            mics = [];
            releaseOpen = null;
            Tone.UserMedia = function () {
                const mic = new OriginalUserMedia();
                mic.open = jest.fn(
                    () =>
                        new Promise(resolve => {
                            releaseOpen = resolve;
                        })
                );
                mics.push(mic);
                return mic;
            };
        });

        afterEach(() => {
            Tone.UserMedia = OriginalUserMedia;
        });

        test("closes the microphone if stopTuner runs while it is opening", async () => {
            const starting = tuner.startTuner();
            while (!releaseOpen) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }

            tuner.stopTuner();
            releaseOpen();
            await starting;

            expect(mics).toHaveLength(1);
            expect(mics[0].close).toHaveBeenCalled();
            expect(tuner.tunerMic).toBeNull();
            expect(tuner.tunerAnalyser).toBeNull();
            expect(tuner._tunerActive).toBe(false);
        });

        test("never opens the microphone if stopTuner runs before it gets there", async () => {
            const starting = tuner.startTuner();
            tuner.stopTuner();
            await starting;

            expect(mics).toHaveLength(0);
            expect(tuner.tunerMic).toBeNull();
            expect(tuner._tunerActive).toBe(false);
        });

        test("a later start still works after a stopped one", async () => {
            const first = tuner.startTuner();
            tuner.stopTuner();
            await first;

            const second = tuner.startTuner();
            while (!releaseOpen) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
            releaseOpen();
            await second;

            expect(tuner.tunerMic).toBe(mics[0]);
            expect(tuner._tunerActive).toBe(true);
            tuner.stopTuner();
        });
    });
});
