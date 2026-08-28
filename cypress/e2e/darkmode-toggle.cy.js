/* global cy, describe, it, beforeEach, expect */

describe("Dark Mode E2E Integration", () => {
    beforeEach(() => {
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
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
