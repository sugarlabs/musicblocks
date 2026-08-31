/* global cy, beforeEach, describe, it */

/**
 * Cypress E2E test suite for the Pitch Staircase widget.
 *
 * The Pitch Staircase widget (js/widgets/pitchstaircase.js) generates a series
 * of pitches from a starting pitch by applying a musical ratio (numerator /
 * denominator). It is opened by running a `pitchstaircase` block (via Play).
 *
 * These tests exercise the widget's complete launch and UI lifecycle through
 * the real application without any mocks:
 *  1. Loading a fixture project that contains a pitchstaircase block.
 *  2. Pressing Play to open the widget through the real block-execution path.
 *  3. Verifying the widget window, staircase table, and toolbar render correctly.
 *  4. Confirming toolbar action buttons (Play chord, Play scale, Save, Undo, Clear) are present.
 *  5. Closing the widget and confirming it is fully removed from the DOM.
 */

const loadFixtureProject = fixtureName => {
    cy.get("#load").click();
    cy.get("#myOpenFile").selectFile(`cypress/fixtures/${fixtureName}`, { force: true });

    // Wait for the load overlay to appear before waiting for it to disappear.
    // Without this guard, the `not.be.visible` check passes trivially on the
    // container's default hidden state before loading has even begun, which
    // causes Play to run before the project is fully loaded.
    cy.get("#load-container").should("be.visible");
    cy.get("#load-container", { timeout: 30000 }).should("not.be.visible");
    cy.get("#errorText").should("not.be.visible");
};

describe("Pitch Staircase widget", () => {
    beforeEach(() => {
        // Each test gets a fresh app load to prevent Music Blocks' localStorage
        // auto-save from re-triggering the widget on subsequent test runs.
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
        cy.visit("http://127.0.0.1:3000");
        cy.waitForAppReady();

        // Dismiss the first-run "Take a Tour" guide if it appears, so that
        // the .windowFrame selectors used in tests are unambiguous.
        cy.get("body").then($body => {
            const closeButtons = $body.find(".windowFrame .wftButton.close");
            if (closeButtons.length) {
                cy.wrap(closeButtons).click({ multiple: true, force: true });
            }
        });
    });

    it("opens the Pitch Staircase widget and renders the staircase table", () => {
        loadFixtureProject("pitch-staircase-minimal.tb");

        // Pressing Play executes every start stack, which triggers the
        // pitchstaircase block and calls PitchStaircase.init() - the same
        // path a real user takes.
        cy.get("#play").click();

        // The widget window frame title is set by widgetWindows.windowFor()
        // with the label "pitch staircase".
        cy.get(".windowFrame .wftTitle", { timeout: 30000 })
            .should("be.visible")
            .and("contain.text", "pitch staircase");

        // The window frame itself is scoped by the aria-label attribute.
        cy.get('[aria-label="pitch staircase"]', { timeout: 30000 }).should("be.visible");

        // PitchStaircase._makeStairs() builds the staircase inside this._pscTable
        // which is appended to the widget body. The table must be present and
        // contain at least one row (one per pitch in the Stairs array).
        cy.get('[aria-label="pitch staircase"]')
            .find("table.pitch-staircase-step, .pitch-staircase-step")
            .should("have.length.greaterThan", 0);

        // Each row contains a play button cell with class "headcol" and a
        // frequency/note cell with class "pitch-staircase-step".
        cy.get(".pitch-staircase-step").first().should("be.visible");
    });

    it("renders the full toolbar with all expected action buttons", () => {
        loadFixtureProject("pitch-staircase-minimal.tb");
        cy.get("#play").click();

        cy.get('[aria-label="pitch staircase"]', { timeout: 30000 }).should("be.visible");

        // PitchStaircase.init() adds buttons to the widget toolbar in this order:
        // Play chord, Play scale, Save, (ratio inputs), Undo, Clear.

        // The "Play chord" button plays all pitches simultaneously.
        cy.get('[aria-label="pitch staircase"]').find('img[title="Play chord"]').should("exist");

        // The "Play scale" button plays pitches sequentially up and down.
        cy.get('[aria-label="pitch staircase"]').find('img[title="Play scale"]').should("exist");

        // The "Save" button generates a new action block from the current staircase.
        cy.get('[aria-label="pitch staircase"]').find('img[title="Save"]').should("exist");

        // The "Undo" button removes the last added stair step.
        cy.get('[aria-label="pitch staircase"]').find('img[title="Undo"]').should("exist");

        // The "Clear" button removes all added stair steps.
        cy.get('[aria-label="pitch staircase"]').find('img[title="Clear"]').should("exist");
    });

    it("closes the Pitch Staircase widget and cleans up the DOM", () => {
        loadFixtureProject("pitch-staircase-minimal.tb");
        cy.get("#play").click();

        cy.get('[aria-label="pitch staircase"]', { timeout: 30000 }).should("be.visible");

        // Confirm the staircase is rendered before closing.
        cy.get(".pitch-staircase-step").should("exist");

        // Click the close button on the widget window titlebar.
        // PitchStaircase.init() wires widgetWindow.onclose to clear all
        // timeouts, stop synth audio, and call widgetWindow.destroy() -
        // which removes the .windowFrame from the DOM.
        cy.get('[aria-label="pitch staircase"]')
            .find('[title="Close"]')
            .first()
            .click({ force: true });

        // The window frame should be fully destroyed.
        cy.get('[aria-label="pitch staircase"]').should("not.exist");

        // The staircase step cells should no longer exist in the DOM.
        cy.get(".pitch-staircase-step").should("not.exist");

        // The play button cells (class "headcol") should also be gone.
        cy.get(".headcol").should("not.exist");
    });
});
