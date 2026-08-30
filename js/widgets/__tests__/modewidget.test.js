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
    modeGroupWheelcolors: ["#111111"],
    modePieMenusIfColorPush: "#333333",
    modePieMenusElseColorPush: "#444444",
    textColor: "#ffffff",
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
    ionian: [2, 2, 1, 2, 2, 2, 1],
    minor: [2, 1, 2, 2, 1, 2, 2]
};
global.TEMPERAMENT = {
    "equal": { isEDO: true, pitchNumber: 12 },
    "just intonation": { isEDO: false, pitchNumber: 12 }
};
global.getCurrentEDO = jest.fn().mockReturnValue(12);
global.getModePattern = jest.fn().mockReturnValue([2, 2, 1, 2, 2, 2, 1]);
global.DEFAULTMODE = "major";
global.piemenuModes = jest.fn();

// Shared mode pie menu helpers, required from musicutils so the smoke tests
// exercise the real extraction logic (modewidget.js sees them as globals).
global.MODE_PIE_MENUS = {
    5: ["minor pentatonic", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "],
    7: ["ionian", " ", "dorian", " ", " ", " ", " ", " ", " ", "aeolian", " ", " "],
    custom: [" ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "]
};
const {
    MODEPIEMENU_GROUP_RING,
    MODEPIEMENU_NAME_RING,
    getSavedCustomModes,
    getModeNamesForGroup,
    getModeLabel,
    getModeNameFromLabel,
    getModeSliceColors,
    updateModeWheelItems,
    getModeGroupTitleFont,
    getModeSliceFont,
    configureWheel,
    scalePatternToEDO,
    isNonEDO,
    getNonEDOModeSteps,
    getNonEDOFrequency,
    isEquallyTempered,
    pitchToFrequency
} = require("../../utils/musicutils.js");
global.MODEPIEMENU_GROUP_RING = MODEPIEMENU_GROUP_RING;
global.MODEPIEMENU_NAME_RING = MODEPIEMENU_NAME_RING;
global.getSavedCustomModes = getSavedCustomModes;
global.getModeNamesForGroup = getModeNamesForGroup;
global.getModeLabel = getModeLabel;
global.getModeNameFromLabel = getModeNameFromLabel;
global.getModeSliceColors = getModeSliceColors;
global.updateModeWheelItems = updateModeWheelItems;
global.getModeGroupTitleFont = getModeGroupTitleFont;
global.getModeSliceFont = getModeSliceFont;
global.configureWheel = configureWheel;
global.configureExitWheel = jest.fn();
global.scalePatternToEDO = scalePatternToEDO;
global.isNonEDO = isNonEDO;
global.getNonEDOModeSteps = getNonEDOModeSteps;
global.getNonEDOFrequency = getNonEDOFrequency;
global.isEquallyTempered = isEquallyTempered;
global.pitchToFrequency = pitchToFrequency || jest.fn().mockReturnValue(440);
global.generateNoteNames =
    global.generateNoteNames ||
    jest.fn().mockReturnValue(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]);
global.numberToPitch = global.numberToPitch || jest.fn().mockReturnValue(["C", 4]);
global.NOTESTABLE = global.NOTESTABLE || [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B"
];

// Mock slicePath
global.slicePath = jest.fn().mockReturnValue({
    DonutSlice: jest.fn(),
    DonutSliceCustomization: jest.fn().mockReturnValue({})
});

