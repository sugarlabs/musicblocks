/**
 * FirstProjectTutorial.js
 *
 * An interactive constructionist tutorial that guides users through creating
 * their first Music Blocks project. Balances guided exploration with
 * reflection — users are challenged to discover, not just follow orders.
 *
 * Philosophy: Constructionism (Seymour Papert)
 *   - Pose challenges, not instructions
 *   - Validate actions without prescribing exact steps
 *   - Add reflection moments after key milestones
 *   - Offer choice points for personal ownership
 *   - End with open-ended invitation, not "Congratulations"
 *
 * @author Divyam Agarwal
 * @copyright 2026
 * @license AGPL-3.0
 */

/* global _, docById */
/* exported FirstProjectTutorial */

/**
 * FirstProjectTutorial - A constructionist onboarding tutorial.
 * Highlights UI elements, poses challenges, validates user actions,
 * and prompts reflection between key milestones.
 */
class FirstProjectTutorial {
    constructor(activity) {
        this.activity = activity;
        this.currentStep = 0;
        this.isActive = false;
        this.overlay = null;
        this.tooltip = null;
        this.spotlight = null;
        this.actionCompleted = false;
        this._checkInterval = null;
        this._hintTimeout = null;
        this._initialBlockCount = 0;
        this._initialNoteCount = 0;
        this._playPressed = false;
        this._savedBlocks = null;
        this._keyHandler = null;

        // Hint delay: show "Need a hint?" after this many ms of no progress
        this.HINT_DELAY_MS = 15000;

        this.steps = this._buildSteps();
    }

