/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2026 Sapnil Biswas
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * @file Foundational unit tests for the Block class.
 * This file establishes the mocking infrastructure for the core Block logic.
 */

/* global jest, describe, it, expect, beforeEach */

const fs = require("fs");
const path = require("path");
const Block = require("../block");
const ManagedTimer = require("../utils/ManagedTimer");
const musicutils = require("../utils/musicutils");

Object.assign(global, {
    getTemperamentKeys: musicutils.getTemperamentKeys,
    getTemperament: musicutils.getTemperament,
    isCustomTemperament: musicutils.isCustomTemperament,
    isEquallyTempered: musicutils.isEquallyTempered,
    addTemperamentToDictionary: musicutils.addTemperamentToDictionary
});

// --- MOCK SETUP ---

// Mock CreateJS: keep parent/children relationships observable
// so disposal tests can verify actual unparenting behavior.
global.createjs = {
    Container: jest.fn().mockImplementation(() => {
        const container = {
            children: [],
            parent: null,
            visible: true,
            bitmapCache: { getCacheDataURL: jest.fn().mockReturnValue("cached-data-url") },
            addChild: jest.fn(function (child) {
                this.children.push(child);
                child.parent = this;
                return child;
            }),
            removeChild: jest.fn(function (child) {
                const idx = this.children.indexOf(child);
                if (idx !== -1) {
                    this.children.splice(idx, 1);
                }
                if (child.parent === this) {
                    child.parent = null;
                }
                return child;
            }),
            removeAllChildren: jest.fn(),
            removeAllEventListeners: jest.fn(),
            setChildIndex: jest.fn(),
            getBounds: jest.fn().mockReturnValue({ x: 0, y: 0, width: 100, height: 100 }),
            on: jest.fn(function (event, handler) {
                this._listeners = this._listeners || {};
                this._listeners[event] = handler;
                return handler;
            }),
            cache: jest.fn(),
            updateCache: jest.fn(),
            uncache: jest.fn()
        };
        return container;
    }),
    Bitmap: jest.fn().mockImplementation(image => ({
        visible: true,
        scaleX: 1,
        scaleY: 1,
        image: image,
        getBounds: jest.fn().mockReturnValue({ x: 0, y: 0, width: 50, height: 50 })
    })),
    Text: jest.fn().mockImplementation(() => ({
        visible: true
    })),
    Tween: {
        get: jest.fn().mockReturnValue({
            to: jest.fn().mockReturnThis()
        })
    }
};

// Mock DOM/Common utils
global.docById = jest.fn();
global._ = jest.fn(str => str);
global.last = jest.fn(arr => (arr && arr.length > 0 ? arr[arr.length - 1] : null));
global.delayExecution = jest.fn().mockResolvedValue(null);
global.getTextWidth = jest.fn().mockReturnValue(100);
global.retryWithBackoff = jest.fn(async ({ check, onSuccess }) => {
    const res = check ? check() : true;
    if (onSuccess) await onSuccess(res);
    return res;
});

// Mock window/global helpers
global.window = {
    btoa: jest.fn(str => str),
    base64Encode: global.base64Encode,
    hasMouse: false
};
global.document = {
    addEventListener: jest.fn()
};

// Mock Constants
global.STANDARDBLOCKHEIGHT = 20;
global.DEFAULTBLOCKSCALE = 1.0;

global.platformColor = {
    paletteLabelBackground: "#ffffff",
    paletteLabelSelected: "#0000ff",
    strokeColor: "#000000",
    fillColor: "#eeeeee",
    paletteBackground: "#cccccc",
    hoverColor: "#dddddd"
};

