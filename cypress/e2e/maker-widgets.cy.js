/* global cy, beforeEach, describe, it */

const loadFixtureProject = fixtureName => {
    cy.get("#load").click();
    cy.get("#myOpenFile").selectFile(`cypress/fixtures/${fixtureName}`, { force: true });

    // Assert the visible state first so the later "not visible" isn't
    // trivially true because loading never started (see the identical
    // guard in project-loading.cy.js).
    cy.get("#load-container").should("be.visible");
    cy.get("#load-container", { timeout: 30000 }).should("not.be.visible");
    cy.get("#errorText").should("not.be.visible");
};

describe("Music-maker widgets", () => {
    beforeEach(() => {
        // Each test gets its own fresh app load rather than reusing one
        // session for the whole suite: Music Blocks auto-saves the working
        // project to localStorage (js/project-manager.js saveLocally) and
        // restores it on the next load, and #play (js/activity/toolbar-controller.js
        // runFast) re-runs every start stack still on the canvas - so a
        // widget opened by one test would otherwise keep getting
        // re-triggered by a later test's Play click.
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
        cy.visit("http://127.0.0.1:3000");
        cy.waitForAppReady();

        // Dismiss the first-run "Take a Tour" guide, which is itself a
        // widget window (js/widgets/widgetWindows.js) and would otherwise
        // collide with the ".windowFrame" selectors used below.
        cy.get("body").then($body => {
            const closeButtons = $body.find(".windowFrame .wftButton.close");
            if (closeButtons.length) {
                cy.wrap(closeButtons).click({ multiple: true, force: true });
            }
        });
    });

    it("opens Phrase Maker through the real UI and renders the resulting phrase grid", () => {
        loadFixtureProject("phrase-maker-minimal.tb");

        // Pressing Play (js/activity/toolbar-controller.js runFast) runs
        // every start stack in the project, which is how a Phrase Maker
        // block loaded on the canvas actually gets executed and its
        // widget opened - the same path a real user takes.
        cy.get("#play").click();

        // The widget window frame and title are rendered by the shared
        // WidgetWindow component (js/widgets/widgetWindows.js), the same
        // mechanism used for every Music Blocks widget.
        cy.get(".windowFrame .wftTitle", { timeout: 30000 })
            .should("be.visible")
            .and("contain.text", "phrase maker");

        // The phrase grid (js/widgets/phrasemaker.js) renders one table row
        // per pitch/drum block attached beneath the Phrase Maker block, so a
        // non-empty set of rows proves the pitch blocks from the loaded
        // project were turned into a rendered phrase.
        cy.get(".windowFrame .wfbWidget table tr").should("have.length.greaterThan", 0);
    });

    it("opens Rhythm Maker through the real UI, creates a pattern, and verifies it in the widget", () => {
        loadFixtureProject("rhythm-maker-minimal.tb");
        cy.get("#play").click();

        cy.get(".windowFrame .wftTitle", { timeout: 30000 })
            .should("be.visible")
            .and("contain.text", "rhythm maker");

        // Each drum ruler is rendered as its own table (js/widgets/rhythmruler.js),
        // with one row (data-row) holding one cell per rhythmic subdivision.
        cy.get('.windowFrame [id^="rulerCellTable"] tr[data-row]')
            .first()
            .find("td")
            .should("have.length.greaterThan", 0)
            .then($cells => {
                const initialCellCount = $cells.length;

                // Clicking a rhythm cell dissects it (splits it into smaller
                // subdivisions) via RhythmRuler._dissectRuler - a real,
                // synchronous UI-driven pattern edit, not a canvas-only
                // interaction.
                cy.wrap($cells.eq(0)).click();

                cy.get('.windowFrame [id^="rulerCellTable"] tr[data-row]')
                    .first()
                    .find("td")
                    .should("have.length", initialCellCount + 1);
            });
    });
});
