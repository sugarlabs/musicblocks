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

const pitchinfo = require("../musicutils-pitchinfo");
const musicutils = require("../musicutils");

const readSource = name => fs.readFileSync(path.join(__dirname, "..", name), "utf8");

const singerTur = () => ({
    singer: { keySignature: "C major", movable: false, pitchNumberOffset: 0 }
});

describe("musicutils-pitchinfo", () => {
    it("still resolves step sizes", () => {
        expect(pitchinfo.getStepSizeUp("C major", "C", 0, "equal")).toBe(2);
        expect(pitchinfo.getStepSizeDown("C major", "D", 0, "equal")).toBe(-2);
    });

    it("still resolves pitch info from a bare note or pitch number (1-arg form)", () => {
        expect(pitchinfo.getPitchInfo(60)).toEqual({ name: "C", octave: 4, pitchNumber: 60 });
        expect(pitchinfo.getPitchInfo("C4")).toEqual({ name: "C", octave: 4, pitchNumber: 60 });
    });

    it("still resolves pitch info for a turtle/type/note (4-arg legacy form)", () => {
        expect(pitchinfo.getPitchInfo({}, "alphabet", "C4", singerTur())).toBe("C");
        expect(pitchinfo.getPitchInfo({}, "pitch number", "C4", singerTur())).toBe(60);
    });

    it("is still reachable through musicutils.js for callers that require it", () => {
        for (const name of ["getStepSizeUp", "getStepSizeDown", "getPitchInfo"]) {
            expect(musicutils[name]).toBe(pitchinfo[name]);
        }
    });

    it("exports every function the file declares", () => {
        const source = readSource("musicutils-pitchinfo.js");
        const declared = [
            ...source.matchAll(/^var (\w+) =/gm),
            ...source.matchAll(/^function (\w+)\(/gm)
        ]
            .map(match => match[1])
            .filter(name => name !== "MusicUtilsPitchInfo");
        expect(Object.keys(pitchinfo).sort()).toEqual(declared.sort());
    });

    it("does not define anything that musicutils.js also defines", () => {
        const remaining = readSource("musicutils.js");
        for (const name of Object.keys(pitchinfo)) {
            expect(remaining).not.toMatch(new RegExp(`^(const|let|var|function) ${name}\\b`, "m"));
        }
    });

    it("leaves musicutils.js as just the guard, comments and the exports aggregator", () => {
        const remaining = readSource("musicutils.js");
        expect(remaining).not.toMatch(/^(const|let|var|function) \w/m);
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

        it("loads after the buildscale module and before musicutils.js without errors", () => {
            expect(() => load(order)).not.toThrow();
        });

        it("leaves every declared name visible as a bare global", () => {
            const sandbox = load(order);
            for (const name of Object.keys(pitchinfo)) {
                if (name === "MusicUtilsPitchInfo") continue;
                expect(vm.runInContext(`typeof ${name}`, sandbox)).not.toBe("undefined");
            }
        });

        it("exposes computeTargetPitchFrequency as a window property for direct mocking", () => {
            const sandbox = load(order);
            expect(vm.runInContext("typeof window.computeTargetPitchFrequency", sandbox)).toBe(
                "function"
            );
        });

        it("publishes the module object for the RequireJS shim", () => {
            const sandbox = load(order);
            expect(
                sandbox.window.MusicUtilsPitchInfo.getStepSizeUp("C major", "C", 0, "equal")
            ).toBe(2);
        });
    });
});
