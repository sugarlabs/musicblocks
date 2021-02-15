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

/*
   globals logo, Singer, pitchToNumber, getStepSizeUp, getStepSizeDown, calcOctave, last, getNote,
   nthDegreeToPitch, SHARP, FLAT, _, pitchToFrequency, SOLFEGENAMES1, SOLFEGECONVERSIONTABLE,
   numberToPitch, ACCIDENTALNAMES, ACCIDENTALVALUES, NOTESFLAT, NOTESSHARP, NOTESTEP, MUSICALMODES,
   keySignatureToMode, getInterval, blocks, EFFECTSNAMES, NANERRORMSG, frequencyToPitch,
   MusicBlocks, Mouse, isCustom
*/

/*
   Global locations
    - js/logo.js
        logo, NANERRORMSG
    - js/turtle-singer.js
        Singer
    - js/utils/utils.js
        last
    - js/activity.js
        blocks
    - js/utils/synthutils.js
        EFFECTSNAMES
    - js/js-export/export.js
        MusicBlocks, Mouse
    - js/utils/musicutils.js
        pitchToNumber, getStepSizeUp, getStepSizeDown, calcOctave, getNote, nthDegreeToPitch,
        SHARP, FLAT, _, pitchToFrequency, SOLFEGENAMES1, SOLFEGECONVERSIONTABLE, numberToPitch,
        ACCIDENTALNAMES, ACCIDENTALVALUES, NOTESFLAT, NOTESSHARP, NOTESTEP, MUSICALMODES,
        keySignatureToMode, getInterval, frequencyToPitch, isCustom
*/

