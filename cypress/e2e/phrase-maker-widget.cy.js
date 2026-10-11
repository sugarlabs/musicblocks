/* global cy, beforeEach, afterEach, describe, expect, it, Cypress */

/**
 * Cypress E2E test suite for the Phrase Maker widget.
 *
 * The Phrase Maker widget (js/widgets/phrasemaker.js) lets users arrange
 * pitches, drums, and graphics events into a phrase grid by clicking note
 * cells. It is opened by running a `matrix` block (via Play).
 *
 * These tests exercise the widget's complete launch and UI lifecycle through
 * the real application without any mocks:
 *  1. Loading a fixture project that contains a matrix block with pitches,
 *     a drum, and rhythm blocks.
 *  2. Pressing Play to open the widget through the real block-execution path.
 *  3. Verifying the widget window frame renders with the "phrase maker" label.
 *  4. Confirming pitch/drum rows render with .headcol icon cells and .labelcol
 *     note-name cells.
 *  5. Confirming note cells are present in the phrase grid rows.
 *  6. Confirming all toolbar action buttons are present.
 *  7. Toggling (activating) a note cell by clicking it and verifying the
 *     background changes to black.
 *  8. Confirming the note-value row (#bottomRow) is rendered at the bottom
 *     of the grid.
 *  9. Closing the widget and confirming the frame is fully removed from the DOM.
 *
 * NOTE ON SELECTORS
 * PhraseMaker.show() calls:
 *   window.widgetWindows.windowFor(this, "phrase maker")
 * which sets aria-label="phrase maker" on the .windowFrame. This label is
 * stable for the lifetime of the widget and is the primary test anchor.
 *
 * Row icon cells use class "headcol" (set in the for-loop that builds each
 * ptmTableRow in show()). Row label cells use class "labelcol". The note-
 * value row at the bottom is identified by id="bottomRow".  Individual
 * note cells carry data-i (row index) and data-j (column index) attributes
 * added by makeClickable(), which are used to click a specific cell.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Loads a fixture project file and waits until the `matrix` block is fully
 * in the block list with a stable _loadCounter of 0 (same stability pattern
 * as meter-widget.cy.js and rhythm-ruler-widget.cy.js).
 * @param {string} fixtureName - Filename inside cypress/fixtures/.
 */
const loadFixtureProject = fixtureName => {
    cy.get("#load").click();
    cy.get("#myOpenFile").selectFile(`cypress/fixtures/${fixtureName}`, { force: true });

    let stableObservations = 0;
    cy.window({ timeout: 30000 }).should(win => {
        const { blocks } = win.ActivityContext.getActivity();
        const fullyLoaded =
            blocks._loadCounter === 0 &&
            blocks.blockList.some(block => !block.trash && block.name === "matrix");
        stableObservations = fullyLoaded ? stableObservations + 1 : 0;
        expect(
            stableObservations,
            "fixture matrix block should remain fully loaded"
        ).to.be.at.least(5);
    });
    cy.get("#load-container", { timeout: 30000 }).should("not.be.visible");
    cy.get("#errorText").should("not.be.visible");
};

/**
 * Loads the fixture and presses Play, then waits until the Phrase Maker widget
 * window is visible in the DOM.
 */
const openPhraseMaker = () => {
    loadFixtureProject("phrase-maker-minimal.tb");
    cy.get("#play").click();
    cy.get('[aria-label="phrase maker"]', { timeout: 30000 }).should("be.visible");
};

