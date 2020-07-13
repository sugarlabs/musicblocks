/**
 * @file This contains the prototype of the Turtle's Painter component.
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
 * Class pertaining to music related actions for each turtle.
 *
 * @class
 * @classdesc This is the prototype of the Singer for each Turtle component. It is responsible
 * for the music related actions of the Turtle, including playing them while using utility functions
 * in utils/musicutils.js.
 *
 * @todo move music related states from logo.js to here eventually.
 * As of now, the state variables are completely present in logo.js. To ensure modularity and
 * independence of components, Logo should contain members only related to execution of blocks while
 * the logic of execution of blocks should be present in respective files in blocks/ directory,
 * which should eventually use members of this file and turtle-painter.js to proceed.
 *
 * Private methods' names begin with underscore '_".
 * Unused methods' names begin with double underscore '__'.
 * Internal functions' names are in PascalCase.
 */
class Singer {
    /**
     * @constructor
     * @param {Object} turtle - Turtle object
     */
    constructor(turtle) {
        this.turtle = turtle;
        this.turtles = turtle.turtles;
    }

    //  Deprecated
    // ========================================================================

    /**
     * @deprecated
     * @static
     * @param {*[]} args - arguments (parameters)
     * @param {Object} logo - Logo object
     * @param {Object} turtle - Turtle object
     * @param {Object} blk - corresponding Block object index in blocks.blockList
     */
    static playSynthBlock(args, logo, turtle, blk) {
        if (args.length === 1) {
            let obj = frequencyToPitch(args[0]);

            if (logo.inMatrix) {
                logo.pitchTimeMatrix.addRowBlock(blk);
                if (logo.pitchBlocks.indexOf(blk) === -1) {
                    logo.pitchBlocks.push(blk);
                }

                logo.pitchTimeMatrix.rowLabels.push(logo.blocks.blockList[blk].name);
                logo.pitchTimeMatrix.rowArgs.push(args[0]);
            } else if (logo.inPitchSlider) {
                logo.pitchSlider.Sliders.push([args[0], 0, 0]);
            } else {
                logo.oscList[turtle][last(logo.inNoteBlock[turtle])].push(
                    logo.blocks.blockList[blk].name
                );

                // We keep track of pitch and octave for notation purposes.
                logo.notePitches[turtle][last(logo.inNoteBlock[turtle])].push(obj[0]);
                logo.noteOctaves[turtle][last(logo.inNoteBlock[turtle])].push(obj[1]);
                logo.noteCents[turtle][last(logo.inNoteBlock[turtle])].push(obj[2]);
                if (obj[2] !== 0) {
                    logo.noteHertz[turtle][last(logo.inNoteBlock[turtle])].push(
                        pitchToFrequency(obj[0], obj[1], obj[2], logo.keySignature[turtle])
                    );
                } else {
                    logo.noteHertz[turtle][last(logo.inNoteBlock[turtle])].push(0);
                }

                logo.noteBeatValues[turtle][last(logo.inNoteBlock[turtle])].push(
                    logo.beatFactor[turtle]
                );
                logo.pushedNote[turtle] = true;
            }
        }
    }

    //  Utilities
    // ========================================================================

    /**
     * Shifts pitches by n steps relative to the provided scale.
     *
     * @static
     * @param {Object} logo
     * @param {Object} turtle
     * @param {String} note
     * @param {Number} octave
     * @param {Number} steps
     * @returns {[String, Number]} transposed [note, octave]
     */
    static addScalarTransposition(logo, turtle, note, octave, steps) {
        if (steps === 0)
            return [note, octave];

        let noteObj = getNote(
            note,
            octave,
            0,
            logo.keySignature[turtle],
            logo.moveable[turtle],
            null,
            logo.errorMsg,
            logo.synth.inTemperament
        );

        if (isCustom(logo.synth.inTemperament)) {
            noteObj = getNote(
                noteObj[0],
                noteObj[1],
                steps > 0 ?
                    getStepSizeUp(
                        logo.keySignature[turtle], noteObj[0], steps, logo.synth.inTemperament
                    ) :
                    getStepSizeDown(
                        logo.keySignature[turtle], noteObj[0], steps, logo.synth.inTemperament
                    ),
                logo.keySignature[turtle],
                logo.moveable[turtle],
                null,
                logo.errorMsg,
                logo.synth.inTemperament
            );
        } else {
            for (let i = 0; i < Math.abs(steps); i++) {
                noteObj = getNote(
                    noteObj[0],
                    noteObj[1],
                    steps > 0 ?
                        getStepSizeUp(logo.keySignature[turtle], noteObj[0]) :
                        getStepSizeDown(logo.keySignature[turtle], noteObj[0]),
                    logo.keySignature[turtle],
                    logo.moveable[turtle],
                    null,
                    logo.errorMsg,
                    logo.synth.inTemperament
                );
            }
        }

        return noteObj;
    }

    /**
     * Returns a distance for scalar transposition.
     *
     * @static
     * @param {Object} logo
     * @param {Object} turtle
     * @param {Number} firstNote
     * @param {Number} lastNote
     * @returns {Number} scalar distance
     */
    static scalarDistance(logo, turtle, firstNote, lastNote) {
        if (lastNote === firstNote)
            return 0;

        // Rather than just counting the semitones, we need to count the steps in the current key
        // needed to get from firstNote pitch to lastNote pitch

        let positive = false;
        if (lastNote > firstNote) {
            [firstNote, lastNote] = [lastNote, firstNote];
            positive = true;
        }

        let noteObj = numberToPitch(lastNote + logo.pitchNumberOffset[turtle]);
        let n = firstNote + logo.pitchNumberOffset[turtle];

        let i = 0;
        while (i++ < 100) {
            n += getStepSizeUp(logo.keySignature[turtle], noteObj[0]);
            if (n >= firstNote + logo.pitchNumberOffset[turtle])
                break;

            noteObj = numberToPitch(n);
        }

        return positive ? i : -i;
    }

    /**
     * Calculates the change needed for musical inversion.
     *
     * @static
     * @param {Object} logo
     * @param {Object} turtle
     * @param {String} note
     * @param {Number} octave
     * @returns {Number} inverted value
     */
    static calculateInvert(logo, turtle, note, octave) {
        let delta = 0;
        let note1 = getNote(
            note, octave, 0, logo.keySignature[turtle], logo.moveable[turtle], null, logo.errorMsg
        );
        let num1 =
            pitchToNumber(note1[0], note1[1], logo.keySignature[turtle]) -
            logo.pitchNumberOffset[turtle];

        for (let i = logo.invertList[turtle].length - 1; i >= 0; i--) {
            let note2 = getNote(
                logo.invertList[turtle][i][0],
                logo.invertList[turtle][i][1],
                0,
                logo.keySignature[turtle],
                logo.moveable[turtle],
                null,
                logo.errorMsg
            );
            let num2 =
                pitchToNumber(note2[0], note2[1], logo.keySignature[turtle]) -
                logo.pitchNumberOffset[turtle];

            if (logo.invertList[turtle][i][2] === "even") {
                delta += num2 - num1;
                num1 += 2 * delta;
            } else if (logo.invertList[turtle][i][2] === "odd") {
                delta += num2 - num1 + 0.5;
                num1 += 2 * delta;
            } else {
                // We need to calculate the scalar difference
                let scalarSteps = Singer.scalarDistance(logo, turtle, num2, num1);
                let note3 = Singer.addScalarTransposition(
                    logo, turtle, note2[0], note2[1], -scalarSteps
                );
                let num3 =
                    pitchToNumber(note3[0], note3[1], logo.keySignature[turtle]) -
                    logo.pitchNumberOffset[turtle];

                delta += (num3 - num1) / 2;
                num1 = num3;
            }
        }

        return delta;
    }

