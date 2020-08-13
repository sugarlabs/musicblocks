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
         * Processes and plays a note clamp.
         *
         * @static
         * @param {Number} value - note value
         * @param {String} blkName - note block type name
         * @param {Object} turtle - Turtle object
         * @param {Object} blk - corresponding Block object index in blocks.blockList or custom block number
         * @param {Function} [_enqueue] - callback
         * @returns {void}
         */
        static playNote(value, blkName, turtle, blk, _callback) {
            /**
            * We queue up the child flow of the note clamp and once all of the children are run, we
            * trigger a _playnote_ event, then wait for the note to play. The note can be specified
            * by pitch or synth blocks. The osctime block specifies the duration in milleseconds
            * while the note block specifies duration as a beat value.
            *
            * @todo We should consider the use of the global timer in Tone.js for more accuracy.
            */

            let tur = logo.turtles.ithTurtle(turtle);

            // Use the outer most note when nesting to determine the beat and triggering
            if (tur.singer.inNoteBlock.length === 0) {
                let beatValue, measureValue;
                if (tur.singer.notesPlayed[0] / tur.singer.notesPlayed[1] < tur.singer.pickup) {
                    beatValue = measureValue = 0;
                } else {
                    let beat = tur.singer.noteValuePerBeat * (
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
                let turtleID = tur.id;

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

                let thisBeat =
                    beatValue + tur.singer.beatsPerMeasure * (tur.singer.currentMeasure - 1);
                for (let f = 0; f < tur.singer.factorList.length; f++) {
                    if (thisBeat % tur.singer.factorList[f] === 0) {
                        _enqueue();
                        let eventName =
                            "__beat_" + tur.singer.factorList[f] + "_" + turtleID + "__";
                        logo.stage.dispatchEvent(eventName);
                    }
                }
            }

            // A note can contain multiple pitch blocks to create a chord. The chord is accumuated in
            // arrays, which are used when we play the note
            logo.clearNoteParams(tur, blk, []);

            let noteBeatValue = blkName === "newnote" ? 1 / value : value;

            tur.singer.inNoteBlock.push(blk);
            tur.singer.multipleVoices = tur.singer.inNoteBlock.length > 1 ? true : false;

            // Adjust the note value based on the beatFactor
            tur.singer.noteValue[last(tur.singer.inNoteBlock)] =
                1 / (noteBeatValue * tur.singer.beatFactor);

            let listenerName = "_playnote_" + turtle;
            if (blk !== undefined && blk in blocks.blockList)
                logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = event => {
                if (tur.singer.multipleVoices) {
                    logo.notation.notationVoices(turtle, tur.singer.inNoteBlock.length);
                }

                if (tur.singer.inNoteBlock.length > 0) {
                    if (tur.singer.inNeighbor.length > 0) {
                        tur.singer.neighborArgBeat.push(
                            tur.singer.beatFactor * (1 / tur.singer.neighborNoteValue)
                        );

                        let nextBeat = 1 / noteBeatValue - 2 * tur.singer.neighborNoteValue;
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
    }
}
