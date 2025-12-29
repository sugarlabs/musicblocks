/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Justin Charles
 *
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

const setupToneActions = require("../ToneActions");

describe("setupToneActions", () => {
    let activity;
    let targetTurtle;
    let listenerCallbacks = {};

    beforeAll(() => {
        global.Singer = {
            ToneActions: {}
        };
        global.instrumentsEffects = {
            0: {
                "default-voice": {
                    vibratoActive: false,
                    vibratoIntensity: [],
                    vibratoFrequency: 0
                }
            }
        };
        global.VOICENAMES = {
            Piano: ["piano", "grand-piano"],
            Violin: ["violin", "acoustic-violin"]
        };
        global.CUSTOMSAMPLES = {};
        global.DEFAULTVOICE = "default-voice";
        global.last = array => array[array.length - 1];
        global._ = msg => msg;
        global.NOINPUTERRORMSG = "Missing input";
        global.MusicBlocks = { isRun: true };
        global.Mouse = {
            getMouseFromTurtle: _tur => {
                return _tur ? { MB: { listeners: [] } } : null;
            }
        };
    });

    beforeEach(() => {
        listenerCallbacks = {};

        global.VOICENAMES = {
            Piano: ["piano", "grand-piano"],
            Violin: ["violin", "acoustic-violin"]
        };

        const sharedMouse = { MB: { listeners: [] } };
        global.Mouse.getMouseFromTurtle = jest.fn(_tur => sharedMouse);

        activity = {
            turtles: {
                ithTurtle: () => targetTurtle
            },
            blocks: {
                blockList: { 1: {}, 2: {} }
            },
            logo: {
                setDispatchBlock: jest.fn(_name => {}),
                setTurtleListener: jest.fn((_, _name, callback) => {
                    listenerCallbacks[_name] = callback;
                }),
                synth: {
                    loadSynth: jest.fn(),
                    createSynth: jest.fn()
                },
                phraseMaker: {
                    _instrumentName: null
                },
                notation: {
                    notationSwing: jest.fn(),
                    notationVoices: jest.fn(),
                    notationBeginHarmonics: jest.fn(),
                    notationEndHarmonics: jest.fn()
                },
                timbre: {
                    instrumentName: "default-voice",
                    FMSynthParams: [],
                    AMSynthParams: [],
                    duoSynthParams: [],
                    osc: [],
                    fmSynthParamvals: {},
                    amSynthParamvals: {},
                    duoSynthParamVals: {},
                    FMSynthesizer: [],
                    AMSynthesizer: [],
                    duoSynthesizer: [],
                    vibratoEffect: [],
                    vibratoParams: []
                },
                inTimbre: true,
                stopTurtle: false,
                inMatrix: false
            },
            errorMsg: jest.fn()
        };

        targetTurtle = {
            singer: {
                instrumentNames: [],
                synthVolume: { "default-voice": [1] },
                crescendoInitialVolume: { "default-voice": [1] },
                vibratoIntensity: [],
                vibratoRate: [],
                chorusRate: [],
                delayTime: [],
                chorusDepth: [],
                rate: [],
                octaves: [],
                baseFrequency: [],
                tremoloFrequency: [],
                tremoloDepth: [],
                distortionAmount: [],
                inHarmonic: [],
                partials: []
            },
            inSetTimbre: false
        };

        global.instrumentsEffects = {
            0: {
                "default-voice": {
                    vibratoActive: false,
                    vibratoIntensity: [],
                    vibratoFrequency: []
                }
            }
        };

        setupToneActions(activity);
    });

    describe("setTimbre", () => {
        it("should set timbre correctly for known voice", () => {
            Singer.ToneActions.setTimbre("piano", 0, 1);
            expect(targetTurtle.singer.instrumentNames).toContain("grand-piano");
            expect(activity.logo.synth.loadSynth).toHaveBeenCalledWith(0, "grand-piano");

            if (listenerCallbacks["_settimbre_0"]) {
                listenerCallbacks["_settimbre_0"]();
                expect(targetTurtle.inSetTimbre).toBe(false);
                expect(targetTurtle.singer.instrumentNames.length).toBe(0);
            }
        });

        it("should handle direct synth name", () => {
            Singer.ToneActions.setTimbre("grand-piano", 0, 1);
            expect(targetTurtle.singer.instrumentNames).toContain("grand-piano");
        });

        it("should handle custom sample timbres correctly", () => {
            const customSample = ["custom1", "sample1", "sample2", "sample3"];
            Singer.ToneActions.setTimbre(customSample, 0, 1);
            expect(global.CUSTOMSAMPLES["customsample_custom1"]).toEqual([
                "sample1",
                "sample2",
                "sample3"
            ]);
            expect(targetTurtle.singer.instrumentNames).toContain("customsample_custom1");
        });

        it("should handle empty custom sample name", () => {
            const customSample = ["", "sample1", "sample2", "sample3"];
            Singer.ToneActions.setTimbre(customSample, 0, 1);
            expect(targetTurtle.singer.instrumentNames).toContain("default-voice");
        });

        it("should use default voice when synth is undefined", () => {
            Singer.ToneActions.setTimbre("unknown-instrument", 0, 1);
            expect(targetTurtle.singer.instrumentNames).toContain("unknown-instrument");
        });

        it("should handle non-object non-accounted instrument", () => {
            delete global.VOICENAMES.Piano;
            Singer.ToneActions.setTimbre("piano", 0, 1);
            expect(targetTurtle.singer.instrumentNames).toContain("piano");
        });

        it("should set instrument name in phraseMaker when in matrix", () => {
            activity.logo.inMatrix = true;
            Singer.ToneActions.setTimbre("piano", 0, 1);
            const synthName = global.VOICENAMES.Piano[1];
            expect(activity.logo.phraseMaker._instrumentName).toBe(synthName);
        });

        it("should initialize synthVolume when undefined", () => {
            targetTurtle.singer.instrumentNames = [];

            const synthName = global.VOICENAMES.Piano[1];
            delete targetTurtle.singer.synthVolume[synthName];
            delete targetTurtle.singer.crescendoInitialVolume[synthName];

            Singer.ToneActions.setTimbre("piano", 0, 1);

            expect(targetTurtle.singer.synthVolume[synthName]).toBeDefined();
            expect(targetTurtle.singer.synthVolume[synthName]).toEqual([1]);
            expect(targetTurtle.singer.crescendoInitialVolume[synthName]).toEqual([1]);
        });

        it("should fallback to default-voice when instrument is undefined", () => {
            Singer.ToneActions.setTimbre(undefined, 0, 1);
            expect(targetTurtle.singer.instrumentNames).toContain("default-voice");
        });

        it("should NOT register a mouse listener when blk is undefined", () => {
            MusicBlocks.isRun = false;
            const mouse = Mouse.getMouseFromTurtle(targetTurtle);
            mouse.MB.listeners = [];
            Singer.ToneActions.setTimbre("piano", 0);
            expect(mouse.MB.listeners).not.toContain("_settimbre_0");
            MusicBlocks.isRun = true;
        });

        it("should register a mouse listener when blk is undefined and running", () => {
            const mouse = Mouse.getMouseFromTurtle(targetTurtle);
            mouse.MB.listeners = [];
            Singer.ToneActions.setTimbre("piano", 0);
            expect(mouse.MB.listeners).toContain("_settimbre_0");
            listenerCallbacks["_settimbre_0"]();
            expect(targetTurtle.inSetTimbre).toBe(false);
        });
    });

    describe("doVibrato", () => {
        it("should apply vibrato correctly with valid parameters", () => {
            const intensity = 50;
            const rate = 10;
            const blk = 1;

            Singer.ToneActions.doVibrato(intensity, rate, 0, blk);

            expect(targetTurtle.singer.vibratoIntensity).toContain(intensity / 100);
            expect(targetTurtle.singer.vibratoRate).toContain(1 / rate);
            expect(activity.logo.timbre.vibratoEffect).toContain(blk);
            expect(activity.logo.timbre.vibratoParams).toContain(intensity);
            expect(global.instrumentsEffects[0]["default-voice"].vibratoActive).toBe(true);

            if (listenerCallbacks["_vibrato_0"]) {
                listenerCallbacks["_vibrato_0"]();
                expect(targetTurtle.singer.vibratoIntensity.length).toBe(0);
                expect(targetTurtle.singer.vibratoRate.length).toBe(0);
            }
        });

        it("should show error for invalid vibrato intensity", () => {
            Singer.ToneActions.doVibrato(150, 5, 0, 1);
            expect(activity.errorMsg).toHaveBeenCalledWith(
                "Vibrato intensity must be between 1 and 100.",
                1
            );
            expect(activity.logo.stopTurtle).toBe(true);
        });

        it("should show error for invalid vibrato rate", () => {
            Singer.ToneActions.doVibrato(50, 0, 0, 1);
            expect(activity.errorMsg).toHaveBeenCalledWith(
                "Vibrato rate must be greater than 0.",
                1
            );
            expect(activity.logo.stopTurtle).toBe(true);
        });

        it("should use last vibrato intensity in timbre mode", () => {
            activity.logo.inTimbre = true;

            Singer.ToneActions.doVibrato(50, 10, 0, 1);

            expect(global.instrumentsEffects[0]["default-voice"].vibratoActive).toBe(true);
            expect(activity.logo.timbre.vibratoParams).toContain(50);
            expect(activity.logo.timbre.vibratoParams).toContain(0.1);
            expect(global.instrumentsEffects[0]["default-voice"].vibratoFrequency).toBe(10);
        });

        it("should skip timbre‑mode params when not in timbre", () => {
            activity.logo.inTimbre = false;
            Singer.ToneActions.doVibrato(50, 5, 0, 1);
            expect(activity.logo.timbre.vibratoEffect).toHaveLength(0);
        });

        it("should NOT register a mouse listener when blk is undefined", () => {
            MusicBlocks.isRun = false;
            const mouse = Mouse.getMouseFromTurtle(targetTurtle);
            mouse.MB.listeners = [];
            Singer.ToneActions.doVibrato(50, 5, 0);
            expect(mouse.MB.listeners).not.toContain("_vibrato_0");
            MusicBlocks.isRun = true;
        });

        it("should register a mouse listener when blk is undefined and running", () => {
            const mouse = Mouse.getMouseFromTurtle(targetTurtle);
            mouse.MB.listeners = [];
            Singer.ToneActions.doVibrato(50, 5, 0);
            expect(mouse.MB.listeners).toContain("_vibrato_0");
            listenerCallbacks["_vibrato_0"]();
            expect(targetTurtle.singer.vibratoIntensity.length).toBe(0);
        });
    });

    describe("doChorus", () => {
        it("should apply chorus effect correctly with valid parameters", () => {
            Singer.ToneActions.doChorus(1.5, 20, 50, 0, 1);
            expect(targetTurtle.singer.chorusRate).toContain(1.5);
            expect(targetTurtle.singer.delayTime).toContain(20);
            expect(targetTurtle.singer.chorusDepth).toContain(0.5);

            if (listenerCallbacks["_chorus_0"]) {
                listenerCallbacks["_chorus_0"]();
                expect(targetTurtle.singer.chorusRate.length).toBe(0);
                expect(targetTurtle.singer.delayTime.length).toBe(0);
                expect(targetTurtle.singer.chorusDepth.length).toBe(0);
            }
        });

        it("should show error for invalid chorus depth", () => {
            Singer.ToneActions.doChorus(1.5, 20, 150, 0, 1);
            expect(activity.errorMsg).toHaveBeenCalledWith("Depth is out of range.", 1);
            expect(activity.logo.stopTurtle).toBe(true);
        });

        it("should show error for negative chorus depth", () => {
            Singer.ToneActions.doChorus(1.5, 20, -10, 0, 1);
            expect(activity.errorMsg).toHaveBeenCalledWith("Depth is out of range.", 1);
            expect(activity.logo.stopTurtle).toBe(true);
        });

        it("should NOT register a mouse listener when blk is undefined", () => {
            MusicBlocks.isRun = false;
            const mouse = Mouse.getMouseFromTurtle(targetTurtle);
            mouse.MB.listeners = [];
            Singer.ToneActions.doChorus(1.5, 20, 50, 0);
            expect(mouse.MB.listeners).not.toContain("_chorus_0");
            MusicBlocks.isRun = true;
        });

        it("should register a mouse listener when blk is undefined and running", () => {
            const mouse = Mouse.getMouseFromTurtle(targetTurtle);
            mouse.MB.listeners = [];
            Singer.ToneActions.doChorus(1.5, 20, 50, 0);
            expect(mouse.MB.listeners).toContain("_chorus_0");
            listenerCallbacks["_chorus_0"]();
            expect(targetTurtle.singer.chorusRate.length).toBe(0);
        });
    });

    describe("doPhaser", () => {
        it("should apply phaser effect correctly", () => {
            Singer.ToneActions.doPhaser(2, 3, 100, 0, 1);
            expect(targetTurtle.singer.rate).toContain(2);
            expect(targetTurtle.singer.octaves).toContain(3);
            expect(targetTurtle.singer.baseFrequency).toContain(100);

            if (listenerCallbacks["_phaser_0"]) {
                listenerCallbacks["_phaser_0"]();
                expect(targetTurtle.singer.rate.length).toBe(0);
                expect(targetTurtle.singer.octaves.length).toBe(0);
                expect(targetTurtle.singer.baseFrequency.length).toBe(0);
            }
        });

        it("should NOT register a mouse listener when blk is undefined", () => {
            MusicBlocks.isRun = false;
            const mouse = Mouse.getMouseFromTurtle(targetTurtle);
            mouse.MB.listeners = [];
            Singer.ToneActions.doPhaser(2, 3, 100, 0);
            expect(mouse.MB.listeners).not.toContain("_phaser_0");
            MusicBlocks.isRun = true;
        });

        it("should register a mouse listener when blk is undefined and running", () => {
            const mouse = Mouse.getMouseFromTurtle(targetTurtle);
            mouse.MB.listeners = [];
            Singer.ToneActions.doPhaser(2, 3, 100, 0);
            expect(mouse.MB.listeners).toContain("_phaser_0");
            listenerCallbacks["_phaser_0"]();
            expect(targetTurtle.singer.rate.length).toBe(0);
        });
    });

    describe("doTremolo", () => {
        it("should apply tremolo effect correctly", () => {
            Singer.ToneActions.doTremolo(5, 50, 0, 1);
            expect(targetTurtle.singer.tremoloFrequency).toContain(5);
            expect(targetTurtle.singer.tremoloDepth).toContain(0.5);
            expect(activity.logo.setDispatchBlock).toHaveBeenCalledWith(1, 0, "_tremolo_0");
            if (listenerCallbacks["_tremolo_0"]) {
                listenerCallbacks["_tremolo_0"]();
                expect(targetTurtle.singer.tremoloFrequency.length).toBe(0);
                expect(targetTurtle.singer.tremoloDepth.length).toBe(0);
            }
        });

        it("should show error for invalid tremolo depth", () => {
            Singer.ToneActions.doTremolo(5, 150, 0, 1);
            expect(activity.errorMsg).toHaveBeenCalledWith("Depth is out of range.", 1);
            expect(activity.logo.stopTurtle).toBe(true);
        });

        it("should show error for negative tremolo depth", () => {
            Singer.ToneActions.doTremolo(5, -50, 0, 1);
            expect(activity.errorMsg).toHaveBeenCalledWith("Depth is out of range.", 1);
            expect(activity.logo.stopTurtle).toBe(true);
        });

        it("should NOT register a mouse listener when blk is undefined", () => {
            MusicBlocks.isRun = false;
            const mouse = Mouse.getMouseFromTurtle(targetTurtle);
            mouse.MB.listeners = [];
            Singer.ToneActions.doTremolo(5, 50, 0);
            expect(mouse.MB.listeners).not.toContain("_tremolo_0");
            MusicBlocks.isRun = true;
        });

        it("should register a mouse listener when blk is undefined and running", () => {
            const mouse = Mouse.getMouseFromTurtle(targetTurtle);
            mouse.MB.listeners = [];
            Singer.ToneActions.doTremolo(5, 50, 0);
            expect(mouse.MB.listeners).toContain("_tremolo_0");
            listenerCallbacks["_tremolo_0"]();
            expect(targetTurtle.singer.tremoloFrequency.length).toBe(0);
        });
    });

    describe("doDistortion", () => {
        it("should apply distortion effect correctly", () => {
            Singer.ToneActions.doDistortion(50, 0, 1);
            expect(targetTurtle.singer.distortionAmount).toContain(0.5);
            expect(activity.logo.setDispatchBlock).toHaveBeenCalledWith(1, 0, "_distortion_0");
            if (listenerCallbacks["_distortion_0"]) {
                listenerCallbacks["_distortion_0"]();
                expect(targetTurtle.singer.distortionAmount.length).toBe(0);
            }
        });

        it("should show error for invalid distortion amount", () => {
            Singer.ToneActions.doDistortion(150, 0, 1);
            expect(activity.errorMsg).toHaveBeenCalledWith("Distortion must be from 0 to 100.", 1);
            expect(activity.logo.stopTurtle).toBe(true);
        });

        it("should show error for negative distortion amount", () => {
            Singer.ToneActions.doDistortion(-10, 0, 1);
            expect(activity.errorMsg).toHaveBeenCalledWith("Distortion must be from 0 to 100.", 1);
            expect(activity.logo.stopTurtle).toBe(true);
        });

        it("should NOT register a mouse listener when blk is undefined", () => {
            MusicBlocks.isRun = false;
            const mouse = Mouse.getMouseFromTurtle(targetTurtle);
            mouse.MB.listeners = [];
            Singer.ToneActions.doDistortion(50, 0);
            expect(mouse.MB.listeners).not.toContain("_distortion_0");
            MusicBlocks.isRun = true;
        });

        it("should register a mouse listener when blk is undefined and running", () => {
            const mouse = Mouse.getMouseFromTurtle(targetTurtle);
            mouse.MB.listeners = [];
            Singer.ToneActions.doDistortion(50, 0);
            expect(mouse.MB.listeners).toContain("_distortion_0");
            listenerCallbacks["_distortion_0"]();
            expect(targetTurtle.singer.distortionAmount.length).toBe(0);
        });
    });

    describe("doHarmonic", () => {
        it("should apply harmonic effect correctly", () => {
            const blk = 1;
            const harmonic = 2;

            Singer.ToneActions.doHarmonic(harmonic, 0, blk);

            expect(activity.logo.notation.notationBeginHarmonics).toHaveBeenCalledWith(0);
            expect(targetTurtle.singer.partials).toHaveLength(1);
            expect(targetTurtle.singer.partials[0]).toEqual([0, 0, 1]);
            expect(activity.logo.setDispatchBlock).toHaveBeenCalledWith(1, 0, "_harmonic_0_1");

            if (listenerCallbacks["_harmonic_0_1"]) {
                listenerCallbacks["_harmonic_0_1"]();
                expect(targetTurtle.singer.inHarmonic.length).toBe(0);
                expect(targetTurtle.singer.partials.length).toBe(0);
                expect(activity.logo.notation.notationEndHarmonics).toHaveBeenCalledWith(0);
            }
        });

        it("should show error for invalid harmonic value", () => {
            Singer.ToneActions.doHarmonic(-1, 0, 1);
            expect(activity.errorMsg).toHaveBeenCalledWith(
                "Partial must be greater than or equal to 0."
            );
            expect(activity.logo.stopTurtle).toBe(true);
        });

        it("should show error for non-numeric harmonic value", () => {
            Singer.ToneActions.doHarmonic("not a number", 0, 1);
            expect(activity.errorMsg).toHaveBeenCalledWith(
                "Partial must be greater than or equal to 0."
            );
            expect(activity.logo.stopTurtle).toBe(true);
        });

        it("should handle zero harmonic value", () => {
            Singer.ToneActions.doHarmonic(0, 0, 1);
            expect(targetTurtle.singer.partials).toHaveLength(1);
            expect(targetTurtle.singer.partials[0]).toEqual([1]);
        });

        it("should NOT register a mouse listener when blk is undefined", () => {
            MusicBlocks.isRun = false;
            const mouse = Mouse.getMouseFromTurtle(targetTurtle);
            mouse.MB.listeners = [];
            Singer.ToneActions.doHarmonic(2, 0);
            expect(mouse.MB.listeners).not.toContain("_harmonic_0_undefined");
            MusicBlocks.isRun = true;
        });

        it("should register a mouse listener when blk is undefined and running", () => {
            const mouse = Mouse.getMouseFromTurtle(targetTurtle);
            mouse.MB.listeners = [];
            Singer.ToneActions.doHarmonic(2, 0);
            expect(mouse.MB.listeners).toContain("_harmonic_0_undefined");
            listenerCallbacks["_harmonic_0_undefined"]();
            expect(targetTurtle.singer.inHarmonic.length).toBe(0);
            expect(targetTurtle.singer.partials.length).toBe(0);
        });
    });

    describe("defFMSynth", () => {
        it("should define FM synth correctly", () => {
            Singer.ToneActions.defFMSynth(10, 0, 1);
            expect(activity.logo.timbre.FMSynthParams).toContain(10);
            expect(activity.logo.synth.createSynth).toHaveBeenCalledWith(
                0,
                "default-voice",
                "fmsynth",
                { modulationIndex: 10 }
            );
        });

        it("should handle null modulationIndex", () => {
            Singer.ToneActions.defFMSynth(null, 0, 1);
            expect(activity.errorMsg).toHaveBeenCalledWith("Missing input", 1);
            expect(activity.logo.timbre.FMSynthParams).toContain(10);
        });

        it("should handle negative modulationIndex", () => {
            Singer.ToneActions.defFMSynth(-10, 0, 1);
            expect(activity.errorMsg).toHaveBeenCalledWith("The input cannot be negative.");
            expect(activity.logo.timbre.FMSynthParams).toContain(10);
        });

        it("should show error when oscillators exist", () => {
            activity.logo.timbre.osc = [{}];
            Singer.ToneActions.defFMSynth(10, 0, 1);
            expect(activity.errorMsg).toHaveBeenCalledWith(
                "Unable to use synth due to existing oscillator"
            );
        });

        it("should not create parameters when not in timbre mode", () => {
            activity.logo.inTimbre = false;
            Singer.ToneActions.defFMSynth(10, 0, 1);
            expect(activity.logo.synth.createSynth).not.toHaveBeenCalled();
        });
    });

    describe("defAMSynth", () => {
        it("should define AM synth correctly", () => {
            Singer.ToneActions.defAMSynth(5, 0, 1);
            expect(activity.logo.timbre.AMSynthParams).toContain(5);
            expect(activity.logo.synth.createSynth).toHaveBeenCalledWith(
                0,
                "default-voice",
                "amsynth",
                { harmonicity: 5 }
            );
        });

        it("should handle null harmonicity", () => {
            Singer.ToneActions.defAMSynth(null, 0, 1);
            expect(activity.errorMsg).toHaveBeenCalledWith("Missing input", 1);
            expect(activity.logo.timbre.AMSynthParams).toContain(1);
        });

        it("should handle non-numeric harmonicity", () => {
            Singer.ToneActions.defAMSynth("string", 0, 1);
            expect(activity.errorMsg).toHaveBeenCalledWith("Missing input", 1);
            expect(activity.logo.timbre.AMSynthParams).toContain(1);
        });

        it("should handle negative harmonicity", () => {
            Singer.ToneActions.defAMSynth(-5, 0, 1);
            expect(activity.errorMsg).toHaveBeenCalledWith("The input cannot be negative.");
            expect(activity.logo.timbre.AMSynthParams).toContain(5);
        });

        it("should show error when oscillators exist", () => {
            activity.logo.timbre.osc = [{}];
            Singer.ToneActions.defAMSynth(5, 0, 1);
            expect(activity.errorMsg).toHaveBeenCalledWith(
                "Unable to use synth due to existing oscillator"
            );
        });

        it("should not create parameters when not in timbre mode", () => {
            activity.logo.inTimbre = false;
            Singer.ToneActions.defAMSynth(5, 0, 1);
            expect(activity.logo.synth.createSynth).not.toHaveBeenCalled();
        });
    });

    describe("defDuoSynth", () => {
        it("should define Duo synth correctly", () => {
            Singer.ToneActions.defDuoSynth(10, 20, 0, 1);
            expect(activity.logo.timbre.duoSynthParams).toContain(10);
            expect(activity.logo.timbre.duoSynthParams).toContain(0.2);
            expect(activity.logo.synth.createSynth).toHaveBeenCalledWith(
                0,
                "default-voice",
                "duosynth",
                { vibratoRate: 10, vibratoAmount: 0.2 }
            );
        });

        it("should handle null vibratoRate", () => {
            Singer.ToneActions.defDuoSynth(null, 20, 0, 1);
            expect(activity.errorMsg).toHaveBeenCalledWith("Missing input", 1);
            expect(activity.logo.timbre.duoSynthParams).toContain(10);
        });

        it("should handle non-numeric vibratoRate", () => {
            Singer.ToneActions.defDuoSynth("string", 20, 0, 1);
            expect(activity.errorMsg).toHaveBeenCalledWith("Missing input", 1);
            expect(activity.logo.timbre.duoSynthParams).toContain(10);
        });

        it("should handle null vibratoAmount", () => {
            Singer.ToneActions.defDuoSynth(10, null, 0, 1);
            expect(activity.errorMsg).toHaveBeenCalledWith("Missing input", 1);
            expect(activity.logo.timbre.duoSynthParams).toContain(0.5);
        });

        it("should handle non-numeric vibratoAmount", () => {
            Singer.ToneActions.defDuoSynth(10, "string", 0, 1);
            expect(activity.errorMsg).toHaveBeenCalledWith("Missing input", 1);
            expect(activity.logo.timbre.duoSynthParams).toContain(0.5);
        });

        it("should handle negative inputs correctly", () => {
            Singer.ToneActions.defDuoSynth(-10, -20, 0, 1);
            expect(activity.logo.timbre.duoSynthParams).toContain(10);
            expect(activity.logo.timbre.duoSynthParams).toContain(0.2);
        });

        it("should show error when oscillators exist", () => {
            activity.logo.timbre.osc = [{}];
            Singer.ToneActions.defDuoSynth(10, 20, 0, 1);
            expect(activity.errorMsg).toHaveBeenCalledWith(
                "Unable to use synth due to existing oscillator"
            );
        });

        it("should not create parameters when not in timbre mode", () => {
            activity.logo.inTimbre = false;
            Singer.ToneActions.defDuoSynth(10, 20, 0, 1);
            expect(activity.logo.synth.createSynth).not.toHaveBeenCalled();
        });
    });
});
