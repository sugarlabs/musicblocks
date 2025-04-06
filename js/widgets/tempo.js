// Copyright (c) 2016-21 Walter Bender
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

/*
   global
   _, getDrumSynthName
 */

/*
   Global locations
    js/utils/musicutils.js
        getDrumSynthName
    js/utils/utils.js
        _
*/

/* exported Tempo */
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
        this._xradius = Tempo.YRADIUS / 3;
        this.BPMs = [];
        this.BPMInputs = [];
        this.BPMBlocks = [];
        this.tempoCanvases = [];
        // Pre-create canvas contexts array to avoid repeated lookups
        this._canvasContexts = [];
    }

    init(activity) {
        this.activity = activity;
        this._directions = [];
        this._widgetFirstTimes = [];
        this._widgetNextTimes = [];
        this._firstClickTime = null;
        this._intervals = [];
        this.isMoving = true;
        
        // Cache frequently accessed objects
        this._blockList = this.activity.blocks ? this.activity.blocks.blockList : null;
        this._logo = this.activity.logo;
        
        // Clear interval if already exists
        if (this._intervalID != undefined && this._intervalID != null) {
            clearInterval(this._intervalID);
        }

        this._intervalID = null;
        this._logo.synth.loadSynth(0, getDrumSynthName(Tempo.TEMPOSYNTH));

        if (this._intervalID != null) {
            clearInterval(this._intervalID);
        }

        const widgetWindow = window.widgetWindows.windowFor(this, "tempo", "tempo", true);
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();

        widgetWindow.onclose = () => {
            if (this._intervalID != null) {
                clearInterval(this._intervalID);
            }
            widgetWindow.destroy();
        };

        // Cache image paths and common strings to avoid recreation
        const playImgPath = "header-icons/play-button.svg";
        const pauseImgPath = "header-icons/pause-button.svg";
        const playText = _("Play");
        const pauseText = _("Pause");
        
        const pauseBtn = widgetWindow.addButton("pause-button.svg", Tempo.ICONSIZE, pauseText);
        pauseBtn.onclick = () => {
            if (this.isMoving) {
                this.pause();
                pauseBtn.innerHTML =
                    `<img 
                        src="${playImgPath}" 
                        title="${playText}" 
                        alt="${playText}" 
                        height="${Tempo.ICONSIZE}" 
                        width="${Tempo.ICONSIZE}" 
                        vertical-align="middle"
                    >`;
                this.isMoving = false;
            } else {
                this.resume();
                pauseBtn.innerHTML =
                    `<img 
                        src="${pauseImgPath}" 
                        title="${pauseText}" 
                        alt="${pauseText}" 
                        height="${Tempo.ICONSIZE}" 
                        width="${Tempo.ICONSIZE}" 
                        vertical-align="middle"
                    >`;
                this.isMoving = true;
            }
        };

        this._save_lock = false;
        widgetWindow.addButton(
            "export-chunk.svg",
            Tempo.ICONSIZE,
            _("Save tempo"),
            ""
        ).onclick = () => {
            // Debounce button
            if (!this._save_lock) {
                this._save_lock = true;
                this._saveTempo();
                setTimeout(() => (this._save_lock = false), 1000);
            }
        };

        this.bodyTable = document.createElement("table");
        this.widgetWindow.getWidgetBody().appendChild(this.bodyTable);

        let r1, r2, r3, tcCell;
        // Create a canvas style template to reuse
        const canvasStyleTemplate = {
            width: Tempo.TEMPOWIDTH + "px",
            height: Tempo.TEMPOHEIGHT + "px",
            margin: "1px",
            background: "rgba(255, 255, 255, 1)"
        };
        
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
            widgetWindow.addButton(
                "up.svg",
                Tempo.ICONSIZE,
                _("speed up"),
                r1.insertCell()
            ).onclick = ((i) => () => this.speedUp(i))(i);
            widgetWindow.addButton(
                "down.svg",
                Tempo.ICONSIZE,
                _("slow down"),
                r2.insertCell()
            ).onclick = ((i) => () => this.slowDown(i))(i);

            this.BPMInputs[i] = widgetWindow.addInputButton(this.BPMs[i], r3.insertCell());
            this.tempoCanvases[i] = document.createElement("canvas");
            
            // Apply the pre-defined styles efficiently
            Object.assign(this.tempoCanvases[i].style, canvasStyleTemplate);
            
            tcCell = r1.insertCell();
            tcCell.appendChild(this.tempoCanvases[i]);
            tcCell.setAttribute("rowspan", "3");

            // Pre-create and cache the canvas context for later use
            this._canvasContexts[i] = this.tempoCanvases[i].getContext("2d");

            // The tempo can be set from the interval between successive clicks on the canvas.
            this.tempoCanvases[i].onclick = this._createCanvasClickHandler(i);

            this.BPMInputs[i].addEventListener(
                "keyup",
                ((id) => (e) => {
                    if (e.keyCode === 13) {
                        this._useBPM(id);
                    }
                })(i)
            );
        }

        activity.textMsg(_("Adjust the tempo with the buttons."),3000);
        this.resume();

        widgetWindow.sendToCenter();
    }

    /**
     * Creates a click handler for a tempo canvas
     * @private
     * @param {number} id - The canvas index
     * @returns {Function} The click handler function
     */
    _createCanvasClickHandler(id) {
        return () => {
            const currentTime = new Date().getTime();
            let newBPM;
            
            if (this._firstClickTime == null) {
                this._firstClickTime = currentTime;
            } else {
                newBPM = parseInt((60 * 1000) / (currentTime - this._firstClickTime));
                if (newBPM > 29 && newBPM < 1001) {
                    this.BPMs[id] = newBPM;
                    this._updateBPM(id);
                    this.BPMInputs[id].value = this.BPMs[id];
                    this._firstClickTime = null;
                } else {
                    this._firstClickTime = currentTime;
                }
            }
        };
    }

    /**
     * @private
     * @param {number} i
     * @returns {void}
     */
    _updateBPM(i) {
        this._intervals[i] = (60 / this.BPMs[i]) * 1000;

        let blockNumber;
        if (this.BPMBlocks[i] != null && this._blockList) {
            blockNumber = this._blockList[this.BPMBlocks[i]].connections[1];
            if (blockNumber != null) {
                this._blockList[blockNumber].value = parseFloat(this.BPMs[i]);
                this._blockList[blockNumber].text.text = this.BPMs[i];
                this._blockList[blockNumber].updateCache();
                this.activity.refreshCanvas();
                this.activity.saveLocally();
            }
        }
    }

    /**
     * @public
     * @returns {void}
     */
    pause() {
        clearInterval(this._intervalID);
    }

    /**
     * @public
     * @returns {void}
     */
    resume() {
        // Reset widget time since we are restarting. We will no longer keep synch with the turtles.
        const currentTime = new Date().getTime();
        for (let i = 0; i < this.BPMs.length; i++) {
            this._widgetFirstTimes[i] = currentTime;
            this._widgetNextTimes[i] = this._widgetFirstTimes[i] + this._intervals[i];
            this._directions[i] = 1;
        }

        // Restart the interval.
        if (this._intervalID !== null) {
            clearInterval(this._intervalID);
        }

        this._intervalID = setInterval(() => {
            this._draw();
        }, Tempo.TEMPOINTERVAL);
    }

    /**
     * @private
     * @param {number} i
     * @returns {void}
     */
    _useBPM(i) {
        const input = this.BPMInputs[i].value;

        if (isNaN(input)) {
            activity.errorMsg(_("Please enter a number between 30 and 1000"), 3000);
            return;
        }
        
        this.BPMs[i] = this.BPMInputs[i].value;
        if (this.BPMs[i] > 1000) {
            this.BPMs[i] = 1000;
            activity.errorMsg(_("The beats per minute must be between 30 and 1000."), 3000);
        } else if (this.BPMs[i] < 30) {
            this.BPMs[i] = 30;
            activity.errorMsg(_("The beats per minute must be between 30 and 1000."), 3000);
        }

        this._updateBPM(i);
        this.BPMInputs[i].value = this.BPMs[i];
    }

    /**
     * @public
     * @param {number} i
     * @returns {void}
     */
    speedUp(i) {
        this.BPMs[i] = parseFloat(this.BPMs[i]) + Math.round(0.1 * this.BPMs[i]);

        if (this.BPMs[i] > 1000) {
            activity.errorMsg(_("The beats per minute must be below 1000."), 3000);
            this.BPMs[i] = 1000;
        }

        this._updateBPM(i);
        this.BPMInputs[i].value = this.BPMs[i];
    }

    /**
     * @public
     * @param {number} i
     * @returns {void}
     */
    slowDown(i) {
        this.BPMs[i] = parseFloat(this.BPMs[i]) - Math.round(0.1 * this.BPMs[i]);
        if (this.BPMs[i] < 30) {
            activity.errorMsg(_("The beats per minute must be above 30"), 3000);
            this.BPMs[i] = 30;
        }

        this._updateBPM(i);
        this.BPMInputs[i].value = this.BPMs[i];
    }

    /**
     * Draws the tempo indicator on each canvas
     * @private
     * @returns {void}
     */
    _draw() {
        // First thing to do is figure out where we are supposed to be based on the elapsed time.
        const currentTime = new Date().getTime();
        let tempoCanvas, ctx, deltaTime, dx, x;
        
        for (let i = 0; i < this.BPMs.length; i++) {
            tempoCanvas = this.tempoCanvases[i];
            ctx = this._canvasContexts[i]; // Use cached context
            
            if (!tempoCanvas || !ctx) continue;

            // We start the music clock as the first note is being played.
            if (this._widgetFirstTimes[i] == null) {
                this._widgetFirstTimes[i] = currentTime;
                this._widgetNextTimes[i] = this._widgetFirstTimes[i] + this._intervals[i];
            }

            // How much time has gone by?
            deltaTime = this._widgetNextTimes[i] - currentTime;

            // Are we done yet?
            if (currentTime > this._widgetNextTimes[i]) {
                // Play a tone.
                this._logo.synth.trigger(0, ["C2"], 0.0625, Tempo.TEMPOSYNTH, null, null, false);
                this._widgetNextTimes[i] += this._intervals[i];

                // Ensure we are at the edge.
                this._directions[i] = this._directions[i] === -1 ? 1 : -1;
            } else {
                // Determine new x position based on delta time.
                if (this._intervals[i] !== 0) {
                    dx = tempoCanvas.width * (deltaTime / this._intervals[i]);
                } else {
                    dx = 0;
                }

                // Set this._xradius based on the dx to achieve the compressing effect
                if (tempoCanvas.width - dx <= Tempo.YRADIUS / 3) {
                    this._xradius = tempoCanvas.width - dx;
                } else if (dx <= Tempo.YRADIUS / 3) {
                    this._xradius = dx;
                } else {
                    this._xradius = Tempo.YRADIUS / 3;
                }

                // Set x based on dx and direction
                x = this._directions[i] === -1 ? tempoCanvas.width - dx : dx;
            }

            // Set x value if it is undefined
            if (x === undefined) {
                x = this._directions[i] === -1 ? 0 : tempoCanvas.width;
            }

            // Clear and draw the ellipse
            ctx.clearRect(0, 0, tempoCanvas.width, tempoCanvas.height);
            ctx.beginPath();
            ctx.fillStyle = "rgba(0,0,0,1)";
            ctx.ellipse(
                x,
                Tempo.YRADIUS,
                Math.max(this._xradius, 1),
                Tempo.YRADIUS,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();
            ctx.closePath();
        }
    }

    /**
     * @private
     * @param {number} i
     * @returns {void}
     */
    __save(i) {
        setTimeout(() => {
            const delta = i * 42;
            const newStack = [
                [0, ["setbpm3", {}], 100 + delta, 100 + delta, [null, 1, 2, 5]],
                [1, ["number", { value: this.BPMs[i] }], 0, 0, [0]],
                [2, ["divide", {}], 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 4 }], 0, 0, [2]],
                [5, ["vspace", {}], 0, 0, [0, null]]
            ];
            this.activity.blocks.loadNewBlocks(newStack);
            activity.textMsg(_("New action block generated."), 3000);
        }, 200 * i);
    }

    /**
     * @private
     * @returns {void}
     */
    _saveTempo() {
        // Save a BPM block for each tempo.
        for (let i = 0; i < this.BPMs.length; i++) {
            this.__save(i);
        }
    }

    /**
     * @private
     * @returns {boolean}
     */
    _get_save_lock() {
        return this._save_lock;
    }
}
