// Copyright (c) 2017-21 Walter Bender
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

   frequencyToPitch, NOTATIONNOTE, NOTATIONTUPLETVALUE, NOTATIONDURATION,
   NOTATIONROUNDDOWN, NOTATIONINSIDECHORD, NOTATIONDOTCOUNT,
   NOTATIONSTACCATO
*/

/* exported saveAbcOutput */

// This header is prepended to the Abc output.
const ABCHEADER = "X:1\nT:Music Blocks composition\nC:Mr. Mouse\nL:1/16\nM:C\n";
const OCTAVE_NOTATION_MAP = {
    10: "'''''",
    9: "''''",
    8: "'''",
    7: "''",
    6: "'",
    5: "",
    4: "",
    3: ",",
    2: ",,",
    1: ",,,"
};

const ACCIDENTAL_MAP = {
    "𝄪": "^^",
    "♯": "^",
    "#": "^",
    "♮": "=",
    "♭": "_",
    "b": "_",
    "𝄫": "__"
};

const ACCIDENTAL_SYMBOLS = Object.keys(ACCIDENTAL_MAP)
    .map(symbol => symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("");
const PITCH_ACCIDENTAL_PATTERN = new RegExp(`^([A-Ga-g])([${ACCIDENTAL_SYMBOLS}]*)`, "u");
// A staged pitch name: a letter, then accidentals, an octave, and the accidental a courtesy
// natural adds after the octave ("C♯4", "F4♮").
const STAGED_PITCH_PATTERN = new RegExp(
    `^([A-Ga-g])([${ACCIDENTAL_SYMBOLS}]*)(\\d+)([${ACCIDENTAL_SYMBOLS}]*)$`,
    "u"
);

// How many semitones each accidental moves a note.
const ACCIDENTAL_ALTERATIONS = {
    "𝄪": 2,
    "♯": 1,
    "#": 1,
    "♮": 0,
    "♭": -1,
    "b": -1,
    "𝄫": -2
};
const ALTERATION_ACCIDENTALS = { "-2": "__", "-1": "_", "0": "=", "1": "^", "2": "^^" };

// The letters in the order a key signature sharpens them; it flattens them in reverse.
const SHARP_ORDER = "FCGDAEB";
// Where the tonic of a major key sits on the circle of fifths, and how far from that major
// key each mode ABC can name sits on it.
const TONIC_FIFTHS = { F: -1, C: 0, G: 1, D: 2, A: 3, E: 4, B: 5 };
const ABC_MODES = {
    "lydian": ["Lyd", 1],
    "major": ["", 0],
    "ionian": ["", 0],
    "mixolydian": ["Mix", -1],
    "dorian": ["Dor", -2],
    "m": ["m", -3],
    "minor": ["m", -3],
    "natural minor": ["m", -3],
    "aeolian": ["m", -3],
    "ethiopian": ["m", -3],
    "geez": ["m", -3],
    "phrygian": ["Phr", -4],
    "locrian": ["Loc", -5]
};
// "B ♭ major" as well as "B♭ major" and "Bbm"; "b" is only a flat where a mode name such as
// "bebop" cannot start instead.
const KEY_SIGNATURE_PATTERN = /^([A-Ga-g])\s*(b(?![A-Za-z])|[♯♭𝄪𝄫#])?\s*(.*)$/u;

/**
 * Reads a Music Blocks key signature as an ABC one.
 *
 * Music Blocks has far more modes than ABC can name. A mode ABC does not know is written
 * with the signature of the major or minor key on the same tonic -- the one its own name
 * points at -- and every note the mode alters carries an accidental, so the pitches sound
 * right whichever signature is printed.
 * @param {string} keySignature - e.g. "C major", "B♭ dorian", "G harmonic minor".
 * @returns {{field: string, alterations: object}} the text of an ABC K: field, and the
 *   alteration in semitones that signature applies to each of the seven letters.
 */
const abcKeySignature = keySignature => {
    const text = String(keySignature ?? "").trim();
    // "Cm" and "B♭m" are that tonic's minor, as they are to keySignatureToMode().
    const minor = /^([A-Ga-g](?:b|#|♭|♯|𝄪|𝄫)?)m$/u.exec(text);
    const match = KEY_SIGNATURE_PATTERN.exec(minor === null ? text : `${minor[1]} minor`);
    const alterations = {};
    for (const letter of SHARP_ORDER) alterations[letter] = 0;
    if (match === null) {
        // Music Blocks reads a key it cannot parse as C major, which alters nothing.
        return { field: "C", alterations };
    }

    const tonic = match[1].toUpperCase() + (match[2] === "b" ? "♭" : (match[2] ?? ""));
    const mode = match[3].trim().toLowerCase();
    const named = ABC_MODES[mode] ?? ABC_MODES[mode.includes("minor") ? "minor" : "major"];
    // Sharps (or, negative, flats) in the signature.
    const fifths =
        TONIC_FIFTHS[match[1].toUpperCase()] +
        7 * (ACCIDENTAL_ALTERATIONS[match[2]] ?? 0) +
        named[1];
    if (fifths < -7 || fifths > 7) {
        // A signature this far around the circle of fifths (A♯ major, say) needs more than
        // the seven accidentals ABC can print. "none" prints no signature at all.
        return { field: "none", alterations };
    }

    for (let i = 0; i < SHARP_ORDER.length; i++) {
        // The signature sharpens SHARP_ORDER[i] once it holds more than i sharps.
        alterations[SHARP_ORDER[i]] = Math.floor((fifths - i + 6) / 7);
    }
    return { field: tonic.replace("♭", "b").replace("♯", "#") + named[0], alterations };
};

/**
 * Converts a LilyPond duration, the form notation.js stages tempo beats in (convertFactor()
 * in js/utils/musicutils.js), to the note lengths an ABC Q: field adds up.
 * @param {string} duration - space-separated note values, each optionally dotted,
 *   e.g. "4", "4.", "4 16".
 * @returns {string|null} e.g. "1/4", "3/8", "1/4 1/16"; null if not in that form.
 */
const lilypondDurationToAbcLengths = duration => {
    const lengths = [];
    for (const token of String(duration).trim().split(/\s+/)) {
        const match = /^(\d+)(\.*)$/.exec(token);
        if (match === null || Number(match[1]) === 0) return null;
        // A note value n with d dots lasts (2^(d+1) - 1) / (n * 2^d) of a whole note.
        const dots = match[2].length;
        lengths.push(`${2 ** (dots + 1) - 1}/${Number(match[1]) * 2 ** dots}`);
    }
    return lengths.join(" ");
};

/**
 * Formats text as an ABC annotation. abcjs has no escape for "%" (it always starts a
 * comment) and reads "\" before the closing quote as escaping it, so both are written as
 * their fullwidth forms; double quotes are escaped and line breaks become spaces.
 * @param {string|number} text
 * @param {string} placement - "^" above the staff, "_" below it.
 * @returns {string}
 */
const abcAnnotation = (text, placement) =>
    `"${placement}${String(text)
        .replace(/%/g, "\uFF05")
        .replace(/\\/g, "\uFF3C")
        .replace(/"/g, '\\"')
        .replace(/[\r\n]+/g, " ")}"`;

/**
 * Returns the header string used for the ABC notation output.
 * The ABC header includes metadata for a music composition.
 * @returns {string} The ABC header string.
 */
const getABCHeader = function () {
    return ABCHEADER;
};

const isSameTuplet = (a, b) =>
    Array.isArray(a) && Array.isArray(b) && a[0] === b[0] && a[1] === b[1];

const getTupletTime = count => 2 ** Math.floor(Math.log2(Math.max(2, count)));

const convertDuration = function (duration, dotCount = 0) {
    if (isNaN(Number(duration))) return duration.toString();

    let num = 16 * (2 ** (dotCount + 1) - 1);
    let den = Number(duration) * 2 ** dotCount;

    const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
    const d = gcd(Math.abs(num), Math.abs(den));
    num /= d;
    den /= d;

    if (den === 1) return num.toString();
    if (num === 1) return `1/${den}`;
    return `${num}/${den}`;
};

class AbcExporter {
    constructor(logo, turtle, keySignature) {
        this.logo = logo;
        this.turtle = turtle;
        this.keySignature = keySignature;
        this.staging = logo.notation.notationStaging[turtle] || [];

        this.parts = [];
        this.counter = 0;
        this.articulationDepth = 0;
        this.harmonicsDepth = 0;
        this.lastNoteStart = null;
        this.pendingAnnotations = [];
        this.prefixStart = null;

        const { field: keyField, alterations: keyAlterations } = abcKeySignature(keySignature);
        this.keyField = keyField;
        this.keyAlterations = keyAlterations;
        this.accidentalsInForce = {};
        this.pitchesInDoubt = new Set();
    }

    __voiceChanged() {
        this.pitchesInDoubt = new Set(Object.keys(this.accidentalsInForce));
    }

    __toKeyedABCnote(staged) {
        const letter = staged[1].toUpperCase();
        const symbols = Array.from(staged[2] + staged[4]);
        const courtesy = symbols.includes("♮");
        const alteration = courtesy
            ? 0
            : symbols.reduce((sum, symbol) => sum + ACCIDENTAL_ALTERATIONS[symbol], 0);

        if (!(alteration in ALTERATION_ACCIDENTALS)) {
            return null;
        }

        const octave = parseInt(staged[3], 10);
        const pitch = letter + octave;
        let accidental = "";
        if (
            courtesy ||
            alteration !== this.keyAlterations[letter] ||
            this.pitchesInDoubt.has(pitch) ||
            (this.accidentalsInForce[pitch] !== undefined &&
                this.accidentalsInForce[pitch] !== alteration)
        ) {
            accidental = ALTERATION_ACCIDENTALS[alteration] ?? "";
            this.accidentalsInForce[pitch] = alteration;
            this.pitchesInDoubt.delete(pitch);
        }

        return (
            accidental +
            (octave >= 5
                ? letter.toLowerCase() + "'".repeat(octave - 5)
                : letter + ",".repeat(4 - octave))
        );
    }

    __toABCnote(note) {
        if (note === "R" || note === "r") return "z";

        if (typeof note === "number") {
            const pitchObj = frequencyToPitch(note);
            note = pitchObj[0] + pitchObj[1];
        }

        const staged = String(note).match(STAGED_PITCH_PATTERN);
        const keyed = staged === null ? null : this.__toKeyedABCnote(staged);
        if (keyed !== null) {
            return keyed;
        }

        const pitchMatch = note.match(PITCH_ACCIDENTAL_PATTERN);
        const accidentalSymbols = pitchMatch ? pitchMatch[2] : "";
        const accidental = accidentalSymbols
            ? Array.from(accidentalSymbols)
                  .map(symbol => ACCIDENTAL_MAP[symbol])
                  .join("")
            : "";
        if (accidentalSymbols) {
            note = note.replace(accidentalSymbols, "");
        }

        const match = note.match(/\d+$/);
        const octave = match ? parseInt(match[0], 10) : null;
        if (octave !== null && OCTAVE_NOTATION_MAP[octave] !== undefined) {
            note = note.replace(/\d+$/, OCTAVE_NOTATION_MAP[octave]);
        }

        if (octave !== null) {
            return accidental + (octave >= 5 ? note.toLowerCase() : note.toUpperCase());
        } else {
            return (
                accidental +
                (note.includes("'") || note === "" ? note.toLowerCase() : note.toUpperCase())
            );
        }
    }

    __beginNote() {
        this.lastNoteStart = this.parts.length;
        this.prefixStart = null;
        this.parts.push(...this.pendingAnnotations);
        this.pendingAnnotations = [];
    }

    __pushPrefix(decoration) {
        if (this.prefixStart === null) {
            this.prefixStart = this.parts.length;
        }
        this.parts.push(decoration);
    }

    __pushField(field, ownLine = false) {
        const at = this.prefixStart === null ? this.parts.length : this.prefixStart;
        const written = this.parts.slice(0, at).join("");
        const insert =
            ownLine && written !== "" && !written.endsWith("\n") ? ["\n", field] : [field];
        this.parts.splice(at, 0, ...insert);
        if (this.prefixStart !== null) {
            this.prefixStart += insert.length;
        }
    }

    __decorations() {
        return (
            (this.articulationDepth > 0 ? "!accent!" : "") +
            (this.harmonicsDepth > 0 ? "!open!" : "")
        );
    }

    processStringMarker(obj, i) {
        switch (obj) {
            case "break":
                if (i > 0 && this.parts.join("") !== "" && !this.parts.join("").endsWith("\n")) {
                    this.parts.push("\n");
                }
                this.counter = 0;
                break;
            case "begin articulation":
                this.articulationDepth++;
                break;
            case "end articulation":
                this.articulationDepth = Math.max(0, this.articulationDepth - 1);
                break;
            case "begin harmonics":
                this.harmonicsDepth++;
                break;
            case "end harmonics":
                this.harmonicsDepth = Math.max(0, this.harmonicsDepth - 1);
                break;
            case "begin crescendo":
                this.__pushPrefix("!<(!");
                break;
            case "end crescendo":
                this.__pushPrefix("!<)!");
                break;
            case "begin decrescendo":
                this.__pushPrefix("!>(!");
                break;
            case "end decrescendo":
                this.__pushPrefix("!>)!");
                break;
            case "begin slur":
                if (this.lastNoteStart !== null) {
                    this.parts.splice(this.lastNoteStart, 0, "(");
                    if (this.prefixStart !== null) this.prefixStart++;
                }
                break;
            case "end slur":
                this.parts.push(")");
                break;
            case "tie":
                this.parts.push("-");
                break;
            case "meter":
                if (Number(this.staging[i + 1]) > 0 && Number(this.staging[i + 2]) > 0) {
                    this.__pushField(`M:${this.staging[i + 1]}/${this.staging[i + 2]}\n`, true);
                    this.counter = 0;
                }
                i += 2;
                break;
            case "tempo": {
                const bpm = this.staging[i + 1];
                const lengths = lilypondDurationToAbcLengths(this.staging[i + 2]);
                if (lengths !== null && Number(bpm) > 0) {
                    this.__pushField(`[Q:${lengths}=${bpm}]`);
                }
                i += 2;
                break;
            }
            case "pickup":
                i += 1;
                break;
            case "key": {
                const changed = abcKeySignature(`${this.staging[i + 1]} ${this.staging[i + 2]}`);
                if (changed.field !== this.keyField) {
                    this.__pushField(`[K:${changed.field}]`);
                    this.keyField = changed.field;
                    this.keyAlterations = changed.alterations;
                }
                i += 2;
                break;
            }
            case "markup":
            case "markdown": {
                const text = this.staging[i + 1];
                if (text !== undefined) {
                    const annotation = abcAnnotation(text, obj === "markup" ? "^" : "_");
                    if (this.lastNoteStart === null) {
                        this.pendingAnnotations.push(annotation);
                    } else {
                        this.parts.splice(this.lastNoteStart, 0, annotation);
                        if (this.prefixStart !== null) {
                            this.prefixStart++;
                        }
                    }
                }
                i += 1;
                break;
            }
            case "swing":
                this.pendingAnnotations.push(abcAnnotation("swing", "^"));
                break;
            case "voice one":
                this.__pushField("[V:1]");
                this.__voiceChanged();
                break;
            case "voice two":
                this.__pushField("[V:2]");
                this.__voiceChanged();
                break;
            case "voice three":
                this.__pushField("[V:3]");
                this.__voiceChanged();
                break;
            case "voice four":
                this.__pushField("[V:4]");
                this.__voiceChanged();
                break;
            case "one voice":
                this.__pushField("[V:1]");
                this.__voiceChanged();
                break;
            default:
                break;
        }
        return i;
    }

    processTupletNotes(i, count) {
        let j = 0;
        let k = 0;

        while (k < count) {
            const tupletNotes = this.staging[i + j];

            if (typeof tupletNotes[NOTATIONNOTE] === "object") {
                this.parts.push(this.__decorations());
                if (tupletNotes[NOTATIONSTACCATO]) {
                    this.parts.push(".");
                }

                if (tupletNotes[NOTATIONNOTE].length > 1) {
                    this.parts.push("[");
                }

                for (let ii = 0; ii < tupletNotes[NOTATIONNOTE].length; ii++) {
                    this.parts.push(this.__toABCnote(tupletNotes[NOTATIONNOTE][ii]));
                }

                if (tupletNotes[NOTATIONNOTE].length > 1) {
                    this.parts.push("]");
                }

                this.parts.push(
                    convertDuration(
                        tupletNotes[NOTATIONROUNDDOWN],
                        tupletNotes[NOTATIONDOTCOUNT] || 0
                    )
                );
            }
            j++;
            k++;
        }

        return j;
    }

    processNoteArray(obj, i) {
        const inChordContinuation =
            obj[NOTATIONINSIDECHORD] > 0 &&
            i > 0 &&
            Array.isArray(this.staging[i - 1]) &&
            this.staging[i - 1][NOTATIONINSIDECHORD] === obj[NOTATIONINSIDECHORD];

        if (this.counter % 8 === 0 && this.counter > 0 && !inChordContinuation) {
            this.parts.push("\n");
        }
        if (!inChordContinuation) {
            this.counter += 1;
        }

        let notes = typeof obj[NOTATIONNOTE] === "string" ? [obj[NOTATIONNOTE]] : obj[NOTATIONNOTE];
        if (notes.length === 0) {
            notes = ["R"];
        }

        let incompleteTuplet = 0;

        if (obj[NOTATIONTUPLETVALUE] !== null) {
            let j = 1;
            let k = 1;
            while (k < obj[NOTATIONTUPLETVALUE][0]) {
                if (i + j >= this.staging.length) {
                    incompleteTuplet = j;
                    break;
                }

                if (
                    this.staging[i + j][NOTATIONINSIDECHORD] > 0 &&
                    this.staging[i + j][NOTATIONINSIDECHORD] ===
                        this.staging[i + j - 1][NOTATIONINSIDECHORD]
                ) {
                    j++;
                } else if (
                    !isSameTuplet(
                        this.staging[i + j][NOTATIONTUPLETVALUE],
                        obj[NOTATIONTUPLETVALUE]
                    )
                ) {
                    incompleteTuplet = j;
                    break;
                } else {
                    j++;
                    k++;
                }
            }
        }

        if (obj[NOTATIONTUPLETVALUE] !== null) {
            const inTuplet = obj[NOTATIONTUPLETVALUE][0];
            const count = incompleteTuplet === 0 ? inTuplet : incompleteTuplet;

            this.__beginNote();
            this.parts.push(
                "(" +
                    inTuplet +
                    ":" +
                    getTupletTime(inTuplet) +
                    (count === inTuplet ? "" : ":" + count)
            );

            i += Math.max(1, this.processTupletNotes(i, count)) - 1;
        } else {
            if (obj[NOTATIONINSIDECHORD] <= 0) {
                this.__beginNote();
                this.parts.push(this.__decorations());
                if (obj[NOTATIONSTACCATO]) {
                    this.parts.push(".");
                }

                if (notes.length > 1) {
                    this.parts.push("[");
                }

                for (let ii = 0; ii < notes.length; ii++) {
                    this.parts.push(this.__toABCnote(notes[ii]));
                }

                if (notes.length > 1) {
                    this.parts.push("]");
                }

                this.parts.push(convertDuration(obj[NOTATIONDURATION], obj[NOTATIONDOTCOUNT]));
            }

            if (obj[NOTATIONINSIDECHORD] > 0) {
                if (
                    i === 0 ||
                    this.staging[i - 1][NOTATIONINSIDECHORD] !== obj[NOTATIONINSIDECHORD]
                ) {
                    this.__beginNote();
                    this.parts.push(this.__decorations());
                    if (obj[NOTATIONSTACCATO]) {
                        this.parts.push(".");
                    }
                    this.parts.push("[");
                }

                this.parts.push(this.__toABCnote(notes[0]));

                if (
                    i === this.staging.length - 1 ||
                    this.staging[i + 1][NOTATIONINSIDECHORD] !== obj[NOTATIONINSIDECHORD]
                ) {
                    this.parts.push("]");
                    this.parts.push(convertDuration(obj[NOTATIONDURATION], obj[NOTATIONDOTCOUNT]));
                }
            }
        }

        this.parts.push(" ");
        return i;
    }

    process() {
        for (let i = 0; i < this.staging.length; i++) {
            const obj = this.staging[i];
            if (typeof obj === "string") {
                i = this.processStringMarker(obj, i);
            } else if (Array.isArray(obj)) {
                i = this.processNoteArray(obj, i);
            }
        }
        this.logo.notationNotes[this.turtle] = this.parts.join("");
    }
}

/**
 * Processes musical notes and converts them into ABC notation format.
 * @param {object} logo - The logo object containing notationNotes to update.
 * @param {string} turtle - The identifier for the turtle.
 * @param {string} [keySignature] - the key the tune is written in, e.g. "G major". Staged
 *   pitches are absolute, so this is what the accidentals are written against.
 */
const processABCNotes = function (logo, turtle, keySignature = "C major") {
    new AbcExporter(logo, turtle, keySignature).process();
};

/**
 * Generates ABC notation output based on the notation staging for each turtle in the activity.
 * @param {object} activity - The activity object containing logo and notation information.
 * @returns {string} The generated ABC notation output.
 */
const saveAbcOutput = function (activity) {
    const outputParts = [getABCHeader()];

    for (const t in activity.logo.notation.notationStaging) {
        const keySignature = activity.turtles.ithTurtle(t).singer.keySignature;
        outputParts.push("K:" + abcKeySignature(keySignature).field + "\n");
        processABCNotes(activity.logo, t, keySignature);
        outputParts.push(activity.logo.notationNotes[t]);
    }

    outputParts.push("\n");
    activity.logo.notationOutput = outputParts.join("");
    return activity.logo.notationOutput;
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        getABCHeader,
        processABCNotes,
        saveAbcOutput,
        abcKeySignature,
        ACCIDENTAL_MAP,
        OCTAVE_NOTATION_MAP
    };
}

if (typeof window !== "undefined") {
    window.saveAbcOutput = saveAbcOutput;
    window.processABCNotes = processABCNotes;
    window.getABCHeader = getABCHeader;
}
