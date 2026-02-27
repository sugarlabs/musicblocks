/**
 * MusicBlocks
 *
 * @author kh-ub-ayb
 *
 * @copyright 2026 kh-ub-ayb
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

const fs = require("fs");
const path = require("path");

// Load the AIWidget class by reading the source and evaluating it
// We inject a global setter so tests can access the closure's midiBuffer
const source = fs.readFileSync(path.resolve(__dirname, "../aiwidget.js"), "utf-8");
new Function(
    source.replace(
        "let midiBuffer;",
        "let midiBuffer; global.mockMidiBuffer = function(m) { midiBuffer = m; };"
    ) + "\nif (typeof global !== 'undefined') { global.AIWidget = AIWidget; }"
)();

// Mock globals
global._ = str => str;
global.docById = jest.fn(id => document.createElement("div"));
global.DOUBLEFLAT = "doubleflat";
global.FLAT = "flat";
global.NATURAL = "natural";
global.SHARP = "sharp";
global.DOUBLESHARP = "doublesharp";
global.CUSTOMSAMPLES = [];
global.wheelnav = jest.fn();
global.getVoiceSynthName = jest.fn(() => "mockSynth");
global.Singer = jest.fn();
global.DRUMS = {};
global.Tone = { Analyser: jest.fn() };
global.instruments = { 0: { "electronic synth": { connect: jest.fn() } } };
global.slicePath = jest.fn();
global.platformColor = jest.fn();
global.ABCJS = {
    renderAbc: jest.fn(() => [{ millisecondsPerMeasure: () => 1000 }]),
    synth: {
        supportsAudio: jest.fn(() => true),
        CreateSynth: jest.fn().mockImplementation(() => ({
            init: jest.fn().mockResolvedValue(),
            prime: jest.fn().mockResolvedValue(),
            start: jest.fn(),
            stop: jest.fn()
        }))
    },
    parseOnly: jest.fn(() => [])
};

describe("AIWidget", () => {
    let mockActivity;
    let mockWidgetWindow;

    beforeEach(() => {
        document.body.innerHTML = "";
        jest.clearAllMocks();

        mockWidgetWindow = {
            clear: jest.fn(),
            show: jest.fn(),
            onclose: null,
            onmaximize: null,
            addButton: jest.fn(() => {
                const btn = document.createElement("button");
                return btn;
            }),
            getWidgetBody: jest.fn(() => {
                const body = document.createElement("div");
                body.getBoundingClientRect = () => ({ width: 800, height: 600 });
                return body;
            }),
            getWidgetFrame: jest.fn(() => {
                const frame = document.createElement("div");
                frame.getBoundingClientRect = () => ({ width: 800, height: 600 });
                return frame;
            }),
            sendToCenter: jest.fn(),
            isMaximized: jest.fn(() => false),
            destroy: jest.fn()
        };

        window.widgetWindows = {
            windowFor: jest.fn(() => mockWidgetWindow)
        };

        mockActivity = {
            logo: {
                synth: {
                    loadSynth: jest.fn(),
                    trigger: jest.fn()
                }
            },
            textMsg: jest.fn(),
            errorMsg: jest.fn(),
            blocks: {
                loadNewBlocks: jest.fn()
            }
        };

        const canvas = document.createElement("canvas");
        document.body.appendChild(canvas);

        const audioError = document.createElement("div");
        audioError.className = "audio-error";
        document.body.appendChild(audioError);

        const stopAudio = document.createElement("button");
        stopAudio.className = "stop-audio";
        document.body.appendChild(stopAudio);
    });

    describe("Constructor and Properties", () => {
        test("Initializes basic properties", () => {
            const aiwidget = new AIWidget();

            expect(aiwidget.sampleName).toBe("electronic synth");
            expect(aiwidget.sampleData).toBe("");
            expect(aiwidget.samplePitch).toBe("sol");
            expect(aiwidget.sampleOctave).toBe("4");
            expect(aiwidget.pitchCenter).toBe(9);
            expect(aiwidget.accidentalCenter).toBe(2);
            expect(aiwidget.octaveCenter).toBe(4);
            expect(aiwidget.sampleLength).toBe(1000);
            expect(aiwidget.pitchAnalysers).toEqual({});
        });
    });

    describe("State Modifiers", () => {
        let aiwidget;

        beforeEach(() => {
            aiwidget = new AIWidget();
        });

        test("_usePitch updates pitchCenter", () => {
            aiwidget._usePitch("sol");
            expect(aiwidget.pitchCenter).toBe(4);

            aiwidget._usePitch("unknown");
            expect(aiwidget.pitchCenter).toBe(0); // Fallback to 0 if not found
        });

        test("_useAccidental updates accidentalCenter", () => {
            aiwidget._useAccidental(global.FLAT);
            expect(aiwidget.accidentalCenter).toBe(1);

            aiwidget._useAccidental("unknown");
            expect(aiwidget.accidentalCenter).toBe(2); // Fallback to center (natural)
        });

        test("_useOctave sets octave number", () => {
            aiwidget._useOctave("5");
            expect(aiwidget.octaveCenter).toBe(5);
        });
    });

    describe("Init Method", () => {
        test("Sets up widget window and basic dependencies", () => {
            const aiwidget = new AIWidget();

            // Spy on makeCanvas, reconnectSynthsToAnalyser, and pause
            jest.spyOn(aiwidget, "makeCanvas").mockImplementation(() => {});
            jest.spyOn(aiwidget, "reconnectSynthsToAnalyser").mockImplementation(() => {});
            jest.spyOn(aiwidget, "pause").mockImplementation(() => {});

            aiwidget.init(mockActivity);

            expect(window.widgetWindows.windowFor).toHaveBeenCalledWith(aiwidget, "AI");
            expect(mockWidgetWindow.clear).toHaveBeenCalled();
            expect(mockWidgetWindow.show).toHaveBeenCalled();
            expect(mockWidgetWindow.sendToCenter).toHaveBeenCalledTimes(2);
            expect(aiwidget.activity).toBe(mockActivity);

            // Play and Export buttons logic
            expect(mockWidgetWindow.addButton).toHaveBeenCalledTimes(2);
            expect(aiwidget.reconnectSynthsToAnalyser).toHaveBeenCalled();
        });
    });

    describe("Methods and Helpers", () => {
        let aiwidget;

        beforeEach(() => {
            aiwidget = new AIWidget();
            aiwidget.activity = mockActivity;
        });

        test("getSampleLength checks sample size threshold", () => {
            aiwidget.sampleData = "A".repeat(1333334);
            aiwidget.getSampleLength();
            expect(mockActivity.errorMsg).toHaveBeenCalledWith(
                "Warning: Sample is bigger than 1MB.",
                undefined
            );

            mockActivity.errorMsg.mockClear();
            aiwidget.sampleData = "A".repeat(1000);
            aiwidget.getSampleLength();
            expect(mockActivity.errorMsg).not.toHaveBeenCalled();
        });

        test("showSampleTypeError triggers error", () => {
            aiwidget.showSampleTypeError();
            expect(mockActivity.errorMsg).toHaveBeenCalledWith(
                "Upload failed: Sample is not a .wav file.",
                undefined
            );
        });

        test("_saveSample calls inner __save method logic", () => {
            jest.spyOn(aiwidget, "__save").mockImplementation(() => {});
            aiwidget._saveSample();
            expect(aiwidget.__save).toHaveBeenCalled();
        });

        test("_addSample pushes unique names to CUSTOMSAMPLES array", () => {
            global.CUSTOMSAMPLES = [];

            aiwidget.sampleName = "test_sample_1";
            aiwidget.sampleData = "data1";
            aiwidget._addSample();

            expect(global.CUSTOMSAMPLES.length).toBe(1);
            expect(global.CUSTOMSAMPLES[0]).toEqual(["test_sample_1", "data1"]);

            // Try adding same again, should skip
            aiwidget._addSample();
            expect(global.CUSTOMSAMPLES.length).toBe(1);
        });

        test("reconnectSynthsToAnalyser initializes Analyser and connects synth", () => {
            aiwidget.originalSampleName = "test_sample_orig";
            global.instruments = {
                0: {
                    "electronic synth": { connect: jest.fn() },
                    "customsample_test_sample_orig": { connect: jest.fn() }
                }
            };

            aiwidget.reconnectSynthsToAnalyser();

            expect(global.Tone.Analyser).toHaveBeenCalledTimes(2);
            expect(global.instruments[0]["electronic synth"].connect).toHaveBeenCalled();
            expect(
                global.instruments[0]["customsample_test_sample_orig"].connect
            ).toHaveBeenCalled();
        });

        test("_playSample triggers synth with sample configuration", () => {
            aiwidget.sampleName = "valid_sample";
            aiwidget.originalSampleName = "original_name";
            aiwidget.sampleLength = 2000;
            jest.spyOn(aiwidget, "reconnectSynthsToAnalyser").mockImplementation(() => {});

            aiwidget._playSample();

            expect(aiwidget.reconnectSynthsToAnalyser).toHaveBeenCalled();
            expect(mockActivity.logo.synth.trigger).toHaveBeenCalledWith(
                0,
                [220],
                2,
                "customsample_original_name",
                null,
                null,
                false
            );
        });

        test("pause stops the midiBuffer", () => {
            const stopMock = jest.fn();
            global.mockMidiBuffer({ stop: stopMock });
            aiwidget.pause();
            expect(stopMock).toHaveBeenCalled();
        });

        test("resume sets isMoving true and updates playBtn", () => {
            aiwidget.playBtn = document.createElement("button");
            aiwidget.isMoving = false;

            aiwidget.resume();

            expect(aiwidget.isMoving).toBe(true);
            expect(aiwidget.playBtn.innerHTML).toContain("pause-button.svg");
        });
    });
});
