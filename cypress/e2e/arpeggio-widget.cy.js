/* global cy, beforeEach, afterEach, describe, expect, it, Cypress */

/**
 * Cypress E2E test suite for the Arpeggio Widget.
 *
 * The Arpeggio Widget (js/widgets/arpeggio.js) is a chord-sequencing matrix
 * that maps pitches (rows) against time-steps (columns). It is opened by
 * running an `arpeggiomatrix` block (via Play).
 *
 * These tests exercise the widget's complete launch and UI lifecycle through
 * the real application without any mocks:
 *  1. Loading a fixture project that contains an arpeggiomatrix block.
 *  2. Pressing Play to open the widget through the real block-execution path.
 *  3. Verifying the widget window frame title and overall container.
 *  4. Confirming all toolbar action buttons (Play, Save, Clear, Move up, Move down) are present.
 *  5. Verifying the arpeggio grid table and its heading label cells are rendered.
 *  6. Verifying the arpeggio note-column header row is rendered with column labels.
 *  7. Clicking a grid cell turns it black (selects it), clicking again deselects it.
 *  8. Closing the widget and confirming it is fully removed from the DOM.
 *
 * DOM STRUCTURE (from Arpeggio.init()):
 *  - .windowFrame[role="dialog"][aria-label="arpeggio"]   <- stable anchor selector
 *    - .wfTopBar                                          <- title bar / drag handle
 *      - .wftTitle                                       <- contains text "arpeggio"
 *      - toolbar buttons: Play, Save, Clear, Move up, Move down
 *    - .widgetBody
 *      - div (arpeggioDiv)
 *        - div#arpeggioOuterDiv
 *          - div#arpeggioInnerDiv
 *            - table#arpeggioTable      <- pitch rows
 *              - tr > td.headcol        <- pitch label
 *              - tr > td > table#arpeggioCellTable{n} > tr#arpeggio{n} > td[id="row,col"]
 *        - table#arpeggioNoteTable      <- time-step column labels
 *          - tr > td.headcol            <- column numbers "1", "2", "3", "4"
 */

// ---------------------------------------------------------------------------
// Uncaught Exception Handler
// ---------------------------------------------------------------------------

Cypress.on("uncaught:exception", err => {
    const ignored = [
        "ResizeObserver loop limit exceeded",
        "Cannot read properties of undefined",
        "Cannot read properties of null",
        "Cannot set properties of null",
        "Cannot set properties of undefined",
        "_ is not defined",
        "Permissions check failed"
    ];
    return !ignored.some(msg => err.message.includes(msg));
});

const ARPEGGIO_DIALOG = '[role="dialog"][aria-label="arpeggio"]';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Loads the arpeggio-widget-minimal.tb fixture and waits for the
 * arpeggiomatrix block to be fully parsed into the block list.
 * Uses the stable-observation pattern (5 consecutive passing checks)
 * to filter the transient _loadCounter=0 that the chunked loader emits
 * before restarting, matching the meter-widget and mode-widget suites.
 */
const loadArpeggioFixture = () => {
    cy.get("#load").click();
    cy.get("#myOpenFile").selectFile("cypress/fixtures/arpeggio-widget-minimal.tb", {
        force: true
    });

    let stableObservations = 0;
    cy.window({ timeout: 30000 }).should(win => {
        const { blocks } = win.ActivityContext.getActivity();
        const fullyLoaded =
            blocks._loadCounter === 0 &&
            blocks.blockList.some(block => !block.trash && block.name === "arpeggiomatrix");
        stableObservations = fullyLoaded ? stableObservations + 1 : 0;
        expect(
            stableObservations,
            "fixture arpeggiomatrix block should remain fully loaded"
        ).to.be.at.least(5);
    });

    cy.get("#load-container", { timeout: 30000 }).should("not.be.visible");
    cy.get("#errorText").should("not.be.visible");
};

/**
 * Loads the fixture and presses Play to open the Arpeggio widget,
 * then waits for the widget dialog and the arpeggio grid table to appear.
 */
const openArpeggioWidget = () => {
    loadArpeggioFixture();
    cy.get("#play").click();

    // Wait for the arpeggio dialog and the main grid table to be present.
    // #arpeggioTable is created inside Arpeggio.init() before makeClickable()
    // runs, so its presence confirms the widget initialised successfully.
    cy.get(ARPEGGIO_DIALOG, { timeout: 30000 }).should("be.visible");
    cy.get("#arpeggioTable", { timeout: 30000 }).should("exist");
};

