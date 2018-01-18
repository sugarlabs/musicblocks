// Copyright (c) 2017,18 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// This widget makes displays the status of selected parameters and
// notes as they are being played.


function PlaybackWidget() {
    const BUTTONDIVWIDTH = 128;
    const BUTTONSIZE = 53;
    const ICONSIZE = 32;
    const OUTERWINDOWWIDTH = (BUTTONSIZE + 2) * 2;
    const INNERWINDOWWIDTH = OUTERWINDOWWIDTH - BUTTONSIZE * 1.5;

    docById('playbackDiv').style.visibility = 'hidden';

    /*
    this._playAll = function () {
        if (this._logo.turtles.running()) {
            this._playcell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/pause-button.svg" title="' + _('pause') + '" alt="' + _('pause') + '" height="' + ICONSIZE + '" width="' + ICONSIZE + '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
            this._logo.playback(-1);
	} else {
            this._playcell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' + _('play all') + '" alt="' + _('play all') + '" height="' + ICONSIZE + '" width="' + ICONSIZE + '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
            this._logo.stopTurtle = true;
        }
    };
    */

    this.init = function (logo) {
        // Initializes the playback matrix. First removes the
        // previous matrix and them make another one in DOM (document
        // object model)
        console.log('INITIALIZING PLAYBACK WIDGET');
        this._logo = logo;

        var w = window.innerWidth;
        this._cellScale = w / 1200;
        var iconSize = ICONSIZE * this._cellScale;

        var canvas = docById('myCanvas');

        // Position the widget and make it visible.
        var playbackDiv = docById('playbackDiv');
        playbackDiv.style.visibility = 'visible';
        playbackDiv.setAttribute('draggable', 'true');
        playbackDiv.style.left = '200px';
        playbackDiv.style.top = '150px';

        // The playback buttons
        var playbackButtonsDiv = docById('playbackButtonsDiv');
        playbackButtonsDiv.style.display = 'inline';
        playbackButtonsDiv.style.visibility = 'visible';
        playbackButtonsDiv.style.width = BUTTONDIVWIDTH;
        playbackButtonsDiv.innerHTML = '<table cellpadding="0px" id="playbackButtonTable"></table>';

        var buttonTable = docById('playbackButtonTable');
        var header = buttonTable.createTHead();
        var row = header.insertRow(0);

        // For the button callbacks
        var that = this;

        this._playcell = this._addButton(row, 'play-button.svg', ICONSIZE, _('play all'));

        this._playcell.onclick = function () {
            that._logo.playback(-1);  // that._playAll();
        }

        var cell = this._addButton(row, 'close-button.svg', ICONSIZE, _('close'));

        cell.onclick = function () {
            playbackTableDiv.style.visibility = 'hidden';
            playbackButtonsDiv.style.visibility = 'hidden';
            playbackDiv.style.visibility = 'hidden';
            that._logo.stopTurtle = true;
        }

        // We use this cell as a handle for dragging.
        var dragCell = this._addButton(row, 'grab.svg', ICONSIZE, _('drag'));
        dragCell.style.cursor = 'move';

        this._dx = dragCell.getBoundingClientRect().left - playbackDiv.getBoundingClientRect().left;
        this._dy = dragCell.getBoundingClientRect().top - playbackDiv.getBoundingClientRect().top;
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
                playbackDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
                playbackDiv.style.top = y + 'px';
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        playbackDiv.ondragover = function(e) {
            e.preventDefault();
        };

        playbackDiv.ondrop = function(e) {
            if (that._dragging) {
                that._dragging = false;
                var x = e.clientX - that._dx;
                playbackDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
                playbackDiv.style.top = y + 'px';
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        playbackDiv.onmousedown = function(e) {
            that._dragging = true;
            that._target = e.target;
        };

        playbackDiv.ondragstart = function(e) {
            if (dragCell.contains(that._target)) {
                e.dataTransfer.setData('text/plain', '');
            } else {
                e.preventDefault();
            }
        };

        // The playback table
        var playbackTableDiv = docById('playbackTableDiv');
        playbackTableDiv.style.display = 'inline';
        playbackTableDiv.style.visibility = 'visible';
        playbackTableDiv.style.border = '0px';

        // We use an outer div to scroll vertically and an inner div to
        // scroll horizontally.
        playbackTableDiv.innerHTML = '<div id="playbackOuterDiv"><div id="playbackInnerDiv"><table cellpadding="0px" id="playbackTable"></table></div></div>';

        var n = Math.max(Math.floor((window.innerHeight * 0.5) / 100), 8);
        var outerDiv = docById('playbackOuterDiv');
        if (this._logo.turtles.turtleList.length > n) {
            outerDiv.style.height = this._cellScale * MATRIXSOLFEHEIGHT * (n + 2) + 'px';
            var w = this._cellScale * BUTTONSIZE * 2 + 20;
            outerDiv.style.width = w + 'px';
        } else {
            outerDiv.style.height = this._cellScale * (MATRIXBUTTONHEIGHT2 + (2 + MATRIXSOLFEHEIGHT) * this._logo.turtles.turtleList.length) + 'px';
            var w = this._cellScale * BUTTONSIZE * 2;
            outerDiv.style.width = w + 'px';
        }

        var w = this._cellScale * BUTTONSIZE * 2;
        var innerDiv = docById('playbackInnerDiv');
        innerDiv.style.width = w + 'px';

        innerDiv.style.marginLeft = '0px';

        // Each row in the playback table contains a play button
        var playbackTable = docById('playbackTable');

        // One row per voice (turtle)
        var activeTurtles = 0;
        for (var turtle = 0; turtle < this._logo.turtles.turtleList.length; turtle++) {
            if (this._logo.turtles.turtleList[turtle].trash) {
                continue;
            }

            var row = playbackTable.insertRow();
            var label = _('mouse') + activeTurtles;
            var cell = row.insertCell(-1);
            cell.innerHTML = '&nbsp;&nbsp;<img src="images/mouse.svg" title="' + label + '" alt="' + label + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
            cell.style.width = BUTTONSIZE + 'px';
            cell.style.minWidth = cell.style.width;
            cell.style.maxWidth = cell.style.width;
            cell.style.height = cell.style.width;
            cell.style.minHeight = cell.style.height;
            cell.style.maxHeight = cell.style.height;
            cell.style.backgroundColor = MATRIXLABELCOLOR;
            cell.style.left = '1px';

            var buttonCell = this._addButton(row, 'play-button.svg', iconSize, _('play'));
            buttonCell.setAttribute('id', activeTurtles);

            buttonCell.onclick = function () {
                var id = Number(this.getAttribute('id'));
                that._logo.playback(id);
            };

            activeTurtles += 1;
        }
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
