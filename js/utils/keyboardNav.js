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
        this.lastSelectedBlock = null;

        // Key codes for navigation
        this.KEYCODE_LEFT = 37;
        this.KEYCODE_UP = 38;
        this.KEYCODE_RIGHT = 39;
        this.KEYCODE_DOWN = 40;
        this.KEYCODE_ENTER = 13;
        this.KEYCODE_SPACE = 32;
        this.KEYCODE_DELETE = 46;
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
            this.activity.textMsg(_("Keyboard navigation enabled. Use arrow keys to navigate between blocks. Enter to click, Space to collapse, Ctrl+Delete to remove."));
            
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

        // Get current block if one is selected
        let currentBlock = null;
        if (this.selectedBlockIndex !== -1) {
            const blockIndex = this.visibleBlocks[this.selectedBlockIndex];
            currentBlock = this.blocks.blockList[blockIndex];
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
                
            case this.KEYCODE_ENTER:
                if (currentBlock) {
                    this.activateBlock(currentBlock);
                }
                event.preventDefault();
                break;
                
            case this.KEYCODE_SPACE:
                if (currentBlock && currentBlock.isCollapsible()) {
                    currentBlock.collapseToggle();
                }
                event.preventDefault();
                break;
                
            case this.KEYCODE_DELETE:
                if (currentBlock && event.ctrlKey) {
                    this.deleteBlock(currentBlock);
                    event.preventDefault();
                }
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
     * Highlight the currently selected block using the built-in highlight mechanism
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
        
        // Use the built-in highlight method
        block.highlight();
        
        // Move block to foreground
        this.blocks.raiseStackToTop(blockIndex);
        
        // Ensure the block is visible in the viewport
        this.scrollToBlock(block);
        
        // Update the blocks.activeBlock
        this.blocks.activeBlock = blockIndex;
        
        // Force a canvas update
        this.activity.refreshCanvas();
    }

    /**
     * Remove highlight from the selected block
     */
    unhighlightSelectedBlock() {
        if (this.lastSelectedBlock) {
            // Use the built-in unhighlight method
            this.lastSelectedBlock.unhighlight();
            this.activity.refreshCanvas();
        }
    }

    /**
     * Ensure the block is visible by scrolling if necessary
     * @param {object} block - The block to scroll to
     */
    scrollToBlock(block) {
        if (!block.container) {
            return;
        }
        
        const blockX = block.container.x;
        const blockY = block.container.y;
        const containerX = this.activity.blocksContainer.x;
        const containerY = this.activity.blocksContainer.y;
        const canvasWidth = this.activity.canvas.width;
        const canvasHeight = this.activity.canvas.height;
        
        // Calculate block dimensions (approximated)
        const blockWidth = block.width || 200;
        const blockHeight = block.height || 100;
        
        // Calculate visible area boundaries
        const leftBoundary = -containerX;
        const rightBoundary = -containerX + canvasWidth;
        const topBoundary = -containerY;
        const bottomBoundary = -containerY + canvasHeight;
        
        let newContainerX = containerX;
        let newContainerY = containerY;
        
        // Check if block is outside visible area horizontally
        if (blockX < leftBoundary + 50) {
            newContainerX = -blockX + 50;
        } else if (blockX + blockWidth > rightBoundary - 50) {
            newContainerX = -(blockX + blockWidth - canvasWidth + 50);
        }
        
        // Check if block is outside visible area vertically
        if (blockY < topBoundary + 50) {
            newContainerY = -blockY + 50;
        } else if (blockY + blockHeight > bottomBoundary - 50) {
            newContainerY = -(blockY + blockHeight - canvasHeight + 50);
        }
        
        // Apply new position if changed
        if (newContainerX !== containerX || newContainerY !== containerY) {
            this.activity.blocksContainer.x = newContainerX;
            this.activity.blocksContainer.y = newContainerY;
        }
    }

    /**
     * Simulate a click or action on a block
     * @param {object} block - The block to activate
     */
    activateBlock(block) {
        if (!block) {
            return;
        }
        
        // Toggle the block's collapsed state if it's collapsible
        if (block.isCollapsible()) {
            block.collapseToggle();
        } else {
            // For blocks that have special actions
            if (block.name === "start" || block.name === "drum") {
                this.activity._doFastButton();
            }
            
            // Simulate a click at the center of the block
            if (block.container) {
                // Update the run button state if needed
                this.activity.setPlaybackStatus();
            }
        }
    }

    /**
     * Delete a block and its connected blocks
     * @param {object} block - The block to delete
     */
    deleteBlock(block) {
        if (!block) {
            return;
        }
        
        // Find the block index
        const blockIndex = this.blocks.blockList.indexOf(block);
        if (blockIndex === -1) {
            return;
        }
        
        // Store the previous selection
        const currentSelection = this.selectedBlockIndex;
        
        // Send the block to trash
        this.blocks.sendStackToTrash(blockIndex);
        
        // Refresh the block list
        this.refreshVisibleBlocks();
        
        // Try to select a nearby block
        if (this.visibleBlocks.length > 0) {
            this.selectedBlockIndex = Math.min(currentSelection, this.visibleBlocks.length - 1);
            this.highlightSelectedBlock();
        } else {
            this.selectedBlockIndex = -1;
        }
        
        // Notify user
        this.activity.textMsg(_("Block moved to trash."));
    }
}

// Initialize the keyboard navigation when the window loads
if (typeof window !== 'undefined') {
    window.KeyboardNav = KeyboardNav;
    
    // Initialize when activity is ready
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (window.activity && window.activity.blocks) {
                window.activity.keyboardNav = new KeyboardNav(window.activity, window.activity.blocks);
                console.log('Keyboard navigation initialized. Press Alt+K to enable.');
            }
        }, 2000);
    });
}