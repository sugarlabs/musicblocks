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

/* global ErrorHandler, debugLog, _ */

/* exported doRecordButton, setupActivityRecorder */

let isExecuting = false; // Guard against re-entrant button clicks

/**
 * Calls _doRecordButton on the activity instance, guarded against
 * re-entrant invocations. isExecuting is reset by the recording flow
 * itself (inside saveFile / error paths) so subsequent recordings work.
 * @param {object} activity - The activity context.
 */
const doRecordButton = activity => {
    if (isExecuting) {
        return;
    }

    if (!activity || typeof activity._doRecordButton !== "function") {
        console.warn("doRecordButton called without valid activity context");
        return;
    }

    isExecuting = true;
    activity._doRecordButton();
};

/**
 * Attaches _doRecordButton to the activity instance.
 * @param {object} activityInstance - The activity instance.
 */
const setupActivityRecorder = activityInstance => {
    activityInstance._doRecordButton = () => {
        const that = activityInstance;
        const start = document.getElementById("record");
        let mediaRecorder;
        const clickEvent = new Event("click");
        let flag = 0;
        let currentStream = null;
        let audioDestination = null;

        /**
         * Dispatches to canvas-only or full-screen recording based on
         * the stored user preference.
         * @returns {Promise<MediaStream>}
         */
        async function recordScreen() {
            let mode = null;
            try {
                mode = localStorage.getItem("musicBlocksRecordMode");
            } catch (e) {
                mode = null;
            }

            if (mode === "canvas") {
                return await recordCanvasOnly();
            } else {
                return await recordScreenWithTools();
            }
        }

        async function recordCanvasOnly() {
            flag = 1;
            const canvas = document.getElementById("myCanvas");
            if (!canvas) {
                throw new Error("Canvas element not found");
            }

            const toolbar = document.getElementById("toolbars");
            const toolbarHeight = toolbar ? toolbar.offsetHeight : 0;
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const visibleHeight = canvasHeight - toolbarHeight;

            const recordCanvas = document.createElement("canvas");
            recordCanvas.width = canvasWidth;
            recordCanvas.height = canvasHeight;
            const recordCtx = recordCanvas.getContext("2d");

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

                if (flag === 1) {
                    animationFrameId = requestAnimationFrame(copyFrame);
                }
            };

            copyFrame();

            const canvasStream = recordCanvas.captureStream(30);

            const Tone = that.logo.synth.tone;
            if (Tone && Tone.context) {
                const dest = Tone.context.createMediaStreamDestination();
                Tone.Destination.connect(dest);
                audioDestination = dest;
                const audioTrack = dest.stream.getAudioTracks()[0];
                if (audioTrack) {
                    canvasStream.addTrack(audioTrack);
                }
            }
            currentStream = canvasStream;

            canvasStream.getTracks()[0].addEventListener("ended", () => {
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }
            });

            return canvasStream;
        }

        async function recordScreenWithTools() {
            flag = 1;

            try {
                return await navigator.mediaDevices.getDisplayMedia({
                    preferCurrentTab: "True",
                    systemAudio: "include",
                    audio: "True",
                    video: { mediaSource: "tab" },
                    bandwidthProfile: {
                        video: {
                            clientTrackSwitchOffControl: "auto",
                            contentPreferencesMode: "auto"
                        }
                    },
                    preferredVideoCodecs: "auto"
                });
            } catch (error) {
                ErrorHandler.capture(error, { operation: "screenCapture" });
                flag = 0;
                throw error;
            }
        }

        /**
         * Cleans up all active media tracks and recorder state.
         */
        function cleanupStreams() {
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
                currentStream = null;
            }
            if (audioDestination && audioDestination.stream) {
                audioDestination.stream.getTracks().forEach(track => track.stop());
                audioDestination = null;
            }
            mediaRecorder = null;
        }

        /**
         * Saves the recorded chunks as a .webm file using a single
         * prompt/download flow (MBDialog when available, native prompt
         * otherwise). isExecuting is reset here so subsequent recordings
         * are allowed.
         * @param {Blob[]} recordedChunks - The accumulated recorded chunks.
         */
        function saveFile(recordedChunks) {
            start.classList.remove("recording");

            const showAlert = message => {
                if (window.MBDialog && typeof window.MBDialog.alert === "function") {
                    window.MBDialog.alert(message, _("Save recording"));
                } else {
                    alert(message);
                }
            };

            if (!recordedChunks || recordedChunks.length === 0) {
                showAlert(_("Recorded file is empty. File not saved."));
                flag = 0;
                isExecuting = false;
                recording();
                return;
            }

            // Create blob once and reuse throughout this function
            const blob = new Blob(recordedChunks, { type: "video/webm" });

            if (blob.size === 0) {
                showAlert(_("Recorded file is empty. File not saved."));
                flag = 0;
                isExecuting = false;
                recording();
                return;
            }

            cleanupStreams();

            const finalizeSave = filename => {
                if (filename === null || filename === undefined || filename.trim() === "") {
                    showAlert(_("File save canceled"));
                    flag = 0;
                    isExecuting = false;
                    recording();
                    return;
                }

                const url = URL.createObjectURL(blob);
                const downloadLink = document.createElement("a");
                downloadLink.href = url;
                downloadLink.download = `${filename}.webm`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                URL.revokeObjectURL(url);
                document.body.removeChild(downloadLink);

                that.textMsg(_("Recording stopped. File saved."));
                flag = 0;
                isExecuting = false;
                recording();
            };

            // Single save flow: prefer MBDialog, fall back to native prompt
            if (window.MBDialog && typeof window.MBDialog.prompt === "function") {
                window.MBDialog.prompt({
                    title: _("Save recording"),
                    message: _("Filename:"),
                    defaultValue: _("recording"),
                    okText: _("Save"),
                    cancelText: _("Cancel")
                }).then(result => finalizeSave(result));
            } else {
                const filename = window.prompt(_("Enter file name"));
                finalizeSave(filename);
            }
        }

        /**
         * Stops the media recorder and cleans up the canvas stream.
         */
        function stopRec() {
            flag = 0;

            if (mediaRecorder && typeof mediaRecorder.stop === "function") {
                mediaRecorder.stop();
            }

            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }

            debugLog("Stopped recording");
        }

        /**
         * Creates and starts a MediaRecorder for the given stream.
         * @param {MediaStream} stream - The stream to record.
         * @returns {MediaRecorder}
         */
        function createRecorder(stream) {
            flag = 1;
            start.classList.add("recording");
            that.textMsg(_("Recording started. Click stop to finish."));
            start.removeEventListener("click", createRecorder, true);
            let recordedChunks = [];
            mediaRecorder = new MediaRecorder(stream);
            stream.oninactive = function () {
                debugLog("Recording stream ended; saving.");
                stopRec();
                flag = 0;
            };

            mediaRecorder.onstop = function () {
                saveFile(recordedChunks);
                recordedChunks = [];
            };

            mediaRecorder.ondataavailable = function (e) {
                if (e.data.size > 0) {
                    recordedChunks.push(e.data);
                }
            };

            mediaRecorder.start(200);
            setTimeout(() => {
                debugLog("Resizing for Record", that.canvas.height);
                that._onResize();
            }, 500);
            return mediaRecorder;
        }

        /**
         * Arms the record button for the next click. Cleans up any
         * previously attached handler first to prevent duplicate listeners.
         */
        function recording() {
            if (start._recordHandler) {
                start.removeEventListener("click", start._recordHandler);
            }

            const handler = async function handler() {
                try {
                    const stream = await recordScreen();
                    mediaRecorder = createRecorder(stream);
                    if (flag === 1) {
                        start.removeEventListener("click", handler);

                        const stopHandler = function stopHandler() {
                            if (mediaRecorder && mediaRecorder.state === "recording") {
                                mediaRecorder.stop();
                                start.classList.remove("recording");
                                flag = 0;
                                cleanupStreams();
                            }
                            start.removeEventListener("click", stopHandler);
                            // Do NOT call recording() here — onstop fires saveFile
                            // which always calls recording() as its final step.
                        };
                        start.addEventListener("click", stopHandler);
                    }
                } catch (error) {
                    ErrorHandler.recoverable(error, { operation: "recording" });
                    that.textMsg(_("Recording failed: %s").replace(/%s/g, error.message));
                    flag = 0;
                    isExecuting = false;
                    recording();
                }
            };

            start.addEventListener("click", handler);
            start._recordHandler = handler;
        }

        if (flag === 0 && isExecuting) {
            recording();
            start.dispatchEvent(clickEvent);
        }
    };
};

// Proper AMD module definition. RequireJS will call this factory after
// loading the listed dependencies, receive the returned object as the
// module value, and make both symbols available to requiring modules.
// The window assignments are kept so activity.js /* global */ references
// resolve without requiring activity.js to accept an AMD return value.
if (typeof define === "function" && define.amd) {
    define(function () {
        window.doRecordButton = doRecordButton;
        window.setupActivityRecorder = setupActivityRecorder;
        return { doRecordButton, setupActivityRecorder };
    });
} else if (typeof module !== "undefined" && module.exports) {
    // Jest / Node environment
    module.exports = { doRecordButton, setupActivityRecorder };
}