// Mock wheelnav
global.wheelnav = jest.fn().mockImplementation(() => {
    const navItemTemplate = () => ({
        title: "",
        navItem: {
            hide: jest.fn(),
            show: jest.fn()
        },
        navigateFunction: null,
        fillAttr: "",
        titleAttr: {},
        titleHoverAttr: {},
        titleSelectedAttr: {},
        sliceHoverAttr: {},
        slicePathAttr: {},
        sliceSelectedAttr: {},
        basicNavTitleMax: {},
        basicNavTitleMin: {},
        hoverNavTitleMax: {},
        hoverNavTitleMin: {},
        selectedNavTitleMax: {},
        selectedNavTitleMin: {},
        initNavTitle: {}
    });
    const mockWheel = {
        raphael: {},
        colors: [],
        slicePathFunction: null,
        slicePathCustom: {},
        sliceSelectedPathCustom: {},
        sliceInitPathCustom: {},
        navItems: [],
        titleFont: "",
        selectedNavItemIndex: 0,
        createWheel: jest.fn().mockImplementation(function (labels) {
            if (labels) {
                this.navItems = labels.map((l, i) => {
                    const item = navItemTemplate();
                    item.title = l;
                    return item;
                });
            }
        }),
        navigateWheel: jest.fn().mockImplementation(function (index) {
            this.selectedNavItemIndex = index;
            if (
                this.navItems[index] &&
                typeof this.navItems[index].navigateFunction === "function"
            ) {
                this.navItems[index].navigateFunction();
            }
        }),
        refreshWheel: jest.fn(),
        removeWheel: jest.fn(),
        initWheel: jest.fn().mockImplementation(function (labels) {
            if (labels) {
                this.navItems = labels.map(l => {
                    const item = navItemTemplate();
                    item.title = l;
                    return item;
                });
            }
        })
    };
    return mockWheel;
});

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
// Add replaceChildren to modeTableDiv mock (used in constructor)
const originalCreateElement = document.createElement;
document.createElement = jest.fn(tag => {
    const el = originalCreateElement(tag);
    if (!el.replaceChildren) {
        el.replaceChildren = jest.fn();
    }
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

    test("non-EDO labeled temperament plays the octave an octave up", () => {
        const labels = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        const savedTemperament = global.TEMPERAMENT;
        const savedSpy = global.pitchToFrequency;
        global.TEMPERAMENT = {
            testNonEDO: {
                isEDO: false,
                noteLabels: labels,
                ratios: labels.map((_, i) => Math.pow(2, i / 12))
            }
        };
        modeWidget._activeTemperamentKey = "testNonEDO";
        modeWidget._activeEDO = labels.length;
        const spy = jest.spyOn(global, "pitchToFrequency");

        // Within-octave degree stays at octave 4.
        modeWidget._triggerNote(1, labels.length);
        expect(spy).toHaveBeenLastCalledWith(labels[1], 4, 0, ["C"], "testNonEDO");

        // The octave note (index === n) wraps to the root label but must
        // sound an octave higher (octave 5), not the starting note.
        modeWidget._triggerNote(labels.length, labels.length);
        expect(spy).toHaveBeenLastCalledWith(labels[0], 5, 0, ["C"], "testNonEDO");

        spy.mockRestore();
        global.pitchToFrequency = savedSpy;
        global.TEMPERAMENT = savedTemperament;
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

    test("should cache source EDO state before translating for round-trip restore", () => {
        // Simulate a 12-EDO major: notes at 0,2,4,5,7,9,11
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
        const originalNotes = modeWidget._selectedNotes.slice();

        // Cache the 12-EDO state (as _wireEdoSelect now does)
        modeWidget._edoNoteCache[12] = modeWidget._selectedNotes.slice();

        // Switch to 5-EDO (translate + cache destination)
        modeWidget._translateNotesToEDO(5);
        modeWidget._edoNoteCache[5] = modeWidget._selectedNotes.slice();
        modeWidget._activeEDO = 5;

        expect(modeWidget._selectedNotes).toHaveLength(5);

        // Switch back to 12-EDO — should restore from cache, not translate
        modeWidget._selectedNotes = modeWidget._edoNoteCache[12].slice();
        modeWidget._activeEDO = 12;

        expect(modeWidget._selectedNotes).toHaveLength(12);
        expect(modeWidget._selectedNotes).toEqual(originalNotes);
    });

    describe("_wireEdoSelect", () => {
        // Fires the real listener _wireEdoSelect registered via
        // addEventListener, since this file stubs document.createElement
        // to a plain mock (see top of file) rather than a real jsdom
        // element that supports dispatchEvent.
        function fireEdoChange(select, value) {
            select.value = value;
            const handler = select.addEventListener.mock.calls.find(
                call => call[0] === "change"
            )[1];
            handler();
        }

        test("rescales _selectedNotes to a never-before-visited EDO instead of leaving it untranslated", () => {
            modeWidget._activeTemperamentKey = "equal";
            modeWidget.logo.synth.inTemperament = "equal";
            modeWidget._activeEDO = 12;
            // 12-EDO major scale: root, 2nd, 3rd, 4th, 5th, 6th, 7th.
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
            modeWidget._edoNoteCache = {};

            const savedGetCurrentEDO = global.getCurrentEDO;
            const savedTemperament = global.TEMPERAMENT;
            global.getCurrentEDO = jest.fn(key => (key === "equal19" ? 19 : 12));
            global.TEMPERAMENT = {
                ...savedTemperament,
                equal19: { isEDO: true, pitchNumber: 19 }
            };

            fireEdoChange(modeWidget._edoSelect, "equal19");

            expect(modeWidget._activeEDO).toBe(19);
            expect(modeWidget._selectedNotes).toHaveLength(19);
            // A correct rescale of a 7-note pattern into 19-EDO spreads notes
            // across the full range (scalePatternToEDO puts them at 0, 3, 6,
            // 8, 11, 14, 17). Before the fix, _translateNotesToEDO's guard
            // always short-circuited, so nothing above index 11 ever got
            // selected — the array just got padded with false by
            // _reconcileNotes downstream, silently losing the scale.
            expect(modeWidget._selectedNotes.slice(12).some(v => v === true)).toBe(true);

            global.getCurrentEDO = savedGetCurrentEDO;
            global.TEMPERAMENT = savedTemperament;
        });

        test("restores from cache instead of re-translating on a previously-visited EDO", () => {
            modeWidget._activeTemperamentKey = "equal";
            modeWidget.logo.synth.inTemperament = "equal";
            modeWidget._activeEDO = 12;
            const twelveEdoNotes = [
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
            modeWidget._selectedNotes = twelveEdoNotes.slice();
            modeWidget._edoNoteCache = {};

            const savedGetCurrentEDO = global.getCurrentEDO;
            const savedTemperament = global.TEMPERAMENT;
            global.getCurrentEDO = jest.fn(key => (key === "equal19" ? 19 : 12));
            global.TEMPERAMENT = {
                ...savedTemperament,
                equal19: { isEDO: true, pitchNumber: 19 }
            };

            // Visit 19-EDO once, then switch back to 12-EDO.
            fireEdoChange(modeWidget._edoSelect, "equal19");
            fireEdoChange(modeWidget._edoSelect, "equal");

            expect(modeWidget._activeEDO).toBe(12);
            expect(modeWidget._selectedNotes).toEqual(twelveEdoNotes);

            global.getCurrentEDO = savedGetCurrentEDO;
            global.TEMPERAMENT = savedTemperament;
        });
    });

    test("should fall back to generated names when numberToPitch returns a NaN octave", () => {
        modeWidget._activeEDO = 5;
        global.numberToPitch = jest.fn().mockReturnValue([undefined, NaN]);
        global.generateNoteNames = jest.fn().mockReturnValue(["C", "D", "E", "G", "A"]);

        const result = modeWidget._pitchNameAndOctave(3);

        // j=3 with aIndex=4 ("A" at index 4 in a 5-EDO table): name E, octave 5.
        expect(result).toEqual(["E", 5]);
    });

    test("should show textMsg when notes are remapped on EDO switch", () => {
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

        // Simulate _wireEdoSelect cache-miss path
        modeWidget._edoNoteCache[12] = modeWidget._selectedNotes.slice();
        const oldEDO = modeWidget._activeEDO;
        modeWidget._translateNotesToEDO(5);
        modeWidget._edoNoteCache[5] = modeWidget._selectedNotes.slice();

        modeWidget.textMsg(
            `Mode remapped from ${oldEDO}-EDO to 5-EDO. Some notes may have changed.`,
            3000
        );

        expect(mockActivity.textMsg).toHaveBeenCalledWith(
            expect.stringContaining("remapped from 12"),
            3000
        );
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

    test("should refuse to overwrite a built-in mode on save", () => {
        const originalIonian = MUSICALMODES.ionian;

        const result = modeWidget._saveCustomMode("ionian", [2, 2, 1, 2, 2, 2, 1]);

        expect(result).toBe(false);
        expect(MUSICALMODES.ionian).toEqual(originalIonian);
        expect(mockActivity.errorMsg).toHaveBeenCalledWith(
            expect.stringContaining("Cannot overwrite built-in mode")
        );
    });

    test("should cancel in-flight animations and clear pending timeouts", () => {
        modeWidget._locked = true;
        modeWidget._playing = true;
        modeWidget._timeouts = [123, 456];
        modeWidget._newPattern = [true, false];
        modeWidget._notesToPlay = [0, 2];

        modeWidget._cancelAnimations();

        expect(modeWidget._locked).toBe(false);
        expect(modeWidget._playing).toBe(false);
        expect(modeWidget._timeouts).toEqual([]);
        expect(modeWidget._newPattern).toBeNull();
        expect(modeWidget._notesToPlay).toBeNull();
    });

    describe("_piemenuModes", () => {
        beforeEach(() => {
            global.piemenuModes.mockClear();
        });

        test("delegates to piemenuModes with a mock block", () => {
            modeWidget._selectedModeName = "dorian";
            modeWidget._piemenuModes();

            expect(global.piemenuModes).toHaveBeenCalledTimes(1);
            const [mockBlock, selectedMode] = global.piemenuModes.mock.calls[0];
            expect(selectedMode).toBe("dorian");
            expect(mockBlock.value).toBe("dorian");
            expect(mockBlock.activity).toBeDefined();
        });

        test("sets _modePiemenuOpen to true while open", () => {
            modeWidget._piemenuModes();
            expect(modeWidget._modePiemenuOpen).toBe(true);
        });

        test("intercept applies mode selection via _loadMode", () => {
            modeWidget._piemenuModes();
            const mockBlock = modeWidget._mockBlock;

            // Simulate piemenu setting a mode value
            mockBlock.value = "major";
            mockBlock.__selectionChanged();

            expect(modeWidget._selectedModeName).toBe("major");
        });
    });

    describe("_modeStepPattern", () => {
        test("prefers the native pattern when provided", () => {
            modeWidget._activeTemperamentKey = "just intonation";
            expect(modeWidget._modeStepPattern("major", [3, 2, 2, 3])).toEqual([3, 2, 2, 3]);
        });

        test("uses ratio-derived steps under a non-EDO temperament", () => {
            modeWidget._activeTemperamentKey = "just intonation";
            const spy = jest
                .spyOn(global, "getNonEDOModeSteps")
                .mockReturnValue([2, 2, 1, 2, 2, 2, 1]);
            const result = modeWidget._modeStepPattern("major", null);
            expect(spy).toHaveBeenCalledWith("major", "just intonation");
            expect(result).toEqual([2, 2, 1, 2, 2, 2, 1]);
            spy.mockRestore();
        });

        test("falls back to getModePattern at the active EDO when ratio mapping fails", () => {
            modeWidget._activeTemperamentKey = "just intonation";
            modeWidget._activeEDO = 12;
            const spy = jest.spyOn(global, "getNonEDOModeSteps").mockReturnValue(null);
            expect(modeWidget._modeStepPattern("dorian", null)).toEqual(
                global.getModePattern("dorian", 12)
            );
            spy.mockRestore();
        });
    });

    describe("mode pie menu safety", () => {
        test("closes when the control-bar button is clicked while open", () => {
            modeWidget._piemenuModes();
            expect(modeWidget._modePiemenuOpen).toBe(true);
            modeWidget._onModePieButtonClick();
            expect(modeWidget._modePiemenuOpen).toBe(false);
        });
    });
});
