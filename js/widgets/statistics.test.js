/**
 * MusicBlocks v3.6.2
 *
 * @author Divyam Agarwal
 *
 * @copyright 2026 Divyam Agarwal
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

const StatsWindow = require("./statistics.js");

describe("StatsWindow", () => {
    let mockActivity;
    let mockWidgetWindow;

    beforeEach(() => {
        // 1. Mock the Activity object
        mockActivity = {
            blocks: { showBlocks: jest.fn(), hideBlocks: jest.fn(), activeBlock: null },
            logo: { statsWindow: null },
            loading: false,
            showBlocksAfterRun: true
        };

        // 2. Mock the Widget Window
        mockWidgetWindow = {
            clear: jest.fn(),
            show: jest.fn(),
            destroy: jest.fn(),
            sendToCenter: jest.fn(),
            onclose: null,
            onmaximize: null,
            getWidgetBody: jest.fn().mockReturnValue(document.createElement("div")),
            getWidgetFrame: jest
                .fn()
                .mockReturnValue({ getBoundingClientRect: () => ({ height: 500 }) }),
            isMaximized: jest.fn().mockReturnValue(false)
        };

        // 3. Mock window.widgetWindows
        window.widgetWindows = {
            windowFor: jest.fn().mockReturnValue(mockWidgetWindow)
        };

        // 4. CRITICAL FIX: Mock docById to return a fake Canvas with getContext
        global.docById = jest.fn().mockReturnValue({
            getContext: jest.fn().mockReturnValue({
                // Fake context methods if needed (not strictly needed for this test)
            })
        });

        // 5. Mock external analysis functions (global scope)
        global.analyzeProject = jest.fn().mockReturnValue({});
        global.runAnalytics = jest.fn();
        global.scoreToChartData = jest.fn().mockReturnValue({});
        global.getChartOptions = jest.fn().mockReturnValue({});

        // Mock the Chart.js library
        global.Chart = jest.fn().mockImplementation(() => ({
            Radar: jest.fn()
        }));
    });

    test("displayInfo should correctly format note statistics and Hz calculations", () => {
        const statsWindow = new StatsWindow(mockActivity);

        // Prepare dummy data
        const mockStats = {
            duples: 5,
            triplets: 2,
            quintuplets: 0,
            pitchNames: new Set(["A", "C#", "E"]),
            numberOfNotes: 20,
            lowestNote: ["A4", 60, 440],
            highestNote: ["C5", 72, 523.25],
            rests: 4,
            ornaments: 1
        };

        // Run the function
        statsWindow.displayInfo(mockStats);

        // Check results
        const outputHtml = statsWindow.jsonObject.innerHTML;

        expect(outputHtml).toContain("441Hz"); // 440 + 0.5 rounded
        expect(outputHtml).toContain("524Hz"); // 523.25 + 0.5 rounded
        expect(outputHtml).toContain("duples: 5");
        expect(outputHtml).toContain("triplets: 2");
        expect(outputHtml).toContain("pitch names: A, C#, E");
    });
});
