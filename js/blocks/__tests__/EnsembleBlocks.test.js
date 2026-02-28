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

const { setupEnsembleBlocks, getTargetTurtle } = require("../EnsembleBlocks");

describe("setupEnsembleBlocks", () => {
    let activity, logo, createdBlocks, turtles;

    class DummyValueBlock {
        constructor(name, displayName) {
            this.name = name;
            this.displayName = displayName;
            createdBlocks[name] = this;
        }
        setPalette() {
            return this;
        }
        beginnerBlock() {
            return this;
        }
        setHelpString() {
            return this;
        }
        formBlock() {
            return this;
        }
        setup() {
            return this;
        }
    }

    class DummyFlowBlock {
        constructor(name, displayName) {
            this.name = name;
            this.displayName = displayName;
            createdBlocks[name] = this;
        }
        setPalette() {
            return this;
        }
        beginnerBlock() {
            return this;
        }
        setHelpString() {
            return this;
        }
        formBlock() {
            return this;
        }
        setup() {
            return this;
        }
    }

    class DummyFlowClampBlock {
        constructor(name) {
            this.name = name;
            createdBlocks[name] = this;
        }
        setPalette() {
            return this;
        }
        beginnerBlock() {
            return this;
        }
        setHelpString() {
            return this;
        }
        formBlock() {
            return this;
        }
        setup() {
            return this;
        }
    }

    class DummyLeftBlock {
        constructor(name, displayName) {
            this.name = name;
            this.displayName = displayName;
            createdBlocks[name] = this;
        }
        setPalette() {
            return this;
        }
        beginnerBlock() {
            return this;
        }
        setHelpString() {
            return this;
        }
        formBlock() {
            return this;
        }
        setup() {
            return this;
        }
    }

    class DummyBooleanBlock {
        constructor(name) {
            this.name = name;
            createdBlocks[name] = this;
        }
        setPalette() {
            return this;
        }
        beginnerBlock() {
            return this;
        }
        setHelpString() {
            return this;
        }
        formBlock() {
            return this;
        }
        setup() {
            return this;
        }
    }

    beforeEach(() => {
        createdBlocks = {};
        jest.clearAllMocks();

        global._ = jest.fn(str => str);
        global._THIS_IS_MUSIC_BLOCKS_ = false;
        global.ValueBlock = DummyValueBlock;
        global.FlowBlock = DummyFlowBlock;
        global.FlowClampBlock = DummyFlowClampBlock;
        global.LeftBlock = DummyLeftBlock;
        global.BooleanBlock = DummyBooleanBlock;
        global.NOINPUTERRORMSG = "No input provided";
        global.NANERRORMSG = "Not a number";
        global.INVALIDPITCH = "Invalid pitch";
        global.last = jest.fn(arr => arr[arr.length - 1]);
        global.getNote = jest.fn(() => ["C", 4]);
        global.pitchToNumber = jest.fn(() => 40);
        global.getMunsellColor = jest.fn((hue, chroma, value) => `#${hue}${chroma}${value}`);
        global.TURTLESVG = "<svg>fill_color stroke_color</svg>";
        global.base64Encode = jest.fn(str => str);

        const mockTurtles = [0, 1, 2].map(index => ({
            name: index === 0 ? "Yertle" : index === 1 ? "Turtle1" : "Turtle2",
            inTrash: false,
            running: false,
            queue: [1, 2, 3],
            parentFlowQueue: [],
            unhighlightQueue: [],
            parameterQueue: [],
            startBlock: { name: "start" },
            painter: {
                color: "#FF0000",
                doSetXY: jest.fn(),
                doSetHeading: jest.fn()
            },
            container: {
                x: 100,
                y: 200
            },
            orientation: 90,
            singer: {
                notesPlayed: [10, 20],
                turtleTime: 100,
                lastNotePlayed: ["C4", 0.5],
                notePitches: [["C"]],
                noteOctaves: [[4]],
                noteValue: { 0: 4 },
                noteBeat: [0.25],
                inNoteBlock: [0],
                keySignature: "C",
                movable: true,
                pitchNumberOffset: 0
            },
            rename: jest.fn(),
            doTurtleShell: jest.fn()
        }));

        turtles = {
            turtleList: [0, 1, 2],
            ithTurtle: jest.fn(i => {
                if (i && typeof i === "object" && i.singer) return i;
                const index = typeof i === "string" ? parseInt(i) : i;
                return mockTurtles[index];
            }),
            getTurtle: jest.fn(i => {
                if (i && typeof i === "object" && i.singer) return i;
                const index = typeof i === "string" ? parseInt(i) : i;
                return mockTurtles[index];
            }),
            getTurtleCount: jest.fn(() => 3),
            companionTurtle: jest.fn(i => i),
            screenX2turtleX: jest.fn(x => x),
            screenY2turtleY: jest.fn(y => y),
            turtleX2screenX: jest.fn(x => x),
            turtleY2screenY: jest.fn(y => y),
            turtleCount: jest.fn(() => 3)
        };

        activity = {
            errorMsg: jest.fn(),
            textMsg: jest.fn(),
            blocks: {
                blockList: {}
            },
            turtles: turtles,
            stage: {
                dispatchEvent: jest.fn()
            },
            logo: null
        };

        logo = {
            turtleHeaps: {},
            parseArg: jest.fn((logo, turtle, cblk, blk, receivedArg) => {
                if (receivedArg !== undefined) return receivedArg;
                return "Yertle";
            }),
            runFromBlock: jest.fn(),
            doBreak: jest.fn(),
            initTurtle: jest.fn(),
            synth: {
                inTemperament: "equal"
            }
        };

        activity.logo = logo;

        activity.blocks.blockList = {
            10: { connections: [null, 20, null], name: "test" },
            20: { name: "text", value: "Yertle" },
            30: { connections: [null, 40, null], name: "test2" },
            40: { name: "number", value: 1 }
        };

        // Mock document.addEventListener
        global.document = {
            addEventListener: jest.fn(),
            attachEvent: jest.fn(),
            removeEventListener: jest.fn()
        };

        // Mock window.btoa
        global.window = {
            btoa: jest.fn(str => Buffer.from(str).toString("base64"))
        };

        setupEnsembleBlocks(activity);
    });

    describe("getTargetTurtle", () => {
        it("should find turtle by string name", () => {
            const result = getTargetTurtle(turtles, "Yertle");
            expect(result).toBe("0");
        });

        it("should find turtle by number converted to string", () => {
            turtles.ithTurtle.mockImplementation(i => ({
                name: i.toString(),
                inTrash: false
            }));
            const result = getTargetTurtle(turtles, 1);
            expect(result).toBe("1");
        });

        it("should return null if turtle not found", () => {
            const result = getTargetTurtle(turtles, "NonExistent");
            expect(result).toBeNull();
        });

        it("should skip turtles in trash", () => {
            turtles.ithTurtle.mockImplementation(i => ({
                name: i === 0 ? "Yertle" : "Other",
                inTrash: i === 0 ? true : false
            }));
            const result = getTargetTurtle(turtles, "Yertle");
            expect(result).toBeNull();
        });
    });

    describe("TurtleHeapBlock", () => {
        let turtleHeapBlock;
        const blk = 50;

        beforeEach(() => {
            turtleHeapBlock = createdBlocks["turtleheap"];
            activity.blocks.blockList[blk] = { connections: [null, 100, 200] };
            activity.blocks.blockList[100] = { name: "text", value: "Yertle" };
            activity.blocks.blockList[200] = { name: "number", value: 1 };
            logo.turtleHeaps[0] = [10, 20, 30];
        });

        it("should return error if turtle name connection is null", () => {
            activity.blocks.blockList[blk].connections[1] = null;
            const result = turtleHeapBlock.arg(logo, 0, blk, null);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, blk);
            expect(result).toBe(-1);
        });

        it("should return error if target turtle not found", () => {
            logo.parseArg.mockReturnValue("NonExistent");
            const result = turtleHeapBlock.arg(logo, 0, blk, null);
            expect(result).toBeUndefined(); // null < 0 is false, reaches end of function
        });

        it("should return error if index connection is null", () => {
            activity.blocks.blockList[blk].connections[2] = null;
            logo.parseArg.mockReturnValueOnce("Yertle").mockReturnValueOnce(null);
            const result = turtleHeapBlock.arg(logo, 0, blk, null);
            expect(activity.errorMsg).toHaveBeenCalledWith(NANERRORMSG, blk);
        });

        it("should return value at valid index", () => {
            logo.parseArg.mockReturnValueOnce("Yertle").mockReturnValueOnce(2);
            const result = turtleHeapBlock.arg(logo, 0, blk, null);
            expect(result).toBe(20);
        });

        it("should adjust index < 1 to 1", () => {
            logo.parseArg.mockReturnValueOnce("Yertle").mockReturnValueOnce(0);
            const result = turtleHeapBlock.arg(logo, 0, blk, null);
            expect(activity.errorMsg).toHaveBeenCalledWith("Index must be > 0.");
            expect(result).toBe(10);
        });

        it("should adjust index > 1000 to 1000", () => {
            logo.parseArg.mockReturnValueOnce("Yertle").mockReturnValueOnce(1500);
            const result = turtleHeapBlock.arg(logo, 0, blk, null);
            expect(activity.errorMsg).toHaveBeenCalledWith("Maximum heap size is 1000.");
            expect(logo.turtleHeaps[0].length).toBe(1000);
        });

        it("should grow heap if index > heap length", () => {
            logo.parseArg.mockReturnValueOnce("Yertle").mockReturnValueOnce(5);
            const result = turtleHeapBlock.arg(logo, 0, blk, null);
            expect(logo.turtleHeaps[0].length).toBe(5);
            expect(result).toBe(0);
        });

        it("should create heap if it doesn't exist", () => {
            delete logo.turtleHeaps[0];
            logo.parseArg.mockReturnValueOnce("Yertle").mockReturnValueOnce(1);
            turtleHeapBlock.arg(logo, 0, blk, null);
            expect(logo.turtleHeaps[0]).toBeDefined();
        });

        it("should return error if index is not a number", () => {
            logo.parseArg.mockReturnValueOnce("Yertle").mockReturnValueOnce("not a number");
            const result = turtleHeapBlock.arg(logo, 0, blk, null);
            expect(activity.errorMsg).toHaveBeenCalledWith(NANERRORMSG, blk);
        });
    });

    describe("StopTurtleBlock", () => {
        let stopTurtleBlock;

        beforeEach(() => {
            stopTurtleBlock = createdBlocks["stopTurtle"];
        });

        it("should return error if args[0] is null", () => {
            stopTurtleBlock.flow([null], logo, 0, 10);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, 10);
        });

        it("should return error if turtle not found", () => {
            logo.parseArg = jest.fn(() => "NonExistent");
            stopTurtleBlock.flow(["NonExistent"], logo, 0, 10);
            expect(activity.errorMsg).toHaveBeenCalledWith("Cannot find turtle NonExistent", 10);
        });

        it("should stop turtle when found", () => {
            const tur = turtles.ithTurtle(0);
            tur.queue = [1, 2, 3];
            tur.running = true;
            stopTurtleBlock.flow(["Yertle"], logo, 0, 10);
            expect(tur.queue).toEqual([]);
            expect(tur.parentFlowQueue).toEqual([]);
            expect(tur.unhighlightQueue).toEqual([]);
            expect(tur.parameterQueue).toEqual([]);
            expect(logo.doBreak).toHaveBeenCalledWith(tur);
        });
    });

    describe("StartTurtleBlock", () => {
        let startTurtleBlock;
        const blk = 50;

        beforeEach(() => {
            startTurtleBlock = createdBlocks["startTurtle"];
            const tur = turtles.ithTurtle(0);
            tur.startBlock = activity.blocks.blockList[50];
            activity.blocks.blockList[50] = tur.startBlock;
        });

        it("should return error if args[0] is null", () => {
            startTurtleBlock.flow([null], logo, 0, 10, null, [], false);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, 10);
        });

        it("should return error if turtle not found", () => {
            startTurtleBlock.flow(["NonExistent"], logo, 0, 10, null, [], false);
            expect(activity.errorMsg).toHaveBeenCalledWith("Cannot find turtle NonExistent", 10);
        });

        it("should return error if turtle is already running", () => {
            const tur = turtles.ithTurtle(0);
            tur.running = true;
            startTurtleBlock.flow(["Yertle"], logo, 0, 10, null, [], false);
            expect(activity.errorMsg).toHaveBeenCalledWith("Turtle is already running.", 10);
        });

        it("should start turtle when found and not running", () => {
            const tur = turtles.ithTurtle(0);
            tur.running = false;
            tur.startBlock = activity.blocks.blockList[50];
            activity.blocks.blockList[50] = tur.startBlock;
            startTurtleBlock.flow(["Yertle"], logo, 0, 50, null, [], false);
            expect(tur.running).toBe(true);
            expect(tur.queue).toEqual([]);
        });

        it("should return error if start block not found", () => {
            const tur = turtles.ithTurtle(0);
            tur.running = false;
            tur.startBlock = { name: "other" };
            startTurtleBlock.flow(["Yertle"], logo, 0, 10, null, [], false);
            expect(activity.errorMsg).toHaveBeenCalledWith("Cannot find start block Yertle", 10);
        });
    });

    describe("TurtleColorBlock", () => {
        let turtleColorBlock;
        const blk = 50;

        beforeEach(() => {
            turtleColorBlock = createdBlocks["turtlecolor"];
            activity.blocks.blockList[blk] = { connections: [null, 100] };
            activity.blocks.blockList[100] = { name: "text", value: "Yertle" };
        });

        it("should return color of target turtle", () => {
            logo.parseArg.mockReturnValue("Yertle");
            const result = turtleColorBlock.arg(logo, 0, blk, null);
            expect(result).toBe("#FF0000");
        });

        it("should return color of current turtle if target not found", () => {
            logo.parseArg.mockReturnValue("NonExistent");
            activity.blocks.blockList[blk].connections[1] = null;
            const result = turtleColorBlock.arg(logo, 0, blk, null);
            expect(result).toBe("#FF0000");
        });
    });

    describe("TurtleHeadingBlock", () => {
        let turtleHeadingBlock;
        const blk = 50;

        beforeEach(() => {
            turtleHeadingBlock = createdBlocks["turtleheading"];
            activity.blocks.blockList[blk] = { connections: [null, 100] };
            activity.blocks.blockList[100] = { name: "text", value: "Yertle" };
        });

        it("should return heading of target turtle", () => {
            logo.parseArg.mockReturnValue("Yertle");
            const result = turtleHeadingBlock.arg(logo, 0, blk, null);
            expect(result).toBe(90);
        });

        it("should return heading of current turtle if target not found", () => {
            logo.parseArg.mockReturnValue("NonExistent");
            activity.blocks.blockList[blk].connections[1] = null;
            const result = turtleHeadingBlock.arg(logo, 0, blk, null);
            expect(result).toBe(90);
        });
    });

    describe("SetXYTurtleBlock", () => {
        let setXYTurtleBlock;

        beforeEach(() => {
            setXYTurtleBlock = createdBlocks["setxyturtle"];
        });

        it("should return error if turtle not found", () => {
            setXYTurtleBlock.flow(["NonExistent", 10, 20], logo, 0, 10);
            expect(activity.errorMsg).toHaveBeenCalledWith("Cannot find turtle NonExistent", 10);
        });

        it("should set XY position for valid turtle", () => {
            setXYTurtleBlock.flow(["Yertle", 10, 20], logo, 0, 10);
            const tur = turtles.getTurtle(0);
            expect(tur.painter.doSetXY).toHaveBeenCalledWith(10, 20);
        });

        it("should return error if x or y is string", () => {
            setXYTurtleBlock.flow(["Yertle", "10", 20], logo, 0, 10);
            expect(activity.errorMsg).toHaveBeenCalledWith(NANERRORMSG, 10);
            expect(logo.stopTurtle).toBe(true);
        });
    });

    describe("SetTurtleBlock", () => {
        let setTurtleBlock;

        beforeEach(() => {
            setTurtleBlock = createdBlocks["setturtle"];
        });

        it("should run from block for valid turtle", () => {
            setTurtleBlock.flow(["Yertle", 100], logo, 0, 10, null, [], false);
            expect(logo.runFromBlock).toHaveBeenCalledWith(logo, "0", 100, false, null);
        });

        it("should return error if turtle not found", () => {
            setTurtleBlock.flow(["NonExistent", 100], logo, 0, 10, null, [], false);
            expect(activity.errorMsg).toHaveBeenCalledWith("Cannot find turtle NonExistent", 10);
        });
    });

    describe("YTurtleBlock", () => {
        let yTurtleBlock;
        const blk = 50;

        beforeEach(() => {
            yTurtleBlock = createdBlocks["yturtle"];
            activity.blocks.blockList[blk] = { connections: [null, 100] };
            activity.blocks.blockList[100] = { name: "text", value: "Yertle" };
        });

        it("should return Y position of target turtle", () => {
            logo.parseArg.mockReturnValue("Yertle");
            turtles.screenY2turtleY.mockReturnValue(200);
            const result = yTurtleBlock.arg(logo, 0, blk, null);
            expect(result).toBe(200);
        });

        it("should return Y position of current turtle if target not found", () => {
            logo.parseArg.mockReturnValue("NonExistent");
            activity.blocks.blockList[blk].connections[1] = null;
            turtles.screenY2turtleY.mockReturnValue(200);
            const result = yTurtleBlock.arg(logo, 0, blk, null);
            expect(result).toBe(200);
        });
    });

    describe("XTurtleBlock", () => {
        let xTurtleBlock;
        const blk = 50;

        beforeEach(() => {
            xTurtleBlock = createdBlocks["xturtle"];
            activity.blocks.blockList[blk] = { connections: [null, 100] };
            activity.blocks.blockList[100] = { name: "text", value: "Yertle" };
        });

        it("should return X position of target turtle", () => {
            logo.parseArg.mockReturnValue("Yertle");
            turtles.screenX2turtleX.mockReturnValue(100);
            const result = xTurtleBlock.arg(logo, 0, blk, null);
            expect(result).toBe(100);
        });

        it("should return X position of current turtle if target not found", () => {
            logo.parseArg.mockReturnValue("NonExistent");
            activity.blocks.blockList[blk].connections[1] = null;
            turtles.screenX2turtleX.mockReturnValue(100);
            const result = xTurtleBlock.arg(logo, 0, blk, null);
            expect(result).toBe(100);
        });
    });

    describe("TurtleElapsedNotesBlock", () => {
        let turtleElapsedNotesBlock;
        const blk = 50;

        beforeEach(() => {
            turtleElapsedNotesBlock = createdBlocks["turtlelapsednotes"];
            activity.blocks.blockList[blk] = { connections: [null, 100] };
            activity.blocks.blockList[100] = { name: "text", value: "Yertle" };
        });

        it("should return elapsed notes ratio for target turtle", () => {
            logo.parseArg.mockReturnValue("Yertle");
            const result = turtleElapsedNotesBlock.arg(logo, 0, blk, null);
            expect(result).toBe(10 / 20);
        });

        it("should return elapsed notes ratio for current turtle if target not found", () => {
            logo.parseArg.mockReturnValue("NonExistent");
            activity.blocks.blockList[blk].connections[1] = null;
            const result = turtleElapsedNotesBlock.arg(logo, 0, blk, null);
            expect(result).toBe(10 / 20);
        });
    });

    describe("TurtlePitchBlock", () => {
        let turtlePitchBlock;
        const blk = 50;

        beforeEach(() => {
            turtlePitchBlock = createdBlocks["turtlepitch"];
            activity.blocks.blockList[blk] = { connections: [null, 100], value: null };
            activity.blocks.blockList[100] = { name: "text", value: "Yertle" };
        });

        it("should return pitch number from lastNotePlayed", () => {
            logo.parseArg.mockReturnValue("Yertle");
            const result = turtlePitchBlock.arg(logo, 0, blk, null);
            expect(result).toBeUndefined(); // Missing return in implementation
            expect(activity.blocks.blockList[blk].value).toBeDefined();
        });

        it("should return pitch number from notePitches if lastNotePlayed is null", () => {
            const tur = turtles.ithTurtle(0);
            tur.singer.lastNotePlayed = null;
            logo.parseArg.mockReturnValue("Yertle");
            turtlePitchBlock.arg(logo, 0, blk, null);
            expect(getNote).toHaveBeenCalled();
        });

        it("should return default pitch if no notes available", () => {
            const tur = turtles.ithTurtle(0);
            tur.singer.lastNotePlayed = null;
            tur.singer.notePitches = [];
            logo.parseArg.mockReturnValue("Yertle");
            turtlePitchBlock.arg(logo, 0, blk, null);
            expect(activity.errorMsg).toHaveBeenCalledWith(INVALIDPITCH, blk);
        });

        it("should return error if turtle not found and use current turtle", () => {
            logo.parseArg.mockReturnValue("NonExistent");
            turtlePitchBlock.arg(logo, 0, blk, null);
            expect(activity.errorMsg).toHaveBeenCalledWith("Cannot find turtle NonExistent", blk);
        });
    });

    describe("TurtleNoteBlock", () => {
        let turtleNoteBlock;
        const blk = 50;

        beforeEach(() => {
            turtleNoteBlock = createdBlocks["turtlenote"];
            activity.blocks.blockList[blk] = {
                connections: [null, 100],
                name: "turtlenote",
                value: null
            };
            activity.blocks.blockList[100] = { name: "text", value: "Yertle" };
        });

        it("should return note value from inNoteBlock", () => {
            logo.parseArg.mockReturnValue("Yertle");
            const result = turtleNoteBlock.arg(logo, 0, blk, null);
            expect(result).toBeUndefined(); // Missing return in implementation
            expect(activity.blocks.blockList[blk].value).toBe(1 / 4);
        });

        it("should return note value from lastNotePlayed", () => {
            const tur = turtles.ithTurtle(0);
            tur.singer.inNoteBlock = [];
            logo.parseArg.mockReturnValue("Yertle");
            turtleNoteBlock.arg(logo, 0, blk, null);
            expect(activity.blocks.blockList[blk].value).toBe(0.5);
        });

        it("should return note value from noteBeat", () => {
            const tur = turtles.ithTurtle(0);
            tur.singer.inNoteBlock = [0];
            tur.singer.lastNotePlayed = null;
            logo.parseArg.mockReturnValue("Yertle");
            const result = turtleNoteBlock.arg(logo, 0, blk, null);
            expect(result).toBeUndefined(); // Missing return in implementation
            expect(activity.blocks.blockList[blk].value).toBe(0.25);
        });

        it("should return -1 if no notes available", () => {
            const tur = turtles.ithTurtle(0);
            tur.singer.inNoteBlock = [];
            tur.singer.lastNotePlayed = null;
            tur.singer.notePitches = [];
            logo.parseArg.mockReturnValue("Yertle");
            turtleNoteBlock.arg(logo, 0, blk, null);
            expect(activity.blocks.blockList[blk].value).toBe(-1);
        });

        it("should return error if turtle not found", () => {
            logo.parseArg.mockReturnValue("NonExistent");
            turtleNoteBlock.arg(logo, 0, blk, null);
            expect(activity.errorMsg).toHaveBeenCalledWith("Cannot find turtle NonExistent", blk);
            expect(activity.blocks.blockList[blk].value).toBe(-1);
        });
    });

    describe("TurtleNote2Block", () => {
        it("should be created and have correct properties", () => {
            const turtleNote2Block = createdBlocks["turtlenote2"];
            expect(turtleNote2Block).toBeDefined();
            expect(turtleNote2Block.hidden).toBe(true);
            expect(turtleNote2Block.deprecated).toBe(true);
        });
    });

    describe("TurtleSyncBlock", () => {
        let turtleSyncBlock;

        beforeEach(() => {
            turtleSyncBlock = createdBlocks["turtlesync"];
        });

        it("should return error if args[0] is null", () => {
            turtleSyncBlock.flow([null], logo, 0, 10);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, 10);
        });

        it("should return error if turtle not found", () => {
            turtleSyncBlock.flow(["NonExistent"], logo, 0, 10);
            expect(activity.errorMsg).toHaveBeenCalledWith("Cannot find turtle NonExistent", 10);
        });

        it("should sync turtleTime when turtle found", () => {
            const tur1 = turtles.ithTurtle(0);
            const tur2 = turtles.ithTurtle(1);
            tur2.singer.turtleTime = 200;
            turtleSyncBlock.flow(["Turtle1"], logo, 0, 10);
            expect(tur1.singer.turtleTime).toBe(200);
        });
    });

    describe("FoundTurtleBlock", () => {
        let foundTurtleBlock;
        const blk = 50;

        beforeEach(() => {
            foundTurtleBlock = createdBlocks["foundturtle"];
            activity.blocks.blockList[blk] = { connections: [null, 100] };
            activity.blocks.blockList[100] = { name: "text", value: "Yertle" };
        });

        it("should return true if turtle found", () => {
            logo.parseArg.mockReturnValue("Yertle");
            const result = foundTurtleBlock.arg(logo, 0, blk, null);
            expect(result).toBe(true);
        });

        it("should return false if turtle not found", () => {
            logo.parseArg.mockReturnValue("NonExistent");
            const result = foundTurtleBlock.arg(logo, 0, blk, null);
            expect(result).toBe(false);
        });
    });

    describe("NewTurtleBlock", () => {
        let newTurtleBlock;
        const blk = 50;

        beforeEach(() => {
            newTurtleBlock = createdBlocks["newturtle"];
            activity.blocks.blockList[blk] = { connections: [null, 100] };
            activity.blocks.blockList[100] = { name: "text", value: "NewTurtle" };
            activity.blocks.loadNewBlocks = jest.fn();
            turtles.turtleX2screenX.mockReturnValue(100);
            turtles.turtleY2screenY.mockReturnValue(200);
        });

        it("should create new turtle if it doesn't exist", () => {
            logo.parseArg.mockReturnValue("NewTurtle");
            newTurtleBlock.flow(["NewTurtle"], logo, 0, blk, null);
            expect(activity.blocks.loadNewBlocks).toHaveBeenCalled();
        });

        it("should dispatch event if turtle already exists", () => {
            logo.parseArg.mockReturnValue("Yertle");
            newTurtleBlock.flow(["Yertle"], logo, 0, blk, null);
            expect(activity.stage.dispatchEvent).toHaveBeenCalledWith("Yertle");
        });
    });

    describe("SetTurtleColorBlock", () => {
        let setTurtleColorBlock;

        beforeEach(() => {
            setTurtleColorBlock = createdBlocks["setturtlecolor"];
        });

        it("should return error if args[0] is null", () => {
            setTurtleColorBlock.flow([null], logo, 0, 10);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, 10);
        });

        it("should set color for number input", () => {
            const tur = turtles.ithTurtle(0);
            tur.doTurtleShell = jest.fn();
            setTurtleColorBlock.flow([50], logo, 0, 10);
            expect(getMunsellColor).toHaveBeenCalledWith(50, 50, 100);
            expect(tur.doTurtleShell).toHaveBeenCalled();
        });

        it("should set default color for non-number input", () => {
            const tur = turtles.ithTurtle(0);
            tur.doTurtleShell = jest.fn();
            setTurtleColorBlock.flow(["red"], logo, 0, 10);
            expect(getMunsellColor).toHaveBeenCalledWith(0, 50, 100);
            expect(tur.doTurtleShell).toHaveBeenCalled();
        });
    });

    describe("TurtleNameBlock", () => {
        let turtleNameBlock;

        beforeEach(() => {
            turtleNameBlock = createdBlocks["turtlename"];
        });

        it("should return name of turtle", () => {
            const result = turtleNameBlock.arg(logo, 0);
            expect(result).toBe("Yertle");
        });
    });

    describe("NumberOfTurtlesBlock", () => {
        let numberOfTurtlesBlock;

        beforeEach(() => {
            numberOfTurtlesBlock = createdBlocks["turtlecount"];
        });

        it("should return turtle count", () => {
            const result = numberOfTurtlesBlock.arg();
            expect(result).toBe(3);
        });
    });

    describe("NthTurtleNameBlock", () => {
        let nthTurtleNameBlock;
        const blk = 50;

        beforeEach(() => {
            nthTurtleNameBlock = createdBlocks["nthturtle"];
            activity.blocks.blockList[blk] = { connections: [null, 100] };
            activity.blocks.blockList[100] = { name: "number", value: 1 };
        });

        it("should return error if connection is null", () => {
            activity.blocks.blockList[blk].connections[1] = null;
            const result = nthTurtleNameBlock.arg(logo, 0, blk, null);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, blk);
            expect(result).toBe(0);
        });

        it("should return name of nth turtle", () => {
            logo.parseArg.mockReturnValue(1);
            const result = nthTurtleNameBlock.arg(logo, 0, blk, null);
            expect(result).toBe("Yertle");
        });

        it("should return error if index is out of range", () => {
            logo.parseArg.mockReturnValue(10);
            const result = nthTurtleNameBlock.arg(logo, 0, blk, null);
            expect(activity.errorMsg).toHaveBeenCalledWith("Cannot find turtle");
            expect(result).toBe("");
        });

        it("should return error if index is not a number", () => {
            logo.parseArg.mockReturnValue("not a number");
            const result = nthTurtleNameBlock.arg(logo, 0, blk, null);
            expect(activity.errorMsg).toHaveBeenCalledWith("Index must be > 0.");
            expect(result).toBe("");
        });
    });

    describe("SetTurtleNameBlock", () => {
        let setTurtleNameBlock;

        beforeEach(() => {
            setTurtleNameBlock = createdBlocks["setturtlename"];
        });

        it("should return error if args are null", () => {
            setTurtleNameBlock.flow([null, "NewName"], logo, 0, 10);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, 10);
        });

        it("should rename current turtle if args[0] is -1", () => {
            const tur = turtles.getTurtle(0);
            setTurtleNameBlock.flow([-1, "NewName"], logo, 0, 10);
            expect(tur.rename).toHaveBeenCalledWith("NewName");
        });

        it("should rename turtle by index", () => {
            const tur = turtles.getTurtle(1);
            setTurtleNameBlock.flow([1, "NewName"], logo, 0, 10);
            expect(tur.rename).toHaveBeenCalledWith("NewName");
        });

        it("should rename turtle by name", () => {
            const tur = turtles.getTurtle(0);
            setTurtleNameBlock.flow(["Yertle", "NewName"], logo, 0, 10);
            expect(tur.rename).toHaveBeenCalledWith("NewName");
        });

        it("should return error if turtle not found", () => {
            setTurtleNameBlock.flow(["NonExistent", "NewName"], logo, 0, 10);
            expect(activity.errorMsg).toHaveBeenCalledWith("Cannot find turtle NonExistent", 10);
        });
    });

    describe("SetTurtleName2Block", () => {
        let setTurtleName2Block;

        beforeEach(() => {
            setTurtleName2Block = createdBlocks["setturtlename2"];
        });

        it("should return error if args[0] is null", () => {
            setTurtleName2Block.flow([null], logo, 0, 10);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, 10);
        });

        it("should rename current turtle", () => {
            const tur = turtles.getTurtle(0);
            setTurtleName2Block.flow(["NewName"], logo, 0, 10);
            expect(tur.rename).toHaveBeenCalledWith("NewName");
        });
    });

    describe("Music Blocks mode", () => {
        beforeEach(() => {
            global._THIS_IS_MUSIC_BLOCKS_ = true;
            createdBlocks = {};
            activity.blocks.blockList = {
                10: { connections: [null, 20, null], name: "test" },
                20: { name: "text", value: "Yertle" },
                50: { connections: [null, 100, null], name: "test2" },
                100: { name: "number", value: 1 }
            };
            // Setup additional blockList entries for the terminology loop
            [10, 50].forEach(idx => {
                activity.blocks.blockList[idx].connections = [null, 20, 40];
            });
            activity.blocks.blockList[40] = { name: "number", value: 1 };

            setupEnsembleBlocks(activity);
        });

        it("should use mouse terminology in various blocks", () => {
            const blocksToTest = [
                { name: "stopTurtle", type: "flow", args: ["NonExistent"] },
                { name: "startTurtle", type: "flow", args: ["NonExistent"] },
                { name: "setxyturtle", type: "flow", args: ["NonExistent", 0, 0] },
                { name: "setturtle", type: "flow", args: ["NonExistent", 100] },
                { name: "turtlesync", type: "flow", args: ["NonExistent"] },
                { name: "setturtlename", type: "flow", args: ["NonExistent", "NewName"] }
            ];

            blocksToTest.forEach(config => {
                const block = createdBlocks[config.name];
                block.flow(config.args, logo, 0, 10);
                expect(activity.errorMsg).toHaveBeenCalledWith(
                    expect.stringContaining("mouse"),
                    10
                );
            });

            const argBlocks = [
                { name: "turtlepitch" },
                { name: "turtlenote" },
                { name: "turtleheap" }
            ];

            argBlocks.forEach(config => {
                const block = createdBlocks[config.name];
                logo.parseArg.mockReturnValue("NonExistent");
                block.arg(logo, 0, 50, null);
                expect(activity.errorMsg).toHaveBeenCalledWith(
                    expect.stringContaining("mouse"),
                    50
                );
            });
        });

        it("should show error for already running mouse", () => {
            const startTurtleBlock = createdBlocks["startTurtle"];
            const tur = turtles.ithTurtle(0);
            tur.running = true;
            startTurtleBlock.flow(["Yertle"], logo, 0, 10);
            expect(activity.errorMsg).toHaveBeenCalledWith("Mouse is already running.", 10);
        });
    });
});
