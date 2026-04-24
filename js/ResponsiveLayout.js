// Copyright (c) 2026 Music Blocks contributors
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
   exported ResponsiveLayout
*/

/**
 * Owns block home/reposition layout behavior during resize and go-home actions.
 */
class ResponsiveLayout {
    /**
     * @param {Activity} activity - The owning Activity instance.
     * @param {Object} options - Layout dependencies and constants.
     * @param {number} options.responsiveBreakpointTablet - Tablet breakpoint.
     * @param {number} options.responsiveBreakpointMobile - Mobile breakpoint.
     * @param {number} options.standardBlockHeight - Default block height.
     * @param {Function} options.changeImageFn - Button image updater.
     * @param {string} options.goHomeButton - Active home button SVG.
     * @param {string} options.goHomeFadedButton - Inactive home button SVG.
     * @param {Function} options.hideDomLabelFn - Shared DOM label hider.
     */
    constructor(activity, options) {
        this.activity = activity;
        this.responsiveBreakpointTablet = options.responsiveBreakpointTablet;
        this.responsiveBreakpointMobile = options.responsiveBreakpointMobile;
        this.standardBlockHeight = options.standardBlockHeight;
        this.changeImage = options.changeImageFn;
        this.goHomeButton = options.goHomeButton;
        this.goHomeFadedButton = options.goHomeFadedButton;
        this.hideDomLabel = options.hideDomLabelFn;
    }

    /**
     * Ensures blocks stay within canvas boundaries when the window resizes.
     */
    repositionBlocks() {
        const activity = this.activity;
        const canvasWidth = window.innerWidth;
        const processedBlocks = new Set();
        const dragGroups = [];

        Object.values(activity.blocks.blockList).forEach(block => {
            if (!processedBlocks.has(block.id)) {
                activity.blocks.findDragGroup(block.id);

                if (activity.blocks.dragGroup.length > 0) {
                    dragGroups.push([...activity.blocks.dragGroup]);
                    activity.blocks.dragGroup.forEach(id => processedBlocks.add(id));
                }
            }
        });

        dragGroups.forEach(group => {
            const referenceBlock = activity.blocks.blockList[group[0]];

            if (!referenceBlock.initialPosition) {
                referenceBlock.initialPosition = {
                    x: referenceBlock.container.x,
                    y: referenceBlock.container.y
                };
            }

            if (
                canvasWidth < this.responsiveBreakpointTablet &&
                !referenceBlock.beforeMobilePosition
            ) {
                referenceBlock.beforeMobilePosition = {
                    x: referenceBlock.container.x,
                    y: referenceBlock.container.y
                };
            }

            if (
                canvasWidth >= this.responsiveBreakpointTablet &&
                referenceBlock.beforeMobilePosition
            ) {
                const dx = referenceBlock.beforeMobilePosition.x - referenceBlock.container.x;
                const dy = referenceBlock.beforeMobilePosition.y - referenceBlock.container.y;
                group.forEach(blockId => {
                    const block = activity.blocks.blockList[blockId];
                    block.container.x += dx;
                    block.container.y += dy;
                });
                referenceBlock.beforeMobilePosition = null;
            }

            if (
                canvasWidth < this.responsiveBreakpointMobile &&
                !referenceBlock.before600pxPosition
            ) {
                referenceBlock.before600pxPosition = {
                    x: referenceBlock.container.x,
                    y: referenceBlock.container.y
                };
            }

            if (
                canvasWidth >= this.responsiveBreakpointMobile &&
                referenceBlock.before600pxPosition
            ) {
                const dx = referenceBlock.before600pxPosition.x - referenceBlock.container.x;
                const dy = referenceBlock.before600pxPosition.y - referenceBlock.container.y;

                group.forEach(blockId => {
                    const block = activity.blocks.blockList[blockId];
                    block.container.x += dx;
                    block.container.y += dy;
                });
                referenceBlock.before600pxPosition = null;
            }

            const rightmostX = Math.max(
                ...group.map(
                    id =>
                        activity.blocks.blockList[id].container.x +
                        activity.blocks.blockList[id].width
                )
            );

            if (rightmostX > canvasWidth) {
                const shiftX = Math.max(10, canvasWidth - rightmostX - 10);

                group.forEach(blockId => {
                    activity.blocks.blockList[blockId].container.x += shiftX;
                });
            }

            const leftmostX = Math.min(
                ...group.map(id => activity.blocks.blockList[id].container.x)
            );
            if (leftmostX < 0) {
                const shiftX = 100 - leftmostX;

                group.forEach(blockId => {
                    activity.blocks.blockList[blockId].container.x += shiftX;
                });
            }
        });

        activity._findBlocks();
    }

