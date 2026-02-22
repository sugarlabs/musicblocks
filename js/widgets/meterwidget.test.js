/**
 * MusicBlocks v3.6.2
 *
 * @author Ashutosh Kumar
 *
 * @copyright 2026 Ashutosh Kumar
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
 */

const MeterWidget = require("./meterwidget.js");

// --- 1. Global Mocks (Fake the Browser Environment) ---
global._ = msg => msg; // Mock translation function
global.platformColor = {
    selectorBackground: "#FFFFFF",
    selectorBackgroundHOVER: "#EEEEEE",
    modeWheelcolors: ["#FF0000", "#00FF00"],
    orange: "#FFA500"
};
global.PREVIEWVOLUME = 0.5;
global.TONEBPM = 60;
global.last = arr => arr[arr.length - 1];

// Mock docById
global.docById = jest.fn().mockImplementation(id => {
    return {
        style: {},
        innerHTML: "",
        appendChild: jest.fn()
    };
});

// Mock Singer
global.Singer = {
    setSynthVolume: jest.fn(),
    defaultBPMFactor: 60,
    masterBPM: 60
};

// Mock slicePath (Wheelnav dependency)
global.slicePath = jest.fn().mockReturnValue({
    DonutSlice: jest.fn(),
    DonutSliceCustomization: jest.fn().mockReturnValue({})
});

// Mock wheelnav
global.wheelnav = jest.fn().mockImplementation(() => ({
    raphael: {},
    colors: [],
    slicePathFunction: null,
    slicePathCustom: {},
    sliceSelectedPathCustom: {},
    sliceInitPathCustom: {},
    navItems: [],
    createWheel: jest.fn().mockImplementation(function (labels) {
        this.navItems = labels.map(() => ({
            navItem: {
                hide: jest.fn(),
                show: jest.fn()
            },
            navigateFunction: null
        }));
    })
}));
global.wheelnav.cssMeter = false;

// Mock the Window Manager
if (typeof window === "undefined") {
    global.window = {};
}
window.innerWidth = 1024;
window.widgetWindows = {
    windowFor: jest.fn().mockReturnValue({
        clear: jest.fn(),
        show: jest.fn(),
        destroy: jest.fn(),
        addButton: jest.fn().mockImplementation(() => ({
            onclick: () => {}
        })),
        addInputButton: jest.fn().mockReturnValue({ value: 0, addEventListener: jest.fn() }), // Add this as it might be used
        getWidgetBody: jest.fn().mockReturnValue({
            append: jest.fn(),
            appendChild: jest.fn(), // Tempo uses appendChild
            getElementsByTagName: jest.fn().mockReturnValue([
                {
                    style: {},
                    setAttribute: jest.fn()
                }
            ]),
            insertRow: jest.fn().mockReturnValue({
                insertCell: jest.fn().mockReturnValue({
                    appendChild: jest.fn(),
                    setAttribute: jest.fn()
                })
            })
        }),
        getWidgetFrame: jest.fn().mockReturnValue({
            offsetHeight: 500
        }),
        getDragElement: jest.fn().mockReturnValue({
            offsetHeight: 20
        }),
        isMaximized: jest.fn().mockReturnValue(false),
        sendToCenter: jest.fn(),
        _toolbar: {
            appendChild: jest.fn()
        }
    })
};

// Mock Document
if (typeof document === "undefined") {
    global.document = {};
}

// If document.createElement exists (JSDOM), spy on it. If not, create it.
if (document.createElement) {
    jest.spyOn(document, "createElement").mockImplementation(tag => {
        return {
            style: {},
            innerHTML: "",
            children: [],
            className: "",
            append: jest.fn(),
            appendChild: jest.fn(),
            getContext: jest.fn().mockReturnValue({
                // For canvas if needed
                clearRect: jest.fn(),
                beginPath: jest.fn(),
                fillStyle: "",
                ellipse: jest.fn(),
                fill: jest.fn(),
                closePath: jest.fn()
            }),
            insertRow: jest.fn(), // For table
            value: "" // For input
        };
    });
} else {
    document.createElement = jest.fn().mockImplementation(tag => {
        return {
            style: {},
            innerHTML: "",
            children: [],
            className: "",
            append: jest.fn(),
            appendChild: jest.fn(),
            getContext: jest.fn().mockReturnValue({
                clearRect: jest.fn(),
                beginPath: jest.fn(),
                fillStyle: "",
                ellipse: jest.fn(),
                fill: jest.fn(),
                closePath: jest.fn()
            }),
            insertRow: jest.fn(),
            value: ""
        };
    });
}

