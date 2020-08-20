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
*/

/** Abstract Syntax Tree for the bare minimum program code */
const bareboneAST = {
    "type": "Program",
    "sourceType": "script",
    "body": [
        {
            "type": "ExpressionStatement",
            "expression": {
              "type": "CallExpression",
              "callee": {
                "type": "MemberExpression",
                "object": {
                  "type": "Identifier",
                  "name": "MusicBlocks"
                },
                "computed": false,
                "property": {
                  "type": "Identifier",
                  "name": "run"
                }
              },
              "arguments": []
            }
          }
    ]
};

/** Abstract Syntax Tree for the bare minimum mouse code */
const mouseAST = {
    "type": "ExpressionStatement",
    "expression": {
        "type": "NewExpression",
        "callee": {
            "type": "Identifier",
            "name": "Mouse"
        },
        "arguments": [
            {
                "type": "ArrowFunctionExpression",
                "params": [
                    {
                        "type": "Identifier",
                        "name": "mouse"
                    }
                ],
                "body": {
                    "type": "BlockStatement",
                    "body": [
                        {
                            "type": "ReturnStatement",
                            "argument": {
                                "type": "MemberExpression",
                                "object": {
                                    "type": "Identifier",
                                    "name": "mouse"
                                },
                                "computed": false,
                                "property": {
                                    "type": "Identifier",
                                    "name": "ENDMOUSE"
                                }
                            }
                        }
                    ]
                },
                "async": true,
                "expression": false
            }
        ]
    }
};

/**
 * Returns the Abstract Syntax Tree for a method call without function argument.
 *
 * @param {String} methodName - method name
 * @param {[*]} args - tree of arguments
 * @returns {Object} - Abstract Syntax Tree of method call
 */
function getMethodCallAST(methodName, args) {
    return {
        "type": "ExpressionStatement",
        "expression": {
            "type": "AwaitExpression",
            "argument": {
                "type": "CallExpression",
                "callee": {
                    "type": "MemberExpression",
                    "object": {
                        "type": "Identifier",
                        "name": "mouse"
                    },
                    "computed": false,
                    "property": {
                        "type": "Identifier",
                        "name": `${methodName}`
                    }
                },
                "arguments": getArgsAST(args)
            }
        }
    };
}

/**
 * Returns the Abstract Syntax Tree for a method call in arguments.
 *
 * @param {String} methodName - method name
 * @param {[*]} args - tree of arguments
 * @returns {Object} - Abstract Syntax Tree of method call
 */
function getArgExpAST(methodName, args) {
    const mathOps = {
        "plus": ["binexp", "+"],
        "minus": ["binexp", "-"],
        "multiply": ["binexp", "*"],
        "divide": ["binexp", "/"],
        "mod": ["binexp", "%"],
        "neg": ["unexp", "-"],
        "abs": ["method", "Math.abs"],
        "sqrt": ["method", "Math.sqrt"],
        "power": ["method", "Math.pow"],
        "int": ["method", "Math.floor"]
    };

    function getBinaryExpAST(operator, operand1, operand2) {
        return {
            "type": "BinaryExpression",
            "left": getArgsAST([operand1])[0],
            "right": getArgsAST([operand2])[0],
            "operator": `${operator}`
        };
    }

    function getUnaryExpAST(operator, operand) {
        return {
            "type": "UnaryExpression",
            "operator": `${operator}`,
            "argument": getArgsAST([operand])[0],
            "prefix": true
        };
    }

    function getCallExpAST(methodName, args) {
        return {
            "type": "CallExpression",
            "callee": {
                "type": "Identifier",
                "name": `${methodName}`
            },
            "arguments": getArgsAST(args)
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
        return getCallExpAST(methodName, args);
    }
}

/**
 * Returns the Abstract Syntax Tree for a method call with function argument.
 *
 * @param {String} methodName - method name
 * @param {[*]} args - tree of arguments
 * @param {[*]} flows - tree of flow statements
 * @returns {Object} - Abstract Syntax Tree of method call
 */
function getMethodCallClampAST(methodName, args, flows) {
    let AST = getMethodCallAST(methodName, args);

    AST["expression"]["argument"]["arguments"].push({
        "type": "ArrowFunctionExpression",
        "params": [],
        "body": {
            "type": "BlockStatement",
            "body": getBlockAST(flows)
        },
        "async": true,
        "expression": false
    });

    last(AST["expression"]["argument"]["arguments"])["body"]["body"].push({
        "type": "ReturnStatement",
        "argument": {
            "type": "MemberExpression",
            "object": {
                "type": "Identifier",
                "name": "mouse"
            },
            "computed": false,
            "property": {
                "type": "Identifier",
                "name": "ENDFLOW"
            }
        }
    });

    return AST;
}

/**
 * Returns list of Abstract Syntax Trees corresponding to each argument of args.
 *
 * @param {[*]} args - tree of arguments
 * @returns {[Object]} list of Abstract Syntax Trees
 */
function getArgsAST(args) {
    if (args === undefined || args === null)
        return [];

    let ASTs = [];
    for (let arg of args) {
        if (typeof arg === "object") {
            ASTs.push(getArgExpAST(arg[0], arg[1]));
        } else {
            ASTs.push({
                "type": "Literal",
                "value": arg
            });
        }
    }

    return ASTs;
}

/**
 * Returns list of Abstract Syntax Trees corresponding to each flow statement.
 *
 * @param {[*]} flows - tree of flow statements
 * @returns {[Object]} list of Abstract Syntax Trees
 */
function getBlockAST(flows) {
    if (flows === undefined || flows === null)
        return [];

    let ASTs = [];
    for (let flow of flows) {
        if (flow[2] === null) {                         // no inner flow
            ASTs.push(getMethodCallAST(...flow));
        } else {                                        // has inner flow
            ASTs.push(getMethodCallClampAST(...flow));
        }
    }

    return ASTs;
}

/**
 * Returns the complete Abstract Syntax Tree specific to the mouse corresponding to the tree.
 *
 * @param {[*]} tree - stacks tree for the mouse
 * @returns {Object} mouse Abstract Syntax Tree for the tree
 */
function getMouseAST(tree) {
    let AST = JSON.parse(JSON.stringify(mouseAST));

    let ASTs = getBlockAST(tree);
    for (let i in ASTs) {
        AST["expression"]["arguments"][0]["body"]["body"].splice(i, 0, ASTs[i]);
    }

    return AST;
}
