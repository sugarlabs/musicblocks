/**
 * MusicBlocks
 *
 * @copyright 2026 Music Blocks Contributors
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

global.ManagedTimer = require("../../utils/ManagedTimer");
global.PitchStaircaseTimers = require("../PitchStaircaseTimers.js");
global.PitchStaircaseLayout = require("../PitchStaircaseLayout.js");
global.PitchStaircaseSteps = require("../PitchStaircaseSteps.js");
global.PitchStaircasePlayback = require("../PitchStaircasePlayback.js");
global.PitchStaircaseSave = require("../PitchStaircaseSave.js");
global.PitchStaircaseWindow = require("../PitchStaircaseWindow.js");
global.PitchStaircase = require("../pitchstaircase.js");

global._ = msg => msg;
global.PREVIEWVOLUME = 80;
global.Singer = { masterVolume: [50, 65] };
global.last = arr => arr[arr.length - 1];
global.announceToScreenReader = jest.fn();

const PitchStaircaseWindow = global.PitchStaircaseWindow;
const METHODS = ["_openWindow", "_closeWindow", "_addToolbar", "_onMaximize"];

/**
 * A widget window that records its buttons by label, so tests can press them.
 * @returns {object}
 */
const makeWidgetWindow = () => {
    const body = { style: {}, append: jest.fn() };
    const buttons = {};
    const inputs = [];
    return {
        buttons,
        inputs,
        body,
        clear: jest.fn(),
        show: jest.fn(),
        destroy: jest.fn(),
        addDivider: jest.fn(),
        getWidgetBody: () => body,
        addButton: jest.fn((icon, size, label) => {
            const button = { icon, onclick: null };
            buttons[label] = button;
            return button;
        }),
        addInputButton: jest.fn(value => {
            const input = { value };
            inputs.push(input);
            return input;
        })
    };
};

