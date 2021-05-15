/**
 * @file This contains the prototype of the Turtle's Painter component.
 * @author Walter Bender
 *
 * @copyright 2014-2020 Walter Bender
 * @copyright 2020 Anindya Kundu
 *
 * @license
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * The GNU Affero General Public License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public License along with this
 * library; if not, write to the Free Software Foundation, 51 Franklin Street, Suite 500 Boston,
 * MA 02110-1335 USA.
 */

/*
   global _, getMunsellColor, getcolor, hex2rgb, STROKECOLORS, FILLCOLORS,
   TURTLESVG, WRAP
 */

/*
   Global locations
   - js/utils/utils.js
        _
   - js/utils/munsell.js
        getMunsellColor, getcolor
   - js/utils/utils.js
        hex2rgb
   - js/artwork.js
        STROKECOLORS, FILLCOLORS, TURTLESVG
   - js/toolbar.js
        WRAP
 */

// constants
const DEFAULTCOLOR = 0;
const DEFAULTVALUE = 50; // also used in turtles.js
const DEFAULTCHROMA = 100; // also used in turtles.js
const DEFAULTSTROKE = 5;
const DEFAULTFONT = "sans-serif"; // also used in PenBlocks.js

/**
 * Class pertaining to visual actions for each turtle.
 *
 * @class
 * @classdesc This is the prototype of the Painter for each Turtle component. It is responsible
 * for the visual actions and artworks of the Turtle. It is mostly view specific and communicates
 * with methods of Turtle and Turtles objects. An action may require updating the state of the
 * Turtle or the Turtles object.
 *
 * @todo move visual artwork related states from logo.js to here eventually.
 * As of now, some state variables are present in logo.js. To ensure modularity and independence of
 * components, Logo should contain members only related to execution of blocks while the logic of
 * execution of blocks should be present in respective files in blocks/ directory, which should
 * eventually use members of this file and turtle-singer.js to proceed.
 *
 * Private methods' names begin with underscore '_".
 * Unused methods' names begin with double underscore '__'.
 * Internal functions' names are in PascalCase.
 */

/*exported Painter*/

class Painter {
    /**
     * @constructor
     * @param {Object} turtle - Turtle object
     */
    constructor(turtle) {
        this.turtle = turtle;
        this.turtles = turtle.turtles;
        this.activity = turtle.activity;

        // Things used for what the turtle draws
        this._svgOutput = "";
        this._svgPath = false; // are we currently drawing a path?

        this._color = DEFAULTCOLOR;
        this._value = DEFAULTVALUE;
        this._chroma = DEFAULTCHROMA;
        this._stroke = DEFAULTSTROKE;
        this._font = DEFAULTFONT;

        // Control points for bezier curves
        this.cp1x = 0;
        this.cp1y = 100;
        this.cp2x = 100;
        this.cp2y = 100;

        this._canvasColor = "rgba(255,0,49,1)"; // '#ff0031';
        this._canvasAlpha = 1.0;
        this._fillState = false;
        this._hollowState = false;
        this._penDown = true;
        this.wrap = null;
    }

    // ========= Setters, Getters =============================================

    /**
     * @param {String} svgOutput - SVG output
     */
    set svgOutput(svgOutput) {
        this._svgOutput = svgOutput;
    }

    /**
     * @returns {String} SVG output
     */
    get svgOutput() {
        return this._svgOutput;
    }

    /**
     * @param {Number} color
     */
    set color(color) {
        this._color = color;
    }

    /**
     * @returns {Number}
     */
    get color() {
        return this._color;
    }

    /**
     * @param {Number} value
     */
    set value(value) {
        this._value = value;
    }

    /**
     * @returns {Number}
     */
    get value() {
        return this._value;
    }

    /**
     * @param {Number} chroma
     */
    set chroma(chroma) {
        this._chroma = chroma;
    }

    /**
     * @returns {Number}
     */
    get chroma() {
        return this._chroma;
    }

    /**
     * @param {Number} stroke
     */
    set stroke(stroke) {
        this._stroke = stroke;
    }

    /**
     * @returns {Number}
     */
    get stroke() {
        return this._stroke;
    }

    /**
     * @returns {String} font family
     */
    get font() {
        return this._font;
    }

    /**
     * @param {String} canvasColor
     */
    set canvasColor(canvasColor) {
        this._canvasColor = canvasColor;
    }

    /**
     * @returns {String}
     */
    get canvasColor() {
        return this._canvasColor;
    }

    /**
     * @param {Number} canvasAlpha
     */
    set canvasAlpha(canvasAlpha) {
        this._canvasAlpha = canvasAlpha;
    }

    /**
     * @returns {Number}
     */
    get canvasAlpha() {
        return this._canvasAlpha;
    }

