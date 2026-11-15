// Copyright (c) 2026 Music Blocks contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/**
 * Execution tests for the runtime API wrappers in js/js-export/export.js that
 * exported programs call while running: boxes, heap edge cases, the position
 * and camera getters, the STOPFLOW sentinel, and the runCommand error paths.
 * A regression in any of these breaks exported JavaScript projects at runtime.
 */

const { Mouse, MusicBlocks } = require("../export.js");

global.importMembers = jest.fn();
global.JSInterface = {
    validateArgs: jest.fn((method, args) => args)
};
global.Painter = {
    prototype: {
        method1: jest.fn(),
        method2: jest.fn()
    }
};

const JSEditor = {
    logConsole: jest.fn()
};
global.JSEditor = JSEditor;

const globalActivity = {
    turtles: {
        getTurtleCount: jest.fn(),
        getTurtle: jest.fn(),
        addTurtle: jest.fn(),
        getIndexOfTurtle: jest.fn(),
        removeTurtle: jest.fn(),
        screenX2turtleX: jest.fn(),
        screenY2turtleY: jest.fn()
    },
    logo: {
        prepSynths: jest.fn(),
        firstNoteTime: null,
        boxes: {},
        turtleHeaps: {},
        stage: {
            removeEventListener: jest.fn()
        }
    },
    textMsg: jest.fn(),
    stage: {
        dispatchEvent: jest.fn()
    }
};
global.globalActivity = globalActivity;
global.Singer = {
    resetMasterVolume: jest.fn(),
    RhythmActions: {
        getNoteValue: jest.fn()
    },
    MeterActions: {
        setPickup: jest.fn(),
        getWholeNotesPlayed: jest.fn(),
        getBeatCount: jest.fn(),
        getMeasureCount: jest.fn(),
        getBPM: jest.fn(),
        getBeatFactor: jest.fn(),
        getCurrentMeter: jest.fn()
    },
    PitchActions: {
        deltaPitch: jest.fn(),
        consonantStepSize: jest.fn()
    },
    IntervalsActions: {
        setMovableDo: jest.fn(),
        getCurrentKey: jest.fn(),
        getCurrentMode: jest.fn(),
        getModeLength: jest.fn()
    },
    VolumeActions: {
        setPanning: jest.fn(),
        setMasterVolume: jest.fn(),
        masterVolume: 1.0
    },
    ToneActions: {
        toneMethod: jest.fn()
    },
    OrnamentActions: {
        ornamentMethod: jest.fn()
    },
    DrumActions: {
        drumMethod: jest.fn()
    }
};
global.Turtle = {
    DictActions: {
        dictMethod: jest.fn()
    }
};

