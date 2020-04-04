// Copyright (c) 2015 Yash Khandelwal
// Copyright (c) 2015-19 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

const MATRIXGRAPHICS = [
    "forward",
    "back",
    "right",
    "left",
    "setheading",
    "setcolor",
    "setshade",
    "sethue",
    "setgrey",
    "settranslucency",
    "setpensize"
];
const MATRIXGRAPHICS2 = ["arc", "setxy"];
const MATRIXSYNTHS = ["sine", "triangle", "sawtooth", "square", "hertz"]; // Deprecated

function PitchTimeMatrix() {
    // The phrasemaker widget
    const BUTTONDIVWIDTH = 535; // 8 buttons 535 = (55 + 4) * 9
    const OUTERWINDOWWIDTH = 758;
    const INNERWINDOWWIDTH = 630;
    const BUTTONSIZE = 53;
    const ICONSIZE = 24;

    this._stopOrCloseClicked = false;
    this._instrumentName = DEFAULTVOICE;

    this.paramsEffects = {
        doVibrato: false,
        doDistortion: false,
        doTremolo: false,
        doPhaser: false,
        doChorus: false,
        vibratoIntensity: 0,
        vibratoFrequency: 0,
        distortionAmount: 0,
        tremoloFrequency: 0,
        tremoloDepth: 0,
        rate: 0,
        octaves: 0,
        baseFrequency: 0,
        chorusRate: 0,
        delayTime: 0,
        chorusDepth: 0
    };

    // rowLabels can contain either a pitch, a drum, or a graphics commands
    this.rowLabels = [];
    // rowArgs can contain an octave or the arg(s) to a graphics command
    this.rowArgs = [];

    // We need to treat note blocks differently since they have both
    // pitch and rhythm.
    this._noteBlocks = false;

    this.sorted = false;
    this._notesToPlay = [];
    this._outputAsTuplet = []; // do we output 1/12 or 1/(3x4)?
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
    this._rowBlocks = []; // pitch-block number
    this._colBlocks = []; // [rhythm-block number, note number]

    // This array keeps track of the position of the rows after sorting.
    this._rowMap = [];
    // And offsets due to deleting duplicates.
    this._rowOffset = [];

    // Track a number of DOM elements locally
    this._rows = [];
    this._headcols = [];
    this._labelcols = [];
    this._tupletNoteLabel = null;
    this._tupletValueLabel = null;
    this._tupletNoteValueLabel = null;

    this._tupletNoteValueRow = null;
    this._tupletValueRow = null;
    this._noteValueRow = null;

    // This array is preserved between sessions.
    // We populate the blockMap whenever a note is selected and
    // restore any notes that might be present.
    this._blockMap = [];

    this.blockNo = null;
    this.notesBlockMap = [];
    this._blockMapHelper = [];
    this.columnBlocksMap = [];

    this.clearBlocks = function() {
        // When creating a new matrix, we want to clear out any old
        // block references.
        this._rowBlocks = [];
        this._colBlocks = [];
        this._rowMap = [];
        this._rowOffset = [];
    };

    this.addRowBlock = function(rowBlock) {
        // When creating a matrix, we add rows whenever we encounter a
        // pitch or drum block (and some graphics blocks).
        this._rowMap.push(this._rowBlocks.length);
        this._rowOffset.push(0);
        // In case there is a repeat block, use a unique block number
        // for each instance.
        while (this._rowBlocks.indexOf(rowBlock) !== -1) {
            rowBlock = rowBlock + 1000000;
        }

        this._rowBlocks.push(rowBlock);
    };

    this.addColBlock = function(rhythmBlock, n) {
        // When creating a matrix, we add columns when we encounter
        // rhythm blocks.
        // Search for previous instance of the same block (from a
        // repeat).
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

    this.addNode = function(rowBlock, rhythmBlock, n) {
        // A node exists for each cell in the matrix. It is used to
        // preserve and restore the state of the cell.
        var j = 0;
        for (var i = 0; i < this._blockMap.length; i++) {
            var obj = this._blockMap[i];
            if (
                obj[0] === rowBlock &&
                obj[1][0] === rhythmBlock &&
                obj[1][1] === n
            ) {
                console.debug("node is already in the list");
                j += 1;
            }
        }

        this._blockMap.push([rowBlock, [rhythmBlock, n], j]);
    };

    this.removeNode = function(rowBlock, rhythmBlock, n) {
        // When the matrix is changed, we may need to remove nodes.
        for (var i = 0; i < this._blockMap.length; i++) {
            var obj = this._blockMap[i];
            if (
                obj[0] === rowBlock &&
                obj[1][0] === rhythmBlock &&
                obj[1][1] === n
            ) {
                this._blockMap.splice(i, 1);
            }
        }
    };

    this._get_save_lock = function() {
        // Debounce the save button.
        return this._save_lock;
    };

    this.init = function(logo) {
        // Initializes the matrix. First removes the previous matrix
        // and then make another one in DOM (document object model)
        let tempTable;

        this._noteStored = [];
        this._noteBlocks = false;
        this._rests = 0;
        this._logo = logo;

        this.playingNow = false;

        var w = window.innerWidth;
        this._cellScale = Math.max(1, w / 1200);
        var iconSize = ICONSIZE * this._cellScale;

        var widgetWindow = window.widgetWindows.windowFor(this, "phrase maker");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();

        console.debug("notes " + this.rowLabels + " octave " + this.rowArgs);

        this._notesToPlay = [];
        this._matrixHasTuplets = false;

        // Add the buttons to the top row.
        var that = this;

        widgetWindow.onclose = function() {
            that._rowOffset = [];
            for (var i = 0; i < that._rowMap.length; i++) {
                that._rowMap[i] = i;
            }

            that._logo.synth.stopSound(0, that._instrumentName);
            that._logo.synth.stop();
            that._stopOrCloseClicked = true;
            that._logo.hideMsgs();
            docById("wheelDivptm").style.display = "none";

            widgetWindow.destroy();
        };

        widgetWindow.addButton(
            "play-button.svg",
            ICONSIZE,
            _("Play")
        ).onclick = function() {
            that._logo.setTurtleDelay(0);

            that._logo.resetSynth(0);
            that.playAll();
        };

        this._save_lock = false;
        widgetWindow.addButton(
            "export-chunk.svg",
            ICONSIZE,
            _("Save")
        ).onclick = async function() {
            // Debounce the save button
            if (!that._get_save_lock()) {
                that._save_lock = true;
                that._save();
                await delayExecution(1000);
                that._save_lock = false;
                if (window.innerWidth <= 600)
                    // Mobile
                    that.widgetWindow.close();
            }
        };

        widgetWindow.addButton(
            "erase-button.svg",
            ICONSIZE,
            _("Clear")
        ).onclick = function() {
            that._clear();
        };

        if (!localStorage.beginnerMode) {
            widgetWindow.addButton(
                "export-button.svg",
                ICONSIZE,
                _("Export")
            ).onclick = function() {
                that._export();
            };
        }

        widgetWindow.addButton(
            "sort.svg",
            ICONSIZE,
            _("Sort")
        ).onclick = function() {
            that._sort();
        };

        var cell = widgetWindow.addButton("add2.svg", ICONSIZE, _("Add note"));
        cell.setAttribute("id", "addnotes");
        cell.onclick = function() {
            that._createAddRowPieSubmenu();
        };

        let ptmTable = document.createElement("table");
        ptmTable.setAttribute("cellpadding", "0px");
        widgetWindow.getWidgetBody().append(ptmTable);

        // Each row in the ptm table contains a note label in the
        // first column and a table of buttons in the second column.
        if (!this.sorted) {
            this.columnBlocksMap = this._mapNotesBlocks("all", true);
            for (i = 0; i < this.columnBlocksMap.length; i++) {
                if (
                    MATRIXGRAPHICS.indexOf(this.columnBlocksMap[i][1]) !== -1 ||
                    MATRIXGRAPHICS2.indexOf(this.columnBlocksMap[i][1]) !==
                        -1 ||
                    MATRIXSYNTHS.indexOf(this.columnBlocksMap[i][1]) !== -1 ||
                    ["playdrum", "pitch"].indexOf(
                        this.columnBlocksMap[i][1]
                    ) !== -1
                ) {
                    continue;
                }
                this.columnBlocksMap = this.columnBlocksMap
                    .slice(0, i)
                    .concat(this.columnBlocksMap.slice(i + 1));
                i--;
            }
        }

        var j = 0;
        for (var i = 0; i < this.rowLabels.length; i++) {
            if (this.rowLabels[i].toLowerCase() === "rest") {
                this._rests += 1;
                continue;
            }

            var ptmTableRow = ptmTable.insertRow();

            var drumName = getDrumName(this.rowLabels[i]);

            // Depending on the row, we choose a different background color.
            if (
                MATRIXGRAPHICS.indexOf(this.rowLabels[i]) != -1 ||
                MATRIXGRAPHICS2.indexOf(this.rowLabels[i]) != -1
            ) {
                cellColor = platformColor.graphicsLabelBackground;
            } else {
                if (drumName === null) {
                    cellColor = platformColor.pitchLabelBackground;
                } else {
                    cellColor = platformColor.drumLabelBackground;
                }
            }

            // A cell for the row label graphic
            var cell = ptmTableRow.insertCell();
            cell.style.backgroundColor = cellColor;
            cell.style.fontSize = this._cellScale * 100 + "%";
            cell.style.height =
                Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 1 + "px";
            cell.style.width =
                Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + "px";
            cell.style.minWidth =
                Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + "px";
            cell.style.maxWidth = cell.style.minWidth;
            cell.className = "headcol"; // This cell is fixed horizontally.
            cell.innerHTML = "";
            this._headcols[i] = cell;

            if (drumName != null) {
                cell.innerHTML =
                    '&nbsp;&nbsp;<img src="' +
                    getDrumIcon(drumName) +
                    '" title="' +
                    _(drumName) +
                    '" alt="' +
                    _(drumName) +
                    '" height="' +
                    iconSize +
                    '" width="' +
                    iconSize +
                    '" vertical-align="middle">&nbsp;&nbsp;';
            } else if (this.rowLabels[i].slice(0, 4) === "http") {
                cell.innerHTML =
                    '&nbsp;&nbsp;<img src="' +
                    getDrumIcon(this.rowLabels[i]) +
                    '" title="' +
                    this.rowLabels[i] +
                    '" alt="' +
                    this.rowLabels[i] +
                    '" height="' +
                    iconSize / 2 +
                    '" width="' +
                    iconSize / 2 +
                    '" vertical-align="middle"/>&nbsp;&nbsp;';
            } else if (MATRIXSYNTHS.indexOf(this.rowLabels[i]) !== -1) {
                cell.innerHTML =
                    '&nbsp;&nbsp;<img src="' +
                    "images/synth2.svg" +
                    '" height="' +
                    iconSize +
                    '" width="' +
                    iconSize +
                    '" vertical-align="middle">&nbsp;&nbsp;';
            } else if (MATRIXGRAPHICS.indexOf(this.rowLabels[i]) !== -1) {
                cell.innerHTML =
                    '&nbsp;&nbsp;<img src="' +
                    "images/mouse.svg" +
                    '" height="' +
                    iconSize +
                    '" width="' +
                    iconSize +
                    '" vertical-align="middle">&nbsp;&nbsp;';
            } else if (MATRIXGRAPHICS2.indexOf(this.rowLabels[i]) !== -1) {
                cell.innerHTML =
                    '&nbsp;&nbsp;<img src="' +
                    "images/mouse.svg" +
                    '" height="' +
                    iconSize +
                    '" width="' +
                    iconSize +
                    '" vertical-align="middle">&nbsp;&nbsp;';
            } else {
                const BELLSETIDX = {
                    C: 1,
                    D: 2,
                    E: 3,
                    F: 4,
                    G: 5,
                    A: 6,
                    B: 7,
                    do: 1,
                    re: 2,
                    mi: 3,
                    fa: 4,
                    sol: 5,
                    la: 6,
                    ti: 7
                };
                // Don't add bellset image with sharps and flats.
                var noteName = this.rowLabels[i];
                if (noteName in BELLSETIDX && this.rowArgs[i] === 4) {
                    cell.innerHTML =
                        '<img src="' +
                        "images/8_bellset_key_" +
                        BELLSETIDX[noteName] +
                        ".svg" +
                        '" width="' +
                        cell.style.width +
                        '" vertical-align="middle">';
                } else if (
                    ["C", "do"].indexOf(noteName) !== -1 &&
                    this.rowArgs[i] === 5
                ) {
                    cell.innerHTML =
                        '<img src="' +
                        "images/8_bellset_key_8.svg" +
                        '" width="' +
                        cell.style.width +
                        '" vertical-align="middle">';
                }
            }

            // A cell for the row label
            var cell = ptmTableRow.insertCell();
            cell.style.backgroundColor = cellColor;
            cell.style.fontSize = this._cellScale * 100 + "%";
            cell.style.height =
                Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 1 + "px";
            cell.style.width =
                Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + "px";
            cell.style.minWidth =
                Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + "px";
            cell.style.maxWidth = cell.style.minWidth;
            cell.className = "labelcol"; // This cell is fixed horizontally.
            cell.style.left = BUTTONSIZE * this._cellScale + "px";
            cell.setAttribute("alt", i);
            this._labelcols[i] = cell;

            if (drumName != null) {
                cell.innerHTML = _(drumName);
                cell.style.fontSize = Math.floor(this._cellScale * 14) + "px";
                cell.setAttribute("alt", i + "__" + "drumblocks");

                cell.onclick = function(event) {
                    cell = event.target;
                    if (cell.getAttribute("alt") === null) {
                        cell = cell.parentNode;
                    }
                    var index = cell.getAttribute("alt").split("__")[0];
                    var condition = cell.getAttribute("alt").split("__")[1];
                    that._createColumnPieSubmenu(index, condition);
                };

                this._noteStored.push(drumName);
            } else if (this.rowLabels[i].slice(0, 4) === "http") {
                cell.innerHTML = this.rowLabels[i];
                cell.style.fontSize = Math.floor(this._cellScale * 14) + "px";
                this._noteStored.push(this.rowLabels[i].replace(/ /g, ": "));
            } else if (MATRIXSYNTHS.indexOf(this.rowLabels[i]) !== -1) {
                cell.innerHTML = this.rowArgs[i];
                cell.style.fontSize = Math.floor(this._cellScale * 14) + "px";
                cell.setAttribute("alt", i + "__" + "synthsblocks");

                cell.onclick = function(event) {
                    cell = event.target;
                    if (cell.getAttribute("alt") === null) {
                        cell = cell.parentNode;
                    }
                    var index = cell.getAttribute("alt").split("__")[0];
                    var condition = cell.getAttribute("alt").split("__")[1];
                    that._createMatrixGraphicsPieSubmenu(
                        index,
                        condition,
                        null
                    );
                };

                this._noteStored.push(this.rowArgs[i]);
            } else if (MATRIXGRAPHICS.indexOf(this.rowLabels[i]) !== -1) {
                var blockLabel = this._logo.blocks.protoBlockDict[
                    this.rowLabels[i]
                ]["staticLabels"][0];
                cell.innerHTML = blockLabel + "<br>" + this.rowArgs[i];
                cell.style.fontSize = Math.floor(this._cellScale * 12) + "px";
                cell.setAttribute("alt", i + "__" + "graphicsblocks");

                cell.onclick = function(event) {
                    cell = event.target;
                    if (cell.getAttribute("alt") === null) {
                        cell = cell.parentNode;
                    }
                    var index = cell.getAttribute("alt").split("__")[0];
                    var condition = cell.getAttribute("alt").split("__")[1];
                    that._createMatrixGraphicsPieSubmenu(
                        index,
                        condition,
                        null
                    );
                };

                this._noteStored.push(
                    this.rowLabels[i] + ": " + this.rowArgs[i]
                );
            } else if (MATRIXGRAPHICS2.indexOf(this.rowLabels[i]) !== -1) {
                var blockLabel = this._logo.blocks.protoBlockDict[
                    this.rowLabels[i]
                ]["staticLabels"][0];
                cell.innerHTML =
                    blockLabel +
                    "<br>" +
                    this.rowArgs[i][0] +
                    " " +
                    this.rowArgs[i][1];
                cell.style.fontSize = Math.floor(this._cellScale * 12) + "px";
                cell.setAttribute("alt", i + "__" + "graphicsblocks2");

                cell.onclick = function(event) {
                    cell = event.target;
                    if (cell.getAttribute("alt") === null) {
                        cell = cell.parentNode;
                    }
                    var index = cell.getAttribute("alt").split("__")[0];
                    var condition = cell.getAttribute("alt").split("__")[1];
                    that._createMatrixGraphics2PieSubmenu(index, null);
                };

                this._noteStored.push(
                    this.rowLabels[i] +
                        ": " +
                        this.rowArgs[i][0] +
                        ": " +
                        this.rowArgs[i][1]
                );
            } else {
                if (
                    noteIsSolfege(this.rowLabels[i]) &&
                    this._logo.synth.inTemperament !== "custom"
                ) {
                    cell.innerHTML =
                        i18nSolfege(this.rowLabels[i]) +
                        this.rowArgs[i].toString().sub();
                    var noteObj = getNote(
                        this.rowLabels[i],
                        this.rowArgs[i],
                        0,
                        this._logo.keySignature[0],
                        false,
                        null,
                        this._logo.errorMsg,
                        this._logo.synth.inTemperament
                    );
                } else {
                    cell.innerHTML =
                        this.rowLabels[i] + this.rowArgs[i].toString().sub();
                    var noteObj = [this.rowLabels[i], this.rowArgs[i]];
                }
                cell.setAttribute("alt", i + "__" + "pitchblocks");

                cell.onclick = function(event) {
                    cell = event.target;
                    if (cell.getAttribute("alt") === null) {
                        cell = cell.parentNode;
                    }
                    var index = cell.getAttribute("alt").split("__")[0];
                    var condition = cell.getAttribute("alt").split("__")[1];
                    that._createColumnPieSubmenu(index, condition);
                };

                this._noteStored.push(noteObj[0] + noteObj[1]);
            }

            var ptmCell = ptmTableRow.insertCell();
            // Create tables to store individual notes.
            var ptmCellTable = document.createElement("table");
            ptmCellTable.setAttribute("cellpadding", "0px");
            ptmCell.append(ptmCellTable);

            // We'll use this element to put the clickable notes for this row.
            var ptmRow = ptmCellTable.insertRow();
            this._rows[j] = ptmRow;

            j += 1;
        }

        // An extra row for the note and tuplet values
        var ptmTableRow = ptmTable.insertRow();
        var ptmCell = ptmTableRow.insertCell();
        ptmCell.setAttribute("colspan", "2");
        ptmCell.className = "headcol"; // This cell is fixed horizontally.

        tempTable = document.createElement("table");
        tempTable.setAttribute("cellpadding", "0px");
        ptmCell.append(tempTable);

        this._tupletNoteLabel = null;
        this._tupletValueLabel = null;
        this._tupletNoteValueLabel = null;

        this._tupletNoteLabel = tempTable.insertRow().insertCell();
        this._tupletValueLabel = tempTable.insertRow().insertCell();
        this._noteValueLabel = tempTable.insertRow().insertCell();

        this._noteValueLabel.innerHTML = _("note value");
        this._noteValueLabel.style.fontSize = this._cellScale * 75 + "%";
        this._noteValueLabel.style.height =
            Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + "px";
        this._noteValueLabel.style.width =
            Math.floor(2 * MATRIXSOLFEWIDTH * this._cellScale) + "px";
        this._noteValueLabel.style.minWidth = this._noteValueLabel.style.width;
        this._noteValueLabel.style.maxWidth = this._noteValueLabel.style.width;
        this._noteValueLabel.style.backgroundColor = platformColor.labelColor;

        // Create tables to store individual note values.
        tempTable = document.createElement("table");
        tempTable.setAttribute("cellpadding", "0px");
        this._tupletNoteValueRow = tempTable.insertRow();
        this._tupletValueRow = tempTable.insertRow();
        this._noteValueRow = tempTable.insertRow();
        ptmTableRow.insertCell().append(tempTable);

        this._lookForNoteBlocksOrRepeat();

        // Sort them if there are note blocks.
        if (!this.sorted && this._noteBlocks) {
            setTimeout(function() {
                console.debug("sorting");
                that._sort();
            }, 1000);
        } else {
            this.sorted = false;
        }

        this._logo.textMsg(_("Click on the table to add notes."));

        this.widgetWindow.sendToCenter();
    };

    this._createAddRowPieSubmenu = function() {
        // This menu is used to add new rows to the matrix.
        docById("wheelDivptm").style.display = "";
        const VALUESLABEL = ["pitch", "hertz", "drum", "graphics", "pen"];
        const VALUES = [
            "imgsrc: images/chime.svg",
            "imgsrc: images/synth.svg",
            "imgsrc: images/TamTamMini.svg",
            "imgsrc: images/mouse.svg",
            "imgsrc: images/pen.svg"
        ];
        var valueLabel = [];
        for (var i = 0; i < VALUES.length; i++) {
            var label = _(VALUES[i]);
            valueLabel.push(label);
        }

        var graphicLabels = [];
        for (var i = 0; i < MATRIXGRAPHICS.length; i++) {
            graphicLabels.push(MATRIXGRAPHICS[i]);
        }

        for (var i = 0; i < MATRIXGRAPHICS2.length; i++) {
            graphicLabels.push(MATRIXGRAPHICS2[i]);
        }

        this._menuWheel = new wheelnav("wheelDivptm", null, 200, 200);
        this._exitWheel = new wheelnav("_exitWheel", this._menuWheel.raphael);

        wheelnav.cssMode = true;

        this._menuWheel.keynavigateEnabled = false;
        this._menuWheel.slicePathFunction = slicePath().DonutSlice;
        this._menuWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._menuWheel.colors = [
            platformColor.paletteColors["pitch"][0],
            platformColor.paletteColors["pitch"][1],
            platformColor.paletteColors["drum"][0],
            platformColor.paletteColors["turtle"][0],
            platformColor.paletteColors["turtle"][1]
        ];
        this._menuWheel.slicePathCustom.minRadiusPercent = 0.3;
        this._menuWheel.slicePathCustom.maxRadiusPercent = 1.0;

        this._menuWheel.sliceSelectedPathCustom = this._menuWheel.slicePathCustom;
        this._menuWheel.sliceInitPathCustom = this._menuWheel.slicePathCustom;
        this._menuWheel.clickModeRotate = false;

        this._menuWheel.animatetime = 0; // 300;
        this._menuWheel.createWheel(valueLabel);
        this._menuWheel.navItems[0].setTooltip(_("pitch"));
        this._menuWheel.navItems[1].setTooltip(_("hertz"));
        this._menuWheel.navItems[2].setTooltip(_("drum"));
        this._menuWheel.navItems[3].setTooltip(_("graphics"));
        this._menuWheel.navItems[4].setTooltip(_("pen"));

        this._exitWheel.colors = platformColor.exitWheelcolors;
        this._exitWheel.slicePathFunction = slicePath().DonutSlice;
        this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
        this._exitWheel.slicePathCustom.maxRadiusPercent = 0.25;
        this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.clickModeRotate = false;
        this._exitWheel.createWheel(["×", " "]);

        var x = docById("addnotes").getBoundingClientRect().x;
        var y = docById("addnotes").getBoundingClientRect().y;

        docById("wheelDivptm").style.position = "absolute";
        docById("wheelDivptm").style.height = "300px";
        docById("wheelDivptm").style.width = "300px";
        docById("wheelDivptm").style.left =
            Math.min(
                this._logo.blocks.turtles._canvas.width - 200,
                Math.max(0, x * this._logo.blocks.getStageScale())
            ) + "px";
        docById("wheelDivptm").style.top =
            Math.min(
                this._logo.blocks.turtles._canvas.height - 250,
                Math.max(0, y * this._logo.blocks.getStageScale())
            ) + "px";

        var that = this;
        this._exitWheel.navItems[0].navigateFunction = function() {
            docById("wheelDivptm").style.display = "none";
            that._menuWheel.removeWheel();
            that._exitWheel.removeWheel();
        };

        var __subMenuChanged = function() {
            __selectionChanged();
        };

        var __selectionChanged = function() {
            var label = VALUESLABEL[that._menuWheel.selectedNavItemIndex];
            console.debug(label);
            var rLabel = null;
            var rArg = null;
            var blockLabel = "";
            var newBlock = that._logo.blocks.blockList.length;
            switch (label) {
                case "pitch":
                    console.debug("loading new pitch block");
                    that._logo.blocks.loadNewBlocks([
                        [0, ["pitch", {}], 0, 0, [null, 1, 2, null]],
                        [1, ["solfege", { value: "sol" }], 0, 0, [0]],
                        [2, ["number", { value: 4 }], 0, 0, [0]]
                    ]);
                    rLabel = "sol";
                    rArg = 4;
                    break;
                case "hertz":
                    console.debug("loading new Hertz block");
                    that._logo.blocks.loadNewBlocks([
                        [0, ["hertz", {}], 0, 0, [null, 1, null]],
                        [1, ["number", { value: 392 }], 0, 0, [0]]
                    ]);
                    rLabel = "hertz";
                    rArg = 392;
                    break;
                case "drum":
                    console.debug("loading new playdrum block");
                    that._logo.blocks.loadNewBlocks([
                        [0, ["playdrum", {}], 0, 0, [null, 1, null]],
                        [1, ["drumname", { value: DEFAULTDRUM }], 0, 0, [0]]
                    ]);
                    rLabel = blockLabel;
                    rArg = -1;
                    break;
                case "graphics":
                    console.debug("loading new forward block");
                    that._logo.blocks.loadNewBlocks([
                        [0, ["forward", {}], 0, 0, [null, 1, null]],
                        [1, ["number", { value: 100 }], 0, 0, [0]]
                    ]);
                    rLabel = "forward";
                    rArg = 100;
                    break;
                case "pen":
                    console.debug("loading new setcolor block");
                    that._logo.blocks.loadNewBlocks([
                        [0, ["setcolor", {}], 0, 0, [null, 1, null]],
                        [1, ["number", { value: 0 }], 0, 0, [0]]
                    ]);
                    rLabel = "setcolor";
                    rArg = 0;
                    break;
                default:
                    console.debug(label + " not found");
                    break;
            }

            var blocksNo = null;
            var aboveBlock = null;

            switch (label) {
                case "graphics":
                case "pen":
                    for (var i = graphicLabels.length - 1; i >= 0; i--) {
                        blocksNo = that._mapNotesBlocks(graphicLabels[i]);
                        if (blocksNo.length >= 1) {
                            aboveBlock = last(blocksNo);
                            console.debug(aboveBlock);
                            break;
                        }
                    }
                    break;
                case "drum":
                    blocksNo = that._mapNotesBlocks("playdrum");
                    if (blocksNo.length >= 1) {
                        aboveBlock = last(blocksNo);
                    }
                    break;
                case "hertz":
                    blocksNo = that._mapNotesBlocks("hertz");
                    if (blocksNo.length >= 1) {
                        aboveBlock = last(blocksNo);
                    }
                    break;
                case "pitch":
                    blocksNo = that._mapNotesBlocks("pitch");
                    if (blocksNo.length >= 1) {
                        aboveBlock = last(blocksNo);
                    }
                    break;
            }

            if (aboveBlock === null) {
                console.debug("WARNING: aboveBlock is null");
                // Look for a pitch block.
                blocksNo = that._mapNotesBlocks("pitch");
                if (blocksNo.length >= 1) {
                    aboveBlock = last(blocksNo);
                }

                // The top?
                if (aboveBlock === null) {
                    aboveBlock = that.blockNo;
                }
            }

            if (aboveBlock === that.blockNo) {
                setTimeout(
                    that._addNotesBlockBetween(aboveBlock, newBlock, true),
                    500
                );
                that.rowLabels.splice(0, 0, rLabel);
                that.rowArgs.splice(0, 0, rArg);
                that._rowBlocks.splice(0, 0, newBlock);
            } else {
                setTimeout(
                    that._addNotesBlockBetween(aboveBlock, newBlock, false),
                    500
                );
                for (var i = 0; i < that.columnBlocksMap.length; i++) {
                    if (that.columnBlocksMap[i][0] === aboveBlock) {
                        break;
                    }
                }

                that.rowLabels.splice(i + 1, 0, rLabel);
                that.rowArgs.splice(i + 1, 0, rArg);
                that._rowBlocks.splice(i + 1, 0, newBlock);
            }

            that.sorted = false;
            that.init(that._logo);
            for (var i = 0; i < that._logo.tupletRhythms.length; i++) {
                switch (that._logo.tupletRhythms[i][0]) {
                    case "simple":
                    case "notes":
                        var tupletParam = [that._logo.tupletParams[i]];
                        tupletParam.push([]);
                        for (
                            var j = 2;
                            j < that._logo.tupletRhythms[i].length;
                            j++
                        ) {
                            tupletParam[1].push(that._logo.tupletRhythms[i][j]);
                        }

                        that.addTuplet(tupletParam);
                        break;
                    default:
                        that.addNotes(
                            that._logo.tupletRhythms[i][1],
                            that._logo.tupletRhythms[i][2]
                        );
                        break;
                }
            }

            that.makeClickable();
            if (label === "pitch") {
                setTimeout(function() {
                    that.pitchBlockAdded(newBlock);
                }, 200);
            }
        };

        for (var i = 0; i < valueLabel.length; i++) {
            this._menuWheel.navItems[i].navigateFunction = __subMenuChanged;
        }
    };

    this.pitchBlockAdded = function(blockN) {
        for (var i = 0; i < this.columnBlocksMap.length; i++) {
            if (this.columnBlocksMap[i][0] === blockN) {
                break;
            }
        }

        setTimeout(this._createColumnPieSubmenu(i, "pitchblocks", true), 500);
    };

    this._createMatrixGraphics2PieSubmenu = function(blockIndex, blk) {
        // A wheel for modifying 2-arg graphics blocks
        docById("wheelDivptm").style.display = "";
        var arcRadiusLabel = [
            "10",
            "20",
            "30",
            "40",
            "50",
            "60",
            "70",
            "80",
            "90",
            "100"
        ];
        var arcAngleLabel = ["0", "30", "45", "60", "90", "180"];
        var setxyValueLabel = ["-200", "-100", "0", "100", "200"];

        this._pitchWheel = new wheelnav("wheelDivptm", null, 600, 600);
        this._exitWheel = new wheelnav("_exitWheel", this._pitchWheel.raphael);
        this._blockLabelsWheel = new wheelnav(
            "_blockLabelsWheel",
            this._pitchWheel.raphael
        );
        this._blockLabelsWheel2 = new wheelnav(
            "_blockLabelsWheel2",
            this._pitchWheel.raphael
        );
        var _blockNames = MATRIXGRAPHICS2.slice();
        var _blockLabels = [];
        for (var i = 0; i < _blockNames.length; i++) {
            _blockLabels.push(
                this._logo.blocks.protoBlockDict[_blockNames[i]][
                    "staticLabels"
                ][0]
            );
        }

        wheelnav.cssMode = true;

        this._pitchWheel.keynavigateEnabled = false;
        this._pitchWheel.slicePathFunction = slicePath().DonutSlice;
        this._pitchWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._pitchWheel.colors = platformColor.blockLabelsWheelcolors;
        this._pitchWheel.slicePathCustom.minRadiusPercent = 0.2;
        this._pitchWheel.slicePathCustom.maxRadiusPercent = 0.475;

        this._pitchWheel.sliceSelectedPathCustom = this._pitchWheel.slicePathCustom;
        this._pitchWheel.sliceInitPathCustom = this._pitchWheel.slicePathCustom;
        this._pitchWheel.clickModeRotate = false;

        this._pitchWheel.animatetime = 0;

        this._blockLabelsWheel2.colors = platformColor.blockLabelsWheelcolors;
        this._blockLabelsWheel2.slicePathFunction = slicePath().DonutSlice;
        this._blockLabelsWheel2.slicePathCustom = slicePath().DonutSliceCustomization();
        this._blockLabelsWheel2.slicePathCustom.minRadiusPercent = 0.525;
        this._blockLabelsWheel2.slicePathCustom.maxRadiusPercent = 0.8;
        this._blockLabelsWheel2.sliceSelectedPathCustom = this._blockLabelsWheel2.slicePathCustom;
        this._blockLabelsWheel2.sliceInitPathCustom = this._blockLabelsWheel2.slicePathCustom;
        this._blockLabelsWheel2.clickModeRotate = false;
        this._blockLabelsWheel2.animatetime = 0;

        this._exitWheel.colors = platformColor.exitWheelcolors;
        this._exitWheel.slicePathFunction = slicePath().DonutSlice;
        this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
        this._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
        this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.clickModeRotate = false;

        this._blockLabelsWheel.colors = platformColor.graphicWheelcolors;
        this._blockLabelsWheel.slicePathFunction = slicePath().DonutSlice;
        this._blockLabelsWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._blockLabelsWheel.slicePathCustom.minRadiusPercent = 0.8;
        this._blockLabelsWheel.slicePathCustom.maxRadiusPercent = 1;
        this._blockLabelsWheel.sliceSelectedPathCustom = this._blockLabelsWheel.slicePathCustom;
        this._blockLabelsWheel.sliceInitPathCustom = this._blockLabelsWheel.slicePathCustom;
        this._blockLabelsWheel.clickModeRotate = false;
        this._blockLabelsWheel.titleRotateAngle = 90;
        this._blockLabelsWheel.animatetime = 0;
        this._blockLabelsWheel.createWheel(_blockLabels);

        var x = this._labelcols[blockIndex].getBoundingClientRect().x;
        var y = this._labelcols[blockIndex].getBoundingClientRect().y;

        docById("wheelDivptm").style.position = "absolute";
        docById("wheelDivptm").style.height = "300px";
        docById("wheelDivptm").style.width = "300px";
        docById("wheelDivptm").style.left =
            Math.min(
                this._logo.blocks.turtles._canvas.width - 200,
                Math.max(0, x * this._logo.blocks.getStageScale())
            ) + "px";
        docById("wheelDivptm").style.top =
            Math.min(
                this._logo.blocks.turtles._canvas.height - 250,
                Math.max(0, y * this._logo.blocks.getStageScale())
            ) + "px";

        var thisBlock = this.columnBlocksMap[blockIndex][0];
        if (blk !== null) {
            thisBlock = blk;
        }

        var blockLabel = this._logo.blocks.blockList[thisBlock].name;
        var xblockLabelValue = this._logo.blocks.blockList[
            this._logo.blocks.blockList[thisBlock].connections[1]
        ].value;
        var yblockLabelValue = this._logo.blocks.blockList[
            this._logo.blocks.blockList[thisBlock].connections[2]
        ].value;

        if (blockLabel === "arc") {
            this._blockLabelsWheel2.createWheel(arcAngleLabel);
            this._pitchWheel.createWheel(arcRadiusLabel);
        } else if (blockLabel === "setxy") {
            this._blockLabelsWheel2.createWheel(setxyValueLabel);
            this._pitchWheel.createWheel(setxyValueLabel);
        }

        console.debug(_blockNames.indexOf(blockLabel));
        this._blockLabelsWheel.navigateWheel(_blockNames.indexOf(blockLabel));

        this.xblockValue = [xblockLabelValue.toString(), "x"];
        this.yblockValue = [yblockLabelValue.toString(), "y"];
        this._exitWheel.createWheel(["×", ""]);

        var that = this;
        this._exitWheel.navItems[0].navigateFunction = function() {
            docById("wheelDivptm").style.display = "none";
            that._pitchWheel.removeWheel();
            that._exitWheel.removeWheel();
            that._blockLabelsWheel.removeWheel();
            that._blockLabelsWheel2.removeWheel();
        };

        var __enterArgValue1 = function() {
            that.xblockValue[0] =
                that._blockLabelsWheel2.navItems[
                    that._blockLabelsWheel2.selectedNavItemIndex
                ].title;
            __selectionChanged(true);
        };

        var __enterArgValue2 = function() {
            that.yblockValue[0] =
                that._pitchWheel.navItems[
                    that._pitchWheel.selectedNavItemIndex
                ].title;
            __selectionChanged(true);
        };

        if (blockLabel === "arc") {
            for (var i = 0; i < arcAngleLabel.length; i++) {
                this._blockLabelsWheel2.navItems[
                    i
                ].navigateFunction = __enterArgValue1;
            }

            for (var i = 0; i < arcRadiusLabel.length; i++) {
                this._pitchWheel.navItems[
                    i
                ].navigateFunction = __enterArgValue2;
            }
        } else if (blockLabel === "setxy") {
            for (var i = 0; i < setxyValueLabel.length; i++) {
                this._blockLabelsWheel2.navItems[
                    i
                ].navigateFunction = __enterArgValue1;
                this._pitchWheel.navItems[
                    i
                ].navigateFunction = __enterArgValue2;
            }
        }

        var __selectionChanged = async function(updatingArgs) {
            var thisBlockName =
                _blockNames[that._blockLabelsWheel.selectedNavItemIndex];
            if (updatingArgs === undefined) {
                // Creating a new block and removing the old one.
                var newBlock = that._logo.blocks.blockList.length;
                that._logo.blocks.loadNewBlocks([
                    [0, thisBlockName, 0, 0, [null, 1, 2, null]],
                    [
                        1,
                        ["number", { value: parseInt(that.xblockValue[0]) }],
                        0,
                        0,
                        [0]
                    ],
                    [
                        2,
                        ["number", { value: parseInt(that.yblockValue[0]) }],
                        0,
                        0,
                        [0]
                    ]
                ]);

                await delayExecution(500);
                that._blockReplace(thisBlock, newBlock);
                that.columnBlocksMap[blockIndex][0] = newBlock;
                thisBlock = newBlock;
                that._createMatrixGraphics2PieSubmenu(blockIndex, newBlock);
            } else {
                // Just updating a block arg value
                var argBlock =
                    that._logo.blocks.blockList[thisBlock].connections[1];
                that._logo.blocks.blockList[argBlock].text.text =
                    that.xblockValue[0];
                that._logo.blocks.blockList[argBlock].value = parseInt(
                    that.xblockValue[0]
                );

                var z =
                    that._logo.blocks.blockList[argBlock].container.children
                        .length - 1;
                that._logo.blocks.blockList[argBlock].container.setChildIndex(
                    that._logo.blocks.blockList[argBlock].text,
                    z
                );
                that._logo.blocks.blockList[argBlock].updateCache();

                var argBlock =
                    that._logo.blocks.blockList[thisBlock].connections[2];
                that._logo.blocks.blockList[argBlock].text.text =
                    that.yblockValue[0];
                that._logo.blocks.blockList[argBlock].value = parseInt(
                    that.yblockValue[0]
                );

                var z =
                    that._logo.blocks.blockList[argBlock].container.children
                        .length - 1;
                that._logo.blocks.blockList[argBlock].container.setChildIndex(
                    that._logo.blocks.blockList[argBlock].text,
                    z
                );
                that._logo.blocks.blockList[argBlock].updateCache();
            }

            // Update the stored values for this node.
            that.rowLabels[blockIndex] = thisBlockName;
            that.rowArgs[blockIndex][0] = parseInt(that.xblockValue);
            that.rowArgs[blockIndex][1] = parseInt(that.yblockValue);

            // Update the cell label.
            var cell = that._headcols[blockIndex];
            var iconSize = ICONSIZE * (window.innerWidth / 1200);
            if (MATRIXGRAPHICS2.indexOf(that.rowLabels[blockIndex]) !== -1) {
                cell.innerHTML =
                    '&nbsp;&nbsp;<img src="' +
                    "images/mouse.svg" +
                    '" height="' +
                    iconSize +
                    '" width="' +
                    iconSize +
                    '" vertical-align="middle">&nbsp;&nbsp;';
            }

            cell = that._labelcols[blockIndex];
            if (MATRIXGRAPHICS2.indexOf(that.rowLabels[blockIndex]) !== -1) {
                var blockLabel =
                    that._logo.blocks.protoBlockDict[
                        that.rowLabels[blockIndex]
                    ]["staticLabels"][0];
                cell.innerHTML =
                    blockLabel +
                    "<br>" +
                    that.rowArgs[blockIndex][0] +
                    " " +
                    that.rowArgs[blockIndex][1];
                cell.style.fontSize = Math.floor(that._cellScale * 12) + "px";
            }

            noteStored =
                that.rowLabels[blockIndex] +
                ": " +
                that.rowArgs[blockIndex][0] +
                ": " +
                that.rowArgs[blockIndex][1];

            that._noteStored[blockIndex] = noteStored;
        };

        for (var i = 0; i < _blockLabels.length; i++) {
            this._blockLabelsWheel.navItems[
                i
            ].navigateFunction = __selectionChanged;
        }
    };

    this._createMatrixGraphicsPieSubmenu = function(
        blockIndex,
        condition,
        blk
    ) {
        // A wheel for modifying 1-arg blocks (graphics and hertz)
        docById("wheelDivptm").style.display = "";
        // Different blocks get different arg wheel values.
        if (condition === "synthsblocks") {
            var valueLabel = [
                "261",
                "294",
                "327",
                "348",
                "392",
                "436",
                "490",
                "523"
            ];
        } else {
            var valueLabel = [
                "50",
                "90",
                "100",
                "150",
                "180",
                "200",
                "250",
                "270",
                "300",
                "350",
                "360"
            ];
            var forwardBackLabel = ["1", "5", "10", "25", "50", "100", "200"];
            var leftRightLabel = ["15", "30", "45", "60", "90", "180"];
            var setHeadingLabel = [
                "0",
                "45",
                "90",
                "135",
                "180",
                "225",
                "270",
                "315"
            ];
            var setPenSizeLabel = ["1", "5", "10", "25", "50"];
            var setLabel = [
                "0",
                "10",
                "20",
                "30",
                "40",
                "5n0",
                "60",
                "70",
                "80",
                "90",
                "100"
            ];
        }

        this._pitchWheel = new wheelnav("wheelDivptm", null, 800, 800);
        this._exitWheel = new wheelnav("_exitWheel", this._pitchWheel.raphael);
        if (condition === "graphicsblocks") {
            this._blockLabelsWheel = new wheelnav(
                "_blockLabelsWheel",
                this._pitchWheel.raphael
            );
            var blockNamesGraphics = [];
            var blockLabelsGraphics = [];
            var blockNamesPen = [];
            var blockLabelsPen = [];
            for (var i = 0; i < 5; i++) {
                var name = MATRIXGRAPHICS[i];
                blockNamesGraphics.push(name);
                blockLabelsGraphics.push(
                    this._logo.blocks.protoBlockDict[name]["staticLabels"][0]
                );
            }
            for (var i = 5; i < MATRIXGRAPHICS.length; i++) {
                var name = MATRIXGRAPHICS[i];
                blockNamesPen.push(name);
                blockLabelsPen.push(
                    this._logo.blocks.protoBlockDict[name]["staticLabels"][0]
                );
            }
        }

        wheelnav.cssMode = true;

        this._pitchWheel.keynavigateEnabled = false;
        this._pitchWheel.slicePathFunction = slicePath().DonutSlice;
        this._pitchWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._pitchWheel.colors = platformColor.blockLabelsWheelcolors;
        this._pitchWheel.slicePathCustom.minRadiusPercent = 0.525;
        this._pitchWheel.slicePathCustom.maxRadiusPercent = 0.8;

        this._pitchWheel.sliceSelectedPathCustom = this._pitchWheel.slicePathCustom;
        this._pitchWheel.sliceInitPathCustom = this._pitchWheel.slicePathCustom;
        this._pitchWheel.clickModeRotate = false;

        this._pitchWheel.animatetime = 0; // 300;

        this._exitWheel.colors = platformColor.exitWheelcolors;
        this._exitWheel.slicePathFunction = slicePath().DonutSlice;
        this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
        this._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
        this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.clickModeRotate = false;

        if (condition === "graphicsblocks") {
            this._blockLabelsWheel.colors = platformColor.graphicWheelcolors;
            this._blockLabelsWheel.slicePathFunction = slicePath().DonutSlice;
            this._blockLabelsWheel.slicePathCustom = slicePath().DonutSliceCustomization();
            this._blockLabelsWheel.slicePathCustom.minRadiusPercent = 0.8;
            this._blockLabelsWheel.slicePathCustom.maxRadiusPercent = 1;
            this._blockLabelsWheel.sliceSelectedPathCustom = this._blockLabelsWheel.slicePathCustom;
            this._blockLabelsWheel.sliceInitPathCustom = this._blockLabelsWheel.slicePathCustom;
            this._blockLabelsWheel.clickModeRotate = false;
            this._blockLabelsWheel.titleRotateAngle = 90;
            this._blockLabelsWheel.animatetime = 0;
        }

        var x = this._labelcols[blockIndex].getBoundingClientRect().x;
        var y = this._labelcols[blockIndex].getBoundingClientRect().y;

        docById("wheelDivptm").style.position = "absolute";
        docById("wheelDivptm").style.height = "300px";
        docById("wheelDivptm").style.width = "300px";
        docById("wheelDivptm").style.left =
            Math.min(
                this._logo.blocks.turtles._canvas.width - 200,
                Math.max(0, x * this._logo.blocks.getStageScale())
            ) + "px";
        docById("wheelDivptm").style.top =
            Math.min(
                this._logo.blocks.turtles._canvas.height - 250,
                Math.max(0, y * this._logo.blocks.getStageScale())
            ) + "px";

        var thisBlock = this.columnBlocksMap[blockIndex][0];
        if (blk !== null) {
            thisBlock = blk;
        }

        var blockLabel = this._logo.blocks.blockList[thisBlock].name;
        var blockLabelValue = this._logo.blocks.blockList[
            this._logo.blocks.blockList[thisBlock].connections[1]
        ].value;

        if (condition === "graphicsblocks") {
            if (blockLabel === "forward" || blockLabel === "back") {
                this._pitchWheel.createWheel(forwardBackLabel);
                this._blockLabelsWheel.createWheel(blockLabelsGraphics);
            } else if (blockLabel === "right" || blockLabel === "left") {
                this._pitchWheel.createWheel(leftRightLabel);
                this._blockLabelsWheel.createWheel(blockLabelsGraphics);
            } else if (blockLabel === "setheading") {
                this._pitchWheel.createWheel(setHeadingLabel);
                this._blockLabelsWheel.createWheel(blockLabelsGraphics);
            } else if (blockLabel === "setpensize") {
                this._pitchWheel.createWheel(setPenSizeLabel);
                this._blockLabelsWheel.createWheel(blockLabelsPen);
            } else {
                this._pitchWheel.createWheel(setLabel);
                this._blockLabelsWheel.createWheel(blockLabelsPen);
            }
        } else if (condition === "synthsblocks") {
            this._pitchWheel.createWheel(valueLabel);
        }

        this.blockValue = blockLabelValue.toString();
        this._exitWheel.createWheel(["×", ""]);

        var that = this;
        this._exitWheel.navItems[0].navigateFunction = function() {
            docById("wheelDivptm").style.display = "none";
            that._pitchWheel.removeWheel();
            that._exitWheel.removeWheel();
            if (condition === "graphicsblocks") {
                that._blockLabelsWheel.removeWheel();
            }
        };

        var __enterArgValue = function() {
            that.blockValue =
                that._pitchWheel.navItems[
                    that._pitchWheel.selectedNavItemIndex
                ].title;
            docById("wheelnav-_exitWheel-title-1").children[0].textContent =
                that.blockValue;
            __selectionChanged(true);
        };

        if (condition === "graphicsblocks") {
            if (blockLabel === "forward" || blockLabel === "back") {
                for (var i = 0; i < forwardBackLabel.length; i++) {
                    this._pitchWheel.navItems[
                        i
                    ].navigateFunction = __enterArgValue;
                }
            } else if (blockLabel === "right" || blockLabel === "left") {
                for (var i = 0; i < leftRightLabel.length; i++) {
                    this._pitchWheel.navItems[
                        i
                    ].navigateFunction = __enterArgValue;
                }
            } else if (blockLabel === "setheading") {
                for (var i = 0; i < setHeadingLabel.length; i++) {
                    this._pitchWheel.navItems[
                        i
                    ].navigateFunction = __enterArgValue;
                }
            } else if (blockLabel === "setpensize") {
                for (var i = 0; i < setPenSizeLabel.length; i++) {
                    this._pitchWheel.navItems[
                        i
                    ].navigateFunction = __enterArgValue;
                }
            } else {
                for (var i = 0; i < setLabel.length; i++) {
                    this._pitchWheel.navItems[
                        i
                    ].navigateFunction = __enterArgValue;
                }
            }
        } else if (condition === "synthsblocks") {
            for (var i = 0; i < valueLabel.length; i++) {
                this._pitchWheel.navItems[i].navigateFunction = __enterArgValue;
            }
        }

        var __selectionChanged = async function(updatingArgs) {
            var thisBlockName = "hertz";

            if (condition === "graphicsblocks") {
                var label =
                    that._blockLabelsWheel.navItems[
                        that._blockLabelsWheel.selectedNavItemIndex
                    ].title;
                var i = blockLabelsGraphics.indexOf(label);
                if (i === -1) {
                    i = blockLabelsPen.indexOf(label);
                    if (i !== -1) {
                        var thisBlockName = blockNamesPen[i];
                    }
                } else {
                    var thisBlockName = blockNamesGraphics[i];
                }
            }

            if (updatingArgs === undefined) {
                var newBlock = that._logo.blocks.blockList.length;
                that._logo.blocks.loadNewBlocks([
                    [0, thisBlockName, 0, 0, [null, 1, null]],
                    [
                        1,
                        ["number", { value: parseInt(that.blockValue) }],
                        0,
                        0,
                        [0]
                    ]
                ]);

                await delayExecution(500);
                that._blockReplace(thisBlock, newBlock);
                that.columnBlocksMap[blockIndex][0] = newBlock;
                thisBlock = newBlock;
                that._createMatrixGraphicsPieSubmenu(
                    blockIndex,
                    condition,
                    newBlock
                );
            } else {
                // Just updating a block arg value
                var argBlock =
                    that._logo.blocks.blockList[thisBlock].connections[1];
                that._logo.blocks.blockList[argBlock].text.text =
                    that.blockValue;
                that._logo.blocks.blockList[argBlock].value = parseInt(
                    that.blockValue
                );

                var z =
                    that._logo.blocks.blockList[argBlock].container.children
                        .length - 1;
                that._logo.blocks.blockList[argBlock].container.setChildIndex(
                    that._logo.blocks.blockList[argBlock].text,
                    z
                );
                that._logo.blocks.blockList[argBlock].updateCache();
            }

            // Update the stored values for this node.
            that.rowLabels[blockIndex] = thisBlockName;
            that.rowArgs[blockIndex] = parseInt(that.blockValue);

            // Update the cell label.
            var cell = that._headcols[blockIndex];
            var iconSize = ICONSIZE * (window.innerWidth / 1200);
            if (MATRIXSYNTHS.indexOf(that.rowLabels[blockIndex]) !== -1) {
                cell.innerHTML =
                    '&nbsp;&nbsp;<img src="' +
                    "images/synth2.svg" +
                    '" height="' +
                    iconSize +
                    '" width="' +
                    iconSize +
                    '" vertical-align="middle">&nbsp;&nbsp;';
            } else if (
                MATRIXGRAPHICS.indexOf(that.rowLabels[blockIndex]) !== -1
            ) {
                cell.innerHTML =
                    '&nbsp;&nbsp;<img src="' +
                    "images/mouse.svg" +
                    '" height="' +
                    iconSize +
                    '" width="' +
                    iconSize +
                    '" vertical-align="middle">&nbsp;&nbsp;';
            }

            cell = that._labelcols[blockIndex];
            if (MATRIXSYNTHS.indexOf(that.rowLabels[blockIndex]) !== -1) {
                cell.innerHTML = that.rowArgs[blockIndex];
                cell.style.fontSize = Math.floor(this._cellScale * 14) + "px";
            } else if (
                MATRIXGRAPHICS.indexOf(that.rowLabels[blockIndex]) !== -1
            ) {
                var blockLabel =
                    that._logo.blocks.protoBlockDict[
                        that.rowLabels[blockIndex]
                    ]["staticLabels"][0];
                cell.innerHTML = blockLabel + "<br>" + that.rowArgs[blockIndex];
                cell.style.fontSize = Math.floor(that._cellScale * 12) + "px";
            }

            var noteStored = null;
            if (condition === "graphicsblocks") {
                noteStored =
                    that.rowLabels[blockIndex] +
                    ": " +
                    that.rowArgs[blockIndex];
            } else if (condition === "synthsblocks") {
                noteStored = that.rowArgs[blockIndex];
            }

            that._noteStored[blockIndex] =
                that.rowLabels[blockIndex] + ": " + that.rowArgs[blockIndex];
        };

        if (condition === "graphicsblocks") {
            if (blockLabel === "forward" || blockLabel === "back") {
                for (var i = 0; i < blockLabelsGraphics.length; i++) {
                    this._blockLabelsWheel.navItems[
                        i
                    ].navigateFunction = __selectionChanged;
                }
            } else if (blockLabel === "right" || blockLabel === "left") {
                for (var i = 0; i < blockLabelsGraphics.length; i++) {
                    this._blockLabelsWheel.navItems[
                        i
                    ].navigateFunction = __selectionChanged;
                }
            } else if (blockLabel === "setheading") {
                for (var i = 0; i < blockLabelsGraphics.length; i++) {
                    this._blockLabelsWheel.navItems[
                        i
                    ].navigateFunction = __selectionChanged;
                }
            } else if (blockLabel === "setpensize") {
                for (var i = 0; i < blockLabelsPen.length; i++) {
                    this._blockLabelsWheel.navItems[
                        i
                    ].navigateFunction = __selectionChanged;
                }
            } else {
                for (var i = 0; i < blockLabelsPen.length; i++) {
                    this._blockLabelsWheel.navItems[
                        i
                    ].navigateFunction = __selectionChanged;
                }
            }
        }
    };

    this._createColumnPieSubmenu = function(index, condition, sortedClose) {
        index = parseInt(index);
        docById("wheelDivptm").style.display = "";

        var accidentals = ["𝄪", "♯", "♮", "♭", "𝄫"];
        var noteLabels = ["ti", "la", "sol", "fa", "mi", "re", "do"];
        var drumLabels = [];
        for (var i = 0; i < DRUMS.length; i++) {
            var label = _(DRUMS[i]);
            drumLabels.push(label);
        }

        if (condition === "drumblocks") {
            noteLabels = drumLabels;
            var categories = [
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                1,
                1,
                1,
                1,
                1,
                1,
                1,
                2,
                2,
                2,
                2
            ];
            const COLORS = platformColor.piemenuVoicesColors;
            var colors = [];

            for (var i = 0; i < drumLabels.length; i++) {
                colors.push(COLORS[categories[i] % COLORS.length]);
            }
        }

        if (condition === "drumblocks") {
            this._pitchWheel = new wheelnav("wheelDivptm", null, 1200, 1200);
        } else {
            this._pitchWheel = new wheelnav("wheelDivptm", null, 600, 600);
        }

        // this._pitchWheel = new wheelnav('wheelDivptm', null, 600, 600);
        this._exitWheel = new wheelnav("_exitWheel", this._pitchWheel.raphael);
        if (condition === "pitchblocks") {
            this._accidentalsWheel = new wheelnav(
                "_accidentalsWheel",
                this._pitchWheel.raphael
            );
            this._octavesWheel = new wheelnav(
                "_octavesWheel",
                this._pitchWheel.raphael
            );
        }

        wheelnav.cssMode = true;

        this._pitchWheel.keynavigateEnabled = false;
        this._pitchWheel.slicePathFunction = slicePath().DonutSlice;
        this._pitchWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        if (condition === "pitchblocks") {
            this._pitchWheel.colors = platformColor.pitchWheelcolors;
            this._pitchWheel.slicePathCustom.minRadiusPercent = 0.2;
            this._pitchWheel.slicePathCustom.maxRadiusPercent = 0.5;
        } else if (condition === "drumblocks") {
            this._pitchWheel.titleRotateAngle = 0;
            this._pitchWheel.colors = colors;
            this._pitchWheel.slicePathCustom.minRadiusPercent = 0.2;
            this._pitchWheel.slicePathCustom.maxRadiusPercent = 1;
        }

        this._pitchWheel.sliceSelectedPathCustom = this._pitchWheel.slicePathCustom;
        this._pitchWheel.sliceInitPathCustom = this._pitchWheel.slicePathCustom;

        this._pitchWheel.animatetime = 0; // 300;
        this._pitchWheel.createWheel(noteLabels);

        this._exitWheel.colors = platformColor.exitWheelcolors;
        this._exitWheel.slicePathFunction = slicePath().DonutSlice;
        this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
        this._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
        this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.clickModeRotate = false;
        this._exitWheel.createWheel(["×", " "]);

        if (condition === "pitchblocks") {
            this._accidentalsWheel.colors =
                platformColor.accidentalsWheelcolors;
            this._accidentalsWheel.slicePathFunction = slicePath().DonutSlice;
            this._accidentalsWheel.slicePathCustom = slicePath().DonutSliceCustomization();
            this._accidentalsWheel.slicePathCustom.minRadiusPercent = 0.5;
            this._accidentalsWheel.slicePathCustom.maxRadiusPercent = 0.75;
            this._accidentalsWheel.sliceSelectedPathCustom = this._accidentalsWheel.slicePathCustom;
            this._accidentalsWheel.sliceInitPathCustom = this._accidentalsWheel.slicePathCustom;

            var accidentalLabels = [];
            for (var i = 0; i < accidentals.length; i++) {
                accidentalLabels.push(accidentals[i]);
            }

            for (var i = 0; i < 9; i++) {
                accidentalLabels.push(null);
                this._accidentalsWheel.colors.push(
                    platformColor.accidentalsWheelcolorspush
                );
            }

            this._accidentalsWheel.animatetime = 0; // 300;
            this._accidentalsWheel.createWheel(accidentalLabels);
            this._accidentalsWheel.setTooltips([
                _("double sharp"),
                _("sharp"),
                _("natural"),
                _("flat"),
                _("double flat")
            ]);

            this._octavesWheel.colors = platformColor.octavesWheelcolors;
            this._octavesWheel.slicePathFunction = slicePath().DonutSlice;
            this._octavesWheel.slicePathCustom = slicePath().DonutSliceCustomization();
            this._octavesWheel.slicePathCustom.minRadiusPercent = 0.75;
            this._octavesWheel.slicePathCustom.maxRadiusPercent = 0.95;
            this._octavesWheel.sliceSelectedPathCustom = this._octavesWheel.slicePathCustom;
            this._octavesWheel.sliceInitPathCustom = this._octavesWheel.slicePathCustom;
            var octaveLabels = [
                "8",
                "7",
                "6",
                "5",
                "4",
                "3",
                "2",
                "1",
                null,
                null,
                null,
                null,
                null,
                null
            ];
            this._octavesWheel.animatetime = 0; // 300;
            this._octavesWheel.createWheel(octaveLabels);
        }

        var x = this._labelcols[index].getBoundingClientRect().x;
        var y = this._labelcols[index].getBoundingClientRect().y;

        docById("wheelDivptm").style.position = "absolute";
        docById("wheelDivptm").style.height = "300px";
        docById("wheelDivptm").style.width = "300px";
        docById("wheelDivptm").style.left =
            Math.min(
                this._logo.blocks.turtles._canvas.width - 200,
                Math.max(0, x * this._logo.blocks.getStageScale())
            ) + "px";
        docById("wheelDivptm").style.top =
            Math.min(
                this._logo.blocks.turtles._canvas.height - 250,
                Math.max(0, y * this._logo.blocks.getStageScale())
            ) + "px";

        if (!this._noteBlocks) {
            var block = this.columnBlocksMap[index][0];
            var noteValue = this._logo.blocks.blockList[
                this._logo.blocks.blockList[block].connections[1]
            ].value;

            if (condition === "pitchblocks") {
                var octaveValue = this._logo.blocks.blockList[
                    this._logo.blocks.blockList[block].connections[2]
                ].value;
                var accidentalsValue = 2;

                for (var i = 0; i < accidentals.length; i++) {
                    if (noteValue.indexOf(accidentals[i]) !== -1) {
                        accidentalsValue = i;
                        noteValue = noteValue.substr(
                            0,
                            noteValue.indexOf(accidentals[i])
                        );
                        break;
                    }
                }

                this._accidentalsWheel.navigateWheel(accidentalsValue);
                this._octavesWheel.navigateWheel(
                    octaveLabels.indexOf(octaveValue.toString())
                );
            }
            this._pitchWheel.navigateWheel(noteLabels.indexOf(noteValue));
        }

        var that = this;
        this._exitWheel.navItems[0].navigateFunction = function() {
            docById("wheelDivptm").style.display = "none";
            that._pitchWheel.removeWheel();
            that._exitWheel.removeWheel();
            if (condition === "pitchblocks") {
                that._accidentalsWheel.removeWheel();
                that._octavesWheel.removeWheel();
            }

            that.sorted = false;
            if (sortedClose === true) {
                that._sort();
            }
        };

        var __selectionChanged = function() {
            var label =
                that._pitchWheel.navItems[that._pitchWheel.selectedNavItemIndex]
                    .title;
            var i = noteLabels.indexOf(label);
            if (condition === "pitchblocks") {
                var attr =
                    that._accidentalsWheel.navItems[
                        that._accidentalsWheel.selectedNavItemIndex
                    ].title;
                var flag = false;
                if (attr !== "♮") {
                    label += attr;
                    flag = true;
                }
                // Allow sorting since sorted order might be lost
                this.sorted = false;
            }

            if (!that._noteBlocks) {
                var noteLabelBlock =
                    that._logo.blocks.blockList[block].connections[1];
                that._logo.blocks.blockList[noteLabelBlock].text.text = label;
                that._logo.blocks.blockList[noteLabelBlock].value = label;

                var z =
                    that._logo.blocks.blockList[noteLabelBlock].container.children
                        .length - 1;
                that._logo.blocks.blockList[noteLabelBlock].container.setChildIndex(
                    that._logo.blocks.blockList[noteLabelBlock].text,
                    z
                );
                that._logo.blocks.blockList[noteLabelBlock].updateCache();
            }

            if (condition === "pitchblocks") {
                var octave = Number(
                    that._octavesWheel.navItems[
                        that._octavesWheel.selectedNavItemIndex
                    ].title
                );

                if (!that._noteBlocks) {
                    that._logo.blocks.blockList[
                        noteLabelBlock
                    ].blocks.setPitchOctave(
                        that._logo.blocks.blockList[noteLabelBlock].connections[0],
                        octave
                    );
                }

                var noteObj = [label, octave];
                if (flag) {
                    noteObj = getNote(
                        label,
                        octave,
                        0,
                        that._logo.keySignature[0],
                        false,
                        null,
                        that._logo.errorMsg,
                        that._logo.synth.inTemperament
                    );
                }
                that.rowLabels[index] = noteObj[0];
                that.rowArgs[index] = noteObj[1];
            } else if (condition === "drumblocks") {
                that.rowLabels[index] = label;
            }

            var cell = that._headcols[index];
            var drumName = getDrumName(that.rowLabels[index]);
            const BELLSETIDX = {
                C: 1,
                D: 2,
                E: 3,
                F: 4,
                G: 5,
                A: 6,
                B: 7,
                do: 1,
                re: 2,
                mi: 3,
                fa: 4,
                sol: 5,
                la: 6,
                ti: 7
            };
            var noteName = that.rowLabels[index];
            var w = window.innerWidth;
            var iconSize = ICONSIZE * (w / 1200);
            if (drumName != null) {
                cell.innerHTML =
                    '&nbsp;&nbsp;<img src="' +
                    getDrumIcon(drumName) +
                    '" title="' +
                    _(drumName) +
                    '" alt="' +
                    _(drumName) +
                    '" height="' +
                    iconSize +
                    '" width="' +
                    iconSize +
                    '" vertical-align="middle">&nbsp;&nbsp;';
            } else if (noteName in BELLSETIDX && that.rowArgs[index] === 4) {
                cell.innerHTML =
                    '<img src="' +
                    "images/8_bellset_key_" +
                    BELLSETIDX[noteName] +
                    ".svg" +
                    '" width="' +
                    cell.style.width +
                    '" vertical-align="middle">';
            } else if (noteName === "C" && that.rowArgs[index] === 5) {
                cell.innerHTML =
                    '<img src="' +
                    "images/8_bellset_key_8.svg" +
                    '" width="' +
                    cell.style.width +
                    '" vertical-align="middle">';
            }

            cell = that._labelcols[index];
            if (drumName != null) {
                cell.innerHTML = _(drumName);
                cell.style.fontSize = Math.floor(this._cellScale * 14) + "px";
            } else if (
                noteIsSolfege(that.rowLabels[i]) &&
                that._logo.synth.inTemperament !== "custom"
            ) {
                cell.innerHTML =
                    i18nSolfege(that.rowLabels[index]) +
                    that.rowArgs[index].toString().sub();
                var noteObj = getNote(
                    that.rowLabels[index],
                    that.rowArgs[index],
                    0,
                    that._logo.keySignature[0],
                    false,
                    null,
                    that._logo.errorMsg,
                    that._logo.synth.inTemperament
                );
            } else {
                cell.innerHTML =
                    that.rowLabels[index] +
                    that.rowArgs[index].toString().sub();
                var noteObj = [that.rowLabels[index], that.rowArgs[index]];
            }

            var noteStored = null;
            if (condition === "pitchblocks") {
                noteStored = noteObj[0] + noteObj[1];
            } else if (condition === "drumblocks") {
                noteStored = drumName;
            }

            that._noteStored[index] = noteStored;
        };

        var __pitchPreview = function() {
            var label =
                that._pitchWheel.navItems[that._pitchWheel.selectedNavItemIndex]
                    .title;
            var timeout = 0;
            if (condition === "pitchblocks") {
                var attr =
                    that._accidentalsWheel.navItems[
                        that._accidentalsWheel.selectedNavItemIndex
                    ].title;
                if (attr !== "♮") {
                    label += attr;
                }
                var octave = Number(
                    that._octavesWheel.navItems[
                        that._octavesWheel.selectedNavItemIndex
                    ].title
                );
                var obj = getNote(
                    label,
                    octave,
                    0,
                    that._logo.keySignature[0],
                    false,
                    null,
                    that._logo.errorMsg,
                    that._logo.synth.inTemperament
                );
                obj[0] = obj[0].replace(SHARP, '#').replace(FLAT, 'b');
                that._logo.synth.setMasterVolume(PREVIEWVOLUME);
                that._logo.setSynthVolume(0, DEFAULTVOICE, PREVIEWVOLUME);
                that._logo.synth.trigger(
                    0,
                    [obj[0] + obj[1]],
                    1 / 8,
                    DEFAULTVOICE,
                    null,
                    null
                );
            } else if (condition === "drumblocks") {
                if (
                    that._logo.instrumentNames[0] === undefined ||
                    that._logo.instrumentNames[0].indexOf(label) === -1
                ) {
                    if (that._logo.instrumentNames[0] === undefined) {
                        that._logo.instrumentNames[0] = [];
                    }

                    that._logo.instrumentNames[0].push(label);
                    if (label === DEFAULTVOICE) {
                        that._logo.synth.createDefaultSynth(0);
                    }

                    that._logo.synth.loadSynth(0, label);
                    // give the synth time to load
                    var timeout = 500;
                } else {
                    var timeout = 0;
                }

                setTimeout(function() {
                    that._logo.synth.setMasterVolume(DEFAULTVOLUME);
                    that._logo.setSynthVolume(0, label, DEFAULTVOLUME);
                    that._logo.synth.trigger(
                        0,
                        "G4",
                        1 / 4,
                        label,
                        null,
                        null,
                        false
                    );
                    that._logo.synth.start();
                }, timeout);
            }
            __selectionChanged();
        };

        for (var i = 0; i < noteLabels.length; i++) {
            this._pitchWheel.navItems[i].navigateFunction = __pitchPreview;
        }
        if (condition === "pitchblocks") {
            for (var i = 0; i < accidentals.length; i++) {
                this._accidentalsWheel.navItems[i]
                    .navigateFunction = __pitchPreview;
            }

            for (var i = 0; i < 8; i++) {
                this._octavesWheel.navItems[i]
                    .navigateFunction = __pitchPreview;
            }
        }
    };

    this._blockReplace = function(oldblk, newblk) {
        // Find the connections from the old block
        var c0 = this._logo.blocks.blockList[oldblk].connections[0];
        var c1 = last(this._logo.blocks.blockList[oldblk].connections);

        // Connect the new block
        this._logo.blocks.blockList[newblk].connections[0] = c0;
        this._logo.blocks.blockList[newblk].connections[
            this._logo.blocks.blockList[newblk].connections.length - 1
        ] = c1;

        if (c0 != null) {
            for (
                var i = 0;
                i < this._logo.blocks.blockList[c0].connections.length;
                i++
            ) {
                if (this._logo.blocks.blockList[c0].connections[i] === oldblk) {
                    this._logo.blocks.blockList[c0].connections[i] = newblk;
                    break;
                }
            }

            // Look for a containing clamp, which may need to be resized.
            var blockAbove = c0;
            while (blockAbove !== this.blockNo) {
                if (this._logo.blocks.blockList[blockAbove].isClampBlock()) {
                    this._logo.blocks.clampBlocksToCheck.push([blockAbove, 0]);
                }

                blockAbove = this._logo.blocks.blockList[blockAbove]
                    .connections[0];
            }

            this._logo.blocks.clampBlocksToCheck.push([this.blockNo, 0]);
        }

        if (c1 != null) {
            for (
                var i = 0;
                i < this._logo.blocks.blockList[c1].connections.length;
                i++
            ) {
                if (this._logo.blocks.blockList[c1].connections[i] === oldblk) {
                    this._logo.blocks.blockList[c1].connections[i] = newblk;
                    break;
                }
            }
        }

        // Refresh the dock positions
        this._logo.blocks.adjustDocks(c0, true);

        // Send the old block to the trash
        this._logo.blocks.blockList[oldblk].connections[0] = null;
        this._logo.blocks.blockList[oldblk].connections[
            this._logo.blocks.blockList[oldblk].connections.length - 1
        ] = null;
        this._logo.blocks.sendStackToTrash(this._logo.blocks.blockList[oldblk]);

        this._logo.refreshCanvas();
    };

    this._addNotesBlockBetween = function(aboveBlock, block, topBlock) {
        if (topBlock) {
            var belowBlock = this._logo.blocks.blockList[aboveBlock]
                .connections[1];
            this._logo.blocks.blockList[aboveBlock].connections[1] = block;
        } else {
            var belowBlock = last(
                this._logo.blocks.blockList[aboveBlock].connections
            );
            this._logo.blocks.blockList[aboveBlock].connections[
                this._logo.blocks.blockList[aboveBlock].connections.length - 1
            ] = block;
        }

        this._logo.blocks.blockList[belowBlock].connections[0] = block;
        this._logo.blocks.blockList[block].connections[0] = aboveBlock;
        this._logo.blocks.blockList[block].connections[
            this._logo.blocks.blockList[block].connections.length - 1
        ] = belowBlock;
        this._logo.blocks.adjustDocks(this.blockNo, true);
        this._logo.blocks.clampBlocksToCheck.push([this.blockNo, 0]);
        this._logo.blocks.refreshCanvas();
    };

    this._removePitchBlock = function(blockNo) {
        var c0 = this._logo.blocks.blockList[blockNo].connections[0];
        var c1 = last(this._logo.blocks.blockList[blockNo].connections);
        this._logo.blocks.blockList[c0].connections[
            this._logo.blocks.blockList[c0].connections.length - 1
        ] = c1;
        this._logo.blocks.blockList[c1].connections[0] = c0;

        this._logo.blocks.blockList[blockNo].connections[
            this._logo.blocks.blockList[blockNo].connections.length - 1
        ] = null;
        this._logo.blocks.sendStackToTrash(
            this._logo.blocks.blockList[blockNo]
        );
        this._logo.blocks.adjustDocks(this.blockNo, true);
        this._logo.blocks.clampBlocksToCheck.push([this.blockNo, 0]);
        this._logo.blocks.refreshCanvas();
    };

    this._generateDataURI = function(file) {
        var data = "data: text/html;charset=utf-8, " + encodeURIComponent(file);
        return data;
    };

    this._sort = function() {
        if (this.sorted) {
            console.debug("already sorted");
            return;
        }

        // Keep track of marked cells.
        this._markedColsInRow = [];
        for (var r = 0; r < this.rowLabels.length; r++) {
            var thisRow = [];
            var row = this._rows[r];
            var n = row.cells.length;
            for (var i = 0; i < n; i++) {
                var cell = row.cells[i];
                if (cell.style.backgroundColor === "black") {
                    thisRow.push(i);
                }
            }
            this._markedColsInRow.push(thisRow);
        }

        var sortableList = [];
        // Make a list to sort, skipping drums and graphics.
        // frequency;label;arg;row index
        for (var i = 0; i < this.rowLabels.length; i++) {
            if (this.rowLabels[i].toLowerCase() === "rest") {
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
            if (MATRIXSYNTHS.indexOf(this.rowLabels[i]) !== -1) {
                // Deprecated
                sortableList.push([
                    this.rowArgs[i],
                    this.rowLabels[i],
                    this.rowArgs[i],
                    i,
                    this._noteStored[i]
                ]);
            } else {
                sortableList.push([
                    noteToFrequency(
                        this.rowLabels[i] + this.rowArgs[i],
                        this._logo.keySignature[0]
                    ),
                    this.rowLabels[i],
                    this.rowArgs[i],
                    i,
                    this._noteStored[i]
                ]);
            }
        }

        // Add the stuff we didn't sort.
        for (var i = 0; i < this.rowLabels.length; i++) {
            var drumName = getDrumName(this.rowLabels[i]);
            if (drumName != null) {
                var drumIndex = getDrumIndex(this.rowLabels[i]);
                sortableList.push([
                    -drumIndex,
                    this.rowLabels[i],
                    this.rowArgs[i],
                    i,
                    this._noteStored[i]
                ]);
            }
        }

        for (var i = 0; i < this.rowLabels.length; i++) {
            if (MATRIXGRAPHICS.indexOf(this.rowLabels[i]) !== -1) {
                var gi = MATRIXGRAPHICS.indexOf(this.rowLabels[i]) + 100;
                sortableList.push([
                    -gi,
                    this.rowLabels[i],
                    this.rowArgs[i],
                    i,
                    this._noteStored[i]
                ]);
            } else if (MATRIXGRAPHICS2.indexOf(this.rowLabels[i]) !== -1) {
                var gi = MATRIXGRAPHICS.indexOf(this.rowLabels[i]) + 200;
                sortableList.push([
                    -gi,
                    this.rowLabels[i],
                    this.rowArgs[i],
                    i,
                    this._noteStored[i]
                ]);
            }
        }

        var sortedList = sortableList.sort(function(a, b) {
            return a[0] - b[0];
        });

        // Reverse since we start from the top of the table.
        sortedList = sortedList.reverse();

        this.rowLabels = [];
        this.rowArgs = [];
        this._sortedRowMap = [];

        // Build a table to map back to original order.
        this._rowMapper = [];
        for (var i = 0; i < sortedList.length; i++) {
            this._rowMapper.push(sortedList[i][3]);
        }
        var newColumnBlockMap = [];
        var oldColumnBlockMap = this.columnBlocksMap;
        for (var i = 0; i < this._rowMapper.length; i++) {
            newColumnBlockMap.push(this.columnBlocksMap[this._rowMapper[i]]);
        }
        this.columnBlocksMap = newColumnBlockMap;
        var lastObj = 0;

        for (var i = 0; i < sortedList.length; i++) {
            var obj = sortedList[i];

            this._rowMap[obj[3]] = i;
            this._noteStored[i] = obj[4];

            if (i === 0) {
                this._sortedRowMap.push(0);
            } else if (i > 0 && obj[1] === last(this.rowLabels)) {
                console.debug(
                    "skipping " + obj[1] + " " + last(this.rowLabels)
                );
                this._sortedRowMap.push(last(this._sortedRowMap));
                if (oldColumnBlockMap[sortedList[lastObj][3]] != undefined) {
                    setTimeout(
                        this._removePitchBlock(
                            oldColumnBlockMap[sortedList[lastObj][3]][0]
                        ),
                        500
                    );
                    this.columnBlocksMap = this.columnBlocksMap.filter(function(
                        ele
                    ) {
                        return (
                            ele[0] !== oldColumnBlockMap[sortedList[lastObj][3]][0]
                        );
                    });
                    lastObj = i;
                }
                // skip duplicates
                for (var j = this._rowMap[i]; j < this._rowMap.length; j++) {
                    this._rowOffset[j] -= 1;
                }

                this._rowMap[i] = this._rowMap[i - 1];
                continue;
            } else {
                console.debug("pushing " + obj[1] + " " + last(this.rowLabels));
                this._sortedRowMap.push(last(this._sortedRowMap) + 1);
                lastObj = i;
            }
            console.debug(obj, typeof obj[2]);

            this.rowLabels.push(obj[1]);
            this.rowArgs.push(Number(obj[2]));
        }

        this._matrixHasTuplets = false; // Force regeneration of tuplet rows.
        this.sorted = true;
        this.init(this._logo);
        this.sorted = true;

        for (var i = 0; i < this._logo.tupletRhythms.length; i++) {
            switch (this._logo.tupletRhythms[i][0]) {
                case "simple":
                case "notes":
                    var tupletParam = [
                        this._logo.tupletParams[this._logo.tupletRhythms[i][1]]
                    ];
                    tupletParam.push([]);
                    for (
                        var j = 2;
                        j < this._logo.tupletRhythms[i].length;
                        j++
                    ) {
                        tupletParam[1].push(this._logo.tupletRhythms[i][j]);
                    }

                    this.addTuplet(tupletParam);
                    break;
                default:
                    this.addNotes(
                        this._logo.tupletRhythms[i][1],
                        this._logo.tupletRhythms[i][2]
                    );
                    break;
            }
        }

        this.makeClickable();
    };

    this._export = function() {
        var exportWindow = window.open("");
        console.debug(exportWindow);
        var exportDocument = exportWindow.document;
        if (exportDocument === undefined) {
            console.debug("Could not create export window");
            return;
        }

        var title = exportDocument.createElement("title");
        title.innerHTML = "Music Matrix";
        exportDocument.head.appendChild(title);

        var w = exportDocument.createElement("H3");
        w.innerHTML = "Music Matrix";

        exportDocument.body.appendChild(w);

        var x = exportDocument.createElement("TABLE");
        x.setAttribute("id", "exportTable");
        x.style.textAlign = "center";

        exportDocument.body.appendChild(x);

        var exportTable = exportDocument.getElementById("exportTable");

        var header = exportTable.createTHead();

        for (var i = 0; i < this.rowLabels.length; i++) {
            var exportRow = header.insertRow();
            // Add the row label...
            var exportLabel = exportRow.insertCell();

            var drumName = getDrumName(this.rowLabels[i]);
            if (drumName != null) {
                exportLabel.innerHTML = _(drumName);
                exportLabel.style.fontSize =
                    Math.floor(this._cellScale * 14) + "px";
            } else if (this.rowLabels[i].slice(0, 4) === "http") {
                exportLabel.innerHTML = this.rowLabels[i];
                exportLabel.style.fontSize =
                    Math.floor(this._cellScale * 14) + "px";
            } else if (MATRIXSYNTHS.indexOf(this.rowLabels[i]) !== -1) {
                exportLabel.innerHTML = this.rowArgs[i];
                exportLabel.style.fontSize =
                    Math.floor(this._cellScale * 14) + "px";
            } else if (MATRIXGRAPHICS.indexOf(this.rowLabels[i]) !== -1) {
                var blockLabel = this._logo.blocks.protoBlockDict[
                    this.rowLabels[i]
                ]["staticLabels"][0];
                exportLabel.innerHTML = blockLabel + "<br>" + this.rowArgs[i];
                exportLabel.style.fontSize =
                    Math.floor(this._cellScale * 12) + "px";
            } else if (MATRIXGRAPHICS2.indexOf(this.rowLabels[i]) !== -1) {
                var blockLabel = this._logo.blocks.protoBlockDict[
                    this.rowLabels[i]
                ]["staticLabels"][0];
                exportLabel.innerHTML =
                    blockLabel +
                    "<br>" +
                    this.rowArgs[i][0] +
                    " " +
                    this.rowArgs[i][1];
                exportLabel.style.fontSize =
                    Math.floor(this._cellScale * 12) + "px";
            } else {
                if (noteIsSolfege(this.rowLabels[i])) {
                    exportLabel.innerHTML =
                        i18nSolfege(this.rowLabels[i]) +
                        this.rowArgs[i].toString().sub();
                } else {
                    exportLabel.innerHTML =
                        this.rowLabels[i] + this.rowArgs[i].toString().sub();
                }
            }

            // Add then the note cells.
            for (var j = 0, col; (col = this._rows[i].cells[j]); j++) {
                var exportCell = exportRow.insertCell();
                exportCell.style.backgroundColor = col.style.backgroundColor;
                exportCell.innerHTML = col.innerHTML;
                exportCell.width = col.width;
                if (exportCell.width == "") {
                    exportCell.width = col.style.width;
                }
                exportCell.colSpan = col.colSpan;
                exportCell.style.minWidth = col.style.width;
                exportCell.style.maxWidth = col.style.width;
                exportCell.height = 30 + "px";
                exportCell.style.fontSize = 14 + "px";
                exportCell.style.padding = 1 + "px";
            }
        }

        if (this._matrixHasTuplets) {
            // Add the tuplet note value row.
            var exportRow = header.insertRow();
            var exportLabel = exportRow.insertCell();
            exportLabel.innerHTML = _("note value");
            var noteValueRow = this._tupletNoteValueRow;
            for (var i = 0; i < noteValueRow.cells.length; i++) {
                var exportCell = exportRow.insertCell();
                var col = noteValueRow.cells[i];
                exportCell.style.backgroundColor = col.style.backgroundColor;
                exportCell.innerHTML = col.innerHTML;
                exportCell.width = col.width;
                if (exportCell.width == "") {
                    exportCell.width = col.style.width;
                }
                exportCell.colSpan = col.colSpan;
                exportCell.style.minWidth = col.style.width;
                exportCell.style.maxWidth = col.style.width;
                exportCell.style.fontSize = 14 + "px";
                exportCell.style.padding = 1 + "px";
            }

            // Add the tuplet value row.
            var exportRow = header.insertRow();
            var exportLabel = exportRow.insertCell();
            exportLabel.innerHTML = _("tuplet value");
            var noteValueRow = this._tupletValueRow;
            for (var i = 0; i < noteValueRow.cells.length; i++) {
                var exportCell = exportRow.insertCell();
                var col = noteValueRow.cells[i];
                exportCell.style.backgroundColor = col.style.backgroundColor;
                exportCell.innerHTML = col.innerHTML;
                exportCell.width = col.width;
                if (exportCell.width == "") {
                    exportCell.width = col.style.width;
                }
                exportCell.colSpan = col.colSpan;
                exportCell.style.minWidth = col.style.width;
                exportCell.style.maxWidth = col.style.width;
                exportCell.style.fontSize = 14 + "px";
                exportCell.style.padding = 1 + "px";
            }
        }

        // Add the note value row.
        var exportRow = header.insertRow();
        var exportLabel = exportRow.insertCell();
        exportLabel.innerHTML = _("note value");
        var noteValueRow = this._noteValueRow;
        for (var i = 0; i < noteValueRow.cells.length; i++) {
            var exportCell = exportRow.insertCell();
            var col = noteValueRow.cells[i];
            exportCell.style.backgroundColor = col.style.backgroundColor;
            exportCell.innerHTML = col.innerHTML;
            exportCell.width = col.width;
            if (exportCell.width == "") {
                exportCell.width = col.style.width;
            }
            exportCell.colSpan = col.colSpan;
            exportCell.style.minWidth = col.style.width;
            exportCell.style.maxWidth = col.style.width;
            exportCell.style.fontSize = 14 + "px";
            exportCell.style.padding = 1 + "px";
        }

        var saveDocument = exportDocument;
        var uriData = saveDocument.documentElement.outerHTML;
        exportDocument.body.innerHTML +=
            '<br><a id="downloadb1" style="background: #C374E9;' +
            "border-radius: 5%;" +
            "padding: 0.3em;" +
            "text-decoration: none;" +
            "margin: 0.5em;" +
            'color: white;" ' +
            "download>Download Matrix</a>";
        exportDocument.getElementById("downloadb1").download = "MusicMatrix";
        exportDocument.getElementById(
            "downloadb1"
        ).href = this._generateDataURI(uriData);
        exportDocument.close();
    };

    // Deprecated
    this.note2Solfege = function(note, index) {
        if (["♭", "♯"].indexOf(note[1]) === -1) {
            var octave = note[1];
            var newNote = SOLFEGECONVERSIONTABLE[note[0]];
        } else {
            var octave = note[2];
            var newNote = SOLFEGECONVERSIONTABLE[note.substr(0, 2)];
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
        var ptmTable = docById("ptmTable");

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

        var noteValue = param[0][1] / param[0][0];
        // The tuplet is note value is calculated as #notes x note value
        var noteValueToDisplay = calcNoteValueToDisplay(
            param[0][1],
            param[0][0],
            this._cellScale
        );

        // Set the cells to 'rest'
        for (var i = 0; i < numberOfNotes; i++) {
            // The tuplet time factor * percentage of the tuplet that
            // is dedicated to this note
            this._notesToPlay.push([
                ["R"],
                (totalNoteInterval * param[0][1]) / (32 / param[1][i])
            ]);
            this._outputAsTuplet.push([numberOfNotes, noteValue]);
        }

        // First, ensure that the matrix is set up for tuplets.
        if (!this._matrixHasTuplets) {
            var firstRow = this._rows[0];

            // Load the labels
            let labelCell;
            labelCell = this._tupletNoteLabel;
            labelCell.innerHTML = _("note value");
            labelCell.style.fontSize = this._cellScale * 75 + "%";
            labelCell.style.height =
                Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + "px";
            labelCell.style.width =
                Math.floor(2 * MATRIXSOLFEWIDTH * this._cellScale) + "px";
            labelCell.style.minWidth = labelCell.style.width;
            labelCell.style.maxWidth = labelCell.style.width;
            labelCell.style.backgroundColor = platformColor.labelColor;

            labelCell = this._tupletValueLabel;
            labelCell.innerHTML = _("tuplet value");
            labelCell.style.fontSize = this._cellScale * 75 + "%";
            labelCell.style.height =
                Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + "px";
            labelCell.style.width =
                Math.floor(2 * MATRIXSOLFEWIDTH * this._cellScale) + "px";
            labelCell.style.minWidth = labelCell.style.width;
            labelCell.style.maxWidth = labelCell.style.width;
            labelCell.style.backgroundColor = platformColor.labelColor;

            // Fill in the columns in the tuplet note value row up to
            // where the tuplet begins.
            var noteRow = this._tupletNoteValueRow;
            var valueRow = this._tupletValueRow;
            for (var i = 0; i < firstRow.cells.length; i++) {
                var cell = noteRow.insertCell();
                cell.style.backgroundColor = platformColor.tupletBackground;
                cell.style.width = firstRow.cells[i].style.width;
                cell.style.minWidth = firstRow.cells[i].style.minWidth;
                cell.style.maxWidth = firstRow.cells[i].style.maxWidth;
                cell.style.height =
                    Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + "px";

                var cell = valueRow.insertCell();
                cell.style.backgroundColor = platformColor.tupletBackground;
                cell.style.width = firstRow.cells[i].style.width;
                cell.style.minWidth = firstRow.cells[i].style.minWidth;
                cell.style.maxWidth = firstRow.cells[i].style.maxWidth;
                cell.style.height =
                    Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + "px";
            }
        }

        // Now add the tuplet to the matrix.
        var tupletNoteValue = noteValue * tupletValue;

        // Add the tuplet notes
        for (var i = 0; i < numberOfNotes; i++) {
            // Add the notes to the tuplet notes row too.
            // Add cell for tuplet note values
            var noteRow = this._tupletNoteValueRow;
            var cell = noteRow.insertCell(-1);
            var numerator = 32 / param[1][i];
            var thisNoteValue =
                1 / (numerator / (totalNoteInterval / tupletTimeFactor));
            cell.style.backgroundColor = platformColor.tupletBackground;
            cell.style.width = this._noteWidth(thisNoteValue) + "px";
            cell.style.minWidth = cell.style.width;
            cell.style.maxWidth = cell.style.width;
            cell.style.height =
                Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + "px";
            cell.setAttribute("id", 1 / tupletNoteValue);
            cell.style.lineHeight = 60 + "%";
            cell.style.fontSize = this._cellScale * 75 + "%";
            cell.style.textAlign = "center";
            var obj = toFraction(
                numerator / (totalNoteInterval / tupletTimeFactor)
            );
            if (NOTESYMBOLS != undefined && obj[1] in NOTESYMBOLS) {
                cell.innerHTML =
                    obj[0] +
                    "<br>&mdash;<br>" +
                    obj[1] +
                    "<br>" +
                    '<img src="' +
                    NOTESYMBOLS[obj[1]] +
                    '" height=' +
                    (MATRIXSOLFEHEIGHT / 2) * this._cellScale +
                    ">";
            } else {
                cell.innerHTML =
                    obj[0] + "<br>&mdash;<br>" + obj[1] + "<br><br>";
            }

            var cellWidth = cell.style.width;

            // Add the notes to the matrix a la addNote.
            for (var j = 0; j < this.rowLabels.length; j++) {
                // Depending on the row, we choose a different background color.
                if (MATRIXGRAPHICS.indexOf(this.rowLabels[j]) != -1) {
                    cellColor = platformColor.graphicsBackground;
                } else {
                    var drumName = getDrumName(this.rowLabels[j]);
                    if (drumName === null) {
                        cellColor = platformColor.pitchBackground;
                    } else {
                        cellColor = platformColor.drumBackground;
                    }
                }

                var ptmRow = this._rows[j];
                var cell = ptmRow.insertCell();

                cell.setAttribute("cellColor", cellColor);

                cell.style.height =
                    Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + "px";
                // Using the alt attribute to store the note value
                cell.setAttribute("alt", 1 / tupletNoteValue);
                cell.style.width = cellWidth;
                cell.style.minWidth = cell.style.width;
                cell.style.maxWidth = cell.style.width;
                cell.style.backgroundColor = cellColor;

                cell.onmouseover = function() {
                    if (this.style.backgroundColor !== "black") {
                        this.style.backgroundColor =
                            platformColor.selectorSelected;
                    }
                };

                cell.onmouseout = function() {
                    if (this.style.backgroundColor !== "black") {
                        this.style.backgroundColor = this.getAttribute(
                            "cellColor"
                        );
                    }
                };
            }
        }

        // Add the tuplet value as a span
        var valueRow = this._tupletValueRow;
        var cell = valueRow.insertCell();
        cell.colSpan = numberOfNotes;
        cell.style.fontSize = Math.floor(this._cellScale * 75) + "%";
        cell.style.lineHeight = 60 + "%";
        cell.style.width = this._noteWidth(noteValue) + "px";
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height =
            Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + "px";
        cell.style.textAlign = "center";
        cell.innerHTML = tupletValue;
        cell.style.backgroundColor = platformColor.tupletBackground;

        // And a span in the note value column too.
        var noteValueRow = this._noteValueRow;
        var cell = noteValueRow.insertCell();
        cell.colSpan = numberOfNotes;
        cell.style.fontSize = Math.floor(this._cellScale * 75) + "%";
        cell.style.lineHeight = 60 + "%";
        cell.style.width = this._noteWidth(noteValue) + "px";
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height =
            Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + "px";
        cell.style.textAlign = "center";
        cell.innerHTML = noteValueToDisplay;
        cell.style.backgroundColor = platformColor.rhythmcellcolor;
        this._matrixHasTuplets = true;
    };

    this._noteWidth = function(noteValue) {
        return Math.max(
            Math.floor(EIGHTHNOTEWIDTH * (8 / noteValue) * this._cellScale),
            15
        );
    };

    this.addNotes = function(numBeats, noteValue) {
        var noteValueToDisplay = calcNoteValueToDisplay(
            noteValue,
            1,
            this._cellScale
        );

        for (var i = 0; i < numBeats; i++) {
            this._notesToPlay.push([["R"], noteValue]);
            this._outputAsTuplet.push([numBeats, noteValue]);
        }

        var rowCount = this.rowLabels.length - this._rests;

        for (var j = 0; j < numBeats; j++) {
            for (var i = 0; i < rowCount; i++) {
                // Depending on the row, we choose a different background color.
                if (
                    MATRIXGRAPHICS.indexOf(this.rowLabels[i]) != -1 ||
                    MATRIXGRAPHICS2.indexOf(this.rowLabels[i]) != -1
                ) {
                    cellColor = platformColor.graphicsBackground;
                } else {
                    var drumName = getDrumName(this.rowLabels[i]);
                    if (drumName === null) {
                        cellColor = platformColor.pitchBackground;
                    } else {
                        cellColor = platformColor.drumBackground;
                    }
                }

                // the buttons get add to the embedded table
                var row = this._rows[i];
                var cell = row.insertCell();

                cell.setAttribute("cellColor", cellColor);
                cell.style.borderRadius = "6px";
                cell.style.height =
                    Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + "px";
                cell.style.width = this._noteWidth(noteValue) + "px";
                cell.style.minWidth = cell.style.width;
                cell.style.maxWidth = cell.style.width;
                cell.style.backgroundColor = cellColor;
                // Using the alt attribute to store the note value
                cell.setAttribute("alt", 1 / noteValue);

                cell.onmouseover = function() {
                    if (this.style.backgroundColor !== "black") {
                        this.style.backgroundColor =
                            platformColor.selectorSelected;
                    }
                };

                cell.onmouseout = function() {
                    if (this.style.backgroundColor !== "black") {
                        this.style.backgroundColor = this.getAttribute(
                            "cellColor"
                        );
                    }
                };
            }

            // Add a note value.
            var row = this._noteValueRow;
            var cell = row.insertCell();
            cell.style.width = this._noteWidth(noteValue) + "px";
            cell.style.minWidth = cell.style.width;
            cell.style.maxWidth = cell.style.width;
            cell.style.height =
                Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + "px";
            cell.style.fontSize = Math.floor(this._cellScale * 75) + "%";
            cell.style.lineHeight = 60 + "%";
            cell.style.textAlign = "center";
            cell.innerHTML = noteValueToDisplay;
            cell.style.backgroundColor = platformColor.rhythmcellcolor;
            cell.setAttribute("alt", noteValue);

            if (this._matrixHasTuplets) {
                // We may need to insert some blank cells in the extra rows
                // added by tuplets.
                var row = this._tupletNoteValueRow;
                var cell = row.insertCell();
                cell.style.width = this._noteWidth(noteValue) + "px";
                cell.style.minWidth = cell.style.width;
                cell.style.maxWidth = cell.style.width;
                cell.height =
                    Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) +
                    "px";
                cell.style.height =
                    Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) +
                    "px";
                cell.style.backgroundColor = platformColor.tupletBackground;

                var row = this._tupletValueRow;
                var cell = row.insertCell();
                cell.style.width = this._noteWidth(noteValue) + "px";
                cell.style.minWidth = cell.style.width;
                cell.style.maxWidth = cell.style.width;
                cell.height =
                    Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) +
                    "px";
                cell.style.height =
                    Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) +
                    "px";
                cell.style.backgroundColor = platformColor.tupletBackground;
            }
        }
    };

    this._lookForNoteBlocksOrRepeat = function() {
        this._noteBlocks = false;
        var blk = this._logo.blocks.blockList[this.blockNo];

        // Implement Breadth First Search from corresponding
        // matrix (phrase maker) block, by looking into their
        // child connections.
        var queue = [ blk ];
        while (queue.length != 0) {
            var pop = queue.shift();
            if (pop.name === "newnote" || pop.name === "repeat") {
                console.debug("FOUND A NOTE OR REPEAT BLOCK.");
                this._noteBlocks = true;
                break;
            }

            var conn = pop.connections.slice(1);
            for (var i = 0; i < conn.length; i++) {
                if (conn[i] != null) {
                    var curr = this._logo.blocks.blockList[conn[i]];
                    queue.push(curr);
                }
            }
        }
    };

    this._syncMarkedBlocks = function() {
        var newBlockMap = [];
        for (var i = 0; i < this._blockMap.length; i++) {
            if (this._blockMap[i][0] === -1) {
                continue;
            }

            for (var j = 0; j < this._blockMapHelper.length; j++) {
                if (
                    JSON.stringify(this._blockMap[i][1]) ===
                    JSON.stringify(this._blockMapHelper[j][0])
                ) {
                    for (
                        var k = 0;
                        k < this._blockMapHelper[j][1].length;
                        k++
                    ) {
                        newBlockMap.push([
                            this._blockMap[i][0],
                            this._colBlocks[this._blockMapHelper[j][1][k]],
                            this._blockMap[i][2]
                        ]);
                    }
                }
            }
        }

        this._blockMap = newBlockMap.filter((el, i) => {
            return (
                i ===
                newBlockMap.findIndex(ele => {
                    return JSON.stringify(ele) === JSON.stringify(el);
                })
            );
        });
    };

    this.blockConnection = function(len, bottomOfClamp) {
        var n = this._logo.blocks.blockList.length - len;
        if (bottomOfClamp == null) {
            this._logo.blocks.blockList[this.blockNo].connections[2] = n;
            this._logo.blocks.blockList[n].connections[0] = this.blockNo;
        } else {
            var c =
                this._logo.blocks.blockList[bottomOfClamp].connections.length -
                1;
            this._logo.blocks.blockList[bottomOfClamp].connections[c] = n;
            this._logo.blocks.blockList[n].connections[0] = bottomOfClamp;
        }

        this._logo.blocks.clampBlocksToCheck.push([this.blockNo, 0]);
        this._logo.blocks.adjustDocks(this.blockNo, true);
    };

    this._deleteRhythmBlock = function(blockToDelete) {
        if (
            last(this._logo.blocks.blockList[blockToDelete].connections) !==
            null
        ) {
            this._logo.blocks.sendStackToTrash(
                this._logo.blocks.blockList[
                    last(this._logo.blocks.blockList[blockToDelete].connections)
                ]
            );
        }
        this._logo.blocks.sendStackToTrash(
            this._logo.blocks.blockList[blockToDelete]
        );
        this._logo.blocks.adjustDocks(this.blockNo, true);
        this._logo.blocks.refreshCanvas();
    };

    this._addRhythmBlock = function(value, times) {
        var RHYTHMOBJ = [];
        value = toFraction(value);
        var topOfClamp = this._logo.blocks.blockList[this.blockNo]
            .connections[1];
        var bottomOfClamp = this._logo.blocks.findBottomBlock(topOfClamp);
        if (this._logo.blocks.blockList[bottomOfClamp].name === "vspace") {
            RHYTHMOBJ = [
                [0, ["rhythm2", {}], 0, 0, [null, 1, 2, 5]],
                [1, ["number", { value: times }], 0, 0, [0]],
                [2, ["divide", {}], 0, 0, [0, 3, 4]],
                [3, ["number", { value: value[1] }], 0, 0, [2]],
                [4, ["number", { value: value[0] }], 0, 0, [2]],
                [5, ["vspace", {}], 0, 0, [0, null]]
            ];
        } else {
            RHYTHMOBJ = [
                [0, "vspace", 0, 0, [null, 1]],
                [1, ["rhythm2", {}], 0, 0, [0, 2, 3, 6]],
                [2, ["number", { value: times }], 0, 0, [1]],
                [3, ["divide", {}], 0, 0, [1, 4, 5]],
                [4, ["number", { value: value[1] }], 0, 0, [3]],
                [5, ["number", { value: value[0] }], 0, 0, [3]],
                [6, ["vspace", {}], 0, 0, [1, null]]
            ];
        }
        this._logo.blocks.loadNewBlocks(RHYTHMOBJ);
        var that = this;
        if (this._logo.blocks.blockList[bottomOfClamp].name === "vspace") {
            setTimeout(that.blockConnection(6, bottomOfClamp), 500);
        } else {
            setTimeout(that.blockConnection(7, bottomOfClamp), 500);
        }
        this._logo.blocks.refreshCanvas();
    };

    this._update = function(i, value, k, noteCase) {
        var updates = [];
        value = toFraction(value);
        if (noteCase === "tupletnote") {
            updates.push(
                this._logo.blocks.blockList[
                    this._logo.blocks.blockList[i].connections[1]
                ].connections[1]
            );
            updates.push(
                this._logo.blocks.blockList[
                    this._logo.blocks.blockList[i].connections[1]
                ].connections[2]
            );
        } else {
            updates.push(
                this._logo.blocks.blockList[
                    this._logo.blocks.blockList[i].connections[2]
                ].connections[1]
            );
            updates.push(
                this._logo.blocks.blockList[
                    this._logo.blocks.blockList[i].connections[2]
                ].connections[2]
            );
        }
        if (noteCase === "rhythm" || noteCase === "stupletvalue") {
            updates.push(this._logo.blocks.blockList[i].connections[1]);
            this._logo.blocks.blockList[updates[2]].value = parseFloat(k);
            this._logo.blocks.blockList[updates[2]].text.text = k.toString();
            this._logo.blocks.blockList[updates[2]].updateCache();
        }
        if (
            noteCase === "rhythm" ||
            noteCase === "stuplet" ||
            (noteCase === "tupletnote" && value !== null)
        ) {
            this._logo.blocks.blockList[updates[0]].value = parseFloat(
                value[1]
            );
            this._logo.blocks.blockList[
                updates[0]
            ].text.text = value[1].toString();
            this._logo.blocks.blockList[updates[0]].updateCache();
            this._logo.blocks.blockList[updates[1]].value = parseFloat(
                value[0]
            );
            this._logo.blocks.blockList[
                updates[1]
            ].text.text = value[0].toString();
            this._logo.blocks.blockList[updates[1]].updateCache();
            this._logo.refreshCanvas();
        }
        saveLocally();
    };

    this._mapNotesBlocks = function(blockName, withName) {
        var notesBlockMap = [];
        var blk = this._logo.blocks.blockList[this.blockNo].connections[1];
        var myBlock = this._logo.blocks.blockList[blk];

        var bottomBlockLoop = 0;
        if (
            myBlock.name === blockName ||
            (blockName === "all" &&
                myBlock.name !== "hidden" &&
                myBlock.name !== "vspace" &&
                myBlock.name !== "hiddennoflow")
        ) {
            if (withName) {
                notesBlockMap.push([blk, myBlock.name]);
            } else {
                notesBlockMap.push(blk);
            }
        }

        while (last(myBlock.connections) != null) {
            bottomBlockLoop += 1;
            if (bottomBlockLoop > 2 * this._logo.blocks.blockList) {
                // Could happen if the block data is malformed.
                console.debug("infinite loop finding bottomBlock?");
                break;
            }

            blk = last(myBlock.connections);
            myBlock = this._logo.blocks.blockList[blk];
            if (
                myBlock.name === blockName ||
                (blockName === "all" &&
                    myBlock.name !== "hidden" &&
                    myBlock.name !== "vspace" &&
                    myBlock.name !== "hiddennoflow")
            ) {
                if (withName) {
                    notesBlockMap.push([blk, myBlock.name]);
                } else {
                    notesBlockMap.push(blk);
                }
            }
        }

        return notesBlockMap;
    };

    this.recalculateBlocks = function() {
        var adjustedNotes = [];
        adjustedNotes.push([this._logo.tupletRhythms[0][2], 1]);
        var startidx = 1;
        for (var i = 1; i < this._logo.tupletRhythms.length; i++) {
            if (this._logo.tupletRhythms[i][2] === last(adjustedNotes)[0]) {
                startidx += 1;
            } else {
                adjustedNotes[adjustedNotes.length - 1][1] = startidx;
                adjustedNotes.push([this._logo.tupletRhythms[i][2], 1]);
                startidx = 1;
            }
        }
        if (startidx > 1) {
            adjustedNotes[adjustedNotes.length - 1][1] = startidx;
        }
        return adjustedNotes;
    };

    this._readjustNotesBlocks = function() {
        var notesBlockMap = this._mapNotesBlocks("rhythm2");
        var adjustedNotes = this.recalculateBlocks();

        var colBlocks = [];
        var n = adjustedNotes.length - notesBlockMap.length;
        if (n >= 0) {
            for (var i = 0; i < notesBlockMap.length; i++) {
                this._update(
                    notesBlockMap[i],
                    adjustedNotes[i][0],
                    adjustedNotes[i][1],
                    "rhythm"
                );
            }
        } else {
            for (var i = 0; i < adjustedNotes.length; i++) {
                this._update(
                    notesBlockMap[i],
                    adjustedNotes[i][0],
                    adjustedNotes[i][1],
                    "rhythm"
                );
            }
        }

        for (var i = 0; i < n; i++) {
            this._addRhythmBlock(
                adjustedNotes[notesBlockMap.length + i][0],
                adjustedNotes[notesBlockMap.length + i][1]
            );
        }
        for (var i = n; i < 0; i++) {
            this._deleteRhythmBlock(notesBlockMap[notesBlockMap.length + i]);
        }
        notesBlockMap = this._mapNotesBlocks("rhythm2");
        for (var i = 0; i < notesBlockMap.length; i++) {
            for (var j = 0; j < adjustedNotes[i][1]; j++) {
                colBlocks.push([notesBlockMap[i], j]);
            }
        }
        this._colBlocks = colBlocks;
    };

    this._restartGrid = function(that) {
        this._matrixHasTuplets = false; // Force regeneration of tuplet rows.
        this.sorted = true;
        this.init(this._logo);
        this.sorted = false;

        for (var i = 0; i < this._logo.tupletRhythms.length; i++) {
            switch (this._logo.tupletRhythms[i][0]) {
                case "simple":
                case "notes":
                    var tupletParam = [this._logo.tupletParams[i]];
                    tupletParam.push([]);
                    for (
                        var j = 2;
                        j < this._logo.tupletRhythms[i].length;
                        j++
                    ) {
                        tupletParam[1].push(this._logo.tupletRhythms[i][j]);
                    }

                    this.addTuplet(tupletParam);
                    break;
                default:
                    this.addNotes(
                        this._logo.tupletRhythms[i][1],
                        this._logo.tupletRhythms[i][2]
                    );
                    break;
            }
        }

        this.makeClickable();
        docById("wheelDivptm").style.display = "none";
        that._menuWheel.removeWheel();
        that._exitWheel.removeWheel();
    };

    this._addNotes = function(that, noteToDivide, notesToAdd) {
        noteToDivide = parseInt(noteToDivide);
        this._blockMapHelper = [];
        for (var i = 0; i <= noteToDivide; i++) {
            this._blockMapHelper.push([this._colBlocks[i], [i]]);
        }
        for (
            var i = noteToDivide + 1;
            i < this._logo.tupletRhythms.length;
            i++
        ) {
            this._blockMapHelper.push([
                this._colBlocks[i],
                [i + parseInt(notesToAdd)]
            ]);
        }
        for (var i = 0; i < parseInt(notesToAdd); i++) {
            this._logo.tupletRhythms = this._logo.tupletRhythms
                .slice(0, noteToDivide + i + 1)
                .concat(this._logo.tupletRhythms.slice(noteToDivide + i));
        }
        this._readjustNotesBlocks();
        this._syncMarkedBlocks();
        this._restartGrid(that);
    };

    this._deleteNotes = function(that, noteToDivide) {
        if (this._logo.tupletRhythms.length === 1) {
            return;
        }
        noteToDivide = parseInt(noteToDivide);
        this._blockMapHelper = [];
        for (var i = 0; i < noteToDivide; i++) {
            this._blockMapHelper.push([this._colBlocks[i], [i]]);
        }
        for (
            var i = noteToDivide + 1;
            i < this._logo.tupletRhythms.length;
            i++
        ) {
            this._blockMapHelper.push([this._colBlocks[i], [i - 1]]);
        }
        this._logo.tupletRhythms = this._logo.tupletRhythms
            .slice(0, noteToDivide)
            .concat(this._logo.tupletRhythms.slice(noteToDivide + 1));
        this._readjustNotesBlocks();
        this._syncMarkedBlocks();
        this._restartGrid(that);
    };

    this._divideNotes = function(that, noteToDivide, divideNoteBy) {
        noteToDivide = parseInt(noteToDivide);
        this._blockMapHelper = [];
        for (var i = 0; i < noteToDivide; i++) {
            this._blockMapHelper.push([this._colBlocks[i], [i]]);
        }
        this._logo.tupletRhythms = this._logo.tupletRhythms
            .slice(0, noteToDivide)
            .concat([
                [
                    this._logo.tupletRhythms[noteToDivide][0],
                    this._logo.tupletRhythms[noteToDivide][1],
                    this._logo.tupletRhythms[noteToDivide][2] * divideNoteBy
                ]
            ])
            .concat(this._logo.tupletRhythms.slice(noteToDivide + 1));
        this._blockMapHelper.push([this._colBlocks[noteToDivide], []]);
        var j = 0;

        for (var i = 0; i < divideNoteBy - 1; i++) {
            this._logo.tupletRhythms = this._logo.tupletRhythms
                .slice(0, noteToDivide + i + 1)
                .concat(this._logo.tupletRhythms.slice(noteToDivide + i));
            j = noteToDivide + i;
            this._blockMapHelper[noteToDivide][1].push(j);
        }
        j++;
        this._blockMapHelper[noteToDivide][1].push(j);
        for (var i = noteToDivide + 1; i < this._colBlocks.length; i++) {
            j++;
            this._blockMapHelper.push([this._colBlocks[i], [j]]);
        }
        this._readjustNotesBlocks();
        this._syncMarkedBlocks();
        this._restartGrid(that);
    };

    this._tieNotes = function(mouseDownCell, mouseUpCell) {
        var downCellId = null;
        var upCellId = null;
        if (mouseDownCell.id < mouseUpCell.id) {
            downCellId = mouseDownCell.id;
            upCellId = mouseUpCell.id;
        } else {
            downCellId = mouseUpCell.id;
            upCellId = mouseDownCell.id;
        }

        this._blockMapHelper = [];
        for (var i = 0; i < downCellId; i++) {
            this._blockMapHelper.push([this._colBlocks[i], [i]]);
        }
        var j = i;
        for (var i = downCellId; i <= upCellId; i++) {
            this._blockMapHelper.push([this._colBlocks[i], [j]]);
        }
        j++;
        for (
            var i = parseInt(upCellId) + 1;
            i < this._logo.tupletRhythms.length;
            i++
        ) {
            this._blockMapHelper.push([this._colBlocks[i], [j]]);
            j++;
        }

        var newNote = 0;
        for (var i = downCellId; i <= upCellId; i++) {
            newNote = newNote + 1 / parseFloat(this._logo.tupletRhythms[i][2]);
        }

        this._logo.tupletRhythms = this._logo.tupletRhythms
            .slice(0, downCellId)
            .concat([
                [
                    this._logo.tupletRhythms[downCellId][0],
                    this._logo.tupletRhythms[downCellId][1],
                    1 / newNote
                ]
            ])
            .concat(this._logo.tupletRhythms.slice(parseInt(upCellId) + 1));

        this._readjustNotesBlocks();
        this._syncMarkedBlocks();
        this._restartGrid(that);
    };

    this._updateTuplet = function(that, noteToDivide, newNoteValue, condition) {
        this._logo.tupletParams[noteToDivide][1] = newNoteValue;
        this._restartGrid(that);
        if (condition === "simpletupletnote") {
            var notesBlockMap = this._mapNotesBlocks("stuplet");
            this._update(
                notesBlockMap[noteToDivide],
                newNoteValue,
                0,
                "stuplet"
            );
        } else {
            var notesBlockMap = this._mapNotesBlocks("tuplet4");
            this._update(
                notesBlockMap[noteToDivide],
                newNoteValue,
                0,
                "tupletnote"
            );
        }
    };

    this._updateTupletValue = function(
        that,
        noteToDivide,
        oldTupletValue,
        newTupletValue
    ) {
        noteToDivide = parseInt(noteToDivide);
        oldTupletValue = parseInt(oldTupletValue);
        newTupletValue = parseInt(newTupletValue);
        this._blockMapHelper = [];
        if (oldTupletValue < newTupletValue) {
            var k = 0;
            for (var i = 0; i <= this._logo.tupletRhythms.length; i++) {
                if (i == noteToDivide) {
                    break;
                }
                for (
                    var j = 0;
                    j < this._logo.tupletRhythms[i].length - 2;
                    j++
                ) {
                    this._blockMapHelper.push([this._colBlocks[k], [k]]);
                    k++;
                }
            }
            for (
                var j = 0;
                j < this._logo.tupletRhythms[noteToDivide].length - 2;
                j++
            ) {
                this._blockMapHelper.push([this._colBlocks[k], [k]]);
                k++;
            }
            var l = k;
            k = k + newTupletValue - oldTupletValue;
            for (
                var i = noteToDivide + 1;
                i < this._logo.tupletRhythms.length;
                i++
            ) {
                for (
                    var j = 0;
                    j < this._logo.tupletRhythms[i].length - 2;
                    j++
                ) {
                    this._blockMapHelper.push([this._colBlocks[l], [k]]);
                    l++;
                    k++;
                }
            }

            for (var i = oldTupletValue; i < newTupletValue; i++) {
                this._logo.tupletRhythms[
                    noteToDivide
                ] = this._logo.tupletRhythms[noteToDivide]
                    .slice(0, this._logo.tupletRhythms[noteToDivide].length)
                    .concat(
                        this._logo.tupletRhythms[noteToDivide].slice(
                            this._logo.tupletRhythms[noteToDivide].length - 1
                        )
                    );
            }
        } else {
            var k = 0;
            for (var i = 0; i <= this._logo.tupletRhythms.length; i++) {
                if (i === noteToDivide) {
                    break;
                }
                for (
                    var j = 0;
                    j < this._logo.tupletRhythms[i].length - 2;
                    j++
                ) {
                    this._blockMapHelper.push([this._colBlocks[k], [k]]);
                    k++;
                }
            }

            for (var i = oldTupletValue; i > newTupletValue; i--) {
                this._logo.tupletRhythms[
                    noteToDivide
                ] = this._logo.tupletRhythms[noteToDivide].slice(
                    0,
                    this._logo.tupletRhythms[noteToDivide].length - 1
                );
            }
            for (
                var j = 0;
                j < this._logo.tupletRhythms[noteToDivide].length - 2;
                j++
            ) {
                this._blockMapHelper.push([this._colBlocks[k], [k]]);
                k++;
            }
            var l = k + oldTupletValue - newTupletValue;
            for (
                var i = noteToDivide + 1;
                i < this._logo.tupletRhythms.length;
                i++
            ) {
                for (
                    var j = 0;
                    j < this._logo.tupletRhythms[i].length - 2;
                    j++
                ) {
                    this._blockMapHelper.push([this._colBlocks[l], [k]]);
                    l++;
                    k++;
                }
            }
        }
        var notesBlockMap = this._mapNotesBlocks("stuplet");
        var colBlocks = [];
        for (var i = 0; i < this._logo.tupletRhythms.length; i++) {
            for (var j = 0; j < this._logo.tupletRhythms[i].length - 2; j++) {
                colBlocks.push([notesBlockMap[i], j]);
            }
        }
        this._colBlocks = colBlocks;
        this._restartGrid(that);
        this._syncMarkedBlocks();
        this._update(
            notesBlockMap[noteToDivide],
            null,
            newTupletValue,
            "stupletvalue"
        );
    };

    this._createpiesubmenu = function(noteToDivide, tupletValue, condition) {
        docById("wheelDivptm").style.display = "";

        this._menuWheel = new wheelnav("wheelDivptm", null, 800, 800);
        this._exitWheel = new wheelnav("_exitWheel", this._menuWheel.raphael);

        if (condition === "tupletvalue") {
            var mainTabsLabels = [
                "1",
                "2",
                "3",
                "-",
                "4",
                "5",
                "6",
                "7",
                "8",
                "+",
                "9",
                "10"
            ];
            this.newNoteValue = String(tupletValue);
        } else if (
            condition === "simpletupletnote" ||
            condition === "tupletnote"
        ) {
            mainTabsLabels = [
                "<-",
                "Enter",
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9",
                "10"
            ];
            this.newNoteValue = "/";
        } else if (condition === "rhythmnote") {
            this._tabsWheel = new wheelnav(
                "_tabsWheel",
                this._menuWheel.raphael
            );
            this.newNoteValue = 2;
            mainTabsLabels = [
                "divide",
                "delete",
                "duplicate",
                String(this.newNoteValue)
            ];
        }

        wheelnav.cssMode = true;
        this._menuWheel.keynavigateEnabled = false;
        this._menuWheel.clickModeRotate = false;
        this._menuWheel.colors = platformColor.pitchWheelcolors;
        this._menuWheel.slicePathFunction = slicePath().DonutSlice;
        this._menuWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._menuWheel.sliceSelectedPathCustom = this._menuWheel.slicePathCustom;
        this._menuWheel.sliceInitPathCustom = this._menuWheel.slicePathCustom;
        this._menuWheel.animatetime = 0; // 300;

        this._exitWheel.colors = platformColor.exitWheelcolors;
        this._exitWheel.keynavigateEnabled = false;
        this._exitWheel.clickModeRotate = false;
        this._exitWheel.slicePathFunction = slicePath().DonutSlice;
        this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;
        var exitTabLabel = [];

        if (condition === "tupletvalue") {
            exitTabLabel = ["x", this.newNoteValue];
            this._menuWheel.slicePathCustom.minRadiusPercent = 0.4;
            this._menuWheel.slicePathCustom.maxRadiusPercent = 1;

            this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
            this._exitWheel.slicePathCustom.maxRadiusPercent = 0.4;
        } else if (
            condition === "simpletupletnote" ||
            condition === "tupletnote"
        ) {
            exitTabLabel = ["x", this.newNoteValue];

            this._menuWheel.slicePathCustom.minRadiusPercent = 0.5;
            this._menuWheel.slicePathCustom.maxRadiusPercent = 1;

            this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
            this._exitWheel.slicePathCustom.maxRadiusPercent = 0.5;
        } else if (condition === "rhythmnote") {
            exitTabLabel = ["x", " "];
            var tabsLabels = [
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                ""
            ];
            this._menuWheel.slicePathCustom.minRadiusPercent = 0.2;
            this._menuWheel.slicePathCustom.maxRadiusPercent = 0.7;

            this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
            this._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;

            this._tabsWheel.colors = platformColor.pitchWheelcolors;
            this._tabsWheel.slicePathFunction = slicePath().DonutSlice;
            this._tabsWheel.slicePathCustom = slicePath().DonutSliceCustomization();
            this._tabsWheel.slicePathCustom.minRadiusPercent = 0.7;
            this._tabsWheel.slicePathCustom.maxRadiusPercent = 1;
            this._tabsWheel.sliceSelectedPathCustom = this._tabsWheel.slicePathCustom;
            this._tabsWheel.sliceInitPathCustom = this._tabsWheel.slicePathCustom;
            this._tabsWheel.clickModeRotate = false;
            this._tabsWheel.createWheel(tabsLabels);

            for (var i = 0; i < tabsLabels.length; i++) {
                this._tabsWheel.navItems[i].navItem.hide();
            }
        }

        this._menuWheel.createWheel(mainTabsLabels);
        this._exitWheel.createWheel(exitTabLabel);

        docById("wheelDivptm").style.position = "absolute";
        docById("wheelDivptm").style.height = "250px";
        docById("wheelDivptm").style.width = "250px";

        if (noteToDivide !== null) {
            var ntd = this._noteValueRow.cells[noteToDivide];
            var x = ntd.getBoundingClientRect().x;
            var y = ntd.getBoundingClientRect().y;
        }

        docById("wheelDivptm").style.left =
            Math.min(
                this._logo.blocks.turtles._canvas.width - 200,
                Math.max(0, x * this._logo.blocks.getStageScale())
            ) + "px";
        docById("wheelDivptm").style.top =
            Math.min(
                this._logo.blocks.turtles._canvas.height - 250,
                Math.max(0, y * this._logo.blocks.getStageScale())
            ) + "px";

        var that = this;
        this._exitWheel.navItems[0].navigateFunction = function() {
            docById("wheelDivptm").style.display = "none";
            that._menuWheel.removeWheel();
            that._exitWheel.removeWheel();
        };

        if (condition === "tupletvalue") {
            var __enterValue = function() {
                var i = that._menuWheel.selectedNavItemIndex;
                var value = mainTabsLabels[i];

                that.newNoteValue = String(value);
                docById("wheelnav-_exitWheel-title-1").children[0].textContent =
                    that.newNoteValue;
                that._updateTupletValue(
                    that,
                    noteToDivide,
                    tupletValue,
                    that.newNoteValue
                );
            };

            this._menuWheel.navItems[3].navigateFunction = function() {
                if (that.newNoteValue > 1) {
                    that.newNoteValue = String(parseInt(that.newNoteValue) - 1);
                    docById(
                        "wheelnav-_exitWheel-title-1"
                    ).children[0].textContent = that.newNoteValue;
                    that._updateTupletValue(
                        that,
                        noteToDivide,
                        tupletValue,
                        that.newNoteValue
                    );
                }
            };

            this._menuWheel.navItems[9].navigateFunction = function() {
                that.newNoteValue = String(parseInt(that.newNoteValue) + 1);
                docById("wheelnav-_exitWheel-title-1").children[0].textContent =
                    that.newNoteValue;
                that._updateTupletValue(
                    that,
                    noteToDivide,
                    tupletValue,
                    that.newNoteValue
                );
            };

            for (var i = 0; i < mainTabsLabels.length; i++) {
                if (i === 9 || i == 3) {
                    continue;
                }

                this._menuWheel.navItems[i].navigateFunction = __enterValue;
            }
        } else if (
            condition === "simpletupletnote" ||
            condition === "tupletnote"
        ) {
            var first = false;
            var second = false;

            var __enterValue = function() {
                var i = that._menuWheel.selectedNavItemIndex;
                var value = mainTabsLabels[i];
                if (!first) {
                    that.newNoteValue = String(value) + "/";
                    docById(
                        "wheelnav-_exitWheel-title-1"
                    ).children[0].textContent = that.newNoteValue;
                    first = true;
                } else {
                    if (!second) {
                        that.newNoteValue = that.newNoteValue + String(value);
                        docById(
                            "wheelnav-_exitWheel-title-1"
                        ).children[0].textContent = that.newNoteValue;
                        second = true;
                    }
                }
            };

            this._menuWheel.navItems[0].navigateFunction = function() {
                if (second && first) {
                    var word = that.newNoteValue.split("/");
                    that.newNoteValue = word[0] + "/";
                    docById(
                        "wheelnav-_exitWheel-title-1"
                    ).children[0].textContent = that.newNoteValue;
                    second = false;
                } else if (first) {
                    that.newNoteValue = "/";
                    docById(
                        "wheelnav-_exitWheel-title-1"
                    ).children[0].textContent = that.newNoteValue;
                    first = false;
                }
            };

            this._menuWheel.navItems[1].navigateFunction = function() {
                if (second && first) {
                    var word = that.newNoteValue.split("/");
                    that._updateTuplet(
                        that,
                        noteToDivide,
                        parseInt(word[1]) / parseInt(word[0]),
                        condition
                    );
                }
            };

            for (var i = 2; i < mainTabsLabels.length; i++) {
                this._menuWheel.navItems[i].navigateFunction = __enterValue;
            }
        } else if (condition === "rhythmnote") {
            var flag = 0;
            this._menuWheel.navItems[0].navigateFunction = function() {
                that._divideNotes(that, noteToDivide, that.newNoteValue);
            };

            this._menuWheel.navItems[1].navigateFunction = function() {
                that._deleteNotes(that, noteToDivide);
            };

            this._menuWheel.navItems[2].navigateFunction = function() {
                that._addNotes(that, noteToDivide, that.newNoteValue);
            };

            this._menuWheel.navItems[3].navigateFunction = function() {
                if (!flag) {
                    for (var i = 12; i < 19; i++) {
                        docById(
                            "wheelnav-wheelDivptm-title-3"
                        ).children[0].textContent = that.newNoteValue;
                        that._tabsWheel.navItems[i].navItem.show();
                    }

                    flag = 1;
                } else {
                    for (var i = 12; i < 19; i++) {
                        docById(
                            "wheelnav-wheelDivptm-title-3"
                        ).children[0].textContent = that.newNoteValue;
                        that._tabsWheel.navItems[i].navItem.hide();
                    }

                    flag = 0;
                }
            };

            for (var i = 12; i < 19; i++) {
                this._tabsWheel.navItems[i].navigateFunction = function() {
                    var j = that._tabsWheel.selectedNavItemIndex;
                    that.newNoteValue = tabsLabels[j];
                    docById(
                        "wheelnav-wheelDivptm-title-3"
                    ).children[0].textContent = tabsLabels[j];
                };
            }
        }
    };

    this.makeClickable = function() {
        // Once the entire matrix is generated, this function makes it
        // clickable.
        var rowNote = this._noteValueRow;
        var rowTuplet = this._tupletValueRow;
        for (var j = 0; j < rowNote.cells.length; j++) {
            var cell = rowNote.cells[j];
            cell.setAttribute("id", j);

            var cellTuplet = rowTuplet.cells[j];
            if (cellTuplet !== undefined) {
                cellTuplet.setAttribute("id", j);
            }

            var that = this;

            __mouseDownHandler = function(event) {
                var cell = event.target;
                that._mouseDownCell = cell;
            };

            __mouseUpHandler = function(event) {
                var cell = event.target;
                that._mouseUpCell = cell;
                if (that._mouseDownCell !== that._mouseUpCell) {
                    that._tieNotes(that._mouseDownCell, that._mouseUpCell);
                } else {
                    var nodes = Array.prototype.slice.call(
                        this.parentElement.children
                    );
                    that._createpiesubmenu(
                        nodes.indexOf(this),
                        this.getAttribute("alt"),
                        "rhythmnote"
                    );
                }
            };

            if (cellTuplet !== undefined) {
                if (this._logo.tupletRhythms[0][0] === "notes") {
                    cell.onclick = function() {
                        that._createpiesubmenu(
                            this.getAttribute("id"),
                            null,
                            "tupletnote"
                        );
                    };
                } else {
                    cell.onclick = function() {
                        that._createpiesubmenu(
                            this.getAttribute("id"),
                            null,
                            "simpletupletnote"
                        );
                    };

                    cellTuplet.onclick = function() {
                        that._createpiesubmenu(
                            this.getAttribute("id"),
                            this.getAttribute("colspan"),
                            "tupletvalue"
                        );
                    };
                }
            } else {
                cell.removeEventListener("mousedown", __mouseDownHandler);
                cell.addEventListener("mousedown", __mouseDownHandler);

                cell.removeEventListener("mouseup", __mouseUpHandler);
                cell.addEventListener("mouseup", __mouseUpHandler);
            }
        }

        var rowCount = this.rowLabels.length;

        for (var i = 0; i < rowCount; i++) {
            var row = this._rows[i];
            for (var j = 0; j < row.cells.length; j++) {
                var cell = row.cells[j];
                if (cell.style.backgroundColor === "black") {
                    cell.style.backgroundColor = cell.getAttribute("cellColor");
                    this._setNotes(j, i, false);
                }
            }
        }

        for (var i = 0; i < rowCount; i++) {
            // The buttons get added to the embedded table.
            var row = this._rows[i];
            for (var j = 0; j < row.cells.length; j++) {
                var cell = row.cells[j];
                // Give each clickable cell a unique id
                cell.setAttribute("data-i", i);
                cell.setAttribute("data-j", j);

                var that = this;
                var isMouseDown = false;

                cell.onmousedown = function() {
                    isMouseDown = true;
                    var i = Number(this.getAttribute("data-i"));
                    var j = Number(this.getAttribute("data-j"));
                    if (this.style.backgroundColor === "black") {
                        this.style.backgroundColor = this.getAttribute(
                            "cellColor"
                        );
                        that._notesToPlay[j][0] = ["R"];
                        if (!that._noteBlocks)   that._setNotes(j, i, false);
                    } else {
                        this.style.backgroundColor = "black";
                        if (!that._noteBlocks)   that._setNotes(j, i, true);
                    }
                };

                cell.onmouseover = function() {
                    var i = Number(this.getAttribute("data-i"));
                    var j = Number(this.getAttribute("data-j"));
                    if (isMouseDown) {
                        if (this.style.backgroundColor === "black") {
                            this.style.backgroundColor = this.getAttribute(
                                "cellColor"
                            );
                            that._notesToPlay[j][0] = ["R"];
                            if (!that._noteBlocks)   that._setNotes(j, i, false);
                        } else {
                            this.style.backgroundColor = "black";
                            if (!that._noteBlocks)   that._setNotes(j, i, true);
                        }
                    }
                };

                cell.onmouseup = function() {
                    isMouseDown = false;
                };
            }
        }

        // Mark any cells found in the blockMap from previous
        // instances of the matrix.

        // If we have sorted the rows, we can simply restore the
        // marked blocks.
        if (this.sorted) {
            for (var i = 0; i < this._rowMapper.length; i++) {
                var ii = this._rowMapper[i];
                var r = this._sortedRowMap[i];
                var row = this._rows[r];
                for (var j = 0; j < this._markedColsInRow[ii].length; j++) {
                    var c = this._markedColsInRow[ii][j];
                    var cell = row.cells[c];
                    cell.style.backgroundColor = "black";
                    this._setNoteCell(r, c, cell, false, null);
                }
            }
        } else {
            // Otherwise, we need to look at the blockMap.
            for (var i = 0; i < this._blockMap.length; i++) {
                var obj = this._blockMap[i];
                if (obj[0] !== -1) {
                    var n = obj[2];
                    var c = 0;
                    var rIdx = null;
                    // Look in the rowBlocks for the nth match
                    for (var j = 0; j < this._rowBlocks.length; j++) {
                        /* for note blocks within repeat block
                           their ids are added with a larger number
                           e.g. 11 becomes 1000011 or 2000011 */

                        // Slice length of comparing id from end
                        // of augmented id and compare
                        var idsliced =
                            this._rowBlocks[j]
                                .toString()
                                .slice(-obj[0].toString().length);
                        if (idsliced === obj[0].toString()) {
                            if ((c++) === n) {
                                rIdx = j;
                                break;
                            }
                        }
                    }

                    if (rIdx === null) {
                        console.debug("Could not find a row match.");
                        console.debug(obj[0]);
                        continue;
                    }

                    var r =
                        this._rowMap[rIdx] +
                        this._rowOffset[this._rowMap[rIdx]];

                    var c = -1;
                    for (var j = 0; j < this._colBlocks.length; j++) {
                        if (this._noteBlocks) {
                            if (
                                this._colBlocks[j][0] === obj[1][0] &&
                                this._colBlocks[j][1] === n
                            ) {
                                c = j;
                                break;
                            }
                        } else {
                            if (
                                this._colBlocks[j][0] === obj[1][0] &&
                                this._colBlocks[j][1] === obj[1][1]
                            ) {
                                c = j;
                                break;
                            }
                        }
                    }

                    if (c === -1) {
                        continue;
                    }

                    // If we found a match, mark this cell
                    var row = this._rows[r];
                    if (row === null || typeof row === "undefined") {
                        console.debug("COULD NOT FIND ROW " + r);
                    } else {
                        var cell = row.cells[c];
                        if (cell != undefined) {
                            cell.style.backgroundColor = "black";
                            this._setNoteCell(r, c, cell, false, null);
                        }
                    }
                }
            }
        }
    };

    this.playAll = function() {
        // Play all of the notes in the matrix.
        this.playingNow = !this.playingNow;

        if (this.playingNow) {
            this.widgetWindow.modifyButton(
                0,
                "stop-button.svg",
                ICONSIZE,
                _("stop")
            );

            this._logo.synth.stop();

            // Retrieve list of note to play, from matrix state
            this.collectNotesToPlay();

            this._notesCounter = 0;

            // We have an array of pitches and note values.
            var note = this._notesToPlay[this._notesCounter][0];
            var pitchNotes = [];
            var synthNotes = [];
            var drumNotes = [];

            // Note can be a chord, hence it is an array.
            for (var i = 0; i < note.length; i++) {
                if (typeof note[i] === "number") {
                    var drumName = null;
                } else {
                    var drumName = getDrumName(note[i]);
                }

                if (typeof note[i] === "number") {
                    synthNotes.push(note[i]);
                } else if (drumName != null) {
                    drumNotes.push(drumName);
                } else if (note[i].slice(0, 4) === "http") {
                    drumNotes.push(note[i]);
                } else {
                    var obj = note[i].split(": ");
                    if (obj.length > 1) {
                        // Deprecated
                        if (MATRIXSYNTHS.indexOf(obj[0]) !== -1) {
                            synthNotes.push(note[i]);
                        } else {
                            this._processGraphics(obj);
                        }
                    } else {
                        pitchNotes.push(
                            note[i].replace(/♭/g, "b").replace(/♯/g, "#")
                        );
                    }
                }

                this._stopOrCloseClicked = false;
            }

            var noteValue = this._notesToPlay[this._notesCounter][1];

            this._notesCounter += 1;

            this._colIndex = 0;

            // We highlight the note-value cells (bottom row).
            var row = this._noteValueRow;

            // Highlight first note.
            var cell = row.cells[this._colIndex];
            cell.style.backgroundColor = platformColor.selectorBackground;

            // If we are in a tuplet, we don't update the column until
            // we've played all of the notes in the column span.
            if (cell.colSpan > 1) {
                this._spanCounter = 1;
                var row = this._tupletNoteValueRow;
                var tupletCell = row.cells[this._colIndex];
                tupletCell.style.backgroundColor =
                    platformColor.selectorBackground;
            } else {
                this._spanCounter = 0;
                this._colIndex += 1;
            }

            if (note[0] !== "R" && pitchNotes.length > 0) {
                this._playChord(
                    pitchNotes,
                    this._logo.defaultBPMFactor / noteValue
                );
                // this._logo.synth.trigger(0, pitchNotes[0], this._logo.defaultBPMFactor / noteValue, this._instrumentName, null, null);
            }

            for (var i = 0; i < synthNotes.length; i++) {
                this._logo.synth.trigger(
                    0,
                    [Number(synthNotes[i])],
                    this._logo.defaultBPMFactor / noteValue,
                    this._instrumentName,
                    null,
                    null
                );
            }

            for (var i = 0; i < drumNotes.length; i++) {
                this._logo.synth.trigger(
                    0,
                    "C2",
                    this._logo.defaultBPMFactor / noteValue,
                    drumNotes[i],
                    null,
                    null
                );
            }

            this.__playNote(0, 0);
        } else {
            this._stopOrCloseClicked = true;
            this.widgetWindow.modifyButton(
                0,
                "play-button.svg",
                ICONSIZE,
                _("Play")
            );
        }
    };

    this.collectNotesToPlay = function() {
        // Generate the list of notes to play, on the fly from
        // row labels and note value (from "alt" attribute of
        // corresponding cells in the row)
        var notes = [];
        for (var i = 0; i < this._colBlocks.length; i++) {
            var note = [];
            for (var j = 0; j < this.rowLabels.length; j++) {
                var row = this._rows[j];
                var cell = row.cells[i];
                if (cell.style.backgroundColor === "black") {
                    if (this.rowLabels[j] === "hertz") {
                        // if pitch specified in hertz
                        note.push(this.rowArgs[j]);
                    } else {
                        // list of half-tones with solfeges
                        MATRIXHALFTONES = [
                            "do", "C", "C♯", "D♭", "re", "D", "D♯", "E♭",
                            "mi", "E", "fa", "F", "F♯", "G♭", "sol", "G",
                            "G♯", "A♭", "la", "A", "A♯", "B♭", "ti", "B"
                        ];
                        // list of half-tones in letter representations
                        MATRIXHALFTONES2 = [
                            "C", "C", "C♯", "D♭", "D", "D", "D♯", "E♭",
                            "E", "E", "F", "F", "F♯", "G♭", "G", "G",
                            "G♯", "A♭", "A", "A", "A♯", "B♭", "B", "B"
                        ];

                        if (
                            // if graphic block
                            MATRIXGRAPHICS.indexOf(this.rowLabels[j]) != -1 ||
                            MATRIXGRAPHICS2.indexOf(this.rowLabels[j]) != -1
                        ) {
                            // push "action: value"
                            note.push(this.rowLabels[j] + ": " + this.rowArgs[j]);
                        } else if (
                            // if pitch represented by halftone
                            MATRIXHALFTONES.indexOf(this.rowLabels[j]) != -1
                        ) {
                            // push "halftone" + "notevalue"
                            note.push(
                                MATRIXHALFTONES2[
                                    MATRIXHALFTONES.indexOf(this.rowLabels[j])
                                ] + this.rowArgs[j]
                            );
                        } else {
                            // if drum push drum name
                            note.push(this.rowLabels[j]);
                        }
                    }
                }
            }
            // push [note/chord, relative-duration-inverse (e.g. 8 for 1/8)]
            notes.push([note, 1 / cell.getAttribute("alt")]);
        }

        this._notesToPlay = notes;
    }

    this._resetMatrix = function() {
        var row = this._noteValueRow;
        for (var i = 0; i < row.cells.length; i++) {
            var cell = row.cells[i];
            cell.style.backgroundColor = platformColor.rhythmcellcolor;
        }

        if (that._matrixHasTuplets) {
            var row = this._tupletNoteValueRow;
            for (var i = 0; i < row.cells.length; i++) {
                var cell = row.cells[i];
                cell.style.backgroundColor = platformColor.tupletBackground;
            }
        }
    };

    this.__playNote = function(time, noteCounter) {
        // If the widget is closed, stop playing.
        if (!this.widgetWindow.isVisible()) {
            return;
        }

        noteValue = this._notesToPlay[noteCounter][1];
        time = 1 / noteValue;
        var that = this;

        setTimeout(function() {
            // Did we just play the last note?
            if (noteCounter === that._notesToPlay.length - 1) {
                that._resetMatrix();

                that.widgetWindow.modifyButton(
                    0,
                    "play-button.svg",
                    ICONSIZE,
                    _("Play")
                );
                that.playingNow = false;
            } else {
                var row = that._noteValueRow;
                var cell = row.cells[that._colIndex];

                if (cell != undefined) {
                    cell.style.backgroundColor =
                        platformColor.selectorBackground;
                    if (cell.colSpan > 1) {
                        var row = that._tupletNoteValueRow;
                        var tupletCell = row.cells[that._notesCounter];
                        tupletCell.style.backgroundColor =
                            platformColor.selectorBackground;
                    }
                }

                if (that._notesCounter >= that._notesToPlay.length) {
                    that._notesCounter = 1;
                    that._logo.synth.stop();
                }

                note = that._notesToPlay[that._notesCounter][0];
                noteValue = that._notesToPlay[that._notesCounter][1];
                that._notesCounter += 1;

                var pitchNotes = [];
                var synthNotes = [];
                var drumNotes = [];

                // Note can be a chord, hence it is an array.
                if (!that._stopOrCloseClicked) {
                    for (var i = 0; i < note.length; i++) {
                        if (typeof note[i] === "number") {
                            var drumName = null;
                        } else {
                            var drumName = getDrumName(note[i]);
                        }

                        if (typeof note[i] === "number") {
                            synthNotes.push(note[i]);
                        } else if (drumName != null) {
                            drumNotes.push(drumName);
                        } else if (note[i].slice(0, 4) === "http") {
                            drumNotes.push(note[i]);
                        } else {
                            var obj = note[i].split(": ");
                            // Deprecated
                            if (MATRIXSYNTHS.indexOf(obj[0]) !== -1) {
                                synthNotes.push(note[i]);
                                continue;
                            } else if (MATRIXGRAPHICS.indexOf(obj[0]) !== -1) {
                                that._processGraphics(obj);
                            } else if (MATRIXGRAPHICS2.indexOf(obj[0]) !== -1) {
                                that._processGraphics(obj);
                            } else {
                                pitchNotes.push(
                                    note[i]
                                        .replace(/♭/g, "b")
                                        .replace(/♯/g, "#")
                                );
                            }
                        }
                    }
                }

                if (note[0] !== "R" && pitchNotes.length > 0) {
                    that._playChord(
                        pitchNotes,
                        that._logo.defaultBPMFactor / noteValue
                    );
                    // that._logo.synth.trigger(0, pitchNotes[0], that._logo.defaultBPMFactor / noteValue, that._instrumentName, null, null);
                }

                for (var i = 0; i < synthNotes.length; i++) {
                    that._logo.synth.trigger(
                        0,
                        [Number(synthNotes[i])],
                        that._logo.defaultBPMFactor / noteValue,
                        that._instrumentName,
                        null,
                        null
                    );
                }

                for (var i = 0; i < drumNotes.length; i++) {
                    that._logo.synth.trigger(
                        0,
                        ["C2"],
                        that._logo.defaultBPMFactor / noteValue,
                        drumNotes[i],
                        null,
                        null
                    );
                }
            }

            var row = that._noteValueRow;
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

                if (noteCounter < that._notesToPlay.length && that.playingNow) {
                    that.__playNote(time, noteCounter);
                } else {
                    that._resetMatrix();
                    that.widgetWindow.modifyButton(
                        0,
                        "play-button.svg",
                        ICONSIZE,
                        _("Play")
                    );
                }
            }
        }, that._logo.defaultBPMFactor * 1000 * time + that._logo.turtleDelay);
    };

    this._playChord = function(notes, noteValue) {
        var that = this;
        setTimeout(function() {
            that._logo.synth.trigger(
                0,
                notes[0],
                noteValue,
                that._instrumentName,
                null,
                null
            );
        }, 1);

        if (notes.length > 1) {
            setTimeout(function() {
                that._logo.synth.trigger(
                    0,
                    notes[1],
                    noteValue,
                    that._instrumentName,
                    null,
                    null
                );
            }, 1);
        }

        if (notes.length > 2) {
            setTimeout(function() {
                that._logo.synth.trigger(
                    0,
                    notes[2],
                    noteValue,
                    that._instrumentName,
                    null,
                    null
                );
            }, 1);
        }

        if (notes.length > 3) {
            setTimeout(function() {
                that._logo.synth.trigger(
                    0,
                    notes[3],
                    noteValue,
                    that._instrumentName,
                    null,
                    null
                );
            }, 1);
        }
    };

    this._processGraphics = function(obj) {
        switch (obj[0]) {
            case "forward":
                this._logo.turtles.turtleList[0].doForward(obj[1]);
                break;
            case "back":
                this._logo.turtles.turtleList[0].doForward(-obj[1]);
                break;
            case "right":
                this._logo.turtles.turtleList[0].doRight(obj[1]);
                break;
            case "left":
                this._logo.turtles.turtleList[0].doRight(-obj[1]);
                break;
            case "setcolor":
                this._logo.turtles.turtleList[0].doSetColor(obj[1]);
                break;
            case "sethue":
                this._logo.turtles.turtleList[0].doSetHue(obj[1]);
                break;
            case "setshade":
                this._logo.turtles.turtleList[0].doSetValue(obj[1]);
                break;
            case "setgrey":
                this._logo.turtles.turtleList[0].doSetChroma(obj[1]);
                break;
            case "settranslucency":
                var alpha = 1.0 - obj[1] / 100;
                this._logo.turtles.turtleList[0].doSetPenAlpha(alpha);
                break;
            case "setpensize":
                this._logo.turtles.turtleList[0].doSetPensize(obj[1]);
                break;
            case "setheading":
                this._logo.turtles.turtleList[0].doSetHeading(obj[1]);
                break;
            case "arc":
                this._logo.turtles.turtleList[0].doArc(obj[1], obj[2]);
                break;
            case "setxy":
                this._logo.turtles.turtleList[0].doSetXY(obj[1], obj[2]);
                break;
            default:
                console.debug("unknown graphics command " + obj[0]);
                break;
        }
    };

    this._setNotes = function(colIndex, rowIndex, playNote) {
        // Sets corresponding note when user clicks on any cell and
        // plays that note
        var rowBlock = this._rowBlocks[
            this._rowMap.indexOf(rowIndex - this._rowOffset[rowIndex])
        ];
        var rhythmBlockObj = this._colBlocks[colIndex];

        if (playNote) {
            this.addNode(rowBlock, rhythmBlockObj[0], rhythmBlockObj[1]);
        } else {
            this.removeNode(rowBlock, rhythmBlockObj[0], rhythmBlockObj[1]);
        }

        for (var j = 0; j < this.rowLabels.length; j++) {
            var row = this._rows[j];
            var cell = row.cells[colIndex];
            if (cell.style.backgroundColor === "black") {
                this._setNoteCell(j, colIndex, cell, playNote);
            }
        }
    };

    this._setNoteCell = function(j, colIndex, cell, playNote) {
        var note = this._noteStored[j];
        if (this.rowLabels[j] === "hertz") {
            var drumName = null;
            var graphicsBlock = false;
            var obj = [note];
        } else {
            var drumName = getDrumName(note);
            var graphicsBlock = false;
            graphicNote = note.split(": ");
            if (
                MATRIXGRAPHICS.indexOf(graphicNote[0]) != -1 &&
                MATRIXGRAPHICS2.indexOf(graphicNote[0]) != -1
            ) {
                var graphicsBlock = true;
            }

            var obj = note.split(": ");
        }

        var row = this._rows[j];
        var cell = row.cells[colIndex];

        // Using the alt attribute to store the note value
        var noteValue = cell.getAttribute("alt") * this._logo.defaultBPMFactor;

        if (obj.length === 1) {
            if (playNote) {
                if (drumName != null) {
                    this._logo.synth.trigger(
                        0,
                        "C2",
                        noteValue,
                        drumName,
                        null,
                        null
                    );
                } else if (this.rowLabels[j] === "hertz") {
                    this._logo.synth.trigger(
                        0,
                        Number(note),
                        noteValue,
                        this._instrumentName,
                        null,
                        null
                    );
                } else if (graphicsBlock !== true) {
                    if (typeof note === "string") {
                        this._logo.synth.trigger(
                            0,
                            note.replace(/♭/g, "b").replace(/♯/g, "#"),
                            noteValue,
                            this._instrumentName,
                            null,
                            null
                        );
                    } else {
                        this._logo.synth.trigger(
                            0,
                            note,
                            noteValue,
                            this._instrumentName,
                            null,
                            null
                        );
                    }
                } else {
                    console.debug("Cannot parse note object: " + obj);
                }
            }
        } else if (MATRIXSYNTHS.indexOf(obj[0]) !== -1) {
            this._logo.synth.trigger(
                0,
                [Number(obj[1])],
                noteValue,
                obj[0],
                null,
                null
            );
        }
    };

    this._clear = function() {
        // 'Unclick' every entry in the matrix.
        for (var i = 0; i < this.rowLabels.length; i++) {
            var row = this._rows[i];
            for (var j = 0; j < row.cells.length; j++) {
                var cell = row.cells[j];
                if (cell.style.backgroundColor === "black") {
                    cell.style.backgroundColor = cell.getAttribute("cellColor");
                    this._notesToPlay[j][0] = ["R"];
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

        var newStack = [
            [
                0,
                ["action", { collapsed: true }],
                100,
                100,
                [null, 1, null, null]
            ],
            [1, ["text", { value: _("action") }], 0, 0, [0]]
        ];
        var endOfStackIdx = 0;

        // Retrieve the list of notes to play, that'll be saved
        this.collectNotesToPlay();

        for (var i = 0; i < this._notesToPlay.length; i++) {
            // We want all of the notes in a column.
            var note = this._notesToPlay[i].slice(0);
            if (note[0] === "") {
                note[0] = "R";
            }

            // Add the Note block and its value
            var idx = newStack.length;
            newStack.push([
                idx,
                "newnote",
                0,
                0,
                [endOfStackIdx, idx + 1, idx + 2, null]
            ]);
            var n = newStack[idx][4].length;
            if (i === 0) {
                // the action block
                newStack[endOfStackIdx][4][n - 2] = idx;
            } else {
                // the previous note block
                newStack[endOfStackIdx][4][n - 1] = idx;
            }

            var endOfStackIdx = idx;

            // The note block might be generated from a tuplet in
            // which case we output 1 / (3 x 4) instead of 1 / 12.
            if (
                this._outputAsTuplet[i][0] !== 1 &&
                parseInt(this._outputAsTuplet[i][1]) ===
                    this._outputAsTuplet[i][1]
            ) {
                // We don't reformat dotted tuplets since they are too complicated.
                // We are adding 6 blocks: vspace, divide, number, multiply, number, number
                var delta = 7;

                // Add a vspace to prevent divide block from obscuring the pitch block.
                newStack.push([idx + 1, "vspace", 0, 0, [idx, idx + delta]]);

                // note value is saved as a fraction
                newStack.push([
                    idx + 2,
                    "divide",
                    0,
                    0,
                    [idx, idx + 3, idx + 4]
                ]);

                newStack.push([
                    idx + 3,
                    ["number", { value: 1 }],
                    0,
                    0,
                    [idx + 2]
                ]);
                newStack.push([
                    idx + 4,
                    "multiply",
                    0,
                    0,
                    [idx + 2, idx + 5, idx + 6]
                ]);
                newStack.push([
                    idx + 5,
                    ["number", { value: this._outputAsTuplet[i][0] }],
                    0,
                    0,
                    [idx + 4]
                ]);
                newStack.push([
                    idx + 6,
                    ["number", { value: this._outputAsTuplet[i][1] }],
                    0,
                    0,
                    [idx + 4]
                ]);
            } else {
                // We are adding 4 blocks: vspace, divide, number, number
                var delta = 5;

                // Add a vspace to prevent divide block from obscuring the pitch block.
                newStack.push([idx + 1, "vspace", 0, 0, [idx, idx + delta]]);

                // note value is saved as a fraction
                newStack.push([
                    idx + 2,
                    "divide",
                    0,
                    0,
                    [idx, idx + 3, idx + 4]
                ]);

                if (parseInt(note[1]) < note[1]) {
                    // dotted note
                    var obj = toFraction(note[1]);
                    newStack.push([
                        idx + 3,
                        ["number", { value: obj[1] }],
                        0,
                        0,
                        [idx + 2]
                    ]);
                    newStack.push([
                        idx + 4,
                        ["number", { value: obj[0] }],
                        0,
                        0,
                        [idx + 2]
                    ]);
                } else {
                    newStack.push([
                        idx + 3,
                        ["number", { value: 1 }],
                        0,
                        0,
                        [idx + 2]
                    ]);
                    newStack.push([
                        idx + 4,
                        ["number", { value: note[1] }],
                        0,
                        0,
                        [idx + 2]
                    ]);
                }
            }

            // Connect the Note block flow to the divide and vspace blocks.
            newStack[idx][4][1] = idx + 2; // divide block
            newStack[idx][4][2] = idx + 1; // vspace block

            var x = idx + delta;

            if (note[0][0] === "R" || note[0][0] == undefined) {
                // The last connection in last pitch block is null.
                var lastConnection = null;
                if (delta === 5 || delta === 7) {
                    var previousBlock = idx + 1; // Vspace block
                } else {
                    var previousBlock = idx; // Note block
                }

                delta -= 2;
                var thisBlock = idx + delta;
                newStack.push([
                    thisBlock + 1,
                    "rest2",
                    0,
                    0,
                    [previousBlock, lastConnection]
                ]);
                previousBlock += delta;
            } else {
                // Add the pitch and/or playdrum blocks to the Note block
                var thisBlock = idx + delta;
                for (var j = 0; j < note[0].length; j++) {
                    // We need to point to the previous note or pitch block.
                    if (j === 0) {
                        if (delta === 5 || delta === 7) {
                            var previousBlock = idx + 1; // Vspace block
                        } else {
                            var previousBlock = idx; // Note block
                        }
                    }

                    if (typeof note[0][j] === "number") {
                        var obj = null;
                        var drumName = null;
                    } else {
                        var obj = note[0][j].split(": ");
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

                        newStack.push([
                            thisBlock,
                            "hertz",
                            0,
                            0,
                            [previousBlock, thisBlock + 1, lastConnection]
                        ]);
                        newStack.push([
                            thisBlock + 1,
                            ["number", { value: note[0][j] }],
                            0,
                            0,
                            [thisBlock]
                        ]);
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

                        newStack.push([
                            thisBlock,
                            "playdrum",
                            0,
                            0,
                            [previousBlock, thisBlock + 1, lastConnection]
                        ]);
                        newStack.push([
                            thisBlock + 1,
                            ["drumname", { value: drumName }],
                            0,
                            0,
                            [thisBlock]
                        ]);
                        thisBlock += 2;
                        previousBlock = thisBlock - 2;
                    } else if (note[0][j].slice(0, 4) === "http") {
                        // add a playdrum block with URL
                        // The last connection in last pitch block is null.
                        if (note[0].length === 1 || j === note[0].length - 1) {
                            var lastConnection = null;
                        } else {
                            var lastConnection = thisBlock + 2;
                        }

                        newStack.push([
                            thisBlock,
                            "playdrum",
                            0,
                            0,
                            [previousBlock, thisBlock + 1, lastConnection]
                        ]);
                        newStack.push([
                            thisBlock + 1,
                            ["text", { value: note[0][j] }],
                            0,
                            0,
                            [thisBlock]
                        ]);
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

                        newStack.push([
                            thisBlock,
                            obj[0],
                            0,
                            0,
                            [
                                previousBlock,
                                thisBlock + 1,
                                thisBlock + 2,
                                lastConnection
                            ]
                        ]);
                        newStack.push([
                            thisBlock + 1,
                            ["number", { value: Number(obj[1]) }],
                            0,
                            0,
                            [thisBlock]
                        ]);
                        newStack.push([
                            thisBlock + 2,
                            ["number", { value: Number(obj[2]) }],
                            0,
                            0,
                            [thisBlock]
                        ]);
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

                        newStack.push([
                            thisBlock,
                            obj[0],
                            0,
                            0,
                            [previousBlock, thisBlock + 1, lastConnection]
                        ]);
                        newStack.push([
                            thisBlock + 1,
                            ["number", { value: Number(obj[1]) }],
                            0,
                            0,
                            [thisBlock]
                        ]);
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

                        if (note[0][j][1] === "♯") {
                            if (this._logo.synth.inTemperament == "custom") {
                                newStack.push([
                                    thisBlock,
                                    "pitch",
                                    0,
                                    0,
                                    [
                                        previousBlock,
                                        thisBlock + 1,
                                        thisBlock + 2,
                                        lastConnection
                                    ]
                                ]);
                                newStack.push([
                                    thisBlock + 1,
                                    [
                                        "customNote",
                                        {
                                            value: note[0][j].substring(
                                                0,
                                                note[0][j].length - 1
                                            )
                                        }
                                    ],
                                    0,
                                    0,
                                    [thisBlock]
                                ]);
                                newStack.push([
                                    thisBlock + 2,
                                    ["number", { value: note[0][j].slice(-1) }],
                                    0,
                                    0,
                                    [thisBlock]
                                ]);
                                previousBlock = thisBlock;
                                thisBlock += 3;
                            } else {
                                // Accidental block is deprecated
                                /*
                                newStack.push([thisBlock, 'accidental', 0, 0, [previousBlock, thisBlock + 1, thisBlock + 2, thisBlock + 5]]);
                                newStack.push([thisBlock + 1, ['accidentalname', {value: _('sharp') + ' ♯'}], 0, 0, [thisBlock]]);
                                newStack.push([thisBlock + 2, 'pitch', 0, 0, [thisBlock, thisBlock + 3, thisBlock + 4, null]]);
                                newStack.push([thisBlock + 3, ['solfege', {'value': SOLFEGECONVERSIONTABLE[note[0][j][0]]}], 0, 0, [thisBlock + 2]]);
                                newStack.push([thisBlock + 4, ['number', {'value': note[0][j][2]}], 0, 0, [thisBlock + 2]]);
                                if (lastConnection != null) {
                                    lastConnection += 3;
                                }
                                newStack.push([thisBlock + 5, 'hidden', 0, 0, [thisBlock, lastConnection]]);
                                previousBlock = thisBlock + 5;
                                thisBlock += 6;
                                */
                                newStack.push([
                                    thisBlock,
                                    "pitch",
                                    0,
                                    0,
                                    [
                                        previousBlock,
                                        thisBlock + 1,
                                        thisBlock + 2,
                                        lastConnection
                                    ]
                                ]);
                                newStack.push([
                                    thisBlock + 1,
                                    [
                                        "solfege",
                                        {
                                            value:
                                                SOLFEGECONVERSIONTABLE[
                                                    note[0][j][0] + "♯"
                                                ]
                                        }
                                    ],
                                    0,
                                    0,
                                    [thisBlock]
                                ]);
                                newStack.push([
                                    thisBlock + 2,
                                    ["number", { value: note[0][j][2] }],
                                    0,
                                    0,
                                    [thisBlock]
                                ]);
                                previousBlock = thisBlock;
                                thisBlock += 3;
                            }
                        } else if (note[0][j][1] === "♭") {
                            if (this._logo.synth.inTemperament == "custom") {
                                newStack.push([
                                    thisBlock,
                                    "pitch",
                                    0,
                                    0,
                                    [
                                        previousBlock,
                                        thisBlock + 1,
                                        thisBlock + 2,
                                        lastConnection
                                    ]
                                ]);
                                newStack.push([
                                    thisBlock + 1,
                                    [
                                        "customNote",
                                        {
                                            value: note[0][j].substring(
                                                0,
                                                note[0][j].length - 1
                                            )
                                        }
                                    ],
                                    0,
                                    0,
                                    [thisBlock]
                                ]);
                                newStack.push([
                                    thisBlock + 2,
                                    ["number", { value: note[0][j].slice(-1) }],
                                    0,
                                    0,
                                    [thisBlock]
                                ]);
                                previousBlock = thisBlock;
                                thisBlock += 3;
                            } else {
                                // Accidental block is deprecated
                                /*
                                newStack.push([thisBlock, 'accidental', 0, 0, [previousBlock, thisBlock + 1, thisBlock + 2, thisBlock + 5]]);
                                newStack.push([thisBlock + 1, ['accidentalname', {value: _('flat') + ' ♭'}], 0, 0, [thisBlock]]);
                                newStack.push([thisBlock + 2, 'pitch', 0, 0, [thisBlock, thisBlock + 3, thisBlock + 4, null]]);
                                newStack.push([thisBlock + 3, ['solfege', {'value': SOLFEGECONVERSIONTABLE[note[0][j][0]]}], 0, 0, [thisBlock + 2]]);
                                newStack.push([thisBlock + 4, ['number', {'value': note[0][j][2]}], 0, 0, [thisBlock + 2]]);
                                if (lastConnection != null) {
                                    lastConnection += 3;
                                }
                                newStack.push([thisBlock + 5, 'hidden', 0, 0, [thisBlock, lastConnection]]);
                                previousBlock = thisBlock + 5;
                                thisBlock += 6;
                                */
                                newStack.push([
                                    thisBlock,
                                    "pitch",
                                    0,
                                    0,
                                    [
                                        previousBlock,
                                        thisBlock + 1,
                                        thisBlock + 2,
                                        lastConnection
                                    ]
                                ]);
                                newStack.push([
                                    thisBlock + 1,
                                    [
                                        "solfege",
                                        {
                                            value:
                                                SOLFEGECONVERSIONTABLE[
                                                    note[0][j][0] + "♭"
                                                ]
                                        }
                                    ],
                                    0,
                                    0,
                                    [thisBlock]
                                ]);
                                newStack.push([
                                    thisBlock + 2,
                                    ["number", { value: note[0][j][2] }],
                                    0,
                                    0,
                                    [thisBlock]
                                ]);
                                previousBlock = thisBlock;
                                thisBlock += 3;
                            }
                        } else {
                            newStack.push([
                                thisBlock,
                                "pitch",
                                0,
                                0,
                                [
                                    previousBlock,
                                    thisBlock + 1,
                                    thisBlock + 2,
                                    lastConnection
                                ]
                            ]);
                            if (this._logo.synth.inTemperament == "custom") {
                                newStack.push([
                                    thisBlock + 1,
                                    [
                                        "customNote",
                                        {
                                            value: note[0][j].substring(
                                                0,
                                                note[0][j].length - 1
                                            )
                                        }
                                    ],
                                    0,
                                    0,
                                    [thisBlock]
                                ]);
                                newStack.push([
                                    thisBlock + 2,
                                    ["number", { value: note[0][j].slice(-1) }],
                                    0,
                                    0,
                                    [thisBlock]
                                ]);
                            } else {
                                newStack.push([
                                    thisBlock + 1,
                                    [
                                        "solfege",
                                        {
                                            value:
                                                SOLFEGECONVERSIONTABLE[
                                                    note[0][j][0]
                                                ]
                                        }
                                    ],
                                    0,
                                    0,
                                    [thisBlock]
                                ]);
                                newStack.push([
                                    thisBlock + 2,
                                    ["number", { value: note[0][j][1] }],
                                    0,
                                    0,
                                    [thisBlock]
                                ]);
                            }
                            previousBlock = thisBlock;
                            thisBlock += 3;
                        }
                    }
                }
            }
        }

        // Create a new stack for the chunk.
        this._logo.blocks.loadNewBlocks(newStack);
        this._logo.textMsg(_("New action block generated!"));
    };
}
