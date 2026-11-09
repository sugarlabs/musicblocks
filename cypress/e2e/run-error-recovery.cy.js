describe("Run stopped by an error", () => {
    before(() => {
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
        cy.reload();
        cy.waitForAppReady();
    });

    it("ends the run so the fixed project plays on the next Play", () => {
        cy.get("#load").click();
        cy.get("#myOpenFile").selectFile("cypress/fixtures/note-value-zero-minimal.tb", {
            force: true
        });
        cy.window({ timeout: 30000 }).should(win => {
            const activity = win.ActivityContext.getActivity();
            expect(
                activity.blocks.blockList.some(
                    block => !block.trash && block.name === "number" && block.value === 0
                ),
                "project loaded"
            ).to.be.true;
            expect(activity.blocks.isLoading()).to.be.false;
            expect(activity.loading).to.be.false;
        });

        cy.get("#play").click();
        cy.get("#errorText", { timeout: 10000 }).should("be.visible");

        cy.window({ timeout: 10000 }).should(win => {
            const activity = win.ActivityContext.getActivity();
            expect(activity.turtles.running(), "no turtle left running").to.be.false;
            expect(activity.logo._alreadyRunning, "Play is not blocked").to.be.false;
            expect(activity.blocks.visible, "blocks shown again").to.be.true;
            expect(activity.logo.firstNoteAudioTime, "no note played").to.be.null;
        });
        cy.get("#saveButton").should("not.be.disabled");

        cy.window().then(win => {
            const { blockList } = win.ActivityContext.getActivity().blocks;
            const zero = blockList.find(
                block => !block.trash && block.name === "number" && block.value === 0
            );
            const point = zero.container.localToGlobal(zero.width / 2, zero.height / 2);
            const canvas = win.document.getElementById("myCanvas");
            cy.get("#myCanvas").click(
                point.x * (canvas.clientWidth / canvas.width),
                point.y * (canvas.clientHeight / canvas.height)
            );
        });
        cy.get("#numberLabel").should("be.visible").clear().type("4{enter}");
        cy.window().should(win => {
            const { blockList } = win.ActivityContext.getActivity().blocks;
            expect(
                blockList.some(
                    block => !block.trash && block.name === "number" && block.value === 0
                ),
                "the 0 was replaced"
            ).to.be.false;
        });

        cy.get("#play").should(play => expect(play[0].onclick).to.be.a("function"));
        cy.get("#play").click();

        cy.window({ timeout: 20000 }).should(win => {
            const { logo } = win.ActivityContext.getActivity();
            expect(logo.firstNoteAudioTime, "a note played after the fix").to.be.a("number");
            expect(logo.firstNoteAudioTime).to.be.greaterThan(0);
        });

        cy.get("#stop").click();
    });
});
