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

const fs = require("fs");
const path = require("path");

const { piemenuPitches } = require("../piemenus");

const piemenusPath = path.join(__dirname, "..", "piemenus.js");
let piemenusContent;

// Mock Globals
global.docById = jest.fn().mockReturnValue({
    style: { display: "", opacity: "" },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    getBoundingClientRect: jest.fn().mockReturnValue({ x: 0, y: 0 })
});
global.document = {
    getElementById: global.docById
};
global.window = {
    innerWidth: 1024,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
};
global.wheelnav = jest.fn().mockImplementation(function (div) {
    const mockWheel = this;
    this.navItems = Array.from({ length: 20 }, () => ({
        title: "",
        enabled: true,
        navItem: { hide: jest.fn(), show: jest.fn() },
        sliceSelectedAttr: {},
        sliceHoverAttr: {},
        titleSelectedAttr: {},
        titleHoverAttr: {}
    }));
    this.selectedNavItemIndex = 0;
    this.colors = [];
    this.raphael = { canvas: {} };
    this.on = jest.fn();
    this.createWheel = jest.fn(labels => {
        if (labels) {
            labels.forEach((l, i) => {
                if (this.navItems[i]) this.navItems[i].title = l;
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
    accidentalsWheelcolorspush: "#cccccc"
};
global._ = jest.fn(s => s);
global.NOTENAMES = ["C", "D", "E", "F", "G", "A", "B"];
global.SOLFEGENAMES = ["do", "re", "mi", "fa", "sol", "la", "ti"];
global.FIXEDSOLFEGE = { do: "C", re: "D", mi: "E", fa: "F", sol: "G", la: "A", ti: "B" };
global.SHARP = "♯";
global.FLAT = "♭";
global.NATURAL = "♮";
global.DOUBLESHARP = "𝄪";
global.DOUBLEFLAT = "𝄫";
global.EQUIVALENTACCIDENTALS = { F: "E♯", C: "B♯", B: "C♭", E: "F♭", G: "F𝄪", D: "C𝄪", A: "G𝄪" };
global.Tone = {
    start: jest.fn().mockResolvedValue(),
    context: { state: "running" }
};
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

describe("piemenus behavioral tests", () => {
    let mockBlock;

    beforeAll(() => {
        piemenusContent = fs.readFileSync(piemenusPath, "utf8");
    });

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

    describe("Block Help Menu", () => {
        it("should load help before opening the aux pie menu help widget", () => {
            expect(piemenusContent).toMatch(
                /if \(typeof HelpWidget === "undefined"\)\s*\{\s*if \(typeof require !== "undefined"\)\s*\{\s*require\(\["widgets\/help"\], function \(\) \{\s*new HelpWidget\(that, true\);/
            );
        });
    });
});
