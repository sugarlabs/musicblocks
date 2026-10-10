// Copyright (c) 2016-21 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// Similar to the matrix, this widget makes a mapping between pitch
// and drum sounds.

/*
   global

   _, docById, MATRIXSOLFEWIDTH, PitchDrumMatrixWindow, PitchDrumMatrixGrid,
   PitchDrumMatrixBlocks, PitchDrumMatrixCells, PitchDrumMatrixPlayback, PitchDrumMatrixSave
*/
/*
   Global locations
   js/utils/utils.js
        _, docById
   js/utils/musicutils.js
        MATRIXSOLFEWIDTH
   js/widgets/PitchDrumMatrixWindow.js, PitchDrumMatrixGrid.js, PitchDrumMatrixBlocks.js,
   PitchDrumMatrixCells.js, PitchDrumMatrixPlayback.js, PitchDrumMatrixSave.js
        PitchDrumMatrixWindow, PitchDrumMatrixGrid, PitchDrumMatrixBlocks, PitchDrumMatrixCells,
        PitchDrumMatrixPlayback, PitchDrumMatrixSave
*/
/* exported PitchDrumMatrix */

/**
 * Represents a PitchDrumMatrix widget for making a mapping between pitch and drum sounds.
 *
 * Most of its methods live in PitchDrumMatrixWindow.js, PitchDrumMatrixGrid.js,
 * PitchDrumMatrixBlocks.js, PitchDrumMatrixCells.js, PitchDrumMatrixPlayback.js and
 * PitchDrumMatrixSave.js; see installModules.
 *
 * @class
 * @memberof global
 * @requires _
 * @requires docById
 * @exports PitchDrumMatrix
 */
class PitchDrumMatrix {
    /** AMD module dependencies for lazy loading. */
    static dependencies = [
        "widgets/PitchDrumMatrixWindow",
        "widgets/PitchDrumMatrixGrid",
        "widgets/PitchDrumMatrixBlocks",
        "widgets/PitchDrumMatrixCells",
        "widgets/PitchDrumMatrixPlayback",
        "widgets/PitchDrumMatrixSave",
        "widgets/pitchdrummatrix"
    ];

    /**
     * Width of the button division.
     *
     * @type {number}
     */
    static BUTTONDIVWIDTH = 295; // 5 buttons

    /**
     * Width of the drum name column.
     *
     * @type {number}
     */
    static DRUMNAMEWIDTH = 50;

    /**
     * Width of the outer window.
     *
     * @type {number}
     */
    static OUTERWINDOWWIDTH = 128;

    /**
     * Width of the inner window.
     *
     * @type {number}
     */
    static INNERWINDOWWIDTH = 50;
    /**
     * Size of the buttons.
     *
     * @type {number}
     */
    static BUTTONSIZE = 53;
    /**
     * Size of the icons.
     *
     * @type {number}
     */
    static ICONSIZE = 32;

    /**
     * Whether installModules has copied the module methods onto the prototype.
     *
     * @type {boolean}
     */
    static _modulesInstalled = false;

    /**
     * Copies the methods of the Pitch-Drum Matrix modules (PitchDrumMatrixWindow.js,
     * PitchDrumMatrixGrid.js, PitchDrumMatrixBlocks.js, PitchDrumMatrixCells.js,
     * PitchDrumMatrixPlayback.js and PitchDrumMatrixSave.js) onto PitchDrumMatrix.prototype,
     * keeping their names and property descriptors, so they behave exactly like methods
     * declared in this class and `this` inside them is the widget.
     *
     * RequireJS loads the modules alongside this file in no fixed order, so this runs when the
     * file loads (if the modules are already defined) and again from the constructor, which
     * only runs once every dependency has loaded.
     *
     * @returns {boolean} Whether the methods are installed.
     */
    static installModules() {
        if (PitchDrumMatrix._modulesInstalled) {
            return true;
        }

        const modules = [
            typeof PitchDrumMatrixWindow !== "undefined" ? PitchDrumMatrixWindow : null,
            typeof PitchDrumMatrixGrid !== "undefined" ? PitchDrumMatrixGrid : null,
            typeof PitchDrumMatrixBlocks !== "undefined" ? PitchDrumMatrixBlocks : null,
            typeof PitchDrumMatrixCells !== "undefined" ? PitchDrumMatrixCells : null,
            typeof PitchDrumMatrixPlayback !== "undefined" ? PitchDrumMatrixPlayback : null,
            typeof PitchDrumMatrixSave !== "undefined" ? PitchDrumMatrixSave : null
        ];
        if (modules.includes(null)) {
            return false;
        }

        for (const module of modules) {
            for (const name of Object.getOwnPropertyNames(module.prototype)) {
                if (name !== "constructor") {
                    Object.defineProperty(
                        PitchDrumMatrix.prototype,
                        name,
                        Object.getOwnPropertyDescriptor(module.prototype, name)
                    );
                }
            }
        }

        PitchDrumMatrix._modulesInstalled = true;
        return true;
    }

