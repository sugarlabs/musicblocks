/**
 * MusicBlocks v3.6.2
 *
 * @author Shreya Saxena
 *
 * @copyright 2025 Shreya Saxena
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

global._ = jest.fn(s => s);
global.last = arr => arr[arr.length - 1];
global.NANERRORMSG = "NaN error";
global.NOINPUTERRORMSG = "No input error";
global._THIS_IS_MUSIC_BLOCKS_ = false;
global.toFixed2 = jest.fn(n => n);
global.MusicBlocks = { isRun: false };
global.Mouse = { getMouseFromTurtle: jest.fn(() => null) };

/* Base block mocks */
global.ValueBlock = class {
    constructor(name) {
        this.name = name;
        this.capabilities = Object.create(null);
    }
    setPalette = jest.fn();
    setHelpString = jest.fn();
    formBlock = jest.fn();
    beginnerBlock = jest.fn();
    setCapability(name, value = true) {
        this.capabilities[name] = !!value;
        return this;
    }
    getCapability(name) {
        return Object.prototype.hasOwnProperty.call(this.capabilities, name)
            ? this.capabilities[name]
            : undefined;
    }

    setup(activity) {
        activity.blocks[this.name] = this.constructor;
    }
};

global.FlowBlock = class extends global.ValueBlock {};
global.FlowClampBlock = class extends global.FlowBlock {
    makeMacro = jest.fn();
};

const { setupGraphicsBlocks } = require("../GraphicsBlocks");

