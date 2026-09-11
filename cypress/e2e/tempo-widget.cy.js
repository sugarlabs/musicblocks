/* global cy, beforeEach, afterEach, describe, expect, it */

/**
 * Cypress E2E test suite for the Tempo widget.
 *
 * The Tempo widget (js/widgets/tempo.js) behaves like a metronome and lets
 * users adjust the master beats-per-minute value for a running project. It
 * is opened by running a `tempo` block (via Play), and its BPM input feeds
 * back into the real `setmasterbpm2` block's underlying number block value
 * through Tempo._useBPM().
 *
 * These tests exercise the widget's complete launch and UI lifecycle through
 * the real application without any mocks:
 *  1. Loading a fixture project that contains a tempo block.
 *  2. Pressing Play to open the widget through the real block-execution path.
 *  3. Verifying the widget window frame and BPM input render with the
 *     project's real starting value.
 *  4. Editing the BPM input through the widget's real Enter-key handler and
 *     confirming both the clamped display value and the underlying block's
 *     value are updated for out-of-range input.
 *  5. Closing the widget and confirming it is fully removed from the DOM.
 */

const loadFixtureProject = fixtureName => {
    cy.get("#load").click();
    cy.get("#myOpenFile").selectFile(`cypress/fixtures/${fixtureName}`, { force: true });

    let stableObservations = 0;
    cy.window({ timeout: 30000 }).should(win => {
        const { blocks } = win.ActivityContext.getActivity();
        const fullyLoaded =
            blocks._loadCounter === 0 &&
            blocks.blockList.some(block => !block.trash && block.name === "tempo");
        stableObservations = fullyLoaded ? stableObservations + 1 : 0;
        expect(stableObservations, "fixture tempo block should remain fully loaded").to.be.at.least(
            5
        );
    });
    cy.get("#load-container", { timeout: 30000 }).should("not.be.visible");
    cy.get("#errorText").should("not.be.visible");
};

const tempoDialog = '[role="dialog"][aria-label="tempo"]';

// The real underlying number block wired to the master-BPM block, i.e. the
// child of setmasterbpm2's second connection - kept in sync by
// Tempo._updateBPM() whenever a BPM edit is applied through the widget.
const getMasterBpmValue = win => {
    const { blocks } = win.ActivityContext.getActivity();
    const bpmBlock = blocks.blockList.find(block => !block.trash && block.name === "setmasterbpm2");
    const numberBlockIdx = bpmBlock.connections[1];
    return blocks.blockList[numberBlockIdx].value;
};

describe("Tempo widget", () => {
    beforeEach(() => {
        // Each test gets a fresh app load to prevent Music Blocks' localStorage
        // auto-save from re-triggering the widget on subsequent test runs.
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
        cy.reload();
        cy.waitForAppReady();

        // Dismiss the first-run "Take a Tour" guide if it appears, so that
        // the .windowFrame selectors used in tests are unambiguous.
        cy.get("body").then($body => {
            const closeButtons = $body.find(".windowFrame .wftButton.close");
            if (closeButtons.length) {
                cy.wrap(closeButtons).each($btn => {
                    cy.wrap($btn).click({ force: true });
                });
            }
        });
    });

    afterEach(() => {
        // Stop audio playback and close any open widget windows to prevent
        // active loops from interrupting the next test's page initialization.
        cy.get("body").then($body => {
            if ($body.find("#stop").length) {
                cy.get("#stop").click({ force: true });
            }
            const closeButtons = $body.find(".windowFrame .wftButton.close");
            if (closeButtons.length) {
                cy.wrap(closeButtons).each($btn => {
                    cy.wrap($btn).click({ force: true });
                });
            }
        });
    });

    it("opens the Tempo widget and renders the BPM input with the project's starting value", () => {
        loadFixtureProject("tempo-widget-minimal.tb");

        // Pressing Play executes the start stack, which triggers the tempo
        // block and calls Tempo.init() - the same path a real user takes.
        cy.get("#play").click();

        cy.get(tempoDialog, { timeout: 30000 }).should("be.visible");

        // Tempo.init() renders one BPM <input> per master-BPM block plus a
        // canvas beat-visualizer for the fixture's single setmasterbpm2 block.
        cy.get(`${tempoDialog} input`).should("have.length", 1);
        cy.get(`${tempoDialog} input`).eq(0).should("have.value", "90");
        cy.get(`${tempoDialog} canvas`).should("have.length", 1);

        for (const label of ["Pause", "Save tempo", "speed up", "slow down"]) {
            cy.get(`${tempoDialog} [role="button"][aria-label="${label}"]`).should("be.visible");
        }
    });

    it("clamps an out-of-range BPM entered through the input and updates the real block value", () => {
        loadFixtureProject("tempo-widget-minimal.tb");
        cy.get("#play").click();

        cy.get(tempoDialog, { timeout: 30000 }).should("be.visible");
        const bpmInput = () => cy.get(`${tempoDialog} input`).eq(0);

        // Tempo._useBPM() clamps any value above 1000 down to 1000 and
        // propagates the clamped number to the real setmasterbpm2 number
        // block via Tempo._updateBPM() - not just the widget's own display.
        bpmInput().clear();
        bpmInput().type("2000{enter}");
        bpmInput().should("have.value", "1000");
        cy.window().should(win => {
            expect(getMasterBpmValue(win)).to.equal(1000);
        });

        // Symmetric clamp below 30.
        bpmInput().clear();
        bpmInput().type("5{enter}");
        bpmInput().should("have.value", "30");
        cy.window().should(win => {
            expect(getMasterBpmValue(win)).to.equal(30);
        });

        // A valid in-range value passes through unchanged and is stored as a
        // real number on the block (regression coverage for #8605, where the
        // BPM was left as a raw string instead of being parsed to a number).
        bpmInput().clear();
        bpmInput().type("125{enter}");
        bpmInput().should("have.value", "125");
        cy.window().should(win => {
            expect(getMasterBpmValue(win)).to.equal(125);
        });
    });

    it("closes the Tempo widget and cleans up the DOM", () => {
        loadFixtureProject("tempo-widget-minimal.tb");
        cy.get("#play").click();

        cy.get(tempoDialog, { timeout: 30000 }).should("be.visible");
        cy.get(`${tempoDialog} canvas`).should("have.length", 1);

        // Click the close button on the widget window titlebar.
        // Tempo wires widgetWindow.onclose to clear its interval and call
        // widgetWindow.destroy() - which removes the .windowFrame from the DOM.
        cy.get(`${tempoDialog} [role="button"][aria-label="Close window"]`).click();

        cy.get(tempoDialog).should("not.exist");
    });
});
