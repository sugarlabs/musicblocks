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

global.ManagedTimer = require("../../utils/ManagedTimer");
global.PitchStaircaseTimers = require("../PitchStaircaseTimers.js");
global.PitchStaircaseLayout = require("../PitchStaircaseLayout.js");
global.PitchStaircaseSteps = require("../PitchStaircaseSteps.js");
global.PitchStaircasePlayback = require("../PitchStaircasePlayback.js");
global.PitchStaircaseSave = require("../PitchStaircaseSave.js");
global.PitchStaircaseWindow = require("../PitchStaircaseWindow.js");
global.PitchStaircase = require("../pitchstaircase.js");

global._ = msg => msg;
global.frequencyToPitch = jest.fn(() => ["E", 4, 2]);

const PitchStaircaseSteps = global.PitchStaircaseSteps;
const METHODS = ["addStair", "_readRatio", "_undo", "_dissectStair"];

describe("PitchStaircaseSteps", () => {
    let psc;

    const clickOn = frequency => ({ target: { getAttribute: () => String(frequency) } });

    beforeEach(() => {
        psc = new PitchStaircase();
        psc._history = [];
        psc._musicRatio1 = { value: "3" };
        psc._musicRatio2 = { value: "2" };
        psc._makeStairs = jest.fn();
        psc.activity = { textMsg: jest.fn() };
    });

    test("holds exactly the methods moved out of PitchStaircase", () => {
        const names = Object.getOwnPropertyNames(PitchStaircaseSteps.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on PitchStaircase.prototype", () => {
        expect(PitchStaircase.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(PitchStaircase.prototype[name]).toBe(PitchStaircaseSteps.prototype[name]);
            expect(Object.getOwnPropertyDescriptor(PitchStaircase.prototype, name).enumerable).toBe(
                false
            );
        }
    });

    describe("addStair", () => {
        test("adds a complete stair: its own parent and initial frequency, ratio 1/1", () => {
            psc.addStair("A", 3, 220, 7);

            expect(psc.Stairs).toEqual([["A", 3, 220, 1, 1, 220, 220]]);
            expect(psc.stairPitchBlocks).toEqual([7]);
        });

        test("keeps the stairs from the highest frequency down", () => {
            psc.addStair("C", 4, 261.63, 1);
            psc.addStair("A", 3, 220, 2);
            psc.addStair("G", 4, 392, 3);
            psc.addStair("E", 4, 329.63, 4);

            expect(psc.Stairs.map(stair => stair[2])).toEqual([392, 329.63, 261.63, 220]);
        });

        test("records every block, including stairs inserted in front", () => {
            psc.addStair("A", 3, 220, 1);
            psc.addStair("G", 4, 392, 2);

            expect(psc.stairPitchBlocks).toEqual([1, 2]);
        });

        test("replaces a stair with the same frequency", () => {
            psc.addStair("A", 3, 220, 1);
            psc.addStair("la", 3, 220, 2);

            expect(psc.Stairs).toEqual([["la", 3, 220, 1, 1, 220, 220]]);
        });
    });

    describe("_readRatio", () => {
        test.each([
            ["4", 4],
            ["4.7", 4],
            ["1", 1]
        ])("reads %s as %d", (value, expected) => {
            const input = { value };
            expect(psc._readRatio(input, 3)).toBe(expected);
            expect(input.value).toBe(expected);
        });

        test.each(["0.5", "0", "-5", "", "abc"])("falls back for %j", value => {
            const input = { value };
            expect(psc._readRatio(input, 3)).toBe(3);
            expect(input.value).toBe(3);
        });
    });

    describe("_dissectStair", () => {
        beforeEach(() => {
            psc.addStair("A", 3, 220, 1);
        });

        test("applies the ratio and keeps the source stair's initial frequency", () => {
            psc._dissectStair(clickOn(220));

            expect(psc.Stairs).toHaveLength(2);
            expect(psc.Stairs[0]).toEqual(["E", 4, 330, 2, 3, 220, 220]);
            expect(psc._history).toEqual([0]);
            expect(psc._makeStairs).toHaveBeenCalled();
        });

        test("a step from a step multiplies the ratios", () => {
            psc._dissectStair(clickOn(220));
            psc._dissectStair(clickOn(330));

            expect(psc.Stairs[0][2]).toBeCloseTo(495);
            expect(psc.Stairs[0].slice(3)).toEqual([4, 9, 330, 220]);
        });

        test("a fractional ratio is not floored to zero", () => {
            psc._musicRatio1.value = "0.5";

            psc._dissectStair(clickOn(220));

            expect(psc._musicRatio1.value).toBe(3);
            expect(psc.activity.textMsg).not.toHaveBeenCalled();
            expect(psc.Stairs[0][2]).toBeCloseTo(330);
        });

        test("does nothing for a frequency that is not a stair", () => {
            psc._dissectStair(clickOn(999));

            expect(psc.Stairs).toHaveLength(1);
            expect(psc._makeStairs).not.toHaveBeenCalled();
        });

        test("refuses a step outside the supported range", () => {
            psc._musicRatio1.value = "1";
            psc._musicRatio2.value = "100";

            psc._dissectStair(clickOn(220));

            expect(psc.Stairs).toHaveLength(1);
            expect(psc.activity.textMsg).toHaveBeenCalled();
        });

        test("a step below every stair goes at the end", () => {
            psc._musicRatio1.value = "2";
            psc._musicRatio2.value = "3";

            psc._dissectStair(clickOn(220));

            expect(psc.Stairs[1][2]).toBeCloseTo(146.67, 2);
            expect(psc._history).toEqual([1]);
        });

        test("a step landing on an existing stair replaces it without adding history", () => {
            psc.addStair("E", 4, 330, 2);

            psc._dissectStair(clickOn(220));

            expect(psc.Stairs).toHaveLength(2);
            expect(psc.Stairs[0].slice(3)).toEqual([2, 3, 220, 220]);
            expect(psc._history).toEqual([]);
        });
    });

    describe("_undo", () => {
        test("removes the steps in the reverse order they were made", () => {
            psc._refresh = jest.fn();
            psc.addStair("A", 3, 220, 1);
            psc._dissectStair(clickOn(220));
            psc._musicRatio1.value = "2";
            psc._musicRatio2.value = "3";
            psc._dissectStair(clickOn(220));

            expect(psc._undo()).toBe(true);
            expect(psc.Stairs.map(stair => stair[2])).toEqual([330, 220]);
            expect(psc._undo()).toBe(true);
            expect(psc.Stairs.map(stair => stair[2])).toEqual([220]);
            expect(psc._undo()).toBe(false);
            expect(psc._refresh).toHaveBeenCalledTimes(2);
        });
    });
});
