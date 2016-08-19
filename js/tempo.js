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


function Tempo () {
    var canvas;
    var ctx;
    var canvasHalfWidth;

    this._isMoving = true;
    this._direction = 1;
    this._widgetFirstTime = null;
    this._widgetNextTime = 0;

    this.BPM;
    this.BPMBlock = null;  // set-master-BPM block contained in Tempo clamp

    this._updateBPM = function(event) {
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

    this._stop = function () {
        clearInterval(this._intervalID);
    };

    this._start = function () {
        // Reset widget time since we are restarting.
        // We will no longer keep synch with the turtles.
        var d = new Date();
        this._widgetFirstTime = d.getTime();
        this._widgetNextTime = this._widgetFirstTime + (60 / this.BPM) * 1000;
        this._direction = 1;

        // Restart the interval.
        var that = this;
        this._intervalID = setInterval(function() {
            that._draw();
        }, 5);
    };

    this._useBPM = function () {
        this.BPM = document.getElementById("BPMNUMBER").value
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
        document.getElementById("BPMNUMBER").value = this.BPM;
    };

    this._slowDown = function () {
        this.BPM = parseFloat(this.BPM) - 5;
        if (this.BPM < 30) {
            this.BPM = 30;
        }

        this._updateBPM();
        document.getElementById("BPMNUMBER").value = this.BPM;
    };

    this._draw = function() {
        // First thing to do is figure out where we are supposed to be
        // based on the elapsed time.
        var d = new Date();

        // We start the music clock as the first note is being
        // played.
        if (this._widgetFirstTime == null) {
            this._widgetFirstTime = d.getTime();
            this._widgetNextTime = this._widgetFirstTime + (60 / this.BPM) * 1000;
        }

        // How much time has gone by?
        var deltaTime = this._widgetNextTime - d.getTime();

        // Are we done yet?
        if (d.getTime() > this._widgetNextTime) {
            // Play a tone.
            this._logo.synth.trigger('C4', 0.125, 'poly');
            this._widgetNextTime += (60 / this.BPM) * 1000;

            // Ensure we are at the edge.
            if (this._direction === -1) {
                var x = 0;
                this._direction = 1;
            } else {
                var x = canvas.width;
                this._direction = -1;
            }
        } else {
            // Determine new x position based on delta time.
            var dx = canvas.width * (deltaTime / ((60 / this.BPM) * 1000));
            if (this._direction === -1) {
                var x = canvas.width - dx;
            } else {
                var x = dx;
            }
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.fillStyle = '';
        ctx.arc(x, this.cellScale * 200, 25, 0, Math.PI * 2);
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
        docById('TempoDiv').style.visibility = 'visible';
        docById('TempoCanvas').style.visibility = 'visible';
        docById('TempoCanvas').style.backgroundColor = 'white';
        console.log(this.BPM);

        var w = window.innerWidth;
        docById('TempoDiv').style.width = Math.floor(w / 2) + 'px';
        docById('TempoCanvas').style.width = Math.floor(w / 2) + 'px';
        docById('TempoCanvas').style.height = Math.floor(w / 12) + 'px';

        canvasHalfWidth = Math.floor(w / 2);

        this.cellScale = w / 1200;

        var TempoDiv = docById('TempoDiv');

        canvas = document.getElementById("TempoCanvas");
        canvasHalfWidth = Math.floor(canvas.width / 2);
        canvas.style.left = TempoDiv.style.left;

        ctx = canvas.getContext("2d");
        console.log(ctx);

        var iconSize = Math.floor(this.cellScale * 24);

        console.log(canvas.width + ' ' + window.innerWidth);

        var tables = document.getElementsByTagName('TABLE');
        var noofTables = tables.length;

        for (var i = 0; i < noofTables; i++) {
            tables[0].parentNode.removeChild(tables[0]);
        }

        var t = document.createElement('TABLE');
        t.setAttribute('id', 'buttonDiv');
        t.style.textAlign = 'center';
        t.style.borderCollapse = 'collapse';
        t.cellSpacing = 0;
        t.cellPadding = 0;

        var TempoDiv = docById('TempoDiv');
        TempoDiv.style.paddingTop = 0 + 'px';
        TempoDiv.style.paddingLeft = 0 + 'px';
        TempoDiv.appendChild(t);
        TempoDivPosition = TempoDiv.getBoundingClientRect();

        var table = docById('buttonDiv');
        var header = table.createTHead();
        var row = header.insertRow(-1);
        row.style.left = Math.floor(TempoDivPosition.left) + 'px';
        row.style.top = Math.floor(TempoDivPosition.top) + 'px';
        row.setAttribute('id', 'buttons');

        var cell = this._addButton(row, -1, 'pause-button.svg', iconSize, _('pause'));
        cell.onclick=function() {
            if (that._isMoving) {
                that._stop();
                this.innerHTML = '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' + _('pause') + '" alt="' + _('pause') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
                that._isMoving = false;
            } else {
                that._start();
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
        cell.innerHTML = '<input id="BPMNUMBER" style="-webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="BPMNUMBER" type="BPMNUMBER" value="' + this.BPM + '" />';
        cell.style.width = Math.floor(RHYTHMRULERHEIGHT * this.cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        docById('BPMNUMBER').classList.add('hasKeyboard');
        docById('TempoCanvas').addEventListener('dblclick', function() {
            that._useBPM();
        });

        docById('BPMNUMBER').addEventListener('keyup', function(e) {
            if (e.keyCode === 13) {
                that._useBPM();
            }
        });

        var cell = this._addButton(row, 4, 'close-button.svg', iconSize, _('close'));
        cell.onclick=function() {
            docById('TempoDiv').style.visibility = 'hidden';
            docById('TempoCanvas').style.visibility = 'hidden';
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
        this._widgetNextTime = this._widgetFirstTime + (60 / this.BPM) * 1000;

        this._intervalID = setInterval(function() {
            that._draw();
        }, 5);
    };

};
