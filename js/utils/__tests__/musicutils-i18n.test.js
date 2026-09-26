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

const i18n = require("../musicutils-i18n");
const musicutils = require("../musicutils");

const readSource = name => fs.readFileSync(path.join(__dirname, "..", name), "utf8");

describe("musicutils-i18n", () => {
    it("keeps the translated tables moved out of musicutils.js intact", () => {
        expect(i18n.INVERTMODES).toEqual([
            ["even", "even"],
            ["odd", "odd"],
            ["scalar", "scalar"]
        ]);
        expect(i18n.FILTERTYPES).toHaveLength(8);
        expect(i18n.OSCTYPES.length).toBeGreaterThan(0);
        expect(i18n.INTERVALS.length).toBeGreaterThan(0);
        expect(i18n.DEGREES).toBe("1st 2nd 3rd 4th 5th 6th 7th 8th 9th 10th 11th 12th");
        expect(i18n.ACCIDENTALLABELS).toEqual([
            "double sharp \uD834\uDD2A",
            "sharp \u266F",
            "natural \u266E",
            "flat \u266D",
            "double flat \uD834\uDD2B"
        ]);
    });

    it("exports every table the file declares", () => {
        const declared = [...readSource("musicutils-i18n.js").matchAll(/^var (\w+) =/gm)]
            .map(match => match[1])
            .filter(name => name !== "MusicUtilsI18n");
        expect(Object.keys(i18n).sort()).toEqual(declared.sort());
    });

    it("is still reachable through musicutils.js for callers that require it", () => {
        for (const name of ["FIXEDSOLFEGE1", "SEMITONETOINTERVALMAP"]) {
            expect(musicutils[name]).toBe(i18n[name]);
        }
    });

    it("does not define anything that musicutils.js also defines", () => {
        const remaining = readSource("musicutils.js");
        for (const name of Object.keys(i18n)) {
            if (name === "MusicUtilsI18n") continue;
            expect(remaining).not.toMatch(new RegExp(`^(const|let|var) ${name}\\b`, "m"));
        }
    });

    describe("loaded as classic scripts, the way the browser does", () => {
        const load = (files, translate) => {
            const sandbox = {
                TextEncoder,
                _: translate,
                localStorage: { getItem: () => null },
                window: { btoa: value => Buffer.from(value, "binary").toString("base64") }
            };
            vm.createContext(sandbox);
            files.forEach(file => vm.runInContext(readSource(file), sandbox, { filename: file }));
            return sandbox;
        };
        const order = ["musicutils-constants.js", "musicutils-i18n.js", "musicutils.js"];

        it("loads between the constants and musicutils.js without redeclaration errors", () => {
            expect(() => load(order, value => value)).not.toThrow();
        });

        it("leaves every table visible as a bare global to later scripts", () => {
            const sandbox = load(order, value => value);
            for (const name of Object.keys(i18n)) {
                expect(vm.runInContext(`typeof ${name}`, sandbox)).not.toBe("undefined");
            }
        });

        it("still translates the labels once, when it loads", () => {
            const translate = jest.fn(value => `T(${value})`);
            const sandbox = load(order, translate);
            expect(vm.runInContext("DEGREES", sandbox)).toBe(
                "T(1st 2nd 3rd 4th 5th 6th 7th 8th 9th 10th 11th 12th)"
            );
            expect(vm.runInContext("INVERTMODES[0]", sandbox)).toEqual(["T(even)", "even"]);
            expect(vm.runInContext("ACCIDENTALLABELS[1]", sandbox)).toBe("T(sharp) \u266F");
            expect(translate).toHaveBeenCalled();
        });

        it("publishes the module object for the RequireJS shim", () => {
            const sandbox = load(order, value => value);
            expect(sandbox.window.MusicUtilsI18n.DEGREES).toBe(i18n.DEGREES);
        });
    });
});
