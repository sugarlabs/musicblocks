// Copyright (c) 2015 Yash Khandelwal
// Copyright (c) 2015-21 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
   global

   _, platformColor, docById, MATRIXSOLFEHEIGHT, toFraction, Singer,
   SOLFEGECONVERSIONTABLE, slicePath, wheelnav, delayExecution,
   DEFAULTVOICE, getDrumName, MATRIXSOLFEWIDTH, getDrumIcon,
   noteIsSolfege, isCustomTemperament, i18nSolfege, getNote, DEFAULTDRUM, last,
   DRUMS, SHARP, FLAT, PREVIEWVOLUME, DEFAULTVOLUME, noteToFrequency,
   LCD, calcNoteValueToDisplay, NOTESYMBOLS,
   EIGHTHNOTEWIDTH, docBySelector, getTemperament
*/

/*
Globals location
- lib/wheelnav
    slicePath, wheelnav

- js/utils/musicutils.js
    EIGHTHNOTEWIDTH, NOTESYMBOLS, calcNoteValueToDisplay, getDrumIndex, noteToFrequency,
    FLAT, SHARP, DRUMS, MATRIXSOLFEHEIGHT, toFraction, SOLFEGECONVERSIONTABLE, DEFAULTVOICE,
    getDrumName, MATRIXSOLFEWIDTH, getDrumIcon, noteIsSolfege, isCustomTemperament, i18nSolfege,
    getNote, DEFAULTDRUM, getTemperament

- js/utils/utils.js
    _, delayExecution, last, LCD, docById, docBySelector

- js/turtle-singer.js
    Singer

- js/utils/platformstyle.js
    platformColorcl

- js/logo.js
    PREVIEWVOLUME, DEFAULTVOLUME
*/

/* exported PhraseMaker */

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

class PhraseMaker {
    // The phrasemaker widget
    static BUTTONDIVWIDTH = 535; // 8 buttons 535 = (55 + 4) * 9
    static OUTERWINDOWWIDTH = 758;
    static INNERWINDOWWIDTH = 630;
    static BUTTONSIZE = 53;
    static ICONSIZE = 24;
    // stylePhraseMaker();
    constructor() {
        this._stopOrCloseClicked = false;
        this._instrumentName = DEFAULTVOICE;
        this.isInitial = true;
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
        this._blockMap = {};

        this.blockNo = null;
        this.notesBlockMap = [];
        this._blockMapHelper = [];
        this.columnBlocksMap = [];
    }

    stylePhraseMaker(){

        var floatingWindowsDiv = document.getElementById("floatingWindows");
        var windowFrameElements = floatingWindowsDiv.querySelectorAll(".windowFrame");
    
        for (var i = 0; i < windowFrameElements.length; i++) {
            var windowFrame = windowFrameElements[i];
            var wfWinBody = document.querySelector(".wfWinBody");
            var wfbWidget = document.querySelector(".wfbWidget");
            wfbWidget.style.overflow = "auto";
            wfbWidget.style.width = "-webkit-fill-available";
            wfbWidget.style.height = "-webkit-fill-available";
            windowFrame.style.height = "405px";
            windowFrame.style.width = "685px";
            wfWinBody.style.position = "absolute";
            wfWinBody.style.overflow = "auto";
            wfWinBody.style.width = "-webkit-fill-available";
            wfWinBody.style.height = "-webkit-fill-available";
            wfWinBody.style.background = "#cccccc";
            wfbWidget.style.position = "absolute";
            wfbWidget.style.left = "55px";
        }
    }

    clearBlocks() {
        // When creating a new matrix, we want to clear out any old
        // block references.
        this._rowBlocks = [];
        this._colBlocks = [];
        this._rowMap = [];
        this._rowOffset = [];
    }

    addRowBlock(rowBlock) {
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
    }

    addColBlock(rhythmBlock, n) {
        // When creating a matrix, we add columns when we encounter
        // rhythm blocks.
        // Search for previous instance of the same block (from a
        // repeat).
        let startIdx = 0;
        let obj;
        for (let i = 0; i < this._colBlocks.length; i++) {
            obj = this._colBlocks[i];
            if (obj[0] === rhythmBlock) {
                startIdx += 1;
            }
        }

        for (let i = startIdx; i < n + startIdx; i++) {
            this._colBlocks.push([rhythmBlock, i]);
        }
    }

    addNode(rowBlock, rhythmBlock, n, blk) {
        // A node exists for each cell in the matrix. It is used to
        // preserve and restore the state of the cell.
        if (this._blockMap[blk] === undefined) {
            this._blockMap[blk] = [];
        }

        let j = 0;
        let obj;
        for (let i = 0; i < this._blockMap[blk].length; i++) {
            obj = this._blockMap[blk][i];
            if (obj[0] === rowBlock && obj[1][0] === rhythmBlock && obj[1][1] === n) {
                j += 1;
            }
        }

        this._blockMap[blk].push([rowBlock, [rhythmBlock, n], j]);
    }

    removeNode(rowBlock, rhythmBlock, n) {
        // When the matrix is changed, we may need to remove nodes.
        const blk = this.blockNo;
        let obj;
        for (let i = 0; i < this._blockMap[blk].length; i++) {
            obj = this._blockMap[blk][i];
            if (obj[0] === rowBlock && obj[1][0] === rhythmBlock && obj[1][1] === n) {
                this._blockMap[blk].splice(i, 1);
            }
        }
    }

    _get_save_lock() {
        // Debounce the save button.
        return this._save_lock;
    }

    init(activity) {
        // Initializes the matrix. First removes the previous matrix
        // and then make another one in DOM (document object model)
        let tempTable;
        this.activity = activity;

        this._noteStored = [];
        this._noteBlocks = false;
        this._rests = 0;

        this.playingNow = false;

        const w = window.innerWidth;
        this._cellScale = Math.max(1, w / 1200);
        const iconSize = PhraseMaker.ICONSIZE * this._cellScale;

        const widgetWindow = window.widgetWindows.windowFor(this, "phrase maker");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();

        //eslint-disable-next-line no-console
        console.debug("notes " + this.rowLabels + " octave " + this.rowArgs);

        this._notesToPlay = [];
        this._matrixHasTuplets = false;

        // Add the buttons to the top row.

        widgetWindow.onclose = () => {
            this._rowOffset = [];
            for (let i = 0; i < this._rowMap.length; i++) {
                this._rowMap[i] = i;
            }

            this.activity.logo.synth.stopSound(0, this._instrumentName);
            this.activity.logo.synth.stop();
            this._stopOrCloseClicked = true;
            this.activity.hideMsgs();
            docById("wheelDivptm").style.display = "none";

            widgetWindow.destroy();
        };

        this._playButton = widgetWindow.addButton(
            "play-button.svg",
            PhraseMaker.ICONSIZE,
            _("Play")
        );

        this._playButton.onclick = () => {
            this.activity.logo.turtleDelay = 0;

            this.activity.logo.resetSynth(0);
            if (this.playingNow) {
                this._playButton.innerHTML =
                    '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' +
                    _("Play") +
                    '" alt="' +
                    _("Play") +
                    '" height="' +
                    PhraseMaker.ICONSIZE +
                    '" width="' +
                    PhraseMaker.ICONSIZE +
                    '" vertical-align="middle">&nbsp;&nbsp;';
            } else {
                this._playButton.innerHTML =
                    '&nbsp;&nbsp;<img src="header-icons/stop-button.svg" title="' +
                    _("Stop") +
                    '" alt="' +
                    _("Stop") +
                    '" height="' +
                    PhraseMaker.ICONSIZE +
                    '" width="' +
                    PhraseMaker.ICONSIZE +
                    '" vertical-align="middle">&nbsp;&nbsp;';
            }
            this.playAll();
        };

        this._save_lock = false;
        widgetWindow.addButton(
            "export-chunk.svg",
            PhraseMaker.ICONSIZE,
            _("Save")
        ).onclick = async () => {
            // Debounce the save button
            if (!this._get_save_lock()) {
                this._save_lock = true;
                this._save();
                await delayExecution(1000);
                this._save_lock = false;
                if (window.innerWidth <= 600)
                    // Mobile
                    this.widgetWindow.close();
            }
        };

        widgetWindow.addButton(
            "erase-button.svg",
            PhraseMaker.ICONSIZE,
            _("Clear")
        ).onclick = this._clear.bind(this);

        if (!localStorage.beginnerMode) {
            widgetWindow.addButton(
                "export-button.svg",
                PhraseMaker.ICONSIZE,
                _("Export")
            ).onclick = this._export.bind(this);
        }

        widgetWindow.addButton(
            "sort.svg",
            PhraseMaker.ICONSIZE,
            _("Sort")
        ).onclick = this._sort.bind(this);

        let cell = widgetWindow.addButton("add2.svg", PhraseMaker.ICONSIZE, _("Add note"));
        cell.setAttribute("id", "addnotes");
        cell.onclick = this._createAddRowPieSubmenu.bind(this);

        const ptmTable = document.createElement("table");
        ptmTable.setAttribute("cellpadding", "0px");
        widgetWindow.getWidgetBody().append(ptmTable);

        let ptmTableRow, drumName, cellColor;
        let noteName, blockLabel;
        let noteObj, ptmCell, ptmRow, ptmCellTable;

        // Each row in the ptm table contains a note label in the
        // first column and a table of buttons in the second column.
        if (!this.sorted) {
            this.columnBlocksMap = this._mapNotesBlocks("all", true);
            for (let i = 0; i < this.columnBlocksMap.length; i++) {
                if (
                    MATRIXGRAPHICS.indexOf(this.columnBlocksMap[i][1]) !== -1 ||
                    MATRIXGRAPHICS2.indexOf(this.columnBlocksMap[i][1]) !== -1 ||
                    MATRIXSYNTHS.indexOf(this.columnBlocksMap[i][1]) !== -1 ||
                    ["playdrum", "pitch"].indexOf(this.columnBlocksMap[i][1]) !== -1
                ) {
                    continue;
                }
                this.columnBlocksMap = this.columnBlocksMap
                    .slice(0, i)
                    .concat(this.columnBlocksMap.slice(i + 1));
                i--;
            }
        }

        let j = 0;
        for (let i = 0; i < this.rowLabels.length; i++) {
            if (this.rowLabels[i].toLowerCase() === "rest") {
                this._rests += 1;
                continue;
            }

            ptmTableRow = ptmTable.insertRow();

            drumName = getDrumName(this.rowLabels[i]);

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
            cell = ptmTableRow.insertCell();
            cell.style.backgroundColor = cellColor;
            cell.style.fontSize = this._cellScale * 100 + "%";
            cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 1 + "px";
            cell.style.width = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + "px";
            cell.style.minWidth = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + "px";
            cell.style.maxWidth = cell.style.minWidth;
            cell.className = "headcol"; // This cell is fixed horizontally.
            cell.style.position = "sticky";
            cell.style.left = "1.2px";
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
                noteName = this.rowLabels[i];
                if (noteName in BELLSETIDX && this.rowArgs[i] === 4) {
                    cell.innerHTML =
                        '<img src="' +
                        "images/8_bellset_key_" +
                        BELLSETIDX[noteName] +
                        ".svg" +
                        '" width="' +
                        cell.style.width +
                        '" vertical-align="middle">';
                } else if (["C", "do"].indexOf(noteName) !== -1 && this.rowArgs[i] === 5) {
                    cell.innerHTML =
                        '<img src="' +
                        "images/8_bellset_key_8.svg" +
                        '" width="' +
                        cell.style.width +
                        '" vertical-align="middle">';
                }
            }

            // A cell for the row label
            cell = ptmTableRow.insertCell();
            cell.style.backgroundColor = cellColor;
            cell.style.fontSize = this._cellScale * 100 + "%";
            cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 1 + "px";
            cell.style.width = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + "px";
            cell.style.minWidth = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + "px";
            cell.style.maxWidth = cell.style.minWidth;
            cell.className = "labelcol"; // This cell is fixed horizontally.
            cell.style.position = "sticky";
            cell.style.left = PhraseMaker.BUTTONSIZE * this._cellScale + "px";
            cell.setAttribute("alt", i);
            this._labelcols[i] = cell;

            if (drumName != null) {
                cell.innerHTML = _(drumName);
                cell.style.fontSize = Math.floor(this._cellScale * 14) + "px";
                cell.setAttribute("alt", i + "__" + "drumblocks");

                cell.onclick = (event) => {
                    let eCell = event.target;
                    if (eCell.getAttribute("alt") === null) {
                        eCell = eCell.parentNode;
                    }
                    const index = eCell.getAttribute("alt").split("__")[0];
                    const condition = eCell.getAttribute("alt").split("__")[1];
                    this._createColumnPieSubmenu(index, condition);
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

                cell.onclick = (event) => {
                    let eCell = event.target;
                    if (eCell.getAttribute("alt") === null) {
                        eCell = eCell.parentNode;
                    }
                    const index = eCell.getAttribute("alt").split("__")[0];
                    const condition = eCell.getAttribute("alt").split("__")[1];
                    this._createMatrixGraphicsPieSubmenu(index, condition, null);
                };

                this._noteStored.push(this.rowArgs[i]);
            } else if (MATRIXGRAPHICS.indexOf(this.rowLabels[i]) !== -1) {
                blockLabel = this.activity.blocks.protoBlockDict[this.rowLabels[i]][
                    "staticLabels"
                ][0];
                cell.innerHTML = blockLabel + "<br>" + this.rowArgs[i];
                cell.style.fontSize = Math.floor(this._cellScale * 12) + "px";
                cell.setAttribute("alt", i + "__" + "graphicsblocks");

                cell.onclick = (event) => {
                    let eCell = event.target;
                    if (eCell.getAttribute("alt") === null) {
                        eCell = eCell.parentNode;
                    }
                    const index = eCell.getAttribute("alt").split("__")[0];
                    const condition = eCell.getAttribute("alt").split("__")[1];
                    this._createMatrixGraphicsPieSubmenu(index, condition, null);
                };

                this._noteStored.push(this.rowLabels[i] + ": " + this.rowArgs[i]);
            } else if (MATRIXGRAPHICS2.indexOf(this.rowLabels[i]) !== -1) {
                blockLabel = this.activity.blocks.protoBlockDict[this.rowLabels[i]][
                    "staticLabels"
                ][0];
                cell.innerHTML =
                    blockLabel + "<br>" + this.rowArgs[i][0] + " " + this.rowArgs[i][1];
                cell.style.fontSize = Math.floor(this._cellScale * 12) + "px";
                cell.setAttribute("alt", i + "__" + "graphicsblocks2");

                cell.onclick = (event) => {
                    let eCell = event.target;
                    if (eCell.getAttribute("alt") === null) {
                        eCell = eCell.parentNode;
                    }
                    const index = eCell.getAttribute("alt").split("__")[0];
                    // const condition = eCell.getAttribute("alt").split("__")[1];
                    this._createMatrixGraphics2PieSubmenu(index, null);
                };

                this._noteStored.push(
                    this.rowLabels[i] + ": " + this.rowArgs[i][0] + ": " + this.rowArgs[i][1]
                );
            } else {
                if (
                    noteIsSolfege(this.rowLabels[i]) &&
                    !isCustomTemperament(this.activity.logo.synth.inTemperament)
                ) {
                    cell.innerHTML =
                        i18nSolfege(this.rowLabels[i]) + this.rowArgs[i].toString().sub();
                    noteObj = getNote(
                        this.rowLabels[i],
                        this.rowArgs[i],
                        0,
                        this.activity.turtles.ithTurtle(0).singer.keySignature,
                        false,
                        null,
                        this.activity.errorMsg,
                        this.activity.logo.synth.inTemperament
                    );
                } else {
                    if (isCustomTemperament(this.activity.logo.synth.inTemperament)) {
                        noteObj = getNote(
                            this.rowLabels[i],
                            this.rowArgs[i],
                            0,
                            this.activity.turtles.ithTurtle(0).singer.keySignature,
                            false,
                            null,
                            this.activity.errorMsg,
                            this.activity.logo.synth.inTemperament
                        );
                        const label = this.rowLabels[i];
                        const notes = getTemperament(this.activity.logo.synth.inTemperament);
                        let note = [];
                        for (const n in notes) {
                            if (notes[n][1] === label) {
                                note = notes[n];
                                break;
                            }
                        }
                        if (note.length > 0) {
                            note = note[0];
                        }
                        if (note[3] && note[3] !== note[1]) {
                            cell.innerHTML = note[1];
                        } else {
                            cell.innerHTML = label + this.rowArgs[i].toString().sub();
                        }
                    } else {
                        cell.innerHTML = this.rowLabels[i] + this.rowArgs[i].toString().sub();
                        noteObj = [this.rowLabels[i], this.rowArgs[i]];
                    }
                }
                cell.setAttribute("alt", i + "__" + "pitchblocks");

                cell.onclick = (event) => {
                    let eCell = event.target;
                    if (eCell.getAttribute("alt") === null) {
                        eCell = eCell.parentNode;
                    }
                    const index = eCell.getAttribute("alt").split("__")[0];
                    const condition = eCell.getAttribute("alt").split("__")[1];
                    this._createColumnPieSubmenu(index, condition);
                };

                this._noteStored.push(noteObj[0] + noteObj[1]);
            }

            ptmCell = ptmTableRow.insertCell();
            // Create tables to store individual notes.
            ptmCellTable = document.createElement("table");
            ptmCellTable.setAttribute("cellpadding", "0px");
            ptmCell.append(ptmCellTable);

            // We'll use this element to put the clickable notes for this row.
            ptmRow = ptmCellTable.insertRow();
            this._rows[j] = ptmRow;

            j += 1;
        }

        // An extra row for the note and tuplet values
        ptmTableRow = ptmTable.insertRow();
        ptmCell = ptmTableRow.insertCell();
        ptmTableRow.setAttribute("id", "bottomRow");
        ptmTableRow.style.position = "sticky";
        ptmTableRow.style.bottom = "0px";
        ptmTableRow.style.zIndex = "1";

        ptmCell.setAttribute("colspan", "2");
        ptmCell.style.position = "sticky";
        ptmCell.style.left = "1.2px";
        ptmCell.style.zIndex = "1";
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

        if (this._blockMap[this.blockNo] === undefined) {
            this._blockMap[this.blockNo] = [];
        }
        this._lookForNoteBlocksOrRepeat();

        // Sort them if there are note blocks.
        if (!this.sorted) {
            setTimeout(() => {
                this._sort();
            }, 1000);
        } else {
            this.sorted = false;
        }

        if (this.isInitial) {
            this.activity.textMsg(_("Click on the table to add notes."));
            this.widgetWindow.sendToCenter();
            this.inInitial = false;
        }
    }

