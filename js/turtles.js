/**
 * @file This contains the prototype of the Turtles component.
 * @author Walter Bender
 *
 * @copyright 2014-2020 Walter Bender
 * @copyright 2020 Anindya Kundu
 *
 * @license
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the The GNU Affero General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA.
 */

// What is the scale factor when stage is shrunk?
const SCALEFACTOR = 4;

/**
 * Class for managing all the turtles.
 *
 * @class
 * @classdesc This contains variables for maintaining the canvas
 * including the canvas background buttons. In additions, it contains
 * all other methods relevant to the set of all turtles, including
 * adding them to the turtlelist, maintaining the canvas, etc.
 */
class Turtles {
    /**
     * @constructor
     */
    constructor() {
        this.model = new TurtlesModel();    // instantiate the model
        addMembers(this, this.model);       // add model's members
        delete this.model;                  // remove object to save memory

        this.view = new TurtlesView();  // instantiate the view
        addMembers(this, this.view);    // add view's members
        delete this.view;               // remove object to save memory

        this.masterStage = null;        // createjs stage
        this.stage = null;              // createjs container for turtle

        this.hideGrids = null;          // function to hide all grids
        this.doGrid = null;             // function that renders Cartesian/Polar
                                        //  grids and changes button labels

        this.hideMenu = null;           // function to hide aux menu
        this.doClear = null;            // function to clear the canvas
        this._canvas = null;            // DOM canvas element
        this.refreshCanvas = null;      // function to refresh canvas

        this.backgroundColor = platformColor.background;

        this._drum = false;
        this.scale = 1.0;
        this.w = 1200;
        this.h = 900;

        this.gx = null;
        this.gy = null;
        this.canvas1 = null;

        console.debug("Creating border container");
        this._borderContainer = new createjs.Container();
        this._expandedBoundary = null;
        this._collapsedBoundary = null;
        this.isShrunk = false;
        this._expandButton = null;
        this._expandLabel = null;
        this._expandLabelBG = null;
        this._collapseButton = null;
        this._collapseLabel = null;
        this._collapseLabelBG = null;
        this._clearButton = null;
        this._clearLabel = null;
        this._clearLabelBG = null;
        this._gridButton = null;
        this._gridLabel = null;
        this._gridLabelBG = null;
        this._locked = false;
        this._queue = [];               // temporarily stores [w, h, scale]

        // List of all of the turtles, one for each start block
        this.turtleList = [];
    }

    /**
     * @param {Object} stage
     * @returns {this}
     */
    setMasterStage(stage) {
        this.masterStage = stage;
        return this;
    }

    /**
     * @param {Object} stage
     * @returns {this}
     */
    setStage(stage) {
        this.stage = stage;
        this.stage.addChild(this._borderContainer);
        return this;
    }

    /**
     * @param {Function} hideGrids
     * @returns {this}
     */
    setHideGrids(hideGrids) {
        this.hideGrids = hideGrids;
        return this;
    }

    /**
     * @param {Function} doGrid
     * @returns {this}
     */
    setDoGrid(doGrid) {
        this.doGrid = doGrid;
        return this;
    }

/**
 * @param {Function} hideMenu
 * @returns {this}
 */
    setHideMenu(hideMenu) {
        this.hideMenu = hideMenu;
        return this;
    }

    /**
     * @param {Function} doClear
     * @returns {this}
     */
    setClear(doClear) {
        this.doClear = doClear;
        return this;
    }

    /**
     * @param {Object} canvas
     * @returns {this}
     */
    setCanvas(canvas) {
        this._canvas = canvas;
        return this;
    }

    /**
     * @param {Function} refreshCanvas
     * @returns {this}
     */
    setRefreshCanvas(refreshCanvas) {
        this.refreshCanvas = refreshCanvas;
        return this;
    }

    /**
     * @param {String} text
     * @returns {void}
     */
    setGridLabel(text) {
        if (this._gridLabel !== null) {
            this._gridLabel.text = text;
        }
    }

    /**
     * Returns block object.
     *
     * @param blocks
     * @returns {this}
     */
    setBlocks(blocks) {
        this.blocks = blocks;
        return this;
    }

