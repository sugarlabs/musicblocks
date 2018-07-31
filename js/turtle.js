// Copyright (c) 2014-2018 Walter Bender
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
const DEFAULTFONT = 'sans-serif';

// Turtle sprite
const TURTLEBASEPATH = 'images/';

function Turtle (name, turtles, drum) {
    this.name = name;
    this.turtles = turtles;
    this.drum = drum;

    if (drum) {
        console.log('turtle ' + name + ' is a drum.');
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
    this.skinChanged = false;  // Should we reskin the turtle on clear?
    this.shellSize = 55;
    this.blinkFinished = true;
    this.isSkinChanged = false;
    this._sizeInUse = 1;
    this._isSkinChanged = false;
    this.beforeBlinkSize = null;

    // Which start block is assocated with this turtle?
    this.startBlock = null;
    this.decorationBitmap = null;  // Start block decoration.

    // Queue of blocks this turtle is executing.
    this.queue = [];

    // Listeners
    this.listeners = {};

    // Things used for what the turtle draws.
    this.penstrokes = null;
    this.imageContainer = null;
    this.svgOutput = '';
    // Are we currently drawing a path?
    this.svgPath = false;
    this.color = DEFAULTCOLOR;
    this.value = DEFAULTVALUE;
    this.chroma = DEFAULTCHROMA;
    this.stroke = DEFAULTSTROKE;
    this.canvasColor = 'rgba(255,0,49,1)'; // '#ff0031';
    this.canvasAlpha = 1.0;
    this.orientation = 0;
    this.fillState = false;
    this.hollowState = false;
    this.penState = true;
    this.font = DEFAULTFONT;
    this.media = [];  // Media (text, images) we need to remove on clear.
    var canvas = document.getElementById('overlayCanvas');
    var ctx = canvas.getContext('2d');
    // Simulate an arc with line segments since Tinkercad cannot
    // import SVG arcs reliably.
    this._svgArc = function(nsteps, cx, cy, radius, sa, ea) {
        var a = sa;
        if (ea == null) {
            var da = Math.PI / nsteps;
        } else {
            var da = (ea - sa) / nsteps;
        }
        for (var i = 0; i < nsteps; i++) {
            var nx = cx + radius * Math.cos(a);
            var ny = cy + radius * Math.sin(a);
            this.svgOutput += nx + ',' + ny + ' ';
            a += da;
        }
    };

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
            ctx.lineCap = 'round';
            // Draw a hollow line.
            if (savedStroke < 3) {
                var step = 0.5;
            } else {
                var step = (savedStroke - 2) / 2.;
            }

            steps = Math.max(Math.floor(savedStroke, 1));

            // We need both the initial and final headings.
            // The initial heading is the angle between (cp1x, cp1y) and (this.x, this.y).
            var degreesInitial = Math.atan2(cp1x - this.x, cp1y - this.y);
            degreesInitial = (180 * degreesInitial / Math.PI);
            if (degreesInitial < 0) { degreesInitial += 360; }
            // The final heading is the angle between (cp2x, cp2y) and (fx, fy).
            var degreesFinal = Math.atan2(nx - cp2x, ny - cp2y);
            degreesFinal = 180 * degreesFinal / Math.PI;
            if (degreesFinal < 0) { degreesFinal += 360; }

            // We also need to calculate the deltas for the 'caps' at each end.
            var capAngleRadiansInitial = (degreesInitial - 90) * Math.PI / 180.0;
            var dxi = step * Math.sin(capAngleRadiansInitial);
            var dyi = -step * Math.cos(capAngleRadiansInitial);
            var capAngleRadiansFinal = (degreesFinal - 90) * Math.PI / 180.0;
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
            var cx1Scaled = (cx1 + dxi)* this.turtles.scale;
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
            this._svgArc(steps, arccx * this.turtles.scale, arccy * this.turtles.scale, step * this.turtles.scale, sa, ea);

            // Final arc
            var oAngleRadians = (degreesFinal / 180) * Math.PI;
            var arccx = fx;
            var arccy = fy;
            var sa = oAngleRadians - Math.PI;
            var ea = oAngleRadians;
            ctx.arc(arccx, arccy, step, sa, ea, false);
            this._svgArc(steps, arccx * this.turtles.scale, arccy * this.turtles.scale, step * this.turtles.scale, sa, ea);

            var fx = this.turtles.turtleX2screenX(x2);
            var fy = this.turtles.turtleY2screenY(y2);
            var fxScaled = fx * this.turtles.scale;
            var fyScaled = fy * this.turtles.scale;

            ctx.stroke();
            ctx.closePath();
            // restore stroke.
            this.stroke = savedStroke;
            ctx.lineWidth = this.stroke;
            ctx.lineCap = 'round';
            ctx.moveTo(fx,fy);
            this.svgOutput += 'M ' + fxScaled + ',' + fyScaled + ' ';
            this.x = x2;
            this.y = y2;
        } else if (this.penState) {
            this.processColor();
            ctx.lineWidth = this.stroke;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(this.container.x, this.container.y);

            // Convert from turtle coordinates to screen coordinates.
            var fx = this.turtles.turtleX2screenX(x2);
            var fy = this.turtles.turtleY2screenY(y2);
            var cx1 = this.turtles.turtleX2screenX(cp1x);
            var cy1 = this.turtles.turtleY2screenY(cp1y);
            var cx2 = this.turtles.turtleX2screenX(cp2x);
            var cy2 = this.turtles.turtleY2screenY(cp2y);

            ctx.bezierCurveTo(cx1 + dxi, cy1 + dyi , cx2 + dxf, cy2 + dyf, cx, cy);
            ctx.bezierCurveTo(cx2 - dxf, cy2 - dyf, cx1 - dxi, cy1 - dyi, ax, ay);
            ctx.bezierCurveTo(cx1, cy1, cx2, cy2, fx, fy);

            if (!this.svgPath) {
                this.svgPath = true;
                var ix = this.turtles.turtleX2screenX(this.x);
                var iy = this.turtles.turtleY2screenY(this.y);
                var ixScaled = ix * this.turtles.scale;
                var iyScaled = iy * this.turtles.scale;
                this.svgOutput += '<path d="M ' + ixScaled + ',' + iyScaled + ' ';
            }

            var cx1Scaled = cx1 * this.turtles.scale;
            var cy1Scaled = cy1 * this.turtles.scale;
            var cx2Scaled = cx2 * this.turtles.scale;
            var cy2Scaled = cy2 * this.turtles.scale;
            var fxScaled = fx * this.turtles.scale;
            var fyScaled = fy * this.turtles.scale;

            //Curve to: ControlPointX1, ControlPointY1 >> ControlPointX2, ControlPointY2 >> X, Y
            this.svgOutput += 'C ' + cx1Scaled + ',' + cy1Scaled + ' ' + cx2Scaled + ',' + cy2Scaled + ' ' + fxScaled + ',' + fyScaled;
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
        degrees = 180 * degrees / Math.PI;
        this.doSetHeading(degrees);
    };

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
            ctx.lineCap = 'round';
            // Draw a hollow line.
            if (savedStroke < 3) {
                var step = 0.5;
            } else {
                var step = (savedStroke - 2) / 2.;
            }

            var capAngleRadians = (this.orientation - 90) * Math.PI / 180.0;
            var dx = step * Math.sin(capAngleRadians);
            var dy = -step * Math.cos(capAngleRadians);

            ctx.moveTo(ox + dx, oy + dy);
            var oxScaled = (ox + dx) * this.turtles.scale;
            var oyScaled = (oy + dy) * this.turtles.scale;
            this.svgOutput += '<path d="M ' + oxScaled + ',' + oyScaled + ' ';

            ctx.lineTo(nx + dx, ny + dy);
            var nxScaled = (nx + dx) * this.turtles.scale;
            var nyScaled = (ny + dy) * this.turtles.scale;
            this.svgOutput += nxScaled + ',' + nyScaled + ' ';

            var capAngleRadians = (this.orientation + 90) * Math.PI / 180.0;
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
            this._svgArc(steps, cx * this.turtles.scale, cy * this.turtles.scale, radiusScaled, sa);
            this.svgOutput += nxScaled + ',' + nyScaled + ' ';

            ctx.lineTo(ox + dx, oy + dy);
            var nxScaled = (ox + dx) * this.turtles.scale;
            var nyScaled = (oy + dy) * this.turtles.scale;
            this.svgOutput += nxScaled + ',' + nyScaled + ' ';

            var capAngleRadians = (this.orientation - 90) * Math.PI / 180.0;
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
            this._svgArc(steps, cx * this.turtles.scale, cy * this.turtles.scale, radiusScaled, sa);
            this.svgOutput += nxScaled + ',' + nyScaled + ' ';

            this.closeSVG();

            ctx.stroke();
            ctx.closePath();
            // restore stroke.
            this.stroke = savedStroke;
            ctx.lineWidth = this.stroke;
            ctx.lineCap = 'round';
            ctx.moveTo(nx, ny);
        } else if (this.penState) {
            ctx.lineTo(nx, ny);
            if (!this.svgPath) {
                this.svgPath = true;
                var oxScaled = ox * this.turtles.scale;
                var oyScaled = oy * this.turtles.scale;
                this.svgOutput += '<path d="M ' + oxScaled + ',' + oyScaled + ' ';
            }
            var nxScaled = nx * this.turtles.scale;
            var nyScaled = ny * this.turtles.scale;
            this.svgOutput += nxScaled + ',' + nyScaled + ' ';
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

    this.getNumber = function () {
        return this.turtles.turtleList.indexOf(this);
    };

    this.rename = function(name) {
        this.name = name;

        // Use the name on the label of the start block.
        if (this.startBlock != null) {
            this.startBlock.overrideName = this.name;
            if (this.name === _('start drum')) {
                this.startBlock.collapseText.text = _('drum');
            } else {
                this.startBlock.collapseText.text = this.name;
            }
            this.startBlock.regenerateArtwork(false);
            this.startBlock.value = this.turtles.turtleList.indexOf(this);
        }
    };

    this.arc = function(cx, cy, ox, oy, x, y, radius, start, end, anticlockwise, invert) {
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

        // Draw an arc if the pen is down.
        if (this.penState && this.hollowState) {
            // First, we need to close the current SVG path.
            this.closeSVG();
            this.svgPath = true;
            // Save the current stroke width.
            var savedStroke = this.stroke;
            this.stroke = 1;
            ctx.lineWidth = this.stroke;
            ctx.lineCap = 'round';
            // Draw a hollow line.
            if (savedStroke < 3) {
                var step = 0.5;
            } else {
                var step = (savedStroke - 2) / 2.;
            }

            var capAngleRadians = (this.orientation + 90) * Math.PI / 180.0;
            var dx = step * Math.sin(capAngleRadians);
            var dy = -step * Math.cos(capAngleRadians);

            if (anticlockwise) {
                ctx.moveTo(ox + dx, oy + dy);
                var oxScaled = (ox + dx) * this.turtles.scale;
                var oyScaled = (oy + dy) * this.turtles.scale;
            } else {
                ctx.moveTo(ox - dx, oy - dy);
                var oxScaled = (ox - dx) * this.turtles.scale;
                var oyScaled = (oy - dy) * this.turtles.scale;
            }
            this.svgOutput += '<path d="M ' + oxScaled + ',' + oyScaled + ' ';

            ctx.arc(cx, cy, radius + step, sa, ea, anticlockwise);
            nsteps = Math.max(Math.floor(radius * Math.abs(sa - ea) / 2), 2);
            steps = Math.max(Math.floor(savedStroke, 1));

            this._svgArc(nsteps, cx * this.turtles.scale, cy * this.turtles.scale, (radius + step) * this.turtles.scale, sa, ea);

            var capAngleRadians = (this.orientation + 90) * Math.PI / 180.0;
            var dx = step * Math.sin(capAngleRadians);
            var dy = -step * Math.cos(capAngleRadians);

            var cx1 = nx;
            var cy1 = ny;
            var sa1 = ea;
            var ea1 = ea + Math.PI;
            ctx.arc(cx1, cy1, step, sa1, ea1, anticlockwise);
            this._svgArc(steps, cx1 * this.turtles.scale, cy1 * this.turtles.scale, step * this.turtles.scale, sa1, ea1);
            ctx.arc(cx, cy, radius - step, ea, sa, !anticlockwise);
            this._svgArc(nsteps, cx * this.turtles.scale, cy * this.turtles.scale, (radius - step) * this.turtles.scale, ea, sa);
            var cx2 = ox;
            var cy2 = oy;
            var sa2 = sa - Math.PI;
            var ea2 = sa;
            ctx.arc(cx2, cy2, step, sa2, ea2, anticlockwise);
            this._svgArc(steps, cx2 * this.turtles.scale, cy2 * this.turtles.scale, step * this.turtles.scale, sa2, ea2);
            this.closeSVG();

            ctx.stroke();
            ctx.closePath();
            // restore stroke.
            this.stroke = savedStroke;
            ctx.lineWidth = this.stroke;
            ctx.lineCap = 'round';
            ctx.moveTo(nx,ny);
        } else if (this.penState) {
            ctx.arc(cx, cy, radius, sa, ea, anticlockwise);
            if (!this.svgPath) {
                this.svgPath = true;
                var oxScaled = ox * this.turtles.scale;
                var oyScaled = oy * this.turtles.scale;
                this.svgOutput += '<path d="M ' + oxScaled + ',' + oyScaled + ' ';
            }
            if (anticlockwise) {
                var sweep = 0;
            } else {
                var sweep = 1;
            }
            var nxScaled = nx * this.turtles.scale;
            var nyScaled = ny * this.turtles.scale;
            var radiusScaled = radius * this.turtles.scale;
            this.svgOutput += 'A ' + radiusScaled + ',' + radiusScaled + ' 0 0 ' + sweep + ' ' + nxScaled + ',' + nyScaled + ' ';
            ctx.stroke();
            if (!this.fillState) {
                ctx.closePath();
            }
        } else {
            ctx.moveTo(nx, ny);
        }
        // Update turtle position on screen.
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

    // Turtle functions
    this.doClear = function(resetPen, resetSkin, resetPosition) {
        // Reset turtle.
        if (resetPosition) {
            this.x = 0;
            this.y = 0;
            this.orientation = 0.0;
        }

        if (resetPen) {
            var i = this.turtles.turtleList.indexOf(this) % 10;
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
                if (this.name !== _('start drum')) {
                    this.rename(_('start drum'));
                }
            } else {
                if (this.name !== _('start')) {
                    this.rename(_('start'));
                }
            }

            if (this.skinChanged) {
                var artwork = TURTLESVG;
                if (sugarizerCompatibility.isInsideSugarizer()) {
                    artwork = artwork.replace(/fill_color/g, sugarizerCompatibility.xoColor.fill).replace(/stroke_color/g, sugarizerCompatibility.xoColor.stroke);
                } else {
                    artwork = artwork.replace(/fill_color/g, FILLCOLORS[i]).replace(/stroke_color/g, STROKECOLORS[i]);
                }

                this.doTurtleShell(55, 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(artwork))));
                this.skinChanged = false;
            }
        }

        this.bitmap.rotation = this.orientation;
        this.updateCache();

        // Clear all media.
        for (var i = 0; i < this.media.length; i++) {
            // Could be in the image Container or the Stage
            this.imageContainer.removeChild(this.media[i]);
            this.turtles.stage.removeChild(this.media[i]);
            delete this.media[i];
        }

        this.media = [];

        // Clear all graphics.
        this.penState = true;
        this.fillState = false;
        this.hollowState = false;

        this.canvasColor = getMunsellColor(this.color, this.value, this.chroma);
        if (this.canvasColor[0] === '#') {
            this.canvasColor = hex2rgb(this.canvasColor.split('#')[1]);
        }

        this.svgOutput = '';
        this.svgPath = false;
        this.penstrokes.image = null;
        ctx.beginPath();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.penstrokes.image = canvas;
        this.turtles.refreshCanvas();
    };

    this.clearPenStrokes = function() {
        this.penState = true;
        this.fillState = false;
        this.hollowState = false;

        this.canvasColor = getMunsellColor(this.color, this.value, this.chroma);
        if (this.canvasColor[0] === '#') {
            this.canvasColor = hex2rgb(this.canvasColor.split('#')[1]);
        }

        ctx.beginPath();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.processColor();
        ctx.lineWidth = this.stroke;
        ctx.lineCap = 'round';
        ctx.beginPath();
        this.penstrokes.image = canvas;
        this.svgOutput = '';
        this.svgPath = false;
        this.turtles.refreshCanvas();
    };

    this.doForward = function(steps) {
        this.processColor();
        if (!this.fillState) {
            ctx.lineWidth = this.stroke;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(this.container.x, this.container.y);
        }

        // old turtle point
        var ox = this.turtles.screenX2turtleX(this.container.x);
        var oy = this.turtles.screenY2turtleY(this.container.y);

        // new turtle point
        var angleRadians = this.orientation * Math.PI / 180.0;
        var nx = ox + Number(steps) * Math.sin(angleRadians);
        var ny = oy + Number(steps) * Math.cos(angleRadians);

        this.move(ox, oy, nx, ny, true);
        this.turtles.refreshCanvas();
    };

    this.doSetXY = function(x, y) {
        this.processColor();
        if (!this.fillState) {
            ctx.lineWidth = this.stroke;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(this.container.x, this.container.y);
        }

        // old turtle point
        var ox = this.turtles.screenX2turtleX(this.container.x);
        var oy = this.turtles.screenY2turtleY(this.container.y);

        // new turtle point
        var nx = Number(x)
        var ny = Number(y);

        this.move(ox, oy, nx, ny, true);
        this.turtles.refreshCanvas();
    };

    this.doArc = function(angle, radius) {
        // Break up arcs into chucks of 90 degrees or less (in order
        // to have exported SVG properly rendered).
        if (radius < 0) {
            radius = -radius;
        }
        var adeg = Number(angle);
        if (adeg < 0) {
            var factor = -1;
            adeg = -adeg;
        } else {
            var factor = 1;
        }
        var remainder = adeg % 90;
        var n = Math.floor(adeg / 90);
        for (var i = 0; i < n; i++) {
            this._doArcPart(90 * factor, radius);
        }
        if (remainder > 0) {
            this._doArcPart(remainder * factor, radius);
        }
    };

    this._doArcPart = function(angle, radius) {
        this.processColor();
        if (!this.fillState) {
            ctx.lineWidth = this.stroke;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(this.container.x, this.container.y);
        }

        var adeg = Number(angle);
        var angleRadians = (adeg / 180) * Math.PI;
        var oAngleRadians = (this.orientation / 180) * Math.PI;
        var r = Number(radius);

        // old turtle point
        ox = this.turtles.screenX2turtleX(this.container.x);
        oy = this.turtles.screenY2turtleY(this.container.y);

        if( adeg < 0 ) {
            var anticlockwise = true;
            adeg = -adeg;
            // center point for arc
            var cx = ox - Math.cos(oAngleRadians) * r;
            var cy = oy + Math.sin(oAngleRadians) * r;
            // new position of turtle
            var nx = cx + Math.cos(oAngleRadians + angleRadians) * r;
            var ny = cy - Math.sin(oAngleRadians + angleRadians) * r;
        } else {
            var anticlockwise = false;
            // center point for arc
            var cx = ox + Math.cos(oAngleRadians) * r;
            var cy = oy - Math.sin(oAngleRadians) * r;
            // new position of turtle
            var nx = cx - Math.cos(oAngleRadians + angleRadians) * r;
            var ny = cy + Math.sin(oAngleRadians + angleRadians) * r;
        }

        this.arc(cx, cy, ox, oy, nx, ny, r, oAngleRadians, oAngleRadians + angleRadians, anticlockwise, true);

        if (anticlockwise) {
            this.doRight(-adeg);
        } else {
            this.doRight(adeg);
        }
        this.turtles.refreshCanvas();
    };

    this.doShowImage = function(size, myImage) {
        // Add an image object to the canvas
        // Is there a JS test for a valid image path?
        if (myImage === null) {
            return;
        }

        var image = new Image();
        var that = this;

        image.onload = function() {
            var bitmap = new createjs.Bitmap(image);
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

    this.doShowURL = function(size, myURL) {
        // Add an image object from a URL to the canvas
        if (myURL === null) {
            return;
        }
        var image = new Image();
        image.src = myURL;
        var turtle = this;

        image.onload = function() {
            var bitmap = new createjs.Bitmap(image);
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

    this.doTurtleShell = function(size, myImage) {
        // Add image to turtle
        if (myImage === null) {
            return;
        }

        var image = new Image();
        image.src = myImage;
        var that = this;
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
            var bounds = that.container.getBounds();
            that.container.cache(bounds.x, bounds.y, bounds.width, bounds.height);

            // Recalculate the hit area as well.
            var hitArea = new createjs.Shape();
            hitArea.graphics.beginFill('#FFF').drawRect(0, 0, bounds.width, bounds.height);
            hitArea.x = -bounds.width / 2;
            hitArea.y = -bounds.height / 2;
            that.container.hitArea = hitArea;

            if (that.startBlock != null) {
                that.startBlock.container.removeChild(that.decorationBitmap);
                that.decorationBitmap = new createjs.Bitmap(myImage);
                that.startBlock.container.addChild(that.decorationBitmap);
                that.decorationBitmap.name = 'decoration';

                var width = that.startBlock.width;
                // FIXME: Why is the position off? Does it need a scale factor?
                that.decorationBitmap.x = width - 30 * that.startBlock.protoblock.scale / 2;
                that.decorationBitmap.y = 20 * that.startBlock.protoblock.scale / 2;
                that.decorationBitmap.scaleX = (27.5 / image.width) * that.startBlock.protoblock.scale / 2;
                that.decorationBitmap.scaleY = (27.5 / image.height) * that.startBlock.protoblock.scale / 2;
                that.decorationBitmap.scale = (27.5 / image.width) * that.startBlock.protoblock.scale / 2;
                that.startBlock.updateCache();
            }

            that.turtles.refreshCanvas();
        };
    };

    this.resizeDecoration = function(scale, width) {
        this.decorationBitmap.x = width - 30 * scale / 2;
        this.decorationBitmap.y = 35 * scale / 2;
        this.decorationBitmap.scaleX = this.decorationBitmap.scaleY = this.decorationBitmap.scale = 0.5 * scale / 2
    };

    this.doShowText = function(size, myText) {
        // Add a text object to the canvas
        if (myText === null) {
            return;
        }

        if (typeof(myText) !== 'string') {
            var textList = [myText.toString()];
        } else {
            var textList = myText.split('\\n');
        }

        var textSize = size.toString() + 'px ' + this.font;
        for (i = 0; i < textList.length; i++) {
            var text = new createjs.Text(textList[i], textSize, this.canvasColor);
            text.textAlign = 'left';
            text.textBaseline = 'alphabetic';
            this.turtles.stage.addChild(text);
            this.media.push(text);
            text.x = this.container.x;
            text.y = this.container.y + i * size;
            text.rotation = this.orientation;
            var xScaled = text.x * this.turtles.scale;
            var yScaled = text.y * this.turtles.scale;
            var sizeScaled = size * this.turtles.scale;
            this.svgOutput += '<text x="' + xScaled + '" y = "' + yScaled + '" fill="' + this.canvasColor + '" font-family = "' + this.font + '" font-size = "' + sizeScaled + '">' + myText + '</text>';
            this.turtles.refreshCanvas();
        }
    };

    this.doRight = function(degrees) {
        // Turn right and display corresponding turtle graphic.
        this.orientation += Number(degrees);
        while (this.orientation < 0) {
            this.orientation += 360;
        }

        this.orientation %= 360;
        this.bitmap.rotation = this.orientation;
        // We cannot update the cache during the 'tween'.
        if (this.blinkFinished) {
            this.updateCache();
        }
    };

    this.doSetHeading = function(degrees) {
        this.orientation = Number(degrees);
        while (this.orientation < 0) {
            this.orientation += 360;
        }

        this.orientation %= 360;
        this.bitmap.rotation = this.orientation;
        // We cannot update the cache during the 'tween'.
        if (this.blinkFinished) {
            this.updateCache();
        }
    };

    this.doSetFont = function(font) {
        this.font = font;
        this.updateCache();
    };

    this.doSetColor = function(color) {
        // Color sets hue but also selects maximum chroma.
        this.closeSVG();
        this.color = Number(color);
        var results = getcolor(this.color);
        this.canvasValue = results[0];
        this.canvasChroma = results[1];
        this.canvasColor = results[2];
        this.processColor();
    };

    this.doSetPenAlpha = function(alpha) {
        this.canvasAlpha = alpha;
    };

    this.processColor = function() {
        if (this.canvasColor[0] === '#') {
            this.canvasColor = hex2rgb(this.canvasColor.split('#')[1]);
        }

        var subrgb = this.canvasColor.substr(0, this.canvasColor.length - 2);
        ctx.strokeStyle = subrgb + this.canvasAlpha + ')';
        ctx.fillStyle = subrgb + this.canvasAlpha + ')';
    };

    this.doSetHue = function(hue) {
        this.closeSVG();
        this.color = Number(hue);
        this.canvasColor = getMunsellColor(this.color, this.value, this.chroma);
        this.processColor();
    };

    this.doSetValue = function(shade) {
        this.closeSVG();
        this.value = Number(shade);
        this.canvasColor = getMunsellColor(this.color, this.value, this.chroma);
        this.processColor();
    };

    this.doSetChroma = function(chroma) {
        this.closeSVG();
        this.chroma = Number(chroma);
        this.canvasColor = getMunsellColor(this.color, this.value, this.chroma);
        this.processColor();
    };

    this.doSetPensize = function(size) {
        this.closeSVG();
        this.stroke = size;
        ctx.lineWidth = this.stroke;
    };

    this.doPenUp = function() {
        this.closeSVG();
        this.penState = false;
    };

    this.doPenDown = function() {
        this.penState = true;
    };

    this.doStartFill = function() {
        /// start tracking points here
        ctx.beginPath();
        this.fillState = true;
    };

    this.doEndFill = function() {
        /// redraw the points with fill enabled
        ctx.fill();
        ctx.closePath();
        this.closeSVG();
        this.fillState = false;
    };

    this.doStartHollowLine = function() {
        /// start tracking points here
        this.hollowState = true;
    };

    this.doEndHollowLine = function() {
        /// redraw the points with fill enabled
        this.hollowState = false;
    };

    this.closeSVG = function() {
        if (this.svgPath) {
            // For the SVG output, we need to replace rgba() with
            // rgb();fill-opacity:1 and rgb();stroke-opacity:1

            var svgColor = this.canvasColor.replace(/rgba/g, 'rgb');
            svgColor = svgColor.substr(0, this.canvasColor.length - 4) + ');';

            this.svgOutput += '" style="stroke-linecap:round;fill:';
            if (this.fillState) {
                this.svgOutput += svgColor + 'fill-opacity:' + this.canvasAlpha + ';';
            } else {
                this.svgOutput += 'none;';
            }

            this.svgOutput += 'stroke:' + svgColor + 'stroke-opacity:' + this.canvasAlpha + ';';
            var strokeScaled = this.stroke * this.turtles.scale;
            this.svgOutput += 'stroke-width:' + strokeScaled + 'pt;" />';
            this.svgPath = false;
        }
    };

    // Internal function for creating cache.
    // Includes workaround for a race condition.
    this.createCache = function() {
        var that = this;
        that.bounds = that.container.getBounds();

        if (that.bounds == null) {
            setTimeout(function() {
                that.createCache();
            }, 200);
        } else {
            that.container.cache(that.bounds.x, that.bounds.y, that.bounds.width, that.bounds.height);
        }
    };

    // Internal function for creating cache.
    // Includes workaround for a race condition.
    this.updateCache = function() {
        var that = this;

        if (that.bounds == null) {
            console.log('Block container for ' + that.name + ' not yet ready.');
            setTimeout(function() {
                that.updateCache();
            }, 300);
        } else {
            that.container.updateCache();
            that.turtles.refreshCanvas();
        }
    };

    this.stopBlink = function() {
        if (this._blinkTimeout != null || !this.blinkFinished) {
            clearTimeout(this._blinkTimeout);
            this._blinkTimeout = null;

            this.bitmap.alpha = 1.0;
            this.bitmap.scaleX = this._sizeInUse;
            this.bitmap.scaleY = this.bitmap.scaleX;
            this.bitmap.scale = this.bitmap.scaleX;
            this.bitmap.rotation = this.orientation;
            this.skinChanged = this._isSkinChanged;
            var bounds = this.container.getBounds();
            this.container.cache(bounds.x, bounds.y, bounds.width, bounds.height);
            this.container.visible = true;
            this.turtles.refreshCanvas();
            this.blinkFinished = true;
        }
    };

    this.blink = function(duration, volume) {
        var that = this;
        this._sizeInUse = that.bitmap.scaleX;
        this._blinkTimeout = null;

        if (this.beforeBlinkSize == null) {
            this.beforeBlinkSize = that.bitmap.scaleX;
        }

        if (this.blinkFinished) {
            this._sizeInUse = that.bitmap.scaleX;
        } else {
            this._sizeInUse = this.beforeBlinkSize;
        }

        this.stopBlink();
        this.blinkFinished = false;
        this.container.uncache();
        var scalefactor = 60 / 55;
        var volumescalefactor = 4 * (volume + 200) / 1000;
        // Conversion: volume of 1 = 0.804, volume of 50 = 1, volume of 100 = 1.1
        this.bitmap.alpha = 0.5;
        this.bitmap.scaleX *= scalefactor * volumescalefactor;  // sizeInUse * scalefactor * volumescalefactor;
        this.bitmap.scaleY = this.bitmap.scaleX;
        this.bitmap.scale = this.bitmap.scaleX;
        this._isSkinChanged = this.skinChanged;
        this.skinChanged = true;
        createjs.Tween.get(this.bitmap).to({alpha: 1, scaleX: this._sizeInUse, scaleY: this._sizeInUse, scale: this._sizeInUse}, 500 / duration);

        this._blinkTimeout = setTimeout(function () {
            that.bitmap.alpha = 1.0;
            that.bitmap.scaleX = that._sizeInUse;
            that.bitmap.scaleY = that.bitmap.scaleX;
            that.bitmap.scale = that.bitmap.scaleX;
            that.bitmap.rotation = that.orientation;
            that.skinChanged = that._isSkinChanged;
            var bounds = that.container.getBounds();
            that.container.cache(bounds.x, bounds.y, bounds.width, bounds.height);
            that.blinkFinished = true;
            that.turtles.refreshCanvas();
        }, 500 / duration);  // 500 / duration == (1000 * (1 / duration)) / 2

    };
};


function Turtles () {
    this.stage = null;
    this.refreshCanvas = null;
    this.scale = 1.0;
    this._canvas = null;
    this._rotating = false;
    this._drum = false;

    // The list of all of our turtles, one for each start block.
    this.turtleList = [];

    this.setCanvas = function (canvas) {
        this._canvas = canvas;
        return this;
    };

    this.setStage = function (stage) {
        this.stage = stage;
        return this;
    };

    this.setRefreshCanvas = function (refreshCanvas) {
        this.refreshCanvas = refreshCanvas;
        return this;
    };

    this.setScale = function (scale) {
        this.scale = scale;
        return this;
    };

    this.setBlocks = function (blocks) {
        this.blocks = blocks;
        return this;
    };

    this.addDrum = function (startBlock, infoDict) {
        this._drum = true;
        this.add(startBlock, infoDict);
    };

    this.addTurtle = function (startBlock, infoDict) {
        this._drum = false;
        this.add(startBlock, infoDict);
    };

    this.add = function (startBlock, infoDict) {
        // Add a new turtle for each start block
        if (startBlock != null) {
            console.log('adding a new turtle ' + startBlock.name);
            if (startBlock.value !== this.turtleList.length) {
                startBlock.value = this.turtleList.length;
                console.log('turtle #' + startBlock.value);
            }
        } else {
            console.log('adding a new turtle startBlock is null');
        }

        var blkInfoAvailable = false;

        if (typeof(infoDict) === 'object') {
            if (Object.keys(infoDict).length === 8) {
                blkInfoAvailable = true;
            }
        }

        var i = this.turtleList.length;
        var turtleName = i.toString();
        var newTurtle = new Turtle(turtleName, this, this._drum);

        if (blkInfoAvailable) {
            newTurtle.x = infoDict['xcor'];
            newTurtle.y = infoDict['ycor'];
        }

        this.turtleList.push(newTurtle);

        // Each turtle needs its own canvas.
        newTurtle.imageContainer = new createjs.Container();
        this.stage.addChild(newTurtle.imageContainer);
        newTurtle.penstrokes = new createjs.Bitmap();
        this.stage.addChild(newTurtle.penstrokes);

        var turtleImage = new Image();
        i %= 10;
        newTurtle.container = new createjs.Container();
        this.stage.addChild(newTurtle.container);
        newTurtle.container.x = this.turtleX2screenX(newTurtle.x);
        newTurtle.container.y = this.turtleY2screenY(newTurtle.y);

        var hitArea = new createjs.Shape();
        hitArea.graphics.beginFill('#FFF').drawEllipse(-27, -27, 55, 55);
        hitArea.x = 0;
        hitArea.y = 0;
        newTurtle.container.hitArea = hitArea;

        function __processTurtleBitmap(that, name, bitmap, startBlock) {
            newTurtle.bitmap = bitmap;
            newTurtle.bitmap.regX = 27 | 0;
            newTurtle.bitmap.regY = 27 | 0;
            newTurtle.bitmap.cursor = 'pointer';
            newTurtle.container.addChild(newTurtle.bitmap);
            newTurtle.createCache();

            newTurtle.startBlock = startBlock;
            if (startBlock != null) {
                startBlock.updateCache();
                newTurtle.decorationBitmap = newTurtle.bitmap.clone();
                startBlock.container.addChild(newTurtle.decorationBitmap);
                newTurtle.decorationBitmap.name = 'decoration';
                var width = startBlock.width;

                // Race condition with collapse/expand bitmap generation.
                // if (startBlock.expandBitmap == null) {
                //     var offset = 75;
                // } else {
                var offset = 40;
                // }

                newTurtle.decorationBitmap.x = width - offset * startBlock.protoblock.scale / 2;

                newTurtle.decorationBitmap.y = 35 * startBlock.protoblock.scale / 2;
                newTurtle.decorationBitmap.scaleX = newTurtle.decorationBitmap.scaleY = newTurtle.decorationBitmap.scale = 0.5 * startBlock.protoblock.scale / 2
                startBlock.updateCache();
            }

            that.refreshCanvas();
        };

        if (this._drum) {
           var artwork = DRUMSVG;
        } else {
           var artwork = TURTLESVG;
        }

        if (sugarizerCompatibility.isInsideSugarizer()) {
            this._makeTurtleBitmap(artwork.replace(/fill_color/g, sugarizerCompatibility.xoColor.fill).replace(/stroke_color/g, sugarizerCompatibility.xoColor.stroke), 'turtle', __processTurtleBitmap, startBlock);
        } else {
            this._makeTurtleBitmap(artwork.replace(/fill_color/g, FILLCOLORS[i]).replace(/stroke_color/g, STROKECOLORS[i]), 'turtle', __processTurtleBitmap, startBlock);
        }

        newTurtle.color = i * 10;
        newTurtle.canvasColor = getMunsellColor(newTurtle.color, DEFAULTVALUE, DEFAULTCHROMA);
        var that = this;

        newTurtle.container.on('mousedown', function (event) {
            if (that._rotating) {
                return;
            }

            var offset = {
                x: newTurtle.container.x - (event.stageX / that.scale),
                y: newTurtle.container.y - (event.stageY / that.scale)
            }

            newTurtle.container.removeAllEventListeners('pressmove');
            newTurtle.container.on('pressmove', function (event) {
                if (newTurtle.running) {
                    return;
                }

                newTurtle.container.x = (event.stageX / that.scale) + offset.x;
                newTurtle.container.y = (event.stageY / that.scale) + offset.y;
                newTurtle.x = that.screenX2turtleX(newTurtle.container.x);
                newTurtle.y = that.screenY2turtleY(newTurtle.container.y);
                that.refreshCanvas();
            });
        });

        newTurtle.container.on('click', function (event) {
            // If turtles listen for clicks then they can be used as buttons.
            console.log('--> [click' + newTurtle.name + ']');
            that.stage.dispatchEvent('click' + newTurtle.name);
        });

        newTurtle.container.on('mouseover', function (event) {
            if (newTurtle.running) {
                return;
            }

            newTurtle.container.scaleX *= 1.2;
            newTurtle.container.scaleY = newTurtle.container.scaleX;
            newTurtle.container.scale = newTurtle.container.scaleX;
            that.refreshCanvas();
        });

        newTurtle.container.on('mouseout', function (event) {
            if (newTurtle.running) {
                return;
            }

            newTurtle.container.scaleX /= 1.2;
            newTurtle.container.scaleY = newTurtle.container.scaleX;
            newTurtle.container.scale = newTurtle.container.scaleX;
            that.refreshCanvas();
        });

        document.getElementById('loader').className = '';

        setTimeout(function () {
            if (blkInfoAvailable) {
                newTurtle.doSetHeading(infoDict['heading']);
                newTurtle.doSetPensize(infoDict['pensize']);
                newTurtle.doSetChroma(infoDict['grey']);
                newTurtle.doSetValue(infoDict['shade']);
                newTurtle.doSetColor(infoDict['color']);
            }
        }, 1000);

        this.refreshCanvas();
    };

    this._makeTurtleBitmap = function (data, name, callback, extras) {
        // Async creation of bitmap from SVG data
        // Works with Chrome, Safari, Firefox (untested on IE)
        var img = new Image();
        var that = this;

        img.onload = function () {
            complete = true;
            var bitmap = new createjs.Bitmap(img);
            callback(that, name, bitmap, extras);
        };

        img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(data)));
    };

    this.screenX2turtleX = function (x) {
        return x - (this._canvas.width / (2.0 * this.scale));
    };

    this.screenY2turtleY = function (y) {
        return this.invertY(y);
    };

    this.turtleX2screenX = function (x) {
        return (this._canvas.width / (2.0 * this.scale)) + x;
    };

    this.turtleY2screenY = function (y) {
        return this.invertY(y);
    };

    this.invertY = function (y) {
        return this._canvas.height / (2.0 * this.scale) - y;
    };

    this.markAsStopped = function () {
        for (var turtle in this.turtleList) {
            this.turtleList[turtle].running = false;
            // Make sure the blink is really stopped.
            // this.turtleList[turtle].stopBlink();
        }

        this.refreshCanvas();
    };

    this.running = function () {
        for (var turtle in this.turtleList) {
            if (this.turtleList[turtle].running) {
                return true;
            }
        }
        return false;
    };
};


// Queue entry for managing running blocks.
function Queue (blk, count, parentBlk, args) {
    this.blk = blk;
    this.count = count;
    this.parentBlk = parentBlk;
    this.args = args
};


function hex2rgb (hex) {
    var bigint = parseInt(hex, 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;

    return 'rgba(' + r + ',' + g + ',' + b + ',1)';
};
