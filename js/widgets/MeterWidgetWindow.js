/**
 * MusicBlocks
 *
 * @copyright 2019-21 Walter Bender
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
   _, Singer, last, clampNumber, MeterWidget
 */

/*
   Globals location
    - js/utils/utils.js
        _, last
    - js/utils/utils-logic.js
        clampNumber
    - js/turtle-singer.js
        Singer
    - js/widgets/meterwidget.js
        MeterWidget
*/

/* exported MeterWidgetWindow */

/**
 * @file MeterWidgetWindow.js
 * @description Meter widget window: the Play button, the number of beats and beat note value
 * inputs, Reset, closing and scaling the window.
 *
 * The methods are moved from the MeterWidget class, which copies them onto
 * MeterWidget.prototype (see MeterWidget.installModules), so `this` is still the widget.
 */
class MeterWidgetWindow {
    /**
     * Callback for the widget window close event.
     *
     * @private
     * @returns {void}
     */
    _close() {
        this._stopPlayback();
        if (Singer && Singer.masterVolume && Singer.masterVolume.length > 0) {
            this.activity.logo.synth.setMasterVolume(last(Singer.masterVolume));
        }
        this.activity.hideMsgs();
        this.widgetWindow.destroy();
    }

    /**
     * Private method to scale the widget.
     *
     * @private
     * @returns {void}
     */
    _scale() {
        const windowHeight =
            this.getWidgetFrame().offsetHeight - this.getDragElement().offsetHeight;
        const svg = this.getWidgetBody().getElementsByTagName("svg")[0];
        const scale = this.isMaximized() ? windowHeight / 400 : 1;
        svg.style.pointerEvents = "none";
        svg.setAttribute("height", `${400 * scale}px`);
        svg.setAttribute("width", `${400 * scale}px`);
        setTimeout(() => {
            svg.style.pointerEvents = "auto";
        }, 100);
    }

    /**
     * Private method to get the click lock status.
     *
     * @private
     * @returns {boolean} - The click lock status.
     */
    _get_click_lock() {
        return this._click_lock;
    }

    /**
     * Shows the Play or the Stop icon on the play button.
     *
     * @private
     * @param {HTMLElement} playBtn
     * @param {string} icon - The icon file in header-icons.
     * @param {string} label - The translated tooltip.
     * @returns {void}
     */
    _setPlayButtonIcon(playBtn, icon, label) {
        playBtn.textContent = "  ";
        const img = document.createElement("img");
        img.src = "header-icons/" + icon;
        img.title = label;
        img.alt = label;
        img.setAttribute("height", MeterWidget.ICONSIZE);
        img.setAttribute("width", MeterWidget.ICONSIZE);
        img.setAttribute("vertical-align", "middle");
        playBtn.appendChild(img);
        playBtn.appendChild(document.createTextNode("  "));
    }

    /**
     * Adds the button that starts and stops the beats.
     *
     * @private
     * @returns {HTMLElement} The button.
     */
    _makePlayButton() {
        const playBtn = this.widgetWindow.addButton(
            "play-button.svg",
            MeterWidget.ICONSIZE,
            _("Play")
        );
        playBtn.onclick = () => {
            if (this._get_click_lock()) {
                return;
            } else {
                this._click_lock = true;
                if (this.__getPlayingStatus()) {
                    this._setPlayButtonIcon(playBtn, "play-button.svg", _("Play"));
                    this._stopPlayback();
                } else {
                    this._setPlayButtonIcon(playBtn, "stop-button.svg", _("Stop"));
                    this._playing = true;
                    this.activity.logo.turtleDelay = 0;
                    this.activity.logo.resetSynth(0);
                    this._playBeat();
                }
            }

            setTimeout(() => {
                this._click_lock = false;
            }, 1000);
        };
        return playBtn;
    }

    /**
     * Adds the number of beats and beat note value inputs to the toolbar.
     *
     * @private
     * @param {object} meter - What _readMeterBlock returned.
     * @returns {void}
     */
    _makeInputs(meter) {
        const divInput = document.createElement("div");
        divInput.className = "wfbtItem";
        const input1 = document.createElement("input");
        input1.style.cssFloat = "left";
        input1.value = meter.beats;
        input1.type = "number";
        input1.id = "beatCount";
        input1.setAttribute("min", "1");
        input1.setAttribute("max", "16");
        input1.setAttribute("aria-label", _("Number of beats"));
        divInput.appendChild(input1);

        const divInput2 = document.createElement("div");
        divInput2.className = "wfbtItem";
        const input2 = document.createElement("input");
        input2.style.cssFloat = "left";
        input2.value = this._noteValue(meter);
        input2.type = "number";
        input2.id = "beatValue";
        input2.setAttribute("min", "1");
        input2.setAttribute("max", "35");
        input2.setAttribute("aria-label", _("Beat note value"));
        divInput2.appendChild(input2);

        this.widgetWindow._toolbar.appendChild(divInput);
        this.widgetWindow._toolbar.appendChild(divInput2);

        this._beatCountInput = input1;
        this._noteValueInput = input2;
    }

    /**
     * Writes the toolbar values into the Meter block and runs the widget block again, which
     * draws the widget with the new meter.
     *
     * @private
     * @param {object} meter - What _readMeterBlock returned.
     * @returns {void}
     */
    _reset(meter) {
        this._stopPlayback();
        const el = this._beatCountInput;
        const el2 = this._noteValueInput;

        el.value = clampNumber(Math.round(Number(el.value)), Number(el.min), Number(el.max));
        el2.value = clampNumber(Math.round(Number(el2.value)), Number(el2.min), Number(el2.max));

        this._writeMeterBlock(meter, Number(el.value), Number(el2.value));

        this.activity.logo.runLogoCommands(this._widgetBlock);
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = MeterWidgetWindow;
}
