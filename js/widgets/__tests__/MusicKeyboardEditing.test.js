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

global.platformColor = { exitWheelcolors: ["#808080"], pitchWheelcolors: ["#cccccc"] };
global.slicePath = () => ({
    DonutSlice: "donut",
    DonutSliceCustomization: () => ({})
});
const makeNavItem = () => ({
    navItem: { show: jest.fn(), hide: jest.fn() },
    navigateFunction: null
});
global.wheelnav = class {
    constructor(id, raphael) {
        this.id = id;
        this.raphael = raphael;
        this.navItems = [makeNavItem(), makeNavItem()];
        this.selectedNavItemIndex = null;
        this.keynavigateEnabled = false;
        this.keynavigateAtCreate = null;
    }

    createWheel(titles) {
        this.keynavigateAtCreate = this.keynavigateEnabled;
        this.navItems = titles.map(() => makeNavItem());
        return this;
    }

    navigateWheel(index) {
        this.selectedNavItemIndex = index;
        if (this.navItems[index] && this.navItems[index].navigateFunction) {
            this.navItems[index].navigateFunction();
        }
    }

    removeWheel() {}
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
        beginnerMode: false,
        resolveSynthNoteName: jest.fn(),
        fillChromaticGaps: jest.fn(list => list),
        ...deps
    });
    return keyboard;
};

describe("MusicKeyboardEditing", () => {
    afterEach(() => {
        MusicKeyboardEditing._wheelMenuOwner = null;
        delete window.configureExitWheel;
        delete global.docById;
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

    describe("duration submenu", () => {
        test("supports keyboard selection of a duration", () => {
            const keyboard = makeKeyboard();
            keyboard._claimWheelMenu = jest.fn();
            keyboard._mkbEl = () => ({ getBoundingClientRect: () => ({ x: 10, y: 20 }) });
            keyboard.activity = {
                canvas: { width: 600, height: 400 },
                getStageScale: () => 1
            };
            keyboard._updateDuration = jest.fn();
            global.docById = id => document.getElementById(id);

            const wheelDiv = document.createElement("div");
            wheelDiv.id = "wheelDivptm";
            const title = document.createElement("div");
            title.id = "wheelnav-wheelDivptm-title-3";
            title.appendChild(document.createElement("span"));
            document.body.append(wheelDiv, title);

            keyboard._createpiesubmenu("cells-0", "250");

            expect(keyboard._durationWheel.keynavigateAtCreate).toBe(true);
            expect(keyboard._menuWheel.keynavigateAtCreate).toBe(false);
            expect(keyboard._durationWheel.navItems).toHaveLength(8);

            keyboard._durationWheel.navigateWheel(1);
            expect(keyboard._updateDuration).toHaveBeenCalledWith("250", ["1", "4"]);
        });

        test("removes the previous duration wheel before rebuilding the menu", () => {
            const keyboard = makeKeyboard();
            keyboard._mkbEl = () => ({ getBoundingClientRect: () => ({ x: 10, y: 20 }) });
            keyboard.activity = {
                canvas: { width: 600, height: 400 },
                getStageScale: () => 1
            };
            keyboard._updateDuration = jest.fn();
            global.docById = id => document.getElementById(id);

            const wheelDiv = document.createElement("div");
            wheelDiv.id = "wheelDivptm";
            const title = document.createElement("div");
            title.id = "wheelnav-wheelDivptm-title-3";
            title.appendChild(document.createElement("span"));
            document.body.append(wheelDiv, title);

            keyboard._createpiesubmenu("cells-0", "250");
            const firstDurationWheel = keyboard._durationWheel;
            const removeWheel = jest.spyOn(firstDurationWheel, "removeWheel");

            keyboard._createpiesubmenu("cells-1", "500");

            expect(removeWheel).toHaveBeenCalledTimes(1);
            expect(keyboard._durationWheel).not.toBe(firstDurationWheel);
            expect(keyboard._durationWheel.keynavigateAtCreate).toBe(true);
        });
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
            const keyboard = makeKeyboard({ beginnerMode: true });
            keyboard._notesPlayed = quarterNote();

            keyboard._divideNotes("0", 4);

            expect(keyboard._notesPlayed).toEqual(quarterNote());
            expect(keyboard._createTable).toHaveBeenCalled();
        });

        test("advanced mode splits the note evenly", () => {
            const keyboard = makeKeyboard({ beginnerMode: false });
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
            const beginner = makeKeyboard({ beginnerMode: true });
            const advanced = makeKeyboard({ beginnerMode: false });
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
