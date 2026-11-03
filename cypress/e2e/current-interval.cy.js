/* global cy, describe, it */

/**
 * Cypress E2E test for the Current interval block.
 *
 * Each note in the fixture holds two pitches and prints the current interval.
 * Octave numbers change at C, so A4 to C5 is a minor third even though the
 * octave number goes up by one, and G4 to E4 goes down although the octave
 * number stays the same.
 */

describe("Current interval block", () => {
    it("names intervals that cross a C", () => {
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
        cy.visit("http://127.0.0.1:3000");
        cy.waitForAppReady();

        cy.get("#load").click();
        cy.get("#myOpenFile").selectFile("cypress/fixtures/current-interval-minimal.tb", {
            force: true
        });
        cy.get("#load-container", { timeout: 30000 }).should("not.be.visible");
        cy.get("#errorText").should("not.be.visible");

        const printed = [];
        cy.window().then(win => {
            const activity = win.ActivityContext.getActivity();
            const textMsg = activity.textMsg.bind(activity);
            activity.textMsg = (msg, ...rest) => {
                printed.push(String(msg));
                return textMsg(msg, ...rest);
            };
        });

        cy.window({ timeout: 20000 }).should(win => {
            const blocks = win.ActivityContext.getActivity().blocks;
            const printBlocks = blocks.blockList.filter(blk => blk.name === "print");
            expect(printBlocks, "all print blocks loaded").to.have.length(12);
        });
        cy.get("#play").click();

        const expected = [
            "Perfect fifth", // C4 -> G4
            "Minor third", // A4 -> C5
            "Perfect fifth", // A4 -> E5
            "Diminished fifth", // B3 -> F4
            "Perfect fifth", // G4 -> D5
            "Perfect octave", // C4 -> C5
            "Perfect octave", // A4 -> A5
            "Perfect fifth below", // E5 -> A4
            "Minor third below", // G4 -> E4
            "Minor tenth below", // C5 -> A3
            "Perfect twelfth below", // G5 -> C4
            "Minor third,  two octaves below" // C6 -> A3
        ];
        cy.wrap(printed, { timeout: 20000 }).should(messages => {
            const intervals = messages.filter(msg => !msg.startsWith("Start by"));
            expect(intervals).to.deep.equal(expected);
        });
    });
});
