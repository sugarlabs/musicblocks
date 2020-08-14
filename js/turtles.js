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
    constructor() {
        // Import members of model and view (no arguments for model or view)
        importMembers(this);
        // Inititalize all actions related to blocks executed by Turtle objects
        this.initActions();

        this._refreshCanvas = null;     // function to refresh canvas
    }

    /**
     * @param {Function} refreshCanvas - function to refresh canvas after view update
     */
    set refreshCanvas(refreshCanvas) {
        this._refreshCanvas = refreshCanvas;
    }

    /**
     * @returns {Function} function to refresh canvas after view update
     */
    get refreshCanvas() {
        return this._refreshCanvas;
    }

    /**
     * Inititalizes all supporting action related classes & methods of Turtle.
     *
     * @returns {void}
     */
    initActions() {
        setupRhythmActions();
        setupPitchActions();
        setupIntervalsActions();
        setupToneActions();
        setupOrnamentActions();
        setupVolumeActions();
        setupDrumActions();
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
            let t = last(this.turtleList);
            t.container.scaleX = CONTAINERSCALEFACTOR;
            t.container.scaleY = CONTAINERSCALEFACTOR;
            t.container.scale = CONTAINERSCALEFACTOR;
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
        if (startBlock != null) {
            console.debug("adding a new turtle " + startBlock.name);
            if (startBlock.value !== this.turtleList.length) {
                startBlock.value = this.turtleList.length;
                console.debug("turtle #" + startBlock.value);
            }
        } else {
            console.debug("adding a new turtle: startBlock is null");
        }

        let blkInfoAvailable =
            typeof infoDict === "object" && Object.keys(infoDict).length > 0 ?
                true : false;

        // Unique ID of turtle is time of instantiation for the first time
        let id =
            blkInfoAvailable && "id" in infoDict && infoDict["id"] !== Infinity ?
                infoDict["id"] : Date.now();

        let turtleName =
            blkInfoAvailable && "name" in infoDict ?
                infoDict["name"] : _("start");

        // Instantiate a new Turtle object
        let turtle = new Turtle(id, turtleName, this, startBlock);

        // Add turtle model properties and store color index for turtle
        this.addTurtleStageProps(turtle, blkInfoAvailable, infoDict);

        let turtlesStage = this.stage;

        let i = this.turtleList.length % 10;    // used for turtle (mouse) skin color
        this.turtleList.push(turtle);           // add new turtle to turtle list

        this.createArtwork(turtle, i);

        this.createHitArea(turtle);

        /*
        ===================================================
         Add event handlers
        ===================================================
        */

        turtle.container.on("mousedown", event => {
            let scale = this.scale;
            let offset = {
                x: turtle.container.x - event.stageX / scale,
                y: turtle.container.y - event.stageY / scale
            };

            turtlesStage.dispatchEvent("CursorDown" + turtle.id);
            console.debug("--> [CursorDown " + turtle.name + "]");

            turtle.container.removeAllEventListeners("pressmove");
            turtle.container.on("pressmove", event => {
                if (this.isShrunk() || turtle.running) {
                    return;
                }

                turtle.container.x = event.stageX / scale + offset.x;
                turtle.container.y = event.stageY / scale + offset.y;
                turtle.x = this.screenX2turtleX(turtle.container.x);
                turtle.y = this.screenY2turtleY(turtle.container.y);
                this.refreshCanvas();
            });
        });

        turtle.container.on("pressup", event => {
            console.debug("--> [CursorUp " + turtle.name + "]");
            turtlesStage.dispatchEvent("CursorUp" + turtle.id);
        });

        turtle.container.on("click", event => {
            // If turtles listen for clicks then they can be used as buttons
            console.debug("--> [click " + turtle.name + "]");
            turtlesStage.dispatchEvent("click" + turtle.id);
        });

        turtle.container.on("mouseover", event => {
            console.debug("--> [mouseover " + turtle.name + "]");
            turtlesStage.dispatchEvent("CursorOver" + turtle.id);

            if (turtle.running) {
                return;
            }

            turtle.container.scaleX *= 1.2;
            turtle.container.scaleY = turtle.container.scaleX;
            turtle.container.scale = turtle.container.scaleX;
            this.refreshCanvas();
        });

        turtle.container.on("mouseout", event => {
            console.debug("--> [mouseout " + turtle.name + "]");
            turtlesStage.dispatchEvent("CursorOut" + turtle.id);

            if (turtle.running) {
                return;
            }

            turtle.container.scaleX /= 1.2;
            turtle.container.scaleY = turtle.container.scaleX;
            turtle.container.scale = turtle.container.scaleX;
            this.refreshCanvas();
        });

        document.getElementById("loader").className = "";

        this.addTurtleGraphicProps(turtle, blkInfoAvailable, infoDict);

        this.refreshCanvas();
    }

    /**
     * Toggles 'running' boolean value for all turtles.
     *
     * @returns {void}
     */
    markAllAsStopped() {
        for (let turtle in this.turtleList) {
            this.turtleList[turtle].running = false;
        }

        this.refreshCanvas();
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
    constructor() {
        this._masterStage = null;       // createjs stage
        this._stage = null;             // createjs container for turtle

        this._canvas = null;            // DOM canvas element

        // These functions are directly called by TurtlesView
        this._hideMenu = null;          // function to hide aux menu
        this._doClear = null;           // function to clear the canvas
        this._hideGrids = null;         // function to hide all grids
        this._doGrid = null;            // function that renders Cartesian/Polar
                                        //  grids and changes button labels

        // createjs border container
        this._borderContainer = new createjs.Container();

        // List of all of the turtles, one for each start block
        this._turtleList = [];

        /**
         * @todo Add methods to initialize the turtleList, directly access the
         * required turtle rather than having to "get" the turtleList itself,
         * and return the length of the turtleList (number of Turtles).
         */
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

        let turtlesStage = this._stage;

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
     * Creates sensor area for Turtle body.
     *
     * @param {*} turtle - Turtle object
     * @returns {void}
     */
    createHitArea(turtle) {
        let hitArea = new createjs.Shape();
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
        setTimeout(() => {
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
                    turtle.painter.rename(infoDict["name"]);
                }
            }
        }, 2000);
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

    /**
     * @param {Number} i - index number
     * @returns {Object} ith Turtle object
     */
    ithTurtle(i) {
        return this._turtleList[Number(i)];
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
        this._scale = 1.0;              // scale factor in [0, 1]
        this._w = 1200;                 // stage width
        this._h = 900;                  // stage height

        this._isShrunk = false;         // whether canvas is collapsed

        /**
         * @todo write comments to describe each variable
         */
        this._expandedBoundary = null;
        this._collapsedBoundary = null;
        this._expandButton = null;      // used by add method
        this._collapseButton = null;    // used by add method
        this._clearButton = null;       // used by add method
        this._gridButton = null;        // used by add method

        // canvas background color
        this._backgroundColor = platformColor.background;

        this._locked = false;
        this._queue = [];               // temporarily stores [w, h, scale]
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
            this._scale = scale;
            this._w = w / scale;
            this._h = h / scale;
        }

        this.makeBackground();
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
     * @param {Number} turtle - Turtle index in turtleList
     * @returns {void}
     */
    setBackgroundColor(turtle) {
        let color =
            turtle === -1 ? platformColor.background : this.turtleList[turtle].painter.canvasColor;
        this._backgroundColor = color;
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
        return this.canvas.height / (2.0 * this._scale) - y;
    }

    /**
     * Convert on screen x coordinate to turtle x coordinate.
     *
     * @param {Number} x - screen x coordinate
     * @returns {Number} turtle x coordinate
     */
    screenX2turtleX(x) {
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

    /**
     * Creates the artwork for the turtle (mouse) 's skin.
     *
     * @param {Object} turtle
     * @param {Number} i
     * @returns {void}
     */
    createArtwork(turtle, i) {
        let artwork = TURTLESVG;
        artwork = sugarizerCompatibility.isInsideSugarizer() ?
            artwork
                .replace(/fill_color/g, sugarizerCompatibility.xoColor.fill)
                .replace(
                    /stroke_color/g,
                    sugarizerCompatibility.xoColor.stroke
                ) :
            artwork
                .replace(/fill_color/g, FILLCOLORS[i])
                .replace(/stroke_color/g, STROKECOLORS[i]);

        turtle.makeTurtleBitmap(artwork, this.refreshCanvas);

        turtle.painter.color = i * 10;
        turtle.painter.canvasColor = getMunsellColor(
            turtle.painter.color,
            DEFAULTVALUE,
            DEFAULTCHROMA
        );
    }

    /**
     * Makes background for canvas: clears containers, renders buttons.
     *
     * @param setCollapsed - specify whether the background should be collapsed
     */
    makeBackground(setCollapsed) {
        let doCollapse = setCollapsed === undefined ? false : setCollapsed;

        let borderContainer = this.borderContainer;

        // Remove any old background containers
        borderContainer.removeAllChildren();

        let turtlesStage = this.stage;
        // We put the buttons on the stage so they will be on top

        let _makeButton = (svg, label, x, y) => {
            let container = document.createElement("div");
            container.setAttribute("id", ""+label);

            container.setAttribute("class","tooltipped");
            container.setAttribute("data-tooltip",label);
            container.setAttribute("data-position","bottom");
            jQuery.noConflict()(".tooltipped").tooltip({
                html: true,
                delay: 100
            });

            container.onmouseover = (event) => {
                if (!loading) {
                    document.body.style.cursor = "pointer";
                }
            };

            container.onmouseout = (event) => {
                if (!loading) {
                    document.body.style.cursor = "default";
                }
            };
            let img = new Image();
            img.src =
                "data:image/svg+xml;base64," +
                window.btoa(unescape(encodeURIComponent(svg)));

            container.appendChild(img);
            container.setAttribute("style","position: absolute; right:"+(document.body.clientWidth -x)+"px;  top: "+y+"px;")
            docById("buttoncontainerTOP").appendChild(container);
            return container;
        };

        /**
         * Setup dragging of smaller canvas .
         */
        let dragCanvas = () =>{
            let offset ;
            turtlesStage.removeAllEventListeners("pressmove");
            turtlesStage.removeAllEventListeners("mousedown");
            turtlesStage.on("mousedown",event => {
                offset ={
                    y:event.stageY - turtlesStage.y,
                    x:event.stageX - turtlesStage.x
                }
            });
            turtlesStage.on("pressmove",event => {
                let x = event.stageX - offset.x ;
                let y = event.stageY - offset.y;
                turtlesStage.x = Math.max(0, Math.min((this._w * 3) / 4, x));
                turtlesStage.y = Math.max(55, Math.min((this._h * 3) / 4, y));
                this.refreshCanvas();

            })
        }

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
            this._expandedBoundary.visible = false;
            turtlesStage.x = (this._w * 3) / 4 - 10;
            turtlesStage.y = 55 + LEADING + 6;
            this._isShrunk = true;

            for (let i = 0; i < this.turtleList.length; i++) {
                this.turtleList[i].container.scaleX = CONTAINERSCALEFACTOR;
                this.turtleList[i].container.scaleY = CONTAINERSCALEFACTOR;
                this.turtleList[i].container.scale = CONTAINERSCALEFACTOR;
            }

            // remove the stage and add it back at the top
            this.masterStage.removeChild(turtlesStage);
            this.masterStage.addChild(turtlesStage);
            dragCanvas();

            this.refreshCanvas();
        }

        /**
         * Makes 'cartesian' button by initailising 'CARTESIANBUTTON' SVG.
         * Assigns click listener function to doGrid() method.
         */
        let __makeGridButton = () => {
            this._gridButton = _makeButton(CARTESIANBUTTON,_("show Cartesian"),this._w - 10 - 3 * 55, 70 + LEADING + 6);

            this._gridButton.onclick = event => {
                this.doGrid();
                this._gridButton.setAttribute("data-tooltip", this._gridLabel);
                jQuery.noConflict()(".tooltipped").tooltip("close");
            };

        };

        /**
         * Makes clear button by initailising 'CLEARBUTTON' SVG.
         * Assigns click listener function to call doClear() method.
         */
        let __makeClearButton = () => {
            this._clearButton = _makeButton(CLEARBUTTON,_("Clean"),this._w - 5 - 2 * 55, 70 + LEADING + 6);

            this._clearButton.onclick = event => {
                this.doClear();
            };

            if (doCollapse) {
                __collapse();
            }

        };

        /**
         * Makes collapse button by initailising 'EXPANDBUTTON' SVG.
         * Assigns click listener function to call __collapse() method.
         */
        let __makeCollapseButton = () => {
            this._collapseButton = _makeButton(COLLAPSEBUTTON,_("Collapse"),this._w - 55,70 + LEADING + 6);

            this._collapseButton.onclick = event => {
                // If the aux toolbar is open, close it.
                let auxToolbar = docById("aux-toolbar");
                if (auxToolbar.style.display === "block") {
                    let menuIcon = docById("menu");
                    auxToolbar.style.display = "none";
                    menuIcon.innerHTML = "menu";
                    docById("toggleAuxBtn").className -= "blue darken-1";
                }
                this._expandButton.style.visibility = "visible";
                this._collapseButton.style.visibility = "hidden";
                this._gridButton.style.visibility = "hidden";
                __collapse();
            };
        };

        /**
         * Makes expand button by initailising 'EXPANDBUTTON' SVG.
         * Assigns click listener function to remove stage and add it at posiion 0.
         */
        let __makeExpandButton = () => {
            this._expandButton = _makeButton(EXPANDBUTTON, _("Expand"), this._w - 55, 70 + LEADING + 6);
            if (this._expandButton !== null) {
                this._expandButton.style.visibility = "hidden";
            }

            this._expandButton.onclick = event => {
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
                this._gridButton.style.visibility = "visible";
                this._collapseButton.style.visibility = "visible";
                this._expandButton.style.visibility = "hidden";
                this._collapsedBoundary.visible = false;
                turtlesStage.removeAllEventListeners("pressmove");
                turtlesStage.removeAllEventListeners("mousedown");

                turtlesStage.x = 0;
                turtlesStage.y = 0;
                this._isShrunk = false;

                for (let i = 0; i < this.turtleList.length; i++) {
                    this.turtleList[i].container.scaleX = 1;
                    this.turtleList[i].container.scaleY = 1;
                    this.turtleList[i].container.scale = 1;
                }

                this._clearButton.scaleX = 1;
                this._clearButton.scaleY = 1;
                this._clearButton.scale = 1;
                this._clearButton.x = this._w - 5 - 2 * 55;

                if (this._gridButton !== null) {
                    this._gridButton.scaleX = 1;
                    this._gridButton.scaleY = 1;
                    this._gridButton.scale = 1;
                    this._gridButton.x = this._w - 10 - 3 * 55;
                    this._gridButton.visible = true;
                }

                // remove the stage and add it back in position 0
                this.masterStage.removeChild(turtlesStage);
                this.masterStage.addChildAt(turtlesStage, 0);
            };
        };

        /**
         * initializes all Buttons.
         */
        let __makeAllButtons = () => {
            let second = false;
            if (docById("buttoncontainerTOP")){
                jQuery.noConflict()(".tooltipped").tooltip("close");
                docById("buttoncontainerTOP").parentElement.removeChild(docById("buttoncontainerTOP"));
                second = true;
            }
            let cont = document.createElement("div");
            document.body.appendChild(cont)
            cont.style.display = second ?"block":"none";
            cont.setAttribute("id","buttoncontainerTOP");
            __makeExpandButton();
            __makeClearButton();
            __makeGridButton();
            __makeCollapseButton();
            this._locked = false;
        }

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
                borderContainer.addChild(this._collapsedBoundary);
                this._collapsedBoundary.visible = false;

            };

            let dx = this._w - 20;
            let dy = this._h - 55 - LEADING;
            img.src =
                "data:image/svg+xml;base64," +
                window.btoa(
                    unescape(
                        encodeURIComponent(
                            MBOUNDARY.replace("HEIGHT", this._h)
                                .replace("WIDTH", this._w)
                                .replace("Y", 10)
                                .replace("X", 10)
                                .replace("DY", dy)
                                .replace("DX", dx)
                                .replace(
                                    "stroke_color",
                                    platformColor.ruleColor
                                )
                                .replace("fill_color", this._backgroundColor)
                                .replace("STROKE", 20)
                        )
                    )
                );
            __makeAllButtons();
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
                borderContainer.addChild(this._expandedBoundary);
                __makeBoundary2();
            };

            let dx = this._w - 5;
            let dy = this._h - 55 - LEADING;
            img.src =
                "data:image/svg+xml;base64," +
                window.btoa(
                    unescape(
                        encodeURIComponent(
                            MBOUNDARY.replace("HEIGHT", this._h)
                                .replace("WIDTH", this._w)
                                .replace("Y", 10 / CONTAINERSCALEFACTOR)
                                .replace("X", 10 / CONTAINERSCALEFACTOR)
                                .replace("DY", dy)
                                .replace("DX", dx)
                                .replace(
                                    "stroke_color",
                                    platformColor.ruleColor
                                )
                                .replace("fill_color", this._backgroundColor)
                                .replace("STROKE", 20 / CONTAINERSCALEFACTOR)
                        )
                    )
                );
        };

        if (!this._locked) {
            __makeBoundary();
        }

        return this;
    }
};
