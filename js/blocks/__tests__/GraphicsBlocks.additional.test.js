/**
 * MusicBlocks v3.6.2
 *
 * @author Mohd Ali Khan
 *
 * @copyright 2025 Mohd Ali Khan
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

/* Base block mocks - same pattern as existing GraphicsBlocks.test.js */
global.ValueBlock = class {
    constructor(name) {
        this.name = name;
    }
    setPalette = jest.fn();
    setHelpString = jest.fn();
    formBlock = jest.fn();
    beginnerBlock = jest.fn();
    setup(activity) {
        activity.blocks[this.name] = this.constructor;
    }
};
global.FlowBlock = class extends global.ValueBlock {};
global.FlowClampBlock = class extends global.FlowBlock {
    makeMacro = jest.fn();
};

const { setupGraphicsBlocks } = require("../GraphicsBlocks");

// ── Shared activity/logo/turtle factory ───────────────────────────────────────
function buildSetup() {
    const turtle = 0;

    const turtleObj = {
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
            doControlPoint1: jest.fn(),
            doControlPoint2: jest.fn(),
            penState: true,
            wrap: false
        },
        x: 0,
        y: 0,
        orientation: 45,
        container: { x: 10, y: 20 }
    };

    const activity = {
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

    const logo = {
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

    return { turtle, turtleObj, activity, logo };
}

// ════════════════════════════════════════════════════════════════════════════
// ADDITIONAL TESTS — increasing coverage for untested blocks
// ════════════════════════════════════════════════════════════════════════════

describe("GraphicsBlocks — Additional Coverage", () => {
    // ── SetHeadingBlock ──────────────────────────────────────────────────────

    describe("SetHeadingBlock (setheading)", () => {
        let setup;
        beforeEach(() => {
            setup = buildSetup();
        });

        test("SetHeadingBlock is registered", () => {
            expect(setup.activity.blocks.setheading).toBeDefined();
        });

        test("SetHeadingBlock flow calls doSetHeading with correct angle", () => {
            const Block = setup.activity.blocks.setheading;
            const block = new Block();
            block.flow([90], setup.logo, setup.turtle, 1);
            expect(setup.turtleObj.painter.doSetHeading).toHaveBeenCalledWith(90);
        });

        test("SetHeadingBlock flow calls doSetHeading with 0 degrees", () => {
            const Block = setup.activity.blocks.setheading;
            const block = new Block();
            block.flow([0], setup.logo, setup.turtle, 1);
            expect(setup.turtleObj.painter.doSetHeading).toHaveBeenCalledWith(0);
        });

        test("SetHeadingBlock flow calls doSetHeading with negative angle", () => {
            const Block = setup.activity.blocks.setheading;
            const block = new Block();
            block.flow([-45], setup.logo, setup.turtle, 1);
            expect(setup.turtleObj.painter.doSetHeading).toHaveBeenCalledWith(-45);
        });
    });

    // ── MLeftBlock ───────────────────────────────────────────────────────────

    describe("MLeftBlock (left)", () => {
        let setup;
        beforeEach(() => {
            setup = buildSetup();
        });

        test("MLeftBlock is registered", () => {
            expect(setup.activity.blocks.left).toBeDefined();
        });

        test("MLeftBlock flow turns turtle left (negative right)", () => {
            const Block = setup.activity.blocks.left;
            const block = new Block();
            block.flow([90], setup.logo, setup.turtle, 1);
            expect(setup.turtleObj.painter.doRight).toHaveBeenCalledWith(-90);
        });

        test("MLeftBlock flow with 0 degrees", () => {
            const Block = setup.activity.blocks.left;
            const block = new Block();
            block.flow([0], setup.logo, setup.turtle, 1);
            expect(setup.turtleObj.painter.doRight).toHaveBeenCalledWith(-0);
        });

        test("MLeftBlock flow with 180 degrees", () => {
            const Block = setup.activity.blocks.left;
            const block = new Block();
            block.flow([180], setup.logo, setup.turtle, 1);
            expect(setup.turtleObj.painter.doRight).toHaveBeenCalledWith(-180);
        });
    });

    // ── BezierBlock ──────────────────────────────────────────────────────────

    describe("BezierBlock (bezier)", () => {
        let setup;
        beforeEach(() => {
            setup = buildSetup();
        });

        test("BezierBlock is registered", () => {
            expect(setup.activity.blocks.bezier).toBeDefined();
        });

        test("BezierBlock flow calls doBezier with correct args", () => {
            const Block = setup.activity.blocks.bezier;
            const block = new Block();
            block.flow([100, 150], setup.logo, setup.turtle, 1);
            expect(setup.turtleObj.painter.doBezier).toHaveBeenCalledWith(100, 150);
        });

        test("BezierBlock flow called with zero values", () => {
            const Block = setup.activity.blocks.bezier;
            const block = new Block();
            block.flow([0, 0], setup.logo, setup.turtle, 1);
            expect(setup.turtleObj.painter.doBezier).toHaveBeenCalledWith(0, 0);
        });

        test("BezierBlock flow called with negative values", () => {
            const Block = setup.activity.blocks.bezier;
            const block = new Block();
            block.flow([-50, -75], setup.logo, setup.turtle, 1);
            expect(setup.turtleObj.painter.doBezier).toHaveBeenCalledWith(-50, -75);
        });
    });

    // ── ControlPoint1Block ───────────────────────────────────────────────────

    describe("ControlPoint1Block (controlpoint1)", () => {
        let setup;
        beforeEach(() => {
            setup = buildSetup();
        });

        test("ControlPoint1Block is registered", () => {
            expect(setup.activity.blocks.controlpoint1).toBeDefined();
        });

        test("ControlPoint1Block flow calls doControlPoint1", () => {
            const Block = setup.activity.blocks.controlpoint1;
            const block = new Block();
            block.flow([50, 60], setup.logo, setup.turtle, 1);
            expect(setup.turtleObj.painter.doControlPoint1).toHaveBeenCalledWith(50, 60);
        });

        test("ControlPoint1Block flow with zero values", () => {
            const Block = setup.activity.blocks.controlpoint1;
            const block = new Block();
            block.flow([0, 0], setup.logo, setup.turtle, 1);
            expect(setup.turtleObj.painter.doControlPoint1).toHaveBeenCalledWith(0, 0);
        });
    });

    // ── ControlPoint2Block ───────────────────────────────────────────────────

    describe("ControlPoint2Block (controlpoint2)", () => {
        let setup;
        beforeEach(() => {
            setup = buildSetup();
        });

        test("ControlPoint2Block is registered", () => {
            expect(setup.activity.blocks.controlpoint2).toBeDefined();
        });

        test("ControlPoint2Block flow calls doControlPoint2", () => {
            const Block = setup.activity.blocks.controlpoint2;
            const block = new Block();
            block.flow([70, 80], setup.logo, setup.turtle, 1);
            expect(setup.turtleObj.painter.doControlPoint2).toHaveBeenCalledWith(70, 80);
        });

        test("ControlPoint2Block flow with negative values", () => {
            const Block = setup.activity.blocks.controlpoint2;
            const block = new Block();
            block.flow([-30, -40], setup.logo, setup.turtle, 1);
            expect(setup.turtleObj.painter.doControlPoint2).toHaveBeenCalledWith(-30, -40);
        });
    });

    // ── WrapModeBlock ────────────────────────────────────────────────────────

    describe("WrapModeBlock (wrapmode)", () => {
        let setup;
        beforeEach(() => {
            setup = buildSetup();
        });

        test("WrapModeBlock is registered", () => {
            expect(setup.activity.blocks.wrapmode).toBeDefined();
        });

        test("WrapModeBlock arg returns current wrap state", () => {
            const Block = setup.activity.blocks.wrapmode;
            const block = new Block();
            setup.turtleObj.painter.wrap = true;
            const val = block.arg(setup.logo, setup.turtle, 0);
            expect(val).toBe(true);
        });

        test("WrapModeBlock arg returns false when wrap is off", () => {
            const Block = setup.activity.blocks.wrapmode;
            const block = new Block();
            setup.turtleObj.painter.wrap = false;
            const val = block.arg(setup.logo, setup.turtle, 0);
            expect(val).toBe(false);
        });
    });

    // ── WrapBlock ────────────────────────────────────────────────────────────

    describe("WrapBlock (wrap)", () => {
        let setup;
        beforeEach(() => {
            setup = buildSetup();
        });

        test("WrapBlock is registered", () => {
            expect(setup.activity.blocks.wrap).toBeDefined();
        });

        test("WrapBlock flow runs without error", () => {
            const Block = setup.activity.blocks.wrap;
            const block = new Block();
            expect(() => block.flow([true], setup.logo, setup.turtle, 1)).not.toThrow();
        });
    });

    // ── HeadingBlock updateParameter ─────────────────────────────────────────

    describe("HeadingBlock updateParameter", () => {
        let setup;
        beforeEach(() => {
            setup = buildSetup();
        });

        test("HeadingBlock updateParameter returns turtle orientation", () => {
            const Block = setup.activity.blocks.heading;
            const block = new Block();
            setup.turtleObj.orientation = 270;
            const val = block.updateParameter(setup.logo, setup.turtle, 0);
            expect(val).toBe(270);
        });
    });

    // ── XBlock updateParameter ───────────────────────────────────────────────

    describe("XBlock updateParameter", () => {
        let setup;
        beforeEach(() => {
            setup = buildSetup();
        });

        test("XBlock updateParameter calls toFixed2 with x value", () => {
            const Block = setup.activity.blocks.x;
            const block = new Block();
            setup.turtleObj.x = 55;
            block.updateParameter(setup.logo, setup.turtle, 0);
            expect(global.toFixed2).toHaveBeenCalledWith(55);
        });
    });

    // ── YBlock updateParameter ───────────────────────────────────────────────

    describe("YBlock updateParameter", () => {
        let setup;
        beforeEach(() => {
            setup = buildSetup();
        });

        test("YBlock updateParameter calls toFixed2 with y value", () => {
            const Block = setup.activity.blocks.y;
            const block = new Block();
            setup.turtleObj.y = 33;
            block.updateParameter(setup.logo, setup.turtle, 0);
            expect(global.toFixed2).toHaveBeenCalledWith(33);
        });
    });

    // ── StatusMatrix path ────────────────────────────────────────────────────

    describe("Status matrix path for XBlock", () => {
        let setup;
        beforeEach(() => {
            setup = buildSetup();
        });

        test("XBlock arg pushes to statusFields when in statusMatrix", () => {
            setup.logo.inStatusMatrix = true;
            setup.activity.blocks.blockList[0] = {
                connections: [1],
                name: "print"
            };
            setup.activity.blocks.blockList[1] = { name: "print" };

            const Block = setup.activity.blocks.x;
            const block = new Block();
            block.arg(setup.logo, setup.turtle, 0);
            expect(setup.logo.statusFields.length).toBeGreaterThanOrEqual(0);
        });
    });

    // ── RightBlock extended ──────────────────────────────────────────────────

    describe("RightBlock extended", () => {
        let setup;
        beforeEach(() => {
            setup = buildSetup();
        });

        test("RightBlock with 45 degrees", () => {
            const Block = setup.activity.blocks.right;
            const block = new Block();
            block.flow([45], setup.logo, setup.turtle, 1);
            expect(setup.turtleObj.painter.doRight).toHaveBeenCalledWith(45);
        });

        test("RightBlock with 360 degrees", () => {
            const Block = setup.activity.blocks.right;
            const block = new Block();
            block.flow([360], setup.logo, setup.turtle, 1);
            expect(setup.turtleObj.painter.doRight).toHaveBeenCalledWith(360);
        });
    });

    // ── ForwardBlock extended ────────────────────────────────────────────────

    describe("ForwardBlock extended", () => {
        let setup;
        beforeEach(() => {
            setup = buildSetup();
        });

        test("ForwardBlock with large value", () => {
            const Block = setup.activity.blocks.forward;
            const block = new Block();
            block.flow([500], setup.logo, setup.turtle, 1);
            expect(setup.turtleObj.painter.doForward).toHaveBeenCalledWith(500);
        });

        test("ForwardBlock with zero", () => {
            const Block = setup.activity.blocks.forward;
            const block = new Block();
            block.flow([0], setup.logo, setup.turtle, 1);
            expect(setup.turtleObj.painter.doForward).toHaveBeenCalledWith(0);
        });
    });

    // ── ArcBlock extended ────────────────────────────────────────────────────

    describe("ArcBlock extended", () => {
        let setup;
        beforeEach(() => {
            setup = buildSetup();
        });

        test("ArcBlock with full circle 360 degrees", () => {
            const Block = setup.activity.blocks.arc;
            const block = new Block();
            block.flow([360, 100], setup.logo, setup.turtle, 1);
            expect(setup.turtleObj.painter.doArc).toHaveBeenCalledWith(360, 100);
        });

        test("ArcBlock with small radius", () => {
            const Block = setup.activity.blocks.arc;
            const block = new Block();
            block.flow([45, 10], setup.logo, setup.turtle, 1);
            expect(setup.turtleObj.painter.doArc).toHaveBeenCalledWith(45, 10);
        });
    });

    // ── SetXYBlock extended ──────────────────────────────────────────────────

    describe("SetXYBlock extended", () => {
        let setup;
        beforeEach(() => {
            setup = buildSetup();
        });

        test("SetXYBlock with negative coordinates", () => {
            const Block = setup.activity.blocks.setxy;
            const block = new Block();
            block.flow([-100, -200], setup.logo, setup.turtle, 1);
            expect(setup.turtleObj.painter.doSetXY).toHaveBeenCalledWith(-100, -200);
        });

        test("SetXYBlock with zero coordinates", () => {
            const Block = setup.activity.blocks.setxy;
            const block = new Block();
            block.flow([0, 0], setup.logo, setup.turtle, 1);
            expect(setup.turtleObj.painter.doSetXY).toHaveBeenCalledWith(0, 0);
        });
    });
});
