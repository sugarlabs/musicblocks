/* global cy, describe, it, before */

describe("Block palette drag-and-drop", () => {
    before(() => {
        // Fresh session: Music Blocks auto-saves the working project to
        // localStorage (js/project-manager.js saveLocally) and restores it on
        // the next load, so without clearing storage this test could inherit
        // whatever an earlier spec left on the canvas instead of the app's
        // known default starter project.
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
        cy.reload();
        cy.waitForAppReady();

        cy.get("body").then($body => {
            const closeButtons = $body.find(".windowFrame .wftButton.close");
            if (closeButtons.length) {
                cy.wrap(closeButtons).click({ multiple: true, force: true });
            }
        });
    });

    it("drags a Pitch block from the palette and docks it into the real block flow", () => {
        // Open the Pitch category. Category icons themselves are base64 SVGs
        // with no stable attribute, but each category row's label cell holds
        // the real, user-visible category name (js/palette.js makeButton:
        // label.textContent = toTitleCase(_(name))), which is a more durable
        // selector than a positional index into the category list.
        cy.contains('[width="126"] tbody tr', "Pitch").find("img").click();
        cy.get("#palette", { timeout: 15000 }).should("be.visible");

        // Each open palette row carries an aria-label of the block's raw name
        // (js/palette.js _showMenuItems: itemRow.setAttribute("aria-label", ...)),
        // which is a stable way to find the plain "pitch" block among the
        // Pitch category's many blocks (pitch, pitch2, steppitch, hertz, ...).
        cy.get('#palette tbody tr[aria-label="pitch"] img', { timeout: 15000 })
            .scrollIntoView()
            .should("be.visible");

        // Compute the drop target from real application state rather than a
        // guessed pixel position: pitch blocks can dock straight beneath the
        // canvas's "start" hat block, at start's child-dock position offset
        // backward by the dragged block's own top-dock offset (blockMoved in
        // js/activity/block-drag-controller.js matches on that offset point).
        cy.window().then(win => {
            const activity = win.ActivityContext.getActivity();
            const blocks = activity.blocks;
            const startBlk = blocks.blockList.findIndex(b => !b.trash && b.name === "start");
            const start = blocks.blockList[startBlk];
            const previousChild = start.connections[1];

            // Read the dragged block's own dock geometry from the Pitch
            // palette's protoblock model (js/palette.js PaletteModel.update /
            // makeBlockInfo, which renders each entry's SVG - and its docks -
            // at the same DEFAULTBLOCKSCALE used for real blocks) rather than
            // from a block already sitting on the canvas, so this doesn't
            // depend on the starter project's contents.
            const pitchModelEntry = activity.palettes.dict["pitch"].model.blocks.find(
                b => b.blkname === "pitch"
            );
            expect(
                pitchModelEntry,
                "Pitch palette model should have a 'pitch' block entry to provide dock geometry"
            ).to.exist;
            const templateDocks = pitchModelEntry.docks;

            const targetContainerX = start.container.x + start.docks[1][0] - templateDocks[0][0];
            const targetContainerY = start.container.y + start.docks[1][1] - templateDocks[0][1];

            cy.wrap({
                startBlk,
                previousChild,
                targetContainerX,
                targetContainerY
            }).as("dropPlan");
        });

        cy.get("@dropPlan").then(plan => {
            cy.get('#palette tbody tr[aria-label="pitch"] img').then($img => {
                const rect = $img[0].getBoundingClientRect();
                const startX = rect.x + rect.width / 2;
                const startY = rect.y + rect.height / 2;

                // js/palette.js's drag handler centers the floating icon on
                // the cursor (moveAt) and then converts its final page
                // position back into container coordinates by subtracting
                // half the icon's own size, so the on-screen point we must
                // release the mouse at is the target container position plus
                // that same half-icon offset.
                const endX = plan.targetContainerX + rect.width / 2;
                const endY = plan.targetContainerY + rect.height / 2;

                cy.get('#palette tbody tr[aria-label="pitch"] img')
                    .trigger("mousedown", { which: 1, pageX: startX, pageY: startY, force: true })
                    .then($draggedImg => {
                        // The real handler listens for mousemove on document
                        // (to follow the cursor) but binds mouseup directly to
                        // the dragged <img> element, matching where a real
                        // cursor release would land once the icon has been
                        // repositioned under it.
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
            cy.window().should(win => {
                const blocks = win.ActivityContext.getActivity().blocks;
                const start = blocks.blockList[plan.startBlk];

                const newBlockId = start.connections[1];
                expect(
                    newBlockId,
                    "start's first child should have changed to the newly dropped block"
                ).to.not.equal(plan.previousChild);

                const newBlock = blocks.blockList[newBlockId];
                // Block exists on the canvas as a real, non-trashed block.
                expect(newBlock, "dropped block should exist in blockList").to.exist;
                expect(newBlock.trash, "dropped block should not be trashed").to.be.false;
                expect(newBlock.name, "dropped block should be a pitch block").to.eq("pitch");

                // Meaningful connection state: the new block was spliced into
                // the real flow, not just placed on top of it - it points back
                // up to "start" and forward to whatever was start's child
                // before the drop.
                expect(
                    newBlock.connections[0],
                    "dropped block should be docked as a child of start"
                ).to.eq(plan.startBlk);
                expect(
                    newBlock.connections[newBlock.connections.length - 1],
                    "dropped block should now lead into the previous chain head"
                ).to.eq(plan.previousChild);

                // Position state: the block landed close to where the docking
                // math placed it, proving the drop coordinates were accepted
                // rather than merely hovered over. A small tolerance avoids
                // coupling the test to exact floating-point reproduction of
                // the app's own layout math - the connection assertions above
                // are what actually prove real docking occurred.
                expect(newBlock.container.x).to.be.closeTo(plan.targetContainerX, 1);
                expect(newBlock.container.y).to.be.closeTo(plan.targetContainerY, 1);
            });
        });
    });
});
