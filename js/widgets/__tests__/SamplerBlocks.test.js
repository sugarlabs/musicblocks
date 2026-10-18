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

const SamplerBlocks = require("../SamplerBlocks.js");

const METHODS = ["_updateBlocks", "__save", "_saveSample", "_get_save_lock"];
const DEPS = undefined;

const makeWidget = (deps = DEPS) => {
    const widget = {};
    SamplerBlocks.install.call(widget, deps);
    return widget;
};

describe("SamplerBlocks", () => {
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

    test("_get_save_lock reports the save lock", () => {
        const widget = makeWidget();
        widget._save_lock = true;
        expect(widget._get_save_lock()).toBe(true);
        widget._save_lock = false;
        expect(widget._get_save_lock()).toBe(false);
    });

    test("_saveSample saves through __save", () => {
        const widget = makeWidget();
        widget.__save = jest.fn();
        widget._saveSample();
        expect(widget.__save).toHaveBeenCalledTimes(1);
    });
});
