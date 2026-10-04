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

const RhythmRulerLayout = global.RhythmRulerLayout;
const METHODS = [
    "_createWidgetWindow",
    "_buildRulerTable",
    "_noteWidth",
    "__setNoteValueDisplay",
    "_scale",
    "_showDissectNumberPieMenu",
    "_calculateZebraStripes",
    "_positionWheel"
];

describe("RhythmRulerLayout", () => {
    test("holds exactly the methods moved out of RhythmRuler", () => {
        const names = Object.getOwnPropertyNames(RhythmRulerLayout.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on RhythmRuler.prototype", () => {
        expect(RhythmRuler.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(RhythmRuler.prototype[name]).toBe(RhythmRulerLayout.prototype[name]);
            // Like a method declared in the class: not enumerable.
            expect(Object.getOwnPropertyDescriptor(RhythmRuler.prototype, name).enumerable).toBe(
                false
            );
        }
    });

    describe("_noteWidth", () => {
        beforeEach(() => {
            global.EIGHTHNOTEWIDTH = 24;
        });

        test("uses a scale of 3 in a normal window", () => {
            const widget = { widgetWindow: { isMaximized: () => false } };
            expect(RhythmRulerLayout.prototype._noteWidth.call(widget, 4)).toBe(144);
            expect(RhythmRulerLayout.prototype._noteWidth.call(widget, -8)).toBe(72);
        });

        test("uses the fullscreen scale factor when maximized", () => {
            const widget = {
                widgetWindow: { isMaximized: () => true },
                _fullscreenScaleFactor: 5
            };
            expect(RhythmRulerLayout.prototype._noteWidth.call(widget, 4)).toBe(240);
        });
    });

    describe("_calculateZebraStripes", () => {
        beforeEach(() => {
            global.platformColor = { selectorBackground: "#aaa", selectorSelected: "#bbb" };
        });

        const stripe = rulerSelected => {
            const cells = [0, 1, 2].map(() => ({ style: {} }));
            const widget = { _rulers: [{ cells }], _rulerSelected: rulerSelected };
            RhythmRulerLayout.prototype._calculateZebraStripes.call(widget, 0);
            return cells.map(cell => cell.style.backgroundColor);
        };

        test("alternates the cell colours", () => {
            expect(stripe(0)).toEqual(["#aaa", "#bbb", "#aaa"]);
        });

        test("swaps the colours for an odd selected ruler", () => {
            expect(stripe(1)).toEqual(["#bbb", "#aaa", "#bbb"]);
        });
    });
});
