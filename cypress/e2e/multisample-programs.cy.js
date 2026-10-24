/**
 * MusicBlocks v3.8.0
 * Copyright (C) 2026 Music Blocks Contributors
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

/* global Cypress, cy */

// Each root has a different harmonic signature, so correct output pitch alone
// cannot hide selecting/transposing the wrong recording.
function recording(frequency, harmonic, frames = 2000) {
    const rate = 8000;
    const bytes = new ArrayBuffer(44 + frames * 2);
    const view = new DataView(bytes);
    const write = (offset, text) => {
        for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
    };
    write(0, "RIFF");
    view.setUint32(4, bytes.byteLength - 8, true);
    write(8, "WAVEfmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, rate, true);
    view.setUint32(28, rate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    write(36, "data");
    view.setUint32(40, frames * 2, true);
    for (let i = 0; i < frames; i++) {
        const phase = (2 * Math.PI * frequency * i) / rate;
        const sample = Math.sin(phase) + (harmonic ? 0.5 * Math.sin(harmonic * phase) : 0);
        view.setInt16(44 + i * 2, Math.round(sample * 14000), true);
    }
    return "data:audio/wav;base64," + Cypress.Buffer.from(bytes).toString("base64");
}

function instrument() {
    return {
        type: "multisample",
        version: 1,
        name: "Program strings",
        samples: [
            { name: "low.wav", root: "C3", data: recording(130.8127826502993, 0, 640) },
            { name: "high.wav", root: "C4", data: recording(261.6255653005986, 2, 640) }
        ]
    };
}
function fixture(options = {}) {
    const blocks = [];
    const add = (name, connections = [], value) => {
        const id = blocks.length;
        blocks.push([
            id,
            value === undefined ? name : [name, { value }],
            100 + (id % 3) * 180,
            100,
            connections
        ]);
        return id;
    };
    const val = (name, value, parent) => add(name, [parent], value);
    const note = (parent, pitch = "G", octave = 4) => {
        const id = add("newnote");
        const divide = add("divide");
        blocks[divide][4] = [id, val("number", 1, divide), val("number", 16, divide)];
        const tone = add("pitch");
        blocks[tone][4] = [
            id,
            val(typeof pitch === "number" ? "number" : "notename", pitch, tone),
            val("number", octave, tone),
            null
        ];
        const hidden = add("hidden", [id, null]);
        blocks[id][4] = [parent, divide, tone, hidden];
        return { first: id, last: hidden };
    };
    const suffix = (parent, name = "suffix") => {
        const id = add("storein");
        const plus = add("plus");
        blocks[plus][4] = [id, val("box", name, plus), val("number", 1, plus)];
        // box is an argument block whose name is supplied by a text input.
        const box = blocks[plus][4][1];
        blocks[box][1] = "box";
        blocks[box][4] = [plus, val("text", name, box)];
        blocks[id][4] = [parent, val("text", name, id), plus, null];
        return id;
    };
    const starts = [];
    const banks = options.banks || [instrument()];
    const addPhrase = (bank, index) => {
        const start = add("start", [null, null, null]);
        starts.push(start);
        let parent = start;
        let slot = 1;
        if (options.mid && index === 0) {
            const early = note(start);
            blocks[start][4][1] = early.first;
            parent = early.last;
            slot = 1;
        }
        const set = add("settimbre");
        blocks[parent][4][slot] = set;
        const voice = val(bank ? "multisample" : "voicename", bank || "sine", set);
        let previous = set;
        let first;
        for (const pitch of options.pitches || ["C", "D", "E"]) {
            const n = note(previous, pitch, options.octave ?? 4);
            if (first === undefined) first = n.first;
            else blocks[previous][4][1] = n.first;
            previous = n.last;
        }
        const out = add("hidden", [set, null]);
        blocks[set][4] = [parent, voice, first, out];
        if (options.settings) {
            const pan = add("setpanning");
            const volume = add("articulation");
            const effect = add("dis");
            blocks[pan][4] = [set, val("number", index === 0 ? -60 : 60, pan), volume];
            blocks[volume][4] = [
                pan,
                val("number", index === 0 ? -50 : 50, volume),
                effect,
                add("hidden", [volume, null])
            ];
            blocks[effect][4] = [
                volume,
                val("number", index === 0 ? 10 : 30, effect),
                first,
                add("hidden", [effect, null])
            ];
            blocks[first][4][0] = effect;
            blocks[set][4][2] = pan;
        }
        blocks[out][4][1] = suffix(out);
        return { set, voice, first, start };
    };
    const phrases = banks.map(addPhrase);
    if (options.nested) {
        const { start, set, voice } = phrases[0];
        const store = add("storein");
        const call = add("nameddoArg", [], "outer");
        const box = add("box");
        blocks[box][4] = [call, val("text", "saved", box)];
        blocks[start][4][1] = store;
        blocks[voice][4][0] = store;
        blocks[store][4] = [start, val("text", "saved", store), voice, call];
        blocks[call][4] = [store, box, suffix(call, "outerSuffix")];
        const outer = add("action");
        const outerHit = suffix(outer, "outerHit");
        const innerCall = add("nameddoArg", [], "inner");
        blocks[outer][4] = [null, val("text", "outer", outer), outerHit, null];
        blocks[outerHit][4][3] = innerCall;
        blocks[innerCall][4] = [outerHit, val("namedarg", "1", innerCall), null];
        const inner = add("action");
        const innerHit = suffix(inner, "innerHit");
        blocks[inner][4] = [null, val("text", "inner", inner), innerHit, null];
        blocks[innerHit][4][3] = set;
        blocks[set][4][0] = innerHit;
        blocks[set][4][1] = val("namedarg", "1", set);
    }
    for (const bank of options.unused || []) {
        val("multisample", bank, null);
    }
    return { blocks, starts, phrases };
}

function load(options = {}) {
    const made = fixture(options);
    const expected = [];
    const suffix = " " + Date.now() + " " + Math.random();
    for (const block of made.blocks) {
        if (!Array.isArray(block[1]) || block[1][0] !== "multisample") continue;
        block[1][1].value.name += suffix;
        expected.push(block[1][1].value);
    }
    cy.get("#myOpenFile").selectFile(
        {
            contents: Cypress.Buffer.from(JSON.stringify(made.blocks)),
            fileName: "ordinary-multisample.tb",
            mimeType: "application/octet-stream"
        },
        { force: true }
    );
    cy.window().should(win => {
        const workspace = win.ActivityContext.getActivity().blocks;
        expect(workspace.isLoading()).to.equal(false);
        const owners = workspace.blockList.filter(b => b && !b.trash && b.name === "multisample");
        expect(owners.map(b => b.value)).to.deep.equal(expected);
        expect(owners.every(b => b.loadComplete)).to.equal(true);
    });
}

// Observe the real interpreter, public loader, Sampler and rendered real-time PCM.
async function observe(win, delays = [], onPCM) {
    const activity = win.ActivityContext.getActivity();
    const logo = activity.logo;
    const synth = logo.synth;
    const tone = win.Tone;
    const savedAudio = new Set(
        activity.blocks.blockList
            .filter(block => block && !block.trash && block.name === "multisample")
            .flatMap(block => block.value.samples.map(sample => sample.data))
    );
    const trace = { decodes: [], ready: [], dispatch: [], attacks: [], pcm: [], clocks: [] };
    let runTime = logo.time;
    Object.defineProperty(logo, "time", {
        configurable: true,
        get: () => runTime,
        set(value) {
            runTime = value;
            trace.clocks.push({ wall: win.performance.now(), value });
        }
    });
    const transportStart = Cypress.sinon.spy(synth.transport, "start");
    const nodes = [];
    const moduleURL = win.URL.createObjectURL(
        new win.Blob(
            [
                `
        class MultisampleOnsets extends AudioWorkletProcessor {
            constructor() { super(); this.lastSound = -sampleRate; }
            process(inputs) {
                const data = inputs[0]?.[0];
                if (data) for (let i = 0; i < data.length; i++) {
                    if (Math.abs(data[i]) < 0.002) continue;
                    if (currentFrame + i - this.lastSound > sampleRate * 0.04)
                        this.port.postMessage(currentTime + i / sampleRate);
                    this.lastSound = currentFrame + i;
                }
                return true;
            }
        }
        registerProcessor("multisample-onsets", MultisampleOnsets);
    `
            ],
            { type: "text/javascript" }
        )
    );
    try {
        await tone.getContext().addAudioWorkletModule(moduleURL);
    } finally {
        win.URL.revokeObjectURL(moduleURL);
    }
    const loadAudio = tone.ToneAudioBuffer.load;
    let decodeIndex = 0;
    Cypress.sinon.stub(tone.ToneAudioBuffer, "load").callsFake(async function (...args) {
        if (!savedAudio.has(args[0])) return loadAudio.apply(this, args);
        const index = decodeIndex++;
        const clockCount = trace.clocks.length;
        const dispatchCount = trace.dispatch.length;
        trace.decodes.push({ index, wall: win.performance.now() });
        const audio = await loadAudio.apply(this, args);
        if (delays[index]) await new Promise(resolve => win.setTimeout(resolve, delays[index]));
        expect(trace.clocks, "no clock initialization during preparation").to.have.length(
            clockCount
        );
        expect(trace.dispatch, "no dispatch during preparation").to.have.length(dispatchCount);
        return audio;
    });
    const prepared = synth.loadSynth;
    const seen = new WeakSet();
    const samplers = new Map();
    const outputs = new WeakSet();
    Cypress.sinon.stub(synth, "loadSynth").callsFake(async function (turtle, alias, ...args) {
        const sampler = await prepared.call(this, turtle, alias, ...args);
        if (!synth.isMultisampleAlias(alias) || seen.has(sampler)) return sampler;
        seen.add(sampler);
        samplers.set(String(turtle) + alias, sampler);
        trace.ready.push({ turtle: String(turtle), wall: win.performance.now() });
        const attack = sampler.triggerAttackRelease;
        Cypress.sinon.stub(sampler, "triggerAttackRelease").callsFake(function (...notes) {
            trace.attacks.push({
                turtle: String(turtle),
                wall: win.performance.now(),
                scheduled: notes[2],
                notes: notes[0],
                volume: sampler.volume.value,
                pan: activity.turtles.ithTurtle(turtle).singer.panner?.pan.value
            });
            return attack.apply(this, notes);
        });
        return sampler;
    });
    trace.triggers = [];
    const trigger = synth.trigger;
    Cypress.sinon.stub(synth, "trigger").callsFake(function (...args) {
        const [turtle, notes, duration, alias, effects] = args;
        const sampler = samplers.get(String(turtle) + alias);
        if (sampler) {
            trace.triggers.push({
                turtle: String(turtle),
                notes,
                duration,
                distortion: effects?.distortionAmount
            });
            const output = activity.turtles.ithTurtle(turtle).singer.panner || sampler;
            if (!outputs.has(output)) {
                outputs.add(output);
                const context = tone.getContext();
                const tap = context.createAudioWorkletNode("multisample-onsets");
                tap.port.onmessage = message => {
                    trace.pcm.push({ turtle: String(turtle), time: message.data });
                    onPCM?.();
                };
                output.connect(tap);
                tap.connect(context.rawContext.destination);
                nodes.push(tap);
            }
        }
        return trigger.apply(this, args);
    });
    const dispatch = logo.runFromBlock;
    Cypress.sinon.stub(logo, "runFromBlock").callsFake(function (...args) {
        trace.dispatch.push({ turtle: String(args[1]), wall: win.performance.now() });
        return dispatch.apply(this, args);
    });
    const errors = Cypress.sinon.spy(activity, "errorMsg");
    return {
        activity,
        logo,
        synth,
        trace,
        errors,
        transportStart,
        dispose() {
            logo.doStopTurtles();
            nodes.forEach(node => {
                node.port.onmessage = null;
                node.disconnect();
            });
            Cypress.sinon.restore();
        }
    };
}

describe("Ordinary multisample programs", { testIsolation: true, retries: 0 }, () => {
    let observed;
    const reports = [];
    beforeEach(() => {
        cy.visit("http://127.0.0.1:3000", {
            onBeforeLoad(win) {
                win.localStorage.clear();
            }
        });
        cy.waitForAppReady();
    });
    afterEach(function () {
        if (observed)
            reports.push({
                test: this.currentTest.title,
                state: this.currentTest.state,
                trace: observed.trace,
                errors: observed.errors.args
            });
        observed?.dispose();
        observed = null;
    });
    after(() =>
        cy.writeFile(".scratch/multisample-implementation/i07-browser-evidence.json", reports)
    );

    for (const options of [{}, { nested: true }, { mid: true }]) {
        it("holds cold startup and plays exactly once: " + JSON.stringify(options), () => {
            load(options);
            cy.window().then(async win => {
                await win.Tone.start();
                observed = await observe(win, [400, 400]);
                const { logo } = observed;
                logo.boxes = { suffix: 0, outerSuffix: 0, outerHit: 0, innerHit: 0 };
                logo.runLogoCommands();
                expect(observed.trace.dispatch).to.have.length(0);
                expect(observed.trace.clocks).to.have.length(0);
                expect(observed.logo.boxes.suffix).to.equal(0);
                expect(observed.logo.boxes.outerHit).to.equal(0);
            });
            cy.wrap(null).should(() => {
                expect(
                    observed.logo.boxes.suffix,
                    JSON.stringify({ trace: observed.trace, errors: observed.errors.args })
                ).to.equal(1);
                expect(observed.trace.attacks).to.have.length(3);
                expect(observed.trace.pcm).to.have.length(3);
            });
            cy.then(() => {
                const { trace, errors, logo } = observed;
                expect(errors.called).to.equal(false);
                expect(trace.decodes).to.have.length(2);
                expect(trace.clocks).to.have.length(1);
                expect(trace.clocks[0].wall).to.be.at.least(trace.ready[0].wall);
                for (let i = 1; i < 3; i++) {
                    expect(
                        trace.attacks[i].scheduled - trace.attacks[i - 1].scheduled
                    ).to.be.within(0.1, 0.35);
                    expect(trace.pcm[i].time - trace.pcm[i - 1].time).to.be.within(0.1, 0.35);
                }
                if (options.nested) {
                    expect(logo.boxes.outerHit).to.equal(1);
                    expect(logo.boxes.innerHit).to.equal(1);
                    expect(logo.boxes.outerSuffix).to.equal(1);
                }
                cy.log(JSON.stringify(trace));
            });
        });
    }

    for (const late of ["resolve", "reject"]) {
        it("Stop immediately retries independently of late " + late, () => {
            load();
            let settle;
            cy.window().then(async win => {
                await win.Tone.start();
                observed = await observe(win);
                const original = win.Tone.ToneAudioBuffer.load.wrappedMethod;
                win.Tone.ToneAudioBuffer.load.restore();
                let first = true;
                Cypress.sinon.stub(win.Tone.ToneAudioBuffer, "load").callsFake(function (...args) {
                    if (first && String(args[0]).startsWith("data:")) {
                        first = false;
                        return new Promise((resolve, reject) => {
                            settle = () =>
                                late === "reject"
                                    ? reject(new Error("abandoned"))
                                    : original.apply(this, args).then(resolve);
                        });
                    }
                    return original.apply(this, args);
                });
                observed.logo.boxes = { suffix: 0 };
                observed.logo.runLogoCommands();
            });
            cy.wrap(null).should(() => expect(settle).to.be.a("function"));
            cy.then(() => {
                observed.logo.doStopTurtles();
                observed.logo.runLogoCommands();
            });
            cy.wrap(null).should(() => expect(observed.logo.boxes.suffix).to.equal(1));
            cy.then(() => settle());
            cy.wait(150);
            cy.then(() => {
                expect(observed.trace.attacks).to.have.length(3);
                expect(observed.logo.boxes.suffix).to.equal(1);
                expect(observed.errors.called).to.equal(false);
            });
        });
    }

    for (const mutation of ["equal replacement", "trash", "project replacement"]) {
        it("abandons preparation on " + mutation, () => {
            load();
            let saved;
            cy.window().then(async win => {
                await win.Tone.start();
                observed = await observe(win, [600, 600]);
                saved = JSON.stringify(
                    observed.activity.blocks.blockList.find(
                        b => !b.trash && b.name === "multisample"
                    ).value
                );
                observed.logo.boxes = { suffix: 0 };
                observed.logo.runLogoCommands();
            });
            cy.wait(100);
            cy.then(() => {
                const owner = observed.activity.blocks.blockList.find(
                    b => !b.trash && b.name === "multisample"
                );
                if (mutation === "equal replacement")
                    owner.setMultisampleValue(JSON.parse(saved), true);
                if (mutation === "trash") observed.activity.blocks.sendStackToTrash(owner);
                if (mutation === "project replacement")
                    observed.activity.sendAllToTrash(false, true);
            });
            cy.wait(1400);
            cy.then(() => {
                expect(observed.trace.attacks).to.have.length(0);
                expect(observed.trace.dispatch).to.have.length(0);
                expect(observed.logo.boxes.suffix).to.equal(0);
                expect(observed.synth.multisampleBytes).to.equal(0);
                expect(observed.errors.called).to.equal(false);
            });
        });
    }

    for (const mutation of ["equal replacement", "Stop and Play"]) {
        it("handles " + mutation + " after real playback begins", () => {
            load();
            let changed = false;
            let attacksAtChange;
            cy.window().then(async win => {
                await win.Tone.start();
                observed = await observe(win, [], () => {
                    if (changed) return;
                    changed = true;
                    attacksAtChange = observed.trace.attacks.length;
                    if (mutation === "equal replacement") {
                        const owner = observed.activity.blocks.blockList.find(
                            b => b && !b.trash && b.name === "multisample"
                        );
                        owner.setMultisampleValue(JSON.parse(JSON.stringify(owner.value)), true);
                    } else {
                        observed.logo.doStopTurtles();
                        observed.logo.runLogoCommands();
                    }
                });
                observed.logo.boxes = { suffix: 0 };
                observed.logo.runLogoCommands();
            });
            cy.wrap(null).should(() => expect(changed).to.equal(true));
            cy.wait(800);
            cy.then(() => {
                expect(observed.errors.called).to.equal(false);
                if (mutation === "equal replacement") {
                    expect(observed.trace.attacks).to.have.length(attacksAtChange);
                    expect(observed.logo.boxes.suffix).to.equal(0);
                    expect(observed.synth.multisampleBytes).to.equal(0);
                } else {
                    expect(observed.trace.attacks).to.have.length(attacksAtChange + 3);
                    expect(observed.logo.boxes.suffix).to.equal(1);
                }
            });
        });
    }

    it("stops the entire ordinary duet on an unsupported target without losing audio", () => {
        const narrow = instrument();
        narrow.name = "low-only";
        narrow.samples = [{ ...narrow.samples[0], root: "C1" }];
        load({ banks: [narrow, null], pitches: ["C"], octave: 10 });
        let saved;
        cy.window().then(async win => {
            await win.Tone.start();
            observed = await observe(win);
            saved = observed.activity.projectManager.prepareExport();
            observed.logo.boxes = { suffix: 0 };
            observed.logo.runLogoCommands();
        });
        cy.wrap(null).should(() => {
            expect(observed.errors.called).to.equal(true);
            expect(observed.errors.lastCall.args[0])
                .to.include("low-only")
                .and.include("No available buffers");
            expect(observed.activity.turtles.running()).to.equal(false);
            expect(observed.synth.multisampleBytes).to.equal(0);
            expect(observed.activity.projectManager.prepareExport()).to.equal(saved);
        });
    });

    for (const reject of [false, true]) {
        it(
            "plays an ordinary phrase beside an unrelated " +
                (reject ? "rejected" : "held") +
                " download",
            () => {
                load();
                let buffer, release, unrelated;
                cy.window().then(async win => {
                    await win.Tone.start();
                    await win.Tone.loaded();
                    observed = await observe(win);
                    const nativeFetch = win.fetch;
                    const gate = new Promise((resolve, fail) => {
                        release = () => fail(new Error("unrelated download"));
                    });
                    Cypress.sinon.stub(win, "fetch").callsFake(function (url, ...args) {
                        return url === "held-ordinary.wav"
                            ? gate
                            : nativeFetch.call(this, url, ...args);
                    });
                    buffer = new win.Tone.ToneAudioBuffer();
                    unrelated = buffer.load("held-ordinary.wav").catch(error => error);
                    // Observe rejection without changing Tone's real global queue.
                    win.Tone.loaded().catch(() => {});
                    observed.logo.boxes = { suffix: 0 };
                    observed.logo.runLogoCommands();
                });
                cy.wrap(null).should(() =>
                    expect(observed.trace.attacks.length).to.be.greaterThan(0)
                );
                cy.then(() => {
                    if (reject) release();
                });
                cy.wrap(null).should(() => {
                    expect(observed.logo.boxes.suffix).to.equal(1);
                    expect(observed.trace.attacks).to.have.length(3);
                    expect(observed.trace.pcm).to.have.length(3);
                    expect(observed.errors.called).to.equal(false);
                });
                cy.then(async () => {
                    release();
                    await unrelated;
                    buffer.dispose();
                });
            }
        );
    }

    for (const candidate of [
        "unused valid",
        "unused undecodable",
        "unused budget failure",
        "opaque"
    ]) {
        it("respects conservative startup scope for " + candidate, () => {
            const unused = instrument();
            unused.name = candidate;
            if (candidate === "unused undecodable")
                unused.samples[0].data = "data:audio/wav;base64,UklGRgQAAABXQVZF";
            if (candidate === "unused budget failure")
                unused.samples[0].data = recording(200, 3, 640);
            if (candidate === "opaque") unused.version = 99;
            load({ unused: [unused] });
            cy.window().then(async win => {
                await win.Tone.start();
                observed = await observe(win);
                if (candidate === "unused budget failure") {
                    const original = win.Tone.ToneAudioBuffer.load.wrappedMethod;
                    win.Tone.ToneAudioBuffer.load.restore();
                    Cypress.sinon.stub(win.Tone.ToneAudioBuffer, "load").callsFake(async function (
                        ...args
                    ) {
                        const decoded = await original.apply(this, args);
                        return args[0] === unused.samples[0].data
                            ? new win.AudioBuffer({
                                  length: 8388609,
                                  numberOfChannels: 1,
                                  sampleRate: 48000
                              })
                            : decoded;
                    });
                }
                observed.logo.boxes = { suffix: 0 };
                observed.logo.runLogoCommands();
            });
            cy.wrap(null).should(() => {
                if (candidate === "unused undecodable" || candidate === "unused budget failure") {
                    expect(observed.errors.lastCall.args[0])
                        .to.include(candidate)
                        .and.include("low.wav");
                    expect(observed.trace.dispatch).to.have.length(0);
                    expect(observed.synth.multisampleBytes).to.equal(0);
                } else {
                    expect(observed.logo.boxes.suffix).to.equal(1);
                    expect(observed.trace.decodes).to.have.length(candidate === "opaque" ? 2 : 4);
                }
            });
        });
    }

    it("a whole-attempt deadline stops startup and rejects late native completion", () => {
        load();
        let late, loading;
        cy.window().then(async win => {
            await win.Tone.start();
            observed = await observe(win);
            const originalLoad = win.Tone.ToneAudioBuffer.load.wrappedMethod;
            win.Tone.ToneAudioBuffer.load.restore();
            Cypress.sinon.stub(win.Tone.ToneAudioBuffer, "load").callsFake(function (...args) {
                loading = originalLoad.apply(this, args);
                return loading.then(
                    decoded =>
                        new Promise(resolve => {
                            late = () => resolve(decoded);
                        })
                );
            });
            const nativeTimeout = win.setTimeout;
            Cypress.sinon.stub(win, "setTimeout").callsFake(function (callback, delay, ...args) {
                return nativeTimeout.call(this, callback, delay === 30000 ? 100 : delay, ...args);
            });
            observed.logo.boxes = { suffix: 0 };
            observed.logo.runLogoCommands();
        });
        cy.wrap(null).should(() => {
            expect(observed.errors.called).to.equal(true);
            expect(observed.errors.lastCall.args[0])
                .to.include("timed out")
                .and.include("Program strings");
            expect(observed.trace.dispatch).to.have.length(0);
            expect(observed.synth.multisampleBytes).to.equal(0);
        });
        cy.then(async () => {
            await loading;
            late();
        });
        cy.wait(150);
        cy.then(() => {
            expect(observed.trace.dispatch).to.have.length(0);
            expect(observed.logo.boxes.suffix).to.equal(0);
        });
    });

    let control;
    for (const delayed of [false, true]) {
        it(
            "compares independent two-turtle starts with " +
                (delayed ? "different delays" : "no delay"),
            () => {
                load({ banks: [instrument(), instrument()], settings: true });
                cy.window().then(async win => {
                    await win.Tone.start();
                    observed = await observe(
                        win,
                        delayed ? [100, 300, 500, 200, 150, 100, 50, 50] : []
                    );
                    observed.logo.boxes = { suffix: 0 };
                    observed.logo.runLogoCommands();
                });
                cy.wrap(null).should(() => {
                    expect(observed.logo.boxes.suffix).to.equal(2);
                    expect(observed.trace.attacks).to.have.length(6);
                    expect(observed.trace.pcm).to.have.length(6);
                });
                cy.then(() => {
                    const { trace } = observed;
                    const turtles = [...new Set(trace.attacks.map(item => item.turtle))];
                    expect(turtles).to.have.length(2);
                    expect(trace.ready).to.have.length(4);
                    const first = turtles.map(turtle =>
                        trace.attacks.find(item => item.turtle === turtle)
                    );
                    expect(first.map(item => item.pan)).to.deep.equal([-0.6, 0.6]);
                    expect(first[0].volume).not.to.equal(first[1].volume);
                    expect(
                        trace.triggers
                            .filter(item => item.turtle === turtles[0])
                            .map(item => item.distortion)
                    ).to.deep.equal([0.1, 0.1, 0.1]);
                    expect(
                        trace.triggers
                            .filter(item => item.turtle === turtles[1])
                            .map(item => item.distortion)
                    ).to.deep.equal([0.3, 0.3, 0.3]);
                    expect(Math.min(...trace.dispatch.map(item => item.wall))).to.be.at.least(
                        Math.max(...trace.ready.map(item => item.wall))
                    );
                    const starts = turtles.map(
                        turtle => trace.pcm.find(item => item.turtle === turtle).time
                    );
                    const difference = Math.abs(starts[0] - starts[1]);
                    if (!delayed) control = difference;
                    else
                        expect(difference, "matched existing scheduling precision").to.be.lessThan(
                            control + 0.1
                        );
                    cy.log(JSON.stringify({ delayed, difference, control, trace }));
                });
            }
        );
    }
});
