// Copyright (c) 2016-19 Walter Bender
// Copyright (c) 2016 Hemant Kasat
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// This widget enable us to manipulate the beats per minute. It
// behaves like a metronome and updates the master BPM block.

class Tempo {
    static TEMPOSYNTH = "bottle";
    static TEMPOINTERVAL = 5;
    static BUTTONDIVWIDTH = 476; // 8 buttons 476 = (55 + 4) * 8
    static BUTTONSIZE = 53;
    static ICONSIZE = 32;
    static TEMPOWIDTH = 700;
    static TEMPOHEIGHT = 100;
    static YRADIUS = 75;

    constructor() {
        this._xradius = YRADIUS / 3;

        this.BPMs = [];
        this.BPMInputs = [];
        this.BPMBlocks = [];
        this.tempoCanvases = [];

        this._updateBPM = function (i) {
            this._intervals[i] = (60 / this.BPMs[i]) * 1000;

            let blockNumber;
            if (this.BPMBlocks[i] != null) {
                blockNumber = this._logo.blocks.blockList[this.BPMBlocks[i]].connections[1];
                if (blockNumber != null) {
                    this._logo.blocks.blockList[blockNumber].value = parseFloat(this.BPMs[i]);
                    this._logo.blocks.blockList[blockNumber].text.text = this.BPMs[i];
                    this._logo.blocks.blockList[blockNumber].updateCache();
                    this._logo.refreshCanvas();
                    saveLocally();
                }
            }
        };

        this.pause = function () {
            clearInterval(this._intervalID);
        };

        this.resume = function () {
            // Reset widget time since we are restarting.
            // We will no longer keep synch with the turtles.
            let d = new Date();
            for (let i = 0; i < this.BPMs.length; i++) {
                this._widgetFirstTimes[i] = d.getTime();
                this._widgetNextTimes[i] = this._widgetFirstTimes[i] + this._intervals[i];
                this._directions[i] = 1;
            }

            // Restart the interval.

            if (this._intervalID !== null) {
                clearInterval(this._intervalID);
            }

            this._intervalID = setInterval(() => {
                this._draw();
            }, TEMPOINTERVAL);
        };

        this._useBPM = function (i) {
            this.BPMs[i] = this.BPMInputs[i].value;
            if (this.BPMs[i] > 1000) {
                this.BPMs[i] = 1000;
                this._logo.errorMsg(_("The beats per minute must be between 30 and 1000."));
            } else if (this.BPMs[i] < 30) {
                this.BPMs[i] = 30;
                this._logo.errorMsg(_("The beats per minute must be between 30 and 1000."));
            }

            this._updateBPM(i);
            this.BPMInputs[i].value = this.BPMs[i];
        };

        this.speedUp = function (i) {
            this.BPMs[i] = parseFloat(this.BPMs[i]) + Math.round(0.1 * this.BPMs[i]);

            if (this.BPMs[i] > 1000) {
                this.BPMs[i] = 1000;
            }

            this._updateBPM(i);
            this.BPMInputs[i].value = this.BPMs[i];
        };

        this.slowDown = function (i) {
            this.BPMs[i] = parseFloat(this.BPMs[i]) - Math.round(0.1 * this.BPMs[i]);
            if (this.BPMs[i] < 30) {
                this.BPMs[i] = 30;
            }

            this._updateBPM(i);
            this.BPMInputs[i].value = this.BPMs[i];
        };

        this._draw = function () {
            // First thing to do is figure out where we are supposed to be
            // based on the elapsed time.
            let d = new Date();
            let tempoCanvas, deltaTime, dx, x, ctx;
            for (let i = 0; i < this.BPMs.length; i++) {
                tempoCanvas = this.tempoCanvases[i];
                if (!tempoCanvas) continue;

                // We start the music clock as the first note is being
                // played.
                if (this._widgetFirstTimes[i] == null) {
                    this._widgetFirstTimes[i] = d.getTime();
                    this._widgetNextTimes[i] = this._widgetFirstTimes[i] + this._intervals[i];
                }

                // How much time has gone by?
                deltaTime = this._widgetNextTimes[i] - d.getTime();

                // Are we done yet?
                if (d.getTime() > this._widgetNextTimes[i]) {
                    // Play a tone.
                    this._logo.synth.trigger(0, ["C2"], 0.0625, TEMPOSYNTH, null, null, false);
                    this._widgetNextTimes[i] += this._intervals[i];

                    // Ensure we are at the edge.
                    if (this._directions[i] === -1) {
                        this._directions[i] = 1;
                    } else {
                        this._directions[i] = -1;
                    }
                } else {
                    // Determine new x position based on delta time.
                    if (this._intervals[i] !== 0) {
                        dx = tempoCanvas.width * (deltaTime / this._intervals[i]);
                    } else {
                        dx = 0;
                    }

                    // Set this._xradius based on the dx to achieve the compressing effect
                    if (tempoCanvas.width - dx <= YRADIUS / 3) {
                        this._xradius = tempoCanvas.width - dx;
                    } else if (dx <= YRADIUS / 3) {
                        this._xradius = dx;
                    } else {
                        this._xradius = YRADIUS / 3;
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
                ctx.ellipse(x, YRADIUS, Math.max(this._xradius, 1), YRADIUS, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.closePath();
            }
        };

        this.__save = function (i) {
            setTimeout(() => {
                console.debug("saving a BPM block for " + this.BPMs[i]);
                let delta = i * 42;
                let newStack = [
                    [0, ["setbpm3", {}], 100 + delta, 100 + delta, [null, 1, 2, 5]],
                    [1, ["number", {
                        value: this.BPMs[i]
                    }], 0, 0, [0]],
                    [2, ["divide", {}], 0, 0, [0, 3, 4]],
                    [3, ["number", {
                        value: 1
                    }], 0, 0, [2]],
                    [4, ["number", {
                        value: 4
                    }], 0, 0, [2]],
                    [5, ["vspace", {}], 0, 0, [0, null]]
                ];
                this._logo.blocks.loadNewBlocks(newStack);
                this._logo.textMsg(_("New action block generated!"));
            }, 200 * i);
        };

        this._saveTempo = function () {
            // Save a BPM block for each tempo.

            for (let i = 0; i < this.BPMs.length; i++) {
                this.__save(i);
            }
        };

        this._get_save_lock = function () {
            return this._save_lock;
        };

        this.init = function (logo) {
            this._logo = logo;
            this._directions = [];
            this._widgetFirstTimes = [];
            this._widgetNextTimes = [];
            this._firstClickTimes = null;
            this._intervals = [];
            this.isMoving = true;
            if (this._intervalID != undefined && this._intervalID != null) {
                clearInterval(this._intervalID);
            }

            this._intervalID = null;

            this._logo.synth.loadSynth(0, getDrumSynthName(TEMPOSYNTH));

            if (this._intervalID != null) {
                clearInterval(this._intervalID);
            }

            let w = window.innerWidth;
            let iconSize = ICONSIZE;

            let widgetWindow = window.widgetWindows.windowFor(this, "tempo");
            this.widgetWindow = widgetWindow;
            widgetWindow.clear();
            widgetWindow.show();

            widgetWindow.onclose = () => {
                if (this._intervalID != null) {
                    clearInterval(this._intervalID);
                }
                widgetWindow.destroy();
            };

            let pauseBtn = widgetWindow.addButton("pause-button.svg", ICONSIZE, _("Pause"));
            pauseBtn.onclick = () => {
                if (this.isMoving) {
                    this.pause();
                    pauseBtn.innerHTML =
                        '<img src="header-icons/play-button.svg" title="' +
                        _("Pause") +
                        '" alt="' +
                        _("Pause") +
                        '" height="' +
                        ICONSIZE +
                        '" width="' +
                        ICONSIZE +
                        '" vertical-align="middle">';
                    this.isMoving = false;
                } else {
                    this.resume();
                    pauseBtn.innerHTML =
                        '<img src="header-icons/pause-button.svg" title="' +
                        _("Play") +
                        '" alt="' +
                        _("Play") +
                        '" height="' +
                        ICONSIZE +
                        '" width="' +
                        ICONSIZE +
                        '" vertical-align="middle">';
                    this.isMoving = true;
                }
            };

            this._save_lock = false;
            widgetWindow.addButton("export-chunk.svg", iconSize, _("Save tempo"), "").onclick = () => {
                // Debounce button
                if (!this._get_save_lock()) {
                    this._save_lock = true;
                    this._saveTempo();
                    setTimeout(() => (this._save_lock = false), 1000);
                }
            };

            this.bodyTable = document.createElement("table");
            this.widgetWindow.getWidgetBody().appendChild(this.bodyTable);

            let r1, r2, r3, tcCell;
            for (let i = 0; i < this.BPMs.length; i++) {
                this._directions.push(1);
                this._widgetFirstTimes.push(this._logo.firstNoteTime);
                if (this.BPMs[i] <= 0) {
                    this.BPMs[i] = 30;
                }

                this._intervals.push((60 / this.BPMs[i]) * 1000);
                this._widgetNextTimes.push(this._widgetFirstTimes[i] - this._intervals[i]);

                r1 = this.bodyTable.insertRow();
                r2 = this.bodyTable.insertRow();
                r3 = this.bodyTable.insertRow();

                widgetWindow.addButton("up.svg", ICONSIZE, _("speed up"), r1.insertCell()).onclick = ((
                    i
                ) => () => this.speedUp(i))(i);
                widgetWindow.addButton(
                    "down.svg",
                    ICONSIZE,
                    _("slow down"),
                    r2.insertCell()
                ).onclick = ((i) => () => this.slowDown(i))(i);

                this.BPMInputs[i] = widgetWindow.addInputButton(this.BPMs[i], r3.insertCell());
                this.tempoCanvases[i] = document.createElement("canvas");
                this.tempoCanvases[i].style.width = TEMPOWIDTH + "px";
                this.tempoCanvases[i].style.height = TEMPOHEIGHT + "px";
                this.tempoCanvases[i].style.margin = "1px";
                this.tempoCanvases[i].style.background = "rgba(255, 255, 255, 1)";
                tcCell = r1.insertCell();
                tcCell.appendChild(this.tempoCanvases[i]);
                tcCell.setAttribute("rowspan", "3");

                // The tempo can be set from the interval between
                // successive clicks on the canvas.
                this.tempoCanvases[i].onclick = ((id) => () => {
                    let d = new Date();
                    let newBPM, BPMInput;
                    if (this._firstClickTime == null) {
                        this._firstClickTime = d.getTime();
                    } else {
                        newBPM = parseInt((60 * 1000) / (d.getTime() - this._firstClickTime));
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
                })(i);

                this.BPMInputs[i].addEventListener(
                    "keyup",
                    ((id) => (e) => {
                        if (e.keyCode === 13) {
                            this._useBPM(id);
                        }
                    })(i)
                );
            }

            this._logo.textMsg(_("Adjust the tempo with the buttons."));
            this.resume();

            widgetWindow.sendToCenter();
        }
    };
}