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

const ASTUtils = require("../ASTutils");

global.last = jest.fn((array) => array[array.length - 1]);
global.JSInterface = {
    isSetter: jest.fn(),
    getSetterName: jest.fn(),
    isMethod: jest.fn(),
    isClampBlock: jest.fn(),
    getMethodName: jest.fn((methodName) => methodName),
    isGetter: jest.fn(),
    getGetterName: jest.fn((getterName) => getterName),
    methodReturns: jest.fn(),
    rearrangeMethodArgs: jest.fn((methodName, args) => args),
};
ASTUtils.JSInterface = JSInterface;

describe("ASTUtils", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("BAREBONE_AST", () => {
        it("should return the barebone AST", () => {
            const result = ASTUtils.BAREBONE_AST;
            expect(result).toEqual(ASTUtils._bareboneAST);
        });
    });

    describe("_getSetAST", () => {
        it("should return the AST for a setter statement", () => {
            const identifier = "testIdentifier";
            const args = ["testArg"];
            const result = ASTUtils._getSetAST(identifier, args);
            expect(result).toEqual({
                type: "ExpressionStatement",
                expression: {
                    type: "AssignmentExpression",
                    left: {
                        type: "MemberExpression",
                        object: {
                            type: "Identifier",
                            name: "mouse"
                        },
                        computed: false,
                        property: {
                            type: "Identifier",
                            name: `${identifier}`
                        }
                    },
                    operator: "=",
                    right: ASTUtils._getArgsAST(args)[0]
                }
            });
        });
    });

    describe("_getGetAST", () => {
        it("should return the AST for a getter statement", () => {
            const identifier = "testIdentifier";
            const result = ASTUtils._getGetAST(identifier);
            expect(result).toEqual({
                type: "MemberExpression",
                object: {
                    type: "Identifier",
                    name: "mouse"
                },
                computed: false,
                property: {
                    type: "Identifier",
                    name: `${identifier}`
                }
            });
        });
    });

    describe("_getGetAST", () => {
        it("should return the AST for a getter statement", () => {
            const identifier = "testIdentifier";
            const result = ASTUtils._getGetAST(identifier);
            expect(result).toEqual({
                type: "MemberExpression",
                object: {
                    type: "Identifier",
                    name: "mouse"
                },
                computed: false,
                property: {
                    type: "Identifier",
                    name: `${identifier}`
                }
            });
        });
    });

    describe("_getIfAST", () => {
        it("should return the AST for an if statement", () => {
            const args = ["testArg"];
            const ifFlow = [["action1", ["arg1"]]];
            const iteratorNum = 0;

            JSInterface.isMethod.mockReturnValue(true);
            JSInterface.isClampBlock.mockReturnValue(false);

            const result = ASTUtils._getIfAST(args, ifFlow, undefined, iteratorNum);
            expect(result).toEqual({
                type: "IfStatement",
                test: ASTUtils._getArgsAST(args)[0],
                consequent: {
                    type: "BlockStatement",
                    body: ASTUtils._getBlockAST(ifFlow, iteratorNum)
                },
                alternate: null
            });
        });

        it("should return the AST for an if-else statement", () => {
            const args = ["testArg"];
            const ifFlow = [["action1", ["arg1"]]];
            const elseFlow = [["action2", ["arg2"]]];
            const iteratorNum = 0;

            JSInterface.isMethod.mockReturnValue(true);
            JSInterface.isClampBlock.mockReturnValue(false);

            const result = ASTUtils._getIfAST(args, ifFlow, elseFlow, iteratorNum);
            expect(result).toEqual({
                type: "IfStatement",
                test: ASTUtils._getArgsAST(args)[0],
                consequent: {
                    type: "BlockStatement",
                    body: ASTUtils._getBlockAST(ifFlow, iteratorNum)
                },
                alternate: {
                    type: "BlockStatement",
                    body: ASTUtils._getBlockAST(elseFlow, iteratorNum)
                }
            });
        });
    });

    describe("_getForLoopAST", () => {
        it("should return the AST for a for-loop statement", () => {
            const args = ["testArg"];
            const flow = ["flow"];
            const iteratorNum = 0;
            const result = ASTUtils._getForLoopAST(args, flow, iteratorNum);
            expect(result).toEqual({
                type: "ForStatement",
                init: {
                    type: "VariableDeclaration",
                    kind: "let",
                    declarations: [
                        {
                            type: "VariableDeclarator",
                            id: {
                                type: "Identifier",
                                name: "i" + iteratorNum
                            },
                            init: {
                                type: "Literal",
                                value: 0
                            }
                        }
                    ]
                },
                test: {
                    type: "BinaryExpression",
                    left: {
                        type: "Identifier",
                        name: "i" + iteratorNum
                    },
                    right: ASTUtils._getArgsAST(args)[0],
                    operator: "<"
                },
                update: {
                    type: "UpdateExpression",
                    argument: {
                        type: "Identifier",
                        name: "i" + iteratorNum
                    },
                    operator: "++",
                    prefix: false
                },
                body: {
                    type: "BlockStatement",
                    body: ASTUtils._getBlockAST(flow, iteratorNum + 1)
                }
            });
        });
    });

    describe("_getWhileLoopAST", () => {
        it("should return the AST for a while-loop statement", () => {
            const args = ["testArg"];
            const flow = ["flow"];
            const iteratorNum = 0;
            const result = ASTUtils._getWhileLoopAST(args, flow, iteratorNum);
            expect(result).toEqual({
                type: "WhileStatement",
                test: ASTUtils._getArgsAST(args)[0],
                body: {
                    type: "BlockStatement",
                    body: ASTUtils._getBlockAST(flow, iteratorNum)
                }
            });
        });
    });

    describe("_getDoWhileLoopAST", () => {
        it("should return the AST for a do-while-loop statement", () => {
            const args = ["testArg"];
            const flow = ["flow"];
            const iteratorNum = 0;
            const result = ASTUtils._getDoWhileLoopAST(args, flow, iteratorNum);
            expect(result).toEqual({
                type: "DoWhileStatement",
                body: {
                    type: "BlockStatement",
                    body: ASTUtils._getBlockAST(flow, iteratorNum)
                },
                test: ASTUtils._getArgsAST(args)[0]
            });
        });
    });

    describe("_getIncrementStmntAST", () => {
        it("should return the AST for an increment statement", () => {
            const args = ["var_testIdentifier", "testArg"];
            const isIncrement = true;
            const result = ASTUtils._getIncrementStmntAST(args, isIncrement);
            expect(result).toEqual({
                type: "ExpressionStatement",
                expression: {
                    type: "AssignmentExpression",
                    left: {
                        type: "Identifier",
                        name: "testIdentifier"
                    },
                    operator: "=",
                    right: {
                        type: "BinaryExpression",
                        left: {
                            type: "Identifier",
                            name: "testIdentifier"
                        },
                        right: ASTUtils._getArgsAST(["testArg"])[0],
                        operator: "+"
                    }
                }
            });
        });

        it("should return the AST for a decrement statement", () => {
            const args = ["var_testIdentifier", "testArg"];
            const isIncrement = false;
            const result = ASTUtils._getIncrementStmntAST(args, isIncrement);
            expect(result).toEqual({
                type: "ExpressionStatement",
                expression: {
                    type: "AssignmentExpression",
                    left: {
                        type: "Identifier",
                        name: "testIdentifier"
                    },
                    operator: "=",
                    right: {
                        type: "BinaryExpression",
                        left: {
                            type: "Identifier",
                            name: "testIdentifier"
                        },
                        right: ASTUtils._getArgsAST(["testArg"])[0],
                        operator: "-"
                    }
                }
            });
        });
    });

    describe("_getMethodDefAST", () => {
        it("should return the AST for a method definition", () => {
            const methodName = "testMethod";
            const result = ASTUtils._getMethodDefAST(methodName);
            expect(result).toEqual({
                type: "VariableDeclaration",
                kind: "let",
                declarations: [
                    {
                        type: "VariableDeclarator",
                        id: {
                            type: "Identifier",
                            name: `${methodName}`
                        },
                        init: {
                            type: "ArrowFunctionExpression",
                            params: [
                                {
                                    type: "Identifier",
                                    name: "mouse"
                                }
                            ],
                            body: {
                                type: "BlockStatement",
                                body: [
                                    {
                                        type: "ReturnStatement",
                                        argument: {
                                            type: "MemberExpression",
                                            object: {
                                                type: "Identifier",
                                                name: "mouse"
                                            },
                                            computed: false,
                                            property: {
                                                type: "Identifier",
                                                name: "ENDFLOW"
                                            }
                                        }
                                    }
                                ]
                            },
                            async: true,
                            expression: false
                        }
                    }
                ]
            });
        });
    });

    describe("_getMethodCallAST", () => {
        it("should return the AST for a method call without function argument", () => {
            const methodName = "testMethod";
            const args = ["testArg"];
            const props = { action: false, statement: true };
            JSInterface.getMethodName.mockReturnValue(methodName);
            const result = ASTUtils._getMethodCallAST(methodName, args, props);
            expect(result).toEqual({
                type: "ExpressionStatement",
                expression: {
                    type: "AwaitExpression",
                    argument: {
                        type: "CallExpression",
                        callee: {
                            type: "MemberExpression",
                            object: {
                                type: "Identifier",
                                name: "mouse"
                            },
                            computed: false,
                            property: {
                                type: "Identifier",
                                name: methodName
                            }
                        },
                        arguments: ASTUtils._getArgsAST(args)
                    }
                }
            });
        });

        it("should return the AST for a method call with action property", () => {
            const methodName = "testMethod";
            const args = ["testArg"];
            const props = { action: true, statement: true };
            const result = ASTUtils._getMethodCallAST(methodName, args, props);
            expect(result).toEqual({
                type: "ExpressionStatement",
                expression: {
                    type: "AwaitExpression",
                    argument: {
                        type: "CallExpression",
                        callee: {
                            type: "Identifier",
                            name: `${methodName}`
                        },
                        arguments: [
                            {
                                type: "Identifier",
                                name: "mouse"
                            }
                        ]
                    }
                }
            });
        });

        it("should return the AST for a method call with statement property false", () => {
            const methodName = "testMethod";
            const args = ["testArg"];
            const props = { action: false, statement: false };
            const result = ASTUtils._getMethodCallAST(methodName, args, props);
            expect(result).toEqual({
                type: "AwaitExpression",
                argument: {
                    type: "CallExpression",
                    callee: {
                        type: "MemberExpression",
                        object: {
                            type: "Identifier",
                            name: "mouse"
                        },
                        computed: false,
                        property: {
                            type: "Identifier",
                            name: `${JSInterface.getMethodName(methodName)}`
                        }
                    },
                    arguments: ASTUtils._getArgsAST(
                        JSInterface.rearrangeMethodArgs(methodName, args)
                    )
                }
            });
        });
    });

    describe("_getArgExpAST", () => {
        it("should return the AST for a binary expression", () => {
            const methodName = "plus";
            const args = ["arg1", "arg2"];
            const result = ASTUtils._getArgExpAST(methodName, args);
            expect(result).toEqual({
                type: "BinaryExpression",
                left: ASTUtils._getArgsAST([args[0]])[0],
                right: ASTUtils._getArgsAST([args[1]])[0],
                operator: "+"
            });
        });

        it("should return the AST for a unary expression", () => {
            const methodName = "not";
            const args = ["arg1"];
            const result = ASTUtils._getArgExpAST(methodName, args);
            expect(result).toEqual({
                type: "UnaryExpression",
                operator: "!",
                argument: ASTUtils._getArgsAST([args[0]])[0],
                prefix: true
            });
        });

        it("should return the AST for a method call expression", () => {
            const methodName = "abs";
            const args = ["arg1"];
            const result = ASTUtils._getArgExpAST(methodName, args);
            expect(result).toEqual({
                type: "CallExpression",
                callee: {
                    type: "Identifier",
                    name: "Math.abs"
                },
                arguments: ASTUtils._getArgsAST(args)
            });
        });
    });

    describe("_getArgsAST", () => {
        it("should return an empty array for undefined or null args", () => {
            expect(ASTUtils._getArgsAST(undefined)).toEqual([]);
            expect(ASTUtils._getArgsAST(null)).toEqual([]);
        });

        it("should return the AST for a literal argument", () => {
            const args = ["testArg"];
            const result = ASTUtils._getArgsAST(args);
            expect(result).toEqual([{
                type: "Literal",
                value: "testArg"
            }]);
        });

        it("should return the AST for a boolean argument", () => {
            const args = ["bool_true"];
            const result = ASTUtils._getArgsAST(args);
            expect(result).toEqual([{
                type: "Literal",
                value: true
            }]);
        });

        it("should return the AST for a box argument", () => {
            const args = ["box_testBox"];
            const result = ASTUtils._getArgsAST(args);
            expect(result).toEqual([{
                type: "Identifier",
                name: "testBox"
            }]);
        });

        it("should return the AST for a getter argument", () => {
            const args = [{ 0: "getter_testGetter" }];
            JSInterface.isGetter.mockReturnValue(true);
            JSInterface.getGetterName.mockReturnValue("testGetter");

            const result = ASTUtils._getArgsAST(args);
            expect(result).toEqual([ASTUtils._getGetAST("testGetter")]);
        });

        it("should return the AST for a method call argument", () => {
            const args = [{ 0: "testMethod", 1: ["testArg"] }];
            JSInterface.isGetter.mockReturnValue(false);
            JSInterface.methodReturns.mockReturnValue(true);

            const result = ASTUtils._getArgsAST(args);
            expect(result).toEqual([ASTUtils._getMethodCallAST("testMethod", ["testArg"], { statement: false })]);
        });

        it("should return the AST for a method call argument with methodReturns true", () => {
            const args = [{ 0: "testMethod", 1: ["testArg"] }];
            JSInterface.methodReturns = jest.fn().mockReturnValue(true);
            const result = ASTUtils._getArgsAST(args);
            expect(result).toEqual([ASTUtils._getMethodCallAST("testMethod", ["testArg"], { statement: false })]);
        });

        it("should return the AST for a method call argument with methodReturns false", () => {
            const args = [{ 0: "testMethod", 1: ["testArg"] }];
            JSInterface.methodReturns = jest.fn().mockReturnValue(false);
            const result = ASTUtils._getArgsAST(args);
            expect(result).toEqual([ASTUtils._getArgExpAST("testMethod", ["testArg"])]);
        });
    });

    describe("_getMethodCallClampAST", () => {
        it("should return the AST for a method call with function argument", () => {
            const methodName = "testMethod";
            const args = ["testArg"];
            const flows = ["flow"];
            const iteratorNum = 0;
            const result = ASTUtils._getMethodCallClampAST(methodName, args, flows, iteratorNum);
            expect(result).toEqual({
                type: "ExpressionStatement",
                expression: {
                    type: "AwaitExpression",
                    argument: {
                        type: "CallExpression",
                        callee: {
                            type: "MemberExpression",
                            object: {
                                type: "Identifier",
                                name: "mouse"
                            },
                            computed: false,
                            property: {
                                type: "Identifier",
                                name: `${JSInterface.getMethodName(methodName)}`
                            }
                        },
                        arguments: [
                            ...ASTUtils._getArgsAST(
                                JSInterface.rearrangeMethodArgs(methodName, args)
                            ),
                            {
                                type: "ArrowFunctionExpression",
                                params: [],
                                body: {
                                    type: "BlockStatement",
                                    body: [
                                        ...ASTUtils._getBlockAST(flows, iteratorNum),
                                        {
                                            type: "ReturnStatement",
                                            argument: {
                                                type: "MemberExpression",
                                                object: {
                                                    type: "Identifier",
                                                    name: "mouse"
                                                },
                                                computed: false,
                                                property: {
                                                    type: "Identifier",
                                                    name: "ENDFLOW"
                                                }
                                            }
                                        }
                                    ]
                                },
                                async: true,
                                expression: false
                            }
                        ]
                    }
                }
            });
        });
    });

    describe("_getBlockAST", () => {
        it("should return an empty array for undefined or null flows", () => {
            expect(ASTUtils._getBlockAST(undefined)).toEqual([]);
            expect(ASTUtils._getBlockAST(null)).toEqual([]);
        });

        it("should return the AST for an if block", () => {
            const flows = [["if", ["testArg"], [["action1", ["arg1"]]]]];
            JSInterface.isMethod.mockReturnValue(true);
            JSInterface.isClampBlock.mockReturnValue(false);

            const result = ASTUtils._getBlockAST(flows);
            expect(result).toEqual([ASTUtils._getIfAST(["testArg"], [["action1", ["arg1"]]], undefined, 0)]);
        });

        it("should return the AST for an if-else block", () => {
            const flows = [["ifthenelse", ["testArg"], ["ifFlow"], ["elseFlow"]]];
            const iteratorNum = 0;
            const result = ASTUtils._getBlockAST(flows, iteratorNum);
            expect(result).toEqual([ASTUtils._getIfAST(["testArg"], ["ifFlow"], ["elseFlow"], iteratorNum)]);
        });

        it("should return the AST for a repeat block", () => {
            const flows = [["repeat", ["testArg"], ["flow"]]];
            const iteratorNum = 0;
            const result = ASTUtils._getBlockAST(flows, iteratorNum);
            expect(result).toEqual([ASTUtils._getForLoopAST(["testArg"], ["flow"], iteratorNum)]);
        });

        it("should return the AST for a while block", () => {
            const flows = [["while", ["testArg"], ["flow"]]];
            const iteratorNum = 0;
            const result = ASTUtils._getBlockAST(flows, iteratorNum);
            expect(result).toEqual([ASTUtils._getWhileLoopAST(["testArg"], ["flow"], iteratorNum)]);
        });

        it("should return the AST for an until block", () => {
            const flows = [["until", ["testArg"], ["flow"]]];
            const iteratorNum = 0;
            const result = ASTUtils._getBlockAST(flows, iteratorNum);
            expect(result).toEqual([ASTUtils._getDoWhileLoopAST(["testArg"], ["flow"], iteratorNum)]);
        });

        it("should return the AST for a break block", () => {
            const flows = [["break"]];
            const result = ASTUtils._getBlockAST(flows);
            expect(result).toEqual([{
                type: "BreakStatement",
                label: null
            }]);
        });

        it("should return the AST for a switch block", () => {
            const flows = [["switch", ["testArg"], ["flow"]]];
            const iteratorNum = 0;
            const result = ASTUtils._getBlockAST(flows, iteratorNum);
            expect(result).toEqual([{
                type: "SwitchStatement",
                discriminant: ASTUtils._getArgsAST(["testArg"])[0],
                cases: ASTUtils._getBlockAST(["flow"], iteratorNum)
            }]);
        });

        it("should return the AST for a case block", () => {
            const flows = [["case", ["testArg"], ["flow"]]];
            const iteratorNum = 0;
            const result = ASTUtils._getBlockAST(flows, iteratorNum);
            expect(result).toEqual([{
                type: "SwitchCase",
                test: ASTUtils._getArgsAST(["testArg"])[0],
                consequent: [
                    ...ASTUtils._getBlockAST(["flow"], iteratorNum),
                    {
                        type: "BreakStatement",
                        label: null
                    }
                ]
            }]);
        });

        it("should return the AST for an increment block", () => {
            const flows = [["increment", ["testIdentifier", "testArg"]]];
            const result = ASTUtils._getBlockAST(flows);
            expect(result).toEqual([ASTUtils._getIncrementStmntAST(["testIdentifier", "testArg"], true)]);
        });

        it("should return the AST for an incrementOne block", () => {
            const flows = [["incrementOne", ["testIdentifier"]]];
            const result = ASTUtils._getBlockAST(flows);
            expect(result).toEqual([ASTUtils._getIncrementStmntAST(["testIdentifier", 1], true)]);
        });

        it("should return the AST for a decrementOne block", () => {
            const flows = [["decrementOne", ["testIdentifier"]]];
            const result = ASTUtils._getBlockAST(flows);
            expect(result).toEqual([ASTUtils._getIncrementStmntAST(["testIdentifier", 1], false)]);
        });

        it("should return the AST for a storein block", () => {
            const flows = [["storein", ["testIdentifier", "testArg"]]];
            const result = ASTUtils._getBlockAST(flows);
            expect(result).toEqual([{
                type: "VariableDeclaration",
                kind: "var",
                declarations: [
                    {
                        type: "VariableDeclarator",
                        id: {
                            type: "Identifier",
                            name: "testIdentifier"
                        },
                        init: ASTUtils._getArgsAST(["testArg"])[0]
                    }
                ]
            }]);
        });

        it("should return the AST for a storein2 block", () => {
            const flows = [["storein2_testIdentifier", ["testArg"]]];
            const result = ASTUtils._getBlockAST(flows);
            expect(result).toEqual([{
                type: "VariableDeclaration",
                kind: "var",
                declarations: [
                    {
                        type: "VariableDeclarator",
                        id: {
                            type: "Identifier",
                            name: "testIdentifier"
                        },
                        init: ASTUtils._getArgsAST(["testArg"])[0]
                    }
                ]
            }]);
        });

        it("should return the AST for a nameddo block", () => {
            const flows = [["nameddo_testMethod", ["testArg"]]];
            const result = ASTUtils._getBlockAST(flows);
            expect(result).toEqual([ASTUtils._getMethodCallAST("testMethod", ["testArg"], { action: true })]);
        });
    });

    describe("getMethodAST", () => {
        it("should return the AST for a method", () => {
            const methodName = "testMethod";
            const tree = ["flow"];
            const result = ASTUtils.getMethodAST(methodName, tree);
            expect(result).toEqual({
                type: "VariableDeclaration",
                kind: "let",
                declarations: [
                    {
                        type: "VariableDeclarator",
                        id: {
                            type: "Identifier",
                            name: `${methodName}`
                        },
                        init: {
                            type: "ArrowFunctionExpression",
                            params: [
                                {
                                    type: "Identifier",
                                    name: "mouse"
                                }
                            ],
                            body: {
                                type: "BlockStatement",
                                body: [
                                    ...ASTUtils._getBlockAST(tree),
                                    {
                                        type: "ReturnStatement",
                                        argument: {
                                            type: "MemberExpression",
                                            object: {
                                                type: "Identifier",
                                                name: "mouse"
                                            },
                                            computed: false,
                                            property: {
                                                type: "Identifier",
                                                name: "ENDFLOW"
                                            }
                                        }
                                    }
                                ]
                            },
                            async: true,
                            expression: false
                        }
                    }
                ]
            });
        });
    });

    describe("getMouseAST", () => {
        it("should return the AST for a mouse", () => {
            const tree = ["flow"];
            const result = ASTUtils.getMouseAST(tree);
            expect(result).toEqual({
                type: "ExpressionStatement",
                expression: {
                    type: "NewExpression",
                    callee: {
                        type: "Identifier",
                        name: "Mouse"
                    },
                    arguments: [
                        {
                            type: "ArrowFunctionExpression",
                            params: [
                                {
                                    type: "Identifier",
                                    name: "mouse"
                                }
                            ],
                            body: {
                                type: "BlockStatement",
                                body: [
                                    ...ASTUtils._getBlockAST(tree),
                                    {
                                        type: "ReturnStatement",
                                        argument: {
                                            type: "MemberExpression",
                                            object: {
                                                type: "Identifier",
                                                name: "mouse"
                                            },
                                            computed: false,
                                            property: {
                                                type: "Identifier",
                                                name: "ENDMOUSE"
                                            }
                                        }
                                    }
                                ]
                            },
                            async: true,
                            expression: false
                        }
                    ]
                }
            });
        });
    });
});
