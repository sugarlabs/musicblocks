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
global.rationalToFraction = require("../../utils/utils-logic.js").rationalToFraction;
global.TempoWindow = require("../TempoWindow.js");
global.TempoRows = require("../TempoRows.js");
global.TempoKeyboard = require("../TempoKeyboard.js");
global.TempoTap = require("../TempoTap.js");
global.TempoControls = require("../TempoControls.js");
global.TempoMetronome = require("../TempoMetronome.js");
global.TempoSave = require("../TempoSave.js");
global.Tempo = require("../tempo.js");

const TempoSave = global.TempoSave;
const METHODS = ["__save", "_saveTempo", "_get_save_lock"];

describe("TempoSave", () => {
    let tempo, loadNewBlocks;

    beforeEach(() => {
        jest.useFakeTimers();
        loadNewBlocks = jest.fn();
        tempo = new Tempo();
        tempo.activity = { blocks: { loadNewBlocks }, textMsg: jest.fn() };
        tempo.widgetWindow = { timerManager: new ManagedTimer() };
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("holds exactly the methods moved out of Tempo", () => {
        const names = Object.getOwnPropertyNames(TempoSave.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on Tempo.prototype", () => {
        expect(Tempo.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(Tempo.prototype[name]).toBe(TempoSave.prototype[name]);
            expect(Object.getOwnPropertyDescriptor(Tempo.prototype, name).enumerable).toBe(false);
        }
    });

    test("__save makes a set BPM block with the row's tempo", () => {
        tempo.BPMs = [132];

        tempo.__save(0);
        jest.advanceTimersByTime(0);

        expect(loadNewBlocks).toHaveBeenCalledWith([
            [0, ["setbpm3", {}], 100, 100, [null, 1, 2, 5]],
            [1, ["number", { value: 132 }], 0, 0, [0]],
            [2, ["divide", {}], 0, 0, [0, 3, 4]],
            [3, ["number", { value: 1 }], 0, 0, [2]],
            [4, ["number", { value: 4 }], 0, 0, [2]],
            [5, ["vspace", {}], 0, 0, [0, null]]
        ]);
        expect(tempo.activity.textMsg).toHaveBeenCalledWith("New action block generated.", 3000);
    });

    test.each([
        [1 / 8, 1, 8],
        [3 / 8, 3, 8],
        [1 / 2, 1, 2],
        [1, 1, 1]
    ])("__save writes a beat value of %s as %s / %s", (beatValue, numerator, denominator) => {
        tempo.BPMs = [100];
        tempo.beatValues = [beatValue];

        tempo.__save(0);
        jest.advanceTimersByTime(0);

        const stack = loadNewBlocks.mock.calls[0][0];
        expect(stack[3][1][1].value).toBe(numerator);
        expect(stack[4][1][1].value).toBe(denominator);
    });

    test("_saveTempo saves each row 200 ms apart, each block lower than the last", () => {
        tempo.BPMs = [90, 120, 150];

        tempo._saveTempo();

        jest.advanceTimersByTime(0);
        expect(loadNewBlocks).toHaveBeenCalledTimes(1);
        jest.advanceTimersByTime(200);
        expect(loadNewBlocks).toHaveBeenCalledTimes(2);
        jest.advanceTimersByTime(200);
        expect(loadNewBlocks).toHaveBeenCalledTimes(3);

        const stacks = loadNewBlocks.mock.calls.map(call => call[0]);
        expect(stacks.map(stack => stack[1][1][1].value)).toEqual([90, 120, 150]);
        expect(stacks.map(stack => stack[0].slice(2, 4))).toEqual([
            [100, 100],
            [142, 142],
            [184, 184]
        ]);
    });

    test("closing the widget cancels the saves still to come", () => {
        tempo.BPMs = [90, 120];

        tempo._saveTempo();
        jest.advanceTimersByTime(0);
        tempo.widgetWindow.timerManager.clearAll();
        jest.advanceTimersByTime(1000);

        expect(loadNewBlocks).toHaveBeenCalledTimes(1);
    });

    test("saves with plain timeouts without a timer manager", () => {
        tempo.widgetWindow = null;
        tempo.BPMs = [90, 120];

        tempo._saveTempo();
        jest.advanceTimersByTime(200);

        expect(loadNewBlocks).toHaveBeenCalledTimes(2);
    });

    test("_saveTempo saves nothing without a row", () => {
        tempo.BPMs = [];

        tempo._saveTempo();
        jest.advanceTimersByTime(1000);

        expect(loadNewBlocks).not.toHaveBeenCalled();
    });

    test("_get_save_lock gives the save lock", () => {
        tempo._save_lock = true;
        expect(tempo._get_save_lock()).toBe(true);

        tempo._save_lock = false;
        expect(tempo._get_save_lock()).toBe(false);
    });
});
