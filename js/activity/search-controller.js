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

/* global _, $j, docByClass, STANDARDBLOCKHEIGHT */

/* exported setupSearchController, SearchController */

class SearchController {
    constructor(activity) {
        this.activity = activity;

        this.searchSuggestions = [];
        this._searchCache = {};
        this._searchCloseListener = null;
        this.isHelpfulSearchWidgetOn = false;
        this.searchBlockPosition = [100, 100];
        this.deprecatedBlockNames = [];
        this.helpfulSearchDiv = null;
    }

    /**
     * Builds the block list used for search bar autocompletion.
     * Reads from activity.blocks.protoBlockDict and populates
     * searchSuggestions and deprecatedBlockNames.
     */
    prepSearchWidget() {
        this.searchBlockPosition = [100, 100];
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
     * Filters searchSuggestions against a query term.
     * Returns matching items, respecting the result cache.
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

    /**
     * Hides the main search widget.
     */
    hideSearchWidget() {
        const obj = docByClass("ui-menu");
        if (obj.length > 0) {
            obj[0].style.visibility = "hidden";
        }

        if (this._searchCloseListener) {
            this.activity.removeEventListener(document, "mousedown", this._searchCloseListener);
            this._searchCloseListener = null;
        }

        this.activity.searchWidget.style.visibility = "hidden";
        this.activity.searchWidget.idInput_custom = "";
        this._hideSearchDragHandle();
    }

    /**
     * Shows or toggles the main search widget.
     */
    showSearchWidget() {
        const activity = this.activity;
        activity.searchWidget.style.zIndex = 1001;
        activity.searchWidget.style.border = "2px solid lightblue";
        if (this.helpfulSearchDiv) {
            this._hideHelpfulSearchWidget();
        }
        if (activity.searchWidget.style.visibility === "visible") {
            this.hideSearchWidget();
        } else {
            const obj = docByClass("ui-menu");
            if (obj.length > 0) {
                obj[0].style.visibility = "visible";
            }

            if (activity.searchWidget) {
                activity.searchWidget.value = null;
                activity.searchWidget.style.visibility = "visible";
                const searchPos = activity.palettes.getSearchPos();
                activity.searchWidget.style.left = searchPos.x + "px";
                activity.searchWidget.style.top = searchPos.y + "px";
                this._addSearchDragHandle();
            }

            this.searchBlockPosition = [100, 100];
            this.prepSearchWidget();

            const that = this;
            const closeListener = e => {
                if (
                    document.getElementById("search").style.visibility === "visible" &&
                    (e.target === document.getElementById("search") ||
                        document.getElementById("search").contains(e.target) ||
                        e.target === document.getElementById("searchDragHandle"))
                ) {
                    //do nothing when clicked in the input field or the drag handle
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
                activity.searchWidget.focus();
                that.doSearch();
                that._positionSearchDragHandle();
            }, 500);
        }
    }

    /**
     * Sets up jQuery autocomplete on the main search input and executes a search.
     */
    doSearch() {
        const activity = this.activity;
        if (!activity.searchWidget) {
            console.debug("doSearch: searchWidget not yet initialized, skipping");
            return;
        }

        const $j = window.jQuery;
        if (this.searchSuggestions.length === 0) {
            this.prepSearchWidget();
        }

        const that = this;
        const $search = $j("#search");

        if (!$search.data("autocomplete-init")) {
            $search.autocomplete({
                source: (request, response) => {
                    const term = (request.term || "").toLowerCase().trim();
                    response(that.filterSuggestions(term));
                },
                delay: 400,
                appendTo: "body",
                select: (event, ui) => {
                    event.preventDefault();
                    activity.searchWidget.value = ui.item.label;
                    activity.searchWidget.idInput_custom = ui.item.value;
                    activity.searchWidget.protoblk = ui.item.specialDict;
                    that.doSearch();
                    if (event.keyCode === 13) activity.searchWidget.style.visibility = "visible";
                },
                focus: event => {
                    event.preventDefault();
                }
            });

            const instance = $search.autocomplete("instance");
            if (instance) {
                instance._renderItem = (ul, item) => {
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

                            const protoblk = item.specialDict;
                            const paletteName = protoblk.palette.name;
                            const protoName = item.value;

                            activity.palettes.dict[paletteName].makeBlockFromSearch(
                                protoblk,
                                protoName,
                                newBlock => {
                                    activity.blocks.moveBlock(
                                        newBlock,
                                        (x || activity.blocksContainer.x + 100) -
                                            activity.blocksContainer.x,
                                        (y || activity.blocksContainer.y + 100) -
                                            activity.blocksContainer.y
                                    );
                                }
                            );
                        };

                        document.addEventListener("mouseup", up, { once: true });
                        document.addEventListener("touchend", up, { once: true });
                    };

                    li[0].addEventListener("mousedown", down, true);
                    li[0].addEventListener("touchstart", down, {
                        capture: true,
                        passive: false
                    });

                    li.append(img);
                    li.append($j("<a>").text(" " + item.label));

                    return li.appendTo(
                        ul.css({
                            "z-index": 35000,
                            "max-height": "200px",
                            "overflow-y": "auto"
                        })
                    );
                };
            }
            $search.data("autocomplete-init", true);
        }

