// Copyright (c) 2016-17 Walter Bender
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
    const TEMPOINTERVAL = 5;
    const BUTTONDIVWIDTH = 476;  // 8 buttons 476 = (55 + 4) * 8
    const BUTTONSIZE = 53;
    const ICONSIZE = 32;
<<<<<<< HEAD
    const TEMPOWIDTH = 700;
    const TEMPOHEIGHT = 100;
    const YRADIUS = 75;

    this._xradius = YRADIUS / 3;

    this.BPMs = [];
    this.BPMBlocks = [];

    this._updateBPM = function (i) {
        this._intervals[i] = (60 / this.BPMs[i]) * 1000;

        if (this.BPMBlocks[i] != null) {
            var blockNumber = blocks.blockList[this.BPMBlocks[i]].connections[1];
            if (blockNumber != null) {
                this._logo.blocks.blockList[blockNumber].value = parseFloat(this.BPMs[i]);
                this._logo.blocks.blockList[blockNumber].text.text = this.BPMs[i];
=======

    this.isMoving = true;
    this._direction = 1;
    this._widgetFirstTime = null;
    this._widgetNextTime = 0;
    this._interval = 0;
    this._intervalID = null;
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
>>>>>>> 66903550bedf84b9e809240168e80ec846e35616
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
        var d = new Date();
<<<<<<< HEAD
        for (var i = 0; i < this.BPMs.length; i++) {
            this._widgetFirstTimes[i] = d.getTime();
            this._widgetNextTimes[i] = this._widgetFirstTimes[i] + this._intervals[i];
            this._directions[i] = 1;
        }
=======
        this._widgetFirstTime = d.getTime();
        this._widgetNextTime = this._widgetFirstTime + this._interval;
        this._direction = 1;
>>>>>>> 66903550bedf84b9e809240168e80ec846e35616

        // Restart the interval.
        var that = this;
        this._intervalID = setInterval(function() {
            that._draw();
        }, TEMPOINTERVAL);
    };

<<<<<<< HEAD
    this._useBPM = function (i) {
        this.BPMs[i] = docById('BPMInput' + i).value
        if (this.BPMs[i] > 1000) {
            this.BPMs[i] = 1000;
        } else if (this.BPMs[i] < 30) {
            this.BPMs[i] = 30;
        }

        this._updateBPM(i);
    };

    this._speedUp = function (i) {
        this.BPMs[i] = parseFloat(this.BPMs[i]) + 5;

        if (this.BPMs[i] > 1000) {
            this.BPMs[i] = 1000;
        }

        this._updateBPM(i);
        docById('BPMInput' + i).value = this.BPMs[i];
    };

    this._slowDown = function (i) {
        this.BPMs[i] = parseFloat(this.BPMs[i]) - 5;
        if (this.BPMs[i] < 30) {
            this.BPMs[i] = 30;
        }

        this._updateBPM(i);
        docById('BPMInput' + i).value = this.BPMs[i];
=======
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
>>>>>>> 66903550bedf84b9e809240168e80ec846e35616
    };

    this._draw = function() {
        // First thing to do is figure out where we are supposed to be
        // based on the elapsed time.
<<<<<<< HEAD
        var d = new Date();

        for (var i = 0; i < this.BPMs.length; i++) {
            var tempoCanvas = docById('tempoCanvas' + i);

            // We start the music clock as the first note is being
            // played.
            if (this._widgetFirstTimes[i] == null) {
                this._widgetFirstTimes[i] = d.getTime();
                this._widgetNextTimes[i] = this._widgetFirstTimes[i] + this._intervals[i];
            }

            // How much time has gone by?
            var deltaTime = this._widgetNextTimes[i] - d.getTime();

            // Are we done yet?
            if (d.getTime() > this._widgetNextTimes[i]) {
                // Play a tone.
                this._logo.synth.trigger('C4', 0.125, 'poly');
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
                    var dx = (tempoCanvas.width) * (deltaTime / this._intervals[i]);
                } else {
                    var dx = 0;
                }

                // Set this._xradius based on the dx to achieve the compressing effect
                if (tempoCanvas.width - dx <= YRADIUS / 3) {
                    this._xradius =  tempoCanvas.width - dx;
                } else if (dx <= YRADIUS / 3) {
                    this._xradius = dx;
                } else {
                    this._xradius = YRADIUS / 3;
                }

                // Set x based on dx and direction
                if (this._directions[i] === -1) {
                    var x = tempoCanvas.width - dx;
                } else {
                    var x = dx;
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

            var ctx = tempoCanvas.getContext('2d');
            ctx.clearRect(0, 0, tempoCanvas.width, tempoCanvas.height);
            ctx.beginPath();
            ctx.fillStyle = 'rgba(0,0,0,1)';
            ctx.ellipse(x, YRADIUS, Math.max(this._xradius, 1), YRADIUS, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        }
=======
        var tempoCanvas = docById('tempoCanvas');
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
                var dx = (tempoCanvas.width) * (deltaTime / this._interval);
            }

            //Set this._xradius based on the dx to achieve the compressing effect
            if (tempoCanvas.width - dx <= this._yradius) {
                this._xradius =  tempoCanvas.width - dx;
            } else if (dx <= this._yradius) {
                this._xradius = dx;
            } else {
                this._xradius = this._yradius;
            }

            //Set x based on dx and direction
            if (this._direction === -1) {
                var x = tempoCanvas.width - dx;
            } else {
                var x = dx;
            }
        }

        //Set x value if it is undefined
        if (x === undefined) {
            if (this._direction === -1) {
                x = 0;
            } else {
                x = tempoCanvas.width;
            }
        }

        var ctx = tempoCanvas.getContext('2d');
        ctx.clearRect(0, 0, tempoCanvas.width, tempoCanvas.height);
        ctx.beginPath();
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.ellipse(x, 50, Math.max(this._xradius, 1), this._yradius, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
>>>>>>> 66903550bedf84b9e809240168e80ec846e35616
    };

    this.init = function (logo) {
        this._logo = logo;
<<<<<<< HEAD
        this._directions = [];
        this._widgetFirstTimes = [];
        this._widgetNextTimes = [];
        this._firstClickTimes = null;
        this._intervals = [];
        this.isMoving = true;
        this._intervalID = null;
=======
>>>>>>> 66903550bedf84b9e809240168e80ec846e35616

        if (this._intervalID != null) {
            clearInterval(this._intervalID);
        }

        var w = window.innerWidth;
<<<<<<< HEAD
        var iconSize = ICONSIZE;
=======
        this._cellScale = w / 1200;
        var iconSize = ICONSIZE * this._cellScale;
>>>>>>> 66903550bedf84b9e809240168e80ec846e35616

        var canvas = document.getElementById('myCanvas');

        // Position the widget and make it visible.
        var tempoDiv = docById('tempoDiv');
        tempoDiv.style.visibility = 'visible';
        tempoDiv.setAttribute('draggable', 'true');
        tempoDiv.style.left = '200px';
        tempoDiv.style.top = '150px';

        // The widget buttons
        var widgetButtonsDiv = docById('tempoButtonsDiv');
        widgetButtonsDiv.style.display = 'inline';
        widgetButtonsDiv.style.visibility = 'visible';
        widgetButtonsDiv.style.width = BUTTONDIVWIDTH;
        widgetButtonsDiv.innerHTML = '<table cellpadding="0px" id="tempoButtonTable"></table>';

        var buttonTable = docById('tempoButtonTable');
        var header = buttonTable.createTHead();
        var row = header.insertRow(0);

        // For the button callbacks
        var that = this;

        var cell = this._addButton(row, 'pause-button.svg', ICONSIZE, _('pause'));

        cell.onclick=function() {
            if (that.isMoving) {
                that.pause();
                this.innerHTML = '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' + _('pause') + '" alt="' + _('pause') + '" height="' + ICONSIZE + '" width="' + ICONSIZE + '" vertical-align="middle">&nbsp;&nbsp;';
                that.isMoving = false;
            } else {
                that.resume();
                this.innerHTML = '&nbsp;&nbsp;<img src="header-icons/pause-button.svg" title="' + _('play') + '" alt="' + _('play') + '" height="' + ICONSIZE + '" width="' + ICONSIZE + '" vertical-align="middle">&nbsp;&nbsp;';
                that.isMoving = true;
            }
        };

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        };

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        };

<<<<<<< HEAD
        var cell = this._addButton(row, 'close-button.svg', ICONSIZE, _('close'));
        cell.onclick=function() {
            tempoDiv.style.visibility = 'hidden';
            tempoButtonsDiv.style.visibility = 'hidden';

            for (var i = 0; i < that.BPMs.length; i++) {
                docById('tempoCanvas' + i).style.visibility = 'hidden';
            }

=======
        var cell = this._addButton(row, 'up.svg', ICONSIZE, _('speed up'));
        cell.onclick=function() {
            that._speedUp();
        };

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        };

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        };

        var cell = this._addButton(row, 'down.svg', ICONSIZE, _('slow down'));
        cell.onclick=function() {
            that._slowDown();
        };

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        };

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        };

        var cell = row.insertCell();
        cell.innerHTML = '<input id="BPMInput" style="-webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="BPMInput" type="BPMInput" value="' + this.BPM + '" />';
        cell.style.width = BUTTONSIZE + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = BUTTONSIZE + 'px';
        cell.style.minHeight = cell.style.height;
        cell.style.maxHeight = cell.style.height;
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        var tempoCanvas = docById('tempoCanvas');
        tempoCanvas.style.visibility = 'visible';
        tempoCanvas.style.left = widgetButtonsDiv.getBoundingClientRect().left + 'px';
        tempoCanvas.style.top = widgetButtonsDiv.getBoundingClientRect().top + BUTTONSIZE + 'px';

        var BPMInput = docById('BPMInput');

        tempoCanvas.addEventListener('click', function() {
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
                    BPMInput.value = that.BPM;
                    that._firstClickTime = null;
                } else {
                    that._firstClickTime = d.getTime();
                }
            }
        });

        BPMInput.classList.add('hasKeyboard');
        BPMInput.addEventListener('keyup', function(e) {
            if (e.keyCode === 13) {
                that._useBPM();
            }
        });

        var cell = this._addButton(row, 'close-button.svg', ICONSIZE, _('close'));
        cell.onclick=function() {
            tempoDiv.style.visibility = 'hidden';
            tempoCanvas.style.visibility = 'hidden';
            tempoButtonsDiv.style.visibility = 'hidden';
>>>>>>> 66903550bedf84b9e809240168e80ec846e35616
            if (that._intervalID != null) {
                clearInterval(that._intervalID);
            }
        };

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        };

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        };

        // We use this cell as a handle for dragging.
        var dragCell = this._addButton(row, 'grab.svg', ICONSIZE, _('drag'));
        dragCell.style.cursor = 'move';

        this._dx = dragCell.getBoundingClientRect().left - tempoDiv.getBoundingClientRect().left;
        this._dy = dragCell.getBoundingClientRect().top - tempoDiv.getBoundingClientRect().top;
        this._dragging = false;
        this._target = false;
        this._dragCellHTML = dragCell.innerHTML;

        dragCell.onmouseover = function(e) {
            // In order to prevent the dragged item from triggering a
            // browser reload in Firefox, we empty the cell contents
            // before dragging.
            dragCell.innerHTML = '';
        };

        dragCell.onmouseout = function(e) {
            if (!that._dragging) {
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        canvas.ondragover = function(e) {
            e.preventDefault();
        };

        canvas.ondrop = function(e) {
            if (that._dragging) {
                that._dragging = false;
                var x = e.clientX - that._dx;
                tempoDiv.style.left = x + 'px';
<<<<<<< HEAD
                var y = e.clientY - that._dy;
                tempoDiv.style.top = y + 'px';
=======
                tempoCanvas.style.left = tempoDiv.style.left;
                var y = e.clientY - that._dy;
                tempoDiv.style.top = y + 'px';
                tempoCanvas.style.top = y + BUTTONSIZE + 'px';
>>>>>>> 66903550bedf84b9e809240168e80ec846e35616
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        tempoDiv.ondragover = function(e) {
            e.preventDefault();
        };

        tempoDiv.ondrop = function(e) {
            if (that._dragging) {
                that._dragging = false;
                var x = e.clientX - that._dx;
                tempoDiv.style.left = x + 'px';
<<<<<<< HEAD
                var y = e.clientY - that._dy;
                tempoDiv.style.top = y + 'px';
=======
                tempoCanvas.style.left = tempoDiv.style.left;
                var y = e.clientY - that._dy;
                tempoDiv.style.top = y + 'px';
                tempoCanvas.style.top = y + BUTTONSIZE + 'px';
>>>>>>> 66903550bedf84b9e809240168e80ec846e35616
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        tempoDiv.onmousedown = function(e) {
            that._dragging = true;
            that._target = e.target;
        };

        tempoDiv.ondragstart = function(e) {
            if (dragCell.contains(that._target)) {
                e.dataTransfer.setData('text/plain', '');
            } else {
                e.preventDefault();
            }
        };

<<<<<<< HEAD
        var canvasCells = [];
        var tempoCanvases = [];

        for (var i = 0; i < this.BPMs.length; i++) {
            this._directions.push(1);
            this._widgetFirstTimes.push(this._logo.firstNoteTime);
            this._intervals.push((60 / this.BPMs[i]) * 1000);
            this._widgetNextTimes.push(this._widgetFirstTimes[i] - this._intervals[i]);

            var row = buttonTable.insertRow();
            var cell = this._addButton(row, 'up.svg', ICONSIZE, _('speed up'));
            cell.setAttribute('id', i);

            cell.onclick=function() {
                var id = Number(this.getAttribute('id'));
                that._speedUp(id);
            };

            cell.onmouseover=function() {
                this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
            };

            cell.onmouseout=function() {
                this.style.backgroundColor = MATRIXBUTTONCOLOR;
            };

            var cell = this._addButton(row, 'down.svg', ICONSIZE, _('slow down'));
            cell.setAttribute('id', i);

            cell.onclick=function() {
                var id = Number(this.getAttribute('id'));
                that._slowDown(id);
            };

            cell.onmouseover=function() {
                this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
            };

            cell.onmouseout=function() {
                this.style.backgroundColor = MATRIXBUTTONCOLOR;
            };

            var cell = row.insertCell();
            cell.innerHTML = '<input id="BPMInput' + i + '" style="-webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="BPMInput" type="BPMInput" value="' + this.BPMs[i] + '" />';
            cell.setAttribute('id', i);
            cell.style.width = BUTTONSIZE + 'px';
            cell.style.minWidth = cell.style.width;
            cell.style.maxWidth = cell.style.width;
            cell.style.height = BUTTONSIZE + 'px';
            cell.style.minHeight = cell.style.height;
            cell.style.maxHeight = cell.style.height;
            cell.style.backgroundColor = MATRIXBUTTONCOLOR;

            var row = buttonTable.insertRow();
            canvasCells.push(row.insertCell());
            canvasCells[i].style.height = TEMPOHEIGHT - 2 + 'px';

            tempoCanvases.push(document.createElement('canvas'));
            tempoCanvases[i].setAttribute('id', 'tempoCanvas' + i);
            tempoCanvases[i].style.width = TEMPOWIDTH + 'px'
            tempoCanvases[i].style.height = TEMPOHEIGHT + 'px';
            tempoCanvases[i].style.position = 'absolute';
            tempoCanvases[i].style.border = '1px';
            tempoCanvases[i].style.background = 'rgba(255, 255, 255, 1)';

            canvasCells[i].appendChild(tempoCanvases[i]);

            tempoCanvases[i].style.visibility = 'visible';
            tempoCanvases[i].style.top = canvasCells[i].getBoundingClientRect().top - TEMPOHEIGHT + 1 - BUTTONSIZE + 'px';

            // The tempo can be set from the interval between
            // successive clicks on the canvas.
            tempoCanvases[i].addEventListener('click', function() {
                id = Number(this.getAttribute('id').replace('tempoCanvas', ''));
                var d = new Date();
                if (that._firstClickTime == null) {
                    that._firstClickTime = d.getTime();
                } else {
                    var newBPM = parseInt((60 * 1000) / (d.getTime() - that._firstClickTime));
                    if (newBPM > 29 && newBPM < 1001) {
                        that.BPMs[id] = newBPM;
                        that._updateBPM(id);
                        var BPMInput = docById('BPMInput' + id);
                        BPMInput.value = that.BPMs[id];
                        that._firstClickTime = null;
                    } else {
                        that._firstClickTime = d.getTime();
                    }
                }
            });

            var BPMInput = docById('BPMInput' + i);
            BPMInput.classList.add('hasKeyboard');
            BPMInput.addEventListener('keyup', function(e) {
                if (e.keyCode === 13) {
                    id = Number(this.getAttribute('id').replace('BPMInput', ''));
                    console.log(id);
                    that._useBPM(id);
                }
            });
        }

        this.resume();
=======
        this._direction = 1;

        // When we start, we try to synch with the turtles.
        this._widgetFirstTime = this._logo.firstNoteTime;
        this._interval = (60 / this.BPM) * 1000;
        this._widgetNextTime = this._widgetFirstTime + this._interval;

        this._intervalID = setInterval(function() {
            that._draw();
        }, TEMPOINTERVAL);
>>>>>>> 66903550bedf84b9e809240168e80ec846e35616
    };

    this._addButton = function(row, icon, iconSize, label) {
        var cell = row.insertCell(-1);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/' + icon + '" title="' + label + '" alt="' + label + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
        cell.style.width = BUTTONSIZE + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = cell.style.width; 
        cell.style.minHeight = cell.style.height;
        cell.style.maxHeight = cell.style.height;
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        return cell;
    };
};
