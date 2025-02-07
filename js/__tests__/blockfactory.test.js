const { SVG } = require('../blockfactory');
const { platformColor } = require('../utils/platformstyle');
global.platformColor = platformColor;

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
});
