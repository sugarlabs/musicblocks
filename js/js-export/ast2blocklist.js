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
 *   let startTrees = AST2BlockList.toStartTrees(AST);
 *   let blockList = AST2BlockList.toBlockList(startTrees[0]);
 */
class AST2BlockList {
    /**
     * Given a musicblocks AST ('type': "Program"), return an array of start trees.
     * Each AST contains one to multiple start blocks, each to be converted to a start tree.
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
     * @param {Object} AST - AST generated from JavaScript code, see example above
     * @returns {Array} start trees, see example above
     */
    static toStartTrees(AST) {
        // A map from the statement type to three getters:
        //   nameGetter finds the name in the AST node of the statement and returns it;
        //   argsGetter returns an array of AST nodes that contain the arguments of the statement;
        //   childrenGetter returns an array of AST nodes that contain the children of the statement.
        // The AST structures for different statement types are different. Therefore, a new entry
        // needs to be added to the map in order to support a new statement type.
        const _getterLookup = {
            "ExpressionStatement": {
                "nameGetter": _expressionNameGetter,
                "argsGetter": _expressionArgsGetter,
                "childrenGetter": _expressionChildrenGetter,
            },
            "ForStatement": {
                "nameGetter": () => { return "repeat"; },
                "argsGetter": (bodyAST) => { return [bodyAST.test.right]; },
                "childrenGetter": (bodyAST) => { return bodyAST.body.body; }
            },
            "IfStatement": {
                "nameGetter": () => { return "if"; },
                "argsGetter": (bodyAST) => { return [bodyAST.test]; },
                "childrenGetter": (bodyAST) => { return bodyAST.consequent.body; }
            }
        };

        // A map from expression name in AST to block name.
        // Expression names are function names used in JavaScript, while block names are
        // recognizable by musicblocks.
        const _expressionLookup = {
            setInstrument: "settimbre",
            playNote: "newnote",
            playPitch: "pitch"
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

        // A map from functions in JavaScript to functions recognizable by musicblocks.
        const _functionLookup = {
            "abs": "abs",
            "doCalculateDistance": "distance",
            "doOneOf": "oneOf",
            "doRandom": "random",
            "floor": "int",
            "pow": "power",
            "sqrt": "sqrt"
        };

        // Implementation of toStartTrees(AST).
        let root = {};
        _createNodeAndAddToTree(AST.body[0], root);
        let startTrees = root["children"];
        for (let startTree of startTrees) {
            if (startTree["name"] == null) {
                startTree["name"] = "start";
            }
        }
        return startTrees;

        //
        // Helper functions
        //

        function _getOrNull(json, properties) {
            let val = json;
            for (const property of properties) {
                val = val[property];
                if (val === undefined) {
                    return null;
                }
            }
            return val;
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
            let node = {};
            if (bodyAST.type in _getterLookup) {
                // Set block name
                node["name"] = _getterLookup[bodyAST.type].nameGetter(bodyAST);
                // Set arguments
                let args = _createArgNode(_getterLookup[bodyAST.type].argsGetter(bodyAST));
                if (args.length > 0) {
                    node["args"] = args;
                }
                // Set children
                for (const child of _getterLookup[bodyAST.type].childrenGetter(bodyAST)) {
                    if (child.type != "ReturnStatement") {
                        _createNodeAndAddToTree(child, node);
                    }
                }
            } else {
                console.error("Unsupported AST node type: ", bodyAST.type);
            }

            // Add the node to the children list of the parent.
            if (parent["children"] === undefined) {
                parent["children"] = [];
            }
            parent["children"].push(node);
        }

        function _expressionNameGetter(bodyAST) {
            const name = _getOrNull(bodyAST, ["expression", "argument", "callee", "property", "name"]);
            if (name == null) {
                return null;
            }
            if (name in _expressionLookup) {
                return _expressionLookup[name];
            }
            else {
                console.error("Unsupported expression name: ", name);
                return null;
            }
        }

        function _expressionArgsGetter(bodyAST) {
            let args = _getOrNull(bodyAST, ["expression", "arguments"]);  // For Start
            if (args === null) {
                args = _getOrNull(bodyAST, ["expression", "argument", "arguments"]);
            }
            return args === null ? [] : args;
        }

        function _expressionChildrenGetter(bodyAST) {
            for (const arg of _getterLookup[bodyAST.type].argsGetter(bodyAST)) {
                let children = _getOrNull(arg, ["body", "body"]);
                if (children !== null) {
                    return children;
                }
            }
            return [];
        }

        /**
         * Create and return a tree node for the given array of AST nodes for arguments.
         * For exmple, two Literal AST nodes with value 1 and 2 will result in a tree node [1, 2];
         * One binary AST node "1 / 2" will result in a tree node [{'name': 'divide', 'args': [1, 2]}].
         * 
         * @param {Array} argASTNodes - an arry of AST nodes for arguments
         * @returns {Object} a tree node represents all the arguments, note that an argument can be another node
         */
        function _createArgNode(argASTNodes) {
            let node = [];
            for (const arg of argASTNodes) {
                switch (arg.type) {
                    case "ArrowFunctionExpression":
                        // Ignore
                        break;
                    case "Literal":
                        node.push(arg.value);
                        break;
                    case "BinaryExpression":
                        if (arg.operator in _binaryOperatorLookup) {
                            node.push({
                                "name": _binaryOperatorLookup[arg.operator],
                                "args": _createArgNode([arg.left, arg.right])
                            });
                        } else {
                            console.error("Unsupported binary operator: ", arg.operator);
                        }
                        break;
                    case "CallExpression":
                        if (arg.callee.property.name in _functionLookup) {
                            node.push({
                                "name": _functionLookup[arg.callee.property.name],
                                "args": _createArgNode(arg.arguments)
                            });
                        } else {
                            console.error("Unsupported Call function: ", arg.callee.property.name);
                        }
                        break;
                    case "UnaryExpression":
                        if (arg.operator in _unaryOperatorLookup) {
                            node.push({
                                "name": _unaryOperatorLookup[arg.operator],
                                "args": _createArgNode([arg.argument])
                            });
                        } else {
                            console.error("Unsupported unary operator: ", arg.operator);
                        }
                        break;
                    default:
                        console.error("Unsupported argument type: ", arg.type);
                }
            }
            return node;
        }
    }

    /**
     * @param {Object} tree - a start tree generated from JavaScript AST by toStartTrees(AST)
     * @returns {Array} a blockList that can loaded by musicblocks by calling `blocks.loadNewBlocks(blockList)`
     */
    static toBlockList(tree) {
        // A map from block name to its argument handling function.
        const _argHandlers = {
            "settimbre": _settimbreArgHandler,
            "newnote": _addValueArgsToBlockList,
            "pitch": _pitchArgHandler,
            "repeat": _addValueArgsToBlockList,
            "if": _addValueArgsToBlockList
        };

        // A map from block name to the definition of its connections.
        const _connDescriptors = {
            "start": { "prev": 0, "child": 1, "next": 2 },
            "settimbre": { "prev": 0, "args": 1, "child": 2, "next": 3 },
            "newnote": { "prev": 0, "args": 1, "child": 2, "next": 3 },
            "pitch": { "prev": 0, "args": 1, "child": 2, "next": 3 },
            "repeat": { "prev": 0, "args": 1, "child": 2, "next": 3 },
            "if": { "prev": 0, "args": 1, "child": 2, "next": 3 }
        };

        let blockList = [];
        _createBlockAndAddToList(tree, blockList);
        // Set (x, y) for the start block.
        blockList[0][2] = 200;
        blockList[0][3] = 200;
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
            block.push(node["name"]);
            block.push(0);  // x
            block.push(0);  // y

            let connDesc = _connDescriptors[node["name"]];
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
                block = blockList[childBlockNumbers[0]];
                connDesc = _connDescriptors[block[1]];  // block[1] is name
                block[4][connDesc["prev"]] = blockNumber;
                // Parent of other children is their previous sibling
                for (let i = 1; i < childBlockNumbers.length; i++) {
                    block = blockList[childBlockNumbers[i]];
                    connDesc = _connDescriptors[block[1]];  // block[1] is name
                    block[4][connDesc["prev"]] = childBlockNumbers[i - 1];
                }
                // Set the next sibling block number for the children, except the last one
                for (let i = 0; i < childBlockNumbers.length - 1; i++) {
                    block = blockList[childBlockNumbers[i]];
                    connDesc = _connDescriptors[block[1]];  // block[1] is name
                    block[4][connDesc["next"]] = childBlockNumbers[i + 1];
                }
            }
            return blockNumber;
        }

