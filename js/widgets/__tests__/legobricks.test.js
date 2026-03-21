/**
 * MusicBlocks v3.6.2
 *
 * @author Dhyani Kavya
 *
 * @copyright 2026 Dhyani Kavya
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

/**
 * Minimal unit tests for LegoWidget.
 *
 * Covers three pure-logic methods that require no DOM or browser APIs:
 *   - _calculateFallbackFrequency(pitchName, octave)
 *   - addRowBlock(rowBlock)
 *   - clearBlocks()
 */

// ---------------------------------------------------------------------------
// Minimal stubs required so legobricks.js evaluates without throwing
// ---------------------------------------------------------------------------
global._ = msg => msg;
global.platformColor = {};
global.docById = jest.fn();
global.noteToFrequency = jest.fn(() => 440);
global.piemenuVoices = jest.fn();

global.window = {
    widgetWindows: {
        windowFor: jest.fn().mockReturnValue({
            clear: jest.fn(),
            show: jest.fn(),
            addButton: jest.fn().mockReturnValue({ onclick: null, innerHTML: "", style: {} }),
            getWidgetBody: jest.fn().mockReturnValue({ appendChild: jest.fn(), style: {} }),
            sendToCenter: jest.fn(),
            destroy: jest.fn(),
            onclose: null,
            onmaximize: null
        })
    }
};

global.document = {
    createElement: jest.fn(() => ({
        style: {},
        innerHTML: "",
        appendChild: jest.fn(),
        setAttribute: jest.fn(),
        addEventListener: jest.fn(),
        insertRow: jest.fn(() => ({
            insertCell: jest.fn(() => ({ style: {}, appendChild: jest.fn(), innerHTML: "" })),
            style: {},
            appendChild: jest.fn()
        }))
    })),
    createTextNode: jest.fn(t => t),
    body: { appendChild: jest.fn() }
};

const LegoWidget = require("../legobricks.js");

// ---------------------------------------------------------------------------

