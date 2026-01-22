window.GuideUI = {
    show(step) {
        console.log(`Showing step: ${step.id}`);
        this.clearHighlights();
        
        // Create or update overlay first
        this.createOverlay(step);
        
        // Highlight target elements before opening palette (so user can see what to click)
        this.highlightElements(step);
        
        // Handle palette opening - but don't mark as complete, user needs to actually open it
        // Only try to open if the activity is fully loaded and palette system is ready
        
        // Create or update panel
        this.createPanel(step);
    },

    createOverlay(step) {
        let overlay = document.querySelector(".lg-overlay");
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.className = "lg-overlay";
            document.body.appendChild(overlay);
        }

        // Adjust overlay based on step type
        overlay.style.pointerEvents = "none";
    },

    highlightElements(step) {
        // Highlight target element
        if (step.target) {
            const el = document.querySelector(step.target);
            if (el) {
                el.classList.add("lg-highlight");
                console.log(`Highlighted target: ${step.target}`);
            } else {
                console.warn(`Target not found: ${step.target}`);
            }
        }

        // Highlight palette button and add arrow
        if (step.palette) {
            const btn = this.findPaletteButton(step.palette);
            if (btn) {
                btn.classList.add("lg-pulse");
                this.addArrow(btn);
                console.log(`Highlighted palette button: ${step.palette}`);
            } else {
                console.warn(`Palette button not found: ${step.palette}`);
            }
        }

        if (step.action === "octave_change"){
            document.querySelectorAll('.number').forEach(el => {
                el.classList.add('lg-highlight');
            });
        }
    },

    findPaletteButton(paletteName) {
        // Try multiple patterns
        const patterns = [
            `${paletteName}tabbutton`,
            `${paletteName.charAt(0).toUpperCase()}${paletteName.slice(1)}tabbutton`,
            paletteName
        ];

        for (const pattern of patterns) {
            const el = document.getElementById(pattern);
            if (el) return el;
        }

        // Fallback: search by content or partial ID
        const buttons = document.querySelectorAll('[id*="tabbutton"], [id*="palette"]');
        for (const btn of buttons) {
            if (btn.id.toLowerCase().includes(paletteName.toLowerCase())) {
                return btn;
            }
        }

        return null;
    },

    addArrow(button) {
        const arrow = document.createElement("div");
        arrow.className = "lg-arrow";
        arrow.id = "lg-arrow";
        
        const rect = button.getBoundingClientRect();
        arrow.style.top = rect.top + rect.height / 2 - 10 + "px";
        arrow.style.left = rect.right + 8 + "px";
        
        document.body.appendChild(arrow);
    },

    createPanel(step) {
        let panel = document.getElementById("lg-panel");
        if (!panel) {
            panel = document.createElement("div");
            panel.id = "lg-panel";
            document.body.appendChild(panel);
        }

        const isCompleted = GuideValidator.check(step);
        
        panel.innerHTML = `
            <div class="lg-header">
                <span>Step ${LG.step + 1} / ${GuideSteps.length}</span>
                <button class="lg-close-btn" onclick="LG.stop()">×</button>
            </div>
            <div class="lg-text">${step.text}</div>
            <div id="lg-status">
                <span class="lg-status-icon">${isCompleted ? "✅" : "⏳"}</span>
                <span>${isCompleted ? "Step completed!" : "Waiting for you to complete this step…"}</span>
            </div>
            <div class="lg-buttons">
                ${LG.step > 0 ? `<button class="lg-btn lg-prev" onclick="LG.prev()">← Previous</button>` : ''}
                <button id="lg-next" class="lg-btn lg-next ${isCompleted ? 'lg-ready' : ''}" 
                        ${isCompleted ? '' : 'disabled'} 
                        ${isCompleted ? '' : 'style="pointer-events: none;"'}
                        onclick="LG.next()">
                    ${LG.step === GuideSteps.length - 1 ? '🎉 Finish' : 'Next →'}
                </button>
                <button class="lg-btn lg-close" onclick="LG.stop()">Close</button>
            </div>
        `;

        // If already completed, enable next button (but this is rare since watch will handle it)
        if (isCompleted) {
            this.unlock();
        }
    },

    clearHighlights() {
        document.querySelectorAll(".lg-highlight").forEach(e => {
            e.classList.remove("lg-highlight");
        });
        document.querySelectorAll(".lg-pulse").forEach(e => {
            e.classList.remove("lg-pulse");
        });
        document.getElementById("lg-arrow")?.remove();
    },

    close() {
        document.querySelector(".lg-overlay")?.remove();
        document.getElementById("lg-panel")?.remove();
        this.clearHighlights();
        clearInterval(LG.interval);
    },

    unlock() {
        const btn = document.getElementById("lg-next");
        const status = document.getElementById("lg-status");
        
        if (btn) {
            btn.disabled = false;
            btn.removeAttribute("style");
            btn.style.pointerEvents = "auto";
            btn.classList.add("lg-ready");
        }
        
        if (status) {
            status.innerHTML = `
                <span class="lg-status-icon">✅</span>
                <span>Step completed! You can continue.</span>
            `;
        }
    },

    finish() {
        this.close();
        // Better finish message
        const finishMsg = document.createElement("div");
        finishMsg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 20px;
            text-align: center;
            z-index: 10001;
            font-family: 'Roboto', sans-serif;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        `;
        finishMsg.innerHTML = `
            <h2 style="margin: 0 0 15px 0;">🎉 Congratulations!</h2>
            <p style="margin: 0 0 20px 0;">You've completed the Music Blocks interactive guide!</p>
            <button onclick="this.parentElement.remove()" style="
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 10px 20px;
                border-radius: 10px;
                cursor: pointer;
                font-weight: 500;
            ">Close</button>
        `;
        document.body.appendChild(finishMsg);
        
        setTimeout(() => finishMsg.remove(), 5000);
    }
};
