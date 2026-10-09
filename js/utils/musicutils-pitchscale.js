// Copyright (c) 2016-23 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
   global

   _, INVALIDPITCH
 */

/*
   exported

   NOTESYMBOLS, keySignatureToMode, getScaleAndHalfSteps,
   getSharpFlatPreference, pitchToNumber, getNoteFromInterval, numberToPitch,
   getNoteFromSolfege, getNote, MusicUtilsPitchScale
 */

// var, not const or let: a hoisted var in musicutils.js cannot redeclare a top-level const or let.

if (typeof module !== "undefined" && module.exports) {
    var MusicUtilsConstants =
        (typeof window !== "undefined" && window.MusicUtilsConstants) ||
        (typeof require !== "undefined" ? require("./musicutils-constants") : {});
    var {
        MAQAMTABLE,
        BTOFLAT,
        STOSHARP,
        FLAT,
        SHARP,
        SOLFEGENAMES1,
        NOTESSHARP,
        NOTESFLAT,
        EXTRATRANSPOSITIONS,
        SOLFEGENAMES,
        SOLFMAPPER,
        SHARPPREFERENCE,
        FLATPREFERENCE,
        DOUBLEFLAT,
        DOUBLESHARP,
        PITCHES2,
        PITCHES,
        INTERVALVALUES,
        SOLFNOTES,
        NOTESFLAT2,
        EQUIVALENTFLATS,
        EQUIVALENTSHARPS,
        EQUIVALENTNATURALS,
        FIXEDSOLFEGE
    } = MusicUtilsConstants;
    var MusicUtilsI18n =
        (typeof window !== "undefined" && window.MusicUtilsI18n) ||
        (typeof require !== "undefined" ? require("./musicutils-i18n") : {});
    var { FIXEDSOLFEGE1 } = MusicUtilsI18n;
    var MusicUtilsTemperament =
        (typeof window !== "undefined" && window.MusicUtilsTemperament) ||
        (typeof require !== "undefined" ? require("./musicutils-temperament") : {});
    var {
        generateNoteNames,
        getCurrentEDO,
        getEdoNoteNamePosition,
        isTrueEDO,
        isCustomTemperament,
        TEMPERAMENT,
        PreDefinedTemperaments,
        isEquallyTempered
    } = MusicUtilsTemperament;
    var MusicUtilsPitch =
        (typeof window !== "undefined" && window.MusicUtilsPitch) ||
        (typeof require !== "undefined" ? require("./musicutils-pitch") : {});
    var { parseNoteString, numberToPitchSharp, getNumber } = MusicUtilsPitch;
    var MusicUtilsSolfege =
        (typeof window !== "undefined" && window.MusicUtilsSolfege) ||
        (typeof require !== "undefined" ? require("./musicutils-solfege") : {});
    var { splitI18nSolfege } = MusicUtilsSolfege;
    var MusicUtilsModeCore =
        (typeof window !== "undefined" && window.MusicUtilsModeCore) ||
        (typeof require !== "undefined" ? require("./musicutils-modecore") : {});
    var {
        wholeNoteImg,
        halfNoteImg,
        quarterNoteImg,
        eighthNoteImg,
        sixteenthNoteImg,
        thirtysecondNoteImg,
        sixtyfourthNoteImg,
        MUSICALMODES,
        getModePattern,
        modeMapper,
        MOVABLE_TONIC_DEGREE,
        getArticulation,
        getCustomNote
    } = MusicUtilsModeCore;
}

var NOTESYMBOLS = {
    1: wholeNoteImg,
    2: halfNoteImg,
    4: quarterNoteImg,
    8: eighthNoteImg,
    16: sixteenthNoteImg,
    32: thirtysecondNoteImg,
    64: sixtyfourthNoteImg
};

/**
 * Convert a key signature to mode, returning an array with the key and mode.
 * @function
 * @param {string} keySignature - The key signature string.
 * @returns {Array} An array containing the key and mode.
 */
var keySignatureToMode = keySignature => {
    // Convert from "A Minor" to "A" and "MINOR"
    if (keySignature === "" || keySignature === null) {
        return ["C", "major"];
    }

    // Maqams have special names for certain keys.
    if (keySignature.toLowerCase() in MAQAMTABLE) {
        keySignature = MAQAMTABLE[keySignature.toLowerCase()];
    }

    let parts = keySignature.split(" ");

    // A special case to test: m used for minor.
    let minorMode = false;
    if (parts.length === 1 && parts[0][parts[0].length - 1] === "m") {
        minorMode = true;
        parts[0] = parts[0].slice(0, parts[0].length - 1);
    }

    let key;
    if (parts[0] in BTOFLAT) {
        key = BTOFLAT[parts[0]];
    } else if (parts[0] in STOSHARP) {
        key = STOSHARP[parts[0]];
    } else {
        key = parts[0];
    }

    if (key === "C" + FLAT) {
        parts = keySignature.split(" ");
        key = "C" + FLAT;
    } else if (key === "B" + SHARP) {
        parts = keySignature.split(" ");
        key = "B" + SHARP;
    } else if (key === "F" + FLAT) {
        parts = keySignature.split(" ");
        key = "F" + FLAT;
    } else if (SOLFEGENAMES1.includes(key)) {
        // This conversion will be a bit iffy depending upon the current mode.

        key = getNote(key, 4, 0, "C Major", false)[0];
    } else if (!NOTESSHARP.includes(key) && !NOTESFLAT.includes(key)) {
        console.debug("Invalid key or missing name; reverting to C.");
        // Is is possible that the key was left out?
        keySignature = "C " + keySignature;
        parts = keySignature.split(" ");
        key = "C";
    }

    if (minorMode) {
        return [key, "natural minor"];
    }

    // Reassemble remaining parts to get mode name
    let mode = "";
    for (let i = 1; i < parts.length; i++) {
        if (parts[i] !== "") {
            if (mode === "") {
                mode = parts[i];
            } else {
                mode += " " + parts[i];
            }
        }
    }

    if (mode === "") {
        mode = "major";
    }

    // Resolve the mode name case-insensitively. Built-in modes are registered
    // lowercase, but user-defined modes keep their original casing (e.g.
    // "MyMode"), so lowercasing the incoming name would fail the lookup.
    let modeKey = mode;
    if (!(modeKey in MUSICALMODES)) {
        for (const m in MUSICALMODES) {
            if (m.toLowerCase() === mode.toLowerCase()) {
                modeKey = m;
                break;
            }
        }
    }

    if (modeKey in MUSICALMODES) {
        return [key, modeKey];
    } else {
        console.debug("Invalid mode name: " + mode + " reverting to major.");
        return [key, "major"];
    }
};

/**
 * Get the scale and solfege with half-steps for a given key signature.
 * @function
 * @param {string} keySignature - The key signature string.
 * @param {number} [edo] - Number of steps per octave (defaults to 12).
 * @returns {Array} An array containing the scale notes, solfege with half-steps, key signature, and mode.
 */
