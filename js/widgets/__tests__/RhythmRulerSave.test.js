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

global.RhythmRulerLayout = require("../RhythmRulerLayout.js");
global.RhythmRulerHistory = require("../RhythmRulerHistory.js");
global.RhythmRulerEditing = require("../RhythmRulerEditing.js");
global.RhythmRulerPlayback = require("../RhythmRulerPlayback.js");
global.RhythmRulerSave = require("../RhythmRulerSave.js");
global.RhythmRulerCircular = require("../RhythmRulerCircular.js");
global.RhythmRuler = require("../rhythmruler.js");

const RhythmRulerSave = global.RhythmRulerSave;
const METHODS = [
    "_save",
    "_saveTuplets",
    "_saveTupletsMerged",
    "_saveMachine",
    "_saveDrumMachine",
    "_saveVoiceMachine",
    "_mergeRulers"
];

describe("RhythmRulerSave", () => {
    test("holds exactly the methods moved out of RhythmRuler", () => {
        const names = Object.getOwnPropertyNames(RhythmRulerSave.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on RhythmRuler.prototype", () => {
        expect(RhythmRuler.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(RhythmRuler.prototype[name]).toBe(RhythmRulerSave.prototype[name]);
            // Like a method declared in the class: not enumerable.
            expect(Object.getOwnPropertyDescriptor(RhythmRuler.prototype, name).enumerable).toBe(
                false
            );
        }
    });

    describe("_saveTupletsMerged", () => {
        beforeEach(() => {
            global._ = text => text;
            global.activity = { textMsg: jest.fn() };
            global.rationalToFraction = value => [1, 1 / value];
        });

        afterEach(() => {
            delete global.activity;
        });

        test("merges repeated note values into one rhythm block", () => {
            const loadNewBlocks = jest.fn();
            const widget = {
                activity: {
                    palettes: { dict: { rhythm: { hideMenu: jest.fn() } } },
                    refreshCanvas: jest.fn(),
                    blocks: { loadNewBlocks }
                }
            };

            RhythmRulerSave.prototype._saveTupletsMerged.call(widget, [4, 4, 8]);

            const stack = loadNewBlocks.mock.calls[0][0];
            const rhythms = stack.filter(block => block[1] === "rhythm2");
            expect(rhythms).toHaveLength(2);
            // Two quarter notes in the first rhythm block, one eighth note in the second.
            expect(stack[rhythms[0][0] + 1][1]).toEqual(["number", { value: 2 }]);
            expect(stack[rhythms[0][0] + 4][1]).toEqual(["number", { value: 4 }]);
            expect(stack[rhythms[1][0] + 1][1]).toEqual(["number", { value: 1 }]);
            expect(stack[rhythms[1][0] + 4][1]).toEqual(["number", { value: 8 }]);
            expect(global.activity.textMsg).toHaveBeenCalled();
        });
    });
});
