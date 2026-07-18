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
if (typeof global.platformColor === "undefined") {
    global.platformColor = { wheelcolors: [] };
}
if (typeof global.base64Encode !== "function") {
    global.base64Encode = s => s;
}
if (typeof global.GOHOMEFADEDBUTTON === "undefined") {
    global.GOHOMEFADEDBUTTON = "<svg/>";
}
if (typeof global.SHOWBLOCKSBUTTON === "undefined") {
    global.SHOWBLOCKSBUTTON = "<svg/>";
}
if (typeof global.COLLAPSEBLOCKSBUTTON === "undefined") {
    global.COLLAPSEBLOCKSBUTTON = "<svg/>";
}
if (typeof global.SMALLERBUTTON === "undefined") {
    global.SMALLERBUTTON = "<svg/>";
}
if (typeof global.BIGGERBUTTON === "undefined") {
    global.BIGGERBUTTON = "<svg/>";
}
if (typeof global.CARTESIANBUTTON === "undefined") {
    global.CARTESIANBUTTON = "<svg/>";
}
if (typeof global.SELECTBUTTON === "undefined") {
    global.SELECTBUTTON = "<svg/>";
}
if (typeof global.CLEARBUTTON === "undefined") {
    global.CLEARBUTTON = "<svg/>";
}
if (typeof global.COLLAPSEBUTTON === "undefined") {
    global.COLLAPSEBUTTON = "<svg/>";
}
if (typeof global.EXPANDBUTTON === "undefined") {
    global.EXPANDBUTTON = "<svg/>";
}
if (typeof global.piemenuGrid !== "function") {
    global.piemenuGrid = jest.fn();
}
if (typeof global.LEADING === "undefined") {
    global.LEADING = 0;
}
if (typeof global._THIS_IS_MUSIC_BLOCKS_ === "undefined") {
    global._THIS_IS_MUSIC_BLOCKS_ = true;
}

// Captures every wheelnav instance created by displayHelpfulWheel so tests
// can assert on the labels/positioning passed to it.
const wheelInstances = [];

class WheelnavMock {
    constructor() {
        this.navItems = [];
        wheelInstances.push(this);
    }
    initWheel(labels) {
        this.labels = labels;
        this.navItems = labels.map(() => ({
            setTitle: jest.fn(),
            setTooltip: jest.fn(),
            selected: true
        }));
    }
    createWheel() {}
}
global.wheelnav = WheelnavMock;
global.slicePath = () => ({
    DonutSlice: {},
    DonutSliceCustomization: () => ({})
});

const {
    setupContextMenuController,
    ContextMenuController
} = require("../context-menu-controller.js");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBitmap() {
    return { y: 0 };
}

function makeActivity() {
    return {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        beginnerMode: false,
        searchUI: { isHelpfulSearchWidgetOn: false },
        blocks: {
            isCoordinateOnBlock: jest.fn(() => false),
            selectedBlocks: [],
            checkBounds: jest.fn(),
            trashStacks: []
        },
        canvas: { offsetLeft: 0, offsetTop: 0 },
        getStageScale: () => 1,
        helpfulWheelItems: [],
        cellSize: 40,
        findBlocks: jest.fn(),
        boundary: { hide: jest.fn() },
        toolbar: { changeWrap: jest.fn() },
        _changeBlockVisibility: jest.fn(),
        _toggleCollapsibleStacks: jest.fn(),
        _restoreTrashById: jest.fn(),
        doSmallerBlocks: jest.fn(),
        doLargerBlocks: jest.fn(),
        setScroller: jest.fn(),
        chooseKeyMenu: jest.fn(),
        selectMode: jest.fn(),
        deleteMultipleBlocks: jest.fn(),
        copyMultipleBlocks: jest.fn(),
        textMsg: jest.fn(),
        __tick: jest.fn(),
        _allClear: jest.fn(),
        turtles: {
            collapse: jest.fn(),
            expand: jest.fn(),
            running: jest.fn(() => false),
            deltaY: jest.fn()
        },
        searchController: {
            setHelpfulSearchDiv: jest.fn(),
            _displayHelpfulSearchDiv: jest.fn(),
            _hideHelpfulSearchWidget: jest.fn()
        },
        toolbarHeight: 0,
        palettes: { deltaY: jest.fn() },
        blocksContainer: { y: 0 },
        cartesianBitmap: makeBitmap(),
        polarBitmap: makeBitmap(),
        trebleBitmap: makeBitmap(),
        grandBitmap: makeBitmap(),
        sopranoBitmap: makeBitmap(),
        altoBitmap: makeBitmap(),
        tenorBitmap: makeBitmap(),
        bassBitmap: makeBitmap(),
        refreshCanvas: jest.fn(),
        menuButtonsVisible: false,
        onscreenButtons: [],
        onscreenMenu: [],
        loading: false
    };
}

