describe("circular connection validation in loadNewBlocks", () => {
    it("rejects multi-block circular connection projects", () => {
        cy.visit("http://127.0.0.1:3000/", {
            onBeforeLoad(win) {
                cy.stub(win.console, "debug").as("consoleDebug");
            }
        });

        // Wait for page to load
        cy.get("#myCanvas", { timeout: 30000 }).should("be.visible");

        cy.window().then(win => {
            const activity = win.globalActivity || win.ActivityContext.getActivity();
            expect(activity).to.exist;

            const maliciousProject = [
                [0, "start", 100, 100, [null, 1, null]],
                [1, "action", 200, 100, [null, 0, null]]
            ];

            activity.blocks.loadNewBlocks(maliciousProject);

            cy.get("@consoleDebug").should(
                "have.been.calledWithMatch",
                /Circular connection in block data/
            );
            cy.get("@consoleDebug").should(
                "have.been.calledWith",
                "Punting loading of new blocks!"
            );
        });
    });

    it("allows valid acyclic project blocks", () => {
        cy.visit("http://127.0.0.1:3000/", {
            onBeforeLoad(win) {
                cy.stub(win.console, "debug").as("consoleDebug");
            }
        });

        // Wait for page to load
        cy.get("#myCanvas", { timeout: 30000 }).should("be.visible");

        cy.window().then(win => {
            const activity = win.globalActivity || win.ActivityContext.getActivity();
            expect(activity).to.exist;

            const validProject = [
                [0, "start", 100, 100, [null, 1, null]],
                [1, "forward", 200, 100, [0, null, null]]
            ];

            activity.blocks.loadNewBlocks(validProject);

            // It should not log circular connection messages
            cy.get("@consoleDebug").should(
                "not.have.been.calledWithMatch",
                /Circular connection in block data/
            );
        });
    });
});
