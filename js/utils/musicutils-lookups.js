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

   DRUMNAMES, NOISENAMES, VOICENAMES, CUSTOMSAMPLES
 */

/*
   exported

   getMidiInstrument, getMidiDrum, getReverseDrumMidi, getInvertMode,
   getIntervalNumber, getIntervalDirection, getIntervalRatio, getDrumIndex,
   getDrumName, getDrumSymbol, getFilterTypes, getOscillatorTypes,
   getDrumIcon, getDrumSynthName, getNoiseName, getNoiseIcon,
   getNoiseSynthName, getVoiceName, getVoiceIcon, getVoiceSynthName,
   MusicUtilsLookups
 */

// var, not const or let: a hoisted var in musicutils.js cannot redeclare a top-level const or let.

if (typeof module !== "undefined" && module.exports) {
    var MusicUtilsConstants =
        (typeof window !== "undefined" && window.MusicUtilsConstants) ||
        (typeof require !== "undefined" ? require("./musicutils-constants") : {});
    var {
        MIDI_INSTRUMENTS,
        DRUM_MIDI_MAP,
        REVERSE_DRUM_MIDI_MAP,
        INTERVALVALUES,
        DEFAULTDRUM,
        DEFAULTFILTERTYPE,
        DEFAULTNOISE,
        DEFAULTVOICE
    } = MusicUtilsConstants;
    var MusicUtilsI18n =
        (typeof window !== "undefined" && window.MusicUtilsI18n) ||
        (typeof require !== "undefined" ? require("./musicutils-i18n") : {});
    var { INVERTMODES, FILTERTYPES, OSCTYPES, INTERVALS } = MusicUtilsI18n;
}

/**
 * Get midi map for Instruments.
 * @function
 * @returns {Object}
 */
var getMidiInstrument = () => {
    return MIDI_INSTRUMENTS;
};

/**
 * Get midi map for Drums.
 * @function
 * @returns {Object}
 */
var getMidiDrum = () => {
    return DRUM_MIDI_MAP;
};

/**
 * Get reversed midi map for drum.
 * @function
 * @returns {Object}
 */
var getReverseDrumMidi = () => {
    return REVERSE_DRUM_MIDI_MAP;
};

/**
 * Get the invert mode name based on its identifier.
 * @function
 * @param {string} name - The identifier of the invert mode.
 * @returns {string} The name of the invert mode.
 */
var getInvertMode = name => {
    for (const interval in INVERTMODES) {
        if (
            INVERTMODES[interval][0] === name ||
            INVERTMODES[interval][1].toLowerCase() === name.toLowerCase()
        ) {
            if (INVERTMODES[interval][0] !== "") {
                return INVERTMODES[interval][0];
            } else {
                return INVERTMODES[interval][1];
            }
        }
    }

    // console.debug(name + " not found in INVERTMODES");
    return name;
};

const resolveIntervalKey = name => {
    if (typeof name !== "string" || !name) {
        return null;
    }
    const trimmed = name.trim();
    if (typeof INTERVALVALUES !== "undefined" && INTERVALVALUES) {
        if (Object.prototype.hasOwnProperty.call(INTERVALVALUES, trimmed)) {
            return trimmed;
        }
        const lower = trimmed.toLowerCase();
        if (Object.prototype.hasOwnProperty.call(INTERVALVALUES, lower)) {
            return lower;
        }
        if (typeof INTERVALS !== "undefined" && Array.isArray(INTERVALS)) {
            for (let i = 0; i < INTERVALS.length; i++) {
                const entry = INTERVALS[i];
                const localized = entry[0];
                const english = entry[1];
                if (localized && english && localized !== english) {
                    const locLower = localized.toLowerCase();
                    if (lower.startsWith(locLower + " ")) {
                        const candidate = english + lower.slice(locLower.length);
                        if (Object.prototype.hasOwnProperty.call(INTERVALVALUES, candidate)) {
                            return candidate;
                        }
                    }
                }
            }
        }
    }
    return null;
};

