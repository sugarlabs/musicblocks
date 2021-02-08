/**
 * @file This contains the API function defimitions for JavaScript based Music Blocks code specific
 * to Graphics blocks.
 * @author Anindya Kundu
 *
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
