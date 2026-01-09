/**
 * MusicBlocks v3.6.2
 *
 * @author [Your Name]
 *
 * @copyright 2026 [Your Name]
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

// Mock Deps
global.platformColor = {
    selectorBackground: "#FFFFFF"
};

const { TunerDisplay, TunerUtils } = require("./tuner.js");

// Mock Document
// Mock Document
if (typeof document === "undefined") {
    global.document = {};
}
// Force mock even if JSDOM is present
document.createElement = jest.fn().mockImplementation(() => ({
    style: {},
    appendChild: jest.fn(),
    querySelector: jest.fn().mockReturnValue({ style: {} }),
    src: ""
}));
global.window = global; // Ensure window is global
global.window.platformColor = global.platformColor;

describe("TunerUtils", () => {
    test("frequencyToPitch should convert 440Hz to A", () => {
        const [note, cents, freq] = TunerUtils.frequencyToPitch(440);
        expect(note).toBe("A");
        // Cents might be slightly off due to floating point, but should be close to 0
        expect(Math.abs(cents)).toBeLessThan(1);
    });

    test("frequencyToPitch should handle C4 (approx 261.63)", () => {
        const [note, cents] = TunerUtils.frequencyToPitch(261.63);
        expect(note).toBe("C");
    });
});

describe("TunerDisplay", () => {
    let mockCanvas;
    let mockCtx;
    let tunerDisplay;

    beforeEach(() => {
        mockCtx = {
            clearRect: jest.fn(),
            fillRect: jest.fn(),
            fillText: jest.fn(),
            fillStyle: "",
            font: "",
            textAlign: ""
        };
        mockCanvas = {
            getContext: jest.fn().mockReturnValue(mockCtx),
            parentElement: {
                appendChild: jest.fn()
            }
        };

        tunerDisplay = new TunerDisplay(mockCanvas, 800, 600);
    });

    test("should initialize correctly", () => {
        expect(mockCanvas.getContext).toHaveBeenCalledWith("2d");
        expect(tunerDisplay.chromaticMode).toBe(true);
    });

    test("should toggle chromatic mode", () => {
        expect(tunerDisplay.chromaticMode).toBe(true);

        // Simulate clicking target pitch button
        tunerDisplay.targetPitchButton.onclick();
        expect(tunerDisplay.chromaticMode).toBe(false);

        // Simulate clicking chromatic button
        tunerDisplay.chromaticButton.onclick();
        expect(tunerDisplay.chromaticMode).toBe(true);
    });

    test("should draw update", () => {
        tunerDisplay.update("A", 10, 442);

        expect(tunerDisplay.note).toBe("A");
        expect(tunerDisplay.cents).toBe(10);
        expect(tunerDisplay.frequency).toBe(442);

        expect(mockCtx.clearRect).toHaveBeenCalled();
        expect(mockCtx.fillRect).toHaveBeenCalled();
        expect(mockCtx.fillText).toHaveBeenCalled();
    });
});
