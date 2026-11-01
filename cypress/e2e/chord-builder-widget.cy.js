// Copyright (c) 2026 Music Blocks contributors
//
// This program is free software; you can redistribute it and/or modify it
// under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation; either version 3 of the License, or
// (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.

/* global cy, beforeEach, afterEach, describe, expect, it, Cypress */

/**
 * Cypress E2E test suite for the Chord Builder Widget.
 *
 * The Chord Builder Widget (js/widgets/chordbuilder.js) enables exploration
 * of diatonic harmony, preset progressions (Pop, Jazz, Blues, etc.),
 * and interactive arrangement of chords across musical bars and beats.
 * It is opened by running a `chordbuilder` block (via Play).
 *
 * These tests exercise the widget's complete launch and UI lifecycle through
 * the real application without any mocks:
 *  1. Loading a fixture project that contains a chordbuilder block.
 *  2. Pressing Play to open the widget through the real block-execution path.
 *  3. Verifying the widget window frame title, key badge, and scale/mode badge.
 *  4. Verifying the 7 diatonic chord cards (Roman numerals, names, audition, keyboard activation).
 *  5. Verifying meter controls (bars and beats) and dynamic bar-grid resizing.
 *  6. Adding chords to the progression grid and removing individual chords.
 *  7. Using the inline chord picker on empty cells.
 *  8. Selecting presets (Pop, Jazz) and checking progression updates.
 *  9. Testing Play/Stop playback toggles and progression clearing.
 * 10. Saving the progression to the canvas and asserting block stack generation on the workspace.
 * 11. Closing the widget and confirming DOM removal and lifecycle flag cleanup.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHORD_BUILDER_DIALOG = '[role="dialog"][aria-label="chord progression"]';
const CLOSE_BUTTON = '[role="button"][aria-label="Close window"]';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Loads the chord-builder-widget-minimal.tb fixture and waits for the
 * chordbuilder block to be fully parsed into the block list.
 * Uses the stable-observation pattern (5 consecutive passing checks)
 * to filter the transient _loadCounter=0 that the chunked loader emits.
 */
const loadChordBuilderFixture = () => {
    cy.get("#load").click();
    cy.get("#myOpenFile").selectFile("cypress/fixtures/chord-builder-widget-minimal.tb", {
        force: true
    });

    let stableObservations = 0;
    cy.window({ timeout: 30000 }).should(win => {
        const { blocks } = win.ActivityContext.getActivity();
        const fullyLoaded =
            blocks._loadCounter === 0 &&
            blocks.blockList.some(block => !block.trash && block.name === "chordbuilder");
        stableObservations = fullyLoaded ? stableObservations + 1 : 0;
        expect(
            stableObservations,
            "fixture chordbuilder block should remain fully loaded"
        ).to.be.at.least(5);
    });

    cy.get("#load-container", { timeout: 30000 }).should("not.be.visible");
    cy.get("#errorText").should("not.be.visible");
};

/**
 * Loads the fixture and presses Play to open the Chord Builder widget,
 * then waits for the widget dialog and container to appear.
 */
const openChordBuilderWidget = () => {
    loadChordBuilderFixture();
    cy.get("#play").click();

    cy.get(CHORD_BUILDER_DIALOG, { timeout: 30000 }).should("be.visible");
    cy.get("#chordBuilderContainer", { timeout: 30000 }).should("exist");
};

