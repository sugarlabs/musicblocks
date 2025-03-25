// Usage:
//   let startTrees = AST2BlockList.toStartTrees(AST);
//   let blockList = AST2BlockList.toBlockList(startTrees[0]);
class AST2BlockList {
    // Given an AST, create an intermediate tree structure.
    // TODO: Use a simple example to show the mapping from AST to tree.
    static toStartTrees(AST) {
        // TODO: Move this map to interface.js
        const _blockNameLookup = {
            setInstrument: "settimbre",
            playNote: "newnote",
            playPitch: "pitch"
        };

        const _operatorNameLookup = {
            "+": "plus",
            "-": "minus",
            "*": "multiply",
            "/": "divide",
            "%": "mod",
            "abs": "abs",
            "doCalculateDistance": "distance",
            "doOneOf": "oneOf",
            "doRandom": "random",
            "floor": "int",
            "pow": "power",
            "sqrt": "sqrt"
        };

        let root = {};
        _createNodeAndAddToTree(AST.body[0], root);
        let startTrees = root["children"];
        for (let startTree of startTrees) {
            if (startTree["name"] === undefined) {
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

        // Create a tree node starting at the give AST node and add it to parent, which is also a tree node.
        // A tree node is an associated array with one to three elements, for example:
        // {name: 'settimbre', args: ['guitar'], children: [child1, child2]}.
        // bodyAST is an element in a 'body' array in the AST.
        function _createNodeAndAddToTree(bodyAST, parent) {
            let node = {};
            _addBlockNameIfAny(bodyAST, node);
            _addArgsIfAny(bodyAST, node);
            _addChildrenIfAny(bodyAST, node);
            if (parent["children"] === undefined) {
                parent["children"] = [];
            }
            parent["children"].push(node);
        }

        function _addBlockNameIfAny(bodyAST, node) {
            if (bodyAST.type == "ForStatement") {
                node["name"] = "repeat";
                return;
            } else if (bodyAST.type == "IfStatement") {
                node["name"] = "if";
                return;
            }

            const methodName = _getOrNull(bodyAST, ["expression", "argument", "callee", "property", "name"]);
            if (methodName === null) {
                return;
            }
            if (methodName in _blockNameLookup) {
                node["name"] = _blockNameLookup[methodName];
            }
            else {
                console.error("Unsupported method name: ", methodName);
            }
        }

        function _addArgsIfAny(bodyAST, node) {
            let args = _createArgNode(_getArguments(bodyAST));
            if (args.length > 0) {
                node["args"] = args;
            }
        }

        // Create and return a tree node for the given array of AST nodes for arguments
        // For exmple, two Literal AST nodes with value 1 and 2 will result in a tree node [1, 2];
        // One binary AST node "1 / 2" will result in a tree node [{'name': 'divide', 'args': [1, 2]}].
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
                        if (arg.operator in _operatorNameLookup) {
                            node.push({
                                "name": _operatorNameLookup[arg.operator],
                                "args": _createArgNode([arg.left, arg.right])
                            });
                        } else {
                            console.error("Unsupported binary operator: ", arg.operator);
                        }
                        break;
                    case "CallExpression":
                        let funcName = arg.callee.property.name;
                        if (funcName in _operatorNameLookup) {
                            node.push({
                                "name": _operatorNameLookup[funcName],
                                "args": _createArgNode(arg.arguments)
                            });
                        } else {
                            console.error("Unsupported Call function: ", funcName);
                        }
                        break;
                    case "UnaryExpression":
                        node.push({
                            "name": "neg",  // TODO: generalize this
                            "args": _createArgNode([arg.argument])
                        });
                        break;
                    default:
                        console.error("Unsupported argument type: ", arg.type);
                }
            }
            return node;
        }

        function _getArguments(bodyAST) {
            let args = _getOrNull(bodyAST, ["expression", "arguments"]);
            if (args === null) {
                args = _getOrNull(bodyAST, ["expression", "argument", "arguments"]);
            }
            if (args === null) {
                args = [_getOrNull(bodyAST, ["test", "right"])];  // ForStatement
            }
            if (args === null) {
                return [bodyAST.test];
            }
            return args === null ? [] : args;
        }

