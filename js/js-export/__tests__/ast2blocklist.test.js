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

describe("AST2BlockList Class", () => {
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
        expect(() => AST2BlockList.toTrees(AST)).toThrow("Unsupported AsyncCallExpression: mouse.setMusicInstrument");
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
            AST2BlockList.toTrees(AST);
        } catch (e) {
            expect(e.prefix + code.substring(e.start, e.end)).toEqual("Unsupported AssignmentExpression: box1 = box2 - 1");
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
        expect(() => AST2BlockList.toTrees(AST)).toThrow("Unsupported binary operator: <<");
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
        expect(() => AST2BlockList.toTrees(AST)).toThrow("Unsupported unary operator: ~");
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
        expect(() => AST2BlockList.toTrees(AST)).toThrow("Unsupported function call: Math.unsupported");
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
            AST2BlockList.toTrees(AST);
        } catch (e) {
            expect(e.prefix + code.substring(e.start, e.end)).toEqual("Unsupported argument type ArrayExpression: [1]");
        }
    });

    // Test unsupported statement should throw an error.
    test("should throw error for unsupported statement", () => {
        const code = "console.log('test');";

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        try {
            AST2BlockList.toTrees(AST);
        } catch (e) {
            expect(e.prefix + code.substring(e.start, e.end)).toEqual("Unsupported statement: console.log('test');");
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
            [2, ["voicename", { "value": "guitar" }], 0, 0, [1]],
            [3, "newnote", 0, 0, [1, 4, 9, null]],
            [4, "multiply", 0, 0, [3, 5, 8]],
            [5, "abs", 0, 0, [4, 6]],
            [6, "neg", 0, 0, [5, 7]],
            [7, ["number", { "value": 2 }], 0, 0, [6]],
            [8, ["number", { "value": 1 }], 0, 0, [4]],
            [9, "vspace", 0, 0, [3, 10]],
            [10, "pitch", 0, 0, [9, 11, 12, null]],
            [11, ["notename", { "value": "G♭" }], 0, 0, [10]],
            [12, "abs", 0, 0, [10, 13]],
            [13, "neg", 0, 0, [12, 14]],
            [14, ["number", { "value": 2 }], 0, 0, [13]]
        ];

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        let trees = AST2BlockList.toTrees(AST);
        let blockList = AST2BlockList.toBlockList(trees);
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
            [2, ["voicename", { "value": "clarinet" }], 0, 0, [1]],
            [3, "repeat", 0, 0, [1, 4, 7, null]],
            [4, "random", 0, 0, [3, 5, 6]],
            [5, ["number", { "value": 1 }], 0, 0, [4]],
            [6, ["number", { "value": 5 }], 0, 0, [4]],
            [7, "vspace", 0, 0, [3, 8]],
            [8, "newnote", 0, 0, [7, 9, 12, null]],
            [9, "divide", 0, 0, [8, 10, 11]],
            [10, ["number", { "value": 1 }], 0, 0, [9]],
            [11, ["number", { "value": 4 }], 0, 0, [9]],
            [12, "vspace", 0, 0, [8, 13]],
            [13, "pitch", 0, 0, [12, 14, 15, 18]],
            [14, ["solfege", { "value": "fa" }], 0, 0, [13]],
            [15, "multiply", 0, 0, [13, 16, 17]],
            [16, ["number", { "value": 2 }], 0, 0, [15]],
            [17, ["number", { "value": 2 }], 0, 0, [15]],
            [18, "vspace", 0, 0, [13, null]]
        ];

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        let trees = AST2BlockList.toTrees(AST);
        let blockList = AST2BlockList.toBlockList(trees);
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
            [4, ["number", { "value": 1 }], 0, 0, [3]],
            [5, "random", 0, 0, [3, 6, 7]],
            [6, ["number", { "value": 0 }], 0, 0, [5]],
            [7, ["number", { "value": 1 }], 0, 0, [5]],
            [8, "vspace", 0, 0, [1, 9]],
            [9, "settimbre", 0, 0, [8, 10, 11, null]],
            [10, ["voicename", { "value": "electronic synth" }], 0, 0, [9]],
            [11, "newnote", 0, 0, [9, 12, 15, null]],
            [12, "divide", 0, 0, [11, 13, 14]],
            [13, ["number", { "value": 1 }], 0, 0, [12]],
            [14, ["number", { "value": 4 }], 0, 0, [12]],
            [15, "vspace", 0, 0, [11, 16]],
            [16, "pitch", 0, 0, [15, 17, 18, null]],
            [17, ["solfege", { "value": "sol" }], 0, 0, [16]],
            [18, ["number", { "value": 4 }], 0, 0, [16]]
        ];

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        let trees = AST2BlockList.toTrees(AST);
        let blockList = AST2BlockList.toBlockList(trees);
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
            [1, ["text", { "value": "playSol" }], 0, 0, [0]],
            [2, "newnote", 0, 0, [0, 3, 6, 10]],
            [3, "divide", 0, 0, [2, 4, 5]],
            [4, ["number", { "value": 1 }], 0, 0, [3]],
            [5, ["number", { "value": 4 }], 0, 0, [3]],
            [6, "vspace", 0, 0, [2, 7]],
            [7, "pitch", 0, 0, [6, 8, 9, null]],
            [8, ["solfege", { "value": "sol" }], 0, 0, [7]],
            [9, ["number", { "value": 2 }], 0, 0, [7]],
            [10, "decrementOne", 0, 0, [2, 11, 12]],
            [11, ["namedbox", { "value": "box1" }], 0, 0, [10]],
            [12, "if", 0, 0, [10, 13, 16, null]],
            [13, "greater", 0, 0, [12, 14, 15]],
            [14, ["namedbox", { "value": "box1" }], 0, 0, [13]],
            [15, ["number", { "value": 0 }], 0, 0, [13]],
            [16, ["nameddo", { "value": "playSol" }], 0, 0, [12, null]],
            [17, "start", 500, 200, [null, 18, null]],
            [18, ["storein2", { "value": "box1" }], 0, 0, [17, 19, 24]],
            [19, "multiply", 0, 0, [18, 20, 23]],
            [20, "abs", 0, 0, [19, 21]],
            [21, "neg", 0, 0, [20, 22]],
            [22, ["number", { "value": 2 }], 0, 0, [21]],
            [23, ["number", { "value": 3 }], 0, 0, [19]],
            [24, "vspace", 0, 0, [18, 25]],
            [25, "settimbre", 0, 0, [24, 26, 27, null]],
            [26, ["voicename", { "value": "electronic synth" }], 0, 0, [25]],
            [27, ["nameddo", { "value": "playSol" }], 0, 0, [25, null]]
        ];

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        let trees = AST2BlockList.toTrees(AST);
        let blockList = AST2BlockList.toBlockList(trees);
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
            [1, ["text", { "value": "chunk0" }], 0, 0, [0]],
            [2, "newnote", 0, 0, [0, 3, 6, 10]],
            [3, "divide", 0, 0, [2, 4, 5]],
            [4, ["number", { "value": 1 }], 0, 0, [3]],
            [5, ["number", { "value": 4 }], 0, 0, [3]],
            [6, "vspace", 0, 0, [2, 7]],
            [7, "pitch", 0, 0, [6, 8, 9, null]],
            [8, ["solfege", { "value": "sol" }], 0, 0, [7]],
            [9, ["number", { "value": 4 }], 0, 0, [7]],
            [10, "newnote", 0, 0, [2, 11, 14, 18]],
            [11, "divide", 0, 0, [10, 12, 13]],
            [12, ["number", { "value": 1 }], 0, 0, [11]],
            [13, ["number", { "value": 4 }], 0, 0, [11]],
            [14, "vspace", 0, 0, [10, 15]],
            [15, "pitch", 0, 0, [14, 16, 17, null]],
            [16, ["solfege", { "value": "la" }], 0, 0, [15]],
            [17, ["number", { "value": 4 }], 0, 0, [15]],
            [18, "newnote", 0, 0, [10, 19, 22, 26]],
            [19, "divide", 0, 0, [18, 20, 21]],
            [20, ["number", { "value": 1 }], 0, 0, [19]],
            [21, ["number", { "value": 4 }], 0, 0, [19]],
            [22, "vspace", 0, 0, [18, 23]],
            [23, "pitch", 0, 0, [22, 24, 25, null]],
            [24, ["solfege", { "value": "ti" }], 0, 0, [23]],
            [25, ["number", { "value": 4 }], 0, 0, [23]],
            [26, "newnote", 0, 0, [18, 27, 30, null]],
            [27, "divide", 0, 0, [26, 28, 29]],
            [28, ["number", { "value": 1 }], 0, 0, [27]],
            [29, ["number", { "value": 4 }], 0, 0, [27]],
            [30, "vspace", 0, 0, [26, 31]],
            [31, "pitch", 0, 0, [30, 32, 33, null]],
            [32, ["solfege", { "value": "sol" }], 0, 0, [31]],
            [33, ["number", { "value": 4 }], 0, 0, [31]],
            [34, "action", 500, 200, [null, 35, 36, null]],
            [35, ["text", { "value": "chunk1" }], 0, 0, [34]],
            [36, "newnote", 0, 0, [34, 37, 40, 44]],
            [37, "divide", 0, 0, [36, 38, 39]],
            [38, ["number", { "value": 1 }], 0, 0, [37]],
            [39, ["number", { "value": 4 }], 0, 0, [37]],
            [40, "vspace", 0, 0, [36, 41]],
            [41, "pitch", 0, 0, [40, 42, 43, null]],
            [42, ["solfege", { "value": "ti" }], 0, 0, [41]],
            [43, ["number", { "value": 4 }], 0, 0, [41]],
            [44, "newnote", 0, 0, [36, 45, 48, 52]],
            [45, "divide", 0, 0, [44, 46, 47]],
            [46, ["number", { "value": 1 }], 0, 0, [45]],
            [47, ["number", { "value": 4 }], 0, 0, [45]],
            [48, "vspace", 0, 0, [44, 49]],
            [49, "pitch", 0, 0, [48, 50, 51, null]],
            [50, ["solfege", { "value": "do" }], 0, 0, [49]],
            [51, ["number", { "value": 4 }], 0, 0, [49]],
            [52, "newnote", 0, 0, [44, 53, 56, null]],
            [53, "divide", 0, 0, [52, 54, 55]],
            [54, ["number", { "value": 1 }], 0, 0, [53]],
            [55, ["number", { "value": 2 }], 0, 0, [53]],
            [56, "vspace", 0, 0, [52, 57]],
            [57, "pitch", 0, 0, [56, 58, 59, null]],
            [58, ["solfege", { "value": "re" }], 0, 0, [57]],
            [59, ["number", { "value": 5 }], 0, 0, [57]],
            [60, "action", 800, 200, [null, 61, 62, null]],
            [61, ["text", { "value": "chunk2" }], 0, 0, [60]],
            [62, "newnote", 0, 0, [60, 63, 66, 70]],
            [63, "divide", 0, 0, [62, 64, 65]],
            [64, ["number", { "value": 1 }], 0, 0, [63]],
            [65, ["number", { "value": 8 }], 0, 0, [63]],
            [66, "vspace", 0, 0, [62, 67]],
            [67, "pitch", 0, 0, [66, 68, 69, null]],
            [68, ["solfege", { "value": "re" }], 0, 0, [67]],
            [69, ["number", { "value": 5 }], 0, 0, [67]],
            [70, "newnote", 0, 0, [62, 71, 74, 78]],
            [71, "divide", 0, 0, [70, 72, 73]],
            [72, ["number", { "value": 1 }], 0, 0, [71]],
            [73, ["number", { "value": 8 }], 0, 0, [71]],
            [74, "vspace", 0, 0, [70, 75]],
            [75, "pitch", 0, 0, [74, 76, 77, null]],
            [76, ["solfege", { "value": "mi" }], 0, 0, [75]],
            [77, ["number", { "value": 5 }], 0, 0, [75]],
            [78, "newnote", 0, 0, [70, 79, 82, 86]],
            [79, "divide", 0, 0, [78, 80, 81]],
            [80, ["number", { "value": 1 }], 0, 0, [79]],
            [81, ["number", { "value": 8 }], 0, 0, [79]],
            [82, "vspace", 0, 0, [78, 83]],
            [83, "pitch", 0, 0, [82, 84, 85, null]],
            [84, ["solfege", { "value": "re" }], 0, 0, [83]],
            [85, ["number", { "value": 5 }], 0, 0, [83]],
            [86, "newnote", 0, 0, [78, 87, 90, 94]],
            [87, "divide", 0, 0, [86, 88, 89]],
            [88, ["number", { "value": 1 }], 0, 0, [87]],
            [89, ["number", { "value": 8 }], 0, 0, [87]],
            [90, "vspace", 0, 0, [86, 91]],
            [91, "pitch", 0, 0, [90, 92, 93, null]],
            [92, ["solfege", { "value": "do" }], 0, 0, [91]],
            [93, ["number", { "value": 5 }], 0, 0, [91]],
            [94, "newnote", 0, 0, [86, 95, 98, 102]],
            [95, "divide", 0, 0, [94, 96, 97]],
            [96, ["number", { "value": 1 }], 0, 0, [95]],
            [97, ["number", { "value": 4 }], 0, 0, [95]],
            [98, "vspace", 0, 0, [94, 99]],
            [99, "pitch", 0, 0, [98, 100, 101, null]],
            [100, ["solfege", { "value": "ti" }], 0, 0, [99]],
            [101, ["number", { "value": 5 }], 0, 0, [99]],
            [102, "newnote", 0, 0, [94, 103, 106, null]],
            [103, "divide", 0, 0, [102, 104, 105]],
            [104, ["number", { "value": 1 }], 0, 0, [103]],
            [105, ["number", { "value": 4 }], 0, 0, [103]],
            [106, "vspace", 0, 0, [102, 107]],
            [107, "pitch", 0, 0, [106, 108, 109, null]],
            [108, ["solfege", { "value": "sol" }], 0, 0, [107]],
            [109, ["number", { "value": 4 }], 0, 0, [107]],
            [110, "action", 1100, 200, [null, 111, 112, null]],
            [111, ["text", { "value": "chunk3" }], 0, 0, [110]],
            [112, "newnote", 0, 0, [110, 113, 116, 120]],
            [113, "divide", 0, 0, [112, 114, 115]],
            [114, ["number", { "value": 1 }], 0, 0, [113]],
            [115, ["number", { "value": 4 }], 0, 0, [113]],
            [116, "vspace", 0, 0, [112, 117]],
            [117, "pitch", 0, 0, [116, 118, 119, null]],
            [118, ["solfege", { "value": "sol" }], 0, 0, [117]],
            [119, ["number", { "value": 4 }], 0, 0, [117]],
            [120, "newnote", 0, 0, [112, 121, 124, 128]],
            [121, "divide", 0, 0, [120, 122, 123]],
            [122, ["number", { "value": 1 }], 0, 0, [121]],
            [123, ["number", { "value": 4 }], 0, 0, [121]],
            [124, "vspace", 0, 0, [120, 125]],
            [125, "pitch", 0, 0, [124, 126, 127, null]],
            [126, ["solfege", { "value": "re" }], 0, 0, [125]],
            [127, ["number", { "value": 4 }], 0, 0, [125]],
            [128, "newnote", 0, 0, [120, 129, 132, null]],
            [129, "divide", 0, 0, [128, 130, 131]],
            [130, ["number", { "value": 1 }], 0, 0, [129]],
            [131, ["number", { "value": 4 }], 0, 0, [129]],
            [132, "vspace", 0, 0, [128, 133]],
            [133, "pitch", 0, 0, [132, 134, 135, null]],
            [134, ["solfege", { "value": "sol" }], 0, 0, [133]],
            [135, ["number", { "value": 4 }], 0, 0, [133]],
            [136, "start", 1400, 200, [null, 137, null]],
            [137, "repeat", 0, 0, [136, 138, 139, 140]],
            [138, ["number", { "value": 2 }], 0, 0, [137]],
            [139, ["nameddo", { "value": "chunk0" }], 0, 0, [137, null]],
            [140, "repeat", 0, 0, [137, 141, 142, 143]],
            [141, ["number", { "value": 2 }], 0, 0, [140]],
            [142, ["nameddo", { "value": "chunk1" }], 0, 0, [140, null]],
            [143, "repeat", 0, 0, [140, 144, 145, 146]],
            [144, ["number", { "value": 2 }], 0, 0, [143]],
            [145, ["nameddo", { "value": "chunk2" }], 0, 0, [143, null]],
            [146, "repeat", 0, 0, [143, 147, 148, null]],
            [147, ["number", { "value": 2 }], 0, 0, [146]],
            [148, ["nameddo", { "value": "chunk3" }], 0, 0, [146, null]]
        ];

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        let trees = AST2BlockList.toTrees(AST);
        let blockList = AST2BlockList.toBlockList(trees);
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
            [2, ["text", { "value": "key" }], 0, 0, [1]],
            [3, ["number", { "value": 2 }], 0, 0, [1]],
            [4, "setDict", 0, 0, [1, 5, 6, 7, 9]],
            [5, ["text", { "value": "solfege" }], 0, 0, [4]],
            [6, ["text", { "value": "do" }], 0, 0, [4]],
            [7, "getDict2", 0, 0, [4, 8]],
            [8, ["text", { "value": "key" }], 0, 0, [7]],
            [9, "setDict", 0, 0, [4, 10, 11, 12, 13]],
            [10, ["text", { "value": "solfege" }], 0, 0, [9]],
            [11, ["text", { "value": "re" }], 0, 0, [9]],
            [12, ["number", { "value": 3 }], 0, 0, [9]],
            [13, "setDict", 0, 0, [9, 14, 15, 16, 17]],
            [14, ["text", { "value": "solfege" }], 0, 0, [13]],
            [15, ["text", { "value": "mi" }], 0, 0, [13]],
            [16, ["number", { "value": 2 }], 0, 0, [13]],
            [17, "setDict", 0, 0, [13, 18, 19, 20, 21]],
            [18, ["text", { "value": "solfege" }], 0, 0, [17]],
            [19, ["text", { "value": "fa" }], 0, 0, [17]],
            [20, ["number", { "value": 1 }], 0, 0, [17]],
            [21, "newnote", 0, 0, [17, 22, 25, 32]],
            [22, "divide", 0, 0, [21, 23, 24]],
            [23, ["number", { "value": 1 }], 0, 0, [22]],
            [24, ["number", { "value": 4 }], 0, 0, [22]],
            [25, "vspace", 0, 0, [21, 26]],
            [26, "pitch", 0, 0, [25, 27, 28, 31]],
            [27, ["solfege", { "value": "do" }], 0, 0, [26]],
            [28, "getDict", 0, 0, [26, 29, 30]],
            [29, ["text", { "value": "solfege" }], 0, 0, [28]],
            [30, ["text", { "value": "do" }], 0, 0, [28]],
            [31, "vspace", 0, 0, [26, null]],
            [32, "newnote", 0, 0, [21, 33, 36, 43]],
            [33, "divide", 0, 0, [32, 34, 35]],
            [34, ["number", { "value": 1 }], 0, 0, [33]],
            [35, ["number", { "value": 4 }], 0, 0, [33]],
            [36, "vspace", 0, 0, [32, 37]],
            [37, "pitch", 0, 0, [36, 38, 39, 42]],
            [38, ["solfege", { "value": "re" }], 0, 0, [37]],
            [39, "getDict", 0, 0, [37, 40, 41]],
            [40, ["text", { "value": "solfege" }], 0, 0, [39]],
            [41, ["text", { "value": "re" }], 0, 0, [39]],
            [42, "vspace", 0, 0, [37, null]],
            [43, "newnote", 0, 0, [32, 44, 47, 54]],
            [44, "divide", 0, 0, [43, 45, 46]],
            [45, ["number", { "value": 1 }], 0, 0, [44]],
            [46, ["number", { "value": 4 }], 0, 0, [44]],
            [47, "vspace", 0, 0, [43, 48]],
            [48, "pitch", 0, 0, [47, 49, 50, 53]],
            [49, ["solfege", { "value": "mi" }], 0, 0, [48]],
            [50, "getDict", 0, 0, [48, 51, 52]],
            [51, ["text", { "value": "solfege" }], 0, 0, [50]],
            [52, ["text", { "value": "mi" }], 0, 0, [50]],
            [53, "vspace", 0, 0, [48, null]],
            [54, "newnote", 0, 0, [43, 55, 58, null]],
            [55, "divide", 0, 0, [54, 56, 57]],
            [56, ["number", { "value": 1 }], 0, 0, [55]],
            [57, ["number", { "value": 4 }], 0, 0, [55]],
            [58, "vspace", 0, 0, [54, 59]],
            [59, "pitch", 0, 0, [58, 60, 61, 64]],
            [60, ["solfege", { "value": "fa" }], 0, 0, [59]],
            [61, "getDict", 0, 0, [59, 62, 63]],
            [62, ["text", { "value": "solfege" }], 0, 0, [61]],
            [63, ["text", { "value": "fa" }], 0, 0, [61]],
            [64, "vspace", 0, 0, [59, null]]
        ];

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        let trees = AST2BlockList.toTrees(AST);
        let blockList = AST2BlockList.toBlockList(trees);
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
            [3, ["number", { "value": 1 }], 0, 0, [2]],
            [4, ["number", { "value": 4 }], 0, 0, [2]],
            [5, "vspace", 0, 0, [1, 6]],
            [6, "pitch", 0, 0, [5, 7, 8, null]],
            [7, ["solfege", { "value": "sol" }], 0, 0, [6]],
            [8, ["number", { "value": 4 }], 0, 0, [6]],
            [9, "newnote", 0, 0, [1, 10, 13, 17]],
            [10, "divide", 0, 0, [9, 11, 12]],
            [11, ["number", { "value": 1 }], 0, 0, [10]],
            [12, ["number", { "value": 4 }], 0, 0, [10]],
            [13, "vspace", 0, 0, [9, 14]],
            [14, "pitch", 0, 0, [13, 15, 16, null]],
            [15, ["notename", { "value": "G" }], 0, 0, [14]],
            [16, ["number", { "value": 4 }], 0, 0, [14]],
            [17, "newnote", 0, 0, [9, 18, 21, 25]],
            [18, "divide", 0, 0, [17, 19, 20]],
            [19, ["number", { "value": 1 }], 0, 0, [18]],
            [20, ["number", { "value": 4 }], 0, 0, [18]],
            [21, "vspace", 0, 0, [17, 22]],
            [22, "pitch", 0, 0, [21, 23, 24, null]],
            [23, ["solfege", { "value": "5" }], 0, 0, [22]],
            [24, ["number", { "value": 4 }], 0, 0, [22]],
            [25, "newnote", 0, 0, [17, 26, 29, 32]],
            [26, "divide", 0, 0, [25, 27, 28]],
            [27, ["number", { "value": 1 }], 0, 0, [26]],
            [28, ["number", { "value": 4 }], 0, 0, [26]],
            [29, "vspace", 0, 0, [25, 30]],
            [30, "hertz", 0, 0, [29, 31, null, null]],
            [31, ["number", { "value": 392 }], 0, 0, [30]],
            [32, "newnote", 0, 0, [25, 33, 36, 38]],
            [33, "divide", 0, 0, [32, 34, 35]],
            [34, ["number", { "value": 1 }], 0, 0, [33]],
            [35, ["number", { "value": 4 }], 0, 0, [33]],
            [36, "vspace", 0, 0, [32, 37]],
            [37, "rest2", 0, 0, [36, null]],
            [38, "rhythmicdot2", 0, 0, [32, 39, 40, 48]],
            [39, ["number", { "value": 1 }], 0, 0, [38]],
            [40, "newnote", 0, 0, [38, 41, 44, null]],
            [41, "divide", 0, 0, [40, 42, 43]],
            [42, ["number", { "value": 1 }], 0, 0, [41]],
            [43, ["number", { "value": 4 }], 0, 0, [41]],
            [44, "vspace", 0, 0, [40, 45]],
            [45, "pitch", 0, 0, [44, 46, 47, null]],
            [46, ["solfege", { "value": "sol" }], 0, 0, [45]],
            [47, ["number", { "value": 4 }], 0, 0, [45]],
            [48, "tie", 0, 0, [38, 49, 65]],
            [49, "newnote", 0, 0, [48, 50, 53, 57]],
            [50, "divide", 0, 0, [49, 51, 52]],
            [51, ["number", { "value": 1 }], 0, 0, [50]],
            [52, ["number", { "value": 4 }], 0, 0, [50]],
            [53, "vspace", 0, 0, [49, 54]],
            [54, "pitch", 0, 0, [53, 55, 56, null]],
            [55, ["solfege", { "value": "sol" }], 0, 0, [54]],
            [56, ["number", { "value": 4 }], 0, 0, [54]],
            [57, "newnote", 0, 0, [49, 58, 61, null]],
            [58, "divide", 0, 0, [57, 59, 60]],
            [59, ["number", { "value": 1 }], 0, 0, [58]],
            [60, ["number", { "value": 4 }], 0, 0, [58]],
            [61, "vspace", 0, 0, [57, 62]],
            [62, "pitch", 0, 0, [61, 63, 64, null]],
            [63, ["solfege", { "value": "sol" }], 0, 0, [62]],
            [64, ["number", { "value": 4 }], 0, 0, [62]],
            [65, "multiplybeatfactor", 0, 0, [48, 66, 69, 78]],
            [66, "divide", 0, 0, [65, 67, 68]],
            [67, ["number", { "value": 1 }], 0, 0, [66]],
            [68, ["number", { "value": 2 }], 0, 0, [66]],
            [69, "vspace", 0, 0, [65, 70]],
            [70, "newnote", 0, 0, [69, 71, 74, null]],
            [71, "divide", 0, 0, [70, 72, 73]],
            [72, ["number", { "value": 1 }], 0, 0, [71]],
            [73, ["number", { "value": 4 }], 0, 0, [71]],
            [74, "vspace", 0, 0, [70, 75]],
            [75, "pitch", 0, 0, [74, 76, 77, null]],
            [76, ["solfege", { "value": "sol" }], 0, 0, [75]],
            [77, ["number", { "value": 4 }], 0, 0, [75]],
            [78, "newswing2", 0, 0, [65, 79, 82, 85, 103]],
            [79, "divide", 0, 0, [78, 80, 81]],
            [80, ["number", { "value": 1 }], 0, 0, [79]],
            [81, ["number", { "value": 24 }], 0, 0, [79]],
            [82, "divide", 0, 0, [78, 83, 84]],
            [83, ["number", { "value": 1 }], 0, 0, [82]],
            [84, ["number", { "value": 8 }], 0, 0, [82]],
            [85, "vspace", 0, 0, [78, 86]],
            [86, "vspace", 0, 0, [85, 87]],
            [87, "newnote", 0, 0, [86, 88, 91, 95]],
            [88, "divide", 0, 0, [87, 89, 90]],
            [89, ["number", { "value": 1 }], 0, 0, [88]],
            [90, ["number", { "value": 4 }], 0, 0, [88]],
            [91, "vspace", 0, 0, [87, 92]],
            [92, "pitch", 0, 0, [91, 93, 94, null]],
            [93, ["solfege", { "value": "sol" }], 0, 0, [92]],
            [94, ["number", { "value": 4 }], 0, 0, [92]],
            [95, "newnote", 0, 0, [87, 96, 99, null]],
            [96, "divide", 0, 0, [95, 97, 98]],
            [97, ["number", { "value": 1 }], 0, 0, [96]],
            [98, ["number", { "value": 4 }], 0, 0, [96]],
            [99, "vspace", 0, 0, [95, 100]],
            [100, "pitch", 0, 0, [99, 101, 102, null]],
            [101, ["solfege", { "value": "sol" }], 0, 0, [100]],
            [102, ["number", { "value": 4 }], 0, 0, [100]],
            [103, "osctime", 0, 0, [78, 104, 109, null]],
            [104, "divide", 0, 0, [103, 105, 106]],
            [105, ["number", { "value": 1000 }], 0, 0, [104]],
            [106, "divide", 0, 0, [104, 107, 108]],
            [107, ["number", { "value": 3 }], 0, 0, [106]],
            [108, ["number", { "value": 2 }], 0, 0, [106]],
            [109, "vspace", 0, 0, [103, 110]],
            [110, "vspace", 0, 0, [109, 111]],
            [111, "hertz", 0, 0, [110, 112, null, null]],
            [112, ["number", { "value": 392 }], 0, 0, [111]]
        ];

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        let trees = AST2BlockList.toTrees(AST);
        let blockList = AST2BlockList.toBlockList(trees);
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
            [2, ["boolean", { "value": true }], 0, 0, [1]],
            [3, "newnote", 0, 0, [1, 4, 7, 11]],
            [4, "divide", 0, 0, [3, 5, 6]],
            [5, ["number", { "value": 1 }], 0, 0, [4]],
            [6, ["number", { "value": 4 }], 0, 0, [4]],
            [7, "vspace", 0, 0, [3, 8]],
            [8, "pitch", 0, 0, [7, 9, 10, null]],
            [9, ["solfege", { "value": "sol" }], 0, 0, [8]],
            [10, ["number", { "value": 4 }], 0, 0, [8]],
            [11, "newnote", 0, 0, [3, 12, 15, 19]],
            [12, "divide", 0, 0, [11, 13, 14]],
            [13, ["number", { "value": 1 }], 0, 0, [12]],
            [14, ["number", { "value": 4 }], 0, 0, [12]],
            [15, "vspace", 0, 0, [11, 16]],
            [16, "pitch", 0, 0, [15, 17, 18, null]],
            [17, ["solfege", { "value": "sol" }], 0, 0, [16]],
            [18, ["number", { "value": 4 }], 0, 0, [16]],
            [19, "newnote", 0, 0, [11, 20, 23, null]],
            [20, "divide", 0, 0, [19, 21, 22]],
            [21, ["number", { "value": 1 }], 0, 0, [20]],
            [22, ["number", { "value": 4 }], 0, 0, [20]],
            [23, "vspace", 0, 0, [19, 24]],
            [24, "pitch", 0, 0, [23, 25, 26, null]],
            [25, ["solfege", { "value": "sol" }], 0, 0, [24]],
            [26, ["number", { "value": 4 }], 0, 0, [24]],
            [27, "newnote", 0, 0, [1, 28, 31, 35]],
            [28, "divide", 0, 0, [27, 29, 30]],
            [29, ["number", { "value": 1 }], 0, 0, [28]],
            [30, ["number", { "value": 4 }], 0, 0, [28]],
            [31, "vspace", 0, 0, [27, 32]],
            [32, "pitch", 0, 0, [31, 33, 34, null]],
            [33, ["solfege", { "value": "sol" }], 0, 0, [32]],
            [34, ["number", { "value": 4 }], 0, 0, [32]],
            [35, "newnote", 0, 0, [27, 36, 39, null]],
            [36, "divide", 0, 0, [35, 37, 38]],
            [37, ["number", { "value": 1 }], 0, 0, [36]],
            [38, ["number", { "value": 6 }], 0, 0, [36]],
            [39, "vspace", 0, 0, [35, 40]],
            [40, "pitch", 0, 0, [39, 41, 42, null]],
            [41, ["solfege", { "value": "sol" }], 0, 0, [40]],
            [42, ["number", { "value": 4 }], 0, 0, [40]],
            [43, "forever", 0, 0, [1, 44, 53]],
            [44, "newnote", 0, 0, [43, 45, 48, 52]],
            [45, "divide", 0, 0, [44, 46, 47]],
            [46, ["number", { "value": 1 }], 0, 0, [45]],
            [47, ["number", { "value": 4 }], 0, 0, [45]],
            [48, "vspace", 0, 0, [44, 49]],
            [49, "pitch", 0, 0, [48, 50, 51, null]],
            [50, ["solfege", { "value": "sol" }], 0, 0, [49]],
            [51, ["number", { "value": 4 }], 0, 0, [49]],
            [52, "break", 0, 0, [44, null, null, null]],
            [53, "forever", 0, 0, [43, 54, 62]],
            [54, "newnote", 0, 0, [53, 55, 58, null]],
            [55, "divide", 0, 0, [54, 56, 57]],
            [56, ["number", { "value": 1 }], 0, 0, [55]],
            [57, ["number", { "value": 4 }], 0, 0, [55]],
            [58, "vspace", 0, 0, [54, 59]],
            [59, "pitch", 0, 0, [58, 60, 61, null]],
            [60, ["solfege", { "value": "sol" }], 0, 0, [59]],
            [61, ["number", { "value": 4 }], 0, 0, [59]],
            [62, "until", 0, 0, [53, 63, 64, 73]],
            [63, ["boolean", { "value": true }], 0, 0, [62]],
            [64, "vspace", 0, 0, [62, 65]],
            [65, "newnote", 0, 0, [64, 66, 69, null]],
            [66, "divide", 0, 0, [65, 67, 68]],
            [67, ["number", { "value": 1 }], 0, 0, [66]],
            [68, ["number", { "value": 4 }], 0, 0, [66]],
            [69, "vspace", 0, 0, [65, 70]],
            [70, "pitch", 0, 0, [69, 71, 72, null]],
            [71, ["solfege", { "value": "sol" }], 0, 0, [70]],
            [72, ["number", { "value": 4 }], 0, 0, [70]],
            [73, "switch", 0, 0, [62, 74, 75, null]],
            [74, ["number", { "value": 1 }], 0, 0, [73]],
            [75, "case", 0, 0, [73, 76, 77, 88]],
            [76, ["number", { "value": 1 }], 0, 0, [75]],
            [77, "newnote", 0, 0, [75, 78, 81, 85]],
            [78, "divide", 0, 0, [77, 79, 80]],
            [79, ["number", { "value": 1 }], 0, 0, [78]],
            [80, ["number", { "value": 4 }], 0, 0, [78]],
            [81, "vspace", 0, 0, [77, 82]],
            [82, "pitch", 0, 0, [81, 83, 84, null]],
            [83, ["solfege", { "value": "sol" }], 0, 0, [82]],
            [84, ["number", { "value": 4 }], 0, 0, [82]],
            [85, "break", 0, 0, [77, 86, null, null]],
            [86, "break", 0, 0, [85, 87, null, null]],
            [87, "break", 0, 0, [86, null, null, null]],
            [88, "defaultcase", 0, 0, [75, 89, null, null]],
            [89, "newnote", 0, 0, [88, 90, 93, null]],
            [90, "divide", 0, 0, [89, 91, 92]],
            [91, ["number", { "value": 1 }], 0, 0, [90]],
            [92, ["number", { "value": 4 }], 0, 0, [90]],
            [93, "vspace", 0, 0, [89, 94]],
            [94, "pitch", 0, 0, [93, 95, 96, null]],
            [95, ["solfege", { "value": "5" }], 0, 0, [94]],
            [96, ["number", { "value": 4 }], 0, 0, [94]]
        ];

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        let trees = AST2BlockList.toTrees(AST);
        let blockList = AST2BlockList.toBlockList(trees);
        expect(blockList).toEqual(expectedBlockList);
    });
});