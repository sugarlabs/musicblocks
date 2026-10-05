/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2026 Ashutosh Kumar
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const {
    piemenuPitches,
    piemenuIntervals,
    piemenuKey,
    piemenuNumber,
    piemenuModes,
    piemenuNoteValue,
    piemenuColor
} = require("../piemenus");
const Block = require("../block");

// Mock Globals
global.INTERVALS = [
    ["perfect", "perfect", [1, 4, 5, 8]],
    ["minor", "minor", [2, 3, 6, 7]]
];
global.INTERVALVALUES = {
    "perfect 1": [0, 1],
    "perfect 4": [0, 4],
    "minor 2": [0, 2],
    "minor 3": [0, 3]
};
global.DEFAULTVOLUME = 0.5;
global.SHARP = "#";
global.FLAT = "b";
global.Singer = { setSynthVolume: jest.fn() };
global.docById = jest.fn().mockReturnValue({
    style: { display: "", opacity: "" },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    getBoundingClientRect: jest.fn().mockReturnValue({ x: 0, y: 0 })
});
global.document = {
    getElementById: global.docById,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
};
global.window = {
    innerWidth: 1024,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
};
global.wheelnav = jest.fn().mockImplementation(function (div) {
    const mockWheel = this;
    this.id = div;
    this.wheelRadius = 600;
    const navItemTemplate = () => ({
        title: "",
        enabled: true,
        navItem: {
            hide: jest.fn(),
            show: jest.fn(),
            forEach: jest.fn(),
            node: { style: { pointerEvents: "auto" } }
        },
        fillAttr: "",
        titleAttr: {},
        titleHoverAttr: {},
        titleSelectedAttr: {},
        sliceSelectedAttr: {},
        sliceHoverAttr: {},
        slicePathAttr: {},
        basicNavTitleMax: {},
        basicNavTitleMin: {},
        hoverNavTitleMax: {},
        hoverNavTitleMin: {},
        selectedNavTitleMax: {},
        selectedNavTitleMin: {},
        initNavTitle: {},
        navTitle: { attr: jest.fn() }
    });
    this.navItems = Array.from({ length: 40 }, navItemTemplate);
    this.selectedNavItemIndex = 0;
    this.colors = [];
    this.raphael = { canvas: {} };
    this.on = jest.fn();
    this.createWheel = jest.fn(labels => {
        if (labels) {
            this.navItems = labels.map((l, i) => {
                const item = navItemTemplate();
                item.title = l;
                return item;
            });
        }
    });
    this.initWheel = jest.fn();
    this.navigateWheel = jest.fn(index => {
        this.selectedNavItemIndex = index;
        if (this.navItems[index] && typeof this.navItems[index].navigateFunction === "function") {
            this.navItems[index].navigateFunction();
        }
    });
    this.removeWheel = jest.fn();
    this.refreshWheel = jest.fn();
    this.setTooltips = jest.fn();
});
global.slicePath = jest.fn().mockReturnValue({
    DonutSlice: jest.fn(),
    DonutSliceCustomization: jest.fn().mockReturnValue({ minRadiusPercent: 0, maxRadiusPercent: 0 })
});
global.platformColor = {
    pitchWheelcolors: ["#ff0000"],
    exitWheelcolors: ["#00ff00"],
    accidentalsWheelcolors: ["#0000ff"],
    octavesWheelcolors: ["#ffff00"],
    accidentalsWheelcolorspush: "#cccccc",
    modeWheelcolors: ["#111111"],
    modeGroupWheelcolors: ["#222222"],
    modePieMenusIfColorPush: "#333333",
    modePieMenusElseColorPush: "#444444",
    textColor: "#ffffff"
};
global._ = jest.fn(s => s);
global.announceToScreenReader = jest.fn();
global.Tone = {
    start: jest.fn().mockResolvedValue(),
    context: { state: "running" }
};
global.last = arr => arr[arr.length - 1];
global.MUSICALMODES = {
    ionian: [2, 2, 1, 2, 2, 2, 1],
    major: [2, 2, 1, 2, 2, 2, 1],
    aeolian: [2, 1, 2, 2, 1, 2, 2],
    minor: [2, 1, 2, 2, 1, 2, 2],
    dorian: [2, 1, 2, 2, 2, 1, 2]
};
global.MODE_PIE_MENUS = {
    5: ["minor pentatonic", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "],
    7: ["ionian", " ", "dorian", " ", " ", " ", " ", " ", " ", "aeolian", " ", " "],
    custom: [" ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "]
};
global.getCurrentEDO = jest.fn().mockReturnValue(12);
global.DEFAULTVOLUME = 0.5;
global.SHARP = "♯";
global.FLAT = "♭";
global.getSavedCustomModes = () => [];
global.getModeNamesForGroup = (grp, customModeNames = []) => {
    if (grp !== "custom") {
        return MODE_PIE_MENUS[grp];
    }
    const names = customModeNames.slice(0, 12);
    while (names.length < 12) {
        names.push(" ");
    }
    return names;
};
global.getModeLabel = modename => {
    switch (modename) {
        case "ionian":
        case "major":
            return "major / ionian";
        case "aeolian":
        case "minor":
            return "minor / aeolian";
        default:
            return modename === " " ? " " : modename;
    }
};
global.getModeNameFromLabel = (label, modes) => {
    if (label === "major / ionian") {
        return "major";
    }
    if (label === "minor / aeolian") {
        return "aeolian";
    }
    return label;
};
global.getModeSliceColors = (modes, colors) =>
    modes.map(modename => (modename === " " ? colors.emptyColor : colors.filledColor));
global.updateWheelItems = jest.fn();
global.getModeGroupTitleFont = wheelRadius => `100 ${Math.round(0.08 * wheelRadius)}px sans-serif`;
global.getModeSliceFont = (wheelRadius, sliceCount, labelLen) => {
    const arcPx = (2 * Math.PI * 0.575 * wheelRadius) / sliceCount;
    const size = Math.floor((arcPx * 0.85) / (labelLen * 0.6));
    const minSize = Math.round(0.06 * wheelRadius);
    const maxSize = Math.round(0.12 * wheelRadius);
    const clamped = Math.min(maxSize, Math.max(minSize, size));
    return `100 ${clamped}px sans-serif`;
};
global.configureWheel = jest.fn();

global.Synth = jest.fn().mockImplementation(() => ({
    newTone: jest.fn(),
    tone: {},
    createDefaultSynth: jest.fn(),
    loadSynth: jest.fn().mockResolvedValue(),
    setMasterVolume: jest.fn(),
    setVolume: jest.fn(),
    trigger: jest.fn().mockResolvedValue()
}));
global.instruments = [{}];
global.DEFAULTVOICE = "sine";
global.PREVIEWVOLUME = 0.5;
global.getNote = jest.fn().mockReturnValue(["C", 4]);
global.buildScale = jest.fn(() => [["C", "D", "E", "F", "G", "A", "B", "C"], []]);

global.DEFAULTVOLUME = 0.5;
global.Singer = { setSynthVolume: jest.fn() };
global.SHARP = "♯";
global.FLAT = "♭";

describe("piemenus behavioral tests", () => {
    let mockBlock;

    beforeEach(() => {
        mockBlock = {
            container: { x: 100, y: 100, setChildIndex: jest.fn(), children: [] },
            blocks: {
                stageClick: false,
                blockScale: 1,
                turtles: { _canvas: { width: 1000, height: 1000 } },
                findPitchOctave: jest.fn().mockReturnValue(4),
                setPitchOctave: jest.fn(),
                blockList: { "mock-id": { name: "mock-block" } }
            },
            activity: {
                canvas: { offsetLeft: 0, offsetTop: 0 },
                blocksContainer: { x: 0, y: 0 },
                getStageScale: jest.fn().mockReturnValue(1),
                KeySignatureEnv: ["C", "major", false],
                logo: { synth: new global.Synth(), errorMsg: jest.fn() }
            },
            connections: ["mock-id"],
            updateCache: jest.fn(),
            text: { text: "" },
            value: "",
            name: "notename"
        };
        jest.clearAllMocks();
    });

    test("piemenuPitches sets up wheels correctly", () => {
        const noteLabels = ["C", "D", "E", "F", "G", "A", "B"];
        const noteValues = ["C", "D", "E", "F", "G", "A", "B"];
        piemenuPitches(mockBlock, noteLabels, noteValues, ["♯", "♭"], "C", "");

        expect(global.wheelnav).toHaveBeenCalled();
        expect(mockBlock._pitchWheel).toBeDefined();
        expect(mockBlock._accidentalsWheel).toBeDefined();
        expect(mockBlock._exitWheel).toBeDefined();
    });

    test("piemenuPitches works for a note name block with no parent", async () => {
        const noteLabels = ["C", "D", "E", "F", "G", "A", "B"];
        const noteValues = ["C", "D", "E", "F", "G", "A", "B"];

        // A note name block dragged out on its own has a null parent.
        mockBlock.connections = [null];

        expect(() =>
            piemenuPitches(mockBlock, noteLabels, noteValues, ["♯", "♭"], "G", "")
        ).not.toThrow();

        mockBlock._pitchWheel.selectedNavItemIndex = 0;
        mockBlock._pitchWheel.navItems[0].title = "C";
        await mockBlock._pitchWheel.navItems[0].navigateFunction();

        mockBlock._accidentalsWheel.selectedNavItemIndex = 0;
        mockBlock._accidentalsWheel.navItems[0].title = "♮";

        expect(() => mockBlock._exitWheel.navItems[0].navigateFunction()).not.toThrow();
        expect(mockBlock.value).toBe("C");
    });

    test("piemenu exit safely hides label and removes hasKeyboard from labelDiv", () => {
        const noteLabels = ["C", "D", "E", "F", "G", "A", "B"];
        const noteValues = ["C", "D", "E", "F", "G", "A", "B"];
        const labelDiv = { classList: { remove: jest.fn() } };
        global.docById = jest.fn(id => (id === "labelDiv" ? labelDiv : { style: {} }));

        mockBlock.label = { style: { display: "block" } };
        piemenuPitches(mockBlock, noteLabels, noteValues, ["♯", "♭"], "C", "");

        mockBlock._exitWheel.navItems[0].navigateFunction();

        expect(mockBlock.label.style.display).toBe("none");
        expect(labelDiv.classList.remove).toHaveBeenCalledWith("hasKeyboard");
    });

    test("pitch wrapping logic generic application (7 notes)", async () => {
        const noteLabels = ["C", "D", "E", "F", "G", "A", "B"];
        const noteValues = ["C", "D", "E", "F", "G", "A", "B"];

        // Ensure hasOctaveWheel is true
        mockBlock.blocks.blockList["mock-id"].name = "pitch";

        // Initial note was B (index 6).
        piemenuPitches(mockBlock, noteLabels, noteValues, ["♯", "♭"], "B", "");

        // Find the navigate function for the pitch wheel
        const navigateFunc = mockBlock._pitchWheel.navItems[0].navigateFunction; // Navigate to C (index 0)

        // Setup state for the navigate function
        mockBlock._pitchWheel.selectedNavItemIndex = 0;
        mockBlock._pitchWheel.navItems[0].title = "C";

        await navigateFunc();

        // Verify octave adjustment was called
        // Since B(6) -> C(0) is +1 wrapped, prev+delta = 7 > 6. deltaOctave = -1
        expect(mockBlock.blocks.setPitchOctave).toHaveBeenCalledWith("mock-id", 3);
    });

    test("pitch wrapping logic handles different note counts (e.g. 5 notes)", async () => {
        const noteLabels = ["N1", "N2", "N3", "N4", "N5"];
        const noteValues = ["N1", "N2", "N3", "N4", "N5"];

        // Ensure hasOctaveWheel is true
        mockBlock.blocks.blockList["mock-id"].name = "pitch";

        // Initial note was N5 (index 4).
        piemenuPitches(mockBlock, noteLabels, noteValues, ["♯", "♭"], "N5", "");

        // Navigate to N1 (index 0)
        const navigateFunc = mockBlock._pitchWheel.navItems[0].navigateFunction;

        // Setup state for the navigate function
        mockBlock._pitchWheel.selectedNavItemIndex = 0;
        mockBlock._pitchWheel.navItems[0].title = "N1";

        await navigateFunc();

        // N5(4) -> N1(0). noteCount=5, halfSpan=2.5. deltaPitch=-4.
        // -4 < -2.5, so delta = -4 + 5 = 1.
        // prevPitch+delta = 4+1 = 5. 5 > 4, so deltaOctave = -1.
        // Octave 4 -> 3.
        expect(mockBlock.blocks.setPitchOctave).toHaveBeenCalledWith("mock-id", 3);
    });
    test("announces the previewed note to screen readers on pitch navigation", async () => {
        const noteLabels = ["C", "D", "E", "F", "G", "A", "B"];
        const noteValues = ["C", "D", "E", "F", "G", "A", "B"];

        mockBlock.blocks.blockList["mock-id"].name = "pitch";

        piemenuPitches(mockBlock, noteLabels, noteValues, ["♯", "♭"], "B", "");

        const navigateFunc = mockBlock._pitchWheel.navItems[0].navigateFunction;
        mockBlock._pitchWheel.selectedNavItemIndex = 0;
        mockBlock._pitchWheel.navItems[0].title = "C";

        await navigateFunc();

        expect(global.announceToScreenReader).toHaveBeenCalledWith(expect.stringContaining("C"));
    });

    test("does not announce when the trigger is locked (rapid navigation)", async () => {
        const noteLabels = ["C", "D", "E", "F", "G", "A", "B"];
        const noteValues = ["C", "D", "E", "F", "G", "A", "B"];

        mockBlock.blocks.blockList["mock-id"].name = "pitch";

        piemenuPitches(mockBlock, noteLabels, noteValues, ["♯", "♭"], "B", "");

        const navigateFunc = mockBlock._pitchWheel.navItems[0].navigateFunction;
        mockBlock._pitchWheel.selectedNavItemIndex = 0;
        mockBlock._pitchWheel.navItems[0].title = "C";

        mockBlock._triggerLock = true;
        global.announceToScreenReader.mockClear();

        await navigateFunc();

        expect(global.announceToScreenReader).not.toHaveBeenCalled();
    });

    describe("Phrase Maker refresh on pitch change", () => {
        const noteLabels = ["C", "D", "E", "F", "G", "A", "B"];
        const noteValues = ["C", "D", "E", "F", "G", "A", "B"];

        beforeEach(() => {
            // hasOctaveWheel requires the parent block to be a "pitch"-family wrapper.
            mockBlock.blocks.blockList["mock-id"].name = "pitch";
        });

        test("notifies an open Phrase Maker when the exit wheel commits a new pitch", () => {
            const refreshRowForBlock = jest.fn();
            mockBlock.activity.logo.phraseMaker = { refreshRowForBlock };

            piemenuPitches(mockBlock, noteLabels, noteValues, ["♯", "♭"], "C", "");

            // Select G (index 4), natural accidental, octave 5.
            mockBlock._pitchWheel.selectedNavItemIndex = 4;
            mockBlock._accidentalsWheel.selectedNavItemIndex = 2;
            mockBlock._accidentalsWheel.navItems[2].title = "♮";
            mockBlock._octavesWheel.selectedNavItemIndex = 3;

            mockBlock._exitWheel.navItems[0].navigateFunction();

            expect(refreshRowForBlock).toHaveBeenCalledWith("mock-id", "G", "♮", 5);
        });

        test("does not throw and does not touch unrelated widgets when no Phrase Maker is open", () => {
            piemenuPitches(mockBlock, noteLabels, noteValues, ["♯", "♭"], "C", "");

            mockBlock._pitchWheel.selectedNavItemIndex = 4;
            mockBlock._accidentalsWheel.selectedNavItemIndex = 2;
            mockBlock._octavesWheel.selectedNavItemIndex = 3;

            expect(() => mockBlock._exitWheel.navItems[0].navigateFunction()).not.toThrow();
        });

        test("does not notify Phrase Maker for a scaledegree2 block", () => {
            mockBlock.name = "scaledegree2";
            const refreshRowForBlock = jest.fn();
            mockBlock.activity.logo.phraseMaker = { refreshRowForBlock };

            piemenuPitches(mockBlock, noteLabels, noteValues, ["♯", "♭"], "C", "");

            mockBlock._pitchWheel.selectedNavItemIndex = 4;
            mockBlock._accidentalsWheel.selectedNavItemIndex = 2;
            mockBlock._octavesWheel.selectedNavItemIndex = 3;

            mockBlock._exitWheel.navItems[0].navigateFunction();

            expect(refreshRowForBlock).not.toHaveBeenCalled();
        });
    });

    test("outside click closure registers mousedown listener and handles outside clicks", () => {
        jest.useFakeTimers();

        let mousedownHandler = null;
        global.document.addEventListener = jest.fn().mockImplementation((event, handler) => {
            if (event === "mousedown") {
                mousedownHandler = handler;
            }
        });

        // Set mock return for docById("wheelDiv") so that showWheelDiv/hideWheelDiv work
        const mockWheelDiv = {
            style: { display: "" },
            contains: jest.fn().mockReturnValue(false)
        };
        global.docById.mockImplementation(id => {
            if (id === "wheelDiv") {
                return mockWheelDiv;
            }
            return {
                style: { display: "" },
                contains: jest.fn().mockReturnValue(false)
            };
        });

        const noteLabels = ["C", "D", "E", "F", "G", "A", "B"];
        const noteValues = ["C", "D", "E", "F", "G", "A", "B"];
        piemenuPitches(mockBlock, noteLabels, noteValues, ["♯", "♭"], "C", "");

        // Advance timers by 50ms to trigger the event listener registration
        jest.advanceTimersByTime(50);

        expect(global.document.addEventListener).toHaveBeenCalledWith(
            "mousedown",
            expect.any(Function)
        );
        expect(mousedownHandler).toBeInstanceOf(Function);

        // Mock exit wheel navigateFunction
        const mockNavigate = jest.fn();
        mockBlock._exitWheel.navItems[0].navigateFunction = mockNavigate;

        // Trigger outside click (interactive elements return false)
        const mockEvent = { target: { style: { cursor: "default" } } };
        mousedownHandler(mockEvent);

        expect(mockNavigate).toHaveBeenCalled();

        jest.useRealTimers();
    });

    describe("piemenuIntervals tests", () => {
        let mockBlock;

        beforeEach(() => {
            mockBlock = {
                blocks: {
                    stageClick: false,
                    blockScale: 1,
                    turtles: { _canvas: { width: 800, height: 600 } }
                },
                container: { x: 10, y: 10, setChildIndex: jest.fn(), children: [] },
                activity: {
                    canvas: { offsetLeft: 0, offsetTop: 0 },
                    blocksContainer: { x: 0, y: 0 },
                    getStageScale: () => 1,
                    turtles: { ithTurtle: () => ({ singer: { instrumentNames: ["sine"] } }) },
                    logo: {
                        synth: {
                            createDefaultSynth: jest.fn(),
                            loadSynth: jest.fn(),
                            setMasterVolume: jest.fn(),
                            trigger: jest.fn()
                        }
                    }
                },
                text: { text: "" },
                updateCache: jest.fn()
            };
        });

        test("shows valid tabs and hides inactive tabs based on activeTabs for perfect interval", () => {
            piemenuIntervals(mockBlock, "perfect 4");

            // Reset mock counts from initialization
            for (let k = 0; k < 8; k++) {
                mockBlock._intervalWheel.navItems[k].navItem.show.mockClear();
                mockBlock._intervalWheel.navItems[k].navItem.hide.mockClear();
            }

            // Manually trigger the navigateFunction on the first interval (perfect)
            mockBlock._intervalNameWheel.navItems[0].navigateFunction();

            // The perfect interval has active tabs [1, 4, 5, 8]
            // We expect tabs 1, 4, 5, 8 (indices 0, 3, 4, 7) to be shown and tabs 2, 3, 6, 7 (indices 1, 2, 5, 6) to be hidden.
            expect(mockBlock._intervalWheel.navItems[0].navItem.show).toHaveBeenCalled(); // tab 1
            expect(mockBlock._intervalWheel.navItems[1].navItem.hide).toHaveBeenCalled(); // tab 2
            expect(mockBlock._intervalWheel.navItems[2].navItem.hide).toHaveBeenCalled(); // tab 3
            expect(mockBlock._intervalWheel.navItems[3].navItem.show).toHaveBeenCalled(); // tab 4
            expect(mockBlock._intervalWheel.navItems[4].navItem.show).toHaveBeenCalled(); // tab 5
            expect(mockBlock._intervalWheel.navItems[5].navItem.hide).toHaveBeenCalled(); // tab 6
            expect(mockBlock._intervalWheel.navItems[6].navItem.hide).toHaveBeenCalled(); // tab 7
            expect(mockBlock._intervalWheel.navItems[7].navItem.show).toHaveBeenCalled(); // tab 8
        });

        test("shows valid tabs and hides inactive tabs based on activeTabs for minor interval", () => {
            piemenuIntervals(mockBlock, "minor 3");

            // Reset mock counts from initialization
            for (let k = 8; k < 16; k++) {
                mockBlock._intervalWheel.navItems[k].navItem.show.mockClear();
                mockBlock._intervalWheel.navItems[k].navItem.hide.mockClear();
            }

            // Manually trigger the navigateFunction on the second interval (minor)
            // Assuming "minor" is at index 1 based on INTERVALS setup
            mockBlock._intervalNameWheel.navItems[1].navigateFunction();

            // The minor interval (index 1) has active tabs [2, 3, 6, 7]
            // We expect tabs 2, 3, 6, 7 (indices 9, 10, 13, 14) to be shown and tabs 1, 4, 5, 8 (indices 8, 11, 12, 15) to be hidden.
            expect(mockBlock._intervalWheel.navItems[8].navItem.hide).toHaveBeenCalled(); // tab 1
            expect(mockBlock._intervalWheel.navItems[9].navItem.show).toHaveBeenCalled(); // tab 2
            expect(mockBlock._intervalWheel.navItems[10].navItem.show).toHaveBeenCalled(); // tab 3
            expect(mockBlock._intervalWheel.navItems[11].navItem.hide).toHaveBeenCalled(); // tab 4
            expect(mockBlock._intervalWheel.navItems[12].navItem.hide).toHaveBeenCalled(); // tab 5
            expect(mockBlock._intervalWheel.navItems[13].navItem.show).toHaveBeenCalled(); // tab 6
            expect(mockBlock._intervalWheel.navItems[14].navItem.show).toHaveBeenCalled(); // tab 7
            expect(mockBlock._intervalWheel.navItems[15].navItem.hide).toHaveBeenCalled(); // tab 8
        });

        test("selection change with invalid interval value does not throw", () => {
            piemenuIntervals(mockBlock, "perfect 4");

            // Simulate selecting an invalid interval like "perfect 2"
            mockBlock._intervalNameWheel.selectedNavItemIndex = 0; // "perfect"
            mockBlock._intervalWheel.selectedNavItemIndex = 1; // "2"
            mockBlock._intervalWheel.navItems[1].title = "2";

            // Trigger navigateFunction for index 1
            expect(() => {
                mockBlock._intervalWheel.navItems[1].navigateFunction();
            }).not.toThrow();
        });
    });

    test("outside click ignores interactive targets (labelDiv, movable, slices)", () => {
        jest.useFakeTimers();

        let mousedownHandler = null;
        global.document.addEventListener = jest.fn().mockImplementation((event, handler) => {
            if (event === "mousedown") {
                mousedownHandler = handler;
            }
        });

        const mockLabelDiv = { contains: jest.fn(t => t.id === "input-label") };
        const mockMovable = { contains: jest.fn(t => t.id === "movable-btn") };
        const mockChooseKeyDiv = {
            style: { display: "block" },
            contains: jest.fn(t => t.id === "wheel-slice")
        };
        const mockWheelDiv = {
            style: { display: "none" },
            contains: jest.fn().mockReturnValue(false)
        };

        global.docById.mockImplementation(id => {
            if (id === "labelDiv") return mockLabelDiv;
            if (id === "movable") return mockMovable;
            if (id === "chooseKeyDiv") return mockChooseKeyDiv;
            if (id === "wheelDiv") return mockWheelDiv;
            return { style: { display: "none" }, contains: jest.fn().mockReturnValue(false) };
        });

        const mockExit = {
            navItems: [
                {
                    navigateFunction: jest.fn(),
                    selected: false,
                    hovered: false,
                    enabled: true
                },
                { enabled: false }
            ],
            selectedNavItemIndex: 0,
            refreshWheel: jest.fn(),
            raphael: { canvas: true }
        };

        window.configureExitWheel(mockExit);
        jest.advanceTimersByTime(50);

        expect(mousedownHandler).toBeInstanceOf(Function);

        // Click inside labelDiv -> should not trigger exit
        mousedownHandler({ target: { id: "input-label", tagName: "DIV" } });
        expect(mockExit.navItems[0].navigateFunction).not.toHaveBeenCalled();

        // Click inside movable -> should not trigger exit
        mousedownHandler({ target: { id: "movable-btn", tagName: "INPUT" } });
        expect(mockExit.navItems[0].navigateFunction).not.toHaveBeenCalled();

        // Click inside slice element -> should not trigger exit
        mousedownHandler({ target: { id: "wheel-slice", tagName: "path" } });
        expect(mockExit.navItems[0].navigateFunction).not.toHaveBeenCalled();

        // Click outside on background -> should trigger exit
        mousedownHandler({ target: { id: "stage-bg", tagName: "CANVAS" } });
        expect(mockExit.navItems[0].navigateFunction).toHaveBeenCalledTimes(1);

        jest.useRealTimers();
    });

    test("fallback outside click hides all visible containers when activeExitWheel is not provided", () => {
        jest.useFakeTimers();

        let mousedownHandler = null;
        global.document.addEventListener = jest.fn().mockImplementation((event, handler) => {
            if (event === "mousedown") {
                mousedownHandler = handler;
            }
        });
        global.document.removeEventListener = jest.fn();

        const mockWheelDiv = {
            style: { display: "" },
            contains: jest.fn().mockReturnValue(false)
        };
        const mockChooseKeyDiv = {
            style: { display: "block" },
            contains: jest.fn().mockReturnValue(false)
        };
        const mockMovable = {
            style: { display: "block" },
            contains: jest.fn().mockReturnValue(false)
        };

        global.docById.mockImplementation(id => {
            if (id === "wheelDiv") return mockWheelDiv;
            if (id === "chooseKeyDiv") return mockChooseKeyDiv;
            if (id === "movable") return mockMovable;
            return { style: { display: "none" }, contains: jest.fn().mockReturnValue(false) };
        });

        // Trigger showWheelDiv to register handler
        const noteLabels = ["C", "D", "E", "F", "G", "A", "B"];
        const noteValues = ["C", "D", "E", "F", "G", "A", "B"];
        piemenuPitches(mockBlock, noteLabels, noteValues, ["♯", "♭"], "C", "");
        jest.advanceTimersByTime(50);

        // Remove activeExitWheel navigateFunction to test fallback branch
        mockBlock._exitWheel.navItems[0].navigateFunction = null;

        mousedownHandler({ target: { id: "bg", tagName: "BODY" } });

        expect(mockWheelDiv.style.display).toBe("none");
        expect(mockChooseKeyDiv.style.display).toBe("none");
        expect(mockMovable.style.display).toBe("none");
        expect(global.document.removeEventListener).toHaveBeenCalledWith(
            "mousedown",
            mousedownHandler
        );

        jest.useRealTimers();
    });

    describe("piemenuModes behavioral tests", () => {
        beforeEach(() => {
            global.isNonEDO = jest.fn().mockReturnValue(false);
            global.getNonEDOModeSteps = jest.fn().mockReturnValue(null);
        });

        test("onSelect is not called during initial navigation", () => {
            const onSelect = jest.fn();
            piemenuModes(mockBlock, "ionian", onSelect);

            // The initial navigateWheel to pre-select "ionian" must NOT
            // trigger onSelect — otherwise the pie menu opens and closes
            // in the same frame.
            expect(onSelect).not.toHaveBeenCalled();
        });

        test("onSelect fires when user clicks a mode slice", () => {
            const onSelect = jest.fn();
            piemenuModes(mockBlock, "ionian", onSelect);

            // Simulate user clicking dorian (index 2).
            mockBlock._modeNameWheel.selectedNavItemIndex = 2;
            mockBlock._modeNameWheel.navItems[2].navigateFunction();

            expect(onSelect).toHaveBeenCalledTimes(1);
            expect(onSelect).toHaveBeenCalledWith("dorian", "dorian");
        });

        test("onSelect is not called when switching mode groups", () => {
            const onSelect = jest.fn();
            piemenuModes(mockBlock, "ionian", onSelect);

            // Simulate user clicking a mode group (inner circle).
            mockBlock._modeGroupWheel.selectedNavItemIndex = 1;
            mockBlock._modeGroupWheel.navItems[1].navigateFunction();

            // Group switch must NOT fire onSelect — only mode name clicks should.
            expect(onSelect).not.toHaveBeenCalled();
        });

        test("selecting a mode slice assigns the internal mode name to the block", () => {
            piemenuModes(mockBlock, "ionian");

            // Navigate to the dorian slice (index 2) explicitly.
            mockBlock._modeNameWheel.selectedNavItemIndex = 2;
            mockBlock._modeNameWheel.navItems[2].navigateFunction();

            expect(mockBlock.value).toBe("dorian");
            expect(mockBlock.text.text).toBe("dorian");
        });

        test("selecting a group in the inner ring repaints the outer mode-name ring", () => {
            // global is mocked in this file; use the real implementation here.
            const realUpdate = require("../utils/piemenu.js").updateWheelItems;
            const prevUpdate = global.updateWheelItems;
            global.updateWheelItems = realUpdate;

            const savedModes = global.MODE_PIE_MENUS;
            const blank12 = Array(12).fill(" ");
            global.MODE_PIE_MENUS = {
                5: ["minor pentatonic", ...blank12.slice(1)],
                7: ["ionian", " ", "dorian", " ", " ", " ", " ", " ", " ", "aeolian", " ", " "],
                12: [
                    "ionian",
                    "dorian",
                    "phrygian",
                    "lydian",
                    "mixolydian",
                    "minor",
                    "locrian",
                    " ",
                    " ",
                    " ",
                    " ",
                    " "
                ],
                custom: blank12.slice()
            };

            piemenuModes(mockBlock, "major");

            const groupWheel = mockBlock._modeGroupWheel;
            const nameWheel = mockBlock._modeNameWheel;
            expect(nameWheel).toBeDefined();

            const idx = groupWheel.navItems.findIndex(n => n.title === "12");
            expect(idx).toBeGreaterThanOrEqual(0);
            groupWheel.selectedNavItemIndex = idx;
            groupWheel.navItems[idx].navigateFunction();

            // Raphael text must follow the new group, not freeze on the old one.
            const expected = global.MODE_PIE_MENUS["12"].map(getModeLabel);
            for (let i = 0; i < nameWheel.navItems.length; i++) {
                expect(nameWheel.navItems[i].navTitle.attr).toHaveBeenCalledWith({
                    text: expected[i]
                });
            }

            global.updateWheelItems = prevUpdate;
            global.MODE_PIE_MENUS = savedModes;
        });
    });
});

describe("piemenuNumber wheel configuration", () => {
    let mockBlock;

    beforeEach(() => {
        global.platformColor.numberWheelcolors = ["#555555"];
        global.platformColor.exitWheelcolors2 = ["#666666"];
        global.docById = jest.fn().mockImplementation(id => {
            if (id === "labelDiv") {
                return {
                    replaceChildren: jest.fn(),
                    classList: { add: jest.fn(), remove: jest.fn() }
                };
            }
            return {
                style: {},
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                focus: jest.fn(),
                getBoundingClientRect: jest.fn().mockReturnValue({ x: 0, y: 0 })
            };
        });
        global.document.getElementById = global.docById;
        global.document.createElement = jest.fn().mockReturnValue({ style: {} });

        mockBlock = {
            container: { x: 100, y: 100, setChildIndex: jest.fn(), children: [] },
            blocks: {
                stageClick: false,
                blockScale: 1,
                turtles: { _canvas: { width: 1000, height: 1000 } },
                blockList: { "mock-id": { name: "mock-block" } }
            },
            activity: {
                canvas: { offsetLeft: 0, offsetTop: 0 },
                blocksContainer: { x: 0, y: 0 },
                getStageScale: jest.fn().mockReturnValue(1)
            },
            connections: ["mock-id"],
            protoblock: { scale: 1 },
            updateCache: jest.fn(),
            text: { text: "" },
            value: 5,
            _exitKeyPressed: jest.fn(),
            _usePieNumberC1: jest.fn().mockReturnValue(false)
        };
        jest.clearAllMocks();
    });

    test("configures the radius tier for a short value list and leaves navAngle untouched", () => {
        mockBlock.blocks.blockList["mock-id"].name = "mock-block";
        piemenuNumber(mockBlock, [1, 2, 3], 2);

        expect(global.configureWheel).toHaveBeenCalledWith(
            mockBlock._numberWheel,
            expect.objectContaining({ minRadius: 0.2, maxRadius: 0.6, selectionPaths: true })
        );
        expect(mockBlock._numberWheel.navAngle).toBeUndefined();
        expect(mockBlock._numberWheel.titleRotateAngle).toBeUndefined();
    });

    test("configures the radius tier for a long value list (>16)", () => {
        mockBlock.blocks.blockList["mock-id"].name = "mock-block";
        const values = Array.from({ length: 20 }, (_, i) => i);
        piemenuNumber(mockBlock, values, 5);

        expect(global.configureWheel).toHaveBeenCalledWith(
            mockBlock._numberWheel,
            expect.objectContaining({ minRadius: 0.6, maxRadius: 1.0 })
        );
    });

    test("configures the radius tier for a medium value list (>10)", () => {
        mockBlock.blocks.blockList["mock-id"].name = "mock-block";
        const values = Array.from({ length: 12 }, (_, i) => i);
        piemenuNumber(mockBlock, values, 5);

        expect(global.configureWheel).toHaveBeenCalledWith(
            mockBlock._numberWheel,
            expect.objectContaining({ minRadius: 0.5, maxRadius: 0.9 })
        );
    });

    test.each([
        [10, 0.2, 0.6], // exactly 10: not > 10, falls into the short tier
        [11, 0.5, 0.9], // exactly 11: > 10, not > 16, medium tier
        [16, 0.5, 0.9], // exactly 16: not > 16, stays in the medium tier
        [17, 0.6, 1.0] // exactly 17: > 16, long tier
    ])(
        "configures the radius tier at the exact boundary of %i values (min=%f, max=%f)",
        (length, minRadius, maxRadius) => {
            mockBlock.blocks.blockList["mock-id"].name = "mock-block";
            const values = Array.from({ length }, (_, i) => i);
            piemenuNumber(mockBlock, values, 5);

            expect(global.configureWheel).toHaveBeenCalledWith(
                mockBlock._numberWheel,
                expect.objectContaining({ minRadius, maxRadius })
            );
        }
    );

    test("sets navAngle to -90 for a setheading block", () => {
        mockBlock.blocks.blockList["mock-id"].name = "setheading";
        piemenuNumber(mockBlock, [0, 90, 180, 270], 90);

        expect(mockBlock._numberWheel.navAngle).toBe(-90);
        expect(mockBlock._numberWheel.titleRotateAngle).toBeUndefined();
    });

    test("sets titleRotateAngle to 0 for a setbpm3 block and leaves navAngle untouched", () => {
        mockBlock.blocks.blockList["mock-id"].name = "setbpm3";
        piemenuNumber(mockBlock, [40, 60, 90, 120], 90);

        expect(mockBlock._numberWheel.titleRotateAngle).toBe(0);
        expect(mockBlock._numberWheel.navAngle).toBeUndefined();
    });
});

describe("piemenuKey behavioral tests", () => {
    let mockActivity;

    beforeEach(() => {
        mockActivity = {
            blocks: {
                blockList: { length: 2 },
                findStacks: jest.fn(),
                stackList: [],
                _makeNewBlockWithConnections: jest.fn(),
                adjustExpandableClampBlock: jest.fn(),
                updateBlockText: jest.fn()
            },
            logo: {
                blocks: {
                    blockList: { length: 2 }
                },
                synth: new global.Synth()
            },
            KeySignatureEnv: ["C", "major", false],
            storage: {},
            textMsg: jest.fn(),
            refreshCanvas: jest.fn(),
            turtles: { ithTurtle: jest.fn().mockReturnValue({ singer: { instrumentNames: [] } }) }
        };
        global.event = { clientX: 100, clientY: 100 };
        jest.clearAllMocks();
    });

    test("generates setkey blocks correctly when exiting and no setkey exists", () => {
        // Prepare blockList to trigger the for...of loops
        mockActivity.blocks.blockList = {
            0: { name: "start", connections: [null, 1] },
            1: { name: "action", connections: [0] },
            length: 2
        };
        // The start block is at index 0
        mockActivity.blocks.stackList = [0];

        piemenuKey(mockActivity);

        // Find the exitWheel instance created in piemenuKey
        const exitWheel = global.wheelnav.mock.instances.find(w => w.id === "exitWheel");
        expect(exitWheel).toBeDefined();

        // Trigger __exitMenu which calls __generateSetKeyBlocks
        exitWheel.navItems[0].navigateFunction();

        // Verify that blocks were created
        expect(mockActivity.blocks._makeNewBlockWithConnections).toHaveBeenCalled();
    });

    test("mode ring is built from MODE_PIE_MENUS, not just the 7 church modes", () => {
        piemenuKey(mockActivity);

        const modenameWheel = global.wheelnav.mock.instances.find(w => w.id === "modenameWheel");
        expect(modenameWheel).toBeDefined();

        const titles = modenameWheel.navItems.map(item => item.title);
        // Must expose all MODE_PIE_MENUS scales (e.g. pentatonic), not just church modes.
        expect(titles).toContain("minor pentatonic");
        expect(titles).toContain("dorian");
        expect(titles).not.toContain("phrygian");
        expect(titles.length).toBe(4);
    });

    test("updates an existing setkey block in place instead of creating a new one", () => {
        mockActivity.storage.KeySignatureEnv = "G,dorian,false";
        mockActivity.blocks.blockList = {
            0: { name: "setkey2", connections: [null, 1, 2], trash: false },
            1: { name: "notename", value: "C" },
            2: { name: "modename", value: "major" },
            length: 3
        };

        piemenuKey(mockActivity);

        const exitWheel = global.wheelnav.mock.instances.find(w => w.id === "exitWheel");
        expect(exitWheel).toBeDefined();

        // __exitMenu → __generateSetKeyBlocks (must take the update branch).
        exitWheel.navItems[0].navigateFunction();

        // Existing block's key/mode children are updated…
        expect(mockActivity.blocks.blockList[1].value).toBe("G");
        expect(mockActivity.blocks.blockList[2].value).toBe("dorian");
        // …and no new block is created.
        expect(mockActivity.blocks._makeNewBlockWithConnections).not.toHaveBeenCalled();
    });
});

describe("pie menu Escape-key dismissal", () => {
    let elements;

    const makeEl = () => ({
        style: { display: "", position: "", opacity: "" },
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        getBoundingClientRect: jest.fn().mockReturnValue({ x: 0, y: 0 })
    });

    beforeEach(() => {
        elements = {};
        global.docById = jest.fn(id => {
            if (!elements[id]) elements[id] = makeEl();
            return elements[id];
        });
        global.document = {
            getElementById: global.docById,
            addEventListener: jest.fn(),
            removeEventListener: jest.fn()
        };
        // Earlier suites may leave a module-level activeExitWheel behind;
        // dismiss once so each test starts from the no-exit-wheel state.
        require("../piemenus").dismissActivePieMenu();
        elements = {};
        global.document.removeEventListener.mockClear();
    });

    test("Escape hides every visible pie-menu container and detaches listeners", () => {
        const { handleEscapeKey } = require("../piemenus");
        const event = { key: "Escape", preventDefault: jest.fn(), stopPropagation: jest.fn() };

        handleEscapeKey(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(elements["wheelDiv"].style.display).toBe("none");
        expect(elements["wheelDivptm"].style.display).toBe("none");
        expect(global.document.removeEventListener).toHaveBeenCalledWith(
            "keydown",
            handleEscapeKey,
            true
        );
    });

    test("other keys leave the menu open", () => {
        const { handleEscapeKey } = require("../piemenus");
        const event = { key: "a", preventDefault: jest.fn(), stopPropagation: jest.fn() };

        handleEscapeKey(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(elements["wheelDiv"] ? elements["wheelDiv"].style.display : "").not.toBe("none");
    });

    test("Escape does nothing when no pie menu is open", () => {
        const { handleEscapeKey } = require("../piemenus");
        global.docById = jest.fn(id => {
            if (!elements[id]) {
                elements[id] = makeEl();
                elements[id].style.display = "none";
            }
            return elements[id];
        });
        global.document.getElementById = global.docById;
        const event = { key: "Escape", preventDefault: jest.fn(), stopPropagation: jest.fn() };

        handleEscapeKey(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
    });

    test("showWheelDiv registers the Escape listener alongside outside-click", () => {
        jest.useFakeTimers();
        const { showWheelDiv, handleEscapeKey } = require("../piemenus");

        try {
            showWheelDiv();
            jest.advanceTimersByTime(50);

            expect(global.document.addEventListener).toHaveBeenCalledWith(
                "keydown",
                handleEscapeKey,
                true
            );
        } finally {
            jest.useRealTimers();
        }
    });
});

describe("piemenuVoices teardown on close", () => {
    let mockBlock;
    let synth;

    const openVoiceMenu = () => {
        const { piemenuVoices } = require("../piemenus");
        piemenuVoices(
            mockBlock,
            ["guitar", "piano"],
            ["guitar", "piano"],
            [0, 0],
            "guitar",
            undefined
        );
    };

    beforeEach(() => {
        // Real DOM nodes here: enableWheelScroll() reaches for wheelDiv through
        // document.getElementById, so a docById stub alone would not be seen.
        document.body.innerHTML = "";
        const byId = document.getElementById.bind(document);
        global.docById = jest.fn(id => {
            let el = byId(id);
            if (!el) {
                el = document.createElement("div");
                el.id = id;
                document.body.appendChild(el);
            }
            return el;
        });

        global.localStorage = {};
        global.platformColor.piemenuVoicesColors = ["#aa0000", "#00aa00"];
        global.getDrumName = jest.fn().mockReturnValue(null);
        global.getVoiceSynthName = jest.fn(v => v);
        global.getDrumSynthName = jest.fn(v => v);

        synth = {
            createDefaultSynth: jest.fn(),
            loadSynth: jest.fn(),
            trigger: jest.fn(),
            start: jest.fn()
        };

        mockBlock = {
            container: { x: 100, y: 100, setChildIndex: jest.fn(), children: [] },
            blocks: {
                stageClick: false,
                blockScale: 1,
                activeBlock: null,
                turtles: { _canvas: { width: 1000, height: 1000 } }
            },
            activity: {
                canvas: { offsetLeft: 0, offsetTop: 0 },
                blocksContainer: { x: 0, y: 0 },
                getStageScale: jest.fn().mockReturnValue(1),
                turtles: {
                    ithTurtle: jest.fn().mockReturnValue({ singer: { instrumentNames: [] } })
                },
                logo: { synth, errorMsg: jest.fn() }
            },
            updateCache: jest.fn(),
            text: { text: "" },
            value: "guitar"
        };
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    test("the exit button removes both wheels and clears the active block", () => {
        openVoiceMenu();
        mockBlock.blocks.activeBlock = mockBlock;

        mockBlock._exitWheel.navItems[0].navigateFunction();

        // wheelnav only detaches its window keydown listener from removeWheel(),
        // so a menu closed without this keeps answering the arrow keys.
        expect(mockBlock._voiceWheel.removeWheel).toHaveBeenCalled();
        expect(mockBlock._exitWheel.removeWheel).toHaveBeenCalled();
        expect(mockBlock.blocks.activeBlock).toBeNull();
    });

    test("closing cancels a voice preview that is still waiting on the synth", () => {
        jest.useFakeTimers();

        try {
            openVoiceMenu();

            // An instrument the turtle has not loaded defers its preview by 500ms.
            mockBlock._voiceWheel.selectedNavItemIndex = 1;
            mockBlock._voiceWheel.navItems[1].navigateFunction();

            mockBlock._exitWheel.navItems[0].navigateFunction();
            jest.advanceTimersByTime(1000);

            expect(synth.trigger).not.toHaveBeenCalled();
        } finally {
            jest.useRealTimers();
        }
    });

    test("the preview still plays while the menu is open", () => {
        jest.useFakeTimers();

        try {
            openVoiceMenu();

            mockBlock._voiceWheel.selectedNavItemIndex = 1;
            mockBlock._voiceWheel.navItems[1].navigateFunction();
            jest.advanceTimersByTime(1000);

            expect(synth.trigger).toHaveBeenCalled();
        } finally {
            jest.useRealTimers();
        }
    });

    test("hiding the wheel div detaches the scroll-to-rotate listener", () => {
        const { hideWheelDiv } = require("../piemenus");

        openVoiceMenu();

        const wheelDiv = document.getElementById("wheelDiv");
        const scrollHandler = wheelDiv._scrollHandler;
        expect(typeof scrollHandler).toBe("function");

        const removeEventListener = jest.spyOn(wheelDiv, "removeEventListener");
        hideWheelDiv();

        // Left attached, the handler holds the closed menu's wheel and block alive.
        expect(removeEventListener).toHaveBeenCalledWith("wheel", scrollHandler);
        expect(wheelDiv._scrollHandler).toBeNull();
    });
});

describe("piemenuBasic and temperament wheel readability and positioning", () => {
    const { piemenuBasic, getTemperamentSliceFont } = require("../piemenus");

    let mockBlock;
    let wheelDivMock;
    let toolbarsMock;
    let paletteMock;

    beforeEach(() => {
        wheelDivMock = {
            style: {
                display: "",
                opacity: "",
                position: "",
                left: "",
                top: "",
                width: "550px",
                height: "550px"
            },
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            getBoundingClientRect: jest
                .fn()
                .mockReturnValue({ x: 0, y: 0, width: 550, height: 550 })
        };
        toolbarsMock = {
            style: { display: "" },
            offsetHeight: 64,
            offsetTop: 0,
            getBoundingClientRect: jest.fn().mockReturnValue({ bottom: 64, top: 0, height: 64 })
        };
        paletteMock = {
            style: { display: "", transform: "" },
            offsetWidth: 160,
            offsetLeft: 0,
            getBoundingClientRect: jest.fn().mockReturnValue({ right: 160, left: 0, width: 160 })
        };

        global.docById = jest.fn().mockImplementation(id => {
            if (id === "wheelDiv") return wheelDivMock;
            if (id === "toolbars") return toolbarsMock;
            if (id === "palette") return paletteMock;
            return null;
        });
        global.document.getElementById = global.docById;

        mockBlock = {
            name: "temperamentname",
            value: "equal",
            text: { text: "Equal (12EDO)" },
            container: {
                x: 500,
                y: 500,
                setChildIndex: jest.fn(),
                children: []
            },
            blocks: {
                stageClick: false,
                blockScale: 1,
                turtles: {
                    _canvas: { width: 1000, height: 1000 }
                }
            },
            activity: {
                canvas: { offsetLeft: 0, offsetTop: 0 },
                blocksContainer: { x: 0, y: 0 },
                getStageScale: jest.fn().mockReturnValue(1),
                logo: { synth: new global.Synth() }
            },
            updateCache: jest.fn()
        };
    });

    test("getTemperamentSliceFont scales font proportionally for slice count and label length", () => {
        const wheelRadius = 600;
        const sliceCount = 11;

        const shortFont = getTemperamentSliceFont(wheelRadius, sliceCount, 6);
        const mediumFont = getTemperamentSliceFont(wheelRadius, sliceCount, 13);
        const longFont = getTemperamentSliceFont(wheelRadius, sliceCount, 25);

        const shortSize = parseInt(shortFont.match(/\d+/)[0], 10);
        const mediumSize = parseInt(mediumFont.match(/\d+/)[0], 10);
        const longSize = parseInt(longFont.match(/\d+/)[0], 10);

        expect(shortSize).toBe(60); // capped at maxSize
        expect(mediumSize).toBe(44); // dynamically scaled proportional to label length
        expect(longSize).toBe(37); // protected by minSize floor for readability
        expect(shortSize).toBeGreaterThan(mediumSize);
        expect(mediumSize).toBeGreaterThan(longSize);
    });

    test("piemenuBasic initializes wheels and sets proportional fonts on temperament items", () => {
        const labels = [
            "Equal (12EDO)",
            "Equal (5EDO)",
            "Equal (7EDO)",
            "Equal (17EDO)",
            "Equal (19EDO)",
            "Equal (31EDO)",
            "5-limit Just Intonation",
            "Pythagorean (3-limit JI)",
            "Meantone (1/3)",
            "Meantone (1/4)",
            "custom"
        ];
        const values = [
            "equal",
            "equal5",
            "equal7",
            "equal17",
            "equal19",
            "equal31",
            "just intonation",
            "Pythagorean",
            "1/3 comma meantone",
            "1/4 comma meantone",
            "custom"
        ];

        piemenuBasic(mockBlock, labels, values, "equal");

        expect(global.wheelnav).toHaveBeenCalled();
        expect(mockBlock._basicWheel).toBeDefined();
        expect(mockBlock._exitWheel).toBeDefined();
        expect(mockBlock._basicWheel.titleRotateAngle).toBe(0);

        // Check that navItem fonts were assigned
        for (let i = 0; i < mockBlock._basicWheel.navItems.length; i++) {
            expect(mockBlock._basicWheel.navItems[i].titleAttr.font).toMatch(
                /bold \d+px sans-serif/
            );
        }
    });

    test("piemenuBasic centers the wheel over block when in the middle of workspace", () => {
        const labels = ["Option A", "Option B"];
        const values = ["a", "b"];
        mockBlock.container.x = 500;
        mockBlock.container.y = 500;
        wheelDivMock.style.width = "500px";
        wheelDivMock.style.height = "500px";

        piemenuBasic(mockBlock, labels, values, "a");

        const left = parseInt(wheelDivMock.style.left, 10);
        const top = parseInt(wheelDivMock.style.top, 10);

        expect(left).toBeGreaterThan(200);
        expect(left).toBeLessThan(400);
        expect(top).toBeGreaterThan(200);
        expect(top).toBeLessThan(400);
    });

    test("piemenuBasic bounds the wheel inside canvas when block is near edges", () => {
        const labels = ["Option A", "Option B"];
        const values = ["a", "b"];

        // Near top-left edge
        mockBlock.container.x = 10;
        mockBlock.container.y = 10;
        piemenuBasic(mockBlock, labels, values, "a");
        expect(parseInt(wheelDivMock.style.left, 10)).toBeGreaterThanOrEqual(0);
        expect(parseInt(wheelDivMock.style.top, 10)).toBeGreaterThanOrEqual(0);

        // Near bottom-right edge
        mockBlock.container.x = 980;
        mockBlock.container.y = 980;
        piemenuBasic(mockBlock, labels, values, "a");
        const left = parseInt(wheelDivMock.style.left, 10);
        const top = parseInt(wheelDivMock.style.top, 10);
        const actualSize = parseInt(wheelDivMock.style.width, 10);
        expect(left + actualSize).toBeLessThanOrEqual(1000);
        expect(top + actualSize).toBeLessThanOrEqual(1000);
    });

    test("piemenuBasic respects DOM toolbar and palette bounds to never overlap bars", () => {
        const labels = ["Option A", "Option B"];
        const values = ["a", "b"];

        toolbarsMock.getBoundingClientRect.mockReturnValue({ bottom: 70, top: 0, height: 70 });
        paletteMock.getBoundingClientRect.mockReturnValue({ right: 180, left: 0, width: 180 });

        mockBlock.container.x = 0;
        mockBlock.container.y = 0;
        piemenuBasic(mockBlock, labels, values, "a");

        const left = parseInt(wheelDivMock.style.left, 10);
        const top = parseInt(wheelDivMock.style.top, 10);

        expect(top).toBeGreaterThanOrEqual(78); // 70px toolbar + 8px margin
        expect(left).toBeGreaterThanOrEqual(188); // 180px palette + 8px margin
    });

    test("piemenuBasic scales down to fit available space on small viewports", () => {
        const labels = ["Option A", "Option B"];
        const values = ["a", "b"];

        mockBlock.blocks.turtles._canvas = { width: 340, height: 340 };
        toolbarsMock.getBoundingClientRect.mockReturnValue({ bottom: 64, top: 0, height: 64 });
        paletteMock.style.display = "none";

        mockBlock.container.x = 50;
        mockBlock.container.y = 50;
        piemenuBasic(mockBlock, labels, values, "a");

        const top = parseInt(wheelDivMock.style.top, 10);
        const actualSize = parseInt(wheelDivMock.style.width, 10);

        expect(top).toBeGreaterThanOrEqual(72); // 64 + 8
        expect(top + actualSize).toBeLessThanOrEqual(340);
    });

    test("piemenuBasic updates block value and exits when a selection is navigated", () => {
        const labels = ["Option A", "Option B"];
        const values = ["valA", "valB"];

        piemenuBasic(mockBlock, labels, values, "valA");

        mockBlock._basicWheel.selectedNavItemIndex = 1;
        mockBlock._basicWheel.navItems[1].navigateFunction();

        expect(mockBlock.value).toBe("valB");
        expect(mockBlock.text.text).toBe("Option B");
        expect(mockBlock._basicWheel.removeWheel).toHaveBeenCalled();
    });
});

describe("pie-menu exit key listener reference regression coverage", () => {
    let mockBlock;
    let labelDivMock;
    let numberLabelMock;
    let originalDocById;
    let originalCreateElement;

    beforeEach(() => {
        labelDivMock = {
            style: { display: "", opacity: "" },
            classList: {
                _classes: new Set(),
                add: jest.fn(function (c) {
                    this._classes.add(c);
                }),
                remove: jest.fn(function (c) {
                    this._classes.delete(c);
                }),
                contains: jest.fn(function (c) {
                    return this._classes.has(c);
                })
            },
            replaceChildren: jest.fn(),
            getBoundingClientRect: jest.fn().mockReturnValue({ x: 0, y: 0 })
        };

        numberLabelMock = {
            id: "numberLabel",
            style: { display: "", opacity: "", left: "", top: "", width: "", fontSize: "" },
            focus: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn()
        };

        originalDocById = global.docById;
        global.docById = jest.fn(id => {
            if (id === "labelDiv") {
                return labelDivMock;
            }
            if (id === "numberLabel") {
                return numberLabelMock;
            }
            return {
                style: {
                    display: "",
                    opacity: "",
                    position: "",
                    left: "",
                    top: "",
                    width: "",
                    height: ""
                },
                getBoundingClientRect: jest.fn().mockReturnValue({
                    x: 0,
                    y: 0,
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    width: 0,
                    height: 0
                }),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn()
            };
        });

        originalCreateElement = global.document.createElement;
        global.document.createElement = jest.fn(() => numberLabelMock);

        global.COLORS40 = Array(40).fill(["#000000", "#111111", "#222222"]);
        global.getMunsellColor = jest.fn().mockReturnValue("#123456");
        global.platformColor.numberWheelcolors = ["#333333"];
        global.platformColor.noteValueWheelcolors = ["#444444"];
        global.platformColor.subNoteValueWheelcolors = ["#555555"];
        global.platformColor.tabsWheelcolors = ["#666666"];

        mockBlock = {
            container: { x: 100, y: 100, setChildIndex: jest.fn(), children: [] },
            blocks: {
                stageClick: false,
                blockScale: 1,
                turtles: { _canvas: { width: 1000, height: 1000 } },
                findPitchOctave: jest.fn().mockReturnValue(4),
                setPitchOctave: jest.fn(),
                blockList: { "mock-id": { name: "mock-block", connections: [null] } },
                meter_block_changed: jest.fn()
            },
            activity: {
                canvas: { offsetLeft: 0, offsetTop: 0 },
                blocksContainer: { x: 0, y: 0 },
                getStageScale: jest.fn().mockReturnValue(1),
                KeySignatureEnv: ["C", "major", false],
                logo: { synth: new global.Synth(), errorMsg: jest.fn() }
            },
            connections: ["mock-id"],
            protoblock: { scale: 1 },
            updateCache: jest.fn(),
            text: { text: "" },
            value: "",
            name: "number",
            _check_meter_block: null,
            _usePieNumberC1: jest.fn().mockReturnValue(false),
            _labelChanged: jest.fn(),
            _exitKeyPressed: Block.prototype._exitKeyPressed
        };
        mockBlock._boundExitKeyPressed = mockBlock._exitKeyPressed.bind(mockBlock);
    });

    afterEach(() => {
        global.docById = originalDocById;
        global.document.createElement = originalCreateElement;
    });

    const testExitCleanup = (setupFn, triggerKey) => {
        setupFn();

        expect(labelDivMock.classList.contains("hasKeyboard")).toBe(true);

        const keypressCalls = numberLabelMock.addEventListener.mock.calls.filter(
            c => c[0] === "keypress"
        );
        expect(keypressCalls.length).toBe(1);
        const registeredHandler = keypressCalls[0][1];

        // Verify the registered handler is the stable bound handler
        expect(registeredHandler).toBe(mockBlock._boundExitKeyPressed);

        // Simulate exit key (Enter or Tab)
        const event = { key: triggerKey, preventDefault: jest.fn() };
        mockBlock._exitKeyPressed(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(mockBlock._labelChanged).toHaveBeenCalledWith(true, false);

        // Verify that removeEventListener was called with the exact same handler reference
        const removeCalls = numberLabelMock.removeEventListener.mock.calls.filter(
            c => c[0] === "keypress"
        );
        expect(removeCalls.length).toBe(1);
        const removedHandler = removeCalls[0][1];

        expect(removedHandler).toBe(registeredHandler);
        expect(removedHandler).toBe(mockBlock._boundExitKeyPressed);
        expect(labelDivMock.classList.contains("hasKeyboard")).toBe(false);
    };

    describe("piemenuNoteValue", () => {
        test("removes the exact registered handler reference on Enter", () => {
            testExitCleanup(() => piemenuNoteValue(mockBlock, 4), "Enter");
        });

        test("removes the exact registered handler reference on Tab", () => {
            testExitCleanup(() => piemenuNoteValue(mockBlock, 4), "Tab");
        });
    });

    describe("piemenuNumber", () => {
        test("removes the exact registered handler reference on Enter", () => {
            testExitCleanup(() => piemenuNumber(mockBlock, [1, 2, 4, 8], 4), "Enter");
        });

        test("removes the exact registered handler reference on Tab", () => {
            testExitCleanup(() => piemenuNumber(mockBlock, [1, 2, 4, 8], 4), "Tab");
        });
    });

    describe("piemenuColor", () => {
        test("removes the exact registered handler reference on Enter", () => {
            testExitCleanup(() => piemenuColor(mockBlock, [0, 10, 20, 30], 0, "setcolor"), "Enter");
        });

        test("removes the exact registered handler reference on Tab", () => {
            testExitCleanup(() => piemenuColor(mockBlock, [0, 10, 20, 30], 0, "setcolor"), "Tab");
        });
    });
});
