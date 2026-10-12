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

/* exported TempoWindow */

/**
 * @file TempoWindow.js
 * @description Tempo widget window: closing the window and its timers, the toolbar (pause/play,
 * save and tap tempo buttons), and toggling the metronome between playing and paused.
 *
 * The methods are moved as they were from the Tempo class, which copies them onto
 * Tempo.prototype (see Tempo.installModules), so `this` is still the widget.
 */
class TempoWindow {
    /**
     * Removes the keyboard handler, clears the tap timers and the metronome interval, and
     * destroys the widget window.
     * @private
     * @param {WidgetWindow} widgetWindow - The widget window being closed.
     * @returns {void}
     */
    _closeWindow(widgetWindow) {
        this._removeKeyHandler();
        if (this._tapTimeout) {
            if (widgetWindow.timerManager) {
                widgetWindow.timerManager.clearTimeout(this._tapTimeout);
            } else {
                clearTimeout(this._tapTimeout);
            }
            this._tapTimeout = null;
        }
        if (this._tapButtonTimeout) {
            if (widgetWindow.timerManager) {
                widgetWindow.timerManager.clearTimeout(this._tapButtonTimeout);
            } else {
                clearTimeout(this._tapButtonTimeout);
            }
            this._tapButtonTimeout = null;
        }
        this._tapTimes = [];
        this._lastTapIndex = null;
        if (this._intervalID !== null) {
            widgetWindow.timerManager.clearInterval(this._intervalID);
        }
        widgetWindow.destroy();
    }

    /**
     * Adds the pause/play, save tempo and tap tempo buttons to the widget toolbar.
     * @private
     * @param {WidgetWindow} widgetWindow - The widget window.
     * @returns {void}
     */
    _addToolbar(widgetWindow) {
        const pauseBtn = widgetWindow.addButton("pause-button.svg", Tempo.ICONSIZE, _("Pause"));
        this.pauseBtn = pauseBtn;
        pauseBtn.onclick = () => {
            if (this.isMoving) {
                this.pause();
                // Use createElement to safely update button icon
                const playImg = document.createElement("img");
                playImg.src = "header-icons/play-button.svg";
                playImg.title = _("Play");
                playImg.alt = _("Play");
                playImg.height = Tempo.ICONSIZE;
                playImg.width = Tempo.ICONSIZE;
                playImg.style.verticalAlign = "middle";
                pauseBtn.textContent = "";
                pauseBtn.appendChild(playImg);
                this.isMoving = false;
            } else {
                this.resume();
                // Use createElement to safely update button icon
                const pauseImg = document.createElement("img");
                pauseImg.src = "header-icons/pause-button.svg";
                pauseImg.title = _("Pause");
                pauseImg.alt = _("Pause");
                pauseImg.height = Tempo.ICONSIZE;
                pauseImg.width = Tempo.ICONSIZE;
                pauseImg.style.verticalAlign = "middle";
                pauseBtn.textContent = "";
                pauseBtn.appendChild(pauseImg);
                this.isMoving = true;
            }
        };

        this._save_lock = false;
        widgetWindow.addButton("export-chunk.svg", Tempo.ICONSIZE, _("Save tempo"), "").onclick =
            () => {
                // Debounce button
                if (!this._get_save_lock()) {
                    this._save_lock = true;
                    this._saveTempo();
                    if (this.widgetWindow && this.widgetWindow.timerManager) {
                        this.widgetWindow.timerManager.setTimeout(
                            () => (this._save_lock = false),
                            1000
                        );
                    } else {
                        setTimeout(() => (this._save_lock = false), 1000);
                    }
                }
            };

        const tapBtn = widgetWindow.addButton("tap-button.svg", Tempo.ICONSIZE, _("Tap tempo"));
        this.tapBtn = tapBtn;
        tapBtn.onclick = () => {
            const id =
                this.activeBPMIndex >= 0 && this.activeBPMIndex < this.BPMs.length
                    ? this.activeBPMIndex
                    : 0;
            this.tapTempo(id);
        };
    }

    /**
     * @public
     * @returns {void}
     */
    togglePlayPause() {
        if (this.pauseBtn && typeof this.pauseBtn.onclick === "function") {
            this.pauseBtn.onclick();
        } else if (this.isMoving) {
            this.pause();
            this.isMoving = false;
        } else {
            this.resume();
            this.isMoving = true;
        }
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = TempoWindow;
}
