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
   _, Tempo
 */

/* exported TempoTap */

/**
 * @file TempoTap.js
 * @description Tempo widget tap tempo: setting a row's tempo from the average interval between
 * taps, flashing the tap button, and forgetting the taps after two seconds without one.
 *
 * The methods are moved as they were from the Tempo class, which copies them onto
 * Tempo.prototype (see Tempo.installModules), so `this` is still the widget.
 */
class TempoTap {
    /**
     * @private
     * @returns {void}
     */
    _flashTapButton() {
        if (!this.tapBtn) return;
        const activeImg = document.createElement("img");
        activeImg.src = "header-icons/tap-active-button.svg";
        activeImg.title = _("Tap tempo");
        activeImg.alt = _("Tap tempo");
        activeImg.height = Tempo.ICONSIZE;
        activeImg.width = Tempo.ICONSIZE;
        activeImg.style.verticalAlign = "middle";
        if (typeof this.tapBtn.replaceChildren === "function") {
            this.tapBtn.replaceChildren(activeImg);
        } else {
            this.tapBtn.textContent = "";
            if (typeof this.tapBtn.appendChild === "function") {
                this.tapBtn.appendChild(activeImg);
            }
        }

        if (this._tapButtonTimeout) {
            if (this.widgetWindow && this.widgetWindow.timerManager) {
                this.widgetWindow.timerManager.clearTimeout(this._tapButtonTimeout);
            } else {
                clearTimeout(this._tapButtonTimeout);
            }
            this._tapButtonTimeout = null;
        }

        const reset = () => {
            this._tapButtonTimeout = null;
            if (!this.tapBtn) return;
            const normalImg = document.createElement("img");
            normalImg.src = "header-icons/tap-button.svg";
            normalImg.title = _("Tap tempo");
            normalImg.alt = _("Tap tempo");
            normalImg.height = Tempo.ICONSIZE;
            normalImg.width = Tempo.ICONSIZE;
            normalImg.style.verticalAlign = "middle";
            if (typeof this.tapBtn.replaceChildren === "function") {
                this.tapBtn.replaceChildren(normalImg);
            } else {
                this.tapBtn.textContent = "";
                if (typeof this.tapBtn.appendChild === "function") {
                    this.tapBtn.appendChild(normalImg);
                }
            }
        };

        if (this.widgetWindow && this.widgetWindow.timerManager) {
            this._tapButtonTimeout = this.widgetWindow.timerManager.setTimeout(reset, 150);
        } else {
            this._tapButtonTimeout = setTimeout(reset, 150);
        }
    }

    /**
     * @private
     * @returns {void}
     */
    _scheduleTapReset() {
        const resetCallback = () => {
            this._tapTimes = [];
            this._tapTimeout = null;
            this._lastTapIndex = null;
        };
        if (this.widgetWindow && this.widgetWindow.timerManager) {
            this._tapTimeout = this.widgetWindow.timerManager.setTimeout(resetCallback, 2001);
        } else {
            this._tapTimeout = setTimeout(resetCallback, 2001);
        }
    }

    /**
     * Sets or adjusts BPM using a rolling average of successive taps.
     *
     * @public
     * @param {number} [id=0] - The index of the BPM to update.
     * @returns {number|null} The newly calculated BPM, or null on first tap.
     */
    tapTempo(id = 0) {
        if (!this.BPMs || this.BPMs.length === 0) {
            return null;
        }

        if (id < 0 || id >= this.BPMs.length) {
            id = 0;
        }
        this.activeBPMIndex = id;

        if (this._lastTapIndex !== id) {
            this._tapTimes = [];
            this._lastTapIndex = id;
        }

        const now = Date.now();
        this._flashTapButton();

        if (this._tapTimeout) {
            if (this.widgetWindow && this.widgetWindow.timerManager) {
                this.widgetWindow.timerManager.clearTimeout(this._tapTimeout);
            } else {
                clearTimeout(this._tapTimeout);
            }
            this._tapTimeout = null;
        }

        const lastTap = this._tapTimes[this._tapTimes.length - 1];
        if (!lastTap || now - lastTap > 2000) {
            this._tapTimes = [now];
            if (this.activity && typeof this.activity.textMsg === "function") {
                this.activity.textMsg(_("Tap again to set tempo"), 1500);
            }
            this._scheduleTapReset();
            return null;
        }

        this._tapTimes.push(now);
        if (this._tapTimes.length > 5) {
            this._tapTimes.shift();
        }

        let totalInterval = 0;
        for (let j = 1; j < this._tapTimes.length; j++) {
            totalInterval += this._tapTimes[j] - this._tapTimes[j - 1];
        }
        const avgInterval = totalInterval / (this._tapTimes.length - 1);

        if (avgInterval <= 0) {
            this._scheduleTapReset();
            return null;
        }

        let newBPM = Math.round((60 * 1000) / avgInterval);
        if (newBPM < 30) {
            newBPM = 30;
        } else if (newBPM > 1000) {
            newBPM = 1000;
        }

        this.BPMs[id] = newBPM;
        this._updateBPM(id);
        if (this.BPMInputs[id]) {
            this.BPMInputs[id].value = newBPM;
        }

        this._scheduleTapReset();
        return newBPM;
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = TempoTap;
}
