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

/* global toFraction */

/* exported setupActivityAbcParser */

// Function to convert ABC pitch to MB pitch
function _adjustPitch(note, keySignature) {
    const normalized = note.replace(",", "");
    const accidental = keySignature.accidentals.find(acc => {
        const noteToCompare = acc.note.toUpperCase().replace(",", "");
        return noteToCompare.toLowerCase() === normalized.toLowerCase();
    });

    if (accidental) {
        return (
            normalized + (accidental.acc === "sharp" ? "♯" : accidental.acc === "flat" ? "♭" : "")
        );
    } else {
        return normalized;
    }
}

// When converting to pitch value from ABC to MB there is issue
// with the octave conversion. We map the pitch to audible pitch.
function _abcToStandardValue(pitchValue) {
    const octave = Math.floor(pitchValue / 7) + 4;
    return octave;
}

// Creates pitch which consist of note pitch notename you could
// see them in the function.
function _createPitchBlocks(
    pitches,
    blockId,
    pitchDuration,
    keySignature,
    actionBlock,
    triplet,
    meterDen
) {
    const duration = toFraction(pitchDuration);
    const adjustedNote = _adjustPitch(pitches.name, keySignature).toUpperCase();
    if (triplet !== null) {
        duration[1] = meterDen * triplet;
    }

    actionBlock.push(
        [
            blockId,
            ["newnote", { collapsed: true }],
            0,
            0,
            [blockId - 1, blockId + 1, blockId + 4, blockId + 8]
        ],
        [blockId + 1, "divide", 0, 0, [blockId, blockId + 2, blockId + 3]],
        [blockId + 2, ["number", { value: duration[0] }], 0, 0, [blockId + 1]],
        [blockId + 3, ["number", { value: duration[1] }], 0, 0, [blockId + 1]],
        [blockId + 4, "vspace", 0, 0, [blockId, blockId + 5]],
        [blockId + 5, "pitch", 0, 0, [blockId + 4, blockId + 6, blockId + 7, null]],
        [blockId + 6, ["notename", { value: adjustedNote }], 0, 0, [blockId + 5]],
        [
            blockId + 7,
            ["number", { value: _abcToStandardValue(pitches.pitch) }],
            0,
            0,
            [blockId + 5]
        ],
        [blockId + 8, "hidden", 0, 0, [blockId, blockId + 9]]
    );
}

// Function to search index for particular type of block
// mainly used to find nammeddo block in repeat block.
function _searchIndexForMusicBlock(array, x) {
    // Iterate over each sub-array in the main array
    for (let i = 0; i < array.length; i++) {
        // Check if the 0th element of the sub-array matches x
        if (array[i][0] === x) {
            // Return the index if a match is found
            return i;
        }
    }
    // Return -1 if no match is found
    return -1;
}

/**
 * Collapses tune.lines[].staff[] into a map of staffIndex -> { arrangedBlocks[] }.
 *
 * @param {Array} lines - The lines array from the parsed tune object.
 * @returns {object} organizedStaffs - Map of staffIndex to arranged block data.
 */
function _organizeStaffs(lines) {
    const organizedStaffs = {};
    lines.forEach(line => {
        line.staff?.forEach((staff, staffIndex) => {
            if (!Object.prototype.hasOwnProperty.call(organizedStaffs, staffIndex)) {
                organizedStaffs[staffIndex] = { arrangedBlocks: [] };
            }
            organizedStaffs[staffIndex].arrangedBlocks.push(staff);
        });
    });
    return organizedStaffs;
}

/**
 * Builds the 17-block start preamble for one staff entry:
 * start, print, setturtlename2, meter, setkey2, settimbre, hidden.
 *
 * @param {number} blockId - Current block ID counter.
 * @param {object} staff - The staff object from the parsed tune.
 * @param {string} title - The tune title (lowercased).
 * @param {string} instruction - The instrument name (lowercased).
 * @param {string} staffIdx - The staff index key.
 * @returns {{ startBlock: Array, newBlockId: number }}
 */