describe("Meter Widget", () => {
    let meterWidget;
    let mockActivity;
    let mockBlockList;

    beforeEach(() => {
        // Mock Blocks
        mockBlockList = {
            1: {
                connections: [null, 2, 3], // meter block connections
                value: "meter"
            },
            2: {
                value: 4, // 4 beats
                text: { text: "4" },
                container: { children: [], setChildIndex: jest.fn() }
            },
            3: {
                connections: [null, null, 4],
                value: "beatValue"
            },
            4: {
                value: 0.25, // quarter note
                text: { text: "0.25" },
                container: { children: [], setChildIndex: jest.fn() }
            }
        };

        // Mock Activity
        mockActivity = {
            logo: {
                _meterBlock: 1,
                resetSynth: jest.fn(),
                synth: {
                    setMasterVolume: jest.fn(),
                    loadSynth: jest.fn(),
                    trigger: jest.fn(),
                    runLogoCommands: jest.fn()
                },
                turtleDelay: 100
            },
            turtles: {
                ithTurtle: jest.fn().mockReturnValue({
                    singer: { bpm: [60] }
                })
            },
            blocks: {
                blockList: mockBlockList,
                loadNewBlocks: jest.fn()
            },
            textMsg: jest.fn(),
            hideMsgs: jest.fn()
        };

        // Initialize Widget
        meterWidget = new MeterWidget(mockActivity, 1);
    });

    test("should initialize correctly", () => {
        expect(mockActivity.logo.synth.setMasterVolume).toHaveBeenCalledWith(global.PREVIEWVOLUME);
        expect(mockActivity.logo.synth.loadSynth).toHaveBeenCalledWith(0, "kick drum");
        expect(mockActivity.logo.synth.loadSynth).toHaveBeenCalledWith(0, "snare drum");
        expect(global.wheelnav).toHaveBeenCalledTimes(3); // meterWheel, beatWheel, playWheel
    });

    test("should handle play button toggle", () => {
        jest.useFakeTimers();

        // Find the play button (first button added)
        // Access mock calls for addButton
        const widgetWindow = window.widgetWindows.windowFor();
        const addButtonCalls = widgetWindow.addButton.mock.calls;

        // Assuming first call is play button based on code reading
        const playButtonLabel = addButtonCalls[0][2];
        expect(playButtonLabel).toBe("Play"); // Basic validation

        const playBtnMock = widgetWindow.addButton.mock.results[0].value;

        // Initial state
        expect(meterWidget._playing).toBe(false);

        // Click Play
        playBtnMock.onclick();
        expect(meterWidget._playing).toBe(true);
        expect(mockActivity.logo.resetSynth).toHaveBeenCalled();

        // Fast-forward time to unlock click
        jest.advanceTimersByTime(1100);

        // Click Stop
        playBtnMock.onclick();
        expect(meterWidget._playing).toBe(false);

        jest.useRealTimers();
    });

    test("should play beat correctly (synthesizer trigger)", () => {
        // Setup strong beats
        meterWidget._strongBeats = [true, false, true, false]; // 4/4 time

        // Trigger play one beat directly or via _playBeat
        meterWidget._playing = true;
        meterWidget.__playOneBeat(0, 500);

        // Expect snare for strong beat
        expect(mockActivity.logo.synth.trigger).toHaveBeenCalledWith(
            0,
            "C4",
            expect.anything(),
            "snare drum",
            null,
            null
        );

        // Clear mock and test weak beat (index 1)
        mockActivity.logo.synth.trigger.mockClear();
        meterWidget.__playOneBeat(1, 500);

        // Expect kick for weak beat
        expect(mockActivity.logo.synth.trigger).toHaveBeenCalledWith(
            0,
            "C4",
            expect.anything(),
            "kick drum",
            null,
            null
        );
    });

    test("should save configuration to blocks", () => {
        // Setup strong beats
        meterWidget._strongBeats = [true, false];

        meterWidget._save();

        expect(mockActivity.blocks.loadNewBlocks).toHaveBeenCalled();
        const savedBlocks = mockActivity.blocks.loadNewBlocks.mock.calls[0][0];

        // Verify structure of saved blocks
        // Should produce onbeatdo blocks
        expect(savedBlocks.some(b => b[1] === "onbeatdo")).toBe(true);
        // Should have numbers for the beats (1-based index)
        expect(
            savedBlocks.some(
                b => Array.isArray(b[1]) && b[1][0] === "number" && b[1][1].value === 1
            )
        ).toBe(true);
    });

    test("should setup default strong beats for 4/4", () => {
        meterWidget._setupDefaultStrongWeakBeats(4, 0.25);
        expect(meterWidget._strongBeats[0]).toBe(true);
        expect(meterWidget._strongBeats[1]).toBe(false);
        expect(meterWidget._strongBeats[2]).toBe(true);
        expect(meterWidget._strongBeats[3]).toBe(false);
    });

    test("should setup default strong beats for 3/4", () => {
        meterWidget._setupDefaultStrongWeakBeats(3, 0.25);
        expect(meterWidget._strongBeats[0]).toBe(true);
        expect(meterWidget._strongBeats[1]).toBe(false);
        expect(meterWidget._strongBeats[2]).toBe(false);
    });
});
