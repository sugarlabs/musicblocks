// Copyright (c) 2026 Music Blocks contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* global Cypress, cy */

const editor = "[data-multisample-editor]";
const activity = win => win.ActivityContext.getActivity();
const owners = win =>
    activity(win).blocks.blockList.filter(b => b && !b.trash && b.name === "multisample");
const wav = (frames = 800) => {
    const bytes = Cypress.Buffer.alloc(44 + frames * 2);
    bytes.write("RIFF");
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
    bytes.writeUInt32LE(frames * 2, 40);
    for (let i = 0; i < frames; i++)
        bytes.writeInt16LE(
            Math.round(14000 * Math.sin((2 * Math.PI * 130.8128 * i) / 8000)),
            44 + 2 * i
        );
    return bytes;
};
const upload = (contents = wav(), mimeType = "application/octet-stream") => {
    cy.get(editor + ' input[type="file"]').selectFile(
        { contents, fileName: "弦 <b>same</b>.wav", mimeType },
        { force: true }
    );
    cy.window().should(win => {
        const session = activity(win).multisampleEditor;
        expect(session.busy, session.status.textContent).to.equal(null);
    });
    cy.get(editor + " select")
        .last()
        .should("not.be.disabled");
};
const apply = () => {
    cy.contains(editor + " button", /^Apply$/).click();
    cy.window({ timeout: 40000 }).should(win => {
        expect(
            activity(win).multisampleEditor,
            activity(win).multisampleEditor?.status?.textContent
        ).to.equal(null);
    });
};
const reopen = (index = 0) => {
    cy.window().then(win => owners(win)[index].activate());
    cy.get(editor).should("be.visible");
};
const create = () => {
    cy.contains("button", "New multisample instrument…").click();
    upload();
    cy.get(editor + " select")
        .should("have.value", "")
        .select("C3");
    cy.get(editor + ' input[type="text"]')
        .clear()
        .type("弦 <b>Instrument</b>", { parseSpecialCharSequences: false });
    apply();
    cy.window().should(win => expect(owners(win)).to.have.length(1));
};

