/* global cy, describe, it, beforeEach */

describe("Dark Mode E2E Integration", () => {
    beforeEach(() => {
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
        // Without an explicit preference the app follows prefers-color-scheme,
        // which makes the "starts in light mode" assertions environment-dependent.
        cy.window().then(win => {
            win.localStorage.setItem("themePreference", "light");
        });
        cy.visit("http://127.0.0.1:3000");
        cy.waitForAppReady();
    });

    // Drives the theme selector through the same UI path a user takes: open the
    // #themedropdown from #themeSelectIcon and click an option. Calling
    // themeBox.dark_onclick() directly would bypass the dropdown wiring in
    // ToolbarUI.renderThemeSelectIcon, so a broken dropdown would still pass.
    const selectThemeFromDropdown = theme => {
        cy.get("#aux-toolbar").invoke("show");
        cy.get("#themeSelectIcon").click();
        cy.get("#themedropdown").should("be.visible");
        cy.get(`#${theme}`).click();
        // renderThemeSelectIcon closes the dropdown after a selection.
        cy.get("#themedropdown").should("not.be.visible");
    };

    it("switches to dark mode by selecting it from the theme dropdown", () => {
        // Verify default state does not have dark mode enabled before toggling
        cy.get("body").should("not.have.class", "dark");

        selectThemeFromDropdown("dark");

        cy.get("body").should("have.class", "dark");
    });

    it("persists the dropdown-selected dark mode preference across reloads", () => {
        // Verify default state does not have dark mode enabled before toggling
        cy.get("body").should("not.have.class", "dark");

        selectThemeFromDropdown("dark");
        cy.get("body").should("have.class", "dark");

        cy.reload();
        cy.waitForAppReady();

        cy.get("body").should("have.class", "dark");
    });
});
