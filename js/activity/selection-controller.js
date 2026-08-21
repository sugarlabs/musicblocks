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

/* exported setupSelectionController, SelectionController */

class SelectionController {
    /**
     * @param {object} activity - The Activity instance.
     */
    constructor(activity) {
        this.activity = activity;

        // Flag to indicate whether the user is performing a 2D drag operation.
        this._isDragging = false;

        // Flag to indicate whether user is selecting
        this._isSelecting = false;

        // Flag to indicate the selection mode is on
        this.selectionModeOn = false;

        this.selectedBlocks = [];
        this.dragArea = {};
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;

        this._hasMouseMoved = false;

        this.selectionArea = null;
        this.dragRect = null;
        this.blockRect = null;

        // rAF guard for throttling drag-select mousemove
        this._dragSelectRafPending = false;
    }

    // -------------------------------------------------------------------------
    // Accessors — exposed for activity.js call sites (render loop, click
    // handler) that need to read/write this state directly.
    // -------------------------------------------------------------------------

    get isDragging() {
        return this._isDragging;
    }

    set isDragging(value) {
        this._isDragging = value;
    }

    get isSelecting() {
        return this._isSelecting;
    }

    set isSelecting(value) {
        this._isSelecting = value;
    }

    get hasMouseMoved() {
        return this._hasMouseMoved;
    }

    set hasMouseMoved(value) {
        this._hasMouseMoved = value;
    }

    // Setup mouse events to start the drag

    setupMouseEvents() {
        const activity = this.activity;
        activity.addEventListener(
            document,
            "mousedown",
            event => {
                if (!this.isSelecting) return;
                activity.moving = false;
                // event.preventDefault();
                // event.stopPropagation();
                if (event.target.id === "myCanvas") {
                    this._createDrag(event);
                }
            },
            false
        );
    }

    // create functionality of 2D drag to select blocks in bulk

    _create2Ddrag() {
        const activity = this.activity;

        this.dragArea = {};
        this.selectedBlocks = [];
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.hasMouseMoved = false;
        // rAF guard for throttling drag-select mousemove
        this._dragSelectRafPending = false;
        if (this.selectionArea && this.selectionArea.parentNode) {
            this.selectionArea.parentNode.removeChild(this.selectionArea);
        }
        this.selectionArea = document.createElement("div");
        document.body.appendChild(this.selectionArea);

        this.setupMouseEvents();

        activity.addEventListener(document, "mousemove", event => {
            this.hasMouseMoved = true;
            if (this.isDragging && this.isSelecting) {
                this.currentX = event.clientX;
                this.currentY = event.clientY;
                // Throttle drag-select to one update per animation frame
                if (
                    !this._dragSelectRafPending &&
                    !activity.blocks.isBlockMoving &&
                    !activity.turtles.running()
                ) {
                    this._dragSelectRafPending = true;
                    requestAnimationFrame(() => {
                        this._dragSelectRafPending = false;
                        this.setSelectionMode(true);
                        this.drawSelectionArea();
                        this.selectedBlocks = this.selectBlocksInDragArea();
                        this.unhighlightSelectedBlocks(true, true);
                        activity.blocks.setSelectedBlocks(this.selectedBlocks);
                    });
                }
            }
        });

        activity.addEventListener(document, "mouseup", () => {
            // event.preventDefault();
            if (!this.isSelecting) return;
            this.isDragging = false;
            this.selectionArea.style.display = "none";
            this.startX = 0;
            this.startY = 0;
            this.currentX = 0;
            this.currentY = 0;
            setTimeout(() => {
                this.hasMouseMoved = false;
            }, 100);
        });
    }

    // Set starting points of the drag

    _createDrag(event) {
        this.isDragging = true;
        this.startX = event.clientX;
        this.startY = event.clientY;
    }

    // Draw the area that has been dragged

