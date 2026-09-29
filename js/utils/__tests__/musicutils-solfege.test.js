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

const solfege = require("../musicutils-solfege");
const musicutils = require("../musicutils");

const readSource = name => fs.readFileSync(path.join(__dirname, "..", name), "utf8");

describe("musicutils-solfege", () => {
    it("tells solfege names from letter names", () => {
        expect(solfege.noteIsSolfege("sol")).toBe(true);
        expect(solfege.noteIsSolfege("do")).toBe(true);
        expect(solfege.noteIsSolfege("C")).toBe(false);
    });

    it("splits a solfege note into its name and octave", () => {
        expect(solfege.splitSolfege("sol4")).toEqual(["sol", "4"]);
        expect(solfege.splitI18nSolfege("sol4")).toEqual(["sol", "4"]);
    });

    it("splits a scale degree into its number and accidental", () => {
        expect(solfege.splitScaleDegree("3")).toEqual(["3", ""]);
    });

    it("converts a fixed-solfege name to its letter class", () => {
        expect(solfege.convertFromSolfege("re")).toBe("D");
        // FIXEDSOLFEGE1 only keys bare names; octave-suffixed input passes through unchanged.
        expect(solfege.convertFromSolfege("do4")).toBe("do4");
        // EQUIVALENTNATURALS then resolves the sharp/flat spelling to its natural.
        expect(solfege.convertFromSolfege("E♯")).toBe("F");
        expect(solfege.convertFromSolfege("B♯")).toBe("C");
    });

    it("returns the seven solfege syllable names, high to low", () => {
        const notes = solfege.getI18nSolfNotes();
        expect(notes).toHaveLength(7);
        expect(notes.slice(0, 3)).toEqual(["ti", "la", "sol"]);
    });

    it("is still reachable through musicutils.js for callers that require it", () => {
        for (const name of [
            "noteIsSolfege",
            "splitSolfege",
            "i18nSolfege",
            "splitScaleDegree",
            "convertFromSolfege"
        ]) {
            expect(musicutils[name]).toBe(solfege[name]);
        }
    });

    it("exports every function the file declares", () => {
        const source = readSource("musicutils-solfege.js");
        const declared = [...source.matchAll(/^var (\w+) =/gm)]
            .map(match => match[1])
            .filter(name => name !== "MusicUtilsSolfege");
        expect(Object.keys(solfege).sort()).toEqual(declared.sort());
    });

    it("does not define anything that musicutils.js also defines", () => {
        const remaining = readSource("musicutils.js");
        for (const name of Object.keys(solfege)) {
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
            "musicutils.js"
        ];
        const load = files => {
            const sandbox = {
                TextEncoder,
                _: value => value,
                DRUMNAMES: [],
                NOISENAMES: [],
                VOICENAMES: [],
                CUSTOMSAMPLES: [],
                isUnsafeObjectKey: () => false,
                localStorage: { getItem: () => null },
                window: { btoa: value => Buffer.from(value, "binary").toString("base64") }
            };
            vm.createContext(sandbox);
            files.forEach(file => vm.runInContext(readSource(file), sandbox, { filename: file }));
            return sandbox;
        };

        it("loads between the rhythm module and musicutils.js without errors", () => {
            expect(() => load(order)).not.toThrow();
        });

        it("leaves every function visible as a bare global", () => {
            const sandbox = load(order);
            for (const name of Object.keys(solfege)) {
                if (name === "MusicUtilsSolfege") continue;
                expect(vm.runInContext(`typeof ${name}`, sandbox)).toBe("function");
            }
        });

        it("publishes the module object for the RequireJS shim", () => {
            const sandbox = load(order);
            expect(sandbox.window.MusicUtilsSolfege.noteIsSolfege("sol")).toBe(true);
        });
    });
});
