// Copyright (c) 2024 Music Blocks Contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/**
 * Program Explorer - Provides hierarchical visualization of block structure
 * and navigation capabilities for Music Blocks
 */

/* exported ProgramExplorer */

class ProgramExplorer {
    constructor(activity) {
        this.activity = activity;
        this.blocks = activity.blocks;
        this.isVisible = false;
        this.selectedBlock = null;
        this.treeData = null;
        this.container = null;
        this.treeContainer = null;
        this.toggleButton = null;

        this.init();
    }

    /**
     * Initialize the program explorer
     */
    init() {
        this.createUI();
        this.bindEvents();
        this.updateTree();
    }

    /**
     * Create the UI components for the explorer
     */
    createUI() {
        // Create main container
        this.container = document.createElement("div");
        this.container.id = "program-explorer";
        this.container.className = "program-explorer";
        this.container.style.display = "none";

        // Create header
        const header = document.createElement("div");
        header.className = "program-explorer-header";
        header.innerHTML = `
            <h3>Program Structure</h3>
            <button id="explorer-close" class="explorer-close-btn">
                <i class="material-icons">close</i>
            </button>
        `;

        // Create tree container
        this.treeContainer = document.createElement("div");
        this.treeContainer.className = "program-explorer-tree";
        this.treeContainer.id = "explorer-tree";

        // Create toggle button
        this.toggleButton = document.createElement("button");
        this.toggleButton.id = "explorer-toggle";
        this.toggleButton.className = "explorer-toggle-btn";
        this.toggleButton.innerHTML = '<i class="material-icons">account_tree</i>';
        this.toggleButton.title = "Toggle Program Explorer";

        // Assemble UI
        this.container.appendChild(header);
        this.container.appendChild(this.treeContainer);

        // Add to DOM
        document.body.appendChild(this.container);
        document.body.appendChild(this.toggleButton);
    }

