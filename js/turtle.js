/**
 * @file This contains the prototype of the Turtle component.
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

// Turtles
const DEFAULTCOLOR = 0;
const DEFAULTVALUE = 50;                // also used in turtles.js
const DEFAULTCHROMA = 100;              // also used in turtles.js
const DEFAULTSTROKE = 5;
const DEFAULTFONT = "sans-serif";       // also used in PenBlocks.js

// Turtle sprite
const TURTLEBASEPATH = "images/";       // unused

/**
 * Class pertaining to each turtle.
 *
 * @class
 * @classdesc
 */
/**
 * Class pertaining to each turtle.
 *
 * @class
 * @classdesc This is the prototype of the Turtles controller which
 * acts as a bridge between the Turtle model and the Turtle view, and
 * serves as a gateway to any external code.
 *
 * External code instantiates this class, and can access all the members
 * of TurtleView and TurtleModel.
 *
 * This component contains properties and controls for all actions
 * corresponding to a single turtle. Also contains the methods for
 * caching.
 *
 * Private methods' names begin with underscore '_".
 * Unused methods' names begin with double underscore '__'.
 * Internal functions' names are in PascalCase.
 */
class Turtle {
    /**
     * @constructor
     * @param {String} name - name of Turtle
     * @param {Object} turtles - Turtles object (common to all turtles)
     */
    constructor(name, turtles) {
        // Import members of model and view (arguments only for model)
        importMembers(this, [ name, turtles ]);

        // Things used for drawing the turtle
        this.container = null;
        this.x = 0;
        this.y = 0;
        this.bitmap = null;
        this.skinChanged = false;       // should we reskin the turtle on clear?
        this.shellSize = 55;
        this.blinkFinished = true;
        this.isSkinChanged = false;
        this._sizeInUse = 1;
        this._isSkinChanged = false;
        this.beforeBlinkSize = null;

        // Which start block is associated with this turtle?
        this.startBlock = null;

        this.decorationBitmap = null;   // start block decoration

        // Queue of blocks this turtle is executing
        this.queue = [];

        // Listeners
        this.listeners = {};

        // Things used for what the turtle draws
        this.penstrokes = null;
        this.imageContainer = null;
        this.svgOutput = "";
        this.svgPath = false;           // are we currently drawing a path?
        this.color = DEFAULTCOLOR;
        this.value = DEFAULTVALUE;
        this.chroma = DEFAULTCHROMA;
        this.stroke = DEFAULTSTROKE;
        this.canvasColor = "rgba(255,0,49,1)";  // '#ff0031';
        this.canvasAlpha = 1.0;
        this.orientation = 0;
        this.fillState = false;
        this.hollowState = false;
        this.penState = true;
        this.font = DEFAULTFONT;
        this.media = [];        // media (text, images) we need to remove on clear
        this.canvas = document.getElementById("overlayCanvas");
        this.ctx = this.canvas.getContext("2d");
        console.debug(this.ctx.canvas.width + " x " + this.ctx.canvas.height);
    }

    /**
     * Internal function for creating cache.
     * Includes workaround for a race condition.
     *
     * @private
     */
    _createCache() {
        this.bounds = this.container.getBounds();

        if (this.bounds == null) {
            setTimeout(() => {
                this._createCache();
            }, 200);
        } else {
            this.container.cache(
                this.bounds.x,
                this.bounds.y,
                this.bounds.width,
                this.bounds.height
            );
        }
    }

    /**
     * Internal function for updating cache.
     * Includes workaround for a race condition.
     *
     * @private
     * @async
     */
    async _updateCache() {
        if (this.bounds == null) {
            console.debug(
                "Block container for " + this.getName() + " not yet ready."
            );
            await delayExecution(300);
            this._updateCache();
        } else {
            this.container.updateCache();
            this.getTurtles().refreshCanvas();
        }
    }

    /**
     * Stops blinking of turtle if not already finished.
     * Sets timeout to null and blinkFinished boolean to true
     * (if they have not been already changed).
     */
    stopBlink() {
        if (this._blinkTimeout != null || !this.blinkFinished) {
            clearTimeout(this._blinkTimeout);
            this._blinkTimeout = null;

            this.container.visible = true;
            this.getTurtles().refreshCanvas();
            this.blinkFinished = true;

            // this.bitmap.alpha = 1.0;
            // this.bitmap.scaleX = this._sizeInUse;
            // this.bitmap.scaleY = this.bitmap.scaleX;
            // this.bitmap.scale = this.bitmap.scaleX;
            // this.bitmap.rotation = this.orientation;
            // this.skinChanged = this._isSkinChanged;
            // let bounds = this.container.getBounds();
            // this.container.cache(bounds.x, bounds.y, bounds.width, bounds.height);
            // this.container.visible = true;
            // this.getTurtles().refreshCanvas();
            // this.blinkFinished = true;
        }
    }

    /**
     * Causes turtle to blink (toggle turtle's visibility) every 100 ms.
     */
    async blink(duration, volume) {
        // this._sizeInUse = this.bitmap.scaleX;
        this._blinkTimeout = null;

        // No time to blink for really short notes. (t = 1 / duration)
        if (duration > 16) {
            return;
        }

        this.stopBlink();
        this.blinkFinished = false;

        this.container.visible = false;
        this.getTurtles().refreshCanvas();
        this._blinkTimeout = await delayExecution(100);
        this.blinkFinished = true;
        this.container.visible = true;
        this.getTurtles().refreshCanvas();

        /*
        if (this.beforeBlinkSize == null) {
            this.beforeBlinkSize = this.bitmap.scaleX;
        }

        if (this.blinkFinished) {
            this._sizeInUse = this.bitmap.scaleX;
        } else {
            this._sizeInUse = this.beforeBlinkSize;
        }

        this.stopBlink();
        this.blinkFinished = false;
        this.container.uncache();
        let scalefactor = 60 / 55;
        let volumescalefactor = 4 * (volume + 200) / 1000;
        // Conversion: volume of 1 = 0.804, volume of 50 = 1, volume of 100 = 1.1
        this.bitmap.alpha = 0.5;
        this.bitmap.scaleX *= scalefactor * volumescalefactor;  // sizeInUse * scalefactor * volumescalefactor;
        this.bitmap.scaleY = this.bitmap.scaleX;
        this.bitmap.scale = this.bitmap.scaleX;
        this._isSkinChanged = this.skinChanged;
        this.skinChanged = true;
        createjs.Tween.get(this.bitmap).to({alpha: 1, scaleX: this._sizeInUse, scaleY: this._sizeInUse, scale: this._sizeInUse}, 500 / duration);

        this._blinkTimeout = setTimeout(() => {
            this.bitmap.alpha = 1.0;
            this.bitmap.scaleX = this._sizeInUse;
            this.bitmap.scaleY = this.bitmap.scaleX;
            this.bitmap.scale = this.bitmap.scaleX;
            this.bitmap.rotation = this.orientation;
            this.skinChanged = this._isSkinChanged;
            let bounds = this.container.getBounds();
            this.container.cache(bounds.x, bounds.y, bounds.width, bounds.height);
            this.blinkFinished = true;
            this.getTurtles().refreshCanvas();
        }, 500 / duration);  // 500 / duration == (1000 * (1 / duration)) / 2
        */
    }

