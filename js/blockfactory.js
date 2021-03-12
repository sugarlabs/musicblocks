// Copyright (c) 2015-20 Walter Bender
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

/* global platformColor */
/* Global Locations 
    js/utils/platformstyle.js
        platformColor
*/
/* exported SVG */

class SVG {
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

    /**
     * @constructor
     */
    constructor() {
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
        this._slotSize = 21; // TODO: Compute this.
        this._arm = true;
        this._else = false;
        this._draw_inniess = true;
        this._fill = "fill_color";
        this._stroke = "stroke_color";
        this.margins = [0, 0, 0, 0];
        this._fontSize = 10;
        this._labelOffset = 0;
    }

    // Attribute methods

    /**
     * @public
     * @param {number} fontSize
     * @returns {void}
     */
    setFontSize(fontSize) {
        this._fontSize = fontSize;
    }

    /**
     * @public
     * @param {number} offset
     * @returns {void}
     */
    setLabelOffset(offset) {
        this._labelOffset = offset;
    }

    /**
     * @public
     * @param {boolean} offset
     * @returns {void}
     */
    setDrawInniess(flag) {
        this._draw_inniess = flag;
    }

    /**
     * @public
     * @returns {number}
     */
    getWidth() {
        return this._width;
    }

    /**
     * @public
     * @returns {number}
     */
    getHeight() {
        return this._height;
    }

    /**
     * @public
     * @returns {void}
     */
    clearDocks() {
        this.docks = [];
    }

    /**
     * @public
     * @param {number} scale
     * @returns {void}
     */
    setScale(scale) {
        this._scale = scale;
    }

    /**
     * @public
     * @param {number} orientation
     * @returns {void}
     */
    setOrientation(orientation) {
        this._orientation = orientation;
    }

    /**
     * @public
     * @param {number} number
     * @returns {void}
     */

    setClampCount(number) {
        this._clampCount = number;
        const n = this._clampSlots.length;
        if (n < number) {
            for (let i = 0; i < number - n; i++) {
                this._clampSlots.push(1);
            }
        }
    }

    /**
     * @public
     * @param {number} clamp
     * @param {number} number
     * @returns {void}
     */
    setClampSlots(clamp, number) {
        if (clamp > this._clampCount.length - 1) {
            this.setClampCount(clamp + 1);
        }
        this._clampSlots[clamp] = number;
    }

    /**
     * @public
     * @param {number} w
     * @param {number} h
     * @param {number} w2
     * @param {number} h2
     * @returns {void}
     */
    setExpand(w, h, w2, h2) {
        // TODO: make this an array
        this._expandX = w;
        this._expandY = h;
        this._expandX2 = w2;
        this._expandY2 = h2;
    }

    /**
     * @public
     * @param {number} stroke_width
     * @returns {void}
     */
    setstrokeWidth(stroke_width) {
        this._strokeWidth = stroke_width;
        this._calc_porch_params();
    }

    /**
     * @public
     * @param {array} colors
     * @returns {void}
     */
    setColors(colors) {
        this._fill = colors[0];
        this._stroke = colors[1];
    }

    /**
     * @public
     * @param {Number} color
     * @returns {void}
     */
    setFillColor(color) {
        this._fill = color;
    }

    /**
     * @public
     * @param {Number} color
     * @returns {void}
     */
    setStrokeColor(color) {
        this._stroke = color;
    }

    /**
     * @public
     * @param {array} inniesArray
     * @returns {void}
     */
    setInnies(inniesArray) {
        for (let i = 0; i < inniesArray.length; i++) {
            this._innies.push(inniesArray[i]);
        }
    }

    /**
     * @public
     * @param {boolean} flag
     * @returns {void}
     */
    setOutie(flag) {
        // Only one outie.
        this._outie = flag;
    }

    /**
     * @public
     * @param {boolean} flag
     * @returns {void}
     */
    setSlot(flag) {
        this._slot = flag;
        if (flag) {
            this._cap = false;
        }
    }

    /**
     * @public
     * @param {boolean} flag
     * @returns {void}
     */
    setCap(flag) {
        this._cap = flag;
        if (flag) {
            this._slot = false;
        }
    }

    /**
     * @public
     * @param {boolean} flag
     * @returns {void}
     */
    setTab(flag) {
        this._tab = flag;
        if (flag) {
            this._tail = false;
        }
    }

    /**
     * @public
     * @param {boolean} flag
     * @returns {void}
     */
    setTail(flag) {
        this._tail = flag;
        if (flag) {
            this._tab = false;
        }
    }

    /**
     * @public
     * @param {boolean} flag
     * @returns {void}
     */
    setPorch(flag) {
        this._porch = flag;
    }

