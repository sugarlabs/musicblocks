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

const fs = require("fs");
const path = require("path");
const vm = require("vm");

// Captures every wheelnav instance created by displayHelpfulWheel so tests
// can assert on the labels passed to initWheel.
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

const loadActivityClass = () => {
    const activityPath = path.resolve(__dirname, "../activity.js");
    let code = fs.readFileSync(activityPath, "utf8");

    const splitPoint = code.indexOf("const activity = new Activity();");
    if (splitPoint !== -1) {
        code = code.substring(0, splitPoint);
    }

    // ContextMenuController now owns _setupPaletteMenu/_displayHelpfulWheel.
    // Concatenate its source (minus the AMD/CommonJS export tail) ahead of
    // activity.js so setupContextMenuController() resolves for real inside
    // this sandbox, sharing the same mocked globals (wheelnav, base64Encode,
    // the button icon constants, etc.) already defined below.
    const controllerPath = path.resolve(__dirname, "../context-menu-controller.js");
    let controllerCode = fs.readFileSync(controllerPath, "utf8");
    const controllerSplitPoint = controllerCode.indexOf("if (typeof define");
    if (controllerSplitPoint !== -1) {
        controllerCode = controllerCode.substring(0, controllerSplitPoint);
    }

    code = controllerCode + "\n" + code + "\nthis.Activity = Activity;";

    const sandbox = {
        window: global.window,
        document: global.document,
        console: global.console,
        navigator: global.navigator,
        _: key => key,
        define: () => {},
        require: () => {},
        setTimeout,
        setInterval,
        createjs: {
            DOMElement: class {
                constructor() {}
            }
        },
        jQuery: {
            browser: { mozilla: false }
        },
        Turtles: class {},
        Palettes: class {},
        Blocks: class {},
        Logo: class {},
        LanguageBox: class {},
        ThemeBox: class {},
        SaveInterface: class {},
        StatsWindow: class {},
        Trashcan: class {},
        PasteBox: class {},
        HelpWidget: class {},
        PluginDialog: class {
            constructor() {}
        },
        GIFAnimator: class {},
        i18next: {
            changeLanguage: jest.fn()
        },
        ErrorHandler: {
            capture: jest.fn(),
            recoverable: jest.fn()
        },
        setupActivityIdleWatcher: jest.fn(),
        setupProjectManager: jest.fn(),
        setupKeyboardController: jest.fn(),
        setupPluginController: jest.fn(),
        setupToolbarController: jest.fn(),
        setupAlertController: jest.fn(),
        setupAlertRenderer: jest.fn(),
        setupPaletteLoader: jest.fn(),
        setupSearchUI: jest.fn(() => ({})),
        setupSearchController: jest.fn(),
        setupWorkspaceLayoutController: jest.fn(),
        setupSelectionController: jest.fn(),
        setupTrashController: jest.fn(),
        setupHelpController: jest.fn(),
        setupBlockScaleController: jest.fn(),
        hideDOMLabel: jest.fn(),
        setupActivityRecorder: jest.fn(),
        setupActivityAbcParser: jest.fn(),
        AlertController: {
            MSG_TIMEOUT: 60000,
            ERROR_MSG_TIMEOUT: 15000
        },
        performance: global.performance || { now: () => Date.now() },
        platformColor: { stopIconcolor: "red", wheelcolors: [] },
        globalActivity: null,
        LEADING: 0,
        MYDEFINES: [],

        // globals referenced by setupPaletteMenu and displayHelpfulWheel
        wheelnav: WheelnavMock,
        slicePath: () => ({
            DonutSlice: {},
            DonutSliceCustomization: () => ({})
        }),
        base64Encode: s => s,
        GOHOMEFADEDBUTTON: "<svg/>",
        SHOWBLOCKSBUTTON: "<svg/>",
        COLLAPSEBLOCKSBUTTON: "<svg/>",
        SMALLERBUTTON: "<svg/>",
        BIGGERBUTTON: "<svg/>",
        CARTESIANBUTTON: "<svg/>",
        SELECTBUTTON: "<svg/>",
        CLEARBUTTON: "<svg/>",
        COLLAPSEBUTTON: "<svg/>",
        EXPANDBUTTON: "<svg/>",
        _THIS_IS_MUSIC_BLOCKS_: true,
        doSmallerBlocks: jest.fn(),
        doLargerBlocks: jest.fn(),
        setScroller: jest.fn(),
        chooseKeyMenu: jest.fn(),
        piemenuGrid: jest.fn()
    };

    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);
    return sandbox.Activity;
};

