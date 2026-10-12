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

const TimbreBlocks = global.TimbreBlocks;
const METHODS = [
    "_update",
    "_save",
    "_undo",
    "_recordUndo",
    "_purgeUndoSnapshots",
    "_syncThumbTooltips",
    "_applyUndoState",
    "clampConnection",
    "clampConnectionVspace",
    "_finalizeClampAdjustment",
    "_changeBlock",
    "_setDuoSynthParamVals",
    "_addDuoSynthBlock",
    "_blockReplace",
    "blockConnection"
];

describe("TimbreBlocks", () => {
    test("holds exactly the methods moved out of TimbreWidget", () => {
        const names = Object.getOwnPropertyNames(TimbreBlocks.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on TimbreWidget.prototype", () => {
        expect(TimbreWidget.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(TimbreWidget.prototype[name]).toBe(TimbreBlocks.prototype[name]);
            expect(Object.getOwnPropertyDescriptor(TimbreWidget.prototype, name).enumerable).toBe(
                false
            );
        }
    });

    describe("_setDuoSynthParamVals", () => {
        test("sets vibrato rate and scaled vibrato amount", () => {
            const mockWidget = {
                duoSynthParamVals: {}
            };

            TimbreBlocks.prototype._setDuoSynthParamVals.call(mockWidget, 8, 40);

            expect(mockWidget.duoSynthParamVals.vibratoRate).toBe(8);
            expect(mockWidget.duoSynthParamVals.vibratoAmount).toBe(0.4);
        });
    });

    describe("_save", () => {
        test("saves a settimbre block structure with current instrument name", () => {
            const loadNewBlocks = jest.fn();
            const mockWidget = {
                instrumentName: "flute",
                _delta: 0,
                activity: {
                    blocks: {
                        loadNewBlocks
                    }
                }
            };

            TimbreBlocks.prototype._save.call(mockWidget);

            expect(loadNewBlocks).toHaveBeenCalledTimes(1);
            const loaded = loadNewBlocks.mock.calls[0][0];
            expect(loaded[0][1]).toBe("settimbre");
            expect(loaded[1][1]).toEqual(["text", { value: "flute" }]);
            expect(mockWidget._delta).toBe(42);
        });
    });
});
