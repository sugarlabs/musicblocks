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

/* global _ */

/* exported setupTrashController, TrashController */

class TrashController {
    /**
     * @param {object} activity - The Activity instance.
     */
    constructor(activity) {
        this.activity = activity;

        // Stores the click handler reference for proper cleanup of the
        // click-outside-to-close listener attached to the trash view.
        this._trashViewClickHandler = null;

        // Add event listener for trash icon click
        const restoreIcon = document.getElementById("restoreIcon");
        if (restoreIcon) {
            restoreIcon.addEventListener("click", () => {
                this.renderTrashView();
            });
        }
    }

    /**
     * @private
     * @returns {boolean} true if there is nothing in the trash to restore.
     */
    _isTrashEmpty() {
        const activity = this.activity;
        return (
            !activity.blocks ||
            !activity.blocks.trashStacks ||
            activity.blocks.trashStacks.length === 0
        );
    }

    /**
     * Restore last stack pushed to trashStack back onto canvas.
     * Hides palettes before update
     * Repositions blocks about trash area
     */
    restoreTrash() {
        const activity = this.activity;
        if (this._isTrashEmpty()) {
            activity.textMsg(_("Trash can is empty."), 3000);
            return;
        }

        // Cache DOM element reference for performance
        const helpfulWheelDiv = document.getElementById("helpfulWheelDiv");
        if (helpfulWheelDiv && helpfulWheelDiv.style.display !== "none") {
            helpfulWheelDiv.style.display = "none";
            activity.__tick();
        }
    }

    /**
     * Restore the most recently deleted block from the trash.
     */
    restoreLastFromTrash() {
        const activity = this.activity;
        if (this._isTrashEmpty()) {
            activity.textMsg(_("Trash can is empty."), 3000);
            return;
        }
        this.restoreTrashById(activity.blocks.trashStacks[activity.blocks.trashStacks.length - 1]);
        activity.textMsg(_("Item restored from the trash."), 3000);

        // Cache DOM element reference for performance
        const helpfulWheelDiv = document.getElementById("helpfulWheelDiv");
        if (helpfulWheelDiv && helpfulWheelDiv.style.display !== "none") {
            helpfulWheelDiv.style.display = "none";
            activity.__tick();
        }
    }

    /**
     * Restores a specific block (and its drag group) from the trash by id.
     * @param {number} blockId
     */
    restoreTrashById(blockId) {
        const activity = this.activity;
        const blockIndex = activity.blocks.trashStacks.indexOf(blockId);
        if (blockIndex === -1) return; // Block not found in trash

        activity.blocks.trashStacks.splice(blockIndex, 1); // Remove from trash

        for (const name in activity.palettes.dict) {
            activity.palettes.dict[name].hideMenu(true);
        }
        activity.blocks.activeBlock = null;
        activity.refreshCanvas();

        const dx = 0;
        const dy = -activity.cellSize * 3; // Reposition

        // Restore drag group
        activity.blocks.findDragGroup(blockId);
        for (let b = 0; b < activity.blocks.dragGroup.length; b++) {
            const blk = activity.blocks.dragGroup[b];
            activity.blocks.blockList[blk].trash = false;
            activity.blocks.moveBlockRelative(blk, dx, dy);

            const block = activity.blocks.blockList[blk];

            // Re-populate blocks.blockArt[blk] if it was deleted on trash.
            // sendStackToTrash() and sendAllToTrash() both delete blockArt[blk]
            // to free memory. Without regeneration, printBlockSVG() receives
            // undefined here, passes it to DOMParser.parseFromString(undefined),
            // and injects a <parsererror> node into every Save Block Artwork
            // export (activity.js ~line 1394).
            if (!activity.blocks.blockArt[blk]) {
                block.regenerateArtwork(block.isCollapsible());
            }

            // Re-cache the container if it was uncached to save
            // memory in sendStackToTrash().
            if (block.container && !block.container.bitmapCache) {
                block.container.cache(0, 0, Math.max(block.width, 1), Math.max(block.height, 1));
            }

            activity.blocks.blockList[blk].show();
        }
        activity.blocks.raiseStackToTop(blockId);
        const restoredBlock = activity.blocks.blockList[blockId];

        if (restoredBlock.name === "start" || restoredBlock.name === "drum") {
            const turtle = restoredBlock.value;
            const primaryTurtle = activity.turtles.getTurtle(turtle);
            primaryTurtle.inTrash = false;
            primaryTurtle.container.visible = true;

            // FIX: Restore the companion turtle if one exists.
            // sendStackToTrash() in blocks.js (~line 7257) sets BOTH the primary
            // and companion turtle to inTrash=true / visible=false when trashing a
            // start/drum block. Without this mirror restore, the companion stays
            // inTrash=true permanently, and logo.js (~line 1519) silently skips it:
            //   if (!tur.inTrash) { tur.running = true; ... }
            // This means onEveryBeatDo callbacks are dead after any trash+restore.
            const comp = primaryTurtle.companionTurtle;
            if (comp !== null && comp !== undefined) {
                const companionTurtle = activity.turtles.getTurtle(comp);
                if (companionTurtle) {
                    companionTurtle.inTrash = false;
                    companionTurtle.container.visible = true;
                }
            }
        } else if (restoredBlock.name === "action") {
            const actionArg = activity.blocks.blockList[restoredBlock.connections[1]];
            if (actionArg !== null) {
                let label;
                const oldName = actionArg.value;
                restoredBlock.trash = true;
                const uniqueName = activity.blocks.findUniqueActionName(oldName);
                restoredBlock.trash = false;

                if (uniqueName !== actionArg) {
                    actionArg.value = uniqueName;
                    const translatedName = _(uniqueName);
                    label =
                        translatedName.length > 8
                            ? translatedName.substr(0, 7) + "..."
                            : translatedName;
                    actionArg.text.text = label;

                    if (actionArg.label !== null) {
                        actionArg.label.value = translatedName;
                    }
                    actionArg.container.updateCache();
                    for (let b = 0; b < activity.blocks.dragGroup.length; b++) {
                        const me = activity.blocks.blockList[activity.blocks.dragGroup[b]];
                        if (
                            ["nameddo", "nameddoArg", "namedcalc", "namedcalcArg"].includes(
                                me.name
                            ) &&
                            me.privateData === oldName
                        ) {
                            me.privateData = uniqueName;
                            me.value = uniqueName;
                            const translatedMeName = _(uniqueName);
                            label =
                                translatedMeName.length > 8
                                    ? translatedMeName.substr(0, 7) + "..."
                                    : translatedMeName;
                            me.text.text = label;
                            me.overrideName = label;
                            me.regenerateArtwork();
                            me.container.updateCache();
                        }
                    }
                }

                // Re-add the action to the palette
                const actionName = actionArg.value;
                activity.blocks.newNameddoBlock(
                    actionName,
                    activity.blocks.actionHasReturn(blockId),
                    activity.blocks.actionHasArgs(blockId)
                );
                activity.palettes.updatePalettes("action");
            }
        }
        activity.textMsg(_("Item restored from the trash."), 3000);

        activity.refreshCanvas();
    }

