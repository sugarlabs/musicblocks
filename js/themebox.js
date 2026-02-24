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
        blockText: "#000000",
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
        paletteColors: {
            widgets: ["#2E7D32", "#1B5E20", "#1B5E20", "#81C784"],
            pitch: ["#2E7D32", "#1B5E20", "#1B5E20", "#81C784"],
            rhythm: ["#BF360C", "#8C2A0B", "#8C2A0B", "#FF8A65"],
            meter: ["#BF360C", "#8C2A0B", "#8C2A0B", "#FF8A65"],
            tone: ["#00838F", "#005662", "#005662", "#4DD0E1"],
            ornament: ["#00838F", "#005662", "#005662", "#4DD0E1"],
            intervals: ["#2E7D32", "#1B5E20", "#1B5E20", "#81C784"],
            volume: ["#00838F", "#005662", "#005662", "#4DD0E1"],
            drum: ["#00838F", "#005662", "#005662", "#4DD0E1"],
            graphics: ["#3949AB", "#283593", "#283593", "#7986CB"],
            turtle: ["#3949AB", "#283593", "#283593", "#7986CB"],
            pen: ["#3949AB", "#283593", "#283593", "#7986CB"],
            boxes: ["#E65100", "#BF360C", "#BF360C", "#FFB74D"],
            action: ["#FF8F00", "#FF6F00", "#FF6F00", "#FFE082"],
            media: ["#C62828", "#8E0000", "#8E0000", "#FF8A80"],
            number: ["#AD1457", "#880E4F", "#880E4F", "#F48FB1"],
            boolean: ["#7B1FA2", "#4A0072", "#4A0072", "#CE93D8"],
            flow: ["#5D4037", "#3E2723", "#3E2723", "#BCAAA4"],
            sensors: ["#827717", "#4B830D", "#4B830D", "#E6EE9C"],
            extras: ["#424242", "#212121", "#212121", "#9E9E9E"],
            program: ["#424242", "#212121", "#212121", "#9E9E9E"],
            myblocks: ["#FF8F00", "#FF6F00", "#FF6F00", "#FFE082"],
            heap: ["#5D4037", "#3E2723", "#3E2723", "#BCAAA4"],
            dictionary: ["#5D4037", "#3E2723", "#3E2723", "#BCAAA4"],
            ensemble: ["#3949AB", "#283593", "#283593", "#7986CB"]
        },
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
        paletteColors: {
            widgets: ["#7CD622", "#57AD02", "#57AD02", "#B4EB7D"],
            pitch: ["#7CD622", "#57AD02", "#57AD02", "#B4EB7D"],
            rhythm: ["#FF8700", "#E86B0E", "#E86B0E", "#FEC092"],
            meter: ["#FE994F", "#E86B0E", "#E86B0E", "#FEC092"],
            tone: ["#3EDCDD", "#1DBCBD", "#1DBCBD", "#A1EEEF"],
            ornament: ["#3EDCDD", "#1DBCBD", "#1DBCBD", "#A1EEEF"],
            intervals: ["#7CD622", "#57AD02", "#57AD02", "#B4EB7D"],
            volume: ["#3EDCDD", "#1DBCBD", "#1DBCBD", "#A1EEEF"],
            drum: ["#3EDCDD", "#1DBCBD", "#1DBCBD", "#A1EEEF"],
            graphics: ["#92A9FF", "#5370DC", "#5370DC", "#CDD8FF"],
            turtle: ["#92A9FF", "#5370DC", "#5370DC", "#CDD8FF"],
            pen: ["#92A9FF", "#5370DC", "#5370DC", "#CDD8FF"],
            boxes: ["#FFB900", "#d18600", "#d18600", "#FFD092"],
            action: ["#F3C800", "#DAAF30", "#DAAF30", "#FFE391"],
            media: ["#FF664B", "#EA4326", "#EA4326", "#FFB9E2"],
            number: ["#FF6EA1", "#FF2C76", "#FF2C76", "#FFCDDF"],
            boolean: ["#D97DF5", "#B653D3", "#B653D3", "#EDC6A3"],
            flow: ["#D98A43", "#B7651A", "#B7651A", "#ECC6A4"],
            sensors: ["#AABB00", "#748400", "#748400", "#FFE391"],
            extras: ["#C4C4C4", "#A0A0A0", "#A0A0A0", "#D0D0D0"],
            program: ["#C4C4C4", "#A0A0A0", "#A0A0A0", "#D0D0D0"],
            myblocks: ["#FFBF00", "#DAAF30", "#DAAF30", "#FFE391"],
            heap: ["#D98A43", "#B7651A", "#B7651A", "#ECC6A4"],
            dictionary: ["#D98A43", "#B7651A", "#B7651A", "#ECC6A4"],
            ensemble: ["#92A9FF", "#5370DC", "#5370DC", "#CDD8FF"]
        },
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
        blockText: "#000000",
        dialogueBox: "#000000",
        strokeColor: "#FFFFFF",
        fillColor: "#FFFFFF",
        blueButton: "#00FFFF",
        blueButtonHover: "#00CCCC",
        cancelButton: "#FFFFFF",
        cancelButtonHover: "#CCCCCC",
        hoverColor: "#666666",
        widgetButton: "#00FFFF",
        widgetButtonSelect: "#FFFFFF",
        widgetBackground: "#000000",
        paletteColors: {
            widgets: ["#00FF00", "#00CC00", "#00CC00", "#66FF66"],
            pitch: ["#00FF00", "#00CC00", "#00CC00", "#66FF66"],
            rhythm: ["#FF8C9E", "#FFB3C1", "#FFD1DC", "#FFB3A7"],
            meter: ["#FF8C9E", "#FFB3C1", "#FFD1DC", "#FFB3A7"],
            tone: ["#00FFFF", "#00CCCC", "#00CCCC", "#66FFFF"],
            ornament: ["#00FFFF", "#00CCCC", "#00CCCC", "#66FFFF"],
            intervals: ["#00FF00", "#00CC00", "#00CC00", "#66FF66"],
            volume: ["#00FFFF", "#00CCCC", "#00CCCC", "#66FFFF"],
            drum: ["#00FFFF", "#00CCCC", "#00CCCC", "#66FFFF"],
            graphics: ["#FF29FF", "#FF8CFF", "#FFB3FF", "#FFD1FF"],
            turtle: ["#FF00FF", "#CC00CC", "#CC00CC", "#FF66FF"],
            pen: ["#FF29FF", "#FF8CFF", "#FFB3FF", "#FFD1FF"],
            boxes: ["#FFFF00", "#CCCC00", "#CCCC00", "#FFFF66"],
            action: ["#FFFF00", "#CCCC00", "#CCCC00", "#FFFF66"],
            media: ["#FF8C9E", "#FFB3C1", "#FFD1DC", "#FFB3A7"],
            number: ["#FF29FF", "#FF8CFF", "#FFB3FF", "#FFD1FF"],
            boolean: ["#FF29FF", "#FF8CFF", "#FFB3FF", "#FFD1FF"],
            flow: ["#FFFF00", "#CCCC00", "#CCCC00", "#FFFF66"],
            sensors: ["#00FF00", "#00CC00", "#00CC00", "#66FF66"],
            extras: ["#FFFFFF", "#CCCCCC", "#CCCCCC", "#FFFFFF"],
            program: ["#FFFFFF", "#CCCCCC", "#CCCCCC", "#FFFFFF"],
            myblocks: ["#FFFF00", "#CCCC00", "#CCCC00", "#FFFF66"],
            heap: ["#FFFF00", "#CCCC00", "#CCCC00", "#FFFF66"],
            dictionary: ["#FFFF00", "#CCCC00", "#CCCC00", "#FFFF66"],
            ensemble: ["#FF29FF", "#FF8CFF", "#FFB3FF", "#FFD1FF"]
        },
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

        // Refresh all blocks to update their colors
        if (this.activity.blocks) {
            for (const blockId in this.activity.blocks.blockList) {
                const block = this.activity.blocks.blockList[blockId];
                if (block && block.protoblock && block.protoblock.palette) {
                    // Redraw block to update other colors
                    if (typeof block.regenerateArtwork === "function") {
                        // Ensure blockfactory uses the correct theme information
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