    /**
     * @public
     * @param {boolean} flag
     * @returns {void}
     */
    setBoolean(flag) {
        this._bool = flag;
    }

    /**
     * @public
     * @param {boolean} flag
     * @returns {void}
     */
    setElse(flag) {
        this._else = flag;
    }

    /**
     * @public
     * @param {boolean} flag
     * @returns {void}
     */
    setArm(flag) {
        this._arm = flag;
    }

    // SVG-related helper methods

    /**
     * @private
     * @returns {void}
     */
    _resetMinMax() {
        this._minX = 10000;
        this._minY = 10000;
        this._maxX = -10000;
        this._maxY = -10000;
    }

    /**
     * @private
     * @returns {void}
     */
    _checkMinMax() {
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
    }

    /**
     * @private
     * @returns {void}
     */ _calculateXY() {
        let x = this._strokeWidth / 2.0;
        let y = this._strokeWidth / 2.0 + this._radius;
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

        this.margins[0] = Math.floor(this.margins[0]);
        this.margins[1] = Math.floor(this.margins[1]);
        return [x, y];
    }

    /**
     * @private
     * @returns {void}
     */
    _calculateWH(addstrokeWidth) {
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

        this.margins[2] = Math.floor(this.margins[2] + 0.5);
        this.margins[3] = Math.floor(this.margins[3] + 0.5);
    }

    /**
     * @private
     * @param {number} x
     * @param {number} y
     * @returns {string}
     */
    _newPath(x, y) {
        this._x = x;
        this._y = y;
        return '<path d="m' + x + " " + y + " ";
    }

    /**
     * @private
     * @returns {string}
     */
    _closePath() {
        return 'z" ';
    }

    /**
     * @public
     * @param {number} x
     * @param {number} y
     * @param {number} fontSize
     * @param {number} width
     * @param {string} alignment
     * @param {string} string
     * @returns {string}
     */
    text(x, y, fontSize, width, alignment, string) {
        this._x = x;
        this._y = y;
        this._checkMinMax();
        this._x = x + width;
        this._y = y - fontSize;
        this._checkMinMax();

        let align;
        // writing-mode:lr';
        switch (alignment) {
            case "left":
            case "start":
                align = "start";
                break;
            case "middle":
            case "center":
                align = "middle";
                break;
            case "right":
            case "end":
                align = "end";
                break;
        }

        let yy = y;
        const tspans = string.split("\n");
        let text =
            '<text style="font-size:' +
            fontSize +
            "px;fill:" +
            platformColor.blockText +
            ";font-family:sans-serif;text-anchor:" +
            align +
            '">';
        for (let i = 0; i < tspans.length; i++) {
            text +=
                '<tspan x="' +
                Math.floor(x + 0.5) +
                '" y="' +
                Math.floor(yy + 0.5) +
                '">' +
                tspans[i] +
                "</tspan>";
            yy += fontSize;
        }
        text += "</text>";
        return text;
    }

    /**
     * @private
     * @param {number} x
     * @param {number} y
     * @returns {string}
     */
    _lineTo(x, y) {
        this._checkMinMax();
        if (this._x === x && this._y === y) {
            return "";
        } else {
            this._x = x;
            this._y = y;
            this._checkMinMax();
            return "L " + x + " " + y + " ";
        }
    }

    /**
     * @private
     * @param {number} dx
     * @param {number} dy
     * @returns {string}
     */
    _rLineTo(dx, dy) {
        if (dx === 0 && dy === 0) {
            return "";
        } else {
            return this._lineTo(this._x + dx, this._y + dy);
        }
    }

    /**
     * @private
     * @param {number} x
     * @param {number} y
     * @param {number} r
     * @param {number} a
     * @param {number} l
     * @param {number} s
     * @returns {string}
     */
    _arcTo(x, y, r, a, l, s) {
        this._checkMinMax();
        if (r === 0) {
            return this._lineTo(x, y);
        } else {
            this._x = x;
            this._y = y;
            this._checkMinMax();
            return "A " + r + " " + r + " " + a + " " + l + " " + s + " " + x + " " + y + " ";
        }
    }

    /**
     * @private
     * @param {number} signX
     * @param {number} signY
     * @param {number} a
     * @param {number} l
     * @param {number} s
     * @returns {string}
     */
    _rarcTo(signX, signY, a, l, s) {
        if (this._radius === 0) {
            return "";
        } else {
            return this._arcTo(
                this._x + signX * this._radius,
                this._y + signY * this._radius,
                this._radius,
                a,
                l,
                s
            );
        }
    }

