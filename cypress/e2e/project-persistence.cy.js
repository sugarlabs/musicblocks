describe("Multisample value persistence", { testIsolation: true, retries: 0 }, () => {
    const wav = () => {
        const bytes = new Uint8Array(108);
        const view = new DataView(bytes.buffer);
        const text = (offset, value) =>
            [...value].forEach((c, i) => {
                bytes[offset + i] = c.charCodeAt(0);
            });
        text(0, "RIFF");
        view.setUint32(4, 100, true);
        text(8, "WAVEfmt ");
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, 8000, true);
        view.setUint32(28, 16000, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        text(36, "data");
        view.setUint32(40, 64, true);
        for (let i = 0; i < 32; i++) view.setInt16(44 + i * 2, Math.sin(i) * 16000, true);
        return "data:audio/wav;base64," + Cypress.Buffer.from(bytes).toString("base64");
    };
    const value = () => ({
        type: "multisample",
        version: 1,
        name: "弦 <b>same</b> & strings",
        samples: [
            { name: "same.wav", root: "C3", data: wav() },
            { name: "same.wav", root: "C4", data: wav().replace("audio/wav", "audio/x-pn-wav") }
        ]
    });
    const unknown = () => ({ ...value(), version: 99, extra: { future: [1, "<data>", null] } });
    const invalid = () => ({
        ...value(),
        samples: [{ name: "broken.wav", root: "C3", data: "bad" }],
        extra: [1]
    });
    const project = () => [
        [0, "settimbre", 200, 100, [null, 1, null, 2]],
        [1, ["multisample", { value: value() }], 0, 0, [0]],
        [2, "hidden", 0, 0, [0, null]],
        [3, ["multisample", { value: unknown() }], 200, 200, [null]],
        [4, ["multisample", { value: invalid() }], 200, 300, [null]],
        [
            5,
            ["customsample", { value: ["old4", wav(), "do", 3] }],
            200,
            400,
            [null, null, null, null]
        ],
        [
            6,
            ["customsample", { value: ["old5", wav(), "la", 4, 37] }],
            200,
            500,
            [null, null, null, null]
        ],
        [7, "start", 400, 100, [null, null]]
    ];
    const instruments = win =>
        win.ActivityContext.getActivity().blocks.blockList.filter(
            block => block && !block.trash && block.name === "multisample"
        );
    const waitForValues = (count = 3) => {
        cy.window({ timeout: 60000 }).should(win => {
            const activity = win.ActivityContext.getActivity();
            expect(activity.blocks.isLoading()).to.equal(false);
            expect(instruments(win)).to.have.length(count);
        });
    };
    const importFile = (data, fileName = "multisample.tb") => {
        cy.get("#myOpenFile").selectFile(
            {
                contents: Cypress.Buffer.from(data),
                fileName,
                mimeType: "application/octet-stream"
            },
            { force: true }
        );
    };
    const verify = () =>
        cy.window().then(win => {
            const blocks = instruments(win);
            expect(blocks.map(block => block.value)).to.deep.equal([value(), unknown(), invalid()]);
            expect(blocks.map(block => block.text.text)).to.deep.equal([
                value().name,
                "Unsupported instrument: " + value().name,
                "Invalid instrument: " + value().name
            ]);
            expect(
                win.document.querySelector("#accessible-block-" + blocks[0].blockIndex + " b")
            ).to.equal(null);
            const legacy = win.ActivityContext.getActivity().blocks.blockList.filter(
                block => block && !block.trash && block.name === "customsample"
            );
            expect(legacy.map(block => block.value)).to.deep.equal([
                ["old4", wav(), "do", 3],
                ["old5", wav(), "la", 4, 37]
            ]);
            blocks[0].value.samples.forEach((sample, i) => {
                expect(win.atob(sample.data.split(",")[1])).to.equal(
                    atob(value().samples[i].data.split(",")[1])
                );
            });
        });

    beforeEach(() => {
        cy.visit("http://127.0.0.1:3000");
        cy.waitForAppReady();
        importFile(JSON.stringify(project()));
        waitForValues();
    });

    it("retains exact WAVs and opaque JSON through native, session and HTML reopening", () => {
        verify();
        cy.window().then(win => win.ActivityContext.getActivity().__saveLocally());
        cy.reload();
        cy.waitForAppReady();
        waitForValues();
        verify();
        cy.window().then(win => {
            const activity = win.ActivityContext.getActivity();
            activity.logo.synth.disposeAllInstruments();
            importFile(activity.prepareExport(), "reopened.tb");
        });
        waitForValues();
        verify();
        cy.window().then(win =>
            importFile(win.ActivityContext.getActivity().save.prepareHTML(), "reopened.html")
        );
        waitForValues();
        verify();
    });

    it("keeps copies, append, saved custom stacks, replacement and history independent", () => {
        cy.window().then(win => {
            const activity = win.ActivityContext.getActivity();
            const blocks = activity.blocks;
            blocks.selectedStack = instruments(win)[0].connections[0];
            const copied = blocks._copyBlocksToObj(false);
            blocks.loadNewBlocks(copied);
        });
        waitForValues(4);
        cy.window().then(win => {
            const activity = win.ActivityContext.getActivity();
            const blocks = activity.blocks;
            const [original, , , copy] = instruments(win);
            const edited = JSON.parse(JSON.stringify(original.value));
            edited.name = "edited";
            edited.samples.reverse();
            original.setMultisampleValue(edited, true);
            expect(copy.value).to.deep.equal(value());
            edited.samples[0].name = "draft change";
            expect(original.value.samples[0].name).to.equal("same.wav");
            blocks.undoAction();
            expect(original.value).to.deep.equal(value());
            expect(original.text.text).to.equal(value().name);
            blocks.redoAction();
            expect(original.value.name).to.equal("edited");
            expect(original.text.text).to.equal("edited");
            blocks.undoAction();
            blocks.selectedStack = copy.connections[0];
            blocks.saveStack();
            const macros = JSON.parse(activity.storage.macros);
            const saved = Object.values(macros).find(stack =>
                stack.some(row => row[1]?.[0] === "multisample")
            );
            expect(saved).to.exist;
            blocks.loadNewBlocks(saved);
        });
        waitForValues(5);
        cy.window().then(win => {
            const activity = win.ActivityContext.getActivity();
            const blocks = activity.blocks;
            const savedCopy = instruments(win)[4];
            const top = savedCopy.connections[0];
            // Existing creation history is explicit, rather than automatic in loadNewBlocks.
            blocks.actionHistory.push({ type: "restore", blockId: top });
            blocks.undoAction();
            expect(savedCopy.trash).to.equal(true);
            blocks.redoAction();
            expect(savedCopy.trash).to.equal(false);
            expect(savedCopy.value).to.deep.equal(value());
            blocks.sendStackToTrash(blocks.blockList[top]);
            blocks.undoAction();
            expect(savedCopy.trash).to.equal(false);
            expect(savedCopy.value).to.deep.equal(value());
            activity.merging = true;
            importFile(JSON.stringify(project()), "append.tb");
        });
        waitForValues(8);
        cy.window().then(win => {
            const values = instruments(win);
            expect(values.slice(5).map(block => block.value)).to.deep.equal([
                value(),
                unknown(),
                invalid()
            ]);
            values[0].setMultisampleValue({ ...value(), name: "one owner" }, true);
            expect(values[3].value).to.deep.equal(value());
            expect(values[4].value).to.deep.equal(value());
            expect(values[5].value).to.deep.equal(value());
        });
    });

    it("retains saved WAVs after native decode and controlled PCM admission failures", () => {
        cy.window().then({ timeout: 60000 }, async win => {
            const activity = win.ActivityContext.getActivity();
            const synth = activity.logo.synth;
            const block = instruments(win)[0];
            const undecodable = value();
            undecodable.samples[0].data = "data:audio/wav;base64,UklGRgQAAABXQVZF";
            let decode;
            for (const [descriptor, message] of [
                [undecodable, /recording/i],
                [value(), /limit/i]
            ]) {
                if (message.source === "limit") {
                    const context = win.Tone.getContext().rawContext;
                    decode = cy.stub(win.Tone.ToneAudioBuffer, "load");
                    decode
                        .onFirstCall()
                        .resolves(context.createBuffer(1, 4194304, context.sampleRate));
                    decode
                        .onSecondCall()
                        .resolves(context.createBuffer(1, 4194305, context.sampleRate));
                }
                block.setMultisampleValue(descriptor);
                const saved = activity.prepareExport();
                const handle = synth.registerMultisample(block.value);
                let failure;
                try {
                    await synth.loadSynth(0, handle, handle);
                } catch (error) {
                    failure = error;
                }
                expect(failure?.message).to.match(message);
                expect(synth.multisampleBytes).to.equal(0);
                expect(activity.prepareExport()).to.equal(saved);
                expect(block.value).to.deep.equal(descriptor);
                synth.disposeAllInstruments();
            }
            decode.restore();
            block.setMultisampleValue(value());
            const handle = synth.registerMultisample(block.value);
            await synth.loadSynth(0, handle, handle);
            expect(block.value).to.deep.equal(value());
            synth.disposeAllInstruments();
        });
    });

    it("keeps saved audio through a preparation deadline and storage failure", () => {
        let result;
        let descriptor;
        let owner;
        let decode;
        cy.clock(null, ["setTimeout", "clearTimeout"]);
        cy.window().then(win => {
            const activity = win.ActivityContext.getActivity();
            owner = instruments(win)[0];
            descriptor = JSON.stringify(owner.value);
            decode = cy.stub(win.Tone.ToneAudioBuffer, "load").returns(new Promise(() => {}));
            const handle = activity.logo.synth.registerMultisample(owner.value);
            result = activity.logo.synth.loadSynth(0, handle, handle).catch(error => error);
        });
        cy.tick(30001);
        cy.then(() => result).then(error => {
            expect(error.message).to.include("timed out");
            expect(JSON.stringify(owner.value)).to.equal(descriptor);
            decode.restore();
        });
        cy.window().then(async win => {
            const activity = win.ActivityContext.getActivity();
            const saved = activity.prepareExport();
            const storage = activity.planet.planet.ProjectStorage;
            const message = cy.spy(activity, "textMsg");
            const save = cy
                .stub(storage, "saveLocally")
                .rejects(new win.DOMException("full", "QuotaExceededError"));
            expect(await activity.saveLocally()).to.equal(false);
            expect(activity.prepareExport()).to.equal(saved);
            expect(JSON.stringify(owner.value)).to.equal(descriptor);
            expect(message).to.have.been.calledWithMatch("Retry saving or export");
            save.restore();
            await activity.saveLocally();
        });
    });

    it("preserves opaque values on actual argument use without decoding or registration", () => {
        cy.window().then(win => {
            const activity = win.ActivityContext.getActivity();
            const decode = cy.spy(win.Tone.ToneAudioBuffer, "load");
            const register = cy.spy(activity.logo.synth, "registerMultisample");
            for (const block of instruments(win).slice(1)) {
                const before = JSON.stringify(block.value);
                activity.logo.stopTurtle = false;
                activity.logo.parseArg(activity.logo, 0, block.blockIndex, null, null);
                expect(activity.logo.stopTurtle).to.equal(true);
                expect(JSON.stringify(block.value)).to.equal(before);
            }
            expect(decode).not.to.have.been.called;
            expect(register).not.to.have.been.called;
        });
    });

    for (const [name, payload] of [
        ["missing type", { version: 1, name: "broken", extra: [1] }],
        ["wrong type", { type: "other", version: 1, extra: [2] }],
        ["array", ["not a legacy sample", "bad audio"]],
        ["null", null]
    ]) {
        it("refuses an opaque " + name + " in an actual Set Instrument run", () => {
            let block;
            let loads;
            let prepare;
            cy.window().then(win => {
                const activity = win.ActivityContext.getActivity();
                block = instruments(win)[0];
                block.setMultisampleValue(payload);
                loads = cy.spy(activity.logo.synth, "loadSynth");
                prepare = cy.spy(activity.logo.synth, "getPreparedMultisample");
                activity.logo.runLogoCommands(block.connections[0]);
            });
            cy.window().should(win => {
                expect(win.ActivityContext.getActivity().logo.stopTurtle).to.equal(true);
                expect(block.value).to.deep.equal(payload);
                expect(prepare).not.to.have.been.called;
                expect(
                    loads.args.some(args => String(args[1]).startsWith("customsample_"))
                ).to.equal(false);
            });
        });
    }
});