describe("PitchStaircaseWindow", () => {
    let psc;
    let widgetWindow;
    let synth;

    beforeEach(() => {
        jest.useFakeTimers();
        psc = new PitchStaircase();
        synth = { setMasterVolume: jest.fn(), stop: jest.fn() };
        psc.activity = { logo: { synth } };
        widgetWindow = makeWidgetWindow();
        window.widgetWindows = { windowFor: jest.fn(() => widgetWindow) };
        global.announceToScreenReader.mockClear();
    });

    afterEach(() => {
        jest.useRealTimers();
        delete window.widgetWindows;
    });

    test("holds exactly the methods moved out of PitchStaircase", () => {
        const names = Object.getOwnPropertyNames(PitchStaircaseWindow.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on PitchStaircase.prototype", () => {
        expect(PitchStaircase.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(PitchStaircase.prototype[name]).toBe(PitchStaircaseWindow.prototype[name]);
            expect(Object.getOwnPropertyDescriptor(PitchStaircase.prototype, name).enumerable).toBe(
                false
            );
        }
    });

    test("_openWindow shows the window and turns the volume down to the preview volume", () => {
        expect(psc._openWindow()).toBe(widgetWindow);

        expect(window.widgetWindows.windowFor).toHaveBeenCalledWith(
            psc,
            "pitch staircase",
            "pitch staircase",
            true
        );
        expect(widgetWindow.show).toHaveBeenCalled();
        expect(psc.closed).toBe(false);
        expect(synth.setMasterVolume).toHaveBeenCalledWith(80);
        expect(global.announceToScreenReader).toHaveBeenCalledWith("Pitch Staircase opened");
    });

    test("closing the window stops playback and restores the project volume", () => {
        psc._openWindow();
        const pending = jest.fn();
        psc._scaleStepTimeout = psc._setWidgetTimeout(pending, 500);
        psc._isPlayingScale = true;

        widgetWindow.onclose();
        jest.advanceTimersByTime(1000);

        expect(psc.closed).toBe(true);
        expect(pending).not.toHaveBeenCalled();
        expect(psc._isPlayingScale).toBe(false);
        expect(synth.stop).toHaveBeenCalled();
        expect(synth.setMasterVolume).toHaveBeenLastCalledWith(65);
        expect(global.announceToScreenReader).toHaveBeenCalledWith("Pitch Staircase closed");
        expect(widgetWindow.destroy).toHaveBeenCalled();
    });

    describe("_addToolbar", () => {
        beforeEach(() => {
            psc._addToolbar(widgetWindow);
        });

        test("adds the buttons and the two ratio inputs", () => {
            expect(Object.keys(widgetWindow.buttons)).toEqual([
                "Play chord",
                "Play scale",
                "Save",
                "Undo",
                "Clear"
            ]);
            expect(psc._musicRatio1.value).toBe("3");
            expect(psc._musicRatio2.value).toBe("2");
            expect(widgetWindow.body.style.maxHeight).toBe(10 * PitchStaircase.BUTTONSIZE + "px");
        });

        test("play chord plays, or stops the chord that is playing", () => {
            psc._playAll = jest.fn();
            psc._stopChord = jest.fn();

            widgetWindow.buttons["Play chord"].onclick();
            expect(psc._playAll).toHaveBeenCalled();

            psc._isPlayingAll = true;
            widgetWindow.buttons["Play chord"].onclick();
            expect(psc._stopChord).toHaveBeenCalled();
        });

        test("play scale plays, or stops the scale that is playing", () => {
            psc.playUpAndDown = jest.fn();
            psc._stopScale = jest.fn();

            widgetWindow.buttons["Play scale"].onclick();
            expect(psc.playUpAndDown).toHaveBeenCalled();

            psc._isPlayingScale = true;
            widgetWindow.buttons["Play scale"].onclick();
            expect(psc._stopScale).toHaveBeenCalled();
        });

        test("save ignores a second press within a second", () => {
            psc._save = jest.fn();

            widgetWindow.buttons["Save"].onclick();
            widgetWindow.buttons["Save"].onclick();
            expect(psc._save).toHaveBeenCalledTimes(1);

            jest.advanceTimersByTime(1000);
            widgetWindow.buttons["Save"].onclick();
            expect(psc._save).toHaveBeenCalledTimes(2);
        });

        test("save unlocks again even if saving throws", () => {
            psc._save = jest.fn(() => {
                throw new Error("bad block");
            });

            expect(() => widgetWindow.buttons["Save"].onclick()).toThrow("bad block");
            jest.advanceTimersByTime(1000);

            expect(psc._get_save_lock()).toBe(false);
        });

        test("undo removes one step and clear removes them all", () => {
            const steps = [1, 2, 3];
            psc._undo = jest.fn(() => steps.pop() !== undefined);

            widgetWindow.buttons["Undo"].onclick();
            expect(psc._undo).toHaveBeenCalledTimes(1);

            widgetWindow.buttons["Clear"].onclick();
            expect(steps).toEqual([]);
            expect(psc._undo).toHaveBeenCalledTimes(4);
        });
    });

    test("_onMaximize lets the stairs grow and shrink back", () => {
        let maximized = true;
        widgetWindow.isMaximized = () => maximized;

        psc._onMaximize(widgetWindow);
        expect(widgetWindow.body.style.maxHeight).toBe(16 * PitchStaircase.BUTTONSIZE + "px");

        maximized = false;
        psc._onMaximize(widgetWindow);
        expect(widgetWindow.body.style.maxHeight).toBe(10 * PitchStaircase.BUTTONSIZE + "px");
    });

    test("_onMaximize falls back to the window's _maximized flag", () => {
        widgetWindow._maximized = true;

        psc._onMaximize(widgetWindow);

        expect(widgetWindow.body.style.maxHeight).toBe(16 * PitchStaircase.BUTTONSIZE + "px");
    });
});
