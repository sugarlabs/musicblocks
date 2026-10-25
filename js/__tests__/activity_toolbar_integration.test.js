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

const { loadActivitySandbox } = require("./helpers/activity-vm-sandbox");

// This test only exercises Activity's own toolbar-delegation methods, so
// setupProjectManager stays mocked (the shared helper's default) rather than
// wiring in the real ProjectManager - that real wiring is covered by
// activity-projectmanager-integration.test.js.
const loadActivityClass = (overrides = {}) =>
    loadActivitySandbox({
        overrides: {
            createjs: {
                Tween: {
                    hasActiveTweens: jest.fn(() => false)
                }
            },
            requestAnimationFrame: (...args) => global.requestAnimationFrame(...args),
            cancelAnimationFrame: (...args) => global.cancelAnimationFrame(...args),
            ...overrides
        }
    });

describe("Activity Toolbar Integration", () => {
    let Activity;
    let activity;
    let mockElement;
    let announceToScreenReader;

    beforeAll(() => {
        const sandbox = loadActivityClass();
        Activity = sandbox.Activity;
        announceToScreenReader = sandbox.announceToScreenReader;
    });

    beforeEach(() => {
        announceToScreenReader.mockClear();

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
            offsetHeight: 40,
            click: jest.fn()
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

        activity.textMsg = jest.fn();

        global.window.widgetWindows = {
            isOpen: jest.fn(() => false),
            openWindows: {}
        };

        global.hideDOMLabel = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("keeps coordinate grids aligned with the turtle stage after resize", () => {
        const canvas = { width: 0, height: 0 };
        const overlayCanvas = { width: 0, height: 0 };
        const makeBitmap = () => ({ x: 0, y: 0 });
        const gridNames = [
            "cartesian",
            "polar",
            "treble",
            "grand",
            "soprano",
            "alto",
            "tenor",
            "bass"
        ];
        const accidentalNames = ["grand", "treble", "soprano", "alto", "tenor", "bass"];

        activity.canvas = canvas;
        activity.stage = { canvas, scaleX: 1, scaleY: 1 };
        activity.toolbarHeight = 80;
        activity.turtleBlocksScale = 1;
        activity.turtles = {
            doScale: jest.fn(),
            getTurtleCount: jest.fn(() => 0)
        };
        activity.boundary = { setScale: jest.fn() };
        activity.trashcan = { resizeEvent: jest.fn() };
        activity.setupPaletteMenu = jest.fn();
        activity.palettes = { setMobile: jest.fn() };
        activity.blocks = { checkBounds: jest.fn() };

        for (const name of gridNames) {
            activity[`${name}Bitmap`] = makeBitmap();
        }

        for (const name of accidentalNames) {
            activity[`${name}SharpBitmap`] = Array.from({ length: 7 }, makeBitmap);
            activity[`${name}FlatBitmap`] = Array.from({ length: 7 }, makeBitmap);
        }

        document.getElementById = jest.fn(id =>
            id === "overlayCanvas" ? overlayCanvas : mockElement
        );

        activity._onResize(true);

        expect(activity.cartesianBitmap.y).toBe(
            canvas.height / (2 * activity.turtleBlocksScale) - 450 + activity.toolbarHeight
        );
        expect(activity.grandSharpBitmap[1].y).toBe(
            canvas.height / (2 * activity.turtleBlocksScale) - 412.5 + activity.toolbarHeight
        );
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

        test("pauses and resumes tempo when tempoWidgetID is present in DOM", () => {
            activity.turtles.running.mockReturnValue(false);
            activity.logo.tempo.isMoving = true;
            const tempoTitle = document.createElement("div");
            tempoTitle.id = "tempoWidgetID";
            document.body.appendChild(tempoTitle);

            activity._doFastButton("normal-env");

            expect(activity.logo.tempo.pause).toHaveBeenCalled();
            expect(activity.logo.tempo.resume).toHaveBeenCalled();

            document.body.removeChild(tempoTitle);
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

        test("pauses tempo when tempoWidgetID is present in DOM", () => {
            activity.toolbarController.hardStop.mockReturnValue(true);
            activity.logo.tempo.isMoving = true;
            const tempoTitle = document.createElement("div");
            tempoTitle.id = "tempoWidgetID";
            document.body.appendChild(tempoTitle);

            activity._doHardStopButton(false);

            expect(activity.logo.tempo.pause).toHaveBeenCalled();

            document.body.removeChild(tempoTitle);
        });
    });

    describe("onStopTurtle", () => {
        test("calls resetStop when execution finishes", () => {
            activity.onStopTurtle();

            expect(activity.toolbar.resetStop).toHaveBeenCalled();
        });

        test("announces that execution stopped without showing a visible notification", () => {
            activity.onStopTurtle();

            expect(announceToScreenReader).toHaveBeenCalledWith("Program stopped.");
            expect(activity.textMsg).not.toHaveBeenCalled();
        });
    });

    describe("onRunTurtle", () => {
        test("announces that execution started without showing a visible notification", () => {
            activity.onRunTurtle();

            expect(announceToScreenReader).toHaveBeenCalledWith("Program running.");
            expect(activity.textMsg).not.toHaveBeenCalled();
        });
    });

    describe("onRunTurtle", () => {
        // Logo calls onRunTurtle() from runLogoCommands(), which is the one
        // point every way of starting a project passes through -- including a
        // click on a Start block, which never goes near the toolbar handlers.
        test("shows the stop button when execution starts", () => {
            activity.onRunTurtle();

            expect(activity.toolbar.highlightStop).toHaveBeenCalledWith("red");
        });

        test("is the mirror image of onStopTurtle", () => {
            activity.onRunTurtle();
            expect(activity.toolbar.highlightStop).toHaveBeenCalledTimes(1);
            expect(activity.toolbar.resetStop).not.toHaveBeenCalled();

            activity.onStopTurtle();
            expect(activity.toolbar.resetStop).toHaveBeenCalledTimes(1);
            expect(activity.toolbar.highlightStop).toHaveBeenCalledTimes(1);
        });
    });
    describe("beforeunload event", () => {
        test("calls __saveLocally", () => {
            activity.__saveLocally = jest.fn();
            activity._stopRenderLoop = jest.fn();

            activity._handleBeforeUnload();

            expect(activity.__saveLocally).toHaveBeenCalled();
        });

        test("calls saveLocally when it differs from __saveLocally", () => {
            activity.__saveLocally = jest.fn();
            activity.saveLocally = jest.fn();
            activity._stopRenderLoop = jest.fn();

            activity._handleBeforeUnload();

            expect(activity.saveLocally).toHaveBeenCalled();
        });

        test("calls _stopAutoSave if it exists", () => {
            activity.__saveLocally = jest.fn();
            activity._stopRenderLoop = jest.fn();
            activity._stopAutoSave = jest.fn();

            activity._handleBeforeUnload();

            expect(activity._stopAutoSave).toHaveBeenCalled();
        });
    });

    describe("Render Loop (_startRenderLoop and _stopRenderLoop)", () => {
        let rafCallbacks;
        let nextRafId;
        let originalRaf;
        let originalCaf;

        beforeEach(() => {
            rafCallbacks = new Map();
            nextRafId = 1;
            originalRaf = global.requestAnimationFrame;
            originalCaf = global.cancelAnimationFrame;

            global.requestAnimationFrame = jest.fn(cb => {
                const id = nextRafId++;
                rafCallbacks.set(id, cb);
                return id;
            });
            global.cancelAnimationFrame = jest.fn(id => {
                rafCallbacks.delete(id);
            });
            window.requestAnimationFrame = global.requestAnimationFrame;
            window.cancelAnimationFrame = global.cancelAnimationFrame;

            activity.stage = {
                update: jest.fn()
            };
            activity.selectionController = {
                isDragging: false,
                isSelecting: false
            };
            activity.gifAnimator = null;
            activity.blocks = null;
            activity.blocksContainer = null;
            activity.stageDirty = false;
            activity._renderLoopRunning = false;
            activity._renderLoopRafId = null;
        });

        afterEach(() => {
            global.requestAnimationFrame = originalRaf;
            global.cancelAnimationFrame = originalCaf;
            window.requestAnimationFrame = originalRaf;
            window.cancelAnimationFrame = originalCaf;
        });

        const flushRaf = id => {
            const cb = rafCallbacks.get(id);
            if (cb) {
                rafCallbacks.delete(id);
                cb();
            }
        };

        test("does not schedule a new RAF when already running", () => {
            activity._renderLoopRunning = true;
            activity._startRenderLoop();
            expect(global.requestAnimationFrame).not.toHaveBeenCalled();
        });

        test("renderLoop returns early if loop was stopped before callback executes", () => {
            activity._startRenderLoop();
            const rafId = activity._renderLoopRafId;
            activity._renderLoopRunning = false;

            flushRaf(rafId);
            expect(activity.stage.update).not.toHaveBeenCalled();
        });

        test("re-queues RAF when stage is not yet initialized", () => {
            activity.stage = null;
            activity._startRenderLoop();
            const firstId = activity._renderLoopRafId;

            flushRaf(firstId);
            expect(activity._renderLoopRafId).not.toBeNull();
            expect(activity._renderLoopRafId).not.toBe(firstId);
        });

        test("performs clean render, clears stageDirty before update, and transitions to idle when clean", () => {
            let stageDirtyDuringUpdate = null;
            activity.stage.update = jest.fn(() => {
                stageDirtyDuringUpdate = activity.stageDirty;
            });
            activity.stageDirty = true;

            activity._startRenderLoop();
            const rafId = activity._renderLoopRafId;

            flushRaf(rafId);

            expect(activity.stage.update).toHaveBeenCalledTimes(1);
            expect(stageDirtyDuringUpdate).toBe(false);
            expect(activity.stageDirty).toBe(false);
            expect(activity._renderLoopRunning).toBe(false);
            expect(activity._renderLoopRafId).toBeNull();
        });

        test("transitions to idle immediately when called with clean stage and no active animations", () => {
            activity.stageDirty = false;

            activity._startRenderLoop();
            const rafId = activity._renderLoopRafId;

            flushRaf(rafId);

            expect(activity.stage.update).not.toHaveBeenCalled();
            expect(activity._renderLoopRunning).toBe(false);
            expect(activity._renderLoopRafId).toBeNull();
        });

        test("re-queues next frame if stageDirty is set during stage.update()", () => {
            activity.stage.update = jest.fn(() => {
                activity.stageDirty = true;
            });
            activity.stageDirty = true;

            activity._startRenderLoop();
            const firstId = activity._renderLoopRafId;

            flushRaf(firstId);

            expect(activity.stage.update).toHaveBeenCalledTimes(1);
            expect(activity._renderLoopRunning).toBe(true);
            expect(activity._renderLoopRafId).not.toBeNull();
            expect(activity._renderLoopRafId).not.toBe(firstId);
        });

        test("recomputes viewport culling when container position changes", () => {
            const updateCullingSpy = jest.fn();
            activity.blocks = { _updateViewportCulling: updateCullingSpy };
            activity.blocksContainer = { x: 120, y: 340 };
            activity._lastCullContainerX = 0;
            activity._lastCullContainerY = 0;
            activity.stageDirty = true;

            activity._startRenderLoop();
            const rafId = activity._renderLoopRafId;

            flushRaf(rafId);

            expect(updateCullingSpy).toHaveBeenCalledTimes(1);
            expect(activity._lastCullContainerX).toBe(120);
            expect(activity._lastCullContainerY).toBe(340);
        });

        test("catches error during stage.update, sets stageDirty to retry, logs error, and retries in next frame", () => {
            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
            const renderError = new Error("Stage update failed");
            let updateAttempts = 0;
            activity.stage.update = jest.fn(() => {
                updateAttempts++;
                if (updateAttempts === 1) {
                    throw renderError;
                }
            });
            activity.stageDirty = true;

            activity._startRenderLoop();
            const firstId = activity._renderLoopRafId;

            flushRaf(firstId);

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "Music Blocks: render frame failed",
                renderError
            );
            expect(activity.stageDirty).toBe(true);
            expect(activity._renderLoopRunning).toBe(true);
            const secondId = activity._renderLoopRafId;
            expect(secondId).not.toBeNull();
            expect(secondId).not.toBe(firstId);

            // Second frame retries stage.update and completes cleanly
            flushRaf(secondId);

            expect(activity.stage.update).toHaveBeenCalledTimes(2);
            expect(activity.stageDirty).toBe(false);
            expect(activity._renderLoopRunning).toBe(false);
            expect(activity._renderLoopRafId).toBeNull();

            consoleErrorSpy.mockRestore();
        });

        test("keeps loop running when active tweens, active gifs, or interactions are ongoing", () => {
            activity.stageDirty = true;
            activity.selectionController.isDragging = true;

            activity._startRenderLoop();
            const firstId = activity._renderLoopRafId;

            flushRaf(firstId);

            expect(activity.stage.update).toHaveBeenCalledTimes(1);
            expect(activity._renderLoopRunning).toBe(true);
            expect(activity._renderLoopRafId).not.toBeNull();
            expect(activity._renderLoopRafId).not.toBe(firstId);
        });

        test("keeps loop running when selection is active", () => {
            activity.stageDirty = true;
            activity.selectionController.isSelecting = true;

            activity._startRenderLoop();
            const firstId = activity._renderLoopRafId;

            flushRaf(firstId);

            expect(activity._renderLoopRunning).toBe(true);
            expect(activity._renderLoopRafId).not.toBeNull();
        });

        test("keeps loop running when active GIFs are playing", () => {
            activity.stageDirty = true;
            activity.gifAnimator = { getActiveCount: () => 2 };

            activity._startRenderLoop();
            const firstId = activity._renderLoopRafId;

            flushRaf(firstId);

            expect(activity._renderLoopRunning).toBe(true);
            expect(activity._renderLoopRafId).not.toBeNull();
        });

        test("_stopRenderLoop stops running state and cancels active RAF", () => {
            activity._renderLoopRunning = true;
            activity._renderLoopRafId = 99;

            activity._stopRenderLoop();

            expect(activity._renderLoopRunning).toBe(false);
            expect(activity._renderLoopRafId).toBeNull();
            expect(global.cancelAnimationFrame).toHaveBeenCalledWith(99);
        });
    });
    describe("sendAllToTrash and pasted Object.keys loop execution", () => {
        test("sendAllToTrash iterates Object.keys on palettes and blockList to move blocks to trash", () => {
            const hideMenu = jest.fn();
            activity.palettes = { dict: { rhythm: { hideMenu } } };
            const mockBlock = {
                connections: [null],
                name: "pitch",
                trash: false,
                hide: jest.fn(),
                container: { uncache: jest.fn() }
            };
            activity.blocks = {
                palettes: activity.palettes,
                blockList: [mockBlock],
                _beginDeferCheckBounds: jest.fn(),
                _endDeferCheckBounds: jest.fn(),
                captureStackPreview: jest.fn(() => "preview"),
                trashPreviews: {},
                trashStacks: [],
                moveBlockRelative: jest.fn(),
                blockArt: {},
                blockCollapseArt: {}
            };
            activity.blocksContainer = { x: 50, y: 50 };
            activity.refreshCanvas = jest.fn();
            activity.saveLocally = jest.fn();
            activity.stage = { dispatchEvent: jest.fn() };

            activity.sendAllToTrash(false, true, false);

            expect(activity.blocksContainer.x).toBe(0);
            expect(activity.blocksContainer.y).toBe(0);
            expect(hideMenu).toHaveBeenCalledWith(true);
            expect(activity.blocks._beginDeferCheckBounds).toHaveBeenCalled();
            expect(activity.blocks._endDeferCheckBounds).toHaveBeenCalled();
            expect(mockBlock.trash).toBe(true);
            expect(mockBlock.hide).toHaveBeenCalled();
            expect(mockBlock.container.uncache).toHaveBeenCalled();
            expect(activity.blocks.trashStacks).toContain("0");
            expect(activity.blocks.trashPreviews["0"]).toBe("preview");
        });

        test("sendAllToTrash does not record blocks that are already in the trash again", () => {
            activity.palettes = { dict: {} };
            const makeBlock = trash => ({
                connections: [null],
                name: "pitch",
                trash,
                hide: jest.fn(),
                container: { uncache: jest.fn() }
            });
            const trashed = makeBlock(true);
            const live = makeBlock(false);
            activity.blocks = {
                palettes: activity.palettes,
                blockList: [trashed, null, live],
                _beginDeferCheckBounds: jest.fn(),
                _endDeferCheckBounds: jest.fn(),
                captureStackPreview: jest.fn(() => "preview"),
                trashPreviews: {},
                trashStacks: ["0"],
                moveBlockRelative: jest.fn(),
                blockArt: {},
                blockCollapseArt: {}
            };
            activity.blocksContainer = { x: 0, y: 0 };
            activity.refreshCanvas = jest.fn();
            activity.stage = { dispatchEvent: jest.fn() };

            activity.sendAllToTrash(false, true, false);

            expect(activity.blocks.trashStacks).toEqual(["0", "2"]);
            expect(activity.blocks.captureStackPreview).toHaveBeenCalledTimes(1);
            expect(activity.blocks.moveBlockRelative).toHaveBeenCalledTimes(1);
            expect(trashed.hide).not.toHaveBeenCalled();
            expect(live.trash).toBe(true);
        });

        test("sendAllToTrash hides the turtle of a start block and removes an action", () => {
            activity.palettes = { dict: {} };
            const makeBlock = (name, value) => ({
                connections: [null],
                name,
                value,
                trash: false,
                hide: jest.fn(),
                container: { uncache: jest.fn() }
            });
            const start = makeBlock("start", 0);
            const action = makeBlock("action", null);
            const turtle = { inTrash: false, container: { visible: true }, companionTurtle: null };
            activity.turtles = { getTurtle: jest.fn(() => turtle) };
            activity.blocks = {
                palettes: activity.palettes,
                blockList: [start, action],
                _beginDeferCheckBounds: jest.fn(),
                _endDeferCheckBounds: jest.fn(),
                captureStackPreview: jest.fn(),
                deleteActionBlock: jest.fn(),
                trashPreviews: {},
                trashStacks: [],
                moveBlockRelative: jest.fn(),
                blockArt: {},
                blockCollapseArt: {}
            };
            activity.blocksContainer = { x: 0, y: 0 };
            activity.refreshCanvas = jest.fn();
            activity.stage = { dispatchEvent: jest.fn() };

            activity.sendAllToTrash(false, true, false);

            expect(turtle.inTrash).toBe(true);
            expect(turtle.container.visible).toBe(false);
            expect(activity.blocks.deleteActionBlock).toHaveBeenCalledWith(action);
        });

        test("clearCache skips empty and trashed slots in blockList", () => {
            const makeBlock = trash => ({
                trash,
                container: { uncache: jest.fn(), cache: jest.fn() },
                bitmap: { uncache: jest.fn(), cache: jest.fn() }
            });
            const live = makeBlock(false);
            const trashed = makeBlock(true);
            activity.blocks = { blockList: [null, live, trashed] };

            expect(() => activity.clearCache()).not.toThrow();
            expect(live.container.cache).toHaveBeenCalled();
            expect(live.bitmap.cache).toHaveBeenCalled();
            expect(trashed.container.cache).not.toHaveBeenCalled();
        });

        test("pasted iterates Object.keys on palettes.dict and loads blocks", () => {
            const hideMenu = jest.fn();
            activity.palettes = { dict: { rhythm: { hideMenu } } };
            activity.blocks = { loadNewBlocks: jest.fn() };
            activity.pasteBox = { hide: jest.fn() };
            activity.refreshCanvas = jest.fn();

            const pasteElem = { value: JSON.stringify([{ name: "pitch" }]) };
            document.getElementById = jest.fn(id => (id === "paste" ? pasteElem : null));

            activity.pasted();

            expect(hideMenu).toHaveBeenCalledWith(true);
            expect(activity.refreshCanvas).toHaveBeenCalled();
            expect(activity.blocks.loadNewBlocks).toHaveBeenCalledWith([{ name: "pitch" }]);
            expect(activity.pasteBox.hide).toHaveBeenCalled();
        });
    });

    describe("Window resize and viewport handling", () => {
        let resizeActivity;
        let mockContainer;
        let mockMyCanvas;
        let mockCanvas;
        let mockCanvasHolder;
        let mockHideContents;
        let origGetElementById;
        let origInnerWidth;
        let origInnerHeight;
        let origOuterWidth;
        let origOuterHeight;
        let origPlatform;
        let origGlobalPlatform;
        let origHidden;

        beforeEach(() => {
            origGetElementById = document.getElementById;
            origInnerWidth = window.innerWidth;
            origInnerHeight = window.innerHeight;
            origOuterWidth = window.outerWidth;
            origOuterHeight = window.outerHeight;
            origPlatform = window.platform;
            origGlobalPlatform = global.platform;
            origHidden = document.hidden;

            mockContainer = { style: {} };
            mockMyCanvas = { width: 0, height: 0 };
            mockCanvas = { width: 0, height: 0 };
            mockCanvasHolder = { width: 0, height: 0 };
            mockHideContents = { click: jest.fn() };

            document.getElementById = jest.fn(id => {
                if (id === "canvasContainer") return mockContainer;
                if (id === "myCanvas") return mockMyCanvas;
                if (id === "canvas") return mockCanvas;
                if (id === "canvasHolder") return mockCanvasHolder;
                if (id === "hideContents") return mockHideContents;
                return origGetElementById.call(document, id);
            });

            resizeActivity = new Activity();
            resizeActivity._handleRepositionBlocksOnResize = jest.fn();
        });

        afterEach(() => {
            jest.useRealTimers();
            document.getElementById = origGetElementById;
            window.innerWidth = origInnerWidth;
            window.innerHeight = origInnerHeight;
            window.outerWidth = origOuterWidth;
            window.outerHeight = origOuterHeight;
            window.platform = origPlatform;
            global.platform = origGlobalPlatform;
            Object.defineProperty(document, "hidden", { value: origHidden, configurable: true });
        });

        test("handleResize resizes canvas and container to full viewport without clamping", () => {
            Object.defineProperty(document, "hidden", { value: false, configurable: true });
            window.innerWidth = 1920;
            window.innerHeight = 1080;

            mockHideContents.click.mockClear();
            resizeActivity.refreshCanvas = jest.fn();
            resizeActivity._handleOrientationChangeResize();

            expect(mockContainer.style.width).toBe("1920px");
            expect(mockContainer.style.height).toBe("1080px");
            expect(mockMyCanvas.width).toBe(1920);
            expect(mockMyCanvas.height).toBe(1080);
            expect(mockCanvas.width).toBe(1920);
            expect(mockCanvas.height).toBe(1080);
            expect(mockCanvasHolder.width).toBe(1920);
            expect(mockCanvasHolder.height).toBe(1080);
            expect(mockHideContents.click).toHaveBeenCalled();
            expect(resizeActivity.refreshCanvas).toHaveBeenCalled();

            // Early exit if document is hidden
            Object.defineProperty(document, "hidden", { value: true, configurable: true });
            resizeActivity.refreshCanvas.mockClear();
            resizeActivity._handleOrientationChangeResize();
            expect(resizeActivity.refreshCanvas).not.toHaveBeenCalled();

            // Early exit if width is zero or invalid
            Object.defineProperty(document, "hidden", { value: false, configurable: true });
            resizeActivity.refreshCanvas.mockClear();
            window.innerWidth = 0;
            window.innerHeight = 1080;
            resizeActivity._handleOrientationChangeResize();
            expect(resizeActivity.refreshCanvas).not.toHaveBeenCalled();
            expect(mockContainer.style.width).toBe("1920px");
            expect(mockContainer.style.height).toBe("1080px");
            expect(mockMyCanvas.width).toBe(1920);
            expect(mockMyCanvas.height).toBe(1080);

            // Early exit if height is zero or invalid
            window.innerWidth = 1920;
            window.innerHeight = 0;
            resizeActivity._handleOrientationChangeResize();
            expect(resizeActivity.refreshCanvas).not.toHaveBeenCalled();
            expect(mockContainer.style.width).toBe("1920px");
            expect(mockContainer.style.height).toBe("1080px");
            expect(mockMyCanvas.width).toBe(1920);
            expect(mockMyCanvas.height).toBe(1080);
        });

        test("handleResize uses outerWidth and outerHeight when platform.androidWebkit is true", () => {
            Object.defineProperty(document, "hidden", { value: false, configurable: true });
            window.platform = { androidWebkit: true };
            global.platform = window.platform;
            window.innerWidth = 800;
            window.innerHeight = 600;
            window.outerWidth = 1080;
            window.outerHeight = 1920;

            mockHideContents.click.mockClear();
            resizeActivity.refreshCanvas = jest.fn();
            resizeActivity._handleOrientationChangeResize();

            expect(mockContainer.style.width).toBe("1080px");
            expect(mockContainer.style.height).toBe("1920px");
            expect(mockMyCanvas.width).toBe(1080);
            expect(mockMyCanvas.height).toBe(1920);
            expect(mockCanvas.width).toBe(1080);
            expect(mockCanvas.height).toBe(1920);
            expect(mockCanvasHolder.width).toBe(1080);
            expect(mockCanvasHolder.height).toBe(1920);
            expect(mockHideContents.click).toHaveBeenCalled();
            expect(resizeActivity.refreshCanvas).toHaveBeenCalled();
        });

        test("_handleWindowResize debounces and calls handleResize and setupPaletteMenu", () => {
            jest.useFakeTimers();
            resizeActivity.setupPaletteMenu = jest.fn();
            resizeActivity.refreshCanvas = jest.fn();

            window.innerWidth = 1440;
            window.innerHeight = 900;

            resizeActivity._handleWindowResize();
            expect(resizeActivity.setupPaletteMenu).not.toHaveBeenCalled();

            jest.advanceTimersByTime(100);
            resizeActivity._handleWindowResize();
            jest.advanceTimersByTime(100);
            expect(resizeActivity.setupPaletteMenu).not.toHaveBeenCalled();
            expect(resizeActivity.refreshCanvas).not.toHaveBeenCalled();

            jest.advanceTimersByTime(100);
            expect(resizeActivity.setupPaletteMenu).toHaveBeenCalledTimes(1);
            expect(resizeActivity.refreshCanvas).toHaveBeenCalledTimes(1);
            expect(mockMyCanvas.width).toBe(1440);
            expect(mockMyCanvas.height).toBe(900);
        });
    });
});
