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


/* global globalActivity, JSInterface */

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
        if (dict === undefined) dict = globalActivity.turtles.ithTurtle(this.turIndex).name;
        const args = JSInterface.validateArgs("setValue", [key, value, dict]);
        return this.runCommand("setValue", [args[2], args[0], args[1], this.turIndex]);
    }

    getValue(key, dict) {
        if (dict === undefined) dict = globalActivity.turtles.ithTurtle(this.turIndex).name;
        const args = JSInterface.validateArgs("getValue", [key, dict]);
        return this.runCommand("getValue", [args[1], args[0], this.turIndex]);
    }
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DictBlocksAPI;
}