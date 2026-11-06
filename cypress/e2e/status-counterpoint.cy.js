/* global cy, describe, it */

/**
 * Cypress E2E test for hidden fifths and consonance in the Harmony row of the
 * Status widget.
 *
 * The fixture has a status block and two mice. The first plays C4, D4 and the
 * second E4, A4: both move up into a fifth, the upper voice by a leap, so the
 * outer voices make a hidden fifth.
 */

describe("Status widget counterpoint", () => {
    it("names the hidden fifth and the consonance of each interval", () => {
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
        cy.visit("http://127.0.0.1:3000");
        cy.waitForAppReady();

        let loaded = false;
        cy.window().then(win => {
            win.pubsub.once("finishedLoading", () => {
                loaded = true;
            });
        });
        cy.get("#load").click();
        cy.get("#myOpenFile").selectFile("cypress/fixtures/status-hidden-fifths.tb", {
            force: true
        });
        cy.wrap(null, { timeout: 30000 }).should(() => {
            expect(loaded, "project loaded").to.equal(true);
        });
        cy.get("#errorText").should("not.be.visible");
        cy.window({ timeout: 20000 }).should(win => {
            const turtles = win.ActivityContext.getActivity().turtles.turtleList;
            expect(turtles.filter(turtle => !turtle.inTrash)).to.have.length(2);
        });

        // Record every warning and consonance the Harmony row shows, even if
        // the Status window rebuilds its table.
        const shown = [];
        const consonances = [];
        cy.get("#play").click();
        cy.get('.windowFrame[aria-label="status"]', { timeout: 30000 }).then($frame => {
            const record = () => {
                for (const div of $frame[0].querySelectorAll("td > div")) {
                    const text = div.textContent;
                    if (/^(parallel|hidden) /.test(text) && !shown.includes(text)) {
                        shown.push(text);
                    }
                }
                for (const row of $frame[0].querySelectorAll("td table tr")) {
                    const cells = [...row.cells].map(cell => cell.textContent);
                    const entry = cells[0] + " " + cells[cells.length - 1];
                    if (
                        cells.length === 6 &&
                        cells[0].includes("→") &&
                        !consonances.includes(entry)
                    ) {
                        consonances.push(entry);
                    }
                }
            };
            record();
            new MutationObserver(record).observe($frame[0], { childList: true, subtree: true });
        });

        cy.wrap(shown, { timeout: 20000 }).should("deep.equal", [
            "hidden fifths: mouse 1 C4 → D4, mouse 2 E4 → A4"
        ]);
        cy.wrap(consonances, { timeout: 20000 }).should("include", "D4 → A4 perfect");
        cy.wrap(consonances).should("include", "C4 → E4 imperfect");
    });
});
