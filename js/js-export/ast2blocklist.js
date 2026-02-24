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
 *   let blockList = AST2BlockList.toBlockList(AST, config);
 */
class AST2BlockList {
    static toBlockList(AST, config) {
        let trees = _astToTree(AST, config);
        return _treeToBlockList(trees, config);

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
         * @param {Array} config - JSON config that maps AST to corresponding blocks
         * @returns {Array} trees, see example above
         */
        function _astToTree(AST, config) {
            // Load argument properties configuration
            const argConfigs = config.argument_blocks;

            // Implementation of toTrees(AST).
            let root = {};
            for (let body of AST.body) {
                _createNodeAndAddToTree(body, root);
            }
            console.log(JSON.stringify(root["children"], null, 2));
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

            function _matchBody(bodyAST) {
                for (const entry of config.body_blocks) {
                    if (!("ast" in entry)) continue;

                    // Group identifiers by property path
                    const propertyGroups = {};
                    for (const identifier of entry.ast.identifiers) {
                        if (!propertyGroups[identifier.property]) {
                            propertyGroups[identifier.property] = [];
                        }
                        propertyGroups[identifier.property].push(identifier);
                    }
                    // Check if all property groups match
                    let matched = true;
                    for (const [property, identifiers] of Object.entries(propertyGroups)) {
                        const value = _getPropertyValue(bodyAST, property);
                        let groupMatched = false;

                        // Check if any identifier in this group matches
                        for (const identifier of identifiers) {
                            if ("value" in identifier) {
                                if (value === identifier.value) {
                                    groupMatched = true;
                                    break;
                                }
                            } else if (
                                "has_value" in identifier &&
                                ((!identifier.has_value && value == null) ||
                                    (identifier.has_value && value != null))
                            ) {
                                groupMatched = true;
                                break;
                            } else if (
                                !("has_value" in identifier) &&
                                identifier.size === value.length
                            ) {
                                groupMatched = true;
                                break;
                            }
                        }
                        if (!groupMatched) {
                            matched = false;
                            break;
                        }
                    }
                    if (matched) {
                        // If there's no name property but there is a name_map, try to get the name from the map
                        if (entry.name_map) {
                            const calleePropertyName = _getPropertyValue(
                                bodyAST,
                                "expression.argument.callee.property.name"
                            );
                            if (calleePropertyName && entry.name_map[calleePropertyName]) {
                                console.log(entry.name_map[calleePropertyName]);
                                entry.name = entry.name_map[calleePropertyName];
                            }
                        }
                        return entry;
                    }
                }
                return null;
            }

            function _matchArgument(arg) {
                for (const entry of argConfigs) {
                    let arg_type = entry.ast;
                    let matched = true;
                    for (const identifier of arg_type.identifiers) {
                        let value = _getPropertyValue(arg, identifier.property);
                        if ("size" in identifier) {
                            if (value.length !== identifier.size) {
                                matched = false;
                                break;
                            }
                        } else if (value !== identifier.value) {
                            matched = false;
                            break;
                        }
                    }
                    if (matched) {
                        return entry;
                    }
                }
                return null;
            }

            function _createNodeAndAddToTree(bodyAST, parent) {
                let pair = _matchBody(bodyAST);
                if (pair === null) {
                    throw {
                        prefix: "Unsupported statement: ",
                        start: bodyAST.start,
                        end: bodyAST.end
                    };
                }
                if (!("name" in pair)) {
                    return;
                }

                let node = {};
                // Set block name
                if ("name_property" in pair.ast) {
                    node["name"] = {
                        [pair.name]: _getPropertyValue(bodyAST, pair.ast.name_property)
                    };
                } else {
                    node["name"] = pair.name;
                }

                // Set arguments
                if (pair.arguments !== undefined) {
                    let argArray = [];
                    if ("arguments_property" in pair.ast) {
                        let args = _getPropertyValue(bodyAST, pair.ast.arguments_property) || [];
                        if (!Array.isArray(args)) {
                            args = [args];
                        }
                        const offset = pair.ast.arguments_offset || 0;
                        argArray = args.slice(offset);
                    } else {
                        for (const argPath of pair.ast.argument_properties) {
                            argArray.push(_getPropertyValue(bodyAST, argPath));
                        }
                    }
                    let args = _createArgNode(argArray);
                    if (args.length > 0) {
                        node["arguments"] = args;
                    }
                }
                // Set children
                if (pair.ast.children_properties !== undefined) {
                    for (const child of _getPropertyValue(
                        bodyAST,
                        pair.ast.children_properties[0]
                    )) {
                        if (child.type != "ReturnStatement") {
                            _createNodeAndAddToTree(child, node);
                        }
                    }
                    if (pair.ast.children_properties.length > 1) {
                        node["children"].push({ name: "else" });
                        for (const child of _getPropertyValue(
                            bodyAST,
                            pair.ast.children_properties[1]
                        )) {
                            if (child.type != "ReturnStatement") {
                                _createNodeAndAddToTree(child, node);
                            }
                        }
                    }
                }
                // Add the node to the children list of the parent.
                if (parent["children"] === undefined) {
                    parent["children"] = [];
                }
                parent["children"].push(node);
            }

            function _createArgNode(argASTNodes) {
                let argNodes = [];
                for (const arg of argASTNodes) {
                    let argNode = null;

                    // Find matching configuration for this argument type
                    let argConfig = _matchArgument(arg);
                    if (!argConfig) {
                        throw {
                            prefix: `Unsupported argument type ${arg.type}: `,
                            start: arg.start,
                            end: arg.end
                        };
                    }

                    if ("value_property" in argConfig.ast) {
                        argNode = _getPropertyValue(arg, argConfig.ast.value_property);
                    } else if (argConfig.ast.identifier_property) {
                        argNode = {
                            identifier: _getPropertyValue(arg, argConfig.ast.identifier_property)
                        };
                    } else {
                        const name = _getPropertyValue(arg, argConfig.ast.name_property);
                        if (name in argConfig.name_map) {
                            let blockName = argConfig.name_map[name];
                            let args = [];
                            if ("arguments_property" in argConfig.ast) {
                                args = _getPropertyValue(arg, argConfig.ast.arguments_property);
                            } else {
                                for (const property of argConfig.ast.argument_properties) {
                                    args.push(_getPropertyValue(arg, property));
                                }
                            }
                            if (typeof blockName === "object") {
                                blockName = blockName[args.length];
                            }
                            if (blockName === undefined) {
                                throw {
                                    prefix: `Unsupported argument count for ${name}: `,
                                    start: arg.start,
                                    end: arg.end
                                };
                            }
                            argNode = {
                                name: blockName,
                                arguments: _createArgNode(args)
                            };
                        } else {
                            throw {
                                prefix: `Unsupported operator ${name}: `,
                                start: arg.start,
                                end: arg.end
                            };
                        }
                    }

                    argNodes.push(argNode);
                }
                return argNodes;
            }
        }

        /**
         * @param {Object} trees - trees generated from JavaScript AST by toTrees(AST)
         * @param {Array} config - JSON config that maps AST to corresponding blocks
         * @returns {Array} a blockList that can loaded by musicblocks by calling `blocks.loadNewBlocks(blockList)`
         */
        function _treeToBlockList(trees, config) {
            // [1,"settimbre",0,0,[0,2,3,null]] or
            // [21,["nameddo",{"value":"action"}],421,82,[20]]
            function _propertyOf(block) {
                const block_name = Array.isArray(block[1]) ? block[1][0] : block[1];
                for (const entry of config.body_blocks) {
                    if (
                        ("name" in entry && entry.name === block_name) ||
                        ("name_map" in entry && Object.values(entry.name_map).includes(block_name))
                    ) {
                        // Use default_connections if blocklist_connections is not specified
                        const connections = {
                            count: entry.blocklist_connections
                                ? entry.blocklist_connections.length
                                : config.default_connections.length
                        };

                        // Get the connections array to use
                        const connectionsArray =
                            entry.blocklist_connections || config.default_connections;

                        // Only add connection indices that exist
                        const prevIndex = connectionsArray.indexOf("parent_or_previous_sibling");
                        if (prevIndex !== -1) connections.prev = prevIndex;

                        const childIndex = connectionsArray.indexOf("first_child");
                        if (childIndex !== -1) connections.child = childIndex;

                        const nextIndex = connectionsArray.indexOf("next_sibling");
                        if (nextIndex !== -1) connections.next = nextIndex;

                        const secondChildIndex = connectionsArray.indexOf("second_child");
                        if (secondChildIndex !== -1) connections.second_child = secondChildIndex;

                        // Use default_vspaces if not specified in the block
                        const vspaces = entry.default_vspaces ||
                            config.default_vspaces || { body: 1 };
                        return "body" in vspaces
                            ? {
                                  type: "block",
                                  connections: connections,
                                  vspaces: vspaces.body
                              }
                            : {
                                  type: "block",
                                  connections: connections,
                                  argument_v_spaces: vspaces.argument
                              };
                    }
                }
                // doesn't match means it is a vspace block
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
                if (typeof node.name === "object") {
                    let blockName = Object.keys(node.name)[0];
                    block.push([blockName, { value: node.name[blockName] }]);
                } else if (node.name !== "else") {
                    block.push(node.name);
                }
                block.push(0); // x
                block.push(0); // y

                let property = _propertyOf(block);
                let connections = new Array(property.connections.count).fill(null);
                block.push(connections);

                // Process arguments
                let argVSpaces = _createArgBlockAndAddToList(node, blockList, blockNumber);
                let vspaces = Math.max(1, argVSpaces); // A node takes at least 1 vertical space

                // Process children
                if (node["children"] !== undefined && node["children"].length > 0) {
                    let elseIndex = node.children.findIndex(child => child.name === "else");

                    // Split children into if/else groups if applies (most cases first group will contain all children)
                    let firstGroup =
                        elseIndex !== -1 ? node.children.slice(0, elseIndex) : node.children;
                    let secondGroup = elseIndex !== -1 ? node.children.slice(elseIndex + 1) : [];

                    // Process first children group
                    let ret = _processChildren(
                        firstGroup,
                        argVSpaces - property.argument_v_spaces,
                        blockList
                    );
                    vspaces += ret.vspaces;

                    // Set child-parent connection for first group
                    if (property.connections.child !== undefined) {
                        connections[property.connections.child] = ret.firstChildBlockNumber;
                        let childBlock = blockList[ret.firstChildBlockNumber];
                        let childProperty = _propertyOf(childBlock);
                        if (childProperty.connections.prev !== undefined) {
                            childBlock[4][childProperty.connections.prev] = blockNumber;
                        }
                    }

                    // Process second children group (else case in ifelse block)
                    if (elseIndex !== -1) {
                        let ret = _processChildren(secondGroup, 0, blockList);
                        vspaces += ret.vspaces;
                        // Set child-parent connection for second group
                        if (property.connections.second_child !== undefined) {
                            connections[property.connections.second_child] =
                                ret.firstChildBlockNumber;
                            let childBlock = blockList[ret.firstChildBlockNumber];
                            let childProperty = _propertyOf(childBlock);
                            if (childProperty.connections.prev !== undefined) {
                                childBlock[4][childProperty.connections.prev] = blockNumber;
                            }
                        }
                    }
                }

                return { blockNumber: blockNumber, vspaces: vspaces };
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
                    if (property.connections.prev !== undefined) {
                        childBlock[4][property.connections.prev] = childBlockNumbers[i - 1];
                    }
                }
                // Set the next sibling block number for the children, except the last one
                for (let i = 0; i < childBlockNumbers.length - 1; i++) {
                    let childBlock = blockList[childBlockNumbers[i]];
                    let property = _propertyOf(childBlock);
                    if (property.connections.next !== undefined) {
                        childBlock[4][property.connections.next] = childBlockNumbers[i + 1];
                    }
                }
                return { firstChildBlockNumber: childBlockNumbers[0], vspaces: vspaces };
            }

            function _addVSpacer(blockList) {
                let block = []; // A block for the vertical spacer
                let blockNumber = blockList.length;
                block.push(blockNumber);
                blockList.push(block);
                block.push("vspace");
                block.push(0); // x
                block.push(0); // y
                block.push([null, null]); // connections, prev and next
                return blockNumber;
            }

            function _createArgBlockAndAddToList(node, blockList, parentBlockNumber) {
                if (node.arguments === undefined || node.arguments.length == 0) {
                    return 0;
                }

                let block = blockList[parentBlockNumber];
                let property = _propertyOf(block);
                let vspaces = 0;

                // Find the block configuration
                const block_name = Array.isArray(block[1]) ? block[1][0] : block[1];
                let blockConfig = null;
                for (const entry of config.body_blocks) {
                    if (entry.name === block_name) {
                        blockConfig = entry;
                        break;
                    } else if (entry.name_map) {
                        for (const name in entry.name_map) {
                            if (block_name === entry.name_map[name]) {
                                blockConfig = entry;
                                console.log(entry);
                                console.log(block_name);
                            }
                        }
                    }
                }

                if (!blockConfig || !blockConfig.arguments) {
                    throw new Error(`Cannot find argument configuration for: ${block_name}`);
                }

                // Process each argument with its corresponding configuration
                for (let i = 0; i < node.arguments.length; i++) {
                    const arg = node.arguments[i];
                    if (arg === null) {
                        continue;
                    }
                    let argConfig = blockConfig.arguments[i];
                    if (!argConfig && blockConfig.arguments_repeat) {
                        argConfig = blockConfig.arguments[blockConfig.arguments.length - 1];
                    }
                    if (!argConfig) {
                        throw new Error(`Missing argument configuration for: ${block_name}`);
                    }
                    if (argConfig.type === "note_or_solfege") {
                        // Handle pitch notes (solfege or note names)
                        const notes = new Set(["A", "B", "C", "D", "E", "F", "G"]);
                        vspaces += _addNthArgToBlockList(
                            [notes.has(arg.charAt(0)) ? "notename" : "solfege", { value: arg }],
                            i + 1,
                            blockList,
                            parentBlockNumber
                        );
                    } else if (argConfig.type === "ValueExpression") {
                        // Handle value expressions (like storein2)
                        vspaces += _addNthValueArgToBlockList(
                            arg,
                            i + 1,
                            blockList,
                            parentBlockNumber
                        );
                    } else if (
                        argConfig.type === "NumberExpression" ||
                        argConfig.type === "BooleanExpression"
                    ) {
                        // Handle number/boolean expressions
                        vspaces += _addNthValueArgToBlockList(
                            arg,
                            i + 1,
                            blockList,
                            parentBlockNumber
                        );
                    } else {
                        vspaces += _addNthArgToBlockList(
                            [
                                argConfig.type,
                                { value: typeof arg === "object" ? arg.identifier : arg }
                            ],
                            i + 1,
                            blockList,
                            parentBlockNumber
                        );
                    }
                }
                return vspaces;
            }

            // Add a new block to the blockList for the nth argument (1-indexed) of the parent block.
            function _addNthArgToBlockList(arg, nth, blockList, parentBlockNumber) {
                let block = []; // A block for the argument
                let blockNumber = blockList.length;
                block.push(blockNumber);
                blockList.push(block);
                block.push(arg);
                block.push(0); // x
                block.push(0); // y
                block.push([parentBlockNumber]); // connections
                let parentConnections = blockList[parentBlockNumber][4];
                parentConnections[nth] = blockNumber;
                return 1; // vspaces
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
                    vspaces += _addNthValueArgToBlockList(
                        args[i],
                        i + 1,
                        blockList,
                        parentBlockNumber
                    );
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
                if (
                    type === "number" ||
                    type === "boolean" ||
                    type === "text" ||
                    (type === "object" && arg.identifier !== undefined)
                ) {
                    // variables can be in number or boolean expressions
                    block.push(
                        type === "object"
                            ? ["namedbox", { value: arg.identifier }]
                            : [type, { value: arg }]
                    );
                    block.push(0); // x
                    block.push(0); // y
                    // Initialize connections with just the parent.
                    block.push([parentBlockNumber]);
                    vspaces = 1;
                } else if (type === "object") {
                    block.push(arg.name);
                    block.push(0); // x
                    block.push(0); // y
                    let connections = new Array(1 + arg.arguments.length).fill(null);
                    connections[0] = parentBlockNumber;
                    block.push(connections);
                    vspaces = _addValueArgsToBlockList(arg.arguments, blockList, blockNumber);
                    if (arg.arguments.length === 0) {
                        vspaces += 1;
                    }
                } else {
                    throw new Error(`Unsupported value argument: ${arg}`);
                }
                let parentConnections = blockList[parentBlockNumber][4];
                parentConnections[nth] = blockNumber;
                return vspaces;
            }
        }
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { AST2BlockList };
}
