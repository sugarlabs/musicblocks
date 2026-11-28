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
global.platformColor = { modeWheelcolors: ["#aaa", "#bbb"], orange: "#f80" };
global.docById = id => document.getElementById(id);
global.slicePath = () => ({
    DonutSlice: "donut",
    DonutSliceCustomization: () => ({})
});

const wheels = [];
global.wheelnav = jest.fn(function (div) {
    this.div = div;
    this.raphael = {};
    this.navItems = [];
    this.selectedNavItemIndex = null;
    this.createWheel = labels => {
        this.labels = labels;
        this.navItems = labels.map(() => ({
            navItem: { visible: true, show: jest.fn(), hide: jest.fn() },
            navigateFunction: null
        }));
        for (const item of this.navItems) {
            item.navItem.show.mockImplementation(() => (item.navItem.visible = true));
            item.navItem.hide.mockImplementation(() => (item.navItem.visible = false));
        }
    };
    wheels.push(this);
});

global.MeterWidgetWindow = require("../MeterWidgetWindow.js");
global.MeterWidgetMeter = require("../MeterWidgetMeter.js");
global.MeterWidgetPlayback = require("../MeterWidgetPlayback.js");
global.MeterWidgetWheel = require("../MeterWidgetWheel.js");
global.MeterWidgetSave = require("../MeterWidgetSave.js");
const MeterWidget = require("../meterwidget.js");

const MeterWidgetWheel = global.MeterWidgetWheel;
const METHODS = ["_piemenuMeter", "_setupDefaultStrongWeakBeats"];

describe("MeterWidgetWheel", () => {
    let widget;

    const shown = wheel => wheel.navItems.map(item => item.navItem.visible);

    beforeEach(() => {
        wheels.length = 0;
        document.body.innerHTML = '<div id="meterWheelDiv"></div>';
        widget = Object.create(MeterWidget.prototype);
        widget._strongBeats = [];
    });

    test("holds exactly the methods moved out of MeterWidget", () => {
        const names = Object.getOwnPropertyNames(MeterWidgetWheel.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on MeterWidget.prototype", () => {
        expect(MeterWidget.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(MeterWidget.prototype[name]).toBe(MeterWidgetWheel.prototype[name]);
        }
    });

    test("draws a slice for each beat on all three wheels", () => {
        widget._piemenuMeter(5, 1 / 4);

        expect(wheels).toHaveLength(3);
        expect(widget._meterWheel.labels).toEqual(["1", "2", "3", "4", "5"]);
        expect(widget._beatWheel.labels).toEqual(["x", "x", "x", "x", "x"]);
        expect(widget._playWheel.labels).toHaveLength(5);
        expect(widget._strongBeats).toEqual([false, false, false, false, false]);
        expect(document.getElementById("meterWheelDiv").style.display).toBe("flex");
    });

    test("draws at most 16 beats", () => {
        widget._piemenuMeter(20, 1 / 4);

        expect(widget._meterWheel.labels).toHaveLength(16);
        expect(widget._strongBeats).toHaveLength(16);
    });

    test("hides the beat indicator until playing", () => {
        widget._piemenuMeter(4, 1 / 4);

        expect(shown(widget._playWheel)).toEqual([false, false, false, false]);
    });

    test.each([
        [4, 1 / 4, [true, false, true, false]],
        [3, 1 / 4, [true, false, false]],
        [2, 1 / 4, [true, false]],
        [6, 1 / 8, [true, false, false, true, false, false]],
        [5, 1 / 4, [false, false, false, false, false]],
        [3, 3 / 8, [false, false, false]]
    ])("%s beats of %s start with the usual strong beats", (beats, beatValue, strong) => {
        widget._piemenuMeter(beats, beatValue);

        expect(widget._strongBeats).toEqual(strong);
        expect(shown(widget._beatWheel)).toEqual(strong);
    });

    test("clicking a beat makes it strong and clicking its mark makes it weak again", () => {
        widget._piemenuMeter(4, 1 / 4);

        widget._meterWheel.selectedNavItemIndex = 1;
        widget._meterWheel.navItems[1].navigateFunction();
        expect(widget._strongBeats).toEqual([true, true, true, false]);
        expect(shown(widget._beatWheel)).toEqual([true, true, true, false]);

        widget._beatWheel.selectedNavItemIndex = 0;
        widget._beatWheel.navItems[0].navigateFunction();
        expect(widget._strongBeats).toEqual([false, true, true, false]);
        expect(shown(widget._beatWheel)).toEqual([false, true, true, false]);
    });
});
