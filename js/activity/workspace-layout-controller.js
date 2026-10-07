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

/* global hideDOMLabel, changeImage, GOHOMEBUTTON, GOHOMEFADEDBUTTON, STANDARDBLOCKHEIGHT,
   RESPONSIVE_BREAKPOINT_TABLET, RESPONSIVE_BREAKPOINT_MOBILE */

/* exported setupWorkspaceLayoutController, WorkspaceLayoutController */

class WorkspaceLayoutController {
    /**
     * @param {object} activity - The Activity instance.
     */
    constructor(activity) {
        this.activity = activity;

        // Flag to track number of clicks and for alternate mode switching while clicking
        this._isFirstHomeClick = true;

        this._previousCanvasWidth = undefined;
        this._resizeSession = null;
    }

    /**
     * Recenters blocks by updating their position on the screen.
     *
     * This function triggers the `_findBlocks` method, which recalculates
     * the positions of blocks. If the 'helpfulWheelDiv' element is visible,
     * it is hidden, and the `__tick` method is called to update the activity state.
     */
    findBlocks() {
        const activity = this.activity;
        this._findBlocks();
        if (activity.closeHelpfulWheel()) {
            activity.__tick();
        }
    }

    /**
     * Ensures blocks stay within canvas boundaries when resized.
     * Ensures that music blocks are responsive to horizontal resizing.
     * Ensures that overall integrity of blocks isn't hampered with.
     */
    repositionBlocks() {
        const activity = this.activity;
        const canvasWidth = window.innerWidth;

        const isNarrowing =
            this._previousCanvasWidth !== undefined && canvasWidth < this._previousCanvasWidth;

        const processedBlocks = new Set();

        //Array for storing individual dragGroups (the chunks of code linked together which are not connected)
        const dragGroups = [];

        // Identifying individual dragGroups.
        // Process root blocks first so connected stacks are handled as one group.
        const blockEntries = Object.entries(activity.blocks.blockList);

        const processDragGroup = key => {
            const index = Number.isNaN(Number(key)) ? key : Number(key);

            if (processedBlocks.has(index)) {
                return;
            }

            activity.blocks.findDragGroup(index);

            if (activity.blocks.dragGroup.length > 0) {
                dragGroups.push([...activity.blocks.dragGroup]);
                activity.blocks.dragGroup.forEach(id => processedBlocks.add(id));
            }
        };

        // First process root blocks so their complete descendant groups are captured.
        blockEntries.forEach(([key, block]) => {
            if (!block || block.connections?.[0] !== null) {
                return;
            }

            processDragGroup(key);
        });

        // Process anything left over as a fallback for standalone/orphaned blocks.
        blockEntries.forEach(([key, block]) => {
            if (!block) {
                return;
            }

            processDragGroup(key);
        });
        // Capture the workspace layout once when a narrowing resize begins.
        // These positions remain unchanged until the window returns to its
        // original width.
        if (isNarrowing && !this._resizeSession) {
            const positions = new Map();

            dragGroups.forEach(group => {
                const left = Math.min(
                    ...group.map(id => activity.blocks.blockList[id].container.x)
                );

                positions.set(group[0], left);
            });

            this._resizeSession = {
                startWidth: this._previousCanvasWidth,
                positions
            };
        }

        // Repositioning of dragGroups according to horizontal resizing
        dragGroups.forEach(group => {
            const referenceBlock = activity.blocks.blockList[group[0]];

            // Store initial positions
            if (!referenceBlock.initialPosition) {
                referenceBlock.initialPosition = {
                    x: referenceBlock.container.x,
                    y: referenceBlock.container.y
                };
            }

            if (
                canvasWidth < RESPONSIVE_BREAKPOINT_TABLET &&
                !referenceBlock.beforeMobilePosition
            ) {
                referenceBlock.beforeMobilePosition = {
                    x: referenceBlock.container.x,
                    y: referenceBlock.container.y
                };
            }

            if (
                canvasWidth >= RESPONSIVE_BREAKPOINT_TABLET &&
                referenceBlock.beforeMobilePosition
            ) {
                const dx = referenceBlock.beforeMobilePosition.x - referenceBlock.container.x;

                group.forEach(blockId => {
                    const block = activity.blocks.blockList[blockId];
                    block.container.x += dx;
                });
                referenceBlock.beforeMobilePosition = null; // Clear stored position
                //this prevents old groups from affecting new calculations.
            }

            if (canvasWidth < RESPONSIVE_BREAKPOINT_MOBILE && !referenceBlock.before600pxPosition) {
                referenceBlock.before600pxPosition = {
                    x: referenceBlock.container.x,
                    y: referenceBlock.container.y
                };
            }

            if (canvasWidth >= RESPONSIVE_BREAKPOINT_MOBILE && referenceBlock.before600pxPosition) {
                const dx = referenceBlock.before600pxPosition.x - referenceBlock.container.x;

                group.forEach(blockId => {
                    const block = activity.blocks.blockList[blockId];
                    block.container.x += dx;
                });
                referenceBlock.before600pxPosition = null;
            }

            // Keep groups inside the right boundary and restore them toward
            // their pre-resize positions whenever space becomes available.
            let currentLeftmostX = Math.min(
                ...group.map(id => activity.blocks.blockList[id].container.x)
            );

            let currentRightmostX = Math.max(
                ...group.map(
                    id =>
                        activity.blocks.blockList[id].container.x +
                        activity.blocks.blockList[id].width
                )
            );

            const groupWidth = currentRightmostX - currentLeftmostX;
            const savedLeft = this._resizeSession?.positions.get(group[0]);

            if (!isNarrowing && savedLeft !== undefined) {
                const maxAllowedLeft = canvasWidth - groupWidth - 10;
                const targetLeft = Math.min(savedLeft, maxAllowedLeft);

                if (targetLeft > currentLeftmostX) {
                    const shiftX = targetLeft - currentLeftmostX;

                    group.forEach(blockId => {
                        activity.blocks.blockList[blockId].container.x += shiftX;
                    });

                    currentLeftmostX += shiftX;
                    currentRightmostX += shiftX;
                }
            }

            if (!isNarrowing && currentRightmostX > canvasWidth) {
                const shiftX = canvasWidth - currentRightmostX - 10;

                group.forEach(blockId => {
                    activity.blocks.blockList[blockId].container.x += shiftX;
                });
            }

            // Ensures that blocks do not go hide behind the search for blocks div
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
        if (isNarrowing) {
            // Compress horizontally aligned groups into the available gaps
            // before allowing them to overlap.
            const GROUP_GAP = 20;
            const LEFT_PADDING = 180;

            const groupLayouts = dragGroups
                .map(group => {
                    const left = Math.min(
                        ...group.map(id => activity.blocks.blockList[id].container.x)
                    );

                    const right = Math.max(
                        ...group.map(
                            id =>
                                activity.blocks.blockList[id].container.x +
                                activity.blocks.blockList[id].width
                        )
                    );

                    const referenceBlock = activity.blocks.blockList[group[0]];

                    return {
                        group,
                        left,
                        right,
                        anchorLeft: referenceBlock.container.x,
                        anchorRight: referenceBlock.container.x + referenceBlock.width,
                        anchorY: referenceBlock.container.y
                    };
                })

                .sort((a, b) => {
                    const aOriginal = this._resizeSession?.positions.get(a.group[0]) ?? a.left;

                    const bOriginal = this._resizeSession?.positions.get(b.group[0]) ?? b.left;

                    return aOriginal - bOriginal;
                });

            const moveGroup = (layout, amount) => {
                if (amount === 0) {
                    return;
                }

                layout.group.forEach(blockId => {
                    activity.blocks.blockList[blockId].container.x += amount;
                });

                layout.left += amount;
                layout.right += amount;
                layout.anchorLeft += amount;
                layout.anchorRight += amount;
            };

            const verticallyOverlaps = (a, b) =>
                Math.abs(a.anchorY - b.anchorY) <= STANDARDBLOCKHEIGHT * 4;

            const findPreviousOverlappingIndex = index => {
                const current = groupLayouts[index];

                for (let i = index - 1; i >= 0; i--) {
                    if (verticallyOverlaps(current, groupLayouts[i])) {
                        return i;
                    }
                }

                return -1;
            };

            // Compact horizontal groups first, then stack them from right to left.
            const RIGHT_PADDING = 10;

            const moveChainSuffix = (chain, startIndex, amount) => {
                if (amount === 0) {
                    return;
                }

                for (let i = startIndex; i < chain.length; i++) {
                    moveGroup(groupLayouts[chain[i]], amount);
                }
            };

            const processedLayoutIndexes = new Set();

            for (let endIndex = groupLayouts.length - 1; endIndex >= 0; endIndex--) {
                if (processedLayoutIndexes.has(endIndex)) {
                    continue;
                }

                const chain = [endIndex];
                processedLayoutIndexes.add(endIndex);

                let cursor = endIndex;

                while (true) {
                    const previousIndex = findPreviousOverlappingIndex(cursor);

                    if (previousIndex < 0 || processedLayoutIndexes.has(previousIndex)) {
                        break;
                    }

                    chain.unshift(previousIndex);
                    processedLayoutIndexes.add(previousIndex);
                    cursor = previousIndex;
                }

                const rightmostLayout = groupLayouts[chain[chain.length - 1]];
                const rightLimit = canvasWidth - RIGHT_PADDING;

                let remainingPressure = Math.max(0, rightmostLayout.right - rightLimit);

                if (remainingPressure <= 0) {
                    continue;
                }

                // Phase 1: consume all available gaps without overlap.
                let clusterStart = chain.length - 1;

                while (remainingPressure > 0) {
                    if (clusterStart === 0) {
                        const leftmostLayout = groupLayouts[chain[0]];

                        const availableLeftSpace = Math.max(0, leftmostLayout.left - LEFT_PADDING);

                        const movement = Math.min(remainingPressure, availableLeftSpace);

                        moveChainSuffix(chain, 0, -movement);
                        remainingPressure -= movement;
                        break;
                    }

                    const currentLayout = groupLayouts[chain[clusterStart]];
                    const previousLayout = groupLayouts[chain[clusterStart - 1]];

                    const availableGap = Math.max(
                        0,
                        currentLayout.left - previousLayout.right - GROUP_GAP
                    );

                    if (availableGap > 0) {
                        const movement = Math.min(remainingPressure, availableGap);

                        moveChainSuffix(chain, clusterStart, -movement);
                        remainingPressure -= movement;

                        if (remainingPressure <= 0) {
                            break;
                        }
                    }

                    clusterStart--;
                }

                // Phase 2: only after all free space is exhausted, stack right to left.
                let stackStart = chain.length - 1;

                while (remainingPressure > 0 && stackStart > 0) {
                    const currentLayout = groupLayouts[chain[stackStart]];
                    const previousLayout = groupLayouts[chain[stackStart - 1]];

                    const availableOverlap = Math.max(0, currentLayout.left - previousLayout.left);

                    if (availableOverlap <= 0) {
                        stackStart--;
                        continue;
                    }

                    const movement = Math.min(remainingPressure, availableOverlap);

                    moveChainSuffix(chain, stackStart, -movement);
                    remainingPressure -= movement;

                    if (movement >= availableOverlap) {
                        stackStart--;
                    } else {
                        break;
                    }
                }
            }
        }

        const LEFT_BOUNDARY = 100;

        dragGroups.forEach(group => {
            const leftmostX = Math.min(
                ...group.map(id => activity.blocks.blockList[id].container.x)
            );

            if (leftmostX < LEFT_BOUNDARY) {
                const shiftX = LEFT_BOUNDARY - leftmostX;

                group.forEach(blockId => {
                    activity.blocks.blockList[blockId].container.x += shiftX;
                });
            }
        });

        // Once the window reaches its original width again, restore every
        // group exactly to its pre-resize horizontal position.
        if (this._resizeSession && canvasWidth >= this._resizeSession.startWidth) {
            dragGroups.forEach(group => {
                const savedLeft = this._resizeSession.positions.get(group[0]);

                if (savedLeft === undefined) {
                    return;
                }

                const currentLeft = Math.min(
                    ...group.map(id => activity.blocks.blockList[id].container.x)
                );

                const shiftX = savedLeft - currentLeft;

                group.forEach(blockId => {
                    activity.blocks.blockList[blockId].container.x += shiftX;
                });
            });

            this._resizeSession = null;
        }

        this._previousCanvasWidth = canvasWidth;

        activity.blocks._updateViewportCulling();
        activity.refreshCanvas();
    }

    /**
     * Window resize handler: keeps blocks responsive to horizontal resizing.
     */
    _handleRepositionBlocksOnResize() {
        this.repositionBlocks();
    }

    /**
     * Finds and organizes blocks within the workspace.
     * Blocks are positioned based on their connections and availability within the canvas area.
     * This method is part of the internal mechanism to ensure that blocks are displayed correctly and efficiently.
     */
    _findBlocks() {
        const activity = this.activity;

        // Ensure visibility of blocks
        if (!activity.blocks.visible) {
            activity._changeBlockVisibility();
        }

        // Reset active block and hide DOM label
        activity.blocks.activeBlock = null;
        hideDOMLabel();

        // Show blocks and set initial container position
        activity.blocks.showBlocks();
        activity.blocksContainer.x = 0;
        activity.blocksContainer.y = 0;

        if (this._isFirstHomeClick) {
            // First clicked logic (arrange blocks in rows may have overlapping of blocks)
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

            // Defer checkBounds during bulk block moves to avoid O(N²)
            // overhead: each moveBlockRelative call triggers checkBounds()
            // which scans all blocks, so N moves × N blocks = O(N²).
            activity.blocks._beginDeferCheckBounds();

            // Position "start" blocks first
            for (const blk in activity.blocks.blockList) {
                if (activity.blocks.blockList[blk] && !activity.blocks.blockList[blk].trash) {
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
                                x = Math.floor(leftpos + STANDARDBLOCKHEIGHT);
                            }
                            y += STANDARDBLOCKHEIGHT;
                        }
                    }
                }
            }

            // Position other blocks
            for (const blk in activity.blocks.blockList) {
                if (activity.blocks.blockList[blk] && !activity.blocks.blockList[blk].trash) {
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
                                x = Math.floor(leftpos + STANDARDBLOCKHEIGHT);
                            }
                            y += STANDARDBLOCKHEIGHT;
                        }
                    }
                }
            }

            activity.blocks._endDeferCheckBounds();
        } else {
            // Second click logic (arrange blocks in columns this avoid overlapping of blocks)
            let toppos;
            if (activity.auxToolbar.style.display === "block") {
                toppos = 90 + activity.toolbarHeight;
            } else {
                toppos = 90;
            }

            /**
             * Device type resolution ranges and typical orientation:
             * Desktop: 1024x768 to 5120x2880 (Landscape primary, Portrait supported)
             * Tablet: 768x1024 to 2560x1600 (Portrait common, Landscape supported)
             * Mobile: 320x480 to 1440x3200 (Portrait primary, Landscape supported)
             * Minimum column width is set to 400px to ensure readability and usability.
             */

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

            // Defer checkBounds during bulk block moves (see first-click path).
            activity.blocks._beginDeferCheckBounds();

            for (const blk in activity.blocks.blockList) {
                if (activity.blocks.blockList[blk] && !activity.blocks.blockList[blk].trash) {
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

            activity.blocks._endDeferCheckBounds();
        }

        // Reset go-home button
        this.setHomeContainers(false);
        activity.boundary.hide();

        // Return mice to the center of the screen.
        // Reset turtles' positions to center of the screen
        for (let turtle = 0; turtle < activity.turtles.getTurtleCount(); turtle++) {
            const requiredTurtle = activity.turtles.getTurtle(turtle);
            const savedPenState = requiredTurtle.painter.penState;
            requiredTurtle.painter.penState = false;
            requiredTurtle.painter.doSetXY(0, 0);
            requiredTurtle.painter.doSetHeading(0);
            requiredTurtle.painter.penState = savedPenState;
        }
        // Alternate mode switching on clicking Home button
        this._isFirstHomeClick = !this._isFirstHomeClick;
    }

    /**
     * Toggles the visibility of the home button container.
     *
     * Depending on the state provided, this method will either hide or show the home button container.
     * If the home button container is not initialized, the function will exit early.
     *
     * @param {boolean} homeState - If true, shows the container; if false, hides it.
     */
    setHomeContainers(homeState) {
        const activity = this.activity;
        if (activity.homeButtonContainer === null || activity.homeButtonContainer === undefined) {
            return;
        }

        if (homeState) {
            changeImage(activity.homeButtonContainer.children[0], GOHOMEFADEDBUTTON, GOHOMEBUTTON);
        } else {
            changeImage(activity.homeButtonContainer.children[0], GOHOMEBUTTON, GOHOMEFADEDBUTTON);
        }
    }
}

/**
 * Creates a WorkspaceLayoutController and attaches it, plus delegation stubs,
 * to the activity so external callers continue to work unchanged.
 * @param {object} activity - The Activity instance.
 */
const setupWorkspaceLayoutController = activity => {
    const controller = new WorkspaceLayoutController(activity);
    activity.workspaceLayoutController = controller;

    activity.findBlocks = controller.findBlocks.bind(controller);
    activity.setHomeContainers = controller.setHomeContainers.bind(controller);
    activity.repositionBlocks = controller.repositionBlocks.bind(controller);
    activity._handleRepositionBlocksOnResize =
        controller._handleRepositionBlocksOnResize.bind(controller);

    return controller;
};

// All browser execution goes through RequireJS (AMD). The module.exports branch
// is present solely for Jest/Node test environments and is never exercised at
// runtime in the browser.
if (typeof define === "function" && define.amd) {
    define(function () {
        window.setupWorkspaceLayoutController = setupWorkspaceLayoutController;
        return { setupWorkspaceLayoutController, WorkspaceLayoutController };
    });
} else if (typeof module !== "undefined" && module.exports) {
    // Jest / Node environment
    module.exports = { setupWorkspaceLayoutController, WorkspaceLayoutController };
}
