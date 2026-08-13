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
            innerHTML: ""
        })
    })
}));

global.getNote = jest.fn().mockReturnValue(["C", "4"]);
global.keySignatureToMode = jest.fn().mockReturnValue(["C", "ionian"]);
global.normalizeNoteAccidentals = jest.fn().mockImplementation(n => n);
global.MUSICALMODES = {
    ionian: [2, 2, 1, 2, 2, 2, 1]
};
global.getModePattern = jest.fn((mode, edo) => global.MUSICALMODES[mode] || []);
global.getCurrentEDO = jest.fn(() => 12);
global.parseNoteString = jest.fn(() => ["C", 4]);
global.TEMPERAMENT = {
    "equal": { pitchNumber: 12, isEDO: true },
    "equal5": { pitchNumber: 5, isEDO: true },
    "equal19": { pitchNumber: 19, isEDO: true },
    "equal17": { isEDO: true, edo: 17 },
    "just intonation": { pitchNumber: 12, isEDO: false },
    "Pythagorean": { pitchNumber: 12, isEDO: false },
    "1/3 comma meantone": { pitchNumber: 19, isEDO: false },
    "1/4 comma meantone": { pitchNumber: 21, isEDO: false },
    "custom": { pitchNumber: 12 }
};
global.registerUserMode = jest.fn();
global.getUserModeNames = jest.fn(() => []);
global.removeUserMode = jest.fn();
global.NOTESTABLE = {
    0: "ti",
    1: "do",
    2: "do\u266F",
    3: "re",
    4: "re\u266F",
    5: "mi",
    6: "fa",
    7: "fa\u266F",
    8: "sol",
    9: "sol\u266F",
    10: "la",
    11: "la\u266F"
};

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
    removeWheel: jest.fn(),
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
document.createElement = jest.fn().mockImplementation(tag => {
    const el = {
        style: {},
        setAttribute: jest.fn(),
        innerHTML: "",
        appendChild: jest.fn(),
        removeChild: jest.fn(),
        firstChild: null,
        children: [],
        insertRow: jest.fn().mockReturnValue({
            insertCell: jest.fn().mockReturnValue({
                style: {},
                innerHTML: ""
            })
        }),
        getElementById: jest.fn().mockReturnValue({ src: "" })
    };
    el.append = jest.fn((...nodes) => {
        nodes.forEach(node => el.children.push(node));
    });
    el.replaceChildren = jest.fn((...nodes) => {
        el.children = [];
        nodes.forEach(node => el.children.push(node));
    });
    return el;
});
document.getElementById = document.createElement; // For internal usage

