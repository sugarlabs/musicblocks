/* global cy, beforeEach, describe, expect, it */

/**
 * Cypress E2E test suite for the Meter widget.
 *
 * The Meter widget (js/widgets/meterwidget.js) allows users to set and
 * visualise the musical meter (beats per measure) and mark strong beats
 * using an interactive pie-chart wheel. It is opened by running a `meter`
 * block (via Play).
 *
 * These tests exercise the widget's complete launch and UI lifecycle through
 * the real application without any mocks:
 *  1. Loading a fixture project that contains a meter block.
 *  2. Pressing Play to open the widget through the real block-execution path.
 *  3. Verifying the widget window frame and the meter wheel render correctly.
 *  4. Confirming all three toolbar action buttons (Play, Save, Reset) are present.
 *  5. Closing the widget and confirming it is fully removed from the DOM.
 */

const loadFixtureProject = fixtureName => {
    cy.get("#load").click();
    cy.get("#myOpenFile").selectFile(`cypress/fixtures/${fixtureName}`, { force: true });

    cy.window({ timeout: 30000 }).should(win => {
        const { blocks } = win.ActivityContext.getActivity();
        const fixtureLoaded = blocks.blockList.some(
            block => !block.trash && block.name === "meterwidget"
        );
        expect(fixtureLoaded, "fixture meterwidget block should be loaded").to.be.true;
    });
    // Wait for the load overlay to appear before waiting for it to disappear.
    // Without this guard, the `not.be.visible` check passes trivially on the
    // container's default hidden state before loading has even begun, which
    // causes Play to run before the project is fully loaded.
    cy.get("#load-container").should("be.visible");
    cy.get("#load-container", { timeout: 30000 }).should("not.be.visible");
    cy.get("#errorText").should("not.be.visible");
};

describe("Meter widget", () => {
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

    it("opens the Meter widget and renders the beat-selection wheel", () => {
        loadFixtureProject("meter-widget-minimal.tb");

        // Pressing Play executes every start stack, which triggers the
        // meter block and calls MeterWidget constructor - the same
        // path a real user takes.
        cy.get("#play").click();

        // The widget window frame title is set by widgetWindows.windowFor()
        // with the label "meter".
        cy.get(".windowFrame .wftTitle", { timeout: 30000 })
            .should("be.visible")
            .and("contain.text", "meter");

        // The window frame itself is scoped by the aria-label attribute.
        cy.get('[aria-label="meter"]', { timeout: 30000 }).should("be.visible");

        // MeterWidget constructor creates a div with id="meterWheelDiv" and
        // renders a wheelnav SVG inside it for the beat selection pie chart.
        cy.get("#meterWheelDiv").should("exist").and("be.visible");

        // The wheelnav library renders an SVG element inside the meter wheel
        // div, confirming the pie chart rendered successfully.
        cy.get("#meterWheelDiv svg").should("exist");
    });

    it("renders all three toolbar action buttons", () => {
        loadFixtureProject("meter-widget-minimal.tb");
        cy.get("#play").click();

        cy.get('[aria-label="meter"]', { timeout: 45000 }).should("be.visible");

        // MeterWidget.constructor() creates toolbar buttons with stable test attributes:
        //   1. data-test="meter-play-btn"
        //   2. data-test="meter-save-btn"
        //   3. data-test="meter-reset-btn"
        for (const testId of ["meter-play-btn", "meter-save-btn", "meter-reset-btn"]) {
            cy.get(`[aria-label="meter"] [data-test="${testId}"]`).should("exist");
        }
    });

    it("closes the Meter widget and cleans up the DOM", () => {
        loadFixtureProject("meter-widget-minimal.tb");
        cy.get("#play").click();

        cy.get('[aria-label="meter"]', { timeout: 45000 }).should("be.visible");

        // Confirm the wheel rendered before closing.
        cy.get("#meterWheelDiv").should("exist");

        // Click the close button on the widget window titlebar.
        // MeterWidget wires widgetWindow.onclose to stop playback and call
        // widgetWindow.destroy() - which removes the .windowFrame from the DOM.
        // force:true is required because MB's audio teardown can cause a brief
        // re-render that detaches the button before the click settles.
        cy.get('[aria-label="meter"] [aria-label="Close window"]').click({ force: true });

        // The window frame should be fully destroyed.
        cy.get('[aria-label="meter"]').should("not.exist");
    });
});
