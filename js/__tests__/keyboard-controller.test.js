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

const path = require("path");

// ---------------------------------------------------------------------------
// Globals required by keyboard-controller.js at call time (not load time)
// ---------------------------------------------------------------------------

beforeAll(() => {
    global._ = key => key;
    global.platformColor = { stopIconcolor: "red" };
    global.STANDARDBLOCKHEIGHT = 20;
    global.disableHorizScrollIcon = { style: { display: "none" } };
});

let KeyboardController, setupKeyboardController;
beforeAll(() => {
    jest.resetModules();
    ({ KeyboardController, setupKeyboardController } = require(
        path.resolve(__dirname, "../keyboard-controller.js")
    ));
});

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

const makeElement = (overrides = {}) => ({
    style: { display: "", visibility: "hidden", ...(overrides.style || {}) },
    classList: { contains: jest.fn(() => false) },
    value: "",
    focus: jest.fn(),
    ...overrides
});

let elementRegistry;

beforeEach(() => {
    elementRegistry = {
        "labelDiv": makeElement(),
        "lilypondModal": makeElement({ style: { display: "none" } }),
        "planet-iframe": makeElement({ style: { display: "none" } }),
        "wheelDiv": makeElement({ style: { display: "none" } }),
        "canvas": makeElement(),
        "myCanvas": makeElement()
    };

    document.getElementById = jest.fn(id =>
        Object.prototype.hasOwnProperty.call(elementRegistry, id) ? elementRegistry[id] : null
    );
    document.getElementsByClassName = jest.fn(() => []);

    global.window.widgetWindows = {
        isOpen: jest.fn(() => false),
        openWindows: {}
    };
});

// ---------------------------------------------------------------------------
// Activity mock
// ---------------------------------------------------------------------------

const makeActivity = () => ({
    keyboardEnableFlag: true,
    currentKeyCode: 0,
    currentKey: "",
    printText: { classList: { contains: () => false } },
    isInputON: false,
    beginnerMode: false,
    inTempoWidget: false,
    scrollBlockContainer: false,
    turtleBlocksScale: 1,
    update: false,
    stageDirty: false,
    paste: { style: { visibility: "hidden" }, value: "", focus: jest.fn() },
    searchWidget: { style: { visibility: "hidden" } },
    helpfulSearchWidget: { style: { visibility: "hidden" } },
    blocksContainer: { x: 0, y: 0 },
    canvas: { width: 800, height: 600 },
    turtleContainer: { scaleX: 1 },
    pasteBox: {
        createBox: jest.fn(),
        show: jest.fn(),
        getPos: jest.fn(() => [10, 20])
    },
    turtles: {
        running: jest.fn(() => false),
        setStageScale: jest.fn()
    },
    blocks: {
        activeBlock: null,
        extract: jest.fn(),
        moveStackRelative: jest.fn(),
        blockMoved: jest.fn(),
        adjustDocks: jest.fn(),
        prepareStackForCopy: jest.fn(),
        pasteStack: jest.fn(),
        bottomMostBlock: jest.fn(() => 100)
    },
    logo: {
        tempo: { speedUp: jest.fn(), slowDown: jest.fn() },
        doStopTurtles: jest.fn()
    },
    toolbar: { highlightStop: jest.fn() },
    palettes: {
        activePalette: null,
        mouseOver: false,
        buttons: { rhythm: { y: 100 } },
        hidePaletteIconCircles: jest.fn(),
        menuScrollEvent: jest.fn()
    },
    save: { saveBlockArtwork: jest.fn() },
    textMsg: jest.fn(),
    pasted: jest.fn(),
    _allClear: jest.fn(),
    _doFastButton: jest.fn(),
    _doHardStopButton: jest.fn(),
    _saveHelpBlocks: jest.fn(),
    workspaceLayoutController: { _findBlocks: jest.fn() }
});

const makeEvent = (overrides = {}) => ({
    keyCode: 0,
    key: "",
    altKey: false,
    ctrlKey: false,
    shiftKey: false,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    ...overrides
});

const KEYCODE = {
    UP: 38,
    DOWN: 40,
    LEFT: 37,
    RIGHT: 39,
    SPACE: 32,
    HOME: 36,
    END: 35,
    PAGE_UP: 33,
    PAGE_DOWN: 34,
    DEL: 46,
    V: 86,
    C: 67,
    R: 82
};

