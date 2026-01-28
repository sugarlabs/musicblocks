/**
 * MusicBlocks v3.6.2
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
 */

const { setupWidgetBlocks } = require("../WidgetBlocks");

describe("setupWidgetBlocks", () => {
    let activity;
    let createdBlocks;
    let turtleIndex;

    class DummyFlowBlock {
        constructor(name) {
            this.name = name;
            createdBlocks[name] = this;
        }
        setPalette() {
            return this;
        }
        setHelpString() {
            return this;
        }
        formBlock() {
            return this;
        }
        makeMacro() {
            return this;
        }
        beginnerBlock() {
            return this;
        }
        setup() {
            return this;
        }
        flow() {}
    }

    class DummyStackClampBlock extends DummyFlowBlock {}

    beforeEach(() => {
        createdBlocks = {};
        turtleIndex = 0;

        global._ = s => s;
        global.last = arr => arr[arr.length - 1];
        global._THIS_IS_MUSIC_BLOCKS_ = true;

        global.FlowBlock = DummyFlowBlock;
        global.StackClampBlock = DummyStackClampBlock;

        global.NOINPUTERRORMSG = "No input";

        global.DEFAULTVOICE = "piano";
        global.DEFAULTMODE = "major";
        global.DEFAULTFILTERTYPE = "lowpass";
        global.FILTERTYPES = {};

        global.instrumentsEffects = { 0: {} };
        global.instrumentsFilters = { 0: {} };

        global.MeterWidget = jest.fn();
        global.Tempo = jest.fn();
        global.Oscilloscope = jest.fn();
        global.PitchDrumMatrix = jest.fn();
        global.PhraseMaker = jest.fn();
        global.StatusMatrix = jest.fn();
        global.RhythmRuler = jest.fn();
        global.TemperamentWidget = jest.fn();
        global.TimbreWidget = jest.fn();
        global.ModeWidget = jest.fn();
        global.PitchSlider = jest.fn();
        global.MusicKeyboard = jest.fn();
        global.PitchStaircase = jest.fn();
        global.SampleWidget = jest.fn();
        global.Arpeggio = jest.fn();
        global.LegoWidget = jest.fn();
        global.AIDebuggerWidget = jest.fn();
        global.ReflectionMatrix = jest.fn();

        activity = {
            beginnerMode: false,
            errorMsg: jest.fn(),
            blocks: { blockList: {} },
            turtles: {
                turtleList: [],
                getTurtleCount: () => 1,
                ithTurtle() {
                    return {
                        singer: {
                            attack: [],
                            decay: [],
                            sustain: [],
                            release: [],
                            instrumentNames: []
                        }
                    };
                },
                getTurtle: () => ({ name: "turtle" })
            }
        };
    });

    it("exports setupWidgetBlocks", () => {
        expect(typeof setupWidgetBlocks).toBe("function");
    });

    it("registers widget blocks", () => {
        setupWidgetBlocks(activity);
        expect(Object.keys(createdBlocks).length).toBeGreaterThan(0);
    });

    it("creates Envelope block", () => {
        setupWidgetBlocks(activity);
        expect(createdBlocks.envelope).toBeDefined();
    });

    it("creates Filter block", () => {
        setupWidgetBlocks(activity);
        expect(createdBlocks.filter).toBeDefined();
    });

    it("creates Timbre block", () => {
        setupWidgetBlocks(activity);
        expect(createdBlocks.timbre).toBeDefined();
    });

    it("creates Tempo block", () => {
        setupWidgetBlocks(activity);
        expect(createdBlocks.tempo).toBeDefined();
    });

    it("creates Sampler block", () => {
        setupWidgetBlocks(activity);
        expect(createdBlocks.sampler).toBeDefined();
    });

    it("creates Status block", () => {
        setupWidgetBlocks(activity);
        expect(createdBlocks.status).toBeDefined();
    });

    it("works when Music Blocks flag is false", () => {
        global._THIS_IS_MUSIC_BLOCKS_ = false;
        expect(() => setupWidgetBlocks(activity)).not.toThrow();
        global._THIS_IS_MUSIC_BLOCKS_ = true;
    });
});
