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

const PitchSlider = require("./pitchslider.js");

// Mock Deps
global._ = msg => msg;
global.Tone = {
    AMSynth: jest.fn().mockImplementation(() => ({
        toDestination: jest.fn().mockReturnThis(),
        triggerRelease: jest.fn(),
        triggerAttack: jest.fn(),
        triggerAttackRelease: jest.fn(),
        frequency: {
            linearRampToValueAtTime: jest.fn()
        }
    })),
    now: jest.fn().mockReturnValue(0)
};

if (typeof window === "undefined") {
    global.window = {};
}
window.widgetWindows = {
    openWindows: {},
    windowFor: jest.fn().mockReturnValue({
        _toolbar: { appendChild: jest.fn() },
        addRangeSlider: jest.fn().mockReturnValue({
            value: 400,
            addEventListener: jest.fn(),
            dispatchEvent: jest.fn()
        }),
        addButton: jest.fn().mockImplementation(() => ({ onclick: () => {} })),
        destroy: jest.fn(),
        sendToCenter: jest.fn()
    })
};

if (typeof document === "undefined") {
    global.document = {
        addEventListener: jest.fn(),
        createElement: jest.fn().mockReturnValue({
            style: {},
            appendChild: jest.fn(),
            innerHTML: ""
        })
    };
} else {
    document.addEventListener = jest.fn();
    document.createElement = jest.fn().mockReturnValue({
        style: {},
        appendChild: jest.fn(),
        innerHTML: ""
    });
}

describe("PitchSlider", () => {
    let pitchSlider;
    let mockActivity;

    beforeEach(() => {
        mockActivity = {
            logo: {},
            blocks: {
                palettes: { dict: {} },
                loadNewBlocks: jest.fn()
            },
            refreshCanvas: jest.fn(),
            textMsg: jest.fn()
        };

        pitchSlider = new PitchSlider();
    });

    test("should initialize correctly", () => {
        pitchSlider.init(mockActivity);
        expect(global.Tone.AMSynth).toHaveBeenCalled();
        expect(window.widgetWindows.windowFor).toHaveBeenCalled();
        expect(mockActivity.textMsg).toHaveBeenCalled();
    });

    test("should update frequency on slider input", () => {
        pitchSlider.init(mockActivity);

        // Find loop over frequencies
        // In init: frequencies = [392] default
        // MakeToolbar(0) called. window.addRangeSlider called.

        const slider = pitchSlider.sliders[0];
        slider.value = 440;
        slider.oninput();

        expect(pitchSlider.frequencies[0]).toBe(440);
        // Expect oscillator attack
        // We know oscillators are in local scope of init, but we can verify Tone logic via mocks?
        // Actually since oscillators are private in init, we can't easily access them directly
        // unless we spy on the mock instances.
        // But we DO verify that sliders[0] exists.
    });

    test("should move up/down with buttons", () => {
        pitchSlider.init(mockActivity);
        const widgetWindow = window.widgetWindows.windowFor();

        // Buttons: Up, Down, Save
        const upBtn = widgetWindow.addButton.mock.results[0].value;
        const downBtn = widgetWindow.addButton.mock.results[1].value;

        const startFreq = 440;
        pitchSlider.sliders[0].value = startFreq;
        pitchSlider.frequencies[0] = startFreq;

        // Click Up
        upBtn.onclick();
        // Should multiply by SEMITONE (approx 1.059)
        expect(parseFloat(pitchSlider.sliders[0].value)).toBeGreaterThan(startFreq);

        const higherFreq = parseFloat(pitchSlider.sliders[0].value);

        // Click Down
        downBtn.onclick();
        expect(parseFloat(pitchSlider.sliders[0].value)).toBeLessThan(higherFreq);
    });

    test("should save blocks", () => {
        pitchSlider.init(mockActivity);
        pitchSlider._save(440);

        expect(mockActivity.refreshCanvas).toHaveBeenCalled();
        expect(mockActivity.blocks.loadNewBlocks).toHaveBeenCalled();

        const blocks = mockActivity.blocks.loadNewBlocks.mock.calls[0][0];
        expect(blocks.some(b => b[1] === "hertz")).toBe(true);
    });
});
