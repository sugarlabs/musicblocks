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

global.TimbreState = require("../TimbreState.js");
global.TimbrePanels = require("../TimbrePanels.js");
global.TimbreAudio = require("../TimbreAudio.js");
global.TimbreBlocks = require("../TimbreBlocks.js");
global.TimbreWidget = require("../timbre.js");

const TimbreState = global.TimbreState;
const METHODS = [
    "_setWidgetTimeout",
    "_clearWidgetTimeout",
    "_clearWidgetTimers",
    "_setActiveExclusive"
];

describe("TimbreState", () => {
    test("holds exactly the methods moved out of TimbreWidget", () => {
        const names = Object.getOwnPropertyNames(TimbreState.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on TimbreWidget.prototype", () => {
        expect(TimbreWidget.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(TimbreWidget.prototype[name]).toBe(TimbreState.prototype[name]);
            expect(Object.getOwnPropertyDescriptor(TimbreWidget.prototype, name).enumerable).toBe(
                false
            );
        }
    });

    describe("_setActiveExclusive", () => {
        test("activates specified parameter and deactivates all others", () => {
            const mockWidget = {
                activeParams: ["synth", "envelope", "oscillator", "filter"],
                isActive: {
                    synth: true,
                    envelope: true,
                    oscillator: false,
                    filter: false
                }
            };

            TimbreState.prototype._setActiveExclusive.call(mockWidget, "oscillator");

            expect(mockWidget.isActive.oscillator).toBe(true);
            expect(mockWidget.isActive.synth).toBe(false);
            expect(mockWidget.isActive.envelope).toBe(false);
            expect(mockWidget.isActive.filter).toBe(false);
        });
    });

    describe("Timer management", () => {
        let mockWidget;

        beforeEach(() => {
            jest.useFakeTimers();
            mockWidget = {
                _timerManager: null,
                _activeTimeouts: new Set(),
                _previewTimerId: null
            };
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        test("_setWidgetTimeout adds to active timeouts and executes callback", () => {
            const cb = jest.fn();
            const id = TimbreState.prototype._setWidgetTimeout.call(mockWidget, cb, 100);

            expect(mockWidget._activeTimeouts.has(id)).toBe(true);
            expect(cb).not.toHaveBeenCalled();

            jest.advanceTimersByTime(100);

            expect(cb).toHaveBeenCalled();
            expect(mockWidget._activeTimeouts.has(id)).toBe(false);
        });

        test("_clearWidgetTimeout removes pending timeout", () => {
            const cb = jest.fn();
            const id = TimbreState.prototype._setWidgetTimeout.call(mockWidget, cb, 100);

            const cleared = TimbreState.prototype._clearWidgetTimeout.call(mockWidget, id);
            expect(cleared).toBe(true);
            expect(mockWidget._activeTimeouts.has(id)).toBe(false);

            jest.advanceTimersByTime(100);
            expect(cb).not.toHaveBeenCalled();
        });

        test("_clearWidgetTimers clears all active timeouts", () => {
            const cb1 = jest.fn();
            const cb2 = jest.fn();
            TimbreState.prototype._setWidgetTimeout.call(mockWidget, cb1, 100);
            TimbreState.prototype._setWidgetTimeout.call(mockWidget, cb2, 200);

            const clearedCount = TimbreState.prototype._clearWidgetTimers.call(mockWidget);
            expect(clearedCount).toBe(2);
            expect(mockWidget._activeTimeouts.size).toBe(0);

            jest.advanceTimersByTime(300);
            expect(cb1).not.toHaveBeenCalled();
            expect(cb2).not.toHaveBeenCalled();
        });
    });
});
