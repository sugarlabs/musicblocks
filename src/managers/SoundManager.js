import { Synth } from "../../js/utils/synthutils.js";

/**
 * SoundManager encapsulates the audio subsystem, including the synthesizer engine,
 * audio context management, and recording functionality.
 */
export class SoundManager {
    /**
     * @param {Object} dependencies - Optional dependencies
     * @param {Object} dependencies.activity - Reference to the Activity class
     */
    constructor(dependencies = {}) {
        this.activity = dependencies.activity;
        this.synth = new Synth();
        this.synth.activity = this.activity;

        // Recording state
        this.mediaRecorder = null;
        this.currentStream = null;
        this.audioDestination = null;
        this.isRecordingExecuting = false;
        this.recordingFlag = 0;
    }

    /**
     * Resumes the audio context.
     * Required for modern browsers after a user interaction.
     */
    resume() {
        if (this.synth && this.synth.resume) {
            this.synth.resume();
        }
    }

    /**
     * Suspends the audio context.
     */
    suspend() {
        if (this.synth && this.synth.suspend) {
            this.synth.suspend();
        }
    }

    /**
     * Starts the synthesizer.
     */
    start() {
        if (this.synth && this.synth.start) {
            this.synth.start();
        }
    }

    /**
     * Handles the record button functionality.
     * Ported from activity.js _doRecordButton.
     */
    doRecordButton() {
        if (this.isRecordingExecuting) {
            return;
        }

        this.isRecordingExecuting = true;
        this._startRecordingProcess();
    }

    /**
     * Internal implementation of the recording process.
     * @private
     */
    _startRecordingProcess() {
        const that = this;
        const start = document.getElementById("record");
        const recInside = document.getElementById("rec_inside");
        const clickEvent = new Event("click");

        const recordScreen = async () => {
            const mode = localStorage.getItem("musicBlocksRecordMode");
            if (mode === "canvas") {
                return await this._recordCanvasOnly();
            } else {
                return await this._recordScreenWithTools();
            }
        };

        const recording = () => {
            if (start._recordHandler) {
                start.removeEventListener("click", start._recordHandler);
            }

            const handler = async () => {
                try {
                    const stream = await recordScreen();
                    const mimeType = "video/webm";
                    this.mediaRecorder = this._createRecorder(stream, mimeType, recInside, start);

                    if (this.recordingFlag === 1) {
                        start.removeEventListener("click", handler);

                        const stopHandler = () => {
                            if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
                                this.mediaRecorder.stop();
                                this.mediaRecorder = new MediaRecorder(stream);
                                recInside.classList.remove("blink");
                                this.recordingFlag = 0;

                                if (this.currentStream) {
                                    this.currentStream.getTracks().forEach(track => track.stop());
                                }
                                if (this.audioDestination && this.audioDestination.stream) {
                                    this.audioDestination.stream
                                        .getTracks()
                                        .forEach(track => track.stop());
                                }
                            }
                            start.removeEventListener("click", stopHandler);
                            recording(); // Re-enable for next time
                        };
                        start.addEventListener("click", stopHandler);
                    }
                    recInside.setAttribute("fill", "red");
                } catch (error) {
                    console.error("Recording failed:", error);
                    if (this.activity && this.activity.textMsg) {
                        this.activity.textMsg(_("Recording failed: ") + error.message);
                    }
                    this.recordingFlag = 0;
                    recording();
                }
            };
            start.addEventListener("click", handler);
            start._recordHandler = handler;
        };