    /**
     * @param {Boolean} penState - whether pen is down
     */
    set penState(penState) {
        this._penDown = penState;
    }

    /**
     * @returns {Boolean} whether pen is down
     */
    get penState() {
        return this._penDown;
    }

    // ========= Utilities ====================================================

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
        return x > w || x < 0 || y > h || y < 0;
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
        const turtles = this.turtles;
        const turtlesScale = turtles.scale;

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
        if (this._penDown && this._hollowState) {
            // Close the current SVG path
            this.closeSVG();
            this._svgPath = true;

            // Save the current stroke width
            const savedStroke = this.stroke;
            this.stroke = 1;
            this.turtle.ctx.lineWidth = this.stroke;
            this.turtle.ctx.lineCap = "round";

            // Draw a hollow line
            const step = savedStroke < 3 ? 0.5 : (savedStroke - 2) / 2;

            let capAngleRadians = ((this.turtle.orientation - 90) * Math.PI) / 180.0;
            let dx = step * Math.sin(capAngleRadians);
            let dy = -step * Math.cos(capAngleRadians);

            this.turtle.ctx.moveTo(ox + dx, oy + dy);
            const oxScaled = (ox + dx) * turtlesScale;
            const oyScaled = (oy + dy) * turtlesScale;
            this._svgOutput += '<path d="M ' + oxScaled + "," + oyScaled + " ";

            this.turtle.ctx.lineTo(nx + dx, ny + dy);
            let nxScaled = (nx + dx) * turtlesScale;
            let nyScaled = (ny + dy) * turtlesScale;
            this._svgOutput += nxScaled + "," + nyScaled + " ";

            capAngleRadians = ((this.turtle.orientation + 90) * Math.PI) / 180.0;
            dx = step * Math.sin(capAngleRadians);
            dy = -step * Math.cos(capAngleRadians);

            let oAngleRadians = (this.turtle.orientation / 180) * Math.PI;
            let cx = nx;
            let cy = ny;
            let sa = oAngleRadians - Math.PI;
            let ea = oAngleRadians;
            this.turtle.ctx.arc(cx, cy, step, sa, ea, false);

            nxScaled = (nx + dx) * turtlesScale;
            nyScaled = (ny + dy) * turtlesScale;

            let radiusScaled = step * turtlesScale;

            const steps = Math.max(Math.floor(savedStroke, 1));
            this._svgArc(steps, cx * turtlesScale, cy * turtlesScale, radiusScaled, sa);
            this._svgOutput += nxScaled + "," + nyScaled + " ";

            this.turtle.ctx.lineTo(ox + dx, oy + dy);
            nxScaled = (ox + dx) * turtlesScale;
            nyScaled = (oy + dy) * turtlesScale;
            this._svgOutput += nxScaled + "," + nyScaled + " ";

            capAngleRadians = ((this.turtle.orientation - 90) * Math.PI) / 180.0;
            dx = step * Math.sin(capAngleRadians);
            dy = -step * Math.cos(capAngleRadians);

            oAngleRadians = ((this.turtle.orientation + 180) / 180) * Math.PI;
            cx = ox;
            cy = oy;
            sa = oAngleRadians - Math.PI;
            ea = oAngleRadians;
            this.turtle.ctx.arc(cx, cy, step, sa, ea, false);

            nxScaled = (ox + dx) * turtlesScale;
            nyScaled = (oy + dy) * turtlesScale;

            radiusScaled = step * turtlesScale;
            this._svgArc(steps, cx * turtlesScale, cy * turtlesScale, radiusScaled, sa);
            this._svgOutput += nxScaled + "," + nyScaled + " ";

            this.closeSVG();

            this.turtle.ctx.stroke();
            this.turtle.ctx.closePath();

            // Restore stroke
            this.stroke = savedStroke;
            this.turtle.ctx.lineWidth = this.stroke;
            this.turtle.ctx.lineCap = "round";
            this.turtle.ctx.moveTo(nx, ny);
        } else if (this._penDown) {
            this.turtle.ctx.lineTo(nx, ny);
            if (!this._svgPath) {
                this._svgPath = true;
                const oxScaled = ox * turtlesScale;
                const oyScaled = oy * turtlesScale;
                this._svgOutput += '<path d="M ' + oxScaled + "," + oyScaled + " ";
            }
            const nxScaled = nx * turtlesScale;
            const nyScaled = ny * turtlesScale;
            this._svgOutput += nxScaled + "," + nyScaled + " ";
            this.turtle.ctx.stroke();
            if (!this._fillState) {
                this.turtle.ctx.closePath();
            }
        } else {
            this.turtle.ctx.moveTo(nx, ny);
        }

        this.turtle.penstrokes.image = this.turtle.canvas;

