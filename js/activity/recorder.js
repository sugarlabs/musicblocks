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

/*
   global ErrorHandler, debugLog, _
*/

/*
   exported doRecordButton, setupActivityRecorder
*/

let isExecuting = false; // Flag variable to track execution status

/**
 * Sets up a record button functionality for the given activity.
 * @param {object} activity - The activity context.
 */
const doRecordButton = activity => {
    /**
     * Executes the record button functionality if execution is not already in progress.
     */
    if (isExecuting) {
        return; // Exit the function if execution is already in progress
    }

    if (!activity || typeof activity._doRecordButton !== "function") {
        console.warn("doRecordButton called without valid activity context");
        isExecuting = false;
        return;
    }

    isExecuting = true; // Set the flag to indicate execution has started
    activity._doRecordButton();
};

/**
 * Initializes the _doRecordButton method on the activity instance.
 * @param {object} activityInstance - The activity instance to attach the recorder API to.
 */
const setupActivityRecorder = activityInstance => {
    activityInstance._doRecordButton = () => {
        const that = activityInstance;
        const start = document.getElementById("record"),
            recInside = document.getElementById("rec_inside");
        let mediaRecorder;
        const clickEvent = new Event("click");
        let flag = 0;
        let currentStream = null;
        let audioDestination = null;

        /**
         * Records the screen using the browser's media devices API.
         * @returns {Promise<MediaStream>} A promise resolving to the recorded media stream.
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

            // Get the toolbar height to exclude from recording
            const toolbar = document.getElementById("toolbars");
            const toolbarHeight = toolbar ? toolbar.offsetHeight : 0;

            // Get canvas dimensions
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;

            // Calculate the visible area (excluding toolbar)
            const visibleHeight = canvasHeight - toolbarHeight;

            // Create a clean recording canvas
            const recordCanvas = document.createElement("canvas");
            recordCanvas.width = canvasWidth;
            recordCanvas.height = canvasHeight;
            const recordCtx = recordCanvas.getContext("2d");

            // Set background to match the canvas (white/light gray)
            recordCtx.fillStyle = "#f5f5f5"; // Adjust this color to match your canvas background
            let animationFrameId;

            // Function to continuously copy canvas content
            const copyFrame = () => {
                // Fill background
                recordCtx.fillRect(0, 0, canvasWidth, canvasHeight);

                // Draw only the visible portion of the canvas (skip the toolbar area)
                recordCtx.drawImage(
                    canvas,
                    0,
                    toolbarHeight, // Source x, y (skip toolbar)
                    canvasWidth,
                    visibleHeight, // Source width, height
                    0,
                    0, // Destination x, y
                    canvasWidth,
                    visibleHeight // Destination width, height
                );

                // Continue if still recording
                if (flag === 1) {
                    animationFrameId = requestAnimationFrame(copyFrame);
                }
            };

            // Start copying frames
            copyFrame();

            // Capture the canvas stream directly at 30fps
            const canvasStream = recordCanvas.captureStream(30);

            // Add audio track if available
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

            // Clean up animation frame when recording stops
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
         * Saves the recorded chunks as a video file.
         * @param {Blob[]} recordedChunks - The recorded video chunks.
         */
        function saveFile(recordedChunks) {
            flag = 1;
            recInside.classList.remove("blink");
            const showDialog = message => {
                if (window.MBDialog && typeof window.MBDialog.alert === "function") {
                    window.MBDialog.alert(message, _("Save recording"));
                } else {
                    alert(message);
                }
            };
            const finalizeSave = filename => {
                if (filename === null || filename.trim() === "") {
                    showDialog(_("File save canceled"));
                    flag = 0;
                    recording();
                    doRecordButton();
                    return;
                }

                const blob = new Blob(recordedChunks, { type: "video/webm" });
                const url = URL.createObjectURL(blob);

                that.save.download("webm", url, filename);

                recordedChunks = [];
                flag = 0;

                // Allow multiple recordings
                recording();
                doRecordButton();
            };
            // Prevent zero-byte files
            if (!recordedChunks || recordedChunks.length === 0) {
                showDialog(_("Recorded file is empty. File not saved."));
                flag = 0;
                recording();
                doRecordButton();
                return;
            }
            const blob = new Blob(recordedChunks, {
                type: "video/webm"
            });
            if (blob.size === 0) {
                showDialog(_("Recorded file is empty. File not saved."));
                flag = 0;
                recording();
                doRecordButton();
                return;
            }
            // Clean up stream after recording
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
                currentStream = null;
            }
            if (audioDestination && audioDestination.stream) {
                audioDestination.stream.getTracks().forEach(track => track.stop());
                audioDestination = null;
            }
            mediaRecorder = null;
            // Prompt to save file
            const filename = window.prompt(_("Enter file name"));
            if (filename === null || filename.trim() === "") {
                alert(_("File save canceled"));
                flag = 0;
                recording();
                doRecordButton();
                return; // Exit without saving the file
            }
            const downloadLink = document.createElement("a");
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.download = `${filename}.webm`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            that.textMsg(_("Saved! Check your Downloads folder."));
            URL.revokeObjectURL(blob);
            document.body.removeChild(downloadLink);
            flag = 0;
            // Allow multiple recordings
            recording();
            doRecordButton();
            that.textMsg(_("Recording stopped. File saved."));
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
         * Stops the recording process.
         */
        function stopRec() {
            flag = 0;

            if (mediaRecorder && typeof mediaRecorder.stop === "function") {
                mediaRecorder.stop();
            }

            // Clean up the recording canvas stream
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
            const node = document.createElement("p");
            node.textContent = "Stopped recording";
            document.body.appendChild(node);
        }

        /**
         * Creates a media recorder instance.
         * @param {MediaStream} stream - The media stream to be recorded.
         * @param {string} mimeType - The MIME type of the recording.
         * @returns {MediaRecorder} The created media recorder instance.
         */
        function createRecorder(stream, mimeType) {
            flag = 1;
            recInside.classList.add("blink");
            that.textMsg(_("Recording started. Click stop to finish."));
            start.removeEventListener("click", createRecorder, true);
            let recordedChunks = [];
            mediaRecorder = new MediaRecorder(stream);
            stream.oninactive = function () {
                debugLog("Recording is ready to save");
                stopRec();
                flag = 0;
            };

            mediaRecorder.onstop = function () {
                //saveFile(recordedChunks);
                //recordedChunks = [];
                //flag = 0;
                //recInside.setAttribute("fill", "#ffffff");
                const blob = new Blob(recordedChunks, { type: "video/webm" });
                const url = URL.createObjectURL(blob);

                that.save.download("webm", url, null);

                recordedChunks = [];
                flag = 0;
                recInside.setAttribute("fill", "#ffffff");
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
         * Handles the recording process.
         */
        function recording() {
            // Remove any previous handler to avoid multiple triggers
            if (start._recordHandler) {
                start.removeEventListener("click", start._recordHandler);
            }
            const handler = async function handler() {
                try {
                    const stream = await recordScreen();
                    const mimeType = "video/webm";
                    mediaRecorder = createRecorder(stream, mimeType);
                    if (flag === 1) {
                        start.removeEventListener("click", handler);
                        // Add stop handler
                        const stopHandler = function stopHandler() {
                            if (mediaRecorder && mediaRecorder.state === "recording") {
                                mediaRecorder.stop();
                                mediaRecorder = new MediaRecorder(stream);
                                recInside.classList.remove("blink");
                                flag = 0;
                                // Clean up stream
                                if (currentStream) {
                                    currentStream.getTracks().forEach(track => track.stop());
                                }
                                if (audioDestination && audioDestination.stream) {
                                    audioDestination.stream
                                        .getTracks()
                                        .forEach(track => track.stop());
                                }
                            }
                            start.removeEventListener("click", stopHandler);
                            // Re-enable recording for next time
                            recording();
                        };
                        start.addEventListener("click", stopHandler);
                    }
                    recInside.setAttribute("fill", "red");
                } catch (error) {
                    ErrorHandler.recoverable(error, { operation: "recording" });
                    that.textMsg(_("Recording failed: %s").replace(/%s/g, error.message));
                    flag = 0;
                    // Re-enable recording button
                    recording();
                }
            };
            start.addEventListener("click", handler);
            start._recordHandler = handler;
        }

        // Start recording process if not already executing
        if (flag === 0 && isExecuting) {
            recording();
            start.dispatchEvent(clickEvent);
        }
    };
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = { doRecordButton, setupActivityRecorder };
}
