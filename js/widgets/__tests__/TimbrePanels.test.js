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
            const oldTable = document.createElement("div");
            oldTable.id = "timbreTable";
            tableDiv.appendChild(oldTable);

            let oldTableAttachedDuringCleanup = false;
            const mockWidget = {
                timbreTableDiv: tableDiv,
                _cleanupEventListeners: jest.fn(() => {
                    oldTableAttachedDuringCleanup = tableDiv.contains(oldTable);
                })
            };

            const newTable = TimbrePanels.prototype._resetTimbreTable.call(mockWidget);

            expect(mockWidget._cleanupEventListeners).toHaveBeenCalledTimes(1);
            expect(oldTableAttachedDuringCleanup).toBe(true);
            expect(tableDiv.contains(oldTable)).toBe(false);
            expect(newTable).not.toBe(oldTable);
            expect(tableDiv.contains(newTable)).toBe(true);
        });

        test("unregisters real listeners so events on detached container are not handled", () => {
            const tableDiv = document.createElement("div");
            const oldTable = document.createElement("div");
            oldTable.id = "timbreTable";
            tableDiv.appendChild(oldTable);

            const handler = jest.fn();
            oldTable.addEventListener("change", handler);

            const mockWidget = {
                timbreTableDiv: tableDiv,
                _cleanupEventListeners: TimbrePanels.prototype._cleanupEventListeners,
                _eventListeners: {
                    element: oldTable,
                    listeners: [{ type: "change", handler }]
                }
            };

            TimbrePanels.prototype._resetTimbreTable.call(mockWidget);

            expect(mockWidget._eventListeners).toEqual({});
            oldTable.dispatchEvent(new Event("change"));
            expect(handler).not.toHaveBeenCalled();
        });
    });

    describe("_setupEventDelegation", () => {
        test("contains bubbling and updates filter state for dispatched DOM events", () => {
            const parent = document.createElement("div");
            document.body.appendChild(parent);

            const table = document.createElement("div");
            table.id = "timbreTable";
            parent.appendChild(table);

            const filterButtonCell = document.createElement("div");
            filterButtonCell.id = "filterButtonCell";
            document.body.appendChild(filterButtonCell);

            const radio = document.createElement("input");
            radio.id = "radio0";
            radio.type = "radio";
            radio.value = "-24";
            table.appendChild(radio);

            const select = document.createElement("select");
            select.id = "sel0";
            const opt = document.createElement("option");
            opt.value = "highpass";
            select.appendChild(opt);
            table.appendChild(select);

            const slider = document.createElement("input");
            slider.id = "myRangeF0";
            slider.type = "range";
            slider.max = "7050";
            slider.value = "440";
            table.appendChild(slider);

            const span = document.createElement("span");
            span.id = "myspanF0";
            table.appendChild(span);

            const unrelatedBtn = document.createElement("button");
            unrelatedBtn.id = "unrelatedBtn";
            table.appendChild(unrelatedBtn);

            const parentListener = jest.fn();
            parent.addEventListener("click", parentListener);
            parent.addEventListener("change", parentListener);
            parent.addEventListener("input", parentListener);

            const mockWidget = {
                _cleanupEventListeners: jest.fn(),
                instrumentName: "custom",
                _update: jest.fn(),
                _playNote: jest.fn(),
                activity: { errorMsg: jest.fn() }
            };

            global.instrumentsFilters = [
                {
                    custom: [{ filterType: "lowpass", filterRolloff: -12, filterFrequency: 220 }]
                }
            ];

            TimbrePanels.prototype._setupEventDelegation.call(mockWidget);

            // 1. Radio click event is contained and updates rolloff
            radio.dispatchEvent(new Event("click", { bubbles: true }));
            expect(parentListener).not.toHaveBeenCalled();
            expect(global.instrumentsFilters[0]["custom"][0]["filterRolloff"]).toBe(-24);
            expect(mockWidget._update).toHaveBeenCalledWith(0, "-24", 1);
            expect(mockWidget._playNote).toHaveBeenCalledWith("G4", 1 / 8);

            // 2. Select change event is contained and updates filter type
            select.value = "highpass";
            select.dispatchEvent(new Event("change", { bubbles: true }));
            expect(parentListener).not.toHaveBeenCalled();
            expect(global.instrumentsFilters[0]["custom"][0]["filterType"]).toBe("highpass");
            expect(mockWidget._update).toHaveBeenCalledWith(0, "highpass", 0);

            // 3. Slider input event is contained and updates frequency & span
            slider.value = "880";
            slider.dispatchEvent(new Event("input", { bubbles: true }));
            expect(parentListener).not.toHaveBeenCalled();
            expect(span.textContent).toBe("880");
            expect(global.instrumentsFilters[0]["custom"][0]["filterFrequency"]).toBe(880);
            expect(mockWidget._update).toHaveBeenCalledWith(0, "880", 2);

            // 4. Unrelated event still bubbles to parent
            unrelatedBtn.dispatchEvent(new Event("click", { bubbles: true }));
            expect(parentListener).toHaveBeenCalledTimes(1);

            parent.remove();
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
