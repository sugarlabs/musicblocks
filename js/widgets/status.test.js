/**
 * MusicBlocks v3.6.2
 *
 * @author [Your Name]
 *
 * @copyright 2026 [Your Name]
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const StatusMatrix = require("./status.js");

// --- Global Mocks ---
global._ = msg => msg;
global._THIS_IS_MUSIC_BLOCKS_ = true;
global.platformColor = {
    selectorBackground: "#FFFFFF"
};
global.mixedNumber = jest.fn().mockImplementation(val => val); // Mock helper from utils
global.toFixed2 = jest.fn().mockImplementation(val => val.toFixed(2));
global.rationalToFraction = jest.fn().mockImplementation(val => [1, 2]);
global.MATRIXBUTTONHEIGHT = 40;
global.MATRIXSOLFEHEIGHT = 30;

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
        getWidgetBody: jest.fn().mockReturnValue({
            append: jest.fn()
        }),
        onmaximize: null,
        sendToCenter: jest.fn()
    })
};
global.localStorage = { languagePreference: "en" };

// Mock Document
if (typeof document === "undefined") {
    global.document = {};
}
document.createElement = jest.fn().mockImplementation(tag => {
    if (tag === "table") {
        return {
            createTHead: jest.fn().mockReturnValue({
                insertRow: jest.fn().mockReturnValue({
                    insertCell: jest.fn().mockReturnValue({
                        style: {},
                        innerHTML: "",
                        className: ""
                    })
                })
            }),
            rows: [] // Will need to populate this for updateAll tests if we want to simulate DOM updates
        };
    }
    return {
        style: {},
        innerHTML: ""
    };
});

describe("StatusMatrix", () => {
    let statusMatrix;
    let mockActivity;

    beforeEach(() => {
        // Setup a mock table structure for rows accessing
        // We need enough rows and cells to handle the updateAll loops
        const mockRow = {
            cells: [{ innerHTML: "" }, { innerHTML: "" }, { innerHTML: "" }]
        };
        const mockTable = {
            createTHead: jest.fn().mockReturnValue({
                insertRow: jest.fn().mockReturnValue({
                    insertCell: jest.fn().mockReturnValue({
                        style: {},
                        innerHTML: ""
                    })
                })
            }),
            rows: [mockRow, mockRow, mockRow, mockRow, mockRow]
        };
        document.createElement.mockReturnValueOnce(mockTable);

        mockActivity = {
            turtles: {
                turtleList: [
                    { name: "Turtle1", inTrash: false },
                    { name: "Turtle2", inTrash: false }
                ],
                ithTurtle: jest.fn().mockReturnValue({
                    singer: {
                        currentBeat: 1,
                        currentMeasure: 1,
                        noteStatus: [[440], 0.5]
                    }
                })
            },
            logo: {
                statusFields: [
                    [1, "x"],
                    [2, "namedbox"],
                    [3, "heap"]
                ],
                boxes: { myBox: 100 },
                parseArg: jest.fn(),
                blocks: { blockList: {} },
                synth: {
                    getFrequency: jest.fn().mockReturnValue(440),
                    changeInTemperament: false
                }
            },
            blocks: {
                blockList: {
                    1: { name: "x", value: 10, protoblock: { staticLabels: ["X"] } },
                    2: {
                        name: "namedbox",
                        privateData: "myBox",
                        protoblock: { staticLabels: ["Box"] }
                    },
                    3: { name: "heap", value: "stackItem", protoblock: { staticLabels: ["Heap"] } }
                }
            }
        };

        statusMatrix = new StatusMatrix();
    });

    test("should initialize correctly", () => {
        statusMatrix.init(mockActivity);
        expect(window.widgetWindows.windowFor).toHaveBeenCalled();
        expect(statusMatrix.isOpen).toBe(true);
        // Should create table
        expect(document.createElement).toHaveBeenCalledWith("table");
    });

    test("should updateAll status fields", () => {
        statusMatrix.init(mockActivity);

        // Mock dependencies for update loop
        mockActivity.logo.parseArg.mockImplementation((logo, t, id) => {
            // No-op or return mock value
        });

        statusMatrix.updateAll();

        // Verify that it tried to update rows
        // We can check if parseArg was called for each turtle * each field
        // 2 turtles * 3 fields = 6 calls
        expect(mockActivity.logo.parseArg).toHaveBeenCalledTimes(6);
    });

    test("should handle closing widget", () => {
        statusMatrix.init(mockActivity);
        const widgetWindow = window.widgetWindows.windowFor.mock.results[0].value;

        widgetWindow.onclose();

        expect(statusMatrix.isOpen).toBe(false);
        expect(widgetWindow.destroy).toHaveBeenCalled();
    });
});
