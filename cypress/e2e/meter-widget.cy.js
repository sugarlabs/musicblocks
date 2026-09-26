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

    let stableObservations = 0;
    cy.window({ timeout: 30000 }).should(win => {
        const { blocks } = win.ActivityContext.getActivity();
        const fullyLoaded =
            blocks._loadCounter === 0 &&
            blocks.blockList.some(block => !block.trash && block.name === "meterwidget");
        stableObservations = fullyLoaded ? stableObservations + 1 : 0;
        expect(
            stableObservations,
            "fixture meterwidget block should remain fully loaded"
        ).to.be.at.least(5);
    });
    cy.get("#load-container", { timeout: 30000 }).should("not.be.visible");
    cy.get("#errorText").should("not.be.visible");
};

const meterDialog = '[role="dialog"][aria-label="meter"]';

describe("Meter widget", () => {
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
        // Stop audio playback and close any open widget windows to prevent
        // active loops from interrupting the next test's page initialization.
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

    it("opens the Meter widget and renders the beat-selection wheel", () => {
        loadFixtureProject("meter-widget-minimal.tb");

        // Pressing Play executes every start stack, which triggers the
        // meter block and calls MeterWidget constructor - the same
        // path a real user takes.
        cy.get("#play").click();

        cy.get(meterDialog, { timeout: 30000 }).should("be.visible");

        // MeterWidget constructor creates a div with id="meterWheelDiv" and
        // renders a wheelnav SVG inside it for the beat selection pie chart.
        cy.get(`${meterDialog} #meterWheelDiv`).should("be.visible");

        // The wheelnav library renders an SVG element inside the meter wheel
        // div, confirming the pie chart rendered successfully.
        cy.get(`${meterDialog} #meterWheelDiv svg`).should("be.visible");

        // The fixture contains four beats at quarter-note value. The widget
        // displays those as a beat count of 4 and denominator of 4.
        cy.get(`${meterDialog} input[type="number"]`).should("have.length", 2);
        cy.get(`${meterDialog} input[type="number"]`).eq(0).should("have.value", "4");
        cy.get(`${meterDialog} input[type="number"]`).eq(1).should("have.value", "4");
    });

    it("renders all three toolbar action buttons", () => {
        loadFixtureProject("meter-widget-minimal.tb");
        cy.get("#play").click();

        cy.get(meterDialog, { timeout: 45000 }).should("be.visible");

        for (const label of ["Play", "Save", "Reset"]) {
            cy.get(`${meterDialog} [role="button"][aria-label="${label}"]`).should("be.visible");
        }
    });

    it("closes the Meter widget and cleans up the DOM", () => {
        loadFixtureProject("meter-widget-minimal.tb");
        cy.get("#play").click();

        cy.get(meterDialog, { timeout: 45000 }).should("be.visible");

        // Confirm the wheel rendered before closing.
        cy.get(`${meterDialog} #meterWheelDiv`).should("be.visible");

        // Click the close button on the widget window titlebar.
        // MeterWidget wires widgetWindow.onclose to stop playback and call
        // widgetWindow.destroy() - which removes the .windowFrame from the DOM.
        cy.get(`${meterDialog} [role="button"][aria-label="Close window"]`).click();

        cy.get(meterDialog).should("not.exist");
        cy.get("#meterWheelDiv svg").should("not.exist");
    });
});
