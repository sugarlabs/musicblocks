/**
 * @license
 * MusicBlocks v3.8.0
 * Copyright (C) 2026 Walter Bender
 *
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

const { parseSclFile, parseModeJson, EDO_MIN, EDO_MAX } = require("../tuningformats");

describe("parseSclFile", () => {
    it("parses a .scl file with mixed ratios and cents", () => {
        const content = [
            "! meanquar.scl",
            "!",
            "1/4-comma meantone scale",
            "3",
            "76.04900",
            "5/4",
            "2/1"
        ].join("\n");

        const result = parseSclFile(content);
        expect(result.description).toBe("1/4-comma meantone scale");
        expect(result.pitchCount).toBe(3);
        expect(result.pitches[0].cents).toBeCloseTo(76.049, 1);
        expect(result.pitches[1].ratio).toBeCloseTo(1.25, 4);
    });

    it("throws on empty content", () => {
        expect(() => parseSclFile("")).toThrow();
    });

    it("parses .scl with integer ratios", () => {
        const content = ["! test.scl", "!", "Test", "3", "3/2", "5/4", "2/1"].join("\n");
        const result = parseSclFile(content);
        expect(result.pitchCount).toBe(3);
        expect(result.pitches[0].ratio).toBeCloseTo(1.5, 4);
        expect(result.pitches[1].ratio).toBeCloseTo(1.25, 4);
    });

    it("parses .scl with cents values (decimals)", () => {
        const content = ["! cents.scl", "!", "Cents test", "2", "100.00", "200.00"].join("\n");
        const result = parseSclFile(content);
        expect(result.pitchCount).toBe(2);
        expect(result.pitches[0].cents).toBeCloseTo(100, 1);
        expect(result.pitches[1].cents).toBeCloseTo(200, 1);
    });

    it("rejects pitch count > 500", () => {
        const content = ["! big.scl", "!", "Big", "501", "100"].join("\n");
        expect(() => parseSclFile(content)).toThrow("invalid pitch count");
    });

    it("rejects non-numeric pitch count", () => {
        const content = ["! bad.scl", "!", "Bad", "abc"].join("\n");
        expect(() => parseSclFile(content)).toThrow("invalid pitch count");
    });

    it("treats a bare integer pitch as a ratio per the Scala spec", () => {
        const content = ["! oct.scl", "!", "Octave", "1", "2"].join("\n");
        const result = parseSclFile(content);
        expect(result.pitchCount).toBe(1);
        expect(result.pitches[0].ratio).toBeCloseTo(2, 10);
        expect(result.pitches[0].cents).toBeCloseTo(1200, 6);
    });
});

describe("parseModeJson", () => {
    it("round-trips exactly", () => {
        const pattern = [2, 2, 1, 2, 2, 2, 1];
        const json = JSON.stringify({ name: "major", edo: 12, pattern }, null, 2);
        const def = parseModeJson(json);
        expect(def).toEqual({ name: "major", edo: 12, pattern });
    });

    it("defaults name to empty string when missing", () => {
        const json = JSON.stringify({ edo: 12, pattern: [2, 2, 1, 2, 2, 2, 1] });
        const def = parseModeJson(json);
        expect(def.name).toBe("");
    });

    it("strict-rejects bad structure", () => {
        expect(() => parseModeJson("not json")).toThrow("Invalid JSON");
        expect(() =>
            parseModeJson(JSON.stringify({ name: "bad", edo: 12, pattern: [2, 2, 1] }, null, 2))
        ).toThrow("does not sum to edo");
        expect(() =>
            parseModeJson(JSON.stringify({ name: "bad", edo: 4, pattern: [2, 2] }, null, 2))
        ).toThrow("invalid edo");
        expect(() =>
            parseModeJson(JSON.stringify({ name: "bad", edo: 12, pattern: [2, 0, 10] }, null, 2))
        ).toThrow("invalid pattern");
    });

    it("rejects negative step values", () => {
        const json = JSON.stringify({ edo: 12, pattern: [-1, 13] });
        expect(() => parseModeJson(json)).toThrow("invalid pattern");
    });

    it("rejects array as root", () => {
        expect(() => parseModeJson(JSON.stringify([1, 2, 3]))).toThrow("expected an object");
    });
});
