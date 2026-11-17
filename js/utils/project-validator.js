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
    ERR_ZERO_DIVISION: "ERR_ZERO_DIVISION",
    ERR_INVALID_NOTE_VALUE: "ERR_INVALID_NOTE_VALUE",
    ERR_INVALID_BPM: "ERR_INVALID_BPM",
    ERR_INVALID_METER: "ERR_INVALID_METER",
    ERR_INVALID_PITCH: "ERR_INVALID_PITCH",
    WARN_DUPLICATE_ACTION: "WARN_DUPLICATE_ACTION",
    WARN_EMPTY_ACTION: "WARN_EMPTY_ACTION",
    WARN_EMPTY_NOTE: "WARN_EMPTY_NOTE",
    WARN_INVALID_MODE: "WARN_INVALID_MODE",
    WARN_OUT_OF_RANGE: "WARN_OUT_OF_RANGE",
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

const VALID_SOLFEGE_ROOTS = new Set([
    "do",
    "re",
    "mi",
    "fa",
    "so",
    "sol",
    "la",
    "ti",
    "si",
    "di",
    "ri",
    "fi",
    "li",
    "ra",
    "me",
    "se",
    "le",
    "te",
    "sa",
    "ga",
    "ma",
    "pa",
    "dha",
    "ni",
    "ut"
]);

const VALID_LETTER_ROOTS = new Set(["a", "b", "c", "d", "e", "f", "g"]);

const VALID_MUSICAL_MODES = new Set([
    "major",
    "minor",
    "natural minor",
    "harmonic minor",
    "melodic minor",
    "harmonic major",
    "dorian",
    "phrygian",
    "lydian",
    "mixolydian",
    "locrian",
    "chromatic",
    "algerian",
    "diminished",
    "spanish",
    "octatonic",
    "bebop",
    "arabic",
    "byzantine",
    "enigmatic",
    "hindu",
    "hungarian",
    "romanian minor",
    "spanish gypsy",
    "minor blues",
    "major blues",
    "whole tone",
    "major pentatonic",
    "minor pentatonic",
    "pentatonic",
    "chinese",
    "egyptian",
    "hirajoshi",
    "in",
    "fibonacci",
    "alt pentatonic",
    "ionian",
    "aeolian",
    "ethiopian",
    "geez",
    "jazz minor",
    "maqam",
    "minyo",
    "custom"
]);

/**
 * Traverses forward through horizontal or vertical spacer blocks (hspace, vspace)
 * to find the actual underlying target block id.
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
        (blockList[curr].name === "hspace" || blockList[curr].name === "vspace") &&
        guard++ < 50
    ) {
        curr = blockList[curr].connections ? blockList[curr].connections[1] : null;
    }
    return curr;
}

/**
 * Checks whether a block is a visual spacer or terminal clamp sentinel.
 *
 * @param {Object} blk - Block instance
 * @returns {boolean} True if the block is a spacer or terminal sentinel
 */
