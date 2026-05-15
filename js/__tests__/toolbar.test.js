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

/* global _THIS_IS_MUSIC_BLOCKS_, WRAP, RECORDBUTTON */

const { platformColor } = require("../utils/platformstyle");
global.platformColor = platformColor;

jest.mock("../utils/platformstyle", () => ({
    platformColor: { stopIconColor: "#ea174c" }
}));

// Mock jQuery for tooltip/dropdown
global.jQuery = jest.fn(selector => ({
    on: jest.fn(),
    trigger: jest.fn(),
    tooltip: jest.fn(),
    dropdown: jest.fn(),
    0: typeof selector === "string" ? document.querySelector(selector) : selector
}));
global.jQuery.noConflict = jest.fn(() => global.jQuery);
global.$j = global.jQuery;

// Mock globals needed by Toolbar
global.docById = id => document.getElementById(id);
global.setScroller = jest.fn();
global._ = jest.fn(str => str);
global.logoToggleWrap = jest.fn(() => {
    global.WRAP = !global.WRAP;
});
global.fnBrowserDetect = jest.fn(() => "firefox");
global.doSVG_onclick = jest.fn(() => "mock-svg-data");
global.doSVG = jest.fn();
global.safeStorageGet = jest.fn(key => {
    if (key === "themePreference") return "light";
    return null;
});
global.safeStorageSet = jest.fn();
global.RECORDBUTTON = "fiber_manual_record";

const Toolbar = require("../toolbar");