    /**
     * Hides trashView when a click occurs outside of it.
     * @private
     * @param {HTMLElement} trashView
     */
    _handleClickOutsideTrashView(trashView) {
        // Remove existing listener to prevent duplicates
        if (this._trashViewClickHandler) {
            document.removeEventListener("click", this._trashViewClickHandler);
        }

        let firstClick = true;
        this._trashViewClickHandler = event => {
            if (firstClick) {
                firstClick = false;
                return;
            }
            if (!trashView.contains(event.target) && event.target !== trashView) {
                trashView.style.display = "none";
                // Clean up listener when trashView is hidden
                document.removeEventListener("click", this._trashViewClickHandler);
                this._trashViewClickHandler = null;
            }
        };
        document.addEventListener("click", this._trashViewClickHandler);
    }

    /**
     * Renders the trash panel listing every trashed block, with controls
     * to restore the last item, restore all items, or restore a single item.
     */
    renderTrashView() {
        const activity = this.activity;
        if (this._isTrashEmpty()) {
            return;
        }
        const trashList = document.getElementById("trashList");
        const trashView = document.createElement("div");
        trashView.id = "trashView";
        trashView.classList.add("trash-view");

        // Sticky icons
        const buttonContainer = document.createElement("div");
        buttonContainer.classList.add("button-container");

        const restoreLastIcon = document.createElement("a");
        restoreLastIcon.id = "restoreLastIcon";
        restoreLastIcon.classList.add("restore-last-icon");
        restoreLastIcon.innerHTML = '<i class="material-icons md-48">restore_from_trash</i>';
        restoreLastIcon.addEventListener("click", () => {
            this.restoreTrashById(
                activity.blocks.trashStacks[activity.blocks.trashStacks.length - 1]
            );
            trashView.classList.add("hidden");
        });

        const restoreAllIcon = document.createElement("a");
        restoreAllIcon.id = "restoreAllIcon";
        restoreAllIcon.classList.add("restore-all-icon");
        restoreAllIcon.innerHTML = '<i class="material-icons md-48">delete_sweep</i>';
        restoreAllIcon.addEventListener("click", () => {
            while (activity.blocks.trashStacks.length > 0) {
                this.restoreTrashById(activity.blocks.trashStacks[0]);
            }
            trashView.classList.add("hidden");
        });
        restoreLastIcon.setAttribute("title", _("Restore last item"));
        restoreAllIcon.setAttribute("title", _("Restore all items"));

        buttonContainer.appendChild(restoreLastIcon);
        buttonContainer.appendChild(restoreAllIcon);
        trashView.appendChild(buttonContainer);

        // Render trash items
        activity.blocks.trashStacks.forEach(blockId => {
            const block = activity.blocks.blockList[blockId];
            const listItem = document.createElement("div");
            listItem.classList.add("trash-item");

            const preview = activity.blocks.trashPreviews[blockId];
            let imgSrc;
            if (preview) {
                imgSrc = preview;
            } else {
                const svgData = block.artwork;
                imgSrc = "data:image/svg+xml;utf8," + encodeURIComponent(svgData);
            }

            const img = document.createElement("img");
            img.src = imgSrc;
            img.alt = "Block Icon";
            img.classList.add("trash-item-icon");

            const textNode = document.createTextNode(block.name);

            listItem.appendChild(img);
            listItem.appendChild(textNode);
            listItem.dataset.blockId = blockId;

            listItem.addEventListener("mouseover", () => {
                listItem.classList.add("hover");
            });
            listItem.addEventListener("mouseout", () => {
                listItem.classList.remove("hover");
            });

            img.addEventListener("mouseover", event => {
                this._showTrashPreviewPopup(imgSrc, event);
            });
            img.addEventListener("mousemove", event => {
                this._showTrashPreviewPopup(imgSrc, event);
            });
            img.addEventListener("mouseout", () => {
                this._hideTrashPreviewPopup();
            });

            listItem.addEventListener("click", () => {
                this.restoreTrashById(blockId);
                this._hideTrashPreviewPopup();
                trashView.classList.add("hidden");
            });

            trashView.appendChild(listItem);
        });

        // Attach outside-click listener once, after all items are rendered
        this._handleClickOutsideTrashView(trashView);

        const existingView = document.getElementById("trashView");
        if (existingView) {
            trashList.replaceChild(trashView, existingView);
        } else {
            trashList.appendChild(trashView);
        }
    }

