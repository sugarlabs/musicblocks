/**
 * @file This contains the utilities for generating the Abstract Syntax Tree for JavaScript based
 * Music Blocks code.
 * @author Anindya Kundu
 *
 * @copyright 2020 Anindya Kundu
 *
 * @license
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * The GNU Affero General Public License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public License along with this
 * library; if not, write to the Free Software Foundation, 51 Franklin Street, Suite 500 Boston,
 * MA 02110-1335 USA.
 *
 * The Abstract Syntax Trees are in ESTree specification.
 *
 * Private members' names begin with underscore '_".
 */

/* global JSInterface, last */

/* exported ASTUtils */

/**
 * @class
 * @classdesc contains the barebone ASTs and utilities for generating the Abstract Syntax Tree for
 * JavaScript based Music Blocks code.
 */
class ASTUtils {
    static _isValidIdentifier(name) {
        return typeof name === "string" && /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(name);
    }

    static _getMouseCallExpression(methodName, args) {
        return {
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
            arguments: args
        };
    }

    /**
     * @static
     * Abstract Syntax Tree for the bare minimum program code
     */
    static _bareboneAST = {
        type: "Program",
        sourceType: "script",
        body: [
            {
                type: "ExpressionStatement",
                expression: {
                    type: "CallExpression",
                    callee: {
                        type: "MemberExpression",
                        object: {
                            type: "Identifier",
                            name: "MusicBlocks"
                        },
                        computed: false,
                        property: {
                            type: "Identifier",
                            name: "run"
                        }
                    },
                    arguments: []
                }
            }
        ]
    };

    /**
     * @static
     * Abstract Syntax Tree for the bare minimum mouse code
     */
    static _mouseAST = {
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
    };

    /**
     * @static
     * @returns {Object} barebone Abstract Syntax Tree for JavaScript based Music Blocks programs
     */
    static get BAREBONE_AST() {
        return JSON.parse(JSON.stringify(ASTUtils._bareboneAST));
    }

    /**
     * Returns the Abstract Syntax tree for a setter statement.
     *
     * @static
     * @param {String} identifier - identifier name
     * @param {[*]} - tree of arguments
     * @returns {Object} Abstract Syntax Tree of getter
     */
    static _getSetAST(identifier, args) {
        return {
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
        };
    }

    /**
     * Returns the Abstract Syntax tree for a getter statement.
     *
     * @static
     * @param {String} identifier - identifier name
     * @returns {Object} Abstract Syntax Tree of getter
     */
    static _getGetAST(identifier) {
        return {
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
        };
    }

    /**
     * Returns the Abstract Syntax tree for an if/if-else block.
     *
     * @static
     * @param {[*]} args - tree of arguments (for test argument)
     * @param {[*]} ifFlow - tree of flow statements for if condition
     * @param {[*]} [elseFlow] - tree of flow statements for else condition
     * @param {Number} iteratorNum - iterator index number
     * @returns {Object} Abstract Syntax Tree of if/if-else block
     */
    static _getIfAST(args, ifFlow, elseFlow, iteratorNum) {
        const AST = {
            type: "IfStatement",
            test: ASTUtils._getArgsAST(args)[0],
            consequent: {
                type: "BlockStatement",
                body: ASTUtils._getBlockAST(ifFlow, iteratorNum)
            },
            alternate: null
        };

        if (elseFlow !== undefined) {
            AST["alternate"] = {
                type: "BlockStatement",
                body: ASTUtils._getBlockAST(elseFlow, iteratorNum)
            };
        }

        return AST;
    }

    /**
     * Returns the Abstract Syntax tree for a for-loop block.
     *
     * @static
     * @param {[*]} args - tree of arguments (for repeat limit)
     * @param {[*]} flow - tree of flow statements
     * @param {Number} iteratorNum - iterator index number
     * @returns {Object} Abstract Syntax Tree of for-loop
     */
    static _getForLoopAST(args, flow, iteratorNum) {
        if (iteratorNum === undefined) iteratorNum = 0;

        return {
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
        };
    }

    /**
     * Returns the Abstract Syntax tree for a while-loop block.
     *
     * @static
     * @param {[*]} args - tree of arguments (for test condition)
     * @param {[*]} flow - tree of flow statements
     * @param {Number} iteratorNum - iterator index number
     * @returns {Object} Abstract Syntax Tree of while-loop
     */
    static _getWhileLoopAST(args, flow, iteratorNum) {
        return {
            type: "WhileStatement",
            test: ASTUtils._getArgsAST(args)[0],
            body: {
                type: "BlockStatement",
                body: ASTUtils._getBlockAST(flow, iteratorNum)
            }
        };
    }

