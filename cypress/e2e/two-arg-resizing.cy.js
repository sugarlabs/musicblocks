describe("Two-arg block vertical resizing (Issue #9563)", () => {
    beforeEach(() => {
        cy.visit("http://127.0.0.1:3000");
        cy.waitForAppReady();
    });

    it("resizes setxy vertically when compound expressions are docked in both argument slots", () => {
        // Dismiss any tour or hint popups that may appear on startup
        cy.get("body").then($body => {
            const closeButtons = $body.find(
                ".widget-close, .tour-close, button[aria-label='Close'], #hint-close, .close"
            );
            if (closeButtons.length > 0) {
                closeButtons.click({ force: true, multiple: true });
            }
        });

        cy.window().then(win => {
            const activity = win.ActivityContext.getActivity();

            // Clear any open tour or widget windows
            if (win.widgetWindows && typeof win.widgetWindows.hideAllWindows === "function") {
                win.widgetWindows.hideAllWindows();
            }
            if (typeof win.closeWidgets === "function") {
                win.closeWidgets();
            }

            // Remove any floating banner or hint overlay elements
            document
                .querySelectorAll(".help-window, .tour-window, [id*='hint']")
                .forEach(el => el.remove());

            const testProject = [
                [0, "start", 500, 150, [null, 1, null]],
                [1, "clean", 0, 0, [0, 2]],
                [2, "setxy", 0, 0, [1, 3, 6, 9]],
                [3, "multiply", 0, 0, [2, 4, 5]],
                [4, "random", 0, 0, [3, null, null]],
                [5, ["number", { value: 10 }], 0, 0, [3]],
                [6, "multiply", 0, 0, [2, 7, 8]],
                [7, "random", 0, 0, [6, null, null]],
                [8, ["number", { value: 10 }], 0, 0, [6]],
                [9, "pendown", 0, 0, [2, null]]
            ];

            activity.sendAllToTrash(false, true);

            return new Promise(resolve => {
                setTimeout(() => {
                    activity.blocks.loadNewBlocks(testProject);
                    win.pubsub.once("finishedLoading", () => {
                        activity.refreshCanvas();
                        setTimeout(() => {
                            activity.stage.update();
                            resolve();
                        }, 500);
                    });
                }, 300);
            });
        });

        cy.window().should(win => {
            const activity = win.ActivityContext.getActivity();
            const setxyBlock = activity.blocks.blockList.find(
                b => b && !b.trash && b.name === "setxy"
            );
            const pendownBlock = activity.blocks.blockList.find(
                b => b && !b.trash && b.name === "pendown"
            );
            const multiplyBlocks = activity.blocks.blockList.filter(
                b => b && !b.trash && b.name === "multiply"
            );

            expect(setxyBlock, "setxy block exists").to.exist;
            expect(pendownBlock, "pendown block exists").to.exist;
            expect(multiplyBlocks).to.have.length(2);

            // Both slot clamp counts should reflect the compound children
            expect(setxyBlock.clampCount[0], "slot 0 clamp count").to.be.greaterThan(1);
            expect(setxyBlock.clampCount[1], "slot 1 clamp count").to.be.greaterThan(1);

            // pendown y should be below setxy y + expanded height
            expect(pendownBlock.container.y, "pendown is below setxy").to.be.greaterThan(
                setxyBlock.container.y + 80
            );
        });

        cy.screenshot("two_arg_resize_issue_9563_verified", { capture: "viewport" });
    });
});
