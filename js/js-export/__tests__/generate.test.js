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

const { JSGenerate } = require("../generate");
global.last = jest.fn((array) => array[array.length - 1]);
const globalActivity = {
    blocks: {
        stackList: [],
        blockList: {},
        findStacks: jest.fn(),
    },
};
global.globalActivity = globalActivity;
global.console = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
};
const ASTUtils = {
    BAREBONE_AST: { type: "Program", body: [] },
    getMethodAST: jest.fn(),
    getMouseAST: jest.fn(),
};
const astring = {
    generate: jest.fn(),
};

global.ASTUtils = ASTUtils;
global.astring = astring;

describe("JSGenerate Class", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        JSGenerate.startBlocks = [];
        JSGenerate.actionBlocks = [];
        JSGenerate.startTrees = [];
        JSGenerate.actionTrees = [];
        JSGenerate.actionNames = [];
        JSGenerate.AST = { type: "Program", body: [] };
        JSGenerate.code = "";
        JSGenerate.generateFailed = false;
    });

    test("should generate correct AST structure", () => {
        JSGenerate.actionTrees = [[["action", null, null]]];
        JSGenerate.actionNames = ["action1"];
        JSGenerate.startTrees = [[["start", null, null]]];

        const expectedAST = {
            type: "Program",
            body: [
                { type: "Method" },
                { type: "Mouse" },
            ],
        };

        ASTUtils.getMethodAST.mockReturnValue({ type: "Method" });
        ASTUtils.getMouseAST.mockReturnValue({ type: "Mouse" });
        astring.generate.mockReturnValue("generated code");

        JSGenerate.generateCode();

        expect(JSGenerate.AST).toEqual(expectedAST);
        expect(JSGenerate.code).toBe("generated code");
        expect(JSGenerate.generateFailed).toBe(false);
    });

    test("should handle code generation failure", () => {
        JSGenerate.actionTrees = [[["action", null, null]]];
        JSGenerate.actionNames = ["action1"];
        JSGenerate.startTrees = [[["start", null, null]]];

        ASTUtils.getMethodAST.mockImplementation(() => {
            throw new Error("Failed to generate AST");
        });

        JSGenerate.generateCode();

        expect(JSGenerate.generateFailed).toBe(true);
        expect(console.error).toHaveBeenCalledWith(
            "CANNOT GENERATE ABSTRACT SYNTAX TREE\nError:",
            expect.any(Error)
        );
        expect(JSGenerate.code).toBe(astring.generate(ASTUtils.BAREBONE_AST));
    });

    test("should print stacks tree", () => {
        JSGenerate.startTrees = [[["start", null, null]]];
        JSGenerate.actionTrees = [[["action", null, null]]];
        JSGenerate.actionNames = ["action1"];

        JSGenerate.printStacksTree();

        expect(console.log).toHaveBeenCalledWith(
            "\n   %c START ",
            "background: navy; color: white; font-weight: bold"
        );
        expect(console.log).toHaveBeenCalledWith(
            "\n   %c ACTION ",
            "background: green; color: white; font-weight: bold"
        );
    });

    test("should handle empty start and action trees", () => {
        JSGenerate.startTrees = [];
        JSGenerate.actionTrees = [];

        JSGenerate.printStacksTree();

        expect(console.log).toHaveBeenCalledWith("%cno start trees generated", "color: tomato");
        expect(console.log).toHaveBeenCalledWith("%cno action trees generated", "color: tomato");
    });

    test("should handle invalid action name", () => {
        globalActivity.blocks.stackList = [1];
        globalActivity.blocks.blockList = {
            1: { name: "action", trash: false, connections: [null, 2, 3] },
            2: { name: "namedbox", value: null, connections: [null] },
            3: { name: "value", value: "arg1", connections: [null] },
        };

        JSGenerate.generateStacksTree();

        expect(JSGenerate.actionNames).toEqual([]);
    });

    test("should handle invalid block connections", () => {
        globalActivity.blocks.stackList = [1];
        globalActivity.blocks.blockList = {
            1: { name: "start", trash: false, connections: [] },
        };

        JSGenerate.generateStacksTree();

        expect(JSGenerate.startTrees).toEqual([[]]);
    });

    test("should run code generator with print options", () => {
        JSGenerate.actionTrees = [[["action", null, null]]];
        JSGenerate.actionNames = ["action1"];
        JSGenerate.startTrees = [[["start", null, null]]];

        ASTUtils.getMethodAST.mockReturnValue({ type: "Method" });
        ASTUtils.getMouseAST.mockReturnValue({ type: "Mouse" });
        astring.generate.mockReturnValue("generated code");

        JSGenerate.run(true, true);

        expect(console.log).toHaveBeenCalledWith(
            "\n   %c STACK TREES ",
            "background: greenyellow; color: midnightblue; font-weight: bold"
        );
        expect(console.log).toHaveBeenCalledWith(
            "\n   %c CODE ",
            "background: greenyellow; color: midnightblue; font-weight: bold"
        );
        expect(console.log).toHaveBeenCalledWith("generated code");
    });
});
