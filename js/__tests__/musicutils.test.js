/**
 * Tests for musicutils.js — temperament-aware pitch utilities.
 *
 * Covers getNumNote, pitchToFrequency, noteToFrequency, isInt, and toFraction.
 * Also documents the expected behaviour of getNumNote once the non-12-EDO
 * temperament fix is applied (PR: fix getNumNote to respect active temperament).
 */

// ---------------------------------------------------------------------------
// Global mocks required by musicutils.js before it can be loaded
// ---------------------------------------------------------------------------
global._ = str => str;
global.last = arr => arr[arr.length - 1];
global.INVALIDPITCH = -1;
global.DRUMNAMES = [];
global.NOISENAMES = [];
global.VOICENAMES = [];
global.CUSTOMSAMPLES = {};
global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;

const {
    getNumNote,
    pitchToFrequency,
    noteToFrequency,
    isInt,
    toFraction,
} = require("../utils/musicutils");

// ---------------------------------------------------------------------------
// getNumNote — 12-EDO default behaviour must stay unchanged
// ---------------------------------------------------------------------------
describe("getNumNote — 12-EDO default", () => {
    test("step 10 delta 0 returns la at octave 1", () => {
        const [note, octave] = getNumNote(10, 0);
        expect(note).toBe("la");
        expect(octave).toBe(1);
    });

    test("step 8 delta 0 returns sol at octave 1", () => {
        const [note, octave] = getNumNote(8, 0);
        expect(note).toBe("sol");
        expect(octave).toBe(1);
    });

    test("step 12 delta 0 wraps to octave 2", () => {
        const [, octave] = getNumNote(12, 0);
        expect(octave).toBe(2);
    });

    test("step 24 delta 0 wraps to octave 3", () => {
        const [, octave] = getNumNote(24, 0);
        expect(octave).toBe(3);
    });

    test("step 0 delta 0 returns a non-empty string", () => {
        const [note] = getNumNote(0, 0);
        expect(typeof note).toBe("string");
        expect(note.length).toBeGreaterThan(0);
    });

    test("step 1 delta 0 returns a valid solfege note", () => {
        const [note, octave] = getNumNote(1, 0);
        expect(typeof note).toBe("string");
        expect(note.length).toBeGreaterThan(0);
        expect(typeof octave).toBe("number");
    });

    test("delta shifts note by the correct amount", () => {
        const [note1] = getNumNote(5, 1);
        const [note2] = getNumNote(6, 0);
        expect(note1).toBe(note2);
    });

    test("delta 2 shifts note same as adding 2 to value", () => {
        const [note1] = getNumNote(3, 2);
        const [note2] = getNumNote(5, 0);
        expect(note1).toBe(note2);
    });
});

// ---------------------------------------------------------------------------
// getNumNote — temperament fallback behaviour
// ---------------------------------------------------------------------------
describe("getNumNote — temperament fallback", () => {
    test("unknown temperament string falls back to 12-EDO", () => {
        const [noteUnknown, octaveUnknown] = getNumNote(12, 0, "nonexistentEDO");
        const [noteDefault, octaveDefault] = getNumNote(12, 0);
        expect(noteUnknown).toBe(noteDefault);
        expect(octaveUnknown).toBe(octaveDefault);
    });

    test("undefined temperament behaves same as omitting the argument", () => {
        const [n1, o1] = getNumNote(7, 2);
        const [n2, o2] = getNumNote(7, 2, undefined);
        expect(n1).toBe(n2);
        expect(o1).toBe(o2);
    });

    test("null temperament falls back to 12-EDO", () => {
        const [n1, o1] = getNumNote(9, 1);
        const [n2, o2] = getNumNote(9, 1, null);
        expect(n1).toBe(n2);
        expect(o1).toBe(o2);
    });

    test("empty string temperament falls back to 12-EDO", () => {
        const [n1, o1] = getNumNote(5, 0);
        const [n2, o2] = getNumNote(5, 0, "");
        expect(n1).toBe(n2);
        expect(o1).toBe(o2);
    });
});

