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

/* global jest, describe, it, expect, beforeEach */

const Blocks = require("../blocks");

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
global.last = jest.fn(arr => (arr && arr.length > 0 ? arr[arr.length - 1] : null));
global.delayExecution = jest.fn().mockResolvedValue(null);
global.getTextWidth = jest.fn().mockReturnValue(100);

// Mock Block dependency (we just modularized it, but we can mock for isolation)
global.Block = jest.fn();
global.ProtoBlock = jest.fn();

// Mock Constants
global.DEFAULTBLOCKSCALE = 1.0;
global.STANDARDBLOCKHEIGHT = 20;
global.SPECIALINPUTS = ["number", "text", "boolean"];
global.COLLAPSIBLES = ["repeat", "forever", "if"];
global.INLINECOLLAPSIBLES = ["newnote", "interval", "osctime"];
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
global.WIDENAMES = [];
global.BACKWARDCOMPATIBILITYDICT = {};
global.DEFAULTCHORD = [];

// Mock helper functions
global.addTemperamentToDictionary = jest.fn();
global.closeBlkWidgets = jest.fn();
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

describe("Blocks Foundation", () => {
    let mockActivity;

    const makeBlock = (name, connections = [null], overrides = {}) => ({
        name,
        connections,
        trash: false,
        container: {
            x: 0,
            y: 0,
            children: [],
            setChildIndex: jest.fn(),
            updateCache: jest.fn()
        },
        width: 100,
        height: 40,
        protoblock: {},
        highlight: jest.fn(),
        unhighlight: jest.fn(),
        hide: jest.fn(),
        show: jest.fn(),
        regenerateArtwork: jest.fn(),
        offScreen: jest.fn(() => false),
        ...overrides
    });

    beforeEach(() => {
        jest.clearAllMocks();
        global.requestAnimationFrame = jest.fn(callback => callback());

        // Create a basic mock activity object as required by Blocks constructor
        mockActivity = {
            storage: {},
            trashcan: {},
            turtles: {},
            boundary: { hide: jest.fn() },
            macroDict: {},
            palettes: {
                dict: {},
                hide: jest.fn(),
                show: jest.fn(),
                updatePalettes: jest.fn()
            },
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

    describe("Stack Traversal", () => {
        it("should find the top and bottom blocks in a stack", () => {
            const blocks = new Blocks(mockActivity);
            blocks.blockList = [
                makeBlock("start", [null, 1]),
                makeBlock("forward", [0, 2]),
                makeBlock("right", [1, null])
            ];

            expect(blocks.findTopBlock(2)).toBe(0);
            expect(blocks.findBottomBlock(0)).toBe(2);
            expect(blocks.findTopBlock(null)).toBeNull();
            expect(blocks.findBottomBlock(null)).toBeNull();
        });

        it("should detect blocks in the same flow generation", () => {
            const blocks = new Blocks(mockActivity);
            blocks.blockList = [
                makeBlock("start", [null, 1]),
                makeBlock("forward", [0, 2]),
                makeBlock("right", [1, null]),
                makeBlock("solo", [null])
            ];

            expect(blocks.sameGeneration(0, 2)).toBe(true);
            expect(blocks.sameGeneration(0, 3)).toBe(false);
            expect(blocks.sameGeneration(null, 2)).toBe(false);
            expect(blocks.sameGeneration(2, null)).toBe(false);
        });

        it("should collect top-level non-trash stacks", () => {
            const blocks = new Blocks(mockActivity);
            blocks.blockList = [
                makeBlock("start", [null, 1]),
                makeBlock("forward", [0, null]),
                makeBlock("trashed-start", [null], { trash: true }),
                makeBlock("solo", [null])
            ];

            blocks.findStacks();

            expect(blocks.stackList).toEqual([0, 3]);
        });

        it("should count nested blocks in a stack", () => {
            const blocks = new Blocks(mockActivity);
            blocks.blockList = [
                makeBlock("repeat", [null, 1, 2]),
                makeBlock("number", [0]),
                makeBlock("forward", [0, 3]),
                makeBlock("right", [2, null])
            ];

            expect(blocks._countBlocksInStack(0)).toBe(4);
            expect(blocks._countBlocksInStack(null)).toBe(0);
        });

        it("should find block names inside a stack", () => {
            const blocks = new Blocks(mockActivity);
            blocks.blockList = [
                makeBlock("start", [null, 1]),
                makeBlock("forward", [0, 2]),
                makeBlock("right", [1, null])
            ];

            expect(blocks._blockInStack(0, ["right"])).toBe(true);
            expect(blocks._blockInStack(0, ["setxy"])).toBe(false);
        });
    });

    describe("Drag Groups", () => {
        it("should find all connected child blocks in a drag group", () => {
            const blocks = new Blocks(mockActivity);
            blocks.blockList = [
                makeBlock("repeat", [null, 1, 2]),
                makeBlock("number", [0]),
                makeBlock("forward", [0, 3]),
                makeBlock("right", [2, null])
            ];

            blocks.findDragGroup(0);

            expect(blocks.dragGroup).toEqual([0, 1, 2, 3]);
        });

        it("should cache and clear drag groups", () => {
            const blocks = new Blocks(mockActivity);
            blocks.blockList = [makeBlock("start", [null, 1]), makeBlock("forward", [0])];

            blocks.cacheDragGroup(0);
            expect(blocks._cachedDragGroup).toEqual([0, 1]);

            blocks.clearCachedDragGroup();
            expect(blocks._cachedDragGroup).toBeNull();
        });
    });

    describe("Visibility and Selection", () => {
        it("should change disabled status for matching non-trash blocks", () => {
            const blocks = new Blocks(mockActivity);
            const matchingBlock = makeBlock("sensor");
            const trashedBlock = makeBlock("sensor", [null], { trash: true });
            blocks.blockList = [matchingBlock, trashedBlock, makeBlock("other")];

            blocks.changeDisabledStatus("sensor", true);

            expect(matchingBlock.protoblock.disabled).toBe(true);
            expect(matchingBlock.regenerateArtwork).toHaveBeenCalledWith(false);
            expect(trashedBlock.protoblock.disabled).toBeUndefined();
            expect(trashedBlock.regenerateArtwork).not.toHaveBeenCalled();
        });

        it("should highlight and unhighlight visible blocks", () => {
            const blocks = new Blocks(mockActivity);
            blocks.blockList = [makeBlock("start"), makeBlock("forward")];

            blocks.highlight(0, false);
            expect(blocks.blockList[0].highlight).toHaveBeenCalled();
            expect(blocks.highlightedBlock).toBe(0);

            blocks.highlight(1, true);
            expect(blocks.blockList[0].unhighlight).toHaveBeenCalled();
            expect(blocks.blockList[1].highlight).toHaveBeenCalled();
            expect(blocks.highlightedBlock).toBe(1);

            blocks.unhighlight(null);
            expect(blocks.blockList[1].unhighlight).toHaveBeenCalled();
            expect(blocks.highlightedBlock).toBeNull();
        });

        it("should unhighlight every non-trash block", () => {
            const blocks = new Blocks(mockActivity);
            const firstBlock = makeBlock("start");
            const trashedBlock = makeBlock("trash", [null], { trash: true });
            const secondBlock = makeBlock("forward");
            blocks.blockList = [firstBlock, trashedBlock, secondBlock];

            blocks.unhighlightAll();

            expect(firstBlock.unhighlight).toHaveBeenCalled();
            expect(trashedBlock.unhighlight).not.toHaveBeenCalled();
            expect(secondBlock.unhighlight).toHaveBeenCalled();
        });

        it("should ignore highlight changes while blocks are hidden", () => {
            const blocks = new Blocks(mockActivity);
            blocks.blockList = [makeBlock("start")];
            blocks.visible = false;

            blocks.highlight(0, false);
            blocks.unhighlight(0);

            expect(blocks.blockList[0].highlight).not.toHaveBeenCalled();
            expect(blocks.blockList[0].unhighlight).not.toHaveBeenCalled();
        });

        it("should hide every block and show only non-trash blocks", () => {
            const blocks = new Blocks(mockActivity);
            const visibleBlock = makeBlock("forward");
            const trashedBlock = makeBlock("right", [null], { trash: true });
            blocks.blockList = [visibleBlock, trashedBlock];

            blocks.hide();
            expect(visibleBlock.hide).toHaveBeenCalled();
            expect(trashedBlock.hide).toHaveBeenCalled();
            expect(blocks.visible).toBe(false);

            blocks.show();
            expect(visibleBlock.show).toHaveBeenCalled();
            expect(trashedBlock.show).not.toHaveBeenCalled();
            expect(blocks.visible).toBe(true);
        });

        it("should update selection state and notify the activity", () => {
            const blocks = new Blocks(mockActivity);

            blocks.setSelection(true);
            blocks.setSelectedBlocks([1, 2]);
            blocks.setSelectionToActivity(false);

            expect(blocks.selectionModeOn).toBe(true);
            expect(blocks.selectedBlocks).toEqual([1, 2]);
            expect(mockActivity.setSelectionMode).toHaveBeenCalledWith(false);
        });

        it("should detect whether coordinates are inside a non-trash block", () => {
            const blocks = new Blocks(mockActivity);
            blocks.blockList = [
                makeBlock("forward", [null], {
                    container: { x: 10, y: 20 },
                    width: 50,
                    height: 30
                }),
                makeBlock("trash", [null], {
                    trash: true,
                    container: { x: 0, y: 0 },
                    width: 200,
                    height: 200
                })
            ];

            expect(blocks.isCoordinateOnBlock(25, 30)).toBe(true);
            expect(blocks.isCoordinateOnBlock(5, 5)).toBe(false);
        });

        it("should hide and show blocks through palette wrappers", () => {
            const blocks = new Blocks(mockActivity);
            blocks.hide = jest.fn();
            blocks.show = jest.fn();
            blocks.bringToTop = jest.fn();

            blocks.hideBlocks();
            expect(mockActivity.palettes.hide).toHaveBeenCalled();
            expect(blocks.hide).toHaveBeenCalled();
            expect(mockActivity.refreshCanvas).toHaveBeenCalledTimes(1);

            blocks.showBlocks();
            expect(mockActivity.palettes.show).toHaveBeenCalled();
            expect(blocks.show).toHaveBeenCalled();
            expect(blocks.bringToTop).toHaveBeenCalled();
            expect(mockActivity.refreshCanvas).toHaveBeenCalledTimes(2);
        });
    });

    describe("Connection and Bounds Helpers", () => {
        it("should validate allowed dock connection types", () => {
            const blocks = new Blocks(mockActivity);

            expect(blocks._testConnectionType("in", "out")).toBe(true);
            expect(blocks._testConnectionType("numberin", "textout")).toBe(false);
        });

        it("should move blocks to rounded positions and check bounds", () => {
            const blocks = new Blocks(mockActivity);
            blocks.checkBounds = jest.fn();
            blocks.blockList = [makeBlock("forward")];

            blocks._moveBlock(0, 10.4, 20.6);

            expect(blocks.blockList[0].container.x).toBe(10);
            expect(blocks.blockList[0].container.y).toBe(21);
            expect(blocks.checkBounds).toHaveBeenCalled();
        });

        it("should defer bounds checks while updating block positions", () => {
            const blocks = new Blocks(mockActivity);
            blocks.checkBounds = jest.fn();
            blocks.blockList = [
                makeBlock("start", [null], { container: { x: 1.2, y: 2.6 } }),
                makeBlock("trash", [null], { trash: true, container: { x: 5, y: 6 } }),
                makeBlock("solo", [null], { container: { x: 3.7, y: 4.1 } })
            ];

            blocks.updateBlockPositions();

            expect(blocks.blockList[0].container).toEqual({ x: 1, y: 3 });
            expect(blocks.blockList[2].container).toEqual({ x: 4, y: 4 });
            expect(blocks.checkBounds).toHaveBeenCalledTimes(1);
        });

        it("should update home containers based on offscreen top blocks", () => {
            const blocks = new Blocks(mockActivity);
            blocks.blockList = [
                makeBlock("start", [null], { offScreen: jest.fn(() => true) }),
                makeBlock("child", [0], { offScreen: jest.fn(() => false) })
            ];

            blocks.checkBounds();
            expect(mockActivity.setHomeContainers).toHaveBeenCalledWith(true);

            mockActivity.setHomeContainers.mockClear();
            blocks.blockList[0].offScreen = jest.fn(() => false);
            blocks.checkBounds();
            expect(mockActivity.setHomeContainers).toHaveBeenCalledWith(false);
            expect(mockActivity.boundary.hide).toHaveBeenCalled();
        });
    });

    describe("Name and Palette Helpers", () => {
        it("should toggle action prototype visibility only when state changes", () => {
            const blocks = new Blocks(mockActivity);
            const namedDo = { name: "nameddo", defaults: [], hidden: true };
            mockActivity.palettes.dict.action = {
                protoList: [namedDo, { name: "nameddo", defaults: ["arg"], hidden: true }]
            };

            blocks.setActionProtoVisibility(true);

            expect(namedDo.hidden).toBe(false);
            expect(mockActivity.palettes.updatePalettes).toHaveBeenCalledWith("action");
        });

        it("should find unique action names from existing action stacks", () => {
            const blocks = new Blocks(mockActivity);
            mockActivity.palettes.dict.action = { protoList: [] };
            blocks.blockList = [
                makeBlock("text", [1], { value: "action" }),
                makeBlock("action", [null]),
                makeBlock("text", [3], { value: "action1" }),
                makeBlock("action", [null]),
                makeBlock("text", [5], { value: "ignored", trash: true }),
                makeBlock("action", [null])
            ];

            expect(blocks.findUniqueActionName("action")).toBe("action2");
        });

        it("should find unique custom and temperament names", () => {
            const blocks = new Blocks(mockActivity);
            blocks.blockList = [
                makeBlock("text", [1], { value: "custom" }),
                makeBlock("pitch", [null]),
                makeBlock("text", [3], { value: "custom1" }),
                makeBlock("pitch", [null]),
                makeBlock("text", [5], { value: "temperament" }),
                makeBlock("temperament1", [null])
            ];

            expect(blocks.findUniqueCustomName("custom")).toBe("custom2");
            expect(blocks.findUniqueTemperamentName("temperament")).toBe("temperament1");
        });

        it("should load synths for drum url text blocks", () => {
            const blocks = new Blocks(mockActivity);
            blocks.blockList = [
                makeBlock("text", [1], { value: "https://example.com/drum.wav" }),
                makeBlock("playdrum", [null]),
                makeBlock("string", [3], { value: "snare" }),
                makeBlock("setvoice", [null])
            ];

            blocks._findDrumURLs();

            expect(mockActivity.logo.synth.loadSynth).toHaveBeenCalledWith(
                0,
                "https://example.com/drum.wav"
            );
            expect(mockActivity.logo.synth.loadSynth).toHaveBeenCalledTimes(1);
        });
    });

    describe("Rename Helpers", () => {
        it("should rename box labels connected to box blocks", () => {
            const blocks = new Blocks(mockActivity);
            const textBlock = makeBlock("text", [1], { value: "old", text: { text: "old" } });
            blocks.blockList = [textBlock, makeBlock("box", [null])];

            blocks.renameBoxes("old", "new");

            expect(textBlock.value).toBe("new");
            expect(textBlock.text.text).toBe("new");
            expect(textBlock.container.updateCache).toHaveBeenCalled();
        });

        it("should rename storein text labels and storein2 private data", () => {
            const blocks = new Blocks(mockActivity);
            const textBlock = makeBlock("text", [1], { value: "old", text: { text: "old" } });
            const storein2Block = makeBlock("storein2", [null], { privateData: "old" });
            blocks.blockList = [textBlock, makeBlock("storein", [null]), storein2Block];

            blocks.renameStoreinBoxes("old", "new");

            expect(textBlock.value).toBe("new");
            expect(textBlock.text.text).toBe("new");
            expect(storein2Block.privateData).toBe("new");
            expect(storein2Block.overrideName).toBe("new");
            expect(storein2Block.regenerateArtwork).toHaveBeenCalled();
            expect(textBlock.container.updateCache).toHaveBeenCalled();
            expect(storein2Block.container.updateCache).toHaveBeenCalled();
        });

        it("should rename storein2 private data with default display names", () => {
            const blocks = new Blocks(mockActivity);
            const storein2Block = makeBlock("storein2", [null], { privateData: "old" });
            blocks.blockList = [storein2Block];

            blocks.renameStorein2Boxes("old", "box1");

            expect(storein2Block.privateData).toBe("box1");
            expect(storein2Block.overrideName).toBe("box1");
            expect(storein2Block.regenerateArtwork).toHaveBeenCalled();
            expect(storein2Block.container.updateCache).toHaveBeenCalled();
        });

        it("should rename namedbox private data", () => {
            const blocks = new Blocks(mockActivity);
            const namedBoxBlock = makeBlock("namedbox", [null], { privateData: "old" });
            blocks.blockList = [namedBoxBlock];

            blocks.renameNamedboxes("old", "box2");

            expect(namedBoxBlock.privateData).toBe("box2");
            expect(namedBoxBlock.overrideName).toBe("box2");
            expect(namedBoxBlock.regenerateArtwork).toHaveBeenCalled();
            expect(namedBoxBlock.container.updateCache).toHaveBeenCalled();
        });
    });

    describe("Sparse Array Safety", () => {
        it("should not throw TypeError in findStacks when blockList is sparse", () => {
            const blocks = new Blocks(mockActivity);
            blocks.blockList = [];
            blocks.blockList[1] = makeBlock("start", [null]);

            expect(() => blocks.findStacks()).not.toThrow();
            expect(blocks.stackList).toEqual([1]);
        });

        it("should not throw TypeError in moveAllBlocksExcept when blockList is sparse", () => {
            const blocks = new Blocks(mockActivity);
            blocks.blockList = [];
            blocks.blockList[1] = makeBlock("start", [null]);
            blocks.findTopBlock = jest.fn().mockReturnValue(1);
            blocks.moveBlockRelativeBatched = jest.fn();

            expect(() => blocks.moveAllBlocksExcept(null, 10, 10)).not.toThrow();
            expect(blocks.moveBlockRelativeBatched).toHaveBeenCalledWith(1, 10, 10);
        });

        it("should not throw TypeError in _findTwoArgs when blockList is sparse", () => {
            const blocks = new Blocks(mockActivity);
            blocks.blockList = [];
            blocks.blockList[1] = makeBlock("arg", [null], {
                isArgBlock: jest.fn().mockReturnValue(true),
                isExpandableBlock: jest.fn().mockReturnValue(true),
                isTwoArgBlock: jest.fn().mockReturnValue(false)
            });

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
});
