/* global cy, beforeEach, describe, it */

/**
 * Cypress E2E test suite for the Harmony widget.
 *
 * The Harmony widget (js/widgets/harmony.js) shows the intervals between the
 * notes the mice are playing. It is opened by running a `harmony` block.
 *
 * The fixture has three mice. On the first beat they play C4, E4 and G4.
 * On the second beat the first mouse plays C4, the second rests and the third
 * plays only a drum, so only one pitch is sounding.
 */

describe("Harmony widget", () => {
    beforeEach(() => {
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
        cy.visit("http://127.0.0.1:3000");
        cy.waitForAppReady();

        cy.get("#load").click();
        cy.get("#myOpenFile").selectFile("cypress/fixtures/harmony-widget-minimal.tb", {
            force: true
        });
        cy.get("#load-container").should("be.visible");
        cy.get("#load-container", { timeout: 30000 }).should("not.be.visible");
        cy.get("#errorText").should("not.be.visible");
    });

    it("shows the chord across mice, then leaves out rests and drums", () => {
        cy.get("#play").click();

        cy.get('.windowFrame[aria-label="harmony"]', { timeout: 30000 }).as("hw");
        cy.get("@hw").contains("C major").should("be.visible");
        cy.get("@hw")
            .contains("td", "C4 → E4")
            .parent()
            .find("td")
            .then($cells => {
                expect([...$cells].map(td => td.textContent)).to.deep.equal([
                    "C4 → E4",
                    "major 3",
                    "5:4",
                    "1.260",
                    "+13.7"
                ]);
            });
        cy.get("@hw").contains("td", "C4 → G4").should("be.visible");

        cy.get("@hw")
            .contains("Play two or more notes at the same time.", { timeout: 10000 })
            .should("be.visible");
        cy.get("@hw").contains("td", "C2").should("not.exist");
    });
});
