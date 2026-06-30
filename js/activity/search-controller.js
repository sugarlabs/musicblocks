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

/* global _, STANDARDBLOCKHEIGHT */

/* exported setupSearchController, SearchController */

/**
 * Owns all search behaviour and state.
 *
 * Responsibilities:
 * - building / filtering the suggestion list from the block dictionary
 * - activating and deactivating the main search widget
 * - wiring the autocomplete source and select callbacks
 * - tracking cursor position for successive block placements
 * - coordinating the helpful-search overlay lifecycle
 *
 * Every DOM or jQuery operation is delegated to SearchUI
 * (js/search-ui.js).  No rendering code lives here.
 */
class SearchController {
    /**
     * @param {object} activity  - The Activity instance.
     * @param {object} searchUI  - The SearchUI instance.
     */
    constructor(activity, searchUI) {
        this.activity = activity;
        this.searchUI = searchUI;

        this.searchSuggestions = [];
        this._searchCache = {};
        this._searchCloseListener = null;
        this.isHelpfulSearchWidgetOn = false;
        this.searchBlockPosition = [100, 100];
        this.deprecatedBlockNames = [];
    }

    // -----------------------------------------------------------------------
    // Data / logic layer
    // -----------------------------------------------------------------------

    /**
     * Builds the block list used for search bar autocompletion.
     * Reads from activity.blocks.protoBlockDict and populates
     * searchSuggestions and deprecatedBlockNames.
     */
    prepSearchWidget() {
        this.searchSuggestions = [];
        this._searchCache = {};
        this.deprecatedBlockNames = [];

        const activity = this.activity;
        if (!activity.blocks || !activity.blocks.protoBlockDict) {
            console.debug("prepSearchWidget: blocks not yet initialized, skipping");
            return;
        }

        for (const i in activity.blocks.protoBlockDict) {
            const block = activity.blocks.protoBlockDict[i];
            const blockLabel = block.staticLabels.join(" ");
            const artwork = block.palette.model.makeBlockInfo(0, block, block.name, block.name)[
                "artwork64"
            ];
            if (blockLabel || block.extraSearchTerms !== undefined) {
                if (block.deprecated) {
                    this.deprecatedBlockNames.push(blockLabel);
                } else {
                    let label = blockLabel;
                    if (label.length === 0) {
                        label = _(block.name);
                        switch (block.name) {
                            case "scaledegree2":
                                label = _("scale degree");
                                break;
                            case "voicename":
                                label = _("voice name");
                                break;
                            case "invertmode":
                                label = _("invert mode");
                                break;
                            case "outputtools":
                                label = _("output tools");
                                break;
                            case "customNote":
                                label = _("custom note");
                                break;
                            case "accidentalname":
                                label = _("accidental name");
                                break;
                            case "eastindiansolfege":
                                label = _("east indian solfege");
                                break;
                            case "notename":
                                label = _("note name");
                                break;
                            case "temperamentname":
                                label = _("temperament name");
                                break;
                            case "modename":
                                label = _("mode name");
                                break;
                            case "chordname":
                                label = _("chord name");
                                break;
                            case "intervalname":
                                label = _("interval name");
                                break;
                            case "filtertype":
                                label = _("filter type");
                                break;
                            case "oscillatortype":
                                label = _("oscillator type");
                                break;
                            case "audiofile":
                                label = _("audio file");
                                break;
                            case "noisename":
                                label = _("noise name");
                                break;
                            case "drumname":
                                label = _("drum name");
                                break;
                            case "effectsname":
                                label = _("effects name");
                                break;
                            case "wrapmode":
                                label = _("wrap mode");
                                break;
                            case "loadFile":
                                label = _("load file");
                                break;
                        }
                    }

                    const searchTerms = [];
                    if (label && label.length > 0) {
                        searchTerms.push(label.toLowerCase());
                    }
                    if (block.extraSearchTerms && Array.isArray(block.extraSearchTerms)) {
                        for (let j = 0; j < block.extraSearchTerms.length; j++) {
                            const term = block.extraSearchTerms[j];
                            if (typeof term === "string" && term.length > 0) {
                                searchTerms.push(term.toLowerCase());
                            }
                        }
                    }

                    this.searchSuggestions.push({
                        label: label,
                        value: block.name,
                        specialDict: block,
                        artwork: artwork,
                        searchTerms: searchTerms
                    });
                }
            }
        }

        this.searchSuggestions = this.searchSuggestions.reverse();
    }

    /**
     * Filters searchSuggestions against a query term with caching.
     * @param {string} term - Lowercased, trimmed search term.
     * @returns {Array}
     */
    filterSuggestions(term) {
        if (this._searchCache[term] !== undefined) {
            return this._searchCache[term];
        }

        const results = this.searchSuggestions.filter(item => {
            if (!term || term.length === 0) {
                return true;
            }
            if (item.searchTerms && Array.isArray(item.searchTerms)) {
                return item.searchTerms.some(t => t && t.indexOf(term) !== -1);
            }
            return (
                item.label &&
                typeof item.label === "string" &&
                item.label.toLowerCase().indexOf(term) !== -1
            );
        });

        this._searchCache[term] = results;
        return results;
    }

