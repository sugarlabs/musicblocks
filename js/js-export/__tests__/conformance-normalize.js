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

const JSInterface = require("../interface");

/**
 * Technical Rationale for Normalization:
 *
 * Preserved semantic fields:
 * - Block type (`name`): identifies what command, expression, or container is being executed.
 * - Statement ordering: execution sequence of blocks within a flow.
 * - Nested hierarchy (`body`, `elseBody`): scopes inside clamps (loops, notes, conditions).
 * - Argument trees (`args`): subexpressions, operator nesting, operand types and literal values.
 * - Literal values (`value`): numbers, text strings, note names, solfege syllables, booleans.
 * - Variables / boxes: box names and variable bindings (`namedbox`, `storein2`).
 * - Actions: action definitions, action names, parameters, and action invocations (`nameddo`).
 * - Pitch representations: note-names, accidentals, octaves, and computed pitch expressions.
 * - Control flow structures: conditionals, repetitions, switches, cases, default cases, stops.
 *
 * Intentionally ignored non-semantic fields:
 * - `id`: arbitrary sequential integer indices used for flat array graph references.
 * - `x, y`: screen pixel coordinates used only for visual positioning on the 2D canvas.
 * - `vspace`, `hspace`, `hidden`: visual spacer blocks inserted for canvas aesthetics.
 * - UI visual state like `collapsed`: display presentation flags with no runtime semantics.
 * - Canonicalization of beginner `do` with string literal: mapped to canonical action call.
 */

/**
 * Extracts normalized block name and value/privateData from a block entry.
 *
 * @param {*} nameInfo - The second element of a block array entry
 * @returns {{ name: string, value: *, privateData: * }}
 */
function parseBlockNameInfo(nameInfo) {
    if (Array.isArray(nameInfo)) {
        const name = nameInfo[0];
        let value = null;
        let privateData = null;

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
        return { name, value, privateData };
    }

    return { name: nameInfo, value: null, privateData: null };
}

/**
 * Builds an index of blocks from a blockList array, skipping invalid entries.
 *
 * @param {Array} blockList - Music Blocks block representation
 * @returns {Map<number, Object>} Map from block ID to block data
 */
function indexBlockList(blockList) {
    const blocksById = new Map();
    if (!Array.isArray(blockList)) {
        return blocksById;
    }

    for (let i = 0; i < blockList.length; i++) {
        const item = blockList[i];
        if (!Array.isArray(item) || item.length < 5) {
            continue;
        }
        const id = item[0];
        const { name, value, privateData } = parseBlockNameInfo(item[1]);
        const connections = Array.isArray(item[4]) ? item[4].slice() : [];

        blocksById.set(id, {
            id,
            name,
            value,
            privateData,
            connections
        });
    }

    return blocksById;
}

/**
 * Normalizes an argument expression docked to a block connection.
 * Recursively follows argument trees while skipping horizontal spacers.
 *
 * @param {number|null} blockId - ID of docked argument block
 * @param {Map<number, Object>} blocksById - Index of all blocks
 * @returns {Object|null} Normalized argument node
 */
function normalizeArgumentNode(blockId, blocksById) {
    if (blockId === null || blockId === undefined) {
        return null;
    }
    let block = blocksById.get(blockId);
    if (!block) {
        return null;
    }

    // Skip horizontal spacers
    while (block.name === "hspace") {
        const nextId = block.connections[1];
        if (nextId === null || nextId === undefined) {
            return null;
        }
        block = blocksById.get(nextId);
        if (!block) {
            return null;
        }
    }

    // Value blocks: literals, box references, getters
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
        ].includes(block.name) ||
        JSInterface.isGetter(block.name) ||
        JSInterface.methodReturns(block.name)
    ) {
        const node = { name: block.name };
        if (block.name === "boolean") {
            node.value = block.value === true || block.value === "true";
        } else if (block.name === "number") {
            const rawVal =
                block.value !== null && block.value !== undefined ? block.value : block.privateData;
            node.value =
                typeof rawVal === "number"
                    ? rawVal
                    : !isNaN(Number(rawVal))
                      ? Number(rawVal)
                      : rawVal;
        } else if (block.value !== null && block.value !== undefined) {
            node.value = block.value;
        } else if (block.privateData !== null && block.privateData !== undefined) {
            node.value = block.privateData;
        }
        return node;
    }

    // Expression / operator blocks: plus, minus, divide, equal, etc.
    const argNodes = [];
    // Argument docks start at connections[1]
    for (let c = 1; c < block.connections.length; c++) {
        const childNode = normalizeArgumentNode(block.connections[c], blocksById);
        if (childNode !== null) {
            argNodes.push(childNode);
        }
    }

    // Canonicalize unary negation of constant numeric literal:
    // In ECMAScript AST, negative literals (e.g. -15) are UnaryExpression('-', 15),
    // which AST2BlockList reconstructs as a 'neg' block wrapping a 'number' block.
    // Semantically and structurally, neg(number(N)) is identical to number(-N).
    if (
        block.name === "neg" &&
        argNodes.length === 1 &&
        argNodes[0].name === "number" &&
        typeof argNodes[0].value === "number"
    ) {
        return {
            name: "number",
            value: -argNodes[0].value
        };
    }

    const node = { name: block.name };
    if (block.value !== null && block.value !== undefined) {
        node.value = block.value;
    }
    if (argNodes.length > 0) {
        node.args = argNodes;
    }
    return node;
}