// ---------------------------------------------------------------------------
// Controller lifecycle bookkeeping — every controller created in a test is
// disposed afterwards so listeners never leak across tests on the shared
// jsdom document.
// ---------------------------------------------------------------------------

let controllers;

beforeEach(() => {
    controllers = [];
});

afterEach(() => {
    controllers.forEach(controller => controller.dispose());
    controllers = [];
});

const createController = activity => {
    const controller = setupKeyboardController(activity);
    controllers.push(controller);
    return controller;
};

const dispatchKeydown = props => {
    const event = new Event("keydown", { cancelable: true });
    Object.defineProperty(event, "keyCode", { value: props.keyCode ?? 0, configurable: true });
    Object.defineProperty(event, "key", { value: props.key ?? "", configurable: true });
    Object.defineProperty(event, "altKey", { value: !!props.altKey, configurable: true });
    Object.defineProperty(event, "ctrlKey", { value: !!props.ctrlKey, configurable: true });
    Object.defineProperty(event, "shiftKey", { value: !!props.shiftKey, configurable: true });
    document.dispatchEvent(event);
    return event;
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("KeyboardController", () => {
    describe("setup", () => {
        it("attaches the controller to the activity instance", () => {
            const activity = makeActivity();
            const controller = createController(activity);

            expect(activity.keyboardController).toBe(controller);
            expect(controller).toBeInstanceOf(KeyboardController);
        });
    });

    describe("current key code", () => {
        it("getCurrentKeyCode returns the latest key", () => {
            const activity = makeActivity();
            const controller = createController(activity);

            controller.__keyPressed(makeEvent({ keyCode: 65 }));

            expect(controller.getCurrentKeyCode()).toBe(65);
        });

        it("clearCurrentKeyCode resets state", () => {
            const activity = makeActivity();
            const controller = createController(activity);

            controller.__keyPressed(makeEvent({ keyCode: 65 }));
            expect(controller.getCurrentKeyCode()).toBe(65);

            controller.clearCurrentKeyCode();

            expect(controller.getCurrentKeyCode()).toBe(0);
            expect(activity.currentKey).toBe("");
        });
    });

    describe("listener lifecycle", () => {
        it("registers the keydown listener during setup", () => {
            const activity = makeActivity();
            createController(activity);

            dispatchKeydown({ keyCode: 65 });

            expect(activity.currentKeyCode).toBe(65);
        });

        it("dispose removes the listener", () => {
            const activity = makeActivity();
            const controller = createController(activity);

            dispatchKeydown({ keyCode: 65 });
            expect(activity.currentKeyCode).toBe(65);

            controller.dispose();
            dispatchKeydown({ keyCode: 66 });

            // No new key was recorded because the listener is gone.
            expect(activity.currentKeyCode).toBe(65);
        });

        it("calling dispose twice is safe", () => {
            const activity = makeActivity();
            const controller = createController(activity);

            expect(() => {
                controller.dispose();
                controller.dispose();
            }).not.toThrow();
        });
    });

    describe("arrow key navigation", () => {
        it("moves the active block up/down/left/right by half a block height", () => {
            const activity = makeActivity();
            activity.blocks.activeBlock = { id: "block-1" };
            const controller = createController(activity);

            controller.__keyPressed(makeEvent({ keyCode: KEYCODE.UP }));
            expect(activity.blocks.moveStackRelative).toHaveBeenCalledWith(
                activity.blocks.activeBlock,
                0,
                -10
            );

            controller.__keyPressed(makeEvent({ keyCode: KEYCODE.DOWN }));
            expect(activity.blocks.moveStackRelative).toHaveBeenCalledWith(
                activity.blocks.activeBlock,
                0,
                10
            );

            controller.__keyPressed(makeEvent({ keyCode: KEYCODE.LEFT }));
            expect(activity.blocks.moveStackRelative).toHaveBeenCalledWith(
                activity.blocks.activeBlock,
                -10,
                0
            );

            controller.__keyPressed(makeEvent({ keyCode: KEYCODE.RIGHT }));
            expect(activity.blocks.moveStackRelative).toHaveBeenCalledWith(
                activity.blocks.activeBlock,
                10,
                0
            );

            expect(activity.blocks.blockMoved).toHaveBeenCalledTimes(4);
            expect(activity.blocks.adjustDocks).toHaveBeenCalledTimes(4);
        });

        it("scrolls the stage container when there is no active block or palette", () => {
            const activity = makeActivity();
            activity.scrollBlockContainer = true;
            const controller = createController(activity);

            controller.__keyPressed(makeEvent({ keyCode: KEYCODE.LEFT }));
            expect(activity.blocksContainer.x).toBe(20);

            controller.__keyPressed(makeEvent({ keyCode: KEYCODE.RIGHT }));
            expect(activity.blocksContainer.x).toBe(0);
        });
    });

    describe("space bar play/stop", () => {
        it("starts playback when not running", () => {
            const activity = makeActivity();
            activity.turtles.running.mockReturnValue(false);
            const controller = createController(activity);

            controller.__keyPressed(makeEvent({ keyCode: KEYCODE.SPACE }));

            expect(activity.toolbar.highlightStop).toHaveBeenCalledWith("red");
            expect(activity._doFastButton).toHaveBeenCalled();
        });

        it("stops playback when running", () => {
            const activity = makeActivity();
            activity.turtles.running.mockReturnValue(true);
            const controller = createController(activity);

            controller.__keyPressed(makeEvent({ keyCode: KEYCODE.SPACE }));

            expect(activity._doHardStopButton).toHaveBeenCalled();
        });

        it("toggles stage scale on Shift+Space", () => {
            const activity = makeActivity();
            activity.turtleContainer.scaleX = 1;
            const controller = createController(activity);

            controller.__keyPressed(makeEvent({ keyCode: KEYCODE.SPACE, shiftKey: true }));

            expect(activity.turtles.setStageScale).toHaveBeenCalledWith(0.5);
        });
    });

    describe("copy/paste shortcuts", () => {
        it("Alt+C prepares the active stack for copy", () => {
            const activity = makeActivity();
            const controller = createController(activity);

            controller.__keyPressed(makeEvent({ keyCode: KEYCODE.C, altKey: true }));

            expect(activity.blocks.prepareStackForCopy).toHaveBeenCalled();
        });

        it("Alt+V pastes the copied stack", () => {
            const activity = makeActivity();
            const controller = createController(activity);

            controller.__keyPressed(makeEvent({ keyCode: KEYCODE.V, altKey: true }));

            expect(activity.blocks.pasteStack).toHaveBeenCalled();
        });

        it("Ctrl+V opens the paste box at the current scale", () => {
            const activity = makeActivity();
            const controller = createController(activity);

            controller.__keyPressed(makeEvent({ keyCode: KEYCODE.V, ctrlKey: true }));

            expect(activity.pasteBox.createBox).toHaveBeenCalledWith(
                activity.turtleBlocksScale,
                200,
                200
            );
            expect(activity.pasteBox.show).toHaveBeenCalled();
            expect(activity.paste.style.visibility).toBe("visible");
        });
    });

    describe("tempo widget integration", () => {
        it("speeds up tempo on the up arrow while the tempo widget is active", () => {
            const activity = makeActivity();
            activity.inTempoWidget = true;
            const controller = createController(activity);

            controller.__keyPressed(makeEvent({ keyCode: KEYCODE.UP }));

            expect(activity.logo.tempo.speedUp).toHaveBeenCalledWith(0);
            expect(activity.blocks.moveStackRelative).not.toHaveBeenCalled();
        });

        it("slows down tempo on the down arrow while the tempo widget is active", () => {
            const activity = makeActivity();
            activity.inTempoWidget = true;
            const controller = createController(activity);

            controller.__keyPressed(makeEvent({ keyCode: KEYCODE.DOWN }));

            expect(activity.logo.tempo.slowDown).toHaveBeenCalledWith(0);
        });
    });

    describe("modifier keys", () => {
        it("Alt+R starts playback", () => {
            const activity = makeActivity();
            const controller = createController(activity);

            controller.__keyPressed(makeEvent({ keyCode: KEYCODE.R, altKey: true }));

            expect(activity.toolbar.highlightStop).toHaveBeenCalledWith("red");
            expect(activity._doFastButton).toHaveBeenCalled();
        });

        it("Alt+ENTER stops a running project", () => {
            const activity = makeActivity();
            activity.turtles.running.mockReturnValue(true);
            const controller = createController(activity);

            controller.__keyPressed(makeEvent({ keyCode: 13, altKey: true }));

            expect(activity._doHardStopButton).toHaveBeenCalled();
        });

        it("plain ENTER starts playback when nothing is running", () => {
            const activity = makeActivity();
            activity.turtles.running.mockReturnValue(false);
            const controller = createController(activity);

            controller.__keyPressed(makeEvent({ keyCode: 13 }));

            expect(activity.toolbar.highlightStop).toHaveBeenCalledWith("red");
            expect(activity._doFastButton).toHaveBeenCalled();
        });
    });

    describe("ignores shortcuts while a text input is active", () => {
        it("does nothing when the keyboard is disabled", () => {
            const activity = makeActivity();
            activity.keyboardEnableFlag = false;
            const controller = createController(activity);

            controller.__keyPressed(makeEvent({ keyCode: KEYCODE.DEL }));

            expect(activity.blocks.extract).not.toHaveBeenCalled();
        });

        it("does nothing when a tracked text field has focus", () => {
            const activity = makeActivity();
            elementRegistry.musicratio1 = makeElement({
                classList: { contains: jest.fn(cls => cls === "hasKeyboard") }
            });
            const controller = createController(activity);

            controller.__keyPressed(makeEvent({ keyCode: KEYCODE.DEL }));

            expect(activity.blocks.extract).not.toHaveBeenCalled();
        });

        it("suppresses play/stop while isInputON is set", () => {
            const activity = makeActivity();
            activity.isInputON = true;
            const controller = createController(activity);

            controller.__keyPressed(makeEvent({ keyCode: KEYCODE.SPACE }));

            expect(activity._doFastButton).not.toHaveBeenCalled();
            expect(activity.toolbar.highlightStop).not.toHaveBeenCalled();
        });
    });

    describe("palette scrolling", () => {
        it("scrolls the active palette on the up/down arrows when no block is active", () => {
            const activity = makeActivity();
            activity.palettes.activePalette = {
                scrollEvent: jest.fn(),
                scrollDiff: 40
            };
            const controller = createController(activity);

            controller.__keyPressed(makeEvent({ keyCode: KEYCODE.UP }));
            expect(activity.palettes.activePalette.scrollEvent).toHaveBeenCalledWith(20, 1);

            controller.__keyPressed(makeEvent({ keyCode: KEYCODE.DOWN }));
            expect(activity.palettes.activePalette.scrollEvent).toHaveBeenCalledWith(-20, 1);
        });

        it("scrolls the palette menu home when the mouse is over the palette", () => {
            const activity = makeActivity();
            activity.palettes.mouseOver = true;
            activity.palettes.buttons.rhythm.y = 10;
            const controller = createController(activity);

            controller.__keyPressed(makeEvent({ keyCode: KEYCODE.HOME }));

            expect(activity.palettes.menuScrollEvent).toHaveBeenCalledWith(1, 45);
            expect(activity.palettes.hidePaletteIconCircles).toHaveBeenCalled();
        });
    });

    describe("stage scrolling", () => {
        it("jumps to the bottom of the page on END", () => {
            const activity = makeActivity();
            const controller = createController(activity);

            controller.__keyPressed(makeEvent({ keyCode: KEYCODE.END }));

            expect(activity.blocksContainer.y).toBe(-100 + 300);
        });

        it("scrolls up/down a half page on PAGE_UP/PAGE_DOWN", () => {
            const activity = makeActivity();
            const controller = createController(activity);

            controller.__keyPressed(makeEvent({ keyCode: KEYCODE.PAGE_UP }));
            expect(activity.blocksContainer.y).toBe(300);

            controller.__keyPressed(makeEvent({ keyCode: KEYCODE.PAGE_DOWN }));
            expect(activity.blocksContainer.y).toBe(0);
        });

        it("brings all blocks home when there is no active block or palette", () => {
            const activity = makeActivity();
            const controller = createController(activity);

            controller.__keyPressed(makeEvent({ keyCode: KEYCODE.HOME }));

            expect(activity.workspaceLayoutController._findBlocks).toHaveBeenCalled();
        });
    });
});