    /**
     * Build all tutorial steps.
     * Steps are grouped into phases: Explore, Build, Listen, Personalize, Reflect.
     * @private
     * @returns {Array} The step definitions.
     */
    _buildSteps() {
        return [
            // ── Phase 1: Explore ──────────────────────────────────
            {
                title: _("🎵 Welcome, Composer!"),
                content:
                    _("Every Music Blocks project starts with a special block — the Start block.") +
                    " " +
                    _("Can you spot it on the canvas? It tells Music Blocks where your program begins."),
                hint: _("The Start block is the green block sitting on the canvas — it looks like a flag!"),
                target: () => this._getCanvas(),
                position: "right",
                challenge: _("Look at the canvas and find the Start block."),
                validator: () => true,
                autoComplete: true,
                phase: "explore"
            },

            // ── Phase 2: Build ────────────────────────────────────
            {
                title: _("🥁 Music Needs Rhythm!"),
                content:
                    _("Music is built from notes — sounds with a specific length.") +
                    " " +
                    _("Can you find a block that creates a musical note?") +
                    " " +
                    _("Hint: Explore the Rhythm palette on the left sidebar! 🎵"),
                hint: _("Look at the left sidebar — find the button labeled 'Rhythm' and click it!"),
                target: () => this._findPaletteButton("rhythm"),
                position: "right",
                challenge: _("Open the Rhythm palette to discover note blocks."),
                validator: () => this._isPaletteOpen("rhythm"),
                autoComplete: false,
                phase: "build"
            },
            {
                title: _("🧩 Drag a Note Block"),
                content:
                    _("Great — you found the Rhythm palette!") +
                    " " +
                    _("Now look for the Note block inside it.") +
                    " " +
                    _("Drag it onto the canvas — this is how you create musical sounds."),
                hint: _("In the open palette, find the block labeled 'Note Value'. Click and drag it onto the white canvas area."),
                target: () => this._getCanvas(),
                position: "right",
                challenge: _("Drag a Note block from the palette onto the canvas."),
                validator: () => this._hasMoreBlocks(),
                autoComplete: false,
                allowInteraction: true,
                phase: "build",
                onStart: () => {
                    this._initialNoteCount = this._countBlocksByName("newnote");
                }
            },
            {
                title: _("🔗 Connect the Pieces"),
                content:
                    _("Blocks in Music Blocks snap together like puzzle pieces.") +
                    " " +
                    _("Can you connect your Note block to the Start block?") +
                    " " +
                    _("Drag it close and it will snap into place!"),
                hint: _("Drag the Note block right below the Start block — when you get close enough, they will snap together automatically."),
                target: () => this._getCanvas(),
                position: "right",
                challenge: _("Connect the Note block inside the Start block."),
                validator: () => this._isBlockConnectedToStart("newnote"),
                autoComplete: false,
                allowInteraction: true,
                phase: "build"
            },

            // ── Reflection Moment ─────────────────────────────────
            {
                title: _("🤔 What Did You Build?"),
                content:
                    _("Take a moment to look at what you've created.") +
                    " " +
                    _("The Start block tells Music Blocks to begin, and the Note block creates a beat.") +
                    " " +
                    _("Together, they make a tiny program that plays a sound!") +
                    " " +
                    _("Let's hear it..."),
                target: () => this._getCanvas(),
                position: "right",
                challenge: _("Ready to hear your creation? Click Next!"),
                validator: () => true,
                autoComplete: true,
                phase: "reflect",
                isReflection: true
            },

            // ── Phase 3: Listen ───────────────────────────────────
            {
                title: _("▶️ Bring It to Life!"),
                content:
                    _("Time to hear what you've built!") +
                    " " +
                    _("Press the Play button and listen to your first sound.") +
                    " " +
                    _("What do you hear? 🎶"),
                hint: _("Look for the ▶ Play button in the top toolbar — it's the triangle-shaped button."),
                target: () => docById("play") || docById("runButton"),
                position: "bottom",
                challenge: _("Press the Play button to run your project!"),
                validator: () => this._hasPressedPlay(),
                autoComplete: false,
                phase: "listen",
                onStart: () => {
                    this._playPressed = false;
                    this._setupPlayListener();
                }
            },

            // ── Reflection Moment ─────────────────────────────────
            {
                title: _("🎶 You Made a Sound!"),
                content:
                    _("You just played your first note!") +
                    " " +
                    _("But it was just a default beat — no specific pitch.") +
                    " " +
                    _("What if you could decide WHICH note to play?") +
                    " " +
                    _("Let's give your note a voice..."),
                target: null,
                position: "center",
                challenge: _("Click Next to add a pitch to your note."),
                validator: () => true,
                autoComplete: true,
                phase: "reflect",
                isReflection: true
            },

            // ── Phase 4: Personalize ──────────────────────────────
            {
                title: _("🎹 Choose Your Sound"),
                content:
                    _("Now it's YOUR turn to decide how your music sounds.") +
                    " " +
                    _("Open the Pitch palette — it's where all the musical notes live.") +
                    " " +
                    _("Do, Re, Mi, Fa, Sol, La, Ti... which one will you choose?"),
                hint: _("On the left sidebar, find the 'Pitch' button — it's near the Rhythm button you clicked earlier."),
                target: () => this._findPaletteButton("pitch"),
                position: "right",
                challenge: _("Open the Pitch palette to see the available notes."),
                validator: () => this._isPaletteOpen("pitch"),
                autoComplete: false,
                phase: "personalize"
            },
            {
                title: _("🎵 Give Your Note a Voice"),
                content:
                    _("Find a Pitch block and drag it INSIDE your Note block.") +
                    " " +
                    _("This tells Music Blocks which specific note to play.") +
                    " " +
                    _("Pick any pitch you like — this is YOUR melody!"),
                hint: _("Find the 'Pitch' block in the open palette. Drag it and drop it inside the Note block (between the top and bottom of the Note clamp)."),
                target: () => this._getCanvas(),
                position: "right",
                challenge: _("Drag a Pitch block inside your Note block."),
                validator: () => this._hasPitchInNote(),
                autoComplete: false,
                allowInteraction: true,
                phase: "personalize"
            },
            {
                title: _("🔊 Hear the Difference!"),
                content:
                    _("Press Play again and listen carefully.") +
                    " " +
                    _("Does it sound different from before?") +
                    " " +
                    _("That's the pitch you chose — you're composing music! 🎼"),
                hint: _("Click the ▶ Play button in the toolbar again to hear the difference!"),
                target: () => docById("play") || docById("runButton"),
                position: "bottom",
                challenge: _("Press Play to hear your note with pitch!"),
                validator: () => this._hasPressedPlay(),
                autoComplete: false,
                phase: "listen",
                onStart: () => {
                    this._playPressed = false;
                    this._setupPlayListener();
                }
            },

            // ── Phase 5: Extend the Melody ────────────────────────
            {
                title: _("🎶 One Note Isn't a Melody!"),
                content:
                    _("A melody needs more than one note.") +
                    " " +
                    _("Can you add a SECOND Note block?") +
                    " " +
                    _("Drag another Note from the Rhythm palette and connect it below your first note.") +
                    " " +
                    _("Then add a Pitch block inside it — pick a DIFFERENT pitch this time!"),
                hint: _("Open the Rhythm palette again, drag a new Note block, and snap it below your existing Note. Then open Pitch palette and add a pitch inside this new Note."),
                target: () => this._getCanvas(),
                position: "right",
                challenge: _("Add a second Note block with a pitch."),
                validator: () => this._countNotesWithPitch() >= 2,
                autoComplete: false,
                allowInteraction: true,
                phase: "build",
                onStart: () => {
                    this._initialNoteCount = this._countBlocksByName("newnote");
                }
            },
            {
                title: _("🎵 Now Add a Third Note!"),
                content:
                    _("Great — you have two notes!") +
                    " " +
                    _("Three notes make a much more interesting melody.") +
                    " " +
                    _("Add one more Note+Pitch combo — choose whatever pitch sounds fun to you!"),
                hint: _("Same as before: drag a Note block from Rhythm, connect it below the second note, then add a Pitch inside it."),
                target: () => this._getCanvas(),
                position: "right",
                challenge: _("Add a third Note block with a pitch."),
                validator: () => this._countNotesWithPitch() >= 3,
                autoComplete: false,
                allowInteraction: true,
                phase: "build"
            },

            // ── Reflection: Hear the Melody ───────────────────────
            {
                title: _("🤔 What Will It Sound Like?"),
                content:
                    _("You now have three notes connected together — that's a melody!") +
                    " " +
                    _("Before you press play, try to imagine what it will sound like.") +
                    " " +
                    _("Each pitch you chose will play in order, one after another.") +
                    " " +
                    _("Ready to hear your composition?"),
                target: null,
                position: "center",
                challenge: _("Click Next to play your melody!"),
                validator: () => true,
                autoComplete: true,
                phase: "reflect",
                isReflection: true
            },
            {
                title: _("🎼 Play Your Melody!"),
                content:
                    _("This is the moment — press Play and listen to the melody YOU composed!") +
                    " " +
                    _("Three unique notes, three unique pitches, all chosen by you. 🎶"),
                hint: _("Click the ▶ Play button in the toolbar to hear your 3-note melody!"),
                target: () => docById("play") || docById("runButton"),
                position: "bottom",
                challenge: _("Press Play to hear your melody!"),
                validator: () => this._hasPressedPlay(),
                autoComplete: false,
                phase: "listen",
                onStart: () => {
                    this._playPressed = false;
                    this._setupPlayListener();
                }
            },

            // ── Phase 6: Add Repetition ───────────────────────────
            {
                title: _("🔄 Make It Loop!"),
                content:
                    _("Your melody plays once and stops. But what if you want it to repeat?") +
                    " " +
                    _("The Flow palette has a powerful block called Repeat.") +
                    " " +
                    _("Look at the top of the left sidebar — click the second tab (the circular arrows ↻ icon) to find Flow!"),
                hint: _("At the top of the left sidebar, you'll see small tab icons. Click the second one (↻ arrows) to switch to the Flow/Action palettes. Then click 'Flow'."),
                target: () => this._findPaletteButton("flow"),
                position: "right",
                challenge: _("Open the Flow palette."),
                validator: () => this._isPaletteOpen("flow"),
                autoComplete: false,
                phase: "build"
            },
            {
                title: _("🔁 Wrap Your Melody in a Loop"),
                content:
                    _("Drag a Repeat block onto the canvas.") +
                    " " +
                    _("Then move your Note blocks INSIDE the Repeat block.") +
                    " " +
                    _("Connect the Repeat to the Start block — this will make your melody play multiple times!"),
                hint: _("Drag the Repeat block from the Flow palette. Disconnect your notes from Start, connect Repeat to Start, then put your notes inside the Repeat clamp."),
                target: () => this._getCanvas(),
                position: "right",
                challenge: _("Connect a Repeat block to Start with notes inside."),
                validator: () => this._hasRepeatBlock(),
                autoComplete: false,
                allowInteraction: true,
                phase: "build"
            },
            {
                title: _("🎵 Hear It Loop!"),
                content:
                    _("Press Play and hear your melody repeat!") +
                    " " +
                    _("Notice how the Repeat block plays your notes over and over.") +
                    " " +
                    _("You can change the number in the Repeat block to control how many times it loops."),
                hint: _("Click the ▶ Play button to hear your looping melody!"),
                target: () => docById("play") || docById("runButton"),
                position: "bottom",
                challenge: _("Press Play to hear your melody loop!"),
                validator: () => this._hasPressedPlay(),
                autoComplete: false,
                phase: "listen",
                onStart: () => {
                    this._playPressed = false;
                    this._setupPlayListener();
                }
            },

            // ── Reflection: Default Sound ─────────────────────────
            {
                title: _("🤔 Sounds a Bit... Electronic?"),
                content:
                    _("Your melody loops — great!") +
                    " " +
                    _("But it doesn't sound like a real instrument yet.") +
                    " " +
                    _("What if you could make it sound like a guitar, piano, or violin?") +
                    " " +
                    _("The Tone palette has a special block for choosing instruments!"),
                target: null,
                position: "center",
                challenge: _("Click Next to give your melody a voice!"),
                validator: () => true,
                autoComplete: true,
                phase: "reflect",
                isReflection: true
            },

            // ── Phase 7: Set Instrument ────────────────────────────
            {
                title: _("🎸 Choose Your Instrument!"),
                content:
                    _("Open the Tone palette from the left sidebar.") +
                    " " +
                    _("Inside you'll find a 'Set Instrument' block.") +
                    " " +
                    _("This lets you pick any instrument — guitar, piano, violin, flute, and more!"),
                hint: _("Switch back to the first sidebar tab (♩ music notes icon) if needed, then look for 'Tone' — it's below Volume."),
                target: () => this._findPaletteButton("tone"),
                position: "right",
                challenge: _("Open the Tone palette."),
                validator: () => this._isPaletteOpen("tone"),
                autoComplete: false,
                phase: "personalize"
            },
            {
                title: _("🎹 Wrap Your Music in an Instrument"),
                content:
                    _("Drag a 'Set Instrument' block onto the canvas.") +
                    " " +
                    _("Connect it to the Start block and put your Repeat block INSIDE it.") +
                    " " +
                    _("Click on the instrument name to choose your favorite — guitar, piano, cello... it's YOUR sound!"),
                hint: _("Drag 'Set Instrument' from Tone palette. Disconnect Repeat from Start. Connect Set Instrument to Start, then put Repeat inside the Set Instrument clamp."),
                target: () => this._getCanvas(),
                position: "right",
                challenge: _("Add a Set Instrument block to your project."),
                validator: () => this._hasSetTimbreBlock(),
                autoComplete: false,
                allowInteraction: true,
                phase: "personalize"
            },
            {
                title: _("🎶 The Grand Finale!"),
                content:
                    _("This is it — your complete composition!") +
                    " " +
                    _("A melody with pitches YOU chose, looping on an instrument YOU picked.") +
                    " " +
                    _("Press Play and enjoy your creation! 🎵🎶🎵"),
                hint: _("Click the ▶ Play button for the final time!"),
                target: () => docById("play") || docById("runButton"),
                position: "bottom",
                challenge: _("Press Play for the grand finale!"),
                validator: () => this._hasPressedPlay(),
                autoComplete: false,
                phase: "listen",
                onStart: () => {
                    this._playPressed = false;
                    this._setupPlayListener();
                }
            },

            // ── Final Reflection & Open-Ended Invitation ──────────
            {
                title: _("🌟 You Composed a Song!"),
                content:
                    _("You just created a real composition in Music Blocks!") +
                    " " +
                    _("You discovered blocks, built a melody, chose an instrument, and made it loop.") +
                    " " +
                    _("Everything you hear was designed by YOU.") +
                    "<br/><br/>" +
                    _("Keep exploring:") +
                    "<br/>" +
                    "🥁 " + _("Add a second Start block with Drums for percussion") +
                    "<br/>" +
                    "🎨 " + _("Explore Graphics — your mouse draws while it plays!") +
                    "<br/>" +
                    "📦 " + _("Use Action blocks to name and reuse your melodies") +
                    "<br/>" +
                    "🎵 " + _("Try changing note durations — use 1/8 for faster notes, 1/2 for slower") +
                    "<br/><br/>" +
                    _("There's no wrong way to explore. What will YOU create next?"),
                target: null,
                position: "center",
                challenge: _("Click Finish whenever you're ready to explore on your own!"),
                validator: () => true,
                autoComplete: true,
                isLast: true,
                phase: "reflect",
                isReflection: true
            }
        ];
    }

