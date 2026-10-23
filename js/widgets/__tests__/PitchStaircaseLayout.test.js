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
const METHODS = [
    "_addButton",
    "_setButtonIcon",
    "_makeStairs",
    "_refresh",
    "_findFraction",
    "_gcd",
    "_lcm",
    "_calculateCycles",
    "_generateWaveSVG"
];

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

    test("_makeStairs draws all stairs with equal total width", () => {
        psc._makeStairs();

        const width = i => parseFloat(stepCellOf(i).style.width);
        expect(width(0)).toBe(width(1));
        expect(width(0)).toBe(PitchStaircase.INNERWINDOWWIDTH);
    });

    test("_calculateCycles correctly determines integer cycle ratios", () => {
        // 3:2 ratio: 330 Hz and 220 Hz
        psc.Stairs = [
            ["E", 4, 330],
            ["A", 3, 220]
        ];
        expect(psc._calculateCycles(220)).toBe(2);
        expect(psc._calculateCycles(330)).toBe(3);

        // Single stair defaults to 2 cycles
        psc.Stairs = [["A", 3, 220]];
        expect(psc._calculateCycles(220)).toBe(2);

        // 4:3 ratio: 320 Hz and 240 Hz
        psc.Stairs = [
            ["F", 4, 320],
            ["C", 4, 240]
        ];
        expect(psc._calculateCycles(240)).toBe(3);
        expect(psc._calculateCycles(320)).toBe(4);

        // Octave ratio: 440 Hz and 220 Hz (2:1 ratio)
        psc.Stairs = [
            ["A", 4, 440],
            ["A", 3, 220]
        ];
        expect(psc._calculateCycles(220)).toBe(2);
        expect(psc._calculateCycles(440)).toBe(4);

        // Multi-frequency stairs (3 frequencies): 180, 240, 300 Hz derive shared baseline (3, 4, 5 cycles)
        psc.Stairs = [
            ["F", 3, 180],
            ["B", 3, 240],
            ["D", 4, 300]
        ];
        expect(psc._calculateCycles(180)).toBe(3);
        expect(psc._calculateCycles(240)).toBe(4);
        expect(psc._calculateCycles(300)).toBe(5);

        // Multi-frequency stairs (4 frequencies): 200, 300, 400, 500 Hz (2, 3, 4, 5 cycles)
        psc.Stairs = [
            ["G", 3, 200],
            ["D", 4, 300],
            ["G", 4, 400],
            ["B", 4, 500]
        ];
        expect(psc._calculateCycles(200)).toBe(2);
        expect(psc._calculateCycles(300)).toBe(3);
        expect(psc._calculateCycles(400)).toBe(4);
        expect(psc._calculateCycles(500)).toBe(5);

        // Wide frequency ratio fitting within 16 cycles: 220 and 3520 Hz (16:1 ratio preserved)
        psc.Stairs = [
            ["A", 3, 220],
            ["A", 7, 3520]
        ];
        expect(psc._calculateCycles(220)).toBe(1);
        expect(psc._calculateCycles(3520)).toBe(16);
        expect(psc._ratioExceedsLimit).toBe(false);

        // Extreme ratio exceeding 16: scales uniformly and sets flag
        psc.Stairs = [
            ["G", 2, 100],
            ["B", 6, 2000]
        ];
        expect(psc._calculateCycles(2000)).toBe(16);
        expect(psc._calculateCycles(100)).toBeCloseTo(0.8, 1);
        expect(psc._ratioExceedsLimit).toBe(true);

        // UI tooltip indicator when ratio exceeds 16
        psc._makeStairs();
        const wideStepCell = stepCellOf(0);
        expect(wideStepCell.title).toContain("Frequency ratio exceeds displayable range");

        // Invalid inputs handling in _calculateCycles
        expect(psc._calculateCycles(NaN)).toBeGreaterThan(0);
        expect(psc._calculateCycles(-440)).toBeGreaterThan(0);
        expect(psc._calculateCycles("invalid")).toBeGreaterThan(0);

        psc.Stairs = null;
        expect(psc._calculateCycles(220)).toBe(2);

        psc.Stairs = [];
        expect(psc._calculateCycles(220)).toBe(2);

        psc.Stairs = [
            ["A", 4, NaN],
            ["B", 4, -200],
            ["C", 4, "text"]
        ];
        expect(psc._calculateCycles(220)).toBe(2);
    });

    test("_generateWaveSVG creates svg with wave path and dashed partition lines", () => {
        const svg = psc._generateWaveSVG(600, 53, 3);
        expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
        expect(svg).toContain('width="600"');
        expect(svg).toContain('height="53"');
        expect(svg).toContain('<path d="M ');
        expect(svg).toContain('stroke-dasharray="6,4"');
        expect(svg).toContain('stroke="#e74c3c"');
        expect(svg).toContain('stroke="#90c100"');
    });

    test("_findFraction, _gcd, and _lcm calculate mathematical helpers correctly", () => {
        expect(psc._gcd(12, 18)).toBe(6);
        expect(psc._gcd(0, 0)).toBe(1);
        expect(psc._gcd(NaN, 10)).toBe(10);
        expect(psc._gcd(-6, 9)).toBe(3);

        expect(psc._lcm(4, 6)).toBe(12);
        expect(psc._lcm(0, 5)).toBe(0);
        expect(psc._lcm(NaN, 5)).toBe(0);

        const frac32 = psc._findFraction(1.5);
        expect(frac32).toEqual({ num: 3, den: 2 });

        const frac43 = psc._findFraction(4 / 3);
        expect(frac43).toEqual({ num: 4, den: 3 });

        expect(psc._findFraction(-1)).toBeNull();
        expect(psc._findFraction(0)).toBeNull();
        expect(psc._findFraction(NaN)).toBeNull();
        expect(psc._findFraction(Infinity)).toBeNull();
        expect(psc._findFraction("text")).toBeNull();
        expect(psc._findFraction(null)).toBeNull();
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

    test("rebuilding the table stops the stair that is playing", () => {
        psc._makeStairs();
        playCellOf(1).onclick();

        psc._refresh();

        expect(psc.activity.logo.synth.stopSound).toHaveBeenCalledWith(0, "electronic synth", 220);
        expect(psc._playingRowIndex).toBeNull();
        // The new play button plays on its first click.
        playCellOf(1).onclick();
        expect(psc.activity.logo.synth.trigger).toHaveBeenCalledTimes(2);
        expect(psc._playingRowIndex).toBe(1);
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