describe("Project persistence", () => {
    // #load-container hides as soon as parsing/creation starts, before every block
    // has finished its own asynchronous setup (image bitmaps, docks, etc.), and
    // right after a reload blocks._loadCounter (js/blocks.js) briefly still holds
    // its pre-load default of 0 before the session-restore even begins. It's also
    // not strictly monotonic: the file-load handler (js/project-manager.js) defers
    // blocks.loadNewBlocks() behind a "trashsignal" event whose dispatch is itself
    // setTimeout-scheduled, so a stray pending dispatch can occasionally trigger a
    // second load pass shortly after the first one finishes, briefly resetting
    // _loadCounter back up. Requiring the "fully loaded" signal (_loadCounter at 0
    // and pi.tb's distinctive loadFile block present) to hold for several
    // consecutive retries -- not just once -- filters out both the "not started
    // yet" state and this transient re-load window, using only Cypress's own
    // retry polling rather than an arbitrary wait.
    const waitForPiFullyLoaded = () => {
        let stableObservations = 0;
        cy.window({ timeout: 60000 }).should(win => {
            const { blocks } = win.ActivityContext.getActivity();
            const nonTrash = blocks.blockList.filter(block => !block.trash);
            const fullyLoaded =
                blocks._loadCounter === 0 && nonTrash.some(block => block.name === "loadFile");
            stableObservations = fullyLoaded ? stableObservations + 1 : 0;
            expect(
                stableObservations,
                "pi.tb's fully-loaded state should hold across repeated checks"
            ).to.be.at.least(3);
        });
    };

    // "start"/"drum" hat blocks store the owning turtle's index as .value, which
    // depends on turtle-creation order/history rather than the project's own
    // content (js/project-manager.js's prepareExport() doesn't even export .value
    // for these blocks -- it exports id/xcor/ycor/etc. instead). Normalizing it
    // out avoids a false mismatch between a fresh load (which may land on a turtle
    // index left over from an earlier default project) and a clean session restore.
    const captureBlockState = win => {
        const { blockList } = win.ActivityContext.getActivity().blocks;
        return blockList
            .filter(block => !block.trash)
            .map(block => ({
                name: block.name,
                value: ["start", "drum"].includes(block.name) ? null : block.value
            }))
            .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    };

    before(() => {
        // Visit first so localStorage is cleared on the Music Blocks origin itself,
        // then reload so the app initializes against a genuinely clean persistence
        // state rather than whatever a previous test session left behind.
        cy.visit("http://127.0.0.1:3000");
        cy.clearLocalStorage();
        cy.reload();
        cy.waitForAppReady();
    });

    it("restores a loaded project's blocks after a page reload", () => {
        cy.get("#load").click();
        cy.get("#myOpenFile").selectFile("cypress/fixtures/pi.tb", { force: true });

        cy.get("#load-container").should("be.visible");
        cy.get("#load-container", { timeout: 30000 }).should("not.be.visible");
        cy.get("#errorText").should("not.be.visible");

        waitForPiFullyLoaded();

        let blockStateBeforeReload = [];
        cy.window().then(win => {
            blockStateBeforeReload = captureBlockState(win);
        });

        // Reloading fires the app's own beforeunload handler (js/activity.js), which
        // synchronously calls ProjectManager.saveLocally() to write the current project
        // to localStorage under "SESSION<project>". On the next load, Activity.init()
        // (js/project-manager.js) reads that same key and restores the blocks via
        // blocks.loadNewBlocks(). This is the app's real persistence path: the toolbar
        // "Save" button (js/toolbar-ui.js) only exports HTML/PNG and never writes
        // session data, so it cannot be used to trigger this workflow.
        cy.reload();
        cy.waitForAppReady();

        // Restoring from session data goes through the same chunked, asynchronous
        // block-creation path as a fresh load, so it needs the same completion check.
        waitForPiFullyLoaded();

        cy.window().should(win => {
            expect(
                captureBlockState(win),
                "restored blocks should match the pre-reload stack"
            ).to.deep.equal(blockStateBeforeReload);
        });
    });

    // A note's last dock leads to its hidden block, whose last dock leads to the next note.
    const clampedNotes = win => {
        const { blockList } = win.ActivityContext.getActivity().blocks;
        const notes = [];
        let blk = blockList.find(block => !block.trash && block.name === "duplicatenotes")
            ?.connections[2];
        while (blk !== null && blk !== undefined) {
            const block = blockList[blk];
            if (block.name === "newnote") notes.push(blk);
            blk = block.connections[block.connections.length - 1];
        }
        return notes;
    };

    const waitForClampLoaded = () => {
        let stableObservations = 0;
        cy.window({ timeout: 60000 }).should(win => {
            const { blocks } = win.ActivityContext.getActivity();
            stableObservations =
                blocks._loadCounter === 0 && clampedNotes(win).length > 0
                    ? stableObservations + 1
                    : 0;
            expect(
                stableObservations,
                "the duplicate notes project should stay fully loaded"
            ).to.be.at.least(3);
        });
    };

    it("keeps a duplicate notes clamp whole when the page reloads while it plays", () => {
        cy.get("#load").click();
        cy.get("#myOpenFile").selectFile("cypress/fixtures/duplicate-notes-minimal.tb", {
            force: true
        });
        cy.get("#load-container", { timeout: 30000 }).should("not.be.visible");
        waitForClampLoaded();
        cy.window().then(win => {
            expect(clampedNotes(win)).to.have.length(3);
        });

        // The clamp unhooks its notes into logo.connectionStore while it plays.
        cy.get("#play").click();
        cy.window({ timeout: 10000 }).should(win => {
            const { connectionStore } = win.ActivityContext.getActivity().logo;
            expect(
                Object.values(connectionStore).some(store => Object.keys(store).length > 0),
                "the duplicate notes clamp should be playing"
            ).to.be.true;
        });

        cy.reload();
        cy.waitForAppReady();
        waitForClampLoaded();

        cy.window().should(win => {
            expect(clampedNotes(win), "the clamp should keep its notes").to.have.length(3);
        });
    });
});
