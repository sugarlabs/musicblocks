/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2026 Ashutosh Kumar
 *
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

/**
 * Tests for piemenus.js module
 *
 * The piemenus.js file uses global const declarations without CommonJS exports.
 * These tests verify the module structure and mock dependencies that would be
 * used by the pie menu functions in a browser environment.
 */

const fs = require("fs");
const path = require("path");

describe("Pie Menus Module", () => {
    const piemenusPath = path.join(__dirname, "..", "piemenus.js");
    let piemenusContent;

    beforeAll(() => {
        piemenusContent = fs.readFileSync(piemenusPath, "utf8");
    });

    describe("Module Structure", () => {
        it("should exist and be readable", () => {
            expect(piemenusContent).toBeDefined();
            expect(piemenusContent.length).toBeGreaterThan(0);
        });

        it("should define setWheelSize function", () => {
            expect(piemenusContent).toContain("const setWheelSize = ");
        });

        it("should define piemenuPitches function", () => {
            expect(piemenusContent).toContain("const piemenuPitches = ");
        });

        it("should define piemenuCustomNotes function", () => {
            expect(piemenusContent).toContain("const piemenuCustomNotes = ");
        });

        it("should define piemenuNthModalPitch function", () => {
            expect(piemenusContent).toContain("const piemenuNthModalPitch = ");
        });

        it("should define piemenuAccidentals function", () => {
            expect(piemenusContent).toContain("const piemenuAccidentals = ");
        });

        it("should define piemenuNoteValue function", () => {
            expect(piemenusContent).toContain("const piemenuNoteValue = ");
        });

        it("should define piemenuNumber function", () => {
            expect(piemenusContent).toContain("const piemenuNumber = ");
        });

        it("should define piemenuColor function", () => {
            expect(piemenusContent).toContain("const piemenuColor = ");
        });

        it("should define piemenuBasic function", () => {
            expect(piemenusContent).toContain("const piemenuBasic = ");
        });

        it("should define piemenuBoolean function", () => {
            expect(piemenusContent).toContain("const piemenuBoolean = ");
        });

        it("should define piemenuChords function", () => {
            expect(piemenusContent).toContain("const piemenuChords = ");
        });

        it("should define piemenuVoices function", () => {
            expect(piemenusContent).toContain("const piemenuVoices = ");
        });

        it("should define piemenuIntervals function", () => {
            expect(piemenusContent).toContain("const piemenuIntervals = ");
        });

        it("should define piemenuModes function", () => {
            expect(piemenusContent).toContain("const piemenuModes = ");
        });

        it("should define piemenuBlockContext function", () => {
            expect(piemenusContent).toContain("const piemenuBlockContext = ");
        });

        it("should define piemenuGrid function", () => {
            expect(piemenusContent).toContain("const piemenuGrid = ");
        });

        it("should define piemenuKey function", () => {
            expect(piemenusContent).toContain("const piemenuKey = ");
        });
    });

    describe("Exported Functions Declaration", () => {
        it("should declare all exported functions in the exported comment block", () => {
            const exportedFunctions = [
                "piemenuModes",
                "piemenuPitches",
                "piemenuCustomNotes",
                "piemenuGrid",
                "piemenuBlockContext",
                "piemenuIntervals",
                "piemenuVoices",
                "piemenuBoolean",
                "piemenuBasic",
                "piemenuColor",
                "piemenuNumber",
                "piemenuNthModalPitch",
                "piemenuNoteValue",
                "piemenuAccidentals",
                "piemenuKey",
                "piemenuChords"
            ];

            exportedFunctions.forEach(funcName => {
                expect(piemenusContent).toContain(funcName);
            });
        });
    });

    describe("Early Return Conditions", () => {
        it("should check stageClick in piemenuPitches", () => {
            expect(piemenusContent).toMatch(/piemenuPitches[\s\S]*?stageClick[\s\S]*?return;/);
        });

        it("should check stageClick in piemenuBoolean", () => {
            expect(piemenusContent).toMatch(/piemenuBoolean[\s\S]*?stageClick[\s\S]*?return;/);
        });

        it("should check stageClick in piemenuBasic", () => {
            expect(piemenusContent).toMatch(/piemenuBasic[\s\S]*?stageClick[\s\S]*?return;/);
        });

        it("should check stageClick in piemenuNumber", () => {
            expect(piemenusContent).toMatch(/piemenuNumber[\s\S]*?stageClick[\s\S]*?return;/);
        });

        it("should check stageClick in piemenuColor", () => {
            expect(piemenusContent).toMatch(/piemenuColor[\s\S]*?stageClick[\s\S]*?return;/);
        });

        it("should check stageClick in piemenuVoices", () => {
            expect(piemenusContent).toMatch(/piemenuVoices[\s\S]*?stageClick[\s\S]*?return;/);
        });

        it("should check stageClick in piemenuModes", () => {
            expect(piemenusContent).toMatch(/piemenuModes[\s\S]*?stageClick[\s\S]*?return;/);
        });

        it("should check stageClick in piemenuIntervals", () => {
            expect(piemenusContent).toMatch(/piemenuIntervals[\s\S]*?stageClick[\s\S]*?return;/);
        });

        it("should check stageClick in piemenuChords", () => {
            expect(piemenusContent).toMatch(/piemenuChords[\s\S]*?stageClick[\s\S]*?return;/);
        });
    });

    describe("Wheel Navigation Components", () => {
        it("should create pitch wheel", () => {
            expect(piemenusContent).toContain("_pitchWheel");
        });

        it("should create accidentals wheel", () => {
            expect(piemenusContent).toContain("_accidentalsWheel");
        });

        it("should create octaves wheel", () => {
            expect(piemenusContent).toContain("_octavesWheel");
        });

        it("should create exit wheel", () => {
            expect(piemenusContent).toContain("_exitWheel");
        });

        it("should use wheelnav for wheel creation", () => {
            expect(piemenusContent).toContain("new wheelnav");
        });

        it("should use slicePath for donut slices", () => {
            expect(piemenusContent).toContain("slicePath().DonutSlice");
        });
    });

    describe("Platform Color Integration", () => {
        it("should use platformColor for pitch wheel colors", () => {
            expect(piemenusContent).toContain("platformColor.pitchWheelcolors");
        });

        it("should use platformColor for exit wheel colors", () => {
            expect(piemenusContent).toContain("platformColor.exitWheelcolors");
        });

        it("should use platformColor for accidentals wheel colors", () => {
            expect(piemenusContent).toContain("platformColor.accidentalsWheelcolors");
        });

        it("should use platformColor for octaves wheel colors", () => {
            expect(piemenusContent).toContain("platformColor.octavesWheelcolors");
        });
    });

    describe("Audio Preview Functionality", () => {
        it("should have pitch preview function", () => {
            expect(piemenusContent).toContain("__pitchPreview");
        });

        it("should have voice preview function", () => {
            expect(piemenusContent).toContain("__voicePreview");
        });

        it("should setup audio context for previews", () => {
            expect(piemenusContent).toContain("setupAudioContext");
        });

        it("should use Tone.start for audio context", () => {
            expect(piemenusContent).toContain("Tone.start");
        });

        it("should use synth trigger for playing notes", () => {
            expect(piemenusContent).toContain(".trigger(");
        });
    });

    describe("Selection Change Handlers", () => {
        it("should have solfege selection handler", () => {
            expect(piemenusContent).toContain("__selectionChangedSolfege");
        });

        it("should have octave selection handler", () => {
            expect(piemenusContent).toContain("__selectionChangedOctave");
        });

        it("should have accidental selection handler", () => {
            expect(piemenusContent).toContain("__selectionChangedAccidental");
        });

        it("should have generic selection changed handler", () => {
            expect(piemenusContent).toContain("__selectionChanged");
        });
    });

    describe("Exit Menu Functionality", () => {
        it("should have exit menu handlers", () => {
            expect(piemenusContent).toContain("__exitMenu");
        });

        it("should track exit time", () => {
            expect(piemenusContent).toContain("_piemenuExitTime");
        });

        it("should remove wheels on exit", () => {
            expect(piemenusContent).toContain("removeWheel");
        });

        it("should hide wheelDiv on exit", () => {
            expect(piemenusContent).toContain('wheelDiv").style.display = "none"');
        });
    });

    describe("Wheel Positioning", () => {
        it("should position wheel based on block container", () => {
            expect(piemenusContent).toContain("blocksContainer.x");
        });

        it("should consider canvas offset", () => {
            expect(piemenusContent).toContain("canvas.offsetLeft");
        });

        it("should use stage scale for positioning", () => {
            expect(piemenusContent).toContain("getStageScale");
        });

        it("should set wheel div left position", () => {
            expect(piemenusContent).toMatch(/wheelDiv.*style\.left/);
        });

        it("should set wheel div top position", () => {
            expect(piemenusContent).toMatch(/wheelDiv.*style\.top/);
        });
    });

    describe("Tooltip Support", () => {
        it("should set tooltips for accidentals", () => {
            expect(piemenusContent).toContain("setTooltips");
        });

        it("should include tooltip for double sharp", () => {
            expect(piemenusContent).toContain('_("double sharp")');
        });

        it("should include tooltip for natural", () => {
            expect(piemenusContent).toContain('_("natural")');
        });
    });

    describe("Music Theory Integration", () => {
        it("should use buildScale for scale building", () => {
            expect(piemenusContent).toContain("buildScale");
        });

        it("should use getNote for note retrieval", () => {
            expect(piemenusContent).toContain("getNote(");
        });

        it("should handle key signature", () => {
            expect(piemenusContent).toContain("keySignature");
        });

        it("should handle movable solfege", () => {
            expect(piemenusContent).toContain("movable");
        });
    });

    describe("Block Context Menu", () => {
        it("should handle customsample blocks", () => {
            expect(piemenusContent).toContain('"customsample"');
        });

        it("should handle action blocks", () => {
            expect(piemenusContent).toContain('"action"');
        });

        it("should provide context options like copy/extract/delete", () => {
            expect(piemenusContent).toContain("copy-button.svg");
            expect(piemenusContent).toContain("extract-button.svg");
            expect(piemenusContent).toContain("empty-trash-button.svg");
        });
    });

    describe("Grid Menu", () => {
        it("should support Cartesian grid", () => {
            expect(piemenusContent).toContain("Cartesian");
        });

        it("should support Polar grid", () => {
            expect(piemenusContent).toContain("Polar");
        });

        it("should have grid image paths", () => {
            expect(piemenusContent).toContain("images/grid/");
        });
    });

    describe("Resize Handling", () => {
        it("should listen for window resize", () => {
            expect(piemenusContent).toContain('addEventListener("resize"');
        });

        it("should handle different screen widths", () => {
            expect(piemenusContent).toContain("screenWidth >= 1200");
            expect(piemenusContent).toContain("screenWidth >= 768");
        });
    });
});
