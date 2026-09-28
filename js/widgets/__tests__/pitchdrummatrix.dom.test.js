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

// Runs the Pitch-Drum Matrix against a real (jsdom) DOM, unlike
// pitchdrummatrix.test.js, which replaces document with a mock. Only audio
// and blocks are mocked. Covers #9038.

const PitchDrumMatrix = require("../pitchdrummatrix.js");

global._ = s => s;
global.platformColor = {
    labelColor: "rgb(144, 193, 0)",
    selectorBackground: "rgb(100, 181, 246)",
    selectorSelected: "rgb(208, 208, 208)"
};
global.docById = id => document.getElementById(id);
global.getNote = (note, octave) => [note, octave];
const DRUMS = ["kick drum", "snare drum"];
global.getDrumName = name => (DRUMS.includes(name) ? name : null);
global.getDrumIcon = () => "icon.svg";
global.getDrumSynthName = name => name;
global.MATRIXSOLFEHEIGHT = 30;
global.MATRIXSOLFEWIDTH = 80;
global.SOLFEGECONVERSIONTABLE = { C: "do", D: "re", E: "mi" };
global.Singer = { defaultBPMFactor: 1 };
global.normalizeNoteAccidentals = note => note;

const { labelColor, selectorBackground } = platformColor;

let widgetWindow;

const build = ({ labels, args, rowBlocks, drums, colBlocks, blockMap = [] }) => {
    document.body.innerHTML = "";
    const body = document.createElement("div");
    document.body.appendChild(body);
    widgetWindow = {
        clear() {},
        show() {},
        destroy() {},
        addButton: () => document.createElement("div"),
        getWidgetBody: () => body,
        timerManager: { setTimeout: (callback, delay) => setTimeout(callback, delay) }
    };
    window.widgetWindows = { windowFor: () => widgetWindow };
    const activity = {
        logo: { synth: { stop: jest.fn(), trigger: jest.fn() } },
        turtles: { ithTurtle: () => ({ singer: { keySignature: "C major" } }) },
        textMsg: jest.fn(),
        errorMsg: jest.fn(),
        hideMsgs: jest.fn(),
        refreshCanvas: jest.fn(),
        blocks: { palettes: { dict: {} }, loadNewBlocks: jest.fn() }
    };

    const pdm = new PitchDrumMatrix();
    pdm.rowLabels = labels;
    pdm.rowArgs = args;
    pdm.drums = drums;
    pdm.clearBlocks();
    rowBlocks.forEach(blk => pdm.addRowBlock(blk));
    colBlocks.forEach(blk => pdm.addColBlock(blk));
    pdm._blockMap = blockMap;
    pdm.init(activity);
    pdm.makeClickable();
    return { pdm, activity };
};

const click = (row, col) => document.getElementById(row + "," + col).click();
const labels = pdm => [...pdm._pdmTable.rows].slice(0, -1).map(row => row.cells[0]);
const threeRows = () =>
    build({
        labels: ["C", "D", "E"],
        args: [4, 4, 4],
        rowBlocks: [20, 21, 22],
        drums: ["kick drum"],
        colBlocks: [30]
    });