var getScaleAndHalfSteps = (keySignature, edo = 12) => {
    // Determine scale and half-step pattern from key signature
    const obj = keySignatureToMode(keySignature);
    let myKeySignature = obj[0];
    const halfSteps = getModePattern(obj[1], edo);

    if (edo !== 12) {
        // EDO-native scale: 12-EDO solfege slots are a 12-EDO-only concept, so
        // the step pattern is returned in the solfege slot for non-12 EDO.
        const edoNames = generateNoteNames(edo);
        if (myKeySignature in EXTRATRANSPOSITIONS) {
            myKeySignature = EXTRATRANSPOSITIONS[myKeySignature][0];
        }
        return [edoNames, halfSteps, myKeySignature, obj[1]];
    }

    const solfege = [];

    if (halfSteps.length === 7) {
        for (let i = 0; i < halfSteps.length; i++) {
            solfege.push(SOLFEGENAMES[i]);
            for (let j = 1; j < halfSteps[i]; j++) {
                solfege.push("");
            }
        }
    } else if (halfSteps.length > 7) {
        // If there are more than 7 notes, we need to add accidentals.
        for (let i = 0; i < halfSteps.length; i++) {
            if (!solfege.includes(SOLFMAPPER[i])) {
                solfege.push(SOLFMAPPER[i]);
            } else {
                solfege.push(SOLFMAPPER[i] + SHARP);
            }

            for (let j = 1; j < halfSteps[i]; j++) {
                solfege.push("");
            }
        }
    } else {
        // If there are fewer than 7 notes, choose a solfege based on the mode spacing.
        let n;
        let solf;
        for (let i = 0; i < halfSteps.length; i++) {
            n = 0;
            solf = SOLFMAPPER[solfege.length];
            // Ensure there are no duplicates.
            while (solfege.includes(solf)) {
                n += 1;
                solf = SOLFMAPPER[solfege.length + n];
            }

            solfege.push(solf);

            for (let j = 1; j < halfSteps[i]; j++) {
                solfege.push("");
            }
        }
    }

    let thisScale = NOTESSHARP;
    if (NOTESFLAT.includes(myKeySignature)) {
        thisScale = NOTESFLAT;
    }

    if (myKeySignature in EXTRATRANSPOSITIONS) {
        myKeySignature = EXTRATRANSPOSITIONS[myKeySignature][0];
    }
    return [thisScale, solfege, myKeySignature, obj[1]];
};

/**
 * Get the preference for using sharp, flat, or natural based on the key signature.
 * @function
 * @param {string} keySignature - The key signature.
 * @returns {string} The preference for using sharp, flat, or natural.
 */
var getSharpFlatPreference = keySignature => {
    const obj = keySignatureToMode(keySignature);
    const obj2 = modeMapper(obj[0], obj[1]);
    const ks = obj2[0] + " " + obj2[1];

    if (SHARPPREFERENCE.includes(ks)) {
        return "sharp";
    } else if (FLATPREFERENCE.includes(ks)) {
        return "flat";
    } else {
        return "natural";
    }
};

/**
 * Convert a pitch, octave, and key signature to a numeric representation.
 * @function
 * @param {string} pitch - The pitch name (e.g., C, D, E).
 * @param {number} octave - The octave number.
 * @param {string} keySignature - The key signature.
 * @param {string} [temperament="equal"] - The temperament to use.
 * @returns {number} The numeric representation of the pitch.
 */
var pitchToNumber = (pitch, octave, keySignature, temperament) => {
    const currentEDO = getCurrentEDO(temperament);
    // Calculate the pitch index based on pitch and octave.
    if (pitch.toUpperCase() === "R") {
        return 0;
    }
    const originalPitch = pitch;
    // Check for flat, sharp, double flat, or double sharp.
    let transposition = 0;
    const len = pitch.length;
    let lastOne, lastTwo;
    if (len > 1) {
        if (len > 2) {
            lastTwo = pitch.slice(len - 2);
            //Unsure why slice is not working for double flats and double sharps.
            lastOne = pitch.substring(1, len);
            if (lastTwo === "bb") {
                pitch = pitch.substring(0, 1);
                transposition -= 2;
            } else if (lastOne === DOUBLEFLAT) {
                pitch = pitch.substring(0, 1);
                transposition -= 2;
            } else if (lastTwo === "##" || lastTwo === "*" || lastTwo === DOUBLESHARP) {
                pitch = pitch.substring(0, 1);
                transposition += 2;
            } else if (
                lastTwo === "#b" ||
                lastTwo === SHARP + FLAT ||
                lastTwo === "b#" ||
                lastTwo === FLAT + SHARP
            ) {
                // Not sure this could occur... but just in case.
                pitch = pitch.slice(0, len - 2);
            }
        }

        if (pitch.length > 1) {
            lastOne = pitch.slice(len - 1);
            if (lastOne === "b" || lastOne === FLAT) {
                pitch = pitch.slice(0, len - 1);
                transposition -= 1;
            } else if (lastOne === "#" || lastOne === SHARP) {
                pitch = pitch.slice(0, len - 1);
                transposition += 1;
            } else if (lastOne === "x" || lastOne === "*") {
                pitch = pitch.slice(0, len - 1);
                transposition += 2;
            }
        }
    }

    // For EDO > 12, use the EDO-specific name table for ALL pitches
    // (naturals and accidentals alike) so that the A reference is
    // consistent with the table's natural positions.
    if (currentEDO !== 12) {
        const names = generateNoteNames(currentEDO);
        let aIndex = names.indexOf("A");
        if (aIndex === -1) {
            // For EDO < 10, A may not appear in the note name table.
            // Use its proportional position from 12-EDO (A is at index 9).
            aIndex = Math.round((9 / 12) * currentEDO);
        }
        const normalizedPitch = originalPitch
            .replace(/^([a-g])/, (_, letter) => letter.toUpperCase())
            .replaceAll("#", SHARP)
            .replaceAll("b", FLAT);
        let edoPos = names.indexOf(normalizedPitch);
        if (edoPos === -1) {
            // Fallback: try the 12-EDO arrays with proportional mapping
            const fallbackPos = PITCHES2.indexOf(normalizedPitch);
            if (fallbackPos !== -1) {
                edoPos = Math.round((fallbackPos / 12) * currentEDO);
            } else {
                const sharpPos = PITCHES.indexOf(normalizedPitch);
                if (sharpPos !== -1) {
                    edoPos = Math.round((sharpPos / 12) * currentEDO);
                }
            }
        }
        if (edoPos !== -1) {
            return octave * currentEDO + edoPos - aIndex;
        }
    }

    // 12-EDO or fallback path: use PITCHES array with transposition.
    if (transposition !== 0) {
        const edoPos = getEdoNoteNamePosition(originalPitch, currentEDO);
        if (edoPos !== -1) {
            return octave * currentEDO + edoPos - PITCHES.indexOf("A");
        }
    }

    let pitchNumber = 0;
    if (PITCHES.includes(pitch.toUpperCase())) {
        pitchNumber = PITCHES.indexOf(pitch.toUpperCase());
    } else {
        // obj[1] is the solfege mapping for the current key/mode
        const obj = getScaleAndHalfSteps(keySignature);
        if (obj[1].includes(pitch.toLowerCase())) {
            pitchNumber = obj[1].indexOf(pitch.toLowerCase());
        } else {
            console.debug("pitch " + pitch + " not found in mode.");
            // Try an equivalent pitch.
            if (pitch.toLowerCase() in FIXEDSOLFEGE1) {
                const thisPitch = FIXEDSOLFEGE1[pitch.toLowerCase()];
                pitchNumber = obj[0].indexOf(thisPitch);
            } else {
                pitchNumber = 0;
            }
        }
    }
    // We start at A0.
    return octave * currentEDO + pitchNumber - PITCHES.indexOf("A") + transposition;
};

