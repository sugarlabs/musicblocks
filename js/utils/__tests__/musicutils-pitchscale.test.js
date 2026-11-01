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
const slicePath = () => ({ DonutSlice: "donut", DonutSliceCustomization: () => ({}) });

global.TextEncoder = TextEncoder;
global._ = jest.fn(str => str);
global.isUnsafeObjectKey = isUnsafeObjectKey;
global.INVALIDPITCH = ["INVALIDPITCH"];
global.DRUMNAMES = [];
global.NOISENAMES = [];
global.VOICENAMES = [];
global.CUSTOMSAMPLES = [];
global.slicePath = slicePath;
global.window = { btoa: str => Buffer.from(str, "binary").toString("base64") };

// These tests cover the module boundary (exports, globals, reachability through musicutils.js);
// musicutils.test.js already covers the music-theory behavior of these functions.

const pitchscale = require("../musicutils-pitchscale");
const musicutils = require("../musicutils");

const readSource = name => fs.readFileSync(path.join(__dirname, "..", name), "utf8");

describe("musicutils-pitchscale", () => {
    it.each([
        ["cx", "D", 4],
        ["c##", "D", 4],
        ["c𝄪", "D", 4],
        ["cbb", "A♯", 3],
        ["c𝄫", "A♯", 3],
        ["b##", "C♯", 5]
    ])("resolves lowercase %s as a pitch instead of a rest", (input, note, octave) => {
        expect(pitchscale.getNote(input, 4, 0, "C major")).toEqual([note, octave, 0]);
    });

    it("still resolves a pitch, a scale degree number, and a key signature's mode", () => {
        expect(pitchscale.getNote("F", 4, 0, "G major")).toEqual(["F", 4, 0]);
        expect(pitchscale.pitchToNumber("C", 4, "C major", "equal")).toBe(39);
        expect(pitchscale.numberToPitch(60, "equal")).toEqual(["A", 5]);
        expect(pitchscale.keySignatureToMode("G major")).toEqual(["G", "major"]);
        expect(pitchscale.getSharpFlatPreference("G major")).toBe("sharp");
    });

    it("handles nullish, empty, and non-string inputs safely in keySignatureToMode", () => {
        expect(pitchscale.keySignatureToMode("")).toEqual(["C", "major"]);
        expect(pitchscale.keySignatureToMode("   ")).toEqual(["C", "major"]);
        expect(pitchscale.keySignatureToMode(null)).toEqual(["C", "major"]);
        expect(pitchscale.keySignatureToMode(undefined)).toEqual(["C", "major"]);
        expect(pitchscale.keySignatureToMode(42)).toEqual(["C", "major"]);
        expect(pitchscale.keySignatureToMode(true)).toEqual(["C", "major"]);
        expect(pitchscale.keySignatureToMode({})).toEqual(["C", "major"]);
        expect(pitchscale.keySignatureToMode([])).toEqual(["C", "major"]);
    });

    it("calculates pitch numbers accurately for enharmonic notes and boundary shifts in 12-EDO", () => {
        expect(pitchscale.pitchToNumber("B♯", 4, "C major", "equal")).toBe(
            pitchscale.pitchToNumber("C", 5, "C major", "equal")
        );
        expect(pitchscale.pitchToNumber("C♭", 5, "C major", "equal")).toBe(
            pitchscale.pitchToNumber("B", 4, "C major", "equal")
        );
        expect(pitchscale.pitchToNumber("E♯", 4, "C major", "equal")).toBe(
            pitchscale.pitchToNumber("F", 4, "C major", "equal")
        );
        expect(pitchscale.pitchToNumber("F♭", 4, "C major", "equal")).toBe(
            pitchscale.pitchToNumber("E", 4, "C major", "equal")
        );
        expect(pitchscale.pitchToNumber("B𝄪", 4, "C major", "equal")).toBe(
            pitchscale.pitchToNumber("C♯", 5, "C major", "equal")
        );
        expect(pitchscale.pitchToNumber("C𝄫", 5, "C major", "equal")).toBe(
            pitchscale.pitchToNumber("B♭", 4, "C major", "equal")
        );
        expect(pitchscale.pitchToNumber("B#", 4, "C major", "equal")).toBe(51);
        expect(pitchscale.pitchToNumber("Cb", 5, "C major", "equal")).toBe(50);
        expect(pitchscale.pitchToNumber("E#", 4, "C major", "equal")).toBe(44);
        expect(pitchscale.pitchToNumber("Fb", 4, "C major", "equal")).toBe(43);
        expect(pitchscale.pitchToNumber("sol𝄪", 4, "C major", "equal")).toBe(
            pitchscale.pitchToNumber("G𝄪", 4, "C major", "equal")
        );
        expect(pitchscale.pitchToNumber("sol##", 4, "C major", "equal")).toBe(48);
        expect(pitchscale.pitchToNumber("sol♯♯", 4, "C major", "equal")).toBe(48);
        expect(pitchscale.pitchToNumber("sol♭♭", 4, "C major", "equal")).toBe(44);
        expect(pitchscale.pitchToNumber("do𝄫", 4, "C major", "equal")).toBe(
            pitchscale.pitchToNumber("C𝄫", 4, "C major", "equal")
        );
        expect(pitchscale.pitchToNumber("dobb", 4, "C major", "equal")).toBe(37);
        expect(pitchscale.pitchToNumber("do♭♭", 4, "C major", "equal")).toBe(37);
        expect(pitchscale.pitchToNumber("do♯♯", 4, "C major", "equal")).toBe(41);
        expect(pitchscale.pitchToNumber("C#b", 4, "C major", "equal")).toBe(
            pitchscale.pitchToNumber("C", 4, "C major", "equal")
        );
        expect(pitchscale.pitchToNumber("Cb#", 4, "C major", "equal")).toBe(
            pitchscale.pitchToNumber("C", 4, "C major", "equal")
        );
        expect(pitchscale.pitchToNumber("C#♭", 4, "C major", "equal")).toBe(
            pitchscale.pitchToNumber("C", 4, "C major", "equal")
        );
        expect(pitchscale.pitchToNumber("C♯b", 4, "C major", "equal")).toBe(
            pitchscale.pitchToNumber("C", 4, "C major", "equal")
        );
        expect(pitchscale.pitchToNumber("Cb♯", 4, "C major", "equal")).toBe(
            pitchscale.pitchToNumber("C", 4, "C major", "equal")
        );
        expect(pitchscale.pitchToNumber("C♭#", 4, "C major", "equal")).toBe(
            pitchscale.pitchToNumber("C", 4, "C major", "equal")
        );
    });

    it("keeps the full solfege root when parsing double accidentals", () => {
        expect(pitchscale.pitchToNumber("sol##", 4, "C major", "equal")).toBe(
            pitchscale.pitchToNumber("A", 4, "C major", "equal")
        );
        expect(pitchscale.pitchToNumber("do𝄫", 4, "C major", "equal")).toBe(
            pitchscale.pitchToNumber("B♭", 3, "C major", "equal")
        );
        expect(pitchscale.getNoteFromSolfege("sol##", "C major", false, 12, 4, 0)).toEqual([
            "A",
            4,
            0
        ]);
        expect(pitchscale.getNoteFromSolfege("do𝄫", "C major", false, 12, 4, 0)).toEqual([
            "B♭",
            3,
            0
        ]);
    });

    it("resolves a solfege note argument to a note name, or null if unresolvable", () => {
        expect(pitchscale.getNoteFromSolfege("sol", "C major", true, 12, 4, 0)).toEqual([
            "G",
            4,
            0
        ]);
        expect(pitchscale.getNoteFromSolfege("xyz", "C major", true, 12, 4, 0)).toBeNull();
    });

    it("spells ASCII and Unicode double accidentals the same way in non-12 EDO", () => {
        // Regression: the downstream spelling branch must use the already-parsed
        // doubleSharp flag, not re-check the raw noteArg, so "mi##" and its
        // Unicode equivalent pick the same enharmonic spelling in e.g. 19-EDO.
        expect(pitchscale.getNoteFromSolfege("mi##", "C major", true, 19, 4, 0)).toEqual(
            pitchscale.getNoteFromSolfege("mi𝄪", "C major", true, 19, 4, 0)
        );
        expect(pitchscale.getNoteFromSolfege("mibb", "C major", true, 19, 4, 0)).toEqual(
            pitchscale.getNoteFromSolfege("mi𝄫", "C major", true, 19, 4, 0)
        );
    });

    it("gives a key signature's scale, solfege slots, tonic and mode together", () => {
        const [scale, solfege, tonic, mode] = pitchscale.getScaleAndHalfSteps("C major");
        expect(scale).toHaveLength(12);
        expect(solfege).toHaveLength(12);
        expect(tonic).toBe("C");
        expect(mode).toBe("major");
    });

    describe("input validation and type guards (#9900)", () => {
        it("returns ['C', 'major'] for nullish, non-string, or empty key signatures in keySignatureToMode", () => {
            expect(pitchscale.keySignatureToMode(undefined)).toEqual(["C", "major"]);
            expect(pitchscale.keySignatureToMode(null)).toEqual(["C", "major"]);
            expect(pitchscale.keySignatureToMode("")).toEqual(["C", "major"]);
            expect(pitchscale.keySignatureToMode("   ")).toEqual(["C", "major"]);
            expect(pitchscale.keySignatureToMode(42)).toEqual(["C", "major"]);
            expect(pitchscale.keySignatureToMode(true)).toEqual(["C", "major"]);
            expect(pitchscale.keySignatureToMode({})).toEqual(["C", "major"]);
            expect(pitchscale.keySignatureToMode([])).toEqual(["C", "major"]);
        });

        it("safely handles nullish and non-string inputs in getSharpFlatPreference", () => {
            expect(pitchscale.getSharpFlatPreference(undefined)).toBe("natural");
            expect(pitchscale.getSharpFlatPreference(null)).toBe("natural");
            expect(pitchscale.getSharpFlatPreference(123)).toBe("natural");
            expect(pitchscale.getSharpFlatPreference("")).toBe("natural");
        });

        it("safely handles nullish and non-string inputs in pitchToNumber", () => {
            expect(pitchscale.pitchToNumber(undefined, 4, "C major", "equal")).toBe(0);
            expect(pitchscale.pitchToNumber(null, 4, "C major", "equal")).toBe(0);
            expect(pitchscale.pitchToNumber(123, 4, "C major", "equal")).toBe(0);
            expect(pitchscale.pitchToNumber("", 4, "C major", "equal")).toBe(39);
        });

        it("returns null for non-string or empty solfege note arguments in getNoteFromSolfege", () => {
            expect(pitchscale.getNoteFromSolfege(undefined, "C major", true, 12, 4, 0)).toBeNull();
            expect(pitchscale.getNoteFromSolfege(null, "C major", true, 12, 4, 0)).toBeNull();
            expect(pitchscale.getNoteFromSolfege(42, "C major", true, 12, 4, 0)).toBeNull();
            expect(pitchscale.getNoteFromSolfege("", "C major", true, 12, 4, 0)).toBeNull();
        });
    });

    describe("numberToPitch non-finite and large-magnitude inputs", () => {
        // Regression: the negative branch used to bump the pitch number up
        // one octave per loop iteration, so -Infinity never terminated and
        // a finite -1e308 effectively never did; NaN/Infinity fell through
        // to [undefined, NaN/Infinity]. #9126 fixed the same hang class in
        // numberToPitchSharp and specified the ["A", 0] default.
        it("returns the A0 default for non-finite pitch numbers instead of hanging", () => {
            expect(pitchscale.numberToPitch(-Infinity, "equal")).toEqual(["A", 0]);
            expect(pitchscale.numberToPitch(Infinity, "equal")).toEqual(["A", 0]);
            expect(pitchscale.numberToPitch(NaN, "equal")).toEqual(["A", 0]);
            expect(pitchscale.numberToPitch(-Infinity, "equal19")).toEqual(["A", 0]);
        });

        it("converts a very large finite negative pitch number in constant time", () => {
            // The step within the octave comes from exact remainder
            // arithmetic: -1e308 mod 12 normalises to step 4 (D♭), and the
            // largest finite double must still produce a defined note
            // instead of overflowing to [undefined, Infinity].
            expect(pitchscale.numberToPitch(-1e308, "equal")).toEqual([
                "D♭",
                -8.333333333333333e306
            ]);
            expect(pitchscale.numberToPitch(-Number.MAX_VALUE, "equal")).toEqual([
                "D♭",
                -1.4980776123852632e307
            ]);
            expect(pitchscale.numberToPitch(-1e308, "equal19")).toEqual([
                "C♯",
                -5.263157894736842e306
            ]);
        });

        it("keeps a sub-octave negative remainder in its own octave", () => {
            // -Number.EPSILON sits a hair below A0: the remainder rounds up
            // to exactly one octave, so a second modulo would push it into
            // octave -1; it must stay ["A", 0] as before.
            expect(pitchscale.numberToPitch(-Number.EPSILON, "equal")).toEqual(["A", 0]);
            expect(pitchscale.numberToPitch(-Number.EPSILON, "equal19")).toEqual(["A", 0]);
        });

        it("leaves ordinary pitch numbers unchanged", () => {
            expect(pitchscale.numberToPitch(0, "equal")).toEqual(["A", 0]);
            expect(pitchscale.numberToPitch(-1, "equal")).toEqual(["A♭", 0]);
            expect(pitchscale.numberToPitch(-5, "equal")).toEqual(["E", 0]);
            expect(pitchscale.numberToPitch(-12, "equal")).toEqual(["A", -1]);
            expect(pitchscale.numberToPitch(-13, "equal")).toEqual(["A♭", -1]);
            expect(pitchscale.numberToPitch(-24, "equal")).toEqual(["A", -2]);
            expect(pitchscale.numberToPitch(-100, "equal")).toEqual(["F", -8]);
            expect(pitchscale.numberToPitch(-19, "equal19")).toEqual(["A", -1]);
            expect(pitchscale.numberToPitch(-20, "equal19")).toEqual(["A♭", -1]);
        });
    });

    it("is still reachable through musicutils.js for callers that require it", () => {
        for (const name of [
            "keySignatureToMode",
            "getScaleAndHalfSteps",
            "getSharpFlatPreference",
            "pitchToNumber",
            "getNoteFromInterval",
            "numberToPitch",
            "getNote"
        ]) {
            expect(musicutils[name]).toBe(pitchscale[name]);
        }
    });

    it("exports every function and table the file declares", () => {
        const source = readSource("musicutils-pitchscale.js");
        const declared = [
            ...source.matchAll(/^var (\w+) =/gm),
            ...source.matchAll(/^function (\w+)\(/gm)
        ]
            .map(match => match[1])
            .filter(name => name !== "MusicUtilsPitchScale");
        expect(Object.keys(pitchscale).sort()).toEqual(declared.sort());
    });

    it("does not define anything that musicutils.js also defines", () => {
        const remaining = readSource("musicutils.js");
        for (const name of Object.keys(pitchscale)) {
            expect(remaining).not.toMatch(new RegExp(`^(const|let|var|function) ${name}\\b`, "m"));
        }
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
                slicePath,
                INVALIDPITCH: ["INVALIDPITCH"],
                DRUMNAMES: [],
                NOISENAMES: [],
                VOICENAMES: [],
                CUSTOMSAMPLES: [],
                localStorage: { getItem: () => null },
                window: { btoa: value => Buffer.from(value, "binary").toString("base64") }
            };
            vm.createContext(sandbox);
            files.forEach(file => vm.runInContext(readSource(file), sandbox, { filename: file }));
            return sandbox;
        };

        it("loads between the mode/chord core module and musicutils.js without errors", () => {
            expect(() => load(order)).not.toThrow();
        });

        it("leaves every declared name visible as a bare global", () => {
            const sandbox = load(order);
            for (const name of Object.keys(pitchscale)) {
                if (name === "MusicUtilsPitchScale") continue;
                expect(vm.runInContext(`typeof ${name}`, sandbox)).not.toBe("undefined");
            }
        });

        it("publishes the module object for the RequireJS shim", () => {
            const sandbox = load(order);
            expect(sandbox.window.MusicUtilsPitchScale.getNote("F", 4, 0, "G major")).toEqual([
                "F",
                4,
                0
            ]);
        });
    });
});