describe("Block Foundation", () => {
    let mockBlocks;
    let mockProtoBlock;

    beforeEach(() => {
        jest.clearAllMocks();

        mockBlocks = {
            activity: {
                refreshCanvas: jest.fn(),
                logo: {
                    synth: {
                        loadSynth: jest.fn()
                    }
                }
            },
            blockList: [],
            octaveNumber: jest.fn().mockReturnValue(false),
            noteValueNumber: jest.fn().mockReturnValue(false),
            octaveModifierNumber: jest.fn().mockReturnValue(false),
            intervalModifierNumber: jest.fn().mockReturnValue(false)
        };

        mockProtoBlock = {
            name: "forward",
            image: "forward.svg",
            size: 1,
            docks: [
                [0, 0, 0],
                [0, 0, 0]
            ],
            hidden: false,
            capabilities: Object.create(null)
        };
    });

    describe("Constructor", () => {
        it("should initialize with core properties from protoblock", () => {
            const block = new Block(mockProtoBlock, mockBlocks);

            expect(block.name).toBe("forward");
            expect(block.protoblock).toBe(mockProtoBlock);
            expect(block.blocks).toBe(mockBlocks);
            expect(block.image).toBe("forward.svg");
            expect(block.trash).toBe(false);
            expect(block.collapsed).toBe(false);
            expect(block.blockIndex).toBe(-1);
        });

        it("should handle null protoblock gracefully", () => {
            const block = new Block(null, mockBlocks);
            expect(block.protoblock).toBeUndefined();
        });

        it("should initialize overrideName if provided", () => {
            const block = new Block(mockProtoBlock, mockBlocks, "myOverride");
            expect(block.overrideName).toBe("myOverride");
        });
    });

    describe("Basic Logic Helpers", () => {
        it("getInfo() should return expected string", () => {
            const block = new Block(mockProtoBlock, mockBlocks);
            expect(block.getInfo()).toBe("forward block");
        });

        it("isCollapsible() should return true for collapsible blocks", () => {
            mockProtoBlock.capabilities.collapsible = true;
            const block = new Block(mockProtoBlock, mockBlocks);
            expect(block.isCollapsible()).toBe(true);

            mockProtoBlock.capabilities.collapsible = false;
            const block2 = new Block(mockProtoBlock, mockBlocks);
            expect(block2.isCollapsible()).toBe(false);
        });

        it("isInlineCollapsible() should return true for inline collapsible blocks", () => {
            mockProtoBlock.capabilities.inlineCollapsible = true;
            const block = new Block(mockProtoBlock, mockBlocks);
            expect(block.isInlineCollapsible()).toBe(true);

            mockProtoBlock.capabilities.inlineCollapsible = false;
            const block2 = new Block(mockProtoBlock, mockBlocks);
            expect(block2.isInlineCollapsible()).toBe(false);
        });

        it("hasCapability() should read protoblock capability metadata", () => {
            mockProtoBlock.capabilities.collapsible = true;
            mockProtoBlock.capabilities.specialInput = true;

            const block = new Block(mockProtoBlock, mockBlocks);
            expect(block.hasCapability("collapsible")).toBe(true);
            expect(block.getCapability("specialInput")).toBe(true);
        });

        it("should return falsey values when capability metadata is absent", () => {
            mockProtoBlock.capabilities = Object.create(null);

            const block = new Block(mockProtoBlock, mockBlocks);
            expect(block.hasCapability("collapsible")).toBe(false);
            expect(block.getCapability("collapsible")).toBeUndefined();
        });

        it("isNoHitBlock() should return true from capability metadata", () => {
            mockProtoBlock.capabilities.noHit = true;

            const block = new Block(mockProtoBlock, mockBlocks);
            expect(block.isNoHitBlock()).toBe(true);
        });

        it("isNoHitBlock() should respect explicit false metadata without legacy fallback", () => {
            mockProtoBlock.name = "hidden";
            mockProtoBlock.capabilities.noHit = false;

            const block = new Block(mockProtoBlock, mockBlocks);
            expect(block.isNoHitBlock()).toBe(false);
        });

        it("isNoHitBlock() should return false for ordinary blocks", () => {
            mockProtoBlock.name = "forward";
            mockProtoBlock.capabilities = Object.create(null);

            const block = new Block(mockProtoBlock, mockBlocks);
            expect(block.isNoHitBlock()).toBe(false);
        });

        it("isNoteContainer() should return true from capability metadata", () => {
            mockProtoBlock.capabilities.noteContainer = true;

            const block = new Block(mockProtoBlock, mockBlocks);
            expect(block.isNoteContainer()).toBe(true);
        });

        it("isNoteContainer() should respect explicit false metadata", () => {
            mockProtoBlock.name = "newnote";
            mockProtoBlock.capabilities.noteContainer = false;

            const block = new Block(mockProtoBlock, mockBlocks);
            expect(block.isNoteContainer()).toBe(false);
        });

        it("isNoteContainer() should return false for ordinary blocks", () => {
            mockProtoBlock.name = "forward";
            mockProtoBlock.capabilities = Object.create(null);

            const block = new Block(mockProtoBlock, mockBlocks);
            expect(block.isNoteContainer()).toBe(false);
        });

        it("isSoundSpecifier() should return true from capability metadata", () => {
            mockProtoBlock.capabilities.soundSpecifier = true;

            const block = new Block(mockProtoBlock, mockBlocks);
            expect(block.isSoundSpecifier()).toBe(true);
        });

        it("isSoundSpecifier() should return false for ordinary blocks", () => {
            mockProtoBlock.name = "forward";
            mockProtoBlock.capabilities = Object.create(null);

            const block = new Block(mockProtoBlock, mockBlocks);
            expect(block.isSoundSpecifier()).toBe(false);
        });

        it("hasValueDrivenLabel() should return true from capability metadata", () => {
            mockProtoBlock.capabilities.valueDrivenLabel = true;

            const block = new Block(mockProtoBlock, mockBlocks);
            expect(block.hasValueDrivenLabel()).toBe(true);
        });

        it("hasValueDrivenLabel() should respect explicit false metadata", () => {
            mockProtoBlock.name = "number";
            mockProtoBlock.capabilities.valueDrivenLabel = false;

            const block = new Block(mockProtoBlock, mockBlocks);
            expect(block.hasValueDrivenLabel()).toBe(false);
        });

        it("hasValueDrivenLabel() should return false for ordinary blocks", () => {
            mockProtoBlock.name = "forward";
            mockProtoBlock.capabilities = Object.create(null);

            const block = new Block(mockProtoBlock, mockBlocks);
            expect(block.hasValueDrivenLabel()).toBe(false);
        });

        it("hasWideLabel() should return true from capability metadata", () => {
            mockProtoBlock.capabilities.wideLabel = true;

            const block = new Block(mockProtoBlock, mockBlocks);
            expect(block.hasWideLabel()).toBe(true);
        });

        it("hasWideLabel() should respect explicit false metadata", () => {
            mockProtoBlock.name = "drumname";
            mockProtoBlock.capabilities.wideLabel = false;

            const block = new Block(mockProtoBlock, mockBlocks);
            expect(block.hasWideLabel()).toBe(false);
        });

        it("hasWideLabel() should return false for ordinary blocks", () => {
            mockProtoBlock.name = "forward";
            mockProtoBlock.capabilities = Object.create(null);

            const block = new Block(mockProtoBlock, mockBlocks);
            expect(block.hasWideLabel()).toBe(false);
        });

        describe("isArgumentLikeBlock()", () => {
            it("should return true for a normal value block (style 'value' / isArgBlock())", () => {
                mockProtoBlock.name = "number";
                mockProtoBlock.style = "value";
                mockProtoBlock.capabilities = Object.create(null);

                const block = new Block(mockProtoBlock, mockBlocks);
                expect(block.isArgumentLikeBlock()).toBe(true);
            });

            it("should return false for a normal command block", () => {
                mockProtoBlock.name = "forward";
                mockProtoBlock.style = "command";
                mockProtoBlock.capabilities = Object.create(null);

                const block = new Block(mockProtoBlock, mockBlocks);
                expect(block.isArgumentLikeBlock()).toBe(false);
            });

            it("should return true for doArg block which has argumentLike capability", () => {
                mockProtoBlock.name = "doArg";
                mockProtoBlock.style = "flow";
                mockProtoBlock.capabilities = { argumentLike: true };

                const block = new Block(mockProtoBlock, mockBlocks);
                expect(block.isArgumentLikeBlock()).toBe(true);
            });

            it("should return true for makeblock block which has argumentLike capability", () => {
                mockProtoBlock.name = "makeblock";
                mockProtoBlock.style = "left";
                mockProtoBlock.capabilities = { argumentLike: true };

                const block = new Block(mockProtoBlock, mockBlocks);
                expect(block.isArgumentLikeBlock()).toBe(true);
            });
        });

        describe("discreteChoice capability and _usePiemenu()", () => {
            it("hasCapability('discreteChoice') should return true when configured in metadata", () => {
                mockProtoBlock.capabilities.discreteChoice = true;
                const block = new Block(mockProtoBlock, mockBlocks);
                expect(block.hasCapability("discreteChoice")).toBe(true);
                expect(block._usePiemenu()).toBe(true);
            });

            it("hasCapability('discreteChoice') should return false when not configured", () => {
                mockProtoBlock.capabilities = Object.create(null);
                const block = new Block(mockProtoBlock, mockBlocks);
                expect(block.hasCapability("discreteChoice")).toBe(false);
                expect(block._usePiemenu()).toBe(false);
            });

            it("should support dynamic inherited pie menus based on parent connections", () => {
                mockProtoBlock.name = "number";
                mockProtoBlock.capabilities = Object.create(null);

                const childBlock = new Block(mockProtoBlock, mockBlocks);
                childBlock.blockIndex = 1;
                childBlock.connections = [0, null];

                const parentProtoBlock = {
                    name: "tempo",
                    capabilities: Object.create(null),
                    piemenuValuesC1: [60, 120, 180]
                };
                const parentBlock = new Block(parentProtoBlock, mockBlocks);
                parentBlock.blockIndex = 0;
                parentBlock.connections = [null, 1];

                mockBlocks.blockList = [parentBlock, childBlock];
                mockBlocks.octaveNumber = jest.fn(() => false);
                mockBlocks.noteValueNumber = jest.fn(() => false);
                mockBlocks.octaveModifierNumber = jest.fn(() => false);
                mockBlocks.intervalModifierNumber = jest.fn(() => false);

                expect(childBlock.hasCapability("discreteChoice")).toBe(false);
                expect(childBlock._usePiemenu()).toBe(true);
            });

            it("should handle empty/unpopulated connections array without throwing", () => {
                mockProtoBlock.capabilities = Object.create(null);
                const block = new Block(mockProtoBlock, mockBlocks);
                block.connections = []; // connections[0] is undefined

                expect(() => block._usePiemenu()).not.toThrow();
                expect(block._usePiemenu()).toBe(false);
            });
        });

        it("copySize() should sync size from protoblock", () => {
            mockProtoBlock.size = 5;
            const block = new Block(mockProtoBlock, mockBlocks);
            block.size = 1;
            block.copySize();
            expect(block.size).toBe(5);
        });

        describe("ignore()", () => {
            it("should return true if bitmap is null", () => {
                const block = new Block(mockProtoBlock, mockBlocks);
                block.bitmap = null;
                expect(block.ignore()).toBe(true);
            });

            it("should return true if name is 'hidden' or 'hiddennoflow'", () => {
                const block = new Block(mockProtoBlock, mockBlocks);
                block.bitmap = {};
                block.name = "hidden";
                expect(block.ignore()).toBe(true);
                block.name = "hiddennoflow";
                expect(block.ignore()).toBe(true);
            });

            it("should return true if in trash", () => {
                const block = new Block(mockProtoBlock, mockBlocks);
                block.bitmap = {};
                block.trash = true;
                expect(block.ignore()).toBe(true);
            });

            it("should return false if block is visible and not hidden/trash", () => {
                const block = new Block(mockProtoBlock, mockBlocks);
                block.bitmap = { visible: true };
                block.highlightBitmap = { visible: false };
                expect(block.ignore()).toBe(false);
            });
        });

        describe("offScreen()", () => {
            it("should return true if boundary.offScreen returns true and block is not in trash", () => {
                const block = new Block(mockProtoBlock, mockBlocks);
                block.container = { x: 100, y: 200 };
                block.trash = false;
                const mockBoundary = { offScreen: jest.fn().mockReturnValue(true) };
                expect(block.offScreen(mockBoundary)).toBe(true);
                expect(mockBoundary.offScreen).toHaveBeenCalledWith(100, 200);
            });

            it("should return false if block is in trash even if boundary says offscreen", () => {
                const block = new Block(mockProtoBlock, mockBlocks);
                block.trash = true;
                const mockBoundary = { offScreen: jest.fn().mockReturnValue(true) };
                expect(block.offScreen(mockBoundary)).toBe(false);
            });
        });
    });

    describe("State Management", () => {
        let block;
        beforeEach(() => {
            block = new Block(mockProtoBlock, mockBlocks);
            block.container = new global.createjs.Container();
            block.bitmap = new global.createjs.Bitmap();
            block.highlightBitmap = new global.createjs.Bitmap();
        });

        describe("highlight()", () => {
            it("should set highlightBitmap to visible and bitmap to hidden", () => {
                block.highlight();
                expect(block.highlightBitmap.visible).toBe(true);
                expect(block.bitmap.visible).toBe(false);
                expect(block.container.updateCache).toHaveBeenCalled();
            });

            it("should not update a cache that has not been created yet", () => {
                block.container.bitmapCache = null;

                expect(() => block.highlight()).not.toThrow();
                expect(block.highlightBitmap.visible).toBe(true);
                expect(block.bitmap.visible).toBe(false);
                expect(block.container.updateCache).not.toHaveBeenCalled();
            });

            it("should do nothing if trashed", () => {
                block.trash = true;
                block.highlight();
                expect(block.highlightBitmap.visible).toBe(true); // default from mock is true
                expect(block.container.updateCache).not.toHaveBeenCalled();
            });
        });

        describe("unhighlight()", () => {
            it("should set bitmap to visible and highlightBitmap to hidden", () => {
                block.highlight(); // start highlighted
                block.unhighlight();
                expect(block.bitmap.visible).toBe(true);
                expect(block.highlightBitmap.visible).toBe(false);
            });

            it("should tolerate unhighlighting before highlight artwork has loaded", () => {
                block.highlightBitmap = null;
                block.container.bitmapCache = null;

                expect(() => block.unhighlight()).not.toThrow();
                expect(block.bitmap.visible).toBe(true);
                expect(block.container.visible).toBe(true);
            });

            it("should tolerate highlighting before highlight artwork has loaded", () => {
                block.highlightBitmap = null;
                block.disconnectedHighlightBitmap = null;
                block.container.bitmapCache = null;

                expect(() => block.highlight()).not.toThrow();
                expect(block.bitmap.visible).toBe(false);
                expect(block.container.visible).toBe(true);
            });

            it("should not update a cache that has not been created yet", () => {
                block.container.bitmapCache = null;

                expect(() => block.unhighlight()).not.toThrow();
                expect(block.bitmap.visible).toBe(true);
                expect(block.highlightBitmap.visible).toBe(false);
                expect(block.container.updateCache).not.toHaveBeenCalled();
            });
        });

        describe("unhighlightSelectedBlocks()", () => {
            it("should not update a cache that has not been created yet", () => {
                mockBlocks.unhighlight = jest.fn();
                block.disconnectedBitmap = { visible: false };
                block.container.bitmapCache = null;

                expect(() => block.unhighlightSelectedBlocks(0, true)).not.toThrow();
                expect(mockBlocks.unhighlight).toHaveBeenCalledWith(0, true);
                expect(block.disconnectedBitmap.visible).toBe(true);
                expect(block.container.updateCache).not.toHaveBeenCalled();
            });

            it("should tolerate null disconnectedBitmap when selection is true", () => {
                mockBlocks.unhighlight = jest.fn();
                block.disconnectedBitmap = null;
                block.collapsed = false;

                expect(() => block.unhighlightSelectedBlocks(0, true)).not.toThrow();
                expect(mockBlocks.unhighlight).toHaveBeenCalledWith(0, true);
            });
        });

        describe("ignore()", () => {
            it("should evaluate visibility safely when highlightBitmap is null", () => {
                block.bitmap = { visible: false };
                block.highlightBitmap = null;
                block.collapseBlockBitmap = null;

                expect(() => block.ignore()).not.toThrow();
                expect(block.ignore()).toBe(true);
            });
        });

        describe("collapseToggle()", () => {
            it("should tolerate toggling collapse when optional collapse artwork is null", () => {
                block.collapseBlockBitmap = { visible: true };
                block.collapseButtonBitmap = null;
                block.expandButtonBitmap = null;
                block.highlightCollapseBlockBitmap = null;
                block.collapseText = null;
                mockBlocks.findDragGroup = jest.fn();
                mockBlocks.dragGroup = [0];

                expect(() => block.collapseToggle()).not.toThrow();
                expect(block.collapsed).toBe(true);
            });
        });

        describe("collapsed labels with an empty slot", () => {
            beforeEach(() => {
                block.collapseText = { text: "" };
                global.NSYMBOLS = global.NSYMBOLS || {};
                global.RSYMBOLS = global.RSYMBOLS || {};
                global.DEGREES = global.DEGREES || "unison 2nd 3rd 4th 5th 6th 7th octave";
            });

            it("should not throw for a note whose divide has an empty slot", () => {
                block.name = "newnote";
                block.connections = [null, 1, null];
                mockBlocks.blockList = [
                    block,
                    { name: "divide", connections: [0, null, 3] },
                    null,
                    { name: "number", value: 4, connections: [1] }
                ];
                mockBlocks.findFirstPitchBlock = jest.fn(() => null);

                expect(() => block._newNoteLabel()).not.toThrow();
            });

            it("should not throw for an interval whose number slot is empty", () => {
                block.name = "interval";
                block.blockIndex = 0;
                block.connections = [null, null, null];
                mockBlocks.blockList = [block];
                mockBlocks.findNestedIntervalBlock = jest.fn(() => null);
                mockBlocks.findNoteBlock = jest.fn(() => null);

                expect(() => block._intervalLabel()).not.toThrow();
            });
        });

        describe("regenerateArtwork()", () => {
            it("should remove old bitmaps and call generateArtwork", () => {
                block.bitmap = new global.createjs.Bitmap();
                block.highlightBitmap = new global.createjs.Bitmap();
                const generateSpy = jest
                    .spyOn(block, "generateArtwork")
                    .mockImplementation(() => {});

                block.regenerateArtwork(false);

                expect(block.container.removeChild).toHaveBeenCalledWith(block.bitmap);
                expect(block.container.removeChild).toHaveBeenCalledWith(block.highlightBitmap);
                expect(generateSpy).toHaveBeenCalledWith(false);
                generateSpy.mockRestore();
            });

            it("should handle collapse artwork when collapse is true", () => {
                block.bitmap = new global.createjs.Bitmap();
                block.highlightBitmap = new global.createjs.Bitmap();
                block.collapseBlockBitmap = new global.createjs.Bitmap();
                block.collapseButtonBitmap = new global.createjs.Bitmap();
                block.expandButtonBitmap = new global.createjs.Bitmap();
                block.highlightCollapseBlockBitmap = new global.createjs.Bitmap();
                const generateSpy = jest
                    .spyOn(block, "generateArtwork")
                    .mockImplementation(() => {});

                block.regenerateArtwork(true);

                expect(block.container.removeChild).toHaveBeenCalledWith(
                    block.collapseButtonBitmap
                );
                expect(block.container.removeChild).toHaveBeenCalledWith(block.expandButtonBitmap);
                expect(block.container.removeChild).toHaveBeenCalledWith(block.collapseBlockBitmap);
                expect(block.container.removeChild).toHaveBeenCalledWith(
                    block.highlightCollapseBlockBitmap
                );
                generateSpy.mockRestore();
            });

            it("should handle null bitmaps gracefully", () => {
                block.bitmap = null;
                block.highlightBitmap = null;
                const generateSpy = jest
                    .spyOn(block, "generateArtwork")
                    .mockImplementation(() => {});

                expect(() => block.regenerateArtwork(false)).not.toThrow();
                expect(generateSpy).toHaveBeenCalledWith(false);
                generateSpy.mockRestore();
            });

            it("should restore imageBitmap after regeneration", () => {
                block.bitmap = new global.createjs.Bitmap();
                block.highlightBitmap = new global.createjs.Bitmap();
                const mockImage = { width: 50, height: 50 };
                block.imageBitmap = { image: mockImage };
                const generateSpy = jest
                    .spyOn(block, "generateArtwork")
                    .mockImplementation(() => {});
                block._positionMedia = jest.fn();

                block.regenerateArtwork(false);

                expect(block.container.addChild).toHaveBeenCalledWith(block.imageBitmap);
                expect(block._positionMedia).toHaveBeenCalledWith(
                    block.imageBitmap,
                    50,
                    50,
                    block.protoblock.scale
                );
                generateSpy.mockRestore();
            });
        });
    });

    describe("isDisconnected()", () => {
        it("should return false when disconnected artwork is unavailable", () => {
            const block = new Block(mockProtoBlock, mockBlocks);

            expect(block.isDisconnected()).toBe(false);
        });

        it("should return false when the block has a parent connection", () => {
            const block = new Block(mockProtoBlock, mockBlocks);
            block.disconnectedBitmap = {};
            block.connections = [4, null];

            expect(block.isDisconnected()).toBe(false);
        });

        it("should return true for an unconnected argument block", () => {
            mockProtoBlock.style = "arg";
            const block = new Block(mockProtoBlock, mockBlocks);
            block.disconnectedBitmap = {};
            block.connections = [null, 2];

            expect(block.isDisconnected()).toBe(true);
        });

        it("should return true for an unconnected command block with no child", () => {
            const block = new Block(mockProtoBlock, mockBlocks);
            block.disconnectedBitmap = {};
            block.connections = [null, null];

            expect(block.isDisconnected()).toBe(true);
        });

        it("should recognize a hidden child with no parent as disconnected", () => {
            const block = new Block(mockProtoBlock, mockBlocks);
            block.disconnectedBitmap = {};
            block.connections = [null, 1];
            mockBlocks.blockList = [block, { name: "hidden", connections: [null] }];

            expect(block.isDisconnected()).toBe(true);
        });

        it("should not treat a non-inline collapsible block as disconnected", () => {
            mockProtoBlock.capabilities.collapsible = true;
            const block = new Block(mockProtoBlock, mockBlocks);
            block.disconnectedBitmap = {};
            block.connections = [null, null];

            expect(block.isDisconnected()).toBe(false);
        });
    });

    describe("block type and layout helpers", () => {
        it.each([
            ["value", "isValueBlock", true],
            ["arg", "isArgBlock", true],
            ["twoarg", "isTwoArgBlock", true],
            ["argflowclamp", "isArgFlowClampBlock", true],
            ["doubleclamp", "isDoubleClampBlock", true],
            ["argclamp", "isArgClamp", true],
            ["argclamparg", "isArgClamp", true],
            ["command", "isValueBlock", false]
        ])("%s style returns %s for %s", (style, method, expected) => {
            const block = new Block({ ...mockProtoBlock, style }, mockBlocks);

            expect(block[method]()).toBe(expected);
        });

        it("recognizes boolean comparison block names", () => {
            expect(
                ["equal", "greater", "less"].map(name => {
                    const block = new Block({ ...mockProtoBlock, name }, mockBlocks);
                    return block.isTwoArgBooleanBlock();
                })
            ).toEqual([true, true, true]);

            const block = new Block({ ...mockProtoBlock, name: "forward" }, mockBlocks);
            expect(block.isTwoArgBooleanBlock()).toBe(false);
        });

        it("recognizes left clamp, no-run, and expandable metadata", () => {
            const action = new Block(
                { ...mockProtoBlock, name: "action", isLeftClamp: true, expandable: true },
                mockBlocks
            );

            expect(action.isLeftClampBlock()).toBe(true);
            expect(action.isNoRunBlock()).toBe(true);
            expect(action.isExpandableBlock()).toBe(true);
        });

        it("returns false for non-expandable and non-left-clamp blocks", () => {
            const block = new Block(
                { ...mockProtoBlock, name: "forward", isLeftClamp: false, expandable: false },
                mockBlocks
            );

            expect(block.isLeftClampBlock()).toBe(false);
            expect(block.isNoRunBlock()).toBe(false);
            expect(block.isExpandableBlock()).toBe(false);
        });

        it("uses protoblock capability methods when available", () => {
            const protoblock = {
                ...mockProtoBlock,
                hasCapability: jest.fn().mockReturnValue(true),
                getCapability: jest.fn().mockReturnValue("configured")
            };
            const block = new Block(protoblock, mockBlocks);

            expect(block.hasCapability("custom")).toBe(true);
            expect(block.getCapability("custom")).toBe("configured");
            expect(protoblock.hasCapability).toHaveBeenCalledWith("custom");
            expect(protoblock.getCapability).toHaveBeenCalledWith("custom");
        });

        it("returns ARG for a two-argument block's first argument slot", () => {
            const block = new Block({ ...mockProtoBlock, style: "twoarg" }, mockBlocks);
            block.connections = [null, null, null];
            block.docks = [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, "in"]
            ];

            expect(block.getLayoutUpdateType(1)).toBe("ARG");
        });

        it("returns ARG for expandable argument blocks", () => {
            const block = new Block(
                { ...mockProtoBlock, style: "value", expandable: true },
                mockBlocks
            );
            block.connections = [null, null];
            block.docks = [
                [0, 0, 0],
                [0, 0, "in"]
            ];

            expect(block.getLayoutUpdateType(1)).toBe("ARG");
        });

        it("returns FLOW for a flow input at the final connection", () => {
            const block = new Block(mockProtoBlock, mockBlocks);
            block.connections = [null, null, null];
            block.docks = [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, "in"]
            ];

            expect(block.getLayoutUpdateType(1)).toBe("FLOW");
        });

        it("returns null for invalid, argument-clamp, and unrelated connections", () => {
            const block = new Block({ ...mockProtoBlock, style: "argclamp" }, mockBlocks);
            block.connections = [null, null, null];
            block.docks = [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, "in"]
            ];

            expect(block.getLayoutUpdateType(-1)).toBeNull();
            expect(block.getLayoutUpdateType(1)).toBeNull();
            expect(block.getLayoutUpdateType(0)).toBeNull();
        });

        it("builds a stable id from the block index", () => {
            const block = new Block(mockProtoBlock, mockBlocks);
            block.blockIndex = 37;

            expect(block.getBlockId()).toBe("_37");
        });
    });

    describe("Action label changed behavior", () => {
        let mockBlocksForRename;
        let showPalette;
        let removeActionPrototype;
        let findUniqueActionName;
        let originalDocById;
        let block;

        beforeEach(() => {
            showPalette = jest.fn();
            removeActionPrototype = jest.fn();
            findUniqueActionName = jest.fn().mockImplementation(name => name);

            mockBlocksForRename = {
                activity: { refreshCanvas: jest.fn(), errorMsg: jest.fn() },
                blockList: [],
                palettes: {
                    hide: jest.fn(),
                    show: jest.fn(),
                    updatePalettes: jest.fn(),
                    showPalette,
                    removeActionPrototype,
                    dict: {
                        action: { protoList: [] }
                    }
                },
                newNameddoBlock: jest.fn(),
                findUniqueActionName,
                setActionProtoVisibility: jest.fn(),
                renameNameddos: jest.fn(),
                renameDos: jest.fn(),
                actionMetadata: jest.fn().mockReturnValue({ hasReturn: false, hasArgs: false })
            };

            block = new Block({ name: "text", image: "", size: 1, docks: [] }, mockBlocksForRename);
            block.name = "text";
            block.blockIndex = 0;
            block.connections = [1];
            block.text = { text: "" };
            block.container = { setChildIndex: jest.fn(), children: [] };
            block.updateCache = jest.fn();

            const cblock = { name: "action", connections: [null, 0] };
            mockBlocksForRename.blockList[0] = block;
            mockBlocksForRename.blockList[1] = cblock;

            originalDocById = global.docById;
            global.docById = jest.fn().mockReturnValue({ style: {} });
        });

        afterEach(() => {
            global.docById = originalDocById;
        });

        it("should call showPalette('action') and NOT call removeActionPrototype when oldValue === newValue and closeInput is true", () => {
            block.value = "myAction";
            block.label = { value: "myAction", style: { display: "" } };

            block._labelChanged(true, true);

            expect(mockBlocksForRename.palettes.updatePalettes).toHaveBeenCalledWith("action");
            expect(showPalette).toHaveBeenCalledWith("action");
            expect(removeActionPrototype).not.toHaveBeenCalled();
        });

        it("should call findUniqueActionName with parent index and removeActionPrototype when oldValue !== newValue", () => {
            block.value = "oldAction";
            block.label = { value: "newAction", style: { display: "" } };

            block._labelChanged(true, true);

            expect(removeActionPrototype).toHaveBeenCalledWith("oldAction");
            expect(findUniqueActionName).toHaveBeenCalledWith("newAction", 1);
            expect(mockBlocksForRename.palettes.updatePalettes).toHaveBeenCalledWith("action");
            expect(showPalette).toHaveBeenCalledWith("action");
            expect(mockBlocksForRename.activity.refreshCanvas).toHaveBeenCalled();
        });

        it("should NOT call renameNameddos or updatePalettes when closeInput is false", () => {
            block.value = "oldAction";
            block.label = { value: "newAction", style: { display: "" } };

            block._labelChanged(false, true);

            expect(mockBlocksForRename.renameNameddos).not.toHaveBeenCalled();
            expect(mockBlocksForRename.palettes.updatePalettes).not.toHaveBeenCalled();
        });

        it("should NOT enforce uniqueness or rewrite label value while user is typing (closeInput is false)", () => {
            findUniqueActionName.mockReturnValue("Action1");
            block.value = "Action1";
            block.label = { value: "Action", style: { display: "" } };

            block._labelChanged(false, true);

            expect(findUniqueActionName).not.toHaveBeenCalled();
            expect(removeActionPrototype).not.toHaveBeenCalled();
            expect(block.label.value).toBe("Action");
        });

        it("should enforce uniqueness and rewrite label value upon commit (closeInput is true)", () => {
            findUniqueActionName.mockReturnValue("Action1");
            block.value = "oldAction";
            block.label = { value: "Action", style: { display: "" } };

            block._labelChanged(true, true);

            expect(findUniqueActionName).toHaveBeenCalledWith("Action", 1);
            expect(removeActionPrototype).toHaveBeenCalledWith("oldAction");
            expect(mockBlocksForRename.activity.errorMsg).toHaveBeenCalled();
            expect(block.label.value).toBe("Action1");
            expect(block.value).toBe("Action1");
        });

        it("should keep label value unchanged upon commit when chosen name is already unique (closeInput is true)", () => {
            findUniqueActionName.mockReturnValue("ActionUnique");
            block.value = "oldAction";
            block.label = { value: "ActionUnique", style: { display: "" } };

            block._labelChanged(true, true);

            expect(findUniqueActionName).toHaveBeenCalledWith("ActionUnique", 1);
            expect(removeActionPrototype).toHaveBeenCalledWith("oldAction");
            expect(mockBlocksForRename.activity.errorMsg).not.toHaveBeenCalled();
            expect(block.label.value).toBe("ActionUnique");
            expect(block.value).toBe("ActionUnique");
        });

        it("should refresh the action palette even when the collision-resolved name equals the original (closeInput is true)", () => {
            // User had "action1", typed "action" (collides), resolves back to "action1".
            findUniqueActionName.mockReturnValue("action1");
            block.value = "action1";
            block.label = { value: "action", style: { display: "" } };

            block._labelChanged(true, true);

            // The palette must still refresh because the user intentionally typed a new name.
            expect(mockBlocksForRename.palettes.updatePalettes).toHaveBeenCalledWith("action");
        });
    });

    describe("loadThumbnail()", () => {
        let block;
        let mockImageInstance;
        let originalImage;

        beforeEach(() => {
            block = new Block(mockProtoBlock, mockBlocks);
            block.blockIndex = 0;
            block.blocks.blockList = [{ value: null }];
            block.removeChildBitmap = jest.fn();
            block._positionMedia = jest.fn();
            block.container = new global.createjs.Container();
            block.updateCache = jest.fn();

            originalImage = global.Image;
            global.Image = jest.fn(() => {
                mockImageInstance = {
                    src: "",
                    width: 100,
                    height: 100,
                    naturalWidth: 100,
                    naturalHeight: 100,
                    onload: null
                };
                return mockImageInstance;
            });
        });

        afterEach(() => {
            global.Image = originalImage;
        });

        it("should preserve GIF animation for data URI", () => {
            block.loadThumbnail("data:image/gif;base64,R0lGODlh");
            expect(mockImageInstance.onload).not.toBeNull();
            mockImageInstance.onload();

            expect(block.value).toBe("data:image/gif;base64,R0lGODlh");
            expect(block.imageBitmap).toBeDefined();
        });

        it("should preserve GIF animation for URL ending in .gif", () => {
            block.loadThumbnail("http://example.com/image.gif");
            mockImageInstance.onload();

            expect(block.value).toBe("http://example.com/image.gif");
        });

        it("should fallback to manual bounds calculation if getBounds returns falsy", () => {
            const mockCache = jest.fn();
            global.createjs.Container.mockImplementationOnce(() => ({
                addChild: jest.fn(),
                removeChild: jest.fn(),
                getBounds: jest.fn().mockReturnValue(null),
                cache: mockCache,
                bitmapCache: { getCacheDataURL: jest.fn().mockReturnValue("fallback-cached") }
            }));

            block.loadThumbnail("http://example.com/image.png");
            mockImageInstance.onload();

            expect(mockCache).toHaveBeenCalledWith(0, 0, 100, 100);
            expect(block.value).toBe("fallback-cached");
        });

        it("restores the media placeholder when an empty value has no configured artwork", () => {
            block.blocks.blockList[0] = block;
            block.value = null;
            block.name = "media";
            block.image = null;
            block.removeChildBitmap = Block.prototype.removeChildBitmap.bind(block);
            const selectedThumbnail = { name: "media" };
            block.container.addChild(selectedThumbnail);
            block.imageBitmap = selectedThumbnail;

            block.loadThumbnail(null);
            expect(block.container.children).not.toContain(selectedThumbnail);
            expect(block.imageBitmap).toBeNull();
            expect(block.image).toBe("images/load-media.svg");
            expect(block.updateCache).toHaveBeenCalledTimes(1);
            expect(mockImageInstance.src).toBe("images/load-media.svg");

            mockImageInstance.onload();

            expect(block.container.children).toHaveLength(1);
            expect(block.container.children[0]).not.toBe(selectedThumbnail);
            expect(block.container.children[0].name).toBe("media");
            expect(block.imageBitmap).toBe(block.container.children[0]);
            expect(block.updateCache).toHaveBeenCalledTimes(2);
        });

        it("records the effective converted value for a user selection", () => {
            block.blocks.actionHistory = [];
            block.blocks.redoActionHistory = [{ type: "move", blockId: 1 }];
            block.blocks.isUndoingOrRedoing = false;
            block.value = "selected-source";
            block.blocks.blockList[0] = block;
            const reservation = block._reserveValueChange("old-cached-value", "selected-source");

            block.loadThumbnail(null, reservation);
            mockImageInstance.onload();

            expect(block.blocks.actionHistory).toEqual([
                {
                    type: "value_change",
                    blockId: 0,
                    oldValue: "old-cached-value",
                    newValue: "cached-data-url",
                    oldText: null,
                    newText: null
                }
            ]);
            expect(block.blocks.redoActionHistory).toEqual([]);
        });

        it("preserves redo history when conversion produces the existing value", () => {
            block.blocks.actionHistory = [];
            block.blocks.redoActionHistory = [{ type: "move", blockId: 1 }];
            block.blocks.isUndoingOrRedoing = false;
            block.value = "selected-source";
            block.blocks.blockList[0] = block;
            const reservation = block._reserveValueChange("cached-data-url", "selected-source");

            block.loadThumbnail(null, reservation);
            mockImageInstance.onload();

            expect(block.blocks.actionHistory).toEqual([]);
            expect(block.blocks.redoActionHistory).toEqual([{ type: "move", blockId: 1 }]);
        });

        it("cancels a failed selection and restores its previous history state", () => {
            block.blocks.actionHistory = [];
            block.blocks.redoActionHistory = [{ type: "move", blockId: 1 }];
            block.blocks.isUndoingOrRedoing = false;
            block.value = "selected-source";
            block.blocks.blockList[0] = block;
            const reservation = block._reserveValueChange("old-image", "selected-source");

            block.loadThumbnail(null, reservation);
            mockImageInstance.onerror();

            expect(block.value).toBe("old-image");
            expect(block.blocks.actionHistory).toEqual([]);
            expect(block.blocks.redoActionHistory).toEqual([{ type: "move", blockId: 1 }]);
        });

        it("does not cancel history when an older image load fails", () => {
            const images = [];
            global.Image = jest.fn(() => {
                const image = {
                    src: "",
                    width: 100,
                    height: 100,
                    naturalWidth: 100,
                    naturalHeight: 100,
                    onload: null,
                    onerror: null
                };
                images.push(image);
                return image;
            });
            block.blocks.actionHistory = [];
            block.blocks.redoActionHistory = [];
            block.blocks.isUndoingOrRedoing = false;
            block.value = "selected-source";
            block.blocks.blockList[0] = block;
            const reservation = block._reserveValueChange("old-image", "selected-source");

            block.loadThumbnail(null, reservation);
            block.blocks.actionHistory.pop();
            block.blocks.redoActionHistory.push(reservation.action);
            block.value = "old-image";
            block.loadThumbnail(null);
            images[0].onerror();

            expect(block.value).toBe("old-image");
            expect(block.blocks.actionHistory).toEqual([]);
            expect(block.blocks.redoActionHistory).toEqual([reservation.action]);
        });

        it("does not reapply a pending selection after it has been undone", () => {
            block.blocks.actionHistory = [];
            block.blocks.redoActionHistory = [];
            block.blocks.isUndoingOrRedoing = false;
            block.value = "selected-source";
            block.blocks.blockList[0] = block;
            const reservation = block._reserveValueChange("old-image", "selected-source");

            block.loadThumbnail(null, reservation);
            block.blocks.actionHistory.pop();
            block.blocks.redoActionHistory.push(reservation.action);
            block.value = "old-image";
            mockImageInstance.onload();

            expect(block.value).toBe("old-image");
            expect(reservation.action.newValue).toBe("cached-data-url");
        });

        it("does not let an older image load overwrite a newer selection", () => {
            const images = [];
            global.Image = jest.fn(() => {
                const image = {
                    src: "",
                    width: 100,
                    height: 100,
                    naturalWidth: 100,
                    naturalHeight: 100,
                    onload: null,
                    onerror: null
                };
                images.push(image);
                return image;
            });
            block.blocks.actionHistory = [];
            block.blocks.redoActionHistory = [];
            block.blocks.isUndoingOrRedoing = false;
            block.blocks.blockList[0] = block;

            const first = block._reserveValueChange("old-image", "first.gif");
            block.value = "first.gif";
            block.loadThumbnail("first.gif", first);

            const second = block._reserveValueChange("first.gif", "second.gif");
            block.value = "second.gif";
            block.loadThumbnail("second.gif", second);
            const completeValueChange = jest.spyOn(block, "_completeValueChange");

            images[1].onload();
            images[0].onload();

            expect(block.value).toBe("second.gif");
            expect(completeValueChange).toHaveBeenCalledTimes(1);
            expect(completeValueChange).toHaveBeenCalledWith(second, "second.gif");
            expect(block.blocks.actionHistory.map(action => action.newValue)).toEqual([
                "first.gif",
                "second.gif"
            ]);
        });
    });

    describe("media selection undo history", () => {
        it("reserves a built-in image history entry before thumbnail conversion", () => {
            const selectCallbacks = [];
            global.openSvgAssetSelector = jest.fn(onSelect => selectCallbacks.push(onSelect));
            const block = new Block(
                { ...mockProtoBlock, name: "media", capabilities: Object.create(null) },
                {
                    ...mockBlocks,
                    actionHistory: [],
                    redoActionHistory: [{ type: "move", blockId: 0 }],
                    isUndoingOrRedoing: false
                }
            );
            block.blockIndex = 2;
            block.value = "old-image";
            block.loadThumbnail = jest.fn();

            block._doOpenMedia(2);
            selectCallbacks[0]("selected-image");

            expect(block.blocks.actionHistory).toEqual([
                {
                    type: "value_change",
                    blockId: 2,
                    oldValue: "old-image",
                    newValue: "selected-image",
                    oldText: null,
                    newText: null
                }
            ]);
            expect(block.blocks.redoActionHistory).toEqual([]);
            const reservation = block.loadThumbnail.mock.calls[0][1];
            expect(reservation.action).toBe(block.blocks.actionHistory[0]);

            const laterAction = { type: "move", blockId: 1 };
            block.blocks.actionHistory.push(laterAction);
            block._completeValueChange(reservation, "converted-image");

            expect(block.blocks.actionHistory).toEqual([
                expect.objectContaining({
                    type: "value_change",
                    oldValue: "old-image",
                    newValue: "converted-image"
                }),
                laterAction
            ]);

            delete global.openSvgAssetSelector;
        });

        it("records an uploaded image selection", () => {
            const originalFileReader = global.FileReader;
            const originalScroll = window.scroll;
            let changeHandler;
            const fileChooser = {
                value: "",
                files: [{ name: "photo.png" }],
                addEventListener: jest.fn((event, handler) => {
                    if (event === "change") changeHandler = handler;
                }),
                removeEventListener: jest.fn(),
                focus: jest.fn(),
                click: jest.fn()
            };
            global.docById = jest.fn().mockReturnValue(fileChooser);
            window.scroll = jest.fn();
            global.FileReader = class {
                constructor() {
                    this.result = "uploaded-image";
                }

                readAsDataURL() {
                    this.onloadend();
                }
            };
            const block = new Block(
                { ...mockProtoBlock, name: "media", capabilities: Object.create(null) },
                {
                    ...mockBlocks,
                    actionHistory: [],
                    redoActionHistory: [],
                    isUndoingOrRedoing: false
                }
            );
            block.blockIndex = 3;
            block.value = "old-image";
            block.loadThumbnail = jest.fn();

            block._doOpenMediaFromDevice(3);
            changeHandler();

            expect(block.blocks.actionHistory).toHaveLength(1);
            expect(block.loadThumbnail.mock.calls[0][1].action).toBe(block.blocks.actionHistory[0]);

            global.FileReader = originalFileReader;
            window.scroll = originalScroll;
        });

        it.each(["audiofile", "loadFile"])("records a %s upload and clears redo history", name => {
            const originalFileReader = global.FileReader;
            const originalScroll = window.scroll;
            let changeHandler;
            const fileChooser = {
                value: "",
                files: [{ name: "lesson.dat" }],
                addEventListener: jest.fn((event, handler) => {
                    if (event === "change") changeHandler = handler;
                }),
                removeEventListener: jest.fn(),
                focus: jest.fn(),
                click: jest.fn()
            };
            global.docById = jest.fn().mockReturnValue(fileChooser);
            window.scroll = jest.fn();
            const expectedResult =
                name === "audiofile" ? "data:audio/mock;base64,AAAA" : "plain text";
            global.FileReader = class {
                constructor() {
                    this.result = null;
                }

                readAsDataURL() {
                    this.result = "data:audio/mock;base64,AAAA";
                    this.onloadend();
                }

                readAsText() {
                    this.result = "plain text";
                    this.onloadend();
                }
            };
            const block = new Block(
                { ...mockProtoBlock, name, capabilities: Object.create(null) },
                {
                    ...mockBlocks,
                    actionHistory: [],
                    redoActionHistory: [{ type: "move", blockId: 0 }],
                    isUndoingOrRedoing: false,
                    updateBlockText: jest.fn()
                }
            );
            block.blockIndex = 4;
            block.value = ["old.dat", "old-contents"];

            block._doOpenMediaFromDevice(4);
            changeHandler();

            expect(block.blocks.actionHistory).toEqual([
                {
                    type: "value_change",
                    blockId: 4,
                    oldValue: ["old.dat", "old-contents"],
                    newValue: ["lesson.dat", expectedResult],
                    oldText: null,
                    newText: null
                }
            ]);
            expect(block.blocks.redoActionHistory).toEqual([]);
            expect(block.blocks.updateBlockText).toHaveBeenCalledWith(4);

            block.blocks.actionHistory = [];
            block.blocks.redoActionHistory = [{ type: "move", blockId: 0 }];
            changeHandler();

            expect(block.blocks.actionHistory).toEqual([]);
            expect(block.blocks.redoActionHistory).toEqual([{ type: "move", blockId: 0 }]);

            global.FileReader = originalFileReader;
            window.scroll = originalScroll;
        });

        it.each([
            ["media", "myMedia"],
            ["audiofile", "audioInput"],
            ["loadFile", "myOpenAll"]
        ])("opens the %s picker on the #%s file input in index.html", (name, inputId) => {
            const originalDocById = global.docById;
            const originalScroll = window.scroll;
            const html = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
            const page = new DOMParser().parseFromString(html, "text/html");
            const nodes = [page.getElementById("ioDiv"), page.getElementById("audio")];
            document.body.append(...nodes);
            const clicked = [];
            const clickSpy = jest
                .spyOn(HTMLElement.prototype, "click")
                .mockImplementation(function () {
                    clicked.push(this);
                });
            global.docById = jest.fn(id => document.getElementById(id));
            window.scroll = jest.fn();

            try {
                const block = new Block(
                    { ...mockProtoBlock, name, capabilities: Object.create(null) },
                    mockBlocks
                );
                block._doOpenMediaFromDevice(0);

                expect(clicked).toHaveLength(1);
                expect(clicked[0].id).toBe(inputId);
                expect(clicked[0].tagName).toBe("INPUT");
                expect(clicked[0].type).toBe("file");
            } finally {
                clickSpy.mockRestore();
                nodes.forEach(node => node.remove());
                global.docById = originalDocById;
                window.scroll = originalScroll;
            }
        });
    });

    describe("hide", () => {
        it.each([
            ["ordinary", false, false],
            ["expanded", true, false],
            ["collapsed", true, true]
        ])(
            "should defer cache updates until showing a %s block",
            async (_, collapsible, collapsed) => {
                mockProtoBlock.capabilities.collapsible = collapsible;
                const b = new Block(mockProtoBlock, mockBlocks);
                b.container = {
                    visible: true,
                    bitmapCache: {},
                    updateCache: jest.fn(),
                    uncache: jest.fn()
                };
                b.bounds = { x: 0, y: 0, width: 100, height: 100 };
                b.collapsed = collapsed;
                b.collapseText = { visible: true };
                b.expandButtonBitmap = { visible: true };
                b.collapseButtonBitmap = { visible: true };
                b._removeAccessibleElement = jest.fn();
                b._setupAccessibleElement = jest.fn();

                b.hide();

                expect(b.container.visible).toBe(false);
                expect(b.container.updateCache).not.toHaveBeenCalled();
                expect(b.container.uncache).not.toHaveBeenCalled();
                expect(b._removeAccessibleElement).toHaveBeenCalledTimes(1);
                if (collapsible) {
                    expect(b.collapseText.visible).toBe(false);
                    expect(b.expandButtonBitmap.visible).toBe(false);
                    expect(b.collapseButtonBitmap.visible).toBe(false);
                }

                b.show();
                await Promise.resolve();

                expect(b.container.visible).toBe(true);
                expect(b.container.updateCache).toHaveBeenCalledTimes(1);
                expect(b._setupAccessibleElement).toHaveBeenCalledTimes(1);
                if (collapsible) {
                    expect(b.collapseText.visible).toBe(collapsed);
                    expect(b.expandButtonBitmap.visible).toBe(collapsed);
                    expect(b.collapseButtonBitmap.visible).toBe(!collapsed);
                }
            }
        );

        it("should not throw when container is null", () => {
            const b = new Block(mockProtoBlock, mockBlocks);
            b.container = null;
            expect(() => b.hide()).not.toThrow();
        });

        it("should set container.visible to false when container exists", () => {
            const b = new Block(mockProtoBlock, mockBlocks);
            b.container = { visible: true };
            b.hide();
            expect(b.container.visible).toBe(false);
        });

        it("should guard collapsible fields that are null", () => {
            const b = new Block(mockProtoBlock, mockBlocks);
            b.name = "repeat";
            b.collapseText = null;
            b.expandButtonBitmap = null;
            b.collapseButtonBitmap = null;
            expect(() => b.hide()).not.toThrow();
        });
    });

    describe("show", () => {
        it("should not throw when container is null and not trashed", () => {
            const b = new Block(mockProtoBlock, mockBlocks);
            b.container = null;
            b.trash = false;
            b.inCollapsed = false;
            expect(() => b.show()).not.toThrow();
        });

        it("should set container.visible to true when container exists", () => {
            const b = new Block(mockProtoBlock, mockBlocks);
            b.container = { visible: false };
            b.trash = false;
            b.inCollapsed = false;
            b.bitmap = { visible: false };
            b.highlightBitmap = { visible: true };
            b.highlightCollapseBlockBitmap = { visible: false };
            b.collapseBlockBitmap = { visible: false };
            b.collapseText = null;
            b.expandButtonBitmap = null;
            b.collapseButtonBitmap = null;
            b.disconnectedBitmap = null;
            b.disconnectedHighlightBitmap = null;
            b.show();
            expect(b.container.visible).toBe(true);
        });

        it("should restore collapsed artwork and controls for a collapsed block", () => {
            mockProtoBlock.capabilities.collapsible = true;
            const b = new Block(mockProtoBlock, mockBlocks);
            b.container = { visible: false };
            b.collapsed = true;
            b.bitmap = { visible: true };
            b.highlightBitmap = { visible: true };
            b.collapseBlockBitmap = { visible: false };
            b.highlightCollapseBlockBitmap = { visible: true };
            b.collapseText = { visible: false };
            b.expandButtonBitmap = { visible: false };
            b.collapseButtonBitmap = { visible: true };
            b.updateCache = jest.fn();
            b._setupAccessibleElement = jest.fn();

            b.show();

            expect(b.container.visible).toBe(true);
            expect(b.bitmap.visible).toBe(false);
            expect(b.highlightBitmap.visible).toBe(false);
            expect(b.collapseBlockBitmap.visible).toBe(true);
            expect(b.highlightCollapseBlockBitmap.visible).toBe(false);
            expect(b.collapseText.visible).toBe(true);
            expect(b.expandButtonBitmap.visible).toBe(true);
            expect(b.collapseButtonBitmap.visible).toBe(false);
            expect(b.updateCache).toHaveBeenCalled();
            expect(b._setupAccessibleElement).toHaveBeenCalled();
        });

        it("should show disconnected artwork for an unconnected block", () => {
            const b = new Block(mockProtoBlock, mockBlocks);
            b.container = { visible: false };
            b.connections = [null, null];
            b.bitmap = { visible: true };
            b.highlightBitmap = { visible: true };
            b.disconnectedBitmap = { visible: false };
            b.disconnectedHighlightBitmap = { visible: true };
            b.updateCache = jest.fn();
            b._setupAccessibleElement = jest.fn();

            b.show();

            expect(b.disconnectedBitmap.visible).toBe(true);
            expect(b.bitmap.visible).toBe(false);
            expect(b.highlightBitmap.visible).toBe(false);
            expect(b.disconnectedHighlightBitmap.visible).toBe(false);
            expect(b.updateCache).toHaveBeenCalled();
        });
    });

    describe("Cache Management (_createCache & updateCache)", () => {
        it("_createCache should query container bounds, cache container, and call callback", async () => {
            const block = new Block(mockProtoBlock, mockBlocks);
            const mockBounds = { x: 10, y: 20, width: 200, height: 100 };
            block.container = {
                getBounds: jest.fn().mockReturnValue(mockBounds),
                cache: jest.fn()
            };
            const callback = jest.fn();
            const args = ["arg1", "arg2"];

            await block._createCache(callback, args);

            expect(block.bounds).toEqual(mockBounds);
            expect(block.container.cache).toHaveBeenCalledWith(10, 20, 200, 100);
            expect(callback).toHaveBeenCalledWith(block, args);
        });

        it("_createCache should trigger regenerateArtwork on retry callback", async () => {
            const block = new Block(mockProtoBlock, mockBlocks);
            block.regenerateArtwork = jest.fn();

            // Mock retryWithBackoff to invoke onRetry
            global.retryWithBackoff.mockImplementationOnce(async ({ onRetry, onSuccess }) => {
                if (onRetry) onRetry();
                if (onSuccess) await onSuccess({ x: 0, y: 0, width: 50, height: 50 });
            });

            block.container = {
                getBounds: jest.fn().mockReturnValue({ x: 0, y: 0, width: 50, height: 50 }),
                cache: jest.fn()
            };

            await block._createCache(jest.fn(), []);

            expect(block.regenerateArtwork).toHaveBeenCalledWith(true, []);
        });

        it("updateCache should resolve immediately if container has no bitmapCache", async () => {
            const block = new Block(mockProtoBlock, mockBlocks);
            block.container = { bitmapCache: null };

            const result = await block.updateCache();

            expect(result).toBeUndefined();
            expect(global.retryWithBackoff).not.toHaveBeenCalled();
        });

        it("updateCache should update container cache and refresh canvas on success", async () => {
            const block = new Block(mockProtoBlock, mockBlocks);
            block.bounds = { x: 0, y: 0, width: 100, height: 50 };
            block.container = {
                bitmapCache: {},
                updateCache: jest.fn()
            };

            await block.updateCache();

            expect(block.container.updateCache).toHaveBeenCalled();
            expect(mockBlocks.activity.refreshCanvas).toHaveBeenCalled();
        });
    });

    describe("drag spatial-grid deferral", () => {
        const makeEventBlock = () => {
            const handlers = {};
            const block = new Block(mockProtoBlock, mockBlocks);

            block.blockIndex = 0;
            block.connections = [null, null];
            block.container = {
                x: 100,
                y: 100,
                children: [],
                on: jest.fn((type, handler) => {
                    handlers[type] = handler;
                }),
                setChildIndex: jest.fn()
            };
            block.original = { x: 100, y: 100 };
            block.offset = { x: 0, y: 0 };
            block._calculateBlockHitArea = jest.fn();
            block._setDragGroupTrashHoverScale = jest.fn();
            block.isValueBlock = jest.fn().mockReturnValue(false);

            mockBlocks.blockList = [block, { container: { x: 100, y: 120 } }];
            mockBlocks._cachedDragGroup = [0, 1];
            mockBlocks.longPressTimeout = null;
            mockBlocks.selectionModeOn = false;
            mockBlocks.getLongPressStatus = jest.fn().mockReturnValue(false);
            mockBlocks.clearLongPress = jest.fn();
            mockBlocks.cacheDragGroup = jest.fn();
            mockBlocks.raiseStackToTop = jest.fn();
            mockBlocks.moveBlockRelativeBatched = jest.fn();
            mockBlocks.scheduleCheckBounds = jest.fn();
            mockBlocks.clearCachedDragGroup = jest.fn();
            mockBlocks.invalidateTopBlockCache = jest.fn();
            mockBlocks.unhighlight = jest.fn();
            mockBlocks.syncDragGroupSpatialGrid = jest.fn();

            block.activity.getStageScale = jest.fn().mockReturnValue(1);
            block.activity.blocksContainer = { y: 0 };
            block.activity.scrollBlockContainer = false;
            block.activity.trashcan = {
                show: jest.fn(),
                hide: jest.fn(),
                overTrashcan: jest.fn().mockReturnValue(false),
                startHighlightAnimation: jest.fn(),
                stopHighlightAnimation: jest.fn()
            };

            block._loadEventHandlers();
            global.docById.mockReturnValue({ style: {} });
            return { block, handlers };
        };

        it("defers cached drag-group updates and marks the release dirty", () => {
            const { handlers } = makeEventBlock();

            handlers.mousedown({ stageX: 100, stageY: 100 });

            handlers.pressmove({
                stageX: 110,
                stageY: 100,
                nativeEvent: { preventDefault: jest.fn() }
            });

            expect(mockBlocks.syncDragGroupSpatialGrid).not.toHaveBeenCalled();

            handlers.pressup({ stageX: 110, stageY: 100 });

            expect(mockBlocks.moveBlockRelativeBatched).toHaveBeenCalledWith(0, 10, 0, true);
            expect(mockBlocks.moveBlockRelativeBatched).toHaveBeenCalledWith(1, 10, 0, true);
            expect(mockBlocks.syncDragGroupSpatialGrid).toHaveBeenCalledTimes(1);
        });

        it("defers drag-group updates when the cached group is unavailable", () => {
            const { handlers } = makeEventBlock();
            handlers.mousedown({ stageX: 100, stageY: 100 });
            mockBlocks._cachedDragGroup = null;
            mockBlocks.dragGroup = [0, 1];
            mockBlocks.findDragGroup = jest.fn();

            handlers.pressmove({
                stageX: 100,
                stageY: 110,
                nativeEvent: { preventDefault: jest.fn() }
            });

            expect(mockBlocks.findDragGroup).toHaveBeenCalledWith(0);
            expect(mockBlocks.moveBlockRelativeBatched).toHaveBeenCalledWith(0, 0, 10, true);
            expect(mockBlocks.moveBlockRelativeBatched).toHaveBeenCalledWith(1, 0, 10, true);
        });

        it("reports a clean grid when release follows no coordinate movement", () => {
            const { handlers } = makeEventBlock();

            handlers.mousedown({ stageX: 100, stageY: 100 });
            handlers.pressup({ stageX: 100, stageY: 100 });

            expect(mockBlocks.syncDragGroupSpatialGrid).not.toHaveBeenCalled();
        });

        it("reconciles the grid after restoring trash-hover positions and before docking", () => {
            const block = new Block(mockProtoBlock, mockBlocks);
            const order = [];

            block.blockIndex = 0;
            block._setDragGroupTrashHoverScale = jest.fn(() => order.push("restore"));
            block.hasValueDrivenLabel = jest.fn().mockReturnValue(false);
            block.activity.logo.runningLilypond = false;
            block.activity.getStageScale = jest.fn().mockReturnValue(1);
            block.activity.trashcan = {
                hide: jest.fn(),
                isVisible: true,
                overTrashcan: jest.fn(() => {
                    order.push("query-trash");
                    return false;
                })
            };
            mockBlocks.longPressTimeout = null;
            mockBlocks.syncDragGroupSpatialGrid = jest.fn(() => order.push("sync-grid"));
            mockBlocks.blockMoved = jest.fn(() => order.push("dock"));
            mockBlocks.adjustDocks = jest.fn(() => order.push("adjust"));

            block._mouseoutCallback({ stageX: 100, stageY: 100 }, true, false, false, true, true);

            expect(order).toEqual(["restore", "sync-grid", "query-trash", "dock", "adjust"]);
        });

        it("waits for asynchronous blockMoved resolution before adjusting docks at stack top", async () => {
            const block = new Block(mockProtoBlock, mockBlocks);
            block.blockIndex = 2;
            block._setDragGroupTrashHoverScale = jest.fn();
            block.hasValueDrivenLabel = jest.fn().mockReturnValue(false);
            block.activity.logo.runningLilypond = false;
            block.activity.getStageScale = jest.fn().mockReturnValue(1);
            block.activity.trashcan = {
                hide: jest.fn(),
                overTrashcan: jest.fn().mockReturnValue(false)
            };
            mockBlocks.longPressTimeout = null;
            mockBlocks.syncDragGroupSpatialGrid = jest.fn();
            mockBlocks.findTopBlock = jest.fn().mockReturnValue(0);
            mockBlocks.adjustDocks = jest.fn();

            let resolveMove;
            const movePromise = new Promise(resolve => {
                resolveMove = resolve;
            });
            mockBlocks.blockMoved = jest.fn(() => movePromise);

            block._mouseoutCallback({ stageX: 100, stageY: 100 }, true, false, false, true, true);

            // While blockMoved is still pending, adjustDocks should not have been called yet
            expect(mockBlocks.adjustDocks).not.toHaveBeenCalled();

            resolveMove();
            await movePromise;

            expect(mockBlocks.findTopBlock).toHaveBeenCalledWith(2);
            expect(mockBlocks.adjustDocks).toHaveBeenCalledWith(0, true);
        });

        it("sends a moved block to trash without waiting for the highlight", () => {
            const block = new Block(mockProtoBlock, mockBlocks);
            block.blockIndex = 0;
            block._setDragGroupTrashHoverScale = jest.fn();
            block.hasValueDrivenLabel = jest.fn().mockReturnValue(false);
            block.activity.logo.runningLilypond = false;
            block.activity.getStageScale = jest.fn().mockReturnValue(1);
            block.activity.textMsg = jest.fn();
            block.activity.trashcan = {
                hide: jest.fn(),
                isVisible: false,
                overTrashcan: jest.fn().mockReturnValue(true)
            };
            mockBlocks.longPressTimeout = null;
            mockBlocks.sendStackToTrash = jest.fn();
            mockBlocks.syncDragGroupSpatialGrid = jest.fn();

            block._mouseoutCallback({ stageX: 100, stageY: 100 }, true, false, false, true);

            expect(mockBlocks.sendStackToTrash).toHaveBeenCalledWith(block);
        });

        describe("trash visibility when a drag ends", () => {
            const makeDraggedBlock = overTrash => {
                const block = new Block(mockProtoBlock, mockBlocks);
                block.blockIndex = 0;
                block._setDragGroupTrashHoverScale = jest.fn();
                block.hasValueDrivenLabel = jest.fn().mockReturnValue(false);
                block.activity.logo.runningLilypond = false;
                block.activity.getStageScale = jest.fn().mockReturnValue(1);
                block.activity.textMsg = jest.fn();
                block.activity.trashcan = {
                    hide: jest.fn(),
                    overTrashcan: jest.fn().mockReturnValue(overTrash)
                };
                mockBlocks.longPressTimeout = null;
                mockBlocks.sendStackToTrash = jest.fn();
                mockBlocks.blockMoved = jest.fn();
                mockBlocks.adjustDocks = jest.fn();
                return block;
            };

            it("hides the trash after a block is dropped in it", () => {
                const block = makeDraggedBlock(true);

                block._mouseoutCallback({ stageX: 100, stageY: 100 }, true, false, false, true);

                expect(mockBlocks.sendStackToTrash).toHaveBeenCalledWith(block);
                expect(block.activity.trashcan.hide).toHaveBeenCalled();
            });

            it("hides the trash after a block is dropped elsewhere", () => {
                const block = makeDraggedBlock(false);

                block._mouseoutCallback({ stageX: 100, stageY: 100 }, true, false, false, true);

                expect(mockBlocks.blockMoved).toHaveBeenCalledWith(0);
                expect(block.activity.trashcan.hide).toHaveBeenCalled();
            });

            it("keeps the trash shown on a mouseout while the block has moved", () => {
                const block = makeDraggedBlock(false);

                block._mouseoutCallback({ stageX: 100, stageY: 100 }, true, false, false, false);

                expect(block.activity.trashcan.hide).not.toHaveBeenCalled();
            });
        });

        it("does not reconcile a clean grid", () => {
            const block = new Block(mockProtoBlock, mockBlocks);
            block.blockIndex = 0;
            block._setDragGroupTrashHoverScale = jest.fn();
            block.hasValueDrivenLabel = jest.fn().mockReturnValue(false);
            block.activity.logo.runningLilypond = false;
            block.activity.trashcan = { hide: jest.fn() };
            mockBlocks.longPressTimeout = null;
            mockBlocks.syncDragGroupSpatialGrid = jest.fn();

            block._mouseoutCallback({}, false, false, false, true, false);

            expect(mockBlocks.syncDragGroupSpatialGrid).not.toHaveBeenCalled();
        });
    });

    describe("shift+click", () => {
        const makeClickBlock = running => {
            const handlers = {};
            const block = new Block(mockProtoBlock, mockBlocks);

            block.blockIndex = 3;
            block.connections = [null, null];
            block.container = {
                x: 100,
                y: 100,
                children: [],
                on: jest.fn((type, handler) => {
                    handlers[type] = handler;
                }),
                setChildIndex: jest.fn()
            };
            block._calculateBlockHitArea = jest.fn();

            mockBlocks.findTopBlock = jest.fn().mockReturnValue(0);
            mockBlocks.getLongPressStatus = jest.fn().mockReturnValue(false);
            block.activity.closeHelpfulWheel = jest.fn();
            block.activity.turtles = { running: jest.fn().mockReturnValue(running) };
            block.activity.logo.runLogoCommands = jest.fn();
            block.activity.logo.doStopTurtles = jest.fn();
            block.activity.toolbar = { highlightStop: jest.fn() };

            block._loadEventHandlers();
            return { block, handlers };
        };

        it("runs the stack from its top block", () => {
            const { block, handlers } = makeClickBlock(false);

            expect(() =>
                handlers.click({ nativeEvent: { button: 0, shiftKey: true } })
            ).not.toThrow();

            expect(mockBlocks.findTopBlock).toHaveBeenCalledWith(3);
            expect(block.activity.logo.runLogoCommands).toHaveBeenCalledWith(0);
            expect(block.activity.toolbar.highlightStop).toHaveBeenCalled();
        });

        it("stops the running project and restarts it from the top block", () => {
            jest.useFakeTimers();
            try {
                const { block, handlers } = makeClickBlock(true);

                handlers.click({ nativeEvent: { button: 0, shiftKey: true } });

                expect(block.activity.logo.doStopTurtles).toHaveBeenCalled();
                expect(block.activity.logo.runLogoCommands).not.toHaveBeenCalled();

                jest.advanceTimersByTime(250);

                expect(block.activity.logo.runLogoCommands).toHaveBeenCalledWith(0);
            } finally {
                jest.useRealTimers();
            }
        });

        it("does not treat a released long press as a regular click", () => {
            const { block, handlers } = makeClickBlock(false);
            block._triggerLongPress = true;
            const stopImmediatePropagation = jest.fn();

            handlers.click({
                nativeEvent: { button: 0, stopImmediatePropagation }
            });

            expect(block.activity.logo.runLogoCommands).not.toHaveBeenCalled();
            expect(block._triggerLongPress).toBe(false);
            expect(stopImmediatePropagation).toHaveBeenCalled();
        });

        it("does not run a released long press with Shift held", () => {
            const { block, handlers } = makeClickBlock(false);
            block._triggerLongPress = true;
            const stopImmediatePropagation = jest.fn();

            handlers.click({
                nativeEvent: { button: 0, shiftKey: true, stopImmediatePropagation }
            });

            expect(block.activity.logo.runLogoCommands).not.toHaveBeenCalled();
            expect(mockBlocks.findTopBlock).not.toHaveBeenCalled();
            expect(block._triggerLongPress).toBe(false);
            expect(stopImmediatePropagation).toHaveBeenCalled();
        });

        it("does not move a block after a long press opens the menu", () => {
            const { block, handlers } = makeClickBlock(false);
            block._triggerLongPress = true;
            block.blocks.getLongPressStatus.mockReturnValue(true);
            block.blocks.moveBlockRelativeBatched = jest.fn();

            handlers.pressmove({
                nativeEvent: { preventDefault: jest.fn() }
            });

            expect(block.blocks.moveBlockRelativeBatched).not.toHaveBeenCalled();
        });
    });

    describe("_checkWidgets()", () => {
        let getElementsSpy;

        beforeAll(() => {
            // widgetWindows.js attaches to the environment window; also expose
            // the bare global that block.js reads via /* global widgetWindows */.
            require("../widgets/widgetWindows.js");
            const ww =
                (typeof window !== "undefined" && window.widgetWindows) || global.widgetWindows;
            global.widgetWindows = ww;
            if (typeof window !== "undefined") {
                window.widgetWindows = ww;
            }
        });

        afterEach(() => {
            if (getElementsSpy) {
                getElementsSpy.mockRestore();
                getElementsSpy = null;
            }
        });

        const makeTitleEl = title => {
            const el = document.createElement("div");
            el.className = "wftTitle";
            el.innerHTML = title;
            return el;
        };

        const makeWidgetBlock = label => {
            const proto = {
                ...mockProtoBlock,
                name: label,
                staticLabels: [label]
            };
            const block = new Block(proto, mockBlocks);
            block.blockIndex = 0;
            mockBlocks.blockList = [block];
            mockBlocks.findTopBlock = jest.fn().mockReturnValue(0);
            mockBlocks.reInitWidget = jest.fn();
            return block;
        };

        it("reinitializes when an open widget title matches the top block", () => {
            const block = makeWidgetBlock("arpeggio");
            getElementsSpy = jest
                .spyOn(document, "getElementsByClassName")
                .mockReturnValue([makeTitleEl("arpeggio")]);

            block._checkWidgets(false);

            expect(mockBlocks.reInitWidget).toHaveBeenCalledWith(0, 1500);
        });

        it("reinitializes when an unrelated recognized title appears first", () => {
            const block = makeWidgetBlock("arpeggio");
            getElementsSpy = jest
                .spyOn(document, "getElementsByClassName")
                .mockReturnValue([makeTitleEl("tempo"), makeTitleEl("arpeggio")]);

            block._checkWidgets(false);

            expect(mockBlocks.reInitWidget).toHaveBeenCalledTimes(1);
            expect(mockBlocks.reInitWidget).toHaveBeenCalledWith(0, 1500);
        });

        it("does nothing when closeInput is true", () => {
            const block = makeWidgetBlock("tempo");
            getElementsSpy = jest
                .spyOn(document, "getElementsByClassName")
                .mockReturnValue([makeTitleEl("tempo")]);

            block._checkWidgets(true);

            expect(mockBlocks.reInitWidget).not.toHaveBeenCalled();
        });
    });

    describe("dispose()", () => {
        it("should clean up connections, DOM nodes, containers, bitmaps, and parent pointers", () => {
            const block = new Block(mockProtoBlock, mockBlocks);
            block.blockIndex = 1;
            const connectedBlock = {
                connections: [1, null]
            };
            mockBlocks.blockList = [null, block, connectedBlock];
            block.connections = [2];

            const mockContainer = {
                removeAllEventListeners: jest.fn(),
                removeAllChildren: jest.fn(),
                uncache: jest.fn()
            };
            block.container = mockContainer;

            const dummyLabel = document.createElement("div");
            document.body.appendChild(dummyLabel);
            block.label = dummyLabel;

            const dummyLabelAttr = document.createElement("div");
            document.body.appendChild(dummyLabelAttr);
            block.labelattr = dummyLabelAttr;

            block.bitmap = {};
            block.highlightBitmap = {};

            block.dispose();

            expect(connectedBlock.connections[0]).toBeNull();
            expect(block.connections).toEqual([]);
            expect(mockContainer.removeAllEventListeners).toHaveBeenCalled();
            expect(mockContainer.removeAllChildren).toHaveBeenCalled();
            expect(mockContainer.uncache).toHaveBeenCalled();
            expect(block.container).toBeNull();
            expect(block.label).toBeNull();
            expect(block.labelattr).toBeNull();
            expect(dummyLabel.parentNode).toBeNull();
            expect(dummyLabelAttr.parentNode).toBeNull();
            expect(block.bitmap).toBeNull();
            expect(block.blocks).toBeNull();
            expect(block.activity).toBeNull();
            expect(block.protoblock).toBeNull();
        });

        it("should detach the CreateJS container from its parent display list", () => {
            const block = new Block(mockProtoBlock, mockBlocks);
            const parent = new global.createjs.Container();
            const disposedContainer = new global.createjs.Container();

            parent.addChild(disposedContainer);
            block.container = disposedContainer;

            expect(disposedContainer.parent).toBe(parent);
            expect(parent.children).toContain(disposedContainer);

            block.dispose();

            expect(parent.children).not.toContain(disposedContainer);
            expect(parent.children).toHaveLength(0);
            expect(disposedContainer.parent).toBeNull();
            expect(block.container).toBeNull();
        });
    });

    describe("value change undo/redo tracking", () => {
        it("does not record runtime value assignments", () => {
            const mockBlocksObj = {
                ...mockBlocks,
                actionHistory: [{ type: "move", blockId: 1 }],
                redoActionHistory: [{ type: "move", blockId: 0 }],
                isUndoingOrRedoing: false
            };
            const block = new Block(mockProtoBlock, mockBlocksObj);
            block.blockIndex = 2;
            block.text = { text: "initial" };
            block.loadComplete = true;

            block.value = "updated";

            expect(mockBlocksObj.actionHistory).toEqual([{ type: "move", blockId: 1 }]);
            expect(mockBlocksObj.redoActionHistory).toEqual([{ type: "move", blockId: 0 }]);
        });

        it("records one change for input followed by blur", () => {
            const mockBlocksObj = {
                ...mockBlocks,
                actionHistory: [],
                redoActionHistory: [{ type: "move", blockId: 0 }],
                isUndoingOrRedoing: false
            };
            const block = new Block(
                { ...mockProtoBlock, name: "number", capabilities: Object.create(null) },
                mockBlocksObj
            );
            block.blockIndex = 2;
            block.value = 10;
            block._capturedInitialValue = 10;
            block._capturedInitialText = "10";
            block.label = { value: "20", style: { display: "" } };
            block.text = { text: "10" };
            block.connections = [null];
            block.container = { setChildIndex: jest.fn(), children: [] };
            block.updateCache = jest.fn();
            global.docById = jest.fn().mockReturnValue({ style: {} });

            block._labelChanged(false, true);
            expect(mockBlocksObj.actionHistory).toEqual([]);

            block._labelChanged(true, true);

            expect(mockBlocksObj.actionHistory).toEqual([
                {
                    type: "value_change",
                    blockId: 2,
                    oldValue: 10,
                    newValue: 20,
                    oldText: "10",
                    newText: "20"
                }
            ]);
            expect(mockBlocksObj.redoActionHistory).toEqual([]);
        });
    });

    describe("_exitKeyPressed()", () => {
        it("handles Enter and Tab keys correctly", () => {
            const block = new Block(mockProtoBlock, mockBlocks);
            block.label = { removeEventListener: jest.fn() };
            block._labelChanged = jest.fn();

            document.body.innerHTML = '<div id="labelDiv" class="hasKeyboard"></div>';
            const originalDocById = global.docById;
            global.docById = jest.fn(id => document.getElementById(id));

            const eventEnter = { key: "Enter", preventDefault: jest.fn() };
            block._exitKeyPressed(eventEnter);
            expect(block._labelChanged).toHaveBeenCalledWith(true, false);
            expect(eventEnter.preventDefault).toHaveBeenCalled();
            expect(block.label.removeEventListener).toHaveBeenCalledWith(
                "keypress",
                block._boundExitKeyPressed
            );
            expect(document.getElementById("labelDiv").classList.contains("hasKeyboard")).toBe(
                false
            );

            document.getElementById("labelDiv").classList.add("hasKeyboard");

            const eventTab = { key: "Tab", preventDefault: jest.fn() };
            block._exitKeyPressed(eventTab);
            expect(block._labelChanged).toHaveBeenCalledTimes(2);
            expect(eventTab.preventDefault).toHaveBeenCalled();
            expect(document.getElementById("labelDiv").classList.contains("hasKeyboard")).toBe(
                false
            );

            global.docById = originalDocById;
        });

        it("ignores other keys", () => {
            const block = new Block(mockProtoBlock, mockBlocks);
            block.label = { removeEventListener: jest.fn() };
            block._labelChanged = jest.fn();
            const event = { key: "Escape", preventDefault: jest.fn() };

            block._exitKeyPressed(event);
            expect(block._labelChanged).not.toHaveBeenCalled();
            expect(event.preventDefault).not.toHaveBeenCalled();
        });
    });

    describe("_changeLabel() keypress handler", () => {
        beforeEach(() => {
            jest.useFakeTimers();
            global.window.scroll = jest.fn();
        });

        afterEach(() => {
            jest.useRealTimers();
            jest.restoreAllMocks();
        });

        it("handles Enter and Tab keys correctly", () => {
            const block = new Block(mockProtoBlock, mockBlocks);
            block._usePiemenu = jest.fn().mockReturnValue(false);
            block.activity = {
                blocksContainer: { x: 0, y: 0, update: jest.fn() },
                getStageScale: jest.fn().mockReturnValue(1),
                canvas: { offsetLeft: 0, offsetTop: 0 }
            };
            block._labelChanged = jest.fn();
            block.blocks = { blockScale: 1 };
            block.protoblock = { scale: 1 };
            block.name = "text";
            block.value = "test";
            block.container = { x: 0, y: 0 };

            document.body.innerHTML = '<div id="labelDiv"></div>';
            const originalDocById = global.docById;
            global.docById = jest.fn(id => document.getElementById(id));

            let keypressHandler;
            jest.spyOn(HTMLInputElement.prototype, "addEventListener").mockImplementation(
                function (event, handler) {
                    if (event === "keypress") {
                        keypressHandler = handler;
                    }
                }
            );

            block._changeLabel();

            jest.advanceTimersByTime(100);

            expect(keypressHandler).toBeDefined();

            const eventEnter = { key: "Enter", preventDefault: jest.fn() };
            keypressHandler(eventEnter);
            expect(block._labelChanged).toHaveBeenCalledWith(true, true);
            expect(eventEnter.preventDefault).toHaveBeenCalled();

            const eventTab = { key: "Tab", preventDefault: jest.fn() };
            keypressHandler(eventTab);
            expect(block._labelChanged).toHaveBeenCalledTimes(2);
            expect(eventTab.preventDefault).toHaveBeenCalled();

            global.docById = originalDocById;
        });
    });

    describe("Coverage for slice migration in block.js", () => {
        let block;
        let mockBlocksForRename;
        beforeEach(() => {
            mockBlocksForRename = {
                activity: {
                    palettes: { updatePalettes: jest.fn(), dict: {} },
                    refreshCanvas: jest.fn(),
                    beginnerMode: false,
                    logo: {
                        synth: { getSynthData: jest.fn().mockReturnValue([]), loadSynth: jest.fn() }
                    }
                },
                blockList: [],
                trashStacks: [],
                actionHistory: [],
                isUndoingOrRedoing: false,
                reInitWidget: jest.fn(),
                findTopBlock: jest.fn().mockReturnValue(0)
            };
            mockBlocksForRename.blockList[0] = { protoblock: { staticLabels: ["test"] } };
            block = new Block({ x: 0, y: 0 }, "text", mockBlocksForRename);
            block.text = { text: "" };
            block.label = { value: "", style: {} };
            block.container = { setChildIndex: jest.fn(), children: { length: 2 } };
            block.connections = [null, null, null, null];
            block.updateCache = jest.fn();
            global.DEFAULTVOICE = "voice1";
            global.DEFAULTNOISE = "noise1";
            global.TEXTWIDTH = 200;
            global.window.scroll = jest.fn();
        });

        it("_labelChanged text wideLabel truncation", () => {
            global.getTextWidth.mockReturnValue(500); // Forces > TEXTWIDTH
            block.value = "this is a very long string that should be sliced";
            block.label.value = "this is a very long string that should be sliced";
            block._capturedInitialValue = "old string";
            block.hasWideLabel = () => false;
            block._labelChanged(true, true);
            expect(block.text.text).toBe("this is a...");
        });

        it("_labelChanged storein/action wideLabel truncation", () => {
            global.getTextWidth.mockReturnValue(500); // Forces > TEXTWIDTH
            block.name = "storein";
            block.value = "this is a very long string that should be sliced";
            block.label.value = "this is a very long string that should be sliced";
            block._capturedInitialValue = "old string";
            block._labelChanged(true, true);
            expect(block.text.text).toBe("this is a...");
        });
        it("_changeLabel voiceLabels truncation", () => {
            global.getTextWidth.mockReturnValue(500); // Forces > 400
            global.piemenuVoices = jest.fn();
            global.VOICENAMES = [["1", "voice1", "label", "cat"]];
            block.name = "voicename";
            block.activity = { canvas: { offsetLeft: 0, offsetTop: 0 }, blocksContainer: { y: 0 } };
            block.blocks = { blockScale: 1 };
            block.container = { x: 0, y: 0 };
            block.piemenuOKtoLaunch = jest.fn().mockReturnValue(true);
            block._usePiemenu = jest.fn().mockReturnValue(true);
            block._changeLabel();
            expect(global.piemenuVoices).toHaveBeenCalled();
            expect(global.piemenuVoices.mock.calls[0][1]).toEqual(["voice1..."]);
        });

        it("_changeLabel noiseLabels truncation", () => {
            global.getTextWidth.mockReturnValue(700); // Forces > 600
            global.piemenuVoices = jest.fn(); // It uses piemenuVoices under the hood
            global.NOISENAMES = [["noise1", "val1", "", "cat"]];
            block.name = "noisename";
            block.activity = { canvas: { offsetLeft: 0, offsetTop: 0 }, blocksContainer: { y: 0 } };
            block.blocks = { blockScale: 1 };
            block.container = { x: 0, y: 0 };
            block.piemenuOKtoLaunch = jest.fn().mockReturnValue(true);
            block._usePiemenu = jest.fn().mockReturnValue(true);
            block._changeLabel();
            expect(global.piemenuVoices).toHaveBeenCalled();
            expect(global.piemenuVoices.mock.calls[0][1]).toEqual(["noise1..."]);
        });

        it("_changeLabel customNote launches piemenuCustomNotes with custom labels and does not call piemenuPitches", () => {
            global.piemenuCustomNotes = jest.fn();
            global.piemenuPitches = jest.fn();
            block.name = "customNote";
            block.value = "C(+0¢)";
            block.customID = null;
            block.activity = {
                logo: { customTemperamentDefined: false },
                canvas: { offsetLeft: 0, offsetTop: 0 },
                blocksContainer: { y: 0 }
            };
            block.blocks = { blockScale: 1 };
            block.container = { x: 0, y: 0 };
            block.piemenuOKtoLaunch = jest.fn().mockReturnValue(true);
            block._usePiemenu = jest.fn().mockReturnValue(true);
            block._changeLabel();
            expect(global.piemenuPitches).not.toHaveBeenCalled();
            expect(global.piemenuCustomNotes).toHaveBeenCalledTimes(1);
            const args = global.piemenuCustomNotes.mock.calls[0];
            expect(args[0]).toBe(block);
            expect(args[1]["custom"].pitchNumber).toBe(5);
            expect(args[1]["custom"][0]).toEqual([1, "C", 4]);
            expect(args[1]["custom"][4]).toEqual([1.781, "A#", 4]);
            expect(args[2]).toContain("custom");
            expect(args[3]).toBe("custom");
            expect(args[4]).toBe("C(+0¢)");
        });
    });

    describe("ManagedTimer Integration in Block", () => {
        let testBlock;
        let testActivity;
        let testBlocks;
        let timerManager;
        let originalDocById;
        let originalHasMouse;

        beforeEach(() => {
            originalDocById = global.docById;
            originalHasMouse = window.hasMouse;
            global.docById = jest.fn().mockReturnValue({ style: {} });
            window.hasMouse = true;
            global.hideDOMLabel = jest.fn();
            global.platformColor = { stopIconcolor: "red" };
            timerManager = new ManagedTimer();
            testActivity = {
                turtles: { running: jest.fn().mockReturnValue(true) },
                trashcan: { show: jest.fn(), hide: jest.fn() },
                logo: {
                    _timerManager: timerManager,
                    doStopTurtles: jest.fn(() => {
                        timerManager.clearAll();
                        testActivity.logo.stopTurtle = true;
                    }),
                    runLogoCommands: jest.fn(),
                    stopTurtle: false,
                    synth: { resume: jest.fn() }
                },
                toolbar: { highlightStop: jest.fn() },
                closeHelpfulWheel: jest.fn(),
                getStageScale: jest.fn().mockReturnValue(1),
                blocksContainer: { x: 0, y: 0 }
            };
            testBlocks = {
                activity: testActivity,
                blockList: [],
                findTopBlock: jest.fn().mockReturnValue(0),
                getLongPressStatus: jest.fn().mockReturnValue(false),
                stageClick: false,
                raiseStackToTop: jest.fn(),
                clearCachedDragGroup: jest.fn(),
                cacheDragGroup: jest.fn(),
                invalidateTopBlockCache: jest.fn(),
                unhighlight: jest.fn(),
                setTimeout: jest.fn((cb, d) => timerManager.setTimeout(cb, d)),
                clearTimeout: jest.fn(id => timerManager.clearTimeout(id)),
                triggerLongPress: jest.fn(),
                clearLongPress: jest.fn()
            };
            testBlock = new Block(mockProtoBlock, testBlocks);
            testBlock.activity = testActivity;
            testBlocks.blockList = [testBlock];
            testBlock.blockIndex = 0;
            testBlock.container = new global.createjs.Container();
            testBlock.container.x = 0;
            testBlock.container.y = 0;
            testBlock._calculateBlockHitArea = jest.fn();
            testBlock._loadEventHandlers();
        });

        afterEach(() => {
            global.docById = originalDocById;
            window.hasMouse = originalHasMouse;
        });

        it("routes delayed run through logo._timerManager when running on click", () => {
            jest.useFakeTimers();
            testBlock.isCollapsible = jest.fn().mockReturnValue(false);
            testBlock.hasValueDrivenLabel = jest.fn().mockReturnValue(false);

            const clickHandler = testBlock.container._listeners["click"];
            expect(clickHandler).toBeDefined();

            clickHandler({ stageX: 100, stageY: 100 });
            expect(testActivity.logo.doStopTurtles).toHaveBeenCalled();
            expect(testActivity.logo._timerManager.activeTimeoutCount).toBe(1);

            jest.advanceTimersByTime(250);
            expect(testActivity.logo.runLogoCommands).toHaveBeenCalledWith(0);
            expect(testActivity.logo._timerManager.activeTimeoutCount).toBe(0);
            jest.useRealTimers();
        });

        it("cancels delayed run when doStopTurtles is called before timeout fires", () => {
            jest.useFakeTimers();
            testBlock.isCollapsible = jest.fn().mockReturnValue(false);
            testBlock.hasValueDrivenLabel = jest.fn().mockReturnValue(false);

            const clickHandler = testBlock.container._listeners["click"];
            clickHandler({ stageX: 100, stageY: 100 });
            expect(testActivity.logo._timerManager.activeTimeoutCount).toBe(1);

            // User clicks Stop during the 250ms window
            testActivity.logo.doStopTurtles();
            expect(testActivity.logo._timerManager.activeTimeoutCount).toBe(0);

            jest.advanceTimersByTime(250);
            expect(testActivity.logo.runLogoCommands).not.toHaveBeenCalled();
            jest.useRealTimers();
        });

        it("routes longPressTimeout through blocks.setTimeout when available", () => {
            const mousedownHandler = testBlock.container._listeners["mousedown"];
            expect(mousedownHandler).toBeDefined();

            mousedownHandler({ stageX: 50, stageY: 50 });
            expect(testBlocks.setTimeout).toHaveBeenCalled();
            expect(timerManager.activeTimeoutCount).toBe(1);

            testBlock.container._listeners["pressup"]({});
            expect(testBlocks.clearTimeout).toHaveBeenCalled();
            expect(timerManager.activeTimeoutCount).toBe(0);
        });
    });

    describe("Screen Reader Accessibility", () => {
        let block;
        let testBlocks;

        beforeEach(() => {
            document.body.innerHTML = `
                <div id="canvasContainer">
                    <canvas id="myCanvas"></canvas>
                    <div id="accessibleBlocks" class="visually-hidden" role="region" aria-label="Workspace Blocks"></div>
                </div>
            `;
            testBlocks = {
                activity: {
                    refreshCanvas: jest.fn(),
                    closeHelpfulWheel: jest.fn(),
                    getStageScale: () => 1
                },
                blockList: [],
                highlight: jest.fn(),
                findTopBlock: jest.fn().mockReturnValue(0),
                getLongPressStatus: jest.fn().mockReturnValue(false),
                stageClick: false,
                selectionModeOn: false
            };
            block = new Block(
                {
                    name: "forward",
                    staticLabels: ["forward"],
                    image: "forward.svg",
                    size: 1,
                    docks: [
                        [0, 0, 0],
                        [0, 0, 0]
                    ],
                    capabilities: {}
                },
                testBlocks
            );
            block.blockIndex = 0;
            block.container = {
                x: 10,
                y: 20,
                on: jest.fn(),
                dispatchEvent: jest.fn(),
                children: []
            };
        });

        afterEach(() => {
            document.body.innerHTML = "";
        });

        it("Block.getAccessibleContainer retrieves existing accessible container", () => {
            const existing = document.getElementById("accessibleBlocks");
            const container = Block.getAccessibleContainer();
            expect(container).toBe(existing);
        });

        it("Block.getAccessibleContainer creates and appends container to canvasContainer when not already present", () => {
            document.body.innerHTML = '<div id="canvasContainer"></div>';
            const container = Block.getAccessibleContainer();
            expect(container).not.toBeNull();
            expect(container.id).toBe("accessibleBlocks");
            expect(container.className).toBe("visually-hidden");
            expect(container.getAttribute("role")).toBe("region");
            expect(container.getAttribute("aria-label")).toBe("Workspace Blocks");
            expect(container.parentNode.id).toBe("canvasContainer");
        });

        it("Block.getAccessibleContainer creates and appends container to document.body when canvasContainer is absent", () => {
            document.body.innerHTML = "";
            const container = Block.getAccessibleContainer();
            expect(container).not.toBeNull();
            expect(container.id).toBe("accessibleBlocks");
            expect(container.parentNode).toBe(document.body);
        });

        it("getAccessibleLabel returns correct descriptive label", () => {
            expect(block.getAccessibleLabel()).toBe("forward block");

            block.value = 100;
            expect(block.getAccessibleLabel()).toBe("forward, value: 100");
        });

        it("getAccessibleLabel uses overrideName when present", () => {
            block.overrideName = "myCustomFunction";
            expect(block.getAccessibleLabel()).toBe("myCustomFunction block");

            block.value = 42;
            expect(block.getAccessibleLabel()).toBe("myCustomFunction, value: 42");
        });

        it("getAccessibleLabel does not announce data URLs in values", () => {
            block.value = "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=";
            expect(block.getAccessibleLabel()).toBe("forward block");
        });

        it("_setupAccessibleElement creates an off-screen accessible button", () => {
            const el = block._setupAccessibleElement();
            expect(el).not.toBeNull();
            expect(el.getAttribute("role")).toBe("button");
            expect(el.getAttribute("tabindex")).toBe("0");
            expect(el.getAttribute("aria-label")).toBe("forward block");
            expect(el.id).toBe("accessible-block-0");
        });

        it("activate dispatches synthetic click event to container", () => {
            block.activate();
            expect(block.container.dispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "click",
                    stageX: 60,
                    stageY: 30
                })
            );
        });

        it("activate scales click coordinates using getStageScale", () => {
            block.activity = {
                getStageScale: jest.fn().mockReturnValue(2)
            };
            block.activate();
            expect(block.container.dispatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "click",
                    stageX: 120,
                    stageY: 60
                })
            );
        });

        it("dispose cleans up accessible element from DOM", () => {
            block._setupAccessibleElement();
            expect(document.getElementById("accessible-block-0")).not.toBeNull();

            block.dispose();
            expect(document.getElementById("accessible-block-0")).toBeNull();
            expect(block.accessibleElement).toBeNull();
        });

        it("pressing Enter or Space activates the block", () => {
            const el = block._setupAccessibleElement();
            const activateSpy = jest.spyOn(block, "activate");

            const enterEvent = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
            el.dispatchEvent(enterEvent);
            expect(activateSpy).toHaveBeenCalledTimes(1);

            const spaceEvent = new KeyboardEvent("keydown", { key: " ", bubbles: true });
            el.dispatchEvent(spaceEvent);
            expect(activateSpy).toHaveBeenCalledTimes(2);
        });

        it("arrow keys navigate between sibling block elements", () => {
            const block2 = new Block(
                { name: "right", staticLabels: ["right"], image: "right.svg", docks: [] },
                testBlocks
            );
            block2.blockIndex = 1;
            block2.container = {
                x: 0,
                y: 0,
                on: jest.fn(),
                dispatchEvent: jest.fn(),
                children: []
            };

            const el1 = block._setupAccessibleElement();
            const el2 = block2._setupAccessibleElement();

            const focusSpy = jest.spyOn(el2, "focus");
            const downArrowEvent = new KeyboardEvent("keydown", {
                key: "ArrowDown",
                bubbles: true
            });
            el1.dispatchEvent(downArrowEvent);
            expect(focusSpy).toHaveBeenCalled();
        });

        it("_removeAccessibleElement removes the element from DOM", () => {
            block._setupAccessibleElement();
            expect(document.getElementById("accessible-block-0")).not.toBeNull();

            block._removeAccessibleElement();
            expect(document.getElementById("accessible-block-0")).toBeNull();
            expect(block.accessibleElement).toBeNull();
        });

        it("_updateAccessibleElement updates aria-label and id", () => {
            block._setupAccessibleElement();
            block.value = 50;
            block.blockIndex = 2;
            block._updateAccessibleElement();

            expect(block.accessibleElement.id).toBe("accessible-block-2");
            expect(block.accessibleElement.getAttribute("aria-label")).toBe("forward, value: 50");
        });

        it("_toggle_inline adds/removes child accessibility controls on expand/collapse", () => {
            const childBlock = new Block(
                { name: "number", staticLabels: ["100"], image: "number.svg", docks: [] },
                testBlocks
            );
            childBlock.blockIndex = 1;
            childBlock.container = { visible: true };
            childBlock._setupAccessibleElement = jest.fn();
            childBlock._removeAccessibleElement = jest.fn();

            testBlocks.blockList = [block, childBlock];
            testBlocks.dragGroup = [1];
            testBlocks.insideInlineCollapsibleBlock = jest.fn().mockReturnValue(null);
            testBlocks.findDragGroup = jest.fn();
            testBlocks.findNestedClampBlocks = jest.fn();
            block.connections = [null, 1, null, null];
            block.activity = { refreshCanvas: jest.fn() };

            // Collapse: should call _removeAccessibleElement
            block._toggle_inline(0, false);
            expect(childBlock._removeAccessibleElement).toHaveBeenCalled();

            // Expand: should call _setupAccessibleElement
            block._toggle_inline(0, true);
            expect(childBlock._setupAccessibleElement).toHaveBeenCalled();
        });
    });

    describe("trash hover scaling", () => {
        it("shrinks every block in the active drag group around the group origin", () => {
            const block = new Block(mockProtoBlock, mockBlocks);
            const groupedBlock = new Block(mockProtoBlock, mockBlocks);
            block.blockIndex = 0;
            block.blocks.dragGroup = [0, 1];
            block.blocks.blockList = [block, groupedBlock];
            block.activity = { refreshCanvas: jest.fn() };
            block.container = { x: 100, y: 100, scaleX: 1, scaleY: 1 };
            groupedBlock.container = { x: 200, y: 140, scaleX: 2, scaleY: 3 };
            const blockTween = { to: jest.fn().mockReturnThis() };
            const groupedBlockTween = { to: jest.fn().mockReturnThis() };
            createjs.Tween.get
                .mockImplementationOnce(target => {
                    blockTween.target = target;
                    return blockTween;
                })
                .mockImplementationOnce(target => {
                    groupedBlockTween.target = target;
                    return groupedBlockTween;
                });

            block._setDragGroupTrashHoverScale(true, 0, 0, true);

            expect(createjs.Tween.get).toHaveBeenCalledTimes(2);
            expect(createjs.Tween.get).toHaveBeenNthCalledWith(1, block.container, {
                override: true
            });
            expect(createjs.Tween.get).toHaveBeenNthCalledWith(2, groupedBlock.container, {
                override: true
            });
            expect(blockTween.target).toBe(block.container);
            expect(groupedBlockTween.target).toBe(groupedBlock.container);
            expect(blockTween.to).toHaveBeenCalledWith(
                { x: 100, y: 100, scaleX: 0.5, scaleY: 0.5 },
                0
            );
            expect(groupedBlockTween.to).toHaveBeenCalledWith(
                { x: 150, y: 120, scaleX: 1, scaleY: 1.5 },
                0
            );
            expect(block.activity.refreshCanvas).toHaveBeenCalled();
        });

        it("restores original positions and scales when leaving the trash", () => {
            const block = new Block(mockProtoBlock, mockBlocks);
            block.blockIndex = 0;
            block.blocks.dragGroup = [0];
            block.blocks.blockList = [block];
            block.activity = { refreshCanvas: jest.fn() };
            block.container = { x: 80, y: 60, scaleX: 1.5, scaleY: 2 };

            block._setDragGroupTrashHoverScale(true, 10, 20, true);
            createjs.Tween.get.mockClear();
            block._setDragGroupTrashHoverScale(false, 0, 0, true);

            expect(createjs.Tween.get).toHaveBeenCalledTimes(1);
            expect(createjs.Tween.get.mock.results[0].value.to).toHaveBeenCalledWith(
                { x: 90, y: 80, scaleX: 1.5, scaleY: 2 },
                0
            );
            expect(block._trashHoverGroupState).toBeNull();
        });

        it("does nothing when the drag group has no usable containers", () => {
            const block = new Block(mockProtoBlock, mockBlocks);
            block.blockIndex = 0;
            block.blocks.dragGroup = [0, 1];
            block.blocks.blockList = [block, { container: null }];
            block.activity = { refreshCanvas: jest.fn() };
            block.container = null;

            block._setDragGroupTrashHoverScale(true);

            expect(createjs.Tween.get).not.toHaveBeenCalled();
            expect(block.activity.refreshCanvas).not.toHaveBeenCalled();
        });
    });

    describe("collapsed state transitions", () => {
        it("marks a block as collapsed and hides it", () => {
            const block = new Block(mockProtoBlock, mockBlocks);
            block.hide = jest.fn();

            block.setCollapsedState();

            expect(block.inCollapsed).toBe(true);
            expect(block.hide).toHaveBeenCalledTimes(1);
        });

        it("shows a block when its containing block is not collapsed", () => {
            const block = new Block(mockProtoBlock, mockBlocks);
            block.blockIndex = 1;
            block.show = jest.fn();
            mockBlocks.blockList = [{ collapsed: false }, block];

            block.setUncollapsedState(0);

            expect(block.inCollapsed).toBe(false);
            expect(block.show).toHaveBeenCalledTimes(1);
        });

        it("keeps a block hidden when its containing block is still collapsed", () => {
            const block = new Block(mockProtoBlock, mockBlocks);
            block.blockIndex = 1;
            block.inCollapsed = true;
            block.show = jest.fn();
            mockBlocks.blockList = [{ collapsed: true }, block];

            block.setUncollapsedState(0);

            expect(block.inCollapsed).toBe(true);
            expect(block.show).not.toHaveBeenCalled();
        });
    });

    describe("getLayoutUpdateType()", () => {
        let block;
        let mockPb;

        beforeEach(() => {
            mockPb = {
                style: "twoarg",
                expandable: true,
                dockTypes: ["out", "numberin", "numberin", "in"]
            };
            block = new Block(mockPb, mockBlocks);
            block.connections = [null, null, null, null];
            block.docks = [
                [0, 0, "out"],
                [10, 10, "numberin"],
                [10, 30, "numberin"],
                [0, 40, "in"]
            ];
        });

        it("returns null for negative connectionIndex", () => {
            expect(block.getLayoutUpdateType(-1)).toBeNull();
        });

        it("returns 'ARG' for connectionIndex 1 and 2 on twoArgBlock", () => {
            expect(block.isTwoArgBlock()).toBe(true);
            expect(block.getLayoutUpdateType(1)).toBe("ARG");
            expect(block.getLayoutUpdateType(2)).toBe("ARG");
        });

        it("returns 'ARG' for connectionIndex 1 and 2 on expandable arg blocks", () => {
            mockPb.style = "arg";
            mockPb.expandable = true;
            expect(block.isArgBlock()).toBe(true);
            expect(block.isExpandableBlock()).toBe(true);
            expect(block.getLayoutUpdateType(1)).toBe("ARG");
            expect(block.getLayoutUpdateType(2)).toBe("ARG");
        });

        it("returns 'FLOW' for flow connections (connectionIndex === n - 2)", () => {
            mockPb.style = "flow";
            mockPb.expandable = false;
            block.connections = [null, null];
            block.docks = [
                [0, 0, "out"],
                [0, 20, "in"]
            ];
            expect(block.getLayoutUpdateType(0)).toBe("FLOW");
        });

        it("returns null for other connection indices", () => {
            expect(block.getLayoutUpdateType(0)).toBeNull();
            expect(block.getLayoutUpdateType(3)).toBeNull();
        });
    });

    describe("_newArtwork() clamp counts propagation", () => {
        let block;
        let mockPb;

        beforeEach(() => {
            mockPb = {
                style: "arg",
                expandable: true,
                generator: jest.fn(() => ["<svg></svg>", [[0, 0]], 100, 40, 40])
            };
            block = new Block(mockPb, mockBlocks);
            block.clampCount = [2, 3];
            block.isInlineCollapsible = () => false;
            block.isCollapsible = () => false;
        });

        it("passes both clamp counts to generator for argument blocks", () => {
            block.name = "multiply";
            block._newArtwork(1);
            expect(mockPb.generator).toHaveBeenCalledWith(2, 3);
        });

        it("passes both clamp counts to generator for comparison blocks", () => {
            for (const compName of ["equal", "greater", "less"]) {
                block.name = compName;
                mockPb.generator.mockClear();
                block._newArtwork(1);
                expect(mockPb.generator).toHaveBeenCalledWith(2, 3);
            }
        });
    });
});