/**
 * Get the note based on a given pitch and interval.
 * @function
 * @param {string} pitch - The pitch, including the note name and octave (e.g., "C4").
 * @param {string} interval - The interval for which the note needs to be determined (e.g., "major 3rd").
 * @param {string} [temperament="equal"] - The temperament to use for pitch calculations.
 * @returns {Array} An array containing the note and octave.
 */
var getNoteFromInterval = (pitch, interval, temperament) => {
    if (temperament === undefined) {
        temperament = "equal";
    }
    const pitch1 = pitch.substring(0, 1);
    const parsed = parseNoteString(pitch);
    const note1 = parsed[0];
    const octave1 = parsed[1];
    const number = pitchToNumber(note1, octave1, "C major", temperament);
    const pitches = ["C", "D", "E", "F", "G", "A", "B"];
    const priorAttrs = [DOUBLEFLAT, FLAT, "", SHARP, DOUBLESHARP];

    /**
     * Find the note that corresponds to a major interval.
     * @function
     * @param {string} interval - The interval for which the note needs to be determined (e.g., "major 3rd").
     * @returns {Array} An array containing the note and octave.
     */
    const findMajorInterval = interval => {
        //For eg. If you are asked to write a major 3rd then the
        //letters must be 3 apart.
        //Eg Ab - C or D - F. This is irrelevant of whether the first
        //note is a sharp or flat, eg G# - B.
        //Then need to work out if you need a sharp or flat on the
        //second note.
        //A Major 3rd is 4 semitones. So, Ab - C needs to be Ab - C; D
        //- F is D- F#; G# - B is G# - B#.
        //Same technique is used to code the findMajorInterval.
        const halfSteps = INTERVALVALUES[interval][0];
        // const direction = INTERVALVALUES[interval][1];

        let note = numberToPitch(number + halfSteps, temperament);
        const num = interval.split(" ");
        const pitchIndex = pitches.indexOf(pitch1);
        let index = pitchIndex + Number(num[num.length - 1]) - 1;
        let octave = octave1;
        if (index > 6) {
            index = index - 7;
            octave = octave1 + 1;
        }
        const id = pitches[index];
        if (note[0].substring(0, 1) === id) {
            return [note[0], octave];
        } else if (note[0].substring(0, 1) !== id) {
            note = numberToPitchSharp(number + halfSteps, temperament);
            if (note[0] === id) {
                return [note[0], octave];
            } else {
                const steps = getNumber(id, octave) - getNumber(note1, octave1);
                const naturalIndex = priorAttrs.indexOf("");
                const attr = priorAttrs[naturalIndex + halfSteps - steps];
                note = id + attr + "";
                return [note, octave];
            }
        }
    };

    /**
     * Find notes for intervals other than major intervals.
     * @function
     * @param {string} interval - The interval for which the note needs to be determined.
     * @returns {Array} An array containing the note and octave.
     */
    const findOtherIntervals = interval => {
        const num = interval.split(" ");
        let majorNote;
        let accidental;
        let index1;

        if (
            interval === "minor 2" ||
            interval === "minor 3" ||
            interval === "minor 6" ||
            interval === "minor 7"
        ) {
            //Major intervals lowered by a half step become minor.
            majorNote = findMajorInterval("major " + num[num.length - 1]);
            accidental = majorNote[0].substring(1, majorNote[0].length);
            index1 = priorAttrs.indexOf(accidental);
            if (index1 === 0) {
                accidental = priorAttrs[index1] + FLAT;
            } else {
                accidental = priorAttrs[index1 - 1];
            }
        }

        // Diminished intervals for perfect intervals (lowered by half step)
        else if (interval === "down 4" || interval === "down 5" || interval === "down 8") {
            // Mapping to the corresponding perfect interval
            if (interval === "down 4") {
                majorNote = findMajorInterval("perfect 4");
            } else if (interval === "down 5") {
                majorNote = findMajorInterval("perfect 5");
            } else if (interval === "down 8") {
                majorNote = findMajorInterval("perfect 8");
            }

            // Lowering by one half step
            accidental = majorNote[0].substring(1, majorNote[0].length);
            index1 = priorAttrs.indexOf(accidental);
            if (index1 === 0) {
                accidental = priorAttrs[index1] + FLAT;
            } else {
                accidental = priorAttrs[index1 - 1];
            }
        }

        // Special case: doubly diminished 5th (very diminished)
        else if (interval === "down-diminished 5") {
            majorNote = findMajorInterval("perfect 5");
            accidental = majorNote[0].substring(1, majorNote[0].length);
            index1 = priorAttrs.indexOf(accidental);

            // Lowering by Two half steps for "very diminished"
            if (index1 <= 1) {
                // If already at flat or double flat, add another flat
                accidental = priorAttrs[0] + FLAT;
            } else {
                // Go down two accidentals in the array
                accidental = priorAttrs[index1 - 2];
            }
        }

        // Special case: diminished 2nd (from unison)
        else if (interval === "diminished 2") {
            majorNote = findMajorInterval("perfect 1");
            accidental = majorNote[0].substring(1, majorNote[0].length);
            index1 = priorAttrs.indexOf(accidental);
            if (index1 === 0) {
                accidental = priorAttrs[index1] + FLAT;
            } else {
                accidental = priorAttrs[index1 - 1];
            }
        }

        // Handle standard diminished intervals not covered by microtonal cases
        else if (interval.startsWith("diminished ")) {
            const intervalNum = interval.split(" ")[1];
            const perfectBased = ["4", "5", "8"].includes(intervalNum);

            majorNote = findMajorInterval((perfectBased ? "perfect " : "major ") + intervalNum);
            accidental = majorNote[0].substring(1, majorNote[0].length);
            index1 = priorAttrs.indexOf(accidental);

            // A diminished interval is a half step below the perfect one, but a
            // whole step below the major one, because the minor sits between them.
            const steps = perfectBased ? 1 : 2;
            if (index1 - steps < 0) {
                accidental = priorAttrs[0] + FLAT.repeat(steps - index1);
            } else {
                accidental = priorAttrs[index1 - steps];
            }
        }

        // Augmented intervals for perfect intervals (raised by half step)
        else if (interval === "up 4" || interval === "up 5" || interval === "up-augmented 4") {
            // Mapping to the corresponding perfect interval
            if (interval === "up 4" || interval === "up-augmented 4") {
                majorNote = findMajorInterval("perfect 4");
            } else if (interval === "up 5") {
                majorNote = findMajorInterval("perfect 5");
            }

            // Raise by one half step
            accidental = majorNote[0].substring(1, majorNote[0].length);
            index1 = priorAttrs.indexOf(accidental);
            if (index1 === 4) {
                accidental = priorAttrs[index1] + SHARP;
            } else {
                accidental = priorAttrs[index1 + 1];
            }
        }

        // Special case: augmented unison
        else if (interval === "augmented 1") {
            majorNote = findMajorInterval("perfect 1");
            accidental = majorNote[0].substring(1, majorNote[0].length);
            index1 = priorAttrs.indexOf(accidental);
            if (index1 === 4) {
                accidental = priorAttrs[index1] + SHARP;
            } else {
                accidental = priorAttrs[index1 + 1];
            }
        }

        // Standard augmented intervals
        else if (
            interval === "augmented 2" ||
            interval === "augmented 3" ||
            interval === "augmented 4" ||
            interval === "augmented 5" ||
            interval === "augmented 6" ||
            interval === "augmented 7" ||
            interval === "augmented 8"
        ) {
            const intervalNum = interval.split(" ")[1];
            if (["1", "4", "5", "8"].includes(intervalNum)) {
                // Perfect-based augmented intervals
                majorNote = findMajorInterval("perfect " + intervalNum);
            } else {
                // Major-based augmented intervals
                majorNote = findMajorInterval("major " + intervalNum);
            }
            accidental = majorNote[0].substring(1, majorNote[0].length);
            index1 = priorAttrs.indexOf(accidental);
            if (index1 === 4) {
                accidental = priorAttrs[index1] + SHARP;
            } else {
                accidental = priorAttrs[index1 + 1];
            }
        }

        // Handle "up-major" intervals (raised major)
        else if (
            interval === "up-major 2" ||
            interval === "up-major 3" ||
            interval === "up-major 6" ||
            interval === "up-major 7"
        ) {
            let intervalNum;
            intervalNum = interval.split(" ")[1];
            majorNote = findMajorInterval("major " + intervalNum);
            accidental = majorNote[0].substring(1, majorNote[0].length);
            index1 = priorAttrs.indexOf(accidental);
            if (index1 === 4) {
                accidental = priorAttrs[index1] + SHARP;
            } else {
                accidental = priorAttrs[index1 + 1];
            }
        }

        // Handle "down-minor" intervals (lowered minor - like diminished)
        else if (
            interval === "down-minor 3" ||
            interval === "down-minor 6" ||
            interval === "down-minor 7"
        ) {
            const intervalNum = interval.split(" ")[1];
            majorNote = findMajorInterval("major " + intervalNum);
            accidental = majorNote[0].substring(1, majorNote[0].length);
            index1 = priorAttrs.indexOf(accidental);

            // Lower by an additional half step (total of two half steps below major)
            if (index1 <= 1) {
                accidental = priorAttrs[0] + FLAT;
            } else {
                accidental = priorAttrs[index1 - 2]; // Go down two accidentals
            }
        }

        // Handle neutral/mid intervals (between major and minor)
        else if (
            interval === "mid 2" ||
            interval === "mid 3" ||
            interval === "mid 6" ||
            interval === "mid 7"
        ) {
            const intervalNum = interval.split(" ")[1];
            majorNote = findMajorInterval("major " + intervalNum);
            accidental = majorNote[0].substring(1, majorNote[0].length);
            index1 = priorAttrs.indexOf(accidental);
            if (index1 === 0) {
                accidental = priorAttrs[index1] + FLAT;
            } else {
                accidental = priorAttrs[index1 - 1];
            }
        }

        return [majorNote[0].substring(0, 1) + accidental + "", majorNote[1]];
    };

    if (
        interval === "major 2" ||
        interval === "major 3" ||
        interval === "major 6" ||
        interval === "major 7" ||
        interval === "perfect 4" ||
        interval === "perfect 5" ||
        interval === "perfect 8" ||
        interval === "perfect 1"
    ) {
        return findMajorInterval(interval);
    } else {
        return findOtherIntervals(interval);
    }
};

