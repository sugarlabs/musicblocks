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

    describe("getMeasurePosition", () => {
        const singer = overrides => ({
            pickup: 0,
            beatsPerMeasure: 4,
            noteValuePerBeat: 4,
            meterAnchor: null,
            ...overrides
        });

        it("counts beats and measures from the start without a meter change", () => {
            expect(rhythm.getMeasurePosition(singer(), 0)).toEqual({
                beat: 1,
                measure: 1,
                timeLeftInMeasure: 1
            });
            expect(rhythm.getMeasurePosition(singer(), 1.25)).toEqual({
                beat: 2,
                measure: 2,
                timeLeftInMeasure: 0.75
            });
        });

        it("reports the time left until the pickup ends", () => {
            expect(rhythm.getMeasurePosition(singer({ pickup: 0.25 }), 0)).toEqual({
                beat: 0,
                measure: 0,
                timeLeftInMeasure: 0.25
            });
            expect(rhythm.getMeasurePosition(singer({ pickup: 0.25 }), 0.25)).toEqual({
                beat: 1,
                measure: 1,
                timeLeftInMeasure: 1
            });
        });

        it("counts from the latest meter change", () => {
            // Three beats of 3/4, then 4/4 from measure 2.
            const s = singer({ meterAnchor: { wholeNotes: 0.75, measures: 1 } });
            expect(rhythm.getMeasurePosition(s, 0.75)).toEqual({
                beat: 1,
                measure: 2,
                timeLeftInMeasure: 1
            });
            expect(rhythm.getMeasurePosition(s, 2)).toEqual({
                beat: 2,
                measure: 3,
                timeLeftInMeasure: 0.75
            });
        });

        it("does not read float error as a sliver of a beat", () => {
            const position = rhythm.getMeasurePosition(singer(), 0.7 + 0.1 + 0.2);
            expect(position.beat).toBe(1);
            expect(position.measure).toBe(2);
            expect(position.timeLeftInMeasure).toBe(1);
        });
    });

    describe("getMeterAnchor", () => {
        const singer = (notesPlayed, overrides) => ({
            notesPlayed,
            pickup: 0,
            beatsPerMeasure: 3,
            noteValuePerBeat: 4,
            meterAnchor: null,
            ...overrides
        });

        it("anchors a change on a barline after the measures before it", () => {
            expect(rhythm.getMeterAnchor(singer([3, 4]))).toEqual({
                wholeNotes: 0.75,
                measures: 1
            });
        });

        it("counts a measure the change cuts short", () => {
            expect(rhythm.getMeterAnchor(singer([1, 4]))).toEqual({
                wholeNotes: 0.25,
                measures: 1
            });
        });

        it("builds on an earlier meter change", () => {
            const s = singer([7, 4], {
                beatsPerMeasure: 4,
                meterAnchor: { wholeNotes: 0.75, measures: 1 }
            });
            expect(rhythm.getMeterAnchor(s)).toEqual({ wholeNotes: 1.75, measures: 2 });
        });

        it("does not anchor before the pickup ends", () => {
            expect(rhythm.getMeterAnchor(singer([0, 1]))).toBeNull();
            expect(rhythm.getMeterAnchor(singer([1, 4], { pickup: 0.25 }))).toBeNull();
        });
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
