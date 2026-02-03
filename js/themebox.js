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
   global _, platformColor
*/

/* exported ThemeBox, themeConfigs */

const themeConfigs = {
    dark: {
        textColor: "#E2E2E2",
        blockText: "#E2E2E2",
        dialogueBox: "#1C1C1C",
        strokeColor: "#E2E2E2",
        fillColor: "#F9F9F9",
        blueButton: "#0066FF",
        blueButtonHover: "#023a76",
        cancelButton: "#f1f1f1",
        cancelButtonHover: "#afafaf",
        hoverColor: "#808080",
        widgetButton: "#225A91",
        widgetButtonSelect: "#979797",
        widgetBackground: "#454545",
        disconnected: "#5C5C5C",
        header: "#1E88E5",
        aux: "#1976D2",
        sub: "#64B5F6",
        rule: "#303030",
        ruleColor: "#303030",
        trashColor: "#757575",
        trashBorder: "#424242",
        trashActive: "#E53935",
        background: "#303030",
        paletteSelected: "#1E1E1E",
        paletteBackground: "#1C1C1C",
        paletteLabelBackground: "#022363",
        paletteLabelSelected: "#01143b",
        paletteText: "#BDBDBD",
        rulerHighlight: "#FFEB3B",
        selectorBackground: "#64B5F6",
        selectorSelected: "#1E88E5",
        labelColor: "#BDBDBD",
        rhythmcellcolor: "#303030",
        stopIconcolor: "#D50000",
        hitAreaGraphicsBeginFill: "#121212",
        orange: "#FB8C00"
    },
    light: {
        textColor: "black",
        blockText: "#282828",
        dialogueBox: "#fff",
        strokeColor: "#E2E2E2",
        fillColor: "#F9F9F9",
        blueButton: "#0066FF",
        blueButtonHover: "#023a76",
        cancelButton: "#f1f1f1",
        cancelButtonHover: "#afafaf",
        hoverColor: "#E0E0E0",
        widgetBackground: "#ccc",
        widgetButton: "#8cc6ff",
        widgetButtonSelect: "#C8C8C8",
        disconnected: "#C4C4C4",
        header: "#4DA6FF",
        aux: "#1A8CFF",
        sub: "#8CC6FF",
        rule: "#E2E2E2",
        ruleColor: "#E2E2E2",
        trashColor: "#C0C0C0",
        trashBorder: "#808080",
        trashActive: "#FF0000",
        background: "#F9F9F9",
        paletteSelected: "#F3F3F3",
        paletteBackground: "#FFFFFF",
        paletteLabelBackground: "#8CC6FF",
        paletteLabelSelected: "#1A8CFF",
        paletteText: "#666666",
        rulerHighlight: "#FFBF00",
        selectorBackground: "#8CC6FF",
        selectorSelected: "#1A8CFF",
        labelColor: "#a0a0a0",
        rhythmcellcolor: "#c8c8c8",
        stopIconcolor: "#ea174c",
        hitAreaGraphicsBeginFill: "#FFF",
        orange: "#e37a00"
    },
    highcontrast: {
        textColor: "#FFFFFF",
        blockText: "#FFFFFF",
        dialogueBox: "#000000",
        strokeColor: "#FFFFFF",
        fillColor: "#000000",
        blueButton: "#00FFFF",
        blueButtonHover: "#00CCCC",
        cancelButton: "#FFFFFF",
        cancelButtonHover: "#CCCCCC",
        hoverColor: "#666666",
        widgetButton: "#00FFFF",
        widgetButtonSelect: "#FFFFFF",
        widgetBackground: "#000000",
        disconnected: "#666666",
        header: "#00FFFF",
        aux: "#00CCCC",
        sub: "#00FFFF",
        rule: "#FFFFFF",
        ruleColor: "#FFFFFF",
        trashColor: "#FFFFFF",
        trashBorder: "#FFFFFF",
        trashActive: "#FF0000",
        background: "#000000",
        paletteSelected: "#111111",
        paletteBackground: "#000000",
        paletteLabelBackground: "#000080",
        paletteLabelSelected: "#0000FF",
        paletteText: "#FFFFFF",
        rulerHighlight: "#FFFF00",
        selectorBackground: "#00FFFF",
        selectorSelected: "#00CCCC",
        labelColor: "#FFFFFF",
        rhythmcellcolor: "#333333",
        stopIconcolor: "#FF0000",
        hitAreaGraphicsBeginFill: "#000000",
        orange: "#FF8800"
    }
};

