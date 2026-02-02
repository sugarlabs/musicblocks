// Copyright (c) 2024 Music Blocks Contributors
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

/* exported UndoRedoManager */

/**
 * Maximum number of undo/redo operations to store in memory
 */
const MAX_UNDO_REDO_STACK_SIZE = 50;

/**
 * UndoRedoManager manages the undo/redo functionality for Music Blocks
 * It tracks user actions and allows undoing and redoing them
 */
class UndoRedoManager {
    constructor(activity) {
        this.activity = activity;
        this.undoStack = [];
        this.redoStack = [];
        this.isPerformingUndoRedo = false;
    }

    /**
     * Saves the current state for undo functionality
     * @param {string} action - Description of the action being performed
     * @param {Object} data - Data needed to undo/redo the action
     */
    saveState(action, data) {
        if (this.isPerformingUndoRedo) {
            return; // Don't save state during undo/redo operations
        }

        const state = {
            action: action,
            data: data,
            timestamp: Date.now()
        };

        this.undoStack.push(state);
        this.redoStack = []; // Clear redo stack when new action is performed

        // Limit stack size
        if (this.undoStack.length > MAX_UNDO_REDO_STACK_SIZE) {
            this.undoStack.shift();
        }

        this.updateUI();
    }

    /**
     * Performs undo operation
     */
    undo() {
        if (this.undoStack.length === 0) {
            return false;
        }

        const state = this.undoStack.pop();
        this.redoStack.push(state);

        this.isPerformingUndoRedo = true;

        try {
            this.performUndo(state);
            this.updateUI();
            return true;
        } catch (error) {
            console.error("Undo failed:", error);
            // Restore state if undo failed
            this.undoStack.push(state);
            this.redoStack.pop();
            return false;
        } finally {
            this.isPerformingUndoRedo = false;
        }
    }

    /**
     * Performs redo operation
     */
    redo() {
        if (this.redoStack.length === 0) {
            return false;
        }

        const state = this.redoStack.pop();
        this.undoStack.push(state);

        this.isPerformingUndoRedo = true;

        try {
            this.performRedo(state);
            this.updateUI();
            return true;
        } catch (error) {
            console.error("Redo failed:", error);
            // Restore state if redo failed
            this.redoStack.push(state);
            this.undoStack.pop();
            return false;
        } finally {
            this.isPerformingUndoRedo = false;
        }
    }

    /**
     * Performs the actual undo operation based on action type
     * @param {Object} state - The state to undo
     */
    performUndo(state) {
        switch (state.action) {
            case 'block_added':
                this.undoBlockAdded(state.data);
                break;
            case 'block_deleted':
                this.undoBlockDeleted(state.data);
                break;
            case 'block_moved':
                this.undoBlockMoved(state.data);
                break;
            case 'block_connected':
                this.undoBlockConnected(state.data);
                break;
            case 'block_disconnected':
                this.undoBlockDisconnected(state.data);
                break;
            case 'blocks_pasted':
                this.undoBlocksPasted(state.data);
                break;
            default:
                console.warn("Unknown undo action:", state.action);
        }
    }

    /**
     * Performs the actual redo operation based on action type
     * @param {Object} state - The state to redo
     */
    performRedo(state) {
        switch (state.action) {
            case 'block_added':
                this.redoBlockAdded(state.data);
                break;
            case 'block_deleted':
                this.redoBlockDeleted(state.data);
                break;
            case 'block_moved':
                this.redoBlockMoved(state.data);
                break;
            case 'block_connected':
                this.redoBlockConnected(state.data);
                break;
            case 'block_disconnected':
                this.redoBlockDisconnected(state.data);
                break;
            case 'blocks_pasted':
                this.redoBlocksPasted(state.data);
                break;
            default:
                console.warn("Unknown redo action:", state.action);
        }
    }

    /**
     * Undo adding a block
     * @param {Object} data - Block data
     */
    undoBlockAdded(data) {
        const block = this.activity.blocks.blockList.find(b => b.name === data.blockName);
        if (block) {
            this.activity.blocks.sendBlockToTrash(block);
        }
    }

    /**
     * Redo adding a block
     * @param {Object} data - Block data
     */
    redoBlockAdded(data) {
        // This would require recreating the block from saved data
        // For now, we'll just log it
        console.log("Redo block added:", data);
    }

