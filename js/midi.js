// Copyright (c) 2023-24 Mubashirshariq
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// Midi Importer

/* exported  transcribeMidi*/

// A MIDI file with no tempo event plays at 120 beats per minute, the MIDI default, which is
// also the tempo @tonejs/midi assumes when it times the file's notes.
const defaultTempo = 120;

// Note values an imported note can take, in whole notes. Plain values come first, so a length
// exactly between two values keeps the plain one. Dotted values stop at 3/32 and triplets at
// 1/12: shorter ones sit so close to the plain values that a note played slightly short, or the
// 0.01 s rounding of note times, would snap it to the wrong one.
const standardDurations = [
    { value: "1/1", duration: 1 },
    { value: "1/2", duration: 0.5 },
    { value: "1/4", duration: 0.25 },
    { value: "1/8", duration: 0.125 },
    { value: "1/16", duration: 0.0625 },
    { value: "1/32", duration: 0.03125 },
    { value: "1/64", duration: 0.015625 },
    { value: "1/128", duration: 0.0078125 },
    // dotted
    { value: "3/2", duration: 1.5 },
    { value: "3/4", duration: 0.75 },
    { value: "3/8", duration: 0.375 },
    { value: "3/16", duration: 0.1875 },
    { value: "3/32", duration: 0.09375 },
    // triplets
    { value: "1/3", duration: 1 / 3 },
    { value: "1/6", duration: 1 / 6 },
    { value: "1/12", duration: 1 / 12 }
];

/**
 * Splits a MIDI note name into its pitch and octave, e.g. "C#4" into ["C#", 4]. The octave can
 * be negative: MIDI notes 0 to 11 are in octave -1.
 * @param {string} name
 * @returns {[string, number]}
 */
const splitNoteName = name => {
    const match = /^(.*?)(-?\d+)$/.exec(name);
    return match
        ? [match[1], parseInt(match[2], 10)]
        : [name.substring(0, name.length - 1), parseInt(name[name.length - 1], 10)];
};

const getClosestStandardNoteValue = duration => {
    let closest = standardDurations[0];
    let minDiff = Math.abs(duration - closest.duration);

    for (let i = 1; i < standardDurations.length; i++) {
        const diff = Math.abs(duration - standardDurations[i].duration);
        if (diff < minDiff) {
            closest = standardDurations[i];
            minDiff = diff;
        }
    }

    return closest.value.split("/").map(Number);
};

/**
 * Seconds at a tick under MIDI timing, where 120 beats per minute applies until the first
 * tempo event.
 * @param {number} ticks
 * @param {Array<{ticks: number, bpm: number}>} tempos - midi.header.tempos, in tick order
 * @param {number} ppq - ticks per quarter note
 * @returns {number}
 */
const midiTicksToSeconds = (ticks, tempos, ppq) => {
    let seconds = 0;
    let lastTicks = 0;
    let bpm = defaultTempo;
    for (const tempo of tempos) {
        if (tempo.ticks >= ticks) break;
        seconds += ((tempo.ticks - lastTicks) / ppq) * (60 / bpm);
        lastTicks = tempo.ticks;
        bpm = tempo.bpm;
    }
    return seconds + ((ticks - lastTicks) / ppq) * (60 / bpm);
};

