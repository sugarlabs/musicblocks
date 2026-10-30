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

global.TextEncoder = TextEncoder;
global._ = jest.fn(str => str);
global.isUnsafeObjectKey = isUnsafeObjectKey;
global.window = { btoa: str => Buffer.from(str, "binary").toString("base64") };

const temperament = require("../musicutils-temperament");
const musicutils = require("../musicutils");

const readSource = name => fs.readFileSync(path.join(__dirname, "..", name), "utf8");

describe("musicutils-temperament", () => {
    const custom = { pitchNumber: 1, octaveRatio: 2, 0: [1, "C", 4] };

    afterEach(() => {
        temperament.deleteTemperamentFromList("myTemperament");
        temperament.updateTemperaments();
        temperament.setOctaveRatio(2);
    });

    describe("the octave ratio", () => {
        it("starts at 2 and follows setOctaveRatio", () => {
            expect(temperament.getOctaveRatio()).toBe(2);
            temperament.setOctaveRatio(3);
            expect(temperament.getOctaveRatio()).toBe(3);
        });

        it("is the same value when read through musicutils.js", () => {
            temperament.setOctaveRatio(1.5);
            expect(musicutils.getOctaveRatio()).toBe(1.5);
            temperament.setOctaveRatio(2);
        });
    });

    describe("getEffectiveOctaveRatio", () => {
        it("defaults to 2 when temperament is unspecified or equal", () => {
            expect(temperament.getEffectiveOctaveRatio()).toBe(2);
            expect(temperament.getEffectiveOctaveRatio("equal")).toBe(2);
            expect(temperament.getEffectiveOctaveRatio("just intonation")).toBe(2);
        });

        it("reads octaveRatio from custom temperament object or dictionary entry", () => {
            const customStretched = { octaveRatio: 2.01, isEDO: true, pitchNumber: 12 };
            expect(temperament.getEffectiveOctaveRatio(customStretched)).toBe(2.01);

            temperament.addTemperamentToDictionary("stretched12", customStretched);
            expect(temperament.getEffectiveOctaveRatio("stretched12")).toBe(2.01);
            temperament.deleteTemperamentFromList("stretched12");
        });

        it("falls back to global getOctaveRatio when temperament lacks octaveRatio", () => {
            temperament.setOctaveRatio(3);
            expect(temperament.getEffectiveOctaveRatio({})).toBe(3);
            expect(temperament.getEffectiveOctaveRatio(null)).toBe(3);
            temperament.setOctaveRatio(2);
        });

        it("ignores invalid temperament and global octave ratios", () => {
            temperament.setOctaveRatio(3);
            for (const octaveRatio of [null, 0, 1, -2, Infinity, "not a ratio"]) {
                expect(temperament.getEffectiveOctaveRatio({ octaveRatio })).toBe(3);
            }

            for (const globalRatio of [0, NaN, Infinity]) {
                temperament.setOctaveRatio(globalRatio);
                expect(temperament.getEffectiveOctaveRatio({})).toBe(2);
            }
        });

        it("detects equal division of non-octave periods in isEquallyTempered", () => {
            const bpRatios = Array.from({ length: 13 }, (_, i) => Math.pow(3, i / 13));
            const bpTemperament = {
                octaveRatio: 3,
                pitchNumber: 13,
                ratios: bpRatios
            };
            expect(temperament.isEquallyTempered(bpTemperament)).toBe(true);

            const stretched19 = {
                octaveRatio: 2.02,
                pitchNumber: 19,
                ratios: Array.from({ length: 19 }, (_, i) => Math.pow(2.02, i / 19))
            };
            expect(temperament.isEquallyTempered(stretched19)).toBe(true);
        });
    });

    describe("the temperament dictionary and list", () => {
        it("adds and removes a temperament in the dictionary", () => {
            temperament.addTemperamentToDictionary("myTemperament", custom);
            expect(temperament.getTemperament("myTemperament")).toBe(custom);
            expect(temperament.getTemperamentKeys()).toContain("myTemperament");
            expect(temperament.isCustomTemperament("myTemperament")).toBe(true);

            temperament.deleteTemperamentFromList("myTemperament");
            expect(temperament.getTemperament("myTemperament")).toBeUndefined();
        });

        it("refuses unsafe keys instead of letting them replace the prototype", () => {
            temperament.addTemperamentToDictionary("__proto__", custom);
            // Assigning to __proto__ would make the entry's own fields look like temperaments.
            expect(temperament.getTemperament("pitchNumber")).toBeUndefined();
            expect(temperament.getTemperamentKeys()).not.toContain("pitchNumber");
        });

        it("picks up a new dictionary entry when the list is rebuilt", () => {
            const before = temperament.getTemperamentsList();
            temperament.addTemperamentToDictionary("myTemperament", custom);
            temperament.updateTemperaments();

            const after = temperament.getTemperamentsList();
            expect(after).not.toBe(before);
            expect(after).toContainEqual(["myTemperament", "myTemperament", "myTemperament"]);
            expect(temperament.getTemperamentName("myTemperament")).toBe("myTemperament");
        });

        it("does not add the same list entry twice", () => {
            const entry = ["Once", "once", "once"];
            temperament.addTemperamentToList(entry);
            temperament.addTemperamentToList([...entry]);
            expect(temperament.getTemperamentsList().filter(e => e[1] === "once")).toHaveLength(1);
        });

        it("keeps the names of the built-in temperaments", () => {
            expect(temperament.getTemperamentName("equal")).toBe("equal");
            expect(temperament.getTemperamentName("Equal (12EDO)")).toBe("equal");
            expect(temperament.getTemperamentName("not a temperament")).toBe("equal");
        });
    });

    describe("getEdoNoteNamePosition", () => {
        it("resolves enharmonic note spellings in 12-EDO via EQUIVALENTNATURALS", () => {
            expect(temperament.getEdoNoteNamePosition("E♯", 12)).toBe(5);
            expect(temperament.getEdoNoteNamePosition("B♯", 12)).toBe(0);
            expect(temperament.getEdoNoteNamePosition("C♭", 12)).toBe(11);
            expect(temperament.getEdoNoteNamePosition("F♭", 12)).toBe(4);
        });

        it("resolves ASCII single and double accidental spellings in 12-EDO", () => {
            expect(temperament.getEdoNoteNamePosition("E#", 12)).toBe(5);
            expect(temperament.getEdoNoteNamePosition("B#", 12)).toBe(0);
            expect(temperament.getEdoNoteNamePosition("Cb", 12)).toBe(11);
            expect(temperament.getEdoNoteNamePosition("Fb", 12)).toBe(4);
            expect(temperament.getEdoNoteNamePosition("D##", 12)).toBe(4);
            expect(temperament.getEdoNoteNamePosition("Cbb", 12)).toBe(10);
            expect(temperament.getEdoNoteNamePosition("Fbb", 12)).toBe(3);
        });

        it("resolves double-accidental natural and chained equivalents in 12-EDO", () => {
            expect(temperament.getEdoNoteNamePosition("D𝄪", 12)).toBe(4);
            expect(temperament.getEdoNoteNamePosition("D♯♯", 12)).toBe(4);
            expect(temperament.getEdoNoteNamePosition("A𝄪", 12)).toBe(11);
            expect(temperament.getEdoNoteNamePosition("C𝄫", 12)).toBe(10);
            expect(temperament.getEdoNoteNamePosition("C♭♭", 12)).toBe(10);
            expect(temperament.getEdoNoteNamePosition("F𝄫", 12)).toBe(3);
            expect(temperament.getEdoNoteNamePosition("F♭♭", 12)).toBe(3);
            expect(temperament.getEdoNoteNamePosition("B𝄪", 12)).toBe(1);
            expect(temperament.getEdoNoteNamePosition("E𝄪", 12)).toBe(6);
        });

        it("keeps resolving standard sharps and flats in 12-EDO", () => {
            expect(temperament.getEdoNoteNamePosition("C♯", 12)).toBe(1);
            expect(temperament.getEdoNoteNamePosition("D♭", 12)).toBe(1);
            expect(temperament.getEdoNoteNamePosition("F♯", 12)).toBe(6);
            expect(temperament.getEdoNoteNamePosition("G♭", 12)).toBe(6);
            expect(temperament.getEdoNoteNamePosition("A", 12)).toBe(9);
        });

        it("preserves non-12 EDO distinct pitch positions", () => {
            expect(temperament.getEdoNoteNamePosition("E♯", 19)).toBe(7);
            expect(temperament.getEdoNoteNamePosition("F", 19)).toBe(8);
            expect(temperament.getEdoNoteNamePosition("B♯", 19)).toBe(18);
            expect(temperament.getEdoNoteNamePosition("C", 19)).toBe(0);
            expect(temperament.getEdoNoteNamePosition("C♯", 19)).toBe(1);
            expect(temperament.getEdoNoteNamePosition("D♭", 19)).toBe(2);
        });

        it("returns -1 for invalid or unresolvable pitch names", () => {
            expect(temperament.getEdoNoteNamePosition("H", 12)).toBe(-1);
            expect(temperament.getEdoNoteNamePosition("invalid", 12)).toBe(-1);
        });
    });

    describe("edoTransposition", () => {
        const { edoTransposition } = temperament;
        const play = (note, octave, [transposition, inSteps], temperamentName) =>
            musicutils
                .getNote(
                    note,
                    octave,
                    transposition,
                    "C major",
                    false,
                    null,
                    null,
                    temperamentName,
                    inSteps
                )
                .slice(0, 2);

        test("is the plain sum in 12 EDO", () => {
            expect(edoTransposition(4, 3, 12)).toEqual([7, false]);
            expect(edoTransposition(0.5, 2, 12)).toEqual([2.5, false]);
        });

        test("keeps steps as they are and rounds semitones to steps outside 12 EDO", () => {
            expect(edoTransposition(0, 6, 19)).toEqual([6, true]);
            expect(edoTransposition(4, 0, 19)).toEqual([6, true]);
            expect(edoTransposition(1, 19, 19)).toEqual([21, true]);
        });

        test.each([
            ["equal19", 19, 2, ["E", 4]],
            ["equal19", 19, 4, ["G", 4]],
            ["equal19", 19, -2, ["A", 3]],
            ["equal31", 31, 2, ["E", 4]],
            ["equal31", 31, 4, ["G", 4]],
            ["equal17", 17, 2, ["E", 4]]
        ])(
            "%s (%i EDO): scalar interval %i from C4 lands on %j",
            (temperamentName, edo, interval, expected) => {
                const steps = musicutils.getInterval(interval, "C major", "C", edo);
                expect(play("C", 4, edoTransposition(0, steps, edo), temperamentName)).toEqual(
                    expected
                );
            }
        );

        test("a register of one octave moves C4 to C5 and C3 in 19 EDO", () => {
            expect(play("C", 4, edoTransposition(0, 19, 19), "equal19")).toEqual(["C", 5]);
            expect(play("C", 4, edoTransposition(0, -19, 19), "equal19")).toEqual(["C", 3]);
        });

        test("a semitone interval still converts to steps in 19 EDO", () => {
            expect(play("C", 4, edoTransposition(4, 0, 19), "equal19")).toEqual(["E", 4]);
        });
    });

    describe("what musicutils.js still exports", () => {
        it("re-exports the same tables and functions", () => {
            for (const name of [
                "PreDefinedTemperaments",
                "INITIALTEMPERAMENTS",
                "getTemperament",
                "getTemperamentsList",
                "addTemperamentToDictionary",
                "setOctaveRatio",
                "getEffectiveOctaveRatio",
                "isEquallyTempered",
                "edoTransposition"
            ]) {
                expect(musicutils[name]).toBe(temperament[name]);
            }
        });

        it("exports the list the module started with, as it always has", () => {
            expect(musicutils.TEMPERAMENTS).toBe(temperament.TEMPERAMENTS);
        });
    });

    it("exports every table and function the file declares", () => {
        const source = readSource("musicutils-temperament.js");
        const declared = [
            ...source.matchAll(/^var (\w+) =/gm),
            ...source.matchAll(/^function (\w+)\(/gm)
        ]
            .map(match => match[1])
            .filter(name => name !== "MusicUtilsTemperament" && name !== "octaveRatio");
        // octaveRatio is reassigned by setOctaveRatio, so it is read through getOctaveRatio.
        expect(Object.keys(temperament).sort()).toEqual(declared.sort());
    });

    it("does not define anything that musicutils.js also defines", () => {
        const remaining = readSource("musicutils.js");
        for (const name of [...Object.keys(temperament), "octaveRatio"]) {
            if (name === "MusicUtilsTemperament") continue;
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
                localStorage: { getItem: () => null },
                window: { btoa: value => Buffer.from(value, "binary").toString("base64") }
            };
            vm.createContext(sandbox);
            files.forEach(file => vm.runInContext(readSource(file), sandbox, { filename: file }));
            return sandbox;
        };

        it("loads between the i18n tables and musicutils.js without redeclaration errors", () => {
            expect(() => load(order)).not.toThrow();
        });

        it("leaves every table and function visible as a bare global", () => {
            const sandbox = load(order);
            for (const name of [...Object.keys(temperament), "octaveRatio"]) {
                if (name === "MusicUtilsTemperament") continue;
                expect(vm.runInContext(`typeof ${name}`, sandbox)).not.toBe("undefined");
            }
        });

        it("shares the reassigned octave ratio between the two files", () => {
            const sandbox = load(order);
            vm.runInContext("setOctaveRatio(3)", sandbox);
            expect(vm.runInContext("getOctaveRatio()", sandbox)).toBe(3);
            expect(vm.runInContext("octaveRatio", sandbox)).toBe(3);
        });

        it("lets musicutils.js see temperaments added and listed through the other file", () => {
            const sandbox = load(order);
            vm.runInContext(
                "addTemperamentToDictionary('myTemperament', { pitchNumber: 1, octaveRatio: 2 })",
                sandbox
            );
            // isCustomTemperament lives in the temperament file, getNote in musicutils.js.
            expect(vm.runInContext("isCustomTemperament('myTemperament')", sandbox)).toBe(true);
            expect(vm.runInContext("getTemperamentKeys().includes('myTemperament')", sandbox)).toBe(
                true
            );

            const before = vm.runInContext("getTemperamentsList()", sandbox);
            vm.runInContext("updateTemperaments()", sandbox);
            const after = vm.runInContext("getTemperamentsList()", sandbox);
            expect(after).not.toBe(before);
            expect(JSON.stringify(after)).toContain('"myTemperament"');
        });

        it("publishes the module object for the RequireJS shim", () => {
            const sandbox = load(order);
            expect(sandbox.window.MusicUtilsTemperament.getOctaveRatio()).toBe(2);
        });
    });
});
