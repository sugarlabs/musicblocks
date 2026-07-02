/**
 * MusicBlocks v3.6.2
 *
 * @author Soham Bhangale
 *
 * @copyright 2025 Soham Bhangale
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Keyboard Shortcuts for Music Blocks
 *
 * Initializes a global keydown listener for block operations.
 * Uses a persistent `lastSelectedBlock` to track the last block
 * the user hovered over or clicked — this is NOT cleared on mouseout,
 * so arrow keys and Delete work even after moving the mouse away.
 *
 * Shortcuts:
 *   ArrowUp/Down/Left/Right  — Move selected block by 10px
 *   Delete / Backspace       — Delete selected block (send to trash)
 *   Ctrl+Z                   — Undo (restore last deleted block)
 */
function initKeyboardShortcuts(activity) {
    // Tracks the last block the user interacted with.
    // Unlike activity.blocks.activeBlock (which resets on mouseout),
    // this persists so arrow keys work after the cursor leaves a block.
    let lastSelectedBlock = null;

    // Stack of deleted block positions so Ctrl+Z can restore to exact spot.
    // Each entry: { blockId: number, x: number, y: number }
    const deletionHistory = [];

    /**
     * Updates lastSelectedBlock whenever activeBlock changes.
     * We poll it on keydown, and also hook into the stage mouseover
     * once the stage is available.
     */
    function syncSelectedBlock() {
        if (
            activity.blocks &&
            activity.blocks.activeBlock !== null &&
            activity.blocks.activeBlock !== undefined
        ) {
            lastSelectedBlock = activity.blocks.activeBlock;
        }
    }

    // Poll for the stage being ready, then attach a stage-level
    // mouseover listener to catch block selections reliably.
    function hookStageListener() {
        if (activity.stage) {
            activity.stage.on("stagemousemove", syncSelectedBlock);
        } else {
            setTimeout(hookStageListener, 500);
        }
    }
    hookStageListener();

    window.addEventListener("keydown", e => {
        // Prevent conflicts with input fields (typing)
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
            return;
        }

        const ctrl = e.ctrlKey || e.metaKey;

        // --- Undo (Ctrl+Z): Restore last deleted block to its exact position ---
        if (ctrl && e.key.toLowerCase() === "z") {
            e.preventDefault();

            const blocks = activity.blocks;
            if (
                !blocks ||
                !blocks.trashStacks ||
                blocks.trashStacks.length === 0 ||
                deletionHistory.length === 0
            ) {
                return;
            }

            const lastDeletion = deletionHistory.pop();
            const blockId = lastDeletion.blockId;

            // Remove from trashStacks
            const trashIdx = blocks.trashStacks.indexOf(blockId);
            if (trashIdx !== -1) blocks.trashStacks.splice(trashIdx, 1);

            // Hide palettes (same as _restoreTrashById does)
            for (const name in activity.palettes.dict) {
                activity.palettes.dict[name].hideMenu(true);
            }
            blocks.activeBlock = null;

            // Restore every block in the drag group:
            // Mark as not-trash and make visible — but DO NOT move them at all.
            // sendStackToTrash() never changes container x/y, it just hides them.
            // So they are already at the correct position in the container.
            blocks.findDragGroup(blockId);
            for (let b = 0; b < blocks.dragGroup.length; b++) {
                const blk = blocks.dragGroup[b];
                blocks.blockList[blk].trash = false;
                blocks.blockList[blk].show();
            }

            // Now explicitly set the top block's container to the saved exact position.
            // (This ensures correctness even if something else moved it in the meantime.)
            const restoredBlock = blocks.blockList[blockId];
            if (restoredBlock && restoredBlock.container) {
                restoredBlock.container.x = lastDeletion.x;
                restoredBlock.container.y = lastDeletion.y;
            }

            // Handle special block types (same as _restoreTrashById)
            if (restoredBlock.name === "start" || restoredBlock.name === "drum") {
                const turtle = restoredBlock.value;
                if (turtle !== null && activity.turtles && activity.turtles.getTurtle) {
                    activity.turtles.getTurtle(turtle).inTrash = false;
                    activity.turtles.getTurtle(turtle).container.visible = true;
                }
            }

            // Raise to top of z-order
            blocks.raiseStackToTop(blockId);
            activity.refreshCanvas();
            activity.textMsg && activity.textMsg("Block restored to original position.", 3000);

            return;
        }

        // --- Redo (Ctrl+Y): No native redo in Music Blocks; reserved for future use ---
        if (ctrl && e.key.toLowerCase() === "y") {
            e.preventDefault();
            // Redo is not supported natively by Music Blocks' trash/restore system.
            // This shortcut is reserved for future implementation.
            return;
        }

        // Sync the selected block before checking
        syncSelectedBlock();

        // Resolve the currently active block (prefer live activeBlock, fallback to last selected)
        if (!activity.blocks) return;

        const activeId =
            activity.blocks.activeBlock !== null && activity.blocks.activeBlock !== undefined
                ? activity.blocks.activeBlock
                : lastSelectedBlock;

        if (activeId === null || activeId === undefined) return;

        const selectedBlock = activity.blocks.blockList[activeId];
        if (!selectedBlock) return;

        // --- Delete Selected Block ---
        if (e.key === "Delete" || e.key === "Backspace") {
            e.preventDefault();
            if (typeof activity.blocks.sendStackToTrash === "function") {
                // Save exact position BEFORE deleting so Ctrl+Z can restore it
                const savedX = selectedBlock.container
                    ? selectedBlock.container.x
                    : selectedBlock.x || 0;
                const savedY = selectedBlock.container
                    ? selectedBlock.container.y
                    : selectedBlock.y || 0;

                activity.blocks.sendStackToTrash(selectedBlock);

                // Record the deletion with saved position
                deletionHistory.push({
                    blockId: activeId,
                    x: savedX,
                    y: savedY
                });

                lastSelectedBlock = null;
                if (typeof activity.refreshCanvas === "function") {
                    activity.refreshCanvas();
                }
            } else if (typeof activity.blocks.deleteBlock === "function") {
                activity.blocks.deleteBlock(selectedBlock);
                lastSelectedBlock = null;
            } else if (typeof activity.blocks.removeBlock === "function") {
                activity.blocks.removeBlock(selectedBlock);
                lastSelectedBlock = null;
            }
            return;
        }

        // --- Move Block with Arrow Keys ---
        const step = 10;
        let moved = false;

        switch (e.key) {
            case "ArrowUp":
                if (selectedBlock.container) {
                    selectedBlock.container.y -= step;
                    moved = true;
                } else if (selectedBlock.y !== undefined) {
                    selectedBlock.y -= step;
                    moved = true;
                }
                break;
            case "ArrowDown":
                if (selectedBlock.container) {
                    selectedBlock.container.y += step;
                    moved = true;
                } else if (selectedBlock.y !== undefined) {
                    selectedBlock.y += step;
                    moved = true;
                }
                break;
            case "ArrowLeft":
                if (selectedBlock.container) {
                    selectedBlock.container.x -= step;
                    moved = true;
                } else if (selectedBlock.x !== undefined) {
                    selectedBlock.x -= step;
                    moved = true;
                }
                break;
            case "ArrowRight":
                if (selectedBlock.container) {
                    selectedBlock.container.x += step;
                    moved = true;
                } else if (selectedBlock.x !== undefined) {
                    selectedBlock.x += step;
                    moved = true;
                }
                break;
        }

        if (moved) {
            e.preventDefault(); // Prevent page scrolling

            // Update connected blocks' positions if applicable
            if (typeof selectedBlock.updatePosition === "function") {
                selectedBlock.updatePosition();
            }

            // Mark stage dirty so CreateJS re-renders
            if (activity.stageDirty !== undefined) {
                activity.stageDirty = true;
            }

            // Trigger canvas refresh
            if (typeof activity.refreshCanvas === "function") {
                activity.refreshCanvas();
            } else if (typeof activity.redraw === "function") {
                activity.redraw();
            }
        }
    });
}

if (typeof module !== "undefined" && module.exports) {
    module.exports.initKeyboardShortcuts = initKeyboardShortcuts;
}
if (typeof window !== "undefined") {
    window.initKeyboardShortcuts = initKeyboardShortcuts;
}
