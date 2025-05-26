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

/**
 * This class provides two static methods to convert an AST generated from JavaScript code
 * to a blockList (https://github.com/sugarlabs/musicblocks/blob/master/js/README.md#about-the-internal-block-format)
 * which can be loaded into the musicblocks UI by calling `blocks.loadNewBlocks(blockList)`.
 * 
 * Usage:
 *   let trees = AST2BlockList.toTrees(AST);
 *   let blockList = AST2BlockList.toBlockList(trees);
 */
class AST2BlockList {
    /**
     * Given a musicblocks AST ("type": "Program"), return an array of trees.
     * Each AST contains one to multiple top level blocks, each to be converted to a tree.
     * For example:
     *   {
     *     name: "start",
     *     children: [ {
     *       name: "settimbre",
     *       args: ["guitar"],
     *       children: [
     *         child1,
     *         child2 ]
     *       }
     *     ]
     *   }
     * Each tree node contains up to three properties: name, args, and children. Each child
     * is another tree node. For example, child1 could be something like:
     *   {
     *     name: "newnote"
     *     args: [1]
     *     children: [ {
     *       name: "pitch"
     *       args: ["sol", 3]
     *     } ]
     *   }
     * The entire block is to play a whole note Sol on guitar in the third octave.
     * 
     * @param {Object} AST - AST generated from JavaScript code
     * @returns {Array} trees, see example above
     */
    static toTrees(AST) {
        // An array of predicate and visitor pairs - use the visitor to get information from
        // a body AST node if the predicate evaluates to true. Each visitor defines three getters:
        //   getName finds the name in the AST node of the statement and returns it
        //   getArguments returns an array of AST nodes that contain the arguments of the statement
        //   getChildren returns an array of AST nodes that contain the children of the statement
        // The AST structures for different statement types are different. Therefore, a new entry
        // needs to be added to the array in order to support a new statement type.
        const _bodyVisitors = [
            // Action Palette, Start block
            {
                pred: (bodyAST) => {
                    return bodyAST.type == "ExpressionStatement" &&
                        bodyAST.expression.type == "NewExpression";
                },
                visitor: {
                    getName: () => { return "start"; },
                    getArguments: () => { return []; },
                    getChildren: (bodyAST) => {
                        for (const arg of bodyAST.expression.arguments) {
                            if (arg.type == "ArrowFunctionExpression") {
                                return arg.body.body;
                            }
                        }
                        return [];
                    },
                }
            },

            // Action Palette, Action block (Action Declaration)
            {
                pred: (bodyAST) => {
                    return bodyAST.type == "VariableDeclaration" &&
                        bodyAST.declarations[0].init.type == "ArrowFunctionExpression";
                },
                visitor: {
                    getName: () => { return "action"; },
                    getArguments: (bodyAST) => { return [bodyAST.declarations[0].id]; },
                    getChildren: (bodyAST) => { return bodyAST.declarations[0].init.body.body; },
                }
            },

            // Action Palette, Async call: await action(...)
            {
                pred: (bodyAST) => {
                    return bodyAST.type == "ExpressionStatement" &&
                        bodyAST.expression.type == "AwaitExpression" &&
                        bodyAST.expression.argument.type == "CallExpression" &&
                        bodyAST.expression.argument.callee.type == "Identifier";
                },
                visitor: {
                    getName: (bodyAST) => { return { nameddo: bodyAST.expression.argument.callee.name }; },
                    getArguments: () => { return []; },
                    getChildren: () => { return []; },
                }
            },

            // Async call: await mouse.playNote(...)
            {
                pred: (bodyAST) => {
                    return bodyAST.type == "ExpressionStatement" &&
                        bodyAST.expression.type == "AwaitExpression" &&
                        bodyAST.expression.argument.type == "CallExpression" &&
                        bodyAST.expression.argument.callee.type == "MemberExpression";
                },
                visitor: {
                    getName: (bodyAST) => {
                        let obj = bodyAST.expression.argument.callee.object.name;
                        let member = bodyAST.expression.argument.callee.property.name;
                        let numArgs = bodyAST.expression.argument.arguments.length;
                        if (obj in _memberLookup && member in _memberLookup[obj]) {
                            let name = _memberLookup[obj][member];
                            if (typeof name === "object") {
                                if (!(numArgs in name)) {
                                    throw {
                                        //TODO
                                    };
                                }
                                name = name[numArgs];
                            }
                            return name;
                        }
                        throw {
                            message: `Unsupported AsyncCallExpression: ${obj}.${member}`,
                            start: bodyAST.expression.argument.callee.start,
                            end: bodyAST.expression.argument.callee.end
                        };
                    },
                    getArguments: (bodyAST) => { return bodyAST.expression.argument.arguments; },
                    getChildren: (bodyAST) => {
                        for (const arg of bodyAST.expression.argument.arguments) {
                            if (arg.type == "ArrowFunctionExpression") {
                                return arg.body.body;
                            }
                        }
                        return [];
                    },
                }
            },

            // Flow Palette, Repeat block
            {
                pred: (bodyAST) => {
                    return bodyAST.type == "ForStatement";
                },
                visitor: {
                    getName: () => { return "repeat"; },
                    getArguments: (bodyAST) => { return [bodyAST.test.right]; },
                    getChildren: (bodyAST) => { return bodyAST.body.body; },
                }
            },

            // Flow Palette, While and Forever block
            {
                pred: (bodyAST) => {
                    return bodyAST.type == "WhileStatement";
                },
                visitor: {
                    getName: (bodyAST) => { return bodyAST.test.value ? "forever" : "while"; },
                    getArguments: (bodyAST) => { return bodyAST.test.value ? [] : [bodyAST.test]; },
                    getChildren: (bodyAST) => { return bodyAST.body.body; },
                }
            },

            // Flow Palette, DoWhile (until) block
            {
                pred: (bodyAST) => {
                    return bodyAST.type == "DoWhileStatement";
                },
                visitor: {
                    getName: () => { return "until"; },
                    getArguments: (bodyAST) => { return [bodyAST.test]; },
                    getChildren: (bodyAST) => { return bodyAST.body.body; },
                }
            },

            // Flow Palette, If/Ifelse block
            {
                pred: (bodyAST) => {
                    return bodyAST.type == "IfStatement";
                },
                visitor: {
                    getName: (bodyAST) => { return bodyAST.alternate ? "ifthenelse" : "if"; },
                    getArguments: (bodyAST) => { return [bodyAST.test]; },
                    getChildren: (bodyAST) => {
                        if (bodyAST.alternate) {
                            return bodyAST.consequent.body.concat([{ "type": null, }], bodyAST.alternate.body);
                        } else {
                            return bodyAST.consequent.body;
                        }
                    },
                }
            },

            // Special case for else section of ifelse block
            {
                pred: (bodyAST) => {
                    return bodyAST.type == null;
                },
                visitor: {
                    getName: () => { return "else"; },
                    getArguments: () => { return []; },
                    getChildren: () => { return []; },
                }
            },

            // Flow Palette, Switch block
            {
                pred: (bodyAST) => {
                    return bodyAST.type == "SwitchStatement";
                },
                visitor: {
                    getName: () => { return "switch"; },
                    getArguments: (bodyAST) => { return [bodyAST.discriminant]; },
                    getChildren: (bodyAST) => { return bodyAST.cases; },
                }
            },

            // Flow Palette, Case/Default block
            {
                pred: (bodyAST) => {
                    return bodyAST.type == "SwitchCase";
                },
                visitor: {
                    getName: (bodyAST) => { return bodyAST.test != null ? "case" : "defaultcase"; },
                    getArguments: (bodyAST) => { return bodyAST.test != null ? [bodyAST.test] : []; },
                    getChildren: (bodyAST) => { return bodyAST.consequent; },
                }
            },

            // Flow Palette, break statement
            {
                pred: (bodyAST) => {
                    return bodyAST.type == "BreakStatement";
                },
                visitor: {
                    getName: (bodyAST) => { return "break"; },
                    getArguments: (bodyAST) => { return []; },
                    getChildren: (bodyAST) => { return []; },
                }
            },

            // Boxes Palette, Store in box block (Variable Declaration)
            {
                pred: (bodyAST) => {
                    return bodyAST.type == "VariableDeclaration" &&
                        (bodyAST.declarations[0].init.type == "Literal" ||              // var v = 6;
                            bodyAST.declarations[0].init.type == "BinaryExpression" ||  // var v = 2 * 3;
                            bodyAST.declarations[0].init.type == "CallExpression" ||    // var v = Math.abs(-6);
                            bodyAST.declarations[0].init.type == "UnaryExpression");    // var v = -6;
                },
                visitor: {
                    getName: (bodyAST) => { return { storein2: bodyAST.declarations[0].id.name }; },
                    getArguments: (bodyAST) => { return [bodyAST.declarations[0].init]; },
                    getChildren: () => { return []; },
                }
            },

            // Boxes Palette, Add / Subtract block (Assignment)
            {
                pred: (bodyAST) => {
                    return bodyAST.type == "ExpressionStatement" &&
                        bodyAST.expression.type == "AssignmentExpression";
                },
                visitor: {
                    getName: (bodyAST) => {
                        if (bodyAST.expression.right.type == "BinaryExpression" &&
                            bodyAST.expression.left.name == bodyAST.expression.right.left.name) {
                            // box1 = box1 - 1;
                            if (bodyAST.expression.right.operator == "-" &&
                                bodyAST.expression.right.right.value == 1) {
                                return "decrementOne";
                            }
                            // box1 = box1 + 3; or
                            // box1 = box1 + -3;
                            if (bodyAST.expression.right.operator == "+") {
                                return "increment";
                            }
                        }
                        throw {
                            prefix: "Unsupported AssignmentExpression: ",
                            start: bodyAST.expression.start,
                            end: bodyAST.expression.end
                        };
                    },
                    getArguments: (bodyAST) => {
                        if (bodyAST.expression.right.type == "BinaryExpression" &&
                            bodyAST.expression.left.name == bodyAST.expression.right.left.name) {
                            if (bodyAST.expression.right.operator == "-" &&
                                bodyAST.expression.right.right.value == 1) {
                                return [bodyAST.expression.left];
                            }
                            if (bodyAST.expression.right.operator == "+") {
                                return [bodyAST.expression.left, bodyAST.expression.right.right];
                            }
                        }
                        throw {
                            prefix: "Unsupported AssignmentExpression: ",
                            start: bodyAST.expression.start,
                            end: bodyAST.expression.end
                        };
                    },
                    getChildren: () => { return []; },
                }
            },

            // Ignore MusicBlocks.run()
            {
                pred: (bodyAST) => {
                    return bodyAST.type == "ExpressionStatement" &&
                        bodyAST.expression.type == "CallExpression" &&
                        bodyAST.expression.callee.type == "MemberExpression" &&
                        bodyAST.expression.callee.object.name == "MusicBlocks" &&
                        bodyAST.expression.callee.property.name == "run";
                },
                visitor: null
            },
        ];

        // A map from argument AST node types to builders that build tree nodes for
        // argument AST nodes with the corresponding types.
        // The AST structures for different argument types are different. Therefore, a new entry
        // needs to be added to the map in order to support a new argument type.
        const _argNodeBuilders = {
            "Identifier": (argAST) => {
                return { identifier: argAST.name };
            },

            "Literal": (argAST) => {
                return argAST.value;
            },

            "BinaryExpression": (argAST) => {
                if (!(argAST.operator in _binaryOperatorLookup)) {
                    throw {
                        message: `Unsupported binary operator: ${argAST.operator}`,
                        start: argAST.start,
                        end: argAST.end
                    };
                }
                return {
                    "name": _binaryOperatorLookup[argAST.operator],
                    "args": _createArgNode([argAST.left, argAST.right])
                };
            },

            "CallExpression": (argAST) => {
                let obj = argAST.callee.object.name;
                let member = argAST.callee.property.name;
                let numArgs = argAST.arguments.length;
                if (!(obj in _memberLookup && member in _memberLookup[obj])) {
                    throw {
                        message: `Unsupported function call: ${obj}.${member}`,
                        start: argAST.callee.start,
                        end: argAST.callee.end
                    };
                }
                let name = _memberLookup[obj][member];
                if (typeof name === "object") {
                    name = name[numArgs];
                }
                let args = argAST.arguments;
                if (name == "getDict") {
                    // For getValue(Key, Dictionary Name),
                    // make sure the order is [Dictionary Name, Key]
                    args = [argAST.arguments[1], argAST.arguments[0]];
                }
                return {
                    "name": name,
                    "args": _createArgNode(args)
                };
            },

            "UnaryExpression": (argAST) => {
                if (!(argAST.operator in _unaryOperatorLookup)) {
                    throw {
                        message: `Unsupported unary operator: ${argAST.operator}`,
                        start: argAST.start,
                        end: argAST.end
                    };
                }
                return {
                    "name": _unaryOperatorLookup[argAST.operator],
                    "args": _createArgNode([argAST.argument])
                };
            },

            "AwaitExpression": (argAST) => {
                return _createArgNode([argAST.argument])[0];
            },

            "ArrowFunctionExpression": () => {
                // Ignore the type, it's for children
                return null;
            },
        };

        // A map from member functions in AST to block names.
        // Member functions are function names used in JavaScript, while block names are
        // recognizable by musicblocks.
        const _memberLookup = {
            "mouse": {
                "setInstrument": "settimbre",
                "playNote": "newnote",
                "playPitch": "pitch",
                "playRest": "rest2",
                "dot": "rhythmicdot2",
                "tie": "tie",
                "multiplyNoteValue": "multiplybeatfactor",
                "swing": "newswing2",
                "playNoteMillis": "osctime",
                "playHertz": "hertz",
                // Handle function overloading with different number of arguments
                "setValue": { 3: "setDict", 2: "setDict2" },
                "getValue": { 2: "getDict", 1: "getDict2" },
            },
            "Math": {
                "abs": "abs",
                "floor": "int",
                "pow": "power",
                "sqrt": "sqrt",
            },
            "MathUtility": {
                "doCalculateDistance": "distance",
                "doOneOf": "oneOf",
                "doRandom": "random",
            },
        };

        // A map from binary operators in JavaScript to operators recognizable by musicblocks.
        const _binaryOperatorLookup = {
            "+": "plus",
            "-": "minus",
            "*": "multiply",
            "/": "divide",
            "%": "mod",
            "==": "equal",
            "!=": "not_equal_to",
            "<": "less",
            ">": "greater",
            "<=": "less_than_or_equal_to",
            ">=": "greater_than_or_equal_to",
            "|": "or",
            "&": "and",
            "^": "xor"
        };

        // A map from unary operators in JavaScript to operators recognizable by musicblocks.
        const _unaryOperatorLookup = {
            "-": "neg",
            "!": "not"
        };

        // Implementation of toTrees(AST).
        let root = {};
        for (let body of AST.body) {
            _createNodeAndAddToTree(body, root);
        }
        return root["children"];

        //
        // Helper functions
        //

        /**
         * Create a tree node starting at the give AST node and add it to parent, which is also a tree node.
         * A tree node is an associated array with one to three elements, for example:
         * {name: "settimbre", args: ["guitar"], children: [child1, child2]}.
         * 
         * @param {Object} bodyAST - an element in a 'body' array in the AST
         * @param {Object} parent - parent node for the new node created by this method
         * @returns {Void}
         */
        function _createNodeAndAddToTree(bodyAST, parent) {
            let visitor = undefined;
            for (const entry of _bodyVisitors) {
                if (entry.pred(bodyAST)) {
                    visitor = entry.visitor;
                    break;
                }
            }
            if (visitor === undefined) {
                throw {
                    prefix: "Unsupported statement: ",
                    start: bodyAST.start,
                    end: bodyAST.end
                };
            }
            if (visitor === null) {
                return;
            }

            let node = {};
            // Set block name
            node["name"] = visitor.getName(bodyAST);
            // Set arguments
            let args = _createArgNode(visitor.getArguments(bodyAST));
            if (args.length > 0) {
                node["args"] = args;
            }
            // Set children
            for (const child of visitor.getChildren(bodyAST)) {
                if (child.type != "ReturnStatement") {
                    _createNodeAndAddToTree(child, node);
                }
            }

            // Add the node to the children list of the parent.
            if (parent["children"] === undefined) {
                parent["children"] = [];
            }
            parent["children"].push(node);
        }

        /**
         * Create and return an array for the given array of AST nodes for arguments.
         * For exmple, two Literal AST nodes with value 1 and 2 will result in an array [1, 2];
         * One binary AST node "1 / 2" will result in an array [{"name": "divide", "args": [1, 2]}].
         * 
         * @param {Array} argASTNodes - an arry of AST nodes for arguments
         * @returns {Array} an array of all the arguments, note that an argument can be another node
         */
        function _createArgNode(argASTNodes) {
            let argNodes = [];
            for (const arg of argASTNodes) {
                const argNodeBuilder = _argNodeBuilders[arg.type];
                if (argNodeBuilder === undefined) {
                    throw {
                        prefix: `Unsupported argument type ${arg.type}: `,
                        start: arg.start,
                        end: arg.end
                    };
                }
                const argNode = argNodeBuilder(arg);
                if (argNode !== null) {
                    argNodes.push(argNode);
                }
            }
            return argNodes;
        }
    }

