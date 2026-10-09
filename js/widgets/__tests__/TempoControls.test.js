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

global._ = msg => msg;
global.rationalToFraction = require("../../utils/utils-logic.js").rationalToFraction;
global.TONEBPM = 240;
global.Singer = { masterBPM: 90, defaultBPMFactor: 240 / 90 };
global.TempoWindow = require("../TempoWindow.js");
global.TempoRows = require("../TempoRows.js");
global.TempoKeyboard = require("../TempoKeyboard.js");
global.TempoTap = require("../TempoTap.js");
global.TempoControls = require("../TempoControls.js");
global.TempoMetronome = require("../TempoMetronome.js");
global.TempoSave = require("../TempoSave.js");
global.Tempo = require("../tempo.js");

const TempoControls = global.TempoControls;
const METHODS = [
    "_beatValue",
    "_bpmLimits",
    "_bpmRangeError",
    "_updateBPM",
    "_useBPM",
    "speedUp",
    "slowDown"
];

describe("TempoControls", () => {
    let tempo, activity, numberBlock, turtles;

    // A row for a BPM block of the given name holding the given BPM.
    const makeRow = (name, bpm, beatValue = 0.25) => {
        numberBlock = {
            name: "number",
            value: bpm,
            text: { text: String(bpm) },
            updateCache: jest.fn()
        };
        activity.blocks.blockList = { bpm: { name, connections: [null, "num"] }, num: numberBlock };
        tempo.BPMs = [bpm];
        tempo.BPMBlocks = ["bpm"];
        tempo.beatValues = [beatValue];
        tempo.BPMInputs = [{ value: bpm }];
        tempo._intervals = [(60 / bpm) * 1000];
    };

    beforeEach(() => {
        turtles = [{ singer: { bpm: [90, 100] } }, { singer: { bpm: [] } }];
        activity = {
            blocks: { blockList: {} },
            turtles: { turtleList: turtles },
            refreshCanvas: jest.fn(),
            saveLocally: jest.fn(),
            errorMsg: jest.fn()
        };
        tempo = new Tempo();
        tempo.activity = activity;
        Singer.masterBPM = 90;
        Singer.defaultBPMFactor = TONEBPM / 90;
    });

    test("holds exactly these methods", () => {
        const names = Object.getOwnPropertyNames(TempoControls.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on Tempo.prototype", () => {
        expect(Tempo.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(Tempo.prototype[name]).toBe(TempoControls.prototype[name]);
            expect(Object.getOwnPropertyDescriptor(Tempo.prototype, name).enumerable).toBe(false);
        }
    });

    describe("_updateBPM", () => {
        test.each(["setmasterbpm2", "setmasterbpm"])("a %s row sets the master tempo", name => {
            makeRow(name, 90);
            tempo.BPMs[0] = 120;

            tempo._updateBPM(0);

            expect(tempo._intervals[0]).toBe(500);
            expect(Singer.masterBPM).toBe(120);
            expect(Singer.defaultBPMFactor).toBe(TONEBPM / 120);
            expect(turtles[0].singer.bpm).toEqual([90, 100]);
        });

        test.each(["setbpm3", "setbpm2"])(
            "a %s row sets the current tempo of the turtle that ran it",
            name => {
                makeRow(name, 90);
                turtles[1].singer.bpm = [200];
                tempo.BPMTurtles = [turtles[0]];
                tempo.BPMs[0] = 120;

                tempo._updateBPM(0);

                expect(turtles[0].singer.bpm).toEqual([90, 120]);
                // Another start block keeps its own tempo.
                expect(turtles[1].singer.bpm).toEqual([200]);
                expect(Singer.masterBPM).toBe(90);
            }
        );

        test("writes the BPM into the block's number and saves the project", () => {
            makeRow("setmasterbpm2", 90);
            tempo.BPMs[0] = 120;

            tempo._updateBPM(0);

            expect(numberBlock.value).toBe(120);
            expect(numberBlock.text.text).toBe(120);
            expect(numberBlock.updateCache).toHaveBeenCalled();
            expect(activity.refreshCanvas).toHaveBeenCalled();
            expect(activity.saveLocally).toHaveBeenCalled();
        });

        test("a BPM typed as text is used as a number", () => {
            makeRow("setmasterbpm2", 90);
            tempo.BPMs[0] = "150";

            tempo._updateBPM(0);

            expect(numberBlock.value).toBe(150);
            expect(Singer.masterBPM).toBe(150);
        });

        test("only changes the metronome for a row without a block", () => {
            makeRow("setmasterbpm2", 90);
            tempo.BPMBlocks = [null];
            tempo.BPMs[0] = 120;

            tempo._updateBPM(0);

            expect(tempo._intervals[0]).toBe(500);
            expect(numberBlock.value).toBe(90);
            expect(Singer.masterBPM).toBe(90);
        });

        test("only changes the metronome when the block is gone", () => {
            makeRow("setmasterbpm2", 90);
            delete activity.blocks.blockList.bpm;
            tempo.BPMs[0] = 120;

            expect(() => tempo._updateBPM(0)).not.toThrow();
            expect(Singer.masterBPM).toBe(90);
        });

        test("sets the tempo when the BPM slot is empty", () => {
            makeRow("setmasterbpm2", 90);
            activity.blocks.blockList.bpm.connections = [null, null];
            tempo.BPMs[0] = 120;

            tempo._updateBPM(0);

            expect(activity.saveLocally).not.toHaveBeenCalled();
            expect(Singer.masterBPM).toBe(120);
        });
    });

    describe("_useBPM", () => {
        test("uses the typed BPM", () => {
            makeRow("setmasterbpm2", 90);
            tempo.BPMInputs[0].value = "144";

            tempo._useBPM(0);

            expect(tempo.BPMs[0]).toBe(144);
            expect(tempo.BPMInputs[0].value).toBe(144);
            expect(Singer.masterBPM).toBe(144);
            expect(activity.errorMsg).not.toHaveBeenCalled();
        });

        test("refuses a BPM that isn't a number", () => {
            makeRow("setmasterbpm2", 90);
            tempo.BPMInputs[0].value = "fast";

            tempo._useBPM(0);

            expect(tempo.BPMs[0]).toBe(90);
            expect(Singer.masterBPM).toBe(90);
            expect(activity.errorMsg).toHaveBeenCalledWith(
                "Please enter a number between 30 and 1000",
                null,
                null,
                3000
            );
        });

        test.each([
            ["2000", 1000],
            ["5", 30]
        ])("holds %s at %s", (typed, bpm) => {
            makeRow("setmasterbpm2", 90);
            tempo.BPMInputs[0].value = typed;

            tempo._useBPM(0);

            expect(tempo.BPMs[0]).toBe(bpm);
            expect(tempo.BPMInputs[0].value).toBe(bpm);
            expect(activity.errorMsg).toHaveBeenCalledWith(
                "The beats per minute must be between 30 and 1000.",
                null,
                null,
                3000
            );
        });
    });

    describe("speedUp and slowDown", () => {
        test("change the tempo by 10% by default", () => {
            makeRow("setmasterbpm2", 100);

            tempo.speedUp(0);
            expect(tempo.BPMs[0]).toBe(110);

            tempo.slowDown(0);
            expect(tempo.BPMs[0]).toBe(99);
            expect(tempo.BPMInputs[0].value).toBe(99);
            expect(Singer.masterBPM).toBe(99);
        });

        test("change the tempo by the given step", () => {
            makeRow("setmasterbpm2", 100);

            tempo.speedUp(0, 1);
            tempo.speedUp(0, 1);
            tempo.slowDown(0, 5);

            expect(tempo.BPMs[0]).toBe(97);
        });

        test("stop at 1000 and 30", () => {
            makeRow("setmasterbpm2", 990);
            tempo.speedUp(0, 50);
            expect(tempo.BPMs[0]).toBe(1000);
            expect(activity.errorMsg).toHaveBeenLastCalledWith(
                "The beats per minute must be below 1000.",
                null,
                null,
                3000
            );

            makeRow("setmasterbpm2", 35);
            tempo.slowDown(0, 10);
            expect(tempo.BPMs[0]).toBe(30);
            expect(activity.errorMsg).toHaveBeenLastCalledWith(
                "The beats per minute must be above 30",
                null,
                null,
                3000
            );
        });
    });

    describe("beat value", () => {
        test.each([undefined, null, 0, -1, NaN, "1/8"])(
            "a beat value of %s counts quarter notes",
            beatValue => {
                tempo.beatValues = [beatValue];
                expect(tempo._beatValue(0)).toBe(0.25);
            }
        );

        test("a row past the end of the beat values counts quarter notes", () => {
            tempo.beatValues = [];
            expect(tempo._beatValue(3)).toBe(0.25);
            tempo.beatValues = undefined;
            expect(tempo._beatValue(0)).toBe(0.25);
        });

        test("_bpmLimits scales 30 to 1000 quarter notes to the row's beats", () => {
            tempo.beatValues = [1 / 8, 1 / 2, 3 / 8];

            expect(tempo._bpmLimits(0)).toEqual([60, 2000]);
            expect(tempo._bpmLimits(1)).toEqual([15, 500]);
            // 666.67 is rounded down, so the row never goes above 1000 quarter notes.
            expect(tempo._bpmLimits(2)).toEqual([20, 666]);
        });

        test.each([
            [1 / 10, [75, 2500]],
            [3 / 16, [40, 1333]],
            [1 / 3, [23, 750]],
            [1 / 16, [120, 4000]]
        ])("_bpmLimits for a beat value of %s are whole numbers: %j", (beatValue, limits) => {
            tempo.beatValues = [beatValue];

            expect(tempo._bpmLimits(0)).toEqual(limits);
        });

        test("a row clamped at a fractional limit gets a whole BPM and message", () => {
            makeRow("setmasterbpm2", 600, 3 / 8);

            tempo.speedUp(0, 100);

            expect(tempo.BPMs[0]).toBe(666);
            expect(numberBlock.text.text).toBe(666);
            expect(tempo.BPMInputs[0].value).toBe(666);
            // 666 3/8 notes is 999 quarter notes, inside the range.
            expect(Singer.masterBPM).toBe(999);
            expect(activity.errorMsg).toHaveBeenLastCalledWith(
                "maximum 3/8 beats per minute is 666",
                null,
                null,
                3000
            );
        });

        test("_bpmRangeError names the beat value like the BPM blocks do", () => {
            tempo.beatValues = [1 / 2];

            tempo._bpmRangeError(0, "unused", false);
            expect(activity.errorMsg).toHaveBeenLastCalledWith(
                "1/2 beats per minute must be greater than 15",
                null,
                null,
                3000
            );

            tempo._bpmRangeError(0, "unused", true);
            expect(activity.errorMsg).toHaveBeenLastCalledWith(
                "maximum 1/2 beats per minute is 500",
                null,
                null,
                3000
            );
        });

        test("_bpmRangeError gives the widget's message for quarter notes", () => {
            tempo.beatValues = [0.25];

            tempo._bpmRangeError(0, "The beats per minute must be above 30", false);

            expect(activity.errorMsg).toHaveBeenCalledWith(
                "The beats per minute must be above 30",
                null,
                null,
                3000
            );
        });

        test("speeding up a row below its lowest BPM never slows the tempo down", () => {
            // Master BPM 40 at 1/8 plays at the 30 quarter-note minimum (60 eighth notes).
            makeRow("setmasterbpm2", 40, 1 / 8);

            tempo.speedUp(0);

            // 44 would be 22 quarter notes, slower than the 30 playing now.
            expect(tempo.BPMs[0]).toBe(60);
            expect(Singer.masterBPM).toBe(30);
            expect(activity.errorMsg).toHaveBeenLastCalledWith(
                "1/8 beats per minute must be greater than 60",
                null,
                null,
                3000
            );

            tempo.speedUp(0);
            expect(tempo.BPMs[0]).toBe(66);
            expect(Singer.masterBPM).toBe(33);
        });

        test("slowing down a row above its highest BPM never speeds the tempo up", () => {
            makeRow("setmasterbpm2", 2500, 1 / 8);

            tempo.slowDown(0, 1);

            // 2499 eighth notes would be over 1000 quarter notes.
            expect(tempo.BPMs[0]).toBe(2000);
            expect(Singer.masterBPM).toBe(1000);
            expect(activity.errorMsg).toHaveBeenLastCalledWith(
                "maximum 1/8 beats per minute is 2000",
                null,
                null,
                3000
            );
        });

        test("slowing a 1/2 row to 20 sets 40 quarter notes, which 1/4 would refuse", () => {
            makeRow("setmasterbpm2", 30, 1 / 2);

            tempo.slowDown(0, 10);

            expect(tempo.BPMs[0]).toBe(20);
            expect(Singer.masterBPM).toBe(40);
            expect(activity.errorMsg).not.toHaveBeenCalled();
        });
    });
});
