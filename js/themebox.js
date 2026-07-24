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
   global platformColor, platformThemes, getSystemThemePreference,
   PALETTEFILLCOLORS, PALETTESTROKECOLORS,
   PALETTEHIGHLIGHTCOLORS, HIGHLIGHTSTROKECOLORS,
   MULTIPALETTEICONS, PALETTEICONS, makePaletteIcons,
   globalActivity, createjs
*/

/* exported ThemeBox */

// Keys synced from platformThemes[theme] onto window.platformColor on every
// runtime theme switch. This preserves the exact behavior of the previous
// (now removed) themeConfigs table; broadening to all platformThemes keys is
// out of scope here (see #7172).
const THEME_SYNC_KEYS = [
    "textColor",
    "blockText",
    "dialogueBox",
    "strokeColor",
    "fillColor",
    "blueButton",
    "blueButtonHover",
    "cancelButton",
    "cancelButtonHover",
    "hoverColor",
    "widgetButton",
    "widgetButtonSelect",
    "widgetBackground",
    "paletteColors",
    "disconnected",
    "header",
    "aux",
    "sub",
    "rule",
    "ruleColor",
    "trashColor",
    "trashBorder",
    "trashActive",
    "background",
    "paletteSelected",
    "paletteBackground",
    "paletteLabelBackground",
    "paletteLabelSelected",
    "paletteText",
    "rulerHighlight",
    "selectorBackground",
    "selectorSelected",
    "labelColor",
    "rhythmcellcolor",
    "stopIconcolor",
    "hitAreaGraphicsBeginFill",
    "orange"
];

function syncPlatformColor(theme) {
    const src = platformThemes[theme];
    if (!src || !window.platformColor) return;
    for (const key of THEME_SYNC_KEYS) {
        if (key in src) window.platformColor[key] = src[key];
    }
}

