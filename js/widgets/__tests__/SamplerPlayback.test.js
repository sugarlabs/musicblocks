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

const SamplerPlayback = require("../SamplerPlayback.js");

const METHODS = [
    "pause",
    "resume",
    "_playReferencePitch",
    "_playSample",
    "_waitAndPlaySample",
    "_playDelayedSample",
    "_waitAndEndPlaying",
    "_endPlaying",
    "reconnectSynthsToAnalyser"
];
const DEPS = {
    ICONSIZE: 32,
    MAJORSCALE: [0, 2, 4, 5, 7, 9, 11],
    REFERENCESAMPLE: "electronic synth",
    CENTERPITCHHERTZ: 220,
    SAMPLEWAITTIME: 500,
    SAMPLEANALYSERSIZE: 8192
};

const makeWidget = (deps = DEPS) => {
    const widget = {};
    SamplerPlayback.install.call(widget, deps);
    return widget;
};

describe("SamplerPlayback", () => {
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

    describe("pause", () => {
        beforeEach(() => {
            global._ = text => text;
        });

        const pausedWidget = deps => {
            const widget = makeWidget(deps);
            widget._clearWidgetTimeout = jest.fn();
            widget._playbackWaitTimeout = 11;
            widget._endPlayingTimeout = 12;
            widget.isMoving = true;
            widget.playBtn = document.createElement("div");
            return widget;
        };

        test("cancels the pending playback timers and stops", () => {
            const widget = pausedWidget();
            widget.pause();

            expect(widget._clearWidgetTimeout).toHaveBeenCalledWith(11);
            expect(widget._clearWidgetTimeout).toHaveBeenCalledWith(12);
            expect(widget._playbackWaitTimeout).toBeNull();
            expect(widget._endPlayingTimeout).toBeNull();
            expect(widget.isMoving).toBe(false);
        });

        test("draws the play icon at the injected ICONSIZE", () => {
            const widget = pausedWidget({ ...DEPS, ICONSIZE: 48 });
            widget.pause();

            const img = widget.playBtn.querySelector("img");
            expect(img.getAttribute("src")).toBe("header-icons/play-button.svg");
            expect(img.title).toBe("Play");
            expect(img.height).toBe(48);
        });

        test("reuses an existing play button image", () => {
            const widget = pausedWidget();
            const img = document.createElement("img");
            widget.playBtn.appendChild(img);

            widget.pause();

            expect(widget.playBtn.querySelectorAll("img")).toHaveLength(1);
            expect(img.getAttribute("src")).toBe("header-icons/play-button.svg");
        });
    });

    test("_endPlaying waits for the sample to finish", async () => {
        const widget = makeWidget();
        widget._waitAndEndPlaying = jest.fn(() => Promise.resolve());
        await widget._endPlaying();
        expect(widget._waitAndEndPlaying).toHaveBeenCalled();
    });
});