function isSpacerOrSentinel(blk) {
    if (!blk) return false;
    return (
        blk.name === "hspace" ||
        blk.name === "vspace" ||
        blk.name === "hidden" ||
        blk.name === "hiddennoflow"
    );
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

    if (
        blk.name === "text" ||
        blk.name === "string" ||
        blk.name === "solfege" ||
        blk.name === "notename" ||
        blk.name === "modename"
    ) {
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
 * Extracts a literal numeric value from an argument block, including division expressions (e.g. 1 / 4).
 * Returns null if the block is dynamic, empty, or cannot be evaluated statically.
 *
 * @param {number|null} blkId - Block id connected to the dock
 * @param {Array} blockList - The blocks list
 * @returns {number|null} Evaluated numeric value or null
 */
function extractLiteralNumber(blkId, blockList) {
    const unwrappedId = unwrapSpacers(blkId, blockList);
    if (unwrappedId === null || unwrappedId === undefined) return null;
    const blk = blockList[unwrappedId];
    if (!blk || blk.trash) return null;

    if (blk.name === "number") {
        const val = Number(blk.value);
        return Number.isFinite(val) ? val : null;
    }
    if (blk.name === "text" || blk.name === "string") {
        const val = Number(blk.value);
        return Number.isFinite(val) ? val : null;
    }
    if (typeof blk.isValueBlock === "function" && blk.isValueBlock()) {
        const val = Number(blk.value);
        return Number.isFinite(val) ? val : null;
    }
    if (blk.name === "divide" && Array.isArray(blk.connections)) {
        const num = extractLiteralNumber(blk.connections[1], blockList);
        const den = extractLiteralNumber(blk.connections[2], blockList);
        if (num !== null && den !== null && den !== 0) {
            return num / den;
        }
    }
    return null;
}

/**
 * Determines whether a given pitch identifier is valid in Music Blocks.
 * Recognizes solfege names (diatonic, chromatic, East Indian), letter note names (A-G with accidentals),
 * numeric pitches/scale degrees/frequencies, and rest notations.
 *
 * @param {any} val - Value to validate
 * @returns {boolean} True if the value is a recognized pitch
 */
function isValidPitchName(val) {
    if (val === null || val === undefined) return false;
    const str = String(val).trim();
    if (!str) return false;

    // Check rest notation
    const lower = str.toLowerCase();
    if (lower === "rest" || lower === "r") return true;

    // Pure numeric pitch (scale degree, temperament step, or frequency)
    const num = Number(str);
    if (Number.isFinite(num)) {
        return num > 0 && num <= 20000;
    }

    // Strip microtonal prefix: ^, ^^, v, vv, \, /
    const clean = lower.replace(/^[\^v\\/]+/, "");
    if (!clean) return false;

    // Check letter note names with optional accidentals and octave: e.g. C, Bb, F#4, Cx, Bbb-1
    const letterMatch = clean.match(/^([a-g])([#b♭♯𝄪𝄫x*]|bb|##|♭♭|♯♯)*(-?\d+)?$/u);
    if (letterMatch) {
        return true;
    }

    // Check solfege names with optional accidentals and octave: e.g. do, sol#, la4, ti♭
    const solfegeMatch = clean.match(/^([a-z]+?)([#b♭♯𝄪𝄫x*]|bb|##|♭♭|♯♯)*(-?\d+)?$/u);
    if (solfegeMatch && VALID_SOLFEGE_ROOTS.has(solfegeMatch[1])) {
        return true;
    }

    // Scale degree number with accidental e.g. "1#", "7b", "4♯"
    const degreeMatch = clean.match(/^(\d+)([#b♭♯𝄪𝄫x*]|bb|##|♭♭|♯♯)*$/u);
    if (degreeMatch) {
        const degree = Number(degreeMatch[1]);
        return degree > 0 && degree <= 57;
    }

    return false;
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
    const literalBlocks = [
        "text",
        "string",
        "number",
        "solfege",
        "notename",
        "modename",
        "scaledegree",
        "scaledegree2"
    ];
    return !literalBlocks.includes(blk.name);
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
    if (style === "value" || style === "arg") return true;
    if (style === "twoarg") {
        const outDock = blk.protoblock?.dockTypes?.[0];
        if (outDock && outDock !== "out") {
            return true;
        }
    }
    const valBlockNames = [
        "number",
        "text",
        "string",
        "solfege",
        "notename",
        "modename",
        "scaledegree",
        "scaledegree2"
    ];
    if (valBlockNames.includes(blk.name)) return true;
    return false;
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
    const reportedMissingArgs = new Set();
    const addMissingArgWarning = (blockId, blockName, argIndex) => {
        const key = `${blockId}:${argIndex}`;
        if (reportedMissingArgs.has(key)) return;
        reportedMissingArgs.add(key);
        items.push({
            severity: "warning",
            code: VALIDATOR_CODES.ERR_MISSING_ARGUMENT,
            blockId: blockId,
            blockName: blockName,
            argIndex: argIndex,
            message: formatMessage(gettext('Block "%s" is missing an input argument.'), blockName)
        });
    };
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
            const isBodyEmpty =
                unwrappedBody === null ||
                unwrappedBody === undefined ||
                !blockList[unwrappedBody] ||
                blockList[unwrappedBody].trash ||
                blockList[unwrappedBody].name === "hidden" ||
                blockList[unwrappedBody].name === "hiddennoflow";

            if (isBodyEmpty) {
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
                        addMissingArgWarning(i, blk.name, 1);
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

    // Step 5: Check for missing arguments & runtime hazards on runnable blocks
    for (const id of runnableBlockIndices) {
        const b = blockList[id];
        if (!b || b.trash) continue;

        // Check for static division/modulo by zero
        if (b.name === "divide" || b.name === "mod") {
            const divisorId = b.connections ? b.connections[2] : null;
            const divisorVal = extractLiteralNumber(divisorId, blockList);
            if (divisorVal !== null && divisorVal === 0) {
                items.push({
                    severity: "error",
                    code: VALIDATOR_CODES.ERR_ZERO_DIVISION,
                    blockId: id,
                    blockName: b.name,
                    message: formatMessage(gettext('Block "%s" divides by zero.'), b.name)
                });
            }
        }

        // Check for note block duration & empty note clamp body
        if (b.name === "newnote" || b.name === "note") {
            const durationId = b.connections ? b.connections[1] : null;
            const durationVal = extractLiteralNumber(durationId, blockList);
            if (durationVal !== null && durationVal <= 0) {
                items.push({
                    severity: "error",
                    code: VALIDATOR_CODES.ERR_INVALID_NOTE_VALUE,
                    blockId: id,
                    blockName: b.name,
                    message: gettext("Note value must be greater than 0.")
                });
            }

            const bodyId = b.connections ? b.connections[2] : null;
            const unwrappedBody = unwrapSpacers(bodyId, blockList);
            const isNoteBodyEmpty =
                unwrappedBody === null ||
                unwrappedBody === undefined ||
                !blockList[unwrappedBody] ||
                blockList[unwrappedBody].trash ||
                blockList[unwrappedBody].name === "hidden" ||
                blockList[unwrappedBody].name === "hiddennoflow";

            if (isNoteBodyEmpty) {
                items.push({
                    severity: "warning",
                    code: VALIDATOR_CODES.WARN_EMPTY_NOTE,
                    blockId: id,
                    blockName: b.name,
                    message: gettext("Note block has no pitch or drum inside.")
                });
            }
        }

        // Check BPM / Tempo blocks
        if (
            b.name === "setmasterbpm2" ||
            b.name === "setmasterbpm" ||
            b.name === "setbpm3" ||
            b.name === "setbpm2" ||
            b.name === "setbpm"
        ) {
            const bpmId = b.connections ? b.connections[1] : null;
            const bpmVal = extractLiteralNumber(bpmId, blockList);
            if (bpmVal !== null) {
                if (bpmVal <= 0) {
                    items.push({
                        severity: "error",
                        code: VALIDATOR_CODES.ERR_INVALID_BPM,
                        blockId: id,
                        blockName: b.name,
                        message: gettext("BPM must be a positive number.")
                    });
                } else if (bpmVal < 30 || bpmVal > 1000) {
                    items.push({
                        severity: "warning",
                        code: VALIDATOR_CODES.WARN_OUT_OF_RANGE,
                        blockId: id,
                        blockName: b.name,
                        value: bpmVal,
                        message: formatMessage(
                            gettext("BPM %s is out of standard tempo range (30 to 1000)."),
                            bpmVal
                        )
                    });
                }
            }

            if (b.name === "setmasterbpm2" || b.name === "setbpm3") {
                const beatId = b.connections ? b.connections[2] : null;
                const beatVal = extractLiteralNumber(beatId, blockList);
                if (beatVal !== null && beatVal <= 0) {
                    items.push({
                        severity: "error",
                        code: VALIDATOR_CODES.ERR_INVALID_BPM,
                        blockId: id,
                        blockName: b.name,
                        message: gettext("Beat value must be a positive number.")
                    });
                }
            }
        }

        // Check meter (time signature)
        if (b.name === "meter") {
            const countId = b.connections ? b.connections[1] : null;
            const countVal = extractLiteralNumber(countId, blockList);
            if (countVal !== null && countVal <= 0) {
                items.push({
                    severity: "error",
                    code: VALIDATOR_CODES.ERR_INVALID_METER,
                    blockId: id,
                    blockName: b.name,
                    message: gettext("Beats per measure must be a positive number.")
                });
            }

            const beatValId = b.connections ? b.connections[2] : null;
            const beatVal = extractLiteralNumber(beatValId, blockList);
            if (beatVal !== null && beatVal <= 0) {
                items.push({
                    severity: "error",
                    code: VALIDATOR_CODES.ERR_INVALID_METER,
                    blockId: id,
                    blockName: b.name,
                    message: gettext("Beat value must be a positive number.")
                });
            }
        }

        // Check pitch block
        if (b.name === "pitch") {
            const pitchNameId = b.connections ? b.connections[1] : null;
            const pitchNameVal = extractLiteralName(pitchNameId, blockList);
            if (
                pitchNameVal !== null &&
                !isDynamicBlock(pitchNameId, blockList) &&
                !isValidPitchName(pitchNameVal)
            ) {
                items.push({
                    severity: "error",
                    code: VALIDATOR_CODES.ERR_INVALID_PITCH,
                    blockId: id,
                    blockName: b.name,
                    pitchName: pitchNameVal,
                    message: formatMessage(gettext('"%s" is not a valid pitch name.'), pitchNameVal)
                });
            }

            const octaveId = b.connections ? b.connections[2] : null;
            const octaveVal = extractLiteralNumber(octaveId, blockList);
            if (octaveVal !== null && (octaveVal < 0 || octaveVal > 9)) {
                items.push({
                    severity: "warning",
                    code: VALIDATOR_CODES.WARN_OUT_OF_RANGE,
                    blockId: id,
                    blockName: b.name,
                    value: octaveVal,
                    message: formatMessage(
                        gettext("Octave %s is out of standard audible range (0 to 9)."),
                        octaveVal
                    )
                });
            }
        }

        // Check setkey2 block (key and mode)
        if (b.name === "setkey2") {
            const keyId = b.connections ? b.connections[1] : null;
            const keyVal = extractLiteralName(keyId, blockList);
            if (keyVal !== null && !isDynamicBlock(keyId, blockList) && !isValidPitchName(keyVal)) {
                items.push({
                    severity: "error",
                    code: VALIDATOR_CODES.ERR_INVALID_PITCH,
                    blockId: id,
                    blockName: b.name,
                    pitchName: keyVal,
                    message: formatMessage(gettext('"%s" is not a valid pitch name.'), keyVal)
                });
            }

            const modeId = b.connections ? b.connections[2] : null;
            const modeVal = extractLiteralName(modeId, blockList);
            if (modeVal !== null && !isDynamicBlock(modeId, blockList) && modeVal.trim() !== "") {
                const lowerMode = modeVal.trim().toLowerCase();
                if (!VALID_MUSICAL_MODES.has(lowerMode)) {
                    items.push({
                        severity: "warning",
                        code: VALIDATOR_CODES.WARN_INVALID_MODE,
                        blockId: id,
                        blockName: b.name,
                        modeName: modeVal,
                        message: formatMessage(
                            gettext(
                                'Mode "%s" is not recognized. Music Blocks will default to major.'
                            ),
                            modeVal
                        )
                    });
                }
            }
        }

        // Check volume blocks: setnotevolume, setsynthvolume, setsynthvolume2
        if (b.name === "setnotevolume") {
            const volId = b.connections ? b.connections[1] : null;
            const volVal = extractLiteralNumber(volId, blockList);
            if (volVal !== null && (volVal < 0 || volVal > 100)) {
                items.push({
                    severity: "warning",
                    code: VALIDATOR_CODES.WARN_OUT_OF_RANGE,
                    blockId: id,
                    blockName: b.name,
                    value: volVal,
                    message: formatMessage(
                        gettext("Volume %s is out of range (expected 0 to 100)."),
                        volVal
                    )
                });
            }
        } else if (b.name === "setsynthvolume" || b.name === "setsynthvolume2") {
            const volId = b.connections ? b.connections[2] : null;
            const volVal = extractLiteralNumber(volId, blockList);
            if (volVal !== null && (volVal < 0 || volVal > 100)) {
                items.push({
                    severity: "warning",
                    code: VALIDATOR_CODES.WARN_OUT_OF_RANGE,
                    blockId: id,
                    blockName: b.name,
                    value: volVal,
                    message: formatMessage(
                        gettext("Volume %s is out of range (expected 0 to 100)."),
                        volVal
                    )
                });
            }
        }

        // Check scalar interval
        if (b.name === "interval") {
            const intId = b.connections ? b.connections[1] : null;
            const intVal = extractLiteralNumber(intId, blockList);
            if (intVal !== null && (intVal < -63 || intVal > 69)) {
                items.push({
                    severity: "warning",
                    code: VALIDATOR_CODES.WARN_OUT_OF_RANGE,
                    blockId: id,
                    blockName: b.name,
                    value: intVal,
                    message: formatMessage(
                        gettext("Scalar interval %s must be within -63 to 69."),
                        intVal
                    )
                });
            }
        }

        const proto = b.protoblock;
        if (proto && proto.args > 0 && Array.isArray(proto.dockTypes)) {
            // Socket 0 is top flow; arguments start from 1 up to proto.args
            for (let dock = 1; dock <= proto.args; dock++) {
                const dockType = proto.dockTypes[dock];
                // Non-flow argument docks typically end with "in" (e.g. numberin, textin, booleanin, anyin)
                if (dockType && dockType !== "in" && dockType !== "unavailable") {
                    const conn = b.connections ? b.connections[dock] : null;
                    if (conn === null || conn === undefined) {
                        addMissingArgWarning(id, b.name, dock);
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

            // Exclude single unconnected argument/value blocks or layout spacers/sentinels
            if (isValueOrArgBlock(blk) || isSpacerOrSentinel(blk)) {
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
            if (b && !b.trash && !isValueOrArgBlock(b) && !isSpacerOrSentinel(b)) {
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
