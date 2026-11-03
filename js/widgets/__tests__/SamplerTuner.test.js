/**
 * MusicBlocks
 *
 * @copyright 2026 Music Blocks Contributors
 *
 * @license
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

const SamplerTuner = require("../SamplerTuner.js");

const METHODS = [
    "toggleTuner",
    "applyCentsAdjustment",
    "stopPitchDetection",
    "makeTuner",
    "applyCentAdjustment"
];
const DEPS = undefined;

const makeWidget = (deps = DEPS) => {
    const widget = {};
    SamplerTuner.install.call(widget, deps);
    return widget;
};

describe("SamplerTuner", () => {
    test("install adds exactly the methods moved out of SampleWidget", () => {
        expect(Object.keys(makeWidget()).sort()).toEqual([...METHODS].sort());
    });

    test("each widget gets its own methods", () => {
        const first = makeWidget();
        const second = makeWidget();
        for (const name of METHODS) {
            expect(typeof first[name]).toBe("function");
            expect(first[name]).not.toBe(second[name]);
        }
    });

    test("applyCentsAdjustment sets the custom sample's playback rate", () => {
        global.TunerUtils = { calculatePlaybackRate: jest.fn(() => 1.5) };
        const sample = { playbackRate: { value: 1 } };
        global.instruments = [{ customsample_bell: sample }];
        const widget = makeWidget();
        Object.assign(widget, { sampleName: "bell", originalSampleName: "bell", centsValue: 30 });

        widget.applyCentsAdjustment();

        expect(global.TunerUtils.calculatePlaybackRate).toHaveBeenCalledWith(0, 30);
        expect(sample.playbackRate.value).toBe(1.5);
    });

    test("stopPitchDetection releases the microphone and the audio context", () => {
        global.cancelAnimationFrame = jest.fn();
        const track = { stop: jest.fn() };
        const close = jest.fn(() => Promise.resolve());
        const widget = makeWidget();
        Object.assign(widget, {
            isPitchDetectionRunning: true,
            pitchDetectionAnimationId: 9,
            pitchDetectionStream: { getTracks: () => [track] },
            pitchDetectionAudioContext: { close }
        });

        widget.stopPitchDetection();

        expect(widget.isPitchDetectionRunning).toBe(false);
        expect(global.cancelAnimationFrame).toHaveBeenCalledWith(9);
        expect(track.stop).toHaveBeenCalled();
        expect(close).toHaveBeenCalled();
        expect(widget.pitchDetectionStream).toBeNull();
        expect(widget.pitchDetectionAudioContext).toBeNull();
        expect(widget.pitchDetectionAnimationId).toBeNull();
    });

    test.each([
        [0, "---"],
        [65.41, "65.41"],
        [82.41, "82.41"],
        [440, "440.01"],
        [880, "880.02"]
    ])(
        "detects a %i Hz input without copying samples for each lag",
        async (frequency, expected) => {
            const samples = Float32Array.from(
                { length: 2048 },
                (_, i) => 0.5 * Math.sin((2 * Math.PI * frequency * i) / 48000)
            );
            const audioContext = {
                sampleRate: 48000,
                createMediaStreamSource: () => ({ connect: jest.fn() }),
                createAnalyser: () => ({ getFloatTimeDomainData: buffer => buffer.set(samples) }),
                close: jest.fn().mockResolvedValue()
            };
            const originalAudioContext = global.AudioContext;
            const originalMediaDevices = navigator.mediaDevices;
            global.AudioContext = jest.fn(() => audioContext);
            Object.defineProperty(navigator, "mediaDevices", {
                configurable: true,
                value: {
                    getUserMedia: jest.fn().mockResolvedValue({ getTracks: () => [] })
                }
            });
            const requestFrame = jest.spyOn(global, "requestAnimationFrame").mockReturnValue(1);
            global.TunerUtils = { frequencyToNote: jest.fn(() => ({ note: "A4", cents: 0 })) };
            const widget = makeWidget();
            Object.assign(widget, {
                isPitchDetectionRunning: false,
                pitchDetectionAnimationId: null,
                pitchDetectionStream: null,
                pitchDetectionAudioContext: null
            });
            widget.widgetWindow = { getWidgetBody: () => document.body };

            try {
                widget.makeTuner(400, 300);
                document.getElementById("start").click();
                await Promise.resolve();
                expect(requestFrame).toHaveBeenCalledTimes(1);
                const slice = jest.spyOn(Float32Array.prototype, "slice");

                requestFrame.mock.calls[0][0]();

                expect(slice).not.toHaveBeenCalled();
                expect(document.getElementById("pitch").textContent).toBe(expected);
            } finally {
                widget.stopPitchDetection();
                document.body.innerHTML = "";
                global.AudioContext = originalAudioContext;
                Object.defineProperty(navigator, "mediaDevices", { value: originalMediaDevices });
            }
        }
    );
});
