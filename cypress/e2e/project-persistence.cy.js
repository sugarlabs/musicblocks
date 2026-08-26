describe("Project persistence", () => {
    before(() => {
        cy.clearLocalStorage();
        cy.visit("http://127.0.0.1:3000");
        cy.waitForAppReady();
    });

    it("restores a loaded project's blocks after a page reload", () => {
        cy.get("#load").click();
        cy.get("#myOpenFile").selectFile("examples/pi.tb", { force: true });

        cy.get("#load-container", { timeout: 30000 }).should("not.be.visible");
        cy.get("#errorText").should("not.be.visible");

        let blockNamesBeforeReload = [];

        cy.window()
            .should(win => {
                const { blockList } = win.ActivityContext.getActivity().blocks;
                expect(blockList.length, "pi.tb should have loaded real blocks").to.be.greaterThan(
                    0
                );
            })
            .then(win => {
                const { blockList } = win.ActivityContext.getActivity().blocks;
                blockNamesBeforeReload = blockList.map(block => block.name).sort();
            });

        // Reloading fires the app's own beforeunload handler (js/activity.js), which
        // synchronously calls ProjectManager.saveLocally() to write the current project
        // to localStorage under "SESSION<project>". On the next load, Activity.init()
        // (js/project-manager.js) reads that same key and restores the blocks via
        // blocks.loadNewBlocks(). This is the app's real persistence path: the toolbar
        // "Save" button (js/toolbar-ui.js) only exports HTML/PNG and never writes
        // session data, so it cannot be used to trigger this workflow.
        cy.reload();
        cy.waitForAppReady();

        cy.window().should(win => {
            const { blockList } = win.ActivityContext.getActivity().blocks;
            const blockNamesAfterReload = blockList.map(block => block.name).sort();

            expect(
                blockNamesAfterReload,
                "restored blocks should match the pre-reload stack"
            ).to.deep.equal(blockNamesBeforeReload);
        });
    });
});
