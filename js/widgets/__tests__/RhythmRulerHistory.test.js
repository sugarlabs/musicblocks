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

const RhythmRulerHistory = global.RhythmRulerHistory;
const METHODS = ["_restoreDissectHistory", "_get_save_lock", "saveDissectHistory"];

describe("RhythmRulerHistory", () => {
    test("holds exactly the methods moved out of RhythmRuler", () => {
        const names = Object.getOwnPropertyNames(RhythmRulerHistory.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on RhythmRuler.prototype", () => {
        expect(RhythmRuler.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(RhythmRuler.prototype[name]).toBe(RhythmRulerHistory.prototype[name]);
            // Like a method declared in the class: not enumerable.
            expect(Object.getOwnPropertyDescriptor(RhythmRuler.prototype, name).enumerable).toBe(
                false
            );
        }
    });

    test("_get_save_lock reports the save lock", () => {
        expect(RhythmRulerHistory.prototype._get_save_lock.call({ _save_lock: true })).toBe(true);
        expect(RhythmRulerHistory.prototype._get_save_lock.call({ _save_lock: false })).toBe(false);
    });

    describe("saveDissectHistory", () => {
        beforeEach(() => {
            global.deepClone = value => JSON.parse(JSON.stringify(value));
        });

        const makeWidget = (rulers, drums, history = []) => ({
            Rulers: rulers,
            Drums: drums,
            _dissectHistory: history,
            _dissectNumber: { classList: { add: jest.fn() } }
        });

        test("records each ruler's edits against its drum block", () => {
            const widget = makeWidget(
                [
                    [[1], [[0, 2]]],
                    [[1], [3]]
                ],
                [11, 12]
            );

            RhythmRulerHistory.prototype.saveDissectHistory.call(widget);

            expect(widget._dissectHistory).toEqual([
                [[[0, 2]], 11],
                [[3], 12]
            ]);
        });

        test("skips rulers without a drum and keeps history for drums not shown", () => {
            const widget = makeWidget(
                [
                    [[1], [[0, 2]]],
                    [[1], [5]]
                ],
                [11, null],
                [[[[1, 4]], 99]]
            );

            RhythmRulerHistory.prototype.saveDissectHistory.call(widget);

            expect(widget._dissectHistory).toEqual([
                [[[0, 2]], 11],
                [[[1, 4]], 99]
            ]);
        });

        test("stores a copy, not the live ruler arrays", () => {
            const edits = [[0, 2]];
            const widget = makeWidget([[[1], edits]], [11]);

            RhythmRulerHistory.prototype.saveDissectHistory.call(widget);
            edits[0][1] = 3;

            expect(widget._dissectHistory[0][0][0]).toEqual([0, 2]);
        });
    });
});