        // Update turtle position on screen
        this.turtle.container.x = nx;
        this.turtle.container.y = ny;
        if (invert) {
            this.turtle.x = x;
            this.turtle.y = y;
        } else {
            this.turtle.x = turtles.screenX2turtleX(x);
            this.turtle.y = turtles.screenY2turtleY(y);
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
        const da = ea == null ? Math.PI / nsteps : (ea - sa) / nsteps;

        for (let i = 0; i < nsteps; i++) {
            const nx = cx + radius * Math.cos(a);
            const ny = cy + radius * Math.sin(a);
            this._svgOutput += nx + "," + ny + " ";
            a += da;
        }
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
    _arc(cx, cy, ox, oy, x, y, radius, start, end, anticlockwise, invert) {
        let nx, ny, sa, ea;

        const turtles = this.turtles;
        const turtlesScale = turtles.scale;

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
        if (this._penDown && this._hollowState) {
            // Close the current SVG path
            this.closeSVG();
            this._svgPath = true;

            // Save the current stroke width
            const savedStroke = this.stroke;
            this.stroke = 1;
            this.turtle.ctx.lineWidth = this.stroke;
            this.turtle.ctx.lineCap = "round";

            // Draw a hollow line
            const step = savedStroke < 3 ? 0.5 : (savedStroke - 2) / 2;

            let capAngleRadians = ((this.turtle.orientation + 90) * Math.PI) / 180.0;
            let dx = step * Math.sin(capAngleRadians);
            let dy = -step * Math.cos(capAngleRadians);

            let oxScaled, oyScaled;
            if (anticlockwise) {
                this.turtle.ctx.moveTo(ox + dx, oy + dy);
                oxScaled = (ox + dx) * turtlesScale;
                oyScaled = (oy + dy) * turtlesScale;
            } else {
                this.turtle.ctx.moveTo(ox - dx, oy - dy);
                oxScaled = (ox - dx) * turtlesScale;
                oyScaled = (oy - dy) * turtlesScale;
            }
            this._svgOutput += '<path d="M ' + oxScaled + "," + oyScaled + " ";

            this.turtle.ctx.arc(cx, cy, radius + step, sa, ea, anticlockwise);
            const nsteps = Math.max(Math.floor((radius * Math.abs(sa - ea)) / 2), 2);
            const steps = Math.max(Math.floor(savedStroke, 1));

            this._svgArc(
                nsteps,
                cx * turtlesScale,
                cy * turtlesScale,
                (radius + step) * turtlesScale,
                sa,
                ea
            );

            capAngleRadians = ((this.turtle.orientation + 90) * Math.PI) / 180.0;
            dx = step * Math.sin(capAngleRadians);
            dy = -step * Math.cos(capAngleRadians);

            const cx1 = nx;
            const cy1 = ny;
            const sa1 = ea;
            const ea1 = ea + Math.PI;
            this.turtle.ctx.arc(cx1, cy1, step, sa1, ea1, anticlockwise);
            this._svgArc(
                steps,
                cx1 * turtlesScale,
                cy1 * turtlesScale,
                step * turtlesScale,
                sa1,
                ea1
            );
            this.turtle.ctx.arc(cx, cy, radius - step, ea, sa, !anticlockwise);
            this._svgArc(
                nsteps,
                cx * turtlesScale,
                cy * turtlesScale,
                (radius - step) * turtlesScale,
                ea,
                sa
            );
            const cx2 = ox;
            const cy2 = oy;
            const sa2 = sa - Math.PI;
            const ea2 = sa;
            this.turtle.ctx.arc(cx2, cy2, step, sa2, ea2, anticlockwise);
            this._svgArc(
                steps,
                cx2 * turtlesScale,
                cy2 * turtlesScale,
                step * turtlesScale,
                sa2,
                ea2
            );
            this.closeSVG();

            this.turtle.ctx.stroke();
            this.turtle.ctx.closePath();

            // Restore stroke
            this.stroke = savedStroke;
            this.turtle.ctx.lineWidth = this.stroke;
            this.turtle.ctx.lineCap = "round";
            this.turtle.ctx.moveTo(nx, ny);
        } else if (this._penDown) {
            this.turtle.ctx.arc(cx, cy, radius, sa, ea, anticlockwise);
            if (!this._svgPath) {
                this._svgPath = true;
                const oxScaled = ox * turtlesScale;
                const oyScaled = oy * turtlesScale;
                this._svgOutput += '<path d="M ' + oxScaled + "," + oyScaled + " ";
            }

            const sweep = anticlockwise ? 0 : 1;

            const nxScaled = nx * turtlesScale;
            const nyScaled = ny * turtlesScale;
            const radiusScaled = radius * turtlesScale;
            this._svgOutput +=
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
            this.turtle.ctx.stroke();
            if (!this._fillState) {
                this.turtle.ctx.closePath();
            }
        } else {
            this.turtle.ctx.moveTo(nx, ny);
        }

        // Update turtle position on screen
        this.turtle.container.x = nx;
        this.turtle.container.y = ny;
        if (invert) {
            this.turtle.x = x;
            this.turtle.y = y;
        } else {
            this.turtle.x = this.screenX2turtles.turtleX(x);
            this.turtle.y = this.screenY2turtles.turtleY(y);
        }
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

        if (!this._fillState) {
            this.turtle.ctx.lineWidth = this.stroke;
            this.turtle.ctx.lineCap = "round";
            this.turtle.ctx.beginPath();
            this.turtle.ctx.moveTo(this.turtle.container.x, this.turtle.container.y);
        }

        let adeg = Number(angle);
        const angleRadians = (adeg / 180) * Math.PI;
        const oAngleRadians = (this.turtle.orientation / 180) * Math.PI;
        const r = Number(radius);

        // Get old turtle point
        const ox = this.turtles.screenX2turtleX(this.turtle.container.x);
        const oy = this.turtles.screenY2turtleY(this.turtle.container.y);

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

        this._arc(
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

        this.activity.refreshCanvas();
    }

    /**
     * Splits hex code for rgb number values.
     *
     * @private
     */
    _processColor() {
        if (this._canvasColor[0] === "#") {
            this._canvasColor = hex2rgb(this._canvasColor.split("#")[1]);
        }

        const subrgb = this._canvasColor.substr(0, this._canvasColor.length - 2);
        this.turtle.ctx.strokeStyle = subrgb + this._canvasAlpha + ")";
        this.turtle.ctx.fillStyle = subrgb + this._canvasAlpha + ")";
    }

    /**
     * Closes SVG by changing SVG output to the canvas.
     */
    closeSVG() {
        if (this._svgPath) {
            // For the SVG output, we need to replace rgba() with
            // rgb();fill-opacity:1 and rgb();stroke-opacity:1

            let svgColor = this._canvasColor.replace(/rgba/g, "rgb");
            svgColor = svgColor.substr(0, this._canvasColor.length - 4) + ");";

            this._svgOutput += '" style="stroke-linecap:round;fill:';
            this._svgOutput += this._fillState
                ? svgColor + "fill-opacity:" + this._canvasAlpha + ";"
                : "none;";
            this._svgOutput += "stroke:" + svgColor + "stroke-opacity:" + this._canvasAlpha + ";";
            const strokeScaled = this.stroke * this.turtles.scale;
            this._svgOutput += "stroke-width:" + strokeScaled + 'pt;" />';
            this._svgPath = false;
        }
    }

    // ========= Action =======================================================

    /**
     * Takes in turtle functions to reset the turtle position, pen, skin, media.
     *
     * @param steps - the number of steps the turtle goes forward by
     */
    doForward(steps) {
        this._processColor();

        if (!this._fillState) {
            this.turtle.ctx.lineWidth = this.stroke;
            this.turtle.ctx.lineCap = "round";
            this.turtle.ctx.beginPath();
            this.turtle.ctx.moveTo(this.turtle.container.x, this.turtle.container.y);
        }

        const turtles = this.turtles;

        // old turtle point
        let ox = turtles.screenX2turtleX(this.turtle.container.x);
        let oy = turtles.screenY2turtleY(this.turtle.container.y);

        const angleRadians = (this.turtle.orientation * Math.PI) / 180.0;

        // new turtle point
        let nx = ox + Number(steps) * Math.sin(angleRadians);
        let ny = oy + Number(steps) * Math.cos(angleRadians);

        const w = this.turtle.ctx.canvas.width;
        const h = this.turtle.ctx.canvas.height;

        const out = this._outOfBounds(
            turtles.turtleX2screenX(nx),
            turtles.turtleY2screenY(ny),
            w,
            h
        );

        const wrap = this.wrap !== null ? this.wrap : WRAP;

        if (this._fillState || !wrap || !out) {
            this._move(ox, oy, nx, ny, true);
            this.activity.refreshCanvas();
        } else {
            const stepUnit = 5;
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
                if (this.turtle.container.x > w) {
                    this.turtle.container.x = 0;
                    this.turtle.ctx.moveTo(this.turtle.container.x, this.turtle.container.y);
                }
                if (this.turtle.container.x < 0) {
                    this.turtle.container.x = w;
                    this.turtle.ctx.moveTo(this.turtle.container.x, this.turtle.container.y);
                }
                if (this.turtle.container.y > h) {
                    this.turtle.container.y = 0;
                    this.turtle.ctx.moveTo(this.turtle.container.x, this.turtle.container.y);
                }
                if (this.turtle.container.y < 0) {
                    this.turtle.container.y = h;
                    this.turtle.ctx.moveTo(this.turtle.container.x, this.turtle.container.y);
                }

                // Get old turtle point
                oy = turtles.screenY2turtleY(this.turtle.container.y);
                ox = turtles.screenX2turtleX(this.turtle.container.x);

                // Increment new turtle point
                nx = ox + xIncrease;
                ny = oy + yIncrease;

                this._move(ox, oy, nx, ny, true);
                this.turtle.container.x = turtles.turtleX2screenX(nx);
                this.turtle.container.y = turtles.turtleY2screenY(ny);
                this.turtle.ctx.moveTo(this.turtle.container.x, this.turtle.container.y);

                steps -= stepUnit;
            }

            this.activity.refreshCanvas();
        }
    }

    /**
     * Turn right and display corresponding turtle graphic by rotating bitmap.
     *
     * @param degrees - degrees for right turn
     */
    doRight(degrees) {
        this.turtle.orientation += Number(degrees);
        while (this.turtle.orientation < 0) {
            this.turtle.orientation += 360;
        }

        this.turtle.orientation %= 360;
        this.turtle.container.rotation = this.turtle.orientation;

        // We cannot update the cache during the 'tween'
        if (!this.turtle.blinking()) {
            this.turtle.updateCache();
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

        if (!this._fillState) {
            this.turtle.ctx.lineWidth = this.stroke;
            this.turtle.ctx.lineCap = "round";
            this.turtle.ctx.beginPath();
            this.turtle.ctx.moveTo(this.turtle.container.x, this.turtle.container.y);
        }

        // Get old turtle point
        const ox = this.turtles.screenX2turtleX(this.turtle.container.x);
        const oy = this.turtles.screenY2turtleY(this.turtle.container.y);

        // New turtle point
        const nx = Number(x);
        const ny = Number(y);

        this._move(ox, oy, nx, ny, true);
        this.activity.refreshCanvas();
    }

    /**
     * Sets the direction of where the turtle is heading by rotating bitmap.
     *
     * @param degrees - degrees turned to set the 'heading' of turtle
     */
    doSetHeading(degrees) {
        this.turtle.orientation = Number(degrees);
        while (this.turtle.orientation < 0) {
            this.turtle.orientation += 360;
        }

        this.turtle.orientation %= 360;
        this.turtle.container.rotation = this.turtle.orientation;

        // We cannot update the cache during the 'tween'
        if (!this.turtle.blinking()) {
            this.turtle.updateCache();
        }
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

        let adeg = Number(angle),
            factor;
        if (adeg < 0) {
            factor = -1;
            adeg = -adeg;
        } else {
            factor = 1;
        }

        const remainder = adeg % 90;
        const n = Math.floor(adeg / 90);
        for (let i = 0; i < n; i++) {
            this._doArcPart(90 * factor, radius);
        }
        if (remainder > 0) {
            this._doArcPart(remainder * factor, radius);
        }
    }

    /**
     * Sets control point 1 for bezier curve.
     *
     * @param {Number} x - x coordinate
     * @param {Number} y - y coordinate
     */
    setControlPoint1(x, y) {
        /* eslint-disable no-undef */
        tur.painter.cp1x = x;
        tur.painter.cp1y = y;
        /* eslint-enable no-undef */
    }

    /**
     * Sets control point 2 for bezier curve.
     *
     * @param {Number} x - x coordinate
     * @param {Number} y - y coordinate
     */
    setControlPoint2(x, y) {
        /* eslint-disable no-undef */
        tur.painter.cp2x = x;
        tur.painter.cp2y = y;
        /* eslint-enable no-undef */
    }

    /**
     * Draws a bezier curve.
     *
     * @param x2 - the x-coordinate of the ending point
     * @param y2 - the y-coordinate of the ending point
     */
    doBezier(x2, y2) {
        const cp1x = this.cp1x;
        const cp1y = this.cp1y;
        const cp2x = this.cp2x;
        const cp2y = this.cp2y;

        // FIXME: Add SVG output

        let fx, fy;
        let ax, ay, bx, by, cx, cy, dx, dy;
        let dxi, dyi, dxf, dyf;

        const turtles = this.turtles;
        const turtlesScale = turtles.scale;

        if (this._penDown && this._hollowState) {
            // Convert from turtle coordinates to screen coordinates
            /* eslint-disable no-unused-vars */
            fx = turtles.turtleX2screenX(x2);
            fy = turtles.turtleY2screenY(y2);
            const ix = turtles.turtleX2screenX(this.turtle.x);
            const iy = turtles.turtleY2screenY(this.turtle.y);
            const cx1 = turtles.turtleX2screenX(cp1x);
            const cy1 = turtles.turtleY2screenY(cp1y);
            const cx2 = turtles.turtleX2screenX(cp2x);
            const cy2 = turtles.turtleY2screenY(cp2y);

            // Close the current SVG path
            this.closeSVG();

            // Save the current stroke width
            const savedStroke = this.stroke;
            this.stroke = 1;
            this.turtle.ctx.lineWidth = this.stroke;
            this.turtle.ctx.lineCap = "round";

            // Draw a hollow line
            const step = savedStroke < 3 ? 0.5 : (savedStroke - 2) / 2;
            const steps = Math.max(Math.floor(savedStroke, 1));

            /* We need both the initial and final headings */
            // The initial heading is the angle between (cp1x, cp1y) and (this.turtle.x, this.turtle.y)
            let degreesInitial = Math.atan2(cp1x - this.turtle.x, cp1y - this.turtle.y);
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
            const capAngleRadiansInitial = ((degreesInitial - 90) * Math.PI) / 180.0;
            dxi = step * Math.sin(capAngleRadiansInitial);
            dyi = -step * Math.cos(capAngleRadiansInitial);
            const capAngleRadiansFinal = ((degreesFinal - 90) * Math.PI) / 180.0;
            dxf = step * Math.sin(capAngleRadiansFinal);
            dyf = -step * Math.cos(capAngleRadiansFinal);

            // The four 'corners'
            ax = ix - dxi;
            ay = iy - dyi;
            const axScaled = ax * turtlesScale;
            const ayScaled = ay * turtlesScale;
            bx = fx - dxf;
            by = fy - dyf;
            const bxScaled = bx * turtlesScale;
            const byScaled = by * turtlesScale;
            cx = fx + dxf;
            cy = fy + dyf;
            const cxScaled = cx * turtlesScale;
            const cyScaled = cy * turtlesScale;
            dx = ix + dxi;
            dy = iy + dyi;
            const dxScaled = dx * turtlesScale;
            const dyScaled = dy * turtlesScale;

            // Control points scaled for SVG output
            // const cx1Scaled = (cx1 + dxi) * turtlesScale;
            // const cy1Scaled = (cy1 + dyi) * turtlesScale;
            // const cx2Scaled = (cx2 + dxf) * turtlesScale;
            // const cy2Scaled = (cy2 + dyf) * turtlesScale;

            this._svgPath = true;

            // Initial arc
            let oAngleRadians = ((180 + degreesInitial) / 180) * Math.PI;
            let arccx = ix;
            let arccy = iy;
            let sa = oAngleRadians - Math.PI;
            let ea = oAngleRadians;
            this.turtle.ctx.arc(arccx, arccy, step, sa, ea, false);
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
            this.turtle.ctx.arc(arccx, arccy, step, sa, ea, false);
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
            const fxScaled = fx * turtlesScale;
            const fyScaled = fy * turtlesScale;

            this.turtle.ctx.stroke();
            this.turtle.ctx.closePath();

            // Restore stroke
            this.stroke = savedStroke;
            this.turtle.ctx.lineWidth = this.stroke;
            this.turtle.ctx.lineCap = "round";
            this.turtle.ctx.moveTo(fx, fy);
            this._svgOutput += "M " + fxScaled + "," + fyScaled + " ";
            this.turtle.x = x2;
            this.turtle.y = y2;
            /* eslint-enable no-unused-vars */
        } else if (this._penDown) {
            this._processColor();
            this.turtle.ctx.lineWidth = this.stroke;
            this.turtle.ctx.lineCap = "round";
            this.turtle.ctx.beginPath();
            this.turtle.ctx.moveTo(this.turtle.container.x, this.turtle.container.y);

            // Convert from turtle coordinates to screen coordinates
            fx = turtles.turtleX2screenX(x2);
            fy = turtles.turtleY2screenY(y2);
            const cx1 = turtles.turtleX2screenX(cp1x);
            const cy1 = turtles.turtleY2screenY(cp1y);
            const cx2 = turtles.turtleX2screenX(cp2x);
            const cy2 = turtles.turtleY2screenY(cp2y);

            this.turtle.ctx.bezierCurveTo(cx1 + dxi, cy1 + dyi, cx2 + dxf, cy2 + dyf, cx, cy);
            this.turtle.ctx.bezierCurveTo(cx2 - dxf, cy2 - dyf, cx1 - dxi, cy1 - dyi, ax, ay);
            this.turtle.ctx.bezierCurveTo(cx1, cy1, cx2, cy2, fx, fy);

            if (!this._svgPath) {
                this._svgPath = true;
                const ix = turtles.turtleX2screenX(this.turtle.x);
                const iy = turtles.turtleY2screenY(this.turtle.y);
                const ixScaled = ix * turtlesScale;
                const iyScaled = iy * turtlesScale;
                this._svgOutput += '<path d="M ' + ixScaled + "," + iyScaled + " ";
            }

            const cx1Scaled = cx1 * turtlesScale;
            const cy1Scaled = cy1 * turtlesScale;
            const cx2Scaled = cx2 * turtlesScale;
            const cy2Scaled = cy2 * turtlesScale;
            const fxScaled = fx * turtlesScale;
            const fyScaled = fy * turtlesScale;

            // Curve to: ControlPointX1, ControlPointY1 >> ControlPointX2, ControlPointY2 >> X, Y
            this._svgOutput +=
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

            this.turtle.x = x2;
            this.turtle.y = y2;
            this.turtle.ctx.stroke();
            if (!this._fillState) {
                this.turtle.ctx.closePath();
            }
        } else {
            this.turtle.x = x2;
            this.turtle.y = y2;
            fx = turtles.turtleX2screenX(x2);
            fy = turtles.turtleY2screenY(y2);
        }

        // Update turtle position on screen.
        this.turtle.container.x = fx;
        this.turtle.container.y = fy;

        // The new heading is the angle between (cp2x, cp2y) and (x2, y2)
        let degrees = Math.atan2(x2 - cp2x, y2 - cp2y);
        degrees = (180 * degrees) / Math.PI;
        this.doSetHeading(degrees);
    }

    /**
     * Clears the media layer
     */
    doClearMedia() {
        // Clear all media
        for (let i = 0; i < this.turtle.media.length; i++) {
            // Could be in the image Container or the Stage
            this.turtle.imageContainer.removeChild(this.turtle.media[i]);
            this.turtles.stage.removeChild(this.turtle.media[i]);
            delete this.turtle.media[i];
        }

        this.turtle.media = [];
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
        const turtles = this.turtles;

        // Reset turtle
        if (resetPosition) {
            this.turtle.x = 0;
            this.turtle.y = 0;
            this.turtle.orientation = 0.0;
            turtles.gx = this.turtle.ctx.canvas.width;
            turtles.gy = this.turtle.ctx.canvas.height;
        }

        const i = turtles.turtleList.indexOf(this) % 10;
        if (resetPen) {
            this.color = i * 10;
            this.value = DEFAULTVALUE;
            this.chroma = DEFAULTCHROMA;
            this.stroke = DEFAULTSTROKE;
            this._font = DEFAULTFONT;
        }

        this.turtle.container.x = turtles.turtleX2screenX(this.turtle.x);
        this.turtle.container.y = turtles.turtleY2screenY(this.turtle.y);

        if (resetSkin) {
            if (this.turtle.name !== _("start")) {
                this.turtle.rename(_("start"));
            }

            if (this.turtle.skinChanged) {
                let artwork = TURTLESVG;
                artwork = artwork
                    .replace(/fill_color/g, FILLCOLORS[i])
                    .replace(/stroke_color/g, STROKECOLORS[i]);

                this.turtle.doTurtleShell(
                    55,
                    "data:image/svg+xml;base64," +
                        window.btoa(unescape(encodeURIComponent(artwork)))
                );
                this.turtle.skinChanged = false;
            }
        }

        this.turtle.container.rotation = this.turtle.orientation;
        this.turtle.bitmap.rotation = this.turtle.orientation;
        this.turtle.updateCache();

        this.doClearMedia();
        /*
        // Clear all media
        for (let i = 0; i < this.turtle.media.length; i++) {
            // Could be in the image Container or the Stage
            this.turtle.imageContainer.removeChild(this.turtle.media[i]);
            turtles.stage.removeChild(this.turtle.media[i]);
            delete this.turtle.media[i];
        }

        this.turtle.media = [];
        */
        // Clear all graphics
        this._penDown = true;
        this._fillState = false;
        this._hollowState = false;

        this._canvasColor = getMunsellColor(this.color, this.value, this.chroma);
        if (this._canvasColor[0] === "#") {
            this._canvasColor = hex2rgb(this._canvasColor.split("#")[1]);
        }

        this._svgOutput = "";
        this._svgPath = false;
        this.turtle.penstrokes.image = null;
        this.turtle.ctx.beginPath();
        this.turtle.ctx.clearRect(0, 0, this.turtle.canvas.width, this.turtle.canvas.height);
        if (turtles.c1ctx != null) {
            turtles.c1ctx.beginPath();
            turtles.c1ctx.clearRect(
                0,
                0,
                3 * this.turtle.canvas.width,
                3 * this.turtle.canvas.height
            );
        }
        this.turtle.penstrokes.image = this.turtle.canvas;
        this.activity.refreshCanvas();
    }

    /**
     * As the canvas scrolls the turtle is drawn under.
     *
     * @param dx - change in x coordinate
     * @param dy - change in y coordinate
     */
    doScrollXY(dx, dy) {
        // FIXME: how big?

        const imgData = this.turtle.ctx.getImageData(
            0,
            0,
            this.turtle.ctx.canvas.width,
            this.turtle.ctx.canvas.height
        );

        const turtles = this.turtles;
        if (turtles.canvas1 == null) {
            turtles.gx = this.turtle.ctx.canvas.width;
            turtles.gy = this.turtle.ctx.canvas.height;
            turtles.canvas1 = document.createElement("canvas");
            turtles.canvas1.width = 3 * this.turtle.ctx.canvas.width;
            turtles.canvas1.height = 3 * this.turtle.ctx.canvas.height;
            turtles.c1ctx = turtles.canvas1.getContext("2d");
            turtles.c1ctx.rect(
                0,
                0,
                3 * this.turtle.ctx.canvas.width,
                3 * this.turtle.ctx.canvas.height
            );
            turtles.c1ctx.fillStyle = "#F9F9F9";
            turtles.c1ctx.fill();
        }

        turtles.c1ctx.putImageData(imgData, turtles.gx, turtles.gy);

        turtles.gy -= dy;
        turtles.gx -= dx;
        turtles.gx =
            2 * this.turtle.ctx.canvas.width > turtles.gx
                ? turtles.gx
                : 2 * this.turtle.ctx.canvas.width;
        turtles.gx = 0 > turtles.gx ? 0 : turtles.gx;
        turtles.gy =
            2 * this.turtle.ctx.canvas.height > turtles.gy
                ? turtles.gy
                : 2 * this.turtle.ctx.canvas.height;
        turtles.gy = 0 > turtles.gy ? 0 : turtles.gy;

        const newImgData = turtles.c1ctx.getImageData(
            turtles.gx,
            turtles.gy,
            this.turtle.ctx.canvas.width,
            this.turtle.ctx.canvas.height
        );

        this.turtle.ctx.putImageData(newImgData, 0, 0);

        // Draw under the turtle as the canvas moves
        for (let t = 0; t < turtles.turtleList.length; t++) {
            if (turtles.turtleList[t].inTrash) {
                continue;
            }

            if (turtles.turtleList[t].painter.penState) {
                turtles.turtleList[t].painter._processColor();
                this.turtle.ctx.lineWidth = turtles.turtleList[t].painter.stroke;
                this.turtle.ctx.lineCap = "round";
                this.turtle.ctx.beginPath();
                this.turtle.ctx.moveTo(
                    turtles.turtleList[t].container.x + dx,
                    turtles.turtleList[t].container.y + dy
                );
                this.turtle.ctx.lineTo(
                    turtles.turtleList[t].container.x,
                    turtles.turtleList[t].container.y
                );
                this.turtle.ctx.stroke();
                this.turtle.ctx.closePath();
            }
        }

        this.activity.refreshCanvas();
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
        const results = getcolor(this.color);
        this.canvasValue = results[0];
        this.value = results[0];
        this.canvasChroma = results[1];
        this.chroma = results[1];
        this._canvasColor = results[2];
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
        this._canvasColor = getMunsellColor(this.color, this.value, this.chroma);
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
        this._canvasColor = getMunsellColor(this.color, this.value, this.chroma);
        this._processColor();
    }

    /**
     * Sets hue for canvas.
     *
     * @param hue - hue hex code
     */
    doSetHue(hue) {
        this.closeSVG();
        this.color = Number(hue);
        this._canvasColor = getMunsellColor(this.color, this.value, this.chroma);
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
     * Sets pen size/thickness.
     *
     * @param size - pen size which is assigned to pen stroke
     */
    doSetPensize(size) {
        this.closeSVG();
        this.stroke = size;
        this.turtle.ctx.lineWidth = this.stroke;
    }

    /**
     * Toggles penState: puts pen 'up'.
     */
    doPenUp() {
        this.closeSVG();
        this._penDown = false;
    }

    /**
     * Toggles penState: puts pen 'down'.
     */
    doPenDown() {
        this._penDown = true;
    }

    /**
     * Begins fill path.
     */
    doStartFill() {
        /// Start tracking points here
        this.turtle.ctx.beginPath();
        this._fillState = true;
    }

    /**
     * Ends fill path.
     */
    doEndFill() {
        // Redraw the points with fill enabled
        this.turtle.ctx.fill();
        this.turtle.ctx.closePath();
        this.closeSVG();
        this._fillState = false;
    }

    /**
     * Begins hollow line by toggling hollowState (to true).
     */
    doStartHollowLine() {
        this._hollowState = true; // start tracking points here
    }

    /**
     * Ends hollow line by toggling hollowState (to false).
     */
    doEndHollowLine() {
        this._hollowState = false; // redraw the points with fill enabled
    }

    /**
     * Sets font.
     *
     * @param font - font object
     */
    doSetFont(font) {
        this._font = font;
        this.turtle.updateCache();
    }
}
