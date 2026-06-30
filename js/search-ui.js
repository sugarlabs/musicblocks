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

/* global _, docByClass */

/* exported SearchUI, setupSearchUI */

/**
 * Owns every visual aspect of the search feature.
 *
 * Responsibilities:
 * - creating search-related DOM elements
 * - showing / hiding the main search input
 * - setting up and tearing down jQuery autocomplete widgets
 * - rendering individual autocomplete result rows (with drag-and-drop)
 * - positioning and removing the helpful-search overlay
 *
 * All search logic and state (suggestion list, active query, block
 * placement) lives in SearchController (js/activity/search-controller.js).
 * SearchUI has no logic of its own; it receives callbacks from the
 * controller for anything that requires a decision.
 */
class SearchUI {
    /**
     * @param {object} activity - The Activity instance.
     */
    constructor(activity) {
        this.activity = activity;
        this.helpfulSearchDiv = null;
    }

    // -----------------------------------------------------------------------
    // Public API (as specified in the PR)
    // -----------------------------------------------------------------------

    /**
     * Creates the helpfulSearchWidget <input> DOM element and attaches it to
     * activity.helpfulSearchWidget.  Must be called from activity._start()
     * after searchController is available.
     */
    createSearchUI() {
        const activity = this.activity;
        const helpfulSearchWidget = document.createElement("input");
        helpfulSearchWidget.setAttribute("id", "helpfulSearch");
        helpfulSearchWidget.style.visibility = "hidden";
        helpfulSearchWidget.placeholder = _("Search for blocks");
        helpfulSearchWidget.classList.add("ui-autocomplete");
        activity.helpfulSearchWidget = helpfulSearchWidget;
    }

    /**
     * Makes the main search input visible and positions it under the
     * palette search button.
     */
    show() {
        const activity = this.activity;
        const obj = docByClass("ui-menu");
        if (obj.length > 0) {
            obj[0].style.visibility = "visible";
        }
        activity.searchWidget.style.zIndex = 1001;
        activity.searchWidget.style.border = "2px solid lightblue";
        activity.searchWidget.value = null;
        activity.searchWidget.style.visibility = "visible";
        const searchPos = activity.palettes.getSearchPos();
        activity.searchWidget.style.left = searchPos.x + "px";
        activity.searchWidget.style.top = searchPos.y + "px";
    }

    /**
     * Hides the main search input and its autocomplete dropdown.
     */
    hide() {
        const obj = docByClass("ui-menu");
        if (obj.length > 0) {
            obj[0].style.visibility = "hidden";
        }
        this.activity.searchWidget.style.visibility = "hidden";
        this.activity.searchWidget.idInput_custom = "";
    }

    /**
     * Focuses the main search <input>.
     */
    focusInput() {
        if (this.activity.searchWidget) {
            this.activity.searchWidget.focus();
        }
    }

    /**
     * Sets the value of the main search <input>.
     * @param {string} value
     */
    updateQuery(value) {
        if (this.activity.searchWidget) {
            this.activity.searchWidget.value = value;
        }
    }

    /** Stub: highlight matched text in rendered autocomplete items. */
    highlightMatches() {}

    /** Stub: clear match highlights from rendered autocomplete items. */
    clearHighlights() {}

    /** Stub: update a result-count indicator in the search bar. */
    updateResultCounter() {}

    /**
     * Tears down the search UI: hides the helpful-search overlay and the
     * main search input.
     */
    destroy() {
        this.removeHelpfulSearchDiv();
        if (this.activity.searchWidget) {
            this.hide();
        }
    }

    // -----------------------------------------------------------------------
    // Main search autocomplete
    // -----------------------------------------------------------------------

    /**
     * Initialises jQuery autocomplete on #search (once only).
     * All callbacks are provided by SearchController so no logic lives here.
     *
     * @param {Function} sourceFn  (term:string) => Array  — returns filtered suggestions
     * @param {Function} selectCb  (item, keyCode) => void — called when user picks a result
     * @param {Function} dropCb   (protoblk, x, y) => void — called when user drag-drops a result
     */
    setupMainAutocomplete(sourceFn, selectCb, dropCb) {
        const $j = window.jQuery;
        const $search = $j("#search");
        if ($search.data("autocomplete-init")) {
            return;
        }

        const activity = this.activity;
        $search.autocomplete({
            source: (request, response) => {
                const term = (request.term || "").toLowerCase().trim();
                response(sourceFn(term));
            },
            appendTo: "body",
            select: (event, ui) => {
                event.preventDefault();
                activity.searchWidget.value = ui.item.label;
                activity.searchWidget.idInput_custom = ui.item.value;
                activity.searchWidget.protoblk = ui.item.specialDict;
                selectCb(ui.item, event.keyCode);
            },
            focus: event => {
                event.preventDefault();
            }
        });

        const instance = $search.autocomplete("instance");
        if (instance) {
            instance._renderItem = (ul, item) => this._renderMainItem($j, ul, item, dropCb);
        }
        $search.data("autocomplete-init", true);
    }

