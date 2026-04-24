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

const BlockConnectionManager = require("../BlockConnectionManager");

describe("BlockConnectionManager", () => {
    const makeBlock = props => ({
        connections: [null],
        isArgClamp: jest.fn(() => false),
        isArgFlowClampBlock: jest.fn(() => false),
        isExpandableBlock: jest.fn(() => false),
        isInlineCollapsible: jest.fn(() => false),
        isLeftClampBlock: jest.fn(() => false),
        ...props
    });

    test("testConnectionType allows compatible dock types", () => {
        const manager = new BlockConnectionManager({ blockList: [] });

        expect(manager.testConnectionType("numberin", "numberout")).toBe(true);
        expect(manager.testConnectionType("numberin", "booleanout")).toBe(false);
    });

    test("insideArgClamp returns the parent arg clamp", () => {
        const manager = new BlockConnectionManager({
            blockList: [
                makeBlock({ connections: [1] }),
                makeBlock({ isArgClamp: jest.fn(() => true) })
            ]
        });

        expect(manager.insideArgClamp(0)).toBe(1);
    });

    test("insideExpandableBlock returns the containing expandable block", () => {
        const manager = new BlockConnectionManager({
            blockList: [
                makeBlock({ connections: [1] }),
                makeBlock({
                    connections: [null, 0, 2],
                    isExpandableBlock: jest.fn(() => true)
                }),
                makeBlock({ connections: [1] })
            ]
        });

        expect(manager.insideExpandableBlock(0)).toBe(1);
    });

    test("insideExpandableBlock keeps searching from the last child", () => {
        const manager = new BlockConnectionManager({
            blockList: [
                makeBlock({ connections: [1] }),
                makeBlock({
                    connections: [3, 0],
                    isExpandableBlock: jest.fn(() => true)
                }),
                makeBlock({ connections: [3] }),
                makeBlock({
                    connections: [null, 1, 2],
                    isExpandableBlock: jest.fn(() => true)
                })
            ]
        });

        expect(manager.insideExpandableBlock(0)).toBe(3);
    });

    test("insideInlineCollapsibleBlock returns the first containing inline block", () => {
        const manager = new BlockConnectionManager({
            blockList: [
                makeBlock({ connections: [1] }),
                makeBlock({
                    connections: [null, 0, 2],
                    isInlineCollapsible: jest.fn(() => true)
                }),
                makeBlock({ connections: [1] })
            ]
        });

        expect(manager.insideInlineCollapsibleBlock(0)).toBe(1);
    });
});