    /**
     * @param {Object} trees - trees generated from JavaScript AST by toTrees(AST)
     * @returns {Array} a blockList that can loaded by musicblocks by calling `blocks.loadNewBlocks(blockList)`
     */
    static toBlockList(trees) {
        // A map from block name to its argument handling function.
        // Keys do not include the blocks that do not take arguments (e.g., start block or action call block)
        // or can only be used as arguments - any block with a connector on its left side.
        // Each value is a function to add blocks for the arguments and return the number of vertical spaces
        // that the argument blocks will take. For example, an action definition with name for the action will
        // take 1 vertical space for its argument. playPitch(1/4, ...) will have its argument blocks take 2
        // vertical spaces. With this information, the code can decide how many vspacers to add.
        const _argHandlers = {
            // Action Palette, Action block (Action Declaration) takes a string literal for action name
            // Example: let chunk1 = async mouse => {...}
            // args: [{"identifier": "chunk1"}] =>
            //   [2,["text",{"value":"chunck1"}],0,0,[1]]
            "action": (args, blockList, parentBlockNumber) => {
                return _addNthArgToBlockList(["text", { "value": args[0].identifier }], 1, blockList, parentBlockNumber);
            },

            // Tone Palette, set instrument block takes a string literal for instrument name
            // Example: mouse.setInstrument("guitar", async () => {...});
            // args: ["guitar"] =>
            //   [2,["voicename",{"value":"guitar"}],0,0,[1]]
            "settimbre": (args, blockList, parentBlockNumber) => {
                return _addNthArgToBlockList(["voicename", { "value": args[0] }], 1, blockList, parentBlockNumber);
            },

            // Pitch Palette, pitch block takes a note name and a number expression for octave
            // Example: mouse.playPitch("sol", 4);
            // args: ["sol", 4] =>
            //   [10,["solfege",{"value":"sol"}],0,0,[9]],
            //   [11,["number",{"value":4}],0,0,[9]]
            // args: ["G", 4] =>
            //   [10,["notename",{"value":"G"}],0,0,[9]],
            //   [11,["number",{"value":4}],0,0,[9]]
            "pitch": (args, blockList, parentBlockNumber) => {
                const notes = new Set(["A", "B", "C", "D", "E", "F", "G"]);
                // Add the 1st argument - note name
                let vspaces = _addNthArgToBlockList(
                    [notes.has(args[0].charAt(0)) ? "notename" : "solfege", { "value": args[0] }],
                    1, blockList, parentBlockNumber);
                // Add the 2nd argument - a number expression for octave
                vspaces += _addNthValueArgToBlockList(args[1], 2, blockList, parentBlockNumber);
                return vspaces;
            },

            // Rhythm Palette, note block takes a number expression that evaluates to 1, 1/2, 1/4, etc.
            // Example: mouse.playNote(1 / 4, async () => {...});
            // args: [{"name": "divide"}, "args": [1, 4]] =>
            //   [8, "divide", 0, 0, [7, 9, 10]],
            //   [9, ["number", { "value": 1 }], 0, 0, [8]],
            //   [10, ["number", { "value": 4 }], 0, 0, [8]],
            "newnote": _addValueArgsToBlockList,

            // Dot block takes in a whole number
            // Example: mouse.dot(3, async () => {...});
            // args: [3]
            "rhythmicdot2": _addValueArgsToBlockList,

            // Multiply note value block takes in a number expression that evaluates to 1, 1/2, 1/4, etc.
            // Example: mouse.multiplyNoteValue(1 / 4, async () => {...});
            // args: [{"name": "divide"}, "args": [1, 4]] =>
            //   [7, "divide", 0, 0, [6, 8, 9]],
            //   [8, ["number", { "value": 1 }], 0, 0, [7]],
            //   [9, ["number", { "value": 4 }], 0, 0, [7]],
            "multiplybeatfactor": _addValueArgsToBlockList,

            // Swing block takes two args, a number expression as swing value, and another expression as note value
            // Example: mouse.swing(1 / 24, 1 / 8, async () => {...});
            "newswing2": _addValueArgsToBlockList,

            // Milliseconds note block takes in a number expression that evaluates to 1, 1/2, 1/4, etc.
            // Example: mouse.playNoteMillis(1000 / (3 / 2), async () => {...});
            "osctime": _addValueArgsToBlockList,

            // Hertz block takes in a whole number 
            // Example: mouse.playHertz(392);
            "hertz": _addValueArgsToBlockList,

            // Boxes Palette, subtract 1 from block takes a string identifier for variable
            // Example: box1 = box1 - 1;
            // args: [{"identifier": "box1"}]
            //   [2,["namedbox",{"value":"box1"}],0,0,[1]]
            "decrementOne": (args, blockList, parentBlockNumber) => {
                return _addNthArgToBlockList(["namedbox", { "value": args[0].identifier }], 1, blockList, parentBlockNumber);
            },

            // Boxes Palette, add block takes a string identifier for variable and a number expression
            // Example: box1 = box1 + 2;
            // args: [{"identifier": "box1"}, 2] =>
            //   [10,["namedbox",{"value":"box1"}],0,0,[9]],
            //   [11,["number",{"value":2}],0,0,[9]]
            "increment": (args, blockList, parentBlockNumber) => {
                // Add the 1st argument - variable name
                let vspaces = _addNthArgToBlockList(["namedbox", { "value": args[0].identifier }], 1, blockList, parentBlockNumber);
                // Add the 2nd argument - a number expression
                vspaces += _addNthValueArgToBlockList(args[1], 2, blockList, parentBlockNumber);
                return vspaces;
            },

            // Boxes Palette, store in box block takes a number or boolean expression
            // Example: var box1 = 2 * 5;
            // args: [{"name": "multiply"}, "args": [2, 5]] =>
            //   [8, "multiply", 0, 0, [7, 9, 10]],
            //   [9, ["number", { "value": 2 }], 0, 0, [8]],
            //   [10, ["number", { "value": 5 }], 0, 0, [8]],
            "storein2": _addValueArgsToBlockList,

            // Dictionary Palette, set value block takes a string for the name of the dictionary, a string for the key, and a value
            // Example: mouse.setValue("times", 3, "dict");
            // args: ["times", 3, "dict"] =>
            //   [8,["text",{"value":"dict"}],0,0,[7]],
            //   [9,["text",{"value":"times"}],0,0,[7]],
            //   [10,["number",{"value":3}],0,0,[7]]
            "setDict": (args, blockList, parentBlockNumber) => {
                // Add the 1st argument - Dictionary name
                let vspaces = _addNthArgToBlockList(["text", { "value": args[2] }], 1, blockList, parentBlockNumber);
                // Add the 2nd argument - Key
                vspaces += _addNthArgToBlockList(["text", { "value": args[0] }], 2, blockList, parentBlockNumber);
                // Add the 3rd argument - Value
                vspaces += _addNthValueArgToBlockList(args[1], 3, blockList, parentBlockNumber);
                return vspaces;
            },

            // Dictionary Palette, set value block takes a string for the key, and a value
            // Example: mouse.setValue("times", 3);
            // args: ["times", 3] =>
            //   [8,["text",{"value":"times"}],0,0,[7]],
            //   [9,["number",{"value":3}],0,0,[7]]
            "setDict2": (args, blockList, parentBlockNumber) => {
                // Add the 1st argument - Key
                let vspaces = _addNthArgToBlockList(["text", { "value": args[0] }], 1, blockList, parentBlockNumber);
                // Add the 2nd argument - Value
                vspaces += _addNthValueArgToBlockList(args[1], 2, blockList, parentBlockNumber);
                return vspaces;
            },

            // Flow Palette, repeat block takes a number expression
            "repeat": _addValueArgsToBlockList,

            // Flow Palette, while block takes a condition
            "while": _addValueArgsToBlockList,

            // Flow Palette, until block takes a condition
            "until": _addValueArgsToBlockList,

            // Flow Palette, if block takes a boolean expression
            "if": _addValueArgsToBlockList,

            // Flow Palette, if block takes a boolean expression
            "ifthenelse": _addValueArgsToBlockList,

            // Flow Palette, switch block takes a numerical expression
            "switch": _addValueArgsToBlockList,

            // Flow Palette, case block takes a numerical expression
            "case": _addValueArgsToBlockList,
        };

        // A map from block name to its properties including:
        // 1. An object that describes its connections such as the number of connections,
        // the indices of its first child block, next sibling block, etc.
        // 2. For blocks that may have children, the vertical spaces allowed for its arguments
        // before extra v-spacers are needed in order to prevent its argument blocks from
        // covering its child blocks.
        // 3. For blocks that don't have children, the vertical spaces allowed for its arguments
        // before extra v-spacers are needed in order to prevent its argument blocks from
        // covering its sibling blocks.
        // Keys do not include the blocks that can only be used as arguments - any block with
        // a connector on its left side.
        const _blockProperties = {
            "start": {
                // null, child, null
                connections: { count: 3, "child": 1 },
                argVSpaces: 1,
            },
            "action": {
                // Action declaration
                // null, arg (action name), child, null
                connections: { count: 4, "child": 2 },
                argVSpaces: 1,
            },
            "nameddo": {
                // Action call
                // prev, next
                connections: { count: 2, "prev": 0, "next": 1 },
                vspaces: 1,
            },
            "settimbre": {
                // prev, arg (instrument name), child, next
                connections: { count: 4, "prev": 0, "child": 2, "next": 3 },
                argVSpaces: 1,
            },
            "pitch": {
                // prev, arg1 (solfege), arg2 (octave), next
                connections: { count: 4, "prev": 0, "next": 3 },
                vspaces: 2,
            },
            "rest2": {
                // prev, next
                connections: { count: 2, "prev": 0, "next": 1 },
                vspaces: 1,
            },
            "rhythmicdot2": {
                // prev, arg (duration), child, next
                connections: { count: 4, "prev": 0, "child": 2, "next": 3 },
                argVSpaces: 1,
            },
            "tie": {
                // prev, child, next
                connections: { count: 3, "prev": 0, "child": 1, "next": 2 },
                argVSpaces: 0,
            },
            "multiplybeatfactor": {
                // prev, arg (duration), child, next
                connections: { count: 4, "prev": 0, "child": 2, "next": 3 },
                argVSpaces: 1,
            },
            "newswing2": {
                // prev, arg1 (swing), arg2 (note), child, next
                connections: { count: 5, "prev": 0, "child": 3, "next": 4 },
                argVSpaces: 2,
            },
            "osctime": {
                // prev, arg (duration), child, next
                connections: { count: 4, "prev": 0, "child": 2, "next": 3 },
                argVSpaces: 1,
            },
            "hertz": {
                // prev, child, next
                connections: { count: 4, "prev": 0, "child": 1, "next": 2 },
                argVSpaces: 1,
            },
            "newnote": {
                // prev, arg (note), child, next
                connections: { count: 4, "prev": 0, "child": 2, "next": 3 },
                argVSpaces: 1,
            },
            "decrementOne": {
                // prev, arg (variable name), next
                connections: { count: 3, "prev": 0, "next": 2 },
                vspaces: 1,
            },
            "increment": {
                // prev, arg1 (variable name), arg2 (value), next
                connections: { count: 4, "prev": 0, "next": 3 },
                vspaces: 2,
            },
            "storein2": {
                // prev, arg (variable name), next
                connections: { count: 3, "prev": 0, "next": 2 },
                vspaces: 1,
            },
            "setDict": {
                // prev, arg1 (dictionary name), arg2 (key), arg3 (value), next
                connections: { count: 5, "prev": 0, "next": 4 },
                vspaces: 3,
            },
            "setDict2": {
                // prev, arg1 (key), arg2 (value), next
                connections: { count: 4, "prev": 0, "next": 3 },
                vspaces: 2,
            },
            "repeat": {
                // prev, arg (repeat counts), child, next
                connections: { count: 4, "prev": 0, "child": 2, "next": 3 },
                argVSpaces: 1,
            },
            "while": {
                // prev, arg (condition), child, next
                connections: { count: 4, "prev": 0, "child": 2, "next": 3 },
                argVSpaces: 2,
            },
            "forever": {
                // prev, child, next
                connections: { count: 3, "prev": 0, "child": 1, "next": 2 },
                argVSpaces: 0,
            },
            "until": {
                // prev, arg (condition), child, next
                connections: { count: 3, "prev": 0, "child": 2, "next": 3 },
                argVSpaces: 0,
            },
            "if": {
                // prev, arg (condition), child, next
                connections: { count: 4, "prev": 0, "child": 2, "next": 3 },
                argVSpaces: 2,
            },
            "ifthenelse": {
                // prev, arg (condition), child (if and else cases), next
                connections: { count: 5, "prev": 0, "child": 2, "next": 4 },
                argVSpaces: 2,
            },
            "switch": {
                // prev, arg (variable), child, next
                connections: { count: 4, "prev": 0, "child": 2, "next": 3 },
                argVSpaces: 1,
            },
            "case": {
                // prev, arg (condition), child, next
                connections: { count: 4, "prev": 0, "child": 2, "next": 3 },
                argVSpaces: 1,
            },
            "defaultcase": {
                // prev, child, next
                connections: { count: 4, "prev": 0, "child": 1, "next": 2 },
                argVSpaces: 0,
            },
            "break": {
                // prev, next
                connections: { count: 4, "prev": 0, "next": 1 },
                vspaces: 1,
            },
            "vspace": {
                // prev, next
                connections: { count: 2, "prev": 0, "next": 1 }
            },
        };

        // [1,"settimbre",0,0,[0,2,3,null]] or
        // [21,["nameddo",{"value":"action"}],421,82,[20]]
        function _propertyOf(block) {
            return _blockProperties[Array.isArray(block[1]) ? block[1][0] : block[1]];
        }

        // Implementation of toBlockList(trees).
        let blockList = [];
        let x = 200;
        for (let tree of trees) {
            let blockNumber = _createBlockAndAddToList(tree, blockList)["blockNumber"];
            // Set (x, y) for the top level blocks.
            blockList[blockNumber][2] = x;
            blockList[blockNumber][3] = 200;
            x += 300;
        }
        return blockList;

        /**
         * Create a block for the tree node and add the block to the blockList.
         * Each block is [block number, block descriptor, x position, y position, [connections]], where
         * the actual number of connections and the meaning of each connection varies from block type to block type.
         * For example, for a settimbre block, connection 0 is the parent or the previous sibling of the node,
         * connection 1 is the arguments of the node, connection 2 is the first child of the node, and connection 3
         * is the next sibling of the node.
         * For a pitch block, connection 0 is the parent or the previous sibling of the node, connection 1 is the 
         * first argument of the node - solfege, connection 2 is the second argument of the node - octave, and 
         * connection 3 is the next sibling of the node.
         * For a number block (always as an argument), such as a divide block, connection 0 is the node that this
         * divide is its argument (e.g. a newnote block), connection 1 is numerator, and connection 2 is denominator.
         * 
         * @param {Object} node - the tree node for which a new block is to be created
         * @param {Array} blockList - where the new block is going to be added to
         * @returns {Number} the number (index in blockList) of the newly created block
         */

        function _createBlockAndAddToList(node, blockList) {
            let block = [];
            let blockNumber = blockList.length;
            block.push(blockNumber);
            blockList.push(block);
            if ((typeof node.name) === "object") {
                let blockName = Object.keys(node.name)[0];
                block.push([blockName, { "value": node.name[blockName] }]);
            } else if (node.name !== "else") {
                block.push(node.name);
            }
            block.push(0);  // x
            block.push(0);  // y

            let property = _propertyOf(block);
            let connections = new Array(property.connections.count).fill(null);
            block.push(connections);

            // Process arguments
            let argVSpaces = _createArgBlockAndAddToList(node, blockList, blockNumber);
            let vspaces = Math.max(1, argVSpaces);  // A node takes at least 1 vertical space

            // Process children
            if (node["children"] !== undefined && node["children"].length > 0) {
                let elseIndex = node.children.findIndex(child => child.name === "else");

                // Split children into if/else groups if applies (most cases first group will contain all children)
                let firstGroup = (elseIndex !== -1) ? node.children.slice(0, elseIndex) : node.children;
                let secondGroup = (elseIndex !== -1) ? node.children.slice(elseIndex + 1) : [];

                // Process first children group
                let ret = _processChildren(firstGroup, argVSpaces - property.argVSpaces, blockList);
                vspaces += ret.vspaces;

                // Set child-parent connection for first group
                connections[property.connections["child"]] = ret.firstChildBlockNumber;
                let childBlock = blockList[ret.firstChildBlockNumber];
                property = _propertyOf(childBlock);
                childBlock[4][property.connections["prev"]] = blockNumber;

                // Process second children group (else case in ifelse block)
                if (elseIndex !== -1) {
                    let ret = _processChildren(secondGroup, 0, blockList);
                    vspaces += ret.vspaces;
                    // Set child-parent connection for second group
                    connections[property.connections["child"] + 1] = ret.firstChildBlockNumber;
                    let childBlock = blockList[ret.firstChildBlockNumber];
                    property = _propertyOf(childBlock);
                    childBlock[4][property.connections["prev"]] = blockNumber;
                }
                // For blocks with children, add 1 to vspaces for the end of the clamp.
                vspaces += 1;
            }

            return { "blockNumber": blockNumber, "vspaces": vspaces };
        }

        // Helper to process a group of children (create and establish connections between them)
        function _processChildren(children, padding, blockList) {
            let childBlockNumbers = [];
            let vspaces = 0;

            // Add vertical spacers if the arguments take too much vertical spaces
            for (let i = 0; i < padding; i++) {
                childBlockNumbers.push(_addVSpacer(blockList));
                vspaces++;
            }

            // Add the children
            for (const child of children) {
                let ret = _createBlockAndAddToList(child, blockList);
                childBlockNumbers.push(ret.blockNumber);
                vspaces += ret.vspaces;

                let childProperty = _propertyOf(blockList[ret.blockNumber]);
                for (let i = 0; i < ret.vspaces - childProperty.vspaces; i++) {
                    childBlockNumbers.push(_addVSpacer(blockList));
                }
            }

            // Establish connections between children
            // Parent of children is their previous sibling, except the first one
            for (let i = 1; i < childBlockNumbers.length; i++) {
                let childBlock = blockList[childBlockNumbers[i]];
                let property = _propertyOf(childBlock);
                childBlock[4][property.connections["prev"]] = childBlockNumbers[i - 1];
            }
            // Set the next sibling block number for the children, except the last one
            for (let i = 0; i < childBlockNumbers.length - 1; i++) {
                let childBlock = blockList[childBlockNumbers[i]];
                let property = _propertyOf(childBlock);
                childBlock[4][property.connections["next"]] = childBlockNumbers[i + 1];
            }
            return { "firstChildBlockNumber": childBlockNumbers[0], "vspaces": vspaces };
        }

        function _addVSpacer(blockList) {
            let block = [];  // A block for the vertical spacer
            let blockNumber = blockList.length;
            block.push(blockNumber);
            blockList.push(block);
            block.push("vspace");
            block.push(0);  // x
            block.push(0);  // y
            block.push([null, null]);  // connections, prev and next
            return blockNumber;
        }

        function _createArgBlockAndAddToList(node, blockList, parentBlockNumber) {
            if (node.args === undefined || node.args.length == 0) {
                return 0;
            }
            let argHandlerKey = (typeof node.name) === "object" ? Object.keys(node.name)[0] : node.name;
            let argHandler = _argHandlers[argHandlerKey];
            if (argHandler === undefined) {
                throw new Error(`Cannot find argument handler for: ${argHandlerKey}`);
            }
            return argHandler(node.args, blockList, parentBlockNumber);
        }

        // Add a new block to the blockList for the nth argument (1-indexed) of the parent block.
        function _addNthArgToBlockList(arg, nth, blockList, parentBlockNumber) {
            let block = [];  // A block for the argument
            let blockNumber = blockList.length;
            block.push(blockNumber);
            blockList.push(block);
            block.push(arg);
            block.push(0);  // x
            block.push(0);  // y
            block.push([parentBlockNumber]);  // connections
            let parentConnections = blockList[parentBlockNumber][4];
            parentConnections[nth] = blockNumber;
            return 1;  // vspaces
        }

        /**
         * Examples:
         * 
         * args: [2] =>
         *   [5,["number",{"value":2}],0,0,[4]],
         *
         * args: [{"name": "divide", 
         *         "args": [1,4]}] =>
         *   [5,"divide",0,0,[4,6,7]],
         *   [6,["number",{"value":1}],0,0,[5]],
         *   [7,["number",{"value":4}],0,0,[5]]
         *
         * args: [{"name": "abs",
         *         "args": [{"name": "neg", 
         *                   "args": [1]}]}] =>
         *   [5,"abs",0,0,[4,6,7]],
         *   [6,["neg",0,0,[5,7]],
         *   [7,["number",{"value":1}],0,0,[6]]
         * 
         * @param {Object} args - the args property of a tree node
         * @param {Array} blockList - the blockList to which the new argument blocks will be added
         * @param {Number} parentBlockNumber - the number of the parent block of the new argument blocks
         */
        function _addValueArgsToBlockList(args, blockList, parentBlockNumber) {
            let vspaces = 0;
            for (let i = 0; i < args.length; i++) {
                vspaces += _addNthValueArgToBlockList(args[i], i + 1, blockList, parentBlockNumber);
            }
            return vspaces;
        }

        function _addNthValueArgToBlockList(arg, nth, blockList, parentBlockNumber) {
            let vspaces = 0;
            let block = [];
            let blockNumber = blockList.length;
            block.push(blockNumber);
            blockList.push(block);
            let type = typeof arg;
            if (type === "string") {
                type = "text";
            }
            if (type === "number" || type === "boolean" || type === "text" ||
                (type === "object" && arg.identifier !== undefined)) {
                // variables can be in number or boolean expressions
                block.push(type === "object" ? ["namedbox", { "value": arg.identifier }] : [type, { "value": arg }]);
                block.push(0);  // x
                block.push(0);  // y
                // Initialize connections with just the parent.
                block.push([parentBlockNumber]);
                vspaces = 1;
            } else if (type === "object") {
                block.push(arg.name);
                block.push(0);  // x
                block.push(0);  // y
                let connections = new Array(1 + arg.args.length).fill(null);
                connections[0] = parentBlockNumber;
                block.push(connections);
                vspaces = _addValueArgsToBlockList(arg.args, blockList, blockNumber);
            } else {
                throw new Error(`Unsupported value argument: ${arg}`);
            }
            let parentConnections = blockList[parentBlockNumber][4];
            parentConnections[nth] = blockNumber;
            return vspaces;
        }
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { AST2BlockList };
}
