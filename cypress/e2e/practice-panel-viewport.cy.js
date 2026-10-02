// Copyright (c) 2026 macayu17
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* global cy, describe, beforeEach, it, expect */

const panels = ["#practice-panel", "#explorer-journal-panel"];

const assertInViewport = selector => {
    cy.get(selector).should($panel => {
        const panel = $panel[0];
        const win = panel.ownerDocument.defaultView;
        const frame = panel.querySelector(".practice-panel-frame").getBoundingClientRect();
        const toggle = panel
            .querySelector(".practice-panel-collapse-toggle")
            .getBoundingClientRect();
        expect(frame.left).to.be.at.least(0);
        expect(frame.right).to.be.at.most(win.innerWidth);
        expect(frame.top).to.be.at.least(64);
        expect(frame.bottom).to.be.at.most(win.innerHeight);
        expect(toggle.left).to.be.at.least(0);
        expect(toggle.right).to.be.at.most(win.innerWidth);
    });
};

describe("Practice panel viewport", () => {
    beforeEach(() => {
        cy.viewport(1440, 900);
        cy.visit("http://127.0.0.1:3000", {
            onBeforeLoad(win) {
                win.localStorage.clear();
            }
        });
        cy.waitForAppReady();
        cy.get(".windowFrame .wftButton.close").click({ multiple: true, force: true });
        cy.window().then(async win => {
            await win.startPracticeMode();
            await win.openExplorerJournal();
        });
    });

    it("keeps docked panels and their tabs onscreen as the viewport changes", () => {
        [700, 390, 320, 1440].forEach(width => {
            cy.viewport(width, 900);
            panels.forEach(assertInViewport);
        });
        panels.forEach(selector => cy.get(selector).should("have.css", "width", "360px"));
        cy.get("#explorer-journal-panel").should($journal => {
            const practice = $journal[0].ownerDocument.getElementById("practice-panel");
            expect($journal[0].getBoundingClientRect().right).to.be.lessThan(
                practice.getBoundingClientRect().left
            );
        });
        cy.get("#practice-panel > .practice-panel-collapse-toggle").click();
        cy.get("#explorer-journal-panel").should($journal => {
            expect($journal[0].getBoundingClientRect().right).to.equal(1440);
        });
        cy.get("#explorer-journal-content .journal-general-empty").click();
        cy.get("#practice-panel > .practice-panel-collapse-toggle").click();
        panels.forEach(assertInViewport);
    });

    it("keeps a moved panel onscreen after resizing or expanding", () => {
        cy.get("#explorer-journal-panel").then($panel => {
            const panel = $panel[0];
            panel.dataset.userMoved = "true";
            panel.style.left = "1000px";
            panel.style.top = "150px";
            panel.style.right = "auto";
        });
        cy.viewport(390, 500);
        assertInViewport("#explorer-journal-panel");
        cy.viewport(1440, 900);
        cy.get("#explorer-journal-panel > .practice-panel-collapse-toggle").click();
        cy.viewport(320, 400);
        cy.get("#explorer-journal-panel > .practice-panel-collapse-toggle").click();
        assertInViewport("#explorer-journal-panel");
    });

    it("uses resized frame widths when docking and keeps Close reachable", () => {
        cy.get("#practice-panel .practice-panel-frame").then($frame => {
            $frame[0].style.width = "500px";
        });
        panels.forEach(assertInViewport);
        cy.get("#explorer-journal-panel").should($journal => {
            const practice = $journal[0].ownerDocument.querySelector(
                "#practice-panel .practice-panel-frame"
            );
            expect($journal[0].getBoundingClientRect().right).to.be.lessThan(
                practice.getBoundingClientRect().left
            );
        });
        cy.get("#practice-panel > .practice-panel-collapse-toggle").click();
        cy.get("#practice-panel > .practice-panel-collapse-toggle").should($toggle => {
            expect($toggle[0].getBoundingClientRect().right).to.equal(1440);
        });
        cy.get("#practice-panel > .practice-panel-collapse-toggle").click();
        cy.get("#practice-panel .practice-panel-frame").should("have.css", "width", "500px");
        cy.viewport(390, 500);
        panels.forEach(assertInViewport);
        cy.viewport(1440, 900);
        cy.get("#practice-panel .practice-panel-frame").should("have.css", "width", "500px");
        cy.viewport(390, 500);
        cy.get("#practice-panel > .practice-panel-collapse-toggle").click();
        cy.get("#close-explorer-journal").click();
        cy.get("#explorer-journal-panel").should("not.be.visible");
        cy.get("#practice-panel > .practice-panel-collapse-toggle").click();
        cy.get("#close-practice").click();
        cy.get("#practice-panel").should("not.be.visible");
        cy.window().then(win => win.openExplorerJournal());
        assertInViewport("#explorer-journal-panel");
    });
});
