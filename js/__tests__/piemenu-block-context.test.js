/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2026 Music Blocks Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const { piemenuBlockContext } = require("../piemenu-block-context");

// ---------------------------------------------------------------------------
// Mock Globals
// ---------------------------------------------------------------------------

const domElements = {};
function getDomElement(id) {
    if (!domElements[id]) {
        domElements[id] = { style: {} };
    }
    return domElements[id];
}

global.docById = jest.fn(getDomElement);

// jest-environment-jsdom keeps `document`/`window` as live bindings to the
// real jsdom objects: wholesale reassignment (`global.document = {...}`) is
// silently ignored. Mock behavior by overwriting properties on the real
// objects instead (done fresh in beforeEach below).
let bodyClickHandler = null;
let computedDisplay = "none";

function makeWheelNavItem() {
    return { setTooltip: jest.fn(), navigateFunction: undefined, selected: true };
}

global.wheelnav = jest.fn().mockImplementation(function () {
    this.navItems = Array.from({ length: 6 }, makeWheelNavItem);
    this.initWheel = jest.fn();
    this.createWheel = jest.fn();
});

global.slicePath = jest.fn().mockReturnValue({
    DonutSlice: jest.fn(),
    DonutSliceCustomization: jest.fn().mockReturnValue({ minRadiusPercent: 0, maxRadiusPercent: 0 })
});

global.platformColor = { wheelcolors: ["#fff", "#000"] };
global._ = jest.fn(s => s);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBlock(overrides = {}) {
    const blockBlockId = "active-id";
    const topBlockId = "top-id";

    const blockList = {
        [blockBlockId]: {
            name: "notename",
            container: { x: 10, y: 20 },
            protoblock: { helpString: "" }
        },
        [topBlockId]: { name: "notename" }
    };

    const block = {
        blockIndex: blockBlockId,
        name: "notename",
        blocks: {
            activeBlock: blockBlockId,
            blockList,
            findTopBlock: jest.fn(() => topBlockId),
            prepareStackForCopy: jest.fn(),
            pasteStack: jest.fn(),
            extract: jest.fn(),
            sendStackToTrash: jest.fn(),
            saveStack: jest.fn(),
            pasteDx: 0,
            pasteDy: 0,
            stageClick: true
        },
        activity: {
            canvas: { offsetLeft: 0, offsetTop: 0 },
            blocksContainer: { x: 0, y: 0 },
            getStageScale: jest.fn(() => 1),
            helpfulWheelItems: [],
            errorMsg: jest.fn(),
            textMsg: jest.fn()
        }
    };

    return { ...block, ...overrides, blocks: { ...block.blocks, ...(overrides.blocks || {}) } };
}

let originalHelpWidget;

beforeEach(() => {
    jest.clearAllMocks();
    computedDisplay = "none";
    bodyClickHandler = null;
    window._contextWheelClickHandler = undefined;
    for (const key of Object.keys(domElements)) delete domElements[key];
    originalHelpWidget = global.HelpWidget;
    delete global.HelpWidget;

    document.getElementById = jest.fn(getDomElement);
    document.body.addEventListener = jest.fn((event, handler) => {
        if (event === "click") bodyClickHandler = handler;
    });
    document.body.removeEventListener = jest.fn((event, handler) => {
        if (event === "click" && bodyClickHandler === handler) bodyClickHandler = null;
    });
    window.getComputedStyle = jest.fn(() => ({ display: computedDisplay }));
});

afterEach(() => {
    if (originalHelpWidget === undefined) delete global.HelpWidget;
    else global.HelpWidget = originalHelpWidget;
});

