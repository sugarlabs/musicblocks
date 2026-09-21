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

/**
 * Processes musical notes and converts them into ABC notation format.
 * @param {object} logo - The logo object containing notationNotes to update.
 * @param {string} turtle - The identifier for the turtle.
 * @param {string} [keySignature] - the key the tune is written in, e.g. "G major". Staged
 *   pitches are absolute, so this is what the accidentals are written against.
 */
const processABCNotes = function (logo, turtle, keySignature = "C major") {
    // obj = [instructions] or
    // obj = [[notes], duration, dotCount, tupletValue, roundDown,
    //        insideChord, staccato]
    const parts = [];

    const __sameTuplet = (a, b) =>
        Array.isArray(a) && Array.isArray(b) && a[0] === b[0] && a[1] === b[1];

    const __tupletTime = count => 2 ** Math.floor(Math.log2(Math.max(2, count)));

    const __convertDuration = function (duration) {
        const durationMap = {
            64: "1/4",
            32: "1/2",
            16: "1",
            8: "2",
            4: "4",
            2: "8",
            1: "16"
        };
        return durationMap[duration] || duration.toString();
    };

    // The key the notes are written against, and the alteration last written for each
    // pitch, which stays in force: this exporter writes no bar lines to end its reach.
    let { field: keyField, alterations: keyAlterations } = abcKeySignature(keySignature);
    const accidentalsInForce = {};
    // Pitches whose accidental is in doubt, and so must be written out again. ABC readers
    // differ over whether the voices of a tune carry their own accidentals, so after a
    // voice change every accidental still in force is written again for the new voice.
    let pitchesInDoubt = new Set();

    const __voiceChanged = () => {
        pitchesInDoubt = new Set(Object.keys(accidentalsInForce));
    };

    /**
     * Converts a staged pitch name to ABC, writing an accidental wherever the key signature
     * or an accidental still in force would otherwise sound a different pitch.
     * @param {Array} staged - STAGED_PITCH_PATTERN match: letter, accidentals, octave, and
     *   the accidentals of a courtesy natural written after the octave.
     * @returns {string|null} The note in ABC notation, or null for an alteration ABC has no
     *   accidental for, which is left to the caller to write symbol by symbol.
     */
    const __toKeyedABCnote = staged => {
        const letter = staged[1].toUpperCase();
        const symbols = Array.from(staged[2] + staged[4]);
        // A natural cancels the accidentals beside it; anything else adds up. It is written
        // out even where the key calls for nothing, since it was asked for: Music Blocks
        // stages one for the accidental block and for a courtesy natural alike.
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
            alteration !== keyAlterations[letter] ||
            pitchesInDoubt.has(pitch) ||
            (accidentalsInForce[pitch] !== undefined && accidentalsInForce[pitch] !== alteration)
        ) {
            // Written even where one already in force would do, so that the pitch survives
            // bar lines added to the tune later.
            accidental = ALTERATION_ACCIDENTALS[alteration] ?? "";
            accidentalsInForce[pitch] = alteration;
            pitchesInDoubt.delete(pitch);
        }

        // The same octave marks as OCTAVE_NOTATION_MAP, counted out so that an octave
        // outside its range still lands in the right one.
        return (
            accidental +
            (octave >= 5
                ? letter.toLowerCase() + "'".repeat(octave - 5)
                : letter + ",".repeat(4 - octave))
        );
    };

    /**
     * Converts a musical note into ABC notation format.
     * @param {string|number} note - The musical note to convert. It can be a string note (e.g., 'C#') or a frequency (number).
     * @returns {string} The note converted to ABC notation.
     */

    const __toABCnote = note => {
        // beams -- no space between notes
        // ties use ()
        // % comment

        // Abc notes use is for sharp, es for flat,
        // , and ' for shifts in octave.
        // Also, notes must be lowercase.
        // And the octave boundary is at C, not A.

        // Handle frequency conversion
        if (typeof note === "number") {
            const pitchObj = frequencyToPitch(note);
            note = pitchObj[0] + pitchObj[1];
        }

        const staged = String(note).match(STAGED_PITCH_PATTERN);
        const keyed = staged === null ? null : __toKeyedABCnote(staged);
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

        // Handle octave notation
        const match = note.match(/\d+$/);
        const octave = match ? parseInt(match[0], 10) : null;
        if (octave !== null && OCTAVE_NOTATION_MAP[octave] !== undefined) {
            note = note.replace(/\d+$/, OCTAVE_NOTATION_MAP[octave]);
        }

        // Convert case based on octave
        if (octave !== null) {
            return accidental + (octave >= 5 ? note.toLowerCase() : note.toUpperCase());
        } else {
            return (
                accidental +
                (note.includes("'") || note === "" ? note.toLowerCase() : note.toUpperCase())
            );
        }
    };

    let counter = 0;
    let queueSlur = false;
    // Nesting depth of the relative-volume and harmonic blocks around the current note.
    let articulationDepth = 0;
    let harmonicsDepth = 0;
    // Where in parts the most recent note, chord or tuplet starts. Markup is staged right
    // after its note, but ABC wants an annotation in front of the note, so it goes here.
    let lastNoteStart = null;
    // Annotations for the next note: swing, or markup staged before any note.
    let pendingAnnotations = [];
    // Where the decorations written since the last note start. A decoration must be
    // directly followed by its note, so fields staged after one are written before it.
    let prefixStart = null;
    let notes;

    const staging = logo.notation.notationStaging[turtle];

    const __beginNote = () => {
        lastNoteStart = parts.length;
        prefixStart = null;
        parts.push(...pendingAnnotations);
        pendingAnnotations = [];
    };

    const __pushPrefix = decoration => {
        if (prefixStart === null) {
            prefixStart = parts.length;
        }
        parts.push(decoration);
    };

    // Writes a field ahead of any decorations still waiting for their note. A field on
    // its own line gets a line break before it unless one is already there; an empty
    // line would end the tune.
    const __pushField = (field, ownLine = false) => {
        const at = prefixStart === null ? parts.length : prefixStart;
        const written = parts.slice(0, at).join("");
        const insert =
            ownLine && written !== "" && !written.endsWith("\n") ? ["\n", field] : [field];
        parts.splice(at, 0, ...insert);
        if (prefixStart !== null) {
            prefixStart += insert.length;
        }
    };

    // Decorations for a note, or a whole chord, inside open marker blocks.
    const __decorations = () =>
        (articulationDepth > 0 ? "!accent!" : "") + (harmonicsDepth > 0 ? "!open!" : "");

    for (let i = 0; i < logo.notation.notationStaging[turtle].length; i++) {
        const obj = logo.notation.notationStaging[turtle][i];
        if (typeof obj === "string") {
            switch (obj) {
                case "break":
                    // Only end a line that has something on it; an empty line ends the tune.
                    if (i > 0 && parts.join("") !== "" && !parts.join("").endsWith("\n")) {
                        parts.push("\n");
                    }
                    counter = 0;
                    break;
                case "begin articulation":
                    articulationDepth++;
                    break;
                case "end articulation":
                    articulationDepth = Math.max(0, articulationDepth - 1);
                    break;
                case "begin harmonics":
                    harmonicsDepth++;
                    break;
                case "end harmonics":
                    harmonicsDepth = Math.max(0, harmonicsDepth - 1);
                    break;
                case "begin crescendo":
                    __pushPrefix("!<(!");
                    break;
                case "end crescendo":
                    __pushPrefix("!<)!");
                    break;
                case "begin decrescendo":
                    __pushPrefix("!>(!");
                    break;
                case "end decrescendo":
                    __pushPrefix("!>)!");
                    break;
                case "begin slur":
                    queueSlur = true;
                    break;
                case "end slur":
                    parts.push("");
                    break;
                case "tie":
                    parts.push("");
                    break;
                // A field changed mid-tune must be inline ("[Q:1/4=90]") or start its own
                // line; a bare "M:3/4" after a note is not read as a field.
                case "meter":
                    if (Number(staging[i + 1]) > 0 && Number(staging[i + 2]) > 0) {
                        // On its own line rather than inline: abcjs 6.3.0 throws on an
                        // inline [M:] right after switching back to a voice on a later line.
                        __pushField(`M:${staging[i + 1]}/${staging[i + 2]}\n`, true);
                        // The field already ended the line.
                        counter = 0;
                    }
                    i += 2;
                    break;
                case "tempo": {
                    const bpm = staging[i + 1];
                    const lengths = lilypondDurationToAbcLengths(staging[i + 2]);
                    if (lengths !== null && Number(bpm) > 0) {
                        __pushField(`[Q:${lengths}=${bpm}]`);
                    }
                    i += 2;
                    break;
                }
                case "pickup":
                    // This exporter writes no bar lines, so there is no first measure for a
                    // pickup to shorten.
                    i += 1;
                    break;
                case "key": {
                    // Staged pitches are absolute ("F4" is F natural in any key), and so are
                    // written against whichever signature is in force from here on.
                    const changed = abcKeySignature(`${staging[i + 1]} ${staging[i + 2]}`);
                    if (changed.field !== keyField) {
                        __pushField(`[K:${changed.field}]`);
                        keyField = changed.field;
                        keyAlterations = changed.alterations;
                        // Accidentals already written stay in force over the new signature,
                        // so what is in force is still known.
                    }
                    i += 2;
                    break;
                }
                case "markup":
                case "markdown": {
                    const text = staging[i + 1];
                    if (text !== undefined) {
                        const annotation = abcAnnotation(text, obj === "markup" ? "^" : "_");
                        if (lastNoteStart === null) {
                            pendingAnnotations.push(annotation);
                        } else {
                            parts.splice(lastNoteStart, 0, annotation);
                            if (prefixStart !== null) {
                                prefixStart++;
                            }
                        }
                    }
                    i += 1;
                    break;
                }
                case "swing":
                    pendingAnnotations.push(abcAnnotation("swing", "^"));
                    break;
                case "voice one":
                    __pushField("[V:1]");
                    __voiceChanged();
                    break;
                case "voice two":
                    __pushField("[V:2]");
                    __voiceChanged();
                    break;
                case "voice three":
                    __pushField("[V:3]");
                    __voiceChanged();
                    break;
                case "voice four":
                    __pushField("[V:4]");
                    __voiceChanged();
                    break;
                case "one voice":
                    // Return to a single voice
                    __pushField("[V:1]");
                    __voiceChanged();
                    break;
                default:
                    // A marker with no ABC counterpart. Writing it would put its name into
                    // the tune as stray characters.
                    break;
            }
        } else if (Array.isArray(obj)) {
            if (counter % 8 === 0 && counter > 0) {
                parts.push("\n");
            }
            counter += 1;

            notes = typeof obj[NOTATIONNOTE] === "string" ? [obj[NOTATIONNOTE]] : obj[NOTATIONNOTE];
            if (notes.length === 0) {
                notes = ["R"];
            }

            let incompleteTuplet = 0; // An incomplete tuplet

            // If it is a tuplet, look ahead to see if it is complete.
            if (obj[NOTATIONTUPLETVALUE] !== null) {
                let j = 1;
                let k = 1;
                while (k < obj[NOTATIONTUPLETVALUE][0]) {
                    if (i + j >= logo.notation.notationStaging[turtle].length) {
                        incompleteTuplet = j;
                        break;
                    }

                    if (
                        logo.notation.notationStaging[turtle][i + j][NOTATIONINSIDECHORD] > 0 &&
                        logo.notation.notationStaging[turtle][i + j][NOTATIONINSIDECHORD] ===
                            logo.notation.notationStaging[turtle][i + j - 1][NOTATIONINSIDECHORD]
                    ) {
                        // In a chord, so jump to next note.
                        j++;
                    } else if (
                        !__sameTuplet(
                            logo.notation.notationStaging[turtle][i + j][NOTATIONTUPLETVALUE],
                            obj[NOTATIONTUPLETVALUE]
                        )
                    ) {
                        incompleteTuplet = j;
                        break;
                    } else {
                        j++; // Jump to next note.
                        k++; // Increment notes in tuplet.
                    }
                }
            }

            /**
             * Processes an incomplete tuplet and appends the corresponding ABC notation to the notation string.
             * @param {object} logo - The logo object containing notation information.
             * @param {string} turtle - The identifier for the turtle.
             * @param {number} i - The index of the current note within the notation staging.
             * @param {number} count - The number of notes in the incomplete tuplet.
             * @returns {number} The number of notes processed within the tuplet.
             * @private
             */
            const __processTuplet = (logo, turtle, i, count) => {
                let j = 0;
                let k = 0;

                while (k < count) {
                    // const tupletDuration = 2 *
                    //     logo.notation.notationStaging[turtle][i + j][
                    //         NOTATIONDURATION];

                    const tupletNotes = logo.notation.notationStaging[turtle][i + j];

                    if (typeof tupletNotes[NOTATIONNOTE] === "object") {
                        parts.push(__decorations());
                        if (tupletNotes[NOTATIONSTACCATO]) {
                            parts.push(".");
                        }

                        if (tupletNotes[NOTATIONNOTE].length > 1) {
                            parts.push("[");
                        }

                        for (let ii = 0; ii < tupletNotes[NOTATIONNOTE].length; ii++) {
                            parts.push(__toABCnote(tupletNotes[NOTATIONNOTE][ii]));
                        }

                        if (tupletNotes[NOTATIONNOTE].length > 1) {
                            parts.push("]");
                        }

                        parts.push(__convertDuration(tupletNotes[NOTATIONROUNDDOWN]));
                    }
                    j++; // Jump to next note.
                    k++; // Increment notes in tuplet.
                }

                return j;
            };

            if (obj[NOTATIONTUPLETVALUE] !== null) {
                const inTuplet = obj[NOTATIONTUPLETVALUE][0];
                const count = incompleteTuplet === 0 ? inTuplet : incompleteTuplet;

                __beginNote();
                parts.push(
                    "(" +
                        inTuplet +
                        ":" +
                        __tupletTime(inTuplet) +
                        (count === inTuplet ? "" : ":" + count)
                );

                i += Math.max(1, __processTuplet(logo, turtle, i, count)) - 1;
            } else {
                if (obj[NOTATIONINSIDECHORD] <= 0) {
                    __beginNote();
                    parts.push(__decorations());
                    if (obj[NOTATIONSTACCATO]) {
                        parts.push(".");
                    }

                    if (notes.length > 1) {
                        parts.push("[");
                    }

                    for (let ii = 0; ii < notes.length; ii++) {
                        parts.push(__toABCnote(notes[ii]));
                    }

                    if (notes.length > 1) {
                        parts.push("]");
                    }

                    parts.push(__convertDuration(obj[NOTATIONDURATION]));
                    for (let d = 0; d < obj[NOTATIONDOTCOUNT]; d++) {
                        parts.push(".");
                    }
                }

                if (obj[NOTATIONINSIDECHORD] > 0) {
                    // Is logo the first note in the chord?
                    if (
                        i === 0 ||
                        logo.notation.notationStaging[turtle][i - 1][NOTATIONINSIDECHORD] !==
                            obj[NOTATIONINSIDECHORD]
                    ) {
                        // Open the chord.
                        __beginNote();
                        parts.push(__decorations());
                        if (obj[NOTATIONSTACCATO]) {
                            parts.push(".");
                        }

                        parts.push("[");
                    }

                    parts.push(__toABCnote(notes[0]));

                    // Is logo the last note in the chord?
                    if (
                        i === logo.notation.notationStaging[turtle].length - 1 ||
                        logo.notation.notationStaging[turtle][i + 1][NOTATIONINSIDECHORD] !==
                            obj[NOTATIONINSIDECHORD]
                    ) {
                        // Close the chord and add note duration.
                        parts.push("]");
                        parts.push(__convertDuration(obj[NOTATIONDURATION]));
                        for (let d = 0; d < obj[NOTATIONDOTCOUNT]; d++) {
                            parts.push(" ");
                        }

                        parts.push(" ");
                    }
                }
            }

            parts.push(" ");

            if (queueSlur) {
                queueSlur = false;
                parts.push("");
            }
        }
    }

    logo.notationNotes[turtle] = parts.join("");
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
