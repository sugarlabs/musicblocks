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

    describe("_undo", () => {
        beforeEach(() => {
            global.platformColor = { selectorBackground: "#aaa" };
            global.last = list => list[list.length - 1];
            global.rationalToFraction = require("../../utils/utils-logic.js").rationalToFraction;
        });

        afterEach(() => {
            document.body.replaceChildren();
        });

        // A ruler drawn as a real table row, one cell per note value.
        const makeWidget = (noteValues, history, undoList) => {
            const table = document.createElement("table");
            const row = table.insertRow();
            for (const value of noteValues) {
                const cell = row.insertCell();
                cell.style.width = 200 / Math.abs(value) + "px";
            }
            document.body.append(table);

            return {
                activity: { logo: { synth: { stop: jest.fn() } } },
                _rulers: [row],
                Rulers: [[noteValues, history]],
                _undoList: undoList,
                _noteWidth: value => 200 / Math.abs(value),
                __setNoteValueDisplay: jest.fn(),
                __addCellEventHandlers: jest.fn(),
                __toggleRestState: jest.fn(),
                _calculateZebraStripes: jest.fn(),
                _refreshCircularView: jest.fn()
            };
        };

        const undo = widget => RhythmRulerEditing.prototype._undo.call(widget);

        test("does nothing but stop playback when there is nothing to undo", () => {
            const widget = makeWidget([4], [], []);
            widget._playing = true;

            undo(widget);

            expect(widget.activity.logo.synth.stop).toHaveBeenCalled();
            expect(widget._playing).toBe(false);
            expect(widget._rulerPlaying).toBe(-1);
            expect(widget._rulers[0].cells).toHaveLength(1);
        });

        test("puts a dissected cell back together", () => {
            const widget = makeWidget([8, 8], [[0, 2]], [["dissect", 0]]);

            undo(widget);

            expect(widget.Rulers[0][0]).toEqual([4]);
            expect(widget.Rulers[0][1]).toEqual([]);
            expect(widget._rulers[0].cells).toHaveLength(1);
            expect(widget._rulers[0].cells[0].style.width).toBe("50px");
            expect(widget._calculateZebraStripes).toHaveBeenCalledWith(0);
            expect(widget._refreshCircularView).toHaveBeenCalled();
        });

        test("merges tapped cells back into one", () => {
            const widget = makeWidget([8, 8, 2], [[0, [8, 8]]], [["tap", 0]]);

            undo(widget);

            expect(widget.Rulers[0][0]).toEqual([4, 2]);
            expect(widget._rulers[0].cells).toHaveLength(2);
            // A quarter note: shown as 1/4.
            expect(widget.__setNoteValueDisplay).toHaveBeenCalledWith(
                widget._rulers[0].cells[0],
                1,
                4
            );
        });

        test("splits a tied cell back into the cells it came from", () => {
            const widget = makeWidget(
                [2],
                [
                    [
                        [0, 4],
                        [1, 4]
                    ]
                ],
                [["tie", 0]]
            );

            undo(widget);

            expect(widget.Rulers[0][0]).toEqual([4, 4]);
            expect(widget._rulers[0].cells).toHaveLength(2);
            expect(widget.Rulers[0][1]).toEqual([]);
        });

        test("toggles a rest back without adding it to the undo list", () => {
            const widget = makeWidget([4, 4], [1], [["rest", 0]]);
            widget.__toggleRestState.mockImplementation(() => widget.Rulers[0][1].push(1));

            undo(widget);

            expect(widget.__toggleRestState).toHaveBeenCalledWith(
                widget._rulers[0].cells[1],
                false
            );
            expect(widget.Rulers[0][1]).toEqual([]);
        });
    });
});