describe("Toolbar Class", () => {
    let toolbar;
    let mockActivity;

    beforeEach(() => {
        // Clear previous state
        document.body.innerHTML = "";
        jest.clearAllMocks();

        // Setup base DOM skeleton
        document.body.innerHTML = `
            <div id="beginnerMode"></div>
            <div id="advancedMode"></div>
            <div id="mb-logo"></div>
            <div id="play" class="toolbar-icon"></div>
            <div id="stop" class="toolbar-icon"></div>
            <div id="record" class="toolbar-icon"></div>
            <div id="recordDropdownArrow"></div>
            <div id="recorddropdown"></div>
            <div id="record-with-menus"></div>
            <div id="record-canvas-only"></div>
            <div id="load" class="toolbar-icon"></div>
            <div id="saveButton" class="toolbar-icon"></div>
            <div id="saveButtonAdvanced" class="toolbar-icon"></div>
            <div id="saveButton-beginner" class="toolbar-icon"></div>
            <div id="wrapIcon" class="toolbar-icon"></div>
            <div id="helpIcon" class="toolbar-icon"></div>
            <div id="menu" class="toolbar-icon"></div>
            <div id="aux-toolbar"></div>
            <div id="themeSelectIcon"></div>
            <div id="runSlowlyIcon"></div>
            <div id="planetIcon"></div>
            <div id="canvasHolder"></div>
            <div id="toolbars"></div>
            <div id="palette"></div>
            <div id="newdropdown"></div>
            <div id="modal-container"></div>
            <div id="wrapTurtle"></div>
            <div id="helpfulWheelDiv"></div>
            <div id="themeBox"></div>
            <div id="search"></div>
            <div id="wheelDiv"></div>
            <div id="contextWheelDiv"></div>
            <div id="save-html-beg"></div>
            <div id="save-svg-beg"></div>
            <div id="save-png-beg"></div>
            <div id="save-midi-beg"></div>
            <div id="light"></div>
            <div id="dark"></div>
            <div id="chooseKeyDiv"></div>
            <div id="movable"></div>
        `;

        global.window.localStorage.languagePreference = "en";
        global.WRAP = false;
        global._THIS_IS_MUSIC_BLOCKS_ = false;

        toolbar = new Toolbar();
        toolbar.stopIconColorWhenPlaying = "#ea174c";

        mockActivity = {
            beginnerMode: true,
            palettes: { resetKeyboardNavigation: jest.fn(), updatePalettes: jest.fn() },
            textMsg: jest.fn(),
            hideMsgs: jest.fn(),
            refreshCanvas: jest.fn(),
            canvas: { width: 100, height: 100 },
            logo: {},
            turtles: {},
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
            _THIS_IS_MUSIC_BLOCKS_: false,
            helpfulWheelItems: [
                { label: "Turtle Wrap Off", display: false },
                { label: "Turtle Wrap On", display: true }
            ]
        };
        mockActivity.toolbar = toolbar;

        global.saveButton = document.getElementById("saveButton");
        global.saveButtonAdvanced = document.getElementById("saveButtonAdvanced");
    });

    test("initializes with correct properties and sets activity", () => {
        toolbar.init(mockActivity);
        expect(toolbar.activity).toEqual(mockActivity);
        expect(toolbar.language.startsWith("en")).toBe(true);
        expect(toolbar.tooltipsDisabled).toBe(false);
    });

    test("sets correct strings for _THIS_IS_MUSIC_BLOCKS_ true", () => {
        global._THIS_IS_MUSIC_BLOCKS_ = true;
        toolbar.init({});
        expect(global._).toHaveBeenCalledWith("About Music Blocks");
    });

    test("sets correct strings for _THIS_IS_MUSIC_BLOCKS_ false", () => {
        global._THIS_IS_MUSIC_BLOCKS_ = false;
        toolbar.init({});
        expect(global._).toHaveBeenCalledWith("About Turtle Blocks");
    });

    test("handles language fallback", () => {
        delete global.window.localStorage.languagePreference;
        const tb = new Toolbar();
        tb.init({});
        expect(tb.language.startsWith("en")).toBe(true);
    });

    test("init sets activity and updates beginner/advanced mode display", () => {
        const beginnerModeElem = document.getElementById("beginnerMode");
        const advancedModeElem = document.getElementById("advancedMode");

        toolbar.init(mockActivity);

        expect(beginnerModeElem.style.display).toBe("none");
        expect(advancedModeElem.style.display).toBe("block");
    });

    test("renderLogoIcon sets up logo with correct interactions", () => {
        const logoElem = document.getElementById("mb-logo");
        toolbar.activity = {};
        toolbar.language = "en";

        const mockOnClick = jest.fn();
        toolbar.renderLogoIcon(mockOnClick);

        expect(typeof logoElem.onclick).toBe("function");
        logoElem.onclick();
        expect(mockOnClick).toHaveBeenCalled();
    });

    test("renderPlayIcon sets onclick and updates UI states", () => {
        const playBtn = document.getElementById("play");
        const stopBtn = document.getElementById("stop");
        const recordBtn = document.getElementById("record");

        toolbar.activity = mockActivity;
        const mockOnClick = jest.fn();
        toolbar.renderPlayIcon(mockOnClick);

        playBtn.onclick();

        expect(mockOnClick).toHaveBeenCalled();
        expect(stopBtn.style.color).toBeTruthy();
        expect(recordBtn.className).toContain("grey-text");
    });

    test("renderStopIcon resets UI states", () => {
        const stopBtn = document.getElementById("stop");
        const recordBtn = document.getElementById("record");

        toolbar.activity = mockActivity;
        const mockOnClick = jest.fn();
        toolbar.renderStopIcon(mockOnClick);

        stopBtn.onclick();

        expect(mockOnClick).toHaveBeenCalled();
        expect(stopBtn.style.color).toBe("white");
        expect(recordBtn.className).not.toContain("grey-text");
    });

    test("renderNewProjectIcon displays modal and handles confirmation", () => {
        const modalContainer = document.getElementById("modal-container");
        const newDropdown = document.getElementById("newdropdown");

        toolbar.activity = mockActivity;
        const mockOnClick = jest.fn();
        toolbar.renderNewProjectIcon(mockOnClick);

        expect(modalContainer.style.display).toBe("flex");

        const confirmBtn = newDropdown.querySelector("#new-project");
        expect(confirmBtn).toBeTruthy();

        confirmBtn.onclick();
        expect(modalContainer.style.display).toBe("none");
        expect(mockOnClick).toHaveBeenCalled();
    });

    test("renderLoadIcon sets onclick", () => {
        const loadIcon = document.getElementById("load");
        const mockOnClick = jest.fn();
        toolbar.renderLoadIcon(mockOnClick);

        loadIcon.onclick();
        expect(mockOnClick).toHaveBeenCalled();
    });

    test("renderThemeSelectIcon sets onclick", () => {
        const themeIcon = document.getElementById("themeSelectIcon");
        const themeBox = { light_onclick: jest.fn(), dark_onclick: jest.fn() };

        toolbar.renderThemeSelectIcon(themeBox, ["light", "dark"]);
        expect(typeof themeIcon.onclick).toBe("function");
    });

    test("renderWrapIcon toggles WRAP", () => {
        const wrapIcon = document.getElementById("wrapTurtle");
        toolbar.activity = mockActivity;

        toolbar.renderWrapIcon();
        wrapIcon.onclick();

        // Initial WRAP is true in toolbar.js. First toggle makes it false.
        // False state corresponds to tooltip "Turtle Wrap On".
        expect(wrapIcon.getAttribute("data-tooltip")).toBe("Turtle Wrap On");
    });

    test("changeWrap updates icon", () => {
        const wrapIcon = document.getElementById("wrapTurtle");
        toolbar.activity = mockActivity;

        toolbar.changeWrap(mockActivity);
        // WRAP goes from current (false after previous test?) to next.
        // Actually each test runs fresh due to require caching? No, require is cached.
        // But the previous test made it false. Now it becomes true.
        // True state corresponds to "Turtle Wrap Off".
        expect(wrapIcon.getAttribute("data-tooltip")).toBe("Turtle Wrap Off");
    });

    test("renderSaveIcons handles save click", () => {
        const saveBtn = document.getElementById("saveButton");
        const saveHtmlBtn = document.getElementById("save-html-beg");

        const mockSaveHtml = jest.fn();
        const mockDoSvg = jest.fn(() => "svg-data");
        toolbar.activity = mockActivity;

        toolbar.renderSaveIcons(
            mockSaveHtml,
            mockDoSvg,
            jest.fn(),
            jest.fn(),
            jest.fn(),
            jest.fn(),
            jest.fn(),
            jest.fn(),
            jest.fn(),
            jest.fn(),
            jest.fn()
        );

        saveBtn.onclick();
        saveHtmlBtn.onclick();
        expect(mockSaveHtml).toHaveBeenCalled();
        expect(mockDoSvg).toHaveBeenCalled();
    });

    test("updateRecordButton handles browser visibility", () => {
        const recordBtn = document.getElementById("record");
        global.fnBrowserDetect.mockReturnValue("firefox");

        toolbar.updateRecordButton(jest.fn());
        expect(recordBtn.classList.contains("hide")).toBe(true);
    });

    test("renderPlanetIcon sets onclick", () => {
        const planetIcon = document.getElementById("planetIcon");
        const mockOnClick = jest.fn();

        toolbar.activity = mockActivity;
        toolbar.renderPlanetIcon(true, mockOnClick);

        planetIcon.onclick();
        expect(mockOnClick).toHaveBeenCalled();
    });

    test("renderMenuIcon toggles aux toolbar", () => {
        const menuIcon = document.getElementById("menu");
        const auxToolbar = document.getElementById("aux-toolbar");
        auxToolbar.style.display = "none";

        const mockOnClick = jest.fn();
        toolbar.activity = mockActivity;
        toolbar.renderMenuIcon(mockOnClick);

        menuIcon.onclick();
        expect(auxToolbar.style.display).toBe("block");
        expect(mockOnClick).toHaveBeenCalled();
    });

    test("renderHelpIcon sets onclick", () => {
        const helpIcon = document.getElementById("helpIcon");
        const mockOnClick = jest.fn();

        toolbar.activity = mockActivity;
        toolbar.renderHelpIcon(mockOnClick);

        helpIcon.onclick();
        expect(mockOnClick).toHaveBeenCalled();
    });

    test("renderModeSelectIcon switches mode", () => {
        toolbar.activity = mockActivity;
        mockActivity.beginnerMode = true;

        toolbar.renderModeSelectIcon(jest.fn());
        expect(document.getElementById("beginnerMode").style.display).toBe("none");
    });
});

describe("FocusCycleManager", () => {
    let manager;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="palette"></div>
            <div id="toolbars"></div>
            <div id="canvasHolder"></div>
            <div id="canvas"></div>
        `;
        manager = new Toolbar.FocusCycleManager();
    });

    test("init adds live region to body", () => {
        manager.init();
        const liveRegion = document.body.querySelector('[aria-live="polite"]');
        expect(liveRegion).toBeTruthy();
    });

    test("leaving palette resets navigation", () => {
        const resetNav = jest.fn();
        global.ActivityContext = {
            getActivity: jest.fn(() => ({
                palettes: { resetKeyboardNavigation: resetNav }
            }))
        };

        manager._leaveZone("palette");
        expect(resetNav).toHaveBeenCalled();
    });
});