describe("PitchDrumMatrix with a real DOM", () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    describe("rows and columns stay tied to their blocks", () => {
        test("a rest doesn't shift the row labels after it", () => {
            const { pdm } = build({
                labels: ["C", "rest", "D", "E"],
                args: [4, "", 4, 4],
                rowBlocks: [20, 21, 22],
                drums: ["kick drum"],
                colBlocks: [30]
            });

            expect(labels(pdm).map(cell => cell.dataset.noteArg)).toEqual(["C", "D", "E"]);
            expect(labels(pdm).map(cell => cell.textContent)).toEqual(["C4", "D4", "E4"]);
        });

        test("a rest is skipped when its translation isn't lower case", () => {
            global._ = s => (s === "rest" ? "Zurücksetzen" : s);
            try {
                const { pdm } = build({
                    labels: ["Zurücksetzen", "C"],
                    args: ["", 4],
                    rowBlocks: [20],
                    drums: ["kick drum"],
                    colBlocks: [30]
                });

                expect(labels(pdm).map(cell => cell.dataset.noteArg)).toEqual(["C"]);
                click(0, 0);
                expect(pdm._blockMap).toEqual([[20, 30]]);
            } finally {
                global._ = s => s;
            }
        });

        test("reopening skips a mapping whose pitch block is gone", () => {
            let pdm;
            expect(() => {
                ({ pdm } = build({
                    labels: ["C"],
                    args: [4],
                    rowBlocks: [21],
                    drums: ["kick drum"],
                    colBlocks: [30],
                    blockMap: [[20, 30]]
                }));
            }).not.toThrow();
            expect(document.getElementById("0,0").style.backgroundColor).toBe(selectorBackground);
            expect(typeof document.getElementById("0,0").onclick).toBe("function");
            expect(pdm._blockMap).toEqual([[20, 30]]);
        });

        test("picking another drum in a row replaces the old one without throwing", () => {
            const { pdm } = build({
                labels: ["C"],
                args: [4],
                rowBlocks: [20],
                drums: ["kick drum", "snare drum"],
                colBlocks: [30, 31]
            });

            click(0, 1);
            expect(() => pdm._setCellPitchDrum(0, 0, true)).not.toThrow();

            expect(pdm._blockMap).toEqual([[20, 30]]);
            expect(document.getElementById("0,1").style.backgroundColor).toBe(selectorBackground);
        });
    });

    describe("playback", () => {
        test("clears the row highlights when it finishes", () => {
            jest.useFakeTimers();
            const { pdm } = threeRows();
            click(0, 0);
            click(1, 0);
            click(2, 0);

            pdm.playButton.onclick();
            jest.advanceTimersByTime(1500);
            expect(labels(pdm).map(cell => cell.style.backgroundColor)).toEqual([
                labelColor,
                selectorBackground,
                labelColor
            ]);

            jest.advanceTimersByTime(3000);
            expect(pdm._playing).toBe(false);
            labels(pdm).forEach(cell => expect(cell.style.backgroundColor).toBe(labelColor));
        });

        test("clears the row highlights when stopped", () => {
            jest.useFakeTimers();
            const { pdm } = threeRows();
            click(0, 0);
            click(1, 0);

            pdm.playButton.onclick();
            jest.advanceTimersByTime(1500);
            pdm.playButton.onclick();

            labels(pdm).forEach(cell => expect(cell.style.backgroundColor).toBe(labelColor));
        });

        test("with nothing selected, stays stopped so the next Play starts", () => {
            jest.useFakeTimers();
            const { pdm, activity } = threeRows();

            pdm.playButton.onclick();
            expect(pdm._playing).toBe(false);

            click(0, 0);
            activity.logo.synth.trigger.mockClear();
            pdm.playButton.onclick();
            expect(pdm._playing).toBe(true);
            expect(activity.logo.synth.trigger).toHaveBeenCalledWith(
                0,
                "C4",
                0.125,
                "default",
                null,
                null
            );
        });

        test("restarting doesn't overlap the earlier run or end early", () => {
            jest.useFakeTimers();
            const { pdm, activity } = threeRows();
            click(0, 0);
            click(1, 0);
            click(2, 0);

            pdm.playButton.onclick();
            jest.advanceTimersByTime(500);
            pdm.playButton.onclick();
            jest.advanceTimersByTime(100);
            activity.logo.synth.trigger.mockClear();
            pdm.playButton.onclick();

            jest.advanceTimersByTime(2900);
            expect(pdm._playing).toBe(true);
            jest.advanceTimersByTime(200);
            expect(pdm._playing).toBe(false);

            const pitches = activity.logo.synth.trigger.mock.calls
                .filter(call => call[3] === "default")
                .map(call => call[1]);
            expect(pitches).toEqual(["C4", "D4", "E4"]);
        });

        test("Clear stops the old mapping from playing", () => {
            jest.useFakeTimers();
            const { pdm, activity } = threeRows();
            click(0, 0);
            click(1, 0);
            click(2, 0);

            pdm.playButton.onclick();
            jest.advanceTimersByTime(500);
            pdm._clear();
            activity.logo.synth.trigger.mockClear();
            jest.advanceTimersByTime(4000);

            expect(pdm._playing).toBe(false);
            expect(activity.logo.synth.trigger).not.toHaveBeenCalled();
            labels(pdm).forEach(cell => expect(cell.style.backgroundColor).toBe(labelColor));
        });
    });

    describe("layout and state", () => {
        test("restoring from full screen puts the outer div back", () => {
            threeRows();
            widgetWindow._maximized = true;
            widgetWindow.onmaximize();
            widgetWindow._maximized = false;
            widgetWindow.onmaximize();

            const outer = document.getElementById("pdmOuterDiv");
            expect(outer.style.height).toBe("400px");
            expect(outer.style.width).toBe("500px");
        });

        test("drum columns get a width in pixels", () => {
            const { pdm } = threeRows();

            expect(document.getElementById("0,0").style.width).toBe("50px");
            expect(pdm._pdmDrumTable.rows[0].cells[0].style.width).toBe("50px");
        });

        test("toggling a cell off removes its mapping", () => {
            const { pdm } = threeRows();
            for (let i = 0; i < 5; i++) {
                click(0, 0);
                click(0, 0);
            }
            expect(pdm._blockMap).toEqual([]);

            click(0, 0);
            expect(pdm._blockMap).toEqual([[20, 30]]);
        });
    });
});
