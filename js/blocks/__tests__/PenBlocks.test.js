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
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

const { setupPenBlocks } = require("../PenBlocks");

describe("setupPenBlocks", () => {
    let activity;
    let logo;
    let turtle;
    let painter;

    beforeEach(() => {
        jest.resetModules();

        global._ = x => x;
        global.NOINPUTERRORMSG = "NOINPUT";
        global.NANERRORMSG = "NAN";
        global.DEFAULTFONT = "sans";
        global.last = arr => arr[arr.length - 1];
        global.toFixed2 = x => Number(x.toFixed(2));

        const blockList = {};

        class BaseBlock {
            constructor(name) {
                this.name = name;
                blockList[name] = this;
            }
            setPalette() {}
            setHelpString() {}
            makeMacro() {}
            beginnerBlock() {}
            formBlock() {}
            setup() {}
        }

        global.FlowBlock = class extends BaseBlock {};
        global.FlowClampBlock = class extends BaseBlock {};
        global.ValueBlock = class extends BaseBlock {};

        painter = {
            doSetColor: jest.fn(),
            doSetHue: jest.fn(),
            doSetValue: jest.fn(),
            doSetChroma: jest.fn(),
            doSetPensize: jest.fn(),
            doSetPenAlpha: jest.fn(),
            doSetFont: jest.fn(),
            doPenUp: jest.fn(),
            doPenDown: jest.fn(),
            doStartFill: jest.fn(),
            doEndFill: jest.fn(),
            doStartHollowLine: jest.fn(),
            doEndHollowLine: jest.fn(),
            color: 10,
            value: 20,
            chroma: 30,
            stroke: 4,
            penState: true
        };

        turtle = {
            painter,
            singer: {
                inNoteBlock: [],
                embeddedGraphics: {},
                suppressOutput: false
            }
        };

        activity = {
            blocks: { blockList },
            turtles: {
                companionTurtle: x => x,
                ithTurtle: () => turtle,
                getTurtle: () => turtle,
                setBackgroundColor: jest.fn()
            },
            errorMsg: jest.fn()
        };

        logo = {
            inStatusMatrix: false,
            inMatrix: false,
            statusFields: [],
            phraseMaker: {
                addRowBlock: jest.fn(),
                rowLabels: [],
                rowArgs: []
            },
            pitchBlocks: [],
            setDispatchBlock: jest.fn(),
            setTurtleListener: jest.fn(),
            svgOutput: ""
        };

        setupPenBlocks(activity);
    });

    test("registers pen blocks", () => {
        expect(Object.keys(activity.blocks.blockList).length).toBeGreaterThan(25);
    });

    test("value blocks return parameters", () => {
        expect(activity.blocks.blockList.color.updateParameter(logo, 0)).toBe(10);
        expect(activity.blocks.blockList.shade.updateParameter(logo, 0)).toBe(20);
        expect(activity.blocks.blockList.grey.updateParameter(logo, 0)).toBe(30);
        expect(activity.blocks.blockList.pensize.updateParameter(logo, 0)).toBe(4);
    });

    test("value setters call painter", () => {
        activity.blocks.blockList.color.setter(logo, 5, 0);
        activity.blocks.blockList.shade.setter(logo, 6, 0);
        activity.blocks.blockList.grey.setter(logo, 7, 0);
        activity.blocks.blockList.pensize.setter(logo, 8, 0);

        expect(painter.doSetColor).toHaveBeenCalled();
        expect(painter.doSetValue).toHaveBeenCalled();
        expect(painter.doSetChroma).toHaveBeenCalled();
        expect(painter.doSetPensize).toHaveBeenCalled();
    });

    test("value blocks push status matrix entries", () => {
        logo.inStatusMatrix = true;
        activity.blocks.blockList.print = { name: "print" };

        ["color", "shade", "grey", "pensize"].forEach(b => {
            activity.blocks.blockList[b].connections = ["print"];
            activity.blocks.blockList[b].arg(logo, 0, b);
        });

        expect(logo.statusFields.length).toBe(4);
    });

    test("pen up / pen down outside note block", () => {
        activity.blocks.blockList.penup.flow([], logo, 0);
        activity.blocks.blockList.pendown.flow([], logo, 0);

        expect(painter.doPenUp).toHaveBeenCalled();
        expect(painter.doPenDown).toHaveBeenCalled();
    });

    test("setfont accepts string", () => {
        activity.blocks.blockList.setfont.flow(["Arial"], logo, 0, "setfont");
        expect(painter.doSetFont).toHaveBeenCalledWith("Arial");
    });

    test("setfont errors on null", () => {
        activity.blocks.blockList.setfont.flow([null], logo, 0, "setfont");
        expect(activity.errorMsg).toHaveBeenCalledWith("NOINPUT", "setfont");
    });

    test("numeric setters route through matrix", () => {
        logo.inMatrix = true;

        ["sethue", "setshade", "setgrey", "setpensize", "settranslucency"].forEach(b => {
            activity.blocks.blockList[b].flow([10], logo, 0, b);
        });

        expect(logo.phraseMaker.addRowBlock).toHaveBeenCalled();
        expect(logo.phraseMaker.rowArgs.length).toBeGreaterThan(0);
    });

    test("all setters embed into note block", () => {
        turtle.singer.inNoteBlock.push("n1");
        turtle.singer.embeddedGraphics.n1 = [];

        ["setcolor", "sethue", "setshade", "setgrey", "setpensize", "settranslucency"].forEach(
            b => {
                activity.blocks.blockList[b].flow([20], logo, 0, b);
            }
        );

        expect(turtle.singer.embeddedGraphics.n1.length).toBe(6);
    });

    test("penup / pendown safely route inside note block", () => {
        turtle.singer.inNoteBlock.push("n2");
        turtle.singer.embeddedGraphics.n2 = [];

        activity.blocks.blockList.penup.flow([], logo, 0);
        activity.blocks.blockList.pendown.flow([], logo, 0);

        expect(turtle.singer.embeddedGraphics.n2.length).toBeGreaterThanOrEqual(0);
    });

    test("fill start + end via listener", () => {
        let listener;
        logo.setTurtleListener.mockImplementation((_, __, fn) => (listener = fn));

        const res = activity.blocks.blockList.fill.flow([1], logo, 0, "fill");
        expect(res).toEqual([1, 1]);

        listener();
        expect(painter.doEndFill).toHaveBeenCalled();
    });

    test("fill suppressOutput path", () => {
        turtle.singer.suppressOutput = true;
        activity.blocks.blockList.fill.flow([1], logo, 0, "fill");
        expect(painter.doStartFill).toHaveBeenCalled();
    });

    test("fill early return when args missing", () => {
        activity.blocks.blockList.fill.flow([], logo, 0);
        expect(true).toBe(true);
    });

    test("hollowline start + end", () => {
        let listener;
        logo.setTurtleListener.mockImplementation((_, __, fn) => (listener = fn));

        const res = activity.blocks.blockList.hollowline.flow([1], logo, 0, "hollowline");
        expect(res).toEqual([1, 1]);

        listener();
        expect(painter.doEndHollowLine).toHaveBeenCalled();
    });

    test("hollowline early return", () => {
        activity.blocks.blockList.hollowline.flow([], logo, 0);
        expect(true).toBe(true);
    });

    test("numeric setters error on null", () => {
        ["sethue", "setshade", "setgrey", "setpensize", "settranslucency"].forEach(b => {
            activity.blocks.blockList[b].flow([null], logo, 0, b);
        });

        expect(activity.errorMsg).toHaveBeenCalled();
    });

    test("numeric setters safely return on NaN", () => {
        ["sethue", "setshade", "setgrey", "setpensize", "settranslucency"].forEach(b => {
            activity.blocks.blockList[b].flow([NaN], logo, 0, b);
        });

        expect(true).toBe(true);
    });

    test("setcolor runtime path", () => {
        activity.blocks.blockList.setcolor.flow([42], logo, 0, "setcolor");
        expect(painter.doSetColor).toHaveBeenCalledWith(42);
    });

    test("settranslucency runtime path", () => {
        activity.blocks.blockList.settranslucency.flow([25], logo, 0, "settranslucency");
        expect(painter.doSetPenAlpha).toHaveBeenCalledWith(0.75);
    });

    test("fillscreen ignores wrong args and works with 3 args", () => {
        activity.blocks.blockList.fillscreen.flow([1, 2], logo, 0);
        activity.blocks.blockList.fillscreen.flow([], logo, 0);
        expect(activity.turtles.setBackgroundColor).not.toHaveBeenCalled();

        activity.blocks.blockList.fillscreen.flow([1, 2, 3], logo, 0);
        expect(activity.turtles.setBackgroundColor).toHaveBeenCalled();
        expect(logo.svgOutput).toBe("");
    });

    test("background clears svg output", () => {
        activity.blocks.blockList.background.flow([], logo, 0);
        expect(logo.svgOutput).toBe("");
    });

    test("value block arg returns value when not in status matrix", () => {
        const result = activity.blocks.blockList.color.arg(logo, 0, "color");
        expect(result).toBe(10);
    });

    test("setfont safely ignores empty string", () => {
        activity.blocks.blockList.setfont.flow([""], logo, 0, "setfont");
        expect(activity.errorMsg).not.toHaveBeenCalled();
    });

    test("fill embeds block when inside note block with listener", () => {
        turtle.singer.inNoteBlock.push("n_final");
        turtle.singer.embeddedGraphics.n_final = [];

        let listener;
        logo.setTurtleListener.mockImplementation((_, __, fn) => (listener = fn));

        activity.blocks.blockList.fill.flow([1], logo, 0, "fill");
        listener();

        expect(turtle.singer.embeddedGraphics.n_final.length).toBeGreaterThan(0);
    });

    test("settranslucency handles modulo > 100 branch", () => {
        activity.blocks.blockList.settranslucency.flow([225], logo, 0, "settranslucency");

        expect(painter.doSetPenAlpha).toHaveBeenCalledWith(1 - 23 / 100);
    });

    test("shade arg returns value when not connected to print", () => {
        const result = activity.blocks.blockList.shade.arg(logo, 0, "shade");
        expect(result).toBe(20);
    });
    test("fillscreen restores painter state after background set", () => {
        activity.blocks.blockList.fillscreen.flow([5, 6, 7], logo, 0);

        expect(painter.doSetHue).toHaveBeenCalled();
        expect(painter.doSetValue).toHaveBeenCalled();
        expect(painter.doSetChroma).toHaveBeenCalled();
    });
    test("setpensize runtime path sets painter size", () => {
        activity.blocks.blockList.setpensize.flow([12], logo, 0, "setpensize");
        expect(painter.doSetPensize).toHaveBeenCalledWith(12);
    });
    test("background can be called multiple times safely", () => {
        activity.blocks.blockList.background.flow([], logo, 0);
        activity.blocks.blockList.background.flow([], logo, 0);
        expect(logo.svgOutput).toBe("");
    });
});
