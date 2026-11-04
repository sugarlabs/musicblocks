/* global cy, describe, it */

/**
 * Cypress E2E test for nested Set Instrument blocks.
 *
 * The fixture plays, in one mouse:
 * Set Instrument piano { C4, Set Instrument violin { D4, Set Instrument piano { E4 }, F4 }, G4 }, A4
 * Each note must play the instrument of the innermost block around it.
 */

describe("Nested Set Instrument blocks", () => {
    it("play the innermost instrument, even one an outer block already uses", () => {
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
        cy.visit("http://127.0.0.1:3000");
        cy.waitForAppReady();

        cy.get("#load").click();
        cy.get("#myOpenFile").selectFile("cypress/fixtures/set-instrument-nested.tb", {
            force: true
        });
        cy.get("#load-container").should("be.visible");
        cy.get("#load-container", { timeout: 30000 }).should("not.be.visible");
        cy.get("#errorText").should("not.be.visible");
        cy.window({ timeout: 20000 }).should(win => {
            const blocks = win.ActivityContext.getActivity().blocks.blockList;
            expect(blocks.filter(blk => blk.name === "settimbre" && !blk.trash)).to.have.length(3);
        });

        const played = [];
        cy.window().then(win => {
            const synth = win.ActivityContext.getActivity().logo.synth;
            const trigger = synth.trigger;
            synth.trigger = (turtle, notes, beatValue, instrument, ...rest) => {
                played.push([].concat(notes).join("+") + " " + instrument);
                return trigger(turtle, notes, beatValue, instrument, ...rest);
            };
        });
        cy.get("#play").click();

        cy.wrap(played, { timeout: 20000 }).should("deep.equal", [
            "C4 piano",
            "D4 violin",
            "E4 piano",
            "F4 violin",
            "G4 piano",
            "A4 electronic synth"
        ]);
    });
});
