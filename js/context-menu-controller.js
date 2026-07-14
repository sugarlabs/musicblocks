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

/* global _, wheelnav, slicePath, platformColor, base64Encode, GOHOMEFADEDBUTTON,
   SHOWBLOCKSBUTTON, COLLAPSEBLOCKSBUTTON, SMALLERBUTTON, BIGGERBUTTON, CARTESIANBUTTON,
   SELECTBUTTON, CLEARBUTTON, COLLAPSEBUTTON, EXPANDBUTTON, piemenuGrid, LEADING,
   _THIS_IS_MUSIC_BLOCKS_ */

/* exported setupContextMenuController, ContextMenuController */

class ContextMenuController {
    /**
     * @param {object} activity - The Activity instance.
     */
    constructor(activity) {
        this.activity = activity;
    }

    /**
     * Sets up right click functionality opening the context menus
     * (if block is right clicked)
     */
    doContextMenus() {
        const activity = this.activity;
        activity.addEventListener(
            document,
            "contextmenu",
            event => {
                event.preventDefault();
                event.stopPropagation();
                if (activity.beginnerMode) return;
                if (activity.searchUI.isHelpfulSearchWidgetOn) {
                    this._hideHelpfulSearchWidget();
                }
                if (
                    !activity.blocks.isCoordinateOnBlock(event.clientX, event.clientY) &&
                    event.target.id === "myCanvas"
                ) {
                    this.displayHelpfulWheel(event);
                }
            },
            false
        );
    }

    /**
     * Displays helpfulWheel on canvas on right click.
     * @param {MouseEvent} event
     */
    displayHelpfulWheel(event) {
        const activity = this.activity;
        // Cache DOM element reference for performance (7 lookups reduced to 1)
        const helpfulWheelDiv = document.getElementById("helpfulWheelDiv");
        helpfulWheelDiv.style.position = "absolute";

        const x = event.clientX;
        const y = event.clientY;

        const canvasLeft = activity.canvas.offsetLeft + 28 * activity.getStageScale();
        const canvasTop = activity.canvas.offsetTop + 6 * activity.getStageScale();

        const helpfulWheelLeft = Math.max(
            Math.round(x * activity.getStageScale() + canvasLeft) - 150,
            canvasLeft
        );
        const helpfulWheelTop = Math.max(
            Math.round(y * activity.getStageScale() + canvasTop) - 150,
            canvasTop
        );

        helpfulWheelDiv.style.left = helpfulWheelLeft + "px";

        helpfulWheelDiv.style.top = helpfulWheelTop + "px";

        const windowWidth = window.innerWidth - 20;
        const windowHeight = window.innerHeight - 20;

        if (helpfulWheelLeft + 350 > windowWidth) {
            helpfulWheelDiv.style.left = windowWidth - 350 + "px";
        }
        if (helpfulWheelTop + 350 > windowHeight) {
            helpfulWheelDiv.style.top = windowHeight - 350 + "px";
        }

        // Show bulk actions only when blocks are multi-selected.
        const selectedBlocksCount = activity.blocks.selectedBlocks.filter(
            block => !block.trash
        ).length;
        activity.helpfulWheelItems.find(ele => ele.label === "Move to trash").display =
            selectedBlocksCount > 0;
        activity.helpfulWheelItems.find(ele => ele.label === "Duplicate").display =
            selectedBlocksCount > 0;

        helpfulWheelDiv.style.display = "";

        const wheel = new wheelnav("helpfulWheelDiv", null, 300, 300);
        wheel.colors = platformColor.wheelcolors;
        wheel.slicePathFunction = slicePath().DonutSlice;
        wheel.slicePathCustom = slicePath().DonutSliceCustomization();
        wheel.slicePathCustom.minRadiusPercent = 0.45;
        wheel.slicePathCustom.maxRadiusPercent = 1.0;
        wheel.sliceSelectedPathCustom = wheel.slicePathCustom;
        wheel.sliceInitPathCustom = wheel.slicePathCustom;
        wheel.clickModeRotate = false;
        const wheelItems = activity.helpfulWheelItems.filter(ele => ele.display);
        wheel.initWheel(wheelItems.map(ele => _(ele.label)));

        wheelItems.forEach((ele, i) => {
            if (ele.icon) {
                wheel.navItems[i].setTitle(ele.icon);
            }
        });

        wheel.createWheel();

        wheel.navItems[0].selected = false;

        wheelItems.forEach((ele, i) => {
            wheel.navItems[i].setTooltip(_(ele.label));
            wheel.navItems[i].navigateFunction = () => ele.fn(activity);
        });
        const closeHelpfulWheel = e => {
            const isClickInside = helpfulWheelDiv.contains(e.target);
            if (!isClickInside) {
                helpfulWheelDiv.style.display = "none";
                activity.removeEventListener(document, "click", closeHelpfulWheel);
            }
        };

        activity.addEventListener(document, "click", closeHelpfulWheel);
    }

