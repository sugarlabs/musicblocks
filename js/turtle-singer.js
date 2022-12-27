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

/*
   global

   DEFAULTVOLUME, TARGETBPM, TONEBPM, frequencyToPitch, last,
   pitchToFrequency, getNote, isCustomTemperament, getStepSizeUp,
   getStepSizeDown, numberToPitch, pitchToNumber, rationalSum,
   noteIsSolfege, getSolfege, SOLFEGENAMES1, SOLFEGECONVERSIONTABLE,
   getInterval, instrumentsEffects, instrumentsFilters, _, DEFAULTVOICE,
   noteToFrequency, getTemperament, getOctaveRatio, rationalToFraction
 */

/*
   Global locations
    js/logo.js
        DEFAULTVOLUME, TARGETBPM, TONEBPM
    js/utils/musicutils.js
        frequencyToPitch, pitchToFrequency, getNote, isCustomTemperament, getStepSizeUp, getStepSizeDown,
        numberToPitch, pitchToNumber, noteIsSolfege, getSolfege, SOLFEGENAMES1,
        SOLFEGECONVERSIONTABLE, getInterval, noteToFrequency, getTemperament, getOctaveRatio
    js/utils/utils.js
        rationalSum, _, rationalToFraction
    js/utils/synthutils.js
        instrumentsEffects, instrumentsFilters
 */

