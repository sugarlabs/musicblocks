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
import { base64Encode } from "../base64Utils";
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
        this.activity = activity;
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
                const turtleIdx = this.activity.turtles.turtleList.indexOf(turtle);
                cancelAnimationFrame(this.drawVisualIDs[turtleIdx]);
            }

            this.pitchAnalysers = {};
            widgetWindow.destroy();
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
    makeCanvas = (width, height, turtle, turtleIdx, resized) => {
        const canvas = document.createElement("canvas");
        canvas.height = height;
        canvas.width = width;
        canvas.className = "oscilloscopeCanvas";
        this.widgetWindow.getWidgetBody().appendChild(canvas);
        const canvasCtx = canvas.getContext("2d");
        canvasCtx.clearRect(0, 0, width, height);

        const draw = () => {
            this.drawVisualIDs[turtleIdx] = requestAnimationFrame(draw);
            if (this.pitchAnalysers[turtleIdx] && (turtle.running || resized)) {
                canvasCtx.fillStyle = "#FFFFFF";
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
            }
        };
        draw();
    };
    /**
     * @private
     * @returns {void}
     */
    _scale() {
        let width, height;
        const canvas = document.getElementsByClassName("oscilloscopeCanvas");
        Array.prototype.forEach.call(canvas, (ele) => {
            this.widgetWindow.getWidgetBody().removeChild(ele);
        });
        if (!this.widgetWindow.isMaximized()) {
            width = 700;
            height = 400;
        } else {
            width = this.widgetWindow.getWidgetBody().getBoundingClientRect().width;
            height = this.widgetWindow.getWidgetFrame().getBoundingClientRect().height - 70;
        }
        document.getElementsByTagName("canvas")[0].innerHTML = "";
        for (const turtle of this.divisions) {
            const turtleIdx = this.activity.turtles.turtleList.indexOf(turtle);
            this.reconnectSynthsToAnalyser(turtleIdx);
            this.makeCanvas(width, height / this.divisions.length, turtle, turtleIdx, true);
        }
    }
}
