/**
 * MusicBlocks v3.6.2
 *
 * @author Lakshay
 *
 * @copyright 2026 Lakshay
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

// Set up window.widgetWindows on existing jsdom window (before require)
window.widgetWindows = {
    windowFor: jest.fn().mockReturnValue({
        clear: jest.fn(),
        show: jest.fn(),
        addButton: jest.fn().mockReturnValue({ onclick: null }),
        getWidgetBody: jest.fn().mockReturnValue({
            appendChild: jest.fn(),
            append: jest.fn(),
            style: { maxHeight: "" },
            innerHTML: ""
        }),
        sendToCenter: jest.fn(),
        updateTitle: jest.fn(),
        onclose: null,
        onmaximize: null,
        destroy: jest.fn()
    })
};

global._ = msg => msg;
global.HELPCONTENT = [
    ["Welcome", "Welcome to Music Blocks!", "images/help/welcome.svg", ""],
    ["Start Block", "Use the start block to begin.", "images/help/start.svg", ""],
    ["Note Block", "The note block plays a note.", "images/help/note.svg", ""]
];
global.getMacroExpansion = jest.fn(() => null);
global.docById = jest.fn(id => ({
    style: { display: "", height: "", width: "" },
    innerHTML: "",
    appendChild: jest.fn(),
    setAttribute: jest.fn(),
    addEventListener: jest.fn(),
    classList: {
        add: jest.fn(),
        remove: jest.fn()
    },
    click: jest.fn(),
    onclick: null,
    insertAdjacentHTML: jest.fn()
}));

global.document = {
    createElement: jest.fn(() => ({
        style: {},
        innerHTML: "",
        appendChild: jest.fn(),
        append: jest.fn(),
        setAttribute: jest.fn(),
        insertAdjacentHTML: jest.fn(),
        addEventListener: jest.fn(),
        classList: {
            add: jest.fn(),
            remove: jest.fn()
        }
    })),
    getElementById: jest.fn(() => ({
        style: { display: "", height: "", width: "" },
        innerHTML: "",
        classList: {
            add: jest.fn(),
            remove: jest.fn()
        },
        onclick: null,
        click: jest.fn()
    })),
    onkeydown: null
};

const HelpWidget = require("../help.js");

describe("HelpWidget", () => {
    let mockActivity;

    beforeEach(() => {
        jest.useFakeTimers();

        mockActivity = {
            blocks: {
                activeBlock: null,
                blockList: {},
                palettes: {
                    dict: {}
                }
            },
            beginnerMode: true,
            __keyPressed: jest.fn()
        };
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    describe("constructor", () => {
        test("should initialize with isOpen true", () => {
            const help = new HelpWidget(mockActivity, false);
            expect(help.isOpen).toBe(true);
        });

        test("should store activity reference", () => {
            const help = new HelpWidget(mockActivity, false);
            expect(help.activity).toBe(mockActivity);
        });

        test("should initialize empty block lists", () => {
            const help = new HelpWidget(mockActivity, false);
            expect(help.beginnerBlocks).toEqual([]);
            expect(help.advancedBlocks).toEqual([]);
            expect(help.appendedBlockList).toEqual([]);
        });

        test("should initialize index to 0", () => {
            const help = new HelpWidget(mockActivity, false);
            expect(help.index).toBe(0);
        });

        test("should create widgetWindow", () => {
            const help = new HelpWidget(mockActivity, false);
            expect(help.widgetWindow).toBeDefined();
            expect(window.widgetWindows.windowFor).toHaveBeenCalled();
        });
    });

    describe("HELPCONTENT", () => {
        test("should have at least one entry", () => {
            expect(HELPCONTENT.length).toBeGreaterThan(0);
        });

        test("each entry should have a title", () => {
            for (const entry of HELPCONTENT) {
                expect(typeof entry[0]).toBe("string");
                expect(entry[0].length).toBeGreaterThan(0);
            }
        });

        test("each entry should have a description", () => {
            for (const entry of HELPCONTENT) {
                expect(typeof entry[1]).toBe("string");
            }
        });
    });

    describe("close behavior", () => {
        test("should set isOpen to false when onclose fires", () => {
            const help = new HelpWidget(mockActivity, false);
            const widgetWindow = window.widgetWindows.windowFor.mock.results[0].value;
            if (widgetWindow.onclose) {
                widgetWindow.onclose();
            }
            expect(help.isOpen).toBe(false);
        });
    });
});
