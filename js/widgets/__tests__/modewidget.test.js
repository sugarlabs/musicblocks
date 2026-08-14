/**
 * MusicBlocks v3.6.2
 *
 * @author Ashutosh Singh
 *
 * @copyright 2026 Ashutosh Singh
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
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA
 */

const ModeWidget = require("../modewidget.js");

// --- 1. Global Mocks ---
global._ = msg => msg;
global.platformColor = {
    selectorBackground: "#FFFFFF",
    selectorBackgroundHOVER: "#EEEEEE",
    modeWheelcolors: ["#FF0000", "#00FF00"],
    orange: "#FFA500"
};
global.DEFAULTVOICE = "piano";
global.last = arr => arr[arr.length - 1];

// Mock utils
global.docById = jest.fn().mockImplementation(id => ({
    style: {},
    innerHTML: "",
    append: jest.fn(),
    appendChild: jest.fn(),
    replaceChildren: jest.fn(),
    removeChild: jest.fn(),
    firstChild: null,
    rows: [{ cells: [{ innerHTML: "" }] }, { cells: [{ innerHTML: "" }] }],
    insertRow: jest.fn().mockReturnValue({
        insertCell: jest.fn().mockReturnValue({
            style: {},
            innerHTML: "",
            appendChild: jest.fn(),
            append: jest.fn()
        })
    })
}));

global.getNote = jest.fn().mockReturnValue(["C", "4"]);
global.keySignatureToMode = jest.fn().mockReturnValue(["C", "ionian"]);
global.normalizeNoteAccidentals = jest.fn().mockImplementation(n => n);
global.MUSICALMODES = {
    ionian: [2, 2, 1, 2, 2, 2, 1]
};
global.getCurrentEDO = jest.fn().mockReturnValue(12);
global.getModePattern = jest.fn().mockReturnValue([2, 2, 1, 2, 2, 2, 1]);

// Mock slicePath
global.slicePath = jest.fn().mockReturnValue({
    DonutSlice: jest.fn(),
    DonutSliceCustomization: jest.fn().mockReturnValue({})
});

// Mock wheelnav
global.wheelnav = jest.fn().mockImplementation(() => ({
    raphael: {},
    colors: [],
    slicePathFunction: null,
    slicePathCustom: {},
    sliceSelectedPathCustom: {},
    sliceInitPathCustom: {},
    navItems: [],
    createWheel: jest.fn().mockImplementation(function (labels) {
        this.navItems = labels.map(() => ({
            navItem: {
                hide: jest.fn(),
                show: jest.fn()
            },
            navigateFunction: null
        }));
    })
}));

// Mock Window
if (typeof window === "undefined") {
    global.window = {};
}
window.innerWidth = 1024;
window.widgetWindows = {
    windowFor: jest.fn().mockReturnValue({
        clear: jest.fn(),
        show: jest.fn(),
        destroy: jest.fn(),
        updateTitle: jest.fn(),
        addButton: jest.fn().mockImplementation(() => {
            const btn = {
                append: jest.fn(),
                appendChild: jest.fn(),
                replaceChildren: jest.fn(),
                removeChild: jest.fn(),
                firstChild: null
            };
            btn.onclick = jest.fn();
            return btn;
        }),
        getWidgetBody: jest.fn().mockReturnValue({
            append: jest.fn(),
            getElementsByTagName: jest.fn().mockReturnValue([
                {
                    style: {},
                    setAttribute: jest.fn()
                }
            ])
        }),
        getWidgetFrame: jest.fn().mockReturnValue({ offsetHeight: 500 }),
        getDragElement: jest.fn().mockReturnValue({ offsetHeight: 20 }),
        isMaximized: jest.fn().mockReturnValue(false),
        sendToCenter: jest.fn()
    })
};

// Mock Document
if (typeof document === "undefined") {
    global.document = {};
}
document.createElement = jest.fn().mockImplementation(tag => ({
    style: {},
    setAttribute: jest.fn(),
    innerHTML: "",
    append: jest.fn(),
    appendChild: jest.fn(),
    prepend: jest.fn(),
    addEventListener: jest.fn(),
    replaceChildren: jest.fn(),
    removeChild: jest.fn(),
    firstChild: null,
    insertRow: jest.fn().mockReturnValue({
        insertCell: jest.fn().mockReturnValue({
            style: {},
            innerHTML: ""
        })
    }),
    getElementById: jest.fn().mockReturnValue({ src: "" })
}));
document.getElementById = document.createElement; // For internal usage