    /**
     * Sets the scale of the turtle canvas.
     *
     * @param {Number} scale - scale factor in [0, 1]
     * @returns {void}
     */
    setStageScale(scale) {
        this.stage.scaleX = scale;
        this.stage.scaleY = scale;
        this.refreshCanvas();
    }

    /**
     * Scales the canvas.
     *
     * @param {Number} w - width
     * @param {Number} h - height
     * @param {Number} scale - scale factor in [0, 1]
     * @returns {void}
     */
    doScale(w, h, scale) {
        if (this._locked) {
            this._queue = [w, h, scale];
        } else {
            this.scale = scale;
            this.w = w / scale;
            this.h = h / scale;
        }

        this.makeBackground();
    }

    /**
     * Adds y offset to stage.
     *
     * @param {Number} dy - delta y
     * @returns {void}
     */
    deltaY(dy) {
        this.stage.y += dy;
    }

    /**
 * Convert on screen x coordinate to turtle x coordinate.
 *
 * @param {Number} x - screen x coordinate
 * @returns {Number} turtle x coordinate
 */
    screenX2turtleX(x) {
        return x - this._canvas.width / (2.0 * this.scale);
    }

    /**
     * Convert on screen y coordinate to turtle y coordinate.
     *
     * @param {Number} y - screen y coordinate
     * @returns {Number} turtle y coordinate
     */
    screenY2turtleY(y) {
        return this.invertY(y);
    }

    /**
     * Convert turtle x coordinate to on screen x coordinate.
     *
     * @param {Number} x - turtle x coordinate
     * @returns {Number} screen x coordinate
     */
    turtleX2screenX(x) {
        return this._canvas.width / (2.0 * this.scale) + x;
    }

    /**
     * Convert turtle y coordinate to on screen y coordinate.
     *
     * @param {Number} y - turtle y coordinate
     * @returns {Number} screen y coordinate
     */
    turtleY2screenY(y) {
        return this.invertY(y);
    };

    /**
     * Invert y coordinate.
     *
     * @param {Number} y - y coordinate
     * @returns {Number} inverted y coordinate
     */
    invertY(y) {
        return this._canvas.height / (2.0 * this.scale) - y;
    }

    /**
     * Adds drum to start block.
     *
     * @param {Object} startBlock - name of startBlock
     * @param {Object} infoDict - contains turtle color, shade, pensize, x, y, heading, etc.
     * @returns {void}
     */
    addDrum(startBlock, infoDict) {
        this._drum = true;
        this.add(startBlock, infoDict);
    }

    /**
     * Adds turtle to start block.
     *
     * @param {Object} startBlock - name of startBlock
     * @param {Object} infoDict - contains turtle color, shade, pensize, x, y, heading, etc.
     * @returns {void}
     */
    addTurtle(startBlock, infoDict) {
        this._drum = false;
        this.add(startBlock, infoDict);
        if (this.isShrunk) {
            let t = last(this.turtleList);
            t.container.scaleX = SCALEFACTOR;
            t.container.scaleY = SCALEFACTOR;
            t.container.scale = SCALEFACTOR;
        }
    }