    /**
     * Finds and organizes blocks within the workspace.
     */
    findBlocks() {
        const activity = this.activity;

        if (!activity.blocks.visible) {
            activity._changeBlockVisibility();
        }

        activity.blocks.activeBlock = null;
        this.hideDomLabel();

        activity.blocks.showBlocks();
        activity.blocksContainer.x = 0;
        activity.blocksContainer.y = 0;

        if (activity._isFirstHomeClick) {
            let toppos;
            if (activity.auxToolbar.style.display === "block") {
                toppos = 90 + activity.toolbarHeight;
            } else {
                toppos = 90;
            }
            const leftpos = Math.floor(activity.canvas.width / 4);

            activity.palettes.updatePalettes();
            let x = Math.floor(leftpos * activity.turtleBlocksScale);
            let y = Math.floor(toppos * activity.turtleBlocksScale);
            let even = true;

            for (const blk in activity.blocks.blockList) {
                if (!activity.blocks.blockList[blk].trash) {
                    const myBlock = activity.blocks.blockList[blk];
                    if (myBlock.name !== "start") {
                        continue;
                    }
                    if (myBlock.connections[0] === null) {
                        const dx = x - myBlock.container.x;
                        const dy = y - myBlock.container.y;
                        activity.blocks.moveBlockRelative(blk, dx, dy);
                        activity.blocks.findDragGroup(blk);

                        if (activity.blocks.dragGroup.length > 0) {
                            for (let b = 0; b < activity.blocks.dragGroup.length; b++) {
                                const bblk = activity.blocks.dragGroup[b];
                                if (b !== 0) {
                                    activity.blocks.moveBlockRelative(bblk, dx, dy);
                                }
                            }
                        }

                        x += Math.floor(150 * activity.turtleBlocksScale);
                        if (x > (activity.canvas.width * 7) / 8 / activity.turtleBlocksScale) {
                            even = !even;
                            if (even) {
                                x = Math.floor(leftpos);
                            } else {
                                x = Math.floor(leftpos + this.standardBlockHeight);
                            }
                            y += this.standardBlockHeight;
                        }
                    }
                }
            }

            for (const blk in activity.blocks.blockList) {
                if (!activity.blocks.blockList[blk].trash) {
                    const myBlock = activity.blocks.blockList[blk];
                    if (myBlock.name === "start") {
                        continue;
                    }
                    if (myBlock.connections[0] === null) {
                        const dx = x - myBlock.container.x;
                        const dy = y - myBlock.container.y;
                        activity.blocks.moveBlockRelative(blk, dx, dy);
                        activity.blocks.findDragGroup(blk);

                        if (activity.blocks.dragGroup.length > 0) {
                            for (let b = 0; b < activity.blocks.dragGroup.length; b++) {
                                const bblk = activity.blocks.dragGroup[b];
                                if (b !== 0) {
                                    activity.blocks.moveBlockRelative(bblk, dx, dy);
                                }
                            }
                        }

                        x += Math.floor(150 * activity.turtleBlocksScale);
                        if (x > (activity.canvas.width * 7) / 8 / activity.turtleBlocksScale) {
                            even = !even;
                            if (even) {
                                x = Math.floor(leftpos);
                            } else {
                                x = Math.floor(leftpos + this.standardBlockHeight);
                            }
                            y += this.standardBlockHeight;
                        }
                    }
                }
            }
        } else {
            let toppos;
            if (activity.auxToolbar.style.display === "block") {
                toppos = 90 + activity.toolbarHeight;
            } else {
                toppos = 90;
            }

            const screenWidth = window.innerWidth;
            const minColumnWidth = 320;
            const numColumns = screenWidth <= 320 ? 1 : Math.floor(screenWidth / minColumnWidth);
            const baseColumnSpacing = screenWidth / numColumns;
            const columnSpacing = baseColumnSpacing * 1.2;
            const initialY = Math.floor(toppos * activity.turtleBlocksScale);
            const baseVerticalSpacing = Math.floor(20 * activity.turtleBlocksScale);
            const verticalSpacing = baseVerticalSpacing * 1.2;
            const columnXPositions = Array.from({ length: numColumns }, (_, i) =>
                Math.floor(i * columnSpacing + columnSpacing / 2)
            );
            const columnYPositions = Array(numColumns).fill(initialY);

            for (const blk in activity.blocks.blockList) {
                if (!activity.blocks.blockList[blk].trash) {
                    const myBlock = activity.blocks.blockList[blk];
                    if (myBlock.connections[0] === null) {
                        let minYIndex = 0;
                        for (let i = 1; i < numColumns; i++) {
                            if (columnYPositions[i] < columnYPositions[minYIndex]) {
                                minYIndex = i;
                            }
                        }

                        const dx = columnXPositions[minYIndex] - myBlock.container.x;
                        const dy = columnYPositions[minYIndex] - myBlock.container.y;
                        activity.blocks.moveBlockRelative(blk, dx, dy);
                        activity.blocks.findDragGroup(blk);

                        if (activity.blocks.dragGroup.length > 0) {
                            for (let b = 0; b < activity.blocks.dragGroup.length; b++) {
                                const bblk = activity.blocks.dragGroup[b];
                                if (b !== 0) {
                                    activity.blocks.moveBlockRelative(bblk, dx, dy);
                                }
                            }
                        }
                        columnYPositions[minYIndex] += myBlock.height + verticalSpacing;
                    }
                }
            }
        }

        this.setHomeContainers(false);
        activity.boundary.hide();

        for (let turtle = 0; turtle < activity.turtles.getTurtleCount(); turtle++) {
            const requiredTurtle = activity.turtles.getTurtle(turtle);
            const savedPenState = requiredTurtle.painter.penState;
            requiredTurtle.painter.penState = false;
            requiredTurtle.painter.doSetXY(0, 0);
            requiredTurtle.painter.doSetHeading(0);
            requiredTurtle.painter.penState = savedPenState;
        }

        activity._isFirstHomeClick = !activity._isFirstHomeClick;
    }

    /**
     * Toggles the visibility of the home button container.
     * @param {boolean} homeState - Whether the home action is currently available.
     */
    setHomeContainers(homeState) {
        const activity = this.activity;

        if (activity.homeButtonContainer === null || activity.homeButtonContainer === undefined) {
            return;
        }

        if (homeState) {
            this.changeImage(
                activity.homeButtonContainer.children[0],
                this.goHomeFadedButton,
                this.goHomeButton
            );
        } else {
            this.changeImage(
                activity.homeButtonContainer.children[0],
                this.goHomeButton,
                this.goHomeFadedButton
            );
        }
    }
}

if (typeof globalThis !== "undefined") {
    globalThis.ResponsiveLayout = ResponsiveLayout;
}

if (typeof define === "function" && define.amd) {
    define([], function () {
        return ResponsiveLayout;
    });
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = ResponsiveLayout;
}
