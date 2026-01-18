/**
 * @file This contains the prototype of the JavaScript Editor Widget.
 * @author Saksham Mrig
 *
 * @copyright 2020 Saksham Mirg
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
    static ICONSIZE = 40;
    static analyserSize = 8192;
    /**
     * @constructor
     * @param {Object} activity - The activity object
     */
    constructor(activity) {
        this._running = false;
        this._rafId = null;
        this.drawVisualIDs = {};
        this.draw = this.draw.bind(this);
        this._lastTurtle = null;
        this.activity = activity;
        this.pitchAnalysers = {};
        this.playingNow = false;

        this._canvasState = {};
        const widgetWindow = window.widgetWindows.windowFor(this, "oscilloscope");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();

        widgetWindow.onclose = () => {
            this.close();
        };
        widgetWindow.onmaximize = this._scale.bind(this);

        document.getElementsByClassName("wfbToolbar")[0].style.backgroundColor = "#e8e8e8";
        document.getElementsByClassName("wfbWidget")[0].style.backgroundColor = "#FFFFFF";
        const step = 1.333;
        this.zoomFactor = 40.0;
        this.verticalOffset = 0;
        const zoomInButton = widgetWindow.addButton("", Oscilloscope.ICONSIZE, _("Zoom In"));

        zoomInButton.onclick = () => {
            this.zoomFactor *= step;
        };
        zoomInButton.children[0].src = `data:image/svg+xml;base64,${window.btoa(
            base64Encode(BIGGERBUTTON)
        )}`;

        const zoomOutButton = widgetWindow.addButton("", Oscilloscope.ICONSIZE, _("Zoom Out"));

        zoomOutButton.onclick = () => {
            this.zoomFactor /= step;
            if (this.zoomFactor < 1) {
                this.zoomFactor = 1;
            }
        };

        zoomOutButton.children[0].src = `data:image/svg+xml;base64,${window.btoa(
            base64Encode(SMALLERBUTTON)
        )}`;

        widgetWindow.sendToCenter();
        this.widgetWindow = widgetWindow;
        this.divisions = [];

        for (const turtle of this.activity.logo.oscilloscopeTurtles) {
            if (turtle && !turtle.inTrash) this.divisions.push(turtle);
        }

        this._scale();
        if (!this.playingNow) {
            // console.debug("oscilloscope running");
        }
    }

    close() {
        this._running = false;

        if (this._rafId !== null) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }

        for (const id in this.drawVisualIDs) {
            cancelAnimationFrame(this.drawVisualIDs[id]);
        }
        this.drawVisualIDs = {};

        this._canvasState = {};
        this.pitchAnalysers = {};

        if (this.widgetWindow) {
            this.widgetWindow.destroy();
            this.widgetWindow = null;
        }
    }

    _isWidgetOpen() {
        return Boolean(this.widgetWindow);
    }

    _computeCanDraw() {
        if (!this._isWidgetOpen()) return false;

        let anyDrawable = false;
        let anyActivePlayback = false;
        let anyResizedOnce = false;

        for (const turtleIdx of Object.keys(this._canvasState)) {
            const state = this._canvasState[turtleIdx];
            if (!state) continue;

            anyResizedOnce = anyResizedOnce || Boolean(state.resizedOnce);

            const analyser = this.pitchAnalysers[state.turtleIdx];
            if (!analyser) continue;

            anyDrawable = true;
            anyActivePlayback = anyActivePlayback || Boolean(state.turtle && state.turtle.running);
        }

        // We draw if there's something to draw and either playback is active or we need one resized pass.
        return anyDrawable && (anyActivePlayback || anyResizedOnce);
    }

    draw(turtle) {
        // When invoked by requestAnimationFrame, the first argument is a timestamp.
        // Use the last known turtle index in that case.
        if (turtle !== undefined && turtle !== null) {
            if (this._canvasState[turtle] || this.pitchAnalysers[turtle]) {
                this._lastTurtle = turtle;
            } else {
                turtle = this._lastTurtle;
            }
        } else {
            turtle = this._lastTurtle;
        }

        if (!this._running) return;

        const canDraw = this._computeCanDraw();
        if (!canDraw) {
            this._running = false;

            if (this._rafId !== null) {
                cancelAnimationFrame(this._rafId);
                this._rafId = null;
            }

            for (const id of Object.keys(this.drawVisualIDs)) {
                this.drawVisualIDs[id] = null;
            }

            if (turtle !== undefined && turtle !== null) {
                this.drawVisualIDs[turtle] = null;
            }
            return;
        }

        for (const turtleKey of Object.keys(this._canvasState)) {
            const state = this._canvasState[turtleKey];
            if (!state) continue;

            const analyser = this.pitchAnalysers[state.turtleIdx];
            if (!analyser) continue;

            if (!(state.turtle && (state.turtle.running || state.resizedOnce))) continue;

            const canvasCtx = state.canvasCtx;
            const width = state.width;
            const height = state.height;

            canvasCtx.fillStyle = "#FFFFFF";
            const dataArray = analyser.getValue();
            const bufferLength = dataArray.length;
            canvasCtx.fillRect(0, 0, width, height);
            canvasCtx.lineWidth = 2;
            const rbga = state.turtle.painter._canvasColor;
            canvasCtx.strokeStyle = rbga;
            canvasCtx.beginPath();
            const sliceWidth = (width * this.zoomFactor) / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const y = (height / 2) * (1 - dataArray[i]) + this.verticalOffset;
                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }
                x += sliceWidth;
            }

            canvasCtx.lineTo(state.canvas.width, state.canvas.height / 2);
            canvasCtx.stroke();

            // Only allow one frame of drawing due to resize.
            state.resizedOnce = false;
        }

        // Re-check after the draw pass (e.g., resizedOnce may have flipped to false).
        const canDrawAfter = this._computeCanDraw();
        if (!canDrawAfter) {
            this._running = false;

            if (this._rafId !== null) {
                cancelAnimationFrame(this._rafId);
                this._rafId = null;
            }

            for (const id of Object.keys(this.drawVisualIDs)) {
                this.drawVisualIDs[id] = null;
            }
            return;
        }
        if (!this._running) return;

        this._rafId = requestAnimationFrame(this.draw);
        for (const id of Object.keys(this.drawVisualIDs)) {
            this.drawVisualIDs[id] = this._rafId;
        }
    }
    /**
     * Reconnects synths to analyser.
     *
     * @param turtle
     * @returns {void}
     */
    reconnectSynthsToAnalyser = turtle => {
        if (this.pitchAnalysers[turtle] === undefined) {
            this.pitchAnalysers[turtle] = new Tone.Analyser({
                type: "waveform",
                size: Oscilloscope.analyserSize
            });
        }

        for (const synth in instruments[turtle])
            instruments[turtle][synth].connect(this.pitchAnalysers[turtle]);
    };
    /**
     * Makes the canvas.
     *
     * @param {number} width
     * @param {number} height
     * @param turtle
     * @param turtleIdx
     * @returns {void}
     */
    makeCanvas = (width, height, turtle, turtleIdx, resized) => {
        const canvas = document.createElement("canvas");
        canvas.height = height;
        canvas.width = width;
        canvas.className = "oscilloscopeCanvas";
        this.widgetWindow.getWidgetBody().appendChild(canvas);
        const canvasCtx = canvas.getContext("2d");
        canvasCtx.clearRect(0, 0, width, height);

        // Only allow one frame due to resize.
        let resizedOnce = resized;

        this._canvasState[turtleIdx] = {
            canvas,
            canvasCtx,
            width,
            height,
            turtle,
            turtleIdx,
            resizedOnce
        };

        // Ensure IDs exist before any cancel calls.
        this.drawVisualIDs[turtleIdx] = null;
    };
    /**
     * @private
     * @returns {void}
     */
    _scale() {
        let width, height;
        const canvas = document.getElementsByClassName("oscilloscopeCanvas");
        Array.prototype.forEach.call(canvas, ele => {
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
        const allCanvases = document.getElementsByTagName("canvas");
        if (allCanvases && allCanvases.length > 0) {
            allCanvases[0].innerHTML = "";
        }
        for (const turtle of this.divisions) {
            const turtleIdx = this.activity.turtles.getIndexOfTurtle(turtle);
            this.reconnectSynthsToAnalyser(turtleIdx);
            this.makeCanvas(width, height / this.divisions.length, turtle, turtleIdx, true);
        }

        // Kick off a draw pass (and RAF if needed).
        if (this.divisions.length > 0) {
            const firstTurtleIdx = this.activity.turtles.getIndexOfTurtle(this.divisions[0]);
            this._running = true;
            this.draw(firstTurtleIdx);
        }
    }
}
