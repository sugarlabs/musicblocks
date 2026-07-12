// Copyright (c) 2026 Sugarlabs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

"use strict";

// ---------------------------------------------------------------------------
// Global mocks required by exporters.js
// ---------------------------------------------------------------------------

global.SPECIALINPUTS = [
    "text",
    "number",
    "solfege",
    "eastindiansolfege",
    "scaledegree2",
    "notename",
    "voicename",
    "modename",
    "chordname",
    "drumname",
    "effectsname",
    "filtertype",
    "oscillatortype",
    "boolean",
    "intervalname",
    "invertmode",
    "accidentalname",
    "temperamentname",
    "noisename",
    "customNote",
    "grid",
    "outputtools",
    "wrapmode"
];

global.INLINECOLLAPSIBLES = ["newnote", "interval", "osctime", "definemode"];

// Minimal SVG-like strings for collapse/expand buttons (split on "><")
global.EXPANDBUTTON =
    '<svg><g><rect width="10" height="10"></rect><path d="M0 0"></path></g></svg>';
global.COLLAPSEBUTTON =
    '<svg><g><circle cx="5" cy="5" r="5"></circle><line x1="0" y1="0"></line></g></svg>';

// Minimal turtle SVG with placeholder fill_color / stroke_color tokens
global.TURTLESVG =
    '<svg><g><path fill="fill_color" stroke="stroke_color" d="M0 0"></path>' +
    '<circle fill="fill_color" stroke="stroke_color" cx="5" cy="5" r="3"></circle></g></svg>';

global.FILLCOLORS = [
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FF8000",
    "#8000FF",
    "#0080FF",
    "#FF0080"
];
global.STROKECOLORS = [
    "#800000",
    "#008000",
    "#000080",
    "#808000",
    "#800080",
    "#008080",
    "#804000",
    "#400080",
    "#004080",
    "#800040"
];

// gettext passthrough
if (typeof global._ !== "function") {
    global._ = s => s;
}

const { extractSVGInner, printBlockSVG, printBlockPNG } = require("../exporters.js");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal block stub for printBlockSVG tests.
 */
function makeBlock(overrides = {}) {
    return {
        name: overrides.name || "action",
        container: {
            x: overrides.x !== undefined ? overrides.x : 50,
            y: overrides.y !== undefined ? overrides.y : 30
        },
        width: overrides.width !== undefined ? overrides.width : 100,
        height: overrides.height !== undefined ? overrides.height : 60,
        collapsed: overrides.collapsed || false,
        value: overrides.value !== undefined ? overrides.value : "",
        ignore: overrides.ignore || jest.fn(() => false),
        isCollapsible: overrides.isCollapsible || jest.fn(() => false)
    };
}

/**
 * Build a minimal activity mock with a blockList.
 */
function makeActivity(blocks = [], opts = {}) {
    const blockArt = opts.blockArt || {};
    const blockCollapseArt = opts.blockCollapseArt || {};
    return {
        blocks: {
            blockList: blocks,
            blockArt,
            blockCollapseArt
        }
    };
}

// ===========================================================================
// extractSVGInner
// ===========================================================================

describe("extractSVGInner", () => {
    test("extracts inner content from a valid SVG string", () => {
        const svg =
            '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50">' +
            '<rect x="0" y="0" width="100" height="50" fill="red"/>' +
            "</svg>";

        const result = extractSVGInner(svg);
        expect(result).toContain("rect");
        expect(result).toContain('fill="red"');
        // Should NOT contain the outer <svg> tag itself
        expect(result).not.toMatch(/^<svg/);
    });

    test("removes filter attributes (drop shadows)", () => {
        const svg =
            '<svg xmlns="http://www.w3.org/2000/svg">' +
            '<g filter="url(#dropshadow)">' +
            '<rect width="10" height="10"/>' +
            "</g>" +
            "</svg>";

        const result = extractSVGInner(svg);
        expect(result).toContain("rect");
        expect(result).not.toContain("filter");
    });

    test("removes multiple filter attributes from different elements", () => {
        const svg =
            '<svg xmlns="http://www.w3.org/2000/svg">' +
            '<rect filter="url(#shadow1)" width="10" height="10"/>' +
            '<circle filter="url(#shadow2)" cx="5" cy="5" r="3"/>' +
            "</svg>";

        const result = extractSVGInner(svg);
        expect(result).toContain("rect");
        expect(result).toContain("circle");
        expect(result).not.toContain("filter");
    });

    test("returns empty string for non-SVG input", () => {
        expect(extractSVGInner("<div>hello</div>")).toBe("");
    });

    test("returns empty string for plain text input", () => {
        expect(extractSVGInner("just plain text")).toBe("");
    });

    test("returns empty string for empty string input", () => {
        expect(extractSVGInner("")).toBe("");
    });

    test("preserves content when no filter attributes are present", () => {
        const svg =
            '<svg xmlns="http://www.w3.org/2000/svg">' +
            '<text x="10" y="20">Hello</text>' +
            "</svg>";

        const result = extractSVGInner(svg);
        expect(result).toContain("Hello");
        expect(result).toContain("text");
    });
});