describe("ModeWidget", () => {
    let modeWidget;
    let mockActivity;

    beforeEach(() => {
        mockActivity = {
            logo: {
                modeBlock: 1,
                resetSynth: jest.fn(),
                setUserTemperament: jest.fn(k => {
                    mockActivity.logo.synth.inTemperament = k;
                }),
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

        global.MUSICALMODES = {
            ionian: [2, 2, 1, 2, 2, 2, 1],
            custom: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        };
        global.getUserModeNames.mockReturnValue([]);
        global.registerUserMode.mockClear();
        global.removeUserMode.mockClear();
        global.getCurrentEDO.mockReturnValue(12);
        global.docById.mockReturnValue({
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
                    innerHTML: ""
                })
            })
        });

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

    test("should handle empty selectedNotes safely", () => {
        modeWidget._selectedNotes = [];

        const result = modeWidget._calculateMode();

        expect(result).toBeDefined();
    });

    test("should handle malformed selectedNotes safely", () => {
        modeWidget._selectedNotes = [true, undefined, false, null, true];

        const result = modeWidget._calculateMode();

        expect(Array.isArray(result)).toBe(true);
    });

    test("undo should not crash when stack is empty", () => {
        modeWidget._undoStack = [];
        modeWidget._undo();

        expect(modeWidget._selectedNotes).toBeDefined();
    });

    test("should return correct playing status", () => {
        modeWidget._playing = false;
        expect(modeWidget._playingStatus()).toBe(false);

        modeWidget._playing = true;
        expect(modeWidget._playingStatus()).toBe(true);
    });

    test("should save and undo state correctly", () => {
        modeWidget._selectedNotes = Array(12).fill(false);
        modeWidget._selectedNotes[0] = true;

        modeWidget._saveState();
        modeWidget._selectedNotes[1] = true;

        modeWidget._undo();

        expect(modeWidget._selectedNotes[1]).toBe(false);
    });

    test("should clear all notes except root", () => {
        modeWidget._selectedNotes = Array(12).fill(true);

        modeWidget._clear();

        expect(modeWidget._selectedNotes[0]).toBe(true);
        for (let i = 1; i < 12; i++) {
            expect(modeWidget._selectedNotes[i]).toBe(false);
        }
    });

    test("should trigger synth when playing a note", () => {
        modeWidget._playNote(0);

        expect(mockActivity.logo.synth.trigger).toHaveBeenCalled();
    });

    test("should initialize correctly", () => {
        expect(global.wheelnav).toHaveBeenCalledTimes(3); // noteWheel, playWheel, etc.
        expect(mockActivity.textMsg).toHaveBeenCalled();
    });

    test("should handle Play/Stop button toggle", () => {
        jest.useFakeTimers();
        const widgetWindow = window.widgetWindows.windowFor();
        const playBtnMock = widgetWindow.addButton.mock.results[0].value;

        // Start
        expect(modeWidget._playing).toBe(false);
        playBtnMock.onclick();
        expect(modeWidget._playing).toBe(true);
        expect(mockActivity.logo.resetSynth).toHaveBeenCalled();

        // Stop
        playBtnMock.onclick();
        expect(modeWidget._playing).toBe(false);
        jest.useRealTimers();
    });

    test("should rotate mode pattern right", () => {
        // Setup: Need true at index 11 so that after 1 right shift (new[0] = old[11]), index 0 is true.
        // This ensures the recursion stops after 1 rotation.
        modeWidget._selectedNotes = [
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
            false,
            true
        ];

        // Wait for rotation animations
        jest.useFakeTimers();
        modeWidget._rotateRight();

        // Fast forward through animations (12 * ROTATESPEED)
        jest.advanceTimersByTime(12 * 150 + 100);

        expect(modeWidget._locked).toBe(false);
        jest.useRealTimers();
    });

    test("should rotate mode pattern left", () => {
        // Setup: Need true at index 1 so that after 1 left shift (new[0] = old[1]), index 0 is true.
        modeWidget._selectedNotes = [
            false,
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
            false
        ];

        jest.useFakeTimers();
        modeWidget._rotateLeft();
        jest.advanceTimersByTime(12 * 150 + 100);

        expect(modeWidget._locked).toBe(false);
        jest.useRealTimers();
    });

    test("should invert mode pattern", () => {
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
            true,
            false
        ]; // C and B

        jest.useFakeTimers();
        modeWidget._invert(); // Inverts pairs around current axis
        jest.advanceTimersByTime(6 * 150);

        expect(modeWidget._locked).toBe(false);
        jest.useRealTimers();
    });

    test("onclose handler should stop synth and reset lock state", () => {
        const widgetWindow = window.widgetWindows.windowFor();

        modeWidget._locked = true;

        // Trigger onclose
        widgetWindow.onclose();

        expect(mockActivity.logo.synth.stop).toHaveBeenCalled();
        expect(modeWidget._locked).toBe(false);
    });

    test("_save emits an action block and a define-mode block for a non-12 mode", () => {
        global.docById.mockReturnValue({ rows: [{ cells: [{ textContent: "" }] }] });
        mockActivity.blocks.loadNewBlocks = jest.fn();
        modeWidget._setTimeout = fn => fn();
        modeWidget._modeNameInput = { value: "my custom mode" };

        // 19-EDO major-scale selection.
        mockActivity.logo.synth.inTemperament = "equal19";
        modeWidget._activeEDO = 19;
        modeWidget._selectedNotes = Array(19).fill(false);
        for (const pos of [0, 3, 6, 8, 11, 14, 17]) {
            modeWidget._selectedNotes[pos] = true;
        }

        modeWidget._save();

        // Storage write is gated to the empty/unnamed or explicitly named
        // "custom" mode; named modes must not overwrite the built-in custom
        // mode's persisted pattern.
        expect(mockActivity.storage.custommode).toBeUndefined();

        // Two block stacks are generated: action + define-mode.
        expect(mockActivity.blocks.loadNewBlocks).toHaveBeenCalledTimes(2);

        // First stack: action block with pitchnumber children.
        const actionStack = mockActivity.blocks.loadNewBlocks.mock.calls[0][0];
        expect(actionStack[0][1][0]).toBe("action");
        expect(actionStack[1][1][0]).toBe("text");
        expect(actionStack[1][1][1].value).toBe("my custom mode");
        const actionNumbers = actionStack
            .filter(b => Array.isArray(b[1]) && b[1][0] === "number")
            .map(b => b[1][1].value)
            .sort((a, b) => a - b);
        expect(actionNumbers).toEqual([0, 3, 6, 8, 11, 14, 17]);
        // Pitchnumber children must flow lowest to highest in chain order.
        const actionNumbersInOrder = actionStack
            .filter(b => Array.isArray(b[1]) && b[1][0] === "number")
            .map(b => b[1][1].value);
        expect(actionNumbersInOrder).toEqual([0, 3, 6, 8, 11, 14, 17]);

        // Second stack: set-temperament + define-mode.
        const defineStack = mockActivity.blocks.loadNewBlocks.mock.calls[1][0];
        expect(defineStack[0][1]).toBe("settemperament");
        expect(defineStack[0][4]).toEqual([null, 1, 2, 3, 4]);
        expect(defineStack[1][1][0]).toBe("temperamentname");
        expect(defineStack[1][1][1].value).toBe("equal19");
        expect(defineStack[2][1][0]).toBe("notename");
        expect(defineStack[3][1][0]).toBe("number");
        expect(defineStack[3][1][1].value).toBe(4);

        expect(defineStack[4][1][0]).toBe("definemode");
        expect(defineStack[4][4]).toEqual([0, 5, 7, 6]);
        expect(defineStack[5][1][1].value).toBe("my custom mode");
        const defineNumbers = defineStack
            .filter(b => Array.isArray(b[1]) && b[1][0] === "number")
            .map(b => b[1][1].value)
            .sort((a, b) => a - b);
        expect(defineNumbers).toEqual([4, 0, 3, 6, 8, 11, 14, 17].sort((a, b) => a - b));
    });

    test("_save emits an action block and a bare define-mode stack for 12-EDO", () => {
        global.docById.mockReturnValue({ rows: [{ cells: [{ textContent: "" }] }] });
        mockActivity.blocks.loadNewBlocks = jest.fn();
        modeWidget._setTimeout = fn => fn();
        modeWidget._modeNameInput = { value: "plain major" };

        modeWidget._activeEDO = 12;
        modeWidget._selectedNotes = Array(12).fill(false);
        for (const pos of [0, 2, 4, 5, 7, 9, 11]) {
            modeWidget._selectedNotes[pos] = true;
        }

        modeWidget._save();

        // Two block stacks: action + define-mode.
        expect(mockActivity.blocks.loadNewBlocks).toHaveBeenCalledTimes(2);

        // First stack: action block with solfege pitch children.
        const actionStack = mockActivity.blocks.loadNewBlocks.mock.calls[0][0];
        expect(actionStack[0][1][0]).toBe("action");
        expect(actionStack[1][1][0]).toBe("text");
        expect(actionStack[1][1][1].value).toBe("plain major");
        expect(actionStack.some(b => b[1] === "pitch")).toBe(true);
        // Pitches must flow lowest to highest (Do first, Ti last).
        const solfegeValues = actionStack
            .filter(b => Array.isArray(b[1]) && b[1][0] === "solfege")
            .map(b => b[1][1].value);
        expect(solfegeValues).toEqual(["do", "re", "mi", "fa", "sol", "la", "ti"]);

        // Second stack: define-mode without set-temperament.
        const defineStack = mockActivity.blocks.loadNewBlocks.mock.calls[1][0];
        expect(defineStack[0][1][0]).toBe("definemode");
        expect(defineStack[0][4]).toEqual([null, 1, 3, 2]);
        expect(defineStack.some(b => Array.isArray(b[1]) && b[1][0] === "settemperament")).toBe(
            false
        );
        const numbers = defineStack
            .filter(b => Array.isArray(b[1]) && b[1][0] === "number")
            .map(b => b[1][1].value)
            .sort((a, b) => a - b);
        expect(numbers).toEqual([0, 2, 4, 5, 7, 9, 11]);
    });

    test("_rotateRight does nothing when the wheel is empty", () => {
        // Regression: with a blank slate (nothing selected), the animation
        // loop could never terminate because the "first note selected" exit
        // condition never became true.
        modeWidget._selectedNotes = Array(12).fill(false);
        modeWidget._setTimeout = jest.fn(fn => fn());

        modeWidget._rotateRight();

        expect(modeWidget._locked).toBe(false);
        expect(modeWidget._setTimeout).not.toHaveBeenCalled();
    });

    test("_rotateLeft does nothing when the wheel is empty", () => {
        modeWidget._selectedNotes = Array(12).fill(false);
        modeWidget._setTimeout = jest.fn(fn => fn());

        modeWidget._rotateLeft();

        expect(modeWidget._locked).toBe(false);
        expect(modeWidget._setTimeout).not.toHaveBeenCalled();
    });

    test("_save does not emit block stacks when the wheel is empty", () => {
        // Regression: emitting an action block with zero selected notes
        // referenced a non-existent child-flow block index and crashed
        // Blocks.loadNewBlocks (blocks.js:5254).
        modeWidget._selectedNotes = Array(12).fill(false);
        modeWidget._setTimeout = fn => fn();
        mockActivity.blocks.loadNewBlocks = jest.fn();

        modeWidget._save();

        expect(mockActivity.errorMsg).toHaveBeenCalled();
        expect(mockActivity.blocks.loadNewBlocks).not.toHaveBeenCalled();
    });

    test("_setActiveEDO applies a non-EDO temperament by its unique key", () => {
        // Regression: dropdown option values used to collide on the integer
        // step count, so a non-EDO temperament like 1/3 comma meantone (also
        // 19 steps) was resolved to "equal19".
        modeWidget._setActiveEDO("1/3 comma meantone");

        expect(mockActivity.logo.setUserTemperament).toHaveBeenCalledWith("1/3 comma meantone");
        expect(modeWidget._activeEDO).toBe(19);
        expect(modeWidget._edoSelect.value).toBe("1/3 comma meantone");
    });
});
