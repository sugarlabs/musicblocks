/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Om Santosh Suneri
 */

const Singer = require("../turtle-singer");

describe("Singer (Minimal AMD Implementation)", () => {
    test("should initialize with correct default values passed from logoconstants", () => {
        const singer = new Singer();

        // These values match the ones in our minimal logoconstants.js
        expect(singer.masterBPM).toBe(90);
        expect(singer.defaultBPMFactor).toBe(240 / 90);
        expect(singer.masterVolume).toEqual([50]);
    });
});
