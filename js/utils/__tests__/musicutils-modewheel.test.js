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

const slicePath = () => ({ DonutSlice: "donut", DonutSliceCustomization: () => ({}) });

global.TextEncoder = TextEncoder;
global._ = jest.fn(str => str);
global.slicePath = slicePath;
global.window = { btoa: str => Buffer.from(str, "binary").toString("base64") };

const modewheel = require("../musicutils-modewheel");
const musicutils = require("../musicutils");

const readSource = name => fs.readFileSync(path.join(__dirname, "..", name), "utf8");

describe("musicutils-modewheel", () => {
    it("labels the major/ionian and minor/aeolian pairs together", () => {
        expect(modewheel.getModeLabel("major")).toBe("major / ionian");
        expect(modewheel.getModeLabel("minor")).toBe("minor / aeolian");
        expect(modewheel.getModeLabel("dorian")).toBe("dorian");
    });

    it("goes from a wheel label back to a mode name", () => {
        expect(modewheel.getModeNameFromLabel("major / ionian", [])).toBe("major");
        expect(modewheel.getModeNameFromLabel("minor / aeolian", [])).toBe("aeolian");
        expect(modewheel.getModeNameFromLabel("dorian", ["dorian", "phrygian"])).toBe("dorian");
    });

    it("lists the mode names for a pie-menu group, padding custom slots", () => {
        expect(modewheel.getModeNamesForGroup("7")).toHaveLength(12);
        expect(modewheel.getModeNamesForGroup("custom", ["a", "b"])).toEqual([
            "a",
            "b",
            " ",
            " ",
            " ",
            " ",
            " ",
            " ",
            " ",
            " ",
            " ",
            " "
        ]);
    });

    it("colors empty slots differently from filled ones", () => {
        expect(
            modewheel.getModeSliceColors(["major", " ", "minor"], {
                emptyColor: "gray",
                filledColor: "blue"
            })
        ).toEqual(["blue", "gray", "blue"]);
    });

    it("sizes the group title and slice fonts to the wheel radius", () => {
        expect(modewheel.getModeGroupTitleFont(100)).toBe("100 8px sans-serif");
        expect(modewheel.getModeSliceFont(100, 7, 10)).toContain("sans-serif");
    });

    it("has no saved custom modes by default", () => {
        expect(modewheel.getSavedCustomModes()).toEqual([]);
    });

    it("is still reachable through musicutils.js for callers that require it", () => {
        for (const name of Object.keys(modewheel)) {
            if (name === "MusicUtilsModeWheel") continue;
            expect(musicutils[name]).toBe(modewheel[name]);
        }
    });

    it("exports every function the file declares", () => {
        const source = readSource("musicutils-modewheel.js");
        const declared = [...source.matchAll(/^var (\w+) =/gm)]
            .map(match => match[1])
            .filter(name => name !== "MusicUtilsModeWheel");
        expect(Object.keys(modewheel).sort()).toEqual(declared.sort());
    });

    it("does not define anything that musicutils.js also defines", () => {
        const remaining = readSource("musicutils.js");
        for (const name of Object.keys(modewheel)) {
            expect(remaining).not.toMatch(new RegExp(`^(const|let|var|function) ${name}\\b`, "m"));
        }
    });

    describe("loaded as classic scripts, the way the browser does", () => {
        const order = [
            "piemenu.js",
            "musicutils-constants.js",
            "musicutils-i18n.js",
            "musicutils-temperament.js",
            "musicutils-pitch.js",
            "musicutils-lookups.js",
            "musicutils-rhythm.js",
            "musicutils-solfege.js",
            "musicutils-modewheel.js",
            "musicutils-modecore.js",
            "musicutils.js"
        ];
        const load = files => {
            const sandbox = {
                TextEncoder,
                _: value => value,
                slicePath,
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

        it("loads between the solfege module and musicutils.js without errors", () => {
            expect(() => load(order)).not.toThrow();
        });

        it("leaves every function visible as a bare global", () => {
            const sandbox = load(order);
            for (const name of Object.keys(modewheel)) {
                if (name === "MusicUtilsModeWheel") continue;
                expect(vm.runInContext(`typeof ${name}`, sandbox)).toBe("function");
            }
        });

        it("publishes the module object for the RequireJS shim", () => {
            const sandbox = load(order);
            expect(sandbox.window.MusicUtilsModeWheel.getModeLabel("major")).toBe("major / ionian");
        });
    });
});
