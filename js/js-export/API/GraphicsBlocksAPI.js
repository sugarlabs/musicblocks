/*
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Sugar Labs
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */


/* global JSInterface */

/* exported GraphicsBlocksAPI */

/**
 * Class pertaining to the API methods specific to Graphics blocks for JavaScript based Music Blocks
 * programs.
 *
 * @class
 * @classdesc methods are imported by a importMethod function call from MusicBlocks class.
 */
class GraphicsBlocksAPI {
    goForward(steps) {
        const args = JSInterface.validateArgs("goForward", [steps]);
        return this.runCommand("doForward", [args[0]]);
    }

    goBackward(steps) {
        const args = JSInterface.validateArgs("goBackward", [steps]);
        return this.runCommand("doForward", [-args[0]]);
    }

    turnRight(degrees) {
        const args = JSInterface.validateArgs("turnRight", [degrees]);
        return this.runCommand("doRight", [args[0]]);
    }

    turnLeft(degrees) {
        const args = JSInterface.validateArgs("turnLeft", [degrees]);
        return this.runCommand("doRight", [-args[0]]);
    }

    setXY(x, y) {
        const args = JSInterface.validateArgs("setXY", [x, y]);
        return this.runCommand("doSetXY", [args[0], args[1]]);
    }

    setHeading(degrees) {
        const args = JSInterface.validateArgs("setHeading", [degrees]);
        return this.runCommand("doSetHeading", [args[0]]);
    }

    drawArc(degrees, steps) {
        const args = JSInterface.validateArgs("drawArc", [degrees, steps]);
        return this.runCommand("doArc", [args[0], args[1]]);
    }

    drawBezier(x, y) {
        const args = JSInterface.validateArgs("drawBezier", [x, y]);
        return this.runCommand("doBezier", [args[0], args[1]]);
    }

    setBezierControlPoint1(x, y) {
        const args = JSInterface.validateArgs("setBezierControlPoint1", [x, y]);
        return this.runCommand("setControlPoint1", [args[0], args[1]]);
    }

    setBezierControlPoint2(x, y) {
        const args = JSInterface.validateArgs("setBezierControlPoint2", [x, y]);
        return this.runCommand("setControlPoint2", [args[0], args[1]]);
    }

    clear() {
        return this.runCommand("doClear", [true, true, true]);
    }

    scrollXY(x, y) {
        const args = JSInterface.validateArgs("scrollXY", [x, y]);
        return this.runCommand("doScrollXY", [args[0], args[1]]);
    }
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GraphicsBlocksAPI;
}