        function _addChildrenIfAny(bodyAST, node) {
            for (const child of _getChildren(bodyAST)) {
                if (child.type == "ReturnStatement") {
                    // Ignore return statements
                    continue;
                }
                _createNodeAndAddToTree(child, node);
            }
        }

        function _getChildren(bodyAST) {
            let children = _getOrNull(bodyAST, ["body", "body"]);  // ForStatement
            if (children != null) {
                return children;
            }

            children = _getOrNull(bodyAST, ["consequent", "body"]);
            if (children != null) {
                return children;
            }

            for (const arg of _getArguments(bodyAST)) {
                let children = _getOrNull(arg, ["body", "body"]);
                if (children !== null) {
                    return children;
                }
            }
            return [];
        }
    }

    // Given an intermediate tree, create a blockList that can loaded by musicblocks by
    // calling `blocks.loadNewBlocks(blockList)`.
    // TODO: Use a simple example to show the mapping from tree to blockList.
    static toBlockList(tree) {
        // A map from block name to its argument handling function.
        const _argHandlers = {
            "settimbre": _settimbreArgHandler,
            "newnote": _addNumberArgsToBlockList,
            "pitch": _pitchArgHandler,
            "repeat": _addNumberArgsToBlockList,
            "if": _addNumberArgsToBlockList
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

        // Create a block for the tree node and add the block to the blockList.
        // Each block is [block number, block descriptor, x position, y position, [connections]], where
        // the actual number of connections and the meaning of each connection varies from block type to block type.
        // For example, for a settimbre block, connection 0 is the parent or the previous sibling of the node,
        // connection 1 is the arguments of the node, connection 2 is the first child of the node, and connection 3
        // is the next sibling of the node.
        // For a pitch block, connection 0 is the parent or the previous sibling of the node, connection 1 is the 
        // first argument of the node - solfege, connection 2 is the second argument of the node - octave, and 
        // connection 3 is the next sibling of the node.
        // For a number block (always as an argument), such as a divide block, connection 0 is the node that this
        // divide is its argument (e.g. a newnote block), connection 1 is numerator, and connection 2 is denominator.
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

        // args: ["guitar"] => 
        //   [2,["voicename",{"value":"guitar"}],0,0,[1]]
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

        // args: [2] =>
        //   [5,["number",{"value":2}],0,0,[4]],
        //
        // args: [{'name': 'divide', 
        //         'args': [1,4]}] =>
        //   [5,"divide",0,0,[4,6,7]],
        //   [6,["number",{"value":1}],0,0,[5]],
        //   [7,["number",{"value":4}],0,0,[5]]
        //
        // args: [{'name': 'abs',
        //         'args': [{'name': 'neg', 
        //                   'args': [1]}]}] =>
        //   [5,"abs",0,0,[4,6,7]],
        //   [6,["neg",0,0,[5,7]],
        //   [7,["number",{"value":1}],0,0,[6]]
        function _addNumberArgsToBlockList(args, blockList, parentBlockNumber) {
            let parentConnectionArgStartIndex = 1;
            for (let arg of args) {
                let parentConnections = blockList[parentBlockNumber][4];
                parentConnections[parentConnectionArgStartIndex++] = _addNumberArgToBlockList(arg, blockList, parentBlockNumber);
            }
        }

        function _addNumberArgToBlockList(arg, blockList, parentBlockNumber) {
            let block = [];
            let blockNumber = blockList.length;
            block.push(blockNumber);
            blockList.push(block);
            if (typeof arg === 'number') {
                block.push(["number", { "value": arg }]);
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
                _addNumberArgsToBlockList(arg.args, blockList, blockNumber);
            }
            return blockNumber;
        }

        // args: ['sol', 4] =>
        //   [10,["solfege",{"value":"sol"}],1864,237,[9]],
        //   [11,["number",{"value":4}],1864,269,[9]]
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

            blockNumber = _addNumberArgToBlockList(args[1], blockList, parentBlockNumber);
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