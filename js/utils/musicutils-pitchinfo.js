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

   globalActivity, INVALIDPITCH
 */

/*
   exported

   getStepSizeUp, getStepSizeDown, getPitchInfo, MusicUtilsPitchInfo
 */

// var, not const or let: a hoisted var in musicutils.js cannot redeclare a top-level const or let.

if (typeof module !== "undefined" && module.exports) {
    var MusicUtilsConstants =
        (typeof window !== "undefined" && window.MusicUtilsConstants) ||
        (typeof require !== "undefined" ? require("./musicutils-constants") : {});
    var {
        SHARP,
        FLAT,
        DOUBLESHARP,
        NOTESSHARP,
        DOUBLEFLAT,
        NOTESFLAT,
        EQUIVALENTFLATS,
        EQUIVALENTSHARPS,
        SOLFEGENAMES,
        YSTAFFNOTEHEIGHT,
        YSTAFFOCTAVEHEIGHT
    } = MusicUtilsConstants;
    var MusicUtilsI18n =
        (typeof window !== "undefined" && window.MusicUtilsI18n) ||
        (typeof require !== "undefined" ? require("./musicutils-i18n") : {});
    var { SOLFEGECONVERSIONTABLE } = MusicUtilsI18n;
    var MusicUtilsTemperament =
        (typeof window !== "undefined" && window.MusicUtilsTemperament) ||
        (typeof require !== "undefined" ? require("./musicutils-temperament") : {});
    var { getCurrentEDO, generateNoteNames } = MusicUtilsTemperament;
    var MusicUtilsPitch =
        (typeof window !== "undefined" && window.MusicUtilsPitch) ||
        (typeof require !== "undefined" ? require("./musicutils-pitch") : {});
    var { _parse_pitch_string, _calculate_pitch_number, frequencyToPitch } = MusicUtilsPitch;
    var MusicUtilsPitchScale =
        (typeof window !== "undefined" && window.MusicUtilsPitchScale) ||
        (typeof require !== "undefined" ? require("./musicutils-pitchscale") : {});
    var { pitchToNumber } = MusicUtilsPitchScale;
    var MusicUtilsBuildScale =
        (typeof window !== "undefined" && window.MusicUtilsBuildScale) ||
        (typeof require !== "undefined" ? require("./musicutils-buildscale") : {});
    var { _getStepSize, buildScale, scaleDegreeToPitchMapping, computeTargetPitchFrequency } =
        MusicUtilsBuildScale;
}

if (typeof window !== "undefined") {
    window.computeTargetPitchFrequency = computeTargetPitchFrequency;
}

/**
 * Get the step size (number of half-steps) to the next note in the upward direction.
 * @function
 * @param {string} keySignature - The key signature.
 * @param {string} pitch - The pitch (note name).
 * @param {number} transposition - The transposition value.
 * @param {string} temperament - The temperament used for pitch calculation.
 * @param {number} [edo] - Number of steps per octave. When omitted, the
 *     temperament's own EDO is used (legacy behavior).
 * @returns {number} The step size in half-steps.
 */
var getStepSizeUp = (keySignature, pitch, transposition, temperament, edo) => {
    return _getStepSize(keySignature, pitch, "up", transposition, temperament, edo);
};

/**
 * Get the step size (number of half-steps) to the next note in the downward direction.
 * @function
 * @param {string} keySignature - The key signature.
 * @param {string} pitch - The pitch (note name).
 * @param {number} transposition - The transposition value.
 * @param {string} temperament - The temperament used for pitch calculation.
 * @param {number} [edo] - Number of steps per octave. When omitted, the
 *     temperament's own EDO is used (legacy behavior).
 * @returns {number} The step size in half-steps.
 */
var getStepSizeDown = (keySignature, pitch, transposition, temperament, edo) => {
    return _getStepSize(keySignature, pitch, "down", transposition, temperament, edo);
};

/**
 * Get pitch information based on the note or pitch provided.
 * @function
 * @param {string|number|Object} activity - Activity object or note/pitch (1-arg case).
 * @param {string} [type] - The type of pitch info to return (4-arg case).
 * @param {string|number} [currentNote] - The current note (4-arg case).
 * @param {Object} [tur] - The turtle object (4-arg case).
 * @returns {Object|string} If called with one argument, returns { name, octave, pitchNumber }. Otherwise returns legacy values.
 */
