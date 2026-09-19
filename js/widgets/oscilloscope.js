/**
 * @file This contains the prototype of the Oscilloscope Widget.
 * @author Saksham Mrig
 *
 * @copyright 2020 Saksham Mrig
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

/*
   global

   _, SMALLERBUTTON, BIGGERBUTTON, Tone, instruments
 */
/* 
    Globals location
     - js/artwork.js
         SMALLERBUTTON,BIGGERBUTTON
     - js/utils/utils.js
         _
     - js/activity.js
         Tone
     - js/utils/synthutils.js
         instruments
         
*/
/* exported Oscilloscope */

/**
 * @class
 * @classdesc pertains to setting up all features of the Oscilloscope Widget.
 */
class Oscilloscope {
    /** AMD module dependencies for lazy loading. */
    static dependencies = ["widgets/oscilloscope"];

    static ICONSIZE = 40;
    static analyserSize = 8192;
    static DRAW_TIMEOUT = 1000;

    constructor(activity) {
        this.activity = activity;

        // RAF lifecycle control
        this._running = false;
        this._rafId = null;
        this._timeoutId = null;
        this._isIdle = false;
        this.draw = this.draw.bind(this);

        this._handleVisibilityChange = this._handleVisibilityChange.bind(this);
        document.addEventListener("visibilitychange", this._handleVisibilityChange);

        this.pitchAnalysers = {};
        this._canvasState = {};
        this.drawVisualIDs = {};

        this.isFrozen = false;
        this._frozenWaveforms = {};
        this._connectedSynths = {};
        this.toggleFreeze = this.toggleFreeze.bind(this);
        this._keyHandler = this._keyHandler.bind(this);
        document.addEventListener("keydown", this._keyHandler);

        // Widget window
        const widgetWindow = window.widgetWindows.windowFor(this, "oscilloscope");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();

        widgetWindow.onclose = () => {
            this.close();
        };
        widgetWindow.onmaximize = this._scale.bind(this);

        // UI state
        this.zoomFactor = 40.0;
        this.verticalOffset = 0;

        // Zoom buttons
        const zoomInButton = widgetWindow.addButton("", Oscilloscope.ICONSIZE, _("Zoom In"));
        zoomInButton.onclick = () => {
            this.zoomFactor *= 1.333;
            if (this.isFrozen) this._renderFrame();
        };
        zoomInButton.children[0].src = `data:image/svg+xml;base64,${window.btoa(
            base64Encode(BIGGERBUTTON)
        )}`;

        const zoomOutButton = widgetWindow.addButton("", Oscilloscope.ICONSIZE, _("Zoom Out"));
        zoomOutButton.onclick = () => {
            this.zoomFactor /= 1.333;
            if (this.zoomFactor < 1) this.zoomFactor = 1;
            if (this.isFrozen) this._renderFrame();
        };
        zoomOutButton.children[0].src = `data:image/svg+xml;base64,${window.btoa(
            base64Encode(SMALLERBUTTON)
        )}`;

        // Freeze button
        this.freezeButton = widgetWindow.addButton("", Oscilloscope.ICONSIZE, _("Freeze"));
        this.freezeButton.onclick = this.toggleFreeze;
        this._updateFreezeButton();

        widgetWindow.sendToCenter();

        // Active turtles
        this.divisions = [];
        for (const turtle of this.activity.logo.oscilloscopeTurtles) {
            if (turtle && !turtle.inTrash) {
                this.divisions.push(turtle);
            }
        }

        this._scale();
    }

    /* ---------------- Lifecycle ---------------- */

    _stopAnimation() {
        this._running = false;

        if (this._rafId !== null) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }

        if (this._timeoutId !== null) {
            clearTimeout(this._timeoutId);
            this._timeoutId = null;
        }

