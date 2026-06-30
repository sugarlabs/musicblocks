/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Music Blocks Contributors
 *
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

const { EmbeddedGraphicsScheduler } = require("../embedded-graphics-scheduler");
const logoconstants = require("../logoconstants");

Object.assign(global, logoconstants);

const buildPainter = () => ({
    penState: true,
    doPenUp: jest.fn(),
    doPenDown: jest.fn(),
    doSetColor: jest.fn(),
    doSetHue: jest.fn(),
    doSetValue: jest.fn(),
    doSetPenAlpha: jest.fn(),
    doSetChroma: jest.fn(),
    doSetPensize: jest.fn(),
    doSetXY: jest.fn(),
    doSetHeading: jest.fn(),
    doRight: jest.fn(),
    doForward: jest.fn(),
    doArc: jest.fn(),
    doScrollXY: jest.fn(),
    doBezier: jest.fn(),
    doStartFill: jest.fn(),
    doEndFill: jest.fn(),
    doStartHollowLine: jest.fn(),
    doEndHollowLine: jest.fn()
});

const buildTurtle = () => ({
    singer: {
        suppressOutput: false,
        dispatchFactor: 1,
        embeddedGraphics: {}
    },
    embeddedGraphicsFinished: true,
    painter: buildPainter()
});

const buildLogo = turtle => ({
    turtles: {
        ithTurtle: jest.fn(() => turtle)
    },
    blockList: [],
    parseArg: jest.fn(() => 9),
    processShow: jest.fn(),
    processSpeak: jest.fn(),
    receivedArg: null,
    stopTurtle: false,
    svgBackground: true,
    _timerManager: {
        setGuardedTimeout: jest.fn(fn => {
            fn();
            return 1;
        })
    },
    deps: {
        utils: {
            delayExecution: jest.fn(() => Promise.resolve())
        },
        textMsg: jest.fn()
    }
});