const transcribeMidi = async (midi, maxNoteBlocks) => {
    const currentMidi = midi;
    const drumMidi = getReverseDrumMidi();
    const isPercussion = [];
    const jsONON = [];
    let actionBlockCounter = 0; // Counter for action blocks
    const actionBlockNames = []; // Array to store action block names
    let totalnoteblockCount = 0; // Initialize noteblock counter
    let noteblockCount = 0;
    let shortestNoteDenominator = 0;
    let offset = 100;
    let stopProcessing = false;
    let trackCount = 0;
    const actionBlockPerTrack = [];
    const instruments = [];
    const tempos = currentMidi.header.tempos || [];
    // The project plays at the tempo in force when the file starts, which is 120 bpm until
    // the first tempo event.
    const firstTempoIsDelayed = tempos.length > 0 && tempos[0].ticks > 0;
    const currentMidiTempoBpm =
        tempos.length > 0 && !firstTempoIsDelayed ? Math.round(tempos[0].bpm) : defaultTempo;

    // Every note and rest is written relative to that one tempo, so it plays for as long as
    // it does in the file, including after the file changes tempo.
    const wholeNotesAt = seconds => (seconds * currentMidiTempoBpm) / 240;

    // @tonejs/midi times notes before a delayed first tempo event at 120 bpm, but times the
    // event itself as if its tempo applied from the start, shifting every note after it. For
    // such files notes are timed from their ticks instead.
    const noteSeconds = note =>
        firstTempoIsDelayed && Number.isFinite(note.ticks)
            ? [
                  midiTicksToSeconds(note.ticks, tempos, currentMidi.header.ppq),
                  midiTicksToSeconds(
                      note.ticks + note.durationTicks,
                      tempos,
                      currentMidi.header.ppq
                  )
              ]
            : [note.time, note.time + note.duration];

    const defaultTimeSignature = [4, 4];
    let currentMidiTimeSignature = currentMidi.header.timeSignatures;
    if (currentMidiTimeSignature && currentMidiTimeSignature.length > 0) {
        currentMidiTimeSignature = currentMidiTimeSignature[0].timeSignature;
    } else {
        currentMidiTimeSignature = defaultTimeSignature;
    }

    // console.log("tempoBpm is: ", currentMidiTempoBpm);
    // console.log("tempo is : ",currentMidi.header.tempos);
    // console.log("time signatures are: ", currentMidi.header.timeSignatures);
    currentMidi.tracks.forEach((track, trackIndex) => {
        let k = 0;
        if (stopProcessing) return; // Exit if flag is set
        if (!track.notes.length) return;
        const r = jsONON.length;
        const isPercussionTrack =
            track.instrument.percussion && (track.channel === 9 || track.channel === 10);
        let instrument = "electronic synth";
        if (track.instrument.name && !track.instrument.percussion) {
            for (const voices of VOICENAMES) {
                if (track.instrument.name.indexOf(voices[1]) > -1) {
                    instrument = voices[0];
                }
            }
        }
        actionBlockPerTrack[trackCount] = 0;
        instruments[trackCount] = instrument;

        const actionBlockName = `track${trackCount}chunk${actionBlockCounter}`;

        jsONON.push(
            [r, ["action", { collapsed: false }], 150, 100, [null, r + 1, r + 2, null]],
            [r + 1, ["text", { value: actionBlockName }], 0, 0, [r]]
        );

        const sched = [];
        isPercussion.push(isPercussionTrack);

        track.notes.forEach((note, index) => {
            const [noteStart, noteEnd] = noteSeconds(note);
            const start = Math.round(noteStart * 100) / 100;
            const end = Math.round(noteEnd * 100) / 100;

            if (note.duration === 0) return;

            const lastNote = sched[sched.length - 1];

            if (index === 0 && start > 0) {
                sched.push({ start: 0, end: start, notes: [{ name: "R" }] });
            }

            if (lastNote && lastNote.start === start && lastNote.end === end) {
                lastNote.notes.push(note);
                return;
            }

            if (lastNote && lastNote.start <= start && lastNote.end > start) {
                const prevNotes = [...lastNote.notes];
                const oldEnd = lastNote.end;

                lastNote.end = start;

                sched.push({ start: start, end: end, notes: [...prevNotes, note] });

                if (oldEnd > end) {
                    sched.push({ start: end, end: oldEnd, notes: prevNotes });
                }
                return;
            }

            if (lastNote && lastNote.end < start) {
                sched.push({ start: lastNote.end, end: start, notes: [{ name: "R" }] });
            }

            sched.push({ start: start, end: end, notes: [note] });
        });

        let noteSum = 0;
        let currentActionBlock = [];

        const addNewActionBlock = (isLastBlock = false) => {
            const r = jsONON.length;
            const actionBlockName = `track${trackCount}chunk${actionBlockCounter}`;
            actionBlockNames.push(actionBlockName);
            actionBlockPerTrack[trackCount]++;
            if (k === 0) {
                jsONON.push(...currentActionBlock);
                k = 1;
            } else {
                const settimbreIndex = r;
                // Adjust the first note block's top connection to settimbre
                currentActionBlock[0][4][0] = settimbreIndex;
                jsONON.push(
                    [
                        r,
                        ["action", { collapsed: false }],
                        100 + offset,
                        100 + offset,
                        [null, r + 1, settimbreIndex + 2, null]
                    ],
                    [r + 1, ["text", { value: actionBlockName }], 0, 0, [r]],
                    ...currentActionBlock
                );
            }
            if (isLastBlock) {
                const lastIndex = jsONON.length - 1;
                // Set the last hidden block's second value to null
                jsONON[lastIndex][4][1] = null;
            }

            currentActionBlock = [];
            actionBlockCounter++;
            offset += 100;
        };
        //Using for loop for finding the shortest note value
        for (const j in sched) {
            const temp = getClosestStandardNoteValue(wholeNotesAt(sched[j].end - sched[j].start));
            shortestNoteDenominator = Math.max(shortestNoteDenominator, temp[1]);
        }

        // Indexed loop, not `for...in`: `for...in` yields string keys, so the
        // `i === 0` and `i === sched.length - 1` comparisons below would never
        // be true and every note would be treated as neither first nor last.
        for (let i = 0; i < sched.length; i++) {
            if (stopProcessing) break; // Exit inner loop if flag is set
            const { notes, start, end } = sched[i];
            const duration = end - start;
            noteSum += duration;
            const isLastNoteInBlock =
                noteSum >= 16 || (noteblockCount > 0 && noteblockCount % 24 === 0);
            if (isLastNoteInBlock) {
                totalnoteblockCount += noteblockCount;
                noteblockCount = 0;
                noteSum = 0;
            }
            const isLastNoteInSched = i === sched.length - 1;
            const last = isLastNoteInBlock || isLastNoteInSched;
            const first = i === 0;
            let val = jsONON.length + currentActionBlock.length;
            const getPitch = (x, notes, prev) => {
                const ar = [];
                if (notes[0].name === "R") {
                    ar.push([x, "rest2", 0, 0, [prev, null]]);
                } else if (isPercussionTrack) {
                    const drumname = drumMidi[notes[0].midi]?.[0] || "kick drum";
                    ar.push(
                        [x, "playdrum", 0, 0, [first ? prev : x - 1, x + 1, null]],
                        [x + 1, ["drumname", { value: drumname }], 0, 0, [x]]
                    );
                    x += 2;
                } else {
                    // Indexed loop for the same reason as the `sched` loop above:
                    // `na` has to be a number for these comparisons to hold.
                    for (let na = 0; na < notes.length; na++) {
                        const [pitchName, octave] = splitNoteName(notes[na].name);
                        const first = na === 0;
                        const last = na === notes.length - 1;
                        ar.push(
                            [
                                x,
                                "pitch",
                                0,
                                0,
                                [first ? prev : x - 3, x + 1, x + 2, last ? null : x + 3]
                            ],
                            [x + 1, ["notename", { value: pitchName }], 0, 0, [x]],
                            [x + 2, ["number", { value: octave }], 0, 0, [x]]
                        );
                        x += 3;
                    }
                }
                return ar;
            };
            let obj = getClosestStandardNoteValue(wholeNotesAt(duration));
            // let scalingFactor=1;
            // if(shortestNoteDenominator>32)
            // scalingFactor=shortestNoteDenominator/32;

            // if(obj[1]>=scalingFactor)
            // obj[1]=obj[1]/scalingFactor;
            // else
            // obj[0]=obj[0]*scalingFactor;

            // To get the reduced fraction for 4/2 to 2/1
            obj = getClosestStandardNoteValue(obj[0] / obj[1]);

            // Since we are going to add action block in the front later
            if (k !== 0) val = val + 2;
            const pitches = getPitch(val + 5, notes, val);
            currentActionBlock.push(
                [
                    val,
                    ["newnote", { collapsed: true }],
                    0,
                    0,
                    [first ? val - 2 : val - 1, val + 1, val + 4, val + pitches.length + 5]
                ],
                [val + 1, "divide", 0, 0, [val, val + 2, val + 3]],
                [val + 2, ["number", { value: obj[0] }], 0, 0, [val + 1]],
                [val + 3, ["number", { value: obj[1] }], 0, 0, [val + 1]],
                [val + 4, "vspace", 0, 0, [val, val + 5]]
            );
            noteblockCount++;
            pitches[0][4][0] = val + 4;
            currentActionBlock = currentActionBlock.concat(pitches);

            let newLen = jsONON.length + currentActionBlock.length;
            if (k !== 0) newLen = newLen + 2;
            currentActionBlock.push([newLen, "hidden", 0, 0, [val, last ? null : newLen + 1]]);
            if (isLastNoteInBlock || isLastNoteInSched) {
                addNewActionBlock(isLastNoteInSched);
            }

            if (totalnoteblockCount >= maxNoteBlocks) {
                activity.textMsg(
                    `MIDI file is too large. Generating only ${maxNoteBlocks} noteblocks`
                );
                stopProcessing = true;
                break;
            }
        }

        if (currentActionBlock.length > 0) {
            addNewActionBlock(true);
        }

        trackCount++;
        // console.log("current action block: ", currentActionBlock);
        // console.log("current json: ", jsONON);
        // console.log("noteblockCount: ", noteblockCount);
        // console.debug('finished when you see: "block loading finished "');
        document.body.style.cursor = "wait";
    });

    const len = jsONON.length;
    let m = 0;
    let actionIndex = 0;

    for (let i = 0; i < trackCount; i++) {
        const vspaceIndex = len + m + 6;
        const startIndex = len + m;
        let flag = true;

        if (isPercussion[i]) {
            jsONON.push(
                [
                    len + m,
                    ["start", { collapsed: false }],
                    300 + offset,
                    100,
                    [null, len + m + 14 + actionBlockPerTrack[i], null]
                ],
                [
                    len + m + 1,
                    "meter",
                    0,
                    0,
                    [len + m + 14 + actionBlockPerTrack[i], len + m + 2, len + m + 3, len + m + 6]
                ],
                [
                    len + m + 2,
                    ["number", { value: currentMidiTimeSignature[0] }],
                    0,
                    0,
                    [len + m + 1]
                ],
                [len + m + 3, "divide", 0, 0, [len + m + 1, len + m + 4, len + m + 5]],
                [len + m + 4, ["number", { value: 1 }], 0, 0, [len + m + 3]],
                [
                    len + m + 5,
                    ["number", { value: currentMidiTimeSignature[1] }],
                    0,
                    0,
                    [len + m + 3]
                ],
                [len + m + 6, "vspace", 0, 0, [len + m + 1, len + m + 8 + actionBlockPerTrack[i]]],
                [len + m + 7, "hidden", 0, 0, [len + m + 13 + actionBlockPerTrack[i], len + m + 8]]
            );
            flag = false;
            m += 8;
        } else {
            jsONON.push(
                [
                    len + m,
                    ["start", { collapsed: false }],
                    300 + offset,
                    100,
                    [null, len + m + 16 + actionBlockPerTrack[i], null]
                ],
                [
                    len + m + 1,
                    "meter",
                    0,
                    0,
                    [len + m + 16 + actionBlockPerTrack[i], len + m + 2, len + m + 3, len + m + 6]
                ],
                [
                    len + m + 2,
                    ["number", { value: currentMidiTimeSignature[0] }],
                    0,
                    0,
                    [len + m + 1]
                ],
                [len + m + 3, "divide", 0, 0, [len + m + 1, len + m + 4, len + m + 5]],
                [len + m + 4, ["number", { value: 1 }], 0, 0, [len + m + 3]],
                [
                    len + m + 5,
                    ["number", { value: currentMidiTimeSignature[1] }],
                    0,
                    0,
                    [len + m + 3]
                ],
                [len + m + 6, "vspace", 0, 0, [len + m + 1, len + m + 10 + actionBlockPerTrack[i]]],
                [
                    len + m + 7,
                    "settimbre",
                    0,
                    0,
                    [len + m + 15 + actionBlockPerTrack[i], len + m + 8, len + m + 10, len + m + 9]
                ],
                [len + m + 8, ["voicename", { value: instruments[i] }], 0, 0, [len + m + 7]],
                [len + m + 9, "hidden", 0, 0, [len + m + 7, null]]
            );
            m += 10;
        }

        for (let j = 0; j < actionBlockPerTrack[i]; j++) {
            jsONON.push([
                len + m,
                ["nameddo", { value: actionBlockNames[actionIndex] }],
                0,
                0,
                [flag ? len + m - 3 : len + m - 1, len + m + 1]
            ]);
            m++;
            flag = false;
            actionIndex++;
        }
        jsONON[len + m - 1][4][1] = null;
        const setBpmIndex = jsONON.length;
        jsONON.push(
            [
                setBpmIndex,
                ["setbpm3"],
                0,
                0,
                [vspaceIndex, setBpmIndex + 1, setBpmIndex + 2, setBpmIndex + 5]
            ],
            // A MIDI tempo counts quarter notes per minute, while this block counts beats
            // of the time signature's note value (see MeterActions.setBPM).
            [
                setBpmIndex + 1,
                ["number", { value: (currentMidiTempoBpm * currentMidiTimeSignature[1]) / 4 }],
                0,
                0,
                [setBpmIndex]
            ],
            [setBpmIndex + 2, "divide", 0, 0, [setBpmIndex, setBpmIndex + 3, setBpmIndex + 4]],
            [setBpmIndex + 3, ["number", { value: 1 }], 0, 0, [setBpmIndex + 2]],
            [
                setBpmIndex + 4,
                ["number", { value: currentMidiTimeSignature[1] }],
                0,
                0,
                [setBpmIndex + 2]
            ],
            [setBpmIndex + 5, "vspace", 0, 0, [setBpmIndex, vspaceIndex + 1]]
        );
        m += 6;
        jsONON.push(
            [len + m, "setturtlename2", 0, 0, [startIndex, len + m + 1, startIndex + 1]],
            [len + m + 1, ["text", { value: `track${i}` }], 0, 0, [len + m]]
        );
        m += 2;
    }

    activity.blocks.loadNewBlocks(jsONON);
    // this.textMsg("MIDI import is not currently precise. Consider changing the speed with the Beats Per Minute block or modifying note value with the Multiply Note Value block");
    return null;
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = { getClosestStandardNoteValue, transcribeMidi };
}
