/**
 * MusicBlocks
 *
 * @author Om-A-osc
 *
 * @copyright 2026 Om-A-osc
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

const { StatsWindow } = require("./statistics.js");

describe("StatsWindow", () => {
    let statsWindow;
    let mockActivity;
    let mockWidgetWindowInstance;
    let mockGetWidgetBody;
    let mockGetWidgetFrame;
    let mockMyChart;
    let mockChartConstructor;
    let mockImageConstructor;
    let mockRadar;

    beforeEach(() => {
        jest.resetModules();

        // Mock DOM elements and global functions/objects
        const mockBody = {
            innerHTML: "",
            style: {},
            appendChild: jest.fn(),
            getBoundingClientRect: jest.fn(() => ({ height: 500 }))
        };
        mockGetWidgetBody = jest.fn(() => mockBody);
        mockGetWidgetFrame = jest.fn(() => ({
            getBoundingClientRect: jest.fn(() => ({ height: 500 }))
        }));

        mockWidgetWindowInstance = {
            clear: jest.fn(),
            show: jest.fn(),
            onclose: null,
            destroy: jest.fn(),
            onmaximize: null,
            sendToCenter: jest.fn(),
            isMaximized: jest.fn(() => false),
            getWidgetBody: mockGetWidgetBody,
            getWidgetFrame: mockGetWidgetFrame
        };

        const MockWidgetWindows = {
            windowFor: jest.fn(() => mockWidgetWindowInstance)
        };
        Object.defineProperty(window, "widgetWindows", {
            writable: true,
            value: MockWidgetWindows
        });

        mockMyChart = {
            getContext: jest.fn(() => ({})) // Return a mock context
        };
        global.docById = jest.fn(id => {
            if (id === "myChart") {
                return mockMyChart;
            }
            return document.createElement("ul");
        });

        document.createElement = jest.fn(tag => {
            if (tag === "ul") {
                return {
                    style: {},
                    innerHTML: ""
                };
            }
            return {};
        });

        global.analyzeProject = jest.fn(() => ({
            /* mock scores */
        }));
        global.runAnalytics = jest.fn();
        global.scoreToChartData = jest.fn(() => ({
            /* mock chart data */
        }));

        const mockRadarChart = {
            toBase64Image: jest.fn(() => "data:image/png;base64,mocked-image-data")
        };

        // The callback needs to be captured to be called manually.
        let onCompleteCallback;
        global.getChartOptions = jest.fn(callback => {
            onCompleteCallback = callback;
            return {
                animation: {
                    onComplete: () => onCompleteCallback(mockRadarChart)
                }
            };
        });

        mockRadar = jest.fn((data, options) => {
            if (options && options.animation && options.animation.onComplete) {
                capturedOnComplete = options.animation.onComplete;
            }
            return mockRadarChart;
        });

        mockChartConstructor = jest.fn().mockImplementation(() => ({
            Radar: mockRadar
        }));
        global.Chart = mockChartConstructor;

        mockImageConstructor = jest.fn(() => ({
            src: "",
            width: 0,
            style: {}
        }));
        global.Image = mockImageConstructor;

        // Mock document.body.style
        Object.defineProperty(document, "body", {
            writable: true,
            value: {
                style: {
                    cursor: "default"
                }
            }
        });

        // Mock activity object
        mockActivity = {
            blocks: {
                showBlocks: jest.fn(),
                hideBlocks: jest.fn(),
                activeBlock: null
            },
            logo: {
                statsWindow: null
            },
            loading: false,
            showBlocksAfterRun: false
        };

        statsWindow = new StatsWindow(mockActivity);

        // Manually trigger the Chart.js onComplete callback after the constructor has run
        if (capturedOnComplete) {
            capturedOnComplete();
        }
    });

    test("constructor initializes correctly", () => {
        expect(statsWindow).toBeDefined();
        expect(statsWindow.activity).toBe(mockActivity);
        expect(statsWindow.isOpen).toBe(true);
        expect(window.widgetWindows.windowFor).toHaveBeenCalledWith(statsWindow, "stats", "stats");
        expect(mockWidgetWindowInstance.clear).toHaveBeenCalled();
        expect(mockWidgetWindowInstance.show).toHaveBeenCalled();
        expect(mockWidgetWindowInstance.sendToCenter).toHaveBeenCalled();
        // doAnalytics is called in constructor
        expect(global.analyzeProject).toHaveBeenCalledWith(mockActivity);
    });

    test("onclose callback sets isOpen to false, shows blocks, destroys window, and nulls statsWindow", () => {
        expect(statsWindow.widgetWindow.onclose).toBeInstanceOf(Function);

        statsWindow.widgetWindow.onclose();

        expect(statsWindow.isOpen).toBe(false);
        expect(mockActivity.blocks.showBlocks).toHaveBeenCalled();
        expect(statsWindow.widgetWindow.destroy).toHaveBeenCalled();
        expect(mockActivity.logo.statsWindow).toBeNull();
    });

    test("doAnalytics calls analytics functions and updates DOM", () => {
        // Since doAnalytics is called in the constructor, we can check the effects.
        expect(mockActivity.blocks.activeBlock).toBeNull();
        expect(global.docById).toHaveBeenCalledWith("myChart");
        expect(mockMyChart.getContext).toHaveBeenCalledWith("2d");
        expect(mockActivity.loading).toBe(true);
        // The cursor is set to 'wait' and then back to 'default' in the callback.
        expect(document.body.style.cursor).toBe("default");

        expect(global.analyzeProject).toHaveBeenCalledWith(mockActivity);
        expect(global.runAnalytics).toHaveBeenCalledWith(mockActivity);
        expect(global.scoreToChartData).toHaveBeenCalledWith(expect.any(Object)); // Scores from analyzeProject
        expect(global.getChartOptions).toHaveBeenCalledWith(expect.any(Function));

        expect(global.Chart).toHaveBeenCalledWith(expect.any(Object));
        expect(mockRadar).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));

        // After the Chart callback, check Image and appendChild
        expect(mockImageConstructor).toHaveBeenCalled();
        const imgInstance = mockImageConstructor.mock.results[0].value;
        expect(imgInstance.src).toBe("data:image/png;base64,mocked-image-data");
        expect(imgInstance.width).toBe(200); // Not maximized by default
        expect(mockGetWidgetBody().appendChild).toHaveBeenCalledWith(imgInstance);

        expect(mockActivity.blocks.hideBlocks).toHaveBeenCalled();
        expect(mockActivity.showBlocksAfterRun).toBe(false);
        expect(document.body.style.cursor).toBe("default");

        expect(statsWindow.jsonObject).toBeDefined();
        expect(statsWindow.jsonObject.style.float).toBe("left");
        expect(mockGetWidgetBody().appendChild).toHaveBeenCalledWith(statsWindow.jsonObject);
    });

    test("doAnalytics adjusts image width when maximized", () => {
        // This test is now self-contained
        jest.clearAllMocks(); // Clear all mocks to avoid interference from beforeEach

        // Redefine mocks needed for this specific test
        let capturedOnComplete;
        const mockRadarChart = { toBase64Image: () => "data:image/png;base64,mocked-image-data" };
        mockChartConstructor = jest.fn().mockImplementation(() => ({
            Radar: jest.fn((data, options) => {
                if (options && options.animation && options.animation.onComplete) {
                    capturedOnComplete = options.animation.onComplete;
                }
                return mockRadarChart;
            })
        }));
        global.Chart = mockChartConstructor;
        global.Image = jest.fn(() => ({ src: "", width: 0, style: {} }));
        global.docById = jest.fn(() => ({ getContext: () => ({}) }));

        mockWidgetWindowInstance.isMaximized.mockReturnValue(true); // Simulate maximized state

        statsWindow.doAnalytics();

        // Manually fire the callback that was captured inside this specific doAnalytics call
        if (capturedOnComplete) {
            capturedOnComplete();
        }

        const imgInstance = global.Image.mock.results[0].value;
        expect(mockGetWidgetFrame).toHaveBeenCalled();
        expect(imgInstance.width).toBe(500 - 80); // 420
    });

    test("displayInfo correctly updates jsonObject innerHTML", () => {
        const mockStats = {
            duples: 10,
            triplets: 5,
            quintuplets: 2,
            pitchNames: new Set(["C4", "D4", "E4"]),
            numberOfNotes: 100,
            lowestNote: ["C4", 60, 261.63], // Note name, MIDI, Hertz
            highestNote: ["G5", 79, 783.99],
            rests: true,
            ornaments: false
        };

        statsWindow.jsonObject = document.createElement("ul"); // Re-initialize as it's created in doAnalytics

        statsWindow.displayInfo(mockStats);

        const expectedHtml = `<li>duples: 10</li>
            <li>triplets: 5</li>
            <li>quintuplets: 2</li>
            <li style=\"white-space: pre-wrap; width: 150px\">pitch names: C4, D4, E4</li>
            <li>number of notes: 100</li>
            <li style=\"white-space: pre-wrap; width: 150px\">lowest note: C4,262Hz</li>
            <li style=\"white-space: pre-wrap; width: 150px\">highest note: G5,784Hz</li>
            <li>rests used: true</li>
            <li>ornaments used: false</li>`;

        expect(statsWindow.jsonObject.innerHTML).toBe(expectedHtml);
    });

    test("onmaximize callback handles maximized and unmaximized states", () => {
        let capturedOnComplete;
        global.getChartOptions = jest.fn(callback => {
            capturedOnComplete = callback;
            return {
                animation: { onComplete: callback }
            };
        });

        expect(statsWindow.widgetWindow.onmaximize).toBeInstanceOf(Function);
        const widgetBody = statsWindow.widgetWindow.getWidgetBody();

        // Test maximized state
        mockWidgetWindowInstance.isMaximized.mockReturnValue(true);
        statsWindow.widgetWindow.onmaximize();
        if (capturedOnComplete) capturedOnComplete();

        expect(widgetBody.innerHTML).toBe("");
        expect(widgetBody.style.display).toBe("flex");
        expect(widgetBody.style.justifyContent).toBe("space-between");
        expect(widgetBody.style.padding).toBe("0 2vw");

        // Test unmaximized state
        mockWidgetWindowInstance.isMaximized.mockReturnValue(false);
        statsWindow.widgetWindow.onmaximize();
        if (capturedOnComplete) capturedOnComplete();

        expect(widgetBody.innerHTML).toBe(""); // Cleared again
        expect(widgetBody.style.padding).toBe("0 0");
    });
});
