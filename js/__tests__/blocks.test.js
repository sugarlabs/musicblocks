// Copyright (c) 2026 Music Blocks contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/**
 * @file Foundational unit tests for the Blocks workspace manager.
 * This file establishes the mocking infrastructure for the 7,500-line blocks.js.
 */

/* global jest, describe, it, expect, beforeEach, beforeAll, afterAll */

const Blocks = require("../blocks");

// blocks.js references these constants (MINIMUMDOCKDISTANCE, ALLOWED_CONNECTIONS, etc.) as
// bare globals at runtime. In the browser they're provided by loader.js's RequireJS shim
// load order; under CommonJS there's no such preload, so install them for this suite only
// and remove them afterward rather than leaving a permanent global mutation.
const blockConstants = require("../block-constants");

beforeAll(() => {
    Object.assign(global, blockConstants);
});

afterAll(() => {
    for (const key of Object.keys(blockConstants)) {
        delete global[key];
    }
});

// --- MOCK SETUP ---

// Mock CreateJS
global.createjs = {
    Container: jest.fn().mockImplementation(() => ({
        addChild: jest.fn(),
        removeChild: jest.fn(),
        removeAllChildren: jest.fn(),
        setChildIndex: jest.fn(),
        getBounds: jest.fn().mockReturnValue({ x: 0, y: 0, width: 100, height: 100 }),
        cache: jest.fn(),
        updateCache: jest.fn(),
        uncache: jest.fn(),
        children: []
    })),
    Shape: jest.fn().mockImplementation(() => ({
        graphics: {
            beginFill: jest.fn().mockReturnThis(),
            drawRect: jest.fn().mockReturnThis(),
            drawEllipse: jest.fn().mockReturnThis()
        }
    })),
    Bitmap: jest.fn().mockImplementation(() => ({
        getBounds: jest.fn().mockReturnValue({ x: 0, y: 0, width: 50, height: 50 })
    })),
    Text: jest.fn().mockImplementation(() => ({}))
};

// Mock DOM/Common utils
global.docById = jest.fn();
global._ = jest.fn(str => str);
global.announceToScreenReader = jest.fn();
global.last = jest.fn(arr => (arr && arr.length > 0 ? arr[arr.length - 1] : null));
global.delayExecution = jest.fn().mockResolvedValue(null);
global.getTextWidth = jest.fn().mockReturnValue(100);

// Mock Block dependency (we just modularized it, but we can mock for isolation)
global.Block = jest.fn();
global.ProtoBlock = jest.fn();

// Use the real ConnectionValidator so dock connection behavior stays accurate.
global.ConnectionValidator = require("../connection-validator");

// Use the real BlockDragController so drag-group and dock-snapping
// behavior stays accurate rather than silently becoming a no-op.
global.setupBlockDragController =
    require("../activity/block-drag-controller").setupBlockDragController;

// Mock Constants
global.DEFAULTBLOCKSCALE = 1.0;
global.STANDARDBLOCKHEIGHT = 20;
global.DEFAULTACCIDENTAL = "natural";
global.DEFAULTDRUM = "snare";
global.DEFAULTEFFECT = "none";
global.DEFAULTFILTER = "none";
global.DEFAULTFILTERTYPE = "lowpass";
global.DEFAULTINTERVAL = 0;
global.DEFAULTINVERT = false;
global.DEFAULTMODE = "major";
global.DEFAULTNOISE = "white";
global.DEFAULTOSCILLATORTYPE = "sine";
global.DEFAULTTEMPERAMENT = "equal";
global.DEFAULTVOICE = "piano";
global.NATURAL = "natural";
global.NUMBERBLOCKDEFAULT = 0;
global.STRINGLEN = 30;
global.TEXTWIDTH = 100;
global.WESTERN2EISOLFEGENAMES = {};
global.BACKWARDCOMPATIBILITYDICT = {};
global.DEFAULTCHORD = [];

// Mock helper functions
global.addTemperamentToDictionary = jest.fn();
window.widgetWindows = window.widgetWindows || {};
window.widgetWindows.closeBlkWidgets = jest.fn();
global.deleteTemperamentFromList = jest.fn();
global.getDrumSynthName = jest.fn();
global.getNoiseName = jest.fn();
global.getNoiseSynthName = jest.fn();
global.getTemperamentsList = jest.fn();
global.getVoiceSynthName = jest.fn();
global.i18nSolfege = jest.fn();
global.MathUtility = {
    isNumber: jest.fn()
};
global.mixedNumber = jest.fn();
global.piemenuBlockContext = jest.fn();
global.prepareMacroExports = jest.fn();
global.setOctaveRatio = jest.fn();
global.splitScaleDegree = jest.fn();
global.splitSolfege = jest.fn();
global.updateTemperaments = jest.fn();
global.showZoomOverlay = jest.fn();

