/* global cy, beforeEach, afterEach, describe, expect, it */

/**
 * Cypress E2E test suite for the Mode Widget.
 *
 * The Mode Widget (js/widgets/modewidget.js) lets users build custom musical
 * modes by selecting intervals on an interactive SVG pie wheel.  It is opened
 * by running a `modewidget` block (via Play).
 *
 * These tests exercise the widget's complete launch and UI lifecycle through
 * the real application without any mocks:
 *  1. Loading a fixture project that contains a modewidget block.
 *  2. Pressing Play to open the widget through the real block-execution path.
 *  3. Verifying the widget window frame and the SVG mode wheel render correctly.
 *  4. Confirming all toolbar action buttons are present.
 *  5. Verifying the mode-label cell is rendered inside the mode table.
 *  6. Closing the widget and confirming it is fully removed from the DOM.
 *
 * NOTE ON SELECTORS
 * ModeWidget.init() calls widgetWindows.windowFor(this, "custom mode"), which
 * sets aria-label="custom mode" on the frame initially.  However,
 * _setModeName() (modewidget.js) immediately calls
 * this.widgetWindow.updateTitle(name) once the wheel is hydrated, which
 * overwrites BOTH the wftTitle text and the frame's aria-label with the
 * detected mode name (e.g. "C major").  Selectors that rely on "custom mode"
 * therefore stop matching as soon as the wheel initialises.
 *
 * We instead scope all assertions to the .windowFrame that contains
 * #modeWidgetWheelDiv -- that element is created once in init() and is never
 * renamed, making it a stable anchor for the lifetime of the widget.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const loadFixtureProject = fixtureName => {
    cy.get("#load").click();
    cy.get("#myOpenFile").selectFile(`cypress/fixtures/${fixtureName}`, { force: true });

    // Require _loadCounter to be 0 AND the modewidget block to be present for
    // at least 5 consecutive Cypress retries (same stability pattern used by
    // meter-widget.cy.js) to filter out the transient zero the chunked loader
    // emits before restarting.
    let stableObservations = 0;
    cy.window({ timeout: 30000 }).should(win => {
        const { blocks } = win.ActivityContext.getActivity();
        const fullyLoaded =
            blocks._loadCounter === 0 &&
            blocks.blockList.some(block => !block.trash && block.name === "modewidget");
        stableObservations = fullyLoaded ? stableObservations + 1 : 0;
        expect(
            stableObservations,
            "fixture modewidget block should remain fully loaded"
        ).to.be.at.least(5);
    });
    cy.get("#load-container", { timeout: 30000 }).should("not.be.visible");
    cy.get("#errorText").should("not.be.visible");
};

const openModeWidget = () => {
    loadFixtureProject("mode-widget-minimal.tb");
    cy.get("#play").click();
    // Wait for the <svg> that wheelnav inserts inside #modeWidgetWheelDiv.
    // #modeWidgetWheelDiv is created by init() before wheelnav runs, so
    // waiting on the div alone would not prove the wheel rendered. Waiting on
    // the inner svg confirms wheelnav has finished drawing the pie chart.
    cy.get(".windowFrame #modeWidgetWheelDiv svg", { timeout: 30000 }).should("exist");
};

// Scope all assertions to the windowFrame that owns the mode wheel,
// regardless of what title the widget has set on itself.
const modeFrame = () => cy.get("#modeWidgetWheelDiv").closest(".windowFrame");

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("Mode widget", () => {
    beforeEach(() => {
        // Each test gets a fresh app load to prevent Music Blocks localStorage
        // auto-save from re-triggering the widget on subsequent test runs.
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
        cy.reload();
        cy.waitForAppReady();

        // Dismiss the first-run "Take a Tour" guide so that .windowFrame
        // selectors used in tests are unambiguous.
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
        // Stop any active audio playback and close open widget windows so that
        // audio loops do not bleed into the next test's page initialisation.
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

    // 1. Launch + SVG wheel

    it("opens the Mode widget and renders the SVG mode wheel", () => {
        openModeWidget();

        // The wheel div is the stable identity of this widget; the frame title
        // reflects the active mode name and is not asserted here.
        modeFrame().find("#modeWidgetWheelDiv").should("be.visible");

        // The wheelnav library inserts an <svg> element confirming the pie
        // chart rendered without errors.
        modeFrame().find("#modeWidgetWheelDiv svg").should("exist");
    });

    // 2. Toolbar buttons

    it("renders all expected toolbar action buttons", () => {
        openModeWidget();

        // Toolbar buttons are added in this order inside ModeWidget.init():
        //   Play, Clear, Rotate counter clockwise, Rotate clockwise,
        //   Invert, Undo, Share
        const expectedButtons = [
            "Play",
            "Clear",
            "Rotate counter clockwise",
            "Rotate clockwise",
            "Invert",
            "Undo",
            "Share"
        ];

        for (const label of expectedButtons) {
            modeFrame().find(`[role="button"][aria-label="${label}"]`).should("be.visible");
        }
    });

    // 3. Mode table label

    it("renders the mode table with a label cell", () => {
        openModeWidget();

        // ModeWidget.init() creates a <table id="modeTable"> and inserts a
        // header row containing a label cell (_modeLabelCell).  The cell is
        // present even when no notes are selected yet.
        modeFrame().find("#modeTable").should("exist");
        modeFrame().find("#modeTable tr").should("have.length.greaterThan", 0);
    });

    // 4. Close lifecycle

    it("closes the Mode widget and cleans up the DOM", () => {
        openModeWidget();

        // Capture the frame element before clicking Close so we can assert
        // that widgetWindow.destroy() physically removed it from the DOM,
        // not just that its children disappeared.
        modeFrame().then($frame => {
            cy.wrap($frame)
                .find('[role="button"][aria-label="Close window"]')
                .click({ force: true });

            // Cypress.dom.isAttached() returns false once the element is
            // detached from the document, proving .windowFrame was destroyed.
            cy.wrap(null).should(() => {
                expect(
                    Cypress.dom.isAttached($frame[0]),
                    ".windowFrame should be detached after destroy()"
                ).to.equal(false);
            });

            // Belt-and-suspenders: the wheel div and mode table must also
            // be absent from the document.
            cy.get("#modeWidgetWheelDiv").should("not.exist");
            cy.get("#modeTable").should("not.exist");
        });
    });
});
