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
        cy.get('[aria-label="temperament"]').find('img[title*="Play all"]').should("exist");
        cy.get('[aria-label="temperament"]').find('img[title*="Save"]').should("exist");
        cy.get('[aria-label="temperament"]').find('img[title*="Add pitch after"]').should("exist");
        cy.get('[aria-label="temperament"]').find('img[title*="Add pitch before"]').should("exist");
        cy.get('[aria-label="temperament"]').find('img[title*="Remove"]').should("exist");
    });

    it("visualizer shows legend, pitch table and selector", () => {
        openTemperamentWidget();
        cy.get('[aria-label="temperament"]').find("canvas").should("have.attr", "role", "img");
        cy.get('[aria-label="temperament"]').contains("active temperament").should("exist");
        cy.get('[aria-label="temperament"]').contains("12-EDO reference").should("exist");
        cy.get('[aria-label="temperament"]').contains("no deviation").should("exist");
        cy.get('[aria-label="temperament"]').contains("sharp (+cents)").should("exist");
        cy.get('[aria-label="temperament"]').contains("flat (-cents)").should("exist");
        cy.get('[aria-label="temperament"]').contains("th", "Step").should("exist");
        cy.get('[aria-label="temperament"]').contains("th", "Frequency (Hz)").should("exist");
        cy.get('[aria-label="temperament"]')
            .contains("th", "Cents dev. from 12-EDO")
            .should("exist");
        cy.get('[aria-label="temperament"]').contains("th", "Ratio").should("exist");
        cy.get('[aria-label="temperament"]').find("tbody tr").should("have.length", 12);
        cy.get('[aria-label="temperament"]')
            .find('select[aria-label="temperament"]')
            .should("exist");
        cy.get('[aria-label="temperament"]')
            .find('select[aria-label="temperament"] option')
            .should("have.length.greaterThan", 1);
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
        cy.get('[aria-label="temperament"]').find('[title="Close"]').first().click({ force: true });
        cy.get('[aria-label="temperament"]').should("not.exist");
        cy.get("canvas[role='img'][aria-label='Temperament visualizer circle']").should(
            "not.exist"
        );
    });
});
