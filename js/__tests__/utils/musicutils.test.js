/**
 * MusicBlocks v3.6.2
 *
 * @author OpenAI
 *
 * @copyright 2026 OpenAI
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const util = require("util");
const { createInstrumenter } = require("istanbul-lib-instrument");

global._ = jest.fn(str => str);
global.window = {
    btoa: jest.fn(str => Buffer.from(str, "utf8").toString("base64"))
};
global.TextEncoder = util.TextEncoder;
global.INVALIDPITCH = "Not a valid pitch name";

const createMusicutilsContext = () => {
    const sourcePath = path.resolve(__dirname, "../../utils/musicutils.js");
    const source = fs.readFileSync(sourcePath, "utf8");
    const exportSnippet = `
module.exports = {
    NOTENAMES,
    SOLFEGENAMES1,
    ALLNOTENAMES,
    NOTENAMES1,
    PITCHES1,
    PITCHES3,
    MUSICALMODES,
    getScaleAndHalfSteps,
    scaleDegreeToPitchMapping,
    modeMapper,
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
    getVoiceSynthName,
    getTemperamentName,
    keySignatureToMode,
    getCustomNote
};
`;
    const instrumenter = createInstrumenter({ coverageVariable: "__coverage__" });
    const instrumentedSource = instrumenter.instrumentSync(
        `${source}\n${exportSnippet}`,
        sourcePath
    );

    const sandbox = {
        module: { exports: {} },
        exports: {},
        require,
        console,
        __coverage__: global.__coverage__,
        TextEncoder: util.TextEncoder,
        window: {
            btoa: jest.fn(str => Buffer.from(str, "utf8").toString("base64"))
        },
        _: jest.fn(str => str),
        last: jest.fn(arr => arr[arr.length - 1]),
        DRUMNAMES: [],
        NOISENAMES: [],
        VOICENAMES: [],
        CUSTOMSAMPLES: [],
        INVALIDPITCH: "Not a valid pitch name"
    };

    vm.createContext(sandbox);
    vm.runInContext(instrumentedSource, sandbox, { filename: sourcePath });

    return { musicutils: sandbox.module.exports, sandbox };
};

describe("musicutils core constants", () => {
    const {
        musicutils: {
            NOTENAMES,
            SOLFEGENAMES1,
            ALLNOTENAMES,
            NOTENAMES1,
            PITCHES1,
            PITCHES3,
            MUSICALMODES
        }
    } = createMusicutilsContext();

    it("keeps NOTENAMES as the seven natural note letters", () => {
        expect(NOTENAMES).toEqual(["C", "D", "E", "F", "G", "A", "B"]);
    });

    it("keeps the expected solfege base syllables in SOLFEGENAMES1", () => {
        const baseSolfegeNames = [
            ...new Set(SOLFEGENAMES1.map(name => name.replace(/[♯♭𝄪𝄫]/gu, "")))
        ];

        expect(baseSolfegeNames).toEqual(["do", "re", "mi", "fa", "sol", "la", "ti"]);
    });

    it("preserves the first and last entries for NOTENAMES and SOLFEGENAMES1", () => {
        expect(NOTENAMES[0]).toBe("C");
        expect(NOTENAMES[NOTENAMES.length - 1]).toBe("B");
        expect(SOLFEGENAMES1[0]).toBe("do");
        expect(SOLFEGENAMES1[SOLFEGENAMES1.length - 1]).toBe("ti");
    });

    it("includes sharps, flats, and double accidentals in ALLNOTENAMES", () => {
        expect(ALLNOTENAMES).toEqual(expect.arrayContaining(["C#", "Db", "Cx", "Dbb", "Fx", "Cb"]));
    });

    it("keeps note and pitch collections as non-empty arrays of strings", () => {
        [NOTENAMES, ALLNOTENAMES, NOTENAMES1, PITCHES1, PITCHES3].forEach(collection => {
            expect(Array.isArray(collection)).toBe(true);
            expect(collection.length).toBeGreaterThan(0);
            expect(collection.every(item => typeof item === "string")).toBe(true);
        });
    });

    it("keeps major and minor mode definitions at seven steps and one octave", () => {
        expect(MUSICALMODES.major).toHaveLength(7);
        expect(MUSICALMODES.minor).toHaveLength(7);
        expect(MUSICALMODES.major.reduce((sum, step) => sum + step, 0)).toBe(12);
        expect(MUSICALMODES.minor.reduce((sum, step) => sum + step, 0)).toBe(12);
    });
});

describe("musicutils mode utilities", () => {
    const {
        musicutils: { getScaleAndHalfSteps, scaleDegreeToPitchMapping, modeMapper }
    } = createMusicutilsContext();

    it("builds chromatic half-step solfege with accidentals", () => {
        expect(getScaleAndHalfSteps("C chromatic")).toEqual([
            ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"],
            ["do", "do♯", "re", "re♯", "mi", "fa", "fa♯", "sol", "sol♯", "la", "la♯", "ti"],
            "C",
            "chromatic"
        ]);
    });

    it("builds pentatonic half-step solfege without duplicate syllables", () => {
        expect(getScaleAndHalfSteps("C major pentatonic")).toEqual([
            ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"],
            ["do", "", "re", "", "mi", "", "", "sol", "", "la", "", ""],
            "C",
            "major pentatonic"
        ]);
    });

    it("maps scale degrees and pitches for chromatic fallback selection", () => {
        expect(scaleDegreeToPitchMapping("C chromatic", 1, false, null)).toBe("C");
        expect(scaleDegreeToPitchMapping("C chromatic", 4, false, null)).toBe("F");
        expect(scaleDegreeToPitchMapping("C chromatic", null, false, "C#")).toEqual(["1"]);
        expect(scaleDegreeToPitchMapping("C chromatic", null, false, "F#")).toEqual(["4"]);
    });

    it("maps scale degrees and pitches for pentatonic fallback selection", () => {
        expect(scaleDegreeToPitchMapping("C major pentatonic", 4, false, null)).toBe("F");
        expect(scaleDegreeToPitchMapping("C major pentatonic", 6, false, null)).toBe("A");
        expect(scaleDegreeToPitchMapping("C major pentatonic", null, false, "A")).toEqual([
            "6",
            "♮"
        ]);
        expect(scaleDegreeToPitchMapping("C major pentatonic", null, false, "B♭")).toEqual([
            "7",
            "♭"
        ]);
    });

    it.each([
        ["C♯", "dorian", ["b", "major"]],
        ["D♭", "dorian", ["e♭", "minor"]],
        ["A♯", "dorian", ["g♯", "major"]],
        ["G♭", "dorian", ["d", "minor"]],
        ["C♯", "phrygian", ["a", "major"]],
        ["A♭", "phrygian", ["d♭", "minor"]],
        ["F", "phrygian", ["b", "major"]],
        ["B♭", "phrygian", ["e♭", "minor"]],
        ["C♯", "lydian", ["g♯", "major"]],
        ["G♯", "lydian", ["c", "minor"]],
        ["D♭", "lydian", ["f", "minor"]],
        ["B♭", "lydian", ["d", "minor"]],
        ["D♯", "mixolydian", ["g♯", "major"]],
        ["A♯", "mixolydian", ["c", "minor"]],
        ["E♭", "mixolydian", ["f", "minor"]],
        ["B♭", "mixolydian", ["c", "minor"]],
        ["C♯", "locrian", ["d", "major"]],
        ["E♭", "locrian", ["d♭", "minor"]],
        ["G♭", "locrian", ["f", "minor"]],
        ["A♭", "locrian", ["g♭", "minor"]]
    ])("maps %s %s to %j", (key, mode, expected) => {
        expect(modeMapper(key, mode)).toEqual(expected);
    });
});

describe("musicutils lookup utilities", () => {
    let musicutils;
    let sandbox;

    beforeEach(() => {
        ({ musicutils, sandbox } = createMusicutilsContext());

        sandbox.DEFAULTDRUM = "kick drum";
        sandbox.DRUMNAMES = [
            ["snare drum", "snare", "images/snare.svg", "sn"],
            ["kick drum", "kick", "images/kick.svg", "kk"],
            ["hi hat", "hi hat", "images/hihat.svg", "hh"]
        ];
        sandbox.DEFAULTFILTERTYPE = "highpass";
        sandbox.FILTERTYPES = [
            ["highpass", "highpass"],
            ["bandpass", "bandpass"],
            ["lowpass", "lowpass"]
        ];
        sandbox.OSCTYPES = [
            ["sine", "sine"],
            ["triangle", "triangle"]
        ];
        sandbox.DEFAULTNOISE = "noise1";
        sandbox.NOISENAMES = [
            ["white noise", "noise1", "images/noise1.svg"],
            ["", "custom noise", "images/custom.svg"]
        ];
        sandbox.DEFAULTVOICE = "electronic synth";
        sandbox.VOICENAMES = [
            ["piano", "piano", "images/piano.svg"],
            ["electronic synth", "synth", "images/synth.svg"],
            ["", "custom voice", "images/customvoice.svg"]
        ];
        sandbox.CUSTOMSAMPLES = [["customSample", "sample-id", "images/sample.svg"]];
        sandbox.DEFAULTTEMPERAMENT = "equal";
        sandbox.TEMPERAMENTS = [
            ["Equal", "equal"],
            ["Just", "just"]
        ];
    });

    it("resolves drum metadata from defaults, aliases, urls, and fallbacks", () => {
        expect(musicutils.getDrumIndex("")).toBe(1);
        expect(musicutils.getDrumIndex("http://example.com")).toBe(1);
        expect(musicutils.getDrumName("kick")).toBe("kick");
        expect(musicutils.getDrumSymbol("kick")).toBe("hh");
        expect(musicutils.getDrumIcon("http://example.com")).toBe("images/drum.svg");
        expect(musicutils.getDrumSynthName("unknown")).toBe("kick drum");
        expect(musicutils.getDrumSynthName("http://example.com")).toBe("http://example.com");
    });

    it("resolves filter and oscillator lookups through their fallback branches", () => {
        expect(musicutils.getFilterTypes("nope")).toBe("highpass");
        expect(() => musicutils.getOscillatorTypes("")).toThrow(
            "Cannot read properties of null (reading 'toLowerCase')"
        );
    });

    it("resolves noise lookups through custom, url, and fallback branches", () => {
        expect(musicutils.getNoiseName("custom noise")).toBe("custom noise");
        expect(musicutils.getNoiseIcon("http://example.com")).toBe("images/noises.svg");
        expect(musicutils.getNoiseSynthName("unknown")).toBe("noise1");
    });

    it("resolves voice lookups through custom sample and fallback branches", () => {
        expect(musicutils.getVoiceName("custom voice")).toBe("electronic synth");
        expect(musicutils.getVoiceIcon("sample-id")).toBe("customSample");
        expect(musicutils.getVoiceIcon("http://example.com")).toBe("images/voices.svg");
        expect(musicutils.getVoiceSynthName("unknown")).toBe("electronic synth");
        expect(musicutils.getVoiceSynthName("http://example.com")).toBe("http://example.com");
    });

    it("falls back to the default temperament name for unknown values", () => {
        expect(musicutils.getTemperamentName("nope")).toBe("equal");
    });
});

describe("musicutils key parsing and custom note formatting", () => {
    let musicutils;
    let sandbox;

    beforeEach(() => {
        ({ musicutils, sandbox } = createMusicutilsContext());

        sandbox.MAQAMTABLE = { "hijaz kar": "C maqam" };
        sandbox.BTOFLAT = { Bb: "B♭" };
        sandbox.STOSHARP = { "C#": "C♯" };
        sandbox.FLAT = "♭";
        sandbox.SHARP = "♯";
        sandbox.SOLFEGENAMES1 = ["do", "re", "mi", "fa", "sol", "la", "ti"];
        sandbox.NOTESSHARP = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
        sandbox.NOTESFLAT = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
    });

    it("handles maqam names, shorthand minor keys, and invalid key signatures", () => {
        expect(musicutils.keySignatureToMode("hijaz kar")).toEqual(["C", "maqam"]);
        expect(musicutils.keySignatureToMode("Am")).toEqual(["A", "natural minor"]);
        expect(musicutils.keySignatureToMode("nonsense")).toEqual(["C", "major"]);
    });

    it("formats custom notes with flats, sharps, cents, and array inputs", () => {
        expect(musicutils.getCustomNote("Cbb")).toBe("C𝄫");
        expect(musicutils.getCustomNote("F#(23)")).toBe("F♯(23)");
        expect(musicutils.getCustomNote("Gx")).toBe("G𝄪");
    });
});
