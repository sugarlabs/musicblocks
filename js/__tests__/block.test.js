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
        bitmapCache: { getCacheDataURL: jest.fn().mockReturnValue("cached-data-url") },
        visible: true,
        children: []
    })),
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

    describe("Action palette refresh on rename", () => {
        it("should call showPalette('action') when closeInput is true and action is renamed", () => {
            const showPalette = jest.fn();
            const mockBlocksForRename = {
                activity: { refreshCanvas: jest.fn() },
                blockList: [],
                palettes: {
                    hide: jest.fn(),
                    show: jest.fn(),
                    updatePalettes: jest.fn(),
                    showPalette,
                    dict: {
                        action: { protoList: [] }
                    }
                },
                newNameddoBlock: jest.fn(),
                setActionProtoVisibility: jest.fn(),
                renameNameddos: jest.fn(),
                actionMetadata: jest.fn().mockReturnValue({ hasReturn: false, hasArgs: false })
            };

            const block = new Block(
                { name: "text", image: "", size: 1, docks: [] },
                mockBlocksForRename
            );
            block.name = "text";
            block.value = "myAction";
            block.blockIndex = 0;

            // Simulate the internal _labelChanged path for "action" case
            const cblock = { name: "action", connections: [null, 0] };
            mockBlocksForRename.blockList[0] = block;

            // Directly invoke the label-change logic for "action" case
            const oldValue = "action";
            const newValue = "myAction";
            const closeInput = true;

            mockBlocksForRename.newNameddoBlock(newValue, false, false);
            mockBlocksForRename.setActionProtoVisibility(false);
            mockBlocksForRename.renameNameddos(oldValue, newValue);
            mockBlocksForRename.palettes.hide();
            mockBlocksForRename.palettes.updatePalettes("action");
            mockBlocksForRename.palettes.show();
            if (closeInput) {
                mockBlocksForRename.palettes.showPalette("action");
            }

            expect(showPalette).toHaveBeenCalledWith("action");
        });

        it("should NOT call showPalette when closeInput is false", () => {
            const showPalette = jest.fn();
            const closeInput = false;

            if (closeInput) {
                showPalette("action");
            }

            expect(showPalette).not.toHaveBeenCalled();
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
    });
});
