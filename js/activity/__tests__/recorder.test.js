describe("recorder", () => {
    let mockStart;
    let mockStream;
    let mockTrack;
    let mockLink;
    let lastRecorderInstance;
    let originalMediaDevices;
    let originalURL;
    let originalRequestAnimationFrame;
    let originalCancelAnimationFrame;

    const makeTrack = () => {
        const listeners = {};
        return {
            addEventListener: jest.fn((event, handler) => {
                listeners[event] = handler;
            }),
            emit: event => listeners[event](),
            stop: jest.fn()
        };
    };

    const makeStream = tracks => ({
        addTrack: jest.fn(track => tracks.push(track)),
        getTracks: jest.fn(() => tracks),
        oninactive: null
    });

    const makeActivity = tone => ({
        textMsg: jest.fn(),
        canvas: { height: 600 },
        _onResize: jest.fn(),
        logo: { synth: { tone } }
    });

    const startRecording = async activity => {
        const { doRecordButton, setupActivityRecorder } = require("../recorder");
        setupActivityRecorder(activity);
        doRecordButton(activity);
        await mockStart._recordHandler();
    };

    const stopRecording = () => {
        const clickHandlers = mockStart.addEventListener.mock.calls.filter(
            call => call[0] === "click"
        );
        clickHandlers[clickHandlers.length - 1][1]();
    };

    beforeEach(() => {
        jest.useFakeTimers();
        jest.resetModules();

        global.debugLog = jest.fn();
        global.ErrorHandler = { recoverable: jest.fn(), capture: jest.fn() };
        global._ = jest.fn(s => s);
        global.console.warn = jest.fn();

        mockStart = {
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
            classList: { add: jest.fn(), remove: jest.fn() },
            _recordHandler: null
        };
        mockTrack = makeTrack();
        mockStream = makeStream([mockTrack]);
        mockLink = { href: "", download: "", click: jest.fn() };

        jest.spyOn(document, "getElementById").mockImplementation(id => {
            if (id === "record") return mockStart;
            return null;
        });
        jest.spyOn(document, "createElement").mockImplementation(tag => {
            if (tag === "a") return mockLink;
            return {};
        });
        jest.spyOn(document.body, "appendChild").mockImplementation(jest.fn());
        jest.spyOn(document.body, "removeChild").mockImplementation(jest.fn());

        window.MBDialog = { alert: jest.fn() };
        jest.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
        originalMediaDevices = Object.getOwnPropertyDescriptor(navigator, "mediaDevices");
        Object.defineProperty(navigator, "mediaDevices", {
            configurable: true,
            value: { getDisplayMedia: jest.fn().mockResolvedValue(mockStream) }
        });

        originalURL = global.URL;
        global.URL = {
            createObjectURL: jest.fn(() => "blob:mock-url"),
            revokeObjectURL: jest.fn()
        };
        originalRequestAnimationFrame = global.requestAnimationFrame;
        originalCancelAnimationFrame = global.cancelAnimationFrame;
        global.requestAnimationFrame = jest.fn(() => 42);
        global.cancelAnimationFrame = jest.fn();
        global.Blob = class MockBlob {
            constructor(parts, options) {
                this.parts = parts;
                this.size = parts.reduce((total, part) => total + (part.size || 0), 0);
                this.type = options.type;
            }
        };
        lastRecorderInstance = null;
        global.MediaRecorder = class MockMediaRecorder {
            constructor(stream) {
                this.stream = stream;
                this.state = "inactive";
                this.ondataavailable = null;
                this.onstop = null;
                lastRecorderInstance = this;
            }
            start = jest.fn(() => {
                this.state = "recording";
            });
            stop = jest.fn(() => {
                this.state = "inactive";
                this.onstop();
            });
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
        jest.useRealTimers();
        if (originalMediaDevices) {
            Object.defineProperty(navigator, "mediaDevices", originalMediaDevices);
        } else {
            delete navigator.mediaDevices;
        }
        global.URL = originalURL;
        global.requestAnimationFrame = originalRequestAnimationFrame;
        global.cancelAnimationFrame = originalCancelAnimationFrame;
        delete window.MBDialog;
        delete global.debugLog;
        delete global.ErrorHandler;
        delete global._;
        delete global.Blob;
        delete global.MediaRecorder;
    });

    describe("doRecordButton", () => {
        it("calls activity._doRecordButton when valid", () => {
            const { doRecordButton } = require("../recorder");
            const activity = { _doRecordButton: jest.fn() };

            doRecordButton(activity);

            expect(activity._doRecordButton).toHaveBeenCalledTimes(1);
        });

        it("guards against re-entrant calls via isExecuting flag", () => {
            const { doRecordButton } = require("../recorder");
            const activity = { _doRecordButton: jest.fn() };

            doRecordButton(activity);
            doRecordButton(activity);

            expect(activity._doRecordButton).toHaveBeenCalledTimes(1);
        });

        it("does nothing with an invalid activity context", () => {
            const { doRecordButton } = require("../recorder");

            doRecordButton(null);

            expect(console.warn).toHaveBeenCalledWith(
                "doRecordButton called without valid activity context"
            );
        });
    });

    describe("recording lifecycle", () => {
        it("reports a rejected display-capture request and re-arms recording", async () => {
            const error = new Error("Permission denied");
            navigator.mediaDevices.getDisplayMedia.mockRejectedValue(error);
            const activity = makeActivity(null);

            await startRecording(activity);

            expect(ErrorHandler.capture).toHaveBeenCalledWith(error, {
                operation: "screenCapture"
            });
            expect(ErrorHandler.recoverable).toHaveBeenCalledWith(error, {
                operation: "recording"
            });
            expect(activity.textMsg).toHaveBeenCalledWith("Recording failed: Permission denied");
            expect(mockStart._recordHandler).toEqual(expect.any(Function));
            expect(lastRecorderInstance).toBeNull();
        });

        it("falls back to display capture when the saved mode cannot be read", async () => {
            Storage.prototype.getItem.mockImplementation(() => {
                throw new Error("Storage unavailable");
            });
            const activity = makeActivity(null);

            await startRecording(activity);

            expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledTimes(1);
            expect(lastRecorderInstance).not.toBeNull();
        });

        it("reports a missing canvas when canvas-only capture is selected", async () => {
            Storage.prototype.getItem.mockReturnValue("canvas");
            const activity = makeActivity(null);

            await startRecording(activity);

            expect(ErrorHandler.recoverable).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Canvas element not found" }),
                { operation: "recording" }
            );
            expect(activity.textMsg).toHaveBeenCalledWith(
                "Recording failed: Canvas element not found"
            );
            expect(navigator.mediaDevices.getDisplayMedia).not.toHaveBeenCalled();
        });

        it("saves a non-empty recording through the native filename prompt", async () => {
            window.MBDialog = null;
            jest.spyOn(window, "prompt").mockReturnValue("lesson");
            const activity = makeActivity(null);

            await startRecording(activity);
            lastRecorderInstance.ondataavailable({ data: { size: 12 } });
            jest.advanceTimersByTime(500);
            stopRecording();

            expect(URL.createObjectURL).toHaveBeenCalledWith(
                expect.objectContaining({ size: 12, type: "video/webm" })
            );
            expect(mockLink.download).toBe("lesson.webm");
            expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
            expect(mockLink.click).toHaveBeenCalledTimes(1);
            expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
            expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
            expect(activity.textMsg).toHaveBeenCalledWith("Recording stopped. File saved.");
            expect(activity._onResize).toHaveBeenCalledTimes(1);
            expect(mockTrack.stop).toHaveBeenCalled();
        });

        it.each([
            ["an empty filename", ""],
            ["a cancelled filename prompt", null]
        ])("does not download when the prompt returns %s", async (_description, filename) => {
            window.MBDialog = null;
            jest.spyOn(window, "prompt").mockReturnValue(filename);
            jest.spyOn(window, "alert").mockImplementation(() => {});
            const activity = makeActivity(null);

            await startRecording(activity);
            lastRecorderInstance.ondataavailable({ data: { size: 12 } });
            stopRecording();

            expect(window.prompt).toHaveBeenCalledWith("Enter file name");
            expect(URL.createObjectURL).not.toHaveBeenCalled();
            expect(mockLink.click).not.toHaveBeenCalled();
            expect(activity.textMsg).not.toHaveBeenCalledWith("Recording stopped. File saved.");
        });

        it("rejects an empty chunk collection without creating a Blob URL", async () => {
            const activity = makeActivity(null);

            await startRecording(activity);
            lastRecorderInstance.stop();

            expect(window.MBDialog.alert).toHaveBeenCalledWith(
                "Recorded file is empty. File not saved.",
                "Save recording"
            );
            expect(URL.createObjectURL).not.toHaveBeenCalled();
            expect(mockStart.classList.remove).toHaveBeenCalledWith("recording");
        });

        it("rejects a zero-size Blob without downloading it", async () => {
            global.Blob = class ZeroSizeBlob {
                constructor() {
                    this.size = 0;
                }
            };
            const activity = makeActivity(null);

            await startRecording(activity);
            lastRecorderInstance.ondataavailable({ data: { size: 12 } });
            lastRecorderInstance.stop();

            expect(window.MBDialog.alert).toHaveBeenCalledWith(
                "Recorded file is empty. File not saved.",
                "Save recording"
            );
            expect(URL.createObjectURL).not.toHaveBeenCalled();
            expect(mockLink.click).not.toHaveBeenCalled();
        });

        it("uses the MBDialog prompt result to finalize a save", async () => {
            window.MBDialog = {
                alert: jest.fn(),
                prompt: jest.fn().mockResolvedValue("dialog-recording")
            };
            const activity = makeActivity(null);

            await startRecording(activity);
            lastRecorderInstance.ondataavailable({ data: { size: 12 } });
            lastRecorderInstance.stop();
            await Promise.resolve();
            await Promise.resolve();

            expect(window.MBDialog.prompt).toHaveBeenCalledWith({
                title: "Save recording",
                message: "Filename:",
                defaultValue: "recording",
                okText: "Save",
                cancelText: "Cancel"
            });
            expect(mockLink.download).toBe("dialog-recording.webm");
            expect(mockLink.click).toHaveBeenCalledTimes(1);
        });

        it("stops recording and saves when the display stream becomes inactive", async () => {
            window.MBDialog = null;
            jest.spyOn(window, "prompt").mockReturnValue("inactive-stream");
            const activity = makeActivity(null);

            await startRecording(activity);
            lastRecorderInstance.ondataavailable({ data: { size: 12 } });
            lastRecorderInstance.stop.mockImplementation(() => {
                lastRecorderInstance.state = "inactive";
            });
            mockStream.oninactive();
            lastRecorderInstance.onstop();

            expect(debugLog).toHaveBeenCalledWith("Recording stream ended; saving.");
            expect(lastRecorderInstance.stop).toHaveBeenCalledTimes(1);
            expect(mockTrack.stop).toHaveBeenCalled();
            expect(mockLink.download).toBe("inactive-stream.webm");
        });

        it("cancels canvas copying and cleans up canvas and audio tracks", async () => {
            Storage.prototype.getItem.mockReturnValue("canvas");
            const canvasTrack = makeTrack();
            const audioTrack = makeTrack();
            const canvasStream = makeStream([canvasTrack]);
            const recordContext = { fillRect: jest.fn(), drawImage: jest.fn(), fillStyle: "" };
            const recordCanvas = {
                captureStream: jest.fn(() => canvasStream),
                getContext: jest.fn(() => recordContext),
                height: 0,
                width: 0
            };
            const sourceCanvas = { height: 480, width: 640 };
            const audioDestination = {
                stream: {
                    getAudioTracks: jest.fn(() => [audioTrack]),
                    getTracks: jest.fn(() => [audioTrack])
                }
            };
            const tone = {
                context: { createMediaStreamDestination: jest.fn(() => audioDestination) },
                Destination: { connect: jest.fn() }
            };
            document.getElementById.mockImplementation(id => {
                if (id === "record") return mockStart;
                if (id === "myCanvas") return sourceCanvas;
                if (id === "toolbars") return { offsetHeight: 40 };
                return null;
            });
            document.createElement.mockImplementation(tag => {
                if (tag === "canvas") return recordCanvas;
                if (tag === "a") return mockLink;
                return {};
            });
            window.MBDialog = null;
            jest.spyOn(window, "prompt").mockReturnValue("canvas-recording");
            const activity = makeActivity(tone);

            await startRecording(activity);
            canvasTrack.emit("ended");
            lastRecorderInstance.ondataavailable({ data: { size: 12 } });
            stopRecording();

            expect(recordCanvas.captureStream).toHaveBeenCalledWith(30);
            expect(global.requestAnimationFrame).toHaveBeenCalled();
            expect(global.cancelAnimationFrame).toHaveBeenCalledWith(42);
            expect(tone.Destination.connect).toHaveBeenCalledWith(audioDestination);
            expect(canvasStream.addTrack).toHaveBeenCalledWith(audioTrack);
            expect(canvasTrack.stop).toHaveBeenCalled();
            expect(audioTrack.stop).toHaveBeenCalled();
        });
    });
});
