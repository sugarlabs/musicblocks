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

"use strict";

if (typeof global._ !== "function") {
    global._ = s => s;
}

const { setupTrashController, TrashController } = require("../trash-controller.js");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBlock({ name = "note", trash = true, connections = [] } = {}) {
    return {
        name,
        trash,
        value: null,
        connections,
        width: 40,
        height: 40,
        artwork: "<svg></svg>",
        container: { cache: jest.fn(), bitmapCache: null },
        regenerateArtwork: jest.fn(),
        isCollapsible: jest.fn(() => false),
        show: jest.fn()
    };
}

/**
 * Builds a minimal activity mock with a real blockList/dragGroup wiring so
 * restoreTrashById exercises the same code paths as production.
 */
function makeActivity() {
    const blockList = {};

    const activity = {
        blocks: {
            trashStacks: [],
            trashPreviews: {},
            blockArt: {},
            blockList,
            dragGroup: [],
            activeBlock: "something",
            findDragGroup: jest.fn(blockId => {
                activity.blocks.dragGroup = [blockId];
            }),
            moveBlockRelative: jest.fn(),
            raiseStackToTop: jest.fn(),
            findUniqueActionName: jest.fn(name => name),
            newNameddoBlock: jest.fn(),
            actionHasReturn: jest.fn(() => false),
            actionHasArgs: jest.fn(() => false)
        },
        palettes: {
            dict: {
                foo: { hideMenu: jest.fn() }
            },
            updatePalettes: jest.fn()
        },
        turtles: {
            getTurtle: jest.fn()
        },
        refreshCanvas: jest.fn(),
        textMsg: jest.fn(),
        cellSize: 10,
        __tick: jest.fn()
    };

    return activity;
}

beforeEach(() => {
    document.body.innerHTML =
        '<div id="restoreIcon"></div>' +
        '<div id="helpfulWheelDiv" style="display:none;"></div>' +
        '<div id="trashList"></div>';
});

// ---------------------------------------------------------------------------
// restoreTrash() — toolbar restore-icon handler
// ---------------------------------------------------------------------------