    /**
     * Makes background for canvas: clears containers, renders buttons.
     *
     * @param setCollapsed - specify whether the background should be collapsed
     */
    makeBackground(setCollapsed) {
        let doCollapse = setCollapsed === undefined ? false : setCollapsed;

        // Remove any old background containers
        for (let i = 0; i < this._borderContainer.children.length; i++) {
            this._borderContainer.children[i].visible = false;
            this._borderContainer.removeChild(
                this._borderContainer.children[i]
            );
        }

        // We put the buttons on the stage so they will be on top
        if (this._expandButton !== null) {
            this.stage.removeChild(this._expandButton);
        }

        if (this._collapseButton !== null) {
            this.stage.removeChild(this._collapseButton);
        }

        if (this._clearButton !== null) {
            this.stage.removeChild(this._clearButton);
        }

        if (this._gridButton !== null) {
            this.stage.removeChild(this._gridButton);
        }

        let circles = null;

        /**
         * Toggles visibility of menu and grids.
         * Scales down all 'turtles' in turtleList.
         * Removes the stage and adds it back at the top.
         */
        let __collapse = () => {
            this.hideMenu();
            this.hideGrids();
            this.setStageScale(0.25);
            this._collapsedBoundary.visible = true;
            this._expandButton.visible = true;
            this._expandedBoundary.visible = false;
            this._collapseButton.visible = false;
            this.stage.x = (this.w * 3) / 4 - 10;
            this.stage.y = 55 + LEADING + 6;
            this.isShrunk = true;
            for (let i = 0; i < this.turtleList.length; i++) {
                this.turtleList[i].container.scaleX = SCALEFACTOR;
                this.turtleList[i].container.scaleY = SCALEFACTOR;
                this.turtleList[i].container.scale = SCALEFACTOR;
            }

            this._clearButton.scaleX = SCALEFACTOR;
            this._clearButton.scaleY = SCALEFACTOR;
            this._clearButton.scale = SCALEFACTOR;
            this._clearButton.x = this.w - 5 - 8 * 55;

            if (this._gridButton !== null) {
                this._gridButton.scaleX = SCALEFACTOR;
                this._gridButton.scaleY = SCALEFACTOR;
                this._gridButton.scale = SCALEFACTOR;
                this._gridButton.x = this.w - 10 - 12 * 55;
                this._gridButton.visible = false;
            }

            // remove the stage and add it back at the top
            this.masterStage.removeChild(this.stage);
            this.masterStage.addChild(this.stage);

            this.refreshCanvas();
        }

        /**
         * Makes 'cartesian' button by initailising 'CARTESIANBUTTON' SVG.
         * Assigns click listener function to doGrid() method.
         */
        let __makeGridButton = () => {
            this._gridButton = new createjs.Container();
            this._gridLabel = null;
            this._gridLabelBG = null;

            this._gridButton.removeAllEventListeners("click");
            this._gridButton.on("click", event => {
                this.doGrid();
            });

            this._gridLabel = new createjs.Text(
                _("show Cartesian"),
                "14px Sans",
                "#282828"
            );
            this._gridLabel.textAlign = "center";
            this._gridLabel.x = 27.5;
            this._gridLabel.y = 55;
            this._gridLabel.visible = false;

            let img = new Image();
            img.onload = () => {
                let bitmap = new createjs.Bitmap(img);
                this._gridButton.addChild(bitmap);
                this._gridButton.addChild(this._gridLabel);

                bitmap.visible = true;
                this._gridButton.x = this.w - 10 - 3 * 55;
                this._gridButton.y = 70 + LEADING + 6;
                this._gridButton.visible = true;

                // this._borderContainer.addChild(this._gridButton);
                this.stage.addChild(this._gridButton);
                this.refreshCanvas();

                this._gridButton.removeAllEventListeners("mouseover");
                this._gridButton.on("mouseover", event => {
                    if (this._gridLabel !== null) {
                        this._gridLabel.visible = true;

                        if (this._gridLabelBG === null) {
                            let b = this._gridLabel.getBounds();
                            this._gridLabelBG = new createjs.Shape();
                            this._gridLabelBG.graphics
                                .beginFill("#FFF")
                                .drawRoundRect(
                                    this._gridLabel.x + b.x - 8,
                                    this._gridLabel.y + b.y - 2,
                                    b.width + 16,
                                    b.height + 8,
                                    10,
                                    10,
                                    10,
                                    10
                                );
                            this._gridButton.addChildAt(this._gridLabelBG, 0);
                        } else {
                            this._gridLabelBG.visible = true;
                        }

                        let r = 55 / 2;
                        circles = showButtonHighlight(
                            this._gridButton.x + 28,
                            this._gridButton.y + 28,
                            r,
                            event,
                            palettes.scale,
                            this.stage
                        );
                    }

                    this.refreshCanvas();
                });

                this._gridButton.removeAllEventListeners("mouseout");
                this._gridButton.on("mouseout", event => {
                    hideButtonHighlight(circles, this.stage);
                    if (this._gridLabel !== null) {
                        this._gridLabel.visible = false;
                        this._gridLabelBG.visible = false;
                        this.refreshCanvas();
                    }
                });

                if (doCollapse) {
                    __collapse();
                }

                this._locked = false;
                if (this._queue.length === 3) {
                    this.scale = this._queue[2];
                    this.w = this._queue[0] / this.scale;
                    this.h = this._queue[1] / this.scale;
                    this._queue = [];
                    this.makeBackground();
                }
            };

            img.src =
                "data:image/svg+xml;base64," +
                window.btoa(unescape(encodeURIComponent(CARTESIANBUTTON)));
        };

        /**
         * Makes clear button by initailising 'CLEARBUTTON' SVG.
         * Assigns click listener function to call doClear() method.
         */
        let __makeClearButton = () => {
            this._clearButton = new createjs.Container();
            this._clearLabel = null;
            this._clearLabelBG = null;

            this._clearButton.removeAllEventListeners("click");
            this._clearButton.on("click", event => {
                this.doClear();
            });

            this._clearLabel = new createjs.Text(
                _("Clean"),
                "14px Sans",
                "#282828"
            );
            this._clearLabel.textAlign = "center";
            this._clearLabel.x = 27.5;
            this._clearLabel.y = 55;
            this._clearLabel.visible = false;

            let img = new Image();
            img.onload = () => {
                let bitmap = new createjs.Bitmap(img);
                this._clearButton.addChild(bitmap);
                this._clearButton.addChild(this._clearLabel);

                bitmap.visible = true;
                this._clearButton.x = this.w - 5 - 2 * 55;
                this._clearButton.y = 70 + LEADING + 6;
                this._clearButton.visible = true;

                // this._borderContainer.addChild(this._clearButton);
                this.stage.addChild(this._clearButton);
                this.refreshCanvas();

                this._clearButton.removeAllEventListeners("mouseover");
                this._clearButton.on("mouseover", event => {
                    if (this._clearLabel !== null) {
                        this._clearLabel.visible = true;

                        if (this._clearLabelBG === null) {
                            let b = this._clearLabel.getBounds();
                            this._clearLabelBG = new createjs.Shape();
                            this._clearLabelBG.graphics
                                .beginFill("#FFF")
                                .drawRoundRect(
                                    this._clearLabel.x + b.x - 8,
                                    this._clearLabel.y + b.y - 2,
                                    b.width + 16,
                                    b.height + 8,
                                    10,
                                    10,
                                    10,
                                    10
                                );
                            this._clearButton.addChildAt(this._clearLabelBG, 0);
                        } else {
                            this._clearLabelBG.visible = true;
                        }

                        let r = 55 / 2;
                        circles = showButtonHighlight(
                            this._clearButton.x + 28,
                            this._clearButton.y + 28,
                            r,
                            event,
                            palettes.scale,
                            this.stage
                        );
                    }

                    this.refreshCanvas();
                });

                this._clearButton.removeAllEventListeners("mouseout");
                this._clearButton.on("mouseout", event => {
                    hideButtonHighlight(circles, this.stage);
                    if (this._clearLabel !== null) {
                        this._clearLabel.visible = false;
                    }

                    if (this._clearLabelBG !== null) {
                        this._clearLabelBG.visible = false;
                    }

                    this.refreshCanvas();
                });

                if (doCollapse) {
                    __collapse();
                }

                let language = localStorage.languagePreference;
                // if (!beginnerMode || language !== 'ja') {
                __makeGridButton();
                // }
            };

            img.src =
                "data:image/svg+xml;base64," +
                window.btoa(unescape(encodeURIComponent(CLEARBUTTON)));
        };

        /**
         * Makes collapse button by initailising 'EXPANDBUTTON' SVG.
         * Assigns click listener function to call __collapse() method.
         */
        let __makeCollapseButton = () => {
            this._collapseButton = new createjs.Container();
            this._collapseLabel = null;
            this._collapseLabelBG = null;

            this._collapseLabel = new createjs.Text(
                _("Collapse"),
                "14px Sans",
                "#282828"
            );
            this._collapseLabel.textAlign = "center";
            this._collapseLabel.x = 11.5;
            this._collapseLabel.y = 55;
            this._collapseLabel.visible = false;

            let img = new Image();
            img.onload = () => {
                if (this._collapseButton !== null) {
                    this._collapseButton.visible = false;
                }

                let bitmap = new createjs.Bitmap(img);
                this._collapseButton.addChild(bitmap);
                bitmap.visible = true;
                this._collapseButton.addChild(this._collapseLabel);

                // this._borderContainer.addChild(this._collapseButton);
                this.stage.addChild(this._collapseButton);

                this._collapseButton.visible = true;
                this._collapseButton.x = this.w - 55;
                this._collapseButton.y = 70 + LEADING + 6;
                this.refreshCanvas();

                this._collapseButton.removeAllEventListeners("click");
                this._collapseButton.on("click", event => {
                    // If the aux toolbar is open, close it.
                    let auxToolbar = docById("aux-toolbar");
                    if (auxToolbar.style.display === "block") {
                        let menuIcon = docById("menu");
                        auxToolbar.style.display = "none";
                        menuIcon.innerHTML = "menu";
                        docById("toggleAuxBtn").className -= "blue darken-1";
                    }
                    __collapse();
                });

                this._collapseButton.removeAllEventListeners("mouseover");
                this._collapseButton.on("mouseover", event => {
                    if (this._collapseLabel !== null) {
                        this._collapseLabel.visible = true;

                        if (this._collapseLabelBG === null) {
                            let b = this._collapseLabel.getBounds();
                            this._collapseLabelBG = new createjs.Shape();
                            this._collapseLabelBG.graphics
                                .beginFill("#FFF")
                                .drawRoundRect(
                                    this._collapseLabel.x + b.x - 8,
                                    this._collapseLabel.y + b.y - 2,
                                    b.width + 16,
                                    b.height + 8,
                                    10,
                                    10,
                                    10,
                                    10
                                );
                            this._collapseButton.addChildAt(
                                this._collapseLabelBG,
                                0
                            );
                        } else {
                            this._collapseLabelBG.visible = true;
                        }

                        let r = 55 / 2;
                        circles = showButtonHighlight(
                            this._collapseButton.x + 28,
                            this._collapseButton.y + 28,
                            r,
                            event,
                            palettes.scale,
                            this.stage
                        );
                    }

                    this.refreshCanvas();
                });

                this._collapseButton.removeAllEventListeners("mouseout");
                this._collapseButton.on("mouseout", event => {
                    hideButtonHighlight(circles, this.stage);
                    if (this._collapseLabel !== null) {
                        this._collapseLabel.visible = false;
                        this._collapseLabelBG.visible = false;
                        this.refreshCanvas();
                    }
                });

                __makeClearButton();
            };

            img.src =
                "data:image/svg+xml;base64," +
                window.btoa(unescape(encodeURIComponent(COLLAPSEBUTTON)));
        };

        /**
         * Makes expand button by initailising 'EXPANDBUTTON' SVG.
         * Assigns click listener function to remove stage and add it at posiion 0.
         */
        let __makeExpandButton = () => {
            this._expandButton = new createjs.Container();
            this._expandLabel = null;
            this._expandLabelBG = null;

            this._expandLabel = new createjs.Text(
                _("Expand"),
                "14px Sans",
                "#282828"
            );
            this._expandLabel.textAlign = "center";
            this._expandLabel.x = 11.5;
            this._expandLabel.y = 55;
            this._expandLabel.visible = false;

            let img = new Image();
            img.onload = () => {
                if (this._expandButton !== null) {
                    this._expandButton.visible = false;
                }

                let bitmap = new createjs.Bitmap(img);
                this._expandButton.addChild(bitmap);
                bitmap.visible = true;
                this._expandButton.addChild(this._expandLabel);

                this._expandButton.x = this.w - 10 - 4 * 55;
                this._expandButton.y = 70 + LEADING + 6;
                this._expandButton.scaleX = SCALEFACTOR;
                this._expandButton.scaleY = SCALEFACTOR;
                this._expandButton.scale = SCALEFACTOR;
                this._expandButton.visible = false;
                // this._borderContainer.addChild(this._expandButton);
                this.stage.addChild(this._expandButton);

                this._expandButton.removeAllEventListeners("mouseover");
                this._expandButton.on("mouseover", event => {
                    if (this._expandLabel !== null) {
                        this._expandLabel.visible = true;

                        if (this._expandLabelBG === null) {
                            let b = this._expandLabel.getBounds();
                            this._expandLabelBG = new createjs.Shape();
                            this._expandLabelBG.graphics
                                .beginFill("#FFF")
                                .drawRoundRect(
                                    this._expandLabel.x + b.x - 8,
                                    this._expandLabel.y + b.y - 2,
                                    b.width + 16,
                                    b.height + 8,
                                    10,
                                    10,
                                    10,
                                    10
                                );
                            this._expandButton.addChildAt(
                                this._expandLabelBG,
                                0
                            );
                        } else {
                            this._expandLabelBG.visible = true;
                        }
                    }

                    this.refreshCanvas();
                });

                this._expandButton.removeAllEventListeners("mouseout");
                this._expandButton.on("mouseout", event => {
                    if (this._expandLabel !== null) {
                        this._expandLabel.visible = false;
                        this._expandLabelBG.visible = false;
                        this.refreshCanvas();
                    }
                });

                this._expandButton.removeAllEventListeners("pressmove");
                this._expandButton.on("pressmove", event => {
                    let w = (this.w - 10 - SCALEFACTOR * 55) / SCALEFACTOR;
                    let x = event.stageX / this.scale - w;
                    let y = event.stageY / this.scale - 16;
                    this.stage.x = Math.max(0, Math.min((this.w * 3) / 4, x));
                    this.stage.y = Math.max(55, Math.min((this.h * 3) / 4, y));
                    this.refreshCanvas();
                });

                this._expandButton.removeAllEventListeners("click");
                this._expandButton.on("click", event => {
                    // If the aux toolbar is open, close it.
                    let auxToolbar = docById("aux-toolbar");
                    if (auxToolbar.style.display === "block") {
                        let menuIcon = docById("menu");
                        auxToolbar.style.display = "none";
                        menuIcon.innerHTML = "menu";
                        docById("toggleAuxBtn").className -= "blue darken-1";
                    }
                    this.hideMenu();
                    this.setStageScale(1.0);
                    this._expandedBoundary.visible = true;
                    this._collapseButton.visible = true;
                    this._collapsedBoundary.visible = false;
                    this._expandButton.visible = false;
                    this.stage.x = 0;
                    this.stage.y = 0;
                    this.isShrunk = false;
                    for (let i = 0; i < this.turtleList.length; i++) {
                        this.turtleList[i].container.scaleX = 1;
                        this.turtleList[i].container.scaleY = 1;
                        this.turtleList[i].container.scale = 1;
                    }

                    this._clearButton.scaleX = 1;
                    this._clearButton.scaleY = 1;
                    this._clearButton.scale = 1;
                    this._clearButton.x = this.w - 5 - 2 * 55;

                    if (this._gridButton !== null) {
                        this._gridButton.scaleX = 1;
                        this._gridButton.scaleY = 1;
                        this._gridButton.scale = 1;
                        this._gridButton.x = this.w - 10 - 3 * 55;
                        this._gridButton.visible = true;
                    }

                    // remove the stage and add it back in position 0
                    this.masterStage.removeChild(this.stage);
                    this.masterStage.addChildAt(this.stage, 0);
                });

                __makeCollapseButton();
            };

            img.src =
                "data:image/svg+xml;base64," +
                window.btoa(unescape(encodeURIComponent(EXPANDBUTTON)));
        };

        /**
         * Makes second boundary for graphics (mouse) container by initialising 'MBOUNDARY' SVG.
         */
        let __makeBoundary2 = () => {
            let img = new Image();
            img.onload = () => {
                if (this._collapsedBoundary !== null) {
                    this._collapsedBoundary.visible = false;
                }

                this._collapsedBoundary = new createjs.Bitmap(img);
                this._collapsedBoundary.x = 0;
                this._collapsedBoundary.y = 55 + LEADING;
                this._borderContainer.addChild(this._collapsedBoundary);
                this._collapsedBoundary.visible = false;

                __makeExpandButton();
            };

            let dx = this.w - 20;
            let dy = this.h - 55 - LEADING;
            img.src =
                "data:image/svg+xml;base64," +
                window.btoa(
                    unescape(
                        encodeURIComponent(
                            MBOUNDARY.replace("HEIGHT", this.h)
                                .replace("WIDTH", this.w)
                                .replace("Y", 10)
                                .replace("X", 10)
                                .replace("DY", dy)
                                .replace("DX", dx)
                                .replace(
                                    "stroke_color",
                                    platformColor.ruleColor
                                )
                                .replace("fill_color", this.backgroundColor)
                                .replace("STROKE", 20)
                        )
                    )
                );
        };

        /**
         * Makes boundary for graphics (mouse) container by initialising
         * 'MBOUNDARY' SVG.
         */
        let __makeBoundary = () => {
            this._locked = true;
            let img = new Image();
            img.onload = () => {
                if (this._expandedBoundary !== null) {
                    this._expandedBoundary.visible = false;
                }

                this._expandedBoundary = new createjs.Bitmap(img);
                this._expandedBoundary.x = 0;
                this._expandedBoundary.y = 55 + LEADING;
                this._borderContainer.addChild(this._expandedBoundary);
                __makeBoundary2();
            };

            let dx = this.w - 5;
            let dy = this.h - 55 - LEADING;
            img.src =
                "data:image/svg+xml;base64," +
                window.btoa(
                    unescape(
                        encodeURIComponent(
                            MBOUNDARY.replace("HEIGHT", this.h)
                                .replace("WIDTH", this.w)
                                .replace("Y", 10 / SCALEFACTOR)
                                .replace("X", 10 / SCALEFACTOR)
                                .replace("DY", dy)
                                .replace("DX", dx)
                                .replace(
                                    "stroke_color",
                                    platformColor.ruleColor
                                )
                                .replace("fill_color", this.backgroundColor)
                                .replace("STROKE", 20 / SCALEFACTOR)
                        )
                    )
                );
        };

        if (!this._locked) {
            __makeBoundary();
        }

        return this;
    }

