describe("Project loading", () => {
    before(() => {
        cy.visit("http://127.0.0.1:3000");
        cy.waitForAppReady();
    });

    it("loads a real project file (examples/pi.tb) onto the canvas", () => {
        let baselineBlockCount = 0;

        cy.window().then(win => {
            baselineBlockCount = win.ActivityContext.getActivity().blocks.blockList.length;
        });

        cy.get("#load").click();
        cy.get("#myOpenFile").selectFile("examples/pi.tb", { force: true });

        // The load overlay is shown while the project's blocks are parsed and
        // constructed, and is hidden again once loading finishes (js/blocks.js
        // loadNewBlocks completion handler). Waiting for it to disappear is the
        // app's own signal that loading is done, so no arbitrary wait is needed.
        cy.get("#load-container", { timeout: 30000 }).should("not.be.visible");

        // A parse/load failure would surface here (js/project-manager.js errorMsg).
        cy.get("#errorText").should("not.be.visible");
        cy.get("#canvas").should("be.visible");

        cy.window().should(win => {
            const activity = win.ActivityContext.getActivity();
            expect(activity.blocks.blockList.length).to.be.greaterThan(baselineBlockCount);
        });
    });
});
