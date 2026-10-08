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
const LegoBricksLayout = global.LegoBricksLayout;
const METHODS = [
    "_createWidgetWindow",
    "_createToolbarButtons",
    "createMainContainer",
    "_createInstrumentControls",
    "_createZoomSliderControls",
    "_createSpacingControls",
    "_createEyeDropperControls",
    "_createBackgroundColorControls",
    "createZoomControls",
    "_initializeMatrix",
    "_showZoomControls",
    "_adjustZoom",
    "_adjustVerticalSpacing",
    "_handleVerticalSpacing",
    "_handleZoom",
    "_drawGridLines",
    "_scale"
];

const makeWindow = () => {
    const body = document.createElement("div");
    return {
        clear: jest.fn(),
        show: jest.fn(),
        destroy: jest.fn(),
        getWidgetBody: () => body,
        addButton: jest.fn(() => {
            const button = document.createElement("div");
            button.appendChild(document.createElement("img"));
            return button;
        })
    };
};

describe("LegoBricksLayout", () => {
    let widget;

    beforeEach(() => {
        jest.useFakeTimers();
        global._ = text => text;
        widget = new LegoWidget();
        widget._timerManager = null;
        widget.activity = { textMsg: jest.fn(), hideMsgs: jest.fn() };
        widget.widgetWindow = makeWindow();
    });

    afterEach(() => {
        widget._clearWidgetTimers();
        if (widget._fileInput && widget._fileInput.parentNode) {
            widget._fileInput.remove();
        }
        delete global._;
        delete window.widgetWindows;
        jest.useRealTimers();
    });

    test("holds exactly the methods moved out of LegoWidget", () => {
        const target = {};
        LegoBricksLayout.call(target);
        expect(Object.keys(target).sort()).toEqual([...METHODS].sort());
    });

    test("installModules sets the same methods on each widget instance", () => {
        const target = {};
        LegoBricksLayout.call(target);
        for (const name of METHODS) {
            expect(Object.prototype.hasOwnProperty.call(widget, name)).toBe(true);
            expect(widget[name].toString()).toBe(target[name].toString());
        }
    });

    describe("_createWidgetWindow", () => {
        let win;

        beforeEach(() => {
            win = makeWindow();
            window.widgetWindows = { windowFor: jest.fn(() => win) };
        });

        test("opens a cleared LEGO Bricks window", () => {
            expect(widget._createWidgetWindow()).toBe(win);
            expect(window.widgetWindows.windowFor).toHaveBeenCalledWith(widget, "LEGO Bricks");
            expect(win.clear).toHaveBeenCalled();
            expect(win.show).toHaveBeenCalled();
            expect(widget.widgetWindow).toBe(win);
        });

        test("closing releases the webcam, timers and drag listeners", () => {
            widget._createWidgetWindow();
            widget._stopWebcam = jest.fn();
            widget._clearWidgetTimers = jest.fn();
            widget._cleanupDragListeners = jest.fn();
            widget.webcamVideo = document.createElement("video");
            widget.running = true;

            win.onclose();

            expect(widget._stopWebcam).toHaveBeenCalled();
            expect(widget._clearWidgetTimers).toHaveBeenCalled();
            expect(widget._cleanupDragListeners).toHaveBeenCalled();
            expect(widget.webcamVideo).toBeNull();
            expect(widget.running).toBe(false);
            expect(win.destroy).toHaveBeenCalled();
        });

        test("closing removes the hidden file input and cancels the scan frame", () => {
            const cancelSpy = jest
                .spyOn(global, "cancelAnimationFrame")
                .mockImplementation(() => {});
            widget._createWidgetWindow();
            widget._fileInput = document.createElement("input");
            document.body.appendChild(widget._fileInput);
            const input = widget._fileInput;
            widget._animationFrameId = 42;

            win.onclose();

            expect(document.body.contains(input)).toBe(false);
            expect(widget._fileInput).toBeNull();
            expect(cancelSpy).toHaveBeenCalledWith(42);
            expect(widget._animationFrameId).toBeNull();
            cancelSpy.mockRestore();
        });
    });

    test("_createToolbarButtons wires every button to its action", () => {
        const actions = [
            "_savePhrase",
            "_exportPhrase",
            "_uploadImage",
            "_startWebcam",
            "_clearPhrase"
        ];
        actions.forEach(name => (widget[name] = jest.fn()));
        widget._createToolbarButtons(widget.widgetWindow);

        expect(widget.widgetWindow.addButton).toHaveBeenCalledTimes(6);
        expect(widget.widgetWindow.addButton.mock.calls[0]).toEqual([
            "play-button.svg",
            LegoWidget.ICONSIZE,
            "Play"
        ]);
        widget.saveButton.onclick();
        widget.exportButton.onclick();
        widget.uploadButton.onclick();
        widget.webcamButton.onclick();
        widget.clearButton.onclick();
        actions.forEach(name => expect(widget[name]).toHaveBeenCalledTimes(1));
    });

    test("the play button switches between scanning and stopping", () => {
        widget._playPhrase = jest.fn();
        widget._stopPlayback = jest.fn();
        widget._createToolbarButtons(widget.widgetWindow);

        widget.playButton.onclick();
        expect(widget._playPhrase).toHaveBeenCalled();
        expect(widget.playButton.querySelector("img").src).toContain("stop-button.svg");

        widget.isPlaying = true;
        widget.playButton.onclick();
        expect(widget._stopPlayback).toHaveBeenCalled();
    });

    describe("createMainContainer", () => {
        beforeEach(() => {
            widget.createMainContainer();
        });

        test("builds the row headers, image area, grid overlay and controls", () => {
            const body = widget.widgetWindow.getWidgetBody();
            expect(body.contains(widget.rowHeaderTable)).toBe(true);
            expect(body.contains(widget.imageDisplayArea)).toBe(true);
            expect(body.contains(widget.gridOverlay)).toBe(true);
            expect(body.contains(widget.zoomControls)).toBe(true);
            expect(widget.imagePlaceholder.textContent).toBe("Click upload button to add an image");
        });

        test("adds a hidden image picker that hands the file to the upload handler", () => {
            widget._handleImageUpload = jest.fn();
            expect(document.body.contains(widget._fileInput)).toBe(true);
            expect(widget._fileInput.accept).toBe("image/*");

            const event = { target: { files: [] } };
            widget._fileInput.onchange(event);
            expect(widget._handleImageUpload).toHaveBeenCalledWith(event);
        });
    });

    describe("control bar", () => {
        beforeEach(() => {
            widget.createZoomControls();
        });

        test("lays out instrument, zoom, spacing, eye dropper and background", () => {
            const text = widget.zoomControls.textContent;
            ["Instrument:", "Zoom:", "Column Spacing:", "Eye Dropper:", "Background:"].forEach(
                label => expect(text).toContain(label)
            );
            expect(widget.zoomControls.textContent.match(/\|/g)).toHaveLength(3);
            expect(widget.instrumentButton.textContent).toBe("Electronic synth");
            expect(widget.backgroundColorDisplay.textContent).toBe("green");
        });

        test("the zoom buttons step the slider and stay inside its range", () => {
            widget._handleZoom = jest.fn();
            widget._adjustZoom(0.01);
            expect(parseFloat(widget.zoomSlider.value)).toBe(1.01);

            widget.zoomSlider.value = "2.995";
            widget._adjustZoom(0.01);
            expect(parseFloat(widget.zoomSlider.value)).toBe(3);
            expect(widget._handleZoom).toHaveBeenCalledTimes(2);
        });

        test("the spacing buttons step by 5px and stay inside 2 to 200", () => {
            widget._adjustVerticalSpacing(5);
            expect(widget.verticalSpacing).toBe(55);
            expect(widget.spacingValue.textContent).toBe("55px");

            widget.spacingSlider.value = "3";
            widget._adjustVerticalSpacing(-5);
            expect(widget.verticalSpacing).toBe(2);
        });

        test("zooming scales the image and redraws the grid shortly after", () => {
            widget._drawGridLines = jest.fn();
            widget.imageWrapper = document.createElement("div");
            widget.zoomSlider.value = "1.5";

            widget._handleZoom();

            expect(widget.imageWrapper.style.transform).toBe("scale(1.5)");
            expect(widget.zoomValue.textContent).toBe("150%");
            expect(widget._drawGridLines).not.toHaveBeenCalled();
            jest.advanceTimersByTime(50);
            expect(widget._drawGridLines).toHaveBeenCalledTimes(1);
        });

        test("zooming without an image changes nothing", () => {
            widget.zoomSlider.value = "2";
            widget._handleZoom();
            expect(widget.currentZoom).toBe(1);
        });

        test("_showZoomControls resets zoom and shows the current spacing", () => {
            widget.verticalSpacing = 80;
            widget.zoomSlider.value = "2";
            widget._showZoomControls();
            expect(widget.zoomSlider.value).toBe("1");
            expect(widget.zoomValue.textContent).toBe("100%");
            expect(widget.spacingValue.textContent).toBe("80px");
        });
    });

    describe("_drawGridLines", () => {
        beforeEach(() => {
            widget.rowHeaderTable = document.createElement("table");
            widget.rowHeaderTable.insertRow();
            widget.gridOverlay = document.createElement("div");
            widget.gridOverlay.getBoundingClientRect = () => ({ width: 200 });
            widget.matrixData.rows = [{}, {}, {}];
            widget.verticalSpacing = 50;
        });

        test("draws a red line under each row and a blue line per column", () => {
            widget._drawGridLines();

            const lines = Array.from(widget.gridOverlay.children);
            const red = lines.filter(line => line.style.backgroundColor === "red");
            const blue = lines.filter(line => line.style.backgroundColor === "blue");
            expect(red.map(line => line.style.top)).toEqual(["40px", "80px", "120px"]);
            expect(blue.map(line => line.style.left)).toEqual(["50px", "100px", "150px", "200px"]);
        });

        test("keeps the scanning lines of a running playback", () => {
            const scanLine = document.createElement("div");
            widget.scanningLines = [{ element: scanLine }];
            widget._drawGridLines();
            expect(widget.gridOverlay.contains(scanLine)).toBe(true);
        });

        test("waits until the row headers exist", () => {
            widget.rowHeaderTable = document.createElement("table");
            widget._drawGridLines();
            expect(widget.gridOverlay.children).toHaveLength(0);
        });
    });

    test("_initializeMatrix draws a labelled row per matrix row", () => {
        widget.matrixTable = document.createElement("table");
        widget._initializeMatrix();
        expect(widget.matrixTable.rows).toHaveLength(widget.matrixData.rows.length);
        expect(widget.matrixTable.rows[0].cells[0].style.height).toBe(LegoWidget.ROW_HEIGHT + "px");
    });

    test("_scale redraws the grid once the window has resized", () => {
        widget._drawGridLines = jest.fn();
        widget._scale();
        jest.advanceTimersByTime(299);
        expect(widget._drawGridLines).not.toHaveBeenCalled();
        jest.advanceTimersByTime(1);
        expect(widget._drawGridLines).toHaveBeenCalledTimes(1);
    });
});
