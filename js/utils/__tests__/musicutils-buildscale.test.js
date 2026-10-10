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

        // Double accidental on natural scale note (C major: C -> C##)
        expect(
            buildscale.scaleDegreeToPitchMapping("C major", null, false, "C" + DOUBLESHARP)
        ).toEqual(["1", DOUBLESHARP, "8", DOUBLESHARP]);
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
