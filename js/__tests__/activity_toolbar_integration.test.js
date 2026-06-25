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

const loadActivityClass = () => {
    const activityPath = path.resolve(__dirname, "../activity.js");
    let code = fs.readFileSync(activityPath, "utf8");

    const splitPoint = code.indexOf("const activity = new Activity();");
    if (splitPoint !== -1) {
        code = code.substring(0, splitPoint);
    }

    code += "\nthis.Activity = Activity;";

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
        setupPluginController: jest.fn(),
        setupToolbarController: jest.fn(),
        setupAlertController: jest.fn(),
        setupAlertRenderer: jest.fn(),
        hideDOMLabel: jest.fn(),
        setupActivityRecorder: jest.fn(),
        setupActivityAbcParser: jest.fn(),
        AlertController: {
            MSG_TIMEOUT: 60000,
            ERROR_MSG_TIMEOUT: 15000
        },
        performance: global.performance || { now: () => Date.now() },
        platformColor: { stopIconcolor: "red" },
        globalActivity: null,
        LEADING: 0,
        MYDEFINES: []
    };

    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);
    return sandbox.Activity;
};

describe("Activity Toolbar Integration", () => {
    let Activity;
    let activity;
    let mockElement;

    beforeAll(() => {
        Activity = loadActivityClass();
    });

    beforeEach(() => {
        // Setup clean mocks for each test
        mockElement = {
            id: "",
            classList: {
                contains: jest.fn(() => false),
                add: jest.fn(),
                remove: jest.fn()
            },
            style: {
                display: "none",
                visibility: "hidden"
            },
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            appendChild: jest.fn(),
            querySelector: jest.fn(() => null),
            querySelectorAll: jest.fn(() => []),
            innerHTML: "",
            offsetHeight: 40
        };

        document.getElementById = jest.fn(id => {
            if (id === "samplerPrompt") return null;
            return mockElement;
        });
        document.getElementsByClassName = jest.fn(() => []);

        window.platformColor = { stopIconcolor: "red" };
        global.platformColor = window.platformColor;

        activity = new Activity();

        // Inject toolbar mock
        activity.toolbar = {
            highlightStop: jest.fn(),
            resetStop: jest.fn(),
            dimThenRestoreStop: jest.fn(),
            stopIconColorWhenPlaying: "blue"
        };

        // Inject toolbarController mock
        activity.toolbarController = {
            runFast: jest.fn(),
            runSlow: jest.fn(),
            runStep: jest.fn(),
            hardStop: jest.fn()
        };

        // Inject turtles and blocks mocks
        activity.turtles = {
            running: jest.fn(() => false),
            isShrunk: jest.fn(() => false)
        };

        activity.blocks = {
            activeBlock: null,
            hideBlocks: jest.fn(),
            showBlocks: jest.fn()
        };

        activity.logo = {
            _alreadyRunning: false,
            doStopTurtles: jest.fn(),
            turtleDelay: 0,
            tempo: {
                isMoving: false,
                pause: jest.fn(),
                resume: jest.fn()
            }
        };

        activity.paste = {
            style: { visibility: "hidden" }
        };

        activity.searchWidget = {
            style: { visibility: "hidden" }
        };

        activity.helpfulSearchWidget = {
            style: { visibility: "hidden" }
        };

        global.window.widgetWindows = {
            isOpen: jest.fn(() => false),
            openWindows: {}
        };

        global.hideDOMLabel = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("_doFastButton", () => {
        test("calls highlightStop and delegates runFast when not already running", () => {
            activity.turtles.running.mockReturnValue(false);
            activity.logo.turtleDelay = 100;

            activity._doFastButton("normal-env");

            expect(activity.toolbar.highlightStop).toHaveBeenCalledWith("red");
            expect(activity.toolbarController.runFast).toHaveBeenCalledWith("normal-env", 100);
        });

        test("calls dimThenRestoreStop when running and currentDelay is 0", () => {
            activity.turtles.running.mockReturnValue(true);
            activity.logo.turtleDelay = 0;

            activity._doFastButton("normal-env");

            expect(activity.toolbar.dimThenRestoreStop).toHaveBeenCalledWith("red");
            expect(activity.toolbarController.runFast).toHaveBeenCalledWith("normal-env", 0);
        });
    });

    describe("_doStepButton", () => {
        test("calls highlightStop when didRunStart is 'started'", () => {
            activity.toolbarController.runStep.mockReturnValue("started");

            activity._doStepButton();

            expect(activity.toolbar.highlightStop).toHaveBeenCalledWith("blue");
            expect(activity.toolbar.resetStop).not.toHaveBeenCalled();
        });

        test("calls resetStop when didRunStart is 'stopped'", () => {
            activity.toolbarController.runStep.mockReturnValue("stopped");

            activity._doStepButton();

            expect(activity.toolbar.resetStop).toHaveBeenCalled();
            expect(activity.toolbar.highlightStop).not.toHaveBeenCalled();
        });
    });

    describe("_doHardStopButton", () => {
        test("calls resetStop when stopped successfully", () => {
            activity.toolbarController.hardStop.mockReturnValue(true);

            activity._doHardStopButton(false);

            expect(activity.toolbar.resetStop).toHaveBeenCalled();
        });

        test("does not call resetStop when stopped unsuccessfully", () => {
            activity.toolbarController.hardStop.mockReturnValue(false);

            activity._doHardStopButton(false);

            expect(activity.toolbar.resetStop).not.toHaveBeenCalled();
        });
    });

    describe("onStopTurtle", () => {
        test("calls resetStop when execution finishes", () => {
            activity.onStopTurtle();

            expect(activity.toolbar.resetStop).toHaveBeenCalled();
        });
    });

    describe("keyboard-triggered execution shortcuts", () => {
        test("Alt-R calls highlightStop and runs fast execution", () => {
            activity.keyboardEnableFlag = true;
            activity._doFastButton = jest.fn();

            const event = {
                altKey: true,
                keyCode: 82, // 'R'
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };

            activity.__keyPressed(event);

            expect(activity.toolbar.highlightStop).toHaveBeenCalledWith("red");
            expect(activity._doFastButton).toHaveBeenCalled();
        });

        test("Alt-ENTER triggers highlightStop when not running and no open widget", () => {
            activity.keyboardEnableFlag = true;
            activity._doFastButton = jest.fn();
            activity.turtles.running.mockReturnValue(false);

            const event = {
                altKey: true,
                keyCode: 13, // ENTER
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };

            activity.__keyPressed(event);

            expect(activity.toolbar.highlightStop).toHaveBeenCalledWith("red");
            expect(activity._doFastButton).toHaveBeenCalled();
        });

        test("Alt-ENTER triggers _doHardStopButton when running", () => {
            activity.keyboardEnableFlag = true;
            activity._doHardStopButton = jest.fn();
            activity.turtles.running.mockReturnValue(true);

            const event = {
                altKey: true,
                keyCode: 13, // ENTER
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };

            activity.__keyPressed(event);

            expect(activity._doHardStopButton).toHaveBeenCalled();
        });

        test("Space triggers highlightStop when not running", () => {
            activity.keyboardEnableFlag = true;
            activity._doFastButton = jest.fn();
            activity.turtles.running.mockReturnValue(false);

            const event = {
                keyCode: 32, // SPACE
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };

            activity.__keyPressed(event);

            expect(activity.toolbar.highlightStop).toHaveBeenCalledWith("red");
            expect(activity._doFastButton).toHaveBeenCalled();
        });

        test("Space triggers _doHardStopButton when running", () => {
            activity.keyboardEnableFlag = true;
            activity._doHardStopButton = jest.fn();
            activity.turtles.running.mockReturnValue(true);

            const event = {
                keyCode: 32, // SPACE
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };

            activity.__keyPressed(event);

            expect(activity._doHardStopButton).toHaveBeenCalled();
        });
    });
});
