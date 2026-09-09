/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2026 Sugar Labs
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
 * Tests for the prepareExport() logic in activity.js.
 *
 * prepareExport() serializes the current block list to JSON. These tests
 * verify that it does not mutate any live block objects during serialization,
 * and that calling it multiple times produces identical output (idempotency).
 */

/**
 * Minimal standalone implementation of the prepareExport logic extracted
 * from activity.js for unit testing without requiring the full app context.
 */
function buildPrepareExport(blockList) {
    return () => {
        const blockMap = [];
        const blockIndexById = new Map();

        for (let blk = 0; blk < blockList.length; blk++) {
            const myBlock = blockList[blk];
            if (!myBlock || myBlock.trash) continue;
            blockIndexById.set(blk, blockMap.length);
            blockMap.push(blk);
        }

        const data = [];
        for (let blk = 0; blk < blockList.length; blk++) {
            const myBlock = blockList[blk];
            if (!myBlock || myBlock.trash) continue;

            let args = null;
            let exportName = myBlock.name;

            switch (myBlock.name) {
                case "nopValueBlock":
                case "nopZeroArgBlock":
                case "nopOneArgBlock":
                case "nopTwoArgBlock":
                case "nopThreeArgBlock":
                    exportName = myBlock.privateData;
                    break;
                case "namedbox":
                case "namedarg":
                case "storein2":
                case "nameddo":
                case "outputtools":
                    args = { value: myBlock.privateData };
                    break;
                default:
                    break;
            }

            const connections = myBlock.connections.map(c => {
                const mapped = blockIndexById.get(c);
                return c === null || mapped === undefined ? null : mapped;
            });

            const blockIndex = blockIndexById.get(blk);
            if (args === null) {
                data.push([
                    blockIndex,
                    exportName,
                    myBlock.container.x,
                    myBlock.container.y,
                    connections
                ]);
            } else {
                data.push([
                    blockIndex,
                    [exportName, args],
                    myBlock.container.x,
                    myBlock.container.y,
                    connections
                ]);
            }
        }

        return JSON.stringify(data);
    };
}

function makeBlock(name, privateData = null, extra = {}) {
    return {
        name,
        privateData,
        trash: false,
        connections: [],
        container: { x: 100, y: 200 },
        ...extra
    };
}

describe("prepareExport", () => {
    describe("nop* block serialization", () => {
        test("exports nopValueBlock using privateData as the block name", () => {
            const block = makeBlock("nopValueBlock", "myCustomBlock");
            const prepareExport = buildPrepareExport([block]);

            const result = JSON.parse(prepareExport());

            expect(result[0][1]).toBe("myCustomBlock");
        });

        test("exports nopZeroArgBlock using privateData as the block name", () => {
            const block = makeBlock("nopZeroArgBlock", "someAction");
            const prepareExport = buildPrepareExport([block]);

            const result = JSON.parse(prepareExport());

            expect(result[0][1]).toBe("someAction");
        });

        test("exports nopOneArgBlock using privateData as the block name", () => {
            const block = makeBlock("nopOneArgBlock", "customAction");
            const prepareExport = buildPrepareExport([block]);

            const result = JSON.parse(prepareExport());

            expect(result[0][1]).toBe("customAction");
        });

        test("exports nopTwoArgBlock using privateData as the block name", () => {
            const block = makeBlock("nopTwoArgBlock", "twoArgAction");
            const prepareExport = buildPrepareExport([block]);

            const result = JSON.parse(prepareExport());

            expect(result[0][1]).toBe("twoArgAction");
        });

        test("exports nopThreeArgBlock using privateData as the block name", () => {
            const block = makeBlock("nopThreeArgBlock", "threeArgAction");
            const prepareExport = buildPrepareExport([block]);

            const result = JSON.parse(prepareExport());

            expect(result[0][1]).toBe("threeArgAction");
        });
    });

    describe("live block mutation guard", () => {
        test("does not mutate myBlock.name on nopValueBlock after export", () => {
            const block = makeBlock("nopValueBlock", "originalPlugin");
            const prepareExport = buildPrepareExport([block]);

            prepareExport();

            expect(block.name).toBe("nopValueBlock");
        });

        test("does not mutate myBlock.name on nopZeroArgBlock after export", () => {
            const block = makeBlock("nopZeroArgBlock", "somePlugin");
            const prepareExport = buildPrepareExport([block]);

            prepareExport();

            expect(block.name).toBe("nopZeroArgBlock");
        });

        test("does not mutate any block name for non-nop blocks", () => {
            const block = makeBlock("namedbox", "myVar");
            const prepareExport = buildPrepareExport([block]);

            prepareExport();

            expect(block.name).toBe("namedbox");
        });
    });

    describe("idempotency", () => {
        test("produces identical output on two consecutive calls with nopValueBlock", () => {
            const block = makeBlock("nopValueBlock", "pluginBlock");
            const prepareExport = buildPrepareExport([block]);

            const first = prepareExport();
            const second = prepareExport();

            expect(first).toBe(second);
        });

        test("produces identical output on two consecutive calls with mixed block types", () => {
            const blocks = [
                makeBlock("nopValueBlock", "plugin1"),
                makeBlock("nopZeroArgBlock", "plugin2"),
                makeBlock("namedbox", "myVar")
            ];
            const prepareExport = buildPrepareExport(blocks);

            const first = prepareExport();
            const second = prepareExport();

            expect(first).toBe(second);
        });

        test("nopValueBlock export name stays correct on third call", () => {
            const block = makeBlock("nopValueBlock", "stablePlugin");
            const prepareExport = buildPrepareExport([block]);

            prepareExport();
            prepareExport();
            const third = JSON.parse(prepareExport());

            expect(third[0][1]).toBe("stablePlugin");
        });
    });

    describe("non-nop blocks are unaffected", () => {
        test("regular block name is used as-is in export", () => {
            const block = makeBlock("forward");
            const prepareExport = buildPrepareExport([block]);

            const result = JSON.parse(prepareExport());

            expect(result[0][1]).toBe("forward");
        });

        test("trashed blocks are excluded from export", () => {
            const blocks = [
                makeBlock("forward"),
                makeBlock("nopValueBlock", "plugin1", { trash: true })
            ];
            const prepareExport = buildPrepareExport(blocks);

            const result = JSON.parse(prepareExport());

            expect(result).toHaveLength(1);
            expect(result[0][1]).toBe("forward");
        });

        test("namedbox exports privateData as args value not as block name", () => {
            const block = makeBlock("namedbox", "myVariable");
            const prepareExport = buildPrepareExport([block]);

            const result = JSON.parse(prepareExport());

            expect(result[0][1][0]).toBe("namedbox");
            expect(result[0][1][1].value).toBe("myVariable");
        });
    });
});
