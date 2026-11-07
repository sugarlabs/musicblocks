/**
 * @jest-environment node
 */

/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2026 Sugar Labs
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

const { JSGenerate } = require("../generate");

describe("JSGenerate Node Environment Regression (#8908)", () => {
    beforeEach(() => {
        global.window = {};
        global.last = jest.fn(array => array[array.length - 1]);
        global.globalActivity = {
            blocks: {
                stackList: [],
                blockList: {},
                findStacks: jest.fn()
            }
        };
        global.ASTUtils = {
            BAREBONE_AST: { type: "Program", body: [] },
            getMethodAST: jest.fn(),
            getMouseAST: jest.fn(),
            setActionNames: jest.fn(),
            setStoppingActions: jest.fn(),
            getBoxNames: jest.fn(() => [])
        };
        global.astring = { generate: jest.fn() };
        global.JSInterface = { isGetter: jest.fn(() => false) };
    });

    afterEach(() => {
        delete global.BooleanBlock;
        delete global.window;
        delete global.globalActivity;
        delete global.last;
        delete global.ASTUtils;
        delete global.astring;
        delete global.JSInterface;
    });

    test("recognizes boolean comparison blocks when BooleanBlock is globally bound without window.BooleanBlock", () => {
        class GlobalBooleanBlock {}
        global.BooleanBlock = GlobalBooleanBlock;

        // In a true Node environment, global and window are distinct objects
        expect(global.window).not.toBe(global);
        expect(global.window.BooleanBlock).toBeUndefined();
        expect(global.BooleanBlock).toBe(GlobalBooleanBlock);

        const comparisonProtoblock = new GlobalBooleanBlock();
        comparisonProtoblock.style = "value";
        comparisonProtoblock.args = 2;

        global.globalActivity.blocks.stackList = [1];
        global.globalActivity.blocks.blockList = {
            1: {
                name: "start",
                trash: false,
                connections: [null, 2, null],
                protoblock: { style: "hat" }
            },
            2: {
                name: "if",
                connections: [1, 3, 6, null, null],
                protoblock: { style: "doubleclamp", args: 3 }
            },
            3: {
                name: "less_than_or_equal_to",
                connections: [2, 4, 5],
                protoblock: comparisonProtoblock
            },
            4: {
                name: "number",
                value: 1,
                connections: [3],
                protoblock: { style: "value" }
            },
            5: {
                name: "number",
                value: 2,
                connections: [3],
                protoblock: { style: "value" }
            },
            6: {
                name: "forward",
                connections: [2, 7, null],
                protoblock: { style: "command", args: 1 }
            },
            7: {
                name: "number",
                value: 10,
                connections: [6],
                protoblock: { style: "value" }
            }
        };

        JSGenerate.generateStacksTree();
        expect(JSGenerate.startTrees.length).toBe(1);
        const ifStatement = JSGenerate.startTrees[0][0];
        expect(ifStatement[0]).toBe("if");
        expect(ifStatement[1][0]).toEqual(["less_than_or_equal_to", [1, 2]]);
    });
});
