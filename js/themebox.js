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


//A dropdown for selecting theme

/*
   global _
*/

/* exported ThemeBox */

class ThemeBox {
    /**
     * @constructor
     */
    constructor(activity) {
        this.activity = activity;
        this._theme = activity.storage.themePreference;
    }

    /**
     * @public
     * @returns {void}
     */
    light_onclick() {
        this._theme = "light";
        this.setPreference();
    }

    /**
     * @public
     * @returns {void}
     */
    dark_onclick() {
        this._theme = "dark";
        this.setPreference();
    }

    // /**
    //  * @public
    //  * @returns {void}
    //  */
    // custom_onclick() {
    //     this._theme = "custom";
    //     this.setPreference();
    // }

    /**
     * @public
     * @returns {void}
     */
    reload() {
        window.location.reload();
    }

    setPreference() {
        if (localStorage.getItem("themePreference") === this._theme) {
            this.activity.textMsg(_("Music Blocks is already set to this theme."));
        } else {
            this.activity.storage.themePreference = this._theme;
            this.reload();
        }
    }
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = ThemeBox;
}