    /**
     * Triggers an autocomplete search on the main #search input.
     * @param {string} value
     */
    triggerMainSearch(value) {
        window.jQuery("#search").autocomplete("search", value);
    }

    // -----------------------------------------------------------------------
    // Helpful-search input
    // -----------------------------------------------------------------------

    /**
     * Destroys any existing autocomplete on #helpfulSearch, then resets and
     * makes the input visible.  Called by SearchController.showHelpfulSearchWidget().
     */
    showHelpfulInput() {
        const $j = window.jQuery;
        if ($j("#helpfulSearch")) {
            try {
                $j("#helpfulSearch").autocomplete("destroy");
            } catch {
                //
            }
        }
        const activity = this.activity;
        activity.helpfulSearchWidget.style.zIndex = 1001;
        activity.helpfulSearchWidget.idInput_custom = "";
        activity.helpfulSearchWidget.value = null;
        activity.helpfulSearchWidget.style.visibility = "visible";
        document.getElementById("helpfulWheelDiv").style.display = "none";
    }

    /**
     * Focuses the helpful search <input>.
     */
    focusHelpfulInput() {
        if (this.activity.helpfulSearchWidget) {
            this.activity.helpfulSearchWidget.focus();
        }
    }

    /**
     * Initialises jQuery autocomplete on #helpfulSearch (once only).
     *
     * @param {Function} sourceFn  (term:string) => Array
     * @param {Function} selectCb  (item) => void
     */
    setupHelpfulAutocomplete(sourceFn, selectCb) {
        const $j = window.jQuery;
        const $helpfulSearch = $j("#helpfulSearch");
        if ($helpfulSearch.data("autocomplete-init")) {
            return;
        }

        const activity = this.activity;
        $helpfulSearch.autocomplete({
            source: (request, response) => {
                const term = (request.term || "").toLowerCase().trim();
                response(sourceFn(term));
            },
            appendTo: "body",
            select: (event, ui) => {
                event.preventDefault();
                activity.helpfulSearchWidget.value = ui.item.label;
                activity.helpfulSearchWidget.idInput_custom = ui.item.value;
                activity.helpfulSearchWidget.protoblk = ui.item.specialDict;
                selectCb(ui.item);
            },
            focus: event => {
                event.preventDefault();
            }
        });

        const instance = $helpfulSearch.autocomplete("instance");
        if (instance) {
            instance._renderItem = (ul, item) => {
                const li = $j("<li></li>");
                const img = document.createElement("img");
                img.src = item.artwork || "";
                img.height = 20;
                li.append(img);
                li.append($j("<a>").text(" " + item.label));
                return li.appendTo(ul.css("z-index", 35000));
            };
        }
        $helpfulSearch.data("autocomplete-init", true);
    }

    /**
     * Triggers an autocomplete search on the #helpfulSearch input.
     * @param {string} value
     */
    triggerHelpfulSearch(value) {
        window.jQuery("#helpfulSearch").autocomplete("search", value);
    }

    // -----------------------------------------------------------------------
    // Helpful-search overlay div
    // -----------------------------------------------------------------------

    /**
     * Creates the #helpfulSearchDiv container and its close button, appends
     * both to document.body, and appends activity.helpfulSearchWidget into
     * the div.
     *
     * @returns {{ closeButton: HTMLElement, modeButton: HTMLElement|null }}
     */
    buildHelpfulSearchDiv() {
        if (document.getElementById("helpfulSearchDiv")) {
            const existing = document.getElementById("helpfulSearchDiv");
            existing.parentNode.removeChild(existing);
        }
        this.helpfulSearchDiv = document.createElement("div");
        this.helpfulSearchDiv.setAttribute("id", "helpfulSearchDiv");
        document.body.appendChild(this.helpfulSearchDiv);

        const closeButtonDiv = document.createElement("div");
        closeButtonDiv.style.cssText =
            "position: absolute;" + "top: 10px;" + "right: 10px;" + "cursor: pointer;";

        const closeButton = document.createElement("button");
        closeButton.textContent = "×";
        closeButton.id = "crossButton";
        document.body.appendChild(closeButton);

        closeButtonDiv.appendChild(closeButton);
        this.helpfulSearchDiv.appendChild(closeButtonDiv);
        this.helpfulSearchDiv.appendChild(this.activity.helpfulSearchWidget);

        return { closeButton, modeButton: document.getElementById("begIconText") };
    }

