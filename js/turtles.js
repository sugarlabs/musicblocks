/* eslint-disable no-undef */
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

/*
   global createjs, platformColor, last, importMembers, setupRhythmActions, setupMeterActions,
   setupPitchActions, setupIntervalsActions, setupToneActions, setupOrnamentActions,
   setupVolumeActions, setupDrumActions, setupDictActions, _, Turtle, TURTLESVG, METRONOMESVG,
   FILLCOLORS, STROKECOLORS, getMunsellColor, DEFAULTVALUE, DEFAULTCHROMA,
   jQuery, docById, LEADING, CARTESIANBUTTON, piemenuGrid, CLEARBUTTON, COLLAPSEBUTTON,
   EXPANDBUTTON, MBOUNDARY
 */

/* exported Turtles */

// What is the scale factor when stage is shrunk?
const CONTAINERSCALEFACTOR = 4;

/**
 * Class for managing all the turtles.
 *
 * @class
 * @classdesc This is the prototype of the Turtles controller which
 * acts as a bridge between the Turtles model and the Turtles view,
 * and serves as a gateway to any external code.
 *
 * External code instantiates this class, and can access all the members
 * of TurtlesView and TurtlesModel.
 *
 * This component contains properties and controls relevant to the set
 * of all turtles like maintaining the canvases on which turtles draw.
 */
class Turtles {
    /**
     * @constructor
     */
    constructor(activity) {
        // Import members of model and view (arguments only for model)
        importMembers(this, "", [activity]);
        // Inititalize all actions related to blocks executed by Turtle objects
        this.initActions();
    }

    /**
     * Inititalizes all supporting action related classes & methods of Turtle.
     *
     * @returns {void}
     */
    initActions() {
        setupRhythmActions(this.activity);
        setupMeterActions(this.activity);
        setupPitchActions(this.activity);
        setupIntervalsActions(this.activity);
        setupToneActions(this.activity);
        setupOrnamentActions(this.activity);
        setupVolumeActions(this.activity);
        setupDrumActions(this.activity);
        setupDictActions(this.activity);
    }

    /**
     * Adds turtle to start block.
     *
     * @param {Object} startBlock - name of startBlock
     * @param {Object} infoDict - contains turtle color, shade, pensize, x, y, heading, etc.
     * @returns {void}
     */
    addTurtle(startBlock, infoDict) {
        this.add(startBlock, infoDict);
        if (this.isShrunk()) {
            const lastTurtle = this.getTurtle(this.getTurtleCount() - 1);
            lastTurtle.container.scaleX = CONTAINERSCALEFACTOR;
            lastTurtle.container.scaleY = CONTAINERSCALEFACTOR;
            lastTurtle.container.scale = CONTAINERSCALEFACTOR;
        }
    }

