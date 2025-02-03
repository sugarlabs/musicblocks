// Copyright (c) 2018-21 Walter Bender
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
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    dark_onclick() {
        this._theme = "dark";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    custom_onclick() {
        this._theme = "custom";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    OnClick() {
        window.location.reload();
    }
    hide() {
        const MSGPrefix =
            "<a href='#' class='theme-link' " +
            "onMouseOver='this.style.opacity = 0.5'" +
            "onMouseOut='this.style.opacity = 1'>";
        const MSGSuffix = "</a>";
        const MSG = {
            default: _("Refresh your browser to change your theme preference."),
            light: "Refresh your browser to change your theme preference.",
            dark: "Refresh your browser to change your theme preference.",
            custom: "Refresh your browser to change your theme preference."
        };
        if (localStorage.getItem("themePreference") === this._theme) {
            this.activity.textMsg(_("Music Blocks is already set to this theme."));
        } else {
            this.activity.storage.themePreference = this._theme;
        }

        const themeLinks = document.querySelectorAll(".theme-link");
        themeLinks.forEach((link) => {
            link.addEventListener("click", () => this.OnClick());
        });
    }
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = ThemeBox;
}
