/* global Cypress, cy, describe, it, before, expect */

Cypress.on("uncaught:exception", err => {
    const ignored = [
        "ResizeObserver loop limit exceeded",
        "Cannot read properties of undefined",
        "Cannot read properties of null",
        "Cannot set properties of null",
        "Cannot set properties of undefined",
        "_ is not defined",
        "Permissions check failed"
    ];
    return !ignored.some(msg => err.message.includes(msg));
});

describe("Palette Category Navigation E2E Integration", () => {
    before(() => {
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
        cy.reload();
        cy.waitForAppReady();

        // Dismiss the first-run tour guide widget if present on startup
        cy.get("body").then($body => {
            const closeButtons = $body.find(".windowFrame .wftButton.close");
            if (closeButtons.length) {
                cy.wrap(closeButtons).click({ multiple: true, force: true });
            }
        });
        cy.get("body").type("{esc}");
    });

    it("switches across palette categories and verifies DOM rendering and activePalette state", () => {
        // Assert the main palette sidebar container is present and visible
        cy.get("#palette", { timeout: 30000 }).should("be.visible");

        // 1. Navigate to Rhythm palette (row index 1 in default Music group)
        cy.get('[width="126"] tbody tr').eq(1).find("img").click();
        cy.get("#PaletteBody", { timeout: 15000 }).should("be.visible");
        cy.get("#PaletteBody thead", { timeout: 15000 }).should("contain.text", "Rhythm");
        cy.get("#PaletteBody_items tr", { timeout: 15000 }).should("have.length.greaterThan", 0);
        cy.window().should(win => {
            const activity = win.ActivityContext
                ? win.ActivityContext.getActivity()
                : win.globalActivity;
            expect(activity, "Activity singleton should be loaded").to.exist;
            expect(activity.palettes, "Palettes instance should be loaded").to.exist;
            expect(activity.palettes.activePalette, "activePalette should be rhythm").to.equal(
                "rhythm"
            );
        });

        // 2. Navigate to Widgets palette (row index 2 in default Music group)
        cy.get('[width="126"] tbody tr').eq(2).find("img").click();
        cy.get("#PaletteBody", { timeout: 15000 }).should("be.visible");
        cy.get("#PaletteBody thead", { timeout: 15000 }).should("contain.text", "Widgets");
        cy.get("#PaletteBody_items tr", { timeout: 15000 }).should("have.length.greaterThan", 0);
        cy.window().should(win => {
            const activity = win.ActivityContext
                ? win.ActivityContext.getActivity()
                : win.globalActivity;
            expect(activity.palettes.activePalette, "activePalette should be widgets").to.equal(
                "widgets"
            );
        });

        // 3. Switch to Graphics & Media multipalette group tab
        cy.get('#palette [role="tab"]').first().click();

        // 4. Navigate to Turtle palette (row index 1 in Graphics & Media group)
        cy.get('[width="126"] tbody tr').eq(1).find("img").click();
        cy.get("#PaletteBody", { timeout: 15000 }).should("be.visible");
        cy.get("#PaletteBody thead", { timeout: 15000 }).should("contain.text", "Turtle");
        cy.get("#PaletteBody_items tr", { timeout: 15000 }).should("have.length.greaterThan", 0);
        cy.window().should(win => {
            const activity = win.ActivityContext
                ? win.ActivityContext.getActivity()
                : win.globalActivity;
            expect(activity.palettes.activePalette, "activePalette should be turtle").to.equal(
                "turtle"
            );
        });

        // 5. Navigate to Numbers palette (row index 2 in Graphics & Media group)
        cy.get('[width="126"] tbody tr').eq(2).find("img").click();
        cy.get("#PaletteBody", { timeout: 15000 }).should("be.visible");
        cy.get("#PaletteBody thead", { timeout: 15000 }).should("contain.text", "Numbers");
        cy.get("#PaletteBody_items tr", { timeout: 15000 }).should("have.length.greaterThan", 0);
        cy.window().should(win => {
            const activity = win.ActivityContext
                ? win.ActivityContext.getActivity()
                : win.globalActivity;
            expect(activity.palettes.activePalette, "activePalette should be numbers").to.equal(
                "numbers"
            );
        });

        // 6. Navigate to Flow palette (row index 3 in Graphics & Media group)
        cy.get('[width="126"] tbody tr').eq(3).find("img").click();
        cy.get("#PaletteBody", { timeout: 15000 }).should("be.visible");
        cy.get("#PaletteBody thead", { timeout: 15000 }).should("contain.text", "Flow");
        cy.get("#PaletteBody_items tr", { timeout: 15000 }).should("have.length.greaterThan", 0);
        cy.window().should(win => {
            const activity = win.ActivityContext
                ? win.ActivityContext.getActivity()
                : win.globalActivity;
            expect(activity.palettes.activePalette, "activePalette should be flow").to.equal(
                "flow"
            );
        });

        // 7. Verify close button dismisses #PaletteBody
        cy.get('#PaletteBody img[alt="Close"]').click();
        cy.get("#PaletteBody").should("not.exist");
    });
});
