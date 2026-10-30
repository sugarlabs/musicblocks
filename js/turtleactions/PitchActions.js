/**
 * @file This contains the action methods of the Turtle's Singer
 * component's Pitch blocks.
 * @author Anindya Kundu
 * @author Walter Bender
 *
 * @copyright 2014-2021 Walter Bender
 * @copyright 2020 Anindya Kundu
 *
 * @license
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the The GNU Affero General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335
 * USA.

 */

/*
   globals Singer, pitchToNumber, getStepSizeUp, getStepSizeDown, calcOctave, last, getNote,
   nthDegreeToPitch, SHARP, FLAT, pitchToFrequency, SOLFEGENAMES1, SOLFEGECONVERSIONTABLE,
   numberToPitch, ACCIDENTALNAMES, ACCIDENTALVALUES, NOTESFLAT, NOTESSHARP, NOTESTEP,
   keySignatureToMode, getInterval, EFFECTSNAMES, NANERRORMSG, frequencyToPitch,
   MusicBlocks, Mouse, isCustomTemperament, getCurrentEDO, getModeLength, noteToObj
*/

/*
   Global locations
    - js/logo.js
        NANERRORMSG
    - js/turtle-singer.js
        Singer
    - js/utils/utils.js
        last
    - js/utils/synthutils.js
        EFFECTSNAMES
    - js/js-export/export.js
        MusicBlocks, Mouse
    - js/utils/musicutils.js
        pitchToNumber, getStepSizeUp, getStepSizeDown, calcOctave, getNote, nthDegreeToPitch,
        SHARP, FLAT, pitchToFrequency, SOLFEGENAMES1, SOLFEGECONVERSIONTABLE, numberToPitch,
        ACCIDENTALNAMES, ACCIDENTALVALUES, NOTESFLAT, NOTESSHARP, NOTESTEP, MUSICALMODES,
        keySignatureToMode, getInterval, frequencyToPitch, isCustomTemperament, getCurrentEDO,
        noteToObj
*/

/*exported setupPitchActions*/

/**
 * Sets up all the methods related to different actions for each block in Pitch palette.
 *
 * @returns {void}
 */
