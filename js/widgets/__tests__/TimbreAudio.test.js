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
        beforeEach(() => {
            global.Singer = { masterVolume: [1] };
            global.last = arr => arr[arr.length - 1];
            global.instrumentsFilters = [{ custom: [] }];
            global.instrumentsEffects = [{ custom: {} }];
            global.docById = jest.fn(() => ({
                checked: false,
                value: 0
            }));
        });

        test("calls synth.setMasterVolume and plays sound", () => {
            const setMasterVolume = jest.fn();
            const trigger = jest.fn();

            const mockWidget = {
                instrumentName: "custom",
                activity: {
                    logo: {
                        synth: {
                            setMasterVolume,
                            trigger
                        }
                    }
                }
            };

            TimbreAudio.prototype._playNote.call(mockWidget, "C4", 0.5);

            expect(setMasterVolume).toHaveBeenCalledWith(1);
            expect(trigger).toHaveBeenCalled();
        });
    });
});
