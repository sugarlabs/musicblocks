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

global.PitchDrumMatrixWindow = require("../PitchDrumMatrixWindow.js");
global.PitchDrumMatrixGrid = require("../PitchDrumMatrixGrid.js");
global.PitchDrumMatrixBlocks = require("../PitchDrumMatrixBlocks.js");
global.PitchDrumMatrixCells = require("../PitchDrumMatrixCells.js");
global.PitchDrumMatrixPlayback = require("../PitchDrumMatrixPlayback.js");
global.PitchDrumMatrixSave = require("../PitchDrumMatrixSave.js");
global.PitchDrumMatrix = require("../pitchdrummatrix.js");

global._ = s => s;
global.docById = id => document.getElementById(id);

const PitchDrumMatrixWindow = global.PitchDrumMatrixWindow;
const METHODS = ["_addToolbar", "_closeWindow", "_onMaximize", "_scale"];

describe("PitchDrumMatrixWindow", () => {
    let pdm;
    let widgetWindow;
    let buttons;
    let body;

    beforeEach(() => {
        jest.useFakeTimers();
        document.body.innerHTML =
            '<div id="body"><div id="pdmOuterDiv"><div id="pdmInnerDiv"></div></div></div>';
        body = document.getElementById("body");
        buttons = {};
        widgetWindow = {
            _maximized: false,
            addButton: jest.fn((icon, size, label) => {
                buttons[label] = document.createElement("div");
                return buttons[label];
            }),
            getWidgetBody: () => body,
            destroy: jest.fn()
        };
        pdm = new PitchDrumMatrix();
        pdm.activity = {
            logo: { turtleDelay: 100, synth: { stop: jest.fn() } },
            hideMsgs: jest.fn()
        };
        pdm.pitchDrumDiv = document.createElement("div");
        pdm._playAll = jest.fn();
        pdm._save = jest.fn();
        pdm._clear = jest.fn();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("holds exactly the methods moved out of PitchDrumMatrix", () => {
        const names = Object.getOwnPropertyNames(PitchDrumMatrixWindow.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on PitchDrumMatrix.prototype", () => {
        expect(PitchDrumMatrix.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(PitchDrumMatrix.prototype[name]).toBe(PitchDrumMatrixWindow.prototype[name]);
        }
    });

    test("adds the Play, Save and Clear buttons", () => {
        pdm._addToolbar(widgetWindow);

        expect(widgetWindow.addButton.mock.calls.map(call => [call[0], call[2]])).toEqual([
            ["play-button.svg", "Play"],
            ["export-chunk.svg", "Save"],
            ["erase-button.svg", "Clear"]
        ]);
        expect(pdm.playButton).toBe(buttons.Play);
    });

    test("Play toggles playback with no turtle delay", () => {
        pdm._addToolbar(widgetWindow);

        buttons.Play.onclick();
        expect(pdm._playing).toBe(true);
        expect(pdm.activity.logo.turtleDelay).toBe(0);
        expect(pdm._playAll).toHaveBeenCalledTimes(1);

        buttons.Play.onclick();
        expect(pdm._playing).toBe(false);
        expect(pdm._playAll).toHaveBeenCalledTimes(2);
    });

    test("Save saves once a second at most", () => {
        pdm._addToolbar(widgetWindow);

        buttons.Save.onclick();
        buttons.Save.onclick();
        expect(pdm._save).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(1000);
        buttons.Save.onclick();
        expect(pdm._save).toHaveBeenCalledTimes(2);
    });

    test("Clear clears the grid", () => {
        pdm._addToolbar(widgetWindow);

        buttons.Clear.onclick();

        expect(pdm._clear).toHaveBeenCalled();
    });

    test("closing stops playback and the sound, and destroys the window", () => {
        pdm._playing = true;

        pdm._closeWindow(widgetWindow);

        expect(pdm._playing).toBe(false);
        expect(pdm.activity.logo.synth.stop).toHaveBeenCalled();
        expect(pdm.pitchDrumDiv.style.visibility).toBe("hidden");
        expect(pdm.activity.hideMsgs).toHaveBeenCalled();
        expect(widgetWindow.destroy).toHaveBeenCalled();
    });

    test("maximizing sizes the body and both scroll divs for the full screen", () => {
        widgetWindow._maximized = true;

        pdm._onMaximize(widgetWindow);

        expect(body.style.position).toBe("absolute");
        expect(body.style.left).toBe("55px");
        for (const id of ["pdmOuterDiv", "pdmInnerDiv"]) {
            const div = document.getElementById(id);
            expect(div.style.height).toBe("calc(-95px + 100vh)");
            expect(div.style.width).toBe("calc(-55px + 100vw)");
        }
    });

    test("restoring puts the body and both scroll divs back to 400 x 500", () => {
        widgetWindow._maximized = true;
        pdm._onMaximize(widgetWindow);
        widgetWindow._maximized = false;

        pdm._onMaximize(widgetWindow);

        expect(body.style.position).toBe("relative");
        expect(body.style.left).toBe("0px");
        for (const id of ["pdmOuterDiv", "pdmInnerDiv"]) {
            const div = document.getElementById(id);
            expect(div.style.height).toBe("400px");
            expect(div.style.width).toBe("500px");
        }
    });
});
