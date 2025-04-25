/**
 * MusicBlocks v3.6.2
 *
 * @author Alok Dangre
 *
 * @copyright 2025 Alok Dangre
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

global._ = (s) => s;
global.NOINPUTERRORMSG = "No input error";
global.DEFAULTOSCILLATORTYPE = "defaultOsc";
global.OSCTYPES = {
    triangle: ["triangle", "triangle"],
    sine: ["sine", "sine"]
};
global.DEFAULTVOICE = "defaultVoice";

class DummyFlowBlock {
    constructor(type, label) {
        this.type = type;
        this.label = label;
    }
    setPalette(palette, activity) {
        this.palette = palette;
        this.activity = activity;
    }
    setHelpString(help) {
        this.help = help;
    }
    formBlock(opts) {
        this.form = opts;
    }
    setup(activity) {
        if (!activity.blockInstances) {
            activity.blockInstances = {};
        }
        activity.blockInstances[this.type] = this;
        if (!activity.blockTypes) activity.blockTypes = [];
        activity.blockTypes.push(this.type);
    }
    beginnerBlock(bool) {
        this.beginner = bool;
    }
    makeMacro(fn) {
        this.macro = fn;
    }
}

class DummyValueBlock extends DummyFlowBlock {
    constructor(type, label) {
        super(type, label);
    }
}

class DummyFlowClampBlock extends DummyFlowBlock {
    constructor(type) {
        super(type, type);
    }
}

class DummyLeftBlock extends DummyFlowBlock {
    constructor(type, label) {
        super(type, label);
    }
}

global.FlowBlock = DummyFlowBlock;
global.ValueBlock = DummyValueBlock;
global.FlowClampBlock = DummyFlowClampBlock;
global.LeftBlock = DummyLeftBlock;

global.last = (arr) => (arr && arr.length ? arr[arr.length - 1] : undefined);

global.Singer = {
    ToneActions: {
        defDuoSynth: jest.fn(),
        defAMSynth: jest.fn(),
        defFMSynth: jest.fn(),
        doHarmonic: jest.fn(),
        doDistortion: jest.fn(),
        doTremolo: jest.fn(),
        doPhaser: jest.fn(),
        doChorus: jest.fn(),
        doVibrato: jest.fn(),
        setTimbre: jest.fn()
    }
};

global.instrumentsEffects = {};
global.VOICENAMES = {
    violin: ["violin", "violin"],
    piano: ["piano", "piano"]
};
global.DRUMNAMES = {
    drum: ["drum", "drum"]
};

const createMockActivity = () => {
    const turtleStore = {};
    return {
        blockTypes: [],
        blockInstances: {},
        turtles: {
            ithTurtle: jest.fn((t) => {
                if (!turtleStore[t]) {
                    turtleStore[t] = {
                        singer: {
                            inHarmonic: [],
                            partials: [],
                            distortionAmount: [],
                            tremoloFrequency: [],
                            tremoloDepth: [],
                            rate: [],
                            octaves: [],
                            baseFrequency: [],
                            chorusRate: [],
                            delayTime: [],
                            chorusDepth: [],
                            instrumentNames: [],
                            voices: []
                        }
                    };
                }
                return turtleStore[t];
            })
        },
        blocks: {
            blockList: {},
            updateBlockText: jest.fn()
        },
        errorMsg: jest.fn()
    };
};

const createMockLogo = (opts = {}) => {
    return {
        inTimbre: opts.inTimbre !== undefined ? opts.inTimbre : true,
        inRhythmRuler: opts.inRhythmRuler || false,
        inSample: opts.inSample || false,
        timbre: {
            osc: [],
            oscParams: [],
            distortionEffect: [],
            distortionParams: [],
            tremoloEffect: [],
            tremoloParams: [],
            phaserEffect: [],
            phaserParams: [],
            chorusEffect: [],
            chorusParams: [],
            instrumentName: "testInstrument",
            synthVals: undefined
        },
        synth: {
            createSynth: jest.fn()
        },
        setDispatchBlock: jest.fn(),
        setTurtleListener: jest.fn(),
        statusFields: [],
        sample: {},
        stopTurtle: false
    };
};

const { setupToneBlocks } = require("../ToneBlocks");

describe("setupToneBlocks", () => {
    let activity;
    let logo;

    beforeEach(() => {
        activity = createMockActivity();
        logo = createMockLogo();
        global.instrumentsEffects[0] = {};
        global.instrumentsEffects[0][logo.timbre.instrumentName] = {};
        setupToneBlocks(activity);
    });

    const getBlock = (type) => activity.blockInstances[type];

    describe("OscillatorBlock", () => {
        it("should create synth if no oscillator exists", () => {
            const oscBlock = getBlock("oscillator");
            logo.timbre.osc = [];
            const args = ["triangle", 6];
            oscBlock.flow(args, logo, 0, "oscBlk");
            expect(logo.synth.createSynth).toHaveBeenCalledWith(
                0,
                logo.timbre.instrumentName,
                "triangle",
                logo.timbre.synthVals
            );
            expect(logo.timbre.osc).toContain("oscBlk");
            expect(logo.timbre.oscParams).toEqual(["triangle", 6]);
        });

        it("should not create synth if oscillator exists and show error", () => {
            logo.timbre.osc = ["existingOsc"];
            const oscBlock = getBlock("oscillator");
            const args = ["sine", 8];
            oscBlock.flow(args, logo, 0, "oscBlk2");
            expect(activity.errorMsg).toHaveBeenCalledWith(
                "You are adding multiple oscillator blocks."
            );
            expect(logo.timbre.osc).toContain("existingOsc");
        });
    });

    describe("FillerTypeBlock and OscillatorTypeBlock", () => {
        it("should setup filler type block (value block)", () => {
            const filler = getBlock("filtertype");
            expect(activity.blockTypes).toContain("filtertype");
            expect(filler.form).toEqual({ outType: "textout" });
        });
        it("should setup oscillator type block (value block)", () => {
            const oscType = getBlock("oscillatortype");
            expect(activity.blockTypes).toContain("oscillatortype");
            expect(oscType.form).toEqual({ outType: "textout" });
        });
    });

    describe("DuoSynthBlock", () => {
        it("should call defDuoSynth with proper arguments", () => {
            const duoSynth = getBlock("duosynth");
            const args = [10, 5];
            duoSynth.flow(args, logo, 0, "duoBlk");
            expect(Singer.ToneActions.defDuoSynth).toHaveBeenCalledWith(10, 5, 0, "duoBlk");
        });
    });

    describe("AMSynth", () => {
        it("should call defAMSynth with proper argument", () => {
            const amSynth = getBlock("amsynth");
            const args = [1];
            amSynth.flow(args, logo, 0, "amBlk");
            expect(Singer.ToneActions.defAMSynth).toHaveBeenCalledWith(1, 0, "amBlk");
        });
    });

    describe("FMSynth", () => {
        it("should call defFMSynth with proper argument", () => {
            const fmSynth = getBlock("fmsynth");
            const args = [10];
            fmSynth.flow(args, logo, 0, "fmBlk");
            expect(Singer.ToneActions.defFMSynth).toHaveBeenCalledWith(10, 0, "fmBlk");
        });
    });

    describe("PartialBlock", () => {
        it("should error and stop turtle if weight is out of range", () => {
            const partial = getBlock("partial");
            partial.flow([1.5], logo, 0, "partialBlk");
            expect(activity.errorMsg).toHaveBeenCalledWith(
                "Partial weight must be between 0 and 1."
            );
            expect(logo.stopTurtle).toBe(true);
        });

        it("should update partial in harmonic when inHarmonic is non-empty", () => {
            const partial = getBlock("partial");
            const args = [0.5];
            const turtle = 0;
            const tur = activity.turtles.ithTurtle(turtle);
            tur.singer.inHarmonic.push("dummyHarmonic");
            tur.singer.partials.push([]);
            partial.flow(args, logo, turtle, "partialBlk2");
            expect(tur.singer.partials[tur.singer.partials.length - 1]).toContain(0.5);
        });

        it("should error if no harmonic context exists", () => {
            const partial = getBlock("partial");
            const args = [0.3];
            const turtle = 0;
            const tur = activity.turtles.ithTurtle(turtle);
            expect(tur.singer.inHarmonic.length).toBe(0);
            partial.flow(args, logo, turtle, "partialBlk3");
            expect(activity.errorMsg).toHaveBeenCalledWith(
                "Partial block should be used inside of a Weighted-partials block."
            );
        });
    });

    describe("HarmonicBlock", () => {
        it("should push block onto harmonic stack and set listener", () => {
            const harmonic = getBlock("harmonic");
            const args = [42];
            const ret = harmonic.flow(args, logo, 0, "harmonicBlk");
            const tur = activity.turtles.ithTurtle(0);
            expect(tur.singer.inHarmonic).toContain("harmonicBlk");
            expect(tur.singer.partials).toContainEqual([]);
            expect(logo.setDispatchBlock).toHaveBeenCalledWith(
                "harmonicBlk",
                0,
                expect.stringContaining("_harmonic_")
            );
            expect(ret).toEqual([42, 1]);
        });
    });

    describe("Harmonic2Block", () => {
        it("should call doHarmonic and return proper flow", () => {
            const harmonic2 = getBlock("harmonic2");
            const args = [7, 1];
            const ret = harmonic2.flow(args, logo, 0, "harmonic2Blk");
            expect(Singer.ToneActions.doHarmonic).toHaveBeenCalledWith(7, 0, "harmonic2Blk");
            expect(ret).toEqual([1, 1]);
        });
    });

    describe("DisBlock", () => {
        it("should call doDistortion and update distortion effect if in timbre", () => {
            const dis = getBlock("dis");
            const args = [40, 1];
            const turtle = 0;
            const tur = activity.turtles.ithTurtle(turtle);
            tur.singer.distortionAmount = [0.5];
            logo.inTimbre = true;
            const ret = dis.flow(args, logo, turtle, "disBlk");
            expect(Singer.ToneActions.doDistortion).toHaveBeenCalledWith(40, turtle, "disBlk");
            expect(
                global.instrumentsEffects[turtle][logo.timbre.instrumentName].distortionActive
            ).toBe(true);
            expect(logo.timbre.distortionEffect).toContain("disBlk");
            expect(logo.timbre.distortionParams).toContain(0.5 * 100);
            expect(
                global.instrumentsEffects[turtle][logo.timbre.instrumentName].distortionAmount
            ).toEqual(40);
            expect(ret).toEqual([1, 1]);
        });
    });

    describe("TremoloBlock", () => {
        it("should call doTremolo and update tremolo effect if in timbre", () => {
            const tremolo = getBlock("tremolo");
            const args = [10, 50, 99];
            const turtle = 0;
            const tur = activity.turtles.ithTurtle(turtle);
            tur.singer.tremoloFrequency = [5];
            tur.singer.tremoloDepth = [0.7];
            logo.inTimbre = true;
            const ret = tremolo.flow(args, logo, turtle, "tremoloBlk");
            expect(Singer.ToneActions.doTremolo).toHaveBeenCalledWith(10, 50, turtle, "tremoloBlk");
            expect(
                global.instrumentsEffects[turtle][logo.timbre.instrumentName].tremoloActive
            ).toBe(true);
            expect(logo.timbre.tremoloEffect).toContain("tremoloBlk");
            expect(logo.timbre.tremoloParams).toContain(5);
            expect(logo.timbre.tremoloParams).toContain(0.7 * 100);
            expect(
                global.instrumentsEffects[turtle][logo.timbre.instrumentName].tremoloFrequency
            ).toEqual(10);
            expect(
                global.instrumentsEffects[turtle][logo.timbre.instrumentName].tremoloDepth
            ).toEqual(50);
            expect(ret).toEqual([99, 1]);
        });
    });

    describe("PhaserBlock", () => {
        it("should call doPhaser and update phaser effect if in timbre", () => {
            const phaser = getBlock("phaser");
            const args = [0.5, 3, 392, 88];
            const turtle = 0;
            const tur = activity.turtles.ithTurtle(turtle);
            tur.singer.rate = [0.5];
            tur.singer.octaves = [3];
            tur.singer.baseFrequency = [392];
            logo.inTimbre = true;
            const ret = phaser.flow(args, logo, turtle, "phaserBlk");
            expect(Singer.ToneActions.doPhaser).toHaveBeenCalledWith(
                0.5,
                3,
                392,
                turtle,
                "phaserBlk"
            );
            expect(global.instrumentsEffects[turtle][logo.timbre.instrumentName].phaserActive).toBe(
                true
            );
            expect(logo.timbre.phaserEffect).toContain("phaserBlk");
            expect(logo.timbre.phaserParams).toContain(0.5);
            expect(logo.timbre.phaserParams).toContain(3);
            expect(logo.timbre.phaserParams).toContain(392);
            expect(ret).toEqual([88, 1]);
        });
    });

    describe("ChorusBlock", () => {
        it("should call doChorus and update chorus effect if in timbre", () => {
            const chorus = getBlock("chorus");
            const args = [1.5, 3.5, 70, 77];
            const turtle = 0;
            const tur = activity.turtles.ithTurtle(turtle);
            tur.singer.chorusRate = [1.5];
            tur.singer.delayTime = [3.5];
            tur.singer.chorusDepth = [0.7];
            logo.inTimbre = true;
            const ret = chorus.flow(args, logo, turtle, "chorusBlk");
            expect(Singer.ToneActions.doChorus).toHaveBeenCalledWith(
                1.5,
                3.5,
                70,
                turtle,
                "chorusBlk"
            );
            expect(global.instrumentsEffects[turtle][logo.timbre.instrumentName].chorusActive).toBe(
                true
            );
            expect(logo.timbre.chorusEffect).toContain("chorusBlk");
            expect(logo.timbre.chorusParams).toContain(1.5);
            expect(logo.timbre.chorusParams).toContain(3.5);
            expect(logo.timbre.chorusParams).toContain(0.7 * 100);
            expect(ret).toEqual([77, 1]);
        });
    });

    describe("VibratoBlock", () => {
        it("should call doVibrato and return correct flow", () => {
            const vibrato = getBlock("vibrato");
            const args = [5, 1 / 16, 33];
            const ret = vibrato.flow(args, logo, 0, "vibratoBlk");
            expect(Singer.ToneActions.doVibrato).toHaveBeenCalledWith(5, 1 / 16, 0, "vibratoBlk");
            expect(ret).toEqual([33, 1]);
        });
    });

    describe("SetVoiceBlock", () => {
        it("should push valid voice into turtle's voices and set listener", () => {
            const setVoice = getBlock("setvoice");
            const args = ["violin", 44];
            const turtle = 0;
            const tur = activity.turtles.ithTurtle(turtle);
            setVoice.flow(args, logo, turtle, "setVoiceBlk");
            expect(tur.singer.voices).toContain("violin");
            expect(logo.setDispatchBlock).toHaveBeenCalledWith(
                "setVoiceBlk",
                turtle,
                expect.stringMatching("_setvoice_")
            );
        });
        it("should error if provided voice is not found", () => {
            const setVoice = getBlock("setvoice");
            const args = ["nonexistent", 55];
            setVoice.flow(args, logo, 0, "setVoiceBlk2");
            expect(activity.errorMsg).toHaveBeenCalledWith("No input error", "setVoiceBlk2");
        });
    });

    describe("SynthNameBlock", () => {
        it("should push status field if inStatusMatrix and connection is print", () => {
            activity.blocks.blockList["blkPrint"] = { name: "print" };
            activity.blocks.blockList["synthNameBlk"] = { connections: ["blkPrint"] };
            const synthName = getBlock("synthname");
            logo.inStatusMatrix = true;
            synthName.arg(logo, 0, "synthNameBlk");
            expect(logo.statusFields).toContainEqual(["synthNameBlk", "synthname"]);
        });
        it("should return last instrument name otherwise", () => {
            const synthName = getBlock("synthname");
            const turtle = 0;
            const tur = activity.turtles.ithTurtle(turtle);
            tur.singer.instrumentNames = ["first", "second"];
            const retVal = synthName.arg(logo, turtle, "synthNameBlk2");
            expect(retVal).toEqual("second");
        });
    });

    describe("SetDefaultVoiceBlock", () => {
        it("should error if argument is null", () => {
            const setDefVoice = getBlock("setdefaultinstrument");
            setDefVoice.flow([null], logo, 0, "setDefVoiceBlk");
            expect(activity.errorMsg).toHaveBeenCalledWith("No input error", "setDefVoiceBlk");
        });
        it("should update default instrument name", () => {
            const setDefVoice = getBlock("setdefaultinstrument");
            const turtle = 0;
            const tur = activity.turtles.ithTurtle(turtle);
            tur.singer.instrumentNames = [];
            setDefVoice.flow(["piano"], logo, turtle, "setDefVoiceBlk2");
            expect(tur.singer.instrumentNames[0]).toEqual("piano");
        });
    });

    describe("VoiceNameBlock", () => {
        it("should be a value block with extra width", () => {
            const voiceName = getBlock("voicename");
            // Call setup again to update extraWidth if needed.
            voiceName.setup(activity);
            expect(voiceName.extraWidth).toEqual(50);
        });
    });

    describe("SetTimbreBlock", () => {
        it("should error if argument is null", () => {
            const setTimbre = getBlock("settimbre");
            setTimbre.flow([null, 66], logo, 0, "setTimbreBlk");
            expect(activity.errorMsg).toHaveBeenCalledWith("No input error", "setTimbreBlk");
        });
        it("should set timbre when inRhythmRuler is false and inSample is false", () => {
            const setTimbre = getBlock("settimbre");
            const turtle = 0;
            setTimbre.flow(["customTimbre", 77], logo, turtle, "setTimbreBlk2");
            expect(Singer.ToneActions.setTimbre).toHaveBeenCalledWith(
                "customTimbre",
                turtle,
                "setTimbreBlk2"
            );
        });
        it("should update sample properties if inSample is true", () => {
            logo.inSample = true;
            const setTimbre = getBlock("settimbre");
            setTimbre.flow([["sampleName", "sampleData", "la", 5], 88], logo, 0, "setTimbreBlk3");
            expect(logo.sample.sampleName).toEqual("sampleName");
            expect(logo.sample.sampleData).toEqual("sampleData");
            expect(logo.sample.samplePitch).toEqual("la");
            expect(logo.sample.sampleOctave).toEqual(5);
        });
    });

    describe("CustomSampleBlock", () => {
        it("should update parameter correctly", () => {
            const customSample = getBlock("customsample");
            activity.blocks.blockList["csBlk"] = { value: "initial" };
            const ret = customSample.updateParameter(logo, 0, "csBlk");
            expect(ret).toEqual("initial");
        });
        it("should update its value based on connected blocks", () => {
            activity.blocks.blockList["csBlk2"] = {
                value: ["", "", "do", 4],
                connections: { 1: "nameBlk", 2: "solfegeBlk", 3: "numBlk" }
            };
            activity.blocks.blockList["nameBlk"] = { value: ["newName", "newData"] };
            activity.blocks.blockList["solfegeBlk"] = { value: "re" };
            activity.blocks.blockList["numBlk"] = { value: 7 };
            const customSample = getBlock("customsample");
            const ret = customSample.arg(logo, 0, "csBlk2");
            expect(ret).toEqual(["newName", "newData", "re", 7]);
        });
    });

    describe("AudioFileBlock", () => {
        it("should update parameter by calling updateBlockText", () => {
            activity.blocks.blockList["afBlk"] = { value: "audioValue" };
            const audioFile = getBlock("audiofile");
            const ret = audioFile.updateParameter(logo, 0, "afBlk");
            expect(activity.blocks.updateBlockText).toHaveBeenCalledWith("afBlk");
            expect(ret).toEqual("audioValue");
        });
    });
});
