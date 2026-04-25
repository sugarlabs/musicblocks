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
});