class ThemeBox {
    /**
     * @constructor
     */
    constructor(activity) {
        this.activity = activity;
        this._theme = activity.storage.themePreference || getSystemThemePreference();
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
     * Initialize theme on page load - apply theme state without notification
     * @public
     * @returns {void}
     */
    initializeTheme() {
        const body = document.body;
        // Update body classes
        this._themes.forEach(theme => {
            if (theme === this._theme) {
                body.classList.add(theme);
            } else {
                body.classList.remove(theme);
            }
        });

        // Sync platformColor with the active theme config on startup
        syncPlatformColor(this._theme);

        // Update theme icon immediately if DOM is ready
        this.updateThemeIcon();
        // Refresh UI components (including planet iframe) if they exist
        this.refreshUIComponents();

        // Watch for OS-level theme changes at runtime.
        // Auto-switch to match OS theme change at runtime.
        if (window.matchMedia) {
            const mq = window.matchMedia("(prefers-color-scheme: dark)");

            const handler = e => {
                this._theme = e.matches ? "dark" : "light";
                this.applyThemeInstantly();
            };
            if (typeof mq.addEventListener === "function") {
                mq.addEventListener("change", handler);
            } else if (typeof mq.addListener === "function") {
                mq.addListener(handler);
            }
        }
    }

    /**
     * Apply theme instantly without page reload
     * @private
     * @returns {void}
     */
    applyThemeInstantly() {
        const body = document.body;
        body.style.background = "";
        // Update body classes
        this._themes.forEach(theme => {
            if (theme === this._theme) {
                body.classList.add(theme);
            } else {
                body.classList.remove(theme);
            }
        });

        // Update platformColor globally
        syncPlatformColor(this._theme);

        // Update palette colors in global variables used by blocks
        if (window.platformColor.paletteColors) {
            for (const p in window.platformColor.paletteColors) {
                PALETTEFILLCOLORS[p] = window.platformColor.paletteColors[p][0];
                PALETTESTROKECOLORS[p] = window.platformColor.paletteColors[p][1];
                PALETTEHIGHLIGHTCOLORS[p] = window.platformColor.paletteColors[p][2];
                HIGHLIGHTSTROKECOLORS[p] = window.platformColor.paletteColors[p][1];
            }
        }

        // Update theme-color meta tag
        const themeColorMeta = document.querySelector("meta[name=theme-color]");
        if (themeColorMeta && window.platformColor) {
            themeColorMeta.content = window.platformColor.header;
        }

        // Update canvas background using theme config
        const canvas = document.getElementById("myCanvas") || document.getElementById("canvas");
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

        // Refresh all blocks to update their colors
        if (this.activity.blocks) {
            for (const blockId in this.activity.blocks.blockList) {
                const block = this.activity.blocks.blockList[blockId];
                if (block && block.protoblock && block.protoblock.palette) {
                    // Redraw block to update other colors
                    if (typeof block.regenerateArtwork === "function") {
                        block.regenerateArtwork(false);
                    }
                    // Update text color
                    if (block.text) {
                        block.text.color = window.platformColor.blockText;
                    }
                    if (block.collapseText) {
                        block.collapseText.color = window.platformColor.blockText;
                    }
                }
            }
        }

        // Update toolbar icon for current theme
        this.updateThemeIcon();

        // Refresh UI components that depend on platformColor
        this.refreshUIComponents();

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

        // Notify user
        this.activity.textMsg(_("Theme switched to %s mode.").replace(/%s/g, this._theme), 2000);
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

                const paletteToggle = document.getElementById("paletteToggle");
                if (paletteToggle) {
                    paletteToggle.style.backgroundColor = platformColor.paletteLabelBackground;
                    paletteToggle.style.color = "white";
                }

                // Refresh palette selector icons with new theme colors
                const tr = document.querySelector("#palette > div > table > thead > tr");
                if (tr) {
                    for (let j = 0; j < MULTIPALETTEICONS.length; j++) {
                        const img = makePaletteIcons(
                            PALETTEICONS[MULTIPALETTEICONS[j]]
                                .replace(
                                    "background_fill_color",
                                    platformColor.paletteLabelBackground
                                )
                                .replace(/stroke_color/g, platformColor.strokeColor)
                                .replace(/fill_color/g, platformColor.fillColor),
                            this.activity.palettes.cellSize,
                            this.activity.palettes.cellSize
                        );
                        tr.children[j].children[0].src = img.src;
                        tr.children[j].children[1].style.background =
                            platformColor.paletteLabelBackground;
                    }
                }

                // Refresh palette buttons and labels
                const tbody = document.querySelector("#palette > div > table:nth-child(2) > tbody");
                if (tbody) {
                    // Update search button and label
                    const searchRow = tbody.rows[0];
                    if (searchRow) {
                        const searchIcon = makePaletteIcons(
                            PALETTEICONS["search"],
                            this.activity.palettes.cellSize,
                            this.activity.palettes.cellSize
                        );
                        searchRow.cells[0].firstChild.src = searchIcon.src;
                        searchRow.cells[1].style.color = platformColor.paletteText;
                        searchRow.style.backgroundColor = platformColor.paletteBackground;
                    }

                    // Update other palette buttons
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
                            row.cells[1].style.color = platformColor.paletteText;
                            row.style.backgroundColor = platformColor.paletteBackground;
                        }
                    }
                }

                // Refresh the currently open palette menu so block artwork
                // SVGs are regenerated with the updated blockText color.
                const activeName = this.activity.palettes.activePalette;
                if (activeName && this.activity.palettes.dict[activeName]) {
                    this.activity.palettes.dict[activeName].hideMenu();
                    this.activity.palettes.showPalette(activeName);
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

        // Update grid colors for new theme
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
                        // Apply invert filter for dark/high contrast mode (white grids)
                        const invertFilter = new createjs.ColorFilter(-1, -1, -1, 1, 255, 255, 255);
                        grid.filters = [invertFilter];
                    } else {
                        // Remove filter for light mode (black grids)
                        grid.filters = [];
                    }
                    // Re-cache the bitmap to apply the new filter
                    if (grid.visible) {
                        grid.uncache();
                        grid.cache(0, 0, 1200, 900);
                        grid.updateCache();
                    }
                }
            });
        }

        // Update planet iframe theme via postMessage instead of directly
        // accessing iframe.contentDocument (which breaks under sandboxing
        // or cross-origin isolation).
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
