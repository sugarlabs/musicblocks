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

global.lazyLoad = jest.fn(() => Promise.resolve());
global.getMacroExpansion = jest.fn(() => []);
global.debugLog = jest.fn();

class HelpWidgetMock {
    constructor(activity, showWelcome) {
        HelpWidgetMock.instances.push({ activity, showWelcome });
    }
}
HelpWidgetMock.instances = [];
global.HelpWidget = HelpWidgetMock;

class StatsWindowMock {
    constructor(activity) {
        this.activity = activity;
        this.isOpen = true;
        StatsWindowMock.instances.push(this);
    }
}
StatsWindowMock.instances = [];
global.StatsWindow = StatsWindowMock;

class JSEditorMock {
    constructor(activity) {
        JSEditorMock.instances.push(activity);
    }
}
JSEditorMock.instances = [];
global.JSEditor = JSEditorMock;

const { setupHelpController, HelpController } = require("../help-controller.js");

/**
 * Builds a minimal activity mock with the dependencies HelpController touches.
 */
function makeActivity() {
    return {
        blocks: {
            protoBlockDict: {
                note: { helpString: ["a", "b", "c"] },
                empty: { helpString: "" }
            },
            loadNewBlocks: jest.fn(),
            moveBlock: jest.fn()
        },
        palettes: {
            getProtoNameAndPalette: jest.fn(() => ["proto", "paletteName", "note"]),
            dict: {
                paletteName: {
                    makeBlockFromSearch: jest.fn((protoblk, protoName, cb) => cb("newBlockId"))
                }
            }
        },
        save: {
            download: jest.fn()
        },
        sendAllToTrash: jest.fn(),
        printBlockSVG: jest.fn(() => "<svg></svg>")
    };
}

beforeEach(() => {
    jest.useFakeTimers();
    HelpWidgetMock.instances = [];
    StatsWindowMock.instances = [];
    JSEditorMock.instances = [];
    window.widgetWindows = {
        openWindows: {},
        isOpen: jest.fn(() => false),
        clear: jest.fn(),
        windowFor: jest.fn(() => ({
            clear: jest.fn(),
            show: jest.fn(),
            getWidgetBody: jest.fn(() => document.createElement("div")),
            sendToCenter: jest.fn()
        }))
    };
    global.requestAnimationFrame = jest.fn(cb => cb());
});

afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
});

describe("setupHelpController", () => {
    test("attaches a HelpController instance to the activity", () => {
        const activity = makeActivity();
        const controller = setupHelpController(activity);

        expect(controller).toBeInstanceOf(HelpController);
        expect(activity.helpController).toBe(controller);
        expect(activity.helpController.activity).toBe(activity);
    });

    test("installs delegation methods on the activity", () => {
        const activity = makeActivity();
        setupHelpController(activity);

        expect(typeof activity.showHelp).toBe("function");
        expect(typeof activity.showAboutPage).toBe("function");
        expect(typeof activity.showKeyboardShortcuts).toBe("function");
        expect(typeof activity.toggleJSWindow).toBe("function");
        expect(typeof activity.doAnalytics).toBe("function");
        expect(typeof activity._saveHelpBlocks).toBe("function");
    });

    test("delegation methods forward to the controller's public API", async () => {
        const activity = makeActivity();
        setupHelpController(activity);
        const controller = activity.helpController;

        jest.spyOn(controller, "showHelp").mockResolvedValue();
        jest.spyOn(controller, "showAboutPage").mockResolvedValue();
        jest.spyOn(controller, "showKeyboardShortcuts").mockReturnValue();
        jest.spyOn(controller, "toggleJSEditor").mockResolvedValue();
        jest.spyOn(controller, "showStats").mockResolvedValue();
        jest.spyOn(controller, "saveHelpBlocks").mockReturnValue();

        await activity.showHelp();
        await activity.showAboutPage();
        activity.showKeyboardShortcuts();
        await activity.toggleJSWindow();
        await activity.doAnalytics();
        activity._saveHelpBlocks();

        expect(controller.showHelp).toHaveBeenCalledTimes(1);
        expect(controller.showAboutPage).toHaveBeenCalledTimes(1);
        expect(controller.showKeyboardShortcuts).toHaveBeenCalledTimes(1);
        expect(controller.toggleJSEditor).toHaveBeenCalledTimes(1);
        expect(controller.showStats).toHaveBeenCalledTimes(1);
        expect(controller.saveHelpBlocks).toHaveBeenCalledTimes(1);
    });
});

describe("HelpController.showHelp", () => {
    test("clears an open keyboard-shortcuts widget and creates a help widget", async () => {
        const activity = makeActivity();
        const controller = new HelpController(activity);
        window.widgetWindows.isOpen.mockImplementation(name => name === "keyboard-shortcuts");

        await controller.showHelp();

        expect(window.widgetWindows.clear).toHaveBeenCalledWith("keyboard-shortcuts");
        expect(global.lazyLoad).toHaveBeenCalledWith("widgets/help");
        expect(HelpWidgetMock.instances).toHaveLength(1);
        expect(HelpWidgetMock.instances[0]).toEqual({ activity, showWelcome: false });
    });

    test("does not clear anything when keyboard-shortcuts widget is not open", async () => {
        const activity = makeActivity();
        const controller = new HelpController(activity);

        await controller.showHelp();

        expect(window.widgetWindows.clear).not.toHaveBeenCalled();
        expect(HelpWidgetMock.instances).toHaveLength(1);
    });
});

