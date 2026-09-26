/* global cy, beforeEach, describe, expect, it */

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

    cy.window({ timeout: 30000 }).should(win => {
        const { blocks } = win.ActivityContext.getActivity();
        const fixtureLoaded = blocks.blockList.some(
            block => !block.trash && block.name === "pitchstaircase"
        );
        expect(fixtureLoaded, "fixture pitch staircase block should be loaded").to.be.true;
    });
    cy.get("#load-container", { timeout: 30000 }).should("not.be.visible");
    cy.get("#errorText").should("not.be.visible");
};

describe("Pitch Staircase widget", () => {
    beforeEach(() => {
        // Each test gets a fresh app load to prevent Music Blocks' localStorage
        // auto-save from re-triggering the widget on subsequent test runs.
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
        cy.reload();
        cy.waitForAppReady();

        // Dismiss the first-run "Take a Tour" guide if it appears, so that
        // the .windowFrame selectors used in tests are unambiguous.
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
        // Stop audio playback cleanly before the next test loads.
        cy.get("body").then($body => {
            if ($body.find("#stop").length) {
                cy.get("#stop").click({ force: true });
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
        cy.get('[aria-label="pitch staircase"] .pitch-staircase-step')
            .should("have.length.greaterThan", 0)
            .first()
            .should("be.visible")
            .and("contain.text", "G3");
    });

    it("renders the full toolbar with all expected action buttons", () => {
        loadFixtureProject("pitch-staircase-minimal.tb");
        cy.get("#play").click();

        cy.get('[aria-label="pitch staircase"]', { timeout: 30000 }).should("be.visible");

        for (const label of ["Play chord", "Play scale", "Save", "Undo", "Clear"]) {
            cy.get(`[aria-label="pitch staircase"] [role="button"][aria-label="${label}"]`).should(
                "be.visible"
            );
        }
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
        cy.get('[aria-label="pitch staircase"] [role="button"][aria-label="Close window"]').click({
            force: true
        });

        // The window frame should be fully destroyed.
        cy.get('[aria-label="pitch staircase"]').should("not.exist");

        // The staircase step cells should no longer exist in the DOM.
        cy.get(".pitch-staircase-step").should("not.exist");

        // The play button cells (class "headcol") should also be gone.
        cy.get(".headcol").should("not.exist");
    });
});