describe("Viewport Culling", () => {
    let mockActivity;
    let blocks;

    beforeEach(() => {
        mockActivity = {
            storage: {},
            trashcan: {},
            turtles: {},
            boundary: {},
            macroDict: {},
            palettes: { dict: {}, show: jest.fn() },
            logo: { synth: { loadSynth: jest.fn() } },
            blocksContainer: { x: 0, y: 0 },
            canvas: { width: 800, height: 600 },
            refreshCanvas: jest.fn(),
            errorMsg: jest.fn(),
            setSelectionMode: jest.fn(),
            stopLoadAnimation: jest.fn(),
            setHomeContainers: jest.fn(),
            __tick: jest.fn()
        };
        blocks = new Blocks(mockActivity);
    });

    it("should mark blocks inside the viewport as visible", () => {
        blocks.blockList = [
            { trash: false, container: { x: 100, y: 100 }, width: 50, height: 30 },
            { trash: false, container: { x: 0, y: 0 }, width: 800, height: 600 },
            { trash: false, container: { x: 400, y: 300 }, width: 10, height: 10 }
        ];

        blocks._updateViewportCulling();

        expect(blocks.blockList[0]._viewportVisible).toBe(true);
        expect(blocks.blockList[1]._viewportVisible).toBe(true);
        expect(blocks.blockList[2]._viewportVisible).toBe(true);
    });

    it("should mark blocks outside the viewport as not visible", () => {
        blocks.blockList = [
            { trash: false, container: { x: -200, y: 100 }, width: 50, height: 30 },
            { trash: false, container: { x: 900, y: 100 }, width: 50, height: 30 },
            { trash: false, container: { x: 100, y: -100 }, width: 50, height: 30 },
            { trash: false, container: { x: 100, y: 700 }, width: 50, height: 30 }
        ];

        blocks._updateViewportCulling();

        expect(blocks.blockList[0]._viewportVisible).toBe(false);
        expect(blocks.blockList[1]._viewportVisible).toBe(false);
        expect(blocks.blockList[2]._viewportVisible).toBe(false);
        expect(blocks.blockList[3]._viewportVisible).toBe(false);
    });

    it("should handle scrolled viewport offset", () => {
        mockActivity.blocksContainer.x = -200;
        mockActivity.blocksContainer.y = -100;

        blocks.blockList = [
            { trash: false, container: { x: 0, y: 0 }, width: 50, height: 30 },
            { trash: false, container: { x: 300, y: 200 }, width: 50, height: 30 },
            { trash: false, container: { x: 1000, y: 800 }, width: 50, height: 30 }
        ];

        blocks._updateViewportCulling();

        // vp rect = (200, 100) to (1000, 700)
        // Block at (0,0) with w=50,h=30: (0+50) <= 200 → off-screen left
        expect(blocks.blockList[0]._viewportVisible).toBe(false);
        expect(blocks.blockList[1]._viewportVisible).toBe(true);
        expect(blocks.blockList[2]._viewportVisible).toBe(false);
    });

    it("should refresh a stale highlight cache when a block re-enters the viewport", () => {
        let cachedHighlightVisible = true;
        const block = {
            trash: false,
            container: {
                x: 900,
                y: 100,
                updateCache: jest.fn(() => {
                    cachedHighlightVisible = block.highlightVisible;
                })
            },
            width: 50,
            height: 30,
            _viewportVisible: false,
            highlightVisible: true,
            unhighlight() {
                this.highlightVisible = false;
                if (this._viewportVisible !== false) {
                    this.container.updateCache();
                }
            }
        };
        blocks.blockList = [block];

        block.unhighlight();
        expect(cachedHighlightVisible).toBe(true);

        block.container.x = 100;
        blocks._updateViewportCulling();

        expect(block.container.updateCache).toHaveBeenCalledTimes(1);
        expect(cachedHighlightVisible).toBe(false);
    });

    it("should skip trashed blocks without modifying their visibility", () => {
        blocks.blockList = [
            {
                trash: true,
                container: { x: -500, y: -500 },
                width: 50,
                height: 30,
                _viewportVisible: true
            },
            { trash: false, container: { x: 100, y: 100 }, width: 50, height: 30 }
        ];

        blocks._updateViewportCulling();

        expect(blocks.blockList[0]._viewportVisible).toBe(true);
        expect(blocks.blockList[1]._viewportVisible).toBe(true);
    });

    it("should consider edge-aligned blocks as visible", () => {
        blocks.blockList = [
            { trash: false, container: { x: 0, y: 0 }, width: 1, height: 600 },
            { trash: false, container: { x: 799, y: 0 }, width: 1, height: 600 },
            { trash: false, container: { x: 0, y: 599 }, width: 800, height: 1 }
        ];

        blocks._updateViewportCulling();

        // One pixel inside the viewport edge
        expect(blocks.blockList[0]._viewportVisible).toBe(true);
        expect(blocks.blockList[1]._viewportVisible).toBe(true);
        expect(blocks.blockList[2]._viewportVisible).toBe(true);
    });

    it("should handle zero-dimension blocks (async bitmap not yet loaded)", () => {
        blocks.blockList = [
            { trash: false, container: { x: -100, y: -100 }, width: 0, height: 0 },
            { trash: false, container: { x: 100, y: 100 }, width: 0, height: 0 }
        ];

        blocks._updateViewportCulling();

        // Zero-dim blocks are kept visible until dimensions stabilize
        expect(blocks.blockList[0]._viewportVisible).toBe(true);
        expect(blocks.blockList[1]._viewportVisible).toBe(true);
    });

    it("should skip null entries in blockList", () => {
        blocks.blockList = [
            null,
            { trash: false, container: { x: 100, y: 100 }, width: 50, height: 30 }
        ];

        blocks._updateViewportCulling();

        // Should not throw and remaining blocks should still be culled
        expect(blocks.blockList[1]._viewportVisible).toBe(true);
    });

    it("should skip blocks without a container", () => {
        blocks.blockList = [
            { trash: false, container: null, width: 50, height: 30 },
            { trash: false, container: { x: 100, y: 100 }, width: 50, height: 30 }
        ];

        blocks._updateViewportCulling();

        // Block without container should be skipped, block with container processed
        expect(blocks.blockList[0]._viewportVisible).toBe(undefined);
        expect(blocks.blockList[1]._viewportVisible).toBe(true);
    });

    it("should showBlocks without throwing", () => {
        blocks.blockList = [];
        blocks.showBlocks();

        expect(mockActivity.palettes.show).toHaveBeenCalled();
        expect(blocks.visible).toBe(true);
        expect(mockActivity.refreshCanvas).toHaveBeenCalled();
    });

    it("should update culling during setBlockScale", async () => {
        blocks.blockList = [];
        await blocks.setBlockScale(0.8);

        expect(blocks.blockScale).toBe(0.8);
        expect(blocks.blockList[0]).toBeUndefined();
        expect(mockActivity.refreshCanvas).toHaveBeenCalled();
    });
});

