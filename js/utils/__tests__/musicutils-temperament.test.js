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

    describe("what musicutils.js still exports", () => {
        it("re-exports the same tables and functions", () => {
            for (const name of [
                "PreDefinedTemperaments",
                "INITIALTEMPERAMENTS",
                "getTemperament",
                "getTemperamentsList",
                "addTemperamentToDictionary",
                "setOctaveRatio",
                "isEquallyTempered"
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
