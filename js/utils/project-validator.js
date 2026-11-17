// Copyright (c) 2026 Sugarlabs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
   globals _
*/

/* exported ProjectValidator, validateProject */

const VALIDATOR_CODES = {
    ERR_MISSING_ACTION: "ERR_MISSING_ACTION",
    ERR_ACTION_NO_NAME: "ERR_ACTION_NO_NAME",
    ERR_MISSING_ARGUMENT: "ERR_MISSING_ARGUMENT",
    WARN_DUPLICATE_ACTION: "WARN_DUPLICATE_ACTION",
    WARN_EMPTY_ACTION: "WARN_EMPTY_ACTION",
    WARN_NO_START: "WARN_NO_START",
    INFO_ORPHAN_STACK: "INFO_ORPHAN_STACK",
    INFO_UNUSED_ACTION: "INFO_UNUSED_ACTION",
    INFO_CASE_MISMATCH: "INFO_CASE_MISMATCH"
};

const ACTION_CALL_BLOCKS = [
    "do",
    "nameddo",
    "doArg",
    "nameddoArg",
    "calc",
    "namedcalc",
    "calcArg",
    "namedcalcArg"
];

const START_BLOCK_NAMES = ["start", "drum", "status", "oscilloscope"];

/**
 * Traverses forward through horizontal spacer blocks (hspace) to find
 * the actual underlying target block id.
 *
 * @param {number|null} blkId - Initial block id
 * @param {Array} blockList - The blocks list
 * @returns {number|null} The resolved block id
 */
function unwrapSpacers(blkId, blockList) {
    let curr = blkId;
    let guard = 0;
    while (
        curr !== null &&
        curr !== undefined &&
        blockList[curr] &&
        blockList[curr].name === "hspace" &&
        guard++ < 50
    ) {
        curr = blockList[curr].connections ? blockList[curr].connections[1] : null;
    }
    return curr;
}

/**
 * Extracts a literal string or number name from an argument block.
 * Returns null if the block is dynamic (e.g. box, join, expression) or empty.
 *
 * @param {number|null} blkId - Block id connected to the name dock
 * @param {Array} blockList - The blocks list
 * @returns {string|null} The literal name or null
 */
function extractLiteralName(blkId, blockList) {
    const unwrappedId = unwrapSpacers(blkId, blockList);
    if (unwrappedId === null || unwrappedId === undefined) return null;
    const blk = blockList[unwrappedId];
    if (!blk || blk.trash) return null;

    if (blk.name === "text" || blk.name === "string") {
        return typeof blk.value === "string" ? blk.value : String(blk.value ?? "");
    }
    if (blk.name === "number") {
        return String(blk.value ?? "");
    }
    if (typeof blk.isValueBlock === "function" && blk.isValueBlock()) {
        return blk.value !== undefined && blk.value !== null ? String(blk.value) : null;
    }
    return null;
}

/**
 * Determines whether a block represents a dynamic expression whose
 * value cannot be determined statically offline.
 *
 * @param {number|null} blkId - Block id
 * @param {Array} blockList - The blocks list
 * @returns {boolean} True if the argument is a dynamic expression
 */
function isDynamicBlock(blkId, blockList) {
    const unwrappedId = unwrapSpacers(blkId, blockList);
    if (unwrappedId === null || unwrappedId === undefined) return false;
    const blk = blockList[unwrappedId];
    if (!blk || blk.trash) return false;
    return blk.name !== "text" && blk.name !== "string" && blk.name !== "number";
}

/**
 * Checks whether a block is an argument/value block (non-flow command).
 *
 * @param {Object} blk - Block instance
 * @returns {boolean} True if the block is a value or parameter block
 */
function isValueOrArgBlock(blk) {
    if (!blk) return false;
    if (typeof blk.isArgBlock === "function" && blk.isArgBlock()) return true;
    if (typeof blk.isValueBlock === "function" && blk.isValueBlock()) return true;
    const style = blk.protoblock?.style;
    return style === "value" || style === "arg" || style === "twoarg";
}

/**
 * Safely formats a localized template string by replacing %s sequentially with literal strings.
 * Avoids String.prototype.replace regex special pattern parsing (e.g. $&, $1).
 *
 * @param {string} template - The message format string
 * @param {...any} args - Values to substitute into %s
 * @returns {string} The formatted message
 */