        if (this.recordingFlag === 0 && this.isRecordingExecuting) {
            recording();
            start.dispatchEvent(clickEvent);
        }
    }

    /**
     * Records only the canvas area.
     * @private
     */
    async _recordCanvasOnly() {
        this.recordingFlag = 1;
        const canvas = document.getElementById("myCanvas");
        if (!canvas) throw new Error("Canvas element not found");

        const toolbar = document.getElementById("toolbars");
        const toolbarHeight = toolbar ? toolbar.offsetHeight : 0;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const visibleHeight = canvasHeight - toolbarHeight;

        const recordCanvas = document.createElement("canvas");
        recordCanvas.width = canvasWidth;
        recordCanvas.height = canvasHeight;
        const recordCtx = recordCanvas.getContext("2d", { willReadFrequently: true });

        recordCtx.fillStyle = "#f5f5f5";
        let animationFrameId;

        const copyFrame = () => {
            recordCtx.fillRect(0, 0, canvasWidth, canvasHeight);
            recordCtx.drawImage(
                canvas,
                0,
                toolbarHeight,
                canvasWidth,
                visibleHeight,
                0,
                0,
                canvasWidth,
                visibleHeight
            );
            if (this.recordingFlag === 1) {
                animationFrameId = requestAnimationFrame(copyFrame);
            }
        };

        copyFrame();

        const canvasStream = recordCanvas.captureStream(30);

        const Tone = this.synth.tone;
        if (Tone && Tone.context) {
            const dest = Tone.context.createMediaStreamDestination();
            Tone.Destination.connect(dest);
            this.audioDestination = dest;
            const audioTrack = dest.stream.getAudioTracks()[0];
            if (audioTrack) {
                canvasStream.addTrack(audioTrack);
            }
        }
        this.currentStream = canvasStream;

        canvasStream.getTracks()[0].addEventListener("ended", () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        });

        return canvasStream;
    }

    /**
     * Records the screen using browser media devices.
     * @private
     */
    async _recordScreenWithTools() {
        this.recordingFlag = 1;
        try {
            return await navigator.mediaDevices.getDisplayMedia({
                preferCurrentTab: "True",
                systemAudio: "include",
                audio: "True",
                video: { mediaSource: "tab" }
            });
        } catch (error) {
            console.error("Screen capture failed:", error);
            this.recordingFlag = 0;
            throw error;
        }
    }

    /**
     * Creates a MediaRecorder instance.
     * @private
     */
    _createRecorder(stream, mimeType, recInside, startBtn) {
        this.recordingFlag = 1;
        recInside.classList.add("blink");
        if (this.activity && this.activity.textMsg) {
            this.activity.textMsg(_("Recording started. Click stop to finish."));
        }

        let recordedChunks = [];
        const mediaRecorder = new MediaRecorder(stream);

        stream.oninactive = () => {
            this._stopRec();
            this.recordingFlag = 0;
        };

        mediaRecorder.onstop = () => {
            this._saveFile(recordedChunks, recInside);
            recordedChunks = [];
            this.recordingFlag = 0;
            recInside.setAttribute("fill", "#ffffff");
        };

        mediaRecorder.ondataavailable = e => {
            if (e.data.size > 0) recordedChunks.push(e.data);
        };

        mediaRecorder.start(200);
        setTimeout(() => {
            if (this.activity && this.activity._onResize) {
                this.activity._onResize();
            }
        }, 500);

        return mediaRecorder;
    }

    /**
     * Stops the recording process.
     * @private
     */
    _stopRec() {
        this.recordingFlag = 0;
        if (this.mediaRecorder && typeof this.mediaRecorder.stop === "function") {
            this.mediaRecorder.stop();
        }

        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
        }
    }

    /**
     * Saves the recorded chunks as a file.
     * @private
     */
    _saveFile(recordedChunks, recInside) {
        this.recordingFlag = 1;
        recInside.classList.remove("blink");

        if (!recordedChunks || recordedChunks.length === 0) {
            alert(_("Recorded file is empty. File not saved."));
            this.recordingFlag = 0;
            this.doRecordButton();
            return;
        }

        const blob = new Blob(recordedChunks, { type: "video/webm" });
        if (blob.size === 0) {
            alert(_("Recorded file is empty. File not saved."));
            this.recordingFlag = 0;
            this.doRecordButton();
            return;
        }

        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
        if (this.audioDestination && this.audioDestination.stream) {
            this.audioDestination.stream.getTracks().forEach(track => track.stop());
            this.audioDestination = null;
        }

        this.mediaRecorder = null;
        const filename = window.prompt(_("Enter file name"));

        if (filename === null || filename.trim() === "") {
            alert(_("File save canceled"));
            this.recordingFlag = 0;
            this.doRecordButton();
            return;
        }

        const downloadLink = document.createElement("a");
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = `${filename}.webm`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        URL.revokeObjectURL(blob);
        document.body.removeChild(downloadLink);

        this.recordingFlag = 0;
        this.doRecordButton();
        if (this.activity && this.activity.textMsg) {
            this.activity.textMsg(_("Recording stopped. File saved."));
        }
    }
}