function _buildStartBlock(blockId, staff, title, instruction, staffIdx) {
    const startBlock = [
        [blockId, ["start", { collapsed: false }], 100, 100, [null, blockId + 1, null]],
        [blockId + 1, "print", 0, 0, [blockId, blockId + 2, blockId + 3]],
        [blockId + 2, ["text", { value: title }], 0, 0, [blockId + 1]],
        [blockId + 3, "setturtlename2", 0, 0, [blockId + 1, blockId + 4, blockId + 5]],
        [
            blockId + 4,
            ["text", { value: `Voice ${parseInt(staffIdx, 10) + 1} ` }],
            0,
            0,
            [blockId + 3]
        ],
        [blockId + 5, "meter", 0, 0, [blockId + 3, blockId + 6, blockId + 7, blockId + 10]],
        [blockId + 6, ["number", { value: staff?.meter?.value[0]?.num || 4 }], 0, 0, [blockId + 5]],
        [blockId + 7, "divide", 0, 0, [blockId + 5, blockId + 8, blockId + 9]],
        [blockId + 8, ["number", { value: 1 }], 0, 0, [blockId + 7]],
        [blockId + 9, ["number", { value: staff?.meter?.value[0]?.den || 4 }], 0, 0, [blockId + 7]],
        [blockId + 10, "vspace", 0, 0, [blockId + 5, blockId + 11]],
        [blockId + 11, "setkey2", 0, 0, [blockId + 10, blockId + 12, blockId + 13, blockId + 14]],
        [blockId + 12, ["notename", { value: staff.key.root }], 0, 0, [blockId + 11]],
        [
            blockId + 13,
            ["modename", { value: staff.key.mode === "m" ? "minor" : "major" }],
            0,
            0,
            [blockId + 11]
        ],
        // Connection to first nameddo is resolved during finalization.
        [blockId + 14, "settimbre", 0, 0, [blockId + 11, blockId + 15, null, blockId + 16]],
        [blockId + 15, ["voicename", { value: instruction }], 0, 0, [blockId + 14]],
        [blockId + 16, "hidden", 0, 0, [blockId + 14, null]]
    ];

    return { startBlock, newBlockId: blockId + startBlock.length };
}

/**
 * Handles a bar element — updates repeatArray for left/right repeat bar types.
 *
 * @param {object} element - The bar element from the voice.
 * @param {Array} repeatArray - The staff's repeat array (mutated in place).
 * @param {number} baseBlocksCount - The current count of base blocks.
 */
function _handleBarElement(element, repeatArray, baseBlocksCount) {
    if (element.type === "bar_left_repeat") {
        repeatArray.push({
            start: baseBlocksCount,
            end: -1
        });
    } else if (element.type === "bar_right_repeat") {
        for (const repeatbar of repeatArray) {
            if (repeatbar.end === -1) {
                repeatbar.end = baseBlocksCount;
            }
        }
    }
}

/**
 * Processes one voice: iterates all elements, builds pitch blocks for notes
 * and updates repeat markers for bars, then appends the nameddo/action/hidden
 * tail. Returns early without pushing if no note blocks were produced.
 *
 * tripletFinder is initialized fresh for each voice so that triplet state
 * never bleeds from one voice into the next.
 *
 * @param {Array} voice - The voice element array.
 * @param {number} blockId - Current block ID counter.
 * @param {object} staff - The staff object.
 * @param {string} staffIdx - The staff index key.
 * @param {object} staffRecord - The localized staff record (mutated in place).
 * @returns {number} newBlockId
 */
