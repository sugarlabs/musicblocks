// Copyright (c) 2015 Yash Khandelwal
// Copyright (c) 2015-17 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

const MATRIXGRAPHICS = ['forward', 'back', 'right', 'left', 'setcolor', 'setshade', 'sethue', 'setgrey', 'settranslucency', 'setpensize', 'setheading'];
const MATRIXGRAPHICS2 = ['arc', 'setxy'];
// Deprecated
const MATRIXSYNTHS = ['sine', 'triangle', 'sawtooth', 'square', 'hertz'];


function PitchTimeMatrix () {
    const BUTTONDIVWIDTH = 476;  // 8 buttons 476 = (55 + 4) * 8
    const OUTERWINDOWWIDTH = 728;  // 675;
    const INNERWINDOWWIDTH = 600;
    const BUTTONSIZE = 53;
    const ICONSIZE = 32;

    // rowLabels can contain either a pitch, a drum, or a grphics command
    this.rowLabels = [];
    // rowArgs can contain an octave or the arg(s) to a graphics command
    this.rowArgs = [];

    this._sorted = false;
    this._notesToPlay = [];
    this._matrixHasTuplets = false;
    this._notesCounter = 0;
    this._noteStored = [];

    // The pitch-block number associated with a row; a rhythm block is
    // associated with a column. We need to keep track of which
    // intersections in the grid are populated.  The blockMap is a
    // list of selected nodes in the matrix that map pitch blocks to
    // rhythm blocks (note that rhythm blocks can span multiple
    // columns).

    // These arrays get created each time the matrix is built.
    this._rowBlocks = [];  // pitch-block number
    this._colBlocks = [];  // [rhythm-block number, note number]

    // This array keeps track of the position of the rows after sorting.
    this._rowMap = [];
    // And offsets due to deleting duplicates.
    this._rowOffset = [];

    // This array is preserved between sessions.
    // We populate the blockMap whenever a note is selected and
    // restore any notes that might be present.

    this._blockMap = [];

    this.clearBlocks = function() {
        this._rowBlocks = [];
        this._colBlocks = [];
        this._rowMap = [];
        this._rowOffset = [];
    };

    this.addRowBlock = function(rowBlock) {
        this._rowMap.push(this._rowBlocks.length);
        this._rowOffset.push(0);
        this._rowBlocks.push(rowBlock);
    };

    this.addColBlock = function(rhythmBlock, n) {
        // Search for previous instance of the same block (from a repeat)
        var startIdx = 0;
        for (var i = 0; i < this._colBlocks.length; i++) {
            var obj = this._colBlocks[i];
            if (obj[0] === rhythmBlock) {
                startIdx += 1;
            }
        }

        for (var i = startIdx; i < n + startIdx; i++) {
            this._colBlocks.push([rhythmBlock, i]);
        }
    };

    this.addNode = function(pitchBlock, rhythmBlock, n) {
        for (var i = 0; i < this._blockMap.length; i++) {
            var obj = this._blockMap[i];
            if (obj[0] === pitchBlock && obj[1][0] === rhythmBlock && obj[1][1] === n) {
                return;  // node is already in the list
            }
        }
        this._blockMap.push([pitchBlock, [rhythmBlock, n]]);
    };

    this.removeNode = function(pitchBlock, rhythmBlock, n) {
        for (var i = 0; i < this._blockMap.length; i++) {
            var obj = this._blockMap[i];
            if (obj[0] === pitchBlock && obj[1][0] === rhythmBlock && obj[1][1] === n) {
                this._blockMap[i] = [-1, [-1, 1, 0]];  // Mark as removed
            }
        }
    };

    this.init = function(logo) {
        // Initializes the matrix. First removes the previous matrix
        // and them make another one in DOM (document object model)
        this._noteStored = [];
        this._sorted = false;
        this._rests = 0;
        this._logo = logo;

        var w = window.innerWidth;
        this._cellScale = w / 1200;
        var iconSize = ICONSIZE * this._cellScale;

        var canvas = docById('myCanvas');

        // Position the widget and make it visible.
        var ptmDiv = docById('ptmDiv');
        ptmDiv.style.visibility = 'visible';
        ptmDiv.setAttribute('draggable', 'true');
        ptmDiv.style.left = '200px';
        ptmDiv.style.top = '150px';

        // The ptm buttons
        var ptmButtonsDiv = docById('ptmButtonsDiv');
        ptmButtonsDiv.style.display = 'inline';
        ptmButtonsDiv.style.visibility = 'visible';
        ptmButtonsDiv.style.width = BUTTONDIVWIDTH;
        ptmButtonsDiv.innerHTML = '<table cellpadding="0px" id="ptmButtonTable"></table>';

        var buttonTable = docById('ptmButtonTable');
        var header = buttonTable.createTHead();
        var row = header.insertRow(0);

        // For the button callbacks
        var that = this;

        console.log('notes ' + this.rowLabels + ' octave ' + this.rowArgs);

        this._notesToPlay = [];
        this._matrixHasTuplets = false;

        // Add the buttons to the top row.
        var that = this;

        var cell = this._addButton(row, 'play-button.svg', ICONSIZE, _('play'));
        cell.onclick=function() {
            that._logo.setTurtleDelay(0);
            that.playAll();
        }

        var cell = this._addButton(row, 'export-chunk.svg', ICONSIZE, _('save'));
        cell.onclick=function() {
            that._save();
        }

        var cell = this._addButton(row, 'erase-button.svg', ICONSIZE, _('clear'));
        cell.onclick=function() {
            that._clear();
        }

        var cell = this._addButton(row, 'export-button.svg', ICONSIZE, _('export'));
        cell.onclick=function() {
            that._export();
        }

        var cell = this._addButton(row, 'sort.svg', ICONSIZE, _('sort'));
        cell.onclick=function() {
            that._sort();
        }

        var cell = this._addButton(row, 'close-button.svg', ICONSIZE, _('close'));
        cell.onclick=function() {
            that._rowOffset = [];
            for (var i = 0; i < that._rowMap.length; i++) {
                that._rowMap[i] = i;
            }
            that._logo.synth.stopSound('default');
            that._logo.synth.stop();

            ptmTableDiv.style.visibility = 'hidden';
            ptmButtonsDiv.style.visibility = 'hidden';
            ptmDiv.style.visibility = 'hidden';
        }

        // We use this cell as a handle for dragging.
        var dragCell = this._addButton(row, 'grab.svg', ICONSIZE, _('drag'));
        dragCell.style.cursor = 'move';

        this._dx = dragCell.getBoundingClientRect().left - ptmDiv.getBoundingClientRect().left;
        this._dy = dragCell.getBoundingClientRect().top - ptmDiv.getBoundingClientRect().top;
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
                ptmDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
                ptmDiv.style.top = y + 'px';
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        ptmDiv.ondragover = function(e) {
            e.preventDefault();
        };

        ptmDiv.ondrop = function(e) {
            if (that._dragging) {
                that._dragging = false;
                var x = e.clientX - that._dx;
                ptmDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
                ptmDiv.style.top = y + 'px';
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        ptmDiv.onmousedown = function(e) {
            that._dragging = true;
            that._target = e.target;
        };

        ptmDiv.ondragstart = function(e) {
            if (dragCell.contains(that._target)) {
                e.dataTransfer.setData('text/plain', '');
            } else {
                e.preventDefault();
            }
        };

        // The ptm table
        var ptmTableDiv = docById('ptmTableDiv');
        ptmTableDiv.style.display = 'inline';
        ptmTableDiv.style.visibility = 'visible';
        ptmTableDiv.style.border = '0px';
        ptmTableDiv.innerHTML = '';

        // We use an outer div to scroll vertically and an inner div to
        // scroll horizontally.
        ptmTableDiv.innerHTML = '<div id="ptmOuterDiv"><div id="ptmInnerDiv"><table cellpadding="0px" id="ptmTable"></table></div></div>';

        var n = Math.max(Math.floor((window.innerHeight * 0.5) / 100), 8);
        var outerDiv = docById('ptmOuterDiv');
        if (this.rowLabels.length > n) {
            outerDiv.style.height = this._cellScale * MATRIXSOLFEHEIGHT * (n + 6) + 'px';
            var w = Math.max(Math.min(window.innerWidth, this._cellScale * OUTERWINDOWWIDTH), BUTTONDIVWIDTH);
            outerDiv.style.width = w + 'px';
        } else {
            outerDiv.style.height = this._cellScale * MATRIXSOLFEHEIGHT * (this.rowLabels.length + 3) + 'px';
            var w = Math.max(Math.min(window.innerWidth, this._cellScale * OUTERWINDOWWIDTH - 20), BUTTONDIVWIDTH);
            outerDiv.style.width = w + 'px';
        }

        var w = Math.max(Math.min(window.innerWidth, this._cellScale * INNERWINDOWWIDTH), BUTTONDIVWIDTH - BUTTONSIZE);
        var innerDiv = docById('ptmInnerDiv');
        innerDiv.style.width = w + 'px';
        innerDiv.style.marginLeft = (BUTTONSIZE * 2 * this._cellScale) + 'px';

        // Each row in the ptm table contains a note label in the
        // first column and a table of buttons in the second column.
        var ptmTable = docById('ptmTable');

        var j = 0;
        for (var i = 0; i < this.rowLabels.length; i++) {
            if (this.rowLabels[i].toLowerCase() === 'rest') {
                this._rests += 1;
                continue;
            }

            var ptmTableRow = ptmTable.insertRow();

            // A cell for the row label graphic
            var cell = ptmTableRow.insertCell();
            cell.style.backgroundColor = MATRIXLABELCOLOR;
            cell.style.fontSize = this._cellScale * 100 + '%';
            cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 1 + 'px';
            cell.style.width = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + 'px';
            cell.style.minWidth = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + 'px';
            cell.style.maxWidth = cell.style.minWidth;
            cell.className = 'headcol';  // This cell is fixed horizontally.
            cell.innerHTML = '';

            var drumName = getDrumName(this.rowLabels[i]);

            if (drumName != null) {
                cell.innerHTML = '&nbsp;&nbsp;<img src="' + getDrumIcon(drumName) + '" title="' + drumName + '" alt="' + drumName + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
            } else if (this.rowLabels[i].slice(0, 4) === 'http') {
                cell.innerHTML = '&nbsp;&nbsp;<img src="' + getDrumIcon(this.rowLabels[i]) + '" title="' + this.rowLabels[i] + '" alt="' + this.rowLabels[i] + '" height="' + iconSize / 2 + '" width="' + iconSize / 2 + '" vertical-align="middle"/>&nbsp;&nbsp;';
            } else if (MATRIXSYNTHS.indexOf(this.rowLabels[i]) !== -1) {
                cell.innerHTML = '&nbsp;&nbsp;<img src="' + "images/synth2.svg" + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
            } else if (MATRIXGRAPHICS.indexOf(this.rowLabels[i]) !== -1) {
                cell.innerHTML = '&nbsp;&nbsp;<img src="' + "images/mouse.svg" + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
            } else if (MATRIXGRAPHICS2.indexOf(this.rowLabels[i]) !== -1) {
                cell.innerHTML = '&nbsp;&nbsp;<img src="' + "images/mouse.svg" + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
            }

            // A cell for the row label
            var cell = ptmTableRow.insertCell();
            cell.style.backgroundColor = MATRIXLABELCOLOR;
            cell.style.fontSize = this._cellScale * 100 + '%';
            cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 1 + 'px';
            cell.style.width = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + 'px';
            cell.style.minWidth = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + 'px';
            cell.style.maxWidth = cell.style.minWidth;
            cell.className = 'labelcol';  // This cell is fixed horizontally.
            cell.style.left = (BUTTONSIZE * this._cellScale) + 'px';

            if (drumName != null) {
                cell.innerHTML = drumName;
                cell.style.fontSize = Math.floor(this._cellScale * 14) + 'px';
                this._noteStored.push(drumName);
            } else if (this.rowLabels[i].slice(0, 4) === 'http') {
                cell.innerHTML = this.rowLabels[i];
                cell.style.fontSize = Math.floor(this._cellScale * 14) + 'px';
                this._noteStored.push(this.rowLabels[i].replace(/ /g,':'));
            } else if (MATRIXSYNTHS.indexOf(this.rowLabels[i]) !== -1) {
                cell.innerHTML = this.rowArgs[i];
                cell.style.fontSize = Math.floor(this._cellScale * 14) + 'px';
                this._noteStored.push(this.rowArgs[i]);
            } else if (MATRIXGRAPHICS.indexOf(this.rowLabels[i]) !== -1) {
                cell.innerHTML = _(this.rowLabels[i]) + '<br>' + this.rowArgs[i];
                cell.style.fontSize = Math.floor(this._cellScale * 12) + 'px';
                this._noteStored.push(this.rowLabels[i] + ':' + this.rowArgs[i]);
            } else if (MATRIXGRAPHICS2.indexOf(this.rowLabels[i]) !== -1) {
                cell.innerHTML = _(this.rowLabels[i]) + '<br>' + this.rowArgs[i][0] + ' ' + this.rowArgs[i][1];
                cell.style.fontSize = Math.floor(this._cellScale * 12) + 'px';
                this._noteStored.push(this.rowLables[i] + ':' + this.rowArgs[i][0] + ':' + this.rowArgs[i][1]);
            } else {
                if (noteIsSolfege(this.rowLabels[i])) {
                    cell.innerHTML = i18nSolfege(this.rowLabels[i]) + this.rowArgs[i].toString().sub();
                    var noteObj = this._logo.getNote(cell.innerHTML, -1, 0, this._logo.keySignature[0]);
                } else {
                    cell.innerHTML = this.rowLabels[i] + this.rowArgs[i].toString().sub();
                    var noteObj = [this.rowLabels[i], this.rowArgs[i]];
                }
                this._noteStored.push(noteObj[0] + noteObj[1]);
            }

            var ptmCell = ptmTableRow.insertCell();
            // Create tables to store individual notes.
            ptmCell.innerHTML = '<table cellpadding="0px" id="ptmCellTable' + j + '"></table>';
            var ptmCellTable = docById('ptmCellTable' + j);

            // We'll use this element to put the clickable notes for this row.
            var ptmRow = ptmCellTable.insertRow();
            ptmRow.setAttribute('id', 'ptm' + j);

            j += 1;
        }

        // An extra row for the note and tuplet values
        var ptmTableRow = ptmTable.insertRow();
        var ptmCell = ptmTableRow.insertCell();
        ptmCell.className = 'headcol';  // This cell is fixed horizontally.
        ptmCell.innerHTML = '<table cellpadding="0px"><tr><td id="ptmTupletNoteLabel"></td></tr><tr><td id="ptmTupletValueLabel"></td></tr><tr><td id="ptmNoteValueLabel"></td></tr></table>';

        var labelCell = docById('ptmNoteValueLabel');
        labelCell.innerHTML = _('note value');
        labelCell.style.fontSize = this._cellScale * 75 + '%';
        labelCell.style.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
        labelCell.style.width = Math.floor(2 * MATRIXSOLFEWIDTH * this._cellScale) + 'px';
        labelCell.style.minWidth = labelCell.style.width;
        labelCell.style.maxWidth = labelCell.style.width;
        labelCell.style.backgroundColor = MATRIXLABELCOLOR;

        var ptmCell = ptmTableRow.insertCell();
        // Create tables to store individual note values.
        ptmCell.innerHTML = '<table  class="ptmTable" cellpadding="0px"><tr id="ptmTupletNoteValueRow"></tr><tr id="ptmTupletValueRow"></tr><tr id="ptmNoteValueRow"></tr></table>';
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

    this._generateDataURI = function(file) {
        var data = "data:text/html;charset=utf-8," + encodeURIComponent(file);
        return data;
    };

    this._sort = function() {
        if (this._sorted) {
            console.log('already sorted');
            return;
        }

        var sortableList = [];

        // Make a list to sort, skipping drums and graphics.
        // frequency;label;arg;row index
        for (var i = 0; i < this.rowLabels.length; i++) {
            if (this.rowLabels[i].toLowerCase() === 'rest') {
                continue;
            }

            var drumName = getDrumName(this.rowLabels[i]);
            if (drumName != null) {
                continue;
            } else if (MATRIXGRAPHICS.indexOf(this.rowLabels[i]) !== -1) {
                continue;
            } else if (MATRIXGRAPHICS2.indexOf(this.rowLabels[i]) !== -1) {
                continue;
            }

            // We want to sort based on frequency, so we convert all notes to frequency.
            // Deprecated
            if (MATRIXSYNTHS.indexOf(this.rowLabels[i]) !== -1) {
                sortableList.push([this.rowArgs[i], this.rowLabels[i], this.rowArgs[i], i, this._noteStored[i]]);
            } else {
                sortableList.push([noteToFrequency(this.rowLabels[i] + this.rowArgs[i], this._logo.keySignature[0]), this.rowLabels[i], this.rowArgs[i], i, this._noteStored[i]]);
            }
        }

        // Add the stuff we didn't sort.
        for (var i = 0; i < this.rowLabels.length; i++) {
            var drumName = getDrumName(this.rowLabels[i]);
            if (drumName != null) {
                sortableList.push([-2, this.rowLabels[i], this.rowArgs[i], i, this._noteStored[i]]);
            }
        }

        for (var i = 0; i < this.rowLabels.length; i++) {
            if (MATRIXGRAPHICS.indexOf(this.rowLabels[i]) !== -1) {
                sortableList.push([-1, this.rowLabels[i], this.rowArgs[i], i, this._noteStored[i]]);
            } else if (MATRIXGRAPHICS2.indexOf(this.rowLabels[i]) !== -1) {
                sortableList.push([-1, this.rowLabels[i], this.rowArgs[i], i, this._noteStored[i]]);
            }
        }

        var sortedList = sortableList.sort(
            function(a, b) {
                return a[0] - b[0]
            }
        )

        // Reverse since we start from the top of the table.
        sortedList = sortedList.reverse();

        this.rowLabels = [];
        this.rowArgs = [];
        for (var i = 0; i < sortedList.length; i++) {
            var obj = sortedList[i];

            this._rowMap[obj[3]] = i;
            this._noteStored[i] = obj[4];

            if (i > 0 && typeof(obj[2]) !== 'object' && (Number(obj[2]) === last(this.rowArgs) && obj[1] === last(this.rowLabels))) {
                // skip duplicates
                for (var j = this._rowMap[i]; j < this._rowMap.length; j++) {
                    this._rowOffset[j] -= 1;
                }

                this._rowMap[i] = this._rowMap[i - 1];
                continue;
            } else if (i > 0 && obj[1] === last(this.rowLabels)) {
                // test multiple args for match
                var argType = typeof(last(this.rowArgs));
                if (argType === 'object') {
                    if ((Number(obj[2][0]) === last(this.rowArgs)[0]) && (Number(obj[2][1]) === last(this.rowArgs)[1])) {
                        // skip duplicates
                        for (var j = this._rowMap[i]; j < this._rowMap.length; j++) {
                            this._rowOffset[j] -= 1;
                        }

                        this._rowMap[i] = this._rowMap[i - 1];
                        continue;
                    }
                }
            }

            this.rowLabels.push(obj[1]);
            this.rowArgs.push(Number(obj[2]));
        }

        this._matrixHasTuplets = false;  // Force regenration of tuplet rows.
        this.init(this._logo);
        this._sorted = true;

        for (var i = 0; i < this._logo.tupletRhythms.length; i++) {
            switch (this._logo.tupletRhythms[i][0]) {
            case 'simple':
            case 'notes':
                var tupletParam = [this._logo.tupletParams[this._logo.tupletRhythms[i][1]]];
                tupletParam.push([]);
                for (var j = 2; j < this._logo.tupletRhythms[i].length; j++) {
                    tupletParam[1].push(this._logo.tupletRhythms[i][j]);
                }
                this.addTuplet(tupletParam);
                break;
            default:
                this.addNotes(this._logo.tupletRhythms[i][1], this._logo.tupletRhythms[i][2]);
                break;
            }
        }

        this.makeClickable();
    };

    this._export = function() {
        var exportWindow = window.open('');
        var exportDocument = exportWindow.document;
        var title = exportDocument.createElement('title');
        title.innerHTML = 'Music Matrix';
        exportDocument.head.appendChild(title);

        var w = exportDocument.createElement('H3');
        w.innerHTML = 'Music Matrix';

        exportDocument.body.appendChild(w);

        var x = exportDocument.createElement('TABLE');
        x.setAttribute('id', 'exportTable');
        x.style.textAlign = 'center';

        exportDocument.body.appendChild(x);

        var exportTable = exportDocument.getElementById('exportTable');

        var header = exportTable.createTHead();

        for (var i = 0, row; row = docById('ptm' + i); i++) {
            var exportRow = header.insertRow();
            // Add the row label...
            var exportLabel = exportRow.insertCell();

            var drumName = getDrumName(this.rowLabels[i]);
            if (drumName != null) {
                exportLabel.innerHTML = drumName;
                exportLabel.style.fontSize = Math.floor(this._cellScale * 14) + 'px';
            } else if (this.rowLabels[i].slice(0, 4) === 'http') {
                exportLabel.innerHTML = this.rowLabels[i];
                exportLabel.style.fontSize = Math.floor(this._cellScale * 14) + 'px';
            } else if (MATRIXSYNTHS.indexOf(this.rowLabels[i]) !== -1) {
                exportLabel.innerHTML = this.rowArgs[i];
                exportLabel.style.fontSize = Math.floor(this._cellScale * 14) + 'px';
            } else if (MATRIXGRAPHICS.indexOf(this.rowLabels[i]) !== -1) {
                exportLabel.innerHTML = _(this.rowLabels[i]) + '<br>' + this.rowArgs[i];
                exportLabel.style.fontSize = Math.floor(this._cellScale * 12) + 'px';
            } else if (MATRIXGRAPHICS2.indexOf(this.rowLabels[i]) !== -1) {
                exportLabel.innerHTML = _(this.rowLabels[i]) + '<br>' + this.rowArgs[i][0] + ' ' + this.rowArgs[i][1];
                exportLabel.style.fontSize = Math.floor(this._cellScale * 12) + 'px';
            } else {
                if (noteIsSolfege(this.rowLabels[i])) {
                    exportLabel.innerHTML = i18nSolfege(this.rowLabels[i]) + this.rowArgs[i].toString().sub();
                } else {
                    exportLabel.innerHTML = this.rowLabels[i] + this.rowArgs[i].toString().sub();
                }
            }

            // Add then the note cells.
            for (var j = 0, col; col = row.cells[j]; j++) {
                var exportCell = exportRow.insertCell();
                exportCell.style.backgroundColor = col.style.backgroundColor;
                exportCell.innerHTML = col.innerHTML;
                exportCell.width = col.width;
                if (exportCell.width == '') {
                    exportCell.width = col.style.width;
                }
                exportCell.colSpan = col.colSpan;
                exportCell.style.minWidth = col.style.width;
                exportCell.style.maxWidth = col.style.width;
                exportCell.height = 30 + 'px';
                exportCell.style.fontSize = 14 + 'px';
                exportCell.style.padding = 1 + 'px';
            }
        }

        if (this._matrixHasTuplets) {
            // Add the tuplet note value row.
            var exportRow = header.insertRow();
            var exportLabel = exportRow.insertCell();
            exportLabel.innerHTML = _('note value');
            var noteValueRow = docById('ptmTupletNoteValueRow');
            for (var i = 0; i < noteValueRow.cells.length; i++) {
                var exportCell = exportRow.insertCell();
                var col = noteValueRow.cells[i];
                exportCell.style.backgroundColor = col.style.backgroundColor;
                exportCell.innerHTML = col.innerHTML;
                exportCell.width = col.width;
                if (exportCell.width == '') {
                    exportCell.width = col.style.width;
                }
                exportCell.colSpan = col.colSpan;
                exportCell.style.minWidth = col.style.width;
                exportCell.style.maxWidth = col.style.width;
                exportCell.style.fontSize = 14 + 'px';
                exportCell.style.padding = 1 + 'px';
            }

            // Add the tuplet value row.
            var exportRow = header.insertRow();
            var exportLabel = exportRow.insertCell();
            exportLabel.innerHTML = _('tuplet value');
            var noteValueRow = docById('ptmTupletValueRow');
            for (var i = 0; i < noteValueRow.cells.length; i++) {
                var exportCell = exportRow.insertCell();
                var col = noteValueRow.cells[i];
                exportCell.style.backgroundColor = col.style.backgroundColor;
                exportCell.innerHTML = col.innerHTML;
                exportCell.width = col.width;
                if (exportCell.width == '') {
                    exportCell.width = col.style.width;
                }
                exportCell.colSpan = col.colSpan;
                exportCell.style.minWidth = col.style.width;
                exportCell.style.maxWidth = col.style.width;
                exportCell.style.fontSize = 14 + 'px';
                exportCell.style.padding = 1 + 'px';
            }
        }

        // Add the note value row.
        var exportRow = header.insertRow();
        var exportLabel = exportRow.insertCell();
        exportLabel.innerHTML = _('note value');
        var noteValueRow = docById('ptmNoteValueRow');
        for (var i = 0; i < noteValueRow.cells.length; i++) {
            var exportCell = exportRow.insertCell();
            var col = noteValueRow.cells[i];
            exportCell.style.backgroundColor = col.style.backgroundColor;
            exportCell.innerHTML = col.innerHTML;
            exportCell.width = col.width;
            if (exportCell.width == '') {
                exportCell.width = col.style.width;
            }
            exportCell.colSpan = col.colSpan;
            exportCell.style.minWidth = col.style.width;
            exportCell.style.maxWidth = col.style.width;
            exportCell.style.fontSize = 14 + 'px';
            exportCell.style.padding = 1 + 'px';
        }

        var saveDocument = exportDocument;
        var uriData = saveDocument.documentElement.outerHTML;
        exportDocument.body.innerHTML+='<br><a id="downloadb1" style="background:#C374E9;' + 'border-radius:5%;' + 'padding:0.3em;' + 'text-decoration:none;' + 'margin:0.5em;' + 'color:white;" ' + 'download>Download Matrix</a>';
        exportDocument.getElementById("downloadb1").download = "MusicMatrix";
        exportDocument.getElementById("downloadb1").href = this._generateDataURI(uriData);
        exportDocument.close();
    };

    // Deprecated
    this.note2Solfege = function(note, index) {
        if (['♭', '♯'].indexOf(note[1]) === -1) {
            var octave = note[1];
            var newNote = SOLFEGECONVERSIONTABLE[note[0]];
        } else {
            var octave = note[2];
            var newNote = SOLFEGECONVERSIONTABLE[note.substr(0,2)];
        }
        this.rowLabels[index] = newNote;
        this.rowArgs[index] = octave;
    };

    this.addTuplet = function(param) {
        // The first two parameters are the interval for the tuplet,
        // e.g., 1/4; the rest of the parameters are the list of notes
        // to be added to the tuplet, e.g., 1/8, 1/8, 1/8.

        var tupletTimeFactor = param[0][0] / param[0][1];
        var numberOfNotes = param[1].length;
        var totalNoteInterval = 0;
        var ptmTable = docById('ptmTable');

        for (var i = 0; i < numberOfNotes; i++) {
            if (i === 0) {
                var lcd = param[1][0];
            } else {
                var lcd = LCD(lcd, param[1][i]);
            }
            totalNoteInterval += 32 / param[1][i];
        }

        var tupletValue = 0;
        for (var i = 0; i < numberOfNotes; i++) {
            if (param[1][i] > 0) {
                tupletValue += lcd / param[1][i];
            }
        }

        var rowCount = this.rowLabels.length;
        var firstRow = docById('ptm' + 0);
        var colCount = firstRow.cells.length;

        var noteValue = param[0][1] / param[0][0];
        var noteValueToDisplay = calcNoteValueToDisplay(param[0][1], param[0][0]);

        // Set the cells to "rest"
        for (var i = 0; i < numberOfNotes; i++) {
            // The tuplet time factor * percentage of the tuplet that
            // is dedicated to this note
            this._notesToPlay.push([['R'], (totalNoteInterval * param[0][1]) / (32 / param[1][i])]);
        }

        // First, ensure that the matrix is set up for tuplets.
        if (!this._matrixHasTuplets) {
            // Add more room to the outerDiv to hold the extra rows.
            var n = Math.max(Math.floor((window.innerHeight * 0.5) / 100), 8);
            var outerDiv = docById('ptmOuterDiv');
            if (this.rowLabels.length > n) {
                outerDiv.style.height = this._cellScale * MATRIXSOLFEHEIGHT * (n + 6) + 'px';
                var w = Math.max(Math.min(window.innerWidth, this._cellScale * OUTERWINDOWWIDTH), BUTTONDIVWIDTH);
                outerDiv.style.width = w + 'px';
            } else {
                outerDiv.style.height = this._cellScale * MATRIXSOLFEHEIGHT * (this.rowLabels.length + 6) + 'px';
                var w = Math.max(Math.min(window.innerWidth, this._cellScale * OUTERWINDOWWIDTH - 20), BUTTONDIVWIDTH);
                outerDiv.style.width = w + 'px';
            }

            var firstRow = docById('ptm' + 0);

            // Load the labels
            var labelCell = docById('ptmTupletNoteLabel');
            labelCell.innerHTML = _('note value');
            labelCell.style.fontSize = this._cellScale * 75 + '%';
            labelCell.style.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
            labelCell.style.width = Math.floor(2 * MATRIXSOLFEWIDTH * this._cellScale) + 'px';
            labelCell.style.minWidth = labelCell.style.width;
            labelCell.style.maxWidth = labelCell.style.width;
            labelCell.style.backgroundColor = MATRIXLABELCOLOR;

            var labelCell = docById('ptmTupletValueLabel');
            labelCell.innerHTML = _('tuplet value');
            labelCell.style.fontSize = this._cellScale * 75 + '%';
            labelCell.style.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
            labelCell.style.width = Math.floor(2 * MATRIXSOLFEWIDTH * this._cellScale) + 'px';
            labelCell.style.minWidth = labelCell.style.width;
            labelCell.style.maxWidth = labelCell.style.width;
            labelCell.style.backgroundColor = MATRIXLABELCOLOR;

            // Fill in the columns in the tuplet note value row up to
            // where the tuplet begins.
            var noteRow = docById('ptmTupletNoteValueRow');
            var valueRow = docById('ptmTupletValueRow');
            for (var i = 0; i < firstRow.cells.length; i++) {
                var cell = noteRow.insertCell();
                cell.style.backgroundColor = MATRIXTUPLETCELLCOLOR;
                cell.style.width = firstRow.cells[i].style.width;
                cell.style.minWidth = firstRow.cells[i].style.minWidth;
                cell.style.maxWidth = firstRow.cells[i].style.maxWidth;
                cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 'px';

                var cell = valueRow.insertCell();
                cell.style.backgroundColor = MATRIXTUPLETCELLCOLOR;
                cell.style.width = firstRow.cells[i].style.width;
                cell.style.minWidth = firstRow.cells[i].style.minWidth;
                cell.style.maxWidth = firstRow.cells[i].style.maxWidth;
                cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
            }
        }

        // Now add the tuplet to the matrix.
        var tupletNoteValue = noteValue * tupletValue;

        // Add the tuplet notes
        for (var i = 0; i < numberOfNotes; i++) {
            // Add the notes to the tuplet notes row too.
            // Add cell for tuplet note values
            var noteRow = docById('ptmTupletNoteValueRow');
            var cell = noteRow.insertCell(-1);
            var numerator = 32 / param[1][i];
            var thisNoteValue = 1 / (numerator / (totalNoteInterval / tupletTimeFactor));
            cell.style.backgroundColor = MATRIXTUPLETCELLCOLOR;
            cell.style.width = this._noteWidth(thisNoteValue) + 'px';
            cell.style.minWidth = cell.style.width;
            cell.style.maxWidth = cell.style.width;
            cell.style.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
            cell.setAttribute('id', 1 / tupletNoteValue);
            cell.style.lineHeight = 60 + '%';
            cell.style.fontSize = this._cellScale * 75 + '%';
            cell.style.textAlign = 'center';
            var obj = toFraction(numerator / (totalNoteInterval / tupletTimeFactor));
            if (NOTESYMBOLS != undefined && obj[1] in NOTESYMBOLS) {
                cell.innerHTML = obj[0] + '<br>&mdash;<br>' + obj[1] + '<br>' + '<img src="' + NOTESYMBOLS[obj[1]] + '" height=' + (MATRIXSOLFEHEIGHT / 2) * this._cellScale + '>';
            } else {
                cell.innerHTML = obj[0] + '<br>&mdash;<br>' + obj[1] + '<br><br>';
            }

            var cellWidth = cell.style.width;

            // Add the notes to the matrix a la addNote.
            for (var j = 0; j < this.rowLabels.length; j++) {
                var ptmRow = docById('ptm' + j);
                var cell = ptmRow.insertCell();
                cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
                // Using the alt attribute to store the note value
                cell.setAttribute('alt', 1 / tupletNoteValue);
                cell.style.width = cellWidth;
                cell.style.minWidth = cell.style.width;
                cell.style.maxWidth = cell.style.width;
                cell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                cell.onmouseover=function() {
                    if (this.style.backgroundColor !== 'black'){
                        this.style.backgroundColor = MATRIXNOTECELLCOLORHOVER;
                    }
                }
                cell.onmouseout=function() {
                    if (this.style.backgroundColor !== 'black'){
                        this.style.backgroundColor = MATRIXNOTECELLCOLOR;
                    }
                }
            }
        }

        // Add the tuplet value as a span
        var valueRow = docById('ptmTupletValueRow');
        var cell = valueRow.insertCell();
        cell.colSpan = numberOfNotes;
        cell.style.fontSize = Math.floor(this._cellScale * 75) + '%';
        cell.style.lineHeight = 60 + '%';
        cell.style.width = this._noteWidth(noteValue)  + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
        cell.style.textAlign = 'center';
        cell.innerHTML = tupletValue;
        cell.style.backgroundColor = MATRIXTUPLETCELLCOLOR;

        // And a span in the note value column too.
        var noteValueRow = docById('ptmNoteValueRow');
        var cell = noteValueRow.insertCell();
        cell.colSpan = numberOfNotes;
        cell.style.fontSize = Math.floor(this._cellScale * 75) + '%';
        cell.style.lineHeight = 60 + '%';
        cell.style.width = this._noteWidth(noteValue) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
        cell.style.textAlign = 'center';
        cell.innerHTML = noteValueToDisplay;
        cell.style.backgroundColor = MATRIXRHYTHMCELLCOLOR;
        this._matrixHasTuplets = true;
    };

    this._noteWidth = function (noteValue) {
        return Math.max(Math.floor(EIGHTHNOTEWIDTH * (8 / noteValue) * this._cellScale), 15);
    };

    this.addNotes = function(numBeats, noteValue) {
        var ptmTable = docById('ptmTable');
        var noteValueToDisplay = calcNoteValueToDisplay(noteValue, 1);

        for (var i = 0; i < numBeats; i++) {
            this._notesToPlay.push([['R'], noteValue]);
        }

        var rowCount = this.rowLabels.length - this._rests;

        for (var j = 0; j < numBeats; j++) {
            for (var i = 0; i < rowCount; i++) {
                // the buttons get add to the embedded table
                var row = docById('ptm' + i);
                var cell = row.insertCell();
                cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
                cell.style.width = this._noteWidth(noteValue) + 'px';
                cell.style.minWidth = cell.style.width;
                cell.style.maxWidth = cell.style.width;
                cell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                // Using the alt attribute to store the note value
                cell.setAttribute('alt', 1 / noteValue);
                cell.onmouseover=function() {
                    if (this.style.backgroundColor !== 'black'){
                        this.style.backgroundColor = MATRIXNOTECELLCOLORHOVER;
                    }
                }
                cell.onmouseout=function() {
                    if (this.style.backgroundColor !== 'black'){
                        this.style.backgroundColor = MATRIXNOTECELLCOLOR;
                    }
                }
            }

            // Add a note value.
            var row = docById('ptmNoteValueRow');
            var cell = row.insertCell();
            cell.style.width = this._noteWidth(noteValue) + 'px';
            cell.style.minWidth = cell.style.width;
            cell.style.maxWidth = cell.style.width;
            cell.style.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
            cell.style.fontSize = Math.floor(this._cellScale * 75) + '%';
            cell.style.lineHeight = 60 + '%';
            cell.style.textAlign = 'center';
            cell.innerHTML = noteValueToDisplay;
            cell.style.backgroundColor = MATRIXRHYTHMCELLCOLOR;

            if (this._matrixHasTuplets) {
                // We may need to insert some blank cells in the extra rows
                // added by tuplets.
                var row = docById('ptmTupletNoteValueRow');
                var cell = row.insertCell();
                cell.style.width = this._noteWidth(noteValue) + 'px';
                cell.style.minWidth = cell.style.width;
                cell.style.maxWidth = cell.style.width;
                cell.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
                cell.style.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
                cell.style.backgroundColor = MATRIXTUPLETCELLCOLOR;

                var row = docById('ptmTupletValueRow');
                var cell = row.insertCell();
                cell.style.width = this._noteWidth(noteValue) + 'px';
                cell.style.minWidth = cell.style.width;
                cell.style.maxWidth = cell.style.width;
                cell.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
                cell.style.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
                cell.style.backgroundColor = MATRIXTUPLETCELLCOLOR;
            }
        }
    };

    this.makeClickable = function() {
        // Once the entire matrix is generated, this function makes it
        // clickable.
        var rowCount = this.rowLabels.length;

        for (var i = 0; i < rowCount; i++) {
            var row = docById('ptm' + i);
            for (var j = 0; j < row.cells.length; j++) {
                var cell = row.cells[j];
                if (cell.style.backgroundColor === 'black') {
                    cell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                    this._setNotes(j, i, false);
                }
            }
        }            

        for (var i = 0; i < rowCount; i++) {
            // The buttons get added to the embedded table.
            var row = docById('ptm' + i);
            for (var j = 0; j < row.cells.length; j++) {
                var cell = row.cells[j];
                // Give each clickable cell a unique id
                cell.setAttribute('id', i + ':' + j);

                var that = this;
                cell.onclick = function() {
                    var obj = this.id.split(':');
                    var i = Number(obj[0]);
                    var j = Number(obj[1]);
                    if (this.style.backgroundColor === 'black') {
                        this.style.backgroundColor = MATRIXNOTECELLCOLOR;
                        that._notesToPlay[j][0] = ['R'];
                        that._setNotes(j, i, false);
                    } else {
                        this.style.backgroundColor = 'black';
                        that._setNotes(j, i, true);
                    }
                }
            }
        }            

        // Mark any cells found in the blockMap from previous
        // instances of the matrix.
        for (var i = 0; i < this._blockMap.length; i++) {
            var obj = this._blockMap[i];
            if (obj[0] !== -1) {
                // Look for this note in the pitch and rhythm blocks.
                var r = this._rowMap[this._rowBlocks.indexOf(obj[0])] + this._rowOffset[this._rowMap[this._rowBlocks.indexOf(obj[0])]];
                var c = -1;
                for (var j = 0; j < this._colBlocks.length; j++) {
                    if (this._colBlocks[j][0] === obj[1][0] && this._colBlocks[j][1] === obj[1][1]) {
                        c = j;
                        break;
                    }
                }

                if (c == -1) {
                    continue;
                }

                // If we found a match, mark this cell and add this
                // note to the play list.
                var row = docById('ptm' + r);
                var cell = row.cells[c];
                if (cell != undefined) {
                    cell.style.backgroundColor = 'black';
                    if (this._notesToPlay[c][0][0] === 'R') {
                        this._notesToPlay[c][0] = [];
                    }
                    this._setNoteCell(r, c, cell, false, null);
                }
            }
        }
    };

    this.playAll = function() {
        // Play all of the notes in the matrix.
        this._logo.synth.stop();

        var notes = [];

        for (var i in this._notesToPlay) {
            notes.push(this._notesToPlay[i]);
        }

        this._notesToPlay = notes;

        this._notesCounter = 0;

        // We have an array of pitches and note values.
        var note = this._notesToPlay[this._notesCounter][0];
        var pitchNotes = [];
        var synthNotes = [];
        var drumNotes = [];

        // Note can be a chord, hence it is an array.
        for (var i = 0; i < note.length; i++) {
            if (typeof(note[i]) === 'number') {
                var drumName = null;
            } else {
                var drumName = getDrumName(note[i]);
            }

            if (typeof(note[i]) === 'number') {
                synthNotes.push(note[i]);
            } else if (drumName != null) {
                drumNotes.push(drumName);
            } else if (note[i].slice(0, 4) === 'http') {
                drumNotes.push(note[i]);
            } else {
                var obj = note[i].split(':');
                if (obj.length > 1) {
                    // Deprecated
                    if (MATRIXSYNTHS.indexOf(obj[0]) !== -1) {
                        synthNotes.push(note[i]);
                    } else {
                        continue;
                    }
                } else {
                    pitchNotes.push(note[i].replace(/♭/g, 'b').replace(/♯/g, '#'));
                }
            }
        }

        var noteValue = this._notesToPlay[this._notesCounter][1];

        this._notesCounter += 1;

        this._colIndex = 0;

        // We highlight the note-value cells (bottom row).
        var row = docById('ptmNoteValueRow');

        // Highlight first note.
        var cell = row.cells[this._colIndex];
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        // If we are in a tuplet, we don't update the column until
        // we've played all of the notes in the column span.
        if (cell.colSpan > 1) {
            this._spanCounter = 1;
            var row = docById('ptmTupletNoteValueRow');
            var tupletCell = row.cells[this._colIndex];
            tupletCell.style.backgroundColor = MATRIXBUTTONCOLOR;
        } else {
            this._spanCounter = 0;
            this._colIndex += 1;
        }

        if (note[0] !== 'R' && pitchNotes.length > 0) {
            this._logo.synth.trigger(pitchNotes, this._logo.defaultBPMFactor / noteValue, 'poly');
        }

        for (var i = 0; i < synthNotes.length; i++) {
            this._logo.synth.trigger([Number(synthNotes[i])], this._logo.defaultBPMFactor / noteValue, 'poly');
        }

        for (var i = 0; i < drumNotes.length; i++) {
            this._logo.synth.trigger('C2', this._logo.defaultBPMFactor / noteValue, drumNotes[i]);
        }

        this.__playNote(0, 0);
    };

    this.__playNote = function(time, noteCounter) {
        // If the widget it closed, stop playing.
        if (docById('ptmDiv').style.visibility === 'hidden') {
            return;
        }

        noteValue = this._notesToPlay[noteCounter][1];
        time = 1 / noteValue;
        var that = this;

        setTimeout(function() {
            // Did we just play the last note?
            if (noteCounter === that._notesToPlay.length - 1) {
                var row = docById('ptmNoteValueRow');
                for (var i = 0; i < row.cells.length; i++) {
                    var cell = row.cells[i];
                    cell.style.backgroundColor = MATRIXRHYTHMCELLCOLOR;
                }
                if (that._matrixHasTuplets) {
                    var row = docById('ptmTupletNoteValueRow');
                    for (var i = 0; i < row.cells.length; i++) {
                        var cell = row.cells[i];
                        cell.style.backgroundColor = MATRIXTUPLETCELLCOLOR;
                    }
                }
            } else {
                var row = docById('ptmNoteValueRow');
                var cell = row.cells[that._colIndex];

                if (cell != undefined) {
                    cell.style.backgroundColor = MATRIXBUTTONCOLOR;
                    if (cell.colSpan > 1) {
                        var row = docById('ptmTupletNoteValueRow');
                        var tupletCell = row.cells[that._notesCounter];
                        tupletCell.style.backgroundColor = MATRIXBUTTONCOLOR;
                    }
                }

                if (that._notesCounter >= that._notesToPlay.length) {
                    that._notesCounter = 1;
                    that._logo.synth.stop()
                }

                note = that._notesToPlay[that._notesCounter][0];
                noteValue = that._notesToPlay[that._notesCounter][1];
                that._notesCounter += 1;

                var pitchNotes = [];
                var synthNotes = [];
                var drumNotes = [];

                // Note can be a chord, hence it is an array.
                for (var i = 0; i < note.length; i++) {
                    if (typeof(note[i]) === 'number') {
                        var drumName = null;
                    } else {
                        var drumName = getDrumName(note[i]);
                    }

                    if (typeof(note[i]) === 'number') {
                        synthNotes.push(note[i]);
                    } else if (drumName != null) {
                        drumNotes.push(drumName);
                    } else if (note[i].slice(0, 4) === 'http') {
                        drumNotes.push(note[i]);
                    } else {
                        var obj = note[i].split(':');
                        // Deprecated
                        if (MATRIXSYNTHS.indexOf(obj[0]) !== -1) {
                            synthNotes.push(note[i]);
                            continue;
                        } else if (MATRIXGRAPHICS.indexOf(obj[0]) !== -1) {
                            continue;
                        } else if (MATRIXGRAPHICS2.indexOf(obj[0]) !== -1) {
                            continue;
                        } else {
                            pitchNotes.push(note[i].replace(/♭/g, 'b').replace(/♯/g, '#'));
                        }
                    }
                }

                if (note[0] !== 'R' && pitchNotes.length > 0) {
                    that._logo.synth.trigger(pitchNotes, that._logo.defaultBPMFactor / noteValue, 'poly');
                }

                for (var i = 0; i < synthNotes.length; i++) {
                    that._logo.synth.trigger([Number(synthNotes[i])], that._logo.defaultBPMFactor / noteValue, 'poly');
                }

                for (var i = 0; i < drumNotes.length; i++) {
                    that._logo.synth.trigger(['C2'], that._logo.defaultBPMFactor / noteValue, drumNotes[i]);
                }

            }

            var row = docById('ptmNoteValueRow');
            var cell = row.cells[that._colIndex];
            if (cell != undefined) {
                if (cell.colSpan > 1) {
                    that._spanCounter += 1;
                    if (that._spanCounter === cell.colSpan) {
                        that._spanCounter = 0;
                        that._colIndex += 1;
                    }
                } else {
                    that._spanCounter = 0;
                    that._colIndex += 1;
                }

                noteCounter += 1;
                if (noteCounter < that._notesToPlay.length) {
                    that.__playNote(time, noteCounter);
                }
            }
        }, that._logo.defaultBPMFactor * 1000 * time + that._logo.turtleDelay);
    };

    this._setNotes = function(colIndex, rowIndex, playNote) {
        // Sets corresponding note when user clicks on any cell and
        // plays that note
        var rowBlock = this._rowBlocks[this._rowMap.indexOf(rowIndex - this._rowOffset[rowIndex])];
        var rhythmBlockObj = this._colBlocks[colIndex ];

        if (playNote) {
            this.addNode(rowBlock, rhythmBlockObj[0], rhythmBlockObj[1]);
        } else {
            this.removeNode(rowBlock, rhythmBlockObj[0], rhythmBlockObj[1]);
        }

        this._notesToPlay[colIndex][0] = [];
        for (var j = 0; j < this.rowLabels.length; j++) {
            var row = docById('ptm' + j);
            var cell = row.cells[colIndex];
            if (cell.style.backgroundColor === 'black') {
                this._setNoteCell(j, colIndex, cell, playNote);
            }
        }
    };

    this._setNoteCell = function(j, colIndex, cell, playNote) {
        var note = this._noteStored[j];
        if (this.rowLabels[j] === 'hertz') {
            var drumName = null;
            var graphicsBlock = false;
            var obj = [note];
        } else {
            var drumName = getDrumName(note);
            var graphicsBlock = false;
            graphicNote = note.split(':');
            if (MATRIXGRAPHICS.indexOf(graphicNote[0]) != -1 && MATRIXGRAPHICS2.indexOf(graphicNote[0]) != -1) {
                var graphicsBlock = true;
            }
            var obj = note.split(':');
        }
            
        var row = docById('ptm' + j);
        var cell = row.cells[colIndex];
        // Using the alt attribute to store the note value
        var noteValue = cell.getAttribute('alt');

        this._notesToPlay[parseInt(colIndex)][0].push(note);

        if (obj.length === 1) {
            if (playNote) {
                if (drumName != null) {
                    this._logo.synth.trigger('C2', noteValue, drumName);
                } else if (this.rowLabels[j - 1] === 'hertz') {
                    this._logo.synth.trigger(Number(note), noteValue, 'poly');
                } else if (graphicsBlock !== true) {
                    this._logo.synth.trigger(note.replace(/♭/g, 'b').replace(/♯/g, '#'), noteValue, 'poly');
                } else {
                    console.log('Cannot parse note object: ' + obj);
                }
            }
        } else if (MATRIXSYNTHS.indexOf(obj[0]) !== -1) {
            this._logo.synth.trigger([Number(obj[1])], noteValue, obj[0]);
        }
    };

    this._clear = function() {
        // "Unclick" every entry in the matrix.
        for (var i = 0; i < this.rowLabels.length; i++) {
            var row = docById('ptm' + i);
            for (var j = 0; j < row.cells.length; j++) {
                var cell = row.cells[j];
                if (cell.style.backgroundColor === 'black') {
                    cell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                    this._notesToPlay[j][0] = ['R'];
                    this._setNotes(j, i, false);
                }
            }
        }
    };

    this._save = function() {
        /* Saves the current matrix as an action stack consisting of
         * note and pitch blocks (saving as chunks is deprecated). */

        // First, hide the palettes as they will need updating.
        for (var name in this._logo.blocks.palettes.dict) {
            this._logo.blocks.palettes.dict[name].hideMenu(true);
        }
        this._logo.refreshCanvas();


        var newStack = [[0, ['action', {'collapsed': false}], 100, 100, [null, 1, null, null]], [1, ['text', {'value': 'chunk'}], 0, 0, [0]]];
        var endOfStackIdx = 0;

        for (var i = 0; i < this._notesToPlay.length; i++)
        {
            // We want all of the notes in a column.
            var note = this._notesToPlay[i].slice(0);
            if (note[0] === '') {
                note[0] = 'R';
            }

            // Add the Note block and its value
            var idx = newStack.length;
            newStack.push([idx, 'newnote', 0, 0, [endOfStackIdx, idx + 1, idx + 2, null]]);
            var n = newStack[idx][4].length;
            if (i === 0) {  // the action block
                newStack[endOfStackIdx][4][n - 2] = idx;
            } else { // the previous note block
                newStack[endOfStackIdx][4][n - 1] = idx;
            }
            var endOfStackIdx = idx;

            // Add a vspace to prevent divide block from obscuring the pitch block.
            newStack.push([idx + 1, 'vspace', 0, 0, [idx, idx + 5]]);

            // note value is saved as a fraction
            newStack.push([idx + 2, 'divide', 0, 0, [idx, idx + 3, idx + 4]]);

            if (parseInt(note[1]) < note[1]) {
                // dotted note
                var obj = toFraction(note[1]);
                newStack.push([idx + 3, ['number', {'value': obj[1]}], 0, 0, [idx + 2]]);
                newStack.push([idx + 4, ['number', {'value': obj[0]}], 0, 0, [idx + 2]]);
           } else {
                newStack.push([idx + 3, ['number', {'value': 1}], 0, 0, [idx + 2]]);
                newStack.push([idx + 4, ['number', {'value': note[1]}], 0, 0, [idx + 2]]);
            }

            // Connect the Note block flow to the divide and vspace blocks.
            newStack[idx][4][1] = idx + 2;
            newStack[idx][4][2] = idx + 1;

            var delta = 5;

            if (note[0][0] === 'R' || note[0][0] == undefined) {
                // The last connection in last pitch block is null.
                var lastConnection = null;
                if (delta === 5) {
                    var previousBlock = idx + 1;  // Vspace block
                } else {
                    var previousBlock = idx;  // Note block
                }
                delta -= 2;
                var thisBlock = idx + delta;
                newStack.push([thisBlock + 1, 'rest2', 0, 0, [previousBlock, lastConnection]]);
                previousBlock += delta;
            } else {
                // Add the pitch and/or playdrum blocks to the Note block
                var thisBlock = idx + delta;
                for (var j = 0; j < note[0].length; j++) {

                    // We need to point to the previous note or pitch block.
                    if (j === 0) {
                        if (delta === 5) {
                            var previousBlock = idx + 1;  // Vspace block
                        } else {
                            var previousBlock = idx;  // Note block
                        }
                    }

                    if (typeof(note[0][j]) === 'number') {
                        var obj = null;
                        var drumName = null;
                    } else {
                       var obj = note[0][j].split(':');
                       var drumName = getDrumName(note[0][j]);
                    }

                    if (obj == null) {
                        // add a hertz block
                        // The last connection in last pitch block is null.
                        if (note[0].length === 1 || j === note[0].length - 1) {
                            var lastConnection = null;
                        } else {
                            var lastConnection = thisBlock + 2;
                        }

                        newStack.push([thisBlock, 'hertz', 0, 0, [previousBlock, thisBlock + 1, lastConnection]]);
                        newStack.push([thisBlock + 1, ['number', {'value': note[0][j]}], 0, 0, [thisBlock]]);
                        thisBlock += 2;
                        previousBlock = thisBlock - 2;
                    } else if (drumName != null) {
                        // add a playdrum block
                        // The last connection in last pitch block is null.
                        if (note[0].length === 1 || j === note[0].length - 1) {
                            var lastConnection = null;
                        } else {
                            var lastConnection = thisBlock + 2;
                        }

                        newStack.push([thisBlock, 'playdrum', 0, 0, [previousBlock, thisBlock + 1, lastConnection]]);
                        newStack.push([thisBlock + 1, ['drumname', {'value': drumName}], 0, 0, [thisBlock]]);
                        thisBlock += 2;
                        previousBlock = thisBlock - 2;
                    } else if (note[0][j].slice(0, 4) === 'http') {
                        // add a playdrum block with URL
                        // The last connection in last pitch block is null.
                        if (note[0].length === 1 || j === note[0].length - 1) {
                            var lastConnection = null;
                        } else {
                            var lastConnection = thisBlock + 2;
                        }

                        newStack.push([thisBlock, 'playdrum', 0, 0, [previousBlock, thisBlock + 1, lastConnection]]);
                        newStack.push([thisBlock + 1, ['text', {'value': note[0][j]}], 0, 0, [thisBlock]]);
                        thisBlock += 2;
                        previousBlock = thisBlock - 2;
                    } else if (obj.length > 2) {
                        // add a 2-arg graphics block
                        // The last connection in last pitch block is null.
                        if (note[0].length === 1 || j === note[0].length - 1) {
                            var lastConnection = null;
                        } else {
                            var lastConnection = thisBlock + 3;
                        }

                        newStack.push([thisBlock, obj[0], 0, 0, [previousBlock, thisBlock + 1, thisBlock + 2, lastConnection]]);
                        newStack.push([thisBlock + 1, ['number', {'value': Number(obj[1])}], 0, 0, [thisBlock]]);
                        newStack.push([thisBlock + 2, ['number', {'value': Number(obj[2])}], 0, 0, [thisBlock]]);
                        thisBlock += 3;
                        previousBlock = thisBlock - 3;
                    } else if (obj.length > 1) {
                        // add a 1-arg graphics block
                        // The last connection in last pitch block is null.
                        if (note[0].length === 1 || j === note[0].length - 1) {
                            var lastConnection = null;
                        } else {
                            var lastConnection = thisBlock + 2;
                        }

                        newStack.push([thisBlock, obj[0], 0, 0, [previousBlock, thisBlock + 1, lastConnection]]);
                        newStack.push([thisBlock + 1, ['number', {'value': Number(obj[1])}], 0, 0, [thisBlock]]);
                        thisBlock += 2;
                        previousBlock = thisBlock - 2;
                    } else {
                        // add a pitch block

                        // The last connection in last pitch block is null.
                        if (note[0].length === 1 || j === note[0].length - 1) {
                            var lastConnection = null;
                        } else {
                            var lastConnection = thisBlock + 3;
                        }

                        newStack.push([thisBlock, 'pitch', 0, 0, [previousBlock, thisBlock + 1, thisBlock + 2, lastConnection]]);
                        if(['♯', '♭'].indexOf(note[0][j][1]) !== -1) {
                            newStack.push([thisBlock + 1, ['solfege', {'value': SOLFEGECONVERSIONTABLE[note[0][j][0]] + note[0][j][1]}], 0, 0, [thisBlock]]);
                            newStack.push([thisBlock + 2, ['number', {'value': note[0][j][2]}], 0, 0, [thisBlock]]);
                        } else {
                            newStack.push([thisBlock + 1, ['solfege', {'value': SOLFEGECONVERSIONTABLE[note[0][j][0]]}], 0, 0, [thisBlock]]);
                            newStack.push([thisBlock + 2, ['number', {'value': note[0][j][1]}], 0, 0, [thisBlock]]);
                        }

                        thisBlock += 3;
                        previousBlock = thisBlock - 3;
                    }
                }
            }
        }

        
        
        // Create a new stack for the chunk.
        console.log(newStack);
        this._logo.blocks.loadNewBlocks(newStack);
    };
};
