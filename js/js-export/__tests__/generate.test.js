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
global.last = jest.fn(array => array[array.length - 1]);
const globalActivity = {
    blocks: {
        stackList: [],
        blockList: {},
        findStacks: jest.fn()
    }
};
global.globalActivity = globalActivity;
global.console = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
};
const ASTUtils = {
    BAREBONE_AST: { type: "Program", body: [] },
    getMethodAST: jest.fn(),
    getMouseAST: jest.fn()
};
const astring = {
    generate: jest.fn()
};

global.ASTUtils = ASTUtils;
global.astring = astring;

global.JSInterface = {
    isGetter: jest.fn(name => name === "myGetter")
};

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
            body: [{ type: "Method" }, { type: "Mouse" }]
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
            3: { name: "value", value: "arg1", connections: [null] }
        };

        JSGenerate.generateStacksTree();

        expect(JSGenerate.actionNames).toEqual([]);
    });

    test("should handle invalid block connections", () => {
        globalActivity.blocks.stackList = [1];
        globalActivity.blocks.blockList = {
            1: { name: "start", trash: false, connections: [] }
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
    test("should generate stack trees with various block types and arguments", () => {
        globalActivity.blocks.stackList = [1, 20];
        const booleanGrandParent = { constructor: { name: "BooleanBlock" } };
        const booleanParent = Object.create(booleanGrandParent);
        const booleanProtoblock = Object.create(booleanParent);
        booleanProtoblock.style = "value";
        const standardGrandParent = { constructor: { name: "StandardBlock" } };
        const standardParent = Object.create(standardGrandParent);
        const standardProtoblock = Object.create(standardParent);
        standardProtoblock.style = "value";

        globalActivity.blocks.blockList = {
            1: {
                name: "start",
                trash: false,
                connections: [null, 2, null],
                protoblock: { style: "hat" }
            },
            2: {
                name: "storein2",
                privateData: "myVar",
                connections: [1, 4, 3],
                protoblock: { style: "command", args: 1 }
            },
            4: {
                name: "hspace",
                connections: [2, 5],
                protoblock: { style: "spacer" }
            },
            5: {
                name: "value",
                value: 42,
                connections: [4],
                protoblock: standardProtoblock
            },
            3: {
                name: "if",
                connections: [2, 6, 7, 10, 13],
                protoblock: { style: "doubleclamp", args: 3 }
            },
            6: {
                name: "boolean",
                value: "true",
                connections: [3],
                protoblock: booleanProtoblock
            },
            7: {
                name: "nameddo",
                privateData: "myProc",
                connections: [3, 8],
                protoblock: { style: "command" }
            },
            8: { name: "hidden", connections: [7, 9], protoblock: { style: "command" } },
            9: { name: "command", connections: [8, null], protoblock: { style: "command" } },

            10: {
                name: "repeat",
                connections: [3, 11, 12, null],
                protoblock: { style: "clamp", args: 2 }
            },
            11: {
                name: "namedbox",
                privateData: "box1",
                connections: [10],
                protoblock: standardProtoblock
            },
            12: { name: "command", connections: [10, null], protoblock: { style: "command" } },
            13: { name: "command", connections: [3, null], protoblock: { style: "command" } },
            20: {
                name: "action",
                trash: false,
                connections: [null, 21, 22, null],
                protoblock: { style: "hat" }
            },
            21: {
                name: "value",
                value: "myAction",
                connections: [20],
                protoblock: standardProtoblock
            },
            22: {
                name: "myGetter",
                connections: [20, null],
                protoblock: { style: "value" }
            }
        };

        JSGenerate.generateStacksTree();

        expect(JSGenerate.startTrees.length).toBe(1);
        expect(JSGenerate.actionTrees.length).toBe(1);
        expect(JSGenerate.actionNames).toContain("myAction");

        const tree = JSGenerate.startTrees[0];
        expect(tree[0][0]).toBe("storein2_myVar");
        expect(tree[0][1][0]).toBe(42);
        expect(tree[1][0]).toBe("if");
        expect(tree[1][1][0]).toBe("bool_true");
        expect(tree[1][2][0][0]).toBe("nameddo_myProc");
        expect(tree[1][3][0][1][0]).toBe("box_box1");
    });

    test("should warn when clamp block flows left", () => {
        globalActivity.blocks.stackList = [1];
        globalActivity.blocks.blockList = {
            1: {
                name: "start",
                trash: false,
                connections: [null, 2, null],
                protoblock: { style: "hat" }
            },
            2: {
                name: "command",
                connections: [1, 3, null],
                protoblock: { style: "command", args: 1 }
            },
            3: {
                name: "badClamp",
                connections: [2],
                protoblock: {
                    style: "clamp",
                    _style: { flows: { left: true } }
                }
            }
        };

        const warnSpy = jest.spyOn(console, "warn").mockImplementation();
        JSGenerate.generateStacksTree();
        expect(warnSpy).toHaveBeenCalledWith('CANNOT PROCESS "badClamp" BLOCK');
        warnSpy.mockRestore();
    });
    test("should print complex stack trees with nested args and flows", () => {
        JSGenerate.startTrees = [
            [
                ["block1", ["arg1", "subArg"], null],
                ["block2", null, [["flow1Block", null, null]], [["flow2Block", null, null]]]
            ]
        ];
        JSGenerate.actionTrees = [[["actionBlock", null, null]]];

        JSGenerate.printStacksTree();
        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining("(arg1, subArg)"),
            "background: mediumslateblue",
            "background; none",
            "color: dodgerblue"
        );
        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining("** NEXTFLOW **"),
            "color: green"
        );
        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining("ACTION"),
            "background: green; color: white; font-weight: bold"
        );
    });
    test("should handle astring generation errors", () => {
        JSGenerate.AST = { type: "Program", body: [] };
        astring.generate
            .mockImplementationOnce(() => {
                throw new Error("Code Gen Error");
            })
            .mockImplementationOnce(() => "fallback code");

        JSGenerate.generateCode();

        expect(JSGenerate.generateFailed).toBe(true);
        expect(console.error).toHaveBeenCalledWith(
            "CANNOT GENERATE CODE\nError: INVALID ABSTRACT SYNTAX TREE"
        );
        expect(JSGenerate.code).toBe("fallback code");
    });
});
