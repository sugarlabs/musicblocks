/**
 * MusicBlocks
 *
 * @author kh-ub-ayb
 *
 * @copyright 2026 kh-ub-ayb
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

// Set up globals required by PhraseMakerUI
global.EIGHTHNOTEWIDTH = 24;
global.MATRIXSOLFEHEIGHT = 30;
global.MATRIXSOLFEWIDTH = 60;

const PhraseMakerUI = require("../PhraseMakerUI.js");

/**
 * Creates a fresh mock PhraseMaker instance for testing.
 * @returns {Object} A mock PhraseMaker with all required UI fields.
 */
function createMockPM() {
    return {
        platformColor: {
            selectorBackground: "#8bc34a",
            rhythmcellcolor: "#ffffff",
            tupletBackground: "#e0e0e0"
        },
        _cellScale: 1,
        _rows: [],
        _noteValueRow: { cells: [] },
        _tupletNoteValueRow: { cells: [] },
        _matrixHasTuplets: false,
        _playButton: null,
        _: str => str,
        constructor: { ICONSIZE: 32 }
    };
}

/**
 * Creates a mock cell element with style.
 * @returns {Object} A mock cell.
 */
function createMockCell(bgColor) {
    return {
        style: { backgroundColor: bgColor || "" },
        innerHTML: ""
    };
}

