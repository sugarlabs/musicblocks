// Copyright (c) 2026 Music Blocks contributors
//
// This program is free software; you can redistribute it and/or modify it
// under the GNU Affero General Public License, version 3 or later.
// See COPYING or https://www.gnu.org/licenses/ for details.

/* global cy, describe, it, beforeEach, expect */

describe("Kokoro Sing block", () => {
    let generate;
    let played;
    let renderedAudio;

    beforeEach(() => {
        played = [];
        cy.visit("http://127.0.0.1:3000");
        cy.waitForAppReady();
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
        cy.get("#errorText").should("not.be.visible");
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
        cy.wait(1000);
        cy.then(() => expect(played).to.deep.equal([]));
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