    /**
     * Positions helpfulSearchDiv relative to helpfulWheelDiv and clamps it
     * inside the viewport.  Must be called after buildHelpfulSearchDiv().
     */
    positionHelpfulSearchDiv() {
        const helpfulWheelDiv = document.getElementById("helpfulWheelDiv");
        this.helpfulSearchDiv.style.left =
            helpfulWheelDiv.offsetLeft + 80 * this.activity.getStageScale() + "px";
        this.helpfulSearchDiv.style.top =
            helpfulWheelDiv.offsetTop + 110 * this.activity.getStageScale() + "px";

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        this.helpfulSearchDiv.style.display = "block";
        const menuWidth = this.helpfulSearchDiv.offsetWidth;
        const menuHeight = this.helpfulSearchDiv.offsetHeight;

        if (this.helpfulSearchDiv.offsetLeft + menuWidth > windowWidth) {
            this.helpfulSearchDiv.style.left = windowWidth - menuWidth + "px";
        }
        if (this.helpfulSearchDiv.offsetTop + menuHeight > windowHeight) {
            this.helpfulSearchDiv.style.top = windowHeight - menuHeight + "px";
        }
    }

    /**
     * Hides the helpfulWheelDiv and removes helpfulSearchDiv from the DOM.
     */
    removeHelpfulSearchDiv() {
        const helpfulWheelDiv = document.getElementById("helpfulWheelDiv");
        if (helpfulWheelDiv && helpfulWheelDiv.style.display !== "none") {
            helpfulWheelDiv.style.display = "none";
        }
        if (this.helpfulSearchDiv && this.helpfulSearchDiv.parentNode) {
            this.helpfulSearchDiv.parentNode.removeChild(this.helpfulSearchDiv);
            this.helpfulSearchDiv = null;
        }
    }

    /**
     * Sets helpfulSearchDiv display to "none" after a block has been placed.
     */
    hideHelpfulSearchDisplay() {
        const el = document.getElementById("helpfulSearchDiv");
        if (el) {
            el.style.display = "none";
        }
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * Builds a draggable <li> element for the main search autocomplete.
     * The drag visual is handled entirely here; the drop logic is delegated
     * to dropCb so no block-placement logic lives in this class.
     *
     * @param {object}   $j     - jQuery reference
     * @param {object}   ul     - the jQuery <ul> supplied by autocomplete
     * @param {object}   item   - autocomplete item {label, value, artwork, specialDict}
     * @param {Function} dropCb - (protoblk, x, y) => void
     * @returns {jQuery}
     */
    _renderMainItem($j, ul, item, dropCb) {
        const li = $j("<li></li>");

        const img = document.createElement("img");
        img.src = item.artwork || "";
        img.height = 20;
        img.style.cursor = "grab";
        // Drag-and-drop: mirrors the palette drag pattern in
        // palette.js _showMenuItems(). Keep both in sync.
        img.ondragstart = () => false;

        const down = event => {
            event.stopPropagation();
            event.stopImmediatePropagation();
            event.preventDefault();

            const posit = img.style.position;
            const zInd = img.style.zIndex;
            img.style.position = "absolute";
            img.style.zIndex = 10000;

            $j("#search").autocomplete("close");
            document.body.appendChild(img);

            const moveAt = (pageX, pageY) => {
                img.style.left = pageX - img.offsetWidth / 2 + "px";
                img.style.top = pageY - img.offsetHeight / 2 + "px";
            };

            const onMouseMove = e => {
                e.preventDefault();
                let x, y;
                if (e.type === "touchmove") {
                    x = e.touches[0].clientX;
                    y = e.touches[0].clientY;
                } else {
                    x = e.pageX;
                    y = e.pageY;
                }
                moveAt(x, y);
            };
            onMouseMove(event);

            document.addEventListener("touchmove", onMouseMove, { passive: false });
            document.addEventListener("mousemove", onMouseMove);

            const up = () => {
                document.body.style.cursor = "default";
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("touchmove", onMouseMove);

                const x = parseInt(img.style.left);
                const y = parseInt(img.style.top);

                img.style.position = posit;
                img.style.zIndex = zInd;
                if (img.parentNode === document.body) {
                    document.body.removeChild(img);
                }

                if (isNaN(x) && isNaN(y)) return;
                dropCb(item.specialDict, x, y);
            };

            document.addEventListener("mouseup", up, { once: true });
            document.addEventListener("touchend", up, { once: true });
        };

        li[0].addEventListener("mousedown", down, true);
        li[0].addEventListener("touchstart", down, { capture: true, passive: false });
        li.append(img);
        li.append($j("<a>").text(" " + item.label));

        return li.appendTo(
            ul.css({
                "z-index": 35000,
                "max-height": "200px",
                "overflow-y": "auto"
            })
        );
    }
}

/**
 * Creates a SearchUI and returns it (does not attach to activity).
 * @param {object} activity
 * @returns {SearchUI}
 */
const setupSearchUI = activity => {
    return new SearchUI(activity);
};

// All browser execution goes through RequireJS (AMD). The module.exports branch
// is present solely for Jest/Node test environments and is never exercised at
// runtime in the browser.
if (typeof define === "function" && define.amd) {
    define(function () {
        window.SearchUI = SearchUI;
        window.setupSearchUI = setupSearchUI;
        return { SearchUI, setupSearchUI };
    });
} else if (typeof module !== "undefined" && module.exports) {
    module.exports = { SearchUI, setupSearchUI };
}
