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

const rhythm = require("../musicutils-rhythm");
const musicutils = require("../musicutils");

const readSource = name => fs.readFileSync(path.join(__dirname, "..", name), "utf8");

describe("musicutils-rhythm", () => {
    it("reduces a fraction to its lowest terms", () => {
        // toFraction and isInt used to live here too; they moved to utils-logic.js
        // (see js/utils/__tests__/utils-logic.test.js) since they are pure math with no
        // MusicBlocks-specific meaning, unlike reducedFraction's HTML/NSYMBOLS display.
        expect(rhythm.reducedFraction(4, 8)).toContain("2");
        expect(rhythm.reducedFraction(3, 9)).toContain("3");
    });

    it("converts durations to note values and rhythm-block factors", () => {
        expect(rhythm.durationToNoteValue(0.25)).toEqual([1, 0, [0.5, 0.5], 1]);
        expect(rhythm.durationToNoteValue(0.75)).toEqual([1, 0, [1.5, 0.5], 1]);
        expect(rhythm.convertFactor(0.25)).toBe("4");
        expect(rhythm.convertFactor(0.125)).toBe("8");
        expect(rhythm.convertFactor(4)).toBeNull();
    });

    it("builds the display string for a note's numerator and denominator", () => {
        expect(rhythm.calcNoteValueToDisplay(4, 0)).toContain("0");
        expect(rhythm.calcNoteValueToDisplay(4, 0)).toContain("1");
        expect(rhythm.calcNoteValueToDisplay(4, 1)).toContain("1");
        expect(rhythm.calcNoteValueToDisplay(4, 1)).toContain("4");
    });

    it("is still reachable through musicutils.js for callers that require it", () => {
        for (const name of Object.keys(rhythm)) {
            if (name === "MusicUtilsRhythm") continue;
            expect(musicutils[name]).toBe(rhythm[name]);
        }
    });

    it("exports every function the file declares", () => {
        const source = readSource("musicutils-rhythm.js");
        const declared = [...source.matchAll(/^var (\w+) =/gm)]
            .map(match => match[1])
            .filter(name => name !== "MusicUtilsRhythm");
        expect(Object.keys(rhythm).sort()).toEqual(declared.sort());
    });

    it("does not define anything that musicutils.js also defines", () => {
        const remaining = readSource("musicutils.js");
        for (const name of Object.keys(rhythm)) {
            expect(remaining).not.toMatch(new RegExp(`^(const|let|var|function) ${name}\\b`, "m"));
        }
    });

    describe("loaded as classic scripts, the way the browser does", () => {
        const order = [
            "utils-logic.js",
            "musicutils-constants.js",
            "musicutils-i18n.js",
            "musicutils-temperament.js",
            "musicutils-pitch.js",
            "musicutils-lookups.js",
            "musicutils-rhythm.js",
            "musicutils-solfege.js",
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

        it("loads between the lookups module and musicutils.js without errors", () => {
            expect(() => load(order)).not.toThrow();
        });

        it("leaves every function visible as a bare global", () => {
            const sandbox = load(order);
            for (const name of Object.keys(rhythm)) {
                if (name === "MusicUtilsRhythm") continue;
                expect(vm.runInContext(`typeof ${name}`, sandbox)).toBe("function");
            }
        });

        it("publishes the module object for the RequireJS shim", () => {
            const sandbox = load(order);
            expect(sandbox.window.MusicUtilsRhythm.reducedFraction(4, 8)).toContain("2");
        });
    });
});
