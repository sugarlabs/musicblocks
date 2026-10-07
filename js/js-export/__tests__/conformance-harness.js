/**
 * MusicBlocks v3.8.0
 *
 * @author Music Blocks Contributors
 *
 * @copyright 2026 Music Blocks Contributors
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

const fs = require("fs");
const path = require("path");
const acorn = require("../../../lib/acorn.min");
const astring = require("../../../lib/astring.min");
const { AST2BlockList } = require("../ast2blocklist");
const { JSGenerate } = require("../generate");
const JSInterface = require("../interface");
const ASTUtils = require("../ASTutils");

// Load the ast2blocks config
const configPath = path.join(__dirname, "..", "ast2blocks.json");
const configContent = fs.readFileSync(configPath, "utf8");
const ast2blocksConfig = JSON.parse(configContent);

/**
 * Returns protoblock metadata (style and args count) required by JSGenerate
 * for a block name and its connection dock count.
 *
 * @param {string} name - Block name
 * @param {number} [connectionsLength] - Length of block's connection array
 * @returns {{ style: string, args: number }}
 */
function resolveProtoBlock(name, connectionsLength = 0) {
    if (name === "start") {
        return { style: "hat", args: 0 };
    }
    if (name === "action") {
        return { style: "hat", args: 1 };
    }
    if (name === "ifthenelse") {
        return {
            style: "doubleclamp",
            args: connectionsLength > 0 ? connectionsLength - 2 : 3
        };
    }
    if (name === "if") {
        return {
            style: "clamp",
            args: connectionsLength > 0 ? connectionsLength - 2 : 2
        };
    }
    if (
        JSInterface.isClampBlock(name) ||
        [
            "repeat",
            "forever",
            "while",
            "until",
            "switch",
            "case",
            "defaultcase",
            "sandwichclamp"
        ].includes(name)
    ) {
        const numArgs = ["forever", "defaultcase", "tie"].includes(name)
            ? 0
            : name === "newswing2"
              ? 2
              : 1;
        return { style: "clamp", args: numArgs + 1 };
    }
    if (
        [
            "number",
            "text",
            "string",
            "boolean",
            "notename",
            "solfege",
            "voicename",
            "drumname",
            "namedbox",
            "namedarg",
            "box"
        ].includes(name) ||
        JSInterface.isGetter(name) ||
        JSInterface.methodReturns(name)
    ) {
        return { style: "value", args: 0 };
    }
    if (
        [
            "plus",
            "minus",
            "multiply",
            "divide",
            "mod",
            "equal",
            "not_equal_to",
            "less",
            "greater",
            "less_than_or_equal_to",
            "greater_than_or_equal_to",
            "and",
            "or",
            "xor"
        ].includes(name)
    ) {
        return { style: "arg", args: 2 };
    }
    if (["not", "sqrt", "abs", "int", "round", "sin", "cos", "tan"].includes(name)) {
        return { style: "arg", args: 1 };
    }
    if (name === "pitch") {
        return { style: "command", args: 2 };
    }
    if (name === "storein2" || name === "nameddoArg") {
        return { style: "command", args: 1 };
    }
    if (name === "nameddo" || name === "break") {
        return { style: "command", args: 0 };
    }
    return {
        style: "command",
        args: connectionsLength > 0 ? Math.max(0, connectionsLength - 2) : 1
    };
}

/**
 * Ensures global test environment has all necessary modules wired up for
 * JSGenerate and AST2BlockList execution.
 */
function setupEnvironment() {
    if (typeof global.window === "undefined") {
        global.window = {};
    }
    if (typeof global._ === "undefined") {
        global._ = x => x;
    }
    if (typeof global.last === "undefined") {
        global.last = arr => (arr && arr.length > 0 ? arr[arr.length - 1] : undefined);
    }
    global.JSInterface = JSInterface;
    global.ASTUtils = ASTUtils;
    global.astring = astring;

    if (!global.window.BooleanBlock) {
        global.window.BooleanBlock = class BooleanBlock {};
    }
}