    /**
     * Sets up palette buttons and functions
     * e.g. Home, Collapse, Expand
     * These menu items are on the canvas, not the toolbar.
     */
    setupPaletteMenu() {
        const activity = this.activity;
        activity.helpfulWheelItems = [];
        const btnSize = activity.cellSize;
        const createButton = (icon, label, action) => {
            const button = this.makeButton(icon, label, x, y, btnSize, 0);
            this.loadButtonDragHandler(button, action, activity);
            x += btnSize;
            return button;
        };

        let x = window.innerWidth - 4 * btnSize - 27.5;
        const y = window.innerHeight - 57.5;

        const removeButtonContainer = document.getElementById("buttoncontainerBOTTOM");
        if (removeButtonContainer) {
            removeButtonContainer.parentNode.removeChild(removeButtonContainer);
        }

        const ButtonHolder = document.createElement("div");
        ButtonHolder.setAttribute("id", "buttoncontainerBOTTOM");
        ButtonHolder.style.display = "block";
        document.body.appendChild(ButtonHolder);

        activity.homeButtonContainer = createButton(
            GOHOMEFADEDBUTTON,
            `${_("Home")} [${_("Home").toUpperCase()}]`,
            activity.findBlocks
        );
        activity.boundary.hide();

        if (!activity.helpfulWheelItems.find(ele => ele.label === "Home [HOME]"))
            activity.helpfulWheelItems.push({
                label: "Home [HOME]",
                icon:
                    "imgsrc:data:image/svg+xml;base64," +
                    window.btoa(base64Encode(GOHOMEFADEDBUTTON)),
                display: true,
                fn: activity.findBlocks
            });

        activity.hideBlocksContainer = createButton(
            SHOWBLOCKSBUTTON,
            _("Show/hide blocks"),
            activity.changeBlockVisibility
        );

        if (!activity.helpfulWheelItems.find(ele => ele.label === "Show/hide blocks"))
            activity.helpfulWheelItems.push({
                label: "Show/hide blocks",
                icon:
                    "imgsrc:data:image/svg+xml;base64," +
                    window.btoa(base64Encode(SHOWBLOCKSBUTTON)),
                display: true,
                fn: activity.changeBlockVisibility
            });

        activity.collapseBlocksContainer = createButton(
            COLLAPSEBLOCKSBUTTON,
            _("Expand/collapse blocks"),
            activity.toggleCollapsibleStacks
        );

        if (!activity.helpfulWheelItems.find(ele => ele.label === "Expand/collapse blocks"))
            activity.helpfulWheelItems.push({
                label: "Expand/collapse blocks",
                icon:
                    "imgsrc:data:image/svg+xml;base64," +
                    window.btoa(base64Encode(COLLAPSEBLOCKSBUTTON)),
                display: true,
                fn: activity.toggleCollapsibleStacks
            });

        activity.smallerContainer = createButton(
            SMALLERBUTTON,
            _("Decrease block size"),
            activity.doSmallerBlocks
        );

        if (!activity.helpfulWheelItems.find(ele => ele.label === "Decrease block size"))
            activity.helpfulWheelItems.push({
                label: "Decrease block size",
                icon:
                    "imgsrc:data:image/svg+xml;base64," + window.btoa(base64Encode(SMALLERBUTTON)),
                display: true,
                fn: activity.doSmallerBlocks
            });

        activity.largerContainer = createButton(
            BIGGERBUTTON,
            _("Increase block size"),
            activity.doLargerBlocks
        );

        if (!activity.helpfulWheelItems.find(ele => ele.label === "Increase block size"))
            activity.helpfulWheelItems.push({
                label: "Increase block size",
                icon: "imgsrc:data:image/svg+xml;base64," + window.btoa(base64Encode(BIGGERBUTTON)),
                display: true,
                fn: activity.doLargerBlocks
            });

        if (!activity.helpfulWheelItems.find(ele => ele.label === "Restore"))
            activity.helpfulWheelItems.push({
                label: "Restore",
                icon: "imgsrc:header-icons/restore-from-trash.svg",
                display: true,
                fn: activity.restoreTrashPop
            });

        if (!activity.helpfulWheelItems.find(ele => ele.label === "Turtle Wrap Off"))
            activity.helpfulWheelItems.push({
                label: "Turtle Wrap Off",
                icon: "imgsrc:header-icons/wrap-text.svg",
                display: true,
                fn: activity.toolbar.changeWrap
            });

        if (!activity.helpfulWheelItems.find(ele => ele.label === "Turtle Wrap On"))
            activity.helpfulWheelItems.push({
                label: "Turtle Wrap On",
                icon: "imgsrc:header-icons/wrap-text.svg",
                display: false,
                fn: activity.toolbar.changeWrap
            });

        if (!activity.helpfulWheelItems.find(ele => ele.label === "Enable horizontal scrolling"))
            activity.helpfulWheelItems.push({
                label: "Enable horizontal scrolling",
                icon: "imgsrc:header-icons/compare-arrows.svg",
                display: activity.beginnerMode ? false : true,
                fn: activity.setScroller
            });

        if (!activity.helpfulWheelItems.find(ele => ele.label === "Disable horizontal scrolling"))
            activity.helpfulWheelItems.push({
                label: "Disable horizontal scrolling",
                icon: "imgsrc:header-icons/lock.svg",
                display: false,
                fn: activity.setScroller
            });

        if (
            _THIS_IS_MUSIC_BLOCKS_ &&
            !activity.helpfulWheelItems.find(ele => ele.label === "Set Pitch Preview")
        )
            activity.helpfulWheelItems.push({
                label: "Set Pitch Preview",
                icon: "imgsrc:header-icons/music-note.svg",
                display: true,
                fn: activity.chooseKeyMenu
            });

        if (!activity.helpfulWheelItems.find(ele => ele.label === "Grid"))
            activity.helpfulWheelItems.push({
                label: "Grid",
                icon:
                    "imgsrc:data:image/svg+xml;base64," +
                    window.btoa(base64Encode(CARTESIANBUTTON)),
                display: true,
                fn: piemenuGrid
            });

        if (!activity.helpfulWheelItems.find(ele => ele.label === "Select"))
            activity.helpfulWheelItems.push({
                label: "Select",
                icon: "imgsrc:data:image/svg+xml;base64," + window.btoa(base64Encode(SELECTBUTTON)),
                display: true,
                fn: activity.selectMode
            });

        if (!activity.helpfulWheelItems.find(ele => ele.label === "Move to trash"))
            activity.helpfulWheelItems.push({
                label: "Move to trash",
                icon: "imgsrc:header-icons/empty-trash-button.svg",
                display: false,
                fn: activity.deleteMultipleBlocks
            });

        if (!activity.helpfulWheelItems.find(ele => ele.label === "Duplicate"))
            activity.helpfulWheelItems.push({
                label: "Duplicate",
                icon: "imgsrc:header-icons/copy-button.svg",
                display: false,
                fn: activity.copyMultipleBlocks
            });

        if (!activity.helpfulWheelItems.find(ele => ele.label === "Clear"))
            activity.helpfulWheelItems.push({
                label: "Clear",
                icon: "imgsrc:data:image/svg+xml;base64," + window.btoa(base64Encode(CLEARBUTTON)),
                display: true,
                fn: () => activity._allClear(false)
            });

        if (!activity.helpfulWheelItems.find(ele => ele.label === "Collapse"))
            activity.helpfulWheelItems.push({
                label: "Collapse",
                icon:
                    "imgsrc:data:image/svg+xml;base64," + window.btoa(base64Encode(COLLAPSEBUTTON)),
                display: true,
                fn: activity.turtles.collapse
            });

        if (!activity.helpfulWheelItems.find(ele => ele.label === "Expand"))
            activity.helpfulWheelItems.push({
                label: "Expand",
                icon: "imgsrc:data:image/svg+xml;base64," + window.btoa(base64Encode(EXPANDBUTTON)),
                display: false,
                fn: activity.turtles.expand
            });

        if (!activity.helpfulWheelItems.find(ele => ele.label === "Search for Blocks"))
            activity.helpfulWheelItems.push({
                label: "Search for Blocks",
                icon: "imgsrc:header-icons/search-button.svg",
                display: true,
                fn: this._displayHelpfulSearchDiv.bind(this)
            });

        if (!activity.helpfulWheelItems.find(ele => ele.label === "Paste previous stack"))
            activity.helpfulWheelItems.push({
                label: "Paste previous stack",
                icon: "imgsrc:header-icons/copy-button.svg",
                display: false,
                fn: activity.turtles.expand
            });
        if (!activity.helpfulWheelItems.find(ele => ele.label === "Close"))
            activity.helpfulWheelItems.push({
                label: "Close",
                icon: "imgsrc:header-icons/cancel-button.svg",
                display: true,
                fn: this._hideHelpfulSearchWidget.bind(this)
            });
    }