    drawSelectionArea() {
        const x = Math.min(this.startX, this.currentX);
        const y = Math.min(this.startY, this.currentY);
        const width = Math.abs(this.currentX - this.startX);
        const height = Math.abs(this.currentY - this.startY);

        // Batch all CSS writes into a single cssText assignment
        // to avoid multiple forced style recalculations.
        this.selectionArea.style.cssText =
            "display:flex;position:absolute;" +
            "left:" +
            x +
            "px;top:" +
            y +
            "px;" +
            "width:" +
            width +
            "px;height:" +
            height +
            "px;" +
            "z-index:9989;" +
            "background-color:rgba(137,207,240,0.5);" +
            "pointer-events:none;";

        this.dragArea = { x, y, width, height };
    }

    // Check if the block is overlapping the dragged area.

    rectanglesOverlap(rect1, rect2) {
        return (
            rect1.x + rect1.width > rect2.x &&
            rect1.x < rect2.x + rect2.width &&
            rect1.y + rect1.height > rect2.y &&
            rect1.y < rect2.y + rect2.height
        );
    }

    // Select the blocks that overlap the dragged area.

    selectBlocksInDragArea() {
        const activity = this.activity;
        const selectedBlocks = [];
        this.dragRect = this.dragArea;

        activity.blocks.blockList.forEach(block => {
            this.blockRect = {
                x: activity.scrollBlockContainer
                    ? block.container.x + activity.blocksContainer.x
                    : block.container.x,
                y: block.container.y + activity.blocksContainer.y,
                height: block.height,
                width: block.width
            };

            if (this.rectanglesOverlap(this.blockRect, this.dragRect)) {
                selectedBlocks.push(block);
            }
        });
        return selectedBlocks;
    }

    // Unhighlight the selected blocks

    unhighlightSelectedBlocks(unhighlight, selectionModeOn) {
        const activity = this.activity;
        const blockIndexMap = new Map();
        for (const [index, block] of activity.blocks.blockList.entries()) {
            if (block) {
                blockIndexMap.set(block, index);
            }
        }

        for (let i = 0; i < this.selectedBlocks.length; i++) {
            const blockIndex = blockIndexMap.get(this.selectedBlocks[i]);
            if (blockIndex === undefined) {
                continue;
            }

            if (unhighlight) {
                activity.blocks.unhighlightSelectedBlocks(blockIndex, true);
            } else {
                activity.blocks.highlight(blockIndex, true);
            }
        }

        if (!unhighlight && this.selectedBlocks.length > 0) {
            activity.refreshCanvas();
        }
    }

    // Check if two blocks are the same by identity (reference equality).

    isEqual(obj1, obj2) {
        return obj1 === obj2;
    }

    setSelectionMode(selection) {
        const activity = this.activity;
        if (selection) {
            if (!this.selectionModeOn) {
                if (this.selectedBlocks.length !== 0) {
                    this.selectedBlocks = [];
                    this.selectionModeOn = selection;
                    activity.blocks.setSelection(this.selectionModeOn);
                }
            }
        } else {
            this.selectedBlocks = [];
            this.selectionModeOn = selection;
            activity.blocks.setSelection(this.selectionModeOn);
        }
    }

    // deselect the selected blocks

    deselectSelectedBlocks() {
        this.unhighlightSelectedBlocks(false);
        this.setSelectionMode(false);
    }

    deleteMultipleBlocks() {
        const activity = this.activity;
        if (activity.blocks.selectionModeOn) {
            const blocksArray = activity.blocks.selectedBlocks;
            // figure out which of the blocks in selectedBlocks are clamp blocks and nonClamp blocks.
            const clampBlocks = [];
            const nonClampBlocks = [];

            for (let i = 0; i < blocksArray.length; i++) {
                if (activity.blocks.selectedBlocks[i].isClampBlock()) {
                    clampBlocks.push(activity.blocks.selectedBlocks[i]);
                } else if (activity.blocks.selectedBlocks[i].isDisconnected()) {
                    nonClampBlocks.push(activity.blocks.selectedBlocks[i]);
                }
            }

            for (let i = 0; i < clampBlocks.length; i++) {
                activity.blocks.sendStackToTrash(clampBlocks[i]);
            }

            for (let i = 0; i < nonClampBlocks.length; i++) {
                activity.blocks.sendStackToTrash(nonClampBlocks[i]);
            }
            // set selection mode to false
            activity.blocks.setSelectionToActivity(false);
            activity.refreshCanvas();
            // Cache DOM element reference for performance
            document.getElementById("helpfulWheelDiv").style.display = "none";
        }
    }

