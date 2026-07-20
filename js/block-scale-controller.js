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

/* global changeImage, BLOCKSCALES, DEFAULTBLOCKSCALE, SMALLERBUTTON, SMALLERDISABLEBUTTON,
   BIGGERBUTTON, BIGGERDISABLEBUTTON */

/* exported setupBlockScaleController, BlockScaleController */

class BlockScaleController {
    /**
     * @param {object} activity - The Activity instance.
     */
    constructor(activity) {
        this.activity = activity;
    }

    /**
     * Increases the size of blocks in the activity.
     */
    async doLargerBlocks() {
        const activity = this.activity;
        activity.blocks.activeBlock = null;

        if (!activity.resizeDebounce) {
            if (activity.blockscale < BLOCKSCALES.length - 1) {
                activity.resizeDebounce = true;
                activity.blockscale += 1;
                activity.clearCache();
                await activity.blocks.setBlockScale(BLOCKSCALES[activity.blockscale]);
                activity.blocks.checkBounds();
                activity.refreshCanvas();
            }

            setTimeout(() => {
                activity.resizeDebounce = false;
            }, 200);
        }

        await this.setSmallerLargerStatus();
        activity.stageDirty = true;

        this._hideHelpfulWheelIfVisible();
    }

    /**
     * Decreases the size of blocks in the activity.
     */
    async doSmallerBlocks() {
        const activity = this.activity;
        activity.blocks.activeBlock = null;

        if (!activity.resizeDebounce) {
            if (activity.blockscale > 0) {
                activity.resizeDebounce = true;
                activity.blockscale -= 1;
                activity.clearCache();
                await activity.blocks.setBlockScale(BLOCKSCALES[activity.blockscale]);
                activity.blocks.checkBounds();
                activity.refreshCanvas();
            }

            setTimeout(() => {
                activity.resizeDebounce = false;
            }, 200);
        }

        await this.setSmallerLargerStatus();
        activity.stageDirty = true;

        this._hideHelpfulWheelIfVisible();
    }

    /**
     * Hides the helpful wheel (if currently visible) and ticks the activity
     * so the canvas reflects the change immediately.
     */
    _hideHelpfulWheelIfVisible() {
        const activity = this.activity;
        // Cache DOM element reference for performance
        const helpfulWheelDiv = document.getElementById("helpfulWheelDiv");
        if (helpfulWheelDiv && helpfulWheelDiv.style.display !== "none") {
            helpfulWheelDiv.style.display = "none";
            activity.__tick();
        }
    }

    /*
     * If either the block size has reached its minimum or maximum,
     * then the icons to make them smaller/bigger will be hidden.
     * Sets the status of the smaller and larger block icons based on the current block size.
     */
    async setSmallerLargerStatus() {
        const activity = this.activity;
        if (BLOCKSCALES[activity.blockscale] < DEFAULTBLOCKSCALE) {
            await changeImage(
                activity.smallerContainer.children[0],
                SMALLERBUTTON,
                SMALLERDISABLEBUTTON
            );
        } else {
            await changeImage(
                activity.smallerContainer.children[0],
                SMALLERDISABLEBUTTON,
                SMALLERBUTTON
            );
        }

        if (BLOCKSCALES[activity.blockscale] === BLOCKSCALES[BLOCKSCALES.length - 1]) {
            await changeImage(
                activity.largerContainer.children[0],
                BIGGERBUTTON,
                BIGGERDISABLEBUTTON
            );
        } else {
            await changeImage(
                activity.largerContainer.children[0],
                BIGGERDISABLEBUTTON,
                BIGGERBUTTON
            );
        }
    }
}

/**
 * Creates a BlockScaleController and attaches it, plus delegation stubs,
 * to the activity so external callers continue to work unchanged.
 * @param {object} activity - The Activity instance.
 */
const setupBlockScaleController = activity => {
    const controller = new BlockScaleController(activity);
    activity.blockScaleController = controller;

    activity.doLargerBlocks = (...args) => controller.doLargerBlocks(...args);
    activity.doSmallerBlocks = (...args) => controller.doSmallerBlocks(...args);
    activity.setSmallerLargerStatus = (...args) => controller.setSmallerLargerStatus(...args);

    return controller;
};

// All browser execution goes through RequireJS (AMD). The module.exports branch
// is present solely for Jest/Node test environments and is never exercised at
// runtime in the browser.
if (typeof define === "function" && define.amd) {
    define(function () {
        window.setupBlockScaleController = setupBlockScaleController;
        return { setupBlockScaleController, BlockScaleController };
    });
} else if (typeof module !== "undefined" && module.exports) {
    // Jest / Node environment
    module.exports = { setupBlockScaleController, BlockScaleController };
}