    /**
     * Counts notes, with saving of the box, heap and turtle states.
     *
     * @static
     * @param {Object} logo
     * @param {Object} turtle
     * @param {Number} cblk - block number
     * @returns {Number} note count
     */
    static noteCounter(logo, turtle, cblk) {
        if (cblk === null)
            return 0;

        let saveSuppressStatus = logo.suppressOutput[turtle];

        // We need to save the state of the boxes and heap although there is a potential of a boxes collision with other turtles
        let saveBoxes = JSON.stringify(logo.boxes);
        let saveTurtleHeaps = JSON.stringify(logo.turtleHeaps[turtle]);
        // .. and the turtle state
        let saveX = logo.turtles.turtleList[turtle].x;
        let saveY = logo.turtles.turtleList[turtle].y;
        let saveColor = logo.turtles.turtleList[turtle].painter.color;
        let saveValue = logo.turtles.turtleList[turtle].painter.value;
        let saveChroma = logo.turtles.turtleList[turtle].painter.chroma;
        let saveStroke = logo.turtles.turtleList[turtle].painter.stroke;
        let saveCanvasAlpha = logo.turtles.turtleList[turtle].painter.canvasAlpha;
        let saveOrientation = logo.turtles.turtleList[turtle].orientation;
        let savePenState = logo.turtles.turtleList[turtle].painter.penState;

        let saveWhichNoteToCount = logo.whichNoteToCount[turtle];

        let savePrevTurtleTime = logo.previousTurtleTime[turtle];
        let saveTurtleTime = logo.turtleTime[turtle];

        logo.suppressOutput[turtle] = true;
        logo.justCounting[turtle].push(true);

        for (let b in logo.endOfClampSignals[turtle]) {
            logo.butNotThese[turtle][b] = [];
            for (let i in logo.endOfClampSignals[turtle][b]) {
                logo.butNotThese[turtle][b].push(i);
            }
        }

        let actionArgs = [];
        let saveNoteCount = logo.notesPlayed[turtle];
        logo.turtles.turtleList[turtle].running = true;

        if (logo.inNoteBlock[turtle]) {
            logo.whichNoteToCount[turtle] += logo.inNoteBlock[turtle].length;
        }

        logo.runFromBlockNow(
            logo, turtle, cblk, true, actionArgs, logo.turtles.turtleList[turtle].queue.length
        );

        let returnValue = rationalSum(
            logo.notesPlayed[turtle], [-saveNoteCount[0], saveNoteCount[1]]
        );
        logo.notesPlayed[turtle] = saveNoteCount;

        // Restore previous state
        console.debug(saveBoxes);
        logo.boxes = JSON.parse(saveBoxes);
        console.debug(saveTurtleHeaps);
        logo.turtleHeaps[turtle] = JSON.parse(saveTurtleHeaps);

        logo.turtles.turtleList[turtle].painter.doPenUp();
        logo.turtles.turtleList[turtle].painter.doSetXY(saveX, saveY);
        logo.turtles.turtleList[turtle].painter.color = saveColor;
        logo.turtles.turtleList[turtle].painter.value = saveValue;
        logo.turtles.turtleList[turtle].painter.chroma = saveChroma;
        logo.turtles.turtleList[turtle].painter.stroke = saveStroke;
        logo.turtles.turtleList[turtle].painter.canvasAlpha = saveCanvasAlpha;
        logo.turtles.turtleList[turtle].painter.doSetHeading(saveOrientation);
        logo.turtles.turtleList[turtle].painter.penState = savePenState;

        logo.previousTurtleTime[turtle] = savePrevTurtleTime;
        logo.turtleTime[turtle] = saveTurtleTime;

        logo.whichNoteToCount[turtle] = saveWhichNoteToCount;

        logo.justCounting[turtle].pop();
        logo.suppressOutput[turtle] = saveSuppressStatus;

        logo.butNotThese[turtle] = {};

        return returnValue[0] / returnValue[1];
    }

    /**
     * Sets the master volume to a value of at least 0 and at most 100.
     *
     * @static
     * @param {Object} logo
     * @param {Number} volume
     * @returns {void}
     */
    static setMasterVolume(logo, volume) {
        volume = Math.min(Math.max(volume, 0), 100);

        if (_THIS_IS_MUSIC_BLOCKS_) {
            logo.synth.setMasterVolume(volume);
            for (let turtle in logo.turtles.turtleList) {
                for (let synth in logo.synthVolume[turtle]) {
                    logo.synthVolume[turtle][synth].push(volume);
                }
            }
        }
    }

    /**
     * Sets the synth volume to a value of at least 0 and, unless the synth is noise3, at most 100.
     *
     * @static
     * @param {Object} logo
     * @param {Object} turtle
     * @param {Number} synth
     * @param {Number} volume
     * @returns {void}
     */
    static setSynthVolume(logo, turtle, synth, volume) {
        volume = Math.min(Math.max(volume, 0), 100);

        if (_THIS_IS_MUSIC_BLOCKS_) {
            switch (synth) {
                case "noise1":
                case "noise2":
                case "noise3":
                    // Noise is very very loud
                    logo.synth.setVolume(turtle, synth, volume / 25);
                    break;
                default:
                    logo.synth.setVolume(turtle, synth, volume);
            }
        }
    }

    //  Action
    // ========================================================================

