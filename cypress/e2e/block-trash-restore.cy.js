/* global cy, describe, it, beforeEach, expect */

describe("Block trash and restore", () => {
    beforeEach(() => {
        // Music Blocks restores its last workspace from localStorage, so each
        // run starts from the known starter project instead of test leftovers.
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
        cy.reload();
        cy.waitForAppReady();

        // The first-run tour is also a windowFrame and would make the widget
        // selectors below ambiguous if it is still open.
        cy.get("body").then($body => {
            const closeButtons = $body.find(".windowFrame .wftButton.close");
            if (closeButtons.length) {
                cy.wrap(closeButtons).click({ multiple: true, force: true });
            }
        });
    });

    it("deletes a palette block to trash and restores it", () => {
        // Use the visible category label and the block's aria-label rather
        // than relying on palette row positions.
        cy.contains('[width="126"] tbody tr', "Pitch").find("img").click();
        cy.get("#palette", { timeout: 15000 }).should("be.visible");

        cy.get('#PaletteBody tbody tr[aria-label="pitch"] img', { timeout: 15000 })
            .scrollIntoView()
            .should("be.visible");

        cy.window().then(win => {
            const activity = win.ActivityContext.getActivity();
            const blocks = activity.blocks;
            const startBlk = blocks.blockList.findIndex(b => !b.trash && b.name === "start");
            const start = blocks.blockList[startBlk];
            const previousChild = start.connections[1];
            const pitchModelEntry = activity.palettes.dict["pitch"].model.blocks.find(
                b => b.blkname === "pitch"
            );
            expect(pitchModelEntry).to.exist;
            const templateDocks = pitchModelEntry.docks;

            // The palette drag handler uses the block's dock geometry. Calculate
            // the target from the live starter block so this remains independent
            // of the starter project's exact layout.
            cy.wrap({
                startBlk,
                previousChild,
                targetContainerX: start.container.x + start.docks[1][0] - templateDocks[0][0],
                targetContainerY: start.container.y + start.docks[1][1] - templateDocks[0][1]
            }).as("dropPlan");
        });

        cy.get("@dropPlan").then(plan => {
            cy.get('#PaletteBody tbody tr[aria-label="pitch"] img').then($img => {
                const rect = $img[0].getBoundingClientRect();
                const startX = rect.x + rect.width / 2;
                const startY = rect.y + rect.height / 2;
                const endX = plan.targetContainerX + rect.width / 2;
                const endY = plan.targetContainerY + rect.height / 2;

                cy.get('#PaletteBody tbody tr[aria-label="pitch"] img')
                    .trigger("mousedown", { which: 1, pageX: startX, pageY: startY, force: true })
                    .then($draggedImg => {
                        cy.document().trigger("mousemove", {
                            pageX: (startX + endX) / 2,
                            pageY: (startY + endY) / 2
                        });
                        cy.document().trigger("mousemove", { pageX: endX, pageY: endY });
                        cy.wrap($draggedImg).trigger("mouseup", {
                            which: 1,
                            pageX: endX,
                            pageY: endY,
                            force: true
                        });
                    });
            });
        });

        cy.get("@dropPlan").then(plan => {
            cy.window().then(win => {
                const blocks = win.ActivityContext.getActivity().blocks;
                const start = blocks.blockList[plan.startBlk];
                const newBlockId = start.connections[1];
                const newBlock = blocks.blockList[newBlockId];

                expect(newBlockId).to.not.equal(plan.previousChild);
                expect(newBlock).to.exist;
                expect(newBlock.name).to.equal("pitch");
                expect(newBlock.trash).to.be.false;
                expect(newBlock.connections[0]).to.equal(plan.startBlk);

                cy.wrap({ blockId: newBlockId }).as("blockPlan");
            });
        });

        // The trash highlight must finish before production accepts a release.
        // Cypress's clock advances that real animation without an arbitrary wait.
        cy.clock();
        cy.get("@blockPlan").then(({ blockId }) => {
            cy.window().then(win => {
                const activity = win.ActivityContext.getActivity();
                const block = activity.blocks.blockList[blockId];
                const trash = activity.trashcan._container;
                win.hasMouse = true;
                const endX = trash.x + 10;
                const endY = trash.y + 10;
                const stageScale = activity.getStageScale();
                expect(activity.trashcan.overTrashcan(endX, endY)).to.be.true;
                activity.trashcan.startHighlightAnimation();
                cy.tick(600);
                cy.wrap({ block, blockId, endX, endY, stageScale }).as("trashDrag");
            });
        });

        // Canvas blocks do not have DOM nodes. Invoke the production release
        // handler with the same stage coordinates a drag into the trash uses.
        cy.get("@trashDrag").then(({ block, endX, endY, stageScale }) => {
            block._mouseoutCallback(
                { stageX: endX * stageScale, stageY: endY * stageScale },
                true,
                false,
                false,
                true,
                true
            );
        });

        cy.get("@blockPlan").then(({ blockId }) => {
            cy.window().should(win => {
                const activity = win.ActivityContext.getActivity();
                const block = activity.blocks.blockList[blockId];

                expect(block.trash).to.be.true;
                expect(activity.blocks.trashStacks).to.include(blockId);
                expect(block.container.visible).to.be.false;
            });
        });

        // Restore lives in the auxiliary toolbar, so expose that toolbar before
        // following the same path a user takes to recover the deleted block.
        cy.get("#toggleAuxBtn").click();
        cy.get("#restoreIcon").should("be.visible").click();
        cy.get("#trashView").should("be.visible");
        cy.get("@blockPlan").then(({ blockId }) => {
            cy.get(`.trash-item[data-block-id="${blockId}"]`).should("be.visible");
        });

        cy.get("#restoreLastIcon").click();

        cy.get("@blockPlan").then(({ blockId }) => {
            cy.window().should(win => {
                const activity = win.ActivityContext.getActivity();
                const block = activity.blocks.blockList[blockId];

                expect(activity.blocks.trashStacks).not.to.include(blockId);
                expect(block).to.exist;
                expect(block.trash).to.be.false;
                expect(block.container.visible).to.be.true;
            });
        });
        cy.get("#trashView").should("have.class", "hidden");
    });
});