/**
 * Convert a pitch number to a pitch name (note and octave).
 * @function
 * @param {number} i - The pitch number.
 * @param {string} [temperament="equal"] - The temperament to use (default is "equal").
 * @param {string} [startPitch="A"] - The starting pitch name (default is "A").
 * @param {number} [offset=0] - The offset value (default is 0).
 * @returns {Array} An array containing the note and octave.
 */
var numberToPitch = (i, temperament, startPitch, offset, activity) => {
    // Calculate the pitch and octave based on index.
    // We start at A0.
    if (temperament === undefined) {
        temperament = "equal";
    }
    const currentEDO = getCurrentEDO(temperament);

    let n = 0;
    let pitchNumber;
    if (i < 0) {
        while (i < 0) {
            i += currentEDO;
            n += 1; // Count octave bump ups.
        }

        if (isTrueEDO(temperament)) {
            if (currentEDO === 12) {
                const nameIndex = Math.round(((i % currentEDO) / currentEDO) * 12);
                return [
                    PITCHES[(nameIndex + PITCHES.indexOf("A")) % 12],
                    Math.floor((i + PITCHES.indexOf("A")) / currentEDO) - n
                ];
            } else {
                const edoNames = generateNoteNames(currentEDO);
                let aIndex = edoNames.indexOf("A");
                if (aIndex === -1) {
                    aIndex = Math.round((9 / 12) * currentEDO);
                }
                const nameIndex = (((i + aIndex) % currentEDO) + currentEDO) % currentEDO;
                return [edoNames[nameIndex], Math.floor((i + aIndex) / currentEDO) - n];
            }
        } else {
            pitchNumber = Math.floor(i - offset);
        }
    } else {
        if (isTrueEDO(temperament)) {
            if (currentEDO === 12) {
                const nameIndex = Math.round(((i % currentEDO) / currentEDO) * 12);
                return [
                    PITCHES[(nameIndex + PITCHES.indexOf("A")) % 12],
                    Math.floor((i + PITCHES.indexOf("A")) / currentEDO)
                ];
            } else {
                const edoNames = generateNoteNames(currentEDO);
                let aIndex = edoNames.indexOf("A");
                if (aIndex === -1) {
                    aIndex = Math.round((9 / 12) * currentEDO);
                }
                const nameIndex = (((i + aIndex) % currentEDO) + currentEDO) % currentEDO;
                return [edoNames[nameIndex], Math.floor((i + aIndex) / currentEDO)];
            }
        } else {
            pitchNumber = Math.floor(i - offset);
        }
    }

    let interval;
    if (isCustomTemperament(temperament)) {
        // The index may be outside of the octave.
        // Ensure the temperament exists in TEMPERAMENT before accessing it
        if (!TEMPERAMENT[temperament] || !TEMPERAMENT[temperament]["pitchNumber"]) {
            // Fallback to equal temperament if custom temperament is not found
            if (activity && activity.errorMsg) {
                activity.errorMsg(
                    _("Invalid temperament. Falling back to equal temperament."),
                    3000
                );
            }
            temperament = "equal";
        }
        const octaveLength = TEMPERAMENT[temperament]["pitchNumber"];
        const pitchIdx = pitchNumber % octaveLength;
        const octaveFactor = Math.floor(pitchNumber / octaveLength);

        pitchNumber = pitchIdx + "";
        if (TEMPERAMENT[temperament][pitchNumber] === undefined) {
            // If custom temperament is not defined, then it will
            // store equal temperament notes.
            for (let j = 0; j < octaveLength; j++) {
                const number = "" + j;
                const intervalIndex = Math.round((j * 12) / octaveLength) % 12;
                interval = TEMPERAMENT["equal"]["interval"][intervalIndex];
                TEMPERAMENT[temperament][number] = [
                    Math.pow(2, j / octaveLength),
                    getNoteFromInterval(startPitch, interval)[0],
                    getNoteFromInterval(startPitch, interval)[1]
                ];
            }

            return [
                TEMPERAMENT[temperament][pitchNumber][1],
                TEMPERAMENT[temperament][pitchNumber][2]
            ];
        } else {
            const entry = TEMPERAMENT[temperament][pitchNumber];
            const entryOctave = Number(entry[2]);
            if (Number.isFinite(entryOctave)) {
                // Add in octave factor from above.
                return [entry[1], entryOctave + octaveFactor];
            }
            // Malformed legacy entry (non-numeric octave): derive an
            // equal-division name/octave for this index instead of NaN,
            // matching the undefined-entry fill above (no octave factor).
            if (typeof startPitch !== "string") {
                return [entry[1], NaN];
            }
            const intervalIndex = Math.round((pitchIdx * 12) / octaveLength) % 12;
            const eq = getNoteFromInterval(
                startPitch,
                TEMPERAMENT["equal"]["interval"][intervalIndex]
            );
            return [eq[0], eq[1]];
        }
    } else {
        const temperamentPitchNumber = TEMPERAMENT[temperament]["pitchNumber"] || 12;
        const t = TEMPERAMENT[temperament];
        const noteNames =
            t && t.noteLabels ? t.noteLabels : generateNoteNames(temperamentPitchNumber);

        // Determine the starting note's position in the EDO name table.
        let startPos = 0;
        let baseOctave = 4;
        if (startPitch) {
            const octMatch = startPitch.match(/(-?\d+)$/);
            if (octMatch) {
                baseOctave = parseInt(octMatch[1], 10);
                startPitch = startPitch.slice(0, -octMatch[1].length);
            }
            const normalized = startPitch.replace(/#/g, SHARP).replace(/b/g, FLAT);
            const pos = noteNames.indexOf(normalized);
            if (pos !== -1) {
                startPos = pos;
            }
        }

        const idx =
            ((pitchNumber % temperamentPitchNumber) + temperamentPitchNumber) %
            temperamentPitchNumber;
        const octaveOffset = Math.floor(pitchNumber / temperamentPitchNumber);
        const noteName =
            noteNames[
                (((startPos + idx) % temperamentPitchNumber) + temperamentPitchNumber) %
                    temperamentPitchNumber
            ];
        return [noteName, baseOctave + octaveOffset];
    }
};

/**
 * Resolve a solfege note argument (e.g. "do", "re♯") to a note name for the
 * given key signature and octave length. Shared by the 12-EDO and microtonal
 * EDO paths in getNote().
 * @function
 * @param {string} noteArg - The note argument (expected to be solfege).
 * @param {string} keySignature - The key signature (e.g. "C major").
 * @param {boolean} movable - Whether movable-do solfege is in effect.
 * @param {number} octaveLength - The number of steps in the octave.
 * @param {number} octave - The current octave (adjusted in the return value).
 * @param {number} transpositionFloor - The current transposition floor (adjusted in the return value).
 * @returns {Array|null} [note, octave, transpositionFloor] on success, or null
 *   if noteArg is not a resolvable solfege name.
 */
var getNoteFromSolfege = (
    noteArg,
    keySignature,
    movable,
    octaveLength,
    octave,
    transpositionFloor
) => {
    let sharpFlat = false;
    if (["#", SHARP, FLAT, "b"].includes(noteArg.slice(-1))) {
        sharpFlat = true;
    }

    if (!keySignature) {
        keySignature = "C major";
    }

    let obj;

    if (movable) {
        obj = getScaleAndHalfSteps(keySignature);
    } else {
        obj = getScaleAndHalfSteps("C major");
    }

    let thisScale = obj[0];
    const halfSteps = obj[1];
    const myKeySignature = obj[2];
    const mode = obj[3];
    let offset;
    if (movable) {
        // Ensure it is a valid key signature.
        offset = thisScale.indexOf(myKeySignature);
        if (offset === -1) {
            console.debug(
                "WARNING: Key " +
                    myKeySignature +
                    " not found in " +
                    thisScale +
                    ". Using default of C"
            );
            offset = 0;
            thisScale = NOTESSHARP;
        }

        // We need to set the octave relative to the tonic.
        // Starting from C_4 (note_octave)
        // All keys C# -- F# would remain in octave four
        // All keys Gb -- B would be in octave three (since
        // going down is closer than going up)
        if (offset > 5) {
            transpositionFloor -= octaveLength; // go down one octave
        }
    } else {
        offset = 0;
    }

    if (sharpFlat) {
        if (noteArg.slice(-1) === "#") {
            offset += 1;
        } else if (noteArg.slice(-1) === SHARP) {
            offset += 1;
        } else if (noteArg.slice(-1) === FLAT) {
            offset -= 1;
        } else if (noteArg.slice(-1) === "b") {
            offset -= 1;
        }
    }

    let solfegePart;
    if (halfSteps.includes(noteArg.slice(0, 1).toLowerCase())) {
        solfegePart = noteArg.slice(0, 1).toLowerCase();
    } else if (halfSteps.includes(noteArg.slice(0, 2).toLowerCase())) {
        solfegePart = noteArg.slice(0, 2).toLowerCase();
    } else if (halfSteps.includes(noteArg.slice(0, 3).toLowerCase())) {
        solfegePart = noteArg.slice(0, 3).toLowerCase();
    } else {
        // The note should already be translated, but just in case...
        // Reverse any i18n
        // solfnotes_ is used in the interface for i18n
        const i18nObj = splitI18nSolfege(noteArg);
        if (SOLFNOTES.includes(i18nObj[0])) {
            solfegePart = i18nObj[0];
        } else {
            solfegePart = noteArg.slice(0, 2).toLowerCase();
        }
    }

    if (movable && Object.prototype.hasOwnProperty.call(MOVABLE_TONIC_DEGREE, mode)) {
        // Rotate so the tonic takes its syllable (e.g. la in minor).
        const tonicDegree = MOVABLE_TONIC_DEGREE[mode];
        const i = SOLFEGENAMES.indexOf(solfegePart);
        if (i >= tonicDegree) {
            transpositionFloor += octaveLength;
        }

        if (mode === "dorian") {
            transpositionFloor -= octaveLength;
        }

        solfegePart = SOLFEGENAMES[(i + 7 - tonicDegree) % 7];
    }

    let index;
    if (halfSteps.includes(solfegePart)) {
        index = halfSteps.indexOf(solfegePart) + offset;
        if (index >= thisScale.length) {
            index -= thisScale.length;
            octave += 1;
        } else if (index < 0) {
            index += thisScale.length;
            octave -= 1;
        }

        let note = thisScale[index];
        // In non-12 EDO temperaments, enharmonic spellings are distinct
        // pitches, so the resolved note must honor the input's accidental.
        if (octaveLength !== 12 && sharpFlat) {
            if (noteArg.slice(-1) === "#" || noteArg.slice(-1) === SHARP) {
                note = NOTESSHARP[index];
            } else {
                note = NOTESFLAT[index];
            }
        }

        if (octaveLength === 12 && note in EXTRATRANSPOSITIONS) {
            octave += EXTRATRANSPOSITIONS[note][1];
            note = EXTRATRANSPOSITIONS[note][0];
        }

        return [note, octave, transpositionFloor];
    }

    return null;
};

/**
 * Get the note based on various parameters.
 * @function
 * @param {string|number} noteArg - The note name or pitch number.
 * @param {number} octave - The octave value.
 * @param {number} transposition - The transposition value (semitones, or EDO steps if isAlreadyEdoSteps is true).
 * @param {string} keySignature - The key signature (default is "C major").
 * @param {boolean} movable - Whether the key signature is movable (default is false).
 * @param {string} direction - The direction of the note (unused parameter).
 * @param {string} errorMsg - The error message (unused parameter).
 * @param {string} [temperament="equal"] - The temperament to use (default is "equal").
 * @param {boolean} [isAlreadyEdoSteps=false] - If true, transposition is already in EDO steps; skip semitone-to-EDO conversion.
 * @param {boolean} [clampIndex=false] - If true, clamp pitch index to 0..edo-1 instead of wrapping across octaves.
 * @returns {Array} An array containing the note, octave, and cents
 */
function getNote(
    noteArg,
    octave,
    transposition,
    keySignature,
    movable,
    direction,
    errorMsg,
    temperament,
    isAlreadyEdoSteps,
    clampIndex
) {
    if (typeof noteArg === "number") {
        noteArg = noteArg.toString();
    }
    if (temperament === undefined) {
        temperament = "equal";
    }

    const octaveLength =
        TEMPERAMENT[temperament] && typeof TEMPERAMENT[temperament].pitchNumber === "number"
            ? TEMPERAMENT[temperament].pitchNumber
            : 12;

    let rememberFlat = false;
    let rememberSharp = false;
    let transpositionFloor = 0;
    let transpositionCents = 0;

    if (transposition === undefined) {
        transposition = 0;
    }

    // transposition = Math.round(transposition);
    if (transposition < 0) {
        transposition = -transposition;
        transpositionFloor = Math.floor(transposition);
        transpositionCents = transposition - transpositionFloor;
        transpositionFloor = -transpositionFloor;
        transpositionCents = -transpositionCents * 100;
        transposition = -transposition;
    } else {
        transpositionFloor = Math.floor(transposition);
        transpositionCents = (transposition - transpositionFloor) * 100;
    }

    // Scale transposition from semitones to EDO steps.
    // Use the original transposition value (not the already-floored transpositionFloor)
    // to preserve fractional precision during conversion.
    // Skip this conversion if transposition is already in EDO steps (non-equal temperaments).
    if (octaveLength !== 12 && !isAlreadyEdoSteps) {
        transpositionFloor = Math.round((transposition * octaveLength) / 12);
    }

    if (typeof noteArg !== "number") {
        // Could be mi#<sub>4</sub> (from matrix) or mi# (from note).
        if (noteArg.slice(-1) === ">") {
            // Read octave and solfege from HTML
            octave = parseInt(
                noteArg.slice(noteArg.indexOf(">") + 1, noteArg.indexOf("/") - 1),
                10
            );
            const noteEnd = noteArg.indexOf("<");
            noteArg = noteEnd === -1 ? "" : noteArg.slice(0, noteEnd);
        }
        if (
            noteArg.toLowerCase().slice(0, 4) === "rest" ||
            noteArg.toLowerCase().slice(0, 4) === "r"
        ) {
            return ["R", "", 0];
        }
        // Could be a number as a string (with or without an accidental.
        let noteAsNumber = noteArg;
        if (["#", SHARP, FLAT, "b"].includes(noteArg.slice(-1))) {
            noteAsNumber = noteArg.slice(0, noteArg.length - 1);
        }
        if (!isNaN(noteAsNumber)) {
            if (["#", SHARP].includes(noteArg.slice(-1))) {
                transpositionFloor += Math.round(octaveLength / 12);
            } else if (["b", FLAT].includes(noteArg.slice(-1))) {
                transpositionFloor -= Math.round(octaveLength / 12);
            }
            noteArg = Number(noteAsNumber);
        }
    }

    octave = Math.round(octave);

    if (typeof noteArg === "number") {
        // Assume it is a pitch number.
        if (!keySignature) {
            keySignature = "C major";
        }
        let kOffset = 0;
        if (movable) {
            kOffset = PITCHES.indexOf(keySignature.split(" ")[0]);
            if (kOffset === -1) {
                kOffset = PITCHES2.indexOf(keySignature.split(" ")[0]);
            }
            if (kOffset === -1) {
                kOffset = 0;

                console.log("Cannot find " + keySignature.split(" ")[0] + ". Reverting to C");
            }
        }
        // Apply the key offset before normalizing the pitch index.
        // For example, with kOffset = 0, noteArg = -1 gives pitchValue = -1
        // and maps to "B" in the previous octave, while noteArg = 13
        // maps to "D♭" in the next octave.
        const pitchValue = noteArg + kOffset;
        const pitchIndex = ((pitchValue % octaveLength) + octaveLength) % octaveLength;

        octave += Math.floor(pitchValue / octaveLength);
        if (octaveLength === 12) {
            if (getSharpFlatPreference(keySignature) === "sharp") {
                noteArg = PITCHES2[pitchIndex];
            } else {
                noteArg = PITCHES[pitchIndex];
            }
        } else {
            const edoNames = generateNoteNames(octaveLength);
            noteArg = edoNames[pitchIndex];
        }
    }

    let note;
    let articulation;

    if (
        temperament in PreDefinedTemperaments ||
        (isCustomTemperament(temperament) && isEquallyTempered(temperament))
    ) {
        // Check for double flat or double sharp. Since bb and x behave
        // funny with string operations, we jump through some hoops.
        articulation = getArticulation(noteArg);
        noteArg = noteArg.replace(articulation, "");

        switch (articulation) {
            case "bb":
            case "♭♭":
            case DOUBLEFLAT:
                noteArg += "b";
                rememberFlat = true;
                transpositionFloor -= 1;
                break;
            case "b":
            case FLAT:
                noteArg += "b";
                rememberFlat = true;
                break;
            case "##":
            case "♯♯":
            case "*":
            case "x":
            case DOUBLESHARP:
                noteArg += "#";
                rememberSharp = true;
                transpositionFloor += 1;
                break;
            case "#":
            case SHARP:
                noteArg += "#";
                rememberSharp = true;
                break;
            case "b#":
            case "#b":
            case FLAT + SHARP:
            case SHARP + FLAT:
            default:
                noteArg += articulation;
                break;
        }

        // Already a note? No need to convert from solfege.
        if (rememberSharp) {
            if (noteArg in STOSHARP) {
                noteArg = STOSHARP[noteArg];
            }
        } else if (noteArg in BTOFLAT) {
            noteArg = BTOFLAT[noteArg];
        } else if (noteArg in STOSHARP) {
            noteArg = STOSHARP[noteArg];
        }

        if (octaveLength !== 12) {
            // For microtonal EDOs, check the EDO-specific name table first.
            // This ensures EDO-native entries (e.g. B♯ in 19-EDO at position 18)
            // are resolved without going through 12-EDO EXTRATRANSPOSITIONS, which
            // would prematurely convert them to enharmonic equivalents and corrupt
            // the octave calculation.
            const edoNames = generateNoteNames(octaveLength);
            const normalizedName = noteArg.replaceAll("#", SHARP).replaceAll("b", FLAT);
            const edoIdx = edoNames.indexOf(normalizedName);
            if (edoIdx !== -1) {
                note = edoNames[edoIdx];
            } else if (noteArg in EXTRATRANSPOSITIONS) {
                octave += EXTRATRANSPOSITIONS[noteArg][1];
                note = EXTRATRANSPOSITIONS[noteArg][0];
            } else if (NOTESSHARP.includes(noteArg.toUpperCase())) {
                note = noteArg.toUpperCase();
            } else if (NOTESFLAT.includes(noteArg)) {
                note = noteArg;
            } else if (NOTESFLAT2.includes(noteArg)) {
                note = NOTESFLAT[NOTESFLAT2.indexOf(noteArg)];
            } else {
                // Fall back to solfege resolution so microtonal EDOs accept
                // solfege names (e.g. "do", "re♯") just like 12-EDO does.
                const solfegeNote = getNoteFromSolfege(
                    noteArg,
                    keySignature,
                    movable,
                    octaveLength,
                    octave,
                    transpositionFloor
                );
                if (solfegeNote !== null && edoNames.includes(solfegeNote[0])) {
                    note = solfegeNote[0];
                    octave = solfegeNote[1];
                    transpositionFloor = solfegeNote[2];
                } else if (errorMsg !== undefined) {
                    console.debug(
                        "WARNING: EDO note [" +
                            noteArg +
                            "] (normalized: " +
                            normalizedName +
                            ") not found in generateNoteNames(" +
                            octaveLength +
                            ")"
                    );
                    errorMsg(INVALIDPITCH, null);
                    return ["R", "", 0];
                } else {
                    return ["R", "", 0];
                }
            }
        } else if (noteArg in EXTRATRANSPOSITIONS) {
            octave += EXTRATRANSPOSITIONS[noteArg][1];
            note = EXTRATRANSPOSITIONS[noteArg][0];
        } else if (NOTESSHARP.includes(noteArg.toUpperCase())) {
            note = noteArg.toUpperCase();
        } else if (NOTESFLAT.includes(noteArg)) {
            note = noteArg;
        } else if (NOTESFLAT2.includes(noteArg)) {
            // Convert to uppercase, e.g., d♭ -> D♭.
            note = NOTESFLAT[NOTESFLAT2.indexOf(noteArg)];
        } else {
            const solfegeNote = getNoteFromSolfege(
                noteArg,
                keySignature,
                movable,
                octaveLength,
                octave,
                transpositionFloor
            );
            if (solfegeNote === null) {
                console.debug(
                    "WARNING: Note [" + noteArg + "] not found in the scale. Returning REST"
                );
                if (errorMsg !== undefined) {
                    errorMsg(INVALIDPITCH, null);
                }

                return ["R", "", 0];
            }

            note = solfegeNote[0];
            octave = solfegeNote[1];
            transpositionFloor = solfegeNote[2];
        }

        if (transpositionFloor && transpositionFloor !== 0) {
            let deltaOctave, deltaNote;
            if (transpositionFloor < 0) {
                deltaOctave = -Math.floor(-transpositionFloor / octaveLength);
                deltaNote = -(-transpositionFloor % octaveLength);
            } else {
                deltaOctave = Math.floor(transpositionFloor / octaveLength);
                deltaNote = transpositionFloor % octaveLength;
            }

            octave += deltaOctave;

            if (deltaNote !== 0) {
                const foundIdx = getEdoNoteNamePosition(note, octaveLength);
                if (foundIdx !== -1) {
                    let i = foundIdx + deltaNote;
                    const nameTableLength = generateNoteNames(octaveLength).length;
                    if (clampIndex) {
                        // Clamp to valid range instead of wrapping across octaves.
                        if (i < 0 || i >= nameTableLength) {
                            i = Math.max(0, Math.min(i, nameTableLength - 1));
                        }
                    } else {
                        if (i < 0) {
                            i += nameTableLength;
                            octave -= 1;
                        } else if (i >= nameTableLength) {
                            i -= nameTableLength;
                            octave += 1;
                        }
                    }
                    note = generateNoteNames(octaveLength)[i];
                } else {
                    console.debug("note not found in EDO table? " + note);
                }
            }
        }

        // Try to find a note in the current keySignature
        // When converting through EQUIVALENTNATURALS, B↔C crosses an SPN
        // octave boundary (B♯4 = C5, C♭4 = B3). Adjust the octave so the
        // note letter's SPN position matches the actual pitch register.
        switch (getSharpFlatPreference(keySignature)) {
            case "flat":
                if (octaveLength === 12 && note in EQUIVALENTFLATS) {
                    note = EQUIVALENTFLATS[note];
                }
                break;
            case "sharp":
                if (octaveLength === 12 && note in EQUIVALENTSHARPS) {
                    note = EQUIVALENTSHARPS[note];
                }
                break;
            case "natural":
                if (octaveLength === 12 && note in EQUIVALENTNATURALS) {
                    const origLetter = note.charAt(0);
                    note = EQUIVALENTNATURALS[note];
                    const newLetter = note.charAt(0);
                    if (origLetter === "B" && newLetter === "C") {
                        octave += 1;
                    } else if (origLetter === "C" && newLetter === "B") {
                        octave -= 1;
                    }
                }
                break;
            default:
                break;
        }

        // Consider the note direction (in the case of intervals)
        if (direction !== undefined) {
            switch (direction) {
                case -1:
                    if (octaveLength === 12 && note in EQUIVALENTFLATS) {
                        note = EQUIVALENTFLATS[note];
                    }
                    break;
                case 1:
                    if (octaveLength === 12 && note in EQUIVALENTSHARPS) {
                        note = EQUIVALENTSHARPS[note];
                    }
                    break;
                default:
                    break;
            }
        }

        // Preserve input accidental style only when no transposition was applied.
        // When transpositionFloor is non-zero, EQUIVALENTSHARPS/EQUIVALENTFLATS could
        // undo the pitch change (e.g. E♭→D♯ changes the actual pitch in microtonal
        // temperaments where they are not enharmonically equivalent).
        if (transpositionFloor === 0) {
            if (rememberSharp) {
                if (octaveLength === 12 && note in EQUIVALENTSHARPS) {
                    note = EQUIVALENTSHARPS[note];
                }
            } else if (rememberFlat) {
                if (octaveLength === 12 && note in EQUIVALENTFLATS) {
                    note = EQUIVALENTFLATS[note];
                }
            }
        }
    } else if (isCustomTemperament(temperament)) {
        note = getCustomNote(noteArg);
        const cleanNote = typeof note === "string" ? note.replace(/\(.*?\)/g, "") : note;
        let pitchNumber = null;
        // Ensure the temperament exists before accessing it
        if (TEMPERAMENT[temperament]) {
            for (const number in TEMPERAMENT[temperament]) {
                if (number !== "pitchNumber" && number !== "interval") {
                    const ele = TEMPERAMENT[temperament][number];
                    if (!ele) continue;
                    const n3 = ele[3];
                    const n1 = ele[1];
                    const cleanN3 = typeof n3 === "string" ? n3.replace(/\(.*?\)/g, "") : n3;
                    const cleanN1 = typeof n1 === "string" ? n1.replace(/\(.*?\)/g, "") : n1;
                    if (
                        note === n3 ||
                        (cleanNote && cleanNote === cleanN3) ||
                        (cleanNote && cleanNote === n3) ||
                        note === n1 ||
                        (cleanNote && cleanNote === cleanN1) ||
                        (cleanNote && cleanNote === n1)
                    ) {
                        if (typeof number === "string") {
                            pitchNumber = Number(number);
                        } else {
                            pitchNumber = number;
                        }
                        break;
                    }
                }
            }
        }

        if (pitchNumber === null || pitchNumber === "null") {
            return getNote(
                noteArg,
                octave,
                transpositionFloor,
                keySignature,
                movable,
                direction,
                errorMsg
                // No temperament arg is passed so the note will not
                // be processed as a custom temperament.
            );
        }

        let inOctave = octave;
        // octaveLength already defined at top of function
        let deltaOctave, deltaNote;
        if (transpositionFloor !== 0) {
            if (transpositionFloor < 0) {
                deltaOctave = -Math.floor(-transpositionFloor / octaveLength);
                deltaNote = -(-transpositionFloor % octaveLength);
            } else {
                deltaOctave = Math.floor(transpositionFloor / octaveLength);
                deltaNote = transpositionFloor % octaveLength;
            }

            inOctave += deltaOctave;
            pitchNumber += deltaNote;
        }

        if (pitchNumber < 0) {
            pitchNumber = pitchNumber + octaveLength;
            inOctave = inOctave - 1;
        } else if (pitchNumber >= octaveLength) {
            pitchNumber = pitchNumber - octaveLength;
            inOctave = inOctave + 1;
        }
        pitchNumber = pitchNumber + "";
        if (TEMPERAMENT[temperament][pitchNumber].length > 3) {
            note = TEMPERAMENT[temperament][pitchNumber][3];
        } else {
            note = TEMPERAMENT[temperament][pitchNumber][1];
        }
        octave = inOctave;
    } else {
        // Return E# as E#, Fb as Fb etc. for different temperament systems.
        articulation = getArticulation(noteArg);
        noteArg = noteArg.replace(articulation, "");

        if (SOLFEGENAMES.includes(noteArg)) {
            noteArg = FIXEDSOLFEGE[noteArg];
        }

        switch (articulation) {
            case "bb":
            case DOUBLEFLAT:
                noteArg += "𝄫";
                break;
            case "b":
            case FLAT:
                noteArg += "b";
                break;
            case "##":
            case "*":
            case "x":
            case DOUBLESHARP:
                noteArg += "𝄪";
                break;
            case "#":
            case SHARP:
                noteArg += "#";
                break;
            case "b#":
            case "#b":
            case FLAT + SHARP:
            case SHARP + FLAT:
            default:
                noteArg += articulation;
                break;
        }

        note = noteArg;

        let deltaOctave, deltaNote;
        if (transpositionFloor && transpositionFloor !== 0) {
            if (transpositionFloor < 0) {
                deltaOctave = -Math.floor(-transpositionFloor / octaveLength);
                deltaNote = -(-transpositionFloor % octaveLength);
            } else {
                deltaOctave = Math.floor(transpositionFloor / octaveLength);
                deltaNote = transpositionFloor % octaveLength;
            }

            octave += deltaOctave;

            let pitch, note1, octave1;
            if (deltaNote > 0) {
                pitch = note + "" + octave;
                for (const interval in INTERVALVALUES) {
                    if (deltaNote === INTERVALVALUES[interval][0]) {
                        note1 = getNoteFromInterval(pitch, interval);
                        break;
                    }
                }
            } else if (deltaNote < 0) {
                octave1 = octave - 1;
                pitch = note + "" + octave1;
                for (const interval in INTERVALVALUES) {
                    if (octaveLength + deltaNote === INTERVALVALUES[interval][0]) {
                        note1 = getNoteFromInterval(pitch, interval);
                        break;
                    }
                }
            } else if (deltaNote === 0) {
                pitch = note + "" + octave;
                note1 = getNoteFromInterval(pitch, "perfect 1");
            }
            note = note1[0];
            octave = note1[1];
        }
    }

    if (octave < 1) {
        return [note, 1, transpositionCents];
    } else if (octave > 10) {
        return [note, 10, transpositionCents];
    } else {
        return [note, octave, transpositionCents];
    }
}

var MusicUtilsPitchScale = {
    NOTESYMBOLS,
    keySignatureToMode,
    getScaleAndHalfSteps,
    getSharpFlatPreference,
    pitchToNumber,
    getNoteFromInterval,
    numberToPitch,
    getNoteFromSolfege,
    getNote
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = MusicUtilsPitchScale;
}

if (typeof window !== "undefined") {
    window.MusicUtilsPitchScale = MusicUtilsPitchScale;
}
