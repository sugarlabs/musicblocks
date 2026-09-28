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

// This module is a strongly-connected group: getNote, numberToPitch, getNoteFromInterval,
// getNoteFromSolfege, pitchToNumber, keySignatureToMode, getScaleAndHalfSteps and
// getSharpFlatPreference all call each other, so unlike the earlier splits, it moved as one
// unit rather than one function at a time. musicutils.test.js already has thousands of lines
// exercising getNote/pitchToNumber/etc through real musical scenarios; the tests here are
// deliberately about the module boundary (what still resolves, what's still global, what's
// still reachable through musicutils.js), not re-proving music theory those tests already cover.

const pitchscale = require("../musicutils-pitchscale");
const musicutils = require("../musicutils");

const readSource = name => fs.readFileSync(path.join(__dirname, "..", name), "utf8");

describe("musicutils-pitchscale", () => {
    it("still resolves a pitch, a scale degree number, and a key signature's mode", () => {
        expect(pitchscale.getNote("F", 4, 0, "G major")).toEqual(["F", 4, 0]);
        expect(pitchscale.pitchToNumber("C", 4, "C major", "equal")).toBe(39);
        expect(pitchscale.numberToPitch(60, "equal")).toEqual(["A", 5]);
        expect(pitchscale.keySignatureToMode("G major")).toEqual(["G", "major"]);
        expect(pitchscale.getSharpFlatPreference("G major")).toBe("sharp");
    });

    it("resolves a solfege note argument to a note name, or null if unresolvable", () => {
        expect(pitchscale.getNoteFromSolfege("sol", "C major", true, 12, 4, 0)).toEqual([
            "G",
            4,
            0
        ]);
        expect(pitchscale.getNoteFromSolfege("xyz", "C major", true, 12, 4, 0)).toBeNull();
    });

    it("gives a key signature's scale, solfege slots, tonic and mode together", () => {
        const [scale, solfege, tonic, mode] = pitchscale.getScaleAndHalfSteps("C major");
        expect(scale).toHaveLength(12);
        expect(solfege).toHaveLength(12);
        expect(tonic).toBe("C");
        expect(mode).toBe("major");
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
