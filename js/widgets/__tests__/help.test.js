/**
 * MusicBlocks
 *
 * @author kh-ub-ayb
 *
 * @copyright 2026 kh-ub-ayb
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

// Set up globals required by help.js
global._ = str => str;
global.docById = jest.fn(id => document.getElementById(id));
global.getMacroExpansion = jest.fn(() => []);

// HELPCONTENT: array of help pages, each is [title, description, imgPath, optional link, optional linkLabel]
global.HELPCONTENT = [
    ["Welcome to Music Blocks", "Welcome description", "images/welcome.svg"],
    ["Meet Mr. Mouse!", "Mouse description", "images/mouse.svg"],
    ["Guide", "Guide description", "images/guide.svg"],
    [
        "Using Blocks",
        "Block instructions",
        "images/blocks.svg",
        "https://example.com",
        "Learn more"
    ],
    ["About", "About MB", "images/about.svg"],
    ["Congratulations.", "You did it!", "images/congrats.svg"]
];

/**
 * Creates a mock widgetWindow object.
 * @returns {Object} Mock widget window.
 */
function createMockWidgetWindow() {
    const widgetBody = document.createElement("div");
    widgetBody.id = "mockWidgetBody";
    // Append to document.body so document.getElementById can find child elements
    document.body.appendChild(widgetBody);
    const widgetFrame = document.createElement("div");
    return {
        clear: jest.fn(),
        show: jest.fn(),
        onclose: null,
        onmaximize: null,
        addButton: jest.fn(() => {
            const btn = document.createElement("div");
            const img = document.createElement("img");
            btn.appendChild(img);
            return btn;
        }),
        sendToCenter: jest.fn(),
        getWidgetBody: jest.fn(() => widgetBody),
        getWidgetFrame: jest.fn(() => widgetFrame),
        isMaximized: jest.fn(() => false),
        destroy: jest.fn(),
        updateTitle: jest.fn(),
        takeFocus: jest.fn(),
        _widgetBody: widgetBody
    };
}

// Load HelpWidget class via Function constructor wrapping
const fs = require("fs");
const path = require("path");
const helpSource = fs.readFileSync(path.resolve(__dirname, "../help.js"), "utf-8");

let mockWidgetWindow;

// Initial setup for module load
mockWidgetWindow = createMockWidgetWindow();
window.widgetWindows = {
    openWindows: {},
    _posCache: {},
    windowFor: jest.fn(() => mockWidgetWindow)
};

Object.defineProperty(window, "localStorage", {
    writable: true,
    value: { languagePreference: "en" }
});

// Wrap source and assign HelpWidget to global
const wrappedSource = helpSource + "\nglobal.HelpWidget = HelpWidget;\n";
new Function(wrappedSource)();

beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = "";

    mockWidgetWindow = createMockWidgetWindow();
    window.widgetWindows = {
        openWindows: {},
        _posCache: {},
        windowFor: jest.fn(() => mockWidgetWindow)
    };

    jest.clearAllMocks();
    jest.useFakeTimers();
});

afterEach(() => {
    jest.useRealTimers();
});

/**
 * Creates a mock activity object for HelpWidget.
 * @param {Object} options - Override options.
 * @returns {Object} A mock activity.
 */
function createMockActivity(options = {}) {
    return {
        __keyPressed: jest.fn(),
        blocks: {
            activeBlock: options.activeBlock || null,
            blockList: options.blockList || {},
            protoBlockDict: options.protoBlockDict || {},
            palettes: {
                getProtoNameAndPalette: jest.fn(() => ["proto", "palette", "name"]),
                showPalette: jest.fn(),
                dict: {}
            },
            moveBlock: jest.fn(),
            loadNewBlocks: jest.fn()
        },
        logo: {}
    };
}

