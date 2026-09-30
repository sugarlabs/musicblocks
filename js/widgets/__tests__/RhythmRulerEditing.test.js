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

const RhythmRulerEditing = global.RhythmRulerEditing;
const METHODS = [
    "_dissectRuler",
    "__startTapping",
    "__endTapping",
    "__addCellEventHandlers",
    "__getLongPressStatus",
    "__toggleRestState",
    "__divideFromList",
    "__dissectByNumber",
    "_tieRuler",
    "__tie",
    "_undo",
    "_tap",
    "_clear"
];

describe("RhythmRulerEditing", () => {
    test("holds exactly the methods moved out of RhythmRuler", () => {
        const names = Object.getOwnPropertyNames(RhythmRulerEditing.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on RhythmRuler.prototype", () => {
        expect(RhythmRuler.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(RhythmRuler.prototype[name]).toBe(RhythmRulerEditing.prototype[name]);
            // Like a method declared in the class: not enumerable.
            expect(Object.getOwnPropertyDescriptor(RhythmRuler.prototype, name).enumerable).toBe(
                false
            );
        }
    });

    test("__getLongPressStatus reports whether a long press is in progress", () => {
        const status = RhythmRulerEditing.prototype.__getLongPressStatus;
        expect(status.call({ _inLongPress: true })).toBe(true);
        expect(status.call({ _inLongPress: false })).toBe(false);
    });

    test("_clear stops playback and undoes every ruler's edits", () => {
        global._ = text => text;
        const widget = {
            activity: { logo: { synth: { stop: jest.fn() }, resetSynth: jest.fn() } },
            Rulers: [
                [
                    [1],
                    [
                        [0, 2],
                        [1, 2]
                    ]
                ],
                [[1], [[0, 3]]]
            ],
            _playing: true,
            _playingAll: true,
            _playingOne: true,
            _setButtonIcon: jest.fn(),
            _refreshCircularView: jest.fn()
        };
        widget._undo = jest.fn(() => widget.Rulers[widget._rulerSelected][1].pop());

        RhythmRulerEditing.prototype._clear.call(widget);

        expect(widget.activity.logo.synth.stop).toHaveBeenCalled();
        expect(widget._undo).toHaveBeenCalledTimes(3);
        expect(widget.Rulers.map(ruler => ruler[1])).toEqual([[], []]);
        expect(widget._playing).toBe(false);
        expect(widget._playingAll).toBe(false);
        expect(widget._rulerPlaying).toBe(-1);
        expect(widget._refreshCircularView).toHaveBeenCalled();
    });
});