    /**
     * Shows a larger preview popup for trashed items.
     * @private
     * @param {string} imgSrc - The source of the image.
     * @param {MouseEvent} event - The mouse event.
     * @returns {void}
     */
    _showTrashPreviewPopup(imgSrc, event) {
        let popup = document.getElementById("trashPreviewPopup");
        if (!popup) {
            popup = document.createElement("div");
            popup.id = "trashPreviewPopup";
            popup.classList.add("trash-preview-popup");
            const img = document.createElement("img");
            popup.appendChild(img);
            document.body.appendChild(popup);
        }
        const img = popup.firstChild;
        if (img.src !== imgSrc) {
            img.src = imgSrc;
        }
        popup.style.display = "block";

        // Position next to cursor
        const xOffset = 20;
        const yOffset = 20;
        let x = event.clientX + xOffset;
        let y = event.clientY + yOffset;

        // Flip if near right edge
        if (x + 300 > window.innerWidth) {
            x = event.clientX - 320;
        }
        // Flip if near bottom edge
        if (y + 300 > window.innerHeight) {
            y = event.clientY - 320;
        }

        popup.style.left = x + "px";
        popup.style.top = y + "px";
    }

    /**
     * Hides the trash preview popup.
     * @private
     * @returns {void}
     */
    _hideTrashPreviewPopup() {
        const popup = document.getElementById("trashPreviewPopup");
        if (popup) {
            popup.style.display = "none";
        }
    }
}

/**
 * Creates a TrashController and attaches it, plus delegation stubs,
 * to the activity so external callers continue to work unchanged.
 * @param {object} activity - The Activity instance.
 */
const setupTrashController = activity => {
    const controller = new TrashController(activity);
    activity.trashController = controller;

    activity.restoreTrash = () => controller.restoreTrash();
    activity.restoreTrashPop = () => controller.restoreLastFromTrash();
    activity._restoreTrashById = blockId => controller.restoreTrashById(blockId);
    activity._renderTrashView = () => controller.renderTrashView();
    activity._showTrashPreviewPopup = (imgSrc, event) =>
        controller._showTrashPreviewPopup(imgSrc, event);
    activity._hideTrashPreviewPopup = () => controller._hideTrashPreviewPopup();

    return controller;
};

// All browser execution goes through RequireJS (AMD). The module.exports branch
// is present solely for Jest/Node test environments and is never exercised at
// runtime in the browser.
if (typeof define === "function" && define.amd) {
    define(function () {
        window.setupTrashController = setupTrashController;
        return { setupTrashController, TrashController };
    });
} else if (typeof module !== "undefined" && module.exports) {
    // Jest / Node environment
    module.exports = { setupTrashController, TrashController };
}
