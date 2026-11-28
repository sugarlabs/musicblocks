// Copyright (c) 2026 Music Blocks contributors
//
// This program is free software; you can redistribute it and/or modify it
// under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation; either version 3 of the License, or
// (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.

/* global cy, describe, it, expect */

describe("Planet share links", () => {
    const sharedProject = [
        [0, ["start", { collapsed: false }], 250, 150, [null, 1, null]],
        [1, "settimbre", 0, 0, [0, 2, null, 3]],
        [2, ["voicename", { value: "violin" }], 0, 0, [1]],
        [3, "hidden", 0, 0, [1, null]]
    ];

    const stubPlanet = projectReply => {
        cy.intercept({ hostname: "git-planet.sugarlabs.org" }, { body: {} });
        cy.intercept("GET", "**/api/github/tagManifest", {
            delay: 60000,
            body: { success: true, data: {} }
        });
        cy.intercept("GET", "**/api/github/getProjectData*", projectReply);
    };

    it("opens the shared project while the server is still sending its tags", () => {
        stubPlanet({
            body: { content: btoa(encodeURIComponent(JSON.stringify(sharedProject))) }
        });
        cy.visit("http://127.0.0.1:3000/?repo=shared-song");
        cy.waitForAppReady();

        cy.window({ timeout: 20000 }).should(win => {
            const activity = win.ActivityContext.getActivity();
            const voices = activity.blocks.blockList.filter(
                block => !block.trash && block.name === "voicename"
            );

            expect(voices.map(block => block.value)).to.deep.equal(["violin"]);
            expect(activity.planet.getCurrentProjectName()).to.match(/^Remix of/);
            expect(activity.planet.planet.ConnectedToServer).to.equal(null);
        });
    });

    it("lists the local projects while the server is still sending its tags", () => {
        stubPlanet({ statusCode: 404, body: {} });
        cy.visit("http://127.0.0.1:3000/");
        cy.waitForAppReady();
        cy.get("#planetIcon").click();

        cy.get("#planet-iframe")
            .its("0.contentDocument.body")
            .find("#local-projects")
            .children()
            .should("have.length.at.least", 1);

        cy.window().then(win => {
            const activity = win.ActivityContext.getActivity();
            expect(activity.planet.planet.ConnectedToServer).to.equal(null);
            activity.planet.closePlanet();
        });
    });

    it("tells the user when the shared project cannot be loaded", () => {
        stubPlanet({ statusCode: 404, body: { error: "not found" } });
        cy.visit("http://127.0.0.1:3000/?repo=missing-song");
        cy.waitForAppReady();

        cy.window({ timeout: 20000 }).should(win => {
            const { errorMsgText } = win.ActivityContext.getActivity();

            expect(errorMsgText.parent.visible).to.equal(true);
            expect(errorMsgText.text).to.equal(
                "Could not load project. Please check your connection and try again."
            );
        });
    });
});
