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
const LegoBricksEyeDropper = global.LegoBricksEyeDropper;
const METHODS = [
    "_toggleEyeDropper",
    "_activateEyeDropper",
    "_deactivateEyeDropper",
    "_handleEyeDropperClick",
    "_sampleColorAtPosition",
    "_createColorPreviewTooltip",
    "_removeColorPreviewTooltip",
    "_handleEyeDropperHover",
    "_handleEyeDropperLeave",
    "_updateBackgroundColorDisplay",
    "_getColorHex",
    "_getContrastColor"
];

describe("LegoBricksEyeDropper", () => {
    let widget;

    beforeEach(() => {
        global._ = text => text;
        widget = new LegoWidget();
        widget.activity = { textMsg: jest.fn() };
        widget.imageDisplayArea = document.createElement("div");
        widget.eyeDropperButton = document.createElement("button");
    });

    afterEach(() => {
        widget._removeColorPreviewTooltip();
        delete global._;
        jest.restoreAllMocks();
    });

    test("holds exactly the methods moved out of LegoWidget", () => {
        const target = {};
        LegoBricksEyeDropper.call(target);
        expect(Object.keys(target).sort()).toEqual([...METHODS].sort());
    });

    test("installModules sets the same methods on each widget instance", () => {
        const target = {};
        LegoBricksEyeDropper.call(target);
        for (const name of METHODS) {
            expect(Object.prototype.hasOwnProperty.call(widget, name)).toBe(true);
            expect(widget[name].toString()).toBe(target[name].toString());
        }
    });

    test("the event handlers stay bound to their own widget", () => {
        const other = new LegoWidget();
        expect(widget._handleEyeDropperClick).not.toBe(other._handleEyeDropperClick);

        widget._createColorPreviewTooltip();
        widget.colorPreviewTooltip.style.display = "block";
        const { _handleEyeDropperLeave } = widget;
        _handleEyeDropperLeave({});
        expect(widget.colorPreviewTooltip.style.display).toBe("none");
    });

    describe("activation", () => {
        test("_toggleEyeDropper switches the mode on and off", () => {
            widget._toggleEyeDropper();
            expect(widget.eyeDropperMode).toBe(true);
            expect(widget.imageDisplayArea.style.cursor).toBe("crosshair");
            expect(widget.colorPreviewTooltip).not.toBeNull();

            widget._toggleEyeDropper();
            expect(widget.eyeDropperMode).toBe(false);
            expect(widget.imageDisplayArea.style.cursor).toBe("default");
            expect(widget.colorPreviewTooltip).toBeNull();
        });

        test("activating highlights the button and listens on the image", () => {
            const addSpy = jest.spyOn(widget.imageDisplayArea, "addEventListener");
            widget._activateEyeDropper();

            expect(widget.eyeDropperButton.style.backgroundColor).toBe("rgb(76, 175, 80)");
            expect(addSpy).toHaveBeenCalledWith("mousemove", widget._handleEyeDropperHover);
            expect(addSpy).toHaveBeenCalledWith("click", widget._handleEyeDropperClick);
            expect(addSpy).toHaveBeenCalledWith("mouseleave", widget._handleEyeDropperLeave);
            expect(document.body.contains(widget.colorPreviewTooltip)).toBe(true);
        });

        test("activating twice keeps a single tooltip", () => {
            widget._activateEyeDropper();
            widget._activateEyeDropper();
            expect(document.body.querySelectorAll("div[style*='pointer-events']").length).toBe(1);
        });

        test("deactivating without a button or image area does not throw", () => {
            widget.eyeDropperButton = null;
            widget.imageDisplayArea = null;
            expect(() => widget._deactivateEyeDropper()).not.toThrow();
        });
    });

    describe("_handleEyeDropperClick", () => {
        const click = {
            clientX: 5,
            clientY: 6,
            preventDefault: jest.fn(),
            stopPropagation: jest.fn()
        };

        test("selects the sampled color and leaves eye dropper mode", () => {
            widget.backgroundColorDisplay = document.createElement("span");
            widget._activateEyeDropper();
            widget.eyeDropperMode = true;
            widget._sampleColorAtPosition = jest.fn(() => ({ name: "blue", hue: 240 }));

            widget._handleEyeDropperClick(click);

            expect(widget._sampleColorAtPosition).toHaveBeenCalledWith(5, 6);
            expect(widget.selectedBackgroundColor).toEqual({ name: "blue", hue: 240 });
            expect(widget.eyeDropperMode).toBe(false);
            expect(widget.colorPreviewTooltip).toBeNull();
            expect(widget.backgroundColorDisplay.textContent).toBe("blue");
            expect(widget.activity.textMsg).toHaveBeenLastCalledWith(
                "Background color selected: blue"
            );
        });

        test("keeps the old color when nothing could be sampled", () => {
            widget._sampleColorAtPosition = jest.fn(() => null);
            widget._handleEyeDropperClick(click);

            expect(widget.selectedBackgroundColor).toEqual({ name: "green", hue: 120 });
            expect(widget.activity.textMsg).toHaveBeenCalledWith(
                "Could not sample color - please try clicking on the image."
            );
        });
    });

    describe("_sampleColorAtPosition", () => {
        let img;
        let ctx;

        beforeEach(() => {
            widget.imageWrapper = document.createElement("div");
            img = document.createElement("img");
            Object.defineProperty(img, "naturalWidth", { value: 100 });
            Object.defineProperty(img, "naturalHeight", { value: 50 });
            img.getBoundingClientRect = () => ({ left: 10, top: 20, width: 200, height: 100 });
            widget.imageWrapper.appendChild(img);
            ctx = HTMLCanvasElement.prototype.getContext("2d");
            ctx.getImageData = jest.fn(() => ({ data: [255, 0, 0, 255] }));
        });

        afterEach(() => {
            delete ctx.getImageData;
        });

        test("maps the screen point onto the image's own pixels", () => {
            expect(widget._sampleColorAtPosition(110, 70)).toEqual({ name: "red", hue: 0 });
            // (110 - 10) / 200 * 100 = 50, (70 - 20) / 100 * 50 = 25
            expect(ctx.getImageData).toHaveBeenCalledWith(50, 25, 1, 1);
        });

        test("returns null outside the image", () => {
            expect(widget._sampleColorAtPosition(5, 70)).toBeNull();
            expect(widget._sampleColorAtPosition(110, 500)).toBeNull();
        });

        test("returns null without any media", () => {
            widget.imageWrapper = null;
            expect(widget._sampleColorAtPosition(110, 70)).toBeNull();
        });

        test("returns null when the canvas is tainted", () => {
            jest.spyOn(console, "warn").mockImplementation(() => {});
            ctx.getImageData = jest.fn(() => {
                throw new Error("SecurityError");
            });
            expect(widget._sampleColorAtPosition(110, 70)).toBeNull();
        });
    });

    describe("hover preview", () => {
        beforeEach(() => {
            widget.eyeDropperMode = true;
            widget._createColorPreviewTooltip();
        });

        test("shows the hovered color next to the cursor", () => {
            widget._sampleColorAtPosition = jest.fn(() => ({ name: "orange", hue: 30 }));
            widget._handleEyeDropperHover({ clientX: 100, clientY: 200 });

            expect(widget.colorPreviewText.textContent).toBe("Orange");
            expect(widget.colorSwatch.style.backgroundColor).toBe("rgb(255, 165, 0)");
            expect(widget.colorPreviewTooltip.style.left).toBe("115px");
            expect(widget.colorPreviewTooltip.style.top).toBe("160px");
            expect(widget.colorPreviewTooltip.style.display).toBe("block");
        });

        test("hides the preview off the image", () => {
            widget.colorPreviewTooltip.style.display = "block";
            widget._sampleColorAtPosition = jest.fn(() => null);
            widget._handleEyeDropperHover({ clientX: 1, clientY: 1 });
            expect(widget.colorPreviewTooltip.style.display).toBe("none");
        });

        test("does nothing once eye dropper mode is off", () => {
            widget.eyeDropperMode = false;
            widget._sampleColorAtPosition = jest.fn();
            widget._handleEyeDropperHover({ clientX: 1, clientY: 1 });
            expect(widget._sampleColorAtPosition).not.toHaveBeenCalled();
        });
    });

    test("_updateBackgroundColorDisplay paints the swatch with readable text", () => {
        widget.backgroundColorDisplay = document.createElement("span");
        widget.selectedBackgroundColor = { name: "yellow", hue: 60 };
        widget._updateBackgroundColorDisplay();

        expect(widget.backgroundColorDisplay.textContent).toBe("yellow");
        expect(widget.backgroundColorDisplay.style.backgroundColor).toBe("rgb(255, 255, 0)");
        expect(widget.backgroundColorDisplay.style.color).toBe("rgb(0, 0, 0)");
    });

    test("_getColorHex falls back to gray for an unknown name", () => {
        expect(widget._getColorHex("purple")).toBe("#800080");
        expect(widget._getColorHex("unknown")).toBe("#808080");
    });

    test("_getContrastColor uses black text only on light colors", () => {
        for (const name of ["white", "yellow", "cyan", "pink", "orange"]) {
            expect(widget._getContrastColor(name)).toBe("#000000");
        }
        for (const name of ["black", "blue", "red", "green", "purple"]) {
            expect(widget._getContrastColor(name)).toBe("#FFFFFF");
        }
    });
});
