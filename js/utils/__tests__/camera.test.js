/**
 * @license
 * MusicBlocks v3.4.1
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const { doUseCamera, doStopVideoCam, CameraManager } = require("../utils.js");

/**
 * Builds a minimal fake <video>/<canvas> pair and wires document.querySelector
 * to return them, mirroring the #camVideo / #camCanvas elements the real app
 * renders.
 */
function makeDom() {
    const video = {
        play: jest.fn(),
        pause: jest.fn(),
        srcObject: null,
        setAttribute: jest.fn(),
        _listeners: {},
        addEventListener(type, handler) {
            this._listeners[type] = handler;
        },
        removeEventListener(type, handler) {
            if (this._listeners[type] === handler) {
                delete this._listeners[type];
            }
        },
        fireCanplay() {
            if (this._listeners.canplay) {
                this._listeners.canplay();
            }
        }
    };

    const context = { drawImage: jest.fn() };
    const canvas = {
        width: 0,
        height: 0,
        setAttribute: jest.fn(),
        getContext: jest.fn(() => context),
        toDataURL: jest.fn(() => "data:image/png;base64,FAKE")
    };

    document.querySelector = jest.fn(selector => {
        if (selector === "#camVideo") return video;
        if (selector === "#camCanvas") return canvas;
        return null;
    });

    return { video, canvas, context };
}

function makeTurtles() {
    const doShowImage = jest.fn();
    const turtle = { doShowImage };
    return {
        turtles: { getTurtle: jest.fn(() => turtle) },
        doShowImage
    };
}

describe("CameraManager lifecycle", () => {
    let intervalSpy;
    let clearIntervalSpy;
    let fakeId = 1;

    beforeEach(() => {
        // Reset shared singleton state between tests.
        CameraManager.isSetup = false;
        CameraManager.canPlayHandler = null;
        CameraManager.intervalId = null;
        CameraManager.listenerVideoElement = null;

        fakeId = 1;
        intervalSpy = jest.spyOn(window, "setInterval").mockImplementation(() => fakeId++);
        clearIntervalSpy = jest.spyOn(window, "clearInterval").mockImplementation(() => {});

        navigator.mediaDevices = {
            getUserMedia: jest.fn(() => Promise.resolve({ getTracks: () => [] }))
        };
    });

    afterEach(() => {
        intervalSpy.mockRestore();
        clearIntervalSpy.mockRestore();
        jest.restoreAllMocks();
    });

    test("startCapture never leaves more than one interval running", () => {
        const draw = jest.fn();
        const first = CameraManager.startCapture(draw, 100);
        const second = CameraManager.startCapture(draw, 100);

        // Idempotent: the second call must NOT clear/restart the interval
        // that's already running, or a fast, repeated caller (like a
        // "forever" loop) could cancel it before it ever fires.
        expect(clearIntervalSpy).not.toHaveBeenCalled();
        expect(second).toBe(first);
        expect(CameraManager.intervalId).toBe(first);
        expect(intervalSpy).toHaveBeenCalledTimes(1);
    });

    test("startCapture called rapidly and repeatedly (simulating a forever loop) never prevents the interval from firing", () => {
        // Use REAL timers here so we can assert the interval genuinely fires,
        // which is exactly what broke when startCapture unconditionally
        // cleared and restarted itself on every call.
        jest.restoreAllMocks();
        jest.useRealTimers();

        const draw = jest.fn();

        // Simulate a forever loop calling startCapture much faster than
        // the 20ms period below.
        const rapidCalls = setInterval(() => {
            CameraManager.startCapture(draw, 20);
        }, 2);

        return new Promise(resolve => {
            setTimeout(() => {
                clearInterval(rapidCalls);
                CameraManager.stopCapture();
                expect(draw.mock.calls.length).toBeGreaterThan(0);
                resolve();
            }, 100);
        });
    });

    test("stopCapture is idempotent (safe with no interval active)", () => {
        expect(() => CameraManager.stopCapture()).not.toThrow();
        expect(clearIntervalSpy).not.toHaveBeenCalled();

        CameraManager.startCapture(jest.fn());
        CameraManager.stopCapture();
        expect(CameraManager.intervalId).toBeNull();

        // Calling again after already stopped must not throw or re-clear.
        clearIntervalSpy.mockClear();
        CameraManager.stopCapture();
        expect(clearIntervalSpy).not.toHaveBeenCalled();
    });

    test("setCanplayListener never leaves more than one listener registered", () => {
        const { video } = makeDom();
        const handlerA = jest.fn();
        const handlerB = jest.fn();

        CameraManager.setCanplayListener(video, handlerA);
        expect(video._listeners.canplay).toBe(handlerA);

        CameraManager.setCanplayListener(video, handlerB);
        expect(video._listeners.canplay).toBe(handlerB);

        video.fireCanplay();
        expect(handlerA).not.toHaveBeenCalled();
        expect(handlerB).toHaveBeenCalledTimes(1);
    });

    test("clearCanplayListener removes the handler from the element it was actually attached to", () => {
        const { video: firstVideo } = makeDom();
        const secondVideo = { ...firstVideo, _listeners: {} };
        const handler = jest.fn();

        CameraManager.setCanplayListener(firstVideo, handler);
        // Simulate the DOM element being swapped out from under us.
        CameraManager.listenerVideoElement = secondVideo;
        CameraManager.canPlayHandler = handler;
        secondVideo.addEventListener("canplay", handler);

        CameraManager.clearCanplayListener();

        expect(secondVideo._listeners.canplay).toBeUndefined();
        expect(CameraManager.canPlayHandler).toBeNull();
        expect(CameraManager.listenerVideoElement).toBeNull();
    });

    test("reset() tears down both the interval and the listener", () => {
        const { video } = makeDom();
        CameraManager.startCapture(jest.fn());
        CameraManager.setCanplayListener(video, jest.fn());

        CameraManager.reset();

        expect(CameraManager.isSetup).toBe(false);
        expect(CameraManager.intervalId).toBeNull();
        expect(CameraManager.canPlayHandler).toBeNull();
        expect(video._listeners.canplay).toBeUndefined();
    });
});

