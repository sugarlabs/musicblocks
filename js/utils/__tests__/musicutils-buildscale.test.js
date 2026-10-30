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

const buildscale = require("../musicutils-buildscale");
const musicutils = require("../musicutils");
const { SHARP, FLAT, NATURAL, DOUBLESHARP, DOUBLEFLAT } = require("../musicutils-constants");

const readSource = name => fs.readFileSync(path.join(__dirname, "..", name), "utf8");

describe("musicutils-buildscale", () => {
    it("reads the pitch class a note name sounds as, whatever its spelling", () => {
        expect(buildscale._notePitchClass("C")).toBe(0);
        expect(buildscale._notePitchClass("G♯")).toBe(8);
        expect(buildscale._notePitchClass("A♭")).toBe(8);
        expect(buildscale._notePitchClass("F𝄪")).toBe(7);
        expect(buildscale._notePitchClass("B𝄫")).toBe(9);
        expect(buildscale._notePitchClass("C♭")).toBe(11);
        expect(buildscale._notePitchClass("G#")).toBe(8);
        expect(buildscale._notePitchClass("Bb")).toBe(10);
        // ASCII double accidentals: ## and x are 𝄪, bb is 𝄫.
        expect(buildscale._notePitchClass("F##")).toBe(7);
        expect(buildscale._notePitchClass("Fx")).toBe(7);
        expect(buildscale._notePitchClass("Abb")).toBe(7);
        expect(buildscale._notePitchClass("xyz")).toBeNaN();
        expect(buildscale._notePitchClass(undefined)).toBeNaN();
    });

    it("still builds a scale and resolves frequencies", () => {
        expect(buildscale.buildScale("C major", 12)[0].slice(0, 3)).toEqual(["C", "D", "E"]);
        expect(buildscale.pitchToFrequency("A", 4, 0, "C major", "equal")).toBeCloseTo(440, 5);
        expect(buildscale.noteToFrequency("A4", "C major", "equal")).toBeCloseTo(440, 5);
        expect(buildscale.getNonEDOFrequency(0, 4, "just intonation", "C major")).toEqual({
            freq: 264,
            noteName: "C",
            octave: 4
        });
    });

    it("unifies pitchToFrequency with dynamic powerBase for stretched and non-octave temperaments", () => {
        // 1. Stretched 12-EDO (octaveRatio: 2.01)
        const stretched12 = { isEDO: true, edo: 12, octaveRatio: 2.01 };
        const a4Stretched = buildscale.pitchToFrequency("A", 4, 0, "C major", stretched12);
        const a5Stretched = buildscale.pitchToFrequency("A", 5, 0, "C major", stretched12);
        expect(a5Stretched / a4Stretched).toBeCloseTo(2.01, 5);

        // 2. Bohlen-Pierce tritave (octaveRatio: 3, 13 steps per period)
        const bohlenPierce = { isEDO: true, edo: 13, octaveRatio: 3 };
        const bpA0 = buildscale.pitchToFrequency("A", 0, 0, "C major", bohlenPierce);
        const bpA1 = buildscale.pitchToFrequency("A", 1, 0, "C major", bohlenPierce);
        expect(bpA1 / bpA0).toBeCloseTo(3.0, 5);

        // 3. Stretched non-EDO table (Just Intonation with octaveRatio: 2.02)
        const jiStretched = {
            ...musicutils.TEMPERAMENT["just intonation"],
            octaveRatio: 2.02
        };
        const c4Ji = buildscale.pitchToFrequency("C", 4, 0, "C major", jiStretched);
        const c5Ji = buildscale.pitchToFrequency("C", 5, 0, "C major", jiStretched);
        expect(c5Ji / c4Ji).toBeCloseTo(2.02, 5);

        // 4. Cents adjustment scales with powerBase (1200 cents = 1 period)
        const a4With1200Cents = buildscale.pitchToFrequency("A", 4, 1200, "C major", stretched12);
        expect(a4With1200Cents / a4Stretched).toBeCloseTo(2.01, 5);
    });

    it("still resolves scale degrees, step sizes and intervals", () => {
        expect(buildscale.getModeLength("C major")).toBe(7);
        expect(buildscale.scaleDegreeToPitchMapping("C major", 2, false, null)).toBe("D");
        expect(buildscale.scaleDegreeToPitchMapping("C major", 1, true, null)).toBe("C");
        expect(buildscale.nthDegreeToPitch("C major", 3)).toEqual(["E", 0]);
        expect(buildscale._getStepSize("C major", "C", "up", 0, "equal")).toBe(2);
        expect(buildscale._getStepSize("C major", "D", "down", 0, "equal")).toBe(-2);
        expect(buildscale._getStepSize("C major", "C♯", "up", 0, "equal")).toBe(1);
        expect(buildscale._getStepSize("C major", "C♯", "down", 0, "equal")).toBe(-1);
        expect(buildscale._getStepSize("C major", "C", "up", 0, "equal19", 19)).toBe(3);
        expect(buildscale.getInterval(4, "C major", "C")).toBe(7);
        expect(buildscale.getInterval(-2, "C major", "C")).toBe(-3);
    });

    it("resolves correct accidentals in reverse scale-degree mapping for altered and unaltered pitches", () => {
        // Flat-key scale note with natural pitch above it (F major: Bb -> B)
        expect(buildscale.scaleDegreeToPitchMapping("F major", null, false, "B")).toEqual([
            "4",
            SHARP
        ]);

        // Flat-key scale note with lowered pitch (F major: Bb -> Bbb)
        expect(
            buildscale.scaleDegreeToPitchMapping("F major", null, false, "B" + DOUBLEFLAT)
        ).toEqual(["4", FLAT]);

        // Flat-key example from C minor (C minor: Bb -> B)
        expect(buildscale.scaleDegreeToPitchMapping("C minor", null, false, "B")).toEqual([
            "7",
            SHARP
        ]);

        // Sharp-key scale note with raised pitch (G major: F# -> F##)
        expect(
            buildscale.scaleDegreeToPitchMapping("G major", null, false, "F" + DOUBLESHARP)
        ).toEqual(["7", SHARP]);

        // Sharp-key scale note with lowered pitch (G major: F# -> F)
        expect(buildscale.scaleDegreeToPitchMapping("G major", null, false, "F")).toEqual([
            "7",
            FLAT
        ]);

        // Unaltered scale notes return natural
        expect(buildscale.scaleDegreeToPitchMapping("F major", null, false, "B" + FLAT)).toEqual([
            "4",
            NATURAL
        ]);
        expect(buildscale.scaleDegreeToPitchMapping("G major", null, false, "F" + SHARP)).toEqual([
            "7",
            NATURAL
        ]);

        // Movable do behavior with altered scale note (F major: Bb -> B)
        expect(buildscale.scaleDegreeToPitchMapping("F major", null, true, "B")).toEqual([
            "4",
            SHARP
        ]);

        // Double accidental on natural scale note (C major: C -> C##, C -> Cbb)
        expect(
            buildscale.scaleDegreeToPitchMapping("C major", null, false, "C" + DOUBLESHARP)
        ).toEqual(["1", DOUBLESHARP, "8", DOUBLESHARP]);
        expect(
            buildscale.scaleDegreeToPitchMapping("C major", null, false, "C" + DOUBLEFLAT)
        ).toEqual(["1", DOUBLEFLAT, "8", DOUBLEFLAT]);

        // Explicit natural symbol on natural scale note
        expect(buildscale.scaleDegreeToPitchMapping("C major", null, false, "C" + NATURAL)).toEqual(
            ["1", NATURAL, "8", NATURAL]
        );

        // Boundary offsets (> 2 or < -2) return null accidental
        expect(buildscale.scaleDegreeToPitchMapping("F♭ major", null, false, "B" + SHARP)).toEqual([
            "4"
        ]);
        expect(
            buildscale.scaleDegreeToPitchMapping("G major", null, false, "F" + DOUBLEFLAT)
        ).toEqual(["7"]);

        // Unrecognized accidental notation returns null accidental
        expect(buildscale.scaleDegreeToPitchMapping("C major", null, false, "C?")).toEqual([
            "1",
            "8"
        ]);

        // Scales with < 7 notes and > 7 notes in reverse mapping
        expect(
            buildscale.scaleDegreeToPitchMapping("C major pentatonic", null, false, "D" + SHARP)
        ).toEqual(["2", SHARP]);
        expect(
            buildscale.scaleDegreeToPitchMapping("C chromatic", null, false, "C" + SHARP)
        ).toEqual(["1", SHARP]);
    });

    it.each([
        ["A minor blues", "A C D E♭ E G A"],
        ["E minor blues", "E G A B♭ B D E"],
        ["B minor blues", "B D E F F♯ A B"],
        ["F♯ minor blues", "F♯ A B C C♯ E F♯"],
        ["C minor blues", "C E♭ F G♭ G B♭ C"],
        ["B♭ minor blues", "B♭ D♭ E♭ F♭ F A♭ B♭"],
        ["C major blues", "C D E♭ E G A C"],
        ["D major blues", "D E F F♯ A B D"],
        ["E major blues", "E F♯ G G♯ B C♯ E"],
        ["F♯ major blues", "F♯ G♯ A A♯ C♯ D♯ F♯"],
        ["E♭ major blues", "E♭ F G♭ G B♭ C E♭"]
    ])("spells %s with its blue note flattened", (keySignature, expected) => {
        expect(buildscale.buildScale(keySignature, 12)[0].join(" ")).toBe(expected);
    });

    it("gives the notes of a blues scale their own scale degrees", () => {
        const degree = pitch =>
            buildscale.scaleDegreeToPitchMapping("D major blues", null, false, pitch).join("");
        // D E F F♯ A B: the blue note F is degree 3, and F♯ is not a flat 4.
        expect(buildscale.buildScale("D major blues", 12)[0].slice(0, 6).map(degree)).toEqual([
            "1" + NATURAL,
            "2" + NATURAL,
            "3" + NATURAL,
            "3" + SHARP,
            "5" + NATURAL,
            "6" + NATURAL
        ]);
    });

    it("round-trips every spelling of a blues scale note through movable solfege", () => {
        const names = ["C", "D", "E", "F", "G", "A", "B"].flatMap(letter => [
            letter,
            letter + SHARP,
            letter + FLAT
        ]);
        const tonics = ["C", "G", "D", "A", "E", "B", "F♯", "F", "B♭", "E♭", "A♭", "D♭"];
        for (const keySignature of tonics.flatMap(k => [k + " major blues", k + " minor blues"])) {
            const scalePitches = buildscale
                .buildScale(keySignature, 12)[0]
                .map(buildscale._notePitchClass);
            for (const name of names) {
                const pitchClass = buildscale._notePitchClass(name);
                if (!scalePitches.includes(pitchClass)) {
                    continue;
                }
                const solfege = buildscale.getSolfege(name, keySignature, true, "equal", 12);
                const note = musicutils.getNote(solfege, 4, 0, keySignature, true, null, null);
                expect([keySignature, name, buildscale._notePitchClass(note[0])]).toEqual([
                    keySignature,
                    name,
                    pitchClass
                ]);
            }
        }
    });

    it("still resolves a minor key signature's scale and solfege", () => {
        expect(buildscale.buildScale("A minor", 12)[0].slice(0, 3)).toEqual(["A", "B", "C"]);
        expect(buildscale.getSolfege("A", "A minor", false, "equal")).toBe("la");
    });

    it("still resolves solfege for a key signature", () => {
        expect(buildscale.getSolfege("C", "C major", true, "equal")).toBe("do");
    });

    it("is still reachable through musicutils.js for callers that require it", () => {
        for (const name of [
            "buildScale",
            "pitchToFrequency",
            "getNonEDOFrequency",
            "getModeLength",
            "scaleDegreeToPitchMapping",
            "nthDegreeToPitch",
            "_getStepSize",
            "getInterval",
            "noteToFrequency",
            "computeTargetPitchFrequency",
            "getSolfege"
        ]) {
            expect(musicutils[name]).toBe(buildscale[name]);
        }
    });

    it("exports every function the file declares", () => {
        const source = readSource("musicutils-buildscale.js");
        const declared = [
            ...source.matchAll(/^var (\w+) =/gm),
            ...source.matchAll(/^function (\w+)\(/gm)
        ]
            .map(match => match[1])
            .filter(name => name !== "MusicUtilsBuildScale");
        expect(Object.keys(buildscale).sort()).toEqual(declared.sort());
    });

    it("does not define anything that musicutils.js also defines", () => {
        const remaining = readSource("musicutils.js");
        for (const name of Object.keys(buildscale)) {
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

        it("loads after the pitch/scale cycle and before musicutils.js without errors", () => {
            expect(() => load(order)).not.toThrow();
        });

        it("leaves every declared name visible as a bare global", () => {
            const sandbox = load(order);
            for (const name of Object.keys(buildscale)) {
                if (name === "MusicUtilsBuildScale") continue;
                expect(vm.runInContext(`typeof ${name}`, sandbox)).not.toBe("undefined");
            }
        });

        it("publishes the module object for the RequireJS shim", () => {
            const sandbox = load(order);
            expect(
                sandbox.window.MusicUtilsBuildScale.buildScale("C major", 12)[0].slice(0, 3)
            ).toEqual(["C", "D", "E"]);
        });
    });
});