/*exported setupPitchActions*/

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
         *  In combination with a number, plays the next pitch in a scale.
         *
         * @param {Number} value - step value
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number|String} blk - corresponding Block object index in blocks.blockList or custom blockName
         */
        static stepPitch(value, turtle, blk) {
            const tur = logo.turtles.ithTurtle(turtle);

            // Similar to pitch but calculated from previous note played.
            if (!logo.inMatrix && !logo.inMusicKeyboard && tur.singer.inNoteBlock.length === 0) {
                // logo.errorMsg(_("The Scalar Step Block must be used inside of a Note Block."), blk);
                tur.singer.lastNotePlayed = ["G4", 4];
                // logo.stopTurtle = true;
                // return;
            }

            if (typeof value !== "number") {
                logo.errorMsg(NANERRORMSG, blk);
                logo.stopTurtle = true;
                return;
            }

            // If we are just counting notes we don't care about the pitch.
            if (tur.singer.justCounting.length > 0 && tur.singer.lastNotePlayed === null) {
                // console.debug("Just counting, so spoofing last note played.");
                tur.singer.previousNotePlayed = ["G4", 4];
                tur.singer.lastNotePlayed = ["G4", 4];
            }

            if (tur.singer.lastNotePlayed === null) {
                // logo.errorMsg(_("The Scalar Step Block must be preceded by a Pitch Block."), blk);
                tur.singer.lastNotePlayed = ["G4", 4];
            }

            const lastNotePlayed = tur.singer.lastNotePlayed;
            // At this point, lastNotePlayed is a tuple of the
            // pitchname-octave and the notevalue, e.g., ["C3", 8]
            // We only care about the pitchname and octave.
            let pitchName = lastNotePlayed[0].slice(0, lastNotePlayed[0].length - 1);
            let octave = parseInt(lastNotePlayed[0].slice(lastNotePlayed[0].length - 1, lastNotePlayed[0].length));

            if (tur.singer.inverted) {
                // If the last note is inverted then inverting it
                // again to get the original note
                const delta_temp = Singer.calculateInvert(
                    logo,
                    turtle,
                    pitchName,
                    octave
                );
                const transposition_temp = 2 * delta_temp;
                lastNotePlayed = getNote(
                    pitchName,
                    octave,
                    transposition_temp,
                    tur.singer.keySignature,
                    tur.singer.moveable,
                    null,
                    logo.errorMsg,
                    logo.synth.inTemperament
                );
            }

            const noteObj = Singer.addScalarTransposition(
                logo,
                turtle,
                pitchName,
                octave,
                value
            );

            let delta = 0;
            if (!(tur.singer.invertList.length === 0)) {
                tur.singer.inverted = true;
                delta += Singer.calculateInvert(logo, turtle, noteObj[0], noteObj[1]);
            }

            let transposition =
                2 * delta +
                (logo.turtles.ithTurtle(turtle).transposition
                    ? logo.turtles.ithTurtle(turtle).transposition
                    : 0);

            const addPitch = (note, octave, cents, direction) => {
                const t = transposition + tur.singer.register * 12;
                const noteObj = getNote(
                    note,
                    octave,
                    t,
                    tur.singer.keySignature,
                    true,
                    direction,
                    logo.errorMsg,
                    logo.synth.inTemperament
                );

                if (tur.singer.drumStyle.length > 0) {
                    const drumname = last(tur.singer.drumStyle);
                    if (EFFECTSNAMES.indexOf(drumname) === -1) {
                        tur.singer.pitchDrumTable[noteObj[0] + noteObj[1]] = drumname;
                    } else {
                        // eslint-disable-next-line
                        tur.singer.pitchDrumTable[noteObj[0] + noteObj[1]] = effectsname;
                    }
                }

                if (!logo.inMatrix && !logo.inMusicKeyboard && tur.singer.inNoteBlock.length > 0) {
                    tur.singer.notePitches[last(tur.singer.inNoteBlock)].push(noteObj[0]);
                    tur.singer.noteOctaves[last(tur.singer.inNoteBlock)].push(noteObj[1]);
                    tur.singer.noteCents[last(tur.singer.inNoteBlock)].push(cents);
                    if (cents !== 0) {
                        tur.singer.noteHertz[last(tur.singer.inNoteBlock)].push(
                            pitchToFrequency(noteObj[0], noteObj[1], cents, tur.singer.keySignature)
                        );
                    } else {
                        tur.singer.noteHertz[last(tur.singer.inNoteBlock)].push(0);
                    }
                }
                return noteObj;
            };
            
            const noteObj1 = addPitch(noteObj[0], noteObj[1], 0);
            // Only apply the transposition to the base note of an interval
            transposition = 0;

            if (logo.inMatrix) {
                logo.phraseMaker.addRowBlock(blk);
                if (logo.pitchBlocks.indexOf(blk) === -1) {
                    logo.pitchBlocks.push(blk);
                }

                if (logo.phraseMaker.rowLabels.length > 0) {
                    if (last(logo.phraseMaker.rowLabels) === "hertz") {
                        const freq = pitchToFrequency(
                            noteObj[0],
                            noteObj[1],
                            0,
                            tur.singer.keySignature
                        );
                        logo.phraseMaker.rowLabels.push("hertz");
                        logo.phraseMaker.rowArgs.push(parseInt(freq));
                    } else {
                        if (SOLFEGENAMES1.indexOf(last(logo.phraseMaker.rowLabels)) !== -1) {
                            logo.phraseMaker.rowLabels.push(SOLFEGECONVERSIONTABLE[noteObj1[0]]);
                        } else {
                            logo.phraseMaker.rowLabels.push(noteObj1[0]);
                        }

                        logo.phraseMaker.rowArgs.push(noteObj1[1]);
                    }
                } else {
                    logo.phraseMaker.rowLabels.push(noteObj1[0]);
                    logo.phraseMaker.rowArgs.push(noteObj1[1]);
                }

                tur.singer.previousNotePlayed = tur.singer.lastNotePlayed;
                tur.singer.lastNotePlayed = [noteObj1[0] + noteObj1[1], 4];
            } else if (logo.inMusicKeyboard) {
                if (tur.singer.drumStyle.length === 0) {
                    logo.musicKeyboard.instruments.push(last(tur.singer.instrumentNames));
                    if (logo.musicKeyboard.noteNames.length > 0) {
                        if (last(logo.musicKeyboard.noteNames) === "hertz") {
                            const freq = pitchToFrequency(
                                noteObj[0],
                                noteObj[1],
                                0,
                                tur.singer.keySignature
                            );
                            logo.musicKeyboard.noteNames.push("hertz");
                            logo.musicKeyboard.octaves.push(parseInt(freq));
                        } else {
                            if (SOLFEGENAMES1.indexOf(last(logo.musicKeyboard.noteNames)) !== -1) {
                                logo.musicKeyboard.noteNames.push(
                                    SOLFEGECONVERSIONTABLE[noteObj1[0]]
                                );
                            } else {
                                logo.musicKeyboard.noteNames.push(noteObj1[0]);
                            }

                            logo.musicKeyboard.octaves.push(noteObj1[1]);
                        }
                    } else {
                        logo.musicKeyboard.noteNames.push(noteObj1[0]);
                        logo.musicKeyboard.octaves.push(noteObj1[1]);
                    }

                    logo.musicKeyboard.addRowBlock(blk);
                    tur.singer.lastNotePlayed = [noteObj1[0] + noteObj1[1], 4];
                }
            }

            let noteObj2;
            for (let i = 0; i < tur.singer.intervals.length; i++) {
                const ii = getInterval(tur.singer.intervals[i],
                    tur.singer.keySignature, noteObj1[0]);
                noteObj2 = getNote(
                    noteObj1[0],
                    noteObj1[1],
                    ii,
                    tur.singer.keySignature,
                    tur.singer.moveable,
                    null,
                    logo.errorMsg,
                    logo.synth.inTemperament
                );
                addPitch(noteObj2[0], noteObj2[1], 0);
            }

            for (let i = 0; i < tur.singer.semitoneIntervals.length; i++) {
                noteObj2 = getNote(
                    noteObj1[0],
                    noteObj1[1],
                    tur.singer.semitoneIntervals[i][0],
                    tur.singer.keySignature,
                    tur.singer.moveable,
                    null,
                    logo.errorMsg,
                    logo.synth.inTemperament
                );
                addPitch(noteObj2[0], noteObj2[1], 0, tur.singer.semitoneIntervals[i][1]);
            }

            if (tur.singer.inNoteBlock.length > 0) {
                tur.singer.noteBeatValues[last(tur.singer.inNoteBlock)].push(tur.singer.beatFactor);
                tur.singer.pushedNote = true;
            } else {
                // stand-alone block
                Singer.processPitch(noteObj1[0], noteObj1[1], 0, turtle, blk);
            }
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
            const tur = logo.turtles.ithTurtle(turtle);

            //  (0, 4) --> ti 3; (-1, 4) --> la 3, (-6, 4) --> do 3
            //  (1, 4) --> do 4; ( 2, 4) --> re 4; ( 8, 4) --> do 5

            // If number is a float value then round-off to the nearest integer
            number = Math.round(number);

            const isNegativeArg = number < 0 ? true : false;
            number = Math.abs(number);

            let obj;
            if (
                blk !== undefined &&
                blk in blocks.blockList &&
                blocks.blockList[blocks.blockList[blk].connections[1]].name === "ytopitch"
            ) {
                obj = keySignatureToMode("C major");
            } else {
                obj = keySignatureToMode(tur.singer.keySignature);
            }

            const modeLength = MUSICALMODES[obj[1]].length;
            let scaleDegree = (Math.floor(number - 1) % modeLength) + 1;

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
                blk !== undefined &&
                blk in blocks.blockList &&
                blocks.blockList[blocks.blockList[blk].connections[1]].name === "ytopitch"
            ) {
                note = nthDegreeToPitch("C major", scaleDegree);
            } else {
                note = nthDegreeToPitch(tur.singer.keySignature, scaleDegree);
            }

            let semitones = ref;
            semitones +=
                NOTESFLAT.indexOf(note) !== -1
                    ? NOTESFLAT.indexOf(note) - ref
                    : NOTESSHARP.indexOf(note) - ref;
            /** calculates changes in reference octave which occur a semitone before the reference key */
            const deltaOctave = Math.floor(number / modeLength);
            /** calculates changes in octave when crossing B */
            const deltaSemi = isNegativeArg ? (semitones > ref ? 1 : 0) : semitones < ref ? 1 : 0;
            const _octave =
                (isNegativeArg ? -1 : 1) * (deltaOctave + deltaSemi) +
                Math.floor(
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
            const tur = logo.turtles.ithTurtle(turtle);

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
                const obj = numberToPitch(
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
        static playHertz(hertz, turtle, blk) {
            const tur = logo.turtles.ithTurtle(turtle);

            const obj = frequencyToPitch(hertz);
            const note = obj[0];
            const octave = obj[1];
            const cents = obj[2];
            let delta = 0;

            if (tur.singer.justMeasuring.length > 0) {
                // TODO: account for cents
                const noteObj = getNote(
                    note,
                    octave,
                    0,
                    tur.singer.keySignature,
                    tur.singer.moveable,
                    null,
                    logo.errorMsg
                );

                const n = tur.singer.justMeasuring.length;
                const pitchNumber =
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

                const addPitch = (note, octave, cents, frequency, direction) => {
                    const t = 2 * delta + tur.transposition + tur.singer.register * 12;
                    const noteObj = getNote(
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
                        const drumname = last(tur.singer.drumStyle);
                        tur.singer.pitchDrumTable[noteObj[0] + noteObj[1]] = drumname;
                    }

                    tur.singer.notePitches[last(tur.singer.inNoteBlock)].push(noteObj[0]);
                    tur.singer.noteOctaves[last(tur.singer.inNoteBlock)].push(noteObj[1]);
                    tur.singer.noteCents[last(tur.singer.inNoteBlock)].push(cents);
                    tur.singer.noteHertz[last(tur.singer.inNoteBlock)].push(frequency);
                    return noteObj;
                };

                const noteObj1 = addPitch(note, octave, cents, hertz);

                for (let i = 0; i < tur.singer.intervals.length; i++) {
                    const ii = getInterval(
                        tur.singer.intervals[i],
                        tur.singer.keySignature,
                        noteObj1[0]
                    );
                    const noteObj2 = getNote(
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
                    const noteObj2 = getNote(
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
                        noteObj2[0],
                        noteObj2[1],
                        cents,
                        0,
                        tur.singer.semitoneIntervals[i][1]
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
                Singer.processPitch(note, octave, cents, turtle, blk);
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
            const i = ACCIDENTALNAMES.indexOf(accidental);
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

            const tur = logo.turtles.ithTurtle(turtle);
            tur.singer.transposition += tur.singer.invertList.length > 0 ? -value : value;

            const listenerName = "_accidental_" + turtle + "_" + blk;
            if (blk !== undefined && blk in logo.blocks.blockList) {
                logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null) mouse.MB.listeners.push(listenerName);
            }

            const __listener = () => {
                tur.singer.transposition += tur.singer.invertList.length > 0 ? value : -value;
            };

            logo.setTurtleListener(turtle, listenerName, __listener);
        }

        /**
         * Shifts the pitches contained inside Note blocks up (or down) the scale.
         *
         * @param {Number} transValue - number of steps
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number} [blk] - corresponding Block object index in blocks.blockList
         * @returns {void}
         */
        static setScalarTranspose(transValue, turtle, blk) {
            const tur = logo.turtles.ithTurtle(turtle);

            tur.singer.scalarTransposition +=
                tur.singer.invertList.length > 0 ? -transValue : transValue;
            tur.singer.scalarTranspositionValues.push(transValue);

            const listenerName = "_scalar_transposition_" + turtle;
            if (blk !== undefined && blk in logo.blocks.blockList) {
                logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null) mouse.MB.listeners.push(listenerName);
            }

            const __listener = () => {
                transValue = tur.singer.scalarTranspositionValues.pop();
                tur.singer.scalarTransposition +=
                    tur.singer.invertList.length > 0 ? transValue : -transValue;
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
            const tur = logo.turtles.ithTurtle(turtle);

            tur.singer.transposition += tur.singer.invertList.length > 0 ? -transValue : transValue;
            tur.singer.transpositionValues.push(transValue);

            const listenerName = "_transposition_" + turtle;
            if (blk !== undefined && blk in logo.blocks.blockList) {
                logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null) mouse.MB.listeners.push(listenerName);
            }

            const __listener = () => {
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
            } else if (mode === _("odd")) {
                mode = "odd";
            } else if (mode === _("scalar")) {
                mode = "scalar";
            }

            const tur = logo.turtles.ithTurtle(turtle);

            if (mode === "even" || mode === "odd" || mode === "scalar") {
                const _octave = calcOctave(
                    tur.singer.currentOctave,
                    octave,
                    tur.singer.lastNotePlayed,
                    name
                );
                tur.singer.invertList.push([name, _octave, mode]);
            }

            const listenerName = "_invert_" + turtle;
            if (blk !== undefined && blk in logo.blocks.blockList) {
                logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null) mouse.MB.listeners.push(listenerName);
            }

            const __listener = () => {
                tur.singer.invertList.pop();
                tur.singer.inverted = false;
            };
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
                const obj = numberToPitch(
                    Math.floor(number) + logo.turtles.ithTurtle(turtle).singer.pitchNumberOffset
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
            const tur = logo.turtles.ithTurtle(turtle);

            const _octave = Math.floor(
                calcOctave(tur.singer.currentOctave, octave, tur.singer.lastNotePlayed, pitch)
            );
            tur.singer.pitchNumberOffset = pitchToNumber(pitch, _octave, tur.singer.keySignature);
        }

        /**
         * Returns change in pitch or scalar change in pitch.
         *
         * @param {String} outType - either "deltapitch" or "deltascalarpitch" to return
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @returns {Number} change/scalar change in pitch
         */
        static deltaPitch(outType, turtle) {
            const tur = logo.turtles.ithTurtle(turtle);

            if (tur.singer.previousNotePlayed == null) {
                return 0;
            } else {
                let len = tur.singer.previousNotePlayed[0].length;
                let pitch = tur.singer.previousNotePlayed[0].slice(0, len - 1);
                let octave = parseInt(tur.singer.previousNotePlayed[0].slice(len - 1));
                let obj = [pitch, octave];
                const previousValue = pitchToNumber(obj[0], obj[1], tur.singer.keySignature);

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

                    const _calculate = (type) => {
                        i++;
                        const nhalf =
                            type === "up"
                                ? getStepSizeUp(tur.singer.keySignature, pitch, 0, "equal")
                                : getStepSizeDown(tur.singer.keySignature, pitch, 0, "equal");
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

                        if (i > 100) return;
                    };

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
            const tur = logo.turtles.ithTurtle(turtle);

            if (tur.singer.lastNotePlayed !== null) {
                const len = tur.singer.lastNotePlayed[0].length;

                return stepType === "up"
                    ? getStepSizeUp(
                        tur.singer.keySignature,
                        tur.singer.lastNotePlayed[0].slice(0, len - 1)
                    )
                    : getStepSizeDown(
                        tur.singer.keySignature,
                        tur.singer.lastNotePlayed[0].slice(0, len - 1)
                    );
            } else {
                return stepType === "up"
                    ? getStepSizeUp(tur.singer.keySignature, "G")
                    : getStepSizeDown(tur.singer.keySignature, "G");
            }
        }
    };
}
