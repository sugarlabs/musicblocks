/* global cy, beforeEach, describe, it */

/**
 * Cypress E2E test suite for the Temperament widget.
 *
 * The Temperament widget (js/widgets/temperament.js) allows users to explore,
 * play, and customize musical tuning systems. It is opened by running a
 * `temperament` block (via Play).
 *
 * These tests exercise the widget's launch and UI lifecycle through
 * the real application:
 *  1. Loading a fixture project that contains a temperament block.
 *  2. Pressing Play to open the widget.
 *  3. Verifying the widget window, circle layout, and toolbar render.
 *  4. Toggling between the Circle of Notes and the Table of Notes.
 *  5. Closing the widget and confirming it is fully removed from the DOM.
 */

const loadFixtureProject = fixtureName => {
    cy.get("#load").click();
    cy.get("#myOpenFile").selectFile(`cypress/fixtures/${fixtureName}`, { force: true });

    // Wait for the load overlay to appear before waiting for it to disappear.
    // Without this guard, the `not.be.visible` check passes trivially on the
    // container's default hidden state before loading has even begun, which
    // causes Play to run before the project is fully loaded.
    cy.get("#load-container").should("be.visible");
    cy.get("#load-container", { timeout: 30000 }).should("not.be.visible");
    cy.get("#errorText").should("not.be.visible");
};

describe("Temperament widget", () => {
    beforeEach(() => {
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
        cy.visit("http://127.0.0.1:3000");
        cy.waitForAppReady();

        // Dismiss the first-run "Take a Tour" guide.
        cy.get("body").then($body => {
            const closeButtons = $body.find(".windowFrame .wftButton.close");
            if (closeButtons.length) {
                cy.wrap(closeButtons).click({ multiple: true, force: true });
            }
        });
    });

    it("opens the Temperament widget and renders the circle of notes", () => {
        loadFixtureProject("temperament-widget-minimal.tb");

        cy.get("#play").click();

        cy.get(".windowFrame .wftTitle", { timeout: 30000 })
            .should("be.visible")
            .and("contain.text", "temperament");
        cy.get('[aria-label="temperament"]', { timeout: 30000 }).should("be.visible");

        // Verify the main temperament layout container is in the DOM
        cy.get("#temperamentTable").should("exist");

        // By default, the temperament widget renders the Circle of Notes view
        cy.get("#circ").should("exist");
        cy.get("#wheelDiv2").should("be.visible");

        // Ensure the wheelnav SVG has rendered slices for the notes
        cy.get("[id^='wheelnav-wheelDiv2-slice-0']").should("exist");
    });

    it("renders the toolbar and can toggle between Circle and Table views", () => {
        loadFixtureProject("temperament-widget-minimal.tb");
        cy.get("#play").click();

        cy.get('[aria-label="temperament"]', { timeout: 30000 }).should("be.visible");

        // Verify toolbar buttons are present using their accessible titles
        cy.get('[aria-label="temperament"]').find('img[title="Play all"]').should("exist");
        cy.get('[aria-label="temperament"]').find('img[title="Save"]').should("exist");
        cy.get('[aria-label="temperament"]').find('img[title="Add pitches"]').should("exist");

        // Initially in circle mode, so the toggle button shows the table icon
        cy.get('[aria-label="temperament"]').find('img[title="table"]').should("exist");

        // Switch to Table view by clicking the toggle button
        cy.get('[aria-label="temperament"]').find('img[title="table"]').click({ force: true });

        // The circle and wheelnav components should be hidden or removed
        cy.get("#wheelDiv2").should("not.be.visible");

        // The notes graph and table body should now be visible
        cy.get("#notesGraph").should("exist").and("be.visible");
        cy.get("#tableOfNotes").should("exist").and("be.visible");

        // The toggle button should now show the circle icon
        cy.get('[aria-label="temperament"]').find('img[title="circle"]').should("exist");

        // Switch back to Circle view
        cy.get('[aria-label="temperament"]').find('img[title="circle"]').click({ force: true });

        // The table should be removed and the wheel should be back
        cy.get("#notesGraph").should("not.exist");
        cy.get("#wheelDiv2").should("exist").and("be.visible");
        cy.get('[aria-label="temperament"]').find('img[title="table"]').should("exist");
    });

    it("closes the Temperament widget and cleans up the DOM", () => {
        loadFixtureProject("temperament-widget-minimal.tb");
        cy.get("#play").click();

        cy.get('[aria-label="temperament"]', { timeout: 30000 }).should("be.visible");

        // Click the close button on the temperament widget window specifically
        cy.get('[aria-label="temperament"]').find('[title="Close"]').first().click({ force: true });

        // The window frame should be destroyed
        cy.get('[aria-label="temperament"]').should("not.exist");

        // The temperament content container should be removed from the DOM
        cy.get("#temperamentTable").should("not.exist");
        cy.get("#circ").should("not.exist");

        // The global wheelDiv2 container is not removed from the DOM, but it should be hidden
        cy.get("#wheelDiv2").should("not.be.visible");
    });
});
