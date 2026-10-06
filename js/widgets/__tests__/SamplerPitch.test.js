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

const SamplerPitch = require("../SamplerPitch.js");

const METHODS = [
    "_usePitch",
    "_useAccidental",
    "_useOctave",
    "_parseSamplePitch",
    "_calculateFrequency",
    "_updateSamplePitchValues",
    "setTimbre",
    "getPitchName"
];
const DEPS = {
    EXPORTACCIDENTALNAMES: ["𝄫", "♭", "", "♯", "𝄪"],
    ACCIDENTALNAMES: ["𝄫", "♭", "♮", "♯", "𝄪"],
    SOLFEGENAMES: ["do", "re", "mi", "fa", "sol", "la", "ti", "do"],
    PITCHNAMES: ["C", "D", "E", "F", "G", "A", "B"],
    MAJORSCALE: [0, 2, 4, 5, 7, 9, 11]
};

const makeWidget = (deps = DEPS) => {
    const widget = {};
    SamplerPitch.install.call(widget, deps);
    return widget;
};

describe("SamplerPitch", () => {
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

    beforeEach(() => {
        global.SHARP = "♯";
        global.FLAT = "♭";
        global.DOUBLESHARP = "𝄪";
        global.DOUBLEFLAT = "𝄫";
    });

    test("_usePitch, _useAccidental and _useOctave set the pitch centres", () => {
        const widget = makeWidget();
        widget._usePitch("la");
        widget._useAccidental("♯");
        widget._useOctave("5");
        expect([widget.pitchCenter, widget.accidentalCenter, widget.octaveCenter]).toEqual([
            5, 3, 5
        ]);
    });

    test("unknown names fall back to do and natural", () => {
        const widget = makeWidget();
        widget._usePitch("xx");
        widget._useAccidental("?");
        expect(widget.pitchCenter).toBe(0);
        expect(widget.accidentalCenter).toBe(2);
    });

    test("uses the constructor's solfege list, not a global one", () => {
        const widget = makeWidget({ ...DEPS, SOLFEGENAMES: ["la", "do"] });
        widget._usePitch("la");
        expect(widget.pitchCenter).toBe(0);
    });

    test("_calculateFrequency gives 440 Hz for A4 and 261 Hz for C4", () => {
        const widget = makeWidget();
        Object.assign(widget, { pitchCenter: 5, accidentalCenter: 2, octaveCenter: 4 });
        expect(widget._calculateFrequency()).toBe(440);
        Object.assign(widget, { pitchCenter: 0 });
        expect(widget._calculateFrequency()).toBe(261);
    });

    test("_parseSamplePitch reads the pitch, accidental and octave back", () => {
        const widget = makeWidget();
        Object.assign(widget, { samplePitch: "sol♭", sampleOctave: 3 });
        widget._parseSamplePitch();
        expect([widget.pitchCenter, widget.accidentalCenter, widget.octaveCenter]).toEqual([
            4, 1, 3
        ]);
    });

    test("_updateSamplePitchValues and getPitchName write the chosen pitch", () => {
        const widget = makeWidget();
        Object.assign(widget, {
            pitchCenter: 4,
            accidentalCenter: 3,
            octaveCenter: 4,
            pitchBtn: {},
            frequencyDisplay: {}
        });

        widget._updateSamplePitchValues();
        expect([widget.samplePitch, widget.sampleOctave]).toEqual(["sol♯", "4"]);

        expect(widget.getPitchName()).toBe("G♯4");
        expect(widget.pitchBtn.value).toBe("G♯4");
        expect(widget.frequencyDisplay.textContent).toBe("415 Hz");
    });
});
