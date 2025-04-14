// Copyright (c) 2024 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/**
 * Keyboard navigation module for Music Blocks
 * Provides keyboard-based block navigation and selection
 * to improve accessibility
 */

/* global activity, docById */

/**
 * KeyboardNav class handles keyboard interactions with blocks
 */
class KeyboardNav {
    /**
     * Constructor initializes the keyboard navigation
     * @param {object} activity - The activity instance
     * @param {object} blocks - The blocks container
     */
    constructor(activity, blocks) {
        this.activity = activity;
        this.blocks = blocks;
        this.selectedBlockIndex = -1;
        this.visibleBlocks = [];
        this.isEnabled = false;
        this.highlightColor = "#ff8c00"; // Orange highlight color
        this.lastSelectedBlock = null;

        // Key codes for navigation
        this.KEYCODE_LEFT = 37;
        this.KEYCODE_UP = 38;
        this.KEYCODE_RIGHT = 39;
        this.KEYCODE_DOWN = 40;
        this.KEYCODE_ESC = 27;

        // Initialize keyboard event listeners
        this.initKeyboardListeners();
    }

    /**
     * Initialize keyboard event listeners
     */
    initKeyboardListeners() {
        // Store original keyboard handler to chain it
        this.originalKeyboardHandler = this.activity.__keyPressed;

        // Override the activity's keyboard handler
        this.activity.__keyPressed = (event) => {
            // Only handle navigation when enabled
            if (this.isEnabled) {
                this.handleKeyDown(event);
                return;
            }

            // Otherwise, use the original handler
            if (this.originalKeyboardHandler) {
                this.originalKeyboardHandler.call(this.activity, event);
            }
        };

        // Add keyboard activation/deactivation shortcut (Alt + K)
        document.addEventListener("keydown", (event) => {
            if (event.altKey && event.key === "k") {
                event.preventDefault();
                this.toggleKeyboardNavigation();
            }
        });
    }

    /**
     * Toggle keyboard navigation mode on/off
     */
    toggleKeyboardNavigation() {
        this.isEnabled = !this.isEnabled;
        
        if (this.isEnabled) {
            this.refreshVisibleBlocks();
            this.activity.textMsg(_("Keyboard navigation enabled. Use arrow keys to navigate between blocks."));
            
            // Select the first block if none is selected
            if (this.selectedBlockIndex === -1 && this.visibleBlocks.length > 0) {
                this.selectedBlockIndex = 0;
                this.highlightSelectedBlock();
            }
        } else {
            this.unhighlightSelectedBlock();
            this.activity.textMsg(_("Keyboard navigation disabled."));
        }
    }

    /**
     * Rebuild the list of visible, interactable blocks
     */
    refreshVisibleBlocks() {
        this.visibleBlocks = [];
        
        // Only collect blocks that are visible and not in the trash
        for (let i = 0; i < this.blocks.blockList.length; i++) {
            const block = this.blocks.blockList[i];
            if (block.visible && !block.trash && block.connections[0] === null) {
                // Only include top-level blocks (those with no blocks above them)
                this.visibleBlocks.push(i);
            }
        }
        
        // Retain selection if possible
        if (this.selectedBlockIndex !== -1) {
            const blockIndex = this.visibleBlocks[this.selectedBlockIndex];
            if (!this.visibleBlocks.includes(blockIndex)) {
                this.selectedBlockIndex = this.visibleBlocks.length > 0 ? 0 : -1;
            }
        }
    }

    /**
     * Handle key press events for block navigation
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeyDown(event) {
        // Skip if no blocks are visible
        if (this.visibleBlocks.length === 0) {
            return;
        }

        switch (event.keyCode) {
            case this.KEYCODE_RIGHT:
                this.navigateNextBlock();
                event.preventDefault();
                break;
                
            case this.KEYCODE_LEFT:
                this.navigatePrevBlock();
                event.preventDefault();
                break;
                
            case this.KEYCODE_UP:
                this.navigatePrevBlock();
                event.preventDefault();
                break;
                
            case this.KEYCODE_DOWN:
                this.navigateNextBlock();
                event.preventDefault();
                break;
                
            case this.KEYCODE_ESC:
                this.toggleKeyboardNavigation();
                event.preventDefault();
                break;
        }
    }

    /**
     * Navigate to the next block in the list
     */
    navigateNextBlock() {
        if (this.visibleBlocks.length === 0) {
            return;
        }
        
        this.unhighlightSelectedBlock();
        
        if (this.selectedBlockIndex < this.visibleBlocks.length - 1) {
            this.selectedBlockIndex++;
        } else {
            this.selectedBlockIndex = 0;
        }
        
        this.highlightSelectedBlock();
    }

    /**
     * Navigate to the previous block in the list
     */
    navigatePrevBlock() {
        if (this.visibleBlocks.length === 0) {
            return;
        }
        
        this.unhighlightSelectedBlock();
        
        if (this.selectedBlockIndex > 0) {
            this.selectedBlockIndex--;
        } else {
            this.selectedBlockIndex = this.visibleBlocks.length - 1;
        }
        
        this.highlightSelectedBlock();
    }

    /**
     * Highlight the currently selected block
     */
    highlightSelectedBlock() {
        if (this.selectedBlockIndex === -1 || this.selectedBlockIndex >= this.visibleBlocks.length) {
            return;
        }
        
        const blockIndex = this.visibleBlocks[this.selectedBlockIndex];
        const block = this.blocks.blockList[blockIndex];
        
        if (!block || !block.container) {
            return;
        }
        
        // Save the current block for reference
        this.lastSelectedBlock = block;
        
        // Add visual highlight
        block.container.addChild(this.createHighlightBox(block));
        
        // Move block to foreground
        this.blocks.raiseStackToTop(blockIndex);
        
        // Update the blocks.activeBlock
        this.blocks.activeBlock = blockIndex;
        
        // Force a canvas update
        this.activity.refreshCanvas();
    }

    /**
     * Create a highlight box around the selected block
     * @param {object} block - The block to highlight
     * @returns {object} - The highlight shape
     */
    createHighlightBox(block) {
        // Create highlight
        const highlight = new createjs.Shape();
        highlight.name = "highlight";
        
        // Calculate bounds
        const bounds = block.container.getBounds();
        if (!bounds) {
            return highlight;
        }
        
        // Draw highlight rectangle
        highlight.graphics
            .setStrokeStyle(3)
            .beginStroke(this.highlightColor)
            .drawRect(
                bounds.x - 5,
                bounds.y - 5,
                bounds.width + 10,
                bounds.height + 10
            );
        
        return highlight;
    }

    /**
     * Remove highlight from the selected block
     */
    unhighlightSelectedBlock() {
        if (this.lastSelectedBlock && this.lastSelectedBlock.container) {
            // Find and remove highlight
            const highlight = this.lastSelectedBlock.container.children.find(
                child => child.name === "highlight"
            );
            
            if (highlight) {
                this.lastSelectedBlock.container.removeChild(highlight);
                this.activity.refreshCanvas();
            }
        }
    }
}

// Initialize the keyboard navigation when the window loads
if (typeof window !== 'undefined') {
    window.KeyboardNav = KeyboardNav;
    
    // Simple initialization when activity is ready
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (window.activity && window.activity.blocks) {
                window.activity.keyboardNav = new KeyboardNav(window.activity, window.activity.blocks);
                console.log('Basic keyboard navigation initialized. Press Alt+K to enable.');
            }
        }, 2000);
    });
}