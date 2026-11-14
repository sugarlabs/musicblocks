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

global.docById = id => document.getElementById(id);
global._ = text => text;
global.TimbreState = require("../TimbreState.js");
global.TimbrePanels = require("../TimbrePanels.js");
global.TimbreAudio = require("../TimbreAudio.js");
global.TimbreBlocks = require("../TimbreBlocks.js");
global.TimbreWidget = require("../timbre.js");

const TimbrePanels = global.TimbrePanels;
const METHODS = [
    "_resetTimbreTable",
    "_synth",
    "_oscillator",
    "_envelope",
    "_filter",
    "_createFilter",
    "_setupEventDelegation",
    "_cleanupEventListeners",
    "_addFilterListeners",
    "_updateFilters",
    "_setRolloffRadioChecked",
    "_addFilter",
    "_effects"
];

describe("TimbrePanels", () => {
    test("holds exactly the methods moved out of TimbreWidget", () => {
        const names = Object.getOwnPropertyNames(TimbrePanels.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on TimbreWidget.prototype", () => {
        expect(TimbreWidget.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(TimbreWidget.prototype[name]).toBe(TimbrePanels.prototype[name]);
            expect(Object.getOwnPropertyDescriptor(TimbreWidget.prototype, name).enumerable).toBe(
                false
            );
        }
    });

    describe("_resetTimbreTable", () => {
        test("resets timbreTableDiv styles and recreates #timbreTable container", () => {
            const tableDiv = document.createElement("div");
            const mockWidget = {
                timbreTableDiv: tableDiv
            };

            const container = TimbrePanels.prototype._resetTimbreTable.call(mockWidget);

            expect(container).toBeDefined();
            expect(container.id).toBe("timbreTable");
            expect(tableDiv.style.display).toBe("inline");
            expect(tableDiv.style.visibility).toBe("visible");
            expect(tableDiv.style.backgroundColor).toBe("white");
            expect(tableDiv.contains(container)).toBe(true);
        });

        test("cleans up event listeners before replacing container", () => {
            const tableDiv = document.createElement("div");
            const cleanupSpy = jest.fn();
            const mockWidget = {
                timbreTableDiv: tableDiv,
                _cleanupEventListeners: cleanupSpy
            };

            TimbrePanels.prototype._resetTimbreTable.call(mockWidget);

            expect(cleanupSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("_setupEventDelegation", () => {
        test("stops propagation for handled filter interactions", () => {
            const table = document.createElement("div");
            table.id = "timbreTable";
            document.body.appendChild(table);

            const filterButtonCell = document.createElement("div");
            filterButtonCell.id = "filterButtonCell";
            document.body.appendChild(filterButtonCell);

            const mockWidget = {
                _cleanupEventListeners: jest.fn(),
                instrumentName: "custom",
                _update: jest.fn(),
                _playNote: jest.fn()
            };

            global.instrumentsFilters = [{ custom: [{ filterRolloff: -12 }] }];

            TimbrePanels.prototype._setupEventDelegation.call(mockWidget);

            const stopPropagation = jest.fn();
            const radioEvent = {
                target: { id: "radio0", value: "-24" },
                type: "click",
                stopPropagation
            };

            mockWidget._eventHandler(radioEvent);

            expect(stopPropagation).toHaveBeenCalledTimes(1);
            expect(mockWidget._playNote).toHaveBeenCalledWith("G4", 1 / 8);

            table.remove();
            filterButtonCell.remove();
        });
    });

    describe("_cleanupEventListeners", () => {
        test("removes registered event listeners and resets the store", () => {
            const removeEventListener = jest.fn();
            const elem = { removeEventListener };
            const handler = jest.fn();

            const mockWidget = {
                _eventListeners: {
                    element: elem,
                    listeners: [{ type: "change", handler }]
                }
            };

            TimbrePanels.prototype._cleanupEventListeners.call(mockWidget);

            expect(removeEventListener).toHaveBeenCalledWith("change", handler);
            expect(mockWidget._eventListeners).toEqual({});
        });
    });
});
