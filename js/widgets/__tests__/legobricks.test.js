/**
 * MusicBlocks v3.6.2
 *
 * @author Aneesh Sambu
 *
 * @copyright 2026 Aneesh Sambu
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

global._ = str => str;
const LegoWidget = require("../legobricks");

describe("LegoWidget core logic", () => {
    let widget;

    beforeEach(() => {
        widget = new LegoWidget();
    });

    describe("_calculateFallbackFrequency", () => {
        test("returns the expected concert pitch for A4 using letter names and solfege", () => {
            expect(widget._calculateFallbackFrequency("A", 4)).toBeCloseTo(440, 1);
            expect(widget._calculateFallbackFrequency("la", 4)).toBeCloseTo(440, 1);
        });

        test("scales frequencies by octave", () => {
            expect(widget._calculateFallbackFrequency("C", 4)).toBeCloseTo(261.63, 2);
            expect(widget._calculateFallbackFrequency("C", 5)).toBeCloseTo(523.26, 2);
            expect(widget._calculateFallbackFrequency("C", 3)).toBeCloseTo(130.815, 2);
        });

        test("falls back to middle C when the pitch name is unknown", () => {
            expect(widget._calculateFallbackFrequency("unknown", 4)).toBeCloseTo(261.63, 2);
        });
    });

    describe("addRowBlock", () => {
        test("stores a new row block and initializes row bookkeeping", () => {
            widget.addRowBlock(7);

            expect(widget._rowBlocks).toEqual([7]);
            expect(widget._rowMap).toEqual([0]);
            expect(widget._rowOffset).toEqual([0]);
        });

        test("creates unique row block ids for duplicates while preserving mapping order", () => {
            widget.addRowBlock(7);
            widget.addRowBlock(7);
            widget.addRowBlock(7);

            expect(widget._rowBlocks).toEqual([7, 1000007, 2000007]);
            expect(widget._rowMap).toEqual([0, 1, 2]);
            expect(widget._rowOffset).toEqual([0, 0, 0]);
        });
    });

    describe("clearBlocks", () => {
        test("resets all row tracking arrays", () => {
            widget.addRowBlock(7);
            widget.addRowBlock(9);

            widget.clearBlocks();

            expect(widget._rowBlocks).toEqual([]);
            expect(widget._rowMap).toEqual([]);
            expect(widget._rowOffset).toEqual([]);
        });
    });
});
