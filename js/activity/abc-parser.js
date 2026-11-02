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

/**
 * Maps an abcjs accidental tag to the Music Blocks Unicode suffix.
 * Double sharp/flat are mapped to the standard MB symbols.
 * "natural" is an explicit override that cancels the key signature,
 * so no suffix is appended.
 */
const _ABC_ACCIDENTAL_SUFFIX = {
    sharp: "♯",
    flat: "♭",
    dblsharp: "𝄪",
    dblflat: "𝄫",
    natural: ""
};

/**
 * Maps abcjs key.acc values ("b", "#", "") to the Music Blocks
 * Unicode suffix appended to the root note name in setkey2 blocks.
 */
const _ABC_KEY_ACC_SUFFIX = {
    "b": "♭",
    "#": "♯",
    "": ""
};

/**
 * Maps abcjs key.mode abbreviations to Music Blocks mode names that
 * exist in MUSICALMODES.  Unrecognized values fall back to "major".
 */
const _ABC_MODE_MAP = {
    "": "major",
    "m": "minor",
    "Maj": "major",
    "Min": "minor",
    "Dor": "dorian",
    "Phr": "phrygian",
    "Lyd": "lydian",
    "Mix": "mixolydian",
    "Aeo": "aeolian",
    "Loc": "locrian"
};

/**
 * abcjs bar types for |:, :| and ::.
 */
const _ABC_REPEAT_BARS = ["bar_left_repeat", "bar_right_repeat", "bar_dbl_repeat"];

/**
 * Strips ABC inline accidental prefixes (^, ^^, _, __, =) and octave
 * marks (any number of "," or "'") from a note name so only the bare
 * letter remains.  For example "^^G" becomes "G", "_E," becomes "E"
 * and "c''" becomes "c".  The octave itself comes from pitch.pitch.
 */