function formatMessage(template, ...args) {
    let result = template;
    for (let i = 0; i < args.length; i++) {
        result = result.replace("%s", () => String(args[i] ?? ""));
    }
    return result;
}

/**
 * Checks whether a block is the root/top of a stack.
 * Returns true if connections[0] is null/undefined or points to a non-existent/trashed parent.
 *
 * @param {Object} blk - Block instance
 * @param {Array} blockList - The blocks list
 * @returns {boolean} True if the block has no active parent connected above it
 */
function isTopBlock(blk, blockList) {
    if (!blk || blk.trash) return false;
    if (!blk.connections || blk.connections[0] === null || blk.connections[0] === undefined) {
        return true;
    }
    const parentId = blk.connections[0];
    const parent = blockList[parentId];
    return !parent || parent.trash;
}

/**
 * Performs comprehensive static sanity and consistency analysis on a Music Blocks workspace.
 *
 * @param {Object} activity - The Activity instance or an object containing `{ blocks: { blockList } }`
 * @returns {Object} Diagnostic report containing `{ summary, items }`
 */
function validateProject(activity) {
    const gettext = typeof _ === "function" ? _ : s => s;
    const emptyReport = {
        summary: { errors: 0, warnings: 0, notices: 0, totalBlocks: 0, actionCount: 0 },
        items: []
    };

    if (!activity || !activity.blocks || !Array.isArray(activity.blocks.blockList)) {
        return emptyReport;
    }

    const blockList = activity.blocks.blockList;
    const items = [];
    let totalActiveBlocks = 0;

    for (let i = 0; i < blockList.length; i++) {
        if (blockList[i] && !blockList[i].trash) {
            totalActiveBlocks++;
        }
    }

    if (totalActiveBlocks === 0) {
        return emptyReport;
    }

    // Step 1: Collect all defined action blocks and validate their definitions
    const definedActions = new Map(); // actionName -> { blockId, bodyId }
    const actionNameLowerMap = new Map(); // lowerName -> exactActionName

    for (let i = 0; i < blockList.length; i++) {
        const blk = blockList[i];
        if (!blk || blk.trash || blk.name !== "action") continue;

        const nameBlkId = blk.connections ? blk.connections[1] : null;
        const actionName = extractLiteralName(nameBlkId, blockList);

        if (actionName === null || actionName.trim() === "") {
            items.push({
                severity: "error",
                code: VALIDATOR_CODES.ERR_ACTION_NO_NAME,
                blockId: i,
                blockName: "action",
                message: gettext("Action block is missing a name.")
            });
        } else {
            if (definedActions.has(actionName)) {
                items.push({
                    severity: "warning",
                    code: VALIDATOR_DUPLICATE_ACTION(actionName, gettext).code,
                    blockId: i,
                    blockName: "action",
                    actionName: actionName,
                    message: VALIDATOR_DUPLICATE_ACTION(actionName, gettext).message
                });
            } else {
                actionNameLowerMap.set(actionName.toLowerCase(), actionName);
            }

            const bodyBlkId = blk.connections ? blk.connections[2] : null;
            const unwrappedBody = unwrapSpacers(bodyBlkId, blockList);
            if (
                unwrappedBody === null ||
                unwrappedBody === undefined ||
                !blockList[unwrappedBody] ||
                blockList[unwrappedBody].trash
            ) {
                items.push({
                    severity: "warning",
                    code: VALIDATOR_CODES.WARN_EMPTY_ACTION,
                    blockId: i,
                    blockName: "action",
                    actionName: actionName,
                    message: formatMessage(gettext('Action "%s" has an empty body.'), actionName)
                });
            }

            definedActions.set(actionName, { blockId: i, bodyId: unwrappedBody });
        }
    }

    // Step 2: Trace runnable stacks starting from hat blocks and actions
    const runnableBlockIndices = new Set();
    const markStackRunnable = startBlkId => {
        const stack = [startBlkId];
        while (stack.length > 0) {
            const id = stack.pop();
            if (id === null || id === undefined || runnableBlockIndices.has(id)) continue;
            const b = blockList[id];
            if (!b || b.trash) continue;

            runnableBlockIndices.add(id);

            if (Array.isArray(b.connections)) {
                for (let c = 0; c < b.connections.length; c++) {
                    const child = b.connections[c];
                    if (child !== null && child !== undefined && !runnableBlockIndices.has(child)) {
                        stack.push(child);
                    }
                }
            }
        }
    };

    let startCount = 0;
    for (let i = 0; i < blockList.length; i++) {
        const blk = blockList[i];
        if (!blk || blk.trash) continue;

        if (START_BLOCK_NAMES.includes(blk.name)) {
            startCount++;
            markStackRunnable(i);
        } else if (blk.name === "action") {
            markStackRunnable(i);
        }
    }

    // Step 3: Scan action calls (do, nameddo, listen, etc.) and validate targets
    const usedActions = new Set();
    let hasDynamicCalls = false;

    for (let i = 0; i < blockList.length; i++) {
        const blk = blockList[i];
        if (!blk || blk.trash) continue;

        let calledName = null;
        let isDynamic = false;

        if (ACTION_CALL_BLOCKS.includes(blk.name)) {
            if (blk.name.startsWith("named")) {
                calledName =
                    blk.privateData !== undefined && blk.privateData !== null
                        ? String(blk.privateData)
                        : null;
            } else {
                const argId = blk.connections ? blk.connections[1] : null;
                if (argId === null || argId === undefined) {
                    if (runnableBlockIndices.has(i)) {
                        items.push({
                            severity: "warning",
                            code: VALIDATOR_CODES.ERR_MISSING_ARGUMENT,
                            blockId: i,
                            blockName: blk.name,
                            argIndex: 1,
                            message: formatMessage(
                                gettext('Block "%s" is missing an input argument.'),
                                blk.name
                            )
                        });
                    }
                } else {
                    calledName = extractLiteralName(argId, blockList);
                    if (calledName === null && isDynamicBlock(argId, blockList)) {
                        isDynamic = true;
                        hasDynamicCalls = true;
                    }
                }
            }
        } else if (blk.name === "listen") {
            const argId = blk.connections ? blk.connections[2] : null;
            if (argId !== null && argId !== undefined) {
                calledName = extractLiteralName(argId, blockList);
                if (calledName === null && isDynamicBlock(argId, blockList)) {
                    isDynamic = true;
                    hasDynamicCalls = true;
                }
            }
        }

        if (calledName !== null) {
            if (calledName.trim() === "") {
                items.push({
                    severity: "error",
                    code: VALIDATOR_CODES.ERR_MISSING_ACTION,
                    blockId: i,
                    blockName: blk.name,
                    actionName: calledName,
                    message: gettext("Action name cannot be empty.")
                });
            } else {
                usedActions.add(calledName);

                if (!definedActions.has(calledName)) {
                    const suggestion = actionNameLowerMap.get(calledName.toLowerCase());
                    if (suggestion && suggestion !== calledName) {
                        items.push({
                            severity: "error",
                            code: VALIDATOR_CODES.ERR_MISSING_ACTION,
                            blockId: i,
                            blockName: blk.name,
                            actionName: calledName,
                            suggestion: suggestion,
                            message: formatMessage(
                                gettext(
                                    'Cannot find action "%s". Did you mean "%s"? Action names are case-sensitive.'
                                ),
                                calledName,
                                suggestion
                            )
                        });
                    } else {
                        items.push({
                            severity: "error",
                            code: VALIDATOR_CODES.ERR_MISSING_ACTION,
                            blockId: i,
                            blockName: blk.name,
                            actionName: calledName,
                            message: formatMessage(gettext('Cannot find action "%s".'), calledName)
                        });
                    }
                }
            }
        }
    }

    // Step 4: Check for unused actions (dead code hints)
    for (const [actName, defInfo] of definedActions.entries()) {
        if (!usedActions.has(actName)) {
            if (hasDynamicCalls) {
                items.push({
                    severity: "notice",
                    code: VALIDATOR_CODES.INFO_UNUSED_ACTION,
                    blockId: defInfo.blockId,
                    blockName: "action",
                    actionName: actName,
                    message: formatMessage(
                        gettext('Action "%s" is not called directly by name.'),
                        actName
                    )
                });
            } else {
                items.push({
                    severity: "notice",
                    code: VALIDATOR_CODES.INFO_UNUSED_ACTION,
                    blockId: defInfo.blockId,
                    blockName: "action",
                    actionName: actName,
                    message: formatMessage(
                        gettext('Action "%s" is defined but never called.'),
                        actName
                    )
                });
            }
        }
    }

    // Step 5: Check for missing arguments on runnable flow blocks
    for (const id of runnableBlockIndices) {
        const b = blockList[id];
        if (!b || b.trash || !b.protoblock) continue;

        const proto = b.protoblock;
        if (proto.args > 0 && Array.isArray(proto.dockTypes)) {
            // Socket 0 is top flow; arguments start from 1 up to proto.args
            for (let dock = 1; dock <= proto.args; dock++) {
                const dockType = proto.dockTypes[dock];
                // Non-flow argument docks typically end with "in" (e.g. numberin, textin, booleanin, anyin)
                if (dockType && dockType !== "in" && dockType !== "unavailable") {
                    const conn = b.connections ? b.connections[dock] : null;
                    if (conn === null || conn === undefined) {
                        items.push({
                            severity: "warning",
                            code: VALIDATOR_CODES.ERR_MISSING_ARGUMENT,
                            blockId: id,
                            blockName: b.name,
                            argIndex: dock,
                            message: formatMessage(
                                gettext('Block "%s" is missing an input argument.'),
                                b.name
                            )
                        });
                    }
                }
            }
        }
    }

    // Step 6: Check for orphan executable stacks (stacks without Start or Action)
    for (let i = 0; i < blockList.length; i++) {
        const blk = blockList[i];
        if (!blk || blk.trash) continue;

        // Is it the top of an unattached stack?
        if (isTopBlock(blk, blockList)) {
            if (START_BLOCK_NAMES.includes(blk.name) || blk.name === "action") {
                continue;
            }

            // Exclude single unconnected argument/value blocks (loose numbers, pitches, etc.)
            if (isValueOrArgBlock(blk)) {
                continue;
            }

            items.push({
                severity: "notice",
                code: VALIDATOR_CODES.INFO_ORPHAN_STACK,
                blockId: i,
                blockName: blk.name,
                message: formatMessage(
                    gettext(
                        'Stack starting with "%s" has no Start or Action block and will not execute.'
                    ),
                    blk.name
                )
            });
        }
    }

    // Step 7: Check if project has executable blocks but no Start block
    if (startCount === 0 && totalActiveBlocks > 0) {
        let hasExecutable = false;
        for (let i = 0; i < blockList.length; i++) {
            const b = blockList[i];
            if (b && !b.trash && !isValueOrArgBlock(b)) {
                hasExecutable = true;
                break;
            }
        }

        if (hasExecutable) {
            items.push({
                severity: "warning",
                code: VALIDATOR_CODES.WARN_NO_START,
                blockId: null,
                blockName: null,
                message: gettext("No Start block found. Click Run will not start automatically.")
            });
        }
    }

    // Calculate summary statistics
    let errCount = 0;
    let warnCount = 0;
    let noticeCount = 0;

    for (let i = 0; i < items.length; i++) {
        const sev = items[i].severity;
        if (sev === "error") errCount++;
        else if (sev === "warning") warnCount++;
        else if (sev === "notice") noticeCount++;
    }

    return {
        summary: {
            errors: errCount,
            warnings: warnCount,
            notices: noticeCount,
            totalBlocks: totalActiveBlocks,
            actionCount: definedActions.size
        },
        items: items
    };
}

/**
 * Helper to format duplicate action warning.
 * @private
 */
function VALIDATOR_DUPLICATE_ACTION(actionName, gettext) {
    return {
        code: VALIDATOR_CODES.WARN_DUPLICATE_ACTION,
        message: formatMessage(
            gettext('Action "%s" is defined multiple times. Only one will run.'),
            actionName
        )
    };
}

const ProjectValidator = {
    CODES: VALIDATOR_CODES,
    validateProject: validateProject
};

if (typeof window !== "undefined") {
    window.ProjectValidator = ProjectValidator;
    window.validateProject = validateProject;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        ProjectValidator,
        validateProject,
        VALIDATOR_CODES
    };
}