function _processVoice(voice, blockId, staff, staffIdx, staffRecord) {
    // Reset triplet state at every voice boundary so that an unclosed
    // triplet in one voice cannot affect timing in subsequent voices.
    let tripletFinder = null;
    const actionBlock = [];

    voice.forEach(element => {
        if (element.el_type === "note") {
            //check if triplet exists
            if (element?.startTriplet !== null && element?.startTriplet !== undefined) {
                tripletFinder = element.startTriplet;
            }

            _createPitchBlocks(
                element.pitches[0],
                blockId,
                element.duration,
                staff.key,
                actionBlock,
                tripletFinder,
                staffRecord.meterDen
            );

            // Check and set tripletFinder to null if element?.endTriplet exists.
            if (element?.endTriplet !== null && element?.endTriplet !== undefined) {
                tripletFinder = null;
            }
            blockId = blockId + 9;
        } else if (element.el_type === "bar") {
            _handleBarElement(element, staffRecord.repeatArray, staffRecord.baseBlocks.length);
        }
    });

    // Skip voices that produced no note blocks (e.g. bar-only voices).
    if (actionBlock.length === 0) {
        return blockId;
    }

    // actionBlock.length > 0 is guaranteed by the guard above.
    // Update the newnote connection with hidden
    actionBlock[0][4][0] = blockId + 3;
    actionBlock[actionBlock.length - 1][4][1] = null;

    // Update the namedo block if not first nameddo block appear
    if (staffRecord.baseBlocks.length !== 0) {
        staffRecord.baseBlocks[staffRecord.baseBlocks.length - 1][0][
            staffRecord.baseBlocks[staffRecord.baseBlocks.length - 1][0].length - 4
        ][4][1] = blockId;
    }

    const lineLabel = `V: ${parseInt(staffIdx, 10) + 1} Line ${staffRecord.baseBlocks.length + 1}`;

    // Add the nameddo action text and hidden block for each line
    actionBlock.push(
        [
            blockId,
            ["nameddo", { value: lineLabel }],
            0,
            0,
            [
                staffRecord.baseBlocks.length === 0
                    ? null
                    : staffRecord.baseBlocks[staffRecord.baseBlocks.length - 1][0][
                          staffRecord.baseBlocks[staffRecord.baseBlocks.length - 1][0].length - 4
                      ][0],
                null
            ]
        ],
        [
            blockId + 1,
            ["action", { collapsed: false }],
            100,
            100,
            [null, blockId + 2, blockId + 3, null]
        ],
        [blockId + 2, ["text", { value: lineLabel }], 0, 0, [blockId + 1]],
        [blockId + 3, "hidden", 0, 0, [blockId + 1, actionBlock[0][0]]]
    ); // blockid of topaction block

    staffRecord.nameddoIds.push(blockId);
    blockId += 4;

    staffRecord.baseBlocks.push([actionBlock]);

    return blockId;
}

/**
 * Handles a repeat that starts at the very beginning of the staff (repeatId.start === 0).
 * Pushes the repeat and its count block, then rewires settimbre and nameddo connections.
 *
 * @param {object} repeatId - The repeat entry { start, end }.
 * @param {number} blockId - Current block ID counter.
 * @param {string} staffIndex - The staff index key.
 * @param {object} staffBlocksMap - The shared staff blocks map (mutated in place).
 * @returns {number} newBlockId
 */
/**
 * Handles a repeat that starts at the very beginning of the staff (repeatId.start === 0).
 * Pushes the repeat and its count block, then rewires settimbre and nameddo connections.
 *
 * @param {object} repeatId - The repeat entry { start, end }.
 * @param {number} blockId - Current block ID counter.
 * @param {object} staffRecord - The localized staff record (mutated in place).
 * @returns {number} newBlockId
 */
function _processRepeatFromStart(repeatId, blockId, staffRecord) {
    staffRecord.repeatBlock.push([
        blockId,
        "repeat",
        0,
        0,
        [
            staffRecord.startBlock[staffRecord.startBlock.length - 3][0] /*settimbre*/,
            blockId + 1,
            staffRecord.nameddoIds[0],
            staffRecord.nameddoIds[repeatId.end + 1] === undefined
                ? null
                : staffRecord.nameddoIds[repeatId.end + 1]
        ]
    ]);
    staffRecord.repeatBlock.push([blockId + 1, ["number", { value: 2 }], 100, 100, [blockId]]);

    // Update the settimbre block
    staffRecord.startBlock[staffRecord.startBlock.length - 3][4][2] = blockId;

    const firstNameddo = _searchIndexForMusicBlock(
        staffRecord.baseBlocks[0][0],
        staffRecord.nameddoIds[0]
    );
    const endNameddo = _searchIndexForMusicBlock(
        staffRecord.baseBlocks[repeatId.end][0],
        staffRecord.nameddoIds[repeatId.end]
    );

    // Check if the block after the repeat end exists before accessing it
    if (staffRecord.baseBlocks[repeatId.end + 1] && staffRecord.baseBlocks[repeatId.end + 1][0]) {
        const secondNameddo = _searchIndexForMusicBlock(
            staffRecord.baseBlocks[repeatId.end + 1][0],
            staffRecord.nameddoIds[repeatId.end + 1]
        );

        if (secondNameddo !== -1) {
            staffRecord.baseBlocks[repeatId.end + 1][0][secondNameddo][4][0] = blockId;
        }
    }

    staffRecord.baseBlocks[0][0][firstNameddo][4][0] = blockId;
    staffRecord.baseBlocks[repeatId.end][0][endNameddo][4][1] = null;

    return blockId + 2;
}

