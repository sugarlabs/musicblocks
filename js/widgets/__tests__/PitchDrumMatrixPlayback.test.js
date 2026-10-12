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

const DRUMS = ["kick drum"];
const labelColor = "rgb(144, 193, 0)";
const selectorBackground = "rgb(100, 181, 246)";
global._ = s => s;
global.platformColor = {
    labelColor,
    selectorBackground,
    selectorSelected: "rgb(208, 208, 208)"
};
global.docById = id => document.getElementById(id);
global.getDrumName = name => (DRUMS.includes(name) ? name : null);
global.getDrumIcon = () => "icon.svg";
global.getDrumSynthName = name => name;
global.getNote = (note, octave) => [note, octave];
global.normalizeNoteAccidentals = note => note;
global.Singer = { defaultBPMFactor: 1 };
global.MATRIXSOLFEHEIGHT = 30;
global.MATRIXSOLFEWIDTH = 80;

const PitchDrumMatrixPlayback = global.PitchDrumMatrixPlayback;
const METHODS = [
    "_setPlayButtonIcon",
    "_playAll",
    "_resetRowHighlights",
    "_playPitchDrum",
    "_clear"
];

describe("PitchDrumMatrixPlayback", () => {
    let pdm;
    let synth;
    let textMsg;

    // Three rows (C, D, E) and one drum; `mapped` are the rows mapped to it.
    const grid = mapped => {
        jest.useFakeTimers();
        document.body.innerHTML = "";
        synth = { trigger: jest.fn(), stop: jest.fn() };
        textMsg = jest.fn();
        pdm = new PitchDrumMatrix();
        pdm.activity = {
            logo: { synth },
            turtles: { ithTurtle: () => ({ singer: { keySignature: "C major" } }) },
            errorMsg: jest.fn(),
            textMsg
        };
        pdm.widgetWindow = {
            _maximized: false,
            timerManager: { setTimeout: (callback, delay) => setTimeout(callback, delay) }
        };
        pdm.playButton = document.createElement("div");
        pdm._cellScale = 1;
        pdm.rowLabels = ["C", "D", "E"];
        pdm.rowArgs = [4, 4, 4];
        pdm.drums = [...DRUMS];
        [20, 21, 22].forEach(blk => pdm.addRowBlock(blk));
        pdm.addColBlock(30);
        const table = document.createElement("table");
        table.id = "pdmTable";
        document.body.appendChild(table);
        pdm._pdmTable = table;
        pdm._pdmCellTables = [];
        pdm._makeDrumRow(pdm._makeRows());
        pdm.makeClickable();
        mapped.forEach(row => document.getElementById(row + ",0").click());
        synth.trigger.mockClear();
        return pdm;
    };
    const play = () => {
        pdm._playing = !pdm._playing;
        pdm._playAll();
    };
    const pitchesPlayed = () =>
        synth.trigger.mock.calls.map(call => call[1]).filter(note => note !== "C2");
    const labels = () => [...pdm._pdmTable.rows].slice(0, -1).map(row => row.cells[0]);
    const icon = () => pdm.playButton.querySelector("img").title;

    afterEach(() => {
        jest.useRealTimers();
    });

    test("holds exactly the methods moved out of PitchDrumMatrix", () => {
        const names = Object.getOwnPropertyNames(PitchDrumMatrixPlayback.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on PitchDrumMatrix.prototype", () => {
        expect(PitchDrumMatrix.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(PitchDrumMatrix.prototype[name]).toBe(PitchDrumMatrixPlayback.prototype[name]);
        }
    });

    test("_setPlayButtonIcon shows Play or Stop", () => {
        grid([]);

        pdm._setPlayButtonIcon("stop");
        expect(icon()).toBe("Stop");
        expect(pdm.playButton.querySelector("img").getAttribute("src")).toBe(
            "header-icons/stop-button.svg"
        );

        pdm._setPlayButtonIcon("play");
        expect(icon()).toBe("Play");
        expect(pdm.playButton.querySelectorAll("img")).toHaveLength(1);
    });

    test("plays each mapped row in turn, a second apart", () => {
        grid([0, 2]);

        play();
        expect(icon()).toBe("Stop");
        expect(pitchesPlayed()).toEqual(["C4"]);

        jest.advanceTimersByTime(2000);
        expect(pitchesPlayed()).toEqual(["C4", "E4"]);
    });

    test("highlights only the row being played", () => {
        grid([0, 1]);

        play();
        jest.advanceTimersByTime(1000);

        expect(labels().map(cell => cell.style.backgroundColor)).toEqual([
            labelColor,
            selectorBackground,
            labelColor
        ]);
    });

    test("puts the icon and highlights back when it finishes", () => {
        grid([0]);

        play();
        jest.advanceTimersByTime(3000);

        expect(pdm._playing).toBe(false);
        expect(icon()).toBe("Play");
        labels().forEach(cell => expect(cell.style.backgroundColor).toBe(labelColor));
    });

    test("stopping stops the sound and the rest of the rows", () => {
        grid([0, 1, 2]);
        play();

        play();
        jest.advanceTimersByTime(3000);

        expect(synth.stop).toHaveBeenCalled();
        expect(pitchesPlayed()).toEqual(["C4"]);
        expect(icon()).toBe("Play");
    });

    test("with nothing mapped, says how to map and stays stopped", () => {
        grid([]);

        play();

        expect(pdm._playing).toBe(false);
        expect(icon()).toBe("Play");
        expect(textMsg).toHaveBeenCalledWith("Click in the grid to map notes to drums.", 3000);
        expect(synth.trigger).not.toHaveBeenCalled();
    });

    test("Clear unselects every cell and forgets the mapping", () => {
        grid([0, 2]);

        pdm._clear();

        expect(pdm._blockMap).toEqual([]);
        for (const id of ["0,0", "2,0"]) {
            expect(document.getElementById(id).style.backgroundColor).toBe(selectorBackground);
        }
    });

    test("Clear during playback stops it", () => {
        grid([0, 1, 2]);
        play();

        pdm._clear();
        jest.advanceTimersByTime(3000);

        expect(pdm._playing).toBe(false);
        expect(pitchesPlayed()).toEqual(["C4"]);
    });
});
