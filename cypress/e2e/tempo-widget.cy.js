/* global cy, beforeEach, afterEach, describe, expect, it */

// Cypress E2E coverage for the Tempo widget (js/widgets/tempo.js), opened by
// running a `tempo` block. Its BPM input feeds back into the real
// setmasterbpm2 block's number-block value through Tempo._useBPM().

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

// The real number block wired to setmasterbpm2's second connection, kept in
// sync by Tempo._updateBPM() whenever a BPM edit is applied through the widget.
const getMasterBpmValue = win => {
    const { blocks } = win.ActivityContext.getActivity();
    const bpmBlock = blocks.blockList.find(block => !block.trash && block.name === "setmasterbpm2");
    return blocks.blockList[bpmBlock.connections[1]].value;
};

describe("Tempo widget", () => {
    beforeEach(() => {
        // localStorage auto-save would otherwise re-trigger the widget from a
        // prior test, so it must be cleared before the app (re)loads.
        cy.clearLocalStorage();
        cy.visit("http://127.0.0.1:3000");
        cy.waitForAppReady();

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
        cy.get("body").then($body => {
            if ($body.find("#stop").length) {
                cy.get("#stop").click({ force: true });
            }
            const closeButton = $body.find(`${tempoDialog} .wftButton.close`);
            if (closeButton.length) {
                cy.wrap(closeButton).click({ force: true });
            }
        });
    });

    it("opens the Tempo widget and renders the BPM input with the project's starting value", () => {
        loadFixtureProject("tempo-widget-minimal.tb");
        cy.get("#play").click();

        cy.get(tempoDialog, { timeout: 30000 }).should("be.visible");

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

        // Tempo._useBPM() clamps to [30, 1000] and writes the clamped number
        // back to the real setmasterbpm2 number block, not just widget state.
        bpmInput().clear();
        bpmInput().type("2000{enter}");
        bpmInput().should("have.value", "1000");
        cy.window().should(win => {
            expect(getMasterBpmValue(win)).to.equal(1000);
        });

        bpmInput().clear();
        bpmInput().type("5{enter}");
        bpmInput().should("have.value", "30");
        cy.window().should(win => {
            expect(getMasterBpmValue(win)).to.equal(30);
        });

        // In-range value, stored as a real number (regression coverage for
        // #8605, where the BPM was left as a raw string).
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

        cy.get(`${tempoDialog} [role="button"][aria-label="Close window"]`).click();

        cy.get(tempoDialog).should("not.exist");
    });
});
