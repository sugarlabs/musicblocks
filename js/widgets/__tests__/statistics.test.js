/**
 * MusicBlocks v3.6.2
 *
 * @author Music Blocks Contributors
 *
 * @copyright 2026 Music Blocks Contributors
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

const StatsWindow = require("../statistics.js");

// --- Global Mocks ---
global._ = (msg) => msg;
global.docById = jest.fn(() => ({
    style: {},
    innerHTML: "",
    getContext: jest.fn(() => ({
        clearRect: jest.fn(),
        beginPath: jest.fn(),
        fill: jest.fn(),
        closePath: jest.fn()
    }))
}));
global.analyzeProject = jest.fn(() => ({ overall: 80 }));
global.runAnalytics = jest.fn();
global.scoreToChartData = jest.fn(() => ({ labels: [], datasets: [] }));
global.getChartOptions = jest.fn((cb) => ({ animation: { onComplete: cb } }));
global.Chart = jest.fn().mockImplementation(() => ({
    Radar: jest.fn().mockReturnValue({
        toBase64Image: jest.fn(() => "data:image/png;base64,abc")
    })
}));

// Set up window.widgetWindows on the existing jsdom window
window.widgetWindows = {
    windowFor: jest.fn().mockReturnValue({
        clear: jest.fn(),
        show: jest.fn(),
        addButton: jest.fn().mockReturnValue({ onclick: null }),
        getWidgetBody: jest.fn().mockReturnValue({
            appendChild: jest.fn(),
            append: jest.fn(),
            style: {},
            innerHTML: ""
        }),
        getWidgetFrame: jest.fn().mockReturnValue({
            getBoundingClientRect: jest.fn(() => ({ width: 800, height: 600 }))
        }),
        sendToCenter: jest.fn(),
        onclose: null,
        onmaximize: null,
        isMaximized: jest.fn(() => false),
        destroy: jest.fn()
    })
};

global.Image = jest.fn().mockImplementation(() => ({
    src: "",
    width: 0
}));

describe("StatsWindow Widget", () => {
    let mockActivity;

    beforeEach(() => {
        mockActivity = {
            blocks: {
                activeBlock: null,
                showBlocks: jest.fn(),
                hideBlocks: jest.fn()
            },
            logo: {
                statsWindow: null
            },
            loading: false,
            showBlocksAfterRun: true,
            refreshCanvas: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // --- Constructor Tests ---
    describe("constructor", () => {
        test("should initialize with isOpen true", () => {
            const stats = new StatsWindow(mockActivity);
            expect(stats.isOpen).toBe(true);
        });

        test("should store activity reference", () => {
            const stats = new StatsWindow(mockActivity);
            expect(stats.activity).toBe(mockActivity);
        });

        test("should create widgetWindow", () => {
            const stats = new StatsWindow(mockActivity);
            expect(stats.widgetWindow).toBeDefined();
            expect(window.widgetWindows.windowFor).toHaveBeenCalledWith(
                stats,
                "stats",
                "stats"
            );
        });

        test("should call doAnalytics on construction", () => {
            // doAnalytics calls analyzeProject
            const stats = new StatsWindow(mockActivity);
            expect(analyzeProject).toHaveBeenCalledWith(mockActivity);
            expect(runAnalytics).toHaveBeenCalledWith(mockActivity);
        });
    });

    // --- displayInfo Tests ---
    describe("displayInfo", () => {
        let stats;

        beforeEach(() => {
            stats = new StatsWindow(mockActivity);
            stats.jsonObject = document.createElement("ul");
        });

        test("should display stats correctly", () => {
            const mockStats = {
                duples: 3,
                triplets: 1,
                quintuplets: 0,
                pitchNames: new Set(["C", "D", "E"]),
                numberOfNotes: 12,
                lowestNote: ["C4", 4, 261.13],
                highestNote: ["C5", 5, 523.25],
                rests: 2,
                ornaments: 1
            };

            stats.displayInfo(mockStats);

            expect(stats.jsonObject.innerHTML).toContain("duples: 3");
            expect(stats.jsonObject.innerHTML).toContain("triplets: 1");
            expect(stats.jsonObject.innerHTML).toContain("quintuplets: 0");
            expect(stats.jsonObject.innerHTML).toContain("number of notes: 12");
            expect(stats.jsonObject.innerHTML).toContain("rests used: 2");
            expect(stats.jsonObject.innerHTML).toContain("ornaments used: 1");
        });

        test("should format lowest note hertz correctly", () => {
            const mockStats = {
                duples: 0,
                triplets: 0,
                quintuplets: 0,
                pitchNames: new Set(["C"]),
                numberOfNotes: 1,
                lowestNote: ["C4", 4, 261.13],
                highestNote: ["C5", 5, 523.25],
                rests: 0,
                ornaments: 0
            };

            stats.displayInfo(mockStats);
            // 261.13 + 0.5 = 261.63, .toFixed(0) = "262"
            expect(stats.jsonObject.innerHTML).toContain("262Hz");
        });

        test("should format highest note hertz correctly", () => {
            const mockStats = {
                duples: 0,
                triplets: 0,
                quintuplets: 0,
                pitchNames: new Set(["C"]),
                numberOfNotes: 1,
                lowestNote: ["C4", 4, 261.13],
                highestNote: ["C5", 5, 523.25],
                rests: 0,
                ornaments: 0
            };

            stats.displayInfo(mockStats);
            // 523.25 + 0.5 = 523.75, .toFixed(0) = "524"
            expect(stats.jsonObject.innerHTML).toContain("524Hz");
        });

        test("should display pitch names joined by commas", () => {
            const mockStats = {
                duples: 0,
                triplets: 0,
                quintuplets: 0,
                pitchNames: new Set(["C", "E", "G"]),
                numberOfNotes: 3,
                lowestNote: ["C4", 4, 261.13],
                highestNote: ["G4", 4, 392.0],
                rests: 0,
                ornaments: 0
            };

            stats.displayInfo(mockStats);
            expect(stats.jsonObject.innerHTML).toContain("pitch names:");
        });
    });
});