    /**
     * @static
     * @param {String} note - note value or solfege
     * @param {Number} octave - scale octave
     * @param {Number} cents - semitone offset due to accidentals
     * @param {Object} logo - Logo object
     * @param {Object} turtle - Turtle object
     * @param {Object} blk - corresponding Block object index in blocks.blockList
     */
    static processPitch(note, octave, cents, logo, turtle, blk) {
        let noteObj = Singer.addScalarTransposition(
            logo, turtle, note, octave, logo.scalarTransposition[turtle]
        );
        [note, octave] = noteObj;

        if (logo.inNeighbor[turtle].length > 0) {
            noteObj = getNote(
                note,
                octave,
                logo.transposition[turtle],
                logo.keySignature[turtle],
                logo.moveable[turtle],
                null,
                logo.errorMsg,
                logo.synth.inTemperament
            );
            logo.neighborArgNote1[turtle].push(noteObj[0] + noteObj[1]);

            let noteObj2;
            if (logo.blocks.blockList[last(logo.inNeighbor[turtle])].name === "neighbor2") {
                noteObj2 = Singer.addScalarTransposition(
                   logo, turtle, note, octave, parseInt(logo.neighborStepPitch[turtle])
                );
                if (logo.transposition[turtle] !== 0) {
                    noteObj2 = getNote(
                        noteObj2[0],
                        noteObj2[1],
                        logo.transposition[turtle],
                        logo.keySignature[turtle],
                        logo.moveable[turtle],
                        null,
                        logo.errorMsg,
                        logo.synth.inTemperament
                    );
                }
            } else {
                noteObj2 = getNote(
                    note,
                    octave,
                    logo.transposition[turtle] + parseInt(logo.neighborStepPitch[turtle]),
                    logo.keySignature[turtle],
                    logo.moveable[turtle],
                    null,
                    logo.errorMsg,
                    logo.synth.inTemperament
                );
            }

            logo.neighborArgNote2[turtle].push(noteObj2[0] + noteObj2[1]);
        }

        let delta =
            logo.invertList[turtle].length > 0 ?
                Singer.calculateInvert(logo, turtle, note, octave) : 0;

        if (logo.justMeasuring[turtle].length > 0) {
            let transposition = turtle in logo.transposition ? logo.transposition[turtle] : 0;

            noteObj = getNote(
                note,
                octave,
                transposition,
                logo.keySignature[turtle],
                logo.moveable[turtle],
                null,
                logo.errorMsg,
                logo.synth.inTemperament
            );

            let n = logo.justMeasuring[turtle].length;
            let pitchNumber =
                pitchToNumber(noteObj[0], noteObj[1], logo.keySignature[turtle]) -
                logo.pitchNumberOffset[turtle];
            if (logo.firstPitch[turtle].length < n) {
                logo.firstPitch[turtle].push(pitchNumber);
            } else if (logo.lastPitch[turtle].length < n) {
                logo.lastPitch[turtle].push(pitchNumber);
            }
        } else if (logo.inPitchDrumMatrix) {
            if (note.toLowerCase() !== "rest") {
                logo.pitchDrumMatrix.addRowBlock(blk);
                if (logo.pitchBlocks.indexOf(blk) === -1) {
                    logo.pitchBlocks.push(blk);
                }
            }

            let duplicateFactor =
                logo.duplicateFactor[turtle].length > 0 ? logo.duplicateFactor[turtle] : 1;

            for (let i = 0; i < duplicateFactor; i++) {
                // Apply transpositions
                let transposition = 2 * delta;
                if (turtle in logo.transposition) {
                    transposition += logo.transposition[turtle];
                }

                let nnote = getNote(
                    note,
                    octave,
                    transposition,
                    logo.keySignature[turtle],
                    logo.moveable[turtle],
                    null,
                    logo.errorMsg,
                    logo.synth.inTemperament
                );
                nnote[0] = noteIsSolfege(note) ? getSolfege(nnote[0]) : nnote[0];

                if (logo.drumStyle[turtle].length > 0) {
                    logo.pitchDrumMatrix.drums.push(last(logo.drumStyle[turtle]));
                } else {
                    logo.pitchDrumMatrix.rowLabels.push(nnote[0]);
                    logo.pitchDrumMatrix.rowArgs.push(nnote[1]);
                }
            }
        } else if (logo.inMatrix) {
            if (note.toLowerCase() !== "rest") {
                logo.pitchTimeMatrix.addRowBlock(blk);
                if (logo.pitchBlocks.indexOf(blk) === -1) {
                    logo.pitchBlocks.push(blk);
                }
            }

            let duplicateFactor =
                logo.duplicateFactor[turtle].length > 0 ? logo.duplicateFactor[turtle] : 1;

            for (let i = 0; i < duplicateFactor; i++) {
                // Apply transpositions
                let transposition = 2 * delta;
                if (turtle in logo.transposition) {
                    transposition += logo.transposition[turtle];
                }

                let noteObj = getNote(
                    note,
                    octave,
                    transposition,
                    logo.keySignature[turtle],
                    logo.moveable[turtle],
                    null,
                    logo.errorMsg,
                    logo.synth.inTemperament
                );
                logo.previousNotePlayed[turtle] = logo.lastNotePlayed[turtle];
                logo.lastNotePlayed[turtle] = [noteObj[0] + noteObj[1], 4];

                if (
                    logo.keySignature[turtle][0] === "C" &&
                    logo.keySignature[turtle][1].toLowerCase() === "major" &&
                    noteIsSolfege(note)
                ) {
                    noteObj[0] = getSolfege(noteObj[0]);
                }

                // If we are in a setdrum clamp, override the pitch.
                if (logo.drumStyle[turtle].length > 0) {
                    logo.pitchTimeMatrix.rowLabels.push(
                        last(logo.drumStyle[turtle])
                    );
                    logo.pitchTimeMatrix.rowArgs.push(-1);
                } else {
                    // Was the pitch arg a note name or solfege name?
                    if (
                        SOLFEGENAMES1.indexOf(note) !== -1 &&
                        noteObj[0] in SOLFEGECONVERSIONTABLE
                    ) {
                        logo.pitchTimeMatrix.rowLabels.push(
                            SOLFEGECONVERSIONTABLE[noteObj[0]]
                        );
                    } else {
                        logo.pitchTimeMatrix.rowLabels.push(noteObj[0]);
                    }

                    logo.pitchTimeMatrix.rowArgs.push(noteObj[1]);
                }
            }
        } else if (logo.inNoteBlock[turtle].length > 0) {
            function addPitch(note, octave, cents, direction) {
                let noteObj = getNote(
                    note,
                    octave,
                    transposition + logo.register[turtle] * 12,
                    logo.keySignature[turtle],
                    logo.moveable[turtle],
                    direction,
                    logo.errorMsg,
                    logo.synth.inTemperament
                );

                if (logo.drumStyle[turtle].length > 0) {
                    let drumname = last(logo.drumStyle[turtle]);
                    logo.pitchDrumTable[turtle][noteObj[0] + noteObj[1]] = drumname;
                }

                logo.notePitches[turtle][last(logo.inNoteBlock[turtle])].push(noteObj[0]);
                logo.noteOctaves[turtle][last(logo.inNoteBlock[turtle])].push(noteObj[1]);
                logo.noteCents[turtle][last(logo.inNoteBlock[turtle])].push(cents);
                logo.noteHertz[turtle][last(logo.inNoteBlock[turtle])].push(
                    cents === 0 ? 0 : pitchToFrequency(
                        noteObj[0],
                        noteObj[1],
                        cents,
                        logo.keySignature[turtle]
                    )
                );

                return noteObj;
            }

            // Apply transpositions
            let transposition = 2 * delta;
            if (turtle in logo.transposition) {
                transposition += logo.transposition[turtle];
            }

            let noteObj1 = addPitch(note, octave, cents);

            if (turtle in logo.intervals && logo.intervals[turtle].length > 0) {
                for (let i = 0; i < logo.intervals[turtle].length; i++) {
                    let noteObj2 = getNote(
                        noteObj1[0],
                        noteObj1[1],
                        getInterval(
                            logo.intervals[turtle][i],
                            logo.keySignature[turtle],
                            noteObj1[0]
                        ),
                        logo.keySignature[turtle],
                        logo.moveable[turtle],
                        null,
                        logo.errorMsg,
                        logo.synth.inTemperament
                    );
                    addPitch(noteObj2[0], noteObj2[1], cents);
                }
            }

            if (turtle in logo.semitoneIntervals && logo.semitoneIntervals[turtle].length > 0) {
                for (let i = 0; i < logo.semitoneIntervals[turtle].length; i++) {
                    let noteObj2 = getNote(
                        noteObj1[0],
                        noteObj1[1],
                        logo.semitoneIntervals[turtle][i][0],
                        logo.keySignature[turtle],
                        logo.moveable[turtle],
                        null,
                        logo.errorMsg,
                        logo.synth.inTemperament
                    );
                    addPitch(
                        noteObj2[0], noteObj2[1], cents, logo.semitoneIntervals[turtle][i][1]
                    );
                }
            }

            if (logo.inNoteBlock[turtle].length > 0) {
                logo.noteBeatValues[turtle][last(logo.inNoteBlock[turtle])].push(
                    logo.beatFactor[turtle]
                );
            }

            logo.pushedNote[turtle] = true;
        } else if (logo.drumStyle[turtle].length > 0) {
            let drumname = last(logo.drumStyle[turtle]);
            let transposition = turtle in logo.transposition ? logo.transposition[turtle] : 0;

            let noteObj1 = getNote(
                note,
                octave,
                transposition,
                logo.keySignature[turtle],
                logo.moveable[turtle],
                null,
                logo.errorMsg
            );
            logo.pitchDrumTable[turtle][noteObj1[0] + noteObj1[1]] = drumname;
        } else if (logo.inPitchStaircase) {
            let frequency = pitchToFrequency(note, octave, 0, logo.keySignature[turtle]);
            let noteObj1 = getNote(
                note,
                octave,
                0,
                logo.keySignature[turtle],
                logo.moveable[turtle],
                null,
                logo.errorMsg
            );

            for (let i = 0; i < logo.pitchStaircase.Stairs.length; i++) {
                if (logo.pitchStaircase.Stairs[i][2] < parseFloat(frequency)) {
                    logo.pitchStaircase.Stairs.splice(i, 0, [
                        noteObj1[0], noteObj1[1], parseFloat(frequency), 1, 1
                    ]);
                    return;
                }

                if (logo.pitchStaircase.Stairs[i][2] === parseFloat(frequency)) {
                    logo.pitchStaircase.Stairs.splice(i, 1, [
                        noteObj1[0], noteObj1[1], parseFloat(frequency), 1, 1
                    ]);
                    return;
                }
            }

            logo.pitchStaircase.Stairs.push(
                [noteObj1[0], noteObj1[1], parseFloat(frequency), 1, 1]
            );

            logo.pitchStaircase.stairPitchBlocks.push(blk);
        } else if (logo.inMusicKeyboard) {
            // Apply transpositions
            let transposition = 2 * delta;
            if (turtle in logo.transposition) {
                transposition += logo.transposition[turtle];
            }

            let nnote = getNote(
                note,
                octave,
                transposition,
                logo.keySignature[turtle],
                logo.moveable[turtle],
                null,
                logo.errorMsg
            );
            nnote[0] = noteIsSolfege(note) ? getSolfege(nnote[0]) : nnote[0];

            if (logo.drumStyle[turtle].length === 0) {
                logo.musicKeyboard.instruments.push(last(logo.instrumentNames[turtle]));
                logo.musicKeyboard.noteNames.push(nnote[0]);
                logo.musicKeyboard.octaves.push(nnote[1]);
                logo.musicKeyboard.addRowBlock(blk);
                logo.lastNotePlayed[turtle] = [noteObj[0] + noteObj[1], 4];
            }
        } else {
            // Play a stand-alone pitch block as a quarter note.
            logo.clearNoteParams(turtle, blk, []);
            if (logo.currentCalculatedOctave[turtle] === undefined) {
                logo.currentCalculatedOctave[turtle] = 4;
            }

            let noteObj = getNote(
                note,
                octave,
                0,
                logo.keySignature[turtle],
                logo.moveable[turtle],
                null,
                logo.errorMsg
            );

            logo.inNoteBlock[turtle].push(blk);
            logo.notePitches[turtle][last(logo.inNoteBlock[turtle])].push(noteObj[0]);
            logo.noteOctaves[turtle][last(logo.inNoteBlock[turtle])].push(noteObj[1]);
            logo.noteCents[turtle][last(logo.inNoteBlock[turtle])].push(cents);
            logo.noteHertz[turtle][last(logo.inNoteBlock[turtle])].push(
                cents === 0 ? 0 : pitchToFrequency(
                    noteObj[0], noteObj[1], cents, logo.keySignature[turtle]
                )
            );

            Singer.processNote(logo, 4, blk, turtle, () => {
                logo.inNoteBlock[turtle].splice(logo.inNoteBlock[turtle].indexOf(blk), 1);
            });
        }
    }

