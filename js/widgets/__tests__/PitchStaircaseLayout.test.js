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

const PitchStaircaseLayout = global.PitchStaircaseLayout;
const METHODS = ["_addButton", "_setButtonIcon", "_makeStairs", "_refresh"];

describe("PitchStaircaseLayout", () => {
    let psc;

    beforeEach(() => {
        jest.useFakeTimers();
        psc = new PitchStaircase();
        psc._pscTable = document.createElement("table");
        psc._cellScale = 1;
        psc.activity = { logo: { synth: { trigger: jest.fn(), stopSound: jest.fn() } } };
        psc.Stairs = [
            ["E", 4, 330, 2, 3, 220, 220],
            ["A", 3, 220, 1, 1, 220, 220]
        ];
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const playCellOf = i => psc._stepTables[i].rows[0].cells[0];
    const stepCellOf = i => psc._stepTables[i].rows[0].cells[1];

    test("holds exactly the methods moved out of PitchStaircase", () => {
        const names = Object.getOwnPropertyNames(PitchStaircaseLayout.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on PitchStaircase.prototype", () => {
        expect(PitchStaircase.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(PitchStaircase.prototype[name]).toBe(PitchStaircaseLayout.prototype[name]);
            expect(Object.getOwnPropertyDescriptor(PitchStaircase.prototype, name).enumerable).toBe(
                false
            );
        }
    });

    test("_addButton adds a square button cell with the icon", () => {
        const row = document.createElement("table").insertRow();

        const cell = psc._addButton(row, "play-button.svg", 32, "Play");

        const img = cell.querySelector("img");
        expect(img.getAttribute("src")).toBe("header-icons/play-button.svg");
        expect(img.alt).toBe("Play");
        expect(cell.style.width).toBe(PitchStaircase.BUTTONSIZE + "px");
        expect(cell.classList.contains("pitch-staircase-btn")).toBe(true);
    });

    test("_setButtonIcon swaps the icon and ignores a missing button", () => {
        const row = document.createElement("table").insertRow();
        const cell = psc._addButton(row, "play-button.svg", 32, "Play");

        psc._setButtonIcon(cell, "stop-button.svg", "Stop");
        expect(cell.querySelector("img").getAttribute("src")).toBe("header-icons/stop-button.svg");
        expect(cell.querySelectorAll("img")).toHaveLength(1);

        expect(() => psc._setButtonIcon(null, "stop-button.svg", "Stop")).not.toThrow();
    });

    test("_makeStairs builds one row per stair with its frequency and note", () => {
        psc._makeStairs();

        expect(psc._pscTable.rows).toHaveLength(2);
        expect(stepCellOf(0).textContent).toBe("330.00E4");
        expect(stepCellOf(1).textContent).toBe("220.00A3");
        expect(stepCellOf(0).getAttribute("id")).toBe("330");
        expect(playCellOf(1).getAttribute("id")).toBe("1");
    });

    test("_makeStairs draws higher stairs narrower", () => {
        psc._makeStairs();

        const width = i => parseFloat(stepCellOf(i).style.width);
        expect(width(0)).toBeLessThan(width(1));
    });

    test("_makeStairs replaces the old rows when rebuilt", () => {
        psc._makeStairs();
        psc.Stairs.pop();
        psc._refresh();

        expect(psc._pscTable.rows).toHaveLength(1);
    });

    test("clicking a stair makes a new step from it", () => {
        psc._dissectStair = jest.fn();
        psc._makeStairs();

        stepCellOf(1).click();

        expect(psc._dissectStair).toHaveBeenCalledTimes(1);
        expect(psc._dissectStair.mock.calls[0][0].target).toBe(stepCellOf(1));
    });

    test("a play button plays its stair, and stops it when pressed again", () => {
        psc._makeStairs();

        playCellOf(1).onclick();
        expect(psc.activity.logo.synth.trigger).toHaveBeenCalledWith(
            0,
            220,
            1,
            "electronic synth",
            null,
            null
        );
        expect(psc._playingRowIndex).toBe(1);

        playCellOf(1).onclick();
        expect(psc.activity.logo.synth.stopSound).toHaveBeenCalledWith(0, "electronic synth", 220);
        expect(psc._playingRowIndex).toBeNull();
        expect(stepCellOf(1).classList.contains("active")).toBe(false);
    });
});
