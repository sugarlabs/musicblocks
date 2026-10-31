/**
 * MusicBlocks
 *
 * @copyright 2026 Music Blocks contributors
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

global._ = msg => msg;
global.MeterWidgetWindow = require("../MeterWidgetWindow.js");
global.MeterWidgetMeter = require("../MeterWidgetMeter.js");
global.MeterWidgetPlayback = require("../MeterWidgetPlayback.js");
global.MeterWidgetWheel = require("../MeterWidgetWheel.js");
global.MeterWidgetSave = require("../MeterWidgetSave.js");
const MeterWidget = require("../meterwidget.js");

const MeterWidgetSave = global.MeterWidgetSave;

describe("MeterWidgetSave", () => {
    let widget;
    let loadNewBlocks;

    beforeEach(() => {
        loadNewBlocks = jest.fn();
        widget = Object.create(MeterWidget.prototype);
        widget.activity = { blocks: { loadNewBlocks } };
    });

    test("holds exactly the methods moved out of MeterWidget", () => {
        const names = Object.getOwnPropertyNames(MeterWidgetSave.prototype).filter(
            name => name !== "constructor"
        );
        expect(names).toEqual(["_save"]);
    });

    test("installModules puts the same function on MeterWidget.prototype", () => {
        expect(MeterWidget.installModules()).toBe(true);
        expect(MeterWidget.prototype._save).toBe(MeterWidgetSave.prototype._save);
    });

    test("makes one on strong beat do block for one strong beat", () => {
        widget._strongBeats = [false, false, true, false];

        widget._save();

        expect(loadNewBlocks).toHaveBeenCalledWith([
            [0, "onbeatdo", 100, 100, [null, 1, 2, null]],
            [1, ["number", { value: 3 }], 0, 0, [0]],
            [2, ["text", { value: "action" }], 0, 0, [0]]
        ]);
    });

    test("chains a block for each strong beat", () => {
        widget._strongBeats = [true, false, true, false, true, false];

        widget._save();

        expect(loadNewBlocks).toHaveBeenCalledWith([
            [0, "onbeatdo", 100, 100, [null, 1, 2, 3]],
            [1, ["number", { value: 1 }], 0, 0, [0]],
            [2, ["text", { value: "action" }], 0, 0, [0]],
            [3, "onbeatdo", 0, 0, [0, 4, 5, 6]],
            [4, ["number", { value: 3 }], 0, 0, [3]],
            [5, ["text", { value: "action" }], 0, 0, [3]],
            [6, "onbeatdo", 0, 0, [3, 7, 8, null]],
            [7, ["number", { value: 5 }], 0, 0, [6]],
            [8, ["text", { value: "action" }], 0, 0, [6]]
        ]);
    });

    test("makes no blocks without strong beats", () => {
        widget._strongBeats = [false, false, false];

        widget._save();

        expect(loadNewBlocks).toHaveBeenCalledWith([]);
    });
});
