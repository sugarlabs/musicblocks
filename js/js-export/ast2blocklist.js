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
     * Given a musicblocks AST ('type': "Program"), return an array of trees.
     * Each AST contains one to multiple top level blocks, each to be converted to a tree.
     * For example:
     *   {
     *     name: "start",
     *     children: [ {
     *       name: 'settimbre',
     *       args: ['guitar'],
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
        // A map from the statement type to three getters:
        //   nameGetter finds the name in the AST node of the statement and returns it;
        //   argsGetter returns an array of AST nodes that contain the arguments of the statement;
        //   childrenGetter returns an array of AST nodes that contain the children of the statement.
        // The AST structures for different statement types are different. Therefore, a new entry
        // needs to be added to the map in order to support a new statement type.
        // First, change _typeOf function to return a new statement type for a new AST structure.
        // Then, add the getters in this map with the new type as the key.
        const _getterLookup = {
            NewExpression: {
                nameGetter: () => { return "start"; },
                argsGetter: () => { return []; },
                childrenGetter: (bodyAST) => {
                    for (const arg of bodyAST.expression.arguments) {
                        if (arg.type == "ArrowFunctionExpression") {
                            return arg.body.body;
                        }
                    }
                    return [];
                },
            },
            AssignmentExpression: {
                nameGetter: (bodyAST) => {
                    if (bodyAST.expression.right.type == "BinaryExpression"
                        && bodyAST.expression.left.name == bodyAST.expression.right.left.name) {
                        // box1 = box1 - 1;
                        if (bodyAST.expression.right.operator == "-"
                            && bodyAST.expression.right.right.value == 1) {
                            return "decrementOne";
                        }
                        // box1 = box1 + 3; or
                        // box1 = box1 + -3;
                        if (bodyAST.expression.right.operator == "+") {
                            return "increment";
                        }
                    }
                    console.error("Unsupported AssignmentExpression: ", bodyAST.expression);
                },
                argsGetter: (bodyAST) => {
                    if (bodyAST.expression.right.type == "BinaryExpression"
                        && bodyAST.expression.left.name == bodyAST.expression.right.left.name) {
                        if (bodyAST.expression.right.operator == "-"
                            && bodyAST.expression.right.right.value == 1) {
                            return [bodyAST.expression.left];
                        }
                        if (bodyAST.expression.right.operator == "+") {
                            return [bodyAST.expression.left, bodyAST.expression.right.right];;
                        }
                    }
                    console.error("Unsupported AssignmentExpression: ", bodyAST.expression);
                },
                childrenGetter: () => { return []; },
            },
            AsyncActionCallExpression: {
                nameGetter: (bodyAST) => {
                    return { nameddo: bodyAST.expression.argument.callee.name };
                },
                argsGetter: () => { return []; },
                childrenGetter: () => { return []; },
            },
            AsyncMemberCallExpression: {
                nameGetter: (bodyAST) => {
                    let obj = bodyAST.expression.argument.callee.object.name;
                    let member = bodyAST.expression.argument.callee.property.name;
                    let numArgs = bodyAST.expression.argument.arguments.length;
                    if (obj in _memberLookup && member in _memberLookup[obj]) {
                        let name = _memberLookup[obj][member];
                        if (typeof name === 'object') {
                            name = name[numArgs];
                        }
                        return name;
                    }
                    console.error("Unsupported AsyncMemberCallExpression: ", obj, ".", member);
                    return null;
                },
                argsGetter: (bodyAST) => { return bodyAST.expression.argument.arguments; },
                childrenGetter: (bodyAST) => {
                    for (const arg of bodyAST.expression.argument.arguments) {
                        if (arg.type == "ArrowFunctionExpression") {
                            return arg.body.body;
                        }
                    }
                    return [];
                },
            },
            ActionDeclaration: {
                nameGetter: () => { return "action"; },
                argsGetter: (bodyAST) => { return [bodyAST.declarations[0].id]; },
                childrenGetter: (bodyAST) => { return bodyAST.declarations[0].init.body.body; },
            },
            VariableDeclaration: {
                nameGetter: (bodyAST) => {
                    return { storein2: bodyAST.declarations[0].id.name };
                },
                argsGetter: (bodyAST) => { return [bodyAST.declarations[0].init]; },
                childrenGetter: () => { return []; },
            },
            ForStatement: {
                nameGetter: () => { return "repeat"; },
                argsGetter: (bodyAST) => { return [bodyAST.test.right]; },
                childrenGetter: (bodyAST) => { return bodyAST.body.body; }
            },
            IfStatement: {
                nameGetter: () => { return "if"; },
                argsGetter: (bodyAST) => { return [bodyAST.test]; },
                childrenGetter: (bodyAST) => { return bodyAST.consequent.body; }
            },
        };

        // A map from member functions in AST to block names.
        // Member functions are function names used in JavaScript, while block names are
        // recognizable by musicblocks.
        const _memberLookup = {
            mouse: {
                setInstrument: "settimbre",
                playNote: "newnote",
                playPitch: "pitch",
                // Handle function overloading with different number of arguments
                setValue: { 3: "setDict", 2: "setDict2" },
                getValue: { 2: "getDict", 1: "getDict2" },
            },
            Math: {
                abs: "abs",
                floor: "int",
                pow: "power",
                sqrt: "sqrt",
            },
            MathUtility: {
                doCalculateDistance: "distance",
                doOneOf: "oneOf",
                doRandom: "random",
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
            // Ignore MusicBlocks.run()
            if (_typeOf(body) == "MemberCallExpression"
                && body.expression.callee.object.name == "MusicBlocks"
                && body.expression.callee.property.name == "run") {
                continue;
            }
            _createNodeAndAddToTree(body, root);
        }
        return root["children"];

        //
        // Helper functions
        //

        function _typeOf(bodyAST) {
            if (bodyAST.type == "ExpressionStatement") {
                if (bodyAST.expression.type == "NewExpression") {
                    return "NewExpression";
                }
                if (bodyAST.expression.type == "AssignmentExpression") {
                    return "AssignmentExpression";
                }
                if (bodyAST.expression.type == "CallExpression") {
                    if (bodyAST.expression.callee.type == "Identifier") {
                        return "ActionCallExpression";
                    }
                    if (bodyAST.expression.callee.type == "MemberExpression") {
                        return "MemberCallExpression";
                    }
                    console.error("Unsupported CallExpression callee type: ", bodyAST.expression.callee.type);
                    return null;
                }
                if (bodyAST.expression.type == "AwaitExpression") {
                    if (bodyAST.expression.argument.type == "CallExpression") {
                        if (bodyAST.expression.argument.callee.type == "Identifier") {
                            return "AsyncActionCallExpression";
                        }
                        if (bodyAST.expression.argument.callee.type == "MemberExpression") {
                            return "AsyncMemberCallExpression";
                        }
                        console.error("Unsupported Async CallExpression callee type: ", bodyAST.expression.argument.callee.type);
                        return null;
                    }
                    console.error("Unsupported AwaitExpression argument type: ", bodyAST.expression.type);
                    return null;
                }
                console.error("Unsupported ExpressionStatement expression type: ", bodyAST.expression.type);
                return null;
            }
            if (bodyAST.type == "ForStatement") {
                return "ForStatement";
            }
            if (bodyAST.type == "IfStatement") {
                return "IfStatement";
            }
            if (bodyAST.type == "VariableDeclaration") {
                if (bodyAST.declarations[0].init.type == "Literal"  // var v = 6;
                    || bodyAST.declarations[0].init.type == "BinaryExpression"  // var v = 2 * 3;
                    || bodyAST.declarations[0].init.type == "CallExpression"  // var v = Math.abs(-6);
                    || bodyAST.declarations[0].init.type == "UnaryExpression") {  // var v = -6;
                    return "VariableDeclaration";
                }
                if (bodyAST.declarations[0].init.type == "ArrowFunctionExpression") {
                    return "ActionDeclaration";
                }
                console.error("Unsupported VariableDeclaration init type:", bodyAST.declarations[0].init.type);
                return null;
            }
            console.error("Unsupported AST body type: ", bodyAST.type);
            return null;
        }

        /**
         * Create a tree node starting at the give AST node and add it to parent, which is also a tree node.
         * A tree node is an associated array with one to three elements, for example:
         * {name: 'settimbre', args: ['guitar'], children: [child1, child2]}.
         * 
         * @param {Object} bodyAST - an element in a 'body' array in the AST
         * @param {Object} parent - parent node for the new node created by this method
         * @returns {Void}
         */
        function _createNodeAndAddToTree(bodyAST, parent) {
            let type = _typeOf(bodyAST);
            if (type == null) {
                return;
            }
            if (!(type in _getterLookup)) {
                console.error("Unsupported AST node type: ", type, "in AST: ", bodyAST);
                return;
            }

            let node = {};
            // Set block name
            node["name"] = _getterLookup[type].nameGetter(bodyAST);
            // Set arguments
            let args = _createArgNode(_getterLookup[type].argsGetter(bodyAST));
            if (args.length > 0) {
                node["args"] = args;
            }
            // Set children
            for (const child of _getterLookup[type].childrenGetter(bodyAST)) {
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
         * One binary AST node "1 / 2" will result in an array [{'name': 'divide', 'args': [1, 2]}].
         * 
         * @param {Array} argASTNodes - an arry of AST nodes for arguments
         * @returns {Array} an array of all the arguments, note that an argument can be another node
         */
        function _createArgNode(argASTNodes) {
            let argNodes = [];
            for (const arg of argASTNodes) {
                switch (arg.type) {
                    case "ArrowFunctionExpression":
                        // Ignore the type, it's for children
                        break;
                    case "Identifier":
                        argNodes.push({ identifier: arg.name });
                        break;
                    case "Literal":
                        argNodes.push(arg.value);
                        break;
                    case "BinaryExpression":
                        if (arg.operator in _binaryOperatorLookup) {
                            argNodes.push({
                                "name": _binaryOperatorLookup[arg.operator],
                                "args": _createArgNode([arg.left, arg.right])
                            });
                        } else {
                            console.error("Unsupported binary operator: ", arg.operator);
                        }
                        break;
                    case "CallExpression":
                        let obj = arg.callee.object.name;
                        let member = arg.callee.property.name;
                        let numArgs = arg.arguments.length;
                        if (obj in _memberLookup && member in _memberLookup[obj]) {
                            let name = _memberLookup[obj][member];
                            if (typeof name === 'object') {
                                name = name[numArgs];
                            }
                            let args = arg.arguments;
                            if (name == "getDict") {
                                // For getValue(Key, Dictionary Name),
                                // make sure the order is [Dictionary Name, Key]
                                args = [arg.arguments[1], arg.arguments[0]];
                            }
                            argNodes.push({
                                "name": name,
                                "args": _createArgNode(args)
                            });
                        } else {
                            console.error("Unsupported Call function: ", obj, ".", member);
                        }
                        break;
                    case "UnaryExpression":
                        if (arg.operator in _unaryOperatorLookup) {
                            argNodes.push({
                                "name": _unaryOperatorLookup[arg.operator],
                                "args": _createArgNode([arg.argument])
                            });
                        } else {
                            console.error("Unsupported unary operator: ", arg.operator);
                        }
                        break;
                    case "AwaitExpression":
                        argNodes.push(_createArgNode([arg.argument])[0]);
                        break;
                    default:
                        console.error("Unsupported argument type: ", arg.type);
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
        const _argHandlers = {
            "action": _actionArgHandler,           // A string literal for action name
            "settimbre": _settimbreArgHandler,     // A string literal for instrument name
            "decrementOne": _variableArgHandler,   // A string identifier for variable
            "pitch": _pitchArgHandler,             // A note and a number expression
            "increment": _incrementArgHandler,     // A string identifier for variable and a number expression
            "newnote": _addValueArgsToBlockList,   // A number expression
            "repeat": _addValueArgsToBlockList,    // A number expression
            "if": _addValueArgsToBlockList,        // A boolean expression
            "storein2": _addValueArgsToBlockList,  // A number / boolean expression
            "setDict": _setDictArgHandler,         // A string for the name of the dictionary, a string for the key, and a value
            "setDict2": _setDictArgHandler,        // A string for the key, and a value
        };

        // A map from block name to the definition of its connections.
        const _connDescriptors = {
            "start": { "prev": 0, "child": 1, "next": 2 },
            "action": { "prev": 0, "args": 1, "child": 2, "next": 3 },
            "settimbre": { "prev": 0, "args": 1, "child": 2, "next": 3 },
            "decrementOne": { "prev": 0, "args": 1, "next": 2 },
            "pitch": { "prev": 0, "args": 1, "child": 2, "next": 3 },
            "increment": { "prev": 0, "args": 1, "next": 3 },
            "newnote": { "prev": 0, "args": 1, "child": 2, "next": 3 },
            "repeat": { "prev": 0, "args": 1, "child": 2, "next": 3 },
            "if": { "prev": 0, "args": 1, "child": 2, "next": 3 },
            "storein2": { "prev": 0, "args": 1, "next": 2 },
            "nameddo": { "prev": 0, "next": 1 },
            "setDict": { "prev": 0, "next": 4 },
            "setDict2": { "prev": 0, "next": 3 },
        };

        let blockList = [];
        let x = 200;
        for (let tree of trees) {
            let blockNumber = _createBlockAndAddToList(tree, blockList);
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
            } else {
                block.push(node.name);
            }
            block.push(0);  // x
            block.push(0);  // y

            let connDesc = _connectionDescriptorOf(block);
            let connections = new Array(Object.keys(connDesc).length).fill(null);
            block.push(connections);

            // Process arguments
            _createArgBlockAndAddToList(node, blockList, blockNumber);

            // Process children
            if (node["children"] !== undefined && node["children"].length > 0) {
                let childBlockNumbers = [];
                for (const child of node["children"]) {
                    childBlockNumbers.push(_createBlockAndAddToList(child, blockList));
                }
                // Set the first child block number for this block
                connections[connDesc["child"]] = childBlockNumbers[0];
                // Set parent block number for the first child to this block
                let childBlock = blockList[childBlockNumbers[0]];
                connDesc = _connectionDescriptorOf(childBlock);
                childBlock[4][connDesc["prev"]] = blockNumber;
                // Parent of other children is their previous sibling
                for (let i = 1; i < childBlockNumbers.length; i++) {
                    childBlock = blockList[childBlockNumbers[i]];
                    connDesc = _connectionDescriptorOf(childBlock);
                    childBlock[4][connDesc["prev"]] = childBlockNumbers[i - 1];
                }
                // Set the next sibling block number for the children, except the last one
                for (let i = 0; i < childBlockNumbers.length - 1; i++) {
                    childBlock = blockList[childBlockNumbers[i]];
                    connDesc = _connectionDescriptorOf(childBlock);
                    childBlock[4][connDesc["next"]] = childBlockNumbers[i + 1];
                }
            }
            return blockNumber;
        }

        // [1,"settimbre",0,0,[0,2,3,null]] or
        // [21,["namedbox",{"value":"box1"}],421,82,[20]]
        function _connectionDescriptorOf(block) {
            return _connDescriptors[Array.isArray(block[1]) ? block[1][0] : block[1]];
        }

        function _createArgBlockAndAddToList(node, blockList, parentBlockNumber) {
            if (node.args === undefined || node.args.length == 0) {
                return;
            }
            let argHandlerKey = (typeof node.name) === "object" ? Object.keys(node.name)[0] : node.name;
            let argHandler = _argHandlers[argHandlerKey];
            if (argHandler === undefined) {
                console.error("Cannot find argument handler for: ", argHandlerKey);
                return;
            }
            argHandler(node.args, blockList, parentBlockNumber);
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
        }

        /**
         * @param {Object} args - the args property of a settimbre tree node, for example, ["guitar"]
         * @param {Array} blockList - a new block [2,["voicename",{"value":"guitar"}],0,0,[1]] for the above example will be added to the blockList
         * @param {Number} parentBlockNumber - the number of the settimbre (parent) block of this argument block
         */
        function _settimbreArgHandler(args, blockList, parentBlockNumber) {
            _addNthArgToBlockList(["voicename", { "value": args[0] }], 1, blockList, parentBlockNumber);
        }

        /**
         * @param {Object} args - the args property of an action tree node, for example, ["identifier": "chunk1"]
         * @param {Array} blockList - a new block [2,["text",{"value":"chunck1"}],0,0,[1]] for the above example will be added to the blockList
         * @param {Number} parentBlockNumber - the number of the action (parent) block of this argument block
         */
        function _actionArgHandler(args, blockList, parentBlockNumber) {
            _addNthArgToBlockList(["text", { "value": args[0].identifier }], 1, blockList, parentBlockNumber);
        }

        /**
         * @param {Object} args - the args property of an increment or decrementOne tree node, for example, ["identifier": "box1"]
         * @param {Array} blockList - a new block [2,["namedbox",{"value":"box1"}],0,0,[1]] for the above example will be added to the blockList
         * @param {Number} parentBlockNumber - the number of the increment or decrementOne (parent) block of this argument block
         */
        function _variableArgHandler(args, blockList, parentBlockNumber) {
            _addNthArgToBlockList(["namedbox", { "value": args[0].identifier }], 1, blockList, parentBlockNumber);
        }

        /**
         * Example:
         * args: ['sol', 4] =>
         *   [10,["solfege",{"value":"sol"}],0,0,[9]],
         *   [11,["number",{"value":4}],0,0,[9]]
         * 
         * @param {Object} args - the args property of a pitch tree node
         * @param {Array} blockList - the blockList to which the new argument blocks will be added
         * @param {Number} parentBlockNumber - the number of the parent block of the new argument blocks
          */
        function _pitchArgHandler(args, blockList, parentBlockNumber) {
            _addNthArgToBlockList(["solfege", { "value": args[0] }], 1, blockList, parentBlockNumber);

            let blockNumber = _addValueArgToBlockList(args[1], blockList, parentBlockNumber);
            let parentConnections = blockList[parentBlockNumber][4];
            parentConnections[2] = blockNumber;
        }

        /**
         * Example:
         * args: [{"identifier": "box1"}, 4] =>
         *   [10,["namedbox",{"value":"box1"}],0,0,[9]],
         *   [11,["number",{"value":4}],0,0,[9]]
         * 
         * @param {Object} args - the args property of an increment tree node
         * @param {Array} blockList - the blockList to which the new argument blocks will be added
         * @param {Number} parentBlockNumber - the number of the parent block of the new argument blocks
          */
        function _incrementArgHandler(args, blockList, parentBlockNumber) {
            _addNthArgToBlockList(["namedbox", { "value": args[0].identifier }], 1, blockList, parentBlockNumber);

            let blockNumber = _addValueArgToBlockList(args[1], blockList, parentBlockNumber);
            let parentConnections = blockList[parentBlockNumber][4];
            parentConnections[2] = blockNumber;
        }

        function _setDictArgHandler(args, blockList, parentBlockNumber) {
            let nth = 1;

            // Dictionary name, optional
            if (args.length == 3) {
                _addNthArgToBlockList(["text", { "value": args[2] }], nth++, blockList, parentBlockNumber);
            }

            // Key
            _addNthArgToBlockList(["text", { "value": args[0] }], nth++, blockList, parentBlockNumber);

            // Value
            let blockNumber = _addValueArgToBlockList(args[1], blockList, parentBlockNumber);
            let parentConnections = blockList[parentBlockNumber][4];
            parentConnections[nth] = blockNumber;
        }

        /**
         * Examples:
         * 
         * args: [2] =>
         *   [5,["number",{"value":2}],0,0,[4]],
         *
         * args: [{'name': 'divide', 
         *         'args': [1,4]}] =>
         *   [5,"divide",0,0,[4,6,7]],
         *   [6,["number",{"value":1}],0,0,[5]],
         *   [7,["number",{"value":4}],0,0,[5]]
         *
         * args: [{'name': 'abs',
         *         'args': [{'name': 'neg', 
         *                   'args': [1]}]}] =>
         *   [5,"abs",0,0,[4,6,7]],
         *   [6,["neg",0,0,[5,7]],
         *   [7,["number",{"value":1}],0,0,[6]]
         * 
         * @param {Object} args - the args property of a tree node
         * @param {Array} blockList - the blockList to which the new argument blocks will be added
         * @param {Number} parentBlockNumber - the number of the parent block of the new argument blocks
         */
        function _addValueArgsToBlockList(args, blockList, parentBlockNumber) {
            let parentConnectionArgStartIndex = 1;
            for (let arg of args) {
                let parentConnections = blockList[parentBlockNumber][4];
                parentConnections[parentConnectionArgStartIndex++] = _addValueArgToBlockList(arg, blockList, parentBlockNumber);
            }
        }

        function _addValueArgToBlockList(arg, blockList, parentBlockNumber) {
            let block = [];
            let blockNumber = blockList.length;
            block.push(blockNumber);
            blockList.push(block);
            let type = typeof arg;
            if (type === 'string') {
                type = 'text';
            }
            if (type === 'number' || type === 'boolean' || type === 'text'
                || (type === 'object' && arg.identifier !== undefined)) {
                // variables can be in number or boolean expressions
                block.push(type === 'object' ? ["namedbox", { "value": arg.identifier }] : [type, { "value": arg }]);
                block.push(0);  // x
                block.push(0);  // y
                // Initialize connections with just the parent.
                block.push([parentBlockNumber]);
            } else if (type === 'object') {
                block.push(arg.name);
                block.push(0);  // x
                block.push(0);  // y
                let connections = new Array(1 + arg.args.length).fill(null);
                connections[0] = parentBlockNumber;
                block.push(connections);
                _addValueArgsToBlockList(arg.args, blockList, blockNumber);
            } else {
                console.error("Unsupported value argument: ", arg);
            }
            return blockNumber;
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AST2BlockList };
}

function main() {
    const acorn = require('acorn');
    const fs = require('node:fs');

    if (process.argv.length <= 2) {
        console.error("node ast2blocklist.test.js [music_block_js_file]");
        return;
    }
    let jsFile = process.argv[2];

    fs.readFile(jsFile, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return;
        }
        const AST = acorn.parse(data, { ecmaVersion: 2020 });
        console.log(JSON.stringify(AST, null, 2));
        let trees = AST2BlockList.toTrees(AST);
        console.log(JSON.stringify(trees, null, 2));
        let blockList = AST2BlockList.toBlockList(trees);
        console.log(toString(blockList));
    });
}

function toString(blockList) {
    if (!Array.isArray(blockList)) {
        return String(blockList); // Handle non-array inputs
    }

    return blockList.map(item => {
        if (typeof item === 'object' && item !== null) {
            return JSON.stringify(item); // Expand objects
        } else {
            return String(item); // Convert other items to strings
        }
    }).join(', ');
}

if (require.main === module) {
    main();
}