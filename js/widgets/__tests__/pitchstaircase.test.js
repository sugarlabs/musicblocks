/**
 * MusicBlocks v3.6.2
 *
 * @author Lakshay
 *
 * @copyright 2026 Lakshay
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

const PitchStaircase = require("../pitchstaircase.js");

// --- Global Mocks ---
global._ = msg => msg;
global.platformColor = {
    labelColor: "#90c100",
    selectorBackground: "#f0f0f0",
    selectorBackgroundHOVER: "#e0e0e0"
};
global.SYNTHSVG = "<svg>SVGWIDTH XSCALE STOKEWIDTH</svg>";
global.DEFAULTVOICE = "electronic synth";
global.frequencyToPitch = jest.fn(f => ["A", "", 4]);
global.base64Encode = jest.fn(s => s);

global.window = {
    innerWidth: 1200,
    btoa: jest.fn(s => s),
    widgetWindows: {
        windowFor: jest.fn().mockReturnValue({
            clear: jest.fn(),
            show: jest.fn(),
            addButton: jest.fn().mockReturnValue({ onclick: null }),
            addInputButton: jest.fn().mockReturnValue({
                value: "3",
                addEventListener: jest.fn()
            }),
            getWidgetBody: jest.fn().mockReturnValue({
                appendChild: jest.fn(),
                append: jest.fn(),
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
        addEventListener: jest.fn(),
        insertRow: jest.fn(() => ({
            insertCell: jest.fn(() => ({
                style: {},
                innerHTML: "",
                appendChild: jest.fn(),
                setAttribute: jest.fn(),
                addEventListener: jest.fn(),
                className: ""
            }))
        }))
    }))
};

describe("PitchStaircase Widget", () => {
    let psc;

    beforeEach(() => {
        psc = new PitchStaircase();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // --- Constructor Tests ---
    describe("constructor", () => {
        test("should initialize with empty Stairs", () => {
            expect(psc.Stairs).toEqual([]);
        });

        test("should initialize with empty stairPitchBlocks", () => {
            expect(psc.stairPitchBlocks).toEqual([]);
        });

        test("should initialize with empty _stepTables", () => {
            expect(psc._stepTables).toEqual([]);
        });

        test("should initialize _musicRatio1 as null", () => {
            expect(psc._musicRatio1).toBeNull();
        });

        test("should initialize _musicRatio2 as null", () => {
            expect(psc._musicRatio2).toBeNull();
        });
    });

    // --- Static Constants Tests ---
    describe("static constants", () => {
        test("should have correct BUTTONDIVWIDTH", () => {
            expect(PitchStaircase.BUTTONDIVWIDTH).toBe(476);
        });

        test("should have correct OUTERWINDOWWIDTH", () => {
            expect(PitchStaircase.OUTERWINDOWWIDTH).toBe(685);
        });

        test("should have correct INNERWINDOWWIDTH", () => {
            expect(PitchStaircase.INNERWINDOWWIDTH).toBe(600);
        });

        test("should have correct BUTTONSIZE", () => {
            expect(PitchStaircase.BUTTONSIZE).toBe(53);
        });

        test("should have correct ICONSIZE", () => {
            expect(PitchStaircase.ICONSIZE).toBe(32);
        });

        test("should have correct DEFAULTFREQUENCY", () => {
            expect(PitchStaircase.DEFAULTFREQUENCY).toBe(220.0);
        });
    });

    // --- Stairs Data Tests ---
    describe("stairs data management", () => {
        test("should allow adding stairs", () => {
            psc.Stairs.push(["A", "", 220.0]);
            psc.Stairs.push(["B", "", 246.94]);
            psc.Stairs.push(["C", "", 261.63]);
            expect(psc.Stairs).toHaveLength(3);
        });

        test("should allow accessing stair properties", () => {
            psc.Stairs.push(["A", "", 220.0]);
            expect(psc.Stairs[0][0]).toBe("A");
            expect(psc.Stairs[0][1]).toBe("");
            expect(psc.Stairs[0][2]).toBe(220.0);
        });

        test("should allow removing stairs", () => {
            psc.Stairs.push(["A", "", 220.0]);
            psc.Stairs.push(["B", "", 246.94]);
            psc.Stairs.splice(0, 1);
            expect(psc.Stairs).toHaveLength(1);
            expect(psc.Stairs[0][0]).toBe("B");
        });

        test("should track stairPitchBlocks", () => {
            psc.stairPitchBlocks.push(10);
            psc.stairPitchBlocks.push(20);
            expect(psc.stairPitchBlocks).toEqual([10, 20]);
        });

        test("should allow clearing stairs", () => {
            psc.Stairs.push(["A", "", 220.0]);
            psc.Stairs = [];
            expect(psc.Stairs).toHaveLength(0);
        });
    });

    // --- Frequency Tests ---
    describe("frequency handling", () => {
        test("should store frequencies in stairs", () => {
            psc.Stairs.push(["A", "", 220.0]);
            psc.Stairs.push(["A", "", 440.0]);
            expect(psc.Stairs[0][2]).toBe(220.0);
            expect(psc.Stairs[1][2]).toBe(440.0);
        });

        test("should maintain frequency order when sorted", () => {
            psc.Stairs.push(["C", "", 261.63]);
            psc.Stairs.push(["A", "", 220.0]);
            psc.Stairs.sort((a, b) => a[2] - b[2]);
            expect(psc.Stairs[0][2]).toBe(220.0);
            expect(psc.Stairs[1][2]).toBe(261.63);
        });
    });
});