/**
 * Get the number of semi-tones for a specific interval.
 * @function
 * @param {string} name - The name of the interval.
 * @returns {number} The number of semi-tones for the interval.
 */
var getIntervalNumber = name => {
    const key = resolveIntervalKey(name);
    return key !== null ? INTERVALVALUES[key][0] : 0;
};

/**
 * Get the direction of the interval (-1 down, 0 neutral, 1 up).
 * @function
 * @param {string} name - The name of the interval.
 * @returns {number} The direction of the interval.
 */
var getIntervalDirection = name => {
    const key = resolveIntervalKey(name);
    return key !== null ? INTERVALVALUES[key][1] : 0;
};

/**
 * Get the ratio for a specific interval.
 * @function
 * @param {string} name - The name of the interval.
 * @returns {number} The ratio for the interval.
 */
var getIntervalRatio = name => {
    const key = resolveIntervalKey(name);
    return key !== null ? INTERVALVALUES[key][2] : 1;
};

/**
 * Get the drum index based on its name.
 * @function
 * @param {string} name - The name of the drum.
 * @returns {number} The index of the drum, or -1 if not found.
 */
var getDrumIndex = name => {
    if (typeof name !== "string") {
        return -1;
    } else if (name === "") {
        // console.debug("getDrumName passed blank name. Returning " + DEFAULTDRUM);
        name = DEFAULTDRUM;
    } else if (name.slice(0, 4) === "http") {
        name = DEFAULTDRUM;
    }

    for (let drum = 0; drum < DRUMNAMES.length; drum++) {
        if (DRUMNAMES[drum][0].toLowerCase() === name.toLowerCase()) {
            return drum;
        } else if (DRUMNAMES[drum][1].toLowerCase() === name.toLowerCase()) {
            return drum;
        }
    }

    return -1;
};

/**
 * Get the drum name based on its identifier.
 * @function
 * @param {string} name - The identifier of the drum.
 * @returns {string|null} The name of the drum, or null if not found.
 */
var getDrumName = name => {
    if (typeof name !== "string") {
        return null;
    } else if (name === "") {
        name = DEFAULTDRUM;
    } else if (name.slice(0, 4) === "http") {
        return null;
    }

    for (let drum = 0; drum < DRUMNAMES.length; drum++) {
        if (DRUMNAMES[drum][0].toLowerCase() === name.toLowerCase()) {
            return DRUMNAMES[drum][0];
        } else if (DRUMNAMES[drum][1].toLowerCase() === name.toLowerCase()) {
            return DRUMNAMES[drum][1];
        }
    }

    return null;
};

/**
 * Get the drum symbol based on its name.
 * @function
 * @param {string} name - The name of the drum.
 * @returns {string} The symbol of the drum, or "hh" if not found.
 */
var getDrumSymbol = name => {
    if (typeof name !== "string") {
        return "hh";
    } else if (name === "") {
        return "hh";
    }

    for (let drum = 0; drum < DRUMNAMES.length; drum++) {
        if (
            DRUMNAMES[drum][0].toLowerCase() === name.toLowerCase() ||
            DRUMNAMES[drum][1].toLowerCase() === name.toLowerCase()
        ) {
            return DRUMNAMES[drum][3];
        }
    }

    // console.debug(name + " not found in DRUMNAMES");
    return "hh";
};

/**
 * Get the filter type based on its name.
 * @function
 * @param {string} name - The name of the filter type.
 * @returns {string} The filter type, or the default filter type if not found.
 */
var getFilterTypes = name => {
    if (name === "") {
        name = DEFAULTFILTERTYPE;
    }

    for (let type = 0; type < FILTERTYPES.length; type++) {
        if (FILTERTYPES[type][0].toLowerCase() === name.toLowerCase()) {
            return FILTERTYPES[type][0];
        } else if (FILTERTYPES[type][1].toLowerCase() === name.toLowerCase()) {
            return FILTERTYPES[type][1];
        }
    }

    // console.debug(name + " not found in FILTERTYPES");
    return DEFAULTFILTERTYPE;
};

