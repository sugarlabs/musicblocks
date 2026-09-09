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
    const paletteRows = "#palette > div > table:last-child tbody tr";

    const openPalette = (label, name) => {
        cy.contains(paletteRows, new RegExp(`^${label}$`))
            .should("be.visible")
            .click();
        cy.get("#PaletteBody", { timeout: 15000 }).should("be.visible");
        cy.get("#PaletteBody thead").should("contain.text", label);
        cy.get("#PaletteBody_items tr").should("have.length.greaterThan", 0);
        cy.window().should(win => {
            const activity = win.ActivityContext
                ? win.ActivityContext.getActivity()
                : win.globalActivity;
            expect(activity, "Activity singleton should be loaded").to.exist;
            expect(activity.palettes, "Palettes instance should be loaded").to.exist;
            expect(activity.palettes.activePalette, `activePalette should be ${name}`).to.equal(
                name
            );
        });
    };

    const closePalette = () => {
        cy.get('#PaletteBody img[alt="Close"]').click();
        cy.get("#PaletteBody").should("not.exist");
    };

    const selectPaletteGroup = index => {
        cy.get('#palette [role="tab"]').eq(index).should("be.visible").trigger("mouseover");
    };

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
        cy.get("#palette", { timeout: 30000 }).should("be.visible");
        cy.get('#palette [role="tab"]').should("have.length", 3);

        openPalette("Rhythm", "rhythm");
        closePalette();
        openPalette("Widgets", "widgets");
        closePalette();

        selectPaletteGroup(1);
        openPalette("Flow", "flow");
        closePalette();
        openPalette("Number", "number");
        closePalette();

        selectPaletteGroup(2);
        openPalette("Graphics", "graphics");
        closePalette();
    });
});
