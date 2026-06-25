// Copyright (c) 2025 Arjun Jayan
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// A dropdown for selecting theme

/*
   global getSystemThemePreference,
   PALETTEFILLCOLORS, PALETTESTROKECOLORS,
   PALETTEHIGHLIGHTCOLORS, HIGHLIGHTSTROKECOLORS,
   MULTIPALETTEICONS, PALETTEICONS, makePaletteIcons,
   globalActivity, createjs, platformColor, _
*/

/* exported ThemeBox */

class ThemeBox {
    constructor(activity) {
        this.activity = activity;
        this._theme = activity.storage.themePreference || getSystemThemePreference();
        this._themes = ["light", "dark", "highcontrast"];
    }

    _ensureThemeColorFallbacks() {
        if (!window.platformColor) {
            window.platformColor = {};
        }

        const themeBackgrounds = {
            light: "#F9F9F9",
            dark: "#303030",
            highcontrast: "#000000"
        };

        window.platformColor.background = themeBackgrounds[this._theme];
        window.platformColor.header = window.platformColor.header || "#4DA6FF";
        window.platformColor.selectorSelected = window.platformColor.selectorSelected || "#1A8CFF";
    }

    _applyBodyTheme() {
        const body = document.body;
        this._themes.forEach(theme => body.classList.toggle(theme, theme === this._theme));

        if (typeof window.syncPlatformColor === "function") {
            window.syncPlatformColor(this._theme);
        }

        this._ensureThemeColorFallbacks();
    }

    light_onclick() {
        this._theme = "light";
        this.setPreference();
    }

    dark_onclick() {
        this._theme = "dark";
        this.setPreference();
    }

    highcontrast_onclick() {
        this._theme = "highcontrast";
        this.setPreference();
    }

    initializeTheme() {
        this._applyBodyTheme();
        this.updateThemeIcon();
        this.refreshUIComponents();
    }

