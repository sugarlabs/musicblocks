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
         * Plays a nth modal pitch block.
         *
         * @param {Number} number - number of modal pitch
         * @param {Number} octave - scale octave
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number|String} blk - corresponding Block object index in blocks.blockList or custom blockName
         */
        static playNthModalPitch(number, octave, turtle, blk) {
            let tur = logo.turtles.ithTurtle(turtle);

            //  (0, 4) --> ti 3; (-1, 4) --> la 3, (-6, 4) --> do 3
            //  (1, 4) --> do 4; ( 2, 4) --> re 4; ( 8, 4) --> do 5

            // If number is a float value then round-off to the nearest integer
            number = Math.round(number);

            let isNegativeArg = number < 0 ? true : false;
            number = Math.abs(number);

            let obj;
            if (
                blk !== undefined && blk in logo.blocks.blockList &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[1]].name === "ytopitch"
            ) {
                obj = keySignatureToMode("C major");
            } else {
                obj = keySignatureToMode(tur.singer.keySignature);
            }

            let modeLength = MUSICALMODES[obj[1]].length;
            let scaleDegree = Math.floor(number - 1) % modeLength + 1;

            // Choose a reference based on the key selected.
            // This is based on the position of a note on the circle of fifths e.g C --> 1, G-->8.
            // Subtract one to make it zero based.
            let ref = NOTESTEP[obj[0].substr(0, 1)] - 1;
            // Adjust reference if sharps/flats are present i.e increase by one for a sharp and decrease by one for a flat
            if (obj[0].substr(1) === FLAT) {
                ref--;
            } else if (obj[0].substr(1) === SHARP) {
                ref++;
            }

            /*
            Number of semitones is used to calculate changes in deltaSemi defined above.
            Semitones is initialised with reference value. e.g If selected key is G, semitone = ref = 7 (8 - 1)
            Now we assume our circle of fifths to start from our ref rather than default C note.
            Whenever a note is played, we add the difference of it's semitones from ref;
            e.g. If the selected key is G major: ref = 7 and initially semitones = ref = 7.
            G major scale: G A B C D E F#
            When we play 1st note --> G: semitones = semitones + (position of G on circle of fifths - ref) => 7 + (7 - 7)
            When we play 2nd note -->> A: semitones = semitones + (position of A of circle of fifths - ref) => 7 + (9 - 7)
            And so on. In essence we add the relative difference.
            To change octave we use the following methodology:
            1. If note number input is positive: Whenever the number of semitones will be less than ref, increment deltaSemi by one.
            2. If note number input is negative: Whenever the number of semitones will be greater than ref, increment deltaSemi by one.
            Note that these positions are zero based because we use an array to find indexes.

            Notice that deltaSemi will attain values : {0, 1}, so if we play scales of greater length where octave may need to increment/decrement multiple times:
            That is done with the use of deltaOctave: It's value is incremented by one everytime we traverse the modelength of our selected key once. [ e.g 7 in case of any major scale]
            deltaOctave doesn't directly affect the octave that will play; instead it changes what we say is the reference octave i.e the value connected to the octave argument of this block.

            You may see this as a cyclical process:
            e.g Repeat the scale degree block 14 times while in G major starting from note value --> 1 and octave arg --> 4
            Till we reach B --> Both deltaOctave and deltaSemi are {0,0}
            As we cross B and reach C --> no. of semitones < ref, deltaSemi = 1, deltaOctave = 0 and this causes note C to play in octave 5
            This behavious continues till E, as we reach F# (or Gb) --> deltaOctave becomes 1 and deltaSemi goes back to zero since we've traversed
            our modeLength ( 7 ) once.
            Again on C deltaSemi will be 1, deltaOctave was already 1 and thus a total change of 2 octaves --> C6. Thus, deltaOctave brings a change
            to the reference octave.
            So this process can continue indefinitely producing our desired results.
            */

            scaleDegree = isNegativeArg ? modeLength - scaleDegree : scaleDegree;

            let note;
            if (
                blk !== undefined && blk in logo.blocks.blockList &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[1]].name === "ytopitch"
            ) {
                note = nthDegreeToPitch("C major", scaleDegree);
            } else {
                note = nthDegreeToPitch(tur.singer.keySignature, scaleDegree);
            }

            let semitones =
                ref +
                NOTESFLAT.indexOf(note) !== -1 ?
                    NOTESFLAT.indexOf(note) - ref : NOTESSHARP.indexOf(note) - ref;
            /** calculates changes in reference octave which occur a semitone before the reference key */
            let deltaOctave = Math.floor(number / modeLength);
            /** calculates changes in octave when crossing B */
            let deltaSemi = isNegativeArg ? (semitones > ref ? 1 : 0) : (semitones < ref ? 1 : 0);
            let _octave = ((isNegativeArg ? -1 : 1) * (deltaOctave + deltaSemi)) + Math.floor(
                calcOctave(tur.singer.currentOctave, octave, tur.singer.lastNotePlayed, note)
            );

            return Singer.processPitch(note, _octave, 0, turtle, blk);
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
         * Creates sharps and flats.
         *
         * @param {String} accidental - type of accidental
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number} [blk] - corresponding Block object index in blocks.blockList
         * @returns {void}
         */
        static setAccidental(accidental, turtle, blk) {
            let value;
            let i = ACCIDENTALNAMES.indexOf(accidental);
            if (i === -1) {
                switch (accidental) {
                    case _("sharp"):
                        value = 1;
                        return;
                    case _("flat"):
                        value = -1;
                        return;
                    default:
                        value = 0;
                        return;
                }
            } else {
                value = ACCIDENTALVALUES[i];
            }

            let tur = logo.turtles.ithTurtle(turtle);
            tur.singer.transposition += tur.singer.invertList.length > 0 ? -value : value;

            let listenerName = "_accidental_" + turtle + "_" + blk;
            if (blk !== undefined && blk in logo.blocks.blockList)
                logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = event => {
                tur.singer.transposition += tur.singer.invertList.length > 0 ? value : -value;
            };

            logo.setTurtleListener(turtle, listenerName, __listener);
        }

        /**
         * Shifts the pitches contained inside Note blocks up (or down) by half steps.
         *
         * @param {Number} transValue - number of semitones
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number} [blk] - corresponding Block object index in blocks.blockList
         * @returns {void}
         */
        static setSemitoneTranspose(transValue, turtle, blk) {
            let tur = logo.turtles.ithTurtle(turtle);

            tur.singer.transposition +=
                tur.singer.invertList.length > 0 ? -transValue : transValue;
            tur.singer.transpositionValues.push(transValue);

            let listenerName = "_transposition_" + turtle;
            if (blk !== undefined && blk in logo.blocks.blockList)
                logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = event => {
                transValue = tur.singer.transpositionValues.pop();
                tur.singer.transposition +=
                    tur.singer.invertList.length > 0 ? transValue : -transValue;
            };

            logo.setTurtleListener(turtle, listenerName, __listener);
        }

        /**
         * Provides an easy way to modify the register (octave) of the notes that follow it.
         *
         * @param {Number} value - register value
         * @param {Number} turtle - Turtle index in turtles.turtleList
         */
        static setRegister(value, turtle) {
            logo.turtles.ithTurtle(turtle).singer.register = Math.floor(value);
        }

        /**
         * Rotates any contained notes around a target note.
         *
         * @param {String} name
         * @param {Number} octave
         * @param {String|Number} mode - even, odd, or scalar
         * @param {*} turtle - Turtle index in turtles.turtleList
         * @param {*} [blk] - corresponding Block object index in blocks.blockList
         */
        static invert(name, octave, mode, turtle, blk) {
            if (typeof mode === "number") {
                mode = mode % 2 === 0 ? "even" : "odd";
            }

            if (mode === _("even")) {
                mode = "even";
            } else if (arg2 === _("odd")) {
                mode = "odd";
            } else if (arg2 === _("scalar")) {
                mode = "scalar";
            }

            let tur = logo.turtles.ithTurtle(turtle);

            if (mode === "even" || mode === "odd" || mode === "scalar") {
                let _octave = calcOctave(
                    tur.singer.currentOctave, octave, tur.singer.lastNotePlayed, name
                );
                tur.singer.invertList.push([name, _octave, mode]);
            }

            let listenerName = "_invert_" + turtle;
            if (blk !== undefined && blk in logo.blocks.blockList)
                logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = event => tur.singer.invertList.pop();
            logo.setTurtleListener(turtle, listenerName, __listener);
        }

        /**
         * Returns pitch or octave from corresponding pitch number.
         *
         * @param {Number} number - pitch number
         * @param {String} outType - either "pitch" or "octave" to return
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @returns {String|Number} pitch or octave based in blkName
         * @throws {String} No Arg Error
         */
        static numToPitch(number, outType, turtle) {
            if (number !== null && typeof number === "number") {
                let obj = numberToPitch(
                    Math.floor(number) +
                    logo.turtles.ithTurtle(turtle).singer.pitchNumberOffset
                );
                if (outType === "pitch") {
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

        /**
         * Converts the pitch value of the last note played into different formats such as hertz, letter name, pitch number, et al.
         *
         * @param {*} type - required format: letter class, solfege syllable, pitch class, scalar class, scale degree, nth degree, staff y, pitch number, pitch in hertz
         * @param {*} turtle - Turtle index in turtles.turtleList
         */
        static getPitchInfo(type, turtle) {
            let tur = logo.turtles.ithTurtle(turtle);

            if (tur.singer.noteStatus !== null) {
                switch (type) {
                    case "letter class":
                        return tur.singer.lastNotePlayed[0][0];
                    case "solfege syllable":
                        let lc2 = tur.singer.lastNotePlayed[0];
                        lc2 = lc2.substr(0, lc2.length - 1);
                        lc2 = lc2.replace("#", SHARP).replace("b", FLAT);
                        if (tur.singer.moveable === false) {
                            return SOLFEGECONVERSIONTABLE[lc2];
                        } else {
                            let i = _buildScale(tur.singer.keySignature)[0].indexOf(lc2);
                            return SOLFEGENAMES[i];
                        }
                    case "pitch class":
                        let note = tur.singer.lastNotePlayed[0];
                        let num = pitchToNumber(
                            note.substr(0, note.length - 1 ),
                            note[note.length - 1],
                            tur.singer.keySignature
                        );
                        return (num - 3) % 12;
                    case "scalar class":
                        let note2 = tur.singer.lastNotePlayed[0];
                        note2 = note2.substr(0, note2.length - 1);
                        note2 = note2.replace("#", SHARP).replace("b", FLAT);
                        let scalarClass = scaleDegreeToPitchMapping(
                            tur.singer.keySignature, null, tur.singer.moveable, note2
                        );
                        return scalarClass[0];
                    case "scale degree":
                        let note3 = tur.singer.lastNotePlayed[0];
                        note3 = note3.substr(0, note3.length - 1);
                        note3 = note3.replace("#", SHARP).replace("b", FLAT);
                        let scalarClass1 = scaleDegreeToPitchMapping(
                            tur.singer.keySignature, null, tur.singer.moveable, note3
                        );
                        return scalarClass1[0] + scalarClass1[1];
                    case "nth degree":
                        let note4 = tur.singer.lastNotePlayed[0];
                        note4 = note4.substr(0, note4.length - 1);
                        note4 = note4.replace("#", SHARP).replace("b", FLAT);
                        return _buildScale(tur.singer.keySignature)[0].indexOf(note4);
                    case "staff y":
                        if (tur.singer.lastNotePlayed.length === 0)
                            return 0;
                        let lc1 = tur.singer.lastNotePlayed[0][0];
                        let o1 =
                            tur.singer.lastNotePlayed[0].length === 2 ?
                                tur.singer.lastNotePlayed[0][1] :
                                tur.singer.lastNotePlayed[0][2];
                        // these numbers are subject to staff artwork
                        return ["C", "D", "E", "F", "G", "A", "B"].indexOf(lc1) *
                            YSTAFFNOTEHEIGHT + (o1 - 4) * YSTAFFOCTAVEHEIGHT;
                    case "pitch number":
                        let obj;
                        if (tur.singer.lastNotePlayed !== null) {
                            if (typeof tur.singer.lastNotePlayed[0] === "string") {
                                let len = tur.singer.lastNotePlayed[0].length;
                                let pitch = tur.singer.lastNotePlayed[0].slice(0, len - 1);
                                let octave =
                                    parseInt(tur.singer.lastNotePlayed[0].slice(len - 1));
                                obj = [pitch, octave];
                            } else {
                                // Hertz?
                                obj = frequencyToPitch(tur.singer.lastNotePlayed[0]);
                            }
                        } else if (
                            tur.singer.inNoteBlock in tur.singer.notePitches &&
                            tur.singer.notePitches[last(tur.singer.inNoteBlock)].length > 0
                        ) {
                            obj = getNote(
                                tur.singer.notePitches[last(tur.singer.inNoteBlock)][0],
                                tur.singer.noteOctaves[last(tur.singer.inNoteBlock)][0],
                                0,
                                tur.singer.keySignature,
                                tur.singer.moveable,
                                null,
                                logo.errorMsg
                            );
                        } else {
                            if (tur.singer.lastNotePlayed !== null) {
                                console.debug("Cannot find a note ");
                                logo.errorMsg(INVALIDPITCH, blk);
                            }
                            obj = ["G", 4];
                        }
                        return pitchToNumber(obj[0], obj[1], tur.singer.keySignature) -
                            tur.singer.pitchNumberOffset;
                    case "pitch in hertz":
                        return logo.synth._getFrequency(
                            tur.singer.lastNotePlayed[0],
                            logo.synth.changeInTemperament
                        );
                    default:
                        return "__INVALID_INPUT__";
                }
            } else {
                return "";
            }
        }

        /**
         * Returns change in pithc or scalar change in pitch.
         *
         * @param {String} outType - either "deltapitch" or "deltascalarpitch" to return
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @returns {Number} change/scalar change in pitch
         */
        static deltaPitch(outType, turtle) {
            let tur = logo.turtles.ithTurtle(turtle);

            if (tur.singer.previousNotePlayed == null) {
                return 0;
            } else {
                let len = tur.singer.previousNotePlayed[0].length;
                let pitch = tur.singer.previousNotePlayed[0].slice(0, len - 1);
                let octave = parseInt(tur.singer.previousNotePlayed[0].slice(len - 1));
                let obj = [pitch, octave];
                let previousValue = pitchToNumber(obj[0], obj[1], tur.singer.keySignature);

                len = tur.singer.lastNotePlayed[0].length;
                pitch = tur.singer.lastNotePlayed[0].slice(0, len - 1);
                octave = parseInt(tur.singer.lastNotePlayed[0].slice(len - 1));
                obj = [pitch, octave];

                let delta = pitchToNumber(obj[0], obj[1], tur.singer.keySignature) - previousValue;
                if (outType === "deltapitch") {
                    // half-step difference
                    return delta;
                } else {
                    // convert to scalar steps
                    let scalarDelta = 0;
                    let i = 0;

                    let _calculate = type => {
                        i++;
                        let nhalf =
                            type === "up" ?
                                getStepSizeUp(tur.singer.keySignature, pitch, 0, "equal") :
                                getStepSizeDown(tur.singer.keySignature, pitch, 0, "equal")
                        delta -= nhalf;
                        scalarDelta += type === "up" ? 1 : -1;
                        obj = getNote(
                            pitch,
                            octave,
                            nhalf,
                            tur.singer.keySignature,
                            tur.singer.moveable,
                            null,
                            logo.errorMsg,
                            logo.synth.inTemperament
                        );
                        [pitch, octave] = obj;

                        if (i > 100)
                            return;
                    }

                    if (delta > 0) {
                        while (delta > 0) {
                            _calculate("up");
                        }
                    } else {
                        while (delta < 0) {
                            _calculate("down");
                        }
                    }

                    return scalarDelta;
                }
            }
        }

        /**
         * Returns the number of semi-tones up/down to the next note in the current key and mode.
         *
         * @param {String} stepType - step up or down
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @returns {Number} number of semi-tones
         */
        static consonantStepSize(stepType, turtle) {
            let tur = logo.turtles.ithTurtle(turtle);

            if (tur.singer.lastNotePlayed !== null) {
                let len = tur.singer.lastNotePlayed[0].length;

                return stepType === "up" ?
                    getStepSizeUp(
                        tur.singer.keySignature,
                        tur.singer.lastNotePlayed[0].slice(0, len - 1)
                    ) :
                    getStepSizeDown(
                        tur.singer.keySignature,
                        tur.singer.lastNotePlayed[0].slice(0, len - 1)
                    )
            } else {
                return stepType === "up" ?
                    getStepSizeUp(tur.singer.keySignature, "G") :
                    getStepSizeDown(tur.singer.keySignature, "G");
            }
        }
    }
}