describe("PhraseMakerUI", () => {
    describe("Module Export", () => {
        test("exports PhraseMakerUI object", () => {
            expect(PhraseMakerUI).toBeDefined();
            expect(typeof PhraseMakerUI).toBe("object");
        });

        test("has calculateNoteWidth method", () => {
            expect(typeof PhraseMakerUI.calculateNoteWidth).toBe("function");
        });

        test("has highlightCell method", () => {
            expect(typeof PhraseMakerUI.highlightCell).toBe("function");
        });

        test("has unhighlightCell method", () => {
            expect(typeof PhraseMakerUI.unhighlightCell).toBe("function");
        });

        test("has updateNoteCellVisual method", () => {
            expect(typeof PhraseMakerUI.updateNoteCellVisual).toBe("function");
        });

        test("has updatePlayButton method", () => {
            expect(typeof PhraseMakerUI.updatePlayButton).toBe("function");
        });

        test("has resetMatrix method", () => {
            expect(typeof PhraseMakerUI.resetMatrix).toBe("function");
        });

        test("has stylePhraseMaker method", () => {
            expect(typeof PhraseMakerUI.stylePhraseMaker).toBe("function");
        });
    });

    describe("calculateNoteWidth", () => {
        test("returns correct width for eighth note (noteValue=8)", () => {
            const pm = createMockPM();
            // EIGHTHNOTEWIDTH * (8/8) * 1 = 24 * 1 * 1 = 24
            const result = PhraseMakerUI.calculateNoteWidth(pm, 8);

            expect(result).toBe(24);
        });

        test("returns correct width for quarter note (noteValue=4)", () => {
            const pm = createMockPM();
            // EIGHTHNOTEWIDTH * (8/4) * 1 = 24 * 2 * 1 = 48
            const result = PhraseMakerUI.calculateNoteWidth(pm, 4);

            expect(result).toBe(48);
        });

        test("returns correct width for whole note (noteValue=1)", () => {
            const pm = createMockPM();
            // EIGHTHNOTEWIDTH * (8/1) * 1 = 24 * 8 * 1 = 192
            const result = PhraseMakerUI.calculateNoteWidth(pm, 1);

            expect(result).toBe(192);
        });

        test("returns correct width for half note (noteValue=2)", () => {
            const pm = createMockPM();
            // EIGHTHNOTEWIDTH * (8/2) * 1 = 24 * 4 * 1 = 96
            const result = PhraseMakerUI.calculateNoteWidth(pm, 2);

            expect(result).toBe(96);
        });

        test("returns correct width for sixteenth note (noteValue=16)", () => {
            const pm = createMockPM();
            // EIGHTHNOTEWIDTH * (8/16) * 1 = 24 * 0.5 * 1 = floor(12) = 12
            // But Math.max(12, 15) = 15
            const result = PhraseMakerUI.calculateNoteWidth(pm, 16);

            expect(result).toBe(15);
        });

        test("returns minimum width of 15 for very small note values", () => {
            const pm = createMockPM();
            // EIGHTHNOTEWIDTH * (8/64) * 1 = 24 * 0.125 * 1 = floor(3) = 3
            // Math.max(3, 15) = 15
            const result = PhraseMakerUI.calculateNoteWidth(pm, 64);

            expect(result).toBe(15);
        });

        test("applies _cellScale multiplier", () => {
            const pm = createMockPM();
            pm._cellScale = 2;
            // EIGHTHNOTEWIDTH * (8/8) * 2 = 24 * 1 * 2 = 48
            const result = PhraseMakerUI.calculateNoteWidth(pm, 8);

            expect(result).toBe(48);
        });

        test("floors the result to integer", () => {
            const pm = createMockPM();
            // EIGHTHNOTEWIDTH * (8/3) * 1 = 24 * 2.666... = 64 (floor) = 64
            const result = PhraseMakerUI.calculateNoteWidth(pm, 3);

            expect(result).toBe(Math.floor(24 * (8 / 3) * 1));
            expect(Number.isInteger(result)).toBe(true);
        });

        test("returns at least 15 even with very small cellScale", () => {
            const pm = createMockPM();
            pm._cellScale = 0.01;
            // Very small result floored, but max with 15
            const result = PhraseMakerUI.calculateNoteWidth(pm, 8);

            expect(result).toBe(15);
        });

        test("handles fractional noteValue", () => {
            const pm = createMockPM();
            // EIGHTHNOTEWIDTH * (8/1.5) * 1 = 24 * 5.333 = floor(128) = 128
            const result = PhraseMakerUI.calculateNoteWidth(pm, 1.5);

            expect(result).toBe(Math.max(Math.floor(24 * (8 / 1.5) * 1), 15));
        });
    });

    describe("highlightCell", () => {
        test("sets cell background to selectorBackground", () => {
            const pm = createMockPM();
            const cell = createMockCell();
            pm._rows = [{ cells: [cell] }];

            PhraseMakerUI.highlightCell(pm, 0, 0);

            expect(cell.style.backgroundColor).toBe("#8bc34a");
        });

        test("does nothing when row does not exist", () => {
            const pm = createMockPM();
            pm._rows = [];

            // Should not throw
            expect(() => PhraseMakerUI.highlightCell(pm, 0, 5)).not.toThrow();
        });

        test("does nothing when cell does not exist at colIndex", () => {
            const pm = createMockPM();
            pm._rows = [{ cells: [] }];

            // Should not throw since cells[99] is undefined
            expect(() => PhraseMakerUI.highlightCell(pm, 99, 0)).not.toThrow();
        });

        test("highlights correct cell in multi-cell row", () => {
            const pm = createMockPM();
            const cell0 = createMockCell();
            const cell1 = createMockCell();
            const cell2 = createMockCell();
            pm._rows = [{ cells: [cell0, cell1, cell2] }];

            PhraseMakerUI.highlightCell(pm, 1, 0);

            expect(cell0.style.backgroundColor).toBe("");
            expect(cell1.style.backgroundColor).toBe("#8bc34a");
            expect(cell2.style.backgroundColor).toBe("");
        });

        test("highlights correct row in multi-row matrix", () => {
            const pm = createMockPM();
            const cell0 = createMockCell();
            const cell1 = createMockCell();
            pm._rows = [{ cells: [cell0] }, { cells: [cell1] }];

            PhraseMakerUI.highlightCell(pm, 0, 1);

            expect(cell0.style.backgroundColor).toBe("");
            expect(cell1.style.backgroundColor).toBe("#8bc34a");
        });
    });

    describe("unhighlightCell", () => {
        test("resets highlighted cell to rhythmcellcolor", () => {
            const pm = createMockPM();
            const cell = createMockCell("#8bc34a");
            pm._rows = [{ cells: [cell] }];

            PhraseMakerUI.unhighlightCell(pm, 0, 0);

            expect(cell.style.backgroundColor).toBe("#ffffff");
        });

        test("does not change cell if not highlighted with selectorBackground", () => {
            const pm = createMockPM();
            const cell = createMockCell("#ff0000");
            pm._rows = [{ cells: [cell] }];

            PhraseMakerUI.unhighlightCell(pm, 0, 0);

            expect(cell.style.backgroundColor).toBe("#ff0000");
        });

        test("does nothing when row does not exist", () => {
            const pm = createMockPM();
            pm._rows = [];

            expect(() => PhraseMakerUI.unhighlightCell(pm, 0, 5)).not.toThrow();
        });

        test("does nothing when cell does not exist at colIndex", () => {
            const pm = createMockPM();
            pm._rows = [{ cells: [] }];

            expect(() => PhraseMakerUI.unhighlightCell(pm, 99, 0)).not.toThrow();
        });

        test("only unhighlights the targeted cell in multi-cell row", () => {
            const pm = createMockPM();
            const cell0 = createMockCell("#8bc34a");
            const cell1 = createMockCell("#8bc34a");
            pm._rows = [{ cells: [cell0, cell1] }];

            PhraseMakerUI.unhighlightCell(pm, 0, 0);

            expect(cell0.style.backgroundColor).toBe("#ffffff");
            expect(cell1.style.backgroundColor).toBe("#8bc34a");
        });
    });

    describe("updateNoteCellVisual", () => {
        test("sets active cell background to selectorBackground", () => {
            const pm = createMockPM();
            const cell = createMockCell();

            PhraseMakerUI.updateNoteCellVisual(pm, cell, true);

            expect(cell.style.backgroundColor).toBe("#8bc34a");
        });

        test("sets active cell innerHTML to checkmark", () => {
            const pm = createMockPM();
            const cell = createMockCell();

            PhraseMakerUI.updateNoteCellVisual(pm, cell, true);

            expect(cell.innerHTML).toBe("&#x2713;");
        });

        test("sets inactive cell background to rhythmcellcolor", () => {
            const pm = createMockPM();
            const cell = createMockCell("#8bc34a");

            PhraseMakerUI.updateNoteCellVisual(pm, cell, false);

            expect(cell.style.backgroundColor).toBe("#ffffff");
        });

        test("clears inactive cell innerHTML", () => {
            const pm = createMockPM();
            const cell = createMockCell();
            cell.innerHTML = "&#x2713;";

            PhraseMakerUI.updateNoteCellVisual(pm, cell, false);

            expect(cell.innerHTML).toBe("");
        });

        test("does nothing when cell is null", () => {
            const pm = createMockPM();

            expect(() => PhraseMakerUI.updateNoteCellVisual(pm, null, true)).not.toThrow();
        });

        test("does nothing when cell is undefined", () => {
            const pm = createMockPM();

            expect(() => PhraseMakerUI.updateNoteCellVisual(pm, undefined, false)).not.toThrow();
        });

        test("toggling active then inactive restores original state", () => {
            const pm = createMockPM();
            const cell = createMockCell("#ffffff");
            cell.innerHTML = "";

            PhraseMakerUI.updateNoteCellVisual(pm, cell, true);
            expect(cell.style.backgroundColor).toBe("#8bc34a");
            expect(cell.innerHTML).toBe("&#x2713;");

            PhraseMakerUI.updateNoteCellVisual(pm, cell, false);
            expect(cell.style.backgroundColor).toBe("#ffffff");
            expect(cell.innerHTML).toBe("");
        });
    });

    describe("updatePlayButton", () => {
        test("does nothing when _playButton is null", () => {
            const pm = createMockPM();
            pm._playButton = null;

            expect(() => PhraseMakerUI.updatePlayButton(pm, true)).not.toThrow();
        });

        test("does nothing when _playButton is undefined", () => {
            const pm = createMockPM();
            pm._playButton = undefined;

            expect(() => PhraseMakerUI.updatePlayButton(pm, false)).not.toThrow();
        });

        test("sets stop button when isPlaying is true", () => {
            const pm = createMockPM();
            pm._playButton = { innerHTML: "" };

            PhraseMakerUI.updatePlayButton(pm, true);

            expect(pm._playButton.innerHTML).toContain("stop-button.svg");
        });

        test("sets play button when isPlaying is false", () => {
            const pm = createMockPM();
            pm._playButton = { innerHTML: "" };

            PhraseMakerUI.updatePlayButton(pm, false);

            expect(pm._playButton.innerHTML).toContain("play-button.svg");
        });

        test("stop button contains Stop title", () => {
            const pm = createMockPM();
            pm._playButton = { innerHTML: "" };

            PhraseMakerUI.updatePlayButton(pm, true);

            expect(pm._playButton.innerHTML).toContain("Stop");
        });

        test("play button contains Play title", () => {
            const pm = createMockPM();
            pm._playButton = { innerHTML: "" };

            PhraseMakerUI.updatePlayButton(pm, false);

            expect(pm._playButton.innerHTML).toContain("Play");
        });

        test("button contains ICONSIZE dimensions", () => {
            const pm = createMockPM();
            pm._playButton = { innerHTML: "" };

            PhraseMakerUI.updatePlayButton(pm, true);

            expect(pm._playButton.innerHTML).toContain("32");
        });

        test("switching from playing to stopped changes button", () => {
            const pm = createMockPM();
            pm._playButton = { innerHTML: "" };

            PhraseMakerUI.updatePlayButton(pm, true);
            expect(pm._playButton.innerHTML).toContain("stop-button.svg");

            PhraseMakerUI.updatePlayButton(pm, false);
            expect(pm._playButton.innerHTML).toContain("play-button.svg");
        });
    });

    describe("resetMatrix", () => {
        test("resets all noteValueRow cells to rhythmcellcolor", () => {
            const pm = createMockPM();
            const cell0 = createMockCell("#8bc34a");
            const cell1 = createMockCell("#8bc34a");
            pm._noteValueRow = { cells: [cell0, cell1] };

            PhraseMakerUI.resetMatrix(pm);

            expect(cell0.style.backgroundColor).toBe("#ffffff");
            expect(cell1.style.backgroundColor).toBe("#ffffff");
        });

        test("does not touch tuplet row when _matrixHasTuplets is false", () => {
            const pm = createMockPM();
            pm._noteValueRow = { cells: [createMockCell()] };
            const tupletCell = createMockCell("#8bc34a");
            pm._tupletNoteValueRow = { cells: [tupletCell] };
            pm._matrixHasTuplets = false;

            PhraseMakerUI.resetMatrix(pm);

            expect(tupletCell.style.backgroundColor).toBe("#8bc34a");
        });

        test("resets tuplet row cells when _matrixHasTuplets is true", () => {
            const pm = createMockPM();
            pm._noteValueRow = { cells: [createMockCell()] };
            const tupletCell0 = createMockCell("#8bc34a");
            const tupletCell1 = createMockCell("#8bc34a");
            pm._tupletNoteValueRow = { cells: [tupletCell0, tupletCell1] };
            pm._matrixHasTuplets = true;

            PhraseMakerUI.resetMatrix(pm);

            expect(tupletCell0.style.backgroundColor).toBe("#e0e0e0");
            expect(tupletCell1.style.backgroundColor).toBe("#e0e0e0");
        });

        test("handles empty noteValueRow cells", () => {
            const pm = createMockPM();
            pm._noteValueRow = { cells: [] };

            expect(() => PhraseMakerUI.resetMatrix(pm)).not.toThrow();
        });

        test("handles empty tuplet row cells when tuplets active", () => {
            const pm = createMockPM();
            pm._noteValueRow = { cells: [] };
            pm._tupletNoteValueRow = { cells: [] };
            pm._matrixHasTuplets = true;

            expect(() => PhraseMakerUI.resetMatrix(pm)).not.toThrow();
        });

        test("uses different colors for note row vs tuplet row", () => {
            const pm = createMockPM();
            const noteCell = createMockCell("#8bc34a");
            const tupletCell = createMockCell("#8bc34a");
            pm._noteValueRow = { cells: [noteCell] };
            pm._tupletNoteValueRow = { cells: [tupletCell] };
            pm._matrixHasTuplets = true;

            PhraseMakerUI.resetMatrix(pm);

            expect(noteCell.style.backgroundColor).toBe("#ffffff");
            expect(tupletCell.style.backgroundColor).toBe("#e0e0e0");
        });
    });
});