describe("getNoteFromInterval - diminished intervals", () => {
    const { getNoteFromInterval, pitchToNumber } = pitchscale;
    const { INTERVALVALUES } = require("../musicutils-constants");

    // Distance in half steps from the root to what the function spells.
    const semitonesOf = (root, interval) => {
        const spelled = getNoteFromInterval(`${root}4`, interval);
        return pitchToNumber(spelled[0], spelled[1], "C major") - pitchToNumber(root, 4, "C major");
    };

    // A diminished interval is a half step below a perfect one but a whole step
    // below a major one, because the minor sits between them. These are the four
    // built on major intervals, and INTERVALVALUES is the reference.
    it.each(["3", "6", "7"])("spells diminished %s the width the table gives it", num => {
        const interval = `diminished ${num}`;
        expect(semitonesOf("C", interval)).toBe(INTERVALVALUES[interval][0]);
    });

    it.each(["4", "5", "8"])("leaves the perfect-based diminished %s alone", num => {
        const interval = `diminished ${num}`;
        expect(semitonesOf("C", interval)).toBe(INTERVALVALUES[interval][0]);
    });

    it("does not confuse a diminished interval with the minor one above it", () => {
        expect(semitonesOf("C", "diminished 3")).toBe(semitonesOf("C", "minor 3") - 1);
        expect(semitonesOf("C", "diminished 6")).toBe(semitonesOf("C", "minor 6") - 1);
        expect(semitonesOf("C", "diminished 7")).toBe(semitonesOf("C", "minor 7") - 1);
    });

    it("keeps the width from every root, not just C", () => {
        for (const root of ["C", "D", "E", "F", "G", "A", "B"]) {
            for (const num of ["3", "6", "7"]) {
                const interval = `diminished ${num}`;
                expect([root, interval, semitonesOf(root, interval)]).toEqual([
                    root,
                    interval,
                    INTERVALVALUES[interval][0]
                ]);
            }
        }
    });
});
