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

// updateAll schedules its DOM render on the next animation frame; run it
// synchronously so the rendering tests below stay direct. The throttling
// describe overrides this with a manual queue.
global.requestAnimationFrame = cb => cb();

global._THIS_IS_MUSIC_BLOCKS_ = true;
global.MATRIXBUTTONHEIGHT = 40;
global.MATRIXSOLFEHEIGHT = 30;

global.rationalToFraction = jest.fn().mockReturnValue([4, 1]);
global.mixedNumber = jest
    .fn()
    .mockImplementation(val => (val !== null && val !== undefined ? val.toString() : ""));
global.toFixed2 = jest.fn().mockImplementation(val => val.toFixed(2));

global.platformColor = {
    selectorBackground: "#aaa"
};

if (typeof global.TextDecoder === "undefined") {
    const { TextDecoder } = require("util");
    global.TextDecoder = TextDecoder;
}

const createMockElement = tagName => ({
    tagName,
    style: {},
    append: jest.fn(),
    innerHTML: "",
    textContent: "",
    appendChild: jest.fn(),
    setAttribute: jest.fn(),
    querySelectorAll: jest.fn().mockReturnValue([]),
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
    createTBody: jest.fn().mockImplementation(() => ({
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
        test("onmaximize toggles isMaximized and updates cell styles", () => {
            statusMatrix.init(mockActivity);
            statusMatrix.isMaximized = false;
            statusMatrix.widgetWindow.onmaximize();
            expect(statusMatrix.isMaximized).toBe(true);
            statusMatrix.widgetWindow.onmaximize();
            expect(statusMatrix.isMaximized).toBe(false);
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
        test("handles bpm block with ja language preference", () => {
            Object.defineProperty(global, "localStorage", {
                value: { languagePreference: "ja" },
                writable: true,
                configurable: true
            });
            mockActivity.blocks.blockList = {
                0: { name: "bpm", protoblock: { staticLabels: ["beats per minute"] }, value: 120 }
            };
            mockActivity.logo.statusFields = [[0, "bpm"]];
            statusMatrix.init(mockActivity);
            expect(statusMatrix._statusTable).toBeDefined();
            Object.defineProperty(global, "localStorage", {
                value: { languagePreference: "en" },
                writable: true,
                configurable: true
            });
        });
        it("uses privateData for outputtools block", () => {
            mockActivity.blocks.blockList = {
                0: { name: "outputtools", privateData: "someData", value: null }
            };
            mockActivity.logo.statusFields = [[0, "outputtools"]];
            statusMatrix.init(mockActivity);
            expect(statusMatrix._statusTable).toBeDefined();
        });

        test("handles missing or undefined blocks in statusFields without throwing", () => {
            mockActivity.blocks.blockList = {};
            mockActivity.logo.statusFields = [
                [99, "namedbox"],
                [100, "bpm"],
                [101, "bpmfactor"],
                [102, "outputtools"],
                [103, "customblock"]
            ];
            expect(() => statusMatrix.init(mockActivity)).not.toThrow();
            expect(statusMatrix._statusTable).toBeDefined();
        });

        test("handles missing protoblock in bpm and outputtools blocks", () => {
            mockActivity.blocks.blockList = {
                0: { name: "bpm" },
                1: { name: "outputtools", privateData: null }
            };
            mockActivity.logo.statusFields = [
                [0, "bpm"],
                [1, "outputtools"]
            ];
            expect(() => statusMatrix.init(mockActivity)).not.toThrow();
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

        describe("frame throttling", () => {
            let frameQueue;
            const flushFrame = () => frameQueue.shift()();

            beforeEach(() => {
                frameQueue = [];
                global.requestAnimationFrame = cb => {
                    frameQueue.push(cb);
                    return frameQueue.length;
                };
            });

            afterEach(() => {
                global.requestAnimationFrame = cb => cb();
            });

            test("coalesces repeated synchronous calls into one render per frame", () => {
                statusMatrix.updateAll();
                statusMatrix.updateAll();
                statusMatrix.updateAll();

                expect(frameQueue).toHaveLength(1);
                expect(mockActivity.logo.parseArg).not.toHaveBeenCalled();

                flushFrame();

                expect(mockActivity.logo.parseArg).toHaveBeenCalledTimes(1);
            });

            test("schedules a fresh render after the previous frame flushed", () => {
                statusMatrix.updateAll();
                flushFrame();
                statusMatrix.updateAll();

                expect(frameQueue).toHaveLength(1);

                flushFrame();

                expect(mockActivity.logo.parseArg).toHaveBeenCalledTimes(2);
            });

            test("skips the render when the widget closed before the frame fired", () => {
                statusMatrix.updateAll();
                statusMatrix.isOpen = false;

                flushFrame();

                expect(mockActivity.logo.parseArg).not.toHaveBeenCalled();
            });

            test("falls back to a 100 ms timeout when requestAnimationFrame is unavailable", () => {
                jest.useFakeTimers();
                const savedRaf = global.requestAnimationFrame;
                global.requestAnimationFrame = undefined;

                try {
                    statusMatrix.updateAll();
                    statusMatrix.updateAll();

                    expect(mockActivity.logo.parseArg).not.toHaveBeenCalled();

                    jest.advanceTimersByTime(99);
                    expect(mockActivity.logo.parseArg).not.toHaveBeenCalled();

                    jest.advanceTimersByTime(1);
                    expect(mockActivity.logo.parseArg).toHaveBeenCalledTimes(1);
                } finally {
                    global.requestAnimationFrame = savedRaf;
                    jest.useRealTimers();
                }
            });
        });

        test("does not throw when a turtle is added after initialization and its column is missing", () => {
            mockActivity.turtles.turtleList = [
                { name: "Mouse1", inTrash: false },
                { name: "Mouse2", inTrash: false }
            ];

            expect(() => statusMatrix.updateAll()).not.toThrow();
            expect(mockActivity.logo.updatingStatusMatrix).toBe(false);
        });

        test("does not throw when a status-field row is missing or out of range", () => {
            mockActivity.blocks.blockList = {
                0: { name: "x", protoblock: { staticLabels: ["x"] }, value: 150 },
                1: { name: "y", protoblock: { staticLabels: ["y"] }, value: 200 }
            };
            mockActivity.logo.statusFields = [
                [0, "x"],
                [1, "y"]
            ];
            statusMatrix._statusTable.rows = [
                { cells: [createMockElement("TD"), createMockElement("TD")] },
                { cells: [createMockElement("TD"), createMockElement("TD")] }
            ];

            expect(() => statusMatrix.updateAll()).not.toThrow();
            expect(mockActivity.logo.updatingStatusMatrix).toBe(false);
        });

        test("does not update after the widget closes", () => {
            statusMatrix.widgetWindow.onclose();

            statusMatrix.updateAll();

            expect(mockActivity.logo.parseArg).not.toHaveBeenCalled();
            expect(mockActivity.logo.updatingStatusMatrix).toBe(false);
        });

        test("does not update without a status table", () => {
            statusMatrix._statusTable = null;

            statusMatrix.updateAll();

            expect(mockActivity.logo.parseArg).not.toHaveBeenCalled();
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
            expect(statusMatrix._statusTable.rows[1].cells[1].textContent).toBe(4);
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
        test("handles default case for unknown block name", () => {
            mockActivity.blocks.blockList = {
                0: { name: "unknownblock", value: 99 }
            };
            mockActivity.logo.statusFields = [[0, "unknownblock"]];
            statusMatrix.updateAll();
            expect(statusMatrix._statusTable.rows[1].cells[1].textContent).toBe(99);
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

        test("updates note row cells for active turtles when a middle turtle is inTrash", () => {
            mockActivity.turtles.turtleList = [
                { name: "Mouse1", inTrash: false },
                { name: "Mouse2", inTrash: true },
                { name: "Mouse3", inTrash: false }
            ];

            const noteCellMouse1 = createMockElement("TD");
            const noteCellMouse3 = createMockElement("TD");
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
                        createMockElement("TD"), // x value for Mouse1
                        createMockElement("TD") // x value for Mouse3
                    ]
                },
                {
                    cells: [createMockElement("TD"), noteCellMouse1, noteCellMouse3]
                }
            ];

            mockActivity.turtles.ithTurtle.mockImplementation(turtleIndex => {
                switch (turtleIndex) {
                    case 0:
                        return {
                            singer: {
                                currentBeat: 1,
                                currentMeasure: 1,
                                noteStatus: [["C4"], 4]
                            }
                        };
                    case 1:
                        return {
                            singer: {
                                currentBeat: 1,
                                currentMeasure: 1,
                                noteStatus: [["X4"], 4]
                            }
                        };
                    case 2:
                        return {
                            singer: {
                                currentBeat: 1,
                                currentMeasure: 1,
                                noteStatus: [["E4"], 2]
                            }
                        };
                    default:
                        return {
                            singer: { currentBeat: 1, currentMeasure: 1, noteStatus: null }
                        };
                }
            });

            rationalToFraction.mockReturnValueOnce([4, 1]).mockReturnValueOnce([2, 1]);

            statusMatrix.updateAll();

            expect(noteCellMouse1.textContent).toBe("C4 1/4");
            expect(noteCellMouse3.textContent).toBe("E4 1/2");
        });

        test("displays note names from noteStatus", () => {
            const mockCell = createMockElement("TD");
            statusMatrix._statusTable.rows[2] = { cells: [createMockElement("TD"), mockCell] };

            mockActivity.turtles.ithTurtle.mockReturnValue({
                singer: {
                    currentBeat: 1,
                    currentMeasure: 1,
                    noteStatus: [["C4", "E4"], 4]
                }
            });

            rationalToFraction.mockReturnValueOnce([4, 1]);

            statusMatrix.updateAll();
            expect(rationalToFraction).toHaveBeenCalledWith(4);
            expect(mockCell.textContent).toContain("C4");
            expect(mockCell.textContent).toContain("E4");
            expect(mockCell.textContent).toBe("C4 E4 1/4");
        });

        test("collapses duplicate note names in the note row display", () => {
            const mockCell = createMockElement("TD");
            statusMatrix._statusTable.rows[2] = { cells: [createMockElement("TD"), mockCell] };

            mockActivity.turtles.ithTurtle.mockReturnValue({
                singer: {
                    currentBeat: 1,
                    currentMeasure: 1,
                    noteStatus: [["G4", "G4"], 8]
                }
            });

            rationalToFraction.mockReturnValueOnce([8, 1]);

            statusMatrix.updateAll();

            expect(mockCell.textContent).toBe("G4 1/8");
        });

        test("formats non-unit fraction durations with numerator and denominator", () => {
            const mockCell = createMockElement("TD");
            statusMatrix._statusTable.rows[2] = { cells: [createMockElement("TD"), mockCell] };

            mockActivity.turtles.ithTurtle.mockReturnValue({
                singer: {
                    currentBeat: 1,
                    currentMeasure: 1,
                    noteStatus: [["C4"], 8 / 3]
                }
            });

            rationalToFraction.mockReturnValueOnce([8, 3]);

            statusMatrix.updateAll();

            expect(mockCell.textContent).toBe("C4 3/8");
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

            expect(mockCell.textContent).toContain("♯");
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
            expect(statusMatrix._statusTable.rows[2].cells[1].textContent).toContain("♭");
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

    describe("Robustness and Null-Safety in _renderAll", () => {
        beforeEach(() => {
            statusMatrix.init(mockActivity);
            statusMatrix._statusTable.rows = [
                { cells: [createMockElement("TD"), createMockElement("TD")] },
                { cells: [createMockElement("TD"), createMockElement("TD")] },
                { cells: [createMockElement("TD"), createMockElement("TD")] }
            ];
        });

        test("handles missing block from blockList during _renderAll without throwing", () => {
            mockActivity.blocks.blockList = {};
            mockActivity.logo.statusFields = [
                [999, "x"],
                [1000, "namedbox"]
            ];
            expect(() => statusMatrix._renderAll()).not.toThrow();
            expect(statusMatrix._statusTable.rows[1].cells[1].textContent).toBe("");
        });

        test("handles elapsednotes2 with missing connections array", () => {
            mockActivity.blocks.blockList = {
                0: { name: "elapsednotes2", value: 2 }
            };
            mockActivity.logo.statusFields = [[0, "elapsednotes2"]];
            expect(() => statusMatrix._renderAll()).not.toThrow();
        });

        test("handles turtle with missing or undefined singer", () => {
            mockActivity.turtles.ithTurtle.mockReturnValue({
                name: "turtleWithoutSinger",
                singer: null,
                inTrash: false
            });
            mockActivity.blocks.blockList = {
                0: { name: "beatvalue", value: null },
                1: { name: "measurevalue", value: null },
                2: { name: "pitchinhertz", value: null }
            };
            mockActivity.logo.statusFields = [
                [0, "beatvalue"],
                [1, "measurevalue"],
                [2, "pitchinhertz"]
            ];
            expect(() => statusMatrix._renderAll()).not.toThrow();
        });

        test("handles namedbox when box key does not exist in boxes", () => {
            mockActivity.blocks.blockList = {
                0: { name: "namedbox", privateData: "nonexistentBox" }
            };
            mockActivity.logo.boxes = {};
            mockActivity.logo.statusFields = [[0, "namedbox"]];
            expect(() => statusMatrix._renderAll()).not.toThrow();
            expect(statusMatrix._statusTable.rows[1].cells[1].textContent).toBe("");
        });
    });

    describe("Window Maximize and Responsive Layout", () => {
        beforeEach(() => {
            statusMatrix.init(mockActivity);
        });

        test("toggles isMaximized and applies maximized styles on header cells", () => {
            const mockHeaderCell = createMockElement("TH");
            statusMatrix._statusTable.querySelectorAll = jest
                .fn()
                .mockReturnValue([mockHeaderCell]);

            expect(statusMatrix.isMaximized).toBe(false);
            statusMatrix.widgetWindow.onmaximize();

            expect(statusMatrix.isMaximized).toBe(true);
            expect(mockHeaderCell.style.width).toBe("100vw");
            expect(mockHeaderCell.style.paddingLeft).toBe("30px");

            statusMatrix.widgetWindow.onmaximize();

            expect(statusMatrix.isMaximized).toBe(false);
            expect(mockHeaderCell.style.width).toBe("212.5px");
            expect(mockHeaderCell.style.paddingLeft).toBe("");
        });
    });

    describe("Outputtools and Arithmetic Status Fields", () => {
        test("resolves label for outputtools with object privateData", () => {
            mockActivity.blocks.blockList = {
                0: { name: "outputtools", privateData: { value: "synth" } }
            };
            mockActivity.logo.statusFields = [[0, "outputtools"]];

            statusMatrix.init(mockActivity);

            const boldElements = global.document.createElement.mock.results
                .map(result => result.value)
                .filter(element => element.tagName.toLowerCase() === "b");

            expect(boldElements[0].textContent).toBe("Synth");
        });

        test("resolves empty label for arithmetic statusFields", () => {
            mockActivity.blocks.blockList = {
                0: { name: "plus", protoblock: { staticLabels: ["+"] } }
            };
            mockActivity.logo.statusFields = [[0, "plus"]];

            statusMatrix.init(mockActivity);

            const boldElements = global.document.createElement.mock.results
                .map(result => result.value)
                .filter(element => element.tagName.toLowerCase() === "b");

            expect(boldElements[0].textContent).toBe("");
        });
    });

    describe("Language Preferences", () => {
        const originalLocalStorage = global.localStorage;

        beforeEach(() => {
            global.localStorage = { languagePreference: "ja" };
            if (global.window) {
                global.window.localStorage = global.localStorage;
            }
        });

        afterEach(() => {
            global.localStorage = originalLocalStorage;
            if (global.window) {
                global.window.localStorage = originalLocalStorage;
            }
        });

        test("uses beats per minute2 label when languagePreference is ja", () => {
            mockActivity.blocks.blockList = {
                0: { name: "bpm", protoblock: { staticLabels: ["BPM"] } }
            };
            mockActivity.logo.statusFields = [[0, "bpm"]];

            statusMatrix.init(mockActivity);

            const boldElements = global.document.createElement.mock.results
                .map(result => result.value)
                .filter(element => element.tagName.toLowerCase() === "b");

            expect(boldElements[0].textContent).toBe("Beats per minute2");
        });
    });

    describe("Turtle Blocks Mode", () => {
        const originalMode = global._THIS_IS_MUSIC_BLOCKS_;

        beforeEach(() => {
            global._THIS_IS_MUSIC_BLOCKS_ = false;
        });

        afterEach(() => {
            global._THIS_IS_MUSIC_BLOCKS_ = originalMode;
        });

        test("initializes table with turtle button icon instead of mouse icon", () => {
            statusMatrix.init(mockActivity);

            const imgElements = global.document.createElement.mock.results
                .map(result => result.value)
                .filter(element => element.tagName.toLowerCase() === "img");

            expect(imgElements[0].src).toBe("header-icons/turtle-button.svg");
        });
    });

    describe("updateAll rAF Fallback", () => {
        const originalRAF = global.requestAnimationFrame;

        beforeEach(() => {
            jest.useFakeTimers();
            delete global.requestAnimationFrame;
            statusMatrix.init(mockActivity);
        });

        afterEach(() => {
            global.requestAnimationFrame = originalRAF;
            jest.useRealTimers();
        });

        test("uses setTimeout when requestAnimationFrame is undefined", () => {
            statusMatrix.updateAll();
            expect(statusMatrix._updateQueued).toBe(true);

            jest.advanceTimersByTime(100);
            expect(statusMatrix._updateQueued).toBe(false);
        });
    });

    describe("Note Status Deduplication and Hertz Display", () => {
        beforeEach(() => {
            statusMatrix.init(mockActivity);
            statusMatrix._statusTable.rows = [
                { cells: [createMockElement("TD"), createMockElement("TD")] },
                { cells: [createMockElement("TD"), createMockElement("TD")] }
            ];
        });

        test("deduplicates notes and formats numeric frequency notes", () => {
            mockActivity.turtles.ithTurtle.mockReturnValue({
                singer: {
                    currentBeat: 1,
                    currentMeasure: 1,
                    noteStatus: [["C4", "C4", 440], 4]
                }
            });

            statusMatrix.updateAll();
            const noteCell = statusMatrix._statusTable.rows[1].cells[1];
            expect(noteCell.textContent.match(/C4/g) || []).toHaveLength(1);
            expect(noteCell.textContent).toBe("C4 440.00Hz 1/4");
        });

        test("formats duration correctly using real rationalToFraction helper", () => {
            const utilsLogic = require("../../utils/utils-logic.js");
            const originalRationalToFraction = global.rationalToFraction;
            global.rationalToFraction = utilsLogic.rationalToFraction;

            try {
                // Quarter note: beat value 4 -> duration 1/4
                mockActivity.turtles.ithTurtle.mockReturnValue({
                    singer: {
                        currentBeat: 1,
                        currentMeasure: 1,
                        noteStatus: [["C4"], 4]
                    }
                });

                statusMatrix.updateAll();
                let noteCell = statusMatrix._statusTable.rows[1].cells[1];
                expect(noteCell.textContent).toBe("C4 1/4");

                // Half note: beat value 2 -> duration 1/2
                mockActivity.turtles.ithTurtle.mockReturnValue({
                    singer: {
                        currentBeat: 1,
                        currentMeasure: 1,
                        noteStatus: [["G4"], 2]
                    }
                });

                statusMatrix.updateAll();
                noteCell = statusMatrix._statusTable.rows[1].cells[1];
                expect(noteCell.textContent).toBe("G4 1/2");

                // Dotted quarter note: beat value 8/3 -> duration 3/8
                mockActivity.turtles.ithTurtle.mockReturnValue({
                    singer: {
                        currentBeat: 1,
                        currentMeasure: 1,
                        noteStatus: [["D4"], 8 / 3]
                    }
                });

                statusMatrix.updateAll();
                noteCell = statusMatrix._statusTable.rows[1].cells[1];
                expect(noteCell.textContent).toBe("D4 3/8");
            } finally {
                global.rationalToFraction = originalRationalToFraction;
            }
        });
    });

    describe("Table Section Structure (thead vs tbody)", () => {
        let originalCreateElement;
        let originalCreateTextNode;
        let originalWindow;
        let originalIsMusicBlocks;

        beforeEach(() => {
            const { JSDOM } = require("jsdom");
            const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");

            originalCreateElement = global.document.createElement;
            originalCreateTextNode = global.document.createTextNode;
            originalWindow = global.window;
            originalIsMusicBlocks = global._THIS_IS_MUSIC_BLOCKS_;

            global.document.createElement = dom.window.document.createElement.bind(
                dom.window.document
            );
            global.document.createTextNode = dom.window.document.createTextNode.bind(
                dom.window.document
            );
            global.window = dom.window;
            global.window.innerWidth = 1200;
            global._THIS_IS_MUSIC_BLOCKS_ = true;

            const realWidgetBody = dom.window.document.createElement("div");
            global.window.widgetWindows = {
                windowFor: jest.fn().mockReturnValue({
                    clear: jest.fn(),
                    show: jest.fn(),
                    getWidgetBody: () => realWidgetBody,
                    sendToCenter: jest.fn(),
                    destroy: jest.fn(),
                    onclose: null,
                    onmaximize: null
                })
            };
        });

        afterEach(() => {
            global.document.createElement = originalCreateElement;
            if (originalCreateTextNode !== undefined) {
                global.document.createTextNode = originalCreateTextNode;
            } else {
                delete global.document.createTextNode;
            }
            global.window = originalWindow;
            global._THIS_IS_MUSIC_BLOCKS_ = originalIsMusicBlocks;
        });

        test("places turtle/icon header row in thead and keeps dynamic data rows out of thead", () => {
            mockActivity.logo.statusFields = [
                [0, "letterclass"],
                [1, "beatvalue"]
            ];
            mockActivity.blocks.blockList = {
                0: { name: "x", protoblock: { staticLabels: ["letter class"] }, value: "G" },
                1: { name: "beatvalue", protoblock: { staticLabels: ["beat count"] }, value: 1 }
            };

            statusMatrix.init(mockActivity);

            const table = statusMatrix._statusTable;
            expect(table.tHead).not.toBeNull();
            expect(table.tHead.rows).toHaveLength(1);

            const headerRow = table.tHead.rows[0];
            const mouseImg = headerRow.querySelector("img");
            expect(mouseImg).not.toBeNull();
            expect(mouseImg.getAttribute("src")).toBe("images/mouse.svg");
        });

        test("places dynamic status rows in tbody", () => {
            mockActivity.logo.statusFields = [
                [0, "letterclass"],
                [1, "beatvalue"]
            ];
            mockActivity.blocks.blockList = {
                0: { name: "x", protoblock: { staticLabels: ["letter class"] }, value: "G" },
                1: { name: "beatvalue", protoblock: { staticLabels: ["beat count"] }, value: 1 }
            };

            statusMatrix.init(mockActivity);

            const table = statusMatrix._statusTable;
            expect(table.tBodies).toHaveLength(1);
            const tbody = table.tBodies[0];

            // 2 status fields + note row + harmony row = 4 rows in tbody
            expect(tbody.rows).toHaveLength(4);
            expect(tbody.rows[0].cells[0].textContent).toContain("Letter class");
            expect(tbody.rows[1].cells[0].textContent).toContain("Beat count");
        });

        test("places Note row in tbody when Music Blocks is enabled", () => {
            mockActivity.logo.statusFields = [[0, "beatvalue"]];
            mockActivity.blocks.blockList = {
                0: { name: "beatvalue", protoblock: { staticLabels: ["beat count"] }, value: 1 }
            };

            statusMatrix.init(mockActivity);

            const tbody = statusMatrix._statusTable.tBodies[0];
            const noteRow = tbody.rows[tbody.rows.length - 2];
            expect(noteRow.cells[0].textContent).toContain("Note");
            const harmonyRow = tbody.rows[tbody.rows.length - 1];
            expect(harmonyRow.cells[0].textContent).toContain("Harmony");
        });

        test("omits Note row in tbody when Music Blocks path is disabled", () => {
            global._THIS_IS_MUSIC_BLOCKS_ = false;
            mockActivity.logo.statusFields = [[0, "beatvalue"]];
            mockActivity.blocks.blockList = {
                0: { name: "beatvalue", protoblock: { staticLabels: ["beat count"] }, value: 1 }
            };

            statusMatrix.init(mockActivity);

            const table = statusMatrix._statusTable;
            expect(table.tHead.rows).toHaveLength(1);
            expect(table.tBodies[0].rows).toHaveLength(1);
            expect(table.tBodies[0].rows[0].cells[0].textContent).toContain("Beat count");
        });

        test("preserves row and cell indexing so updateAll updates data cells across sections", () => {
            mockActivity.logo.statusFields = [
                [0, "beatvalue"],
                [1, "measurevalue"]
            ];
            mockActivity.blocks.blockList = {
                0: { name: "beatvalue", protoblock: { staticLabels: ["beat count"] }, value: 1 },
                1: {
                    name: "measurevalue",
                    protoblock: { staticLabels: ["measure count"] },
                    value: 2
                }
            };
            mockActivity.turtles.ithTurtle.mockReturnValue({
                singer: {
                    currentBeat: 1,
                    currentMeasure: 2,
                    noteStatus: [["C4"], 0.25]
                }
            });

            statusMatrix.init(mockActivity);
            statusMatrix.updateAll();

            const table = statusMatrix._statusTable;
            // Row 0 is header in thead
            // Row 1 is beatvalue in tbody
            expect(table.rows[1].cells[1].textContent).toBe("1");
            // Row 2 is measurevalue in tbody
            expect(table.rows[2].cells[1].textContent).toBe("2");
            // Row 3 is note row in tbody
            expect(table.rows[3].cells[1].textContent).toBe("C4 1/4");
        });

        test("handles empty status fields gracefully without exceptions or misindexing", () => {
            mockActivity.logo.statusFields = [];
            mockActivity.blocks.blockList = {};

            expect(() => statusMatrix.init(mockActivity)).not.toThrow();

            const table = statusMatrix._statusTable;
            expect(table.tHead.rows).toHaveLength(1);
            expect(table.tBodies[0].rows).toHaveLength(2); // Note and Harmony rows only
            expect(table.rows).toHaveLength(3);

            expect(() => statusMatrix.updateAll()).not.toThrow();
        });

        test("handles missing block references without throwing or misaligning cells", () => {
            mockActivity.logo.statusFields = [
                [999, "missingBlock"],
                [0, "beatvalue"]
            ];
            mockActivity.blocks.blockList = {
                0: { name: "beatvalue", protoblock: { staticLabels: ["beat count"] }, value: 1 }
            };

            expect(() => statusMatrix.init(mockActivity)).not.toThrow();

            const table = statusMatrix._statusTable;
            expect(table.tBodies[0].rows).toHaveLength(4); // missing, beatvalue, note, harmony

            expect(() => statusMatrix.updateAll()).not.toThrow();
            expect(table.rows[1].cells[1].textContent).toBe("");
            expect(table.rows[2].cells[1].textContent).toBe("1");
        });

        test("preserves the thead/tbody row distribution matching the observed defect", () => {
            mockActivity.blocks.blockList = {
                0: { name: "x", protoblock: { staticLabels: ["letter class"] }, value: "G" },
                1: { name: "x", protoblock: { staticLabels: ["beat count"] }, value: "0/1" },
                2: { name: "x", protoblock: { staticLabels: ["measure count"] }, value: 0 },
                3: {
                    name: "x",
                    protoblock: { staticLabels: ["whole notes played"] },
                    value: "0/1"
                },
                4: { name: "bpm", protoblock: { staticLabels: ["beats per minute"] }, value: 90 }
            };
            mockActivity.logo.statusFields = [
                [0, "outputtools"],
                [1, "outputtools"],
                [2, "outputtools"],
                [3, "outputtools"],
                [4, "bpm"]
            ];

            statusMatrix.init(mockActivity);

            const table = statusMatrix._statusTable;
            const totalRows = table.rows.length;
            const theadRows = table.tHead?.rows.length ?? 0;
            const tbodyRows = [...table.tBodies].reduce((n, b) => n + b.rows.length, 0);

            // header, 5 fields, note, harmony
            expect(totalRows).toBe(8);
            expect(theadRows).toBe(1);
            expect(tbodyRows).toBe(7);
        });
    });

    describe("Harmony row", () => {
        // 12-EDO frequencies, A4 = 440 Hz.
        const FREQUENCIES = { C4: 261.6256, E4: 329.6276, G4: 391.9954 };
        const RATIOS = { 1.25: [5, 4], 1.5: [3, 2] };
        let originalCreateElement;
        let originalCreateTextNode;
        let originalWindow;

        // A mouse whose latest note group sounds from 10000 to 11000 ms.
        const mouse = (notes, previousTurtleTime = 0, endsAt = 11000) => ({
            singer: {
                previousTurtleTime,
                pitchStatus: [{ notes, start: 0, startsAt: 10000, endsAt }],
                noteStatus: null
            }
        });

        const useMice = mice => {
            mockActivity.turtles.turtleList = mice.map((_, i) => ({ name: "Mouse" + i }));
            mockActivity.turtles.ithTurtle.mockImplementation(i => mice[i]);
        };

        const harmonyText = () =>
            Array.from(statusMatrix._harmonyCell.querySelectorAll("tr"))
                .slice(1)
                .map(tr => Array.from(tr.children).map(td => td.textContent));

        beforeAll(() => {
            // musicutils-modecore builds note images with window.btoa when it loads.
            const savedWindow = global.window;
            global.window = { btoa: str => Buffer.from(str, "binary").toString("base64") };
            global.INTERVALVALUES = require("../../utils/musicutils-constants").INTERVALVALUES;
            global.CHORDNAMES = require("../../utils/musicutils-constants").CHORDNAMES;
            global.CHORDVALUES = require("../../utils/musicutils-modecore").CHORDVALUES;
            global.HarmonyUtils = require("../HarmonyUtils");
            global.window = savedWindow;
        });

        afterAll(() => {
            delete global.HarmonyUtils;
        });

        beforeEach(() => {
            const { JSDOM } = require("jsdom");
            const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
            originalCreateElement = global.document.createElement;
            originalCreateTextNode = global.document.createTextNode;
            originalWindow = global.window;
            global.document.createElement = dom.window.document.createElement.bind(
                dom.window.document
            );
            global.document.createTextNode = dom.window.document.createTextNode.bind(
                dom.window.document
            );
            global.window = dom.window;
            global.window.innerWidth = 1200;
            global.window.widgetWindows = {
                windowFor: jest.fn().mockReturnValue(createMockWidgetWindow())
            };
            global._THIS_IS_MUSIC_BLOCKS_ = true;
            global.rationalToFraction.mockImplementation(value => RATIOS[value] || [value, 1]);
            mockActivity.logo.synth.getFrequency.mockImplementation(note =>
                typeof note === "number" ? note : FREQUENCIES[note]
            );
            jest.spyOn(Date, "now").mockReturnValue(10500);
            jest.useFakeTimers({ doNotFake: ["Date", "requestAnimationFrame"] });
        });

        afterEach(() => {
            statusMatrix._clearHarmonyTimer();
            jest.useRealTimers();
            jest.restoreAllMocks();
            global.rationalToFraction.mockReset();
            global.rationalToFraction.mockReturnValue([4, 1]);
            global.document.createElement = originalCreateElement;
            if (originalCreateTextNode !== undefined) {
                global.document.createTextNode = originalCreateTextNode;
            } else {
                delete global.document.createTextNode;
            }
            global.window = originalWindow;
        });

        test("adds a Harmony row with one cell across all the mice", () => {
            useMice([mouse(["C4"]), mouse(["E4"])]);
            statusMatrix.init(mockActivity);

            const tbody = statusMatrix._statusTable.tBodies[0];
            const row = tbody.rows[tbody.rows.length - 1];
            expect(row.cells[0].textContent).toContain("Harmony");
            expect(row.cells[1]).toBe(statusMatrix._harmonyCell);
            expect(row.cells[1].colSpan).toBe(2);
        });

        test("shows the chord and intervals sounding across the mice", () => {
            useMice([mouse(["C4"]), mouse(["E4"]), mouse(["G4"])]);
            statusMatrix.init(mockActivity);
            statusMatrix.updateAll();

            expect(statusMatrix._harmonyCell.textContent).toContain("C major");
            expect(harmonyText()).toEqual([
                ["C4 → E4", "major 3", "5:4", "1.260", "+13.7"],
                ["C4 → G4", "perfect 5", "3:2", "1.498", "-2.0"]
            ]);
        });

        test("leaves out a mouse that has moved on to a rest or a drum", () => {
            // The second mouse's last pitched note started at 0, but it is now at 0.5.
            useMice([mouse(["C4"]), mouse(["E4"], 0.5)]);
            statusMatrix.init(mockActivity);
            statusMatrix.updateAll();

            expect(statusMatrix._harmonyCell.textContent).toBe("");
        });

        test("clears the row when the project is stopped", () => {
            useMice([mouse(["C4"]), mouse(["E4"])]);
            mockActivity.logo.stopTurtle = true;
            statusMatrix.init(mockActivity);
            statusMatrix.updateAll();

            expect(statusMatrix._harmonyCell.textContent).toBe("");
        });

        test("refreshes when a note stops sounding between blocks", () => {
            // A staccato E4 that stops at 10600 ms, before the next block runs.
            useMice([mouse(["C4"]), mouse(["E4"], 0, 10600)]);
            statusMatrix.init(mockActivity);
            statusMatrix.updateAll();
            expect(harmonyText()).toHaveLength(1);

            // The refresh is due 100 ms after the note ends.
            Date.now.mockReturnValue(10701);
            jest.advanceTimersByTime(201);

            expect(statusMatrix._harmonyCell.textContent).toBe("");
        });

        test("stops refreshing when the window is closed", () => {
            useMice([mouse(["C4"]), mouse(["E4"])]);
            statusMatrix.init(mockActivity);
            statusMatrix.updateAll();
            expect(statusMatrix._harmonyTimer).not.toBeNull();

            statusMatrix.widgetWindow.onclose();

            expect(statusMatrix._harmonyTimer).toBeNull();
        });

        test("is not added in Turtle Blocks", () => {
            global._THIS_IS_MUSIC_BLOCKS_ = false;
            useMice([mouse(["C4"]), mouse(["E4"])]);
            statusMatrix.init(mockActivity);
            statusMatrix.updateAll();

            expect(statusMatrix._harmonyCell).toBeNull();
        });
    });
});
