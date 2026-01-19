let LG = {
    step: 0,
    active: false,
    interval: null,
    initialCounts: {},
    maxWaitTime: 30000, // 30 seconds max wait
    waitStartTime: null,
    
    init() {
        this.waitStartTime = Date.now();
        console.log("🎵 Learning Guide: Starting initialization...");
        
        // Try multiple detection strategies
        this.tryMultipleDetectionMethods();
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
        if (window.activity && window.activity.blocks && window.activity.blocks.blockList) {
            console.log("✅ Detected via window.activity");
            return true;
        }
        return false;
    },

    // Method 2: Check for canvas and basic UI elements
    detectViaCanvas() {
        const canvas = document.getElementById("myCanvas");
        const paletteButtons = document.querySelectorAll('[id*="tabbutton"]');
        
        if (canvas && paletteButtons.length > 0) {
            console.log("✅ Detected via canvas and palette buttons");
            // Create a minimal activity-like object if needed
            this.ensureActivityObject();
            return true;
        }
        return false;
    },

    // Method 3: Check for palette system
    detectViaPalettes() {
        const paletteBody = document.getElementById("palette");
        const palettes = document.querySelectorAll('[id*="palette"]');
        
        if (paletteBody || palettes.length > 0) {
            console.log("✅ Detected via palette system");
            this.ensureActivityObject();
            return true;
        }
        return false;
    },

    // Method 4: Check for blocks container
    detectViaBlocksContainer() {
        const blocksContainer = document.querySelector('.blocklyMainBackground, [class*="block"], #blockly');
        const startBlock = document.querySelector('[data-name="start"], .start-block');
        
        if (blocksContainer || startBlock) {
            console.log("✅ Detected via blocks container");
            this.ensureActivityObject();
            return true;
        }
        return false;
    },

    // Create minimal activity object if it doesn't exist
    ensureActivityObject() {
        if (!window.activity) {
            console.log("🔧 Creating minimal activity object...");
            window.activity = {
                blocks: {
                    blockList: {},
                    palettes: {
                        activePalette: null,
                        showPalette: (paletteName) => {
                            console.log(`Opening palette: ${paletteName}`);
                            this.openPaletteManually(paletteName);
                            window.activity.blocks.palettes.activePalette = paletteName;
                        }
                    }
                }
            };
        }
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

    // Force start after delay if detection fails
    forceStartAfterDelay() {
        const elapsed = Date.now() - this.waitStartTime;
        
        if (elapsed > this.maxWaitTime) {
            console.warn("⚠️ Max wait time exceeded. Starting guide anyway...");
            this.ensureActivityObject();
            this.start();
            return;
        }

        // Check if basic UI elements exist
        const canvas = document.getElementById("myCanvas");
        const palettes = document.querySelectorAll('[id*="tab"], [id*="palette"]');
        
        if (canvas && palettes.length > 0) {
            console.log("🚀 Basic UI detected. Force starting guide...");
            this.ensureActivityObject();
            this.start();
        } else {
            console.warn("❌ Music Blocks UI not ready. Guide cannot start.");
            this.showErrorMessage();
        }
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
        // Safer block counting with fallbacks
        const blocks = this.getBlockList();
        this.initialCounts[this.step] = this.countBlocksByName(blocks, "newnote");
        console.log(`Step ${this.step} prepared with ${this.initialCounts[this.step]} initial notes`);
    },

    getBlockList() {
        // Multiple ways to get block list
        if (window.activity && window.activity.blocks && window.activity.blocks.blockList) {
            return window.activity.blocks.blockList;
        }
        
        // Fallback: return empty object
        return {};
    },

    countBlocksByName(blockList, blockName) {
        if (!blockList) return 0;
        return Object.values(blockList).filter(b => b && b.name === blockName).length;
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
        const maxAttempts = 20; // 10 seconds max
        
        const checkPalette = () => {
            attempts++;
            
            if (GuideValidator.check(step)) {
                console.log(`✅ Step ${this.step} completed!`);
                GuideUI.unlock();
                return;
            }
            
            if (attempts >= maxAttempts) {
                console.warn(`⚠️ Palette step ${step.id} timed out. Auto-completing...`);
                GuideUI.unlock();
                return;
            }
            
            setTimeout(checkPalette, 500);
        };
        
        checkPalette();
    },

    watchRegularStep(step) {
        this.interval = setInterval(() => {
            if (GuideValidator.check(step)) {
                console.log(`✅ Step ${this.step} completed!`);
                GuideUI.unlock();
                clearInterval(this.interval);
            }
        }, 500);
    },

    next() {
        console.log(`⏭️ Attempting to move from step ${this.step}`);
        
        if (!GuideValidator.check(GuideSteps[this.step])) {
            console.log("❌ Step not completed yet");
            return;
        }

        this.step++;
        if (this.step >= GuideSteps.length) {
            GuideUI.finish();
            return;
        }
        
        console.log(`➡️ Moving to step ${this.step}`);
        this.prepareStep(GuideSteps[this.step]);
        GuideUI.show(GuideSteps[this.step]);
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