class ThemeBox {
    /**
     * @constructor
     */
    constructor(activity) {
        this.activity = activity;
        this._theme = activity.storage.themePreference || "light";
        this._themes = ["light", "dark", "highcontrast"];
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

    highcontrast_onclick() {
        this._theme = "highcontrast";
        this.setPreference();
    }

    /**
     * Apply theme instantly without page reload
     * @private
     * @returns {void}
     */
    applyThemeInstantly() {
        const body = document.body;
        // Update body classes
        this._themes.forEach(theme => {
            if (theme === this._theme) {
                body.classList.add(theme);
            } else {
                body.classList.remove(theme);
            }
        });

        // Update platformColor globally
        if (themeConfigs[this._theme]) {
            Object.assign(window.platformColor, themeConfigs[this._theme]);
        }

        // Update theme-color meta tag
        const themeColorMeta = document.querySelector("meta[name=theme-color]");
        if (themeColorMeta && window.platformColor) {
            themeColorMeta.content = window.platformColor.header;
        }

        // Update canvas background using theme config
        const canvas = document.getElementById("canvas");
        if (canvas) {
            canvas.style.backgroundColor = window.platformColor.background;
        }

        // Update the turtles background color (this redraws the canvas background)
        if (this.activity.turtles) {
            // Unlock to allow makeBackground to redraw
            this.activity.turtles._locked = false;
            this.activity.turtles._backgroundColor = window.platformColor.background;
            this.activity.turtles.makeBackground();
            this.activity.refreshCanvas();
        }

        // Update toolbar icon for current theme
        this.updateThemeIcon();

        // Refresh UI components that depend on platformColor
        this.refreshUIComponents();

        // Notify user
        this.activity.textMsg(_("Theme switched to " + this._theme + " mode."), 2000);
    }

    /**
     * Update theme selector icon to reflect current theme
     * @private
     * @returns {void}
     */
    updateThemeIcon() {
        const themeSelectIcon = document.getElementById("themeSelectIcon");
        if (themeSelectIcon) {
            const currentThemeElement = document.getElementById(this._theme);
            if (currentThemeElement) {
                themeSelectIcon.innerHTML = currentThemeElement.innerHTML;
            }
        }
    }

    /**
     * Refresh UI components that depend on theme colors
     * @private
     * @returns {void}
     */
    refreshUIComponents() {
        // Refresh palette if it exists
        if (this.activity.palettes) {
            try {
                // Update palette selector border color
                const paletteElement = document.getElementById("palette");
                if (paletteElement && paletteElement.childNodes[0]) {
                    paletteElement.childNodes[0].style.border = `1px solid ${window.platformColor.selectorSelected}`;
                }
            } catch (e) {
                console.debug("Could not refresh palette:", e);
            }
        }

        // Refresh floating windows
        const floatingWindows = document.querySelectorAll("#floatingWindows > .windowFrame");
        floatingWindows.forEach(win => {
            if (this._theme === "dark") {
                win.style.backgroundColor = "#454545";
                win.style.borderColor = "#000000";
            } else {
                win.style.backgroundColor = "";
                win.style.borderColor = "";
            }
        });

        // Refresh the activity canvas if available
        if (this.activity.refreshCanvas) {
            this.activity.refreshCanvas();
        }

        // Update planet iframe theme if it exists
        const planetIframe = document.getElementById("planet-iframe");
        if (planetIframe && planetIframe.contentDocument) {
            try {
                const planetBody = planetIframe.contentDocument.body;
                if (planetBody) {
                    this._themes.forEach(theme => {
                        if (theme === this._theme) {
                            planetBody.classList.add(theme);
                        } else {
                            planetBody.classList.remove(theme);
                        }
                    });
                }
            } catch (e) {
                // Cross-origin restriction may prevent this
                console.debug("Could not update planet iframe theme:", e);
            }
        }
    }

    /**
     * @public
     * @returns {void}
     */
    reload() {
        // Keep for backward compatibility, but prefer instant switching
        window.location.reload();
    }

    /**
     * @public
     * @returns {void}
     */
    setPreference() {
        if (localStorage.getItem("themePreference") === this._theme) {
            this.activity.textMsg(_("Music Blocks is already set to this theme."));
        } else {
            // Save preference to localStorage
            this.activity.storage.themePreference = this._theme;
            try {
                localStorage.setItem("themePreference", this._theme);
            } catch (e) {
                console.warn("Could not save theme preference:", e);
            }

            // Apply theme instantly instead of reloading
            this.applyThemeInstantly();
        }
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = ThemeBox;
}
