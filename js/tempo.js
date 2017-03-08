// Copyright (c) 2016 Walter Bender
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

const TEMPOINTERVAL = 5;

function Tempo () {
    this._isMoving = true;
    this._direction = 1;
    this._widgetFirstTime = null;
    this._widgetNextTime = 0;
    this._interval = 0;
    this._yradius = 25;
    this._xradius = 25;
    this._firstClickTime = null;

    this.BPM;
    this.BPMBlock = null;  // set-master-BPM block contained in Tempo clamp

    this._updateBPM = function(event) {
        this._interval = (60 / this.BPM) * 1000;

        if (this.BPMBlock != null) {
            var blockNumber = blocks.blockList[this.BPMBlock].connections[1];
            if (blockNumber != null) {
                this._logo.blocks.blockList[blockNumber].value = parseFloat(this.BPM);
                this._logo.blocks.blockList[blockNumber].text.text = this.BPM;
                this._logo.blocks.blockList[blockNumber].updateCache();
                this._logo.refreshCanvas();
                saveLocally();
            }
        }
    };

    this._pause = function () {
        clearInterval(this._intervalID);
    };

    this._resume = function () {
        // Reset widget time since we are restarting.
        // We will no longer keep synch with the turtles.
        var d = new Date();
        this._widgetFirstTime = d.getTime();
        this._widgetNextTime = this._widgetFirstTime + this._interval;
        this._direction = 1;

        // Restart the interval.
        var that = this;
        this._intervalID = setInterval(function() {
            that._draw();
        }, TEMPOINTERVAL);
    };

    this._useBPM = function () {
        this.BPM = docById('BPMInput').value
        if (this.BPM > 1000) {
            this.BPM = 1000;
        } else if (this.BPM < 30) {
            this.BPM = 30;
        }

        this._updateBPM();
    };

    this._speedUp = function () {
        this.BPM = parseFloat(this.BPM) + 5;

        if (this.BPM > 1000) {
            this.BPM = 1000;
        }

        this._updateBPM();
        docById('BPMInput').value = this.BPM;
    };

    this._slowDown = function () {
        this.BPM = parseFloat(this.BPM) - 5;
        if (this.BPM < 30) {
            this.BPM = 30;
        }

        this._updateBPM();
        docById('BPMInput').value = this.BPM;
    };

    this._draw = function() {
        // First thing to do is figure out where we are supposed to be
        // based on the elapsed time.
        var canvas = docById('tempoCanvas');
        var d = new Date();

        // We start the music clock as the first note is being
        // played.
        if (this._widgetFirstTime == null) {
            this._widgetFirstTime = d.getTime();
            this._widgetNextTime = this._widgetFirstTime + this._interval;
        }

        // How much time has gone by?
        var deltaTime = this._widgetNextTime - d.getTime();

        // Are we done yet?
        if (d.getTime() > this._widgetNextTime) {
            // Play a tone.
            this._logo.synth.trigger('C4', 0.125, 'poly');
            this._widgetNextTime += this._interval;

            // Ensure we are at the edge.
            if (this._direction === -1) {
                this._direction = 1;
            } else {
                this._direction = -1;
            }
        } else {
            // Determine new x position based on delta time.
            if (this._interval !== 0) {
                var dx = (canvas.width) * (deltaTime / this._interval);
            }

            //Set this._xradius based on the dx to achieve the compressing effect
            if (canvas.width - dx <= this._yradius) {
                this._xradius =  canvas.width - dx;
            } else if (dx <= this._yradius) {
                this._xradius = dx;
            } else {
                this._xradius = this._yradius;
            }

            //Set x based on dx and direction
            if (this._direction === -1) {
                var x = canvas.width - dx;
            } else {
                var x = dx;
            }
        }

        //Set x value if it is undefined
        if (x === undefined) {
            if (this._direction === -1) {
                x = 0;
            } else {
                x = canvas.width;
            }
        }

        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.fillStyle = '';
        ctx.ellipse(x, this.cellScale * 36, Math.max(this._xradius, 0), Math.max(this._yradius, 0), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    };

    this._addButton = function(row, colIndex, icon, iconSize, label) {
        var cell = row.insertCell();
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/' + icon + '" title="' + label + '" alt="' + label + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        return cell;
    };

    this.init = function (logo) {
        var that = this;
        this._logo = logo;
        console.log("init tempo");
        docById('tempoDiv').style.visibility = 'visible';
        docById('tempoCanvas').style.visibility = 'visible';
        docById('tempoCanvas').style.backgroundColor = 'white';

        var w = window.innerWidth;
        docById('tempoDiv').style.width = Math.floor(w / 2) + 'px';
        docById('tempoDiv').style.top = 100 + 'px';
        docById('tempoCanvas').style.width = Math.floor(w / 2) + 'px';
        docById('tempoCanvas').style.height = Math.floor(w / 12) + 'px';

        this.cellScale = w / 1200;
        var iconSize = Math.floor(this.cellScale * 24);
        // FIXME: What is the proper offset from the top?
        var top = 100 + iconSize * 1.5;
        docById('tempoCanvas').style.top = top + 'px';
        docById('tempoCanvas').style.left = docById('tempoDiv').style.left;

        var tables = document.getElementsByTagName('TABLE');
        for (var i = 0; i < tables.length; i++) {
            tables[0].parentNode.removeChild(tables[0]);
        }

        var t = document.createElement('TABLE');
        t.setAttribute('id', 'buttonDiv');
        t.style.textAlign = 'center';
        t.style.borderCollapse = 'collapse';
        t.cellSpacing = 0;
        t.cellPadding = 0;

        docById('tempoDiv').style.paddingTop = 0 + 'px';
        docById('tempoDiv').style.paddingLeft = 0 + 'px';
        docById('tempoDiv').appendChild(t);

        var table = docById('buttonDiv');
        var header = table.createTHead();
        var row = header.insertRow(-1);

        var cell = this._addButton(row, -1, 'pause-button.svg', iconSize, _('pause'));
        cell.onclick=function() {
            if (that._isMoving) {
                that._pause();
                this.innerHTML = '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' + _('pause') + '" alt="' + _('pause') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
                that._isMoving = false;
            } else {
                that._resume();
                this.innerHTML = '&nbsp;&nbsp;<img src="header-icons/pause-button.svg" title="' + _('play') + '" alt="' + _('play') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
                that._isMoving = true;
            }
        };

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        };

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        };

        var cell = this._addButton(row, 1, 'up.svg', iconSize, _('speed up'));
        cell.onclick=function() {
            that._speedUp();
        };

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        };

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        };

        var cell = this._addButton(row, 2, 'down.svg', iconSize, _('slow down'));
        cell.onclick=function() {
            that._slowDown();
        };

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        };

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        };

        var cell = row.insertCell(3);
        cell.style.top = 0;
        cell.style.left = 0;
        cell.innerHTML = '<input id="BPMInput" style="-webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="BPMInput" type="BPMInput" value="' + this.BPM + '" />';
        cell.style.width = Math.floor(RHYTHMRULERHEIGHT * this.cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        docById('tempoCanvas').addEventListener('click', function() {
            // The tempo can be set from the interval between
            // successive clicks on the canvas.
            var d = new Date();
            if (that._firstClickTime == null) {
                that._firstClickTime = d.getTime();
            } else {
                var newBPM = parseInt((60 * 1000) / (d.getTime() - that._firstClickTime));
                if (newBPM > 29 && newBPM < 1001) {
                    that.BPM = newBPM;
                    that._updateBPM();
                    docById('BPMInput').value = that.BPM;
                    that._firstClickTime = null;
                } else {
                    that._firstClickTime = d.getTime();
                }
            }
        });

        docById('BPMInput').classList.add('hasKeyboard');
        docById('BPMInput').addEventListener('keyup', function(e) {
            if (e.keyCode === 13) {
                that._useBPM();
            }
        });

        var cell = this._addButton(row, 4, 'close-button.svg', iconSize, _('close'));
        cell.onclick=function() {
            docById('tempoDiv').style.visibility = 'hidden';
            docById('tempoCanvas').style.visibility = 'hidden';
            clearInterval(that._intervalID);
        };

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        };

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        };

        this._direction = 1;

        // When we start, we try to synch with the turtles.
        this._widgetFirstTime = this._logo.firstNoteTime;
        this._interval = (60 / this.BPM) * 1000;
        this._widgetNextTime = this._widgetFirstTime + this._interval;

        this._intervalID = setInterval(function() {
            that._draw();
        }, TEMPOINTERVAL);
    };

};