/**
 * Get the oscillator type based on its name.
 * @function
 * @param {string} name - The name of the oscillator type.
 * @returns {string|null} The oscillator type, or null if not found.
 */
var getOscillatorTypes = name => {
    if (name === "") {
        name = null; // DEFAULTOSCILLATORTYPE;
    }

    for (let type = 0; type < OSCTYPES.length; type++) {
        if (OSCTYPES[type][0].toLowerCase() === name.toLowerCase()) {
            return OSCTYPES[type][0];
        } else if (OSCTYPES[type][1].toLowerCase() === name.toLowerCase()) {
            return OSCTYPES[type][1];
        }
    }

    // console.debug(name + " not found in OSCTYPES");
    return null; // DEFAULTOSCILLATORTYPE;
};

/**
 * Get the drum icon file path based on its name.
 * @function
 * @param {string} name - The name of the drum.
 * @returns {string} The file path of the drum icon, or the default drum icon path if not found.
 */
var getDrumIcon = name => {
    if (typeof name !== "string") {
        return "images/drum.svg";
    } else if (name === "") {
        name = DEFAULTDRUM;
    } else if (name.slice(0, 4) === "http") {
        return "images/drum.svg";
    }

    for (let i = 0; i < DRUMNAMES.length; i++) {
        if (DRUMNAMES[i][0] === name || DRUMNAMES[i][1].toLowerCase() === name.toLowerCase()) {
            return DRUMNAMES[i][2];
        }
    }

    // console.debug(name + " not found in DRUMNAMES");
    return "images/drum.svg";
};

/**
 * Get the drum synth name based on its identifier.
 * @function
 * @param {string} name - The identifier of the drum synth.
 * @returns {string|null} The name of the drum synth, or null if not found.
 */
var getDrumSynthName = name => {
    if (typeof name !== "string") {
        // console.debug("getDrumSynthName passed non-string name. Returning null");
        return null;
    } else if (name === "") {
        name = DEFAULTDRUM;
    } else if (name.slice(0, 4) === "http") {
        return name;
    }

    for (let i = 0; i < DRUMNAMES.length; i++) {
        if (DRUMNAMES[i][0] === name || DRUMNAMES[i][1].toLowerCase() === name.toLowerCase()) {
            return DRUMNAMES[i][1];
        }
    }

    // console.debug(name + " not found in DRUMNAMES");
    return DEFAULTDRUM;
};

/**
 * Get the noise name based on its identifier.
 * @function
 * @param {string} name - The identifier of the noise.
 * @returns {string} The name of the noise, or the default noise if not found.
 */
var getNoiseName = name => {
    if (typeof name !== "string") {
        return DEFAULTNOISE;
    } else if (name === "") {
        name = DEFAULTNOISE;
    }

    for (let i = 0; i < NOISENAMES.length; i++) {
        if (NOISENAMES[i][1] === name) {
            if (NOISENAMES[i][0] !== "") {
                return NOISENAMES[i][0];
            } else {
                return NOISENAMES[i][1];
            }
        }
    }

    return DEFAULTNOISE;
};

/**
 * Get the noise icon file path based on its name.
 * @function
 * @param {string} name - The name of the noise.
 * @returns {string} The file path of the noise icon, or the default noise icon path if not found.
 */
var getNoiseIcon = name => {
    if (typeof name !== "string") {
        return "images/synth.svg";
    } else if (name === "") {
        name = DEFAULTNOISE;
    } else if (name.slice(0, 4) === "http") {
        return "images/noises.svg";
    }

    for (let i = 0; i < NOISENAMES.length; i++) {
        if (NOISENAMES[i][0] === name || NOISENAMES[i][1] === name) {
            return NOISENAMES[i][2];
        }
    }

    // console.debug(name + " not found in NOISENAMES");
    return "images/synth.svg";
};

