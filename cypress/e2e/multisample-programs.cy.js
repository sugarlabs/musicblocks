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
        if (options.drum && index === 1) {
            const drum = add("setdrum");
            blocks[drum][4] = [
                start,
                val("drumname", "kick drum", drum),
                set,
                add("hidden", [drum, null])
            ];
            blocks[start][4][1] = drum;
            blocks[set][4][0] = drum;
        }
        return { set, voice, first, start };
    };
    const phrases = banks.map(addPhrase);
    if (options.counter) {
        const { start, set } = phrases[0];
        const counter = add(options.counter, [null, set]);
        blocks[start][4][1] = null;
        blocks[set][4][0] = counter;
    }
    if (options.companion) {
        const { set } = phrases[0];
        const parent = blocks[set][4][0];
        const beat = add("everybeatdonew");
        blocks[beat][4] = [parent, val("text", "late", beat), null];
        blocks[parent][4][1] = beat;
        const action = add("action");
        blocks[action][4] = [null, val("text", "late", action), set, null];
        blocks[set][4][0] = action;
    }
    if (options.noStart) {
        for (const { start, set } of phrases) {
            blocks[start][1] = "hidden";
            blocks[start][4] = [null, set];
        }
    }
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
    const marker = "Fixture" + suffix;
    made.blocks.push([made.blocks.length, ["text", { value: marker }], 100, 100, [null]]);
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
        expect(
            workspace.blockList.some(b => b && !b.trash && b.value === marker && b.loadComplete)
        ).to.equal(true);
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
            .flatMap(block => (block.value.samples || []).map(sample => sample.data))
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
        trace.dispatch.push({ turtle: String(args[1]), wall: win.performance.now(), env: args[4] });
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
    beforeEach(() => {
        cy.visit("http://127.0.0.1:3000", {
            onBeforeLoad(win) {
                win.localStorage.clear();
            }
        });
        cy.waitForAppReady();
    });
    afterEach(() => {
        observed?.dispose();
        observed = null;
    });

    for (const mode of ["start", "drum", "bare", "no-start", "legacy"]) {
        it("preserves actual selection and invocation: " + mode, () => {
            load({
                banks: mode === "legacy" ? [null] : [instrument(), null],
                drum: true,
                noStart: mode === "bare" || mode === "no-start"
            });
            cy.window().then(async win => {
                await win.Tone.start();
                observed = await observe(win, [150, 150]);
                const { activity, logo, synth } = observed;
                logo.boxes = { suffix: 0 };
                const starts = activity.blocks.blockList.filter(
                    b => b && !b.trash && ["start", "drum"].includes(b.name)
                );
                const selected = mode === "drum" ? starts[1] : starts[0];
                const index =
                    mode === "bare"
                        ? activity.blocks.blockList.findIndex(
                              b => b && !b.trash && b.name === "settimbre"
                          )
                        : activity.blocks.blockList.indexOf(selected);
                const env = { kept: mode };
                logo.runLogoCommands(mode === "no-start" || mode === "legacy" ? null : index, env);
                if (mode === "no-start" || mode === "legacy") {
                    expect(observed.trace.decodes).to.have.length(0);
                    expect(observed.trace.clocks).to.have.length(1);
                }
                if (mode === "no-start") expect(synth.multisampleBytes).to.equal(0);
            });
            cy.wrap(null).should(() => {
                if (mode === "no-start") {
                    expect(observed.logo.boxes.suffix).to.equal(0);
                    expect(observed.trace.dispatch).to.have.length(0);
                } else {
                    expect(observed.logo.boxes.suffix).to.equal(1);
                    expect(observed.trace.dispatch[0].env).to.deep.equal({ kept: mode });
                    if (mode !== "legacy") {
                        expect(observed.trace.ready).to.have.length(1);
                        const selected = observed.trace.ready[0].turtle;
                        expect(
                            observed.trace.dispatch.every(item => item.turtle === selected)
                        ).to.equal(true);
                        expect(observed.trace.attacks).to.have.length(mode === "drum" ? 0 : 3);
                    }
                }
                expect(observed.errors.called).to.equal(false);
            });
        });
    }

    for (const stop of [false, true]) {
        it("retains one audible Step and treats preparation clicks as busy; Stop=" + stop, () => {
            load({ nested: true });
            let executed;
            cy.window().then(async win => {
                await win.Tone.start();
                observed = await observe(win, [250, 250]);
                const { activity, logo } = observed;
                executed = Cypress.sinon.spy(logo, "runFromBlockNow");
                logo.boxes = { suffix: 0, outerSuffix: 0, outerHit: 0, innerHit: 0 };
                expect(activity.toolbarController.runStep()).to.equal("started");
                for (let i = 0; i < 5; i++)
                    expect(activity.toolbarController.runStep()).to.equal(null);
                expect(executed.callCount).to.equal(0);
                if (stop) logo.doStopTurtles();
            });
            if (stop) cy.wait(750);
            cy.wrap(null).should(() => {
                expect(executed.callCount).to.equal(stop ? 0 : 1);
                expect(observed.trace.attacks).to.have.length(0);
                expect(observed.logo.boxes.suffix).to.equal(0);
            });
            cy.then(() => {
                if (stop) {
                    observed.activity.toolbarController.runStep();
                }
            });
            cy.wrap(null).should(() => expect(executed.callCount).to.equal(1));
            cy.then(
                () =>
                    new Cypress.Promise((resolve, reject) => {
                        let clicks = 0;
                        const advance = () => {
                            if (observed.logo.boxes.outerSuffix === 1) return resolve();
                            if (++clicks > 100) return reject(new Error("Step did not finish"));
                            observed.activity.toolbarController.runStep();
                            setTimeout(advance, 25);
                        };
                        advance();
                    })
            );
            cy.then(() => {
                expect(observed.logo.boxes).to.include({
                    suffix: 1,
                    outerSuffix: 1,
                    outerHit: 1,
                    innerHit: 1
                });
                expect(observed.trace.attacks).to.have.length(3);
                expect(observed.errors.called).to.equal(false);
            });
        });
    }

    for (const flag of ["runningLilypond", "runningAbc", "runningMxml", "runningMIDI"]) {
        it("validates actual silent use without audio readiness: " + flag, () => {
            const unused = instrument();
            unused.samples[0].data = "data:audio/wav;base64,UklGRgQAAABXQVZF";
            load({ nested: true, unused: [unused, { ...instrument(), version: 99 }] });
            cy.window().then(async win => {
                observed = await observe(win);
                const { logo, synth } = observed;
                Cypress.sinon.stub(win.Tone, "start").throws(new Error("no audio device"));
                const register = Cypress.sinon.spy(synth, "registerMultisample");
                const prepared = Cypress.sinon.spy(synth, "getPreparedMultisample");
                const save =
                    "afterSave" +
                    {
                        runningLilypond: "Lilypond",
                        runningAbc: "Abc",
                        runningMxml: "Mxml",
                        runningMIDI: "MIDI"
                    }[flag];
                Cypress.sinon.stub(logo.deps.save, save);
                logo.boxes = { suffix: 0, outerSuffix: 0, outerHit: 0, innerHit: 0 };
                logo[flag] = true;
                logo.runLogoCommands();
                observed.silent = { register, prepared };
            });
            cy.wrap(null).should(() => {
                expect(observed.logo.boxes).to.include({
                    suffix: 1,
                    outerSuffix: 1,
                    outerHit: 1,
                    innerHit: 1
                });
                expect(observed.trace.decodes).to.have.length(0);
                expect(observed.trace.attacks).to.have.length(0);
                expect(observed.silent.register.called).to.equal(false);
                expect(observed.silent.prepared.called).to.equal(false);
                expect(observed.errors.called).to.equal(false);
            });
        });
    }

    for (const counter of ["notecounter", "notecounter2"]) {
        it("counts saved values without preparation or an audio device: " + counter, () => {
            load({ counter });
            cy.window().then(async win => {
                observed = await observe(win);
                const { activity, logo, synth } = observed;
                Cypress.sinon.stub(win.Tone, "start").throws(new Error("no audio device"));
                const prepared = Cypress.sinon.spy(synth, "getPreparedMultisample");
                const register = Cypress.sinon.spy(synth, "registerMultisample");
                const start = activity.blocks.blockList.find(
                    b => b && !b.trash && b.name === "start"
                );
                logo.initTurtle(start.value);
                logo.stopTurtle = false;
                logo.boxes = { suffix: 0 };
                const id = activity.blocks.blockList.findIndex(
                    b => b && !b.trash && b.name === counter
                );
                const result = logo.parseArg(logo, start.value, id, null);
                expect(result).to.equal(counter === "notecounter" ? 3 / 16 : 3);
                expect(logo.boxes.suffix).to.equal(0);
                expect(prepared.called).to.equal(false);
                expect(register.called).to.equal(false);
                expect(observed.trace.decodes).to.have.length(0);
                expect(observed.trace.attacks).to.have.length(0);
                expect(observed.errors.called).to.equal(false);
            });
        });
    }

    for (const invalid of [false, true]) {
        it("silent actual-use validation rejects opaque values; invalid=" + invalid, () => {
            const bank = instrument();
            if (invalid) bank.samples = [];
            else bank.version = 99;
            load({ banks: [bank, null] });
            cy.window().then(async win => {
                observed = await observe(win);
                const { logo } = observed;
                observed.save = Cypress.sinon.stub(logo.deps.save, "afterSaveLilypond");
                logo.runningLilypond = true;
                logo.boxes = { suffix: 0 };
                logo.runLogoCommands();
            });
            cy.wrap(null).should(() => {
                expect(observed.errors.called).to.equal(true);
                expect(observed.logo.stopTurtle).to.equal(true);
                expect(observed.logo.boxes.suffix).to.equal(0);
                expect(observed.trace.decodes).to.have.length(0);
                expect(observed.trace.attacks).to.have.length(0);
                expect(observed.activity.turtles.running()).to.equal(false);
                expect(observed.save.called).to.equal(false);
            });
            if (!invalid) {
                cy.window().then(async win => {
                    await win.Tone.start();
                    const block = observed.activity.blocks.blockList.find(
                        b => b && !b.trash && b.name === "multisample"
                    );
                    const value = JSON.parse(JSON.stringify(block.value));
                    value.version = 1;
                    block.setMultisampleValue(value);
                    expect(observed.logo._exportingNotation).to.equal(false);
                    observed.logo.runLogoCommands();
                });
                cy.wrap(null).should(() => {
                    expect(observed.logo.boxes.suffix).to.equal(2);
                    expect(observed.trace.decodes).to.have.length(4);
                    expect(observed.trace.attacks).to.have.length(3);
                    expect(observed.save.called).to.equal(false);
                });
            }
        });
    }

    it("Stop precedes synchronous silent dispatch", () => {
        load();
        cy.window().then(async win => {
            observed = await observe(win);
            const { activity, logo } = observed;
            logo.runningLilypond = true;
            logo.boxes = { suffix: 0 };
            const id = activity.blocks.blockList.findIndex(
                b => b && !b.trash && b.name === "start"
            );
            logo.doStopTurtles();
            logo.runFromBlock(logo, activity.blocks.blockList[id].value, id, 0, null);
            expect(logo.boxes.suffix).to.equal(0);
            expect(observed.trace.decodes).to.have.length(0);
            expect(observed.trace.attacks).to.have.length(0);
            expect(logo.stopTurtle).to.equal(true);
        });
    });

    it("a counting source failure stops synchronous suffix flow", () => {
        const bank = { ...instrument(), version: 99 };
        load({ banks: [bank], counter: "notecounter2" });
        cy.window().then(async win => {
            observed = await observe(win);
            const { activity, logo } = observed;
            const turtle = activity.blocks.blockList.find(
                b => b && !b.trash && b.name === "start"
            ).value;
            const counter = activity.blocks.blockList.findIndex(
                b => b && !b.trash && b.name === "notecounter2"
            );
            logo.initTurtle(turtle);
            logo.stopTurtle = false;
            logo.boxes = { suffix: 0 };
            const suffix = Cypress.sinon.spy(activity.blocks.protoBlockDict.storein, "flow");
            logo.parseArg(logo, turtle, counter, null);
            expect(suffix.called).to.equal(false);
            expect(logo.stopTurtle).to.equal(true);
            expect(activity.turtles.running()).to.equal(false);
            expect(observed.trace.decodes).to.have.length(0);
            expect(observed.trace.attacks).to.have.length(0);
        });
    });

    it("a Step source failure stops both turtle queues", () => {
        load({ banks: [{ ...instrument(), version: 99 }, instrument()] });
        cy.window().then(async win => {
            await win.Tone.start();
            observed = await observe(win);
            observed.logo.boxes = { suffix: 0 };
            observed.activity.toolbarController.runStep();
        });
        cy.wrap(null).should(() =>
            expect(observed.logo._executionRequest?.queuesReady).to.equal(true)
        );
        cy.then(() => observed.activity.toolbarController.runStep());
        cy.then(() => {
            expect(observed.errors.called).to.equal(true);
            expect(observed.activity.turtles.running()).to.equal(false);
            expect(observed.logo.stepQueue).to.deep.equal({});
            expect(observed.logo.boxes.suffix).to.equal(0);
            expect(observed.trace.attacks).to.have.length(0);
        });
    });

    for (const late of ["value", "turtle"]) {
        it("refuses a runtime-unprepared pair without score-time decoding: " + late, () => {
            load({
                nested: late === "value",
                mid: late === "turtle",
                companion: late === "turtle"
            });
            cy.window().then(async win => {
                await win.Tone.start();
                observed = await observe(win);
                const { activity, logo, synth } = observed;
                const call = activity.blocks.blockList.findIndex(
                    b => b && !b.trash && b.name === "nameddoArg"
                );
                const bank = activity.blocks.blockList.find(
                    b => b && !b.trash && b.name === "multisample"
                ).value;
                if (late === "value") {
                    const run = logo.runFromBlockNow;
                    let injected = false;
                    Cypress.sinon.stub(logo, "runFromBlockNow").callsFake(function (...args) {
                        if (args[2] === call && !injected) {
                            injected = true;
                            logo.boxes.saved = JSON.parse(JSON.stringify(bank));
                        }
                        return run.apply(this, args);
                    });
                }
                logo.boxes = { suffix: 0, outerSuffix: 0, outerHit: 0, innerHit: 0 };
                logo.runLogoCommands();
                expect(synth.multisampleBytes).to.equal(0);
            });
            cy.wrap(null).should(() => {
                expect(observed.errors.lastCall.args[0])
                    .to.include("not prepared for this run")
                    .and.include("Program strings");
                expect(observed.trace.decodes).to.have.length(2);
                expect(observed.trace.attacks).to.have.length(0);
                expect(observed.logo.boxes.suffix).to.equal(0);
                expect(observed.synth.multisampleBytes).to.equal(0);
                expect(observed.activity.turtles.running()).to.equal(false);
            });
            if (late === "turtle") {
                cy.then(() => observed.logo.runLogoCommands());
                cy.wrap(null).should(() => {
                    expect(observed.errors.callCount).to.equal(2);
                    expect(observed.trace.decodes).to.have.length(4);
                    expect(observed.trace.attacks).to.have.length(0);
                    expect(observed.synth.multisampleBytes).to.equal(0);
                });
            }
        });
    }

    it("admits concurrent conservative owners against one combined budget", () => {
        const bank = instrument();
        bank.samples = bank.samples.slice(0, 1);
        load({ banks: [bank, JSON.parse(JSON.stringify(bank))] });
        cy.window().then(async win => {
            await win.Tone.start();
            observed = await observe(win);
            const nativeLoad = win.Tone.ToneAudioBuffer.load.wrappedMethod;
            win.Tone.ToneAudioBuffer.load.restore();
            Cypress.sinon.stub(win.Tone.ToneAudioBuffer, "load").callsFake(async function (
                ...args
            ) {
                const audio = await nativeLoad.apply(this, args);
                if (!String(args[0]).startsWith("data:")) return audio;
                // Native controlled PCM admission, not claimed as this WAV's decoded size.
                return new win.AudioBuffer({
                    length: 5 * 1024 * 1024,
                    numberOfChannels: 1,
                    sampleRate: 48000
                });
            });
            observed.logo.boxes = { suffix: 0 };
            observed.logo.runLogoCommands();
        });
        cy.wrap(null).should(() => {
            expect(observed.errors.lastCall.args[0])
                .to.include("memory limit")
                .and.include("low.wav");
            expect(observed.trace.dispatch).to.have.length(0);
            expect(observed.trace.ready.length).to.be.at.most(3);
            expect(observed.synth.multisampleBytes).to.equal(0);
            expect(observed.logo.boxes.suffix).to.equal(0);
        });
    });

    for (const outcome of ["success", "failure"]) {
        it("Stop cancels delayed toolbar audio unlock " + outcome, () => {
            load();
            cy.window().then(async win => {
                observed = await observe(win);
                const { activity, logo, synth } = observed;
                logo.boxes = { suffix: 0 };
                let settle;
                cy.stub(synth, "startAudio").returns(
                    new win.Promise((resolve, reject) => {
                        settle = () =>
                            outcome === "success" ? resolve() : reject(new Error("unlock failed"));
                    })
                );
                activity._doFastButton();
                activity._doHardStopButton(false);
                settle();
                await new win.Promise(resolve => win.setTimeout(resolve, 0));
                expect(logo._executionRequest).to.equal(null);
                expect(observed.trace.dispatch).to.have.length(0);
                expect(logo.boxes.suffix).to.equal(0);
                synth.startAudio.restore();
                activity._doFastButton();
            });
            cy.window({ timeout: 20000 }).should(() => {
                expect(observed.logo.boxes.suffix).to.equal(1);
                expect(observed.trace.attacks).to.have.length(3);
            });
        });
    }

    for (const outcome of ["success", "failure"]) {
        it("Stop prevents late optional startup callback " + outcome, () => {
            load();
            let callbacks;
            cy.window().then(async win => {
                observed = await observe(win);
                const loadModule = win.requirejs;
                Cypress.sinon
                    .stub(win, "requirejs")
                    .callsFake(function (modules, success, failure) {
                        if (modules.includes("utils/performanceTracker")) {
                            callbacks = { success, failure };
                            return;
                        }
                        return loadModule.apply(this, arguments);
                    });
                win.DEBUG_PERFORMANCE = true;
                observed.logo.boxes = { suffix: 0 };
                observed.logo.runLogoCommands();
                expect(callbacks).to.be.an("object");
                observed.logo.doStopTurtles();
                callbacks[outcome]();
                expect(observed.trace.decodes).to.have.length(0);
                expect(observed.trace.dispatch).to.have.length(0);
                expect(observed.logo.stopTurtle).to.equal(true);
                win.DEBUG_PERFORMANCE = false;
            });
        });
    }

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
                if (options.nested) expect(observed.logo.boxes.outerSuffix).to.equal(1);
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
            cy.wrap(null).should(() => expect(observed.trace.decodes).to.have.length(1));
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
            if (mutation === "equal replacement") cy.wait(800);
            cy.wrap(null).should(() => {
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
        "opaque",
        "invalid"
    ]) {
        it("respects conservative startup scope for " + candidate, () => {
            const unused = instrument();
            unused.name = candidate;
            if (candidate === "unused undecodable")
                unused.samples[0].data = "data:audio/wav;base64,UklGRgQAAABXQVZF";
            if (candidate === "unused budget failure")
                unused.samples[0].data = recording(200, 3, 640);
            if (candidate === "opaque") unused.version = 99;
            if (candidate === "invalid") unused.samples = [];
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
                    expect(observed.trace.decodes).to.have.length(
                        ["opaque", "invalid"].includes(candidate) ? 2 : 4
                    );
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