        function _createArgBlockAndAddToList(node, blockList, parentBlockNumber) {
            let args = node["args"];
            if (args === undefined || args.length == 0) {
                return;
            }
            let argHandler = _argHandlers[node["name"]];
            if (argHandler === undefined) {
                console.error("Cannot find argument handler for block: ", node["name"]);
                return;
            }
            argHandler(node["args"], blockList, parentBlockNumber);
        }

        /**
         * @param {Object} args - the args property of a settimbre tree node, for example, ["guitar"]
         * @param {Array} blockList - a new block [2,["voicename",{"value":"guitar"}],0,0,[1]] for the above example will be added to the blockList
         * @param {Number} parentBlockNumber - the number of the settimbre (parent) block of this argument block
         */
        function _settimbreArgHandler(args, blockList, parentBlockNumber) {
            let block = [];
            let blockNumber = blockList.length;
            block.push(blockNumber);
            blockList.push(block);
            block.push(["voicename", { "value": args[0] }]);
            block.push(0);  // x
            block.push(0);  // y
            block.push([parentBlockNumber]);  // connections
            let parentConnections = blockList[parentBlockNumber][4];
            parentConnections[1] = blockNumber;
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
            if (type === 'number' || type === 'boolean') {
                block.push([type, { "value": arg }]);
                block.push(0);  // x
                block.push(0);  // y
                // Initialize connections with just the parent.
                block.push([parentBlockNumber]);
            } else {
                block.push(arg.name);
                block.push(0);  // x
                block.push(0);  // y
                let connections = new Array(1 + arg.args.length).fill(null);
                connections[0] = parentBlockNumber;
                block.push(connections);
                _addValueArgsToBlockList(arg.args, blockList, blockNumber);
            }
            return blockNumber;
        }

        /**
         * Example:
         * args: ['sol', 4] =>
         *   [10,["solfege",{"value":"sol"}],1864,237,[9]],
         *   [11,["number",{"value":4}],1864,269,[9]]
         * 
         * @param {Object} args - the args property of a pitch tree node
         * @param {Array} blockList - the blockList to which the new argument blocks will be added
         * @param {Number} parentBlockNumber - the number of the parent block of the new argument blocks
          */
        function _pitchArgHandler(args, blockList, parentBlockNumber) {
            let block = [];
            let blockNumber = blockList.length;
            block.push(blockNumber);
            blockList.push(block);
            block.push(["solfege", { "value": args[0] }]);
            block.push(0);  // x
            block.push(0);  // y
            block.push([parentBlockNumber]);  // connections
            let parentConnections = blockList[parentBlockNumber][4];
            parentConnections[1] = blockNumber;

            blockNumber = _addValueArgToBlockList(args[1], blockList, parentBlockNumber);
            parentConnections[2] = blockNumber;
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
        let startTrees = AST2BlockList.toStartTrees(AST);
        console.log(JSON.stringify(startTrees, null, 2));
        let blockList = AST2BlockList.toBlockList(startTrees[0]);
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