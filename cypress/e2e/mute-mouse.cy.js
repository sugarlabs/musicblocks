/* global cy, describe, it */

/**
 * Cypress E2E test for muting a mouse from its Start block menu.
 *
 * The fixture has two mice: C4 D4 E4 and G4 A4 B4. The first one is muted
 * from its menu, so only the second one is heard, while the first still runs
 * its notes in time.
 */

describe("Mute a mouse", () => {
    it("plays the muted mouse silently, in time, and saves it as muted", () => {
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
        cy.get("#myOpenFile").selectFile("cypress/fixtures/mute-two-mice.tb", { force: true });
        cy.wrap(null, { timeout: 30000 }).should(() => {
            expect(loaded, "project loaded").to.equal(true);
        });
        cy.get("#errorText").should("not.be.visible");
        cy.window({ timeout: 20000 }).should(win => {
            const turtles = win.ActivityContext.getActivity().turtles.turtleList;
            expect(
                turtles.filter(turtle => !turtle.inTrash),
                "both mice"
            ).to.have.length(2);
        });

        // Open the first Start block's menu and choose Mute.
        cy.window().then(win => {
            const activity = win.ActivityContext.getActivity();
            const start = activity.blocks.blockList.find(blk => blk.name === "start" && !blk.trash);
            activity.blocks.activeBlock = start.blockIndex;
            win.piemenuBlockContext(start);
        });
        // Find the item by its tooltip, not by its place in the wheel.
        cy.get("#contextWheelDiv")
            .should("be.visible")
            .then($wheel => {
                const slices = [
                    ...$wheel[0].querySelectorAll("[id^='wheelnav-contextWheelDiv-slice-']")
                ];
                const mute = slices.find(
                    slice => slice.querySelector("title")?.textContent === "Mute"
                );
                expect(mute, "Mute item").to.exist;
                cy.wrap(mute).click({ force: true });
            });

        const played = [];
        cy.window().then(win => {
            const activity = win.ActivityContext.getActivity();
            const mice = activity.turtles.turtleList.filter(turtle => !turtle.inTrash);
            expect(mice.map(turtle => turtle.muted)).to.deep.equal([true, false]);

            const synth = activity.logo.synth;
            const trigger = synth.trigger;
            synth.trigger = (turtle, notes, ...rest) => {
                played.push(activity.turtles.ithTurtle(turtle).muted + " " + notes);
                return trigger(turtle, notes, ...rest);
            };
        });
        cy.get("#play").click();

        cy.wrap(played, { timeout: 20000 }).should("deep.equal", [
            "false G4",
            "false A4",
            "false B4"
        ]);
        cy.window({ timeout: 20000 }).should(win => {
            const activity = win.ActivityContext.getActivity();
            const mice = activity.turtles.turtleList.filter(turtle => !turtle.inTrash);
            // The muted mouse still played its notes, in time with the other.
            expect(mice.map(turtle => turtle.singer.turtleTime)).to.deep.equal([2, 2]);
            expect(mice[0].singer.noteStatus[0]).to.deep.equal(["E4"]);

            const saved = JSON.parse(activity.prepareExport())
                .filter(row => Array.isArray(row[1]) && row[1][0] === "start")
                .map(row => row[1][1].muted);
            expect(saved).to.deep.equal([true, undefined]);
        });
    });
});