function _stripAbcAccidentalPrefix(name) {
    return name.replace(/^[\^_=]+/, "").replace(/[,']+$/, "");
}

// Converts an abcjs pitch object to a Music Blocks note name.
//
// The function resolves accidentals in two layers, matching standard
// ABC semantics:
//   1. An explicit inline accidental on the pitch itself (the
//      `accidental` field set by abcjs for ^, _, =, ^^, __).
//   2. A key-signature accidental that applies to the note letter.
// If neither applies the bare note letter is returned.
function _adjustPitch(note, keySignature, inlineAccidental) {
    const bare = _stripAbcAccidentalPrefix(note);

    // Inline accidental takes priority (ABC rule: it overrides the
    // key signature for the rest of the bar).
    if (inlineAccidental && inlineAccidental in _ABC_ACCIDENTAL_SUFFIX) {
        return bare + _ABC_ACCIDENTAL_SUFFIX[inlineAccidental];
    }

    // Fall back to the key signature.
    const ksa = keySignature.accidentals.find(acc => {
        const noteToCompare = _stripAbcAccidentalPrefix(acc.note);
        return noteToCompare.toLowerCase() === bare.toLowerCase();
    });

    if (ksa && ksa.acc in _ABC_ACCIDENTAL_SUFFIX) {
        return bare + _ABC_ACCIDENTAL_SUFFIX[ksa.acc];
    }

    return bare;
}

// When converting to pitch value from ABC to MB there is issue
// with the octave conversion. We map the pitch to audible pitch.
function _abcToStandardValue(pitchValue) {
    const octave = Math.floor(pitchValue / 7) + 4;
    return octave;
}

// Creates the newnote block for one ABC note, rest or chord: a pitch block
// (pitch, notename, octave) for each note of the chord, chained inside the
// newnote's clamp, or a rest2 when there are none.
function _createPitchBlocks(
    chord,
    blockId,
    pitchDuration,
    keySignature,
    actionBlock,
    inlineAccidentals
) {
    const duration = toFraction(pitchDuration);
    const hiddenBlockId = blockId + 5 + (chord.length ? 3 * chord.length : 1);

    const noteBlocks = [
        [
            blockId,
            ["newnote", { collapsed: true }],
            0,
            0,
            [blockId - 1, blockId + 1, blockId + 4, hiddenBlockId]
        ],
        [blockId + 1, "divide", 0, 0, [blockId, blockId + 2, blockId + 3]],
        [blockId + 2, ["number", { value: duration[0] }], 0, 0, [blockId + 1]],
        [blockId + 3, ["number", { value: duration[1] }], 0, 0, [blockId + 1]],
        [blockId + 4, "vspace", 0, 0, [blockId, blockId + 5]]
    ];

    chord.forEach((pitch, i) => {
        const id = blockId + 5 + 3 * i;
        const adjustedNote = _adjustPitch(
            pitch.name,
            keySignature,
            inlineAccidentals[i]
        ).toUpperCase();
        noteBlocks.push(
            [
                id,
                "pitch",
                0,
                0,
                [
                    i === 0 ? blockId + 4 : id - 3,
                    id + 1,
                    id + 2,
                    i === chord.length - 1 ? null : id + 3
                ]
            ],
            [id + 1, ["notename", { value: adjustedNote }], 0, 0, [id]],
            [id + 2, ["number", { value: _abcToStandardValue(pitch.pitch) }], 0, 0, [id]]
        );
    });
    if (chord.length === 0) {
        noteBlocks.push([blockId + 5, "rest2", 0, 0, [blockId + 4, null]]);
    }

    noteBlocks.push([hiddenBlockId, "hidden", 0, 0, [blockId, hiddenBlockId + 1]]);
    actionBlock.push(...noteBlocks);
    return noteBlocks.length;
}

/**
 * Links blocks into one stack hanging from a connection slot of parent:
 * each block's first connection is its previous block and its last
 * connection is the next one.
 *
 * @param {Array} chain - Block literals in play order (mutated in place).
 * @param {Array} parent - The block the stack hangs from (mutated in place).
 * @param {number} slot - The parent connection that holds the stack.
 */
function _chainBlocks(chain, parent, slot) {
    parent[4][slot] = chain[0][0];
    chain.forEach((block, i) => {
        block[4][0] = i === 0 ? parent[0] : chain[i - 1][0];
        block[4][block[4].length - 1] = i === chain.length - 1 ? null : chain[i + 1][0];
    });
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
 * @param {number} voiceNumber - The voice number shown on the imported turtle.
 * @returns {{ startBlock: Array, newBlockId: number }}
 */
// A staff's meter as a numerator and denominator. abcjs spells M:C and M:C| as
// named types with no value to read a number out of, so they are named here; every
// other meter carries one.
const _ABC_NAMED_METERS = {
    common_time: { num: 4, den: 4 },
    cut_time: { num: 2, den: 2 }
};

function _meterOf(staff) {
    const meter = staff?.meter;
    const named = _ABC_NAMED_METERS[meter?.type];
    if (named !== undefined) return named;
    const value = meter?.value?.[0];
    return { num: Number(value?.num) || 4, den: Number(value?.den) || 4 };
}

function _tempoOf(tempo) {
    if (!Number.isFinite(tempo?.bpm) || tempo.bpm <= 0 || tempo.suppressBpm) return null;
    // An ABC tempo may define its beat as a sum, such as Q:1/4 1/8=60.
    const beatValue = tempo.duration?.reduce((total, value) => total + value, 0);
    if (!Number.isFinite(beatValue) || beatValue <= 0) return null;
    return { bpm: tempo.bpm, duration: toFraction(beatValue) };
}

// An abcjs key as the root notename and modename a setkey2 block takes.
function _keyNamesOf(key) {
    // K:none has no key signature, which reads the same as C major.
    if (key.root === "none") {
        return { root: "C", mode: "major" };
    }
    return {
        root: key.root + (_ABC_KEY_ACC_SUFFIX[key.acc] || ""),
        mode: _ABC_MODE_MAP[key.mode] || "major"
    };
}

// Makes key the voice's key and adds a setkey2 block to a segment, followed by a
// hidden block like a note, so it chains into the segment the same way notes do.
// Meter blocks do the same. Adds nothing when the root and mode are unchanged.
function _createKeyBlocks(key, blockId, actionBlock, staffRecord) {
    const previous = _keyNamesOf(staffRecord.keySignature);
    staffRecord.keySignature = key;
    const { root, mode } = _keyNamesOf(key);
    if (root === previous.root && mode === previous.mode) {
        return 0;
    }
    actionBlock.push(
        [blockId, "setkey2", 0, 0, [blockId - 1, blockId + 1, blockId + 2, blockId + 3]],
        [blockId + 1, ["notename", { value: root }], 0, 0, [blockId]],
        [blockId + 2, ["modename", { value: mode }], 0, 0, [blockId]],
        [blockId + 3, "hidden", 0, 0, [blockId, blockId + 4]]
    );
    return 4;
}

// Adds nothing when the voice is already in this meter.
function _createMeterBlocks(meter, blockId, actionBlock, staffRecord) {
    if (meter.num === staffRecord.meterNum && meter.den === staffRecord.meterDen) {
        return 0;
    }
    staffRecord.meterNum = meter.num;
    staffRecord.meterDen = meter.den;
    actionBlock.push(
        [blockId, "meter", 0, 0, [blockId - 1, blockId + 1, blockId + 2, blockId + 5]],
        [blockId + 1, ["number", { value: meter.num }], 0, 0, [blockId]],
        [blockId + 2, "divide", 0, 0, [blockId, blockId + 3, blockId + 4]],
        [blockId + 3, ["number", { value: 1 }], 0, 0, [blockId + 2]],
        [blockId + 4, ["number", { value: meter.den }], 0, 0, [blockId + 2]],
        [blockId + 5, "hidden", 0, 0, [blockId, blockId + 6]]
    );
    return 6;
}

function _buildStartBlock(blockId, staff, title, instruction, voiceNumber, tempo) {
    const { root: keyRoot, mode: keyMode } = _keyNamesOf(staff.key);
    const meter = _meterOf(staff);
    const tempoId = blockId + 14;
    const timbreId = tempoId + (tempo ? 6 : 0);
    const beforeTimbreId = tempo ? tempoId + 5 : blockId + 11;

    const startBlock = [
        [blockId, ["start", { collapsed: false }], 100, 100, [null, blockId + 1, null]],
        [blockId + 1, "print", 0, 0, [blockId, blockId + 2, blockId + 3]],
        [blockId + 2, ["text", { value: title }], 0, 0, [blockId + 1]],
        [blockId + 3, "setturtlename2", 0, 0, [blockId + 1, blockId + 4, blockId + 5]],
        [blockId + 4, ["text", { value: `Voice ${voiceNumber} ` }], 0, 0, [blockId + 3]],
        [blockId + 5, "meter", 0, 0, [blockId + 3, blockId + 6, blockId + 7, blockId + 10]],
        [blockId + 6, ["number", { value: meter.num }], 0, 0, [blockId + 5]],
        [blockId + 7, "divide", 0, 0, [blockId + 5, blockId + 8, blockId + 9]],
        [blockId + 8, ["number", { value: 1 }], 0, 0, [blockId + 7]],
        [blockId + 9, ["number", { value: meter.den }], 0, 0, [blockId + 7]],
        [blockId + 10, "vspace", 0, 0, [blockId + 5, blockId + 11]],
        [blockId + 11, "setkey2", 0, 0, [blockId + 10, blockId + 12, blockId + 13, blockId + 14]],
        [blockId + 12, ["notename", { value: keyRoot }], 0, 0, [blockId + 11]],
        [blockId + 13, ["modename", { value: keyMode }], 0, 0, [blockId + 11]],
        // Connection to first nameddo is resolved during finalization.
        [timbreId, "settimbre", 0, 0, [beforeTimbreId, timbreId + 1, null, timbreId + 2]],
        [timbreId + 1, ["voicename", { value: instruction }], 0, 0, [timbreId]],
        [timbreId + 2, "hidden", 0, 0, [timbreId, null]]
    ];

    if (tempo) {
        startBlock.splice(
            14,
            0,
            [tempoId, "setbpm3", 0, 0, [blockId + 11, tempoId + 1, tempoId + 2, tempoId + 5]],
            [tempoId + 1, ["number", { value: tempo.bpm }], 0, 0, [tempoId]],
            [tempoId + 2, "divide", 0, 0, [tempoId, tempoId + 3, tempoId + 4]],
            [tempoId + 3, ["number", { value: tempo.duration[0] }], 0, 0, [tempoId + 2]],
            [tempoId + 4, ["number", { value: tempo.duration[1] }], 0, 0, [tempoId + 2]],
            [tempoId + 5, "vspace", 0, 0, [tempoId, timbreId]]
        );
    }

    return { startBlock, newBlockId: blockId + startBlock.length };
}

/**
 * Records the segment range of a repeat. Lines are split at repeat bars, so
 * the bar sits between the last segment built and the next one.
 *
 * A :| with no |: repeats from the end of the previous repeat or from the
 * start of the tune, and :: ends one repeat and starts the next.
 *
 * @param {string} type - A bar type from _ABC_REPEAT_BARS.
 * @param {object} staffRecord - The localized staff record (mutated in place).
 */
function _handleRepeatBar(type, staffRecord) {
    const next = staffRecord.baseBlocks.length;
    if (type !== "bar_left_repeat") {
        const start = staffRecord.repeatStart ?? staffRecord.repeatFrom;
        if (start < next) {
            staffRecord.repeatArray.push({ start, end: next - 1 });
        }
        staffRecord.repeatFrom = next;
    }
    staffRecord.repeatStart = type === "bar_right_repeat" ? null : next;
}

/**
 * Turns the notes collected so far into an action block called by a nameddo
 * block. The nameddo blocks are linked into the start stack later, in
 * _finalizeStaffBlocks. Does nothing when no notes were collected.
 *
 * @param {Array} actionBlock - Note blocks of the segment (mutated in place).
 * @param {number} blockId - Current block ID counter.
 * @param {number} voiceNumber - The voice number shown on the imported turtle.
 * @param {object} staffRecord - The localized staff record (mutated in place).
 * @returns {number} newBlockId
 */
function _closeSegment(actionBlock, blockId, voiceNumber, staffRecord) {
    if (actionBlock.length === 0) {
        return blockId;
    }

    // Update the newnote connection with hidden
    actionBlock[0][4][0] = blockId + 3;
    actionBlock[actionBlock.length - 1][4][1] = null;

    const lineLabel = `V: ${voiceNumber} Line ${staffRecord.baseBlocks.length + 1}`;

    // Add the nameddo action text and hidden block for each line
    actionBlock.push(
        [blockId, ["nameddo", { value: lineLabel }], 0, 0, [null, null]],
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
    staffRecord.baseBlocks.push([actionBlock]);

    return blockId + 4;
}

/**
 * Processes one voice: iterates all elements, builds pitch blocks for notes,
 * setkey2 and meter blocks for key and meter changes, and updates repeat
 * markers for bars. The notes become one action block per
 * stretch between repeat bars, so a repeat can start or end mid-line.
 * Voices that produced no note blocks add nothing.
 *
 * Tuplet ratios are tracked per voice and retained across staff lines.
 *
 * @param {Array} voice - The voice element array.
 * @param {number} blockId - Current block ID counter.
 * @param {object} staff - The staff object.
 * @param {number} voiceNumber - The voice number shown on the imported turtle.
 * @param {object} staffRecord - The localized staff record (mutated in place).
 * @param {number} voiceIdx - The voice's index within the staff.
 * @returns {number} newBlockId
 */
function _processVoice(voice, blockId, staff, voiceNumber, staffRecord, voiceIdx) {
    const tuplets = staffRecord.tuplets;
    // An inline accidental holds for the same pitch until the next bar line,
    // but abcjs only sets it on the note that carries the mark. A bar can run
    // across staff lines, so the state lives on the staff record per voice.
    const barAccidentals = staffRecord.barAccidentals;
    if (!barAccidentals[voiceIdx]) {
        barAccidentals[voiceIdx] = {};
    }
    let actionBlock = [];
    // abcjs gives each line the key it starts in, and a [K:] inside the line
    // as a key element that holds from there on. A K: line inside one voice's
    // music changes the line's key without a key element, so compare it here.
    blockId += _createKeyBlocks(staff.key, blockId, actionBlock, staffRecord);

    // A line that starts in a new meter carries it on the staff, not as an element.
    if (staff.meter) {
        blockId += _createMeterBlocks(_meterOf(staff), blockId, actionBlock, staffRecord);
    }

    voice.forEach(element => {
        if (element.el_type === "note") {
            const isSpacerRest = element.rest?.type === "spacer";
            if (element?.startTriplet !== null && element?.startTriplet !== undefined) {
                // abcjs supplies the ratio, including explicit p:q:r tuplets.
                // Apply it to each written duration, independently of the meter.
                tuplets[voiceIdx] = {
                    multiplier: element.tripletMultiplier ?? 1,
                    remaining: element.tripletR ?? element.startTriplet
                };
            }

            // Every note of a chord ([CEG]) is played, each with its own
            // carried accidental; reading pitches[0] alone kept just the first.
            const chord = element.pitches ?? [];
            const accidentals = chord.map(pitch => {
                if (pitch.accidental) {
                    barAccidentals[voiceIdx][pitch.pitch] = pitch.accidental;
                    return pitch.accidental;
                }
                return barAccidentals[voiceIdx][pitch.pitch];
            });

            blockId += _createPitchBlocks(
                chord,
                blockId,
                element.duration * (isSpacerRest ? 1 : (tuplets[voiceIdx]?.multiplier ?? 1)),
                staffRecord.keySignature,
                actionBlock,
                accidentals
            );

            if (tuplets[voiceIdx] && !isSpacerRest) {
                // abcjs can omit endTriplet when the group crosses a staff line.
                tuplets[voiceIdx].remaining--;
                if (element.endTriplet || tuplets[voiceIdx].remaining === 0) {
                    tuplets[voiceIdx] = null;
                }
            }
        } else if (element.el_type === "bar") {
            barAccidentals[voiceIdx] = {};
            if (_ABC_REPEAT_BARS.includes(element.type)) {
                blockId = _closeSegment(actionBlock, blockId, voiceNumber, staffRecord);
                actionBlock = [];
                _handleRepeatBar(element.type, staffRecord);
            }
        } else if (element.el_type === "key") {
            blockId += _createKeyBlocks(element, blockId, actionBlock, staffRecord);
        } else if (element.el_type === "meter") {
            blockId += _createMeterBlocks(
                _meterOf({ meter: element }),
                blockId,
                actionBlock,
                staffRecord
            );
        }
    });

    return _closeSegment(actionBlock, blockId, voiceNumber, staffRecord);
}

/**
 * Links the nameddo blocks under settimbre, wrapping each repeat range in a
 * repeat block, then flattens and pushes the complete staff block data into finalBlock.
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

    // Play the segments in order under settimbre, with each repeat range
    // wrapped in a repeat block that plays it twice.
    const segments = staffRecord.baseBlocks.map(
        ([actionBlock]) => actionBlock[actionBlock.length - 4]
    );
    const stack = [];
    let next = 0;
    for (const { start, end } of staffRecord.repeatArray) {
        stack.push(...segments.slice(next, start));
        const repeat = [blockId, "repeat", 0, 0, [null, blockId + 1, null, null]];
        const count = [blockId + 1, ["number", { value: 2 }], 0, 0, [blockId]];
        staffRecord.repeatBlock.push(repeat, count);
        _chainBlocks(segments.slice(start, end + 1), repeat, 2);
        stack.push(repeat);
        next = end + 1;
        blockId += 2;
    }
    stack.push(...segments.slice(next));
    _chainBlocks(stack, staffRecord.startBlock[staffRecord.startBlock.length - 3], 2);

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
        const voiceBlocks = [];
        let blockId = 0;
        let voiceNumber = 0;
        const title = (tune.metaText?.title ?? "title").toString().toLowerCase();
        const instruction = (tune.metaText?.instruction ?? "guitar").toString().toLowerCase();
        const tempo = _tempoOf(tune.metaText?.tempo);

        const organizedStaffs = _organizeStaffs(tune.lines ?? []);
        Object.keys(organizedStaffs).forEach(staffIdx => {
            const staffVoices = new Map();
            organizedStaffs[staffIdx].arrangedBlocks?.forEach(staff => {
                staff.voices.forEach((voice, voiceIdx) => {
                    if (!staffVoices.has(voiceIdx)) {
                        voiceNumber += 1;
                        const { startBlock, newBlockId } = _buildStartBlock(
                            blockId,
                            staff,
                            title,
                            instruction,
                            voiceNumber,
                            tempo
                        );
                        const staffMeter = _meterOf(staff);
                        staffVoices.set(voiceIdx, {
                            voiceNumber,
                            meterNum: staffMeter.num,
                            meterDen: staffMeter.den,
                            keySignature: staff.key,
                            baseBlocks: [],
                            startBlock,
                            repeatBlock: [],
                            repeatArray: [],
                            repeatStart: null,
                            repeatFrom: 0,
                            nameddoIds: [],
                            barAccidentals: [],
                            tuplets: []
                        });
                        voiceBlocks.push(staffVoices.get(voiceIdx));
                        blockId = newBlockId;
                    }

                    const voiceRecord = staffVoices.get(voiceIdx);
                    blockId = _processVoice(
                        voice,
                        blockId,
                        staff,
                        voiceRecord.voiceNumber,
                        voiceRecord,
                        voiceIdx
                    );
                });
            });
        });

        const finalBlock = [];
        voiceBlocks.forEach(voiceRecord => {
            blockId = _finalizeStaffBlocks(voiceRecord, blockId, finalBlock);
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