/**
 * Loads a blockList array into the globalActivity.blocks data structure
 * so that production JSGenerate can process it.
 *
 * @param {Array} blockList - Music Blocks internal block list representation
 * @param {Object} [activity] - Target activity instance (defaults to global.globalActivity)
 */
function loadBlockListIntoActivity(blockList, activity) {
    setupEnvironment();

    const targetActivity = activity || {
        blocks: {
            stackList: [],
            blockList: {},
            findStacks() {
                this.stackList = [];
                for (const key of Object.keys(this.blockList)) {
                    const blk = this.blockList[key];
                    if (blk && !blk.trash && blk.connections && blk.connections[0] === null) {
                        this.stackList.push(Number(key));
                    }
                }
            }
        }
    };

    targetActivity.blocks.blockList = {};
    targetActivity.blocks.stackList = [];

    for (let i = 0; i < blockList.length; i++) {
        const item = blockList[i];
        const id = item[0];
        const nameInfo = item[1];
        const connections = Array.isArray(item[4]) ? item[4].slice() : [];

        let name;
        let value = null;
        let privateData = null;

        if (Array.isArray(nameInfo)) {
            name = nameInfo[0];
            if (nameInfo[1] && typeof nameInfo[1] === "object") {
                value = nameInfo[1].value !== undefined ? nameInfo[1].value : null;
                privateData =
                    nameInfo[1].value !== undefined
                        ? nameInfo[1].value
                        : nameInfo[1].text !== undefined
                          ? nameInfo[1].text
                          : null;
            } else if (typeof nameInfo[1] === "string" || typeof nameInfo[1] === "number") {
                value = nameInfo[1];
                privateData = String(nameInfo[1]);
            }
        } else {
            name = nameInfo;
        }

        const proto = resolveProtoBlock(name, connections.length);
        let protoblockObj;

        if (name === "boolean" && global.window.BooleanBlock) {
            protoblockObj = new global.window.BooleanBlock();
            protoblockObj.style = proto.style;
            protoblockObj.args = proto.args;
            protoblockObj._style = { flows: { left: false } };
        } else {
            protoblockObj = {
                style: proto.style,
                args: proto.args,
                _style: { flows: { left: false } }
            };
        }

        targetActivity.blocks.blockList[id] = {
            name,
            value,
            privateData,
            connections,
            trash: false,
            protoblock: protoblockObj
        };
    }

    targetActivity.blocks.findStacks();
    global.globalActivity = targetActivity;
    return targetActivity;
}

/**
 * Exports a Music Blocks block representation to JavaScript using the actual
 * production JSGenerate exporter.
 *
 * @param {Array} blockList - Music Blocks block representation
 * @returns {string} Generated JavaScript source code
 */
function exportBlocksToJS(blockList) {
    loadBlockListIntoActivity(blockList);
    JSGenerate.run(false, false);
    if (JSGenerate.generateFailed) {
        throw new Error("JSGenerate failed to export block program to JavaScript");
    }
    return JSGenerate.code;
}

/**
 * Imports JavaScript source code back into a Music Blocks block representation
 * using the actual production AST2BlockList importer.
 *
 * @param {string} code - JavaScript source code
 * @param {Object} [config] - Conversion config (defaults to ast2blocks.json)
 * @returns {Array} Recovered Music Blocks block representation
 */
function importJSToBlocks(code, config = ast2blocksConfig) {
    setupEnvironment();
    const ast = acorn.parse(code, { ecmaVersion: 2020 });
    return AST2BlockList.toBlockList(ast, config);
}

/**
 * Runs a complete block -> JS -> block round trip on a Music Blocks program.
 *
 * @param {Array} blockList - Original Music Blocks block representation
 * @returns {{ originalBlocks: Array, code: string, recoveredBlocks: Array }}
 */
function runRoundTrip(blockList) {
    const code = exportBlocksToJS(blockList);
    const recoveredBlocks = importJSToBlocks(code);
    return {
        originalBlocks: blockList,
        code,
        recoveredBlocks
    };
}

module.exports = {
    ast2blocksConfig,
    resolveProtoBlock,
    setupEnvironment,
    loadBlockListIntoActivity,
    exportBlocksToJS,
    importJSToBlocks,
    runRoundTrip
};
