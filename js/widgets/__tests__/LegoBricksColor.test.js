/**
 * MusicBlocks
 *
 * @copyright 2026 Music Blocks contributors
 *
 * @license
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * The GNU Affero General Public License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public License along with this
 * library; if not, write to the Free Software Foundation, 51 Franklin Street, Suite 500 Boston,
 * MA 02110-1335 USA.
 */

global.LegoBricksRows = require("../LegoBricksRows");
global.LegoBricksLayout = require("../LegoBricksLayout");
global.LegoBricksExport = require("../LegoBricksExport");
global.LegoBricksMedia = require("../LegoBricksMedia");
global.LegoBricksEyeDropper = require("../LegoBricksEyeDropper");
global.LegoBricksColor = require("../LegoBricksColor");
global.LegoBricksPlayback = require("../LegoBricksPlayback");
global.LegoBricksVisualization = require("../LegoBricksVisualization");
global.LegoWidget = require("../legobricks");

const LegoWidget = global.LegoWidget;
const LegoBricksColor = global.LegoBricksColor;
const METHODS = [
    "_getColorFamily",
    "_rgbToHsl",
    "_colorsAreSimilar",
    "_getColorForCanvasRow",
    "_mergeConsecutiveColorSegments",
    "_shouldMergeColors",
    "_sampleAndDetectColor",
    "_getColorFamilyByName",
    "_addColorSegment"
];

