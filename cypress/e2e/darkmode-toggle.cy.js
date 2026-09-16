/* global cy, describe, it, beforeEach, expect */

describe("Dark Mode E2E Integration", () => {
    beforeEach(() => {
        // Ignore only the known docById race fired by HelpWidget creation
        // during first-time-user startup; any other app error still fails.
        cy.on("uncaught:exception", err => {
            if (err.message.includes("docById is not defined")) {
                return false;
            }
        });
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

    it("switches theme preference to dark mode using application theme switcher", () => {
        // Verify default state does not have dark mode enabled before toggling
        cy.get("body").should("not.have.class", "dark");

        cy.window().should(win => {
            const activity = win.ActivityContext
                ? win.ActivityContext.getActivity()
                : win.globalActivity;
            expect(activity, "Activity instance should be initialized").to.exist;
            expect(activity.themeBox, "ThemeBox instance should be initialized").to.exist;
        });

        cy.window().then(win => {
            const activity = win.ActivityContext
                ? win.ActivityContext.getActivity()
                : win.globalActivity;
            activity.themeBox.dark_onclick();
        });

        cy.get("body").should("have.class", "dark");
    });

    it("reapplies stored light mode through the theme menu after an OS theme change", () => {
        cy.window().then(win => {
            const activity = win.ActivityContext
                ? win.ActivityContext.getActivity()
                : win.globalActivity;
            activity.themeBox._theme = "dark";
            activity.themeBox.applyThemeInstantly();
        });

        cy.get("body").should("have.class", "dark");
        cy.window().its("localStorage.themePreference").should("equal", "light");
        cy.get("#toggleAuxBtn").click();
        cy.get("#themeSelectIcon").click();
        cy.get("#light").click();

        cy.get("body").should("have.class", "light").and("not.have.class", "dark");
        cy.get("#myCanvas").should("have.css", "background-color", "rgb(249, 249, 249)");
        cy.window().its("localStorage.themePreference").should("equal", "light");
    });

    it("verifies dark mode theme preference persists across reloads via application storage", () => {
        // Verify default state does not have dark mode enabled before toggling
        cy.get("body").should("not.have.class", "dark");

        cy.window().should(win => {
            const activity = win.ActivityContext
                ? win.ActivityContext.getActivity()
                : win.globalActivity;
            expect(activity, "Activity instance should be initialized").to.exist;
            expect(activity.themeBox, "ThemeBox instance should be initialized").to.exist;
        });

        cy.window().then(win => {
            const activity = win.ActivityContext
                ? win.ActivityContext.getActivity()
                : win.globalActivity;
            activity.themeBox.dark_onclick();
        });

        cy.get("body").should("have.class", "dark");

        cy.reload();
        cy.waitForAppReady();

        cy.get("body").should("have.class", "dark");
    });
});
