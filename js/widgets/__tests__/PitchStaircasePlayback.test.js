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
global.SYNTHSVG = "<svg>SVGWIDTH XSCALE STOKEWIDTH</svg>";
global.base64Encode = s => s;
global.clampNumber = require("../../utils/utils-logic.js").clampNumber;
global.platformColor = { selectorBackgroundHOVER: "#e0e0e0" };
global.DEFAULTVOICE = "electronic synth";

const PitchStaircasePlayback = global.PitchStaircasePlayback;
const METHODS = [
    "_playOne",
    "_stopRow",
    "_playAll",
    "_stopChord",
    "playUpAndDown",
    "_playNext",
    "_stopScale"
];

describe("PitchStaircasePlayback", () => {
    let psc;
    let synth;

    const playCellOf = i => psc._stepTables[i].rows[0].cells[0];
    const stepCellOf = i => psc._stepTables[i].rows[0].cells[1];
    const makeButton = () => {
        const button = document.createElement("td");
        button.classList.add("pitch-staircase-btn");
        return button;
    };
    const iconOf = button => button.querySelector("img").getAttribute("src");
    const playedFrequencies = () => synth.trigger.mock.calls.map(call => call[1]);

    beforeEach(() => {
        jest.useFakeTimers();
        psc = new PitchStaircase();
        synth = { trigger: jest.fn(), stopSound: jest.fn() };
        psc.activity = { logo: { synth } };
        psc._pscTable = document.createElement("table");
        psc._cellScale = 1;
        psc._playAllButton = makeButton();
        psc._playScaleButton = makeButton();
        // 5:4 and 3:2 above A3, which are between notes.
        psc.Stairs = [
            ["E", 4, 330, 2, 3, 220, 220],
            ["C#", 4, 275, 4, 5, 220, 220],
            ["A", 3, 220, 1, 1, 220, 220]
        ];
        psc._makeStairs();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("holds exactly the methods moved out of PitchStaircase", () => {
        const names = Object.getOwnPropertyNames(PitchStaircasePlayback.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on PitchStaircase.prototype", () => {
        expect(PitchStaircase.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(PitchStaircase.prototype[name]).toBe(PitchStaircasePlayback.prototype[name]);
            expect(Object.getOwnPropertyDescriptor(PitchStaircase.prototype, name).enumerable).toBe(
                false
            );
        }
    });

    describe("one stair", () => {
        test("plays for a second, then resets", () => {
            psc._playOne(stepCellOf(1), playCellOf(1));

            expect(playedFrequencies()).toEqual([275]);
            expect(stepCellOf(1).classList.contains("active")).toBe(true);
            expect(iconOf(playCellOf(1))).toBe("header-icons/stop-button.svg");

            jest.advanceTimersByTime(1000);
            expect(stepCellOf(1).classList.contains("active")).toBe(false);
            expect(iconOf(playCellOf(1))).toBe("header-icons/play-button.svg");
            expect(psc._playingRowIndex).toBeNull();
        });

        test("playing another stair stops the first one", () => {
            psc._playOne(stepCellOf(0), playCellOf(0));
            jest.advanceTimersByTime(500);
            psc._playOne(stepCellOf(2), playCellOf(2));

            expect(synth.stopSound).toHaveBeenCalledWith(0, "electronic synth", 330);
            expect(stepCellOf(0).classList.contains("active")).toBe(false);
            expect(iconOf(playCellOf(0))).toBe("header-icons/play-button.svg");

            // The first stair's timeout must not reset the second while it still plays.
            jest.advanceTimersByTime(600);
            expect(psc._playingRowIndex).toBe(2);
            playCellOf(2).onclick();
            expect(synth.stopSound).toHaveBeenLastCalledWith(0, "electronic synth", 220);
            expect(synth.trigger).toHaveBeenCalledTimes(2);
        });

        test("_stopRow does nothing to the table if the rows were rebuilt", () => {
            psc._playOne(stepCellOf(1), playCellOf(1));
            psc._stepTables = [];

            expect(() => psc._stopRow()).not.toThrow();
            expect(psc._playingRowIndex).toBeNull();
        });
    });

    describe("chord", () => {
        test("plays every stair once, at its own frequency", () => {
            psc._playAll();

            expect(synth.trigger).toHaveBeenCalledTimes(1);
            expect(playedFrequencies()).toEqual([[330, 275, 220]]);
            expect(iconOf(psc._playAllButton)).toBe("header-icons/stop-button.svg");
            [0, 1, 2].forEach(i => expect(stepCellOf(i).classList.contains("active")).toBe(true));
        });

        test("resets after a second", () => {
            psc._playAll();
            jest.advanceTimersByTime(1000);

            expect(psc._isPlayingAll).toBe(false);
            expect(iconOf(psc._playAllButton)).toBe("header-icons/play-chord.svg");
            [0, 1, 2].forEach(i => expect(stepCellOf(i).classList.contains("active")).toBe(false));
        });

        test("doesn't trigger anything with no stairs", () => {
            psc.Stairs = [];
            psc._makeStairs();

            psc._playAll();

            expect(synth.trigger).not.toHaveBeenCalled();
        });

        test("_stopChord stops it early", () => {
            psc._playAll();
            psc._stopChord();

            expect(synth.stopSound).toHaveBeenCalledWith(0, "electronic synth");
            expect(psc._isPlayingAll).toBe(false);
            expect(psc._playAllTimeout).toBeNull();
            expect(iconOf(psc._playAllButton)).toBe("header-icons/play-chord.svg");
        });
    });

    describe("scale", () => {
        test("plays up from the lowest stair and back down, at the stairs' frequencies", () => {
            psc.playUpAndDown();
            jest.advanceTimersByTime(10000);

            expect(playedFrequencies()).toEqual([[220], [275], [330], [330], [275], [220]]);
            expect(psc._isPlayingScale).toBe(false);
            expect(iconOf(psc._playScaleButton)).toBe("header-icons/play-scale.svg");
        });

        test("does nothing with no stairs", () => {
            psc.Stairs = [];
            psc._makeStairs();

            expect(() => psc.playUpAndDown()).not.toThrow();
            expect(synth.trigger).not.toHaveBeenCalled();
            expect(psc._isPlayingScale).toBe(false);
        });

        test("plays a single stair down and back up", () => {
            psc.Stairs = [["A", 3, 220, 1, 1, 220, 220]];
            psc._makeStairs();

            psc.playUpAndDown();
            jest.advanceTimersByTime(10000);

            expect(playedFrequencies()).toEqual([[220], [220]]);
        });

        test("_stopScale stops it before the next stair", () => {
            psc.playUpAndDown();
            jest.advanceTimersByTime(1000);
            psc._stopScale();
            jest.advanceTimersByTime(10000);

            expect(synth.trigger).toHaveBeenCalledTimes(2);
            expect(synth.stopSound).toHaveBeenCalledWith(0, "electronic synth");
            expect(psc._isPlayingScale).toBe(false);
            [0, 1, 2].forEach(i => expect(stepCellOf(i).classList.contains("active")).toBe(false));
        });

        test("stops when the widget closes", () => {
            psc.playUpAndDown();
            psc.closed = true;
            jest.advanceTimersByTime(10000);

            expect(synth.trigger).toHaveBeenCalledTimes(1);
        });
    });
});
