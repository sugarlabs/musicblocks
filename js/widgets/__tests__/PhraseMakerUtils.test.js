/**
 * MusicBlocks v3.6.2
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

const PhraseMakerUtils = require("../PhraseMakerUtils.js");

// Helper: mimics the `last` utility used in musicblocks (returns the last element of an array)
const last = arr => arr[arr.length - 1];

describe("PhraseMakerUtils", () => {
    describe("Module Export", () => {
        test("exports PhraseMakerUtils object", () => {
            expect(PhraseMakerUtils).toBeDefined();
            expect(typeof PhraseMakerUtils).toBe("object");
        });

        test("has generateDataURI method", () => {
            expect(PhraseMakerUtils.generateDataURI).toBeDefined();
            expect(typeof PhraseMakerUtils.generateDataURI).toBe("function");
        });

        test("has recalculateBlocks method", () => {
            expect(PhraseMakerUtils.recalculateBlocks).toBeDefined();
            expect(typeof PhraseMakerUtils.recalculateBlocks).toBe("function");
        });
    });

    describe("Constants", () => {
        describe("MATRIXGRAPHICS", () => {
            test("is an array", () => {
                expect(Array.isArray(PhraseMakerUtils.MATRIXGRAPHICS)).toBe(true);
            });

            test("contains expected graphics commands", () => {
                const expected = [
                    "forward",
                    "back",
                    "right",
                    "left",
                    "setheading",
                    "setcolor",
                    "setshade",
                    "sethue",
                    "setgrey",
                    "settranslucency",
                    "setpensize"
                ];
                expect(PhraseMakerUtils.MATRIXGRAPHICS).toEqual(expected);
            });

            test("has 11 entries", () => {
                expect(PhraseMakerUtils.MATRIXGRAPHICS).toHaveLength(11);
            });

            test("all entries are strings", () => {
                PhraseMakerUtils.MATRIXGRAPHICS.forEach(entry => {
                    expect(typeof entry).toBe("string");
                });
            });

            test("includes movement commands", () => {
                expect(PhraseMakerUtils.MATRIXGRAPHICS).toContain("forward");
                expect(PhraseMakerUtils.MATRIXGRAPHICS).toContain("back");
                expect(PhraseMakerUtils.MATRIXGRAPHICS).toContain("right");
                expect(PhraseMakerUtils.MATRIXGRAPHICS).toContain("left");
            });

            test("includes style commands", () => {
                expect(PhraseMakerUtils.MATRIXGRAPHICS).toContain("setcolor");
                expect(PhraseMakerUtils.MATRIXGRAPHICS).toContain("setshade");
                expect(PhraseMakerUtils.MATRIXGRAPHICS).toContain("sethue");
                expect(PhraseMakerUtils.MATRIXGRAPHICS).toContain("setgrey");
                expect(PhraseMakerUtils.MATRIXGRAPHICS).toContain("settranslucency");
                expect(PhraseMakerUtils.MATRIXGRAPHICS).toContain("setpensize");
            });
        });

        describe("MATRIXGRAPHICS2", () => {
            test("is an array", () => {
                expect(Array.isArray(PhraseMakerUtils.MATRIXGRAPHICS2)).toBe(true);
            });

            test("contains expected secondary graphics commands", () => {
                expect(PhraseMakerUtils.MATRIXGRAPHICS2).toEqual(["arc", "setxy"]);
            });

            test("has 2 entries", () => {
                expect(PhraseMakerUtils.MATRIXGRAPHICS2).toHaveLength(2);
            });

            test("includes arc command", () => {
                expect(PhraseMakerUtils.MATRIXGRAPHICS2).toContain("arc");
            });

            test("includes setxy command", () => {
                expect(PhraseMakerUtils.MATRIXGRAPHICS2).toContain("setxy");
            });
        });

        describe("MATRIXSYNTHS", () => {
            test("is an array", () => {
                expect(Array.isArray(PhraseMakerUtils.MATRIXSYNTHS)).toBe(true);
            });

            test("contains expected synthesizer types", () => {
                expect(PhraseMakerUtils.MATRIXSYNTHS).toEqual([
                    "sine",
                    "triangle",
                    "sawtooth",
                    "square",
                    "hertz"
                ]);
            });

            test("has 5 entries", () => {
                expect(PhraseMakerUtils.MATRIXSYNTHS).toHaveLength(5);
            });

            test("all entries are strings", () => {
                PhraseMakerUtils.MATRIXSYNTHS.forEach(entry => {
                    expect(typeof entry).toBe("string");
                });
            });

            test("includes standard waveform types", () => {
                expect(PhraseMakerUtils.MATRIXSYNTHS).toContain("sine");
                expect(PhraseMakerUtils.MATRIXSYNTHS).toContain("triangle");
                expect(PhraseMakerUtils.MATRIXSYNTHS).toContain("sawtooth");
                expect(PhraseMakerUtils.MATRIXSYNTHS).toContain("square");
            });

            test("includes hertz", () => {
                expect(PhraseMakerUtils.MATRIXSYNTHS).toContain("hertz");
            });
        });
    });

    describe("generateDataURI", () => {
        describe("normal input", () => {
            test("returns a data URI string for simple content", () => {
                const result = PhraseMakerUtils.generateDataURI("Hello World");

                expect(result).toContain("data: text/html;charset=utf-8, ");
            });

            test("encodes the file content in the URI", () => {
                const result = PhraseMakerUtils.generateDataURI("Hello World");

                expect(result).toBe(
                    "data: text/html;charset=utf-8, " + encodeURIComponent("Hello World")
                );
            });

            test("correctly encodes HTML content", () => {
                const html = "<div>Hello</div>";
                const result = PhraseMakerUtils.generateDataURI(html);

                expect(result).toContain(encodeURIComponent("<div>Hello</div>"));
            });

            test("correctly encodes special characters", () => {
                const content = "a=1&b=2";
                const result = PhraseMakerUtils.generateDataURI(content);

                expect(result).toContain(encodeURIComponent("a=1&b=2"));
                expect(result).not.toContain("&b=2");
            });

            test("correctly encodes unicode characters", () => {
                const content = "♪ Music ♫";
                const result = PhraseMakerUtils.generateDataURI(content);

                expect(result).toBe(
                    "data: text/html;charset=utf-8, " + encodeURIComponent("♪ Music ♫")
                );
            });

            test("handles multiline content", () => {
                const content = "line1\nline2\nline3";
                const result = PhraseMakerUtils.generateDataURI(content);

                expect(result).toBe(
                    "data: text/html;charset=utf-8, " + encodeURIComponent(content)
                );
            });
        });

        describe("edge cases", () => {
            test("returns data URI prefix for empty string", () => {
                const result = PhraseMakerUtils.generateDataURI("");

                expect(result).toBe("data: text/html;charset=utf-8, ");
            });

            test("handles whitespace-only string", () => {
                const result = PhraseMakerUtils.generateDataURI("   ");

                expect(result).toBe("data: text/html;charset=utf-8, " + encodeURIComponent("   "));
            });

            test("handles very long string", () => {
                const longStr = "a".repeat(10000);
                const result = PhraseMakerUtils.generateDataURI(longStr);

                expect(result).toContain("data: text/html;charset=utf-8, ");
                expect(result.length).toBeGreaterThan(10000);
            });
        });
    });

    describe("recalculateBlocks", () => {
        describe("empty/null input", () => {
            test("returns empty array for null input", () => {
                const result = PhraseMakerUtils.recalculateBlocks(null, last);

                expect(result).toEqual([]);
            });

            test("returns empty array for undefined input", () => {
                const result = PhraseMakerUtils.recalculateBlocks(undefined, last);

                expect(result).toEqual([]);
            });

            test("returns empty array for empty array input", () => {
                const result = PhraseMakerUtils.recalculateBlocks([], last);

                expect(result).toEqual([]);
            });
        });

        describe("single element input", () => {
            test("returns single adjusted note for single tuplet rhythm", () => {
                const tupletRhythms = [["x", "y", 4]];
                const result = PhraseMakerUtils.recalculateBlocks(tupletRhythms, last);

                expect(result).toEqual([[4, 1]]);
            });

            test("uses third element (index 2) of tuplet rhythm entry as note value", () => {
                const tupletRhythms = [["ignored1", "ignored2", 8]];
                const result = PhraseMakerUtils.recalculateBlocks(tupletRhythms, last);

                expect(result[0][0]).toBe(8);
            });
        });

        describe("consecutive identical notes", () => {
            test("groups two identical notes together", () => {
                const tupletRhythms = [
                    ["a", "b", 4],
                    ["c", "d", 4]
                ];
                const result = PhraseMakerUtils.recalculateBlocks(tupletRhythms, last);

                expect(result).toEqual([[4, 2]]);
            });

            test("groups three identical notes together", () => {
                const tupletRhythms = [
                    ["a", "b", 8],
                    ["c", "d", 8],
                    ["e", "f", 8]
                ];
                const result = PhraseMakerUtils.recalculateBlocks(tupletRhythms, last);

                expect(result).toEqual([[8, 3]]);
            });

            test("groups five identical notes together", () => {
                const tupletRhythms = [
                    ["a", "b", 2],
                    ["c", "d", 2],
                    ["e", "f", 2],
                    ["g", "h", 2],
                    ["i", "j", 2]
                ];
                const result = PhraseMakerUtils.recalculateBlocks(tupletRhythms, last);

                expect(result).toEqual([[2, 5]]);
            });
        });

        describe("alternating notes", () => {
            test("separates two different notes", () => {
                const tupletRhythms = [
                    ["a", "b", 4],
                    ["c", "d", 8]
                ];
                const result = PhraseMakerUtils.recalculateBlocks(tupletRhythms, last);

                expect(result).toEqual([
                    [4, 1],
                    [8, 1]
                ]);
            });

            test("separates three different notes", () => {
                const tupletRhythms = [
                    ["a", "b", 4],
                    ["c", "d", 8],
                    ["e", "f", 16]
                ];
                const result = PhraseMakerUtils.recalculateBlocks(tupletRhythms, last);

                expect(result).toEqual([
                    [4, 1],
                    [8, 1],
                    [16, 1]
                ]);
            });
        });

        describe("mixed patterns", () => {
            test("groups then switches: [4,4,8]", () => {
                const tupletRhythms = [
                    ["a", "b", 4],
                    ["c", "d", 4],
                    ["e", "f", 8]
                ];
                const result = PhraseMakerUtils.recalculateBlocks(tupletRhythms, last);

                expect(result).toEqual([
                    [4, 2],
                    [8, 1]
                ]);
            });

            test("switches then groups: [4,8,8]", () => {
                const tupletRhythms = [
                    ["a", "b", 4],
                    ["c", "d", 8],
                    ["e", "f", 8]
                ];
                const result = PhraseMakerUtils.recalculateBlocks(tupletRhythms, last);

                expect(result).toEqual([
                    [4, 1],
                    [8, 2]
                ]);
            });

            test("complex pattern: [4,4,8,8,8,16,16]", () => {
                const tupletRhythms = [
                    ["a", "b", 4],
                    ["c", "d", 4],
                    ["e", "f", 8],
                    ["g", "h", 8],
                    ["i", "j", 8],
                    ["k", "l", 16],
                    ["m", "n", 16]
                ];
                const result = PhraseMakerUtils.recalculateBlocks(tupletRhythms, last);

                expect(result).toEqual([
                    [4, 2],
                    [8, 3],
                    [16, 2]
                ]);
            });

            test("group-switch-group pattern: [4,4,8,4,4]", () => {
                const tupletRhythms = [
                    ["a", "b", 4],
                    ["c", "d", 4],
                    ["e", "f", 8],
                    ["g", "h", 4],
                    ["i", "j", 4]
                ];
                const result = PhraseMakerUtils.recalculateBlocks(tupletRhythms, last);

                expect(result).toEqual([
                    [4, 2],
                    [8, 1],
                    [4, 2]
                ]);
            });
        });

        describe("note value types", () => {
            test("works with string note values", () => {
                const tupletRhythms = [
                    ["a", "b", "C"],
                    ["c", "d", "C"],
                    ["e", "f", "D"]
                ];
                const result = PhraseMakerUtils.recalculateBlocks(tupletRhythms, last);

                expect(result).toEqual([
                    ["C", 2],
                    ["D", 1]
                ]);
            });

            test("works with fractional note values", () => {
                const tupletRhythms = [
                    ["a", "b", 4.5],
                    ["c", "d", 4.5],
                    ["e", "f", 3.5]
                ];
                const result = PhraseMakerUtils.recalculateBlocks(tupletRhythms, last);

                expect(result).toEqual([
                    [4.5, 2],
                    [3.5, 1]
                ]);
            });

            test("returns correct total count across all groups", () => {
                const tupletRhythms = [
                    ["a", "b", 4],
                    ["c", "d", 4],
                    ["e", "f", 8],
                    ["g", "h", 8],
                    ["i", "j", 16]
                ];
                const result = PhraseMakerUtils.recalculateBlocks(tupletRhythms, last);

                const totalCount = result.reduce((sum, note) => sum + note[1], 0);
                expect(totalCount).toBe(tupletRhythms.length);
            });
        });
    });
});
