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

const ManagedTimer = require("../../utils/ManagedTimer");

global._ = msg => msg;
global.TempoWindow = require("../TempoWindow.js");
global.TempoRows = require("../TempoRows.js");
global.TempoKeyboard = require("../TempoKeyboard.js");
global.TempoTap = require("../TempoTap.js");
global.TempoControls = require("../TempoControls.js");
global.TempoMetronome = require("../TempoMetronome.js");
global.TempoSave = require("../TempoSave.js");
global.Tempo = require("../tempo.js");

const TempoWindow = global.TempoWindow;
const METHODS = ["_closeWindow", "_addToolbar", "togglePlayPause"];

// A widget window whose addButton returns real buttons, so the icons can be checked.
const makeWidgetWindow = () => {
    const buttons = [];
    return {
        buttons,
        timerManager: new ManagedTimer(),
        addButton: jest.fn((icon, size, label) => {
            const button = document.createElement("button");
            button.dataset.icon = icon;
            button.dataset.label = label;
            buttons.push(button);
            return button;
        }),
        destroy: jest.fn()
    };
};

describe("TempoWindow", () => {
    let tempo, widgetWindow;

    beforeEach(() => {
        jest.useFakeTimers();
        tempo = new Tempo();
        widgetWindow = makeWidgetWindow();
        tempo.widgetWindow = widgetWindow;
        tempo.BPMs = [100, 120];
        tempo.pause = jest.fn();
        tempo.resume = jest.fn();
        tempo.tapTempo = jest.fn();
        tempo._saveTempo = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    test("holds exactly the methods moved out of Tempo", () => {
        const names = Object.getOwnPropertyNames(TempoWindow.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on Tempo.prototype", () => {
        expect(Tempo.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(Tempo.prototype[name]).toBe(TempoWindow.prototype[name]);
            // Like a method declared in the class: not enumerable.
            expect(Object.getOwnPropertyDescriptor(Tempo.prototype, name).enumerable).toBe(false);
        }
    });

    describe("_addToolbar", () => {
        test("adds the pause, save tempo and tap tempo buttons", () => {
            tempo._addToolbar(widgetWindow);

            expect(widgetWindow.buttons.map(button => button.dataset.icon)).toEqual([
                "pause-button.svg",
                "export-chunk.svg",
                "tap-button.svg"
            ]);
            expect(widgetWindow.buttons.map(button => button.dataset.label)).toEqual([
                "Pause",
                "Save tempo",
                "Tap tempo"
            ]);
            expect(tempo.pauseBtn).toBe(widgetWindow.buttons[0]);
            expect(tempo.tapBtn).toBe(widgetWindow.buttons[2]);
        });

        test("the pause button pauses, shows Play, and resumes on the next click", () => {
            tempo.isMoving = true;
            tempo._addToolbar(widgetWindow);
            const pauseBtn = widgetWindow.buttons[0];

            pauseBtn.onclick();

            expect(tempo.pause).toHaveBeenCalledTimes(1);
            expect(tempo.isMoving).toBe(false);
            let img = pauseBtn.querySelector("img");
            expect(img.src).toContain("header-icons/play-button.svg");
            expect(img.title).toBe("Play");
            expect(pauseBtn.querySelectorAll("img")).toHaveLength(1);

            pauseBtn.onclick();

            expect(tempo.resume).toHaveBeenCalledTimes(1);
            expect(tempo.isMoving).toBe(true);
            img = pauseBtn.querySelector("img");
            expect(img.src).toContain("header-icons/pause-button.svg");
            expect(img.title).toBe("Pause");
            expect(pauseBtn.querySelectorAll("img")).toHaveLength(1);
        });

        test("the save button saves once, then again after a second", () => {
            tempo._addToolbar(widgetWindow);
            const saveBtn = widgetWindow.buttons[1];

            saveBtn.onclick();
            saveBtn.onclick();
            expect(tempo._saveTempo).toHaveBeenCalledTimes(1);

            jest.advanceTimersByTime(1000);
            saveBtn.onclick();
            expect(tempo._saveTempo).toHaveBeenCalledTimes(2);
        });

        test("the save lock is released through the widget's timers", () => {
            tempo._addToolbar(widgetWindow);
            widgetWindow.buttons[1].onclick();
            expect(tempo._save_lock).toBe(true);

            // Closing the widget clears its timers, so the lock is reset by the next init.
            widgetWindow.timerManager.clearAll();
            jest.advanceTimersByTime(1000);
            expect(tempo._save_lock).toBe(true);
        });

        test("the save lock is released with a plain timeout without a timer manager", () => {
            tempo.widgetWindow = null;
            tempo._addToolbar(widgetWindow);

            widgetWindow.buttons[1].onclick();
            expect(tempo._save_lock).toBe(true);
            jest.advanceTimersByTime(1000);
            expect(tempo._save_lock).toBe(false);
        });

        test("the tap button taps the active row", () => {
            tempo._addToolbar(widgetWindow);
            tempo.activeBPMIndex = 1;

            widgetWindow.buttons[2].onclick();

            expect(tempo.tapTempo).toHaveBeenCalledWith(1);
        });

        test.each([-1, 2, 7])("the tap button taps the first row when the active row is %s", id => {
            tempo._addToolbar(widgetWindow);
            tempo.activeBPMIndex = id;

            widgetWindow.buttons[2].onclick();

            expect(tempo.tapTempo).toHaveBeenCalledWith(0);
        });
    });

    describe("_closeWindow", () => {
        test("stops the metronome and the tap timers, and destroys the window", () => {
            const tapReset = jest.fn();
            const flashReset = jest.fn();
            const beat = jest.fn();
            tempo._tapTimeout = widgetWindow.timerManager.setTimeout(tapReset, 2001);
            tempo._tapButtonTimeout = widgetWindow.timerManager.setTimeout(flashReset, 150);
            tempo._intervalID = widgetWindow.timerManager.setInterval(beat, 5);
            tempo._tapTimes = [1, 2];
            tempo._lastTapIndex = 1;

            tempo._closeWindow(widgetWindow);
            jest.advanceTimersByTime(3000);

            expect(tapReset).not.toHaveBeenCalled();
            expect(flashReset).not.toHaveBeenCalled();
            expect(beat).not.toHaveBeenCalled();
            expect(tempo._tapTimeout).toBeNull();
            expect(tempo._tapButtonTimeout).toBeNull();
            expect(tempo._intervalID).toBeNull();
            expect(tempo._tapTimes).toEqual([]);
            expect(tempo._lastTapIndex).toBeNull();
            expect(widgetWindow.destroy).toHaveBeenCalledTimes(1);
        });

        test("stops listening for the keyboard shortcuts", () => {
            const handler = jest.fn();
            tempo._keyHandler = handler;
            document.addEventListener("keydown", handler, true);

            tempo._closeWindow(widgetWindow);
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));

            expect(handler).not.toHaveBeenCalled();
            expect(tempo._keyHandler).toBeNull();
        });

        test("clears the tap timers with plain timeouts when the window has no timer manager", () => {
            const tapReset = jest.fn();
            tempo._tapTimeout = setTimeout(tapReset, 2001);
            tempo._intervalID = null;
            widgetWindow.timerManager = null;

            tempo._closeWindow(widgetWindow);
            jest.advanceTimersByTime(3000);

            expect(tapReset).not.toHaveBeenCalled();
            expect(widgetWindow.destroy).toHaveBeenCalled();
        });

        test("clears the interval with native clearInterval and destroys the window when timerManager is null", () => {
            const beat = jest.fn();
            tempo._intervalID = setInterval(beat, 100);
            widgetWindow.timerManager = null;
            const clearSpy = jest.spyOn(global, "clearInterval");

            tempo._closeWindow(widgetWindow);
            jest.advanceTimersByTime(500);

            expect(clearSpy).toHaveBeenCalled();
            expect(beat).not.toHaveBeenCalled();
            expect(tempo._intervalID).toBeNull();
            expect(widgetWindow.destroy).toHaveBeenCalledTimes(1);
        });

        test("clears the interval with native clearInterval when timerManager is undefined", () => {
            const beat = jest.fn();
            tempo._intervalID = setInterval(beat, 100);
            widgetWindow.timerManager = undefined;
            const clearSpy = jest.spyOn(global, "clearInterval");

            tempo._closeWindow(widgetWindow);
            jest.advanceTimersByTime(500);

            expect(clearSpy).toHaveBeenCalled();
            expect(beat).not.toHaveBeenCalled();
            expect(tempo._intervalID).toBeNull();
            expect(widgetWindow.destroy).toHaveBeenCalledTimes(1);
        });

        test("falls back to native clearInterval when timerManager lacks clearInterval function", () => {
            const beat = jest.fn();
            tempo._intervalID = setInterval(beat, 100);
            widgetWindow.timerManager = {};
            const clearSpy = jest.spyOn(global, "clearInterval");

            tempo._closeWindow(widgetWindow);
            jest.advanceTimersByTime(500);

            expect(clearSpy).toHaveBeenCalled();
            expect(beat).not.toHaveBeenCalled();
            expect(tempo._intervalID).toBeNull();
            expect(widgetWindow.destroy).toHaveBeenCalledTimes(1);
        });

        test("clears interval when _intervalID is 0", () => {
            tempo._intervalID = 0;
            const timerClearSpy = jest.spyOn(widgetWindow.timerManager, "clearInterval");

            tempo._closeWindow(widgetWindow);

            expect(timerClearSpy).toHaveBeenCalledWith(0);
            expect(tempo._intervalID).toBeNull();
            expect(widgetWindow.destroy).toHaveBeenCalledTimes(1);
        });

        test("clears interval via native clearInterval when _intervalID is 0 and timerManager is null", () => {
            tempo._intervalID = 0;
            widgetWindow.timerManager = null;
            const clearSpy = jest.spyOn(global, "clearInterval");

            tempo._closeWindow(widgetWindow);

            expect(clearSpy).toHaveBeenCalledWith(0);
            expect(tempo._intervalID).toBeNull();
            expect(widgetWindow.destroy).toHaveBeenCalledTimes(1);
        });

        test("does not attempt to clear interval when _intervalID is null or undefined", () => {
            tempo._intervalID = null;
            const clearSpy = jest.spyOn(global, "clearInterval");
            const timerClearSpy = jest.spyOn(widgetWindow.timerManager, "clearInterval");

            tempo._closeWindow(widgetWindow);

            expect(clearSpy).not.toHaveBeenCalled();
            expect(timerClearSpy).not.toHaveBeenCalled();
            expect(tempo._intervalID).toBeNull();
            expect(widgetWindow.destroy).toHaveBeenCalledTimes(1);

            tempo._intervalID = undefined;
            tempo._closeWindow(widgetWindow);

            expect(clearSpy).not.toHaveBeenCalled();
            expect(timerClearSpy).not.toHaveBeenCalled();
            expect(tempo._intervalID).toBeUndefined();
            expect(widgetWindow.destroy).toHaveBeenCalledTimes(2);
        });

        test("interval cleanup is idempotent when _closeWindow is called repeatedly", () => {
            const beat = jest.fn();
            tempo._intervalID = widgetWindow.timerManager.setInterval(beat, 50);
            const timerClearSpy = jest.spyOn(widgetWindow.timerManager, "clearInterval");

            tempo._closeWindow(widgetWindow);
            expect(timerClearSpy).toHaveBeenCalledTimes(1);
            expect(tempo._intervalID).toBeNull();
            expect(widgetWindow.destroy).toHaveBeenCalledTimes(1);

            tempo._closeWindow(widgetWindow);
            expect(timerClearSpy).toHaveBeenCalledTimes(1);
            expect(tempo._intervalID).toBeNull();
            expect(widgetWindow.destroy).toHaveBeenCalledTimes(2);
        });
    });

    describe("togglePlayPause", () => {
        test("clicks the pause button when there is one", () => {
            tempo.pauseBtn = { onclick: jest.fn() };

            tempo.togglePlayPause();

            expect(tempo.pauseBtn.onclick).toHaveBeenCalledTimes(1);
            expect(tempo.pause).not.toHaveBeenCalled();
        });

        test("pauses and resumes directly without a pause button", () => {
            tempo.pauseBtn = null;
            tempo.isMoving = true;

            tempo.togglePlayPause();
            expect(tempo.pause).toHaveBeenCalledTimes(1);
            expect(tempo.isMoving).toBe(false);

            tempo.togglePlayPause();
            expect(tempo.resume).toHaveBeenCalledTimes(1);
            expect(tempo.isMoving).toBe(true);
        });
    });
});
