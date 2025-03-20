/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Om Santosh Suneri
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

const ProtoBlock = require("../protoblocks");
global.createjs = {
    Container: jest.fn(() => ({
        addChild: jest.fn(),
        getBounds: jest.fn(() => ({ width: 50 })),
    })),
    Text: jest.fn((text, font, color) => ({ text, font, color })),
};

global.SVG = jest.fn(() => ({
    setScale: jest.fn(),
    setTab: jest.fn(),
    setSlot: jest.fn(),
    setFontSize: jest.fn(),
    setExpand: jest.fn(),
    basicBlock: jest.fn(() => "<svg></svg>"),
    docks: [[0, 0]],
    getWidth: jest.fn(() => 100),
    getHeight: jest.fn(() => 50),
}));

global.DEFAULTBLOCKSCALE = 1.0;
global.STANDARDBLOCKHEIGHT = 20;

describe("ProtoBlock", () => {
    let block;
    beforeEach(() => {
        block = new ProtoBlock("TestBlock");
    });

    test("should initialize with default properties", () => {
        expect(block.name).toBe("TestBlock");
        expect(block.palette).toBeNull();
        expect(block.style).toBeNull();
        expect(block.generator).toBeNull();
        expect(block.expandable).toBe(false);
        expect(block.args).toBe(0);
        expect(block.defaults).toEqual([]);
    });

    test("adjustWidthToLabel should set textWidth and extraWidth", () => {
        block.staticLabels.push("Example Label");
        block.adjustWidthToLabel();
        expect(block.textWidth).toBe(50);
        expect(block.extraWidth).toBeGreaterThan(0);
    });

    test("zeroArgBlock should set correct properties", () => {
        block.zeroArgBlock();
        expect(block.args).toBe(0);
        expect(block.dockTypes).toEqual(["out", "in"]);
        expect(typeof block.generator).toBe("function");
    });

    test("zeroArgBlockGenerator should return SVG details", () => {
        block.zeroArgBlock();
        const result = block.generator();
        expect(result).toEqual(["<svg></svg>", [[0, 0]], 100, 50, 50]);
    });

    test("oneArgBlock should set correct properties", () => {
        block.oneArgBlock();
        expect(block.args).toBe(1);
        expect(block.dockTypes).toEqual(["out", "numberin", "in"]);
    });

    test("twoArgBlock should configure expandable block", () => {
        block.twoArgBlock();
        expect(block.expandable).toBe(true);
        expect(block.args).toBe(2);
        expect(block.dockTypes).toContain("numberin");
    });

    test("hiddenBlockFlow should set generator correctly", () => {
        block.hiddenBlockFlow();
        expect(block.size).toBe(0);
        expect(block.dockTypes).toContain("in");
    });

    test("booleanZeroArgBlock should configure boolean output", () => {
        block.booleanZeroArgBlock();
        expect(block.dockTypes).toContain("booleanout");
    });

    test("parameterBlock should set up a value output block", () => {
        block.parameterBlock();
        expect(block.dockTypes).toContain("numberout");
        expect(block.parameter).toBe(true);
    });
});
