/**
 * MusicBlocks v3.7.0
 *
 * @author Anubhab
 *
 * @copyright 2025 Anubhab
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

const { setupWidgetBlocks } = require("../WidgetBlocks");

describe("setupWidgetBlocks", () => {
    let activity, logo, createdBlocks, turtles, mockTurtle;

    class BaseBlock {
        constructor(name) {
            this.name = name;
            this.dockTypes = [null];
            this.size = 1;
            this.lang = "en";
            this.hidden = false;
            createdBlocks[name] = this;
        }

        setPalette(palette, activity) {
            this.palette = palette;
            this.activity = activity;
            return this;
        }

        setHelpString(help) {
            this.help = help;
            return this;
        }

        formBlock(defn) {
            this.formDefn = defn;
            return this;
        }

        setup(activity) {
            activity.registeredBlocks = activity.registeredBlocks || {};
            activity.registeredBlocks[this.name] = this;
            return this;
        }

        beginnerBlock(flag) {
            this.isBeginner = flag;
            return this;
        }

        makeMacro(macro) {
            this.macro = macro;
            return this;
        }
    }

    class FlowBlock extends BaseBlock {
        constructor(name, displayName) {
            super(name);
            this.displayName = displayName;
        }

        flow() {}
    }

    class StackClampBlock extends BaseBlock {
        constructor(name) {
            super(name);
            this.dockTypes = [null, null, null];
        }

        flow() {}
    }

    beforeEach(() => {
        createdBlocks = {};
        jest.clearAllMocks();

        global._ = jest.fn(str => str);
        global.last = jest.fn(arr => (arr && arr.length ? arr[arr.length - 1] : null));
        global.FlowBlock = FlowBlock;
        global.StackClampBlock = StackClampBlock;

        global.NOINPUTERRORMSG = "No input provided";
        global.DEFAULTVOICE = "default voice";
        global.DEFAULTMODE = "major";
        global.DEFAULTFILTERTYPE = "lowpass";
        global._THIS_IS_MUSIC_BLOCKS_ = true;

        global.FILTERTYPES = {
            lowpass: ["lowpass", "lowpass"],
            highpass: ["highpass", "highpass"],
            bandpass: ["bandpass", "bandpass"],
            notch: ["notch", "notch"]
        };

        global.MeterWidget = jest.fn().mockImplementation(() => ({
            init: jest.fn()
        }));

        global.Oscilloscope = jest.fn().mockImplementation(() => ({
            init: jest.fn()
        }));

        global.Tempo = jest.fn().mockImplementation(() => ({
            init: jest.fn()
        }));

        global.PitchDrumMatrix = jest.fn().mockImplementation(() => ({
            rowLabels: [],
            rowArgs: [],
            drums: [],
            clearBlocks: jest.fn(),
            init: jest.fn(),
            makeClickable: jest.fn()
        }));

        global.PhraseMaker = jest.fn().mockImplementation(() => ({
            rowLabels: [],
            rowArgs: [],
            graphicsBlocks: [],
            clearBlocks: jest.fn(),
            addTuplet: jest.fn(),
            addNotes: jest.fn(),
            init: jest.fn(),
            makeClickable: jest.fn()
        }));

        global.StatusMatrix = jest.fn().mockImplementation(() => ({
            init: jest.fn()
        }));

        global.RhythmRuler = jest.fn().mockImplementation(() => ({
            init: jest.fn()
        }));

        global.TemperamentWidget = jest.fn().mockImplementation(() => ({
            init: jest.fn(),
            inTemperament: null,
            scale: []
        }));

        global.TimbreWidget = jest.fn().mockImplementation(() => ({
            init: jest.fn(),
            instrumentName: null,
            blockNo: null,
            env: [],
            ENVs: [],
            fil: [],
            filterParams: [],
            osc: [],
            oscParams: [],
            tremoloEffect: [],
            tremoloParams: [],
            vibratoEffect: [],
            vibratoParams: [],
            chorusEffect: [],
            chorusParams: [],
            phaserEffect: [],
            phaserParams: [],
            distortionEffect: [],
            distortionParams: [],
            AMSynthesizer: [],
            AMSynthParams: [],
            FMSynthesizer: [],
            FMSynthParams: [],
            duoSynthesizer: [],
            duoSynthParams: [],
            notesToPlay: [],
            synthVals: {
                envelope: {},
                oscillator: { source: "sine" }
            }
        }));

        global.ModeWidget = jest.fn().mockImplementation(() => ({
            init: jest.fn()
        }));

        global.PitchSlider = jest.fn().mockImplementation(() => ({
            frequencies: [],
            init: jest.fn()
        }));

        global.MusicKeyboard = jest.fn().mockImplementation(() => ({
            init: jest.fn()
        }));

        global.PitchStaircase = jest.fn().mockImplementation(() => ({
            init: jest.fn()
        }));

        global.SampleWidget = jest.fn().mockImplementation(() => ({
            init: jest.fn()
        }));

        global.Arpeggio = jest.fn().mockImplementation(() => ({
            defaultCols: 8,
            notesToPlay: [],
            init: jest.fn()
        }));

        global.LegoWidget = jest.fn().mockImplementation(() => ({
            rowLabels: [],
            rowArgs: [],
            clearBlocks: jest.fn(),
            init: jest.fn()
        }));

        global.AIDebuggerWidget = jest.fn().mockImplementation(() => ({
            init: jest.fn()
        }));

        global.ReflectionMatrix = jest.fn().mockImplementation(() => ({
            init: jest.fn()
        }));

        global.instrumentsEffects = {};
        global.instrumentsFilters = {};

        mockTurtle = {
            singer: {
                attack: [],
                decay: [],
                sustain: [],
                release: []
            }
        };

        turtles = { 0: mockTurtle };

        activity = {
            registeredBlocks: {},
            beginnerMode: false,
            blocks: {
                blockList: {
                    0: { name: "test", connections: [null, 1, 2, 3], value: null },
                    1: { name: "notename", value: "C" },
                    2: { name: "number", value: 4 },
                    3: { name: "setkey2", connections: [null, 4, 5] },
                    4: { name: "notename", value: "C" },
                    5: { name: "modename", value: "major" }
                },
                findBottomBlock: jest.fn(blk => blk)
            },
            turtles: {
                ithTurtle: jest.fn(id => turtles[id] || mockTurtle)
            },
            errorMsg: jest.fn(),
            textMsg: jest.fn()
        };

        logo = {
            setDispatchBlock: jest.fn(),
            setTurtleListener: jest.fn(),
            inTimbre: false,
            timbre: null,
            inTemperament: false,
            insideTemperament: false,
            temperament: null,
            inSample: false,
            sample: null,
            inMeter: false,
            meterWidget: null,
            inPitchDrumMatrix: false,
            pitchDrumMatrix: null,
            inMatrix: false,
            phraseMaker: null,
            inArpeggio: false,
            arpeggio: null,
            inPitchSlider: false,
            pitchSlider: null,
            inStatusMatrix: false,
            statusMatrix: null,
            inLegoWidget: false,
            legoWidget: null,
            tupletRhythms: [],
            tupletParams: [],
            addingNotesToTuplet: false,
            statusFields: [],
            synth: {
                createSynth: jest.fn(),
                startingPitch: null
            }
        };

        instrumentsEffects[0] = {};
        instrumentsFilters[0] = {};
    });

    describe("Block Registration", () => {
        it("should register all widget blocks when _THIS_IS_MUSIC_BLOCKS_ is true", () => {
            global._THIS_IS_MUSIC_BLOCKS_ = true;
            setupWidgetBlocks(activity);

            const expectedBlocks = [
                "envelope",
                "filter",
                "temperament",
                "timbre",
                "meterwidget",
                "modewidget",
                "tempo",
                "sampler",
                "arpeggiomatrix",
                "pitchdrummatrix",
                "oscilloscope",
                "pitchslider",
                "chromatic",
                "legobricks",
                "reflection",
                "musickeyboard2",
                "musickeyboard",
                "pitchstaircase",
                "rhythmruler3",
                "rhythmruler2",
                "matrixgmajor",
                "matrixcmajor",
                "matrix",
                "status",
                "aidebugger"
            ];

            expectedBlocks.forEach(blockName => {
                expect(activity.registeredBlocks[blockName]).toBeDefined();
            });
        });

        it("should register AIDebugger and Status blocks even when _THIS_IS_MUSIC_BLOCKS_ is false", () => {
            global._THIS_IS_MUSIC_BLOCKS_ = false;
            activity.registeredBlocks = {};
            setupWidgetBlocks(activity);

            expect(activity.registeredBlocks["aidebugger"]).toBeDefined();
            expect(activity.registeredBlocks["status"]).toBeDefined();
        });
    });

    describe("EnvelopeBlock", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("should create envelope block with correct properties", () => {
            const block = activity.registeredBlocks["envelope"];
            expect(block).toBeDefined();
            expect(block.name).toBe("envelope");
            expect(block.hidden).toBe(true);
        });

        it("should handle flow with valid ADSR values", () => {
            const block = activity.registeredBlocks["envelope"];
            const args = [50, 30, 60, 40];

            block.flow(args, logo, 0, 0);

            expect(mockTurtle.singer.attack).toContain(0.5);
            expect(mockTurtle.singer.decay).toContain(0.3);
            expect(mockTurtle.singer.sustain).toContain(0.6);
            expect(mockTurtle.singer.release).toContain(0.4);
        });

        it("should show error for attack value out of range", () => {
            const block = activity.registeredBlocks["envelope"];
            const args = [150, 30, 60, 40];

            block.flow(args, logo, 0, 0);

            expect(activity.errorMsg).toHaveBeenCalledWith(
                expect.stringContaining("Attack value should be from 0 to 100")
            );
        });

        it("should show error for decay value out of range", () => {
            const block = activity.registeredBlocks["envelope"];
            const args = [50, -10, 60, 40];

            block.flow(args, logo, 0, 0);

            expect(activity.errorMsg).toHaveBeenCalledWith(
                expect.stringContaining("Decay value should be from 0 to 100")
            );
        });

        it("should show error for sustain value out of range", () => {
            const block = activity.registeredBlocks["envelope"];
            const args = [50, 30, 120, 40];

            block.flow(args, logo, 0, 0);

            expect(activity.errorMsg).toHaveBeenCalledWith(
                expect.stringContaining("Sustain value should be from 0 to 100")
            );
        });

        it("should show error for release value out of range", () => {
            const block = activity.registeredBlocks["envelope"];
            const args = [50, 30, 60, 150];

            block.flow(args, logo, 0, 0);

            expect(activity.errorMsg).toHaveBeenCalledWith(
                expect.stringContaining("Release value should be from 0-100")
            );
        });

        it("should update timbre object when inTimbre is true", () => {
            const block = activity.registeredBlocks["envelope"];
            const args = [10, 20, 30, 40];

            logo.inTimbre = true;
            logo.timbre = new TimbreWidget();
            mockTurtle.singer.attack = [0.1];
            mockTurtle.singer.decay = [0.2];
            mockTurtle.singer.sustain = [0.3];
            mockTurtle.singer.release = [0.4];

            block.flow(args, logo, 0, 0);

            expect(logo.timbre.synthVals.envelope.attack).toBe(0.1);
            expect(logo.timbre.synthVals.envelope.decay).toBe(0.2);
            expect(logo.timbre.synthVals.envelope.sustain).toBe(0.3);
            expect(logo.timbre.synthVals.envelope.release).toBe(0.4);
        });

        it("should create synth when inTimbre and no existing envelope", () => {
            const block = activity.registeredBlocks["envelope"];
            const args = [10, 20, 30, 40];

            logo.inTimbre = true;
            logo.timbre = new TimbreWidget();
            logo.timbre.instrumentName = "guitar";
            mockTurtle.singer.attack = [0.1];
            mockTurtle.singer.decay = [0.2];
            mockTurtle.singer.sustain = [0.3];
            mockTurtle.singer.release = [0.4];

            block.flow(args, logo, 0, 0);

            expect(logo.synth.createSynth).toHaveBeenCalledWith(
                0,
                "guitar",
                "sine",
                logo.timbre.synthVals
            );
        });

        it("should show error when multiple envelope blocks added", () => {
            const block = activity.registeredBlocks["envelope"];
            const args = [10, 20, 30, 40];

            logo.inTimbre = true;
            logo.timbre = new TimbreWidget();
            logo.timbre.env = [1]; // Already has an envelope

            block.flow(args, logo, 0, 0);

            expect(activity.errorMsg).toHaveBeenCalledWith(
                expect.stringContaining("You are adding multiple envelope blocks")
            );
        });
    });

    describe("FilterBlock", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("should create filter block with correct properties", () => {
            const block = activity.registeredBlocks["filter"];
            expect(block).toBeDefined();
            expect(block.name).toBe("filter");
            expect(block.hidden).toBe(true);
        });

        it("should handle flow with valid filter parameters", () => {
            const block = activity.registeredBlocks["filter"];
            const args = ["highpass", -12, 440];

            logo.inTimbre = true;
            logo.timbre = new TimbreWidget();
            logo.timbre.instrumentName = "piano";
            instrumentsFilters[0] = {};

            block.flow(args, logo, 0, 0);

            expect(instrumentsFilters[0]["piano"]).toBeDefined();
            expect(instrumentsFilters[0]["piano"].length).toBeGreaterThan(0);
        });

        it("should show error for invalid rolloff value", () => {
            const block = activity.registeredBlocks["filter"];
            const args = ["lowpass", -36, 440];

            block.flow(args, logo, 0, 0);

            expect(activity.errorMsg).toHaveBeenCalledWith(
                expect.stringContaining("Rolloff value should be either -12, -24, -48, or -96")
            );
        });

        it("should add filter parameters to timbre when inTimbre", () => {
            const block = activity.registeredBlocks["filter"];
            const args = ["bandpass", -24, 880];

            logo.inTimbre = true;
            logo.timbre = new TimbreWidget();
            logo.timbre.instrumentName = "violin";
            instrumentsFilters[0] = {};

            block.flow(args, logo, 0, 0);

            expect(logo.timbre.fil.length).toBeGreaterThan(0);
            expect(logo.timbre.filterParams.length).toBeGreaterThan(0);
        });

        it("should handle valid rolloff values", () => {
            const block = activity.registeredBlocks["filter"];
            const validRolloffs = [-12, -24, -48, -96];

            logo.inTimbre = true;
            logo.timbre = new TimbreWidget();
            logo.timbre.instrumentName = "test";
            instrumentsFilters[0] = {};

            validRolloffs.forEach(rolloff => {
                activity.errorMsg.mockClear();
                const args = ["lowpass", rolloff, 440];
                block.flow(args, logo, 0, 0);
                expect(activity.errorMsg).not.toHaveBeenCalled();
            });
        });
    });

    describe("TemperamentBlock", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("should create temperament block with correct properties", () => {
            const block = activity.registeredBlocks["temperament"];
            expect(block).toBeDefined();
            expect(block.name).toBe("temperament");
        });

        it("should initialize temperament widget if null", () => {
            const block = activity.registeredBlocks["temperament"];
            const args = ["equal"];

            expect(logo.temperament).toBeNull();
            block.flow(args, logo, 0, 0);

            expect(logo.temperament).toBeDefined();
            expect(logo.insideTemperament).toBe(true);
        });

        it("should set temperament scale from pitch block", () => {
            const block = activity.registeredBlocks["temperament"];
            const args = ["equal"];

            activity.blocks.blockList[0].connections = [null, null, 1];
            activity.blocks.blockList[1] = {
                name: "pitch",
                connections: [null, 2, 3, 4]
            };
            activity.blocks.blockList[2] = { name: "notename", value: "D" };
            activity.blocks.blockList[3] = { name: "number", value: 5 };
            activity.blocks.blockList[4] = {
                name: "setkey2",
                connections: [null, 5, 6]
            };
            activity.blocks.blockList[5] = { name: "notename", value: "G" };
            activity.blocks.blockList[6] = { name: "modename", value: "minor" };

            block.flow(args, logo, 0, 0);

            expect(logo.setDispatchBlock).toHaveBeenCalled();
            expect(logo.setTurtleListener).toHaveBeenCalled();
        });

        it("should have makeMacro method", () => {
            const block = activity.registeredBlocks["temperament"];
            expect(block.macro).toBeDefined();
            expect(typeof block.macro).toBe("function");
        });
    });

    describe("TimbreBlock", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("should create timbre block with correct properties", () => {
            const block = activity.registeredBlocks["timbre"];
            expect(block).toBeDefined();
            expect(block.name).toBe("timbre");
        });

        it("should initialize timbre widget if null", () => {
            const block = activity.registeredBlocks["timbre"];
            const args = ["custom instrument", "arg1"];

            expect(logo.timbre).toBeNull();
            const result = block.flow(args, logo, 0, 0);

            expect(logo.timbre).toBeDefined();
            expect(logo.inTimbre).toBe(true);
            expect(logo.timbre.instrumentName).toBe("custom instrument");
            expect(result).toEqual(["arg1", 1]);
        });

        it("should initialize instrument effects", () => {
            const block = activity.registeredBlocks["timbre"];
            const args = ["piano"];

            block.flow(args, logo, 0, 0);

            expect(instrumentsEffects[0]["piano"]).toBeDefined();
            expect(instrumentsEffects[0]["piano"].vibratoActive).toBe(false);
            expect(instrumentsEffects[0]["piano"].distortionActive).toBe(false);
            expect(instrumentsEffects[0]["piano"].tremoloActive).toBe(false);
            expect(instrumentsEffects[0]["piano"].phaserActive).toBe(false);
            expect(instrumentsEffects[0]["piano"].chorusActive).toBe(false);
        });

        it("should reset all timbre arrays", () => {
            const block = activity.registeredBlocks["timbre"];
            const args = ["guitar"];

            block.flow(args, logo, 0, 0);

            expect(logo.timbre.env).toEqual([]);
            expect(logo.timbre.ENVs).toEqual([]);
            expect(logo.timbre.fil).toEqual([]);
            expect(logo.timbre.filterParams).toEqual([]);
            expect(logo.timbre.osc).toEqual([]);
            expect(logo.timbre.oscParams).toEqual([]);
        });

        it("should use DEFAULTVOICE when no instrument name provided", () => {
            const block = activity.registeredBlocks["timbre"];
            const args = [123]; // Invalid type

            block.flow(args, logo, 0, 0);

            expect(logo.timbre.instrumentName).toBe(DEFAULTVOICE);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, 0);
        });

        it("should set dispatch block and listener", () => {
            const block = activity.registeredBlocks["timbre"];
            const args = ["flute"];

            block.flow(args, logo, 0, 0);

            expect(logo.setDispatchBlock).toHaveBeenCalledWith(0, 0, "_timbre_0");
            expect(logo.setTurtleListener).toHaveBeenCalledWith(
                0,
                "_timbre_0",
                expect.any(Function)
            );
        });
    });

    describe("SamplerBlock", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("should create sampler block with correct properties", () => {
            const block = activity.registeredBlocks["sampler"];
            expect(block).toBeDefined();
            expect(block.name).toBe("sampler");
            expect(block.parameter).toBe(true);
        });

        it("should initialize sample widget", () => {
            const block = activity.registeredBlocks["sampler"];
            const args = ["sample1"];

            const result = block.flow(args, logo, 0, 0);

            expect(logo.sample).toBeDefined();
            expect(logo.inSample).toBe(true);
            expect(result).toEqual(["sample1", 1]);
        });

        it("should set dispatch block and listener", () => {
            const block = activity.registeredBlocks["sampler"];
            const args = ["sample2"];

            block.flow(args, logo, 0, 0);

            expect(logo.setDispatchBlock).toHaveBeenCalledWith(0, 0, "_sampler_0");
            expect(logo.setTurtleListener).toHaveBeenCalledWith(
                0,
                "_sampler_0",
                expect.any(Function)
            );
        });
    });

    describe("MeterWidgetBlock", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("should create meter widget block with correct properties", () => {
            const block = activity.registeredBlocks["meterwidget"];
            expect(block).toBeDefined();
            expect(block.name).toBe("meterwidget");
        });

        it("should initialize meter widget", () => {
            const block = activity.registeredBlocks["meterwidget"];
            const args = [4];

            logo.meterWidget = null;
            logo.insideMeterWidget = false;
            const result = block.flow(args, logo, 0, 0);

            expect(logo.insideMeterWidget).toBe(true);
            expect(result).toEqual([4, 1]);
        });
    });

    describe("PitchDrumMatrixBlock", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("should create pitch drum matrix block with correct properties", () => {
            const block = activity.registeredBlocks["pitchdrummatrix"];
            expect(block).toBeDefined();
            expect(block.name).toBe("pitchdrummatrix");
        });

        it("should initialize pitch drum matrix widget", () => {
            const block = activity.registeredBlocks["pitchdrummatrix"];
            const args = ["test"];

            logo.pitchDrumMatrix = null;
            block.flow(args, logo, 0, 0);

            expect(logo.pitchDrumMatrix).toBeDefined();
            expect(logo.inPitchDrumMatrix).toBe(true);
            expect(logo.pitchDrumMatrix.rowLabels).toEqual([]);
            expect(logo.pitchDrumMatrix.rowArgs).toEqual([]);
            expect(logo.pitchDrumMatrix.drums).toEqual([]);
        });

        it("should call clearBlocks on pitch drum matrix", () => {
            const block = activity.registeredBlocks["pitchdrummatrix"];
            const args = ["test"];

            logo.pitchDrumMatrix = new PitchDrumMatrix();
            block.flow(args, logo, 0, 0);

            expect(logo.pitchDrumMatrix.clearBlocks).toHaveBeenCalled();
        });
    });

    describe("ArpeggioMatrixBlock", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("should create arpeggio matrix block with correct properties", () => {
            const block = activity.registeredBlocks["arpeggiomatrix"];
            expect(block).toBeDefined();
            expect(block.name).toBe("arpeggiomatrix");
        });

        it("should initialize arpeggio widget", () => {
            const block = activity.registeredBlocks["arpeggiomatrix"];
            const args = [8, "test"];

            logo.arpeggio = null;
            const result = block.flow(args, logo, 0, 0);

            expect(logo.arpeggio).toBeDefined();
            expect(logo.inArpeggio).toBe(true);
            expect(result).toEqual(["test", 1]);
        });

        it("should set default columns when valid", () => {
            const block = activity.registeredBlocks["arpeggiomatrix"];
            const args = [12, "test"];

            logo.arpeggio = new Arpeggio();
            block.flow(args, logo, 0, 0);

            expect(logo.arpeggio.defaultCols).toBe(12);
        });

        it("should not change default columns for invalid values", () => {
            const block = activity.registeredBlocks["arpeggiomatrix"];

            logo.arpeggio = new Arpeggio();
            let args = [1, "test"];
            block.flow(args, logo, 0, 0);
            expect(logo.arpeggio.defaultCols).toBe(8);

            logo.arpeggio = new Arpeggio();
            args = [25, "test"];
            block.flow(args, logo, 0, 0);
            expect(logo.arpeggio.defaultCols).toBe(8);
        });

        it("should reset notesToPlay array", () => {
            const block = activity.registeredBlocks["arpeggiomatrix"];
            const args = [8, "test"];

            logo.arpeggio = new Arpeggio();
            logo.arpeggio.notesToPlay = [1, 2, 3];

            block.flow(args, logo, 0, 0);

            expect(logo.arpeggio.notesToPlay).toEqual([]);
        });
    });

    describe("PitchSliderBlock", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("should create pitch slider block with correct properties", () => {
            const block = activity.registeredBlocks["pitchslider"];
            expect(block).toBeDefined();
            expect(block.name).toBe("pitchslider");
            expect(block.isBeginner).toBe(true);
        });

        it("should initialize pitch slider widget", () => {
            const block = activity.registeredBlocks["pitchslider"];
            const args = ["test"];

            logo.pitchSlider = null;
            const result = block.flow(args, logo, 0, 0);

            expect(logo.pitchSlider).toBeDefined();
            expect(logo.inPitchSlider).toBe(true);
            expect(result).toEqual(["test", 1]);
        });

        it("should reset frequencies array", () => {
            const block = activity.registeredBlocks["pitchslider"];
            const args = ["test"];

            logo.pitchSlider = new PitchSlider();
            logo.pitchSlider.frequencies = [440, 880];

            block.flow(args, logo, 0, 0);

            expect(logo.pitchSlider.frequencies).toEqual([]);
        });
    });

    describe("StatusBlock", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("should create status block with correct properties", () => {
            const block = activity.registeredBlocks["status"];
            expect(block).toBeDefined();
            expect(block.name).toBe("status");
            expect(block.isBeginner).toBe(true);
        });

        it("should initialize status matrix widget", () => {
            const block = activity.registeredBlocks["status"];
            const args = ["test"];

            logo.statusMatrix = null;
            const result = block.flow(args, logo, 0, 0);

            expect(logo.statusMatrix).toBeDefined();
            expect(logo.inStatusMatrix).toBe(true);
            expect(logo.statusFields).toEqual([]);
            expect(result).toEqual(["test", 1]);
        });

        it("should call init on status matrix", () => {
            const block = activity.registeredBlocks["status"];
            const args = ["test"];

            logo.statusMatrix = null;
            block.flow(args, logo, 0, 0);

            expect(StatusMatrix).toHaveBeenCalled();
        });
    });

    describe("MatrixBlock", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("should create matrix block with correct properties", () => {
            const block = activity.registeredBlocks["matrix"];
            expect(block).toBeDefined();
            expect(block.name).toBe("matrix");
        });

        it("should initialize phrase maker", () => {
            const block = activity.registeredBlocks["matrix"];
            const args = ["test"];

            logo.phraseMaker = null;
            block.flow(args, logo, 0, 0);

            expect(logo.phraseMaker).toBeDefined();
            expect(logo.inMatrix).toBe(true);
            expect(logo.phraseMaker._instrumentName).toBe(DEFAULTVOICE);
        });

        it("should reset phrase maker arrays", () => {
            const block = activity.registeredBlocks["matrix"];
            const args = ["test"];

            logo.phraseMaker = new PhraseMaker();
            logo.phraseMaker.rowLabels = [1, 2];
            logo.phraseMaker.rowArgs = [3, 4];

            block.flow(args, logo, 0, 0);

            expect(logo.phraseMaker.rowLabels).toEqual([]);
            expect(logo.phraseMaker.rowArgs).toEqual([]);
            expect(logo.phraseMaker.graphicsBlocks).toEqual([]);
        });

        it("should reset tuplet arrays", () => {
            const block = activity.registeredBlocks["matrix"];
            const args = ["test"];

            logo.tupletRhythms = [1, 2, 3];
            logo.tupletParams = [4, 5, 6];

            block.flow(args, logo, 0, 0);

            expect(logo.tupletRhythms).toEqual([]);
            expect(logo.tupletParams).toEqual([]);
            expect(logo.addingNotesToTuplet).toBe(false);
        });

        it("should set lyricsON to false", () => {
            const block = activity.registeredBlocks["matrix"];
            const args = ["test"];

            logo.phraseMaker = new PhraseMaker();
            logo.phraseMaker.lyricsON = true;

            block.flow(args, logo, 0, 0);

            expect(logo.phraseMaker.lyricsON).toBe(false);
        });
    });

    describe("MatrixCMajorBlock", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("should create matrix C major block", () => {
            const block = activity.registeredBlocks["matrixcmajor"];
            expect(block).toBeDefined();
            expect(block.name).toBe("matrixcmajor");
        });

        it("should have makeMacro method", () => {
            const block = activity.registeredBlocks["matrixcmajor"];
            expect(block.macro).toBeDefined();
            expect(typeof block.macro).toBe("function");
        });
    });

    describe("MatrixGMajorBlock", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("should create matrix G major block", () => {
            const block = activity.registeredBlocks["matrixgmajor"];
            expect(block).toBeDefined();
            expect(block.name).toBe("matrixgmajor");
        });

        it("should have makeMacro method", () => {
            const block = activity.registeredBlocks["matrixgmajor"];
            expect(block.macro).toBeDefined();
            expect(typeof block.macro).toBe("function");
        });
    });

    describe("TempoBlock", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("should create tempo block with correct properties", () => {
            const block = activity.registeredBlocks["tempo"];
            expect(block).toBeDefined();
            expect(block.name).toBe("tempo");
        });

        it("should have makeMacro method", () => {
            const block = activity.registeredBlocks["tempo"];
            expect(block.macro).toBeDefined();
            expect(typeof block.macro).toBe("function");
        });
    });

    describe("ModeWidgetBlock", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("should create mode widget block", () => {
            const block = activity.registeredBlocks["modewidget"];
            expect(block).toBeDefined();
            expect(block.name).toBe("modewidget");
        });
    });

    describe("OscilloscopeWidgetBlock", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("should create oscilloscope widget block", () => {
            const block = activity.registeredBlocks["oscilloscope"];
            expect(block).toBeDefined();
            expect(block.name).toBe("oscilloscope");
        });
    });

    describe("ChromaticBlock", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("should create chromatic block", () => {
            const block = activity.registeredBlocks["chromatic"];
            expect(block).toBeDefined();
            expect(block.name).toBe("chromatic");
        });

        it("should have makeMacro method", () => {
            const block = activity.registeredBlocks["chromatic"];
            expect(block.macro).toBeDefined();
            expect(typeof block.macro).toBe("function");
        });
    });

    describe("MusicKeyboardBlock", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("should create music keyboard block", () => {
            const block = activity.registeredBlocks["musickeyboard"];
            expect(block).toBeDefined();
            expect(block.name).toBe("musickeyboard");
        });
    });

    describe("MusicKeyboard2Block", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("should create music keyboard 2 block", () => {
            const block = activity.registeredBlocks["musickeyboard2"];
            expect(block).toBeDefined();
            expect(block.name).toBe("musickeyboard2");
        });
    });

    describe("PitchStaircaseBlock", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("should create pitch staircase block", () => {
            const block = activity.registeredBlocks["pitchstaircase"];
            expect(block).toBeDefined();
            expect(block.name).toBe("pitchstaircase");
        });
    });

    describe("RhythmRuler2Block", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("should create rhythm ruler 2 block", () => {
            const block = activity.registeredBlocks["rhythmruler2"];
            expect(block).toBeDefined();
            expect(block.name).toBe("rhythmruler2");
        });
    });

    describe("RhythmRuler3Block", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("should create rhythm ruler 3 block", () => {
            const block = activity.registeredBlocks["rhythmruler3"];
            expect(block).toBeDefined();
            expect(block.name).toBe("rhythmruler3");
        });
    });

    describe("LegoBricksBlock", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("should create lego bricks block", () => {
            const block = activity.registeredBlocks["legobricks"];
            expect(block).toBeDefined();
            expect(block.name).toBe("legobricks");
        });

        it("should initialize lego widget", () => {
            const block = activity.registeredBlocks["legobricks"];
            const args = ["test"];

            logo.legoWidget = new LegoWidget();
            logo.inLegoWidget = false;
            block.flow(args, logo, 0, 0);

            expect(logo.inLegoWidget).toBe(true);
        });
    });

    describe("ReflectionBlock", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("should create reflection block", () => {
            const block = activity.registeredBlocks["reflection"];
            expect(block).toBeDefined();
            expect(block.name).toBe("reflection");
        });
    });

    describe("AIDebugger", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("should create AI debugger block", () => {
            const block = activity.registeredBlocks["aidebugger"];
            expect(block).toBeDefined();
            expect(block.name).toBe("aidebugger");
            expect(block.parameter).toBe(true);
            expect(block.isBeginner).toBe(true);
        });

        it("should initialize AI debugger widget", () => {
            const block = activity.registeredBlocks["aidebugger"];
            const args = ["test"];

            logo.sample = null;
            const result = block.flow(args, logo, 0, 0);

            expect(logo.sample).toBeDefined();
            expect(logo.inSample).toBe(true);
            expect(result).toEqual(["test", 1]);
        });

        it("should have makeMacro method", () => {
            const block = activity.registeredBlocks["aidebugger"];
            expect(block.macro).toBeDefined();
            expect(typeof block.macro).toBe("function");
        });
    });

    describe("Macro Generation", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("should generate macro for temperament block", () => {
            const block = activity.registeredBlocks["temperament"];
            const macro = block.macro(10, 20);

            expect(Array.isArray(macro)).toBe(true);
            expect(macro.length).toBeGreaterThan(0);
            expect(macro[0][1]).toBe("temperament");
        });

        it("should generate macro for timbre block", () => {
            const block = activity.registeredBlocks["timbre"];
            const macro = block.macro(5, 10);

            expect(Array.isArray(macro)).toBe(true);
            expect(macro[0][1]).toBe("timbre");
        });

        it("should generate macro for sampler block", () => {
            const block = activity.registeredBlocks["sampler"];
            const macro = block.macro(15, 25);

            expect(Array.isArray(macro)).toBe(true);
            expect(macro[0][1]).toBe("sampler");
        });

        it("should generate macro for arpeggio matrix block", () => {
            const block = activity.registeredBlocks["arpeggiomatrix"];
            const macro = block.macro(0, 0);

            expect(Array.isArray(macro)).toBe(true);
            expect(macro[0][1]).toBe("arpeggiomatrix");
        });

        it("should generate macro for pitch drum matrix block", () => {
            const block = activity.registeredBlocks["pitchdrummatrix"];
            const macro = block.macro(10, 10);

            expect(Array.isArray(macro)).toBe(true);
            expect(macro[0][1]).toBe("pitchdrummatrix");
        });

        it("should generate macro for pitch slider block", () => {
            const block = activity.registeredBlocks["pitchslider"];
            const macro = block.macro(20, 30);

            expect(Array.isArray(macro)).toBe(true);
            expect(macro[0][1]).toBe("pitchslider");
        });
    });

    describe("Edge Cases", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("envelope block handles null arguments gracefully", () => {
            const block = activity.registeredBlocks["envelope"];
            expect(() => block.flow([null, null, null, null], logo, 0, 0)).not.toThrow();
        });

        it("filter block handles empty arguments", () => {
            const block = activity.registeredBlocks["filter"];
            expect(() => block.flow([], logo, 0, 0)).not.toThrow();
        });

        it("filter block handles string arguments in envelope", () => {
            const block = activity.registeredBlocks["envelope"];
            expect(() => block.flow(["a", "b", "c", "d"], logo, 0, 0)).not.toThrow();
        });

        it("filter block handles negative frequencies", () => {
            const block = activity.registeredBlocks["filter"];
            const args = ["lowpass", -12, -100];

            logo.inTimbre = true;
            logo.timbre = new TimbreWidget();
            logo.timbre.instrumentName = "test";
            instrumentsFilters[0] = {};

            expect(() => block.flow(args, logo, 0, 0)).not.toThrow();
        });

        it("filter block with non-numeric second argument", () => {
            const block = activity.registeredBlocks["filter"];
            const args = ["lowpass", "invalid", 440];

            expect(() => block.flow(args, logo, 0, 0)).not.toThrow();
        });

        it("envelope block with boundary values", () => {
            const block = activity.registeredBlocks["envelope"];

            block.flow([0, 0, 0, 0], logo, 0, 0);
            expect(mockTurtle.singer.attack).toContain(0);

            block.flow([100, 100, 100, 100], logo, 0, 0);
            expect(mockTurtle.singer.release).toContain(1);
        });

        it("arpeggio block with edge column values", () => {
            const block = activity.registeredBlocks["arpeggiomatrix"];
            logo.arpeggio = new Arpeggio();

            block.flow([2, "test"], logo, 0, 0);
            expect(logo.arpeggio.defaultCols).toBe(2);

            logo.arpeggio = new Arpeggio();
            block.flow([20, "test"], logo, 0, 0);
            expect(logo.arpeggio.defaultCols).toBe(20);
        });

        it("temperament block with no pitch block connection", () => {
            const block = activity.registeredBlocks["temperament"];
            const args = ["equal"];

            activity.blocks.blockList[0].connections = [null, null, 99];
            activity.blocks.blockList[99] = { name: "notpitch", connections: [] };

            expect(() => block.flow(args, logo, 0, 0)).not.toThrow();
        });

        it("matrix block with only tupletRhythms", () => {
            const block = activity.registeredBlocks["matrix"];
            logo.tupletRhythms = [["notes", 0, 1]];
            logo.tupletParams = [[1, 2]];
            logo.phraseMaker = new PhraseMaker();

            block.flow(["test"], logo, 0, 0);
            expect(logo.phraseMaker.rowLabels).toEqual([]);
        });

        it("oscilloscope block initializes oscilloscopeTurtles", () => {
            const block = activity.registeredBlocks["oscilloscope"];

            block.flow([4], logo, 0, 0);

            expect(logo.oscilloscopeTurtles).toEqual([]);
            expect(logo.inOscilloscope).toBe(true);
        });

        it("mode widget block sets insideModeWidget flag", () => {
            const block = activity.registeredBlocks["modewidget"];
            logo.insideModeWidget = false;

            block.flow([4], logo, 0, 0);

            expect(logo.insideModeWidget).toBe(true);
        });

        it("reflection block initializes reflection if null", () => {
            const block = activity.registeredBlocks["reflection"];
            logo.reflection = null;

            block.flow(["test"], logo, 0, 0);

            expect(logo.reflection).toBeDefined();
            expect(logo.inReflectionMatrix).toBe(true);
            expect(logo.statusFields).toEqual([]);
        });

        it("lego widget block initializes lego widget", () => {
            const block = activity.registeredBlocks["legobricks"];
            logo.legoWidget = null;

            block.flow(["test"], logo, 0, 0);

            expect(logo.inLegoWidget).toBe(true);
        });

        it("filter block sets default filter type", () => {
            const block = activity.registeredBlocks["filter"];
            const args = ["unknown", -12, 440];

            logo.inTimbre = true;
            logo.timbre = new TimbreWidget();
            logo.timbre.instrumentName = "test";
            instrumentsFilters[0] = {};

            block.flow(args, logo, 0, 0);

            expect(instrumentsFilters[0]["test"]).toBeDefined();
        });

        it("filter block matches by FILTERTYPES key", () => {
            const block = activity.registeredBlocks["filter"];
            const args = ["lowpass", -24, 880];

            logo.inTimbre = true;
            logo.timbre = new TimbreWidget();
            logo.timbre.instrumentName = "synth";
            instrumentsFilters[0] = {};

            block.flow(args, logo, 0, 0);

            const filters = instrumentsFilters[0]["synth"];
            expect(filters[0].filterType).toBe("lowpass");
        });

        it("timbre block with no args sets DEFAULTVOICE", () => {
            const block = activity.registeredBlocks["timbre"];

            block.flow([], logo, 0, 0);

            expect(logo.timbre.instrumentName).toBe(DEFAULTVOICE);
        });

        it("pitch drum matrix clears blocks before init", () => {
            const block = activity.registeredBlocks["pitchdrummatrix"];
            logo.pitchDrumMatrix = new PitchDrumMatrix();

            block.flow(["test"], logo, 0, 0);

            expect(logo.pitchDrumMatrix.clearBlocks).toHaveBeenCalled();
            expect(logo.pitchDrumMatrix.rowLabels).toEqual([]);
            expect(logo.pitchDrumMatrix.rowArgs).toEqual([]);
            expect(logo.pitchDrumMatrix.drums).toEqual([]);
        });

        it("phrase maker initializes with correct defaults", () => {
            const block = activity.registeredBlocks["matrix"];
            logo.phraseMaker = null;

            block.flow(["test"], logo, 0, 0);

            expect(logo.phraseMaker._instrumentName).toBe(DEFAULTVOICE);
            expect(logo.phraseMaker.lyricsON).toBe(false);
            expect(logo.tupletRhythms).toEqual([]);
            expect(logo.tupletParams).toEqual([]);
            expect(logo.addingNotesToTuplet).toBe(false);
        });
    });

    describe("Listener Setup", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("temperament listener should initialize widget", () => {
            const block = activity.registeredBlocks["temperament"];
            block.flow(["equal"], logo, 0, 0);

            expect(logo.setTurtleListener).toHaveBeenCalled();
            const listener = logo.setTurtleListener.mock.calls[0][2];
            listener();

            expect(logo.temperament.init).toHaveBeenCalledWith(activity);
        });

        it("timbre listener should initialize widget", () => {
            const block = activity.registeredBlocks["timbre"];
            block.flow(["piano", "arg"], logo, 0, 0);

            const listener = logo.setTurtleListener.mock.calls[0][2];
            listener();

            expect(logo.timbre.init).toHaveBeenCalledWith(activity);
        });

        it("matrix listener should show error when no rhythms", () => {
            const block = activity.registeredBlocks["matrix"];
            logo.tupletRhythms = [];
            logo.phraseMaker = new PhraseMaker();

            block.flow(["test"], logo, 0, 0);

            const listener = logo.setTurtleListener.mock.calls[0][2];
            listener();

            expect(activity.errorMsg).toHaveBeenCalled();
        });

        it("matrix listener should show error when no row labels", () => {
            const block = activity.registeredBlocks["matrix"];
            logo.tupletRhythms = [["notes", 0]];
            logo.phraseMaker = new PhraseMaker();
            logo.phraseMaker.rowLabels = [];

            block.flow(["test"], logo, 0, 0);

            const listener = logo.setTurtleListener.mock.calls[0][2];
            listener();

            expect(activity.errorMsg).toHaveBeenCalled();
        });

        it("pitch slider listener should reset inPitchSlider flag", () => {
            const block = activity.registeredBlocks["pitchslider"];
            logo.pitchSlider = new PitchSlider();

            block.flow(["test"], logo, 0, 0);

            const listener = logo.setTurtleListener.mock.calls[0][2];
            listener();

            expect(logo.pitchSlider.init).toHaveBeenCalledWith(activity);
            expect(logo.inPitchSlider).toBe(false);
        });

        it("status listener should reset inStatusMatrix flag", () => {
            const block = activity.registeredBlocks["status"];
            logo.statusMatrix = new StatusMatrix();

            block.flow(["test"], logo, 0, 0);

            const listener = logo.setTurtleListener.mock.calls[0][2];
            listener();

            expect(logo.statusMatrix.init).toHaveBeenCalledWith(activity);
            expect(logo.inStatusMatrix).toBe(false);
        });

        it("pitch drum matrix listener should show error when no drums", () => {
            const block = activity.registeredBlocks["pitchdrummatrix"];
            logo.pitchDrumMatrix = new PitchDrumMatrix();
            logo.pitchDrumMatrix.drums = [];
            logo.pitchDrumMatrix.rowLabels = [];

            block.flow(["test"], logo, 0, 0);

            const listener = logo.setTurtleListener.mock.calls[0][2];
            listener();

            expect(activity.errorMsg).toHaveBeenCalled();
        });

        it("arpeggio listener should initialize widget", () => {
            const block = activity.registeredBlocks["arpeggiomatrix"];
            logo.arpeggio = new Arpeggio();
            logo.arpeggio.notesToPlay = [1, 2, 3];

            block.flow([8, "test"], logo, 0, 0);

            const listener = logo.setTurtleListener.mock.calls[0][2];
            listener();

            expect(logo.arpeggio.init).toHaveBeenCalledWith(activity);
        });

        it("meter widget listener should create widget and reset flag", () => {
            const block = activity.registeredBlocks["meterwidget"];

            block.flow([4], logo, 0, 0);

            const listener = logo.setTurtleListener.mock.calls[0][2];
            listener();

            expect(MeterWidget).toHaveBeenCalledWith(activity, 0);
            expect(logo.insideMeterWidget).toBe(false);
        });

        it("oscilloscope listener should create widget and reset flag", () => {
            const block = activity.registeredBlocks["oscilloscope"];

            block.flow([4], logo, 0, 0);

            const listener = logo.setTurtleListener.mock.calls[0][2];
            listener();

            expect(Oscilloscope).toHaveBeenCalledWith(activity);
            expect(logo.inOscilloscope).toBe(false);
        });

        it("mode widget listener should create widget and reset flag", () => {
            const block = activity.registeredBlocks["modewidget"];

            block.flow([4], logo, 0, 0);

            const listener = logo.setTurtleListener.mock.calls[0][2];
            listener();

            expect(ModeWidget).toHaveBeenCalledWith(activity);
            expect(logo.insideModeWidget).toBe(false);
        });

        it("reflection listener should init widget and reset flag", () => {
            const block = activity.registeredBlocks["reflection"];
            logo.reflection = new ReflectionMatrix();

            block.flow(["test"], logo, 0, 0);

            const listener = logo.setTurtleListener.mock.calls[0][2];
            listener();

            expect(logo.reflection.init).toHaveBeenCalledWith(activity);
            expect(logo.inReflectionMatrix).toBe(false);
        });

        it("lego widget listener should show error when no row labels", () => {
            const block = activity.registeredBlocks["legobricks"];
            logo.legoWidget = new LegoWidget();
            logo.legoWidget.rowLabels = [];

            block.flow(["test"], logo, 0, 0);

            const listener = logo.setTurtleListener.mock.calls[0][2];
            listener();

            expect(activity.errorMsg).toHaveBeenCalled();
            expect(logo.inLegoWidget).toBe(false);
        });

        it("sampler listener should initialize widget", () => {
            const block = activity.registeredBlocks["sampler"];

            block.flow(["sample"], logo, 0, 0);

            const listener = logo.setTurtleListener.mock.calls[0][2];
            listener();

            expect(logo.sample.init).toHaveBeenCalledWith(activity);
        });

        it("aidebugger listener should initialize widget", () => {
            const block = activity.registeredBlocks["aidebugger"];

            block.flow(["test"], logo, 0, 0);

            const listener = logo.setTurtleListener.mock.calls[0][2];
            listener();

            expect(logo.sample.init).toHaveBeenCalledWith(activity);
        });
    });

    describe("Return Values", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("timbre block should return correct output", () => {
            const block = activity.registeredBlocks["timbre"];
            const result = block.flow(["guitar", "test"], logo, 0, 0);
            expect(result).toEqual(["test", 1]);
        });

        it("sampler block should return correct output", () => {
            const block = activity.registeredBlocks["sampler"];
            const result = block.flow(["sample"], logo, 0, 0);
            expect(result).toEqual(["sample", 1]);
        });

        it("pitch slider block should return correct output", () => {
            const block = activity.registeredBlocks["pitchslider"];
            const result = block.flow(["test"], logo, 0, 0);
            expect(result).toEqual(["test", 1]);
        });

        it("arpeggio block should return correct output", () => {
            const block = activity.registeredBlocks["arpeggiomatrix"];
            const result = block.flow([8, "test"], logo, 0, 0);
            expect(result).toEqual(["test", 1]);
        });

        it("status block should return correct output", () => {
            const block = activity.registeredBlocks["status"];
            const result = block.flow(["test"], logo, 0, 0);
            expect(result).toEqual(["test", 1]);
        });
    });

    describe("Filter Type Handling", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("should handle filter type by FILTERTYPES key", () => {
            const block = activity.registeredBlocks["filter"];
            const args = ["lowpass", -12, 440];

            logo.inTimbre = true;
            logo.timbre = new TimbreWidget();
            logo.timbre.instrumentName = "piano";
            instrumentsFilters[0] = {};

            block.flow(args, logo, 0, 0);

            expect(instrumentsFilters[0]["piano"]).toBeDefined();
        });

        it("should handle filter type by FILTERTYPES value", () => {
            const block = activity.registeredBlocks["filter"];
            const args = ["lowpass", -24, 440];

            logo.inTimbre = true;
            logo.timbre = new TimbreWidget();
            logo.timbre.instrumentName = "guitar";
            instrumentsFilters[0] = {};

            block.flow(args, logo, 0, 0);

            expect(instrumentsFilters[0]["guitar"]).toBeDefined();
        });

        it("should handle bandpass filter type", () => {
            const block = activity.registeredBlocks["filter"];
            const args = ["bandpass", -48, 880];

            logo.inTimbre = true;
            logo.timbre = new TimbreWidget();
            logo.timbre.instrumentName = "violin";
            instrumentsFilters[0] = {};

            block.flow(args, logo, 0, 0);

            expect(instrumentsFilters[0]["violin"]).toBeDefined();
        });

        it("should handle notch filter type", () => {
            const block = activity.registeredBlocks["filter"];
            const args = ["notch", -96, 660];

            logo.inTimbre = true;
            logo.timbre = new TimbreWidget();
            logo.timbre.instrumentName = "flute";
            instrumentsFilters[0] = {};

            block.flow(args, logo, 0, 0);

            expect(instrumentsFilters[0]["flute"]).toBeDefined();
        });

        it("should handle highpass filter type", () => {
            const block = activity.registeredBlocks["filter"];
            const args = ["highpass", -12, 1760];

            logo.inTimbre = true;
            logo.timbre = new TimbreWidget();
            logo.timbre.instrumentName = "trumpet";
            instrumentsFilters[0] = {};

            block.flow(args, logo, 0, 0);

            expect(instrumentsFilters[0]["trumpet"]).toBeDefined();
        });
    });

    describe("Macro Variations", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("should generate consistent macro for matrix block", () => {
            const block = activity.registeredBlocks["matrix"];
            const macro1 = block.macro(0, 0);
            const macro2 = block.macro(10, 20);

            expect(Array.isArray(macro1)).toBe(true);
            expect(Array.isArray(macro2)).toBe(true);
            expect(macro1[0][1]).toBe("matrix");
            expect(macro2[0][1]).toBe("matrix");
        });

        it("should generate macro for rhythm ruler blocks", () => {
            const block2 = activity.registeredBlocks["rhythmruler2"];
            const block3 = activity.registeredBlocks["rhythmruler3"];

            const macro2 = block2.macro(5, 15);
            const macro3 = block3.macro(8, 12);

            expect(Array.isArray(macro2)).toBe(true);
            expect(Array.isArray(macro3)).toBe(true);
        });

        it("should generate macro for music keyboard 2 block", () => {
            const block = activity.registeredBlocks["musickeyboard2"];
            const macro = block.macro(10, 10);

            expect(Array.isArray(macro)).toBe(true);
        });

        it("should generate macro for pitch staircase block", () => {
            const block = activity.registeredBlocks["pitchstaircase"];
            const macro = block.macro(15, 25);

            expect(Array.isArray(macro)).toBe(true);
            expect(macro[0][1]).toBe("pitchstaircase");
        });

        it("should generate macro for lego bricks block", () => {
            const block = activity.registeredBlocks["legobricks"];
            const macro = block.macro(20, 30);

            expect(Array.isArray(macro)).toBe(true);
            expect(macro[0][1]).toBe("legobricks");
        });

        it("should generate macro for reflection block", () => {
            const block = activity.registeredBlocks["reflection"];
            const macro = block.macro(3, 7);

            expect(Array.isArray(macro)).toBe(true);
            expect(macro[0][1]).toBe("reflection");
        });

        it("should generate macro for ai debugger block", () => {
            const block = activity.registeredBlocks["aidebugger"];
            const macro = block.macro(12, 18);

            expect(Array.isArray(macro)).toBe(true);
            expect(macro[0][1]).toBe("aidebugger");
        });
    });

    describe("Additional Edge Cases", () => {
        beforeEach(() => {
            setupWidgetBlocks(activity);
        });

        it("envelope block with minimum values", () => {
            const block = activity.registeredBlocks["envelope"];
            const args = [0, 0, 0, 0];

            logo.inTimbre = true;
            logo.timbre = new TimbreWidget();
            mockTurtle.singer.attack = [];
            mockTurtle.singer.decay = [];
            mockTurtle.singer.sustain = [];
            mockTurtle.singer.release = [];

            block.flow(args, logo, 0, 0);

            expect(mockTurtle.singer.attack).toContain(0);
        });

        it("envelope block with maximum values", () => {
            const block = activity.registeredBlocks["envelope"];
            const args = [100, 100, 100, 100];

            block.flow(args, logo, 0, 0);

            expect(mockTurtle.singer.release).toContain(1);
        });

        it("filter block with different instrument names", () => {
            const block = activity.registeredBlocks["filter"];

            logo.inTimbre = true;
            logo.timbre = new TimbreWidget();
            instrumentsFilters[0] = {};

            const instruments = ["piano", "guitar", "violin", "flute", "trumpet"];
            instruments.forEach(inst => {
                logo.timbre.instrumentName = inst;
                const args = ["lowpass", -12, 440];
                block.flow(args, logo, 0, 0);
                expect(instrumentsFilters[0][inst]).toBeDefined();
            });
        });

        it("sampler block initializes without listener", () => {
            const block = activity.registeredBlocks["sampler"];

            expect(logo.sample).toBeNull();
            const result = block.flow(["test"], logo, 0, 0);

            expect(result).toEqual(["test", 1]);
        });

        it("arpeggio block with boundary column values", () => {
            const block = activity.registeredBlocks["arpeggiomatrix"];

            logo.arpeggio = new Arpeggio();
            block.flow([2, "test"], logo, 0, 0);
            expect(logo.arpeggio.defaultCols).toBe(2);

            logo.arpeggio = new Arpeggio();
            block.flow([20, "test"], logo, 0, 0);
            expect(logo.arpeggio.defaultCols).toBe(20);
        });

        it("pitch slider block initializes correctly", () => {
            const block = activity.registeredBlocks["pitchslider"];

            expect(logo.inPitchSlider).toBe(false);
            const result = block.flow(["test"], logo, 0, 0);

            expect(logo.inPitchSlider).toBe(true);
            expect(result).toEqual(["test", 1]);
        });

        it("status block initializes correctly", () => {
            const block = activity.registeredBlocks["status"];

            expect(logo.inStatusMatrix).toBe(false);
            const result = block.flow(["test"], logo, 0, 0);

            expect(logo.inStatusMatrix).toBe(true);
            expect(result).toEqual(["test", 1]);
        });

        it("temperament block sets insideTemperament flag", () => {
            const block = activity.registeredBlocks["temperament"];

            expect(logo.insideTemperament).toBe(false);
            block.flow(["equal"], logo, 0, 0);

            expect(logo.insideTemperament).toBe(true);
        });

        it("timbre block initializes all effect arrays", () => {
            const block = activity.registeredBlocks["timbre"];
            const args = ["synth"];

            block.flow(args, logo, 0, 0);

            expect(logo.timbre.env).toEqual([]);
            expect(logo.timbre.fil).toEqual([]);
            expect(logo.timbre.osc).toEqual([]);
            expect(logo.timbre.tremoloEffect).toEqual([]);
            expect(logo.timbre.vibratoEffect).toEqual([]);
            expect(logo.timbre.chorusEffect).toEqual([]);
            expect(logo.timbre.phaserEffect).toEqual([]);
            expect(logo.timbre.distortionEffect).toEqual([]);
            expect(logo.timbre.AMSynthesizer).toEqual([]);
            expect(logo.timbre.FMSynthesizer).toEqual([]);
            expect(logo.timbre.duoSynthesizer).toEqual([]);
        });

        it("pitch drum matrix initializes all arrays", () => {
            const block = activity.registeredBlocks["pitchdrummatrix"];

            logo.pitchDrumMatrix = null;
            block.flow(["test"], logo, 0, 0);

            expect(logo.pitchDrumMatrix.rowLabels).toEqual([]);
            expect(logo.pitchDrumMatrix.rowArgs).toEqual([]);
            expect(logo.pitchDrumMatrix.drums).toEqual([]);
        });

        it("arpeggio block resets notes array", () => {
            const block = activity.registeredBlocks["arpeggiomatrix"];

            logo.arpeggio = new Arpeggio();
            logo.arpeggio.notesToPlay = [1, 2, 3, 4, 5];

            block.flow([8, "test"], logo, 0, 0);

            expect(logo.arpeggio.notesToPlay).toEqual([]);
        });

        it("filter block adds to timbre arrays", () => {
            const block = activity.registeredBlocks["filter"];
            const args = ["lowpass", -12, 440];

            logo.inTimbre = true;
            logo.timbre = new TimbreWidget();
            logo.timbre.instrumentName = "test";
            instrumentsFilters[0] = {};

            expect(logo.timbre.fil.length).toBe(0);
            block.flow(args, logo, 0, 0);
            expect(logo.timbre.fil.length).toBeGreaterThan(0);
        });

        it("envelope block adds to timbre arrays when inTimbre", () => {
            const block = activity.registeredBlocks["envelope"];
            const args = [25, 25, 25, 25];

            logo.inTimbre = true;
            logo.timbre = new TimbreWidget();
            mockTurtle.singer.attack = [];
            mockTurtle.singer.decay = [];
            mockTurtle.singer.sustain = [];
            mockTurtle.singer.release = [];

            block.flow(args, logo, 0, 0);

            expect(logo.timbre.synthVals.envelope.attack).toBe(0.25);
            expect(logo.timbre.synthVals.envelope.decay).toBe(0.25);
        });

        it("filter block with all rolloff values", () => {
            const block = activity.registeredBlocks["filter"];
            const rolloffs = [-12, -24, -48, -96];

            logo.inTimbre = true;
            logo.timbre = new TimbreWidget();
            instrumentsFilters[0] = {};

            rolloffs.forEach(rolloff => {
                logo.timbre.instrumentName = `inst_${rolloff}`;
                activity.errorMsg.mockClear();
                const args = ["lowpass", rolloff, 440];
                block.flow(args, logo, 0, 0);
                expect(activity.errorMsg).not.toHaveBeenCalled();
            });
        });

        it("envelope block with mixed valid values", () => {
            const block = activity.registeredBlocks["envelope"];
            const testCases = [
                [10, 20, 30, 40],
                [50, 50, 50, 50],
                [1, 2, 3, 4],
                [99, 98, 97, 96]
            ];

            testCases.forEach(args => {
                activity.errorMsg.mockClear();
                block.flow(args, logo, 0, 0);
                expect(activity.errorMsg).not.toHaveBeenCalled();
            });
        });

        it("pitch drum matrix block creates instance correctly", () => {
            const block = activity.registeredBlocks["pitchdrummatrix"];

            expect(logo.pitchDrumMatrix).toBeNull();
            expect(logo.inPitchDrumMatrix).toBe(false);

            block.flow(["test"], logo, 0, 0);

            expect(logo.pitchDrumMatrix).toBeDefined();
            expect(logo.inPitchDrumMatrix).toBe(true);
        });

        it("arpeggio block with very small column value", () => {
            const block = activity.registeredBlocks["arpeggiomatrix"];

            logo.arpeggio = new Arpeggio();
            logo.arpeggio.defaultCols = 8;

            block.flow([1, "test"], logo, 0, 0);

            expect(logo.arpeggio.defaultCols).toBe(8);
        });

        it("arpeggio block with very large column value", () => {
            const block = activity.registeredBlocks["arpeggiomatrix"];

            logo.arpeggio = new Arpeggio();
            logo.arpeggio.defaultCols = 8;

            block.flow([100, "test"], logo, 0, 0);

            expect(logo.arpeggio.defaultCols).toBe(8);
        });

        it("filter block with high frequency value", () => {
            const block = activity.registeredBlocks["filter"];
            const args = ["lowpass", -12, 22000];

            logo.inTimbre = true;
            logo.timbre = new TimbreWidget();
            logo.timbre.instrumentName = "test";
            instrumentsFilters[0] = {};

            block.flow(args, logo, 0, 0);

            expect(instrumentsFilters[0]["test"]).toBeDefined();
        });

        it("filter block with zero frequency value", () => {
            const block = activity.registeredBlocks["filter"];
            const args = ["lowpass", -12, 0];

            logo.inTimbre = true;
            logo.timbre = new TimbreWidget();
            logo.timbre.instrumentName = "test";
            instrumentsFilters[0] = {};

            block.flow(args, logo, 0, 0);

            expect(instrumentsFilters[0]["test"]).toBeDefined();
        });

        it("sampler block parameter property is set", () => {
            const block = activity.registeredBlocks["sampler"];

            expect(block.parameter).toBe(true);
        });

        it("ai debugger block parameter property is set", () => {
            const block = activity.registeredBlocks["aidebugger"];

            expect(block.parameter).toBe(true);
            expect(block.isBeginner).toBe(true);
        });

        it("pitch slider block is beginner block", () => {
            const block = activity.registeredBlocks["pitchslider"];

            expect(block.isBeginner).toBe(true);
        });

        it("status block is beginner block", () => {
            const block = activity.registeredBlocks["status"];

            expect(block.isBeginner).toBe(true);
        });

        it("matrix block is beginner block", () => {
            const block = activity.registeredBlocks["matrix"];

            expect(block.isBeginner).toBe(true);
        });

        it("temperament block has correct palette", () => {
            const block = activity.registeredBlocks["temperament"];

            expect(block.palette).toBe("widgets");
        });

        it("filter block has hidden property", () => {
            const block = activity.registeredBlocks["filter"];

            expect(block.hidden).toBe(true);
        });

        it("envelope block has hidden property", () => {
            const block = activity.registeredBlocks["envelope"];

            expect(block.hidden).toBe(true);
        });

        it("reflection block is beginner block", () => {
            const block = activity.registeredBlocks["reflection"];

            expect(block.isBeginner).toBe(true);
        });

        it("lego bricks block is beginner block", () => {
            const block = activity.registeredBlocks["legobricks"];

            expect(block.isBeginner).toBe(true);
        });

        it("tempo block is beginner block", () => {
            const block = activity.registeredBlocks["tempo"];

            expect(block.isBeginner).toBe(true);
        });

        it("mode widget block is beginner block", () => {
            const block = activity.registeredBlocks["modewidget"];

            expect(block.isBeginner).toBe(true);
        });

        it("music keyboard 2 block is beginner block", () => {
            const block = activity.registeredBlocks["musickeyboard2"];

            expect(block.isBeginner).toBe(true);
        });

        it("pitch staircase block is beginner block", () => {
            const block = activity.registeredBlocks["pitchstaircase"];

            expect(block.isBeginner).toBe(true);
        });

        it("meter widget block flow sets insideMeterWidget flag", () => {
            const block = activity.registeredBlocks["meterwidget"];

            logo.insideMeterWidget = false;
            block.flow(["arg"], logo, 0, 0);

            expect(logo.insideMeterWidget).toBe(true);
            expect(logo.setDispatchBlock).toHaveBeenCalledWith(0, 0, "_meterwidget_0");
        });

        it("meter widget block returns correct output", () => {
            const block = activity.registeredBlocks["meterwidget"];

            const result = block.flow(["test"], logo, 0, 0);

            expect(result).toEqual(["test", 1]);
        });

        it("oscilloscope block flow initializes oscilloscopeTurtles", () => {
            const block = activity.registeredBlocks["oscilloscope"];

            block.flow(["arg"], logo, 0, 0);

            expect(logo.oscilloscopeTurtles).toEqual([]);
            expect(logo.inOscilloscope).toBe(true);
        });

        it("oscilloscope block returns correct output", () => {
            const block = activity.registeredBlocks["oscilloscope"];

            const result = block.flow(["test"], logo, 0, 0);

            expect(result).toEqual(["test", 1]);
        });

        it("chromatic block has flow method", () => {
            const block = activity.registeredBlocks["chromatic"];

            expect(typeof block.flow).toBe("function");
            expect(block.flow()).toBeUndefined();
        });

        it("music keyboard 2 block has correct properties", () => {
            const block = activity.registeredBlocks["musickeyboard2"];

            expect(block).toBeDefined();
            expect(block.name).toBe("musickeyboard2");
            expect(block.isBeginner).toBe(true);
        });

        it("music keyboard block initializes keyboard arrays", () => {
            const block = activity.registeredBlocks["musickeyboard"];

            global.MusicKeyboard = jest.fn().mockImplementation(() => ({
                init: jest.fn(),
                blockNo: null,
                instruments: [],
                noteNames: [],
                octaves: [],
                _rowBlocks: []
            }));

            logo.musicKeyboard = null;
            block.flow(["arg"], logo, 0, 0);

            expect(logo.musicKeyboard).toBeDefined();
            expect(logo.inMusicKeyboard).toBe(true);
        });

        it("music keyboard block returns correct output", () => {
            const block = activity.registeredBlocks["musickeyboard"];

            global.MusicKeyboard = jest.fn().mockImplementation(() => ({
                init: jest.fn(),
                blockNo: null,
                instruments: [],
                noteNames: [],
                octaves: [],
                _rowBlocks: []
            }));

            logo.musicKeyboard = null;
            const result = block.flow(["test"], logo, 0, 0);

            expect(result).toEqual(["test", 1]);
        });

        it("pitch staircase block initializes staircase arrays", () => {
            const block = activity.registeredBlocks["pitchstaircase"];

            global.PitchStaircase = jest.fn().mockImplementation(() => ({
                init: jest.fn(),
                Stairs: [],
                stairPitchBlocks: []
            }));

            logo.pitchStaircase = null;
            block.flow(["arg"], logo, 0, 0);

            expect(logo.pitchStaircase).toBeDefined();
            expect(logo.inPitchStaircase).toBe(true);
        });

        it("pitch staircase block returns correct output", () => {
            const block = activity.registeredBlocks["pitchstaircase"];

            global.PitchStaircase = jest.fn().mockImplementation(() => ({
                init: jest.fn(),
                Stairs: [],
                stairPitchBlocks: []
            }));

            logo.pitchStaircase = null;
            const result = block.flow(["test"], logo, 0, 0);

            expect(result).toEqual(["test", 1]);
        });

        it("rhythm ruler 2 block initializes rhythm ruler", () => {
            const block = activity.registeredBlocks["rhythmruler2"];

            global.RhythmRuler = jest.fn().mockImplementation(() => ({
                init: jest.fn(),
                Rulers: [],
                Drums: []
            }));

            logo.rhythmRuler = null;
            block.flow(["arg"], logo, 0, 0);

            expect(logo.rhythmRuler).toBeDefined();
            expect(logo.inRhythmRuler).toBe(true);
        });

        it("rhythm ruler 2 block returns correct output", () => {
            const block = activity.registeredBlocks["rhythmruler2"];

            global.RhythmRuler = jest.fn().mockImplementation(() => ({
                init: jest.fn(),
                Rulers: [],
                Drums: []
            }));

            const result = block.flow(["test"], logo, 0, 0);

            expect(result).toEqual(["test", 1]);
        });

        it("rhythm ruler 3 block has correct properties", () => {
            const block = activity.registeredBlocks["rhythmruler3"];

            expect(block).toBeDefined();
            expect(block.name).toBe("rhythmruler3");
            expect(block.isBeginner).toBe(true);
        });

        it("reflection block initializes reflection matrix", () => {
            const block = activity.registeredBlocks["reflection"];

            global.ReflectionMatrix = jest.fn().mockImplementation(() => ({
                init: jest.fn()
            }));

            logo.reflection = null;
            block.flow(["arg"], logo, 0, 0);

            expect(logo.reflection).toBeDefined();
            expect(logo.inReflectionMatrix).toBe(true);
        });

        it("meter widget listener creates widget and resets flag", () => {
            const block = activity.registeredBlocks["meterwidget"];

            logo.insideMeterWidget = true;
            block.flow(["arg"], logo, 0, 0);

            const listener = logo.setTurtleListener.mock.calls[0][2];
            listener();

            expect(MeterWidget).toHaveBeenCalledWith(activity, 0);
            expect(logo.insideMeterWidget).toBe(false);
        });

        it("oscilloscope listener creates widget and resets flag", () => {
            const block = activity.registeredBlocks["oscilloscope"];

            logo.inOscilloscope = true;
            block.flow(["arg"], logo, 0, 0);

            const listener = logo.setTurtleListener.mock.calls[0][2];
            listener();

            expect(Oscilloscope).toHaveBeenCalledWith(activity);
            expect(logo.inOscilloscope).toBe(false);
        });

        it("music keyboard listener initializes keyboard", () => {
            const block = activity.registeredBlocks["musickeyboard"];

            const mockKeyboard = {
                init: jest.fn(),
                blockNo: null,
                instruments: [],
                noteNames: [],
                octaves: [],
                _rowBlocks: []
            };

            global.MusicKeyboard = jest.fn().mockImplementation(() => mockKeyboard);

            logo.musicKeyboard = null;
            block.flow(["arg"], logo, 0, 0);

            const listener = logo.setTurtleListener.mock.calls[0][2];
            listener();

            expect(mockKeyboard.init).toHaveBeenCalledWith(logo);
        });

        it("pitch staircase listener initializes widget and resets flag", () => {
            const block = activity.registeredBlocks["pitchstaircase"];

            const mockStaircase = {
                init: jest.fn(),
                Stairs: [],
                stairPitchBlocks: []
            };

            global.PitchStaircase = jest.fn().mockImplementation(() => mockStaircase);

            logo.pitchStaircase = null;
            logo.inPitchStaircase = true;
            block.flow(["arg"], logo, 0, 0);

            const listener = logo.setTurtleListener.mock.calls[0][2];
            listener();

            expect(mockStaircase.init).toHaveBeenCalledWith(activity);
            expect(logo.inPitchStaircase).toBe(false);
        });

        it("rhythm ruler listener initializes widget", () => {
            const block = activity.registeredBlocks["rhythmruler2"];

            const mockRuler = {
                init: jest.fn(),
                Rulers: [],
                Drums: []
            };

            global.RhythmRuler = jest.fn().mockImplementation(() => mockRuler);

            block.flow(["arg"], logo, 0, 0);

            const listener = logo.setTurtleListener.mock.calls[0][2];
            listener();

            expect(mockRuler.init).toHaveBeenCalledWith(activity);
        });

        it("reflection listener initializes widget and resets flag", () => {
            const block = activity.registeredBlocks["reflection"];

            const mockReflection = {
                init: jest.fn()
            };

            global.ReflectionMatrix = jest.fn().mockImplementation(() => mockReflection);

            logo.reflection = null;
            logo.inReflectionMatrix = true;
            block.flow(["arg"], logo, 0, 0);

            const listener = logo.setTurtleListener.mock.calls[0][2];
            listener();

            expect(mockReflection.init).toHaveBeenCalledWith(activity);
            expect(logo.inReflectionMatrix).toBe(false);
        });

        it("tempo block initializes BPM arrays", () => {
            const block = activity.registeredBlocks["tempo"];

            logo.tempo = new Tempo();
            logo.tempo.BPMBlocks = [1, 2, 3];
            logo.tempo.BPMs = [90, 120];

            const result = block.flow(["arg"], logo, 0, 0);

            expect(logo.tempo.BPMBlocks).toEqual([]);
            expect(logo.tempo.BPMs).toEqual([]);
            expect(result).toEqual(["arg", 1]);
        });

        it("tempo block creates tempo if null", () => {
            const block = activity.registeredBlocks["tempo"];

            logo.tempo = null;
            block.flow(["arg"], logo, 0, 0);

            expect(logo.tempo).toBeDefined();
            expect(logo.inTempo).toBe(true);
        });

        it("mode widget listener creates widget and resets flag", () => {
            const block = activity.registeredBlocks["modewidget"];

            logo.insideModeWidget = true;
            block.flow(["arg"], logo, 0, 0);

            const listener = logo.setTurtleListener.mock.calls[0][2];
            listener();

            expect(ModeWidget).toHaveBeenCalledWith(activity);
            expect(logo.insideModeWidget).toBe(false);
        });

        it("meterwidget block has makeMacro method", () => {
            const block = activity.registeredBlocks["meterwidget"];

            expect(block.macro).toBeDefined();
            expect(typeof block.macro).toBe("function");
        });

        it("oscilloscope block has makeMacro method", () => {
            const block = activity.registeredBlocks["oscilloscope"];

            expect(block.macro).toBeDefined();
            expect(typeof block.macro).toBe("function");
        });

        it("chromatic block has makeMacro method", () => {
            const block = activity.registeredBlocks["chromatic"];

            expect(block.macro).toBeDefined();
            expect(typeof block.macro).toBe("function");
        });

        it("rhythm ruler 2 block is hidden in beginner mode", () => {
            const block = activity.registeredBlocks["rhythmruler2"];

            expect(block.hidden).toBe(false);
        });

        it("rhythm ruler 3 block is not hidden in beginner mode", () => {
            const block = activity.registeredBlocks["rhythmruler3"];

            expect(block.hidden).toBe(true);
        });

        it("envelope block with non-numeric arguments", () => {
            const block = activity.registeredBlocks["envelope"];
            const args = ["string", 50, 60, 1];

            block.flow(args, logo, 0, 0);

            expect(mockTurtle.singer.attack.length).toBe(0);
        });

        it("filter block does not require timbre", () => {
            const block = activity.registeredBlocks["filter"];

            logo.inTimbre = false;
            instrumentsFilters[0] = {};

            expect(() => {
                block.flow(["lowpass", -12, 440], logo, 0, 0);
            }).not.toThrow();
        });

        it("temperament block listener initializes widget with scale", () => {
            const block = activity.registeredBlocks["temperament"];

            const mockTemperament = new TemperamentWidget();
            logo.temperament = mockTemperament;

            block.flow(["equal"], logo, 0, 0);

            const listener = logo.setTurtleListener.mock.calls[0][2];
            listener();

            expect(mockTemperament.init).toHaveBeenCalledWith(activity);
        });

        it("matrix block sets phraseMaker lyricsON to false", () => {
            const block = activity.registeredBlocks["matrix"];

            logo.phraseMaker = null;
            block.flow(["arg"], logo, 0, 0);

            expect(logo.phraseMaker.lyricsON).toBe(false);
        });

        it("matrix listener processes tuplet rhythms with notes case", () => {
            const block = activity.registeredBlocks["matrix"];

            logo.phraseMaker = null;

            block.flow(["arg"], logo, 0, 0);

            logo.tupletRhythms = [["notes", 0, "c", 4, "1/4"]];
            logo.tupletParams = [[1, 4]];
            logo.phraseMaker.rowLabels = ["pitch1"];

            const listener = logo.setTurtleListener.mock.calls[0][2];
            listener();

            expect(logo.phraseMaker.addTuplet).toHaveBeenCalled();
            expect(logo.phraseMaker.makeClickable).toHaveBeenCalled();
        });

        it("matrix listener processes tuplet rhythms with simple case", () => {
            const block = activity.registeredBlocks["matrix"];

            logo.phraseMaker = null;

            block.flow(["arg"], logo, 0, 0);

            logo.tupletRhythms = [["simple", 0, "c", 4]];
            logo.tupletParams = [[1, 4]];
            logo.phraseMaker.rowLabels = ["pitch1"];

            const listener = logo.setTurtleListener.mock.calls[0][2];
            listener();

            expect(logo.phraseMaker.addTuplet).toHaveBeenCalled();
        });

        it("matrix listener processes tuplet rhythms default case", () => {
            const block = activity.registeredBlocks["matrix"];

            logo.phraseMaker = null;

            block.flow(["arg"], logo, 0, 0);

            logo.tupletRhythms = [["rhythm", 4, 1]];
            logo.tupletParams = [[1, 4]];
            logo.phraseMaker.rowLabels = ["pitch1"];

            const listener = logo.setTurtleListener.mock.calls[0][2];
            listener();

            expect(logo.phraseMaker.addNotes).toHaveBeenCalledWith(4, 1);
        });

        it("lego widget listener with row labels initializes widget", () => {
            const block = activity.registeredBlocks["legobricks"];

            logo.legoWidget = null;
            logo.inLegoWidget = false;

            block.flow(["arg"], logo, 0, 0);
            logo.legoWidget.rowLabels = ["pitch1", "pitch2"];

            const listener = logo.setTurtleListener.mock.calls[0][2];
            listener();

            expect(logo.legoWidget.init).toHaveBeenCalledWith(activity);
            expect(logo.inLegoWidget).toBe(false);
        });
    });
});
