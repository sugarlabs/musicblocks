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

    test("makeClickable makes note cells keyboard accessible", () => {
        let selectedNotes = [];
        const keyboard = makeKeyboard({ getSelectedNotes: () => selectedNotes });
        keyboard._createpiesubmenu = jest.fn();
        keyboard._setNotes = jest.fn();

        const table = document.createElement("table");
        const row = table.insertRow();
        row.id = "mkbNoteDurationRow";
        row.insertCell();
        const secondCell = row.insertCell();
        secondCell.id = "cells-1";
        secondCell.setAttribute("start", "250");
        secondCell.setAttribute("dur", "0.25");
        secondCell.textContent = "1/4";
        document.body.append(table);

        const labelCell = document.createElement("td");
        labelCell.id = "labelcol0";
        labelCell.textContent = "C4";
        document.body.append(labelCell);

        const gridTable = document.createElement("table");
        const gridRow = gridTable.insertRow();
        gridRow.id = "mkb0";
        const firstGridCell = gridRow.insertCell();
        const secondGridCell = gridRow.insertCell();
        for (const gridCell of [firstGridCell, secondGridCell]) {
            gridCell.setAttribute("cellColor", "white");
        }
        document.body.append(gridTable);

        selectedNotes = [{ duration: [0.25] }, { duration: [0.25] }];
        keyboard.layout = [{ noteName: "C", noteOctave: 4, blockNumber: 1 }];
        keyboard.makeClickable();

        expect(secondCell.getAttribute("tabindex")).toBe("0");
        expect(secondCell.getAttribute("role")).toBe("button");
        expect(secondCell.getAttribute("aria-label")).toBe("note duration 1/4, column 2");

        const enterEvent = { key: "Enter", preventDefault: jest.fn(), target: secondCell };
        secondCell.onkeydown(enterEvent);
        expect(enterEvent.preventDefault).toHaveBeenCalled();
        expect(keyboard._createpiesubmenu).toHaveBeenCalledWith("cells-1", "250", "0.25");

        expect(secondGridCell.getAttribute("tabindex")).toBe("0");
        expect(secondGridCell.getAttribute("role")).toBe("button");
        expect(secondGridCell.getAttribute("aria-label")).toBe("C4, column 2, duration 1/4");

        const space = new KeyboardEvent("keydown", { key: " ", cancelable: true, bubbles: true });
        secondGridCell.dispatchEvent(space);
        expect(space.defaultPrevented).toBe(true);
        expect(secondGridCell.style.backgroundColor).toBe("black");
        expect(secondGridCell.getAttribute("aria-pressed")).toBe("true");
        expect(keyboard._setNotes).toHaveBeenCalledWith(1, true);

        secondGridCell.dispatchEvent(
            new KeyboardEvent("keydown", { key: " ", cancelable: true, bubbles: true })
        );
        expect(secondGridCell.getAttribute("aria-pressed")).toBe("false");
        expect(keyboard._setNotes).toHaveBeenLastCalledWith(1, false);

        keyboard._setNotes.mockClear();
        secondGridCell.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }));
        expect(keyboard._setNotes).not.toHaveBeenCalled();

        // Dragging toggles the cell entered, not the one where the drag began.
        firstGridCell.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        secondGridCell.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
        expect(secondGridCell.getAttribute("aria-pressed")).toBe("true");
        expect(keyboard._setNotes).toHaveBeenLastCalledWith(1, true);

        // Assistive-technology activation arrives as a detail-0 click.
        secondGridCell.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(secondGridCell.getAttribute("aria-pressed")).toBe("false");
        expect(keyboard._setNotes).toHaveBeenLastCalledWith(1, false);
    });

    test("makeClickable handles an empty keyboard grid", () => {
        const keyboard = makeKeyboard({ getSelectedNotes: () => [] });
        keyboard.layout = [];
        keyboard._setNotes = jest.fn();
        keyboard._createpiesubmenu = jest.fn();

        expect(() => keyboard.makeClickable()).not.toThrow();
        expect(keyboard._setNotes).not.toHaveBeenCalled();
        expect(keyboard._createpiesubmenu).not.toHaveBeenCalled();
    });

    test("makeClickable keeps each handler bound to its own cell", () => {
        const keyboard = makeKeyboard({ getSelectedNotes: () => [{ duration: [0.25] }] });
        keyboard._setNotes = jest.fn();
        keyboard._createpiesubmenu = jest.fn();
        keyboard.layout = [{ noteName: "C", noteOctave: 4, blockNumber: 1 }];

        const durationTable = document.createElement("table");
        const durationRow = durationTable.insertRow();
        durationRow.id = "mkbNoteDurationRow";
        durationRow.insertCell().textContent = "1/4";
        document.body.append(durationTable);

        const gridTable = document.createElement("table");
        const gridRow = gridTable.insertRow();
        gridRow.id = "mkb0";
        const firstCell = gridRow.insertCell();
        const secondCell = gridRow.insertCell();
        for (const gridCell of [firstCell, secondCell]) {
            gridCell.setAttribute("cellColor", "white");
        }
        document.body.append(gridTable);

        keyboard.makeClickable();

        // With no event target the handler must fall back to the cell it was
        // created for, not the last cell visited by makeClickable.
        firstCell.onkeydown({ key: " ", preventDefault() {}, stopPropagation() {} });
        expect(firstCell.getAttribute("aria-pressed")).toBe("true");
        expect(secondCell.getAttribute("aria-pressed")).toBe("false");
        expect(keyboard._setNotes).toHaveBeenCalledWith(0, true);
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
            keyboard.loadHandler = jest.fn();
            keyboard.loadRestHandler = jest.fn();
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

        test("makes the rest key clickable", () => {
            const keyboard = drawKeyboard([{ noteName: "hertz", noteOctave: 440, blockNumber: 6 }]);

            expect(keyboard.loadRestHandler).toHaveBeenCalledWith(docById("rest"));
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

    describe("_mkbEl scoping", () => {
        test("resolves ids inside this keyboard's own window body, not another's", () => {
            const first = makeKeyboard();
            const second = makeKeyboard();
            const firstBody = document.createElement("div");
            const secondBody = document.createElement("div");
            const firstEl = document.createElement("div");
            firstEl.id = "mkbInnerDiv";
            firstEl.textContent = "first";
            const secondEl = document.createElement("div");
            secondEl.id = "mkbInnerDiv";
            secondEl.textContent = "second";
            firstBody.append(firstEl);
            secondBody.append(secondEl);
            first._widgetBody = firstBody;
            second._widgetBody = secondBody;

            // Both windows use the same id; each instance must find its own.
            expect(first._mkbEl("mkbInnerDiv")).toBe(firstEl);
            expect(second._mkbEl("mkbInnerDiv")).toBe(secondEl);
        });

        test("falls back to the document when no window body is set", () => {
            const keyboard = makeKeyboard();
            const el = document.createElement("div");
            el.id = "mkbOuterDiv";
            document.body.append(el);

            expect(keyboard._mkbEl("mkbOuterDiv")).toBe(el);
        });
    });
});