    copyMultipleBlocks() {
        const activity = this.activity;
        if (activity.blocks.selectionModeOn && activity.blocks.selectedBlocks.length) {
            const blocksArray = activity.blocks.selectedBlocks;
            let pasteDx = 0,
                pasteDy = 0;
            const map = new Map();
            for (let i = 0; i < blocksArray.length; i++) {
                const idx = blocksArray[i].blockIndex;
                map.set(
                    idx,
                    blocksArray[i].connections.filter(blk => blk !== null)
                );

                if (
                    blocksArray[i].connections.some(blkno => {
                        const a = map.get(blkno);
                        return a && a.some(b => b === idx);
                    }) ||
                    blocksArray[i].trash
                )
                    continue;

                activity.blocks.activeBlock = idx;
                activity.blocks.pasteDx = pasteDx;
                activity.blocks.pasteDy = pasteDy;
                activity.blocks.prepareStackForCopy();
                activity.blocks.pasteStack();
                pasteDx += 21;
                pasteDy += 21;
            }

            this.setSelectionMode(false);
            this.selectedBlocks = [];
            this.unhighlightSelectedBlocks(false, false);
            activity.blocks.setSelectedBlocks(this.selectedBlocks);
            activity.refreshCanvas();
            // Cache DOM element reference for performance
            document.getElementById("helpfulWheelDiv").style.display = "none";
        }
    }

    selectMode() {
        const activity = this.activity;
        activity.moving = false;
        this.isSelecting = !this.isSelecting;
        this.isSelecting
            ? activity.textMsg(_("Select is enabled."))
            : activity.textMsg(_("Select is disabled."));
        document.getElementById("helpfulWheelDiv").style.display = "none";
    }
}

/**
 * Creates a SelectionController and attaches it, plus delegation stubs,
 * to the activity so external callers continue to work unchanged.
 * @param {object} activity - The Activity instance.
 */
const setupSelectionController = activity => {
    const controller = new SelectionController(activity);
    activity.selectionController = controller;

    activity.setupMouseEvents = () => controller.setupMouseEvents();
    activity._create2Ddrag = () => controller._create2Ddrag();
    activity._createDrag = event => controller._createDrag(event);
    activity.drawSelectionArea = () => controller.drawSelectionArea();
    activity.selectBlocksInDragArea = () => controller.selectBlocksInDragArea();
    activity.unhighlightSelectedBlocks = (unhighlight, selectionModeOn) =>
        controller.unhighlightSelectedBlocks(unhighlight, selectionModeOn);
    activity.rectanglesOverlap = (rect1, rect2) => controller.rectanglesOverlap(rect1, rect2);
    activity.isEqual = (obj1, obj2) => controller.isEqual(obj1, obj2);
    activity.setSelectionMode = selection => controller.setSelectionMode(selection);
    activity.deselectSelectedBlocks = () => controller.deselectSelectedBlocks();
    activity.deleteMultipleBlocks = () => controller.deleteMultipleBlocks();
    activity.copyMultipleBlocks = () => controller.copyMultipleBlocks();
    activity.selectMode = () => controller.selectMode();

    return controller;
};

// All browser execution goes through RequireJS (AMD). The module.exports branch
// is present solely for Jest/Node test environments and is never exercised at
// runtime in the browser.
if (typeof define === "function" && define.amd) {
    define(function () {
        window.setupSelectionController = setupSelectionController;
        return { setupSelectionController, SelectionController };
    });
} else if (typeof module !== "undefined" && module.exports) {
    // Jest / Node environment
    module.exports = { setupSelectionController, SelectionController };
}
