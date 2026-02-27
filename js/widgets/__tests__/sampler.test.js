/**
 * MusicBlocks
 *
 * @author Om-A-osc
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

global._ = s => s;
global.DOUBLEFLAT = "bb";
global.FLAT = "b";
global.NATURAL = "n";
global.SHARP = "#";
global.DOUBLESHARP = "x";

global.instruments = [{}];
global.TunerUtils = {
    calculatePlaybackRate: jest.fn(),
    frequencyToPitch: jest.fn()
};

global.cancelAnimationFrame = jest.fn();
global.setTimeout = setTimeout;
global.Tone = {
    Analyser: jest.fn(() => ({
        connect: jest.fn()
    }))
};
global.requestAnimationFrame = jest.fn(() => 1);
global.A0 = 27.5;
global.pitchToNumber = jest.fn(() => 57);
global.CUSTOMSAMPLES = [];
global.DRUMS = ["kick", "snare"];
global.platformColor = {
    pitchWheelcolors: ["#111", "#222", "#333", "#444", "#555", "#666", "#777"],
    accidentalsWheelcolors: ["#111", "#222", "#333", "#444", "#555"],
    accidentalsWheelcolorspush: "#999",
    octavesWheelcolors: ["#111", "#222", "#333", "#444", "#555"],
    exitWheelcolors: ["#000", "#000"],
    textColor: "#000"
};
global.slicePath = () => ({
    DonutSlice: "DonutSlice",
    DonutSliceCustomization: () => ({})
});
global.wheelnav = function WheelNav() {
    this.raphael = {};
    this.navItems = [];
    this.colors = [];
    this.createWheel = labels => {
        this.navItems = labels.map(label => ({
            title: label,
            navItem: { hide: jest.fn() }
        }));
    };
    this.setTooltips = jest.fn();
    this.navigateWheel = jest.fn();
    this.removeWheel = jest.fn();
};
global.getVoiceSynthName = jest.fn(() => "voice");
global.Singer = { ToneActions: { setTimbre: jest.fn() } };
global.docById = id => document.getElementById(id);
global.docByClass = cls => document.getElementsByClassName(cls);
global.alert = jest.fn();
global.TunerDisplay = class {
    constructor(canvas, width, height) {
        this.canvas = canvas;
        this.width = width;
        this.height = height;
        this.update = jest.fn();
    }
};

const { SampleWidget, PitchSmoother } = require("../sampler.js");

describe("Sampler Widget", () => {
    beforeAll(() => {
        if (!HTMLCanvasElement.prototype.getContext) {
            HTMLCanvasElement.prototype.getContext = jest.fn();
        }
        HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
            clearRect: jest.fn(),
            fillRect: jest.fn(),
            fillText: jest.fn(),
            beginPath: jest.fn(),
            moveTo: jest.fn(),
            lineTo: jest.fn(),
            stroke: jest.fn()
        }));
    });

    beforeEach(() => {
        jest.clearAllMocks();
        global.instruments = [{}];
        global.CUSTOMSAMPLES = [];
        document.body.innerHTML = `
            <div id="wheelDiv"></div>
            <div id="wheelDivptm"></div>
            <input id="myOpenAll" type="file" />
        `;
    });

    describe("PitchSmoother", () => {
        test("smooths pitches and drops outliers", () => {
            const smoother = new PitchSmoother(5);
            smoother.addPitch(100);
            smoother.addPitch(101);
            smoother.addPitch(99);
            smoother.addPitch(5000);
            smoother.addPitch(102);

            const smoothed = smoother.getSmoothedPitch();
            expect(smoothed).toBeCloseTo(100.5, 1);
        });

        test("ignores non-positive pitches and resets history", () => {
            const smoother = new PitchSmoother(3);
            smoother.addPitch(0);
            smoother.addPitch(-20);

            expect(smoother.getSmoothedPitch()).toBe(-1);

            smoother.addPitch(200);
            expect(smoother.getSmoothedPitch()).toBe(200);

            smoother.reset();
            expect(smoother.getSmoothedPitch()).toBe(-1);
        });
    });

    describe("SampleWidget methods", () => {
        let widget;
        let mockActivity;
        let widgetWindow;
        let realSetTimbre;
        let realUpdateBlocks;
        let realPlayDelayedSample;
        let realEndPlaying;

        beforeEach(() => {
            widget = new SampleWidget();
            realSetTimbre = widget.setTimbre;
            realUpdateBlocks = widget._updateBlocks;
            realPlayDelayedSample = widget._playDelayedSample;
            realEndPlaying = widget._endPlaying;
            const widgetBody = document.createElement("div");
            const widgetFrame = document.createElement("div");
            widgetBody.getBoundingClientRect = () => ({ width: 800, height: 500 });
            widgetFrame.getBoundingClientRect = () => ({ height: 500 });
            const toolbar = document.createElement("div");
            document.body.appendChild(document.createElement("canvas"));
            document.body.appendChild(widgetBody);
            const buttons = [];
            widgetWindow = {
                _toolbar: toolbar,
                addButton: jest.fn((icon, size, tip) => {
                    const btn = document.createElement("button");
                    btn.getElementsByTagName = jest.fn(() => [{ src: "" }]);
                    btn.classList = { add: jest.fn(), remove: jest.fn() };
                    btn.tip = tip;
                    buttons.push(btn);
                    return btn;
                }),
                clearScreen: jest.fn(),
                getWidgetBody: jest.fn(() => widgetBody),
                getWidgetFrame: jest.fn(() => widgetFrame),
                isMaximized: jest.fn(() => false),
                clear: jest.fn(),
                show: jest.fn(),
                sendToCenter: jest.fn(),
                destroy: jest.fn(),
                _buttons: buttons
            };
            window.widgetWindows = {
                windowFor: jest.fn(() => widgetWindow)
            };
            mockActivity = {
                logo: {
                    synth: {
                        trigger: jest.fn(),
                        loadSynth: jest.fn(),
                        startRecording: jest.fn().mockResolvedValue(),
                        stopRecording: jest.fn().mockResolvedValue("recording-url"),
                        LiveWaveForm: jest.fn(),
                        playRecording: jest.fn(),
                        stopPlayBackRecording: jest.fn(),
                        startTuner: jest.fn().mockResolvedValue(),
                        stopTuner: jest.fn(),
                        getWaveFormValues: jest.fn(() => [0, 0.5, -0.5]),
                        startRecordingTimer: jest.fn()
                    }
                },
                canvas: { width: 1000, height: 800 },
                getStageScale: () => 1,
                textMsg: jest.fn()
            };
            global.activity = mockActivity;
            widget.activity = mockActivity;
            widget._updateBlocks = jest.fn();
            widget._playDelayedSample = jest.fn();
            widget.setTimbre = jest.fn();
            widget.pitchBtn = { value: "" };
            widget.frequencyDisplay = { textContent: "" };
        });

        test("toggleTuner toggles state, updates icon, and rescales", () => {
            const img = { src: "" };
            widget._tunerBtn = {
                getElementsByTagName: jest.fn(() => [img])
            };
            widget._scale = jest.fn();

            expect(widget.tunerEnabled).toBe(false);
            widget.toggleTuner();
            expect(widget.tunerEnabled).toBe(true);
            expect(img.src).toBe("header-icons/tuner-active.svg");
            expect(widget._scale).toHaveBeenCalledTimes(1);

            widget.toggleTuner();
            expect(widget.tunerEnabled).toBe(false);
            expect(img.src).toBe("header-icons/tuner.svg");
            expect(widget._scale).toHaveBeenCalledTimes(2);
        });

        test("applyCentsAdjustment sets playback rate when instrument exists", () => {
            widget.sampleName = "customsample_test";
            widget.originalSampleName = "test";
            widget.centsValue = 25;

            const playbackRate = { value: 1 };
            global.instruments[0].customsample_test = { playbackRate };
            global.TunerUtils.calculatePlaybackRate.mockReturnValue(1.5);

            widget.applyCentsAdjustment();

            expect(global.TunerUtils.calculatePlaybackRate).toHaveBeenCalledWith(0, 25);
            expect(playbackRate.value).toBe(1.5);
        });

        test("stopPitchDetection releases audio resources", async () => {
            const trackStop = jest.fn();
            const close = jest.fn().mockResolvedValue();
            widget.pitchDetectionAnimationId = 101;
            widget.pitchDetectionStream = { getTracks: () => [{ stop: trackStop }] };
            widget.pitchDetectionAudioContext = { close };
            widget.isPitchDetectionRunning = true;

            widget.stopPitchDetection();

            expect(global.cancelAnimationFrame).toHaveBeenCalledWith(101);
            expect(trackStop).toHaveBeenCalled();
            expect(close).toHaveBeenCalled();
            expect(widget.pitchDetectionAnimationId).toBeNull();
            expect(widget.pitchDetectionStream).toBeNull();
            expect(widget.pitchDetectionAudioContext).toBeNull();
            expect(widget.isPitchDetectionRunning).toBe(false);
        });

        test("applyCentAdjustment updates playbackRate and restarts when playing", () => {
            jest.useFakeTimers();
            const playbackRate = { value: 1 };
            widget.sampleName = "customsample_test";
            widget.originalSampleName = "test";
            global.instruments[0].customsample_test = { playbackRate };
            widget.isMoving = true;
            widget.pause = jest.fn();
            widget._playReferencePitch = jest.fn();

            widget.applyCentAdjustment(120);

            expect(widget.centAdjustmentValue).toBe(120);
            expect(playbackRate.value).toBeCloseTo(Math.pow(2, 120 / 1200), 6);
            expect(widget.pause).toHaveBeenCalled();

            jest.runOnlyPendingTimers();
            expect(widget._playReferencePitch).toHaveBeenCalled();
            jest.useRealTimers();
        });

        test("_parseSamplePitch sets pitch, accidental, and octave centers", () => {
            widget.samplePitch = "re#";
            widget.sampleOctave = "3";
            widget._parseSamplePitch();
            expect(widget.pitchCenter).toBe(1);
            expect(widget.accidentalCenter).toBe(3);
            expect(widget.octaveCenter).toBe("3");

            widget.samplePitch = "sobb";
            widget.sampleOctave = "5";
            widget._parseSamplePitch();
            expect(widget.pitchCenter).toBe(4);
            expect(widget.accidentalCenter).toBe(1);
            expect(widget.octaveCenter).toBe("5");
        });

        test("_calculateFrequency uses pitch centers to compute frequency", () => {
            widget.pitchCenter = 5; // A
            widget.accidentalCenter = 2; // natural
            widget.octaveCenter = 4;

            expect(widget._calculateFrequency()).toBe(440);
        });

        test("_calculateFrequency accounts for accidentals", () => {
            widget.pitchCenter = 5; // A
            widget.octaveCenter = 4;
            widget.accidentalCenter = 3; // sharp
            expect(widget._calculateFrequency()).toBe(466);
            widget.accidentalCenter = 1; // flat
            expect(widget._calculateFrequency()).toBe(415);
        });

        test("_updateSamplePitchValues builds sample pitch and octave", () => {
            widget.pitchCenter = 3; // fa
            widget.accidentalCenter = 4; // sharp
            widget.octaveCenter = 6;

            widget._updateSamplePitchValues();
            expect(widget.samplePitch).toBe("fax");
            expect(widget.sampleOctave).toBe("6");
        });

        test("getPitchName updates pitch name and frequency display", () => {
            widget.pitchCenter = 5; // A
            widget.accidentalCenter = 2;
            widget.octaveCenter = 4;

            const name = widget.getPitchName();
            expect(name).toBe("A4");
            expect(widget.pitchBtn.value).toBe("A4");
            expect(widget.frequencyDisplay.textContent).toBe("440 Hz");
        });

        test("_playReferencePitch triggers reference synth and schedules sample", () => {
            widget.pitchCenter = 5;
            widget.accidentalCenter = 2;
            widget.octaveCenter = 4;

            widget._playReferencePitch();

            expect(widget._updateBlocks).toHaveBeenCalled();
            expect(mockActivity.logo.synth.trigger).toHaveBeenCalledWith(
                0,
                [440],
                0.5,
                "electronic synth",
                null,
                null,
                false
            );
            expect(widget.setTimbre).toHaveBeenCalled();
            expect(widget._playDelayedSample).toHaveBeenCalled();
        });

        test("_playSample loads synth, computes cent-adjusted frequency, and triggers playback", () => {
            widget.sampleName = "customsample_test";
            widget.originalSampleName = "test";
            widget.sampleLength = 1200;
            widget.centAdjustmentValue = 120;
            widget.reconnectSynthsToAnalyser = jest.fn();

            const instrument = { connect: jest.fn() };
            global.instruments[0] = {};
            global.TunerUtils.frequencyToPitch.mockReturnValue({ note: "A4", cents: 0 });

            mockActivity.logo.synth.loadSynth.mockImplementation(() => {
                global.instruments[0].customsample_test = instrument;
            });

            widget._playSample();

            expect(widget.reconnectSynthsToAnalyser).toHaveBeenCalled();
            expect(global.TunerUtils.frequencyToPitch).toHaveBeenCalled();
            expect(mockActivity.logo.synth.loadSynth).toHaveBeenCalledWith(0, "customsample_test");
            const expectedFrequency = 220 * Math.pow(2, 120 / 1200);
            expect(mockActivity.logo.synth.trigger).toHaveBeenCalledWith(
                0,
                [expectedFrequency],
                1.2,
                "customsample_test",
                null,
                null,
                false
            );
        });

        test("_playSample reuses existing instrument without loadSynth", () => {
            widget.sampleName = "customsample_test";
            widget.originalSampleName = "test";
            widget.sampleLength = 1000;
            widget.reconnectSynthsToAnalyser = jest.fn();
            global.instruments[0] = { customsample_test: { connect: jest.fn() } };
            global.TunerUtils.frequencyToPitch.mockReturnValue({ note: "A4", cents: 0 });

            widget._playSample();

            expect(mockActivity.logo.synth.loadSynth).not.toHaveBeenCalled();
            expect(mockActivity.logo.synth.trigger).toHaveBeenCalled();
        });

        test("applyCentAdjustment logs when instrument missing", () => {
            const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
            widget.sampleName = "customsample_test";
            widget.originalSampleName = "test";
            widget.isMoving = false;

            widget.applyCentAdjustment(100);

            expect(logSpy).toHaveBeenCalled();
            logSpy.mockRestore();
        });

        test("reconnectSynthsToAnalyser sets up analysers and connects instruments", () => {
            widget.originalSampleName = "test";
            global.instruments[0] = {
                "electronic synth": { connect: jest.fn() },
                "customsample_test": { connect: jest.fn() }
            };

            widget.reconnectSynthsToAnalyser();

            expect(global.Tone.Analyser).toHaveBeenCalledTimes(2);
            expect(global.instruments[0]["electronic synth"].connect).toHaveBeenCalled();
            expect(global.instruments[0].customsample_test.connect).toHaveBeenCalled();
        });

        test("_updateBlocks updates related blocks and appends cent text", () => {
            widget._updateBlocks = realUpdateBlocks;
            widget.timbreBlock = 0;
            widget.sampleName = "sample";
            widget.sampleData = "data";
            widget.samplePitch = "la";
            widget.sampleOctave = "4";
            widget.centAdjustmentValue = 10;
            const mainSampleBlock = {
                value: null,
                updateCache: jest.fn(),
                connections: [null, 2, 3, 4],
                text: { text: "Sample" }
            };
            const audiofileBlock = { value: null, updateCache: jest.fn(), text: { text: "" } };
            const solfegeBlock = { value: null, updateCache: jest.fn(), text: { text: "" } };
            const octaveBlock = { value: null, updateCache: jest.fn(), text: { text: "" } };
            widget.activity = {
                blocks: {
                    blockList: [
                        { connections: [null, 1] },
                        mainSampleBlock,
                        audiofileBlock,
                        solfegeBlock,
                        octaveBlock
                    ]
                },
                refreshCanvas: jest.fn(),
                saveLocally: jest.fn()
            };

            widget._updateBlocks();

            expect(mainSampleBlock.value).toEqual(["sample", "data", "la", "4", 10]);
            expect(audiofileBlock.value).toEqual(["sample", "data"]);
            expect(solfegeBlock.value).toBe("la");
            expect(octaveBlock.value).toBe("4");
            expect(mainSampleBlock.text.text).toContain("10¢");
            expect(widget.activity.refreshCanvas).toHaveBeenCalled();
            expect(widget.activity.saveLocally).toHaveBeenCalled();
        });

        test("setTimbre triggers Singer.ToneActions.setTimbre", () => {
            widget.setTimbre = realSetTimbre;
            widget.sampleName = "name";
            widget.sampleData = "data";
            widget.timbreBlock = 3;

            widget.setTimbre();

            expect(global.Singer.ToneActions.setTimbre).toHaveBeenCalledWith(
                ["name_original", "data", "la", 4],
                0,
                3
            );
        });

        test("pause and resume update play state", () => {
            widget.playBtn = document.createElement("button");
            widget.pause();
            expect(widget.isMoving).toBe(false);

            widget.resume();
            expect(widget.isMoving).toBe(true);
        });

        test("_usePitch/_useAccidental/_useOctave update centers", () => {
            widget._usePitch("mi");
            widget._useAccidental(global.SHARP);
            widget._useOctave("5");

            expect(widget.pitchCenter).toBe(2);
            expect(widget.accidentalCenter).toBe(3);
            expect(widget.octaveCenter).toBe(5);
        });

        test("getSampleLength and showSampleTypeError notify activity", () => {
            widget.activity = { errorMsg: jest.fn() };
            widget.sampleData = "x".repeat(1333334);
            widget.getSampleLength();
            expect(widget.activity.errorMsg).toHaveBeenCalled();

            widget.showSampleTypeError();
            expect(widget.activity.errorMsg).toHaveBeenCalledTimes(2);
        });

        test("__save and _saveSample generate blocks with cent adjustment", () => {
            jest.useFakeTimers();
            widget.activity = {
                blocks: { loadNewBlocks: jest.fn() }
            };
            global.activity = { textMsg: jest.fn() };
            widget.sampleName = "sample";
            widget.sampleData = "data";
            widget.samplePitch = "la";
            widget.sampleOctave = "4";
            widget.centAdjustmentValue = 7;
            widget._addSample = jest.fn();

            widget.__save();
            jest.advanceTimersByTime(1000);

            expect(widget._addSample).toHaveBeenCalled();
            expect(widget.activity.blocks.loadNewBlocks).toHaveBeenCalled();
            expect(global.activity.textMsg).toHaveBeenCalled();

            const saveSpy = jest.spyOn(widget, "__save");
            widget._saveSample();
            expect(saveSpy).toHaveBeenCalled();
            jest.useRealTimers();
        });

        test("_get_save_lock reflects state", () => {
            widget._save_lock = true;
            expect(widget._get_save_lock()).toBe(true);
            widget._save_lock = false;
            expect(widget._get_save_lock()).toBe(false);
        });

        test("_playDelayedSample and _endPlaying await helpers", async () => {
            widget._playDelayedSample = realPlayDelayedSample;
            widget._endPlaying = realEndPlaying;
            widget._waitAndPlaySample = jest.fn().mockResolvedValue("played");
            widget._waitAndEndPlaying = jest.fn().mockResolvedValue("ended");

            await widget._playDelayedSample();
            await widget._endPlaying();

            expect(widget._waitAndPlaySample).toHaveBeenCalled();
            expect(widget._waitAndEndPlaying).toHaveBeenCalled();
        });

        test("_waitAndPlaySample plays then ends after delay", async () => {
            jest.useFakeTimers();
            widget._playSample = jest.fn();
            widget._endPlaying = jest.fn();

            const promise = widget._waitAndPlaySample();
            jest.advanceTimersByTime(500);
            await promise;

            expect(widget._playSample).toHaveBeenCalled();
            expect(widget._endPlaying).toHaveBeenCalled();
            jest.useRealTimers();
        });

        test("_waitAndEndPlaying pauses after sample length", async () => {
            jest.useFakeTimers();
            widget.pause = jest.fn();
            widget.sampleLength = 250;

            const promise = widget._waitAndEndPlaying();
            jest.advanceTimersByTime(250);
            await promise;

            expect(widget.pause).toHaveBeenCalled();
            jest.useRealTimers();
        });

        test("_scale resizes and redraws canvas", () => {
            const canvas = document.createElement("canvas");
            canvas.className = "samplerCanvas";
            widgetWindow.getWidgetBody().appendChild(canvas);
            widget.widgetWindow = widgetWindow;
            widget.makeCanvas = jest.fn();
            widget.reconnectSynthsToAnalyser = jest.fn();

            widget._scale();

            expect(widget.makeCanvas).toHaveBeenCalledWith(800, 400, 0, true);
            expect(widget.reconnectSynthsToAnalyser).toHaveBeenCalled();
        });

        test("_scale uses maximized dimensions", () => {
            const canvas = document.createElement("canvas");
            canvas.className = "samplerCanvas";
            widgetWindow.getWidgetBody().appendChild(canvas);
            widget.widgetWindow = widgetWindow;
            widgetWindow.isMaximized.mockReturnValue(true);
            widget.makeCanvas = jest.fn();
            widget.reconnectSynthsToAnalyser = jest.fn();

            widget._scale();

            expect(widget.makeCanvas).toHaveBeenCalledWith(800, 430, 0, true);
        });

        test("drag_and_drop wires drop handler to call handleFiles", () => {
            const samplerCanvas = document.createElement("canvas");
            samplerCanvas.className = "samplerCanvas";
            const dropHandlers = {};
            samplerCanvas.addEventListener = jest.fn((evt, handler) => {
                dropHandlers[evt] = handler;
            });
            widgetWindow.getWidgetBody().appendChild(samplerCanvas);
            widget.handleFiles = jest.fn();

            widget.drag_and_drop();

            const dropEvent = {
                preventDefault: jest.fn(),
                dataTransfer: { files: ["file"] }
            };
            dropHandlers.drop(dropEvent);
            expect(widget.handleFiles).toHaveBeenCalledWith("file");
        });

        test("_addSample updates or inserts custom samples", () => {
            widget.sampleName = "sample1";
            widget.sampleData = "data1";
            widget.samplePitch = "la";
            widget.sampleOctave = "4";
            widget.centAdjustmentValue = 5;
            widget._addSample();
            expect(global.CUSTOMSAMPLES).toHaveLength(1);
            expect(global.CUSTOMSAMPLES[0][0]).toBe("sample1");

            widget.sampleData = "data2";
            widget._addSample();
            expect(global.CUSTOMSAMPLES).toHaveLength(1);
            expect(global.CUSTOMSAMPLES[0][1]).toBe("data2");
        });

        test("init wires up buttons and handlers", async () => {
            const addSpy = jest.spyOn(HTMLCanvasElement.prototype, "addEventListener");
            const samplerCanvas = document.createElement("canvas");
            samplerCanvas.className = "samplerCanvas";
            widgetWindow.getWidgetBody().appendChild(samplerCanvas);

            const fileChooser = docById("myOpenAll");
            Object.defineProperty(fileChooser, "files", {
                value: [{ name: "sample.wav" }]
            });
            fileChooser.addEventListener = jest.fn((_, cb) => cb({}));
            fileChooser.removeEventListener = jest.fn();
            fileChooser.focus = jest.fn();
            fileChooser.click = jest.fn();
            window.scroll = jest.fn();

            widget.handleFiles = jest.fn();
            widget.resume = jest.fn();
            widget.pause = jest.fn();
            widget._playReferencePitch = jest.fn();

            widget.init(mockActivity, 1);

            widget.sampleName = "test";
            widget.playBtn.onclick();
            expect(widget.resume).toHaveBeenCalled();
            expect(widget._playReferencePitch).toHaveBeenCalled();

            await widget._recordBtn.onclick();
            expect(widget.is_recording).toBe(true);
            await widget._recordBtn.onclick();
            expect(widget.is_recording).toBe(false);

            widget.recordingURL = "recording-url";
            widget._addSample = jest.fn();
            widget._playbackBtn.onclick();
            expect(widget._addSample).toHaveBeenCalled();
            widget._playbackBtn.onclick();
            expect(mockActivity.logo.synth.stopPlayBackRecording).toHaveBeenCalled();

            await widget._tunerBtn.onclick();
            await widget._tunerBtn.onclick();

            widget.centsSliderBtn.onclick();
            const slider = docById("centAdjustmentContainer").querySelector("input[type=range]");
            slider.value = "10";
            slider.oninput();
            widget.centsSliderBtn.onclick();

            expect(addSpy).toHaveBeenCalled();
            addSpy.mockRestore();
        });

        test("init save button debounces and onclose cleans up", () => {
            widget.init(mockActivity, 1);
            const saveButton = widgetWindow._buttons.find(btn => btn.tip === "Save sample");
            widget._saveSample = jest.fn();
            jest.useFakeTimers();

            saveButton.onclick();
            saveButton.onclick();
            jest.advanceTimersByTime(1000);

            expect(widget._saveSample).toHaveBeenCalledTimes(1);

            widget._scale = jest.fn();
            widget._updateContainerPositions = jest.fn();
            widgetWindow.onmaximize();
            widgetWindow.onrestore();
            expect(widget._scale).toHaveBeenCalledTimes(2);
            expect(widget._updateContainerPositions).toHaveBeenCalledTimes(2);

            widget._pitchWheel = { removeWheel: jest.fn() };
            widget._exitWheel = { removeWheel: jest.fn() };
            widget._accidentalsWheel = { removeWheel: jest.fn() };
            widget._octavesWheel = { removeWheel: jest.fn() };
            widget.stopPitchDetection = jest.fn();
            widget.drawVisualIDs = { 1: 11 };
            const wheelDiv = docById("wheelDiv");
            wheelDiv.style.display = "block";
            const wheelDivptm = docById("wheelDivptm");
            wheelDivptm.style.display = "block";

            widgetWindow.onclose();
            expect(widget.stopPitchDetection).toHaveBeenCalled();
            expect(widgetWindow.destroy).toHaveBeenCalled();
            jest.useRealTimers();
        });

        test("prompt UI handles submit, preview, and save", async () => {
            widget.init(mockActivity, 1);
            widget._promptBtn.onclick();

            const container = docById("samplerPrompt");
            const textArea = container.querySelector("textarea");
            const buttons = Array.from(container.querySelectorAll("button"));
            const submit = buttons.find(btn => btn.innerHTML === "Submit");
            const preview = buttons.find(btn => btn.innerHTML === "Preview");
            const save = buttons.find(btn => btn.innerHTML === "Save");

            textArea.value = "hello";
            textArea.dispatchEvent(new Event("input"));
            expect(submit.disabled).toBe(false);

            global.fetch = jest.fn().mockResolvedValue({
                json: jest.fn().mockResolvedValue({ status: "success" })
            });
            jest.useFakeTimers();
            await submit.onclick();
            jest.runOnlyPendingTimers();

            preview.disabled = false;
            save.disabled = false;
            const playSpy = jest.fn();
            global.Audio = class {
                constructor() {
                    this.play = playSpy;
                }
            };
            preview.onclick();
            expect(playSpy).toHaveBeenCalled();

            const clickSpy = jest
                .spyOn(HTMLAnchorElement.prototype, "click")
                .mockImplementation(() => {});
            save.onclick();
            expect(clickSpy).toHaveBeenCalled();
            clickSpy.mockRestore();
            jest.useRealTimers();
        });

        test("prompt submit handles failure and errors", async () => {
            widget.init(mockActivity, 1);
            widget._promptBtn.onclick();

            const container = docById("samplerPrompt");
            const textArea = container.querySelector("textarea");
            const submit = Array.from(container.querySelectorAll("button")).find(
                btn => btn.innerHTML === "Submit"
            );

            textArea.value = "fail";
            global.fetch = jest.fn().mockResolvedValue({
                json: jest.fn().mockResolvedValue({ status: "fail" })
            });
            await submit.onclick();

            global.fetch = jest.fn().mockRejectedValue(new Error("boom"));
            await submit.onclick();
        });

        test("_updateContainerPositions updates layouts for maximized and normal", () => {
            widget.init(mockActivity, 1);
            const tunerContainer = document.createElement("div");
            tunerContainer.id = "tunerContainer";
            document.body.appendChild(tunerContainer);
            const valueDisplay = document.createElement("div");
            valueDisplay.id = "centValueDisplay";
            document.body.appendChild(valueDisplay);

            widget.widgetWindow.isMaximized.mockReturnValue(true);
            widget._updateContainerPositions();
            expect(tunerContainer.style.marginTop).toBe("150px");
            expect(valueDisplay.style.marginTop).toBe("50px");

            widget.widgetWindow.isMaximized.mockReturnValue(false);
            widget._updateContainerPositions();
            expect(tunerContainer.style.marginTop).toBe("100px");
            expect(valueDisplay.style.marginTop).toBe("30px");
        });

        test("_createPieMenu builds wheels and positions menu", () => {
            widget.init(mockActivity, 1);
            widget.pitchBtn.getBoundingClientRect = () => ({ x: 10, y: 20 });

            widget._createPieMenu();

            expect(docById("wheelDivptm").style.display).toBe("");
            expect(widget._pitchWheel.createWheel).toBeDefined();
            expect(widget._accidentalsWheel.setTooltips).toHaveBeenCalled();
        });

        test("_createPieMenu selection and exit handlers update pitch and close", () => {
            widget.init(mockActivity, 1);
            widget.pitchBtn.getBoundingClientRect = () => ({ x: 10, y: 20 });
            widget._playReferencePitch = jest.fn();
            widget._createPieMenu();

            widget._pitchWheel.selectedNavItemIndex = 0;
            widget._accidentalsWheel.selectedNavItemIndex = 1;
            widget._octavesWheel.selectedNavItemIndex = 2;
            widget._pitchWheel.navItems[0].title = "do";
            widget._accidentalsWheel.navItems[1].title = global.SHARP;
            widget._octavesWheel.navItems[2].title = "4";

            widget._pitchWheel.navItems[0].navigateFunction();
            expect(widget._playReferencePitch).toHaveBeenCalled();

            widget._exitWheel.navItems[0].navigateFunction();
            expect(docById("wheelDivptm").style.display).toBe("none");
        });

        test("tuner toggle handles maximized mode and mode toggle clicks", async () => {
            widget.init(mockActivity, 1);
            widget.widgetWindow.isMaximized.mockReturnValue(true);
            const tunerContainer = document.createElement("div");
            tunerContainer.id = "tunerContainer";
            document.body.appendChild(tunerContainer);

            await widget._tunerBtn.onclick();
            const toggle = docById("modeToggle");
            const buttons = Array.from(toggle.querySelectorAll("div"));
            buttons[0].onclick();
            buttons[1].onclick();
        });

        test("makeCanvas draws waveform and updates tuner when enabled", () => {
            widget.widgetWindow = widgetWindow;
            widget.tunerEnabled = true;
            widget.pitchCenter = 5;
            widget.accidentalCenter = 2;
            widget.octaveCenter = 4;
            widget.centsValue = 0;
            widget.sampleName = "sample";
            widget.drawVisualIDs = {};
            widget.is_recording = true;
            widget.running = true;
            widget.pitchAnalysers = {
                0: { getValue: jest.fn(() => [0, 0.5, -0.5]) },
                1: { getValue: jest.fn(() => [0, 0.5, -0.5]) }
            };
            global.TunerUtils.frequencyToPitch.mockReturnValue(["A4", 0]);
            global.detectPitch = jest.fn(() => 440);
            document.querySelectorAll = jest.fn(() => [
                { setAttribute: jest.fn() },
                { setAttribute: jest.fn() }
            ]);

            widget.makeCanvas(400, 300, 0, true);

            expect(widget.tunerDisplay).toBeTruthy();
            expect(widget.tunerDisplay.update).toHaveBeenCalled();
        });

        test("makeCanvas removes tuner canvas when disabled", () => {
            widget.widgetWindow = widgetWindow;
            widget.tunerEnabled = false;
            widget.drawVisualIDs = {};
            const tunerCanvas = document.createElement("canvas");
            tunerCanvas.className = "tunerCanvas";
            widget.widgetWindow.getWidgetBody().appendChild(tunerCanvas);
            widget.tunerDisplay = { canvas: tunerCanvas };

            widget.makeCanvas(400, 300, 0, false);

            expect(widget.tunerDisplay).toBeNull();
        });

        test("makeCanvas updates existing tuner display and draws non-recording path", () => {
            widget.widgetWindow = widgetWindow;
            widget.tunerEnabled = true;
            widget.drawVisualIDs = {};
            widget.running = true;
            widget.pitchAnalysers = {
                0: { getValue: jest.fn(() => [0.1, -0.1]) },
                1: { getValue: jest.fn(() => [0.2, -0.2]) }
            };
            widget.tunerDisplay = new global.TunerDisplay(
                document.createElement("canvas"),
                100,
                100
            );
            global.TunerUtils.frequencyToPitch.mockReturnValue(["A4", 0]);
            global.detectPitch = jest.fn(() => 440);
            document.querySelectorAll = jest.fn(() => [{ setAttribute: jest.fn() }]);

            widget.makeCanvas(400, 300, 0, true);
            expect(widget.tunerDisplay.canvas).toBeTruthy();
        });

        test("makeTuner builds UI and triggers pitch detection", async () => {
            widget.widgetWindow = widgetWindow;
            const audioContext = {
                sampleRate: 44100,
                createMediaStreamSource: jest.fn(() => ({ connect: jest.fn() })),
                createAnalyser: jest.fn(() => ({
                    fftSize: 0,
                    getFloatTimeDomainData: jest.fn()
                })),
                close: jest.fn().mockResolvedValue()
            };
            global.AudioContext = jest.fn(() => audioContext);
            const stream = { getTracks: jest.fn(() => [{ stop: jest.fn() }]) };
            Object.defineProperty(window, "navigator", {
                value: {
                    mediaDevices: {
                        getUserMedia: jest.fn().mockResolvedValue(stream)
                    }
                },
                configurable: true
            });

            let rafCalls = 0;
            global.requestAnimationFrame = jest.fn(cb => {
                rafCalls += 1;
                if (rafCalls === 1) cb();
                return rafCalls;
            });

            widget.makeTuner(400, 300);

            const startButton = document.getElementById("start");
            startButton.click();

            await Promise.resolve();
            expect(window.navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
        });

        test("startPitchDetection handles getUserMedia failure", async () => {
            widget.widgetWindow = widgetWindow;
            const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
            global.AudioContext = jest.fn(() => ({
                sampleRate: 44100,
                createMediaStreamSource: jest.fn(() => ({ connect: jest.fn() })),
                createAnalyser: jest.fn(() => ({
                    fftSize: 0,
                    getFloatTimeDomainData: jest.fn()
                })),
                close: jest.fn().mockResolvedValue()
            }));
            Object.defineProperty(window, "navigator", {
                value: {
                    mediaDevices: {
                        getUserMedia: jest.fn().mockRejectedValue(new Error("no mic"))
                    }
                },
                configurable: true
            });
            global.alert = jest.fn();

            widget.makeTuner(400, 300);
            const startButton = document.getElementById("start");
            startButton.click();

            await Promise.resolve();
            expect(global.alert).toHaveBeenCalled();
            errorSpy.mockRestore();
        });
    });
});