describe("Minimal multisample authoring", { testIsolation: true, retries: 0 }, () => {
    beforeEach(() => {
        const marker = "I09 Sampler " + Date.now() + " " + Math.random();
        cy.visit("http://127.0.0.1:3000", { onBeforeLoad: win => win.localStorage.clear() });
        cy.waitForAppReady();
        // Run a real Sampler block, rather than substituting the widget constructor.
        const project = [
            [0, "sampler", 250, 100, [null, 1, 2]],
            [1, "print", 0, 0, [0, 3, null]],
            [2, "hiddennoflow", 0, 0, [0, null]],
            [3, ["text", { value: marker }], 0, 0, [1]]
        ];
        cy.get("#myOpenFile").selectFile(
            { contents: Cypress.Buffer.from(JSON.stringify(project)), fileName: "editor.tb" },
            { force: true }
        );
        cy.window().should(win => {
            expect(activity(win).blocks.isLoading()).to.equal(false);
            expect(
                activity(win).blocks.blockList.some(
                    b => b && !b.trash && b.value === marker && b.loadComplete
                )
            ).to.equal(true);
            expect(owners(win)).to.have.length(0);
        });
        cy.window().then(win =>
            activity(win)
                .blocks.blockList.find(b => b && !b.trash && b.name === "sampler")
                .activate()
        );
        cy.contains("button", "New multisample instrument…", { timeout: 30000 }).should(
            "be.visible"
        );
        cy.window().should(win => {
            expect(activity(win).turtles.running()).to.equal(false);
            expect(activity(win).logo._synthsInitialized).to.equal(false);
        });
    });

    afterEach(() =>
        cy.window().then(win => {
            activity(win).multisampleEditor?.close();
            activity(win).logo?.doStopTurtles();
        })
    );

    it("creates exact embedded audio, reopens, edits, cancels and restores complete history", () => {
        create();
        let original;
        cy.window().then(win => {
            original = JSON.parse(JSON.stringify(owners(win)[0].value));
            expect(original.samples[0].data).to.equal(
                "data:audio/wav;base64," + wav().toString("base64")
            );
            expect(activity(win).blocks.actionHistory.at(-1).type).to.equal("restore");
            expect(activity(win).logo.synth.multisampleBytes).to.equal(0);
        });
        cy.get("body").trigger("keydown", { keyCode: 90, ctrlKey: true });
        cy.window().should(win => expect(owners(win)).to.have.length(0));
        cy.get("body").trigger("keydown", { keyCode: 89, ctrlKey: true });
        cy.window().should(win => expect(owners(win)[0].value).to.deep.equal(original));
        reopen();
        cy.get(editor + ' input[type="text"]')
            .clear()
            .type("Edited");
        cy.get(editor + " select").select("C4");
        apply();
        cy.window().then(win => {
            expect(owners(win)[0].value.name).to.equal("Edited");
            expect(owners(win)[0].value.samples[0].root).to.equal("C4");
        });
        cy.get("body").trigger("keydown", { keyCode: 90, ctrlKey: true });
        cy.window().should(win => expect(owners(win)[0].value).to.deep.equal(original));
        cy.get("body").trigger("keydown", { keyCode: 89, ctrlKey: true });
        cy.window().should(win => expect(owners(win)[0].value.name).to.equal("Edited"));
        reopen();
        cy.get(editor + ' input[type="text"]')
            .clear()
            .type("Discarded");
        cy.contains(editor + " button", /^Cancel$/).click();
        cy.contains(editor + " button", "Keep editing").should("be.focused");
        cy.contains(editor + " button", "Discard changes").click();
        cy.window().then(win => expect(owners(win)[0].value.name).to.equal("Edited"));
        reopen();
        let history;
        cy.window().then(win => {
            history = activity(win).blocks.actionHistory.length;
        });
        apply();
        cy.window().then(win =>
            expect(activity(win).blocks.actionHistory.length).to.equal(history)
        );
    });

    it("edits an ordinary independent copy without changing the authored original", () => {
        create();
        let original;
        cy.window().then(win => {
            original = JSON.parse(JSON.stringify(owners(win)[0].value));
            activity(win).blocks.activeBlock = owners(win)[0].connections[0];
        });
        cy.get("body").trigger("keydown", { keyCode: 67, altKey: true });
        cy.get("body").trigger("keydown", { keyCode: 86, altKey: true });
        cy.window().should(win => {
            expect(activity(win).blocks.isLoading()).to.equal(false);
            expect(owners(win)).to.have.length(2);
        });
        reopen(1);
        cy.get(editor + ' input[type="text"]')
            .clear()
            .type("Independent copy");
        cy.get(editor + " select").select("B8");
        apply();
        cy.window().then(win => {
            expect(owners(win)[0].value).to.deep.equal(original);
            expect(owners(win)[1].value.samples[0].root).to.equal("B8");
        });
        cy.get("body").trigger("keydown", { keyCode: 90, ctrlKey: true });
        cy.window().then(win =>
            expect(owners(win).map(b => b.value)).to.deep.equal([original, original])
        );
        cy.get("body").trigger("keydown", { keyCode: 89, ctrlKey: true });
        cy.window().then(win => expect(owners(win)[1].value.name).to.equal("Independent copy"));
    });

    it("plays a native round trip of the authored value through ordinary Set Instrument notes", () => {
        create();
        let expected;
        cy.window().then(win => {
            expected = JSON.parse(JSON.stringify(owners(win)[0].value));
            const project = JSON.parse(activity(win).prepareExport());
            const set = project.find(row => row[1] === "settimbre" || row[1]?.[0] === "settimbre");
            let tail;
            for (const pitch of ["C", "D", "E"]) {
                const n = project.length;
                if (tail === undefined) set[4][2] = n;
                else project[tail][4][1] = n;
                project.push(
                    [n, "newnote", 0, 0, [tail ?? set[0], n + 1, n + 4, n + 7]],
                    [n + 1, "divide", 0, 0, [n, n + 2, n + 3]],
                    [n + 2, ["number", { value: 1 }], 0, 0, [n + 1]],
                    [n + 3, ["number", { value: 16 }], 0, 0, [n + 1]],
                    [n + 4, "pitch", 0, 0, [n, n + 5, n + 6, null]],
                    [n + 5, ["notename", { value: pitch }], 0, 0, [n + 4]],
                    [n + 6, ["number", { value: 4 }], 0, 0, [n + 4]],
                    [n + 7, "hidden", 0, 0, [n, null]]
                );
                tail = n + 7;
            }
            const suffix = project.length;
            project[set[4][3]][4][1] = suffix;
            project.push(
                [suffix, ["storein2", { value: "i09done" }], 0, 0, [set[4][3], suffix + 1, null]],
                [suffix + 1, ["number", { value: 1 }], 0, 0, [suffix]]
            );
            cy.get("#myOpenFile").selectFile(
                {
                    contents: Cypress.Buffer.from(JSON.stringify(project)),
                    fileName: "authored-notes.tb"
                },
                { force: true }
            );
        });
        cy.window().should(win => {
            expect(activity(win).blocks.isLoading()).to.equal(false);
            expect(owners(win)[0].value).to.deep.equal(expected);
            expect(
                activity(win).blocks.blockList.filter(b => b && !b.trash && b.name === "newnote")
            ).to.have.length(3);
        });
        let attacks;
        cy.window().then(async win => {
            await win.Tone.start();
            attacks = cy.spy(win.Tone.Sampler.prototype, "triggerAttackRelease");
            activity(win)
                .blocks.blockList.find(b => b && !b.trash && b.name === "settimbre")
                .activate();
        });
        cy.window().should(win => expect(activity(win).logo.boxes.i09done).to.equal(1));
        cy.then(() => {
            expect(attacks).to.have.been.calledThrice;
            expect(attacks.args.map(args => args[0])).to.deep.equal(["C4", "D4", "E4"]);
        });
    });

    it("keeps same-file rows independent and identifies both duplicate roots", () => {
        cy.contains("button", "New multisample instrument…").click();
        upload();
        cy.get(editor + " select").select("C3");
        cy.get(editor + " select").should($select => {
            expect($select[0].getBoundingClientRect().width).to.be.greaterThan(100);
            expect($select[0].selectedOptions[0].textContent).to.equal("C3");
        });
        cy.contains(editor + " button", "Add recording…").click();
        upload();
        cy.get(editor + " select")
            .should("have.length", 2)
            .last()
            .should("not.be.disabled")
            .select("C3");
        cy.get(editor + ' select[aria-invalid="true"]').should("have.length", 2);
        cy.contains(editor + " button", /^Apply$/).should("be.disabled");
        cy.get(editor + " b").should("not.exist");
        cy.get(editor + " select")
            .last()
            .select("C4");
        apply();
        cy.window().then(win => expect(owners(win)[0].value.samples).to.have.length(2));
    });

    it("blocks execution when hidden and handles native select Escape before editor close", () => {
        create();
        reopen();
        cy.get(editor + " select")
            .focus()
            .trigger("keydown", { key: "Escape" });
        cy.get(editor).should("exist");
        cy.window().then(win => {
            const act = activity(win);
            const errors = cy.spy(act, "errorMsg");
            act.multisampleEditor.widgetWindow._rollup();
            act.logo.runLogoCommands();
            act.logo.step();
            expect(errors).to.have.been.calledWith("Finish or cancel instrument editing first.");
            expect(act.turtles.running()).to.equal(false);
            act.multisampleEditor.bringForward();
        });
        cy.get(editor + ' input[type="text"]')
            .focus()
            .trigger("keydown", { key: "Escape" });
        cy.get(editor).should("not.exist");
    });

    it("offers dirty project-switch choices and invalidates equal-value owner replacements", () => {
        create();
        reopen();
        cy.get(editor + ' input[type="text"]').type(" dirty");
        cy.window().then(win => {
            activity(win).multisampleEditor.widgetWindow._rollup();
            activity(win).projectManager.newProject();
        });
        cy.get(editor).should("be.visible");
        cy.contains(editor + " button", "Keep editing").should("be.focused");
        cy.contains(editor + " button", "Keep editing").click();
        cy.window().then(win =>
            owners(win)[0].setMultisampleValue(JSON.parse(JSON.stringify(owners(win)[0].value)))
        );
        cy.contains(editor + " button", /^Apply$/).should("be.disabled");
        cy.get(editor + '[role="status"]').should("not.exist");
        cy.get(editor + ' [role="status"]').should("contain.text", "changed or was removed");
        cy.contains(editor + " button", /^Cancel$/).click();
        cy.contains(editor + " button", "Discard changes").click();
    });

    it("retains applied audio after storage failure and allows native export and explicit retry", () => {
        let save;
        let errors;
        cy.window().then(win => {
            const act = activity(win);
            save = cy
                .stub(act.planet.planet.ProjectStorage, "saveLocally")
                .rejects(new win.DOMException("full", "QuotaExceededError"));
            errors = cy.spy(act, "textMsg");
        });
        create();
        cy.window().then(win => {
            expect(errors).to.have.been.calledWithMatch("local saving failed");
            expect(
                JSON.parse(activity(win).prepareExport()).some(b => b[1]?.[0] === "multisample")
            ).to.equal(true);
            expect(owners(win)[0].value.samples[0].data).to.equal(
                "data:audio/wav;base64," + wav().toString("base64")
            );
            save.restore();
            return activity(win).saveLocally({ rejectOnProjectSaveError: true });
        });
    });

    it("rejects undecodable recordings atomically and remains usable at a small window size", () => {
        cy.viewport(480, 600);
        cy.contains("button", "New multisample instrument…").click();
        upload(Cypress.Buffer.from("RIFF0000WAVE"), "audio/wav");
        cy.get(editor + " select").select("C3");
        cy.get(editor).then($root => {
            const rect = $root[0].getBoundingClientRect();
            const win = $root[0].ownerDocument.defaultView;
            expect(rect.left).to.be.at.least(0);
            expect(rect.right).to.be.at.most(win.innerWidth);
        });
        cy.get(editor).should("be.visible").screenshot("i09-small-editor");
        cy.contains(editor + " button", /^Apply$/).click();
        cy.get(editor + ' [role="status"]').should("contain.text", "Unable to decode recording");
        cy.window().then(win => {
            expect(owners(win)).to.have.length(0);
            expect(activity(win).logo.synth.multisampleBytes).to.equal(0);
        });
        cy.contains(editor + " button", /^Cancel$/)
            .scrollIntoView()
            .should("be.visible")
            .click();
        cy.contains(editor + " button", "Discard changes").click();
    });

    it("offers a dirty choice before a native project drop replaces any blocks", () => {
        create();
        reopen();
        cy.get(editor + ' input[type="text"]').type(" dirty");
        const project = [
            [0, "start", 200, 100, [null, null, null]],
            [1, ["text", { value: "I09 drop replacement" }], 300, 100, [null]]
        ];
        const drop = () =>
            cy.get("#myCanvas").selectFile(
                {
                    contents: Cypress.Buffer.from(JSON.stringify(project)),
                    fileName: "dropped.tb"
                },
                { action: "drag-drop", force: true }
            );
        drop();
        cy.contains(editor + " button", "Keep editing")
            .should("be.focused")
            .click();
        cy.window().then(win => {
            expect(owners(win)).to.have.length(1);
            expect(activity(win).loading).to.equal(false);
        });
        drop();
        cy.contains(editor + " button", "Discard changes").click();
        cy.window().should(win => {
            expect(activity(win).blocks.isLoading()).to.equal(false);
            expect(
                activity(win).blocks.blockList.some(
                    b => b && !b.trash && b.value === "I09 drop replacement"
                )
            ).to.equal(true);
            expect(owners(win)).to.have.length(0);
        });
    });

    it("pauses an actually playing legacy upload without importing its audio or cents", () => {
        const samplerFrame = '.windowFrame[aria-label="sampler"]';
        cy.get(samplerFrame + ' [aria-label="Upload sample"]').click();
        cy.get("#myOpenAll").selectFile(
            { contents: wav(24000), fileName: "legacy.wav", mimeType: "audio/wav" },
            { force: true }
        );
        cy.window().should(win =>
            expect(activity(win).logo.sample.sampleName).to.equal("legacy.wav")
        );
        cy.get(samplerFrame + ' [aria-label="Cents adjustment"]').click();
        cy.get("#centAdjustmentContainer input[type=range]").invoke("val", 37).trigger("input");
        cy.window().then(win => win.Tone.start());
        let release;
        let meter;
        cy.get(samplerFrame + ' [aria-label="Play"]').click();
        cy.window().should(win => expect(activity(win).logo.sample.player).to.exist);
        cy.window().then(win => {
            const player = activity(win).logo.sample.player;
            meter = new win.Tone.Analyser("waveform", 1024);
            player.connect(meter);
            release = cy.spy(player, "releaseAll");
        });
        const peak = () => Math.max(...Array.from(meter.getValue(), Math.abs));
        cy.window().should(() => expect(peak()).to.be.greaterThan(0.002));
        cy.contains("button", "New multisample instrument…").click();
        cy.then(() => expect(release).to.have.been.calledOnce);
        cy.window().should(() => expect(peak()).to.be.lessThan(0.002));
        cy.window().then(win => {
            const act = activity(win);
            expect(act.logo.sample.centAdjustmentValue).to.equal(37);
            expect(act.logo.sample.sampleName).to.equal("legacy.wav");
            expect(act.logo.sample.sampleData).to.equal(
                "data:audio/wav;base64," + wav(24000).toString("base64")
            );
            expect(act.multisampleEditor.draft.samples).to.have.length(0);
            expect(act.multisampleEditor.draft).not.to.have.property("cents");
            meter.dispose();
        });
        cy.contains(editor + " button", /^Cancel$/).click();
        cy.window().then(win => {
            expect(activity(win).logo.sample.isMoving).to.equal(false);
            expect(activity(win).logo.sample.widgetWindow.getWidgetFrame().inert).to.equal(false);
        });
    });

    it("abandons a legacy audition held by Tone's real loading queue without a late restart", () => {
        const samplerFrame = '.windowFrame[aria-label="sampler"]';
        cy.get(samplerFrame + ' [aria-label="Upload sample"]').click();
        cy.get("#myOpenAll").selectFile(
            { contents: wav(24000), fileName: "held.wav", mimeType: "audio/wav" },
            { force: true }
        );
        cy.window().should(win =>
            expect(activity(win).logo.sample.sampleName).to.equal("held.wav")
        );
        let release;
        let loading;
        let buffer;
        let attacks;
        cy.window().then(async win => {
            await win.Tone.start();
            const fetch = win.fetch.bind(win);
            cy.stub(win, "fetch").callsFake((url, ...rest) => {
                if (!String(url).includes("i09-held.wav")) return fetch(url, ...rest);
                return new win.Promise(resolve => {
                    release = () =>
                        resolve(new win.Response(new Uint8Array(wav()), { status: 200 }));
                });
            });
            buffer = new win.Tone.ToneAudioBuffer();
            loading = buffer.load("/i09-held.wav");
            attacks = cy.spy(win.Tone.Sampler.prototype, "triggerAttackRelease");
        });
        cy.get(samplerFrame + ' [aria-label="Play"]').click();
        cy.window().should(win => {
            expect(activity(win).logo.sample.player).to.exist;
            expect(release).to.be.a("function");
        });
        cy.contains("button", "New multisample instrument…").click();
        cy.then(async () => {
            release();
            await loading;
            for (let i = 0; i < 8; i++) await Promise.resolve();
            expect(attacks).not.to.have.been.called;
            buffer.dispose();
        });
        cy.contains(editor + " button", /^Cancel$/).click();
        cy.get(samplerFrame + ' [aria-label="Play"]').click();
        cy.window().should(() => expect(attacks).to.have.been.called);
    });
});
