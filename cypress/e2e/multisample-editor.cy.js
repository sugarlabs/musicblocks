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
const wav = (frames = 800, frequency = 130.8128, harmonic = 0) => {
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
    for (let i = 0; i < frames; i++) {
        const phase = (2 * Math.PI * frequency * i) / 8000;
        bytes.writeInt16LE(
            Math.round(
                14000 * (Math.sin(phase) + (harmonic ? 0.5 * Math.sin(harmonic * phase) : 0))
            ),
            44 + 2 * i
        );
    }
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
    cy.get(editor + ' input[name="multisample-name"]')
        .clear()
        .type("弦 <b>Instrument</b>", { parseSpecialCharSequences: false });
    apply();
    cy.window().should(win => expect(owners(win)).to.have.length(1));
};

const savedAudition = () => {
    const descriptor = {
        type: "multisample",
        version: 1,
        name: "I11 saved audition",
        samples: [
            {
                name: "low.wav",
                root: "C3",
                data: "data:audio/wav;base64," + wav(24000).toString("base64")
            },
            {
                name: "high.wav",
                root: "C4",
                data: "data:audio/wav;base64," + wav(24000, 261.6255653, 3).toString("base64")
            }
        ]
    };
    const project = [
        [0, "settimbre", 100, 100, [null, 1, null, 2]],
        [1, ["multisample", { value: descriptor }], 0, 0, [0]],
        [2, "hidden", 0, 0, [0, null]]
    ];
    cy.get("#myOpenFile").selectFile(
        { contents: Cypress.Buffer.from(JSON.stringify(project)), fileName: "audition.tb" },
        { force: true }
    );
    cy.window().should(win => {
        expect(activity(win).blocks.isLoading()).to.equal(false);
        expect(owners(win)).to.have.length(1);
        expect(owners(win)[0].value.name).to.equal(descriptor.name);
        expect(activity(win).logo._synthsInitialized).to.equal(false);
    });
    reopen();
};

const amplitude = (samples, rate, frequency) => {
    let real = 0,
        imaginary = 0;
    for (let i = 0; i < samples.length; i++) {
        const phase = (2 * Math.PI * frequency * i) / rate;
        real += samples[i] * Math.cos(phase);
        imaginary += samples[i] * Math.sin(phase);
    }
    return (2 * Math.hypot(real, imaginary)) / samples.length;
};

