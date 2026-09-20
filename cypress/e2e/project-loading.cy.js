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
        // constructed (js/project-manager.js doLoadAnimation), and is hidden again
        // once loading finishes (js/blocks.js loadNewBlocks completion handler).
        // Asserting the visible state first confirms this run actually went through
        // that overlay, so the later "not visible" isn't trivially true because
        // loading never started.
        cy.get("#load-container").should("be.visible");
        cy.get("#load-container", { timeout: 30000 }).should("not.be.visible");

        // A parse/load failure would surface here (js/project-manager.js errorMsg).
        cy.get("#errorText").should("not.be.visible");
        cy.get("#canvas").should("be.visible");

        cy.window().should(win => {
            const activity = win.ActivityContext.getActivity();
            const { blockList } = activity.blocks;

            expect(blockList.length).to.be.greaterThan(baselineBlockCount);

            // examples/pi.tb is the only example project referencing "heap.json"
            // (its digit-heap data file), so finding that literal value among the
            // loaded blocks confirms this project specifically loaded, not just
            // that some blocks appeared.
            const loadedPiHeap = blockList.some(
                block => block.name === "loadFile" && block.value?.[0] === "heap.json"
            );
            expect(loadedPiHeap, "pi.tb's heap.json loadFile block should be present").to.be.true;
        });
    });
});
