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

describe("Multisample unsupported destinations", { testIsolation: true, retries: 0 }, () => {
    const value = (type = "") => ({
        type: "multisample",
        version: 1,
        name: "弦 <b>Strings</b> $& $1 " + type,
        samples: [
            {
                name: "C4.wav",
                root: "C4",
                data: "data:audio/wav;base64,UklGRmQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YUAAAAAAAJc01DjRCLTQEsSK7g8p1T3BGQDegcF33kIa6T2kKALu6sMR0V4JDzlKNHP/Hctnx7v3qC/GO+4QhtZAwsDm"
            }
        ]
    });
    // The saved value goes through a box and an action before Set Instrument uses it.
    const project = type => [
        [0, "start", 300, 100, [null, 1, null]],
        [1, ["storein2", { value: "voice" }], 0, 0, [0, 2, 3]],
        [2, ["multisample", { value: value(type) }], 0, 0, [1]],
        [3, type, 0, 0, type === "timbre" ? [1, 12, 4, 5] : [1, 4, 5]],
        [4, ["nameddo", { value: "choose" }], 0, 0, [3, null]],
        [5, "hiddennoflow", 0, 0, [3, null]],
        [6, "action", 600, 100, [null, 7, 8, null]],
        [7, ["text", { value: "choose" }], 0, 0, [6]],
        [8, "settimbre", 0, 0, [6, 9, 10, 11]],
        [9, ["namedbox", { value: "voice" }], 0, 0, [8]],
        [10, "print", 0, 0, [8, 13, null]],
        [11, "hidden", 0, 0, [8, null]],
        [12, ["text", { value: "custom" }], 0, 0, type === "timbre" ? [3] : [null]],
        [13, ["text", { value: "unexpected child output" }], 0, 0, [10]]
    ];
    const load = data => {
        cy.get("#myOpenFile").selectFile(
            {
                contents: Cypress.Buffer.from(JSON.stringify(data)),
                fileName: "safeguard.tb",
                mimeType: "application/octet-stream"
            },
            { force: true }
        );
        cy.window().should(win => {
            const activity = win.ActivityContext.getActivity();
            expect(activity.blocks.isLoading()).to.equal(false);
            const owners = activity.blocks.blockList.filter(
                b => !b.trash && b.name === "multisample"
            );
            expect(owners).to.have.length(1);
            expect(owners[0].value.name).to.equal(data[2][1][1].value.name);
            expect(activity.blocks.blockList.some(b => !b.trash && b.name === data[3][1])).to.equal(
                true
            );
        });
    };
    beforeEach(() => {
        cy.visit("http://127.0.0.1:3000", {
            onBeforeLoad(win) {
                win.localStorage.clear();
            }
        });
        cy.waitForAppReady();
    });

    for (const [type, key, constructor, module, destination] of [
        ["matrix", "phraseMaker", "PhraseMaker", "phrasemaker", "Phrase Maker"],
        ["musickeyboard", "musicKeyboard", "MusicKeyboard", "musickeyboard", "Music Keyboard"],
        ["sampler", "sample", "SampleWidget", "sampler", "Sampler"],
        ["rhythmruler2", "rhythmRuler", "RhythmRuler", "rhythmruler", "Rhythm Ruler"],
        ["timbre", "timbre", "TimbreWidget", "timbre", "Timbre"]
    ]) {
        it(
            "preserves " + destination + " contents and refuses box/action values before output",
            () => {
                load(project(type));
                let widget, before, init, decode, errors, output, startupDecodes;
                cy.window().then(
                    win =>
                        new Cypress.Promise(resolve => {
                            win.require(["widgets/" + module], () => {
                                // Read the production constructor's global lexical binding, without replacing source.
                                const Widget = win.eval(constructor);
                                win.require(Widget.dependencies, () => {
                                    const activity = win.ActivityContext.getActivity();
                                    widget = new Widget(
                                        key === "musicKeyboard" ? activity : undefined
                                    );
                                    Object.assign(widget, {
                                        sampleName: "kept.wav",
                                        sampleData: "kept audio",
                                        samplePitch: "la",
                                        sampleOctave: 4,
                                        instruments: ["piano"],
                                        noteNames: ["do"],
                                        octaves: [4],
                                        rowLabels: ["do"],
                                        rowArgs: [4],
                                        Drums: [90],
                                        Rulers: [[[4], []]],
                                        notesToPlay: [["C4", 4]],
                                        _rowBlocks: [90]
                                    });
                                    activity.logo[key] = widget;
                                    if (type === "musickeyboard") {
                                        const block = activity.blocks.blockList.find(
                                            block => !block.trash && block.name === type
                                        );
                                        activity.logo.musicKeyboards = {
                                            [block.blockIndex]: widget
                                        };
                                    }
                                    init = cy.spy(widget, "init");
                                    before = { ...widget };
                                    decode = cy.spy(win.Tone.ToneAudioBuffer, "load");
                                    errors = cy.spy(activity, "errorMsg");
                                    output = cy.spy(activity, "textMsg");
                                    const resume = activity.logo._startLogoCommands;
                                    cy.stub(activity.logo, "_startLogoCommands").callsFake(
                                        function (...args) {
                                            startupDecodes = decode.args.filter(
                                                call => call[0] === value().samples[0].data
                                            ).length;
                                            return resume.apply(this, args);
                                        }
                                    );
                                    activity.logo.runLogoCommands();
                                    resolve();
                                });
                            });
                        })
                );
                cy.window({ timeout: 20000 }).should(win => {
                    const activity = win.ActivityContext.getActivity();
                    expect(errors).to.have.been.calledWithMatch(
                        "Multisample instrument “" + value(type).name + "” is not supported in"
                    );
                    expect(errors.args.map(args => args[0]).join("\n")).to.include(destination);
                    expect(activity.logo.stopTurtle).to.equal(true);
                    expect(init).not.to.have.been.called;
                    expect(
                        decode.args.filter(args => args[0] === value().samples[0].data)
                    ).to.have.length(startupDecodes);
                    expect(startupDecodes, "one conservative preparation before dispatch").to.equal(
                        1
                    );
                    expect(
                        output.args.some(args => args[0] === "unexpected child output")
                    ).to.equal(false);
                    expect(widget).to.deep.equal(before);
                    expect(activity.logo.instrumentCaptures).to.have.length(0);
                    const saved = JSON.parse(activity.prepareExport());
                    expect(saved.find(b => b[1][0] === "multisample")[1][1].value).to.deep.equal(
                        value(type)
                    );
                });
            }
        );
    }

    it("refuses generated JavaScript without replacing existing editor text", () => {
        load(project("matrix"));
        cy.window().then(async win => {
            const activity = win.ActivityContext.getActivity();
            const errors = cy.spy(activity, "errorMsg");
            await activity.toggleJSWindow();
            const editor = win.document.querySelector(".editor");
            expect(editor).not.to.equal(null);
            editor.textContent = "const kept = 'my program';";
            editor.dispatchEvent(new win.Event("input", { bubbles: true }));
            const reset = [...win.document.querySelectorAll(".material-icons")].find(
                element => element.textContent === "autorenew"
            );
            reset.click();
            expect(editor.textContent).to.equal("const kept = 'my program';");
            expect(errors).to.have.been.calledWithMatch(
                "JavaScript export does not support multisample instrument “" +
                    value("matrix").name +
                    "” yet. Export the Music Blocks project instead."
            );
            expect(errors.args.some(args => args[0].includes("Music Blocks project"))).to.equal(
                true
            );
            expect(win.document.querySelector("#errorText b")).to.equal(null);
        });
    });

    it("keeps ordinary Set Instrument selection eligible for playback integration", () => {
        load(project("matrix"));
        cy.window().then(async win => {
            const activity = win.ActivityContext.getActivity();
            const logo = activity.logo;
            const owner = activity.blocks.blockList.find(b => !b.trash && b.name === "multisample");
            const block = activity.blocks.blockList.find(b => !b.trash && b.name === "settimbre");
            const turtle = activity.blocks.blockList.find(
                b => !b.trash && b.name === "start"
            ).value;
            const alias = logo.synth.registerMultisample(owner.value);
            await logo.synth.loadSynth(turtle, alias);
            logo.boxes.voice = owner.value;
            const resolved = logo.parseArg(
                logo,
                turtle,
                block.connections[1],
                block.blockIndex,
                null
            );
            expect(
                block.protoblock.flow(
                    [resolved, block.connections[2]],
                    logo,
                    turtle,
                    block.blockIndex
                )
            ).to.deep.equal([block.connections[2], 1]);
            expect(activity.turtles.ithTurtle(turtle).singer.instrumentNames).to.include(alias);
            expect(owner.value).to.deep.equal(value("matrix"));
            logo.doStopTurtles();
        });
    });
});