    /**
     * Start the tutorial.
     * Prepares a clean canvas with only a Start block, then begins.
     */
    start() {
        this.isActive = true;
        this.currentStep = 0;
        this._prepareCleanCanvas();
        this._createOverlay();
        this._setupKeyboardNav();
        this._showStep(0);
    }

    /**
     * Stop the tutorial and clean up.
     */
    stop() {
        this.isActive = false;
        this._stopChecking();
        this._stopHintTimer();
        this._removeKeyboardNav();
        this._removeOverlay();
    }

    /**
     * Move to the next step.
     */
    nextStep() {
        this._stopChecking();
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this._showStep(this.currentStep);
        } else {
            this.stop();
        }
    }

    /**
     * Move to the previous step.
     */
    prevStep() {
        this._stopChecking();
        if (this.currentStep > 0) {
            this.currentStep--;
            this._showStep(this.currentStep);
        }
    }

    // ========================================
    // UI RENDERING
    // ========================================

    /**
     * Create the overlay elements.
     * @private
     */
    _createOverlay() {
        this._removeOverlay();

        // Main overlay
        this.overlay = document.createElement("div");
        this.overlay.id = "tutorial-overlay";
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9998;
            pointer-events: none;
        `;

        // Spotlight
        this.spotlight = document.createElement("div");
        this.spotlight.id = "tutorial-spotlight";
        this.spotlight.style.cssText = `
            position: fixed;
            border-radius: 8px;
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6);
            z-index: 9999;
            pointer-events: none;
            transition: all 0.3s ease;
            border: 3px solid #7C4DFF;
        `;

        // Tooltip
        this.tooltip = document.createElement("div");
        this.tooltip.id = "tutorial-tooltip";
        this.tooltip.style.cssText = `
            position: fixed;
            background: #ffffff;
            border-radius: 12px;
            padding: 24px;
            max-width: 380px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            font-family: 'Roboto', sans-serif;
            color: #333;
            pointer-events: auto;
            border: none;
            border-top: 4px solid #7C4DFF;
        `;

        document.body.appendChild(this.overlay);
        document.body.appendChild(this.spotlight);
        document.body.appendChild(this.tooltip);
    }

    /**
     * Remove overlay elements.
     * @private
     */
    _removeOverlay() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        if (this.spotlight) {
            this.spotlight.remove();
            this.spotlight = null;
        }
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }
    }

    /**
     * Display a specific step.
     * @private
     * @param {number} stepIndex
     */
    _showStep(stepIndex) {
        const step = this.steps[stepIndex];
        if (!step) return;

        this.actionCompleted = false;

        // Run onStart callback if defined
        if (step.onStart) {
            step.onStart();
        }

        const targetElement = step.target ? step.target() : null;

        // Position spotlight
        if (targetElement) {
            const rect = targetElement.getBoundingClientRect();
            const padding = 15;
            this.spotlight.style.display = "block";
            this.spotlight.style.top = rect.top - padding + "px";
            this.spotlight.style.left = rect.left - padding + "px";
            this.spotlight.style.width = rect.width + padding * 2 + "px";
            this.spotlight.style.height = rect.height + padding * 2 + "px";
        } else {
            this.spotlight.style.display = "none";
        }

        // Adjust overlay for interaction steps
        if (step.allowInteraction) {
            this.overlay.style.background = "rgba(0, 0, 0, 0.15)";
            this.spotlight.style.boxShadow = "0 0 0 9999px rgba(0, 0, 0, 0.15)";
        } else {
            this.overlay.style.background = "rgba(0, 0, 0, 0.5)";
            this.spotlight.style.boxShadow = "0 0 0 9999px rgba(0, 0, 0, 0.6)";
        }
        this.spotlight.style.pointerEvents = "none";

        // Check completion state
        const isCompleted = step.autoComplete || step.validator();

        // Phase colors
        const phaseColors = {
            explore: { bg: "#E3F2FD", accent: "#1976D2", icon: "🔍" },
            build: { bg: "#FFF3E0", accent: "#E65100", icon: "🔨" },
            listen: { bg: "#E8F5E9", accent: "#2E7D32", icon: "🎧" },
            personalize: { bg: "#F3E5F5", accent: "#7B1FA2", icon: "✨" },
            reflect: { bg: "#FFF8E1", accent: "#F57F17", icon: "💭" }
        };
        const phase = phaseColors[step.phase] || phaseColors.explore;

        // Build tooltip HTML
        const progressDots = this.steps
            .map((s, i) => {
                const dotColor =
                    i < stepIndex ? "#7C4DFF" : i === stepIndex ? "#7C4DFF" : "#E0E0E0";
                const dotSize = i === stepIndex ? "10px" : "6px";
                return `<span style="
                    display: inline-block;
                    width: ${dotSize};
                    height: ${dotSize};
                    border-radius: 50%;
                    background: ${dotColor};
                    margin: 0 2px;
                    transition: all 0.2s ease;
                    ${i < stepIndex ? "opacity: 0.6;" : ""}
                "></span>`;
            })
            .join("");

        // Reflection steps get a special warm styling
        const tooltipBorderColor = step.isReflection ? "#FFC107" : "#7C4DFF";
        this.tooltip.style.borderTop = `4px solid ${tooltipBorderColor}`;

        this.tooltip.innerHTML = `
            <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="
                        background: ${phase.bg};
                        color: ${phase.accent};
                        padding: 4px 10px;
                        border-radius: 12px;
                        font-size: 11px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    ">${phase.icon} ${step.phase}</span>
                </div>
                <button id="tutorial-close" style="
                    background: transparent;
                    border: none;
                    color: #999;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 0 4px;
                    line-height: 1;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                " onmouseover="this.style.color='#333';this.style.background='#f0f0f0';"
                   onmouseout="this.style.color='#999';this.style.background='transparent';"
                >×</button>
            </div>
            <h3 style="
                margin: 0 0 10px 0;
                font-size: 17px;
                font-weight: 700;
                color: #1a1a1a;
                line-height: 1.3;
            ">${step.title}</h3>
            <p style="
                margin: 0 0 16px 0;
                color: #555;
                line-height: 1.6;
                font-size: 13.5px;
            ">${step.content}</p>
            <div id="tutorial-challenge" style="
                background: ${step.isReflection ? "#FFFDE7" : "#F5F5F5"};
                padding: 12px 16px;
                border-radius: 8px;
                margin-bottom: 8px;
                font-weight: 500;
                font-size: 13px;
                color: #333;
                display: flex;
                align-items: center;
                gap: 10px;
                border-left: 3px solid ${step.isReflection ? "#FFC107" : phase.accent};
            ">
                <span id="challenge-icon" style="font-size: 16px;">${isCompleted ? "✅" : step.isReflection ? "💭" : "🎯"}</span>
                <span id="challenge-text">${isCompleted ? _("Ready! Click Next to continue.") : step.challenge
            }</span>
            </div>
            <div id="tutorial-hint" style="display: none; margin-bottom: 12px;"></div>
            <div style="display: flex; align-items: center; gap: 10px;">
                ${stepIndex > 0
                ? `<button id="tutorial-prev" style="
                            padding: 10px 14px;
                            background: #f5f5f5;
                            border: 1px solid #e0e0e0;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 13px;
                            font-weight: 500;
                            color: #666;
                            transition: all 0.2s ease;
                        " onmouseover="this.style.background='#eee';"
                           onmouseout="this.style.background='#f5f5f5';">← Back</button>`
                : ""
            }
                <button id="tutorial-next" style="
                    flex: 1;
                    padding: 10px 20px;
                    background: ${isCompleted ? "#7C4DFF" : "#ccc"};
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: ${isCompleted ? "pointer" : "not-allowed"};
                    font-size: 14px;
                    font-weight: 600;
                    opacity: ${isCompleted ? "1" : "0.7"};
                    transition: all 0.2s ease;
                    ${isCompleted ? "box-shadow: 0 2px 8px rgba(124, 77, 255, 0.3);" : ""}
                " ${isCompleted ? "" : "disabled"}
                  ${isCompleted ? 'onmouseover="this.style.background=\'#651FFF\';" onmouseout="this.style.background=\'#7C4DFF\';"' : ""}
                >${step.isLast ? "🚀 " + _("Start Exploring!") : _("Next") + " →"}</button>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                <span style="font-size: 10px; color: #aaa;">${_("Esc to close • ←→ to navigate")}</span>
                <div>${progressDots}</div>
            </div>
        `;

        // Position tooltip
        this._positionTooltip(targetElement, step.position);

        // Set up event listeners
        this._setupTooltipListeners(step, isCompleted);

        // Start validation polling and hint timer if needed
        if (!step.autoComplete && !isCompleted) {
            this._startChecking(step);
            if (step.hint) {
                this._startHintTimer(step);
            }
        }
    }

    /**
     * Setup tooltip button listeners.
     * @private
     */
    _setupTooltipListeners(step, isCompleted) {
        const nextBtn = docById("tutorial-next");
        const prevBtn = docById("tutorial-prev");
        const closeBtn = docById("tutorial-close");

        if (nextBtn && isCompleted) {
            nextBtn.onclick = () => this.nextStep();
        }
        if (prevBtn) {
            prevBtn.onclick = () => this.prevStep();
        }
        if (closeBtn) {
            closeBtn.onclick = () => this.stop();
        }
    }

    /**
     * Start polling for action completion.
     * @private
     */
    _startChecking(step) {
        this._stopChecking();
        this._checkInterval = setInterval(() => {
            if (step.validator()) {
                this._onActionCompleted(step);
            }
        }, 500);
    }

    /**
     * Stop polling for action completion.
     * @private
     */
    _stopChecking() {
        if (this._checkInterval) {
            clearInterval(this._checkInterval);
            this._checkInterval = null;
        }
    }

    /**
     * Called when the user completes the required action.
     * @private
     */
    _onActionCompleted(step) {
        this._stopChecking();
        this._stopHintTimer();
        this.actionCompleted = true;

        const icon = docById("challenge-icon");
        const text = docById("challenge-text");
        const nextBtn = docById("tutorial-next");
        const hintArea = docById("tutorial-hint");

        if (icon) icon.textContent = "✅";
        if (text) text.textContent = _("Well done! Click Next to continue.");
        if (hintArea) hintArea.style.display = "none";

        if (nextBtn) {
            nextBtn.style.background = "#7C4DFF";
            nextBtn.style.cursor = "pointer";
            nextBtn.style.opacity = "1";
            nextBtn.style.boxShadow = "0 2px 8px rgba(124, 77, 255, 0.3)";
            nextBtn.disabled = false;
            nextBtn.onclick = () => this.nextStep();
            nextBtn.onmouseover = () => {
                nextBtn.style.background = "#651FFF";
            };
            nextBtn.onmouseout = () => {
                nextBtn.style.background = "#7C4DFF";
            };

            // Subtle celebration: pulse the button
            nextBtn.style.transform = "scale(1.05)";
            setTimeout(() => {
                if (nextBtn) nextBtn.style.transform = "scale(1)";
            }, 200);
        }
    }

    // ========================================
    // CLEAN STARTING STATE
    // ========================================

    /**
     * Clear the canvas and load a bare Start block.
     * This ensures the tutorial starts from a clean state regardless
     * of what was previously on the canvas.
     * @private
     */
    _prepareCleanCanvas() {
        const activity = this._getActivity();
        if (!activity) return;

        // Use the app's built-in sendAllToTrash mechanism.
        // sendAllToTrash(addStartBlock, doNotSave, closeAllWidgets)
        // We pass (false, true, true) = don't add default stack, don't save empty state, close widgets
        if (typeof activity.sendAllToTrash === "function") {
            activity.sendAllToTrash(false, true, true);
        }

        // Load a bare Start block (no pre-built melody)
        const bareStartBlock = [
            [0, "start", screen.width / 3, 150, [null, null, null]]
        ];

        if (activity.blocks && typeof activity.blocks.loadNewBlocks === "function") {
            activity.blocks.loadNewBlocks(bareStartBlock);
        }
    }

    // ========================================
    // HINT SYSTEM
    // ========================================

    /**
     * Start a timer that shows a "Need a hint?" link after HINT_DELAY_MS.
     * @private
     */
    _startHintTimer(step) {
        this._stopHintTimer();
        this._hintTimeout = setTimeout(() => {
            this._showHintLink(step);
        }, this.HINT_DELAY_MS);
    }

    /**
     * Stop the hint timer.
     * @private
     */
    _stopHintTimer() {
        if (this._hintTimeout) {
            clearTimeout(this._hintTimeout);
            this._hintTimeout = null;
        }
    }

    /**
     * Show a subtle "Need a hint?" link below the challenge box.
     * @private
     */
    _showHintLink(step) {
        const hintArea = docById("tutorial-hint");
        if (!hintArea || !step.hint) return;

        hintArea.innerHTML = `
            <a id="tutorial-hint-link" href="#" style="
                color: #7C4DFF;
                font-size: 12px;
                text-decoration: none;
                font-weight: 500;
                transition: opacity 0.3s ease;
            ">💡 ${_("Need a hint?")}</a>
        `;
        hintArea.style.display = "block";
        hintArea.style.opacity = "0";
        // Fade in
        requestAnimationFrame(() => {
            hintArea.style.transition = "opacity 0.5s ease";
            hintArea.style.opacity = "1";
        });

        const hintLink = docById("tutorial-hint-link");
        if (hintLink) {
            hintLink.onclick = (e) => {
                e.preventDefault();
                this._revealHint(step);
            };
        }
    }

    /**
     * Replace the "Need a hint?" link with the actual hint text.
     * @private
     */
    _revealHint(step) {
        const hintArea = docById("tutorial-hint");
        if (!hintArea || !step.hint) return;

        hintArea.innerHTML = `
            <div style="
                background: #EDE7F6;
                padding: 10px 14px;
                border-radius: 6px;
                font-size: 12.5px;
                color: #4527A0;
                line-height: 1.5;
                border-left: 3px solid #7C4DFF;
            ">💡 ${step.hint}</div>
        `;
    }

    // ========================================
    // KEYBOARD NAVIGATION
    // ========================================

    /**
     * Set up keyboard event handler.
     * Escape = close, → = next (if enabled), ← = back
     * @private
     */
    _setupKeyboardNav() {
        this._removeKeyboardNav();
        this._keyHandler = (e) => this._onKeyDown(e);
        document.addEventListener("keydown", this._keyHandler);
    }

    /**
     * Remove keyboard event handler.
     * @private
     */
    _removeKeyboardNav() {
        if (this._keyHandler) {
            document.removeEventListener("keydown", this._keyHandler);
            this._keyHandler = null;
        }
    }

    /**
     * Handle keyboard events.
     * @private
     */
    _onKeyDown(event) {
        if (!this.isActive) return;

        switch (event.key) {
            case "Escape":
                event.preventDefault();
                this.stop();
                break;
            case "ArrowRight":
                if (this.actionCompleted || this.steps[this.currentStep].autoComplete) {
                    event.preventDefault();
                    this.nextStep();
                }
                break;
            case "ArrowLeft":
                event.preventDefault();
                this.prevStep();
                break;
        }
    }

    /**
     * Position the tooltip relative to target.
     * @private
     */
    _positionTooltip(targetElement, position) {
        if (!targetElement || position === "center") {
            this.tooltip.style.top = "50%";
            this.tooltip.style.left = "50%";
            this.tooltip.style.transform = "translate(-50%, -50%)";
            return;
        }

        const rect = targetElement.getBoundingClientRect();
        const padding = 25;

        this.tooltip.style.transform = "none";

        switch (position) {
            case "right":
                this.tooltip.style.top = Math.max(20, rect.top) + "px";
                this.tooltip.style.left = rect.right + padding + "px";
                break;
            case "left":
                this.tooltip.style.top = Math.max(20, rect.top) + "px";
                this.tooltip.style.left = rect.left - 420 - padding + "px";
                break;
            case "bottom":
                this.tooltip.style.top = rect.bottom + padding + "px";
                this.tooltip.style.left = Math.max(20, rect.left) + "px";
                break;
            case "top":
                this.tooltip.style.top = rect.top - 280 - padding + "px";
                this.tooltip.style.left = Math.max(20, rect.left) + "px";
                break;
            default:
                this.tooltip.style.top = Math.max(20, rect.top) + "px";
                this.tooltip.style.left = rect.right + padding + "px";
        }

        // Keep tooltip on screen
        const tooltipRect = this.tooltip.getBoundingClientRect();
        if (tooltipRect.right > window.innerWidth - 20) {
            this.tooltip.style.left = window.innerWidth - 420 + "px";
        }
        if (tooltipRect.bottom > window.innerHeight - 20) {
            this.tooltip.style.top = window.innerHeight - 380 + "px";
        }
        if (parseFloat(this.tooltip.style.left) < 20) {
            this.tooltip.style.left = "20px";
        }
        if (parseFloat(this.tooltip.style.top) < 20) {
            this.tooltip.style.top = "20px";
        }
    }

    // ========================================
    // VALIDATORS - Detect user actions
    // ========================================

    /**
     * Get the main canvas element.
     * @private
     */
    _getCanvas() {
        return docById("myCanvas") || docById("canvas");
    }

    /**
     * Find a palette button by name.
     * @private
     */
    _findPaletteButton(paletteName) {
        const patterns = [
            paletteName.charAt(0).toUpperCase() + paletteName.slice(1) + "tabbutton",
            paletteName + "tabbutton",
            paletteName
        ];

        for (const pattern of patterns) {
            const el = docById(pattern);
            if (el) return el;
        }

        const buttons = document.querySelectorAll('[id*="palette"], [id*="tabbutton"]');
        for (const btn of buttons) {
            if (btn.id.toLowerCase().includes(paletteName.toLowerCase())) {
                return btn;
            }
        }

        return null;
    }

    /**
     * Get the activity object with fallback.
     * @private
     */
    _getActivity() {
        if (this.activity && this.activity.blocks) {
            return this.activity;
        }
        if (window.activity && window.activity.blocks) {
            return window.activity;
        }
        return null;
    }

    /**
     * Check if a palette is currently open.
     * @private
     */
    _isPaletteOpen(paletteName) {
        const activity = this._getActivity();

        // Method 1: Check via palettes.activePalette
        if (activity && activity.blocks && activity.blocks.palettes) {
            const palettes = activity.blocks.palettes;
            if (palettes.activePalette === paletteName) {
                return true;
            }
        }

        // Method 2: Check PaletteBody element
        const paletteBody = document.getElementById("PaletteBody");
        if (paletteBody) {
            const headerSpan = paletteBody.querySelector("thead span");
            if (headerSpan) {
                const headerText = headerSpan.textContent.toLowerCase();
                if (
                    headerText === paletteName.toLowerCase() ||
                    headerText.includes(paletteName.toLowerCase())
                ) {
                    return true;
                }
            }

            const labelImg = paletteBody.querySelector("thead img");
            if (labelImg && labelImg.src) {
                if (labelImg.src.toLowerCase().includes(paletteName.toLowerCase())) {
                    return true;
                }
            }
        }

        // Method 3: Check PaletteBody_items
        const paletteItems = document.getElementById("PaletteBody_items");
        if (paletteItems && paletteItems.children.length > 0) {
            if (activity && activity.blocks && activity.blocks.palettes) {
                if (activity.blocks.palettes.activePalette === paletteName) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Count blocks of a specific type.
     * @private
     */
    _countBlocksByName(blockName) {
        const activity = this._getActivity();
        if (!activity || !activity.blocks || !activity.blocks.blockList) {
            return 0;
        }

        let count = 0;
        const blockList = activity.blocks.blockList;
        for (const blockId in blockList) {
            const block = blockList[blockId];
            if (block && block.name === blockName) {
                count++;
            }
        }
        return count;
    }

    /**
     * Check if more note blocks were added since step started.
     * @private
     */
    _hasMoreBlocks() {
        const currentCount = this._countBlocksByName("newnote");
        const initialCount = this._initialNoteCount || 0;
        return currentCount > initialCount;
    }

    /**
     * Check if a block of the given name exists anywhere in the chain
     * starting from the Start block. Traverses clamp inner connections too.
     * Checks ALL start blocks (in case there are duplicates).
     * @private
     */
    _isBlockConnectedToStart(blockName) {
        const activity = this._getActivity();
        if (!activity || !activity.blocks || !activity.blocks.blockList) {
            return false;
        }

        const blockList = activity.blocks.blockList;

        // Find ALL non-trashed start blocks
        const startBlocks = [];
        for (const blockId in blockList) {
            if (blockList[blockId] && blockList[blockId].name === "start" && !blockList[blockId].trash) {
                startBlocks.push(blockList[blockId]);
            }
        }

        // Check each start block — return true if ANY has the target block
        for (const startBlock of startBlocks) {
            if (!startBlock.connections || startBlock.connections[1] === null) continue;

            // BFS traversal from start's flow connection
            const visited = new Set();
            const queue = [startBlock.connections[1]];

            while (queue.length > 0) {
                const currentId = queue.shift();
                if (currentId === null || currentId === undefined || visited.has(currentId)) continue;
                visited.add(currentId);

                const block = blockList[currentId];
                if (!block || block.trash) continue;

                if (block.name === blockName) {
                    return true;
                }

                // Follow ALL connections except parent (index 0)
                if (block.connections) {
                    for (let i = 1; i < block.connections.length; i++) {
                        if (block.connections[i] !== null) {
                            queue.push(block.connections[i]);
                        }
                    }
                }
            }
        }

        return false;
    }

    /**
     * Check if pitch block is inside a note block.
     * Traverses the block hierarchy upward.
     * @private
     */
    _hasPitchInNote() {
        const activity = this._getActivity();
        if (!activity || !activity.blocks || !activity.blocks.blockList) {
            return false;
        }

        const blockList = activity.blocks.blockList;

        for (const blockId in blockList) {
            const block = blockList[blockId];
            if (block && block.name === "pitch") {
                // Traverse up to find if this pitch is inside a note
                let currentBlock = block;
                let depth = 0;
                const maxDepth = 10;

                while (currentBlock && depth < maxDepth) {
                    const connections = currentBlock.connections;
                    if (!connections || connections[0] === null) {
                        break;
                    }

                    const parentId = connections[0];
                    const parent = blockList[parentId];

                    if (!parent) {
                        break;
                    }

                    if (parent.name === "newnote" || parent.name === "note") {
                        return true;
                    }

                    currentBlock = parent;
                    depth++;
                }
            }
        }

        return false;
    }

    /**
     * Count the number of Note blocks that have at least one Pitch inside.
     * Used to validate that the user has built N complete note+pitch combos.
     * @private
     */
    _countNotesWithPitch() {
        const activity = this._getActivity();
        if (!activity || !activity.blocks || !activity.blocks.blockList) {
            return 0;
        }

        const blockList = activity.blocks.blockList;
        let count = 0;

        for (const blockId in blockList) {
            const block = blockList[blockId];
            if (block && (block.name === "newnote" || block.name === "note") && !block.trash) {
                // Check if this note has a pitch inside it
                if (this._noteHasPitch(block, blockList)) {
                    count++;
                }
            }
        }

        return count;
    }

    /**
     * Check if a single note block contains a pitch block.
     * Traverses children (connections[2] is the inner clamp for newnote).
     * @private
     */
    _noteHasPitch(noteBlock, blockList) {
        if (!noteBlock.connections) return false;

        // For newnote blocks, connections[2] is the inner flow (clamp content)
        // We traverse down that chain looking for a pitch
        const innerConnection = noteBlock.connections[2];
        if (innerConnection === null || innerConnection === undefined) return false;

        let currentId = innerConnection;
        let depth = 0;
        const maxDepth = 20;

        while (currentId !== null && currentId !== undefined && depth < maxDepth) {
            const block = blockList[currentId];
            if (!block) break;

            if (block.name === "pitch") {
                return true;
            }

            // Follow the flow: for most blocks, the last connection is the next block
            // But we also need to check inner children of vspace, etc.
            if (block.connections && block.connections.length > 1) {
                // Check all connections except the parent (index 0)
                for (let i = 1; i < block.connections.length; i++) {
                    const childId = block.connections[i];
                    if (childId !== null && blockList[childId]) {
                        if (blockList[childId].name === "pitch") {
                            return true;
                        }
                    }
                }
                // Follow the last connection as flow
                currentId = block.connections[block.connections.length - 1];
            } else {
                break;
            }
            depth++;
        }

        return false;
    }

    /**
     * Check if there is a Repeat block connected anywhere in the start chain.
     * @private
     */
    _hasRepeatBlock() {
        return this._isBlockConnectedToStart("repeat") || this._isBlockConnectedToStart("forever");
    }

    /**
     * Check if there is a Set Instrument (settimbre) block connected anywhere in the start chain.
     * @private
     */
    _hasSetTimbreBlock() {
        return this._isBlockConnectedToStart("settimbre") || this._isBlockConnectedToStart("setinstrument");
    }

    /**
     * Setup listener for play button.
     * Uses addEventListener with { once: true } to avoid conflicts.
     * @private
     */
    _setupPlayListener() {
        const playBtn = docById("play") || docById("runButton");
        if (playBtn) {
            const self = this;
            playBtn.addEventListener(
                "click",
                () => {
                    self._playPressed = true;
                },
                { once: true }
            );
        }
    }

    /**
     * Check if play was pressed.
     * @private
     */
    _hasPressedPlay() {
        return this._playPressed === true;
    }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = FirstProjectTutorial;
}
