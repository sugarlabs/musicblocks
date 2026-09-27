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
const DRUMNAMES = [
    ["drum kit", "drum kit", "drum kit", "forest", 1],
    ["kick drum", "kick drum", "kick", "kick", 1]
];
const NOISENAMES = [["white noise", "white noise", "white", "white", 1]];
const VOICENAMES = [["electronic synth", "electronic synth", "synth", "synth", 1]];

global.TextEncoder = TextEncoder;
global._ = jest.fn(str => str);
global.isUnsafeObjectKey = isUnsafeObjectKey;
global.DRUMNAMES = DRUMNAMES;
global.NOISENAMES = NOISENAMES;
global.VOICENAMES = VOICENAMES;
global.CUSTOMSAMPLES = [];
global.window = { btoa: str => Buffer.from(str, "binary").toString("base64") };

const lookups = require("../musicutils-lookups");
const musicutils = require("../musicutils");

const readSource = name => fs.readFileSync(path.join(__dirname, "..", name), "utf8");

describe("musicutils-lookups", () => {
    it("looks drums, noises and voices up by name", () => {
        expect(lookups.getDrumName("kick drum")).toBe("kick drum");
        expect(lookups.getDrumIndex("kick drum")).toBe(1);
        expect(lookups.getDrumIndex("not a drum")).toBe(-1);
        expect(lookups.getDrumSymbol("kick drum")).toBe("kick");
        expect(lookups.getDrumIcon("kick drum")).toBe("kick");
        expect(lookups.getDrumSynthName("kick drum")).toBe("kick drum");
        expect(lookups.getNoiseName("white noise")).toBe("white noise");
        expect(lookups.getNoiseIcon("white noise")).toBe("white");
        expect(lookups.getNoiseSynthName("white noise")).toBe("white noise");
        expect(lookups.getVoiceName("electronic synth")).toBe("electronic synth");
        expect(lookups.getVoiceIcon("electronic synth")).toBe("synth");
        expect(lookups.getVoiceSynthName("electronic synth")).toBe("electronic synth");
    });

    it("handles non-string inputs safely without throwing", () => {
        expect(lookups.getDrumName(undefined)).toBeNull();
        expect(lookups.getDrumIndex(123)).toBe(-1);
        expect(lookups.getDrumSymbol(null)).toBe("hh");
        expect(lookups.getDrumIcon({})).toBe("images/drum.svg");
        expect(lookups.getDrumSynthName(undefined)).toBeNull();

        expect(lookups.getNoiseName(123)).toBe("noise1");
        expect(lookups.getNoiseIcon({})).toBe("images/synth.svg");
        expect(lookups.getNoiseSynthName(undefined)).toBeNull();

        expect(lookups.getVoiceName(123)).toBe("electronic synth");
        expect(lookups.getVoiceIcon({})).toBe("images/voices.svg");
        expect(lookups.getVoiceSynthName(undefined)).toBeNull();
    });

    it("looks up invert modes, intervals, filters and oscillators", () => {
        expect(lookups.getInvertMode("even")).toBe("even");
        expect(lookups.getIntervalNumber("perfect 5")).toBe(7);
        expect(lookups.getIntervalDirection("perfect 5")).toBe(0);
        expect(lookups.getIntervalRatio("perfect 5")).toBeCloseTo(1.5, 5);
        expect(lookups.getFilterTypes("highpass")).toBe("highpass");
        expect(lookups.getOscillatorTypes("sine")).toBe("sine");
    });

    it("maps MIDI instrument, drum and reverse-drum tables", () => {
        expect(lookups.getMidiInstrument().piano).toBe(0);
        expect(lookups.getMidiDrum()["kick drum"]).toBe(36);
        expect(lookups.getReverseDrumMidi()[36]).toEqual(["kick drum"]);
    });

    it("is still reachable through musicutils.js for callers that require it", () => {
        for (const name of [
            "getInvertMode",
            "getIntervalNumber",
            "getIntervalDirection",
            "getIntervalRatio",
            "getDrumIndex",
            "getDrumName",
            "getDrumSymbol",
            "getFilterTypes",
            "getOscillatorTypes",
            "getDrumIcon",
            "getDrumSynthName",
            "getNoiseName",
            "getNoiseIcon",
            "getNoiseSynthName",
            "getVoiceName",
            "getVoiceIcon",
            "getVoiceSynthName"
        ]) {
            expect(musicutils[name]).toBe(lookups[name]);
        }
    });

    it("leaves getMidiInstrument, getMidiDrum and getReverseDrumMidi as browser globals only", () => {
        // js/midi.js, js/mxml.js and js/SaveInterface.js call these three by bare name as
        // classic-script globals; musicutils.js's own CommonJS exports never included them,
        // before or after this file existed, so `require("../musicutils")` still does not.
        for (const name of ["getMidiInstrument", "getMidiDrum", "getReverseDrumMidi"]) {
            expect(musicutils[name]).toBeUndefined();
            expect(lookups[name]).toBeInstanceOf(Function);
        }
    });

    it("exports every function the file declares", () => {
        const source = readSource("musicutils-lookups.js");
        const declared = [...source.matchAll(/^var (\w+) =/gm)]
            .map(match => match[1])
            .filter(name => name !== "MusicUtilsLookups");
        expect(Object.keys(lookups).sort()).toEqual(declared.sort());
    });

    it("does not define anything that musicutils.js also defines", () => {
        const remaining = readSource("musicutils.js");
        for (const name of Object.keys(lookups)) {
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
            "musicutils.js"
        ];
        const load = files => {
            const sandbox = {
                TextEncoder,
                _: value => value,
                isUnsafeObjectKey,
                DRUMNAMES,
                NOISENAMES,
                VOICENAMES,
                CUSTOMSAMPLES: [],
                localStorage: { getItem: () => null },
                window: { btoa: value => Buffer.from(value, "binary").toString("base64") }
            };
            vm.createContext(sandbox);
            files.forEach(file => vm.runInContext(readSource(file), sandbox, { filename: file }));
            return sandbox;
        };

        it("loads between the pitch module and musicutils.js without errors", () => {
            expect(() => load(order)).not.toThrow();
        });

        it("leaves every function visible as a bare global", () => {
            const sandbox = load(order);
            for (const name of Object.keys(lookups)) {
                if (name === "MusicUtilsLookups") continue;
                expect(vm.runInContext(`typeof ${name}`, sandbox)).toBe("function");
            }
        });

        it("publishes the module object for the RequireJS shim", () => {
            const sandbox = load(order);
            expect(sandbox.window.MusicUtilsLookups.getDrumName("kick drum")).toBe("kick drum");
        });
    });
});