    // -----------------------------------------------------------------------
    // Main search coordination
    // -----------------------------------------------------------------------

    /**
     * Hides the main search widget and removes the mousedown close listener.
     * Delegates DOM hide to SearchUI.hide().
     */
    hideSearchWidget() {
        if (this._searchCloseListener) {
            this.activity.removeEventListener(document, "mousedown", this._searchCloseListener);
            this._searchCloseListener = null;
        }
        this.searchUI.hide();
    }

    /**
     * Shows or toggles the main search widget.
     * Delegates DOM show to SearchUI.show(), then wires the autocomplete
     * and installs a document mousedown listener to close on outside clicks.
     */
    showSearchWidget() {
        const activity = this.activity;
        if (this.searchUI.helpfulSearchDiv) {
            this._hideHelpfulSearchWidget();
        }
        if (activity.searchWidget.style.visibility === "visible") {
            this.hideSearchWidget();
        } else {
            this.searchUI.show();

            this.searchBlockPosition = [100, 100];
            this.prepSearchWidget();

            const that = this;
            const closeListener = e => {
                if (
                    document.getElementById("search").style.visibility === "visible" &&
                    (e.target === document.getElementById("search") ||
                        document.getElementById("search").contains(e.target))
                ) {
                    //do nothing when clicked in the input field
                } else if (
                    document.getElementById("ui-id-1") &&
                    document.getElementById("ui-id-1").style.display === "block" &&
                    (e.target === document.getElementById("ui-id-1") ||
                        document.getElementById("ui-id-1").contains(e.target))
                ) {
                    //do nothing when clicked on the menu
                } else if (
                    document.querySelector("#palette tbody tr") &&
                    document.querySelector("#palette tbody tr").contains(e.target)
                ) {
                    //do nothing when clicked on the search row
                } else {
                    that.hideSearchWidget();
                }
            };
            this._searchCloseListener = closeListener;
            activity.addEventListener(document, "mousedown", closeListener);

            setTimeout(() => {
                that.searchUI.focusInput();
                that.doSearch();
            }, 500);
        }
    }

    /**
     * Wires the jQuery autocomplete on #search and, when idInput_custom is
     * set, places the selected block on the canvas.
     * Autocomplete UI is set up via SearchUI.setupMainAutocomplete();
     * block placement logic runs entirely here.
     */
    doSearch() {
        const activity = this.activity;
        if (!activity.searchWidget) {
            console.debug("doSearch: searchWidget not yet initialized, skipping");
            return;
        }

        if (this.searchSuggestions.length === 0) {
            this.prepSearchWidget();
        }

        const that = this;

        this.searchUI.setupMainAutocomplete(
            term => that.filterSuggestions(term),
            (item, keyCode) => {
                activity.searchWidget.value = item.label;
                activity.searchWidget.idInput_custom = item.value;
                activity.searchWidget.protoblk = item.specialDict;
                that.doSearch();
                if (keyCode === 13) activity.searchWidget.style.visibility = "visible";
            },
            (protoblk, x, y) => {
                const paletteName = protoblk.palette.name;
                const protoName = protoblk.name;
                if (
                    Object.prototype.hasOwnProperty.call(activity.blocks.protoBlockDict, protoName)
                ) {
                    activity.palettes.dict[paletteName].makeBlockFromSearch(
                        protoblk,
                        protoName,
                        newBlock => {
                            activity.blocks.moveBlock(
                                newBlock,
                                (x || activity.blocksContainer.x + 100) -
                                    activity.blocksContainer.x,
                                (y || activity.blocksContainer.y + 100) - activity.blocksContainer.y
                            );
                        }
                    );
                }
            }
        );

        const searchInput = activity.searchWidget.idInput_custom;
        if (!searchInput || searchInput.length <= 0) {
            if (activity.searchWidget.value && activity.searchWidget.value.length > 0) {
                this.searchUI.triggerMainSearch(activity.searchWidget.value);
            }
            return;
        }

        const protoblk = activity.searchWidget.protoblk;
        const paletteName = protoblk.palette.name;
        const protoName = protoblk.name;

        if (Object.prototype.hasOwnProperty.call(activity.blocks.protoBlockDict, protoName)) {
            activity.palettes.dict[paletteName].makeBlockFromSearch(
                protoblk,
                protoName,
                newBlock => {
                    activity.blocks.moveBlock(
                        newBlock,
                        100 + that.searchBlockPosition[0] - activity.blocksContainer.x,
                        that.searchBlockPosition[1] - activity.blocksContainer.y
                    );
                }
            );

            this.searchBlockPosition[0] += STANDARDBLOCKHEIGHT;
            this.searchBlockPosition[1] += STANDARDBLOCKHEIGHT;
        } else if (this.deprecatedBlockNames.indexOf(searchInput) > -1) {
            activity.errorMsg(_("This block is deprecated."));
        } else {
            activity.errorMsg(_("Block cannot be found."));
        }

        activity.searchWidget.value = "";
        activity.update = true;
    }

