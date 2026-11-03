/* global cy, describe, it */

/**
 * Cypress E2E test for parallel motion in the Harmony row of the Status widget.
 *
 * The fixture has a status block and two mice. The first plays C4, D4, E4 and
 * the second G4, A4, B4, so they move up together in perfect fifths twice.
 */

describe("Status widget parallel fifths", () => {
    it("names each parallel fifth while it is sounding", () => {
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
        cy.visit("http://127.0.0.1:3000");
        cy.waitForAppReady();

        cy.get("#load").click();
        cy.get("#myOpenFile").selectFile("cypress/fixtures/status-parallel-fifths.tb", {
            force: true
        });
        cy.get("#load-container").should("be.visible");
        cy.get("#load-container", { timeout: 30000 }).should("not.be.visible");
        cy.get("#errorText").should("not.be.visible");
        cy.window({ timeout: 20000 }).should(win => {
            const turtles = win.ActivityContext.getActivity().turtles.turtleList;
            expect(turtles.filter(turtle => !turtle.inTrash)).to.have.length(2);
        });

        // Record every warning the Harmony row shows, even if the Status
        // window rebuilds its table.
        const shown = [];
        cy.get("#play").click();
        cy.get('.windowFrame[aria-label="status"]', { timeout: 30000 }).then($frame => {
            const record = () => {
                for (const div of $frame[0].querySelectorAll("td > div")) {
                    const text = div.textContent;
                    if (text.startsWith("parallel") && !shown.includes(text)) {
                        shown.push(text);
                    }
                }
            };
            record();
            new MutationObserver(record).observe($frame[0], { childList: true, subtree: true });
        });

        cy.wrap(shown, { timeout: 20000 }).should("deep.equal", [
            "parallel fifths: mouse 1 C4 → D4, mouse 2 G4 → A4",
            "parallel fifths: mouse 1 D4 → E4, mouse 2 A4 → B4"
        ]);
    });
});
