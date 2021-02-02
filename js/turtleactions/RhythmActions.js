/**
 * @file This contains the action methods of the Turtle's Singer component's Rhythm blocks.
 * @author Anindya Kundu
 * @author Walter Bender
 *
 * @copyright 2014-2020 Walter Bender
 * @copyright 2020 Anindya Kundu
 *
 * @license
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * The GNU Affero General Public License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public License along with this
 * library; if not, write to the Free Software Foundation, 51 Franklin Street, Suite 500 Boston,
 * MA 02110-1335 USA.
*/

/**
 * Sets up all the methods related to different actions for each block in Rhythm palette.
 *
 * @returns {void}
 */
function setupRhythmActions() {
    Singer.RhythmActions = class {
        /**
         * "note" block, "milliseconds" block.
         * Processes and plays a note clamp.
         *
         * @static
         * @param {Number} value - note value
         * @param {String} blkName - note block type name
         * @param {Object} turtle - Turtle object
         * @param {Object} blk - corresponding Block object index in blocks.blockList or custom block number
         * @param {Function} _enqueue - callback
         * @returns {void}
         */
        static playNote(value, blkName, turtle, blk, _enqueue) {
            /**
            * We queue up the child flow of the note clamp and once all of the children are run, we
            * trigger a _playnote_ event, then wait for the note to play. The note can be specified
            * by pitch or synth blocks. The osctime block specifies the duration in milleseconds
            * while the note block specifies duration as a beat value.
            *
            * @todo We should consider the use of the global timer in Tone.js for more accuracy.
            */

            const tur = logo.turtles.ithTurtle(turtle);

            // Use the outer most note when nesting to determine the beat and triggering
            if (tur.singer.inNoteBlock.length === 0) {
                let beatValue, measureValue;
                if (tur.singer.notesPlayed[0] / tur.singer.notesPlayed[1] < tur.singer.pickup) {
                    beatValue = measureValue = 0;
                } else {
                    const beat = tur.singer.noteValuePerBeat * (
                        tur.singer.notesPlayed[0] / tur.singer.notesPlayed[1] - tur.singer.pickup
                    );
                    beatValue = 1 + beat % tur.singer.beatsPerMeasure;
                    measureValue = 1 + Math.floor(beat / tur.singer.beatsPerMeasure);
                }

                tur.singer.currentBeat = beatValue;
                tur.singer.currentMeasure = measureValue;

                /**
                 * Queue any beat actions.
                 * Put the childFlow into the queue before the beat action so logo the beat action is
                 * at the end of the FILO.
                 * Note: The offbeat cannot be Beat 1.
                */
                const turtleID = tur.id;

                if (tur.singer.beatList.indexOf("everybeat") !== -1) {
                    _enqueue();
                    logo.stage.dispatchEvent("__everybeat_" + turtleID + "__");
                }

                if (tur.singer.beatList.indexOf(beatValue) !== -1) {
                    _enqueue();
                    logo.stage.dispatchEvent("__beat_" + beatValue + "_" + turtleID + "__");
                } else if (beatValue > 1 && tur.singer.beatList.indexOf("offbeat") !== -1) {
                    _enqueue();
                    logo.stage.dispatchEvent("__offbeat_" + turtleID + "__");
                }

                const thisBeat =
                    beatValue + tur.singer.beatsPerMeasure * (tur.singer.currentMeasure - 1);
                for (let f = 0; f < tur.singer.factorList.length; f++) {
                    if (thisBeat % tur.singer.factorList[f] === 0) {
                        _enqueue();
                        const eventName =
                            "__beat_" + tur.singer.factorList[f] + "_" + turtleID + "__";
                        logo.stage.dispatchEvent(eventName);
                    }
                }
            }

            // A note can contain multiple pitch blocks to create a chord. The chord is accumuated in
            // arrays, which are used when we play the note
            logo.clearNoteParams(tur, blk, []);

            const noteBeatValue = blkName === "newnote" ? 1 / value : value;

            tur.singer.inNoteBlock.push(blk);
            tur.singer.multipleVoices = tur.singer.inNoteBlock.length > 1 ? true : false;

            // Adjust the note value based on the beatFactor
            tur.singer.noteValue[last(tur.singer.inNoteBlock)] =
                1 / (noteBeatValue * tur.singer.beatFactor);

            const listenerName = "_playnote_" + turtle;
            if (blk !== undefined && blk in blocks.blockList) {
                logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null)
                    mouse.MB.listeners.push(listenerName);
            }

            const __listener = event => {
                if (tur.singer.multipleVoices) {
                    logo.notation.notationVoices(turtle, tur.singer.inNoteBlock.length);
                }

                if (tur.singer.inNoteBlock.length > 0) {
                    if (tur.singer.inNeighbor.length > 0) {
                        tur.singer.neighborArgBeat.push(
                            tur.singer.beatFactor * (1 / tur.singer.neighborNoteValue)
                        );

                        const nextBeat = 1 / noteBeatValue - 2 * tur.singer.neighborNoteValue;
                        tur.singer.neighborArgCurrentBeat.push(
                            tur.singer.beatFactor * (1 / nextBeat)
                        );
                    }

                    Singer.processNote(
                        1 / tur.singer.noteValue[last(tur.singer.inNoteBlock)],
                        blkName === "osctime",
                        last(tur.singer.inNoteBlock),
                        turtle
                    );
                }

                delete tur.singer.oscList[last(tur.singer.inNoteBlock)];
                delete tur.singer.noteBeat[last(tur.singer.inNoteBlock)];
                delete tur.singer.noteBeatValues[last(tur.singer.inNoteBlock)];
                delete tur.singer.noteValue[last(tur.singer.inNoteBlock)];
                delete tur.singer.notePitches[last(tur.singer.inNoteBlock)];
                delete tur.singer.noteOctaves[last(tur.singer.inNoteBlock)];
                delete tur.singer.noteCents[last(tur.singer.inNoteBlock)];
                delete tur.singer.noteHertz[last(tur.singer.inNoteBlock)];
                delete tur.singer.noteDrums[last(tur.singer.inNoteBlock)];
                delete tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)];
                tur.singer.inNoteBlock.splice(-1, 1);

                if (tur.singer.multipleVoices && tur.singer.inNoteBlock.length === 0) {
                    logo.notation.notationVoices(turtle, 0);
                    tur.singer.multipleVoices = false;
                }

                /** @todo FIXME: broken when nesting */
                logo.pitchBlocks = [];
                logo.drumBlocks = [];
            };

            logo.setTurtleListener(turtle, listenerName, __listener);
        }

        /**
         * "silence" block.
         * Plays a rest.
         *
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @returns {void}
         */
        static playRest(turtle) {
            const tur = logo.turtles.ithTurtle(turtle);

            if (tur.singer.inNoteBlock.length > 0) {
                tur.singer.notePitches[last(tur.singer.inNoteBlock)].push("rest");
                tur.singer.noteOctaves[last(tur.singer.inNoteBlock)].push(4);
                tur.singer.noteCents[last(tur.singer.inNoteBlock)].push(0);
                tur.singer.noteHertz[last(tur.singer.inNoteBlock)].push(0);
                tur.singer.noteBeatValues[last(tur.singer.inNoteBlock)].push(
                    tur.singer.beatFactor
                );
                tur.singer.pushedNote = true;
            }
        }

        /**
         * "dot" block.
         * Extends the duration of a note by 50%.
         *
         * @param {Number} value - dot value
         * @param {Object} turtle - Turtle object
         * @param {Object} blk - corresponding Block object index in blocks.blockList or custom block number
         * @returns {void}
         */
        static doRhythmicDot(value, turtle, blk) {
            const tur = logo.turtles.ithTurtle(turtle);
            const currentDotFactor = 2 - 1 / Math.pow(2, tur.singer.dotCount);
            tur.singer.beatFactor *= currentDotFactor;
            if (value >= 0) {
                tur.singer.dotCount += value;
            } else if (value === -1) {
                logo.errorMsg(_("An argument of -1 results in a note value of 0."), blk);
                value = 0;
            } else {
                tur.singer.dotCount += 1 / value;
            }

            const newDotFactor = 2 - 1 / Math.pow(2, tur.singer.dotCount);
            tur.singer.beatFactor /= newDotFactor;

            const listenerName = "_dot_" + turtle;
            if (blk !== undefined && blk in blocks.blockList) {
                logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null)
                    mouse.MB.listeners.push(listenerName);
            }

            const __listener = event => {
                const currentDotFactor = 2 - 1 / Math.pow(2, tur.singer.dotCount);
                tur.singer.beatFactor *= currentDotFactor;
                tur.singer.dotCount -= value >= 0 ? value : 1 / value;
                const newDotFactor = 2 - 1 / Math.pow(2, tur.singer.dotCount);
                tur.singer.beatFactor /= newDotFactor;
            };

            logo.setTurtleListener(turtle, listenerName, __listener);
        }

        /**
         * "tie" block.
         * Works on pairs of notes, combining them into one note.
         *
         * @param {Object} turtle - Turtle object
         * @param {Object} blk - corresponding Block object index in blocks.blockList or custom block number
         * @returns {void}
         */
        static doTie(turtle, blk) {
            const tur = logo.turtles.ithTurtle(turtle);

            // Tie notes together in pairs
            tur.singer.tie = true;
            tur.singer.tieNotePitches = [];
            tur.singer.tieNoteExtras = [];
            tur.singer.tieCarryOver = 0;
            tur.singer.tieFirstDrums = [];

            const listenerName = "_tie_" + turtle;
            if (blk !== undefined && blk in blocks.blockList) {
                logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null)
                    mouse.MB.listeners.push(listenerName);
            }

            const __listener = event => {
                tur.singer.tie = false;

                // If tieCarryOver > 0, we have one more note to play
                if (tur.singer.tieCarryOver > 0) {
                    if (tur.singer.justCounting.length === 0) {
                        const lastNote = last(tur.singer.inNoteBlock);
                        if (lastNote != null && lastNote in tur.singer.notePitches) {
                            // Remove the note from the Lilypond list
                            for (
                                let i = 0;
                                i < tur.singer.notePitches[last(tur.singer.inNoteBlock)].length;
                                i++
                            ) {
                                logo.notation.notationRemoveTie(turtle);
                            }
                        }
                    }

                    // Restore the extra note and play it
                    const saveBlk = tur.singer.tieNoteExtras[0];
                    const noteValue = tur.singer.tieCarryOver;
                    tur.singer.tieCarryOver = 0;

                    tur.singer.inNoteBlock.push(saveBlk);

                    tur.singer.notePitches[saveBlk] = [];
                    tur.singer.noteOctaves[saveBlk] = [];
                    tur.singer.noteCents[saveBlk] = [];
                    tur.singer.noteHertz[saveBlk] = [];
                    for (let i = 0; i < tur.singer.tieNotePitches.length; i++) {
                        tur.singer.notePitches[saveBlk].push(tur.singer.tieNotePitches[i][0]);
                        tur.singer.noteOctaves[saveBlk].push(tur.singer.tieNotePitches[i][1]);
                        tur.singer.noteCents[saveBlk].push(tur.singer.tieNotePitches[i][2]);
                        tur.singer.noteHertz[saveBlk].push(tur.singer.tieNotePitches[i][3]);
                    }

                    tur.singer.oscList[saveBlk] = tur.singer.tieNoteExtras[1];
                    tur.singer.noteBeat[saveBlk] = tur.singer.tieNoteExtras[2];
                    tur.singer.noteBeatValues[saveBlk] = tur.singer.tieNoteExtras[3];
                    tur.singer.noteDrums[saveBlk] = tur.singer.tieNoteExtras[4];
                    tur.singer.embeddedGraphics[saveBlk] = [];  // graphics will have already been rendered

                    Singer.processNote(
                        noteValue, blocks.blockList[saveBlk].name === "osctime", saveBlk, turtle
                    );
                    const bpmFactor =
                        TONEBPM / tur.singer.bpm.length > 0 ?
                            last(tur.singer.bpm) : Singer.masterBPM;

                    // Wait until this note is played before continuing
                    tur.doWait(bpmFactor / noteValue);

                    tur.singer.inNoteBlock.pop();

                    delete tur.singer.notePitches[saveBlk];
                    delete tur.singer.noteOctaves[saveBlk];
                    delete tur.singer.noteCents[saveBlk];
                    delete tur.singer.noteHertz[saveBlk];
                    delete tur.singer.oscList[saveBlk];
                    delete tur.singer.noteBeat[saveBlk];
                    delete tur.singer.noteBeatValues[saveBlk];
                    delete tur.singer.noteDrums[saveBlk];
                    delete tur.singer.embeddedGraphics[saveBlk];

                    // Remove duplicate note
                    logo.notation.notationStaging[turtle].pop();
                }

                tur.singer.tieNotePitches = [];
                tur.singer.tieNoteExtras = [];
            };

            logo.setTurtleListener(turtle, listenerName, __listener);
        }

        /**
         * "multiply note value" block.
         * Changes the duration of notes by changing their note values.
         *
         * @param {Number} factor - multiply factor
         * @param {Object} turtle - Turtle object
         * @param {Object} blk - corresponding Block object index in blocks.blockList or custom block number
         * @returns {void}
         */
        static multiplyNoteValue(factor, turtle, blk) {
            const tur = turtles.ithTurtle(turtle);

            tur.singer.beatFactor /= factor;

            const listenerName = "_multiplybeat_" + turtle;
            if (blk !== undefined && blk in blocks.blockList) {
                logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null)
                    mouse.MB.listeners.push(listenerName);
            }

            const __listener = event => tur.singer.beatFactor *= factor;

            logo.setTurtleListener(turtle, listenerName, __listener);
        }

        /**
         * "swing" block.
         * Works on pairs of notes (specified by note value), adding some duration (specified by swing value)
         * to the first note and taking the same amount from the second note.
         *
         * @param {Number} swingValue - swing value
         * @param {Number} noteValue - target note value
         * @param {Object} turtle - Turtle object
         * @param {Object} blk - corresponding Block object index in blocks.blockList or custom block number
         * @returns {void}
         */
        static addSwing(swingValue, noteValue, turtle, blk) {
            const tur = logo.turtles.ithTurtle(turtle);

            if (tur.singer.suppressOutput) {
                logo.notation.notationSwing(turtle);
            } else {
                tur.singer.swing.push(1 / swingValue);
                tur.singer.swingTarget.push(1 / noteValue);
            }

            tur.singer.swingCarryOver = 0;

            const listenerName = "_swing_" + turtle;
            if (blk !== undefined && blk in blocks.blockList) {
                logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null)
                    mouse.MB.listeners.push(listenerName);
            }

            const __listener = event => {
                if (!tur.singer.suppressOutput) {
                    tur.singer.swingTarget.pop();
                    tur.singer.swing.pop();
                }

                tur.singer.swingCarryOver = 0;
            };

            logo.setTurtleListener(turtle, listenerName, __listener);
        }

        /**
         * "note value" block.
         * Returns the value of the duration of the note currently being played.
         *
         * @param {Number} turtle - Turtle index in turtles.turtleList.
         * @returns {Number} note value
         */
        static getNoteValue(turtle) {
            const tur = logo.turtles.ithTurtle(turtle);

            let value = 0;
            if (
                tur.singer.noteValue[last(tur.singer.inNoteBlock)] !== null &&
                tur.singer.noteValue[last(tur.singer.inNoteBlock)] !== undefined
            ) {
                value =
                    tur.singer.noteValue[last(tur.singer.inNoteBlock)] !== 0 ?
                        1 / tur.singer.noteValue[last(tur.singer.inNoteBlock)] : 0;
            } else if (tur.singer.lastNotePlayed !== null) {
                value = tur.singer.lastNotePlayed[1];
            } else if (
                tur.singer.notePitches[last(tur.singer.inNoteBlock)] !== undefined &&
                tur.singer.notePitches[last(tur.singer.inNoteBlock)].length > 0
            ) {
                value = tur.singer.noteBeat[last(tur.singer.inNoteBlock)];
            } else {
                console.debug("Cannot find a note for turtle " + turtle);
                value = 0;
            }

            return value !== 0 ? 1 / value : 0;
        }
    };
}