    /**
     * Makes non-toolbar buttons, e.g., the palette menu buttons.
     */
    makeButton(name, label, x, y) {
        const activity = this.activity;
        const container = document.createElement("div");
        container.setAttribute("id", "" + label);
        container.setAttribute("class", "tooltipped");
        container.setAttribute("data-tooltip", label);
        container.setAttribute("data-position", "top");
        window.jQuery(".tooltipped").tooltip({
            html: true,
            delay: 100
        });

        container.onmouseover = () => {
            if (!activity.loading) {
                document.body.style.cursor = "pointer";
                container.style.transition = "0.12s ease-out";
                container.style.transform = "scale(1.15)";
            }
        };

        container.onmouseout = () => {
            if (!activity.loading) {
                document.body.style.cursor = "default";
                container.style.transition = "0.15s ease-out";
                container.style.transform = "scale(1)";
            }
        };

        const img = new Image();
        img.src = "data:image/svg+xml;base64," + window.btoa(base64Encode(name));
        // Accessibility: derive alt text from the button label
        const altText = label ? label.replace(/\s*\[.*\]$/, "") : "Toolbar button";
        img.setAttribute("alt", altText);

        // Batch DOM reads before writes to avoid forced synchronous layout
        const rightPos = document.body.clientWidth - x;
        container.appendChild(img);
        container.setAttribute(
            "style",
            "position: absolute; right:" + rightPos + "px;  top: " + y + "px;"
        );
        document.getElementById("buttoncontainerBOTTOM").appendChild(container);
        return container;
    }

