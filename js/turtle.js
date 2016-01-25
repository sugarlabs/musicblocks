// Copyright (c) 2014, 2015 Walter Bender
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
var DEFAULTCOLOR = 0;
var DEFAULTVALUE = 50;
var DEFAULTCHROMA = 100;
var DEFAULTSTROKE = 5;
var DEFAULTFONT = 'sans-serif';

// Turtle sprite
var turtlePath = 'images/turtle.svg';
var turtleBasePath = 'images/';

// Default beats per minute
var TONEBPM = 240;  // Seems to be the default.
var TARGETBPM = 90;  // What we'd like to use for beats per minute

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

    // Which start block is assocated with this turtle?
    this.startBlock = null;
    this.decorationBitmap = null;  // Start block decoration.

    // Queue of blocks this turtle is executing.
    this.queue = [];

    // Listeners
    this.listeners = {};

    // Things used for what the turtle draws.
    this.drawingCanvas = null;
    this.imageContainer = null;
    this.svgOutput = '';
    // Are we currently drawing a path?
    this.svgPath = false;
    this.color = DEFAULTCOLOR;
    this.value = DEFAULTVALUE;
    this.chroma = DEFAULTCHROMA;
    this.stroke = DEFAULTSTROKE;
    this.canvasColor = '#ff0031';
    this.orientation = 0;
    this.fillState = false;
    this.hollowState = false;
    this.penState = true;
    this.font = DEFAULTFONT;
    this.media = [];  // Media (text, images) we need to remove on clear.

    this.bpm = TARGETBPM;
    this.bpmFactor = TONEBPM / TARGETBPM;

    this.currentbpm = [];

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
            this.drawingCanvas.graphics.setStrokeStyle(this.stroke, 'round', 'round');
            // Draw a hollow line.
            if (savedStroke < 3) {
                var step = 0.5;
            } else {
                var step = (savedStroke - 2) / 2.;
            }

            var capAngleRadians = (this.orientation - 90) * Math.PI / 180.0;
            var dx = step * Math.sin(capAngleRadians);
            var dy = -step * Math.cos(capAngleRadians);

            this.drawingCanvas.graphics.moveTo(ox + dx, oy + dy);
            var oxScaled = (ox + dx) * this.turtles.scale;
            var oyScaled = (oy + dy) * this.turtles.scale;
            this.svgOutput += '<path d="M ' + oxScaled + ',' + oyScaled + ' ';

            this.drawingCanvas.graphics.lineTo(nx + dx, ny + dy);
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
            this.drawingCanvas.graphics.arc(cx, cy, step, sa, ea, false);

            var nxScaled = (nx + dx) * this.turtles.scale;
            var nyScaled = (ny + dy) * this.turtles.scale;

            var radiusScaled = step * this.turtles.scale;

            // Simulate an arc with line segments since Tinkercad
            // cannot import SVG arcs reliably.
            // Replaces:
            // this.svgOutput += 'A ' + radiusScaled + ',' + radiusScaled + ' 0 0 1 ' + nxScaled + ',' + nyScaled + ' ';
            // this.svgOutput += 'M ' + nxScaled + ',' + nyScaled + ' ';
            function svgArc(me, nsteps, cx, cy, radius, sa) {
                var a = sa;
                var da = Math.PI / nsteps;
                for (var i = 0; i < nsteps; i++) {
                    var nx = cx + radius * Math.cos(a);
                    var ny = cy + radius * Math.sin(a);
                    me.svgOutput += nx + ',' + ny + ' ';
                    a += da;
                }
            }

            steps = Math.max(Math.floor(savedStroke, 1));
            svgArc(this, steps, cx * this.turtles.scale, cy * this.turtles.scale, radiusScaled, sa);
            this.svgOutput += nxScaled + ',' + nyScaled + ' ';

            this.drawingCanvas.graphics.lineTo(ox + dx, oy + dy);
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
            this.drawingCanvas.graphics.arc(cx, cy, step, sa, ea, false);

            var nxScaled = (ox + dx) * this.turtles.scale;
            var nyScaled = (oy + dy) * this.turtles.scale;

            var radiusScaled = step * this.turtles.scale;
            svgArc(this, steps, cx * this.turtles.scale, cy * this.turtles.scale, radiusScaled, sa);
            this.svgOutput += nxScaled + ',' + nyScaled + ' ';

            this.closeSVG();

            // restore stroke.
            this.stroke = savedStroke;
            this.drawingCanvas.graphics.setStrokeStyle(this.stroke, 'round', 'round');
            this.drawingCanvas.graphics.moveTo(nx, ny);
        } else if (this.penState) {
            this.drawingCanvas.graphics.lineTo(nx, ny);
            if (!this.svgPath) {
                this.svgPath = true;
                var oxScaled = ox * this.turtles.scale;
                var oyScaled = oy * this.turtles.scale;
                this.svgOutput += '<path d="M ' + oxScaled + ',' + oyScaled + ' ';
            }
            var nxScaled = nx * this.turtles.scale;
            var nyScaled = ny * this.turtles.scale;
            this.svgOutput += nxScaled + ',' + nyScaled + ' ';
        } else {
            this.drawingCanvas.graphics.moveTo(nx, ny);
        }
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
    }

    this.rename = function(name) {
        this.name = name;

        // Use the name on the label of the start block.
        if (this.startBlock != null) {
            this.startBlock.overrideName = this.name;
            if (this.name == _('start drum')) {
                this.startBlock.collapseText.text = _('drum');
            } else {
                this.startBlock.collapseText.text = this.name;
            }
	    this.startBlock.regenerateArtwork(false);
            this.startBlock.value = this.turtles.turtleList.indexOf(this);
        }
    }
    
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
            this.drawingCanvas.graphics.setStrokeStyle(this.stroke, 'round', 'round');
            // Draw a hollow line.
            if (savedStroke < 3) {
                var step = 0.5;
            } else {
                var step = (savedStroke - 2) / 2.;
            }

            // Simulate an arc with line segments since Tinkercad
            // cannot import SVG arcs reliably.
            function svgArc(me, nsteps, cx, cy, radius, sa, ea) {
                var a = sa;
                var da = (ea - sa) / nsteps;
                for (var i = 0; i < nsteps; i++) {
                    var nx = cx + radius * Math.cos(a);
                    var ny = cy + radius * Math.sin(a);
                    me.svgOutput += nx + ',' + ny + ' ';
                    a += da;
                }
            }

            var capAngleRadians = (this.orientation + 90) * Math.PI / 180.0;
            var dx = step * Math.sin(capAngleRadians);
            var dy = -step * Math.cos(capAngleRadians);

            if (anticlockwise) {
                this.drawingCanvas.graphics.moveTo(ox + dx, oy + dy);
                var oxScaled = (ox + dx) * this.turtles.scale;
                var oyScaled = (oy + dy) * this.turtles.scale;
            } else {
                this.drawingCanvas.graphics.moveTo(ox - dx, oy - dy);
                var oxScaled = (ox - dx) * this.turtles.scale;
                var oyScaled = (oy - dy) * this.turtles.scale;
            }
            this.svgOutput += '<path d="M ' + oxScaled + ',' + oyScaled + ' ';

            this.drawingCanvas.graphics.arc(cx, cy, radius + step, sa, ea, anticlockwise);
            nsteps = Math.max(Math.floor(radius * Math.abs(sa - ea) / 2), 2);
            steps = Math.max(Math.floor(savedStroke, 1));

            svgArc(this, nsteps, cx * this.turtles.scale, cy * this.turtles.scale, (radius + step) * this.turtles.scale, sa, ea);

            var capAngleRadians = (this.orientation + 90) * Math.PI / 180.0;
            var dx = step * Math.sin(capAngleRadians);
            var dy = -step * Math.cos(capAngleRadians);

            var cx1 = nx;
            var cy1 = ny;
            var sa1 = ea;
            var ea1 = ea + Math.PI;
            this.drawingCanvas.graphics.arc(cx1, cy1, step, sa1, ea1, anticlockwise);
            svgArc(this, steps, cx1 * this.turtles.scale, cy1 * this.turtles.scale, step * this.turtles.scale, sa1, ea1);
            this.drawingCanvas.graphics.arc(cx, cy, radius - step, ea, sa, !anticlockwise);
            svgArc(this, nsteps, cx * this.turtles.scale, cy * this.turtles.scale, (radius - step) * this.turtles.scale, ea, sa);
            var cx2 = ox;
            var cy2 = oy;
            var sa2 = sa - Math.PI;
            var ea2 = sa;
            this.drawingCanvas.graphics.arc(cx2, cy2, step, sa2, ea2, anticlockwise);
            svgArc(this, steps, cx2 * this.turtles.scale, cy2 * this.turtles.scale, step * this.turtles.scale, sa2, ea2);
            this.closeSVG();

            // restore stroke.
            this.stroke = savedStroke;
            this.drawingCanvas.graphics.setStrokeStyle(this.stroke, 'round', 'round');
            this.drawingCanvas.graphics.moveTo(nx, ny);
        } else if (this.penState) {
            this.drawingCanvas.graphics.arc(cx, cy, radius, sa, ea, anticlockwise);
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
        } else {
            this.drawingCanvas.graphics.moveTo(nx, ny);
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
    }

    // Turtle functions
    this.doClear = function() {
        // Reset turtle.
        this.x = 0;
        this.y = 0;
        this.orientation = 0.0;
        var i = this.turtles.turtleList.indexOf(this) % 10;
        this.color = i * 10;
        this.value = DEFAULTVALUE;
        this.chroma = DEFAULTCHROMA;
        this.stroke = DEFAULTSTROKE;
        this.font = DEFAULTFONT;
        this.container.x = this.turtles.turtleX2screenX(this.x);
        this.container.y = this.turtles.turtleY2screenY(this.y);
        if (this.drum) {
            if (this.name != _('start drum')) {
                this.rename(_('start drum'));
            }
        } else {
            if (this.name != _('start')) {
                this.rename(_('start'));
            }
        }

        if (this.skinChanged) {
            this.doTurtleShell(55, turtleBasePath + 'turtle-' + i.toString() + '.svg');
            this.skinChanged = false;
        }

        this.bitmap.rotation = this.orientation;
        this.container.updateCache();

        // Clear all media.
        for (i = 0; i < this.media.length; i++) {
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
        this.drawingCanvas.graphics.clear();
        this.drawingCanvas.graphics.beginStroke(this.canvasColor);
        this.drawingCanvas.graphics.setStrokeStyle(this.stroke, 'round', 'round');

        this.svgOutput = '';
        this.svgPath = false;

        this.turtles.refreshCanvas();
    }

    this.doForward = function(steps) {
        if (!this.fillState) {
            this.drawingCanvas.graphics.beginStroke(this.canvasColor);
            this.drawingCanvas.graphics.setStrokeStyle(this.stroke, 'round', 'round');
            this.drawingCanvas.graphics.moveTo(this.container.x, this.container.y);
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
    }

    this.doSetXY = function(x, y) {
        if (!this.fillState) {
            this.drawingCanvas.graphics.beginStroke(this.canvasColor);
            this.drawingCanvas.graphics.setStrokeStyle(this.stroke, 'round', 'round');
            this.drawingCanvas.graphics.moveTo(this.container.x, this.container.y);
        }

        // old turtle point
        var ox = this.turtles.screenX2turtleX(this.container.x);
        var oy = this.turtles.screenY2turtleY(this.container.y);

        // new turtle point
        var nx = Number(x)
        var ny = Number(y);

        this.move(ox, oy, nx, ny, true);
        this.turtles.refreshCanvas();
    }

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
            this.doArcPart(90 * factor, radius);
        }
        if (remainder > 0) {
            this.doArcPart(remainder * factor, radius);
        }
    }

    this.doArcPart = function(angle, radius) {
        if (!this.fillState) {
            this.drawingCanvas.graphics.beginStroke(this.canvasColor);
            this.drawingCanvas.graphics.setStrokeStyle(this.stroke, 'round', 'round');
            this.drawingCanvas.graphics.moveTo(this.container.x, this.container.y);
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
    }

    this.doShowImage = function(size, myImage) {
        // Add an image object to the canvas
        // Is there a JS test for a valid image path?
        if (myImage == null) {
            return;
        }
        var image = new Image();
        var me = this;
        image.onload = function() {
            var bitmap = new createjs.Bitmap(image);
            me.imageContainer.addChild(bitmap);
            me.media.push(bitmap);
            bitmap.scaleX = Number(size) / image.width;
            bitmap.scaleY = bitmap.scaleX;
            bitmap.scale = bitmap.scaleX;
            bitmap.x = me.container.x;
            bitmap.y = me.container.y;
            bitmap.regX = image.width / 2;
            bitmap.regY = image.height / 2;
            bitmap.rotation = me.orientation;
            me.turtles.refreshCanvas();
        }
        image.src = myImage;
    }

    this.doShowURL = function(size, myURL) {
        // Add an image object from a URL to the canvas
        if (myURL == null) {
            return;
        }
        var image = new Image();
        image.src = myURL;
        var me = this;
        image.onload = function() {
            var bitmap = new createjs.Bitmap(image);
            me.imageContainer.addChild(bitmap);
            me.media.push(bitmap);
            bitmap.scaleX = Number(size) / image.width;
            bitmap.scaleY = bitmap.scaleX;
            bitmap.scale = bitmap.scaleX;
            bitmap.x = me.container.x;
            bitmap.y = me.container.y;
            bitmap.regX = image.width / 2;
            bitmap.regY = image.height / 2;
            bitmap.rotation = me.orientation;
            me.turtles.refreshCanvas();
        }
    }

    this.doTurtleShell = function(size, myImage) {
        // Add image to turtle
        if (myImage == null) {
            return;
        }
        var image = new Image();
        image.src = myImage;
        var me = this;
        image.onload = function() {
            me.container.removeChild(me.bitmap);
            me.bitmap = new createjs.Bitmap(image);
            me.container.addChild(me.bitmap);
            me.bitmap.scaleX = Number(size) / image.width;
            me.bitmap.scaleY = me.bitmap.scaleX;
            me.bitmap.scale = me.bitmap.scaleX;
            me.bitmap.x = 0;
            me.bitmap.y = 0;
            me.bitmap.regX = image.width / 2;
            me.bitmap.regY = image.height / 2;
            me.bitmap.rotation = me.orientation;
            me.skinChanged = true;

            me.container.uncache();
            var bounds = me.container.getBounds();
            me.container.cache(bounds.x, bounds.y, bounds.width, bounds.height);

            // Recalculate the hit area as well.
            var hitArea = new createjs.Shape();
            hitArea.graphics.beginFill('#FFF').drawRect(0, 0, bounds.width, bounds.height);
            hitArea.x = -bounds.width / 2;
            hitArea.y = -bounds.height / 2;
            me.container.hitArea = hitArea;

            if (me.startBlock != null) {
                me.startBlock.container.removeChild(me.decorationBitmap);
                me.decorationBitmap = new createjs.Bitmap(myImage);
                me.startBlock.container.addChild(me.decorationBitmap);
                me.decorationBitmap.name = 'decoration';
                var bounds = me.startBlock.container.getBounds();
                // FIXME: Why is the position off? Does it need a scale factor?
                me.decorationBitmap.x = bounds.width - 50 * me.startBlock.protoblock.scale / 2;
                me.decorationBitmap.y = 20 * me.startBlock.protoblock.scale / 2;
                me.decorationBitmap.scaleX = (27.5 / image.width) * me.startBlock.protoblock.scale / 2;
                me.decorationBitmap.scaleY = (27.5 / image.height) * me.startBlock.protoblock.scale / 2;
                me.decorationBitmap.scale = (27.5 / image.width) * me.startBlock.protoblock.scale / 2;
                me.startBlock.container.updateCache();
            }
            me.turtles.refreshCanvas();
        }
    }

    this.resizeDecoration = function(scale, width) {
        this.decorationBitmap.x = width - 30 * scale / 2;
        this.decorationBitmap.y = 35 * scale / 2;
        this.decorationBitmap.scaleX = this.decorationBitmap.scaleY = this.decorationBitmap.scale = 0.5 * scale / 2
    }

    this.doShowText = function(size, myText) {
        // Add a text or image object to the canvas

        var textSize = size.toString() + 'px ' + this.font;
        var text = new createjs.Text(myText.toString(), textSize, this.canvasColor);
        text.textAlign = 'left';
        text.textBaseline = 'alphabetic';
        this.turtles.stage.addChild(text);
        this.media.push(text);
        text.x = this.container.x;
        text.y = this.container.y;
        text.rotation = this.orientation;
        var xScaled = text.x * this.turtles.scale;
        var yScaled = text.y * this.turtles.scale;
        var sizeScaled = size * this.turtles.scale;
        this.svgOutput += '<text x="' + xScaled + '" y = "' + yScaled + '" fill="' + this.canvasColor + '" font-family = "' + this.font + '" font-size = "' + sizeScaled + '">' + myText + '</text>';
        this.turtles.refreshCanvas();
    }

    this.doRight = function(degrees) {
        // Turn right and display corresponding turtle graphic.
        this.orientation += Number(degrees);
        this.orientation %= 360;
        this.bitmap.rotation = this.orientation;
        this.container.updateCache();
        this.turtles.refreshCanvas();
    }

    this.doSetHeading = function(degrees) {
        this.orientation = Number(degrees);
        this.orientation %= 360;
        this.bitmap.rotation = this.orientation;
        this.turtles.refreshCanvas();
        this.container.updateCache();
    }

    this.doSetFont = function(font) {
        this.font = font;
        this.turtles.refreshCanvas();
        this.container.updateCache();
    }


    this.doSetColor = function(color) {
        // Color sets hue but also selects maximum chroma.
        this.closeSVG();
        this.color = Number(color);
        var results = getcolor(this.color);
        this.canvasValue = results[0];
        this.canvasChroma = results[1];
        this.canvasColor = results[2];
        this.drawingCanvas.graphics.beginStroke(this.canvasColor);
    }

    this.doSetHue = function(hue) {
        this.closeSVG();
        this.color = Number(hue);
        this.canvasColor = getMunsellColor(this.color, this.value, this.chroma);
        this.drawingCanvas.graphics.beginStroke(this.canvasColor);
    }

    this.doSetValue = function(shade) {
        this.closeSVG();
        this.value = Number(shade);
        this.canvasColor = getMunsellColor(this.color, this.value, this.chroma);
        this.drawingCanvas.graphics.beginStroke(this.canvasColor);
    }

    this.doSetChroma = function(chroma) {
        this.closeSVG();
        this.chroma = Number(chroma);
        this.canvasColor = getMunsellColor(this.color, this.value, this.chroma);
        this.drawingCanvas.graphics.beginStroke(this.canvasColor);
    }

    this.doSetPensize = function(size) {
        this.closeSVG();
        this.stroke = size;
        this.drawingCanvas.graphics.setStrokeStyle(this.stroke, 'round', 'round');
    }

    this.doPenUp = function() {
        this.closeSVG();
        this.penState = false;
    }

    this.doPenDown = function() {
        this.penState = true;
    }

    this.doStartFill = function() {
        /// start tracking points here
        this.drawingCanvas.graphics.beginFill(this.canvasColor);
        this.fillState = true;
    }

    this.doEndFill = function() {
        /// redraw the points with fill enabled
        this.drawingCanvas.graphics.endFill();
        this.closeSVG();
        this.fillState = false;
    }

    this.doStartHollowLine = function() {
        /// start tracking points here
        this.hollowState = true;
    }

    this.doEndHollowLine = function() {
        /// redraw the points with fill enabled
        this.hollowState = false;
    }

    this.closeSVG = function() {
        if (this.svgPath) {
            this.svgOutput += '" style="stroke-linecap:round;fill:';
            if (this.fillState) {
                this.svgOutput += this.canvasColor + ';';
            } else {
                this.svgOutput += 'none;';
            }
            this.svgOutput += 'stroke:' + this.canvasColor + ';';
            var strokeScaled = this.stroke * this.turtles.scale;
            this.svgOutput += 'stroke-width:' + strokeScaled + 'pt;" />';
            this.svgPath = false;
        }
    }
};


