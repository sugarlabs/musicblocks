// Copyright (c) 2026 Sugarlabs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* global platformColor, PALETTEFILLCOLORS, PALETTESTROKECOLORS, PALETTEHIGHLIGHTCOLORS, HIGHLIGHTSTROKECOLORS, initBasicProtoBlocks, docById, ErrorHandler, _ */

/* exported setupPaletteLoader, PaletteLoader */

/**
 * Manages palette initialization and regeneration for Music Blocks.
 *
 * Owns: palette color mapping from the active platform theme, and the
 * full palette regeneration sequence (hide → reinitialize → restore
 * positions → update).
 *
 * Does NOT own: palette DOM rendering, palette button setup, block
 * creation, Activity orchestration, or plugin loading.
 */
class PaletteLoader {
    /**
     * @param {object} activity - The Activity instance.
     */
    constructor(activity) {
        this.activity = activity;
    }

    /**
     * Populates the global palette color maps from the active platform
     * theme. Must be called before palettes are rendered so that every
     * palette reads the correct fill/stroke/highlight colors.
     */
    initializePaletteColors() {
        for (const p in platformColor.paletteColors) {
            PALETTEFILLCOLORS[p] = platformColor.paletteColors[p][0];
            PALETTESTROKECOLORS[p] = platformColor.paletteColors[p][1];
            PALETTEHIGHLIGHTCOLORS[p] = platformColor.paletteColors[p][2];
            HIGHLIGHTSTROKECOLORS[p] = platformColor.paletteColors[p][1];
        }
    }

    /**
     * Re-creates all palettes, reinitializes blocks, and restores
     * previous palette positions and visibility. Called after a
     * language or theme change so that labels and colors are refreshed.
     */
    regeneratePalettes() {
        const activity = this.activity;
        try {
            const palettePositions = {};
            if (activity.palettes && activity.palettes.dict) {
                for (const name in activity.palettes.dict) {
                    const palette = activity.palettes.dict[name];
                    if (
                        palette &&
                        palette.container &&
                        typeof palette.container.x !== "undefined"
                    ) {
                        palettePositions[name] = {
                            x: palette.container.x,
                            y: palette.container.y,
                            visible: !!palette.visible
                        };
                    }
                }
            }

            if (!activity.palettes) {
                console.warn("Palettes object not initialized");
                return;
            }

            if (typeof activity.palettes.hide !== "function") {
                console.warn("Palettes hide method not available");
            } else {
                activity.palettes.hide();
            }

            activity.palettes.reinitialize(activity.palettes);

            const element = docById("palette");
            element.style.top = `${60 + activity.palettes.top}px`;

            if (activity.blocks) {
                initBasicProtoBlocks(activity);
            }

            if (activity.palettes && activity.palettes.dict) {
                for (const name in palettePositions) {
                    const palette = activity.palettes.dict[name];
                    const pos = palettePositions[name];

                    if (palette && palette.container && pos) {
                        palette.container.x = pos.x;
                        palette.container.y = pos.y;

                        if (pos.visible) {
                            palette.showMenu(true);
                        }
                    }
                }
            }

            if (activity.palettes && typeof activity.palettes.updatePalettes === "function") {
                activity.palettes.updatePalettes();
            }

            if (activity.blocks && typeof activity.blocks.updateBlockPositions === "function") {
                activity.blocks.updateBlockPositions();
            }

            activity.refreshCanvas();
        } catch (e) {
            ErrorHandler.capture(e, { operation: "regeneratePalettes" });
            activity.errorMsg(_("Error regenerating palettes. Please refresh the page."));
        }
    }
}

/**
 * Creates a PaletteLoader and attaches it to the activity.
 * Called once from the Activity constructor, before setupDependencies().
 * @param {object} activity - The Activity instance.
 */
const setupPaletteLoader = activity => {
    activity.paletteLoader = new PaletteLoader(activity);
};

if (typeof define === "function" && define.amd) {
    define(function () {
        window.setupPaletteLoader = setupPaletteLoader;
        return { setupPaletteLoader, PaletteLoader };
    });
} else if (typeof module !== "undefined" && module.exports) {
    module.exports = { setupPaletteLoader, PaletteLoader };
}
