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

/* global _, SMALLERBUTTON, BIGGERBUTTON, Tone, instruments */

/* exported Oscilloscope */

/**
 * @class
 * @classdesc pertains to setting up all features of the Oscilloscope Widget.
 */
class Oscilloscope {
    static ICONSIZE = 32;
    static analyserSize = 8192;
    /**
     * @constructor
     * @param {Object} logo - object of Logo
     */
    constructor(logo) {
        this._logo = logo;
        this.pitchAnalysers = {};
        this.playingNow = false;
        if (this.drawVisualIDs) {
            for (const id of Object.keys(this.drawVisualIDs)) {
                cancelAnimationFrame(this.drawVisualIDs[id]);
            }
        }

        this.drawVisualIDs = {};
        const widgetWindow = window.widgetWindows.windowFor(this, "oscilloscope");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();

        widgetWindow.onclose = () => {
            for (const turtle of this.divisions) {
                const turtleIdx = logo.turtles.turtleList.indexOf(turtle);
                cancelAnimationFrame(this.drawVisualIDs[turtleIdx]);
            }

            this.pitchAnalysers = {};
            widgetWindow.destroy();
        };

        const step = 10;
        this.zoomFactor = 40.0;
        this.verticalOffset = 0;
        const zoomInButton = widgetWindow.addButton("", Oscilloscope.ICONSIZE, _("ZOOM IN"));

        zoomInButton.onclick = () => {
            this.zoomFactor += step;
        };
        zoomInButton.children[0].src = `data:image/svg+xml;base64,${window.btoa(
            unescape(encodeURIComponent(SMALLERBUTTON))
        )}`;

        const zoomOutButton = widgetWindow.addButton("", Oscilloscope.ICONSIZE, _("ZOOM OUT"));

        zoomOutButton.onclick = () => {
            this.zoomFactor -= step;
        };

        zoomOutButton.children[0].src = `data:image/svg+xml;base64,${window.btoa(
            unescape(encodeURIComponent(BIGGERBUTTON))
        )}`;

        widgetWindow.sendToCenter();
        this.widgetWindow = widgetWindow;
        this.divisions = [];

        for (const turtle of logo.oscilloscopeTurtles) {
            if (turtle && !turtle.inTrash) this.divisions.push(turtle);
        }

        for (const turtle of this.divisions) {
            const turtleIdx = logo.turtles.turtleList.indexOf(turtle);
            this.reconnectSynthsToAnalyser(turtleIdx);
            this.makeCanvas(700, 400 / this.divisions.length, turtle, turtleIdx);
        }
        if (!this.playingNow) {
            // console.debug("oscilloscope running");
        }
    }
    /**
     * Reconnects synths to analyser.
     *
     * @param turtle
     * @returns {void}
     */
    reconnectSynthsToAnalyser = (turtle) => {
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
    makeCanvas = (width, height, turtle, turtleIdx) => {
        const canvas = document.createElement("canvas");
        canvas.height = height;
        canvas.width = width;
        this.widgetWindow.getWidgetBody().appendChild(canvas);
        const canvasCtx = canvas.getContext("2d");
        canvasCtx.clearRect(0, 0, width, height);

        const draw = () => {
            this.drawVisualIDs[turtleIdx] = requestAnimationFrame(draw);
            if (!turtle.running) return;

            canvasCtx.fillStyle = "rgb(200, 200, 200)";
            const dataArray = this.pitchAnalysers[turtleIdx].getValue();
            const bufferLength = dataArray.length;
            canvasCtx.fillRect(0, 0, width, height);
            canvasCtx.lineWidth = 2;
            const rbga = turtle.painter._canvasColor;
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
            canvasCtx.lineTo(canvas.width, canvas.height / 2);
            canvasCtx.stroke();
        };
        draw();
    };
}
