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
                block._exitKeyPressed
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
    });
});
