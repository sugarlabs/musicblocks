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
const LegoBricksVisualization = global.LegoBricksVisualization;
const METHODS = ["_drawColumnLinesOnCanvas", "_drawColumnLines", "_generateColorVisualization"];

// Two rows whose colors change at 2s and 4s, so the column boundaries are 0, 2000 and 4000.
const twoRows = () => [
    {
        note: "D4",
        label: "Re (4)",
        colorSegments: [
            { color: "red", duration: 2000 },
            { color: "green", duration: 2000 }
        ]
    },
    {
        note: "C4",
        label: "Do (4)",
        colorSegments: [
            { color: "green", duration: 2000 },
            { color: "blue", duration: 2000 }
        ]
    }
];

describe("LegoBricksVisualization", () => {
    let widget;
    let ctx;

    beforeEach(() => {
        global.platformColor = {};
        widget = new LegoWidget();
        widget.gridOverlay = document.createElement("div");
        widget.gridOverlay.getBoundingClientRect = () => ({ width: 400 });
        ctx = HTMLCanvasElement.prototype.getContext("2d");
        jest.clearAllMocks();
        ctx.strokeRect = jest.fn();
        ctx.fillText = jest.fn();
    });

    afterEach(() => {
        delete global.platformColor;
        delete ctx.strokeRect;
        delete ctx.fillText;
        jest.restoreAllMocks();
    });

    test("holds exactly the methods moved out of LegoWidget", () => {
        const target = {};
        LegoBricksVisualization.call(target);
        expect(Object.keys(target).sort()).toEqual([...METHODS].sort());
    });

    test("installModules sets the same methods on each widget instance", () => {
        const target = {};
        LegoBricksVisualization.call(target);
        for (const name of METHODS) {
            expect(Object.prototype.hasOwnProperty.call(widget, name)).toBe(true);
            expect(widget[name].toString()).toBe(target[name].toString());
        }
    });

    describe("_drawColumnLinesOnCanvas", () => {
        test("draws a column line at each inner boundary, in proportion to time", () => {
            widget.colorData = twoRows();
            widget._drawColumnLinesOnCanvas();

            const lines = widget.gridOverlay.querySelectorAll(".column-line");
            // The last boundary sits on the right edge and is not drawn.
            expect(lines).toHaveLength(1);
            expect(lines[0].style.left).toBe("200px");
            expect(lines[0].style.backgroundColor).toBe("rgb(0, 102, 255)");
        });

        test("replaces the lines from the previous scan", () => {
            widget.colorData = twoRows();
            widget._drawColumnLinesOnCanvas();
            widget._drawColumnLinesOnCanvas();
            expect(widget.gridOverlay.querySelectorAll(".column-line")).toHaveLength(1);
        });

        test("uses the theme color when there is one", () => {
            global.platformColor = { selectorSelected: "#123456" };
            widget.colorData = twoRows();
            widget._drawColumnLinesOnCanvas();
            expect(widget.gridOverlay.querySelector(".column-line").style.backgroundColor).toBe(
                "rgb(18, 52, 86)"
            );
        });

        test("draws nothing before a scan", () => {
            widget.colorData = [];
            widget._drawColumnLinesOnCanvas();
            expect(widget.gridOverlay.children).toHaveLength(0);
        });
    });

    test("_drawColumnLines strokes the same boundaries on the PNG canvas", () => {
        widget.colorData = twoRows();
        widget._drawColumnLines(ctx, 800, 100, 150, 630);

        // 150 + 2000 / 4000 * 630 and the right edge at 150 + 630
        expect(ctx.moveTo.mock.calls).toEqual([
            [465, 0],
            [780, 0]
        ]);
        expect(ctx.stroke).toHaveBeenCalledTimes(2);
        expect(ctx.lineWidth).toBe(3);
    });

    describe("_generateColorVisualization", () => {
        let createObjectURL;
        let revokeObjectURL;

        beforeEach(() => {
            createObjectURL = jest.fn(() => "blob:lego");
            revokeObjectURL = jest.fn();
            URL.createObjectURL = createObjectURL;
            URL.revokeObjectURL = revokeObjectURL;
            jest.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(callback =>
                callback(new Blob(["png"]))
            );
            jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
            widget.playColorMusicPolyphonic = jest.fn();
        });

        afterEach(() => {
            delete URL.createObjectURL;
            delete URL.revokeObjectURL;
        });

        test("downloads a PNG of the scan and then plays it", () => {
            widget.colorData = twoRows();
            widget._generateColorVisualization();

            expect(createObjectURL).toHaveBeenCalled();
            expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
            expect(revokeObjectURL).toHaveBeenCalledWith("blob:lego");
            expect(document.querySelector("a[download]")).toBeNull();
            expect(widget.playColorMusicPolyphonic).toHaveBeenCalledWith(widget.colorData);
        });

        test("labels every row and every color segment", () => {
            widget.colorData = twoRows();
            widget._generateColorVisualization();

            const texts = ctx.fillText.mock.calls.map(call => call[0]);
            expect(texts).toEqual(
                expect.arrayContaining(["Re (4) (D4)", "Do (4) (C4)", "red", "blue", "2000ms"])
            );
            // Four segments, each with a border.
            expect(ctx.strokeRect).toHaveBeenCalledTimes(4);
        });

        test("says so when a row has no colors", () => {
            widget.colorData = [{ note: "C4", label: "Do (4)", colorSegments: [] }];
            widget._generateColorVisualization();
            expect(ctx.fillText).toHaveBeenCalledWith("No colors were detected", 150, 25);
        });

        test("does nothing without scan data", () => {
            widget.colorData = [];
            widget._generateColorVisualization();
            expect(widget.playColorMusicPolyphonic).not.toHaveBeenCalled();
            expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
        });
    });
});