/**
 * Handles a mid-piece repeat (repeatId.start > 0).
 * Pushes the repeat and its count block, then rewires predecessor and successor
 * nameddo connections.
 *
 * @param {object} repeatId - The repeat entry { start, end }.
 * @param {number} blockId - Current block ID counter.
 * @param {object} staffRecord - The localized staff record (mutated in place).
 * @returns {number} newBlockId
 */
function _processRepeatMid(repeatId, blockId, staffRecord) {
    const currentNameddo = _searchIndexForMusicBlock(
        staffRecord.baseBlocks[repeatId.start][0],
        staffRecord.nameddoIds[repeatId.start]
    );
    const prevnameddo = _searchIndexForMusicBlock(
        staffRecord.baseBlocks[repeatId.start - 1][0],
        staffRecord.baseBlocks[repeatId.start][0][currentNameddo][4][0]
    );
    const afterNameddo = _searchIndexForMusicBlock(
        staffRecord.baseBlocks[repeatId.end][0],
        staffRecord.baseBlocks[repeatId.start][0][currentNameddo][4][1]
    );

    let prevRepeatNameddo = -1;
    if (prevnameddo === -1) {
        prevRepeatNameddo = _searchIndexForMusicBlock(
            staffRecord.repeatBlock,
            staffRecord.baseBlocks[repeatId.start][0][currentNameddo][4][0]
        );
    }

    const currentBlockId = staffRecord.baseBlocks[repeatId.start][0][currentNameddo][0];

    // Needs null checking optimize
    const nextBlockId = staffRecord.nameddoIds[repeatId.end + 1];

    staffRecord.repeatBlock.push([
        blockId,
        "repeat",
        0,
        0,
        [
            staffRecord.baseBlocks[repeatId.start][0][currentNameddo][4][0],
            blockId + 1,
            currentBlockId,
            nextBlockId === null || nextBlockId === undefined ? null : nextBlockId
        ]
    ]);
    staffRecord.repeatBlock.push([blockId + 1, ["number", { value: 2 }], 100, 100, [blockId]]);

    if (prevnameddo !== -1) {
        staffRecord.baseBlocks[repeatId.start - 1][0][prevnameddo][4][1] = blockId;
    } else {
        staffRecord.repeatBlock[prevRepeatNameddo][4][3] = blockId;
    }

    if (afterNameddo !== -1) {
        staffRecord.baseBlocks[repeatId.end][0][afterNameddo][4][1] = null;
    }

    staffRecord.baseBlocks[repeatId.start][0][currentNameddo][4][0] = blockId;

    if (
        nextBlockId !== null &&
        nextBlockId !== undefined &&
        staffRecord.baseBlocks[repeatId.end + 1] &&
        staffRecord.baseBlocks[repeatId.end + 1][0]
    ) {
        const nextnameddo = _searchIndexForMusicBlock(
            staffRecord.baseBlocks[repeatId.end + 1][0],
            nextBlockId
        );
        if (nextnameddo !== -1) {
            staffRecord.baseBlocks[repeatId.end + 1][0][nextnameddo][4][0] = blockId;
        }
    }

    return blockId + 2;
}

/**
 * Iterates all repeat entries for a staff, applies bounds checks, and dispatches
 * to _processRepeatFromStart or _processRepeatMid as appropriate.
 *
 * @param {object} staffRecord - The localized staff record (mutated in place).
 * @param {number} blockId - Current block ID counter.
 * @returns {number} newBlockId
 */
function _processRepeats(staffRecord, blockId) {
    const repeatblockids = staffRecord.repeatArray;
    for (const repeatId of repeatblockids) {
        // Skip repeat entries with out-of-bounds block indices
        if (
            repeatId.start < 0 ||
            repeatId.end < 0 ||
            repeatId.start >= staffRecord.baseBlocks.length ||
            repeatId.end >= staffRecord.baseBlocks.length
        ) {
            continue;
        }

        if (repeatId.start === 0) {
            blockId = _processRepeatFromStart(repeatId, blockId, staffRecord);
        } else {
            blockId = _processRepeatMid(repeatId, blockId, staffRecord);
        }
    }
    return blockId;
}

/**
 * Links settimbre to the first nameddo block, processes all repeats, then
 * flattens and pushes the complete staff block data into finalBlock.
 *
 * @param {object} staffRecord - The localized staff record (mutated in place).
 * @param {number} blockId - Current block ID counter.
 * @param {Array} finalBlock - The output block array (mutated in place).
 * @returns {number} newBlockId
 */