/* exported Singer */

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

        // Parameters used by envelope block
        /** @deprecated */ this.attack = [];
        /** @deprecated */ this.decay = [];
        /** @deprecated */ this.sustain = [];
        /** @deprecated */ this.release = [];

        // Parameters used by pitch
        this.scalarTransposition = 0;
        this.scalarTranspositionValues = [];
        this.transposition = 0;
        this.transpositionValues = [];

        // Parameters used by notes
        this.register = 0;
        this.beatFactor = 1;
        this.dotCount = 0;
        this.oscList = {};
        this.noteBeat = {};
        this.noteValue = {};
        this.noteDrums = {};
        this.notePitches = {};
        this.noteOctaves = {};
        this.noteCents = {};
        this.noteHertz = {};
        this.noteBeatValues = {};
        this.embeddedGraphics = {};
        this.lastNotePlayed = null;
        this.lastPitchPlayed = {}; // for a stand-alone pitch block
        this.previousNotePlayed = null;
        this.noteStatus = null;
        this.noteDirection = 0;
        this.pitchNumberOffset = 39; // 39, C4
        this.currentOctave = 4;
        this.currentCalculatedOctave = {}; // for a stand-alone pitch block
        this.inHarmonic = [];
        this.partials = [];
        this.inNeighbor = [];
        this.neighborStepPitch = [];
        this.neighborNoteValue = [];
        this.inDefineMode = false;
        this.defineMode = [];

        // Music-related attributes
        this.notesPlayed = [0, 1];
        this.whichNoteToCount = 1;
        this.tallyNotes = 0;
        this.moveable = false; // moveable solfege?

        // Parameters used by the note block
        this.bpm = [];
        this.previousTurtleTime = 0;
        this.turtleTime = 0;
        this.pushedNote = false;
        this.duplicateFactor = 1;
        this.arpeggio = [];
        this.arpeggioIndex = 0;
        this.inDuplicate = false;
        this.skipFactor = 1;
        this.skipIndex = 0;
        this.instrumentNames = [];
        this.inCrescendo = [];
        this.crescendoDelta = [];
        this.crescendoInitialVolume = { DEFAULTVOICE: [DEFAULTVOLUME] };
        this.intervals = []; // relative interval (based on scale degree)
        this.semitoneIntervals = []; // absolute interval (based on semitones)
        this.staccato = [];
        this.glide = [];
        this.glideOverride = 0;
        this.swing = [];
        this.swingTarget = [];
        this.swingCarryOver = 0;
        this.tie = false;
        this.tieNotePitches = [];
        this.tieNoteExtras = [];
        this.tieCarryOver = 0;
        this.tieFirstDrums = [];
        this.synthVolume = {};
        this.drift = 0;
        this.drumStyle = [];
        this.voices = [];
        this.backward = [];

        // Effects parameters
        this.vibratoIntensity = [];
        this.vibratoRate = [];
        this.distortionAmount = [];
        this.tremoloFrequency = [];
        this.tremoloDepth = [];
        this.rate = [];
        this.octaves = [];
        this.baseFrequency = [];
        this.chorusRate = [];
        this.delayTime = [];
        this.chorusDepth = [];
        this.neighborArgNote1 = [];
        this.neighborArgNote2 = [];
        this.neighborArgBeat = [];
        this.neighborArgCurrentBeat = [];
        this.panner = null;

        this.inNoteBlock = [];
        this.multipleVoices = false;
        this.invertList = [];
        this.beatList = [];
        this.factorList = [];
        this.keySignature = "C " + "major";

        // pitch to drum mapping
        this.pitchDrumTable = {};

        this.defaultStrongBeats = false;

        // Parameters used in time signature
        this.pickup = 0;
        this.beatsPerMeasure = 4;
        this.noteValuePerBeat = 4;
        this.currentBeat = 0;
        this.currentMeasure = 0;

        // When counting notes, measuring intervals, or generating lilypond output
        this.justCounting = [];
        this.justMeasuring = [];
        this.firstPitch = [];
        this.lastPitch = [];
        this.suppressOutput = false;

        this.dispatchFactor = 1; // scale factor for turtle graphics embedded in notes

        this.inverted = false; // tracks if the notes being played are inverted
    }

    // ========= Class variables ==============================================
    // Parameters used by notes
    static masterBPM = TARGETBPM;
    static defaultBPMFactor = TONEBPM / TARGETBPM;
    static masterVolume = [DEFAULTVOLUME];

    // ========= Deprecated ===================================================

    /**
     * @deprecated
     * @static
     * @param {*[]} args - arguments (parameters)
     * @param {Object} logo - Logo object
     * @param {Object} turtle - Turtle object
     * @param {Object} blk - corresponding Block object index in blocks.blockList
     */
    static playSynthBlock(args, activity, logo, turtle, blk) {
        if (args.length === 1) {
            const obj = frequencyToPitch(args[0]);

            if (logo.inMatrix) {
                logo.phraseMaker.addRowBlock(blk);
                if (logo.pitchBlocks.indexOf(blk) === -1) {
                    logo.pitchBlocks.push(blk);
                }

                logo.phraseMaker.rowLabels.push(activity.logo.blocks.blockList[blk].name);
                logo.phraseMaker.rowArgs.push(args[0]);
            } else if (logo.inPitchSlider) {
                logo.pitchSlider.frequency = args[0];
            } else {
                const tur = activity.turtles.ithTurtle(turtle);

                tur.singer.oscList[last(tur.singer.inNoteBlock)].push(
                    activity.blocks.blockList[blk].name
                );

                // We keep track of pitch and octave for notation purposes
                tur.singer.notePitches[last(tur.singer.inNoteBlock)].push(obj[0]);
                tur.singer.noteOctaves[last(tur.singer.inNoteBlock)].push(obj[1]);
                tur.singer.noteCents[last(tur.singer.inNoteBlock)].push(obj[2]);
                if (obj[2] !== 0) {
                    tur.singer.noteHertz[last(tur.singer.inNoteBlock)].push(
                        pitchToFrequency(obj[0], obj[1], obj[2], tur.singer.keySignature)
                    );
                } else {
                    tur.singer.noteHertz[last(tur.singer.inNoteBlock)].push(0);
                }

                tur.singer.noteBeatValues[last(tur.singer.inNoteBlock)].push(tur.singer.beatFactor);
                tur.singer.pushedNote = true;
            }
        }
    }

    // ========= Utilities ====================================================

    /**
     * Shifts pitches by n steps relative to the provided scale.
     *
     * @static
     * @param {Object} activity.logo
     * @param {Object} turtle
     * @param {String} note
     * @param {Number} octave
     * @param {Number} steps
     * @returns {[String, Number]} transposed [note, octave]
     */
    static addScalarTransposition(logo, turtle, note, octave, steps) {
        if (steps === 0) return [note, octave];

        const activity = logo.activity;
        const tur = activity.turtles.ithTurtle(turtle);

        let noteObj = getNote(
            note,
            octave,
            0,
            tur.singer.keySignature,
            tur.singer.moveable,
            null,
            activity.errorMsg,
            logo.synth.inTemperament
        );

        if (isCustomTemperament(logo.synth.inTemperament)) {
            noteObj = getNote(
                noteObj[0],
                noteObj[1],
                steps > 0
                    ? getStepSizeUp(
                        tur.singer.keySignature,
                        noteObj[0],
                        steps,
                        logo.synth.inTemperament
                    )
                    : getStepSizeDown(
                        tur.singer.keySignature,
                        noteObj[0],
                        steps,
                        logo.synth.inTemperament
                    ),
                tur.singer.keySignature,
                tur.singer.moveable,
                null,
                activity.errorMsg,
                logo.synth.inTemperament
            );
        } else {
            for (let i = 0; i < Math.abs(steps); i++) {
                noteObj = getNote(
                    noteObj[0],
                    noteObj[1],
                    steps > 0
                        ? getStepSizeUp(tur.singer.keySignature, noteObj[0])
                        : getStepSizeDown(tur.singer.keySignature, noteObj[0]),
                    tur.singer.keySignature,
                    tur.singer.moveable,
                    null,
                    activity.logo.errorMsg,
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
     * @param {Object} activity.logo
     * @param {Object} turtle
     * @param {Number} firstNote
     * @param {Number} lastNote
     * @returns {Number} scalar distance
     */
    static scalarDistance(logo, turtle, firstNote, lastNote) {
        if (lastNote === firstNote) return 0;

        const activity = logo.activity;

        // Rather than just counting the semitones, we need to count
        // the steps in the current key needed to get from firstNote
        // pitch to lastNote pitch

        let positive = false;
        if (lastNote > firstNote) {
            [firstNote, lastNote] = [lastNote, firstNote];
            positive = true;
        }

        const tur = activity.turtles.ithTurtle(turtle);
        const n1 = firstNote + tur.singer.pitchNumberOffset;
        let n2 = lastNote + tur.singer.pitchNumberOffset;

        let i = 0;
        let noteObj = numberToPitch(n2);
        while (i++ < 100) {
            n2 += getStepSizeUp(tur.singer.keySignature, noteObj[0], 1);
            if (n2 >= n1) break;
            noteObj = numberToPitch(n2);
        }

        return positive ? i : -i;
    }

    /**
     * Calculates the change needed for musical inversion.
     *
     * @static
     * @param {Object} activity.logo
     * @param {Object} turtle
     * @param {String} note
     * @param {Number} octave
     * @returns {Number} inverted value
     */
    static calculateInvert(logo, turtle, note, octave) {
        const activity = logo.activity;
        const tur = activity.turtles.ithTurtle(turtle);

        let delta = 0;
        const note1 = getNote(
            note,
            octave,
            0,
            tur.singer.keySignature,
            tur.singer.moveable,
            null,
            activity.errorMsg
        );
        let num1 =
            pitchToNumber(note1[0], note1[1], tur.singer.keySignature) -
            tur.singer.pitchNumberOffset;

        for (let i = tur.singer.invertList.length - 1; i >= 0; i--) {
            const note2 = getNote(
                tur.singer.invertList[i][0],
                tur.singer.invertList[i][1],
                0,
                tur.singer.keySignature,
                tur.singer.moveable,
                null,
                activity.errorMsg
            );
            const num2 =
                pitchToNumber(note2[0], note2[1], tur.singer.keySignature) -
                tur.singer.pitchNumberOffset;

            if (tur.singer.invertList[i][2] === "even") {
                delta += num2 - num1;
                num1 += 2 * delta;
            } else if (tur.singer.invertList[i][2] === "odd") {
                delta += num2 - num1 + 0.5;
                num1 += 2 * delta;
            } else {
                // We need to calculate the scalar difference
                const scalarSteps = Singer.scalarDistance(logo, turtle, num2, num1);
                const note3 = Singer.addScalarTransposition(
                    logo,
                    turtle,
                    note2[0],
                    note2[1],
                    -scalarSteps
                );
                const num3 =
                    pitchToNumber(note3[0], note3[1], tur.singer.keySignature) -
                    tur.singer.pitchNumberOffset;

                delta += (num3 - num1) / 2;
                num1 = num3;
            }
        }

        return delta;
    }

    /**
     * Counts notes, with saving of the box, heap, dict, and turtle states.
     *
     * @static
     * @param {Object} logo
     * @param {Object} turtle
     * @param {Number} cblk - block number
     * @returns {Number} note count
     */
    static noteCounter(logo, turtle, cblk) {
        if (cblk === null) return 0;

        const activity = logo.activity;
        const tur = activity.turtles.ithTurtle(turtle);

        const saveSuppressStatus = tur.singer.suppressOutput;

        // We need to save the state of the boxes and heap although there is a potential of a boxes collision with other turtles
        const saveBoxes = JSON.stringify(logo.boxes);
        const saveTurtleHeaps = JSON.stringify(activity.logo.turtleHeaps[turtle]);
        const saveTurtleDicts = JSON.stringify(activity.logo.turtleDicts[turtle]);
        // .. and the turtle state
        const saveX = tur.x;
        const saveY = tur.y;
        const saveColor = tur.painter.color;
        const saveValue = tur.painter.value;
        const saveChroma = tur.painter.chroma;
        const saveStroke = tur.painter.stroke;
        const saveCanvasAlpha = tur.painter.canvasAlpha;
        const saveOrientation = tur.orientation;
        const savePenState = tur.painter.penState;

        const saveWhichNoteToCount = tur.singer.whichNoteToCount;

        const savePrevTurtleTime = tur.singer.previousTurtleTime;
        const saveTurtleTime = tur.singer.turtleTime;

        tur.singer.suppressOutput = true;
        tur.singer.justCounting.push(true);

        for (const b in tur.endOfClampSignals) {
            tur.butNotThese[b] = [];
            for (const i in tur.endOfClampSignals[b]) {
                tur.butNotThese[b].push(i);
            }
        }

        const actionArgs = [];
        const saveNoteCount = tur.singer.notesPlayed;
        const saveTallyNotes = tur.singer.tallyNotes;
        tur.running = true;

        tur.singer.whichNoteToCount += tur.singer.inNoteBlock.length;

        activity.logo.runFromBlockNow(
            logo,
            turtle,
            cblk,
            true,
            actionArgs,
            activity.turtles.turtleList[turtle].queue.length
        );

        const returnValue = rationalSum(tur.singer.notesPlayed, [
            -saveNoteCount[0],
            saveNoteCount[1]
        ]);
        tur.singer.notesPlayed = saveNoteCount;
        tur.singer.tallyNotes = saveTallyNotes;

        // Restore previous state
        activity.logo.boxes = JSON.parse(saveBoxes);
        activity.logo.turtleHeaps[turtle] = JSON.parse(saveTurtleHeaps);
        activity.logo.turtleDicts[turtle] = JSON.parse(saveTurtleDicts);

        tur.painter.doPenUp();
        tur.painter.doSetXY(saveX, saveY);
        tur.painter.color = saveColor;
        tur.painter.value = saveValue;
        tur.painter.chroma = saveChroma;
        tur.painter.stroke = saveStroke;
        tur.painter.canvasAlpha = saveCanvasAlpha;
        tur.painter.doSetHeading(saveOrientation);
        tur.painter.penState = savePenState;

        tur.singer.previousTurtleTime = savePrevTurtleTime;
        tur.singer.turtleTime = saveTurtleTime;

        tur.singer.whichNoteToCount = saveWhichNoteToCount;

        tur.singer.justCounting.pop();
        tur.singer.suppressOutput = saveSuppressStatus;

        tur.butNotThese = {};

        return returnValue[0] / returnValue[1];
    }

    /**
     * Tally notes inside clamp (with saving of the box, heap, dict, and turtle states.)
     *
     * @static
     * @param {Object} logo
     * @param {Object} turtle
     * @param {Number} cblk - block number
     * @returns {Number} number of notes
     */
    static numberOfNotes(logo, turtle, cblk) {
        if (cblk === null) return 0;

        const activity = logo.activity;
        const tur = activity.turtles.ithTurtle(turtle);

        const saveSuppressStatus = tur.singer.suppressOutput;

        // We need to save the state of the boxes, heap, and dict although there is a potential of a boxes collision with other turtles.
        const saveBoxes = JSON.stringify(logo.boxes);
        const saveTurtleHeaps = JSON.stringify(logo.turtleHeaps[turtle]);
        const saveTurtleDicts = JSON.stringify(logo.turtleDicts[turtle]);
        // .. and the turtle state
        const saveX = tur.x;
        const saveY = tur.y;
        const saveColor = tur.painter.color;
        const saveValue = tur.painter.value;
        const saveChroma = tur.painter.chroma;
        const saveStroke = tur.painter.stroke;
        const saveCanvasAlpha = tur.painter.canvasAlpha;
        const saveOrientation = tur.orientation;
        const savePenState = tur.painter.penState;

        const saveWhichNoteToCount = tur.singer.whichNoteToCount;

        const savePrevTurtleTime = tur.singer.previousTurtleTime;
        const saveTurtleTime = tur.singer.turtleTime;

        tur.singer.suppressOutput = true;
        tur.singer.justCounting.push(true);

        for (const b in tur.endOfClampSignals) {
            tur.butNotThese[b] = [];
            for (const i in tur.endOfClampSignals[b]) {
                tur.butNotThese[b].push(i);
            }
        }

        const actionArgs = [];
        const saveNoteCount = tur.singer.notesPlayed;
        const saveTallyNotes = tur.singer.tallyNotes;
        tur.running = true;

        tur.singer.whichNoteToCount += tur.singer.inNoteBlock.length;

        activity.logo.runFromBlockNow(
            logo,
            turtle,
            cblk,
            true,
            actionArgs,
            activity.turtles.turtleList[turtle].queue.length
        );
        const returnValue = tur.singer.tallyNotes - saveTallyNotes;

        tur.singer.notesPlayed = saveNoteCount;
        tur.singer.tallyNotes = saveTallyNotes;

        // Restore previous state
        activity.logo.boxes = JSON.parse(saveBoxes);
        activity.logo.turtleHeaps[turtle] = JSON.parse(saveTurtleHeaps);
        activity.logo.turtleDicts[turtle] = JSON.parse(saveTurtleDicts);

        tur.painter.doPenUp();
        tur.painter.doSetXY(saveX, saveY);
        tur.painter.color = saveColor;
        tur.painter.value = saveValue;
        tur.painter.chroma = saveChroma;
        tur.painter.stroke = saveStroke;
        tur.painter.canvasAlpha = saveCanvasAlpha;
        tur.painter.doSetHeading(saveOrientation);
        tur.painter.penState = savePenState;

        tur.singer.previousTurtleTime = savePrevTurtleTime;
        tur.singer.turtleTime = saveTurtleTime;

        tur.singer.whichNoteToCount = saveWhichNoteToCount;

        tur.singer.justCounting.pop();
        tur.singer.suppressOutput = saveSuppressStatus;

        tur.butNotThese = {};

        return returnValue;
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
        const activity = logo.activity;
        volume = Math.min(Math.max(volume, 0), 100);

        logo.synth.setMasterVolume(volume);
        for (const turtle of activity.turtles.turtleList) {
            for (const synth in turtle.singer.synthVolume) {
                turtle.singer.synthVolume[synth].push(volume);
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

    // ========= Action =======================================================

    /**
     * @static
     * @param {String} note - note value or solfege
     * @param {Number} octave - scale octave
     * @param {Number} cents - semitone offset due to accidentals
     * @param {Object} turtle - Turtle index in turtles.turtleList
     * @param {Object} blk - corresponding Block object index in blocks.blockList
     */
    static processPitch(activity, note, octave, cents, turtle, blk) {
        const tur = activity.turtles.ithTurtle(turtle);
        let noteObj = Singer.addScalarTransposition(
            activity.logo,
            turtle,
            note,
            octave,
            tur.singer.scalarTransposition
        );
        [note, octave] = noteObj;

        if (tur.singer.inNeighbor.length > 0) {
            noteObj = getNote(
                note,
                octave,
                tur.singer.transposition,
                tur.singer.keySignature,
                tur.singer.moveable,
                null,
                activity.errorMsg,
                activity.logo.synth.inTemperament
            );
            tur.singer.neighborArgNote1.push(noteObj[0] + noteObj[1]);

            let noteObj2;
            if (activity.blocks.blockList[last(tur.singer.inNeighbor)].name === "neighbor2") {
                noteObj2 = Singer.addScalarTransposition(
                    activity.logo,
                    turtle,
                    note,
                    octave,
                    parseInt(tur.singer.neighborStepPitch)
                );
                if (tur.singer.transposition !== 0) {
                    noteObj2 = getNote(
                        noteObj2[0],
                        noteObj2[1],
                        tur.singer.transposition,
                        tur.singer.keySignature,
                        tur.singer.moveable,
                        null,
                        activity.errorMsg,
                        activity.logo.synth.inTemperament
                    );
                }
            } else {
                noteObj2 = getNote(
                    note,
                    octave,
                    tur.singer.transposition + parseInt(tur.singer.neighborStepPitch),
                    tur.singer.keySignature,
                    tur.singer.moveable,
                    null,
                    activity.errorMsg,
                    activity.logo.synth.inTemperament
                );
            }

            tur.singer.neighborArgNote2.push(noteObj2[0] + noteObj2[1]);
        }

        const delta =
            tur.singer.invertList.length > 0
                ? Singer.calculateInvert(activity.logo, turtle, note, octave)
                : 0;

        if (tur.singer.justMeasuring.length > 0) {
            const transposition = tur.singer.transposition;

            noteObj = getNote(
                note,
                octave,
                transposition,
                tur.singer.keySignature,
                tur.singer.moveable,
                null,
                activity.errorMsg,
                activity.logo.synth.inTemperament
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
        } else if (activity.logo.inPitchDrumMatrix) {
            if (note.toLowerCase() !== "rest") {
                activity.logo.pitchDrumMatrix.addRowBlock(blk);
                if (activity.logo.pitchBlocks.indexOf(blk) === -1) {
                    activity.logo.pitchBlocks.push(blk);
                }
            }

            const duplicateFactor =
                tur.singer.duplicateFactor.length > 0 ? tur.singer.duplicateFactor : 1;

            for (let i = 0; i < duplicateFactor; i++) {
                // Apply transpositions
                const transposition = 2 * delta + tur.singer.transposition;
                let alen = tur.singer.arpeggio.length;
                let atrans = transposition;
                if (alen > 0 && i < alen) {
                    atrans += tur.singer.arpeggio[i];
                }

                const nnote = getNote(
                    note,
                    octave,
                    atrans,  // transposition,
                    tur.singer.keySignature,
                    tur.singer.moveable,
                    null,
                    activity.errorMsg,
                    activity.logo.synth.inTemperament
                );
                nnote[0] = noteIsSolfege(note) ? getSolfege(nnote[0]) : nnote[0];

                if (tur.singer.drumStyle.length > 0) {
                    activity.logo.pitchDrumMatrix.drums.push(last(tur.singer.drumStyle));
                } else {
                    activity.logo.pitchDrumMatrix.rowLabels.push(nnote[0]);
                    activity.logo.pitchDrumMatrix.rowArgs.push(nnote[1]);
                }
            }
        } else if (activity.logo.inMatrix) {
            if (note.toLowerCase() !== "rest") {
                activity.logo.phraseMaker.addRowBlock(blk);
                if (activity.logo.pitchBlocks.indexOf(blk) === -1) {
                    activity.logo.pitchBlocks.push(blk);
                }
            }

            const duplicateFactor =
                tur.singer.duplicateFactor.length > 0 ? tur.singer.duplicateFactor : 1;

            for (let i = 0; i < duplicateFactor; i++) {
                // Apply transpositions
                const transposition = 2 * delta + tur.singer.transposition;
                let alen = tur.singer.arpeggio.length;
                let atrans = transposition;
                if (alen > 0 && i < alen) {
                    atrans += tur.singer.arpeggio[i];
                }

                const noteObj = getNote(
                    note,
                    octave,
                    atrans,  // transposition,
                    tur.singer.keySignature,
                    tur.singer.moveable,
                    null,
                    activity.errorMsg,
                    activity.logo.synth.inTemperament
                );
                tur.singer.previousNotePlayed = tur.singer.lastNotePlayed;
                tur.singer.lastNotePlayed = [noteObj[0] + noteObj[1], 4];

                if (
                    tur.singer.keySignature[0] === "C" &&
                    tur.singer.keySignature[1].toLowerCase() === "major" &&
                    noteIsSolfege(note)
                ) {
                    noteObj[0] = getSolfege(noteObj[0]);
                }

                // If we are in a setdrum clamp, override the pitch.
                if (tur.singer.drumStyle.length > 0) {
                    activity.logo.phraseMaker.rowLabels.push(last(tur.singer.drumStyle));
                    activity.logo.phraseMaker.rowArgs.push(-1);
                } else {
                    // Was the pitch arg a note name or solfege name?
                    if (
                        SOLFEGENAMES1.indexOf(note) !== -1 &&
                        noteObj[0] in SOLFEGECONVERSIONTABLE
                    ) {
                        activity.logo.phraseMaker.rowLabels.push(
                            SOLFEGECONVERSIONTABLE[noteObj[0]]
                        );
                    } else {
                        activity.logo.phraseMaker.rowLabels.push(noteObj[0]);
                    }

                    activity.logo.phraseMaker.rowArgs.push(noteObj[1]);
                }
            }
        } else if (tur.singer.inNoteBlock.length > 0) {
            // maybe of interest
            tur.singer.inverted = tur.singer.invertList.length > 0;
            const addPitch = (note, octave, cents, direction) => {
                // Apply transpositions
                const transposition = 2 * delta + tur.singer.transposition;
                let alen = tur.singer.arpeggio.length;
                let atrans = transposition;
                if (alen > 0) {
                    atrans += tur.singer.arpeggio[tur.singer.arpeggioIndex];
                    tur.singer.arpeggioIndex += 1;
                    if (tur.singer.arpeggioIndex === alen) {
                        tur.singer.arpeggioIndex = 0;
                    }
                }

                const noteObj = getNote(
                    note,
                    octave,
                    // FIXME: should not be hardwired to 12
                    atrans + tur.singer.register * 12,  // transposition + tur.singer.register * 12,
                    tur.singer.keySignature,
                    tur.singer.moveable,
                    direction,
                    activity.errorMsg,
                    activity.logo.synth.inTemperament
                );

                if (tur.singer.drumStyle.length > 0) {
                    const drumname = last(tur.singer.drumStyle);
                    tur.singer.pitchDrumTable[noteObj[0] + noteObj[1]] = drumname;
                }

                tur.singer.notePitches[last(tur.singer.inNoteBlock)].push(noteObj[0]);
                tur.singer.noteOctaves[last(tur.singer.inNoteBlock)].push(noteObj[1]);
                tur.singer.noteCents[last(tur.singer.inNoteBlock)].push(cents);
                tur.singer.noteHertz[last(tur.singer.inNoteBlock)].push(
                    cents === 0
                        ? 0
                        : pitchToFrequency(noteObj[0], noteObj[1], cents, tur.singer.keySignature)
                );

                return noteObj;
            };

            const noteObj1 = addPitch(note, octave, cents);

            for (let i = 0; i < tur.singer.intervals.length; i++) {
                const noteObj2 = getNote(
                    noteObj1[0],
                    noteObj1[1],
                    getInterval(tur.singer.intervals[i], tur.singer.keySignature, noteObj1[0]),
                    tur.singer.keySignature,
                    tur.singer.moveable,
                    null,
                    activity.errorMsg,
                    activity.logo.synth.inTemperament
                );
                addPitch(noteObj2[0], noteObj2[1], cents);
            }

            for (let i = 0; i < tur.singer.semitoneIntervals.length; i++) {
                const noteObj2 = getNote(
                    noteObj1[0],
                    noteObj1[1],
                    tur.singer.semitoneIntervals[i][0],
                    tur.singer.keySignature,
                    tur.singer.moveable,
                    null,
                    activity.errorMsg,
                    activity.logo.synth.inTemperament
                );
                addPitch(noteObj2[0], noteObj2[1], cents, tur.singer.semitoneIntervals[i][1]);
            }

            if (tur.singer.inNoteBlock.length > 0) {
                tur.singer.noteBeatValues[last(tur.singer.inNoteBlock)].push(tur.singer.beatFactor);
            }

            tur.singer.pushedNote = true;
        } else if (tur.singer.drumStyle.length > 0) {
            const drumname = last(tur.singer.drumStyle);
            const transposition = tur.singer.transposition;

            const noteObj1 = getNote(
                note,
                octave,
                transposition,
                tur.singer.keySignature,
                tur.singer.moveable,
                null,
                activity.errorMsg
            );
            tur.singer.pitchDrumTable[noteObj1[0] + noteObj1[1]] = drumname;
        } else if (activity.logo.inPitchStaircase) {
            const frequency = pitchToFrequency(note, octave, 0, tur.singer.keySignature);
            const noteObj1 = getNote(
                note,
                octave,
                0,
                tur.singer.keySignature,
                tur.singer.moveable,
                null,
                activity.errorMsg
            );

            for (let i = 0; i < activity.logo.pitchStaircase.Stairs.length; i++) {
                if (activity.logo.pitchStaircase.Stairs[i][2] < parseFloat(frequency)) {
                    activity.logo.pitchStaircase.Stairs.splice(i, 0, [
                        noteObj1[0],
                        noteObj1[1],
                        parseFloat(frequency),
                        1,
                        1
                    ]);
                    return;
                }

                if (activity.logo.pitchStaircase.Stairs[i][2] === parseFloat(frequency)) {
                    activity.logo.pitchStaircase.Stairs.splice(i, 1, [
                        noteObj1[0],
                        noteObj1[1],
                        parseFloat(frequency),
                        1,
                        1
                    ]);
                    return;
                }
            }

            activity.logo.pitchStaircase.Stairs.push([
                noteObj1[0],
                noteObj1[1],
                parseFloat(frequency),
                1,
                1
            ]);

            activity.logo.pitchStaircase.stairPitchBlocks.push(blk);
        } else if (activity.logo.inMusicKeyboard) {
            // Apply transpositions
            const transposition = 2 * delta + tur.singer.transposition;

            const nnote = getNote(
                note,
                octave,
                transposition,
                tur.singer.keySignature,
                tur.singer.moveable,
                null,
                activity.errorMsg
            );
            nnote[0] = noteIsSolfege(note) ? getSolfege(nnote[0]) : nnote[0];

            if (tur.singer.drumStyle.length === 0) {
                activity.logo.musicKeyboard.instruments.push(last(tur.singer.instrumentNames));
                activity.logo.musicKeyboard.noteNames.push(nnote[0]);
                activity.logo.musicKeyboard.octaves.push(nnote[1]);
                activity.logo.musicKeyboard.addRowBlock(blk);
                tur.singer.lastNotePlayed = [noteObj[0] + noteObj[1], 4];
            }
        } else {
            // Play a stand-alone pitch block as a quarter note.
            activity.logo.clearNoteParams(tur, blk, []);
            if (tur.singer.currentCalculatedOctave === undefined) {
                tur.singer.currentCalculatedOctave = 4;
            }

            tur.singer.inNoteBlock.push(blk);

            tur.singer.inverted = tur.singer.invertList.length > 0;
            const addPitch = (note, octave, cents, direction) => {
                // Apply transpositions
                const transposition = 2 * delta + tur.singer.transposition;

                const noteObj = getNote(
                    note,
                    octave,
                    // FIXME: should not be hardwired to 12
                    transposition + tur.singer.register * 12,
                    tur.singer.keySignature,
                    tur.singer.moveable,
                    direction,
                    activity.errorMsg,
                    activity.logo.synth.inTemperament
                );

                if (tur.singer.drumStyle.length > 0) {
                    const drumname = last(tur.singer.drumStyle);
                    tur.singer.pitchDrumTable[noteObj[0] + noteObj[1]] = drumname;
                }

                tur.singer.notePitches[last(tur.singer.inNoteBlock)].push(noteObj[0]);
                tur.singer.noteOctaves[last(tur.singer.inNoteBlock)].push(noteObj[1]);
                tur.singer.noteCents[last(tur.singer.inNoteBlock)].push(cents);
                tur.singer.noteHertz[last(tur.singer.inNoteBlock)].push(
                    cents === 0
                        ? 0
                        : pitchToFrequency(noteObj[0], noteObj[1], cents, tur.singer.keySignature)
                );

                return noteObj;
            };

            const noteObj1 = addPitch(note, octave, cents);

            for (let i = 0; i < tur.singer.intervals.length; i++) {
                const noteObj2 = getNote(
                    noteObj1[0],
                    noteObj1[1],
                    getInterval(tur.singer.intervals[i], tur.singer.keySignature, noteObj1[0]),
                    tur.singer.keySignature,
                    tur.singer.moveable,
                    null,
                    activity.errorMsg,
                    activity.logo.synth.inTemperament
                );
                addPitch(noteObj2[0], noteObj2[1], cents);
            }

            for (let i = 0; i < tur.singer.semitoneIntervals.length; i++) {
                const noteObj2 = getNote(
                    noteObj1[0],
                    noteObj1[1],
                    tur.singer.semitoneIntervals[i][0],
                    tur.singer.keySignature,
                    tur.singer.moveable,
                    null,
                    activity.errorMsg,
                    activity.logo.synth.inTemperament
                );
                addPitch(noteObj2[0], noteObj2[1], cents, tur.singer.semitoneIntervals[i][1]);
            }

            if (tur.singer.inNoteBlock.length > 0) {
                tur.singer.noteBeatValues[last(tur.singer.inNoteBlock)].push(tur.singer.beatFactor);
            }

            tur.singer.pushedNote = true;

            Singer.processNote(activity, 4, false, blk, turtle, () => {
                tur.singer.inNoteBlock.splice(tur.singer.inNoteBlock.indexOf(blk), 1);
            });
        }
    }

    /**
     * Processes a single note.
     *
     * @static
     * @param {Number} noteValue
     * @param {Boolean} isOsc - whether it is a millisecond block
     * @param {Object} blk - corresponding Block object index in blocks.blockList
     * @param {Object} turtle - Turtle object
     * @param {Function} callback
     */
    static processNote(activity, noteValue, isOsc, blk, turtle, callback) {
        const tur = activity.turtles.ithTurtle(turtle);
        const bpmFactor =
            TONEBPM / (tur.singer.bpm.length > 0 ? last(tur.singer.bpm) : Singer.masterBPM);

        let noteBeatValue = isOsc
            ? noteValue === 0
                ? 0
                : (bpmFactor * 1000) / noteValue
            : noteValue;

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
        const neighborArgNote1 = [];
        const neighborArgNote2 = [];
        let neighborArgBeat = 0;
        let neighborArgCurrentBeat = 0;
        let doVibrato = false;
        let doDistortion = false;
        let doTremolo = false;
        let doPhaser = false;
        let doChorus = false;
        let doNeighbor = false;
        let filters = null;

        // Apply any effects and filters associated with a custom timbre
        if (tur.inSetTimbre && last(tur.singer.instrumentNames)) {
            const name = last(tur.singer.instrumentNames);

            if (name in instrumentsEffects[turtle]) {
                const timbreEffects = instrumentsEffects[turtle][name];

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
        if (tur.singer.vibratoRate.length > 0) {
            vibratoRate = last(tur.singer.vibratoRate);
            vibratoIntensity = last(tur.singer.vibratoIntensity);
            doVibrato = true;
        }

        if (tur.singer.distortionAmount.length > 0) {
            distortionAmount = last(tur.singer.distortionAmount);
            doDistortion = true;
        }

        if (tur.singer.tremoloDepth.length > 0) {
            tremoloFrequency = last(tur.singer.tremoloFrequency);
            tremoloDepth = last(tur.singer.tremoloDepth);
            doTremolo = true;
        }

        if (tur.singer.rate.length > 0) {
            rate = last(tur.singer.rate);
            octaves = last(tur.singer.octaves);
            baseFrequency = last(tur.singer.baseFrequency);
            doPhaser = true;
        }

        if (tur.singer.chorusRate.length > 0) {
            chorusRate = last(tur.singer.chorusRate);
            delayTime = last(tur.singer.delayTime);
            chorusDepth = last(tur.singer.chorusDepth);
            doChorus = true;
        }

        partials = [1];
        if (tur.singer.inHarmonic.length > 0) {
            if (partials.length === 0) {
                //.TRANS: partials are weighted components in a harmonic series
                activity.errorMsg(
                    _("You must have at least one Partial block inside of a Weighted-partial block")
                );
            } else {
                partials = last(tur.singer.partials);
            }
        }

        if (tur.singer.inNeighbor.length > 0) {
            const len = tur.singer.neighborArgNote1.length;
            for (let i = 0; i < len; i++) {
                neighborArgNote1.push(tur.singer.neighborArgNote1.pop());
                neighborArgNote2.push(tur.singer.neighborArgNote2.pop());
            }

            neighborArgBeat = bpmFactor / last(tur.singer.neighborArgBeat);
            neighborArgCurrentBeat = bpmFactor / last(tur.singer.neighborArgCurrentBeat);
            doNeighbor = true;
        }

        let carry = 0;

        if (tur.singer.inCrescendo.length > 0 && tur.singer.crescendoDelta.length === 0) {
            tur.singer.inCrescendo.pop();
            for (const synth in tur.singer.synthVolume) {
                Singer.setSynthVolume(
                    activity.logo,
                    turtle,
                    DEFAULTVOICE,
                    last(tur.singer.synthVolume[synth])
                );
            }
        } else if (tur.singer.crescendoDelta.length > 0) {
            if (
                last(tur.singer.synthVolume[DEFAULTVOICE]) ===
                    last(tur.singer.crescendoInitialVolume[DEFAULTVOICE]) &&
                tur.singer.justCounting.length === 0
            ) {
                activity.logo.notation.notationBeginCrescendo(
                    turtle,
                    last(tur.singer.crescendoDelta)
                );
            }

            for (const synth in tur.singer.synthVolume) {
                const oldVol = last(tur.singer.synthVolume[synth]);
                const len = tur.singer.synthVolume[synth].length;
                tur.singer.synthVolume[synth][len - 1] += last(tur.singer.crescendoDelta);
                if (!tur.singer.suppressOutput) {
                    Singer.setSynthVolume(activity.logo, turtle, synth, oldVol);
                    activity.logo.synth.rampTo(
                        turtle,
                        synth,
                        oldVol,
                        last(tur.singer.synthVolume[synth]),
                        bpmFactor / noteBeatValue
                    );
                }
            }
        }

        if (activity.logo.inTimbre) {
            const noteObj = getNote(
                tur.singer.notePitches[last(tur.singer.inNoteBlock)][0],
                tur.singer.noteOctaves[last(tur.singer.inNoteBlock)][0],
                0,
                tur.singer.keySignature,
                tur.singer.moveable,
                null,
                activity.errorMsg
            );
            activity.logo.timbre.notesToPlay.push([noteObj[0] + noteObj[1], 1 / noteBeatValue]);
            tur.singer.previousNotePlayed = tur.singer.lastNotePlayed;
            tur.singer.lastNotePlayed = [noteObj[0] + noteObj[1], noteBeatValue];
        } else if (activity.logo.inMatrix || activity.logo.tuplet) {
            if (tur.singer.inNoteBlock.length > 0) {
                activity.logo.phraseMaker.addColBlock(blk, 1);

                // block ID of parent "matrix" block
                const mat_block = activity.logo.phraseMaker.blockNo || -1;

                for (let i = 0; i < activity.logo.pitchBlocks.length; i++) {
                    activity.logo.phraseMaker.addNode(
                        activity.logo.pitchBlocks[i],
                        blk,
                        0,
                        mat_block
                    );
                }

                for (let i = 0; i < activity.logo.drumBlocks.length; i++) {
                    activity.logo.phraseMaker.addNode(
                        activity.logo.drumBlocks[i],
                        blk,
                        0,
                        mat_block
                    );
                }
            }

            noteBeatValue *= tur.singer.beatFactor;
            if (activity.logo.tuplet) {
                if (activity.logo.addingNotesToTuplet) {
                    const i = activity.logo.tupletRhythms.length - 1;
                    activity.logo.tupletRhythms[i].push(noteBeatValue);
                } else {
                    activity.logo.tupletRhythms.push([
                        "notes",
                        activity.logo.tupletParams.length - 1,
                        noteBeatValue
                    ]);
                    activity.logo.addingNotesToTuplet = true;
                }
            } else {
                activity.logo.tupletRhythms.push(["", 1, noteBeatValue]);
            }
        } else {
            // We start the music clock as the first note is being played
            if (activity.logo.firstNoteTime === null) {
                activity.logo.firstNoteTime = new Date().getTime();
            }

            // Calculate a lag: In case this turtle has fallen behind,
            // we need to catch up.
            const elapsedTime = (new Date().getTime() - activity.logo.firstNoteTime) / 1000;

            // When we are "drifting", we don't bother with lag.
            const turtleLag =
                tur.singer.drift === 0 ? Math.max(elapsedTime - tur.singer.turtleTime, 0) : 0;

            // Delay running graphics from second note in tie.
            let tieDelay = tur.singer.tie ? tur.singer.tieCarryOver : 0;

            // If we are in a tie, depending upon parity, we either
            // add the duration from the prvious note to the current
            // note, or we cache the duration and set the wait to
            // zero. TESTME: May not work when using dup and skip.
            if (tur.singer.tie) {
                let saveBlk = last(tur.singer.inNoteBlock);

                if (tur.singer.tieCarryOver > 0) {
                    // We need to check to see if we are tying together similar notes

                    let match = true;
                    if (
                        tur.singer.tieNotePitches.length !==
                        tur.singer.notePitches[last(tur.singer.inNoteBlock)].length
                    ) {
                        match = false;
                    } else {
                        /**
                         * @todo FIXME: This check assumes that the order of the pitch blocks in a chord are the same
                         */
                        for (let i = 0; i < tur.singer.tieNotePitches.length; i++) {
                            if (
                                tur.singer.tieNotePitches[i][0] !=
                                    tur.singer.notePitches[last(tur.singer.inNoteBlock)][i] ||
                                tur.singer.tieNotePitches[i][1] !=
                                    tur.singer.noteOctaves[last(tur.singer.inNoteBlock)][i]
                            ) {
                                match = false;
                                break;
                            }
                        }
                    }

                    if (!match) {
                        // If we don't have a match, then we need to play the previous note
                        activity.errorMsg(
                            _(
                                "You can only tie notes of the same pitch. Did you mean to use slur?"
                            ),
                            saveBlk
                        );

                        // Save the current note
                        const saveCurrentNote = [];
                        for (
                            let i = 0;
                            i < tur.singer.notePitches[last(tur.singer.inNoteBlock)].length;
                            i++
                        ) {
                            saveCurrentNote.push([
                                tur.singer.notePitches[saveBlk][i],
                                tur.singer.noteOctaves[saveBlk][i],
                                tur.singer.noteCents[saveBlk][i],
                                tur.singer.noteHertz[saveBlk][i],
                                saveBlk
                            ]);
                        }

                        const saveCurrentExtras = [
                            saveBlk,
                            tur.singer.oscList[saveBlk],
                            tur.singer.noteBeat[saveBlk],
                            tur.singer.noteBeatValues[saveBlk],
                            tur.singer.noteDrums[saveBlk],
                            tur.singer.embeddedGraphics[saveBlk]
                        ];

                        // Swap in the previous note
                        saveBlk = tur.singer.tieNoteExtras[0];
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
                        tur.singer.embeddedGraphics[saveBlk] = tur.singer.tieNoteExtras[5];

                        if (tur.singer.justCounting.length === 0) {
                            // Remove the note from the Lilypond list
                            for (let i = 0; i < tur.singer.notePitches[saveBlk].length; i++) {
                                activity.logo.notation.notationRemoveTie(turtle);
                            }
                        }

                        // Play previous note
                        tur.singer.tie = false;
                        tieDelay = 0;

                        /** @todo FIXME: consider osctime block in tie */
                        Singer.processNote(
                            activity,
                            tur.singer.tieCarryOver,
                            false,
                            saveBlk,
                            turtle
                        );

                        tur.singer.inNoteBlock.pop();

                        if (!tur.singer.suppressOutput) {
                            tur.doWait(
                                Math.max(bpmFactor / tur.singer.tieCarryOver - turtleLag, 0)
                            );
                        }

                        tieDelay = tur.singer.tieCarryOver;
                        tur.singer.tieCarryOver = 0;
                        tur.singer.tie = true;

                        // Restore the current note
                        saveBlk = saveCurrentExtras[0];
                        tur.singer.notePitches[saveBlk] = [];
                        tur.singer.noteOctaves[saveBlk] = [];
                        tur.singer.noteCents[saveBlk] = [];
                        tur.singer.noteHertz[saveBlk] = [];
                        for (let i = 0; i < saveCurrentNote.length; i++) {
                            tur.singer.notePitches[saveBlk].push(saveCurrentNote[i][0]);
                            tur.singer.noteOctaves[saveBlk].push(saveCurrentNote[i][1]);
                            tur.singer.noteCents[saveBlk].push(saveCurrentNote[i][2]);
                            tur.singer.noteHertz[saveBlk].push(saveCurrentNote[i][3]);
                        }

                        tur.singer.oscList[saveBlk] = saveCurrentExtras[1];
                        tur.singer.noteBeat[saveBlk] = saveCurrentExtras[2];
                        tur.singer.noteBeatValues[saveBlk] = saveCurrentExtras[3];
                        tur.singer.noteDrums[saveBlk] = saveCurrentExtras[4];
                        tur.singer.embeddedGraphics[saveBlk] = saveCurrentExtras[5];
                    }
                }

                if (tur.singer.tieCarryOver === 0) {
                    // We need to save the first note in the pair
                    tur.singer.tieNotePitches = [];
                    tur.singer.tieCarryOver = noteBeatValue;

                    for (let i = 0; i < tur.singer.notePitches[saveBlk].length; i++) {
                        tur.singer.tieNotePitches.push([
                            tur.singer.notePitches[saveBlk][i],
                            tur.singer.noteOctaves[saveBlk][i],
                            tur.singer.noteCents[saveBlk][i],
                            tur.singer.noteHertz[saveBlk][i]
                        ]);
                    }

                    tur.singer.tieNoteExtras = [
                        saveBlk,
                        tur.singer.oscList[saveBlk],
                        tur.singer.noteBeat[saveBlk],
                        tur.singer.noteBeatValues[saveBlk],
                        tur.singer.noteDrums[saveBlk],
                        []
                    ];

                    // We play any drums in the first tied note along with the drums in the second tied note
                    tur.singer.tieFirstDrums = tur.singer.noteDrums[saveBlk];
                    noteBeatValue = 0;
                } else {
                    carry = tur.singer.tieCarryOver;
                    noteBeatValue = 1 / (1 / noteBeatValue + 1 / tur.singer.tieCarryOver);
                    tur.singer.tieCarryOver = 0;
                }
            }

            // If we are in a swing, depending upon parity, we either
            // add the duration from the current note or we substract
            // duration from the next note. Swing is triggered by an
            // initial notevalue. When that notevalue is encountered
            // again, the swing terminates, e.g., 8->4->4->4->8
            // 8->4->4->4->8
            // TESTME: Could behave weirdly with tie.
            if (tur.singer.swing.length > 0) {
                /** @deprecated */
                // newswing2 takes the target as an argument
                if (last(tur.singer.swingTarget) == null) {
                    // When we start a swing we need to keep track of the initial beat value
                    tur.singer.swingTarget[tur.singer.swingTarget.length - 1] = noteBeatValue;
                }

                const swingValue = last(tur.singer.swing);
                // If this notevalue matches the target, either we are starting a swing or ending a swing
                if (noteBeatValue === last(tur.singer.swingTarget)) {
                    if (tur.singer.swingCarryOver === 0) {
                        noteBeatValue = 1 / (1 / noteBeatValue + 1 / swingValue);
                        tur.singer.swingCarryOver = swingValue;
                    } else {
                        if (noteBeatValue === swingValue) {
                            noteBeatValue = 0;
                        } else {
                            noteBeatValue = 1 / (1 / noteBeatValue - 1 / swingValue);
                        }
                        tur.singer.swingCarryOver = 0;
                    }

                    if (noteBeatValue < 0) {
                        noteBeatValue = 0;
                    }
                }
            }

            // Duration is the duration of the note to be played. doWait sets the wait time for the turtle before the next block is executed
            const duration = noteBeatValue;
            // For the outermost note (when nesting), calculate the time for the next note
            if (duration > 0) {
                tur.singer.previousTurtleTime = tur.singer.turtleTime;
                if (tur.singer.inNoteBlock.length === 1) {
                    tur.singer.turtleTime += bpmFactor / duration;
                    if (!tur.singer.suppressOutput) {
                        tur.doWait(Math.max(bpmFactor / duration - turtleLag, 0));
                    }
                }
            }

            let forceSilence = false;
            if (tur.singer.skipFactor > 1) {
                if (tur.singer.skipIndex % tur.singer.skipFactor > 0) {
                    forceSilence = true;
                }
                tur.singer.skipIndex += 1;
            }

            const chordNotes = [];
            const chordDrums = [];
            const __playnote = () => {
                const thisBlk = last(tur.singer.inNoteBlock);

                // Rest?
                if (tur.singer.notePitches[thisBlk] === undefined) return;

                // If there are multiple notes, remove the rests.
                if (tur.singer.notePitches[thisBlk].length > 1) {
                    while (tur.singer.notePitches[thisBlk].indexOf("rest") !== -1) {
                        tur.singer.notePitches[thisBlk].splice(
                            tur.singer.notePitches[thisBlk].indexOf("rest"),
                            1
                        );
                    }
                }

                // If there is no note, add a rest.
                if (tur.singer.notePitches[thisBlk].length === 0) {
                    tur.singer.notePitches[last(tur.singer.inNoteBlock)].push("rest");
                }

                // Stop playing notes if the stop button is pressed.
                if (activity.logo.stopTurtle) return;

                if (tur.singer.inNoteBlock.length === tur.singer.whichNoteToCount) {
                    tur.singer.notesPlayed = rationalSum(tur.singer.notesPlayed, [1, noteValue]);
                    tur.singer.tallyNotes++;
                }

                const notes = [];
                const drums = [];
                // let insideChord = -1;
                // if (
                //     tur.singer.notePitches[thisBlk].length + tur.singer.oscList[thisBlk].length >
                //     1
                // ) {
                //     insideChord =
                //         turtle in activity.logo.notation.notationStaging &&
                //         tur.singer.justCounting.length === 0
                //             ? activity.logo.notation.notationStaging[turtle].length + 1
                //             : 1;
                // }

                tur.singer.noteBeat[blk] = noteBeatValue;

                // Do not process a note if its duration is equal
                // to infinity or NaN.
                if (!isFinite(duration)) return;

                // Use the beatValue of the first note in the group since there can only be one
                const portamento = tur.singer.glide.length > 0 ? last(tur.singer.glide) : 0;

                let beatValue = bpmFactor / noteBeatValue;
                if (tur.singer.staccato.length > 0) {
                    const staccatoBeatValue = last(tur.singer.staccato);
                    if (staccatoBeatValue < 0) {
                        // slur
                        beatValue = bpmFactor * (1 / noteBeatValue - 1 / staccatoBeatValue);
                    } else if (staccatoBeatValue > noteBeatValue) {
                        // staccato
                        beatValue = bpmFactor / staccatoBeatValue;
                    } else {
                        beatValue = bpmFactor / noteBeatValue;
                    }
                }

                if (doVibrato) {
                    vibratoValue = beatValue * (duration / vibratoRate);
                }

                // Check to see if we need any courtesy accidentals: e.g., are there any
                // combinations of natural and sharp or natural and flat notes?
                const courtesy = [];
                for (let i = 0; i < tur.singer.notePitches[thisBlk].length; i++) {
                    const n = tur.singer.notePitches[thisBlk][i];
                    let thisCourtesy = false;
                    if (n.length === 1) {
                        for (let j = 0; j < tur.singer.notePitches[thisBlk].length; j++) {
                            if (
                                i === j ||
                                tur.singer.noteOctaves[thisBlk][i] !==
                                    tur.singer.noteOctaves[thisBlk][j]
                            ) {
                                continue;
                            }

                            if (
                                n + "♯" === tur.singer.notePitches[thisBlk][j] ||
                                n + "♭" === tur.singer.notePitches[thisBlk][j]
                            ) {
                                thisCourtesy = true;
                            }
                        }
                    }

                    courtesy.push(thisCourtesy);
                }

                // Process pitches
                let noteObj, note;
                if (tur.singer.notePitches[thisBlk].length > 0) {
                    for (let i = 0; i < tur.singer.notePitches[thisBlk].length; i++) {
                        if (tur.singer.notePitches[thisBlk][i] === "rest" || forceSilence) {
                            note = "R";
                            tur.singer.previousNotePlayed = tur.singer.lastNotePlayed;
                        } else {
                            noteObj = getNote(
                                tur.singer.notePitches[thisBlk][i],
                                tur.singer.noteOctaves[thisBlk][i],
                                0,
                                tur.singer.keySignature,
                                tur.singer.moveable,
                                null,
                                activity.errorMsg,
                                activity.logo.synth.inTemperament
                            );
                            // If the cents for this note != 0, then we need to convert to frequency and add in the cents
                            if (tur.singer.noteCents[thisBlk][i] !== 0) {
                                if (tur.singer.noteHertz[thisBlk][i] !== 0) {
                                    note = tur.singer.noteHertz[thisBlk][i];
                                } else {
                                    note = Math.floor(
                                        pitchToFrequency(
                                            noteObj[0],
                                            noteObj[1],
                                            tur.singer.noteCents[thisBlk][i],
                                            tur.singer.keySignature
                                        )
                                    );
                                }
                            } else {
                                note = noteObj[0] + noteObj[1];
                            }
                        }

                        if (note !== "R") {
                            // Apply harmonic here instead of in synth.
                            const p = partials.indexOf(1);
                            if (p > 0) {
                                note = noteToFrequency(note, tur.singer.keySignature) * (p + 1);
                            }

                            notes.push(note);
                        }

                        if (duration > 0) {
                            if (carry > 0) {
                                if (i === 0 && tur.singer.justCounting.length === 0) {
                                    activity.logo.notation.notationInsertTie(turtle);
                                }
                            }

                            if (tur.singer.justCounting.length === 0) {
                                if (tur.singer.noteDrums[thisBlk].length > 0) {
                                    if (chordNotes.indexOf(note) === -1) {
                                        chordNotes.push(note);
                                    }

                                    if (
                                        chordDrums.indexOf(tur.singer.noteDrums[thisBlk][0]) === -1
                                    ) {
                                        chordDrums.push(tur.singer.noteDrums[thisBlk][0]);
                                    }
                                } else {
                                    if (courtesy[i]) {
                                        if (chordNotes.indexOf(note + "♮") === -1) {
                                            chordNotes.push(note + "♮");
                                        }
                                    } else {
                                        if (chordNotes.indexOf(note) === -1) {
                                            chordNotes.push(note);
                                        }
                                    }
                                }
                            }
                        } else if (tur.singer.tieCarryOver > 0) {
                            if (tur.singer.justCounting.length === 0) {
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

                        if (i === tur.singer.notePitches[thisBlk].length - 1) {
                            let d;
                            if (duration > 0) {
                                if (carry > 0) {
                                    d = 1 / (1 / duration - 1 / carry);
                                } else {
                                    d = duration;
                                }
                            } else if (tur.singer.tieCarryOver > 0) {
                                d = tur.singer.tieCarryOver;
                            }

                            if (
                                activity.logo.runningLilypond ||
                                activity.logo.runningMxml ||
                                activity.logo.runningAbc
                            ) {
                                activity.logo.updateNotation(chordNotes, d, turtle, -1, chordDrums);
                            }
                        }
                    }

                    const notesFrequency = isCustomTemperament(activity.logo.synth.inTemperament)
                        ? activity.logo.synth.getCustomFrequency(notes)
                        : activity.logo.synth.getFrequency(
                            notes,
                            activity.logo.synth.changeInTemperament
                        );
                    const startingPitch = activity.logo.synth.startingPitch;
                    const frequency = pitchToFrequency(
                        startingPitch.substring(0, startingPitch.length - 1),
                        Number(startingPitch.slice(-1)),
                        0,
                        null
                    );
                    const pitchNumber = getTemperament(activity.logo.synth.inTemperament)
                        .pitchNumber;
                    const ratio = [];
                    const number = [];
                    const numerator = [];
                    const denominator = [];

                    for (let k = 0; k < notesFrequency.length; k++) {
                        if (notesFrequency[k] !== undefined) {
                            ratio[k] = notesFrequency[k] / frequency;
                            number[k] = (
                                pitchNumber *
                                (Math.log10(ratio[k]) / Math.log10(getOctaveRatio()))
                            ).toFixed(0);
                            numerator[k] = rationalToFraction(ratio[k])[0];
                            denominator[k] = rationalToFraction(ratio[k])[1];
                        }
                    }

                    // const notesInfo = "";

                    const obj = rationalToFraction(1 / noteBeatValue);

                    //         //-> Removed the WARNING to play a note longer than 2 whole 
                    //         //   notes since some samples are very long.

                    if (!tur.singer.suppressOutput) {
                        tur.blink(duration, last(Singer.masterVolume));
                    }

                    if (notes.length > 0) {
                        const len = notes[0].length;
                        if (typeof notes[0] === "number") {
                            tur.singer.currentOctave = frequencyToPitch(notes[0])[1];
                        } else {
                            tur.singer.currentOctave = parseInt(notes[0].slice(len - 1));
                        }
                        tur.singer.currentCalculatedOctave = tur.singer.currentOctave;

                        for (let i = 0; i < notes.length; i++) {
                            if (typeof notes[i] === "string") {
                                notes[i] = notes[i].replace(/♭/g, "b").replace(/♯/g, "#");
                            }
                        }

                        if (duration > 0) {
                            if (!forceSilence) {
                                // Parameters related to effects
                                const paramsEffects = {
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

                                // For case when note block is inside a settimbre block, which in turn is inside a setdrum block
                                let hasSetTimbreInSetDrum = false;
                                // This case is only applicable if the note block is at all inside a setdrum block
                                if (
                                    tur.singer.drumStyle.length > 0 &&
                                    blk in activity.blocks.blockList
                                ) {
                                    // Start from the note block's parent
                                    let par = activity.blocks.blockList[blk].connections[0];
                                    par = activity.blocks.blockList[par];
                                    // Keep looking for all parents up in order
                                    while (par.name !== "setdrum") {
                                        // If settimbre encountered before setdrum, the said case is true
                                        if (par.name === "settimbre") {
                                            hasSetTimbreInSetDrum = true;
                                            break;
                                        }
                                        par = par.connections[0];
                                        if (par === null) break;
                                        par = activity.blocks.blockList[par];
                                    }
                                }

                                if (tur.singer.oscList[thisBlk].length > 0) {
                                    if (notes.length > 1) {
                                        activity.errorMsg(
                                            last(tur.singer.oscList[thisBlk]) +
                                                ": " +
                                                _("synth cannot play chords."),
                                            blk
                                        );
                                    }

                                    if (!tur.singer.suppressOutput) {
                                        activity.logo.synth.trigger(
                                            turtle,
                                            notes,
                                            beatValue,
                                            last(tur.singer.oscList[thisBlk]),
                                            paramsEffects,
                                            null,
                                            false
                                        );
                                    }
                                } else if (
                                    // Don't play drum if settimbre encountered
                                    tur.singer.drumStyle.length > 0 &&
                                    !hasSetTimbreInSetDrum
                                ) {
                                    if (!tur.singer.suppressOutput) {
                                        activity.logo.synth.trigger(
                                            turtle,
                                            notes,
                                            beatValue,
                                            last(tur.singer.drumStyle),
                                            null,
                                            null,
                                            false
                                        );
                                    }
                                } else {
                                    for (let d = 0; d < notes.length; d++) {
                                        if (
                                            notes[d] in tur.singer.pitchDrumTable &&
                                            // Don't play drum if settimbre encountered
                                            !hasSetTimbreInSetDrum
                                        ) {
                                            if (!tur.singer.suppressOutput) {
                                                activity.logo.synth.trigger(
                                                    turtle,
                                                    notes[d],
                                                    beatValue,
                                                    tur.singer.pitchDrumTable[notes[d]],
                                                    null,
                                                    null,
                                                    false
                                                );
                                            }
                                        } else if (last(tur.singer.instrumentNames)) {
                                            if (!tur.singer.suppressOutput) {
                                                // If we are in a glide, use setNote after the first note
                                                if (tur.singer.glide.length > 0) {
                                                    if (tur.singer.glideOverride === 0) {
                                                        activity.logo.synth.trigger(
                                                            turtle,
                                                            notes[d],
                                                            beatValue,
                                                            last(tur.singer.instrumentNames),
                                                            paramsEffects,
                                                            filters,
                                                            true
                                                        );
                                                    } else {
                                                        // trigger first note for entire duration of the glissando
                                                        const beatValueOverride =
                                                            bpmFactor / tur.singer.glideOverride;
                                                        activity.logo.synth.trigger(
                                                            turtle,
                                                            notes[d],
                                                            beatValueOverride,
                                                            last(tur.singer.instrumentNames),
                                                            paramsEffects,
                                                            filters,
                                                            false
                                                        );
                                                        tur.singer.glideOverride = 0;
                                                    }
                                                } else {
                                                    activity.logo.synth.trigger(
                                                        turtle,
                                                        notes[d],
                                                        beatValue,
                                                        last(tur.singer.instrumentNames),
                                                        paramsEffects,
                                                        filters,
                                                        false
                                                    );
                                                }
                                            }
                                        } else if (
                                            tur.singer.voices.length > 0 &&
                                            last(tur.singer.voices)
                                        ) {
                                            if (!tur.singer.suppressOutput) {
                                                activity.logo.synth.trigger(
                                                    turtle,
                                                    notes[d],
                                                    beatValue,
                                                    last(tur.singer.voices),
                                                    paramsEffects,
                                                    null,
                                                    false
                                                );
                                            }
                                        } else {
                                            if (!tur.singer.suppressOutput) {
                                                activity.logo.synth.trigger(
                                                    turtle,
                                                    notes[d],
                                                    beatValue,
                                                    DEFAULTVOICE,
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

                        tur.singer.previousNotePlayed = tur.singer.lastNotePlayed;
                        tur.singer.lastNotePlayed = [notes[0], noteBeatValue];
                        tur.singer.noteStatus = [notes, noteBeatValue];
                        tur.singer.lastPitchPlayed = tur.singer.lastNotePlayed; // for a stand-alone pitch block
                    }
                }

                // Process drums
                if (tur.singer.noteDrums[thisBlk].length > 0) {
                    for (let i = 0; i < tur.singer.noteDrums[thisBlk].length; i++) {
                        drums.push(tur.singer.noteDrums[thisBlk][i]);
                    }

                    for (let i = 0; i < tur.singer.tieFirstDrums.length; i++) {
                        if (drums.indexOf(tur.singer.tieFirstDrums[i]) === -1) {
                            drums.push(tur.singer.tieFirstDrums[i]);
                        }
                    }

                    // If it is > 0, we already counted this note (e.g. pitch & drum combination)
                    if (tur.singer.notePitches[thisBlk].length === 0) {
                        if (!tur.singer.suppressOutput) {
                            tur.blink(duration, last(Singer.masterVolume));
                        }
                    }

                    if ((tur.singer.tie && tur.singer.tieCarryOver > 0) || duration > 0) {
                        // If we are in a tie, play the drum as if it were tied
                        let newBeatValue;
                        if (tur.singer.tie && noteBeatValue === 0) {
                            newBeatValue = 0;
                        } else {
                            newBeatValue = beatValue;
                            if (tieDelay > 0) {
                                tur.singer.tieFirstDrums = [];
                            }
                        }

                        if (newBeatValue > 0) {
                            if (!forceSilence) {
                                for (let i = 0; i < drums.length; i++) {
                                    if (tur.singer.drumStyle.length > 0) {
                                        if (!tur.singer.suppressOutput) {
                                            activity.logo.synth.trigger(
                                                turtle,
                                                ["C2"],
                                                newBeatValue,
                                                last(tur.singer.drumStyle),
                                                null,
                                                null,
                                                false
                                            );
                                        }
                                    } else {
                                        if (!tur.singer.suppressOutput) {
                                            activity.logo.synth.trigger(
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
                        // If the drum is played by itself, we need to update the lastNotePlayed.
                        if (notes.length === 0) {
                            tur.singer.previousNotePlayed = tur.singer.lastNotePlayed;
                            tur.singer.lastNotePlayed = ["C2", noteBeatValue];
                            tur.singer.noteStatus = [["C2"], noteBeatValue];
                            tur.singer.lastPitchPlayed = tur.singer.lastNotePlayed;
                        }
                    }
                }

                if (!tur.singer.suppressOutput) {
                    if (!forceSilence) {
                        activity.logo.synth.start();
                    }
                }

                // While we tie notes together, we don't want to tie the corresponding graphics
                if (tur.singer.tie && noteBeatValue === 0) {
                    if (tieDelay > 0) {
                        activity.logo.dispatchTurtleSignals(
                            turtle,
                            bpmFactor / tur.singer.tieCarryOver,
                            blk,
                            bpmFactor / tieDelay
                        );
                    } else {
                        activity.logo.dispatchTurtleSignals(
                            turtle,
                            bpmFactor / tur.singer.tieCarryOver,
                            blk,
                            0
                        );
                    }
                } else {
                    if (tieDelay > 0) {
                        activity.logo.dispatchTurtleSignals(
                            turtle,
                            beatValue - bpmFactor / tieDelay,
                            blk,
                            bpmFactor / tieDelay
                        );
                    } else {
                        activity.logo.dispatchTurtleSignals(turtle, beatValue, blk, 0);
                    }
                }

                // After the note plays, clear the embedded graphics queue
                tur.singer.embeddedGraphics[blk] = [];

                // Ensure note value block unhighlights after note plays.
                setTimeout(() => {
                    if (activity.blocks.visible && blk in activity.blocks.blockList) {
                        activity.blocks.unhighlight(blk);
                    }
                }, beatValue * 1000);
            };

            if (last(tur.singer.inNoteBlock) !== null) {
                __playnote();

                if (activity.logo.specialArgs.length > 0) {
                    const runAgainBlockParam = activity.logo.specialArgs.pop();
                    const _ar = runAgainBlockParam;
                    const blockN = _ar[3];

                    // Update args for pitch in hertz and current pitch and then redo the flow block they are attatched to(print/storein etc).

                    const args = [];
                    for (let i = 1; i <= activity.blocks.blockList[blockN].protoblock.args; i++) {
                        if (activity.blocks.blockList[blockN].protoblock.dockTypes[i] === "in") {
                            if (activity.blocks.blockList[blockN].connections[i] !== null) {
                                args.push(activity.blocks.blockList[blockN].connections[i]);
                            }
                        } else {
                            args.push(
                                activity.logo.parseArg(
                                    activity.logo,
                                    _ar[2],
                                    activity.blocks.blockList[blockN].connections[i],
                                    blockN,
                                    _ar[4]
                                )
                            );
                        }
                    }
                    // args, logo, turtle, blk, receivedArg, null, isflow
                    if (typeof activity.blocks.blockList[blockN].protoblock.flow === "function") {
                        activity.blocks.blockList[blockN].protoblock.flow(
                            args,
                            _ar[1],
                            _ar[2],
                            _ar[3],
                            _ar[4],
                            _ar[5],
                            _ar[6]
                        );
                    }
                }
            }
        }

        tur.singer.pushedNote = false;

        if (callback !== undefined && callback !== null) {
            callback();
        }

        activity.stage.update();
    }
}