    /**
     * Bind event handlers
     */
    bindEvents() {
        // Toggle button click
        this.toggleButton.addEventListener("click", () => {
            this.toggle();
        });

        // Close button click
        const closeBtn = document.getElementById("explorer-close");
        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
                this.hide();
            });
        }

        // Listen for block changes via the blocks event system
        if (this.blocks) {
            // Override block add/remove methods to trigger updates
            const originalAddBlock = this.blocks.addBlock;
            this.blocks.addBlock = (...args) => {
                const result = originalAddBlock.apply(this.blocks, args);
                this.updateTree();
                return result;
            };

            const originalRemoveBlock = this.blocks.removeBlock;
            this.blocks.removeBlock = (...args) => {
                const result = originalRemoveBlock.apply(this.blocks, args);
                this.updateTree();
                return result;
            };
        }
    }

    /**
     * Toggle the visibility of the explorer
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Show the explorer
     */
    show() {
        this.isVisible = true;
        this.container.style.display = "block";
        this.toggleButton.classList.add("active");
        this.updateTree();
    }

    /**
     * Hide the explorer
     */
    hide() {
        this.isVisible = false;
        this.container.style.display = "none";
        this.toggleButton.classList.remove("active");
    }

    /**
     * Extract hierarchical data from blocks
     */
    extractHierarchy() {
        const hierarchy = [];
        const processedBlocks = new Set();

        // Find all top-level blocks (blocks with no parent)
        for (let i = 0; i < this.blocks.blockList.length; i++) {
            const block = this.blocks.blockList[i];
            if (!block || block.trash || processedBlocks.has(block)) {
                continue;
            }

            // Check if this is a top-level block
            if (block.connections[0] === null) {
                const treeNode = this.buildTreeNode(block, processedBlocks);
                if (treeNode) {
                    hierarchy.push(treeNode);
                }
            }
        }

        return hierarchy;
    }

    /**
     * Build a tree node for a block and its children
     */
    buildTreeNode(block, processedBlocks) {
        if (!block || block.trash || processedBlocks.has(block)) {
            return null;
        }

        processedBlocks.add(block);

        const node = {
            id: block.name + "_" + this.blocks.blockList.indexOf(block),
            name: this.getDisplayName(block),
            type: block.name,
            block: block,
            children: []
        };

        // Process child blocks based on connections
        for (let i = 1; i < block.connections.length; i++) {
            const childBlockId = block.connections[i];
            if (childBlockId !== null && childBlockId !== undefined) {
                const childBlock = this.blocks.blockList[childBlockId];
                if (childBlock && !childBlock.trash) {
                    const childNode = this.buildTreeNode(childBlock, processedBlocks);
                    if (childNode) {
                        node.children.push(childNode);
                    }
                }
            }
        }

        // Handle flow blocks (blocks that can have following blocks)
        if (
            block.connections.length > 0 &&
            block.connections[block.connections.length - 1] !== null
        ) {
            const nextBlockId = block.connections[block.connections.length - 1];
            const nextBlock = this.blocks.blockList[nextBlockId];
            if (nextBlock && !nextBlock.trash && !processedBlocks.has(nextBlock)) {
                const nextNode = this.buildTreeNode(nextBlock, processedBlocks);
                if (nextNode) {
                    node.children.push(nextNode);
                }
            }
        }

        return node;
    }

    /**
     * Get display name for a block
     */
    getDisplayName(block) {
        // Use block's label if available
        if (block.label && block.label.value) {
            return block.label.value;
        }

        // Use block's text if available
        if (block.text) {
            return block.text;
        }

        // Use block's value if available
        if (block.value !== null && block.value !== undefined) {
            return String(block.value);
        }

        // Use block name with proper formatting
        let name = block.name;
        if (name) {
            // Convert camelCase to Title Case
            name = name.replace(/([A-Z])/g, " $1");
            name = name.charAt(0).toUpperCase() + name.slice(1);
            return name;
        }

        return "Unknown Block";
    }

    /**
     * Update the tree view with current block hierarchy
     */
    updateTree() {
        if (!this.isVisible) {
            return;
        }

        this.treeData = this.extractHierarchy();
        this.renderTree();
    }

    /**
     * Render the tree view in the container
     */
    renderTree() {
        this.treeContainer.innerHTML = "";

        if (!this.treeData || this.treeData.length === 0) {
            this.treeContainer.innerHTML = '<div class="explorer-empty">No blocks found</div>';
            return;
        }

        this.treeData.forEach(node => {
            const nodeElement = this.createTreeNodeElement(node, 0);
            this.treeContainer.appendChild(nodeElement);
        });
    }

    /**
     * Create DOM element for a tree node
     */
    createTreeNodeElement(node, depth) {
        const nodeElement = document.createElement("div");
        nodeElement.className = "explorer-tree-node";
        nodeElement.style.paddingLeft = `${depth * 20}px`;

        // Create node content
        const content = document.createElement("div");
        content.className = "explorer-node-content";

        // Add expand/collapse icon if has children
        if (node.children && node.children.length > 0) {
            const expandIcon = document.createElement("i");
            expandIcon.className = "material-icons explorer-expand-icon";
            expandIcon.textContent = "expand_more";
            content.appendChild(expandIcon);
        } else {
            const spacer = document.createElement("span");
            spacer.className = "explorer-spacer";
            spacer.style.width = "24px";
            spacer.style.display = "inline-block";
            content.appendChild(spacer);
        }

        // Add block icon
        const blockIcon = document.createElement("i");
        blockIcon.className = "material-icons explorer-block-icon";
        blockIcon.textContent = this.getBlockIcon(node.type);
        content.appendChild(blockIcon);

        // Add block name
        const nameSpan = document.createElement("span");
        nameSpan.className = "explorer-node-name";
        nameSpan.textContent = node.name;
        content.appendChild(nameSpan);

        nodeElement.appendChild(content);

        // Add click handler for navigation
        content.addEventListener("click", () => {
            this.navigateToBlock(node.block);
            this.highlightBlock(node.block);
        });

        // Add children if any
        if (node.children && node.children.length > 0) {
            const childrenContainer = document.createElement("div");
            childrenContainer.className = "explorer-children";
            childrenContainer.style.display = "block";

            node.children.forEach(child => {
                const childElement = this.createTreeNodeElement(child, depth + 1);
                childrenContainer.appendChild(childElement);
            });

            nodeElement.appendChild(childrenContainer);

            // Add expand/collapse functionality
            const expandIcon = content.querySelector(".explorer-expand-icon");
            if (expandIcon) {
                expandIcon.addEventListener("click", e => {
                    e.stopPropagation();
                    this.toggleNode(nodeElement, expandIcon);
                });
            }
        }

        return nodeElement;
    }

    /**
     * Get appropriate icon for block type
     */
    getBlockIcon(blockType) {
        const iconMap = {
            action: "play_arrow",
            pitch: "music_note",
            rhythm: "graphic_eq",
            note: "music_note",
            setdrum: "drums",
            setkey: "piano",
            setbpm: "speed",
            setvolume: "volume_up",
            repeat: "repeat",
            forever: "loop",
            if: "call_split",
            ifelse: "call_split",
            while: "loop",
            until: "loop",
            do: "play_arrow",
            start: "play_arrow",
            hidden: "visibility_off"
        };

        return iconMap[blockType] || "code";
    }

    /**
     * Toggle expand/collapse of a tree node
     */
    toggleNode(nodeElement, expandIcon) {
        const childrenContainer = nodeElement.querySelector(".explorer-children");
        if (childrenContainer) {
            if (childrenContainer.style.display === "none") {
                childrenContainer.style.display = "block";
                expandIcon.textContent = "expand_more";
                nodeElement.classList.remove("collapsed");
            } else {
                childrenContainer.style.display = "none";
                expandIcon.textContent = "chevron_right";
                nodeElement.classList.add("collapsed");
            }
        }
    }

    /**
     * Navigate to a specific block in the canvas
     */
    navigateToBlock(block) {
        if (!block || !block.container) {
            return;
        }

        try {
            // Get block position
            const blockBounds = block.container.getBounds();
            if (blockBounds) {
                // Calculate scroll position to center the block
                const canvas = document.getElementById("myCanvas");
                if (canvas && this.activity.stage) {
                    const canvasWidth = canvas.width;
                    const canvasHeight = canvas.height;

                    const scrollX = blockBounds.x - canvasWidth / 2 + blockBounds.width / 2;
                    const scrollY = blockBounds.y - canvasHeight / 2 + blockBounds.height / 2;

                    // Scroll the stage to center the block
                    this.activity.stage.x = -scrollX;
                    this.activity.stage.y = -scrollY;
                    this.activity.stage.update();

                    // Mark stage as dirty for render loop
                    this.activity.stageDirty = true;
                }
            }
        } catch (error) {
            console.warn("Error navigating to block:", error);
        }
    }

    /**
     * Highlight a block in the canvas
     */
    highlightBlock(block) {
        // Remove previous highlight
        if (this.selectedBlock && this.selectedBlock !== block) {
            if (this.selectedBlock.highlightBitmap) {
                this.selectedBlock.highlightBitmap.visible = false;
            }
            if (this.selectedBlock.container) {
                this.selectedBlock.container.unhighlight();
            }
        }

        // Add new highlight
        this.selectedBlock = block;
        if (block) {
            // Use the block's built-in highlight method
            if (block.container && block.container.highlight) {
                block.container.highlight();
            }

            // Show highlight bitmap if available
            if (block.highlightBitmap) {
                block.highlightBitmap.visible = true;
            }
        }

        // Update stage
        if (this.activity.stage) {
            this.activity.stage.update();
            this.activity.stageDirty = true;
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        if (this.toggleButton && this.toggleButton.parentNode) {
            this.toggleButton.parentNode.removeChild(this.toggleButton);
        }
        this.selectedBlock = null;
        this.treeData = null;
    }
}
