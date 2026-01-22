function getRealActivity() {
    if (typeof globalActivity !== "undefined" && globalActivity?.blocks) {
        return globalActivity;
    }
    return null;
}
window._lgLastPalette = null;
window._lgPlayState = {
    started: false,
    ended: false
};

function hookPlayStopButtons() {
    const playBtn = document.querySelector("#play, .play-button");
    const stopBtn = document.querySelector("#stop, .stop-button");

    if (playBtn && !playBtn._lgHooked) {
        playBtn._lgHooked = true;
        playBtn.addEventListener("click", () => {
            console.log("▶️ Play clicked");
            window._lgPlayState.started = true;
            window._lgPlayState.ended = false;
        });
    }

    if (stopBtn && !stopBtn._lgHooked) {
        stopBtn._lgHooked = true;
        stopBtn.addEventListener("click", () => {
            console.log("⏹️ Stop clicked");
            window._lgPlayState.ended = true;
        });
    }
}

let LG = {
    step: 0,
    active: false,
    interval: null,
    initialCounts: {},
    maxWaitTime: 30000, // 30 seconds max wait
    waitStartTime: null,

    init() {
        console.log("🎵 Learning Guide: Starting initialization...");
        const wait = setInterval(() => {
            const activity = getRealActivity();

            if (
                activity &&
                activity.blocks &&
                activity.blocks.blockList &&
                Object.keys(activity.blocks.blockList).length > 0
            ) {
                clearInterval(wait);
                console.log("✅ Music Blocks fully ready. Starting guide.");
                this.start();
            }
        }, 300);

        const waitPlayHook = setInterval(() => {
            hookPlayStopButtons();
        }, 500);

    },

    tryMultipleDetectionMethods() {
        const methods = [
            () => this.detectViaWindowActivity(),
            () => this.detectViaCanvas(),
            () => this.detectViaPalettes(),
            () => this.detectViaBlocksContainer()
        ];

        let methodIndex = 0;

        const tryNextMethod = () => {
            if (methodIndex >= methods.length) {
                // If all methods fail, try a more aggressive approach
                setTimeout(() => this.forceStartAfterDelay(), 2000);
                return;
            }

            const currentMethod = methods[methodIndex];
            console.log(`🔍 Trying detection method ${methodIndex + 1}...`);

            if (currentMethod()) {
                console.log(`✅ Detection method ${methodIndex + 1} succeeded!`);
                this.start();
                return;
            }

            methodIndex++;
            setTimeout(tryNextMethod, 1000); // Wait 1 second between methods
        };

        tryNextMethod();
    },

    // Method 1: Original approach
    detectViaWindowActivity() {
        const activity = getRealActivity();
        if (activity && activity.blocks && activity.blocks.blockList) {
            console.log("✅ Detected via window.activity");
            return true;
        }
        return false;
    },


    // Manual palette opening fallback
    openPaletteManually(paletteName) {
        const button = this.findPaletteButton(paletteName);
        if (button) {
            console.log(`🖱️ Clicking palette button: ${paletteName}`);
            button.click();
            return true;
        }

        // Try alternative selectors
        const alternatives = [
            `#${paletteName}tabbutton`,
            `#${paletteName.charAt(0).toUpperCase()}${paletteName.slice(1)}tabbutton`,
            `[data-palette="${paletteName}"]`,
            `[title*="${paletteName}"]`
        ];

        for (const selector of alternatives) {
            const btn = document.querySelector(selector);
            if (btn) {
                console.log(`🖱️ Found and clicking: ${selector}`);
                btn.click();
                return true;
            }
        }

        return false;
    },

    findPaletteButton(paletteName) {
        // Multiple strategies to find palette buttons
        const strategies = [
            () => document.getElementById(`${paletteName}tabbutton`),
            () => document.getElementById(`${paletteName.charAt(0).toUpperCase()}${paletteName.slice(1)}tabbutton`),
            () => document.querySelector(`[id*="${paletteName}"][id*="tab"]`),
            () => document.querySelector(`[data-palette="${paletteName}"]`),
            () => {
                // Look for buttons containing the palette name
                const buttons = document.querySelectorAll('button, [role="button"]');
                for (const btn of buttons) {
                    if (btn.textContent && btn.textContent.toLowerCase().includes(paletteName.toLowerCase())) {
                        return btn;
                    }
                }
                return null;
            }
        ];

        for (const strategy of strategies) {
            const result = strategy();
            if (result) return result;
        }

        return null;
    },


    showErrorMessage() {
        const errorDiv = document.createElement("div");
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff5722;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        errorDiv.innerHTML = `
            <strong>⚠️ Learning Guide Error</strong><br>
            Music Blocks is not fully loaded yet.<br>
            <button onclick="LG.retryInitialization(); this.parentElement.remove();" 
                    style="margin-top: 10px; padding: 5px 15px; background: white; color: #ff5722; border: none; border-radius: 5px; cursor: pointer;">
                Retry
            </button>
            <button onclick="this.parentElement.remove()" 
                    style="margin: 10px 0 0 10px; padding: 5px 15px; background: rgba(255,255,255,0.2); color: white; border: none; border-radius: 5px; cursor: pointer;">
                Close
            </button>
        `;
        document.body.appendChild(errorDiv);
    },

    retryInitialization() {
        console.log("🔄 Retrying initialization...");
        this.waitStartTime = Date.now();
        this.tryMultipleDetectionMethods();
    },

    prepareStep(step) {
        const activity = getRealActivity();
        let octave = null;

        if (!activity || !activity.blocks?.blockList) {
            this.initialCounts[this.step] = 0;
            console.warn("⚠️ prepareStep: no real activity yet");
            return;
        }

        const blockList = activity.blocks.blockList;
        // 👇 SPECIAL CASE: pitch_inside step
        if (step.action === "pitch_inside") {
            let count = 0;

            for (const id in blockList) {
                const block = blockList[id];
                if (
                    block &&
                    block.name === "pitch" &&
                    !block.trash &&
                    block.container?.visible !== false &&
                    GuideValidator.isPitchInsideNote(block, blockList)
                ) {
                    count++;
                }
            }

            this.initialCounts[this.step] = count;
            console.log(`🎼 Step ${this.step} initial pitch-in-note count:`, count);
            return;
        }

        if (step.action === "octave_change") {
            const activity = getRealActivity();
            const blockList = activity?.blocks?.blockList || {};

            const octaves = [];

            for (const id in blockList) {
                const block = blockList[id];

                // Number blocks connected to pitch blocks
                if (
                    block &&
                    block.name === "number" &&
                    typeof block.value === "number" &&
                    block.connections
                ) {
                    // Check if parent is pitch
                    const parentId = block.connections[0];
                    const parent = blockList[parentId];

                    if (parent && parent.name === "pitch" && !parent.trash) {
                        octaves.push(block.value);
                    }
                }
            }

            this.initialCounts[this.step] = octaves;
            console.log(`🎚️ Step ${this.step} initial octave values:`, octaves);
            return;
        }

        if (step.action === "connect") {
            const activity = getRealActivity();
            const blockList = activity?.blocks?.blockList || {};

            let initialConnection = null;

            for (const id in blockList) {
                const block = blockList[id];
                if (block && block.name === "start" && block.connections) {
                    initialConnection = block.connections[1] || null;
                    break;
                }
            }

            this.initialCounts[this.step] = initialConnection;
            console.log(
                `🔗 Step ${this.step} initial start connection:`,
                initialConnection
            );
            return;
        }

        if (step.action === "play") {
            window._lgPlayState.started = false;
            window._lgPlayState.ended = false;
            console.log("🎵 Play state reset");
            return;
        }

        if (step.action === "melody") {
            const activity = getRealActivity();
            const blockList = activity?.blocks?.blockList || {};

            let noteCount = 0;

            for (const id in blockList) {
                const block = blockList[id];
                if (
                    block &&
                    block.name &&
                    block.name.toLowerCase().includes("note") &&
                    !block.trash &&
                    block.container?.visible !== false
                ) {
                    noteCount++;
                }
            }

            this.initialCounts[this.step] = noteCount;

            console.log(
                `🎵 Step ${this.step} initial note count:`,
                noteCount
            );
            return;
        }

        if (step.action === "tone_block") {
            const activity = getRealActivity();
            const blockList = activity?.blocks?.blockList || {};

            // store IDs, not just count
            const existingIds = [];

            for (const id in blockList) {
                if (
                    blockList[id]?.name === "voicename" &&
                    !blockList[id].trash
                ) {
                    existingIds.push(id);
                }
            }

            this.initialCounts[this.step] = existingIds;
            console.log("🎶 Initial voicename IDs:", existingIds);
            return;
        }

        const blockName = step.block;

        let count = 0;
        for (const id in blockList) {
            const block = blockList[id];
            if (block && block.name === blockName && !block.trash) {
                count++;
            }
        }

        this.initialCounts[this.step] = count;
        console.log(
            `🧮 Step ${this.step} initial ${blockName}:`,
            count
        );
    },

    getBlockList() {
        // Try window.activity first
        let activity = getRealActivity();

        // Fallback to globalActivity if available
        if (!activity && typeof globalActivity !== 'undefined') {
            console.log("📋 Using globalActivity instead of window.activity");
            activity = globalActivity;
        }

        if (!activity) {
            console.log("⚠️ No activity found (checked window.activity and globalActivity)");
            return {};
        }
        if (!activity.blocks) {
            console.log("⚠️ activity.blocks is null/undefined");
            return {};
        }
        if (!activity.blocks.blockList) {
            console.log("⚠️ activity.blocks.blockList is null/undefined");
            return {};
        }

        const blockList = activity.blocks.blockList;
        const isArray = Array.isArray(blockList);
        const length = isArray ? blockList.length : Object.keys(blockList).length;

        console.log("📋 Getting blockList:", {
            type: isArray ? 'Array' : typeof blockList,
            length: length,
            sampleKeys: Object.keys(blockList).slice(0, 10)
        });

        // Also check if there are any blocks at all
        if (length > 0) {
            let sampleNames = [];
            for (const id in blockList) {
                if (isArray && isNaN(parseInt(id))) continue;
                const block = blockList[id];
                if (block && block.name) {
                    sampleNames.push(block.name);
                    if (sampleNames.length >= 5) break;
                }
            }
            console.log("📋 Sample block names:", sampleNames);
        }

        return blockList;
    },

    countBlocksByName(blockList, blockName) {
        if (!blockList) {
            console.log(`⚠️ BlockList is null/undefined when counting ${blockName}`);
            return 0;
        }

        // Debug: Check blockList structure
        const isArray = Array.isArray(blockList);
        const length = isArray ? blockList.length : Object.keys(blockList).length;
        console.log(`🔍 BlockList type:`, isArray ? 'Array' : typeof blockList, `Length:`, length);

        // Use for...in loop - works for both arrays and objects
        let count = 0;
        const blockNames = [];
        const allBlocks = [];
        let nullCount = 0;

        for (const blockId in blockList) {
            // Skip non-numeric indices for arrays (like methods/properties)
            if (isArray && isNaN(parseInt(blockId))) {
                continue;
            }

            const block = blockList[blockId];
            if (!block) {
                nullCount++;
                continue;
            }

            allBlocks.push({ id: blockId, name: block.name || 'no-name' });
            const blockNameValue = block.name;

            if (blockNameValue) {
                blockNames.push(blockNameValue);
                if (blockNameValue === blockName) {
                    count++;
                    console.log(`✅ Found matching block! ID: ${blockId}, Name: ${blockNameValue}`);
                }
            }
        }

        // Always log for debugging
        console.log(`🔍 Block counting results:`);
        console.log(`  - Total entries in blockList: ${length}`);
        console.log(`  - Valid blocks: ${allBlocks.length}, Null entries: ${nullCount}`);
        console.log(`  - Matching "${blockName}": ${count}`);
        if (blockNames.length > 0) {
            console.log(`  - All block names:`, blockNames);
        } else if (allBlocks.length > 0) {
            console.log(`  - Blocks without names:`, allBlocks);
        } else {
            console.log(`  - ⚠️ No blocks found in blockList!`);
        }

        return count;
    },

    start() {
        if (this.active) {
            console.log("Guide already active, skipping start");
            return;
        }

        console.log("🎵 Starting Learning Guide!");
        this.active = true;
        this.step = 0;
        this.prepareStep(GuideSteps[this.step]);
        GuideUI.show(GuideSteps[this.step]);
        this.watch();
    },

    watch() {
        clearInterval(this.interval);
        const step = GuideSteps[this.step];

        console.log(`👀 Watching step ${this.step}:`, step.id);

        // Handle different step types
        if (step.action === "palette") {
            this.watchPaletteStep(step);
        } else {
            this.watchRegularStep(step);
        }
    },

    watchPaletteStep(step) {
        let attempts = 0;
        const maxAttempts = 60; // 30 seconds max (60 * 500ms)

        const checkPalette = () => {
            attempts++;

            const isComplete = GuideValidator.check(step);
            if (isComplete) {
                console.log(`✅ Step ${this.step} completed!`);
                clearInterval(this.interval);
                GuideUI.unlock();
                return;
            }

            if (attempts >= maxAttempts) {
                console.warn(`⚠️ Palette step ${step.id} timed out after ${maxAttempts * 500}ms`);
                clearInterval(this.interval);
                // Don't auto-unlock - let user complete the step manually
                return;
            }
        };

        // Use setInterval for consistency with regular steps
        clearInterval(this.interval);
        this.interval = setInterval(checkPalette, 500);
    },

    watchRegularStep(step) {
        clearInterval(this.interval);
        this.interval = setInterval(() => {
            const isComplete = GuideValidator.check(step);
            if (isComplete) {
                console.log(`✅ Step ${this.step} completed!`);
                clearInterval(this.interval);
                GuideUI.unlock();
            }
        }, 500);
    },

    next() {
        console.log(`⏭️ Attempting to move from step ${this.step}`);

        const currentStep = GuideSteps[this.step];
        const isComplete = GuideValidator.check(currentStep);

        if (!isComplete) {
            console.log(`❌ Step ${this.step} (${currentStep.id}) not completed yet`);
            // Re-enable watching in case validation was missed
            this.watch();
            return;
        }

        // Clear any intervals before moving
        clearInterval(this.interval);

        this.step++;
        if (this.step >= GuideSteps.length) {
            console.log("🎉 Guide completed!");
            GuideUI.finish();
            return;
        }

        const nextStep = GuideSteps[this.step];
        console.log(`➡️ Moving to step ${this.step} (${nextStep.id})`);

        // Prepare step first to capture initial state
        this.prepareStep(nextStep);

        // Then show the step UI (which may trigger actions like opening palettes)
        GuideUI.show(nextStep);

        // Start watching for completion
        this.watch();
    },

    prev() {
        if (this.step === 0) return;

        this.step--;
        console.log(`⬅️ Moving back to step ${this.step}`);
        this.prepareStep(GuideSteps[this.step]);
        GuideUI.show(GuideSteps[this.step]);
        this.watch();
    },

    stop() {
        console.log("⏹️ Stopping Learning Guide");
        this.active = false;
        clearInterval(this.interval);
        GuideUI.close();
    }
};

// Enhanced initialization
document.addEventListener("DOMContentLoaded", () => {
    console.log("📄 DOM loaded, preparing guide initialization...");

    // Wait a bit for other scripts to load
    setTimeout(() => {
        console.log("🚀 Starting guide initialization...");
        const waitPaletteHook = setInterval(() => {
            const activity = getRealActivity();
            if (activity?.blocks?.palettes?.showPalette) {
                clearInterval(waitPaletteHook);

                const original = activity.blocks.palettes.showPalette;
                activity.blocks.palettes.showPalette = function (name) {
                    window._lgLastPalette = name;
                    return original.call(this, name);
                };

                console.log("🎯 Learning Guide palette hook installed");
            }
        }, 300);
        LG.init();
    }, 2000); // Wait 2 seconds after DOM ready
});

// Also try after window load as fallback
window.addEventListener("load", () => {
    setTimeout(() => {
        if (!LG.active) {
            console.log("🔄 DOM fallback: Retrying guide initialization...");
            LG.init();
        }
    }, 1000);
});
