/* global cy, beforeEach, afterEach, describe, expect, it, Cypress */

/**
 * Cypress E2E test suite for the Rhythm Ruler (Rhythm Maker) widget.
 *
 * The Rhythm Ruler widget (js/widgets/rhythmruler.js) lets users create rhythmic
 * subdivisions by clicking on ruler cells to dissect them. It is opened by running
 * a `rhythmruler2` block (via Play).
 *
 * These tests exercise the widget's complete launch and UI lifecycle through
 * the real application without any mocks:
 *  1. Loading a fixture project that contains two rhythm ruler rows (snare drum +
 *     kick drum, one `rhythm2` beat each).
 *  2. Pressing Play to open the widget through the real block-execution path.
 *  3. Verifying the widget window frame renders with the "rhythm maker" label.
 *  4. Confirming both ruler rows (`#rulerCellTable0`, `#rulerCellTable1`) render.
 *  5. Confirming all toolbar action buttons are present.
 *  6. Clicking a ruler cell to dissect it and verifying the cell count increases.
 *  7. Closing the widget and confirming the frame is fully removed from the DOM.
 *  8. Dissecting a cell, reloading the page, and confirming the cell is still
 *     divided, and that the restored edit can still be undone.
 *
 * NOTE ON SELECTORS
 * RhythmRulerLayout._createWidgetWindow() calls
 *   widgetWindows.windowFor(this, "rhythm maker")
 * which sets `aria-label="rhythm maker"` on the .windowFrame. This label is
 * never updated after construction, so `[aria-label="rhythm maker"]` is a
 * stable anchor for all assertions.
 *
 * Ruler tables are identified by the IDs `rulerCellTable0`, `rulerCellTable1`,
 * etc., assigned in _buildRulerTable():
 *   rulerCellTable.id = "rulerCellTable" + i;
 *
 * Per-ruler play buttons carry class `headcol` (also from _buildRulerTable()).
 * The dissect-number input is added via widgetWindow.addInputButton("2").
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Waits until the `rhythmruler2` block is fully in the block list with a
 * stable _loadCounter of 0.
 */
const waitForRhythmRulerBlock = () => {
    let stableObservations = 0;
    cy.window({ timeout: 30000 }).should(win => {
        const { blocks } = win.ActivityContext.getActivity();
        const fullyLoaded =
            blocks._loadCounter === 0 &&
            blocks.blockList.some(block => !block.trash && block.name === "rhythmruler2");
        stableObservations = fullyLoaded ? stableObservations + 1 : 0;
        expect(
            stableObservations,
            "fixture rhythmruler2 block should remain fully loaded"
        ).to.be.at.least(5);
    });
};

/**
 * Loads a fixture project file and waits until the `rhythmruler2` block is
 * fully in the block list with a stable _loadCounter of 0 (same stability
 * pattern as meter-widget.cy.js and mode-widget.cy.js).
 * @param {string} fixtureName - Filename inside cypress/fixtures/.
 */
const loadFixtureProject = fixtureName => {
    cy.get("#load").click();
    cy.get("#myOpenFile").selectFile(`cypress/fixtures/${fixtureName}`, { force: true });

    waitForRhythmRulerBlock();
    cy.get("#load-container", { timeout: 30000 }).should("not.be.visible");
    cy.get("#errorText").should("not.be.visible");
};

/**
 * Loads the fixture and presses Play, then waits until the Rhythm Ruler widget
 * window is visible in the DOM.
 */
