// Copyright (c) 2026 Sugar Labs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// This test proves the wiring boundary between the real Activity and the
// real ProjectManager: activity_toolbar_integration.test.js loads a real
// Activity but keeps setupProjectManager mocked, and project-manager.test.js
// exercises a real ProjectManager against a plain fake object standing in
// for Activity. Neither proves that constructing a real Activity produces a
// real, correctly-wired ProjectManager that reads back real Activity state.
// It reuses the shared vm sandbox from helpers/activity-vm-sandbox.js (the
// same one activity_toolbar_integration.test.js uses) so this doesn't
// duplicate that dependency scaffold - the only thing overridden here is
// letting the real project-manager.js source run instead of the shared
// sandbox's default mocked setupProjectManager.

const fs = require("fs");
const path = require("path");
const { loadActivitySandbox } = require("./helpers/activity-vm-sandbox");

const PROJECT_MANAGER_CODE =
    fs.readFileSync(path.resolve(__dirname, "../project-manager.js"), "utf8") +
    "\nthis.setupProjectManager = setupProjectManager;\nthis.ProjectManager = ProjectManager;";

const loadRealActivityAndProjectManager = () => {
    const sandbox = loadActivitySandbox({
        // Real project-manager.js's methods read these globals at call time
        // only; not needed just to load the module.
        overrides: {
            pubsub: { off: jest.fn() },
            DATAOBJS: [{ name: "start" }],
            _THIS_IS_MUSIC_BLOCKS_: true
        },
        prependCode: PROJECT_MANAGER_CODE
    });
    return { activity: sandbox.activity, ProjectManager: sandbox.ProjectManager };
};

describe("Activity <-> ProjectManager integration", () => {
    let activity;
    let ProjectManager;

    beforeEach(() => {
        document.getElementById = jest.fn(() => null);
        ({ activity, ProjectManager } = loadRealActivityAndProjectManager());
    });

    afterEach(() => {
        delete window.hidePrintText;
        delete window.hideErrorText;
        document.body.className = "";
        activity = null;
        jest.clearAllMocks();
    });

    it("wires a real ProjectManager back to the real Activity during construction", () => {
        expect(activity.projectManager).toBeInstanceOf(ProjectManager);
        expect(activity.projectManager.activity).toBe(activity);
    });

    it("prepareExport() reads and mutates the real Activity instance through the real ProjectManager", () => {
        activity.blocks = {
            blockList: [
                {
                    name: "note",
                    trash: false,
                    value: null,
                    container: { x: 0, y: 0 },
                    connections: [null],
                    isValueBlock: () => false
                }
            ]
        };
        // Seeded to the opposite of what prepareExport() sets, so the
        // assertion below proves a real mutation happened rather than
        // coincidentally matching Activity's initial value.
        activity.hasMatrixDataBlock = true;

        const parsed = JSON.parse(activity.projectManager.prepareExport());

        // Read: the exported block count came from the real
        // activity.blocks.blockList, not a mock's static shape.
        expect(parsed).toHaveLength(1);
        // Mutate: the call went through to the same real Activity instance,
        // not a detached copy.
        expect(activity.hasMatrixDataBlock).toBe(false);
    });
});
