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

function amplitude(samples, frequency) {
    let real = 0;
    let imaginary = 0;
    // Inspect the steady part, away from attack/release envelopes.
    const start = 320;
    const end = 960;
    for (let i = start; i < end; i++) {
        const phase = (2 * Math.PI * frequency * i) / 8000;
        real += samples[i] * Math.cos(phase);
        imaginary += samples[i] * Math.sin(phase);
    }
    return (2 * Math.hypot(real, imaginary)) / (end - start);
}

function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((yes, no) => {
        resolve = yes;
        reject = no;
    });
    return { promise, resolve, reject };
}

async function flush() {
    for (let i = 0; i < 12; i++) await Promise.resolve();
}

function instrument() {
    return {
        type: "multisample",
        version: 1,
        name: "Root selection fixture",
        samples: [
            { name: "low.wav", root: "C3", data: recording(130.8127826502993, 0) },
            { name: "middle.wav", root: "C4", data: recording(261.6255653005986, 2) },
            { name: "high.wav", root: "C5", data: recording(523.2511306011972, 3) }
        ]
    };
}

describe("Multisample audio foundation", { testIsolation: true, retries: 0 }, () => {
    beforeEach(() => {
        cy.visit("http://127.0.0.1:3000");
        cy.waitForAppReady();
    });

    it("decodes real WAVs and renders the selected root at the requested pitch", () => {
        cy.window().then({ timeout: 60000 }, async win => {
            const synth = win.ActivityContext.getActivity().logo.synth;
            const tone = win.Tone;
            const originalContext = tone.getContext();
            const descriptor = instrument();
            const uneven = instrument();
            uneven.samples[1] = {
                name: "uneven.wav",
                root: "G#3",
                data: recording(207.65234878997256, 2)
            };
            expect(tone.version).to.equal("15.1.22");
            expect(tone.ToneAudioBuffer.baseUrl).to.equal("");
            let rendered;
            try {
                const regular = [
                    ["C2", 0],
                    ["C3", 0],
                    ["F3", 0],
                    ["F#3", 2],
                    ["G3", 2],
                    ["C4", 2],
                    ["C5", 3],
                    ["C6", 3],
                    [tone.Midi(53.49).toFrequency(), 0],
                    [tone.Midi(53.51).toFrequency(), 2],
                    [tone.Midi(54.49).toFrequency(), 2]
                ].map(([note, harmonic]) => [descriptor, note, harmonic]);
                for (const [value, note, harmonic] of regular.concat([
                    [uneven, "D#3", 0],
                    [uneven, "E3", 2],
                    [uneven, "F3", 2],
                    [uneven, "G#3", 2],
                    [uneven, ["C3", "G#3", "C5"], [0, 2, 3]]
                ])) {
                    synth.disposeAllInstruments();
                    rendered = await tone.Offline(
                        async () => {
                            const handle = synth.registerMultisample(value);
                            // loadSynth routes to the app's real-time Destination. Here,
                            // prepare through the same production loader, then route to
                            // the Offline context's destination explicitly.
                            const sampler = await synth.createSynth(0, handle, handle, null);
                            sampler.connect(tone.getDestination());
                            expect(sampler.loaded, "all roots decoded before publication").to.equal(
                                true
                            );
                            sampler.triggerAttackRelease(note, 0.16, 0.02);
                        },
                        0.25,
                        1,
                        8000
                    );
                    const samples = rendered.getChannelData(0);
                    if (Array.isArray(note)) {
                        for (let i = 0; i < note.length; i++) {
                            const frequency = tone.Frequency(note[i]).toFrequency();
                            const fundamental = amplitude(samples, frequency);
                            expect(fundamental, "chord pitch " + note[i]).to.be.greaterThan(0.1);
                            if (harmonic[i])
                                expect(
                                    amplitude(samples, frequency * harmonic[i]) / fundamental
                                ).to.be.within(0.3, 0.7);
                        }
                        rendered.dispose();
                        rendered = null;
                        continue;
                    }
                    const frequency = tone.Frequency(note).toFrequency();
                    const fundamental = amplitude(samples, frequency);
                    expect(
                        fundamental,
                        note + " fundamental at requested frequency"
                    ).to.be.greaterThan(0.1);
                    for (const partial of [2, 3]) {
                        const ratio = amplitude(samples, frequency * partial) / fundamental;
                        if (partial === harmonic) {
                            expect(ratio, note + " selected recording signature").to.be.within(
                                0.3,
                                0.7
                            );
                        } else {
                            expect(
                                ratio,
                                note + " does not use another root's recording"
                            ).to.be.lessThan(0.15);
                        }
                    }
                    rendered.dispose();
                    rendered = null;
                }
            } finally {
                if (rendered) rendered.dispose();
                synth.disposeAllInstruments();
                tone.setContext(originalContext);
            }
        });
    });

    for (const status of ["pending", "failed", "stopped", "timed out"]) {
        it("keeps " + status + " preparation outside the installed Tone queue", () => {
            cy.clock(Date.now(), ["setTimeout", "clearTimeout"]).then(clock => {
                cy.window().then({ timeout: 60000 }, async win => {
                    const synth = win.ActivityContext.getActivity().logo.synth;
                    const tone = win.Tone;
                    const originalFetch = win.fetch;
                    const originalLoad = tone.ToneAudioBuffer.load;
                    const nativeSettlements = [];
                    const gate = deferred();
                    const entered = deferred();
                    const descriptor = instrument();
                    let hold = true;
                    let loading;
                    try {
                        await tone.start();
                        await tone.loaded();
                        expect(tone.ToneAudioBuffer.baseUrl).to.equal("");
                        tone.ToneAudioBuffer.load = function (...args) {
                            const promise = originalLoad.apply(this, args);
                            nativeSettlements.push(
                                promise.then(
                                    () => undefined,
                                    () => undefined
                                )
                            );
                            return promise;
                        };
                        win.fetch = function (url, ...args) {
                            if (hold && url === descriptor.samples[1].data) {
                                entered.resolve();
                                return gate.promise.then(() =>
                                    originalFetch.call(win, url, ...args)
                                );
                            }
                            return originalFetch.call(win, url, ...args);
                        };
                        const alias = synth.registerMultisample(descriptor);
                        loading = synth.loadSynth(0, alias).then(
                            sampler => sampler,
                            error => error
                        );
                        await entered.promise;
                        expect(
                            synth.multisampleBytes,
                            "first recording admitted"
                        ).to.be.greaterThan(0);
                        expect(synth.getPreparedMultisample(0, descriptor)).to.equal(null);
                        let queueSettled = false;
                        const queue = tone.loaded().then(() => {
                            queueSettled = true;
                        });
                        await flush();
                        expect(queueSettled, "real loaded() ignores feature decode").to.equal(true);
                        await queue;
                        const legacy = await synth.loadSynth(0, "sine");
                        const attack = Cypress.sinon.spy(legacy, "triggerAttackRelease");
                        await synth.trigger(0, "C4", 0.02, "sine", null, null, false, 0);
                        expect(attack.calledOnce, "unrelated legacy voice plays").to.equal(true);
                        hold = false;
                        if (status === "pending") gate.resolve();
                        if (status === "failed") gate.reject(new Error("held load failed"));
                        if (status === "stopped") synth.releaseMultisample(0, alias);
                        if (status === "timed out") clock.tick(30000);
                        const outcome = await loading;
                        if (status === "pending") {
                            expect(outcome.loaded).to.equal(true);
                            synth.releaseMultisample(0, alias);
                        } else {
                            expect(outcome.message).to.include(
                                status === "failed"
                                    ? "middle.wav"
                                    : status === "stopped"
                                      ? "cancelled"
                                      : "timed out"
                            );
                            if (status === "stopped") expect(outcome.name).to.equal("AbortError");
                        }
                        expect(synth.multisampleBytes).to.equal(0);
                        const fresh = await synth.loadSynth(0, alias);
                        expect(fresh.loaded, "retry does not wait for abandoned work").to.equal(
                            true
                        );
                        const calls = nativeSettlements.length;
                        gate.resolve();
                        await Promise.all(nativeSettlements);
                        await flush();
                        expect(
                            nativeSettlements.length,
                            "no next recording from old attempt"
                        ).to.equal(calls);
                        expect(await synth.loadSynth(0, alias)).to.equal(fresh);
                        await tone.loaded();
                    } finally {
                        hold = false;
                        gate.resolve();
                        synth.disposeAllInstruments();
                        if (loading) await loading;
                        await Promise.all(nativeSettlements);
                        win.fetch = originalFetch;
                        tone.ToneAudioBuffer.load = originalLoad;
                    }
                    expect(synth.multisampleBytes).to.equal(0);
                });
            });
        });
    }

    it("plays ready instruments while real unrelated downloads are held or rejected", () => {
        cy.window().then({ timeout: 60000 }, async win => {
            const synth = win.ActivityContext.getActivity().logo.synth;
            const tone = win.Tone;
            const originalFetch = win.fetch;
            const gate = deferred();
            let unrelated;
            let buffer;
            try {
                await tone.start();
                await tone.loaded();
                const alias = synth.registerMultisample(instrument());
                await synth.loadSynth(0, alias);
                const sampler = await synth.loadSynth(1, alias);
                const attack = Cypress.sinon.spy(sampler, "triggerAttackRelease");
                await synth.createSynth(0, alias, "sine", null);
                const legacy = await synth.loadSynth(0, alias);
                const legacyAttack = Cypress.sinon.spy(legacy, "triggerAttackRelease");
                win.fetch = function (url, ...args) {
                    return url === "held-unrelated.wav"
                        ? gate.promise
                        : originalFetch.call(win, url, ...args);
                };
                buffer = new tone.ToneAudioBuffer();
                unrelated = buffer.load("held-unrelated.wav").catch(error => error);
                let queueSettled = false;
                const queue = tone.loaded().then(
                    () => {
                        queueSettled = true;
                    },
                    () => {
                        queueSettled = true;
                    }
                );
                const legacyPlaying = synth.trigger(0, "C4", 0.02, alias, null, null, false, 0);
                for (const distortion of [null, 0, 0.2]) {
                    const effects =
                        distortion === null
                            ? null
                            : {
                                  vibratoIntensity: 0,
                                  distortionAmount: distortion,
                                  tremoloFrequency: 0,
                                  rate: 0,
                                  chorusRate: 0
                              };
                    let played = false;
                    const playing = synth
                        .trigger(1, ["C3", "E4"], 0.02, alias, effects, null, false, 0)
                        .then(() => {
                            played = true;
                        });
                    await flush();
                    expect(played, "ready source bypasses actual queued download").to.equal(true);
                    await playing;
                }
                expect(attack.callCount).to.equal(3);
                expect(attack.firstCall.args[0], "other turtle retains its chord").to.deep.equal([
                    "C3",
                    "E4"
                ]);
                expect(queueSettled).to.equal(false);
                expect(legacyAttack.called).to.equal(false);
                gate.reject(new Error("unrelated download failed"));
                await unrelated;
                await queue;
                await legacyPlaying;
                expect(legacyAttack.called, "legacy loading error behavior retained").to.equal(
                    false
                );
                await synth.trigger(1, "C4", 0.02, alias, null, null, false, 0);
                expect(attack.callCount).to.equal(4);
                let error;
                try {
                    await synth.trigger(
                        1,
                        tone.Midi(180).toFrequency(),
                        0.02,
                        alias,
                        null,
                        null,
                        false,
                        0
                    );
                } catch (failure) {
                    error = failure;
                }
                expect(error.message)
                    .to.include("Root selection fixture")
                    .and.include("No available buffers");
            } finally {
                gate.reject(new Error("test cleanup"));
                if (unrelated) await unrelated;
                if (buffer) buffer.dispose();
                win.fetch = originalFetch;
                synth.disposeAllInstruments();
            }
        });
    });

    it("rejects undecodable WAVs and resampled PCM overflow atomically, then retries", () => {
        cy.window().then({ timeout: 60000 }, async win => {
            const synth = win.ActivityContext.getActivity().logo.synth;
            const tone = win.Tone;
            const originalContext = tone.getContext();
            let rendered;
            try {
                const invalid = instrument();
                invalid.samples[1].data = "data:audio/wav;base64,UklGRgQAAABXQVZF";
                const saved = JSON.stringify(invalid);
                const alias = synth.registerMultisample(invalid);
                const outcome = await synth.loadSynth(0, alias).catch(error => error);
                expect(outcome.message).to.include("middle.wav");
                expect(synth.multisampleBytes).to.equal(0);
                expect(synth.getPreparedMultisample(0, invalid)).to.equal(null);
                expect(JSON.stringify(invalid)).to.equal(saved);
                rendered = await tone.Offline(
                    async () => {
                        const large = instrument();
                        for (const sample of large.samples)
                            sample.data = recording(130.8127826502993, 0, 499978);
                        const handle = synth.registerMultisample(large);
                        const failure = await synth
                            .createSynth(0, handle, handle, null)
                            .catch(error => error);
                        expect(failure.message).to.include("memory limit");
                        expect(synth.multisampleBytes).to.equal(0);
                        expect(synth.getPreparedMultisample(0, large)).to.equal(null);
                        const retry = synth.registerMultisample(instrument());
                        expect((await synth.createSynth(0, retry, retry, null)).loaded).to.equal(
                            true
                        );
                        synth.releaseMultisample(0, retry);
                        expect(synth.multisampleBytes).to.equal(0);
                    },
                    0.01,
                    1,
                    48000
                );
            } finally {
                if (rendered) rendered.dispose();
                synth.disposeAllInstruments();
                tone.setContext(originalContext);
            }
        });
    });
});
