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
// same one activity_toolbar_integration.test.js uses), asking it to load
// the real project-manager.js instead of the shared sandbox's default
// mocked setupProjectManager.

const { loadActivityWithRealProjectManager } = require("./helpers/activity-vm-sandbox");

const loadRealActivityAndProjectManager = () => {
    const sandbox = loadActivityWithRealProjectManager({
        // Real project-manager.js's methods read these globals at call time
        // only; not needed just to load the module.
        pubsub: { off: jest.fn() },
        DATAOBJS: [{ name: "start" }],
        _THIS_IS_MUSIC_BLOCKS_: true
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
                    container: { x: 100, y: 200 },
                    connections: [null, null],
                    isValueBlock: () => false
                },
                {
                    name: "pitch",
                    trash: false,
                    value: null,
                    container: { x: 150, y: 250 },
                    // Connects back to the first block by its blockList index (0).
                    connections: [0, null],
                    isValueBlock: () => false
                }
            ]
        };
        // Seeded to the opposite of what prepareExport() sets, so the
        // assertion below proves a real mutation happened rather than
        // coincidentally matching Activity's initial value.
        activity.hasMatrixDataBlock = true;

        const parsed = JSON.parse(activity.projectManager.prepareExport());

        // Read: name, position, and the resolved connection index all came
        // from the real activity.blocks.blockList graph, not a mock's
        // static shape - ProjectManager had to walk that real array to
        // resolve block 0's exported index into this "pitch" entry's
        // connection.
        expect(parsed).toHaveLength(2);
        expect(parsed[1]).toEqual([1, "pitch", 150, 250, [0, null]]);
        // Mutate: the call went through to the same real Activity instance,
        // not a detached copy.
        expect(activity.hasMatrixDataBlock).toBe(false);
    });
});