describe("MusicBlocks runtime API wrappers", () => {
    let musicBlocks;
    let mouse;

    beforeEach(() => {
        jest.clearAllMocks();
        globalActivity.logo.boxes = {};
        globalActivity.logo.turtleHeaps = {};
        globalActivity.turtles.getTurtleCount.mockReturnValue(1);
        globalActivity.turtles.getTurtle.mockReturnValue({
            id: 1,
            initTurtle: jest.fn(),
            doWait: jest.fn(),
            container: { x: 10, y: 20 }
        });
        globalActivity.turtles.getIndexOfTurtle.mockReturnValue(0);
        mouse = new Mouse(jest.fn());
        mouse.run = jest.fn();
        musicBlocks = new MusicBlocks(mouse);
    });

    describe("boxes", () => {
        test("getBox returns the stored value", () => {
            globalActivity.logo.boxes["score"] = 42;
            expect(musicBlocks.getBox("score")).toBe(42);
        });

        test("getBox on a missing box logs and returns 0", () => {
            expect(musicBlocks.getBox("missing")).toBe(0);
            expect(JSEditor.logConsole).toHaveBeenCalledWith('No box named "missing"', "maroon");
        });

        test("setBox stores the value", () => {
            musicBlocks.setBox("level", 3);
            expect(globalActivity.logo.boxes["level"]).toBe(3);
        });

        test("incrementBox adds to an existing box", () => {
            globalActivity.logo.boxes["score"] = 10;
            musicBlocks.incrementBox("score", 5);
            expect(globalActivity.logo.boxes["score"]).toBe(15);
        });

        test("incrementBox starts a missing box from 0", () => {
            musicBlocks.incrementBox("fresh", 2);
            expect(globalActivity.logo.boxes["fresh"]).toBe(2);
        });
    });

    describe("heap edge cases", () => {
        test("heap helpers create the heap store when it is missing entirely", () => {
            globalActivity.logo.turtleHeaps = undefined;
            expect(musicBlocks.HEAPLENGTH).toBe(0);
            expect(globalActivity.logo.turtleHeaps[musicBlocks.turIndex]).toEqual([]);
        });

        test("setHeapEntry ignores a missing index or value", () => {
            globalActivity.logo.turtleHeaps[musicBlocks.turIndex] = [1];
            musicBlocks.setHeapEntry(null, 9);
            musicBlocks.setHeapEntry(2, undefined);
            expect(globalActivity.logo.turtleHeaps[musicBlocks.turIndex]).toEqual([1]);
            expect(JSEditor.logConsole).toHaveBeenCalledWith(
                "Missing heap index or value.",
                "maroon"
            );
        });

        test("setHeapEntry rejects a non-number index", () => {
            globalActivity.logo.turtleHeaps[musicBlocks.turIndex] = [1];
            musicBlocks.setHeapEntry("2", 9);
            expect(globalActivity.logo.turtleHeaps[musicBlocks.turIndex]).toEqual([1]);
            expect(JSEditor.logConsole).toHaveBeenCalledWith(
                "Heap index must be a number.",
                "maroon"
            );
        });

        test("setHeapEntry clamps an index below 1 up to 1", () => {
            globalActivity.logo.turtleHeaps[musicBlocks.turIndex] = [];
            musicBlocks.setHeapEntry(0, 7);
            expect(globalActivity.logo.turtleHeaps[musicBlocks.turIndex]).toEqual([7]);
            expect(JSEditor.logConsole).toHaveBeenCalledWith("Index must be > 0.", "maroon");
        });

        test("setHeapEntry clamps an index above 1000 down to 1000", () => {
            globalActivity.logo.turtleHeaps[musicBlocks.turIndex] = [];
            musicBlocks.setHeapEntry(1500, "end");
            const heap = globalActivity.logo.turtleHeaps[musicBlocks.turIndex];
            expect(heap).toHaveLength(1000);
            expect(heap[999]).toBe("end");
            expect(JSEditor.logConsole).toHaveBeenCalledWith(
                "Maximum heap size is 1000.",
                "maroon"
            );
        });

        test("setHeapEntry pads skipped entries with 0", () => {
            globalActivity.logo.turtleHeaps[musicBlocks.turIndex] = [];
            musicBlocks.setHeapEntry(4, "x");
            expect(globalActivity.logo.turtleHeaps[musicBlocks.turIndex]).toEqual([0, 0, 0, "x"]);
        });
    });

    describe("position and camera getters", () => {
        test("BOTTOMPOS is the negative half-height in turtle coordinates", () => {
            globalActivity.turtles._canvas = { height: 600 };
            globalActivity.turtles.scale = 1.5;
            expect(musicBlocks.BOTTOMPOS).toBe(-200);
        });

        test("BOTTOMPOS falls back to 0 without a usable canvas or scale", () => {
            globalActivity.turtles._canvas = null;
            globalActivity.turtles.scale = 1;
            expect(musicBlocks.BOTTOMPOS).toBe(0);
        });

        test("CAMERA returns the camera value", () => {
            global.CAMERAVALUE = "camera-value";
            expect(musicBlocks.CAMERA).toBe("camera-value");
            delete global.CAMERAVALUE;
        });
    });

    describe("STOPFLOW", () => {
        test("resolves to the STOPFLOW sentinel", async () => {
            await expect(musicBlocks.STOPFLOW).resolves.toBe("STOPFLOW");
        });
    });

    describe("runCommand error paths", () => {
        test("rejects when the command is not in any class", async () => {
            MusicBlocks._methodList = { "Singer.RhythmActions": ["getNoteValue"] };
            await expect(musicBlocks.runCommand("noSuchCommand")).rejects.toThrow(
                'Command "noSuchCommand" not found in any class'
            );
        });

        test("rejects when the class cannot be resolved", async () => {
            MusicBlocks._methodList = { TotallyMissingClass: ["foo"] };
            await expect(musicBlocks.runCommand("foo")).rejects.toThrow(
                'Class "TotallyMissingClass" could not be resolved for command "foo"'
            );
        });

        test("rejects when the member is not a function", async () => {
            MusicBlocks._methodList = { "Singer.VolumeActions": ["masterVolume"] };
            await expect(musicBlocks.runCommand("masterVolume")).rejects.toThrow(
                'Command "masterVolume" not found on class "Singer.VolumeActions"'
            );
        });
    });

    describe("API method list setup", () => {
        test("init warns when a class path cannot be resolved", () => {
            const savedTurtle = global.Turtle;
            delete global.Turtle;
            const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
            try {
                MusicBlocks.init(true);
                expect(warn).toHaveBeenCalledWith('Class path "Turtle.DictActions" not found');
            } finally {
                warn.mockRestore();
                global.Turtle = savedTurtle;
            }
        });
    });
});
