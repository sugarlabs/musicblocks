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
            [0,"start",200,200,[null,1,null]],
            [1,"settimbre",0,0,[0,2,3,null]],
            [2,["voicename",{"value":"guitar"}],0,0,[1]],
            [3,"newnote",0,0,[1,4,9,null]],
            [4,"multiply",0,0,[3,5,8]],
            [5,"abs",0,0,[4,6]],
            [6,"neg",0,0,[5,7]],
            [7,["number",{"value":2}],0,0,[6]],
            [8,["number",{"value":1}],0,0,[4]],
            [9,"pitch",0,0,[3,10,11,null]],
            [10,["solfege",{"value":"mi"}],0,0,[9]],
            [11,"abs",0,0,[9,12]],
            [12,"neg",0,0,[11,13]],
            [13,["number",{"value":2}],0,0,[12]]
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
            [0,"start",200,200,[null,1,null]], 
            [1,"settimbre",0,0,[0,2,3,null]], 
            [2,["voicename",{"value":"clarinet"}],0,0,[1]], 
            [3,"repeat",0,0,[1,4,7,null]], 
            [4,"random",0,0,[3,5,6]], 
            [5,["number",{"value":1}],0,0,[4]], 
            [6,["number",{"value":5}],0,0,[4]], 
            [7,"newnote",0,0,[3,8,11,null]], 
            [8,"divide",0,0,[7,9,10]], 
            [9,["number",{"value":1}],0,0,[8]], 
            [10,["number",{"value":4}],0,0,[8]], 
            [11,"pitch",0,0,[7,12,13,null]], 
            [12,["solfege",{"value":"fa"}],0,0,[11]], 
            [13,"multiply",0,0,[11,14,15]], 
            [14,["number",{"value":2}],0,0,[13]], 
            [15,["number",{"value":2}],0,0,[13]]
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
            [0,"start",200,200,[null,1,null]],
            [1,"if",0,0,[0,2,8,null]],
            [2,"not",0,0,[1,3]],
            [3,"equal",0,0,[2,4,7]],
            [4,"random",0,0,[3,5,6]],
            [5,["number",{"value":0}],0,0,[4]],
            [6,["number",{"value":1}],0,0,[4]],
            [7,["number",{"value":1}],0,0,[3]],
            [8,"settimbre",0,0,[1,9,10,null]],
            [9,["voicename",{"value":"electronic synth"}],0,0,[8]],
            [10,"newnote",0,0,[8,11,14,null]],
            [11,"divide",0,0,[10,12,13]],
            [12,["number",{"value":1}],0,0,[11]],
            [13,["number",{"value":4}],0,0,[11]],
            [14,"pitch",0,0,[10,15,16,null]],
            [15,["solfege",{"value":"sol"}],0,0,[14]],
            [16,["number",{"value":4}],0,0,[14]]
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
            [0,"action",200,200,[null,1,2,null]],
            [1,["text",{"value":"playSol"}],0,0,[0]],
            [2,"newnote",0,0,[0,3,6,9]],
            [3,"divide",0,0,[2,4,5]],
            [4,["number",{"value":1}],0,0,[3]],
            [5,["number",{"value":4}],0,0,[3]],
            [6,"pitch",0,0,[2,7,8,null]],
            [7,["solfege",{"value":"sol"}],0,0,[6]],
            [8,["number",{"value":2}],0,0,[6]],
            [9,"decrementOne",0,0,[2,10,11]],
            [10,["namedbox",{"value":"box1"}],0,0,[9]],
            [11,"if",0,0,[9,12,15,null]],
            [12,"greater",0,0,[11,13,14]],
            [13,["namedbox",{"value":"box1"}],0,0,[12]],
            [14,["number",{"value":0}],0,0,[12]],
            [15,["nameddo",{"value":"playSol"}],0,0,[11,null]],
            [16,"start",500,200,[null,17,null]],
            [17,["storein2",{"value":"box1"}],0,0,[16,18,23]],
            [18,"multiply",0,0,[17,19,22]],
            [19,"abs",0,0,[18,20]],
            [20,"neg",0,0,[19,21]],
            [21,["number",{"value":2}],0,0,[20]],
            [22,["number",{"value":3}],0,0,[18]],
            [23,"settimbre",0,0,[17,24,25,null]],
            [24,["voicename",{"value":"electronic synth"}],0,0,[23]],
            [25,["nameddo",{"value":"playSol"}],0,0,[23,null]]
        ];

        const AST = acorn.parse(code, { ecmaVersion: 2020 });
        let trees = AST2BlockList.toTrees(AST);
        let blockList = AST2BlockList.toBlockList(trees);
        expect(blockList).toEqual(expectedBlockList);
    });
});