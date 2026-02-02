/**
 * MusicBlocks v3.6.2
 *
 * @author vyagh
 *
 * @copyright 2026 vyagh
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

global._ = msg => msg;

const mockOscillator = {
    toDestination: jest.fn().mockReturnThis(),
    triggerRelease: jest.fn(),
    triggerAttack: jest.fn(),
    triggerAttackRelease: jest.fn(),
    frequency: {
        linearRampToValueAtTime: jest.fn()
    }
};

global.Tone = {
    AMSynth: jest.fn().mockImplementation(() => mockOscillator),
    now: jest.fn().mockReturnValue(100)
};

const createMockElement = tagName => ({
    tagName,
    style: {},
    appendChild: jest.fn(),
    innerHTML: "",
    addEventListener: jest.fn(),
    value: "440", // Default string value for inputs
    dispatchEvent: jest.fn(),
    min: "0",
    max: "1000",
    className: ""
});

global.document = {
    createElement: jest.fn().mockImplementation(createMockElement),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
};

const createMockWidgetWindow = () => {
    const buttons = [];
    return {
        _toolbar: {
            appendChild: jest.fn()
        },
        addRangeSlider: jest.fn().mockImplementation(() => ({
            addEventListener: jest.fn(),
            style: {},
            value: "440",
            min: "110",
            max: "880",
            dispatchEvent: jest.fn()
        })),
        addButton: jest.fn().mockImplementation((img, size, tip, parent) => {
            const btn = { onclick: null, tip };
            buttons.push(btn);
            return btn;
        }),
        getButtons: () => buttons,
        sendToCenter: jest.fn(),
        destroy: jest.fn(),
        onclose: null
    };
};

const PitchSlider = require("../pitchslider.js");

describe("PitchSlider Widget", () => {
    let activityMock;
    let slider;

    beforeEach(() => {
        jest.clearAllMocks();

        if (!global.window) global.window = {};

        global.window.widgetWindows = {
            openWindows: {},
            windowFor: jest.fn().mockImplementation(() => createMockWidgetWindow())
        };
        global.window.btoa = jest.fn(str => Buffer.from(str).toString("base64"));

        if (!global.document) global.document = {};
        global.document.createElement = jest.fn().mockImplementation(createMockElement);
        global.document.addEventListener = jest.fn();
        global.document.removeEventListener = jest.fn();

        activityMock = {
            logo: {},
            textMsg: jest.fn(),
            refreshCanvas: jest.fn(),
            blocks: {
                palettes: {
                    dict: {
                        myPalette: { hideMenu: jest.fn() }
                    }
                },
                loadNewBlocks: jest.fn()
            }
        };

        slider = new PitchSlider();
    });

    describe("Static Properties", () => {
        test("ICONSIZE is 32", () => {
            expect(PitchSlider.ICONSIZE).toBe(32);
        });

        test("SEMITONE is correct", () => {
            expect(PitchSlider.SEMITONE).toBeCloseTo(1.059463, 6);
        });
    });

    describe("Constructor", () => {
        test("initializes _delta to 0", () => {
            expect(slider._delta).toBe(0);
        });

        test("initializes empty sliders object", () => {
            expect(slider.sliders).toEqual({});
        });

        test("initializes _cellScale to 0", () => {
            expect(slider._cellScale).toBe(0);
        });

        test("initializes isActive to false", () => {
            expect(slider.isActive).toBe(false);
        });

        test("initializes activeSlider to null", () => {
            expect(slider.activeSlider).toBeNull();
        });
    });

    describe("Initialization (init)", () => {
        test("returns early if slider window already open", () => {
            global.window.widgetWindows.openWindows["slider"] = true;
            slider.init(activityMock);
            expect(Tone.AMSynth).not.toHaveBeenCalled();
            global.window.widgetWindows.openWindows = {}; // Reset
        });

        test("initializes frequencies to [392] if not set", () => {
            slider.init(activityMock);
            expect(slider.frequencies).toEqual([392]);
        });

        test("preserves existing frequencies array", () => {
            slider.frequencies = [440, 880];
            slider.init(activityMock);
            expect(slider.frequencies).toEqual([440, 880]);
        });

        test("creates one oscillator per frequency", () => {
            slider.frequencies = [440, 880, 220];
            slider.init(activityMock);
            expect(Tone.AMSynth).toHaveBeenCalledTimes(3);
        });

        test("routes oscillators to destination", () => {
            slider.init(activityMock);
            expect(mockOscillator.toDestination).toHaveBeenCalled();
        });

        test("sets _cellScale to 1.0", () => {
            slider.init(activityMock);
            expect(slider._cellScale).toBe(1.0);
        });

        test("registers widget window with correct parameters", () => {
            slider.init(activityMock);
            expect(window.widgetWindows.windowFor).toHaveBeenCalledWith(
                slider,
                "pitch slider",
                "slider",
                true
            );
        });

        test("sets isActive to true", () => {
            slider.init(activityMock);
            expect(slider.isActive).toBe(true);
        });

        test("sets activity.logo.pitchSlider reference", () => {
            slider.init(activityMock);
            expect(activityMock.logo.pitchSlider).toBe(slider);
        });

        test("registers keydown event listener", () => {
            slider.init(activityMock);
            expect(document.addEventListener).toHaveBeenCalledWith(
                "keydown",
                expect.any(Function),
                true
            );
        });

        test("displays two help messages", () => {
            slider.init(activityMock);
            expect(activityMock.textMsg).toHaveBeenCalledTimes(2);
            expect(activityMock.textMsg).toHaveBeenCalledWith(
                "Use the up/down buttons or arrow keys to change pitch.",
                3000
            );
        });

        test("sets activeSlider to 0 for first slider", () => {
            slider.init(activityMock);
            // Note: id comes from for...in loop so it's a string "0"
            expect(slider.activeSlider).toBe("0");
        });
    });

    describe("Multiple Sliders", () => {
        test("creates separate slider for each frequency", () => {
            slider.frequencies = [440, 880];
            slider.init(activityMock);

            expect(slider.widgetWindow.addRangeSlider).toHaveBeenCalledTimes(2);
        });

        test("creates up/down/save buttons for each frequency", () => {
            slider.frequencies = [440, 880];
            slider.init(activityMock);

            // 3 buttons per frequency = 6 buttons total
            expect(slider.widgetWindow.addButton).toHaveBeenCalledTimes(6);
        });

        test("each slider has correct min/max range", () => {
            slider.frequencies = [440];
            slider.init(activityMock);

            // min = freq/2, max = freq*2
            expect(slider.widgetWindow.addRangeSlider).toHaveBeenCalledWith(
                440,
                expect.anything(),
                220,
                880,
                "pitchSlider"
            );
        });
    });

    describe("Cleanup (onclose)", () => {
        beforeEach(() => {
            slider.init(activityMock);
        });

        test("removes keydown event listener", () => {
            slider.widgetWindow.onclose();
            expect(document.removeEventListener).toHaveBeenCalledWith(
                "keydown",
                expect.any(Function),
                true
            );
        });

        test("releases all oscillators", () => {
            slider.widgetWindow.onclose();
            expect(mockOscillator.triggerRelease).toHaveBeenCalled();
        });

        test("sets isActive to false", () => {
            slider.widgetWindow.onclose();
            expect(slider.isActive).toBe(false);
        });

        test("clears activity.logo.pitchSlider reference", () => {
            slider.widgetWindow.onclose();
            expect(activityMock.logo.pitchSlider).toBeNull();
        });

        test("destroys widget window", () => {
            slider.widgetWindow.onclose();
            expect(slider.widgetWindow.destroy).toHaveBeenCalled();
        });
    });

    describe("Key Handling", () => {
        let keyHandler;
        let mockSliderObj;

        beforeEach(() => {
            slider.init(activityMock);
            keyHandler = document.addEventListener.mock.calls.find(
                call => call[0] === "keydown"
            )[1];

            mockSliderObj = {
                value: "440",
                min: "220",
                max: "880",
                dispatchEvent: jest.fn()
            };
            slider.sliders[0] = mockSliderObj;
            slider.activeSlider = 0;
            slider.isActive = true;
        });

        test("ignores events when widget is inactive", () => {
            slider.isActive = false;
            const event = { key: "ArrowUp", preventDefault: jest.fn(), stopPropagation: jest.fn() };
            keyHandler(event);
            expect(event.preventDefault).not.toHaveBeenCalled();
        });

        test("ignores non-arrow keys", () => {
            const event = { key: "Enter", preventDefault: jest.fn(), stopPropagation: jest.fn() };
            const result = keyHandler(event);
            expect(event.preventDefault).not.toHaveBeenCalled();
            expect(result).toBeUndefined();
        });

        test("ArrowUp increases frequency by semitone", () => {
            const event = { key: "ArrowUp", preventDefault: jest.fn(), stopPropagation: jest.fn() };
            keyHandler(event);

            const expected = 440 * PitchSlider.SEMITONE;
            expect(parseFloat(mockSliderObj.value)).toBeCloseTo(expected, 2);
        });

        test("ArrowRight increases frequency by semitone", () => {
            const event = {
                key: "ArrowRight",
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            keyHandler(event);

            const expected = 440 * PitchSlider.SEMITONE;
            expect(parseFloat(mockSliderObj.value)).toBeCloseTo(expected, 2);
        });

        test("ArrowDown decreases frequency by semitone", () => {
            const event = {
                key: "ArrowDown",
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            keyHandler(event);

            const expected = 440 / PitchSlider.SEMITONE;
            expect(parseFloat(mockSliderObj.value)).toBeCloseTo(expected, 2);
        });

        test("ArrowLeft decreases frequency by semitone", () => {
            const event = {
                key: "ArrowLeft",
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            keyHandler(event);

            const expected = 440 / PitchSlider.SEMITONE;
            expect(parseFloat(mockSliderObj.value)).toBeCloseTo(expected, 2);
        });

        test("respects maximum frequency limit", () => {
            mockSliderObj.value = "880";
            const event = { key: "ArrowUp", preventDefault: jest.fn(), stopPropagation: jest.fn() };
            keyHandler(event);

            expect(parseFloat(mockSliderObj.value)).toBe(880);
        });

        test("respects minimum frequency limit", () => {
            mockSliderObj.value = "220";
            const event = {
                key: "ArrowDown",
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            keyHandler(event);

            expect(parseFloat(mockSliderObj.value)).toBe(220);
        });

        test("dispatches input event after value change", () => {
            const event = { key: "ArrowUp", preventDefault: jest.fn(), stopPropagation: jest.fn() };
            keyHandler(event);

            expect(mockSliderObj.dispatchEvent).toHaveBeenCalled();
        });

        test("prevents default browser behavior for arrow keys", () => {
            const event = { key: "ArrowUp", preventDefault: jest.fn(), stopPropagation: jest.fn() };
            keyHandler(event);

            expect(event.preventDefault).toHaveBeenCalled();
            expect(event.stopPropagation).toHaveBeenCalled();
        });

        test("returns false to prevent event bubbling", () => {
            const event = { key: "ArrowUp", preventDefault: jest.fn(), stopPropagation: jest.fn() };
            const result = keyHandler(event);

            expect(result).toBe(false);
        });

        test("uses slider 0 when activeSlider is null", () => {
            slider.activeSlider = null;
            const event = { key: "ArrowUp", preventDefault: jest.fn(), stopPropagation: jest.fn() };
            keyHandler(event);

            const expected = 440 * PitchSlider.SEMITONE;
            expect(parseFloat(mockSliderObj.value)).toBeCloseTo(expected, 2);
        });
    });

    describe("UI Interaction", () => {
        beforeEach(() => {
            slider.init(activityMock);
        });

        test("slider oninput triggers sound attack", () => {
            const rangeSlider = slider.sliders[0];
            rangeSlider.value = "500";
            rangeSlider.oninput();

            expect(mockOscillator.triggerAttack).toHaveBeenCalledWith(392);
        });

        test("slider oninput ramps to new frequency", () => {
            const rangeSlider = slider.sliders[0];
            rangeSlider.value = "500";
            rangeSlider.oninput();

            expect(mockOscillator.frequency.linearRampToValueAtTime).toHaveBeenCalledWith(
                500,
                100.05
            );
        });

        test("slider oninput updates frequency array", () => {
            const rangeSlider = slider.sliders[0];
            rangeSlider.value = "500";
            rangeSlider.oninput();

            expect(slider.frequencies[0]).toBe(500);
        });

        test("slider onchange releases oscillator", () => {
            const rangeSlider = slider.sliders[0];
            rangeSlider.onchange();

            expect(mockOscillator.triggerRelease).toHaveBeenCalled();
        });

        test("Move Up button increases frequency by semitone", () => {
            const rangeSlider = slider.sliders[0];
            rangeSlider.value = "440";
            slider.frequencies[0] = 440;

            const upBtn = slider.widgetWindow.getButtons().find(b => b.tip === "Move up");
            upBtn.onclick();

            const expected = 440 * PitchSlider.SEMITONE;
            expect(parseFloat(rangeSlider.value)).toBeCloseTo(expected, 2);
        });

        test("Move Up button plays note preview", () => {
            slider.frequencies[0] = 440;
            const upBtn = slider.widgetWindow.getButtons().find(b => b.tip === "Move up");
            upBtn.onclick();

            expect(mockOscillator.triggerAttackRelease).toHaveBeenCalledWith(
                expect.any(Number),
                "4n"
            );
        });

        test("Move Down button decreases frequency by semitone", () => {
            const rangeSlider = slider.sliders[0];
            rangeSlider.value = "440";
            slider.frequencies[0] = 440;

            const downBtn = slider.widgetWindow.getButtons().find(b => b.tip === "Move down");
            downBtn.onclick();

            const expected = 440 / PitchSlider.SEMITONE;
            expect(parseFloat(rangeSlider.value)).toBeCloseTo(expected, 2);
        });

        test("Save button passes current frequency to _save", () => {
            const saveSpy = jest.spyOn(slider, "_save");
            slider.frequencies[0] = 500;

            const saveBtn = slider.widgetWindow.getButtons().find(b => b.tip === "Save");
            saveBtn.onclick();

            expect(saveSpy).toHaveBeenCalledWith(500);
        });

        test("slider registers mousedown event listener", () => {
            expect(slider.sliders[0]).toBeDefined();
            expect(slider.sliders[0].addEventListener).toHaveBeenCalledWith(
                "mousedown",
                expect.any(Function)
            );
        });
    });

    describe("Block Generation (_save)", () => {
        beforeEach(() => {
            slider.init(activityMock);
        });

        test("hides all palette menus", () => {
            slider._save(440);
            expect(activityMock.blocks.palettes.dict.myPalette.hideMenu).toHaveBeenCalledWith(true);
        });

        test("refreshes canvas after hiding menus", () => {
            slider._save(440);
            expect(activityMock.refreshCanvas).toHaveBeenCalled();
        });

        test("creates 5-element block stack", () => {
            slider._save(440);
            const stack = activityMock.blocks.loadNewBlocks.mock.calls[0][0];

            expect(stack).toHaveLength(5);
        });

        test("first block is note block", () => {
            slider._save(440);
            const stack = activityMock.blocks.loadNewBlocks.mock.calls[0][0];

            expect(stack[0][1]).toBe("note");
        });

        test("second block is number 8 (eighth note)", () => {
            slider._save(440);
            const stack = activityMock.blocks.loadNewBlocks.mock.calls[0][0];

            expect(stack[1][1]).toEqual(["number", { value: 8 }]);
        });

        test("third block is hertz block", () => {
            slider._save(440);
            const stack = activityMock.blocks.loadNewBlocks.mock.calls[0][0];

            expect(stack[2][1]).toBe("hertz");
        });

        test("fourth block contains frequency value", () => {
            slider._save(440);
            const stack = activityMock.blocks.loadNewBlocks.mock.calls[0][0];

            expect(stack[3][1]).toEqual(["number", { value: 440 }]);
        });

        test("fifth block is hidden block", () => {
            slider._save(440);
            const stack = activityMock.blocks.loadNewBlocks.mock.calls[0][0];

            expect(stack[4][1]).toBe("hidden");
        });

        test("uses different frequency values correctly", () => {
            slider._save(523.25);
            const stack = activityMock.blocks.loadNewBlocks.mock.calls[0][0];

            expect(stack[3][1]).toEqual(["number", { value: 523.25 }]);
        });

        test("increments _delta by 21 for each save", () => {
            expect(slider._delta).toBe(0);

            slider._save(440);
            expect(slider._delta).toBe(21);

            slider._save(880);
            expect(slider._delta).toBe(42);
        });

        test("positions subsequent blocks with offset", () => {
            slider._save(440);
            slider._save(880);

            const stack1 = activityMock.blocks.loadNewBlocks.mock.calls[0][0];
            const stack2 = activityMock.blocks.loadNewBlocks.mock.calls[1][0];

            // First block at 100, second at 121
            expect(stack2[0][2]).toBe(stack1[0][2] + 21);
        });

        test("block connections are properly set", () => {
            slider._save(440);
            const stack = activityMock.blocks.loadNewBlocks.mock.calls[0][0];

            // Note block: [null, 1, 2, null] - connects to number and hertz
            expect(stack[0][4]).toEqual([null, 1, 2, null]);
            // Number block: [0] - connects back to note
            expect(stack[1][4]).toEqual([0]);
            // Hertz block: [0, freq, hidden] - connects to note, frequency, hidden
            expect(stack[2][4]).toEqual([0, 3, 4]);
        });
    });
});
