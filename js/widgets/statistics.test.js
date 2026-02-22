/**
 * MusicBlocks v3.6.2
 *
 * @author Divyam Agarwal
 *
 * @copyright 2026 Divyam Agarwal
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

const StatsWindow = require("./statistics.js");

describe("StatsWindow", () => {
    let activity, widgetWin, body, capturedCb, myChartMock, radarMock;

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

        myChartMock = { getContext: jest.fn().mockReturnValue({}) };
        global.docById = jest.fn().mockReturnValue(myChartMock);

        global.analyzeProject = jest.fn().mockReturnValue({});
        global.runAnalytics = jest.fn();
        global.scoreToChartData = jest.fn().mockReturnValue({});
        global.getChartOptions = jest.fn().mockImplementation(cb => {
            capturedCb = cb;
            return {};
        });

        radarMock = {
            toBase64Image: jest.fn().mockReturnValue("data:image/png;base64,fakedata")
        };
        global.Chart = jest.fn().mockImplementation(() => ({
            Radar: jest.fn().mockReturnValue(radarMock)
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

    test("onmaximize clears existing body content before rerender", () => {
        const sw = new StatsWindow(activity);
        const staleNode = document.createElement("p");
        staleNode.textContent = "stale";
        body.appendChild(staleNode);
        const previousJsonObject = sw.jsonObject;
        global.analyzeProject.mockClear();

        widgetWin.isMaximized.mockReturnValue(false);
        widgetWin.onmaximize();

        expect(body.textContent).not.toContain("stale");
        expect(sw.jsonObject).not.toBe(previousJsonObject);
        expect(global.analyzeProject).toHaveBeenCalledTimes(1);
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

    test("doAnalytics initializes chart with canvas context and analytics data", () => {
        const chartData = { labels: ["a"] };
        const chartOptions = { responsive: true };
        global.scoreToChartData.mockReturnValue(chartData);
        global.getChartOptions.mockImplementation(cb => {
            capturedCb = cb;
            return chartOptions;
        });

        const sw = new StatsWindow(activity);

        expect(global.docById).toHaveBeenCalledWith("myChart");
        expect(myChartMock.getContext).toHaveBeenCalledWith("2d");
        expect(global.scoreToChartData).toHaveBeenCalledWith({});
        expect(global.getChartOptions).toHaveBeenCalledWith(expect.any(Function));
        expect(global.Chart).toHaveBeenCalledWith(myChartMock.getContext.mock.results[0].value);
        expect(activity.blocks.activeBlock).toBeNull();
        expect(document.body.style.cursor).toBe("wait");
        expect(activity.loading).toBe(true);
    });

    test("doAnalytics appends json list container with left float style", () => {
        const sw = new StatsWindow(activity);

        expect(sw.jsonObject).toBeInstanceOf(HTMLUListElement);
        expect(sw.jsonObject.style.float).toBe("left");
        expect(body.lastChild).toBe(sw.jsonObject);
    });

    test("chart callback reads base64 image from radar chart", () => {
        const sw = new StatsWindow(activity);

        capturedCb();

        expect(radarMock.toBase64Image).toHaveBeenCalled();
        const imgs = body.querySelectorAll("img");
        expect(imgs[imgs.length - 1].src).toContain("data:image/png;base64,fakedata");
    });

    test("chart callback appends chart image after stats list", () => {
        const sw = new StatsWindow(activity);

        capturedCb();

        expect(body.children[0]).toBe(sw.jsonObject);
        expect(body.children[body.children.length - 1].tagName).toBe("IMG");
    });

    test("onmaximize reruns analytics and updates chart callback reference", () => {
        const sw = new StatsWindow(activity);
        const firstCb = capturedCb;
        global.getChartOptions.mockClear();

        widgetWin.onmaximize();

        expect(global.getChartOptions).toHaveBeenCalledTimes(1);
        expect(capturedCb).not.toBe(firstCb);
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