    /**
     * @private
     * @param {number} signX
     * @param {number} signY
     * @param {number} a
     * @param {number} l
     * @param {number} s
     * @param {boolean} start
     * @param {boolean} end
     * @param {boolean} skip
     * @returns {string}
     */
    _corner(signX, signY, a, l, s, start, end, skip) {
        let svg_str = "";
        if (this._radius > 0) {
            const r2 = this._radius / 2.0;
            if (start) {
                if (signX * signY === 1) {
                    svg_str += this._rLineTo(signX * r2, 0);
                } else if (!skip) {
                    svg_str += this._rLineTo(0, signY * r2);
                }
            }

            svg_str += this._arcTo(this._x + signX * r2, this._y + signY * r2, r2, a, l, s);
            if (end) {
                if (signX * signY === 1) {
                    svg_str += this._rLineTo(0, signY * r2);
                } else if (!skip) {
                    svg_str += this._rLineTo(signX * r2, 0);
                }
            }
        }
        return svg_str;
    }

    /**
     * @private
     * @param {number} signX
     * @param {number} signY
     * @param {number} a
     * @param {number} l
     * @param {number} s
     * @param {boolean} start
     * @param {boolean} end
     * @param {boolean} skip
     * @returns {string}
     */

    _iCorner(signX, signY, a, l, s, start, end) {
        let svg_str = "";
        const r2 = this._strokeWidth + this._radius / 2.0;
        if (start) {
            if (signX * signY === -1) {
                svg_str = this._rLineTo(signX * (r2 - this._strokeWidth), 0);
            } else {
                svg_str = this._rLineTo(0, signY * (r2 - this._strokeWidth));
            }
        }

        svg_str += this._arcTo(this._x + signX * r2, this._y + signY * r2, r2, a, l, s);
        if (end) {
            if (signX * signY === -1) {
                svg_str += this._rLineTo(0, signY * (r2 - this._strokeWidth));
            } else {
                svg_str += this._rLineTo(signX * (r2 - this._strokeWidth), 0);
            }
        }
        return svg_str;
    }

    /**
     * @private
     * @returns {void}
     */
    _doInnie() {
        this.docks.push([
            (this._x + this._strokeWidth) * this._scale,
            (this._y + this._innieY2) * this._scale
        ]);
        if (this.margins[2] === 0) {
            this.margins[1] = (this._y - this._innieY1) * this._scale;
            this.margins[2] =
                (this._x - this._innieX1 - this._innieX2 - this._strokeWidth * 2) * this._scale;
        }
        this.margins[3] = (this._y + this._innieY2 + this._innieY1) * this._scale;
        return (
            this._rLineTo(-this._innieX1, 0) +
            this._rLineTo(0, -this._innieY1) +
            this._rLineTo(-this._innieX2, 0) +
            this._rLineTo(0, this._innieY2 + 2 * this._innieY1) +
            this._rLineTo(this._innieX2, 0) +
            this._rLineTo(0, -this._innieY1) +
            this._rLineTo(this._innieX1, 0)
        );
    }

    /**
     * @private
     * @returns {void}
     */
    _doOutie() {
        if (!this._outie) {
            return this._rLineTo(0, -this._innieY2);
        }
        // Outie needs to be the first dock element.
        this.docks.unshift([this._x * this._scale, this._y * this._scale]);
        return (
            this._rLineTo(0, -this._strokeWidth) +
            this._rLineTo(-this._innieX1 - 2 * this._strokeWidth, 0) +
            this._rLineTo(0, this._innieY1) +
            this._rLineTo(-this._innieX2 + 2 * this._strokeWidth, 0) +
            this._rLineTo(0, -this._innieY2 - 2 * this._innieY1 + 2 * this._strokeWidth) +
            this._rLineTo(this._innieX2 - 2 * this._strokeWidth, 0) +
            this._rLineTo(0, this._innieY1) +
            this._rLineTo(this._innieX1 + 2 * this._strokeWidth, 0) +
            this._rLineTo(0, -this._strokeWidth)
        );
    }

    /**
     * @private
     * @returns {void}
     */
    _doSlot() {
        // let x;
        if (this._slot) {
            this.docks.push([(this._x + this._slotX / 2.0) * this._scale, this._y * this._scale]);
            return (
                this._rLineTo(0, this._slotY) +
                this._rLineTo(this._slotX, 0) +
                this._rLineTo(0, -this._slotY)
            );
        } else if (this._cap) {
            this.docks.push([(this._x + this._slotX / 2.0) * this._scale, this._y * this._scale]);
            return (
                this._rLineTo(this._slotX / 2.0, -this._slotY * 3.0) +
                this._rLineTo(this._slotX / 2.0, this._slotY * 3.0)
            );
        } else {
            return this._rLineTo(this._slotX, 0);
        }
    }