describe("LegoWidget", () => {
    let widget;

    beforeEach(() => {
        widget = new LegoWidget();
    });

    // -----------------------------------------------------------------------
    // _calculateFallbackFrequency
    // -----------------------------------------------------------------------
    describe("_calculateFallbackFrequency(pitchName, octave)", () => {
        // Convenience alias to keep assertions concise
        const freq = (pitch, octave) =>
            // widget is re-created in beforeEach; we call via a wrapper so it
            // stays bound to the current instance inside each test.
            // The real call is delegated inside each test using `widget`.
            null;

        // Helper used inside tests to keep lines short
        function f(pitch, octave) {
            return widget._calculateFallbackFrequency(pitch, octave);
        }

        // --- Reference pitches ---
        test("returns approximately 440 Hz for A4 (concert pitch reference)", () => {
            expect(f("A", 4)).toBeCloseTo(440, 1);
        });

        test("returns approximately 261.63 Hz for C4 (middle C)", () => {
            expect(f("C", 4)).toBeCloseTo(261.63, 1);
        });

        // --- Solfege ↔ letter equivalence ---
        test("solfege 'la' in octave 4 equals letter 'A' in octave 4", () => {
            expect(f("la", 4)).toBeCloseTo(f("A", 4), 5);
        });

        test("solfege 'do' in octave 4 equals letter 'C' in octave 4", () => {
            expect(f("do", 4)).toBeCloseTo(f("C", 4), 5);
        });

        test("solfege 're' in octave 4 equals letter 'D' in octave 4", () => {
            expect(f("re", 4)).toBeCloseTo(f("D", 4), 5);
        });

        // --- Octave doubling rule ---
        test("frequency doubles when octave increases by one (A4 → A5)", () => {
            expect(f("A", 5)).toBeCloseTo(f("A", 4) * 2, 3);
        });

        test("frequency halves when octave decreases by one (A4 → A3)", () => {
            expect(f("A", 3)).toBeCloseTo(f("A", 4) / 2, 3);
        });

        // --- Edge octaves (valid range) ---
        test("returns a positive finite number for edge octave 0", () => {
            const result = f("A", 0);
            expect(typeof result).toBe("number");
            expect(isFinite(result)).toBe(true);
            expect(result).toBeGreaterThan(0);
        });

        test("returns a positive finite number for edge octave 8", () => {
            const result = f("A", 8);
            expect(typeof result).toBe("number");
            expect(isFinite(result)).toBe(true);
            expect(result).toBeGreaterThan(0);
        });

        test("octave 8 produces a higher frequency than octave 0 for the same pitch", () => {
            expect(f("C", 8)).toBeGreaterThan(f("C", 0));
        });

        // --- Negative / out-of-range octave (edge cases) ---
        test("returns a finite number for negative octave (-1) without throwing", () => {
            expect(() => f("A", -1)).not.toThrow();
            const result = f("A", -1);
            expect(typeof result).toBe("number");
            expect(isFinite(result)).toBe(true);
        });

        test("returns a finite number for very high octave (20) without throwing", () => {
            expect(() => f("A", 20)).not.toThrow();
            const result = f("A", 20);
            expect(typeof result).toBe("number");
            expect(isFinite(result)).toBe(true);
        });

        // --- Unknown / invalid pitch name ---
        test("unknown pitch name falls back to C-based frequency for the given octave", () => {
            expect(f("X", 4)).toBeCloseTo(f("C", 4), 5);
        });

        // --- All standard letter names return numbers ---
        test("all seven standard letter names return a number at octave 4", () => {
            ["C", "D", "E", "F", "G", "A", "B"].forEach(note => {
                const result = f(note, 4);
                expect(typeof result).toBe("number");
                expect(result).toBeGreaterThan(0);
            });
        });
    });

    // -----------------------------------------------------------------------
    // addRowBlock
    // -----------------------------------------------------------------------
    describe("addRowBlock(rowBlock)", () => {
        test("adds the block identifier to _rowBlocks", () => {
            widget.addRowBlock(42);
            expect(widget._rowBlocks).toContain(42);
        });

        test("appends one entry to _rowMap per call", () => {
            widget.addRowBlock(10);
            widget.addRowBlock(20);
            expect(widget._rowMap).toHaveLength(2);
        });

        test("appends one entry to _rowOffset per call", () => {
            widget.addRowBlock(10);
            widget.addRowBlock(20);
            expect(widget._rowOffset).toHaveLength(2);
        });

        test("initialises each _rowOffset entry to 0", () => {
            widget.addRowBlock(10);
            widget.addRowBlock(20);
            expect(widget._rowOffset[0]).toBe(0);
            expect(widget._rowOffset[1]).toBe(0);
        });

        test("_rowMap entry records the pre-insertion length of _rowBlocks", () => {
            widget.addRowBlock(100);
            expect(widget._rowMap[0]).toBe(0);
            widget.addRowBlock(200);
            expect(widget._rowMap[1]).toBe(1);
        });

        test("handles duplicate row blocks with offset logic: second insertion offset by 1 000 000", () => {
            widget.addRowBlock(5);
            widget.addRowBlock(5);
            expect(widget._rowBlocks[0]).toBe(5);
            expect(widget._rowBlocks[1]).toBe(5 + 1000000);
        });

        test("handles triple duplicate: each repeat adds another 1 000 000 offset", () => {
            widget.addRowBlock(7);
            widget.addRowBlock(7);
            widget.addRowBlock(7);
            expect(widget._rowBlocks[0]).toBe(7);
            expect(widget._rowBlocks[1]).toBe(7 + 1000000);
            expect(widget._rowBlocks[2]).toBe(7 + 2000000);
        });

        test("stores unique block identifiers without any offset", () => {
            widget.addRowBlock(1);
            widget.addRowBlock(2);
            widget.addRowBlock(3);
            expect(widget._rowBlocks).toEqual([1, 2, 3]);
        });
    });

    // -----------------------------------------------------------------------
    // clearBlocks
    // -----------------------------------------------------------------------
    describe("clearBlocks()", () => {
        // Shared setup: populate state before each clearBlocks test
        beforeEach(() => {
            widget.addRowBlock(10);
            widget.addRowBlock(20);
        });

        test("clears all internal state: _rowBlocks is reset to empty", () => {
            widget.clearBlocks();
            expect(widget._rowBlocks).toEqual([]);
        });

        test("clears all internal state: _rowMap is reset to empty", () => {
            widget.clearBlocks();
            expect(widget._rowMap).toEqual([]);
        });

        test("clears all internal state: _rowOffset is reset to empty", () => {
            widget.clearBlocks();
            expect(widget._rowOffset).toEqual([]);
        });

        test("calling clearBlocks on a fresh widget does not throw", () => {
            const fresh = new LegoWidget();
            expect(() => fresh.clearBlocks()).not.toThrow();
        });

        test("internal state can be re-populated after clearBlocks()", () => {
            widget.clearBlocks();
            widget.addRowBlock(42);
            expect(widget._rowBlocks).toEqual([42]);
            expect(widget._rowBlocks).toHaveLength(1);
        });
    });
});