    /**
     * Add a new turtle for each start block.
     * Creates container for each turtle.
     *
     * @param startBlock - name of startBlock
     * @param infoDict - contains turtle color, shade, pensize, x, y, heading, etc.
     */
    add(startBlock, infoDict) {
        if (startBlock != null) {
            console.debug("adding a new turtle " + startBlock.name);
            if (startBlock.value !== this.turtleList.length) {
                startBlock.value = this.turtleList.length;
                console.debug("turtle #" + startBlock.value);
            }
        } else {
            console.debug("adding a new turtle startBlock is null");
        }

        let blkInfoAvailable = false;

        if (typeof infoDict === "object") {
            if (Object.keys(infoDict).length > 0) {
                blkInfoAvailable = true;
            }
        }

        let i = this.turtleList.length % 10;
        let turtleName =
            blkInfoAvailable && "name" in infoDict ?
                infoDict["name"] : _("start");
        let newTurtle = new Turtle(turtleName, this, this._drum);

        if (blkInfoAvailable) {
            if ("xcor" in infoDict) {
                newTurtle.x = infoDict["xcor"];
            }
            if ("ycor" in infoDict) {
                newTurtle.y = infoDict["ycor"];
            }
        }

        this.turtleList.push(newTurtle);

        // Each turtle needs its own canvas
        newTurtle.imageContainer = new createjs.Container();
        this.stage.addChild(newTurtle.imageContainer);
        newTurtle.penstrokes = new createjs.Bitmap();
        this.stage.addChild(newTurtle.penstrokes);

        newTurtle.container = new createjs.Container();
        this.stage.addChild(newTurtle.container);
        newTurtle.container.x = this.turtleX2screenX(newTurtle.x);
        newTurtle.container.y = this.turtleY2screenY(newTurtle.y);

        // Ensure that the buttons are on top
        this.stage.removeChild(this._expandButton);
        this.stage.addChild(this._expandButton);
        this.stage.removeChild(this._collapseButton);
        this.stage.addChild(this._collapseButton);
        this.stage.removeChild(this._clearButton);
        this.stage.addChild(this._clearButton);
        if (this._gridButton !== null) {
            this.stage.removeChild(this._gridButton);
            this.stage.addChild(this._gridButton);
        }

        let hitArea = new createjs.Shape();
        hitArea.graphics.beginFill("#FFF").drawEllipse(-27, -27, 55, 55);
        hitArea.x = 0;
        hitArea.y = 0;
        newTurtle.container.hitArea = hitArea;

        let artwork = this._drum ? DRUMSVG : TURTLESVG;

        if (sugarizerCompatibility.isInsideSugarizer()) {
            artwork = artwork
                .replace(/fill_color/g, sugarizerCompatibility.xoColor.fill)
                .replace(
                    /stroke_color/g,
                    sugarizerCompatibility.xoColor.stroke
                );
        } else {
            artwork = artwork
                .replace(/fill_color/g, FILLCOLORS[i])
                .replace(/stroke_color/g, STROKECOLORS[i]);
        }

        newTurtle._makeTurtleBitmap(artwork, startBlock, this.refreshCanvas);

        newTurtle.color = i * 10;
        newTurtle.canvasColor = getMunsellColor(
            newTurtle.color,
            DEFAULTVALUE,
            DEFAULTCHROMA
        );

        newTurtle.container.on("mousedown", event => {
            let offset = {
                x: newTurtle.container.x - event.stageX / this.scale,
                y: newTurtle.container.y - event.stageY / this.scale
            };

            newTurtle.container.removeAllEventListeners("pressmove");
            newTurtle.container.on("pressmove", event => {
                if (newTurtle.running) {
                    return;
                }

                newTurtle.container.x = event.stageX / this.scale + offset.x;
                newTurtle.container.y = event.stageY / this.scale + offset.y;
                newTurtle.x = this.screenX2turtleX(newTurtle.container.x);
                newTurtle.y = this.screenY2turtleY(newTurtle.container.y);
                this.refreshCanvas();
            });
        });

        newTurtle.container.on("click", event => {
            // If turtles listen for clicks then they can be used as buttons
            console.debug("--> [click " + newTurtle.name + "]");
            this.stage.dispatchEvent("click" + newTurtle.name);
        });

        newTurtle.container.on("mouseover", event => {
            if (newTurtle.running) {
                return;
            }

            newTurtle.container.scaleX *= 1.2;
            newTurtle.container.scaleY = newTurtle.container.scaleX;
            newTurtle.container.scale = newTurtle.container.scaleX;
            this.refreshCanvas();
        });

        newTurtle.container.on("mouseout", event => {
            if (newTurtle.running) {
                return;
            }

            newTurtle.container.scaleX /= 1.2;
            newTurtle.container.scaleY = newTurtle.container.scaleX;
            newTurtle.container.scale = newTurtle.container.scaleX;
            this.refreshCanvas();
        });

        document.getElementById("loader").className = "";

        setTimeout(() => {
            if (blkInfoAvailable) {
                if ("heading" in infoDict) {
                    newTurtle.doSetHeading(infoDict["heading"]);
                }

                if ("pensize" in infoDict) {
                    newTurtle.doSetPensize(infoDict["pensize"]);
                }

                if ("grey" in infoDict) {
                    newTurtle.doSetChroma(infoDict["grey"]);
                }

                if ("shade" in infoDict) {
                    newTurtle.doSetValue(infoDict["shade"]);
                }

                if ("color" in infoDict) {
                    newTurtle.doSetColor(infoDict["color"]);
                }

                if ("name" in infoDict) {
                    newTurtle.rename(infoDict["name"]);
                }
            }
        }, 6000);

        this.refreshCanvas();
    }

