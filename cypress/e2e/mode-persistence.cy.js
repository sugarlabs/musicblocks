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

// Custom modes are stored by the app as a JSON array under the "customModes"
// local-storage key ({ name, pattern, edo } entries). getSavedCustomModes()
// in js/utils/musicutils.js and the load-time rehydration in js/activity.js
// both read exactly this key, so it is the actual custom-mode state - not a
// test-only shadow of it. js/widgets/__tests__/modewidget.test.js asserts the
// same way. localStorage survives cy.reload() on its own, so this is a real
// check that nothing in the reload path clears it.
const readCustomModes = () =>
    cy.window().then(win => JSON.parse(win.localStorage.getItem("customModes") || "[]"));

// js/blocks.js loadNewBlocks() is chunked across setTimeout()s and only
// settles when blocks._loadCounter returns to 0; the load dialog closing does
// not mean the project is usable (mid-load it was observed at _loadCounter=17
// with every "expected" block name already present). Requiring _loadCounter===0
// AND the key blocks present to hold for several consecutive retries filters
// out both the "not started yet" state and the transient re-load window the
// file-load handler can trigger. Same shape as project-persistence.cy.js's
// waitForPiFullyLoaded.
const waitForProjectLoaded = (expectedNames, opts = {}) => {
    let stableObservations = 0;
    cy.window(opts).should(win => {
        const blocks = win.ActivityContext.getActivity().blocks;
        const live = blocks.blockList.filter(block => !block.trash).map(block => block.name);
        const ready = blocks._loadCounter === 0 && expectedNames.every(name => live.includes(name));
        stableObservations = ready ? stableObservations + 1 : 0;
        expect(
            stableObservations,
            "project's fully-loaded state should hold across repeated checks"
        ).to.be.at.least(5);
    });
};

const keySignature = win =>
    win.ActivityContext.getActivity().turtles.ithTurtle(0).singer.keySignature;

const PROJECT_BLOCKS = ["start", "modewidget", "setkey2", "modename"];

describe("Custom mode persistence", () => {
    // Unlikely to collide with a built-in mode name or one left over from a
    // previous run. A user-authored name also has no i18n entry, so _(name)
    // === name in every locale. The fixture's modename block already carries
    // this name, so running the project resolves it through the custom-mode
    // registry.
    const CUSTOM_MODE_NAME = "e2eCustomMode";

    beforeEach(() => {
        // The custom-mode registry is global rather than per-project, so
        // each test needs a clean slate to avoid leaking into the next one.
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
        cy.visit("http://127.0.0.1:3000");
        cy.waitForAppReady();

        // Dismiss the first-run "Take a Tour" guide - it's a widget window
        // too, and would otherwise collide with the ".windowFrame" selectors
        // used below.
        cy.get("body").then($body => {
            const closeButtons = $body.find(".windowFrame .wftButton.close");
            if (closeButtons.length) {
                cy.wrap(closeButtons).click({ multiple: true, force: true });
            }
        });
    });

    it("persists a custom mode saved through the real Mode Widget UI across a reload", () => {
        loadFixtureProject("mode-widget-minimal.tb");
        waitForProjectLoaded(PROJECT_BLOCKS, { timeout: 30000 });

        // Pressing Play runs the start stack, which is how the Custom Mode
        // block actually opens its widget - the same path a real user takes.
        // The mode name is not registered yet, so the widget just opens on the
        // current (built-in) mode.
        cy.get("#play").click();

        // Wait for the widget's name field rather than its title text: the
        // title is rendered from translated mode names and asserting on it
        // ties the test to UI rendering and i18n.
        cy.get(".windowFrame #customModeName", { timeout: 30000 }).should("be.visible");

        // Save the widget's current pattern under a new name via the real
        // Save button - the actual "define a custom mode" workflow. Editing
        // individual wheel notes instead would require fragile SVG-slice
        // coordinate clicks for no added coverage of the persistence path
        // under test.
        cy.get(".windowFrame #customModeName").clear().type(CUSTOM_MODE_NAME);
        cy.get('.windowFrame [aria-label="Save"]').click();

        // _saveCustomMode() (js/widgets/modewidget.js) writes "customModes"
        // synchronously; this assertion fails if the mode is never saved.
        readCustomModes().should(modes => {
            const saved = modes.find(m => m.name === CUSTOM_MODE_NAME);
            expect(saved, "custom mode written to customModes").to.exist;
            expect(saved.pattern, "custom mode carries an interval pattern")
                .to.be.an("array")
                .and.have.length.greaterThan(0);
        });

        cy.reload();
        cy.waitForAppReady();
        // Let the reload's own session restore settle before loading again.
        waitForProjectLoaded([], { timeout: 30000 });

        // The saved custom mode must still be present in customModes after the
        // reload; this assertion fails if the custom mode is lost.
        readCustomModes().should(modes => {
            const restored = modes.find(m => m.name === CUSTOM_MODE_NAME);
            expect(restored, "custom mode restored in customModes after reload").to.exist;
            expect(restored.pattern, "restored custom mode keeps its interval pattern")
                .to.be.an("array")
                .and.have.length.greaterThan(0);
        });

        // Load a fresh copy of the project that references the custom mode by
        // name and run it. setkey2 (js/blocks/IntervalsBlocks.js) resolves the
        // modename block's value through Singer.IntervalsActions.GetModename(),
        // which finds the name only if js/activity.js rehydrated MUSICALMODES
        // from the restored customModes on load; otherwise GetModename() falls
        // back to "major" (the widget's own _setMode() instead returns early
        // and applies nothing, but that path is not what this checks). Loading
        // the fixture again keeps this independent of project autosave/restore,
        // which project-persistence.cy.js already covers.
        loadFixtureProject("mode-widget-minimal.tb");
        waitForProjectLoaded(PROJECT_BLOCKS, { timeout: 30000 });
        cy.get("#play").click();
        cy.get(".windowFrame #customModeName", { timeout: 30000 }).should("be.visible");

        // The widget only becomes visible after setkey2 has run inside the
        // modewidget clamp, so the key signature is already set by this point;
        // the extra timeout just absorbs a slow CI executor.
        cy.window({ timeout: 15000 }).should(win => {
            expect(keySignature(win), "restored custom mode resolves on re-run").to.equal(
                `C ${CUSTOM_MODE_NAME}`
            );
        });
    });
});
