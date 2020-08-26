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

/**
 * Class pertaining to the API methods specific to Graphics blocks for JavaScript based Music Blocks
 * programs.
 *
 * @class
 * @classdesc methods are imported by a importMethod function call from MusicBlocks class.
 */
class GraphicsBlocksAPI {
    goForward(steps) {
        return this.runCommand("doForward", [steps]);
    }

    goBackward(steps) {
        return this.runCommand("doForward", [-steps]);
    }

    turnRight(degrees) {
        return this.runCommand("doRight", [degrees]);
    }

    turnLeft(degrees) {
        return this.runCommand("doRight", [-degrees]);
    }

    setXY(x, y) {
        return this.runCommand("doSetXY", [x, y]);
    }

    setHeading(degrees) {
        return this.runCommand("doSetHeading", [degrees]);
    }

    drawArc(degrees, steps) {
        return this.runCommand("doArc", [degrees, steps]);
    }

    drawBezier(x, y) {
        return this.runCommand("doBezier", [x, y]);
    }

    setBezierControlPoint1(x, y) {
        return this.runCommand("setControlPoint1", [x, y]);
    }

    setBezierControlPoint2(x, y) {
        return this.runCommand("setControlPoint2", [x, y]);
    }

    clear() {
        return this.runCommand("doClear", [true, true, true]);
    }

    scrollXY(x, y) {
        return this.runCommand("doScrollXY", [x, y]);
    }
}
