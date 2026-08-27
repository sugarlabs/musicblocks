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
    piemenuModes
} = require("../piemenus");

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
        initNavTitle: {}
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
global.MODEPIEMENU_GROUP_RING = { minRadius: 0.15, maxRadius: 0.3 };
global.MODEPIEMENU_NAME_RING = { minRadius: 0.3, maxRadius: 0.85 };
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
global.updateModeWheelItems = jest.fn();
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
global.isNonEDO = jest.fn().mockReturnValue(false);
global.getNonEDOModeSteps = jest.fn().mockReturnValue(null);
global.pitchToFrequency = jest.fn().mockReturnValue(440);
global.TEMPERAMENT = {
    equal: {
        pitchNumber: 12,
        noteLabels: ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    }
};

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
        test("selecting a mode slice assigns the internal mode name to the block", () => {
            piemenuModes(mockBlock, "ionian");

            // Initial highlight (index 0 = ionian) already fires the selection
            // handler; navigate to the dorian slice (index 2) explicitly.
            mockBlock._modeNameWheel.selectedNavItemIndex = 2;
            mockBlock._modeNameWheel.navItems[2].navigateFunction();

            expect(mockBlock.value).toBe("dorian");
            expect(mockBlock.text.text).toBe("dorian");
        });
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
                adjustExpandableClampBlock: jest.fn()
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
});
