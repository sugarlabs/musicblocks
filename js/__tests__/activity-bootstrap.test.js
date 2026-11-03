// Copyright (c) 2026 Sugar Labs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, see <https://www.gnu.org/licenses/>.

const { loadActivitySandbox } = require("./helpers/activity-vm-sandbox");

describe("Activity bootstrap", () => {
    test.each([
        [
            "when required globals are ready",
            {
                createDefaultStack: jest.fn(),
                createjs: {},
                Tone: {},
                GIFAnimator: class {},
                SuperGif: class {}
            }
        ],
        [
            "through the Firefox readiness fallback",
            {
                jQuery: { browser: { mozilla: true } },
                waitForReadiness: callback => callback()
            }
        ]
    ])("registers context menus after domReady resolves %s", async (_path, branchOverrides) => {
        let bootstrap;
        const sandbox = loadActivitySandbox({
            overrides: {
                define: (dependencies, callback) => {
                    bootstrap = callback;
                },
                ...branchOverrides
            }
        });
        const activity = sandbox.activity;
        let resolveDomReady;
        const domReadyPromise = new Promise(resolve => {
            resolveDomReady = resolve;
        });
        activity.setupDependencies = jest.fn();
        activity.domReady = jest.fn(() => domReadyPromise);
        activity.doContextMenus = jest.fn();
        activity.doPluginsAndPaletteCols = jest.fn();

        bootstrap(document, {});

        expect(activity.setupDependencies).toHaveBeenCalledTimes(1);
        expect(activity.domReady).toHaveBeenCalledWith(document);
        expect(activity.doContextMenus).not.toHaveBeenCalled();

        resolveDomReady();
        await domReadyPromise;

        expect(activity.doContextMenus).toHaveBeenCalledTimes(1);
    });
});

describe("Activity workspace scrolling", () => {
    const makeActivity = () => {
        document.body.innerHTML = '<canvas id="myCanvas"></canvas>';
        const activity = loadActivitySandbox().activity;
        activity.blocksContainer = { x: 100, y: 100 };
        activity.stage = { on: jest.fn() };
        activity.refreshCanvas = jest.fn();
        return activity;
    };

    afterEach(() => {
        document.body.innerHTML = "";
    });

    test("wheel input scrolls vertically only when horizontal scrolling is disabled", () => {
        const activity = makeActivity();
        activity.scrollBlockContainer = false;
        activity._setupBlocksContainerEvents();

        activity._wheelHandler({
            deltaX: 4,
            deltaY: 5,
            deltaMode: 0,
            axis: 1,
            VERTICAL_AXIS: 1,
            HORIZONTAL_AXIS: 2,
            ctrlKey: false
        });

        expect(activity.blocksContainer).toEqual({ x: 100, y: 90 });
        expect(activity.refreshCanvas).toHaveBeenCalled();
    });

    test("wheel input scrolls both axes when horizontal scrolling is enabled", () => {
        const activity = makeActivity();
        activity.scrollBlockContainer = true;
        activity._setupBlocksContainerEvents();

        activity._wheelHandler({
            deltaX: 3,
            deltaY: 5,
            deltaMode: 0,
            axis: 1,
            VERTICAL_AXIS: 1,
            HORIZONTAL_AXIS: 2,
            ctrlKey: false
        });

        expect(activity.blocksContainer).toEqual({ x: 94, y: 90 });
        expect(activity.refreshCanvas).toHaveBeenCalled();
    });
});
