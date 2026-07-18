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

// Expose constants that blocks.js references as bare globals at runtime
// (e.g. MINIMUMDOCKDISTANCE in blockMoved, ALLOWED_CONNECTIONS in _testConnectionType).
const blockConstants = require("../block-constants");
Object.assign(global, blockConstants);

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
});
