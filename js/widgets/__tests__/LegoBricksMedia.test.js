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
const LegoBricksMedia = global.LegoBricksMedia;
const METHODS = [
    "_uploadImage",
    "_handleImageUpload",
    "_startWebcam",
    "_stopWebcam",
    "_cleanupDragListeners",
    "_buildOffscreenCanvas",
    "_activateMediaDisplay",
    "_makeImageDraggable"
];

const makeStream = () => {
    const track = { stop: jest.fn() };
    return { track, stream: { getTracks: () => [track] } };
};

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe("LegoBricksMedia", () => {
    let widget;

    beforeEach(() => {
        global._ = text => text;
        widget = new LegoWidget();
        widget.activity = { textMsg: jest.fn() };
        widget.imageDisplayArea = document.createElement("div");
    });

    afterEach(() => {
        delete global._;
        delete navigator.mediaDevices;
        widget._cleanupDragListeners();
        jest.restoreAllMocks();
    });

    test("holds exactly the methods moved out of LegoWidget", () => {
        const target = {};
        LegoBricksMedia.call(target);
        expect(Object.keys(target).sort()).toEqual([...METHODS].sort());
    });

    test("installModules sets the same methods on each widget instance", () => {
        const target = {};
        LegoBricksMedia.call(target);
        for (const name of METHODS) {
            expect(Object.prototype.hasOwnProperty.call(widget, name)).toBe(true);
            expect(widget[name].toString()).toBe(target[name].toString());
        }
    });

    test("_uploadImage opens the file picker", () => {
        widget._fileInput = { click: jest.fn() };
        widget._uploadImage();
        expect(widget._fileInput.click).toHaveBeenCalledTimes(1);
    });

    describe("_handleImageUpload", () => {
        let readerInstance;

        beforeEach(() => {
            readerInstance = null;
            jest.spyOn(global, "FileReader").mockImplementation(function () {
                this.readAsDataURL = jest.fn();
                readerInstance = this;
            });
            widget._activateMediaDisplay = jest.fn();
        });

        test("ignores a file that is not an image", () => {
            widget._handleImageUpload({ target: { files: [{ type: "text/plain" }] } });
            expect(readerInstance).toBeNull();
        });

        test("ignores an empty selection", () => {
            widget._handleImageUpload({ target: { files: [] } });
            expect(readerInstance).toBeNull();
        });

        test("shows the image in a new wrapper once it is read", () => {
            const file = { type: "image/png" };
            widget._handleImageUpload({ target: { files: [file] } });
            expect(readerInstance.readAsDataURL).toHaveBeenCalledWith(file);

            readerInstance.onload({ target: { result: "data:image/png;base64,AAAA" } });

            const img = widget.imageDisplayArea.querySelector("img");
            expect(img).not.toBeNull();
            expect(img.src).toBe("data:image/png;base64,AAAA");
            expect(widget.imageWrapper.contains(img)).toBe(true);
            expect(widget._activateMediaDisplay).toHaveBeenCalledTimes(1);
            expect(widget.activity.textMsg).toHaveBeenCalledWith("Image uploaded successfully");
        });

        test("releases a running webcam when an image replaces it", () => {
            const { track, stream } = makeStream();
            widget.webcamVideo = document.createElement("video");
            widget.webcamVideo.srcObject = stream;

            widget._handleImageUpload({ target: { files: [{ type: "image/png" }] } });
            readerInstance.onload({ target: { result: "data:image/png;base64,AAAA" } });

            expect(track.stop).toHaveBeenCalledTimes(1);
            expect(widget.webcamVideo).toBeNull();
        });
    });

    describe("_startWebcam", () => {
        beforeEach(() => {
            widget._activateMediaDisplay = jest.fn();
        });

        test("shows the stream and a capture button once the camera opens", async () => {
            const { stream } = makeStream();
            navigator.mediaDevices = { getUserMedia: jest.fn().mockResolvedValue(stream) };

            widget._startWebcam();
            await flushPromises();

            expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ video: true });
            expect(widget.webcamVideo.srcObject).toBe(stream);
            expect(widget.imageWrapper.querySelector("button").textContent).toBe(" Capture");
            expect(widget._activateMediaDisplay).toHaveBeenCalledTimes(1);
            expect(widget.activity.textMsg).toHaveBeenCalledWith("Webcam started");
        });

        test("reports a denied camera", async () => {
            navigator.mediaDevices = {
                getUserMedia: jest.fn().mockRejectedValue(new Error("Permission denied"))
            };

            widget._startWebcam();
            await flushPromises();

            expect(widget.activity.textMsg).toHaveBeenCalledWith(
                "Webcam access denied: Permission denied"
            );
        });

        test("stops the previous stream when the webcam is started again", async () => {
            const first = makeStream();
            const second = makeStream();
            navigator.mediaDevices = {
                getUserMedia: jest
                    .fn()
                    .mockResolvedValueOnce(first.stream)
                    .mockResolvedValueOnce(second.stream)
            };

            widget._startWebcam();
            await flushPromises();
            widget._startWebcam();
            await flushPromises();

            expect(first.track.stop).toHaveBeenCalledTimes(1);
            expect(second.track.stop).not.toHaveBeenCalled();
            expect(widget.webcamVideo.srcObject).toBe(second.stream);
        });

        test("stops a stream that arrives after the widget was closed", async () => {
            const { track, stream } = makeStream();
            let resolveStream;
            navigator.mediaDevices = {
                getUserMedia: jest.fn(
                    () =>
                        new Promise(resolve => {
                            resolveStream = resolve;
                        })
                )
            };

            widget._startWebcam();
            // onclose clears the video element while the permission prompt is still open.
            widget.webcamVideo = null;
            resolveStream(stream);
            await flushPromises();

            expect(track.stop).toHaveBeenCalledTimes(1);
            expect(widget._activateMediaDisplay).not.toHaveBeenCalled();
            expect(widget.activity.textMsg).not.toHaveBeenCalledWith("Webcam started");
        });

        test("capture freezes the frame as an image and stops the camera", async () => {
            const { track, stream } = makeStream();
            navigator.mediaDevices = { getUserMedia: jest.fn().mockResolvedValue(stream) };
            jest.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
                "data:image/png;base64,BBBB"
            );

            widget._startWebcam();
            await flushPromises();
            widget.imageWrapper.querySelector("button").onclick();

            expect(track.stop).toHaveBeenCalledTimes(1);
            const img = widget.imageWrapper.querySelector("img");
            expect(img.src).toBe("data:image/png;base64,BBBB");
            expect(widget.imageWrapper.querySelector("video")).toBeNull();
            expect(widget.imageWrapper.querySelector("button")).toBeNull();
            expect(widget.activity.textMsg).toHaveBeenCalledWith("Photo captured");
        });
    });

    test("_stopWebcam stops every track and detaches the stream", () => {
        const { track, stream } = makeStream();
        widget.webcamVideo = document.createElement("video");
        widget.webcamVideo.srcObject = stream;

        widget._stopWebcam();

        expect(track.stop).toHaveBeenCalledTimes(1);
        expect(widget.webcamVideo.srcObject).toBeNull();
        expect(() => widget._stopWebcam()).not.toThrow();
    });

    describe("_buildOffscreenCanvas", () => {
        test("clears the cache when there is no media", () => {
            widget._offscreenCanvas = {};
            widget.imageWrapper = document.createElement("div");
            widget._buildOffscreenCanvas();
            expect(widget._offscreenCanvas).toBeNull();
            expect(widget._offscreenMediaElement).toBeNull();
        });

        test("waits for the image when its size is not known yet", () => {
            widget.imageWrapper = document.createElement("div");
            widget.imageWrapper.appendChild(document.createElement("img"));
            widget._buildOffscreenCanvas();
            expect(widget._offscreenCanvas).toBeNull();
        });

        test("draws a static image once at its natural size", () => {
            widget.imageWrapper = document.createElement("div");
            const img = document.createElement("img");
            Object.defineProperty(img, "naturalWidth", { value: 40 });
            Object.defineProperty(img, "naturalHeight", { value: 30 });
            widget.imageWrapper.appendChild(img);

            widget._buildOffscreenCanvas();

            expect(widget._offscreenCanvas.width).toBe(40);
            expect(widget._offscreenCanvas.height).toBe(30);
            expect(widget._offscreenIsVideo).toBe(false);
            expect(widget._offscreenMediaElement).toBe(img);
            expect(widget._offscreenCtx.drawImage).toHaveBeenCalledWith(img, 0, 0, 40, 30);
        });

        test("only sizes the canvas for a video, frames are drawn while scanning", () => {
            widget.imageWrapper = document.createElement("div");
            const video = document.createElement("video");
            Object.defineProperty(video, "videoWidth", { value: 64 });
            Object.defineProperty(video, "videoHeight", { value: 48 });
            widget.imageWrapper.appendChild(video);
            const ctx = HTMLCanvasElement.prototype.getContext("2d");
            ctx.drawImage.mockClear();

            widget._buildOffscreenCanvas();

            expect(widget._offscreenCanvas.width).toBe(64);
            expect(widget._offscreenIsVideo).toBe(true);
            expect(ctx.drawImage).not.toHaveBeenCalled();
        });

        test("gives up on an image that cannot be drawn", () => {
            jest.spyOn(console, "warn").mockImplementation(() => {});
            widget.imageWrapper = document.createElement("div");
            const img = document.createElement("img");
            Object.defineProperty(img, "naturalWidth", { value: 10 });
            Object.defineProperty(img, "naturalHeight", { value: 10 });
            widget.imageWrapper.appendChild(img);
            const ctx = HTMLCanvasElement.prototype.getContext("2d");
            ctx.drawImage.mockImplementationOnce(() => {
                throw new Error("broken image");
            });

            widget._buildOffscreenCanvas();

            expect(widget._offscreenCanvas).toBeNull();
            expect(console.warn).toHaveBeenCalled();
        });
    });

    test("_activateMediaDisplay wires dragging, zoom, the grid and the sampling canvas", () => {
        widget.imageWrapper = document.createElement("div");
        widget._makeImageDraggable = jest.fn();
        widget._showZoomControls = jest.fn();
        widget._drawGridLines = jest.fn();
        widget._buildOffscreenCanvas = jest.fn();

        widget._activateMediaDisplay();

        expect(widget._makeImageDraggable).toHaveBeenCalledWith(widget.imageWrapper);
        expect(widget._showZoomControls).toHaveBeenCalled();
        expect(widget._drawGridLines).toHaveBeenCalled();
        expect(widget._buildOffscreenCanvas).toHaveBeenCalled();
    });

    describe("_makeImageDraggable", () => {
        test("moves the wrapper by the distance the mouse travels", () => {
            const wrapper = LegoWidget.createImageWrapper();
            widget._makeImageDraggable(wrapper);

            wrapper.onmousedown({ clientX: 10, clientY: 20, preventDefault: jest.fn() });
            expect(wrapper.style.cursor).toBe("grabbing");

            document.dispatchEvent(new MouseEvent("mousemove", { clientX: 35, clientY: 5 }));
            expect(wrapper.style.left).toBe("25px");
            expect(wrapper.style.top).toBe("-15px");

            document.dispatchEvent(new MouseEvent("mouseup"));
            expect(wrapper.style.cursor).toBe("grab");

            document.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 100 }));
            expect(wrapper.style.left).toBe("25px");
        });

        test("replaces the document listeners instead of adding more", () => {
            const removeSpy = jest.spyOn(document, "removeEventListener");
            const wrapper = LegoWidget.createImageWrapper();

            widget._makeImageDraggable(wrapper);
            const firstMove = widget._dragMoveHandler;
            widget._makeImageDraggable(wrapper);

            expect(removeSpy).toHaveBeenCalledWith("mousemove", firstMove);
            expect(widget._dragMoveHandler).not.toBe(firstMove);
        });

        test("_cleanupDragListeners drops both handlers", () => {
            widget._makeImageDraggable(LegoWidget.createImageWrapper());
            widget._cleanupDragListeners();
            expect(widget._dragMoveHandler).toBeNull();
            expect(widget._dragUpHandler).toBeNull();
        });
    });
});
