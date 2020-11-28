// Copyright (c) 2019 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

class MeterWidget {
    constructor() {
        // A pie menu is used to show the meter and strong beats
        const BUTTONDIVWIDTH = 535;
        const BUTTONSIZE = 53;
        const ICONSIZE = 32;

        this.init = function (logo, meterBlock, widgetBlock) {
            this._logo = logo;
            this._meterBlock = meterBlock;
            this._strongBeats = [];
            this._playing = false;
            this._click_lock = false;
            this._beatValue = 1 / 4;

            let w = window.innerWidth;
            this._cellScale = w / 1200;
            let iconSize = ICONSIZE * this._cellScale;

            let widgetWindow = window.widgetWindows.windowFor(this, "meter");
            this.widgetWindow = widgetWindow;
            widgetWindow.clear();

            this._logo.synth.setMasterVolume(PREVIEWVOLUME);
            this._logo.synth.loadSynth(0, "kick drum");
            Singer.setSynthVolume(this._logo, 0, "kick drum", PREVIEWVOLUME);
            this._logo.synth.loadSynth(0, "snare drum");
            Singer.setSynthVolume(this._logo, 0, "snare drum", PREVIEWVOLUME);

            // For the button callbacks
            let that = this;

            this.meterDiv = document.createElement("table");
            widgetWindow.getWidgetBody().append(this.meterDiv);

            widgetWindow.onclose = function () {
                that._playing = false;
                that._logo.hideMsgs();
                this.destroy();
            };

            this._click_lock = false;
            widgetWindow.addButton(
                "play-button.svg",
                ICONSIZE,
                _("Play")
            ).onclick = function () {
                if (that._get_click_lock()) {
                    return;
                } else {
                    that._click_lock = true;
                    if (that.__getPlayingStatus()) {
                        this.innerHTML =
                            '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' +
                            _("Play all") +
                            '" alt="' +
                            _("Play all") +
                            '" height="' +
                            ICONSIZE +
                            '" width="' +
                            ICONSIZE +
                            '" vertical-align="middle">&nbsp;&nbsp;';
                        that._playing = false;
                    } else {
                        this.innerHTML =
                            '&nbsp;&nbsp;<img src="header-icons/stop-button.svg" title="' +
                            _("Stop") +
                            '" alt="' +
                            _("Stop") +
                            '" height="' +
                            ICONSIZE +
                            '" width="' +
                            ICONSIZE +
                            '" vertical-align="middle">&nbsp;&nbsp;';
                        that._playing = true;
                        that._logo.turtleDelay = 0;
                        that._logo.resetSynth(0);
                        that._playBeat();
                    }
                }

                setTimeout(function () {
                    that._click_lock = false;
                }, 1000);
            };

            widgetWindow.addButton(
                "export-chunk.svg",
                ICONSIZE,
                _("Save")
            ).onclick = function () {
                that._save();
            };

            // The pie menu goes here.
            let meterTableDiv = this.meterDiv;
            meterTableDiv.style.display = "inline";
            meterTableDiv.style.visibility = "visible";
            meterTableDiv.style.border = "0px";
            meterTableDiv.innerHTML = '<div id="meterWheelDiv"></div>';

            // Grab the number of beats and beat value from the meter block.
            if (meterBlock !== null) {
                var c1 = this._logo.blocks.blockList[meterBlock].connections[1];
                var v1;
                if (c1 !== null) {
                    v1 = this._logo.blocks.blockList[c1].value;
                } else {
                    v1 = 4;
                }

                var c2 = this._logo.blocks.blockList[meterBlock].connections[2];
                var c3 = this._logo.blocks.blockList[c2].connections[2];
                if (c2 !== null) {
                    this._beatValue = this._logo.blocks.blockList[c2].value;
                }

                this._piemenuMeter(v1, this._beatValue);
            } else {
                this._piemenuMeter(4, this._beatValue);
            }

            let divInput = document.createElement("div");
            divInput.className = ("wfbtItem");
            divInput.innerHTML = '<input style="float: left ;" value="' + v1 + '" type="number" id="beatValue" min="1" max="16" >';

            let divInput2 = document.createElement("div");
            divInput2.className = ("wfbtItem");
            divInput2.innerHTML = '<input style="float: left;" value="' + 1 / this._beatValue + '" type="number" id="beatValue" min="1" max="35">';

            widgetWindow._toolbar.appendChild(divInput);
            widgetWindow._toolbar.appendChild(divInput2);

            widgetWindow.addButton(
                "reload.svg",
                ICONSIZE,
                //TRANS.: Reset the widget layout
                _("Reset")
            ).onclick = () => {
                //change Values of blocks in stack.
                let el = divInput.children[0];
                let el2 = divInput2.children[0];

                divInput.children[0].value = Math.min(el.max, Math.max(el.min, el.value));
                divInput2.children[0].value = Math.min(el2.max, Math.max(el2.min, el2.value));

                let bnBlk = this._logo.blocks.blockList[c1]; // number of beats
                let bvBlk = this._logo.blocks.blockList[c3]; // beat value

                let bnValue = divInput.children[0].value;
                let bvValue = divInput2.children[0].value;

                bnBlk.value = bnValue;
                bnBlk.text.text = bnValue;
                bnBlk.container.setChildIndex(bnBlk.text, bnBlk.container.children.length - 1);

                bvBlk.value = bvValue;
                bvBlk.text.text = bvValue;
                bvBlk.container.setChildIndex(bvBlk.text, bvBlk.container.children.length - 1);

                logo.runLogoCommands(widgetBlock);
            };

            this._logo.textMsg(
                _("Click in the circle to select strong beats for the meter.")
            );
            widgetWindow.sendToCenter();
        };

        this._get_click_lock = function () {
            return this._click_lock;
        };

        this.__playDrum = function (drum) {
            this._logo.synth.trigger(
                0, "C4", Singer.defaultBPMFactor * this._beatValue, drum, null, null
            );
        };

        this.__getPlayingStatus = function () {
            return this._playing;
        };

        this.__getPauseStatus = function () {
            return !this._playing;
        };

        this.__playOneBeat = function (i, ms) {
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

            let that = this;
            setTimeout(function () {
                that.__playOneBeat((i + 1) % that._strongBeats.length, ms);
            }, ms);
        };

        this._playBeat = function () {
            let tur = this._logo.turtles.ithTurtle(0);
            let bpmFactor = TONEBPM / (tur.singer.bpm.length > 0 ? last(tur.singer.bpm) : Singer.masterBPM);
            for (let i = 0; i < this._strongBeats.length; i++) {
                this._playWheel.navItems[i].navItem.hide();
            }

            let noteBeatValue = bpmFactor * 1000 * this._beatValue;
            this.__playOneBeat(0, noteBeatValue);
        };

        this._addButton = function (row, icon, iconSize, label) {
            let cell = row.insertCell(-1);
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
            cell.style.width = BUTTONSIZE + "px";
            cell.style.minWidth = cell.style.width;
            cell.style.maxWidth = cell.style.width;
            cell.style.height = cell.style.width;
            cell.style.minHeight = cell.style.height;
            cell.style.maxHeight = cell.style.height;
            cell.style.backgroundColor = platformColor.selectorBackground;

            cell.onmouseover = function () {
                this.style.backgroundColor = platformColor.selectorBackgroundHOVER;
            };

            cell.onmouseout = function () {
                this.style.backgroundColor = platformColor.selectorBackground;
            };

            return cell;
        };

        this._save = function () {
            // Export onbeatdo blocks for each strong beat
            let strongBeats = [];
            let newStack = [];

            let numberOfBeats = this._strongBeats.length;

            for (let i = 0; i < numberOfBeats; i++) {
                if (this._strongBeats[i]) {
                    strongBeats.push(i);
                }
            }

            let n = 0;

            for (let i = 0; i < strongBeats.length; i++) {
                if (i === 0) {
                    if (strongBeats.length === 1) {
                        newStack.push([
                            0,
                            "onbeatdo",
                            100,
                            100,
                            [null, 1, 2, null]
                        ]);
                        newStack.push([
                            1,
                            ["number", { value: strongBeats[i] + 1 }],
                            0,
                            0,
                            [0]
                        ]);
                        newStack.push([
                            2,
                            ["text", { value: "action" }],
                            0,
                            0,
                            [0]
                        ]);
                    } else {
                        newStack.push([0, "onbeatdo", 100, 100, [null, 1, 2, 3]]);
                        newStack.push([
                            1,
                            ["number", { value: strongBeats[i] + 1 }],
                            0,
                            0,
                            [0]
                        ]);
                        newStack.push([
                            2,
                            ["text", { value: "action" }],
                            0,
                            0,
                            [0]
                        ]);
                    }
                } else if (i === strongBeats.length - 1) {
                    newStack.push([
                        n,
                        "onbeatdo",
                        0,
                        0,
                        [n - 3, n + 1, n + 2, null]
                    ]);
                    newStack.push([
                        n + 1,
                        ["number", { value: strongBeats[i] + 1 }],
                        0,
                        0,
                        [n]
                    ]);
                    newStack.push([
                        n + 2,
                        ["text", { value: "action" }],
                        0,
                        0,
                        [n]
                    ]);
                } else {
                    newStack.push([
                        n,
                        "onbeatdo",
                        0,
                        0,
                        [n - 3, n + 1, n + 2, n + 3]
                    ]);
                    newStack.push([
                        n + 1,
                        ["number", { value: strongBeats[i] + 1 }],
                        0,
                        0,
                        [n]
                    ]);
                    newStack.push([
                        n + 2,
                        ["text", { value: "action" }],
                        0,
                        0,
                        [n]
                    ]);
                }

                n += 3;
            }

            console.debug(newStack);
            this._logo.blocks.loadNewBlocks(newStack);
        };

        this._piemenuMeter = function (numberOfBeats, beatValue) {
            // pie menu for strong beat selection
            docById("meterWheelDiv").style.display = "";

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

            let labels = [
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

            // Always make the meter a complete circle.
            /*
            let n = (1 - (numberOfBeats * beatValue)) / beatValue;
            for (let i = 0; i < n; i++) {
                beatList.push(null);
            }
            */
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

            // Always make the meter a complete circle.
            /*
            let n = (1 - (numberOfBeats * beatValue)) / beatValue;
            for (let i = 0; i < n; i++) {
                beatList.push(null);
            }
            */
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

            // Always make the meter a complete circle.
            /*
            let n = (1 - (numberOfBeats * beatValue)) / beatValue;
            for (let i = 0; i < n; i++) {
                playList.push(null);
            }
            */
            this._playWheel.createWheel(beatList);

            for (let i = 0; i < numberOfBeats; i++) {
                this._playWheel.navItems[i].navItem.hide();
            }

            let that = this;

            // If a meterWheel sector is selected, show the corresponding
            // beat wheel sector.
            let __setBeat = function () {
                let i = that._meterWheel.selectedNavItemIndex;
                that._strongBeats[i] = true;
                that._beatWheel.navItems[i].navItem.show();
            };

            // If a beatWheel sector is selected, hide it.
            let __clearBeat = function () {
                let i = that._beatWheel.selectedNavItemIndex;
                that._beatWheel.navItems[i].navItem.hide();
                that._strongBeats[i] = false;
            };

            for (let i = 0; i < numberOfBeats; i++) {
                that._meterWheel.navItems[i].navigateFunction = __setBeat;
                that._beatWheel.navItems[i].navigateFunction = __clearBeat;
                // Start with all beats hidden , except default strong/weak .
                that._beatWheel.navItems[i].navItem.hide();
            }

            this.setupDefaultStrongWeakBeats(numberOfBeats, beatValue);
        };

        this.setupDefaultStrongWeakBeats = (numberOfBeats, beatValue) => {
            if (beatValue == 0.25 && numberOfBeats == 4) {
                this._strongBeats[0] = true;
                this._strongBeats[2] = true;
                this._beatWheel.navItems[0].navItem.show();
                this._beatWheel.navItems[2].navItem.show();
            }
            else if (beatValue == 0.25 && numberOfBeats == 2) {
                this._strongBeats[0] = true;
                this._beatWheel.navItems[0].navItem.show();
            }
            else if (beatValue == 0.25 && numberOfBeats == 3) {
                this._strongBeats[0] = true;
                this._beatWheel.navItems[0].navItem.show();
            }
            else if (beatValue == 0.125 && numberOfBeats == 6) {
                this._strongBeats[0] = true;
                this._strongBeats[3] = true;
                this._beatWheel.navItems[0].navItem.show();
                this._beatWheel.navItems[3].navItem.show();
            }
        };

    }
}