// Convenience scoping helper - all assertions go through the single dialog.
const chordBuilderFrame = () => cy.get(CHORD_BUILDER_DIALOG);

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("Chord Builder widget", () => {
    beforeEach(() => {
        // Each test gets a fresh app load to prevent Music Blocks localStorage
        // auto-save from re-triggering the widget on subsequent test runs.
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
        cy.reload();
        cy.waitForAppReady();

        // Dismiss first-run tours so that .windowFrame selectors are unambiguous.
        cy.document().then(doc => {
            if (!doc || !doc.body) return;
            const closeButtons = doc.querySelectorAll(".windowFrame .wftButton.close");
            closeButtons.forEach(btn => btn.click());
        });
    });

    afterEach(() => {
        // Stop audio playback cleanly before the next test loads.
        cy.document().then(doc => {
            if (!doc || !doc.body) return;
            const stopBtn = doc.querySelector("#stop");
            if (stopBtn) {
                stopBtn.click();
            }
            const closeButtons = doc.querySelectorAll(".windowFrame .wftButton.close");
            closeButtons.forEach(btn => btn.click());
        });
    });

    // -- Test 1: Window frame, title, and key/scale badges -------------------

    it("opens the Chord Builder widget and renders the window frame with title and badges", () => {
        openChordBuilderWidget();

        chordBuilderFrame().should("be.visible");
        chordBuilderFrame()
            .find(".wftTitle")
            .should("be.visible")
            .and("contain.text", "chord progression");

        // Key badge displays the root key from the turtle (default "C")
        chordBuilderFrame().find("#chordKeyDisplay").should("be.visible").and("have.text", "C");

        // Scale badge displays the mode (default "Major")
        chordBuilderFrame()
            .find("#chordModeDisplay")
            .should("be.visible")
            .and("have.text", "Major");
    });

    // -- Test 2: Diatonic chords grid rendering ------------------------------

    it("renders all 7 diatonic chord cards with correct Roman numerals and chord names", () => {
        openChordBuilderWidget();

        const expectedChords = [
            { roman: "I", name: "C" },
            { roman: "ii", name: "Dm" },
            { roman: "iii", name: "Em" },
            { roman: "IV", name: "F" },
            { roman: "V", name: "G" },
            { roman: "vi", name: "Am" },
            { roman: "vii°", name: "B°" }
        ];

        chordBuilderFrame().find("#diatonicChordsGrid").should("be.visible");
        chordBuilderFrame().find(".diatonic-chord-card").should("have.length", 7);

        expectedChords.forEach((chord, idx) => {
            chordBuilderFrame()
                .find(".diatonic-chord-card")
                .eq(idx)
                .within(() => {
                    cy.contains("span", chord.roman).should("be.visible");
                    cy.contains("span", chord.name).should("be.visible");
                    cy.get("button.chord-card-add-btn").should("be.visible").and("have.text", "+");
                });
        });
    });

    // -- Test 3: Chord auditioning and keyboard activation -------------------

    it("supports auditioning chords via card click and keyboard activation", () => {
        openChordBuilderWidget();

        cy.window().then(win => {
            const { logo } = win.ActivityContext.getActivity();
            cy.spy(logo.chordBuilderWidget.audio, "playChord").as("playChord");
        });

        // Clicking card auditions the chord without adding to progression
        chordBuilderFrame().find(".diatonic-chord-card").eq(0).click();
        cy.get("@playChord").should("have.been.calledOnce");
        cy.get("@playChord").its("firstCall.returnValue").should("be.true");

        // Progression grid remains empty initially
        chordBuilderFrame().find(".bar-grid-cell").first().should("contain.text", "+");

        // Keyboard navigation with Enter and Space triggers audition
        chordBuilderFrame()
            .find(".diatonic-chord-card")
            .eq(3) // IV (F)
            .focus()
            .trigger("keydown", { key: "Enter" });
        cy.get("@playChord").should("have.been.calledTwice");
        cy.get("@playChord").its("secondCall.returnValue").should("be.true");
        chordBuilderFrame().find(".bar-grid-cell").first().should("contain.text", "+");

        chordBuilderFrame()
            .find(".diatonic-chord-card")
            .eq(4) // V (G)
            .focus()
            .trigger("keydown", { key: " " });
        cy.get("@playChord").should("have.been.calledThrice");
        cy.get("@playChord").its("thirdCall.returnValue").should("be.true");
        chordBuilderFrame().find(".bar-grid-cell").first().should("contain.text", "+");
    });

    // -- Test 4: Meter controls and bar-grid dimensions ----------------------

    it("updates grid dimensions when changing meter bars and beats", () => {
        openChordBuilderWidget();

        // Default: 4 bars × 4 beats = 16 cells
        chordBuilderFrame().find("#chordNumBarsInput").should("have.value", "4");
        chordBuilderFrame().find("#chordBeatsSelect").should("have.value", "4");
        chordBuilderFrame().find(".bar-grid-cell").should("have.length", 16);

        // Change bars to 2 -> 2 × 4 = 8 cells
        chordBuilderFrame().find("#chordNumBarsInput").clear().type("2").trigger("change");
        chordBuilderFrame().find(".bar-grid-cell").should("have.length", 8);

        // Change beats to 3 -> 2 × 3 = 6 cells
        chordBuilderFrame().find("#chordBeatsSelect").select("3");
        chordBuilderFrame().find(".bar-grid-cell").should("have.length", 6);

        // Reset to 4 bars × 4 beats = 16 cells
        chordBuilderFrame().find("#chordNumBarsInput").clear().type("4").trigger("change");
        chordBuilderFrame().find("#chordBeatsSelect").select("4");
        chordBuilderFrame().find(".bar-grid-cell").should("have.length", 16);
    });

    // -- Test 5: Adding and removing chords in the progression grid ----------

    it("adds chords via the card add button and allows removing individual chords", () => {
        openChordBuilderWidget();

        // Click '+' on chord card 0 (I - C)
        chordBuilderFrame()
            .find(".diatonic-chord-card")
            .eq(0)
            .find(".chord-card-add-btn")
            .click({ force: true });

        // Cell 0 should now display Roman numeral 'I' and name 'C'
        chordBuilderFrame()
            .find('.bar-grid-cell[data-cell-index="0"]')
            .should("contain.text", "I")
            .and("contain.text", "C");

        // Click '+' on chord card 4 (V - G)
        chordBuilderFrame()
            .find(".diatonic-chord-card")
            .eq(4)
            .find(".chord-card-add-btn")
            .click({ force: true });

        // Cell 1 should now display Roman numeral 'V' and name 'G'
        chordBuilderFrame()
            .find('.bar-grid-cell[data-cell-index="1"]')
            .should("contain.text", "V")
            .and("contain.text", "G");

        // Remove the first chord using its cell remove button
        chordBuilderFrame()
            .find('.bar-grid-cell[data-cell-index="0"] button.bar-grid-remove-btn')
            .click({ force: true });

        // The remaining chord (V - G) shifts to index 0
        chordBuilderFrame()
            .find('.bar-grid-cell[data-cell-index="0"]')
            .should("contain.text", "V")
            .and("contain.text", "G");

        // Cell 1 is now empty ('+')
        chordBuilderFrame().find('.bar-grid-cell[data-cell-index="1"]').should("contain.text", "+");
    });

    // -- Test 6: Inline cell chord picker on empty cells ---------------------

    it("allows picking a chord directly on an empty cell using inline dropdown", () => {
        openChordBuilderWidget();

        // Click empty cell 0 to reveal the inline chord picker
        chordBuilderFrame().find('.bar-grid-cell[data-cell-index="0"]').click({ force: true });

        // An inline select picker should be created
        chordBuilderFrame().find('.bar-grid-cell[data-cell-index="0"] select').should("be.visible");

        // Select chord index 5 (vi - Am)
        chordBuilderFrame().find('.bar-grid-cell[data-cell-index="0"] select').select("5");

        // Cell 0 should now be rendered with Roman numeral 'vi' and name 'Am'
        chordBuilderFrame()
            .find('.bar-grid-cell[data-cell-index="0"]')
            .should("contain.text", "vi")
            .and("contain.text", "Am");
    });

    // -- Test 7: Presets selection (Pop & Jazz) -------------------------------

    it("loads progression presets and updates the grid", () => {
        openChordBuilderWidget();

        // Select the 'pop' preset: I - V - vi - IV (C, G, Am, F)
        chordBuilderFrame().find("#chordPresetSelect").select("pop");

        chordBuilderFrame()
            .find('.bar-grid-cell[data-cell-index="0"]')
            .should("contain.text", "I")
            .and("contain.text", "C");
        chordBuilderFrame()
            .find('.bar-grid-cell[data-cell-index="1"]')
            .should("contain.text", "V")
            .and("contain.text", "G");
        chordBuilderFrame()
            .find('.bar-grid-cell[data-cell-index="2"]')
            .should("contain.text", "vi")
            .and("contain.text", "Am");
        chordBuilderFrame()
            .find('.bar-grid-cell[data-cell-index="3"]')
            .should("contain.text", "IV")
            .and("contain.text", "F");

        // Select the 'jazz' preset: ii - V - I (Dm, G, C)
        chordBuilderFrame().find("#chordPresetSelect").select("jazz");

        chordBuilderFrame()
            .find('.bar-grid-cell[data-cell-index="0"]')
            .should("contain.text", "ii")
            .and("contain.text", "Dm");
        chordBuilderFrame()
            .find('.bar-grid-cell[data-cell-index="1"]')
            .should("contain.text", "V")
            .and("contain.text", "G");
        chordBuilderFrame()
            .find('.bar-grid-cell[data-cell-index="2"]')
            .should("contain.text", "I")
            .and("contain.text", "C");
        chordBuilderFrame().find('.bar-grid-cell[data-cell-index="3"]').should("contain.text", "+");
    });

    // -- Test 8: Playback toggle and Clear button ----------------------------

    it("toggles Play and Stop button states and clears progression on Clear click", () => {
        openChordBuilderWidget();

        // Load pop preset so there is a progression to play
        chordBuilderFrame().find("#chordPresetSelect").select("pop");

        cy.window().then(win => {
            const { logo } = win.ActivityContext.getActivity();
            cy.spy(logo.chordBuilderWidget.audio, "playChord").as("playChord");
        });

        // Initial state is Play
        chordBuilderFrame().find("#chordPlayBtn").should("be.visible").and("contain.text", "Play");

        // Click Play -> switches to Stop
        chordBuilderFrame().find("#chordPlayBtn").click();
        chordBuilderFrame().find("#chordPlayBtn").should("contain.text", "Stop");
        cy.get("@playChord").should("have.been.called");

        // Click Stop -> switches back to Play
        chordBuilderFrame().find("#chordPlayBtn").click();
        chordBuilderFrame().find("#chordPlayBtn").should("contain.text", "Play");

        // Click Clear button -> empties progression
        chordBuilderFrame().find("#chordClearBtn").click();
        chordBuilderFrame().find('.bar-grid-cell[data-cell-index="0"]').should("contain.text", "+");
        chordBuilderFrame().find('.bar-grid-cell[data-cell-index="1"]').should("contain.text", "+");
    });

    // -- Test 9: Save to Canvas exports blocks to the workspace --------------

    it("saves chord progression to the canvas and creates blocks in blockList", () => {
        openChordBuilderWidget();

        // Load pop preset (4 chords: C, G, Am, F)
        chordBuilderFrame().find("#chordPresetSelect").select("pop");

        // Click Save to Canvas
        chordBuilderFrame().find("#chordSaveBtn").click();

        // Workspace blockList should now contain generated chordinterval blocks
        cy.window({ timeout: 30000 }).should(win => {
            const { blocks } = win.ActivityContext.getActivity();
            expect(blocks._loadCounter, "block loading should be finished").to.equal(0);

            const chordBlocks = blocks.blockList.filter(
                b => !b.trash && b.name === "chordinterval"
            );
            expect(
                chordBlocks,
                "chordinterval blocks must be loaded onto the canvas"
            ).to.have.length(4);

            const newNoteBlocks = blocks.blockList.filter(b => !b.trash && b.name === "newnote");
            expect(
                newNoteBlocks,
                "newnote blocks must be created inside chord clamps"
            ).to.have.length(4);

            // Verify each chordinterval block's clamp body connection points to a newnote block
            chordBlocks.forEach(chordBlock => {
                const bodyBlockIndex = chordBlock.connections[2];
                expect(bodyBlockIndex, "chordinterval clamp must connect to body block").to.not.be
                    .null;
                const bodyBlock = blocks.blockList[bodyBlockIndex];
                expect(bodyBlock, "connected body block must exist in blockList").to.exist;
                expect(bodyBlock.name, "chordinterval clamp body must be a newnote block").to.equal(
                    "newnote"
                );
            });

            const pitchBlocks = blocks.blockList.filter(b => !b.trash && b.name === "pitch");
            expect(pitchBlocks, "pitch blocks must be created for chord roots").to.have.length(4);

            // Walk the flow chain from the first chord so roots keep progression order
            const firstChord = chordBlocks.find(
                b => blocks.blockList[b.connections[0]]?.name === "start"
            );
            expect(firstChord, "first chordinterval must follow the start block").to.exist;

            const roots = [];
            const visitedChords = new Set();
            let currentChord = firstChord;
            while (currentChord) {
                expect(visitedChords.has(currentChord), "flow chain must not contain a cycle").to.be
                    .false;
                visitedChords.add(currentChord);

                expect(currentChord.name, "flow block must be a chordinterval").to.equal(
                    "chordinterval"
                );
                const bodyBlock = blocks.blockList[currentChord.connections[2]];
                const pitchBlock = blocks.blockList[bodyBlock.connections[2]];
                const rootBlock = blocks.blockList[pitchBlock.connections[1]];
                expect(rootBlock, "pitch root block must exist").to.exist;
                expect(rootBlock.name, "pitch root block must be a notename").to.equal("notename");
                roots.push(rootBlock.value);

                const nextChordIndex = currentChord.connections[3];
                currentChord =
                    nextChordIndex !== null && nextChordIndex !== undefined
                        ? blocks.blockList[nextChordIndex]
                        : null;
            }

            expect(
                roots,
                "chord roots must match the pop progression (C, G, Am, F) in flow order"
            ).to.deep.equal(["C", "G", "A", "F"]);
        });
    });

    // -- Test 10: Close button lifecycle and cleanup -------------------------

    it("closes the Chord Builder widget and fully cleans up DOM and logo state", () => {
        openChordBuilderWidget();

        chordBuilderFrame().then($frame => {
            cy.wrap($frame).find(CLOSE_BUTTON).click({ force: true });

            // The window frame should be physically detached from the DOM
            cy.wrap(null).should(() => {
                expect(
                    Cypress.dom.isAttached($frame[0]),
                    ".windowFrame should be detached from DOM after close"
                ).to.be.false;
            });

            // Container must not exist anywhere in the document
            cy.get("#chordBuilderContainer").should("not.exist");

            // Logo insideChordBuilder flag should be reset
            cy.window().should(win => {
                const activity = win.ActivityContext.getActivity();
                expect(activity.logo.insideChordBuilder).to.be.false;
            });
        });
    });
});
