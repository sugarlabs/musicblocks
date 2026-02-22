/**
 * MusicBlocks v3.6.2
 *
 * @author Music Blocks Contributors
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

const Arpeggio = require("../arpeggio.js");

// --- Global Mocks ---
global._ = msg => msg;
global.platformColor = {
    labelColor: "#90c100",
    selectorBackground: "#f0f0f0",
    selectorBackgroundHOVER: "#e0e0e0"
};
global.docById = jest.fn(() => ({
    style: {},
    innerHTML: "",
    insertRow: jest.fn(() => ({
        insertCell: jest.fn(() => ({
            style: {},
            innerHTML: "",
            setAttribute: jest.fn(),
            addEventListener: jest.fn()
        })),
        setAttribute: jest.fn(),
        style: {}
    })),
    appendChild: jest.fn(),
    setAttribute: jest.fn()
}));
global.getNote = jest.fn(() => ["C", "", 4]);
global.setCustomChord = jest.fn();
global.keySignatureToMode = jest.fn(() => ["C", "major"]);
global.getModeNumbers = jest.fn(() => "0 2 4 5 7 9 11");
global.getTemperament = jest.fn(() => ({ pitchNumber: 12 }));

global.window = {
    innerWidth: 1200,
    widgetWindows: {
        windowFor: jest.fn().mockReturnValue({
            clear: jest.fn(),
            show: jest.fn(),
            addButton: jest.fn().mockReturnValue({ onclick: null }),
            getWidgetBody: jest.fn().mockReturnValue({
                append: jest.fn(),
                appendChild: jest.fn(),
                style: {}
            }),
            sendToCenter: jest.fn(),
            onclose: null,
            onmaximize: null,
            destroy: jest.fn()
        })
    }
};

global.document = {
    createElement: jest.fn(() => ({
        style: {},
        innerHTML: "",
        appendChild: jest.fn(),
        append: jest.fn(),
        setAttribute: jest.fn(),
        addEventListener: jest.fn()
    }))
};

describe("Arpeggio Widget", () => {
    let arpeggio;

    beforeEach(() => {
        arpeggio = new Arpeggio();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // --- Constructor Tests ---
    describe("constructor", () => {
        test("should initialize with empty notesToPlay", () => {
            expect(arpeggio.notesToPlay).toEqual([]);
        });

        test("should initialize with empty _blockMap", () => {
            expect(arpeggio._blockMap).toEqual([]);
        });

        test("should initialize defaultCols to DEFAULTCOLS", () => {
            expect(arpeggio.defaultCols).toBe(Arpeggio.DEFAULTCOLS);
            expect(arpeggio.defaultCols).toBe(4);
        });
    });

    // --- Static Constants Tests ---
    describe("static constants", () => {
        test("should have correct BUTTONDIVWIDTH", () => {
            expect(Arpeggio.BUTTONDIVWIDTH).toBe(295);
        });

        test("should have correct CELLSIZE", () => {
            expect(Arpeggio.CELLSIZE).toBe(28);
        });

        test("should have correct BUTTONSIZE", () => {
            expect(Arpeggio.BUTTONSIZE).toBe(53);
        });

        test("should have correct ICONSIZE", () => {
            expect(Arpeggio.ICONSIZE).toBe(32);
        });

        test("should have correct DEFAULTCOLS", () => {
            expect(Arpeggio.DEFAULTCOLS).toBe(4);
        });
    });

    // --- Data Management Tests ---
    describe("data management", () => {
        test("should store notes to play", () => {
            arpeggio.notesToPlay.push(["C", 4]);
            arpeggio.notesToPlay.push(["E", 4]);
            arpeggio.notesToPlay.push(["G", 4]);
            expect(arpeggio.notesToPlay).toHaveLength(3);
        });

        test("should store block map pairs", () => {
            arpeggio._blockMap.push([0, 1]);
            arpeggio._blockMap.push([3, 2]);
            expect(arpeggio._blockMap).toHaveLength(2);
            expect(arpeggio._blockMap[0]).toEqual([0, 1]);
        });

        test("should allow clearing block map", () => {
            arpeggio._blockMap.push([0, 1]);
            arpeggio._blockMap = [];
            expect(arpeggio._blockMap).toHaveLength(0);
        });

        test("should allow updating defaultCols", () => {
            arpeggio.defaultCols = 8;
            expect(arpeggio.defaultCols).toBe(8);
        });
    });

    // --- Notes To Play Tests ---
    describe("notesToPlay", () => {
        test("should handle empty notesToPlay", () => {
            expect(arpeggio.notesToPlay).toEqual([]);
            expect(arpeggio.notesToPlay.length).toBe(0);
        });

        test("should allow complex note entries", () => {
            arpeggio.notesToPlay.push(["sol", 4, "electronic synth"]);
            expect(arpeggio.notesToPlay[0]).toEqual(["sol", 4, "electronic synth"]);
        });
    });
});
