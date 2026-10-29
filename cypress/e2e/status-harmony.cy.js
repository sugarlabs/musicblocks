/* global cy, beforeEach, describe, it */

/**
 * Cypress E2E test suite for the Harmony row of the Status widget.
 *
 * The Status widget (js/widgets/status.js) has a Harmony row that shows the
 * chord and the intervals sounding across all the mice.
 *
 * The fixture has a status block and three mice. On the first beat they play
 * C4, E4 and G4. On the second beat the first mouse plays C4, the second rests
 * and the third plays only a drum, so only one pitch is sounding.
 */

const harmonyCell = () =>
    cy
        .get('.windowFrame[aria-label="status"]', { timeout: 30000 })
        .contains("td", "Harmony")
        .parent("tr")
        .find("td")
        .eq(1);

describe("Status widget Harmony row", () => {
    beforeEach(() => {
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
        cy.visit("http://127.0.0.1:3000");
        cy.waitForAppReady();

        cy.get("#load").click();
        cy.get("#myOpenFile").selectFile("cypress/fixtures/status-harmony-minimal.tb", {
            force: true
        });
        cy.get("#load-container").should("be.visible");
        cy.get("#load-container", { timeout: 30000 }).should("not.be.visible");
        cy.get("#errorText").should("not.be.visible");
    });

    it("shows the chord across mice, then leaves out rests and drums", () => {
        cy.get("#play").click();

        harmonyCell().should("contain.text", "C major");
        harmonyCell()
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
        harmonyCell().contains("td", "C4 → G4").should("be.visible");

        // Second beat: while the C4 mouse's second note is still sounding, the
        // rest and the drum of the other mice must not produce interval rows.
        cy.window({ timeout: 10000 }).should(win => {
            const activity = win.ActivityContext.getActivity();
            const sounds = activity.turtles.turtleList
                .filter(turtle => !turtle.inTrash && turtle.singer.pitchStatus)
                .flatMap(turtle => turtle.singer.pitchStatus);
            const secondC4 = sounds.find(sound => sound.notes[0] === "C4" && sound.start > 0);
            expect(secondC4, "the C4 mouse is on its second note").to.exist;
            expect(Date.now(), "that note is still sounding").to.be.below(secondC4.endsAt);

            const row = [
                ...win.document.querySelectorAll('.windowFrame[aria-label="status"] tr')
            ].find(tr => tr.cells[0] && tr.cells[0].textContent.includes("Harmony"));
            expect(row.cells[1].textContent, "no chord or intervals").to.equal("");
        });
    });
});
