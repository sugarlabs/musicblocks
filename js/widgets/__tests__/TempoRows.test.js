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

const TempoRows = global.TempoRows;
const METHODS = ["_makeRows", "_onCanvasClick"];

// A widget window that puts real buttons and inputs into the cells it is given.
const makeWidgetWindow = () => ({
    addButton: jest.fn((icon, size, label, cell) => {
        const button = document.createElement("button");
        button.dataset.icon = icon;
        cell.appendChild(button);
        return button;
    }),
    addInputButton: jest.fn((value, cell) => {
        const input = document.createElement("input");
        input.value = value;
        cell.appendChild(input);
        return input;
    })
});

describe("TempoRows", () => {
    let tempo, widgetWindow;

    beforeEach(() => {
        jest.useFakeTimers();
        tempo = new Tempo();
        widgetWindow = makeWidgetWindow();
        tempo.activity = { logo: { firstNoteTime: 5000 } };
        tempo.bodyTable = document.createElement("table");
        tempo._directions = [];
        tempo._widgetFirstTimes = [];
        tempo._widgetNextTimes = [];
        tempo._intervals = [];
        tempo._firstClickTime = null;
        tempo.speedUp = jest.fn();
        tempo.slowDown = jest.fn();
        tempo._useBPM = jest.fn();
        tempo._updateBPM = jest.fn();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("holds exactly the methods moved out of Tempo", () => {
        const names = Object.getOwnPropertyNames(TempoRows.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on Tempo.prototype", () => {
        expect(Tempo.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(Tempo.prototype[name]).toBe(TempoRows.prototype[name]);
            expect(Object.getOwnPropertyDescriptor(Tempo.prototype, name).enumerable).toBe(false);
        }
    });

    describe("_makeRows", () => {
        test("makes three table rows for each BPM", () => {
            tempo.BPMs = [100, 120];

            tempo._makeRows(widgetWindow);

            expect(tempo.bodyTable.rows).toHaveLength(6);
            // The canvas spans the three rows, next to the speed up button.
            const canvasCell = tempo.bodyTable.rows[0].cells[1];
            expect(canvasCell.getAttribute("rowspan")).toBe("3");
            expect(canvasCell.firstChild).toBe(tempo.tempoCanvases[0]);
            expect(tempo.bodyTable.rows[3].cells[1].firstChild).toBe(tempo.tempoCanvases[1]);
        });

        test("puts the speed up, slow down and BPM input in each row", () => {
            tempo.BPMs = [100];

            tempo._makeRows(widgetWindow);

            const rows = tempo.bodyTable.rows;
            expect(rows[0].cells[0].firstChild.dataset.icon).toBe("up.svg");
            expect(rows[1].cells[0].firstChild.dataset.icon).toBe("down.svg");
            expect(rows[2].cells[0].firstChild).toBe(tempo.BPMInputs[0]);
            expect(tempo.BPMInputs[0].value).toBe("100");
        });

        test("works out each row's beat interval and start time", () => {
            tempo.BPMs = [100, 120];

            tempo._makeRows(widgetWindow);

            expect(tempo._intervals).toEqual([600, 500]);
            expect(tempo._directions).toEqual([1, 1]);
            expect(tempo._widgetFirstTimes).toEqual([5000, 5000]);
            expect(tempo._widgetNextTimes).toEqual([4400, 4500]);
        });

        test.each([0, -20])("starts a BPM of %s at 30", bpm => {
            tempo.BPMs = [bpm];

            tempo._makeRows(widgetWindow);

            expect(tempo.BPMs[0]).toBe(30);
            expect(tempo._intervals[0]).toBe(2000);
        });

        test.each([
            ["40 at 1/8 opens at 60, the 30 quarter notes it plays at", 40, 1 / 8, 60],
            ["2000 at 1/4 opens at 1000", 2000, 1 / 4, 1000],
            ["20 at 1/2 is allowed (15 to 500) and stays", 20, 1 / 2, 20],
            ["90 at 1/4 stays", 90, 1 / 4, 90]
        ])("opens each row at the tempo it plays: %s", (label, bpm, beatValue, shown) => {
            tempo.BPMs = [bpm];
            tempo.beatValues = [beatValue];

            tempo._makeRows(widgetWindow);

            expect(tempo.BPMs[0]).toBe(shown);
            expect(tempo.BPMInputs[0].value).toBe(String(shown));
            expect(tempo._intervals[0]).toBeCloseTo(60000 / shown);
        });

        test("makes no rows without a BPM", () => {
            tempo.BPMs = [];

            tempo._makeRows(widgetWindow);

            expect(tempo.bodyTable.rows).toHaveLength(0);
        });

        test("the arrows speed up and slow down their own row", () => {
            tempo.BPMs = [100, 120];
            tempo._makeRows(widgetWindow);
            const rows = tempo.bodyTable.rows;

            rows[3].cells[0].firstChild.onclick();
            rows[1].cells[0].firstChild.onclick();

            expect(tempo.speedUp).toHaveBeenCalledWith(1);
            expect(tempo.slowDown).toHaveBeenCalledWith(0);
        });

        test("Enter in a BPM input uses it, and any key makes that row active", () => {
            tempo.BPMs = [100, 120];
            tempo._makeRows(widgetWindow);

            tempo.BPMInputs[1].dispatchEvent(new KeyboardEvent("keyup", { key: "5" }));
            expect(tempo.activeBPMIndex).toBe(1);
            expect(tempo._useBPM).not.toHaveBeenCalled();

            tempo.BPMInputs[1].dispatchEvent(new KeyboardEvent("keyup", { key: "Enter" }));
            expect(tempo._useBPM).toHaveBeenCalledWith(1);
        });

        test("focusing a BPM input makes that row active", () => {
            tempo.BPMs = [100, 120];
            tempo._makeRows(widgetWindow);

            tempo.BPMInputs[1].dispatchEvent(new Event("focus"));

            expect(tempo.activeBPMIndex).toBe(1);
        });

        test("the canvas can be clicked to tap the tempo", () => {
            tempo.BPMs = [100];
            tempo._makeRows(widgetWindow);
            const canvas = tempo.tempoCanvases[0];
            const click = jest.spyOn(tempo, "_onCanvasClick");

            canvas.onclick();

            expect(canvas.style.cursor).toBe("pointer");
            expect(canvas.title).toBe("Click to tap tempo");
            expect(canvas.style.width).toBe("700px");
            expect(canvas.style.height).toBe("100px");
            expect(click).toHaveBeenCalledWith(0);
        });
    });

    describe("_onCanvasClick", () => {
        beforeEach(() => {
            tempo.BPMs = [100, 100];
            tempo.BPMInputs = [{ value: 100 }, { value: 100 }];
        });

        test("sets the tempo from the time between two clicks", () => {
            jest.setSystemTime(10000);
            tempo._onCanvasClick(0);
            expect(tempo._firstClickTime).toBe(10000);

            jest.setSystemTime(10500);
            tempo._onCanvasClick(0);

            expect(tempo.BPMs[0]).toBe(120);
            expect(tempo.BPMInputs[0].value).toBe(120);
            expect(tempo._updateBPM).toHaveBeenCalledWith(0);
            expect(tempo._firstClickTime).toBeNull();
            expect(tempo.activeBPMIndex).toBe(0);
        });

        test("starts again from the second click when the clicks are too far apart", () => {
            jest.setSystemTime(10000);
            tempo._onCanvasClick(0);
            // 2.5 seconds is 24 a minute, below 30.
            jest.setSystemTime(12500);
            tempo._onCanvasClick(0);

            expect(tempo.BPMs[0]).toBe(100);
            expect(tempo._updateBPM).not.toHaveBeenCalled();
            expect(tempo._firstClickTime).toBe(12500);

            jest.setSystemTime(13000);
            tempo._onCanvasClick(0);
            expect(tempo.BPMs[0]).toBe(120);
        });

        test("starts again when the clicks are too close together", () => {
            jest.setSystemTime(10000);
            tempo._onCanvasClick(0);
            // 50 ms is 1200 a minute, above 1000.
            jest.setSystemTime(10050);
            tempo._onCanvasClick(0);

            expect(tempo._updateBPM).not.toHaveBeenCalled();
            expect(tempo._firstClickTime).toBe(10050);
        });

        test("a click on another row's canvas starts that row afresh", () => {
            jest.setSystemTime(10000);
            tempo._onCanvasClick(0);
            jest.setSystemTime(10500);
            tempo._onCanvasClick(1);

            expect(tempo._updateBPM).not.toHaveBeenCalled();
            expect(tempo._firstClickTime).toBe(10500);
            expect(tempo.activeBPMIndex).toBe(1);

            jest.setSystemTime(11100);
            tempo._onCanvasClick(1);
            expect(tempo.BPMs[1]).toBe(100);
            expect(tempo._updateBPM).toHaveBeenCalledWith(1);
            expect(tempo.BPMs[0]).toBe(100);
        });
    });
});