function setupPitchActions(activity) {
    /**
     * Returns a unique stage listener name for a turtle by appending a numeric
     * suffix if an active listener with the same base name already exists.
     *
     * @param {Object} tur - The turtle object.
     * @param {string} baseName - The base name of the event listener.
     * @returns {string} The unique listener name.
     */
    function getUniqueListenerName(tur, baseName) {
        let name = baseName;
        if (tur && tur.listeners) {
            let suffix = 1;
            while (name in tur.listeners) {
                name = baseName + "_" + suffix++;
            }
        }
        return name;
    }

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
            Singer.processPitch(activity, note, octave, cents, turtle, blk);
            return;
        }

        /**
         *  In combination with a number, plays the next pitch in a scale.
         *
         * @param {Number} value - step value
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number|String} blk - corresponding Block object index in blocks.blockList or custom blockName
         */
        static stepPitch(value, turtle, blk) {
            const tur = activity.turtles.ithTurtle(turtle);

            // Similar to pitch but calculated from previous note played.
            if (
                !activity.logo.inMatrix &&
                !activity.logo.inMusicKeyboard &&
                !activity.logo.inPitchDrumMatrix &&
                tur.singer.inNoteBlock.length === 0
            ) {
                // If there was no previous pitch, use default.
                tur.singer.lastNotePlayed = ["G4", 4];
            }

            if (typeof value !== "number" || !Number.isFinite(value)) {
                activity.errorMsg(NANERRORMSG, blk);
                activity.logo.stopTurtle = true;
                return;
            }

            // If we are just counting notes we don't care about the pitch.
            if (tur.singer.justCounting.length > 0 && tur.singer.lastNotePlayed === null) {
                tur.singer.previousNotePlayed = ["G4", 4];
                tur.singer.lastNotePlayed = ["G4", 4];
            }

            if (tur.singer.lastNotePlayed === null) {
                tur.singer.lastNotePlayed = ["G4", 4];
            }

            let lastNotePlayed = tur.singer.lastNotePlayed;
            let pitchName;
            let octave;
            let cents = 0;

            // At this point, lastNotePlayed is a tuple of the
            // pitchname-octave and the notevalue, e.g., ["C3", 8]
            // We only care about the pitchname and octave.
            if (typeof lastNotePlayed[0] === "number") {
                // Convert freq to pitch.
                lastNotePlayed = frequencyToPitch(lastNotePlayed[0]);
                pitchName = lastNotePlayed[0];
                octave = lastNotePlayed[1];
                cents = lastNotePlayed[2];
            } else {
                const noteObj = noteToObj(lastNotePlayed[0]);
                pitchName = noteObj[0];
                octave = noteObj[1];
            }
            if (tur.singer.invertList.length > 0) {
                // If the last note is inverted then inverting it
                // again to get the original note
                const delta_temp = Singer.calculateInvert(
                    activity.logo,
                    turtle,
                    pitchName,
                    octave,
                    cents
                );
                const transposition_temp = 2 * delta_temp;
                const invertedNote = getNote(
                    pitchName,
                    octave,
                    transposition_temp,
                    tur.singer.keySignature,
                    tur.singer.movable,
                    null,
                    activity.errorMsg,
                    activity.logo.synth.inTemperament
                );
                pitchName = invertedNote[0];
                octave = invertedNote[1];
            }

            const noteObj = Singer.addScalarTransposition(
                activity.logo,
                turtle,
                pitchName,
                octave,
                value
            );

            Singer.processPitch(activity, noteObj[0], noteObj[1], cents, turtle, blk);
            return;
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
            if (!Number.isFinite(number)) return;
            const tur = activity.turtles.ithTurtle(turtle);

            //  (0, 4) --> do 4; ( 1, 4) --> re 4; ( 7, 4) --> do 5
            //  (-1, 4) --> ti 3; (-2, 4) --> la 3, (-7, 4) --> do 3

            // If number is a float value then round-off to the nearest integer
            number = Math.round(number);

            const isNegativeArg = number < 0 ? true : false;
            number = Math.abs(number);

            const obj = keySignatureToMode(tur.singer.keySignature);
            let modeLength;

            modeLength = getModeLength(tur.singer.keySignature);
            let scaleDegree;

            // Position of a note within the octave, in EDO steps counted from C (0-based),
            // since octave numbers change at C. pitchToNumber counts from A, so measure the
            // distance from C in the same octave rather than taking it modulo the EDO.
            const temperament = activity.logo.synth.inTemperament;
            const edo = getCurrentEDO(temperament);
            const cNumber = pitchToNumber("C", 4, tur.singer.keySignature, temperament);
            const positionInOctave = pitch => {
                const steps =
                    pitchToNumber(pitch, 4, tur.singer.keySignature, temperament) - cNumber;
                return ((steps % edo) + edo) % edo;
            };

            // Reference position of the key note within the octave.
            const ref = positionInOctave(obj[0]);

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
            e.g Repeat the scale degree block 14 times while in G major starting from note value --> 0 and octave arg --> 4
            Till we reach B (note value 2) --> Both deltaOctave and deltaSemi are {0,0}
            As we cross B and reach C (note value 3) --> no. of semitones < ref, deltaSemi = 1, deltaOctave = 0 and this causes note C to play in octave 5
            This continues till F# (note value 6), as we reach G (note value 7) --> deltaOctave becomes 1 and deltaSemi goes back to zero since we've traversed
            our modeLength ( 7 ) once.
            Again on C deltaSemi will be 1, deltaOctave was already 1 and thus a total change of 2 octaves --> C6. Thus, deltaOctave brings a change
            to the reference octave.
            So this process can continue indefinitely producing our desired results.
            */

            if (isNegativeArg) {
                scaleDegree = modeLength - ((number - 1) % modeLength);
            } else {
                scaleDegree = (number % modeLength) + 1;
            }

            const [note, _offset] = nthDegreeToPitch(
                tur.singer.keySignature,
                scaleDegree,
                getCurrentEDO(temperament)
            );
            let semitones = ref;
            const notePos = positionInOctave(note);
            semitones += notePos - ref;
            /** calculates changes in reference octave which occur a semitone before the reference key */
            const deltaOctave = Math.floor(number / modeLength);
            /** calculates changes in octave when crossing B */
            const deltaSemi = isNegativeArg ? (semitones > ref ? 1 : 0) : semitones < ref ? 1 : 0;
            const _octave =
                (isNegativeArg ? -1 : 1) * (deltaOctave + deltaSemi) +
                Math.floor(
                    calcOctave(
                        tur.singer.currentOctave,
                        octave,
                        tur.singer.lastNotePlayed,
                        note,
                        activity.logo.synth.inTemperament
                    )
                );

            Singer.processPitch(activity, note, _octave, 0, turtle, blk);
            return;
        }

        /**
         * Processes a pitch number block.
         *
         * @param {Number} pitchNumber - pitch number
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number|String} blk - corresponding Block object index in blocks.blockList or custom blockName
         */
        static playPitchNumber(pitchNumber, turtle, blk) {
            if (!Number.isFinite(pitchNumber)) return;
            const tur = activity.turtles.ithTurtle(turtle);

            if (tur.singer.inDefineMode) {
                const currentEDO = getCurrentEDO(activity.logo.synth.inTemperament);
                const normalizedPitch = ((pitchNumber % currentEDO) + currentEDO) % currentEDO;
                tur.singer.defineMode.push(normalizedPitch);
                return;
            } else {
                if (
                    isCustomTemperament(activity.logo.synth.inTemperament) &&
                    tur.singer.scalarTransposition + tur.singer.transposition !== 0
                ) {
                    activity.errorMsg(
                        _(
                            "Scalar transpositions are equal to Semitone transpositions for custom temperament."
                        )
                    );
                }

                // In number to pitch we assume A0 == 0, so add offset
                const obj = numberToPitch(
                    pitchNumber + tur.singer.pitchNumberOffset,
                    activity.logo.synth.inTemperament,
                    activity.logo.synth.startingPitch,
                    tur.singer.pitchNumberOffset,
                    activity
                );
                Singer.processPitch(activity, obj[0], obj[1], 0, turtle, blk);
                return;
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
            if (!Number.isFinite(hertz)) return;
            const tur = activity.turtles.ithTurtle(turtle);

            const obj = frequencyToPitch(hertz);
            const note = obj[0];
            const octave = obj[1];
            const cents = obj[2];

            let startLength = 0;
            let blockId = null;
            if (tur.singer.inNoteBlock.length > 0) {
                blockId = last(tur.singer.inNoteBlock);
                if (tur.singer.notePitches && tur.singer.notePitches[blockId]) {
                    startLength = tur.singer.notePitches[blockId].length;
                }
            }

            Singer.processPitch(activity, note, octave, cents, turtle, blk);
            if (tur.singer.inNoteBlock.length > 0) {
                if (activity.logo.runningLilypond) {
                    let transformedHertz = hertz;
                    // processPitch applies all pitch transformations (transpose, scalar, invert, etc.)
                    // and stores the resulting pitch in the note block buffers.
                    // The original hertz input may not match the rendered pitch, so
                    // Lilypond export must use the transformed pitch instead of raw input.
                    if (
                        blockId !== null &&
                        tur.singer.notePitches &&
                        tur.singer.noteOctaves &&
                        tur.singer.noteCents &&
                        tur.singer.notePitches[blockId] &&
                        tur.singer.noteOctaves[blockId] &&
                        tur.singer.noteCents[blockId] &&
                        tur.singer.notePitches[blockId].length > startLength
                    ) {
                        const p = tur.singer.notePitches[blockId][startLength];
                        const o = tur.singer.noteOctaves[blockId][startLength];
                        const c = tur.singer.noteCents[blockId][startLength];
                        transformedHertz = pitchToFrequency(
                            p,
                            o,
                            c,
                            tur.singer.keySignature,
                            activity.logo.synth.inTemperament
                        );

                        if (c !== 0) {
                            const formattedHertz = Number(transformedHertz.toFixed(2));
                            activity.logo.notation.notationMarkup(turtle, formattedHertz);
                        }
                    }
                }
            }
            return;
        }

        /**
         * Plays a synth block from a raw frequency input while preserving the
         * legacy widget behavior for matrix, LEGO, and pitch slider contexts.
         *
         * @param {Number} hertz - frequency in hertz
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number|String} blk - corresponding Block object index in blocks.blockList
         */
        static playSynthFrequency(hertz, turtle, blk) {
            if (!Number.isFinite(hertz)) return;
            const tur = activity.turtles.ithTurtle(turtle);
            const obj = frequencyToPitch(hertz);

            if (activity.logo.inMatrix) {
                activity.logo.phraseMaker.addRowBlock(blk);
                if (!activity.logo.pitchBlocks.includes(blk)) {
                    activity.logo.pitchBlocks.push(blk);
                }

                activity.logo.phraseMaker.rowLabels.push(activity.blocks.blockList[blk].name);
                activity.logo.phraseMaker.rowArgs.push(hertz);
            } else if (activity.logo.inLegoWidget && !activity.logo.inMatrix) {
                activity.logo.legoWidget.addRowBlock(blk);
                if (!activity.logo.pitchBlocks.includes(blk)) {
                    activity.logo.pitchBlocks.push(blk);
                }

                activity.logo.legoWidget.rowLabels.push(activity.blocks.blockList[blk].name);
                activity.logo.legoWidget.rowArgs.push(hertz);
            } else if (activity.logo.inPitchSlider) {
                activity.logo.pitchSlider.frequency = hertz;
            } else {
                tur.singer.oscList[last(tur.singer.inNoteBlock)].push(
                    activity.blocks.blockList[blk].name
                );

                // We keep track of pitch and octave for notation purposes.
                tur.singer.notePitches[last(tur.singer.inNoteBlock)].push(obj[0]);
                tur.singer.noteOctaves[last(tur.singer.inNoteBlock)].push(obj[1]);
                tur.singer.noteCents[last(tur.singer.inNoteBlock)].push(obj[2]);
                if (obj[2] !== 0) {
                    tur.singer.noteHertz[last(tur.singer.inNoteBlock)].push(
                        pitchToFrequency(
                            obj[0],
                            obj[1],
                            obj[2],
                            tur.singer.keySignature,
                            activity.logo.synth.inTemperament
                        )
                    );
                } else {
                    tur.singer.noteHertz[last(tur.singer.inNoteBlock)].push(0);
                }

                tur.singer.noteBeatValues[last(tur.singer.inNoteBlock)].push(tur.singer.beatFactor);
                tur.singer.pushedNote = true;
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
                        break;
                    case _("flat"):
                        value = -1;
                        break;
                    default:
                        value = 0;
                        break;
                }
            } else {
                value = ACCIDENTALVALUES[i];
            }

            const tur = activity.turtles.ithTurtle(turtle);
            tur.singer.transposition += tur.singer.invertList.length > 0 ? -value : value;

            const listenerName = "_accidental_" + turtle + "_" + blk;
            if (blk !== undefined && blk in activity.blocks.blockList) {
                activity.logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (typeof MusicBlocks !== "undefined" && MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null) mouse.MB.listeners.push(listenerName);
            }

            const __listener = () => {
                tur.singer.transposition += tur.singer.invertList.length > 0 ? value : -value;
            };

            activity.logo.setTurtleListener(turtle, listenerName, __listener);
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
            if (!Number.isFinite(transValue)) return;
            const tur = activity.turtles.ithTurtle(turtle);

            const applied = tur.singer.invertList.length > 0 ? -transValue : transValue;
            tur.singer.scalarTransposition += applied;
            tur.singer.scalarTranspositionValues.push(transValue);

            const baseListenerName = "_scalar_transposition_" + turtle + "_" + blk;
            const listenerName = getUniqueListenerName(tur, baseListenerName);
            if (blk !== undefined && blk in activity.blocks.blockList) {
                activity.logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (typeof MusicBlocks !== "undefined" && MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null) mouse.MB.listeners.push(listenerName);
            }

            let cleanedUp = false;
            const __listener = () => {
                if (cleanedUp) return;
                cleanedUp = true;
                if (tur && tur.listeners) {
                    delete tur.listeners[listenerName];
                }
                if (
                    activity &&
                    activity.stage &&
                    typeof activity.stage.removeEventListener === "function"
                ) {
                    activity.stage.removeEventListener(listenerName, __listener, false);
                }
                const index = tur.singer.scalarTranspositionValues.lastIndexOf(transValue);
                if (index !== -1) {
                    tur.singer.scalarTranspositionValues.splice(index, 1);
                }
                tur.singer.scalarTransposition -= applied;
            };

            activity.logo.setTurtleListener(turtle, listenerName, __listener);
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
            if (!Number.isFinite(transValue)) return;
            const tur = activity.turtles.ithTurtle(turtle);

            const applied = tur.singer.invertList.length > 0 ? -transValue : transValue;
            tur.singer.transposition += applied;
            tur.singer.transpositionValues.push(transValue);

            const baseListenerName = "_transposition_" + turtle + "_" + blk;
            const listenerName = getUniqueListenerName(tur, baseListenerName);
            if (blk !== undefined && blk in activity.blocks.blockList) {
                activity.logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (typeof MusicBlocks !== "undefined" && MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null) mouse.MB.listeners.push(listenerName);
            }

            let cleanedUp = false;
            const __listener = () => {
                if (cleanedUp) return;
                cleanedUp = true;
                if (tur && tur.listeners) {
                    delete tur.listeners[listenerName];
                }
                if (
                    activity &&
                    activity.stage &&
                    typeof activity.stage.removeEventListener === "function"
                ) {
                    activity.stage.removeEventListener(listenerName, __listener, false);
                }
                const index = tur.singer.transpositionValues.lastIndexOf(transValue);
                if (index !== -1) {
                    tur.singer.transpositionValues.splice(index, 1);
                }
                tur.singer.transposition -= applied;
            };

            activity.logo.setTurtleListener(turtle, listenerName, __listener);
        }

        /**
         * Shifts the pitches contained inside Note blocks by a ratio.
         *
         * @param {Number} ratio
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @param {Number} [blk] - corresponding Block object index in blocks.blockList
         * @returns {void}
         */
        static setRatioTranspose(value, turtle, blk) {
            if (!Number.isFinite(value)) return;
            const tur = activity.turtles.ithTurtle(turtle);
            tur.singer.transpositionRatios.push(value);

            const baseListenerName = "_transposition_ratio_" + turtle + "_" + blk;
            const listenerName = getUniqueListenerName(tur, baseListenerName);
            if (blk !== undefined && blk in activity.blocks.blockList) {
                activity.logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (typeof MusicBlocks !== "undefined" && MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null) mouse.MB.listeners.push(listenerName);
            }

            let cleanedUp = false;
            const __listener = () => {
                if (cleanedUp) return;
                cleanedUp = true;
                if (tur && tur.listeners) {
                    delete tur.listeners[listenerName];
                }
                if (
                    activity &&
                    activity.stage &&
                    typeof activity.stage.removeEventListener === "function"
                ) {
                    activity.stage.removeEventListener(listenerName, __listener, false);
                }
                const index = tur.singer.transpositionRatios.lastIndexOf(value);
                if (index !== -1) {
                    tur.singer.transpositionRatios.splice(index, 1);
                }
            };

            activity.logo.setTurtleListener(turtle, listenerName, __listener);
        }

        /**
         * Provides an easy way to modify the register (octave) of the notes that follow it.
         *
         * @param {Number} value - register value
         * @param {Number} turtle - Turtle index in turtles.turtleList
         */
        static setRegister(value, turtle) {
            activity.turtles.ithTurtle(turtle).singer.register = Math.floor(value);
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

            const tur = activity.turtles.ithTurtle(turtle);

            let invertEntry = null;
            if (mode === "even" || mode === "odd" || mode === "scalar") {
                const _octave = calcOctave(
                    tur.singer.currentOctave,
                    octave,
                    tur.singer.lastNotePlayed,
                    name,
                    activity.logo.synth.inTemperament
                );
                invertEntry = [name, _octave, mode];
                tur.singer.invertList.push(invertEntry);
            }

            const baseListenerName = "_invert_" + turtle + "_" + blk;
            const listenerName = getUniqueListenerName(tur, baseListenerName);
            if (blk !== undefined && blk in activity.blocks.blockList) {
                activity.logo.setDispatchBlock(blk, turtle, listenerName);
            } else if (typeof MusicBlocks !== "undefined" && MusicBlocks.isRun) {
                const mouse = Mouse.getMouseFromTurtle(tur);
                if (mouse !== null) mouse.MB.listeners.push(listenerName);
            }

            let cleanedUp = false;
            const __listener = () => {
                if (cleanedUp) return;
                cleanedUp = true;
                if (tur && tur.listeners) {
                    delete tur.listeners[listenerName];
                }
                if (
                    activity &&
                    activity.stage &&
                    typeof activity.stage.removeEventListener === "function"
                ) {
                    activity.stage.removeEventListener(listenerName, __listener, false);
                }
                if (invertEntry !== null) {
                    const index = tur.singer.invertList.lastIndexOf(invertEntry);
                    if (index !== -1) {
                        tur.singer.invertList.splice(index, 1);
                    }
                }
            };
            activity.logo.setTurtleListener(turtle, listenerName, __listener);
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
                    Math.floor(number) +
                        activity.turtles.ithTurtle(turtle).singer.pitchNumberOffset,
                    activity.logo.synth.inTemperament,
                    undefined,
                    undefined,
                    activity
                );
                if (outType === "pitch") {
                    return obj[0];
                } else {
                    return obj[1];
                }
            } else {
                throw new Error("NoArgError");
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
            const tur = activity.turtles.ithTurtle(turtle);

            const _octave = Math.floor(
                calcOctave(
                    tur.singer.currentOctave,
                    octave,
                    tur.singer.lastNotePlayed,
                    pitch,
                    activity.logo.synth.inTemperament
                )
            );
            tur.singer.pitchNumberOffset = pitchToNumber(
                pitch,
                _octave,
                tur.singer.keySignature,
                activity.logo.synth.inTemperament
            );
        }

        /**
         * Returns change in pitch or scalar change in pitch.
         *
         * @param {String} outType - either "deltapitch" or "deltascalarpitch" to return
         * @param {Number} turtle - Turtle index in turtles.turtleList
         * @returns {Number} change/scalar change in pitch
         */
        static deltaPitch(outType, turtle) {
            const tur = activity.turtles.ithTurtle(turtle);

            // eslint-disable-next-line eqeqeq
            if (tur.singer.previousNotePlayed == null) {
                return 0;
            } else {
                const prevObj = noteToObj(tur.singer.previousNotePlayed[0]);
                const previousValue = pitchToNumber(
                    prevObj[0],
                    prevObj[1],
                    tur.singer.keySignature,
                    activity.logo.synth.inTemperament
                );

                let [pitch, octave] = prevObj;

                const lastObj = noteToObj(tur.singer.lastNotePlayed[0]);
                let delta =
                    pitchToNumber(
                        lastObj[0],
                        lastObj[1],
                        tur.singer.keySignature,
                        activity.logo.synth.inTemperament
                    ) - previousValue;
                if (outType === "deltapitch") {
                    // half-step difference
                    return delta;
                } else {
                    // convert to scalar steps
                    let scalarDelta = 0;
                    let i = 0;

                    const _calculate = type => {
                        i++;
                        const nhalf =
                            type === "up"
                                ? getStepSizeUp(
                                      tur.singer.keySignature,
                                      pitch,
                                      0,
                                      activity.logo.synth.inTemperament
                                  )
                                : getStepSizeDown(
                                      tur.singer.keySignature,
                                      pitch,
                                      0,
                                      activity.logo.synth.inTemperament
                                  );
                        delta -= nhalf;
                        scalarDelta += type === "up" ? 1 : -1;
                        const nextObj = getNote(
                            pitch,
                            octave,
                            nhalf,
                            tur.singer.keySignature,
                            tur.singer.movable,
                            null,
                            activity.errorMsg,
                            activity.logo.synth.inTemperament
                        );
                        [pitch, octave] = nextObj;

                        if (i > 100) return;
                    };

                    if (delta > 0) {
                        while (delta > 0 && i < 100) {
                            _calculate("up");
                        }
                    } else {
                        while (delta < 0 && i < 100) {
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
            const tur = activity.turtles.ithTurtle(turtle);
            const temp = activity.logo.synth.inTemperament;

            const _step = (direction, pitch) => {
                const step =
                    direction === "up"
                        ? getStepSizeUp(tur.singer.keySignature, pitch, undefined, temp)
                        : getStepSizeDown(tur.singer.keySignature, pitch, undefined, temp);
                return Number.isFinite(step) ? step : 1;
            };

            if (tur.singer.lastNotePlayed !== null) {
                return _step(stepType, noteToObj(tur.singer.lastNotePlayed[0])[0]);
            } else {
                return _step(stepType, "G");
            }
        }
    };
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = setupPitchActions;
}
