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
                bitmapCache: {},
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

    it("should not touch the cache of a block whose artwork is being rebuilt", () => {
        // Regenerating a block's artwork uncaches the container and rebuilds it
        // asynchronously. A block that re-enters the viewport inside that window
        // has no bitmapCache, and createjs throws on updateCache() without one.
        const block = {
            trash: false,
            container: {
                x: 900,
                y: 100,
                bitmapCache: null,
                updateCache: jest.fn(() => {
                    throw "cache() must be called before updateCache()";
                })
            },
            width: 50,
            height: 30,
            _viewportVisible: false
        };
        blocks.blockList = [block];

        block.container.x = 100;

        expect(() => blocks._updateViewportCulling()).not.toThrow();
        expect(block.container.updateCache).not.toHaveBeenCalled();
        expect(block._viewportVisible).toBe(true);
    });

    it("should keep culling the rest of the list past an uncached block", () => {
        const rebuilding = {
            trash: false,
            container: {
                x: 100,
                y: 100,
                bitmapCache: null,
                updateCache: jest.fn(() => {
                    throw "cache() must be called before updateCache()";
                })
            },
            width: 50,
            height: 30,
            _viewportVisible: false
        };
        const trailing = {
            trash: false,
            container: { x: 2000, y: 2000 },
            width: 50,
            height: 30,
            _viewportVisible: true
        };
        blocks.blockList = [rebuilding, trailing];

        blocks._updateViewportCulling();

        // The throw used to abort the loop, leaving every later block stale.
        expect(trailing._viewportVisible).toBe(false);
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

// ---------------------------------------------------------------------------
// renameDos
//
// Called when an action is renamed, to carry the new name onto every block
// that refers to it. Two of its checks compare the loop index against block
// numbers: the skipBlock guard, and the slot check that only renames the
// action-name argument of an onbeatdo or listen block. Both need the index to
// be a number.
// ---------------------------------------------------------------------------

describe("renameDos", () => {
    let blocks;

    beforeEach(() => {
        const mockActivity = {
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

    /**
     * Builds a text block holding a value, as the action-name argument is.
     * @param {string} value - the name the block carries
     * @param {number} parent - index of the block it hangs from
     * @returns {Object} A text block shaped the way renameDos expects.
     */
    function textBlock(value, parent) {
        return {
            name: "text",
            value,
            trash: false,
            connections: [parent],
            text: { text: value },
            container: { updateCache: jest.fn() }
        };
    }

    /**
     * Builds a parent block. Connections hold block numbers, matching the
     * real blockList, because the slot check searches them with indexOf.
     * @param {string} name - block name, such as "do" or "onbeatdo"
     * @param {Array} connections - [parent, ...arguments]
     * @returns {Object} A parent block.
     */
    function parentBlock(name, connections) {
        return {
            name,
            value: null,
            trash: false,
            connections,
            text: { text: "" },
            container: { updateCache: jest.fn() }
        };
    }

    describe("blocks that carry an action name", () => {
        it("renames the argument of a plain do block", () => {
            blocks.blockList = [parentBlock("do", [null, 1]), textBlock("myAction", 0)];

            blocks.renameDos("myAction", "newAction");

            expect(blocks.blockList[1].value).toBe("newAction");
            expect(blocks.blockList[1].text.text).toBe("newAction");
            expect(blocks.blockList[1].container.updateCache).toHaveBeenCalled();
        });

        it.each(["do", "calc", "doArg", "calcArg", "action"])(
            "renames the argument of a %s block",
            name => {
                blocks.blockList = [parentBlock(name, [null, 1]), textBlock("myAction", 0)];

                blocks.renameDos("myAction", "newAction");

                expect(blocks.blockList[1].value).toBe("newAction");
            }
        );

        it("leaves a block naming a different action alone", () => {
            blocks.blockList = [parentBlock("do", [null, 1]), textBlock("otherAction", 0)];

            blocks.renameDos("myAction", "newAction");

            expect(blocks.blockList[1].value).toBe("otherAction");
        });

        it("leaves a block whose parent refers to nothing alone", () => {
            blocks.blockList = [parentBlock("repeat", [null, 1]), textBlock("myAction", 0)];

            blocks.renameDos("myAction", "newAction");

            expect(blocks.blockList[1].value).toBe("myAction");
        });
    });

    // onbeatdo and listen take two arguments. The first is the beat or the
    // event name, the second is the action to run, so only slot 2 is renamed.
    describe("onbeatdo and listen, which rename only their slot 2 argument", () => {
        it.each(["onbeatdo", "listen"])("renames the action name of a %s block", name => {
            blocks.blockList = [
                parentBlock(name, [null, 1, 2]),
                textBlock("4", 0),
                textBlock("myAction", 0)
            ];

            blocks.renameDos("myAction", "newAction");

            expect(blocks.blockList[2].value).toBe("newAction");
            expect(blocks.blockList[2].text.text).toBe("newAction");
        });

        it.each(["onbeatdo", "listen"])("leaves the slot 1 argument of a %s block alone", name => {
            // Slot 1 is the beat or the event name, which is not an action
            // and must keep its value even when it reads the same.
            blocks.blockList = [
                parentBlock(name, [null, 1, 2]),
                textBlock("myAction", 0),
                textBlock("somethingElse", 0)
            ];

            blocks.renameDos("myAction", "newAction");

            expect(blocks.blockList[1].value).toBe("myAction");
            expect(blocks.blockList[2].value).toBe("somethingElse");
        });

        it("renames slot 2 and leaves slot 1 alone when both name the action", () => {
            blocks.blockList = [
                parentBlock("onbeatdo", [null, 1, 2]),
                textBlock("myAction", 0),
                textBlock("myAction", 0)
            ];

            blocks.renameDos("myAction", "newAction");

            expect(blocks.blockList[1].value).toBe("myAction");
            expect(blocks.blockList[2].value).toBe("newAction");
        });
    });

    describe("skipBlock", () => {
        it("leaves the block it is asked to skip untouched", () => {
            blocks.blockList = [parentBlock("do", [null, 1]), textBlock("myAction", 0)];

            blocks.renameDos("myAction", "newAction", 1);

            expect(blocks.blockList[1].value).toBe("myAction");
            expect(blocks.blockList[1].text.text).toBe("myAction");
            expect(blocks.blockList[1].container.updateCache).not.toHaveBeenCalled();
        });

        it("renames the others while skipping the one named", () => {
            blocks.blockList = [
                parentBlock("do", [null, 1]),
                textBlock("myAction", 0),
                parentBlock("do", [null, 3]),
                textBlock("myAction", 2)
            ];

            blocks.renameDos("myAction", "newAction", 1);

            expect(blocks.blockList[1].value).toBe("myAction");
            expect(blocks.blockList[3].value).toBe("newAction");
        });

        it("skips block 0 when asked, rather than treating it as absent", () => {
            // Block 0 is falsy as an index, so a guard written as a truth test
            // rather than a comparison would fail to skip it.
            blocks.blockList = [textBlock("myAction", 1), parentBlock("do", [null, 0])];

            blocks.renameDos("myAction", "newAction", 0);

            expect(blocks.blockList[0].value).toBe("myAction");
        });

        it("renames everything when no block is named", () => {
            blocks.blockList = [parentBlock("do", [null, 1]), textBlock("myAction", 0)];

            blocks.renameDos("myAction", "newAction");

            expect(blocks.blockList[1].value).toBe("newAction");
        });
    });

    describe("edge cases", () => {
        it("does nothing when the name is unchanged", () => {
            blocks.blockList = [parentBlock("do", [null, 1]), textBlock("myAction", 0)];

            blocks.renameDos("myAction", "myAction");

            expect(blocks.blockList[1].value).toBe("myAction");
            expect(blocks.blockList[1].container.updateCache).not.toHaveBeenCalled();
        });

        it("leaves an empty block list empty", () => {
            blocks.blockList = [];

            blocks.renameDos("myAction", "newAction");

            // A throw would fail the test on its own, so the postcondition is
            // what is asserted: nothing was added to the list.
            expect(blocks.blockList).toEqual([]);
        });

        it("leaves trashed blocks alone", () => {
            blocks.blockList = [parentBlock("do", [null, 1]), textBlock("myAction", 0)];
            blocks.blockList[1].trash = true;

            blocks.renameDos("myAction", "newAction");

            expect(blocks.blockList[1].value).toBe("myAction");
        });

        it("skips a block whose parent connection is null", () => {
            blocks.blockList = [parentBlock("do", [null, 1]), textBlock("myAction", null)];

            blocks.renameDos("myAction", "newAction");

            expect(blocks.blockList[1].value).toBe("myAction");
            expect(blocks.blockList[1].text.text).toBe("myAction");
            expect(blocks.blockList[1].container.updateCache).not.toHaveBeenCalled();
        });

        it("renames every referring block across a larger workspace", () => {
            blocks.blockList = [
                parentBlock("do", [null, 1]),
                textBlock("myAction", 0),
                parentBlock("onbeatdo", [null, 3, 4]),
                textBlock("4", 2),
                textBlock("myAction", 2),
                parentBlock("listen", [null, 6, 7]),
                textBlock("event", 5),
                textBlock("myAction", 5),
                parentBlock("repeat", [null, 9]),
                textBlock("myAction", 8)
            ];

            blocks.renameDos("myAction", "newAction");

            // Everything that names the action through a do, onbeatdo or
            // listen is renamed; the repeat argument is not an action name.
            expect(blocks.blockList.map(b => b.value)).toEqual([
                null,
                "newAction",
                null,
                "4",
                "newAction",
                null,
                "event",
                "newAction",
                null,
                "myAction"
            ]);
        });
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
            expect(mockActivity.errorMsg).toHaveBeenCalledWith(
                "Something went wrong reading JSON-encoded project data."
            );
        });

        it("detects and rejects multi-block cycles in loadNewBlocks", () => {
            const blocks = new Blocks(mockActivity);
            blocks.blockList = [];

            // Multi-block cycle: 0 -> 1 -> 0
            const twoBlockCycle = [
                [0, "forward", 0, 0, [null, 1]],
                [1, "forward", 0, 0, [null, 0]]
            ];

            mockActivity._suppressRefresh = true;
            blocks.loadNewBlocks(twoBlockCycle);
            expect(mockActivity._suppressRefresh).toBe(false);
            expect(mockActivity.errorMsg).toHaveBeenCalledWith(
                "Something went wrong reading JSON-encoded project data."
            );

            // Three-block cycle: 0 -> 1 -> 2 -> 0
            const threeBlockCycle = [
                [0, "forward", 0, 0, [null, 1]],
                [1, "forward", 0, 0, [null, 2]],
                [2, "forward", 0, 0, [null, 0]]
            ];

            mockActivity._suppressRefresh = true;
            mockActivity.errorMsg.mockClear();
            blocks.loadNewBlocks(threeBlockCycle);
            expect(mockActivity._suppressRefresh).toBe(false);
            expect(mockActivity.errorMsg).toHaveBeenCalledWith(
                "Something went wrong reading JSON-encoded project data."
            );
        });

        it("accepts valid parent-child stacks without false cycle detection", () => {
            const blocks = new Blocks(mockActivity);
            blocks.blockList = [];
            blocks.setActionProtoVisibility = jest.fn();
            blocks._makeNewBlockWithConnections = jest.fn();

            // Mimics the default project DATAOBJS structure:
            // Block 0 (start): no parent, child at dock 1 is block 1, dock 2 is null
            // Block 1 (settimbre): parent dock 0 = block 0, children at docks 1-3
            // Block 3 (hidden): parent dock 0 = block 1, no children
            // Dock 0 back-pointers form a tree, NOT a cycle.
            const validStack = [
                [0, "start", 100, 100, [null, 1, null]],
                [1, "forward", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 100 }], 0, 0, [1]],
                [3, "right", 0, 0, [1, 4, null]],
                [4, ["number", { value: 90 }], 0, 0, [3]]
            ];

            mockActivity._suppressRefresh = true;
            // Should NOT trigger cycle detection and abort
            expect(() => blocks.loadNewBlocks(validStack)).not.toThrow();
            // If cycle detection falsely trips, _suppressRefresh would be
            // reset to false and loadNewBlocks would return early.
            // We verify the code proceeded past cycle detection by checking
            // that _makeNewBlockWithConnections was called (it runs after
            // the cycle check).
            expect(blocks._makeNewBlockWithConnections).toHaveBeenCalled();
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

    describe("loadNewBlocks re-entrancy (#8392)", () => {
        const { PubSub } = require("../pubsub");
        let mockActivity;
        let loadContainer;
        let blocks;

        // Block objects: [id, name, x, y, connections]. blockOffset is 0 for
        // every one of these tests, so a batch of length N occupies indices
        // 0..N-1 in blockList/_adjustTheseStacks.
        const makeBatch = n =>
            Array.from({ length: n }, (_, i) => [i, "forward", 0, 0, [null, null, null]]);

        // Stands in for the real path: block.js calls cleanupAfterLoad()
        // once a block's own artwork generation finishes, asynchronously,
        // after _processOneBlock has already recorded the block for the
        // finalize step.
        const stubProcessOneBlock = () =>
            jest.fn((b, blockObjs, blockOffset) => {
                const thisBlock = blockOffset + b;
                blocks.blockList[thisBlock] = { connections: null, trash: false };
                blocks._adjustTheseStacks.push(thisBlock);
                setTimeout(() => blocks.cleanupAfterLoad(), 0);
            });

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

            blocks = new Blocks(mockActivity);
            blocks.blockList = [];
            blocks.customTemperamentDefined = true;
            blocks._processOneBlock = stubProcessOneBlock();
            // These tests are only about load serialization, not the
            // finalize step's internals, so stub it out the same way the
            // "cleanupAfterLoad" describe block above does.
            blocks._findDrumURLs = jest.fn();
            blocks.updateBlockPositions = jest.fn();
            blocks._rebuildSpatialGrid = jest.fn();
            blocks._cleanupStacks = jest.fn();
        });

        afterEach(async () => {
            // Drain any cleanupAfterLoad callbacks still pending from a test
            // that didn't await every scheduled block completion, so they
            // can't fire during a later test against its fresh blocks
            // instance.
            await new Promise(r => setTimeout(r, 50));
            loadContainer.remove();
            delete global.pubsub;
        });

        it("does not start a second call while a first call is still processing", () => {
            blocks.loadNewBlocks(makeBatch(25));

            expect(blocks._loadInProgress).toBe(true);
            expect(blocks._processOneBlock).toHaveBeenCalledTimes(20); // first CHUNK_SIZE

            blocks.loadNewBlocks(makeBatch(3));

            // The second call is queued, not run: _processOneBlock has not
            // been called any additional times for it yet.
            expect(blocks._processOneBlock).toHaveBeenCalledTimes(20);
            expect(blocks._loadQueue).toHaveLength(1);
        });

        it("does not lose the first call's in-flight _adjustTheseStacks entries when a second call arrives mid-load", async () => {
            blocks.loadNewBlocks(makeBatch(25));
            // Let the first chunk's 20 synchronous _processOneBlock calls'
            // queued cleanupAfterLoad callbacks start landing.
            await new Promise(r => setTimeout(r, 0));

            blocks.loadNewBlocks(makeBatch(3));

            // Let everything settle: remaining chunks, all cleanupAfterLoad
            // callbacks, and the queued second load running to completion.
            await new Promise(r => setTimeout(r, 50));

            expect(blocks._processOneBlock).toHaveBeenCalledTimes(28); // 25 + 3
            expect(blocks._loadInProgress).toBe(false);
            expect(blocks._loadQueue).toHaveLength(0);
        });

        it("emits finishedLoading once per queued load, not merged into a single early event", async () => {
            const finishedLoadingCalls = [];
            global.pubsub.on("finishedLoading", () => finishedLoadingCalls.push(Date.now()));

            blocks.loadNewBlocks(makeBatch(25));
            await new Promise(r => setTimeout(r, 0));
            blocks.loadNewBlocks(makeBatch(3));

            await new Promise(r => setTimeout(r, 50));

            expect(finishedLoadingCalls).toHaveLength(2);
        });

        it("starts a queued load once an earlier load's circular-connection early return resolves", () => {
            // Block connected to itself: connections[0] === block id.
            const circularBatch = [[0, "forward", 0, 0, [0, null, null]]];
            blocks.loadNewBlocks(circularBatch);

            // The early return must not leave the queue stuck: a load
            // queued behind it should still get its turn.
            expect(blocks._loadInProgress).toBe(false);

            blocks.loadNewBlocks(makeBatch(2));

            expect(blocks._loadInProgress).toBe(true);
            expect(blocks._processOneBlock).toHaveBeenCalledTimes(2);
        });

        it("runs a second call immediately when no load is already in progress", () => {
            blocks.loadNewBlocks(makeBatch(2));

            expect(blocks._loadQueue).toHaveLength(0);
            expect(blocks._processOneBlock).toHaveBeenCalledTimes(2);
        });

        it("loading an empty batch does not hang and still advances the queue", async () => {
            const finishedLoadingCalls = [];
            global.pubsub.on("finishedLoading", () => finishedLoadingCalls.push(Date.now()));

            blocks.loadNewBlocks([]);
            await new Promise(r => setTimeout(r, 0));

            expect(finishedLoadingCalls).toHaveLength(1);
            expect(blocks._loadInProgress).toBe(false);

            // A load queued behind the empty one must not be stranded.
            blocks.loadNewBlocks(makeBatch(2));

            expect(blocks._loadInProgress).toBe(true);
            expect(blocks._processOneBlock).toHaveBeenCalledTimes(2);
        });

        it("does not leave the queue stuck if a deferred chunk (block 21+) throws", async () => {
            // Block 20 is the first block of the second chunk, the one
            // processed inside the deferred setTimeout(processChunk, 0)
            // callback rather than the first, synchronous chunk. A throw
            // there runs outside any caller's try/catch, so it can only be
            // observed here as a window error event, the same way a real
            // browser would surface it.
            let callCount = 0;
            blocks._processOneBlock = jest.fn((b, blockObjs, blockOffset) => {
                callCount++;
                if (callCount === 21) {
                    throw new Error("deferred chunk failure");
                }
                const thisBlock = blockOffset + b;
                blocks.blockList[thisBlock] = { connections: null, trash: false };
                blocks._adjustTheseStacks.push(thisBlock);
                setTimeout(() => blocks.cleanupAfterLoad(), 0);
            });

            const windowErrors = [];
            const onWindowError = event => {
                event.preventDefault();
                windowErrors.push(event.error || event.message);
            };
            window.addEventListener("error", onWindowError);

            blocks.loadNewBlocks(makeBatch(25));
            await new Promise(r => setTimeout(r, 50));

            window.removeEventListener("error", onWindowError);

            expect(windowErrors.length).toBeGreaterThan(0);
            expect(mockActivity._suppressRefresh).toBe(false);
            expect(blocks._loadInProgress).toBe(false);

            // A load issued after the failure must not be stranded behind it.
            blocks._processOneBlock = stubProcessOneBlock();
            blocks.loadNewBlocks(makeBatch(2));

            expect(blocks._loadInProgress).toBe(true);
            expect(blocks._processOneBlock).toHaveBeenCalledTimes(2);
        });

        it("does not let a stale completion from a failed load corrupt the next queued load's counter", async () => {
            // One stub shared by both loads (load B is queued while load A
            // is still running, so swapping _processOneBlock out from under
            // it mid-flight would mean load A's own deferred chunk never
            // actually calls the code meant to fail). Mirrors what
            // makeNewBlock() really does: every block created is tagged
            // with the generation active at the moment it was made, and
            // carries that tag to its own (possibly much later)
            // cleanupAfterLoad() call, the same way a real Block instance
            // carries _loadGeneration to block.js's
            // cleanupAfterLoad(this._loadGeneration) call.
            //
            // Load A's chunk-1 (b < 20) completions are collected as plain
            // functions rather than scheduled with a timer: under parallel
            // test-worker load, real timer delays aren't a reliable way to
            // force "arrives after load B finishes" ordering, so that
            // ordering is enforced explicitly below instead.
            const staleCleanups = [];
            blocks._processOneBlock = jest.fn((b, blockObjs, blockOffset) => {
                const thisBlock = blockOffset + b;
                const myGeneration = blocks._activeLoadGeneration;
                blocks.blockList[thisBlock] = { connections: null, trash: false };
                blocks._adjustTheseStacks.push(thisBlock);
                if (myGeneration === 1 && b === 20) {
                    // Load A's first block of its deferred (second) chunk.
                    throw new Error("deferred chunk failure");
                }
                if (myGeneration === 1) {
                    staleCleanups.push(() => blocks.cleanupAfterLoad(myGeneration));
                } else {
                    // Load B's blocks: complete promptly, like a normal load.
                    setTimeout(() => blocks.cleanupAfterLoad(myGeneration), 0);
                }
            });

            const onWindowError = event => event.preventDefault();
            window.addEventListener("error", onWindowError);

            const finishedLoadingCalls = [];
            const loadBFinished = new Promise(resolve => {
                global.pubsub.on("finishedLoading", () => {
                    finishedLoadingCalls.push(Date.now());
                    resolve();
                });
            });

            // Load A: 25 blocks, fails on block 20 (first of the deferred
            // chunk, which only runs once the setTimeout(0) scheduling it
            // fires). Load B: queued behind A, starts as soon as A's
            // failure advances the queue.
            blocks.loadNewBlocks(makeBatch(25));
            blocks.loadNewBlocks(makeBatch(3));

            // Wait specifically for load B to finish (not a fixed delay),
            // so this isn't sensitive to how busy the test runner is.
            await loadBFinished;

            expect(staleCleanups).toHaveLength(20);

            // Now let load A's 20 chunk-1 completions land, well after load
            // B has already finished and _activeLoadGeneration has moved on.
            for (const cleanup of staleCleanups) {
                await cleanup();
            }

            // Load B's own 3 blocks are all that should count toward it. If
            // a stale straggler from A had been accepted, B's shared
            // _loadCounter would go negative, and every one of A's 20
            // stragglers would independently satisfy the "<= 0" finalize
            // check again, firing finishedLoading many more times than the
            // one legitimate completion of load B.
            expect(finishedLoadingCalls).toHaveLength(1);
            expect(blocks._loadInProgress).toBe(false);
            expect(blocks._loadQueue).toHaveLength(0);

            window.removeEventListener("error", onWindowError);
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

// ---------------------------------------------------------------------------
// Spatial grid key type
//
// The grid is a Map of cell key to a Set of block indices, plus a Map from
// block index to the cells it occupies. Both compare keys strictly, so the
// index a caller passes has to be the same type the grid already holds or the
// block is registered twice and the older entry is never cleaned up, leaving
// it listed at a position it has left.
// ---------------------------------------------------------------------------

describe("Spatial grid indexing", () => {
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
        blocks.blockList = [
            { trash: false, name: "start", container: { x: 0, y: 0 }, docks: [[0, 0]] },
            { trash: false, name: "note", container: { x: 0, y: 0 }, docks: [[0, 0]] }
        ];
        blocks._rebuildSpatialGrid();
    });

    /**
     * Reads back the cells a block currently occupies in the grid.
     * @param {number} idx - block index
     * @returns {string[]} Sorted cell keys holding that block.
     */
    function cellsHolding(idx) {
        const found = [];
        for (const [cellKey, members] of blocks._spatialGrid) {
            if (members.has(idx)) {
                found.push(cellKey);
            }
        }
        return found.sort();
    }

    /**
     * Asserts the grid is keyed only by numbers, in both directions. A string
     * alias sitting beside the number is the failure this guards against, and
     * checking one key by name would not catch it.
     * @returns {void}
     */
    function expectNumericKeysOnly() {
        for (const key of blocks._blockGridCell.keys()) {
            expect(typeof key).toBe("number");
        }
        for (const members of blocks._spatialGrid.values()) {
            for (const member of members) {
                expect(typeof member).toBe("number");
            }
        }
    }

    it("registers every block under a numeric key when first built", () => {
        expect([...blocks._blockGridCell.keys()]).toEqual([0, 1]);
        expect(cellsHolding(0)).toEqual(["0,0"]);
        expect(cellsHolding(1)).toEqual(["0,0"]);
    });

    it("moves a block out of its old cell and into the new one", () => {
        blocks.blockList[1].container.x = 5000;
        blocks.blockList[1].container.y = 5000;

        blocks._updateSpatialGrid(1);

        expect(cellsHolding(1)).toEqual(["100,100"]);
        expect(blocks._getNearbyBlocks(0, 0)).not.toContain(1);
        expect(blocks._getNearbyBlocks(5000, 5000)).toContain(1);
    });

    describe("when the index arrives as a string", () => {
        beforeEach(() => {
            blocks.blockList[1].container.x = 5000;
            blocks.blockList[1].container.y = 5000;
        });

        it("does not leave the block listed at the position it left", () => {
            blocks._updateSpatialGrid("1");

            expect(blocks._getNearbyBlocks(0, 0)).not.toContain(1);
            expect(cellsHolding(1)).toEqual(["100,100"]);
            expect(cellsHolding("1")).toEqual([]);
            expectNumericKeysOnly();
        });

        it("keeps one entry per block rather than adding a second", () => {
            blocks._updateSpatialGrid("1");

            expect([...blocks._blockGridCell.keys()]).toEqual([0, 1]);
            expectNumericKeysOnly();
        });

        it("reports the block as a number, so the self-connection guard matches", () => {
            blocks._updateSpatialGrid("1");

            const nearby = blocks._getNearbyBlocks(5000, 5000);

            // block-drag-controller skips the dragged block with `b === thisBlock`,
            // which a string entry would slip past.
            expect(nearby).toContain(1);
            expect(nearby).not.toContain("1");
            expect(nearby.every(b => typeof b === "number")).toBe(true);
        });

        it("agrees with the numeric call in every respect", () => {
            const asString = new Blocks(mockActivity);
            asString.blockList = blocks.blockList.map(b => ({
                ...b,
                container: { ...b.container }
            }));
            asString._rebuildSpatialGrid();
            asString._updateSpatialGrid("1");

            blocks._updateSpatialGrid(1);

            expect([...asString._blockGridCell.keys()]).toEqual([...blocks._blockGridCell.keys()]);
            expect(asString._getNearbyBlocks(0, 0)).toEqual(blocks._getNearbyBlocks(0, 0));
            expect(asString._getNearbyBlocks(5000, 5000)).toEqual(
                blocks._getNearbyBlocks(5000, 5000)
            );
        });
    });

    describe("edge cases", () => {
        it("ignores an index that names no block", () => {
            blocks._updateSpatialGrid(99);

            expect([...blocks._blockGridCell.keys()]).toEqual([0, 1]);
        });

        it("ignores a block that has no container yet", () => {
            blocks.blockList.push({ trash: false, name: "note", container: null, docks: [[0, 0]] });

            blocks._updateSpatialGrid(2);

            expect(blocks._blockGridCell.has(2)).toBe(false);
        });

        it("keeps block 0 registered, rather than treating it as absent", () => {
            blocks.blockList[0].container.x = 900;

            blocks._updateSpatialGrid("0");

            expect(blocks._blockGridCell.has(0)).toBe(true);
            expect(cellsHolding(0)).toEqual(["18,0"]);
            expectNumericKeysOnly();
        });

        it("places a block with no docks by its container position", () => {
            blocks.blockList[1].docks = [];
            blocks.blockList[1].container.x = 5000;
            blocks.blockList[1].container.y = 5000;

            blocks._updateSpatialGrid("1");

            expect(cellsHolding(1)).toEqual(["100,100"]);
        });

        it("registers a block in every cell its docks reach", () => {
            blocks.blockList[1].docks = [
                [0, 0],
                [0, 600]
            ];

            blocks._updateSpatialGrid("1");

            expect(cellsHolding(1)).toEqual(["0,0", "0,12"]);
        });

        it("does no work when the block has not left its cells", () => {
            const before = blocks._blockGridCell.get(1);

            blocks._updateSpatialGrid("1");

            // The same Set object is kept, so an unchanged block is not rewritten.
            expect(blocks._blockGridCell.get(1)).toBe(before);
            // The early return must not leave a string alias behind either.
            expect([...blocks._blockGridCell.keys()]).toEqual([0, 1]);
            expect(cellsHolding("1")).toEqual([]);
            expectNumericKeysOnly();
        });
    });
});