describe("Helpful wheel bulk actions (issue #7794)", () => {
    let Activity;
    let activity;
    let mockElement;

    beforeAll(() => {
        Activity = loadActivityClass();
    });

    beforeEach(() => {
        wheelInstances.length = 0;

        mockElement = {
            id: "",
            classList: {
                contains: jest.fn(() => false),
                add: jest.fn(),
                remove: jest.fn()
            },
            style: {},
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            appendChild: jest.fn(),
            parentNode: { removeChild: jest.fn() },
            contains: jest.fn(() => false),
            querySelector: jest.fn(() => null),
            querySelectorAll: jest.fn(() => []),
            innerHTML: ""
        };
        document.getElementById = jest.fn(() => mockElement);

        activity = new Activity();

        activity.cellSize = 40;
        activity.contextMenuController.makeButton = jest.fn(() => mockElement);
        activity.contextMenuController.loadButtonDragHandler = jest.fn();
        activity.boundary = { hide: jest.fn() };
        activity.toolbar = { changeWrap: jest.fn() };
        activity.turtles = { collapse: jest.fn(), expand: jest.fn() };
        activity.beginnerMode = false;
        activity.deleteMultipleBlocks = jest.fn();
        activity.copyMultipleBlocks = jest.fn();

        activity.canvas = { offsetLeft: 0, offsetTop: 0 };
        activity.getStageScale = () => 1;
        activity.addEventListener = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const getItem = label => activity.helpfulWheelItems.find(ele => ele.label === label);

    describe("setupPaletteMenu registration", () => {
        test("registers 'Move to trash' and 'Duplicate', hidden by default", () => {
            activity.setupPaletteMenu();

            const trash = getItem("Move to trash");
            const dup = getItem("Duplicate");

            expect(trash).toBeDefined();
            expect(trash.display).toBe(false);
            expect(trash.fn).toBe(activity.deleteMultipleBlocks);

            expect(dup).toBeDefined();
            expect(dup.display).toBe(false);
            expect(dup.fn).toBe(activity.copyMultipleBlocks);
        });
    });

    describe("displayHelpfulWheel visibility toggle", () => {
        const rightClick = { clientX: 400, clientY: 300 };

        beforeEach(() => {
            activity.setupPaletteMenu();
        });

        test("hides bulk actions when no blocks are selected", () => {
            activity.blocks = { selectedBlocks: [] };

            activity.displayHelpfulWheel(rightClick);

            expect(getItem("Move to trash").display).toBe(false);
            expect(getItem("Duplicate").display).toBe(false);
            const labels = wheelInstances[0].labels;
            expect(labels).not.toContain("Move to trash");
            expect(labels).not.toContain("Duplicate");
        });

        test("shows bulk actions when blocks are selected", () => {
            activity.blocks = { selectedBlocks: [{ trash: false }, { trash: false }] };

            activity.displayHelpfulWheel(rightClick);

            expect(getItem("Move to trash").display).toBe(true);
            expect(getItem("Duplicate").display).toBe(true);
            const labels = wheelInstances[0].labels;
            expect(labels).toContain("Move to trash");
            expect(labels).toContain("Duplicate");
        });

        test("ignores selected blocks that are already in the trash", () => {
            activity.blocks = { selectedBlocks: [{ trash: true }] };

            activity.displayHelpfulWheel(rightClick);

            expect(getItem("Move to trash").display).toBe(false);
            expect(getItem("Duplicate").display).toBe(false);
        });

        test("hides bulk actions again once the selection is gone", () => {
            activity.blocks = { selectedBlocks: [{ trash: false }] };
            activity.displayHelpfulWheel(rightClick);
            expect(getItem("Move to trash").display).toBe(true);

            activity.blocks.selectedBlocks = [];
            activity.displayHelpfulWheel(rightClick);
            expect(getItem("Move to trash").display).toBe(false);
            expect(getItem("Duplicate").display).toBe(false);
        });
    });
});
