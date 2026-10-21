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
function recording(frequency, harmonic) {
    const rate = 8000;
    const frames = 2000;
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

describe("Multisample audio foundation", () => {
    before(() => {
        cy.visit("http://127.0.0.1:3000");
        cy.waitForAppReady();
    });

    it("decodes real WAVs and renders the selected root at the requested pitch", () => {
        cy.window().then({ timeout: 60000 }, async win => {
            const synth = win.ActivityContext.getActivity().logo.synth;
            const tone = win.Tone;
            const originalContext = tone.getContext();
            const descriptor = {
                type: "multisample",
                version: 1,
                name: "Root selection fixture",
                samples: [
                    { name: "low.wav", root: "C3", data: recording(130.8127826502993, 0) },
                    { name: "middle.wav", root: "C4", data: recording(261.6255653005986, 2) },
                    { name: "high.wav", root: "C5", data: recording(523.2511306011972, 3) }
                ]
            };
            try {
                for (const [note, harmonic] of [
                    ["C3", 0],
                    ["F3", 0],
                    ["F#3", 2],
                    ["G3", 2],
                    ["C4", 2],
                    ["C5", 3],
                    ["C6", 3]
                ]) {
                    synth.disposeAllInstruments();
                    const rendered = await tone.Offline(
                        async () => {
                            const handle = synth.registerMultisample(descriptor);
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
                }
            } finally {
                synth.disposeAllInstruments();
                tone.setContext(originalContext);
            }
        });
    });
});