    /**
     * @private
     * @returns {void}
     */
    _doTail() {
        if (this._outie) {
            return this._rLineTo(-this._slotX, 0);
        } else if (this._tail) {
            this.docks.push([(this._x + this._slotX / 2.0) * this._scale, this._y * this._scale]);
            return (
                this._rLineTo(-this._slotX / 2.0, this._slotY * 3.0) +
                this._rLineTo(-this._slotX / 2.0, -this._slotY * 3.0)
            );
        } else {
            return this._rLineTo(-this._slotX, 0);
        }
    }

    /**
     * @private
     * @returns {void}
     */
    _doTab() {
        if (this._outie) {
            return this._rLineTo(-this._slotX, 0);
        }
        this.docks.push([
            (this._x - this._slotX / 2.0) * this._scale,
            (this._y + this._strokeWidth) * this._scale
        ]);
        return (
            this._rLineTo(-this._strokeWidth, 0) +
            this._rLineTo(0, this._slotY) +
            this._rLineTo(-this._slotX + 2 * this._strokeWidth, 0) +
            this._rLineTo(0, -this._slotY) +
            this._rLineTo(-this._strokeWidth, 0)
        );
    }

    /**
     * @private
     * @param {boolean} flag
     * @returns {void}
     */
    _doPorch(flag) {
        if (flag) {
            return (
                this._rLineTo(0, this._porchY + this._innieY1) +
                this._rLineTo(this._porchX - this._radius, 0) +
                this._corner(1, 1, 90, 0, 1, true, true, false)
            );
        } else {
            return (
                this._rLineTo(0, this._porchY - this._padding) +
                this._rLineTo(this._porchX - this._radius, 0) +
                this._corner(1, 1, 90, 0, 1, true, true, false)
            );
        }
    }

    /**
     * @private
     * @param {boolean} flag
     * @returns {string}
     */
    _startBoolean(xoffset, yoffset) {
        let svg = this._newPath(xoffset, yoffset); // - this._radius);
        this._radius -= this._strokeWidth;
        this.docks.push([this._x * this._scale, this._y * this._scale]);
        svg += this._rarcTo(1, -1, 90, 0, 1);
        this._radius += this._strokeWidth;
        svg += this._rLineTo(this._strokeWidth, 0);
        svg += this._rLineTo(0, -this._expandY);
        return svg;
    }

    /**
     * @private
     * @returns {string}
     */
    _doBoolean() {
        this.docks.push([
            (this._x - this._radius + this._strokeWidth) * this._scale,
            (this._y + this._radius) * this._scale
        ]);
        this.margins[2] = (this._x - this._radius - this._strokeWidth) * this._scale;
        return this._rarcTo(-1, 1, 90, 0, 0) + this._rarcTo(1, 1, 90, 0, 0);
    }