/**
 * Get the noise synth name based on its identifier.
 * @function
 * @param {string|null} name - The identifier of the noise synth.
 * @returns {string|null} The name of the noise synth, or null if not found.
 */
var getNoiseSynthName = name => {
    if (typeof name !== "string") {
        return null;
    } else if (name === "") {
        name = DEFAULTNOISE;
    }

    for (let i = 0; i < NOISENAMES.length; i++) {
        if (NOISENAMES[i][0] === name || NOISENAMES[i][1] === name) {
            return NOISENAMES[i][1];
        }
    }

    // console.debug(name + " not found in NOISENAMES");
    return DEFAULTNOISE;
};

/**
 * Get the voice name based on its identifier.
 * @function
 * @param {string} name - The identifier of the voice.
 * @returns {string|null} The name of the voice, or null if not found.
 */
var getVoiceName = name => {
    if (typeof name !== "string") {
        return DEFAULTVOICE;
    } else if (name === "") {
        name = DEFAULTVOICE;
    } else if (name.slice(0, 4) === "http") {
        return null;
    }

    for (let i = 0; i < VOICENAMES.length; i++) {
        if (VOICENAMES[i][0] === name) {
            if (VOICENAMES[i][0] !== "") {
                return VOICENAMES[i][0];
            } else if (VOICENAMES[i][1] === name) {
                return VOICENAMES[i][1];
            }
        }
    }

    return DEFAULTVOICE;
};

/**
 * Get the voice icon file path based on its identifier.
 * @function
 * @param {string} name - The identifier of the voice.
 * @returns {string} The file path of the voice icon, or the default voice icon path if not found.
 */
var getVoiceIcon = name => {
    if (typeof name !== "string") {
        return "images/voices.svg";
    } else if (name === "") {
        name = DEFAULTVOICE;
    } else if (name.slice(0, 4) === "http") {
        return "images/voices.svg";
    }

    for (let i = 0; i < VOICENAMES.length; i++) {
        if (VOICENAMES[i][0] === name || VOICENAMES[i][1] === name) {
            return VOICENAMES[i][2];
        }
    }

    for (let i = 0; i < CUSTOMSAMPLES.length; i++) {
        if (CUSTOMSAMPLES[i][0] === name || CUSTOMSAMPLES[i][1] === name) {
            return CUSTOMSAMPLES[i][0];
        }
    }

    // console.debug(name + " not found in VOICENAMES");
    return "images/voices.svg";
};

/**
 * Get the voice synth name based on its identifier.
 * @function
 * @param {string|null} name - The identifier of the voice synth.
 * @returns {string|null} The name of the voice synth, or null if not found.
 */
var getVoiceSynthName = name => {
    if (typeof name !== "string") {
        return null;
    } else if (name === "") {
        name = DEFAULTVOICE;
    } else if (name.slice(0, 4) === "http") {
        return name;
    }

    for (let i = 0; i < VOICENAMES.length; i++) {
        if (VOICENAMES[i][0] === name || VOICENAMES[i][1] === name) {
            return VOICENAMES[i][1];
        }
    }

    // console.debug(name + " not found in VOICENAMES");
    return DEFAULTVOICE;
};

var MusicUtilsLookups = {
    getMidiInstrument,
    getMidiDrum,
    getReverseDrumMidi,
    getInvertMode,
    getIntervalNumber,
    getIntervalDirection,
    getIntervalRatio,
    getDrumIndex,
    getDrumName,
    getDrumSymbol,
    getFilterTypes,
    getOscillatorTypes,
    getDrumIcon,
    getDrumSynthName,
    getNoiseName,
    getNoiseIcon,
    getNoiseSynthName,
    getVoiceName,
    getVoiceIcon,
    getVoiceSynthName
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = MusicUtilsLookups;
}

if (typeof window !== "undefined") {
    window.MusicUtilsLookups = MusicUtilsLookups;
}