describe("TrashController.restoreTrash", () => {
    test("shows an empty-trash message when there is nothing to restore", () => {
        const activity = makeActivity();
        const controller = new TrashController(activity);

        controller.restoreTrash();

        expect(activity.textMsg).toHaveBeenCalledWith("Trash can is empty.", 3000);
    });

    test("hides the helpful wheel when the trash is non-empty and the wheel is visible", () => {
        const activity = makeActivity();
        activity.blocks.trashStacks = ["blk1"];
        document.getElementById("helpfulWheelDiv").style.display = "block";
        const controller = new TrashController(activity);

        controller.restoreTrash();

        expect(document.getElementById("helpfulWheelDiv").style.display).toBe("none");
        expect(activity.__tick).toHaveBeenCalled();
    });

    test("does not throw when helpfulWheelDiv is not present in the DOM", () => {
        const activity = makeActivity();
        activity.blocks.trashStacks = ["blk1"];
        document.getElementById("helpfulWheelDiv").remove();
        const controller = new TrashController(activity);

        expect(() => controller.restoreTrash()).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// restoreLastFromTrash() — restores the most recently trashed block
// ---------------------------------------------------------------------------

describe("TrashController.restoreLastFromTrash", () => {
    test("shows an empty-trash message when there is nothing to restore", () => {
        const activity = makeActivity();
        const controller = new TrashController(activity);

        controller.restoreLastFromTrash();

        expect(activity.textMsg).toHaveBeenCalledWith("Trash can is empty.", 3000);
    });

    test("restores the last block pushed to the trash stack", () => {
        const activity = makeActivity();
        activity.blocks.blockList.blk1 = makeBlock();
        activity.blocks.blockList.blk2 = makeBlock();
        activity.blocks.trashStacks = ["blk1", "blk2"];
        const controller = new TrashController(activity);
        const spy = jest.spyOn(controller, "restoreTrashById");

        controller.restoreLastFromTrash();

        expect(spy).toHaveBeenCalledWith("blk2");
        expect(activity.textMsg).toHaveBeenCalledWith("Item restored from the trash.", 3000);
    });

    test("does not throw when helpfulWheelDiv is not present in the DOM", () => {
        const activity = makeActivity();
        activity.blocks.blockList.blk1 = makeBlock();
        activity.blocks.trashStacks = ["blk1"];
        document.getElementById("helpfulWheelDiv").remove();
        const controller = new TrashController(activity);

        expect(() => controller.restoreLastFromTrash()).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// restoreTrashById() — restores a specific block by id
// ---------------------------------------------------------------------------

describe("TrashController.restoreTrashById", () => {
    test("does nothing when the block id is not in the trash", () => {
        const activity = makeActivity();
        const controller = new TrashController(activity);

        controller.restoreTrashById("missing");

        expect(activity.refreshCanvas).not.toHaveBeenCalled();
    });

    test("removes the block from trashStacks, repositions it, and shows it", () => {
        const activity = makeActivity();
        const block = makeBlock({ name: "note" });
        activity.blocks.blockList.blk1 = block;
        activity.blocks.trashStacks = ["blk1"];
        const controller = new TrashController(activity);

        controller.restoreTrashById("blk1");

        expect(activity.blocks.trashStacks).not.toContain("blk1");
        expect(block.trash).toBe(false);
        expect(activity.blocks.moveBlockRelative).toHaveBeenCalledWith("blk1", 0, -30);
        expect(block.show).toHaveBeenCalled();
        expect(activity.blocks.raiseStackToTop).toHaveBeenCalledWith("blk1");
        expect(activity.refreshCanvas).toHaveBeenCalled();
    });

    test("regenerates artwork and re-caches the container when they were freed by trashing", () => {
        const activity = makeActivity();
        const block = makeBlock();
        block.container.bitmapCache = null;
        activity.blocks.blockList.blk1 = block;
        activity.blocks.trashStacks = ["blk1"];
        activity.blocks.blockArt.blk1 = undefined;
        const controller = new TrashController(activity);

        controller.restoreTrashById("blk1");

        expect(block.regenerateArtwork).toHaveBeenCalledWith(false);
        expect(block.container.cache).toHaveBeenCalledWith(0, 0, 40, 40);
    });

    test("restores the primary and companion turtle for a trashed start block", () => {
        const activity = makeActivity();
        const block = makeBlock({ name: "start" });
        block.value = "turtle1";
        activity.blocks.blockList.blk1 = block;
        activity.blocks.trashStacks = ["blk1"];

        const companionTurtle = { inTrash: true, container: { visible: false } };
        const primaryTurtle = {
            inTrash: true,
            container: { visible: false },
            companionTurtle: "turtle2"
        };
        activity.turtles.getTurtle.mockImplementation(id => {
            if (id === "turtle1") return primaryTurtle;
            if (id === "turtle2") return companionTurtle;
            return undefined;
        });

        const controller = new TrashController(activity);
        controller.restoreTrashById("blk1");

        expect(primaryTurtle.inTrash).toBe(false);
        expect(primaryTurtle.container.visible).toBe(true);
        expect(companionTurtle.inTrash).toBe(false);
        expect(companionTurtle.container.visible).toBe(true);
    });

    test("restores a trashed start block with no companion turtle without throwing", () => {
        const activity = makeActivity();
        const block = makeBlock({ name: "start" });
        block.value = "turtle1";
        activity.blocks.blockList.blk1 = block;
        activity.blocks.trashStacks = ["blk1"];

        const primaryTurtle = {
            inTrash: true,
            container: { visible: false },
            companionTurtle: null
        };
        activity.turtles.getTurtle.mockImplementation(() => primaryTurtle);

        const controller = new TrashController(activity);

        expect(() => controller.restoreTrashById("blk1")).not.toThrow();
        expect(primaryTurtle.inTrash).toBe(false);
    });

    test("re-registers a trashed action block under a unique name", () => {
        const activity = makeActivity();
        const actionArg = {
            value: "action1",
            text: { text: "" },
            label: null,
            container: { updateCache: jest.fn() }
        };
        activity.blocks.blockList.actionArgId = actionArg;
        const block = makeBlock({ name: "action", connections: [null, "actionArgId"] });
        activity.blocks.blockList.blk1 = block;
        activity.blocks.trashStacks = ["blk1"];
        activity.blocks.findUniqueActionName.mockReturnValue("action2");

        const controller = new TrashController(activity);
        controller.restoreTrashById("blk1");

        expect(activity.blocks.findUniqueActionName).toHaveBeenCalledWith("action1");
        expect(actionArg.value).toBe("action2");
        expect(activity.blocks.newNameddoBlock).toHaveBeenCalledWith("action2", false, false);
        expect(activity.palettes.updatePalettes).toHaveBeenCalledWith("action");
    });
});

// ---------------------------------------------------------------------------
// renderTrashView() — renders the trash panel
// ---------------------------------------------------------------------------

describe("TrashController.renderTrashView", () => {
    test("does nothing when the trash is empty", () => {
        const activity = makeActivity();
        const controller = new TrashController(activity);

        controller.renderTrashView();

        expect(document.getElementById("trashView")).toBeNull();
    });

    test("renders one .trash-item per trashed block plus the restore controls", () => {
        const activity = makeActivity();
        activity.blocks.blockList.blk1 = makeBlock({ name: "note" });
        activity.blocks.blockList.blk2 = makeBlock({ name: "pitch" });
        activity.blocks.trashStacks = ["blk1", "blk2"];
        const controller = new TrashController(activity);

        controller.renderTrashView();

        const trashView = document.getElementById("trashView");
        expect(trashView).not.toBeNull();
        expect(trashView.querySelectorAll(".trash-item").length).toBe(2);
        expect(document.getElementById("restoreLastIcon")).not.toBeNull();
        expect(document.getElementById("restoreAllIcon")).not.toBeNull();
    });

    test("replaces an existing trashView rather than appending a duplicate", () => {
        const activity = makeActivity();
        activity.blocks.blockList.blk1 = makeBlock();
        activity.blocks.trashStacks = ["blk1"];
        const controller = new TrashController(activity);

        controller.renderTrashView();
        controller.renderTrashView();

        expect(document.querySelectorAll("#trashView").length).toBe(1);
    });

    test("clicking a trash item restores that block", () => {
        const activity = makeActivity();
        activity.blocks.blockList.blk1 = makeBlock();
        activity.blocks.trashStacks = ["blk1"];
        const controller = new TrashController(activity);
        const spy = jest.spyOn(controller, "restoreTrashById");

        controller.renderTrashView();
        document.querySelector(".trash-item").dispatchEvent(new window.MouseEvent("click"));

        expect(spy).toHaveBeenCalledWith("blk1");
    });

    test("restoreAllIcon restores every trashed block", () => {
        const activity = makeActivity();
        activity.blocks.blockList.blk1 = makeBlock();
        activity.blocks.blockList.blk2 = makeBlock();
        activity.blocks.trashStacks = ["blk1", "blk2"];
        const controller = new TrashController(activity);

        controller.renderTrashView();
        document.getElementById("restoreAllIcon").dispatchEvent(new window.MouseEvent("click"));

        expect(activity.blocks.trashStacks.length).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// Click-outside-to-close behavior
// ---------------------------------------------------------------------------

describe("TrashController click-outside handling", () => {
    test("a second click outside the trash view hides it", () => {
        const activity = makeActivity();
        activity.blocks.blockList.blk1 = makeBlock();
        activity.blocks.trashStacks = ["blk1"];
        const controller = new TrashController(activity);

        controller.renderTrashView();
        const trashView = document.getElementById("trashView");

        // First document click after opening is ignored (the click that opened it).
        document.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
        expect(trashView.style.display).not.toBe("none");

        // A subsequent click outside the trash view closes it.
        document.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
        expect(trashView.style.display).toBe("none");
    });
});

// ---------------------------------------------------------------------------
// setupTrashController() — wiring onto the activity object
// ---------------------------------------------------------------------------

describe("TrashController construction", () => {
    test("does not throw when the restoreIcon element is not present in the DOM", () => {
        document.body.innerHTML = "";
        const activity = makeActivity();

        expect(() => new TrashController(activity)).not.toThrow();
    });
});

describe("setupTrashController", () => {
    test("installs a trashController plus delegation stubs on the activity", () => {
        const activity = makeActivity();

        const controller = setupTrashController(activity);

        expect(activity.trashController).toBe(controller);
        expect(typeof activity.restoreTrash).toBe("function");
        expect(typeof activity.restoreTrashPop).toBe("function");
        expect(typeof activity._restoreTrashById).toBe("function");
        expect(typeof activity._renderTrashView).toBe("function");
        expect(typeof activity._showTrashPreviewPopup).toBe("function");
        expect(typeof activity._hideTrashPreviewPopup).toBe("function");
    });

    test("clicking the restoreIcon renders the trash view", () => {
        const activity = makeActivity();
        activity.blocks.blockList.blk1 = makeBlock();
        activity.blocks.trashStacks = ["blk1"];
        setupTrashController(activity);

        document.getElementById("restoreIcon").dispatchEvent(new window.MouseEvent("click"));

        expect(document.getElementById("trashView")).not.toBeNull();
    });

    test("stubs delegate to the underlying controller", () => {
        const activity = makeActivity();
        activity.blocks.blockList.blk1 = makeBlock();
        activity.blocks.trashStacks = ["blk1"];
        const controller = setupTrashController(activity);
        const spy = jest.spyOn(controller, "restoreTrashById");

        activity._restoreTrashById("blk1");

        expect(spy).toHaveBeenCalledWith("blk1");
    });
});
