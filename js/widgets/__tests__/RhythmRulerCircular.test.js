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

const RhythmRulerCircular = global.RhythmRulerCircular;
const METHODS = [
    "_refreshCircularView",
    "_toggleCircularView",
    "_cleanupCircularCanvas",
    "_getRingGeometry",
    "_drawCircularView",
    "_hitTestCircular",
    "_onCircularMouseDown",
    "_onCircularMouseMove",
    "_onCircularMouseUp",
    "_tieCircular"
];

describe("RhythmRulerCircular", () => {
    test("holds exactly the methods moved out of RhythmRuler", () => {
        const names = Object.getOwnPropertyNames(RhythmRulerCircular.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on RhythmRuler.prototype", () => {
        expect(RhythmRuler.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(RhythmRuler.prototype[name]).toBe(RhythmRulerCircular.prototype[name]);
            // Like a method declared in the class: not enumerable.
            expect(Object.getOwnPropertyDescriptor(RhythmRuler.prototype, name).enumerable).toBe(
                false
            );
        }
    });

    describe("_getRingGeometry", () => {
        const geometry = (size, rulers) =>
            RhythmRulerCircular.prototype._getRingGeometry.call({}, size, rulers);

        test("leaves a centre hole and splits the rest between the rings", () => {
            const ring = geometry(500, 2);
            expect(ring.innerHoleRadius).toBe(50);
            expect(ring.outerLimit).toBe(235);
            expect(ring.ringGap).toBe(2);
            expect(ring.ringThickness).toBe((185 - 2) / 2);
        });

        test("uses the whole space for a single ring or none", () => {
            expect(geometry(500, 1).ringThickness).toBe(185);
            expect(geometry(500, 0).ringThickness).toBe(185);
        });
    });

    describe("pointer handling", () => {
        // A widget whose hit test returns the given targets in order: the press,
        // then the release.
        const makeWidget = (...hits) => {
            const cells = [{}, {}, {}];
            return {
                _playing: false,
                _rulers: [{ cells }, { cells: [{}] }],
                _dissectNumber: { value: "" },
                _hitTestCircular: jest.fn(() => hits.shift() || null),
                _tieCircular: jest.fn(),
                __dissectByNumber: jest.fn(),
                saveDissectHistory: jest.fn(),
                _drawCircularView: jest.fn()
            };
        };

        const pressAndRelease = widget => {
            RhythmRulerCircular.prototype._onCircularMouseDown.call(widget, {});
            RhythmRulerCircular.prototype._onCircularMouseUp.call(widget, {});
        };

        test("dragging across cells of one ruler ties them", () => {
            const widget = makeWidget(
                { rulerIndex: 0, cellIndex: 0 },
                { rulerIndex: 0, cellIndex: 2 }
            );

            pressAndRelease(widget);

            expect(widget._tieCircular).toHaveBeenCalledWith(0, 0, 2);
            expect(widget.__dissectByNumber).not.toHaveBeenCalled();
        });

        test("a click on one cell dissects it, in two by default", () => {
            const widget = makeWidget(
                { rulerIndex: 0, cellIndex: 1 },
                { rulerIndex: 0, cellIndex: 1 }
            );

            pressAndRelease(widget);

            expect(widget.__dissectByNumber).toHaveBeenCalledWith(
                widget._rulers[0].cells[1],
                2,
                true
            );
            expect(widget._rulerSelected).toBe(0);
            expect(widget.saveDissectHistory).toHaveBeenCalled();
            expect(widget._tieCircular).not.toHaveBeenCalled();
        });

        test("uses the dissect number box when it has a value", () => {
            const widget = makeWidget(
                { rulerIndex: 0, cellIndex: 0 },
                { rulerIndex: 0, cellIndex: 0 }
            );
            widget._dissectNumber.value = "3";

            pressAndRelease(widget);

            expect(widget.__dissectByNumber.mock.calls[0][1]).toBe(3);
        });

        test("a drag that ends on another ruler dissects where it started", () => {
            const widget = makeWidget(
                { rulerIndex: 0, cellIndex: 2 },
                { rulerIndex: 1, cellIndex: 0 }
            );

            pressAndRelease(widget);

            expect(widget._tieCircular).not.toHaveBeenCalled();
            expect(widget.__dissectByNumber).toHaveBeenCalledWith(
                widget._rulers[0].cells[2],
                2,
                true
            );
        });

        test("ignores the pointer while playing, and presses outside the rings", () => {
            const playing = makeWidget({ rulerIndex: 0, cellIndex: 0 });
            playing._playing = true;
            pressAndRelease(playing);
            expect(playing._hitTestCircular).not.toHaveBeenCalled();

            const outside = makeWidget(null, { rulerIndex: 0, cellIndex: 0 });
            pressAndRelease(outside);
            expect(outside._tieCircular).not.toHaveBeenCalled();
            expect(outside.__dissectByNumber).not.toHaveBeenCalled();
        });
    });
});
