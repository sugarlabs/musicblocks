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

/* exported TempoKeyboard */

/**
 * @file TempoKeyboard.js
 * @description Tempo widget keyboard shortcuts: the up and down arrows change the tempo of the
 * active row (by 1 BPM, or 10% with Shift), Space pauses and plays, and T taps the tempo.
 *
 * The methods are moved as they were from the Tempo class, which copies them onto
 * Tempo.prototype (see Tempo.installModules), so `this` is still the widget.
 */
class TempoKeyboard {
    /**
     * Listens for the widget's keyboard shortcuts while its window is focused.
     * @private
     * @param {WidgetWindow} widgetWindow - The widget window.
     * @returns {void}
     */
    _addKeyHandler(widgetWindow) {
        this._keyHandler = event => this._onKeyDown(event, widgetWindow);

        document.addEventListener("keydown", this._keyHandler, true);
    }

    /**
     * Stops listening for the widget's keyboard shortcuts.
     * @private
     * @returns {void}
     */
    _removeKeyHandler() {
        if (this._keyHandler) {
            document.removeEventListener("keydown", this._keyHandler, true);
            this._keyHandler = null;
        }
    }

    /**
     * Handles a key press: ignored unless the widget window is focused and no block, input or
     * button has the keyboard.
     * @private
     * @param {KeyboardEvent} event - The key press.
     * @param {WidgetWindow} widgetWindow - The widget window.
     * @returns {void}
     */
    _onKeyDown(event, widgetWindow) {
        if (
            typeof window === "undefined" ||
            !window.widgetWindows ||
            window.widgetWindows.focused !== widgetWindow
        ) {
            return;
        }

        if (
            this.activity &&
            this.activity.blocks &&
            this.activity.blocks.activeBlock !== null &&
            this.activity.blocks.activeBlock !== undefined
        ) {
            return;
        }

        const activeElement = document.activeElement;
        if (
            activeElement &&
            (activeElement.tagName === "INPUT" ||
                activeElement.tagName === "TEXTAREA" ||
                activeElement.isContentEditable)
        ) {
            return;
        }

        if (
            activeElement &&
            (activeElement.tagName === "BUTTON" || activeElement.tagName === "SELECT")
        ) {
            return;
        }

        if (!this.BPMs || this.BPMs.length === 0) {
            return;
        }

        const id =
            this.activeBPMIndex >= 0 && this.activeBPMIndex < this.BPMs.length
                ? this.activeBPMIndex
                : 0;

        if (event.key === "ArrowUp" || event.code === "ArrowUp" || event.keyCode === 38) {
            event.preventDefault();
            event.stopPropagation();
            if (event.shiftKey) {
                this.speedUp(id);
            } else {
                this.speedUp(id, 1);
            }
            return;
        }

        if (event.key === "ArrowDown" || event.code === "ArrowDown" || event.keyCode === 40) {
            event.preventDefault();
            event.stopPropagation();
            if (event.shiftKey) {
                this.slowDown(id);
            } else {
                this.slowDown(id, 1);
            }
            return;
        }

        if (event.key === " " || event.code === "Space" || event.keyCode === 32) {
            event.preventDefault();
            event.stopPropagation();
            this.togglePlayPause();
            return;
        }

        if (event.key === "t" || event.key === "T" || event.code === "KeyT") {
            event.preventDefault();
            event.stopPropagation();
            this.tapTempo(id);
        }
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = TempoKeyboard;
}
