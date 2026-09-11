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
    embeddedGraphicsPending: 0,
    embeddedGraphicsGeneration: 0,
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
        expect(turtle0.embeddedGraphicsPending).toBe(0);
    });

    test("schedule covers broad graphics switch with deterministic timers", async () => {
        mockLogo.deps.utils.delayExecution = jest.fn(() => Promise.resolve());

        turtle0.singer.suppressOutput = false;
        turtle0.embeddedGraphicsPending = 1;

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
        // Simulate a prior note's graphics still in-flight.
        turtle0.embeddedGraphicsPending = 1;
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
        // This call's own share of the count is cleared, but the prior
        // note's pending call (simulated above) is still outstanding.
        expect(turtle0.embeddedGraphicsPending).toBe(1);
    });

    test("an earlier call resolving does not clear a later, still-running call's pending count (#8639)", async () => {
        // turtle-singer.js never awaits dispatchTurtleSignals(), so it is
        // routine for one note's schedule() call to still be pending when
        // the next note's call starts. Under the old shared boolean, the
        // earlier call resolving would unconditionally mark all graphics as
        // finished, even while the later call's were still running.
        turtle0.singer.suppressOutput = false;
        mockLogo.parseArg = jest.fn(() => 5);
        mockLogo.blockList = [null, { name: "setcolor", connections: [null, 1] }];
        turtle0.singer.embeddedGraphics = { 9: [1], 10: [1] };

        let resolveFirst;
        let resolveSecond;
        const delays = [
            new Promise(resolve => {
                resolveFirst = resolve;
            }),
            new Promise(resolve => {
                resolveSecond = resolve;
            })
        ];
        let callIndex = 0;
        mockLogo.deps.utils.delayExecution = jest.fn(() => delays[callIndex++]);

        // Note N starts; nothing pending yet, so no compensating delay.
        const firstCall = scheduler.schedule(0, 0.5, 9, 0);
        expect(turtle0.embeddedGraphicsPending).toBe(1);

        // Note N+1 starts while N is still pending, so it must see that
        // and add the 0.1s compensating delay (delay 0 becomes waitTime 100ms).
        const secondCall = scheduler.schedule(0, 0.5, 10, 0);
        expect(turtle0.embeddedGraphicsPending).toBe(2);
        expect(mockLogo._timerManager.setGuardedTimeout).toHaveBeenLastCalledWith(
            expect.any(Function),
            100,
            expect.any(Function)
        );

        // Note N's call resolves first. This must not mark everything as
        // finished, since note N+1's graphics are still in flight.
        resolveFirst();
        await firstCall;
        expect(turtle0.embeddedGraphicsPending).toBe(1);

        // Only once note N+1's own call resolves does the count return to 0.
        resolveSecond();
        await secondCall;
        expect(turtle0.embeddedGraphicsPending).toBe(0);
    });

    test("a stale call's completion does not corrupt the count after a turtle/run reset (#8639 follow-up)", async () => {
        // runLogoCommands()/Turtle.initTurtle() reset embeddedGraphicsPending
        // to 0 (Stop button, or a "run" block restarting this turtle), but a
        // schedule() call already in flight at that moment does not know
        // about the reset. Without tracking a generation, that stale call's
        // eventual decrement would corrupt the fresh generation's count
        // instead of being ignored.
        turtle0.singer.suppressOutput = false;
        mockLogo.parseArg = jest.fn(() => 5);
        mockLogo.blockList = [null, { name: "setcolor", connections: [null, 1] }];
        turtle0.singer.embeddedGraphics = { 9: [1], 10: [1] };

        let resolveStale;
        let resolveFresh;
        const delays = [
            new Promise(resolve => {
                resolveStale = resolve;
            }),
            new Promise(resolve => {
                resolveFresh = resolve;
            })
        ];
        let callIndex = 0;
        mockLogo.deps.utils.delayExecution = jest.fn(() => delays[callIndex++]);

        // Note N's call starts and is still pending when a reset happens.
        const staleCall = scheduler.schedule(0, 0.5, 9, 0);
        expect(turtle0.embeddedGraphicsPending).toBe(1);

        // Simulate the reset performed by runLogoCommands()/initTurtle().
        turtle0.embeddedGraphicsPending = 0;
        turtle0.embeddedGraphicsGeneration += 1;

        // A genuinely new call starts in the new generation. It sees no
        // pending work (the reset cleared it), so no compensating delay.
        const freshCall = scheduler.schedule(0, 0.5, 10, 0);
        expect(turtle0.embeddedGraphicsPending).toBe(1);

        // The stale call from before the reset finally resolves. It must
        // not touch the new generation's count.
        resolveStale();
        await staleCall;
        expect(turtle0.embeddedGraphicsPending).toBe(1);

        // The fresh call resolving does decrement its own generation's count.
        resolveFresh();
        await freshCall;
        expect(turtle0.embeddedGraphicsPending).toBe(0);
    });
});