    /**
     * Returns the Abstract Syntax tree for a do-while-loop block.
     *
     * @static
     * @param {[*]} args - tree of arguments (for test condition)
     * @param {[*]} flow - tree of flow statements
     * @param {Number} iteratorNum - iterator index number
     * @returns {Object} Abstract Syntax Tree of do-while-loop
     */
    static _getDoWhileLoopAST(args, flow, iteratorNum) {
        return {
            type: "DoWhileStatement",
            body: {
                type: "BlockStatement",
                body: ASTUtils._getBlockAST(flow, iteratorNum)
            },
            test: ASTUtils._getArgsAST(args)[0]
        };
    }

    /**
     * Returns the Abstract Syntax Tree for an increment assignment statement.
     *
     * @static
     * @param {[*]} args - list of identifier and tree of arguments
     * @param {Boolean} isIncrement - whether increment statement
     * @returns {Object} Abstract Syntax Tree of increment assignment statement
     */
    static _getIncrementStmntAST(args, isIncrement) {
        const identifier =
            typeof args[0] === "string" && args[0].startsWith("box_") ? args[0].slice(4) : args[0];
        const arg = ASTUtils._getArgsAST([args[1]])[0];

        if (!ASTUtils._isValidIdentifier(identifier)) {
            const deltaAst = isIncrement
                ? arg
                : {
                      type: "UnaryExpression",
                      operator: "-",
                      argument: arg,
                      prefix: true
                  };
            return {
                type: "ExpressionStatement",
                expression: {
                    type: "AwaitExpression",
                    argument: ASTUtils._getMouseCallExpression("incrementBox", [
                        {
                            type: "Literal",
                            value: identifier
                        },
                        deltaAst
                    ])
                }
            };
        }

        return {
            type: "ExpressionStatement",
            expression: {
                type: "AssignmentExpression",
                left: {
                    type: "Identifier",
                    name: identifier
                },
                operator: "=",
                right: {
                    type: "BinaryExpression",
                    left: {
                        type: "Identifier",
                        name: identifier
                    },
                    right: arg,
                    operator: isIncrement ? "+" : "-"
                }
            }
        };
    }

    /**
     * Returns the Abstract Syntax Tree for the bare minimum method definition code
     *
     * @static
     * @param {String} methodName - method name
     * @returns {Object} Abstract Syntax Tree for method definition
     */
    static _getMethodDefAST(methodName) {
        return {
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
                            },
                            {
                                type: "AssignmentPattern",
                                left: {
                                    type: "Identifier",
                                    name: "actionArgs"
                                },
                                right: {
                                    type: "ArrayExpression",
                                    elements: [
                                        {
                                            type: "Literal",
                                            value: null
                                        }
                                    ]
                                }
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
        };
    }

