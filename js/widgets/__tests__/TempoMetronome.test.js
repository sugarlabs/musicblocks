/**
 * MusicBlocks
 *
 * @copyright 2026 Music Blocks Contributors
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

const ManagedTimer = require("../../utils/ManagedTimer");

global._ = msg => msg;
global.TempoWindow = require("../TempoWindow.js");
global.TempoRows = require("../TempoRows.js");
global.TempoKeyboard = require("../TempoKeyboard.js");
global.TempoTap = require("../TempoTap.js");
global.TempoControls = require("../TempoControls.js");
global.TempoMetronome = require("../TempoMetronome.js");
global.TempoSave = require("../TempoSave.js");
global.Tempo = require("../tempo.js");

const TempoMetronome = global.TempoMetronome;
const METHODS = ["pause", "resume", "_draw"];

// A canvas whose 2D context records the ball it is drawn with.
const makeCanvas = (width = 300) => {
    const ctx = {
        clearRect: jest.fn(),
        beginPath: jest.fn(),
        ellipse: jest.fn(),
        fill: jest.fn(),
        closePath: jest.fn()
    };
    return { width, height: 150, ctx, getContext: () => ctx };
};

describe("TempoMetronome", () => {
    let tempo, trigger;

    // One row at 100 BPM (a beat every 600 ms) whose next beat is `next` ms from now.
    const makeRows = (count, next = 600) => {
        const now = Date.now();
        tempo.BPMs = Array(count).fill(100);
        tempo._intervals = Array(count).fill(600);
        tempo._directions = Array(count).fill(1);
        tempo._widgetFirstTimes = Array(count).fill(now);
        tempo._widgetNextTimes = Array(count).fill(now + next);
        tempo.tempoCanvases = Array.from({ length: count }, () => makeCanvas());
    };

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(100000);
        trigger = jest.fn();
        tempo = new Tempo();
        tempo.activity = { logo: { synth: { trigger } } };
        tempo.widgetWindow = { timerManager: new ManagedTimer() };
        tempo._intervalID = null;
    });

    afterEach(() => {
        tempo.pause();
        jest.useRealTimers();
    });

    test("holds exactly the methods moved out of Tempo", () => {
        const names = Object.getOwnPropertyNames(TempoMetronome.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on Tempo.prototype", () => {
        expect(Tempo.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(Tempo.prototype[name]).toBe(TempoMetronome.prototype[name]);
            expect(Object.getOwnPropertyDescriptor(Tempo.prototype, name).enumerable).toBe(false);
        }
    });

    describe("resume and pause", () => {
        test("resume restarts every row from now, moving right", () => {
            makeRows(2);
            tempo._directions = [-1, -1];

            tempo.resume();

            expect(tempo._widgetFirstTimes).toEqual([100000, 100000]);
            expect(tempo._widgetNextTimes).toEqual([100600, 100600]);
            expect(tempo._directions).toEqual([1, 1]);
        });

        test("resume draws every 5 ms and pause stops it", () => {
            makeRows(1);
            const draw = jest.spyOn(tempo, "_draw");

            tempo.resume();
            jest.advanceTimersByTime(Tempo.TEMPOINTERVAL * 4);
            expect(draw).toHaveBeenCalledTimes(4);

            tempo.pause();
            jest.advanceTimersByTime(100);
            expect(draw).toHaveBeenCalledTimes(4);
        });

        test("resuming twice keeps a single interval", () => {
            makeRows(1);
            const draw = jest.spyOn(tempo, "_draw");

            tempo.resume();
            tempo.resume();
            jest.advanceTimersByTime(Tempo.TEMPOINTERVAL);

            expect(draw).toHaveBeenCalledTimes(1);
        });

        test("works without a timer manager", () => {
            makeRows(1);
            tempo.widgetWindow = null;
            const draw = jest.spyOn(tempo, "_draw");

            tempo.resume();
            jest.advanceTimersByTime(Tempo.TEMPOINTERVAL * 2);
            tempo.pause();
            jest.advanceTimersByTime(100);

            expect(draw).toHaveBeenCalledTimes(2);
        });

        test("clicks once per beat while playing", () => {
            makeRows(1);

            tempo.resume();
            jest.advanceTimersByTime(3000);

            // 100 BPM for 3 seconds: a beat at 600, 1200, ... 3000 ms, less the last one.
            expect(trigger.mock.calls.length).toBeGreaterThanOrEqual(4);
            expect(trigger.mock.calls.length).toBeLessThanOrEqual(5);
        });
    });

    describe("_draw", () => {
        test("clicks the drum on a row's beat and moves its next beat on", () => {
            makeRows(1, -1);

            tempo._draw();

            expect(trigger).toHaveBeenCalledTimes(1);
            expect(trigger).toHaveBeenCalledWith(
                0,
                ["C2"],
                0.0625,
                Tempo.TEMPOSYNTH,
                null,
                null,
                false
            );
            expect(tempo._widgetNextTimes[0]).toBe(100000 - 1 + 600);
            expect(tempo._directions[0]).toBe(-1);
        });

        test("does not click between beats", () => {
            makeRows(1, 300);

            tempo._draw();

            expect(trigger).not.toHaveBeenCalled();
            expect(tempo._directions[0]).toBe(1);
        });

        test("draws the ball across the canvas as the beat comes", () => {
            makeRows(1, 450);

            tempo._draw();

            // 450 of 600 ms to go: three quarters of the way, moving right.
            const [x, y, xradius, yradius] = tempo.tempoCanvases[0].ctx.ellipse.mock.calls[0];
            expect(x).toBe(225);
            expect(y).toBe(Tempo.YRADIUS);
            expect(xradius).toBe(Tempo.YRADIUS / 3);
            expect(yradius).toBe(Tempo.YRADIUS);
            expect(tempo.tempoCanvases[0].ctx.clearRect).toHaveBeenCalledWith(0, 0, 300, 150);
        });

        test("draws the ball from the right when moving left", () => {
            makeRows(1, 450);
            tempo._directions = [-1];

            tempo._draw();

            expect(tempo.tempoCanvases[0].ctx.ellipse.mock.calls[0][0]).toBe(75);
        });

        test("squashes the ball near the edge", () => {
            makeRows(1, 20);

            tempo._draw();

            // 10 px from the edge.
            expect(tempo.tempoCanvases[0].ctx.ellipse.mock.calls[0][2]).toBe(10);
        });

        test("skips the beats it missed instead of clicking for each", () => {
            // Three and a bit beats late, as in a throttled background tab.
            makeRows(1, -1900);

            tempo._draw();

            expect(trigger).toHaveBeenCalledTimes(1);
            // The next beat stays on the original grid.
            expect(tempo._widgetNextTimes[0]).toBe(100000 - 1900 + 4 * 600);
            // Four beats went by, an even number, so the direction is unchanged.
            expect(tempo._directions[0]).toBe(1);
        });

        test("starts the clock of a row that hasn't started", () => {
            makeRows(1);
            tempo._widgetFirstTimes = [null];

            tempo._draw();

            expect(tempo._widgetFirstTimes[0]).toBe(100000);
            expect(tempo._widgetNextTimes[0]).toBe(100600);
        });

        test("skips a row without a canvas", () => {
            makeRows(2, -1);
            tempo.tempoCanvases[0] = undefined;

            tempo._draw();

            expect(trigger).toHaveBeenCalledTimes(1);
            expect(tempo._widgetNextTimes[0]).toBe(100000 - 1);
        });

        test("keeps the ball still with no interval", () => {
            makeRows(1, 300);
            tempo._intervals = [0];

            tempo._draw();

            expect(tempo.tempoCanvases[0].ctx.ellipse.mock.calls[0][0]).toBe(0);
        });
    });
});