    /**
     * Toggles 'running' boolean value for all turtles.
     *
     * @returns {void}
     */
    markAsStopped() {
        for (let turtle in this.turtleList) {
            this.turtleList[turtle].running = false;
            // Make sure the blink is really stopped
            // this.turtleList[turtle].stopBlink();
        }

        this.refreshCanvas();
    }

    /**
     * Returns boolean value depending on whether turtle is running.
     *
     * @return {Boolean} - running
     */
    running() {
        for (let turtle in this.turtleList) {
            if (this.turtleList[turtle].running) {
                return true;
            }
        }
        return false;
    }
}

/**
 * Class pertaining to Turtles Model.
 *
 * @class
 * @classdesc This is the prototype of the Model for the Turtles component.
 * It should store the data structures that control behavior of the model,
 * and the methods to interact with them.
 */
class TurtlesModel {
    /**
     * @constructor
     */
    constructor() {

    }
}

/**
 * Class pertaining to Turtles View.
 *
 * @class
 * @classdesc This is the prototype of the View for the Turtles component.
 * It should make changes to the view, while using members of the Model
 * through Turtles (controller). An action may require updating the state
 * (of the Model), which it can do by calling methods of the Model, also
 * through Turtles (controller).
 */
class TurtlesView {
    /**
     * @constructor
     */
    constructor() {

    }
}
