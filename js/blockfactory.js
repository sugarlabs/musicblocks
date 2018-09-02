// Copyright (c) 2015-18 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// Borrowing loosely from tasprite_factory.py in the Python version.


function SVG() {

    // Interface to the graphical representation of blocks, turtles,
    // palettes, etc. on screen.
    // Terms used here:
    // docks -- list of connection points of a block to other blocks
    // innies -- right hand side docks of a block, argument slots
    // outie -- left hand side dock of a block
    // slot -- top dock of a block that can be attached to other blocks
    // cap -- top dock of a block that cannot be attached to other blocks
    // tab -- bottom dock of a block if other blocks can be attached
    // tail -- bottom dock of a block if no other blocks can be attached
    // arm -- connection point of a branching block (if-then, loops) where
    //     inner blocks are attached
    // else -- optional second `arm' for if-then-else blocks

    this.init = function() {
        this._x = 0;
        this._y = 0;
        this._minX = 10000;
        this._minY = 10000;
        this._maxX = -10000;
        this._maxY = -10000;
        this._width = 0;
        this._height = 0;
        this.docks = [];
        this._scale = 1;
        this._orientation = 0;
        this._radius = 8;
        this._strokeWidth = 1;
        this._innies = [];
        this._outie = false;
        this._innieX1 = (9 - this._strokeWidth) / 2;
        this._innieY1 = 3;
        this._innieX2 = (9 - this._strokeWidth) / 2;
        this._innieY2 = (9 - this._strokeWidth) / 2;
        this._inniesSpacer = 9;
        this._padding = this._innieY1 + this._strokeWidth;
        this._slot = true;
        this._cap = false;
        this._tab = true;
        this._bool = false;
        this._slotX = 10;
        this._slotY = 2;
        this._tail = false;
        this._porch = false;
        this._porchX = this._innieX1 + this._innieX2 + 4 * this._strokeWidth;
        this._porchY = this._innieY2;
        this._expandX = 30;
        this._expandX2 = 0;
        this._expandY = 0;
        this._expandY2 = 0;
        this._clampCount = 1;
        this._clampSlots = [1];
        this._slotSize = 21;  // TODO: Compute this.
        this._arm = true;
        this._else = false;
        this._draw_inniess = true;
        this._fill = 'fill_color';
        this._stroke = 'stroke_color';
        this.margins = [0, 0, 0, 0];
        this._fontSize = 10;
        this._labelOffset = 0;
    }

    // Attribute methods

    this.setFontSize = function (fontSize) {
        this._fontSize = fontSize;
    };

    this.setLabelOffset = function (offset) {
        this._labelOffset = offset;
    };

    this.setDrawInniess = function (flag) {
        this._draw_inniess = flag;
    };

    this.getWidth = function () {
        return this._width;
    };

    this.getHeight = function () {
        return this._height;
    };

    this.clearDocks = function () {
        this.docks = [];
    };

    this.setScale = function (scale) {
        this._scale = scale;
    };

    this.setOrientation = function (orientation) {
        this._orientation = orientation;
    };

    this.setClampCount = function (number) {
        this._clampCount = number;
        var n = this._clampSlots.length;
        if (n < number) {
            for (var i = 0; i < number - n; i++) {
                this._clampSlots.push(1);
            }
        }
    };

    this.setClampSlots = function (clamp, number) {
        if (clamp > this._clampCount.length - 1) {
            this.setClampCount(clamp + 1);
        }
        this._clampSlots[clamp] = number;
    };

    this.setExpand = function (w, h, w2, h2) {
        // TODO: make this an array
        this._expandX = w;
        this._expandY = h;
        this._expandX2 = w2;
        this._expandY2 = h2;
    };

    this.setstrokeWidth = function (stroke_width) {
        this._strokeWidth = stroke_width;
        this._calc_porch_params();
    };

    this.setColors = function (colors) {
        this._fill = colors[0];
        this._stroke = colors[1];
    };

    this.setFillColor = function (color) {
        this._fill = color;
    };

    this.setStrokeColor = function (color) {
        this._stroke = color;
    };

    this.setInnies = function (inniesArray) {
        for (var i = 0; i < inniesArray.length; i++) {
            this._innies.push(inniesArray[i]);
        }
    };

    this.setOutie = function (flag) {
    // Only one outie.
        this._outie = flag;
    };

    this.setSlot = function (flag) {
        this._slot = flag;
        if (flag) {
            this._cap = false;
        }
    };

    this.setCap = function (flag) {
        this._cap = flag;
        if (flag) {
            this._slot = false;
        }
    };

    this.setTab = function (flag) {
        this._tab = flag;
        if (flag) {
            this._tail = false;
        }
    };

    this.setTail = function (flag) {
        this._tail = flag;
        if (flag) {
            this._tab = false;
        }
    };

    this.setPorch = function (flag) {
        this._porch = flag;
    };

    this.setBoolean = function (flag) {
        this._bool = flag;
    };

    this.setElse = function (flag) {
        this._else = flag;
    };

    this.setArm = function (flag) {
        this._arm = flag;
    };

    // SVG-related helper methods

    this._resetMinMax = function () {
        this._minX = 10000;
        this._minY = 10000;
        this._maxX = -10000;
        this._maxY = -10000;
    };

    this._checkMinMax = function () {
        if (this._x < this._minX) {
            this._minX = this._x;
        }
        if (this._y < this._minY) {
            this._minY = this._y;
        }
        if (this._x > this._maxX) {
            this._maxX = this._x;
        }
        if (this._y > this._maxY) {
            this._maxY = this._y;
        }
    };

    this._calculateXY = function () {
        var x = this._strokeWidth / 2.0;
        var y = this._strokeWidth / 2.0 + this._radius;
        this.margins[0] = x + this._strokeWidth + 0.5;
        this.margins[1] = this._strokeWidth + 0.5;
        if (this._outie) {
            x += this._innieX1 + this._innieX2;
            this.margins[0] += this._innieX1 + this._innieX2;
        }
        if (this._cap) {
            y += this._slotY * 3.0;
            this.margins[1] += this._slotY * 3.0;
        } else if (this._slot) {
            this.margins[1] += this._slotY;
        }
        this.margins[0] *= this._scale;
        this.margins[1] *= this._scale;
        return([x, y]);
    };

    this._calculateWH = function (addstrokeWidth) {
        if (addstrokeWidth) {
            this._width = (this._maxX - this._minX + this._strokeWidth) * this._scale;
        } else {
            this._width = (this._maxX - this._minX) * this._scale;
        }
        if (this.margins[2] === 0) {
            this.margins[2] = (this._strokeWidth + 0.5) * this._scale;
        } else {
            this.margins[2] = this._width - this.margins[2];
        }

        if (addstrokeWidth) {
            this._height = (this._maxY - this._minY + this._strokeWidth) * this._scale;
        } else {
            this._height = (this._maxY - this._minY) * this._scale;
        }
        if (this.margins[3] === 0) {
            if (this._tab) {
                this.margins[3] = (this._slotY + this._strokeWidth + 0.5) * this._scale;
            } else {
                this.margins[3] = (this._slotY * 2 + this._strokeWidth + 0.5) * this._scale;
            }
        } else {
            this.margins[3] = this._height - this.margins[3];
        }
    };

    this._newPath = function (x, y) {
        this._x = x;
        this._y = y;
        return '<path d="m' + x + ' ' + y + ' ';
    };

    this._closePath = function () {
        return 'z" ';
    };

    this.text = function (x, y, fontSize, width, alignment, string) {
        this._x = x;
        this._y = y;
        this._checkMinMax();
        this._x = x + width;
        this._y = y - fontSize;
        this._checkMinMax();

        // writing-mode:lr';
        switch (alignment) {
        case 'left':
        case 'start':
            var align = 'start';
            break;
        case 'middle':
        case 'center':
            var align = 'middle';
            break;
        case 'right':
        case 'end':
            var align = 'end';
            break;
        }

        var yy = y;
        var tspans = string.split('\n');
        var text = '<text style="font-size:' + fontSize + 'px;fill:#000000;font-family:sans-serif;text-anchor:' + align + '">';
        for (var i = 0; i < tspans.length; i++) {
            text += '<tspan x="' + Math.floor(x + 0.5) + '" y="' + Math.floor(yy +0.5) + '">' + tspans[i] + '</tspan>';
            yy += fontSize;
        }
        text += '</text>';
        return text;
    };

    this._lineTo = function (x, y) {
        this._checkMinMax();
        if (this._x === x && this._y === y) {
            return '';
        } else {
            this._x = x;
            this._y = y;
            this._checkMinMax();
            return 'L ' + x + ' ' + y + ' ';
        }
    };

    this._rLineTo = function (dx, dy) {
        if (dx === 0 && dy === 0) {
            return '';
        } else {
            return this._lineTo(this._x + dx, this._y + dy);
        }
    };

    this._arcTo = function (x, y, r, a, l, s) {
        this._checkMinMax();
        if (r === 0) {
            return this._lineTo(x, y);
        } else {
            this._x = x;
            this._y = y;
            this._checkMinMax();
            return 'A ' + r + ' ' + r + ' ' + a + ' ' + l + ' ' + s + ' ' + x + ' ' + y + ' ';
        }
    };

    this._rarcTo = function (signX, signY, a, l, s) {
        if (this._radius === 0) {
            return '';
        } else {
            var x = this._x + signX * this._radius;
            var y = this._y + signY * this._radius;
            return this._arcTo(x, y, this._radius, a, l, s);
        }
    };

    this._corner = function (signX, signY, a, l, s, start, end, skip) {
        var svg_str = '';
        if (this._radius > 0) {
            var r2 = this._radius / 2.0;
            if (start) {
                if (signX * signY === 1) {
                    svg_str += this._rLineTo(signX * r2, 0);
                } else if (!skip) {
                    svg_str += this._rLineTo(0, signY * r2);
                }
            }
            var x = this._x + signX * r2;
            var y = this._y + signY * r2;
            svg_str += this._arcTo(x, y, r2, a, l, s);
            if (end) {
                if (signX * signY === 1) {
                    svg_str += this._rLineTo(0, signY * r2);
                } else if (!skip) {
                    svg_str += this._rLineTo(signX * r2, 0);
                }
            }
        }
        return svg_str;
    };

    this._iCorner = function (signX, signY, a, l, s, start, end) {
        var r2 = this._strokeWidth + this._radius / 2.0;
        if (start) {
            if (signX * signY === -1) {
                var svg_str = this._rLineTo(signX * (r2 - this._strokeWidth), 0);
            } else {
                var svg_str = this._rLineTo(0, signY * (r2 - this._strokeWidth));
            }
        } else {
            var svg_str = '';
        }
        var x = this._x + signX * r2;
        var y = this._y + signY * r2;
        svg_str += this._arcTo(x, y, r2, a, l, s);
        if (end) {
            if (signX * signY === -1) {
                svg_str += this._rLineTo(0, signY * (r2 - this._strokeWidth));
            } else {
                svg_str += this._rLineTo(signX * (r2 - this._strokeWidth), 0);
            }
        }
        return svg_str;
    };

    this._doInnie = function () {
        this.docks.push([(this._x + this._strokeWidth) * this._scale,
                         (this._y + this._innieY2) * this._scale]);
        if (this.margins[2] === 0) {
            this.margins[1] = (this._y - this._innieY1) * this._scale;
            this.margins[2] = (this._x - this._innieX1 - this._innieX2 - this._strokeWidth * 2) * this._scale;
        }
        this.margins[3] = (this._y + this._innieY2 + this._innieY1) * this._scale;
        return this._rLineTo(-this._innieX1, 0) + this._rLineTo(0, -this._innieY1) + this._rLineTo(-this._innieX2, 0) + this._rLineTo(0, this._innieY2 + 2 * this._innieY1) + this._rLineTo(this._innieX2, 0) + this._rLineTo(0, -this._innieY1) + this._rLineTo(this._innieX1, 0);
    };

    this._doOutie = function () {
        if (!this._outie) {
            return this._rLineTo(0, -this._innieY2);
        }
        // Outie needs to be the first dock element.
        this.docks.unshift([(this._x * this._scale), (this._y * this._scale)]);
        return this._rLineTo(0, -this._strokeWidth) + this._rLineTo(-this._innieX1 - 2 * this._strokeWidth, 0) + this._rLineTo(0, this._innieY1) + this._rLineTo(-this._innieX2 + 2 * this._strokeWidth, 0) + this._rLineTo(0, -this._innieY2 - 2 * this._innieY1 + 2 * this._strokeWidth) + this._rLineTo(this._innieX2 - 2 * this._strokeWidth, 0) + this._rLineTo(0, this._innieY1) + this._rLineTo(this._innieX1 + 2 * this._strokeWidth, 0) + this._rLineTo(0, -this._strokeWidth);
    };

    this._doSlot = function () {
        if (this._slot) {
            var x = this._x + this._slotX / 2.0;
            this.docks.push([(x * this._scale), (this._y * this._scale)]);
            return this._rLineTo(0, this._slotY) + this._rLineTo(this._slotX, 0) + this._rLineTo(0, -this._slotY);
        } else if (this._cap) {
            var x = this._x + this._slotX / 2.0;
            this.docks.push([(x * this._scale), (this._y * this._scale)]);
            return this._rLineTo(this._slotX / 2.0, -this._slotY * 3.0) + this._rLineTo(this._slotX / 2.0, this._slotY * 3.0);
        } else {
            return this._rLineTo(this._slotX, 0);
        }
    };

    this._doTail = function () {
        if (this._outie) {
            return this._rLineTo(-this._slotX, 0);
        } else if (this._tail) {
            var x = this._x + this._slotX / 2.0;
            this.docks.push([(x * this._scale),
                             (this._y * this._scale)]);
            return this._rLineTo(-this._slotX / 2.0, this._slotY * 3.0) + this._rLineTo(-this._slotX / 2.0, -this._slotY * 3.0);
        } else {
            return this._rLineTo(-this._slotX, 0);
        }
    };

    this._doTab = function () {
        if (this._outie) {
            return this._rLineTo(-this._slotX, 0);
        }
        var x = this._x - this._slotX / 2.0;
        this.docks.push([x * this._scale, (this._y + this._strokeWidth) * this._scale]);
        return this._rLineTo(-this._strokeWidth, 0) + this._rLineTo(0, this._slotY) + this._rLineTo(-this._slotX + 2 * this._strokeWidth, 0) + this._rLineTo(0, -this._slotY) + this._rLineTo(-this._strokeWidth, 0);
    };

    this._doPorch = function (flag) {
        if (flag) {
            return this._rLineTo(0, this._porchY + this._innieY1) + this._rLineTo(this._porchX - this._radius, 0) + this._corner(1, 1, 90, 0, 1, true, true, false);
        } else {
            return this._rLineTo(0, this._porchY - this._padding) + this._rLineTo(this._porchX - this._radius, 0) + this._corner(1, 1, 90, 0, 1, true, true, false);
        }
    };

    this._startBoolean = function (xoffset, yoffset) {
        var svg = this._newPath(xoffset, yoffset); // - this._radius);
        this._radius -= this._strokeWidth;
        this.docks.push([this._x * this._scale, this._y * this._scale]);
        svg += this._rarcTo(1, -1, 90, 0, 1);
        this._radius += this._strokeWidth;
        svg += this._rLineTo(this._strokeWidth, 0);
        svg += this._rLineTo(0, -this._expandY);
        return svg;
    };

    this._doBoolean = function () {
        this.docks.push([(this._x - this._radius + this._strokeWidth) * this._scale, (this._y + this._radius) * this._scale]);
        this.margins[2] = (this._x - this._radius - this._strokeWidth) * this._scale;
        var svg = this._rarcTo(-1, 1, 90, 0, 0) + this._rarcTo(1, 1, 90, 0, 0);
        return svg;
    };

    this._endBoolean = function (notnot) {
        if (!notnot) {
            var svg = this._rLineTo(-this._radius * 1.5, 0);
        } else {
            var svg = '';
        }
        svg += this._rLineTo(0, -this._strokeWidth);
        svg += this._rLineTo(-this._strokeWidth, 0);
        this._radius -= this._strokeWidth;
        svg += this._rarcTo(-1, -1, 90, 0, 1);
        this._radius += this._strokeWidth;
        svg += this._closePath();
        this._calculateWH(true);
        svg += this._style();
        return svg;
    };

    this._header = function (center) {
    // FIXME: Why are our calculations off by 2 x strokeWidth?
    var width = this._width + 2 * this._strokeWidth;
        return '<svg xmlns="http://www.w3.org/2000/svg" width="' + width * 1.1 + '" height="' + this._height * 1.3 + '">' + this._transform(center) + '<filter id="dropshadow" height="130%"> \
  <feGaussianBlur in="SourceAlpha" stdDeviation="3"/> \
  <feOffset dx="2" dy="2" result="offsetblur"/> \
  <feComponentTransfer xmlns="http://www.w3.org/2000/svg"> \
    <feFuncA type="linear" slope="0.2"/> \
  </feComponentTransfer> \
  <feMerge> \
    <feMergeNode/> \
    <feMergeNode in="SourceGraphic"/> \
  </feMerge> \
</filter>';
    };

    this._transform = function (center) {
        if (this._orientation !== 0) {
            var w = this._width / 2.0;
            var h = this._height / 2.0;
            var orientation = '<g transform = "rotate(' + this._orientation + ' ' + w + ' ' + h + ')">';
        } else {
            var orientation = '';
        }
        if (center) {
            var x = -this._minX;
            var y = -this._minY;
            return '<g transform="translate(' + x + ', ' + y + ')">';
        } else {
            return '<g transform="scale(' + this._scale + ', ' + this._scale + ')">' + orientation;
        }
    };

    this._footer = function () {
        if (this._orientation !== 0) {
            return '</g></g></svg>';
        } else {
            return '</g></svg>';
        }
    };

    this._style = function () {
        return 'style="fill:' + this._fill + ';fill-opacity:1;stroke:' + this._stroke + ';stroke-width:' + this._strokeWidth + ';stroke-linecap:round;stroke-opacity:1;filter:url(#dropshadow);" />';
    };

    /*
    The block construction methods typically start on the upper-left side
    of a block and proceed clockwise around the block, first constructing
    a corner (1, -1), a slot or hat on along the top, a corner (1, 1),
    right side connectors ("innies"), possibly a "porch" to suggest an
    order of arguments, another corner (-1, 1), a tab or tail, and the
    fourth corner (-1, -1), and finally, a left-side connector ("outie").
    In addition:
     * Minimum and maximum values are calculated for the SVG bounding box;
     * Docking coordinates are calculated for each innies, outie, tab, and slot.
    */

    this.basicBlock = function() {
        // The most common block type: used for 0, 1, 2, or 3
        // argument commands (forward, setxy, plus, sqrt, etc.)
        this._resetMinMax();

        var obj = this._calculateXY();
        var x = obj[0];
        var y = obj[1];

        this.margins[2] = 0;
        this.margins[3] = 0;

        var svg = this._newPath(x, y);
        svg += this._corner(1, -1 , 90, 0, 1, true, true, false);
        svg += this._doSlot();
        svg += this._rLineTo(this._expandX, 0);
        xx = this._x;
        svg += this._corner(1, 1 , 90, 0, 1, true, true, false);
        if (this._innies.length === 0) {
        // To maintain standard block height
            svg += this._rLineTo(0, this._padding);
        } else {
            for (var i = 0; i < this._innies.length; i++) {
                if (this._innies[i]) {
                    svg += this._doInnie();
                }
                if (i === 0) {
                    svg += this._rLineTo(0, this._expandY);
                } else if (i === 1 && this._expandY2 > 0) {
                    svg += this._rLineTo(0, this._expandY2);
                }
                if (i === 0 && this._porch) {
                    svg += this._doPorch(false);
                } else if (this._innies.length - 1 > i) {
                    svg += this._rLineTo(0, 2 * this._innieY2 + this._inniesSpacer);
                }
            }
        }
        svg += this._corner(-1, 1 , 90, 0, 1, true, true, false);
        svg += this._lineTo(xx, this._y);
        svg += this._rLineTo(-this._expandX, 0);
        if (this._tab) {
            svg += this._doTab();
        } else {
            svg += this._doTail();
        }
        svg += this._corner(-1, -1 , 90, 0, 1, true, true, false);
        svg += this._rLineTo(0, -this._expandY);
        if (this._innies.indexOf(true) !== -1) {
            svg += this._lineTo(x, this._radius + this._innieY2 + this._strokeWidth / 2.0);
            svg += this._doOutie();
        }

        this._calculateWH(true);
        svg += this._closePath();
        svg += this._style();

        // Add a block label
        var tx = this._width - this._scale * (this._innieX1 + this._innieX2) - 4 * this._strokeWidth + this._labelOffset * this._scale;
        var ty = this._height / 2 + this._fontSize / (5 / this._scale);

        // If we have an odd number of innie slots, we need to avoid a
        // collision between the block label and the slot label.
        var nInnies = this._innies.length;
        if (nInnies > 2 && Math.round(nInnies / 2) * 2 !== nInnies) {
            ty -= 2 * this._fontSize;
        }

        svg += this.text(tx / this._scale, ty / this._scale, this._fontSize, this._width, 'right', 'block_label');

        // Add a label for each innies
        if (this._slot || this._outie) {
            var di = 1;  // Skip the first dock since it is a slot.
        } else {
            var di = 0;
        }

        var count = 1;
        for (var i = 0; i < this._innies.length; i++) {
            if (this._innies[i]) {
                ty = this.docks[di][1] - (this._fontSize / (8 / this._scale)) +  this._scale;
                svg += this.text(tx / this._scale, ty / this._scale, this._fontSize / 1.5, this._width, 'right', 'arg_label_' + count);
                count += 1;
                di += 1;
            }
        }

        svg += this._footer();
        return this._header(false) + svg;
    };

    this.basicBox = function () {
        // Basic argument style used for numbers, text, media, parameters
        this._resetMinMax();
        this.setOutie(true);

        var x = this._strokeWidth / 2.0 + this._innieX1 + this._innieX2;
        this.margins[0] = (x + this._strokeWidth + 0.5) * this._scale;
        this.margins[1] = (this._strokeWidth + 0.5) * this._scale;
        this.margins[2] = 0;
        this.margins[3] = 0;
        var svg = this._newPath(x, this._strokeWidth / 2.0);
        svg += this._rLineTo(this._expandX, 0);
        svg += this._rLineTo(0, 2 * this._radius + this._innieY2 + this._expandY);
        svg += this._rLineTo(-this._expandX, 0);
        svg += this._lineTo(x, this._radius + this._innieY2 + this._strokeWidth / 2.0);
        svg += this._doOutie();
        svg += this._closePath();
        this._calculateWH(true);
        svg += this._style();

        // Add a block label
        var tx = 2 * (this._innieX1 + this._innieX2) + 4 * this._strokeWidth + this._labelOffset * this._scale;
        var ty = this._height / 2 + this._fontSize / 2;
        svg += this.text(tx / this._scale, ty / this._scale, this._fontSize, this._width, 'left', 'block_label');

        svg += this._footer();
        return this._header(false) + svg;
    };

    this.booleanAndOr = function () {
        // Booleans are in a class of their own
        this._resetMinMax();
        var svg = this._startBoolean(this._strokeWidth / 2.0, this._radius * 5.5 + this._strokeWidth / 2.0 + this._innieY2 + this._inniesSpacer + this._expandY);
        svg += this._rLineTo(0, -this._radius * 3.5 - this._innieY2 - this._inniesSpacer - this._strokeWidth);

        svg += this._rarcTo(1, -1, 90, 0, 1);
        svg += this._rLineTo(this._radius / 2.0 + this._expandX, 0);
        var xx = this._x;
        svg += this._rLineTo(0, this._radius / 2.0);
        svg += this._doBoolean();
        svg += this._rLineTo(0, this._radius * 1.5 + this._innieY2 + this._inniesSpacer);

        svg += this._rLineTo(0, this._expandY);

        svg += this._doBoolean();
        svg += this._rLineTo(0, this._radius / 2.0);

        svg += this._lineTo(xx, this._y);
        svg += this._rLineTo(-this._expandX, 0);
        svg += this._endBoolean(false);
        this.margins[0] = (this._radius + this._strokeWidth + 0.5) * this._scale;
        this.margins[1] = this._strokeWidth * this._scale;
        this.margins[2] = this._strokeWidth * this._scale;
        this.margins[3] = this._strokeWidth * this._scale;

        // Add a block label
        var tx = this._width - this._scale * (this._innieX1 + this._innieX2) - 4 * this._strokeWidth + this._labelOffset * this._scale;
        var ty = this._height / 2 + this._fontSize / 2;
        svg += this.text(tx / this._scale, ty / this._scale, this._fontSize, this._width, 'right', 'block_label');

        svg += this._footer();
        return this._header(false) + svg;
    };

    this.booleanNot = function (notnot) {
        // Booleans are in a class of their own: not and not not
        this._resetMinMax();
        if (this._innies[0]) {
            var svg = this._startBoolean(this._strokeWidth / 2.0, this._radius * 1.25 + this._strokeWidth / 2.0);
        } else if (!notnot) {
            var svg = this._startBoolean(this._strokeWidth / 2.0, this._radius * 2.0 + this._strokeWidth / 2.0);
        } else {
            var svg = this._startBoolean(this._strokeWidth / 2.0, this._radius * 1.25 + this._strokeWidth / 2.0);
        }
        svg += this._rLineTo(0, -this._strokeWidth);

        if (this._innies[0]) {
            svg += this._rLineTo(0, -this._radius / 4.0);
        } else if (!notnot) {
            svg += this._rarcTo(1, -1, 90, 0, 1);
        } else {
            svg += this._rLineTo(0, -this._radius / 4.0);
        }
        svg += this._rLineTo(this._radius / 2.0 + this._expandX, 0);
        var xx = this._x;

        if (this._innies[0]) {
            svg += this._rLineTo(0, this._radius);
            svg += this._doInnie();
            svg += this._rLineTo(0, this._radius);
        } else if (!notnot) {
            svg += this._rLineTo(0, this._radius / 2.0);
            svg += this._doBoolean();
            svg += this._rLineTo(0, this._radius / 2.0);
        } else {
            svg += this._rLineTo(0, this._radius * 2.25);
        }

        svg += this._lineTo(xx, this._y);

        // FIXME: Is this in the correct place?
        if (this._expandY2 > 0) {
            svg += this._rLineTo(0, this._expandY2);
        }

        if (this._innies[0]) {
            svg += this._rLineTo(-this._radius / 2.0 - this._expandX, 0);
            svg += this._rLineTo(0, -this._radius / 4.0);
        } else if (!notnot) {
            svg += this._rLineTo(-this._expandX, 0);
        } else {
            svg += this._rLineTo(-this._radius / 2.0 - this._expandX, 0);
        }

        // FIXME: Is this in the correct place?
        if (this._expandY2 > 0) {
            svg += this._rLineTo(0, -this._expandY2);
        }
        svg += this._endBoolean(notnot);
        if (notnot) {
            this.margins[0] = (this._radius + this._strokeWidth + 0.5) * this._scale;
            this.margins[2] = (this._radius + this._strokeWidth + 0.5) * this._scale;
        } else {
            this.margins[0] = (this._strokeWidth + 0.5) * this._scale;
            this.margins[2] = (this._strokeWidth + 0.5) * this._scale;
        }
        this.margins[1] = this._strokeWidth * this._scale;
        this.margins[3] = this._strokeWidth * this._scale;

        // Add a block label
        var tx = this._width - 2 * (this._innieX1 + this._innieX2) - 4 * this._strokeWidth + this._labelOffset * this._scale;
        var ty = this._height / 2 + this._fontSize / 2;
        svg += this.text(tx / this._scale, ty / this._scale, this._fontSize, this._width, 'right', 'block_label');

        svg += this._footer();
        return this._header(false) + svg;
    };

    this.booleanCompare = function () {
        // Booleans are in a class of their own (greater than, less than, etc)
        this._resetMinMax();
        var yoffset = this._radius * 2 + 2 * this._innieY2 + this._inniesSpacer + this._strokeWidth / 2.0 + this._expandY;
        var xoffset = this._strokeWidth / 2.0;

        var yoff = this._radius * 2;
        var svg = '<g transform="matrix(1,0,0,1,0,-' + yoff + ')"> ';

        svg += this._newPath(xoffset, yoffset + this._radius);
        this.docks.push([this._x * this._scale, (this._y - 2 * this._radius) * this._scale]);
        this._radius -= this._strokeWidth;
        svg += this._rarcTo(1, -1, 90, 0, 1);
        this._radius += this._strokeWidth;
        svg += this._rLineTo(this._strokeWidth, 0);
        svg += this._rLineTo(0, -this._expandY);

        yoffset = -2 * this._innieY2 - this._inniesSpacer - this._strokeWidth;
        svg += this._rLineTo(0, yoffset + this._radius);

        svg += this._rarcTo(1, -1, 90, 0, 1);
        svg += this._rLineTo(this._radius / 2.0 + this._expandX, 0);
        svg += this._rLineTo(0, this._radius);
        var xx = this._x;
        svg += this._doInnie();
        this.docks[1][1] -= this._radius * 2 * this._scale;
        svg += this._rLineTo(0, this._expandY);

        if (this._porch) {
            svg += this._doPorch(false);
        } else {
            svg += this._rLineTo(0, 2 * this._innieY2 + this._inniesSpacer);
        }
        svg += this._doInnie();
        this.docks[2][1] -= this._radius * 2 * this._scale;
        svg += this._rLineTo(0, this._radius);
        svg += this._lineTo(xx, this._y);

        svg += this._rLineTo(-this._expandX, 0);

        svg += this._rLineTo(-this._radius * 1.5, 0);
        svg += this._rLineTo(0, -this._radius);
        svg += this._rLineTo(0, -this._strokeWidth);
        svg += this._rLineTo(-this._strokeWidth, 0);
        this._radius -= this._strokeWidth;
        svg += this._rarcTo(-1, -1, 90, 0, 1);
        this._radius += this._strokeWidth;
        svg += this._closePath();
        this._calculateWH(true);
        svg += this._style();
        svg += '</g>';

        this.margins[0] = (this._radius + this._strokeWidth) * this._scale;
        this.margins[1] = this._strokeWidth * this._scale;
        this.margins[2] = this._strokeWidth * this._scale;

        // Add a block label
        var tx = this._width - 2 * (this._innieX1 + this._innieX2) - 4 * this._strokeWidth + this._labelOffset * this._scale;
        var ty = this._height / 2 + this._fontSize / 2; // + this._radius * this._scale;
        svg += this.text(tx / this._scale, ty / this._scale, this._fontSize, this._width, 'right', 'block_label');

        svg += this._footer();
        return this._header(false) + svg;
    };

    this.basicClamp = function () {
        // Special block for clamps around stacks; includes an 'arm'
        // that extends down the left side of a stack and a bottom jaw
        // to clamp the blocks. (Used for start, action, repeat, etc.)
        var save_cap = this._cap;
        var save_slot = this._slot;
        this._resetMinMax();
        if (this._outie) {
            var x = this._strokeWidth / 2.0 + this._innieX1 + this._innieX2;
        } else {
            var x = this._strokeWidth / 2.0;
        }
        if (this._cap) {
            var y = this._strokeWidth / 2.0 + this._radius + this._slotY * 3.0;
        } else {
            var y = this._strokeWidth / 2.0 + this._radius;
        }

        this.margins[0] = (x + this._strokeWidth + 0.5) * this._scale;
        this.margins[1] = (this._strokeWidth + 0.5) * this._scale;
        this.margins[2] = 0;
        this.margins[3] = 0;

        var svg = this._newPath(x, y);
        svg += this._corner(1, -1 , 90, 0, 1, true, true, false);
        svg += this._doSlot();
        if (this._cap) {
            this._slot = true;
            this._cap = false;
        }

        svg += this._rLineTo(this._radius + this._strokeWidth, 0);
        var xx = this._x;
        svg += this._rLineTo(this._expandX, 0);
        svg += this._corner(1, 1 , 90, 0, 1, true, true, false);
        if (this._innies[0]) {
            // svg += this._doInnie();
            for (var i = 0; i < this._innies.length; i++) {
                if (this._innies[i]) {
                    svg += this._doInnie();
                }
                if (i === 0) {
                    svg += this._rLineTo(0, this._expandY);
                } else if (i === 1 && this._expandY2 > 0) {
                    svg += this._rLineTo(0, this._expandY2);
                }
                if (i === 0 && this._porch) {
                    svg += this._doPorch(false);
                } else if (this._innies.length - 1 > i) {
                    svg += this._rLineTo(0, 2 * this._innieY2 + this._inniesSpacer);
                }
            }
        } else if (this._bool) {
            svg += this._rLineTo(0, 2 * this._padding + this._strokeWidth);
            svg += this._doBoolean();
            this.margins[2] = (this._x - this._strokeWidth + 0.5) * this._scale;
        } else {
            svg += this._rLineTo(0, this._padding);
            this.margins[2] = (this._x - this._strokeWidth + 0.5) * this._scale;
        }

        for (var clamp = 0; clamp < this._clampCount; clamp++) {
            if (clamp > 0) {
                svg += this._rLineTo(this._expandX, 0);
                svg += this._rLineTo(0, 3 * this._padding);
            }
            svg += this._corner(-1, 1, 90, 0, 1, true, true, false);
            svg += this._lineTo(xx, this._y);
            var saveOutie = this._outie;
            this._outie = false;
            svg += this._doTab();
            this._outie = saveOutie;
            svg += this._iCorner(-1, 1, 90, 0, 0, true, true);
            svg += this._rLineTo(0, this._padding);
            if (this._clampSlots[clamp] > 1) {
                var dy = this._slotSize * (this._clampSlots[clamp] - 1);
                svg += this._rLineTo(0, dy);
            }
            svg += this._rLineTo(0, this._expandY2);
            svg += this._iCorner(1, 1, 90, 0, 0, true, true);
            var saveSlot = this._slot;
            this._slot = true;
            svg += this._doSlot();
            this._slot = saveSlot;
            this.docks.pop();  // We don't need this dock.
            svg += this._rLineTo(this._radius, 0);
        }

        if (this._clampCount > 0) {
            svg += this._rLineTo(0, this._innieY1 * 2);
            // Add a bit of padding to make multiple of standard block height.
            svg += this._rLineTo(0, this._innieY1 + 3 * this._strokeWidth);
        }

        svg += this._corner(-1, 1, 90, 0, 1, true, true, false);

        if (this._clampCount === 0) {
            svg += this._lineTo(xx, this._y);
        }

        svg += this._rLineTo(-this._radius - this._strokeWidth, 0);

        if (this._tail) {
            svg += this._doTail();
        } else {
            svg += this._doTab();
        }

        this._cap = save_cap;
        this._slot = save_slot;

        svg += this._corner(-1, -1, 90, 0, 1, true, true, false);
        if (this._outie) {
            svg += this._lineTo(x, this._radius + this._innieY2 + this._strokeWidth / 2.0);
            svg += this._doOutie();
        }
        svg += this._closePath();
        this._calculateWH(true);
        svg += this._style();

        // Add a block label
        if (this._outie) {
            var tx = 10 * this._strokeWidth + this._innieX1 + this._innieX2 + this._labelOffset * this._scale;
        } else {
            var tx = 8 * this._strokeWidth + this._labelOffset * this._scale;
        }

        if (this._cap) {
            var ty = (this._strokeWidth / 2.0 + this._radius + this._slotY) * this._scale;
        } else if (this._innies.length > 1) {
            var ty = (this._strokeWidth / 2.0 + this._radius) * this._scale / 2;
            ty += this._fontSize;
        } else {
            var ty = (this._strokeWidth / 2.0 + this._radius) * this._scale / 2;
        }

        ty += (this._fontSize + 1) * this._scale;
        if (this._bool) {
            ty += this._fontSize / 2;
        }

        svg += this.text(tx / this._scale, ty / this._scale, this._fontSize, this._width, 'left', 'block_label');

        // Booleans get an extra label.
        if (this._bool) {
            var count = 1;
            var tx = this._width - this._radius;
            for (var clamp = 0; clamp < this._clampCount; clamp++) {
                ty = this.docks[clamp + 2][1] - this._fontSize + 3 * this._strokeWidth;
                svg += this.text(tx / this._scale, ty / this._scale, this._fontSize / 1.5, this._width, 'right', 'arg_label_' + count);
                count += 1;
            }
        }

        // Add a label for each innies
        if (this._slot || this._outie) {
            var di = 1;  // Skip the first dock since it is a slot.
        } else {
            var di = 0;
        }
        var count = 1;
        var tx = this._width - this._scale * (this._innieX1 + this._innieX2) - 4 * this._strokeWidth;
        for (var i = 0; i < this._innies.length; i++) {
            if (this._innies[i]) {
                ty = this.docks[di][1] - (this._fontSize / (8 / this._scale)) + this._scale;
                svg += this.text(tx / this._scale, ty / this._scale, this._fontSize / 1.5, this._width, 'right', 'arg_label_' + count);
                count += 1;
                di += 1;
            }
        }

        svg += this._footer();
        return this._header(false) + svg;
    };

    this.argClamp = function () {
        // A clamp that contains innies rather than flow blocks
        this._resetMinMax();
        if (this._outie) {
            var x = this._strokeWidth / 2.0 + this._innieX1 + this._innieX2;
        } else {
            var x = this._strokeWidth / 2.0;
        }
        var y = this._strokeWidth / 2.0 + this._radius;
        this.margins[0] = (x + this._strokeWidth + 0.5) * this._scale;
        this.margins[1] = (this._strokeWidth + 0.5) * this._scale;
        this.margins[2] = 0;
        this.margins[3] = 0;
        var svg = this._newPath(x, y);
        svg += this._corner(1, -1 , 90, 0, 1, true, true, false);
        svg += this._doSlot();

        svg += this._rLineTo(this._radius + this._strokeWidth, 0);
        var xx = this._x;
        svg += this._rLineTo(this._expandX, 0);
        svg += this._corner(1, 1 , 90, 0, 1, true, true, false);
        if (this._innies[0]) {
            svg += this._doInnie();
        } else {
            svg += this._rLineTo(0, this._padding);
            this.margins[2] = (this._x - this._strokeWidth + 0.5) * this._scale;
        }

        svg += this._corner(-1, 1, 90, 0, 1, true, true, false);
        svg += this._lineTo(xx, this._y);
        svg += this._iCorner(-1, 1, 90, 0, 0, true, true);

        var j = 0;
        svg += this._doInnie();
        var dy = this._slotSize * (this._clampSlots[0][j] - 1);
        if (dy > 0) {
            svg += this._rLineTo(0, dy);
        }
        j += 1;

        var ddy = (this._slotSize - this._innieY2);
        for (var i = 1; i < this._clampSlots[0].length; i++) {
            svg += this._rLineTo(0, ddy);
            svg += this._doInnie();
            var dy = this._slotSize * (this._clampSlots[0][j] - 1);
            if (dy > 0) {
                svg += this._rLineTo(0, dy);
            }
            j += 1;
        }

        svg += this._rLineTo(0, this._expandY2);
        svg += this._iCorner(1, 1, 90, 0, 0, true, true);
        svg += this._rLineTo(this._radius, 0);

        svg += this._rLineTo(0, this._innieY1 * 2);

        // Add a bit of padding to make multiple of standard block height.
        svg += this._rLineTo(0, this._innieY1 + 3 * this._strokeWidth);

        svg += this._corner(-1, 1, 90, 0, 1, true, true, false);
        svg += this._lineTo(xx, this._y);
        svg += this._rLineTo(-this._radius - this._strokeWidth, 0);

        if (this._tail) {
            svg += this._doTail();
        } else {
            svg += this._doTab();
        }

        svg += this._corner(-1, -1, 90, 0, 1, true, true, false);
        if (this._outie) {
            svg += this._lineTo(x, this._radius + this._innieY2 + this._strokeWidth / 2.0);
            svg += this._doOutie();
        }
        svg += this._closePath();
        this._calculateWH(true);
        svg += this._style();

        // Add a block label
        if (this._outie) {
            var tx = 10 * this._strokeWidth + this._innieX1 + this._innieX2;
        } else {
            var tx = 8 * this._strokeWidth;
        }
        if (this._cap) {
            var ty = (this._strokeWidth / 2.0 + this._radius + this._slotY) * this._scale;
        } else {
            var ty = (this._strokeWidth / 2.0 + this._radius) * this._scale / 2;
        }
        ty += (this._fontSize + 1) * this._scale;
        if (this._bool) {
            ty += this._fontSize / 2;
        }

        svg += this.text(tx / this._scale, ty / this._scale, this._fontSize, this._width, 'left', 'block_label');

        svg += this._footer();
        return this._header(false) + svg;
    };

    this.untilClamp = function () {
        // Until block is like clamp but docks are flipped
        this._resetMinMax();
        var x = this._strokeWidth / 2.0;
        var y = this._strokeWidth / 2.0 + this._radius;
        this.margins[0] = (x + this._strokeWidth + 0.5) * this._scale;
        this.margins[1] = (this._strokeWidth + 0.5) * this._scale;
        this.margins[2] = 0;
        this.margins[3] = 0;
        var svg = this._newPath(x, y);
        svg += this._corner(1, -1, 90, 0, 1, true, true, false);
        svg += this._doSlot();
        svg += this._rLineTo(this._radius + this._strokeWidth, 0);
        svg += this._rLineTo(this._expandX, 0);
        var xx = this._x;
        svg += this._corner(1, 1, 90, 0, 1, true, true, true);
        svg += this._rLineTo(0, 2 * this._innieY1);
        svg += this._corner(-1, 1, 90, 0, 1, true, true, true);
        svg += this._lineTo(xx, this._y);
        svg += this._rLineTo(-this._expandX, 0);
        svg += this._doTab();
        svg += this._iCorner(-1, 1, 90, 0, 0, true, true);
        svg += this._rLineTo(0, this._expandY);
        svg += this._iCorner(1, 1, 90, 0, 0, true, true);
        svg += this._doSlot();
        this.docks.pop();  // We don't need this dock.
        svg += this._rLineTo(this._radius, 0);
        if (this._innies[0]) {
            svg += this._doInnie();
        } else {
            this.margins[2] = (this._x - this._strokeWidth + 0.5) * this._scale;
        }
        svg += this._rLineTo(0, this._radius + this._expandY2);
        if (this._bool) {
            svg += this._doBoolean();
        }
        svg += this._corner(-1, 1, 90, 0, 1, true, true, false);
        svg += this._rLineTo(-this._radius - this._strokeWidth, 0);
        svg += this._doTab();
        svg += this._corner(-1, -1, 90, 0, 1, true, true, false);
        svg += this._closePath();
        this._calculateWH(true);
        svg += this._style();

        // Add a block label
        var tx = 4 * this._strokeWidth;
        var ty = this.docks[2][1];

        svg += this.text(tx / this._scale, ty / this._scale, this._fontSize, this._width, 'left', 'block_label');

        if (this._bool) {
            // Booleans get an extra label.
            var tx = this._width - this._radius;
            ty = this.docks[1][1] - this._fontSize;
            svg += this.text(tx / this._scale, ty / this._scale, this._fontSize / 1.5, this._width, 'right', 'arg_label_1');
        }

        if (this._bool) {
            // Swap bool and tab args so that the docking behaves like the
            // while block.
            var tx = this.docks[1][0];
            var ty = this.docks[1][1];
            this.docks[1][0] = this.docks[2][0];
            this.docks[1][1] = this.docks[2][1];
            this.docks[2][0] = tx;
            this.docks[2][1] = ty;
        }

        svg += this._footer();
        return this._header(false) + svg;
    };

    this.statusBlock = function (graphic) {
        // Generate a status block
        this._resetMinMax();
        var obj = this._calculateXY();
        var x = obj[0];
        var y = obj[1];
        this.margins[2] = 0;
        this.margins[3] = 0;
        var svg = this._newPath(x, y);
        svg += this._corner(1, -1, 90, 0, 1, true, true, false);
        svg += this._rLineTo(this._expandX, 0);
        var xx = this._x;
        svg += this._corner(1, 1, 90, 0, 1, true, true, false);
        svg += this._rLineTo(0, this._expandY);
        svg += this._corner(-1, 1, 90, 0, 1, true, true, false);
        svg += this._lineTo(xx, this._y);
        svg += this._rLineTo(-this._expandX, 0);
        svg += this._corner(-1, -1, 90, 0, 1, true, true, false);
        svg += this._rLineTo(0, -this._expandY);
        this._calculateWH(true);
        svg += this._closePath();
        svg += this._style();
        svg += this._footer();
        return this._header(false) + svg;
    };
};