const openRhythmRuler = () => {
    loadFixtureProject("rhythm-maker-minimal.tb");
    cy.get("#play").click();
    cy.get('[aria-label="rhythm maker"]', { timeout: 30000 }).should("be.visible");
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("Rhythm Ruler widget", () => {
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

    it("opens the Rhythm Ruler widget and renders the window frame", () => {
        openRhythmRuler();

        // The widget window frame is identified by aria-label="rhythm maker",
        // set by widgetWindows.windowFor(this, "rhythm maker") in
        // RhythmRulerLayout._createWidgetWindow().
        cy.get('[aria-label="rhythm maker"]').should("be.visible");

        // The title bar should display "rhythm maker".
        cy.get('[aria-label="rhythm maker"] .wftTitle')
            .should("be.visible")
            .and("contain.text", "rhythm maker");
    });

    // 2. Ruler rows

    it("renders both ruler rows from the fixture", () => {
        openRhythmRuler();

        // The fixture (rhythm-maker-minimal.tb) contains two drums (snare drum
        // and kick drum), so _buildRulerTable() inserts two ruler tables:
        //   rulerCellTable0 (row 0 — snare drum)
        //   rulerCellTable1 (row 1 — kick drum)
        // Each table has one row (this._rulers[i]) with at least one cell.
        cy.get('[aria-label="rhythm maker"] #rulerCellTable0').should("exist");
        cy.get('[aria-label="rhythm maker"] #rulerCellTable1').should("exist");

        // Each ruler row must contain at least one note cell.
        cy.get('[aria-label="rhythm maker"] #rulerCellTable0 tr td').should(
            "have.length.greaterThan",
            0
        );
        cy.get('[aria-label="rhythm maker"] #rulerCellTable1 tr td').should(
            "have.length.greaterThan",
            0
        );
    });

    // 3. Per-ruler play buttons (headcol) — mode-aware

    it("renders per-ruler play buttons correctly for the active mode", () => {
        openRhythmRuler();

        // _buildRulerTable() branches on activity.beginnerMode:
        //   - Standard mode: inserts a play-button cell with class "headcol" per row.
        //   - Beginner mode: omits the per-ruler play button entirely.
        // This test verifies whichever branch is active is consistent.
        cy.window().then(win => {
            const activity = win.ActivityContext.getActivity();
            const isBeginnerMode =
                activity.beginnerMode === true || activity.beginnerMode === "true";

            if (isBeginnerMode) {
                // In beginner mode, headcol cells are never added —
                // assert that none exist so regressions are caught both ways.
                cy.get('[aria-label="rhythm maker"] .headcol').should("not.exist");
            } else {
                // In standard mode, two drums → at least two headcol play buttons.
                cy.get('[aria-label="rhythm maker"] .headcol').should("have.length.at.least", 2);
            }
        });
    });

    // 4. Toolbar buttons

    it("renders all expected toolbar action buttons", () => {
        openRhythmRuler();

        // Buttons are added in _createWidgetWindow() in this order:
        //   Play all, Save rhythms, Save drum machine, (dissect input),
        //   Undo, Tap a rhythm, Clear, Circular view
        const expectedButtons = [
            "Play all",
            "Save rhythms",
            "Save drum machine",
            "Undo",
            "Tap a rhythm",
            "Clear",
            "Circular view"
        ];

        for (const label of expectedButtons) {
            cy.get(`[aria-label="rhythm maker"] [role="button"][aria-label="${label}"]`).should(
                "be.visible"
            );
        }
    });

    // 5. Dissect number input

    it("renders the dissect number input with default value of 2", () => {
        openRhythmRuler();

        // _createWidgetWindow() calls widgetWindow.addInputButton("2") to create
        // a text input for the number of subdivisions. The default value is "2".
        cy.get('[aria-label="rhythm maker"] input').should("exist").and("have.value", "2");
    });

    // 6. Dissect interaction — clicking a ruler cell subdivides it

    it("subdivides a ruler cell when clicked", () => {
        openRhythmRuler();

        // Record the initial number of cells in ruler row 0.
        cy.get('[aria-label="rhythm maker"] #rulerCellTable0 tr td').then($cells => {
            const initialCount = $cells.length;

            // Click the first cell in ruler row 0. The default dissect number
            // is 2, so clicking once should split that cell into 2 cells,
            // increasing the total count by 1 (the original cell is replaced
            // by 2 cells, net +1).
            cy.get('[aria-label="rhythm maker"] #rulerCellTable0 tr td')
                .first()
                .click({ force: true });

            // After the dissect the row must have more cells than before.
            cy.get('[aria-label="rhythm maker"] #rulerCellTable0 tr td').should(
                "have.length.greaterThan",
                initialCount
            );
        });
    });

    // 7. Close lifecycle

    it("closes the Rhythm Ruler widget and cleans up the DOM", () => {
        openRhythmRuler();

        // Confirm the ruler tables are present before closing.
        cy.get('[aria-label="rhythm maker"] #rulerCellTable0').should("exist");

        // Capture the frame element before clicking Close so we can assert
        // that widgetWindow.destroy() physically removed it from the DOM.
        cy.get('[aria-label="rhythm maker"]').then($frame => {
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

            // Belt-and-suspenders: the ruler tables must also be absent.
            cy.get("#rulerCellTable0").should("not.exist");
            cy.get("#rulerCellTable1").should("not.exist");

            // The per-ruler play button cells should also be gone.
            cy.get(".headcol").should("not.exist");
        });
    });

    // 8. Saving — the edits survive a page reload

    it("keeps a dissected cell after the page is reloaded", () => {
        openRhythmRuler();

        cy.get('[aria-label="rhythm maker"] #rulerCellTable0 tr td').should("have.length", 1);
        cy.get('[aria-label="rhythm maker"] #rulerCellTable0 tr td').first().click({ force: true });
        cy.get('[aria-label="rhythm maker"] #rulerCellTable0 tr td').should("have.length", 2);

        // On a restart the project comes back from Planet's storage, which the 15 second autosave
        // keeps current. The save started on unload is asynchronous and can be cut short, so save
        // as the autosave does and wait for it before reloading.
        cy.window().then(win =>
            win.ActivityContext.getActivity().saveLocally({ rejectOnProjectSaveError: true })
        );
        cy.reload();
        cy.waitForAppReady();
        waitForRhythmRulerBlock();

        cy.get("#play").click();
        cy.get('[aria-label="rhythm maker"] #rulerCellTable0 tr td', { timeout: 30000 }).should(
            "have.length",
            2
        );

        // The restored edit is on the undo list like one made in this session.
        cy.get('[aria-label="rhythm maker"] [role="button"][aria-label="Undo"]').click();
        cy.get('[aria-label="rhythm maker"] #rulerCellTable0 tr td').should("have.length", 1);
    });
});