        // Backward compatibility: if any per-turtle RAF ids were stored, cancel them too.
        for (const id of Object.values(this.drawVisualIDs || {})) {
            if (id !== null && id !== undefined) {
                cancelAnimationFrame(id);
            }
        }
    }

    _startAnimation() {
        if (this._running) return;
        this._running = true;
        this.draw();
    }

    _throttle() {
        if (!this._running) return;

        // Cancel any active RAF
        if (this._rafId !== null) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }

        // Enter idle mode
        this._isIdle = true;

        // Start timeout scheduler if not already running
        if (this._timeoutId === null) {
            this._timeoutId = setTimeout(this.draw, Oscilloscope.DRAW_TIMEOUT);
        }
    }

    _wakeUp() {
        if (!this._running) return;

        // Cancel any active timeout
        if (this._timeoutId !== null) {
            clearTimeout(this._timeoutId);
            this._timeoutId = null;
        }

        // Exit idle mode
        this._isIdle = false;

        // Restart RAF scheduler if not already running
        if (this._rafId === null) {
            this.draw();
        }
    }

    _handleVisibilityChange() {
        if (document.visibilityState === "visible") {
            this._wakeUp();
        } else {
            this._throttle();
        }
    }

    toggleFreeze() {
        this.isFrozen = !this.isFrozen;
        this._updateFreezeButton();
        if (!this.isFrozen && this.divisions.length > 0) {
            this._startAnimation();
        }
    }

    _updateFreezeButton() {
        if (!this.freezeButton) return;
        const iconSrc = this.isFrozen ? "play-button.svg" : "pause-button.svg";
        this.freezeButton.children[0].src = `header-icons/${iconSrc}`;
        const label = this.isFrozen ? _("Resume") : _("Freeze");
        this.freezeButton.title = label;
        this.freezeButton.setAttribute("aria-label", label);
    }

    _keyHandler(e) {
        if (!this.widgetWindow) return;
        if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
        if (window.widgetWindows.focused !== this.widgetWindow) return;
        if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
        if (document.activeElement.isContentEditable) return;

        if (e.code === "Space" || e.code === "KeyF") {
            e.preventDefault();
            this.toggleFreeze();
        }
    }

    close() {
        this._stopAnimation();

        document.removeEventListener("visibilitychange", this._handleVisibilityChange);
        document.removeEventListener("keydown", this._keyHandler);

        for (const key of Object.keys(this.pitchAnalysers)) {
            if (
                this.pitchAnalysers[key] &&
                typeof this.pitchAnalysers[key].dispose === "function" &&
                !this.pitchAnalysers[key].disposed
            ) {
                this.pitchAnalysers[key].dispose();
            }
        }

        this.drawVisualIDs = {};
        this._canvasState = {};
        this.pitchAnalysers = {};
        this._frozenWaveforms = {};
        this._connectedSynths = {};

        if (this.widgetWindow) {
            this.widgetWindow.destroy();
            this.widgetWindow = null;
        }
    }

    /* ---------------- Audio ---------------- */

    reconnectSynthsToAnalyser = turtleIdx => {
        if (!this.pitchAnalysers[turtleIdx]) {
            this.pitchAnalysers[turtleIdx] = new Tone.Analyser({
                type: "waveform",
                size: Oscilloscope.analyserSize
            });
            this._connectedSynths[turtleIdx] = new Set();
        }

        for (const synth in instruments[turtleIdx]) {
            const synthInst = instruments[turtleIdx][synth];
            if (!this._connectedSynths[turtleIdx].has(synthInst)) {
                synthInst.connect(this.pitchAnalysers[turtleIdx]);
                this._connectedSynths[turtleIdx].add(synthInst);
            }
        }
    };

    /* ---------------- Canvas setup ---------------- */

    makeCanvas = (width, height, turtle, turtleIdx, resized) => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.className = "oscilloscopeCanvas";
        this.widgetWindow.getWidgetBody().appendChild(canvas);

        const canvasCtx = canvas.getContext("2d");
        canvasCtx.clearRect(0, 0, width, height);

        this._canvasState[turtleIdx] = {
            canvas,
            canvasCtx,
            width,
            height,
            turtle,
            turtleIdx,
            resizedOnce: resized
        };

        this.drawVisualIDs[turtleIdx] = null;
    };

    /* ---------------- Drawing ---------------- */

    _renderFrame() {
        for (const key of Object.keys(this._canvasState)) {
            const state = this._canvasState[key];
            if (!state) continue;

            let dataArray;
            if (this.isFrozen) {
                dataArray = this._frozenWaveforms[state.turtleIdx];
                if (!dataArray) continue;
            } else {
                this.reconnectSynthsToAnalyser(state.turtleIdx);
                const analyser = this.pitchAnalysers[state.turtleIdx];
                if (!analyser) continue;

                const rawData = analyser.getValue();
                // Copy to preserve the current waveform when frozen
                dataArray = new Float32Array(rawData);
                this._frozenWaveforms[state.turtleIdx] = dataArray;
            }

            const ctx = state.canvasCtx;
            const bufferLength = dataArray.length;

            ctx.fillStyle = platformColor.background || "#FFFFFF";
            ctx.fillRect(0, 0, state.width, state.height);
            ctx.lineWidth = 2;
            ctx.strokeStyle = state.turtle.painter._canvasColor;
            ctx.beginPath();

            const sliceWidth = (state.width * this.zoomFactor) / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const y = (state.height / 2) * (1 - dataArray[i]) + this.verticalOffset;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                x += sliceWidth;
            }

            ctx.stroke();
            state.resizedOnce = false;
        }
    }

    draw() {
        if (!this._running) return;

        // Render the current frame
        this._renderFrame();

        // Schedule next frame based on idle state
        if (
            this._isIdle ||
            (this.activity && this.activity.isAppIdle) ||
            document.visibilityState === "hidden" ||
            this.widgetWindow._rolled
        ) {
            // Use setTimeout for idle mode (1 FPS)
            this._timeoutId = setTimeout(this.draw, Oscilloscope.DRAW_TIMEOUT);
        } else {
            // Use RAF for active mode (~60 FPS)
            this._rafId = requestAnimationFrame(this.draw);
        }
    }

    /* ---------------- Resize ---------------- */

    _scale() {
        let width, height;

        const canvases = document.getElementsByClassName("oscilloscopeCanvas");
        Array.from(canvases).forEach(ele => {
            this.widgetWindow.getWidgetBody().removeChild(ele);
        });

        this._canvasState = {};

        if (!this.widgetWindow.isMaximized()) {
            width = 700;
            height = 400;
        } else {
            width = this.widgetWindow.getWidgetBody().getBoundingClientRect().width;
            height = this.widgetWindow.getWidgetFrame().getBoundingClientRect().height - 70;
        }

        for (const turtle of this.divisions) {
            const turtleIdx = this.activity.turtles.getIndexOfTurtle(turtle);
            this.reconnectSynthsToAnalyser(turtleIdx);
            this.makeCanvas(width, height / this.divisions.length, turtle, turtleIdx, true);
        }

        if (this.divisions.length > 0) {
            if (!this._running) {
                this._startAnimation();
            } else {
                // Already animating; just redraw once without starting a second RAF chain.
                this._renderFrame();
            }
        } else {
            this._stopAnimation();
        }
    }
}

if (typeof module !== "undefined") {
    module.exports = Oscilloscope;
}
