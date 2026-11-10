// Copyright (c) 2026 Sugar Labs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* global cy, beforeEach, describe, it */

describe("Code Map Visualizer Widget", () => {
    beforeEach(() => {
        cy.visit("http://127.0.0.1:3000", {
            onBeforeLoad(win) {
                win.localStorage.clear();
            }
        });
        cy.waitForAppReady();

        cy.window().then(win => {
            if (win.jQuery) {
                win.jQuery(win).off("beforeunload");
            }
        });

        // Dismiss the first-run "Take a Tour" guide if present
        cy.get("body").then($body => {
            const closeButtons = $body.find(".windowFrame .wftButton.close");
            if (closeButtons.length) {
                cy.wrap(closeButtons).click({ multiple: true, force: true });
            }
        });
    });

    it("opens Code Map through the auxiliary toolbar, renders the call graph surface, and closes cleanly", () => {
        // 1. Open the auxiliary toolbar
        cy.get("#toggleAuxBtn").click();
        cy.get("#aux-toolbar").should("be.visible");

        // 2. Switch to Advanced mode to reveal advanced inspection tools
        cy.get("#advancedMode").click();
        cy.get("#codeMapIcon").should("be.visible").click();

        // 3. Verify the Code Map widget window frame appears
        cy.get(".windowFrame .wftTitle", { timeout: 15000 })
            .should("be.visible")
            .and("contain.text", "Code Map");

        // 4. Verify the interactive SVG canvas and UI controls are mounted
        cy.get(".windowFrame .codemap-viewport").should("be.visible");
        cy.get(".windowFrame .codemap-svg").should("be.visible");
        cy.get(".windowFrame .codemap-search-input").should("be.visible");
        cy.get(".windowFrame .codemap-summary-badge").should("be.visible");

        // 5. Test search filter input
        cy.get(".windowFrame .codemap-search-input").type("test");
        cy.get(".windowFrame .codemap-search-input").clear();

        // 6. Test Fit to View button in window title bar
        cy.get(".windowFrame .wfbtItem img[src*='icon-expand']").first().click();

        // 7. Test Refresh button in window title bar
        cy.get(".windowFrame .wfbtItem img[src*='reload']").first().click();

        // 8. Close the Code Map window frame
        cy.get(".windowFrame .wftButton.close").click();
        cy.get(".windowFrame").should("not.exist");
    });
});
