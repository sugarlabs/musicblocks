// Copyright (c) 2025 Arjun Jayan
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

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