let mockElement;

function installDocumentMock() {
    mockElement = {
        id: "",
        classList: { contains: jest.fn(() => false), add: jest.fn(), remove: jest.fn() },
        style: {},
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        appendChild: jest.fn(),
        parentNode: { removeChild: jest.fn() },
        contains: jest.fn(() => false),
        querySelector: jest.fn(() => null),
        querySelectorAll: jest.fn(() => []),
        setAttribute: jest.fn(),
        onmouseover: null,
        onmouseout: null,
        onmousedown: null,
        style_: {},
        innerHTML: "",
        getBoundingClientRect: () => ({ top: 100 })
    };
    document.getElementById = jest.fn(() => mockElement);
    document.querySelectorAll = jest.fn(() => []);
    document.createElement = jest.fn(() => ({
        setAttribute: jest.fn(),
        appendChild: jest.fn(),
        style: {}
    }));
    document.body.appendChild = jest.fn();
    window.jQuery = jest.fn(() => ({ tooltip: jest.fn() }));
    window.btoa = jest.fn(s => s);
}

describe("ContextMenuController", () => {
    let activity;
    let controller;

    beforeEach(() => {
        wheelInstances.length = 0;
        installDocumentMock();
        activity = makeActivity();
        controller = new ContextMenuController(activity);
    });

    // -----------------------------------------------------------------------
    describe("setupContextMenuController", () => {
        test("creates a controller and attaches it to activity.contextMenuController", () => {
            const a = makeActivity();
            const c = setupContextMenuController(a);
            expect(a.contextMenuController).toBeInstanceOf(ContextMenuController);
            expect(c).toBe(a.contextMenuController);
        });

        test("installs delegation methods onto activity", () => {
            const a = makeActivity();
            setupContextMenuController(a);
            [
                "doContextMenus",
                "displayHelpfulWheel",
                "setupPaletteMenu",
                "makeButton",
                "loadButtonDragHandler",
                "openAuxMenu",
                "_showHideAuxMenu",
                "showHideAuxMenu",
                "hideAuxMenu",
                "deltaY",
                "setHelpfulSearchDiv",
                "_displayHelpfulSearchDiv",
                "_hideHelpfulSearchWidget"
            ].forEach(method => {
                expect(typeof a[method]).toBe("function");
            });
        });

        test("delegation methods forward to the controller", () => {
            const a = makeActivity();
            const c = setupContextMenuController(a);
            c.deltaY = jest.fn();
            a.deltaY(15);
            expect(c.deltaY).toHaveBeenCalledWith(15);

            c.hideAuxMenu = jest.fn();
            a.hideAuxMenu();
            expect(c.hideAuxMenu).toHaveBeenCalled();

            c.setupPaletteMenu = jest.fn();
            a.setupPaletteMenu();
            expect(c.setupPaletteMenu).toHaveBeenCalled();
        });
    });

    // -----------------------------------------------------------------------
    describe("doContextMenus", () => {
        test("registers a contextmenu listener on document", () => {
            controller.doContextMenus();
            expect(activity.addEventListener).toHaveBeenCalledWith(
                document,
                "contextmenu",
                expect.any(Function),
                false
            );
        });

        test("shows the helpful wheel on right click outside blocks, on the canvas", () => {
            controller.doContextMenus();
            const handler = activity.addEventListener.mock.calls[0][2];
            const displaySpy = jest
                .spyOn(controller, "displayHelpfulWheel")
                .mockImplementation(() => {});
            activity.helpfulWheelItems = [
                { label: "Move to trash", display: false },
                { label: "Duplicate", display: false }
            ];

            const event = {
                preventDefault: jest.fn(),
                stopPropagation: jest.fn(),
                clientX: 10,
                clientY: 10,
                target: { id: "myCanvas" }
            };
            handler(event);

            expect(event.preventDefault).toHaveBeenCalled();
            expect(event.stopPropagation).toHaveBeenCalled();
            expect(displaySpy).toHaveBeenCalledWith(event);
        });

        test("does nothing in beginner mode", () => {
            activity.beginnerMode = true;
            controller.doContextMenus();
            const handler = activity.addEventListener.mock.calls[0][2];
            const displaySpy = jest.spyOn(controller, "displayHelpfulWheel");

            handler({
                preventDefault: jest.fn(),
                stopPropagation: jest.fn(),
                clientX: 10,
                clientY: 10,
                target: { id: "myCanvas" }
            });

            expect(displaySpy).not.toHaveBeenCalled();
        });

        test("hides the helpful search widget first if it is open", () => {
            activity.searchUI.isHelpfulSearchWidgetOn = true;
            controller.doContextMenus();
            const handler = activity.addEventListener.mock.calls[0][2];
            const hideSpy = jest.spyOn(controller, "_hideHelpfulSearchWidget");
            jest.spyOn(controller, "displayHelpfulWheel").mockImplementation(() => {});

            handler({
                preventDefault: jest.fn(),
                stopPropagation: jest.fn(),
                clientX: 10,
                clientY: 10,
                target: { id: "myCanvas" }
            });

            expect(hideSpy).toHaveBeenCalled();
        });

        test("does not display the wheel when the click lands on a block", () => {
            activity.blocks.isCoordinateOnBlock.mockReturnValue(true);
            controller.doContextMenus();
            const handler = activity.addEventListener.mock.calls[0][2];
            const displaySpy = jest.spyOn(controller, "displayHelpfulWheel");

            handler({
                preventDefault: jest.fn(),
                stopPropagation: jest.fn(),
                clientX: 10,
                clientY: 10,
                target: { id: "myCanvas" }
            });

            expect(displaySpy).not.toHaveBeenCalled();
        });
    });

    // -----------------------------------------------------------------------
    describe("displayHelpfulWheel", () => {
        const rightClick = { clientX: 400, clientY: 300 };

        beforeEach(() => {
            controller.setupPaletteMenu();
        });

        const getItem = label => activity.helpfulWheelItems.find(ele => ele.label === label);

        test("positions the wheel relative to the click and stage scale", () => {
            activity.getStageScale = () => 2;
            controller.displayHelpfulWheel(rightClick);
            expect(mockElement.style.position).toBe("absolute");
            expect(mockElement.style.left).toEqual(expect.stringContaining("px"));
            expect(mockElement.style.top).toEqual(expect.stringContaining("px"));
        });

        test("hides bulk actions when no blocks are selected", () => {
            activity.blocks.selectedBlocks = [];
            controller.displayHelpfulWheel(rightClick);

            expect(getItem("Move to trash").display).toBe(false);
            expect(getItem("Duplicate").display).toBe(false);
            expect(wheelInstances[0].labels).not.toContain("Move to trash");
            expect(wheelInstances[0].labels).not.toContain("Duplicate");
        });

        test("shows bulk actions when blocks are selected", () => {
            activity.blocks.selectedBlocks = [{ trash: false }, { trash: false }];
            controller.displayHelpfulWheel(rightClick);

            expect(getItem("Move to trash").display).toBe(true);
            expect(getItem("Duplicate").display).toBe(true);
            expect(wheelInstances[0].labels).toContain("Move to trash");
            expect(wheelInstances[0].labels).toContain("Duplicate");
        });

        test("ignores selected blocks that are already in the trash", () => {
            activity.blocks.selectedBlocks = [{ trash: true }];
            controller.displayHelpfulWheel(rightClick);

            expect(getItem("Move to trash").display).toBe(false);
            expect(getItem("Duplicate").display).toBe(false);
        });

        test("registers a document click listener that closes the wheel", () => {
            controller.displayHelpfulWheel(rightClick);
            expect(activity.addEventListener).toHaveBeenCalledWith(
                document,
                "click",
                expect.any(Function)
            );
        });
    });

    // -----------------------------------------------------------------------
    describe("setupPaletteMenu / helpfulWheelItems registry", () => {
        test("resets and rebuilds helpfulWheelItems on every call", () => {
            controller.setupPaletteMenu();
            const firstLength = activity.helpfulWheelItems.length;
            expect(firstLength).toBeGreaterThan(0);

            controller.setupPaletteMenu();
            expect(activity.helpfulWheelItems.length).toBe(firstLength);
        });

        test("never registers duplicate labels across repeated rebuilds", () => {
            controller.setupPaletteMenu();
            controller.setupPaletteMenu();
            controller.setupPaletteMenu();

            const labels = activity.helpfulWheelItems.map(ele => ele.label);
            const uniqueLabels = new Set(labels);
            expect(labels.length).toBe(uniqueLabels.size);
        });

        test("registers 'Move to trash' and 'Duplicate', hidden by default", () => {
            controller.setupPaletteMenu();
            const trash = activity.helpfulWheelItems.find(ele => ele.label === "Move to trash");
            const dup = activity.helpfulWheelItems.find(ele => ele.label === "Duplicate");

            expect(trash.display).toBe(false);
            expect(trash.fn).toBe(activity.deleteMultipleBlocks);
            expect(dup.display).toBe(false);
            expect(dup.fn).toBe(activity.copyMultipleBlocks);
        });

        test("removes any pre-existing bottom toolbar container before rebuilding", () => {
            controller.setupPaletteMenu();
            expect(mockElement.parentNode.removeChild).toHaveBeenCalledWith(mockElement);
        });

        test("creates the home button using activity.findBlocks", () => {
            controller.setupPaletteMenu();
            const home = activity.helpfulWheelItems.find(ele => ele.label === "Home [HOME]");
            expect(home.fn).toBe(activity.findBlocks);
        });

        test("wires 'Show/hide blocks', 'Expand/collapse blocks' and 'Restore' to the controller's own methods", () => {
            controller.setupPaletteMenu();
            const showHide = activity.helpfulWheelItems.find(
                ele => ele.label === "Show/hide blocks"
            );
            const expandCollapse = activity.helpfulWheelItems.find(
                ele => ele.label === "Expand/collapse blocks"
            );
            const restore = activity.helpfulWheelItems.find(ele => ele.label === "Restore");

            expect(showHide.fn).toBe(controller.changeBlockVisibility);
            expect(expandCollapse.fn).toBe(controller.toggleCollapsibleStacks);
            expect(restore.fn).toBe(controller.restoreTrashPop);
        });

        test("'Show/hide blocks', 'Expand/collapse blocks' and 'Restore' work when invoked unbound, exactly as displayHelpfulWheel invokes them (ele.fn(activity), not controller.method(activity))", () => {
            controller.setupPaletteMenu();
            const showHide = activity.helpfulWheelItems.find(
                ele => ele.label === "Show/hide blocks"
            );
            const expandCollapse = activity.helpfulWheelItems.find(
                ele => ele.label === "Expand/collapse blocks"
            );
            const restore = activity.helpfulWheelItems.find(ele => ele.label === "Restore");
            activity.blocks.trashStacks = ["block-1"];

            // Extract the bare function references, matching how
            // wheelItems.forEach(... wheel.navItems[i].navigateFunction = () => ele.fn(activity))
            // calls them in displayHelpfulWheel: as plain functions, not as
            // controller method calls, so `this` is never bound inside them.
            const showHideFn = showHide.fn;
            const expandCollapseFn = expandCollapse.fn;
            const restoreFn = restore.fn;

            expect(() => showHideFn(activity)).not.toThrow();
            expect(() => expandCollapseFn(activity)).not.toThrow();
            expect(() => restoreFn(activity)).not.toThrow();
            expect(activity._changeBlockVisibility).toHaveBeenCalled();
            expect(activity._toggleCollapsibleStacks).toHaveBeenCalled();
            expect(activity._restoreTrashById).toHaveBeenCalledWith("block-1");
        });

        test("search delegation entries call back into the controller's own methods", () => {
            const displaySpy = jest.spyOn(controller, "_displayHelpfulSearchDiv");
            const hideSpy = jest.spyOn(controller, "_hideHelpfulSearchWidget");
            controller.setupPaletteMenu();

            const search = activity.helpfulWheelItems.find(
                ele => ele.label === "Search for Blocks"
            );
            const close = activity.helpfulWheelItems.find(ele => ele.label === "Close");

            search.fn();
            close.fn();

            expect(displaySpy).toHaveBeenCalled();
            expect(hideSpy).toHaveBeenCalled();
        });
    });

    // -----------------------------------------------------------------------
    describe("wheel-item action helpers (controller-private)", () => {
        test("changeBlockVisibility delegates to activity._changeBlockVisibility and closes the wheel", () => {
            mockElement.style.display = "block";
            controller.changeBlockVisibility(activity);
            expect(activity._changeBlockVisibility).toHaveBeenCalled();
            expect(mockElement.style.display).toBe("none");
            expect(activity.__tick).toHaveBeenCalled();
        });

        test("changeBlockVisibility does not tick when the wheel is already hidden", () => {
            mockElement.style.display = "none";
            controller.changeBlockVisibility(activity);
            expect(activity._changeBlockVisibility).toHaveBeenCalled();
            expect(activity.__tick).not.toHaveBeenCalled();
        });

        test("toggleCollapsibleStacks delegates to activity._toggleCollapsibleStacks and closes the wheel", () => {
            mockElement.style.display = "block";
            controller.toggleCollapsibleStacks(activity);
            expect(activity._toggleCollapsibleStacks).toHaveBeenCalled();
            expect(mockElement.style.display).toBe("none");
            expect(activity.__tick).toHaveBeenCalled();
        });

        test("restoreTrashPop shows an empty-trash message and returns early when there is nothing to restore", () => {
            activity.blocks.trashStacks = [];
            controller.restoreTrashPop(activity);
            expect(activity.textMsg).toHaveBeenCalledWith("Trash can is empty.", 3000);
            expect(activity._restoreTrashById).not.toHaveBeenCalled();
        });

        test("restoreTrashPop restores the most recently trashed block and closes the wheel", () => {
            activity.blocks.trashStacks = ["block-1", "block-2"];
            mockElement.style.display = "block";
            controller.restoreTrashPop(activity);
            expect(activity._restoreTrashById).toHaveBeenCalledWith("block-2");
            expect(activity.textMsg).toHaveBeenCalledWith("Item restored from the trash.", 3000);
            expect(mockElement.style.display).toBe("none");
            expect(activity.__tick).toHaveBeenCalled();
        });
    });

    // -----------------------------------------------------------------------
    describe("makeButton", () => {
        test("creates a tooltipped button element positioned via right/top offsets", () => {
            const container = controller.makeButton("<svg/>", "Home", 10, 20);
            expect(container.setAttribute).toHaveBeenCalledWith("id", "Home");
            expect(container.setAttribute).toHaveBeenCalledWith("class", "tooltipped");
            expect(container.appendChild).toHaveBeenCalled();
        });
    });

    // -----------------------------------------------------------------------
    describe("loadButtonDragHandler", () => {
        test("registers onmousedown that invokes the action with the given arg", () => {
            const container = { onmousedown: null };
            const actionClick = jest.fn();
            controller.loadButtonDragHandler(container, actionClick, activity);

            expect(typeof container.onmousedown).toBe("function");
            container.onmousedown();
            expect(actionClick).toHaveBeenCalledWith(activity);
        });
    });

    // -----------------------------------------------------------------------
    describe("aux menu open/close", () => {
        test("openAuxMenu shows the aux menu when turtles are idle and it is closed", () => {
            const showSpy = jest.spyOn(controller, "_showHideAuxMenu").mockImplementation(() => {});
            controller.openAuxMenu();
            expect(showSpy).toHaveBeenCalledWith(false);
        });

        test("openAuxMenu does nothing while turtles are running", () => {
            activity.turtles.running.mockReturnValue(true);
            const showSpy = jest.spyOn(controller, "_showHideAuxMenu").mockImplementation(() => {});
            controller.openAuxMenu();
            expect(showSpy).not.toHaveBeenCalled();
        });

        test("_showHideAuxMenu opens the aux toolbar and repositions containers", () => {
            controller._showHideAuxMenu(false);
            expect(activity.toolbarHeight).toBeGreaterThan(0);
            expect(activity.palettes.deltaY).toHaveBeenCalled();
            expect(activity.turtles.deltaY).toHaveBeenCalled();
            expect(activity.refreshCanvas).toHaveBeenCalled();
        });

        test("_showHideAuxMenu closes the aux toolbar when already open", () => {
            controller._showHideAuxMenu(false);
            activity.palettes.deltaY.mockClear();
            controller._showHideAuxMenu(true);
            expect(activity.toolbarHeight).toBe(0);
        });

        test("hideAuxMenu hides the menu only when it is open", () => {
            const showSpy = jest.spyOn(controller, "_showHideAuxMenu").mockImplementation(() => {});
            activity.toolbarHeight = 0;
            controller.hideAuxMenu();
            expect(showSpy).not.toHaveBeenCalled();

            activity.toolbarHeight = 60;
            controller.hideAuxMenu();
            expect(showSpy).toHaveBeenCalledWith(false);
            expect(activity.menuButtonsVisible).toBe(false);
        });

        test("showHideAuxMenu forwards to the passed activity's _showHideAuxMenu", () => {
            activity._showHideAuxMenu = jest.fn();
            controller.showHideAuxMenu(activity, true);
            expect(activity._showHideAuxMenu).toHaveBeenCalledWith(true);
        });
    });

    // -----------------------------------------------------------------------
    describe("deltaY", () => {
        test("updates toolbar height, onscreen buttons/menu, palettes, turtles, and blocksContainer", () => {
            activity.onscreenButtons = [{ y: 0 }, { y: 10 }];
            activity.onscreenMenu = [{ y: 5 }];
            controller.deltaY(20);

            expect(activity.toolbarHeight).toBe(20);
            expect(activity.onscreenButtons[0].y).toBe(20);
            expect(activity.onscreenButtons[1].y).toBe(30);
            expect(activity.onscreenMenu[0].y).toBe(25);
            expect(activity.palettes.deltaY).toHaveBeenCalledWith(20);
            expect(activity.turtles.deltaY).toHaveBeenCalledWith(20);
            expect(activity.blocksContainer.y).toBe(20);
            expect(activity.refreshCanvas).toHaveBeenCalled();
        });
    });

    // -----------------------------------------------------------------------
    describe("search delegation wrappers", () => {
        test("setHelpfulSearchDiv forwards to activity.searchController", () => {
            controller.setHelpfulSearchDiv();
            expect(activity.searchController.setHelpfulSearchDiv).toHaveBeenCalled();
        });

        test("_displayHelpfulSearchDiv forwards to activity.searchController", () => {
            controller._displayHelpfulSearchDiv();
            expect(activity.searchController._displayHelpfulSearchDiv).toHaveBeenCalled();
        });

        test("_hideHelpfulSearchWidget forwards to activity.searchController with the event", () => {
            const event = { type: "click" };
            controller._hideHelpfulSearchWidget(event);
            expect(activity.searchController._hideHelpfulSearchWidget).toHaveBeenCalledWith(event);
        });
    });

    // -----------------------------------------------------------------------
    describe("resize rebuild behavior", () => {
        test("calling setupPaletteMenu again (simulating a resize) rebuilds without leaking duplicates", () => {
            controller.setupPaletteMenu();
            const before = activity.helpfulWheelItems.map(ele => ele.label).sort();

            // Simulate a window resize triggering a rebuild.
            controller.setupPaletteMenu();
            const after = activity.helpfulWheelItems.map(ele => ele.label).sort();

            expect(after).toEqual(before);
        });
    });
});
