/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Diwangshu Kakoty
 *
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

const { platformColor } = require("../utils/platformstyle");
global.platformColor = platformColor;

jest.mock("../utils/platformstyle", () => ({
    platformColor: { stopIconColor: "#ea174c" }
}));

global.jQuery = jest.fn(() => ({
    on: jest.fn(),
    trigger: jest.fn(),
    tooltip: jest.fn(),
    dropdown: jest.fn()
}));
global.jQuery.noConflict = jest.fn(() => global.jQuery);

global.window = {
    localStorage: { languagePreference: "en" },
    navigator: { language: "en-US" },
    document: {
        getElementById: jest.fn(() => ({ style: {} }))
    }
};

global.localStorage = window.localStorage;

const Toolbar = require("../toolbar");

global.document.getElementById = jest.fn(id => ({
    id,
    style: {},
    setAttribute: jest.fn(),
    innerHTML: "",
    classList: { add: jest.fn() },
    appendChild: jest.fn()
}));

global.docById = jest.fn(id => ({
    id,
    setAttribute: jest.fn(),
    innerHTML: "",
    style: {},
    classList: { add: jest.fn() },
    appendChild: jest.fn()
}));

global._ = jest.fn(str => str);

global.$j = jest.fn(() => ({
    tooltip: jest.fn(),
    dropdown: jest.fn()
}));

