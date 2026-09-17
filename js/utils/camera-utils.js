// Copyright (c) 2026 Music Blocks contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// Camera functionality module
// Encapsulates camera-related operations for video/image capture.
// All interval/listener lifecycle state lives here (not in doUseCamera's
// closures) so that repeated doUseCamera(...) calls can never accumulate
// more than one active interval or one active canplay listener.
const CameraManager = {
    isSetup: false,
    canPlayHandler: null,
    intervalId: null,
    // Tracks the exact element a listener was attached to, so cleanup always
    // targets the right node even if #camVideo is ever replaced in the DOM.
    listenerVideoElement: null,
    _generationToken: 0,
    _pendingRequest: false,

    /**
     * Starts the capture interval if one isn't already running. Idempotent:
     * if a capture interval is already active, this is a no-op that returns
     * the existing interval id, rather than clearing and restarting it.
     *
     * This matters when doUseCamera is invoked rapidly and repeatedly (e.g.
     * from inside a "forever" loop): clearing and restarting the interval on
     * every call would cancel it before it ever gets a chance to fire,
     * meaning draw() would never run and no frame would ever be captured.
     * @param {function} draw - callback invoked on each tick
     * @param {number} periodMs - interval period in milliseconds
     * @returns {number} the active interval id
     */
    startCapture(draw, periodMs = 100) {
        if (this.intervalId !== null) {
            return this.intervalId;
        }
        this.intervalId = window.setInterval(draw, periodMs);
        return this.intervalId;
    },

    /**
     * Stops the capture interval if one is running. Safe to call when no
     * interval is active (idempotent).
     */
    stopCapture() {
        if (this.intervalId !== null) {
            window.clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },

    /**
     * Attaches a canplay handler to a video element, first removing any
     * previously attached handler (from this element or a prior one).
     * Idempotent: calling this repeatedly never leaves more than one
     * listener registered.
     * @param {HTMLVideoElement} video
     * @param {function} handler
     */
    setCanplayListener(video, handler) {
        this.clearCanplayListener();
        video.addEventListener("canplay", handler, false);
        this.canPlayHandler = handler;
        this.listenerVideoElement = video;
    },

    /**
     * Removes the currently tracked canplay handler from the element it was
     * actually attached to. Safe to call when no listener is active.
     */
    clearCanplayListener() {
        if (this.canPlayHandler && this.listenerVideoElement) {
            this.listenerVideoElement.removeEventListener("canplay", this.canPlayHandler, false);
        }
        this.canPlayHandler = null;
        this.listenerVideoElement = null;
    },

    /**
     * Resets the camera setup state and tears down any active interval or
     * listener. Called on doStopVideoCam so a Stop always returns to a
     * clean slate before the next Camera/Video block run.
     */
    reset() {
        this.isSetup = false;
        this.stopCapture();
        this.clearCanplayListener();
        this._generationToken++;
        this._pendingRequest = false;
    }
};

/**
 * Uses the camera to capture images or video frames and displays them on the turtle's canvas.
 * @param {Array} args - Arguments passed to the function.
 * @param {object} turtles - The turtles object.
 * @param {string} turtle - The name of the turtle.
 * @param {boolean} isVideo - Indicates whether to capture video frames.
 * @param {number} cameraID - The ID of the camera interval for video frames.
 * @param {function} setCameraID - Function to set the camera interval ID.
 * @param {function} errorMsg - Function to display error messages.
 */
let doUseCamera = (args, turtles, turtle, isVideo, cameraID, setCameraID, errorMsg) => {
    const w = 320;
    const h = 240;

    let streaming = false;
    const video = document.querySelector("#camVideo");
    const canvas = document.querySelector("#camCanvas");
    const context = canvas.getContext("2d");

    if (canvas.width !== w) {
        canvas.width = w;
    }
    if (canvas.height !== h) {
        canvas.height = h;
    }

    /**
     * Draws the current video frame onto the canvas, converts it to a data URL,
     * and sends it to the turtle.
     */
    function draw() {
        context.drawImage(video, 0, 0, w, h);
        const data = canvas.toDataURL("image/png");
        turtles.getTurtle(turtle).doShowImage(args[0], data);
    }

    /**
     * Starts the continuous video capture interval or draws a single still image.
     */
    function startCaptureOrDraw() {
        if (isVideo) {
            cameraID = CameraManager.startCapture(draw, 100);
            setCameraID(cameraID);
        } else {
            draw();
        }
    }

    if (!CameraManager.isSetup) {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            errorMsg("Your browser does not support the webcam");
            return;
        }

        if (CameraManager._pendingRequest) {
            return;
        }

        CameraManager._pendingRequest = true;
        const currentToken = ++CameraManager._generationToken;

        navigator.mediaDevices
            .getUserMedia({ video: true, audio: false })
            .then(stream => {
                if (currentToken !== CameraManager._generationToken) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }
                CameraManager._pendingRequest = false;
                video.srcObject = stream;
                video.play();
                CameraManager.isSetup = true;
            })
            .catch(error => {
                if (currentToken !== CameraManager._generationToken) {
                    return;
                }
                CameraManager._pendingRequest = false;
                errorMsg("Could not connect to camera");
                console.debug(error);
            });
    } else {
        streaming = true;
        video.play();
        startCaptureOrDraw();
    }

    /**
     * Handles the video 'canplay' event by initializing canvas dimensions
     * and starting the capture process.
     */
    function handleCanPlay() {
        if (!streaming) {
            video.setAttribute("width", w);
            video.setAttribute("height", h);
            canvas.setAttribute("width", w);
            canvas.setAttribute("height", h);
            streaming = true;
            startCaptureOrDraw();
        }
    }

    CameraManager.setCanplayListener(video, handleCanPlay);
};

/**
 * Stops the camera and clears the camera interval.
 * @param {number} cameraID - The ID of the camera interval.
 * @param {function} setCameraID - Function to set the camera interval ID.
 */
function doStopVideoCam(cameraID, setCameraID) {
    if (cameraID !== null) {
        window.clearInterval(cameraID);
    }

    setCameraID(null);
    const video = document.querySelector("#camVideo");
    if (video) {
        video.pause();
        if (video.srcObject) {
            const tracks = video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            video.srcObject = null;
        }
    }

    CameraManager.reset();
}

const CameraUtils = {
    CameraManager,
    doUseCamera,
    doStopVideoCam
};

// Preserve the browser global unconditionally, as MediaBlocks.js may invoke
// doUseCamera/doStopVideoCam via the old window.CameraUtils global logic
// before it's fully migrated to dependency injection.
if (typeof window !== "undefined") {
    window.CameraUtils = CameraUtils;
}

if (typeof define === "function" && define.amd) {
    define([], function () {
        return CameraUtils;
    });
} else if (typeof module !== "undefined" && module.exports) {
    module.exports = CameraUtils;
}
