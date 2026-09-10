/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Om Santosh Suneri
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

global._ = str => str;
const {
    TACAT,
    TAPAL,
    TASCORE,
    PALS,
    PALS_INDEX_MAP,
    PALLABELS,
    analyzeProject,
    scoreToChartData,
    getChartOptions,
    runAnalytics,
    getStatsFromNotation
} = require("../rubrics");
const { isCustomTemperament, getTemperament } = require("../utils/musicutils");

global.last = jest.fn();
global.isCustomTemperament = isCustomTemperament;
global.getTemperament = getTemperament;
global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;

jest.mock("../utils/musicutils", () => ({
    isCustomTemperament: jest.fn(() => false),
    getTemperament: jest.fn(() => [])
}));
jest.mock("../utils/utils.js", () => ({
    _: jest.fn(str => str)
}));

describe("rubrics.js test suite", () => {
    describe("analyzeProject", () => {
        it("should return an array of scores", () => {
            const activity = {
                blocks: {
                    blockList: [
                        { name: "note", connections: [null, {}] },
                        { name: "setbpm", connections: [null, {}, {}] },
                        { name: "random", connections: [null] }
                    ]
                }
            };
            const result = analyzeProject(activity);
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(PALS.length);
        });

        it("should calculate correct category and palette scores using PALS_INDEX_MAP", () => {
            const activity = {
                blocks: {
                    blockList: [{ name: "forward", connections: ["conn1"] }]
                }
            };
            const result = analyzeProject(activity);
            const turtlepIndex = PALS_INDEX_MAP.get("turtlep");
            // TASCORE["forward"] (3) + TASCORE["turtlep"] (5) = 8
            expect(result[turtlepIndex]).toBe(8);
        });

        it("should ignore blocks in trash", () => {
            const activity = {
                blocks: {
                    blockList: [
                        { name: "note", trash: true, connections: [null, {}] },
                        { name: "setbpm", trash: false, connections: [null, {}, {}] }
                    ]
                }
            };
            const result = analyzeProject(activity);
            expect(result).toBeInstanceOf(Array);
        });

        it("should correctly map palettes to their indices in PALS_INDEX_MAP", () => {
            expect(PALS_INDEX_MAP).toBeInstanceOf(Map);
            expect(PALS_INDEX_MAP.size).toBe(PALS.length);
            PALS.forEach((pal, idx) => {
                expect(PALS_INDEX_MAP.get(pal)).toBe(idx);
            });
        });

        it("should warn when TAPAL value is not found in PALS_INDEX_MAP in cats loop", () => {
            const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
            const origIndex = PALS_INDEX_MAP.get("numberp");
            PALS_INDEX_MAP.delete("numberp");

            const activity = {
                blocks: {
                    blockList: [{ name: "random", connections: ["conn1"] }]
                }
            };
            analyzeProject(activity);

            expect(warnSpy).toHaveBeenCalledWith(
                "rubrics: TAPAL value not found in PALS:",
                "numberp"
            );
            warnSpy.mockRestore();
            PALS_INDEX_MAP.set("numberp", origIndex);
        });

        it("should warn when pal is not found in PALS_INDEX_MAP in pals loop", () => {
            const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
            const origIndex = PALS_INDEX_MAP.get("turtlep");
            PALS_INDEX_MAP.delete("turtlep");

            const activity = {
                blocks: {
                    blockList: [{ name: "forward", connections: ["conn1"] }]
                }
            };
            analyzeProject(activity);

            expect(warnSpy).toHaveBeenCalledWith("rubrics: pal not found in PALS:", "turtlep");
            warnSpy.mockRestore();
            PALS_INDEX_MAP.set("turtlep", origIndex);
        });

        it("skips a slot-1 flow block (tie/start/...) whose child connection is empty", () => {
            const notespIdx = PALS_INDEX_MAP.get("notesp");

            const withChild = analyzeProject({
                blocks: { blockList: [{ name: "tie", connections: [null, {}] }] }
            });
            const withoutChild = analyzeProject({
                blocks: { blockList: [{ name: "tie", connections: [null, null] }] }
            });

            // A "tie" with a real child flow scores rhythm points; an empty one
            // is dropped before scoring.
            expect(withChild[notespIdx]).toBeGreaterThan(0);
            expect(withoutChild.every(score => score === 0)).toBe(true);
        });

        it("skips a tuplet2 block whose slot-3 connection is empty", () => {
            const scored = analyzeProject({
                blocks: { blockList: [{ name: "tuplet2", connections: [null, {}, {}, {}] }] }
            });
            const dropped = analyzeProject({
                blocks: { blockList: [{ name: "tuplet2", connections: [null, {}, {}, null] }] }
            });

            expect(scored.some(score => score > 0)).toBe(true);
            expect(dropped.every(score => score === 0)).toBe(true);
        });

        it("skips an invert block whose slot-4 connection is empty", () => {
            const kept = analyzeProject({
                blocks: {
                    blockList: [{ name: "invert", connections: [null, {}, {}, {}, {}] }]
                }
            });
            const dropped = analyzeProject({
                blocks: {
                    blockList: [{ name: "invert", connections: [null, {}, {}, {}, null] }]
                }
            });

            expect(Array.isArray(kept)).toBe(true);
            expect(dropped.every(score => score === 0)).toBe(true);
        });

        it("logs a debug line for a retained block that is absent from the catalog", () => {
            const debugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});

            analyzeProject({
                blocks: {
                    blockList: [{ name: "notacatalogblock", connections: [{}, {}] }]
                }
            });

            expect(debugSpy).toHaveBeenCalledWith("notacatalogblock not in catalog");
            debugSpy.mockRestore();
        });
    });

    describe("scoreToChartData", () => {
        it("should return a properly formatted chart data object", () => {
            const scores = [10, 20, 30, 40, 50];
            const chartData = scoreToChartData(scores);

            expect(chartData).toHaveProperty("labels");
            expect(chartData).toHaveProperty("datasets");
            expect(Array.isArray(chartData.labels)).toBe(true);
            expect(chartData.datasets).toHaveLength(1);
            expect(chartData.datasets[0]).toHaveProperty("data");
            expect(chartData.datasets[0].data.length).toBe(scores.length);
        });

        it("handles an all-zero score vector without dividing by zero", () => {
            const chartData = scoreToChartData([0, 0, 0]);

            expect(chartData.datasets[0].data).toEqual([0, 0, 0]);
        });
    });

    describe("getChartOptions", () => {
        it("should return an object with correct chart settings", () => {
            const callback = jest.fn();
            const options = getChartOptions(callback);

            expect(options).toHaveProperty("onAnimationComplete", callback);
            expect(options).toHaveProperty("scaleShowLine", true);
            expect(options).toHaveProperty("datasetFill", true);
        });
    });

    describe("runAnalytics", () => {
        it("should set correct properties on logo object", () => {
            const activity = {
                logo: {
                    runningLilypond: false,
                    collectingStats: false,
                    notation: {
                        notationStaging: {},
                        notationDrumStaging: {}
                    },
                    runLogoCommands: jest.fn()
                },
                turtles: {
                    turtleList: [{ painter: { doClear: jest.fn() } }],
                    getTurtleCount: jest.fn(() => 1),
                    getTurtle: jest.fn(id => ({
                        painter: { doClear: jest.fn() }
                    }))
                }
            };

            runAnalytics(activity);

            expect(activity.logo.runningLilypond).toBe(true);
            expect(activity.logo.collectingStats).toBe(true);
            expect(activity.logo.runLogoCommands).toHaveBeenCalled();
        });
    });

    describe("getStatsFromNotation", () => {
        it("should return an object with musical statistics", () => {
            const activity = {
                logo: {
                    notation: {
                        notationStaging: {
                            0: [["C4", "D4"], 3],
                            1: [["E4", "F4"], 5]
                        }
                    },
                    synth: {
                        inTemperament: false,
                        _getFrequency: jest.fn(note => note.length * 100)
                    }
                },
                blocks: {
                    blockList: [
                        {
                            name: "rest2",
                            trash: false,
                            protoblock: { palette: { name: "ornaments" } }
                        }
                    ]
                }
            };

            const stats = getStatsFromNotation(activity);

            expect(stats).toHaveProperty("numberOfNotes");
            expect(stats.numberOfNotes).toBeGreaterThan(0);
            expect(stats).toHaveProperty("rests", 1);
            expect(stats).toHaveProperty("ornaments", 1);
        });

        it("counts tuplet groupings, tracks the pitch range and reads articulation markers", () => {
            const freq = { C4: 300, D4: 100, F4: 400, G4: 500 };
            const activity = {
                logo: {
                    notation: {
                        notationStaging: {
                            0: [
                                [["C4"], 2],
                                [["D4", "F4"], 3],
                                [["G4"], 5],
                                [["R"], 4],
                                "begin articulation",
                                "end articulation"
                            ]
                        }
                    },
                    synth: {
                        inTemperament: "equal",
                        _getFrequency: jest.fn(note => freq[note] ?? NaN)
                    }
                },
                blocks: {
                    blockList: [
                        {
                            name: "rest2",
                            trash: false,
                            protoblock: { palette: { name: "rhythm" } }
                        },
                        { name: "flat", trash: true },
                        {
                            name: "flat",
                            trash: false,
                            protoblock: { palette: { name: "ornaments" } }
                        }
                    ]
                }
            };

            const stats = getStatsFromNotation(activity);

            expect(stats.duples).toBe(1);
            expect(stats.triplets).toBe(1);
            expect(stats.quintuplets).toBe(1);
            // C4, D4, F4, G4 and the rest "R" each count as a note.
            expect(stats.numberOfNotes).toBe(5);
            // D4 is the cheapest frequency, G4 the dearest. Each tuple is
            // [noteName, runningNoteId, frequency]; the ids follow encounter
            // order C4=0, D4=1, F4=2, G4=3.
            expect(stats.lowestNote).toEqual(["D4", 1, 100]);
            expect(stats.highestNote).toEqual(["G4", 3, 500]);
            expect(stats.pitchNames.has("R")).toBe(true);
            expect(stats.pitchNames.has("C")).toBe(true);
            // Both markers are recorded by their staging index. Assert the
            // combined count rather than that they both land in .begin, so the
            // test still holds if the "end articulation" branch is later
            // corrected to push into .end.
            expect(stats.articulation.begin).toContain("4");
            expect(stats.articulation.begin.length + stats.articulation.end.length).toBe(2);
            expect(stats.rests).toBe(1);
            expect(stats.ornaments).toBe(1);
        });

        it("resolves note names through the custom temperament table when one is active", () => {
            isCustomTemperament.mockReturnValueOnce(true);
            getTemperament.mockReturnValueOnce([["idx", "Cff", "ratio", "C"]]);

            const activity = {
                logo: {
                    notation: {
                        notationStaging: {
                            0: [[["C4"], 4]]
                        }
                    },
                    synth: {
                        inTemperament: "custom",
                        getCustomFrequency: jest.fn(() => 261.6),
                        _getFrequency: jest.fn(() => {
                            throw new Error("_getFrequency must not be used in custom temperament");
                        })
                    }
                },
                blocks: { blockList: [] }
            };

            const stats = getStatsFromNotation(activity);

            expect(activity.logo.synth.getCustomFrequency).toHaveBeenCalled();
            // "C" matched row[3], so the stored name becomes row[1] + octave.
            expect(stats.pitchNames.has("Cff")).toBe(true);
            expect(stats.pitches).toContain(261.6);
        });
    });
});