// ===========================================================================
// printBlockSVG
// ===========================================================================

describe("printBlockSVG", () => {
    test("returns an SVG string with correct wrapper dimensions", () => {
        const blockSVG =
            '<svg xmlns="http://www.w3.org/2000/svg"><rect width="80" height="40"/></svg>';
        const block = makeBlock({ x: 10, y: 20, width: 80, height: 40 });
        const activity = makeActivity([block], {
            blockArt: { 0: blockSVG }
        });

        const result = printBlockSVG(activity);

        // The wrapper should have width=90 (x=10 + width=80) and height=60 (y=20 + height=40)
        expect(result).toContain('width="90"');
        expect(result).toContain('height="60"');
        expect(result).toContain("xmlns");
    });

    test("uses blockCollapseArt when block is collapsed", () => {
        const normalArt =
            '<svg xmlns="http://www.w3.org/2000/svg"><rect class="normal" width="80" height="40"/></svg>';
        const collapseArt =
            '<svg xmlns="http://www.w3.org/2000/svg"><rect class="collapsed" width="80" height="20"/></svg>';

        const block = makeBlock({ x: 0, y: 0, width: 80, height: 40, collapsed: true });
        const activity = makeActivity([block], {
            blockArt: { 0: normalArt },
            blockCollapseArt: { 0: collapseArt }
        });

        const result = printBlockSVG(activity);

        // Should use collapse art, not normal art
        const decoded = decodeURIComponent(result);
        expect(decoded).toContain("collapsed");
        expect(decoded).not.toContain('"normal"');
    });

    test("skips blocks that are in trash (ignore() returns true)", () => {
        const blockSVG =
            '<svg xmlns="http://www.w3.org/2000/svg"><rect class="visible" width="50" height="30"/></svg>';
        const trashedSVG =
            '<svg xmlns="http://www.w3.org/2000/svg"><rect class="trashed" width="50" height="30"/></svg>';

        const visibleBlock = makeBlock({ x: 10, y: 10, width: 50, height: 30 });
        const trashedBlock = makeBlock({
            x: 200,
            y: 200,
            width: 50,
            height: 30,
            ignore: jest.fn(() => true)
        });

        const activity = makeActivity([visibleBlock, trashedBlock], {
            blockArt: { 0: blockSVG, 1: trashedSVG }
        });

        const result = printBlockSVG(activity);
        const decoded = decodeURIComponent(result);

        expect(decoded).toContain("visible");
        expect(decoded).not.toContain("trashed");
    });

    test("skips null/undefined blocks in blockList", () => {
        const blockSVG =
            '<svg xmlns="http://www.w3.org/2000/svg"><rect width="50" height="30"/></svg>';
        const block = makeBlock({ x: 10, y: 10, width: 50, height: 30 });

        const activity = makeActivity([null, undefined, block], {
            blockArt: { 2: blockSVG }
        });

        // Should not throw
        const result = printBlockSVG(activity);
        expect(result).toContain("svg");
    });

    test("skips blocks with no rawSVG art", () => {
        const block = makeBlock({ x: 10, y: 10, width: 50, height: 30 });
        const activity = makeActivity([block], {
            blockArt: {}
        });

        // Should not throw, just produce an SVG wrapper
        const result = printBlockSVG(activity);
        expect(result).toContain("svg");
    });

    test("handles SPECIALINPUTS blocks with value injection", () => {
        const specialSVG =
            '<svg xmlns="http://www.w3.org/2000/svg">' +
            "<text><tspan>label</tspan><tspan></tspan></text>" +
            "</svg>";

        const block = makeBlock({
            name: "number",
            x: 5,
            y: 5,
            width: 60,
            height: 30,
            value: 42
        });

        const activity = makeActivity([block], {
            blockArt: { 0: specialSVG }
        });

        const result = printBlockSVG(activity);
        const decoded = decodeURIComponent(result);

        // The value 42 should appear in the serialized output
        expect(decoded).toContain("42");
    });

    test("handles SPECIALINPUTS blocks with string value and gettext", () => {
        const specialSVG =
            '<svg xmlns="http://www.w3.org/2000/svg">' + "<text><tspan></tspan></text>" + "</svg>";

        // Override _ to verify it's called for string values
        const originalTranslate = global._;
        global._ = jest.fn(s => "translated_" + s);

        const block = makeBlock({
            name: "text",
            x: 0,
            y: 0,
            width: 60,
            height: 30,
            value: "hello"
        });

        const activity = makeActivity([block], {
            blockArt: { 0: specialSVG }
        });

        const result = printBlockSVG(activity);
        const decoded = decodeURIComponent(result);

        expect(global._).toHaveBeenCalledWith("hello");
        expect(decoded).toContain("translated_hello");

        global._ = originalTranslate;
    });

    test("handles SPECIALINPUTS with last tspan fallback (no empty tspan)", () => {
        const specialSVG =
            '<svg xmlns="http://www.w3.org/2000/svg">' +
            "<text><tspan>existing</tspan><tspan>last</tspan></text>" +
            "</svg>";

        const block = makeBlock({
            name: "number",
            x: 0,
            y: 0,
            width: 60,
            height: 30,
            value: 99
        });

        const activity = makeActivity([block], {
            blockArt: { 0: specialSVG }
        });

        const result = printBlockSVG(activity);
        const decoded = decodeURIComponent(result);

        expect(decoded).toContain("99");
    });

    test("handles SPECIALINPUTS with text element fallback (no tspan)", () => {
        const specialSVG =
            '<svg xmlns="http://www.w3.org/2000/svg">' + "<text>old value</text>" + "</svg>";

        const block = makeBlock({
            name: "boolean",
            x: 0,
            y: 0,
            width: 60,
            height: 30,
            value: "true"
        });

        const activity = makeActivity([block], {
            blockArt: { 0: specialSVG }
        });

        const result = printBlockSVG(activity);
        const decoded = decodeURIComponent(result);

        expect(decoded).toContain("true");
    });

    test("removes dropshadow filter from SPECIALINPUTS SVG", () => {
        const specialSVG =
            '<svg xmlns="http://www.w3.org/2000/svg">' +
            '<g style="filter:url(#dropshadow)">' +
            "<text><tspan></tspan></text>" +
            "</g>" +
            "</svg>";

        const block = makeBlock({
            name: "number",
            x: 0,
            y: 0,
            width: 60,
            height: 30,
            value: 7
        });

        const activity = makeActivity([block], {
            blockArt: { 0: specialSVG }
        });

        const result = printBlockSVG(activity);
        const decoded = decodeURIComponent(result);

        // The dropshadow filter should be removed
        expect(decoded).not.toContain("filter:url(#dropshadow)");
        expect(decoded).toContain("7");
    });

    test("includes transform with block position coordinates", () => {
        const blockSVG =
            '<svg xmlns="http://www.w3.org/2000/svg"><rect width="50" height="30"/></svg>';
        const block = makeBlock({ x: 120, y: 75, width: 50, height: 30 });
        const activity = makeActivity([block], {
            blockArt: { 0: blockSVG }
        });

        const result = printBlockSVG(activity);
        const decoded = decodeURIComponent(result);

        expect(decoded).toContain("translate(120, 75)");
    });

    test("handles collapsible blocks with expand/collapse button art", () => {
        const blockSVG =
            '<svg xmlns="http://www.w3.org/2000/svg"><rect width="50" height="30"/></svg>';

        const block = makeBlock({
            x: 10,
            y: 10,
            width: 50,
            height: 30,
            isCollapsible: jest.fn(() => true),
            collapsed: false
        });

        const activity = makeActivity([block], {
            blockArt: { 0: blockSVG }
        });

        const result = printBlockSVG(activity);
        const decoded = decodeURIComponent(result);

        // Collapsible blocks get extra <g> wrappers and button art
        expect(decoded).toContain("scale(0.5 0.5)");
        // Should contain COLLAPSEBUTTON parts (since collapsed=false)
        expect(decoded).toContain("circle");
        expect(decoded).toContain("line");
    });

    test("collapsible block uses EXPANDBUTTON when collapsed", () => {
        const blockSVG =
            '<svg xmlns="http://www.w3.org/2000/svg"><rect width="50" height="30"/></svg>';

        const block = makeBlock({
            x: 10,
            y: 10,
            width: 50,
            height: 30,
            isCollapsible: jest.fn(() => true),
            collapsed: true
        });

        const activity = makeActivity([block], {
            blockArt: { 0: "unused" },
            blockCollapseArt: { 0: blockSVG }
        });

        const result = printBlockSVG(activity);
        const decoded = decodeURIComponent(result);

        // When collapsed, uses EXPANDBUTTON parts (rect + path)
        expect(decoded).toContain("scale(0.5 0.5)");
        expect(decoded).toContain("rect");
        expect(decoded).toContain("path");
    });

    test("INLINECOLLAPSIBLES use y + 4 offset, others use y + 12", () => {
        const blockSVG =
            '<svg xmlns="http://www.w3.org/2000/svg"><rect width="50" height="30"/></svg>';

        // An inline collapsible block
        const inlineBlock = makeBlock({
            name: "newnote",
            x: 10,
            y: 100,
            width: 50,
            height: 30,
            isCollapsible: jest.fn(() => true)
        });

        const activity1 = makeActivity([inlineBlock], {
            blockArt: { 0: blockSVG }
        });

        const result1 = printBlockSVG(activity1);
        const decoded1 = decodeURIComponent(result1);

        // y + 4 = 104 for inline collapsible
        expect(decoded1).toContain("translate(10, 104)");

        // A non-inline collapsible block
        const regularBlock = makeBlock({
            name: "action",
            x: 10,
            y: 100,
            width: 50,
            height: 30,
            isCollapsible: jest.fn(() => true)
        });

        const activity2 = makeActivity([regularBlock], {
            blockArt: { 0: blockSVG }
        });

        const result2 = printBlockSVG(activity2);
        const decoded2 = decodeURIComponent(result2);

        // y + 12 = 112 for non-inline collapsible
        expect(decoded2).toContain("translate(10, 112)");
    });

    test("handles 'start' blocks with turtle SVG and color injection", () => {
        const blockSVG =
            '<svg xmlns="http://www.w3.org/2000/svg"><rect width="150" height="50"/></svg>';

        const block = makeBlock({
            name: "start",
            x: 20,
            y: 40,
            width: 150,
            height: 50
        });

        const activity = makeActivity([block], {
            blockArt: { 0: blockSVG }
        });

        const result = printBlockSVG(activity);
        const decoded = decodeURIComponent(result);

        // Start blocks get turtle SVG at x+110, y+12 with scale 0.4
        expect(decoded).toContain("translate(130, 52)");
        expect(decoded).toContain("scale(0.4 0.4)");
        // Fill/stroke colors should be substituted (first start = index 0)
        expect(decoded).toContain(FILLCOLORS[0]);
        expect(decoded).toContain(STROKECOLORS[0]);
    });

    test("start block counter wraps around after 10 start blocks", () => {
        const blockSVG =
            '<svg xmlns="http://www.w3.org/2000/svg"><rect width="150" height="50"/></svg>';

        // Create 11 start blocks to test counter wrap
        const blocks = [];
        const blockArt = {};
        for (let i = 0; i < 11; i++) {
            blocks.push(
                makeBlock({
                    name: "start",
                    x: 20,
                    y: 40 + i * 60,
                    width: 150,
                    height: 50
                })
            );
            blockArt[i] = blockSVG;
        }

        const activity = makeActivity(blocks, { blockArt });
        const result = printBlockSVG(activity);
        const decoded = decodeURIComponent(result);

        // The 11th start block (index 10) should wrap to FILLCOLORS[0]
        // Count occurrences of FILLCOLORS[0] — should appear at least twice
        // (once for block 0, once for block 10 after wrap)
        const fillMatches = decoded.match(
            new RegExp(FILLCOLORS[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")
        );
        expect(fillMatches.length).toBeGreaterThanOrEqual(2);
        // Also verify the second-to-last start uses FILLCOLORS[9]
        expect(decoded).toContain(FILLCOLORS[9]);
    });

    test("encodes SVG parts as URI component in the output", () => {
        const blockSVG =
            '<svg xmlns="http://www.w3.org/2000/svg"><rect width="50" height="30"/></svg>';
        const block = makeBlock({ x: 0, y: 0, width: 50, height: 30 });
        const activity = makeActivity([block], {
            blockArt: { 0: blockSVG }
        });

        const result = printBlockSVG(activity);

        // The result should contain encoded characters
        expect(result).toContain("%3C");
    });

    test("computes xMax and yMax from all visible blocks", () => {
        const blockSVG =
            '<svg xmlns="http://www.w3.org/2000/svg"><rect width="50" height="30"/></svg>';

        const block1 = makeBlock({ x: 10, y: 10, width: 50, height: 30 });
        const block2 = makeBlock({ x: 200, y: 300, width: 100, height: 80 });

        const activity = makeActivity([block1, block2], {
            blockArt: { 0: blockSVG, 1: blockSVG }
        });

        const result = printBlockSVG(activity);

        // xMax should be 200 + 100 = 300, yMax should be 300 + 80 = 380
        expect(result).toContain('width="300"');
        expect(result).toContain('height="380"');
    });

    test("returns SVG with zero dimensions when all blocks are ignored", () => {
        const block = makeBlock({
            ignore: jest.fn(() => true)
        });

        const activity = makeActivity([block], {
            blockArt: { 0: '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>' }
        });

        const result = printBlockSVG(activity);

        // xMax and yMax should be 0 since all blocks are skipped
        expect(result).toContain('width="0"');
        expect(result).toContain('height="0"');
    });

    test("handles empty blockList gracefully", () => {
        const activity = makeActivity([], {});
        const result = printBlockSVG(activity);

        expect(result).toContain("svg");
        expect(result).toContain('width="0"');
        expect(result).toContain('height="0"');
    });
});

// ===========================================================================
// printBlockPNG
// ===========================================================================

describe("printBlockPNG", () => {
    // Shared mock state for PNG tests
    let originalCreateObjectURL;
    let originalRevokeObjectURL;
    let originalImage;
    let originalToDataURL;
    let mockDrawImage;
    const mockUrl = "blob:mock-url";

    beforeEach(() => {
        originalCreateObjectURL = URL.createObjectURL;
        originalRevokeObjectURL = URL.revokeObjectURL;
        originalImage = global.Image;
        originalToDataURL = HTMLCanvasElement.prototype.toDataURL;

        URL.createObjectURL = jest.fn(() => mockUrl);
        URL.revokeObjectURL = jest.fn();
        HTMLCanvasElement.prototype.toDataURL = jest.fn(() => "data:image/png;base64,mockdata");
        mockDrawImage = jest.fn();

        // Override getContext to return a ctx with a mock drawImage
        HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
            drawImage: mockDrawImage
        }));
    });

    afterEach(() => {
        URL.createObjectURL = originalCreateObjectURL;
        URL.revokeObjectURL = originalRevokeObjectURL;
        global.Image = originalImage;
        HTMLCanvasElement.prototype.toDataURL = originalToDataURL;
        delete HTMLCanvasElement.prototype.getContext;
    });

    test("returns a PNG data URL from block SVG content", async () => {
        const blockSVG =
            '<svg xmlns="http://www.w3.org/2000/svg"><rect width="50" height="30"/></svg>';
        const block = makeBlock({ x: 0, y: 0, width: 50, height: 30 });
        const activity = makeActivity([block], {
            blockArt: { 0: blockSVG }
        });

        // Mock Image to trigger onload synchronously
        global.Image = class {
            constructor() {
                this.onload = null;
                this.onerror = null;
            }
            set src(_val) {
                setTimeout(() => {
                    if (this.onload) this.onload();
                }, 0);
            }
        };

        const result = await printBlockPNG(activity);

        expect(result).toBe("data:image/png;base64,mockdata");
        expect(URL.createObjectURL).toHaveBeenCalled();
        expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
        // Verify ctx.drawImage was called to render the image onto canvas
        expect(mockDrawImage).toHaveBeenCalled();
    });

    test("rejects when image loading fails", async () => {
        const blockSVG =
            '<svg xmlns="http://www.w3.org/2000/svg"><rect width="50" height="30"/></svg>';
        const block = makeBlock({ x: 0, y: 0, width: 50, height: 30 });
        const activity = makeActivity([block], {
            blockArt: { 0: blockSVG }
        });

        const mockError = new Error("Image load failed");
        global.Image = class {
            constructor() {
                this.onload = null;
                this.onerror = null;
            }
            set src(_val) {
                setTimeout(() => {
                    if (this.onerror) this.onerror(mockError);
                }, 0);
            }
        };

        await expect(printBlockPNG(activity)).rejects.toThrow("Image load failed");
        expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
    });
});