    /**
     * Returns the Abstract Syntax Tree for a method call without function argument.
     *
     * @static
     * @param {String} methodName - method name
     * @param {[*]} args - tree of arguments
     * @param {Object} props - properties: { action: whether method call is an action call, statement: whether method call is expression statement }
     * @returns {Object} - Abstract Syntax Tree of method call
     */
    static _getMethodCallAST(methodName, args, props) {
        let AST = {
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
                    arguments: ASTUtils._getArgsAST(
                        JSInterface.rearrangeMethodArgs(methodName, args)
                    )
                }
            }
        };

        if (props) {
            if (props.action) {
                AST["expression"]["argument"]["callee"] = {
                    type: "Identifier",
                    name: `${methodName}`
                };
                AST["expression"]["argument"]["arguments"] = [
                    {
                        type: "Identifier",
                        name: "mouse"
                    }
                ];
                if (args !== undefined && args !== null) {
                    AST["expression"]["argument"]["arguments"].push({
                        type: "ArrayExpression",
                        elements: [
                            {
                                type: "Literal",
                                value: null
                            },
                            ...ASTUtils._getArgsAST(args)
                        ]
                    });
                }
            }
            if (props.statement === false) {
                AST = AST["expression"];
            }
        }

        return AST;
    }

    /**
     * Returns the Abstract Syntax Tree for a method call in arguments.
     *
     * @static
     * @param {String} methodName - method name
     * @param {[*]} args - tree of arguments
     * @returns {Object} - Abstract Syntax Tree of method call
     */
    static _getArgExpAST(methodName, args) {
        if (methodName === "arg") {
            const indexAst = ASTUtils._getArgsAST(args)[0] || {
                type: "Literal",
                value: 1
            };
            return {
                type: "MemberExpression",
                object: {
                    type: "Identifier",
                    name: "actionArgs"
                },
                property: indexAst,
                computed: true
            };
        }

        if (methodName === "box") {
            const nameAst = ASTUtils._getArgsAST(args)[0];
            if (nameAst && nameAst.type === "Identifier") {
                return nameAst;
            }
            if (nameAst && nameAst.type === "Literal" && typeof nameAst.value === "string") {
                if (ASTUtils._isValidIdentifier(nameAst.value)) {
                    return {
                        type: "Identifier",
                        name: nameAst.value
                    };
                }
            }
            if (!nameAst) {
                return {
                    type: "Identifier",
                    name: "undefined"
                };
            }
            return ASTUtils._getMouseCallExpression("getBox", [nameAst]);
        }

        const mathOps = {
            plus: ["binexp", "+"],
            minus: ["binexp", "-"],
            multiply: ["binexp", "*"],
            divide: ["binexp", "/"],
            mod: ["binexp", "%"],
            equal: ["binexp", "=="],
            less: ["binexp", "<"],
            greater: ["binexp", ">"],
            or: ["binexp", "||"],
            and: ["binexp", "&&"],
            xor: ["binexp", "^"],
            not: ["unexp", "!"],
            neg: ["unexp", "-"],
            abs: ["method", "Math.abs"],
            sqrt: ["method", "Math.sqrt"],
            power: ["method", "Math.pow"],
            int: ["method", "Math.floor"]
        };

        function getBinaryExpAST(operator, operand1, operand2) {
            return {
                type:
                    operator === "&&" || operator === "||"
                        ? "LogicalExpression"
                        : "BinaryExpression",
                left: ASTUtils._getArgsAST([operand1])[0],
                right: ASTUtils._getArgsAST([operand2])[0],
                operator: `${operator}`
            };
        }

        function getUnaryExpAST(operator, operand) {
            return {
                type: "UnaryExpression",
                operator: `${operator}`,
                argument: ASTUtils._getArgsAST([operand])[0],
                prefix: true
            };
        }

        function getCallExpAST(methodName, args) {
            return {
                type: "CallExpression",
                callee: {
                    type: "Identifier",
                    name: `${methodName}`
                },
                arguments: ASTUtils._getArgsAST(args)
            };
        }

        if (methodName in mathOps) {
            if (mathOps[methodName][0] === "binexp") {
                return getBinaryExpAST(mathOps[methodName][1], ...args);
            } else if (mathOps[methodName][0] === "unexp") {
                return getUnaryExpAST(mathOps[methodName][1], args[0]);
            } else {
                return getCallExpAST(mathOps[methodName][1], args);
            }
        } else {
            return getCallExpAST(JSInterface.getMethodName(methodName), args);
        }
    }

    /**
     * Returns list of Abstract Syntax Trees corresponding to each argument of args.
     *
     * @static
     * @param {[*]} args - tree of arguments
     * @returns {[Object]} list of Abstract Syntax Trees
     */
    static _getArgsAST(args) {
        if (args === undefined || args === null) return [];

        const ASTs = [];
        for (const arg of args) {
            if (arg === null) {
                ASTs.push({
                    type: "Literal",
                    value: null
                });
            } else if (typeof arg === "object") {
                if (JSInterface.isGetter(arg[0])) {
                    ASTs.push(ASTUtils._getGetAST(JSInterface.getGetterName(arg[0])));
                } else {
                    ASTs.push(
                        JSInterface.methodReturns(arg[0])
                            ? ASTUtils._getMethodCallAST(arg[0], arg[1], { statement: false })
                            : ASTUtils._getArgExpAST(arg[0], arg[1])
                    );
                }
            } else {
                if (typeof arg === "string" && arg.includes("_")) {
                    const sepIndex = arg.indexOf("_");
                    const type = arg.slice(0, sepIndex);
                    const argVal = arg.slice(sepIndex + 1);
                    if (type === "bool") {
                        ASTs.push({
                            type: "Literal",
                            value: argVal === "true"
                        });
                    } else if (type === "box") {
                        if (ASTUtils._isValidIdentifier(argVal)) {
                            ASTs.push({
                                type: "Identifier",
                                name: argVal
                            });
                        } else {
                            ASTs.push(
                                ASTUtils._getMouseCallExpression("getBox", [
                                    {
                                        type: "Literal",
                                        value: argVal
                                    }
                                ])
                            );
                        }
                    } else {
                        ASTs.push({
                            type: "Literal",
                            value: arg
                        });
                    }
                } else {
                    ASTs.push({
                        type: "Literal",
                        value: arg
                    });
                }
            }
        }

        return ASTs;
    }

    /**
     * Returns the Abstract Syntax Tree for a method call with function argument.
     *
     * @static
     * @param {String} methodName - method name
     * @param {[*]} args - tree of arguments
     * @param {[*]} flows - tree of flow statements
     * @param {Number} iteratorNum - iterator index number
     * @returns {Object} - Abstract Syntax Tree of method call
     */
    static _getMethodCallClampAST(methodName, args, flows, iteratorNum) {
        const AST = ASTUtils._getMethodCallAST(methodName, args);

        AST["expression"]["argument"]["arguments"].push({
            type: "ArrowFunctionExpression",
            params: [],
            body: {
                type: "BlockStatement",
                body: ASTUtils._getBlockAST(flows, iteratorNum)
            },
            async: true,
            expression: false
        });

        last(AST["expression"]["argument"]["arguments"])["body"]["body"].push({
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
        });

        return AST;
    }

    /**
     * Returns list of Abstract Syntax Trees corresponding to each flow statement.
     *
     * @static
     * @param {[*]} flows - tree of flow statements
     * @param {Number} iterMax - highest iterator number in block
     * @returns {[Object]} list of Abstract Syntax Trees
     * @throws {String} INVALID BLOCK Error
     */
    static _getBlockAST(flows, iterMax) {
        if (flows === undefined || flows === null) return [];

        const ASTs = [];
        for (const flow of flows) {
            if (flow[0] === "if") {
                ASTs.push(ASTUtils._getIfAST(flow[1], flow[2], iterMax));
            } else if (flow[0] === "ifthenelse") {
                ASTs.push(ASTUtils._getIfAST(flow[1], flow[2], flow[3], iterMax));
            } else if (flow[0] === "repeat") {
                ASTs.push(ASTUtils._getForLoopAST(flow[1], flow[2], iterMax));
            } else if (flow[0] === "while") {
                ASTs.push(ASTUtils._getWhileLoopAST(flow[1], flow[2], iterMax));
            } else if (flow[0] === "forever") {
                ASTs.push(ASTUtils._getWhileLoopAST([1000], flow[2], iterMax));
            } else if (flow[0] === "until") {
                ASTs.push(ASTUtils._getDoWhileLoopAST(flow[1], flow[2], iterMax));
            } else if (flow[0] === "break") {
                ASTs.push({
                    type: "BreakStatement",
                    label: null
                });
            } else if (flow[0] === "switch") {
                ASTs.push({
                    type: "SwitchStatement",
                    discriminant: ASTUtils._getArgsAST(flow[1])[0],
                    cases: ASTUtils._getBlockAST(flow[2], iterMax)
                });
            } else if (flow[0] === "case") {
                const AST = {
                    type: "SwitchCase",
                    test: ASTUtils._getArgsAST(flow[1])[0],
                    consequent: [
                        {
                            type: "BreakStatement",
                            label: null
                        }
                    ]
                };

                const flowASTs = ASTUtils._getBlockAST(flow[2], iterMax);
                for (const i in flowASTs) {
                    AST["consequent"].splice(i, 0, flowASTs[i]);
                }

                ASTs.push(AST);
            } else if (flow[0] === "defaultcase") {
                ASTs.push({
                    type: "SwitchCase",
                    test: null,
                    consequent: ASTUtils._getBlockAST(flow[2], iterMax)
                });
            } else if (flow[0] === "increment") {
                ASTs.push(ASTUtils._getIncrementStmntAST(flow[1], true));
            } else if (flow[0] === "incrementOne") {
                ASTs.push(ASTUtils._getIncrementStmntAST([flow[1][0], 1], true));
            } else if (flow[0] === "decrementOne") {
                ASTs.push(ASTUtils._getIncrementStmntAST([flow[1][0], 1], false));
            } else if (flow[0] === "storein") {
                const nameAst = ASTUtils._getArgsAST([flow[1][0]])[0];
                const valueAst = ASTUtils._getArgsAST([flow[1][1]])[0];
                if (
                    nameAst &&
                    nameAst.type === "Literal" &&
                    ASTUtils._isValidIdentifier(nameAst.value)
                ) {
                    ASTs.push({
                        type: "VariableDeclaration",
                        kind: "var",
                        declarations: [
                            {
                                type: "VariableDeclarator",
                                id: {
                                    type: "Identifier",
                                    name: nameAst.value
                                },
                                init: valueAst
                            }
                        ]
                    });
                } else {
                    ASTs.push({
                        type: "ExpressionStatement",
                        expression: {
                            type: "AwaitExpression",
                            argument: ASTUtils._getMouseCallExpression("setBox", [
                                nameAst,
                                valueAst
                            ])
                        }
                    });
                }
            } else if (flow[0].split("_").length > 1) {
                const splitIndex = flow[0].indexOf("_");
                const instruction = flow[0].slice(0, splitIndex);
                const idName = flow[0].slice(splitIndex + 1);
                if (instruction === "storein2") {
                    if (ASTUtils._isValidIdentifier(idName)) {
                        ASTs.push({
                            type: "VariableDeclaration",
                            kind: "var",
                            declarations: [
                                {
                                    type: "VariableDeclarator",
                                    id: {
                                        type: "Identifier",
                                        name: idName
                                    },
                                    init: ASTUtils._getArgsAST(flow[1])[0]
                                }
                            ]
                        });
                    } else {
                        ASTs.push({
                            type: "ExpressionStatement",
                            expression: {
                                type: "AwaitExpression",
                                argument: ASTUtils._getMouseCallExpression("setBox", [
                                    {
                                        type: "Literal",
                                        value: idName
                                    },
                                    ASTUtils._getArgsAST(flow[1])[0]
                                ])
                            }
                        });
                    }
                } else if (instruction === "nameddo") {
                    ASTs.push(ASTUtils._getMethodCallAST(idName, flow[1], { action: true }));
                } else if (instruction === "nameddoArg") {
                    ASTs.push(ASTUtils._getMethodCallAST(idName, flow[1], { action: true }));
                }
            } else {
                if (JSInterface.isSetter(flow[0])) {
                    ASTs.push(ASTUtils._getSetAST(JSInterface.getSetterName(flow[0]), flow[1]));
                } else if (JSInterface.isMethod(flow[0])) {
                    if (JSInterface.isClampBlock(flow[0])) {
                        // has inner flow
                        ASTs.push(ASTUtils._getMethodCallClampAST(...flow, iterMax));
                    } else {
                        // no inner flow
                        ASTs.push(ASTUtils._getMethodCallAST(...flow));
                    }
                } else {
                    throw `CANNOT PROCESS "${flow[0]}" BLOCK`;
                }
            }
        }

        return ASTs;
    }

    /**
     * Returns the complete Abstract Syntax Tree specific to the mouse corresponding to the tree.
     *
     * @static
     * @param {String} methodName - method name
     * @param {[*]} tree - stacks tree for the mouse
     * @returns {Object} mouse Abstract Syntax Tree for the tree
     */
    static getMethodAST(methodName, tree) {
        const AST = ASTUtils._getMethodDefAST(methodName);

        const ASTs = ASTUtils._getBlockAST(tree);
        for (const i in ASTs) {
            AST["declarations"][0]["init"]["body"]["body"].splice(i, 0, ASTs[i]);
        }

        return AST;
    }

    /**
     * Returns the complete Abstract Syntax Tree specific to the mouse corresponding to the tree.
     *
     * @static
     * @param {[*]} tree - stacks tree for the mouse
     * @returns {Object} mouse Abstract Syntax Tree for the tree
     */
    static getMouseAST(tree) {
        const AST = JSON.parse(JSON.stringify(ASTUtils._mouseAST));

        const ASTs = ASTUtils._getBlockAST(tree);
        for (const i in ASTs) {
            AST["expression"]["arguments"][0]["body"]["body"].splice(i, 0, ASTs[i]);
        }

        return AST;
    }
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = ASTUtils;
}
