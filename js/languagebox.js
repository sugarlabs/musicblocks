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

//A dropdown for selecting language

/*
   global _, createHelpContent
*/

/* exported LanguageBox */

class LanguageBox {
    /**
     * @constructor
     */
    constructor(activity) {
        this.activity = activity;
        this._language = activity.storage.languagePreference;
    }

    /**
     * @public
     * @returns {void}
     */
    enUS_onclick() {
        this._language = "enUS";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    enUK_onclick() {
        this._language = "enUK";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    ko_onclick() {
        this._language = "ko";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    ja_onclick() {
        this._language = "ja-kanji";
        this.activity.storage.kanaPreference = "kanji";
        this.hide();
    }

    kana_onclick() {
        this._language = "ja-kana";
        this.activity.storage.kanaPreference = "kana";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    es_onclick() {
        this._language = "es";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    pt_onclick() {
        this._language = "pt";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    zhCN_onclick() {
        this._language = "zh_CN";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    th_onclick() {
        this._language = "th";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    hi_onclick() {
        this._language = "hi";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    ibo_onclick() {
        this._language = "ibo";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    ar_onclick() {
        this._language = "ar";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    he_onclick() {
        this._language = "he";
        this.hide();
    }
    /**
     * @public
     * @returns {void}
     */
    te_onclick() {
        this._language = "te";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    tr_onclick() {
        this._language = "tr";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    ayc_onclick() {
        this._language = "ayc";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    quz_onclick() {
        this._language = "quz";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    bn_onclick() {
        this._language = "bn";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    gug_onclick() {
        this._language = "gug";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    ur_onclick() {
        this._language = "ur";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    OnClick() {
        this.hotSwapLanguage();
    }

    /**
     * Dynamically switches the UI language without a page reload.
     *
     * Workflow:
     * 1. Tell i18next to load the new locale bundle.
     * 2. Re-initialize toolbar strings (they call _() eagerly).
     * 3. Rebuild palette buttons + protoblock labels (they bake _() into SVGs).
     * 4. Walk every block on the canvas and regenerate its artwork so the
     *    new staticLabels are painted.
     * 5. Push the lang into the URL via History API (no reload).
     *
     * @public
     * @returns {void}
     */
    hotSwapLanguage() {
        const newLang = this._language;
        const activity = this.activity;

        // Normalize Japanese variants for i18next
        let i18nLang = newLang;
        if (i18nLang.startsWith("ja")) {
            i18nLang = "ja";
        }

        if (typeof i18next === "undefined") {
            console.warn("i18next unavailable – falling back to reload.");
            window.location.reload();
            return;
        }

        i18next.changeLanguage(i18nLang, err => {
            if (err) {
                console.error("Error changing language:", err);
                return;
            }

            // --- 1. Toolbar: re-run init() which re-evaluates every _() call ---
            try {
                if (activity.toolbar && typeof activity.toolbar.init === "function") {
                    activity.toolbar.init(activity);
                }
            } catch (e) {
                console.error("Toolbar refresh failed:", e);
            }

            // --- 2. Palettes + Protoblocks: full rebuild ---
            //   regeneratePalettes() clears palettes, calls initPalettes() +
            //   initBasicProtoBlocks() which re-evaluate all _() in formBlock(),
            //   then calls updatePalettes() + refreshCanvas().
            try {
                if (typeof activity.regeneratePalettes === "function") {
                    activity.regeneratePalettes();
                }
            } catch (e) {
                console.error("Palette regeneration failed:", e);
            }

            // --- 2b. Help content: rebuild tooltips for bottom icons ---
            try {
                if (typeof createHelpContent === "function") {
                    createHelpContent(activity);
                }

                // Destroy all existing tooltips first
                if (typeof $j !== "undefined") {
                    $j(".tooltipped").tooltip("destroy");
                }

                // Update bottom toolbar button tooltips
                if (activity.homeButtonContainer) {
                    activity.homeButtonContainer.setAttribute(
                        "data-tooltip",
                        _("Home") + " [" + _("Home").toUpperCase() + "]"
                    );
                }
                if (activity.hideBlocksContainer) {
                    activity.hideBlocksContainer.setAttribute(
                        "data-tooltip",
                        _("Show/hide blocks")
                    );
                }
                if (activity.collapseBlocksContainer) {
                    activity.collapseBlocksContainer.setAttribute(
                        "data-tooltip",
                        _("Expand/collapse blocks")
                    );
                }
                if (activity.smallerContainer) {
                    activity.smallerContainer.setAttribute(
                        "data-tooltip",
                        _("Decrease block size")
                    );
                }
                if (activity.largerContainer) {
                    activity.largerContainer.setAttribute("data-tooltip", _("Increase block size"));
                }

                // Update wrap button tooltip based on current WRAP state
                const wrapIcon = typeof docById === "function" ? docById("wrapTurtle") : null;
                if (wrapIcon) {
                    const wrapTooltip = WRAP ? _("Turtle Wrap Off") : _("Turtle Wrap On");
                    wrapIcon.setAttribute("data-tooltip", wrapTooltip);
                }

                // Update grid, clear, collapse, expand button tooltips
                if (activity.turtles) {
                    // Update Grid button
                    if (activity.turtles.gridButton) {
                        activity.turtles.gridButton.setAttribute("data-tooltip", _("Grid"));
                    }
                    // Update Clear button
                    if (activity.turtles._clearButton) {
                        activity.turtles._clearButton.setAttribute("data-tooltip", _("Clear"));
                    }
                    // Update Collapse button
                    if (activity.turtles._collapseButton) {
                        activity.turtles._collapseButton.setAttribute(
                            "data-tooltip",
                            _("Collapse")
                        );
                    }
                    // Update Expand button
                    if (activity.turtles._expandButton) {
                        activity.turtles._expandButton.setAttribute("data-tooltip", _("Expand"));
                    }
                }

                // Reinitialize all tooltips after updating
                if (typeof $j !== "undefined") {
                    $j(".tooltipped").tooltip({
                        html: true,
                        delay: 100
                    });
                }
            } catch (e) {
                console.error("Help content refresh failed:", e);
            }

            // --- 2c. Refresh help widget if it's open ---
            try {
                if (
                    typeof window.widgetWindows !== "undefined" &&
                    window.widgetWindows.openWindows &&
                    window.widgetWindows.openWindows["help"]
                ) {
                    // Close the existing help widget
                    const helpWindow = window.widgetWindows.openWindows["help"];
                    if (helpWindow && typeof helpWindow.destroy === "function") {
                        helpWindow.destroy();
                    }
                    // Reopen it after a short delay to allow the DOM to update
                    setTimeout(() => {
                        if (typeof HelpWidget !== "undefined") {
                            new HelpWidget(activity, false);
                        }
                    }, 100);
                }
            } catch (e) {
                console.error("Help widget refresh failed:", e);
            }

            // --- 2d. Update helpfulWheelItems labels ---
            try {
                if (activity.helpfulWheelItems) {
                    activity.helpfulWheelItems.forEach(item => {
                        // Update common labels that are currently in English
                        if (item.label === "Home [HOME]" || item.label.includes("HOME")) {
                            item.label = _("Home") + " [" + _("Home").toUpperCase() + "]";
                        } else if (
                            item.label === "Show/hide blocks" ||
                            item.label.includes("Show/hide")
                        ) {
                            item.label = _("Show/hide blocks");
                        } else if (
                            item.label === "Expand/collapse blocks" ||
                            item.label.includes("Expand/collapse")
                        ) {
                            item.label = _("Expand/collapse blocks");
                        } else if (
                            item.label === "Decrease block size" ||
                            item.label.includes("Decrease")
                        ) {
                            item.label = _("Decrease block size");
                        } else if (
                            item.label === "Increase block size" ||
                            item.label.includes("Increase")
                        ) {
                            item.label = _("Increase block size");
                        } else if (
                            item.label === "Turtle Wrap Off" ||
                            item.label.includes("Wrap Off")
                        ) {
                            item.label = _("Turtle Wrap Off");
                        } else if (
                            item.label === "Turtle Wrap On" ||
                            item.label.includes("Wrap On")
                        ) {
                            item.label = _("Turtle Wrap On");
                        } else if (item.label === "Restore" || item.label.includes("Restore")) {
                            item.label = _("Restore");
                        } else if (
                            item.label === "Enable horizontal scrolling" ||
                            item.label.includes("Enable horizontal")
                        ) {
                            item.label = _("Enable horizontal scrolling");
                        } else if (
                            item.label === "Disable horizontal scrolling" ||
                            item.label.includes("Disable horizontal")
                        ) {
                            item.label = _("Disable horizontal scrolling");
                        } else if (
                            item.label === "Disable scroll lock" ||
                            item.label.includes("Disable scroll")
                        ) {
                            item.label = _("Disable scroll lock");
                        } else if (
                            item.label === "Enable scroll lock" ||
                            item.label.includes("Enable scroll")
                        ) {
                            item.label = _("Enable scroll lock");
                        } else if (item.label === "Grid" || item.label.includes("Grid")) {
                            item.label = _("Grid");
                        } else if (item.label === "Clear" || item.label.includes("Clear")) {
                            item.label = _("Clear");
                        } else if (item.label === "Collapse" || item.label.includes("Collapse")) {
                            item.label = _("Collapse");
                        } else if (item.label === "Expand" || item.label.includes("Expand")) {
                            item.label = _("Expand");
                        } else if (item.label === "Select" || item.label.includes("Select")) {
                            item.label = _("Select");
                        } else if (
                            item.label === "Set Pitch Preview" ||
                            item.label.includes("Pitch Preview")
                        ) {
                            item.label = _("Set Pitch Preview");
                        } else if (
                            item.label === "Search for Blocks" ||
                            item.label.includes("Search for")
                        ) {
                            item.label = _("Search for Blocks");
                        }
                    });
                }
            } catch (e) {
                console.error("helpfulWheelItems update failed:", e);
            }

            // --- 3. Canvas blocks: update protoblock refs + regenerate SVG artwork ---
            //   initBasicProtoBlocks created NEW protoblock objects with updated _() labels.
            //   Existing blocks still reference OLD protoblocks. Fix: look up the new
            //   protoblock from protoBlockDict and update block.protoblock before regenerating.
            try {
                if (
                    activity.blocks &&
                    activity.blocks.blockList &&
                    activity.blocks.protoBlockDict
                ) {
                    for (let i = 0; i < activity.blocks.blockList.length; i++) {
                        const block = activity.blocks.blockList[i];
                        if (block && !block.trash) {
                            // Update the block's protoblock reference to the new one
                            const blockName = block.name;
                            if (blockName && activity.blocks.protoBlockDict[blockName]) {
                                block.protoblock = activity.blocks.protoBlockDict[blockName];
                            }
                            // Now regenerate artwork with the updated protoblock.staticLabels
                            if (typeof block.regenerateArtwork === "function") {
                                block.regenerateArtwork(false);
                            }
                        }
                    }
                    // Re-position blocks and repaint stage
                    if (typeof activity.blocks.updateBlockPositions === "function") {
                        activity.blocks.updateBlockPositions();
                    }
                }
            } catch (e) {
                console.error("Block artwork refresh failed:", e);
            }

            // --- 4. DOM elements with data-i18n attributes ---
            try {
                const elements = document.querySelectorAll("[data-i18n]");
                elements.forEach(el => {
                    const key = el.getAttribute("data-i18n");
                    if (key) el.textContent = i18next.t(key);
                });
            } catch (e) {
                console.error("DOM i18n refresh failed:", e);
            }

            // --- 5. Refresh the canvas so everything repaints ---
            try {
                if (typeof activity.refreshCanvas === "function") {
                    activity.refreshCanvas();
                }
            } catch (e) {
                console.error("Canvas refresh failed:", e);
            }

            // --- 6. Update URL without reloading ---
            try {
                const url = new URL(window.location);
                url.searchParams.set("lang", newLang);
                window.history.pushState({}, "", url.href);
            } catch (e) {
                // pushState may not be available in all environments
            }

            // --- 7. Notify any listening widgets ---
            document.dispatchEvent(
                new CustomEvent("languageChanged", {
                    detail: { language: newLang }
                })
            );
        });
    }

    /**
     * @deprecated Use hotSwapLanguage() instead.
     * @public
     * @returns {void}
     */
    reload() {
        console.warn("reload() is deprecated. Use hotSwapLanguage() for a no-refresh experience.");
        window.location.reload();
    }

    hide() {
        if (localStorage.getItem("languagePreference") === this._language) {
            this.activity.textMsg(_("Music Blocks is already set to this language."));
            return;
        }

        // Save preference
        this.activity.storage.languagePreference = this._language;

        if (this._language === "ja" && this.activity.storage.kanaPreference === "kana") {
            // kana preference stays as-is
        } else if (this._language.includes("ja")) {
            this._language = this._language.split("-")[0];
        }

        try {
            localStorage.setItem("languagePreference", this._language);
        } catch (e) {
            console.warn("Could not save language preference:", e);
        }

        // Apply the language change immediately – no reload required
        this.hotSwapLanguage();
    }
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = LanguageBox;
}
