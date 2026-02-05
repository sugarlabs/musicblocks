// Copyright (c) 2024 Music Blocks Contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of The GNU Affero General Public
// License as published by Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
 * UndoRedoManager - Manages undo/redo operations for Music Blocks
 *
 * Key features:
 * - Action-based undo/redo (not full snapshot)
 * - Global flag to prevent automatic docking during undo/redo
 * - Proper error handling with warnings instead of silent failures
 * - EaselJS compatible caching
 */

const MAX_UNDO_REDO_STACK_SIZE = 50;

class UndoRedoManager {
    /**
     * Creates an UndoRedoManager instance
     * @param {Activity} activity - The main activity instance
     */
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
        // Don't save state during undo/redo operations to prevent infinite loops
        if (this.isPerformingUndoRedo) {
            return;
        }

        const state = {
            action: action,
            data: data,
            timestamp: Date.now()
        };

        this.undoStack.push(state);

        // Limit stack size to prevent memory issues
        if (this.undoStack.length > MAX_UNDO_REDO_STACK_SIZE) {
            this.undoStack.shift();
        }

        // Clear redo stack when new action is performed
        this.redoStack = [];

        this.updateUI();
    }

    /**
     * Performs undo operation
     */
    undo() {
        if (this.undoStack.length === 0) {
            this.activity.textMsg(_("Nothing to undo"));
            return false;
        }

        const state = this.undoStack.pop();
        this.redoStack.push(state);

        // Set global flag to prevent automatic docking during undo
        this.isPerformingUndoRedo = true;
        this.activity.isUndoRedoInProgress = true;

        try {
            this.performUndo(state);
            this.activity.textMsg(_("Undo: ") + state.action);
        } catch (error) {
            console.error("Undo failed:", error);
            // Restore state to undo stack if undo failed
            this.undoStack.push(state);
            this.redoStack.pop();
            return false;
        } finally {
            // Always clear the flag after operation completes
            this.isPerformingUndoRedo = false;
            this.activity.isUndoRedoInProgress = false;
            this.updateUI();
        }

        return true;
    }

    /**
     * Performs redo operation
     */
    redo() {
        if (this.redoStack.length === 0) {
            this.activity.textMsg(_("Nothing to redo"));
            return false;
        }

        const state = this.redoStack.pop();
        this.undoStack.push(state);

        // Set global flag to prevent automatic docking during redo
        this.isPerformingUndoRedo = true;
        this.activity.isUndoRedoInProgress = true;

        try {
            this.performRedo(state);
            this.activity.textMsg(_("Redo: ") + state.action);
        } catch (error) {
            console.error("Redo failed:", error);
            // Restore state to redo stack if redo failed
            this.redoStack.push(state);
            this.undoStack.pop();
            return false;
        } finally {
            // Always clear the flag after operation completes
            this.isPerformingUndoRedo = false;
            this.activity.isUndoRedoInProgress = false;
            this.updateUI();
        }

        return true;
    }

    /**
     * Executes the specific undo action
     * @param {Object} state - The state to undo
     */
    performUndo(state) {
        const { action, data } = state;

        switch (action) {
            case 'block_moved':
                this.undoBlockMoved(data);
                break;
            case 'block_stack_moved':
                this.undoBlockStackMoved(data);
                break;
            case 'block_added':
                this.undoBlockAdded(data);
                break;
            case 'block_deleted':
                this.undoBlockDeleted(data);
                break;
            default:
                console.warn("Unknown undo action:", action);
        }
    }

    /**
     * Executes the specific redo action
     * @param {Object} state - The state to redo
     */
    performRedo(state) {
        const { action, data } = state;

        switch (action) {
            case 'block_moved':
                this.redoBlockMoved(data);
                break;
            case 'block_stack_moved':
                this.redoBlockStackMoved(data);
                break;
            case 'block_added':
                this.redoBlockAdded(data);
                break;
            case 'block_deleted':
                this.redoBlockDeleted(data);
                break;
            default:
                console.warn("Unknown redo action:", action);
        }
    }

    /**
     * Undo moving a block
     * @param {Object} data - Block movement data
     */
    undoBlockMoved(data) {
        const block = this.activity.blocks.blockList.find(b => b.name === data.blockName);

        if (!block) {
            console.warn("Block not found for undo:", data.blockName);
            console.warn("Available blocks:", this.activity.blocks.blockList.map(b => b.name));
            return;
        }

        // Temporarily disable position tracking during undo
        const originalStartX = block._undoStartX;
        const originalStartY = block._undoStartY;
        block._undoStartX = undefined;
        block._undoStartY = undefined;

        // Force the position restoration
        block.container.x = data.oldX;
        block.container.y = data.oldY;

        // Also update block's own position properties if they exist
        if (block.x !== undefined) block.x = data.oldX;
        if (block.y !== undefined) block.y = data.oldY;

        // Force update the container bounds
        if (block.container.bounds) {
            block.container.bounds.x = data.oldX;
            block.container.bounds.y = data.oldY;
        }

        // Ensure block stays visible by bringing it to front
        if (this.activity.stage && block.container.parent) {
            this.activity.stage.setChildIndex(block.container, this.activity.stage.children.length - 1);
        }

        // EaselJS compatible caching
        block.container.cache();
        block.container.updateCache();

        // Restore original tracking values after a delay
        setTimeout(() => {
            block._undoStartX = originalStartX;
            block._undoStartY = originalStartY;
        }, 1000);
    }

    /**
     * Undo moving a block stack
     * @param {Object} data - Block stack movement data
     */
    undoBlockStackMoved(data) {
        const primaryBlock = this.activity.blocks.blockList.find(b => b.name === data.primaryBlock);

        if (!primaryBlock) {
            console.warn("Primary block not found for undo:", data.primaryBlock);
            return;
        }

        // Calculate the movement delta
        const deltaX = data.oldX - data.newX;
        const deltaY = data.oldY - data.newY;

        // Move all blocks in the stack by the same delta
        data.stackBlocks.forEach(blockData => {
            const block = this.activity.blocks.blockList.find(b => b.name === blockData.name);
            
            if (block) {
                // Temporarily disable position tracking during undo
                const originalStartX = block._undoStartX;
                const originalStartY = block._undoStartY;
                block._undoStartX = undefined;
                block._undoStartY = undefined;

                // Move block by the delta
                const newX = blockData.currentX + deltaX;
                const newY = blockData.currentY + deltaY;
                
                block.container.x = newX;
                block.container.y = newY;

                // Also update block's own position properties if they exist
                if (block.x !== undefined) block.x = newX;
                if (block.y !== undefined) block.y = newY;

                // Force update the container bounds
                if (block.container.bounds) {
                    block.container.bounds.x = newX;
                    block.container.bounds.y = newY;
                }

                // Ensure block stays visible by bringing it to front
                if (this.activity.stage && block.container.parent) {
                    this.activity.stage.setChildIndex(block.container, this.activity.stage.children.length - 1);
                }

                // EaselJS compatible caching
                block.container.cache();
                block.container.updateCache();

                // Restore original tracking values after a delay
                setTimeout(() => {
                    block._undoStartX = originalStartX;
                    block._undoStartY = originalStartY;
                }, 1000);
            }
        });

        // Comprehensive refresh to ensure all blocks are visible
        this.activity.refreshCanvas();
        
        // Force multiple stage updates to ensure rendering
        if (this.activity.stage) {
            this.activity.stage.update();
            // Add a small delay and update again to ensure proper rendering
            setTimeout(() => {
                this.activity.stage.update();
            }, 50);
        }
    }

    /**
     * Redo moving a block stack
     * @param {Object} data - Block stack movement data
     */
    redoBlockStackMoved(data) {
        const primaryBlock = this.activity.blocks.blockList.find(b => b.name === data.primaryBlock);

        if (!primaryBlock) {
            console.warn("Primary block not found for redo:", data.primaryBlock);
            return;
        }

        // Calculate the movement delta
        const deltaX = data.newX - data.oldX;
        const deltaY = data.newY - data.oldY;

        // Move all blocks in the stack by the same delta
        data.stackBlocks.forEach(blockData => {
            const block = this.activity.blocks.blockList.find(b => b.name === blockData.name);
            
            if (block) {
                // Temporarily disable position tracking during redo
                const originalStartX = block._undoStartX;
                const originalStartY = block._undoStartY;
                block._undoStartX = undefined;
                block._undoStartY = undefined;

                // Move block by the delta
                const newX = blockData.currentX + deltaX;
                const newY = blockData.currentY + deltaY;
                
                block.container.x = newX;
                block.container.y = newY;

                // Also update block's own position properties if they exist
                if (block.x !== undefined) block.x = newX;
                if (block.y !== undefined) block.y = newY;

                // Force update the container bounds
                if (block.container.bounds) {
                    block.container.bounds.x = newX;
                    block.container.bounds.y = newY;
                }

                // Ensure block stays visible by bringing it to front
                if (this.activity.stage && block.container.parent) {
                    this.activity.stage.setChildIndex(block.container, this.activity.stage.children.length - 1);
                }

                // EaselJS compatible caching
                block.container.cache();
                block.container.updateCache();

                // Restore original tracking values after a delay
                setTimeout(() => {
                    block._undoStartX = originalStartX;
                    block._undoStartY = originalStartY;
                }, 1000);
            }
        });

        // Comprehensive refresh to ensure all blocks are visible
        this.activity.refreshCanvas();
        
        // Force multiple stage updates to ensure rendering
        if (this.activity.stage) {
            this.activity.stage.update();
            // Add a small delay and update again to ensure proper rendering
            setTimeout(() => {
                this.activity.stage.update();
            }, 50);
        }
    }

    /**
     * Redo moving a block
     * @param {Object} data - Block movement data
     */
    redoBlockMoved(data) {
        const block = this.activity.blocks.blockList.find(b => b.name === data.blockName);

        if (!block) {
            console.warn("Block not found for redo:", data.blockName);
            console.warn("Available blocks:", this.activity.blocks.blockList.map(b => b.name));
            return;
        }

        // Temporarily disable position tracking during redo
        const originalStartX = block._undoStartX;
        const originalStartY = block._undoStartY;
        block._undoStartX = undefined;
        block._undoStartY = undefined;

        // Restore to new position
        block.container.x = data.newX;
        block.container.y = data.newY;

        // Also update block's own position properties if they exist
        if (block.x !== undefined) block.x = data.newX;
        if (block.y !== undefined) block.y = data.newY;

        // Force update the container bounds
        if (block.container.bounds) {
            block.container.bounds.x = data.newX;
            block.container.bounds.y = data.newY;
        }

        // Ensure block stays visible by bringing it to front
        if (this.activity.stage && block.container.parent) {
            this.activity.stage.setChildIndex(block.container, this.activity.stage.children.length - 1);
        }

        // EaselJS compatible caching
        block.container.cache();
        block.container.updateCache();

        // Restore original tracking values after a delay
        setTimeout(() => {
            block._undoStartX = originalStartX;
            block._undoStartY = originalStartY;
        }, 1000);

        // Comprehensive refresh to ensure all blocks are visible
        this.activity.refreshCanvas();
        
        // Force multiple stage updates to ensure rendering
        if (this.activity.stage) {
            this.activity.stage.update();
            // Add a small delay and update again to ensure proper rendering
            setTimeout(() => {
                this.activity.stage.update();
            }, 50);
        }
    }

    /**
     * Undo adding a block
     * @param {Object} data - Block addition data
     */
    undoBlockAdded(data) {
        const block = this.activity.blocks.blockList.find(b => b.name === data.blockName);

        if (!block) {
            console.warn("Block not found for undo add:", data.blockName);
            return;
        }

        // Send block to trash
        this.activity.blocks.sendBlockToTrash(block);
    }

    /**
     * Redo adding a block
     * @param {Object} data - Block addition data
     */
    redoBlockAdded(data) {
        // TODO: Implement block recreation logic
        console.warn("Redo block add not fully implemented");
    }

    /**
     * Undo deleting a block
     * @param {Object} data - Block deletion data
     */
    undoBlockDeleted(data) {
        // TODO: Implement block restoration from trash
        console.warn("Undo block delete not fully implemented");
    }

    /**
     * Redo deleting a block
     * @param {Object} data - Block deletion data
     */
    redoBlockDeleted(data) {
        const block = this.activity.blocks.blockList.find(b => b.name === data.blockName);

        if (!block) {
            console.warn("Block not found for redo delete:", data.blockName);
            return;
        }

        // Send block to trash
        this.activity.blocks.sendBlockToTrash(block);
    }

    /**
     * Updates the UI state of undo/redo buttons
     */
    updateUI() {
        // Enable/disable undo button
        const undoButton = document.getElementById('undoIcon');
        if (undoButton) {
            undoButton.style.opacity = this.undoStack.length > 0 ? '1' : '0.5';
        }

        // Enable/disable redo button
        const redoButton = document.getElementById('redoIcon');
        if (redoButton) {
            redoButton.style.opacity = this.redoStack.length > 0 ? '1' : '0.5';
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UndoRedoManager;
}