    /**
     * Add a new turtle for each start block.
     * Creates container for each turtle.
     *
     * @param startBlock - name of startBlock
     * @param infoDict - contains turtle color, shade, pensize, x, y, heading, etc.
     * @returns {void}
     */
    add(startBlock, infoDict) {
        if (startBlock !== null) {
            // console.debug("adding a new turtle " + startBlock.name);
            if (startBlock.value !== this.getTurtleCount()) {
                startBlock.value = this.getTurtleCount();
                // console.debug("turtle #" + startBlock.value);
            }
        }

        const blkInfoAvailable =
            typeof infoDict === "object" && Object.keys(infoDict).length > 0 ? true : false;

        // Unique ID of turtle is time of instantiation for the first time
        const id =
            blkInfoAvailable && "id" in infoDict && infoDict["id"] !== Infinity
                ? infoDict["id"]
                : Date.now();

        const turtleName = blkInfoAvailable && "name" in infoDict ? infoDict["name"] : _("start");

        // Instantiate a new Turtle object
        const turtle = new Turtle(this.activity, id, turtleName, this, startBlock);

        // Add turtle model properties and store color index for turtle
        this.addTurtleStageProps(turtle, blkInfoAvailable, infoDict);

        const turtlesStage = this.activity.stage;

        let i = this.getTurtleCount() % 10; // used for turtle (mouse) skin color
        this.pushTurtle(turtle); // add new turtle to turtle list

        if (startBlock === null) {
            // Hidden start block for when there are no start blocks
            return;
        }

        if (startBlock.name === "start") {
            this.createArtwork(turtle, i, true);
        } else {
            // Search for companion and use that turtle's colors.
            for (let j = 0; j < this.getTurtleCount(); j++) {
                if (this.getTurtle(j).companionTurtle === this.getTurtleCount() - 1) {
                    i = j % 10;
                    break;
                }
            }
            this.createArtwork(turtle, i, false);
        }

        this.createHitArea(turtle);

        /*
        ===================================================
         Add event handlers
        ===================================================
        */

        turtle.container.on("mousedown", event => {
            const scale = this.scale;
            const offset = {
                x: turtle.container.x - event.stageX / scale,
                y: turtle.container.y - event.stageY / scale
            };

            turtlesStage.dispatchEvent("CursorDown" + turtle.id);
            // console.debug("--> [CursorDown " + turtle.name + "]");

            turtle.container.removeAllEventListeners("pressmove");
            turtle.container.on("pressmove", event => {
                if (this.isShrunk() || turtle.running) {
                    return;
                }

                turtle.container.x = event.stageX / scale + offset.x;
                turtle.container.y = event.stageY / scale + offset.y;
                turtle.x = this.screenX2turtleX(turtle.container.x);
                turtle.y = this.screenY2turtleY(turtle.container.y);
                this.activity.refreshCanvas();
            });
        });

        turtle.container.on("pressup", () => {
            // console.debug("--> [CursorUp " + turtle.name + "]");
            turtlesStage.dispatchEvent("CursorUp" + turtle.id);
        });

        turtle.container.on("click", () => {
            // If turtles listen for clicks then they can be used as buttons
            // console.debug("--> [click " + turtle.name + "]");
            turtlesStage.dispatchEvent("click" + turtle.id);
        });

        turtle.container.on("mouseover", () => {
            // console.debug("--> [mouseover " + turtle.name + "]");
            turtlesStage.dispatchEvent("CursorOver" + turtle.id);

            if (turtle.running) {
                return;
            }

            turtle.container.scaleX *= 1.2;
            turtle.container.scaleY = turtle.container.scaleX;
            turtle.container.scale = turtle.container.scaleX;
            this.activity.refreshCanvas();
        });

        turtle.container.on("mouseout", () => {
            // console.debug("--> [mouseout " + turtle.name + "]");
            turtlesStage.dispatchEvent("CursorOut" + turtle.id);

            if (turtle.running) {
                return;
            }

            turtle.container.scaleX /= 1.2;
            turtle.container.scaleY = turtle.container.scaleX;
            turtle.container.scale = turtle.container.scaleX;
            this.activity.refreshCanvas();
        });

        document.getElementById("loader").className = "";

        this.addTurtleGraphicProps(turtle, blkInfoAvailable, infoDict);
        this.activity.refreshCanvas();
    }

    /**
     * Toggles 'running' boolean value for all turtles.
     *
     * @returns {void}
     */
    markAllAsStopped() {
        for (let i = 0; i < this.getTurtleCount(); i++) {
            const turtle = this.getTurtle(i);
            turtle.running = false;
        }

        this.activity.refreshCanvas();
    }

    // ================================ MODEL =================================
    // ========================================================================

    /**
     * @param {Object} stage
     */
    set masterStage(stage) {
        this._masterStage = stage;
    }

    /**
     * @returns {Object} - master stage object
     */
    get masterStage() {
        return this._masterStage;
    }

    /**
     * @param {Object} stage
     */
    set stage(stage) {
        this._stage = stage;
        this._stage.addChild(this._borderContainer);
    }

