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

global.ManagedTimer = require("../../utils/ManagedTimer");
global.PitchStaircaseTimers = require("../PitchStaircaseTimers.js");
global.PitchStaircaseLayout = require("../PitchStaircaseLayout.js");
global.PitchStaircaseSteps = require("../PitchStaircaseSteps.js");
global.PitchStaircasePlayback = require("../PitchStaircasePlayback.js");
global.PitchStaircaseSave = require("../PitchStaircaseSave.js");
global.PitchStaircaseWindow = require("../PitchStaircaseWindow.js");
global.PitchStaircase = require("../pitchstaircase.js");

const PitchStaircaseTimers = global.PitchStaircaseTimers;
const METHODS = ["_setWidgetTimeout", "_clearWidgetTimeout", "_cancelPlayback"];

describe("PitchStaircaseTimers", () => {
    let psc;

    beforeEach(() => {
        jest.useFakeTimers();
        psc = new PitchStaircase();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("holds exactly the methods moved out of PitchStaircase", () => {
        const names = Object.getOwnPropertyNames(PitchStaircaseTimers.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on PitchStaircase.prototype", () => {
        expect(PitchStaircase.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(PitchStaircase.prototype[name]).toBe(PitchStaircaseTimers.prototype[name]);
            // Like a method declared in the class: not enumerable.
            expect(Object.getOwnPropertyDescriptor(PitchStaircase.prototype, name).enumerable).toBe(
                false
            );
        }
    });

    test("_setWidgetTimeout runs the callback after the delay", () => {
        const callback = jest.fn();
        psc._setWidgetTimeout(callback, 500);

        jest.advanceTimersByTime(499);
        expect(callback).not.toHaveBeenCalled();
        jest.advanceTimersByTime(1);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    test("_clearWidgetTimeout cancels a pending timeout", () => {
        const callback = jest.fn();
        const id = psc._setWidgetTimeout(callback, 500);

        expect(psc._clearWidgetTimeout(id)).toBe(true);
        jest.advanceTimersByTime(1000);
        expect(callback).not.toHaveBeenCalled();
    });

    test("_clearWidgetTimeout ignores a missing id", () => {
        expect(psc._clearWidgetTimeout(null)).toBe(false);
        expect(psc._clearWidgetTimeout(undefined)).toBe(false);
    });

    test("falls back to the window timers without a ManagedTimer", () => {
        psc._timerManager = null;
        const callback = jest.fn();

        const id = psc._setWidgetTimeout(callback, 100);
        expect(psc._clearWidgetTimeout(id)).toBe(true);
        jest.advanceTimersByTime(200);
        expect(callback).not.toHaveBeenCalled();
    });

    test("_cancelPlayback clears every pending timeout and resets playback", () => {
        const callbacks = [jest.fn(), jest.fn(), jest.fn(), jest.fn(), jest.fn()];
        psc._rowStopTimeout = psc._setWidgetTimeout(callbacks[0], 1000);
        psc._playAllTimeout = psc._setWidgetTimeout(callbacks[1], 1000);
        psc._scaleStepTimeout = psc._setWidgetTimeout(callbacks[2], 1000);
        psc._scaleHighlightTimeout = psc._setWidgetTimeout(callbacks[3], 1000);
        // A timeout the widget no longer holds the id of.
        psc._setWidgetTimeout(callbacks[4], 1000);
        psc._isPlayingAll = true;
        psc._isPlayingScale = true;
        psc._playingRowIndex = 2;

        psc._cancelPlayback();
        jest.advanceTimersByTime(2000);

        callbacks.forEach(callback => expect(callback).not.toHaveBeenCalled());
        expect(psc._rowStopTimeout).toBeNull();
        expect(psc._playAllTimeout).toBeNull();
        expect(psc._scaleStepTimeout).toBeNull();
        expect(psc._scaleHighlightTimeout).toBeNull();
        expect(psc._scaleStopped).toBe(true);
        expect(psc._isPlayingAll).toBe(false);
        expect(psc._isPlayingScale).toBe(false);
        expect(psc._playingRowIndex).toBeNull();
    });
});
