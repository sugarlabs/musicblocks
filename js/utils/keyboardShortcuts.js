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
   global

   _
 */

/*
   exported

   KeyboardShortcuts
 */

const KeyboardShortcuts = (() => {
    const NUDGE_DISTANCE = 10;
    const INPUT_TAGS = ["INPUT", "TEXTAREA", "SELECT"];

    const isEditableTarget = target => {
        if (!target) {
            return false;
        }

        if (target.tagName === "INPUT" || INPUT_TAGS.includes(target.tagName)) {
            return true;
        }

        return target.isContentEditable === true;
    };

    const getTargetBlock = activity => {
        if (!activity || !activity.blocks) {
            return null;
        }

        const blocks = activity.blocks;
        const blockIndex =
            blocks.activeBlock !== null && blocks.activeBlock !== undefined
                ? blocks.activeBlock
                : blocks.lastSelectedBlock;

        if (blockIndex === null || blockIndex === undefined) {
            return null;
        }

        const block = blocks.blockList && blocks.blockList[blockIndex];
        if (!block || block.trash) {
            return null;
        }

        return blockIndex;
    };

    const trackBlockSelection = blocks => {
        if (!blocks || blocks._keyboardShortcutsTrackingActiveBlock) {
            return;
        }

        let activeBlock = blocks.activeBlock;
        blocks.lastSelectedBlock = null;

        Object.defineProperty(blocks, "activeBlock", {
            configurable: true,
            get: () => activeBlock,
            set: blockIndex => {
                activeBlock = blockIndex;
                if (blockIndex !== null && blockIndex !== undefined) {
                    blocks.lastSelectedBlock = blockIndex;
                }
            }
        });

        blocks._keyboardShortcutsTrackingActiveBlock = true;
    };

    const finishBlockChange = (activity, blockIndex) => {
        const blocks = activity.blocks;
        if (typeof blocks.blockMoved === "function") {
            blocks.blockMoved(blockIndex);
        }

        if (typeof blocks.adjustDocks === "function") {
            blocks.adjustDocks(blockIndex, true);
        }

        activity.stageDirty = true;
    };

    const nudgeBlock = (activity, dx, dy) => {
        const blockIndex = getTargetBlock(activity);
        if (blockIndex === null) {
            return false;
        }

        activity.blocks.activeBlock = blockIndex;
        activity.blocks.moveStackRelative(blockIndex, dx, dy);
        finishBlockChange(activity, blockIndex);
        return true;
    };

    const deleteBlock = activity => {
        const blockIndex = getTargetBlock(activity);
        if (blockIndex === null) {
            return false;
        }

        const block = activity.blocks.blockList[blockIndex];
        activity.blocks.sendStackToTrash(block);
        activity.blocks.activeBlock = null;
        activity.stageDirty = true;
        return true;
    };

    const restoreLastDeletedBlock = activity => {
        const blocks = activity && activity.blocks;
        if (!blocks || !blocks.trashStacks || blocks.trashStacks.length === 0) {
            if (activity && typeof activity.textMsg === "function") {
                activity.textMsg(_("Trash can is empty."), 3000);
            }
            return false;
        }

        const blockIndex = blocks.trashStacks[blocks.trashStacks.length - 1];
        if (typeof activity._restoreTrashById === "function") {
            activity._restoreTrashById(blockIndex);
            return true;
        }

        return false;
    };

    const handleKeyDown = (event, activity) => {
        if (!event || isEditableTarget(event.target)) {
            return false;
        }

        const key = event.key;
        const lowerKey = typeof key === "string" ? key.toLowerCase() : "";
        let handled = false;

        if ((event.ctrlKey || event.metaKey) && lowerKey === "z") {
            handled = restoreLastDeletedBlock(activity);
        } else if (key === "Delete" || key === "Backspace") {
            handled = deleteBlock(activity);
        } else if (key === "ArrowUp") {
            handled = nudgeBlock(activity, 0, -NUDGE_DISTANCE);
        } else if (key === "ArrowDown") {
            handled = nudgeBlock(activity, 0, NUDGE_DISTANCE);
        } else if (key === "ArrowLeft") {
            handled = nudgeBlock(activity, -NUDGE_DISTANCE, 0);
        } else if (key === "ArrowRight") {
            handled = nudgeBlock(activity, NUDGE_DISTANCE, 0);
        }

        if (handled) {
            event.preventDefault();
            event.stopPropagation();
        }

        return handled;
    };

    return {
        trackBlockSelection,
        handleKeyDown
    };
})();

if (typeof window !== "undefined") {
    window.KeyboardShortcuts = KeyboardShortcuts;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = KeyboardShortcuts;
}
