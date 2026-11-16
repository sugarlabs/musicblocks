// Copyright (c) 2026 Music Blocks contributors
//
// This program is free software; you can redistribute it and/or modify it
// under the GNU Affero General Public License, version 3 or later.
// See COPYING or https://www.gnu.org/licenses/ for details.

/* global Cypress, cy, describe, it, beforeEach, expect */

describe("Kokoro Sing block", () => {
    let generate;
    let played;
    let renderedAudio;

    beforeEach(() => {
        played = [];
        cy.visit("http://127.0.0.1:3000");
        cy.waitForAppReady();
        cy.window().then(win => win.caches.delete("musicblocks-kokoro-syllables-v1"));
        cy.window().then(win => {
            win.widgetWindows.hideAllWindows();
            // Exercise our real scheduler, sampler and DSP without a model download in CI.
            const audio = win.Float32Array.from(
                { length: 12000 },
                (_, i) => 0.3 * Math.sin((2 * Math.PI * 220 * i) / 24000)
            );
            renderedAudio = { audio, sampling_rate: 24000 };
            generate = cy.stub().resolves(renderedAudio);
            cy.stub(win.KokoroSpeech.prototype, "_ensureEngine").resolves({ generate });
            const synth = win.ActivityContext.getActivity().logo.synth;
            const trigger = synth.trigger;
            cy.spy(win.KokoroSpeech, "tuneSyllable").as("tuneSyllable");
            synth.trigger = (turtle, notes, duration, instrument, ...rest) => {
                if (instrument.startsWith("sing:")) played.push([].concat(notes).join("+"));
                return trigger(turtle, notes, duration, instrument, ...rest);
            };
        });
        let loaded = false;
        cy.window().then(win =>
            win.pubsub.once("finishedLoading", () => {
                loaded = true;
            })
        );
        cy.get("#load").click();
        cy.get("#myOpenFile").selectFile("examples/kokoro-singing.tb", { force: true });
        cy.wrap(null, { timeout: 30000 }).should(() => expect(loaded).to.equal(true));
    });

    it("sings the demo, replays from cache, and preserves the block when saving", () => {
        cy.get("#play").click();
        cy.wrap(null, { timeout: 20000 }).should(() =>
            expect(played).to.deep.equal(["C4", "E4", "G4", "C5"])
        );
        cy.window().should(win => {
            expect(
                win.ActivityContext.getActivity().turtles.turtleList.some(t => t.running)
            ).to.equal(false);
        });
        cy.then(() => {
            played.length = 0;
        });
        cy.get("#play").click();
        cy.wrap(null, { timeout: 20000 }).should(() => {
            expect(played).to.deep.equal(["C4", "E4", "G4", "C5"]);
            expect(generate).to.have.been.calledOnce;
        });
        cy.window().then(win => {
            const exported = JSON.parse(win.prepareExport());
            expect(
                exported.some(row => (Array.isArray(row[1]) ? row[1][0] : row[1]) === "sing")
            ).to.equal(true);
        });
        cy.get("@tuneSyllable").should("have.callCount", 4);
        cy.get("#errorText").should("not.be.visible");
    });

    it("reloads prepared syllables without loading the model", () => {
        cy.get("#play").click();
        cy.wrap(null, { timeout: 20000 }).should(() => expect(played).to.have.length(4));
        cy.reload();
        cy.waitForAppReady();
        cy.window().then(win => {
            win.widgetWindows.hideAllWindows();
            cy.stub(win.KokoroSpeech.prototype, "_ensureEngine")
                .rejects(new Error("Should not load the model"))
                .as("modelLoad");
        });
        cy.get("#play").click();
        cy.window().should(win =>
            expect(win.ActivityContext.getActivity().logo.synth.singingSamples.has("la")).to.equal(
                true
            )
        );
        cy.get("@modelLoad").should("not.have.been.called");
        cy.get("#errorText").should("not.be.visible");
    });

    ["everybeatdo", "everybeatdonew"].forEach(event => {
        it(`prepares and sings an action called only by ${event}`, () => {
            let loaded = false;
            cy.window().then(win =>
                win.pubsub.once("finishedLoading", () => {
                    loaded = true;
                })
            );
            cy.readFile("examples/kokoro-singing.tb").then(contents => {
                const project = JSON.parse(contents).slice(0, 13);
                project[12][4][1] = null;
                const note = JSON.parse(JSON.stringify(project.slice(4, 13))).map(row => [
                    row[0] + 14,
                    row[1],
                    0,
                    0,
                    row[4].map(id => (id === null ? null : id + 14))
                ]);
                note[0][4][0] = 16;
                project[0] = [0, "action", 560, 120, [null, 13, 14, null]];
                project[1][4][0] = 14;
                project[10][1][1].value = "mi";
                project.push(
                    [13, ["text", { value: "singit" }], 0, 0, [0]],
                    [14, "hidden", 0, 0, [0, 1]],
                    [15, "start", 280, 120, [null, 16, null]],
                    [16, event, 0, 0, [15, 17, 18]],
                    [17, ["text", { value: "singit" }], 0, 0, [16]],
                    ...note
                );
                cy.get("#load").click();
                cy.get("#myOpenFile").selectFile(
                    {
                        contents: Cypress.Buffer.from(JSON.stringify(project)),
                        fileName: "event-singing.tb"
                    },
                    { force: true }
                );
            });
            cy.wrap(null, { timeout: 30000 }).should(() => expect(loaded).to.equal(true));
            cy.get("#play").click();
            cy.wrap(null, { timeout: 20000 }).should(() => expect(played).to.include("E4"));
            cy.window().then(win => win.ActivityContext.getActivity().logo.doStopTurtles());
            cy.then(() => expect(generate).to.have.been.calledOnce);
            cy.get("#errorText").should("not.be.visible");
        });
    });

    it("Stop while Kokoro is preparing prevents late playback", () => {
        let release;
        cy.then(() => {
            const result = renderedAudio;
            generate.callsFake(
                () =>
                    new Promise(resolve => {
                        release = () => resolve(result);
                    })
            );
        });
        cy.get("#play").click();
        cy.wrap(null).should(() => expect(release).to.be.a("function"));
        cy.get("#stop").click();
        cy.then(() => release());
        cy.window().should(win => {
            const activity = win.ActivityContext.getActivity();
            expect(activity.logo._singingPreparation).to.equal(null);
            expect(activity.turtles.turtleList.some(t => t.running)).to.equal(false);
            expect(played).to.deep.equal([]);
        });
    });

    it("shows synthesis failures and can retry without reloading", () => {
        cy.then(() => generate.onFirstCall().rejects(new Error("Singing test: model unavailable")));
        cy.get("#play").click();
        cy.get("#errorText").should("contain.text", "model unavailable");
        cy.get("#play").should(button => expect(button[0].onclick).to.be.a("function"));
        cy.get("#play").click();
        cy.wrap(null, { timeout: 20000 }).should(() =>
            expect(played).to.deep.equal(["C4", "E4", "G4", "C5"])
        );
    });
});