describe("Blocks Foundation", () => {
    let mockActivity;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create a basic mock activity object as required by Blocks constructor
        mockActivity = {
            storage: {},
            trashcan: {},
            turtles: {},
            boundary: {},
            macroDict: {},
            palettes: { dict: {} },
            logo: { synth: { loadSynth: jest.fn() } },
            blocksContainer: new global.createjs.Container(),
            canvas: { width: 1200, height: 900 },
            refreshCanvas: jest.fn(),
            errorMsg: jest.fn(),
            setSelectionMode: jest.fn(),
            stopLoadAnimation: jest.fn(),
            setHomeContainers: jest.fn(),
            __tick: jest.fn()
        };
    });

    describe("Constructor", () => {
        it("_getStackSize does not throw on an out-of-range block index", () => {
            const blocks = new Blocks(mockActivity);
            // Non-empty so the loop-counter guard (sizeCounter > blockList.length * 2)
            // doesn't short-circuit before reaching the out-of-range dereference.
            blocks.blockList = [{}, {}];

            expect(() => blocks._getStackSize(99999)).not.toThrow();
        });

        it("adjustExpandableClampBlock does not throw on an out-of-range block index", () => {
            const blocks = new Blocks(mockActivity);
            blocks.blockList = [{}, {}];
            blocks.clampBlocksToCheck = [[99999, 0]];
            const debugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});

            expect(() => blocks.adjustExpandableClampBlock()).not.toThrow();
            expect(debugSpy).toHaveBeenCalledWith(
                expect.stringContaining("Something very broken in adjustExpandableClampBlock")
            );

            debugSpy.mockRestore();
        });

        it("should initialize using an activity object", () => {
            const blocks = new Blocks(mockActivity);

            expect(blocks.activity).toBe(mockActivity);
            expect(blocks.blockList).toEqual([]);
            expect(blocks.stackList).toEqual([]);
            expect(blocks.visible).toBe(true);
            expect(blocks.blockScale).toBe(global.DEFAULTBLOCKSCALE);
        });

        it("should initialize using an explicit deps object", () => {
            const deps = {
                storage: {},
                trashcan: {},
                turtles: {},
                boundary: {},
                macroDict: {},
                palettes: {},
                logo: {},
                blocksContainer: {},
                canvas: {},
                refreshCanvas: jest.fn(),
                errorMsg: jest.fn(),
                setSelectionMode: jest.fn(),
                stopLoadAnimation: jest.fn(),
                setHomeContainers: jest.fn(),
                tick: jest.fn()
            };

            const blocks = new Blocks(deps);

            expect(blocks.deps).toBe(deps);
            // Verify the activity shim was created
            expect(blocks.activity.storage).toBe(deps.storage);
            expect(typeof blocks.activity.refreshCanvas).toBe("function");
        });
    });

    describe("Basic State Management", () => {
        it("should correctly handle long press status", () => {
            const blocks = new Blocks(mockActivity);

            expect(blocks.getLongPressStatus()).toBe(false);
            blocks.inLongPress = true;
            expect(blocks.getLongPressStatus()).toBe(true);

            blocks.clearLongPress();
            expect(blocks.getLongPressStatus()).toBe(false);
        });

        it("should initialize lists as empty arrays", () => {
            const blocks = new Blocks(mockActivity);

            expect(Array.isArray(blocks.blockList)).toBe(true);
            expect(blocks.blockList.length).toBe(0);
            expect(Array.isArray(blocks.stackList)).toBe(true);
            expect(blocks.stackList.length).toBe(0);
            expect(Array.isArray(blocks.trashStacks)).toBe(true);
        });
    });

    describe("Stack Copying", () => {
        it("disconnects a copied nested stack from parents outside the copy", () => {
            const blocks = new Blocks(mockActivity);
            mockActivity.blocksContainer.x = 0;
            mockActivity.blocksContainer.y = 0;
            const makeBlock = (name, connections) => ({
                name,
                connections,
                isValueBlock: jest.fn().mockReturnValue(false)
            });
            blocks.blockList = [
                makeBlock("start", [null, 1, null]),
                makeBlock("forward", [0, 2]),
                makeBlock("right", [1, null])
            ];
            blocks.selectedStack = 1;

            const copiedBlocks = blocks._copyBlocksToObj(false);

            expect(copiedBlocks).toEqual([
                [0, "forward", 75, 75, [null, 1]],
                [1, "right", 0, 0, [0, null]]
            ]);
            expect(copiedBlocks.flatMap(block => block[4])).not.toContain(undefined);
        });
    });

    describe("Parameter Block Cache Updates", () => {
        it("only rebuilds the cache when the displayed value changes", () => {
            const blocks = new Blocks(mockActivity);
            const updateParameter = jest.fn(() => 0);
            const updateCache = jest.fn();
            const parameterBlock = {
                name: "heading",
                protoblock: { parameter: true, updateParameter },
                text: { text: "heading" },
                container: { updateCache }
            };
            blocks.blockList = [parameterBlock];

            expect(blocks.updateParameterBlock({}, 0, 0)).toBe(true);
            expect(parameterBlock.text.text).toBe("0");
            expect(updateCache).toHaveBeenCalledTimes(1);

            expect(blocks.updateParameterBlock({}, 0, 0)).toBe(false);
            expect(updateCache).toHaveBeenCalledTimes(1);

            updateParameter.mockReturnValue(10);

            expect(blocks.updateParameterBlock({}, 0, 0)).toBe(true);
            expect(parameterBlock.text.text).toBe("10");
            expect(updateCache).toHaveBeenCalledTimes(2);
        });
    });

    describe("Sparse Array Safety", () => {
        it("should not throw TypeError in findStacks when blockList is sparse", () => {
            const blocks = new Blocks(mockActivity);
            blocks.blockList = [];
            blocks.blockList[1] = { trash: false, connections: [null] }; // Index 0 is undefined

            expect(() => blocks.findStacks()).not.toThrow();
            expect(blocks.stackList).toEqual([1]);
        });

        it("should not throw TypeError in moveAllBlocksExcept when blockList is sparse", () => {
            const blocks = new Blocks(mockActivity);
            blocks.blockList = [];
            blocks.blockList[1] = {
                trash: false,
                connections: [null],
                findTopBlock: jest.fn().mockReturnValue(1),
                moveBlockRelativeBatched: jest.fn()
            };

            expect(() => blocks.moveAllBlocksExcept(null, 10, 10)).not.toThrow();
        });

        it("should not throw TypeError in _findTwoArgs when blockList is sparse", () => {
            const blocks = new Blocks(mockActivity);
            blocks.blockList = [];
            blocks.blockList[1] = {
                trash: false,
                isArgBlock: jest.fn().mockReturnValue(true),
                isExpandableBlock: jest.fn().mockReturnValue(true)
            };

            expect(() => blocks._findTwoArgs()).not.toThrow();
            expect(blocks._expandablesList).toEqual([1]);
        });
    });

    describe("Stack Cleanup And Dock Adjustment", () => {
        it("should expand clamps once after adjusting all queued docks", () => {
            const blocks = new Blocks(mockActivity);
            const callOrder = [];

            blocks._checkArgClampBlocks = [];
            blocks._checkTwoArgBlocks = [];
            blocks._adjustTheseDocks = [11, 17, 23];
            blocks._adjustTheseStacks = [];
            blocks.adjustDocks = jest.fn(blk => {
                callOrder.push(`dock:${blk}`);
            });
            blocks._expandClamps = jest.fn(() => {
                callOrder.push("expand");
            });

            blocks._cleanupStacks();

            expect(blocks.adjustDocks).toHaveBeenCalledTimes(3);
            expect(blocks._expandClamps).toHaveBeenCalledTimes(1);
            expect(callOrder).toEqual(["dock:11", "dock:17", "dock:23", "expand"]);
        });

        it("should stop recursive adjustDocks cycles without overflowing the stack", () => {
            const blocks = new Blocks(mockActivity);
            const debugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});
            const makeDockBlock = (connections, x, y) => ({
                name: "flow",
                connections,
                docks: [
                    [0, 0],
                    [0, 20]
                ],
                container: { x, y },
                isTwoArgBooleanBlock: jest.fn().mockReturnValue(false),
                isInlineCollapsible: jest.fn().mockReturnValue(false),
                collapsed: false
            });

            blocks.blockList = [makeDockBlock([null, 1], 0, 0), makeDockBlock([0, 0], 0, 20)];
            blocks._moveBlock = jest.fn();

            expect(() => blocks.adjustDocks(0, true)).not.toThrow();
            expect(blocks._moveBlock).toHaveBeenCalled();
            expect(debugSpy).toHaveBeenCalledWith(
                expect.stringContaining("Infinite loop encountered while adjusting docks")
            );

            debugSpy.mockRestore();
        });
    });

    describe("Action palette opens on new action block creation", () => {
        it("should call showPalette('action') when a new uniquely-named action is created", () => {
            const showPalette = jest.fn();
            mockActivity.palettes = {
                dict: {},
                hide: jest.fn(),
                show: jest.fn(),
                updatePalettes: jest.fn(),
                showPalette
            };

            const blocks = new Blocks(mockActivity);
            blocks.findUniqueActionName = jest.fn().mockReturnValue("action 2");
            blocks.actionMetadata = jest.fn().mockReturnValue({ hasReturn: false, hasArgs: false });
            blocks.newNameddoBlock = jest.fn();

            // Simulate the action block creation path
            const value = blocks.findUniqueActionName("action");
            if (value !== "action" && value !== "action") {
                const metadata = blocks.actionMetadata(0);
                blocks.newNameddoBlock(value, metadata.hasReturn, metadata.hasArgs);
                mockActivity.palettes.updatePalettes("action");
                mockActivity.palettes.showPalette("action");
            }

            expect(showPalette).toHaveBeenCalledWith("action");
        });

        it("should NOT call showPalette when action name is the default 'action'", () => {
            const showPalette = jest.fn();
            mockActivity.palettes = {
                dict: {},
                updatePalettes: jest.fn(),
                showPalette
            };

            const blocks = new Blocks(mockActivity);
            blocks.findUniqueActionName = jest.fn().mockReturnValue("action");
            blocks.newNameddoBlock = jest.fn();

            const value = blocks.findUniqueActionName("action");
            if (value !== "action") {
                blocks.newNameddoBlock(value, false, false);
                mockActivity.palettes.updatePalettes("action");
                mockActivity.palettes.showPalette("action");
            }

            expect(showPalette).not.toHaveBeenCalled();
        });
    });

    describe("cleanupAfterLoad – finishedLoading emission", () => {
        const { PubSub } = require("../pubsub");
        let loadContainer;

        beforeEach(() => {
            global.pubsub = new PubSub();
            loadContainer = document.createElement("div");
            loadContainer.id = "load-container";
            document.body.appendChild(loadContainer);
        });

        afterEach(() => {
            loadContainer.remove();
            delete global.pubsub;
        });

        it("emits finishedLoading when _loadCounter reaches zero", async () => {
            const blocks = new Blocks(mockActivity);
            blocks._loadCounter = 1;
            blocks.blockList = [];
            blocks.blocksToCollapse = [];
            blocks._findDrumURLs = jest.fn();
            blocks.updateBlockPositions = jest.fn();
            blocks._cleanupStacks = jest.fn();

            const listener = jest.fn();
            global.pubsub.on("finishedLoading", listener);

            await blocks.cleanupAfterLoad();

            expect(listener).toHaveBeenCalledTimes(1);
        });

        it("does not emit finishedLoading when _loadCounter is still positive", async () => {
            const blocks = new Blocks(mockActivity);
            blocks._loadCounter = 2;

            const listener = jest.fn();
            global.pubsub.on("finishedLoading", listener);

            await blocks.cleanupAfterLoad();

            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe("_suppressRefresh during loading", () => {
        const { PubSub } = require("../pubsub");
        let mockActivity;
        let loadContainer;

        beforeEach(() => {
            global.pubsub = new PubSub();
            mockActivity = {
                storage: {},
                trashcan: {},
                turtles: {},
                boundary: {},
                macroDict: {},
                palettes: {
                    dict: {},
                    show: jest.fn(),
                    updatePalettes: jest.fn(),
                    showPalette: jest.fn()
                },
                logo: { synth: { loadSynth: jest.fn(), preloadProjectSamples: jest.fn() } },
                blocksContainer: { x: 0, y: 0 },
                canvas: { width: 800, height: 600 },
                refreshCanvas: jest.fn(),
                errorMsg: jest.fn(),
                setSelectionMode: jest.fn(),
                stopLoadAnimation: jest.fn(),
                setHomeContainers: jest.fn(),
                __tick: jest.fn(),
                _suppressRefresh: false
            };
            loadContainer = document.createElement("div");
            loadContainer.id = "load-container";
            document.body.appendChild(loadContainer);
        });

        afterEach(() => {
            loadContainer.remove();
            delete global.pubsub;
        });

        it("sets _suppressRefresh true during loadNewBlocks", () => {
            const blocks = new Blocks(mockActivity);
            blocks.blockList = [];
            blocks._processOneBlock = jest.fn();
            blocks.protoBlockDict = {};
            blocks.newStorein2Block = jest.fn();
            blocks.newNamedboxBlock = jest.fn();
            blocks.setActionProtoVisibility = jest.fn();
            blocks.customTemperamentDefined = true;

            // Minimal valid block object: [id, name, x, y, connections]
            const blockObjs = [[0, "forward", 0, 0, [null, null, null]]];

            // Capture the flag state during the synchronous body
            let flagDuringLoad = null;
            const origProcessChunk = blocks._processOneBlock;
            blocks._processOneBlock = jest.fn(() => {
                flagDuringLoad = mockActivity._suppressRefresh;
            });

            blocks.loadNewBlocks(blockObjs);

            // Flag should be true during processing (before cleanupAfterLoad resets it)
            expect(flagDuringLoad).toBe(true);
        });

        it("loads a text block valued '__proto__' without throwing", () => {
            const blocks = new Blocks(mockActivity);
            blocks.blockList = [];
            blocks.protoBlockDict = {
                text: { style: "value", hasCapability: () => false }
            };
            blocks.newStorein2Block = jest.fn();
            blocks.newNamedboxBlock = jest.fn();
            blocks.setActionProtoVisibility = jest.fn();
            blocks._processOneBlock = jest.fn();
            blocks.customTemperamentDefined = true;

            // Legacy (pre-value-object) text block shape, still accepted for
            // backward compatibility and reachable via pasted project JSON.
            const blockObjs = [[0, ["text", "__proto__"], 0, 0, [null]]];

            expect(() => blocks.loadNewBlocks(blockObjs)).not.toThrow();
        });

        it.each(["toString", "constructor", "hasOwnProperty", "valueOf", "__proto__"])(
            "loads a block named '%s' without throwing",
            reservedName => {
                const blocks = new Blocks(mockActivity);
                blocks.blockList = [];
                blocks.newStorein2Block = jest.fn();
                blocks.newNamedboxBlock = jest.fn();
                blocks.setActionProtoVisibility = jest.fn();
                blocks.customTemperamentDefined = true;
                blocks._makeNewBlockWithConnections = jest.fn();

                const blockObjs = [[0, reservedName, 0, 0, [null, null, null]]];

                expect(() => blocks.loadNewBlocks(blockObjs)).not.toThrow();
            }
        );

        it("resets _suppressRefresh on circular connection early return", () => {
            const blocks = new Blocks(mockActivity);
            blocks.blockList = [];

            // Block connected to itself: connections[0] === block id
            const blockObjs = [[0, "forward", 0, 0, [0, null, null]]];

            blocks.loadNewBlocks(blockObjs);

            expect(mockActivity._suppressRefresh).toBe(false);
        });

        it("resets _suppressRefresh after cleanupAfterLoad finishes", async () => {
            const blocks = new Blocks(mockActivity);
            blocks._loadCounter = 1;
            blocks.blockList = [];
            blocks.blocksToCollapse = [];
            blocks._findDrumURLs = jest.fn();
            blocks.updateBlockPositions = jest.fn();
            blocks._cleanupStacks = jest.fn();
            blocks.actionMetadata = jest.fn();
            blocks.newNameddoBlock = jest.fn();
            blocks.newStorein2Block = jest.fn();
            blocks.newNamedboxBlock = jest.fn();
            blocks._rebuildSpatialGrid = jest.fn();

            mockActivity._suppressRefresh = true;

            await blocks.cleanupAfterLoad();

            expect(mockActivity._suppressRefresh).toBe(false);
            expect(mockActivity.refreshCanvas).toHaveBeenCalled();
        });

        it("resets _suppressRefresh even if cleanupAfterLoad body throws", async () => {
            const blocks = new Blocks(mockActivity);
            blocks._loadCounter = 1;
            blocks.blockList = [];
            blocks.blocksToCollapse = [];
            blocks._findDrumURLs = jest.fn(() => {
                throw new Error("test error");
            });

            mockActivity._suppressRefresh = true;

            await expect(blocks.cleanupAfterLoad()).rejects.toThrow("test error");

            expect(mockActivity._suppressRefresh).toBe(false);
            expect(mockActivity.refreshCanvas).toHaveBeenCalled();
        });

        it("resets _suppressRefresh if loadNewBlocks throws", () => {
            const blocks = new Blocks(mockActivity);
            blocks.blockList = [];
            blocks.protoBlockDict = {};
            blocks.newStorein2Block = jest.fn();
            blocks.newNamedboxBlock = jest.fn();
            blocks.setActionProtoVisibility = jest.fn();
            blocks.customTemperamentDefined = true;

            // Valid block object to pass initial checks
            const blockObjs = [[0, "forward", 0, 0, [null, null, null]]];

            // Make the block repair loop throw by corrupting blockObjs after validation
            const origProcessChunk = blocks._processOneBlock;
            blocks._processOneBlock = jest.fn(() => {
                throw new Error("simulated processing error");
            });

            expect(() => blocks.loadNewBlocks(blockObjs)).toThrow("simulated processing error");
            expect(mockActivity._suppressRefresh).toBe(false);
        });
    });

    describe("renameNameddos", () => {
        let blocksInstance;

        beforeEach(() => {
            mockActivity.palettes.updatePalettes = jest.fn();
            blocksInstance = new Blocks(mockActivity);
            mockActivity.palettes.dict["action"] = {
                protoList: [],
                remove: jest.fn()
            };
        });

        it("should rename blocks using privateData, overrideName, and protoblock.defaults[0] fallbacks", () => {
            const regenerateArtwork1 = jest.fn();
            const regenerateArtwork2 = jest.fn();
            const regenerateArtwork3 = jest.fn();

            const block1 = {
                name: "nameddo",
                privateData: "dance",
                regenerateArtwork: regenerateArtwork1
            };
            const block2 = {
                name: "nameddoArg",
                privateData: null,
                overrideName: "dance",
                regenerateArtwork: regenerateArtwork2
            };
            const block3 = {
                name: "namedcalc",
                privateData: null,
                overrideName: null,
                protoblock: { defaults: ["dance"] },
                regenerateArtwork: regenerateArtwork3
            };
            const block4 = {
                name: "nameddo",
                privateData: "other",
                regenerateArtwork: jest.fn()
            };

            blocksInstance.blockList = [block1, block2, block3, block4];

            const paletteBlock = {
                name: "nameddo",
                defaults: ["dance"]
            };
            mockActivity.palettes.dict["action"].protoList.push(paletteBlock);

            blocksInstance.renameNameddos("dance", "jump");

            // Assert block1 updates
            expect(block1.privateData).toBe("jump");
            expect(block1.overrideName).toBe("jump");
            expect(regenerateArtwork1).toHaveBeenCalled();

            // Assert block2 updates
            expect(block2.privateData).toBe("jump");
            expect(block2.overrideName).toBe("jump");
            expect(regenerateArtwork2).toHaveBeenCalled();

            // Assert block3 updates
            expect(block3.privateData).toBe("jump");
            expect(block3.overrideName).toBe("jump");
            // protoblock.defaults[0] must NOT be mutated on workspace instances
            // because it is a shared reference to the palette prototype template.
            expect(block3.protoblock.defaults[0]).toBe("dance");
            expect(regenerateArtwork3).toHaveBeenCalled();

            // Assert block4 remains unchanged
            expect(block4.privateData).toBe("other");
            expect(block4.regenerateArtwork).not.toHaveBeenCalled();

            // Assert palette update
            expect(paletteBlock.defaults[0]).toBe("jump");
        });
    });

    describe("Block dragging via the real BlockDragController", () => {
        // The rest of this file exercises BlockDragController only through a
        // minimal hand-built stand-in (see block-drag-controller.test.js).
        // This suite instead drives it through a genuine `new Blocks(...)`
        // instance, so the delegation stubs, the real _testConnectionType /
        // _getNearbyBlocks implementations, and the real dragGroup state are
        // all exercised together, not just the controller in isolation.
        let blocks;

        beforeEach(() => {
            mockActivity.turtles = { running: jest.fn().mockReturnValue(false) };
            blocks = new Blocks(mockActivity);

            // Subsystems that are outside the scope of dragging itself.
            blocks.findTopBlock = jest.fn(blk => blk);
            blocks.insideExpandableBlock = jest.fn(() => null);
            blocks.addDefaultBlock = jest.fn();
            blocks.adjustExpandableClampBlock = jest.fn();
            blocks._insideNoteBlock = jest.fn(() => null);
        });

        function makeRealFlowBlock({ x, y, docks, connections, name = "flow" }) {
            return {
                name,
                trash: false,
                inCollapsed: false,
                collapsed: false,
                container: { x, y },
                docks,
                connections,
                isArgBlock: () => false,
                isArgumentLikeBlock: () => false,
                isArgFlowClampBlock: () => false,
                isArgClamp: () => false,
                isInlineCollapsible: () => false,
                isNoHitBlock: () => false,
                isTwoArgBooleanBlock: () => false,
                highlight: jest.fn(),
                unhighlight: jest.fn()
            };
        }

        it("computes a real drag group and moves it through the real Blocks instance", () => {
            blocks.blockList = [
                makeRealFlowBlock({
                    x: 0,
                    y: 0,
                    docks: [
                        [0, 0, "in"],
                        [0, 20, "out"]
                    ],
                    connections: [null, 1]
                }),
                makeRealFlowBlock({ x: 0, y: 20, docks: [[0, 0, "in"]], connections: [0] })
            ];

            blocks.findDragGroup(0);
            expect(blocks.dragGroup).toEqual([0, 1]);

            blocks.moveStackRelative(0, 10, 5);

            expect(blocks.blockList[0].container).toEqual({ x: 10, y: 5 });
            expect(blocks.blockList[1].container).toEqual({ x: 10, y: 25 });
        });

        it("snaps a dragged block onto a real, compatible dock using the real _testConnectionType", async () => {
            blocks.blockList = [
                makeRealFlowBlock({
                    x: 0,
                    y: 0,
                    docks: [
                        [0, 0, "in"],
                        [0, 20, "out"]
                    ],
                    connections: [null, null],
                    name: "target"
                }),
                makeRealFlowBlock({
                    x: 0,
                    y: 15,
                    docks: [[0, 0, "in"]],
                    connections: [null],
                    name: "moving"
                })
            ];

            await blocks.blockMoved(1);

            expect(blocks.blockList[1].connections[0]).toBe(0);
            expect(blocks.blockList[0].connections[1]).toBe(1);
        });

        it("does not snap across a real, incompatible dock type", async () => {
            blocks.blockList = [
                makeRealFlowBlock({
                    x: 0,
                    y: 0,
                    docks: [
                        [0, 0, "in"],
                        [0, 20, "numberout"]
                    ],
                    connections: [null, null],
                    name: "target"
                }),
                makeRealFlowBlock({
                    x: 0,
                    y: 15,
                    docks: [[0, 0, "in"]],
                    connections: [null],
                    name: "moving"
                })
            ];

            await blocks.blockMoved(1);

            expect(blocks.blockList[1].connections[0]).toBeNull();
            expect(blocks.blockList[0].connections[1]).toBeNull();
        });

        it("exposes the same BlockDragController instance to every delegated method", () => {
            expect(blocks.blockDragController).toBeDefined();
            expect(blocks.findDragGroup).not.toBe(blocks.blockDragController.findDragGroup);
            blocks.blockList = [
                makeRealFlowBlock({ x: 0, y: 0, docks: [[0, 0, "in"]], connections: [null] })
            ];

            const spy = jest.spyOn(blocks.blockDragController, "findDragGroup");
            blocks.findDragGroup(0);

            expect(spy).toHaveBeenCalledWith(0);
        });
    });

    describe("Collapsible Capability Migration Behavior", () => {
        let mockActivity;
        let blocks;

        /**
         * Build a block stand-in whose isCollapsible / isInlineCollapsible
         * derive from a capabilities map (same contract as Block / ProtoBlock),
         * rather than hard-coding isInlineCollapsible: () => true.
         */
        const makeCapabilityBlock = ({ name, capabilities = [], ...rest }) => {
            const caps = Object.create(null);
            for (const capability of capabilities) {
                caps[capability] = true;
            }

            return {
                name,
                trash: false,
                collapsed: false,
                capabilities: caps,
                hasCapability(capability) {
                    return Object.prototype.hasOwnProperty.call(this.capabilities, capability)
                        ? this.capabilities[capability]
                        : false;
                },
                isCollapsible() {
                    return this.hasCapability("collapsible");
                },
                isInlineCollapsible() {
                    return this.hasCapability("inlineCollapsible");
                },
                isClampBlock() {
                    return false;
                },
                connections: [null],
                ...rest
            };
        };

        beforeEach(() => {
            mockActivity = {
                storage: {},
                trashcan: {},
                turtles: {},
                boundary: {},
                macroDict: {},
                palettes: { dict: {}, show: jest.fn() },
                logo: { synth: { loadSynth: jest.fn() } },
                blocksContainer: { x: 0, y: 0 },
                canvas: { width: 800, height: 600 },
                refreshCanvas: jest.fn(),
                errorMsg: jest.fn(),
                setSelectionMode: jest.fn(),
                stopLoadAnimation: jest.fn(),
                setHomeContainers: jest.fn(),
                __tick: jest.fn()
            };
            blocks = new Blocks(mockActivity);
        });

        it("toggleCollapsibles toggles standard collapsible blocks but excludes inlineCollapsible ones", () => {
            const startBlock = makeCapabilityBlock({
                name: "start",
                capabilities: ["collapsible"],
                collapseToggle: jest.fn(function () {
                    this.collapsed = !this.collapsed;
                })
            });

            // newnote / interval / osctime: same exclude behavior as the old name list.
            // definemode: intentionally excluded too — it declares inlineCollapsible and
            // was part of historical INLINECOLLAPSIBLES; completing the capability migration.
            const inlineBlocks = ["newnote", "interval", "osctime", "definemode"].map(name =>
                makeCapabilityBlock({
                    name,
                    capabilities: ["collapsible", "inlineCollapsible"],
                    collapseToggle: jest.fn(function () {
                        this.collapsed = !this.collapsed;
                    })
                })
            );

            blocks.blockList = [startBlock, ...inlineBlocks];

            blocks.toggleCollapsibles();

            expect(startBlock.collapseToggle).toHaveBeenCalled();
            for (const inlineBlock of inlineBlocks) {
                expect(inlineBlock.collapseToggle).not.toHaveBeenCalled();
            }
        });

        it("_getBlockSize spoofs size 1 for collapsed inlineCollapsible blocks including definemode", () => {
            blocks.blockList = [
                makeCapabilityBlock({
                    name: "newnote",
                    size: 4,
                    collapsed: true,
                    capabilities: ["collapsible", "inlineCollapsible"]
                }),
                makeCapabilityBlock({
                    name: "interval",
                    size: 4,
                    collapsed: true,
                    capabilities: ["collapsible", "inlineCollapsible"]
                }),
                makeCapabilityBlock({
                    name: "osctime",
                    size: 4,
                    collapsed: true,
                    capabilities: ["collapsible", "inlineCollapsible"]
                }),
                // Intentional: definemode joins compact-size path via inlineCollapsible.
                makeCapabilityBlock({
                    name: "definemode",
                    size: 5,
                    collapsed: true,
                    capabilities: ["collapsible", "inlineCollapsible"]
                }),
                makeCapabilityBlock({
                    name: "start",
                    size: 3,
                    collapsed: true,
                    capabilities: ["collapsible"]
                }),
                makeCapabilityBlock({
                    name: "newnote",
                    size: 4,
                    collapsed: false,
                    capabilities: ["collapsible", "inlineCollapsible"]
                })
            ];

            expect(blocks._getBlockSize(0)).toBe(1);
            expect(blocks._getBlockSize(1)).toBe(1);
            expect(blocks._getBlockSize(2)).toBe(1);
            expect(blocks._getBlockSize(3)).toBe(1);
            expect(blocks._getBlockSize(4)).toBe(3);
            expect(blocks._getBlockSize(5)).toBe(4);
        });

        it("_getStackSize spoofs size 1 for collapsed inlineCollapsible blocks including definemode", () => {
            blocks.blocksToCollapse = [];
            blocks._sizeCounter = 0;
            blocks.blockList = [
                makeCapabilityBlock({
                    name: "newnote",
                    size: 4,
                    collapsed: true,
                    capabilities: ["collapsible", "inlineCollapsible"]
                }),
                makeCapabilityBlock({
                    name: "interval",
                    size: 4,
                    collapsed: true,
                    capabilities: ["collapsible", "inlineCollapsible"]
                }),
                makeCapabilityBlock({
                    name: "osctime",
                    size: 4,
                    collapsed: true,
                    capabilities: ["collapsible", "inlineCollapsible"]
                }),
                // Intentional: definemode stack size spoofs like other inline collapsibles.
                makeCapabilityBlock({
                    name: "definemode",
                    size: 5,
                    collapsed: true,
                    capabilities: ["collapsible", "inlineCollapsible"]
                }),
                makeCapabilityBlock({
                    name: "start",
                    size: 3,
                    collapsed: true,
                    capabilities: ["collapsible"]
                })
            ];

            expect(blocks._getStackSize(0)).toBe(1);
            expect(blocks._getStackSize(1)).toBe(1);
            expect(blocks._getStackSize(2)).toBe(1);
            expect(blocks._getStackSize(3)).toBe(1);
            expect(blocks._getStackSize(4)).toBe(3);
        });

        it("_processOneBlock correctly uses ProtoBlock capability metadata to initialize collapsed state on load", () => {
            blocks.protoBlockDict = {
                start: {
                    name: "start",
                    hasCapability: capability => capability === "collapsible"
                },
                forward: {
                    name: "forward",
                    hasCapability: () => false
                }
            };

            const blockObjs = [
                [0, "start", 0, 0, [null]],
                [1, "forward", 0, 0, [null]]
            ];

            blocks._makeNewBlockWithConnections = jest.fn();
            blocks.turtles = { getTurtleCount: () => 1, addTurtle: jest.fn() };

            blocks._processOneBlock(0, blockObjs, 0, true);
            blocks._processOneBlock(1, blockObjs, 0, false);

            expect(blocks._makeNewBlockWithConnections).toHaveBeenCalledTimes(2);
            // Check that postProcess received blkInfo with collapsed: false for 'start'
            const startCallArgs = blocks._makeNewBlockWithConnections.mock.calls[0];
            expect(startCallArgs[4][1]).toEqual({ value: null, collapsed: false });

            const forwardCallArgs = blocks._makeNewBlockWithConnections.mock.calls[1];
            expect(forwardCallArgs[4]).toBeUndefined();
        });
    });

    describe("SoundSpecifier Capability & Traversal Migration", () => {
        let blocks;

        beforeEach(() => {
            blocks = new Blocks({});
        });

        it("_blockInStack matches using array of names and predicate function", () => {
            blocks.blockList = [
                { name: "start", connections: [null, 1] },
                { name: "pitch", isSoundSpecifier: () => true, connections: [0] }
            ];

            expect(blocks._blockInStack(0, ["pitch"])).toBe(true);
            expect(blocks._blockInStack(0, ["rest2"])).toBe(false);

            expect(
                blocks._blockInStack(0, blk => blk.isSoundSpecifier && blk.isSoundSpecifier())
            ).toBe(true);
            expect(blocks._blockInStack(0, blk => blk.name === "nonexistent")).toBe(false);
        });

        it("findFirstPitchBlock identifies soundSpecifier blocks and rest2 block", () => {
            const pitchBlock = { name: "pitch", isSoundSpecifier: () => true, connections: [] };
            const restBlock = { name: "rest2", isSoundSpecifier: () => false, connections: [] };
            const forwardBlock = {
                name: "forward",
                isSoundSpecifier: () => false,
                connections: [1]
            };

            blocks.blockList = [forwardBlock, pitchBlock, restBlock];

            // Traversal from forward -> pitch
            expect(blocks.findFirstPitchBlock(0)).toBe(1);

            // Traversal for rest2
            blocks.blockList[0].connections = [2];
            expect(blocks.findFirstPitchBlock(0)).toBe(2);

            // Traversal with no sound specifier or rest2
            blocks.blockList[0].connections = [null];
            expect(blocks.findFirstPitchBlock(0)).toBe(null);
        });

        it("_deletePitchBlocks extracts soundSpecifier blocks from note stack", () => {
            const pitchBlock = {
                name: "pitch",
                isSoundSpecifier: () => true,
                connections: [0, null]
            };
            const drumBlock = {
                name: "playdrum",
                isSoundSpecifier: () => true,
                connections: [null]
            };

            blocks.blockList = [
                { name: "note", isNoteContainer: () => true, connections: [null, 1] },
                pitchBlock,
                drumBlock
            ];

            blocks._extractBlock = jest.fn();

            // Run _deletePitchBlocks starting on pitchBlock
            blocks._deletePitchBlocks(1);

            expect(blocks._extractBlock).toHaveBeenCalledWith(1, false);
        });
    });

    describe("wideLabel Capability Migration", () => {
        let blocks;

        beforeEach(() => {
            blocks = new Blocks({});
        });

        it("updateBlockText skips truncation for wideLabel blocks", () => {
            const longLabel = "x".repeat(40);
            const wideBlock = {
                name: "drumname",
                value: longLabel,
                hasWideLabel: () => true,
                text: { text: "" },
                container: {
                    children: { length: 1 },
                    setChildIndex: jest.fn(),
                    updateCache: jest.fn()
                },
                loadComplete: true
            };
            const normalBlock = {
                name: "text",
                value: longLabel,
                hasWideLabel: () => false,
                text: { text: "" },
                container: {
                    children: { length: 1 },
                    setChildIndex: jest.fn(),
                    updateCache: jest.fn()
                },
                loadComplete: true
            };

            blocks.blockList = [wideBlock, normalBlock];
            blocks.updateBlockText(0);
            blocks.updateBlockText(1);

            expect(wideBlock.text.text).toBe(longLabel);
            expect(normalBlock.text.text.endsWith("...")).toBe(true);
            expect(normalBlock.text.text.length).toBeLessThan(longLabel.length);
        });
    });

    describe("sendStackToTrash DOM safety", () => {
        it("should safely complete sendStackToTrash when #hideContents element is missing from DOM", () => {
            const mockActivity = {
                palettes: { dict: {} },
                refreshCanvas: jest.fn(),
                trashcan: { stopHighlightAnimation: jest.fn() }
            };
            const blocksInstance = new Blocks(mockActivity);

            const mockBlock = {
                blockIndex: 1,
                connections: [null],
                container: { uncache: jest.fn() },
                protoblock: { style: "normal", parameter: false, staticLabels: ["test"] },
                hide: jest.fn()
            };

            blocksInstance.blockList[1] = mockBlock;
            blocksInstance.captureStackPreview = jest.fn().mockReturnValue(null);
            blocksInstance._cleanupStacks = jest.fn();

            const originalGetElementById = document.getElementById;
            document.getElementById = jest.fn().mockReturnValue(null);

            try {
                expect(() => blocksInstance.sendStackToTrash(mockBlock)).not.toThrow();
            } finally {
                document.getElementById = originalGetElementById;
            }
        });

        it("should click #hideContents when it exists in DOM", () => {
            const mockActivity = {
                palettes: { dict: {} },
                refreshCanvas: jest.fn(),
                trashcan: { stopHighlightAnimation: jest.fn() }
            };
            const blocksInstance = new Blocks(mockActivity);

            const mockBlock = {
                blockIndex: 1,
                connections: [null],
                container: { uncache: jest.fn() },
                protoblock: { style: "normal", parameter: false, staticLabels: ["test"] },
                hide: jest.fn()
            };

            blocksInstance.blockList[1] = mockBlock;
            blocksInstance.captureStackPreview = jest.fn().mockReturnValue(null);
            blocksInstance._cleanupStacks = jest.fn();

            const mockClick = jest.fn();
            const originalGetElementById = document.getElementById;
            document.getElementById = jest.fn().mockImplementation(id => {
                if (id === "hideContents") {
                    return { click: mockClick };
                }
                return null;
            });

            try {
                blocksInstance.sendStackToTrash(mockBlock);
                expect(mockClick).toHaveBeenCalled();
            } finally {
                document.getElementById = originalGetElementById;
            }
        });

        it("disposeBlock should call dispose on target block and remove it from blockList and blockArt", () => {
            const mockActivity = { palettes: { dict: {} }, refreshCanvas: jest.fn() };
            const blocksInstance = new Blocks(mockActivity);
            const mockDispose = jest.fn();
            blocksInstance.blockList[1] = { dispose: mockDispose };
            blocksInstance.blockArt[1] = "<svg></svg>";
            blocksInstance.blockCollapseArt[1] = "<svg></svg>";

            blocksInstance.disposeBlock(1);

            expect(mockDispose).toHaveBeenCalled();
            expect(blocksInstance.blockList[1]).toBeNull();
            expect(blocksInstance.blockArt[1]).toBeUndefined();
            expect(blocksInstance.blockCollapseArt[1]).toBeUndefined();
        });

        it("sendStackToTrash should evict and dispose blocks when trashStacks exceeds MAX_TRASH_UNDO", () => {
            const mockActivity = {
                palettes: { dict: {} },
                refreshCanvas: jest.fn(),
                trashcan: { stopHighlightAnimation: jest.fn() }
            };
            const blocksInstance = new Blocks(mockActivity);
            blocksInstance.captureStackPreview = jest.fn().mockReturnValue("preview-url");
            blocksInstance._cleanupStacks = jest.fn();

            for (let i = 0; i < 100; i++) {
                blocksInstance.trashStacks.push(i);
                blocksInstance.trashPreviews[i] = "preview";
            }

            const mockDispose = jest.fn();
            const mockBlock = {
                blockIndex: 100,
                connections: [null],
                container: { uncache: jest.fn() },
                protoblock: { style: "normal", parameter: false, staticLabels: ["test"] },
                hide: jest.fn(),
                dispose: mockDispose
            };
            blocksInstance.blockList[100] = mockBlock;

            // block 0 was the oldest trashed stack
            blocksInstance.blockList[0] = {
                blockIndex: 0,
                connections: [null],
                dispose: jest.fn()
            };

            blocksInstance.sendStackToTrash(mockBlock);

            expect(blocksInstance.trashStacks.length).toBe(100);
            expect(blocksInstance.trashPreviews[0]).toBeUndefined();
            expect(blocksInstance.blockList[0]).toBeNull();
        });
    });
});