describe("EmbeddedGraphicsScheduler", () => {
    let turtle0;
    let mockLogo;
    let scheduler;
    let timeoutSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        turtle0 = buildTurtle();
        mockLogo = buildLogo(turtle0);
        scheduler = new EmbeddedGraphicsScheduler(mockLogo);
    });

    afterEach(() => {
        if (timeoutSpy) {
            timeoutSpy.mockRestore();
            timeoutSpy = null;
        }
    });

    test("schedule handles early exits and executes embedded clear action", async () => {
        mockLogo.deps.utils.delayExecution = jest.fn(() => Promise.resolve());

        turtle0.singer.embeddedGraphics = {};
        await scheduler.schedule(0, 0.5, 3, 0);
        expect(mockLogo.deps.utils.delayExecution).not.toHaveBeenCalled();

        turtle0.singer.embeddedGraphics = { 3: [] };
        await scheduler.schedule(0, 0.5, 3, 0);
        expect(mockLogo.deps.utils.delayExecution).not.toHaveBeenCalled();

        turtle0.singer.embeddedGraphics = { 3: [1] };
        mockLogo.blockList = [null, { name: "clear", connections: [] }];
        await scheduler.schedule(0, 0.5, 3, 0.1);

        expect(turtle0.painter.doSetHeading).toHaveBeenCalledWith(0);
        expect(turtle0.painter.doSetXY).toHaveBeenCalledWith(0, 0);
        expect(mockLogo.deps.utils.delayExecution).toHaveBeenCalledWith(500);
        expect(turtle0.embeddedGraphicsFinished).toBe(true);
    });

    test("schedule covers broad graphics switch with deterministic timers", async () => {
        mockLogo.deps.utils.delayExecution = jest.fn(() => Promise.resolve());

        turtle0.singer.suppressOutput = false;
        turtle0.embeddedGraphicsFinished = false;

        mockLogo.blockList = [];
        const names = [
            "setcolor",
            "sethue",
            "setshade",
            "settranslucency",
            "setgrey",
            "setpensize",
            "penup",
            "pendown",
            "fill",
            "hollowline",
            "controlpoint1",
            "controlpoint2",
            "bezier",
            "setheading",
            "right",
            "left",
            "forward",
            "back",
            "setxy",
            "scrollxy",
            "show",
            "speak",
            "print",
            "arc"
        ];

        names.forEach((name, index) => {
            mockLogo.blockList[index + 1] = { name, connections: [null, 101, 102] };
        });

        turtle0.singer.embeddedGraphics = {
            5: names.map((_, index) => index + 1)
        };

        await scheduler.schedule(0, 1, 5, 0);

        expect(turtle0.painter.doSetColor).toHaveBeenCalled();
        expect(turtle0.painter.doSetHue).toHaveBeenCalled();
        expect(turtle0.painter.doSetValue).toHaveBeenCalled();
        expect(turtle0.painter.doSetPenAlpha).toHaveBeenCalled();
        expect(turtle0.painter.doSetChroma).toHaveBeenCalled();
        expect(turtle0.painter.doSetPensize).toHaveBeenCalled();
        expect(turtle0.painter.doPenUp).toHaveBeenCalled();
        expect(turtle0.painter.doPenDown).toHaveBeenCalled();
        expect(turtle0.painter.doStartFill).toHaveBeenCalled();
        expect(turtle0.painter.doStartHollowLine).toHaveBeenCalled();
        expect(turtle0.painter.doBezier).toHaveBeenCalled();
        expect(turtle0.painter.doSetHeading).toHaveBeenCalled();
        expect(turtle0.painter.doRight).toHaveBeenCalled();
        expect(turtle0.painter.doForward).toHaveBeenCalled();
        expect(turtle0.painter.doArc).toHaveBeenCalled();
        expect(turtle0.painter.doSetXY).toHaveBeenCalled();
        expect(turtle0.painter.doScrollXY).toHaveBeenCalled();
        expect(mockLogo.processShow).toHaveBeenCalled();
        expect(mockLogo.processSpeak).toHaveBeenCalled();
        expect(mockLogo.deps.textMsg).toHaveBeenCalledWith("9");
        expect(mockLogo.deps.utils.delayExecution).toHaveBeenCalledWith(1000);
    });

    test("schedule with suppressOutput true executes immediate graphics operations", async () => {
        mockLogo.deps.utils.delayExecution = jest.fn(() => Promise.resolve());
        turtle0.singer.suppressOutput = true;
        mockLogo.parseArg = jest.fn(() => 7);
        mockLogo.blockList = [
            null,
            { name: "setheading", connections: [null, 9] },
            { name: "setxy", connections: [null, 9, 10] },
            { name: "scrollxy", connections: [null, 9, 10] },
            { name: "right", connections: [null, 9] },
            { name: "forward", connections: [null, 9] },
            { name: "arc", connections: [null, 9, 10] },
            { name: "fill", connections: [] },
            { name: "hollowline", connections: [] }
        ];
        turtle0.singer.embeddedGraphics = { 6: [1, 2, 3, 4, 5, 6, 7, 8] };

        await scheduler.schedule(0, 0.2, 6, 0);

        expect(turtle0.painter.doSetHeading).toHaveBeenCalledWith(7);
        expect(turtle0.painter.doSetXY).toHaveBeenCalledWith(7, 7);
        expect(turtle0.painter.doScrollXY).toHaveBeenCalledWith(7, 7);
        expect(turtle0.painter.doRight).toHaveBeenCalledWith(7);
        expect(turtle0.painter.doForward).toHaveBeenCalledWith(7);
        expect(turtle0.painter.doArc).toHaveBeenCalledWith(7, 7);
        expect(turtle0.painter.doStartFill).toHaveBeenCalled();
        expect(turtle0.painter.doStartHollowLine).toHaveBeenCalled();
    });

    test("schedule adjusts dispatchFactor for large stepTime", async () => {
        mockLogo.deps.utils.delayExecution = jest.fn(() => Promise.resolve());
        turtle0.singer.suppressOutput = false;
        turtle0.singer.dispatchFactor = 1;
        mockLogo.parseArg = jest.fn(() => 8);
        mockLogo.blockList = [null, { name: "setcolor", connections: [null, 1] }];
        turtle0.singer.embeddedGraphics = { 8: [1] };

        await scheduler.schedule(0, 3, 8, 0);

        expect(turtle0.singer.dispatchFactor).toBe(NOTEDIV / 32);
    });

    test("schedule adds 0.1s delay when previous graphics not yet finished", async () => {
        mockLogo.deps.utils.delayExecution = jest.fn(() => Promise.resolve());
        turtle0.singer.suppressOutput = false;
        // Simulate prior note's graphics still in-flight.
        turtle0.embeddedGraphicsFinished = false;
        mockLogo.parseArg = jest.fn(() => 5);
        mockLogo.blockList = [null, { name: "setcolor", connections: [null, 1] }];
        turtle0.singer.embeddedGraphics = { 9: [1] };

        // delay = 0 on entry; scheduler must add 0.1 → waitTime = 100ms.
        await scheduler.schedule(0, 0.5, 9, 0);

        expect(mockLogo._timerManager.setGuardedTimeout).toHaveBeenCalledWith(
            expect.any(Function),
            100,
            expect.any(Function)
        );
        expect(turtle0.embeddedGraphicsFinished).toBe(true);
    });
});