        const searchInput = activity.searchWidget.idInput_custom;
        if (!searchInput || searchInput.length <= 0) {
            if (activity.searchWidget.value && activity.searchWidget.value.length > 0) {
                $search.autocomplete("search", activity.searchWidget.value);
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

    /**
     * Creates (once) and positions a drag handle for the classic #search
     * input, so it can be dragged the same way helpfulSearchDiv can.
     */
    _addSearchDragHandle() {
        const activity = this.activity;
        let handle = document.getElementById("searchDragHandle");

        if (!handle) {
            handle = document.createElement("div");
            handle.id = "searchDragHandle";
            handle.style.cssText =
                "position:absolute;width:16px;height:38px;cursor:grab;z-index:2001;" +
                "display:flex;align-items:center;justify-content:center;" +
                "color:rgba(150,150,150,0.8);font-size:18px;user-select:none;";
            handle.textContent = "⠿";
            document.body.appendChild(handle);

            let dragStartX, dragStartY, dragStartLeft, dragStartTop;

            handle.addEventListener("pointerdown", e => {
                dragStartX = e.clientX;
                dragStartY = e.clientY;
                dragStartLeft = parseInt(activity.searchWidget.style.left) || 0;
                dragStartTop = parseInt(activity.searchWidget.style.top) || 0;
                activity.searchWidget.style.transition = "none";
                handle.setPointerCapture(e.pointerId);
                handle.style.cursor = "grabbing";
            });

            handle.addEventListener("pointermove", e => {
                if (!handle.hasPointerCapture(e.pointerId)) return;
                const newLeft = dragStartLeft + e.clientX - dragStartX;
                const newTop = dragStartTop + e.clientY - dragStartY;
                activity.searchWidget.style.left = newLeft + "px";
                activity.searchWidget.style.top = newTop + "px";
                this._positionSearchDragHandle();
            });

            handle.addEventListener("pointerup", e => {
                handle.releasePointerCapture(e.pointerId);
                handle.style.cursor = "grab";
                activity.searchWidget.style.transition = "";
            });
        }

        handle.style.display = "flex";
        this._positionSearchDragHandle();
    }

    /**
     * Keeps the drag handle glued to the left edge of #search.
     */
    _positionSearchDragHandle() {
        const activity = this.activity;
        const handle = document.getElementById("searchDragHandle");
        if (!handle || !activity.searchWidget) return;
        if (typeof activity.searchWidget.getBoundingClientRect !== "function") return;
        const rect = activity.searchWidget.getBoundingClientRect();
        handle.style.left = rect.left + 4 + "px";
        handle.style.top = rect.top + (rect.height - 38) / 2 + "px";
    }

    /**
     * Hides the drag handle when the classic search widget is hidden.
     */
    _hideSearchDragHandle() {
        const handle = document.getElementById("searchDragHandle");
        if (handle) handle.style.display = "none";
    }

    /**
     * Creates the helpfulSearchDiv container and appends it to the body.
     */
    setHelpfulSearchDiv() {
        const activity = this.activity;
        if (document.getElementById("helpfulSearchDiv")) {
            document
                .getElementById("helpfulSearchDiv")
                .parentNode.removeChild(document.getElementById("helpfulSearchDiv"));
        }
        this.helpfulSearchDiv = document.createElement("div");
        this.helpfulSearchDiv.setAttribute("id", "helpfulSearchDiv");
        this.helpfulSearchDiv.style.position = "fixed";

        document.body.appendChild(this.helpfulSearchDiv);

        const closeButtonDiv = document.createElement("div");
        closeButtonDiv.style.cssText =
            "position: absolute; top: 50%; right: 10px; transform: translateY(-50%); cursor: pointer;";

        const closeButton = document.createElement("button");
        closeButton.textContent = "×";
        closeButton.id = "crossButton";
        closeButton.style.cssText =
            "background:rgba(80,80,80,0.6);border:none;border-radius:50%;width:22px;height:22px;font-size:14px;cursor:pointer;color:white;line-height:22px;text-align:center;";

        closeButtonDiv.appendChild(closeButton);

        this.helpfulSearchDiv.appendChild(closeButtonDiv);

        const dragHandle = document.createElement("div");
        dragHandle.style.cssText =
            "position:absolute;left:8px;top:50%;transform:translateY(-50%);width:16px;height:80%;cursor:grab;z-index:1002;display:flex;align-items:center;justify-content:center;color:rgba(150,150,150,0.8);font-size:18px;user-select:none;";
        dragHandle.textContent = "⠿";
        let dragStartX, dragStartY, dragStartLeft, dragStartTop;
        dragHandle.addEventListener("pointerdown", e => {
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            dragStartLeft = parseInt(this.helpfulSearchDiv.style.left) || 0;
            dragStartTop = parseInt(this.helpfulSearchDiv.style.top) || 0;
            dragHandle.setPointerCapture(e.pointerId);
            dragHandle.style.cursor = "grabbing";
        });
        dragHandle.addEventListener("pointermove", e => {
            if (!dragHandle.hasPointerCapture(e.pointerId)) return;
            this.helpfulSearchDiv.style.left = dragStartLeft + e.clientX - dragStartX + "px";
            this.helpfulSearchDiv.style.top = dragStartTop + e.clientY - dragStartY + "px";
        });
        dragHandle.addEventListener("pointerup", e => {
            dragHandle.releasePointerCapture(e.pointerId);
            dragHandle.style.cursor = "grab";
        });
        this.helpfulSearchDiv.appendChild(dragHandle);

        const modeButton = document.getElementById("begIconText");
        activity.addEventListener(closeButton, "click", this._hideHelpfulSearchWidget.bind(this));
        activity.addEventListener(modeButton, "click", this._hideHelpfulSearchWidget.bind(this));

        this.helpfulSearchDiv.appendChild(activity.helpfulSearchWidget);
    }

    /**
     * Positions and displays the helpfulSearchDiv on the canvas.
     */
    _displayHelpfulSearchDiv() {
        const helpfulWheelDivReset = document.getElementById("helpfulWheelDiv");
        if (helpfulWheelDivReset) helpfulWheelDivReset.style.display = "";
        this.setHelpfulSearchDiv();
        const helpfulWheelDiv = document.getElementById("helpfulWheelDiv");
        this.helpfulSearchDiv.style.left = Math.max(0, (window.innerWidth - 320) / 2) + "px";
        this.helpfulSearchDiv.style.top = "80px";

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

        this.showHelpfulSearchWidget();
        this.isHelpfulSearchWidgetOn = true;
    }

    /**
     * Hides and removes the helpfulSearchDiv from the DOM.
     */
    _hideHelpfulSearchWidget() {
        const helpfulWheelDiv = document.getElementById("helpfulWheelDiv");
        if (helpfulWheelDiv.style.display !== "none") {
            helpfulWheelDiv.style.display = "none";
        }
        if (this.helpfulSearchDiv && this.helpfulSearchDiv.parentNode) {
            this.helpfulSearchDiv.parentNode.removeChild(this.helpfulSearchDiv);
        }
        this.isHelpfulSearchWidgetOn = false;
        this.activity.__tick();
    }
    /**
     * Shows the helpfulSearchWidget input and triggers doHelpfulSearch.
     */
    showHelpfulSearchWidget() {
        const $j = window.jQuery;
        if ($j("#helpfulSearch")) {
            try {
                $j("#helpfulSearch").autocomplete("destroy");
                $j("#helpfulSearch").removeData("autocomplete-init");
            } catch {
                //
            }
        }
        const activity = this.activity;
        activity.helpfulSearchWidget.style.zIndex = 1001;
        activity.helpfulSearchWidget.idInput_custom = "";
        if (this.helpfulSearchDiv.style.display === "block") {
            activity.helpfulSearchWidget.value = null;
            activity.helpfulSearchWidget.style.visibility = "visible";
            document.getElementById("helpfulWheelDiv").style.display = "none";
            this.searchBlockPosition = [100, 100];
            this.prepSearchWidget();
            const that = this;
            setTimeout(() => {
                activity.helpfulSearchWidget.focus();
                that.doHelpfulSearch();
            }, 500);
        }
    }

    /**
     * Sets up jQuery autocomplete on the helpful search input and executes a search.
     */
    doHelpfulSearch() {
        const $j = window.jQuery;
        if (this.searchSuggestions.length === 0) {
            this.prepSearchWidget();
        }

        const that = this;
        const activity = this.activity;
        const $helpfulSearch = $j("#helpfulSearch");

        if (!$helpfulSearch.data("autocomplete-init")) {
            $helpfulSearch.autocomplete({
                source: (request, response) => {
                    const term = (request.term || "").toLowerCase().trim();
                    response(that.filterSuggestions(term));
                },
                delay: 400,
                appendTo: "body",
                select: (event, ui) => {
                    event.preventDefault();
                    activity.helpfulSearchWidget.value = ui.item.label;
                    activity.helpfulSearchWidget.idInput_custom = ui.item.value;
                    activity.helpfulSearchWidget.protoblk = ui.item.specialDict;
                    that.doHelpfulSearch();
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

        const searchInput = activity.helpfulSearchWidget.idInput_custom;
        if (!searchInput || searchInput.length <= 0) {
            if (
                activity.helpfulSearchWidget.value &&
                activity.helpfulSearchWidget.value.length > 0
            ) {
                $helpfulSearch.autocomplete("search", activity.helpfulSearchWidget.value);
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
        document.getElementById("helpfulSearchDiv").style.display = "none";
        activity.update = true;
    }
}

/**
 * Creates a SearchController and attaches it to the activity.
 * Installs delegation methods on activity so external callers
 * (palette.js, planetInterface.js) continue to work unchanged.
 * @param {object} activity - The Activity instance.
 */
const setupSearchController = activity => {
    activity.searchController = new SearchController(activity);
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
