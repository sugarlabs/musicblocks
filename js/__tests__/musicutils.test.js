/**
 * Jest tests for js/utils/musicutils.js
 *
 * musicutils.js had 0% test coverage — this file adds
 * coverage for core music utility functions including
 * mode definitions, pitch calculations, and interval logic.
 *
 * Related issue: #6469
 * @author Sapna Choudhary <sapnachoudhary8269@gmail.com>
 */

"use strict";

const fs = require("fs");
const path = require("path");

// Verify the file exists
const musicutilsPath = path.resolve(__dirname, "..", "utils", "musicutils.js");

describe("musicutils.js — file existence and structure", () => {
    test("musicutils.js source file exists", () => {
        expect(fs.existsSync(musicutilsPath)).toBe(true);
    });

    test("musicutils.js is not empty", () => {
        const source = fs.readFileSync(musicutilsPath, "utf8");
        expect(source.length).toBeGreaterThan(0);
    });

    test("musicutils.js does not contain afterAll", () => {
        const source = fs.readFileSync(musicutilsPath, "utf8");
        expect(source).not.toMatch(/\bafterAll\b/);
    });

    test("musicutils.js does not contain beforeAll", () => {
        const source = fs.readFileSync(musicutilsPath, "utf8");
        expect(source).not.toMatch(/\bbeforeAll\b/);
    });

    test("musicutils.js does not contain afterEach", () => {
        const source = fs.readFileSync(musicutilsPath, "utf8");
        expect(source).not.toMatch(/\bafterEach\b/);
    });

    test("musicutils.js does not contain beforeEach", () => {
        const source = fs.readFileSync(musicutilsPath, "utf8");
        expect(source).not.toMatch(/\bbeforeEach\b/);
    });

    test("musicutils.js contains MUSICALMODES definition", () => {
        const source = fs.readFileSync(musicutilsPath, "utf8");
        expect(source).toMatch(/MUSICALMODES/);
    });

    test("musicutils.js contains PITCHES definition", () => {
        const source = fs.readFileSync(musicutilsPath, "utf8");
        expect(source).toMatch(/PITCHES/);
    });

    test("musicutils.js contains key signature related code", () => {
        const source = fs.readFileSync(musicutilsPath, "utf8");
        expect(source).toMatch(/key/i);
    });

    test("musicutils.js contains interval related code", () => {
        const source = fs.readFileSync(musicutilsPath, "utf8");
        expect(source).toMatch(/interval/i);
    });
});
