// Copyright (c) 2024 Music Blocks
// Undo/Redo Manager for Music Blocks workspace
// Implements infinite loop prevention and state comparison

class UndoManager {
    constructor(activity) {
        this.activity = activity;
        this.undoStack = [];
        this.redoStack = [];
        this.maxStackSize = 50; // Prevent memory issues
        this.isMuted = false; // "Mute" pattern to prevent recursive saves
        this.lastSavedState = null;
    }

    /**
     * Push current state to undo stack
     * Only saves if state has changed and not muted
     */
    pushState() {
        // Prevent recursive state saving during undo/redo
        if (this.isMuted) {
            return;
        }

        try {
            const currentState = this.activity.prepareExport();
            
            // State comparison - avoid duplicate entries
            if (currentState === this.lastSavedState) {
                return;
            }

            // Add to undo stack
            this.undoStack.push(currentState);
            this.lastSavedState = currentState;

            // Clear redo stack when new action is performed
            this.redoStack = [];

            // Limit stack size to prevent memory issues
            if (this.undoStack.length > this.maxStackSize) {
                this.undoStack.shift();
            }

            console.debug(`State saved to undo stack. Stack size: ${this.undoStack.length}`);
        } catch (error) {
            console.error("Error saving state to undo stack:", error);
        }
    }

    /**
     * Undo the last action
     */
    undo() {
        if (this.undoStack.length === 0) {
            console.debug("Nothing to undo");
            return false;
        }

        try {
            // Get current state before undo
            const currentState = this.activity.prepareExport();
            
            // Move current state to redo stack
            this.redoStack.push(currentState);
            
            // Get previous state from undo stack
            const previousState = this.undoStack.pop();
            
            // Mute state capture during restoration
            this.isMuted = true;
            
            // Restore previous state
            this.activity.blocks.loadNewBlocks(JSON.parse(previousState));
            
            // Unmute after restoration
            this.isMuted = false;
            
            // Update last saved state
            this.lastSavedState = previousState;
            
            console.debug(`Undo performed. Undo stack: ${this.undoStack.length}, Redo stack: ${this.redoStack.length}`);
            return true;
        } catch (error) {
            console.error("Error during undo:", error);
            this.isMuted = false; // Ensure unmute on error
            return false;
        }
    }

    /**
     * Redo the last undone action
     */
    redo() {
        if (this.redoStack.length === 0) {
            console.debug("Nothing to redo");
            return false;
        }

        try {
            // Get current state before redo
            const currentState = this.activity.prepareExport();
            
            // Move current state back to undo stack
            this.undoStack.push(currentState);
            
            // Get next state from redo stack
            const nextState = this.redoStack.pop();
            
            // Mute state capture during restoration
            this.isMuted = true;
            
            // Restore next state
            this.activity.blocks.loadNewBlocks(JSON.parse(nextState));
            
            // Unmute after restoration
            this.isMuted = false;
            
            // Update last saved state
            this.lastSavedState = nextState;
            
            console.debug(`Redo performed. Undo stack: ${this.undoStack.length}, Redo stack: ${this.redoStack.length}`);
            return true;
        } catch (error) {
            console.error("Error during redo:", error);
            this.isMuted = false; // Ensure unmute on error
            return false;
        }
    }

    /**
     * Check if undo is available
     */
    canUndo() {
        return this.undoStack.length > 0;
    }

    /**
     * Check if redo is available
     */
    canRedo() {
        return this.redoStack.length > 0;
    }

    /**
     * Clear all undo/redo history
     */
    clearHistory() {
        this.undoStack = [];
        this.redoStack = [];
        this.lastSavedState = null;
        console.debug("Undo/Redo history cleared");
    }

    /**
     * Get stack sizes for debugging/UI updates
     */
    getStackInfo() {
        return {
            undoSize: this.undoStack.length,
            redoSize: this.redoStack.length,
            canUndo: this.canUndo(),
            canRedo: this.canRedo()
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UndoManager;
}
