/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2026 Music Blocks contributors
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

const BlockSerializer = require("../BlockSerializer");

describe("BlockSerializer", () => {
    let blocks;
    let blockSerializer;

    beforeEach(() => {
        document.body.innerHTML = '<div id="load-container" style="display:block"></div>';
        global._ = key => key;
        global.COLLAPSIBLES = [];
        global.last = arr => (arr && arr.length > 0 ? arr[arr.length - 1] : null);
        global.BACKWARDCOMPATIBILITYDICT = {};

        blocks = {
            _loadCounter: 1,
            _findDrumURLs: jest.fn(),
            updateBlockPositions: jest.fn(),
            blocksToCollapse: [],
            blockList: [],
            protoBlockDict: {},
            activity: {
                refreshCanvas: jest.fn(),
                canvas: {
                    width: 500,
                    height: 500
                },
                setHomeContainers: jest.fn(),
                palettes: {
                    updatePalettes: jest.fn()
                },
                stopLoadAnimation: jest.fn()
            },
            _checkArgClampBlocks: [],
            _checkTwoArgBlocks: [],
            _adjustTheseDocks: [],
            _adjustTheseStacks: [],
            _getNestingDepth: jest.fn(() => 0),
            _adjustArgClampBlock: jest.fn(),
            _adjustExpandableTwoArgBlock: jest.fn(),
            adjustDocks: jest.fn(),
            _expandClamps: jest.fn(),
            raiseStackToTop: jest.fn(),
            dragGroup: [],
            findDragGroup: jest.fn(function () {
                this.dragGroup = [0, 1, 2];
            }),
            newNameddoBlock: jest.fn(() => false),
            newStorein2Block: jest.fn(),
            newNamedboxBlock: jest.fn(),
            setActionProtoVisibility: jest.fn(),
            _processOneBlock: jest.fn(),
            findBlockInstance: jest.fn(() => false),
            updateBlockText: jest.fn(),
            _makeNewBlockWithConnections: jest.fn()
        };

        blockSerializer = new BlockSerializer(blocks);
    });

    afterEach(() => {
        delete global._;
        delete global.COLLAPSIBLES;
        delete global.last;
        delete global.BACKWARDCOMPATIBILITYDICT;
        jest.clearAllMocks();
    });

    test("loadNewBlocks removes deprecated playback queue entries before processing", () => {
        const blockObjs = [
            [0, "text", 0, 0, [null]],
            [1, 42, 0, 0, [null]]
        ];

        blocks.protoBlockDict.text = {
            style: "value",
            expandable: false
        };

        blockSerializer.loadNewBlocks(blockObjs);

        expect(blockObjs).toHaveLength(1);
        expect(blocks._loadCounter).toBe(1);
        expect(blocks._processOneBlock).toHaveBeenCalledWith(0, blockObjs, 0, 0);
    });

    test("loadNewBlocks aborts on circular block connections", () => {
        const blockObjs = [[0, "text", 0, 0, [0]]];

        blockSerializer.loadNewBlocks(blockObjs);

        expect(blocks._processOneBlock).not.toHaveBeenCalled();
        expect(blocks._loadCounter).toBe(1);
    });

    test("loadNewBlocks renames duplicate imported action names and updates do blocks", () => {
        blocks.blockList = [
            { trash: false, name: "action", connections: [null, 1] },
            { value: "melody" }
        ];
        blocks.protoBlockDict.action = {
            style: "clamp",
            expandable: false
        };
        blocks.protoBlockDict.text = {
            style: "value",
            expandable: false
        };
        blocks.protoBlockDict.nameddo = {
            style: "value",
            expandable: false
        };

        const blockObjs = [
            [0, "action", 0, 0, [null, 1, null]],
            [1, ["text", { value: "melody" }], 0, 0, [0]],
            [2, ["nameddo", { value: "melody" }], 0, 0, [null]]
        ];

        blockSerializer.loadNewBlocks(blockObjs);

        expect(blockObjs[1][1][1]).toEqual({ value: "melody1" });
        expect(blockObjs[2][1][1]).toEqual({ value: "melody1" });
        expect(blocks._processOneBlock).toHaveBeenCalledTimes(4);
    });

    test("processOneBlock applies number values and tracks top-level stacks", () => {
        blocks.blockList = [];
        blocks._makeNewBlockWithConnections.mockImplementation(
            (_name, _offset, _connections, postProcess, postProcessArg) => {
                blocks.blockList.push({
                    connections: [null],
                    container: {}
                });

                if (postProcess) {
                    postProcess(postProcessArg);
                }
            }
        );

        const blockObjs = [[0, ["number", { value: "12" }], 10, 20, [null]]];

        blockSerializer.processOneBlock(0, blockObjs, 0, 0);

        expect(blocks.blockList[0].value).toBe(12);
        expect(blocks.updateBlockText).toHaveBeenCalledWith(0);
        expect(blocks.blockList[0].container.x).toBe(10);
        expect(blocks.blockList[0].container.y).toBe(20);
        expect(blocks._adjustTheseDocks).toEqual([0]);
        expect(blocks._adjustTheseStacks).toEqual([0]);
    });

    test("actionMetadata returns false flags for non-action blocks", () => {
        blocks.blockList = [{ name: "note" }];

        expect(blockSerializer.actionMetadata(0)).toEqual({
            hasReturn: false,
            hasArgs: false
        });
    });

    test("actionMetadata detects return and arg blocks in the drag group", () => {
        blocks.blockList = [{ name: "action" }, { name: "return" }, { name: "namedarg" }];

        expect(blockSerializer.actionMetadata(0)).toEqual({
            hasReturn: true,
            hasArgs: true
        });
        expect(blocks.findDragGroup).toHaveBeenCalledWith(0);
    });

    test("cleanupStacks expands tracked blocks before raising stacks", () => {
        blocks._checkArgClampBlocks = [10];
        blocks._checkTwoArgBlocks = [20];
        blocks._adjustTheseDocks = [30];
        blocks._adjustTheseStacks = [40];
        blocks._getNestingDepth = jest.fn(blk => (blk === 10 ? 1 : 2));

        blockSerializer.cleanupStacks();

        expect(blocks._adjustExpandableTwoArgBlock).toHaveBeenCalledWith([20]);
        expect(blocks._adjustArgClampBlock).toHaveBeenCalledWith([10]);
        expect(blocks.adjustDocks).toHaveBeenCalledWith(30, true);
        expect(blocks._expandClamps).toHaveBeenCalled();
        expect(blocks.raiseStackToTop).toHaveBeenCalledWith(40);
    });

    test("cleanupAfterLoad finalizes the load when the last block completes", async () => {
        const finishedLoading = jest.fn();
        document.addEventListener("finishedLoading", finishedLoading);

        await blockSerializer.cleanupAfterLoad();

        expect(blocks._findDrumURLs).toHaveBeenCalled();
        expect(blocks.updateBlockPositions).toHaveBeenCalled();
        expect(blocks.activity.refreshCanvas).toHaveBeenCalled();
        expect(blocks.activity.stopLoadAnimation).toHaveBeenCalled();
        expect(document.getElementById("load-container").style.display).toBe("none");
        expect(finishedLoading).toHaveBeenCalled();

        document.removeEventListener("finishedLoading", finishedLoading);
    });
});
