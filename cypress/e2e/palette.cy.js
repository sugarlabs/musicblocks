/* global cy, Cypress */

describe("Palette Interaction", () => {
    beforeEach(() => {
        cy.visit("/"); // go to the Music Blocks home page
    });

    it("opens a palette on click", () => {
        cy.get(".palette-button").first().click();
        cy.get(".palette-content").should("be.visible");
    });

    it("blocks inside palette are accessible", () => {
        cy.get(".palette-button").first().click();
        cy.get(".palette-block").first().should("exist");
    });

    it("palette closes on clicking outside", () => {
        cy.get(".palette-button").first().click();
        cy.get("body").click(0, 0); // click somewhere outside
        cy.get(".palette-content").should("not.be.visible");
    });
});
