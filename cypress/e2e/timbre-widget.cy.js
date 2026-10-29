// Copyright (c) 2026 Music Blocks contributors
//
// This program is free software; you can redistribute it and/or modify it
// under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation; either version 3 of the License, or
// (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.

/* global cy, beforeEach, afterEach, describe, expect, it, Cypress */

const timbreDialog = '[role="dialog"][aria-label="timbre"]';
const closeButton = '[role="button"][aria-label="Close window"]';
const synthChoices = `${timbreDialog} input[name="synthsName"]`;

const openTimbre = () => {
    cy.get("#load").click();
    cy.get("#myOpenFile").selectFile("cypress/fixtures/timbre-widget-minimal.tb", {
        force: true
    });

    let stableObservations = 0;
    cy.window({ timeout: 30000 }).should(win => {
        const { blocks } = win.ActivityContext.getActivity();
        const fullyLoaded =
            blocks._loadCounter === 0 &&
            blocks.blockList.some(block => !block.trash && block.name === "timbre");
        stableObservations = fullyLoaded ? stableObservations + 1 : 0;
        expect(
            stableObservations,
            "fixture timbre block should remain fully loaded"
        ).to.be.at.least(5);
    });
    cy.get("#load-container", { timeout: 30000 }).should("not.be.visible");
    cy.get("#errorText").should("not.be.visible");
    cy.get("#play").click();
    cy.get(timbreDialog, { timeout: 30000 }).should("be.visible");
};

const openSynthPanel = () => {
    cy.get(`${timbreDialog} [role="button"][aria-label="Synthesizer"]`).click();
    cy.get(`${timbreDialog} #timbreTable`).should("be.visible");
};

describe("Timbre widget", { testIsolation: true }, () => {
    beforeEach(() => {
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
        cy.reload();
        cy.waitForAppReady();
        cy.get("body").then($body => {
            const helpClose = $body.find(`[role="dialog"][aria-label="help"] ${closeButton}`);
            if (helpClose.length) {
                cy.wrap(helpClose).click({ force: true });
            }
        });
        openTimbre();
    });

    afterEach(() => {
        cy.get("body").then($body => {
            if ($body.find("#stop").length) {
                cy.get("#stop").click({ force: true });
            }
            const timbreClose = $body.find(`${timbreDialog} ${closeButton}`);
            if (timbreClose.length) {
                cy.wrap(timbreClose).click({ force: true });
            }
        });
    });

    it("opens through the timbre block and renders the toolbar", () => {
        for (const label of ["Play", "Save", "Synthesizer", "Oscillator", "Envelope", "Undo"]) {
            cy.get(`${timbreDialog} [role="button"][aria-label="${label}"]`).should("be.visible");
        }
    });

    it("renders the three synth instrument choices", () => {
        openSynthPanel();
        cy.get(synthChoices).should("have.length", 3);
        for (const value of ["AMSynth", "FMSynth", "DuoSynth"]) {
            cy.get(`${synthChoices}[value="${value}"]`).should("be.visible").and("not.be.checked");
        }
        cy.get(`${timbreDialog} #synth0`)
            .should("contain.text", "AM synth")
            .and("contain.text", "FM synth")
            .and("contain.text", "duo synth");
    });

    it("switches instruments and replaces their parameter controls", () => {
        openSynthPanel();
        // Returning to AM also verifies Duo's second parameter is removed.
        for (const [value, labels] of [
            ["AMSynth", ["harmonicity"]],
            ["FMSynth", ["modulation index"]],
            ["DuoSynth", ["vibrato rate", "vibrato amount"]],
            ["AMSynth", ["harmonicity"]]
        ]) {
            cy.get(`${synthChoices}[value="${value}"]`).check();
            cy.get(`${synthChoices}:checked`).should("have.length", 1).and("have.value", value);
            cy.get(`${timbreDialog} #chosen`).should("have.text", value);
            cy.get(`${timbreDialog} #synth1 input[type="range"]`).should(
                "have.length",
                labels.length
            );
            labels.forEach((label, index) => {
                cy.get(`${timbreDialog} #sS${index}`).should("have.text", label);
            });
            // Selection inserts/replaces real blocks asynchronously. Wait for
            // that work before selecting the next instrument.
            cy.window({ timeout: 30000 }).should(win => {
                const { blocks } = win.ActivityContext.getActivity();
                expect(blocks._loadCounter).to.equal(0);
                const synthIndex = blocks.blockList.findIndex(
                    block => !block.trash && block.name === value.toLowerCase()
                );
                expect(synthIndex, "selected synth block exists").to.be.at.least(0);
                const parentIndex = blocks.blockList[synthIndex].connections[0];
                expect(parentIndex, "synth is connected inside the timbre clamp").not.to.be.null;
                expect(blocks.blockList[parentIndex].connections).to.include(synthIndex);
                const timbreIndex = blocks.blockList.findIndex(
                    block => !block.trash && block.name === "timbre"
                );
                expect(timbreIndex, "fixture timbre block exists").to.be.at.least(0);
                const clampFlow = new Set();
                let current = blocks.blockList[timbreIndex].connections[2];
                while (current !== null && current !== undefined && !clampFlow.has(current)) {
                    clampFlow.add(current);
                    current = blocks.blockList[current].connections.at(-1);
                }
                expect([...clampFlow], "selected synth belongs to the timbre body").to.include(
                    synthIndex
                );
            });
        }
    });

    it("detaches the window and instrument panel when closed", () => {
        openSynthPanel();
        cy.get(timbreDialog).then($frame => {
            const panel = $frame.find("#timbreTable")[0];
            cy.wrap($frame).find(closeButton).click();
            cy.wrap(null).should(() => {
                expect(Cypress.dom.isAttached($frame[0]), "window detached").to.be.false;
                expect(Cypress.dom.isAttached(panel), "instrument panel detached").to.be.false;
            });
        });
        cy.get(timbreDialog).should("not.exist");
        cy.get("#timbreTable").should("not.exist");
        cy.get('input[name="synthsName"]').should("not.exist");
    });
});
