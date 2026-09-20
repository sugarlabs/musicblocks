/* global cy, describe, it, beforeEach, expect */

describe("Trash Panel and Block Restoration", () => {
    beforeEach(() => {
        cy.visit("http://127.0.0.1:3000");
        cy.waitForAppReady();

        // Dismiss the first-run tour guide if present
        cy.get("body").then($body => {
            const closeButtons = $body.find(".windowFrame .wftButton.close");
            if (closeButtons.length) {
                cy.wrap(closeButtons).click({ multiple: true, force: true });
            }
        });

        // Open auxiliary toolbar via menu icon so #restoreIcon and #trashView are accessible
        cy.get("#menu").click();
        cy.get("#aux-toolbar").should("be.visible");
    });

    it("handles restoring from empty trash safely and shows empty notification", () => {
        cy.window({ timeout: 30000 }).should(win => {
            const activity = win.ActivityContext.getActivity();
            expect(activity, "Activity should exist").to.exist;
            expect(activity.blocks.trashStacks.length).to.equal(0);
        });

        // Trigger restore action via UI when trash is empty
        cy.get("#restoreIcon").should("be.visible").click();

        // Notification should inform user that trash can is empty
        cy.get("#printTextContent").should("contain.text", "Trash can is empty.");

        cy.window().should(win => {
            const activity = win.ActivityContext.getActivity();
            expect(activity.blocks.trashStacks.length).to.equal(0);
        });
    });

    it("renders trash view with trashed blocks and allows restoring a block", () => {
        let trashedBlockIndex;
        cy.window().then(win => {
            const activity = win.ActivityContext.getActivity();
            const startBlock = activity.blocks.blockList[0];
            trashedBlockIndex = startBlock.blockIndex;
            activity.blocks.sendStackToTrash(startBlock);
            if (!activity.blocks.trashPreviews[startBlock.blockIndex]) {
                activity.blocks.trashPreviews[startBlock.blockIndex] =
                    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'></svg>";
            }
            activity.trashController.renderTrashView();
        });

        // Verify #trashView panel is mounted and visible in DOM
        cy.get("#trashView", { timeout: 30000 }).should("be.visible");
        cy.get("#trashView .trash-item").should("have.length.greaterThan", 0).and("be.visible");
        cy.get("#trashView #restoreLastIcon").should("be.visible");
        cy.get("#trashView #restoreAllIcon").should("be.visible");

        // Click the first trash item to restore it (without force: true)
        cy.get("#trashView .trash-item").first().click();
        cy.get("#trashView").should("have.class", "hidden");

        // Verify block leaves trash and returns to active canvas state
        cy.window().should(win => {
            const activity = win.ActivityContext.getActivity();
            expect(activity.blocks.trashStacks).to.be.empty;
            expect(activity.blocks.blockList[trashedBlockIndex].trash).to.be.false;
        });
    });

    it("restores all trashed items when clicking restore all icon", () => {
        const trashedIndices = [];
        cy.window().then(win => {
            const activity = win.ActivityContext.getActivity();
            // Pick two distinct blocks from starter project
            const blockA = activity.blocks.blockList[0];
            const blockB = activity.blocks.blockList[4];
            trashedIndices.push(blockA.blockIndex, blockB.blockIndex);

            activity.blocks.sendStackToTrash(blockA);
            activity.blocks.sendStackToTrash(blockB);

            [blockA, blockB].forEach(block => {
                if (!activity.blocks.trashPreviews[block.blockIndex]) {
                    activity.blocks.trashPreviews[block.blockIndex] =
                        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'></svg>";
                }
            });

            activity.trashController.renderTrashView();
        });

        cy.get("#trashView", { timeout: 30000 }).should("be.visible");
        cy.get("#trashView .trash-item").should("have.length.at.least", 2);

        // Click restore all icon (without force: true)
        cy.get("#restoreAllIcon").should("be.visible").click();
        cy.get("#trashView").should("have.class", "hidden");

        // Verify both blocks leave trash and are restored to canvas
        cy.window().should(win => {
            const activity = win.ActivityContext.getActivity();
            expect(activity.blocks.trashStacks.length).to.equal(0);
            trashedIndices.forEach(idx => {
                expect(activity.blocks.blockList[idx].trash).to.be.false;
            });
        });
    });
});
