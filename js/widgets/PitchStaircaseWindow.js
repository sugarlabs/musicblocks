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

   _, PREVIEWVOLUME, Singer, last, announceToScreenReader, PitchStaircase
*/
/*
    Globals location
    - js/utils/utils.js
        _, last, announceToScreenReader
    - js/logoconstants.js
        PREVIEWVOLUME
    - js/turtle-singer.js
        Singer
    - js/widgets/pitchstaircase.js
        PitchStaircase
*/

/* exported PitchStaircaseWindow */

/**
 * @file PitchStaircaseWindow.js
 * @description Pitch Staircase window: opening and closing the widget window, its toolbar (play
 * chord, play scale, save, the two ratio inputs, undo and clear), and resizing on maximize.
 *
 * The methods are moved as they were from PitchStaircase.init, which copies them onto
 * PitchStaircase.prototype (see PitchStaircase.installModules), so `this` is still the widget.
 */
class PitchStaircaseWindow {
    /**
     * Opens the widget window and sets the preview volume.
     * @private
     * @returns {WidgetWindow} The widget window.
     */
    _openWindow() {
        const widgetWindow = window.widgetWindows.windowFor(
            this,
            "pitch staircase",
            "pitch staircase",
            true
        );
        announceToScreenReader(_("Pitch Staircase opened"));
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();
        widgetWindow.onclose = () => {
            this._closeWindow(widgetWindow);
        };

        this.closed = false;
        this.activity.logo.synth.setMasterVolume(PREVIEWVOLUME);

        return widgetWindow;
    }

    /**
     * Stops all playback, restores the master volume and closes the widget window.
     * @private
     * @param {WidgetWindow} widgetWindow - The widget window.
     * @returns {void}
     */
    _closeWindow(widgetWindow) {
        this.closed = true;
        this._cancelPlayback();
        this.activity.logo.synth.stop();
        // Restore the project's master volume so audio still works
        // after exiting mid-playback (was incorrectly left at PREVIEWVOLUME).
        if (Singer && Singer.masterVolume && Singer.masterVolume.length > 0) {
            this.activity.logo.synth.setMasterVolume(last(Singer.masterVolume));
        }
        announceToScreenReader(_("Pitch Staircase closed"));
        widgetWindow.destroy();
    }

    /**
     * Adds the toolbar buttons and the two ratio inputs.
     * @private
     * @param {WidgetWindow} widgetWindow - The widget window.
     * @returns {void}
     */
    _addToolbar(widgetWindow) {
        this._playAllButton = widgetWindow.addButton(
            "play-chord.svg",
            PitchStaircase.ICONSIZE,
            _("Play chord")
        );
        this._playAllButton.onclick = () => {
            if (this._isPlayingAll) {
                this._stopChord();
            } else {
                this._playAll();
            }
        };

        this._playScaleButton = widgetWindow.addButton(
            "play-scale.svg",
            PitchStaircase.ICONSIZE,
            _("Play scale")
        );
        this._playScaleButton.onclick = () => {
            if (this._isPlayingScale) {
                this._stopScale();
            } else {
                this.playUpAndDown();
            }
        };

        this._save_lock = false;
        widgetWindow.addButton("export-chunk.svg", PitchStaircase.ICONSIZE, _("Save")).onclick =
            () => {
                // Debounce button
                if (!this._get_save_lock()) {
                    this._save_lock = true;
                    try {
                        this._save();
                    } finally {
                        setTimeout(() => {
                            this._save_lock = false;
                        }, 1000);
                    }
                }
            };
        const wfbWidget = widgetWindow.getWidgetBody();
        if (wfbWidget && wfbWidget.style) {
            wfbWidget.style.maxHeight = 10 * PitchStaircase.BUTTONSIZE + "px";
            wfbWidget.style.overflowY = "scroll";
        }
        this._musicRatio1 = widgetWindow.addInputButton("3");
        widgetWindow.addDivider();
        this._musicRatio2 = widgetWindow.addInputButton("2");

        widgetWindow.addButton("restore-button.svg", PitchStaircase.ICONSIZE, _("Undo")).onclick =
            () => {
                this._undo();
            };

        widgetWindow.addButton("erase-button.svg", PitchStaircase.ICONSIZE, _("Clear")).onclick =
            () => {
                while (this._undo());
            };
    }

    /**
     * Lets the table of stairs grow when the window is maximized.
     * @private
     * @param {WidgetWindow} widgetWindow - The widget window.
     * @returns {void}
     */
    _onMaximize(widgetWindow) {
        const body = widgetWindow.getWidgetBody();
        if (body && body.style) {
            const isMax =
                typeof widgetWindow.isMaximized === "function"
                    ? widgetWindow.isMaximized()
                    : widgetWindow._maximized;
            if (isMax) {
                body.style.maxHeight = 16 * PitchStaircase.BUTTONSIZE + "px";
            } else {
                body.style.maxHeight = 10 * PitchStaircase.BUTTONSIZE + "px";
            }
        }
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = PitchStaircaseWindow;
}
