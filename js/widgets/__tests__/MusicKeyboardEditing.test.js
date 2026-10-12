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

const MusicKeyboardEditing = require("../MusicKeyboardEditing.js");

global.platformColor = { exitWheelcolors: ["#808080"] };
global.slicePath = () => ({
    DonutSlice: "donut",
    DonutSliceCustomization: () => ({})
});
global.wheelnav = class {
    constructor(id, raphael) {
        this.id = id;
        this.raphael = raphael;
    }
};
global.convertFromSolfege = name => name;

const EDITING_METHODS = [
    "_createExitWheel",
    "_configureExitWheel",
    "_createpiesubmenu",
    "_updateDuration",
    "_addNotes",
    "_deleteNotes",
    "_divideNotes",
    "_createAddRowPieSubmenu",
    "_addNotesBlockBetween",
    "_sortLayout",
    "_syncLayouts",
    "_removePitchBlock",
    "_createColumnPieSubmenu"
];

const makeKeyboard = (deps = {}) => {
    const keyboard = { _createTable: jest.fn() };
    MusicKeyboardEditing.install.call(keyboard, {
        FAKEBLOCKNUMBER: 100000,
        beginnerMode: "false",
        resolveSynthNoteName: jest.fn(),
        fillChromaticGaps: jest.fn(list => list),
        ...deps
    });
    return keyboard;
};

describe("MusicKeyboardEditing", () => {
    afterEach(() => {
        delete window.configureExitWheel;
    });

    test("install adds the editing methods to the keyboard", () => {
        const keyboard = makeKeyboard();

        for (const name of EDITING_METHODS) {
            expect(typeof keyboard[name]).toBe("function");
        }
    });

    test("each keyboard gets its own methods", () => {
        const first = makeKeyboard();
        const second = makeKeyboard();

        expect(first._divideNotes).not.toBe(second._divideNotes);
    });

    describe("exit wheel", () => {
        test("builds a donut wheel on the given canvas", () => {
            const { _createExitWheel } = makeKeyboard();
            const raphael = {};

            // Called detached: the arrow method must not depend on its receiver.
            const wheel = _createExitWheel(raphael, 0.3);

            expect(wheel).toBeInstanceOf(wheelnav);
            expect(wheel.id).toBe("_exitWheel");
            expect(wheel.raphael).toBe(raphael);
            expect(wheel.colors).toBe(platformColor.exitWheelcolors);
            expect(wheel.slicePathFunction).toBe("donut");
            expect(wheel.slicePathCustom.minRadiusPercent).toBe(0);
            expect(wheel.slicePathCustom.maxRadiusPercent).toBe(0.3);
            expect(wheel.sliceSelectedPathCustom).toBe(wheel.slicePathCustom);
            expect(wheel.sliceInitPathCustom).toBe(wheel.slicePathCustom);
            expect(wheel.clickModeRotate).toBe(false);
            expect(wheel.selectedNavItemIndex).toBeNull();
        });

        test("hands the wheel to window.configureExitWheel when it exists", () => {
            const { _configureExitWheel } = makeKeyboard();
            const wheel = {};

            expect(() => _configureExitWheel(wheel)).not.toThrow();

            window.configureExitWheel = jest.fn();
            _configureExitWheel(wheel);
            expect(window.configureExitWheel).toHaveBeenCalledWith(wheel);
        });
    });

    describe("dependencies from the constructor", () => {
        // A quarter note split in four is a 1/16 note: allowed in advanced
        // mode, below the 1/8 floor in beginner mode.
        const quarterNote = () => [{ startTime: 0, duration: 0.25, noteOctave: 4 }];

        test("beginnerMode keeps notes from being split below an eighth", () => {
            const keyboard = makeKeyboard({ beginnerMode: "true" });
            keyboard._notesPlayed = quarterNote();

            keyboard._divideNotes("0", 4);

            expect(keyboard._notesPlayed).toEqual(quarterNote());
            expect(keyboard._createTable).toHaveBeenCalled();
        });

        test("advanced mode splits the note evenly", () => {
            const keyboard = makeKeyboard({ beginnerMode: "false" });
            keyboard._notesPlayed = quarterNote();

            keyboard._divideNotes("0", 4);

            expect(keyboard._notesPlayed.map(note => [note.startTime, note.duration])).toEqual([
                [0, 0.0625],
                [62, 0.0625],
                [124, 0.0625],
                [186, 0.0625]
            ]);
        });

        test("each keyboard keeps the beginnerMode it was made with", () => {
            const beginner = makeKeyboard({ beginnerMode: "true" });
            const advanced = makeKeyboard({ beginnerMode: "false" });
            beginner._notesPlayed = quarterNote();
            advanced._notesPlayed = quarterNote();

            beginner._divideNotes("0", 4);
            advanced._divideNotes("0", 4);

            expect(beginner._notesPlayed).toHaveLength(1);
            expect(advanced._notesPlayed).toHaveLength(4);
        });

        test("_syncLayouts rebuilds the padding from the real rows only", () => {
            const fillChromaticGaps = jest.fn(list => [
                ...list,
                { noteName: "D", noteOctave: 4, blockNumber: 51 }
            ]);
            const keyboard = makeKeyboard({ FAKEBLOCKNUMBER: 50, fillChromaticGaps });
            keyboard.layout = [
                { noteName: "C", noteOctave: 4, blockNumber: 7 },
                { noteName: "hertz", noteOctave: 440, blockNumber: 8 },
                { noteName: "E", noteOctave: 4, blockNumber: 60 }
            ];

            keyboard._syncLayouts();

            // Block 60 is at or above FAKEBLOCKNUMBER (50), so it's an old padding
            // row: it isn't fed back into the gap-fill, and hertz rows never are.
            expect(fillChromaticGaps).toHaveBeenCalledWith([
                { noteName: "C", noteOctave: 4, blockNumber: 7 }
            ]);
            expect(keyboard.layout.map(note => [note.noteName, note.blockNumber])).toEqual([
                ["C", 7],
                ["D", 51],
                ["hertz", 8]
            ]);
        });
    });
});
