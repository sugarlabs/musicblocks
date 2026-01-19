window.GuideValidator = {
    check(step) {
        console.log(`🔍 Validating step: ${step.id}, action: ${step.action}`);
        
        if (!step.action) {
            console.log("✅ No action required - step complete");
            return true;
        }

        // Get activity with fallbacks
        const activity = this.getActivitySafely();
        
        switch (step.action) {
            case "palette":
                return this.validatePalette(step.palette);
            case "block":
                return this.validateBlockAdded(step.block);
            case "pitch_inside":
                return this.validatePitchInNote();
            case "connect":
                return this.validateConnection();
            case "melody":
                return this.validateMelody();
            case "play":
                return window._guidePlayed === true;
            case "save":
                return window._guideSaved === true;
            default:
                console.log(`❓ Unknown action: ${step.action}`);
                return false;
        }
    },

    getActivitySafely() {
        return window.activity && window.activity.blocks ? window.activity : null;
    },

    validatePalette(paletteName) {
        // Method 1: Check activePalette
        const activity = this.getActivitySafely();
        if (activity && activity.blocks.palettes && activity.blocks.palettes.activePalette === paletteName) {
            console.log(`✅ Palette ${paletteName} detected via activePalette`);
            return true;
        }

        // Method 2: Visual detection of open palette
        const paletteBody = document.getElementById("PaletteBody");
        if (paletteBody && paletteBody.style.display !== "none") {
            const headerSpan = paletteBody.querySelector("span, .palette-name");
            if (headerSpan && headerSpan.textContent.toLowerCase().includes(paletteName.toLowerCase())) {
                console.log(`✅ Palette ${paletteName} detected visually`);
                return true;
            }
        }

        // Method 3: Check for palette-specific elements
        const paletteSpecific = document.querySelector(`#${paletteName}palette, [data-palette="${paletteName}"]`);
        if (paletteSpecific && paletteSpecific.style.display !== "none") {
            console.log(`✅ Palette ${paletteName} detected via specific element`);
            return true;
        }

        console.log(`❌ Palette ${paletteName} not detected`);
        return false;
    },

    validateBlockAdded(blockName) {
        const activity = this.getActivitySafely();
        if (!activity) {
            console.log("❌ No activity for block validation");
            return false;
        }

        const blockList = activity.blocks.blockList || {};
        const current = Object.values(blockList).filter(b => b && b.name === blockName).length;
        const initial = LG.initialCounts[LG.step] || 0;
        
        console.log(`🔢 Block count - Current: ${current}, Initial: ${initial}`);
        return current > initial;
    },

    validatePitchInNote() {
        const activity = this.getActivitySafely();
        if (!activity) return false;

        const blockList = activity.blocks.blockList || {};
        const blocks = Object.values(blockList);

        for (const block of blocks) {
            if (!block || block.name !== "pitch") continue;

            if (this.isPitchInsideNote(block, blockList)) {
                console.log("✅ Pitch found inside note");
                return true;
            }
        }

        console.log("❌ No pitch found inside note");
        return false;
    },

    isPitchInsideNote(pitchBlock, blockList) {
        let parent = pitchBlock;
        let depth = 0;

        while (parent && depth < 10) {
            const parentId = parent.connections && parent.connections[0];
            if (!parentId) break;

            parent = blockList[parentId];
            if (!parent) break;

            if (parent.name === "newnote" || parent.name === "note") {
                return true;
            }

            if (parent.name === "vspace") {
                depth++;
                continue;
            }

            depth++;
        }

        return false;
    },

    validateConnection() {
        const activity = this.getActivitySafely();
        if (!activity) return false;

        const blockList = activity.blocks.blockList || {};
        const startBlock = Object.values(blockList).find(b => b && b.name === "start");
        
        const result = startBlock && startBlock.connections && startBlock.connections[1] !== null;
        console.log(`🔗 Connection validation: ${result}`);
        return result;
    },

    validateMelody() {
        const activity = this.getActivitySafely();
        if (!activity) return false;

        const blockList = activity.blocks.blockList || {};
        const noteCount = Object.values(blockList).filter(b => 
            b && b.name && b.name.toLowerCase().includes("note")
        ).length;
        
        const result = noteCount >= 4;
        console.log(`🎵 Melody validation: ${noteCount} notes, result: ${result}`);
        return result;
    }
};
