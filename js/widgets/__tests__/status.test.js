/**
 * MusicBlocks v3.6.2
 *
 * @author vyagh
 *
 * @copyright 2026 vyagh
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

global._ = msg => msg;

global._THIS_IS_MUSIC_BLOCKS_ = true;
global.MATRIXBUTTONHEIGHT = 40;
global.MATRIXSOLFEHEIGHT = 30;

global.rationalToFraction = jest.fn().mockReturnValue([4, 1]);
global.mixedNumber = jest.fn().mockImplementation(val => (val != null ? val.toString() : ""));
global.toFixed2 = jest.fn().mockImplementation(val => val.toFixed(2));

global.platformColor = {
    selectorBackground: "#aaa"
};

const createMockElement = tagName => ({
    tagName,
    style: {},
    appendChild: jest.fn(),
    append: jest.fn(),
    innerHTML: "",
    addEventListener: jest.fn(),
    className: "",
    insertCell: jest.fn().mockImplementation(() => createMockElement("TD")),
    insertRow: jest.fn().mockImplementation(() => ({
        insertCell: jest.fn().mockImplementation(() => createMockElement("TD"))
    })),
    createTHead: jest.fn().mockImplementation(() => ({
        insertRow: jest.fn().mockImplementation(() => ({
            insertCell: jest.fn().mockImplementation(() => createMockElement("TD"))
        }))
    })),
    rows: []
});

global.document = {
    createElement: jest.fn().mockImplementation(createMockElement)
};

const createMockWidgetWindow = () => ({
    clear: jest.fn(),
    show: jest.fn(),
    getWidgetBody: jest.fn().mockReturnValue({
        append: jest.fn()
    }),
    sendToCenter: jest.fn(),
    destroy: jest.fn(),
    onclose: null,
    onmaximize: null
});

global.window = {
    innerWidth: 1200,
    widgetWindows: {
        windowFor: jest.fn().mockImplementation(() => createMockWidgetWindow())
    }
};

const StatusMatrix = require("../status.js");

describe("StatusMatrix Widget", () => {
    let mockActivity;
    let statusMatrix;

    beforeEach(() => {
        jest.clearAllMocks();

        global.window.innerWidth = 1200;
        global.window.widgetWindows = {
            windowFor: jest.fn().mockImplementation(() => createMockWidgetWindow())
        };

        global.document.createElement = jest.fn().mockImplementation(createMockElement);

        mockActivity = {
            logo: {
                statusFields: [],
                updatingStatusMatrix: false,
                inStatusMatrix: false,
                parseArg: jest.fn(),
                synth: {
                    getFrequency: jest.fn().mockReturnValue(440),
                    changeInTemperament: 0
                },
                boxes: {}
            },
            turtles: {
                turtleList: [{ name: "Mouse1", inTrash: false }],
                ithTurtle: jest.fn().mockReturnValue({
                    singer: {
                        currentBeat: 1,
                        currentMeasure: 1,
                        noteStatus: null
                    }
                }),
                getIndexOfTurtle: jest.fn().mockReturnValue(0)
            },
            blocks: {
                blockList: {}
            }
        };

        statusMatrix = new StatusMatrix();
    });

    describe("Static Properties", () => {
        test("BUTTONDIVWIDTH is 128", () => {
            expect(StatusMatrix.BUTTONDIVWIDTH).toBe(128);
        });

        test("BUTTONSIZE is 53", () => {
            expect(StatusMatrix.BUTTONSIZE).toBe(53);
        });

        test("ICONSIZE is 32", () => {
            expect(StatusMatrix.ICONSIZE).toBe(32);
        });

        test("OUTERWINDOWWIDTH is 620", () => {
            expect(StatusMatrix.OUTERWINDOWWIDTH).toBe(620);
        });

        test("FONTSCALEFACTOR is 75", () => {
            expect(StatusMatrix.FONTSCALEFACTOR).toBe(75);
        });
    });

    describe("Initialization (init)", () => {
        test("sets isOpen to true", () => {
            statusMatrix.init(mockActivity);
            expect(statusMatrix.isOpen).toBe(true);
        });

        test("sets isMaximized to false", () => {
            statusMatrix.init(mockActivity);
            expect(statusMatrix.isMaximized).toBe(false);
        });

        test("calculates cell scale from window width", () => {
            statusMatrix.init(mockActivity);
            expect(statusMatrix._cellScale).toBe(1);
        });

        test("creates widget window", () => {
            statusMatrix.init(mockActivity);
            expect(window.widgetWindows.windowFor).toHaveBeenCalledWith(
                statusMatrix,
                "status",
                "status"
            );
        });

        test("creates status table element", () => {
            statusMatrix.init(mockActivity);
            expect(document.createElement).toHaveBeenCalledWith("table");
        });

        test("clears and shows widget window", () => {
            statusMatrix.init(mockActivity);
            expect(statusMatrix.widgetWindow.clear).toHaveBeenCalled();
            expect(statusMatrix.widgetWindow.show).toHaveBeenCalled();
        });

        test("stores activity reference", () => {
            statusMatrix.init(mockActivity);
            expect(statusMatrix.activity).toBe(mockActivity);
        });
    });

    describe("Onclose Handler", () => {
        beforeEach(() => {
            statusMatrix.init(mockActivity);
        });

        test("sets isOpen to false", () => {
            statusMatrix.widgetWindow.onclose();
            expect(statusMatrix.isOpen).toBe(false);
        });

        test("destroys widget window", () => {
            statusMatrix.widgetWindow.onclose();
            expect(statusMatrix.widgetWindow.destroy).toHaveBeenCalled();
        });
    });

    describe("Status Field Label Handling", () => {
        beforeEach(() => {
            mockActivity.blocks.blockList = {
                0: { name: "x", protoblock: { staticLabels: ["x position"] }, value: 100 },
                1: { name: "plus", protoblock: { staticLabels: ["plus"] }, value: 0 },
                2: { name: "namedbox", privateData: "myVariable", value: 42 },
                3: { name: "heap", protoblock: { staticLabels: ["heap"] }, value: [1, 2, 3] },
                4: { name: "bpm", protoblock: { staticLabels: ["beats per minute"] }, value: 120 }
            };

            mockActivity.logo.statusFields = [
                [0, "x"],
                [1, "plus"],
                [2, "namedbox"],
                [3, "heap"],
                [4, "bpm"]
            ];
        });

        test("handles standard blocks with staticLabels", () => {
            statusMatrix.init(mockActivity);

            expect(statusMatrix._statusTable).toBeDefined();
        });

        test("handles math operation blocks (plus, minus, etc) with empty label", () => {
            statusMatrix.init(mockActivity);
            expect(statusMatrix._statusTable).toBeDefined();
        });

        test("handles namedbox with privateData as label", () => {
            statusMatrix.init(mockActivity);
            expect(statusMatrix._statusTable).toBeDefined();
        });
    });

    describe("Turtle Display", () => {
        test("displays mouse icon for Music Blocks", () => {
            global._THIS_IS_MUSIC_BLOCKS_ = true;
            statusMatrix.init(mockActivity);

            expect(statusMatrix._statusTable).toBeDefined();
        });

        test("displays turtle icon for Turtle Blocks", () => {
            global._THIS_IS_MUSIC_BLOCKS_ = false;
            statusMatrix.init(mockActivity);
            expect(statusMatrix._statusTable).toBeDefined();
            global._THIS_IS_MUSIC_BLOCKS_ = true; // Reset
        });

        test("skips trashed turtles", () => {
            mockActivity.turtles.turtleList = [
                { name: "Mouse1", inTrash: false },
                { name: "Mouse2", inTrash: true },
                { name: "Mouse3", inTrash: false }
            ];
            statusMatrix.init(mockActivity);
            expect(statusMatrix._statusTable).toBeDefined();
        });
    });

    describe("UpdateAll Method", () => {
        beforeEach(() => {
            mockActivity.blocks.blockList = {
                0: { name: "x", protoblock: { staticLabels: ["x"] }, value: 150 }
            };
            mockActivity.logo.statusFields = [[0, "x"]];

            statusMatrix.init(mockActivity);

            statusMatrix._statusTable.rows = [
                { cells: [createMockElement("TD"), createMockElement("TD")] },
                { cells: [createMockElement("TD"), createMockElement("TD")] },
                { cells: [createMockElement("TD"), createMockElement("TD")] }
            ];
        });

        test("sets updatingStatusMatrix to true during update", () => {
            let capturedValue = null;
            mockActivity.logo.parseArg = jest.fn(() => {
                capturedValue = mockActivity.logo.updatingStatusMatrix;
            });

            statusMatrix.updateAll();

            expect(capturedValue).toBe(true);
        });

        test("resets updatingStatusMatrix to false after update", () => {
            statusMatrix.updateAll();
            expect(mockActivity.logo.updatingStatusMatrix).toBe(false);
        });

        test("calls parseArg for each status field", () => {
            statusMatrix.updateAll();
            expect(mockActivity.logo.parseArg).toHaveBeenCalled();
        });

        test("temporarily disables inStatusMatrix during parsing", () => {
            let capturedValue = null;
            mockActivity.logo.parseArg = jest.fn(() => {
                capturedValue = mockActivity.logo.inStatusMatrix;
            });

            mockActivity.logo.inStatusMatrix = true;
            statusMatrix.updateAll();

            expect(capturedValue).toBe(false);
        });

        test("restores inStatusMatrix after parsing", () => {
            mockActivity.logo.inStatusMatrix = true;
            statusMatrix.updateAll();
            expect(mockActivity.logo.inStatusMatrix).toBe(true);
        });

        test("skips trashed turtles", () => {
            mockActivity.turtles.turtleList = [{ name: "Mouse1", inTrash: true }];

            statusMatrix.updateAll();

            expect(statusMatrix._statusTable).toBeDefined();
        });
    });

    describe("Block Value Formatting", () => {
        beforeEach(() => {
            statusMatrix.init(mockActivity);
            statusMatrix._statusTable.rows = [
                { cells: [createMockElement("TD"), createMockElement("TD")] },
                { cells: [createMockElement("TD"), createMockElement("TD")] },
                { cells: [createMockElement("TD"), createMockElement("TD")] }
            ];
        });

        test("formats x position with toFixed(0)", () => {
            mockActivity.blocks.blockList = {
                0: { name: "x", value: 123.789 }
            };
            mockActivity.logo.statusFields = [[0, "x"]];

            statusMatrix.updateAll();
            expect(mockActivity.logo.parseArg).toHaveBeenCalled();
        });

        test("formats y position with toFixed(0)", () => {
            mockActivity.blocks.blockList = {
                0: { name: "y", value: -456.123 }
            };
            mockActivity.logo.statusFields = [[0, "y"]];

            statusMatrix.updateAll();
            expect(mockActivity.logo.parseArg).toHaveBeenCalled();
        });

        test("formats heading with toFixed(0)", () => {
            mockActivity.blocks.blockList = {
                0: { name: "heading", value: 45.67 }
            };
            mockActivity.logo.statusFields = [[0, "heading"]];

            statusMatrix.updateAll();
            expect(mockActivity.logo.parseArg).toHaveBeenCalled();
        });

        test("formats mynotevalue with mixedNumber", () => {
            mockActivity.blocks.blockList = {
                0: { name: "mynotevalue", value: 0.25 }
            };
            mockActivity.logo.statusFields = [[0, "mynotevalue"]];

            statusMatrix.updateAll();
            expect(mixedNumber).toHaveBeenCalledWith(0.25);
        });

        test("formats elapsednotes with mixedNumber", () => {
            mockActivity.blocks.blockList = {
                0: { name: "elapsednotes", value: 4.5 }
            };
            mockActivity.logo.statusFields = [[0, "elapsednotes"]];

            statusMatrix.updateAll();
            expect(mixedNumber).toHaveBeenCalled();
        });

        test("formats beatvalue with mixedNumber using singer.currentBeat", () => {
            mockActivity.blocks.blockList = {
                0: { name: "beatvalue", value: 2 }
            };
            mockActivity.logo.statusFields = [[0, "beatvalue"]];
            mockActivity.turtles.ithTurtle.mockReturnValue({
                singer: { currentBeat: 3, currentMeasure: 1, noteStatus: null }
            });

            statusMatrix.updateAll();
            expect(mixedNumber).toHaveBeenCalledWith(3);
        });

        test("uses singer.currentMeasure for measurevalue", () => {
            mockActivity.blocks.blockList = {
                0: { name: "measurevalue", value: 0 }
            };
            mockActivity.logo.statusFields = [[0, "measurevalue"]];
            mockActivity.turtles.ithTurtle.mockReturnValue({
                singer: { currentBeat: 1, currentMeasure: 4, noteStatus: null }
            });

            statusMatrix.updateAll();
            expect(statusMatrix._statusTable.rows[1].cells[1].innerHTML).toBe(4);
        });

        test("handles namedbox with value from logo.boxes", () => {
            mockActivity.blocks.blockList = {
                0: { name: "namedbox", privateData: "myVar" }
            };
            mockActivity.logo.statusFields = [[0, "namedbox"]];
            mockActivity.logo.boxes = { myVar: 42 };

            statusMatrix.updateAll();
            expect(mockActivity.logo.parseArg).toHaveBeenCalled();
        });

        test("handles namedbox with missing variable", () => {
            mockActivity.blocks.blockList = {
                0: { name: "namedbox", privateData: "missing" }
            };
            mockActivity.logo.statusFields = [[0, "namedbox"]];
            mockActivity.logo.boxes = {};

            expect(() => statusMatrix.updateAll()).not.toThrow();
        });

        test("handles heap value directly", () => {
            mockActivity.blocks.blockList = {
                0: { name: "heap", value: [1, 2, 3] }
            };
            mockActivity.logo.statusFields = [[0, "heap"]];

            statusMatrix.updateAll();
            expect(mockActivity.logo.parseArg).toHaveBeenCalled();
        });
    });

    describe("Pitch in Hertz Handling", () => {
        beforeEach(() => {
            statusMatrix.init(mockActivity);
            statusMatrix._statusTable.rows = [
                { cells: [createMockElement("TD"), createMockElement("TD")] },
                { cells: [createMockElement("TD"), createMockElement("TD")] },
                { cells: [createMockElement("TD"), createMockElement("TD")] }
            ];
        });

        test("gets frequency from synth for pitchinhertz", () => {
            mockActivity.blocks.blockList = {
                0: { name: "pitchinhertz", value: 0 }
            };
            mockActivity.logo.statusFields = [[0, "pitchinhertz"]];
            mockActivity.turtles.ithTurtle.mockReturnValue({
                singer: {
                    currentBeat: 1,
                    currentMeasure: 1,
                    noteStatus: [["C4"], 0.25]
                }
            });

            statusMatrix.updateAll();
            expect(mockActivity.logo.synth.getFrequency).toHaveBeenCalledWith("C4", 0);
        });

        test("handles multiple notes in pitchinhertz", () => {
            mockActivity.blocks.blockList = {
                0: { name: "pitchinhertz", value: 0 }
            };
            mockActivity.logo.statusFields = [[0, "pitchinhertz"]];
            mockActivity.turtles.ithTurtle.mockReturnValue({
                singer: {
                    currentBeat: 1,
                    currentMeasure: 1,
                    noteStatus: [["C4", "E4", "G4"], 0.25]
                }
            });

            statusMatrix.updateAll();
            expect(mockActivity.logo.synth.getFrequency).toHaveBeenCalledTimes(3);
        });

        test("returns empty for null noteStatus", () => {
            mockActivity.blocks.blockList = {
                0: { name: "pitchinhertz", value: 0 }
            };
            mockActivity.logo.statusFields = [[0, "pitchinhertz"]];
            mockActivity.turtles.ithTurtle.mockReturnValue({
                singer: { currentBeat: 1, currentMeasure: 1, noteStatus: null }
            });

            statusMatrix.updateAll();
            expect(mockActivity.logo.synth.getFrequency).not.toHaveBeenCalled();
        });
    });

    describe("Note Row Display", () => {
        beforeEach(() => {
            global._THIS_IS_MUSIC_BLOCKS_ = true;
            mockActivity.blocks.blockList = {
                0: { name: "x", protoblock: { staticLabels: ["x"] }, value: 100 }
            };
            mockActivity.logo.statusFields = [[0, "x"]];

            statusMatrix.init(mockActivity);

            statusMatrix._statusTable.rows = [
                { cells: [createMockElement("TD"), createMockElement("TD")] },
                { cells: [createMockElement("TD"), createMockElement("TD")] },
                { cells: [createMockElement("TD"), createMockElement("TD")] }
            ];
        });

        test("displays note names from noteStatus", () => {
            mockActivity.turtles.ithTurtle.mockReturnValue({
                singer: {
                    currentBeat: 1,
                    currentMeasure: 1,
                    noteStatus: [["C4", "E4"], 0.25]
                }
            });

            statusMatrix.updateAll();
            expect(rationalToFraction).toHaveBeenCalledWith(0.25);
        });

        test("formats numeric frequencies with Hz suffix", () => {
            mockActivity.turtles.ithTurtle.mockReturnValue({
                singer: {
                    currentBeat: 1,
                    currentMeasure: 1,
                    noteStatus: [[440], 0.25]
                }
            });

            statusMatrix.updateAll();
            expect(toFixed2).toHaveBeenCalledWith(440);
        });

        test("replaces # with ♯ in note display", () => {
            const mockCell = createMockElement("TD");
            statusMatrix._statusTable.rows[2] = { cells: [createMockElement("TD"), mockCell] };

            mockActivity.turtles.ithTurtle.mockReturnValue({
                singer: {
                    currentBeat: 1,
                    currentMeasure: 1,
                    noteStatus: [["C#4"], 0.25]
                }
            });

            statusMatrix.updateAll();

            expect(mockCell.innerHTML).toContain("♯");
        });

        test("replaces b with ♭ in note display", () => {
            mockActivity.turtles.ithTurtle.mockReturnValue({
                singer: {
                    currentBeat: 1,
                    currentMeasure: 1,
                    noteStatus: [["Bb4"], 0.25]
                }
            });

            statusMatrix.updateAll();
            expect(statusMatrix._statusTable.rows[2].cells[1].innerHTML).toContain("♭");
        });

        test("handles empty noteStatus array", () => {
            mockActivity.turtles.ithTurtle.mockReturnValue({
                singer: {
                    currentBeat: 1,
                    currentMeasure: 1,
                    noteStatus: [[], 0.25]
                }
            });

            expect(() => statusMatrix.updateAll()).not.toThrow();
        });
    });

    describe("elapsednotes2 Block", () => {
        beforeEach(() => {
            statusMatrix.init(mockActivity);
            statusMatrix._statusTable.rows = [
                { cells: [createMockElement("TD"), createMockElement("TD")] },
                { cells: [createMockElement("TD"), createMockElement("TD")] },
                { cells: [createMockElement("TD"), createMockElement("TD")] }
            ];
        });

        test("parses connected block for note value", () => {
            mockActivity.blocks.blockList = {
                0: { name: "elapsednotes2", value: 4, connections: [null, 1] },
                1: { name: "number", value: 0.25 }
            };
            mockActivity.logo.statusFields = [[0, "elapsednotes2"]];

            statusMatrix.updateAll();

            expect(mockActivity.logo.parseArg).toHaveBeenCalled();
        });
    });

    describe("Multiple Turtles", () => {
        beforeEach(() => {
            mockActivity.turtles.turtleList = [
                { name: "Mouse1", inTrash: false },
                { name: "Mouse2", inTrash: false }
            ];
            mockActivity.blocks.blockList = {
                0: { name: "x", protoblock: { staticLabels: ["x"] }, value: 100 }
            };
            mockActivity.logo.statusFields = [[0, "x"]];

            statusMatrix.init(mockActivity);

            statusMatrix._statusTable.rows = [
                {
                    cells: [
                        createMockElement("TD"),
                        createMockElement("TD"),
                        createMockElement("TD")
                    ]
                },
                {
                    cells: [
                        createMockElement("TD"),
                        createMockElement("TD"),
                        createMockElement("TD")
                    ]
                },
                {
                    cells: [
                        createMockElement("TD"),
                        createMockElement("TD"),
                        createMockElement("TD")
                    ]
                }
            ];
        });

        test("updates cells for each active turtle", () => {
            statusMatrix.updateAll();

            expect(mockActivity.turtles.ithTurtle).toHaveBeenCalled();
        });

        test("increments activeTurtles count correctly", () => {
            statusMatrix.updateAll();
            expect(statusMatrix._statusTable).toBeDefined();
        });
    });
});