describe("HelpController.showAboutPage", () => {
    test("creates a help widget without touching other widgets", async () => {
        const activity = makeActivity();
        const controller = new HelpController(activity);

        await controller.showAboutPage();

        expect(window.widgetWindows.clear).not.toHaveBeenCalled();
        expect(global.lazyLoad).toHaveBeenCalledWith("widgets/help");
        expect(HelpWidgetMock.instances).toHaveLength(1);
        expect(HelpWidgetMock.instances[0]).toEqual({ activity, showWelcome: false });
    });
});

describe("HelpController.showKeyboardShortcuts", () => {
    test("clears an open help widget before showing the shortcuts dialog", () => {
        const activity = makeActivity();
        const controller = new HelpController(activity);
        window.widgetWindows.isOpen.mockImplementation(name => name === "help");

        controller.showKeyboardShortcuts();

        expect(window.widgetWindows.clear).toHaveBeenCalledWith("help");
        expect(window.widgetWindows.windowFor).toHaveBeenCalledWith(
            activity,
            "Keyboard shortcuts",
            "keyboard-shortcuts",
            true
        );
    });

    test("builds the keyboard shortcut dialog DOM with sections in order", () => {
        const activity = makeActivity();
        const controller = new HelpController(activity);
        const widgetBody = document.createElement("div");
        window.widgetWindows.windowFor.mockReturnValue({
            clear: jest.fn(),
            show: jest.fn(),
            getWidgetBody: jest.fn(() => widgetBody),
            sendToCenter: jest.fn()
        });

        controller.showKeyboardShortcuts();

        const sectionTitles = Array.from(
            widgetBody.querySelectorAll(".keyboard-shortcuts-section-title")
        ).map(el => el.textContent);

        expect(sectionTitles).toEqual([
            "Workspace",
            "Editing",
            "Navigation",
            "Toolbar",
            "Widget Windows",
            "Help and Pitch Slider"
        ]);

        const firstRowAction = widgetBody.querySelector(".keyboard-shortcuts-action");
        expect(firstRowAction.textContent).toBe("Play project");

        const firstRowKey = widgetBody.querySelector(".keyboard-shortcuts-key");
        expect(firstRowKey.textContent).toBe("Windows/Linux: Alt + R\nMac: Option + R");
    });
});

describe("HelpController.toggleJSEditor", () => {
    test("lazy-loads the JS editor bundle and creates a JSEditor", async () => {
        const activity = makeActivity();
        const controller = new HelpController(activity);

        await controller.toggleJSEditor();

        expect(global.lazyLoad).toHaveBeenCalledWith(
            expect.arrayContaining(["widgets/jseditor", "activity/js-export/export"])
        );
        expect(JSEditorMock.instances).toEqual([activity]);
    });
});

describe("HelpController.showStats", () => {
    test("lazy-loads statistics and creates a StatsWindow when none is open", async () => {
        const activity = makeActivity();
        const controller = new HelpController(activity);

        await controller.showStats();

        expect(global.lazyLoad).toHaveBeenCalledWith("widgets/statistics");
        expect(activity.statsWindow).toBeInstanceOf(StatsWindowMock);
    });

    test("does not recreate a StatsWindow that is already open", async () => {
        const activity = makeActivity();
        const controller = new HelpController(activity);
        const existing = { isOpen: true };
        activity.statsWindow = existing;

        await controller.showStats();

        expect(global.lazyLoad).not.toHaveBeenCalled();
        expect(activity.statsWindow).toBe(existing);
    });
});

describe("HelpController.saveHelpBlocks", () => {
    test("saves artwork only for blocks with a non-empty helpString, then empties the trash", () => {
        const activity = makeActivity();
        const controller = new HelpController(activity);

        controller.saveHelpBlocks();

        jest.advanceTimersByTime(1000 + 500 + 500);

        expect(activity.sendAllToTrash).toHaveBeenCalledWith(false, true);
        expect(activity.sendAllToTrash).toHaveBeenCalledWith(true, true);
        expect(activity.save.download).toHaveBeenCalledWith(
            "svg",
            expect.stringContaining("data:image/svg+xml;utf8,"),
            "note_block.svg"
        );
        expect(activity.save.download).not.toHaveBeenCalledWith(
            "svg",
            expect.anything(),
            "empty_block.svg"
        );
    });

    test("loads a macro when the help block message points to a macro name", () => {
        const activity = makeActivity();
        activity.blocks.protoBlockDict = {
            macroBlock: { helpString: ["a", "b", "c", "macroName"] }
        };
        const controller = new HelpController(activity);

        controller.saveHelpBlocks();
        jest.advanceTimersByTime(1000 + 500);

        expect(global.getMacroExpansion).toHaveBeenCalledWith(activity, "macroName", 0, 0);
        expect(activity.blocks.loadNewBlocks).toHaveBeenCalled();
    });
});