describe("HelpWidget", () => {
    describe("constructor", () => {
        test("sets activity reference", () => {
            const activity = createMockActivity();
            const hw = new HelpWidget(activity, false);

            expect(hw.activity).toBe(activity);
        });

        test("initializes beginnerBlocks as empty array", () => {
            const activity = createMockActivity();
            const hw = new HelpWidget(activity, false);

            expect(hw.beginnerBlocks).toEqual([]);
        });

        test("initializes advancedBlocks as empty array", () => {
            const activity = createMockActivity();
            const hw = new HelpWidget(activity, false);

            expect(hw.advancedBlocks).toEqual([]);
        });

        test("initializes appendedBlockList as empty array", () => {
            const activity = createMockActivity();
            const hw = new HelpWidget(activity, false);

            expect(hw.appendedBlockList).toEqual([]);
        });

        test("initializes index to 0", () => {
            const activity = createMockActivity();
            const hw = new HelpWidget(activity, false);

            expect(hw.index).toBe(0);
        });

        test("initializes isOpen to true", () => {
            const activity = createMockActivity();
            const hw = new HelpWidget(activity, false);

            expect(hw.isOpen).toBe(true);
        });

        test("calls widgetWindow clear and show", () => {
            const activity = createMockActivity();
            new HelpWidget(activity, false);

            expect(mockWidgetWindow.clear).toHaveBeenCalled();
            expect(mockWidgetWindow.show).toHaveBeenCalled();
        });

        test("sets widgetWindow reference", () => {
            const activity = createMockActivity();
            const hw = new HelpWidget(activity, false);

            expect(hw.widgetWindow).toBe(mockWidgetWindow);
        });

        test("creates _helpDiv as a div element", () => {
            const activity = createMockActivity();
            const hw = new HelpWidget(activity, false);

            expect(hw._helpDiv).toBeDefined();
            expect(hw._helpDiv.tagName).toBe("DIV");
        });

        test("sets up onclose handler that sets isOpen to false", () => {
            const activity = createMockActivity();
            const hw = new HelpWidget(activity, false);

            expect(mockWidgetWindow.onclose).toBeDefined();
            mockWidgetWindow.onclose();
            expect(hw.isOpen).toBe(false);
        });

        test("onclose calls widgetWindow.destroy", () => {
            const activity = createMockActivity();
            new HelpWidget(activity, false);

            mockWidgetWindow.onclose();

            expect(mockWidgetWindow.destroy).toHaveBeenCalled();
        });

        test("onclose restores document.onkeydown", () => {
            const activity = createMockActivity();
            new HelpWidget(activity, false);

            mockWidgetWindow.onclose();

            expect(document.onkeydown).toBe(activity.__keyPressed);
        });

        test("calls windowFor with correct arguments", () => {
            const activity = createMockActivity();
            new HelpWidget(activity, false);

            expect(window.widgetWindows.windowFor).toHaveBeenCalledWith(
                expect.anything(),
                "help",
                "help",
                false
            );
        });

        test("sets widget body max height", () => {
            const activity = createMockActivity();
            new HelpWidget(activity, false);

            expect(mockWidgetWindow.getWidgetBody).toHaveBeenCalled();
            expect(mockWidgetWindow.getWidgetBody().style.maxHeight).toBe("70vh");
        });
    });

    describe("_prepareBlockList categorization", () => {
        test("categorizes beginner blocks with helpString", () => {
            const activity = createMockActivity({
                protoBlockDict: {
                    noteBlock: {
                        beginnerModeBlock: true,
                        helpString: ["Note block help"]
                    },
                    advBlock: {
                        beginnerModeBlock: false,
                        helpString: ["Adv block help"]
                    }
                }
            });
            const hw = new HelpWidget(activity, false);

            // Manually call _prepareBlockList instead of waiting for timeout
            // We need to mock _blockHelp since it requires DOM elements
            hw._blockHelp = jest.fn();
            hw._prepareBlockList();

            expect(hw.beginnerBlocks).toContain("noteBlock");
            expect(hw.beginnerBlocks).not.toContain("advBlock");
        });

        test("categorizes advanced blocks with helpString", () => {
            const activity = createMockActivity({
                protoBlockDict: {
                    noteBlock: {
                        beginnerModeBlock: true,
                        helpString: ["Note help"]
                    },
                    advBlock: {
                        beginnerModeBlock: false,
                        helpString: ["Adv help"]
                    }
                }
            });
            const hw = new HelpWidget(activity, false);
            hw._blockHelp = jest.fn();
            hw._prepareBlockList();

            expect(hw.advancedBlocks).toContain("advBlock");
            expect(hw.advancedBlocks).not.toContain("noteBlock");
        });

        test("skips blocks without helpString", () => {
            const activity = createMockActivity({
                protoBlockDict: {
                    noHelp: {
                        beginnerModeBlock: true,
                        helpString: undefined
                    },
                    emptyHelp: {
                        beginnerModeBlock: true,
                        helpString: []
                    }
                }
            });
            const hw = new HelpWidget(activity, false);
            hw._blockHelp = jest.fn();
            hw._prepareBlockList();

            expect(hw.beginnerBlocks).not.toContain("noHelp");
            expect(hw.beginnerBlocks).not.toContain("emptyHelp");
        });

        test("appendedBlockList has beginner blocks first", () => {
            const activity = createMockActivity({
                protoBlockDict: {
                    advBlock: {
                        beginnerModeBlock: false,
                        helpString: ["Adv"]
                    },
                    begBlock: {
                        beginnerModeBlock: true,
                        helpString: ["Beg"]
                    }
                }
            });
            const hw = new HelpWidget(activity, false);
            hw._blockHelp = jest.fn();
            hw._prepareBlockList();

            expect(hw.appendedBlockList[0]).toBe("begBlock");
            expect(hw.appendedBlockList.indexOf("begBlock")).toBeLessThan(
                hw.appendedBlockList.indexOf("advBlock")
            );
        });

        test("calls _blockHelp with first block after categorization", () => {
            const activity = createMockActivity({
                protoBlockDict: {
                    firstBlock: {
                        beginnerModeBlock: true,
                        helpString: ["First"]
                    }
                }
            });
            const hw = new HelpWidget(activity, false);
            hw._blockHelp = jest.fn();
            hw._prepareBlockList();

            expect(hw._blockHelp).toHaveBeenCalledWith(
                activity.blocks.protoBlockDict["firstBlock"]
            );
        });

        test("handles empty protoBlockDict", () => {
            const activity = createMockActivity({
                protoBlockDict: {}
            });
            const hw = new HelpWidget(activity, false);
            hw._blockHelp = jest.fn();

            // Should not throw even when no blocks
            // _blockHelp will be called with undefined but that's expected
            hw._prepareBlockList();

            expect(hw.beginnerBlocks).toEqual([]);
            expect(hw.advancedBlocks).toEqual([]);
        });

        test("handles mixed beginner blocks with and without helpString", () => {
            const activity = createMockActivity({
                protoBlockDict: {
                    withHelp: {
                        beginnerModeBlock: true,
                        helpString: ["Has help"]
                    },
                    noHelp: {
                        beginnerModeBlock: true,
                        helpString: undefined
                    },
                    emptyHelp: {
                        beginnerModeBlock: true,
                        helpString: []
                    },
                    alsoHelp: {
                        beginnerModeBlock: true,
                        helpString: ["Also has help"]
                    }
                }
            });
            const hw = new HelpWidget(activity, false);
            hw._blockHelp = jest.fn();
            hw._prepareBlockList();

            expect(hw.beginnerBlocks).toContain("withHelp");
            expect(hw.beginnerBlocks).toContain("alsoHelp");
            expect(hw.beginnerBlocks).toHaveLength(2);
        });
    });

    describe("showPageByName (deprecated path)", () => {
        test("calls _showPage when page name is found", () => {
            const activity = createMockActivity();
            const hw = new HelpWidget(activity, false);

            // Run the setup timeout so DOM elements are created
            jest.runAllTimers();

            const showPageSpy = jest.spyOn(hw, "_showPage");
            hw.showPageByName("Using Blocks");

            expect(showPageSpy).toHaveBeenCalledWith(3);
            showPageSpy.mockRestore();
        });

        test("does not call _showPage when page name is not found", () => {
            const activity = createMockActivity();
            const hw = new HelpWidget(activity, false);
            jest.runAllTimers();

            const showPageSpy = jest.spyOn(hw, "_showPage");
            hw.showPageByName("Nonexistent Page");

            expect(showPageSpy).not.toHaveBeenCalled();
            showPageSpy.mockRestore();
        });

        test("finds page at index 0", () => {
            const activity = createMockActivity();
            const hw = new HelpWidget(activity, false);
            jest.runAllTimers();

            const showPageSpy = jest.spyOn(hw, "_showPage");
            hw.showPageByName("Welcome to Music Blocks");

            expect(showPageSpy).toHaveBeenCalledWith(0);
            showPageSpy.mockRestore();
        });

        test("finds last page", () => {
            const activity = createMockActivity();
            const hw = new HelpWidget(activity, false);
            jest.runAllTimers();

            const showPageSpy = jest.spyOn(hw, "_showPage");
            hw.showPageByName("Congratulations.");

            expect(showPageSpy).toHaveBeenCalledWith(5);
            showPageSpy.mockRestore();
        });

        test("searches by content in any position of HELPCONTENT entry", () => {
            const activity = createMockActivity();
            const hw = new HelpWidget(activity, false);
            jest.runAllTimers();

            const showPageSpy = jest.spyOn(hw, "_showPage");
            // "Learn more" is the link label at index 4 of page 3
            hw.showPageByName("Learn more");

            expect(showPageSpy).toHaveBeenCalledWith(3);
            showPageSpy.mockRestore();
        });
    });

    describe("page navigation logic", () => {
        test("_showPage renders page content in helpBodyDiv", () => {
            const activity = createMockActivity();
            const hw = new HelpWidget(activity, false);
            jest.runAllTimers();

            hw._showPage(0);

            const helpBody = document.getElementById("helpBodyDiv");
            expect(helpBody).not.toBeNull();
            expect(helpBody.innerHTML).toContain("Welcome to Music Blocks");
        });

        test("_showPage displays page count", () => {
            const activity = createMockActivity();
            const hw = new HelpWidget(activity, false);
            jest.runAllTimers();

            hw._showPage(2);

            const helpBody = document.getElementById("helpBodyDiv");
            expect(helpBody.innerHTML).toContain("3/" + HELPCONTENT.length);
        });

        test("_showPage renders image for known pages without dimensions", () => {
            const activity = createMockActivity();
            const hw = new HelpWidget(activity, false);
            jest.runAllTimers();

            // Page 0 is "Welcome to Music Blocks" - a known page without dimensions
            hw._showPage(0);

            const helpBody = document.getElementById("helpBodyDiv");
            const img = helpBody.querySelector("img");
            expect(img).not.toBeNull();
            // For known pages, the img should NOT have width/height attributes
            expect(img.getAttribute("width")).toBeNull();
        });

        test("_showPage renders image with dimensions for unknown pages", () => {
            const activity = createMockActivity();
            const hw = new HelpWidget(activity, false);
            jest.runAllTimers();

            // Page 3 is "Using Blocks" - NOT in the known list
            hw._showPage(3);

            const helpBody = document.getElementById("helpBodyDiv");
            const img = helpBody.querySelector("img");
            expect(img).not.toBeNull();
            expect(img.getAttribute("width")).toBe("64px");
            expect(img.getAttribute("height")).toBe("64px");
        });

        test("_showPage renders link when page has more than 3 entries", () => {
            const activity = createMockActivity();
            const hw = new HelpWidget(activity, false);
            jest.runAllTimers();

            // Page 3 has link and link label
            hw._showPage(3);

            const helpBody = document.getElementById("helpBodyDiv");
            const link = helpBody.querySelector("a");
            expect(link).not.toBeNull();
            expect(link.getAttribute("href")).toBe("https://example.com");
            expect(link.textContent).toBe("Learn more");
        });

        test("_showPage does not render link for pages with 3 or fewer entries", () => {
            const activity = createMockActivity();
            const hw = new HelpWidget(activity, false);
            jest.runAllTimers();

            // Page 0 has only 3 entries
            hw._showPage(0);

            const helpBody = document.getElementById("helpBodyDiv");
            const link = helpBody.querySelector("a");
            expect(link).toBeNull();
        });

        test("_showPage sets helpBody text color", () => {
            const activity = createMockActivity();
            const hw = new HelpWidget(activity, false);
            jest.runAllTimers();

            hw._showPage(0);

            const helpBody = document.getElementById("helpBodyDiv");
            expect(helpBody.style.color).toBe("rgb(80, 80, 80)");
        });

        test("_showPage calls takeFocus", () => {
            const activity = createMockActivity();
            const hw = new HelpWidget(activity, false);
            jest.runAllTimers();

            mockWidgetWindow.takeFocus.mockClear();
            hw._showPage(1);

            expect(mockWidgetWindow.takeFocus).toHaveBeenCalled();
        });

        test("_showPage disables right arrow on last page", () => {
            const activity = createMockActivity();
            const hw = new HelpWidget(activity, false);
            jest.runAllTimers();

            hw._showPage(HELPCONTENT.length - 1);

            const rightArrow = document.getElementById("right-arrow");
            expect(rightArrow.classList.contains("disabled")).toBe(true);
        });

        test("_showPage disables left arrow on first page", () => {
            const activity = createMockActivity();
            const hw = new HelpWidget(activity, false);
            jest.runAllTimers();

            hw._showPage(0);

            const leftArrow = document.getElementById("left-arrow");
            expect(leftArrow.classList.contains("disabled")).toBe(true);
        });

        test("_showPage enables both arrows on middle page", () => {
            const activity = createMockActivity();
            const hw = new HelpWidget(activity, false);
            jest.runAllTimers();

            hw._showPage(2);

            const rightArrow = document.getElementById("right-arrow");
            const leftArrow = document.getElementById("left-arrow");
            expect(rightArrow.classList.contains("disabled")).toBe(false);
            expect(leftArrow.classList.contains("disabled")).toBe(false);
        });

        test("_showPage clears previous content", () => {
            const activity = createMockActivity();
            const hw = new HelpWidget(activity, false);
            jest.runAllTimers();

            hw._showPage(0);
            hw._showPage(1);

            const helpBody = document.getElementById("helpBodyDiv");
            // After showing page 1, should not contain page 0 title
            expect(helpBody.innerHTML).not.toContain("Welcome to Music Blocks");
            expect(helpBody.innerHTML).toContain("Meet Mr. Mouse!");
        });
    });

    describe("static properties", () => {
        test("ICONSIZE is 32", () => {
            expect(HelpWidget.ICONSIZE).toBe(32);
        });
    });
});
