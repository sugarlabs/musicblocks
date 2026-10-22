/**
 * Copyright (C) 2026 Music Blocks contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/* global Cypress, cy, beforeEach, afterEach, describe, expect, it */

const dialog = '[role="dialog"][aria-label="sampler"]';
const button = label => `${dialog} [role="button"][aria-label="${label}"]`;

// A valid 0.1-second, mono PCM WAV keeps the test independent of microphones,
// network samples, and recordings supplied by the developer.
const makeWav = () => {
    const bytes = Cypress.Buffer.alloc(1644);
    bytes.write("RIFF", 0);
    bytes.writeUInt32LE(bytes.length - 8, 4);
    bytes.write("WAVEfmt ", 8);
    bytes.writeUInt32LE(16, 16);
    bytes.writeUInt16LE(1, 20);
    bytes.writeUInt16LE(1, 22);
    bytes.writeUInt32LE(8000, 24);
    bytes.writeUInt32LE(16000, 28);
    bytes.writeUInt16LE(2, 32);
    bytes.writeUInt16LE(16, 34);
    bytes.write("data", 36);
    bytes.writeUInt32LE(1600, 40);
    for (let i = 0; i < 800; i++) {
        bytes.writeInt16LE(Math.round(4000 * Math.sin((2 * Math.PI * 440 * i) / 8000)), 44 + 2 * i);
    }
    return bytes;
};

const upload = (contents, fileName = "tone.wav", mimeType = "audio/wav") => {
    cy.get(button("Upload sample")).click();
    cy.get("#myOpenAll").selectFile({ contents, fileName, mimeType }, { force: true });
};

const sampleBlocks = win =>
    win.ActivityContext.getActivity().blocks.blockList.filter(
        block => !block.trash && block.name === "customsample"
    );

describe("Sampler upload and save", { retries: 0 }, () => {
    beforeEach(() => {
        cy.clearLocalStorage();
        cy.visit("http://127.0.0.1:3000");
        cy.waitForAppReady();
        cy.get("body").then($body => {
            const close = $body.find(
                '[role="dialog"][aria-label="help"] [aria-label="Close window"]'
            );
            if (close.length) cy.wrap(close).click();
        });

        cy.get("#load").click();
        cy.get("#myOpenFile").selectFile("cypress/fixtures/sampler-minimal.tb", { force: true });
        let stableObservations = 0;
        cy.window({ timeout: 30000 }).should(win => {
            const { blocks } = win.ActivityContext.getActivity();
            const loaded =
                blocks._loadCounter === 0 &&
                blocks.blockList.some(block => !block.trash && block.name === "sampler");
            stableObservations = loaded ? stableObservations + 1 : 0;
            expect(stableObservations, "Sampler fixture remains loaded").to.be.at.least(5);
        });
        cy.get("#load-container", { timeout: 30000 }).should("not.be.visible");
        cy.get("#errorText").should("not.be.visible");
        cy.get("#play").click();
        cy.get(dialog, { timeout: 30000 }).should("be.visible");
        cy.window().should(win => {
            expect(win.ActivityContext.getActivity().turtles.running(), "launch stack finished").to
                .be.false;
        });
    });

    afterEach(() => {
        cy.get("body").then($body => {
            if ($body.find("#stop").length) cy.get("#stop").click({ force: true });
            const close = $body.find(button("Close window"));
            if (close.length) cy.wrap(close).click({ force: true });
        });
    });

    it("saves the uploaded audio and cent adjustment in a usable instrument stack", () => {
        const wav = makeWav();
        const dataUrl = `data:audio/wav;base64,${wav.toString("base64")}`;
        upload(wav);
        cy.window().should(win => {
            expect(win.ActivityContext.getActivity().logo.sample.sampleData).to.equal(dataUrl);
        });

        cy.get(button("Cents adjustment")).click();
        cy.get('#centAdjustmentContainer input[type="range"]').invoke("val", 25).trigger("input");
        cy.get("#centValueDisplay").should("have.text", "+25¢");
        cy.get(button("Save sample")).click();

        cy.window({ timeout: 30000 }).should(win => {
            const samples = sampleBlocks(win);
            expect(samples).to.have.length(2);
            const saved = samples.find(block => block.value[0] === "tone.wav");
            expect(saved, "generated sample").to.exist;
            expect(saved.value).to.deep.equal(["tone.wav", dataUrl, "do", 4, 25]);
            const { blockList } = win.ActivityContext.getActivity().blocks;
            expect(blockList[saved.connections[0]].name).to.equal("settimbre");
            expect(blockList[saved.connections[1]].value).to.deep.equal(["tone.wav", dataUrl]);
            expect(blockList[saved.connections[2]].value).to.equal("do");
            expect(blockList[saved.connections[3]].value).to.equal(4);
        });
        cy.get("#errorText").should("not.be.visible");
    });

    it("rejects a non-WAV file without replacing the previously accepted sample", () => {
        const wav = makeWav();
        const dataUrl = `data:audio/wav;base64,${wav.toString("base64")}`;
        upload(wav);
        cy.window().should(win => {
            expect(win.ActivityContext.getActivity().logo.sample.sampleData).to.equal(dataUrl);
        });
        upload(Cypress.Buffer.from("not an audio sample"), "invalid.txt", "text/plain");
        cy.get("#errorText").should("be.visible").and("contain.text", "Sample is not a .wav file");
        cy.window().should(win => {
            const sample = win.ActivityContext.getActivity().logo.sample;
            expect(sample.sampleName).to.equal("tone.wav");
            expect(sample.sampleData).to.equal(dataUrl);
            expect(sampleBlocks(win)).to.have.length(1);
        });
    });

    it("detaches the closed widget and can upload and save after reopening", () => {
        cy.get(dialog).then($frame => {
            cy.get(button("Close window")).click();
            cy.wrap(null).should(() => {
                expect(Cypress.dom.isAttached($frame[0])).to.be.false;
            });
        });
        cy.get(dialog).should("not.exist");
        // The toolbar temporarily removes its click handler after a launch.
        cy.get("#play")
            .should($play => expect($play[0].onclick, "Play handler restored").to.be.a("function"))
            .click();
        cy.get(dialog, { timeout: 30000 }).should("have.length", 1).and("be.visible");
        const wav = makeWav();
        upload(wav, "reopened.wav");
        cy.window().should(win => {
            expect(win.ActivityContext.getActivity().logo.sample.sampleName).to.equal(
                "reopened.wav"
            );
        });
        cy.get(button("Save sample")).click();
        cy.window({ timeout: 30000 }).should(win => {
            const saved = sampleBlocks(win).filter(block => block.value[0] === "reopened.wav");
            expect(saved).to.have.length(1);
            expect(saved[0].value[1]).to.equal(`data:audio/wav;base64,${wav.toString("base64")}`);
        });
        cy.get("#errorText").should("not.be.visible");
    });
});