    /**
     * Processes and plays a note clamp.
     *
     * @static
     * @param {Number} value - note value
     * @param {Object} logo - Logo object
     * @param {Object} turtle - Turtle object
     * @param {Object} blk - corresponding Block object index in blocks.blockList
     */
    static playNote(value, logo, turtle, blk, _enqueue) {
        /**
         * We queue up the child flow of the note clamp and once all of the children are run, we
         * trigger a _playnote_ event, then wait for the note to play. The note can be specified
         * by pitch or synth blocks. The osctime block specifies the duration in milleseconds
         * while the note block specifies duration as a beat value.
         *
         * @todo We should consider the use of the global timer in Tone.js for more accuracy.
         */

        // Use the outer most note when nesting to determine the beat and triggering
        if (logo.inNoteBlock[turtle].length === 0) {
            let beatValue, measureValue;
            if (logo.notesPlayed[turtle][0] / logo.notesPlayed[turtle][1] < logo.pickup[turtle]) {
                beatValue = measureValue = 0;
            } else {
                let beat = logo.noteValuePerBeat[turtle] * (
                    logo.notesPlayed[turtle][0] / logo.notesPlayed[turtle][1] - logo.pickup[turtle]
                );
                beatValue = 1 + beat % logo.beatsPerMeasure[turtle];
                measureValue = 1 + Math.floor(beat / logo.beatsPerMeasure[turtle]);
            }

            logo.currentBeat[turtle] = beatValue;
            logo.currentMeasure[turtle] = measureValue;

            /**
             * Queue any beat actions.
             * Put the childFlow into the queue before the beat action so logo the beat action is
             * at the end of the FILO.
             * Note: The offbeat cannot be Beat 1.
            */
            let turtleID = logo.turtles.turtleList[turtle].id;

            if (logo.beatList[turtle].indexOf("everybeat") !== -1) {
                _enqueue();
                logo.stage.dispatchEvent("__everybeat_" + turtleID + "__");
            }

            if (logo.beatList[turtle].indexOf(beatValue) !== -1) {
                _enqueue();
                logo.stage.dispatchEvent("__beat_" + beatValue + "_" + turtleID + "__");
            } else if (beatValue > 1 && logo.beatList[turtle].indexOf("offbeat") !== -1) {
                _enqueue();
                logo.stage.dispatchEvent("__offbeat_" + turtleID + "__");
            }

            let thisBeat =
                beatValue + logo.beatsPerMeasure[turtle] * (logo.currentMeasure[turtle] - 1);
            for (let f = 0; f < logo.factorList[turtle].length; f++) {
                if (thisBeat % logo.factorList[turtle][f] === 0) {
                    _enqueue();
                    let eventName = "__beat_" + logo.factorList[turtle][f] + "_" + turtleID + "__";
                    logo.stage.dispatchEvent(eventName);
                }
            }
        }

        // A note can contain multiple pitch blocks to create a chord. The chord is accumuated in
        // arrays, which are used when we play the note
        logo.clearNoteParams(turtle, blk, []);

        let noteBeatValue = logo.blocks.blockList[blk].name === "newnote" ? 1 / value : value;

        logo.inNoteBlock[turtle].push(blk);
        logo.multipleVoices[turtle] = logo.inNoteBlock[turtle].length > 1 ? true : false;

        // Adjust the note value based on the beatFactor
        logo.noteValue[turtle][last(logo.inNoteBlock[turtle])] =
            1 / (noteBeatValue * logo.beatFactor[turtle]);

        let listenerName = "_playnote_" + turtle;
        logo.setDispatchBlock(blk, turtle, listenerName);

        let __listener = event => {
            if (logo.multipleVoices[turtle]) {
                logo.notation.notationVoices(turtle, logo.inNoteBlock[turtle].length);
            }

            if (logo.inNoteBlock[turtle].length > 0) {
                if (logo.inNeighbor[turtle].length > 0) {
                    let neighborNoteValue = logo.neighborNoteValue[turtle];
                    logo.neighborArgBeat[turtle].push(
                        logo.beatFactor[turtle] * (1 / neighborNoteValue)
                    );

                    let nextBeat = 1 / noteBeatValue - 2 * logo.neighborNoteValue[turtle];
                    logo.neighborArgCurrentBeat[turtle].push(
                        logo.beatFactor[turtle] * (1 / nextBeat)
                    );
                }

                Singer.processNote(
                    logo,
                    1 / logo.noteValue[turtle][last(logo.inNoteBlock[turtle])],
                    last(logo.inNoteBlock[turtle]),
                    turtle
                );
            }

            delete logo.oscList[turtle][last(logo.inNoteBlock[turtle])];
            delete logo.noteBeat[turtle][last(logo.inNoteBlock[turtle])];
            delete logo.noteBeatValues[turtle][last(logo.inNoteBlock[turtle])];
            delete logo.noteValue[turtle][last(logo.inNoteBlock[turtle])];
            delete logo.notePitches[turtle][last(logo.inNoteBlock[turtle])];
            delete logo.noteOctaves[turtle][last(logo.inNoteBlock[turtle])];
            delete logo.noteCents[turtle][last(logo.inNoteBlock[turtle])];
            delete logo.noteHertz[turtle][last(logo.inNoteBlock[turtle])];
            delete logo.noteDrums[turtle][last(logo.inNoteBlock[turtle])];
            delete logo.embeddedGraphics[turtle][last(logo.inNoteBlock[turtle])];
            logo.inNoteBlock[turtle].splice(-1, 1);

            if (logo.multipleVoices[turtle] && logo.inNoteBlock[turtle].length === 0) {
                logo.notation.notationVoices(turtle, logo.inNoteBlock[turtle].length);
                logo.multipleVoices[turtle] = false;
            }

            /** @todo FIXME: broken when nesting */
            logo.pitchBlocks = [];
            logo.drumBlocks = [];
        };

        logo.setTurtleListener(turtle, listenerName, __listener);
    }