/**
 * Normalizes a sequence of statements connected vertically in a stack or clamp.
 *
 * @param {number|null} startBlockId - ID of the first statement block
 * @param {Map<number, Object>} blocksById - Index of all blocks
 * @returns {Array<Object>} Normalized statements
 */
function normalizeStatementSequence(startBlockId, blocksById) {
    const statements = [];
    let currentId = startBlockId;

    while (currentId !== null && currentId !== undefined) {
        const block = blocksById.get(currentId);
        if (!block) {
            break;
        }

        // Advance past non-executable layout spacers
        if (block.name === "hidden" || block.name === "vspace") {
            currentId =
                block.connections.length > 0
                    ? block.connections[block.connections.length - 1]
                    : null;
            continue;
        }

        const stmtNode = { name: block.name };

        // Beginner "do" block with text slot: normalize to canonical action call
        if (block.name === "do") {
            const nameArg = normalizeArgumentNode(block.connections[1], blocksById);
            stmtNode.name = "nameddo";
            stmtNode.actionName = nameArg && nameArg.value ? String(nameArg.value) : null;
            currentId =
                block.connections.length > 0
                    ? block.connections[block.connections.length - 1]
                    : null;
            statements.push(stmtNode);
            continue;
        }

        if (block.name === "nameddo" || block.name === "nameddoArg") {
            stmtNode.actionName = block.privateData || block.value || null;
        } else if (block.name === "storein2") {
            stmtNode.variable = block.privateData || block.value || null;
        } else if (block.value !== null && block.value !== undefined) {
            stmtNode.value = block.value;
        }

        // Clamp blocks: repeat, forever, newnote, switch, etc.
        const isDoubleClamp = block.name === "if" || block.name === "ifthenelse";
        const isClamp =
            !isDoubleClamp &&
            (JSInterface.isClampBlock(block.name) ||
                [
                    "repeat",
                    "forever",
                    "while",
                    "until",
                    "switch",
                    "case",
                    "defaultcase",
                    "sandwichclamp"
                ].includes(block.name));

        if (isDoubleClamp) {
            // connections: [parent, conditionArg, thenChild, elseChild, next]
            const condition = normalizeArgumentNode(block.connections[1], blocksById);
            if (condition) {
                stmtNode.condition = condition;
            }
            stmtNode.body = normalizeStatementSequence(block.connections[2], blocksById);
            stmtNode.elseBody = normalizeStatementSequence(block.connections[3], blocksById);
        } else if (isClamp) {
            // For clamp blocks with arguments (e.g. repeat, newnote, switch, case)
            // connections: [parent, ...args, childFlow, next]
            const childIdx = block.connections.length - 2;
            const args = [];
            for (let a = 1; a < childIdx; a++) {
                const argNode = normalizeArgumentNode(block.connections[a], blocksById);
                if (argNode) {
                    args.push(argNode);
                }
            }
            if (args.length > 0) {
                stmtNode.args = args;
            }
            stmtNode.body = normalizeStatementSequence(block.connections[childIdx], blocksById);
        } else {
            // General command blocks: arguments are between parent (0) and next (last)
            const numArgs = Math.max(0, block.connections.length - 2);
            const args = [];
            for (let a = 1; a <= numArgs; a++) {
                const argNode = normalizeArgumentNode(block.connections[a], blocksById);
                if (argNode) {
                    args.push(argNode);
                }
            }
            if (args.length > 0) {
                stmtNode.args = args;
            }
        }

        statements.push(stmtNode);
        currentId =
            block.connections.length > 0 ? block.connections[block.connections.length - 1] : null;
    }

    return statements;
}

/**
 * Normalizes an entire Music Blocks block representation into a deterministic,
 * canonical semantic structure for structural comparison.
 *
 * @param {Array} blockList - Music Blocks internal block list representation
 * @returns {{ start: Array<Array<Object>>, actions: Array<Object> }}
 */
function normalizeBlockStructure(blockList) {
    const blocksById = indexBlockList(blockList);
    const startStacks = [];
    const actionStacks = [];

    // Find all start and action roots
    for (const [, block] of blocksById) {
        if (block.connections[0] === null || block.connections[0] === undefined) {
            if (block.name === "start") {
                // start stack begins at connections[1]
                const stmts = normalizeStatementSequence(block.connections[1], blocksById);
                startStacks.push(stmts);
            } else if (block.name === "action") {
                // action name is docked at connections[1], body at connections[2]
                const nameNode = normalizeArgumentNode(block.connections[1], blocksById);
                const actionName = nameNode && nameNode.value ? String(nameNode.value) : "unnamed";
                const body = normalizeStatementSequence(block.connections[2], blocksById);
                actionStacks.push({
                    name: actionName,
                    body
                });
            }
        }
    }

    // Sort action stacks deterministically by action name
    actionStacks.sort((a, b) => a.name.localeCompare(b.name));

    return {
        start: startStacks,
        actions: actionStacks
    };
}

module.exports = {
    parseBlockNameInfo,
    indexBlockList,
    normalizeArgumentNode,
    normalizeStatementSequence,
    normalizeBlockStructure
};
