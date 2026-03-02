/**
 * MusicBlocks v3.6.2
 *
 * @author Jetshree
 *
 * @copyright 2025 Jetshree
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

describe("MeterBlocks setup", () => {
    let activity;
    let logo;
    let blockRegistry;
    let Singer;
    let setupMeterBlocks;

    const expectedBlocks = [
        "currentmeter",
        "beatfactor",
        "bpmfactor",
        "measurevalue",
        "beatvalue",
        "notecounter",
        "notecounter2",
        "elapsednotes",
        "elapsednotes2",
        "drift",
        "offbeatdo",
        "onbeatdo",
        "everybeatdonew",
        "everybeatdo",
        "setmasterbpm2",
        "setmasterbpm",
        "setbpm3",
        "setbpm2",
        "setbpm",
        "pickup",
        "meter"
    ];

    const setupGlobals = () => {
        blockRegistry = {};

        global._ = message => message;
        global.NOINPUTERRORMSG = "NO_INPUT";
        global.NOACTIONERRORMSG = "NO_ACTION";
        global.TONEBPM = 600;

        class BaseBlock {
            constructor(name, label) {
                this.name = name;
                this.label = label;
                this.lang = "en";
                blockRegistry[this.name] = this;
            }

            setPalette(palette, activityRef) {
                this.palette = palette;
                this.activityRef = activityRef;
            }

            setHelpString(help) {
                this.help = help;
            }

            formBlock(schema) {
                this.schema = schema;
            }

            makeMacro(factory) {
                this.macroFactory = factory;
            }

            beginnerBlock(flag) {
                this.beginnerFlag = flag;
            }

            setup(activityRef) {
                this.setupActivity = activityRef;
            }

            set extraWidth(value) {
                this._extraWidth = value;
            }

            get extraWidth() {
                return this._extraWidth;
            }
        }

        global.ValueBlock = class extends BaseBlock {};
        global.LeftBlock = class extends BaseBlock {};
        global.FlowBlock = class extends BaseBlock {};
        global.FlowClampBlock = class extends global.FlowBlock {};

        Singer = {
            MeterActions: {
                getCurrentMeter: jest.fn(() => "current-meter"),
                getBeatFactor: jest.fn(() => 0.5),
                getBPM: jest.fn(() => 120),
                getMeasureCount: jest.fn(() => 3),
                getBeatCount: jest.fn(() => 2),
                getWholeNotesPlayed: jest.fn(() => 4),
                getNotesPlayed: jest.fn(() => 8),
                setNoClock: jest.fn(),
                onWeakBeatDo: jest.fn(),
                onStrongBeatDo: jest.fn(),
                onEveryBeatDo: jest.fn(),
                onEveryNoteDo: jest.fn(),
                setMasterBPM: jest.fn(),
                setBPM: jest.fn(),
                setPickup: jest.fn(),
                setMeter: jest.fn()
            },
            noteCounter: jest.fn(() => 11),
            numberOfNotes: jest.fn(() => 12),
            masterBPM: 0,
            defaultBPMFactor: 0
        };

        global.Singer = Singer;
    };

    const setupActivityAndLogo = () => {
        activity = {
            beginnerMode: false,
            blocks: {
                blockList: {}
            },
            turtles: {
                ithTurtle: jest.fn(() => ({
                    singer: {
                        beatFactor: 0,
                        bpm: []
                    }
                }))
            },
            errorMsg: jest.fn()
        };

        logo = {
            inStatusMatrix: false,
            statusFields: [],
            actions: {},
            notation: {
                notationTempo: jest.fn()
            },
            tempo: {
                BPMBlocks: [],
                BPMs: []
            },
            inTempo: false,
            insideMeterWidget: false,
            inMusicKeyboard: false,
            musicKeyboard: {},
            setDispatchBlock: jest.fn(),
            setTurtleListener: jest.fn(),
            parseArg: jest.fn().mockReturnValue(0.25)
        };
    };

    const loadModule = () => {
        setupMeterBlocks = require("../MeterBlocks");
        setupMeterBlocks(activity);
    };

    const getBlock = name => blockRegistry[name];

    beforeEach(() => {
        jest.resetModules();
        setupGlobals();
        setupActivityAndLogo();
        loadModule();
    });

    it("registers every meter block prototype", () => {
        expectedBlocks.forEach(name => {
            expect(getBlock(name)).toBeDefined();
        });
    });

    it("returns stored values via updateParameter for parameterized blocks", () => {
        const parameterBlocks = [
            "currentmeter",
            "beatfactor",
            "bpmfactor",
            "measurevalue",
            "beatvalue",
            "notecounter",
            "notecounter2",
            "elapsednotes",
            "elapsednotes2"
        ];

        parameterBlocks.forEach((name, index) => {
            const block = getBlock(name);
            activity.blocks.blockList[name] = { value: index };
            expect(block.updateParameter({}, 0, name)).toBe(index);
        });
    });

    it("handles status reporting and meter retrieval", () => {
        const block = getBlock("currentmeter");
        activity.blocks.blockList.current = {
            value: "4/4",
            connections: ["printBlock"]
        };
        activity.blocks.blockList.printBlock = { name: "print" };

        logo.inStatusMatrix = true;
        block.arg(logo, 0, "current");

        expect(logo.statusFields).toContainEqual(["current", "currentmeter"]);

        logo.inStatusMatrix = false;
        const value = block.arg(logo, 7, "current");
        expect(value).toBe("current-meter");
        expect(Singer.MeterActions.getCurrentMeter).toHaveBeenCalledWith(7);
    });

    it("reads and writes beat factor data", () => {
        const block = getBlock("beatfactor");
        const turtle = { singer: { beatFactor: 0 } };
        activity.turtles.ithTurtle.mockReturnValue(turtle);

        block.setter(logo, 0.75, 2);
        expect(turtle.singer.beatFactor).toBe(0.75);

        activity.blocks.blockList.beatfactor = {
            value: 99,
            connections: ["printBlock"]
        };
        logo.inStatusMatrix = false;
        expect(block.arg(logo, 2, "beatfactor")).toBe(0.5);
        expect(Singer.MeterActions.getBeatFactor).toHaveBeenCalledWith(2);

        logo.inStatusMatrix = true;
        activity.blocks.blockList.printBlock = { name: "print" };
        block.arg(logo, 2, "beatfactor");
        expect(logo.statusFields).toContainEqual(["beatfactor", "beatfactor"]);
    });

    it("manages BPM factor stack", () => {
        const block = getBlock("bpmfactor");
        const turtle = { singer: { bpm: [60] } };
        activity.turtles.ithTurtle.mockReturnValue(turtle);

        block.setter(logo, 120, 0);
        expect(turtle.singer.bpm).toEqual([120]);

        turtle.singer.bpm = [];
        block.setter(logo, 90, 0);
        expect(turtle.singer.bpm).toEqual([90]);

        activity.blocks.blockList.bpmfactor = {
            value: 1,
            connections: ["printBlock"]
        };
        logo.inStatusMatrix = false;
        expect(block.arg(logo, 0, "bpmfactor")).toBe(120);
        expect(Singer.MeterActions.getBPM).toHaveBeenCalledWith(0);
    });

    it("reports measure and beat values through status matrix", () => {
        const measureBlock = getBlock("measurevalue");
        const beatBlock = getBlock("beatvalue");
        activity.blocks.blockList.measureBlk = {
            value: 1,
            connections: ["printBlock"]
        };
        activity.blocks.blockList.beatBlk = {
            value: 1,
            connections: ["printBlock"]
        };
        activity.blocks.blockList.printBlock = { name: "print" };

        logo.inStatusMatrix = true;
        measureBlock.arg(logo, 1, "measureBlk");
        beatBlock.arg(logo, 1, "beatBlk");

        expect(logo.statusFields).toEqual([
            ["measureBlk", "measurevalue"],
            ["beatBlk", "beatvalue"]
        ]);

        logo.inStatusMatrix = false;
        expect(measureBlock.arg(logo, 1, "measureBlk")).toBe(3);
        expect(beatBlock.arg(logo, 1, "beatBlk")).toBe(2);
    });

    it("counts notes and guards against missing inputs", () => {
        const noteCounter = getBlock("notecounter");
        const noteCounter2 = getBlock("notecounter2");
        activity.blocks.blockList.nc = { connections: [null, null], value: 0 };
        activity.blocks.blockList.nc2 = { connections: [null, "child"], value: 0 };
        activity.blocks.blockList.child = {};

        const result = noteCounter.arg(logo, 1, "nc");
        expect(result).toBe(0);
        expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, "nc");

        noteCounter2.arg(logo, 1, "nc2");
        expect(Singer.numberOfNotes).toHaveBeenCalledWith(logo, 1, "child");

        noteCounter.arg(logo, 1, "nc2");
        expect(Singer.noteCounter).toHaveBeenCalledWith(logo, 1, "child");
    });

    it("reports elapsed notes and beats with optional parsing", () => {
        const elapsedBlock = getBlock("elapsednotes");
        const elapsed2Block = getBlock("elapsednotes2");
        activity.blocks.blockList.elapsed = {
            value: 0,
            connections: ["printBlock"]
        };
        activity.blocks.blockList.elapsed2 = {
            value: 0,
            connections: ["printBlock", "child"]
        };
        activity.blocks.blockList.child = {};
        activity.blocks.blockList.printBlock = { name: "print" };

        logo.inStatusMatrix = true;
        elapsedBlock.arg(logo, 0, "elapsed");
        elapsed2Block.arg(logo, 0, "elapsed2");

        expect(logo.statusFields).toContainEqual(["elapsed", "elapsednotes"]);
        expect(logo.statusFields).toContainEqual(["elapsed2", "elapsednotes2"]);

        logo.inStatusMatrix = false;
        logo.parseArg.mockReturnValue(0.5);

        const value = elapsed2Block.arg(logo, 0, "elapsed2", 0.25);
        expect(value).toBe(8);
        expect(logo.parseArg).toHaveBeenCalled();
        expect(Singer.MeterActions.getNotesPlayed).toHaveBeenCalledWith(0.5, 0);
    });

    it("handles drift and beat-trigger flow blocks", () => {
        const driftBlock = getBlock("drift");
        driftBlock.flow([], logo, 0, "drift");
        expect(Singer.MeterActions.setNoClock).not.toHaveBeenCalled();

        const result = driftBlock.flow(["next"], logo, 0, "drift");
        expect(Singer.MeterActions.setNoClock).toHaveBeenCalledWith(0, "drift");
        expect(result).toEqual(["next", 1]);

        const offBeat = getBlock("offbeatdo");
        const onBeat = getBlock("onbeatdo");
        const everyBeatNew = getBlock("everybeatdonew");
        const everyBeat = getBlock("everybeatdo");

        logo.actions = { action: jest.fn(), clap: jest.fn() };

        offBeat.flow(["missing"], logo, 0, "off");
        expect(activity.errorMsg).toHaveBeenCalledWith(NOACTIONERRORMSG, "off", undefined);

        offBeat.flow(["action"], logo, 0, "off", null, null, true);
        expect(Singer.MeterActions.onWeakBeatDo).toHaveBeenCalledWith(
            "action",
            true,
            null,
            0,
            "off"
        );

        onBeat.flow([1, "clap"], logo, 0, "on", undefined, undefined, false);
        expect(Singer.MeterActions.onStrongBeatDo).toHaveBeenCalledWith(
            1,
            "clap",
            false,
            undefined,
            0,
            "on"
        );

        everyBeatNew.flow(["action"], logo, 0, "every", undefined, undefined, true);
        expect(Singer.MeterActions.onEveryBeatDo).toHaveBeenCalledWith(
            "action",
            true,
            undefined,
            0,
            "every"
        );

        everyBeat.flow(["action"], logo, 0, "everyNote", undefined, undefined, false);
        expect(Singer.MeterActions.onEveryNoteDo).toHaveBeenCalledWith(
            "action",
            false,
            undefined,
            0,
            "everyNote"
        );
    });

    it("configures master BPM with shared tempo metadata", () => {
        const block = getBlock("setmasterbpm2");
        activity.blocks.blockList.master = { connections: [null, "bpmText"] };
        activity.blocks.blockList.bpmText = { text: { text: "90" } };

        logo.inTempo = true;
        block.flow([120, 0.5], logo, 0, "master");

        expect(Singer.MeterActions.setMasterBPM).toHaveBeenCalledWith(120, 0.5, "master");
        expect(logo.notation.notationTempo).toHaveBeenCalledWith(0, 120, 0.5);
        expect(logo.tempo.BPMBlocks).toContain("master");
        expect(logo.tempo.BPMs).toContain("90");
    });

    it("clamps legacy master BPM values and records tempo entries", () => {
        const block = getBlock("setmasterbpm");
        activity.blocks.blockList.legacy = { connections: [null, "legacyText"] };
        activity.blocks.blockList.legacyText = { text: { text: "legacy" } };

        logo.inTempo = true;

        block.flow([20], logo, 0, "legacy");
        expect(activity.errorMsg).toHaveBeenCalledWith("Beats per minute must be > 30.", "legacy");
        expect(Singer.masterBPM).toBe(30);

        block.flow([1500], logo, 0, "legacy");
        expect(activity.errorMsg).toHaveBeenCalledWith(
            "Maximum beats per minute is 1000.",
            "legacy"
        );
        expect(Singer.masterBPM).toBe(1000);

        block.flow([120], logo, 0, "legacy");
        expect(Singer.masterBPM).toBe(120);
        expect(Singer.defaultBPMFactor).toBe(TONEBPM / 120);
        expect(logo.tempo.BPMBlocks).toContain("legacy");
        expect(logo.tempo.BPMs).toContain("legacy");
    });

    it("sets per-turtle BPM values and tempo metadata", () => {
        const block = getBlock("setbpm3");
        activity.blocks.blockList.bpm3 = { connections: [null, "text"] };
        activity.blocks.blockList.text = { text: { text: "text" } };

        logo.inTempo = true;
        block.flow([100, 0.25], logo, 1, "bpm3");

        expect(Singer.MeterActions.setBPM).toHaveBeenCalledWith(100, 0.25, 1, "bpm3");
        expect(logo.notation.notationTempo).toHaveBeenCalledWith(1, 100, 0.25);
        expect(logo.tempo.BPMBlocks).toContain("bpm3");
        expect(logo.tempo.BPMs).toContain("text");
    });

    it("clamps BPM ranges inside FlowClamp blocks and cleans up listeners", () => {
        const block = getBlock("setbpm2");
        const turtle = { singer: { bpm: [] } };
        activity.turtles.ithTurtle.mockReturnValue(turtle);

        const listenerCalls = [];
        logo.setTurtleListener.mockImplementation((_turtle, _name, handler) => {
            listenerCalls.push(handler);
        });

        let response = block.flow([20, 0.25, "next"], logo, 0, "flow");
        expect(activity.errorMsg).toHaveBeenCalledWith("Beats per minute must be > 30.");
        expect(turtle.singer.bpm).toEqual([30]);
        expect(response).toEqual(["next", 1]);

        response = block.flow([2000, 0.25, "next"], logo, 0, "flow");
        expect(activity.errorMsg).toHaveBeenCalledWith("Maximum beats per minute is 1000.");
        expect(turtle.singer.bpm[turtle.singer.bpm.length - 1]).toBe(1000);

        response = block.flow([120, 0.5, "next"], logo, 0, "flow");
        expect(turtle.singer.bpm[turtle.singer.bpm.length - 1]).toBe((120 * 0.5) / 0.25);
        expect(logo.setDispatchBlock).toHaveBeenCalledWith("flow", 0, "_bpm_0");
        expect(listenerCalls).toHaveLength(3);
        listenerCalls.forEach(handler => handler());
        expect(turtle.singer.bpm).toEqual([]);
    });

    it("pushes and pops BPM values with the older setbpm block", () => {
        const block = getBlock("setbpm");
        const turtle = { singer: { bpm: [] } };
        activity.turtles.ithTurtle.mockReturnValue(turtle);

        const listeners = [];
        logo.setTurtleListener.mockImplementation((_turtle, _name, handler) =>
            listeners.push(handler)
        );

        block.flow([20, "next"], logo, 0, "legacyBpm");
        expect(activity.errorMsg).toHaveBeenCalledWith(
            "Beats per minute must be > 30.",
            "legacyBpm"
        );
        expect(turtle.singer.bpm).toEqual([30]);

        block.flow([5000, "next"], logo, 0, "legacyBpm");
        expect(activity.errorMsg).toHaveBeenCalledWith(
            "Maximum beats per minute is 1000.",
            "legacyBpm"
        );

        const response = block.flow([180, "next"], logo, 0, "legacyBpm");
        expect(response).toEqual(["next", 1]);
        expect(logo.setDispatchBlock).toHaveBeenCalledWith("legacyBpm", 0, "_bpm_0");
        listeners.forEach(handler => handler());
        expect(turtle.singer.bpm).toEqual([]);
    });

    it("validates pickup values and sets meters", () => {
        const pickup = getBlock("pickup");
        pickup.flow(["invalid"], logo, 0, "pickup");
        expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, "pickup");

        pickup.flow([2], logo, 0, "pickup");
        expect(Singer.MeterActions.setPickup).toHaveBeenCalledWith(2, 0, activity);
    });

    it("handles meter changes with defaults and widget state", () => {
        const block = getBlock("meter");
        logo.insideMeterWidget = true;
        logo.inMusicKeyboard = true;

        block.flow([null, null], logo, 1, "meterBlk");
        expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, "meterBlk");
        expect(logo._meterBlock).toBe("meterBlk");
        expect(logo.musicKeyboard.meterArgs).toEqual([null, null]);
        expect(Singer.MeterActions.setMeter).toHaveBeenCalledWith(4, 0.25, 1);

        block.flow([6, 0.125], logo, 1, "meterBlk");
        expect(Singer.MeterActions.setMeter).toHaveBeenCalledWith(6, 0.125, 1);
    });
});