    /**
     * Undo deleting a block
     * @param {Object} data - Block data
     */
    undoBlockDeleted(data) {
        // This would require restoring the block from saved data
        // For now, we'll just log it
        console.log("Undo block deleted:", data);
    }

    /**
     * Redo deleting a block
     * @param {Object} data - Block data
     */
    redoBlockDeleted(data) {
        const block = this.activity.blocks.blockList.find(b => b.name === data.blockName);
        if (block) {
            this.activity.blocks.sendBlockToTrash(block);
        }
    }

    /**
     * Undo moving a block
     * @param {Object} data - Block movement data
     */
    undoBlockMoved(data) {
        const block = this.activity.blocks.blockList.find(b => b.name === data.blockName);
        if (block) {
            block.container.x = data.oldX;
            block.container.y = data.oldY;
            this.activity.refreshCanvas();
        }
    }

    /**
     * Redo moving a block
     * @param {Object} data - Block movement data
     */
    redoBlockMoved(data) {
        const block = this.activity.blocks.blockList.find(b => b.name === data.blockName);
        if (block) {
            block.container.x = data.newX;
            block.container.y = data.newY;
            this.activity.refreshCanvas();
        }
    }

    /**
     * Undo connecting blocks
     * @param {Object} data - Block connection data
     */
    undoBlockConnected(data) {
        const block1 = this.activity.blocks.blockList.find(b => b.name === data.block1Name);
        const block2 = this.activity.blocks.blockList.find(b => b.name === data.block2Name);
        if (block1 && block2) {
            this.activity.blocks.disconnect(block1, block2);
        }
    }

    /**
     * Redo connecting blocks
     * @param {Object} data - Block connection data
     */
    redoBlockConnected(data) {
        const block1 = this.activity.blocks.blockList.find(b => b.name === data.block1Name);
        const block2 = this.activity.blocks.blockList.find(b => b.name === data.block2Name);
        if (block1 && block2) {
            this.activity.blocks.connect(block1, block2);
        }
    }

    /**
     * Undo disconnecting blocks
     * @param {Object} data - Block disconnection data
     */
    undoBlockDisconnected(data) {
        const block1 = this.activity.blocks.blockList.find(b => b.name === data.block1Name);
        const block2 = this.activity.blocks.blockList.find(b => b.name === data.block2Name);
        if (block1 && block2) {
            this.activity.blocks.connect(block1, block2);
        }
    }

    /**
     * Redo disconnecting blocks
     * @param {Object} data - Block disconnection data
     */
    redoBlockDisconnected(data) {
        const block1 = this.activity.blocks.blockList.find(b => b.name === data.block1Name);
        const block2 = this.activity.blocks.blockList.find(b => b.name === data.block2Name);
        if (block1 && block2) {
            this.activity.blocks.disconnect(block1, block2);
        }
    }

    /**
     * Undo pasting blocks
     * @param {Object} data - Pasted blocks data
     */
    undoBlocksPasted(data) {
        data.blockNames.forEach(blockName => {
            const block = this.activity.blocks.blockList.find(b => b.name === blockName);
            if (block) {
                this.activity.blocks.sendBlockToTrash(block);
            }
        });
    }

    /**
     * Redo pasting blocks
     * @param {Object} data - Pasted blocks data
     */
    redoBlocksPasted(data) {
        // This would require recreating the pasted blocks from saved data
        // For now, we'll just log it
        console.log("Redo blocks pasted:", data);
    }

    /**
     * Updates the UI to reflect current undo/redo state
     */
    updateUI() {
        const undoButton = document.getElementById('undoButton');
        const redoButton = document.getElementById('redoButton');

        if (undoButton) {
            undoButton.disabled = this.undoStack.length === 0;
            undoButton.style.opacity = this.undoStack.length === 0 ? '0.5' : '1';
        }

        if (redoButton) {
            redoButton.disabled = this.redoStack.length === 0;
            redoButton.style.opacity = this.redoStack.length === 0 ? '0.5' : '1';
        }
    }

    /**
     * Clears all undo/redo history
     */
    clearHistory() {
        this.undoStack = [];
        this.redoStack = [];
        this.updateUI();
    }

    /**
     * Returns true if undo is available
     */
    canUndo() {
        return this.undoStack.length > 0;
    }

    /**
     * Returns true if redo is available
     */
    canRedo() {
        return this.redoStack.length > 0;
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = UndoRedoManager;
}