    /**
     * @private
     * @param {boolean} notnot
     * @returns {string}
     */
    _endBoolean(notnot) {
        let svg = "";
        if (!notnot) {
            svg = this._rLineTo(-this._radius * 1.5, 0);
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
    }

    /**
     * @private
     * @param {boolean} center
     * @returns {string}
     */
    _header(center) {
        // FIXME: Why are our calculations off by 2 x strokeWidth?
        return (
            '<svg xmlns="http://www.w3.org/2000/svg" width="' +
            Math.floor(this._width + 2 * this._strokeWidth + 0.5) +
            '" height="' +
            Math.floor(this._height + 0.5) +
            '">' +
            this._transform(center) +
            '<filter id="dropshadow" height="130%"> \
            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/> \
            <feOffset dx="2" dy="2" result="offsetblur"/> \
            <feComponentTransfer xmlns="http://www.w3.org/2000/svg"> \
            <feFuncA type="linear" slope="0.2"/> </feComponentTransfer> \
            <feMerge> <feMergeNode/> <feMergeNode in="SourceGraphic"/> </feMerge> \
            </filter>'
        );
    }

    /**
     * @private
     * @param {boolean} center
     * @returns {string}
     */
    _transform(center) {
        let orientation = "";
        if (this._orientation !== 0) {
            orientation =
                '<g transform = "rotate(' +
                this._orientation +
                " " +
                this._width / 2.0 +
                " " +
                this._height / 2.0 +
                ')">';
        }
        if (center) {
            return '<g transform="translate(' + -this._minX + ", " + -this._minY + ')">';
        } else {
            return '<g transform="scale(' + this._scale + ", " + this._scale + ')">' + orientation;
        }
    }

    /**
     * @private
     * @returns {string}
     */
    _footer() {
        if (this._orientation !== 0) {
            return "</g></g></svg>";
        } else {
            return "</g></svg>";
        }
    }

    /**
     * @private
     * @returns {string}
     */
    _style() {
        return (
            'style="fill:' +
            this._fill +
            ";fill-opacity:1;stroke:" +
            this._stroke +
            ";stroke-width:" +
            this._strokeWidth +
            ';stroke-linecap:round;stroke-opacity:1;filter:url(#dropshadow);" />'
        );
    }

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

    /**
     * @public
     * @returns {string}
     */ basicBlock() {
        // The most common block type: used for 0, 1, 2, or 3
        // argument commands (forward, setxy, plus, sqrt, etc.)
        this._resetMinMax();

        const obj = this._calculateXY();
        const x = obj[0];
        const y = obj[1];

        this.margins[2] = 0;
        this.margins[3] = 0;

        let svg = this._newPath(x, y);
        svg += this._corner(1, -1, 90, 0, 1, true, true, false);
        svg += this._doSlot();
        svg += this._rLineTo(this._expandX, 0);
        const xx = this._x;
        if (!this._bool) {
            svg += this._corner(1, 1, 90, 0, 1, true, true, false);
        } else {
            svg += this._rLineTo(3, 0);
            svg += this._rLineTo(0, 2);
        }

        if (this._bool) {
            svg += this._doBoolean();
        } else if (this._innies.length === 0) {
            // To maintain standard block height
            svg += this._rLineTo(0, this._padding);
        } else {
            for (let i = 0; i < this._innies.length; i++) {
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

        if (!this._bool) {
            svg += this._corner(-1, 1, 90, 0, 1, true, true, false);
        } else {
            svg += this._rLineTo(0, 2);
            svg += this._rLineTo(-3, 0);
        }

        svg += this._lineTo(xx, this._y);
        svg += this._rLineTo(-this._expandX, 0);
        if (this._tab) {
            svg += this._doTab();
        } else {
            svg += this._doTail();
        }
        svg += this._corner(-1, -1, 90, 0, 1, true, true, false);
        svg += this._rLineTo(0, -this._expandY);
        if (this._innies.indexOf(true) !== -1) {
            svg += this._lineTo(x, this._radius + this._innieY2 + this._strokeWidth / 2.0);
            svg += this._doOutie();
        }

        this._calculateWH(true);
        svg += this._closePath();
        svg += this._style();

        // Add a block label
        const tx =
            this._width -
            this._scale * (this._innieX1 + this._innieX2) -
            4 * this._strokeWidth +
            this._labelOffset * this._scale;
        let ty = this._height / 2 + this._fontSize / (5 / this._scale);

        // If we have an odd number of innie slots, we need to avoid a
        // collision between the block label and the slot label.
        const nInnies = this._innies.length;
        if (nInnies > 2 && Math.round(nInnies / 2) * 2 !== nInnies) {
            ty -= 2 * this._fontSize;
        }

        svg += this.text(
            tx / this._scale,
            ty / this._scale,
            this._fontSize,
            this._width,
            "right",
            "block_label"
        );

        // Add a label for each innies
        let di = 0;
        if (this._slot || this._outie) {
            di = 1; // Skip the first dock since it is a slot.
        }

        let count = 1;
        for (let i = 0; i < this._innies.length; i++) {
            if (this._innies[i]) {
                ty = this.docks[di][1] - this._fontSize / (8 / this._scale) + this._scale;
                svg += this.text(
                    tx / this._scale,
                    ty / this._scale,
                    this._fontSize / 1.5,
                    this._width,
                    "right",
                    "arg_label_" + count
                );
                count += 1;
                di += 1;
            }
        }

        svg += this._footer();
        return this._header(false) + svg;
    }

    /**
     * @public
     * @returns {string}
     */
    basicBox() {
        // Basic argument style used for numbers, text, media, parameters
        this._resetMinMax();
        this.setOutie(true);

        const x = this._strokeWidth / 2.0 + this._innieX1 + this._innieX2;
        this.margins[0] = (x + this._strokeWidth + 0.5) * this._scale;
        this.margins[1] = (this._strokeWidth + 0.5) * this._scale;
        this.margins[2] = 0;
        this.margins[3] = 0;

        let svg = this._newPath(x, this._strokeWidth / 2.0);
        svg += this._rLineTo(this._expandX, 0);
        svg += this._rLineTo(0, 2 * this._radius + this._innieY2 + this._expandY);
        svg += this._rLineTo(-this._expandX, 0);
        svg += this._lineTo(x, this._radius + this._innieY2 + this._strokeWidth / 2.0);
        svg += this._doOutie();
        svg += this._closePath();
        this._calculateWH(true);
        svg += this._style();

        // Add a block label
        const tx =
            2 * (this._innieX1 + this._innieX2) +
            4 * this._strokeWidth +
            this._labelOffset * this._scale;
        const ty = this._height / 2 + this._fontSize / 2;
        svg += this.text(
            tx / this._scale,
            ty / this._scale,
            this._fontSize,
            this._width,
            "left",
            "block_label"
        );

        svg += this._footer();
        return this._header(false) + svg;
    }

    /**
     * @public
     * @returns {string}
     */
    booleanAndOr() {
        // Booleans are in a class of their own
        this._resetMinMax();
        let svg = this._startBoolean(
            this._strokeWidth / 2.0,
            this._radius * 5.5 +
                this._strokeWidth / 2.0 +
                this._innieY2 +
                this._inniesSpacer +
                this._expandY
        );
        svg += this._rLineTo(
            0,
            -this._radius * 3.5 - this._innieY2 - this._inniesSpacer - this._strokeWidth
        );

        svg += this._rarcTo(1, -1, 90, 0, 1);
        svg += this._rLineTo(this._radius / 2.0 + this._expandX, 0);
        const xx = this._x;
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
        const tx =
            this._width -
            this._scale * (this._innieX1 + this._innieX2) -
            4 * this._strokeWidth +
            this._labelOffset * this._scale;
        const ty = this._height / 2 + this._fontSize / 2;
        svg += this.text(
            tx / this._scale,
            ty / this._scale,
            this._fontSize,
            this._width,
            "right",
            "block_label"
        );

        svg += this._footer();
        return this._header(false) + svg;
    }

    /**
     * @public
     * @param {boolean} notnot
     * @returns {string}
     */
    booleanNot(notnot) {
        // Booleans are in a class of their own: not and not not
        this._resetMinMax();
        let svg = "";
        if (this._innies[0]) {
            svg = this._startBoolean(
                this._strokeWidth / 2.0,
                this._radius * 1.25 + this._strokeWidth / 2.0
            );
        } else if (!notnot) {
            svg = this._startBoolean(
                this._strokeWidth / 2.0,
                this._radius * 2.0 + this._strokeWidth / 2.0
            );
        } else {
            svg = this._startBoolean(
                this._strokeWidth / 2.0,
                this._radius * 1.25 + this._strokeWidth / 2.0
            );
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
        const xx = this._x;

        if (this._innies[0]) {
            svg += this._rLineTo(0, this._radius);
            svg += this._doInnie();
            svg += this._rLineTo(0, this._radius);
        } else if (!notnot) {
            svg += this._rLineTo(0, this._radius / 2.0);
            svg += this._doBoolean();
            svg += this._rLineTo(0, this._radius / 2.0);
        } else {
            svg += this._rLineTo(0, this._radius * 2);
        }

        svg += this._lineTo(xx, this._y);

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

        if (this._expandY2 > 0 && !notnot) {
            svg += this._rLineTo(0, -this._expandY2);
        } else if (notnot) {
            svg += this._rLineTo(0, -2);
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
        const tx =
            this._width -
            2 * (this._innieX1 + this._innieX2) -
            4 * this._strokeWidth +
            this._labelOffset * this._scale;
        const ty = this._height / 2 + this._fontSize / 2;
        svg += this.text(
            tx / this._scale,
            ty / this._scale,
            this._fontSize,
            this._width,
            "right",
            "block_label"
        );

        svg += this._footer();
        return this._header(false) + svg;
    }

    /**
     * @public
     * @param {boolean} notnot
     * @returns {string}
     */
    booleanCompare() {
        // Booleans are in a class of their own (greater than, less than, etc)
        this._resetMinMax();
        let yoffset =
            this._radius * 2 +
            2 * this._innieY2 +
            this._inniesSpacer +
            this._strokeWidth / 2.0 +
            this._expandY;
        const xoffset = this._strokeWidth / 2.0;

        const yoff = this._radius * 2;
        let svg = '<g transform="matrix(1,0,0,1,0,-' + yoff + ')"> ';

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
        const xx = this._x;
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
        svg += "</g>";

        this.margins[0] = (this._radius + this._strokeWidth) * this._scale;
        this.margins[1] = this._strokeWidth * this._scale;
        this.margins[2] = this._strokeWidth * this._scale;

        // Add a block label
        const tx =
            this._width -
            2 * (this._innieX1 + this._innieX2) -
            4 * this._strokeWidth +
            this._labelOffset * this._scale;
        const ty = this._height / 2 + this._fontSize / 2;
        svg += this.text(
            tx / this._scale,
            ty / this._scale,
            this._fontSize,
            this._width,
            "right",
            "block_label"
        );

        svg += this._footer();
        return this._header(false) + svg;
    }

    /**
     * @public
     * @returns {string}
     */
    basicClamp() {
        // Special block for clamps around stacks; includes an 'arm'
        // that extends down the left side of a stack and a bottom jaw
        // to clamp the blocks. (Used for start, action, repeat, etc.)
        const save_cap = this._cap;
        const save_slot = this._slot;
        this._resetMinMax();
        let x;
        let y;
        if (this._outie) {
            x = this._strokeWidth / 2.0 + this._innieX1 + this._innieX2;
        } else {
            x = this._strokeWidth / 2.0;
        }
        if (this._cap) {
            y = this._strokeWidth / 2.0 + this._radius + this._slotY * 3.0;
        } else {
            y = this._strokeWidth / 2.0 + this._radius;
        }

        this.margins[0] = (x + this._strokeWidth + 0.5) * this._scale;
        this.margins[1] = (this._strokeWidth + 0.5) * this._scale;
        this.margins[2] = 0;
        this.margins[3] = 0;

        let svg = this._newPath(x, y);
        svg += this._corner(1, -1, 90, 0, 1, true, true, false);
        svg += this._doSlot();
        if (this._cap) {
            this._slot = true;
            this._cap = false;
        }

        svg += this._rLineTo(this._radius + this._strokeWidth, 0);
        const xx = this._x;
        svg += this._rLineTo(this._expandX, 0);
        svg += this._corner(1, 1, 90, 0, 1, true, true, false);
        if (this._innies[0]) {
            // svg += this._doInnie();
            for (let i = 0; i < this._innies.length; i++) {
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

        for (let clamp = 0; clamp < this._clampCount; clamp++) {
            if (clamp > 0) {
                svg += this._rLineTo(this._expandX, 0);
                svg += this._rLineTo(0, 3 * this._padding);
            }
            svg += this._corner(-1, 1, 90, 0, 1, true, true, false);
            svg += this._lineTo(xx, this._y);
            const saveOutie = this._outie;
            this._outie = false;
            svg += this._doTab();
            this._outie = saveOutie;
            svg += this._iCorner(-1, 1, 90, 0, 0, true, true);
            svg += this._rLineTo(0, this._padding);
            if (this._clampSlots[clamp] > 1) {
                svg += this._rLineTo(0, this._slotSize * (this._clampSlots[clamp] - 1));
            }
            svg += this._rLineTo(0, this._expandY2);
            svg += this._iCorner(1, 1, 90, 0, 0, true, true);
            const saveSlot = this._slot;
            this._slot = true;
            svg += this._doSlot();
            this._slot = saveSlot;
            this.docks.pop(); // We don't need this dock.
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

        let tx;
        let ty;
        // Add a block label
        if (this._outie) {
            tx =
                10 * this._strokeWidth +
                this._innieX1 +
                this._innieX2 +
                this._labelOffset * this._scale;
        } else {
            tx = 8 * this._strokeWidth + this._labelOffset * this._scale;
        }

        if (this._cap) {
            ty = (this._strokeWidth / 2.0 + this._radius + this._slotY) * this._scale;
        } else if (this._innies.length > 1) {
            ty = ((this._strokeWidth / 2.0 + this._radius) * this._scale) / 2;
            ty += this._fontSize;
        } else {
            ty = ((this._strokeWidth / 2.0 + this._radius) * this._scale) / 2;
        }

        ty += (this._fontSize + 1) * this._scale;
        if (this._bool) {
            ty += this._fontSize / 2;
        }

        svg += this.text(
            tx / this._scale,
            ty / this._scale,
            this._fontSize,
            this._width,
            "left",
            "block_label"
        );

        // Booleans get an extra label.
        let count = 1;
        if (this._bool) {
            tx = this._width - this._radius;
            for (let clamp = 0; clamp < this._clampCount; clamp++) {
                ty = this.docks[clamp + 2][1] - this._fontSize + 3 * this._strokeWidth;
                svg += this.text(
                    tx / this._scale,
                    ty / this._scale,
                    this._fontSize / 1.5,
                    this._width,
                    "right",
                    "arg_label_" + count
                );
                count += 1;
            }
        }

        // Add a label for each innies
        let di = 0;
        if (this._slot || this._outie) {
            di = 1; // Skip the first dock since it is a slot.
        }

        count = 1;
        tx = this._width - this._scale * (this._innieX1 + this._innieX2) - 4 * this._strokeWidth;
        for (let i = 0; i < this._innies.length; i++) {
            if (this._innies[i]) {
                ty = this.docks[di][1] - this._fontSize / (8 / this._scale) + this._scale;
                svg += this.text(
                    tx / this._scale,
                    ty / this._scale,
                    this._fontSize / 1.5,
                    this._width,
                    "right",
                    "arg_label_" + count
                );
                count += 1;
                di += 1;
            }
        }

        svg += this._footer();
        return this._header(false) + svg;
    }

    /**
     * @public
     * @returns {string}
     */
    argClamp() {
        // A clamp that contains innies rather than flow blocks
        this._resetMinMax();
        let x;
        if (this._outie) {
            x = this._strokeWidth / 2.0 + this._innieX1 + this._innieX2;
        } else {
            x = this._strokeWidth / 2.0;
        }

        const y = this._strokeWidth / 2.0 + this._radius;
        this.margins[0] = (x + this._strokeWidth + 0.5) * this._scale;
        this.margins[1] = (this._strokeWidth + 0.5) * this._scale;
        this.margins[2] = 0;
        this.margins[3] = 0;

        let svg = this._newPath(x, y);
        svg += this._corner(1, -1, 90, 0, 1, true, true, false);
        svg += this._doSlot();

        svg += this._rLineTo(this._radius + this._strokeWidth, 0);
        const xx = this._x;
        svg += this._rLineTo(this._expandX, 0);
        svg += this._corner(1, 1, 90, 0, 1, true, true, false);
        if (this._innies[0]) {
            svg += this._doInnie();
        } else {
            svg += this._rLineTo(0, this._padding);
            this.margins[2] = (this._x - this._strokeWidth + 0.5) * this._scale;
        }

        svg += this._corner(-1, 1, 90, 0, 1, true, true, false);
        svg += this._lineTo(xx, this._y);
        svg += this._iCorner(-1, 1, 90, 0, 0, true, true);

        let j = 0;
        svg += this._doInnie();
        let dy = this._slotSize * (this._clampSlots[0][j] - 1);
        if (dy > 0) {
            svg += this._rLineTo(0, dy);
        }
        j += 1;

        const ddy = this._slotSize - this._innieY2;
        for (let i = 1; i < this._clampSlots[0].length; i++) {
            svg += this._rLineTo(0, ddy);
            svg += this._doInnie();
            dy = this._slotSize * (this._clampSlots[0][j] - 1);
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
        let tx;
        let ty;
        if (this._outie) {
            tx = 10 * this._strokeWidth + this._innieX1 + this._innieX2;
        } else {
            tx = 8 * this._strokeWidth;
        }
        if (this._cap) {
            ty = (this._strokeWidth / 2.0 + this._radius + this._slotY) * this._scale;
        } else {
            ty = ((this._strokeWidth / 2.0 + this._radius) * this._scale) / 2;
        }
        ty += (this._fontSize + 1) * this._scale;
        if (this._bool) {
            ty += this._fontSize / 2;
        }

        svg += this.text(
            tx / this._scale,
            ty / this._scale,
            this._fontSize,
            this._width,
            "left",
            "block_label"
        );

        svg += this._footer();
        return this._header(false) + svg;
    }

    /**
     * @public
     * @returns {string}
     */ untilClamp() {
        // Until block is like clamp but docks are flipped
        this._resetMinMax();
        const x = this._strokeWidth / 2.0;
        const y = this._strokeWidth / 2.0 + this._radius;
        this.margins[0] = (x + this._strokeWidth + 0.5) * this._scale;
        this.margins[1] = (this._strokeWidth + 0.5) * this._scale;
        this.margins[2] = 0;
        this.margins[3] = 0;
        let svg = this._newPath(x, y);
        svg += this._corner(1, -1, 90, 0, 1, true, true, false);
        svg += this._doSlot();
        svg += this._rLineTo(this._radius + this._strokeWidth, 0);
        svg += this._rLineTo(this._expandX, 0);
        const xx = this._x;
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
        this.docks.pop(); // We don't need this dock.
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
        let tx = 4 * this._strokeWidth;
        let ty = this.docks[2][1];

        svg += this.text(
            tx / this._scale,
            ty / this._scale,
            this._fontSize,
            this._width,
            "left",
            "block_label"
        );

        if (this._bool) {
            // Booleans get an extra label.
            tx = this._width - this._radius;
            ty = this.docks[1][1] - this._fontSize;
            svg += this.text(
                tx / this._scale,
                ty / this._scale,
                this._fontSize / 1.5,
                this._width,
                "right",
                "arg_label_1"
            );
        }

        if (this._bool) {
            // Swap bool and tab args so that the docking behaves like the while block.
            tx = this.docks[1][0];
            ty = this.docks[1][1];
            this.docks[1][0] = this.docks[2][0];
            this.docks[1][1] = this.docks[2][1];
            this.docks[2][0] = tx;
            this.docks[2][1] = ty;
        }

        svg += this._footer();
        return this._header(false) + svg;
    }

    /**
     * @public
     * @returns {string}
     */
    statusBlock() {
        // Generate a status block
        this._resetMinMax();
        const obj = this._calculateXY();
        const x = obj[0];
        const y = obj[1];
        this.margins[2] = 0;
        this.margins[3] = 0;
        let svg = this._newPath(x, y);
        svg += this._corner(1, -1, 90, 0, 1, true, true, false);
        svg += this._rLineTo(this._expandX, 0);
        const xx = this._x;
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
    }
}