// Convenience scoping helper - all assertions go through the single dialog.
const arpeggioFrame = () => cy.get(ARPEGGIO_DIALOG);

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("Arpeggio widget", () => {
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

    // -- Test 1: Window frame and title --------------------------------------

    it("opens the Arpeggio widget and renders the window frame with the correct title", () => {
        openArpeggioWidget();

        // The windowFor() call uses "arpeggio" as the title, which sets
        // both the wftTitle text content and the frame's aria-label.
        arpeggioFrame().should("be.visible");

        arpeggioFrame().find(".wftTitle").should("be.visible").and("contain.text", "arpeggio");
    });

    // -- Test 2: Toolbar buttons ---------------------------------------------

    it("renders all expected toolbar action buttons", () => {
        openArpeggioWidget();

        // Arpeggio.init() adds buttons in this order:
        //   Play, Save (export-chunk.svg), Clear (erase-button.svg),
        //   Move up (up.svg), Move down (down.svg)
        const expectedButtons = ["Play", "Save", "Clear", "Move up", "Move down"];

        for (const label of expectedButtons) {
            arpeggioFrame().find(`[role="button"][aria-label="${label}"]`).should("be.visible");
        }
    });

    // -- Test 3: Grid table structure ----------------------------------------

    it("renders the arpeggio grid table with pitch-label rows and column header cells", () => {
        openArpeggioWidget();

        // Arpeggio.init() builds #arpeggioTable with one <tr> per pitch row
        // (this._rowLabels.length rows) plus one extra <tr> for the time-step
        // label row at the bottom.  With the 12-TET default temperament there
        // are 13 pitches (0-12) so we expect at least 2 rows total.
        arpeggioFrame().find("#arpeggioTable").should("exist");
        arpeggioFrame().find("#arpeggioTable tr").should("have.length.greaterThan", 1);

        // Each pitch row has a .headcol label cell (the pitch number).
        arpeggioFrame().find("#arpeggioTable .headcol").should("have.length.greaterThan", 0);

        // The arpeggioOuterDiv and arpeggioInnerDiv scroll containers must
        // exist as they hold the entire grid.
        arpeggioFrame().find("#arpeggioOuterDiv").should("exist");
        arpeggioFrame().find("#arpeggioInnerDiv").should("exist");
    });

    // -- Test 4: Note-column header table ------------------------------------

    it("renders the note-column header table with column labels", () => {
        openArpeggioWidget();

        // Arpeggio.init() creates #arpeggioNoteTable and calls _addNote() once
        // per defaultCols (= 4).  Each call inserts a <td class="headcol"> with
        // the column number ("1", "2", "3", "4") into arpeggioNoteTable's row.
        arpeggioFrame().find("#arpeggioNoteTable").should("exist");

        // Four column-label cells must be present for the default 4-column grid.
        arpeggioFrame().find("#arpeggioNoteTable .headcol").should("have.length", 4);

        // Verify the column labels are "1", "2", "3", "4" in order.
        arpeggioFrame()
            .find("#arpeggioNoteTable .headcol")
            .each(($cell, idx) => {
                expect($cell.text().trim()).to.equal(String(idx + 1));
            });
    });

    // -- Test 5: Grid cell interaction (select / deselect) -------------------

    it("toggles a grid cell between selected (black) and deselected on click", () => {
        openArpeggioWidget();

        // Cell IDs are "row,col" (e.g. "0,0" for top-left).  The cell's
        // initial background is set by _getBackgroundColor(), never black.
        // Clicking once sets it to "black"; clicking again deselects it.
        const cellSelector = '#arpeggioTable td[id="0,0"]';

        // Confirm the cell exists and is initially NOT black.
        arpeggioFrame()
            .find(cellSelector)
            .should("exist")
            .then($cell => {
                expect($cell[0].style.backgroundColor).not.to.equal("black");
            });

        // Click to select - cell should turn black.
        arpeggioFrame().find(cellSelector).click({ force: true });

        arpeggioFrame()
            .find(cellSelector)
            .should($cell => {
                expect($cell[0].style.backgroundColor).to.equal("black");
            });

        // Click again to deselect - cell should no longer be black.
        arpeggioFrame().find(cellSelector).click({ force: true });

        arpeggioFrame()
            .find(cellSelector)
            .should($cell => {
                expect($cell[0].style.backgroundColor).not.to.equal("black");
            });
    });

    // -- Test 6: Clear button resets the grid --------------------------------

    it("clears all selected cells when the Clear button is clicked", () => {
        openArpeggioWidget();

        // Select the first cell in column 0 (row 0, col 0).
        arpeggioFrame().find('#arpeggioTable td[id="0,0"]').click({ force: true });

        // Confirm it is now black (selected).
        arpeggioFrame()
            .find('#arpeggioTable td[id="0,0"]')
            .should($cell => {
                expect($cell[0].style.backgroundColor).to.equal("black");
            });

        // Click the Clear button - _clear() unsets every black cell.
        arpeggioFrame().find('[role="button"][aria-label="Clear"]').click({ force: true });

        // After clearing, the previously selected cell must no longer be black.
        arpeggioFrame()
            .find('#arpeggioTable td[id="0,0"]')
            .should($cell => {
                expect($cell[0].style.backgroundColor).not.to.equal("black");
            });
    });

    // -- Test 7: Close lifecycle ----------------------------------------------

    it("closes the Arpeggio widget and fully removes it from the DOM", () => {
        openArpeggioWidget();

        // Confirm key DOM nodes are present before closing.
        arpeggioFrame().find("#arpeggioTable").should("exist");
        arpeggioFrame().find("#arpeggioNoteTable").should("exist");

        // Capture the frame element so we can assert physical DOM removal.
        arpeggioFrame().then($frame => {
            cy.wrap($frame)
                .find('[role="button"][aria-label="Close window"]')
                .click({ force: true });

            // widgetWindow.destroy() physically removes the .windowFrame.
            // Cypress.dom.isAttached() returns false once it is gone.
            cy.wrap(null).should(() => {
                expect(
                    Cypress.dom.isAttached($frame[0]),
                    ".windowFrame should be detached from the DOM after destroy()"
                ).to.equal(false);
            });

            // Belt-and-suspenders: the grid and note-column tables must also
            // be absent from the entire document.
            cy.get("#arpeggioTable").should("not.exist");
            cy.get("#arpeggioNoteTable").should("not.exist");
            cy.get("#arpeggioOuterDiv").should("not.exist");
        });
    });
});
