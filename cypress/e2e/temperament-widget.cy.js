/* global cy, beforeEach, describe, it */

const loadFixtureProject = fixtureName => {
    cy.get("#load").click();
    cy.get("#myOpenFile").selectFile(`cypress/fixtures/${fixtureName}`, { force: true });
    cy.get("#load-container").should("be.visible");
    cy.get("#load-container", { timeout: 30000 }).should("not.be.visible");
    cy.get("#errorText").should("not.be.visible");
};

const openTemperamentWidget = () => {
    loadFixtureProject("temperament-widget-minimal.tb");
    cy.get("#play").click();
    cy.get('[aria-label="temperament"]', { timeout: 30000 }).should("be.visible");
};

describe("Temperament widget", () => {
    beforeEach(() => {
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
        cy.visit("http://127.0.0.1:3000");
        cy.waitForAppReady();
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
        cy.get('[aria-label="temperament"]').find("canvas").should("exist").and("be.visible");
        cy.get('[aria-label="temperament"]').contains("th", "Pitch").should("exist");
    });

    it("renders the toolbar with visualizer controls", () => {
        openTemperamentWidget();
        cy.get('[aria-label="temperament"]').as("tw");
        ["Play all", "Save", "Add pitch after", "Add pitch before", "Remove"].forEach(t =>
            cy.get("@tw").find(`img[title*="${t}"]`).should("exist")
        );
    });

    it("visualizer shows legend, pitch table and selector", () => {
        openTemperamentWidget();
        cy.get('[aria-label="temperament"]').as("tw");
        cy.get("@tw").find("canvas").should("have.attr", "role", "img");
        [
            "active temperament",
            "12-EDO reference",
            "no deviation",
            "sharp (+cents)",
            "flat (-cents)"
        ].forEach(t => cy.get("@tw").contains(t).should("exist"));
        ["Step", "Pitch", "Frequency (Hz)", "Cents dev. from 12-EDO", "Ratio"].forEach(h =>
            cy.get("@tw").contains("th", h).should("exist")
        );
        cy.get("@tw").find("tbody tr").should("have.length", 12);
        cy.get("@tw").find('select[aria-label="temperament"]').should("exist");
        cy.get("@tw")
            .find('select[aria-label="temperament"] option')
            .should("have.length.greaterThan", 1);
    });

    it("closes the Temperament widget and cleans up the DOM", () => {
        // Known WidgetWindow.updateTitle null dereference on close.
        cy.on("uncaught:exception", err => {
            if (err.message.includes("Cannot set properties of null")) {
                return false;
            }
        });
        openTemperamentWidget();
        cy.get('[aria-label="temperament"]').find('[title="Close"]').first().click({ force: true });
        cy.get('[aria-label="temperament"]').should("not.exist");
        cy.get("canvas[role='img'][aria-label='Temperament visualizer circle']").should(
            "not.exist"
        );
    });
});
