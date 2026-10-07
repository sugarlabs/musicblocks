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

/* exported TempoRows */

/**
 * @file TempoRows.js
 * @description Tempo widget rows: one row per BPM block, with the speed up and slow down
 * buttons, the BPM input and the metronome canvas, and setting the tempo by clicking the canvas.
 *
 * The methods are moved as they were from the Tempo class, which copies them onto
 * Tempo.prototype (see Tempo.installModules), so `this` is still the widget.
 */
class TempoRows {
    /**
     * Builds a row for each BPM in the widget body: speed up, slow down, the BPM input and the
     * metronome canvas.
     * @private
     * @param {WidgetWindow} widgetWindow - The widget window.
     * @returns {void}
     */
    _makeRows(widgetWindow) {
        let r1, r2, r3, tcCell;
        for (let i = 0; i < this.BPMs.length; i++) {
            this._directions.push(1);
            this._widgetFirstTimes.push(this.activity.logo.firstNoteTime);
            if (this.BPMs[i] <= 0) {
                this.BPMs[i] = 30;
            }

            this._intervals.push((60 / this.BPMs[i]) * 1000);
            this._widgetNextTimes.push(this._widgetFirstTimes[i] - this._intervals[i]);

            r1 = this.bodyTable.insertRow();
            r2 = this.bodyTable.insertRow();
            r3 = this.bodyTable.insertRow();
            widgetWindow.addButton(
                "up.svg",
                Tempo.ICONSIZE,
                _("speed up"),
                r1.insertCell()
            ).onclick = (
                i => () =>
                    this.speedUp(i)
            )(i);
            widgetWindow.addButton(
                "down.svg",
                Tempo.ICONSIZE,
                _("slow down"),
                r2.insertCell()
            ).onclick = (
                i => () =>
                    this.slowDown(i)
            )(i);

            this.BPMInputs[i] = widgetWindow.addInputButton(this.BPMs[i], r3.insertCell());
            this.BPMInputs[i].addEventListener("focus", () => {
                this.activeBPMIndex = i;
            });
            this.tempoCanvases[i] = document.createElement("canvas");
            this.tempoCanvases[i].style.width = Tempo.TEMPOWIDTH + "px";
            this.tempoCanvases[i].style.height = Tempo.TEMPOHEIGHT + "px";
            this.tempoCanvases[i].style.margin = "1px";
            this.tempoCanvases[i].style.background = "rgba(255, 255, 255, 1)";
            tcCell = r1.insertCell();
            tcCell.appendChild(this.tempoCanvases[i]);
            tcCell.setAttribute("rowspan", "3");

            // The tempo can be set from the interval between successive clicks on the canvas.
            this.tempoCanvases[i].style.cursor = "pointer";
            this.tempoCanvases[i].title = _("Click to tap tempo");
            this.tempoCanvases[i].onclick = (
                id => () =>
                    this._onCanvasClick(id)
            )(i);

            this.BPMInputs[i].addEventListener(
                "keyup",
                (id => e => {
                    this.activeBPMIndex = id;
                    if (e.key === "Enter") {
                        this._useBPM(id);
                    }
                })(i)
            );
        }
    }

    /**
     * Sets the tempo of a row from the interval between two clicks on its canvas.
     * @private
     * @param {number} id - The row.
     * @returns {void}
     */
    _onCanvasClick(id) {
        if (this._lastCanvasIndex !== id) {
            this._firstClickTime = null;
            this._lastCanvasIndex = id;
        }
        this.activeBPMIndex = id;
        const d = new Date();
        let newBPM, BPMInput;
        if (this._firstClickTime === null) {
            this._firstClickTime = d.getTime();
        } else {
            newBPM = parseInt((60 * 1000) / (d.getTime() - this._firstClickTime), 10);
            if (newBPM > 29 && newBPM < 1001) {
                this.BPMs[id] = newBPM;
                this._updateBPM(id);
                BPMInput = this.BPMInputs[id];
                BPMInput.value = this.BPMs[id];
                this._firstClickTime = null;
            } else {
                this._firstClickTime = d.getTime();
            }
        }
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = TempoRows;
}