    constructor() {
        PitchDrumMatrix.installModules();

        this.rowLabels = [];
        this.rowArgs = [];
        this.drums = [];
        this._rests = 0;
        this._playing = false;
        // Incremented whenever playback starts or stops, so timeouts from an
        // earlier run can tell they are stale.
        this._playRun = 0;
        // The pitch-block number associated with a row; a drum block is
        // associated with a column. We need to keep track of which
        // intersections in the grid are populated.  The blockMap is a
        // list of selected nodes in the matrix that map pitch blocks to
        // drum blocks.

        // These arrays get created each time the matrix is built.
        this._rowBlocks = []; // pitch-block number
        this._colBlocks = []; // drum-block number
        this._pdmCellTables = []; // cached pdmCellTable elements
        this._pdmTable = null; // cached pdmTable element
        this._pdmDrumTable = null; // cached pdmDrumTable element

        // This array is preserved between sessions.
        // We populate the blockMap whenever a node is selected and
        // restore any nodes that might be present.
        this._blockMap = [];
    }

    /**
     * Initializes the pitch/drum matrix.
     *
     * @param {Activity} activity - The activity instance.
     */
    init(activity) {
        /**
         * The activity associated with the PitchDrumMatrix.
         *
         * @type {Activity}
         */
        this.activity = activity;
        const w = window.innerWidth;
        /**
         * The scale factor for cell sizes.
         *
         * @type {number}
         * @private
         */
        this._cellScale = w / 1200;

        /**
         * The widget window for the PitchDrumMatrix.
         *
         * @type {WidgetWindow}
         */
        const widgetWindow = window.widgetWindows.windowFor(this, "pitch drum");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();

        this._addToolbar(widgetWindow);

        /**
         * The container for the pitch/drum matrix.
         *
         * @type {HTMLDivElement}
         */
        this.pitchDrumDiv = document.createElement("div");
        widgetWindow.getWidgetBody().append(this.pitchDrumDiv);
        widgetWindow.getWidgetBody().style.height = "400px";
        widgetWindow.getWidgetBody().style.width = "500px";

        // The pdm table
        const pdmTableDiv = this.pitchDrumDiv;
        pdmTableDiv.style.position = "relative";
        pdmTableDiv.style.visibility = "invisible";
        pdmTableDiv.style.border = "0px";
        pdmTableDiv.textContent = "";

        // For the button callbacks
        widgetWindow.onclose = () => {
            this._closeWindow(widgetWindow);
        };

        this.widgetWindow.onmaximize = this._scale;

        // We use an outer div to scroll vertically and an inner div to scroll horizontally.
        const outerDivTmp = document.createElement("div");
        outerDivTmp.id = "pdmOuterDiv";
        const innerDivTmp = document.createElement("div");
        innerDivTmp.id = "pdmInnerDiv";
        const tmpTable = document.createElement("table");
        tmpTable.id = "pdmTable";
        tmpTable.setAttribute("cellpadding", "0px");
        innerDivTmp.appendChild(tmpTable);
        outerDivTmp.appendChild(innerDivTmp);
        pdmTableDiv.appendChild(outerDivTmp);

        // Each row in the pdm table contains a note label in the
        // first column and a table of buttons in the second column.
        this._pdmTable = docById("pdmTable");
        const pdmTable = this._pdmTable;
        this._pdmCellTables = [];
        const pdmTableRow = this._makeRows();

        const n = Math.max(Math.floor((window.innerHeight * 0.5) / 100), 8);
        const outerDiv = docById("pdmOuterDiv");
        outerDiv.style.height = widgetWindow.getWidgetBody().style.height;
        outerDiv.style.width = widgetWindow.getWidgetBody().style.width;
        let ow;
        if (pdmTable.rows.length + 2 > n) {
            ow = Math.max(
                Math.min(
                    widgetWindow.getWidgetBody().style.width,
                    this._cellScale *
                        (this.drums.length * (PitchDrumMatrix.DRUMNAMEWIDTH + 2) +
                            MATRIXSOLFEWIDTH +
                            24)
                ),
                PitchDrumMatrix.BUTTONDIVWIDTH
            ); // Add room for the vertical slider.
        } else {
            ow = Math.max(
                Math.min(
                    window.innerWidth / 2,
                    this._cellScale *
                        (this.drums.length * (PitchDrumMatrix.DRUMNAMEWIDTH + 2) + MATRIXSOLFEWIDTH)
                ),
                PitchDrumMatrix.BUTTONDIVWIDTH
            );
        }

        const innerDiv = docById("pdmInnerDiv");
        innerDiv.style.height = widgetWindow.getWidgetBody().style.height;
        innerDiv.style.width = widgetWindow.getWidgetBody().style.width;
        innerDiv.style.marginLeft = "0px";

        this._makeDrumRow(pdmTableRow);

        widgetWindow.onmaximize = () => {
            this._onMaximize(widgetWindow);
        };

        activity.textMsg(_("Click in the grid to map notes to drums."), 3000);
    }
}
PitchDrumMatrix.installModules();

if (typeof module !== "undefined") {
    module.exports = PitchDrumMatrix;
}
