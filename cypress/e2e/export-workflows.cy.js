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

// The MIDI/LilyPond save options only exist in the advanced-mode save
// dropdown (index.html #saveddropdown) - beginner mode's #saveddropdownbeg
// only offers HTML/PNG (js/toolbar-ui.js renderSaveIcons).
const switchToAdvancedModeAndOpenSaveMenu = () => {
    cy.get("#toggleAuxBtn").click();
    cy.get("#advancedMode").click();
    cy.get("#saveButtonAdvanced").should("be.visible").click();
    cy.get("#saveddropdown").should("be.visible");
};

describe("Export workflows", () => {
    beforeEach(() => {
        // Each test gets its own fresh app load, matching the isolation
        // rationale in maker-widgets.cy.js: Music Blocks auto-saves the
        // working project to localStorage and restores it on the next
        // load, so state from one export must not leak into the next.
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
        cy.visit("http://127.0.0.1:3000");
        cy.waitForAppReady();

        // Dismiss the first-run "Take a Tour" guide, a widget window that
        // would otherwise collide with the ".windowFrame" selectors used
        // for the MIDI save dialog below.
        cy.get("body").then($body => {
            const closeButtons = $body.find(".windowFrame .wftButton.close");
            if (closeButtons.length) {
                cy.wrap(closeButtons).click({ multiple: true, force: true });
            }
        });

        loadFixtureProject("export-note-minimal.tb");
    });

    it("exports a MIDI file for a real note program through the Save menu", () => {
        switchToAdvancedModeAndOpenSaveMenu();

        // js/toolbar-ui.js wires #save-midi to SaveInterface.saveMIDI, which
        // runs the loaded program (populating Logo's MIDI track data) and
        // then, via SaveInterface.download, opens the app's own MBDialog
        // filename prompt (js/utils/mb-dialog.js) rather than a native
        // window.prompt.
        cy.get("#save-midi").click();

        cy.get(".mb-system-dialog input[type='text']", { timeout: 30000 })
            .should("be.visible")
            .invoke("val")
            .should("match", /\.midi$/)
            .then(filename => {
                cy.get(".mb-system-dialog button.confirm-button").click();

                // SaveInterface.downloadURL (js/SaveInterface.js) writes the
                // file via a Blob object URL and an <a download> click, which
                // Cypress saves under its default downloadsFolder
                // (cypress/downloads). A Standard MIDI File always starts
                // with the 4-byte "MThd" header chunk id, so reading it back
                // verifies real, well-formed MIDI content was generated -
                // not just that a click occurred.
                cy.readFile(`cypress/downloads/${filename}`, "binary", { timeout: 30000 }).then(
                    content => {
                        expect(content.slice(0, 4)).to.equal("MThd");
                        expect(content.length).to.be.greaterThan(20);
                    }
                );
            });
    });

    it("exports a LilyPond file for a real note program through the Save menu", () => {
        switchToAdvancedModeAndOpenSaveMenu();

        // js/toolbar-ui.js wires #save-ly to SaveInterface.saveLilypond,
        // which opens the #lilypondModal dialog (index.html) prefilled with
        // a default filename, rather than downloading immediately.
        cy.get("#save-ly").click();

        cy.get("#lilypondModal").should("be.visible");
        cy.get("#fileName")
            .invoke("val")
            .should("match", /\.ly$/)
            .then(filename => {
                // #submitLilypond runs SaveInterface.saveLYFile, which
                // re-runs the program to build real notation output and
                // downloads it via the same Blob/<a download> mechanism as
                // MIDI export (js/SaveInterface.js afterSaveLilypondLY).
                cy.get("#submitLilypond").click();

                // js/lilypond.js's LILYPONDHEADER constant, reused verbatim
                // by every generated .ly file (also asserted in the Jest
                // unit test js/__tests__/lilypond.test.js), gives a stable,
                // implementation-independent way to verify real LilyPond
                // content was written to disk.
                cy.readFile(`cypress/downloads/${filename}`, { timeout: 30000 }).then(content => {
                    expect(content).to.contain('\\version "2.18.2"');
                    expect(content).to.contain("Made with LilyPond and Music Blocks");
                });
            });
    });
});
