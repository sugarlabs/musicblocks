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

const Block = require("../block");

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
        visible: true,
        children: []
    })),
    Bitmap: jest.fn().mockImplementation(() => ({
        visible: true,
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
global.base64Encode = jest.fn(str => str);
global.retryWithBackoff = jest.fn(({ onSuccess }) => onSuccess());

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
global.SPECIALINPUTS = ["number", "text", "boolean"];
global.COLLAPSIBLES = ["repeat", "forever", "if"];
global.INLINECOLLAPSIBLES = ["newnote", "interval", "osctime"];
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
            blockList: []
        };

        mockProtoBlock = {
            name: "forward",
            image: "forward.svg",
            size: 1,
            docks: [],
            hidden: false
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
            mockProtoBlock.name = "start";
            const block = new Block(mockProtoBlock, mockBlocks);
            expect(block.isCollapsible()).toBe(true);

            mockProtoBlock.name = "forward";
            const block2 = new Block(mockProtoBlock, mockBlocks);
            expect(block2.isCollapsible()).toBe(false);
        });

        it("isInlineCollapsible() should return true for inline collapsible blocks", () => {
            mockProtoBlock.name = "newnote";
            const block = new Block(mockProtoBlock, mockBlocks);
            expect(block.isInlineCollapsible()).toBe(true);

            mockProtoBlock.name = "forward";
            const block2 = new Block(mockProtoBlock, mockBlocks);
            expect(block2.isInlineCollapsible()).toBe(false);
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
        });
    });
});
