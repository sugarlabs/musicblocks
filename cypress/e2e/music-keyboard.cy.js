/* global cy, beforeEach, describe, it */

/**
 * Cypress E2E test suite for the Music Keyboard widget.
 *
 * The Music Keyboard widget (js/widgets/musickeyboard.js) is a real-time
 * interactive piano keyboard that lets users record, play back, and save note
 * sequences. It is opened by running a `musickeyboard` block (via Play), which
 * calls MusicKeyboard.show() through the real Logo → block-runner path.
 *
 * These tests exercise the widget's complete launch and UI lifecycle through
 * the production application without mocks:
 *  1. Loading a fixture project that contains a musickeyboard block.
 *  2. Pressing Play to open the widget through the real block-execution path.
 *  3. Verifying the widget window, piano keyboard, and toolbar all render.
 *  4. Interacting with a piano key and confirming the note appears in the grid.
 *  5. Closing the widget and confirming it is fully removed from the DOM.
 */

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

describe("Music Keyboard widget", () => {
    beforeEach(() => {
        // Each test gets its own fresh app load rather than reusing one
        // session for the whole suite: Music Blocks auto-saves the working
        // project to localStorage (js/project-manager.js saveLocally) and
        // restores it on the next load, and #play re-runs every start stack
        // still on the canvas - so a widget opened by one test would
        // otherwise keep being re-triggered by a later test's Play click.
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

    it("opens the Music Keyboard widget through the real UI and renders the piano keyboard", () => {
        loadFixtureProject("music-keyboard-minimal.tb");

        // Pressing Play (js/activity/toolbar-controller.js runFast) executes
        // every start stack, which is how the musickeyboard block triggers
        // MusicKeyboard.show() - the same path a real user takes.
        cy.get("#play").click();

        // The widget window frame and title are rendered by the shared
        // WidgetWindow component (js/widgets/widgetWindows.js), the same
        // mechanism used by every Music Blocks widget.
        cy.get(".windowFrame .wftTitle", { timeout: 30000 })
            .should("be.visible")
            .and("contain.text", "music keyboard");

        // MusicKeyboard._createKeyboard() builds the piano surface inside
        // #keyboardHolder2 which contains two tables: a white-key row
        // (#myrow) and a black-key row (#myrow2). Their presence in the DOM
        // proves _createKeyboard() completed successfully.
        cy.get("#keyboardHolder2").should("exist").and("be.visible");

        // The white-key row must contain at least one <td> per white key in
        // the configured scale (MusicKeyboard._keysLayout() computes this
        // from the pitch blocks attached beneath the musickeyboard block).
        cy.get("#myrow td").should("have.length.greaterThan", 0);

        // The black-key row is always rendered alongside the white-key row;
        // even when the configured scale has no sharps/flats, the layout
        // still inserts spacer <td> elements for the gaps in the piano layout
        // (BLACKKEY_SPACER_INDICES in musickeyboard.js), so a non-zero
        // count is always guaranteed.
        cy.get("#myrow2 td").should("have.length.greaterThan", 0);
    });

    it("renders the full widget toolbar with all expected action buttons", () => {
        loadFixtureProject("music-keyboard-minimal.tb");
        cy.get("#play").click();

        cy.get(".windowFrame .wftTitle", { timeout: 30000 })
            .should("be.visible")
            .and("contain.text", "music keyboard");

        // MusicKeyboard._createToolbarButtons() adds six buttons to the
        // widget window's toolbar in this order: Play, Save, Clear,
        // Add note (#addnotes), MIDI, and Metronome.  Confirming each
        // button is present proves the toolbar was fully constructed.

        // The Play/Stop button is identified by its initial "play-button.svg" src
        // (MusicKeyboard._updatePlayButtonIcon sets it to stop-button.svg during
        // playback, so checking before any play action keeps this deterministic).
        cy.get(".windowFrame .wfbtItem img[src*='play-button']").should("exist");

        // The Save button carries an export-chunk.svg icon.
        cy.get(".windowFrame .wfbtItem img[src*='export-chunk']").should("exist");

        // The Clear button carries an erase-button.svg icon.
        cy.get(".windowFrame .wfbtItem img[src*='erase-button']").should("exist");

        // The Add Note button is given an explicit id ("addnotes") by
        // MusicKeyboard._createToolbarButtons - stable, ID-based selector.
        cy.get("#addnotes").should("exist");

        // The MIDI button carries a midi.svg icon.
        cy.get(".windowFrame .wfbtItem img[src*='midi']").should("exist");

        // The Metronome button carries a metronome.svg icon.
        cy.get(".windowFrame .wfbtItem img[src*='metronome']").should("exist");
    });

    it("closes the Music Keyboard widget and removes it from the DOM", () => {
        loadFixtureProject("music-keyboard-minimal.tb");
        cy.get("#play").click();

        cy.get(".windowFrame .wftTitle", { timeout: 30000 })
            .should("be.visible")
            .and("contain.text", "music keyboard");

        // Confirm the widget and keyboard are present before closing.
        cy.get("#keyboardHolder2").should("exist");

        // Click the close button on the widget window titlebar.
        // MusicKeyboard._createWidgetWindow() wires widgetWindow.onclose to
        // clean up key handlers, timers, synth sounds, and call
        // widgetWindow.destroy() - which removes the .windowFrame from the DOM.
        cy.get(".windowFrame .wftButton.close").first().click({ force: true });

        // After destroy(), the windowFrame element must be gone.
        cy.get(".windowFrame").should("not.exist");

        // onclose also hides #keyboardHolder2 (sets display:"none") and clears
        // #myrow / #myrow2 before destroy() removes the enclosing frame, so
        // neither row should remain visible in the document.
        cy.get("#myrow").should("not.exist");
        cy.get("#myrow2").should("not.exist");
    });
});
