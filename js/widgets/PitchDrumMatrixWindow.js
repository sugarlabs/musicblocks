/**
 * MusicBlocks
 *
 * @copyright 2016-21 Walter Bender
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

   _, docById, PitchDrumMatrix
*/
/*
    Globals location
    - js/utils/utils.js
        _, docById
    - js/widgets/pitchdrummatrix.js
        PitchDrumMatrix
*/

/* exported PitchDrumMatrixWindow */

/**
 * @file PitchDrumMatrixWindow.js
 * @description Pitch-Drum Matrix window: the Play, Save and Clear buttons, closing the window, and
 * resizing on maximize.
 *
 * The methods are moved as they were from the PitchDrumMatrix class, which copies them onto
 * PitchDrumMatrix.prototype (see PitchDrumMatrix.installModules), so `this` is still the widget.
 */
class PitchDrumMatrixWindow {
    /**
     * Adds the Play, Save and Clear buttons to the widget window.
     *
     * @private
     * @param {WidgetWindow} widgetWindow - The widget window.
     * @returns {void}
     */
    _addToolbar(widgetWindow) {
        /**
         * The button to play all sounds associated with the matrix.
         *
         * @type {HTMLButtonElement}
         */
        this.playButton = widgetWindow.addButton(
            "play-button.svg",
            PitchDrumMatrix.ICONSIZE,
            _("Play")
        );

        this.playButton.onclick = () => {
            this._playing = !this._playing;
            this.activity.logo.turtleDelay = 0;
            this._playAll();
        };

        /**
         * Flag indicating whether saving operation is locked.
         *
         * @type {boolean}
         * @private
         */
        this._save_lock = false;
        widgetWindow.addButton("export-chunk.svg", PitchDrumMatrix.ICONSIZE, _("Save")).onclick =
            () => {
                // Debounce button
                if (!this._get_save_lock()) {
                    this._save_lock = true;
                    this._save();
                    setTimeout(() => {
                        this._save_lock = false;
                    }, 1000);
                }
            };

        widgetWindow.addButton("erase-button.svg", PitchDrumMatrix.ICONSIZE, _("Clear")).onclick =
            () => {
                this._clear();
            };
    }

    /**
     * Stops playback and closes the widget window.
     *
     * @private
     * @param {WidgetWindow} widgetWindow - The widget window.
     * @returns {void}
     */
    _closeWindow(widgetWindow) {
        this._playing = false;
        this.activity.logo.synth.stop();
        this.pitchDrumDiv.style.visibility = "hidden";
        this.activity.hideMsgs();
        widgetWindow.destroy();
    }

    /**
     * Changes the widget size on fullscreen mode, or reverts back to the original size on
     * unfullscreen mode.
     *
     * @private
     * @param {WidgetWindow} widgetWindow - The widget window.
     * @returns {void}
     */
    _onMaximize(widgetWindow) {
        const outerDiv = docById("pdmOuterDiv");
        const innerDiv = docById("pdmInnerDiv");
        if (widgetWindow._maximized) {
            widgetWindow.getWidgetBody().style.position = "absolute";
            widgetWindow.getWidgetBody().style.height = "calc(-95px + 100vh)";
            widgetWindow.getWidgetBody().style.width = "calc(-55px + 100vw)";
            widgetWindow.getWidgetBody().style.left = "55px";
            outerDiv.style.height = widgetWindow.getWidgetBody().style.height;
            outerDiv.style.width = widgetWindow.getWidgetBody().style.width;
            innerDiv.style.height = widgetWindow.getWidgetBody().style.height;
            innerDiv.style.width = widgetWindow.getWidgetBody().style.width;
        } else {
            widgetWindow.getWidgetBody().style.position = "relative";
            widgetWindow.getWidgetBody().style.left = "0px";
            widgetWindow.getWidgetBody().style.height = "400px";
            widgetWindow.getWidgetBody().style.width = "500px";
            outerDiv.style.height = widgetWindow.getWidgetBody().style.height;
            outerDiv.style.width = widgetWindow.getWidgetBody().style.width;
            innerDiv.style.height = widgetWindow.getWidgetBody().style.height;
            innerDiv.style.width = widgetWindow.getWidgetBody().style.width;
        }
    }

    /**
     * Handles the scaling of the widget.
     *
     * @private
     * @returns {void}
     */
    _scale() {
        const windowHeight =
            this.getWidgetFrame().offsetHeight - this.getDragElement().offsetHeight;
        const widgetBody = this.getWidgetBody();
        const scale = this.isMaximized() ? windowHeight / widgetBody.offsetHeight : 1;
        widgetBody.style.display = "flex";
        widgetBody.style.flexDirection = "column";
        widgetBody.style.alignItems = "center";
        widgetBody.children[0].style.display = "flex";
        widgetBody.children[0].style.flexDirection = "column";
        widgetBody.children[0].style.alignItems = "center";

        const svg = this.getWidgetBody().getElementsByTagName("svg")[0];
        svg.style.pointerEvents = "none";
        svg.setAttribute("height", `${400 * scale}px`);
        svg.setAttribute("width", `${400 * scale}px`);
        setTimeout(() => {
            svg.style.pointerEvents = "auto";
        }, 100);
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = PitchDrumMatrixWindow;
}
