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
            case "octave_change":
                return this.validateOctaveChange();
            case "melody":
                return this.validateMelody();
            case "play":
                return this.validatePlay();
            case "save":
                return window._guideSaved === true;
            case "tone_block":
                return this.validateToneBlock();
            case "flow_block":
                return this.validateFlowBlock();
            case "graphics_block":
                return this.validateGraphicsBlock();
            default:
                console.log(`❓ Unknown action: ${step.action}`);
                return false;
        }
    },

    getActivitySafely() {
        // Try window.activity first
        const activity = getRealActivity();
        if (activity && activity.blocks) {
            return activity;
        }
        // Fallback to globalActivity
        if (typeof globalActivity !== 'undefined' && globalActivity && globalActivity.blocks) {
            return globalActivity;
        }
        return null;
    },

    validatePalette(paletteName) {
        const initialCounter = LG.initialCounts[LG.step] ?? 0;
        const currentCounter = window._lgPaletteCounter;

        const result =
            window._lgLastPalette === paletteName &&
            currentCounter > initialCounter;

        console.log(
            "🎨 Palette check",
            {
                expected: paletteName,
                lastOpened: window._lgLastPalette,
                initialCounter,
                currentCounter,
                result
            }
        );

        return result;
    },

    validateBlockAdded(blockName) {
        const activity = getRealActivity();
        if (!activity || !activity.blocks?.blockList) {
            console.log("❌ No real activity for block validation");
            return false;
        }

        const blockList = activity.blocks.blockList;
        let current = 0;

        for (const id in blockList) {
            const block = blockList[id];
            if (
                block &&
                block.name === blockName &&
                !block.trash &&
                block.container?.visible !== false
            ) {
                current++;
            }
        }

        const initial = LG.initialCounts[LG.step] || 0;
        const result = current > initial;

        console.log(
            `🔢 Block "${blockName}" — current: ${current}, initial: ${initial}, result: ${result}`
        );

        return result;
    },

    validatePitchInNote() {
        const activity = this.getActivitySafely();
        if (!activity) return false;

        const blockList = activity.blocks.blockList || {};
        let current = 0;

        for (const id in blockList) {
            const block = blockList[id];
            if (
                block &&
                block.name === "pitch" &&
                !block.trash &&
                block.container?.visible !== false &&
                this.isPitchInsideNote(block, blockList)
            ) {
                current++;
            }
        }

        const initial = LG.initialCounts[LG.step] || 0;
        const result = current > initial;

        console.log(
            `🎼 Pitch-in-note — current: ${current}, initial: ${initial}, result: ${result}`
        );

        return result;
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
    isBlockInsideNote(block, blockList) {
        let parent = block;
        let depth = 0;

        while (parent && depth < 10) {
            const parentId = parent.connections && parent.connections[0];
            if (!parentId) break;

            parent = blockList[parentId];
            if (!parent) break;

            if (parent.name === "note" || parent.name === "newnote") {
                return true;
            }

            depth++;
        }
        return false;
    },

    validateOctaveChange() {
        const activity = getRealActivity();
        if (!activity) return false;

        const blockList = activity.blocks.blockList || {};
        const currentOctaves = [];

        for (const id in blockList) {
            const block = blockList[id];

            if (
                block &&
                block.name === "number" &&
                typeof block.value === "number" &&
                block.connections
            ) {
                const parentId = block.connections[0];
                const parent = blockList[parentId];

                if (parent && parent.name === "pitch" && !parent.trash) {
                    currentOctaves.push(block.value);
                }
            }
        }

        const initial = LG.initialCounts[LG.step] || [];

        const changed =
            currentOctaves.length !== initial.length ||
            currentOctaves.some((val, i) => val !== initial[i]);

        console.log(
            `🎚️ Octave change check`,
            { initial, currentOctaves, changed }
        );

        return changed;
    },

    validateConnection() {
        const activity = this.getActivitySafely();
        if (!activity) return false;

        const blockList = activity.blocks.blockList || {};
        let currentConnection = null;

        for (const id in blockList) {
            const block = blockList[id];
            if (block && block.name === "start" && block.connections) {
                currentConnection = block.connections[1] || null;
                break;
            }
        }

        const initial = LG.initialCounts[LG.step] || null;

        const changed = currentConnection !== initial;

        console.log(
            `🔗 Connection change check`,
            { initial, currentConnection, changed }
        );

        return changed;
    },
    validatePlay() {
        const { started, ended } = window._lgPlayState;

        const result = started && ended;

        console.log(
            `🎵 Play validation`,
            { started, ended, result }
        );

        return result;
    },

    validateMelody() {
        const activity = this.getActivitySafely();
        if (!activity) return false;

        const blockList = activity.blocks.blockList || {};
        let current = 0;

        for (const id in blockList) {
            const block = blockList[id];
            if (
                block &&
                block.name &&
                block.name.toLowerCase().includes("note") &&
                !block.trash &&
                block.container?.visible !== false
            ) {
                current++;
            }
        }

        const initial = LG.initialCounts[LG.step] || 0;
        const added = current - initial;
        const result = added >= 3;

        console.log(
            `🎵 Melody check — initial: ${initial}, current: ${current}, added: ${added}, result: ${result}`
        );

        return result;
    },
    validateToneBlock() {
        const activity = this.getActivitySafely();
        if (!activity) return false;

        const blockList = activity.blocks.blockList || {};
        const initialIds = LG.initialCounts[LG.step] || [];

        for (const id in blockList) {
            const block = blockList[id];
            if (
                block &&
                block.name === "voicename" &&
                !block.trash &&
                !initialIds.includes(id) // ✅ NEW block only
            ) {
                // This is a newly added Set Instrument
                if (
                    typeof block.value === "string" &&
                    block.value !== "" &&
                    block.value !== "electronic synth"
                ) {
                    console.log(
                        "🎶 New Set Instrument changed to:",
                        block.value
                    );
                    return true;
                }
            }
        }

        return false;
    },

    validateFlowBlock() {
        const activity = this.getActivitySafely();
        if (!activity) return false;

        const blockList = activity.blocks.blockList || {};

        for (const id in blockList) {
            const block = blockList[id];
            if (
                block &&
                block.name === "repeat" &&
                !block.trash &&
                block.connections &&
                block.connections[2] !== null
            ) {
                console.log("🔁 Repeat block wrapping detected");
                return true;
            }
        }

        return false;
    },

    validateGraphicsBlock() {
        const activity = this.getActivitySafely();
        if (!activity) return false;

        const blockList = activity.blocks.blockList || {};

        for (const id in blockList) {
            const block = blockList[id];

            if (
                block &&
                block.name === "forward" &&
                !block.trash &&
                this.isBlockInsideNote(block, blockList)
            ) {
                console.log("➡️ Forward block inside note detected");
                return true;
            }
        }

        return false;
    }
};