function Turtles(canvas, stage, refreshCanvas) {
    this.canvas = canvas;
    this.stage = stage;
    this.refreshCanvas = refreshCanvas;
    this.scale = 1.0;
    this.rotating = false;
    this.drum = false;

    this.setScale = function(scale) {
        this.scale = scale;
    }

    this.setBlocks = function(blocks) {
        this.blocks = blocks;
    }

    // The list of all of our turtles, one for each start block.
    this.turtleList = [];

    this.addDrum = function(startBlock, infoDict) {
        this.drum = true;
        this.add(startBlock, infoDict);
    }

    this.addTurtle = function(startBlock, infoDict) {
        this.drum = false;
        this.add(startBlock, infoDict);
    }

    this.add = function(startBlock, infoDict) {
        // Add a new turtle for each start block
        if (startBlock != null) {
            console.log('adding a new turtle ' + startBlock.name);
            if (startBlock.value != this.turtleList.length) {
                startBlock.value = this.turtleList.length;
                console.log('turtle #' + startBlock.value);
            }
        } else {
            console.log('adding a new turtle startBlock is null');
        };

        var blkInfoAvailable = false;

        if (typeof(infoDict) == 'object') {
          if (Object.keys(infoDict).length == 8) {
            blkInfoAvailable = true;
          }
        }

        var i = this.turtleList.length;
        var turtleName = i.toString();
        var myTurtle = new Turtle(turtleName, this, this.drum);

        if (blkInfoAvailable) {
            myTurtle.x = infoDict['xcor'];
            myTurtle.y = infoDict['ycor'];
        }

        this.turtleList.push(myTurtle);

        // Each turtle needs its own canvas.
        myTurtle.imageContainer = new createjs.Container();
        console.log('creating image container');
        this.stage.addChild(myTurtle.imageContainer);
        myTurtle.drawingCanvas = new createjs.Shape();
        this.stage.addChild(myTurtle.drawingCanvas);
        // In theory, this prevents some unnecessary refresh of the
        // canvas.
        myTurtle.drawingCanvas.tickEnabled = false;

        var turtleImage = new Image();
        i %= 10;
        myTurtle.container = new createjs.Container();
        this.stage.addChild(myTurtle.container);
        myTurtle.container.x = this.turtleX2screenX(myTurtle.x);
        myTurtle.container.y = this.turtleY2screenY(myTurtle.y);

        var hitArea = new createjs.Shape();
        hitArea.graphics.beginFill('#FFF').drawEllipse(-27, -27, 55, 55);
        hitArea.x = 0;
        hitArea.y = 0;
        myTurtle.container.hitArea = hitArea;

        function processTurtleBitmap(me, name, bitmap, startBlock) {
            myTurtle.bitmap = bitmap;
            myTurtle.bitmap.regX = 27 | 0;
            myTurtle.bitmap.regY = 27 | 0;
            myTurtle.bitmap.cursor = 'pointer';
            myTurtle.container.addChild(myTurtle.bitmap);

            var bounds = myTurtle.container.getBounds();
            myTurtle.container.cache(bounds.x, bounds.y, bounds.width, bounds.height);

            myTurtle.startBlock = startBlock;
            if (startBlock != null) {
                myTurtle.decorationBitmap = myTurtle.bitmap.clone();
                startBlock.container.addChild(myTurtle.decorationBitmap);
                myTurtle.decorationBitmap.name = 'decoration';
                var bounds = startBlock.container.getBounds();
                myTurtle.decorationBitmap.x = bounds.width - 40 * startBlock.protoblock.scale / 2;
                myTurtle.decorationBitmap.y = 35 * startBlock.protoblock.scale / 2;
                myTurtle.decorationBitmap.scaleX = myTurtle.decorationBitmap.scaleY = myTurtle.decorationBitmap.scale = 0.5 * startBlock.protoblock.scale / 2
                startBlock.container.updateCache();
            }

            me.refreshCanvas();
        }

        if (this.drum) {
           var artwork = DRUMSVG;
        } else {
           var artwork = TURTLESVG;
        }

        if (sugarizerCompatibility.isInsideSugarizer()) {
          makeTurtleBitmap(this, artwork.replace(/fill_color/g, sugarizerCompatibility.xoColor.fill).replace(/stroke_color/g, sugarizerCompatibility.xoColor.stroke), 'turtle', processTurtleBitmap, startBlock);
        } else {
          makeTurtleBitmap(this, artwork.replace(/fill_color/g, FILLCOLORS[i]).replace(/stroke_color/g, STROKECOLORS[i]), 'turtle', processTurtleBitmap, startBlock);
        }

        myTurtle.color = i * 10;
        myTurtle.canvasColor = getMunsellColor(myTurtle.color, DEFAULTVALUE, DEFAULTCHROMA);
        var turtles = this;

        myTurtle.container.on('mousedown', function(event) {
            if (turtles.rotating) {
                return;
            }

            var offset = {
                x: myTurtle.container.x - (event.stageX / turtles.scale),
                y: myTurtle.container.y - (event.stageY / turtles.scale)
            }

            myTurtle.container.on('pressmove', function(event) {
                if (myTurtle.running) {
                    return;
                }
                myTurtle.container.x = (event.stageX / turtles.scale) + offset.x;
                myTurtle.container.y = (event.stageY / turtles.scale) + offset.y;
                myTurtle.x = turtles.screenX2turtleX(myTurtle.container.x);
                myTurtle.y = turtles.screenY2turtleY(myTurtle.container.y);
                turtles.refreshCanvas();
            });
        });

        myTurtle.container.on('click', function(event) {
            // If turtles listen for clicks then they can be used as buttons.
            turtles.stage.dispatchEvent('click' + myTurtle.name);
        });

        myTurtle.container.on('mouseover', function(event) {
            myTurtle.bitmap.scaleX = 1.2;
            myTurtle.bitmap.scaleY = 1.2;
            myTurtle.bitmap.scale = 1.2;
            turtles.refreshCanvas();
        });

        myTurtle.container.on('mouseout', function(event) {
            myTurtle.bitmap.scaleX = 1;
            myTurtle.bitmap.scaleY = 1;
            myTurtle.bitmap.scale = 1;
            turtles.refreshCanvas();
        });

        document.getElementById('loader').className = '';
        setTimeout(function() {
            if (blkInfoAvailable) {
                myTurtle.doSetHeading(infoDict['heading']);
                myTurtle.doSetPensize(infoDict['pensize']);
                myTurtle.doSetChroma(infoDict['grey']);
                myTurtle.doSetValue(infoDict['shade']);
                myTurtle.doSetColor(infoDict['color']);
            }
        }, 1000);
        this.refreshCanvas();
    }

    this.screenX2turtleX = function(x) {
        return x - (this.canvas.width / (2.0 * this.scale));
    }

    this.screenY2turtleY = function(y) {
        return this.invertY(y);
    }

    this.turtleX2screenX = function(x) {
        return (this.canvas.width / (2.0 * this.scale)) + x;
    }

    this.turtleY2screenY = function(y) {
        return this.invertY(y);
    }

    this.invertY = function(y) {
        return this.canvas.height / (2.0 * this.scale) - y;
    }

    this.markAsStopped = function() {
        for (turtle in this.turtleList) {
            this.turtleList[turtle].running = false;
        }
    }

    this.running = function() {
        for (turtle in this.turtleList) {
            if (this.turtleList[turtle].running) {
                return true;
            }
        }
        return false;
    }
}

// Queue entry for managing running blocks.
function Queue (blk, count, parentBlk, args) {
    this.blk = blk;
    this.count = count;
    this.parentBlk = parentBlk;
    this.args = args
}


function makeTurtleBitmap(me, data, name, callback, extras) {
    // Async creation of bitmap from SVG data
    // Works with Chrome, Safari, Firefox (untested on IE)
    var img = new Image();
    img.onload = function () {
        complete = true;
        bitmap = new createjs.Bitmap(img);
        callback(me, name, bitmap, extras);
    };
    img.src = 'data:image/svg+xml;base64,' + window.btoa(
        unescape(encodeURIComponent(data)));
};
