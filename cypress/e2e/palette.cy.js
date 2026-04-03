/* global cy */
describe("Palette Interaction", () => {
    beforeEach(() => {
        cy.visit("/");
        cy.wait(3000);
    });

    it("opens Rhythm palette", () => {
        cy.contains("Rhythm").click();
    });

    it("switching palettes works", () => {
        cy.contains("Rhythm").click();
        cy.contains("Meter").click();
    });
});