    applyThemeInstantly() {
        this._applyBodyTheme();

        if (window.platformColor && window.platformColor.paletteColors) {
            for (const paletteName in window.platformColor.paletteColors) {
                PALETTEFILLCOLORS[paletteName] = window.platformColor.paletteColors[paletteName][0];
                PALETTESTROKECOLORS[paletteName] =
                    window.platformColor.paletteColors[paletteName][1];
                PALETTEHIGHLIGHTCOLORS[paletteName] =
                    window.platformColor.paletteColors[paletteName][2];
                HIGHLIGHTSTROKECOLORS[paletteName] =
                    window.platformColor.paletteColors[paletteName][1];
            }
        }

        const themeColorMeta = document.querySelector("meta[name=theme-color]");
        if (themeColorMeta && window.platformColor) {
            themeColorMeta.content = window.platformColor.header;
        }

        const myCanvas = document.getElementById("myCanvas");
        if (myCanvas && window.platformColor) {
            myCanvas.style.backgroundColor = window.platformColor.background;
        }

        const canvas = document.getElementById("canvas");
        if (canvas) {
            canvas.style.backgroundColor = "transparent";
        }

        if (this.activity.turtles && window.platformColor) {
            this.activity.turtles._locked = false;
            this.activity.turtles._backgroundColor = window.platformColor.background;
            this.activity.turtles.makeBackground();
            this.activity.refreshCanvas();
        }

        if (this.activity.blocks) {
            for (const blockId in this.activity.blocks.blockList) {
                const block = this.activity.blocks.blockList[blockId];
                if (block && block.protoblock && block.protoblock.palette) {
                    if (typeof block.regenerateArtwork === "function") {
                        block.regenerateArtwork(false);
                    }
                    if (block.text) {
                        block.text.color = window.platformColor.blockText;
                    }
                    if (block.collapseText) {
                        block.collapseText.color = window.platformColor.blockText;
                    }
                }
            }
        }

        this.updateThemeIcon();
        this.refreshUIComponents();

        // Update focus ring colors for accessibility
        if (typeof window.AccessibilityHelper !== "undefined") {
            window.AccessibilityHelper.updateFocusRingForTheme(this._theme);
        }

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const topRightButtons = document.querySelectorAll(
                    "#buttoncontainerTOP .tooltipped"
                );
                const navHeight = document.querySelector("nav")?.offsetHeight || 64;
                const BASE_TOP = navHeight + 12;
                topRightButtons.forEach(btn => {
                    btn.style.top = BASE_TOP + globalActivity.toolbarHeight + "px";
                });
            });
        });

        this.activity.textMsg(_("Theme switched to " + this._theme + " mode."), 2000);
    }

    updateThemeIcon() {
        const themeSelectIcon = document.getElementById("themeSelectIcon");
        if (themeSelectIcon) {
            const currentThemeElement = document.getElementById(this._theme);
            if (currentThemeElement) {
                themeSelectIcon.innerHTML = currentThemeElement.innerHTML;
            }
        }
    }

    refreshUIComponents() {
        if (this.activity.palettes) {
            try {
                const paletteElement = document.getElementById("palette");
                if (paletteElement && paletteElement.childNodes[0]) {
                    paletteElement.childNodes[0].style.border = `1px solid ${window.platformColor.selectorSelected}`;
                }

                const paletteToggle = document.getElementById("paletteToggle");
                if (paletteToggle) {
                    paletteToggle.style.backgroundColor =
                        window.platformColor.paletteLabelBackground;
                    paletteToggle.style.color = "white";
                }

                const tr = document.querySelector("#palette > div > table > thead > tr");
                if (tr) {
                    for (let j = 0; j < MULTIPALETTEICONS.length; j++) {
                        const img = makePaletteIcons(
                            PALETTEICONS[MULTIPALETTEICONS[j]]
                                .replace(
                                    "background_fill_color",
                                    window.platformColor.paletteLabelBackground
                                )
                                .replace(/stroke_color/g, window.platformColor.strokeColor)
                                .replace(/fill_color/g, window.platformColor.fillColor),
                            this.activity.palettes.cellSize,
                            this.activity.palettes.cellSize
                        );
                        tr.children[j].children[0].src = img.src;
                        tr.children[j].children[1].style.background =
                            window.platformColor.paletteLabelBackground;
                    }
                }

                const tbody = document.querySelector("#palette > div > table:nth-child(2) > tbody");
                if (tbody) {
                    const searchRow = tbody.rows[0];
                    if (searchRow) {
                        const searchIcon = makePaletteIcons(
                            PALETTEICONS["search"],
                            this.activity.palettes.cellSize,
                            this.activity.palettes.cellSize
                        );
                        searchRow.cells[0].firstChild.src = searchIcon.src;
                        searchRow.cells[1].style.color = window.platformColor.paletteText;
                        searchRow.style.backgroundColor = window.platformColor.paletteBackground;
                    }

                    for (let i = 1; i < tbody.rows.length; i++) {
                        const row = tbody.rows[i];
                        const label = row.cells[1].textContent.trim().toLowerCase();
                        if (label && PALETTEICONS[label]) {
                            const icon = makePaletteIcons(
                                PALETTEICONS[label],
                                this.activity.palettes.cellSize,
                                this.activity.palettes.cellSize
                            );
                            row.cells[0].firstChild.src = icon.src;
                            row.cells[1].style.color = window.platformColor.paletteText;
                            row.style.backgroundColor = window.platformColor.paletteBackground;
                        }
                    }
                }

                const activeName = this.activity.palettes.activePalette;
                if (activeName && this.activity.palettes.dict[activeName]) {
                    this.activity.palettes.dict[activeName].hideMenu();
                    this.activity.palettes.showPalette(activeName);
                }
            } catch (e) {
                console.debug("Could not refresh palette:", e);
            }
        }

        const floatingWindows = document.querySelectorAll("#floatingWindows > .windowFrame");
        floatingWindows.forEach(win => {
            if (this._theme === "dark") {
                win.style.backgroundColor = "#454545";
                win.style.borderColor = "#000000";
            } else if (this._theme === "highcontrast") {
                win.style.backgroundColor = window.platformColor.widgetBackground || "#000000";
                win.style.borderColor = window.platformColor.strokeColor || "#FFFFFF";
            } else {
                win.style.backgroundColor = "";
                win.style.borderColor = "";
            }
            const title = win.querySelector(".wftTitle");
            if (title) {
                if (this._theme === "highcontrast") {
                    title.style.color = window.platformColor.textColor || "#FFFFFF";
                } else {
                    title.style.color = "";
                }
            }
        });

        // Remove toolbar box shadow/border in High Contrast mode to avoid white line
        const toolbars = document.querySelectorAll("nav, .nav-wrapper, .button-container");
        toolbars.forEach(el => {
            if (this._theme === "highcontrast") {
                el.style.boxShadow = "none";
                el.style.borderBottom = "none";
                el.style.borderColor = "transparent";
            } else {
                el.style.boxShadow = "";
                el.style.borderBottom = "";
                el.style.borderColor = "";
            }
        });

        const searchInput = document.getElementById("search");
        if (searchInput && window.platformColor) {
            if (this._theme === "dark" || this._theme === "highcontrast") {
                searchInput.style.backgroundColor = window.platformColor.background || "";
                searchInput.style.color = window.platformColor.textColor || "";
                searchInput.style.borderColor = window.platformColor.strokeColor || "";
            } else {
                searchInput.style.backgroundColor = "";
                searchInput.style.color = "";
                searchInput.style.borderColor = "";
            }
        }

        if (this.activity.refreshCanvas) {
            this.activity.refreshCanvas();
        }

        if (this.activity.turtles) {
            const grids = [
                this.activity.cartesianBitmap,
                this.activity.polarBitmap,
                this.activity.trebleBitmap,
                this.activity.grandBitmap,
                this.activity.sopranoBitmap,
                this.activity.altoBitmap,
                this.activity.tenorBitmap,
                this.activity.bassBitmap
            ];

            const isDarkMode = this._theme === "dark";
            const isHighContrastMode = this._theme === "highcontrast";

            grids.forEach(grid => {
                if (grid) {
                    if (isDarkMode || isHighContrastMode) {
                        const invertFilter = new createjs.ColorFilter(-1, -1, -1, 1, 255, 255, 255);
                        grid.filters = [invertFilter];
                    } else {
                        grid.filters = [];
                    }
                    if (grid.visible) {
                        grid.uncache();
                        grid.cache(0, 0, 1200, 900);
                        grid.updateCache();
                    }
                }
            });
        }

        const planetIframe = document.getElementById("planet-iframe");
        if (planetIframe && planetIframe.contentWindow) {
            try {
                const remove = this._themes.filter(t => t !== this._theme);
                planetIframe.contentWindow.postMessage(
                    {
                        type: "MB_APPLY_THEME",
                        payload: { add: [this._theme], remove }
                    },
                    "*"
                );
            } catch (e) {
                console.debug("Could not update planet iframe theme:", e);
            }
        }
    }

    setPreference() {
        if (localStorage.getItem("themePreference") === this._theme) {
            this.activity.textMsg(_("Music Blocks is already set to this theme."));
        } else {
            this.activity.storage.themePreference = this._theme;
            try {
                localStorage.setItem("themePreference", this._theme);
            } catch (e) {
                console.warn("Could not save theme preference:", e);
            }

            this.applyThemeInstantly();
        }
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = ThemeBox;
}