    /**
     * Handles button dragging, long hovering and prevents multiple button presses.
     * @param container longAction
     * @param hoverAction extraLongImg
     */
    loadButtonDragHandler(container, actionClick, arg) {
        const activity = this.activity;
        container.onmousedown = () => {
            if (!activity.loading) {
                document.body.style.cursor = "default";
            }
            actionClick(arg);
        };
    }

    /*
     * Open aux menu
     */
    openAuxMenu() {
        const activity = this.activity;
        if (!activity.turtles.running() && activity.toolbarHeight === 0) {
            this._showHideAuxMenu(false);
        }
    }

    /*
     * Toggles Aux menu visibility and positioning.
     * Called with an explicit `activity` argument by external callers
     * (toolbar-ui.js's renderMenuIcon/closeAuxToolbar, plugin-dialog.js).
     */
    showHideAuxMenu(activity, resize) {
        activity._showHideAuxMenu(resize);
    }

    /*
     * Toggles Aux menu visibility and positioning.
     */
    _showHideAuxMenu(resize) {
        const activity = this.activity;
        const cellsize = 55;
        let dy;

        // function to increase or decrease the "top" property of the top-right corner buttons

        const topRightButtons = document.querySelectorAll("#buttoncontainerTOP .tooltipped");
        const gridElement = document.getElementById("Grid");
        const btnY = gridElement ? gridElement.getBoundingClientRect().top : 70 + LEADING + 6;

        this.changeTopButtonsPosition = value => {
            topRightButtons.forEach(child => {
                child.style.top = `${btnY + value}px`;
            });
        };

        if (!resize && activity.toolbarHeight === 0) {
            dy = cellsize + LEADING + 5;

            activity.toolbarHeight = dy;
            activity.palettes.deltaY(dy);
            activity.turtles.deltaY(dy);
            activity.blocksContainer.y += dy;
            this.changeTopButtonsPosition(dy);

            activity.cartesianBitmap.y += dy;
            activity.polarBitmap.y += dy;
            activity.trebleBitmap.y += dy;
            activity.grandBitmap.y += dy;
            activity.sopranoBitmap.y += dy;
            activity.altoBitmap.y += dy;
            activity.tenorBitmap.y += dy;
            activity.bassBitmap.y += dy;
            activity.blocks.checkBounds();
        } else {
            dy = activity.toolbarHeight;
            activity.toolbarHeight = 0;

            activity.turtles.deltaY(-dy);
            activity.palettes.deltaY(-dy);
            activity.blocksContainer.y -= dy;
            this.changeTopButtonsPosition(-dy);

            activity.cartesianBitmap.y -= dy;
            activity.polarBitmap.y -= dy;
            activity.trebleBitmap.y -= dy;
            activity.grandBitmap.y -= dy;
            activity.sopranoBitmap.y -= dy;
            activity.altoBitmap.y -= dy;
            activity.tenorBitmap.y -= dy;
            activity.bassBitmap.y -= dy;
        }

        activity.refreshCanvas();
    }

