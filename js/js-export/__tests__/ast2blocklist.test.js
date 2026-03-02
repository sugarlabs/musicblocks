/**
 * MusicBlocks v3.6.2
 *
 * @author Elwin Li
 *
 * @copyright 2025 Elwin Li
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

const acorn = require("../../../lib/acorn.min");
const { AST2BlockList } = require("../ast2blocklist");
const fs = require("fs");
const path = require("path");

describe("AST2BlockList Class", () => {
    let config;

    beforeAll(() => {
        // Load the config file from parent directory
        const configPath = path.join(__dirname, "..", "ast2blocks.json");
        const configContent = fs.readFileSync(configPath, "utf8");
        config = JSON.parse(configContent);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Test calling unsupported function should throw an error.
    test("should throw error for unsupported call", () => {
        const code = `
        new Mouse(async mouse => {
            await mouse.setMusicInstrument("guitar", async () => {
                await mouse.playNote(1 / 4, async () => {
                    await mouse.playPitch("G♭", 2);
                    return mouse.ENDFLOW;
                });
                return mouse.ENDFLOW;
            });
            return mouse.ENDMOUSE;
        });
        MusicBlocks.run();`;

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        try {
            AST2BlockList.toBlockList(AST, config);
        } catch (e) {
            // Verify error message provides context about unsupported statement
            expect(e.prefix).toEqual("Unsupported statement: ");
            // Error should include position information for scope isolation
            expect(e.start).toBeDefined();
            expect(e.end).toBeDefined();
        }
    });

    // Test unsupported assignment expression should throw an error.
    test("should throw error for unsupported assignment expression", () => {
        const code = `
        new Mouse(async mouse => {
            await mouse.setInstrument("guitar", async () => {
                box1 = box2 - 1;
                await mouse.playNote(1 / 4, async () => {
                    await mouse.playPitch("G♭", box1);
                    return mouse.ENDFLOW;
                });
                return mouse.ENDFLOW;
            });
            return mouse.ENDMOUSE;
        });
        MusicBlocks.run();`;

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        try {
            AST2BlockList.toBlockList(AST, config);
        } catch (e) {
            expect(e.prefix + code.substring(e.start, e.end)).toEqual(
                "Unsupported AssignmentExpression: box1 = box2 - 1"
            );
        }
    });

    // Test unsupported binary operator should throw an error.
    test("should throw error for unsupported binary operator", () => {
        const code = `
        new Mouse(async mouse => {
            await mouse.setInstrument("guitar", async () => {
                await mouse.playNote(1 << 2, async () => {
                    await mouse.playPitch("G♭", 3);
                    return mouse.ENDFLOW;
                });
                return mouse.ENDFLOW;
            });
            return mouse.ENDMOUSE;
        });
        MusicBlocks.run();`;

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        try {
            AST2BlockList.toBlockList(AST, config);
        } catch (e) {
            expect(e.prefix + code.substring(e.start, e.end)).toEqual(
                "Unsupported operator <<: 1 << 2"
            );
        }
    });

    // Test unsupported unary operator should throw an error.
    test("should throw error for unsupported unary operator", () => {
        const code = `
        new Mouse(async mouse => {
            await mouse.setInstrument("guitar", async () => {
                await mouse.playNote(~2, async () => {
                    await mouse.playPitch("G♭", 3);
                    return mouse.ENDFLOW;
                });
                return mouse.ENDFLOW;
            });
            return mouse.ENDMOUSE;
        });
        MusicBlocks.run();`;

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        try {
            AST2BlockList.toBlockList(AST, config);
        } catch (e) {
            expect(e.prefix + code.substring(e.start, e.end)).toEqual("Unsupported operator ~: ~2");
        }
    });

    // Test calling unsupported function should throw an error.
    test("should throw error for unsupported function call", () => {
        const code = `
        new Mouse(async mouse => {
            await mouse.setInstrument("guitar", async () => {
                await mouse.playNote(Math.unsupported(1), async () => {
                    await mouse.playPitch("G♭", 3);
                    return mouse.ENDFLOW;
                });
                return mouse.ENDFLOW;
            });
            return mouse.ENDMOUSE;
        });
        MusicBlocks.run();`;

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        try {
            AST2BlockList.toBlockList(AST, config);
        } catch (e) {
            expect(e.prefix + code.substring(e.start, e.end)).toEqual(
                "Unsupported operator unsupported: Math.unsupported(1)"
            );
        }
    });

    // Test unsupported argument type should throw an error.
    test("should throw error for unsupported argument type", () => {
        const code = `
        new Mouse(async mouse => {
            await mouse.setInstrument("guitar", async () => {
                await mouse.playNote([1], async () => {
                    await mouse.playPitch("G♭", 3);
                    return mouse.ENDFLOW;
                });
                return mouse.ENDFLOW;
            });
            return mouse.ENDMOUSE;
        });
        MusicBlocks.run();`;

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        try {
            AST2BlockList.toBlockList(AST, config);
        } catch (e) {
            expect(e.prefix + code.substring(e.start, e.end)).toEqual(
                "Unsupported argument type ArrayExpression: [1]"
            );
        }
    });

    // Test unsupported statement should throw an error.
    test("should throw error for unsupported statement", () => {
        const code = "console.log('test');";

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        try {
            AST2BlockList.toBlockList(AST, config);
        } catch (e) {
            expect(e.prefix + code.substring(e.start, e.end)).toEqual(
                "Unsupported statement: console.log('test');"
            );
        }
    });

    // Test a single note inside of settimbre.
    // Support number expressions, including built-in math functions, for note and pitch.
    test("should generate correct blockList for a single note", () => {
        const code = `
        new Mouse(async mouse => {
            await mouse.setInstrument("guitar", async () => {
                await mouse.playNote(Math.abs(-2) * 1, async () => {
                    await mouse.playPitch("G♭", Math.abs(-2));
                    return mouse.ENDFLOW;
                });
                return mouse.ENDFLOW;
            });
            return mouse.ENDMOUSE;
        });
        MusicBlocks.run();`;

        const expectedBlockList = [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "settimbre", 0, 0, [0, 2, 3, null]],
            [2, ["voicename", { value: "guitar" }], 0, 0, [1]],
            [3, "newnote", 0, 0, [1, 4, 9, null]],
            [4, "multiply", 0, 0, [3, 5, 8]],
            [5, "abs", 0, 0, [4, 6]],
            [6, "neg", 0, 0, [5, 7]],
            [7, ["number", { value: 2 }], 0, 0, [6]],
            [8, ["number", { value: 1 }], 0, 0, [4]],
            [9, "vspace", 0, 0, [3, 10]],
            [10, "pitch", 0, 0, [9, 11, 12, null]],
            [11, ["notename", { value: "G♭" }], 0, 0, [10]],
            [12, "abs", 0, 0, [10, 13]],
            [13, "neg", 0, 0, [12, 14]],
            [14, ["number", { value: 2 }], 0, 0, [13]]
        ];

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        let blockList = AST2BlockList.toBlockList(AST, config);
        expect(blockList).toEqual(expectedBlockList);
    });

    // Test repeat statement.
    // Support number expressions, including built-in math functions, for number of repeats.
    test("should generate correct blockList for repeat", () => {
        const code = `
        new Mouse(async mouse => {
            await mouse.setInstrument("clarinet", async () => {
                for (let i0 = 0; i0 < MathUtility.doRandom(1, 5); i0++) {
                    await mouse.playNote(1 / 4, async () => {
                        await mouse.playPitch("fa", 2 * 2);
                        return mouse.ENDFLOW;
                    });
                }
                return mouse.ENDFLOW;
            });
            return mouse.ENDMOUSE;
        });
        MusicBlocks.run();`;

        const expectedBlockList = [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "settimbre", 0, 0, [0, 2, 3, null]],
            [2, ["voicename", { value: "clarinet" }], 0, 0, [1]],
            [3, "repeat", 0, 0, [1, 4, 7, null]],
            [4, "random", 0, 0, [3, 5, 6]],
            [5, ["number", { value: 1 }], 0, 0, [4]],
            [6, ["number", { value: 5 }], 0, 0, [4]],
            [7, "vspace", 0, 0, [3, 8]],
            [8, "newnote", 0, 0, [7, 9, 12, null]],
            [9, "divide", 0, 0, [8, 10, 11]],
            [10, ["number", { value: 1 }], 0, 0, [9]],
            [11, ["number", { value: 4 }], 0, 0, [9]],
            [12, "vspace", 0, 0, [8, 13]],
            [13, "pitch", 0, 0, [12, 14, 15, 18]],
            [14, ["solfege", { value: "fa" }], 0, 0, [13]],
            [15, "multiply", 0, 0, [13, 16, 17]],
            [16, ["number", { value: 2 }], 0, 0, [15]],
            [17, ["number", { value: 2 }], 0, 0, [15]],
            [18, "vspace", 0, 0, [13, null]]
        ];

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        let blockList = AST2BlockList.toBlockList(AST, config);
        expect(blockList).toEqual(expectedBlockList);
    });

    // Test if statement.
    // Support boolean expressions, including built-in math functions, for if condition.
    test("should generate correct blockList for if", () => {
        const code = `
        new Mouse(async mouse => {
            if (!(1 == MathUtility.doRandom(0, 1))) {
                await mouse.setInstrument("electronic synth", async () => {
                    await mouse.playNote(1 / 4, async () => {
                        await mouse.playPitch("sol", 4);
                        return mouse.ENDFLOW;
                    });
                    return mouse.ENDFLOW;
                });
            }
            return mouse.ENDMOUSE;
        });
        MusicBlocks.run();`;

        const expectedBlockList = [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "if", 0, 0, [0, 2, 8, null]],
            [2, "not", 0, 0, [1, 3]],
            [3, "equal", 0, 0, [2, 4, 5]],
            [4, ["number", { value: 1 }], 0, 0, [3]],
            [5, "random", 0, 0, [3, 6, 7]],
            [6, ["number", { value: 0 }], 0, 0, [5]],
            [7, ["number", { value: 1 }], 0, 0, [5]],
            [8, "vspace", 0, 0, [1, 9]],
            [9, "settimbre", 0, 0, [8, 10, 11, null]],
            [10, ["voicename", { value: "electronic synth" }], 0, 0, [9]],
            [11, "newnote", 0, 0, [9, 12, 15, null]],
            [12, "divide", 0, 0, [11, 13, 14]],
            [13, ["number", { value: 1 }], 0, 0, [12]],
            [14, ["number", { value: 4 }], 0, 0, [12]],
            [15, "vspace", 0, 0, [11, 16]],
            [16, "pitch", 0, 0, [15, 17, 18, null]],
            [17, ["solfege", { value: "sol" }], 0, 0, [16]],
            [18, ["number", { value: 4 }], 0, 0, [16]]
        ];

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        let blockList = AST2BlockList.toBlockList(AST, config);
        expect(blockList).toEqual(expectedBlockList);
    });

    // Test action with recursion.
    // Support using box value to control termination of recursion.
    test("should generate correct blockList for action with recursion", () => {
        const code = `
        let playSol = async mouse => {
            await mouse.playNote(1 / 4, async () => {
                await mouse.playPitch("sol", 2);
                return mouse.ENDFLOW;
            });
            box1 = box1 - 1;
            box1 = box1 + 1;
            if (box1 > 0) {
                await playSol(mouse);
            }
            return mouse.ENDFLOW;
        };
        new Mouse(async mouse => {
            var box1 = Math.abs(-2) * 3;
            await mouse.setInstrument("electronic synth", async () => {
                await playSol(mouse);
                return mouse.ENDFLOW;
            });
            return mouse.ENDMOUSE;
        });
        MusicBlocks.run();`;

        const expectedBlockList = [
            [0, "action", 200, 200, [null, 1, 2, null]],
            [1, ["text", { value: "playSol" }], 0, 0, [0]],
            [2, "newnote", 0, 0, [0, 3, 6, 10]],
            [3, "divide", 0, 0, [2, 4, 5]],
            [4, ["number", { value: 1 }], 0, 0, [3]],
            [5, ["number", { value: 4 }], 0, 0, [3]],
            [6, "vspace", 0, 0, [2, 7]],
            [7, "pitch", 0, 0, [6, 8, 9, null]],
            [8, ["solfege", { value: "sol" }], 0, 0, [7]],
            [9, ["number", { value: 2 }], 0, 0, [7]],
            [10, "decrementOne", 0, 0, [2, 11, 12]],
            [11, ["namedbox", { value: "box1" }], 0, 0, [10]],
            [12, "increment", 0, 0, [10, 13, 14, 15]],
            [13, ["namedbox", { value: "box1" }], 0, 0, [12]],
            [14, ["number", { value: 1 }], 0, 0, [12]],
            [15, "if", 0, 0, [12, 16, 19, null]],
            [16, "greater", 0, 0, [15, 17, 18]],
            [17, ["namedbox", { value: "box1" }], 0, 0, [16]],
            [18, ["number", { value: 0 }], 0, 0, [16]],
            [19, ["nameddo", { value: "playSol" }], 0, 0, [15, null]],
            [20, "start", 500, 200, [null, 21, null]],
            [21, ["storein2", { value: "box1" }], 0, 0, [20, 22, 27]],
            [22, "multiply", 0, 0, [21, 23, 26]],
            [23, "abs", 0, 0, [22, 24]],
            [24, "neg", 0, 0, [23, 25]],
            [25, ["number", { value: 2 }], 0, 0, [24]],
            [26, ["number", { value: 3 }], 0, 0, [22]],
            [27, "vspace", 0, 0, [21, 28]],
            [28, "settimbre", 0, 0, [27, 29, 30, null]],
            [29, ["voicename", { value: "electronic synth" }], 0, 0, [28]],
            [30, ["nameddo", { value: "playSol" }], 0, 0, [28, null]]
        ];

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        let blockList = AST2BlockList.toBlockList(AST, config);
        expect(blockList).toEqual(expectedBlockList);
    });

    // Test action, note, pitch, and repeat with Frere Jacques, an example here:
    // https://musicblocks.sugarlabs.org/index.html?id=1725791527821787&run=True
    test("should generate correct blockList for action with recursion", () => {
        const code = `
        let chunk0 = async mouse => {
            await mouse.playNote(1 / 4, async () => {
                await mouse.playPitch("sol", 4);
                return mouse.ENDFLOW;
            });
            await mouse.playNote(1 / 4, async () => {
                await mouse.playPitch("la", 4);
                return mouse.ENDFLOW;
            });
            await mouse.playNote(1 / 4, async () => {
                await mouse.playPitch("ti", 4);
                return mouse.ENDFLOW;
            });
            await mouse.playNote(1 / 4, async () => {
                await mouse.playPitch("sol", 4);
                return mouse.ENDFLOW;
            });
            return mouse.ENDFLOW;
        };
        let chunk1 = async mouse => {
            await mouse.playNote(1 / 4, async () => {
                await mouse.playPitch("ti", 4);
                return mouse.ENDFLOW;
            });
            await mouse.playNote(1 / 4, async () => {
                await mouse.playPitch("do", 4);
                return mouse.ENDFLOW;
            });
            await mouse.playNote(1 / 2, async () => {
                await mouse.playPitch("re", 5);
                return mouse.ENDFLOW;
            });
            return mouse.ENDFLOW;
        };
        let chunk2 = async mouse => {
            await mouse.playNote(1 / 8, async () => {
                await mouse.playPitch("re", 5);
                return mouse.ENDFLOW;
            });
            await mouse.playNote(1 / 8, async () => {
                await mouse.playPitch("mi", 5);
                return mouse.ENDFLOW;
            });
            await mouse.playNote(1 / 8, async () => {
                await mouse.playPitch("re", 5);
                return mouse.ENDFLOW;
            });
            await mouse.playNote(1 / 8, async () => {
                await mouse.playPitch("do", 5);
                return mouse.ENDFLOW;
            });
            await mouse.playNote(1 / 4, async () => {
                await mouse.playPitch("ti", 5);
                return mouse.ENDFLOW;
            });
            await mouse.playNote(1 / 4, async () => {
                await mouse.playPitch("sol", 4);
                return mouse.ENDFLOW;
            });
            return mouse.ENDFLOW;
        };
        let chunk3 = async mouse => {
            await mouse.playNote(1 / 4, async () => {
                await mouse.playPitch("sol", 4);
                return mouse.ENDFLOW;
            });
            await mouse.playNote(1 / 4, async () => {
                await mouse.playPitch("re", 4);
                return mouse.ENDFLOW;
            });
            await mouse.playNote(1 / 4, async () => {
                await mouse.playPitch("sol", 4);
                return mouse.ENDFLOW;
            });
            return mouse.ENDFLOW;
        };
        new Mouse(async mouse => {
            for (let i0 = 0; i0 < 2; i0++) {
                await chunk0(mouse);
            }
            for (let i0 = 0; i0 < 2; i0++) {
                await chunk1(mouse);
            }
            for (let i0 = 0; i0 < 2; i0++) {
                await chunk2(mouse);
            }
            for (let i0 = 0; i0 < 2; i0++) {
                await chunk3(mouse);
            }
            return mouse.ENDMOUSE;
        });
        MusicBlocks.run();`;

        const expectedBlockList = [
            [0, "action", 200, 200, [null, 1, 2, null]],
            [1, ["text", { value: "chunk0" }], 0, 0, [0]],
            [2, "newnote", 0, 0, [0, 3, 6, 10]],
            [3, "divide", 0, 0, [2, 4, 5]],
            [4, ["number", { value: 1 }], 0, 0, [3]],
            [5, ["number", { value: 4 }], 0, 0, [3]],
            [6, "vspace", 0, 0, [2, 7]],
            [7, "pitch", 0, 0, [6, 8, 9, null]],
            [8, ["solfege", { value: "sol" }], 0, 0, [7]],
            [9, ["number", { value: 4 }], 0, 0, [7]],
            [10, "newnote", 0, 0, [2, 11, 14, 18]],
            [11, "divide", 0, 0, [10, 12, 13]],
            [12, ["number", { value: 1 }], 0, 0, [11]],
            [13, ["number", { value: 4 }], 0, 0, [11]],
            [14, "vspace", 0, 0, [10, 15]],
            [15, "pitch", 0, 0, [14, 16, 17, null]],
            [16, ["solfege", { value: "la" }], 0, 0, [15]],
            [17, ["number", { value: 4 }], 0, 0, [15]],
            [18, "newnote", 0, 0, [10, 19, 22, 26]],
            [19, "divide", 0, 0, [18, 20, 21]],
            [20, ["number", { value: 1 }], 0, 0, [19]],
            [21, ["number", { value: 4 }], 0, 0, [19]],
            [22, "vspace", 0, 0, [18, 23]],
            [23, "pitch", 0, 0, [22, 24, 25, null]],
            [24, ["solfege", { value: "ti" }], 0, 0, [23]],
            [25, ["number", { value: 4 }], 0, 0, [23]],
            [26, "newnote", 0, 0, [18, 27, 30, null]],
            [27, "divide", 0, 0, [26, 28, 29]],
            [28, ["number", { value: 1 }], 0, 0, [27]],
            [29, ["number", { value: 4 }], 0, 0, [27]],
            [30, "vspace", 0, 0, [26, 31]],
            [31, "pitch", 0, 0, [30, 32, 33, null]],
            [32, ["solfege", { value: "sol" }], 0, 0, [31]],
            [33, ["number", { value: 4 }], 0, 0, [31]],
            [34, "action", 500, 200, [null, 35, 36, null]],
            [35, ["text", { value: "chunk1" }], 0, 0, [34]],
            [36, "newnote", 0, 0, [34, 37, 40, 44]],
            [37, "divide", 0, 0, [36, 38, 39]],
            [38, ["number", { value: 1 }], 0, 0, [37]],
            [39, ["number", { value: 4 }], 0, 0, [37]],
            [40, "vspace", 0, 0, [36, 41]],
            [41, "pitch", 0, 0, [40, 42, 43, null]],
            [42, ["solfege", { value: "ti" }], 0, 0, [41]],
            [43, ["number", { value: 4 }], 0, 0, [41]],
            [44, "newnote", 0, 0, [36, 45, 48, 52]],
            [45, "divide", 0, 0, [44, 46, 47]],
            [46, ["number", { value: 1 }], 0, 0, [45]],
            [47, ["number", { value: 4 }], 0, 0, [45]],
            [48, "vspace", 0, 0, [44, 49]],
            [49, "pitch", 0, 0, [48, 50, 51, null]],
            [50, ["solfege", { value: "do" }], 0, 0, [49]],
            [51, ["number", { value: 4 }], 0, 0, [49]],
            [52, "newnote", 0, 0, [44, 53, 56, null]],
            [53, "divide", 0, 0, [52, 54, 55]],
            [54, ["number", { value: 1 }], 0, 0, [53]],
            [55, ["number", { value: 2 }], 0, 0, [53]],
            [56, "vspace", 0, 0, [52, 57]],
            [57, "pitch", 0, 0, [56, 58, 59, null]],
            [58, ["solfege", { value: "re" }], 0, 0, [57]],
            [59, ["number", { value: 5 }], 0, 0, [57]],
            [60, "action", 800, 200, [null, 61, 62, null]],
            [61, ["text", { value: "chunk2" }], 0, 0, [60]],
            [62, "newnote", 0, 0, [60, 63, 66, 70]],
            [63, "divide", 0, 0, [62, 64, 65]],
            [64, ["number", { value: 1 }], 0, 0, [63]],
            [65, ["number", { value: 8 }], 0, 0, [63]],
            [66, "vspace", 0, 0, [62, 67]],
            [67, "pitch", 0, 0, [66, 68, 69, null]],
            [68, ["solfege", { value: "re" }], 0, 0, [67]],
            [69, ["number", { value: 5 }], 0, 0, [67]],
            [70, "newnote", 0, 0, [62, 71, 74, 78]],
            [71, "divide", 0, 0, [70, 72, 73]],
            [72, ["number", { value: 1 }], 0, 0, [71]],
            [73, ["number", { value: 8 }], 0, 0, [71]],
            [74, "vspace", 0, 0, [70, 75]],
            [75, "pitch", 0, 0, [74, 76, 77, null]],
            [76, ["solfege", { value: "mi" }], 0, 0, [75]],
            [77, ["number", { value: 5 }], 0, 0, [75]],
            [78, "newnote", 0, 0, [70, 79, 82, 86]],
            [79, "divide", 0, 0, [78, 80, 81]],
            [80, ["number", { value: 1 }], 0, 0, [79]],
            [81, ["number", { value: 8 }], 0, 0, [79]],
            [82, "vspace", 0, 0, [78, 83]],
            [83, "pitch", 0, 0, [82, 84, 85, null]],
            [84, ["solfege", { value: "re" }], 0, 0, [83]],
            [85, ["number", { value: 5 }], 0, 0, [83]],
            [86, "newnote", 0, 0, [78, 87, 90, 94]],
            [87, "divide", 0, 0, [86, 88, 89]],
            [88, ["number", { value: 1 }], 0, 0, [87]],
            [89, ["number", { value: 8 }], 0, 0, [87]],
            [90, "vspace", 0, 0, [86, 91]],
            [91, "pitch", 0, 0, [90, 92, 93, null]],
            [92, ["solfege", { value: "do" }], 0, 0, [91]],
            [93, ["number", { value: 5 }], 0, 0, [91]],
            [94, "newnote", 0, 0, [86, 95, 98, 102]],
            [95, "divide", 0, 0, [94, 96, 97]],
            [96, ["number", { value: 1 }], 0, 0, [95]],
            [97, ["number", { value: 4 }], 0, 0, [95]],
            [98, "vspace", 0, 0, [94, 99]],
            [99, "pitch", 0, 0, [98, 100, 101, null]],
            [100, ["solfege", { value: "ti" }], 0, 0, [99]],
            [101, ["number", { value: 5 }], 0, 0, [99]],
            [102, "newnote", 0, 0, [94, 103, 106, null]],
            [103, "divide", 0, 0, [102, 104, 105]],
            [104, ["number", { value: 1 }], 0, 0, [103]],
            [105, ["number", { value: 4 }], 0, 0, [103]],
            [106, "vspace", 0, 0, [102, 107]],
            [107, "pitch", 0, 0, [106, 108, 109, null]],
            [108, ["solfege", { value: "sol" }], 0, 0, [107]],
            [109, ["number", { value: 4 }], 0, 0, [107]],
            [110, "action", 1100, 200, [null, 111, 112, null]],
            [111, ["text", { value: "chunk3" }], 0, 0, [110]],
            [112, "newnote", 0, 0, [110, 113, 116, 120]],
            [113, "divide", 0, 0, [112, 114, 115]],
            [114, ["number", { value: 1 }], 0, 0, [113]],
            [115, ["number", { value: 4 }], 0, 0, [113]],
            [116, "vspace", 0, 0, [112, 117]],
            [117, "pitch", 0, 0, [116, 118, 119, null]],
            [118, ["solfege", { value: "sol" }], 0, 0, [117]],
            [119, ["number", { value: 4 }], 0, 0, [117]],
            [120, "newnote", 0, 0, [112, 121, 124, 128]],
            [121, "divide", 0, 0, [120, 122, 123]],
            [122, ["number", { value: 1 }], 0, 0, [121]],
            [123, ["number", { value: 4 }], 0, 0, [121]],
            [124, "vspace", 0, 0, [120, 125]],
            [125, "pitch", 0, 0, [124, 126, 127, null]],
            [126, ["solfege", { value: "re" }], 0, 0, [125]],
            [127, ["number", { value: 4 }], 0, 0, [125]],
            [128, "newnote", 0, 0, [120, 129, 132, null]],
            [129, "divide", 0, 0, [128, 130, 131]],
            [130, ["number", { value: 1 }], 0, 0, [129]],
            [131, ["number", { value: 4 }], 0, 0, [129]],
            [132, "vspace", 0, 0, [128, 133]],
            [133, "pitch", 0, 0, [132, 134, 135, null]],
            [134, ["solfege", { value: "sol" }], 0, 0, [133]],
            [135, ["number", { value: 4 }], 0, 0, [133]],
            [136, "start", 1400, 200, [null, 137, null]],
            [137, "repeat", 0, 0, [136, 138, 139, 140]],
            [138, ["number", { value: 2 }], 0, 0, [137]],
            [139, ["nameddo", { value: "chunk0" }], 0, 0, [137, null]],
            [140, "repeat", 0, 0, [137, 141, 142, 143]],
            [141, ["number", { value: 2 }], 0, 0, [140]],
            [142, ["nameddo", { value: "chunk1" }], 0, 0, [140, null]],
            [143, "repeat", 0, 0, [140, 144, 145, 146]],
            [144, ["number", { value: 2 }], 0, 0, [143]],
            [145, ["nameddo", { value: "chunk2" }], 0, 0, [143, null]],
            [146, "repeat", 0, 0, [143, 147, 148, null]],
            [147, ["number", { value: 2 }], 0, 0, [146]],
            [148, ["nameddo", { value: "chunk3" }], 0, 0, [146, null]]
        ];

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        let blockList = AST2BlockList.toBlockList(AST, config);
        expect(blockList).toEqual(expectedBlockList);
    });

    // Test Dictionary.
    // Support setValue and getValue.
    // Also support function overloading - setValue and getValue can take different number of arguments.
    test("should generate correct blockList for dictionary operations", () => {
        const code = `
        new Mouse(async mouse => {
            await mouse.setValue("key", 2);
            await mouse.setValue("do", await mouse.getValue("key"), "solfege");
            await mouse.setValue("re", 3, "solfege");
            await mouse.setValue("mi", 2, "solfege");
            await mouse.setValue("fa", 1, "solfege");
            await mouse.playNote(1 / 4, async () => {
                await mouse.playPitch("do", await mouse.getValue("do", "solfege"));
                return mouse.ENDFLOW;
            });
            await mouse.playNote(1 / 4, async () => {
                await mouse.playPitch("re", await mouse.getValue("re", "solfege"));
                return mouse.ENDFLOW;
            });
            await mouse.playNote(1 / 4, async () => {
                await mouse.playPitch("mi", await mouse.getValue("mi", "solfege"));
                return mouse.ENDFLOW;
            });
            await mouse.playNote(1 / 4, async () => {
                await mouse.playPitch("fa", await mouse.getValue("fa", "solfege"));
                return mouse.ENDFLOW;
            });
            return mouse.ENDMOUSE;
        });
        MusicBlocks.run();`;

        const expectedBlockList = [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "setDict2", 0, 0, [0, 2, 3, 4]],
            [2, ["text", { value: "key" }], 0, 0, [1]],
            [3, ["number", { value: 2 }], 0, 0, [1]],
            [4, "setDict", 0, 0, [1, 5, 6, 7, 9]],
            [5, ["text", { value: "solfege" }], 0, 0, [4]],
            [6, ["text", { value: "do" }], 0, 0, [4]],
            [7, "getDict2", 0, 0, [4, 8]],
            [8, ["text", { value: "key" }], 0, 0, [7]],
            [9, "setDict", 0, 0, [4, 10, 11, 12, 13]],
            [10, ["text", { value: "solfege" }], 0, 0, [9]],
            [11, ["text", { value: "re" }], 0, 0, [9]],
            [12, ["number", { value: 3 }], 0, 0, [9]],
            [13, "setDict", 0, 0, [9, 14, 15, 16, 17]],
            [14, ["text", { value: "solfege" }], 0, 0, [13]],
            [15, ["text", { value: "mi" }], 0, 0, [13]],
            [16, ["number", { value: 2 }], 0, 0, [13]],
            [17, "setDict", 0, 0, [13, 18, 19, 20, 21]],
            [18, ["text", { value: "solfege" }], 0, 0, [17]],
            [19, ["text", { value: "fa" }], 0, 0, [17]],
            [20, ["number", { value: 1 }], 0, 0, [17]],
            [21, "newnote", 0, 0, [17, 22, 25, 32]],
            [22, "divide", 0, 0, [21, 23, 24]],
            [23, ["number", { value: 1 }], 0, 0, [22]],
            [24, ["number", { value: 4 }], 0, 0, [22]],
            [25, "vspace", 0, 0, [21, 26]],
            [26, "pitch", 0, 0, [25, 27, 28, 31]],
            [27, ["solfege", { value: "do" }], 0, 0, [26]],
            [28, "getDict", 0, 0, [26, 29, 30]],
            [29, ["text", { value: "solfege" }], 0, 0, [28]],
            [30, ["text", { value: "do" }], 0, 0, [28]],
            [31, "vspace", 0, 0, [26, null]],
            [32, "newnote", 0, 0, [21, 33, 36, 43]],
            [33, "divide", 0, 0, [32, 34, 35]],
            [34, ["number", { value: 1 }], 0, 0, [33]],
            [35, ["number", { value: 4 }], 0, 0, [33]],
            [36, "vspace", 0, 0, [32, 37]],
            [37, "pitch", 0, 0, [36, 38, 39, 42]],
            [38, ["solfege", { value: "re" }], 0, 0, [37]],
            [39, "getDict", 0, 0, [37, 40, 41]],
            [40, ["text", { value: "solfege" }], 0, 0, [39]],
            [41, ["text", { value: "re" }], 0, 0, [39]],
            [42, "vspace", 0, 0, [37, null]],
            [43, "newnote", 0, 0, [32, 44, 47, 54]],
            [44, "divide", 0, 0, [43, 45, 46]],
            [45, ["number", { value: 1 }], 0, 0, [44]],
            [46, ["number", { value: 4 }], 0, 0, [44]],
            [47, "vspace", 0, 0, [43, 48]],
            [48, "pitch", 0, 0, [47, 49, 50, 53]],
            [49, ["solfege", { value: "mi" }], 0, 0, [48]],
            [50, "getDict", 0, 0, [48, 51, 52]],
            [51, ["text", { value: "solfege" }], 0, 0, [50]],
            [52, ["text", { value: "mi" }], 0, 0, [50]],
            [53, "vspace", 0, 0, [48, null]],
            [54, "newnote", 0, 0, [43, 55, 58, null]],
            [55, "divide", 0, 0, [54, 56, 57]],
            [56, ["number", { value: 1 }], 0, 0, [55]],
            [57, ["number", { value: 4 }], 0, 0, [55]],
            [58, "vspace", 0, 0, [54, 59]],
            [59, "pitch", 0, 0, [58, 60, 61, 64]],
            [60, ["solfege", { value: "fa" }], 0, 0, [59]],
            [61, "getDict", 0, 0, [59, 62, 63]],
            [62, ["text", { value: "solfege" }], 0, 0, [61]],
            [63, ["text", { value: "fa" }], 0, 0, [61]],
            [64, "vspace", 0, 0, [59, null]]
        ];

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        let blockList = AST2BlockList.toBlockList(AST, config);
        expect(blockList).toEqual(expectedBlockList);
    });

    // Test all Rhythm Blocks.
    test("should generate correct blockList for all rhythm blocks", () => {
        const code = `
        new Mouse(async mouse => {
            await mouse.playNote(1 / 4, async () => {
                await mouse.playPitch("sol", 4);
                return mouse.ENDFLOW;
            });
            await mouse.playNote(1 / 4, async () => {
                await mouse.playPitch("G", 4);
                return mouse.ENDFLOW;
            });
            await mouse.playNote(1 / 4, async () => {
                await mouse.playPitch("5", 4);
                return mouse.ENDFLOW;
            });
            await mouse.playNote(1 / 4, async () => {
                await mouse.playHertz(392);
                return mouse.ENDFLOW;
            });
            await mouse.playNote(1 / 4, async () => {
                await mouse.playRest();
                return mouse.ENDFLOW;
            });
            await mouse.dot(1, async () => {
                await mouse.playNote(1 / 4, async () => {
                    await mouse.playPitch("sol", 4);
                    return mouse.ENDFLOW;
                });
                return mouse.ENDFLOW;
            });
            await mouse.tie(async () => {
                await mouse.playNote(1 / 4, async () => {
                    await mouse.playPitch("sol", 4);
                    return mouse.ENDFLOW;
                });
                await mouse.playNote(1 / 4, async () => {
                    await mouse.playPitch("sol", 4);
                    return mouse.ENDFLOW;
                });
                return mouse.ENDFLOW;
            });
            await mouse.multiplyNoteValue(1 / 2, async () => {
                await mouse.playNote(1 / 4, async () => {
                    await mouse.playPitch("sol", 4);
                    return mouse.ENDFLOW;
                });
                return mouse.ENDFLOW;
            });
            await mouse.swing(1 / 24, 1 / 8, async () => {
                await mouse.playNote(1 / 4, async () => {
                    await mouse.playPitch("sol", 4);
                    return mouse.ENDFLOW;
                });
                await mouse.playNote(1 / 4, async () => {
                    await mouse.playPitch("sol", 4);
                    return mouse.ENDFLOW;
                });
                return mouse.ENDFLOW;
            });
            await mouse.playNoteMillis(1000 / (3 / 2), async () => {
                await mouse.playHertz(392);
                return mouse.ENDFLOW;
            });
            return mouse.ENDMOUSE;
        });
        MusicBlocks.run();`;

        const expectedBlockList = [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "newnote", 0, 0, [0, 2, 5, 9]],
            [2, "divide", 0, 0, [1, 3, 4]],
            [3, ["number", { value: 1 }], 0, 0, [2]],
            [4, ["number", { value: 4 }], 0, 0, [2]],
            [5, "vspace", 0, 0, [1, 6]],
            [6, "pitch", 0, 0, [5, 7, 8, null]],
            [7, ["solfege", { value: "sol" }], 0, 0, [6]],
            [8, ["number", { value: 4 }], 0, 0, [6]],
            [9, "newnote", 0, 0, [1, 10, 13, 17]],
            [10, "divide", 0, 0, [9, 11, 12]],
            [11, ["number", { value: 1 }], 0, 0, [10]],
            [12, ["number", { value: 4 }], 0, 0, [10]],
            [13, "vspace", 0, 0, [9, 14]],
            [14, "pitch", 0, 0, [13, 15, 16, null]],
            [15, ["notename", { value: "G" }], 0, 0, [14]],
            [16, ["number", { value: 4 }], 0, 0, [14]],
            [17, "newnote", 0, 0, [9, 18, 21, 25]],
            [18, "divide", 0, 0, [17, 19, 20]],
            [19, ["number", { value: 1 }], 0, 0, [18]],
            [20, ["number", { value: 4 }], 0, 0, [18]],
            [21, "vspace", 0, 0, [17, 22]],
            [22, "pitch", 0, 0, [21, 23, 24, null]],
            [23, ["solfege", { value: "5" }], 0, 0, [22]],
            [24, ["number", { value: 4 }], 0, 0, [22]],
            [25, "newnote", 0, 0, [17, 26, 29, 32]],
            [26, "divide", 0, 0, [25, 27, 28]],
            [27, ["number", { value: 1 }], 0, 0, [26]],
            [28, ["number", { value: 4 }], 0, 0, [26]],
            [29, "vspace", 0, 0, [25, 30]],
            [30, "hertz", 0, 0, [29, 31, null]],
            [31, ["number", { value: 392 }], 0, 0, [30]],
            [32, "newnote", 0, 0, [25, 33, 36, 38]],
            [33, "divide", 0, 0, [32, 34, 35]],
            [34, ["number", { value: 1 }], 0, 0, [33]],
            [35, ["number", { value: 4 }], 0, 0, [33]],
            [36, "vspace", 0, 0, [32, 37]],
            [37, "rest2", 0, 0, [36, null]],
            [38, "rhythmicdot2", 0, 0, [32, 39, 40, 48]],
            [39, ["number", { value: 1 }], 0, 0, [38]],
            [40, "newnote", 0, 0, [38, 41, 44, null]],
            [41, "divide", 0, 0, [40, 42, 43]],
            [42, ["number", { value: 1 }], 0, 0, [41]],
            [43, ["number", { value: 4 }], 0, 0, [41]],
            [44, "vspace", 0, 0, [40, 45]],
            [45, "pitch", 0, 0, [44, 46, 47, null]],
            [46, ["solfege", { value: "sol" }], 0, 0, [45]],
            [47, ["number", { value: 4 }], 0, 0, [45]],
            [48, "tie", 0, 0, [38, 49, 65]],
            [49, "newnote", 0, 0, [48, 50, 53, 57]],
            [50, "divide", 0, 0, [49, 51, 52]],
            [51, ["number", { value: 1 }], 0, 0, [50]],
            [52, ["number", { value: 4 }], 0, 0, [50]],
            [53, "vspace", 0, 0, [49, 54]],
            [54, "pitch", 0, 0, [53, 55, 56, null]],
            [55, ["solfege", { value: "sol" }], 0, 0, [54]],
            [56, ["number", { value: 4 }], 0, 0, [54]],
            [57, "newnote", 0, 0, [49, 58, 61, null]],
            [58, "divide", 0, 0, [57, 59, 60]],
            [59, ["number", { value: 1 }], 0, 0, [58]],
            [60, ["number", { value: 4 }], 0, 0, [58]],
            [61, "vspace", 0, 0, [57, 62]],
            [62, "pitch", 0, 0, [61, 63, 64, null]],
            [63, ["solfege", { value: "sol" }], 0, 0, [62]],
            [64, ["number", { value: 4 }], 0, 0, [62]],
            [65, "multiplybeatfactor", 0, 0, [48, 66, 69, 78]],
            [66, "divide", 0, 0, [65, 67, 68]],
            [67, ["number", { value: 1 }], 0, 0, [66]],
            [68, ["number", { value: 2 }], 0, 0, [66]],
            [69, "vspace", 0, 0, [65, 70]],
            [70, "newnote", 0, 0, [69, 71, 74, null]],
            [71, "divide", 0, 0, [70, 72, 73]],
            [72, ["number", { value: 1 }], 0, 0, [71]],
            [73, ["number", { value: 4 }], 0, 0, [71]],
            [74, "vspace", 0, 0, [70, 75]],
            [75, "pitch", 0, 0, [74, 76, 77, null]],
            [76, ["solfege", { value: "sol" }], 0, 0, [75]],
            [77, ["number", { value: 4 }], 0, 0, [75]],
            [78, "newswing2", 0, 0, [65, 79, 82, 85, 103]],
            [79, "divide", 0, 0, [78, 80, 81]],
            [80, ["number", { value: 1 }], 0, 0, [79]],
            [81, ["number", { value: 24 }], 0, 0, [79]],
            [82, "divide", 0, 0, [78, 83, 84]],
            [83, ["number", { value: 1 }], 0, 0, [82]],
            [84, ["number", { value: 8 }], 0, 0, [82]],
            [85, "vspace", 0, 0, [78, 86]],
            [86, "vspace", 0, 0, [85, 87]],
            [87, "newnote", 0, 0, [86, 88, 91, 95]],
            [88, "divide", 0, 0, [87, 89, 90]],
            [89, ["number", { value: 1 }], 0, 0, [88]],
            [90, ["number", { value: 4 }], 0, 0, [88]],
            [91, "vspace", 0, 0, [87, 92]],
            [92, "pitch", 0, 0, [91, 93, 94, null]],
            [93, ["solfege", { value: "sol" }], 0, 0, [92]],
            [94, ["number", { value: 4 }], 0, 0, [92]],
            [95, "newnote", 0, 0, [87, 96, 99, null]],
            [96, "divide", 0, 0, [95, 97, 98]],
            [97, ["number", { value: 1 }], 0, 0, [96]],
            [98, ["number", { value: 4 }], 0, 0, [96]],
            [99, "vspace", 0, 0, [95, 100]],
            [100, "pitch", 0, 0, [99, 101, 102, null]],
            [101, ["solfege", { value: "sol" }], 0, 0, [100]],
            [102, ["number", { value: 4 }], 0, 0, [100]],
            [103, "osctime", 0, 0, [78, 104, 109, null]],
            [104, "divide", 0, 0, [103, 105, 106]],
            [105, ["number", { value: 1000 }], 0, 0, [104]],
            [106, "divide", 0, 0, [104, 107, 108]],
            [107, ["number", { value: 3 }], 0, 0, [106]],
            [108, ["number", { value: 2 }], 0, 0, [106]],
            [109, "vspace", 0, 0, [103, 110]],
            [110, "vspace", 0, 0, [109, 111]],
            [111, "hertz", 0, 0, [110, 112, null]],
            [112, ["number", { value: 392 }], 0, 0, [111]]
        ];

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        let blockList = AST2BlockList.toBlockList(AST, config);
        expect(blockList).toEqual(expectedBlockList);
    });

    // Test all Flow Blocks.
    test("should generate correct blockList for all flow blocks", () => {
        const code = `
        new Mouse(async mouse => {
            if (true) {
                await mouse.playNote(1 / 4, async () => {
                    await mouse.playPitch("sol", 4);
                    return mouse.ENDFLOW;
                });
                await mouse.playNote(1 / 4, async () => {
                    await mouse.playPitch("sol", 4);
                    return mouse.ENDFLOW;
                });
                await mouse.playNote(1 / 4, async () => {
                    await mouse.playPitch("sol", 4);
                    return mouse.ENDFLOW;
                });
            } else {
                await mouse.playNote(1 / 4, async () => {
                    await mouse.playPitch("sol", 4);
                    return mouse.ENDFLOW;
                });
                await mouse.playNote(1 / 6, async () => {
                    await mouse.playPitch("sol", 4);
                    return mouse.ENDFLOW;
                });
            }
            while (1000) {
                await mouse.playNote(1 / 4, async () => {
                    await mouse.playPitch("sol", 4);
                    return mouse.ENDFLOW;
                });
                break;
            }
            while (1000) {
                await mouse.playNote(1 / 4, async () => {
                    await mouse.playPitch("sol", 4);
                    return mouse.ENDFLOW;
                });
            }
            do {
                await mouse.playNote(1 / 4, async () => {
                    await mouse.playPitch("sol", 4);
                    return mouse.ENDFLOW;
                });
            } while (true);
            switch (1) {
                case 1:
                    await mouse.playNote(1 / 4, async () => {
                        await mouse.playPitch("sol", 4);
                        return mouse.ENDFLOW;
                    });
                    break;
                    break;
                    break;
                default:
                    await mouse.playNote(1 / 4, async () => {
                        await mouse.playPitch("5", 4);
                        return mouse.ENDFLOW;
                    });
            }
            return mouse.ENDMOUSE;
        });
        MusicBlocks.run();`;

        const expectedBlockList = [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "ifthenelse", 0, 0, [0, 2, 3, 27, 43]],
            [2, ["boolean", { value: true }], 0, 0, [1]],
            [3, "newnote", 0, 0, [1, 4, 7, 11]],
            [4, "divide", 0, 0, [3, 5, 6]],
            [5, ["number", { value: 1 }], 0, 0, [4]],
            [6, ["number", { value: 4 }], 0, 0, [4]],
            [7, "vspace", 0, 0, [3, 8]],
            [8, "pitch", 0, 0, [7, 9, 10, null]],
            [9, ["solfege", { value: "sol" }], 0, 0, [8]],
            [10, ["number", { value: 4 }], 0, 0, [8]],
            [11, "newnote", 0, 0, [3, 12, 15, 19]],
            [12, "divide", 0, 0, [11, 13, 14]],
            [13, ["number", { value: 1 }], 0, 0, [12]],
            [14, ["number", { value: 4 }], 0, 0, [12]],
            [15, "vspace", 0, 0, [11, 16]],
            [16, "pitch", 0, 0, [15, 17, 18, null]],
            [17, ["solfege", { value: "sol" }], 0, 0, [16]],
            [18, ["number", { value: 4 }], 0, 0, [16]],
            [19, "newnote", 0, 0, [11, 20, 23, null]],
            [20, "divide", 0, 0, [19, 21, 22]],
            [21, ["number", { value: 1 }], 0, 0, [20]],
            [22, ["number", { value: 4 }], 0, 0, [20]],
            [23, "vspace", 0, 0, [19, 24]],
            [24, "pitch", 0, 0, [23, 25, 26, null]],
            [25, ["solfege", { value: "sol" }], 0, 0, [24]],
            [26, ["number", { value: 4 }], 0, 0, [24]],
            [27, "newnote", 0, 0, [1, 28, 31, 35]],
            [28, "divide", 0, 0, [27, 29, 30]],
            [29, ["number", { value: 1 }], 0, 0, [28]],
            [30, ["number", { value: 4 }], 0, 0, [28]],
            [31, "vspace", 0, 0, [27, 32]],
            [32, "pitch", 0, 0, [31, 33, 34, null]],
            [33, ["solfege", { value: "sol" }], 0, 0, [32]],
            [34, ["number", { value: 4 }], 0, 0, [32]],
            [35, "newnote", 0, 0, [27, 36, 39, null]],
            [36, "divide", 0, 0, [35, 37, 38]],
            [37, ["number", { value: 1 }], 0, 0, [36]],
            [38, ["number", { value: 6 }], 0, 0, [36]],
            [39, "vspace", 0, 0, [35, 40]],
            [40, "pitch", 0, 0, [39, 41, 42, null]],
            [41, ["solfege", { value: "sol" }], 0, 0, [40]],
            [42, ["number", { value: 4 }], 0, 0, [40]],
            [43, "forever", 0, 0, [1, 44, 53]],
            [44, "newnote", 0, 0, [43, 45, 48, 52]],
            [45, "divide", 0, 0, [44, 46, 47]],
            [46, ["number", { value: 1 }], 0, 0, [45]],
            [47, ["number", { value: 4 }], 0, 0, [45]],
            [48, "vspace", 0, 0, [44, 49]],
            [49, "pitch", 0, 0, [48, 50, 51, null]],
            [50, ["solfege", { value: "sol" }], 0, 0, [49]],
            [51, ["number", { value: 4 }], 0, 0, [49]],
            [52, "break", 0, 0, [44, null]],
            [53, "forever", 0, 0, [43, 54, 62]],
            [54, "newnote", 0, 0, [53, 55, 58, null]],
            [55, "divide", 0, 0, [54, 56, 57]],
            [56, ["number", { value: 1 }], 0, 0, [55]],
            [57, ["number", { value: 4 }], 0, 0, [55]],
            [58, "vspace", 0, 0, [54, 59]],
            [59, "pitch", 0, 0, [58, 60, 61, null]],
            [60, ["solfege", { value: "sol" }], 0, 0, [59]],
            [61, ["number", { value: 4 }], 0, 0, [59]],
            [62, "until", 0, 0, [53, 63, 64, 72]],
            [63, ["boolean", { value: true }], 0, 0, [62]],
            [64, "newnote", 0, 0, [62, 65, 68, null]],
            [65, "divide", 0, 0, [64, 66, 67]],
            [66, ["number", { value: 1 }], 0, 0, [65]],
            [67, ["number", { value: 4 }], 0, 0, [65]],
            [68, "vspace", 0, 0, [64, 69]],
            [69, "pitch", 0, 0, [68, 70, 71, null]],
            [70, ["solfege", { value: "sol" }], 0, 0, [69]],
            [71, ["number", { value: 4 }], 0, 0, [69]],
            [72, "switch", 0, 0, [62, 73, 74, null]],
            [73, ["number", { value: 1 }], 0, 0, [72]],
            [74, "case", 0, 0, [72, 75, 76, 87]],
            [75, ["number", { value: 1 }], 0, 0, [74]],
            [76, "newnote", 0, 0, [74, 77, 80, 84]],
            [77, "divide", 0, 0, [76, 78, 79]],
            [78, ["number", { value: 1 }], 0, 0, [77]],
            [79, ["number", { value: 4 }], 0, 0, [77]],
            [80, "vspace", 0, 0, [76, 81]],
            [81, "pitch", 0, 0, [80, 82, 83, null]],
            [82, ["solfege", { value: "sol" }], 0, 0, [81]],
            [83, ["number", { value: 4 }], 0, 0, [81]],
            [84, "break", 0, 0, [76, 85]],
            [85, "break", 0, 0, [84, 86]],
            [86, "break", 0, 0, [85, null]],
            [87, "defaultcase", 0, 0, [74, 88, null]],
            [88, "newnote", 0, 0, [87, 89, 92, null]],
            [89, "divide", 0, 0, [88, 90, 91]],
            [90, ["number", { value: 1 }], 0, 0, [89]],
            [91, ["number", { value: 4 }], 0, 0, [89]],
            [92, "vspace", 0, 0, [88, 93]],
            [93, "pitch", 0, 0, [92, 94, 95, null]],
            [94, ["solfege", { value: "5" }], 0, 0, [93]],
            [95, ["number", { value: 4 }], 0, 0, [93]]
        ];

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        let blockList = AST2BlockList.toBlockList(AST, config);
        expect(blockList).toEqual(expectedBlockList);
    });

    // Test all Meter Blocks.
    test("should generate correct blockList for all meter blocks", () => {
        const code = `
        new Mouse(async mouse => {
            await mouse.setMeter(4, 1 / 4);
            mouse.PICKUP = 0 / 4;
            await mouse.setBPM(90, 1 / 4);
            await mouse.setMasterBPM(90, 1 / 4);
            await mouse.onEveryNoteDo("action");
            await mouse.setNoClock(async () => {
                await mouse.onStrongBeatDo(mouse.BEATCOUNT, "action");
                await mouse.onStrongBeatDo(mouse.MEASURECOUNT, "action");
                await mouse.onStrongBeatDo(mouse.BPM, "action");
                await mouse.onStrongBeatDo(mouse.BEATFACTOR, "action");
                await mouse.onEveryBeatDo("action");
                await mouse.onWeakBeatDo("action");
                return mouse.ENDFLOW;
            });
            return mouse.ENDMOUSE;
        });
        MusicBlocks.run();`;

        const expectedBlockList = [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "meter", 0, 0, [0, 2, 3, 6]],
            [2, ["number", { value: 4 }], 0, 0, [1]],
            [3, "divide", 0, 0, [1, 4, 5]],
            [4, ["number", { value: 1 }], 0, 0, [3]],
            [5, ["number", { value: 4 }], 0, 0, [3]],
            [6, "vspace", 0, 0, [1, 7]],
            [7, "pickup", 0, 0, [6, 8, 11]],
            [8, "divide", 0, 0, [7, 9, 10]],
            [9, ["number", { value: 0 }], 0, 0, [8]],
            [10, ["number", { value: 4 }], 0, 0, [8]],
            [11, "vspace", 0, 0, [7, 12]],
            [12, "setbpm3", 0, 0, [11, 13, 14, 17]],
            [13, ["number", { value: 90 }], 0, 0, [12]],
            [14, "divide", 0, 0, [12, 15, 16]],
            [15, ["number", { value: 1 }], 0, 0, [14]],
            [16, ["number", { value: 4 }], 0, 0, [14]],
            [17, "vspace", 0, 0, [12, 18]],
            [18, "setmasterbpm2", 0, 0, [17, 19, 20, 23]],
            [19, ["number", { value: 90 }], 0, 0, [18]],
            [20, "divide", 0, 0, [18, 21, 22]],
            [21, ["number", { value: 1 }], 0, 0, [20]],
            [22, ["number", { value: 4 }], 0, 0, [20]],
            [23, "vspace", 0, 0, [18, 24]],
            [24, "everybeatdo", 0, 0, [23, 25, 26]],
            [25, ["text", { value: "action" }], 0, 0, [24]],
            [26, "drift", 0, 0, [24, 27, null]],
            [27, "onbeatdo", 0, 0, [26, 28, 29, 30]],
            [28, "nopValueBlock", 0, 0, [27]],
            [29, ["text", { value: "action" }], 0, 0, [27]],
            [30, "onbeatdo", 0, 0, [27, 31, 32, 33]],
            [31, "nopValueBlock", 0, 0, [30]],
            [32, ["text", { value: "action" }], 0, 0, [30]],
            [33, "onbeatdo", 0, 0, [30, 34, 35, 36]],
            [34, "nopValueBlock", 0, 0, [33]],
            [35, ["text", { value: "action" }], 0, 0, [33]],
            [36, "onbeatdo", 0, 0, [33, 37, 38, 39]],
            [37, "beatfactor", 0, 0, [36]],
            [38, ["text", { value: "action" }], 0, 0, [36]],
            [39, "everybeatdonew", 0, 0, [36, 40, 41]],
            [40, ["text", { value: "action" }], 0, 0, [39]],
            [41, "offbeatdo", 0, 0, [39, 42, null]],
            [42, ["text", { value: "action" }], 0, 0, [41]]
        ];

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        let blockList = AST2BlockList.toBlockList(AST, config);
        expect(blockList).toEqual(expectedBlockList);
    });

    // Test all Pitch Blocks.
    test("should generate correct blockList for all pitch blocks", () => {
        const code = `
        new Mouse(async mouse => {
            await mouse.playPitch("sol", 4);
            await mouse.playPitch("G", 4);
            await mouse.stepPitch(1);
            await mouse.playNthModalPitch(4, 4);
            await mouse.playPitchNumber(7);
            await mouse.setAccidental("sharp ♯", async () => {
                await mouse.playNote(1 / 4, async () => {
                    await mouse.playPitch("sol", 4);
                    return mouse.ENDFLOW;
                });
                return mouse.ENDFLOW;
            });
            await mouse.playHertz(392);
            await mouse.setScalarTranspose(0 + 0 * mouse.MODELENGTH, async () => {
                return mouse.ENDFLOW;
            });
            await mouse.setSemitoneTranspose(1 + 0 * 12, async () => {
                return mouse.ENDFLOW;
            });
            await mouse.setSemitoneTranspose(50 / 100, async () => {
                await mouse.playNote(1 / 4, async () => {
                    await mouse.playPitch("sol", 4);
                    return mouse.ENDFLOW;
                });
                return mouse.ENDFLOW;
            });
            await mouse.setRegister(0);
            await mouse.invert("sol", 4, "even", async () => {
                await mouse.setPitchNumberOffset("C", 4);
                await mouse.setPitchNumberOffset("C", -1);
                return mouse.ENDFLOW;
            });
            return mouse.ENDMOUSE;
        });
        MusicBlocks.run();`;

        const expectedBlockList = [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "pitch", 0, 0, [0, 2, 3, 4]],
            [2, ["solfege", { value: "sol" }], 0, 0, [1]],
            [3, ["number", { value: 4 }], 0, 0, [1]],
            [4, "pitch", 0, 0, [1, 5, 6, 7]],
            [5, ["notename", { value: "G" }], 0, 0, [4]],
            [6, ["number", { value: 4 }], 0, 0, [4]],
            [7, "steppitch", 0, 0, [4, 8, 9]],
            [8, ["number", { value: 1 }], 0, 0, [7]],
            [9, "nthmodalpitch", 0, 0, [7, 10, 11, 12]],
            [10, ["number", { value: 4 }], 0, 0, [9]],
            [11, ["number", { value: 4 }], 0, 0, [9]],
            [12, "pitchnumber", 0, 0, [9, 13, 14]],
            [13, ["number", { value: 7 }], 0, 0, [12]],
            [14, "accidental", 0, 0, [12, 15, 16, 24]],
            [15, ["text", { value: "sharp ♯" }], 0, 0, [14]],
            [16, "newnote", 0, 0, [14, 17, 20, null]],
            [17, "divide", 0, 0, [16, 18, 19]],
            [18, ["number", { value: 1 }], 0, 0, [17]],
            [19, ["number", { value: 4 }], 0, 0, [17]],
            [20, "vspace", 0, 0, [16, 21]],
            [21, "pitch", 0, 0, [20, 22, 23, null]],
            [22, ["solfege", { value: "sol" }], 0, 0, [21]],
            [23, ["number", { value: 4 }], 0, 0, [21]],
            [24, "hertz", 0, 0, [14, 25, 26]],
            [25, ["number", { value: 392 }], 0, 0, [24]],
            [26, "setscalartransposition", 0, 0, [24, 27, null, 28]],
            [27, ["modelength", {}], 0, 0, [26]],
            [28, "settransposition", 0, 0, [26, 29, null, 34]],
            [29, "plus", 0, 0, [28, 30, 31]],
            [30, ["number", { value: 1 }], 0, 0, [29]],
            [31, "multiply", 0, 0, [29, 32, 33]],
            [32, ["number", { value: 0 }], 0, 0, [31]],
            [33, ["number", { value: 12 }], 0, 0, [31]],
            [34, "settransposition", 0, 0, [28, 35, 38, 47]],
            [35, "divide", 0, 0, [34, 36, 37]],
            [36, ["number", { value: 50 }], 0, 0, [35]],
            [37, ["number", { value: 100 }], 0, 0, [35]],
            [38, "vspace", 0, 0, [34, 39]],
            [39, "newnote", 0, 0, [38, 40, 43, null]],
            [40, "divide", 0, 0, [39, 41, 42]],
            [41, ["number", { value: 1 }], 0, 0, [40]],
            [42, ["number", { value: 4 }], 0, 0, [40]],
            [43, "vspace", 0, 0, [39, 44]],
            [44, "pitch", 0, 0, [43, 45, 46, null]],
            [45, ["solfege", { value: "sol" }], 0, 0, [44]],
            [46, ["number", { value: 4 }], 0, 0, [44]],
            [47, "register", 0, 0, [34, 48, 49]],
            [48, ["number", { value: 0 }], 0, 0, [47]],
            [49, "invert1", 0, 0, [47, 50, 51, 52, 53, null]],
            [50, ["solfege", { value: "sol" }], 0, 0, [49]],
            [51, ["number", { value: 4 }], 0, 0, [49]],
            [52, ["text", { value: "even" }], 0, 0, [49]],
            [53, "setpitchnumberoffset", 0, 0, [49, 54, 55, 56]],
            [54, ["notename", { value: "C" }], 0, 0, [53]],
            [55, ["number", { value: 4 }], 0, 0, [53]],
            [56, "setpitchnumberoffset", 0, 0, [53, 57, 58, null]],
            [57, ["notename", { value: "C" }], 0, 0, [56]],
            [58, "neg", 0, 0, [56, 59]],
            [59, ["number", { value: 1 }], 0, 0, [58]]
        ];

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        let blockList = AST2BlockList.toBlockList(AST, config);
        expect(blockList).toEqual(expectedBlockList);
    });

    // Test all Interval Blocks.
    test("should generate correct blockList for all interval blocks", () => {
        const code = `
        new Mouse(async mouse => {
            await mouse.setKey("C", "major");
            await mouse.setScalarInterval(5, async () => {
                return mouse.ENDFLOW;
            });
            await mouse.setSemitoneInterval(4 + 0 * 12, async () => {
                return mouse.ENDFLOW;
            });
            await mouse.setSemitoneInterval("major 3" + 0 * 12, async () => {
                return mouse.ENDFLOW;
            });
            await mouse.setTemperament("equal", "C", 4);
            return mouse.ENDMOUSE;
        });
        MusicBlocks.run();`;

        const expectedBlockList = [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "setkey2", 0, 0, [0, 2, 3, 4]],
            [2, ["notename", { value: "C" }], 0, 0, [1]],
            [3, ["modename", { value: "major" }], 0, 0, [1]],
            [4, "interval", 0, 0, [1, 5, null, 6]],
            [5, ["number", { value: 5 }], 0, 0, [4]],
            [6, "semitoneinterval", 0, 0, [4, 7, null, 8]],
            [7, ["intervalname", {}], 0, 0, [6]],
            [8, "semitoneinterval", 0, 0, [6, 9, null, 10]],
            [9, ["intervalname", {}], 0, 0, [8]],
            [10, "settemperament", 0, 0, [8, 11, 12, 13, null]],
            [11, ["temperamentname", { value: "equal" }], 0, 0, [10]],
            [12, ["notename", { value: "C" }], 0, 0, [10]],
            [13, ["number", { value: 4 }], 0, 0, [10]]
        ];

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        let blockList = AST2BlockList.toBlockList(AST, config);
        expect(blockList).toEqual(expectedBlockList);
    });

    // Test all Tone Blocks.
    test("should generate correct blockList for all tone blocks", () => {
        const code = `
        new Mouse(async mouse => {
            await mouse.setInstrument("electronic synth", async () => {
                return mouse.ENDFLOW;
            });
            await mouse.doVibrato(5, 1 / 16, async () => {
                return mouse.ENDFLOW;
            });
            await mouse.doChorus(1.5, 3.5, 70, async () => {
                return mouse.ENDFLOW;
            });
            await mouse.doPhaser(0.5, 3, 392, async () => {
                return mouse.ENDFLOW;
            });
            await mouse.doTremolo(10, 50, async () => {
                return mouse.ENDFLOW;
            });
            await mouse.doDistortion(40, async () => {
                return mouse.ENDFLOW;
            });
            await mouse.doHarmonic(1, async () => {
                return mouse.ENDFLOW;
            });
            return mouse.ENDMOUSE;
        });
        MusicBlocks.run();`;

        const expectedBlockList = [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "settimbre", 0, 0, [0, 2, null, 3]],
            [2, ["voicename", { value: "electronic synth" }], 0, 0, [1]],
            [3, "vibrato", 0, 0, [1, 4, 5, null, 8]],
            [4, ["number", { value: 5 }], 0, 0, [3]],
            [5, "divide", 0, 0, [3, 6, 7]],
            [6, ["number", { value: 1 }], 0, 0, [5]],
            [7, ["number", { value: 16 }], 0, 0, [5]],
            [8, "chorus", 0, 0, [3, 9, 10, 11, null, 12]],
            [9, ["number", { value: 1.5 }], 0, 0, [8]],
            [10, ["number", { value: 3.5 }], 0, 0, [8]],
            [11, ["number", { value: 70 }], 0, 0, [8]],
            [12, "phaser", 0, 0, [8, 13, 14, 15, null, 16]],
            [13, ["number", { value: 0.5 }], 0, 0, [12]],
            [14, ["number", { value: 3 }], 0, 0, [12]],
            [15, ["number", { value: 392 }], 0, 0, [12]],
            [16, "tremolo", 0, 0, [12, 17, 18, null, 19]],
            [17, ["number", { value: 10 }], 0, 0, [16]],
            [18, ["number", { value: 50 }], 0, 0, [16]],
            [19, "dis", 0, 0, [16, 20, null, 21]],
            [20, ["number", { value: 40 }], 0, 0, [19]],
            [21, "harmonic2", 0, 0, [19, 22, null, null]],
            [22, ["number", { value: 1 }], 0, 0, [21]]
        ];

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        let blockList = AST2BlockList.toBlockList(AST, config);
        expect(blockList).toEqual(expectedBlockList);
    });

    // Test all Ornament, Volume, and Drums Blocks.
    test("should generate correct blockList for all Ornament, Volume, and Drums blocks", () => {
        const code = `
        new Mouse(async mouse => {
            await mouse.setStaccato(1 / 32, async () => {
                return mouse.ENDFLOW;
            });
            await mouse.setSlur(1 / 16, async () => {
                return mouse.ENDFLOW;
            });
            await mouse.doNeighbor(1, 1 / 16, async () => {
                return mouse.ENDFLOW;
            });
            await mouse.doCrescendo(5, async () => {
                return mouse.ENDFLOW;
            });
            await mouse.doDecrescendo(5, async () => {
                return mouse.ENDFLOW;
            });
            await mouse.setRelativeVolume(25, async () => {
                return mouse.ENDFLOW;
            });
            mouse.MASTERVOLUME = 50;
            mouse.PANNING = 0;
            await mouse.setSynthVolume("electronic synth", 50);
            await mouse.setSynthVolume("kick drum", 50);
            await mouse.playDrum("kick drum");
            await mouse.playDrum("duck");
            await mouse.mapPitchToDrum("kick drum", async () => {
                await mouse.playPitch("sol", 4);
                return mouse.ENDFLOW;
            });
            return mouse.ENDMOUSE;
        });
        MusicBlocks.run();`;

        const expectedBlockList = [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "newstaccato", 0, 0, [0, 2, null, 5]],
            [2, "divide", 0, 0, [1, 3, 4]],
            [3, ["number", { value: 1 }], 0, 0, [2]],
            [4, ["number", { value: 32 }], 0, 0, [2]],
            [5, "newslur", 0, 0, [1, 6, null, 9]],
            [6, "divide", 0, 0, [5, 7, 8]],
            [7, ["number", { value: 1 }], 0, 0, [6]],
            [8, ["number", { value: 16 }], 0, 0, [6]],
            [9, "neighbor2", 0, 0, [5, 10, 11, null, 14]],
            [10, ["number", { value: 1 }], 0, 0, [9]],
            [11, "divide", 0, 0, [9, 12, 13]],
            [12, ["number", { value: 1 }], 0, 0, [11]],
            [13, ["number", { value: 16 }], 0, 0, [11]],
            [14, "crescendo", 0, 0, [9, 15, null, 16]],
            [15, ["number", { value: 5 }], 0, 0, [14]],
            [16, "decrescendo", 0, 0, [14, 17, null, 18]],
            [17, ["number", { value: 5 }], 0, 0, [16]],
            [18, "articulation", 0, 0, [16, 19, null, 20]],
            [19, ["number", { value: 25 }], 0, 0, [18]],
            [20, "setnotevolume", 0, 0, [18, 21, 22]],
            [21, ["number", { value: 50 }], 0, 0, [20]],
            [22, "setpanning", 0, 0, [20, 23, 24]],
            [23, ["number", { value: 0 }], 0, 0, [22]],
            [24, "setsynthvolume", 0, 0, [22, 25, 26, 27]],
            [25, ["voicename", { value: "electronic synth" }], 0, 0, [24]],
            [26, ["number", { value: 50 }], 0, 0, [24]],
            [27, "setsynthvolume", 0, 0, [24, 28, 29, 30]],
            [28, ["voicename", { value: "kick drum" }], 0, 0, [27]],
            [29, ["number", { value: 50 }], 0, 0, [27]],
            [30, "playdrum", 0, 0, [27, 31, 32]],
            [31, ["drumname", { value: "kick drum" }], 0, 0, [30]],
            [32, "playdrum", 0, 0, [30, 33, 34]],
            [33, ["drumname", { value: "duck" }], 0, 0, [32]],
            [34, "mapdrum", 0, 0, [32, 35, 36, null]],
            [35, ["drumname", { value: "kick drum" }], 0, 0, [34]],
            [36, "pitch", 0, 0, [34, 37, 38, null]],
            [37, ["solfege", { value: "sol" }], 0, 0, [36]],
            [38, ["number", { value: 4 }], 0, 0, [36]]
        ];

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        let blockList = AST2BlockList.toBlockList(AST, config);
        expect(blockList).toEqual(expectedBlockList);
    });

    // Test all Graphics and Pen Blocks.
    test("should generate correct blockList for all Graphics and Pen blocks", () => {
        const code = `
        new Mouse(async mouse => {
            await mouse.goForward(100);
            await mouse.goBackward(100);
            await mouse.turnLeft(90);
            await mouse.turnRight(90);
            await mouse.setXY(0, 0);
            await mouse.setHeading(0);
            await mouse.drawArc(90, 100);
            await mouse.setBezierControlPoint1(100, 75);
            await mouse.setBezierControlPoint2(100, 25);
            await mouse.drawBezier(0, 100);
            await mouse.clear();
            await mouse.scrollXY(100, 0);
            await mouse.setColor(0);
            await mouse.setGrey(100);
            await mouse.setShade(50);
            await mouse.setHue(80);
            await mouse.setTranslucency(50);
            await mouse.setPensize(5);
            await mouse.penUp();
            await mouse.penDown();
            await mouse.fillBackground();
            await mouse.setFont("sans-serif");
            return mouse.ENDMOUSE;
        });
        MusicBlocks.run();`;

        const expectedBlockList = [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "forward", 0, 0, [0, 2, 3]],
            [2, ["number", { value: 100 }], 0, 0, [1]],
            [3, "back", 0, 0, [1, 4, 5]],
            [4, ["number", { value: 100 }], 0, 0, [3]],
            [5, "left", 0, 0, [3, 6, 7]],
            [6, ["number", { value: 90 }], 0, 0, [5]],
            [7, "right", 0, 0, [5, 8, 9]],
            [8, ["number", { value: 90 }], 0, 0, [7]],
            [9, "setxy", 0, 0, [7, 10, 11, 12]],
            [10, ["number", { value: 0 }], 0, 0, [9]],
            [11, ["number", { value: 0 }], 0, 0, [9]],
            [12, "setheading", 0, 0, [9, 13, 14]],
            [13, ["number", { value: 0 }], 0, 0, [12]],
            [14, "arc", 0, 0, [12, 15, 16, 17]],
            [15, ["number", { value: 90 }], 0, 0, [14]],
            [16, ["number", { value: 100 }], 0, 0, [14]],
            [17, "controlpoint1", 0, 0, [14, 18, 19, 20]],
            [18, ["number", { value: 100 }], 0, 0, [17]],
            [19, ["number", { value: 75 }], 0, 0, [17]],
            [20, "controlpoint2", 0, 0, [17, 21, 22, 23]],
            [21, ["number", { value: 100 }], 0, 0, [20]],
            [22, ["number", { value: 25 }], 0, 0, [20]],
            [23, "bezier", 0, 0, [20, 24, 25, 26]],
            [24, ["number", { value: 0 }], 0, 0, [23]],
            [25, ["number", { value: 100 }], 0, 0, [23]],
            [26, "clear", 0, 0, [23, 27]],
            [27, "scrollxy", 0, 0, [26, 28, 29, 30]],
            [28, ["x", { value: 100 }], 0, 0, [27]],
            [29, ["y", { value: 0 }], 0, 0, [27]],
            [30, "setcolor", 0, 0, [27, 31, 32]],
            [31, ["number", { value: 0 }], 0, 0, [30]],
            [32, "setgrey", 0, 0, [30, 33, 34]],
            [33, ["grey", { value: 100 }], 0, 0, [32]],
            [34, "setshade", 0, 0, [32, 35, 36]],
            [35, ["shade", { value: 50 }], 0, 0, [34]],
            [36, "sethue", 0, 0, [34, 37, 38]],
            [37, ["color", { value: 80 }], 0, 0, [36]],
            [38, "settranslucency", 0, 0, [36, 39, 40]],
            [39, ["number", { value: 50 }], 0, 0, [38]],
            [40, "setpensize", 0, 0, [38, 41, 42]],
            [41, ["pensize", { value: 5 }], 0, 0, [40]],
            [42, "penup", 0, 0, [40, 43]],
            [43, "pendown", 0, 0, [42, 44]],
            [44, "background", 0, 0, [43, 45]],
            [45, "setfont", 0, 0, [44, 46, null]],
            [46, ["text", { value: "sans-serif" }], 0, 0, [45]]
        ];

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        let blockList = AST2BlockList.toBlockList(AST, config);
        expect(blockList).toEqual(expectedBlockList);
    });
});