describe("doUseCamera", () => {
    let dom;
    let turtlesCtx;
    let setCameraID;
    let errorMsg;

    beforeEach(() => {
        CameraManager.isSetup = false;
        CameraManager.canPlayHandler = null;
        CameraManager.intervalId = null;
        CameraManager.listenerVideoElement = null;

        dom = makeDom();
        turtlesCtx = makeTurtles();
        setCameraID = jest.fn();
        errorMsg = jest.fn();

        jest.spyOn(window, "setInterval").mockImplementation(() => 42);
        jest.spyOn(window, "clearInterval").mockImplementation(() => {});

        navigator.mediaDevices = {
            getUserMedia: jest.fn(() => Promise.resolve({ getTracks: () => [] }))
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("Camera + Show (isVideo=false): first run draws exactly once, after getUserMedia resolves and canplay fires", async () => {
        doUseCamera(["turtle0"], turtlesCtx.turtles, "turtle0", false, null, setCameraID, errorMsg);

        // Not drawn yet: still waiting on getUserMedia + canplay.
        expect(turtlesCtx.doShowImage).not.toHaveBeenCalled();

        await Promise.resolve(); // flush getUserMedia .then()
        expect(CameraManager.isSetup).toBe(true);

        dom.video.fireCanplay();

        expect(dom.context.drawImage).toHaveBeenCalledTimes(1);
        expect(turtlesCtx.doShowImage).toHaveBeenCalledTimes(1);
        expect(turtlesCtx.doShowImage).toHaveBeenCalledWith(
            "turtle0",
            "data:image/png;base64,FAKE"
        );
        // Photo path must never start an interval.
        expect(setCameraID).not.toHaveBeenCalled();
    });

    test("Camera + Show (isVideo=false): repeated calls after setup draw immediately, no duplicate listeners", async () => {
        doUseCamera(["t"], turtlesCtx.turtles, "t", false, null, setCameraID, errorMsg);
        await Promise.resolve();
        dom.video.fireCanplay();
        expect(turtlesCtx.doShowImage).toHaveBeenCalledTimes(1);

        // Second run of the Camera+Show block, without reloading the page.
        doUseCamera(["t"], turtlesCtx.turtles, "t", false, null, setCameraID, errorMsg);
        expect(turtlesCtx.doShowImage).toHaveBeenCalledTimes(2);

        // Only one canplay listener should ever be live at a time.
        const handlerCount = Object.keys(dom.video._listeners).length;
        expect(handlerCount).toBe(1);
    });

    test("Video capture (isVideo=true): repeated calls reuse the existing interval instead of restarting it", async () => {
        doUseCamera(["t"], turtlesCtx.turtles, "t", true, null, setCameraID, errorMsg);
        await Promise.resolve();
        dom.video.fireCanplay();
        expect(setCameraID).toHaveBeenCalledTimes(1);
        const firstId = setCameraID.mock.calls[0][0];

        // A second call in quick succession (as a "forever" loop would do)
        // must NOT clear the running interval - only reuse/report it -
        // otherwise the interval could be cancelled before it ever fires.
        doUseCamera(["t"], turtlesCtx.turtles, "t", true, null, setCameraID, errorMsg);
        expect(window.clearInterval).not.toHaveBeenCalled();
        expect(setCameraID).toHaveBeenCalledTimes(2);
        expect(setCameraID.mock.calls[1][0]).toBe(firstId);
    });

    test("browser without getUserMedia support reports an error and does not throw", () => {
        navigator.mediaDevices = undefined;
        expect(() =>
            doUseCamera(["t"], turtlesCtx.turtles, "t", false, null, setCameraID, errorMsg)
        ).not.toThrow();
        expect(errorMsg).toHaveBeenCalledWith("Your browser does not support the webcam");
    });
});

describe("doStopVideoCam", () => {
    beforeEach(() => {
        CameraManager.isSetup = true;
        CameraManager.canPlayHandler = null;
        CameraManager.intervalId = null;
        CameraManager.listenerVideoElement = null;
        jest.spyOn(window, "clearInterval").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("stops the interval, tears down the stream, and resets CameraManager", () => {
        const track = { stop: jest.fn() };
        const video = {
            pause: jest.fn(),
            srcObject: { getTracks: () => [track] }
        };
        document.querySelector = jest.fn(() => video);
        const setCameraID = jest.fn();

        doStopVideoCam(99, setCameraID);

        expect(window.clearInterval).toHaveBeenCalledWith(99);
        expect(setCameraID).toHaveBeenCalledWith(null);
        expect(video.pause).toHaveBeenCalled();
        expect(track.stop).toHaveBeenCalled();
        expect(video.srcObject).toBeNull();
        expect(CameraManager.isSetup).toBe(false);
    });

    test("a Stop followed by a fresh Camera+Show run behaves like a first run again", async () => {
        const dom = makeDom();
        const turtlesCtx = makeTurtles();
        jest.spyOn(window, "setInterval").mockImplementation(() => 7);
        navigator.mediaDevices = {
            getUserMedia: jest.fn(() => Promise.resolve({ getTracks: () => [] }))
        };

        doUseCamera(["t"], turtlesCtx.turtles, "t", false, null, jest.fn(), jest.fn());
        await Promise.resolve();
        dom.video.fireCanplay();
        expect(turtlesCtx.doShowImage).toHaveBeenCalledTimes(1);

        document.querySelector = jest.fn(selector =>
            selector === "#camVideo" ? { pause: jest.fn(), srcObject: null } : null
        );
        doStopVideoCam(7, jest.fn());
        expect(CameraManager.isSetup).toBe(false);

        // Re-wire the DOM for the next run, exactly like a fresh Camera+Show.
        document.querySelector =
            dom.video &&
            jest.fn(selector => {
                if (selector === "#camVideo") return dom.video;
                if (selector === "#camCanvas") return dom.canvas;
                return null;
            });
        doUseCamera(["t"], turtlesCtx.turtles, "t", false, null, jest.fn(), jest.fn());
        await Promise.resolve();
        dom.video.fireCanplay();
        expect(turtlesCtx.doShowImage).toHaveBeenCalledTimes(2);
    });
});
