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

const { SVG } = require("../blockfactory");
const { platformColor } = require("../utils/platformstyle");
global.platformColor = platformColor;
global.deepClone = value => {
    if (typeof structuredClone === "function") {
        return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
};

jest.mock("../utils/platformstyle", () => ({
    platformColor: { header: "#FFFFFF" }
}));

describe("SVG Class", () => {
    let svg;

    beforeEach(() => {
        svg = new SVG();
        SVG.prototype._calc_porch_params = jest.fn();
    });

    describe("Constructor", () => {
        it("should initialize with default values", () => {
            expect(svg._x).toBe(0);
            expect(svg._y).toBe(0);
            expect(svg._width).toBe(0);
            expect(svg._height).toBe(0);
            expect(svg._scale).toBe(1);
            expect(svg._fill).toBe("fill_color");
            expect(svg._stroke).toBe("stroke_color");
        });
    });

    describe("Attribute Methods", () => {
        it("should set font size correctly", () => {
            svg.setFontSize(14);
            expect(svg._fontSize).toBe(14);
        });

        it("should set label offset correctly", () => {
            svg.setLabelOffset(5);
            expect(svg._labelOffset).toBe(5);
        });

        it("should enable or disable drawing innies", () => {
            svg.setDrawInniess(false);
            expect(svg._draw_inniess).toBe(false);
        });

        it("should return width and height", () => {
            expect(svg.getWidth()).toBe(0);
            expect(svg.getHeight()).toBe(0);
        });

        it("should clear docks", () => {
            svg.docks = [[10, 20]];
            svg.clearDocks();
            expect(svg.docks).toEqual([]);
        });

        it("should set scale", () => {
            svg.setScale(2);
            expect(svg._scale).toBe(2);
        });

        it("should set orientation", () => {
            svg.setOrientation(45);
            expect(svg._orientation).toBe(45);
        });

        it("should set clamp count", () => {
            svg.setClampCount(3);
            expect(svg._clampCount).toBe(3);
            expect(svg._clampSlots.length).toBe(3);
        });

        it("should set clamp slots", () => {
            svg.setClampSlots(1, 5);
            expect(svg._clampSlots[1]).toBe(5);
        });

        it("should set expand dimensions", () => {
            svg.setExpand(100, 50, 30, 20);
            expect(svg._expandX).toBe(100);
            expect(svg._expandY).toBe(50);
            expect(svg._expandX2).toBe(30);
            expect(svg._expandY2).toBe(20);
        });

        it("should set stroke width", () => {
            svg.setstrokeWidth(2);
            expect(svg._strokeWidth).toBe(2);
        });

        it("should set colors", () => {
            svg.setColors(["red", "blue"]);
            expect(svg._fill).toBe("red");
            expect(svg._stroke).toBe("blue");
        });

        it("should set fill color", () => {
            svg.setFillColor("green");
            expect(svg._fill).toBe("green");
        });

        it("should set stroke color", () => {
            svg.setStrokeColor("black");
            expect(svg._stroke).toBe("black");
        });

        it("should set innies", () => {
            svg.setInnies([true, false, true]);
            expect(svg._innies).toEqual([true, false, true]);
        });

        it("should set outie", () => {
            svg.setOutie(true);
            expect(svg._outie).toBe(true);
        });

        it("should set slot", () => {
            svg.setSlot(false);
            expect(svg._slot).toBe(false);
            expect(svg._cap).toBe(false);
        });

        it("should set cap", () => {
            svg.setCap(true);
            expect(svg._cap).toBe(true);
            expect(svg._slot).toBe(false);
        });

        it("should set tab", () => {
            svg.setTab(true);
            expect(svg._tab).toBe(true);
            expect(svg._tail).toBe(false);
        });

        it("should set tail", () => {
            svg.setTail(true);
            expect(svg._tail).toBe(true);
            expect(svg._tab).toBe(false);
        });

        it("should set porch", () => {
            svg.setPorch(true);
            expect(svg._porch).toBe(true);
        });

        it("should set boolean", () => {
            svg.setBoolean(true);
            expect(svg._bool).toBe(true);
        });

        it("should set else", () => {
            svg.setElse(true);
            expect(svg._else).toBe(true);
        });

        it("should set arm", () => {
            svg.setArm(true);
            expect(svg._arm).toBe(true);
        });
    });

    describe("SVG Block Generation Methods", () => {
        it("should generate basic block SVG", () => {
            const svgString = svg.basicBlock();
            expect(svgString).toContain("<svg");
            expect(svgString).toContain("</svg>");
        });

        it("should generate basic box SVG", () => {
            const svgString = svg.basicBox();
            expect(svgString).toContain("<svg");
            expect(svgString).toContain("</svg>");
        });

        it("should generate boolean and-or block SVG", () => {
            const svgString = svg.booleanAndOr();
            expect(svgString).toContain("<svg");
            expect(svgString).toContain("</svg>");
        });

        it("should generate boolean not block SVG", () => {
            const svgString = svg.booleanNot(false);
            expect(svgString).toContain("<svg");
            expect(svgString).toContain("</svg>");
        });

        it("should generate boolean compare block SVG", () => {
            const svgString = svg.booleanCompare();
            expect(svgString).toContain("<svg");
            expect(svgString).toContain("</svg>");
        });

        it("should generate basic clamp block SVG", () => {
            const svgString = svg.basicClamp();
            expect(svgString).toContain("<svg");
            expect(svgString).toContain("</svg>");
        });

        it("should generate arg clamp block SVG", () => {
            const svgString = svg.argClamp();
            expect(svgString).toContain("<svg");
            expect(svgString).toContain("</svg>");
        });

        it("should generate until clamp block SVG", () => {
            const svgString = svg.untilClamp();
            expect(svgString).toContain("<svg");
            expect(svgString).toContain("</svg>");
        });

        it("should generate status block SVG", () => {
            const svgString = svg.statusBlock();
            expect(svgString).toContain("<svg");
            expect(svgString).toContain("</svg>");
        });
    });

    describe("Dock Coordinate Rounding (Regression Tests)", () => {
        const BLOCKSCALES = [
            0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0, 3.25, 3.5, 3.75, 4.0
        ];

        BLOCKSCALES.forEach(scale => {
            it(`should round all dock coordinates to integers at scale ${scale} for booleanCompare`, () => {
                svg.setScale(scale);
                svg.booleanCompare();

                expect(svg.docks.length).toBeGreaterThan(0);
                svg.docks.forEach(dock => {
                    expect(Number.isInteger(dock[0])).toBe(true);
                    expect(Number.isInteger(dock[1])).toBe(true);
                });
            });

            it(`should round all dock coordinates to integers at scale ${scale} for booleanAndOr`, () => {
                svg.setScale(scale);
                svg.booleanAndOr();

                expect(svg.docks.length).toBeGreaterThan(0);
                svg.docks.forEach(dock => {
                    expect(Number.isInteger(dock[0])).toBe(true);
                    expect(Number.isInteger(dock[1])).toBe(true);
                });
            });

            it(`should round all dock coordinates to integers at scale ${scale} for booleanNot`, () => {
                svg.setScale(scale);
                svg.booleanNot(false);

                expect(svg.docks.length).toBeGreaterThan(0);
                svg.docks.forEach(dock => {
                    expect(Number.isInteger(dock[0])).toBe(true);
                    expect(Number.isInteger(dock[1])).toBe(true);
                });
            });
        });

        it("should explicitly prevent fractional dock coordinates at scale 2.25 for booleanCompare", () => {
            svg.setScale(2.25);
            svg.booleanCompare();

            // Expected integers matching our local patched build: [[1, 57], [116, 28], [116, 75]]
            // Verify that none of them match the unrounded pattern (like x.125 or y.375)
            expect(svg.docks).toEqual([
                [1, 57],
                [116, 28],
                [116, 75]
            ]);
        });
    });

    describe("Slot and Tail Coordinate Rounding", () => {
        it("should round dock coordinates correctly in _doSlot when _cap is true", () => {
            svg.setScale(2.25);
            svg.setSlot(false);
            svg.setCap(true);
            svg.clearDocks();
            svg._doSlot();
            expect(svg.docks.length).toBe(1);
            expect(Number.isInteger(svg.docks[0][0])).toBe(true);
            expect(Number.isInteger(svg.docks[0][1])).toBe(true);
        });

        it("should round dock coordinates correctly in _doTail when _tail is true", () => {
            svg.setScale(2.25);
            svg.setTab(false);
            svg.setTail(true);
            svg.clearDocks();
            svg._doTail();
            expect(svg.docks.length).toBe(1);
            expect(Number.isInteger(svg.docks[0][0])).toBe(true);
            expect(Number.isInteger(svg.docks[0][1])).toBe(true);
        });
    });
});