// ---------------------------------------------------------------------------
// pitchToFrequency
// ---------------------------------------------------------------------------
describe("pitchToFrequency", () => {
    test("A4 returns approximately 440 Hz", () => {
        const freq = pitchToFrequency("A", 4, 0, "C major");
        expect(freq).toBeCloseTo(440.0, 0);
    });

    test("C5 is double the frequency of C4", () => {
        const f4 = pitchToFrequency("C", 4, 0, "C major");
        const f5 = pitchToFrequency("C", 5, 0, "C major");
        expect(f5).toBeCloseTo(f4 * 2, 1);
    });

    test("C6 is four times the frequency of C4", () => {
        const f4 = pitchToFrequency("C", 4, 0, "C major");
        const f6 = pitchToFrequency("C", 6, 0, "C major");
        expect(f6).toBeCloseTo(f4 * 4, 1);
    });

    test("positive cents offset raises frequency above the base pitch", () => {
        const base = pitchToFrequency("C", 4, 0, "C major");
        const raised = pitchToFrequency("C", 4, 50, "C major");
        expect(raised).toBeGreaterThan(base);
    });

    test("negative cents offset lowers frequency below the base pitch", () => {
        const base = pitchToFrequency("C", 4, 0, "C major");
        const lowered = pitchToFrequency("C", 4, -50, "C major");
        expect(lowered).toBeLessThan(base);
    });

    test("always returns a positive finite number", () => {
        const freq = pitchToFrequency("G", 3, 0, "C major");
        expect(Number.isFinite(freq)).toBe(true);
        expect(freq).toBeGreaterThan(0);
    });

    test("higher octave always produces a higher frequency", () => {
        const f3 = pitchToFrequency("E", 3, 0, "C major");
        const f4 = pitchToFrequency("E", 4, 0, "C major");
        const f5 = pitchToFrequency("E", 5, 0, "C major");
        expect(f4).toBeGreaterThan(f3);
        expect(f5).toBeGreaterThan(f4);
    });

    test("zero cents and 100 cents produce different frequencies", () => {
        const f0 = pitchToFrequency("D", 4, 0, "C major");
        const f100 = pitchToFrequency("D", 4, 100, "C major");
        expect(f0).not.toBeCloseTo(f100, 2);
    });

    test("same pitch same octave same cents always returns same value", () => {
        const f1 = pitchToFrequency("A", 4, 0, "C major");
        const f2 = pitchToFrequency("A", 4, 0, "C major");
        expect(f1).toBe(f2);
    });
});

// ---------------------------------------------------------------------------
// noteToFrequency
// ---------------------------------------------------------------------------
describe("noteToFrequency", () => {
    test("A4 string matches pitchToFrequency A 4 0", () => {
        const f1 = noteToFrequency("A4", "C major");
        const f2 = pitchToFrequency("A", 4, 0, "C major");
        expect(f1).toBeCloseTo(f2, 5);
    });

    test("returns a positive finite number", () => {
        const freq = noteToFrequency("C4", "C major");
        expect(Number.isFinite(freq)).toBe(true);
        expect(freq).toBeGreaterThan(0);
    });
});

// ---------------------------------------------------------------------------
// isInt
// ---------------------------------------------------------------------------
describe("isInt", () => {
    test("whole numbers return true", () => {
        expect(isInt(0)).toBe(true);
        expect(isInt(1)).toBe(true);
        expect(isInt(-4)).toBe(true);
        expect(isInt(100)).toBe(true);
    });

    test("floats return false", () => {
        expect(isInt(1.5)).toBe(false);
        expect(isInt(-0.1)).toBe(false);
        expect(isInt(3.99)).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// toFraction
// ---------------------------------------------------------------------------
describe("toFraction", () => {
    test("0.5 converts to a ratio equal to 1/2", () => {
        const [n, d] = toFraction(0.5);
        expect(n / d).toBeCloseTo(0.5, 5);
    });

    test("0.25 converts to a ratio equal to 1/4", () => {
        const [n, d] = toFraction(0.25);
        expect(n / d).toBeCloseTo(0.25, 5);
    });

    test("0.75 converts to a ratio equal to 3/4", () => {
        const [n, d] = toFraction(0.75);
        expect(n / d).toBeCloseTo(0.75, 5);
    });

    test("result numerator and denominator are both integers", () => {
        const [n, d] = toFraction(0.333);
        expect(Number.isInteger(n)).toBe(true);
        expect(Number.isInteger(d)).toBe(true);
    });

    test("denominator is always greater than zero", () => {
        const [, d] = toFraction(0.6);
        expect(d).toBeGreaterThan(0);
    });
});