describe("piemenuBlockContext", () => {
    test("does nothing when there is no active block", () => {
        const block = makeBlock({ blocks: { activeBlock: null } });

        piemenuBlockContext(block);

        expect(global.wheelnav).not.toHaveBeenCalled();
    });

    test("positions and displays the context wheel over the active block, with base menu items", () => {
        const block = makeBlock();

        piemenuBlockContext(block);

        const wheelDiv = getDomElement("contextWheelDiv");
        expect(wheelDiv.style.position).toBe("absolute");
        expect(wheelDiv.style.display).toBe("");
        expect(typeof wheelDiv.style.left).toBe("string");
        expect(typeof wheelDiv.style.top).toBe("string");

        expect(global.wheelnav).toHaveBeenCalledWith("contextWheelDiv", null, 250, 250);

        const wheel = global.wheelnav.mock.instances[0];
        expect(wheel.initWheel).toHaveBeenCalledWith([
            "imgsrc:header-icons/copy-button.svg",
            "imgsrc:header-icons/extract-button.svg",
            "imgsrc:header-icons/empty-trash-button.svg",
            "imgsrc:header-icons/cancel-button.svg"
        ]);
        expect(wheel.navItems[0].setTooltip).toHaveBeenCalledWith("Duplicate");
        expect(wheel.navItems[1].setTooltip).toHaveBeenCalledWith("Extract");
        expect(wheel.navItems[2].setTooltip).toHaveBeenCalledWith("Move to trash");
        expect(wheel.navItems[3].setTooltip).toHaveBeenCalledWith("Close");
        expect(wheel.navItems[4].setTooltip).not.toHaveBeenCalled();
        expect(wheel.navItems[0].selected).toBe(false);
        expect(wheel.clickModeRotate).toBe(false);
        expect(document.body.removeEventListener).not.toHaveBeenCalled();
    });

    test("computes exact left/top pixel offsets from block position, canvas offset, and stage scale", () => {
        const block = makeBlock();
        block.blocks.blockList["active-id"].container = { x: 10, y: 20 };
        block.activity.canvas = { offsetLeft: 100, offsetTop: 50 };
        block.activity.blocksContainer = { x: 5, y: 3 };
        block.activity.getStageScale = jest.fn(() => 2);

        piemenuBlockContext(block);

        const wheelDiv = getDomElement("contextWheelDiv");
        expect(wheelDiv.style.left).toBe("36px");
        expect(wheelDiv.style.top).toBe("-42px");
    });

    test.each(["customsample", "temperament1", "definemode", "show", "turtleshell", "action"])(
        "adds a save-stack menu item for save-eligible block type '%s'",
        name => {
            const block = makeBlock();
            block.name = name;
            block.blocks.blockList["top-id"].name = name;

            piemenuBlockContext(block);

            const wheel = global.wheelnav.mock.instances[0];
            expect(wheel.initWheel).toHaveBeenCalledWith(
                expect.arrayContaining(["imgsrc:header-icons/save-blocks-button.svg"])
            );
            expect(wheel.navItems[4].setTooltip).toHaveBeenCalledWith("Save stack");
            expect(typeof wheel.navItems[4].navigateFunction).toBe("function");

            wheel.navItems[4].navigateFunction();

            expect(block.blocks.activeBlock).toBe(block.blockIndex);
            expect(block.blocks.prepareStackForCopy).toHaveBeenCalled();
            expect(block.blocks.saveStack).toHaveBeenCalled();
        }
    );

    test("does not add a save-stack menu item for ordinary block types", () => {
        const block = makeBlock();

        piemenuBlockContext(block);

        const wheel = global.wheelnav.mock.instances[0];
        expect(wheel.initWheel).toHaveBeenCalledWith(
            expect.not.arrayContaining(["imgsrc:header-icons/save-blocks-button.svg"])
        );
        expect(wheel.navItems[4].navigateFunction).toBeUndefined();
    });

    test("adds a help menu item that opens HelpWidget directly when already loaded", () => {
        const block = makeBlock();
        block.blocks.blockList["active-id"].protoblock.helpString = "Some help text";
        global.HelpWidget = jest.fn();

        piemenuBlockContext(block);

        const wheel = global.wheelnav.mock.instances[0];
        expect(wheel.initWheel).toHaveBeenCalledWith(
            expect.arrayContaining(["imgsrc:header-icons/help-button.svg"])
        );
        expect(wheel.navItems[4].setTooltip).toHaveBeenCalledWith("Help");

        wheel.navItems[4].navigateFunction();

        expect(global.HelpWidget).toHaveBeenCalledWith(block, true);
        expect(getDomElement("contextWheelDiv").style.display).toBe("none");
    });

    // Note: the `typeof HelpWidget === "undefined"` branch falls through to a
    // bare `require(["widgets/help"], cb)` call — RequireJS's AMD signature.
    // In Jest/Node, `require` is a per-module CommonJS function (not a
    // globally-overridable binding), and Node's `require` does not accept an
    // array as its first argument, so this branch cannot be exercised via a
    // real invocation in this test environment. The rest of the codebase's
    // equivalent AMD-lazy-require call sites (e.g. project-manager.js) are
    // not directly invoked in their tests either, for the same reason.

    test("duplicate pastes the stack and increments the paste offset on repeated use", () => {
        const block = makeBlock();
        const dxHistory = [];
        const dyHistory = [];
        block.blocks.pasteStack = jest.fn(() => {
            dxHistory.push(block.blocks.pasteDx);
            dyHistory.push(block.blocks.pasteDy);
        });

        piemenuBlockContext(block);
        const wheel = global.wheelnav.mock.instances[0];

        wheel.navItems[0].navigateFunction();
        wheel.navItems[0].navigateFunction();

        expect(block.blocks.prepareStackForCopy).toHaveBeenCalledTimes(2);
        expect(dxHistory).toEqual([0, 21]);
        expect(dyHistory).toEqual([0, 21]);
    });

    test("duplicate re-enables the 'Paste previous stack' helper item and rebinds its handler", () => {
        const block = makeBlock();
        const matchingItem = { label: "Paste previous stack", display: false, fn: null };
        const otherItem = { label: "Something else", display: false, fn: null };
        block.activity.helpfulWheelItems = [matchingItem, otherItem];

        piemenuBlockContext(block);
        const wheel = global.wheelnav.mock.instances[0];

        wheel.navItems[0].navigateFunction();

        expect(matchingItem.display).toBe(true);
        expect(typeof matchingItem.fn).toBe("function");
        expect(otherItem.display).toBe(false);
        expect(otherItem.fn).toBeNull();
    });

    test("duplicate shows an error instead of pasting when the stack is a customsample", () => {
        const block = makeBlock();
        block.blocks.blockList["top-id"].name = "customsample";

        piemenuBlockContext(block);
        const wheel = global.wheelnav.mock.instances[0];

        wheel.navItems[0].navigateFunction();

        expect(block.activity.errorMsg).toHaveBeenCalledWith(
            "In order to copy a sample, you must reload the widget, import the sample again, and export it."
        );
        expect(block.blocks.pasteStack).not.toHaveBeenCalled();
    });

    test("extract sets the active block, extracts it, and hides the wheel", () => {
        const block = makeBlock();

        piemenuBlockContext(block);
        const wheel = global.wheelnav.mock.instances[0];

        wheel.navItems[1].navigateFunction();

        expect(block.blocks.activeBlock).toBe(block.blockIndex);
        expect(block.blocks.extract).toHaveBeenCalled();
        expect(getDomElement("contextWheelDiv").style.display).toBe("none");
    });

    test("trash extracts and sends the stack to trash, hides the wheel, and notifies the user", () => {
        const block = makeBlock();

        piemenuBlockContext(block);
        const wheel = global.wheelnav.mock.instances[0];

        wheel.navItems[2].navigateFunction();

        expect(block.blocks.activeBlock).toBe(block.blockIndex);
        expect(block.blocks.extract).toHaveBeenCalled();
        expect(block.blocks.sendStackToTrash).toHaveBeenCalled();
        expect(getDomElement("contextWheelDiv").style.display).toBe("none");
        expect(block.activity.textMsg).toHaveBeenCalledWith(
            "You can restore deleted blocks from the trash with the Restore From Trash button.",
            3000
        );
    });

    test("close hides the wheel", () => {
        const block = makeBlock();

        piemenuBlockContext(block);
        const wheel = global.wheelnav.mock.instances[0];

        wheel.navItems[3].navigateFunction();

        expect(getDomElement("contextWheelDiv").style.display).toBe("none");
    });

    test("registers an outside-click handler that hides the wheel while it is displayed", () => {
        const block = makeBlock();

        piemenuBlockContext(block);

        expect(global.document.body.addEventListener).toHaveBeenCalledWith(
            "click",
            expect.any(Function)
        );
        expect(bodyClickHandler).toBeInstanceOf(Function);

        computedDisplay = "block";
        bodyClickHandler({});

        expect(getDomElement("contextWheelDiv").style.display).toBe("none");
        expect(global.document.body.removeEventListener).toHaveBeenCalledWith(
            "click",
            expect.any(Function)
        );
    });

    test("does not hide the wheel on an outside click when it is not displayed", () => {
        const block = makeBlock();

        piemenuBlockContext(block);
        getDomElement("contextWheelDiv").style.display = "unrelated";
        computedDisplay = "none";

        bodyClickHandler({});

        expect(getDomElement("contextWheelDiv").style.display).toBe("unrelated");
    });

    test("replaces the previous outside-click handler instead of accumulating listeners", () => {
        const block = makeBlock();

        piemenuBlockContext(block);
        const firstHandler = bodyClickHandler;

        piemenuBlockContext(block);

        expect(global.document.body.removeEventListener).toHaveBeenCalledWith(
            "click",
            firstHandler
        );
        expect(bodyClickHandler).not.toBe(firstHandler);
    });

    test("clears stageClick after the cleanup timeout", () => {
        jest.useFakeTimers();
        const block = makeBlock();
        block.blocks.stageClick = true;

        piemenuBlockContext(block);
        expect(block.blocks.stageClick).toBe(true);

        jest.advanceTimersByTime(500);

        expect(block.blocks.stageClick).toBe(false);
        jest.useRealTimers();
    });
});
