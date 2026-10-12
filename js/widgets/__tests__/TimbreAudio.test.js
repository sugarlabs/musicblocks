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

global.TimbreState = require("../TimbreState.js");
global.TimbrePanels = require("../TimbrePanels.js");
global.TimbreAudio = require("../TimbreAudio.js");
global.TimbreBlocks = require("../TimbreBlocks.js");
global.TimbreWidget = require("../timbre.js");

const TimbreAudio = global.TimbreAudio;
const METHODS = ["_playNote", "_play"];

describe("TimbreAudio", () => {
    test("holds exactly the methods moved out of TimbreWidget", () => {
        const names = Object.getOwnPropertyNames(TimbreAudio.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on TimbreWidget.prototype", () => {
        expect(TimbreWidget.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(TimbreWidget.prototype[name]).toBe(TimbreAudio.prototype[name]);
            expect(Object.getOwnPropertyDescriptor(TimbreWidget.prototype, name).enumerable).toBe(
                false
            );
        }
    });

    describe("_playNote", () => {
        let setMasterVolume, trigger, mockWidget;

        beforeEach(() => {
            global.Singer = { masterVolume: [1], defaultBPMFactor: 0.75 };
            global.last = arr => arr[arr.length - 1];
            global.instrumentsFilters = [{ custom: [] }];
            global.instrumentsEffects = [{ custom: {} }];
            global.docById = jest.fn(() => ({ checked: false, value: 0 }));

            setMasterVolume = jest.fn();
            trigger = jest.fn();

            mockWidget = {
                instrumentName: "custom",
                activity: {
                    logo: {
                        synth: { setMasterVolume, trigger }
                    }
                }
            };
        });

        test("calls synth.trigger with correct note, duration, instrument, effects, and filters", () => {
            TimbreAudio.prototype._playNote.call(mockWidget, "C4", 0.5);

            expect(setMasterVolume).toHaveBeenCalledWith(1);
            expect(trigger).toHaveBeenCalledWith(
                0,
                "C4",
                0.75 * 0.5,
                "custom",
                expect.objectContaining({ doVibrato: false }),
                []
            );
        });

        test("applies vibratoActive effects when vibratoActive is set", () => {
            global.instrumentsEffects = [
                {
                    custom: {
                        vibratoActive: true,
                        vibratoFrequency: 6,
                        vibratoIntensity: 0.5
                    }
                }
            ];

            TimbreAudio.prototype._playNote.call(mockWidget, "G4", 0.25);

            expect(trigger).toHaveBeenCalledWith(
                0,
                "G4",
                0.75 * 0.25,
                "custom",
                expect.objectContaining({
                    doVibrato: true,
                    vibratoFrequency: 6,
                    vibratoIntensity: 0.5
                }),
                []
            );
        });

        test("triggers with null effects when instrument is not in instrumentsFilters", () => {
            global.instrumentsFilters = [{}];

            TimbreAudio.prototype._playNote.call(mockWidget, "E4", 1);

            expect(trigger).toHaveBeenCalledWith(0, "E4", 0.75 * 1, "custom", null, null);
        });
    });

    describe("_play", () => {
        let setMasterVolume, stop, resetSynth, clearWidgetTimeout, setWidgetTimeout, mockWidget;

        beforeEach(() => {
            global.Singer = { masterVolume: [1], defaultBPMFactor: 0.75 };
            global.last = arr => arr[arr.length - 1];
            global.instrumentsFilters = [{ custom: [] }];
            global.instrumentsEffects = [{ custom: {} }];
            global._ = s => s;
            global.document = {
                createElement: jest.fn(() => ({
                    src: "",
                    title: "",
                    alt: "",
                    setAttribute: jest.fn()
                })),
                createTextNode: jest.fn(() => ({}))
            };

            setMasterVolume = jest.fn();
            stop = jest.fn();
            resetSynth = jest.fn();
            clearWidgetTimeout = jest.fn();
            setWidgetTimeout = jest.fn(() => 42);

            mockWidget = {
                instrumentName: "custom",
                _playing: false,
                _previewTimerId: null,
                notesToPlay: [
                    ["G4", 0.25],
                    ["E4", 0.25],
                    ["G4", 0.5]
                ],
                playButton: {
                    textContent: "",
                    appendChild: jest.fn()
                },
                activity: {
                    logo: {
                        synth: { setMasterVolume, trigger: jest.fn(), stop },
                        resetSynth
                    }
                },
                _clearWidgetTimeout: clearWidgetTimeout,
                _setWidgetTimeout: setWidgetTimeout,
                _playNote: jest.fn()
            };
        });

        test("toggles _playing from false to true and starts playback loop", () => {
            TimbreAudio.prototype._play.call(mockWidget);

            expect(mockWidget._playing).toBe(true);
            expect(resetSynth).toHaveBeenCalledWith(0);
            expect(mockWidget._playNote).toHaveBeenCalledWith("G4", 0.25);
        });

        test("stop path: clears _previewTimerId and stops the synth", () => {
            mockWidget._playing = true;
            mockWidget._previewTimerId = 99;

            TimbreAudio.prototype._play.call(mockWidget);

            expect(mockWidget._playing).toBe(false);
            expect(clearWidgetTimeout).toHaveBeenCalledWith(99);
            expect(mockWidget._previewTimerId).toBeNull();
            expect(setMasterVolume).toHaveBeenCalledWith(0);
            expect(stop).toHaveBeenCalled();
        });
    });
});
