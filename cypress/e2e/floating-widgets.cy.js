/* global cy, describe, it, beforeEach, expect */

describe("Floating Widget Windows E2E Lifecycle", () => {
    beforeEach(() => {
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
        cy.visit("http://127.0.0.1:3000");
        cy.waitForAppReady();

        // Dismiss any tour guide windows if present on startup
        cy.get("body").then($body => {
            const closeButtons = $body.find(".windowFrame .wftButton.close");
            if (closeButtons.length) {
                cy.wrap(closeButtons).click({ multiple: true, force: true });
            }
        });
    });

    it("opens status floating widget window and verifies titlebar and closing behavior", () => {
        cy.window().then(win => {
            expect(win.widgetWindows, "widgetWindows manager should exist").to.exist;
            win.widgetWindows.windowFor({}, "status", "status", true);
        });

        // Verify floating window frame renders with status title
        cy.get(".windowFrame .wftTitle", { timeout: 30000 })
            .should("be.visible")
            .and("contain.text", "status");

        // Click the close button on the window titlebar
        cy.get(".windowFrame .wftButton.close").first().click({ force: true });

        // Verify window frame is dismissed
        cy.get(".windowFrame").should("not.exist");
    });

    it("verifies window maximize and restore toggle functionality", () => {
        cy.window().then(win => {
            expect(win.widgetWindows, "widgetWindows manager should exist").to.exist;
            win.widgetWindows.windowFor({}, "status", "status", true);
        });

        cy.get(".windowFrame", { timeout: 30000 }).should("be.visible");

        // Click the maximize button on the titlebar
        cy.get(".windowFrame .wftButton.wftMaxmin").first().click({ force: true });

        // Verify window frame top position moves to header boundary (64px) when maximized
        cy.get(".windowFrame").first().should("have.css", "top", "64px");

        // Click restore button on titlebar to contract window
        cy.get(".windowFrame .wftButton.wftMaxmin").first().click({ force: true });

        // Verify window frame icon returns to expand icon
        cy.get(".windowFrame .wftButton.wftMaxmin img")
            .first()
            .should("have.attr", "src", "header-icons/icon-expand.svg");
    });
});
