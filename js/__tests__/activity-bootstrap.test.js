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
