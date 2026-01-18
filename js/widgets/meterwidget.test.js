/**
 * MusicBlocks v3.6.2
 *
 * @author mukul-dixit
 *
 * @copyright 2026 mukul-dixit
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

// --- Global Mocks ---
global._ = msg => msg;
global.last = arr => (arr && arr.length > 0 ? arr[arr.length - 1] : undefined);
global.docById = jest.fn().mockReturnValue({
    style: {},
    innerHTML: ""
});
global.platformColor = {
    selectorBackground: "#ffb020"
};
global.PREVIEWVOLUME = 0.5;
global.TONEBPM = 240;

global.Singer = {
    masterBPM: 90,
    defaultBPMFactor: 1
};

global.wheelnav = jest.fn().mockImplementation(() => ({
    colors: [],
    slicePathFunction: null,
    slicePathCustom: null,
    sliceSelectedPathCustom: null,
    sliceInitPathCustom: null,
    animateeffect: null,
    animatetime: 0,
    createWheel: jest.fn(),
    refreshWheel: jest.fn(),
    navItems: []
}));

global.slicePath = jest.fn().mockReturnValue({
    DonutSlice: jest.fn()
});

const createMockElement = tagName => ({
    tagName,
    style: {},
    appendChild: jest.fn(),
    innerHTML: "",
    addEventListener: jest.fn(),
    className: "",
    id: ""
});

global.document = {
    createElement: jest.fn().mockImplementation(createMockElement)
};

const createMockWidgetWindow = () => ({
    clear: jest.fn(),
    show: jest.fn(),
    getWidgetBody: jest.fn().mockReturnValue({
        appendChild: jest.fn(),
        style: {}
    }),
    addButton: jest.fn().mockReturnValue({
        onclick: null
    }),
    sendToCenter: jest.fn(),
    destroy: jest.fn(),
    onclose: null,
    onmaximize: null
});

global.window = {
    widgetWindows: {
        windowFor: jest.fn().mockImplementation(() => createMockWidgetWindow())
    }
};

describe("MeterWidget", () => {
    test("meterwidget.js module exists and is valid", () => {
        const fs = require("fs");
        const path = require("path");
        
        const meterWidgetPath = path.join(__dirname, "meterwidget.js");
        const fileExists = fs.existsSync(meterWidgetPath);
        expect(fileExists).toBe(true);
        
        const content = fs.readFileSync(meterWidgetPath, "utf8");
        expect(content).toContain("class MeterWidget");
        expect(content).toMatch(/(@exports\s+MeterWidget|\/\*\s*exported\s+MeterWidget\s*\*\/)/);
    });

    test("MeterWidget has proper license header", () => {
        const fs = require("fs");
        const path = require("path");
        
        const meterWidgetPath = path.join(__dirname, "meterwidget.js");
        const content = fs.readFileSync(meterWidgetPath, "utf8");
        expect(content).toMatch(/GNU.*AFFERO.*PUBLIC.*LICENSE/is);
    });
}); 