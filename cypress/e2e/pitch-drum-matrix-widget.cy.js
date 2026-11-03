// Copyright (c) 2026 Music Blocks contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA.

/* global cy, beforeEach, afterEach, describe, expect, it, Cypress */

const DIALOG = '.windowFrame[role="dialog"][aria-label="pitch drum"]';
const CELLS = `${DIALOG} #pdmTable td[id*=","]`;

const cell = (row, column) => cy.get(`${DIALOG} td[id="${row},${column}"]`);

const expectSelected = (row, column, selected) => {
    cell(row, column).should($cell => {
        expect($cell[0].style.backgroundColor === "black", `mapping ${row},${column}`).to.equal(
            selected
        );
    });
};

const runProject = () => {
    // The toolbar temporarily removes onclick to debounce consecutive runs.
    cy.get("#play")
        .should($button => expect($button[0].onclick, "Play is ready").to.be.a("function"))
        .click();
    cy.get(DIALOG, { timeout: 30000 }).should("be.visible").and("have.length", 1);
    cy.get(CELLS).should("have.length", 4);
    cy.get("#errorText").should("not.be.visible");
};

const closeMatrix = () => {
    cy.get(DIALOG).then($frame => {
        cy.wrap($frame).find('[role="button"][aria-label="Close window"]').click();
        cy.wrap(null).should(() => {
            expect(Cypress.dom.isAttached($frame[0]), "closed frame is detached").to.be.false;
        });
    });
    cy.get(DIALOG).should("not.exist");
    for (const id of ["pdmOuterDiv", "pdmInnerDiv", "pdmTable"]) {
        cy.get(`#${id}`).should("not.exist");
    }
};

describe("Pitch-Drum Matrix widget", { retries: 0 }, () => {
    beforeEach(() => {
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
        cy.reload();
        cy.waitForAppReady();
        cy.get("body").then($body => {
            const closeButtons = $body.find(".windowFrame .wftButton.close");
            if (closeButtons.length) {
                cy.wrap(closeButtons).each($button => cy.wrap($button).click({ force: true }));
            }
        });

        cy.get("#load").click();
        cy.get("#myOpenFile").selectFile("cypress/fixtures/pitch-drum-matrix-minimal.tb", {
            force: true
        });

        // Match the stable-load observation pattern used by the other widget suites.
        let stableObservations = 0;
        cy.window({ timeout: 30000 }).should(win => {
            const { blocks } = win.ActivityContext.getActivity();
            const fullyLoaded =
                blocks._loadCounter === 0 &&
                blocks.blockList.some(block => !block.trash && block.name === "pitchdrummatrix");
            stableObservations = fullyLoaded ? stableObservations + 1 : 0;
            expect(stableObservations, "fixture remains fully loaded").to.be.at.least(5);
        });
        cy.get("#load-container", { timeout: 30000 }).should("not.be.visible");
        runProject();
    });

    afterEach(() => {
        cy.get("body").then($body => {
            if ($body.find("#stop").length) cy.get("#stop").click({ force: true });
            const closeButtons = $body.find(".windowFrame .wftButton.close");
            if (closeButtons.length) {
                cy.wrap(closeButtons).each($button => cy.wrap($button).click({ force: true }));
            }
        });
    });

    it("renders both pitch rows and drum columns through block execution", () => {
        cy.get(`${DIALOG} .wftTitle`).should("contain.text", "pitch drum");
        cy.get(`${DIALOG} [data-note-arg]`).should("have.length", 2);
        cy.get(`${DIALOG} [data-note-arg="sol"]`).should("have.attr", "data-octave", "4");
        cy.get(`${DIALOG} [data-note-arg="mi"]`).should("have.attr", "data-octave", "4");
        for (const drum of ["kick drum", "snare drum"]) {
            cy.get(`${DIALOG} #pdmDrumTable img[title="${drum}"]`).should("be.visible");
        }
        cy.get(CELLS).each($cell => {
            expect($cell[0].style.backgroundColor).not.to.equal("black");
        });
    });

    it("renders the Play, Save and Clear controls", () => {
        for (const label of ["Play", "Save", "Clear"]) {
            cy.get(`${DIALOG} [role="button"][aria-label="${label}"]`).should("be.visible");
        }
    });

    it("selects and deselects a mapping without restoring it on reopen", () => {
        cell(0, 0).click();
        expectSelected(0, 0, true);
        cell(0, 0).click();
        expectSelected(0, 0, false);
        closeMatrix();
        runProject();
        expectSelected(0, 0, false);
    });

    it("replaces a pitch's drum independently and preserves mappings on reopen", () => {
        cell(0, 0).click();
        cell(1, 0).click();
        expectSelected(0, 0, true);
        expectSelected(1, 0, true);
        cell(0, 1).click();
        expectSelected(0, 0, false);
        expectSelected(0, 1, true);
        expectSelected(1, 0, true);
        expectSelected(1, 1, false);
        closeMatrix();
        runProject();
        expectSelected(0, 0, false);
        expectSelected(0, 1, true);
        expectSelected(1, 0, true);
        expectSelected(1, 1, false);
    });

    it("clears mappings from every row and keeps them cleared on reopen", () => {
        cell(0, 0).click();
        cell(1, 1).click();
        expectSelected(0, 0, true);
        expectSelected(1, 1, true);
        cy.get(`${DIALOG} [role="button"][aria-label="Clear"]`).click();
        cy.get(CELLS).each($cell => {
            expect($cell[0].style.backgroundColor).not.to.equal("black");
        });
        closeMatrix();
        runProject();
        cy.get(CELLS).each($cell => {
            expect($cell[0].style.backgroundColor).not.to.equal("black");
        });
    });

    it("detaches the window and grid, then reopens one usable matrix", () => {
        closeMatrix();
        runProject();
        cy.get("#pdmTable").should("have.length", 1);
        cell(0, 0).click();
        expectSelected(0, 0, true);
        cy.get("#errorText").should("not.be.visible");
    });
});
