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

const RhythmRulerPlayback = global.RhythmRulerPlayback;
const METHODS = [
    "__pause",
    "playAll",
    "__resume",
    "_playAll",
    "_playOne",
    "_getDrumName",
    "__loop"
];

describe("RhythmRulerPlayback", () => {
    test("holds exactly the methods moved out of RhythmRuler", () => {
        const names = Object.getOwnPropertyNames(RhythmRulerPlayback.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on RhythmRuler.prototype", () => {
        expect(RhythmRuler.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(RhythmRuler.prototype[name]).toBe(RhythmRulerPlayback.prototype[name]);
            // Like a method declared in the class: not enumerable.
            expect(Object.getOwnPropertyDescriptor(RhythmRuler.prototype, name).enumerable).toBe(
                false
            );
        }
    });

    describe("_getDrumName", () => {
        const drumName = (widget, ruler = 0) =>
            RhythmRulerPlayback.prototype._getDrumName.call(widget, ruler);

        test("falls back to snare drum without a drum block", () => {
            expect(drumName({ Drums: [null] })).toBe("snare drum");
            expect(drumName({ Drums: [5], activity: { blocks: { blockList: [] } } })).toBe(
                "snare drum"
            );
        });

        test("reads the drum name connected to the drum block", () => {
            const blockList = [];
            blockList[5] = { connections: [null, 6] };
            blockList[6] = { value: "kick drum" };
            expect(drumName({ Drums: [5], activity: { blocks: { blockList } } })).toBe("kick drum");
        });

        test("falls back when the connected value is not a name", () => {
            const blockList = [];
            blockList[5] = { connections: [null, 6] };
            blockList[6] = { value: 3 };
            expect(drumName({ Drums: [5], activity: { blocks: { blockList } } })).toBe(
                "snare drum"
            );
        });
    });
});