    /**
     * @returns {Object} - stage object
     */
    get stage() {
        return this._stage;
    }

    /**
     * @param {Object} canvas
     */
    set canvas(canvas) {
        this._canvas = canvas;
    }

    /**
     * @return {Object} canvas object
     */
    get canvas() {
        return this._canvas;
    }

    /**
     * @returns {Object} border container object
     */
    get borderContainer() {
        return this._borderContainer;
    }

    /**
     * @param {Function} hideMenu - hide auxiliary menu
     */
    set hideMenu(hideMenu) {
        this._hideMenu = hideMenu;
    }

    /**
     * @returns {Function} hide auxiliary menu
     */
    get hideMenu() {
        return this._hideMenu;
    }

    /**
     * @param {Function} doClear - reset canvas and turtles
     */
    set doClear(doClear) {
        this._doClear = doClear;
    }

    /**
     * @returns {Function} reset canvas and turtles
     */
    get doClear() {
        return this._doClear;
    }

    /**
     * @param {Function} hideGrids - hide canvas gridwork
     */
    set hideGrids(hideGrids) {
        this._hideGrids = hideGrids;
    }

    /**
     * @returns {Function} hide canvas gridwork
     */
    get hideGrids() {
        return this._hideGrids;
    }

    /**
     * @param {Function} doGrid - show canvas gridwork
     */
    set doGrid(doGrid) {
        this._doGrid = doGrid;
    }

    /**
     * @returns {Function} show canvas gridwork
     */
    get doGrid() {
        return this._doGrid;
    }

    /**
     * @returns {Object[]} list of Turtle objects
     */
    get turtleList() {
        return this._turtleList;
    }

    // ================================ VIEW ==================================
    // ========================================================================

