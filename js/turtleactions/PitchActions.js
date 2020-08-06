/**
 * @file This contains the action methods of the Turtle's Singer component's Pitch blocks.
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
 * Sets up all the methods related to different actions for each block in Pitch palette.
 *
 * @returns {void}
 */
function setupPitchActions() {
    Singer.PitchActions = class {
        /**
         * Processes (and/or plays) a pitch.
         *
         * @param {String} notenote - note value or solfege
         * @param {Number} octave - scale octave
         * @param {Number} cents - semitone offset due to accidentals
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number|String} blk - corresponding Block object index in blocks.blockList or custom blockName
         */
        static playPitch(note, octave, cents, turtle, blk) {
            return Singer.processPitch(note, octave, cents, turtle, blk);
        }

        /**
         * Processes a pitch number block.
         *
         * @param {Number} pitchNumber - pitch number
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number|String} blk - corresponding Block object index in blocks.blockList or custom blockName
         */
        static playPitchNumber(pitchNumber, turtle, blk) {
            let tur = logo.turtles.ithTurtle(turtle);

            if (tur.singer.inDefineMode) {
                tur.singer.defineMode.push(pitchNumber);
                return;
            } else {
                if (
                    isCustom(logo.synth.inTemperament) &&
                    tur.singer.scalarTransposition + tur.singer.transposition !== 0
                ) {
                    logo.errorMsg(
                        _(
                            "Scalar transpositions are equal to Semitone transpositions for custom temperament."
                        )
                    );
                }

                // In number to pitch we assume A0 == 0, so add offset
                let obj = numberToPitch(
                    pitchNumber + tur.singer.pitchNumberOffset,
                    logo.synth.inTemperament,
                    logo.synth.startingPitch,
                    tur.singer.pitchNumberOffset
                );

                return Singer.processPitch(obj[0], obj[1], 0, turtle, blk);
            }
        }

        /**
         * Processes a hertz block.
         *
         * @param {Number} hertz - frequency in hertz
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @throws {String} No Note Error
         */
        static playHertz(hertz, turtle) {
            let tur = logo.turtles.ithTurtle(turtle);

            let obj = frequencyToPitch(hertz);
            let note = obj[0];
            let octave = obj[1];
            let cents = obj[2];
            let delta = 0;

            if (tur.singer.justMeasuring.length > 0) {
                // TODO: account for cents
                let noteObj = getNote(
                    note,
                    octave,
                    0,
                    tur.singer.keySignature,
                    tur.singer.moveable,
                    null,
                    logo.errorMsg
                );

                let n = tur.singer.justMeasuring.length;
                let pitchNumber =
                    pitchToNumber(noteObj[0], noteObj[1], tur.singer.keySignature) -
                    tur.singer.pitchNumberOffset;
                if (tur.singer.firstPitch.length < n) {
                    tur.singer.firstPitch.push(pitchNumber);
                } else if (tur.singer.lastPitch.length < n) {
                    tur.singer.lastPitch.push(pitchNumber);
                }
            } else if (tur.singer.inNoteBlock.length > 0) {
                if (!(tur.singer.invertList.length === 0)) {
                    delta += Singer.calculateInvert(logo, turtle, note, octave);
                }

                let addPitch = (note, octave, cents, frequency, direction) => {
                    let t = 2 * delta + tur.transposition + tur.singer.register * 12;
                    let noteObj = getNote(
                        note,
                        octave,
                        t,
                        tur.singer.keySignature,
                        tur.singer.moveable,
                        direction,
                        logo.errorMsg,
                        logo.synth.inTemperament
                    );
                    if (tur.singer.drumStyle.length > 0) {
                        let drumname = last(tur.singer.drumStyle);
                        tur.singer.pitchDrumTable[noteObj[0] + noteObj[1]] = drumname;
                    }

                    tur.singer.notePitches[last(tur.singer.inNoteBlock)].push(noteObj[0]);
                    tur.singer.noteOctaves[last(tur.singer.inNoteBlock)].push(noteObj[1]);
                    tur.singer.noteCents[last(tur.singer.inNoteBlock)].push(cents);
                    tur.singer.noteHertz[last(tur.singer.inNoteBlock)].push(frequency);
                    return noteObj;
                };

                let noteObj1 = addPitch(note, octave, cents, hertz);

                for (let i = 0; i < tur.singer.intervals.length; i++) {
                    let ii = getInterval(
                        tur.singer.intervals[i], tur.singer.keySignature, noteObj1[0]
                    );
                    let noteObj2 = getNote(
                        noteObj1[0],
                        noteObj1[1],
                        ii,
                        tur.singer.keySignature,
                        tur.singer.moveable,
                        null,
                        logo.errorMsg,
                        logo.synth.inTemperament
                    );
                    addPitch(noteObj2[0], noteObj2[1], cents, 0);
                }

                for (let i = 0; i < tur.singer.semitoneIntervals.length; i++) {
                    let noteObj2 = getNote(
                        noteObj1[0],
                        noteObj1[1],
                        tur.singer.semitoneIntervals[i][0],
                        tur.singer.keySignature,
                        tur.singer.moveable,
                        null,
                        logo.errorMsg,
                        logo.synth.inTemperament
                    );
                    addPitch(
                        noteObj2[0], noteObj2[1], cents, 0, tur.singer.semitoneIntervals[i][1]
                    );
                }

                tur.singer.noteBeatValues[last(tur.singer.inNoteBlock)].push(tur.singer.beatFactor);
                tur.singer.pushedNote = true;
                if (logo.runningLilypond) {
                    logo.notation.notationMarkup(
                        turtle,
                        pitchToFrequency(noteObj1[0], noteObj1[1], cents, tur.singer.keySignature)
                    );
                }
            } else {
                throw "NoNoteError";
            }
        }

        /**
         * Returns pitch or octave from corresponding pitch number.
         *
         * @param {*} number - pitch number
         * @param {*} blkName - block type name
         * @param {*} turtle - Turtle index in turtles.turtleList
         * @returns {String|Number} pitch or octave based in blkName
         * @throws {String} No Arg Error
         */
        static numToPitch(number, blkName, turtle) {
            if (number !== null && typeof number === "number") {
                let obj = numberToPitch(
                    Math.floor(number) +
                    logo.turtles.ithTurtle(turtle).singer.pitchNumberOffset
                );
                if (blkName === "number2pitch") {
                    return obj[0];
                } else {
                    return obj[1];
                }
            } else {
                throw "NoArgError";
            }
        }

        /**
         * Sets the offset for mapping pitch numbers to pitch and octave.
         *
         * @param {String} pitch
         * @param {Number} octave
         * @param {Number} turtle - Turtle index in turtles.turtleList
         */
        static setPitchNumberOffset(pitch, octave, turtle) {
            let tur = logo.turtles.ithTurtle(turtle);

            let _octave = Math.floor(
                calcOctave(tur.singer.currentOctave, octave, tur.singer.lastNotePlayed, pitch)
            );
            tur.singer.pitchNumberOffset = pitchToNumber(pitch, _octave, tur.singer.keySignature);
        }
    }
}
