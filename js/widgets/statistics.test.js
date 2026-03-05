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
    let activity, widgetWin, body, capturedCb;

    beforeEach(() => {
        capturedCb = null;
        body = document.createElement("div");

        activity = {
            blocks: {
                showBlocks: jest.fn(),
                hideBlocks: jest.fn(),
                activeBlock: null
            },
            logo: { statsWindow: null },
            loading: false,
            showBlocksAfterRun: true
        };

        widgetWin = {
            clear: jest.fn(),
            show: jest.fn(),
            destroy: jest.fn(),
            sendToCenter: jest.fn(),
            onclose: null,
            onmaximize: null,
            getWidgetBody: jest.fn().mockReturnValue(body),
            getWidgetFrame: jest
                .fn()
                .mockReturnValue({ getBoundingClientRect: () => ({ height: 500 }) }),
            isMaximized: jest.fn().mockReturnValue(false)
        };

        window.widgetWindows = {
            windowFor: jest.fn().mockReturnValue(widgetWin)
        };

        global.docById = jest.fn().mockReturnValue({ getContext: jest.fn().mockReturnValue({}) });

        global.analyzeProject = jest.fn().mockReturnValue({});
        global.runAnalytics = jest.fn();
        global.scoreToChartData = jest.fn().mockReturnValue({});
        global.getChartOptions = jest.fn().mockImplementation(cb => {
            capturedCb = cb;
            return {};
        });

        global.Chart = jest.fn().mockImplementation(() => ({
            Radar: jest.fn().mockReturnValue({
                toBase64Image: jest.fn().mockReturnValue("data:image/png;base64,fakedata")
            })
        }));
    });

    test("constructor initialises widget and calls doAnalytics", () => {
        const sw = new StatsWindow(activity);

        expect(window.widgetWindows.windowFor).toHaveBeenCalledWith(sw, "stats", "stats");
        expect(widgetWin.clear).toHaveBeenCalled();
        expect(widgetWin.show).toHaveBeenCalled();
        expect(widgetWin.sendToCenter).toHaveBeenCalled();
        expect(sw.isOpen).toBe(true);
        expect(global.analyzeProject).toHaveBeenCalledWith(activity);
        expect(global.runAnalytics).toHaveBeenCalledWith(activity);
    });

    test("onclose cleans up and marks window closed", () => {
        const sw = new StatsWindow(activity);
        widgetWin.onclose();

        expect(sw.isOpen).toBe(false);
        expect(activity.blocks.showBlocks).toHaveBeenCalled();
        expect(widgetWin.destroy).toHaveBeenCalled();
        expect(activity.logo.statsWindow).toBeNull();
    });

    test("onmaximize sets flex layout when maximized", () => {
        const sw = new StatsWindow(activity);
        global.analyzeProject.mockClear();

        widgetWin.isMaximized.mockReturnValue(true);
        widgetWin.onmaximize();

        expect(body.style.display).toBe("flex");
        expect(body.style.justifyContent).toBe("space-between");
        expect(body.style.padding).toBe("0px 2vw");
        expect(global.analyzeProject).toHaveBeenCalled();
    });

    test("onmaximize resets padding when not maximized", () => {
        const sw = new StatsWindow(activity);
        widgetWin.isMaximized.mockReturnValue(false);
        widgetWin.onmaximize();

        expect(body.style.padding).toBe("0px 0px");
    });

    test("chart callback sets img width to 200 when not maximized", () => {
        widgetWin.isMaximized.mockReturnValue(false);
        const sw = new StatsWindow(activity);

        expect(capturedCb).not.toBeNull();
        capturedCb();

        const imgs = body.querySelectorAll("img");
        expect(imgs.length).toBeGreaterThanOrEqual(1);
        expect(imgs[imgs.length - 1].width).toBe(200);
        expect(activity.blocks.hideBlocks).toHaveBeenCalled();
        expect(activity.showBlocksAfterRun).toBe(false);
        expect(document.body.style.cursor).toBe("default");
    });

    test("chart callback uses frame height for img width when maximized", () => {
        widgetWin.isMaximized.mockReturnValue(true);
        const sw = new StatsWindow(activity);

        capturedCb();

        const imgs = body.querySelectorAll("img");
        expect(imgs[imgs.length - 1].width).toBe(420); // 500 - 80
    });

    test("displayInfo renders all stats fields with correct Hz", () => {
        const sw = new StatsWindow(activity);

        sw.displayInfo({
            duples: 5,
            triplets: 2,
            quintuplets: 0,
            pitchNames: new Set(["A", "C#", "E"]),
            numberOfNotes: 20,
            lowestNote: ["A4", 60, 440],
            highestNote: ["C5", 72, 523.25],
            rests: 4,
            ornaments: 1
        });

        const html = sw.jsonObject.innerHTML;
        expect(html).toContain("duples: 5");
        expect(html).toContain("triplets: 2");
        expect(html).toContain("quintuplets: 0");
        expect(html).toContain("pitch names: A, C#, E");
        expect(html).toContain("number of notes: 20");
        expect(html).toContain("lowest note: A4");
        expect(html).toContain("441Hz"); // 440 + 0.5 rounded
        expect(html).toContain("highest note: C5");
        expect(html).toContain("524Hz"); // 523.25 + 0.5 rounded
        expect(html).toContain("rests used: 4");
        expect(html).toContain("ornaments used: 1");
    });
});