    _createAddRowPieSubmenu() {
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
        const valueLabel = [];
        let label;
        for (let i = 0; i < VALUES.length; i++) {
            label = _(VALUES[i]);
            valueLabel.push(label);
        }

        const graphicLabels = [];
        for (let i = 0; i < MATRIXGRAPHICS.length; i++) {
            graphicLabels.push(MATRIXGRAPHICS[i]);
        }

        for (let i = 0; i < MATRIXGRAPHICS2.length; i++) {
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

        const x = docById("addnotes").getBoundingClientRect().x;
        const y = docById("addnotes").getBoundingClientRect().y;

        docById("wheelDivptm").style.position = "absolute";
        docById("wheelDivptm").style.height = "300px";
        docById("wheelDivptm").style.width = "300px";
        docById("wheelDivptm").style.left =
            Math.min(
                this.activity.canvas.width - 200,
                Math.max(0, x * this.activity.getStageScale())
            ) + "px";
        docById("wheelDivptm").style.top =
            Math.min(
                this.activity.canvas.height - 250,
                Math.max(0, y * this.activity.getStageScale())
            ) + "px";

        this._exitWheel.navItems[0].navigateFunction = () => {
            docById("wheelDivptm").style.display = "none";
            this._menuWheel.removeWheel();
            this._exitWheel.removeWheel();
        };

        const __selectionChanged = () => {
            label = VALUESLABEL[this._menuWheel.selectedNavItemIndex];
            let rLabel = null;
            let rArg = null;
            const blockLabel = "";
            const newBlock = this.activity.blocks.blockList.length;
            switch (label) {
                case "pitch":
                    this.activity.blocks.loadNewBlocks([
                        [0, ["pitch", {}], 0, 0, [null, 1, 2, null]],
                        [1, ["solfege", { value: "sol" }], 0, 0, [0]],
                        [2, ["number", { value: 4 }], 0, 0, [0]]
                    ]);
                    rLabel = "sol";
                    rArg = 4;
                    break;
                case "hertz":
                    this.activity.blocks.loadNewBlocks([
                        [0, ["hertz", {}], 0, 0, [null, 1, null]],
                        [1, ["number", { value: 392 }], 0, 0, [0]]
                    ]);
                    rLabel = "hertz";
                    rArg = 392;
                    break;
                case "drum":
                    this.activity.blocks.loadNewBlocks([
                        [0, ["playdrum", {}], 0, 0, [null, 1, null]],
                        [1, ["drumname", { value: DEFAULTDRUM }], 0, 0, [0]]
                    ]);
                    rLabel = blockLabel;
                    rArg = -1;
                    break;
                case "graphics":
                    this.activity.blocks.loadNewBlocks([
                        [0, ["forward", {}], 0, 0, [null, 1, null]],
                        [1, ["number", { value: 100 }], 0, 0, [0]]
                    ]);
                    rLabel = "forward";
                    rArg = 100;
                    break;
                case "pen":
                    this.activity.blocks.loadNewBlocks([
                        [0, ["setcolor", {}], 0, 0, [null, 1, null]],
                        [1, ["number", { value: 0 }], 0, 0, [0]]
                    ]);
                    rLabel = "setcolor";
                    rArg = 0;
                    break;
                default:
                    //eslint-disable-next-line no-console
                    console.debug(label + " not found");
                    break;
            }

            let blocksNo = null;
            let aboveBlock = null;

            switch (label) {
                case "graphics":
                case "pen":
                    for (let i = graphicLabels.length - 1; i >= 0; i--) {
                        blocksNo = this._mapNotesBlocks(graphicLabels[i]);
                        if (blocksNo.length >= 1) {
                            aboveBlock = last(blocksNo);
                            break;
                        }
                    }
                    break;
                case "drum":
                    blocksNo = this._mapNotesBlocks("playdrum");
                    if (blocksNo.length >= 1) {
                        aboveBlock = last(blocksNo);
                    }
                    break;
                case "hertz":
                    blocksNo = this._mapNotesBlocks("hertz");
                    if (blocksNo.length >= 1) {
                        aboveBlock = last(blocksNo);
                    }
                    break;
                case "pitch":
                    blocksNo = this._mapNotesBlocks("pitch");
                    if (blocksNo.length >= 1) {
                        aboveBlock = last(blocksNo);
                    }
                    break;
            }

            if (aboveBlock === null) {
                // Look for a pitch block.
                blocksNo = this._mapNotesBlocks("pitch");
                if (blocksNo.length >= 1) {
                    aboveBlock = last(blocksNo);
                }

                // The top?
                if (aboveBlock === null) {
                    aboveBlock = this.blockNo;
                }
            }

            if (aboveBlock === this.blockNo) {
                setTimeout(this._addNotesBlockBetween(aboveBlock, newBlock, true), 500);
                this.rowLabels.splice(0, 0, rLabel);
                this.rowArgs.splice(0, 0, rArg);
                this._rowBlocks.splice(0, 0, newBlock);
            } else {
                setTimeout(this._addNotesBlockBetween(aboveBlock, newBlock, false), 500);
                let i;
                for (i = 0; i < this.columnBlocksMap.length; i++) {
                    if (this.columnBlocksMap[i][0] === aboveBlock) {
                        break;
                    }
                }

                this.rowLabels.splice(i + 1, 0, rLabel);
                this.rowArgs.splice(i + 1, 0, rArg);
                this._rowBlocks.splice(i + 1, 0, newBlock);
            }

            this.sorted = false;
            this.init(this.activity);
            let tupletParam;
            for (let i = 0; i < this.activity.logo.tupletRhythms.length; i++) {
                switch (this.activity.logo.tupletRhythms[i][0]) {
                    case "simple":
                    case "notes":
                        tupletParam = [
                            this.activity.logo.tupletParams[this.activity.logo.tupletRhythms[i][1]]
                        ];
                        tupletParam.push([]);
                        for (let j = 2; j < this.activity.logo.tupletRhythms[i].length; j++) {
                            tupletParam[1].push(this.activity.logo.tupletRhythms[i][j]);
                        }

                        this.addTuplet(tupletParam);
                        break;
                    default:
                        this.addNotes(
                            this.activity.logo.tupletRhythms[i][1],
                            this.activity.logo.tupletRhythms[i][2]
                        );
                        break;
                }
            }

            this.makeClickable();
            if (label === "pitch") {
                setTimeout(() => {
                    this.pitchBlockAdded(newBlock);
                }, 200);
            }
        };

        const __subMenuChanged = () => {
            __selectionChanged();
        };

        for (let i = 0; i < valueLabel.length; i++) {
            this._menuWheel.navItems[i].navigateFunction = __subMenuChanged;
        }
    }

    pitchBlockAdded(blockN) {
        let i;
        for (i = 0; i < this.columnBlocksMap.length; i++) {
            if (this.columnBlocksMap[i][0] === blockN) {
                break;
            }
        }

        setTimeout(this._createColumnPieSubmenu(i, "pitchblocks", true), 500);
    }

    _createMatrixGraphics2PieSubmenu(blockIndex, blk) {
        // A wheel for modifying 2-arg graphics blocks
        docById("wheelDivptm").style.display = "";
        const arcRadiusLabel = ["10", "20", "30", "40", "50", "60", "70", "80", "90", "100"];
        const arcAngleLabel = ["0", "30", "45", "60", "90", "180"];
        const setxyValueLabel = ["-200", "-100", "0", "100", "200"];

        this._pitchWheel = new wheelnav("wheelDivptm", null, 600, 600);
        this._exitWheel = new wheelnav("_exitWheel", this._pitchWheel.raphael);
        this._blockLabelsWheel = new wheelnav("_blockLabelsWheel", this._pitchWheel.raphael);
        this._blockLabelsWheel2 = new wheelnav("_blockLabelsWheel2", this._pitchWheel.raphael);
        const _blockNames = MATRIXGRAPHICS2.slice();
        const _blockLabels = [];
        for (let i = 0; i < _blockNames.length; i++) {
            _blockLabels.push(
                this.activity.blocks.protoBlockDict[_blockNames[i]]["staticLabels"][0]
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

        const x = this._labelcols[blockIndex].getBoundingClientRect().x;
        const y = this._labelcols[blockIndex].getBoundingClientRect().y;

        docById("wheelDivptm").style.position = "absolute";
        docById("wheelDivptm").style.height = "300px";
        docById("wheelDivptm").style.width = "300px";
        docById("wheelDivptm").style.left =
            Math.min(
                this.activity.canvas.width - 200,
                Math.max(0, x * this.activity.getStageScale())
            ) + "px";
        docById("wheelDivptm").style.top =
            Math.min(
                this.activity.canvas.height - 250,
                Math.max(0, y * this.activity.getStageScale())
            ) + "px";

        let thisBlock = this.columnBlocksMap[blockIndex][0];
        if (blk !== null) {
            thisBlock = blk;
        }

        const blockLabel = this.activity.blocks.blockList[thisBlock].name;
        const xblockLabelValue = this.activity.blocks.blockList[
            this.activity.blocks.blockList[thisBlock].connections[1]
        ].value;
        const yblockLabelValue = this.activity.blocks.blockList[
            this.activity.blocks.blockList[thisBlock].connections[2]
        ].value;

        if (blockLabel === "arc") {
            this._blockLabelsWheel2.createWheel(arcAngleLabel);
            this._pitchWheel.createWheel(arcRadiusLabel);
        } else if (blockLabel === "setxy") {
            this._blockLabelsWheel2.createWheel(setxyValueLabel);
            this._pitchWheel.createWheel(setxyValueLabel);
        }

        this._blockLabelsWheel.navigateWheel(_blockNames.indexOf(blockLabel));

        this.xblockValue = [xblockLabelValue.toString(), "x"];
        this.yblockValue = [yblockLabelValue.toString(), "y"];
        this._exitWheel.createWheel(["×", ""]);

        this._exitWheel.navItems[0].navigateFunction = () => {
            docById("wheelDivptm").style.display = "none";
            this._pitchWheel.removeWheel();
            this._exitWheel.removeWheel();
            this._blockLabelsWheel.removeWheel();
            this._blockLabelsWheel2.removeWheel();
        };

        const __enterArgValue1 = () => {
            this.xblockValue[0] = this._blockLabelsWheel2.navItems[
                this._blockLabelsWheel2.selectedNavItemIndex
            ].title;
            // eslint-disable-next-line no-use-before-define
            __selectionChanged(true);
        };

        const __enterArgValue2 = () => {
            this.yblockValue[0] = this._pitchWheel.navItems[
                this._pitchWheel.selectedNavItemIndex
            ].title;
            // eslint-disable-next-line no-use-before-define
            __selectionChanged(true);
        };

        if (blockLabel === "arc") {
            for (let i = 0; i < arcAngleLabel.length; i++) {
                this._blockLabelsWheel2.navItems[i].navigateFunction = __enterArgValue1;
            }

            for (let i = 0; i < arcRadiusLabel.length; i++) {
                this._pitchWheel.navItems[i].navigateFunction = __enterArgValue2;
            }
        } else if (blockLabel === "setxy") {
            for (let i = 0; i < setxyValueLabel.length; i++) {
                this._blockLabelsWheel2.navItems[i].navigateFunction = __enterArgValue1;
                this._pitchWheel.navItems[i].navigateFunction = __enterArgValue2;
            }
        }

        let __selectionChanged = async (updatingArgs) => {
            const thisBlockName = _blockNames[this._blockLabelsWheel.selectedNavItemIndex];
            let argBlock, z;
            if (updatingArgs === undefined) {
                // Creating a new block and removing the old one.
                const newBlock = this.activity.blocks.blockList.length;
                this.activity.blocks.loadNewBlocks([
                    [0, thisBlockName, 0, 0, [null, 1, 2, null]],
                    [1, ["number", { value: parseInt(this.xblockValue[0]) }], 0, 0, [0]],
                    [2, ["number", { value: parseInt(this.yblockValue[0]) }], 0, 0, [0]]
                ]);

                await delayExecution(500);
                this._blockReplace(thisBlock, newBlock);
                this.columnBlocksMap[blockIndex][0] = newBlock;
                thisBlock = newBlock;
                this._createMatrixGraphics2PieSubmenu(blockIndex, newBlock);
            } else {
                // Just updating a block arg value
                argBlock = this.activity.blocks.blockList[thisBlock].connections[1];
                this.activity.blocks.blockList[argBlock].text.text = this.xblockValue[0];
                this.activity.blocks.blockList[argBlock].value = parseInt(this.xblockValue[0]);

                z = this.activity.blocks.blockList[argBlock].container.children.length - 1;
                this.activity.blocks.blockList[argBlock].container.setChildIndex(
                    this.activity.blocks.blockList[argBlock].text,
                    z
                );
                this.activity.blocks.blockList[argBlock].updateCache();

                argBlock = this.activity.blocks.blockList[thisBlock].connections[2];
                this.activity.blocks.blockList[argBlock].text.text = this.yblockValue[0];
                this.activity.blocks.blockList[argBlock].value = parseInt(this.yblockValue[0]);

                z = this.activity.blocks.blockList[argBlock].container.children.length - 1;
                this.activity.blocks.blockList[argBlock].container.setChildIndex(
                    this.activity.blocks.blockList[argBlock].text,
                    z
                );
                this.activity.blocks.blockList[argBlock].updateCache();
            }

            // Update the stored values for this node.
            this.rowLabels[blockIndex] = thisBlockName;
            this.rowArgs[blockIndex][0] = parseInt(this.xblockValue);
            this.rowArgs[blockIndex][1] = parseInt(this.yblockValue);

            // Update the cell label.
            let blockLabel;
            let cell = this._headcols[blockIndex];
            const iconSize = PhraseMaker.ICONSIZE * (window.innerWidth / 1200);
            if (MATRIXGRAPHICS2.indexOf(this.rowLabels[blockIndex]) !== -1) {
                cell.innerHTML =
                    '&nbsp;&nbsp;<img src="' +
                    "images/mouse.svg" +
                    '" height="' +
                    iconSize +
                    '" width="' +
                    iconSize +
                    '" vertical-align="middle">&nbsp;&nbsp;';
            }

            cell = this._labelcols[blockIndex];
            if (MATRIXGRAPHICS2.indexOf(this.rowLabels[blockIndex]) !== -1) {
                blockLabel = this.activity.blocks.protoBlockDict[this.rowLabels[blockIndex]][
                    "staticLabels"
                ][0];
                cell.innerHTML =
                    blockLabel +
                    "<br>" +
                    this.rowArgs[blockIndex][0] +
                    " " +
                    this.rowArgs[blockIndex][1];
                cell.style.fontSize = Math.floor(this._cellScale * 12) + "px";
            }

            const noteStored =
                this.rowLabels[blockIndex] +
                ": " +
                this.rowArgs[blockIndex][0] +
                ": " +
                this.rowArgs[blockIndex][1];

            this._noteStored[blockIndex] = noteStored;
        };

        for (let i = 0; i < _blockLabels.length; i++) {
            this._blockLabelsWheel.navItems[i].navigateFunction = __selectionChanged;
        }
    }

    _createMatrixGraphicsPieSubmenu(blockIndex, condition, blk) {
        // A wheel for modifying 1-arg blocks (graphics and hertz)
        docById("wheelDivptm").style.display = "";
        let valueLabel,
            forwardBackLabel,
            leftRightLabel,
            setHeadingLabel,
            setPenSizeLabel,
            setLabel;
        // Different blocks get different arg wheel values.
        if (condition === "synthsblocks") {
            valueLabel = ["261", "294", "327", "348", "392", "436", "490", "523"];
        } else {
            valueLabel = [
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
            forwardBackLabel = ["1", "5", "10", "25", "50", "100", "200"];
            leftRightLabel = ["15", "30", "45", "60", "90", "180"];
            setHeadingLabel = ["0", "45", "90", "135", "180", "225", "270", "315"];
            setPenSizeLabel = ["1", "5", "10", "25", "50"];
            setLabel = ["0", "10", "20", "30", "40", "5n0", "60", "70", "80", "90", "100"];
        }

        this._pitchWheel = new wheelnav("wheelDivptm", null, 800, 800);
        this._exitWheel = new wheelnav("_exitWheel", this._pitchWheel.raphael);

        let blockNamesGraphics, blockLabelsGraphics, blockNamesPen, blockLabelsPen, name;
        blockLabelsPen;
        if (condition === "graphicsblocks") {
            this._blockLabelsWheel = new wheelnav("_blockLabelsWheel", this._pitchWheel.raphael);
            blockNamesGraphics = [];
            blockLabelsGraphics = [];
            blockNamesPen = [];
            blockLabelsPen = [];
            for (let i = 0; i < 5; i++) {
                name = MATRIXGRAPHICS[i];
                blockNamesGraphics.push(name);
                blockLabelsGraphics.push(
                    this.activity.blocks.protoBlockDict[name]["staticLabels"][0]
                );
            }
            for (let i = 5; i < MATRIXGRAPHICS.length; i++) {
                name = MATRIXGRAPHICS[i];
                blockNamesPen.push(name);
                blockLabelsPen.push(this.activity.blocks.protoBlockDict[name]["staticLabels"][0]);
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

        const x = this._labelcols[blockIndex].getBoundingClientRect().x;
        const y = this._labelcols[blockIndex].getBoundingClientRect().y;

        docById("wheelDivptm").style.position = "absolute";
        docById("wheelDivptm").style.height = "300px";
        docById("wheelDivptm").style.width = "300px";
        docById("wheelDivptm").style.left =
            Math.min(
                this.activity.canvas.width - 200,
                Math.max(0, x * this.activity.getStageScale())
            ) + "px";
        docById("wheelDivptm").style.top =
            Math.min(
                this.activity.canvas.height - 250,
                Math.max(0, y * this.activity.getStageScale())
            ) + "px";

        let thisBlock = this.columnBlocksMap[blockIndex][0];
        if (blk !== null) {
            thisBlock = blk;
        }

        let blockLabel = this.activity.blocks.blockList[thisBlock].name;
        const blockLabelValue = this.activity.blocks.blockList[
            this.activity.blocks.blockList[thisBlock].connections[1]
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

        this._exitWheel.navItems[0].navigateFunction = () => {
            docById("wheelDivptm").style.display = "none";
            this._pitchWheel.removeWheel();
            this._exitWheel.removeWheel();
            if (condition === "graphicsblocks") {
                this._blockLabelsWheel.removeWheel();
            }
        };

        const __enterArgValue = () => {
            this.blockValue = this._pitchWheel.navItems[
                this._pitchWheel.selectedNavItemIndex
            ].title;
            docById("wheelnav-_exitWheel-title-1").children[0].textContent = this.blockValue;
            // eslint-disable-next-line no-use-before-define
            __selectionChanged(true);
        };

        let labelLength;
        if (condition === "graphicsblocks") {
            if (blockLabel === "forward" || blockLabel === "back") {
                labelLength = forwardBackLabel.length;
            } else if (blockLabel === "right" || blockLabel === "left") {
                labelLength = leftRightLabel.length;
            } else if (blockLabel === "setheading") {
                labelLength = setHeadingLabel.length;
            } else if (blockLabel === "setpensize") {
                labelLength = setPenSizeLabel.length;
            } else {
                labelLength = setLabel.length;
            }
        } else if (condition === "synthsblocks") {
            labelLength = valueLabel.length;
        }

        for (let i = 0; i < labelLength; i++) {
            this._pitchWheel.navItems[i].navigateFunction = __enterArgValue;
        }

        let __selectionChanged = async (updatingArgs) => {
            let thisBlockName = "hertz";
            let label, newBlock, argBlock, z;
            if (condition === "graphicsblocks") {
                label = this._blockLabelsWheel.navItems[this._blockLabelsWheel.selectedNavItemIndex]
                    .title;
                let i = blockLabelsGraphics.indexOf(label);
                if (i === -1) {
                    i = blockLabelsPen.indexOf(label);
                    if (i !== -1) {
                        thisBlockName = blockNamesPen[i];
                    }
                } else {
                    thisBlockName = blockNamesGraphics[i];
                }
            }

            if (updatingArgs === undefined) {
                newBlock = this.activity.blocks.blockList.length;
                this.activity.blocks.loadNewBlocks([
                    [0, thisBlockName, 0, 0, [null, 1, null]],
                    [1, ["number", { value: parseInt(this.blockValue) }], 0, 0, [0]]
                ]);

                await delayExecution(500);
                this._blockReplace(thisBlock, newBlock);
                this.columnBlocksMap[blockIndex][0] = newBlock;
                thisBlock = newBlock;
                this._createMatrixGraphicsPieSubmenu(blockIndex, condition, newBlock);
            } else {
                // Just updating a block arg value
                argBlock = this.activity.blocks.blockList[thisBlock].connections[1];
                this.activity.blocks.blockList[argBlock].text.text = this.blockValue;
                this.activity.blocks.blockList[argBlock].value = parseInt(this.blockValue);

                z = this.activity.blocks.blockList[argBlock].container.children.length - 1;
                this.activity.blocks.blockList[argBlock].container.setChildIndex(
                    this.activity.blocks.blockList[argBlock].text,
                    z
                );
                this.activity.blocks.blockList[argBlock].updateCache();
            }

            // Update the stored values for this node.
            this.rowLabels[blockIndex] = thisBlockName;
            this.rowArgs[blockIndex] = parseInt(this.blockValue);

            // Update the cell label.
            let cell = this._headcols[blockIndex];
            const iconSize = PhraseMaker.ICONSIZE * (window.innerWidth / 1200);
            if (MATRIXSYNTHS.indexOf(this.rowLabels[blockIndex]) !== -1) {
                cell.innerHTML =
                    '&nbsp;&nbsp;<img src="' +
                    "images/synth2.svg" +
                    '" height="' +
                    iconSize +
                    '" width="' +
                    iconSize +
                    '" vertical-align="middle">&nbsp;&nbsp;';
            } else if (MATRIXGRAPHICS.indexOf(this.rowLabels[blockIndex]) !== -1) {
                cell.innerHTML =
                    '&nbsp;&nbsp;<img src="' +
                    "images/mouse.svg" +
                    '" height="' +
                    iconSize +
                    '" width="' +
                    iconSize +
                    '" vertical-align="middle">&nbsp;&nbsp;';
            }

            cell = this._labelcols[blockIndex];
            if (MATRIXSYNTHS.indexOf(this.rowLabels[blockIndex]) !== -1) {
                cell.innerHTML = this.rowArgs[blockIndex];
                cell.style.fontSize = Math.floor(this._cellScale * 14) + "px";
            } else if (MATRIXGRAPHICS.indexOf(this.rowLabels[blockIndex]) !== -1) {
                blockLabel = this.activity.blocks.protoBlockDict[this.rowLabels[blockIndex]][
                    "staticLabels"
                ][0];
                cell.innerHTML = blockLabel + "<br>" + this.rowArgs[blockIndex];
                cell.style.fontSize = Math.floor(this._cellScale * 12) + "px";
            }

            /*
            let noteStored = null;
            if (condition === "graphicsblocks") {
                noteStored = this.rowLabels[blockIndex] + ": " + this.rowArgs[blockIndex];
            } else if (condition === "synthsblocks") {
                noteStored = this.rowArgs[blockIndex];
            }
            */
            this._noteStored[blockIndex] =
                this.rowLabels[blockIndex] + ": " + this.rowArgs[blockIndex];
        };

        if (condition === "graphicsblocks") {
            if (blockLabel === "forward" || blockLabel === "back") {
                for (let i = 0; i < blockLabelsGraphics.length; i++) {
                    this._blockLabelsWheel.navItems[i].navigateFunction = __selectionChanged;
                }
            } else if (blockLabel === "right" || blockLabel === "left") {
                for (let i = 0; i < blockLabelsGraphics.length; i++) {
                    this._blockLabelsWheel.navItems[i].navigateFunction = __selectionChanged;
                }
            } else if (blockLabel === "setheading") {
                for (let i = 0; i < blockLabelsGraphics.length; i++) {
                    this._blockLabelsWheel.navItems[i].navigateFunction = __selectionChanged;
                }
            } else if (blockLabel === "setpensize") {
                for (let i = 0; i < blockLabelsPen.length; i++) {
                    this._blockLabelsWheel.navItems[i].navigateFunction = __selectionChanged;
                }
            } else {
                for (let i = 0; i < blockLabelsPen.length; i++) {
                    this._blockLabelsWheel.navItems[i].navigateFunction = __selectionChanged;
                }
            }
        }
    }

    _createColumnPieSubmenu(index, condition, sortedClose) {
        index = parseInt(index);
        docById("wheelDivptm").style.display = "";

        const accidentals = ["𝄪", "♯", "♮", "♭", "𝄫"];
        let noteLabels = ["ti", "la", "sol", "fa", "mi", "re", "do"];
        const drumLabels = [];
        let label;
        for (let i = 0; i < DRUMS.length; i++) {
            label = _(DRUMS[i]);
            drumLabels.push(label);
        }

        let categories;
        const colors = [];
        if (condition === "drumblocks") {
            noteLabels = drumLabels;
            categories = [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2];

            const COLORS = platformColor.piemenuVoicesColors;
            for (let i = 0; i < drumLabels.length; i++) {
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
            this._accidentalsWheel = new wheelnav("_accidentalsWheel", this._pitchWheel.raphael);
            this._octavesWheel = new wheelnav("_octavesWheel", this._pitchWheel.raphael);
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

        const accidentalLabels = [];
        let octaveLabels = [];
        let block, noteValue, octaveValue, accidentalsValue;

        if (condition === "pitchblocks") {
            this._accidentalsWheel.colors = platformColor.accidentalsWheelcolors;
            this._accidentalsWheel.slicePathFunction = slicePath().DonutSlice;
            this._accidentalsWheel.slicePathCustom = slicePath().DonutSliceCustomization();
            this._accidentalsWheel.slicePathCustom.minRadiusPercent = 0.5;
            this._accidentalsWheel.slicePathCustom.maxRadiusPercent = 0.75;
            this._accidentalsWheel.sliceSelectedPathCustom = this._accidentalsWheel.slicePathCustom;
            this._accidentalsWheel.sliceInitPathCustom = this._accidentalsWheel.slicePathCustom;

            for (let i = 0; i < accidentals.length; i++) {
                accidentalLabels.push(accidentals[i]);
            }

            for (let i = 0; i < 9; i++) {
                accidentalLabels.push(null);
                this._accidentalsWheel.colors.push(platformColor.accidentalsWheelcolorspush);
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
            octaveLabels = [
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

        const x = this._labelcols[index].getBoundingClientRect().x;
        const y = this._labelcols[index].getBoundingClientRect().y;

        docById("wheelDivptm").style.position = "absolute";
        docById("wheelDivptm").style.height = "300px";
        docById("wheelDivptm").style.width = "300px";
        docById("wheelDivptm").style.left =
            Math.min(
                this.activity.canvas.width - 200,
                Math.max(0, x * this.activity.getStageScale())
            ) + "px";
        docById("wheelDivptm").style.top =
            Math.min(
                this.activity.canvas.height - 250,
                Math.max(0, y * this.activity.getStageScale())
            ) + "px";

        if (!this._noteBlocks) {
            block = this.columnBlocksMap[index][0];
            noteValue = this.activity.blocks.blockList[
                this.activity.blocks.blockList[block].connections[1]
            ].value;

            if (condition === "pitchblocks") {
                octaveValue = this.activity.blocks.blockList[
                    this.activity.blocks.blockList[block].connections[2]
                ].value;
                accidentalsValue = 2;

                for (let i = 0; i < accidentals.length; i++) {
                    if (noteValue.indexOf(accidentals[i]) !== -1) {
                        accidentalsValue = i;
                        noteValue = noteValue.substr(0, noteValue.indexOf(accidentals[i]));
                        break;
                    }
                }

                this._accidentalsWheel.navigateWheel(accidentalsValue);
                this._octavesWheel.navigateWheel(octaveLabels.indexOf(octaveValue.toString()));
            }
            if (condition === "drumblocks") {
                this._pitchWheel.navigateWheel(
                    noteLabels.indexOf(
                        docBySelector('.labelcol[alt="' + index + '__drumblocks"]').innerText
                    )
                );
            } else {
                this._pitchWheel.navigateWheel(noteLabels.indexOf(noteValue));
            }
        }

        this._exitWheel.navItems[0].navigateFunction = () => {
            docById("wheelDivptm").style.display = "none";
            this._pitchWheel.removeWheel();
            this._exitWheel.removeWheel();
            if (condition === "pitchblocks") {
                this._accidentalsWheel.removeWheel();
                this._octavesWheel.removeWheel();
            }

            this.sorted = false;
            if (sortedClose === true) {
                this._sort();
            }
        };

        const __selectionChanged = () => {
            let label = this._pitchWheel.navItems[this._pitchWheel.selectedNavItemIndex].title;
            const i = noteLabels.indexOf(label);
            let attr, flag, z;
            let noteLabelBlock;
            let octave, noteObj;

            if (condition === "pitchblocks") {
                attr = this._accidentalsWheel.navItems[this._accidentalsWheel.selectedNavItemIndex]
                    .title;
                flag = false;
                if (attr !== "♮") {
                    label += attr;
                    flag = true;
                }
                // Allow sorting since sorted order might be lost
                this.sorted = false;
            }

            if (!this._noteBlocks) {
                noteLabelBlock = this.activity.blocks.blockList[block].connections[1];
                this.activity.blocks.blockList[noteLabelBlock].text.text = label;
                this.activity.blocks.blockList[noteLabelBlock].value = label;

                z = this.activity.blocks.blockList[noteLabelBlock].container.children.length - 1;
                this.activity.blocks.blockList[noteLabelBlock].container.setChildIndex(
                    this.activity.blocks.blockList[noteLabelBlock].text,
                    z
                );
                this.activity.blocks.blockList[noteLabelBlock].updateCache();
            }

            if (condition === "pitchblocks") {
                octave = Number(
                    this._octavesWheel.navItems[this._octavesWheel.selectedNavItemIndex].title
                );

                if (!this._noteBlocks) {
                    this.activity.blocks.blockList[noteLabelBlock].blocks.setPitchOctave(
                        this.activity.blocks.blockList[noteLabelBlock].connections[0],
                        octave
                    );
                }

                noteObj = [label, octave];
                if (flag) {
                    noteObj = getNote(
                        label,
                        octave,
                        0,
                        this.activity.turtles.ithTurtle(0).singer.keySignature,
                        false,
                        null,
                        this.activity.errorMsg,
                        this.activity.logo.synth.inTemperament
                    );
                }
                this.rowLabels[index] = noteObj[0];
                this.rowArgs[index] = noteObj[1];
            } else if (condition === "drumblocks") {
                this.rowLabels[index] = label;
            }

            let cell = this._headcols[index];
            const drumName = getDrumName(this.rowLabels[index]);
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
            const noteName = this.rowLabels[index];
            const w = window.innerWidth;
            const iconSize = PhraseMaker.ICONSIZE * (w / 1200);
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
            } else if (noteName in BELLSETIDX && this.rowArgs[index] === 4) {
                cell.innerHTML =
                    '<img src="' +
                    "images/8_bellset_key_" +
                    BELLSETIDX[noteName] +
                    ".svg" +
                    '" width="' +
                    cell.style.width +
                    '" vertical-align="middle">';
            } else if (noteName === "C" && this.rowArgs[index] === 5) {
                cell.innerHTML =
                    '<img src="' +
                    "images/8_bellset_key_8.svg" +
                    '" width="' +
                    cell.style.width +
                    '" vertical-align="middle">';
            }

            cell = this._labelcols[index];
            if (drumName != null) {
                cell.innerHTML = _(drumName);
                cell.style.fontSize = Math.floor(this._cellScale * 14) + "px";
            } else if (
                noteIsSolfege(this.rowLabels[i]) &&
                !isCustomTemperament(this.activity.logo.synth.inTemperament)
            ) {
                cell.innerHTML =
                    i18nSolfege(this.rowLabels[index]) + this.rowArgs[index].toString().sub();
                noteObj = getNote(
                    this.rowLabels[index],
                    this.rowArgs[index],
                    0,
                    this.activity.turtles.ithTurtle(0).singer.keySignature,
                    false,
                    null,
                    this.activity.errorMsg,
                    this.activity.logo.synth.inTemperament
                );
            } else {
                if (isCustomTemperament(this.activity.logo.synth.inTemperament)) {
                    noteObj = getNote(
                        this.rowLabels[i],
                        this.rowArgs[i],
                        0,
                        this.activity.turtles.ithTurtle(0).singer.keySignature,
                        false,
                        null,
                        this.activity.errorMsg,
                        this.activity.logo.synth.inTemperament
                    );
                    cell.innerHTML = this.rowLabels[i] + this.rowArgs[i].toString().sub();
                } else {
                    cell.innerHTML = this.rowLabels[i] + this.rowArgs[i].toString().sub();
                    noteObj = [this.rowLabels[i], this.rowArgs[i]];
                }
            }

            let noteStored = null;
            if (condition === "pitchblocks") {
                noteStored = noteObj[0] + noteObj[1];
            } else if (condition === "drumblocks") {
                noteStored = drumName;
            }

            this._noteStored[index] = noteStored;
        };

        const __pitchPreview = () => {
            let label = this._pitchWheel.navItems[this._pitchWheel.selectedNavItemIndex].title;
            let timeout = 0;
            let attr, octave, obj, tur;
            if (condition === "pitchblocks") {
                attr = this._accidentalsWheel.navItems[this._accidentalsWheel.selectedNavItemIndex]
                    .title;
                if (attr !== "♮") {
                    label += attr;
                }
                octave = Number(
                    this._octavesWheel.navItems[this._octavesWheel.selectedNavItemIndex].title
                );
                obj = getNote(
                    label,
                    octave,
                    0,
                    this.activity.turtles.ithTurtle(0).singer.keySignature,
                    false,
                    null,
                    this.activity.errorMsg,
                    this.activity.logo.synth.inTemperament
                );
                obj[0] = obj[0].replace(SHARP, "#").replace(FLAT, "b");
                this.activity.logo.synth.setMasterVolume(PREVIEWVOLUME);
                Singer.setSynthVolume(this.activity.logo, 0, DEFAULTVOICE, PREVIEWVOLUME);
                this.activity.logo.synth.trigger(
                    0,
                    [obj[0] + obj[1]],
                    1 / 8,
                    DEFAULTVOICE,
                    null,
                    null
                );
            } else if (condition === "drumblocks") {
                tur = this.activity.turtles.ithTurtle(0);

                if (
                    tur.singer.instrumentNames.length === 0 ||
                    tur.singer.instrumentNames.indexOf(label) === -1
                ) {
                    tur.singer.instrumentNames.push(label);
                    if (label === DEFAULTVOICE) {
                        this.activity.logo.synth.createDefaultSynth(0);
                    }

                    this.activity.logo.synth.loadSynth(0, label);
                    // give the synth time to load
                    timeout = 500;
                } else {
                    timeout = 0;
                }

                setTimeout(() => {
                    this.activity.logo.synth.setMasterVolume(DEFAULTVOLUME);
                    Singer.setSynthVolume(this.activity.logo, 0, label, DEFAULTVOLUME);
                    this.activity.logo.synth.trigger(0, "G4", 1 / 4, label, null, null, false);
                    this.activity.logo.synth.start();
                }, timeout);
            }
            __selectionChanged();
        };

        for (let i = 0; i < noteLabels.length; i++) {
            this._pitchWheel.navItems[i].navigateFunction = __pitchPreview;
        }
        if (condition === "pitchblocks") {
            for (let i = 0; i < accidentals.length; i++) {
                this._accidentalsWheel.navItems[i].navigateFunction = __pitchPreview;
            }

            for (let i = 0; i < 8; i++) {
                this._octavesWheel.navItems[i].navigateFunction = __pitchPreview;
            }
        }
    }

    _blockReplace(oldblk, newblk) {
        // Find the connections from the old block
        const c0 = this.activity.blocks.blockList[oldblk].connections[0];
        const c1 = last(this.activity.blocks.blockList[oldblk].connections);

        // Connect the new block
        this.activity.blocks.blockList[newblk].connections[0] = c0;
        this.activity.blocks.blockList[newblk].connections[
            this.activity.blocks.blockList[newblk].connections.length - 1
        ] = c1;

        if (c0 != null) {
            for (let i = 0; i < this.activity.blocks.blockList[c0].connections.length; i++) {
                if (this.activity.blocks.blockList[c0].connections[i] === oldblk) {
                    this.activity.blocks.blockList[c0].connections[i] = newblk;
                    break;
                }
            }

            // Look for a containing clamp, which may need to be resized.
            let blockAbove = c0;
            while (blockAbove !== this.blockNo) {
                if (this.activity.blocks.blockList[blockAbove].isClampBlock()) {
                    this.activity.blocks.clampBlocksToCheck.push([blockAbove, 0]);
                }

                blockAbove = this.activity.blocks.blockList[blockAbove].connections[0];
            }

            this.activity.blocks.clampBlocksToCheck.push([this.blockNo, 0]);
        }

        if (c1 != null) {
            for (let i = 0; i < this.activity.blocks.blockList[c1].connections.length; i++) {
                if (this.activity.blocks.blockList[c1].connections[i] === oldblk) {
                    this.activity.blocks.blockList[c1].connections[i] = newblk;
                    break;
                }
            }
        }

        // Refresh the dock positions
        this.activity.blocks.adjustDocks(c0, true);

        // Send the old block to the trash
        this.activity.blocks.blockList[oldblk].connections[0] = null;
        this.activity.blocks.blockList[oldblk].connections[
            this.activity.blocks.blockList[oldblk].connections.length - 1
        ] = null;
        this.activity.blocks.sendStackToTrash(this.activity.blocks.blockList[oldblk]);

        this.activity.refreshCanvas();
    }

    _addNotesBlockBetween(aboveBlock, block, topBlock) {
        let belowBlock;
        if (topBlock) {
            belowBlock = this.activity.blocks.blockList[aboveBlock].connections[1];
            this.activity.blocks.blockList[aboveBlock].connections[1] = block;
        } else {
            belowBlock = last(this.activity.blocks.blockList[aboveBlock].connections);
            this.activity.blocks.blockList[aboveBlock].connections[
                this.activity.blocks.blockList[aboveBlock].connections.length - 1
            ] = block;
        }

        this.activity.blocks.blockList[belowBlock].connections[0] = block;
        this.activity.blocks.blockList[block].connections[0] = aboveBlock;
        this.activity.blocks.blockList[block].connections[
            this.activity.blocks.blockList[block].connections.length - 1
        ] = belowBlock;
        this.activity.blocks.adjustDocks(this.blockNo, true);
        this.activity.blocks.clampBlocksToCheck.push([this.blockNo, 0]);
        this.activity.refreshCanvas();
    }

    _removePitchBlock(blockNo) {
        const c0 = this.activity.blocks.blockList[blockNo].connections[0];
        const c1 = last(this.activity.blocks.blockList[blockNo].connections);
        this.activity.blocks.blockList[c0].connections[
            this.activity.blocks.blockList[c0].connections.length - 1
        ] = c1;
        this.activity.blocks.blockList[c1].connections[0] = c0;

        this.activity.blocks.blockList[blockNo].connections[
            this.activity.blocks.blockList[blockNo].connections.length - 1
        ] = null;
        this.activity.blocks.sendStackToTrash(this.activity.blocks.blockList[blockNo]);
        this.activity.blocks.adjustDocks(this.blockNo, true);
        this.activity.blocks.clampBlocksToCheck.push([this.blockNo, 0]);
        this.activity.refreshCanvas();
    }

    _generateDataURI(file) {
        const data = "data: text/html;charset=utf-8, " + encodeURIComponent(file);
        return data;
    }

    _sort() {
        if (this.sorted) {
            return;
        }

        // Keep track of marked cells.
        this._markedColsInRow = [];
        let thisRow, row, n, cell;
        for (let r = 0; r < this.rowLabels.length; r++) {
            thisRow = [];
            row = this._rows[r];
            n = row.cells.length;
            for (let i = 0; i < n; i++) {
                cell = row.cells[i];
                if (cell.style.backgroundColor === "black") {
                    thisRow.push(i);
                }
            }
            this._markedColsInRow.push(thisRow);
        }

        const sortableList = [];
        let drumName;
        // Make a list to sort, skipping drums and graphics.
        // frequency;label;arg;row index
        for (let i = 0; i < this.rowLabels.length; i++) {
            if (this.rowLabels[i].toLowerCase() === "rest") {
                continue;
            }

            drumName = getDrumName(this.rowLabels[i]);
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
                        this.activity.turtles.ithTurtle(0).singer.keySignature
                    ),
                    this.rowLabels[i],
                    this.rowArgs[i],
                    i,
                    this._noteStored[i]
                ]);
            }
        }

        // Add the stuff we didn't sort.
        for (let i = 0; i < this.rowLabels.length; i++) {
            drumName = getDrumName(this.rowLabels[i]);
            if (drumName != null) {
                sortableList.push([
                    -1 * i,
                    this.rowLabels[i],
                    this.rowArgs[i],
                    i,
                    this._noteStored[i]
                ]);
            }
        }

        let gi;
        for (let i = 0; i < this.rowLabels.length; i++) {
            if (MATRIXGRAPHICS.indexOf(this.rowLabels[i]) !== -1) {
                gi = MATRIXGRAPHICS.indexOf(this.rowLabels[i]) + 100;
                sortableList.push([
                    -gi,
                    this.rowLabels[i],
                    this.rowArgs[i],
                    i,
                    this._noteStored[i]
                ]);
            } else if (MATRIXGRAPHICS2.indexOf(this.rowLabels[i]) !== -1) {
                gi = MATRIXGRAPHICS.indexOf(this.rowLabels[i]) + 200;
                sortableList.push([
                    -gi,
                    this.rowLabels[i],
                    this.rowArgs[i],
                    i,
                    this._noteStored[i]
                ]);
            }
        }

        let sortedList = sortableList.sort((a, b) => {
            return a[0] - b[0];
        });

        // Reverse since we start from the top of the table.
        sortedList = sortedList.reverse();

        this.rowLabels = [];
        this.rowArgs = [];
        this._sortedRowMap = [];

        // Build a table to map back to original order.
        this._rowMapper = [];
        for (let i = 0; i < sortedList.length; i++) {
            this._rowMapper.push(sortedList[i][3]);
        }
        const newColumnBlockMap = [];
        const oldColumnBlockMap = this.columnBlocksMap;
        for (let i = 0; i < this._rowMapper.length; i++) {
            newColumnBlockMap.push(this.columnBlocksMap[this._rowMapper[i]]);
        }
        this.columnBlocksMap = newColumnBlockMap;
        let lastObj = 0;
        let obj;
        for (let i = 0; i < sortedList.length; i++) {
            obj = sortedList[i];

            this._rowMap[obj[3]] = i;
            this._noteStored[i] = obj[4];

            if (i === 0) {
                this._sortedRowMap.push(0);
            } else if (i > 0 && obj[1] !== "hertz" && obj[1] === last(this.rowLabels)) {
                //eslint-disable-next-line no-console
                console.debug("skipping " + obj[1] + " " + last(this.rowLabels));
                this._sortedRowMap.push(last(this._sortedRowMap));
                if (oldColumnBlockMap[sortedList[lastObj][3]] != undefined) {
                    setTimeout(
                        this._removePitchBlock(oldColumnBlockMap[sortedList[lastObj][3]][0]),
                        500
                    );
                    this.columnBlocksMap = this.columnBlocksMap.filter((ele) => {
                        return ele[0] !== oldColumnBlockMap[sortedList[lastObj][3]][0];
                    });
                    lastObj = i;
                }
                // skip duplicates
                for (let j = this._rowMap[i]; j < this._rowMap.length; j++) {
                    this._rowOffset[j] -= 1;
                }

                this._rowMap[i] = this._rowMap[i - 1];
                continue;
            } else {
                //eslint-disable-next-line no-console
                console.debug("pushing " + obj[1] + " " + last(this.rowLabels));
                this._sortedRowMap.push(last(this._sortedRowMap) + 1);
                lastObj = i;
                this.stylePhraseMaker();
            }

            this.rowLabels.push(obj[1]);
            this.rowArgs.push(Number(obj[2]));
        }

        this._matrixHasTuplets = false; // Force regeneration of tuplet rows.
        this.sorted = true;
        this.init(this.activity);
        this.sorted = true;

        let tupletParam;
        for (let i = 0; i < this.activity.logo.tupletRhythms.length; i++) {
            switch (this.activity.logo.tupletRhythms[i][0]) {
                case "simple":
                case "notes":
                    tupletParam = [
                        this.activity.logo.tupletParams[this.activity.logo.tupletRhythms[i][1]]
                    ];
                    tupletParam.push([]);
                    for (let j = 2; j < this.activity.logo.tupletRhythms[i].length; j++) {
                        tupletParam[1].push(this.activity.logo.tupletRhythms[i][j]);
                    }

                    this.addTuplet(tupletParam);
                    break;
                default:
                    this.addNotes(
                        this.activity.logo.tupletRhythms[i][1],
                        this.activity.logo.tupletRhythms[i][2]
                    );
                    break;
            }
        }

        this.makeClickable();
    }

    _export() {
        const exportWindow = window.open("");
        const exportDocument = exportWindow.document;
        if (exportDocument === undefined) {
            //eslint-disable-next-line no-console
            console.debug("Could not create export window");
            return;
        }

        const title = exportDocument.createElement("title");
        title.innerHTML = "Music Matrix";
        exportDocument.head.appendChild(title);

        const w = exportDocument.createElement("H3");
        w.innerHTML = "Music Matrix";

        exportDocument.body.appendChild(w);

        const x = exportDocument.createElement("TABLE");
        x.setAttribute("id", "exportTable");
        x.style.textAlign = "center";

        exportDocument.body.appendChild(x);

        const exportTable = exportDocument.getElementById("exportTable");

        const header = exportTable.createTHead();

        let exportLabel, exportRow, drumName, blockLabel, exportCell;
        let noteValueRow, col;
        for (let i = 0; i < this.rowLabels.length; i++) {
            exportRow = header.insertRow();
            // Add the row label...
            exportLabel = exportRow.insertCell();

            drumName = getDrumName(this.rowLabels[i]);
            if (drumName != null) {
                exportLabel.innerHTML = _(drumName);
                exportLabel.style.fontSize = Math.floor(this._cellScale * 14) + "px";
            } else if (this.rowLabels[i].slice(0, 4) === "http") {
                exportLabel.innerHTML = this.rowLabels[i];
                exportLabel.style.fontSize = Math.floor(this._cellScale * 14) + "px";
            } else if (MATRIXSYNTHS.indexOf(this.rowLabels[i]) !== -1) {
                exportLabel.innerHTML = this.rowArgs[i];
                exportLabel.style.fontSize = Math.floor(this._cellScale * 14) + "px";
            } else if (MATRIXGRAPHICS.indexOf(this.rowLabels[i]) !== -1) {
                blockLabel = this.activity.blocks.protoBlockDict[this.rowLabels[i]][
                    "staticLabels"
                ][0];
                exportLabel.innerHTML = blockLabel + "<br>" + this.rowArgs[i];
                exportLabel.style.fontSize = Math.floor(this._cellScale * 12) + "px";
            } else if (MATRIXGRAPHICS2.indexOf(this.rowLabels[i]) !== -1) {
                blockLabel = this.activity.blocks.protoBlockDict[this.rowLabels[i]][
                    "staticLabels"
                ][0];
                exportLabel.innerHTML =
                    blockLabel + "<br>" + this.rowArgs[i][0] + " " + this.rowArgs[i][1];
                exportLabel.style.fontSize = Math.floor(this._cellScale * 12) + "px";
            } else {
                if (noteIsSolfege(this.rowLabels[i])) {
                    exportLabel.innerHTML =
                        i18nSolfege(this.rowLabels[i]) + this.rowArgs[i].toString().sub();
                } else {
                    exportLabel.innerHTML = this.rowLabels[i] + this.rowArgs[i].toString().sub();
                }
            }

            // Add then the note cells.
            for (let j = 0, col; (col = this._rows[i].cells[j]); j++) {
                exportCell = exportRow.insertCell();
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
            exportRow = header.insertRow();
            exportLabel = exportRow.insertCell();
            exportLabel.innerHTML = _("note value");
            noteValueRow = this._tupletNoteValueRow;
            for (let i = 0; i < noteValueRow.cells.length; i++) {
                exportCell = exportRow.insertCell();
                col = noteValueRow.cells[i];
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
            exportRow = header.insertRow();
            exportLabel = exportRow.insertCell();
            exportLabel.innerHTML = _("tuplet value");
            noteValueRow = this._tupletValueRow;
            for (let i = 0; i < noteValueRow.cells.length; i++) {
                exportCell = exportRow.insertCell();
                col = noteValueRow.cells[i];
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
        exportRow = header.insertRow();
        exportLabel = exportRow.insertCell();
        exportLabel.innerHTML = _("note value");
        noteValueRow = this._noteValueRow;
        for (let i = 0; i < noteValueRow.cells.length; i++) {
            exportCell = exportRow.insertCell();
            col = noteValueRow.cells[i];
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

        const saveDocument = exportDocument;
        const uriData = saveDocument.documentElement.outerHTML;
        exportDocument.body.innerHTML +=
            '<br><a id="downloadb1" style="background: #C374E9;' +
            "border-radius: 5%;" +
            "padding: 0.3em;" +
            "text-decoration: none;" +
            "margin: 0.5em;" +
            'color: white;" ' +
            "download>Download Matrix</a>";
        exportDocument.getElementById("downloadb1").download = "MusicMatrix";
        exportDocument.getElementById("downloadb1").href = this._generateDataURI(uriData);
        exportDocument.close();
    }

    // Deprecated
    note2Solfege(note, index) {
        let octave, newNote;
        if (["♭", "♯"].indexOf(note[1]) === -1) {
            octave = note[1];
            newNote = SOLFEGECONVERSIONTABLE[note[0]];
        } else {
            octave = note[2];
            newNote = SOLFEGECONVERSIONTABLE[note.substr(0, 2)];
        }
        this.rowLabels[index] = newNote;
        this.rowArgs[index] = octave;
    }

    addTuplet(param) {
        // The first two parameters are the interval for the tuplet,
        // e.g., 1/4; the rest of the parameters are the list of notes
        // to be added to the tuplet, e.g., 1/8, 1/8, 1/8.

        const tupletTimeFactor = param[0][0] / param[0][1];
        const numberOfNotes = param[1].length;
        let totalNoteInterval = 0;
        // const ptmTable = docById("ptmTable");
        let lcd;
        for (let i = 0; i < numberOfNotes; i++) {
            if (i === 0) {
                lcd = param[1][0];
            } else {
                lcd = LCD(lcd, param[1][i]);
            }

            totalNoteInterval += 32 / param[1][i];
        }

        let tupletValue = 0;
        for (let i = 0; i < numberOfNotes; i++) {
            if (param[1][i] > 0) {
                tupletValue += lcd / param[1][i];
            }
        }

        const noteValue = param[0][1] / param[0][0];
        // The tuplet is note value is calculated as #notes x note value
        let noteValueToDisplay = calcNoteValueToDisplay(param[0][1], param[0][0]);

        if (noteValue > 12) {
            noteValueToDisplay =
                '<a href="#" title="' + param[0][0] + "/" + param[0][1] + '">.</a>';
        }

        // Set the cells to 'rest'
        for (let i = 0; i < numberOfNotes; i++) {
            // The tuplet time factor * percentage of the tuplet that
            // is dedicated to this note
            this._notesToPlay.push([["R"], (totalNoteInterval * param[0][1]) / (32 / param[1][i])]);
            this._outputAsTuplet.push([numberOfNotes, noteValue]);
        }

        // First, ensure that the matrix is set up for tuplets.
        let firstRow, labelCell, noteRow, valueRow, cell;
        if (!this._matrixHasTuplets) {
            firstRow = this._rows[0];

            // Load the labels
            labelCell = this._tupletNoteLabel;
            labelCell.innerHTML = _("note value");
            labelCell.style.fontSize = this._cellScale * 75 + "%";
            labelCell.style.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + "px";
            labelCell.style.width = Math.floor(2 * MATRIXSOLFEWIDTH * this._cellScale) + "px";
            labelCell.style.minWidth = labelCell.style.width;
            labelCell.style.maxWidth = labelCell.style.width;
            labelCell.style.backgroundColor = platformColor.labelColor;

            labelCell = this._tupletValueLabel;
            labelCell.innerHTML = _("tuplet value");
            labelCell.style.fontSize = this._cellScale * 75 + "%";
            labelCell.style.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + "px";
            labelCell.style.width = Math.floor(2 * MATRIXSOLFEWIDTH * this._cellScale) + "px";
            labelCell.style.minWidth = labelCell.style.width;
            labelCell.style.maxWidth = labelCell.style.width;
            labelCell.style.backgroundColor = platformColor.labelColor;

            // Fill in the columns in the tuplet note value row up to
            // where the tuplet begins.
            noteRow = this._tupletNoteValueRow;
            valueRow = this._tupletValueRow;
            for (let i = 0; i < firstRow.cells.length; i++) {
                cell = noteRow.insertCell();
                cell.style.backgroundColor = platformColor.tupletBackground;
                cell.style.width = firstRow.cells[i].style.width;
                cell.style.minWidth = firstRow.cells[i].style.minWidth;
                cell.style.maxWidth = firstRow.cells[i].style.maxWidth;
                cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + "px";

                cell = valueRow.insertCell();
                cell.style.backgroundColor = platformColor.tupletBackground;
                cell.style.width = firstRow.cells[i].style.width;
                cell.style.minWidth = firstRow.cells[i].style.minWidth;
                cell.style.maxWidth = firstRow.cells[i].style.maxWidth;
                cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + "px";
            }
        }

        // Now add the tuplet to the matrix.
        const tupletNoteValue = noteValue * tupletValue;
        let numerator, thisNoteValue, obj;
        let cellWidth, cellColor;
        let ptmRow, drumName;
        // Add the tuplet notes
        for (let i = 0; i < numberOfNotes; i++) {
            // Add the notes to the tuplet notes row too.
            // Add cell for tuplet note values
            noteRow = this._tupletNoteValueRow;
            cell = noteRow.insertCell(-1);
            numerator = 32 / param[1][i];
            thisNoteValue = 1 / (numerator / (totalNoteInterval / tupletTimeFactor));
            cell.style.backgroundColor = platformColor.tupletBackground;
            cell.style.width = this._noteWidth(thisNoteValue) + "px";
            cell.style.minWidth = cell.style.width;
            cell.style.maxWidth = cell.style.width;
            cell.style.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + "px";
            cell.setAttribute("id", 1 / tupletNoteValue);
            cell.style.lineHeight = 60 + "%";
            cell.style.fontSize = this._cellScale * 75 + "%";
            cell.style.textAlign = "center";
            obj = toFraction(numerator / (totalNoteInterval / tupletTimeFactor));

            if (obj[1] < 13) {
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
                    cell.innerHTML = obj[0] + "<br>&mdash;<br>" + obj[1] + "<br><br>";
                }
            } else {
                cell.innerHTML = "";
            }

            cellWidth = cell.style.width;

            // Add the notes to the matrix a la addNote.
            for (let j = 0; j < this.rowLabels.length; j++) {
                // Depending on the row, we choose a different background color.
                if (MATRIXGRAPHICS.indexOf(this.rowLabels[j]) != -1) {
                    cellColor = platformColor.graphicsBackground;
                } else {
                    drumName = getDrumName(this.rowLabels[j]);
                    if (drumName === null) {
                        cellColor = platformColor.pitchBackground;
                    } else {
                        cellColor = platformColor.drumBackground;
                    }
                }

                ptmRow = this._rows[j];
                cell = ptmRow.insertCell();

                cell.setAttribute("cellColor", cellColor);

                cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + "px";
                // Using the alt attribute to store the note value
                cell.setAttribute("alt", 1 / tupletNoteValue);
                cell.style.width = cellWidth;
                cell.style.minWidth = cell.style.width;
                cell.style.maxWidth = cell.style.width;
                cell.style.backgroundColor = cellColor;

                cell.onmouseover = (event) => {
                    if (event.target.style.backgroundColor !== "black") {
                        event.target.style.backgroundColor = platformColor.selectorSelected;
                    }
                };

                cell.onmouseout = (event) => {
                    if (event.target.style.backgroundColor !== "black") {
                        event.target.style.backgroundColor = event.target.getAttribute("cellColor");
                    }
                };
            }
        }

        // Add the tuplet value as a span
        valueRow = this._tupletValueRow;
        cell = valueRow.insertCell();
        cell.colSpan = numberOfNotes;
        cell.style.fontSize = Math.floor(this._cellScale * 75) + "%";
        cell.style.lineHeight = 60 + "%";
        cell.style.width = this._noteWidth(noteValue) + "px";
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + "px";
        cell.style.textAlign = "center";
        cell.innerHTML = tupletValue;
        cell.style.backgroundColor = platformColor.tupletBackground;

        // And a span in the note value column too.
        const noteValueRow = this._noteValueRow;
        cell = noteValueRow.insertCell();
        cell.colSpan = numberOfNotes;
        cell.style.fontSize = Math.floor(this._cellScale * 75) + "%";
        cell.style.lineHeight = 60 + "%";
        cell.style.width = this._noteWidth(noteValue) + "px";
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + "px";
        cell.style.textAlign = "center";
        cell.innerHTML = noteValueToDisplay;
        cell.style.backgroundColor = platformColor.rhythmcellcolor;
        this._matrixHasTuplets = true;
    }

    _noteWidth(noteValue) {
        return Math.max(Math.floor(EIGHTHNOTEWIDTH * (8 / noteValue) * this._cellScale), 15);
    }

    addNotes(numBeats, noteValue) {
        let noteValueToDisplay = calcNoteValueToDisplay(noteValue, 1);

        if (noteValue > 12) {
            noteValueToDisplay = '<a href="#" title="' + 1 + "/" + noteValue + '">.</a>';
        }

        for (let i = 0; i < numBeats; i++) {
            this._notesToPlay.push([["R"], noteValue]);
            this._outputAsTuplet.push([numBeats, noteValue]);
        }

        const rowCount = this.rowLabels.length - this._rests;
        let drumName, row, cell, cellColor;
        for (let j = 0; j < numBeats; j++) {
            for (let i = 0; i < rowCount; i++) {
                // Depending on the row, we choose a different background color.
                if (
                    MATRIXGRAPHICS.indexOf(this.rowLabels[i]) != -1 ||
                    MATRIXGRAPHICS2.indexOf(this.rowLabels[i]) != -1
                ) {
                    cellColor = platformColor.graphicsBackground;
                } else {
                    drumName = getDrumName(this.rowLabels[i]);
                    if (drumName === null) {
                        cellColor = platformColor.pitchBackground;
                    } else {
                        cellColor = platformColor.drumBackground;
                    }
                }

                // the buttons get add to the embedded table
                row = this._rows[i];
                cell = row.insertCell();

                cell.setAttribute("cellColor", cellColor);
                cell.style.borderRadius = "6px";
                cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + "px";
                cell.style.width = this._noteWidth(noteValue) + "px";
                cell.style.minWidth = cell.style.width;
                cell.style.maxWidth = cell.style.width;
                cell.style.backgroundColor = cellColor;
                // Using the alt attribute to store the note value
                cell.setAttribute("alt", 1 / noteValue);

                cell.onmouseover = (event) => {
                    if (event.target.style.backgroundColor !== "black") {
                        event.target.style.backgroundColor = platformColor.selectorSelected;
                    }
                };

                cell.onmouseout = (event) => {
                    if (event.target.style.backgroundColor !== "black") {
                        event.target.style.backgroundColor = event.target.getAttribute("cellColor");
                    }
                };
            }

            // Add a note value.
            row = this._noteValueRow;
            cell = row.insertCell();
            cell.style.width = this._noteWidth(noteValue) + "px";
            cell.style.minWidth = cell.style.width;
            cell.style.maxWidth = cell.style.width;
            cell.style.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + "px";
            cell.style.fontSize = Math.floor(this._cellScale * 75) + "%";
            cell.style.lineHeight = 60 + "%";
            cell.style.textAlign = "center";
            cell.innerHTML = noteValueToDisplay;
            cell.style.backgroundColor = platformColor.rhythmcellcolor;
            cell.setAttribute("alt", noteValue);

            if (this._matrixHasTuplets) {
                // We may need to insert some blank cells in the extra rows
                // added by tuplets.
                row = this._tupletNoteValueRow;
                cell = row.insertCell();
                cell.style.width = this._noteWidth(noteValue) + "px";
                cell.style.minWidth = cell.style.width;
                cell.style.maxWidth = cell.style.width;
                cell.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + "px";
                cell.style.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + "px";
                cell.style.backgroundColor = platformColor.tupletBackground;

                row = this._tupletValueRow;
                cell = row.insertCell();
                cell.style.width = this._noteWidth(noteValue) + "px";
                cell.style.minWidth = cell.style.width;
                cell.style.maxWidth = cell.style.width;
                cell.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + "px";
                cell.style.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + "px";
                cell.style.backgroundColor = platformColor.tupletBackground;
            }
        }
    }

    _lookForNoteBlocksOrRepeat() {
        this._noteBlocks = false;
        const bno = this.blockNo;
        let blk;
        for (let i = 0; i < this._blockMap[bno].length; i++) {
            blk = this._blockMap[bno][i][1][0];
            if (blk === -1) {
                continue;
            }

            if (this.activity.blocks.blockList[blk] === null) {
                continue;
            }

            if (this.activity.blocks.blockList[blk] === undefined) {
                //eslint-disable-next-line no-console
                console.debug("block " + blk + " is undefined");
                continue;
            }

            if (
                this.activity.blocks.blockList[blk].name === "newnote" ||
                this.activity.blocks.blockList[blk].name === "repeat"
            ) {
                this._noteBlocks = true;
                break;
            }
        }
    }

    _syncMarkedBlocks() {
        const newBlockMap = [];
        const blk = this.blockNo;
        for (let i = 0; i < this._blockMap[blk].length; i++) {
            if (this._blockMap[blk][i][0] === -1) {
                continue;
            }

            for (let j = 0; j < this._blockMapHelper.length; j++) {
                if (
                    JSON.stringify(this._blockMap[blk][i][1]) ===
                    JSON.stringify(this._blockMapHelper[j][0])
                ) {
                    for (let k = 0; k < this._blockMapHelper[j][1].length; k++) {
                        newBlockMap.push([
                            this._blockMap[blk][i][0],
                            this._colBlocks[this._blockMapHelper[j][1][k]],
                            this._blockMap[blk][i][2]
                        ]);
                    }
                }
            }
        }

        this._blockMap[blk] = newBlockMap.filter((el, i) => {
            return (
                i ===
                newBlockMap.findIndex((ele) => {
                    return JSON.stringify(ele) === JSON.stringify(el);
                })
            );
        });
    }

    blockConnection(len, bottomOfClamp) {
        const n = this.activity.blocks.blockList.length - len;
        let c;
        if (bottomOfClamp == null) {
            this.activity.blocks.blockList[this.blockNo].connections[2] = n;
            this.activity.blocks.blockList[n].connections[0] = this.blockNo;
        } else {
            c = this.activity.blocks.blockList[bottomOfClamp].connections.length - 1;
            this.activity.blocks.blockList[bottomOfClamp].connections[c] = n;
            this.activity.blocks.blockList[n].connections[0] = bottomOfClamp;
        }

        this.activity.blocks.clampBlocksToCheck.push([this.blockNo, 0]);
        this.activity.blocks.adjustDocks(this.blockNo, true);
    }

    _deleteRhythmBlock(blockToDelete) {
        if (last(this.activity.blocks.blockList[blockToDelete].connections) !== null) {
            this.activity.blocks.sendStackToTrash(
                this.activity.blocks.blockList[
                    last(this.activity.blocks.blockList[blockToDelete].connections)
                ]
            );
        }
        this.activity.blocks.sendStackToTrash(this.activity.blocks.blockList[blockToDelete]);
        this.activity.blocks.adjustDocks(this.blockNo, true);
        this.activity.refreshCanvas();
    }

    _addRhythmBlock(value, times) {
        let RHYTHMOBJ = [];
        value = toFraction(value);
        const topOfClamp = this.activity.blocks.blockList[this.blockNo].connections[1];
        const bottomOfClamp = this.activity.blocks.findBottomBlock(topOfClamp);
        if (this.activity.blocks.blockList[bottomOfClamp].name === "vspace") {
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
        this.activity.blocks.loadNewBlocks(RHYTHMOBJ);
        if (this.activity.blocks.blockList[bottomOfClamp].name === "vspace") {
            setTimeout(this.blockConnection(6, bottomOfClamp), 500);
        } else {
            setTimeout(this.blockConnection(7, bottomOfClamp), 500);
        }
        this.activity.refreshCanvas();
    }

    _update(i, value, k, noteCase) {
        const updates = [];
        value = toFraction(value);
        if (noteCase === "tupletnote") {
            updates.push(
                this.activity.blocks.blockList[this.activity.blocks.blockList[i].connections[1]]
                    .connections[1]
            );
            updates.push(
                this.activity.blocks.blockList[this.activity.blocks.blockList[i].connections[1]]
                    .connections[2]
            );
        } else {
            updates.push(
                this.activity.blocks.blockList[this.activity.blocks.blockList[i].connections[2]]
                    .connections[1]
            );
            updates.push(
                this.activity.blocks.blockList[this.activity.blocks.blockList[i].connections[2]]
                    .connections[2]
            );
        }
        if (noteCase === "rhythm" || noteCase === "stupletvalue") {
            updates.push(this.activity.blocks.blockList[i].connections[1]);
            this.activity.blocks.blockList[updates[2]].value = parseFloat(k);
            this.activity.blocks.blockList[updates[2]].text.text = k.toString();
            this.activity.blocks.blockList[updates[2]].updateCache();
        }
        if (
            noteCase === "rhythm" ||
            noteCase === "stuplet" ||
            (noteCase === "tupletnote" && value !== null)
        ) {
            this.activity.blocks.blockList[updates[0]].value = parseFloat(value[1]);
            this.activity.blocks.blockList[updates[0]].text.text = value[1].toString();
            this.activity.blocks.blockList[updates[0]].updateCache();
            this.activity.blocks.blockList[updates[1]].value = parseFloat(value[0]);
            this.activity.blocks.blockList[updates[1]].text.text = value[0].toString();
            this.activity.blocks.blockList[updates[1]].updateCache();
            this.activity.refreshCanvas();
        }
        this.activity.saveLocally();
    }

    _mapNotesBlocks(blockName, withName) {
        const notesBlockMap = [];
        let blk = this.activity.blocks.blockList[this.blockNo].connections[1];
        let myBlock = this.activity.blocks.blockList[blk];

        let bottomBlockLoop = 0;
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
            if (bottomBlockLoop > 2 * this.activity.blocks.blockList) {
                // Could happen if the block data is malformed.
                break;
            }

            blk = last(myBlock.connections);
            myBlock = this.activity.blocks.blockList[blk];
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
    }

    recalculateBlocks() {
        const adjustedNotes = [];
        adjustedNotes.push([this.activity.logo.tupletRhythms[0][2], 1]);
        let startidx = 1;
        for (let i = 1; i < this.activity.logo.tupletRhythms.length; i++) {
            if (this.activity.logo.tupletRhythms[i][2] === last(adjustedNotes)[0]) {
                startidx += 1;
            } else {
                adjustedNotes[adjustedNotes.length - 1][1] = startidx;
                adjustedNotes.push([this.activity.logo.tupletRhythms[i][2], 1]);
                startidx = 1;
            }
        }
        if (startidx > 1) {
            adjustedNotes[adjustedNotes.length - 1][1] = startidx;
        }
        return adjustedNotes;
    }

    _readjustNotesBlocks() {
        let notesBlockMap = this._mapNotesBlocks("rhythm2");
        const adjustedNotes = this.recalculateBlocks();

        const colBlocks = [];
        const n = adjustedNotes.length - notesBlockMap.length;
        if (n >= 0) {
            for (let i = 0; i < notesBlockMap.length; i++) {
                this._update(notesBlockMap[i], adjustedNotes[i][0], adjustedNotes[i][1], "rhythm");
            }
        } else {
            for (let i = 0; i < adjustedNotes.length; i++) {
                this._update(notesBlockMap[i], adjustedNotes[i][0], adjustedNotes[i][1], "rhythm");
            }
        }

        for (let i = 0; i < n; i++) {
            this._addRhythmBlock(
                adjustedNotes[notesBlockMap.length + i][0],
                adjustedNotes[notesBlockMap.length + i][1]
            );
        }
        for (let i = n; i < 0; i++) {
            this._deleteRhythmBlock(notesBlockMap[notesBlockMap.length + i]);
        }
        notesBlockMap = this._mapNotesBlocks("rhythm2");
        for (let i = 0; i < notesBlockMap.length; i++) {
            for (let j = 0; j < adjustedNotes[i][1]; j++) {
                colBlocks.push([notesBlockMap[i], j]);
            }
        }
        this._colBlocks = colBlocks;
    }

    _restartGrid() {
        this._matrixHasTuplets = false; // Force regeneration of tuplet rows.
        this.sorted = true;
        this.init(this.activity);
        this.sorted = false;

        let tupletParam;
        for (let i = 0; i < this.activity.logo.tupletRhythms.length; i++) {
            switch (this.activity.logo.tupletRhythms[i][0]) {
                case "simple":
                case "notes":
                    tupletParam = [
                        this.activity.logo.tupletParams[this.activity.logo.tupletRhythms[i][1]]
                    ];
                    tupletParam.push([]);
                    for (let j = 2; j < this.activity.logo.tupletRhythms[i].length; j++) {
                        tupletParam[1].push(this.activity.logo.tupletRhythms[i][j]);
                    }

                    this.addTuplet(tupletParam);
                    break;
                default:
                    this.addNotes(
                        this.activity.logo.tupletRhythms[i][1],
                        this.activity.logo.tupletRhythms[i][2]
                    );
                    break;
            }
        }

        this.makeClickable();
        docById("wheelDivptm").style.display = "none";
        this._menuWheel.removeWheel();
        this._exitWheel.removeWheel();
    }

    _addNotes(noteToDivide, notesToAdd) {
        noteToDivide = parseInt(noteToDivide);
        this._blockMapHelper = [];
        for (let i = 0; i <= noteToDivide; i++) {
            this._blockMapHelper.push([this._colBlocks[i], [i]]);
        }
        for (let i = noteToDivide + 1; i < this.activity.logo.tupletRhythms.length; i++) {
            this._blockMapHelper.push([this._colBlocks[i], [i + parseInt(notesToAdd)]]);
        }
        for (let i = 0; i < parseInt(notesToAdd); i++) {
            this.activity.logo.tupletRhythms = this.activity.logo.tupletRhythms
                .slice(0, noteToDivide + i + 1)
                .concat(this.activity.logo.tupletRhythms.slice(noteToDivide + i));
        }
        this._readjustNotesBlocks();
        this._syncMarkedBlocks();
        this._restartGrid.call(this);
    }

    _deleteNotes(noteToDivide) {
        if (this.activity.logo.tupletRhythms.length === 1) {
            return;
        }
        noteToDivide = parseInt(noteToDivide);
        this._blockMapHelper = [];
        for (let i = 0; i < noteToDivide; i++) {
            this._blockMapHelper.push([this._colBlocks[i], [i]]);
        }
        for (let i = noteToDivide + 1; i < this.activity.logo.tupletRhythms.length; i++) {
            this._blockMapHelper.push([this._colBlocks[i], [i - 1]]);
        }
        this.activity.logo.tupletRhythms = this.activity.logo.tupletRhythms
            .slice(0, noteToDivide)
            .concat(this.activity.logo.tupletRhythms.slice(noteToDivide + 1));
        this._readjustNotesBlocks();
        this._syncMarkedBlocks();
        this._restartGrid.call(this);
    }

    _divideNotes(noteToDivide, divideNoteBy) {
        noteToDivide = parseInt(noteToDivide);
        this._blockMapHelper = [];
        for (let i = 0; i < noteToDivide; i++) {
            this._blockMapHelper.push([this._colBlocks[i], [i]]);
        }
        this.activity.logo.tupletRhythms = this.activity.logo.tupletRhythms
            .slice(0, noteToDivide)
            .concat([
                [
                    this.activity.logo.tupletRhythms[noteToDivide][0],
                    this.activity.logo.tupletRhythms[noteToDivide][1],
                    this.activity.logo.tupletRhythms[noteToDivide][2] * divideNoteBy
                ]
            ])
            .concat(this.activity.logo.tupletRhythms.slice(noteToDivide + 1));
        this._blockMapHelper.push([this._colBlocks[noteToDivide], []]);
        let j = 0;

        for (let i = 0; i < divideNoteBy - 1; i++) {
            this.activity.logo.tupletRhythms = this.activity.logo.tupletRhythms
                .slice(0, noteToDivide + i + 1)
                .concat(this.activity.logo.tupletRhythms.slice(noteToDivide + i));
            j = noteToDivide + i;
            this._blockMapHelper[noteToDivide][1].push(j);
        }
        j++;
        this._blockMapHelper[noteToDivide][1].push(j);
        for (let i = noteToDivide + 1; i < this._colBlocks.length; i++) {
            j++;
            this._blockMapHelper.push([this._colBlocks[i], [j]]);
        }
        this._readjustNotesBlocks();
        this._syncMarkedBlocks();
        this._restartGrid.call(this);
    }

    _tieNotes(mouseDownCell, mouseUpCell) {
        let downCellId = null;
        let upCellId = null;
        if (mouseDownCell.id < mouseUpCell.id) {
            downCellId = mouseDownCell.id;
            upCellId = mouseUpCell.id;
        } else {
            downCellId = mouseUpCell.id;
            upCellId = mouseDownCell.id;
        }

        this._blockMapHelper = [];
        let i;
        for (i = 0; i < downCellId; i++) {
            this._blockMapHelper.push([this._colBlocks[i], [i]]);
        }
        let j = i;
        for (let i = downCellId; i <= upCellId; i++) {
            this._blockMapHelper.push([this._colBlocks[i], [j]]);
        }
        j++;
        for (let i = parseInt(upCellId) + 1; i < this.activity.logo.tupletRhythms.length; i++) {
            this._blockMapHelper.push([this._colBlocks[i], [j]]);
            j++;
        }

        let newNote = 0;
        for (let i = downCellId; i <= upCellId; i++) {
            newNote = newNote + 1 / parseFloat(this.activity.logo.tupletRhythms[i][2]);
        }

        this.activity.logo.tupletRhythms = this.activity.logo.tupletRhythms
            .slice(0, downCellId)
            .concat([
                [
                    this.activity.logo.tupletRhythms[downCellId][0],
                    this.activity.logo.tupletRhythms[downCellId][1],
                    1 / newNote
                ]
            ])
            .concat(this.activity.logo.tupletRhythms.slice(parseInt(upCellId) + 1));

        this._readjustNotesBlocks();
        this._syncMarkedBlocks();
        this._restartGrid.call(this);
    }

    _updateTuplet(noteToDivide, newNoteValue, condition) {
        this.activity.logo.tupletParams[noteToDivide][1] = newNoteValue;
        this._restartGrid.call(this);
        let notesBlockMap;
        if (condition === "simpletupletnote") {
            notesBlockMap = this._mapNotesBlocks("stuplet");
            this._update(notesBlockMap[noteToDivide], newNoteValue, 0, "stuplet");
        } else {
            notesBlockMap = this._mapNotesBlocks("tuplet4");
            this._update(notesBlockMap[noteToDivide], newNoteValue, 0, "tupletnote");
        }
    }

    _updateTupletValue(noteToDivide, oldTupletValue, newTupletValue) {
        noteToDivide = parseInt(noteToDivide);
        oldTupletValue = parseInt(oldTupletValue);
        newTupletValue = parseInt(newTupletValue);
        this._blockMapHelper = [];

        let k = 0;
        let l;
        if (oldTupletValue < newTupletValue) {
            for (let i = 0; i <= this.activity.logo.tupletRhythms.length; i++) {
                if (i == noteToDivide) {
                    break;
                }
                for (let j = 0; j < this.activity.logo.tupletRhythms[i].length - 2; j++) {
                    this._blockMapHelper.push([this._colBlocks[k], [k]]);
                    k++;
                }
            }
            for (let j = 0; j < this.activity.logo.tupletRhythms[noteToDivide].length - 2; j++) {
                this._blockMapHelper.push([this._colBlocks[k], [k]]);
                k++;
            }
            l = k;
            k = k + newTupletValue - oldTupletValue;
            for (let i = noteToDivide + 1; i < this.activity.logo.tupletRhythms.length; i++) {
                for (let j = 0; j < this.activity.logo.tupletRhythms[i].length - 2; j++) {
                    this._blockMapHelper.push([this._colBlocks[l], [k]]);
                    l++;
                    k++;
                }
            }

            for (let i = oldTupletValue; i < newTupletValue; i++) {
                this.activity.logo.tupletRhythms[noteToDivide] = this.activity.logo.tupletRhythms[
                    noteToDivide
                ]
                    .slice(0, this.activity.logo.tupletRhythms[noteToDivide].length)
                    .concat(
                        this.activity.logo.tupletRhythms[noteToDivide].slice(
                            this.activity.logo.tupletRhythms[noteToDivide].length - 1
                        )
                    );
            }
        } else {
            k = 0;
            for (let i = 0; i <= this.activity.logo.tupletRhythms.length; i++) {
                if (i === noteToDivide) {
                    break;
                }
                for (let j = 0; j < this.activity.logo.tupletRhythms[i].length - 2; j++) {
                    this._blockMapHelper.push([this._colBlocks[k], [k]]);
                    k++;
                }
            }

            for (let i = oldTupletValue; i > newTupletValue; i--) {
                this.activity.logo.tupletRhythms[noteToDivide] = this.activity.logo.tupletRhythms[
                    noteToDivide
                ].slice(0, this.activity.logo.tupletRhythms[noteToDivide].length - 1);
            }
            for (let j = 0; j < this.activity.logo.tupletRhythms[noteToDivide].length - 2; j++) {
                this._blockMapHelper.push([this._colBlocks[k], [k]]);
                k++;
            }
            l = k + oldTupletValue - newTupletValue;
            for (let i = noteToDivide + 1; i < this.activity.logo.tupletRhythms.length; i++) {
                for (let j = 0; j < this.activity.logo.tupletRhythms[i].length - 2; j++) {
                    this._blockMapHelper.push([this._colBlocks[l], [k]]);
                    l++;
                    k++;
                }
            }
        }
        const notesBlockMap = this._mapNotesBlocks("stuplet");
        const colBlocks = [];
        for (let i = 0; i < this.activity.logo.tupletRhythms.length; i++) {
            for (let j = 0; j < this.activity.logo.tupletRhythms[i].length - 2; j++) {
                colBlocks.push([notesBlockMap[i], j]);
            }
        }
        this._colBlocks = colBlocks;
        this._restartGrid.call(this);
        this._syncMarkedBlocks();
        this._update(notesBlockMap[noteToDivide], null, newTupletValue, "stupletvalue");
    }

    _createpiesubmenu(noteToDivide, tupletValue, condition) {
        docById("wheelDivptm").style.display = "";

        this._menuWheel = new wheelnav("wheelDivptm", null, 800, 800);
        this._exitWheel = new wheelnav("_exitWheel", this._menuWheel.raphael);

        let mainTabsLabels = [];
        if (condition === "tupletvalue") {
            mainTabsLabels = ["1", "2", "3", "-", "4", "5", "6", "7", "8", "+", "9", "10"];
            this.newNoteValue = String(tupletValue);
        } else if (condition === "simpletupletnote" || condition === "tupletnote") {
            mainTabsLabels = ["<-", "Enter", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
            this.newNoteValue = "/";
        } else if (condition === "rhythmnote") {
            this._tabsWheel = new wheelnav("_tabsWheel", this._menuWheel.raphael);
            this.newNoteValue = 2;
            mainTabsLabels = ["divide", "delete", "duplicate", String(this.newNoteValue)];
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
        let exitTabLabel = [];
        let tabsLabels = [];
        if (condition === "tupletvalue") {
            exitTabLabel = ["x", this.newNoteValue];
            this._menuWheel.slicePathCustom.minRadiusPercent = 0.4;
            this._menuWheel.slicePathCustom.maxRadiusPercent = 1;

            this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
            this._exitWheel.slicePathCustom.maxRadiusPercent = 0.4;
        } else if (condition === "simpletupletnote" || condition === "tupletnote") {
            exitTabLabel = ["x", this.newNoteValue];

            this._menuWheel.slicePathCustom.minRadiusPercent = 0.5;
            this._menuWheel.slicePathCustom.maxRadiusPercent = 1;

            this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
            this._exitWheel.slicePathCustom.maxRadiusPercent = 0.5;
        } else if (condition === "rhythmnote") {
            exitTabLabel = ["x", " "];
            tabsLabels = [
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

            for (let i = 0; i < tabsLabels.length; i++) {
                this._tabsWheel.navItems[i].navItem.hide();
            }
        }

        this._menuWheel.createWheel(mainTabsLabels);
        this._exitWheel.createWheel(exitTabLabel);

        docById("wheelDivptm").style.position = "absolute";
        docById("wheelDivptm").style.height = "250px";
        docById("wheelDivptm").style.width = "250px";

        let x = 0,
            y = 0;
        if (noteToDivide !== null) {
            const ntd = this._noteValueRow.cells[noteToDivide];
            x = ntd.getBoundingClientRect().x;
            y = ntd.getBoundingClientRect().y;
        }

        docById("wheelDivptm").style.left =
            Math.min(
                this.activity.canvas.width - 200,
                Math.max(0, x * this.activity.getStageScale())
            ) + "px";
        docById("wheelDivptm").style.top =
            Math.min(
                this.activity.canvas.height - 250,
                Math.max(0, y * this.activity.getStageScale())
            ) + "px";

        this._exitWheel.navItems[0].navigateFunction = () => {
            docById("wheelDivptm").style.display = "none";
            this._menuWheel.removeWheel();
            this._exitWheel.removeWheel();
        };

        if (condition === "tupletvalue") {
            const __enterValue = () => {
                const i = this._menuWheel.selectedNavItemIndex;
                const value = mainTabsLabels[i];

                this.newNoteValue = String(value);
                docById("wheelnav-_exitWheel-title-1").children[0].textContent = this.newNoteValue;
                this._updateTupletValue(this, noteToDivide, tupletValue, this.newNoteValue);
            };

            this._menuWheel.navItems[3].navigateFunction = () => {
                if (this.newNoteValue > 1) {
                    this.newNoteValue = String(parseInt(this.newNoteValue) - 1);
                    docById(
                        "wheelnav-_exitWheel-title-1"
                    ).children[0].textContent = this.newNoteValue;
                    this._updateTupletValue(this, noteToDivide, tupletValue, this.newNoteValue);
                }
            };

            this._menuWheel.navItems[9].navigateFunction = () => {
                this.newNoteValue = String(parseInt(this.newNoteValue) + 1);
                docById("wheelnav-_exitWheel-title-1").children[0].textContent = this.newNoteValue;
                this._updateTupletValue(noteToDivide, tupletValue, this.newNoteValue);
            };

            for (let i = 0; i < mainTabsLabels.length; i++) {
                if (i === 9 || i == 3) {
                    continue;
                }

                this._menuWheel.navItems[i].navigateFunction = __enterValue;
            }
        } else if (condition === "simpletupletnote" || condition === "tupletnote") {
            let first = false;
            let second = false;

            const __enterValue = () => {
                const i = this._menuWheel.selectedNavItemIndex;
                const value = mainTabsLabels[i];
                if (!first) {
                    this.newNoteValue = String(value) + "/";
                    docById(
                        "wheelnav-_exitWheel-title-1"
                    ).children[0].textContent = this.newNoteValue;
                    first = true;
                } else {
                    if (!second) {
                        this.newNoteValue = this.newNoteValue + String(value);
                        docById(
                            "wheelnav-_exitWheel-title-1"
                        ).children[0].textContent = this.newNoteValue;
                        second = true;
                    }
                }
            };

            this._menuWheel.navItems[0].navigateFunction = () => {
                if (second && first) {
                    const word = this.newNoteValue.split("/");
                    this.newNoteValue = word[0] + "/";
                    docById(
                        "wheelnav-_exitWheel-title-1"
                    ).children[0].textContent = this.newNoteValue;
                    second = false;
                } else if (first) {
                    this.newNoteValue = "/";
                    docById(
                        "wheelnav-_exitWheel-title-1"
                    ).children[0].textContent = this.newNoteValue;
                    first = false;
                }
            };

            this._menuWheel.navItems[1].navigateFunction = () => {
                if (second && first) {
                    const word = this.newNoteValue.split("/");
                    this._updateTuplet(
                        noteToDivide,
                        parseInt(word[1]) / parseInt(word[0]),
                        condition
                    );
                }
            };

            for (let i = 2; i < mainTabsLabels.length; i++) {
                this._menuWheel.navItems[i].navigateFunction = __enterValue;
            }
        } else if (condition === "rhythmnote") {
            let flag = 0;
            this._menuWheel.navItems[0].navigateFunction = () => {
                this._divideNotes(noteToDivide, this.newNoteValue);
            };

            this._menuWheel.navItems[1].navigateFunction = () => {
                this._deleteNotes(noteToDivide);
            };

            this._menuWheel.navItems[2].navigateFunction = () => {
                this._addNotes(noteToDivide, this.newNoteValue);
            };

            this._menuWheel.navItems[3].navigateFunction = () => {
                if (!flag) {
                    for (let i = 12; i < 19; i++) {
                        docById(
                            "wheelnav-wheelDivptm-title-3"
                        ).children[0].textContent = this.newNoteValue;
                        this._tabsWheel.navItems[i].navItem.show();
                    }

                    flag = 1;
                } else {
                    for (let i = 12; i < 19; i++) {
                        docById(
                            "wheelnav-wheelDivptm-title-3"
                        ).children[0].textContent = this.newNoteValue;
                        this._tabsWheel.navItems[i].navItem.hide();
                    }

                    flag = 0;
                }
            };

            for (let i = 12; i < 19; i++) {
                this._tabsWheel.navItems[i].navigateFunction = () => {
                    const j = this._tabsWheel.selectedNavItemIndex;
                    this.newNoteValue = tabsLabels[j];
                    docById("wheelnav-wheelDivptm-title-3").children[0].textContent = tabsLabels[j];
                };
            }
        }
    }

    makeClickable() {
        // Once the entire matrix is generated, this function makes it
        // clickable.
        const rowNote = this._noteValueRow;
        const rowTuplet = this._tupletValueRow;
        let cell, cellTuplet;
        for (let j = 0; j < rowNote.cells.length; j++) {
            cell = rowNote.cells[j];
            cell.setAttribute("id", j);

            cellTuplet = rowTuplet.cells[j];
            if (cellTuplet !== undefined) {
                cellTuplet.setAttribute("id", j);
            }

            const __mouseDownHandler = (event) => {
                this._mouseDownCell = event.target;
            };

            const __mouseUpHandler = (event) => {
                this._mouseUpCell = event.target;
                if (this._mouseDownCell !== this._mouseUpCell) {
                    this._tieNotes(this._mouseDownCell, this._mouseUpCell);
                } else {
                    const nodes = Array.prototype.slice.call(event.target.parentElement.children);
                    this._createpiesubmenu(
                        nodes.indexOf(event.target),
                        event.target.getAttribute("alt"),
                        "rhythmnote"
                    );
                }
            };

            if (cellTuplet !== undefined) {
                if (this.activity.logo.tupletRhythms[0][0] === "notes") {
                    cell.onclick = (event) => {
                        this._createpiesubmenu(event.target.getAttribute("id"), null, "tupletnote");
                    };
                } else {
                    cell.onclick = (event) => {
                        this._createpiesubmenu(
                            event.target.getAttribute("id"),
                            null,
                            "simpletupletnote"
                        );
                    };

                    cellTuplet.onclick = (event) => {
                        this._createpiesubmenu(
                            event.target.getAttribute("id"),
                            event.target.getAttribute("colspan"),
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

        const rowCount = this.rowLabels.length;
        let row;
        for (let i = 0; i < rowCount; i++) {
            row = this._rows[i];
            for (let j = 0; j < row.cells.length; j++) {
                cell = row.cells[j];
                if (cell.style.backgroundColor === "black") {
                    cell.style.backgroundColor = cell.getAttribute("cellColor");
                    this._setNotes(j, i, false);
                }
            }
        }

        let isMouseDown;
        for (let i = 0; i < rowCount; i++) {
            // The buttons get added to the embedded table.
            row = this._rows[i];
            for (let j = 0; j < row.cells.length; j++) {
                cell = row.cells[j];
                // Give each clickable cell a unique id
                cell.setAttribute("data-i", i);
                cell.setAttribute("data-j", j);

                isMouseDown = false;

                cell.onmousedown = (evt) => {
                    isMouseDown = true;
                    const i = Number(evt.target.getAttribute("data-i"));
                    const j = Number(evt.target.getAttribute("data-j"));
                    if (evt.target.style.backgroundColor === "black") {
                        evt.target.style.backgroundColor = evt.target.getAttribute("cellColor");
                        this._notesToPlay[j][0] = ["R"];
                        if (!this._noteBlocks) this._setNotes(j, i, false);
                    } else {
                        evt.target.style.backgroundColor = "black";
                        if (!this._noteBlocks) this._setNotes(j, i, true);
                    }
                };

                cell.onmouseover = (evt) => {
                    const i = Number(evt.target.getAttribute("data-i"));
                    const j = Number(evt.target.getAttribute("data-j"));
                    if (isMouseDown) {
                        if (evt.target.style.backgroundColor === "black") {
                            evt.target.style.backgroundColor = evt.target.getAttribute("cellColor");
                            this._notesToPlay[j][0] = ["R"];
                            if (!this._noteBlocks) this._setNotes(j, i, false);
                        } else {
                            evt.target.style.backgroundColor = "black";
                            if (!this._noteBlocks) this._setNotes(j, i, true);
                        }
                    }
                };

                cell.onmouseup = () => {
                    isMouseDown = false;
                };
            }
        }

        // Mark any cells found in the blockMap from previous
        // instances of the matrix.

        // If we have sorted the rows, we can simply restore the
        // marked blocks.
        let ii, r, c, blk, obj, n, rIdx, idsliced;
        if (this.sorted) {
            for (let i = 0; i < this._rowMapper.length; i++) {
                ii = this._rowMapper[i];
                r = this._sortedRowMap[i];
                row = this._rows[r];
                for (let j = 0; j < this._markedColsInRow[ii].length; j++) {
                    c = this._markedColsInRow[ii][j];
                    cell = row.cells[c];
                    cell.style.backgroundColor = "black";
                    this._setNoteCell(r, c, cell, false, null);
                }
            }
        } else {
            // Otherwise, we need to look at the blockMap.
            blk = this.blockNo;
            for (let i = 0; i < this._blockMap[blk].length; i++) {
                obj = this._blockMap[blk][i];
                if (obj[0] !== -1) {
                    n = obj[2];
                    c = 0;
                    rIdx = null;
                    // Look in the rowBlocks for the nth match
                    for (let j = 0; j < this._rowBlocks.length; j++) {
                        /* for note blocks within repeat block
                            their ids are added with a larger number
                            e.g. 11 becomes 1000011 or 2000011 */

                        // Slice length of comparing id from end
                        // of augmented id and compare
                        idsliced = this._rowBlocks[j].toString().slice(-obj[0]?.toString()?.length);
                        if (idsliced === obj[0]?.toString()) {
                            if (c++ === n) {
                                rIdx = j;
                                break;
                            }
                        }
                    }

                    if (rIdx === null) {
                        continue;
                    }

                    r = this._rowMap[rIdx] + this._rowOffset[this._rowMap[rIdx]];

                    c = -1;
                    for (let j = 0; j < this._colBlocks.length; j++) {
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
                    row = this._rows[r];
                    if (row !== null && typeof row !== "undefined") {
                        cell = row.cells[c];
                        if (cell != undefined) {
                            cell.style.backgroundColor = "black";
                            this._setNoteCell(r, c, cell, false, null);
                        }
                    }
                }
            }
        }
    }

    playAll() {
        // Play all of the notes in the matrix.
        this.playingNow = !this.playingNow;

        if (this.playingNow) {
            this.widgetWindow.modifyButton(0, "stop-button.svg", PhraseMaker.ICONSIZE, _("stop"));

            this.activity.logo.synth.stop();

            // Retrieve list of note to play, from matrix state
            this.collectNotesToPlay();

            this._notesCounter = 0;

            // We have an array of pitches and note values.
            const note = this._notesToPlay[this._notesCounter][0];
            const pitchNotes = [];
            const synthNotes = [];
            const drumNotes = [];
            let drumName, obj;

            // Note can be a chord, hence it is an array.
            for (let i = 0; i < note.length; i++) {
                if (typeof note[i] === "number") {
                    drumName = null;
                } else {
                    drumName = getDrumName(note[i]);
                }

                if (typeof note[i] === "number") {
                    synthNotes.push(note[i]);
                } else if (drumName != null) {
                    drumNotes.push(drumName);
                } else if (note[i].slice(0, 4) === "http") {
                    drumNotes.push(note[i]);
                } else {
                    obj = note[i].split(": ");
                    if (obj.length > 1) {
                        // Deprecated
                        if (MATRIXSYNTHS.indexOf(obj[0]) !== -1) {
                            synthNotes.push(note[i]);
                        } else {
                            this._processGraphics(obj);
                        }
                    } else {
                        pitchNotes.push(note[i].replace(/♭/g, "b").replace(/♯/g, "#"));
                    }
                }

                this._stopOrCloseClicked = false;
            }

            const noteValue = this._notesToPlay[this._notesCounter][1];

            this._notesCounter += 1;

            this._colIndex = 0;

            // We highlight the note-value cells (bottom row).
            let row = this._noteValueRow;

            // Highlight first note.
            const cell = row.cells[this._colIndex];
            cell.style.backgroundColor = platformColor.selectorBackground;

            let tupletCell;
            // If we are in a tuplet, we don't update the column until
            // we've played all of the notes in the column span.
            if (cell.colSpan > 1) {
                this._spanCounter = 1;
                row = this._tupletNoteValueRow;
                tupletCell = row.cells[this._colIndex];
                tupletCell.style.backgroundColor = platformColor.selectorBackground;
            } else {
                this._spanCounter = 0;
                this._colIndex += 1;
            }

            if (note[0] !== "R" && pitchNotes.length > 0) {
                this._playChord(pitchNotes, Singer.defaultBPMFactor / noteValue);
            }

            for (let i = 0; i < synthNotes.length; i++) {
                this.activity.logo.synth.trigger(
                    0,
                    [Number(synthNotes[i])],
                    Singer.defaultBPMFactor / noteValue,
                    this._instrumentName,
                    null,
                    null
                );
            }

            for (let i = 0; i < drumNotes.length; i++) {
                this.activity.logo.synth.trigger(
                    0,
                    "C2",
                    Singer.defaultBPMFactor / noteValue,
                    drumNotes[i],
                    null,
                    null
                );
            }

            this.__playNote(0, 0);
        } else {
            this._stopOrCloseClicked = true;
            this.widgetWindow.modifyButton(0, "play-button.svg", PhraseMaker.ICONSIZE, _("Play"));
        }
    }

    collectNotesToPlay() {
        // Generate the list of notes to play, on the fly from
        // row labels and note value (from "alt" attribute of
        // corresponding cells in the row)

        // list of half-tones with solfeges
        const MATRIXHALFTONES = [
            "do",
            "C",
            "C♯",
            "D♭",
            "re",
            "D",
            "D♯",
            "E♭",
            "mi",
            "E",
            "fa",
            "F",
            "F♯",
            "G♭",
            "sol",
            "G",
            "G♯",
            "A♭",
            "la",
            "A",
            "A♯",
            "B♭",
            "ti",
            "B"
        ];
        // list of half-tones in letter representations
        const MATRIXHALFTONES2 = [
            "C",
            "C",
            "C♯",
            "D♭",
            "D",
            "D",
            "D♯",
            "E♭",
            "E",
            "E",
            "F",
            "F",
            "F♯",
            "G♭",
            "G",
            "G",
            "G♯",
            "A♭",
            "A",
            "A",
            "A♯",
            "B♭",
            "B",
            "B"
        ];
        const notes = [];
        let row, cell, note;
        for (let i = 0; i < this._colBlocks.length; i++) {
            note = [];
            for (let j = 0; j < this.rowLabels.length; j++) {
                row = this._rows[j];
                cell = row.cells[i];
                if (cell.style.backgroundColor === "black") {
                    if (this.rowLabels[j] === "hertz") {
                        // if pitch specified in hertz
                        note.push(this.rowArgs[j]);
                    } else {
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
                                MATRIXHALFTONES2[MATRIXHALFTONES.indexOf(this.rowLabels[j])] +
                                    this.rowArgs[j]
                            );
                        } else {
                            if (
                                isCustomTemperament(this.activity.logo.synth.inTemperament)) {
                                const notes = getTemperament(
                                    this.activity.logo.synth.inTemperament
                                );
                                const label = this.rowLabels[j];
                                let customNote = [];
                                for (const n in notes) {
                                    if (notes[n][1] === label) {
                                        customNote = notes[n];
                                        break;
                                    }
                                }
                                if (customNote.length > 0) {
                                    // custom pitch in custom temperament
                                    note.push(this.rowLabels[j] + this.rowArgs[j]);
                                }
                            } else {
                                // if drum push drum name
                                note.push(this.rowLabels[j]);
                            }
                        }
                    }
                }
            }
            // push [note/chord, relative-duration-inverse (e.g. 8 for 1/8)]
            notes.push([note, 1 / cell.getAttribute("alt")]);
        }

        this._notesToPlay = notes;
    }

    _resetMatrix() {
        let row = this._noteValueRow;
        let cell;
        for (let i = 0; i < row.cells.length; i++) {
            cell = row.cells[i];
            cell.style.backgroundColor = platformColor.rhythmcellcolor;
        }

        if (this._matrixHasTuplets) {
            row = this._tupletNoteValueRow;
            for (let i = 0; i < row.cells.length; i++) {
                cell = row.cells[i];
                cell.style.backgroundColor = platformColor.tupletBackground;
            }
        }
    }

    __playNote(time, noteCounter) {
        // If the widget is closed, stop playing.
        if (!this.widgetWindow.isVisible()) {
            return;
        }

        let noteValue = this._notesToPlay[noteCounter][1];
        time = 1 / noteValue;

        setTimeout(() => {
            let row, cell, tupletCell;
            // Did we just play the last note?
            if (noteCounter === this._notesToPlay.length - 1) {
                this._resetMatrix();

                this.widgetWindow.modifyButton(
                    0,
                    "play-button.svg",
                    PhraseMaker.ICONSIZE,
                    _("Play")
                );
                this.playingNow = false;
                this._playButton.innerHTML =
                    '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' +
                    _("Play") +
                    '" alt="' +
                    _("Play") +
                    '" height="' +
                    PhraseMaker.ICONSIZE +
                    '" width="' +
                    PhraseMaker.ICONSIZE +
                    '" vertical-align="middle">&nbsp;&nbsp;';
            } else {
                row = this._noteValueRow;
                cell = row.cells[this._colIndex];

                if (cell != undefined) {
                    cell.style.backgroundColor = platformColor.selectorBackground;
                    if (cell.colSpan > 1) {
                        row = this._tupletNoteValueRow;
                        tupletCell = row.cells[this._notesCounter];
                        tupletCell.style.backgroundColor = platformColor.selectorBackground;
                    }
                }

                if (this._notesCounter >= this._notesToPlay.length) {
                    this._notesCounter = 1;
                    this.activity.logo.synth.stop();
                }

                const note = this._notesToPlay[this._notesCounter][0];
                noteValue = this._notesToPlay[this._notesCounter][1];
                this._notesCounter += 1;

                const pitchNotes = [];
                const synthNotes = [];
                const drumNotes = [];
                let drumName, obj;
                // Note can be a chord, hence it is an array.
                if (!this._stopOrCloseClicked) {
                    for (let i = 0; i < note.length; i++) {
                        if (typeof note[i] === "number") {
                            drumName = null;
                        } else {
                            drumName = getDrumName(note[i]);
                        }

                        if (typeof note[i] === "number") {
                            synthNotes.push(note[i]);
                        } else if (drumName != null) {
                            drumNotes.push(drumName);
                        } else if (note[i].slice(0, 4) === "http") {
                            drumNotes.push(note[i]);
                        } else {
                            obj = note[i].split(": ");
                            // Deprecated
                            if (MATRIXSYNTHS.indexOf(obj[0]) !== -1) {
                                synthNotes.push(note[i]);
                                continue;
                            } else if (MATRIXGRAPHICS.indexOf(obj[0]) !== -1) {
                                this._processGraphics(obj);
                            } else if (MATRIXGRAPHICS2.indexOf(obj[0]) !== -1) {
                                this._processGraphics(obj);
                            } else {
                                pitchNotes.push(note[i].replace(/♭/g, "b").replace(/♯/g, "#"));
                            }
                        }
                    }
                }

                if (note[0] !== "R" && pitchNotes.length > 0) {
                    this._playChord(pitchNotes, Singer.defaultBPMFactor / noteValue);
                }

                for (let i = 0; i < synthNotes.length; i++) {
                    this.activity.logo.synth.trigger(
                        0,
                        [Number(synthNotes[i])],
                        Singer.defaultBPMFactor / noteValue,
                        this._instrumentName,
                        null,
                        null
                    );
                }

                for (let i = 0; i < drumNotes.length; i++) {
                    this.activity.logo.synth.trigger(
                        0,
                        ["C2"],
                        Singer.defaultBPMFactor / noteValue,
                        drumNotes[i],
                        null,
                        null
                    );
                }
            }

            row = this._noteValueRow;
            cell = row.cells[this._colIndex];
            if (cell != undefined) {
                if (cell.colSpan > 1) {
                    this._spanCounter += 1;
                    if (this._spanCounter === cell.colSpan) {
                        this._spanCounter = 0;
                        this._colIndex += 1;
                    }
                } else {
                    this._spanCounter = 0;
                    this._colIndex += 1;
                }

                noteCounter += 1;

                if (noteCounter < this._notesToPlay.length && this.playingNow) {
                    this.__playNote(time, noteCounter);
                } else {
                    this._resetMatrix();
                    this.widgetWindow.modifyButton(
                        0,
                        "play-button.svg",
                        PhraseMaker.ICONSIZE,
                        _("Play")
                    );
                }
            }
        }, Singer.defaultBPMFactor * 1000 * time + this.activity.logo.turtleDelay);
    }

    _playChord(notes, noteValue) {
        setTimeout(() => {
            this.activity.logo.synth.trigger(
                0,
                notes[0],
                noteValue,
                this._instrumentName,
                null,
                null
            );
        }, 1);

        if (notes.length > 1) {
            setTimeout(() => {
                this.activity.logo.synth.trigger(
                    0,
                    notes[1],
                    noteValue,
                    this._instrumentName,
                    null,
                    null
                );
            }, 1);
        }

        if (notes.length > 2) {
            setTimeout(() => {
                this.activity.logo.synth.trigger(
                    0,
                    notes[2],
                    noteValue,
                    this._instrumentName,
                    null,
                    null
                );
            }, 1);
        }

        if (notes.length > 3) {
            setTimeout(() => {
                this.activity.logo.synth.trigger(
                    0,
                    notes[3],
                    noteValue,
                    this._instrumentName,
                    null,
                    null
                );
            }, 1);
        }
    }

    _processGraphics(obj) {
        switch (obj[0]) {
            case "forward":
                this.activity.turtles.turtleList[0].painter.doForward(obj[1]);
                break;
            case "back":
                this.activity.turtles.turtleList[0].painter.doForward(-obj[1]);
                break;
            case "right":
                this.activity.turtles.turtleList[0].painter.doRight(obj[1]);
                break;
            case "left":
                this.activity.turtles.turtleList[0].painter.doRight(-obj[1]);
                break;
            case "setcolor":
                this.activity.turtles.turtleList[0].painter.doSetColor(obj[1]);
                break;
            case "sethue":
                this.activity.turtles.turtleList[0].painter.doSetHue(obj[1]);
                break;
            case "setshade":
                this.activity.turtles.turtleList[0].painter.doSetValue(obj[1]);
                break;
            case "setgrey":
                this.activity.turtles.turtleList[0].painter.doSetChroma(obj[1]);
                break;
            case "settranslucency":
                this.activity.turtles.turtleList[0].painter.doSetPenAlpha(1.0 - obj[1] / 100);
                break;
            case "setpensize":
                this.activity.turtles.turtleList[0].painter.doSetPensize(obj[1]);
                break;
            case "setheading":
                this.activity.turtles.turtleList[0].painter.doSetHeading(obj[1]);
                break;
            case "arc":
                this.activity.turtles.turtleList[0].painter.doArc(obj[1], obj[2]);
                break;
            case "setxy":
                this.activity.turtles.turtleList[0].painter.doSetXY(obj[1], obj[2]);
                break;
            default:
                //eslint-disable-next-line no-console
                console.debug("unknown graphics command " + obj[0]);
                break;
        }
    }

    _setNotes(colIndex, rowIndex, playNote) {
        // Sets corresponding note when user clicks on any cell and
        // plays that note
        const rowBlock = this._rowBlocks[
            this._rowMap.indexOf(rowIndex - this._rowOffset[rowIndex])
        ];
        const rhythmBlockObj = this._colBlocks[colIndex];

        if (playNote) {
            this.addNode(rowBlock, rhythmBlockObj[0], rhythmBlockObj[1], this.blockNo);
        } else {
            this.removeNode(rowBlock, rhythmBlockObj[0], rhythmBlockObj[1]);
        }

        let row, cell;
        for (let j = 0; j < this.rowLabels.length; j++) {
            row = this._rows[j];
            cell = row.cells[colIndex];
            if (cell.style.backgroundColor === "black") {
                this._setNoteCell(j, colIndex, cell, playNote);
            }
        }
    }

    _setNoteCell(j, colIndex, cell, playNote) {
        const note = this._noteStored[j];
        let drumName, graphicsBlock, graphicNote, obj;
        if (this.rowLabels[j] === "hertz") {
            drumName = null;
            graphicsBlock = false;
            obj = [note];
        } else {
            drumName = getDrumName(note);
            graphicsBlock = false;
            graphicNote = note.split(": ");
            if (
                MATRIXGRAPHICS.indexOf(graphicNote[0]) != -1 &&
                MATRIXGRAPHICS2.indexOf(graphicNote[0]) != -1
            ) {
                graphicsBlock = true;
            }

            obj = note.split(": ");
        }

        const row = this._rows[j];
        cell = row.cells[colIndex];

        // Using the alt attribute to store the note value
        const noteValue = cell.getAttribute("alt") * Singer.defaultBPMFactor;

        if (obj.length === 1) {
            if (playNote) {
                if (drumName != null) {
                    this.activity.logo.synth.trigger(0, "C2", noteValue, drumName, null, null);
                } else if (this.rowLabels[j] === "hertz") {
                    this.activity.logo.synth.trigger(
                        0,
                        Number(note),
                        noteValue,
                        this._instrumentName,
                        null,
                        null
                    );
                } else if (graphicsBlock !== true) {
                    if (typeof note === "string") {
                        this.activity.logo.synth.trigger(
                            0,
                            note.replace(/♭/g, "b").replace(/♯/g, "#"),
                            noteValue,
                            this._instrumentName,
                            null,
                            null
                        );
                    } else {
                        this.activity.logo.synth.trigger(
                            0,
                            note,
                            noteValue,
                            this._instrumentName,
                            null,
                            null
                        );
                    }
                } else {
                    //eslint-disable-next-line no-console
                    console.debug("Cannot parse note object: " + obj);
                }
            }
        } else if (MATRIXSYNTHS.indexOf(obj[0]) !== -1) {
            this.activity.logo.synth.trigger(0, [Number(obj[1])], noteValue, obj[0], null, null);
        }
    }

    _clear() {
        // 'Unclick' every entry in the matrix.
        let row, cell;
        for (let i = 0; i < this.rowLabels.length; i++) {
            row = this._rows[i];
            for (let j = 0; j < row.cells.length; j++) {
                cell = row.cells[j];
                if (cell.style.backgroundColor === "black") {
                    cell.style.backgroundColor = cell.getAttribute("cellColor");
                    this._notesToPlay[j][0] = ["R"];
                    this._setNotes(j, i, false);
                }
            }
        }
    }

    _save() {
        /* Saves the current matrix as an action stack consisting of
         * note and pitch blocks (saving as chunks is deprecated). */

        // First, hide the palettes as they will need updating.
        for (const name in this.activity.blocks.palettes.dict) {
            this.activity.blocks.palettes.dict[name].hideMenu(true);
        }
        this.activity.refreshCanvas();

        const newStack = [
            [0, ["action", { collapsed: true }], 100, 100, [null, 1, null, null]],
            [1, ["text", { value: _("action") }], 0, 0, [0]]
        ];
        let endOfStackIdx = 0;

        // Retrieve the list of notes to play, that'll be saved
        this.collectNotesToPlay();

        let note, idx, n, delta, obj, drumName;
        for (let i = 0; i < this._notesToPlay.length; i++) {
            // We want all of the notes in a column.
            note = this._notesToPlay[i].slice(0);
            if (note[0] === "") {
                note[0] = "R";
            }

            // Add the Note block and its value
            idx = newStack.length;
            newStack.push([idx, "newnote", 0, 0, [endOfStackIdx, idx + 1, idx + 2, null]]);
            n = newStack[idx][4].length;
            if (i === 0) {
                // the action block
                newStack[endOfStackIdx][4][n - 2] = idx;
            } else {
                // the previous note block
                newStack[endOfStackIdx][4][n - 1] = idx;
            }

            endOfStackIdx = idx;

            // The note block might be generated from a tuplet in
            // which case we output 1 / (3 x 4) instead of 1 / 12.
            if (
                this._outputAsTuplet[i][0] !== 1 &&
                parseInt(this._outputAsTuplet[i][1]) === this._outputAsTuplet[i][1]
            ) {
                // We don't reformat dotted tuplets since they are too complicated.
                // We are adding 6 blocks: vspace, divide, number, multiply, number, number
                delta = 7;

                // Add a vspace to prevent divide block from obscuring the pitch block.
                newStack.push([idx + 1, "vspace", 0, 0, [idx, idx + delta]]);

                // note value is saved as a fraction
                newStack.push([idx + 2, "divide", 0, 0, [idx, idx + 3, idx + 4]]);

                newStack.push([idx + 3, ["number", { value: 1 }], 0, 0, [idx + 2]]);
                newStack.push([idx + 4, "multiply", 0, 0, [idx + 2, idx + 5, idx + 6]]);
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
                delta = 5;

                // Add a vspace to prevent divide block from obscuring the pitch block.
                newStack.push([idx + 1, "vspace", 0, 0, [idx, idx + delta]]);

                // note value is saved as a fraction
                newStack.push([idx + 2, "divide", 0, 0, [idx, idx + 3, idx + 4]]);

                if (parseInt(note[1]) < note[1]) {
                    // dotted note
                    obj = toFraction(note[1]);
                    newStack.push([idx + 3, ["number", { value: obj[1] }], 0, 0, [idx + 2]]);
                    newStack.push([idx + 4, ["number", { value: obj[0] }], 0, 0, [idx + 2]]);
                } else {
                    newStack.push([idx + 3, ["number", { value: 1 }], 0, 0, [idx + 2]]);
                    newStack.push([idx + 4, ["number", { value: note[1] }], 0, 0, [idx + 2]]);
                }
            }

            // Connect the Note block flow to the divide and vspace blocks.
            newStack[idx][4][1] = idx + 2; // divide block
            newStack[idx][4][2] = idx + 1; // vspace block

            // const x = idx + delta;
            let lastConnection, previousBlock, thisBlock;

            if (note[0][0] === "R" || note[0][0] == undefined) {
                // The last connection in last pitch block is null.
                lastConnection = null;
                if (delta === 5 || delta === 7) {
                    previousBlock = idx + 1; // Vspace block
                } else {
                    previousBlock = idx; // Note block
                }

                delta -= 2;
                thisBlock = idx + delta;
                newStack.push([thisBlock + 1, "rest2", 0, 0, [previousBlock, lastConnection]]);
                previousBlock += delta;
            } else {
                // Add the pitch and/or playdrum blocks to the Note block
                thisBlock = idx + delta;
                for (let j = 0; j < note[0].length; j++) {
                    // We need to point to the previous note or pitch block.
                    if (j === 0) {
                        if (delta === 5 || delta === 7) {
                            previousBlock = idx + 1; // Vspace block
                        } else {
                            previousBlock = idx; // Note block
                        }
                    }

                    if (!isNaN(parseInt(note[0][j]))) {
                        obj = null;
                        drumName = null;
                    } else {
                        obj = note[0][j].split(": ");
                        drumName = getDrumName(note[0][j]);
                    }

                    if (obj === null) {
                        // add a hertz block
                        // The last connection in last pitch block is null.
                        if (note[0].length === 1 || j === note[0].length - 1) {
                            lastConnection = null;
                        } else {
                            lastConnection = thisBlock + 2;
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
                            ["number", { value: parseInt(note[0][j]) }],
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
                            lastConnection = null;
                        } else {
                            lastConnection = thisBlock + 2;
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
                            lastConnection = null;
                        } else {
                            lastConnection = thisBlock + 2;
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
                            lastConnection = null;
                        } else {
                            lastConnection = thisBlock + 3;
                        }

                        newStack.push([
                            thisBlock,
                            obj[0],
                            0,
                            0,
                            [previousBlock, thisBlock + 1, thisBlock + 2, lastConnection]
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
                            lastConnection = null;
                        } else {
                            lastConnection = thisBlock + 2;
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
                            lastConnection = null;
                        } else {
                            lastConnection = thisBlock + 3;
                        }

                        if (note[0][j][1] === "♯") {
                            if (isCustomTemperament(this.activity.logo.synth.inTemperament)) {
                                newStack.push([
                                    thisBlock,
                                    "pitch",
                                    0,
                                    0,
                                    [previousBlock, thisBlock + 1, thisBlock + 2, lastConnection]
                                ]);
                                newStack.push([
                                    thisBlock + 1,
                                    [
                                        "customNote",
                                        {
                                            value: note[0][j].substring(0, note[0][j].length - 1)
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
                                newStack.push([
                                    thisBlock,
                                    "pitch",
                                    0,
                                    0,
                                    [previousBlock, thisBlock + 1, thisBlock + 2, lastConnection]
                                ]);
                                newStack.push([
                                    thisBlock + 1,
                                    [
                                        "solfege",
                                        {
                                            value: SOLFEGECONVERSIONTABLE[note[0][j][0] + "♯"]
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
                            if (isCustomTemperament(this.activity.logo.synth.inTemperament)) {
                                newStack.push([
                                    thisBlock,
                                    "pitch",
                                    0,
                                    0,
                                    [previousBlock, thisBlock + 1, thisBlock + 2, lastConnection]
                                ]);
                                newStack.push([
                                    thisBlock + 1,
                                    [
                                        "customNote",
                                        {
                                            value: note[0][j].substring(0, note[0][j].length - 1)
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
                                newStack.push([
                                    thisBlock,
                                    "pitch",
                                    0,
                                    0,
                                    [previousBlock, thisBlock + 1, thisBlock + 2, lastConnection]
                                ]);
                                newStack.push([
                                    thisBlock + 1,
                                    [
                                        "solfege",
                                        {
                                            value: SOLFEGECONVERSIONTABLE[note[0][j][0] + "♭"]
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
                                [previousBlock, thisBlock + 1, thisBlock + 2, lastConnection]
                            ]);
                            if (this.activity.logo.synth.inTemperament == "custom") {
                                newStack.push([
                                    thisBlock + 1,
                                    [
                                        "customNote",
                                        {
                                            value: note[0][j].substring(0, note[0][j].length - 1)
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
                                            value: SOLFEGECONVERSIONTABLE[note[0][j][0]]
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
        this.activity.blocks.loadNewBlocks(newStack);
        this.activity.textMsg(_("New action block generated!"));
    }
}