describe("GraphicsBlocks", () => {
    let activity, logo, turtle, turtleObj;

    beforeEach(() => {
        turtle = 0;

        turtleObj = {
            singer: {
                inNoteBlock: [],
                suppressOutput: false,
                embeddedGraphics: [[]]
            },
            painter: {
                doSetHeading: jest.fn(),
                doSetXY: jest.fn(),
                doScrollXY: jest.fn(),
                doClear: jest.fn(),
                doBezier: jest.fn(),
                doArc: jest.fn(),
                doForward: jest.fn(),
                doRight: jest.fn(),
                setControlPoint1: jest.fn(),
                setControlPoint2: jest.fn(),
                penState: true,
                wrap: false
            },
            x: 0,
            y: 0,
            orientation: 45,
            container: { x: 10, y: 20 }
        };

        activity = {
            blocks: {
                blockList: {
                    0: { connections: [null] }
                }
            },
            errorMsg: jest.fn(),
            turtles: {
                companionTurtle: jest.fn(() => 0),
                ithTurtle: jest.fn(() => turtleObj),
                getTurtle: jest.fn(() => turtleObj),
                screenX2turtleX: jest.fn(x => x),
                screenY2turtleY: jest.fn(y => y)
            }
        };

        logo = {
            inMatrix: false,
            inStatusMatrix: false,
            statusFields: [],
            phraseMaker: {
                addRowBlock: jest.fn(),
                rowLabels: [],
                rowArgs: []
            },
            pitchBlocks: [],
            setDispatchBlock: jest.fn(),
            setTurtleListener: jest.fn()
        };

        setupGraphicsBlocks(activity);
    });

    test("setupGraphicsBlocks initializes without crashing", () => {
        expect(typeof setupGraphicsBlocks).toBe("function");
        expect(activity.blocks).toBeDefined();
    });

    test("HeadingBlock: arg returns turtle orientation", () => {
        const Heading = activity.blocks.heading;
        const block = new Heading();

        const value = block.arg(logo, turtle, 0);
        expect(value).toBe(45);
    });

    test("XBlock: arg returns turtle X position", () => {
        const X = activity.blocks.x;
        const block = new X();

        const value = block.arg(logo, turtle, 0);
        expect(value).toBe(10);
    });

    test("YBlock: arg returns turtle Y position", () => {
        const Y = activity.blocks.y;
        const block = new Y();

        const value = block.arg(logo, turtle, 0);
        expect(value).toBe(20);
    });

    test("ForwardBlock: flow moves turtle forward", () => {
        const Forward = activity.blocks.forward;
        const block = new Forward();

        block.flow([100], logo, turtle, 1);
        expect(turtleObj.painter.doForward).toHaveBeenCalledWith(100);
    });

    test("RightBlock: flow turns turtle right", () => {
        const Right = activity.blocks.right;
        const block = new Right();

        block.flow([90], logo, turtle, 1);
        expect(turtleObj.painter.doRight).toHaveBeenCalledWith(90);
    });

    test("BackBlock: flow moves turtle backward", () => {
        const Back = activity.blocks.back;
        const block = new Back();

        block.flow([50], logo, turtle, 1);
        expect(turtleObj.painter.doForward).toHaveBeenCalledWith(-50);
    });

    test("SetXYBlock: flow sets turtle position", () => {
        const SetXY = activity.blocks.setxy;
        const block = new SetXY();

        block.flow([30, 40], logo, turtle, 1);
        expect(turtleObj.painter.doSetXY).toHaveBeenCalledWith(30, 40);
    });

    test("ScrollXYBlock: flow scrolls canvas", () => {
        const ScrollXY = activity.blocks.scrollxy;
        const block = new ScrollXY();

        block.flow([10, 20], logo, turtle, 1);
        expect(turtleObj.painter.doScrollXY).toHaveBeenCalledWith(10, 20);
    });

    test("ClearBlock: flow clears turtle drawing", () => {
        const Clear = activity.blocks.clear;
        const block = new Clear();

        block.flow([], logo, turtle, 1);
        expect(turtleObj.painter.doClear).toHaveBeenCalled();
    });

    test("ArcBlock: flow draws arc", () => {
        const Arc = activity.blocks.arc;
        const block = new Arc();

        block.flow([90, 100], logo, turtle, 1);
        expect(turtleObj.painter.doArc).toHaveBeenCalledWith(90, 100);
    });

    // ── SetHeadingBlock ─────────────────────────────
    describe("SetHeadingBlock (setheading)", () => {
        test("SetHeadingBlock is registered", () => {
            expect(activity.blocks.setheading).toBeDefined();
        });
        test("flow calls doSetHeading with correct angle", () => {
            const block = new activity.blocks.setheading();
            block.flow([90], logo, turtle, 1);
            expect(turtleObj.painter.doSetHeading).toHaveBeenCalledWith(90);
        });
        test("flow calls doSetHeading with 0 degrees", () => {
            const block = new activity.blocks.setheading();
            block.flow([0], logo, turtle, 1);
            expect(turtleObj.painter.doSetHeading).toHaveBeenCalledWith(0);
        });
        test("flow calls doSetHeading with negative angle", () => {
            const block = new activity.blocks.setheading();
            block.flow([-45], logo, turtle, 1);
            expect(turtleObj.painter.doSetHeading).toHaveBeenCalledWith(-45);
        });
    });

    // ── MLeftBlock ───────────────────────────────────
    describe("MLeftBlock (left)", () => {
        test("MLeftBlock is registered", () => {
            expect(activity.blocks.left).toBeDefined();
        });
        test("flow turns turtle left (negative right)", () => {
            const block = new activity.blocks.left();
            block.flow([90], logo, turtle, 1);
            expect(turtleObj.painter.doRight).toHaveBeenCalledWith(-90);
        });
        test("flow with 0 degrees", () => {
            const block = new activity.blocks.left();
            block.flow([0], logo, turtle, 1);
            expect(turtleObj.painter.doRight).toHaveBeenCalledWith(-0);
        });
        test("flow with 180 degrees", () => {
            const block = new activity.blocks.left();
            block.flow([180], logo, turtle, 1);
            expect(turtleObj.painter.doRight).toHaveBeenCalledWith(-180);
        });
    });

    // ── BezierBlock ──────────────────────────────────
    describe("BezierBlock (bezier)", () => {
        test("BezierBlock is registered", () => {
            expect(activity.blocks.bezier).toBeDefined();
        });
        test("flow calls doBezier with correct args", () => {
            const block = new activity.blocks.bezier();
            block.flow([100, 150], logo, turtle, 1);
            expect(turtleObj.painter.doBezier).toHaveBeenCalledWith(100, 150);
        });
        test("flow called with zero values", () => {
            const block = new activity.blocks.bezier();
            block.flow([0, 0], logo, turtle, 1);
            expect(turtleObj.painter.doBezier).toHaveBeenCalledWith(0, 0);
        });
        test("flow called with negative values", () => {
            const block = new activity.blocks.bezier();
            block.flow([-50, -75], logo, turtle, 1);
            expect(turtleObj.painter.doBezier).toHaveBeenCalledWith(-50, -75);
        });
    });

    // ── ControlPoint1Block ───────────────────────────
    describe("ControlPoint1Block (controlpoint1)", () => {
        test("ControlPoint1Block is registered", () => {
            expect(activity.blocks.controlpoint1).toBeDefined();
        });
        test("flow calls setControlPoint1", () => {
            const block = new activity.blocks.controlpoint1();
            block.flow([50, 60], logo, turtle, 1);
            expect(turtleObj.painter.setControlPoint1).toHaveBeenCalledWith([50, 60]);
        });
        test("flow with zero values", () => {
            const block = new activity.blocks.controlpoint1();
            block.flow([0, 0], logo, turtle, 1);
            expect(turtleObj.painter.setControlPoint1).toHaveBeenCalledWith([0, 0]);
        });
    });

    // ── ControlPoint2Block ───────────────────────────
    describe("ControlPoint2Block (controlpoint2)", () => {
        test("ControlPoint2Block is registered", () => {
            expect(activity.blocks.controlpoint2).toBeDefined();
        });
        test("flow calls setControlPoint2", () => {
            const block = new activity.blocks.controlpoint2();
            block.flow([70, 80], logo, turtle, 1);
            expect(turtleObj.painter.setControlPoint2).toHaveBeenCalledWith([70, 80]);
        });
        test("flow with negative values", () => {
            const block = new activity.blocks.controlpoint2();
            block.flow([-30, -40], logo, turtle, 1);
            expect(turtleObj.painter.setControlPoint2).toHaveBeenCalledWith([-30, -40]);
        });
    });

    // ── WrapModeBlock ────────────────────────────────
    describe("WrapModeBlock (wrapmode)", () => {
        test("WrapModeBlock is registered", () => {
            expect(activity.blocks.wrapmode).toBeDefined();
        });
        test("WrapModeBlock declares the valueDrivenLabel capability", () => {
            const block = new activity.blocks.wrapmode();
            expect(block.getCapability("valueDrivenLabel")).toBe(true);
        });
        test("arg returns true when wrap is on", () => {
            turtleObj.painter.wrap = true;
            const block = new activity.blocks.wrapmode();
            expect(block.arg(logo, turtle, 0)).toBe(true);
        });
        test("arg returns false when wrap is off", () => {
            turtleObj.painter.wrap = false;
            const block = new activity.blocks.wrapmode();
            expect(block.arg(logo, turtle, 0)).toBe(false);
        });
    });

    // ── WrapBlock ────────────────────────────────────
    describe("WrapBlock (wrap)", () => {
        test("WrapBlock is registered", () => {
            expect(activity.blocks.wrap).toBeDefined();
        });
        test("flow runs without error", () => {
            const block = new activity.blocks.wrap();
            expect(() => block.flow([true], logo, turtle, 1)).not.toThrow();
        });
    });

    // ── RightBlock extended ──────────────────────────
    describe("RightBlock extended", () => {
        test("RightBlock with 45 degrees", () => {
            const block = new activity.blocks.right();
            block.flow([45], logo, turtle, 1);
            expect(turtleObj.painter.doRight).toHaveBeenCalledWith(45);
        });
        test("RightBlock with 360 degrees", () => {
            const block = new activity.blocks.right();
            block.flow([360], logo, turtle, 1);
            expect(turtleObj.painter.doRight).toHaveBeenCalledWith(360);
        });
    });

    // ── ForwardBlock extended ────────────────────────
    describe("ForwardBlock extended", () => {
        test("ForwardBlock with large value", () => {
            const block = new activity.blocks.forward();
            block.flow([500], logo, turtle, 1);
            expect(turtleObj.painter.doForward).toHaveBeenCalledWith(500);
        });
        test("ForwardBlock with zero", () => {
            const block = new activity.blocks.forward();
            block.flow([0], logo, turtle, 1);
            expect(turtleObj.painter.doForward).toHaveBeenCalledWith(0);
        });
    });

    // ── ArcBlock extended ────────────────────────────
    describe("ArcBlock extended", () => {
        test("ArcBlock with full circle 360 degrees", () => {
            const block = new activity.blocks.arc();
            block.flow([360, 100], logo, turtle, 1);
            expect(turtleObj.painter.doArc).toHaveBeenCalledWith(360, 100);
        });
        test("ArcBlock with small radius", () => {
            const block = new activity.blocks.arc();
            block.flow([45, 10], logo, turtle, 1);
            expect(turtleObj.painter.doArc).toHaveBeenCalledWith(45, 10);
        });
    });

    // ── SetXYBlock extended ──────────────────────────
    describe("SetXYBlock extended", () => {
        test("SetXYBlock with negative coordinates", () => {
            const block = new activity.blocks.setxy();
            block.flow([-100, -200], logo, turtle, 1);
            expect(turtleObj.painter.doSetXY).toHaveBeenCalledWith(-100, -200);
        });
        test("SetXYBlock with zero coordinates", () => {
            const block = new activity.blocks.setxy();
            block.flow([0, 0], logo, turtle, 1);
            expect(turtleObj.painter.doSetXY).toHaveBeenCalledWith(0, 0);
        });
    });

    // ── Forward & Back Out of Bounds & Error Handling ──────
    describe("Forward & Back Out of Bounds & Error Handling", () => {
        test("ForwardBlock reports error when distance > 5000 with wrap off", () => {
            turtleObj.painter.wrap = false;
            const block = new activity.blocks.forward();
            block.flow([6000], logo, turtle, 1);
            expect(activity.errorMsg).toHaveBeenCalled();
        });
        test("ForwardBlock reports NaN error on string argument", () => {
            const block = new activity.blocks.forward();
            block.flow(["far"], logo, turtle, 1);
            expect(activity.errorMsg).toHaveBeenCalledWith(NANERRORMSG, 1);
        });
        test("BackBlock reports error when distance < -5000 with wrap off", () => {
            turtleObj.painter.wrap = false;
            const block = new activity.blocks.back();
            block.flow([-6000], logo, turtle, 1);
            expect(activity.errorMsg).toHaveBeenCalled();
        });
        test("BackBlock reports NaN error on string argument", () => {
            const block = new activity.blocks.back();
            block.flow(["backwards"], logo, turtle, 1);
            expect(activity.errorMsg).toHaveBeenCalledWith(NANERRORMSG, 1);
        });
    });

    // ── SuppressOutput Behavior ────────────────────────
    describe("SuppressOutput Behavior (Pen State Isolation)", () => {
        test("ForwardBlock suppresses output by lifting pen temporarily during execution", () => {
            turtleObj.singer.suppressOutput = true;
            turtleObj.painter.penState = true;
            let penStateDuringCall;
            turtleObj.painter.doForward = jest.fn(() => {
                penStateDuringCall = turtleObj.painter.penState;
            });
            const block = new activity.blocks.forward();
            block.flow([50], logo, turtle, 1);
            expect(turtleObj.painter.doForward).toHaveBeenCalledWith(50);
            expect(penStateDuringCall).toBe(false);
            expect(turtleObj.painter.penState).toBe(true);
        });
        test("ScrollXYBlock suppresses output by lifting pen temporarily during execution", () => {
            turtleObj.singer.suppressOutput = true;
            turtleObj.painter.penState = true;
            let penStateDuringCall;
            turtleObj.painter.doScrollXY = jest.fn(() => {
                penStateDuringCall = turtleObj.painter.penState;
            });
            const block = new activity.blocks.scrollxy();
            block.flow([10, 20], logo, turtle, 1);
            expect(turtleObj.painter.doScrollXY).toHaveBeenCalledWith(10, 20);
            expect(penStateDuringCall).toBe(false);
            expect(turtleObj.painter.penState).toBe(true);
        });
        test("ClearBlock suppresses output by moving turtle without painting during execution", () => {
            turtleObj.singer.suppressOutput = true;
            turtleObj.painter.penState = true;
            let penStateDuringCall;
            turtleObj.painter.doSetXY = jest.fn(() => {
                penStateDuringCall = turtleObj.painter.penState;
            });
            const block = new activity.blocks.clear();
            block.flow([], logo, turtle, 1);
            expect(turtleObj.painter.doSetXY).toHaveBeenCalledWith(0, 0);
            expect(turtleObj.painter.doSetHeading).toHaveBeenCalledWith(0);
            expect(penStateDuringCall).toBe(false);
            expect(turtleObj.painter.penState).toBe(true);
        });
    });

    // ── EmbeddedGraphics in NoteBlocks ─────────
    describe("EmbeddedGraphics in NoteBlocks", () => {
        test("ForwardBlock pushes block ID to embeddedGraphics when in note block", () => {
            turtleObj.singer.inNoteBlock = [0];
            turtleObj.singer.embeddedGraphics = [[]];
            const block = new activity.blocks.forward();
            block.flow([100], logo, turtle, 42);
            expect(turtleObj.singer.embeddedGraphics[0]).toContain(42);
        });
        test("RightBlock pushes block ID to embeddedGraphics when in note block", () => {
            turtleObj.singer.inNoteBlock = [0];
            turtleObj.singer.embeddedGraphics = [[]];
            const block = new activity.blocks.right();
            block.flow([90], logo, turtle, 99);
            expect(turtleObj.singer.embeddedGraphics[0]).toContain(99);
        });
    });

    // ── Matrix / PhraseMaker Integration ──────────────
    describe("Matrix / PhraseMaker Integration", () => {
        test("ForwardBlock records row block and args when logo.inMatrix is true", () => {
            logo.inMatrix = true;
            activity.blocks.blockList = { 1: { name: "forward" } };
            const block = new activity.blocks.forward();
            block.flow([50], logo, turtle, 1);
            expect(logo.phraseMaker.addRowBlock).toHaveBeenCalledWith(1);
            expect(logo.phraseMaker.rowLabels).toContain("forward");
            expect(logo.phraseMaker.rowArgs).toContain(50);
        });
        test("SetXYBlock records row block and args when logo.inMatrix is true", () => {
            logo.inMatrix = true;
            activity.blocks.blockList = { 2: { name: "setxy" } };
            const block = new activity.blocks.setxy();
            block.flow([10, 20], logo, turtle, 2);
            expect(logo.phraseMaker.addRowBlock).toHaveBeenCalledWith(2);
            expect(logo.phraseMaker.rowLabels).toContain("setxy");
            expect(logo.phraseMaker.rowArgs).toContainEqual([10, 20]);
        });
        test("ArcBlock records row block and args when logo.inMatrix is true", () => {
            logo.inMatrix = true;
            activity.blocks.blockList = { 3: { name: "arc" } };
            const block = new activity.blocks.arc();
            block.flow([90, 100], logo, turtle, 3);
            expect(logo.phraseMaker.addRowBlock).toHaveBeenCalledWith(3);
            expect(logo.phraseMaker.rowLabels).toContain("arc");
            expect(logo.phraseMaker.rowArgs).toContainEqual([90, 100]);
        });
    });

    // ── WrapBlock (wrap) Extended ──────────────────────
    describe("WrapBlock (wrap) Extended", () => {
        test("WrapBlock enables wrap mode when args[0] is 'on'", () => {
            activity.blocks.blockList[10] = { name: "wrap" };
            const block = new activity.blocks.wrap();
            block.flow(["on", 2], logo, turtle, 10);
            expect(turtleObj.painter.wrap).toBe(true);
            expect(logo.setDispatchBlock).toHaveBeenCalledWith(10, turtle, "_wrap_" + turtle);
        });
        test("WrapBlock disables wrap mode when args[0] is 'off'", () => {
            const block = new activity.blocks.wrap();
            block.flow(["off", 2], logo, turtle, 10);
            expect(turtleObj.painter.wrap).toBe(false);
        });
        test("WrapBlock reports error when args[0] is null", () => {
            const block = new activity.blocks.wrap();
            block.flow([null, 2], logo, turtle, 10);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, 10);
        });
        test("WrapBlock returns undefined when args[1] is missing", () => {
            const block = new activity.blocks.wrap();
            const res = block.flow(["on"], logo, turtle, 10);
            expect(res).toBeUndefined();
        });
    });

    // ── StatusMatrix Connection Tests ────────────────
    describe("StatusMatrix & Print Connection Behavior", () => {
        test("HeadingBlock pushes statusField when parent is print in status matrix", () => {
            logo.inStatusMatrix = true;
            activity.blocks.blockList = {
                0: { connections: [1] },
                1: { name: "print" }
            };
            const block = new activity.blocks.heading();
            block.arg(logo, turtle, 0);
            expect(logo.statusFields).toContainEqual([0, "heading"]);
        });

        test("XBlock pushes statusField when parent is print in status matrix", () => {
            logo.inStatusMatrix = true;
            activity.blocks.blockList = {
                0: { connections: [1] },
                1: { name: "print" }
            };
            const block = new activity.blocks.x();
            block.arg(logo, turtle, 0);
            expect(logo.statusFields).toContainEqual([0, "x"]);
        });

        test("YBlock pushes statusField when parent is print in status matrix", () => {
            logo.inStatusMatrix = true;
            activity.blocks.blockList = {
                0: { connections: [1] },
                1: { name: "print" }
            };
            const block = new activity.blocks.y();
            block.arg(logo, turtle, 0);
            expect(logo.statusFields).toContainEqual([0, "y"]);
        });
    });

    // ── Help String Context Tests ────────────────────
    describe("Help String Terminology Contexts", () => {
        test("HeadingBlock asserts mouse vs turtle terminology based on _THIS_IS_MUSIC_BLOCKS_", () => {
            global._THIS_IS_MUSIC_BLOCKS_ = true;
            const mouseBlock = new activity.blocks.heading();
            expect(mouseBlock.setHelpString).toHaveBeenCalledWith([
                "The Heading block returns the orientation of the mouse.",
                "documentation",
                ""
            ]);

            global._THIS_IS_MUSIC_BLOCKS_ = false;
            const turtleBlock = new activity.blocks.heading();
            expect(turtleBlock.setHelpString).toHaveBeenCalledWith([
                "The Heading block returns the orientation of the turtle.",
                "documentation",
                ""
            ]);
        });

        test("XBlock asserts mouse vs turtle terminology based on _THIS_IS_MUSIC_BLOCKS_", () => {
            global._THIS_IS_MUSIC_BLOCKS_ = true;
            const mouseBlock = new activity.blocks.x();
            expect(mouseBlock.setHelpString).toHaveBeenCalledWith([
                "The X block returns the horizontal position of the mouse.",
                "documentation",
                null,
                "xyhelp"
            ]);

            global._THIS_IS_MUSIC_BLOCKS_ = false;
            const turtleBlock = new activity.blocks.x();
            expect(turtleBlock.setHelpString).toHaveBeenCalledWith([
                "The X block returns the horizontal position of the turtle.",
                "documentation",
                null,
                "xyhelp"
            ]);
        });

        test("YBlock asserts mouse vs turtle terminology based on _THIS_IS_MUSIC_BLOCKS_", () => {
            global._THIS_IS_MUSIC_BLOCKS_ = true;
            const mouseBlock = new activity.blocks.y();
            expect(mouseBlock.setHelpString).toHaveBeenCalledWith([
                "The Y block returns the vertical position of the mouse.",
                "documentation",
                null,
                "xyhelp"
            ]);

            global._THIS_IS_MUSIC_BLOCKS_ = false;
            const turtleBlock = new activity.blocks.y();
            expect(turtleBlock.setHelpString).toHaveBeenCalledWith([
                "The Y block returns the vertical position of the turtle.",
                "documentation",
                null,
                "xyhelp"
            ]);
        });
    });
});
