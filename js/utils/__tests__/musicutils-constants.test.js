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

global.TextEncoder = TextEncoder;
global._ = jest.fn(str => str);
global.window = { btoa: str => Buffer.from(str, "binary").toString("base64") };

const constants = require("../musicutils-constants");
const musicutils = require("../musicutils");

const readSource = name => fs.readFileSync(path.join(__dirname, "..", name), "utf8");

describe("musicutils-constants", () => {
    it("keeps the tables and numeric constants moved out of musicutils.js intact", () => {
        expect(constants.SHARP).toBe("♯");
        expect(constants.FLAT).toBe("♭");
        expect(constants.NOTESSHARP).toHaveLength(12);
        expect(constants.NOTESFLAT).toHaveLength(12);
        expect(constants.SOLFEGENAMES).toEqual(["do", "re", "mi", "fa", "sol", "la", "ti"]);
        expect(constants.NOTENAMES).toEqual(["C", "D", "E", "F", "G", "A", "B"]);
        expect(constants.SEMITONES).toBe(12);
        expect(constants.CENTS_PER_OCTAVE).toBe(1200);
        expect(constants.A0).toBe(27.5);
    });

    it("keeps the chord, default and mode tables intact", () => {
        expect(constants.ACCIDENTALVALUES).toEqual([2, 1, 0, -1, -2]);
        expect(constants.DEFAULTCHORD).toBe(constants.CHORDNAMES[9]);
        expect(constants.DEFAULTMODE).toBe("major");
        expect(constants.DEFAULTACCIDENTAL).toBe("natural " + constants.NATURAL);
        expect(constants.SOLFMAPPER).toHaveLength(12);
        expect(Object.keys(constants.PITCH_COLLECTIONS)).toContain("12");
        expect(constants.MODEPIEMENU_SLOT_COUNT).toBe(12);
    });

    it("is still reachable through musicutils.js for callers that require it", () => {
        for (const name of [
            "SHARP",
            "NOTESFLAT",
            "PITCHES",
            "ACCIDENTALNAMES",
            "INTERVALVALUES",
            "DEFAULTMODE"
        ]) {
            expect(musicutils[name]).toBe(constants[name]);
        }
    });

    it("does not define anything that musicutils.js also defines", () => {
        const remaining = readSource("musicutils.js");
        for (const name of Object.keys(constants)) {
            if (name === "MusicUtilsConstants") continue;
            expect(remaining).not.toMatch(new RegExp(`^(const|let|var) ${name}\\b`, "m"));
        }
    });

    describe("loaded as classic scripts, the way the browser does", () => {
        const load = files => {
            const sandbox = {
                TextEncoder,
                _: value => value,
                localStorage: { getItem: () => null },
                window: { btoa: value => Buffer.from(value, "binary").toString("base64") }
            };
            vm.createContext(sandbox);
            files.forEach(file => vm.runInContext(readSource(file), sandbox, { filename: file }));
            return sandbox;
        };

        it("loads before musicutils.js without redeclaration errors", () => {
            // A hoisted `var` in musicutils.js cannot redeclare a top-level `const`,
            // which would stop the whole app from starting.
            expect(() => load(["musicutils-constants.js", "musicutils.js"])).not.toThrow();
        });

        it("leaves every constant visible as a bare global to later scripts", () => {
            const sandbox = load(["musicutils-constants.js", "musicutils.js"]);
            for (const name of Object.keys(constants)) {
                expect(vm.runInContext(`typeof ${name}`, sandbox)).not.toBe("undefined");
            }
        });

        it("publishes the module object for the RequireJS shim", () => {
            const sandbox = load(["musicutils-constants.js"]);
            expect(sandbox.window.MusicUtilsConstants.SEMITONES).toBe(12);
        });
    });
});