describe("Minimal multisample authoring", { testIsolation: true, retries: 0 }, () => {
    let auditionMeter;
    beforeEach(() => {
        const marker = "I09 Sampler " + Date.now() + " " + Math.random();
        cy.visit("http://127.0.0.1:3000", {
            onBeforeLoad(win) {
                win.localStorage.clear();
                win.localStorage.currentProject = marker;
            }
        });
        cy.waitForAppReady();
        cy.window({ timeout: 60000 }).should(win => {
            expect(
                activity(win).keyboardEnableFlag,
                "initial session restoration finished"
            ).to.equal(1);
            expect(activity(win).blocks.isLoading()).to.equal(false);
        });
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
            auditionMeter?.dispose();
            auditionMeter = null;
            activity(win).multisampleEditor?.close();
            activity(win).logo?.doStopTurtles();
        })
    );

    for (const width of [1280, 480, 360, 320]) {
        it(
            "keeps actions visible with one content scroller at " + width + "px",
            { viewportWidth: width, viewportHeight: 800 },
            () => {
                cy.contains("button", "New multisample instrument…").click();
                cy.get(editor + ' input[name="multisample-name"]').should("be.focused");
                cy.contains(editor + " button", "Add recordings…").focus();
                cy.contains(editor + " button", "Add recordings…").should("be.focused");
                cy.get(editor + ' input[type="file"]').selectFile(
                    Array.from({ length: 16 }, (_, index) => ({
                        contents: wav(),
                        fileName:
                            index === 0
                                ? "Cello-" + "sustained".repeat(20) + ".wav"
                                : index + ".wav",
                        mimeType: "audio/wav"
                    })),
                    { force: true }
                );
                cy.get(editor + " select")
                    .first()
                    .should("be.focused");
                cy.get(editor + " select").each(($select, index) => {
                    cy.wrap($select).select(index + 1);
                });
                cy.get(editor).should($root => {
                    const root = $root[0];
                    expect(root.scrollWidth).to.be.at.most(root.clientWidth);
                    expect(
                        root.closest(".windowFrame").getBoundingClientRect().right
                    ).to.be.at.most(width);
                    for (const select of root.querySelectorAll("select")) {
                        expect(select.labels).to.have.length(1);
                        expect(select.getAttribute("aria-label")).to.include("Root pitch — ");
                        expect(
                            select.ownerDocument.getElementById(
                                select.getAttribute("aria-describedby")
                            )
                        ).to.exist;
                    }
                    for (const text of ["Preview instrument", "Cancel", "Apply"]) {
                        const button = [...root.querySelectorAll("button")].find(
                            b => b.textContent === text
                        );
                        const bounds = button.getBoundingClientRect();
                        expect(button.disabled, text).to.equal(false);
                        expect(bounds.height, text).to.be.at.least(44);
                        expect(bounds.bottom, text).to.be.at.most(800);
                        expect(bounds.top, text).to.be.at.least(0);
                    }
                });
                cy.get(editor + " .multisample-content").scrollTo("bottom");
                cy.get(editor).should($root => {
                    expect($root[0].scrollTop).to.equal(0);
                    const content = $root[0].querySelector(".multisample-content");
                    expect(content.scrollTop).to.be.greaterThan(0);
                    expect(content.scrollWidth).to.be.at.most(content.clientWidth);
                    expect(
                        activity($root[0].ownerDocument.defaultView).multisampleEditor.list
                            .scrollTop
                    ).to.equal(0);
                });
                cy.contains(editor + " button", /^Cancel$/).click();
                cy.contains(editor + ' [role="alertdialog"] button', "Keep editing").should(
                    "be.focused"
                );
                cy.contains(editor + ' [role="alertdialog"] button', "Keep editing").click();
                cy.get(editor + ' input[name="multisample-name"]').should("be.focused");
            }
        );
    }

    it(
        "keeps failed recordings and long rejected-file details scrollable without hiding actions",
        { viewportWidth: 480, viewportHeight: 800 },
        () => {
            cy.contains("button", "New multisample instrument…").click();
            const rejected = "rejected-" + "recording".repeat(20) + ".wav";
            cy.get(editor + ' input[type="file"]').selectFile(
                Array.from({ length: 32 }, (_, index) => ({
                    contents: Cypress.Buffer.from("not a WAV"),
                    fileName: index < 16 ? "broken-" + index + ".wav" : index + rejected,
                    mimeType: "audio/wav"
                })),
                { force: true }
            );
            cy.window().should(win => expect(activity(win).multisampleEditor.busy).to.equal(null));
            cy.get(editor + ' [role="status"]').should(
                "contain.text",
                "Review recording errors. (16)"
            );
            cy.get(editor + " #multisample-details").should("contain.text", "31" + rejected);
            cy.get(editor + " .multisample-content").scrollTo("bottom");
            cy.get(editor).should($root => {
                const root = $root[0];
                expect(root.scrollWidth).to.be.at.most(root.clientWidth);
                expect(root.querySelector(".multisample-content").clientHeight).to.be.greaterThan(
                    100
                );
                for (const text of ["Preview instrument", "Cancel", "Apply"]) {
                    const button = [...root.querySelectorAll("button")].find(
                        b => b.textContent === text
                    );
                    expect(button.getBoundingClientRect().bottom, text).to.be.at.most(800);
                }
            });
            cy.contains(editor + " button", /^Cancel$/).click();
            cy.contains(editor + ' [role="alertdialog"] button', "Keep editing").should(
                "be.focused"
            );
        }
    );

    for (const theme of ["light", "dark", "highcontrast"]) {
        it("keeps native controls, focus and text legible in " + theme, () => {
            cy.window().then(win => {
                win.document.body.classList.remove("dark", "highcontrast");
                if (theme !== "light") win.document.body.classList.add(theme);
            });
            cy.contains("button", "New multisample instrument…").click();
            const luminance = color => {
                const channels = color
                    .match(/[\d.]+/g)
                    .slice(0, 3)
                    .map(Number)
                    .map(c => {
                        const value = c / 255;
                        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
                    });
                return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
            };
            const checkContrast = () =>
                cy.get(editor).should($root => {
                    const win = $root[0].ownerDocument.defaultView;
                    for (const control of $root[0].querySelectorAll(
                        "button,input:not([type=file]),select"
                    )) {
                        if (control.hidden) continue;
                        const style = win.getComputedStyle(control);
                        const text = luminance(style.color);
                        const background = luminance(style.backgroundColor);
                        expect(
                            (Math.max(text, background) + 0.05) /
                                (Math.min(text, background) + 0.05),
                            control.textContent || control.name
                        ).to.be.at.least(4.5);
                    }
                });
            checkContrast();
            upload();
            cy.get(editor + " select").should("have.attr", "aria-invalid", "true");
            cy.get(editor + " select").should($select => {
                const style = $select[0].ownerDocument.defaultView.getComputedStyle($select[0]);
                expect(style.outlineStyle).not.to.equal("none");
                expect(parseFloat(style.outlineWidth)).to.be.at.least(2);
            });
            checkContrast();
            cy.get(editor + " select").select("C3");
            checkContrast();
            cy.get(editor + " select").type("{esc}");
            cy.get(editor).should("be.visible");
            cy.get(editor + ' [role="alertdialog"]').should("not.exist");
        });
    }

    it(
        "keeps all actions reachable in a short viewport",
        { viewportWidth: 480, viewportHeight: 400 },
        () => {
            cy.contains("button", "New multisample instrument…").click();
            upload();
            cy.get(editor + " select").select("C3");
            cy.contains(editor + " button", /^Apply$/)
                .scrollIntoView()
                .should("be.visible");
            cy.get(editor).should($root => {
                const win = $root[0].ownerDocument.defaultView;
                expect(win.getComputedStyle($root[0]).overflowY).to.equal("auto");
                expect(
                    win.getComputedStyle($root[0].querySelector(".multisample-content")).overflowY
                ).to.equal("visible");
                expect($root[0].scrollWidth).to.be.at.most($root[0].clientWidth);
            });
            cy.contains(editor + " button", /^Cancel$/).click();
            cy.contains(editor + ' [role="alertdialog"] button', "Keep editing")
                .should("be.focused")
                .and("be.visible");
        }
    );

    it("requires closing Pitch Slider before editing and preserves its independent controls", () => {
        let slider;
        cy.window().then(win => {
            activity(win).blocks.loadNewBlocks([
                [0, "pitchslider", 400, 100, [null, 1, 3]],
                [1, "hertz", 0, 0, [0, 2, null]],
                [2, ["number", { value: 392 }], 0, 0, [1]],
                [3, "hiddennoflow", 0, 0, [0, null]]
            ]);
        });
        cy.window().should(win => {
            expect(activity(win).blocks.isLoading()).to.equal(false);
            expect(
                activity(win).blocks.blockList.some(
                    block =>
                        block && !block.trash && block.name === "pitchslider" && block.loadComplete
                )
            ).to.equal(true);
        });
        cy.window().then(win =>
            activity(win)
                .blocks.blockList.find(block => block?.name === "pitchslider")
                .activate()
        );
        cy.get('.windowFrame[aria-label="pitch slider"] input[type="range"]').should("be.visible");
        cy.window().should(win => {
            expect(activity(win).turtles.running()).to.equal(false);
            expect(activity(win).logo._synthsInitialized).to.equal(false);
        });
        cy.window().then(win => {
            slider = activity(win).logo.pitchSlider;
            slider.widgetWindow.setPosition(400, 200);
            cy.spy(activity(win), "errorMsg").as("entryError");
            cy.spy(activity(win), "textMsg").as("entryNotice");
        });
        cy.contains("button", "New multisample instrument…").click({ force: true });
        cy.get("@entryError").should("not.have.been.called");
        cy.get("@entryNotice")
            .should("have.been.calledOnce")
            .and(
                "have.been.calledWith",
                "Close other widgets before editing this instrument.",
                3000
            );
        cy.get("#printText").should("be.visible").and("contain.text", "Close other widgets");
        cy.get("#errorText").should("not.be.visible");
        cy.window().then(win => {
            expect(
                activity(win).errorMsgText.parent.visible,
                "no duplicate canvas warning"
            ).to.equal(false);
        });
        cy.get("#printText").then(notice => {
            const bounds = notice[0].getBoundingClientRect();
            expect(bounds.left).to.be.at.least(0);
            expect(bounds.right).to.be.at.most(notice[0].ownerDocument.defaultView.innerWidth);
        });
        cy.get(editor).should("not.exist");
        cy.window().then(win => {
            expect(activity(win).logo.pitchSlider).to.equal(slider);
            expect(slider.frequencies).to.deep.equal([392]);
        });
        cy.viewport(480, 640);
        cy.clock(Date.now(), ["setTimeout", "clearTimeout"]);
        cy.contains("button", "New multisample instrument…").click({ force: true });
        cy.get("#printText")
            .should("be.visible")
            .then(notice => {
                const bounds = notice[0].getBoundingClientRect();
                expect(bounds.left).to.be.at.least(0);
                expect(bounds.right).to.be.at.most(480);
                const hit = notice[0].ownerDocument.elementFromPoint(
                    bounds.left + bounds.width / 2,
                    bounds.top + bounds.height / 2
                );
                expect(
                    notice[0].contains(hit),
                    "notification is above the focused widget: " + hit?.outerHTML.slice(0, 150)
                ).to.equal(true);
            });
        cy.get("@entryNotice").should("have.been.calledTwice");
        cy.get("@entryError").should("not.have.been.called");
        cy.screenshot("i14-widget-entry-notice", { capture: "viewport" });
        cy.tick(3000);
        cy.get("#printText").should("not.be.visible");
        cy.clock().then(clock => clock.restore());
        cy.viewport(1280, 800);
        cy.get('.windowFrame[aria-label="pitch slider"] [aria-label="Move up"]').click();
        cy.window().should(() => expect(slider.frequencies[0]).to.be.greaterThan(392));
        cy.get('.windowFrame[aria-label="pitch slider"] .wftButton.close').click();
        cy.contains("button", "New multisample instrument…").click();
        cy.get(editor).should("be.visible");
        cy.contains(editor + " button", /^Cancel$/).click();
        cy.get(editor).should("not.exist");
    });

    it("listens to an unassigned row at original pitch and previews Tone's higher midpoint source", () => {
        savedAudition();
        let attacks;
        cy.window().then(win => {
            attacks = [];
            const original = win.Tone.Sampler.prototype.triggerAttack;
            cy.stub(win.Tone.Sampler.prototype, "triggerAttack").callsFake(function (...args) {
                auditionMeter?.dispose();
                auditionMeter = new win.Tone.Analyser("waveform", 8192);
                this.connect(auditionMeter);
                attacks.push(args[0]);
                return original.apply(this, args);
            });
        });
        cy.get(editor + " select")
            .first()
            .select("");
        cy.contains(editor + " button", "Preview instrument").should("be.disabled");
        cy.get(editor + ' button[aria-label^="Listen to recording"]')
            .first()
            .click();
        cy.window().should(win => {
            const pcm = auditionMeter.getValue();
            const rate = win.Tone.getContext().sampleRate;
            expect(amplitude(pcm, rate, 130.8128)).to.be.greaterThan(0.03);
            expect(amplitude(pcm, rate, 261.6256)).to.be.lessThan(0.02);
            expect(activity(win).multisampleEditor.draft.samples[0].root).to.equal("");
            const synth = activity(win).logo.synth;
            expect(
                synth.getPreparedMultisample(
                    "multisample-editor",
                    activity(win).multisampleEditor.work.descriptor
                )
            ).to.be.a("string");
        });
        cy.contains(editor + " button", /^Stop$/).click();
        cy.window().should(() =>
            expect(Math.max(...Array.from(auditionMeter.getValue(), Math.abs))).to.be.lessThan(
                0.002
            )
        );
        cy.get(editor + " select")
            .first()
            .select("C3");
        cy.get(editor + ' input[list="multisample-preview-pitches"]')
            .should("have.value", "C4")
            .clear()
            .type("F#3");
        cy.contains(editor + " button", "Preview instrument").click();
        cy.window().should(win => {
            const pcm = auditionMeter.getValue();
            const rate = win.Tone.getContext().sampleRate;
            const frequency = 184.9972114;
            const fundamental = amplitude(pcm, rate, frequency);
            expect(fundamental).to.be.greaterThan(0.03);
            expect(amplitude(pcm, rate, frequency * 3) / fundamental).to.be.within(0.3, 0.7);
            expect(amplitude(pcm, rate, frequency * 2) / fundamental).to.be.lessThan(0.12);
            expect(attacks).to.deep.equal(["C4", "F#3"]);
        });
        cy.window({ timeout: 10000 }).should(win => {
            expect(activity(win).logo.synth.multisampleBytes).to.equal(0);
            expect(activity(win).multisampleEditor.work).to.equal(null);
            expect(activity(win).multisampleEditor.busy).to.equal(null);
            expect(owners(win)[0].value.samples.map(s => s.root)).to.deep.equal(["C3", "C4"]);
        });
    });

    it("Stop/retry never waits for a held decoder or sounds its late result", () => {
        savedAudition();
        let release;
        let load;
        let attacks;
        cy.window().then(win => {
            const original = win.Tone.ToneAudioBuffer.load;
            load = cy.stub(win.Tone.ToneAudioBuffer, "load");
            load.onFirstCall().returns(
                new Promise(resolve => {
                    release = () =>
                        original
                            .call(win.Tone.ToneAudioBuffer, owners(win)[0].value.samples[0].data)
                            .then(resolve);
                })
            );
            load.callThrough();
            attacks = cy.spy(win.Tone.Sampler.prototype, "triggerAttack");
        });
        cy.get(editor + ' button[aria-label^="Listen to recording"]')
            .first()
            .click();
        cy.get(editor + ' [role="status"]').should("contain.text", "Preparing audition");
        cy.contains(editor + " button", /^Stop$/)
            .should("be.visible")
            .click();
        cy.get(editor + ' button[aria-label^="Listen to recording"]')
            .last()
            .click();
        cy.get(editor + ' [role="status"]').should("contain.text", "Playing audition");
        cy.then(() => release());
        cy.window().then(win => {
            expect(attacks).to.have.been.calledOnce;
            expect(load).to.have.been.calledTwice;
            expect(activity(win).logo.synth.multisampleBytes).to.be.greaterThan(0);
        });
        cy.contains(editor + " button", /^Stop$/).click();
        cy.window().then(win => expect(activity(win).logo.synth.multisampleBytes).to.equal(0));
    });

    it("repairs audition failure and keeps Stop, pitch and Apply reachable in a narrow window", () => {
        cy.viewport(480, 600);
        savedAudition();
        let load;
        cy.window().then(win => {
            load = cy.stub(win.Tone.ToneAudioBuffer, "load");
            load.onFirstCall().rejects(new Error("controlled failure"));
            load.callThrough();
        });
        cy.get(editor + ' button[aria-label^="Listen to recording"]')
            .first()
            .click();
        cy.get(editor + " #multisample-details")
            .should("contain.text", "low.wav")
            .and("contain.text", "Unable to decode");
        cy.window().then(win => expect(activity(win).logo.synth.multisampleBytes).to.equal(0));
        cy.get(editor + ' input[list="multisample-preview-pitches"]')
            .scrollIntoView()
            .focus()
            .should("be.focused")
            .trigger("keydown", { key: "ArrowDown" })
            .trigger("keydown", { key: "Escape" });
        cy.get(editor).should("exist");
        cy.contains(editor + " button", "Preview instrument")
            .scrollIntoView()
            .click();
        cy.get(editor + ' [role="status"]').should("contain.text", "Playing audition");
        cy.contains(editor + " button", /^Stop$/)
            .scrollIntoView()
            .should("be.visible")
            .click();
        cy.get(editor + ' input[name="multisample-name"]')
            .clear()
            .type("I11 applied after audition");
        apply();
        cy.window().then(win => {
            expect(owners(win)[0].value.name).to.equal("I11 applied after audition");
            expect(activity(win).logo.synth.multisampleBytes).to.equal(0);
        });
    });

    it("repeated real auditions and project replacement release their dedicated owners", () => {
        savedAudition();
        let disposals;
        cy.window().then(win => {
            disposals = cy.spy(win.Tone.Sampler.prototype, "dispose");
        });
        for (let i = 0; i < 10; i++) {
            cy.get(editor + ' button[aria-label^="Listen to recording"]')
                .first()
                .click();
            cy.get(editor + ' [role="status"]').should("contain.text", "Playing audition");
            cy.contains(editor + " button", "Preview instrument").click();
            cy.get(editor + ' [role="status"]').should("contain.text", "Playing audition");
            cy.contains(editor + " button", /^Stop$/).click();
            cy.window().then(win => {
                expect(activity(win).logo.synth.multisampleBytes).to.equal(0);
                expect(activity(win).multisampleEditor.work).to.equal(null);
            });
        }
        cy.then(() => expect(disposals.callCount).to.equal(20));
        cy.contains(editor + " button", "Preview instrument").click();
        cy.get(editor + ' [role="status"]').should("contain.text", "Playing audition");
        cy.window().then(win => activity(win).projectManager.newProject());
        cy.get(editor).should("not.exist");
        cy.window().then(win => expect(activity(win).logo.synth.multisampleBytes).to.equal(0));
    });

    it("repairs a real mixed batch in picker order without silently applying the successful subset", () => {
        cy.contains("button", "New multisample instrument…").click();
        cy.get(editor + ' input[type="file"]')
            .should("have.prop", "multiple", true)
            .selectFile(
                [
                    { contents: wav(), fileName: "same.wav", mimeType: "audio/x-pn-wav" },
                    {
                        contents: Cypress.Buffer.alloc(16),
                        fileName: "broken.wav",
                        mimeType: "audio/wav"
                    },
                    { contents: wav(1200), fileName: "same.wav", mimeType: "audio/vnd.wave" }
                ],
                { force: true }
            );
        cy.get(editor + " select")
            .first()
            .should("not.be.disabled")
            .should("be.focused")
            .select("C3");
        cy.get(editor + " select")
            .eq(2)
            .select("C4");
        cy.contains(editor + " button", /^Apply$/).should("be.disabled");
        cy.contains(editor, "broken.wav");
        cy.window().then(win =>
            expect(activity(win).multisampleEditor.draft.samples.map(s => s.name)).to.deep.equal([
                "same.wav",
                "broken.wav",
                "same.wav"
            ])
        );
        cy.get(editor + ' button[aria-label^="Replace recording"]')
            .eq(1)
            .click();
        cy.get(editor + ' input[type="file"]')
            .should("have.prop", "multiple", false)
            .selectFile(
                {
                    contents: wav(1000),
                    fileName: "repaired.wav",
                    mimeType: "application/octet-stream"
                },
                { force: true }
            );
        cy.get(editor + " select")
            .eq(1)
            .should("not.be.disabled")
            .should("have.value", "")
            .select("D3");
        cy.contains(editor, "Root kept; check it matches the new recording.");
        cy.get(editor).screenshot("i10-recording-batch-desktop");
        cy.viewport(480, 600);
        cy.get(editor).then($root => {
            const rect = $root[0].getBoundingClientRect();
            expect(rect.left).to.be.at.least(0);
            expect(rect.right).to.be.at.most(480);
        });
        cy.get(editor).screenshot("i10-recording-batch-small");
        cy.get(editor + ' button[aria-label^="Remove recording"]')
            .eq(1)
            .click();
        cy.get(editor + " select")
            .last()
            .should("be.focused");
        cy.contains(editor + " button", "Undo removal").click();
        cy.get(editor + " select")
            .eq(1)
            .should("have.value", "D3")
            .should("be.focused");
        apply();
        cy.window().then(win => {
            const saved = owners(win)[0].value.samples;
            expect(saved.map(s => [s.name, s.root])).to.deep.equal([
                ["same.wav", "C3"],
                ["repaired.wav", "D3"],
                ["same.wav", "C4"]
            ]);
            expect(saved.map(s => s.data)).to.deep.equal(
                [wav(), wav(1000), wav(1200)].map(
                    bytes => "data:audio/wav;base64," + bytes.toString("base64")
                )
            );
        });
        reopen();
        cy.get(editor + " select").should("have.length", 3);
    });

    it("keeps the saved snapshot through replacement cancellation, invalid upload and decode failure", () => {
        create();
        let original;
        cy.window().then(win => {
            original = JSON.parse(JSON.stringify(owners(win)[0].value));
        });
        reopen();
        cy.get(editor + ' button[aria-label^="Replace recording"]').click();
        cy.get(editor + ' input[type="file"]').trigger("cancel", { force: true });
        cy.get(editor + " select").should("have.value", "C3");
        cy.get(editor + ' button[aria-label^="Replace recording"]').click();
        upload(Cypress.Buffer.alloc(16), "audio/wav");
        cy.contains(
            editor + " #multisample-details",
            "Recordings must contain embedded WAV audio."
        );
        cy.window().then(win =>
            expect(activity(win).multisampleEditor.draft).to.deep.equal(original)
        );
        cy.get(editor + ' button[aria-label^="Replace recording"]').click();
        upload(Cypress.Buffer.from("RIFF0000WAVE"), "audio/wav");
        cy.get(editor + " select").should("have.value", "C3");
        cy.contains(editor + " button", /^Apply$/).click();
        cy.contains(editor, "Unable to decode", { timeout: 40000 });
        cy.get(editor + ' button[aria-label^="Replace recording"]').should("be.focused");
        cy.contains(editor + " button", /^Cancel$/)
            .should("not.be.disabled")
            .click();
        cy.contains(editor + " button", "Discard changes").click();
        cy.window().then(win => expect(owners(win)[0].value).to.deep.equal(original));
        reopen();
        cy.get(editor + ' button[aria-label^="Replace recording"]').click();
        upload(wav(1000));
        cy.get(editor + " select").should("have.value", "C3");
        apply();
        cy.window().then(win =>
            expect(owners(win)[0].value.samples[0].data).to.equal(
                "data:audio/wav;base64," + wav(1000).toString("base64")
            )
        );
        cy.get("body").trigger("keydown", { keyCode: 90, ctrlKey: true });
        cy.window().should(win => expect(owners(win)[0].value).to.deep.equal(original));
    });

    it("caps a 17-file batch at 16, removes down to zero and restores a valid single recording", () => {
        cy.contains("button", "New multisample instrument…").click();
        cy.get(editor + ' input[type="file"]').selectFile(
            Array.from({ length: 17 }, (_, i) => ({
                contents: wav(),
                fileName: i + ".wav",
                mimeType: "audio/wav"
            })),
            { force: true }
        );
        cy.get(editor + " select")
            .should("have.length", 16)
            .first()
            .should("not.be.disabled");
        cy.contains(editor, "16.wav");
        cy.contains(editor + " button", "Add recordings…").should("be.disabled");
        cy.get(editor + " select").each(($select, index) =>
            cy
                .wrap($select)
                .select("C" + (1 + Math.floor(index / 2)))
                .then(() => {
                    if (index % 2) cy.wrap($select).select("D" + (1 + Math.floor(index / 2)));
                })
        );
        cy.contains(editor + " button", /^Apply$/).should("not.be.disabled");
        for (let i = 0; i < 16; i++)
            cy.get(editor + ' button[aria-label^="Remove recording"]')
                .first()
                .click();
        cy.contains(editor + ' [role="status"]', "Add at least one recording");
        cy.contains(editor + " button", "Add recordings…").should("be.focused");
        cy.contains(editor + " button", /^Apply$/).should("be.disabled");
        cy.contains(editor + " button", "Undo removal").click();
        cy.get(editor + " select")
            .should("have.length", 1)
            .should("have.value", "D8");
        apply();
        cy.window().then(win => expect(owners(win)[0].value.samples).to.have.length(1));
    });

    it("keeps Cancel usable during sequential reads and ignores a late read after dirty Close", () => {
        cy.contains("button", "New multisample instrument…").click();
        let release;
        cy.window().then(win => {
            const nativeRead = win.FileReader.prototype.readAsDataURL;
            cy.stub(win.FileReader.prototype, "readAsDataURL").callsFake(function (file) {
                release = () => nativeRead.call(this, file);
            });
        });
        cy.get(editor + ' input[type="file"]').selectFile(
            [
                { contents: wav(), fileName: "pending.wav", mimeType: "audio/wav" },
                { contents: wav(), fileName: "next.wav", mimeType: "audio/wav" }
            ],
            { force: true }
        );
        cy.contains(editor + " button", /^Apply$/).should("be.disabled");
        cy.get(editor + ' button[aria-label^="Remove recording"]')
            .first()
            .should("be.disabled");
        cy.get(editor + ' input[name="multisample-name"]').should("be.disabled");
        cy.contains(editor + " button", /^Cancel$/).click();
        cy.contains(editor + " button", "Keep editing")
            .should("be.focused")
            .click();
        cy.contains(editor, "Reading cancelled");
        cy.contains(editor + " button", /^Apply$/).should("be.disabled");
        cy.contains(editor + " button", /^Cancel$/).click();
        cy.contains(editor + " button", "Discard changes").click();
        cy.contains("button", "New multisample instrument…").click();
        cy.then(() => release());
        cy.get(editor + " select").should("not.exist");
        cy.window().then(win => expect(owners(win)).to.have.length(0));
    });

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
        cy.get(editor + ' input[name="multisample-name"]')
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
        cy.get(editor + ' input[name="multisample-name"]')
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

    it(
        "preserves the viewport when Apply and Cancel return focus to the saved block",
        { scrollBehavior: false },
        () => {
            let initial;
            cy.window().then(win => {
                const rect = win.document.getElementById("myCanvas").getBoundingClientRect();
                initial = { x: rect.x, y: rect.y, scrollX: win.scrollX, scrollY: win.scrollY };
            });
            const verify = () =>
                cy.window().should(win => {
                    const rect = win.document.getElementById("myCanvas").getBoundingClientRect();
                    expect(win.document.activeElement).to.equal(owners(win)[0].accessibleElement);
                    expect({
                        x: rect.x,
                        y: rect.y,
                        scrollX: win.scrollX,
                        scrollY: win.scrollY
                    }).to.deep.equal(initial);
                });
            create();
            verify();
            reopen();
            cy.contains(editor + " button", /^Cancel$/).click();
            verify();
        }
    );

    it("creates a visible stack after workspace scrolling and reopens through touch fallback", () => {
        cy.window().then(win => {
            activity(win).blocksContainer.x = -1600;
            activity(win).blocksContainer.y = 900;
        });
        create();
        cy.window().then(win => {
            const current = activity(win);
            const owner = owners(win)[0];
            const stack = current.blocks.blockList[owner.connections[0]];
            expect(stack.container.x + current.blocksContainer.x).to.equal(100);
            expect(stack.container.y + current.blocksContainer.y).to.equal(100);
            current.blocks.mouseDownTime = Date.now();
            owner._mouseoutCallback({}, false, false, false);
            expect(current.multisampleEditor.owner).to.equal(owner);
        });
        cy.get(editor).should("be.visible");
        cy.contains(editor + " button", /^Cancel$/).click();
    });

    it("honors a project switch requested after the dirty Cancel choice opened", () => {
        create();
        reopen();
        cy.get(editor + ' input[name="multisample-name"]')
            .clear()
            .type("Unsaved change");
        cy.contains(editor + " button", /^Cancel$/).click();
        cy.window().then(win => activity(win).projectManager.newProject());
        cy.contains(editor + " button", "Discard changes").click();
        cy.window().should(win => {
            expect(activity(win).multisampleEditor).to.equal(null);
            expect(owners(win).length).to.equal(0);
        });
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
        cy.get(editor + ' input[name="multisample-name"]')
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

    for (const format of ["native", "HTML", "session"]) {
        it(
            "plays a fresh " + format + " round trip of an authored batch through ordinary notes",
            () => {
                create();
                reopen();
                upload(wav(800, 261.6255653, 3));
                cy.get(editor + " select")
                    .last()
                    .select("C4");
                cy.get(editor + ' input[list="multisample-preview-pitches"]')
                    .clear()
                    .type("F#3");
                cy.contains(editor + " button", "Preview instrument").click();
                cy.contains(editor + " button", /^Stop$/)
                    .should("not.be.disabled")
                    .click();
                apply();
                let expected;
                let exported;
                cy.window().then(win => {
                    expected = JSON.parse(JSON.stringify(owners(win)[0].value));
                    const project = JSON.parse(activity(win).prepareExport());
                    const set = project.find(
                        row => row[1] === "settimbre" || row[1]?.[0] === "settimbre"
                    );
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
                        [
                            suffix,
                            ["storein2", { value: "i09done" }],
                            0,
                            0,
                            [set[4][3], suffix + 1, null]
                        ],
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
                        activity(win).blocks.blockList.filter(
                            b => b && !b.trash && b.name === "newnote"
                        )
                    ).to.have.length(3);
                });
                cy.window().then(win => {
                    if (format === "session") {
                        activity(win).__saveLocally();
                        expect(
                            activity(win).storage["SESSION" + activity(win).storage.currentProject]
                        ).to.equal(activity(win).prepareExport());
                    } else {
                        exported =
                            format === "HTML"
                                ? activity(win).save.prepareHTML()
                                : activity(win).prepareExport();
                    }
                    activity(win).logo.synth.disposeAllInstruments();
                });
                if (format === "session") {
                    cy.reload();
                } else {
                    cy.visit("http://127.0.0.1:3000", {
                        onBeforeLoad(win) {
                            win.localStorage.clear();
                            win.localStorage.currentProject =
                                "Fresh editor " + Date.now() + " " + Math.random();
                        }
                    });
                }
                cy.waitForAppReady();
                cy.window({ timeout: 60000 }).should(win => {
                    expect(
                        activity(win).keyboardEnableFlag,
                        "initial session restoration finished"
                    ).to.equal(1);
                    expect(activity(win).blocks.isLoading()).to.equal(false);
                });
                if (format !== "session") {
                    cy.then(() =>
                        cy.get("#myOpenFile").selectFile(
                            {
                                contents: Cypress.Buffer.from(exported),
                                fileName: "fresh." + (format === "HTML" ? "html" : "tb")
                            },
                            { force: true }
                        )
                    );
                }
                cy.window().should(win => {
                    expect(activity(win).blocks.isLoading()).to.equal(false);
                    expect(owners(win)).to.have.length(1);
                    expect(owners(win)[0].value).to.deep.equal(expected);
                    expect(activity(win).logo.synth.multisampleBytes).to.equal(0);
                    for (let i = 0; i < expected.samples.length; i++) {
                        expect(
                            win.atob(owners(win)[0].value.samples[i].data.split(",")[1])
                        ).to.equal(atob(expected.samples[i].data.split(",")[1]));
                    }
                    expect(win.document.querySelector(editor)).to.equal(null);
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
            }
        );
    }

    it("keeps same-file rows independent and identifies both duplicate roots", () => {
        cy.contains("button", "New multisample instrument…").click();
        upload();
        cy.get(editor + " select").select("C3");
        cy.get(editor + " select").should($select => {
            expect($select[0].getBoundingClientRect().width).to.be.greaterThan(100);
            expect($select[0].selectedOptions[0].textContent).to.equal("C3");
        });
        cy.contains(editor + " button", "Add recordings…").click();
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
        cy.get(editor + ' input[name="multisample-name"]')
            .focus()
            .trigger("keydown", { key: "Escape" });
        cy.get(editor).should("not.exist");
    });

    it("offers dirty project-switch choices and invalidates equal-value owner replacements", () => {
        create();
        reopen();
        cy.get(editor + ' input[name="multisample-name"]').type(" dirty");
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
            expect(errors).to.have.been.calledWithMatch(
                "Blocks were applied, but local storage is full"
            );
            expect(errors).to.have.been.calledWithMatch("Retry saving or export");
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
        cy.get(editor + " #multisample-details").should(
            "contain.text",
            "Unable to decode recording"
        );
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
        cy.get(editor + ' input[name="multisample-name"]').type(" dirty");
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
        cy.get(samplerFrame + ' [aria-label="Save sample"]').click();
        cy.window().should(win => {
            const saved = activity(win).blocks.blockList.find(
                b => b && !b.trash && b.name === "customsample" && b.value?.[0] === "legacy.wav"
            );
            expect(saved).to.exist;
            expect(saved.value).to.deep.equal([
                "legacy.wav",
                "data:audio/wav;base64," + wav(24000).toString("base64"),
                activity(win).logo.sample.samplePitch,
                activity(win).logo.sample.sampleOctave,
                37
            ]);
            const exported = JSON.parse(activity(win).prepareExport());
            expect(exported.find(row => row[1]?.[0] === "customsample")[1][1].value[4]).to.equal(
                37
            );
            expect(exported.find(row => row[1]?.[0] === "audiofile")[1][1].value[1]).to.equal(
                saved.value[1]
            );
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