describe("LegoBricksColor", () => {
    let widget;

    beforeEach(() => {
        widget = new LegoWidget();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("holds exactly the methods moved out of LegoWidget", () => {
        const target = {};
        LegoBricksColor.call(target);
        expect(Object.keys(target).sort()).toEqual([...METHODS].sort());
    });

    test("installModules sets the same methods on each widget instance", () => {
        const target = {};
        LegoBricksColor.call(target);
        for (const name of METHODS) {
            expect(Object.prototype.hasOwnProperty.call(widget, name)).toBe(true);
            expect(widget[name].toString()).toBe(target[name].toString());
        }
    });

    describe("_rgbToHsl and _getColorFamily", () => {
        test.each([
            [[255, 0, 0], "red"],
            [[255, 140, 0], "orange"],
            [[255, 255, 0], "yellow"],
            [[0, 200, 0], "green"],
            [[0, 255, 255], "cyan"],
            [[0, 0, 255], "blue"],
            [[128, 0, 255], "purple"],
            [[255, 0, 255], "magenta"],
            [[255, 105, 180], "pink"],
            [[250, 250, 250], "white"],
            [[10, 10, 10], "black"],
            [[128, 128, 128], "gray"]
        ])("rgb %j reads as %s", (rgb, name) => {
            const [h, s, l] = widget._rgbToHsl(...rgb);
            expect(widget._getColorFamily(h, s, l).name).toBe(name);
        });

        test("_rgbToHsl returns whole degrees and percentages", () => {
            expect(widget._rgbToHsl(255, 0, 0)).toEqual([0, 100, 50]);
            expect(widget._rgbToHsl(0, 0, 255)).toEqual([240, 100, 50]);
            expect(widget._rgbToHsl(255, 255, 255)).toEqual([0, 0, 100]);
        });

        test("the hue bands meet without gaps", () => {
            for (let h = 0; h < 360; h++) {
                expect(widget._getColorFamily(h, 80, 50).name).not.toBe("unknown");
            }
        });
    });

    test("_colorsAreSimilar matches equal names and nothing for missing colors", () => {
        expect(widget._colorsAreSimilar({ name: "red" }, { name: "red" })).toBe(true);
        expect(widget._colorsAreSimilar({ name: "red" }, { name: "blue" })).toBe(false);
        expect(widget._colorsAreSimilar(null, { name: "red" })).toBe(false);
    });

    test("_shouldMergeColors merges equal names and the gray family only", () => {
        expect(widget._shouldMergeColors("red", "red")).toBe(true);
        expect(widget._shouldMergeColors("white", "black")).toBe(true);
        expect(widget._shouldMergeColors("gray", "white")).toBe(true);
        expect(widget._shouldMergeColors("red", "orange")).toBe(false);
        expect(widget._shouldMergeColors("white", "yellow")).toBe(false);
    });

    test("_mergeConsecutiveColorSegments joins runs of the same color", () => {
        widget.colorData = [
            {
                colorSegments: [
                    { color: "red", duration: 1000, endTime: 1000 },
                    { color: "red", duration: 500, endTime: 1500 },
                    { color: "white", duration: 700, endTime: 2200 },
                    { color: "gray", duration: 300, endTime: 2500 },
                    { color: "red", duration: 1000, endTime: 3500 }
                ]
            },
            undefined,
            { colorSegments: [{ color: "blue", duration: 900 }] }
        ];

        widget._mergeConsecutiveColorSegments();

        expect(widget.colorData[0].colorSegments).toEqual([
            { color: "red", duration: 1500, endTime: 1500 },
            { color: "white", duration: 1000, endTime: 2500 },
            { color: "red", duration: 1000, endTime: 3500 }
        ]);
        expect(widget.colorData[2].colorSegments).toEqual([{ color: "blue", duration: 900 }]);
    });

    test("_getColorFamilyByName knows every color family", () => {
        for (const name of Object.keys(LegoWidget.COLOR_HEX_MAP)) {
            expect(widget._getColorFamilyByName(name).name).toBe(name);
        }
        expect(widget._getColorFamilyByName("unknown")).toBeNull();
    });

    describe("_addColorSegment", () => {
        test("creates the row entry from the matrix row the first time", () => {
            widget.colorData = [];
            widget.matrixData.rows = [{ note: "C4", label: "Do (4)" }];

            widget._addColorSegment(0, { name: "red" }, 1200);
            widget._addColorSegment(0, { name: "blue" }, 800);

            expect(widget.colorData[0].note).toBe("C4");
            expect(widget.colorData[0].label).toBe("Do (4)");
            expect(widget.colorData[0].colorSegments.map(s => [s.color, s.duration])).toEqual([
                ["red", 1200],
                ["blue", 800]
            ]);
        });

        test("copes with a row index past the matrix", () => {
            widget.colorData = [];
            widget.matrixData.rows = [];
            widget._addColorSegment(3, { name: "red" }, 1200);
            expect(widget.colorData[3].note).toBeUndefined();
        });
    });

    describe("_getColorForCanvasRow", () => {
        let media;

        beforeEach(() => {
            widget.gridOverlay = { getBoundingClientRect: () => ({ top: 100 }) };
            media = { getBoundingClientRect: () => ({ top: 140, height: 80 }) };
        });

        test("uses the background color for a row above or below the image", () => {
            expect(widget._getColorForCanvasRow({ topPos: 0, bottomPos: 40 }, media)).toEqual({
                name: "green",
                hue: 120
            });
            expect(widget._getColorForCanvasRow({ topPos: 120, bottomPos: 160 }, media)).toEqual({
                name: "green",
                hue: 120
            });
        });

        test("samples a row that overlaps the image", () => {
            expect(widget._getColorForCanvasRow({ topPos: 30, bottomPos: 70 }, media)).toBeNull();
        });
    });

    describe("_sampleAndDetectColor", () => {
        let ctx;
        let pixel;

        beforeEach(() => {
            pixel = [255, 0, 0, 255];
            ctx = { drawImage: jest.fn(), getImageData: jest.fn(() => ({ data: pixel })) };
            widget.colorData = [];
            widget.matrixData.rows = [{ note: "C4", label: "Do (4)" }];
            widget.gridOverlay = { getBoundingClientRect: () => ({ left: 0, top: 0 }) };
            widget.imageWrapper = document.createElement("div");
            const img = document.createElement("img");
            img.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 });
            widget.imageWrapper.appendChild(img);
            widget._offscreenCanvas = { width: 100, height: 100 };
            widget._offscreenCtx = ctx;
            widget._offscreenMediaElement = img;
            widget._offscreenIsVideo = false;
        });

        const line = () => ({
            rowIndex: 0,
            currentX: 10,
            topPos: 0,
            bottomPos: 40,
            currentColor: null,
            colorStartTime: null
        });

        test("starts tracking the dominant color under the line", () => {
            const l = line();
            widget._sampleAndDetectColor(l, 1000);

            expect(l.currentColor.name).toBe("red");
            expect(l.colorStartTime).toBe(1000);
            expect(ctx.drawImage).not.toHaveBeenCalled();
        });

        test("saves the previous color once a new one has lasted long enough", () => {
            const l = line();
            widget._sampleAndDetectColor(l, 1000);
            pixel = [0, 0, 255, 255];

            widget._sampleAndDetectColor(l, 1300);
            expect(l.currentColor.name).toBe("red");

            widget._sampleAndDetectColor(l, 2600);
            expect(l.currentColor.name).toBe("blue");
            expect(widget.colorData[0].colorSegments).toEqual([
                expect.objectContaining({ color: "red", duration: 1600 })
            ]);
        });

        test("ignores transparent pixels", () => {
            pixel = [255, 0, 0, 0];
            const l = line();
            widget._sampleAndDetectColor(l, 1000);
            expect(l.currentColor).toBeNull();
        });

        test("redraws the current frame for a webcam", () => {
            widget._offscreenIsVideo = true;
            widget._sampleAndDetectColor(line(), 1000);
            expect(ctx.drawImage).toHaveBeenCalled();
        });

        test("skips a line that is left of the image", () => {
            const l = line();
            l.currentX = -5;
            widget._sampleAndDetectColor(l, 1000);
            expect(ctx.getImageData).not.toHaveBeenCalled();
        });

        test("warns and stops without media", () => {
            jest.spyOn(console, "warn").mockImplementation(() => {});
            widget.imageWrapper = null;
            widget._sampleAndDetectColor(line(), 1000);
            expect(console.warn).toHaveBeenCalledWith(
                "No image or video element found for color sampling"
            );
        });
    });
});
