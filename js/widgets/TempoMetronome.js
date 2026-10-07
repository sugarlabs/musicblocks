/**
 * MusicBlocks
 *
 * @copyright 2016-21 Walter Bender
 * @copyright 2016 Hemant Kasat
 * @copyright 2026 Music Blocks contributors
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
   Tempo
 */

/* exported TempoMetronome */

/**
 * @file TempoMetronome.js
 * @description Tempo widget metronome: pausing and resuming it, and drawing each row's ball
 * bouncing across its canvas, with a click on every beat.
 *
 * The methods are moved as they were from the Tempo class, which copies them onto
 * Tempo.prototype (see Tempo.installModules), so `this` is still the widget.
 */
class TempoMetronome {
    /**
     * @public
     * @returns {void}
     */
    pause() {
        if (this.widgetWindow && this.widgetWindow.timerManager) {
            this.widgetWindow.timerManager.clearInterval(this._intervalID);
        } else {
            clearInterval(this._intervalID);
        }
    }

    /**
     * @public
     * @returns {void}
     */
    resume() {
        // Reset widget time since we are restarting. We will no longer keep synch with the turtles.
        const d = new Date();
        for (let i = 0; i < this.BPMs.length; i++) {
            this._widgetFirstTimes[i] = d.getTime();
            this._widgetNextTimes[i] = this._widgetFirstTimes[i] + this._intervals[i];
            this._directions[i] = 1;
        }

        // Restart the interval.
        if (this._intervalID !== null) {
            if (this.widgetWindow && this.widgetWindow.timerManager) {
                this.widgetWindow.timerManager.clearInterval(this._intervalID);
            } else {
                clearInterval(this._intervalID);
            }
        }

        if (this.widgetWindow && this.widgetWindow.timerManager) {
            this._intervalID = this.widgetWindow.timerManager.setInterval(() => {
                this._draw();
            }, Tempo.TEMPOINTERVAL);
        } else {
            this._intervalID = setInterval(() => {
                this._draw();
            }, Tempo.TEMPOINTERVAL);
        }
    }

    /**
     * @private
     * @returns {void}
     */
    _draw() {
        // First thing to do is figure out where we are supposed to be based on the elapsed time.
        const d = new Date();
        let tempoCanvas, deltaTime, dx, x, ctx;
        for (let i = 0; i < this.BPMs.length; i++) {
            tempoCanvas = this.tempoCanvases[i];
            if (!tempoCanvas) continue;

            // We start the music clock as the first note is being played.
            if (this._widgetFirstTimes[i] === null) {
                this._widgetFirstTimes[i] = d.getTime();
                this._widgetNextTimes[i] = this._widgetFirstTimes[i] + this._intervals[i];
            }

            // How much time has gone by?
            deltaTime = this._widgetNextTimes[i] - d.getTime();

            // Are we done yet?
            if (d.getTime() > this._widgetNextTimes[i]) {
                // Play a tone.
                this.activity.logo.synth.trigger(
                    0,
                    ["C2"],
                    0.0625,
                    Tempo.TEMPOSYNTH,
                    null,
                    null,
                    false
                );
                this._widgetNextTimes[i] += this._intervals[i];

                // If the loop fell behind (e.g. a throttled background tab), skip the
                // missed beats instead of replaying them one per frame. Keep the
                // beat phase so the next beat still lands on the original grid.
                let beatsPassed = 1;
                if (this._intervals[i] > 0 && d.getTime() >= this._widgetNextTimes[i]) {
                    const missed =
                        Math.floor((d.getTime() - this._widgetNextTimes[i]) / this._intervals[i]) +
                        1;
                    this._widgetNextTimes[i] += missed * this._intervals[i];
                    beatsPassed += missed;
                }

                // Ensure we are at the edge (flip once per beat that went by).
                if (beatsPassed % 2 === 1) {
                    this._directions[i] = this._directions[i] === -1 ? 1 : -1;
                }
            } else {
                // Determine new x position based on delta time.
                if (this._intervals[i] !== 0) {
                    dx = tempoCanvas.width * (deltaTime / this._intervals[i]);
                } else {
                    dx = 0;
                }

                // Set this._xradius based on the dx to achieve the compressing effect
                if (tempoCanvas.width - dx <= Tempo.YRADIUS / 3) {
                    this._xradius = tempoCanvas.width - dx;
                } else if (dx <= Tempo.YRADIUS / 3) {
                    this._xradius = dx;
                } else {
                    this._xradius = Tempo.YRADIUS / 3;
                }

                // Set x based on dx and direction
                if (this._directions[i] === -1) {
                    x = tempoCanvas.width - dx;
                } else {
                    x = dx;
                }
            }

            // Set x value if it is undefined
            if (x === undefined) {
                if (this._directions[i] === -1) {
                    x = 0;
                } else {
                    x = tempoCanvas.width;
                }
            }

            ctx = tempoCanvas.getContext("2d");
            ctx.clearRect(0, 0, tempoCanvas.width, tempoCanvas.height);
            ctx.beginPath();
            ctx.fillStyle = "rgba(0,0,0,1)";
            ctx.ellipse(
                x,
                Tempo.YRADIUS,
                Math.max(this._xradius, 1),
                Tempo.YRADIUS,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();
            ctx.closePath();
        }
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = TempoMetronome;
}
