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
                activity: { refreshCanvas: jest.fn() },
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

    describe("hide", () => {
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
});
