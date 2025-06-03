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
    static ASTtoBlockList(AST) {
        const Map = require('./ast2blocks.json');
        // console.log(Map);
        let trees = this.toTrees(AST, Map);
        return this.toBlockList(trees, Map);
    }
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
     * @param {Array} Map - JSON config that maps AST to corresponding blocks
     * @returns {Array} trees, see example above
     */
    static toTrees(AST, Map) {
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
                    "arguments": _createArgNode([argAST.left, argAST.right])
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
                    "arguments": _createArgNode([argAST.argument])
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
        // Implementation of toTrees(AST).
        let root = {};
        for (let body of AST.body) {
            let pair = _matchAST(body);
            _createNodeAndAddToTree(body, pair, root);
        }
        return root["children"];

        //
        // Helper functions
        //

        function _getPropertyValue(obj, path) {
            const steps = path.split(".");
            let current = obj;
            for (let step of steps) {
                // Regex matching to handle array case such as arguments[0]
                const matchStep = step.match(/(\w+)\[(\d+)\]/);
                if (matchStep) {
                    // Following the example above, the output of matchStep will have 
                    // 'arguments' at index 1 and the index (0) will be at index 2
                    current = current[matchStep[1]];
                    current = current[matchStep[2]];
                } else {
                    current = current[step];
                }
            }
            return current;
        }

        function _matchAST(bodyAST) {
            for (const entry of Map) {
                let ast = entry.ast;
                let matched = true;
                for (const identifier of ast.identifiers) {
                    let value = _getPropertyValue(bodyAST, identifier.property);
                    if ("value" in identifier) {
                        if (value !== identifier.value) {
                            matched = false;
                            break;
                        }
                    } else if ((!identifier.has_value && value != null)
                        || (identifier.has_value && value == null)) {
                        matched = false;
                        break;
                    }
                }
                if (matched) {
                    return entry;
                }
            }
            // TODO: error handling
            return null;
        }

        /**
         * Create a tree node starting at the give AST node and add it to parent, which is also a tree node.
         * A tree node is an associated array with one to three elements, for example:
         * {name: "settimbre", args: ["guitar"], children: [child1, child2]}.
         * 
         * @param {Object} bodyAST - an element in a 'body' array in the AST
         * @param {Object} pair - an element in a 'body' array in the AST
         * @param {Object} parent - parent node for the new node created by this method
         * @returns {Void}
         */
        function _createNodeAndAddToTree(bodyAST, pair, parent) {
            if (pair === null) {
                throw {
                    prefix: "Unsupported statement: ",
                    start: bodyAST.start,
                    end: bodyAST.end
                };
            }
            if (pair.block === undefined) {
                return;
            }
            

            let node = {};
            // Set block name
            if ("name" in pair.block) {
                node["name"] = pair.block.name;
            } else {
                node["name"] = pair.ast.name_property;
            }

            // Set arguments
            if (pair.ast.argument_properties !== undefined) {
                let argArray = [];
                for (const argPath of pair.ast.argument_properties) {
                    argArray.push(_getPropertyValue(bodyAST, argPath));
                }
                // console.log(argArray);
                let args = _createArgNode(argArray);
                // console.log(args);
                if (args.length > 0) {
                    node["arguments"] = args;
                }
            }
            // Set children
            if (pair.ast.children_properties !== undefined) {
                for (const child of _getPropertyValue(bodyAST, pair.ast.children_properties[0])) {
                    // console.log(child);
                    if (child.type != "ReturnStatement") {
                        let childPair = _matchAST(child);
                        // console.log(childPair);
                        _createNodeAndAddToTree(child, childPair, node);
                    }
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
     * @param {Array} Map - JSON config that maps AST to corresponding blocks
     * @returns {Array} a blockList that can loaded by musicblocks by calling `blocks.loadNewBlocks(blockList)`
     */
    static toBlockList(trees, Map) {
        // [1,"settimbre",0,0,[0,2,3,null]] or
        // [21,["nameddo",{"value":"action"}],421,82,[20]]
        function _propertyOf(block) {
            const block_name = Array.isArray(block[1]) ? block[1][0] : block[1];
            for (const entry of Map) {
                if (!("block" in entry)) continue;
                if ("name" in entry.block && entry.block.name === block_name) {
                    return entry.block;
                }
            }
            return {
                type: "block",
                connections: {
                    count: 2,
                    prev: 0,
                    next: 1
                },
                vspaces: 1,
                argument_v_spaces: 0
            };
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
                console.log(property.connections);
                let ret = _processChildren(firstGroup, argVSpaces - property.argument_v_spaces, blockList);
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
            if (node.arguments === undefined || node.arguments.length == 0) {
                return 0;
            }

            let block = blockList[parentBlockNumber];
            let property = _propertyOf(block);

            if (!property.argument_handling) {
                return _addValueArgsToBlockList(node.arguments, blockList, parentBlockNumber);
            }

            let vspaces = 0;
            const handlers = property.argument_handling.handlers || [];

            for (let i = 0; i < node.arguments.length; i++) {
                const arg = node.arguments[i];
                const handler = handlers[i] || { type: "value" };

                switch (handler.type) {
                    case "value":
                        vspaces += _addNthValueArgToBlockList(arg, i + 1, blockList, parentBlockNumber);
                        break;
                    case "identifier":
                        vspaces += _addNthArgToBlockList([handler.arg_type, { "value": arg.identifier }], i + 1, blockList, parentBlockNumber);
                        break;
                    case "note_name":
                        if (handler.arg_type === "solfege_or_notename") {
                            const notes = new Set(["A", "B", "C", "D", "E", "F", "G"]);
                            const argType = notes.has(arg.charAt(0)) ? "notename" : "solfege";
                            vspaces += _addNthArgToBlockList([argType, { "value": arg }], i + 1, blockList, parentBlockNumber);
                        } else {
                            vspaces += _addNthArgToBlockList([handler.arg_type, { "value": arg }], i + 1, blockList, parentBlockNumber);
                        }
                        break;
                    default:
                        throw new Error(`Unsupported argument handler type: ${handler.type}`);
                }
            }
            return vspaces;
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
                let connections = new Array(1 + arg.arguments.length).fill(null);
                connections[0] = parentBlockNumber;
                block.push(connections);
                vspaces = _addValueArgsToBlockList(arg.arguments, blockList, blockNumber);
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
