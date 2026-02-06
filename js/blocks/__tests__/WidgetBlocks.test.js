/**
 * MusicBlocks v3.6.2
 *
 * @author Alok Dangre
 *
 * @copyright 2026 Alok Dangre
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
global.NOINPUTERRORMSG = "No input error";
global.DEFAULTVOICE = "defaultVoice";
global.DEFAULTMODE = "major";
global.DEFAULTFILTERTYPE = "lowpass";
global.FILTERTYPES = {
    lowpass: ["lowpass", "lowpass"],
    highpass: ["highpass", "highpass"]
};
global._THIS_IS_MUSIC_BLOCKS_ = true;

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

class DummyStackClampBlock extends DummyFlowBlock {
    constructor(type) {
        super(type, type);
    }
}

class DummyValueBlock extends DummyFlowBlock {
    constructor(type, label) {
        super(type, label);
    }
}

global.FlowBlock = DummyFlowBlock;
global.StackClampBlock = DummyStackClampBlock;
global.ValueBlock = DummyValueBlock;

global.last = arr => (arr && arr.length ? arr[arr.length - 1] : undefined);

// Mock widget classes
global.MeterWidget = jest.fn();
global.Oscilloscope = jest.fn();
global.ModeWidget = jest.fn();
global.Tempo = jest.fn(() => ({ BPMBlocks: [], BPMs: [], init: jest.fn() }));
global.TimbreWidget = jest.fn(() => ({
    instrumentName: "testInstrument",
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
        oscillator: { source: "sine" },
        envelope: {}
    },
    init: jest.fn()
}));
global.SampleWidget = jest.fn(() => ({ init: jest.fn() }));
global.TemperamentWidget = jest.fn(() => ({
    inTemperament: null,
    scale: null,
    init: jest.fn()
}));

global.instrumentsEffects = {};
global.instrumentsFilters = {};

const createMockActivity = () => {
    const turtleStore = {};
    return {
        blockTypes: [],
        blockInstances: {},
        turtles: {
            ithTurtle: jest.fn(t => {
                if (!turtleStore[t]) {
                    turtleStore[t] = {
                        singer: {
                            attack: [],
                            decay: [],
                            sustain: [],
                            release: [],
                            instrumentNames: []
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

const createMockLogo = () => {
    return {
        inTimbre: false,
        insideMeterWidget: false,
        inOscilloscope: false,
        insideModeWidget: false,
        inTempo: false,
        inSample: false,
        insideTemperament: false,
        tempo: null,
        timbre: null,
        sample: null,
        temperament: null,
        meterWidget: null,
        modeWidget: null,
        Oscilloscope: null,
        oscilloscopeTurtles: [],
        synth: {
            createSynth: jest.fn(),
            startingPitch: null
        },
        setDispatchBlock: jest.fn(),
        setTurtleListener: jest.fn()
    };
};

const { setupWidgetBlocks } = require("../WidgetBlocks");

describe("setupWidgetBlocks", () => {
    let activity;
    let logo;

    beforeEach(() => {
        activity = createMockActivity();
        logo = createMockLogo();
        global.instrumentsEffects[0] = {};
        global.instrumentsFilters[0] = {};
        setupWidgetBlocks(activity);
    });

    const getBlock = type => activity.blockInstances[type];

    describe("Block Registration", () => {
        it("registers widget blocks", () => {
            expect(Object.keys(activity.blockInstances).length).toBeGreaterThan(0);
            expect(getBlock("envelope")).toBeDefined();
            expect(getBlock("filter")).toBeDefined();
            expect(getBlock("timbre")).toBeDefined();
            expect(getBlock("tempo")).toBeDefined();
            expect(getBlock("meterwidget")).toBeDefined();
        });
    });

    describe("EnvelopeBlock", () => {
        it("pushes ADSR values to singer", () => {
            const envelope = getBlock("envelope");
            const turtle = 0;
            const tur = activity.turtles.ithTurtle(turtle);
            envelope.flow([50, 60, 70, 80], logo, turtle, "envBlk");
            expect(tur.singer.attack).toContain(0.5);
            expect(tur.singer.decay).toContain(0.6);
            expect(tur.singer.sustain).toContain(0.7);
            expect(tur.singer.release).toContain(0.8);
        });

        it("shows error for attack out of range", () => {
            const envelope = getBlock("envelope");
            envelope.flow([150, 50, 50, 50], logo, 0, "envBlk");
            expect(activity.errorMsg).toHaveBeenCalledWith("Attack value should be from 0 to 100.");
        });

        it("shows error for decay out of range", () => {
            const envelope = getBlock("envelope");
            envelope.flow([50, -10, 50, 50], logo, 0, "envBlk");
            expect(activity.errorMsg).toHaveBeenCalledWith("Decay value should be from 0 to 100.");
        });

        it("shows error for sustain out of range", () => {
            const envelope = getBlock("envelope");
            envelope.flow([50, 50, 150, 50], logo, 0, "envBlk");
            expect(activity.errorMsg).toHaveBeenCalledWith(
                "Sustain value should be from 0 to 100."
            );
        });

        it("shows error for release out of range", () => {
            const envelope = getBlock("envelope");
            envelope.flow([50, 50, 50, -5], logo, 0, "envBlk");
            expect(activity.errorMsg).toHaveBeenCalledWith("Release value should be from 0-100.");
        });
    });

    describe("FilterBlock", () => {
        it("shows error for invalid rolloff", () => {
            const filter = getBlock("filter");
            filter.flow(["highpass", -10, 400], logo, 0, "filterBlk");
            expect(activity.errorMsg).toHaveBeenCalledWith(
                "Rolloff value should be either -12, -24, -48, or -96 decibels/octave."
            );
        });

        it("accepts valid rolloff value -12", () => {
            const filter = getBlock("filter");
            activity.errorMsg.mockClear();
            filter.flow(["highpass", -12, 400], logo, 0, "filterBlk");
            expect(activity.errorMsg).not.toHaveBeenCalled();
        });

        it("accepts valid rolloff value -24", () => {
            const filter = getBlock("filter");
            activity.errorMsg.mockClear();
            filter.flow(["lowpass", -24, 800], logo, 0, "filterBlk");
            expect(activity.errorMsg).not.toHaveBeenCalled();
        });
    });

    describe("TimbreBlock", () => {
        it("initializes with string instrument name", () => {
            const timbre = getBlock("timbre");
            const result = timbre.flow(["customInstrument", "childBlk"], logo, 0, "timbreBlk");
            expect(logo.inTimbre).toBe(true);
            expect(logo.timbre.instrumentName).toBe("customInstrument");
            expect(result).toEqual(["childBlk", 1]);
        });

        it("uses default voice and shows error for non-string", () => {
            const timbre = getBlock("timbre");
            timbre.flow([123, "childBlk"], logo, 0, "timbreBlk");
            expect(activity.errorMsg).toHaveBeenCalledWith("No input error", "timbreBlk");
            expect(logo.timbre.instrumentName).toBe(global.DEFAULTVOICE);
        });
    });

    describe("TempoBlock", () => {
        it("initializes tempo widget and returns child block", () => {
            const tempo = getBlock("tempo");
            const result = tempo.flow(["childBlk"], logo, 0, "tempoBlk");
            expect(logo.inTempo).toBe(true);
            expect(logo.tempo).toBeDefined();
            expect(result).toEqual(["childBlk", 1]);
        });

        it("sets dispatch block and turtle listener", () => {
            const tempo = getBlock("tempo");
            tempo.flow(["childBlk"], logo, 0, "tempoBlk");
            expect(logo.setDispatchBlock).toHaveBeenCalledWith("tempoBlk", 0, "_tempo_0");
            expect(logo.setTurtleListener).toHaveBeenCalled();
        });
    });

    describe("MeterWidgetBlock", () => {
        it("sets insideMeterWidget and returns child block", () => {
            const meterWidget = getBlock("meterwidget");
            const result = meterWidget.flow(["childBlk"], logo, 0, "meterBlk");
            expect(logo.insideMeterWidget).toBe(true);
            expect(result).toEqual(["childBlk", 1]);
        });

        it("sets dispatch block and listener", () => {
            const meterWidget = getBlock("meterwidget");
            meterWidget.flow(["childBlk"], logo, 0, "meterBlk");
            expect(logo.setDispatchBlock).toHaveBeenCalledWith("meterBlk", 0, "_meterwidget_0");
            expect(logo.setTurtleListener).toHaveBeenCalled();
        });
    });

    describe("ModeWidgetBlock", () => {
        it("sets insideModeWidget and returns child block", () => {
            const modeWidget = getBlock("modewidget");
            const result = modeWidget.flow(["childBlk"], logo, 0, "modeBlk");
            expect(logo.insideModeWidget).toBe(true);
            expect(result).toEqual(["childBlk", 1]);
        });
    });

    describe("OscilloscopeWidgetBlock", () => {
        it("sets inOscilloscope and returns child block", () => {
            const oscilloscope = getBlock("oscilloscope");
            const result = oscilloscope.flow(["childBlk"], logo, 0, "oscBlk");
            expect(logo.inOscilloscope).toBe(true);
            expect(result).toEqual(["childBlk", 1]);
        });
    });

    describe("SamplerBlock", () => {
        it("initializes sample widget and returns child block", () => {
            const sampler = getBlock("sampler");
            const result = sampler.flow(["childBlk"], logo, 0, "samplerBlk");
            expect(logo.inSample).toBe(true);
            expect(logo.sample).toBeDefined();
            expect(result).toEqual(["childBlk", 1]);
        });
    });
});
