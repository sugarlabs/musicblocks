// Copyright (c) 2026 Sugarlabs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* global describe, it, test, expect, beforeEach, jest */

const ProjectCheckerWindow = require("../project-checker");

describe("ProjectCheckerWindow", () => {
    let activity, widgetWin, body;

    beforeEach(() => {
        global._ = s => s;
        body = document.createElement("div");

        widgetWin = {
            clear: jest.fn(),
            show: jest.fn(),
            destroy: jest.fn(),
            sendToCenter: jest.fn(),
            addButton: jest.fn().mockReturnValue({ onclick: null }),
            onclose: null,
            getWidgetBody: jest.fn().mockReturnValue(body)
        };

        window.widgetWindows = {
            windowFor: jest.fn().mockReturnValue(widgetWin)
        };

        activity = {
            blocks: {
                blockList: [],
                showBlocks: jest.fn()
            },
            refreshCanvas: jest.fn()
        };
    });

    test("initializes, clears, and displays the widget window", () => {
        const checker = new ProjectCheckerWindow(activity);
        expect(window.widgetWindows.windowFor).toHaveBeenCalledWith(
            checker,
            "project-checker",
            "Check My Project"
        );
        expect(widgetWin.clear).toHaveBeenCalled();
        expect(widgetWin.show).toHaveBeenCalled();
        expect(widgetWin.sendToCenter).toHaveBeenCalled();
        expect(widgetWin.addButton).toHaveBeenCalledWith("reload.svg", 32, "Recheck Project");
    });

    test("renders All Clear state when project has 0 issues", () => {
        activity.blocks.blockList = [
            {
                name: "start",
                trash: false,
                connections: [null, null]
            }
        ];

        new ProjectCheckerWindow(activity);
        expect(body.textContent).toContain("All Clear!");
        expect(body.textContent).toContain("No issues found. Your project is ready to play.");
    });

    test("renders errors and locate button when issues are present", () => {
        const highlightMock = jest.fn();
        activity.blocks.blockList = [
            {
                name: "start",
                trash: false,
                connections: [null, 1]
            },
            {
                name: "nameddo",
                trash: false,
                privateData: "unresolvedAction",
                connections: [0, null],
                highlight: highlightMock,
                unhighlight: jest.fn()
            }
        ];

        new ProjectCheckerWindow(activity);

        expect(body.textContent).toContain('Cannot find action "unresolvedAction"');
        expect(body.textContent).toContain("1 Errors");

        // Verify Locate button
        const locateBtn = body.querySelector("button");
        expect(locateBtn).not.toBeNull();
        expect(locateBtn.textContent).toBe("Locate");

        // Click Locate button
        locateBtn.click();
        expect(highlightMock).toHaveBeenCalled();
        expect(activity.refreshCanvas).toHaveBeenCalled();
    });

    test("refresh re-runs validation and updates the view", () => {
        activity.blocks.blockList = [];
        const checker = new ProjectCheckerWindow(activity);
        expect(body.textContent).toContain("All Clear!");

        // Add an invalid block
        activity.blocks.blockList = [
            {
                name: "action",
                trash: false,
                connections: [null, null, null] // missing name
            }
        ];

        checker.refresh();
        expect(body.textContent).toContain("Action block is missing a name.");
    });

    test("closing the widget cleans up highlights and destroys window", () => {
        const unhighlightMock = jest.fn();
        activity.blocks.blockList = [
            {
                name: "start",
                trash: false,
                connections: [null, 1]
            },
            {
                name: "nameddo",
                trash: false,
                privateData: "foo",
                connections: [0, null],
                highlight: jest.fn(),
                unhighlight: unhighlightMock
            }
        ];

        const checker = new ProjectCheckerWindow(activity);
        const locateBtn = body.querySelector("button");
        locateBtn.click(); // active highlight on block 1

        expect(widgetWin.onclose).toBeDefined();
        widgetWin.onclose();

        expect(checker.isOpen).toBe(false);
        expect(unhighlightMock).toHaveBeenCalled();
        expect(widgetWin.destroy).toHaveBeenCalled();
        expect(activity.blocks.showBlocks).toHaveBeenCalled();
    });
});