// The stable selector for all assertions inside the Phrase Maker window.
const PM = '[aria-label="phrase maker"]';

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("Phrase Maker widget", () => {
    beforeEach(() => {
        // Each test gets a fresh app load to prevent Music Blocks localStorage
        // auto-save from re-triggering the widget on subsequent test runs.
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
        cy.reload();
        cy.waitForAppReady();

        // Dismiss the first-run "Take a Tour" guide so that .windowFrame
        // selectors used in tests are unambiguous.
        cy.get("body").then($body => {
            const closeButtons = $body.find(".windowFrame .wftButton.close");
            if (closeButtons.length) {
                cy.wrap(closeButtons).each($btn => {
                    cy.wrap($btn).click({ force: true });
                });
            }
        });
    });

    afterEach(() => {
        // Stop any active audio playback and close open widget windows so that
        // audio loops do not bleed into the next test's page initialisation.
        cy.get("body").then($body => {
            if ($body.find("#stop").length) {
                cy.get("#stop").click({ force: true });
            }
            const closeButtons = $body.find(".windowFrame .wftButton.close");
            if (closeButtons.length) {
                cy.wrap(closeButtons).each($btn => {
                    cy.wrap($btn).click({ force: true });
                });
            }
        });
    });

    // 1. Launch + window frame

    it("opens the Phrase Maker widget and renders the window frame", () => {
        openPhraseMaker();

        // The widget window frame is identified by aria-label="phrase maker",
        // set by widgetWindows.windowFor(this, "phrase maker") in show().
        cy.get(PM).should("be.visible");

        // The title bar should display "phrase maker".
        cy.get(`${PM} .wftTitle`).should("be.visible").and("contain.text", "phrase maker");
    });

    // 2. Row icon cells (.headcol) and label cells (.labelcol)

    it("renders row icon and label cells for the phrase grid rows", () => {
        openPhraseMaker();

        // Each pitch/drum row gets a .headcol icon cell followed by a .labelcol
        // note-name cell. The fixture has 5 pitches (ti, la, sol, mi, re) and
        // 1 drum (snare drum), so at least 6 headcol cells should be present.
        // Note: unlike RhythmRuler, .headcol in Phrase Maker is always present —
        // it is never gated behind beginnerMode. The last row in the grid (the
        // note-value bar) also inserts one headcol cell, so the total is >= 7.
        cy.get(`${PM} .headcol`).should("have.length.at.least", 6);

        // Each data row also gets a .labelcol cell that shows the note/drum name.
        cy.get(`${PM} .labelcol`).should("have.length.at.least", 1);
    });

    // 3. Note grid cells are rendered

    it("renders note cells in the phrase grid", () => {
        openPhraseMaker();

        // makeClickable() attaches data-i and data-j attributes to every
        // interactive note cell in the grid. At least one such cell must
        // exist after the widget initialises and sorts.
        cy.get(`${PM} [data-i]`, { timeout: 10000 }).should("have.length.at.least", 1);
    });

    // 4. Toolbar action buttons

    it("renders all expected toolbar action buttons", () => {
        openPhraseMaker();

        // Buttons are added in show() in this order:
        //   Play, Save, Clear, [Export — standard mode only], Sort, Add note
        // We always assert Play, Save, Clear, Sort, and Add note.
        const alwaysPresentButtons = ["Play", "Save", "Clear", "Sort", "Add note"];

        for (const label of alwaysPresentButtons) {
            cy.get(`${PM} [role="button"][aria-label="${label}"]`).should("be.visible");
        }
    });

    // 5. Note-value row (#bottomRow)

    it("renders the note-value row at the bottom of the phrase grid", () => {
        openPhraseMaker();

        // show() sets id="bottomRow" on the last ptmTableRow which holds the
        // note-value display cells. This row is sticky at the bottom.
        cy.get(`${PM} #bottomRow`).should("exist");
    });

    // 6. Activate a note cell by clicking it

    it("toggles a note cell to active (black) when clicked", () => {
        openPhraseMaker();

        // Wait for makeClickable() to attach data-j attributes before clicking.
        cy.get(`${PM} [data-i="0"]`, { timeout: 15000 }).should("have.length.at.least", 1);

        // Click the first note cell in row 0 (data-i="0", data-j="0").
        // onmousedown toggles the cell: if it is not black it becomes black,
        // which is how a note gets "activated" in the Phrase Maker grid.
        cy.get(`${PM} [data-i="0"][data-j="0"]`)
            .first()
            .trigger("mousedown", { force: true })
            .trigger("mouseup", { force: true });

        // After the first click the cell background should be "black" (active).
        cy.get(`${PM} [data-i="0"][data-j="0"]`)
            .first()
            .should($cell => {
                const bg = $cell[0].style.backgroundColor;
                // "black" is the activated colour set in onmousedown when the
                // previous colour was NOT already black.
                expect(bg, "cell should be black when activated").to.equal("black");
            });
    });

    // 7. Close lifecycle

    it("closes the Phrase Maker widget and cleans up the DOM", () => {
        openPhraseMaker();

        // Confirm the grid is rendered before closing.
        cy.get(`${PM} .headcol`).should("have.length.at.least", 1);

        // Capture the frame element before clicking Close so we can assert
        // that widgetWindow.destroy() physically removed it from the DOM.
        cy.get(PM).then($frame => {
            cy.wrap($frame)
                .find('[role="button"][aria-label="Close window"]')
                .click({ force: true });

            // Cypress.dom.isAttached() returns false once the element is
            // detached from the document, proving .windowFrame was destroyed.
            cy.wrap(null).should(() => {
                expect(
                    Cypress.dom.isAttached($frame[0]),
                    ".windowFrame should be detached after destroy()"
                ).to.equal(false);
            });

            // Belt-and-suspenders: the phrase grid structural elements must
            // also be absent from the document.
            cy.get("#bottomRow").should("not.exist");
            cy.get("#addnotes").should("not.exist");
        });
    });
});
