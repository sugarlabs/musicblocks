/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2014-2026 Walter Bender
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { TextEncoder } = require("util");

const isUnsafeObjectKey = key => ["__proto__", "constructor", "prototype"].includes(key);

global.TextEncoder = TextEncoder;
global._ = jest.fn(str => str);
global.isUnsafeObjectKey = isUnsafeObjectKey;
global.window = { btoa: str => Buffer.from(str, "binary").toString("base64") };

const pitch = require("../musicutils-pitch");
const musicutils = require("../musicutils");

const readSource = name => fs.readFileSync(path.join(__dirname, "..", name), "utf8");

describe("musicutils-pitch", () => {
    it("still converts between pitch names, numbers and frequencies", () => {
        expect(pitch.frequencyToPitch(440, "equal")).toEqual(["A", 4, 0]);
        expect(pitch.numberToPitchSharp(0, "equal")).toEqual(["A", 0]);
        expect(pitch.getNumber("C", 4, "equal")).toBe(37);
        expect(pitch.parseNoteString("C4")).toEqual(["C", 4]);
        expect(pitch.noteToPitchOctave("A4")).toEqual(["A", 4]);
        expect(pitch.noteToObj("A4")).toEqual(["A", 4]);
        expect(pitch.stripMicrotonalPrefix("C4")).toBe("C4");
        expect(pitch.calcOctaveInterval("5")).toBe(0);
    });

    it("keeps naming pitches by number across octaves, below zero, and in other tunings", () => {
        const names = [0, 3, 11, 12, 14, 25, -1, -12, -13].map(i =>
            pitch.numberToPitchSharp(i, "equal")
        );
        expect(names).toEqual([
            ["A", 0],
            ["C", 1],
            ["G♯", 1],
            ["A", 1],
            ["B", 1],
            ["A♯", 2],
            ["G♯", 0],
            ["A", -1],
            ["G♯", -1]
        ]);
        expect(pitch.numberToPitchSharp(6, "equal19")).toEqual(["C♯", 1]);
        expect(pitch.numberToPitchSharp(19, "equal19")).toEqual(["A", 1]);
        expect(pitch.numberToPitchSharp(-1, "equal19")).toEqual(["A♭", 0]);
    });

    it("strips at most two microtonal prefix characters from the start of a note", () => {
        expect(pitch.stripMicrotonalPrefix("^C4")).toBe("C4");
        expect(pitch.stripMicrotonalPrefix("^^C4")).toBe("C4");
        expect(pitch.stripMicrotonalPrefix("vvC4")).toBe("C4");
        expect(pitch.stripMicrotonalPrefix("^^^C4")).toBe("^C4");
        expect(pitch.stripMicrotonalPrefix("x^C4")).toBe("x^C4");
        expect(pitch.stripMicrotonalPrefix(undefined)).toBe("");
        expect(pitch.stripMicrotonalPrefix(null)).toBe("");
        expect(pitch.stripMicrotonalPrefix(42)).toBe("");
        expect(pitch.stripMicrotonalPrefix({})).toBe("");
    });

    describe("normalizeNoteAccidentals", () => {
        it("normalizes single Unicode flat and sharp symbols to ASCII", () => {
            expect(pitch.normalizeNoteAccidentals("♭")).toBe("b");
            expect(pitch.normalizeNoteAccidentals("♯")).toBe("#");
            expect(pitch.normalizeNoteAccidentals("C♭")).toBe("Cb");
            expect(pitch.normalizeNoteAccidentals("F♯")).toBe("F#");
            expect(pitch.normalizeNoteAccidentals("C♭4")).toBe("Cb4");
            expect(pitch.normalizeNoteAccidentals("F♯5")).toBe("F#5");
        });

        it("normalizes double-flat and double-sharp Unicode symbols to ASCII", () => {
            expect(pitch.normalizeNoteAccidentals("𝄫")).toBe("bb");
            expect(pitch.normalizeNoteAccidentals("𝄪")).toBe("x");
            expect(pitch.normalizeNoteAccidentals("B𝄫")).toBe("Bbb");
            expect(pitch.normalizeNoteAccidentals("G𝄪")).toBe("Gx");
            expect(pitch.normalizeNoteAccidentals("B𝄫3")).toBe("Bbb3");
            expect(pitch.normalizeNoteAccidentals("G𝄪2")).toBe("Gx2");
        });

        it("leaves natural notes and non-accidental strings unchanged", () => {
            expect(pitch.normalizeNoteAccidentals("C")).toBe("C");
            expect(pitch.normalizeNoteAccidentals("D4")).toBe("D4");
            expect(pitch.normalizeNoteAccidentals("A0")).toBe("A0");
            expect(pitch.normalizeNoteAccidentals("")).toBe("");
            expect(pitch.normalizeNoteAccidentals(undefined)).toBe("");
            expect(pitch.normalizeNoteAccidentals(null)).toBe("");
            expect(pitch.normalizeNoteAccidentals(42)).toBe("");
            expect(pitch.normalizeNoteAccidentals({})).toBe("");
            expect(pitch.normalizeNoteAccidentals("Do")).toBe("Do");
            expect(pitch.normalizeNoteAccidentals("rest")).toBe("rest");
        });

        it("strips leading microtonal prefixes before normalizing accidentals", () => {
            expect(pitch.normalizeNoteAccidentals("^C")).toBe("C");
            expect(pitch.normalizeNoteAccidentals("^^C")).toBe("C");
            expect(pitch.normalizeNoteAccidentals("vvD♭")).toBe("Db");
            expect(pitch.normalizeNoteAccidentals("vF♯4")).toBe("F#4");
            expect(pitch.normalizeNoteAccidentals("^^^C♭")).toBe("^Cb");
        });

        it("normalizes multiple and mixed Unicode accidentals in note sequences", () => {
            expect(pitch.normalizeNoteAccidentals("C♭♭")).toBe("Cbb");
            expect(pitch.normalizeNoteAccidentals("C♯♯")).toBe("C##");
            expect(pitch.normalizeNoteAccidentals("C♭♯")).toBe("Cb#");
            expect(pitch.normalizeNoteAccidentals("C𝄫𝄪")).toBe("Cbbx");
            expect(pitch.normalizeNoteAccidentals("C♭ D♯ E𝄫 F𝄪")).toBe("Cb D# Ebb Fx");
            expect(pitch.normalizeNoteAccidentals("Sol♭")).toBe("Solb");
        });
    });

    it("is still reachable through musicutils.js for callers that require it", () => {
        for (const name of Object.keys(pitch)) {
            if (name === "MusicUtilsPitch") continue;
            expect(musicutils[name]).toBe(pitch[name]);
        }
    });

    it("exports every function the file declares", () => {
        const source = readSource("musicutils-pitch.js");
        const declared = [
            ...source.matchAll(/^var (\w+) =/gm),
            ...source.matchAll(/^function (\w+)\(/gm)
        ]
            .map(match => match[1])
            .filter(name => name !== "MusicUtilsPitch");
        expect(Object.keys(pitch).sort()).toEqual(declared.sort());
    });

    it("does not define anything that musicutils.js also defines", () => {
        const remaining = readSource("musicutils.js");
        for (const name of Object.keys(pitch)) {
            expect(remaining).not.toMatch(new RegExp(`^(const|let|var|function) ${name}\\b`, "m"));
        }
    });

    it("calculates interval octaves for numbers, keywords, and string-typed numbers", () => {
        // Numeric values
        expect(pitch.calcOctaveInterval(1)).toBe(1);
        expect(pitch.calcOctaveInterval(-1)).toBe(-1);
        expect(pitch.calcOctaveInterval(0)).toBe(0);
        expect(pitch.calcOctaveInterval(2)).toBe(2);
        expect(pitch.calcOctaveInterval(-2)).toBe(-2);

        // Keywords
        expect(pitch.calcOctaveInterval("next")).toBe(1);
        expect(pitch.calcOctaveInterval("previous")).toBe(-1);
        expect(pitch.calcOctaveInterval("current")).toBe(0);

        // String-typed numbers
        expect(pitch.calcOctaveInterval("1")).toBe(1);
        expect(pitch.calcOctaveInterval("-1")).toBe(-1);
        expect(pitch.calcOctaveInterval("0")).toBe(0);
        expect(pitch.calcOctaveInterval("2")).toBe(2);
        expect(pitch.calcOctaveInterval("-2")).toBe(-2);
        expect(pitch.calcOctaveInterval(" 1 ")).toBe(1);
        expect(pitch.calcOctaveInterval(" -2 ")).toBe(-2);

        // Out of range or invalid inputs default to 0
        expect(pitch.calcOctaveInterval("5")).toBe(0);
        expect(pitch.calcOctaveInterval(3)).toBe(0);
        expect(pitch.calcOctaveInterval(-3)).toBe(0);
        expect(pitch.calcOctaveInterval("invalid")).toBe(0);
        expect(pitch.calcOctaveInterval("")).toBe(0);
        expect(pitch.calcOctaveInterval(null)).toBe(0);
        expect(pitch.calcOctaveInterval(undefined)).toBe(0);
    });

    describe("_parse_pitch_string (#9430)", () => {
        const { SHARP, FLAT, DOUBLESHARP, DOUBLEFLAT } = require("../musicutils-constants");
        const fn = pitch._parse_pitch_string;

        it("normalizes double accidentals without an octave", () => {
            expect(fn("Cx")).toEqual(["C" + DOUBLESHARP, 4]);
            expect(fn("Bbb")).toEqual(["B" + DOUBLEFLAT, 4]);
            expect(fn("C#b")).toEqual(["C", 4]);
        });

        it("capitalizes and defaults octave to 4 for bare letter", () => {
            expect(fn("c")).toEqual(["C", 4]);
            expect(fn("C#")).toEqual(["C" + SHARP, 4]);
        });

        it("trims leading and trailing whitespace before parsing", () => {
            expect(fn("  C4  ")).toEqual(["C", 4]);
            expect(fn("\tCx\n")).toEqual(["C" + DOUBLESHARP, 4]);
            expect(fn("   Bbb-1   ")).toEqual(["B" + DOUBLEFLAT, -1]);
            expect(fn("   ")).toEqual(["", 4]);
        });

        it("keeps existing behaviour with octave present", () => {
            expect(fn("C4")).toEqual(["C", 4]);
            expect(fn("Bb-1")).toEqual(["B" + FLAT, -1]);
        });

        it("handles non-string inputs safely", () => {
            expect(fn(440)).toEqual([440, 4]);
            expect(fn(null)).toEqual(["", 4]);
            expect(fn(undefined)).toEqual(["", 4]);
            expect(fn(-1)).toEqual(["", 4]);
            expect(fn(0)).toEqual(["", 4]);
        });
    });

    describe("_calculate_pitch_number across the B/C boundary (#9765)", () => {
        const fn = (name, octave) => pitch._calculate_pitch_number(name, octave, 0, "equal");

        it("moves B sharps up an octave", () => {
            expect(fn("B♯", 4)).toBe(fn("C", 5));
            expect(fn("B#", 4)).toBe(72);
            expect(fn("B𝄪", 4)).toBe(fn("C♯", 5));
            expect(fn("Bx", 4)).toBe(73);
        });

        it("moves C flats down an octave", () => {
            expect(fn("C♭", 4)).toBe(fn("B", 3));
            expect(fn("Cb", 4)).toBe(59);
            expect(fn("C𝄫", 4)).toBe(fn("B♭", 3));
            expect(fn("C𝄫", 4)).toBe(58);
        });

        it("leaves spellings that stay inside the octave alone", () => {
            expect(fn("C", 4)).toBe(60);
            expect(fn("B", 4)).toBe(71);
            expect(fn("E♯", 4)).toBe(fn("F", 4));
            expect(fn("F♭", 4)).toBe(fn("E", 4));
            expect(fn("A𝄪", 4)).toBe(fn("B", 4));
            expect(fn("D𝄫", 4)).toBe(fn("C", 4));
        });
    });

    describe("getNumber", () => {
        it("handles double-sharp accidentals including 'x', '##', '*', and unicode '𝄪'", () => {
            expect(pitch.getNumber("Cx", 4, "equal")).toBe(39);
            expect(pitch.getNumber("C##", 4, "equal")).toBe(39);
            expect(pitch.getNumber("C*", 4, "equal")).toBe(39);
            expect(pitch.getNumber("C𝄪", 4, "equal")).toBe(39);
        });

        it("handles lowercase note names and microtonal prefixes", () => {
            expect(pitch.getNumber("c", 4, "equal")).toBe(37);
            expect(pitch.getNumber("d", 4, "equal")).toBe(39);
            expect(pitch.getNumber("bb", 4, "equal")).toBe(47);
            expect(pitch.getNumber("c#", 4, "equal")).toBe(38);
            expect(pitch.getNumber("^C", 4, "equal")).toBe(37);
            expect(pitch.getNumber("vD", 4, "equal")).toBe(39);
        });
    });

    describe("loaded as classic scripts, the way the browser does", () => {
        const order = [
            "musicutils-constants.js",
            "musicutils-i18n.js",
            "musicutils-temperament.js",
            "musicutils-pitch.js",
            "musicutils-lookups.js",
            "musicutils-rhythm.js",
            "musicutils-solfege.js",
            "musicutils-modewheel.js",
            "musicutils-modecore.js",
            "musicutils-pitchscale.js",
            "musicutils-buildscale.js",
            "musicutils-pitchinfo.js",
            "musicutils.js"
        ];
        const load = files => {
            const sandbox = {
                TextEncoder,
                _: value => value,
                isUnsafeObjectKey,
                localStorage: { getItem: () => null },
                window: { btoa: value => Buffer.from(value, "binary").toString("base64") }
            };
            vm.createContext(sandbox);
            files.forEach(file => vm.runInContext(readSource(file), sandbox, { filename: file }));
            return sandbox;
        };

        it("loads between the temperament module and musicutils.js without errors", () => {
            expect(() => load(order)).not.toThrow();
        });

        it("leaves every function visible as a bare global", () => {
            const sandbox = load(order);
            for (const name of Object.keys(pitch)) {
                if (name === "MusicUtilsPitch") continue;
                expect(vm.runInContext(`typeof ${name}`, sandbox)).toBe("function");
            }
        });

        it("lets the code that stayed in musicutils.js call the moved functions", () => {
            const sandbox = load(order);
            // getNote and pitchToFrequency stay in musicutils.js and call the moved helpers.
            expect(vm.runInContext("getNote('C', 4, 0, 'C major', 'equal')", sandbox)).toEqual([
                "C",
                4,
                0
            ]);
            expect(
                vm.runInContext("pitchToFrequency('A', 4, 0, 'C major', 'equal')", sandbox)
            ).toBeCloseTo(440, 5);
        });

        it("publishes the module object for the RequireJS shim", () => {
            const sandbox = load(order);
            expect(sandbox.window.MusicUtilsPitch.getNumber("C", 4, "equal")).toBe(37);
        });
    });
});
