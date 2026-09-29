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
global.DRUMNAMES = [];
global.NOISENAMES = [];
global.VOICENAMES = [];
global.CUSTOMSAMPLES = [];
global.slicePath = slicePath;
global.window = { btoa: str => Buffer.from(str, "binary").toString("base64") };

// require("../musicutils") first so MUSICALMODES is filled from PITCH_COLLECTIONS the way the
// real app fills it, before this file's own require of musicutils-modecore reads the same object.
const musicutils = require("../musicutils");
const modecore = require("../musicutils-modecore");

const readSource = name => fs.readFileSync(path.join(__dirname, "..", name), "utf8");

describe("musicutils-modecore", () => {
    it("round-trips a base64 string", () => {
        expect(modecore.base64Encode("hi")).toBe("hi");
    });

    it("gives a mode's semitone numbers and a scale pattern in a non-12-EDO tuning", () => {
        expect(modecore.getModeNumbers("major")).toBe("0 2 4 5 7 9 11");
        expect(modecore.getNonEDOModeSteps("major", "equal")).toEqual([2, 2, 1, 2, 2, 2, 1]);
        expect(modecore.scalePatternToEDO([2, 2, 1, 2, 2, 2, 1], 19)).toEqual([
            3, 3, 2, 3, 3, 3, 2
        ]);
    });

    it("fills MUSICALMODES from the pitch collections, major included", () => {
        expect(modecore.MUSICALMODES.major).toEqual([2, 2, 1, 2, 2, 2, 1]);
        expect(modecore.getModePattern("major")).toEqual([2, 2, 1, 2, 2, 2, 1]);
    });

    it("captures customMode after MUSICALMODES.custom is set, not before", () => {
        // customMode = MUSICALMODES["custom"] is a one-time read, not a live reference, so the
        // assignment that fills MUSICALMODES.custom has to run first in this same file.
        expect(modecore.customMode).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
        expect(modecore.MUSICALMODES.custom).toBe(modecore.customMode);
    });

    it("has 20 chord definitions and a movable-tonic-degree table", () => {
        expect(modecore.CHORDVALUES).toHaveLength(20);
        expect(modecore.CHORDVALUES[0]).toEqual([
            [0, 0],
            [2, 0],
            [4, 0]
        ]);
        expect(Object.keys(modecore.MOVABLE_TONIC_DEGREE)).toContain("dorian");
    });

    it("encodes the note-graphic constants as base64 data URIs", () => {
        expect(modecore.wholeNoteImg).toMatch(/^data:image\/svg\+xml;base64,/);
    });

    it("is still reachable through musicutils.js for callers that require it", () => {
        for (const name of [
            "MUSICALMODES",
            "customMode",
            "getModeNumbers",
            "getNonEDOModeSteps",
            "getArticulation",
            "modeMapper",
            "getCustomNote",
            "GetNotesForInterval",
            "base64Encode",
            "scalePatternToEDO",
            "PITCH_COLLECTIONS_EDO_OVERRIDES",
            "getModePattern"
        ]) {
            expect(musicutils[name]).toBe(modecore[name]);
        }
    });

    it("exports every function and table the file declares", () => {
        const source = readSource("musicutils-modecore.js");
        const declared = [
            ...source.matchAll(/^var (\w+) =/gm),
            ...source.matchAll(/^function (\w+)\(/gm)
        ]
            .map(match => match[1])
            .filter(name => name !== "MusicUtilsModeCore");
        expect(Object.keys(modecore).sort()).toEqual(declared.sort());
    });

    it("does not define anything that musicutils.js also defines", () => {
        const remaining = readSource("musicutils.js");
        for (const name of Object.keys(modecore)) {
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

        it("loads between the mode wheel module and musicutils.js without errors", () => {
            expect(() => load(order)).not.toThrow();
        });

        it("leaves every declared name visible as a bare global", () => {
            const sandbox = load(order);
            for (const name of Object.keys(modecore)) {
                if (name === "MusicUtilsModeCore") continue;
                expect(vm.runInContext(`typeof ${name}`, sandbox)).not.toBe("undefined");
            }
        });

        it("publishes the module object for the RequireJS shim", () => {
            const sandbox = load(order);
            expect(sandbox.window.MusicUtilsModeCore.getModeNumbers("major")).toBe(
                "0 2 4 5 7 9 11"
            );
        });
    });
});