    /*
     * Hides aux menu
     */
    hideAuxMenu() {
        const activity = this.activity;
        if (activity.toolbarHeight > 0) {
            this._showHideAuxMenu(false);
            activity.menuButtonsVisible = false;
        }
    }

    /**
     * Handles changes in y coordinates of elements when aux toolbar is opened.
     * Repositions elements on screen by a certain amount (dy).
     * @param dy how much of a change in y
     */
    deltaY(dy) {
        const activity = this.activity;
        activity.toolbarHeight += dy;
        for (let i = 0; i < activity.onscreenButtons.length; i++) {
            activity.onscreenButtons[i].y += dy;
        }

        for (let i = 0; i < activity.onscreenMenu.length; i++) {
            activity.onscreenMenu[i].y += dy;
        }

        activity.palettes.deltaY(dy);
        activity.turtles.deltaY(dy);

        // activity.menuContainer.y += dy;
        activity.blocksContainer.y += dy;
        activity.refreshCanvas();
    }

    /*
     * creates helpfulSearchDiv for search
     */
    setHelpfulSearchDiv() {
        return this.activity.searchController.setHelpfulSearchDiv();
    }

    /*
     * displays helpfulSearchDiv on canvas
     */
    _displayHelpfulSearchDiv() {
        return this.activity.searchController._displayHelpfulSearchDiv();
    }

    _hideHelpfulSearchWidget(e) {
        return this.activity.searchController._hideHelpfulSearchWidget(e);
    }
}

/**
 * Creates a ContextMenuController and attaches it, plus delegation stubs,
 * to the activity so external callers continue to work unchanged.
 * @param {object} activity - The Activity instance.
 */
const setupContextMenuController = activity => {
    const controller = new ContextMenuController(activity);
    activity.contextMenuController = controller;

    activity.doContextMenus = (...args) => controller.doContextMenus(...args);
    activity.displayHelpfulWheel = (...args) => controller.displayHelpfulWheel(...args);
    activity.setupPaletteMenu = (...args) => controller.setupPaletteMenu(...args);
    activity.makeButton = (...args) => controller.makeButton(...args);
    activity.loadButtonDragHandler = (...args) => controller.loadButtonDragHandler(...args);
    activity.openAuxMenu = (...args) => controller.openAuxMenu(...args);
    // `_showHideAuxMenu` keeps its underscore-prefixed name for backward
    // compatibility with external callers (project-manager.js, the inline
    // PluginDialog callback in activity.js) that already invoke it directly.
    activity._showHideAuxMenu = resize => controller._showHideAuxMenu(resize);
    activity.showHideAuxMenu = (...args) => controller.showHideAuxMenu(...args);
    activity.hideAuxMenu = (...args) => controller.hideAuxMenu(...args);
    activity.deltaY = dy => controller.deltaY(dy);
    activity.setHelpfulSearchDiv = (...args) => controller.setHelpfulSearchDiv(...args);
    activity._displayHelpfulSearchDiv = (...args) => controller._displayHelpfulSearchDiv(...args);
    activity._hideHelpfulSearchWidget = (...args) => controller._hideHelpfulSearchWidget(...args);

    return controller;
};

// All browser execution goes through RequireJS (AMD). The module.exports branch
// is present solely for Jest/Node test environments and is never exercised at
// runtime in the browser.
if (typeof define === "function" && define.amd) {
    define(function () {
        window.setupContextMenuController = setupContextMenuController;
        return { setupContextMenuController, ContextMenuController };
    });
} else if (typeof module !== "undefined" && module.exports) {
    // Jest / Node environment
    module.exports = { setupContextMenuController, ContextMenuController };
}
