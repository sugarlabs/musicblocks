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
 * Returns the complete Abstract Syntax Tree specific to the mouse corresponding to the tree.
 *
 * @param {[*]} tree - stacks tree for the mouse
 * @returns {Object} mouse Abstract Syntax Tree for the tree
 */
function getMouseAST(tree) {
    let _mouseAST = JSON.parse(JSON.stringify(mouseAST));
    return _mouseAST;
}