    /**
     * Class pertaining to Turtle Model.
     *
     * @static
     * @class
     * @classdesc This is the prototype of the Model for the Turtle component.
     * It should store the data structures that control behavior of the model,
     * and the methods to interact with them.
     *
     * Private methods' names begin with underscore '_".
     * Unused methods' names begin with double underscore '__'.
     * Internal functions' names are in PascalCase.
     */
    static TurtleModel = class {
        /**
         * @constructor
         * @param {String} name - name of Turtle
         * @param {Object} turtles - Turtles object (common to all turtles)
         */
        constructor(name, turtles) {
            this.name = name;           // name of the turtle
            this.turtles = turtles;     // object handling behavior of all turtles

            this.running = false;           // is the turtle running?
            this.trash = false;             // in the trash?
        }

        /**
         * @returns {String} name
         */
        getName() {
            return this.name;
        }

        /**
         * @returns {Object} Turtles object
         */
        getTurtles() {
            return this.turtles;
        }

        /**
         * Returns the turtle's index in turtleList (the turtle's number)
         *
         * @return {Number}
         */
        __getNumber() {
            return this.turtles.turtleList.indexOf(this);
        }
    };

    /** Class pertaining to Turtles View.
     *
     * @static
     * @class
     * @classdesc This is the prototype of the View for the Turtles component.
     * It should make changes to the view, while using members of the Model
     * through Turtles (controller). An action may require updating the state
     * (of the Model), which it can do by calling methods of the Model, also
     * through Turtles (controller).
     *
     * Private methods' names begin with underscore '_".
     * Unused methods' names begin with double underscore '__'.
     * Internal functions' names are in PascalCase.
     */
    static TurtleView = class {
        /**
        * @constructor
        */
        constructor() {

        }

        /**
         * As the canvas scrolls the turtle is drawn under.
         *
         * @param dx - change in x coordinate
         * @param dy - change in y coordinate
         */
        doScrollXY(dx, dy) {
            // FIXME: how big?

            let imgData =
                this.ctx.getImageData(
                    0, 0, this.ctx.canvas.width, this.ctx.canvas.height
                );

            let turtles = this.getTurtles();
            if (turtles.canvas1 == null) {
                turtles.gx = this.ctx.canvas.width;
                turtles.gy = this.ctx.canvas.height;
                turtles.canvas1 = document.createElement("canvas");
                turtles.canvas1.width = 3 * this.ctx.canvas.width;
                turtles.canvas1.height = 3 * this.ctx.canvas.height;
                turtles.c1ctx = turtles.canvas1.getContext("2d");
                turtles.c1ctx.rect(
                    0, 0, 3 * this.ctx.canvas.width, 3 * this.ctx.canvas.height
                );
                turtles.c1ctx.fillStyle = "#F9F9F9";
                turtles.c1ctx.fill();
            }

            turtles.c1ctx.putImageData(
                imgData, turtles.gx, turtles.gy
            );

            turtles.gy -= dy;
            turtles.gx -= dx;
            turtles.gx =
                2 * this.ctx.canvas.width > turtles.gx ?
                    turtles.gx : 2 * this.ctx.canvas.width;
            turtles.gx = 0 > turtles.gx ? 0 : turtles.gx;
            turtles.gy =
                2 * this.ctx.canvas.height > turtles.gy ?
                    turtles.gy : 2 * this.ctx.canvas.height;
            turtles.gy = 0 > turtles.gy ? 0 : turtles.gy;

            let newImgData =
                turtles.c1ctx.getImageData(
                    turtles.gx,
                    turtles.gy,
                    this.ctx.canvas.width,
                    this.ctx.canvas.height
                );

            this.ctx.putImageData(newImgData, 0, 0);

            // Draw under the turtle as the canvas moves
            for (let t = 0; t < turtles.turtleList.length; t++) {
                if (turtles.turtleList[t].trash) {
                    continue;
                }

                if (turtles.turtleList[t].penState) {
                    turtles.turtleList[t]._processColor();
                    this.ctx.lineWidth = turtles.turtleList[t].stroke;
                    this.ctx.lineCap = 'round';
                    this.ctx.beginPath();
                    this.ctx.moveTo(
                        turtles.turtleList[t].container.x + dx,
                        turtles.turtleList[t].container.y + dy
                    );
                    this.ctx.lineTo(
                        turtles.turtleList[t].container.x,
                        turtles.turtleList[t].container.y
                    );
                    this.ctx.stroke();
                    this.ctx.closePath();
                }
            }

            turtles.refreshCanvas();
        }

        /**
         * Renames start block.
         *
         * @param name - name string which is assigned to startBlock
         */
        rename(name) {
            this.name = name;

            // Use the name on the label of the start block
            if (this.startBlock != null) {
                this.startBlock.overrideName = this.name;
                this.startBlock.collapseText.text = this.name;
                this.startBlock.regenerateArtwork(false);
                this.startBlock.value =
                    this.getTurtles().getTurtleList().indexOf(this);
            }
        }

        /**
         * Simulate an arc with line segments since Tinkercad cannot.
         *
         * @private
         * @param nsteps - turtle's steps
         * @param cx - x coordinate of center
         * @param cy - y coordinate of center
         * @param radius - radius of arc
         * @param sa - start angle
         * @param ea - end angle
         */
        _svgArc(nsteps, cx, cy, radius, sa, ea) {
            // Import SVG arcs reliably
            let a = sa;
            let da = ea == null ? Math.PI / nsteps : (ea - sa) / nsteps;

            for (let i = 0; i < nsteps; i++) {
                let nx = cx + radius * Math.cos(a);
                let ny = cy + radius * Math.sin(a);
                this.svgOutput += nx + "," + ny + " ";
                a += da;
            }
        }

        /**
         * Draws a bezier curve.
         *
         * @param cp1x - the x-coordinate of the first bezier control point
         * @param cp1y - the y-coordinate of the first bezier control point
         * @param cp2x - the x-coordinate of the second bezier control point
         * @param cp2y - the y-coordinate of the second bezier control point
         * @param x2 - the x-coordinate of the ending point
         * @param y2 - the y-coordinate of the ending point
         */
        doBezier(cp1x, cp1y, cp2x, cp2y, x2, y2) {
            // FIXME: Add SVG output

            let fx, fy;
            let ax, ay, bx, by, cx, cy, dx, dy;
            let dxi, dyi, dxf, dyf;

            let turtles = this.getTurtles();
            let turtlesScale = turtles.getScale();

            if (this.penState && this.hollowState) {
                // Convert from turtle coordinates to screen coordinates
                fx = turtles.turtleX2screenX(x2);
                fy = turtles.turtleY2screenY(y2);
                let ix = turtles.turtleX2screenX(this.x);
                let iy = turtles.turtleY2screenY(this.y);
                let cx1 = turtles.turtleX2screenX(cp1x);
                let cy1 = turtles.turtleY2screenY(cp1y);
                let cx2 = turtles.turtleX2screenX(cp2x);
                let cy2 = turtles.turtleY2screenY(cp2y);

                // Close the current SVG path
                this.closeSVG();

                // Save the current stroke width
                let savedStroke = this.stroke;
                this.stroke = 1;
                this.ctx.lineWidth = this.stroke;
                this.ctx.lineCap = "round";

                // Draw a hollow line
                let step = savedStroke < 3 ? 0.5 : (savedStroke - 2) / 2;
                let steps = Math.max(Math.floor(savedStroke, 1));

                /* We need both the initial and final headings */
                // The initial heading is the angle between (cp1x, cp1y) and (this.x, this.y)
                let degreesInitial = Math.atan2(cp1x - this.x, cp1y - this.y);
                degreesInitial = (180 * degreesInitial) / Math.PI;
                if (degreesInitial < 0) {
                    degreesInitial += 360;
                }

                // The final heading is the angle between (cp2x, cp2y) and (fx, fy)
                let degreesFinal = Math.atan2(x2 - cp2x, y2 - cp2y);
                degreesFinal = (180 * degreesFinal) / Math.PI;
                if (degreesFinal < 0) {
                    degreesFinal += 360;
                }

                // We also need to calculate the deltas for the 'caps' at each end
                let capAngleRadiansInitial =
                    ((degreesInitial - 90) * Math.PI) / 180.0;
                dxi = step * Math.sin(capAngleRadiansInitial);
                dyi = -step * Math.cos(capAngleRadiansInitial);
                let capAngleRadiansFinal = ((degreesFinal - 90) * Math.PI) / 180.0;
                dxf = step * Math.sin(capAngleRadiansFinal);
                dyf = -step * Math.cos(capAngleRadiansFinal);

                // The four 'corners'
                ax = ix - dxi;
                ay = iy - dyi;
                let axScaled = ax * turtlesScale;
                let ayScaled = ay * turtlesScale;
                bx = fx - dxf;
                by = fy - dyf;
                let bxScaled = bx * turtlesScale;
                let byScaled = by * turtlesScale;
                cx = fx + dxf;
                cy = fy + dyf;
                let cxScaled = cx * turtlesScale;
                let cyScaled = cy * turtlesScale;
                dx = ix + dxi;
                dy = iy + dyi;
                let dxScaled = dx * turtlesScale;
                let dyScaled = dy * turtlesScale;

                // Control points scaled for SVG output
                let cx1Scaled = (cx1 + dxi) * turtlesScale;
                let cy1Scaled = (cy1 + dyi) * turtlesScale;
                let cx2Scaled = (cx2 + dxf) * turtlesScale;
                let cy2Scaled = (cy2 + dyf) * turtlesScale;

                this.svgPath = true;

                // Initial arc
                let oAngleRadians = ((180 + degreesInitial) / 180) * Math.PI;
                let arccx = ix;
                let arccy = iy;
                let sa = oAngleRadians - Math.PI;
                let ea = oAngleRadians;
                this.ctx.arc(arccx, arccy, step, sa, ea, false);
                this._svgArc(
                    steps,
                    arccx * turtlesScale,
                    arccy * turtlesScale,
                    step * turtlesScale,
                    sa,
                    ea
                );

                // Final arc
                oAngleRadians = (degreesFinal / 180) * Math.PI;
                arccx = fx;
                arccy = fy;
                sa = oAngleRadians - Math.PI;
                ea = oAngleRadians;
                this.ctx.arc(arccx, arccy, step, sa, ea, false);
                this._svgArc(
                    steps,
                    arccx * turtlesScale,
                    arccy * turtlesScale,
                    step * turtlesScale,
                    sa,
                    ea
                );

                fx = turtles.turtleX2screenX(x2);
                fy = turtles.turtleY2screenY(y2);
                let fxScaled = fx * turtlesScale;
                let fyScaled = fy * turtlesScale;

                this.ctx.stroke();
                this.ctx.closePath();

                // Restore stroke
                this.stroke = savedStroke;
                this.ctx.lineWidth = this.stroke;
                this.ctx.lineCap = "round";
                this.ctx.moveTo(fx, fy);
                this.svgOutput += "M " + fxScaled + "," + fyScaled + " ";
                this.x = x2;
                this.y = y2;
            } else if (this.penState) {
                this._processColor();
                this.ctx.lineWidth = this.stroke;
                this.ctx.lineCap = "round";
                this.ctx.beginPath();
                this.ctx.moveTo(this.container.x, this.container.y);

                // Convert from turtle coordinates to screen coordinates
                fx = turtles.turtleX2screenX(x2);
                fy = turtles.turtleY2screenY(y2);
                let cx1 = turtles.turtleX2screenX(cp1x);
                let cy1 = turtles.turtleY2screenY(cp1y);
                let cx2 = turtles.turtleX2screenX(cp2x);
                let cy2 = turtles.turtleY2screenY(cp2y);

                this.ctx.bezierCurveTo(
                    cx1 + dxi,
                    cy1 + dyi,
                    cx2 + dxf,
                    cy2 + dyf,
                    cx,
                    cy
                );
                this.ctx.bezierCurveTo(
                    cx2 - dxf,
                    cy2 - dyf,
                    cx1 - dxi,
                    cy1 - dyi,
                    ax,
                    ay
                );
                this.ctx.bezierCurveTo(cx1, cy1, cx2, cy2, fx, fy);

                if (!this.svgPath) {
                    this.svgPath = true;
                    let ix = turtles.turtleX2screenX(this.x);
                    let iy = turtles.turtleY2screenY(this.y);
                    let ixScaled = ix * turtlesScale;
                    let iyScaled = iy * turtlesScale;
                    this.svgOutput +=
                        '<path d="M ' + ixScaled + "," + iyScaled + " ";
                }

                let cx1Scaled = cx1 * turtlesScale;
                let cy1Scaled = cy1 * turtlesScale;
                let cx2Scaled = cx2 * turtlesScale;
                let cy2Scaled = cy2 * turtlesScale;
                let fxScaled = fx * turtlesScale;
                let fyScaled = fy * turtlesScale;

                // Curve to: ControlPointX1, ControlPointY1 >> ControlPointX2, ControlPointY2 >> X, Y
                this.svgOutput +=
                    "C " +
                    cx1Scaled +
                    "," +
                    cy1Scaled +
                    " " +
                    cx2Scaled +
                    "," +
                    cy2Scaled +
                    " " +
                    fxScaled +
                    "," +
                    fyScaled;
                this.closeSVG();

                this.x = x2;
                this.y = y2;
                this.ctx.stroke();
                if (!this.fillState) {
                    this.ctx.closePath();
                }
            } else {
                this.x = x2;
                this.y = y2;
                fx = turtles.turtleX2screenX(x2);
                fy = turtles.turtleY2screenY(y2);
            }

            // Update turtle position on screen.
            this.container.x = fx;
            this.container.y = fy;

            // The new heading is the angle between (cp2x, cp2y) and (x2, y2)
            let degrees = Math.atan2(x2 - cp2x, y2 - cp2y);
            degrees = (180 * degrees) / Math.PI;
            this.doSetHeading(degrees);
        }

        /**
         * Draws an arc with turtle pen and moves turtle to the end of the arc.
         *
         * @param cx - x-coordinate of circle center
         * @param cy - y-coordinate of circle center
         * @param ox - old x-coordinate of turtle
         * @param oy - old y coordinate of turtle
         * @param x - onscreen x coordinate of turtle
         * @param y - onscreen y coordinate of turtle
         * @param radius - radius of circle (for arc)
         * @param start - start angle
         * @param end - end angle
         * @param anticlockwise - boolean value regarding whether arc is cw or acw
         * @param invert - boolean value regarding whether coordinates are inverted or not
         */
        arc(
            cx,
            cy,
            ox,
            oy,
            x,
            y,
            radius,
            start,
            end,
            anticlockwise,
            invert
        ) {
            let nx, ny, sa, ea;

            let turtles = this.getTurtles();
            let turtlesScale = turtles.getScale();

            if (invert) {
                cx = turtles.turtleX2screenX(cx);
                cy = turtles.turtleY2screenY(cy);
                ox = turtles.turtleX2screenX(ox);
                oy = turtles.turtleY2screenY(oy);
                nx = turtles.turtleX2screenX(x);
                ny = turtles.turtleY2screenY(y);
            } else {
                nx = x;
                ny = y;
            }

            if (!anticlockwise) {
                sa = start - Math.PI;
                ea = end - Math.PI;
            } else {
                sa = start;
                ea = end;
            }

            // Draw an arc if the pen is down
            if (this.penState && this.hollowState) {
                // Close the current SVG path
                this.closeSVG();
                this.svgPath = true;

                // Save the current stroke width
                let savedStroke = this.stroke;
                this.stroke = 1;
                this.ctx.lineWidth = this.stroke;
                this.ctx.lineCap = "round";

                // Draw a hollow line
                let step = savedStroke < 3 ? 0.5 : (savedStroke - 2) / 2;

                let capAngleRadians = ((this.orientation + 90) * Math.PI) / 180.0;
                let dx = step * Math.sin(capAngleRadians);
                let dy = -step * Math.cos(capAngleRadians);

                let oxScaled, oyScaled;
                if (anticlockwise) {
                    this.ctx.moveTo(ox + dx, oy + dy);
                    oxScaled = (ox + dx) * turtlesScale;
                    oyScaled = (oy + dy) * turtlesScale;
                } else {
                    this.ctx.moveTo(ox - dx, oy - dy);
                    oxScaled = (ox - dx) * turtlesScale;
                    oyScaled = (oy - dy) * turtlesScale;
                }
                this.svgOutput += '<path d="M ' + oxScaled + "," + oyScaled + " ";

                this.ctx.arc(cx, cy, radius + step, sa, ea, anticlockwise);
                let nsteps = Math.max(Math.floor((radius * Math.abs(sa - ea)) / 2), 2);
                let steps = Math.max(Math.floor(savedStroke, 1));

                this._svgArc(
                    nsteps,
                    cx * turtlesScale,
                    cy * turtlesScale,
                    (radius + step) * turtlesScale,
                    sa,
                    ea
                );

                capAngleRadians = ((this.orientation + 90) * Math.PI) / 180.0;
                dx = step * Math.sin(capAngleRadians);
                dy = -step * Math.cos(capAngleRadians);

                let cx1 = nx;
                let cy1 = ny;
                let sa1 = ea;
                let ea1 = ea + Math.PI;
                this.ctx.arc(cx1, cy1, step, sa1, ea1, anticlockwise);
                this._svgArc(
                    steps,
                    cx1 * turtlesScale,
                    cy1 * turtlesScale,
                    step * turtlesScale,
                    sa1,
                    ea1
                );
                this.ctx.arc(cx, cy, radius - step, ea, sa, !anticlockwise);
                this._svgArc(
                    nsteps,
                    cx * turtlesScale,
                    cy * turtlesScale,
                    (radius - step) * turtlesScale,
                    ea,
                    sa
                );
                let cx2 = ox;
                let cy2 = oy;
                let sa2 = sa - Math.PI;
                let ea2 = sa;
                this.ctx.arc(cx2, cy2, step, sa2, ea2, anticlockwise);
                this._svgArc(
                    steps,
                    cx2 * turtlesScale,
                    cy2 * turtlesScale,
                    step * turtlesScale,
                    sa2,
                    ea2
                );
                this.closeSVG();

                this.ctx.stroke();
                this.ctx.closePath();

                // Restore stroke
                this.stroke = savedStroke;
                this.ctx.lineWidth = this.stroke;
                this.ctx.lineCap = "round";
                this.ctx.moveTo(nx, ny);
            } else if (this.penState) {
                this.ctx.arc(cx, cy, radius, sa, ea, anticlockwise);
                if (!this.svgPath) {
                    this.svgPath = true;
                    let oxScaled = ox * turtlesScale;
                    let oyScaled = oy * turtlesScale;
                    this.svgOutput +=
                        '<path d="M ' + oxScaled + "," + oyScaled + " ";
                }

                let sweep = anticlockwise ? 0 : 1;

                let nxScaled = nx * turtlesScale;
                let nyScaled = ny * turtlesScale;
                let radiusScaled = radius * turtlesScale;
                this.svgOutput +=
                    "A " +
                    radiusScaled +
                    "," +
                    radiusScaled +
                    " 0 0 " +
                    sweep +
                    " " +
                    nxScaled +
                    "," +
                    nyScaled +
                    " ";
                this.ctx.stroke();
                if (!this.fillState) {
                    this.ctx.closePath();
                }
            } else {
                this.ctx.moveTo(nx, ny);
            }

            // Update turtle position on screen
            this.container.x = nx;
            this.container.y = ny;
            if (invert) {
                this.x = x;
                this.y = y;
            } else {
                this.x = this.screenX2turtles.turtleX(x);
                this.y = this.screenY2turtles.turtleY(y);
            }
        }

        /**
         * Takes in turtle functions to reset the turtle position, pen, skin, media.
         *
         * @param resetPen - boolean value regarding whether the pen's properties
         * (color, value etc) should be reset
         * @param resetSkin - boolean value regarding whether the turtle's 'skin'
         * (color, blockname etc) should be reset
         * @param resetPosition - boolean value regarding whether the turtle's
         * position (orientation, x, y etc) should be reset
         */
        doClear(resetPen, resetSkin, resetPosition) {
            let turtles = this.getTurtles();

            // Reset turtle
            if (resetPosition) {
                this.x = 0;
                this.y = 0;
                this.orientation = 0.0;
                turtles.gx = this.ctx.canvas.width;
                turtles.gy = this.ctx.canvas.height;
            }

            if (resetPen) {
                let i = turtles.turtleList.indexOf(this) % 10;
                this.color = i * 10;
                this.value = DEFAULTVALUE;
                this.chroma = DEFAULTCHROMA;
                this.stroke = DEFAULTSTROKE;
                this.font = DEFAULTFONT;
            }

            this.container.x = turtles.turtleX2screenX(this.x);
            this.container.y = turtles.turtleY2screenY(this.y);

            if (resetSkin) {
                if (this.name !== _("start")) {
                    this.rename(_("start"));
                }

                if (this.skinChanged) {
                    let artwork = TURTLESVG;
                    if (sugarizerCompatibility.isInsideSugarizer()) {
                        artwork = artwork
                            .replace(
                                /fill_color/g,
                                sugarizerCompatibility.xoColor.fill
                            )
                            .replace(
                                /stroke_color/g,
                                sugarizerCompatibility.xoColor.stroke
                            );
                    } else {
                        artwork = artwork
                            .replace(/fill_color/g, FILLCOLORS[i])
                            .replace(/stroke_color/g, STROKECOLORS[i]);
                    }

                    this.doTurtleShell(
                        55,
                        "data:image/svg+xml;base64," +
                        window.btoa(unescape(encodeURIComponent(artwork)))
                    );
                    this.skinChanged = false;
                }
            }

            this.container.rotation = this.orientation;
            this.bitmap.rotation = this.orientation;
            this._updateCache();

            // Clear all media
            for (let i = 0; i < this.media.length; i++) {
                // Could be in the image Container or the Stage
                this.imageContainer.removeChild(this.media[i]);
                turtles.getStage().removeChild(this.media[i]);
                delete this.media[i];
            }

            this.media = [];

            // Clear all graphics
            this.penState = true;
            this.fillState = false;
            this.hollowState = false;

            this.canvasColor =
                getMunsellColor(this.color, this.value, this.chroma);
            if (this.canvasColor[0] === "#") {
                this.canvasColor = hex2rgb(this.canvasColor.split("#")[1]);
            }

            this.svgOutput = "";
            this.svgPath = false;
            this.penstrokes.image = null;
            this.ctx.beginPath();
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if (turtles.c1ctx != null) {
                turtles.c1ctx.beginPath();
                turtles.c1ctx.clearRect(
                    0, 0, 3 * this.canvas.width, 3 * this.canvas.height
                );
            }
            this.penstrokes.image = this.canvas;
            turtles.refreshCanvas();
        }

        /**
         * Removes penstrokes and clears canvas.
         */
        __clearPenStrokes() {
            this.penState = true;
            this.fillState = false;
            this.hollowState = false;

            this.canvasColor =
                getMunsellColor(this.color, this.value, this.chroma);
            if (this.canvasColor[0] === "#") {
                this.canvasColor = hex2rgb(this.canvasColor.split("#")[1]);
            }

            this.ctx.beginPath();
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this._processColor();
            this.ctx.lineWidth = this.stroke;
            this.ctx.lineCap = "round";
            this.ctx.beginPath();
            this.penstrokes.image = this.canvas;
            this.svgOutput = "";
            this.svgPath = false;
            this.getTurtles().refreshCanvas();
        }

        /**
        * Checks if x, y is out of ctx.
        *
        * @private
        * @param x - on screen x coordinate
        * @param y - on screen y coordinate
        * @param w - width
        * @param h - height
        */
        _outOfBounds(x, y, w, h) {
            return (x > w || x < 0 || y > h || y < 0);
        }

        /**
     * Moves turtle.
     *
     * @private
     * @param ox - the old x-coordinate of the turtle
     * @param oy - the old y-coordinate of the turtle
     * @param x - on screen x coordinate
     * @param y - on screen y coordinate
     * @param invert - boolean value regarding whether coordinates are inverted or not
     */
        _move(ox, oy, x, y, invert) {
            let turtles = this.getTurtles();
            let turtlesScale = turtles.getScale();

            let nx, ny;
            if (invert) {
                ox = turtles.turtleX2screenX(ox);
                oy = turtles.turtleY2screenY(oy);
                nx = turtles.turtleX2screenX(x);
                ny = turtles.turtleY2screenY(y);
            } else {
                nx = x;
                ny = y;
            }

            // Draw a line if the pen is down
            if (this.penState && this.hollowState) {
                // Close the current SVG path
                this.closeSVG();
                this.svgPath = true;

                // Save the current stroke width
                let savedStroke = this.stroke;
                this.stroke = 1;
                this.ctx.lineWidth = this.stroke;
                this.ctx.lineCap = "round";

                // Draw a hollow line
                let step = savedStroke < 3 ? 0.5 : (savedStroke - 2) / 2;

                let capAngleRadians = ((this.orientation - 90) * Math.PI) / 180.0;
                let dx = step * Math.sin(capAngleRadians);
                let dy = -step * Math.cos(capAngleRadians);

                this.ctx.moveTo(ox + dx, oy + dy);
                let oxScaled = (ox + dx) * turtlesScale;
                let oyScaled = (oy + dy) * turtlesScale;
                this.svgOutput += '<path d="M ' + oxScaled + "," + oyScaled + " ";

                this.ctx.lineTo(nx + dx, ny + dy);
                let nxScaled = (nx + dx) * turtlesScale;
                let nyScaled = (ny + dy) * turtlesScale;
                this.svgOutput += nxScaled + "," + nyScaled + " ";

                capAngleRadians = ((this.orientation + 90) * Math.PI) / 180.0;
                dx = step * Math.sin(capAngleRadians);
                dy = -step * Math.cos(capAngleRadians);

                let oAngleRadians = (this.orientation / 180) * Math.PI;
                let cx = nx;
                let cy = ny;
                let sa = oAngleRadians - Math.PI;
                let ea = oAngleRadians;
                this.ctx.arc(cx, cy, step, sa, ea, false);

                nxScaled = (nx + dx) * turtlesScale;
                nyScaled = (ny + dy) * turtlesScale;

                let radiusScaled = step * turtlesScale;

                // Simulate an arc with line segments since Tinkercad
                // cannot import SVG arcs reliably.
                // Replaces:
                // this.svgOutput += 'A ' + radiusScaled + ',' + radiusScaled + ' 0 0 1 ' + nxScaled + ',' + nyScaled + ' ';
                // this.svgOutput += 'M ' + nxScaled + ',' + nyScaled + ' ';

                let steps = Math.max(Math.floor(savedStroke, 1));
                this._svgArc(
                    steps,
                    cx * turtlesScale,
                    cy * turtlesScale,
                    radiusScaled,
                    sa
                );
                this.svgOutput += nxScaled + "," + nyScaled + " ";

                this.ctx.lineTo(ox + dx, oy + dy);
                nxScaled = (ox + dx) * turtlesScale;
                nyScaled = (oy + dy) * turtlesScale;
                this.svgOutput += nxScaled + "," + nyScaled + " ";

                capAngleRadians = ((this.orientation - 90) * Math.PI) / 180.0;
                dx = step * Math.sin(capAngleRadians);
                dy = -step * Math.cos(capAngleRadians);

                oAngleRadians = ((this.orientation + 180) / 180) * Math.PI;
                cx = ox;
                cy = oy;
                sa = oAngleRadians - Math.PI;
                ea = oAngleRadians;
                this.ctx.arc(cx, cy, step, sa, ea, false);

                nxScaled = (ox + dx) * turtlesScale;
                nyScaled = (oy + dy) * turtlesScale;

                radiusScaled = step * turtlesScale;
                this._svgArc(
                    steps,
                    cx * turtlesScale,
                    cy * turtlesScale,
                    radiusScaled,
                    sa
                );
                this.svgOutput += nxScaled + "," + nyScaled + " ";

                this.closeSVG();

                this.ctx.stroke();
                this.ctx.closePath();

                // Restore stroke
                this.stroke = savedStroke;
                this.ctx.lineWidth = this.stroke;
                this.ctx.lineCap = "round";
                this.ctx.moveTo(nx, ny);
            } else if (this.penState) {
                this.ctx.lineTo(nx, ny);
                if (!this.svgPath) {
                    this.svgPath = true;
                    let oxScaled = ox * turtlesScale;
                    let oyScaled = oy * turtlesScale;
                    this.svgOutput +=
                        '<path d="M ' + oxScaled + "," + oyScaled + " ";
                }
                let nxScaled = nx * turtlesScale;
                let nyScaled = ny * turtlesScale;
                this.svgOutput += nxScaled + "," + nyScaled + " ";
                this.ctx.stroke();
                if (!this.fillState) {
                    this.ctx.closePath();
                }
            } else {
                this.ctx.moveTo(nx, ny);
            }

            this.penstrokes.image = this.canvas;

            // Update turtle position on screen
            this.container.x = nx;
            this.container.y = ny;
            if (invert) {
                this.x = x;
                this.y = y;
            } else {
                this.x = turtles.screenX2turtleX(x);
                this.y = turtles.screenY2turtleY(y);
            }
        }

        /**
         * Takes in turtle functions to reset the turtle position, pen, skin, media.
         *
         * @param steps - the number of steps the turtle goes forward by
         */
        doForward(steps) {
            this._processColor();

            if (!this.fillState) {
                this.ctx.lineWidth = this.stroke;
                this.ctx.lineCap = "round";
                this.ctx.beginPath();
                this.ctx.moveTo(this.container.x, this.container.y);
            }

            let turtles = this.getTurtles();

            // old turtle point
            let ox = turtles.screenX2turtleX(this.container.x);
            let oy = turtles.screenY2turtleY(this.container.y);

            let angleRadians = (this.orientation * Math.PI) / 180.0;

            // new turtle point
            let nx = ox + Number(steps) * Math.sin(angleRadians);
            let ny = oy + Number(steps) * Math.cos(angleRadians);

            let w = this.ctx.canvas.width;
            let h = this.ctx.canvas.height;

            let out =
                this._outOfBounds(
                    turtles.turtleX2screenX(nx),
                    turtles.turtleY2screenY(ny),
                    w,
                    h
                );

            if (!WRAP || !out) {
                this._move(ox, oy, nx, ny, true);
                turtles.refreshCanvas();
            } else {
                let stepUnit = 5;
                let xIncrease, yIncrease;
                if (steps > 0) {
                    xIncrease = stepUnit * Math.sin(angleRadians);
                    yIncrease = stepUnit * Math.cos(angleRadians);
                } else {
                    xIncrease = -stepUnit * Math.sin(angleRadians);
                    yIncrease = -stepUnit * Math.cos(angleRadians);
                    steps = -steps;
                }

                while (steps >= 0) {
                    if (this.container.x > w) {
                        this.container.x = 0;
                        this.ctx.moveTo(this.container.x, this.container.y);
                    }
                    if (this.container.x < 0) {
                        this.container.x = w;
                        this.ctx.moveTo(this.container.x, this.container.y);
                    }
                    if (this.container.y > h) {
                        this.container.y = 0;
                        this.ctx.moveTo(this.container.x, this.container.y);
                    }
                    if (this.container.y < 0) {
                        this.container.y = h;
                        this.ctx.moveTo(this.container.x, this.container.y);
                    }

                    // Get old turtle point
                    oy = turtles.screenY2turtleY(this.container.y);
                    ox = turtles.screenX2turtleX(this.container.x);

                    // Increment new turtle point
                    nx = ox + xIncrease;
                    ny = oy + yIncrease;

                    this._move(ox, oy, nx, ny, true)
                    this.container.x = turtles.turtleX2screenX(nx);
                    this.container.y = turtles.turtleY2screenY(ny);
                    this.ctx.moveTo(this.container.x, this.container.y);

                    steps -= stepUnit;
                }

                turtles.refreshCanvas();
            }
        }

        /**
         * Moves turtle to specific point (x, y).
         *
         * @param x - on-screen x coordinate of the point to where the turtle is moved
         * @param y - on-screen y coordinate of the point to where the turtle is moved
         */
        doSetXY(x, y) {
            this._processColor();

            if (!this.fillState) {
                this.ctx.lineWidth = this.stroke;
                this.ctx.lineCap = "round";
                this.ctx.beginPath();
                this.ctx.moveTo(this.container.x, this.container.y);
            }

            // Get old turtle point
            let ox = this.getTurtles().screenX2turtleX(this.container.x);
            let oy = this.getTurtles().screenY2turtleY(this.container.y);

            // New turtle point
            let nx = Number(x);
            let ny = Number(y);

            this._move(ox, oy, nx, ny, true);
            this.getTurtles().refreshCanvas();
        }

        /**
         * Draws arc parts for eventual combination into one arc.
         *
         * @private
         * @param angle - angle of arc
         * @param radius - radius of arc
         */
        _doArcPart(angle, radius) {
            this._processColor();

            if (!this.fillState) {
                this.ctx.lineWidth = this.stroke;
                this.ctx.lineCap = "round";
                this.ctx.beginPath();
                this.ctx.moveTo(this.container.x, this.container.y);
            }

            let adeg = Number(angle);
            let angleRadians = (adeg / 180) * Math.PI;
            let oAngleRadians = (this.orientation / 180) * Math.PI;
            let r = Number(radius);

            // Get old turtle point
            let ox = this.getTurtles().screenX2turtleX(this.container.x);
            let oy = this.getTurtles().screenY2turtleY(this.container.y);

            let anticlockwise;
            let cx, cy, nx, ny;
            if (adeg < 0) {
                anticlockwise = true;
                adeg = -adeg;
                // Center point for arc
                cx = ox - Math.cos(oAngleRadians) * r;
                cy = oy + Math.sin(oAngleRadians) * r;
                // Calculate position of turtle
                nx = cx + Math.cos(oAngleRadians + angleRadians) * r;
                ny = cy - Math.sin(oAngleRadians + angleRadians) * r;
            } else {
                anticlockwise = false;
                // Center point for arc
                cx = ox + Math.cos(oAngleRadians) * r;
                cy = oy - Math.sin(oAngleRadians) * r;
                // Calculate position of turtle
                nx = cx - Math.cos(oAngleRadians + angleRadians) * r;
                ny = cy + Math.sin(oAngleRadians + angleRadians) * r;
            }

            this.arc(
                cx,
                cy,
                ox,
                oy,
                nx,
                ny,
                r,
                oAngleRadians,
                oAngleRadians + angleRadians,
                anticlockwise,
                true
            );

            if (anticlockwise) {
                this.doRight(-adeg);
            } else {
                this.doRight(adeg);
            }

            this.getTurtles().refreshCanvas();
        }

        /**
         * Draws arc with specified angle and radius by
         * breaking up arcs into chucks of 90 degrees or less
         * (in order to have exported SVG properly rendered).
         *
         * @param angle - angle of arc
         * @param radius - radius of arc
         */
        doArc(angle, radius) {
            if (radius < 0) {
                radius = -radius;
            }

            let adeg = Number(angle), factor;
            if (adeg < 0) {
                factor = -1;
                adeg = -adeg;
            } else {
                factor = 1;
            }

            let remainder = adeg % 90;
            let n = Math.floor(adeg / 90);
            for (let i = 0; i < n; i++) {
                this._doArcPart(90 * factor, radius);
            }
            if (remainder > 0) {
                this._doArcPart(remainder * factor, radius);
            }
        }

        /**
         * Adds an image object to the canvas (shows an image).
         *
         * @param size - size of image
         * @param myImage - image path
         */
        doShowImage(size, myImage) {
            // Is there a JS test for a valid image path?
            if (myImage === null) {
                return;
            }

            let image = new Image();

            image.onload = () => {
                let bitmap = new createjs.Bitmap(image);
                this.imageContainer.addChild(bitmap);
                this.media.push(bitmap);
                bitmap.scaleX = Number(size) / image.width;
                bitmap.scaleY = bitmap.scaleX;
                bitmap.scale = bitmap.scaleX;
                bitmap.x = this.container.x;
                bitmap.y = this.container.y;
                bitmap.regX = image.width / 2;
                bitmap.regY = image.height / 2;
                bitmap.rotation = this.orientation;
                this.getTurtles().refreshCanvas();
            };

            image.src = myImage;
        }

        /**
         * Adds an image object from a URL to the canvas (shows an image).
         *
         * @param size - size of image
         * @param myImage - URL of image (image address)
         */
        doShowURL(size, myURL) {
            if (myURL === null) {
                return;
            }
            let image = new Image();
            image.src = myURL;
            let turtle = this;

            image.onload = () => {
                let bitmap = new createjs.Bitmap(image);
                turtle.imageContainer.addChild(bitmap);
                turtle.media.push(bitmap);
                bitmap.scaleX = Number(size) / image.width;
                bitmap.scaleY = bitmap.scaleX;
                bitmap.scale = bitmap.scaleX;
                bitmap.x = turtle.container.x;
                bitmap.y = turtle.container.y;
                bitmap.regX = image.width / 2;
                bitmap.regY = image.height / 2;
                bitmap.rotation = turtle.orientation;
                turtle.turtles.refreshCanvas();
            };
        }

        /**
         * Adds an image object to the turtle.
         *
         * @param size - size of image
         * @param myImage - path of image
         */
        doTurtleShell(size, myImage) {
            if (myImage === null) {
                return;
            }

            let image = new Image();
            image.src = myImage;
            this.shellSize = Number(size);

            image.onload = () => {
                this.container.removeChild(this.bitmap);
                this.bitmap = new createjs.Bitmap(image);
                this.container.addChild(this.bitmap);
                this.bitmap.scaleX = this.shellSize / image.width;
                this.bitmap.scaleY = this.bitmap.scaleX;
                this.bitmap.scale = this.bitmap.scaleX;
                this.bitmap.x = 0;
                this.bitmap.y = 0;
                this.bitmap.regX = image.width / 2;
                this.bitmap.regY = image.height / 2;
                this.bitmap.rotation = this.orientation;
                this.skinChanged = true;

                this.container.uncache();
                let bounds = this.container.getBounds();
                this.container.cache(
                    bounds.x,
                    bounds.y,
                    bounds.width,
                    bounds.height
                );

                // Recalculate the hit area as well
                let hitArea = new createjs.Shape();
                hitArea.graphics
                    .beginFill("#FFF")
                    .drawRect(0, 0, bounds.width, bounds.height);
                hitArea.x = -bounds.width / 2;
                hitArea.y = -bounds.height / 2;
                this.container.hitArea = hitArea;

                if (this.startBlock != null) {
                    this.startBlock.container.removeChild(this.decorationBitmap);
                    this.decorationBitmap = new createjs.Bitmap(myImage);
                    this.startBlock.container.addChild(this.decorationBitmap);
                    this.decorationBitmap.name = "decoration";

                    let width = this.startBlock.width;
                    // FIXME: Why is the position off? Does it need a scale factor?
                    this.decorationBitmap.x =
                        width - (30 * this.startBlock.protoblock.scale) / 2;
                    this.decorationBitmap.y =
                        (20 * this.startBlock.protoblock.scale) / 2;
                    this.decorationBitmap.scaleX =
                        ((27.5 / image.width) * this.startBlock.protoblock.scale) /
                        2;
                    this.decorationBitmap.scaleY =
                        ((27.5 / image.height) * this.startBlock.protoblock.scale) /
                        2;
                    this.decorationBitmap.scale =
                        ((27.5 / image.width) * this.startBlock.protoblock.scale) /
                        2;
                    this.startBlock.updateCache();
                }

                this.getTurtles().refreshCanvas();
            };
        }

        /**
         * Resizes decoration by width and scale.
         *
         * @param scale - resize decoration by scale
         * @param width - resize decoration by width
         */
        resizeDecoration(scale, width) {
            this.decorationBitmap.x = width - (30 * scale) / 2;
            this.decorationBitmap.y = (35 * scale) / 2;
            this.decorationBitmap.scaleX =
                this.decorationBitmap.scaleY =
                this.decorationBitmap.scale =
                    (0.5 * scale) / 2;
        }

        /**
         * Adds a text object to the canvas.
         *
         * @param  size - specifies text size
         * @param  myText - string of text to be displayed
         */
        doShowText(size, myText) {
            if (myText === null) {
                return;
            }

            let textList =
                typeof myText !== "string" ?
                    [myText.toString()] : myText.split("\\n");

            let textSize = size.toString() + "px " + this.font;
            for (i = 0; i < textList.length; i++) {
                let text = new createjs.Text(
                    textList[i],
                    textSize,
                    this.canvasColor
                );
                text.textAlign = "left";
                text.textBaseline = "alphabetic";
                this.getTurtles().getStage().addChild(text);
                this.media.push(text);
                text.x = this.container.x;
                text.y = this.container.y + i * size;
                text.rotation = this.orientation;

                let xScaled = text.x * this.getTurtles().scale;
                let yScaled = text.y * this.getTurtles().scale;
                let sizeScaled = size * this.getTurtles().scale;
                this.svgOutput +=
                    '<text x="' +
                    xScaled +
                    '" y = "' +
                    yScaled +
                    '" fill="' +
                    this.canvasColor +
                    '" font-family = "' +
                    this.font +
                    '" font-size = "' +
                    sizeScaled +
                    '">' +
                    myText +
                    "</text>";

                this.getTurtles().refreshCanvas();
            }
        }

        /**
         * Turn right and display corresponding turtle graphic by rotating bitmap.
         *
         * @param degrees - degrees for right turn
         */
        doRight(degrees) {
            this.orientation += Number(degrees);
            while (this.orientation < 0) {
                this.orientation += 360;
            }

            this.orientation %= 360;
            this.container.rotation = this.orientation;

            // We cannot update the cache during the 'tween'
            if (this.blinkFinished) {
                this._updateCache();
            }
        }

        /**
         * Sets the direction of where the turtle is heading by rotating bitmap.
         *
         * @param degrees - degrees turned to set the 'heading' of turtle
         */
        doSetHeading(degrees) {
            this.orientation = Number(degrees);
            while (this.orientation < 0) {
                this.orientation += 360;
            }

            this.orientation %= 360;
            this.container.rotation = this.orientation;

            // We cannot update the cache during the 'tween'
            if (this.blinkFinished) {
                this._updateCache();
            }
        }

        /**
         * Sets font.
         *
         * @param font - font object
         */
        doSetFont(font) {
            this.font = font;
            this._updateCache();
        }

        /**
         * Sets color.
         * Color sets hue but also selects maximum chroma.
         *
         * @param color - hex code specifying color
         */
        doSetColor(color) {
            this.closeSVG();
            this.color = Number(color);
            let results = getcolor(this.color);
            this.canvasValue = results[0];
            this.value = results[0];
            this.canvasChroma = results[1];
            this.chroma = results[1];
            this.canvasColor = results[2];
            this._processColor();
        }

        /**
         * Sets pen's alpha value (transparency).
         *
         * @param alpha - alpha value
         */
        doSetPenAlpha(alpha) {
            this.canvasAlpha = alpha;
        }

        /**
         * Splits hex code for rgb number values.
         *
         * @private
         */
        _processColor() {
            if (this.canvasColor[0] === "#") {
                this.canvasColor = hex2rgb(this.canvasColor.split("#")[1]);
            }

            let subrgb = this.canvasColor.substr(0, this.canvasColor.length - 2);
            this.ctx.strokeStyle = subrgb + this.canvasAlpha + ")";
            this.ctx.fillStyle = subrgb + this.canvasAlpha + ")";
        }

        /**
         * Sets hue for canvas.
         *
         * @param hue - hue hex code
         */
        doSetHue(hue) {
            this.closeSVG();
            this.color = Number(hue);
            this.canvasColor =
                getMunsellColor(this.color, this.value, this.chroma);
            this._processColor();
        }

        /**
         * Sets shade for canvas.
         *
         * @param shade - shade hex code
         */
        doSetValue(shade) {
            this.closeSVG();
            this.value = Number(shade);
            this.canvasColor =
                getMunsellColor(this.color, this.value, this.chroma);
            this._processColor();
        }

        /**
         * Sets chroma for canvas.
         *
         * @param chroma - chroma hex code
         */
        doSetChroma(chroma) {
            this.closeSVG();
            this.chroma = Number(chroma);
            this.canvasColor =
                getMunsellColor(this.color, this.value, this.chroma);
            this._processColor();
        }

        /**
         * Sets pen size/thickness.
         *
         * @param size - pen size which is assigned to pen stroke
         */
        doSetPensize(size) {
            this.closeSVG();
            this.stroke = size;
            this.ctx.lineWidth = this.stroke;
        }

        /**
         * Toggles penState: puts pen 'up'.
         */
        doPenUp() {
            this.closeSVG();
            this.penState = false;
        }

        /**
         * Toggles penState: puts pen 'down'.
         */
        doPenDown() {
            this.penState = true;
        }

        /**
         * Begins fill path.
         */
        doStartFill() {
            /// Start tracking points here
            this.ctx.beginPath();
            this.fillState = true;
        }

        /**
         * Ends fill path.
         */
        doEndFill() {
            // Redraw the points with fill enabled
            this.ctx.fill();
            this.ctx.closePath();
            this.closeSVG();
            this.fillState = false;
        }

        /**
         * Begins hollow line by toggling hollowState (to true).
         */
        doStartHollowLine() {
            this.hollowState = true;    // start tracking points here
        }

        /**
         * Ends hollow line by toggling hollowState (to false).
         */
        doEndHollowLine() {
            this.hollowState = false;   // redraw the points with fill enabled
        }

        /**
         * Closes SVG by changing SVG output to the canvas.
         */
        closeSVG() {
            if (this.svgPath) {
                // For the SVG output, we need to replace rgba() with
                // rgb();fill-opacity:1 and rgb();stroke-opacity:1

                let svgColor = this.canvasColor.replace(/rgba/g, "rgb");
                svgColor = svgColor.substr(0, this.canvasColor.length - 4) + ");";

                this.svgOutput += '" style="stroke-linecap:round;fill:';
                this.svgOutput +=
                    this.fillState ?
                        svgColor + "fill-opacity:" + this.canvasAlpha + ";" :
                        "none;";
                this.svgOutput +=
                    "stroke:" +
                    svgColor +
                    "stroke-opacity:" +
                    this.canvasAlpha +
                    ";";
                let strokeScaled = this.stroke * this.getTurtles().scale;
                this.svgOutput += "stroke-width:" + strokeScaled + 'pt;" />';
                this.svgPath = false;
            }
        }

        /**
         * Async creation of bitmap from SVG data.
         *
         * @param {String} data - SVG data
         * @param {Object} startBlock - corresponding start block
         * @param {Function} refreshCanvas - callback to refresh canvas
         * @returns {void}
         */
        _makeTurtleBitmap(data, startBlock, refreshCanvas) {
            // Works with Chrome, Safari, Firefox (untested on IE)
            let img = new Image();

            img.onload = () => {
                let bitmap = new createjs.Bitmap(img);

                this.bitmap = bitmap;
                this.bitmap.regX = 27 | 0;
                this.bitmap.regY = 27 | 0;
                this.bitmap.cursor = "pointer";
                this.container.addChild(this.bitmap);
                this._createCache();

                this.startBlock = startBlock;
                if (startBlock != null) {
                    startBlock.updateCache();
                    this.decorationBitmap = this.bitmap.clone();
                    startBlock.container.addChild(this.decorationBitmap);
                    this.decorationBitmap.name = "decoration";
                    let width = startBlock.width;
                    let offset = 40;

                    this.decorationBitmap.x =
                        width - (offset * startBlock.protoblock.scale) / 2;
                    this.decorationBitmap.y =
                        (35 * startBlock.protoblock.scale) / 2;
                    this.decorationBitmap.scaleX =
                        this.decorationBitmap.scaleY =
                        this.decorationBitmap.scale =
                            (0.5 * startBlock.protoblock.scale) / 2;
                    startBlock.updateCache();
                }

                refreshCanvas();
            };

            img.src =
                "data:image/svg+xml;base64," +
                window.btoa(unescape(encodeURIComponent(data)));
        }
    };
}