    /**
     * Processes a single note.
     *
     * @static
     * @param {Object} logo - Logo object
     * @param {Number} noteValue
     * @param {Object} blk - corresponding Block object index in blocks.blockList
     * @param {Object} turtle - Turtle object
     * @param {Function} callback
     */
    static processNote(logo, noteValue, blk, turtle, callback) {
        let bpmFactor;
        if (logo.bpm[turtle].length > 0) {
            bpmFactor = TONEBPM / last(logo.bpm[turtle]);
        } else {
            bpmFactor = TONEBPM / logo._masterBPM;
        }

        let noteBeatValue;
        if (logo.blocks.blockList[blk].name === "osctime") {
            // Convert msecs to note value.
            if (noteValue == 0) {
                noteBeatValue = 0;
            } else {
                noteBeatValue = (bpmFactor * 1000) / noteValue;
            }
        } else {
            noteBeatValue = noteValue;
        }

        let vibratoRate = 0;
        let vibratoValue = 0;
        let vibratoIntensity = 0;
        let distortionAmount = 0;
        let tremoloFrequency = 0;
        let tremoloDepth = 0;
        let rate = 0;
        let octaves = 0;
        let baseFrequency = 0;
        let chorusRate = 0;
        let delayTime = 0;
        let chorusDepth = 0;
        let partials = [];
        let neighborArgNote1 = [];
        let neighborArgNote2 = [];
        let neighborArgBeat = 0;
        let neighborArgCurrentBeat = 0;
        let doVibrato = false;
        let doDistortion = false;
        let doTremolo = false;
        let doPhaser = false;
        let doChorus = false;
        let doNeighbor = false;
        let filters = null;

        // Apply any effects and filters associated with a custom timbre.
        if (
            logo.inSetTimbre[turtle] &&
            turtle in logo.instrumentNames &&
            last(logo.instrumentNames[turtle])
        ) {
            let name = last(logo.instrumentNames[turtle]);

            if (name in instrumentsEffects[turtle]) {
                let timbreEffects = instrumentsEffects[turtle][name];

                if (timbreEffects["vibratoActive"]) {
                    vibratoRate = timbreEffects["vibratoRate"];
                    vibratoIntensity = timbreEffects["vibratoIntensity"];
                    doVibrato = true;
                }

                if (timbreEffects["distortionActive"]) {
                    distortionAmount = timbreEffects["distortionAmount"];
                    doDistortion = true;
                }

                if (timbreEffects["tremoloActive"]) {
                    tremoloFrequency = timbreEffects["tremoloFrequency"];
                    tremoloDepth = timbreEffects["tremoloDepth"];
                    doTremolo = true;
                }

                if (timbreEffects["phaserActive"]) {
                    rate = timbreEffects["rate"];
                    octaves = timbreEffects["octaves"];
                    baseFrequency = timbreEffects["baseFrequency"];
                    doPhaser = true;
                }

                if (timbreEffects["chorusActive"]) {
                    chorusRate = timbreEffects["chorusRate"];
                    delayTime = timbreEffects["delayTime"];
                    chorusDepth = timbreEffects["chorusDepth"];
                    doChorus = true;
                }
            }

            if (name in instrumentsFilters[turtle]) {
                filters = instrumentsFilters[turtle][name];
            }
        }

        // Apply effects.
        if (logo.vibratoRate[turtle].length > 0) {
            vibratoRate = last(logo.vibratoRate[turtle]);
            vibratoIntensity = last(logo.vibratoIntensity[turtle]);
            doVibrato = true;
        }

        if (logo.distortionAmount[turtle].length > 0) {
            distortionAmount = last(logo.distortionAmount[turtle]);
            doDistortion = true;
        }

        if (logo.tremoloDepth[turtle].length > 0) {
            tremoloFrequency = last(logo.tremoloFrequency[turtle]);
            tremoloDepth = last(logo.tremoloDepth[turtle]);
            doTremolo = true;
        }

        if (logo.rate[turtle].length > 0) {
            rate = last(logo.rate[turtle]);
            octaves = last(logo.octaves[turtle]);
            baseFrequency = last(logo.baseFrequency[turtle]);
            doPhaser = true;
        }

        if (logo.chorusRate[turtle].length > 0) {
            chorusRate = last(logo.chorusRate[turtle]);
            delayTime = last(logo.delayTime[turtle]);
            chorusDepth = last(logo.chorusDepth[turtle]);
            doChorus = true;
        }

        partials = [1];
        if (logo.inHarmonic[turtle].length > 0) {
            if (partials.length === 0) {
                //.TRANS: partials are weighted components in a harmonic series
                logo.errorMsg(
                    _(
                        "You must have at least one Partial block inside of a Weighted-partial block"
                    )
                );
            } else {
                partials = last(logo.partials[turtle]);
            }
        }

        if (logo.inNeighbor[turtle].length > 0) {
            let len = logo.neighborArgNote1[turtle].length;
            for (let i = 0; i < len; i++) {
                neighborArgNote1.push(logo.neighborArgNote1[turtle].pop());
                neighborArgNote2.push(logo.neighborArgNote2[turtle].pop());
            }

            neighborArgBeat = bpmFactor / last(logo.neighborArgBeat[turtle]);
            neighborArgCurrentBeat =
                bpmFactor / last(logo.neighborArgCurrentBeat[turtle]);
            doNeighbor = true;
        }

        let carry = 0;

        if (
            logo.inCrescendo[turtle].length > 0 &&
            logo.crescendoDelta[turtle].length === 0
        ) {
            logo.inCrescendo[turtle].pop();
            for (let synth in logo.synthVolume[turtle]) {
                Singer.setSynthVolume(
                    logo, turtle, "electronic synth", last(logo.synthVolume[turtle][synth])
                );
            }
        } else if (logo.crescendoDelta[turtle].length > 0) {
            if (
                last(logo.synthVolume[turtle]["electronic synth"]) ===
                last(
                    logo.crescendoInitialVolume[turtle]["electronic synth"]
                ) &&
                logo.justCounting[turtle].length === 0
            ) {
                logo.notation.notationBeginCrescendo(turtle, last(logo.crescendoDelta[turtle]));
            }

            for (let synth in logo.synthVolume[turtle]) {
                let len = logo.synthVolume[turtle][synth].length;
                logo.synthVolume[turtle][synth][len - 1] += last(
                    logo.crescendoDelta[turtle]
                );
                console.debug(
                    synth + "= " + logo.synthVolume[turtle][synth][len - 1]
                );
                if (!logo.suppressOutput[turtle]) {
                    Singer.setSynthVolume(
                        logo, turtle, synth, last(logo.synthVolume[turtle][synth])
                    );
                }
            }
        }

        if (logo.inTimbre) {
            let noteObj = getNote(
                logo.notePitches[turtle][last(logo.inNoteBlock[turtle])][0],
                logo.noteOctaves[turtle][last(logo.inNoteBlock[turtle])][0],
                0,
                logo.keySignature[turtle],
                logo.moveable[turtle],
                null,
                logo.errorMsg
            );
            logo.timbre.notesToPlay.push([
                noteObj[0] + noteObj[1],
                1 / noteBeatValue
            ]);
            logo.previousNotePlayed[turtle] = logo.lastNotePlayed[turtle];
            logo.lastNotePlayed[turtle] = [
                noteObj[0] + noteObj[1],
                noteBeatValue
            ];
        } else if (logo.inMatrix || logo.tuplet) {
            if (logo.inNoteBlock[turtle].length > 0) {
                logo.pitchTimeMatrix.addColBlock(blk, 1);

                // Find the block ID of parent "matrix" block
                let mat_block = -1;
                let par = logo.blocks.blockList[blk].connections[0];
                while (par != null) {
                    if (logo.blocks.blockList[par].name === "matrix") {
                        mat_block = par;
                        break;
                    } else {
                        par = logo.blocks.blockList[par].connections[0];
                    }
                }
                for (let i = 0; i < logo.pitchBlocks.length; i++) {
                    logo.pitchTimeMatrix.addNode(
                        logo.pitchBlocks[i], blk, 0, mat_block
                    );
                }

                for (let i = 0; i < logo.drumBlocks.length; i++) {
                    logo.pitchTimeMatrix.addNode(
                        logo.drumBlocks[i], blk, 0, mat_block
                    );
                }
            }

            noteBeatValue *= logo.beatFactor[turtle];
            if (logo.tuplet) {
                if (logo.addingNotesToTuplet) {
                    let i = logo.tupletRhythms.length - 1;
                    logo.tupletRhythms[i].push(noteBeatValue);
                } else {
                    logo.tupletRhythms.push([
                        "notes",
                        logo.tupletParams.length - 1,
                        noteBeatValue
                    ]);
                    logo.addingNotesToTuplet = true;
                }
            } else {
                logo.tupletRhythms.push(["", 1, noteBeatValue]);
            }
        } else {
            // We start the music clock as the first note is being
            // played.
            let d;
            if (logo.firstNoteTime == null) {
                // && !logo.suppressOutput[turtle]) {
                d = new Date();
                logo.firstNoteTime = d.getTime();
            }

            // Calculate a lag: In case this turtle has fallen behind,
            // we need to catch up.
            d = new Date();
            let elapsedTime = (d.getTime() - logo.firstNoteTime) / 1000;
            let turtleLag;
            if (logo.drift[turtle] === 0) {
                // How far behind is this turtle lagging?
                turtleLag = Math.max(
                    elapsedTime - logo.turtleTime[turtle],
                    0
                );
            } else {
                // When we are "drifting", we don't bother with lag.
                turtleLag = 0;
            }

            // Delay running graphics from second note in tie.
            let tieDelay;
            if (logo.tie[turtle]) {
                tieDelay = logo.tieCarryOver[turtle];
            } else {
                tieDelay = 0;
            }

            // If we are in a tie, depending upon parity, we either
            // add the duration from the prvious note to the current
            // note, or we cache the duration and set the wait to
            // zero. TESTME: May not work when using dup and skip.
            if (logo.tie[turtle]) {
                var saveBlk = last(logo.inNoteBlock[turtle]);

                if (logo.tieCarryOver[turtle] > 0) {
                    // We need to check to see if we are tying together
                    // similar notes.

                    var match = true;
                    if (
                        logo.tieNotePitches[turtle].length !==
                        logo.notePitches[turtle][last(logo.inNoteBlock[turtle])]
                            .length
                    ) {
                        match = false;
                    } else {
                        // FIXME: This check assumes that the order of
                        // the pitch blocks in a chord are the same.
                        for (
                            var i = 0;
                            i < logo.tieNotePitches[turtle].length;
                            i++
                        ) {
                            if (
                                logo.tieNotePitches[turtle][i][0] !=
                                logo.notePitches[turtle][
                                last(logo.inNoteBlock[turtle])
                                ][i]
                            ) {
                                match = false;
                                break;
                            }

                            if (
                                logo.tieNotePitches[turtle][i][1] !=
                                logo.noteOctaves[turtle][
                                last(logo.inNoteBlock[turtle])
                                ][i]
                            ) {
                                match = false;
                                break;
                            }
                        }
                    }

                    if (!match) {
                        // If we don't have a match, then we need to
                        // play the previous note.
                        logo.errorMsg(
                            _(
                                "You can only tie notes of the same pitch. Did you mean to use slur?"
                            ),
                            saveBlk
                        );

                        // Save the current note.
                        var saveCurrentNote = [];
                        var saveCurrentExtras = [];
                        for (
                            var i = 0;
                            i <
                            logo.notePitches[turtle][
                                last(logo.inNoteBlock[turtle])
                            ].length;
                            i++
                        ) {
                            saveCurrentNote.push([
                                logo.notePitches[turtle][saveBlk][i],
                                logo.noteOctaves[turtle][saveBlk][i],
                                logo.noteCents[turtle][saveBlk][i],
                                logo.noteHertz[turtle][saveBlk][i],
                                saveBlk
                            ]);
                        }

                        saveCurrentExtras = [
                            saveBlk,
                            logo.oscList[turtle][saveBlk],
                            logo.noteBeat[turtle][saveBlk],
                            logo.noteBeatValues[turtle][saveBlk],
                            logo.noteDrums[turtle][saveBlk],
                            logo.embeddedGraphics[turtle][saveBlk]
                        ];

                        // Swap in the previous note.
                        saveBlk = logo.tieNoteExtras[turtle][0];
                        logo.inNoteBlock[turtle].push(saveBlk);

                        logo.notePitches[turtle][saveBlk] = [];
                        logo.noteOctaves[turtle][saveBlk] = [];
                        logo.noteCents[turtle][saveBlk] = [];
                        logo.noteHertz[turtle][saveBlk] = [];
                        for (
                            var i = 0;
                            i < logo.tieNotePitches[turtle].length;
                            i++
                        ) {
                            logo.notePitches[turtle][saveBlk].push(
                                logo.tieNotePitches[turtle][i][0]
                            );
                            logo.noteOctaves[turtle][saveBlk].push(
                                logo.tieNotePitches[turtle][i][1]
                            );
                            logo.noteCents[turtle][saveBlk].push(
                                logo.tieNotePitches[turtle][i][2]
                            );
                            logo.noteHertz[turtle][saveBlk].push(
                                logo.tieNotePitches[turtle][i][3]
                            );
                        }

                        logo.oscList[turtle][saveBlk] = logo.tieNoteExtras[
                            turtle
                        ][1];
                        logo.noteBeat[turtle][saveBlk] = logo.tieNoteExtras[
                            turtle
                        ][2];
                        logo.noteBeatValues[turtle][
                            saveBlk
                        ] = logo.tieNoteExtras[turtle][3];
                        logo.noteDrums[turtle][saveBlk] = logo.tieNoteExtras[
                            turtle
                        ][4];
                        logo.embeddedGraphics[turtle][
                            saveBlk
                        ] = logo.tieNoteExtras[turtle][5];

                        if (logo.justCounting[turtle].length === 0) {
                            // Remove the note from the Lilypond list.
                            for (
                                var i = 0;
                                i < logo.notePitches[turtle][saveBlk].length;
                                i++
                            ) {
                                logo.notation.notationRemoveTie(turtle);
                            }
                        }

                        // Play previous note.
                        logo.tie[turtle] = false;
                        tieDelay = 0;
                        Singer.processNote(
                            logo.tieCarryOver[turtle],
                            saveBlk,
                            turtle
                        );

                        logo.inNoteBlock[turtle].pop();

                        if (!logo.suppressOutput[turtle]) {
                            logo.doWait(
                                turtle,
                                Math.max(
                                    bpmFactor / logo.tieCarryOver[turtle] +
                                    logo.noteDelay / 1000 -
                                    turtleLag,
                                    0
                                )
                            );
                        }

                        tieDelay = logo.tieCarryOver[turtle];
                        logo.tieCarryOver[turtle] = 0;
                        logo.tie[turtle] = true;

                        // Restore the current note.
                        saveBlk = saveCurrentExtras[0];
                        logo.notePitches[turtle][saveBlk] = [];
                        logo.noteOctaves[turtle][saveBlk] = [];
                        logo.noteCents[turtle][saveBlk] = [];
                        logo.noteHertz[turtle][saveBlk] = [];
                        for (let i = 0; i < saveCurrentNote.length; i++) {
                            logo.notePitches[turtle][saveBlk].push(
                                saveCurrentNote[i][0]
                            );
                            logo.noteOctaves[turtle][saveBlk].push(
                                saveCurrentNote[i][1]
                            );
                            logo.noteCents[turtle][saveBlk].push(
                                saveCurrentNote[i][2]
                            );
                            logo.noteHertz[turtle][saveBlk].push(
                                saveCurrentNote[i][3]
                            );
                        }

                        logo.oscList[turtle][saveBlk] = saveCurrentExtras[1];
                        logo.noteBeat[turtle][saveBlk] = saveCurrentExtras[2];
                        logo.noteBeatValues[turtle][saveBlk] =
                            saveCurrentExtras[3];
                        logo.noteDrums[turtle][saveBlk] = saveCurrentExtras[4];
                        logo.embeddedGraphics[turtle][saveBlk] =
                            saveCurrentExtras[5];
                    }
                }

                if (logo.tieCarryOver[turtle] === 0) {
                    // We need to save the first note in the pair.
                    logo.tieNotePitches[turtle] = [];
                    logo.tieCarryOver[turtle] = noteBeatValue;

                    for (
                        var i = 0;
                        i < logo.notePitches[turtle][saveBlk].length;
                        i++
                    ) {
                        logo.tieNotePitches[turtle].push([
                            logo.notePitches[turtle][saveBlk][i],
                            logo.noteOctaves[turtle][saveBlk][i],
                            logo.noteCents[turtle][saveBlk][i],
                            logo.noteHertz[turtle][saveBlk][i]
                        ]);
                    }

                    logo.tieNoteExtras[turtle] = [
                        saveBlk,
                        logo.oscList[turtle][saveBlk],
                        logo.noteBeat[turtle][saveBlk],
                        logo.noteBeatValues[turtle][saveBlk],
                        logo.noteDrums[turtle][saveBlk],
                        []
                    ];

                    // We play any drums in the first tied note along
                    // with the drums in the second tied note.
                    logo.tieFirstDrums[turtle] = logo.noteDrums[turtle][
                        saveBlk
                    ];
                    noteBeatValue = 0;
                } else {
                    carry = logo.tieCarryOver[turtle];
                    noteBeatValue =
                        1 / (1 / noteBeatValue + 1 / logo.tieCarryOver[turtle]);
                    logo.tieCarryOver[turtle] = 0;
                }
            }

            // If we are in a swing, depending upon parity, we either
            // add the duration from the current note or we substract
            // duration from the next note. Swing is triggered by an
            // initial notevalue. When that notevalue is encountered
            // again, the swing terminates, e.g., 8->4->4->4->8
            // 8->4->4->4->8
            // TESTME: Could behave weirdly with tie.
            if (logo.swing[turtle].length > 0) {
                // Deprecated
                // newswing2 takes the target as an argument
                if (last(logo.swingTarget[turtle]) == null) {
                    // When we start a swing we need to keep track of
                    // the initial beat value.
                    logo.swingTarget[turtle][
                        logo.swingTarget[turtle].length - 1
                    ] = noteBeatValue;
                }

                var swingValue = last(logo.swing[turtle]);
                // If this notevalue matches the target, either we are
                // starting a swing or ending a swing.
                if (noteBeatValue === last(logo.swingTarget[turtle])) {
                    if (logo.swingCarryOver[turtle] === 0) {
                        noteBeatValue =
                            1 / (1 / noteBeatValue + 1 / swingValue);
                        logo.swingCarryOver[turtle] = swingValue;
                    } else {
                        if (noteBeatValue === swingValue) {
                            noteBeatValue = 0;
                        } else {
                            noteBeatValue =
                                1 / (1 / noteBeatValue - 1 / swingValue);
                        }
                        logo.swingCarryOver[turtle] = 0;
                    }

                    if (noteBeatValue < 0) {
                        noteBeatValue = 0;
                    }
                }
            }

            // Duration is the duration of the note to be
            // played. doWait sets the wait time for the turtle before
            // the next block is executed.
            var duration = noteBeatValue;
            // For the outermost note (when nesting), calculate the
            // time for the next note.
            if (duration > 0) {
                logo.previousTurtleTime[turtle] = logo.turtleTime[turtle];
                if (logo.inNoteBlock[turtle].length === 1) {
                    logo.turtleTime[turtle] +=
                        bpmFactor / duration + logo.noteDelay / 1000;
                    if (!logo.suppressOutput[turtle]) {
                        logo.doWait(
                            turtle,
                            Math.max(
                                bpmFactor / duration +
                                logo.noteDelay / 1000 -
                                turtleLag,
                                0
                            )
                        );
                    }
                }
            }

            var forceSilence = false;
            if (logo.skipFactor[turtle] > 1) {
                if (logo.skipIndex[turtle] % logo.skipFactor[turtle] > 0) {
                    forceSilence = true;
                }
                logo.skipIndex[turtle] += 1;
            }

            let chordNotes = [];
            let chordDrums = [];
            let __playnote = () => {
                let thisBlk = last(logo.inNoteBlock[turtle]);

                if (logo.notePitches[turtle][thisBlk] === undefined) {
                    // Rest?
                    // console.debug('no note found');
                    return;
                }

                // If there are multiple notes, remove the rests.
                if (logo.notePitches[turtle][thisBlk].length > 1) {
                    while (
                        logo.notePitches[turtle][thisBlk].indexOf("rest") !== -1
                    ) {
                        logo.notePitches[turtle][thisBlk].splice(
                            logo.notePitches[turtle][thisBlk].indexOf("rest"),
                            1
                        );
                    }
                }

                // If there is no note, add a rest.
                if (logo.notePitches[turtle][thisBlk].length === 0) {
                    logo.notePitches[turtle][
                        logo.inNoteBlock[turtle][
                        logo.inNoteBlock[turtle].length - 1
                        ]
                    ].push("rest");
                }

                // Stop playing notes if the stop button is pressed.
                if (logo.stopTurtle) return;

                if (
                    logo.inNoteBlock[turtle].length ===
                    logo.whichNoteToCount[turtle]
                ) {
                    logo.notesPlayed[turtle] = rationalSum(
                        logo.notesPlayed[turtle],
                        [1, noteValue]
                    );
                }

                var notes = [];
                var drums = [];
                var insideChord = -1;
                if (
                    logo.notePitches[turtle][thisBlk].length +
                    logo.oscList[turtle][thisBlk].length >
                    1
                ) {
                    if (
                        turtle in logo.notation.notationStaging &&
                        logo.justCounting[turtle].length === 0
                    ) {
                        var insideChord =
                            logo.notation.notationStaging[turtle].length + 1;
                    } else {
                        var insideChord = 1;
                    }
                }

                logo.noteBeat[turtle][blk] = noteBeatValue;

                // Do not process a note if its duration is equal
                // to infinity or NaN.
                if (!isFinite(duration)) return;

                // Use the beatValue of the first note in
                // the group since there can only be one.
                if (logo.glide[turtle].length > 0) {
                    var portamento = last(logo.glide[turtle]);
                } else {
                    var portamento = 0;
                }

                if (logo.staccato[turtle].length > 0) {
                    var staccatoBeatValue = last(logo.staccato[turtle]);
                    if (staccatoBeatValue < 0) {
                        // slur
                        var beatValue =
                            bpmFactor *
                            (1 / noteBeatValue - 1 / staccatoBeatValue);
                    } else if (staccatoBeatValue > noteBeatValue) {
                        // staccato
                        var beatValue = bpmFactor / staccatoBeatValue;
                    } else {
                        var beatValue = bpmFactor / noteBeatValue;
                    }
                } else {
                    var beatValue = bpmFactor / noteBeatValue;
                }

                if (doVibrato) {
                    vibratoValue = beatValue * (duration / vibratoRate);
                }

                // Check to see if we need any courtesy accidentals:
                // e.g., are there any combinations of natural and
                // sharp or natural and flat notes?
                var courtesy = [];
                for (
                    var i = 0;
                    i < logo.notePitches[turtle][thisBlk].length;
                    i++
                ) {
                    var n = logo.notePitches[turtle][thisBlk][i];
                    var thisCourtesy = false;
                    if (n.length === 1) {
                        for (
                            let j = 0;
                            j < logo.notePitches[turtle][thisBlk].length;
                            j++
                        ) {
                            if (
                                i === j ||
                                logo.noteOctaves[turtle][thisBlk][i] !==
                                logo.noteOctaves[turtle][thisBlk][j]
                            ) {
                                continue;
                            }

                            if (
                                n + "♯" ===
                                logo.notePitches[turtle][thisBlk][j] ||
                                n + "♭" === logo.notePitches[turtle][thisBlk][j]
                            ) {
                                thisCourtesy = true;
                            }
                        }
                    }

                    courtesy.push(thisCourtesy);
                }

                // Process pitches
                if (logo.notePitches[turtle][thisBlk].length > 0) {
                    for (
                        var i = 0;
                        i < logo.notePitches[turtle][thisBlk].length;
                        i++
                    ) {
                        if (
                            logo.notePitches[turtle][thisBlk][i] === "rest" ||
                            forceSilence
                        ) {
                            note = "R";
                            logo.previousNotePlayed[turtle] =
                                logo.lastNotePlayed[turtle];
                        } else {
                            var noteObj = getNote(
                                logo.notePitches[turtle][thisBlk][i],
                                logo.noteOctaves[turtle][thisBlk][i],
                                0,
                                logo.keySignature[turtle],
                                logo.moveable[turtle],
                                null,
                                logo.errorMsg,
                                logo.synth.inTemperament
                            );
                            // If the cents for this note != 0, then
                            // we need to convert to frequency and add
                            // in the cents.
                            if (logo.noteCents[turtle][thisBlk][i] !== 0) {
                                if (logo.noteHertz[turtle][thisBlk][i] !== 0) {
                                    var note =
                                        logo.noteHertz[turtle][thisBlk][i];
                                } else {
                                    var note = Math.floor(
                                        pitchToFrequency(
                                            noteObj[0],
                                            noteObj[1],
                                            logo.noteCents[turtle][thisBlk][i],
                                            logo.keySignature[turtle]
                                        )
                                    );
                                }
                            } else {
                                var note = noteObj[0] + noteObj[1];
                            }
                        }

                        if (note !== "R") {
                            // Apply harmonic here instead of in synth.
                            var p = partials.indexOf(1);
                            if (p > 0) {
                                note =
                                    noteToFrequency(
                                        note,
                                        logo.keySignature[turtle]
                                    ) *
                                    (p + 1);
                            }

                            notes.push(note);
                        }

                        if (duration > 0) {
                            if (carry > 0) {
                                if (
                                    i === 0 &&
                                    logo.justCounting[turtle].length === 0
                                ) {
                                    logo.notation.notationInsertTie(turtle);
                                }

                                var originalDuration =
                                    1 / (1 / duration - 1 / carry);
                            } else {
                                var originalDuration = duration;
                            }

                            if (logo.justCounting[turtle].length === 0) {
                                if (
                                    logo.noteDrums[turtle][thisBlk].length > 0
                                ) {
                                    if (chordNotes.indexOf(note) === -1) {
                                        chordNotes.push(note);
                                    }

                                    if (
                                        chordDrums.indexOf(
                                            logo.noteDrums[turtle][thisBlk][0]
                                        ) === -1
                                    ) {
                                        chordDrums.push(
                                            logo.noteDrums[turtle][thisBlk][0]
                                        );
                                    }
                                } else {
                                    if (courtesy[i]) {
                                        if (
                                            chordNotes.indexOf(note + "♮") ===
                                            -1
                                        ) {
                                            chordNotes.push(note + "♮");
                                        }
                                    } else {
                                        if (chordNotes.indexOf(note) === -1) {
                                            chordNotes.push(note);
                                        }
                                    }
                                }
                            }
                        } else if (logo.tieCarryOver[turtle] > 0) {
                            if (logo.justCounting[turtle].length === 0) {
                                if (courtesy[i]) {
                                    if (chordNotes.indexOf(note) === -1) {
                                        chordNotes.push(note);
                                    }
                                } else {
                                    if (chordNotes.indexOf(note) === -1) {
                                        chordNotes.push(note);
                                    }
                                }
                            }
                        }

                        if (
                            i ===
                            logo.notePitches[turtle][thisBlk].length - 1
                        ) {
                            if (duration > 0) {
                                if (carry > 0) {
                                    var d = 1 / (1 / duration - 1 / carry);
                                } else {
                                    var d = duration;
                                }
                            } else if (logo.tieCarryOver[turtle] > 0) {
                                var d = logo.tieCarryOver[turtle];
                            }

                            if (logo.runningLilypond || logo.runningMxml || logo.runningAbc) {
                                logo.updateNotation(
                                    chordNotes,
                                    d,
                                    turtle,
                                    -1,
                                    chordDrums
                                );
                            }
                        }
                    }
                    if (isCustom(logo.synth.inTemperament)) {
                        var notesFrequency = logo.synth.getCustomFrequency(
                            notes
                        );
                    } else {
                        var notesFrequency = logo.synth.getFrequency(
                            notes,
                            logo.synth.changeInTemperament
                        );
                    }
                    var startingPitch = logo.synth.startingPitch;
                    var frequency = pitchToFrequency(
                        startingPitch.substring(0, startingPitch.length - 1),
                        Number(startingPitch.slice(-1)),
                        0,
                        null
                    );
                    var t = TEMPERAMENT[logo.synth.inTemperament];
                    var pitchNumber = t.pitchNumber;
                    var ratio = [];
                    var number = [];
                    var numerator = [];
                    var denominator = [];

                    for (var k = 0; k < notesFrequency.length; k++) {
                        if (notesFrequency[k] !== undefined) {
                            ratio[k] = notesFrequency[k] / frequency;
                            number[k] =
                                pitchNumber *
                                (Math.log10(ratio[k]) /
                                    Math.log10(OCTAVERATIO));
                            number[k] = number[k].toFixed(0);
                            numerator[k] = rationalToFraction(ratio[k])[0];
                            denominator[k] = rationalToFraction(ratio[k])[1];
                        }
                    }

                    var notesInfo = "";
                    /*
                    if (logo.synth.inTemperament === 'equal' || logo.synth.inTemperament === '1/3 comma meantone') {
                        notesInfo = ' ( ' + startingPitch + '*' + OCTAVERATIO + ' ^ ' + '(' + number + ' / ' + pitchNumber + ')' + ' )';
                    } else if (numerator.length !== 0) {
                        notesInfo = ' ( ' + startingPitch + ' * ' + numerator + '/' + denominator + ' )';
                    }
                    */

                    var obj = rationalToFraction(1 / noteBeatValue);
                    if (obj[0] > 0) {
                        if (obj[0] / obj[1] > 2) {
                            logo.errorMsg(
                                _("Warning: Note value greater than 2."),
                                blk
                            );
                        }
                        // console.debug('temperament: ' + logo.synth.startingPitch + ' ' + logo.synth.inTemperament);
                        if (logo.justCounting[turtle].length === 0) {
                            if (notes.length === 0) {
                                console.debug(
                                    "notes to play: R " + obj[0] + "/" + obj[1]
                                );
                            } else {
                                console.debug(
                                    "notes to play: " +
                                    notes +
                                    " " +
                                    obj[0] +
                                    "/" +
                                    obj[1] +
                                    notesInfo
                                );
                            }
                        } else {
                            if (notes.length === 0) {
                                console.debug(
                                    "notes to count: R " + obj[0] + "/" + obj[1]
                                );
                            } else {
                                console.debug(
                                    "notes to count: " +
                                    notes +
                                    " " +
                                    obj[0] +
                                    "/" +
                                    obj[1] +
                                    notesInfo
                                );
                            }
                        }
                    }

                    if (!logo.suppressOutput[turtle]) {
                        logo.turtles.turtleList[turtle].blink(
                            duration,
                            last(logo.masterVolume)
                        );
                    }

                    if (notes.length > 0) {
                        var len = notes[0].length;
                        if (typeof notes[0] === "number") {
                            var obj = frequencyToPitch(notes[0]);
                            logo.currentOctave[turtle] = obj[1];
                        } else {
                            logo.currentOctave[turtle] = parseInt(
                                notes[0].slice(len - 1)
                            );
                        }
                        logo.currentCalculatedOctave[turtle] =
                            logo.currentOctave[turtle];

                        if (logo.turtles.turtleList[turtle].drum) {
                            for (var i = 0; i < notes.length; i++) {
                                notes[i] = notes[i]
                                    .replace(/♭/g, "b")
                                    .replace(/♯/g, "#"); // 'C2'; // Remove pitch
                            }
                        } else {
                            for (var i = 0; i < notes.length; i++) {
                                if (typeof notes[i] === "string") {
                                    notes[i] = notes[i]
                                        .replace(/♭/g, "b")
                                        .replace(/♯/g, "#");
                                }
                            }
                        }

                        if (duration > 0) {
                            var __getParamsEffects = function (paramsEffects) {
                                if (
                                    !paramsEffects.doVibrato &&
                                    !paramsEffects.doDistortion &&
                                    !paramsEffects.doTremolo &&
                                    !paramsEffects.doPhaser &&
                                    !paramsEffects.Chorus &&
                                    paramsEffects.partials.length === 1 &&
                                    paramsEffects.partials[1] === 1
                                ) {
                                    return null;
                                } else {
                                    return paramsEffects;
                                }
                            };

                            if (_THIS_IS_MUSIC_BLOCKS_ && !forceSilence) {
                                // Parameters related to effects
                                var paramsEffects = {
                                    doVibrato: doVibrato,
                                    doDistortion: doDistortion,
                                    doTremolo: doTremolo,
                                    doPhaser: doPhaser,
                                    doChorus: doChorus,
                                    doPartials: true,
                                    doPortamento: true,
                                    doNeighbor: doNeighbor,
                                    vibratoIntensity: vibratoIntensity,
                                    vibratoFrequency: vibratoValue,
                                    distortionAmount: distortionAmount,
                                    tremoloFrequency: tremoloFrequency,
                                    tremoloDepth: tremoloDepth,
                                    rate: rate,
                                    octaves: octaves,
                                    baseFrequency: baseFrequency,
                                    chorusRate: chorusRate,
                                    delayTime: delayTime,
                                    chorusDepth: chorusDepth,
                                    partials: partials,
                                    portamento: portamento,
                                    neighborArgNote1: neighborArgNote1,
                                    neighborArgNote2: neighborArgNote2,
                                    neighborArgBeat: neighborArgBeat,
                                    neighborArgCurrentBeat: neighborArgCurrentBeat
                                };

                                // For case when note block is inside a
                                // settimbre block, which in turn is inside a
                                // setdrum block
                                let hasSetTimbreInSetDrum = false;
                                // This case is only applicable if the note
                                // block is at all inside a setdrum block
                                if (logo.drumStyle[turtle].length > 0) {
                                    // Start from the note block's parent
                                    let par =
                                        logo.blocks.blockList[blk]
                                            .connections[0];
                                    par = logo.blocks.blockList[par];
                                    // Keep looking for all parents up in order
                                    while (par.name != "setdrum") {
                                        // If settimbre encountered before
                                        // setdrum, the said case is true
                                        if (par.name === "settimbre") {
                                            hasSetTimbreInSetDrum = true;
                                            break;
                                        }
                                        par = par.connections[0];
                                        if (par === null)
                                            break;
                                        par = logo.blocks.blockList[par];
                                    }
                                }

                                if (logo.oscList[turtle][thisBlk].length > 0) {
                                    if (notes.length > 1) {
                                        logo.errorMsg(
                                            last(
                                                logo.oscList[turtle][thisBlk]
                                            ) +
                                            ": " +
                                            _("synth cannot play chords."),
                                            blk
                                        );
                                    }

                                    if (!logo.suppressOutput[turtle]) {
                                        logo.synth.trigger(
                                            turtle,
                                            notes,
                                            beatValue,
                                            last(logo.oscList[turtle][thisBlk]),
                                            paramsEffects,
                                            null,
                                            false
                                        );
                                    }
                                } else if (
                                    logo.drumStyle[turtle].length > 0 &&
                                    // Don't play drum if settimbre encountered
                                    !hasSetTimbreInSetDrum
                                ) {
                                    if (!logo.suppressOutput[turtle]) {
                                        logo.synth.trigger(
                                            turtle,
                                            notes,
                                            beatValue,
                                            last(logo.drumStyle[turtle]),
                                            null,
                                            null,
                                            false
                                        );
                                    }
                                } else if (
                                    logo.turtles.turtleList[turtle].drum
                                ) {
                                    if (!logo.suppressOutput[turtle]) {
                                        logo.synth.trigger(
                                            turtle,
                                            notes,
                                            beatValue,
                                            "drum",
                                            null,
                                            null,
                                            false
                                        );
                                    }
                                } else {
                                    for (var d = 0; d < notes.length; d++) {
                                        if (
                                            notes[d] in
                                            logo.pitchDrumTable[turtle] &&
                                            // Don't play drum if settimbre encountered
                                            !hasSetTimbreInSetDrum
                                        ) {
                                            if (!logo.suppressOutput[turtle]) {
                                                console.debug(
                                                    logo.glide[turtle].length
                                                );
                                                logo.synth.trigger(
                                                    turtle,
                                                    notes[d],
                                                    beatValue,
                                                    logo.pitchDrumTable[turtle][
                                                    notes[d]
                                                    ],
                                                    null,
                                                    null,
                                                    false
                                                );
                                            }
                                        } else if (
                                            turtle in logo.instrumentNames &&
                                            last(logo.instrumentNames[turtle])
                                        ) {
                                            if (!logo.suppressOutput[turtle]) {
                                                // If we are in a glide, use setNote after the first note.
                                                if (
                                                    logo.glide[turtle].length >
                                                    0
                                                ) {
                                                    if (
                                                        logo.glideOverride[
                                                        turtle
                                                        ] === 0
                                                    ) {
                                                        console.debug(
                                                            "glide note " +
                                                            beatValue
                                                        );
                                                        logo.synth.trigger(
                                                            turtle,
                                                            notes[d],
                                                            beatValue,
                                                            last(
                                                                logo
                                                                    .instrumentNames[
                                                                turtle
                                                                ]
                                                            ),
                                                            paramsEffects,
                                                            filters,
                                                            true
                                                        );
                                                    } else {
                                                        // trigger first note for entire duration of the glissando
                                                        var beatValueOverride =
                                                            bpmFactor /
                                                            logo.glideOverride[
                                                            turtle
                                                            ];
                                                        console.debug(
                                                            "first glide note: " +
                                                            logo
                                                                .glideOverride[
                                                            turtle
                                                            ] +
                                                            " " +
                                                            beatValueOverride
                                                        );
                                                        logo.synth.trigger(
                                                            turtle,
                                                            notes[d],
                                                            beatValueOverride,
                                                            last(
                                                                logo
                                                                    .instrumentNames[
                                                                turtle
                                                                ]
                                                            ),
                                                            paramsEffects,
                                                            filters,
                                                            false
                                                        );
                                                        logo.glideOverride[
                                                            turtle
                                                        ] = 0;
                                                    }
                                                } else {
                                                    logo.synth.trigger(
                                                        turtle,
                                                        notes[d],
                                                        beatValue,
                                                        last(
                                                            logo
                                                                .instrumentNames[
                                                            turtle
                                                            ]
                                                        ),
                                                        paramsEffects,
                                                        filters,
                                                        false
                                                    );
                                                }
                                            }
                                        } else if (
                                            turtle in logo.voices &&
                                            last(logo.voices[turtle])
                                        ) {
                                            if (!logo.suppressOutput[turtle]) {
                                                console.debug(
                                                    logo.glide[turtle].length
                                                );
                                                logo.synth.trigger(
                                                    turtle,
                                                    notes[d],
                                                    beatValue,
                                                    last(logo.voices[turtle]),
                                                    paramsEffects,
                                                    null,
                                                    false
                                                );
                                            }
                                        } else {
                                            if (!logo.suppressOutput[turtle]) {
                                                logo.synth.trigger(
                                                    turtle,
                                                    notes[d],
                                                    beatValue,
                                                    "electronic synth",
                                                    paramsEffects,
                                                    null,
                                                    false
                                                );
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        logo.previousNotePlayed[turtle] =
                            logo.lastNotePlayed[turtle];
                        logo.lastNotePlayed[turtle] = [notes[0], noteBeatValue];
                        logo.noteStatus[turtle] = [notes, noteBeatValue];
                        logo.lastPitchPlayed[turtle] =
                            logo.lastNotePlayed[turtle]; //For a stand-alone pitch block.
                    }
                }

                // Process drums
                if (logo.noteDrums[turtle][thisBlk].length > 0) {
                    for (
                        var i = 0;
                        i < logo.noteDrums[turtle][thisBlk].length;
                        i++
                    ) {
                        drums.push(logo.noteDrums[turtle][thisBlk][i]);
                    }

                    for (
                        var i = 0;
                        i < logo.tieFirstDrums[turtle].length;
                        i++
                    ) {
                        if (
                            drums.indexOf(logo.tieFirstDrums[turtle][i]) === -1
                        ) {
                            drums.push(logo.tieFirstDrums[turtle][i]);
                        }
                    }

                    // If it is > 0, we already counted this note
                    // (e.g. pitch & drum combination).
                    if (logo.notePitches[turtle][thisBlk].length === 0) {
                        var obj = rationalToFraction(1 / noteBeatValue);
                        if (obj[0] > 0) {
                            if (logo.justCounting[turtle].length === 0) {
                                console.debug(
                                    "drums to play " +
                                    notes +
                                    " " +
                                    obj[0] +
                                    "/" +
                                    obj[1]
                                );
                            } else {
                                console.debug(
                                    "drums to count " +
                                    notes +
                                    " " +
                                    obj[0] +
                                    "/" +
                                    obj[1]
                                );
                            }
                        }

                        if (!logo.suppressOutput[turtle]) {
                            logo.turtles.turtleList[turtle].blink(
                                duration,
                                last(logo.masterVolume)
                            );
                        }
                    }

                    if (
                        (logo.tie[turtle] && logo.tieCarryOver[turtle] > 0) ||
                        duration > 0
                    ) {
                        // If we are in a tie, play the drum as if it
                        // were tied.
                        if (logo.tie[turtle] && noteBeatValue === 0) {
                            var newBeatValue = 0;
                        } else {
                            var newBeatValue = beatValue;
                            if (tieDelay > 0) {
                                logo.tieFirstDrums[turtle] = [];
                            }
                        }

                        if (newBeatValue > 0) {
                            if (_THIS_IS_MUSIC_BLOCKS_ && !forceSilence) {
                                for (var i = 0; i < drums.length; i++) {
                                    if (logo.drumStyle[turtle].length > 0) {
                                        if (!logo.suppressOutput[turtle]) {
                                            logo.synth.trigger(
                                                turtle,
                                                ["C2"],
                                                newBeatValue,
                                                last(logo.drumStyle[turtle]),
                                                null,
                                                null,
                                                false
                                            );
                                        }
                                    } else {
                                        if (!logo.suppressOutput[turtle]) {
                                            logo.synth.trigger(
                                                turtle,
                                                ["C2"],
                                                newBeatValue,
                                                drums[i],
                                                null,
                                                null,
                                                false
                                            );
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                if (!logo.suppressOutput[turtle]) {
                    if (_THIS_IS_MUSIC_BLOCKS_ && !forceSilence) {
                        logo.synth.start();
                    }
                }

                // While we tie notes together, we don't want to tie
                // the corresponding graphics.
                if (logo.tie[turtle] && noteBeatValue === 0) {
                    if (tieDelay > 0) {
                        logo.dispatchTurtleSignals(
                            turtle,
                            bpmFactor / logo.tieCarryOver[turtle],
                            blk,
                            bpmFactor / tieDelay
                        );
                    } else {
                        logo.dispatchTurtleSignals(
                            turtle,
                            bpmFactor / logo.tieCarryOver[turtle],
                            blk,
                            0
                        );
                    }
                } else {
                    if (tieDelay > 0) {
                        logo.dispatchTurtleSignals(
                            turtle,
                            beatValue - bpmFactor / tieDelay,
                            blk,
                            bpmFactor / tieDelay
                        );
                    } else {
                        logo.dispatchTurtleSignals(turtle, beatValue, blk, 0);
                    }
                }

                // After the note plays, clear the embedded graphics queue.
                logo.embeddedGraphics[turtle][blk] = [];

                // Ensure note value block unhighlights after note plays.
                setTimeout(function () {
                    if (logo.blocks.visible) {
                        logo.blocks.unhighlight(blk);
                    }
                }, beatValue * 1000);
            };

            if (last(logo.inNoteBlock[turtle]) != null) {
                if (logo.noteDelay === 0 || !logo.suppressOutput[turtle]) {
                    __playnote();
                } else {
                    setTimeout(function () {
                        __playnote();
                    }, logo.noteDelay);
                }
            }
        }

        logo.pushedNote[turtle] = false;

        if (callback !== undefined && callback !== null) {
            callback();
        }

        stage.update(event);
    }
}
