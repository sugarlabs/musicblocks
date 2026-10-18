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
});