var getPitchInfo = function (activity, type, currentNote, tur) {
    // Determine temperament
    let temperament = "equal";
    if (arguments.length === 1) {
        // 1-arg case: try to get from global activity
        if (typeof globalActivity !== "undefined" && globalActivity?.logo?.synth?.inTemperament) {
            temperament = globalActivity.logo.synth.inTemperament;
        }
    } else if (arguments.length === 4 && activity?.logo?.synth?.inTemperament) {
        // 4-arg case: get from activity
        temperament = activity.logo.synth.inTemperament;
    }

    if (arguments.length === 1) {
        const noteOrPitch = activity;
        let name, octave, pitchNumber;

        if (typeof noteOrPitch === "number") {
            const currentEDO = getCurrentEDO(temperament);
            pitchNumber = noteOrPitch;
            octave = Math.floor(pitchNumber / currentEDO) - 1;
            const edoNames = generateNoteNames(currentEDO);
            name = edoNames[pitchNumber % currentEDO];
        } else if (typeof noteOrPitch === "string") {
            [name, octave] = _parse_pitch_string(noteOrPitch);
            pitchNumber = _calculate_pitch_number(name, octave, 0, temperament);
        } else {
            return INVALIDPITCH;
        }

        if (pitchNumber === INVALIDPITCH) {
            return { name: null, octave: null, pitchNumber: INVALIDPITCH };
        }

        return {
            name: name.replaceAll(SHARP, "#").replaceAll(FLAT, "b"),
            octave: parseInt(octave, 10),
            pitchNumber: pitchNumber
        };
    }

    // Legacy behavior for 4 arguments
    let pitch;
    let octave;
    let obj;
    let cents;
    if (Number(currentNote)) {
        // If it is a frequency, convert it to a pitch/octave.
        obj = frequencyToPitch(currentNote);
        pitch = obj[0];
        octave = obj[1];
        cents = obj[2];
    } else {
        // Turn the note into pitch and octave.
        [pitch, octave] = _parse_pitch_string(currentNote);
    }
    // Remap double sharps/double flats.
    if (pitch.includes(DOUBLESHARP)) {
        pitch = pitch.replace(DOUBLESHARP, "");
        if (pitch === "B") {
            pitch = "C" + SHARP;
        } else {
            pitch = NOTESSHARP[NOTESSHARP.indexOf(pitch) + 2];
        }
    } else if (pitch.includes(DOUBLEFLAT)) {
        pitch = pitch.replace(DOUBLEFLAT, "");
        if (pitch === "C") {
            pitch = "B" + FLAT;
        } else {
            pitch = NOTESFLAT[NOTESFLAT.indexOf(pitch) - 2];
        }
    }
    // Map the pitch to the current scale.
    pitch = pitch.replaceAll("#", SHARP).replaceAll("b", FLAT);
    if (
        getCurrentEDO(temperament) === 12 &&
        !buildScale(tur.singer.keySignature)[0].includes(pitch)
    ) {
        if (pitch in EQUIVALENTFLATS) {
            pitch = EQUIVALENTFLATS[pitch];
        } else if (pitch in EQUIVALENTSHARPS) {
            pitch = EQUIVALENTSHARPS[pitch];
        }
    }

    try {
        switch (type) {
            case "alphabet":
                return pitch;
            case "alphabet class":
            case "letter class":
                return pitch[0];
            case "solfege syllable":
            case "solfege class":
                if (type === "solfege class") {
                    // Remove sharps and flats.
                    pitch = pitch.replace(SHARP, "").replace(FLAT, "");
                }
                if (tur.singer.movable === false) {
                    return SOLFEGECONVERSIONTABLE[pitch];
                }
                return SOLFEGENAMES[buildScale(tur.singer.keySignature)[0].indexOf(pitch)];
            case "pitch class":
                return (
                    (pitchToNumber(pitch, octave, tur.singer.keySignature) - 3) %
                    getCurrentEDO(temperament)
                );
            case "scalar class":
                return scaleDegreeToPitchMapping(
                    tur.singer.keySignature,
                    null,
                    tur.singer.movable,
                    pitch
                )[0];
            case "scale degree":
                obj = scaleDegreeToPitchMapping(
                    tur.singer.keySignature,
                    null,
                    tur.singer.movable,
                    pitch
                );
                return obj[0] + obj[1];
            case "nth degree":
                return buildScale(tur.singer.keySignature)[0].indexOf(pitch);
            case "staff y":
                // These numbers are in relation to the staff artwork.
                return (
                    ["C", "D", "E", "F", "G", "A", "B"].indexOf(pitch[0]) * YSTAFFNOTEHEIGHT +
                    (octave - 4) * YSTAFFOCTAVEHEIGHT
                );
            case "pitch number":
                return _calculate_pitch_number(
                    pitch,
                    octave,
                    tur?.singer?.pitchNumberOffset || 0,
                    temperament
                );
            case "pitch in hertz":
                // This function ignores cents.
                return activity.logo.synth._getFrequency(
                    pitch + octave,
                    activity.logo.synth.changeInTemperament
                );
            case "pitch to color":
                if (NOTESSHARP.includes(pitch)) {
                    return NOTESSHARP.indexOf(pitch) * 8.33;
                } else if (NOTESFLAT.includes(pitch)) {
                    return NOTESFLAT.indexOf(pitch) * 8.33;
                }

                console.debug("Pitch not found: " + pitch);
                return 0;
            case "pitch to shade":
                return octave * 12.5;
            default:
                return "__INVALID_INPUT__";
        }
    } catch {
        console.debug("Waiting for note to play");
    }
};

var MusicUtilsPitchInfo = {
    getStepSizeUp,
    getStepSizeDown,
    getPitchInfo
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = MusicUtilsPitchInfo;
}

if (typeof window !== "undefined") {
    window.MusicUtilsPitchInfo = MusicUtilsPitchInfo;
}
