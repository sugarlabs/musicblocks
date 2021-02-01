/**
 * @file This contains the API function defimitions for JavaScript based Music Blocks code specific
 * to Pen blocks.
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
 * Class pertaining to the API methods specific to Pen blocks for JavaScript based Music Blocks
 * programs.
 *
 * @class
 * @classdesc methods are imported by a importMethod function call from MusicBlocks class.
 */
class PenBlocksAPI {
    setColor(value) {
        const args = JSInterface.validateArgs("setColor", [value]);
        // value = Math.max(0, Math.min(100, Math.floor(value)));
        return this.runCommand("doSetColor", [args[0]]);
    }

    setGrey(value) {
        const args = JSInterface.validateArgs("setGrey", [value]);
        // value = Math.max(0, Math.min(100, Math.floor(value)));
        return this.runCommand("doSetChroma", [args[0]]);
    }

    setShade(value) {
        const args = JSInterface.validateArgs("setShade", [value]);
        // value = Math.max(0, Math.min(100, Math.floor(value)));
        return this.runCommand("doSetValue", [args[0]]);
    }

    setHue(value) {
        const args = JSInterface.validateArgs("setHue", [value]);
        // value = Math.max(0, Math.min(100, Math.floor(value)));
        return this.runCommand("doSetHue", [args[0]]);
    }

    setTranslucency(value) {
        const args = JSInterface.validateArgs("setTranslucency", [value]);
        // value = Math.max(0, Math.min(100, Math.floor(value)));
        args[0] = 1.0 - args[0] / 100;
        return this.runCommand("doSetPenAlpha", [args[0]]);
    }

    setPensize(value) {
        const args = JSInterface.validateArgs("setPensize", [value]);
        // value = Math.max(0, Math.min(100, Math.floor(value)));
        return this.runCommand("doSetPensize", [args[0]]);
    }

    penUp() {
        return this.runCommand("doPenUp");
    }

    penDown() {
        return this.runCommand("doPenDown");
    }

    async fillShape(flow) {
        await this.runCommand("doStartFill");
        await flow();
        await this.runCommand("doEndFill");
        turtles.refreshCanvas();

        return this.ENDFLOW;
    }

    async hollowLine(flow) {
        await this.runCommand("doStartHollowLine");
        await flow();
        await this.runCommand("doEndHollowLine");
        turtles.refreshCanvas();

        return this.ENDFLOW;
    }

    fillBackground() {
        return this.runCommand("_anonymous", () => logo.turtles.setBackgroundColor(this.turIndex));
    }

    setFont(fontname) {
        const args = JSInterface.validateArgs("setFont", [fontname]);
        return this.runCommand("doSetFont", [args[0]]);
    }
}
