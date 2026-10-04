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

const MusicKeyboardRendering = require("../MusicKeyboardRendering.js");

global._ = text => text;
global.docById = id => document.getElementById(id);
global.EIGHTHNOTEWIDTH = 24;
global.PITCHES3 = ["C", "D", "E", "F", "G", "A", "B"];
global.SOLFEGENAMES = ["do", "re", "mi", "fa", "sol", "la", "ti"];
global.MATRIXSOLFEHEIGHT = 30;
global.MATRIXSOLFEWIDTH = 52;
global.platformColor = { graphicsLabelBackground: "#eee", rhythmcellcolor: "#fff" };
global.i18nSolfege = name => name;
global.toFraction = value => [1, Math.round(1 / value)];

const RENDERING_METHODS = [
    "_setNotes",
    "_setNoteCell",
    "makeClickable",
    "_updateWidgetWindowSize",
    "_noteWidth",
    "_createTable",
    "_createKeyboard"
];

const makeKeyboard = (deps = {}) => {
    const keyboard = {};
    MusicKeyboardRendering.install.call(keyboard, {
        FAKEBLOCKNUMBER: 100000,
        BLACKKEYS: [81, 87, 69],
        WHITEKEYS: [65, 83, 68],
        HERTZKEYS: [49, 50, 51],
        resolveSynthNoteName: jest.fn(),
        w: 1024,
        getSelectedNotes: () => [],
        ...deps
    });
    return keyboard;
};

