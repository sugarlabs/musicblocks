/* global cy, beforeEach, describe, it */

/**
 * Cypress E2E test suite for the Temperament widget.
 *
 * The Temperament widget (js/widgets/temperament.js) allows users to explore,
 * play, and customize musical tuning systems. It is opened by running a
 * `temperament` block (via Play).
 *
 * These tests exercise the widget's launch and UI lifecycle through
 * the real application:
 *  1. Loading a fixture project that contains a temperament block.
 *  2. Pressing Play to open the widget.
 *  3. Verifying the widget window, canvas visualizer, and toolbar render.
 *  4. Closing the widget and confirming it is fully removed from the DOM.
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

const openTemperamentWidget = () => {
    loadFixtureProject("temperament-widget-minimal.tb");
    cy.get("#play").click();
    cy.get('.windowFrame[aria-label="temperament"]', { timeout: 30000 }).should("be.visible");
};

describe("Temperament widget", () => {
    beforeEach(() => {
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
        cy.visit("http://127.0.0.1:3000");
        cy.waitForAppReady();

        // Dismiss the first-run "Take a Tour" guide.
        cy.get("body").then($body => {
            const closeButtons = $body.find(".windowFrame .wftButton.close");
            if (closeButtons.length) {
                cy.wrap(closeButtons).click({ multiple: true, force: true });
            }
        });
    });

    it("opens the Temperament widget and renders the visualizer canvas", () => {
        openTemperamentWidget();
        cy.get(".windowFrame .wftTitle", { timeout: 30000 })
            .should("be.visible")
            .and("contain.text", "temperament");
        cy.get('.windowFrame[aria-label="temperament"]')
            .find("canvas")
            .should("exist")
            .and("be.visible");
        cy.get('.windowFrame[aria-label="temperament"]').contains("th", "Pitch").should("exist");
    });

    it("renders the toolbar with visualizer controls", () => {
        openTemperamentWidget();
        cy.get('.windowFrame[aria-label="temperament"]').as("tw");
        cy.get("@tw").find('img[title*="Play all"]').should("exist");
        cy.get("@tw").find('img[title*="Save"]').should("exist");
        cy.get("@tw").find('img[title*="Add pitch after"]').should("exist");
        cy.get("@tw").find('img[title*="Add pitch before"]').should("exist");
        cy.get("@tw").find('img[title*="Remove"]').should("exist");
    });

    it("visualizer shows legend, pitch table and selector", () => {
        openTemperamentWidget();
        const tw = () => cy.get('.windowFrame[aria-label="temperament"]');
        tw().find("canvas").should("have.attr", "role", "img");
        tw().contains("active temperament").should("exist");
        tw().contains("12-EDO reference").should("exist");
        tw().contains("no deviation").should("exist");
        tw().contains("sharp (+cents)").should("exist");
        tw().contains("flat (-cents)").should("exist");
        tw().contains("th", "Step").should("exist");
        tw().contains("th", "Frequency (Hz)").should("exist");
        tw().contains("th", "Cents dev. from 12-EDO").should("exist");
        tw().contains("th", "Ratio").should("exist");
        tw().find("tbody tr").should("have.length", 12);
        tw().find('select[aria-label="temperament"]').should("exist");
        tw().find('select[aria-label="temperament"] option').should("have.length.greaterThan", 1);
    });

    it("closes the Temperament widget and cleans up the DOM", () => {
        // Ignore only the known WidgetWindow.updateTitle null dereference fired
        // by close; any other app error still fails the test.
        cy.on("uncaught:exception", err => {
            if (err.message.includes("Cannot set properties of null")) {
                return false;
            }
        });
        openTemperamentWidget();
        cy.get('.windowFrame[aria-label="temperament"]')
            .find('[title="Close"]')
            .first()
            .click({ force: true });
        cy.get('.windowFrame[aria-label="temperament"]').should("not.exist");
        cy.get("canvas[role='img'][aria-label='Temperament visualizer circle']").should(
            "not.exist"
        );
    });
});
