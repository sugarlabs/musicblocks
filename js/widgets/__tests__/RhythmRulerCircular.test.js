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
    describe("circular tapping", () => {
        let widget;
        const hit = { rulerIndex: 0, cellIndex: 0 };
        const click = () => {
            widget._onCircularMouseDown({});
            widget._onCircularMouseUp({});
        };

        beforeEach(() => {
            jest.useFakeTimers();
            global._ = text => text;
            global.Singer = { defaultBPMFactor: 1000 };
            global.last = list => list[list.length - 1];
            const utils = require("../../utils/utils-logic.js");
            global.nearestBeat = utils.nearestBeat;
            global.rationalToFraction = utils.rationalToFraction;
            global.platformColor = { selectorBackground: "#aaa" };
            const table = document.createElement("table");
            const row = table.insertRow();
            row.setAttribute("data-row", "0");
            row.insertCell();
            row.insertCell();
            document.body.append(table);
            widget = Object.assign(Object.create(RhythmRuler.prototype), {
                activity: {
                    hideMsgs: jest.fn(),
                    logo: { synth: { trigger: jest.fn(), stop: jest.fn() } },
                    turtles: { ithTurtle: () => ({ singer: { beatsPerMeasure: 4 } }) }
                },
                Rulers: [[[2, 2], []]],
                Drums: [null],
                _rulers: [row],
                _tapMode: true,
                _tapTimes: [],
                _tapCell: null,
                _playing: false,
                _bpmFactor: 1000,
                _dissectNumber: { value: "2" },
                _undoList: [],
                _hitTestCircular: jest.fn(() => hit),
                _setWidgetTimeout: setTimeout,
                _setWidgetInterval: setInterval,
                _clearWidgetInterval: clearInterval,
                _setButtonIcon: jest.fn(),
                _noteWidth: value => 200 / Math.abs(value),
                __setNoteValueDisplay: jest.fn(),
                __addCellEventHandlers: jest.fn(),
                _calculateZebraStripes: jest.fn(),
                _refreshCircularView: jest.fn(),
                saveDissectHistory: jest.fn(),
                _drawCircularView: jest.fn()
            });
        });

        afterEach(() => {
            jest.clearAllTimers();
            jest.useRealTimers();
            document.body.replaceChildren();
        });

        test("counts in, records taps, redraws the rhythm, and supports Undo", () => {
            const cell = widget._rulers[0].cells[0];
            widget._hitTestCircular.mockReturnValueOnce(hit).mockReturnValueOnce({
                rulerIndex: 0,
                cellIndex: 1
            });
            click();
            expect(widget.Rulers[0][0]).toEqual([2, 2]);
            expect(widget._tapCell).toBe(cell);
            jest.advanceTimersByTime(500);
            expect(widget.activity.logo.synth.trigger).toHaveBeenCalledTimes(4);
            expect(widget._tapTimes).toHaveLength(1);
            jest.advanceTimersByTime(125);
            click();
            jest.advanceTimersByTime(250);
            click();
            expect(widget._tapTimes).toHaveLength(3);
            jest.advanceTimersByTime(125);
            expect(widget.Rulers[0][0]).toEqual([8, 4, 8, 2]);
            expect(widget._tapMode).toBe(false);
            expect(widget._tapCell).toBeNull();
            expect(widget._refreshCircularView).toHaveBeenCalled();
            expect(widget._undoList).toEqual([["tap", "0"]]);
            widget._undo();
            expect(widget.Rulers[0][0]).toEqual([2, 2]);
            expect(widget._rulers[0].cells).toHaveLength(2);
        });

        test("does not start tapping or split a rest", () => {
            widget.Rulers[0][0][0] = -2;
            click();
            expect(widget.Rulers[0][0]).toEqual([-2, 2]);
            expect(widget._tapMode).toBe(false);
            expect(widget._tapCell).toBeNull();
            expect(jest.getTimerCount()).toBe(0);
            expect(widget._undoList).toEqual([]);
        });
    });
});