describe("MusicKeyboardRendering", () => {
    afterEach(() => {
        document.body.replaceChildren();
    });

    test("install adds the drawing methods to the keyboard", () => {
        const keyboard = makeKeyboard();

        for (const name of RENDERING_METHODS) {
            expect(typeof keyboard[name]).toBe("function");
        }
    });

    test("each keyboard gets its own methods", () => {
        const first = makeKeyboard();
        const second = makeKeyboard();

        for (const name of RENDERING_METHODS) {
            expect(first[name]).not.toBe(second[name]);
        }
    });

    test("_noteWidth scales with the cell scale and never drops below 15px", () => {
        const keyboard = makeKeyboard();
        keyboard._cellScale = 1;

        expect(keyboard._noteWidth(1 / 4)).toBe(48);
        expect(keyboard._noteWidth(1 / 64)).toBe(15);

        keyboard._cellScale = 2;
        expect(keyboard._noteWidth(1 / 4)).toBe(96);
    });

    test("_updateWidgetWindowSize uses the injected window width", () => {
        const body = document.createElement("div");
        const outerDiv = document.createElement("div");
        outerDiv.id = "mkbOuterDiv";
        document.body.append(outerDiv);

        const keyboard = makeKeyboard({ w: 777 });
        keyboard.widgetWindow = { _maximized: false, getWidgetBody: () => body };
        keyboard._updateWidgetWindowSize();

        expect(outerDiv.style.width).toBe("777px");
        expect(body.style.width).toBe("1000px");
    });

    test("_updateWidgetWindowSize does nothing before the widget is drawn", () => {
        const keyboard = makeKeyboard();
        keyboard.widgetWindow = {
            _maximized: false,
            getWidgetBody: jest.fn()
        };

        expect(() => keyboard._updateWidgetWindowSize()).not.toThrow();
        expect(keyboard.widgetWindow.getWidgetBody).not.toHaveBeenCalled();
    });

    test("makeClickable reads selectedNotes when it runs, not when it was installed", () => {
        // The constructor replaces selectedNotes (processSelected, Clear, close)
        // instead of mutating it, so the module must not hold on to an old list.
        let selectedNotes = [];
        const keyboard = makeKeyboard({ getSelectedNotes: () => selectedNotes });
        keyboard.layout = [];
        keyboard._createpiesubmenu = jest.fn();

        const table = document.createElement("table");
        const row = table.insertRow();
        row.id = "mkbNoteDurationRow";
        const firstCell = row.insertCell();
        const secondCell = row.insertCell();
        secondCell.id = "cells-1";
        secondCell.setAttribute("start", "250");
        secondCell.setAttribute("dur", "0.25");
        document.body.append(table);

        selectedNotes = [{ duration: [0.25] }, { duration: [0.25] }];
        keyboard.makeClickable();

        expect(typeof firstCell.onclick).toBe("function");
        expect(typeof secondCell.onclick).toBe("function");

        secondCell.onclick({ target: secondCell });
        expect(keyboard._createpiesubmenu).toHaveBeenCalledWith("cells-1", "250", "0.25");
    });

    test("_createTable draws the note list that processSelected() leaves behind", () => {
        // processSelected() replaces selectedNotes. Reading it before that call
        // would draw the old list and leave makeClickable() short of cells.
        let selectedNotes = [];
        const keyboard = makeKeyboard({ getSelectedNotes: () => selectedNotes });
        keyboard.keyTable = document.createElement("div");
        document.body.append(keyboard.keyTable);
        keyboard._cellScale = 1;
        keyboard.displayLayout = [{ noteName: "hertz", noteOctave: 392, blockNumber: 7 }];
        keyboard.layout = keyboard.displayLayout;
        keyboard.makeClickable = jest.fn();
        keyboard._updateWidgetWindowSize = jest.fn();
        keyboard.processSelected = () => {
            selectedNotes = [
                { duration: [0.25], blockNumber: [7], startTime: 0 },
                { duration: [0.5], blockNumber: [8], startTime: 250 }
            ];
        };

        keyboard._createTable();

        const durationCells = docById("mkbNoteDurationRow").cells;
        expect(durationCells.length).toBe(2);
        expect(durationCells[0].textContent).toBe("1/4");
        expect(durationCells[1].textContent).toBe("1/2");
        expect(docById("mkb0").cells.length).toBe(2);
        expect(keyboard.makeClickable).toHaveBeenCalled();
    });

    describe("_createKeyboard", () => {
        const drawKeyboard = (displayLayout, deps) => {
            const keyboard = makeKeyboard(deps);
            keyboard.keyboardDiv = document.createElement("div");
            document.body.append(keyboard.keyboardDiv);
            keyboard.noteNames = [];
            keyboard.octaves = [];
            keyboard.displayLayout = displayLayout;
            keyboard.layout = displayLayout.map(note => ({ ...note }));
            keyboard._cacheDocumentKeyHandlers = jest.fn();
            keyboard.loadHandler = jest.fn();
            keyboard.addKeyboardShortcuts = jest.fn();
            keyboard._createKeyboard();
            return keyboard;
        };

        test("labels drum and hertz keys with the injected key codes", () => {
            const keyboard = drawKeyboard(
                [
                    { noteName: "drum", voice: "kick drum", blockNumber: 5 },
                    { noteName: "hertz", noteOctave: 392, blockNumber: 6 }
                ],
                { WHITEKEYS: [90], HERTZKEYS: [57] }
            );

            expect(docById("whiteRow0").textContent).toBe("(Z)kick drum");
            expect(docById("hertzRow0").textContent).toBe("(9)392");
            expect(keyboard.displayLayout[0].objId).toBe("whiteRow0");
            expect(keyboard.displayLayout[1].objId).toBe("hertzRow0");
            expect(keyboard.loadHandler).toHaveBeenCalledTimes(keyboard.idContainer.length);
            expect(keyboard.idContainer.map(entry => entry[0])).toEqual(["whiteRow0", "hertzRow0"]);
            expect(keyboard.addKeyboardShortcuts).toHaveBeenCalled();
        });

        test("always ends the white keys with a rest key", () => {
            drawKeyboard([{ noteName: "hertz", noteOctave: 440, blockNumber: 6 }]);

            const whiteKeys = docById("myrow").cells;
            expect(whiteKeys[whiteKeys.length - 1].textContent).toBe("(rest)");
        });

        test("writes key labels as text, not markup", () => {
            drawKeyboard([
                { noteName: "drum", voice: "<img src=x onerror=alert(1)>", blockNumber: 5 }
            ]);

            const key = docById("whiteRow0");
            expect(key.querySelector("img")).toBeNull();
            expect(key.textContent).toContain("<img src=x onerror=alert(1)>");
        });
    });
});
