/**
 * @file This contains the API function defimitions for JavaScript based Music Blocks code specific
 * to Dictionary blocks.
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

/* global turtles, JSInterface */

/* exported DictBlocksAPI */

/**
 * Class pertaining to the API methods specific to Dictionary blocks for JavaScript based Music Blocks
 * programs.
 *
 * @class
 * @classdesc methods are imported by a importMethod function call from MusicBlocks class.
 */
class DictBlocksAPI {
    getDict(dict) {
        if (dict === undefined) dict = this.turIndex;
        const args = JSInterface.validateArgs("getDict", [dict]);
        return this.runCommand("getDict", [args[0], this.turIndex]);
    }

    showDict(dict) {
        if (dict === undefined) dict = this.turIndex;
        const args = JSInterface.validateArgs("showDict", [dict]);
        return this.runCommand("showDict", [args[0], this.turIndex]);
    }

    setValue(key, value, dict) {
        if (dict === undefined) dict = turtles.ithTurtle(this.turIndex).name;
        const args = JSInterface.validateArgs("setValue", [key, value, dict]);
        return this.runCommand("setValue", [args[2], args[0], args[1], this.turIndex]);
    }

    getValue(key, dict) {
        if (dict === undefined) dict = turtles.ithTurtle(this.turIndex).name;
        const args = JSInterface.validateArgs("getValue", [key, dict]);
        return this.runCommand("getValue", [args[1], args[0], this.turIndex]);
    }
}
