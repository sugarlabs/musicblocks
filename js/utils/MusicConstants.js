/**
 * MusicBlocks v3.6.2
 *
 * @author Jetshree
 *
 * @copyright 2025 Jetshree
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// Accidental symbols (both ASCII and Unicode versions)
global.SHARP = "♯";
global.FLAT = "♭";
global.NATURAL = "♮";
global.DOUBLESHARP = "𝄪";
global.DOUBLEFLAT = "𝄫";

// ASCII variants (used by some tests)
// Override with ASCII symbols if needed before require:
// global.SHARP = "#";
// global.FLAT = "b";
// etc.

// Note names and sequences
global.NOTENAMES = ["C", "D", "E", "F", "G", "A", "B"];
global.NOTENAMES1 = [
    "C",
    "D",
    "E",
    "F",
    "G",
    "A",
    "B",
    "C#",
    "Db",
    "D#",
    "Eb",
    "F#",
    "Gb",
    "G#",
    "Ab",
    "A#",
    "Bb"
];
global.ALLNOTENAMES = [
    "C",
    "C#",
    "Db",
    "D",
    "D#",
    "Eb",
    "E",
    "F",
    "F#",
    "Gb",
    "G",
    "G#",
    "Ab",
    "A",
    "A#",
    "Bb",
    "B"
];
global.NOTESSHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
global.NOTESFLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

// Pitches (12 and 7-note)
global.PITCHES1 = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
global.PITCHES2 = ["A", "A♯", "B", "C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯"];
global.PITCHES3 = ["C", "D", "E", "F", "G", "A", "B"];
global.SCALENOTES = ["C", "D", "E", "F", "G", "A", "B"];

// Solfège names
global.SOLFEGENAMES = ["do", "re", "mi", "fa", "sol", "la", "ti"];
global.SOLFEGENAMES1 = [
    "do",
    "re",
    "mi",
    "fa",
    "sol",
    "la",
    "si",
    "do#",
    "dob",
    "do##",
    "dobb",
    "do##",
    "dobb"
];
global.FIXEDSOLFEGE = { do: "C", re: "D", mi: "E", fa: "F", sol: "G", la: "A", ti: "B" };
global.FIXEDSOLFEGE1 = { do: "C", re: "D", mi: "E", fa: "F", sol: "G", la: "A", si: "B" };

// Musical modes (intervals in semitones)
global.MUSICALMODES = {
    major: [2, 2, 1, 2, 2, 2, 1],
    minor: [2, 1, 2, 2, 1, 2, 2],
    ionian: [2, 2, 1, 2, 2, 2, 1]
};

// Note step mapping (C=0 to B=6 in a scale)
global.NOTESTEP = {
    C: 0,
    D: 1,
    E: 2,
    F: 3,
    G: 4,
    A: 5,
    B: 6
};
global.ALLNOTESTEP = {
    "C": 0,
    "C#": 1,
    "Db": 1,
    "D": 2,
    "D#": 3,
    "Eb": 3,
    "E": 4,
    "F": 5,
    "F#": 6,
    "Gb": 6,
    "G": 7,
    "G#": 8,
    "Ab": 8,
    "A": 9,
    "A#": 10,
    "Bb": 10,
    "B": 11
};

// Interval values (e.g., "major 2" = [2, 1] semitones)
global.INTERVALVALUES = {
    "major 2": [2, 1],
    "major 3": [4, 2],
    "perfect 4": [5, 3],
    "augmented 4": [6, 4],
    "diminished 5": [6, 4],
    "perfect 5": [7, 4],
    "major 6": [9, 5],
    "major 7": [11, 6],
    "octave": [12, 6]
};

// Semitone to interval mapping
global.SEMITONETOINTERVALMAP = Array(13)
    .fill(null)
    .map((_, i) => {
        const intervals = [
            "unison",
            "minor 2",
            "major 2",
            "minor 3",
            "major 3",
            "perfect 4",
            "tritone",
            "perfect 5",
            "minor 6",
            "major 6",
            "minor 7",
            "major 7",
            "octave"
        ];
        return intervals[i] || "unison";
    });

// Semitone constants
global.SEMITONES = {
    "C": 0,
    "C#": 1,
    "Db": 1,
    "D": 2,
    "D#": 3,
    "Eb": 3,
    "E": 4,
    "F": 5,
    "F#": 6,
    "Gb": 6,
    "G": 7,
    "G#": 8,
    "Ab": 8,
    "A": 9,
    "A#": 10,
    "Bb": 10,
    "B": 11
};

// UI/Display constants
global.CENTSSYMBOL = "¢";
global.NATURAL = "♮";

// Mapping for accidental conversions
global.BTOFLAT = {};
global.STOSHARP = {};
global.EQUIVALENTACCIDENTALS = { F: "E♯", C: "B♯", B: "C♭", E: "F♭", G: "F𝄪", D: "C𝄪", A: "G𝄪" };

// Additional error and validation constants
global.INVALIDPITCH = "Invalid pitch";
global.NOINPUTERRORMSG = "No input provided";
global.NANERRORMSG = "Not a number";

// Solfège mapper (12-note solfège names)
global.SOLFMAPPER = ["do", "do", "re", "re", "mi", "fa", "fa", "sol", "sol", "la", "la", "ti"];

// Eastern Indian solfège notes
global.EASTINDIANSOLFNOTES = [];

// Chromatic solfège names
global.CHROMATIC_SOLFEGE = [];

// Interval cents
global.INTERVAL_CENTS = {};

// Temperament intervals
global.TEMPERAMENT_INTERVALS = {};

// Interval order
global.INTERVAL_ORDER = [];

// For compatibility with existing code
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        SHARP: global.SHARP,
        FLAT: global.FLAT,
        NATURAL: global.NATURAL,
        DOUBLESHARP: global.DOUBLESHARP,
        DOUBLEFLAT: global.DOUBLEFLAT,
        NOTENAMES: global.NOTENAMES,
        NOTENAMES1: global.NOTENAMES1,
        ALLNOTENAMES: global.ALLNOTENAMES,
        NOTESSHARP: global.NOTESSHARP,
        NOTESFLAT: global.NOTESFLAT,
        PITCHES1: global.PITCHES1,
        PITCHES2: global.PITCHES2,
        PITCHES3: global.PITCHES3,
        SCALENOTES: global.SCALENOTES,
        SOLFEGENAMES: global.SOLFEGENAMES,
        SOLFEGENAMES1: global.SOLFEGENAMES1,
        FIXEDSOLFEGE: global.FIXEDSOLFEGE,
        FIXEDSOLFEGE1: global.FIXEDSOLFEGE1,
        MUSICALMODES: global.MUSICALMODES,
        NOTESTEP: global.NOTESTEP,
        ALLNOTESTEP: global.ALLNOTESTEP,
        INTERVALVALUES: global.INTERVALVALUES,
        SEMITONETOINTERVALMAP: global.SEMITONETOINTERVALMAP,
        SEMITONES: global.SEMITONES,
        CENTSSYMBOL: global.CENTSSYMBOL,
        BTOFLAT: global.BTOFLAT,
        STOSHARP: global.STOSHARP,
        EQUIVALENTACCIDENTALS: global.EQUIVALENTACCIDENTALS,
        INVALIDPITCH: global.INVALIDPITCH,
        NOINPUTERRORMSG: global.NOINPUTERRORMSG,
        NANERRORMSG: global.NANERRORMSG,
        SOLFMAPPER: global.SOLFMAPPER,
        EASTINDIANSOLFNOTES: global.EASTINDIANSOLFNOTES,
        CHROMATIC_SOLFEGE: global.CHROMATIC_SOLFEGE,
        INTERVAL_CENTS: global.INTERVAL_CENTS,
        TEMPERAMENT_INTERVALS: global.TEMPERAMENT_INTERVALS,
        INTERVAL_ORDER: global.INTERVAL_ORDER
    };
}
