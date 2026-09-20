// Copyright (c) 2014-23 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
   global

   platformColor, docById, slicePath, wheelnav, HelpWidget, _
*/

/* exported piemenuBlockContext */

/**
 * Creates the per-block right-click/long-press context wheel (duplicate,
 * extract, trash, close, and, conditionally, save-stack and help).
 *
 * @param {object} block - The Block instance the context wheel is opened for.
 * @returns {void}
 */
const piemenuBlockContext = block => {
    if (block.blocks.activeBlock === null) {
        return;
    }

    let pasteDx = 0;
    let pasteDy = 0;

    const that = block;
    const blockBlock = block.blockIndex;

    // Position the widget centered over the active block.
    docById("contextWheelDiv").style.position = "absolute";

    const x = block.blocks.blockList[blockBlock].container.x;
    const y = block.blocks.blockList[blockBlock].container.y;

    const canvasLeft = block.activity.canvas.offsetLeft + 28 * block.activity.getStageScale();
    const canvasTop = block.activity.canvas.offsetTop + 6 * block.activity.getStageScale();

    docById("contextWheelDiv").style.left =
        Math.round(
            (x + block.activity.blocksContainer.x) * block.activity.getStageScale() + canvasLeft
        ) -
        150 +
        "px";
    docById("contextWheelDiv").style.top =
        Math.round(
            (y + block.activity.blocksContainer.y) * block.activity.getStageScale() + canvasTop
        ) -
        150 +
        "px";

    docById("contextWheelDiv").style.display = "";

    const labels = [
        "imgsrc:header-icons/copy-button.svg",
        "imgsrc:header-icons/extract-button.svg",
        "imgsrc:header-icons/empty-trash-button.svg",
        "imgsrc:header-icons/cancel-button.svg"
    ];

    const topBlock = block.blocks.findTopBlock(blockBlock);
    if (
        ["customsample", "temperament1", "definemode", "show", "turtleshell", "action"].includes(
            block.name
        )
    ) {
        labels.push("imgsrc:header-icons/save-blocks-button.svg");
    }

    const message = block.blocks.blockList[block.blocks.activeBlock].protoblock.helpString;

    let helpButton;
    if (message) {
        labels.push("imgsrc:header-icons/help-button.svg");
        helpButton = labels.length - 1;
    } else {
        helpButton = null;
    }

    const wheel = new wheelnav("contextWheelDiv", null, 250, 250);
    wheel.colors = platformColor.wheelcolors;
    wheel.slicePathFunction = slicePath().DonutSlice;
    wheel.slicePathCustom = slicePath().DonutSliceCustomization();
    wheel.slicePathCustom.minRadiusPercent = 0.2;
    wheel.slicePathCustom.maxRadiusPercent = 0.6;
    wheel.sliceSelectedPathCustom = wheel.slicePathCustom;
    wheel.sliceInitPathCustom = wheel.slicePathCustom;
    wheel.clickModeRotate = false;
    wheel.initWheel(labels);
    wheel.createWheel();

    wheel.navItems[0].setTooltip(_("Duplicate"));
    wheel.navItems[1].setTooltip(_("Extract"));
    wheel.navItems[2].setTooltip(_("Move to trash"));
    wheel.navItems[3].setTooltip(_("Close"));
    const saveStackIndex = labels.indexOf("imgsrc:header-icons/save-blocks-button.svg");

    if (saveStackIndex !== -1) {
        wheel.navItems[saveStackIndex].setTooltip(_("Save stack"));
    }

    if (helpButton !== null) {
        wheel.navItems[helpButton].setTooltip(_("Help"));
    }

    wheel.navItems[0].selected = false;

    const stackPasting = function () {
        that.blocks.activeBlock = blockBlock;
        that.blocks.prepareStackForCopy();
        that.blocks.pasteDx = pasteDx;
        that.blocks.pasteDy = pasteDy;
        that.blocks.pasteStack();
        pasteDx += 21;
        pasteDy += 21;

        that.activity.helpfulWheelItems.forEach(ele => {
            if (ele.label === "Paste previous stack") {
                ele.display = true;
                ele.fn = stackPasting.bind(that);
            }
        });
    };

    wheel.navItems[0].navigateFunction = () => {
        if ("customsample" === block.blocks.blockList[topBlock].name) {
            that.activity.errorMsg(
                _(
                    "In order to copy a sample, you must reload the widget, import the sample again, and export it."
                )
            );
        } else {
            stackPasting();
        }
    };

    wheel.navItems[1].navigateFunction = () => {
        that.blocks.activeBlock = blockBlock;
        that.blocks.extract();
        docById("contextWheelDiv").style.display = "none";
    };

    wheel.navItems[2].navigateFunction = () => {
        that.blocks.activeBlock = blockBlock;
        that.blocks.extract();
        that.blocks.sendStackToTrash(that.blocks.blockList[blockBlock]);
        docById("contextWheelDiv").style.display = "none";
        // prompting a notification on deleting any block
        that.activity.textMsg(
            _("You can restore deleted blocks from the trash with the Restore From Trash button."),
            3000
        );
    };

    wheel.navItems[3].navigateFunction = () => {
        docById("contextWheelDiv").style.display = "none";
    };

    // Use a named handler stored globally so we can remove the previous one
    // before adding a new one, preventing accumulation of click listeners.
    if (window._contextWheelClickHandler) {
        document.body.removeEventListener("click", window._contextWheelClickHandler);
    }

    window._contextWheelClickHandler = event => {
        const wheelElement = document.getElementById("contextWheelDiv");
        const displayStyle = window.getComputedStyle(wheelElement).display;
        if (displayStyle === "block") {
            wheelElement.style.display = "none";
            document.body.removeEventListener("click", window._contextWheelClickHandler);
        }
    };

    document.body.addEventListener("click", window._contextWheelClickHandler);

    if (saveStackIndex !== -1) {
        wheel.navItems[saveStackIndex].navigateFunction = () => {
            that.blocks.activeBlock = blockBlock;
            that.blocks.prepareStackForCopy();
            that.blocks.saveStack();
        };
    }

    if (helpButton !== null) {
        wheel.navItems[helpButton].navigateFunction = () => {
            that.blocks.activeBlock = blockBlock;
            if (typeof HelpWidget === "undefined") {
                if (typeof require !== "undefined") {
                    require(["widgets/help"], function () {
                        new HelpWidget(that, true);
                    });
                }
            } else {
                new HelpWidget(that, true);
            }
            docById("contextWheelDiv").style.display = "none";
        };
    }

    setTimeout(() => {
        that.blocks.stageClick = false;
    }, 500);
};

// All browser execution goes through RequireJS (AMD). The module.exports branch
// is present solely for Jest/Node test environments and is never exercised at
// runtime in the browser.
if (typeof define === "function" && define.amd) {
    define(function () {
        window.piemenuBlockContext = piemenuBlockContext;
        return { piemenuBlockContext };
    });
} else if (typeof module !== "undefined" && module.exports) {
    // Jest / Node environment
    module.exports = { piemenuBlockContext };
}
