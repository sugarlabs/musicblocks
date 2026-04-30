// Copyright (c) 2026 Music Blocks contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* global jest, describe, it, expect, beforeEach */

const {
    AIWidget,
    adjustPitch,
    abcToStandardValue,
    createPitchBlocks,
    searchIndexForMusicBlock
} = require("../aiwidget");

// Mock globals
global._ = jest.fn(str => str);
global.docById = jest.fn(() => ({
    style: {},
    appendChild: jest.fn(),
    addEventListener: jest.fn(),
    innerHTML: ""
}));
global.toFraction = jest.fn(d => [1, d]); // Simple mock: 1/d
global.ensureABCJS = jest.fn(() => Promise.resolve());
global.Tone = {
    Analyser: jest.fn(() => ({
        connect: jest.fn(),
        dispose: jest.fn()
    }))
};
global.ABCJS = {
    parseOnly: jest.fn(() => [])
};
global.getVoiceSynthName = jest.fn(() => "mock-synth");
global.platformColor = jest.fn(() => "#000000");
global.slicePath = jest.fn(p => p);
global.DOUBLEFLAT = "𝄫";
global.FLAT = "♭";
global.NATURAL = "♮";
global.SHARP = "♯";
global.DOUBLESHARP = "𝄪";
global.instruments = [{}];
global.REFERENCESAMPLE = "electronic synth";

describe("AIWidget Utilities", () => {
    describe("adjustPitch", () => {
        it("should return the note name unchanged if no accidental matches in key signature", () => {
            const keySignature = { accidentals: [] };
            expect(adjustPitch("C", keySignature)).toBe("C");
        });

        it("should append sharp if note is in key signature as sharp", () => {
            const keySignature = {
                accidentals: [{ note: "F", acc: "sharp" }]
            };
            expect(adjustPitch("F", keySignature)).toBe("F♯");
        });

        it("should append flat if note is in key signature as flat", () => {
            const keySignature = {
                accidentals: [{ note: "B", acc: "flat" }]
            };
            expect(adjustPitch("B", keySignature)).toBe("B♭");
        });

        it("should be case-insensitive for note matching", () => {
            const keySignature = {
                accidentals: [{ note: "f", acc: "sharp" }]
            };
            expect(adjustPitch("F", keySignature)).toBe("F♯");
        });
    });

    describe("abcToStandardValue", () => {
        it("should map pitch value to octave (Math.floor(p/7) + 4)", () => {
            expect(abcToStandardValue(0)).toBe(4);
            expect(abcToStandardValue(7)).toBe(5);
            expect(abcToStandardValue(14)).toBe(6);
            expect(abcToStandardValue(-7)).toBe(3);
        });
    });

    describe("searchIndexForMusicBlock", () => {
        it("should find the index of a block by its ID", () => {
            const array = [
                [10, "start"],
                [20, "pitch"],
                [30, "hidden"]
            ];
            expect(searchIndexForMusicBlock(array, 20)).toBe(1);
            expect(searchIndexForMusicBlock(array, 30)).toBe(2);
            expect(searchIndexForMusicBlock(array, 40)).toBe(-1);
        });

        it("should handle empty or malformed arrays", () => {
            expect(searchIndexForMusicBlock([], 10)).toBe(-1);
            expect(searchIndexForMusicBlock([null, [10]], 10)).toBe(1);
        });
    });

    describe("createPitchBlocks", () => {
        it("should push the correct block structure to actionBlock", () => {
            const actionBlock = [];
            const pitches = { name: "C", pitch: 0 };
            const keySignature = { accidentals: [] };

            createPitchBlocks(pitches, 100, 4, keySignature, actionBlock, null, 4);

            // Should add 9 blocks based on the implementation
            expect(actionBlock.length).toBe(9);

            // Check newnote block
            expect(actionBlock[0][0]).toBe(100);
            expect(actionBlock[0][1][0]).toBe("newnote");

            // Check pitch block and its values
            const pitchBlock = actionBlock.find(b => b[1] === "pitch");
            expect(pitchBlock).toBeDefined();

            const notenameBlock = actionBlock.find(b => b[1].length && b[1][0] === "notename");
            expect(notenameBlock[1][1].value).toBe("C");
        });

        it("should handle triplets correctly", () => {
            const actionBlock = [];
            const pitches = { name: "C", pitch: 0 };
            const keySignature = { accidentals: [] };

            // triplet = 3, meterDen = 4. Duration becomes [1, 4 * 3]
            createPitchBlocks(pitches, 100, 4, keySignature, actionBlock, 3, 4);

            const divideBlock = actionBlock.find(b => b[1] === "divide");
            const denominatorBlockId = divideBlock[4][2];
            const denominatorBlock = actionBlock.find(b => b[0] === denominatorBlockId);

            expect(denominatorBlock[1][1].value).toBe(12); // 4 * 3
        });
    });
});

describe("AIWidget Instance", () => {
    let aiWidget;
    let mockActivity;

    beforeEach(() => {
        mockActivity = {
            logo: {
                synth: {
                    loadSynth: jest.fn()
                },
                textMsg: jest.fn()
            },
            blocks: {
                loadNewBlocks: jest.fn()
            },
            errorMsg: jest.fn(),
            textMsg: jest.fn()
        };

        // Setup widgetWindows on the global window object
        global.window.widgetWindows = {
            windowFor: jest.fn(() => ({
                clear: jest.fn(),
                show: jest.fn(),
                destroy: jest.fn(),
                sendToCenter: jest.fn(),
                isMaximized: jest.fn(() => false),
                getWidgetFrame: jest.fn(() => ({
                    getBoundingClientRect: jest.fn(() => ({ width: 800, height: 600 }))
                })),
                getWidgetBody: jest.fn(() => {
                    const div = document.createElement("div");
                    div.getBoundingClientRect = jest.fn(() => ({ width: 800, height: 600 }));
                    return div;
                }),
                addButton: jest.fn(() => ({
                    onclick: null
                })),
                addCheckbox: jest.fn(() => ({
                    onclick: null
                })),
                addSlider: jest.fn(() => ({
                    oninput: null
                })),
                addLabel: jest.fn(() => ({})),
                onclose: null,
                onmaximize: null,
                onresize: null
            }))
        };

        aiWidget = new AIWidget();
        // Since aiwidget.js uses wheelnav as a global if present
        global.wheelnav = jest.fn();
    });

    it("should initialize correctly", () => {
        aiWidget.init(mockActivity);
        expect(aiWidget.activity).toBe(mockActivity);
        expect(mockActivity.logo.synth.loadSynth).toHaveBeenCalled();
    });

    it("should handle sample length warnings", () => {
        aiWidget.init(mockActivity);
        aiWidget.sampleData = "a".repeat(1333334); // Just over the limit
        aiWidget.getSampleLength();
        expect(mockActivity.errorMsg).toHaveBeenCalledWith(
            "Warning: Sample is bigger than 1MB.",
            undefined
        );
    });
});
