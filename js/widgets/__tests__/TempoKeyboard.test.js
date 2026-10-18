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

global._ = msg => msg;
global.TempoWindow = require("../TempoWindow.js");
global.TempoRows = require("../TempoRows.js");
global.TempoKeyboard = require("../TempoKeyboard.js");
global.TempoTap = require("../TempoTap.js");
global.TempoControls = require("../TempoControls.js");
global.TempoMetronome = require("../TempoMetronome.js");
global.TempoSave = require("../TempoSave.js");
global.Tempo = require("../tempo.js");

const TempoKeyboard = global.TempoKeyboard;
const METHODS = ["_addKeyHandler", "_removeKeyHandler", "_onKeyDown"];

describe("TempoKeyboard", () => {
    let tempo, widgetWindow;

    const press = (key, options = {}) => {
        const event = new KeyboardEvent("keydown", { key, cancelable: true, ...options });
        document.dispatchEvent(event);
        return event;
    };

    beforeEach(() => {
        tempo = new Tempo();
        widgetWindow = {};
        window.widgetWindows = { focused: widgetWindow };
        tempo.activity = { blocks: { activeBlock: null } };
        tempo.BPMs = [100, 120];
        tempo.activeBPMIndex = 1;
        tempo.speedUp = jest.fn();
        tempo.slowDown = jest.fn();
        tempo.togglePlayPause = jest.fn();
        tempo.tapTempo = jest.fn();
        tempo._addKeyHandler(widgetWindow);
    });

    afterEach(() => {
        tempo._removeKeyHandler();
        document.body.innerHTML = "";
    });

    test("holds exactly the methods moved out of Tempo", () => {
        const names = Object.getOwnPropertyNames(TempoKeyboard.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on Tempo.prototype", () => {
        expect(Tempo.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(Tempo.prototype[name]).toBe(TempoKeyboard.prototype[name]);
            expect(Object.getOwnPropertyDescriptor(Tempo.prototype, name).enumerable).toBe(false);
        }
    });

    test("the up arrow speeds up the active row by 1, or 10% with Shift", () => {
        const event = press("ArrowUp");
        press("ArrowUp", { shiftKey: true });

        expect(tempo.speedUp.mock.calls).toEqual([[1, 1], [1]]);
        expect(event.defaultPrevented).toBe(true);
    });

    test("the down arrow slows down the active row by 1, or 10% with Shift", () => {
        press("ArrowDown");
        press("ArrowDown", { shiftKey: true });

        expect(tempo.slowDown.mock.calls).toEqual([[1, 1], [1]]);
    });

    test("Space pauses or plays", () => {
        const event = press(" ");

        expect(tempo.togglePlayPause).toHaveBeenCalledTimes(1);
        expect(event.defaultPrevented).toBe(true);
    });

    test.each(["t", "T"])("%s taps the tempo of the active row", key => {
        press(key);

        expect(tempo.tapTempo).toHaveBeenCalledWith(1);
    });

    test("an active row that no longer exists falls back to the first", () => {
        tempo.activeBPMIndex = 5;

        press("ArrowUp");

        expect(tempo.speedUp).toHaveBeenCalledWith(0, 1);
    });

    test("other keys are left alone", () => {
        const event = press("a");

        expect(event.defaultPrevented).toBe(false);
        expect(tempo.speedUp).not.toHaveBeenCalled();
        expect(tempo.tapTempo).not.toHaveBeenCalled();
    });

    test("does nothing unless the widget window is focused", () => {
        window.widgetWindows.focused = {};

        const event = press("ArrowUp");

        expect(tempo.speedUp).not.toHaveBeenCalled();
        expect(event.defaultPrevented).toBe(false);
    });

    test("does nothing while a block is being used", () => {
        tempo.activity.blocks.activeBlock = 3;

        press("ArrowUp");

        expect(tempo.speedUp).not.toHaveBeenCalled();
    });

    test.each(["input", "textarea", "button", "select"])(
        "does nothing while a %s has the keyboard",
        tag => {
            const element = document.createElement(tag);
            document.body.appendChild(element);
            element.focus();

            press(" ");

            expect(tempo.togglePlayPause).not.toHaveBeenCalled();
        }
    );

    test("does nothing without a row", () => {
        tempo.BPMs = [];

        press("t");

        expect(tempo.tapTempo).not.toHaveBeenCalled();
    });

    test("_removeKeyHandler stops listening", () => {
        tempo._removeKeyHandler();

        press("ArrowUp");

        expect(tempo.speedUp).not.toHaveBeenCalled();
        expect(tempo._keyHandler).toBeNull();
        // Safe to call again.
        expect(() => tempo._removeKeyHandler()).not.toThrow();
    });
});
