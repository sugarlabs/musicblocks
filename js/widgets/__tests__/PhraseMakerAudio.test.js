/**
 * @license
 * Copyright (c) 2026 Sapnil Biswas
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the The GNU Affero General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * @author Sapnil Biswas
 */

const PhraseMakerAudio = require("../PhraseMakerAudio");

// Mock dependencies that are expected to be globals
global.PhraseMakerUtils = {
    MATRIXGRAPHICS: [
        "forward",
        "back",
        "right",
        "left",
        "setcolor",
        "sethue",
        "setshade",
        "setgrey",
        "settranslucency",
        "setpensize",
        "setheading"
    ],
    MATRIXGRAPHICS2: ["arc", "setxy"],
    MATRIXSYNTHS: ["sine", "sawtooth", "triangle", "square"]
};

global.PhraseMakerUI = {
    resetMatrix: jest.fn()
};

global.normalizeNoteAccidentals = jest.fn(note => note);

describe("PhraseMakerAudio", () => {
    let mockPM;

    let mockTurtle;

    beforeEach(() => {
        jest.clearAllMocks();

        mockTurtle = {
            painter: {
                doForward: jest.fn(),
                doRight: jest.fn(),
                doSetColor: jest.fn(),
                doSetHue: jest.fn(),
                doSetValue: jest.fn(),
                doSetChroma: jest.fn(),
                doSetPenAlpha: jest.fn(),
                doSetPensize: jest.fn(),
                doSetHeading: jest.fn(),
                doArc: jest.fn(),
                doSetXY: jest.fn()
            }
        };

        mockPM = {
            _colBlocks: [],
            rowLabels: [],
            rowArgs: [],
            _rows: [],
            _notesToPlay: [],
            _notesCounter: 0,
            _spanCounter: 0,
            _colIndex: 0,
            playingNow: false,
            lyricsON: false,
            _lyrics: [],
            _instrumentName: "piano",
            _deps: {
                getDrumName: jest.fn(() => null),
                isCustomTemperament: jest.fn(() => false),
                getTemperament: jest.fn(() => ({})),
                Singer: { defaultBPMFactor: 1 }
            },
            activity: {
                logo: {
                    synth: {
                        stop: jest.fn(),
                        trigger: jest.fn()
                    },
                    turtleDelay: 0
                },
                turtles: {
                    getTurtle: jest.fn(() => mockTurtle)
                }
            },
            widgetWindow: {
                modifyButton: jest.fn(),
                isVisible: jest.fn(() => true)
            },
            platformColor: { selectorBackground: "blue" },
            _noteValueRow: { cells: [] },
            _tupletNoteValueRow: { cells: [] },
            _playButton: { innerHTML: "" },
            _: str => str,
            constructor: { ICONSIZE: 32 }
        };
    });

    describe("collectNotesToPlay", () => {
        test("collects notes from a simple matrix", () => {
            mockPM._colBlocks = [{}, {}];
            mockPM.rowLabels = ["C", "D"];
            mockPM.rowArgs = [4, 4];

            const cell1 = {
                style: { backgroundColor: "black" },
                getAttribute: jest.fn(() => "8")
            };
            const cell2 = {
                style: { backgroundColor: "white" },
                getAttribute: jest.fn(() => "8")
            };
            const cell3 = {
                style: { backgroundColor: "white" },
                getAttribute: jest.fn(() => "4")
            };
            const cell4 = {
                style: { backgroundColor: "black" },
                getAttribute: jest.fn(() => "4")
            };

            mockPM._rows = [{ cells: [cell1, cell3] }, { cells: [cell2, cell4] }]; // Fixed mapping to be consistent with col blocks

            PhraseMakerAudio.collectNotesToPlay(mockPM);

            expect(mockPM._notesToPlay).toEqual([
                [["C4"], 0.125],
                [["D4"], 0.25]
            ]);
        });

        test("collects chords correctly", () => {
            mockPM._colBlocks = [{}];
            mockPM.rowLabels = ["C", "E", "G"];
            mockPM.rowArgs = [4, 4, 4];

            const cell1 = { style: { backgroundColor: "black" }, getAttribute: () => "4" };
            const cell2 = { style: { backgroundColor: "black" }, getAttribute: () => "4" };
            const cell3 = { style: { backgroundColor: "black" }, getAttribute: () => "4" };

            mockPM._rows = [{ cells: [cell1] }, { cells: [cell2] }, { cells: [cell3] }];

            PhraseMakerAudio.collectNotesToPlay(mockPM);

            expect(mockPM._notesToPlay).toEqual([[["C4", "E4", "G4"], 0.25]]);
        });

        test("handles custom temperament", () => {
            mockPM._colBlocks = [{}];
            mockPM.rowLabels = ["custom_note"];
            mockPM.rowArgs = [4];
            mockPM._deps.isCustomTemperament.mockReturnValue(true);
            mockPM._deps.getTemperament.mockReturnValue({
                n1: [0, "custom_note"]
            });
            mockPM.activity.logo.synth.inTemperament = "custom";

            const cell = { style: { backgroundColor: "black" }, getAttribute: () => "1" };
            mockPM._rows = [{ cells: [cell] }];

            PhraseMakerAudio.collectNotesToPlay(mockPM);

            expect(mockPM._notesToPlay).toEqual([[["custom_note4"], 1]]);
        });

        test("handles drum names correctly", () => {
            mockPM._colBlocks = [{}];
            mockPM.rowLabels = ["kick"];
            mockPM.rowArgs = [null];
            mockPM._deps.getDrumName.mockReturnValue("kick_drum");

            const cell = {
                style: { backgroundColor: "black" },
                getAttribute: jest.fn(() => "4")
            };

            mockPM._rows = [{ cells: [cell] }];

            PhraseMakerAudio.collectNotesToPlay(mockPM);

            expect(mockPM._notesToPlay).toEqual([[["kick"], 0.25]]);
        });

        test("handles graphics blocks correctly", () => {
            mockPM._colBlocks = [{}];
            mockPM.rowLabels = ["forward"];
            mockPM.rowArgs = [100];

            const cell = {
                style: { backgroundColor: "black" },
                getAttribute: jest.fn(() => "1")
            };

            mockPM._rows = [{ cells: [cell] }];

            PhraseMakerAudio.collectNotesToPlay(mockPM);

            expect(mockPM._notesToPlay).toEqual([[["forward: 100"], 1]]);
        });

        test("handles hertz input correctly", () => {
            mockPM._colBlocks = [{}];
            mockPM.rowLabels = ["hertz"];
            mockPM.rowArgs = [440];

            const cell = {
                style: { backgroundColor: "black" },
                getAttribute: jest.fn(() => "1")
            };

            mockPM._rows = [{ cells: [cell] }];

            PhraseMakerAudio.collectNotesToPlay(mockPM);

            expect(mockPM._notesToPlay).toEqual([[[440], 1]]);
        });

        test("skips cells with invalid alt attribute", () => {
            mockPM._colBlocks = [{}];
            mockPM.rowLabels = ["C"];
            mockPM.rowArgs = [4];

            const cell = {
                style: { backgroundColor: "black" },
                getAttribute: jest.fn(() => "invalid")
            };

            mockPM._rows = [{ cells: [cell] }];

            const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

            PhraseMakerAudio.collectNotesToPlay(mockPM);

            expect(mockPM._notesToPlay).toEqual([]);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe("_processGraphics", () => {
        test("processes forward command", () => {
            PhraseMakerAudio._processGraphics(mockPM, ["forward", 100]);
            expect(mockTurtle.painter.doForward).toHaveBeenCalledWith(100);
        });

        test("processes back command", () => {
            PhraseMakerAudio._processGraphics(mockPM, ["back", 50]);
            expect(mockTurtle.painter.doForward).toHaveBeenCalledWith(-50);
        });

        test("processes right command", () => {
            PhraseMakerAudio._processGraphics(mockPM, ["right", 90]);
            expect(mockTurtle.painter.doRight).toHaveBeenCalledWith(90);
        });

        test("processes left command", () => {
            PhraseMakerAudio._processGraphics(mockPM, ["left", 45]);
            expect(mockTurtle.painter.doRight).toHaveBeenCalledWith(-45);
        });

        test("processes setcolor command", () => {
            PhraseMakerAudio._processGraphics(mockPM, ["setcolor", 10]);
            expect(mockTurtle.painter.doSetColor).toHaveBeenCalledWith(10);
        });

        test("processes sethue command", () => {
            PhraseMakerAudio._processGraphics(mockPM, ["sethue", 20]);
            expect(mockTurtle.painter.doSetHue).toHaveBeenCalledWith(20);
        });

        test("processes setshade command", () => {
            PhraseMakerAudio._processGraphics(mockPM, ["setshade", 30]);
            expect(mockTurtle.painter.doSetValue).toHaveBeenCalledWith(30);
        });

        test("processes setgrey command", () => {
            PhraseMakerAudio._processGraphics(mockPM, ["setgrey", 40]);
            expect(mockTurtle.painter.doSetChroma).toHaveBeenCalledWith(40);
        });

        test("processes settranslucency command", () => {
            PhraseMakerAudio._processGraphics(mockPM, ["settranslucency", 20]);
            expect(mockTurtle.painter.doSetPenAlpha).toHaveBeenCalledWith(0.8);
        });

        test("processes setpensize command", () => {
            PhraseMakerAudio._processGraphics(mockPM, ["setpensize", 5]);
            expect(mockTurtle.painter.doSetPensize).toHaveBeenCalledWith(5);
        });

        test("processes setheading command", () => {
            PhraseMakerAudio._processGraphics(mockPM, ["setheading", 180]);
            expect(mockTurtle.painter.doSetHeading).toHaveBeenCalledWith(180);
        });

        test("processes arc command", () => {
            PhraseMakerAudio._processGraphics(mockPM, ["arc", 90, 50]);
            expect(mockTurtle.painter.doArc).toHaveBeenCalledWith(90, 50);
        });

        test("processes setxy command", () => {
            PhraseMakerAudio._processGraphics(mockPM, ["setxy", 100, 200]);
            expect(mockTurtle.painter.doSetXY).toHaveBeenCalledWith(100, 200);
        });

        test("logs unknown commands", () => {
            const consoleSpy = jest.spyOn(console, "debug").mockImplementation(() => {});
            PhraseMakerAudio._processGraphics(mockPM, ["unknown", 0]);
            expect(consoleSpy).toHaveBeenCalledWith("unknown graphics command unknown");
            consoleSpy.mockRestore();
        });
    });

    describe("_playChord", () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        test("triggers notes for a chord", () => {
            const notes = ["C4", "E4", "G4"];
            PhraseMakerAudio._playChord(mockPM, notes, 1);

            jest.runAllTimers();

            expect(mockPM.activity.logo.synth.trigger).toHaveBeenCalledTimes(3);
            expect(mockPM.activity.logo.synth.trigger).toHaveBeenCalledWith(
                0,
                "C4",
                1,
                "piano",
                null,
                null
            );
            expect(mockPM.activity.logo.synth.trigger).toHaveBeenCalledWith(
                0,
                "E4",
                1,
                "piano",
                null,
                null
            );
            expect(mockPM.activity.logo.synth.trigger).toHaveBeenCalledWith(
                0,
                "G4",
                1,
                "piano",
                null,
                null
            );
        });
    });

    describe("playAll", () => {
        let collectSpy;

        beforeEach(() => {
            collectSpy = jest
                .spyOn(PhraseMakerAudio, "collectNotesToPlay")
                .mockImplementation(() => {});
        });

        afterEach(() => {
            collectSpy.mockRestore();
        });

        test("stops notes when called while playing", () => {
            mockPM.playingNow = true;
            PhraseMakerAudio.playAll(mockPM);
            expect(mockPM.playingNow).toBe(false);
            expect(mockPM.widgetWindow.modifyButton).toHaveBeenCalledWith(
                0,
                "play-button.svg",
                32,
                "Play"
            );
            expect(mockPM._stopOrCloseClicked).toBe(true);
        });

        test("starts playback when called while not playing", () => {
            mockPM.playingNow = false;
            mockPM._notesToPlay = [[["C4"], 1]];
            mockPM._noteValueRow = { cells: [{ style: { backgroundColor: "" } }] };

            PhraseMakerAudio.playAll(mockPM);

            expect(mockPM.playingNow).toBe(true);
            expect(mockPM.widgetWindow.modifyButton).toHaveBeenCalledWith(
                0,
                "stop-button.svg",
                32,
                "Stop"
            );
            expect(mockPM.activity.logo.synth.stop).toHaveBeenCalled();
        });
    });

    describe("__playNote", () => {
        beforeEach(() => {
            jest.useFakeTimers();
            mockPM._notesToPlay = [
                [["C4"], 0.25],
                [["D4"], 0.25]
            ];
            mockPM._notesCounter = 0;
            mockPM._colIndex = 0;
            mockPM._noteValueRow = { cells: [{ style: {} }, { style: {} }] };
            mockPM._tupletNoteValueRow = { cells: [{ style: {} }, { style: {} }] };
            mockPM.widgetWindow.isVisible.mockReturnValue(true);
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        test("stops if widget is not visible", () => {
            mockPM.widgetWindow.isVisible.mockReturnValue(false);
            PhraseMakerAudio.__playNote(mockPM, 0, 0);
            jest.runAllTimers();
            expect(mockPM._notesCounter).toBe(0);
        });

        test("completes playback and resets matrix when last note is played", () => {
            mockPM._notesCounter = 1; // On last note
            PhraseMakerAudio.__playNote(mockPM, 0, 1);
            jest.runAllTimers();

            expect(global.PhraseMakerUI.resetMatrix).toHaveBeenCalled();
            expect(mockPM.playingNow).toBe(false);
        });

        test("highlights lyrics if enabled", () => {
            mockPM.lyricsON = true;
            mockPM._lyrics = ["Hello"];
            global.activity = { textMsg: jest.fn() };

            PhraseMakerAudio.__playNote(mockPM, 0, 0);

            expect(global.activity.textMsg).toHaveBeenCalledWith("Hello", 3000);
            delete global.activity;
        });

        test("advances colIndex for single span cells", () => {
            mockPM._noteValueRow.cells = [{ style: {} }, { style: {} }, { style: {} }];
            mockPM._noteValueRow.cells[0].colSpan = 1;
            PhraseMakerAudio.__playNote(mockPM, 0, 0);
            jest.runOnlyPendingTimers(); // Run the first note's timeout
            expect(mockPM._colIndex).toBe(1);
        });

        test("handles tuplet cell span correctly", () => {
            mockPM._noteValueRow.cells = [{ style: {} }, { style: {} }, { style: {} }];
            mockPM._noteValueRow.cells[0].colSpan = 2;
            mockPM._spanCounter = 0;
            PhraseMakerAudio.__playNote(mockPM, 0, 0);
            jest.runOnlyPendingTimers(); // Run the first note's timeout
            expect(mockPM._spanCounter).toBe(1);
            expect(mockPM._colIndex).toBe(0); // Should not advance yet
        });
    });
});
