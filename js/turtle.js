// Copyright (c) 2014-2019 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// Turtles
const DEFAULTCOLOR = 0;
const DEFAULTVALUE = 50;
const DEFAULTCHROMA = 100;
const DEFAULTSTROKE = 5;
const DEFAULTFONT = "sans-serif";
// What is the scale factor when stage is shrunk?
const SCALEFACTOR = 4;

// Turtle sprite
const TURTLEBASEPATH = "images/";

function Turtle(name, turtles, drum) {
    this.name = name;
    this.turtles = turtles;
    this.drum = drum;

    if (drum) {
        console.debug("turtle " + name + " is a drum.");
    }
    // Is the turtle running?
    this.running = false;

    // In the trash?
    this.trash = false;

    // Things used for drawing the turtle.
    this.container = null;
    this.x = 0;
    this.y = 0;
    this.bitmap = null;
    this.skinChanged = false; // Should we reskin the turtle on clear?
    this.shellSize = 55;
    this.blinkFinished = true;
    this.isSkinChanged = false;
    this._sizeInUse = 1;
    this._isSkinChanged = false;
    this.beforeBlinkSize = null;

    // Which start block is assocated with this turtle?
    this.startBlock = null;
    this.decorationBitmap = null; // Start block decoration.

    // Queue of blocks this turtle is executing.
    this.queue = [];

    // Listeners
    this.listeners = {};

    // Things used for what the turtle draws.
    this.penstrokes = null;
    this.imageContainer = null;
    this.svgOutput = "";
    // Are we currently drawing a path?
    this.svgPath = false;
    this.color = DEFAULTCOLOR;
    this.value = DEFAULTVALUE;
    this.chroma = DEFAULTCHROMA;
    this.stroke = DEFAULTSTROKE;
    this.canvasColor = "rgba(255,0,49,1)"; // '#ff0031';
    this.canvasAlpha = 1.0;
    this.orientation = 0;
    this.fillState = false;
    this.hollowState = false;
    this.penState = true;
    this.font = DEFAULTFONT;
    this.media = []; // Media (text, images) we need to remove on clear.
    var canvas = document.getElementById("overlayCanvas");
    var ctx = canvas.getContext("2d");
    console.debug(ctx.canvas.width + " x " + ctx.canvas.height);

    /**
     *  As the canvas scrolls the turtle is drawn under
     *
     * @param  dx - change in x coordinate
     * @param  dy - change in y coordinate
     */
    this.doScrollXY = function (dx, dy) {
        // FIXME: how big?

        var imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);

        if (this.turtles.canvas1 == null) {
            this.turtles.gx = ctx.canvas.width;
            this.turtles.gy = ctx.canvas.height;

            this.turtles.canvas1 = document.createElement("canvas");
            this.turtles.canvas1.width = 3 * ctx.canvas.width;
            this.turtles.canvas1.height = 3 * ctx.canvas.height;
            this.turtles.c1ctx = this.turtles.canvas1.getContext("2d");
            this.turtles.c1ctx.rect(0, 0, 3 * ctx.canvas.width, 3 * ctx.canvas.height);
            this.turtles.c1ctx.fillStyle = "#F9F9F9";
            this.turtles.c1ctx.fill();
        }

        this.turtles.c1ctx.putImageData(imgData, this.turtles.gx, this.turtles.gy);


        this.turtles.gy -= dy;
        this.turtles.gx -= dx;
        this.turtles.gx = 2 * ctx.canvas.width > this.turtles.gx ? this.turtles.gx : 2 * ctx.canvas.width;
        this.turtles.gx = 0 > this.turtles.gx ? 0 : this.turtles.gx;
        this.turtles.gy = 2 * ctx.canvas.height > this.turtles.gy ? this.turtles.gy : 2 * ctx.canvas.height;
        this.turtles.gy = 0 > this.turtles.gy ? 0 : this.turtles.gy;

        var newImgData = this.turtles.c1ctx.getImageData(this.turtles.gx, this.turtles.gy, ctx.canvas.width, ctx.canvas.height)

        ctx.putImageData(newImgData, 0, 0);

        // Draw under the turtle as the canvas moves.
        for (var t = 0; t < this.turtles.turtleList.length; t++) {
            if (this.turtles.turtleList[t].trash) {
                continue;
            }

            if (this.turtles.turtleList[t].penState) {
                this.turtles.turtleList[t].processColor();
                ctx.lineWidth = this.turtles.turtleList[t].stroke;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(this.turtles.turtleList[t].container.x + dx, this.turtles.turtleList[t].container.y + dy);
                ctx.lineTo(this.turtles.turtleList[t].container.x, this.turtles.turtleList[t].container.y);
                ctx.stroke();
                ctx.closePath();
            }
        }

        this.turtles.refreshCanvas();
    };

    /**
     *  Simulate an arc with line segments since Tinkercad cannot
     *
     * @param  nsteps - turtle's steps
     * @param  cx - x coordinate of center
     * @param  cy - y coordinate of center
     * @param  radius - radius of arc
     * @param  sa - start angle
     * @param  ea - end angle
     *
     */
    this._svgArc = function(nsteps, cx, cy, radius, sa, ea) {
        // import SVG arcs reliably.
        var a = sa;
        if (ea == null) {
            var da = Math.PI / nsteps;
        } else {
            var da = (ea - sa) / nsteps;
        }
        for (var i = 0; i < nsteps; i++) {
            var nx = cx + radius * Math.cos(a);
            var ny = cy + radius * Math.sin(a);
            this.svgOutput += nx + "," + ny + " ";
            a += da;
        }
    };

    /**
     *  Draws a bezier curve
     *
     * @param  cp1x - the x-coordinate of the first bezier control point
     * @param  cp1y - the y-coordinate of the first bezier control point
     * @param  cp2x - the x-coordinate of the second bezier control point
     * @param  cp2y - the y-coordinate of the second bezier control point
     * @param  x2 - the x-coordinate of the ending point
     * @param  y2 - the y-coordinate of the ending point
     *
     */
    this.doBezier = function(cp1x, cp1y, cp2x, cp2y, x2, y2) {
        // FIXME: Add SVG output
        if (this.penState && this.hollowState) {
            // Convert from turtle coordinates to screen coordinates.
            var nx = x2;
            var ny = y2;
            var ix = this.turtles.turtleX2screenX(this.x);
            var iy = this.turtles.turtleY2screenY(this.y);
            var fx = this.turtles.turtleX2screenX(x2);
            var fy = this.turtles.turtleY2screenY(y2);
            var cx1 = this.turtles.turtleX2screenX(cp1x);
            var cy1 = this.turtles.turtleY2screenY(cp1y);
            var cx2 = this.turtles.turtleX2screenX(cp2x);
            var cy2 = this.turtles.turtleY2screenY(cp2y);

            // First, we need to close the current SVG path.
            this.closeSVG();

            // Save the current stroke width.
            var savedStroke = this.stroke;
            this.stroke = 1;
            ctx.lineWidth = this.stroke;
            ctx.lineCap = "round";
            // Draw a hollow line.
            if (savedStroke < 3) {
                var step = 0.5;
            } else {
                var step = (savedStroke - 2) / 2;
            }

            steps = Math.max(Math.floor(savedStroke, 1));

            // We need both the initial and final headings.
            // The initial heading is the angle between (cp1x, cp1y) and (this.x, this.y).
            var degreesInitial = Math.atan2(cp1x - this.x, cp1y - this.y);
            degreesInitial = (180 * degreesInitial) / Math.PI;
            if (degreesInitial < 0) {
                degreesInitial += 360;
            }
            // The final heading is the angle between (cp2x, cp2y) and (fx, fy).
            var degreesFinal = Math.atan2(nx - cp2x, ny - cp2y);
            degreesFinal = (180 * degreesFinal) / Math.PI;
            if (degreesFinal < 0) {
                degreesFinal += 360;
            }

            // We also need to calculate the deltas for the 'caps' at each end.
            var capAngleRadiansInitial =
                ((degreesInitial - 90) * Math.PI) / 180.0;
            var dxi = step * Math.sin(capAngleRadiansInitial);
            var dyi = -step * Math.cos(capAngleRadiansInitial);
            var capAngleRadiansFinal = ((degreesFinal - 90) * Math.PI) / 180.0;
            var dxf = step * Math.sin(capAngleRadiansFinal);
            var dyf = -step * Math.cos(capAngleRadiansFinal);

            // The four 'corners'
            var ax = ix - dxi;
            var ay = iy - dyi;
            var axScaled = ax * this.turtles.scale;
            var ayScaled = ay * this.turtles.scale;
            var bx = fx - dxf;
            var by = fy - dyf;
            var bxScaled = bx * this.turtles.scale;
            var byScaled = by * this.turtles.scale;
            var cx = fx + dxf;
            var cy = fy + dyf;
            var cxScaled = cx * this.turtles.scale;
            var cyScaled = cy * this.turtles.scale;
            var dx = ix + dxi;
            var dy = iy + dyi;
            var dxScaled = dx * this.turtles.scale;
            var dyScaled = dy * this.turtles.scale;

            // Control points scaled for SVG output
            var cx1Scaled = (cx1 + dxi) * this.turtles.scale;
            var cy1Scaled = (cy1 + dyi) * this.turtles.scale;
            var cx2Scaled = (cx2 + dxf) * this.turtles.scale;
            var cy2Scaled = (cy2 + dyf) * this.turtles.scale;

            this.svgPath = true;

            // Initial arc
            var oAngleRadians = ((180 + degreesInitial) / 180) * Math.PI;
            var arccx = ix;
            var arccy = iy;
            var sa = oAngleRadians - Math.PI;
            var ea = oAngleRadians;
            ctx.arc(arccx, arccy, step, sa, ea, false);
            this._svgArc(
                steps,
                arccx * this.turtles.scale,
                arccy * this.turtles.scale,
                step * this.turtles.scale,
                sa,
                ea
            );

            // Final arc
            var oAngleRadians = (degreesFinal / 180) * Math.PI;
            var arccx = fx;
            var arccy = fy;
            var sa = oAngleRadians - Math.PI;
            var ea = oAngleRadians;
            ctx.arc(arccx, arccy, step, sa, ea, false);
            this._svgArc(
                steps,
                arccx * this.turtles.scale,
                arccy * this.turtles.scale,
                step * this.turtles.scale,
                sa,
                ea
            );

            var fx = this.turtles.turtleX2screenX(x2);
            var fy = this.turtles.turtleY2screenY(y2);
            var fxScaled = fx * this.turtles.scale;
            var fyScaled = fy * this.turtles.scale;

            ctx.stroke();
            ctx.closePath();
            // restore stroke.
            this.stroke = savedStroke;
            ctx.lineWidth = this.stroke;
            ctx.lineCap = "round";
            ctx.moveTo(fx, fy);
            this.svgOutput += "M " + fxScaled + "," + fyScaled + " ";
            this.x = x2;
            this.y = y2;
        } else if (this.penState) {
            this.processColor();
            ctx.lineWidth = this.stroke;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(this.container.x, this.container.y);

            // Convert from turtle coordinates to screen coordinates.
            var fx = this.turtles.turtleX2screenX(x2);
            var fy = this.turtles.turtleY2screenY(y2);
            var cx1 = this.turtles.turtleX2screenX(cp1x);
            var cy1 = this.turtles.turtleY2screenY(cp1y);
            var cx2 = this.turtles.turtleX2screenX(cp2x);
            var cy2 = this.turtles.turtleY2screenY(cp2y);

            ctx.bezierCurveTo(
                cx1 + dxi,
                cy1 + dyi,
                cx2 + dxf,
                cy2 + dyf,
                cx,
                cy
            );
            ctx.bezierCurveTo(
                cx2 - dxf,
                cy2 - dyf,
                cx1 - dxi,
                cy1 - dyi,
                ax,
                ay
            );
            ctx.bezierCurveTo(cx1, cy1, cx2, cy2, fx, fy);

            if (!this.svgPath) {
                this.svgPath = true;
                var ix = this.turtles.turtleX2screenX(this.x);
                var iy = this.turtles.turtleY2screenY(this.y);
                var ixScaled = ix * this.turtles.scale;
                var iyScaled = iy * this.turtles.scale;
                this.svgOutput +=
                    '<path d="M ' + ixScaled + "," + iyScaled + " ";
            }

            var cx1Scaled = cx1 * this.turtles.scale;
            var cy1Scaled = cy1 * this.turtles.scale;
            var cx2Scaled = cx2 * this.turtles.scale;
            var cy2Scaled = cy2 * this.turtles.scale;
            var fxScaled = fx * this.turtles.scale;
            var fyScaled = fy * this.turtles.scale;

            //Curve to: ControlPointX1, ControlPointY1 >> ControlPointX2, ControlPointY2 >> X, Y
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
            ctx.stroke();
            if (!this.fillState) {
                ctx.closePath();
            }
        } else {
            this.x = x2;
            this.y = y2;
            var fx = this.turtles.turtleX2screenX(x2);
            var fy = this.turtles.turtleY2screenY(y2);
        }

        // Update turtle position on screen.
        this.container.x = fx;
        this.container.y = fy;

        // The new heading is the angle between (cp2x, cp2y) and (nx, ny).
        var degrees = Math.atan2(nx - cp2x, ny - cp2y);
        degrees = (180 * degrees) / Math.PI;
        this.doSetHeading(degrees);
    };

    /**
     *  Moves turtle
     *
     * @param  ox - the old x-coordinate of the turtle
     * @param  oy - the old y-coordinate of the turtle
     * @param  x - on screen x coordinate
     * @param  y - on screen y coordinate
     * @param  invert - boolean value regarding whether coordinates are inverted or not
     *
     */
    this.move = function(ox, oy, x, y, invert) {
        if (invert) {
            ox = this.turtles.turtleX2screenX(ox);
            oy = this.turtles.turtleY2screenY(oy);
            nx = this.turtles.turtleX2screenX(x);
            ny = this.turtles.turtleY2screenY(y);
        } else {
            nx = x;
            ny = y;
        }

        // Draw a line if the pen is down.
        if (this.penState && this.hollowState) {
            // First, we need to close the current SVG path.
            this.closeSVG();
            this.svgPath = true;
            // Save the current stroke width.
            var savedStroke = this.stroke;
            this.stroke = 1;
            ctx.lineWidth = this.stroke;
            ctx.lineCap = "round";
            // Draw a hollow line.
            if (savedStroke < 3) {
                var step = 0.5;
            } else {
                var step = (savedStroke - 2) / 2;
            }

            var capAngleRadians = ((this.orientation - 90) * Math.PI) / 180.0;
            var dx = step * Math.sin(capAngleRadians);
            var dy = -step * Math.cos(capAngleRadians);

            ctx.moveTo(ox + dx, oy + dy);
            var oxScaled = (ox + dx) * this.turtles.scale;
            var oyScaled = (oy + dy) * this.turtles.scale;
            this.svgOutput += '<path d="M ' + oxScaled + "," + oyScaled + " ";

            ctx.lineTo(nx + dx, ny + dy);
            var nxScaled = (nx + dx) * this.turtles.scale;
            var nyScaled = (ny + dy) * this.turtles.scale;
            this.svgOutput += nxScaled + "," + nyScaled + " ";

            var capAngleRadians = ((this.orientation + 90) * Math.PI) / 180.0;
            var dx = step * Math.sin(capAngleRadians);
            var dy = -step * Math.cos(capAngleRadians);

            var oAngleRadians = (this.orientation / 180) * Math.PI;
            var cx = nx;
            var cy = ny;
            var sa = oAngleRadians - Math.PI;
            var ea = oAngleRadians;
            ctx.arc(cx, cy, step, sa, ea, false);

            var nxScaled = (nx + dx) * this.turtles.scale;
            var nyScaled = (ny + dy) * this.turtles.scale;

            var radiusScaled = step * this.turtles.scale;

            // Simulate an arc with line segments since Tinkercad
            // cannot import SVG arcs reliably.
            // Replaces:
            // this.svgOutput += 'A ' + radiusScaled + ',' + radiusScaled + ' 0 0 1 ' + nxScaled + ',' + nyScaled + ' ';
            // this.svgOutput += 'M ' + nxScaled + ',' + nyScaled + ' ';

            steps = Math.max(Math.floor(savedStroke, 1));
            this._svgArc(
                steps,
                cx * this.turtles.scale,
                cy * this.turtles.scale,
                radiusScaled,
                sa
            );
            this.svgOutput += nxScaled + "," + nyScaled + " ";

            ctx.lineTo(ox + dx, oy + dy);
            var nxScaled = (ox + dx) * this.turtles.scale;
            var nyScaled = (oy + dy) * this.turtles.scale;
            this.svgOutput += nxScaled + "," + nyScaled + " ";

            var capAngleRadians = ((this.orientation - 90) * Math.PI) / 180.0;
            var dx = step * Math.sin(capAngleRadians);
            var dy = -step * Math.cos(capAngleRadians);

            var oAngleRadians = ((this.orientation + 180) / 180) * Math.PI;
            var cx = ox;
            var cy = oy;
            var sa = oAngleRadians - Math.PI;
            var ea = oAngleRadians;
            ctx.arc(cx, cy, step, sa, ea, false);

            var nxScaled = (ox + dx) * this.turtles.scale;
            var nyScaled = (oy + dy) * this.turtles.scale;

            var radiusScaled = step * this.turtles.scale;
            this._svgArc(
                steps,
                cx * this.turtles.scale,
                cy * this.turtles.scale,
                radiusScaled,
                sa
            );
            this.svgOutput += nxScaled + "," + nyScaled + " ";

            this.closeSVG();

            ctx.stroke();
            ctx.closePath();
            // restore stroke.
            this.stroke = savedStroke;
            ctx.lineWidth = this.stroke;
            ctx.lineCap = "round";
            ctx.moveTo(nx, ny);
        } else if (this.penState) {
            ctx.lineTo(nx, ny);
            if (!this.svgPath) {
                this.svgPath = true;
                var oxScaled = ox * this.turtles.scale;
                var oyScaled = oy * this.turtles.scale;
                this.svgOutput +=
                    '<path d="M ' + oxScaled + "," + oyScaled + " ";
            }
            var nxScaled = nx * this.turtles.scale;
            var nyScaled = ny * this.turtles.scale;
            this.svgOutput += nxScaled + "," + nyScaled + " ";
            ctx.stroke();
            if (!this.fillState) {
                ctx.closePath();
            }
        } else {
            ctx.moveTo(nx, ny);
        }
        this.penstrokes.image = canvas;
        // Update turtle position on screen.
        this.container.x = nx;
        this.container.y = ny;
        if (invert) {
            this.x = x;
            this.y = y;
        } else {
            this.x = this.turtles.screenX2turtleX(x);
            this.y = this.turtles.screenY2turtleY(y);
        }
    };

    /**
     * @return {Number} {the turtle's index in turtleList (the turtle's number)}
     */
    this.getNumber = function() {
        return this.turtles.turtleList.indexOf(this);
    };

    /**
     *  Renames start block
     *
     * @param name - name string which is assigned to startBlock
     *
     */
    this.rename = function(name) {
        this.name = name;

        // Use the name on the label of the start block.
        if (this.startBlock != null) {
            this.startBlock.overrideName = this.name;
            if (this.name === _("start drum")) {
                this.startBlock.collapseText.text = _("drum");
            } else {
                this.startBlock.collapseText.text = this.name;
            }
            this.startBlock.regenerateArtwork(false);
            this.startBlock.value = this.turtles.turtleList.indexOf(this);
        }
    };

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
    this.arc = function(
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
        if (invert) {
            cx = this.turtles.turtleX2screenX(cx);
            cy = this.turtles.turtleY2screenY(cy);
            ox = this.turtles.turtleX2screenX(ox);
            oy = this.turtles.turtleY2screenY(oy);
            nx = this.turtles.turtleX2screenX(x);
            ny = this.turtles.turtleY2screenY(y);
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
            ctx.lineWidth = this.stroke;
            ctx.lineCap = "round";

            // Draw a hollow line
            let step = savedStroke < 3 ? 0.5 : (savedStroke - 2) / 2;

            let capAngleRadians = ((this.orientation + 90) * Math.PI) / 180.0;
            let dx = step * Math.sin(capAngleRadians);
            let dy = -step * Math.cos(capAngleRadians);

            let oxScaled, oyScaled;
            if (anticlockwise) {
                ctx.moveTo(ox + dx, oy + dy);
                oxScaled = (ox + dx) * this.turtles.scale;
                oyScaled = (oy + dy) * this.turtles.scale;
            } else {
                ctx.moveTo(ox - dx, oy - dy);
                oxScaled = (ox - dx) * this.turtles.scale;
                oyScaled = (oy - dy) * this.turtles.scale;
            }
            this.svgOutput += '<path d="M ' + oxScaled + "," + oyScaled + " ";

            ctx.arc(cx, cy, radius + step, sa, ea, anticlockwise);
            nsteps = Math.max(Math.floor((radius * Math.abs(sa - ea)) / 2), 2);
            steps = Math.max(Math.floor(savedStroke, 1));

            this._svgArc(
                nsteps,
                cx * this.turtles.scale,
                cy * this.turtles.scale,
                (radius + step) * this.turtles.scale,
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
            ctx.arc(cx1, cy1, step, sa1, ea1, anticlockwise);
            this._svgArc(
                steps,
                cx1 * this.turtles.scale,
                cy1 * this.turtles.scale,
                step * this.turtles.scale,
                sa1,
                ea1
            );
            ctx.arc(cx, cy, radius - step, ea, sa, !anticlockwise);
            this._svgArc(
                nsteps,
                cx * this.turtles.scale,
                cy * this.turtles.scale,
                (radius - step) * this.turtles.scale,
                ea,
                sa
            );
            let cx2 = ox;
            let cy2 = oy;
            let sa2 = sa - Math.PI;
            let ea2 = sa;
            ctx.arc(cx2, cy2, step, sa2, ea2, anticlockwise);
            this._svgArc(
                steps,
                cx2 * this.turtles.scale,
                cy2 * this.turtles.scale,
                step * this.turtles.scale,
                sa2,
                ea2
            );
            this.closeSVG();

            ctx.stroke();
            ctx.closePath();

            // Restore stroke
            this.stroke = savedStroke;
            ctx.lineWidth = this.stroke;
            ctx.lineCap = "round";
            ctx.moveTo(nx, ny);
        } else if (this.penState) {
            ctx.arc(cx, cy, radius, sa, ea, anticlockwise);
            if (!this.svgPath) {
                this.svgPath = true;
                let oxScaled = ox * this.turtles.scale;
                let oyScaled = oy * this.turtles.scale;
                this.svgOutput +=
                    '<path d="M ' + oxScaled + "," + oyScaled + " ";
            }

            let sweep = anticlockwise ? 0 : 1;

            let nxScaled = nx * this.turtles.scale;
            let nyScaled = ny * this.turtles.scale;
            let radiusScaled = radius * this.turtles.scale;
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
            ctx.stroke();
            if (!this.fillState) {
                ctx.closePath();
            }
        } else {
            ctx.moveTo(nx, ny);
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
    };

    /**
     * Takes in turtle functions to reset the turtle position, pen, skin, media.
     *
     * @param resetPen - boolean value regarding whether the pen's properties (color, value etc) should be reset
     * @param resetSkin - boolean value regarding whether the turtle's 'skin' (color, blockname etc) should be reset
     * @param resetPosition - boolean value regarding whether the turtle's position (orientation, x, y etc) should be reset
     */
    this.doClear = function (resetPen, resetSkin, resetPosition) {
        // Reset turtle
        if (resetPosition) {
            this.x = 0;
            this.y = 0;
            this.orientation = 0.0;
            this.turtles.gx = ctx.canvas.width;
            this.turtles.gy = ctx.canvas.height;
        }

        if (resetPen) {
            let i = this.turtles.turtleList.indexOf(this) % 10;
            this.color = i * 10;
            this.value = DEFAULTVALUE;
            this.chroma = DEFAULTCHROMA;
            this.stroke = DEFAULTSTROKE;
            this.font = DEFAULTFONT;
        }

        this.container.x = this.turtles.turtleX2screenX(this.x);
        this.container.y = this.turtles.turtleY2screenY(this.y);

        if (resetSkin) {
            if (this.drum) {
                if (this.name !== _("start drum")) {
                    this.rename(_("start drum"));
                }
            } else {
                if (this.name !== _("start")) {
                    this.rename(_("start"));
                }
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
        this.updateCache();

        // Clear all media
        for (let i = 0; i < this.media.length; i++) {
            // Could be in the image Container or the Stage
            this.imageContainer.removeChild(this.media[i]);
            this.turtles.stage.removeChild(this.media[i]);
            delete this.media[i];
        }

        this.media = [];

        // Clear all graphics
        this.penState = true;
        this.fillState = false;
        this.hollowState = false;

        this.canvasColor = getMunsellColor(this.color, this.value, this.chroma);
        if (this.canvasColor[0] === "#") {
            this.canvasColor = hex2rgb(this.canvasColor.split("#")[1]);
        }

        this.svgOutput = "";
        this.svgPath = false;
        this.penstrokes.image = null;
        ctx.beginPath();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (this.turtles.c1ctx != null) {
            this.turtles.c1ctx.beginPath();
            this.turtles.c1ctx.clearRect(0, 0, 3 * canvas.width, 3 * canvas.height);
        }
        this.penstrokes.image = canvas;
        this.turtles.refreshCanvas();
    };

    /**
     * Removes penstrokes and clears canvas.
     */
    this.clearPenStrokes = function () {
        this.penState = true;
        this.fillState = false;
        this.hollowState = false;

        this.canvasColor = getMunsellColor(this.color, this.value, this.chroma);
        if (this.canvasColor[0] === "#") {
            this.canvasColor = hex2rgb(this.canvasColor.split("#")[1]);
        }

        ctx.beginPath();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.processColor();
        ctx.lineWidth = this.stroke;
        ctx.lineCap = "round";
        ctx.beginPath();
        this.penstrokes.image = canvas;
        this.svgOutput = "";
        this.svgPath = false;
        this.turtles.refreshCanvas();
    };

    /**
    * Checks if x, y is out of ctx.
    *
    * @param x - on screen x coordinate
    * @param y - on screen y coordinate
    * @param w - width 
    * @param h - height
    */
    this.outOfBounds = function (x, y, w, h) {
        return (x > w || x < 0 || y > h || y < 0);
    }

    /**
     * Takes in turtle functions to reset the turtle position, pen, skin, media.
     *
     * @param steps - the number of steps the turtle goes forward by
     */
    this.doForward = function (steps) {
        this.processColor();

        if (!this.fillState) {
            ctx.lineWidth = this.stroke;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(this.container.x, this.container.y);
        }

        // old turtle point
        let ox = this.turtles.screenX2turtleX(this.container.x);
        let oy = this.turtles.screenY2turtleY(this.container.y);

        let angleRadians = (this.orientation * Math.PI) / 180.0;

        // new turtle point
        let nx = ox + Number(steps) * Math.sin(angleRadians);
        let ny = oy + Number(steps) * Math.cos(angleRadians);

        let w = ctx.canvas.width;
        let h = ctx.canvas.height;

        let out =
            this.outOfBounds(
                this.turtles.turtleX2screenX(nx),
                this.turtles.turtleY2screenY(ny),
                w,
                h
            );

        if (!WRAP || !out) {
            this.move(ox, oy, nx, ny, true);
            this.turtles.refreshCanvas();
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
                    ctx.moveTo(this.container.x, this.container.y);
                }
                if (this.container.x < 0) {
                    this.container.x = w;
                    ctx.moveTo(this.container.x, this.container.y);
                }
                if (this.container.y > h) {
                    this.container.y = 0;
                    ctx.moveTo(this.container.x, this.container.y);
                }
                if (this.container.y < 0) {
                    this.container.y = h;
                    ctx.moveTo(this.container.x, this.container.y);
                }

                // Get old turtle point
                oy = this.turtles.screenY2turtleY(this.container.y);
                ox = this.turtles.screenX2turtleX(this.container.x);

                // Increment new turtle point
                nx = ox + xIncrease;
                ny = oy + yIncrease;

                this.move(ox, oy, nx, ny, true)
                this.container.x = this.turtles.turtleX2screenX(nx);
                this.container.y = this.turtles.turtleY2screenY(ny);
                ctx.moveTo(this.container.x, this.container.y);

                steps -= stepUnit;
            }

            this.turtles.refreshCanvas();
        }
    };

    /**
     * Moves turtle to specific point (x, y).
     *
     * @param x - on-screen x coordinate of the point to where the turtle is moved
     * @param y - on-screen y coordinate of the point to where the turtle is moved
     */
    this.doSetXY = function(x, y) {
        this.processColor();

        if (!this.fillState) {
            ctx.lineWidth = this.stroke;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(this.container.x, this.container.y);
        }

        // Get old turtle point
        let ox = this.turtles.screenX2turtleX(this.container.x);
        let oy = this.turtles.screenY2turtleY(this.container.y);

        // New turtle point
        let nx = Number(x);
        let ny = Number(y);

        this.move(ox, oy, nx, ny, true);
        this.turtles.refreshCanvas();
    };

    /**
     * Draws arc with specified angle and radius by
     * breaking up arcs into chucks of 90 degrees or less
     * (in order to have exported SVG properly rendered).
     *
     * @param angle - angle of arc
     * @param radius - radius of arc
     */
    this.doArc = function(angle, radius) {
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
    };

    /**
     * Draws arc parts for eventual combination into one arc.
     *
     * @param angle - angle of arc
     * @param radius - radius of arc
     */
    this._doArcPart = function(angle, radius) {
        this.processColor();

        if (!this.fillState) {
            ctx.lineWidth = this.stroke;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(this.container.x, this.container.y);
        }

        let adeg = Number(angle);
        let angleRadians = (adeg / 180) * Math.PI;
        let oAngleRadians = (this.orientation / 180) * Math.PI;
        let r = Number(radius);

        // Get old turtle point
        let ox = this.turtles.screenX2turtleX(this.container.x);
        let oy = this.turtles.screenY2turtleY(this.container.y);

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

        this.turtles.refreshCanvas();
    };

    /**
     * Adds an image object to the canvas (shows an image).
     *
     * @param size - size of image
     * @param myImage - image path
     */
    this.doShowImage = function(size, myImage) {
        // Is there a JS test for a valid image path?
        if (myImage === null) {
            return;
        }

        let image = new Image();
        let that = this;

        image.onload = function() {
            let bitmap = new createjs.Bitmap(image);
            that.imageContainer.addChild(bitmap);
            that.media.push(bitmap);
            bitmap.scaleX = Number(size) / image.width;
            bitmap.scaleY = bitmap.scaleX;
            bitmap.scale = bitmap.scaleX;
            bitmap.x = that.container.x;
            bitmap.y = that.container.y;
            bitmap.regX = image.width / 2;
            bitmap.regY = image.height / 2;
            bitmap.rotation = that.orientation;
            that.turtles.refreshCanvas();
        };

        image.src = myImage;
    };

    /**
     * Adds an image object from a URL to the canvas (shows an image).
     *
     * @param size - size of image
     * @param myImage - URL of image (image address)
     */
    this.doShowURL = function(size, myURL) {
        if (myURL === null) {
            return;
        }
        let image = new Image();
        image.src = myURL;
        let turtle = this;

        image.onload = function() {
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
    };

    /**
     * Adds an image object to the turtle.
     *
     * @param size - size of image
     * @param myImage - path of image
     */
    this.doTurtleShell = function(size, myImage) {
        if (myImage === null) {
            return;
        }

        let image = new Image();
        image.src = myImage;
        let that = this;
        this.shellSize = Number(size);

        image.onload = function() {
            that.container.removeChild(that.bitmap);
            that.bitmap = new createjs.Bitmap(image);
            that.container.addChild(that.bitmap);
            that.bitmap.scaleX = that.shellSize / image.width;
            that.bitmap.scaleY = that.bitmap.scaleX;
            that.bitmap.scale = that.bitmap.scaleX;
            that.bitmap.x = 0;
            that.bitmap.y = 0;
            that.bitmap.regX = image.width / 2;
            that.bitmap.regY = image.height / 2;
            that.bitmap.rotation = that.orientation;
            that.skinChanged = true;

            that.container.uncache();
            let bounds = that.container.getBounds();
            that.container.cache(
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
            that.container.hitArea = hitArea;

            if (that.startBlock != null) {
                that.startBlock.container.removeChild(that.decorationBitmap);
                that.decorationBitmap = new createjs.Bitmap(myImage);
                that.startBlock.container.addChild(that.decorationBitmap);
                that.decorationBitmap.name = "decoration";

                let width = that.startBlock.width;
                // FIXME: Why is the position off? Does it need a scale factor?
                that.decorationBitmap.x =
                    width - (30 * that.startBlock.protoblock.scale) / 2;
                that.decorationBitmap.y =
                    (20 * that.startBlock.protoblock.scale) / 2;
                that.decorationBitmap.scaleX =
                    ((27.5 / image.width) * that.startBlock.protoblock.scale) /
                    2;
                that.decorationBitmap.scaleY =
                    ((27.5 / image.height) * that.startBlock.protoblock.scale) /
                    2;
                that.decorationBitmap.scale =
                    ((27.5 / image.width) * that.startBlock.protoblock.scale) /
                    2;
                that.startBlock.updateCache();
            }

            that.turtles.refreshCanvas();
        };
    };

    /**
     * Resizes decoration by width and scale.
     *
     * @param scale - resize decoration by scale
     * @param width - resize decoration by width
     */
    this.resizeDecoration = function(scale, width) {
        this.decorationBitmap.x = width - (30 * scale) / 2;
        this.decorationBitmap.y = (35 * scale) / 2;
        this.decorationBitmap.scaleX =
            this.decorationBitmap.scaleY =
            this.decorationBitmap.scale =
                (0.5 * scale) / 2;
    };

    /**
     * Adds a text object to the canvas.
     *
     * @param  size - specifies text size
     * @param  myText - string of text to be displayed
     */
    this.doShowText = function(size, myText) {
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
            this.turtles.stage.addChild(text);
            this.media.push(text);
            text.x = this.container.x;
            text.y = this.container.y + i * size;
            text.rotation = this.orientation;

            let xScaled = text.x * this.turtles.scale;
            let yScaled = text.y * this.turtles.scale;
            let sizeScaled = size * this.turtles.scale;
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

            this.turtles.refreshCanvas();
        }
    };

    /**
     * Turn right and display corresponding turtle graphic by rotating bitmap.
     *
     * @param degrees - degrees for right turn
     */
    this.doRight = function(degrees) {
        this.orientation += Number(degrees);
        while (this.orientation < 0) {
            this.orientation += 360;
        }

        this.orientation %= 360;
        this.container.rotation = this.orientation;

        // We cannot update the cache during the 'tween'
        if (this.blinkFinished) {
            this.updateCache();
        }
    };

    /**
     * Sets the direction of where the turtle is heading by rotating bitmap.
     *
     * @param degrees - degrees turned to set the 'heading' of turtle
     */
    this.doSetHeading = function(degrees) {
        this.orientation = Number(degrees);
        while (this.orientation < 0) {
            this.orientation += 360;
        }

        this.orientation %= 360;
        this.container.rotation = this.orientation;

        // We cannot update the cache during the 'tween'
        if (this.blinkFinished) {
            this.updateCache();
        }
    };

    /**
     * Sets font.
     *
     * @param font - font object
     */
    this.doSetFont = function(font) {
        this.font = font;
        this.updateCache();
    };

    /**
     * Sets color.
     * Color sets hue but also selects maximum chroma.
     *
     * @param color - hex code specifying color
     */
    this.doSetColor = function(color) {
        this.closeSVG();
        this.color = Number(color);
        let results = getcolor(this.color);
        this.canvasValue = results[0];
        this.value = results[0];
        this.canvasChroma = results[1];
        this.chroma = results[1];
        this.canvasColor = results[2];
        this.processColor();
    };

    /**
     * Sets pen's alpha value (transparency).
     *
     * @param alpha - alpha value
     */
    this.doSetPenAlpha = function(alpha) {
        this.canvasAlpha = alpha;
    };

    /**
     * Splits hex code for rgb number values.
     */
    this.processColor = function() {
        if (this.canvasColor[0] === "#") {
            this.canvasColor = hex2rgb(this.canvasColor.split("#")[1]);
        }

        let subrgb = this.canvasColor.substr(0, this.canvasColor.length - 2);
        ctx.strokeStyle = subrgb + this.canvasAlpha + ")";
        ctx.fillStyle = subrgb + this.canvasAlpha + ")";
    };

    /**
     * Sets hue for canvas.
     *
     * @param hue - hue hex code
     */
    this.doSetHue = function(hue) {
        this.closeSVG();
        this.color = Number(hue);
        this.canvasColor =
            getMunsellColor(this.color, this.value, this.chroma);
        this.processColor();
    };

    /**
     * Sets shade for canvas.
     *
     * @param shade - shade hex code
     */
    this.doSetValue = function(shade) {
        this.closeSVG();
        this.value = Number(shade);
        this.canvasColor =
            getMunsellColor(this.color, this.value, this.chroma);
        this.processColor();
    };

    /**
     * Sets chroma for canvas.
     *
     * @param chroma - chroma hex code
     */
    this.doSetChroma = function(chroma) {
        this.closeSVG();
        this.chroma = Number(chroma);
        this.canvasColor =
            getMunsellColor(this.color, this.value, this.chroma);
        this.processColor();
    };

    /**
     * Sets pen size/thickness.
     *
     * @param size - pen size which is assigned to pen stroke
     */
    this.doSetPensize = function(size) {
        this.closeSVG();
        this.stroke = size;
        ctx.lineWidth = this.stroke;
    };

    /**
     * Toggles penState: puts pen 'up'.
     */
    this.doPenUp = function() {
        this.closeSVG();
        this.penState = false;
    };

    /**
     * Toggles penState: puts pen 'down'.
     */
    this.doPenDown = function() {
        this.penState = true;
    };

    /**
     * Begins fill path.
     */
    this.doStartFill = function() {
        /// Start tracking points here
        ctx.beginPath();
        this.fillState = true;
    };

    /**
     * Ends fill path.
     */
    this.doEndFill = function() {
        // Redraw the points with fill enabled
        ctx.fill();
        ctx.closePath();
        this.closeSVG();
        this.fillState = false;
    };

    /**
     * Begins hollow line by toggling hollowState (to true).
     */
    this.doStartHollowLine = function() {
        this.hollowState = true;    // start tracking points here
    };

    /**
     * Ends hollow line by toggling hollowState (to false).
     */
    this.doEndHollowLine = function() {
        this.hollowState = false;   // redraw the points with fill enabled
    };

    /**
     * Closes SVG by changing SVG output to the canvas.
     */
    this.closeSVG = function() {
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
            let strokeScaled = this.stroke * this.turtles.scale;
            this.svgOutput += "stroke-width:" + strokeScaled + 'pt;" />';
            this.svgPath = false;
        }
    };

    /**
     * Internal function for creating cache.
     * Includes workaround for a race condition.
     */
    this.createCache = function() {
        this.bounds = this.container.getBounds();

        if (this.bounds == null) {
            setTimeout(() => {
                this.createCache();
            }, 200);
        } else {
            this.container.cache(
                this.bounds.x,
                this.bounds.y,
                this.bounds.width,
                this.bounds.height
            );
        }
    };

    /**
     * Internal function for updating cache.
     * Includes workaround for a race condition.
     *
     * @async
     */
    this.updateCache = async function() {
        if (this.bounds == null) {
            console.debug(
                "Block container for " + this.name + " not yet ready."
            );
            await delayExecution(300);
            this.updateCache();
        } else {
            this.container.updateCache();
            this.turtles.refreshCanvas();
        }
    };

    /**
     * Stops blinking of turtle if not already finished.
     * Sets timeout to null and blinkFinished boolean to true
     * (if they have not been already changed).
     */
    this.stopBlink = function() {
        if (this._blinkTimeout != null || !this.blinkFinished) {
            clearTimeout(this._blinkTimeout);
            this._blinkTimeout = null;

            this.container.visible = true;
            this.turtles.refreshCanvas();
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
            // this.turtles.refreshCanvas();
            // this.blinkFinished = true;
        }
    };

    /**
     * Causes turtle to blink (toggle turtle's visibility) every 100 ms.
     */
    this.blink = async function(duration, volume) {
        // this._sizeInUse = this.bitmap.scaleX;
        this._blinkTimeout = null;

        // No time to blick for really short notes. (t = 1 / duration)
        if (duration > 16) {
            return;
        }

        this.stopBlink();
        this.blinkFinished = false;

        this.container.visible = false;
        this.turtles.refreshCanvas();
        this._blinkTimeout = await delayExecution(100);
        this.blinkFinished = true;
        this.container.visible = true;
        this.turtles.refreshCanvas();

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

        let that = this;
        this._blinkTimeout = setTimeout(function () {
            that.bitmap.alpha = 1.0;
            that.bitmap.scaleX = that._sizeInUse;
            that.bitmap.scaleY = that.bitmap.scaleX;
            that.bitmap.scale = that.bitmap.scaleX;
            that.bitmap.rotation = that.orientation;
            that.skinChanged = that._isSkinChanged;
            let bounds = that.container.getBounds();
            that.container.cache(bounds.x, bounds.y, bounds.width, bounds.height);
            that.blinkFinished = true;
            that.turtles.refreshCanvas();
        }, 500 / duration);  // 500 / duration == (1000 * (1 / duration)) / 2
        */
    };
}

function Turtles() {
    this.masterStage = null;
    this.doClear = null;
    this.hideMenu = null;
    this.doGrid = null;
    this.hideGrids = null;
    this.stage = null;
    this.refreshCanvas = null;
    this.scale = 1.0;
    this.w = 1200;
    this.h = 900;
    this.backgroundColor = platformColor.background;
    this._canvas = null;
    this._rotating = false;
    this._drum = false;

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
    this._queue = [];

    // List of all of the turtles, one for each start block
    this.turtleList = [];

    this.setGridLabel = function(text) {
        if (this._gridLabel !== null) {
            this._gridLabel.text = text;
        }
    };

    this.setMasterStage = function(stage) {
        this.masterStage = stage;
        return this;
    };

    this.setClear = function(doClear) {
        this.doClear = doClear;
        return this;
    };

    this.setDoGrid = function(doGrid) {
        this.doGrid = doGrid;
        return this;
    };

    this.setHideGrids = function(hideGrids) {
        this.hideGrids = hideGrids;
        return this;
    };

    this.setHideMenu = function(hideMenu) {
        this.hideMenu = hideMenu;
        return this;
    };

    this.setCanvas = function(canvas) {
        this._canvas = canvas;
        return this;
    };

    this.setStage = function(stage) {
        this.stage = stage;
        this.stage.addChild(this._borderContainer);
        return this;
    };

    this.scaleStage = function(scale) {
        this.stage.scaleX = scale;
        this.stage.scaleY = scale;
        this.refreshCanvas();
    };

    this.setRefreshCanvas = function(refreshCanvas) {
        this.refreshCanvas = refreshCanvas;
        return this;
    };

    this.setScale = function(w, h, scale) {
        if (this._locked) {
            this._queue = [w, h, scale];
        } else {
            this.scale = scale;
            this.w = w / scale;
            this.h = h / scale;
        }

        this.makeBackground();
    };

    this.deltaY = function(dy) {
        this.stage.y += dy;
    };

    /**
     * Makes background for canvas: clears containers, renders buttons.
     *
     * @param setCollapsed - specify whether the background should be collapsed
     */
    this.makeBackground = function(setCollapsed) {
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

        let that = this;
        let circles = null;

        /**
         * Makes boundary for graphics (mouse) container by initialising
         * 'MBOUNDARY' SVG.
         */
        function __makeBoundary() {
            that._locked = true;
            let img = new Image();
            img.onload = function() {
                if (that._expandedBoundary !== null) {
                    that._expandedBoundary.visible = false;
                }

                that._expandedBoundary = new createjs.Bitmap(img);
                that._expandedBoundary.x = 0;
                that._expandedBoundary.y = 55 + LEADING;
                that._borderContainer.addChild(that._expandedBoundary);
                __makeBoundary2();
            };

            let dx = that.w - 5;
            let dy = that.h - 55 - LEADING;
            img.src =
                "data:image/svg+xml;base64," +
                window.btoa(
                    unescape(
                        encodeURIComponent(
                            MBOUNDARY.replace("HEIGHT", that.h)
                                .replace("WIDTH", that.w)
                                .replace("Y", 10 / SCALEFACTOR)
                                .replace("X", 10 / SCALEFACTOR)
                                .replace("DY", dy)
                                .replace("DX", dx)
                                .replace(
                                    "stroke_color",
                                    platformColor.ruleColor
                                )
                                .replace("fill_color", that.backgroundColor)
                                .replace("STROKE", 20 / SCALEFACTOR)
                        )
                    )
                );
        }

        /**
         * Makes second boundary for graphics (mouse) container by initialising 'MBOUNDARY' SVG.
         */
        function __makeBoundary2() {
            let img = new Image();
            img.onload = function() {
                if (that._collapsedBoundary !== null) {
                    that._collapsedBoundary.visible = false;
                }

                that._collapsedBoundary = new createjs.Bitmap(img);
                that._collapsedBoundary.x = 0;
                that._collapsedBoundary.y = 55 + LEADING;
                that._borderContainer.addChild(that._collapsedBoundary);
                that._collapsedBoundary.visible = false;

                __makeExpandButton();
            };

            let dx = that.w - 20;
            let dy = that.h - 55 - LEADING;
            img.src =
                "data:image/svg+xml;base64," +
                window.btoa(
                    unescape(
                        encodeURIComponent(
                            MBOUNDARY.replace("HEIGHT", that.h)
                                .replace("WIDTH", that.w)
                                .replace("Y", 10)
                                .replace("X", 10)
                                .replace("DY", dy)
                                .replace("DX", dx)
                                .replace(
                                    "stroke_color",
                                    platformColor.ruleColor
                                )
                                .replace("fill_color", that.backgroundColor)
                                .replace("STROKE", 20)
                        )
                    )
                );
        }

        /**
         * Makes expand button by initailising 'EXPANDBUTTON' SVG.
         * Assigns click listener function to remove stage and add it at posiion 0.
         */
        function __makeExpandButton() {
            that._expandButton = new createjs.Container();
            that._expandLabel = null;
            that._expandLabelBG = null;

            that._expandLabel = new createjs.Text(
                _("Expand"),
                "14px Sans",
                "#282828"
            );
            that._expandLabel.textAlign = "center";
            that._expandLabel.x = 11.5;
            that._expandLabel.y = 55;
            that._expandLabel.visible = false;

            let img = new Image();
            img.onload = function() {
                if (that._expandButton !== null) {
                    that._expandButton.visible = false;
                }

                let bitmap = new createjs.Bitmap(img);
                that._expandButton.addChild(bitmap);
                bitmap.visible = true;
                that._expandButton.addChild(that._expandLabel);

                that._expandButton.x = that.w - 10 - 4 * 55;
                that._expandButton.y = 70 + LEADING + 6;
                that._expandButton.scaleX = SCALEFACTOR;
                that._expandButton.scaleY = SCALEFACTOR;
                that._expandButton.scale = SCALEFACTOR;
                that._expandButton.visible = false;
                // that._borderContainer.addChild(that._expandButton);
                that.stage.addChild(that._expandButton);

                that._expandButton.removeAllEventListeners("mouseover");
                that._expandButton.on("mouseover", function(event) {
                    if (that._expandLabel !== null) {
                        that._expandLabel.visible = true;

                        if (that._expandLabelBG === null) {
                            let b = that._expandLabel.getBounds();
                            that._expandLabelBG = new createjs.Shape();
                            that._expandLabelBG.graphics
                                .beginFill("#FFF")
                                .drawRoundRect(
                                    that._expandLabel.x + b.x - 8,
                                    that._expandLabel.y + b.y - 2,
                                    b.width + 16,
                                    b.height + 8,
                                    10,
                                    10,
                                    10,
                                    10
                                );
                            that._expandButton.addChildAt(
                                that._expandLabelBG,
                                0
                            );
                        } else {
                            that._expandLabelBG.visible = true;
                        }
                    }

                    that.refreshCanvas();
                });

                that._expandButton.removeAllEventListeners("mouseout");
                that._expandButton.on("mouseout", function(event) {
                    if (that._expandLabel !== null) {
                        that._expandLabel.visible = false;
                        that._expandLabelBG.visible = false;
                        that.refreshCanvas();
                    }
                });

                that._expandButton.removeAllEventListeners("pressmove");
                that._expandButton.on("pressmove", function(event) {
                    let w = (that.w - 10 - SCALEFACTOR * 55) / SCALEFACTOR;
                    let x = event.stageX / that.scale - w;
                    let y = event.stageY / that.scale - 16;
                    that.stage.x = Math.max(0, Math.min((that.w * 3) / 4, x));
                    that.stage.y = Math.max(55, Math.min((that.h * 3) / 4, y));
                    that.refreshCanvas();
                });

                that._expandButton.removeAllEventListeners("click");
                that._expandButton.on("click", function(event) {
                    // If the aux toolbar is open, close it.
                    let auxToolbar = docById("aux-toolbar");
                    if (auxToolbar.style.display === "block") {
                        let menuIcon = docById("menu");
                        auxToolbar.style.display = "none";
                        menuIcon.innerHTML = "menu";
                        docById("toggleAuxBtn").className -= "blue darken-1";
                    }
                    that.hideMenu();
                    that.scaleStage(1.0);
                    that._expandedBoundary.visible = true;
                    that._collapseButton.visible = true;
                    that._collapsedBoundary.visible = false;
                    that._expandButton.visible = false;
                    that.stage.x = 0;
                    that.stage.y = 0;
                    that.isShrunk = false;
                    for (let i = 0; i < that.turtleList.length; i++) {
                        that.turtleList[i].container.scaleX = 1;
                        that.turtleList[i].container.scaleY = 1;
                        that.turtleList[i].container.scale = 1;
                    }

                    that._clearButton.scaleX = 1;
                    that._clearButton.scaleY = 1;
                    that._clearButton.scale = 1;
                    that._clearButton.x = that.w - 5 - 2 * 55;

                    if (that._gridButton !== null) {
                        that._gridButton.scaleX = 1;
                        that._gridButton.scaleY = 1;
                        that._gridButton.scale = 1;
                        that._gridButton.x = that.w - 10 - 3 * 55;
                        that._gridButton.visible = true;
                    }

                    // remove the stage and add it back in position 0
                    that.masterStage.removeChild(that.stage);
                    that.masterStage.addChildAt(that.stage, 0);
                });

                __makeCollapseButton();
            };

            img.src =
                "data:image/svg+xml;base64," +
                window.btoa(unescape(encodeURIComponent(EXPANDBUTTON)));
        }

        /**
         * Makes collapse button by initailising 'EXPANDBUTTON' SVG.
         * Assigns click listener function to call collapse() method.
         */
        function __makeCollapseButton() {
            that._collapseButton = new createjs.Container();
            that._collapseLabel = null;
            that._collapseLabelBG = null;

            that._collapseLabel = new createjs.Text(
                _("Collapse"),
                "14px Sans",
                "#282828"
            );
            that._collapseLabel.textAlign = "center";
            that._collapseLabel.x = 11.5;
            that._collapseLabel.y = 55;
            that._collapseLabel.visible = false;

            let img = new Image();
            img.onload = function() {
                if (that._collapseButton !== null) {
                    that._collapseButton.visible = false;
                }

                let bitmap = new createjs.Bitmap(img);
                that._collapseButton.addChild(bitmap);
                bitmap.visible = true;
                that._collapseButton.addChild(that._collapseLabel);

                // that._borderContainer.addChild(that._collapseButton);
                that.stage.addChild(that._collapseButton);

                that._collapseButton.visible = true;
                that._collapseButton.x = that.w - 55;
                that._collapseButton.y = 70 + LEADING + 6;
                that.refreshCanvas();

                that._collapseButton.removeAllEventListeners("click");
                that._collapseButton.on("click", function(event) {
                    // If the aux toolbar is open, close it.
                    let auxToolbar = docById("aux-toolbar");
                    if (auxToolbar.style.display === "block") {
                        let menuIcon = docById("menu");
                        auxToolbar.style.display = "none";
                        menuIcon.innerHTML = "menu";
                        docById("toggleAuxBtn").className -= "blue darken-1";
                    }
                    that.collapse();
                });

                that._collapseButton.removeAllEventListeners("mouseover");
                that._collapseButton.on("mouseover", function(event) {
                    if (that._collapseLabel !== null) {
                        that._collapseLabel.visible = true;

                        if (that._collapseLabelBG === null) {
                            let b = that._collapseLabel.getBounds();
                            that._collapseLabelBG = new createjs.Shape();
                            that._collapseLabelBG.graphics
                                .beginFill("#FFF")
                                .drawRoundRect(
                                    that._collapseLabel.x + b.x - 8,
                                    that._collapseLabel.y + b.y - 2,
                                    b.width + 16,
                                    b.height + 8,
                                    10,
                                    10,
                                    10,
                                    10
                                );
                            that._collapseButton.addChildAt(
                                that._collapseLabelBG,
                                0
                            );
                        } else {
                            that._collapseLabelBG.visible = true;
                        }

                        let r = 55 / 2;
                        circles = showButtonHighlight(
                            that._collapseButton.x + 28,
                            that._collapseButton.y + 28,
                            r,
                            event,
                            palettes.scale,
                            that.stage
                        );
                    }

                    that.refreshCanvas();
                });

                that._collapseButton.removeAllEventListeners("mouseout");
                that._collapseButton.on("mouseout", function(event) {
                    hideButtonHighlight(circles, that.stage);
                    if (that._collapseLabel !== null) {
                        that._collapseLabel.visible = false;
                        that._collapseLabelBG.visible = false;
                        that.refreshCanvas();
                    }
                });

                __makeClearButton();
            };

            img.src =
                "data:image/svg+xml;base64," +
                window.btoa(unescape(encodeURIComponent(COLLAPSEBUTTON)));
        }

        /**
         * Makes clear button by initailising 'CLEARBUTTON' SVG.
         * Assigns click listener function to call doClear() method.
         */
        function __makeClearButton() {
            that._clearButton = new createjs.Container();
            that._clearLabel = null;
            that._clearLabelBG = null;

            that._clearButton.removeAllEventListeners("click");
            that._clearButton.on("click", function(event) {
                that.doClear();
            });

            that._clearLabel = new createjs.Text(
                _("Clean"),
                "14px Sans",
                "#282828"
            );
            that._clearLabel.textAlign = "center";
            that._clearLabel.x = 27.5;
            that._clearLabel.y = 55;
            that._clearLabel.visible = false;

            let img = new Image();
            img.onload = function() {
                let bitmap = new createjs.Bitmap(img);
                that._clearButton.addChild(bitmap);
                that._clearButton.addChild(that._clearLabel);

                bitmap.visible = true;
                that._clearButton.x = that.w - 5 - 2 * 55;
                that._clearButton.y = 70 + LEADING + 6;
                that._clearButton.visible = true;

                // that._borderContainer.addChild(that._clearButton);
                that.stage.addChild(that._clearButton);
                that.refreshCanvas();

                that._clearButton.removeAllEventListeners("mouseover");
                that._clearButton.on("mouseover", function(event) {
                    if (that._clearLabel !== null) {
                        that._clearLabel.visible = true;

                        if (that._clearLabelBG === null) {
                            let b = that._clearLabel.getBounds();
                            that._clearLabelBG = new createjs.Shape();
                            that._clearLabelBG.graphics
                                .beginFill("#FFF")
                                .drawRoundRect(
                                    that._clearLabel.x + b.x - 8,
                                    that._clearLabel.y + b.y - 2,
                                    b.width + 16,
                                    b.height + 8,
                                    10,
                                    10,
                                    10,
                                    10
                                );
                            that._clearButton.addChildAt(that._clearLabelBG, 0);
                        } else {
                            that._clearLabelBG.visible = true;
                        }

                        let r = 55 / 2;
                        circles = showButtonHighlight(
                            that._clearButton.x + 28,
                            that._clearButton.y + 28,
                            r,
                            event,
                            palettes.scale,
                            that.stage
                        );
                    }

                    that.refreshCanvas();
                });

                that._clearButton.removeAllEventListeners("mouseout");
                that._clearButton.on("mouseout", function(event) {
                    hideButtonHighlight(circles, that.stage);
                    if (that._clearLabel !== null) {
                        that._clearLabel.visible = false;
                    }

                    if (that._clearLabelBG !== null) {
                        that._clearLabelBG.visible = false;
                    }

                    that.refreshCanvas();
                });

                if (doCollapse) {
                    that.collapse();
                }

                let language = localStorage.languagePreference;
                // if (!beginnerMode || language !== 'ja') {
                __makeGridButton();
                // }
            };

            img.src =
                "data:image/svg+xml;base64," +
                window.btoa(unescape(encodeURIComponent(CLEARBUTTON)));
        }

        /**
         * Makes 'cartesian' button by initailising 'CARTESIANBUTTON' SVG.
         * Assigns click listener function to doGrid() method.
         */
        function __makeGridButton() {
            that._gridButton = new createjs.Container();
            that._gridLabel = null;
            that._gridLabelBG = null;

            that._gridButton.removeAllEventListeners("click");
            that._gridButton.on("click", function(event) {
                that.doGrid();
            });

            that._gridLabel = new createjs.Text(
                _("show Cartesian"),
                "14px Sans",
                "#282828"
            );
            that._gridLabel.textAlign = "center";
            that._gridLabel.x = 27.5;
            that._gridLabel.y = 55;
            that._gridLabel.visible = false;

            let img = new Image();
            img.onload = function() {
                let bitmap = new createjs.Bitmap(img);
                that._gridButton.addChild(bitmap);
                that._gridButton.addChild(that._gridLabel);

                bitmap.visible = true;
                that._gridButton.x = that.w - 10 - 3 * 55;
                that._gridButton.y = 70 + LEADING + 6;
                that._gridButton.visible = true;

                // that._borderContainer.addChild(that._gridButton);
                that.stage.addChild(that._gridButton);
                that.refreshCanvas();

                that._gridButton.removeAllEventListeners("mouseover");
                that._gridButton.on("mouseover", function(event) {
                    if (that._gridLabel !== null) {
                        that._gridLabel.visible = true;

                        if (that._gridLabelBG === null) {
                            let b = that._gridLabel.getBounds();
                            that._gridLabelBG = new createjs.Shape();
                            that._gridLabelBG.graphics
                                .beginFill("#FFF")
                                .drawRoundRect(
                                    that._gridLabel.x + b.x - 8,
                                    that._gridLabel.y + b.y - 2,
                                    b.width + 16,
                                    b.height + 8,
                                    10,
                                    10,
                                    10,
                                    10
                                );
                            that._gridButton.addChildAt(that._gridLabelBG, 0);
                        } else {
                            that._gridLabelBG.visible = true;
                        }

                        let r = 55 / 2;
                        circles = showButtonHighlight(
                            that._gridButton.x + 28,
                            that._gridButton.y + 28,
                            r,
                            event,
                            palettes.scale,
                            that.stage
                        );
                    }

                    that.refreshCanvas();
                });

                that._gridButton.removeAllEventListeners("mouseout");
                that._gridButton.on("mouseout", function(event) {
                    hideButtonHighlight(circles, that.stage);
                    if (that._gridLabel !== null) {
                        that._gridLabel.visible = false;
                        that._gridLabelBG.visible = false;
                        that.refreshCanvas();
                    }
                });

                if (doCollapse) {
                    that.collapse();
                }

                that._locked = false;
                if (that._queue.length === 3) {
                    that.scale = that._queue[2];
                    that.w = that._queue[0] / that.scale;
                    that.h = that._queue[1] / that.scale;
                    that._queue = [];
                    that.makeBackground();
                }
            };

            img.src =
                "data:image/svg+xml;base64," +
                window.btoa(unescape(encodeURIComponent(CARTESIANBUTTON)));
        }

        if (!this._locked) {
            __makeBoundary();
        }

        return this;
    };

    /**
     * Toggles visibility of menu and grids.
     * Scales down all 'turtles' in turtleList.
     * Removes the stage and adds it back at the top.
     */
    this.collapse = function() {
        this.hideMenu();
        this.hideGrids();
        this.scaleStage(0.25);
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
    };

    /**
     * Returns block object.
     *
     * @param blocks
     * @return {Object} - blocks object
     */
    this.setBlocks = function(blocks) {
        this.blocks = blocks;
        return this;
    };

    /**
     * Adds drum to start block.
     *
     * @param startBlock - name of startBlock
     * @param infoDict - contains turtle color, shade, pensize, x, y, heading, etc.
     */
    this.addDrum = function(startBlock, infoDict) {
        this._drum = true;
        this.add(startBlock, infoDict);
    };

    /**
     * Adds turtle to start block.
     *
     * @param startBlock - name of startBlock
     * @param infoDict - contains turtle color, shade, pensize, x, y, heading, etc.
     */
    this.addTurtle = function(startBlock, infoDict) {
        this._drum = false;
        this.add(startBlock, infoDict);
        if (this.isShrunk) {
            let t = last(this.turtleList);
            t.container.scaleX = SCALEFACTOR;
            t.container.scaleY = SCALEFACTOR;
            t.container.scale = SCALEFACTOR;
        }
    };

    /**
     * Add a new turtle for each start block.
     * Creates container for each turtle.
     *
     * @param startBlock - name of startBlock
     * @param infoDict - contains turtle color, shade, pensize, x, y, heading, etc.
     */
    this.add = function(startBlock, infoDict) {
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

        let i = this.turtleList.length;
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

        let turtleImage = new Image();
        i %= 10;
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

        function __processTurtleBitmap(that, name, bitmap, startBlock) {
            newTurtle.bitmap = bitmap;
            newTurtle.bitmap.regX = 27 | 0;
            newTurtle.bitmap.regY = 27 | 0;
            newTurtle.bitmap.cursor = "pointer";
            newTurtle.container.addChild(newTurtle.bitmap);
            newTurtle.createCache();

            newTurtle.startBlock = startBlock;
            if (startBlock != null) {
                startBlock.updateCache();
                newTurtle.decorationBitmap = newTurtle.bitmap.clone();
                startBlock.container.addChild(newTurtle.decorationBitmap);
                newTurtle.decorationBitmap.name = "decoration";
                let width = startBlock.width;
                let offset = 40;

                newTurtle.decorationBitmap.x =
                    width - (offset * startBlock.protoblock.scale) / 2;

                newTurtle.decorationBitmap.y =
                    (35 * startBlock.protoblock.scale) / 2;
                newTurtle.decorationBitmap.scaleX = newTurtle.decorationBitmap.scaleY = newTurtle.decorationBitmap.scale =
                    (0.5 * startBlock.protoblock.scale) / 2;
                startBlock.updateCache();
            }

            that.refreshCanvas();
        }

        let artwork = this._drum ? DRUMSVG : TURTLESVG;

        if (sugarizerCompatibility.isInsideSugarizer()) {
            this._makeTurtleBitmap(
                artwork
                    .replace(/fill_color/g, sugarizerCompatibility.xoColor.fill)
                    .replace(
                        /stroke_color/g,
                        sugarizerCompatibility.xoColor.stroke
                    ),
                "turtle",
                __processTurtleBitmap,
                startBlock
            );
        } else {
            this._makeTurtleBitmap(
                artwork
                    .replace(/fill_color/g, FILLCOLORS[i])
                    .replace(/stroke_color/g, STROKECOLORS[i]),
                "turtle",
                __processTurtleBitmap,
                startBlock
            );
        }

        newTurtle.color = i * 10;
        newTurtle.canvasColor = getMunsellColor(
            newTurtle.color,
            DEFAULTVALUE,
            DEFAULTCHROMA
        );
        let that = this;

        newTurtle.container.on("mousedown", function(event) {
            if (that._rotating) {
                return;
            }

            let offset = {
                x: newTurtle.container.x - event.stageX / that.scale,
                y: newTurtle.container.y - event.stageY / that.scale
            };

            newTurtle.container.removeAllEventListeners("pressmove");
            newTurtle.container.on("pressmove", function(event) {
                if (newTurtle.running) {
                    return;
                }

                newTurtle.container.x = event.stageX / that.scale + offset.x;
                newTurtle.container.y = event.stageY / that.scale + offset.y;
                newTurtle.x = that.screenX2turtleX(newTurtle.container.x);
                newTurtle.y = that.screenY2turtleY(newTurtle.container.y);
                that.refreshCanvas();
            });
        });

        newTurtle.container.on("click", function(event) {
            // If turtles listen for clicks then they can be used as buttons
            console.debug("--> [click " + newTurtle.name + "]");
            that.stage.dispatchEvent("click" + newTurtle.name);
        });

        newTurtle.container.on("mouseover", function(event) {
            if (newTurtle.running) {
                return;
            }

            newTurtle.container.scaleX *= 1.2;
            newTurtle.container.scaleY = newTurtle.container.scaleX;
            newTurtle.container.scale = newTurtle.container.scaleX;
            that.refreshCanvas();
        });

        newTurtle.container.on("mouseout", function(event) {
            if (newTurtle.running) {
                return;
            }

            newTurtle.container.scaleX /= 1.2;
            newTurtle.container.scaleY = newTurtle.container.scaleX;
            newTurtle.container.scale = newTurtle.container.scaleX;
            that.refreshCanvas();
        });

        document.getElementById("loader").className = "";

        setTimeout(function() {
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
    };

    /**
     * Async creation of bitmap from SVG data.
     *
     * @param data - SVG data
     * @param name - name of bitmap
     * @param callback - function executed on load of bitmap
     * @param extras
     */
    this._makeTurtleBitmap = function(data, name, callback, extras) {
        // Works with Chrome, Safari, Firefox (untested on IE)
        let img = new Image();

        img.onload = () => {
            complete = true;
            let bitmap = new createjs.Bitmap(img);
            callback(this, name, bitmap, extras);
        };

        img.src =
            "data:image/svg+xml;base64," +
            window.btoa(unescape(encodeURIComponent(data)));
    };

    /**
     * Convert on screen x coordinate to turtle x coordinate.
     *
     * @param x - x coordinate
     */
    this.screenX2turtleX = function(x) {
        return x - this._canvas.width / (2.0 * this.scale);
    };

    /**
     * Convert on screen y coordinate to turtle y coordinate.
     *
     * @param y - y coordinate
     */
    this.screenY2turtleY = function(y) {
        return this.invertY(y);
    };

    /**
     * Convert turtle x coordinate to on screen x coordinate.
     *
     * @param x - x coordinate
     */
    this.turtleX2screenX = function(x) {
        return this._canvas.width / (2.0 * this.scale) + x;
    };

    /**
     * Convert turtle y coordinate to on screen y coordinate.
     *
     * @param y - y coordinate
     */
    this.turtleY2screenY = function(y) {
        return this.invertY(y);
    };

    /**
     * Invert y coordinate.
     */
    this.invertY = function(y) {
        return this._canvas.height / (2.0 * this.scale) - y;
    };

    /**
     * Toggles 'running' boolean value for all turtles.
     */
    this.markAsStopped = function() {
        for (let turtle in this.turtleList) {
            this.turtleList[turtle].running = false;
            // Make sure the blink is really stopped
            // this.turtleList[turtle].stopBlink();
        }

        this.refreshCanvas();
    };

    /**
     * Returns boolean value depending on whether turtle is running.
     *
     * @return {boolean} - running
     */
    this.running = function() {
        for (let turtle in this.turtleList) {
            if (this.turtleList[turtle].running) {
                return true;
            }
        }
        return false;
    };
}

/**
 * Queue entry for managing running blocks.
 *
 * @class
 */
class Queue {
    /**
     * @constructor
     * @param blk - block
     * @param count - count
     * @param parentBlk - parent block
     * @param args - arguments
     */
    constructor(blk, count, parentBlk, args) {
        this.blk = blk;
        this.count = count;
        this.parentBlk = parentBlk;
        this.args = args;
    }
}

/**
 * Converts hexcode to rgb.
 *
 * @param {Number} hex - hexcode
 * @return {String} - rgb values of hexcode + alpha which is 1
 */
function hex2rgb(hex) {
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;

    return "rgba(" + r + "," + g + "," + b + ",1)";
}