    /**
     * @returns {Number} scale factor
     */
    get scale() {
        return this._scale;
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
Turtles.TurtlesModel = class {
    /**
     * @constructor
     */
    constructor(activity) {
        this.activity = activity;
        this._masterStage = null; // createjs stage
        this._stage = null; // createjs container for turtle

        this._canvas = null; // DOM canvas element

        // These functions are directly called by TurtlesView
        this._hideMenu = null; // function to hide aux menu
        this._doClear = null; // function to clear the canvas
        this._hideGrids = null; // function to hide all grids
        this._doGrid = null; // function that renders Cartesian/Polar
        //  grids and changes button labels

        // createjs border container
        this._borderContainer = new createjs.Container();

        this._masterStage = this.activity.stage;
        this._stage = this.activity.turtleContainer;
        this._stage.addChild(this._borderContainer);
        this._canvas = this.activity.canvas;
        this._hideMenu = this.activity.hideAuxMenu;
        this._hideGrids = this.activity.hideGrids;
        this._doGrid = this.activity._doCartesianPolar;

        // List of all of the turtles, one for each start block
        this._turtleList = [];
    }

    /**
     * Initializes the turtleList with a given list of turtles.
     *
     * @param {Array} turtles - Array of turtle objects to initialize the list.
     * @returns {void}
     */
    initializeTurtleList(turtles) {
        this._turtleList = turtles;
    }

    /**
     * Returns the turtle at the specified index.
     *
     * @param {Number} index - The index of the turtle to retrieve.
     * @returns {Object} The turtle object at the specified index.
     */
    getTurtle(index) {
        const turtle = this._turtleList[index];
        if (!turtle) {
            throw new Error(`Turtle ${index} not found`);
        }
        return turtle;
    }

    /**
     * Returns the number of turtles in the turtleList.
     *
     * @returns {Number} The number of turtles.
     */
    getTurtleCount() {
        return this._turtleList.length;
    }

    /**
     * Save the Turtle object to the TurtleList.
     *
     * @returns {void}
     * @param {Object} turtle
     */
    pushTurtle(turtle) {
        if (!this._turtleList.includes(turtle)) this._turtleList.push(turtle);
    }

    /**
     * Returns the index of the turtle in the turtleList.
     *
     * @param {Object} turtle
     * @returns {Number} index
     */
    getIndexOfTurtle(turtle) {
        return this._turtleList.indexOf(turtle);
    }

    /**
     * Removes the turtle at the specified index from the turtleList.
     *
     * @param {Number} index - The index of the turtle to remove.
     * @returns {void}
     */
    removeTurtle(index) {
        if (index >= 0 && index < this._turtleList.length) {
            const turtle = this._turtleList[index];

            // Clear any active intervals to prevent memory leaks
            if (turtle.interval !== undefined) {
                const intervalId = turtle.interval;
                clearInterval(intervalId);
                turtle.interval = undefined;
            }

            this._turtleList.splice(index, 1);
        }
    }

    /**
     * Adds createjs related properties of turtles and turtlesStage.
     *
     * @param {Object} turtle
     * @param {Boolean} blkInfoAvailable
     * @param {Object} infoDict
     * @returns {void}
     */
    addTurtleStageProps(turtle, blkInfoAvailable, infoDict) {
        // Add x- and y- coordinates
        if (blkInfoAvailable) {
            if ("xcor" in infoDict) {
                turtle.x = infoDict["xcor"];
            }
            if ("ycor" in infoDict) {
                turtle.y = infoDict["ycor"];
            }
        }

        const turtlesStage = this._stage;

        // Each turtle needs its own canvas
        turtle.imageContainer = new createjs.Container();
        turtlesStage.addChild(turtle.imageContainer);
        turtle.penstrokes = new createjs.Bitmap();
        turtlesStage.addChild(turtle.penstrokes);

        turtle.container = new createjs.Container();
        turtlesStage.addChild(turtle.container);
        turtle.container.x = this.turtleX2screenX(turtle.x);
        turtle.container.y = this.turtleY2screenY(turtle.y);
    }

    /**
     * Creates the artwork (visual representation) for a turtle.
     *
     * @param {Object} turtle - Turtle object
     * @param {Number} i - Color index
     * @param {Boolean} useTurtleArtwork - Whether to use turtle or metronome artwork
     * @returns {void}
     */
    createArtwork(turtle, i, useTurtleArtwork) {
        const artwork = useTurtleArtwork ? TURTLESVG : METRONOMESVG;
        const fillColor = FILLCOLORS[i % FILLCOLORS.length];
        const strokeColor = STROKECOLORS[i % STROKECOLORS.length];

        const svgData = artwork
            .replace(/fill_color/g, fillColor)
            .replace(/stroke_color/g, strokeColor);

        const img = new Image();
        img.onload = () => {
            const bitmap = new createjs.Bitmap(img);
            bitmap.regX = 27;
            bitmap.regY = 27;
            turtle.container.addChild(bitmap);
            turtle._bitmap = bitmap;
            turtle._createCache();
            turtle.updateCache();
            this.activity.refreshCanvas();
        };
        img.src = "data:image/svg+xml;base64," + window.btoa(unescape(encodeURIComponent(svgData)));
    }

    /**
     * Creates sensor area for Turtle body.
     *
     * @param {*} turtle - Turtle object
     * @returns {void}
     */
    createHitArea(turtle) {
        const hitArea = new createjs.Shape();
        hitArea.graphics.beginFill("#FFF").drawEllipse(-27, -27, 55, 55);
        hitArea.x = 0;
        hitArea.y = 0;
        turtle.container.hitArea = hitArea;
    }

    /**
     * Adds graphic specific properties of Turtle object.
     *
     * @param {Object} turtle
     * @param {Boolean} blkInfoAvailable
     * @param {Object} infoDict
     * @returns {void}
     */
    addTurtleGraphicProps(turtle, blkInfoAvailable, infoDict) {
        requestAnimationFrame(() => {
            if (blkInfoAvailable) {
                if ("heading" in infoDict) {
                    turtle.painter.doSetHeading(infoDict["heading"]);
                }

                if ("pensize" in infoDict) {
                    turtle.painter.doSetPensize(infoDict["pensize"]);
                }

                if ("grey" in infoDict) {
                    turtle.painter.doSetChroma(infoDict["grey"]);
                }

                if ("shade" in infoDict) {
                    turtle.painter.doSetValue(infoDict["shade"]);
                }

                if ("color" in infoDict) {
                    turtle.painter.doSetColor(infoDict["color"]);
                }

                if ("name" in infoDict) {
                    turtle.rename(infoDict["name"]);
                }
            }
        });
    }

    /**
     * Returns boolean value depending on whether turtle is running.
     *
     * @return {Boolean} - running
     */
    running() {
        for (let i = 0; i < this.getTurtleCount(); i++) {
            if (this.getTurtle(i).running) {
                return true;
            }
        }
        return false;
    }

    /**
     * @param {Number} i - index number
     * @returns {Object} ith Turtle object
     */
    ithTurtle(i) {
        return this.getTurtle(i);
    }

    /**
     * @param {Number} i - index number
     * @returns index number of companion turtle or i
     */
    companionTurtle(i) {
        for (let t = 0; t < this.getTurtleCount(); t++) {
            if (this.getTurtle(t).companionTurtle === i) {
                return t;
            }
        }
        return i;
    }

    /**
     * @returns number of turtles
     * (excluding turtles in the trash and companion turtles)
     */
    turtleCount() {
        let count = 0;
        for (let t = 0; t < this.getTurtleCount(); t++) {
            if (this.companionTurtle(t) === t && !this.getTurtle(t).inTrash) {
                count += 1;
            }
        }
        return count;
    }
};

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

Turtles.TurtlesView = class {
    /**
     * @constructor
     */
    constructor() {
        this._scale = 1.0; // scale factor in [0, 1]
        this._w = 1200; // stage width
        this._h = 900; // stage height

        this._isShrunk = false; // whether canvas is collapsed

        this._expandedBoundary = null; // The boundary when the canvas is expanded
        this._collapsedBoundary = null; // The boundry when the canvas is collapsed
        this._expandButton = null; // Button to expand the canvas
        this._collapseButton = null; // Button to collapse the canvas
        this._clearButton = null; // Button to clear the canvas
        this.gridButton = null; // Button to select the grid style
        this.collapse = null; // Function to collapse the canvas
        this.expand = null; // Function to expand the canvas

        // canvas background color
        this._backgroundColor = platformColor.background;

        this._locked = false; // whether the canvas is locked
        this._queue = []; // temporarily stores [w, h, scale]

        this.currentGrid = null; // currently selected grid

        // Debounce timer for resize events
        this._resizeTimer = null;

        // Attach a debounced event listener to the 'resize' event
        // This prevents rapid-fire resize calculations that can cause
        // crashes when toggling DevTools or switching tabs.
        window.addEventListener("resize", () => {
            if (this._resizeTimer) {
                clearTimeout(this._resizeTimer);
            }

            this._resizeTimer = setTimeout(() => {
                // Skip dimension updates when the tab is hidden
                // (canvas reports 0x0 in background tabs)
                if (document.hidden) {
                    return;
                }

                // Call the updateDimensions function when resizing occurs
                const screenWidth =
                    window.innerWidth ||
                    document.documentElement.clientWidth ||
                    document.body.clientWidth;
                const screenHeight =
                    window.innerHeight ||
                    document.documentElement.clientHeight ||
                    document.body.clientHeight;

                // Guard against zero or invalid dimensions
                if (screenWidth <= 0 || screenHeight <= 0) {
                    return;
                }

                // Set a scaling factor to adjust the dimensions based on the screen size
                const scale = Math.min(screenWidth / 1200, screenHeight / 900);

                // Calculate the new dimensions
                const newWidth = Math.round(1200 * scale);
                const newHeight = Math.round(900 * scale);

                // Update the dimensions
                this._w = newWidth;
                this._h = newHeight;
            }, 150);
        });
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
        this.activity.refreshCanvas();
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
        // Guard against zero/invalid dimensions to prevent division-by-zero
        // and layout corruption when canvas is hidden or mid-resize
        if (!w || !h || !scale || w <= 0 || h <= 0 || scale <= 0) {
            return;
        }

        if (this._locked) {
            this._queue = [w, h, scale];
        } else {
            this._scale = scale;
            this._w = w / scale;
            this._h = h / scale;
        }

        this.makeBackground();
    }

    /**
     * Makes background for canvas: updates the canvas background color.
     *
     * @param {Boolean} setCollapsed - whether to set the background in collapsed state
     * @returns {void}
     */
    makeBackground(setCollapsed) {
        // Update the canvas background color
        const canvas = this.canvas;
        if (canvas) {
            canvas.style.backgroundColor = this._backgroundColor;
        }

        // Also update body background if available
        if (typeof document !== "undefined") {
            document.body.style.backgroundColor = this._backgroundColor;
        }
    }

    /**
     * @returns {Boolean} - whether canvas is collapsed
     */
    isShrunk() {
        return this._isShrunk;
    }

    /**
     * @param {String} text
     * @returns {void}
     */
    setGridLabel(text) {
        this._gridLabel = text;
    }

    /**
     * Changes body background in DOM to current colour.
     *
     * @param {Number} index - Turtle index in turtleList
     * @returns {void}
     */
    setBackgroundColor(index) {
        const color =
            index === -1 ? platformColor.background : this.getTurtle(index).painter.canvasColor;
        this._backgroundColor = color;
        this.makeBackground();
        this.activity.refreshCanvas();
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
     * Invert y coordinate.
     *
     * @private
     * @param {Number} y - y coordinate
     * @returns {Number} inverted y coordinate
     */
    _invertY(y) {
        // Guard against zero canvas height / scale to prevent NaN/Infinity
        if (!this.canvas || !this.canvas.height || !this._scale) {
            return -y; // Fallback: simple inversion around origin
        }
        return this.canvas.height / (2.0 * this._scale) - y;
    }

    /**
     * Convert on screen x coordinate to turtle x coordinate.
     *
     * @param {Number} x - screen x coordinate
     * @returns {Number} turtle x coordinate
     */
    screenX2turtleX(x) {
        // Guard against zero canvas width / scale
        if (!this.canvas || !this.canvas.width || !this._scale) {
            return 0; // Safe fallback when dimensions are unavailable
        }
        return x - this.canvas.width / (2.0 * this._scale);
    }

    /**
     * Convert on screen y coordinate to turtle y coordinate.
     *
     * @param {Number} y - screen y coordinate
     * @returns {Number} turtle y coordinate
     */
    screenY2turtleY(y) {
        return this._invertY(y);
    }

    /**
     * Convert turtle x coordinate to on screen x coordinate.
     *
     * @param {Number} x - turtle x coordinate
     * @returns {Number} screen x coordinate
     */
    turtleX2screenX(x) {
        // Guard against zero canvas width / scale
        if (!this.canvas || !this.canvas.width || !this._scale) {
            return x; // Fallback: return raw coordinate
        }
        return this.canvas.width / (2.0 * this._scale) + x;
    }

    /**
     * Convert turtle y coordinate to on screen y coordinate.
     *
     * @param {Number} y - turtle y coordinate
     * @returns {Number} screen y coordinate
     */
    turtleY2screenY(y) {
        return this._invertY(y);
    }
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = Turtles;
}

if (typeof define === "function" && define.amd) {
    define([], function () {
        return Turtles;
    });
}

if (typeof window !== "undefined") {
    window.Turtles = Turtles;
}
