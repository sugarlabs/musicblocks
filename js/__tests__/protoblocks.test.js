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
        getBounds: jest.fn(() => ({ width: 50 }))
    })),
    Text: jest.fn((text, font, color) => ({ text, font, color }))
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
    getHeight: jest.fn(() => 50)
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
        expect(block.capabilities).toEqual({});
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

    test("capability helpers should store and read flags", () => {
        block.setCapability("collapsible");
        block.setCapabilities({
            specialInput: true,
            noHit: false
        });

        expect(block.hasCapability("collapsible")).toBe(true);
        expect(block.getCapability("specialInput")).toBe(true);
        expect(block.hasCapability("noHit")).toBe(false);
        expect(block.getCapability("missing")).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// Block shape definitions
//
// Each of these configures the geometry that every block of that shape
// inherits: how many arguments it takes, the sequence of dock types that
// decides what can connect where, whether it stretches, and which generator
// draws it. The values are asserted exactly, because a wrong dock type is the
// difference between a block that accepts a number and one that accepts a
// whole stack.
// ---------------------------------------------------------------------------

describe("ProtoBlock shape definitions", () => {
    let pb;

    beforeEach(() => {
        pb = new ProtoBlock("shape");
        pb.staticLabels = ["label"];
    });

    describe("blocks with no arguments", () => {
        it("hiddenBlockNoFlow takes up no space and cannot be followed", () => {
            pb.hiddenBlockNoFlow();

            expect(pb.args).toBe(0);
            expect(pb.size).toBe(0);
            expect(pb.dockTypes).toEqual(["out", "unavailable"]);
            expect(pb.generator).toBe(pb.hiddenBlockFlowGenerator);
        });

        it("basicBlockNoFlow accepts a parent but nothing after it", () => {
            pb.basicBlockNoFlow();

            expect(pb.args).toBe(0);
            expect(pb.dockTypes).toEqual(["out", "unavailable"]);
            expect(pb.generator).toBe(pb.basicBlockNoFlowGenerator);
        });

        it("basicBlockCollapsed accepts nothing on either end", () => {
            pb.basicBlockCollapsed();

            expect(pb.args).toBe(0);
            expect(pb.dockTypes).toEqual(["unavailable", "unavailable"]);
            expect(pb.generator).toBe(pb.basicBlockCollapsedGenerator);
        });
    });

    describe("blocks with arguments", () => {
        it("oneBooleanArgBlock takes a boolean rather than a number", () => {
            pb.oneBooleanArgBlock();

            expect(pb.args).toBe(1);
            expect(pb.size).toBe(1);
            expect(pb.dockTypes).toEqual(["out", "booleanin", "in"]);
            expect(pb.generator).toBe(pb.oneBooleanArgBlockGenerator);
        });

        it("threeArgBlock stretches and takes three numbers", () => {
            pb.threeArgBlock();

            expect(pb.args).toBe(3);
            expect(pb.size).toBe(3);
            expect(pb.style).toBe("twoarg");
            expect(pb.expandable).toBe(true);
            expect(pb.dockTypes).toEqual(["out", "numberin", "numberin", "numberin", "in"]);
        });

        it("fourArgBlock takes four numbers and is one size larger", () => {
            pb.fourArgBlock();

            expect(pb.args).toBe(4);
            expect(pb.size).toBe(4);
            expect(pb.style).toBe("twoarg");
            expect(pb.expandable).toBe(true);
            expect(pb.dockTypes).toEqual([
                "out",
                "numberin",
                "numberin",
                "numberin",
                "numberin",
                "in"
            ]);
        });
    });

    // The math blocks report a value rather than passing flow along, so they
    // open with "numberout" and never carry an "in" dock.
    describe("math blocks", () => {
        it("oneArgMathBlock reports a value and is not expandable", () => {
            pb.oneArgMathBlock();

            expect(pb.args).toBe(1);
            expect(pb.size).toBe(1);
            expect(pb.style).toBe("arg");
            expect(pb.parameter).toBe(true);
            expect(pb.dockTypes).toEqual(["numberout", "numberin"]);
        });

        it.each([
            ["twoArgMathBlock", 2],
            ["threeArgMathBlock", 3],
            ["fourArgMathBlock", 4]
        ])("%s takes %i numbers and stretches", (method, count) => {
            pb[method]();

            expect(pb.args).toBe(count);
            expect(pb.size).toBe(count);
            expect(pb.style).toBe("arg");
            expect(pb.parameter).toBe(true);
            expect(pb.expandable).toBe(true);
            expect(pb.dockTypes).toEqual(["numberout", ...Array(count).fill("numberin")]);
        });

        it("every math block reports out and never accepts flow", () => {
            for (const method of [
                "oneArgMathBlock",
                "twoArgMathBlock",
                "threeArgMathBlock",
                "fourArgMathBlock"
            ]) {
                const block = new ProtoBlock(method);
                block[method]();

                expect(block.dockTypes[0]).toBe("numberout");
                expect(block.dockTypes).not.toContain("in");
                expect(block.dockTypes).not.toContain("out");
            }
        });
    });

    describe("value and media blocks", () => {
        it("valueBlock reports a number and takes no arguments", () => {
            pb.valueBlock();

            expect(pb.style).toBe("value");
            expect(pb.size).toBe(1);
            expect(pb.args).toBe(0);
            expect(pb.dockTypes).toEqual(["numberout"]);
            expect(pb.generator).toBe(pb.valueBlockGenerator);
        });

        it("mediaBlock reports media and is twice the height", () => {
            pb.mediaBlock();

            expect(pb.style).toBe("value");
            expect(pb.size).toBe(2);
            expect(pb.args).toBe(0);
            expect(pb.dockTypes).toEqual(["mediaout"]);
            expect(pb.generator).toBe(pb.mediaBlockGenerator);
        });
    });

    // Clamps wrap a stack of other blocks, so they always carry a second "in"
    // dock for the contained stack on top of their own connections.
    describe("clamp blocks", () => {
        it("stackClampZeroArgBlock is detached at both ends and holds a stack", () => {
            pb.stackClampZeroArgBlock();

            expect(pb.style).toBe("clamp");
            expect(pb.expandable).toBe(true);
            expect(pb.size).toBe(3);
            expect(pb.args).toBe(1);
            expect(pb.dockTypes).toEqual(["unavailable", "in", "unavailable"]);
        });

        it("flowClampBlock connects to a parent and holds a stack", () => {
            pb.flowClampBlock();

            expect(pb.style).toBe("clamp");
            expect(pb.expandable).toBe(true);
            expect(pb.size).toBe(2);
            expect(pb.args).toBe(1);
            expect(pb.dockTypes).toEqual(["out", "in", "in"]);
        });

        it("flowClampOneArgBlock adds a number slot before the clamp", () => {
            pb.flowClampOneArgBlock();

            expect(pb.size).toBe(2);
            expect(pb.args).toBe(2);
            expect(pb.dockTypes).toEqual(["out", "numberin", "in", "in"]);
        });

        it("flowClampTwoArgBlock adds two number slots before the clamp", () => {
            pb.flowClampTwoArgBlock();

            expect(pb.size).toBe(3);
            expect(pb.args).toBe(3);
            expect(pb.dockTypes).toEqual(["out", "numberin", "numberin", "in", "in"]);
        });

        it("every flow clamp ends with two in docks, its own and the clamp's", () => {
            for (const method of [
                "flowClampBlock",
                "flowClampOneArgBlock",
                "flowClampTwoArgBlock"
            ]) {
                const block = new ProtoBlock(method);
                block[method]();

                expect(block.style).toBe("clamp");
                expect(block.expandable).toBe(true);
                expect(block.dockTypes[0]).toBe("out");
                expect(block.dockTypes.slice(-2)).toEqual(["in", "in"]);
            }
        });
    });

    // Arg clamps hold a stack but report a value, so they take a text name
    // first and then an "anyin" for the contained stack.
    describe("argument clamp blocks", () => {
        it("argClampOneArgBlock connects to flow and names its clamp", () => {
            pb.argClampOneArgBlock();

            expect(pb.style).toBe("argclamp");
            expect(pb.expandable).toBe(true);
            expect(pb.size).toBe(3);
            expect(pb.args).toBe(2);
            expect(pb.dockTypes).toEqual(["out", "textin", "anyin", "in"]);
        });

        it("argClampOneArgMathBlock reports a value instead of carrying flow", () => {
            pb.argClampOneArgMathBlock();

            expect(pb.style).toBe("argclamparg");
            expect(pb.size).toBe(3);
            expect(pb.args).toBe(2);
            expect(pb.dockTypes).toEqual(["anyout", "textin", "anyin"]);
            expect(pb.dockTypes).not.toContain("out");
        });
    });

    // A shape method is only half the definition. The other half is the
    // generator it installs, which is what actually draws the block.
    describe("generator wiring", () => {
        it.each([
            ["basicBlockNoFlow", "basicBlockNoFlowGenerator"],
            ["basicBlockCollapsed", "basicBlockCollapsedGenerator"],
            ["oneBooleanArgBlock", "oneBooleanArgBlockGenerator"],
            ["threeArgBlock", "threeArgBlockGenerator"],
            ["fourArgBlock", "fourArgBlockGenerator"],
            ["oneArgMathBlock", "oneArgMathBlockGenerator"],
            ["twoArgMathBlock", "twoArgMathBlockGenerator"],
            ["threeArgMathBlock", "threeArgMathBlockGenerator"],
            ["fourArgMathBlock", "fourArgMathBlockGenerator"],
            ["valueBlock", "valueBlockGenerator"],
            ["mediaBlock", "mediaBlockGenerator"],
            ["stackClampZeroArgBlock", "stackClampZeroArgBlockGenerator"],
            ["flowClampBlock", "flowClampBlockGenerator"],
            ["flowClampOneArgBlock", "flowClampOneArgBlockGenerator"],
            ["flowClampTwoArgBlock", "flowClampTwoArgBlockGenerator"],
            ["argClampOneArgBlock", "argClampOneArgBlockGenerator"],
            ["argClampOneArgMathBlock", "argClampOneArgMathBlockGenerator"]
        ])("%s installs %s", (method, generator) => {
            const block = new ProtoBlock(method);
            block.staticLabels = ["label"];
            block[method]();

            expect(block.generator).toBe(block[generator]);
        });
    });

    describe("dock count matches the declared argument count", () => {
        // A block that declares three arguments but only offers two input
        // docks would silently drop the third, so the two are checked against
        // each other rather than asserted independently.
        it.each([
            ["oneBooleanArgBlock", 1],
            ["threeArgBlock", 3],
            ["fourArgBlock", 4],
            ["oneArgMathBlock", 1],
            ["twoArgMathBlock", 2],
            ["threeArgMathBlock", 3],
            ["fourArgMathBlock", 4]
        ])("%s offers %i input docks", (method, expected) => {
            const block = new ProtoBlock(method);
            block[method]();

            const inputDocks = block.dockTypes.filter(d => /in$/.test(d) && d !== "in");

            expect(inputDocks).toHaveLength(expected);
            expect(block.args).toBe(expected);
        });
    });
});

// ---------------------------------------------------------------------------
// Generators
//
// The shape method is only half a block definition. The generator is what
// actually draws it, and the clamp generators branch on how many slots the
// caller asks for. The suite above pins the geometry; this one pins the
// drawing calls that geometry turns into.
// ---------------------------------------------------------------------------

describe("ProtoBlock generators", () => {
    let svgCalls;
    let originalSVG;

    // The shared SVG stub at the top of this file covers the simpler blocks.
    // Clamp and boolean generators reach for more of the drawing API, so this
    // records every call and returns predictable geometry.
    beforeEach(() => {
        svgCalls = [];
        originalSVG = global.SVG;
        const record = name => jest.fn((...args) => svgCalls.push([name, ...args]));
        global.SVG = jest.fn(() => ({
            setScale: record("setScale"),
            setTab: record("setTab"),
            setSlot: record("setSlot"),
            setCap: record("setCap"),
            setTail: record("setTail"),
            setInnies: record("setInnies"),
            setOutie: record("setOutie"),
            setBoolean: record("setBoolean"),
            setFontSize: record("setFontSize"),
            setExpand: record("setExpand"),
            setLabelOffset: record("setLabelOffset"),
            setClampSlots: record("setClampSlots"),
            setClampCount: record("setClampCount"),
            basicBlock: jest.fn(() => "<svg>basic</svg>"),
            basicBox: jest.fn(() => "<svg>box</svg>"),
            basicClamp: jest.fn(() => "<svg>clamp</svg>"),
            argClamp: jest.fn(() => "<svg>argclamp</svg>"),
            booleanNot: jest.fn(() => "<svg>not</svg>"),
            booleanAndOr: jest.fn(() => "<svg>andor</svg>"),
            booleanCompare: jest.fn(() => "<svg>compare</svg>"),
            // Wide enough for every generator here. The two-argument clamp
            // reads docks[3] for its clamp offset, so a shorter list throws.
            docks: [
                [0, 0],
                [10, 20],
                [10, 40],
                [10, 60],
                [10, 80]
            ],
            getWidth: jest.fn(() => 120),
            getHeight: jest.fn(() => 60)
        }));
    });

    afterEach(() => {
        global.SVG = originalSVG;
    });

    const callsTo = name => svgCalls.filter(c => c[0] === name);

    const build = method => {
        const block = new ProtoBlock(method);
        block.staticLabels = ["label"];
        block[method]();
        return block;
    };

    describe("clamp slot handling", () => {
        it.each([
            "flowClampBlockGenerator",
            "flowClampOneArgBlockGenerator",
            "flowClampTwoArgBlockGenerator",
            "stackClampZeroArgBlockGenerator"
        ])("%s defaults to a single slot when none is given", generator => {
            const shape = generator.replace("Generator", "");
            const block = build(shape);

            block.generator();

            expect(callsTo("setClampSlots")).toContainEqual(["setClampSlots", 0, 1]);
        });

        it.each([
            ["flowClampBlockGenerator", 3],
            ["flowClampOneArgBlockGenerator", 5],
            ["flowClampTwoArgBlockGenerator", 2],
            ["stackClampZeroArgBlockGenerator", 4]
        ])("%s honours an explicit slot count of %i", (generator, slots) => {
            const shape = generator.replace("Generator", "");
            const block = build(shape);

            block.generator(slots);

            expect(callsTo("setClampSlots")).toContainEqual(["setClampSlots", 0, slots]);
        });
    });

    describe("font size", () => {
        it("is left to the default when the block sets none", () => {
            const block = build("flowClampBlock");

            block.generator();

            expect(callsTo("setFontSize")).toHaveLength(0);
        });

        it("is applied when the block sets one", () => {
            const block = build("flowClampBlock");
            block.fontsize = 14;

            block.generator();

            expect(callsTo("setFontSize")).toContainEqual(["setFontSize", 14]);
        });
    });

    describe("returned artwork", () => {
        it("clamp generators return the clamp artwork with docks and size", () => {
            const block = build("flowClampBlock");

            const [artwork, docks, width, height] = block.generator();

            expect(artwork).toBe("<svg>clamp</svg>");
            expect(docks).toEqual([
                [0, 0],
                [10, 20],
                [10, 40],
                [10, 60],
                [10, 80]
            ]);
            expect(width).toBe(120);
            expect(height).toBe(60);
        });

        it("argument clamp generators return the arg clamp artwork", () => {
            const block = build("argClampOneArgBlock");

            const [artwork] = block.generator();

            expect(artwork).toBe("<svg>argclamp</svg>");
        });

        it.each([
            "threeArgBlock",
            "fourArgBlock",
            "oneBooleanArgBlock",
            "oneArgMathBlock",
            "twoArgMathBlock",
            "threeArgMathBlock",
            "fourArgMathBlock",
            "valueBlock",
            "mediaBlock",
            "basicBlockNoFlow",
            "basicBlockCollapsed"
        ])("%s returns artwork, docks and non-zero dimensions", shape => {
            const block = build(shape);

            const result = block.generator();

            expect(typeof result[0]).toBe("string");
            expect(Array.isArray(result[1])).toBe(true);
            expect(result[2]).toBeGreaterThan(0);
            expect(result[3]).toBeGreaterThan(0);
        });
    });

    describe("scale is always applied first", () => {
        it.each(["flowClampBlock", "threeArgBlock", "valueBlock", "argClampOneArgBlock"])(
            "%s passes its scale to the renderer",
            shape => {
                const block = build(shape);
                block.scale = 2.5;

                block.generator();

                expect(callsTo("setScale")).toContainEqual(["setScale", 2.5]);
            }
        );
    });
});