describe("ModeWidget", () => {
    let modeWidget;
    let mockActivity;

    beforeEach(() => {
        mockActivity = {
            logo: {
                modeBlock: 1,
                resetSynth: jest.fn(),
                synth: {
                    trigger: jest.fn(),
                    stop: jest.fn()
                }
            },
            turtles: {
                ithTurtle: jest.fn().mockReturnValue({
                    singer: { keySignature: ["C"] }
                })
            },
            blocks: {
                blockList: []
            },
            storage: {},
            textMsg: jest.fn(),
            hideMsgs: jest.fn(),
            errorMsg: jest.fn(),
            refreshCanvas: jest.fn()
        };

        modeWidget = new ModeWidget(mockActivity);
    });

    test("should calculate major scale intervals correctly", () => {
        modeWidget._selectedNotes = [
            true,
            false,
            true,
            false,
            true,
            true,
            false,
            true,
            false,
            true,
            false,
            true
        ];

        expect(modeWidget._calculateMode()).toEqual([2, 2, 1, 2, 2, 2, 1]);
    });

    test("should return all 1s for chromatic scale", () => {
        modeWidget._selectedNotes = Array(12).fill(true);

        expect(modeWidget._calculateMode()).toEqual(Array(12).fill(1));
    });

    test("should return [12] when only root is selected", () => {
        modeWidget._selectedNotes = [
            true,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false
        ];

        expect(modeWidget._calculateMode()).toEqual([12]);
    });

    test("should save and undo state correctly", () => {
        modeWidget._selectedNotes = Array(12).fill(false);
        modeWidget._selectedNotes[0] = true;

        modeWidget._saveState();
        modeWidget._selectedNotes[1] = true;

        modeWidget._undo();

        expect(modeWidget._selectedNotes[1]).toBe(false);
    });

    test("should trigger synth when playing a note", () => {
        modeWidget._playNote(0);

        expect(mockActivity.logo.synth.trigger).toHaveBeenCalled();
    });

    test("should initialize a custom mode with only the root selected", () => {
        modeWidget._resetToCustom();

        expect(modeWidget._selectedNotes[0]).toBe(true);
        expect(modeWidget._selectedNotes.slice(1).every(v => v === false)).toBe(true);
    });

    test("should translate notes to a new EDO slice count", () => {
        modeWidget._activeEDO = 12;
        modeWidget._selectedNotes = [
            true,
            false,
            true,
            false,
            true,
            true,
            false,
            true,
            false,
            true,
            false,
            true
        ];

        modeWidget._translateNotesToEDO(19);

        expect(modeWidget._selectedNotes).toHaveLength(19);
        expect(modeWidget._selectedNotes[0]).toBe(true);
    });

    test("should persist a custom mode to the registry and localStorage", () => {
        const pattern = [2, 2, 1, 2, 2, 2, 1];
        modeWidget._saveCustomMode("myMode", pattern);

        expect(MUSICALMODES["myMode"]).toEqual(pattern);
        const saved = JSON.parse(localStorage.getItem("customModes"));
        expect(saved.some(m => m.name === "myMode" && m.pattern.join() === pattern.join())).toBe(
            true
        );
    });

    test("should scale built-in mode intervals to the active EDO", () => {
        modeWidget._activeEDO = 19;
        global.getModePattern.mockReturnValue([3, 2, 3, 3, 2, 3, 3]);
        const applySpy = jest.spyOn(modeWidget, "_applyModePattern").mockImplementation(() => {});
        const modeNameSpy = jest.spyOn(modeWidget, "_setModeName").mockImplementation(() => {});

        modeWidget._loadMode("minor", [2, 1, 2, 2, 1, 2, 2], { value: 19 });

        expect(global.getModePattern).toHaveBeenCalledWith("minor", 19);
        expect(applySpy).toHaveBeenCalledWith([3, 2, 3, 3, 2, 3, 3]);

        applySpy.mockRestore();
        modeNameSpy.mockRestore();
    });

    test("should use the stored pattern for a custom mode without rescaling", () => {
        localStorage.setItem(
            "customModes",
            JSON.stringify([{ name: "myMode", pattern: [3, 2, 3, 3, 2, 3, 3], edo: 19 }])
        );
        modeWidget._activeEDO = 19;
        global.getModePattern.mockClear();
        const applySpy = jest.spyOn(modeWidget, "_applyModePattern").mockImplementation(() => {});
        const modeNameSpy = jest.spyOn(modeWidget, "_setModeName").mockImplementation(() => {});

        modeWidget._loadMode("myMode", [3, 2, 3, 3, 2, 3, 3], { value: 19 });

        expect(global.getModePattern).not.toHaveBeenCalled();
        expect(applySpy).toHaveBeenCalledWith([3, 2, 3, 3, 2, 3, 3]);

        applySpy.mockRestore();
        modeNameSpy.mockRestore();
    });

    test("should detect a built-in mode at a non-12 EDO", () => {
        modeWidget._activeEDO = 19;
        modeWidget._modeLabelCell = { textContent: "" };
        modeWidget.widgetWindow = { updateTitle: jest.fn() };
        modeWidget._selectedNotes = Array.from({ length: 19 }, (_, i) =>
            [0, 3, 5, 8, 11, 13, 16].includes(i)
        );
        global.getModePattern.mockReturnValue([3, 2, 3, 3, 2, 3, 3]);

        modeWidget._setModeName();

        expect(modeWidget._modeLabelCell.textContent).toBe("C ionian");
    });
});
