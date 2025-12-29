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

/* Base block mocks */
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
                penState: true,
                wrap: false
            },
            x: 0,
            y: 0,
            orientation: 45,
            container: { x: 10, y: 20 }
        };

        activity = {
            blocks: {},
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
});