describe("Toolbar Class", () => {
    let toolbar;
    let mockActivity;

    beforeEach(() => {
        global.window.localStorage.languagePreference = "en";
        global._THIS_IS_MUSIC_BLOCKS_ = false;
        toolbar = new Toolbar();
        mockActivity = { beginnerMode: true };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("initializes with correct properties and sets activity", () => {
        const mockActivity = { someProp: "someValue" };
        toolbar.init(mockActivity);
        expect(toolbar.activity).toEqual(mockActivity);
        expect(toolbar.language).toBe("en");
        expect(toolbar.tooltipsDisabled).toBe(false);
    });

    test("sets correct strings for _THIS_IS_MUSIC_BLOCKS_ true", () => {
        global._THIS_IS_MUSIC_BLOCKS_ = true;
        toolbar.init({});
        expect(global._).toHaveBeenCalledTimes(137);
        expect(global._).toHaveBeenNthCalledWith(1, "About Music Blocks");
    });

    test("sets correct strings for _THIS_IS_MUSIC_BLOCKS_ false", () => {
        global._THIS_IS_MUSIC_BLOCKS_ = false;
        toolbar.init({});
        expect(global._).toHaveBeenCalledTimes(119);
        expect(global._).toHaveBeenNthCalledWith(1, "About Turtle Blocks");
    });

    test("handles language fallback when localStorage is empty", () => {
        delete global.window.localStorage.languagePreference;
        toolbar.init({});
        expect(toolbar.language).toBe("en");
    });

    test("falls back to navigator language if localStorage is empty", () => {
        delete global.window.localStorage.languagePreference;
        toolbar = new Toolbar();
        expect(toolbar.language).toBe("en-US");
    });

    test("init sets activity and updates beginner/advanced mode display", () => {
        const beginnerModeElem = {
            style: { display: "" },
            setAttribute: jest.fn(),
            classList: { add: jest.fn() }
        };
        const advancedModeElem = {
            style: { display: "" },
            setAttribute: jest.fn(),
            classList: { add: jest.fn() }
        };

        global.docById.mockImplementation(id => {
            if (id === "beginnerMode") return beginnerModeElem;
            if (id === "advancedMode") return advancedModeElem;
            return {
                setAttribute: jest.fn(),
                style: {},
                classList: { add: jest.fn() }
            };
        });

        toolbar.init(mockActivity);

        expect(toolbar.activity).toBe(mockActivity);
        expect(beginnerModeElem.style.display).toBe("none");
        expect(advancedModeElem.style.display).toBe("block");

        expect(beginnerModeElem.setAttribute).toHaveBeenCalled();
        expect(advancedModeElem.setAttribute).toHaveBeenCalled();
    });

    beforeEach(() => {
        jest.useFakeTimers();
        jest.spyOn(global, "clearTimeout");

        global.saveButton = {
            disabled: false,
            className: ""
        };
        global.saveButtonAdvanced = {
            disabled: false,
            className: ""
        };
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("renderLogoIcon sets up logo with correct interactions", () => {
        const elements = {
            "mb-logo": {
                innerHTML: "",
                onmouseenter: null,
                onmouseleave: null,
                onclick: null,
                style: {}
            }
        };

        global.docById = jest.fn(id => elements[id]);
        global.document = {
            body: {
                style: {
                    cursor: ""
                }
            }
        };

        const toolbar = new Toolbar();
        toolbar.activity = {};
        toolbar.language = "en";
        const mockOnClick = jest.fn();

        //Non-Japanese language
        toolbar.renderLogoIcon(mockOnClick);
        expect(elements["mb-logo"].innerHTML).toBe("");
        expect(typeof elements["mb-logo"].onmouseenter).toBe("function");
        expect(typeof elements["mb-logo"].onmouseleave).toBe("function");
        expect(typeof elements["mb-logo"].onclick).toBe("function");

        elements["mb-logo"].onmouseenter();
        expect(document.body.style.cursor).toBe("pointer");

        elements["mb-logo"].onmouseleave();
        expect(document.body.style.cursor).toBe("default");

        elements["mb-logo"].onclick();
        expect(mockOnClick).toHaveBeenCalledWith(toolbar.activity);

        // Japanese language
        toolbar.language = "ja";
        toolbar.renderLogoIcon(mockOnClick);
        expect(elements["mb-logo"].innerHTML).toContain("logo-ja.svg");
        expect(elements["mb-logo"].innerHTML).toContain("transform: scale(0.85)");
        elements["mb-logo"].onclick();
        expect(mockOnClick).toHaveBeenCalledTimes(2);
    });

    test("renderPlayIcon sets onclick and updates play/stop button behavior", () => {
        global.play_button_debounce_timeout = null;

        const elements = {
            play: {
                onclick: null,
                addEventListener: jest.fn()
            },
            stop: {
                style: { color: "" },
                addEventListener: jest.fn()
            },
            record: {
                className: ""
            }
        };

        global.docById.mockImplementation(id => elements[id] || {});

        const mockActivity = {
            hideMsgs: jest.fn(),
            beginnerMode: true
        };
        toolbar.activity = mockActivity;

        const mockOnClick = jest.fn();
        toolbar.renderPlayIcon(mockOnClick);

        elements.play.onclick();

        expect(mockOnClick).toHaveBeenCalledWith(mockActivity);
        expect(elements.stop.style.color).toBe(toolbar.stopIconColorWhenPlaying);
        expect(global.saveButtonAdvanced.disabled).toBe(true);
        expect(global.saveButton.className).toBe("grey-text inactiveLink");
        expect(elements.record.className).toBe("grey-text inactiveLink");
        expect(elements.stop.addEventListener).toHaveBeenCalledWith("click", expect.any(Function));

        const stopClickHandler = elements.stop.addEventListener.mock.calls[0][1];
        stopClickHandler();

        expect(mockActivity.hideMsgs).toHaveBeenCalled();

        delete global.play_button_debounce_timeout;
    });

    test("renderStopIcon sets onclick and updates stop button behavior", () => {
        const stopIcon = { onclick: null, style: { color: "" } };
        const recordButton = { className: "recording" };

        global.docById.mockImplementation(id =>
            id === "stop" ? stopIcon : id === "record" ? recordButton : {}
        );

        const mockOnClick = jest.fn();
        toolbar.renderStopIcon(mockOnClick);

        stopIcon.onclick();

        expect(mockOnClick).toHaveBeenCalled();
        expect(stopIcon.style.color).toBe("white");
        expect(global.saveButton.disabled).toBe(false);
        expect(global.saveButtonAdvanced.disabled).toBe(false);
        expect(global.saveButton.className).toBe("");
        expect(global.saveButtonAdvanced.className).toBe("");
        expect(recordButton.className).toBe("");
    });

    test("renderNewProjectIcon displays modal and handles confirmation", () => {
        const elements = {
            "modal-container": {
                style: { display: "" }
            },
            "newdropdown": {
                innerHTML: "",
                appendChild: jest.fn()
            }
        };
        global.docById = jest.fn(id => elements[id]);
        global.document = {
            createElement: jest.fn(tagName => ({
                tagName,
                classList: { add: jest.fn() },
                textContent: "",
                style: {},
                onclick: null,
                appendChild: jest.fn()
            }))
        };
        global._ = jest.fn(str => str);
        const toolbar = new Toolbar();
        toolbar.activity = mockActivity;

        const mockOnClick = jest.fn();
        toolbar.renderNewProjectIcon(mockOnClick);

        expect(elements["modal-container"].style.display).toBe("flex");
        expect(elements["newdropdown"].innerHTML).toBe("");

        const appendCalls = elements["newdropdown"].appendChild.mock.calls;
        const titleElement = appendCalls[0][0];
        const messageElement = appendCalls[1][0];
        const buttonListItem = appendCalls[2][0];
        const confirmButton = buttonListItem.firstChild;

        expect(titleElement.textContent).toBe("New project");
        expect(messageElement.textContent).toBe("Are you sure you want to create a new project?");
        expect(messageElement.id).toBe("confirmation-message");
        expect(confirmButton.textContent).toBe("Confirm");
        expect(confirmButton.id).toBe("new-project");

        confirmButton.onclick();

        expect(elements["modal-container"].style.display).toBe("none");
        expect(mockOnClick).toHaveBeenCalledWith(mockActivity);
    });

    test("renderLoadIcon sets onclick and updates tooltip", () => {
        const loadIcon = {
            setAttribute: jest.fn(),
            onclick: null
        };
        global.docById.mockReturnValue(loadIcon);
        const mockOnClick = jest.fn();
        toolbar.renderLoadIcon(mockOnClick);
        expect(loadIcon.onclick).toBeInstanceOf(Function);
        loadIcon.onclick();
        expect(mockOnClick).toHaveBeenCalledWith(toolbar.activity);
    });

    test("renderThemeSelectIcon sets onclick and updates theme selection", () => {
        const themeSelectIcon = { onclick: null };
        const themes = ["light", "dark"];
        const themeBox = { setAttribute: jest.fn() };
        global.docById.mockReturnValue(themeSelectIcon);
        global.localStorage.themePreference = "light";
        toolbar.renderThemeSelectIcon(themeBox, themes);
        expect(themeSelectIcon.onclick).toBeInstanceOf(Function);
        themeSelectIcon.onclick();
        themes.forEach(theme => {
            if (theme === "light") {
                expect(global.localStorage.themePreference).toBe("light");
            }
        });
    });

    test("renderWrapIcon toggles WRAP and updates tooltip", () => {
        const mockActivity = {
            helpfulWheelItems: [
                { label: "Turtle Wrap Off", display: false },
                { label: "Turtle Wrap On", display: true }
            ],
            textMsg: jest.fn()
        };
        toolbar.activity = mockActivity;

        const wrapIcon = {
            setAttribute: jest.fn(),
            onclick: null
        };
        global.docById.mockReturnValue(wrapIcon);
        global.$j = jest.fn(() => ({
            tooltip: jest.fn()
        }));

        global.WRAP = false;
        toolbar.renderWrapIcon();
        expect(wrapIcon.onclick).toBeInstanceOf(Function);
        //enable WRAP
        wrapIcon.onclick();
        expect(global.WRAP).toBe(false);
        expect(wrapIcon.setAttribute).toHaveBeenCalledWith("data-tooltip", "Turtle Wrap Off");
        expect(mockActivity.helpfulWheelItems[0].display).toBe(false);
        //disable WRAP
        wrapIcon.onclick();
        expect(wrapIcon.setAttribute).toHaveBeenCalledWith("data-tooltip", "Turtle Wrap On");
        expect(mockActivity.helpfulWheelItems[0].display).toBe(true);
    });

    test("changeWrap toggles WRAP and updates tooltip", () => {
        const mockActivity = {
            helpfulWheelItems: [
                { label: "Turtle Wrap Off", display: false },
                { label: "Turtle Wrap On", display: true }
            ],
            textMsg: jest.fn()
        };

        const wrapIcon = {
            setAttribute: jest.fn()
        };
        const helpfulWheelDiv = {
            style: { display: "block" }
        };

        global._ = jest.fn(str => str);
        global.$j = jest.fn(() => ({
            tooltip: jest.fn()
        }));
        global.WRAP = false;
        global.docById = jest.fn(id => {
            if (id === "wrapTurtle") return wrapIcon;
            if (id === "helpfulWheelDiv") return helpfulWheelDiv;
            return {};
        });

        expect(global.WRAP).toBe(false);
        expect(mockActivity.helpfulWheelItems[0].display).toBe(false);
        expect(mockActivity.helpfulWheelItems[1].display).toBe(true);

        toolbar.changeWrap(mockActivity);
        expect(wrapIcon.setAttribute).toHaveBeenCalledWith("data-tooltip", "Turtle Wrap On");

        helpfulWheelDiv.style.display = "none";
        toolbar.changeWrap(mockActivity);
        expect(helpfulWheelDiv.style.display).toBe("none");
    });

    test("renderSaveIcons handles all save button states correctly", () => {
        const elements = {
            "saveButton": { onclick: null, style: { display: "" } },
            "saveButtonAdvanced": { onclick: null, style: { display: "" } },
            "save-html-beg": { onclick: null },
            "save-png-beg": { onclick: null, disabled: false, className: "" },
            "save-html": { onclick: null },
            "save-svg": { onclick: null, disabled: false, className: "" },
            "save-png": { onclick: null, disabled: false, className: "" },
            "save-midi": { onclick: null },
            "save-wav": { onclick: null },
            "save-ly": { onclick: null },
            "save-abc": { onclick: null },
            "save-mxml": { onclick: null },
            "save-blockartwork-svg": { onclick: null },
            "save-blockartwork-png": { onclick: null }
        };

        global.docById = jest.fn(id => elements[id] || { onclick: null });

        const mockActivity = {
            beginnerMode: true,
            language: "en",
            canvas: { width: 100, height: 100 },
            logo: {},
            turtles: {},
            _THIS_IS_MUSIC_BLOCKS_: false
        };

        const mockCallbacks = {
            html_onclick: jest.fn(),
            doSVG_onclick: jest.fn(),
            svg_onclick: jest.fn(),
            midi_onclick: jest.fn(),
            png_onclick: jest.fn(),
            wave_onclick: jest.fn(),
            ly_onclick: jest.fn(),
            abc_onclick: jest.fn(),
            mxml_onclick: jest.fn(),
            blockartworksvg_onclick: jest.fn(),
            blockartworkpng_onclick: jest.fn()
        };

        const toolbar = new Toolbar();
        toolbar.activity = mockActivity;
        toolbar.renderSaveIcons(...Object.values(mockCallbacks));
        expect(elements.saveButton.style.display).toBe("block");
        expect(elements.saveButtonAdvanced.style.display).toBe("none");

        elements.saveButton.onclick();
        elements["save-html-beg"].onclick();
        expect(mockCallbacks.html_onclick).toHaveBeenCalledWith(mockActivity);
        mockCallbacks.doSVG_onclick.mockReturnValueOnce("");

        elements.saveButton.onclick();
        expect(elements["save-png-beg"].disabled).toBe(true);
        expect(elements["save-png-beg"].className).toBe("grey-text inactiveLink");

        mockCallbacks.doSVG_onclick.mockReturnValueOnce("<svg>data</svg>");
        elements.saveButton.onclick();
        expect(elements["save-png-beg"].disabled).toBe(false);
        expect(elements["save-png-beg"].className).toBe("");

        elements["save-png-beg"].onclick();
        expect(mockCallbacks.png_onclick).toHaveBeenCalledWith(mockActivity);

        mockActivity.language = "ja";
        toolbar.renderSaveIcons(...Object.values(mockCallbacks));
        elements.saveButton.onclick();
        expect(mockCallbacks.html_onclick).toHaveBeenCalledWith(mockActivity);

        mockActivity.beginnerMode = false;
        mockActivity._THIS_IS_MUSIC_BLOCKS_ = true;
        toolbar.renderSaveIcons(...Object.values(mockCallbacks));

        expect(elements.saveButton.style.display).toBe("none");
        expect(elements.saveButtonAdvanced.style.display).toBe("block");

        elements.saveButtonAdvanced.onclick();

        mockCallbacks.doSVG_onclick.mockReturnValueOnce("");
        elements.saveButtonAdvanced.onclick();
        expect(elements["save-svg"].disabled).toBe(true);
        expect(elements["save-png"].disabled).toBe(true);
        expect(elements["save-svg"].className).toBe("grey-text inactiveLink");
        expect(elements["save-png"].className).toBe("grey-text inactiveLink");

        elements["save-svg"].onclick();
        expect(mockCallbacks.svg_onclick).toHaveBeenCalledWith(mockActivity);

        elements["save-png"].onclick();
        expect(mockCallbacks.png_onclick).toHaveBeenCalledWith(mockActivity);

        elements["save-blockartwork-svg"].onclick();
        expect(mockCallbacks.blockartworksvg_onclick).toHaveBeenCalledWith(mockActivity);

        elements["save-blockartwork-png"].onclick();
        expect(mockCallbacks.blockartworkpng_onclick).toHaveBeenCalledWith(mockActivity);
    });

    test("updateRecordButton hides record button", () => {
        const recordButton = {
            classList: { add: jest.fn() },
            style: { display: "" },
            innerHTML: ""
        };
        global.docById.mockReturnValue(recordButton);
        global.fnBrowserDetect = jest.fn(() => "firefox");
        toolbar.updateRecordButton(jest.fn());
        expect(recordButton.classList.add).toHaveBeenCalledWith("hide");
        expect(recordButton.style.display).toBe("");
    });

    test("renderPlanetIcon sets onclick and updates planet icon behavior", () => {
        const elements = {
            planetIcon: {
                onclick: null,
                style: { display: "" }
            },
            planetIconDisabled: {
                style: { display: "" }
            },
            toolbars: {
                style: { display: "" }
            },
            wheelDiv: {
                style: { display: "" }
            },
            contextWheelDiv: {
                style: { display: "" }
            }
        };

        global.docById.mockImplementation(id => elements[id] || {});

        const mockOnClick = jest.fn();
        toolbar.activity = {};
        toolbar.renderPlanetIcon(true, mockOnClick);
        expect(elements.planetIcon.onclick).toBeInstanceOf(Function);

        elements.planetIcon.onclick();

        expect(mockOnClick).toHaveBeenCalledWith(toolbar.activity);
        expect(elements.toolbars.style.display).toBe("none");
        expect(elements.wheelDiv.style.display).toBe("none");
        expect(elements.contextWheelDiv.style.display).toBe("none");

        toolbar.renderPlanetIcon(false, mockOnClick);
        expect(elements.planetIcon.style.display).toBe("none");
        expect(elements.planetIconDisabled.style.display).toBe("block");
    });

    test("renderMenuIcon toggles menu visibility", () => {
        const elements = {
            "menu": {
                onclick: null,
                innerHTML: "",
                style: {}
            },
            "aux-toolbar": {
                style: { display: "" }
            },
            "search": {
                classList: {
                    toggle: jest.fn()
                }
            },
            "toggleAuxBtn": {
                className: ""
            },
            "chooseKeyDiv": {
                style: { display: "" }
            },
            "movable": {
                style: { display: "" }
            }
        };

        global.docById.mockImplementation(id => elements[id] || {});

        const mockOnClick = jest.fn();
        toolbar.activity = {};
        toolbar.renderMenuIcon(mockOnClick);
        expect(elements.menu.onclick).toBeInstanceOf(Function);
        const clickHandler = elements.menu.onclick;

        elements["aux-toolbar"].style.display = "none";
        clickHandler();

        expect(mockOnClick).toHaveBeenCalledWith(toolbar.activity, false);
        expect(elements.menu.innerHTML).toBe("more_vert");
        expect(elements.toggleAuxBtn.className).toBe("blue darken-1");
        expect(elements.search.classList.toggle).toHaveBeenCalledWith("open");

        elements["aux-toolbar"].style.display = "block";
        clickHandler();

        expect(mockOnClick).toHaveBeenCalledWith(toolbar.activity, true);
        expect(elements["aux-toolbar"].style.display).toBe("none");
        expect(elements.menu.innerHTML).toBe("menu");
        expect(elements.toggleAuxBtn.className).toBe(NaN);
        expect(elements.chooseKeyDiv.style.display).toBe("none");
    });

    test("renderRunSlowlyIcon sets onclick and triggers slow run functionality", () => {
        const runSlowlyIcon = {
            onclick: null,
            style: { display: "" }
        };
        const stopIcon = {
            style: { color: "" }
        };

        global.docById.mockImplementation(id => {
            if (id === "runSlowlyIcon") return runSlowlyIcon;
            if (id === "stop") return stopIcon;
            return {};
        });

        toolbar.activity = {
            beginnerMode: false
        };
        toolbar.language = "en";
        toolbar.stopIconColorWhenPlaying = "#ff0000";

        const mockOnClick = jest.fn();
        toolbar.renderRunSlowlyIcon(mockOnClick);
        expect(runSlowlyIcon.onclick).toBeInstanceOf(Function);

        runSlowlyIcon.onclick();

        expect(mockOnClick).toHaveBeenCalledWith(toolbar.activity);
        expect(stopIcon.style.color).toBe("#ff0000");
        expect(runSlowlyIcon.style.display).toBe("");

        toolbar.activity.beginnerMode = true;
        toolbar.language = "ja";
        toolbar.renderRunSlowlyIcon(mockOnClick);
        expect(runSlowlyIcon.style.display).toBe("none");
    });

    test("renderHelpIcon sets onclick and updates tooltip", () => {
        const helpIcon = {
            setAttribute: jest.fn(),
            onclick: null
        };
        global.docById.mockReturnValue(helpIcon);
        const mockOnClick = jest.fn();
        toolbar.renderHelpIcon(mockOnClick);
        expect(helpIcon.onclick).toBeInstanceOf(Function);
        helpIcon.onclick();
        expect(mockOnClick).toHaveBeenCalledWith(toolbar.activity);
    });

    test("renderModeSelectIcon handles mode switching and UI updates", () => {
        // Mock DOM elements
        const elements = {
            beginnerMode: { onclick: null, style: { display: "" } },
            advancedMode: { onclick: null, style: { display: "" } },
            record: { style: { display: "" }, onclick: null },
            displayStatsIcon: { style: { display: "" }, onclick: null },
            loadPluginIcon: { style: { display: "" }, onclick: null },
            delPluginIcon: { style: { display: "" }, onclick: null },
            enableHorizScrollIcon: { style: { display: "" }, onclick: null },
            disableHorizScrollIcon: { style: { display: "" }, onclick: null },
            toggleJavaScriptIcon: { style: { display: "" } },
            saveButton: { style: { display: "" } },
            saveButtonAdvanced: { style: { display: "" } }
        };

        global.docById = jest.fn(id => elements[id]);
        global.localStorage = { setItem: jest.fn() };
        global.$j = jest.fn(() => ({
            tooltip: jest.fn(),
            dropdown: jest.fn()
        }));

        const mockDoSVG = jest.fn(() => "<svg>mock</svg>");
        global.doSVG = mockDoSVG;

        const mockActivity = {
            beginnerMode: true,
            helpfulWheelItems: [{ label: "Enable horizontal scrolling", display: false }],
            palettes: { updatePalettes: jest.fn() },
            refreshCanvas: jest.fn(),
            save: {
                saveHTML: jest.fn(),
                saveSVG: jest.fn(),
                saveMIDI: jest.fn(),
                savePNG: jest.fn(),
                saveWAV: jest.fn(),
                saveLilypond: jest.fn(),
                saveAbc: jest.fn(),
                saveMxml: jest.fn(),
                saveBlockArtwork: jest.fn(),
                saveBlockArtworkPNG: jest.fn()
            },
            toolbar: {
                renderSaveIcons: jest.fn(),
                updateRecordButton: jest.fn()
            }
        };

        const toolbar = new Toolbar();
        toolbar.activity = mockActivity;
        toolbar.tooltipsDisabled = false;

        const mockCallbacks = {
            onclick: jest.fn(),
            rec_onclick: jest.fn(),
            analytics_onclick: jest.fn(),
            openPlugin_onclick: jest.fn(),
            delPlugin_onclick: jest.fn(),
            setScroller: jest.fn()
        };

        toolbar.renderModeSelectIcon(
            mockCallbacks.onclick,
            mockCallbacks.rec_onclick,
            mockCallbacks.analytics_onclick,
            mockCallbacks.openPlugin_onclick,
            mockCallbacks.delPlugin_onclick,
            mockCallbacks.setScroller
        );

        expect(elements.beginnerMode.style.display).toBe("none");
        expect(elements.advancedMode.style.display).toBe("block");
        expect(elements.record.style.display).toBe("none");

        [
            "displayStatsIcon",
            "loadPluginIcon",
            "delPluginIcon",
            "enableHorizScrollIcon",
            "toggleJavaScriptIcon"
        ].forEach(iconId => {
            expect(elements[iconId].style.display).toBe("none");
        });

        expect(mockActivity.helpfulWheelItems[0].display).toBe(false);
        const renderSaveIconsArgs = mockActivity.toolbar.renderSaveIcons.mock.calls[0];
        expect(mockActivity.toolbar.renderSaveIcons).toHaveBeenCalled();

        renderSaveIconsArgs[0]();
        expect(mockActivity.save.saveHTML).toHaveBeenCalled();

        expect(renderSaveIconsArgs[1]).toBe(mockDoSVG);

        renderSaveIconsArgs[2]();
        expect(mockActivity.save.saveSVG).toHaveBeenCalled();

        renderSaveIconsArgs[3]();
        expect(mockActivity.save.saveMIDI).toHaveBeenCalled();

        renderSaveIconsArgs[4]();
        expect(mockActivity.save.savePNG).toHaveBeenCalled();

        renderSaveIconsArgs[5]();
        expect(mockActivity.save.saveWAV).toHaveBeenCalled();

        renderSaveIconsArgs[6]();
        expect(mockActivity.save.saveLilypond).toHaveBeenCalled();

        renderSaveIconsArgs[7]();
        expect(mockActivity.save.saveAbc).toHaveBeenCalled();

        renderSaveIconsArgs[8]();
        expect(mockActivity.save.saveMxml).toHaveBeenCalled();

        renderSaveIconsArgs[9]();
        expect(mockActivity.save.saveBlockArtwork).toHaveBeenCalled();

        renderSaveIconsArgs[10]();
        expect(mockActivity.save.saveBlockArtworkPNG).toHaveBeenCalled();
    });

    test("renderRunStepIcon sets onclick and handles Japanese beginner mode", () => {
        const runStepByStepIcon = { onclick: null, style: { display: "" } };
        global.docById.mockImplementation(id =>
            id === "runStepByStepIcon" ? runStepByStepIcon : {}
        );

        const mockActivity = { beginnerMode: false };
        const toolbar = new Toolbar();
        toolbar.activity = mockActivity;
        toolbar.language = "en";

        const mockOnClick = jest.fn();
        toolbar.renderRunStepIcon(mockOnClick);

        expect(runStepByStepIcon.onclick).toBeInstanceOf(Function);
        runStepByStepIcon.onclick();
        expect(mockOnClick).toHaveBeenCalledWith(mockActivity);
        expect(runStepByStepIcon.style.display).toBe("");

        toolbar.language = "ja";
        mockActivity.beginnerMode = true;
        toolbar.renderRunStepIcon(mockOnClick);
        expect(runStepByStepIcon.style.display).toBe("none");
    });

    test("renderMergeIcon sets onclick and triggers merge functionality", () => {
        const mergeWithCurrentIcon = { onclick: null };
        global.docById.mockReturnValue(mergeWithCurrentIcon);
        const mockOnClick = jest.fn();
        toolbar.renderMergeIcon(mockOnClick);
        expect(mergeWithCurrentIcon.onclick).toBeInstanceOf(Function);
        mergeWithCurrentIcon.onclick();
        expect(mockOnClick).toHaveBeenCalledWith(toolbar.activity);
    });

    test("renderRestoreIcon sets onclick and triggers restore functionality", () => {
        const restoreIcon = { onclick: null };
        global.docById.mockReturnValue(restoreIcon);
        const mockOnClick = jest.fn();
        toolbar.renderRestoreIcon(mockOnClick);
        expect(restoreIcon.onclick).toBeInstanceOf(Function);
        restoreIcon.onclick();
        expect(mockOnClick).toHaveBeenCalledWith(toolbar.activity);
    });

    test("renderChooseKeyIcon sets onclick and toggles key selection visibility", () => {
        const chooseKeyIcon = { onclick: null };
        const chooseKeyDiv = { style: { display: "none" } };
        global.docById.mockImplementation(id => {
            if (id === "chooseKeyIcon") return chooseKeyIcon;
            if (id === "chooseKeyDiv") return chooseKeyDiv;
            return {};
        });

        const mockOnClick = jest.fn();
        global._THIS_IS_MUSIC_BLOCKS_ = true;
        toolbar.renderChooseKeyIcon(mockOnClick);
        expect(chooseKeyIcon.onclick).toBeInstanceOf(Function);
        chooseKeyIcon.onclick();
        expect(mockOnClick).toHaveBeenCalledWith(toolbar.activity);
        expect(chooseKeyDiv.style.display).toBe("none");
    });

    test("renderJavaScriptIcon sets onclick and triggers JavaScript editor", () => {
        const toggleJavaScriptIcon = { onclick: null };
        global.docById.mockReturnValue(toggleJavaScriptIcon);
        const mockOnClick = jest.fn();
        toolbar.renderJavaScriptIcon(mockOnClick);
        expect(toggleJavaScriptIcon.onclick).toBeInstanceOf(Function);
        toggleJavaScriptIcon.onclick();
        expect(mockOnClick).toHaveBeenCalledWith(toolbar.activity);
    });

    test("renderLanguageSelectIcon sets onclick and updates language selection", () => {
        const languageSelectIcon = { onclick: null };
        const languageBox = { enUS_onclick: jest.fn() };

        // Mock elements for all language IDs with classList
        const mockLangElement = {
            onclick: null,
            classList: {
                add: jest.fn(),
                remove: jest.fn()
            }
        };

        global.docById.mockImplementation(id => {
            if (id === "languageSelectIcon") return languageSelectIcon;
            // Return mock element with classList for any language ID
            return mockLangElement;
        });

        global.localStorage.languagePreference = "enUS";

        toolbar.renderLanguageSelectIcon(languageBox);
        expect(languageSelectIcon.onclick).toBeInstanceOf(Function);
        languageSelectIcon.onclick();
        expect(global.localStorage.languagePreference).toBeDefined();
    });

    test("disableTooltips removes tooltips and sets tooltipsDisabled to true", () => {
        const mockJQuery = jest.fn(() => ({
            tooltip: jest.fn()
        }));
        toolbar.disableTooltips(mockJQuery);
        expect(mockJQuery).toHaveBeenCalledWith(".tooltipped");
        expect(toolbar.tooltipsDisabled).toBe(true);
    });

    test("closeAuxToolbar hides auxiliary toolbar if visible", () => {
        const elements = {
            "aux-toolbar": { style: { display: "block" } },
            "menu": { innerHTML: "" },
            "toggleAuxBtn": { className: "some-class blue darken-1" }
        };

        global.docById.mockImplementation(id => elements[id] || {});
        const mockOnClick = jest.fn();
        toolbar.activity = {};
        toolbar.closeAuxToolbar(mockOnClick);
        expect(elements["aux-toolbar"].style.display).toBe("none");
        expect(elements.menu.innerHTML).toBe("menu");
        expect(mockOnClick).toHaveBeenCalledWith(toolbar.activity, false);
    });
});
