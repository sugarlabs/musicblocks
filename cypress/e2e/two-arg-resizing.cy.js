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
                [2, "setxy", 0, 0, [1, 3, 7, 11]],
                // x slot: multiply (3) with number 50 in slot 1 and random in slot 2
                [3, "multiply", 0, 0, [2, 4, 5]],
                [4, ["number", { value: 50 }], 0, 0, [3]],
                [5, "random", 0, 0, [3, null, 6]],
                [6, ["number", { value: 4 }], 0, 0, [5]],
                // y slot: multiply (7) with number 50 in slot 1 and random in slot 2
                [7, "multiply", 0, 0, [2, 8, 9]],
                [8, ["number", { value: 50 }], 0, 0, [7]],
                [9, "random", 0, 0, [7, null, 10]],
                [10, ["number", { value: 4 }], 0, 0, [9]],
                // pendown under setxy (11)
                [11, "pendown", 0, 0, [2, null]]
            ];

            return new Promise(resolve => {
                const loadAfterTrash = () => {
                    activity.stage.removeEventListener("trashsignal", loadAfterTrash);
                    win.pubsub.once("finishedLoading", () => {
                        const start = activity.blocks.blockList.find(
                            b => b && !b.trash && b.name === "start"
                        );
                        if (start) {
                            activity.blocks.adjustDocks(start.blockIndex, true);
                        }
                        activity.refreshCanvas();
                        resolve();
                    });
                    activity.blocks.loadNewBlocks(testProject);
                };
                activity.stage.addEventListener("trashsignal", loadAfterTrash);
                activity.sendAllToTrash(false, true);
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

            // multiply blocks should expand slot 1 to accommodate the compound random blocks
            expect(multiplyBlocks[0].clampCount[1], "first multiply slot 1 clamp count").to.equal(
                2
            );
            expect(multiplyBlocks[1].clampCount[1], "second multiply slot 1 clamp count").to.equal(
                2
            );

            // setxy should expand both slots to accommodate the compound multiply blocks
            expect(setxyBlock.clampCount[0], "setxy slot 0 clamp count").to.be.greaterThan(1);
            expect(setxyBlock.clampCount[1], "setxy slot 1 clamp count").to.be.greaterThan(1);
            expect(setxyBlock.size, "setxy total size").to.be.greaterThan(2);

            // pendown should dock cleanly below setxy without overlapping the second multiply
            expect(pendownBlock.container.y, "pendown is below setxy").to.be.greaterThan(
                setxyBlock.container.y + 100
            );
            expect(
                pendownBlock.container.y,
                "pendown is below second multiply block"
            ).to.be.greaterThan(multiplyBlocks[1].container.y);
        });

        cy.screenshot("two_arg_resize_issue_9563_verified", { capture: "viewport" });
    });
});
