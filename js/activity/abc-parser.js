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
        const organizeBlock = {};
        let blockId = 0;
        let tripletFinder = null;
        const title = (tune.metaText?.title ?? "title").toString().toLowerCase();
        const instruction = (tune.metaText?.instruction ?? "guitar").toString().toLowerCase();

        tune.lines?.forEach(line => {
            line.staff?.forEach((staff, staffIndex) => {
                if (!Object.prototype.hasOwnProperty.call(organizeBlock, staffIndex)) {
                    organizeBlock[staffIndex] = {
                        arrangedBlocks: []
                    };
                }

                organizeBlock[staffIndex].arrangedBlocks.push(staff);
            });
        });
        for (const lineId in organizeBlock) {
            organizeBlock[lineId].arrangedBlocks?.forEach(staff => {
                if (!Object.prototype.hasOwnProperty.call(staffBlocksMap, lineId)) {
                    staffBlocksMap[lineId] = {
                        meterNum: staff?.meter?.value[0]?.num || 4,
                        meterDen: staff?.meter?.value[0]?.den || 4,
                        keySignature: staff.key,
                        baseBlocks: [],
                        startBlock: [
                            [
                                blockId,
                                ["start", { collapsed: false }],
                                100,
                                100,
                                [null, blockId + 1, null]
                            ],
                            [blockId + 1, "print", 0, 0, [blockId, blockId + 2, blockId + 3]],
                            [blockId + 2, ["text", { value: title }], 0, 0, [blockId + 1]],
                            [
                                blockId + 3,
                                "setturtlename2",
                                0,
                                0,
                                [blockId + 1, blockId + 4, blockId + 5]
                            ],
                            [
                                blockId + 4,
                                ["text", { value: `Voice ${parseInt(lineId) + 1} ` }],
                                0,
                                0,
                                [blockId + 3]
                            ],
                            [
                                blockId + 5,
                                "meter",
                                0,
                                0,
                                [blockId + 3, blockId + 6, blockId + 7, blockId + 10]
                            ],
                            [
                                blockId + 6,
                                ["number", { value: staff?.meter?.value[0]?.num || 4 }],
                                0,
                                0,
                                [blockId + 5]
                            ],
                            [blockId + 7, "divide", 0, 0, [blockId + 5, blockId + 8, blockId + 9]],
                            [blockId + 8, ["number", { value: 1 }], 0, 0, [blockId + 7]],
                            [
                                blockId + 9,
                                ["number", { value: staff?.meter?.value[0]?.den || 4 }],
                                0,
                                0,
                                [blockId + 7]
                            ],
                            [blockId + 10, "vspace", 0, 0, [blockId + 5, blockId + 11]],
                            [
                                blockId + 11,
                                "setkey2",
                                0,
                                0,
                                [blockId + 10, blockId + 12, blockId + 13, blockId + 14]
                            ],
                            [
                                blockId + 12,
                                ["notename", { value: staff.key.root }],
                                0,
                                0,
                                [blockId + 11]
                            ],
                            [
                                blockId + 13,
                                ["modename", { value: staff.key.mode === "m" ? "minor" : "major" }],
                                0,
                                0,
                                [blockId + 11]
                            ],
                            //In Settimbre instead of null it should be nameddoblock of first action block
                            [
                                blockId + 14,
                                "settimbre",
                                0,
                                0,
                                [blockId + 11, blockId + 15, null, blockId + 16]
                            ],
                            [
                                blockId + 15,
                                ["voicename", { value: instruction }],
                                0,
                                0,
                                [blockId + 14]
                            ],
                            [blockId + 16, "hidden", 0, 0, [blockId + 14, null]]
                        ],
                        repeatBlock: [],
                        repeatArray: [],
                        nameddoArray: {}
                    };

                    // For adding 17 blocks above
                    blockId += 17;
                }

                staff.voices.forEach(voice => {
                    const actionBlock = [];
                    voice.forEach(element => {
                        if (element.el_type === "note") {
                            //check if triplet exists
                            if (
                                element?.startTriplet !== null &&
                                element?.startTriplet !== undefined
                            ) {
                                tripletFinder = element.startTriplet;
                            }

                            // Check and set tripletFinder to null
                            // if element?.endTriplets exists.
                            _createPitchBlocks(
                                element.pitches[0],
                                blockId,
                                element.duration,
                                staff.key,
                                actionBlock,
                                tripletFinder,
                                staffBlocksMap[lineId].meterDen
                            );
                            if (element?.endTriplet !== null && element?.endTriplet !== undefined) {
                                tripletFinder = null;
                            }
                            blockId = blockId + 9;
                        } else if (element.el_type === "bar") {
                            if (element.type === "bar_left_repeat") {
                                staffBlocksMap[lineId].repeatArray.push({
                                    start: staffBlocksMap[lineId].baseBlocks.length,
                                    end: -1
                                });
                            } else if (element.type === "bar_right_repeat") {
                                const endBlockSearch = staffBlocksMap[lineId].repeatArray;

                                for (const repeatbar in endBlockSearch) {
                                    if (endBlockSearch[repeatbar].end === -1) {
                                        staffBlocksMap[lineId].repeatArray[repeatbar].end =
                                            staffBlocksMap[lineId].baseBlocks.length;
                                    }
                                }
                            }
                        }
                    });

                    // Skip voices that produced no note blocks (e.g. bar-only voices).
                    if (actionBlock.length === 0) {
                        return;
                    }

                    // actionBlock.length > 0 is guaranteed by the guard above.
                    // Update the newnote connection with hidden
                    actionBlock[0][4][0] = blockId + 3;
                    actionBlock[actionBlock.length - 1][4][1] = null;

                    // Update the namedo block if not first
                    // nameddo block appear
                    if (staffBlocksMap[lineId].baseBlocks.length !== 0) {
                        staffBlocksMap[lineId].baseBlocks[
                            staffBlocksMap[lineId].baseBlocks.length - 1
                        ][0][
                            staffBlocksMap[lineId].baseBlocks[
                                staffBlocksMap[lineId].baseBlocks.length - 1
                            ][0].length - 4
                        ][4][1] = blockId;
                    }
                    // Add the nameddo action text and hidden
                    // block for each line
                    actionBlock.push(
                        [
                            blockId,
                            [
                                "nameddo",
                                {
                                    value: `V: ${parseInt(lineId) + 1} Line ${
                                        staffBlocksMap[lineId]?.baseBlocks?.length + 1
                                    }`
                                }
                            ],
                            0,
                            0,
                            [
                                staffBlocksMap[lineId].baseBlocks.length === 0
                                    ? null
                                    : staffBlocksMap[lineId].baseBlocks[
                                          staffBlocksMap[lineId].baseBlocks.length - 1
                                      ][0][
                                          staffBlocksMap[lineId].baseBlocks[
                                              staffBlocksMap[lineId].baseBlocks.length - 1
                                          ][0].length - 4
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
                        [
                            blockId + 2,
                            [
                                "text",
                                {
                                    value: `V: ${parseInt(lineId) + 1} Line ${
                                        staffBlocksMap[lineId]?.baseBlocks?.length + 1
                                    }`
                                }
                            ],
                            0,
                            0,
                            [blockId + 1]
                        ],
                        [blockId + 3, "hidden", 0, 0, [blockId + 1, actionBlock[0][0]]]
                    ); // blockid of topaction block

                    if (!staffBlocksMap[lineId].nameddoArray) {
                        staffBlocksMap[lineId].nameddoArray = {};
                    }

                    // Ensure the array at nameddoArray[lineId] is initialized if it doesn't exist
                    if (!staffBlocksMap[lineId].nameddoArray[lineId]) {
                        staffBlocksMap[lineId].nameddoArray[lineId] = [];
                    }

                    staffBlocksMap[lineId].nameddoArray[lineId].push(blockId);
                    blockId += 4;

                    staffBlocksMap[lineId].baseBlocks.push([actionBlock]);
                });
            });
        }

        const finalBlock = [];
        for (const staffIndex in staffBlocksMap) {
            // Validate that the staff has sufficient block data for linking.
            // Staves with no notes or incomplete structures from certain
            // ABC notation inputs can cause crashes when accessing nested
            // array elements without bounds checking.
            if (
                !staffBlocksMap[staffIndex].baseBlocks ||
                staffBlocksMap[staffIndex].baseBlocks.length === 0 ||
                !staffBlocksMap[staffIndex].baseBlocks[0] ||
                !staffBlocksMap[staffIndex].baseBlocks[0][0] ||
                staffBlocksMap[staffIndex].baseBlocks[0][0].length < 4 ||
                staffBlocksMap[staffIndex].startBlock.length < 3 ||
                !staffBlocksMap[staffIndex].nameddoArray ||
                !staffBlocksMap[staffIndex].nameddoArray[staffIndex] ||
                staffBlocksMap[staffIndex].nameddoArray[staffIndex].length === 0
            ) {
                finalBlock.push(...staffBlocksMap[staffIndex].startBlock);
                continue;
            }
            staffBlocksMap[staffIndex].startBlock[
                staffBlocksMap[staffIndex].startBlock.length - 3
            ][4][2] =
                staffBlocksMap[staffIndex].baseBlocks[0][0][
                    staffBlocksMap[staffIndex].baseBlocks[0][0].length - 4
                ][0];
            // Update the first namedo block with settimbre
            staffBlocksMap[staffIndex].baseBlocks[0][0][
                staffBlocksMap[staffIndex].baseBlocks[0][0].length - 4
            ][4][0] =
                staffBlocksMap[staffIndex].startBlock[
                    staffBlocksMap[staffIndex].startBlock.length - 3
                ][0];
            const repeatblockids = staffBlocksMap[staffIndex].repeatArray;
            for (const repeatId of repeatblockids) {
                // Skip repeat entries with out-of-bounds block indices
                if (
                    repeatId.start < 0 ||
                    repeatId.end < 0 ||
                    repeatId.start >= staffBlocksMap[staffIndex].baseBlocks.length ||
                    repeatId.end >= staffBlocksMap[staffIndex].baseBlocks.length
                ) {
                    continue;
                }

                if (repeatId.start === 0) {
                    staffBlocksMap[staffIndex].repeatBlock.push([
                        blockId,
                        "repeat",
                        0,
                        0,
                        [
                            staffBlocksMap[staffIndex].startBlock[
                                staffBlocksMap[staffIndex].startBlock.length - 3
                            ][0] /*setribmre*/,
                            blockId + 1,
                            staffBlocksMap[staffIndex].nameddoArray[staffIndex][0],
                            staffBlocksMap[staffIndex].nameddoArray[staffIndex][
                                repeatId.end + 1
                            ] === null
                                ? null
                                : staffBlocksMap[staffIndex].nameddoArray[staffIndex][
                                      repeatId.end + 1
                                  ]
                        ]
                    ]);
                    staffBlocksMap[staffIndex].repeatBlock.push([
                        blockId + 1,
                        ["number", { value: 2 }],
                        100,
                        100,
                        [blockId]
                    ]);

                    // Update the settrimbre block
                    staffBlocksMap[staffIndex].startBlock[
                        staffBlocksMap[staffIndex].startBlock.length - 3
                    ][4][2] = blockId;
                    const firstnammedo = _searchIndexForMusicBlock(
                        staffBlocksMap[staffIndex].baseBlocks[0][0],
                        staffBlocksMap[staffIndex].nameddoArray[staffIndex][0]
                    );
                    const endnammedo = _searchIndexForMusicBlock(
                        staffBlocksMap[staffIndex].baseBlocks[repeatId.end][0],
                        staffBlocksMap[staffIndex].nameddoArray[staffIndex][repeatId.end]
                    );
                    // Because its [0] is the first nammeddo block
                    // obviously. Check if
                    // staffBlocksMap[staffIndex].baseBlocks[repeatId.end+1
                    // exists and has a [0] element
                    if (
                        staffBlocksMap[staffIndex].baseBlocks[repeatId.end + 1] &&
                        staffBlocksMap[staffIndex].baseBlocks[repeatId.end + 1][0]
                    ) {
                        const secondnammedo = _searchIndexForMusicBlock(
                            staffBlocksMap[staffIndex].baseBlocks[repeatId.end + 1][0],
                            staffBlocksMap[staffIndex].nameddoArray[staffIndex][repeatId.end + 1]
                        );

                        if (secondnammedo !== -1) {
                            staffBlocksMap[staffIndex].baseBlocks[repeatId.end + 1][0][
                                secondnammedo
                            ][4][0] = blockId;
                        }
                    }
                    staffBlocksMap[staffIndex].baseBlocks[0][0][firstnammedo][4][0] = blockId;
                    staffBlocksMap[staffIndex].baseBlocks[repeatId.end][0][endnammedo][4][1] = null;

                    blockId += 2;
                } else {
                    const currentnammeddo = _searchIndexForMusicBlock(
                        staffBlocksMap[staffIndex].baseBlocks[repeatId.start][0],
                        staffBlocksMap[staffIndex].nameddoArray[staffIndex][repeatId.start]
                    );
                    const prevnameddo = _searchIndexForMusicBlock(
                        staffBlocksMap[staffIndex].baseBlocks[repeatId.start - 1][0],
                        staffBlocksMap[staffIndex].baseBlocks[repeatId.start][0][
                            currentnammeddo
                        ][4][0]
                    );
                    const afternamedo = _searchIndexForMusicBlock(
                        staffBlocksMap[staffIndex].baseBlocks[repeatId.end][0],
                        staffBlocksMap[staffIndex].baseBlocks[repeatId.start][0][
                            currentnammeddo
                        ][4][1]
                    );
                    let prevrepeatnameddo = -1;
                    if (prevnameddo === -1) {
                        prevrepeatnameddo = _searchIndexForMusicBlock(
                            staffBlocksMap[staffIndex].repeatBlock,
                            staffBlocksMap[staffIndex].baseBlocks[repeatId.start][0][
                                currentnammeddo
                            ][4][0]
                        );
                    }

                    const currentBlockId =
                        staffBlocksMap[staffIndex].baseBlocks[repeatId.start][0][
                            currentnammeddo
                        ][0];

                    // Needs null checking optmizie
                    const nextBlockId =
                        staffBlocksMap[staffIndex].nameddoArray[staffIndex][repeatId.end + 1];

                    staffBlocksMap[staffIndex].repeatBlock.push([
                        blockId,
                        "repeat",
                        0,
                        0,
                        [
                            staffBlocksMap[staffIndex].baseBlocks[repeatId.start][0][
                                currentnammeddo
                            ][4][0],
                            blockId + 1,
                            currentBlockId,
                            nextBlockId === null || nextBlockId === undefined ? null : nextBlockId
                        ]
                    ]);
                    staffBlocksMap[staffIndex].repeatBlock.push([
                        blockId + 1,
                        ["number", { value: 2 }],
                        100,
                        100,
                        [blockId]
                    ]);
                    if (prevnameddo !== -1) {
                        staffBlocksMap[staffIndex].baseBlocks[repeatId.start - 1][0][
                            prevnameddo
                        ][4][1] = blockId;
                    } else {
                        staffBlocksMap[staffIndex].repeatBlock[prevrepeatnameddo][4][3] = blockId;
                    }
                    if (afternamedo !== -1) {
                        staffBlocksMap[staffIndex].baseBlocks[repeatId.end][0][afternamedo][4][1] =
                            null;
                    }
                    staffBlocksMap[staffIndex].baseBlocks[repeatId.start][0][
                        currentnammeddo
                    ][4][0] = blockId;
                    if (
                        nextBlockId !== null &&
                        nextBlockId !== undefined &&
                        staffBlocksMap[staffIndex].baseBlocks[repeatId.end + 1] &&
                        staffBlocksMap[staffIndex].baseBlocks[repeatId.end + 1][0]
                    ) {
                        const nextnameddo = _searchIndexForMusicBlock(
                            staffBlocksMap[staffIndex].baseBlocks[repeatId.end + 1][0],
                            nextBlockId
                        );
                        if (nextnameddo !== -1) {
                            staffBlocksMap[staffIndex].baseBlocks[repeatId.end + 1][0][
                                nextnameddo
                            ][4][0] = blockId;
                        }
                    }
                    blockId += 2;
                }
            }

            const lineBlock = staffBlocksMap[staffIndex].baseBlocks.reduce(
                (acc, curr) => acc.concat(curr),
                []
            );
            // Flatten the multidimensional array
            const flattenedLineBlock = lineBlock.flat();

            finalBlock.push(...staffBlocksMap[staffIndex].startBlock);
            finalBlock.push(...flattenedLineBlock);
            finalBlock.push(...staffBlocksMap[staffIndex].repeatBlock);
        }
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