function _finalizeStaffBlocks(staffRecord, blockId, finalBlock) {
    // Validate that the staff has sufficient block data for linking.
    // Staves with no notes or incomplete structures from certain
    // ABC notation inputs can cause crashes when accessing nested
    // array elements without bounds checking.
    if (
        !staffRecord.baseBlocks ||
        staffRecord.baseBlocks.length === 0 ||
        !staffRecord.baseBlocks[0] ||
        !staffRecord.baseBlocks[0][0] ||
        staffRecord.baseBlocks[0][0].length < 4 ||
        staffRecord.startBlock.length < 3 ||
        !staffRecord.nameddoIds ||
        staffRecord.nameddoIds.length === 0
    ) {
        finalBlock.push(...staffRecord.startBlock);
        return blockId;
    }

    // Link settimbre -> first nameddo block (forward direction)
    staffRecord.startBlock[staffRecord.startBlock.length - 3][4][2] =
        staffRecord.baseBlocks[0][0][staffRecord.baseBlocks[0][0].length - 4][0];

    // Update the first namedo block with settimbre (back-link)
    staffRecord.baseBlocks[0][0][staffRecord.baseBlocks[0][0].length - 4][4][0] =
        staffRecord.startBlock[staffRecord.startBlock.length - 3][0];

    blockId = _processRepeats(staffRecord, blockId);

    const lineBlock = staffRecord.baseBlocks.reduce((acc, curr) => acc.concat(curr), []);
    // Flatten the multidimensional array
    const flattenedLineBlock = lineBlock.flat();

    finalBlock.push(...staffRecord.startBlock);
    finalBlock.push(...flattenedLineBlock);
    finalBlock.push(...staffRecord.repeatBlock);

    return blockId;
}

/**
 * Attaches parseABC to the activity instance.
 *
 * The parseABC function converts ABC notation to Music Blocks
 * and is able to convert almost all the ABC notation to Music
 * Blocks. However, the following aspects need work:
 *
 * Hammers, pulls, and sliding offs grace notes (breaking the
 * conversion) Alternate endings (not failing but not showing
 * correctly) and DS al coda Bass voicing (failing)
 *
 * @param {object} activityInstance - The activity instance.
 */
const setupActivityAbcParser = activityInstance => {
    activityInstance.parseABC = async function (tune) {
        const staffBlocksMap = {};
        let blockId = 0;
        const title = (tune.metaText?.title ?? "title").toString().toLowerCase();
        const instruction = (tune.metaText?.instruction ?? "guitar").toString().toLowerCase();

        const organizedStaffs = _organizeStaffs(tune.lines ?? []);
        Object.keys(organizedStaffs).forEach(staffIdx => {
            organizedStaffs[staffIdx].arrangedBlocks?.forEach(staff => {
                if (!Object.prototype.hasOwnProperty.call(staffBlocksMap, staffIdx)) {
                    const { startBlock, newBlockId } = _buildStartBlock(
                        blockId,
                        staff,
                        title,
                        instruction,
                        staffIdx
                    );
                    staffBlocksMap[staffIdx] = {
                        meterNum: staff?.meter?.value[0]?.num || 4,
                        meterDen: staff?.meter?.value[0]?.den || 4,
                        keySignature: staff.key,
                        baseBlocks: [],
                        startBlock,
                        repeatBlock: [],
                        repeatArray: [],
                        nameddoIds: []
                    };
                    blockId = newBlockId;
                }

                staff.voices.forEach(voice => {
                    blockId = _processVoice(
                        voice,
                        blockId,
                        staff,
                        staffIdx,
                        staffBlocksMap[staffIdx]
                    );
                });
            });
        });

        const finalBlock = [];
        Object.keys(staffBlocksMap).forEach(staffIndex => {
            blockId = _finalizeStaffBlocks(staffBlocksMap[staffIndex], blockId, finalBlock);
        });

        this.blocks.loadNewBlocks(finalBlock);
        return null;
    };
};

// AMD module definition — mirrors the pattern used in recorder.js.
if (typeof define === "function" && define.amd) {
    define(function () {
        return { setupActivityAbcParser };
    });
} else if (typeof module !== "undefined" && module.exports) {
    // Jest / Node environment
    module.exports = { setupActivityAbcParser };
}
