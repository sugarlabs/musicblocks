/* global Cypress, cy */

// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
Cypress.Commands.add("waitForAppReady", () => {
    cy.get("#loading-image-container", { timeout: 60000 }).should("not.be.visible");
    cy.get("#hideContents", { timeout: 60000 }).should("be.visible");
});

Cypress.Commands.add(
    "waitForStylesheetsToLoad",
    (targetStylesheets = ["activities.css", "windows.css", "darkmode.css", "style.css"]) => {
        cy.document().should(doc => {
            const allElements = Array.from(doc.querySelectorAll("link, style[data-href]"));
            targetStylesheets.forEach(sheetName => {
                const match = allElements.find(el => {
                    const href =
                        el.getAttribute("data-href") || el.getAttribute("href") || el.href || "";
                    return href.includes(sheetName);
                });
                expect(
                    match,
                    `Stylesheet "${sheetName}" must be loaded in document head (as link or style[data-href])`
                ).to.exist;
                if (match.tagName.toLowerCase() === "link") {
                    expect(
                        match.getAttribute("rel"),
                        `Stylesheet "${sheetName}" must have transitioned to rel="stylesheet"`
                    ).to.eq("stylesheet");
                } else {
                    expect(
                        match.hasAttribute("data-href"),
                        `Stylesheet "${sheetName}" was converted to style[data-href]`
                    ).to.be.true;
                }
            });
        });

        cy.window().should(win => {
            const sheetSources = Array.from(win.document.styleSheets).map(s => {
                return (
                    s.href ||
                    (s.ownerNode &&
                        (s.ownerNode.getAttribute("data-href") ||
                            s.ownerNode.getAttribute("href"))) ||
                    ""
                );
            });
            targetStylesheets.forEach(sheetName => {
                const loaded = sheetSources.some(src => src.includes(sheetName));
                expect(loaded, `Stylesheet "${sheetName}" must be present in document.styleSheets`)
                    .to.be.true;
            });
        });
    }
);
