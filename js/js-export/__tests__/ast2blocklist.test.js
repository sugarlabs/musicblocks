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

const acorn = require('acorn');
const { AST2BlockList } = require('../ast2blocklist');

describe('AST2BlockList Class', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Test a single note inside of settimbre.
    // Support number expressions, including built-in math functions, for note and solfege.
    test('should generate correct blockList for a single note', () => {
        const code = `
        new Mouse(async mouse => {
            await mouse.setInstrument("guitar", async () => {
                await mouse.playNote(Math.abs(-2) * 1, async () => {
                    await mouse.playPitch("mi", Math.abs(-2));
                    return mouse.ENDFLOW;
                });
                return mouse.ENDFLOW;
            });
            return mouse.ENDMOUSE;
        });
        MusicBlocks.run();`

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
            [9, "pitch", 0, 0, [3, 10, 11, null]],
            [10, ["solfege", { "value": "mi" }], 0, 0, [9]],
            [11, "abs", 0, 0, [9, 12]],
            [12, "neg", 0, 0, [11, 13]],
            [13, ["number", { "value": 2 }], 0, 0, [12]]
        ];

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        let trees = AST2BlockList.toTrees(AST);
        let blockList = AST2BlockList.toBlockList(trees);
        expect(blockList).toEqual(expectedBlockList);
    });

    // Test repeat statement.
    // Support number expressions, including built-in math functions, for number of repeats.
    test('should generate correct blockList for repeat', () => {
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
        MusicBlocks.run();`

        const expectedBlockList = [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "settimbre", 0, 0, [0, 2, 3, null]],
            [2, ["voicename", { "value": "clarinet" }], 0, 0, [1]],
            [3, "repeat", 0, 0, [1, 4, 7, null]],
            [4, "random", 0, 0, [3, 5, 6]],
            [5, ["number", { "value": 1 }], 0, 0, [4]],
            [6, ["number", { "value": 5 }], 0, 0, [4]],
            [7, "newnote", 0, 0, [3, 8, 11, null]],
            [8, "divide", 0, 0, [7, 9, 10]],
            [9, ["number", { "value": 1 }], 0, 0, [8]],
            [10, ["number", { "value": 4 }], 0, 0, [8]],
            [11, "pitch", 0, 0, [7, 12, 13, null]],
            [12, ["solfege", { "value": "fa" }], 0, 0, [11]],
            [13, "multiply", 0, 0, [11, 14, 15]],
            [14, ["number", { "value": 2 }], 0, 0, [13]],
            [15, ["number", { "value": 2 }], 0, 0, [13]]
        ];

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        let trees = AST2BlockList.toTrees(AST);
        let blockList = AST2BlockList.toBlockList(trees);
        expect(blockList).toEqual(expectedBlockList);
    });

    // Test if statement.
    // Support boolean expressions, including built-in math functions, for if condition.
    test('should generate correct blockList for if', () => {
        const code = `
        new Mouse(async mouse => {
            if (!(MathUtility.doRandom(0, 1) == 1)) {
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
        MusicBlocks.run();`

        const expectedBlockList = [
            [0, "start", 200, 200, [null, 1, null]],
            [1, "if", 0, 0, [0, 2, 8, null]],
            [2, "not", 0, 0, [1, 3]],
            [3, "equal", 0, 0, [2, 4, 7]],
            [4, "random", 0, 0, [3, 5, 6]],
            [5, ["number", { "value": 0 }], 0, 0, [4]],
            [6, ["number", { "value": 1 }], 0, 0, [4]],
            [7, ["number", { "value": 1 }], 0, 0, [3]],
            [8, "settimbre", 0, 0, [1, 9, 10, null]],
            [9, ["voicename", { "value": "electronic synth" }], 0, 0, [8]],
            [10, "newnote", 0, 0, [8, 11, 14, null]],
            [11, "divide", 0, 0, [10, 12, 13]],
            [12, ["number", { "value": 1 }], 0, 0, [11]],
            [13, ["number", { "value": 4 }], 0, 0, [11]],
            [14, "pitch", 0, 0, [10, 15, 16, null]],
            [15, ["solfege", { "value": "sol" }], 0, 0, [14]],
            [16, ["number", { "value": 4 }], 0, 0, [14]]
        ];

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        let trees = AST2BlockList.toTrees(AST);
        let blockList = AST2BlockList.toBlockList(trees);
        expect(blockList).toEqual(expectedBlockList);
    });

    // Test action with recursion.
    // Support using box value to control termination of recursion.
    test('should generate correct blockList for action with recursion', () => {
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
        MusicBlocks.run();`

        const expectedBlockList = [
            [0, "action", 200, 200, [null, 1, 2, null]],
            [1, ["text", { "value": "playSol" }], 0, 0, [0]],
            [2, "newnote", 0, 0, [0, 3, 6, 9]],
            [3, "divide", 0, 0, [2, 4, 5]],
            [4, ["number", { "value": 1 }], 0, 0, [3]],
            [5, ["number", { "value": 4 }], 0, 0, [3]],
            [6, "pitch", 0, 0, [2, 7, 8, null]],
            [7, ["solfege", { "value": "sol" }], 0, 0, [6]],
            [8, ["number", { "value": 2 }], 0, 0, [6]],
            [9, "decrementOne", 0, 0, [2, 10, 11]],
            [10, ["namedbox", { "value": "box1" }], 0, 0, [9]],
            [11, "if", 0, 0, [9, 12, 15, null]],
            [12, "greater", 0, 0, [11, 13, 14]],
            [13, ["namedbox", { "value": "box1" }], 0, 0, [12]],
            [14, ["number", { "value": 0 }], 0, 0, [12]],
            [15, ["nameddo", { "value": "playSol" }], 0, 0, [11, null]],
            [16, "start", 500, 200, [null, 17, null]],
            [17, ["storein2", { "value": "box1" }], 0, 0, [16, 18, 23]],
            [18, "multiply", 0, 0, [17, 19, 22]],
            [19, "abs", 0, 0, [18, 20]],
            [20, "neg", 0, 0, [19, 21]],
            [21, ["number", { "value": 2 }], 0, 0, [20]],
            [22, ["number", { "value": 3 }], 0, 0, [18]],
            [23, "settimbre", 0, 0, [17, 24, 25, null]],
            [24, ["voicename", { "value": "electronic synth" }], 0, 0, [23]],
            [25, ["nameddo", { "value": "playSol" }], 0, 0, [23, null]]
        ];

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        let trees = AST2BlockList.toTrees(AST);
        let blockList = AST2BlockList.toBlockList(trees);
        expect(blockList).toEqual(expectedBlockList);
    });

    // Test action, note, pitch, and repeat with Frere Jacques, an example here:
    // https://musicblocks.sugarlabs.org/index.html?id=1725791527821787&run=True
    test('should generate correct blockList for action with recursion', () => {
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
        MusicBlocks.run();`

        const expectedBlockList = [
            [0, "action", 200, 200, [null, 1, 2, null]],
            [1, ["text", { "value": "chunk0" }], 0, 0, [0]],
            [2, "newnote", 0, 0, [0, 3, 6, 9]],
            [3, "divide", 0, 0, [2, 4, 5]],
            [4, ["number", { "value": 1 }], 0, 0, [3]],
            [5, ["number", { "value": 4 }], 0, 0, [3]],
            [6, "pitch", 0, 0, [2, 7, 8, null]],
            [7, ["solfege", { "value": "sol" }], 0, 0, [6]],
            [8, ["number", { "value": 4 }], 0, 0, [6]],
            [9, "newnote", 0, 0, [2, 10, 13, 16]],
            [10, "divide", 0, 0, [9, 11, 12]],
            [11, ["number", { "value": 1 }], 0, 0, [10]],
            [12, ["number", { "value": 4 }], 0, 0, [10]],
            [13, "pitch", 0, 0, [9, 14, 15, null]],
            [14, ["solfege", { "value": "la" }], 0, 0, [13]],
            [15, ["number", { "value": 4 }], 0, 0, [13]],
            [16, "newnote", 0, 0, [9, 17, 20, 23]],
            [17, "divide", 0, 0, [16, 18, 19]],
            [18, ["number", { "value": 1 }], 0, 0, [17]],
            [19, ["number", { "value": 4 }], 0, 0, [17]],
            [20, "pitch", 0, 0, [16, 21, 22, null]],
            [21, ["solfege", { "value": "ti" }], 0, 0, [20]],
            [22, ["number", { "value": 4 }], 0, 0, [20]],
            [23, "newnote", 0, 0, [16, 24, 27, null]],
            [24, "divide", 0, 0, [23, 25, 26]],
            [25, ["number", { "value": 1 }], 0, 0, [24]],
            [26, ["number", { "value": 4 }], 0, 0, [24]],
            [27, "pitch", 0, 0, [23, 28, 29, null]],
            [28, ["solfege", { "value": "sol" }], 0, 0, [27]],
            [29, ["number", { "value": 4 }], 0, 0, [27]],
            [30, "action", 500, 200, [null, 31, 32, null]],
            [31, ["text", { "value": "chunk1" }], 0, 0, [30]],
            [32, "newnote", 0, 0, [30, 33, 36, 39]],
            [33, "divide", 0, 0, [32, 34, 35]],
            [34, ["number", { "value": 1 }], 0, 0, [33]],
            [35, ["number", { "value": 4 }], 0, 0, [33]],
            [36, "pitch", 0, 0, [32, 37, 38, null]],
            [37, ["solfege", { "value": "ti" }], 0, 0, [36]],
            [38, ["number", { "value": 4 }], 0, 0, [36]],
            [39, "newnote", 0, 0, [32, 40, 43, 46]],
            [40, "divide", 0, 0, [39, 41, 42]],
            [41, ["number", { "value": 1 }], 0, 0, [40]],
            [42, ["number", { "value": 4 }], 0, 0, [40]],
            [43, "pitch", 0, 0, [39, 44, 45, null]],
            [44, ["solfege", { "value": "do" }], 0, 0, [43]],
            [45, ["number", { "value": 4 }], 0, 0, [43]],
            [46, "newnote", 0, 0, [39, 47, 50, null]],
            [47, "divide", 0, 0, [46, 48, 49]],
            [48, ["number", { "value": 1 }], 0, 0, [47]],
            [49, ["number", { "value": 2 }], 0, 0, [47]],
            [50, "pitch", 0, 0, [46, 51, 52, null]],
            [51, ["solfege", { "value": "re" }], 0, 0, [50]],
            [52, ["number", { "value": 5 }], 0, 0, [50]],
            [53, "action", 800, 200, [null, 54, 55, null]],
            [54, ["text", { "value": "chunk2" }], 0, 0, [53]],
            [55, "newnote", 0, 0, [53, 56, 59, 62]],
            [56, "divide", 0, 0, [55, 57, 58]],
            [57, ["number", { "value": 1 }], 0, 0, [56]],
            [58, ["number", { "value": 8 }], 0, 0, [56]],
            [59, "pitch", 0, 0, [55, 60, 61, null]],
            [60, ["solfege", { "value": "re" }], 0, 0, [59]],
            [61, ["number", { "value": 5 }], 0, 0, [59]],
            [62, "newnote", 0, 0, [55, 63, 66, 69]],
            [63, "divide", 0, 0, [62, 64, 65]],
            [64, ["number", { "value": 1 }], 0, 0, [63]],
            [65, ["number", { "value": 8 }], 0, 0, [63]],
            [66, "pitch", 0, 0, [62, 67, 68, null]],
            [67, ["solfege", { "value": "mi" }], 0, 0, [66]],
            [68, ["number", { "value": 5 }], 0, 0, [66]],
            [69, "newnote", 0, 0, [62, 70, 73, 76]],
            [70, "divide", 0, 0, [69, 71, 72]],
            [71, ["number", { "value": 1 }], 0, 0, [70]],
            [72, ["number", { "value": 8 }], 0, 0, [70]],
            [73, "pitch", 0, 0, [69, 74, 75, null]],
            [74, ["solfege", { "value": "re" }], 0, 0, [73]],
            [75, ["number", { "value": 5 }], 0, 0, [73]],
            [76, "newnote", 0, 0, [69, 77, 80, 83]],
            [77, "divide", 0, 0, [76, 78, 79]],
            [78, ["number", { "value": 1 }], 0, 0, [77]],
            [79, ["number", { "value": 8 }], 0, 0, [77]],
            [80, "pitch", 0, 0, [76, 81, 82, null]],
            [81, ["solfege", { "value": "do" }], 0, 0, [80]],
            [82, ["number", { "value": 5 }], 0, 0, [80]],
            [83, "newnote", 0, 0, [76, 84, 87, 90]],
            [84, "divide", 0, 0, [83, 85, 86]],
            [85, ["number", { "value": 1 }], 0, 0, [84]],
            [86, ["number", { "value": 4 }], 0, 0, [84]],
            [87, "pitch", 0, 0, [83, 88, 89, null]],
            [88, ["solfege", { "value": "ti" }], 0, 0, [87]],
            [89, ["number", { "value": 5 }], 0, 0, [87]],
            [90, "newnote", 0, 0, [83, 91, 94, null]],
            [91, "divide", 0, 0, [90, 92, 93]],
            [92, ["number", { "value": 1 }], 0, 0, [91]],
            [93, ["number", { "value": 4 }], 0, 0, [91]],
            [94, "pitch", 0, 0, [90, 95, 96, null]],
            [95, ["solfege", { "value": "sol" }], 0, 0, [94]],
            [96, ["number", { "value": 4 }], 0, 0, [94]],
            [97, "action", 1100, 200, [null, 98, 99, null]],
            [98, ["text", { "value": "chunk3" }], 0, 0, [97]],
            [99, "newnote", 0, 0, [97, 100, 103, 106]],
            [100, "divide", 0, 0, [99, 101, 102]],
            [101, ["number", { "value": 1 }], 0, 0, [100]],
            [102, ["number", { "value": 4 }], 0, 0, [100]],
            [103, "pitch", 0, 0, [99, 104, 105, null]],
            [104, ["solfege", { "value": "sol" }], 0, 0, [103]],
            [105, ["number", { "value": 4 }], 0, 0, [103]],
            [106, "newnote", 0, 0, [99, 107, 110, 113]],
            [107, "divide", 0, 0, [106, 108, 109]],
            [108, ["number", { "value": 1 }], 0, 0, [107]],
            [109, ["number", { "value": 4 }], 0, 0, [107]],
            [110, "pitch", 0, 0, [106, 111, 112, null]],
            [111, ["solfege", { "value": "re" }], 0, 0, [110]],
            [112, ["number", { "value": 4 }], 0, 0, [110]],
            [113, "newnote", 0, 0, [106, 114, 117, null]],
            [114, "divide", 0, 0, [113, 115, 116]],
            [115, ["number", { "value": 1 }], 0, 0, [114]],
            [116, ["number", { "value": 4 }], 0, 0, [114]],
            [117, "pitch", 0, 0, [113, 118, 119, null]],
            [118, ["solfege", { "value": "sol" }], 0, 0, [117]],
            [119, ["number", { "value": 4 }], 0, 0, [117]],
            [120, "start", 1400, 200, [null, 121, null]],
            [121, "repeat", 0, 0, [120, 122, 123, 124]],
            [122, ["number", { "value": 2 }], 0, 0, [121]],
            [123, ["nameddo", { "value": "chunk0" }], 0, 0, [121, null]],
            [124, "repeat", 0, 0, [121, 125, 126, 127]],
            [125, ["number", { "value": 2 }], 0, 0, [124]],
            [126, ["nameddo", { "value": "chunk1" }], 0, 0, [124, null]],
            [127, "repeat", 0, 0, [124, 128, 129, 130]],
            [128, ["number", { "value": 2 }], 0, 0, [127]],
            [129, ["nameddo", { "value": "chunk2" }], 0, 0, [127, null]],
            [130, "repeat", 0, 0, [127, 131, 132, null]],
            [131, ["number", { "value": 2 }], 0, 0, [130]],
            [132, ["nameddo", { "value": "chunk3" }], 0, 0, [130, null]]
        ];

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        let trees = AST2BlockList.toTrees(AST);
        let blockList = AST2BlockList.toBlockList(trees);
        expect(blockList).toEqual(expectedBlockList);
    });

    // Test Dictionary.
    // Support setValue and getValue.
    // Also support function overloading - setValue and getValue can take different number of arguments.
    test('should generate correct blockList for dictionary operations', () => {
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
        MusicBlocks.run();`

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
            [21, "newnote", 0, 0, [17, 22, 25, 30]],
            [22, "divide", 0, 0, [21, 23, 24]],
            [23, ["number", { "value": 1 }], 0, 0, [22]],
            [24, ["number", { "value": 4 }], 0, 0, [22]],
            [25, "pitch", 0, 0, [21, 26, 27, null]],
            [26, ["solfege", { "value": "do" }], 0, 0, [25]],
            [27, "getDict", 0, 0, [25, 28, 29]],
            [28, ["text", { "value": "solfege" }], 0, 0, [27]],
            [29, ["text", { "value": "do" }], 0, 0, [27]],
            [30, "newnote", 0, 0, [21, 31, 34, 39]],
            [31, "divide", 0, 0, [30, 32, 33]],
            [32, ["number", { "value": 1 }], 0, 0, [31]],
            [33, ["number", { "value": 4 }], 0, 0, [31]],
            [34, "pitch", 0, 0, [30, 35, 36, null]],
            [35, ["solfege", { "value": "re" }], 0, 0, [34]],
            [36, "getDict", 0, 0, [34, 37, 38]],
            [37, ["text", { "value": "solfege" }], 0, 0, [36]],
            [38, ["text", { "value": "re" }], 0, 0, [36]],
            [39, "newnote", 0, 0, [30, 40, 43, 48]],
            [40, "divide", 0, 0, [39, 41, 42]],
            [41, ["number", { "value": 1 }], 0, 0, [40]],
            [42, ["number", { "value": 4 }], 0, 0, [40]],
            [43, "pitch", 0, 0, [39, 44, 45, null]],
            [44, ["solfege", { "value": "mi" }], 0, 0, [43]],
            [45, "getDict", 0, 0, [43, 46, 47]],
            [46, ["text", { "value": "solfege" }], 0, 0, [45]],
            [47, ["text", { "value": "mi" }], 0, 0, [45]],
            [48, "newnote", 0, 0, [39, 49, 52, null]],
            [49, "divide", 0, 0, [48, 50, 51]],
            [50, ["number", { "value": 1 }], 0, 0, [49]],
            [51, ["number", { "value": 4 }], 0, 0, [49]],
            [52, "pitch", 0, 0, [48, 53, 54, null]],
            [53, ["solfege", { "value": "fa" }], 0, 0, [52]],
            [54, "getDict", 0, 0, [52, 55, 56]],
            [55, ["text", { "value": "solfege" }], 0, 0, [54]],
            [56, ["text", { "value": "fa" }], 0, 0, [54]]
        ];

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        let trees = AST2BlockList.toTrees(AST);
        let blockList = AST2BlockList.toBlockList(trees);
        expect(blockList).toEqual(expectedBlockList);
    });
});