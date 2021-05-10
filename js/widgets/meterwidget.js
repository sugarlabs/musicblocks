// Copyright (c) 2019-21 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* global

   Singer, _, last, platformColor, docById, wheelnav, slicePath,
   PREVIEWVOLUME, TONEBPM
*/

/*
     Globals location
     - lib/wheelnav
         slicePath, wheelnav
     
     - js/utils/utils.js
         _, last, docById
     
     - js/turtle-singer.js
         Singer
     
     - js/utils/platformstyle.js
         platformColor
     
     - js/logo.js
         PREVIEWVOLUME, TONEBPM
*/

/*exported MeterWidget*/
class MeterWidget {
    // A pie menu is used to show the meter and strong beats
    static BUTTONDIVWIDTH = 535;
    static BUTTONSIZE = 53;
    static ICONSIZE = 32;

    /**
     * @param {number} widgetBlock
     */
    constructor(activity, widgetBlock) {
        this.activity = activity;
        this._meterBlock = this.activity.logo._meterBlock;
        this._strongBeats = [];
        this._playing = false;
        this._click_lock = false;
        this._beatValue = 1 / 4;

        const w = window.innerWidth;
        this._cellScale = w / 1200;

        const widgetWindow = window.widgetWindows.windowFor(this, "meter");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();

        this.activity.logo.synth.setMasterVolume(PREVIEWVOLUME);
        this.activity.logo.synth.loadSynth(0, "kick drum");
        Singer.setSynthVolume(this.activity.logo, 0, "kick drum", PREVIEWVOLUME);
        this.activity.logo.synth.loadSynth(0, "snare drum");
        Singer.setSynthVolume(this.activity.logo, 0, "snare drum", PREVIEWVOLUME);

        // For the button callbacks
        this.meterDiv = document.createElement("table");
        widgetWindow.getWidgetBody().append(this.meterDiv);

        widgetWindow.onclose = () => {
            this._playing = false;
            this.activity.hideMsgs();
            widgetWindow.destroy();
        };

        widgetWindow.onmaximize = this._scale;

        this._click_lock = false;
        const playBtn = widgetWindow.addButton("play-button.svg", MeterWidget.ICONSIZE, _("Play"));
        playBtn.onclick = () => {
            if (this._get_click_lock()) {
                return;
            } else {
                this._click_lock = true;
                if (this.__getPlayingStatus()) {
                    playBtn.innerHTML =
                        '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' +
                        _("Play all") +
                        '" alt="' +
                        _("Play all") +
                        '" height="' +
                        MeterWidget.ICONSIZE +
                        '" width="' +
                        MeterWidget.ICONSIZE +
                        '" vertical-align="middle">&nbsp;&nbsp;';
                    this._playing = false;
                } else {
                    playBtn.innerHTML =
                        '&nbsp;&nbsp;<img src="header-icons/stop-button.svg" title="' +
                        _("Stop") +
                        '" alt="' +
                        _("Stop") +
                        '" height="' +
                        MeterWidget.ICONSIZE +
                        '" width="' +
                        MeterWidget.ICONSIZE +
                        '" vertical-align="middle">&nbsp;&nbsp;';
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

        widgetWindow.addButton(
            "export-chunk.svg",
            MeterWidget.ICONSIZE,
            _("Save")
        ).onclick = () => {
            this._save();
        };

        // The pie menu goes here.
        const meterTableDiv = this.meterDiv;
        meterTableDiv.style.display = "inline";
        meterTableDiv.style.visibility = "visible";
        meterTableDiv.style.border = "0px";
        meterTableDiv.innerHTML = '<div id="meterWheelDiv"></div>';

        // Grab the number of beats and beat value from the meter block.
        let v1, c1, c2, c3;
        if (this._meterBlock !== null) {
            c1 = this.activity.blocks.blockList[this._meterBlock].connections[1];
            v1 = c1 !== null ? this.activity.blocks.blockList[c1].value : 4;
            c2 = this.activity.blocks.blockList[this._meterBlock].connections[2];
            c3 = this.activity.blocks.blockList[c2].connections[2];
            if (c2 !== null) {
                this._beatValue = this.activity.blocks.blockList[c2].value;
            }

            this._piemenuMeter(v1, this._beatValue);
        } else {
            this._piemenuMeter(4, this._beatValue);
        }

        const divInput = document.createElement("div");
        divInput.className = "wfbtItem";
        divInput.innerHTML =
            '<input style="float: left ;" value="' +
            v1 +
            '" type="number" id="beatValue" min="1" max="16" >';

        const divInput2 = document.createElement("div");
        divInput2.className = "wfbtItem";
        divInput2.innerHTML =
            '<input style="float: left;" value="' +
            1 / this._beatValue +
            '" type="number" id="beatValue" min="1" max="35">';

        widgetWindow._toolbar.appendChild(divInput);
        widgetWindow._toolbar.appendChild(divInput2);

        //TRANS.: Reset the widget layout
        widgetWindow.addButton("reload.svg", MeterWidget.ICONSIZE, _("Reset")).onclick = () => {
            //change Values of blocks in stack.
            this._playing = false;
            const el = divInput.children[0];
            const el2 = divInput2.children[0];

            divInput.children[0].value = Math.min(el.max, Math.max(el.min, el.value));
            divInput2.children[0].value = Math.min(el2.max, Math.max(el2.min, el2.value));

            const bnBlk = this.activity.blocks.blockList[c1]; // number of beats
            const bvBlk = this.activity.blocks.blockList[c3]; // beat value

            const bnValue = divInput.children[0].value;
            const bvValue = divInput2.children[0].value;

            bnBlk.value = bnValue;
            bnBlk.text.text = bnValue;
            bnBlk.container.setChildIndex(bnBlk.text, bnBlk.container.children.length - 1);

            bvBlk.value = bvValue;
            bvBlk.text.text = bvValue;
            bvBlk.container.setChildIndex(bvBlk.text, bvBlk.container.children.length - 1);

            this.activity.logo.runLogoCommands(widgetBlock);
        };

        this.activity.textMsg(_("Click in the circle to select strong beats for the meter."));
        widgetWindow.sendToCenter();
        this._scale.call(this.widgetWindow);
    }

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
     * @private
     * @returns {boolean}
     */
    _get_click_lock() {
        return this._click_lock;
    }

    /**
     * @private
     * @param {string} drum
     * @returns {void}
     */
    __playDrum(drum) {
        this.activity.logo.synth.trigger(0, "C4", Singer.defaultBPMFactor * this._beatValue, drum, null, null);
    }

    /**
     * @private
     * @returns {boolean}
     */
    __getPlayingStatus() {
        return this._playing;
    }

    /**
     * @private
     * @returns {boolean}
     */
    __getPauseStatus() {
        return !this._playing;
    }

    /**
     * @private
     * @param {number} i
     * @param {number} ms
     * @returns {void}
     */
    __playOneBeat(i, ms) {
        if (this.__getPauseStatus()) {
            for (let i = 0; i < this._strongBeats.length; i++) {
                this._playWheel.navItems[i].navItem.hide();
            }
            return;
        }

        let j = i - 1;
        if (j < 0) {
            j += this._strongBeats.length;
        }

        this._playWheel.navItems[i].navItem.show();
        this._playWheel.navItems[j].navItem.hide();

        if (this._strongBeats[i]) {
            this.__playDrum("snare drum");
        } else {
            this.__playDrum("kick drum");
        }

        setTimeout(() => {
            this.__playOneBeat((i + 1) % this._strongBeats.length, ms);
        }, ms);
    }

    /**
     * @private
     * @returns {void}
     */
    _playBeat() {
        const tur = this.activity.turtles.ithTurtle(0);
        const bpmFactor =
            TONEBPM / (tur.singer.bpm.length > 0 ? last(tur.singer.bpm) : Singer.masterBPM);
        for (let i = 0; i < this._strongBeats.length; i++) {
            this._playWheel.navItems[i].navItem.hide();
        }

        const noteBeatValue = bpmFactor * 1000 * this._beatValue;
        this.__playOneBeat(0, noteBeatValue);
    }

    /**
     * @deprecated
     */
    _addButton(row, icon, iconSize, label) {
        const cell = row.insertCell(-1);
        cell.innerHTML =
            '&nbsp;&nbsp;<img src="header-icons/' +
            icon +
            '" title="' +
            label +
            '" alt="' +
            label +
            '" height="' +
            iconSize +
            '" width="' +
            iconSize +
            '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
        cell.style.width = MeterWidget.BUTTONSIZE + "px";
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = cell.style.width;
        cell.style.minHeight = cell.style.height;
        cell.style.maxHeight = cell.style.height;
        cell.style.backgroundColor = platformColor.selectorBackground;

        cell.onmouseover = () => {
            this.style.backgroundColor = platformColor.selectorBackgroundHOVER;
        };

        cell.onmouseout = () => {
            this.style.backgroundColor = platformColor.selectorBackground;
        };

        return cell;
    }

    /**
     * @private
     * @returns {void}
     */
    _save() {
        // Export onbeatdo blocks for each strong beat
        const strongBeats = [];
        const newStack = [];

        const numberOfBeats = this._strongBeats.length;

        for (let i = 0; i < numberOfBeats; i++) {
            if (this._strongBeats[i]) {
                strongBeats.push(i);
            }
        }

        let n = 0;

        for (let i = 0; i < strongBeats.length; i++) {
            if (i === 0) {
                if (strongBeats.length === 1) {
                    newStack.push([0, "onbeatdo", 100, 100, [null, 1, 2, null]]);
                    newStack.push([1, ["number", { value: strongBeats[i] + 1 }], 0, 0, [0]]);
                    newStack.push([2, ["text", { value: "action" }], 0, 0, [0]]);
                } else {
                    newStack.push([0, "onbeatdo", 100, 100, [null, 1, 2, 3]]);
                    newStack.push([1, ["number", { value: strongBeats[i] + 1 }], 0, 0, [0]]);
                    newStack.push([2, ["text", { value: "action" }], 0, 0, [0]]);
                }
            } else if (i === strongBeats.length - 1) {
                newStack.push([n, "onbeatdo", 0, 0, [n - 3, n + 1, n + 2, null]]);
                newStack.push([n + 1, ["number", { value: strongBeats[i] + 1 }], 0, 0, [n]]);
                newStack.push([n + 2, ["text", { value: "action" }], 0, 0, [n]]);
            } else {
                newStack.push([n, "onbeatdo", 0, 0, [n - 3, n + 1, n + 2, n + 3]]);
                newStack.push([n + 1, ["number", { value: strongBeats[i] + 1 }], 0, 0, [n]]);
                newStack.push([n + 2, ["text", { value: "action" }], 0, 0, [n]]);
            }
            n += 3;
        }

        // console.debug(newStack);
        this.activity.blocks.loadNewBlocks(newStack);
    }

    /**
     * @private
     * @param {number} numberOfBeats
     * @param {number} beatValue
     * @returns {void}
     */
    _piemenuMeter(numberOfBeats, beatValue) {
        // pie menu for strong beat selection

        docById("meterWheelDiv").style.display = "flex";
        docById("meterWheelDiv").style.justifyContent = "center";

        // Use advanced constructor for multiple wheelnavs in the same div.
        // The meterWheel is used to hold the strong beats.
        this._meterWheel = new wheelnav("meterWheelDiv", null, 400, 400);
        // Strong beat is shown on this wheel
        this._beatWheel = new wheelnav("_beatWheel", this._meterWheel.raphael);
        // Play wheel is to show which beat is playing at any one time.
        this._playWheel = new wheelnav("_playWheel", this._meterWheel.raphael);

        wheelnav.cssMeter = true;

        // Use the mode wheel color scheme
        this._meterWheel.colors = platformColor.modeWheelcolors;

        this._meterWheel.slicePathFunction = slicePath().DonutSlice;
        this._meterWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._meterWheel.slicePathCustom.minRadiusPercent = 0.4;
        this._meterWheel.slicePathCustom.maxRadiusPercent = 0.75;
        this._meterWheel.sliceSelectedPathCustom = this._meterWheel.slicePathCustom;
        this._meterWheel.sliceInitPathCustom = this._meterWheel.slicePathCustom;

        // Disable rotation, set navAngle and create the menus
        this._meterWheel.clickModeRotate = false;
        this._meterWheel.navAngle = -90;
        // this._meterWheel.selectedNavItemIndex = 2;
        this._meterWheel.animatetime = 0; // 300;

        if (numberOfBeats > 16) {
            numberOfBeats = 16;
        }

        const labels = [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10",
            "11",
            "12",
            "13",
            "14",
            "15",
            "16"
        ];
        let beatList = [];
        this._strongBeats = [];
        for (let i = 0; i < numberOfBeats; i++) {
            beatList.push(labels[i]);
            this._strongBeats.push(false);
        }

        this._meterWheel.createWheel(beatList);

        this._beatWheel.colors = platformColor.modeWheelcolors;
        this._beatWheel.slicePathFunction = slicePath().DonutSlice;
        this._beatWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._beatWheel.slicePathCustom.minRadiusPercent = 0.75;
        this._beatWheel.slicePathCustom.maxRadiusPercent = 0.9;
        this._beatWheel.sliceSelectedPathCustom = this._beatWheel.slicePathCustom;
        this._beatWheel.sliceInitPathCustom = this._beatWheel.slicePathCustom;
        this._beatWheel.clickModeRotate = false;
        this._beatWheel.navAngle = -90;
        this._beatWheel.titleRotateAngle = 90;

        beatList = [];
        for (let i = 0; i < numberOfBeats; i++) {
            beatList.push("x");
        }

        this._beatWheel.createWheel(beatList);

        this._playWheel.colors = [platformColor.orange];
        this._playWheel.slicePathFunction = slicePath().DonutSlice;
        this._playWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._playWheel.slicePathCustom.minRadiusPercent = 0.3;
        this._playWheel.slicePathCustom.maxRadiusPercent = 0.4;
        this._playWheel.sliceSelectedPathCustom = this._playWheel.slicePathCustom;
        this._playWheel.sliceInitPathCustom = this._playWheel.slicePathCustom;
        this._playWheel.clickModeRotate = false;
        this._playWheel.navAngle = -90;
        this._playWheel.titleRotateAngle = 90;

        beatList = [];
        for (let i = 0; i < numberOfBeats; i++) {
            beatList.push(" ");
        }

        this._playWheel.createWheel(beatList);

        for (let i = 0; i < numberOfBeats; i++) {
            this._playWheel.navItems[i].navItem.hide();
        }

        // If a meterWheel sector is selected, show the corresponding
        // beat wheel sector.
        const __setBeat = () => {
            const i = this._meterWheel.selectedNavItemIndex;
            this._strongBeats[i] = true;
            this._beatWheel.navItems[i].navItem.show();
        };

        // If a beatWheel sector is selected, hide it.
        const __clearBeat = () => {
            const i = this._beatWheel.selectedNavItemIndex;
            this._beatWheel.navItems[i].navItem.hide();
            this._strongBeats[i] = false;
        };

        for (let i = 0; i < numberOfBeats; i++) {
            this._meterWheel.navItems[i].navigateFunction = __setBeat;
            this._beatWheel.navItems[i].navigateFunction = __clearBeat;
            // Start with all beats hidden , except default strong/weak .
            this._beatWheel.navItems[i].navItem.hide();
        }

        this._setupDefaultStrongWeakBeats(numberOfBeats, beatValue);
    }

    /**
     * @private
     * @param {number} numberOfBeats
     * @param {number} beatValue
     * @returns {void}
     */
    _setupDefaultStrongWeakBeats(numberOfBeats, beatValue) {
        if (beatValue == 0.25 && numberOfBeats == 4) {
            this._strongBeats[0] = true;
            this._strongBeats[2] = true;
            this._beatWheel.navItems[0].navItem.show();
            this._beatWheel.navItems[2].navItem.show();
        } else if (beatValue == 0.25 && numberOfBeats == 2) {
            this._strongBeats[0] = true;
            this._beatWheel.navItems[0].navItem.show();
        } else if (beatValue == 0.25 && numberOfBeats == 3) {
            this._strongBeats[0] = true;
            this._beatWheel.navItems[0].navItem.show();
        } else if (beatValue == 0.125 && numberOfBeats == 6) {
            this._strongBeats[0] = true;
            this._strongBeats[3] = true;
            this._beatWheel.navItems[0].navItem.show();
            this._beatWheel.navItems[3].navItem.show();
        }
    }
}