    // -----------------------------------------------------------------------
    // Helpful-search coordination
    // -----------------------------------------------------------------------

    /**
     * Creates the #helpfulSearchDiv overlay via SearchUI.buildHelpfulSearchDiv()
     * and wires the close and mode-button click handlers.
     */
    setHelpfulSearchDiv() {
        const activity = this.activity;
        const { closeButton, modeButton } = this.searchUI.buildHelpfulSearchDiv();
        activity.addEventListener(closeButton, "click", this._hideHelpfulSearchWidget.bind(this));
        if (modeButton) {
            activity.addEventListener(
                modeButton,
                "click",
                this._hideHelpfulSearchWidget.bind(this)
            );
        }
    }

    /**
     * Positions the helpful-search overlay next to the wheel, then shows it.
     * Creates the overlay first if it doesn't already exist.
     */
    _displayHelpfulSearchDiv() {
        if (!document.getElementById("helpfulSearchDiv")) {
            this.setHelpfulSearchDiv();
        }
        this.searchUI.positionHelpfulSearchDiv();
        this.showHelpfulSearchWidget();
        this.isHelpfulSearchWidgetOn = true;
    }

    /**
     * Removes the helpful-search overlay and triggers a canvas redraw.
     */
    _hideHelpfulSearchWidget() {
        this.searchUI.removeHelpfulSearchDiv();
        this.activity.__tick();
    }

    /**
     * Resets and focuses the helpful search input, then schedules
     * doHelpfulSearch after a short delay (to allow layout to settle).
     */
    showHelpfulSearchWidget() {
        if (!this.searchUI.helpfulSearchDiv) {
            return;
        }
        if (this.searchUI.helpfulSearchDiv.style.display !== "block") {
            return;
        }
        this.searchUI.showHelpfulInput();

        this.searchBlockPosition = [100, 100];
        this.prepSearchWidget();

        const that = this;
        setTimeout(() => {
            that.searchUI.focusHelpfulInput();
            that.doHelpfulSearch();
        }, 500);
    }

    /**
     * Wires the jQuery autocomplete on #helpfulSearch and, when
     * idInput_custom is set, places the selected block on the canvas.
     */
    doHelpfulSearch() {
        if (this.searchSuggestions.length === 0) {
            this.prepSearchWidget();
        }

        const that = this;
        const activity = this.activity;

        this.searchUI.setupHelpfulAutocomplete(
            term => that.filterSuggestions(term),
            item => {
                activity.helpfulSearchWidget.value = item.label;
                activity.helpfulSearchWidget.idInput_custom = item.value;
                activity.helpfulSearchWidget.protoblk = item.specialDict;
                that.doHelpfulSearch();
            }
        );

        const searchInput = activity.helpfulSearchWidget.idInput_custom;
        if (!searchInput || searchInput.length <= 0) {
            if (
                activity.helpfulSearchWidget.value &&
                activity.helpfulSearchWidget.value.length > 0
            ) {
                this.searchUI.triggerHelpfulSearch(activity.helpfulSearchWidget.value);
            }
            return;
        }

        const protoblk = activity.helpfulSearchWidget.protoblk;
        const paletteName = protoblk.palette.name;
        const protoName = protoblk.name;

        if (Object.prototype.hasOwnProperty.call(activity.blocks.protoBlockDict, protoName)) {
            activity.palettes.dict[paletteName].makeBlockFromSearch(
                protoblk,
                protoName,
                newBlock => {
                    activity.blocks.moveBlock(
                        newBlock,
                        100 + that.searchBlockPosition[0] - activity.blocksContainer.x,
                        that.searchBlockPosition[1] - activity.blocksContainer.y
                    );
                }
            );

            this.searchBlockPosition[0] += STANDARDBLOCKHEIGHT;
            this.searchBlockPosition[1] += STANDARDBLOCKHEIGHT;
        } else if (this.deprecatedBlockNames.indexOf(searchInput) > -1) {
            activity.errorMsg(_("This block is deprecated."));
        } else {
            activity.errorMsg(_("Block cannot be found."));
        }

        activity.helpfulSearchWidget.value = "";
        this.searchUI.hideHelpfulSearchDisplay();
        activity.update = true;
    }
}

/**
 * Creates a SearchController, attaches it to activity, and wires
 * delegation methods so external callers (palette.js, planetInterface.js)
 * continue to work unchanged.
 *
 * @param {object} activity  - The Activity instance.
 * @param {object} searchUI  - The SearchUI instance (from setupSearchUI).
 */
const setupSearchController = (activity, searchUI) => {
    activity.searchController = new SearchController(activity, searchUI);
};

if (typeof define === "function" && define.amd) {
    define(function () {
        window.setupSearchController = setupSearchController;
        window.SearchController = SearchController;
        return { setupSearchController, SearchController };
    });
} else if (typeof module !== "undefined" && module.exports) {
    module.exports = { setupSearchController, SearchController };
}
