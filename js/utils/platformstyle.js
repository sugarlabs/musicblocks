/*
Copyright (C) 2015 Sam Parkinson

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/* global showMaterialHighlight,platform,platformColor */

/* exported showButtonHighlight */

let themePreference;
try {
    themePreference = localStorage.themePreference || undefined;
} catch (e) {
    themePreference = undefined;
}

window.platform = {
    android: /Android/i.test(navigator.userAgent),
    FF: /Firefox/i.test(navigator.userAgent),
    mobile: /Mobi/i.test(navigator.userAgent),
    tablet: /Tablet/i.test(navigator.userAgent)
};

platform.androidWebkit = platform.android && !platform.FF;
platform.FFOS = platform.FF && (platform.mobile || platform.tablet) && !platform.android;

// Detect system theme preference
const getSystemThemePreference = () => {
    // Defaulting to light theme as requested
    return "light";
};

// Use stored preference, or fallback to system preference
const activeTheme = themePreference || getSystemThemePreference();

const syncPlatformColor = theme => {
    const el = document.body || document.documentElement;
    if (el && theme) {
        // Ensure the correct class is present before reading CSS variables
        el.classList.remove("light", "dark", "highcontrast");
        el.classList.add(theme);
    }
    const style = getComputedStyle(el);
    const getC = token => {
        let val = style.getPropertyValue(token);
        return val ? val.trim() : "";
    };

    window.platformColor = {
        textColor: getC("--pc-textColor"),
        blockText: getC("--pc-blockText"),
        dialogueBox: getC("--pc-dialogueBox"),
        strokeColor: getC("--pc-strokeColor"),
        fillColor: getC("--pc-fillColor"),
        blueButton: getC("--pc-blueButton"),
        blueButtonHover: getC("--pc-blueButtonHover"),
        blueButtonText: getC("--pc-blueButtonText"),
        cancelButton: getC("--pc-cancelButton"),
        cancelButtonHover: getC("--pc-cancelButtonHover"),
        headingColor: getC("--pc-headingColor"),
        hoverColor: getC("--pc-hoverColor"),
        widgetBackground: getC("--pc-widgetBackground"),
        widgetButton: getC("--pc-widgetButton"),
        widgetButtonSelect: getC("--pc-widgetButtonSelect"),
        paletteColors: {
            widgets: [
                getC("--pc-paletteColors-widgets-0"),
                getC("--pc-paletteColors-widgets-1"),
                getC("--pc-paletteColors-widgets-2"),
                getC("--pc-paletteColors-widgets-3")
            ],
            pitch: [
                getC("--pc-paletteColors-pitch-0"),
                getC("--pc-paletteColors-pitch-1"),
                getC("--pc-paletteColors-pitch-2"),
                getC("--pc-paletteColors-pitch-3")
            ],
            rhythm: [
                getC("--pc-paletteColors-rhythm-0"),
                getC("--pc-paletteColors-rhythm-1"),
                getC("--pc-paletteColors-rhythm-2"),
                getC("--pc-paletteColors-rhythm-3")
            ],
            meter: [
                getC("--pc-paletteColors-meter-0"),
                getC("--pc-paletteColors-meter-1"),
                getC("--pc-paletteColors-meter-2"),
                getC("--pc-paletteColors-meter-3")
            ],
            tone: [
                getC("--pc-paletteColors-tone-0"),
                getC("--pc-paletteColors-tone-1"),
                getC("--pc-paletteColors-tone-2"),
                getC("--pc-paletteColors-tone-3")
            ],
            ornament: [
                getC("--pc-paletteColors-ornament-0"),
                getC("--pc-paletteColors-ornament-1"),
                getC("--pc-paletteColors-ornament-2"),
                getC("--pc-paletteColors-ornament-3")
            ],
            intervals: [
                getC("--pc-paletteColors-intervals-0"),
                getC("--pc-paletteColors-intervals-1"),
                getC("--pc-paletteColors-intervals-2"),
                getC("--pc-paletteColors-intervals-3")
            ],
            volume: [
                getC("--pc-paletteColors-volume-0"),
                getC("--pc-paletteColors-volume-1"),
                getC("--pc-paletteColors-volume-2"),
                getC("--pc-paletteColors-volume-3")
            ],
            drum: [
                getC("--pc-paletteColors-drum-0"),
                getC("--pc-paletteColors-drum-1"),
                getC("--pc-paletteColors-drum-2"),
                getC("--pc-paletteColors-drum-3")
            ],
            graphics: [
                getC("--pc-paletteColors-graphics-0"),
                getC("--pc-paletteColors-graphics-1"),
                getC("--pc-paletteColors-graphics-2"),
                getC("--pc-paletteColors-graphics-3")
            ],
            turtle: [
                getC("--pc-paletteColors-turtle-0"),
                getC("--pc-paletteColors-turtle-1"),
                getC("--pc-paletteColors-turtle-2"),
                getC("--pc-paletteColors-turtle-3")
            ],
            pen: [
                getC("--pc-paletteColors-pen-0"),
                getC("--pc-paletteColors-pen-1"),
                getC("--pc-paletteColors-pen-2"),
                getC("--pc-paletteColors-pen-3")
            ],
            boxes: [
                getC("--pc-paletteColors-boxes-0"),
                getC("--pc-paletteColors-boxes-1"),
                getC("--pc-paletteColors-boxes-2"),
                getC("--pc-paletteColors-boxes-3")
            ],
            action: [
                getC("--pc-paletteColors-action-0"),
                getC("--pc-paletteColors-action-1"),
                getC("--pc-paletteColors-action-2"),
                getC("--pc-paletteColors-action-3")
            ],
            media: [
                getC("--pc-paletteColors-media-0"),
                getC("--pc-paletteColors-media-1"),
                getC("--pc-paletteColors-media-2"),
                getC("--pc-paletteColors-media-3")
            ],
            number: [
                getC("--pc-paletteColors-number-0"),
                getC("--pc-paletteColors-number-1"),
                getC("--pc-paletteColors-number-2"),
                getC("--pc-paletteColors-number-3")
            ],
            boolean: [
                getC("--pc-paletteColors-boolean-0"),
                getC("--pc-paletteColors-boolean-1"),
                getC("--pc-paletteColors-boolean-2"),
                getC("--pc-paletteColors-boolean-3")
            ],
            flow: [
                getC("--pc-paletteColors-flow-0"),
                getC("--pc-paletteColors-flow-1"),
                getC("--pc-paletteColors-flow-2"),
                getC("--pc-paletteColors-flow-3")
            ],
            sensors: [
                getC("--pc-paletteColors-sensors-0"),
                getC("--pc-paletteColors-sensors-1"),
                getC("--pc-paletteColors-sensors-2"),
                getC("--pc-paletteColors-sensors-3")
            ],
            extras: [
                getC("--pc-paletteColors-extras-0"),
                getC("--pc-paletteColors-extras-1"),
                getC("--pc-paletteColors-extras-2"),
                getC("--pc-paletteColors-extras-3")
            ],
            program: [
                getC("--pc-paletteColors-program-0"),
                getC("--pc-paletteColors-program-1"),
                getC("--pc-paletteColors-program-2"),
                getC("--pc-paletteColors-program-3")
            ],
            myblocks: [
                getC("--pc-paletteColors-myblocks-0"),
                getC("--pc-paletteColors-myblocks-1"),
                getC("--pc-paletteColors-myblocks-2"),
                getC("--pc-paletteColors-myblocks-3")
            ],
            heap: [
                getC("--pc-paletteColors-heap-0"),
                getC("--pc-paletteColors-heap-1"),
                getC("--pc-paletteColors-heap-2"),
                getC("--pc-paletteColors-heap-3")
            ],
            dictionary: [
                getC("--pc-paletteColors-dictionary-0"),
                getC("--pc-paletteColors-dictionary-1"),
                getC("--pc-paletteColors-dictionary-2"),
                getC("--pc-paletteColors-dictionary-3")
            ],
            ensemble: [
                getC("--pc-paletteColors-ensemble-0"),
                getC("--pc-paletteColors-ensemble-1"),
                getC("--pc-paletteColors-ensemble-2"),
                getC("--pc-paletteColors-ensemble-3")
            ]
        },
        disconnected: getC("--pc-disconnected"),
        header: getC("--pc-header"),
        aux: getC("--pc-aux"),
        sub: getC("--pc-sub"),
        doHeaderShadow: getC("--pc-doHeaderShadow"),
        rule: getC("--pc-rule"),
        ruleColor: getC("--pc-ruleColor"),
        trashColor: getC("--pc-trashColor"),
        trashBorder: getC("--pc-trashBorder"),
        trashActive: getC("--pc-trashActive"),
        background: getC("--pc-background"),
        paletteSelected: getC("--pc-paletteSelected"),
        paletteBackground: getC("--pc-paletteBackground"),
        paletteLabelBackground: getC("--pc-paletteLabelBackground"),
        paletteLabelSelected: getC("--pc-paletteLabelSelected"),
        paletteText: getC("--pc-paletteText"),
        rulerHighlight: getC("--pc-rulerHighlight"),
        selectorBackground: getC("--pc-selectorBackground"),
        selectorSelected: getC("--pc-selectorSelected"),
        labelColor: getC("--pc-labelColor"),
        lyricsLabelBackground: getC("--pc-lyricsLabelBackground"),
        lyricsInputBackground: getC("--pc-lyricsInputBackground"),
        tupletBackground: getC("--pc-tupletBackground"),
        drumBackground: getC("--pc-drumBackground"),
        pitchBackground: getC("--pc-pitchBackground"),
        graphicsBackground: getC("--pc-graphicsBackground"),
        drumLabelBackground: getC("--pc-drumLabelBackground"),
        pitchLabelBackground: getC("--pc-pitchLabelBackground"),
        graphicsLabelBackground: getC("--pc-graphicsLabelBackground"),
        rhythmcellcolor: getC("--pc-rhythmcellcolor"),
        stopIconcolor: getC("--pc-stopIconcolor"),
        hitAreaGraphicsBeginFill: getC("--pc-hitAreaGraphicsBeginFill"),
        orange: getC("--pc-orange"),
        piemenuBasic: [
            getC("--pc-piemenuBasic-0"),
            getC("--pc-piemenuBasic-1"),
            getC("--pc-piemenuBasic-2"),
            getC("--pc-piemenuBasic-3"),
            getC("--pc-piemenuBasic-4")
        ],
        exitWheelcolors: [getC("--pc-exitWheelcolors-0"), getC("--pc-exitWheelcolors-1")],
        exitWheelcolors2: [
            getC("--pc-exitWheelcolors2-0"),
            getC("--pc-exitWheelcolors2-1"),
            getC("--pc-exitWheelcolors2-2")
        ],
        pitchWheelcolors: [
            getC("--pc-pitchWheelcolors-0"),
            getC("--pc-pitchWheelcolors-1"),
            getC("--pc-pitchWheelcolors-2"),
            getC("--pc-pitchWheelcolors-3"),
            getC("--pc-pitchWheelcolors-4"),
            getC("--pc-pitchWheelcolors-5"),
            getC("--pc-pitchWheelcolors-6")
        ],
        gridWheelcolors: {
            wheel: [getC("--pc-gridWheelcolors-wheel-0")],
            selected: {
                fill: getC("--pc-gridWheelcolors-selected-fill"),
                stroke: getC("--pc-gridWheelcolors-selected-stroke")
            }
        },
        drumWheelcolors: [getC("--pc-drumWheelcolors-0"), getC("--pc-drumWheelcolors-1")],
        graphicWheelcolors: [getC("--pc-graphicWheelcolors-0"), getC("--pc-graphicWheelcolors-1")],
        accidentalsWheelcolors: [
            getC("--pc-accidentalsWheelcolors-0"),
            getC("--pc-accidentalsWheelcolors-1"),
            getC("--pc-accidentalsWheelcolors-2"),
            getC("--pc-accidentalsWheelcolors-3"),
            getC("--pc-accidentalsWheelcolors-4")
        ],
        accidentalsWheelcolorspush: getC("--pc-accidentalsWheelcolorspush"),
        octavesWheelcolors: [
            getC("--pc-octavesWheelcolors-0"),
            getC("--pc-octavesWheelcolors-1"),
            getC("--pc-octavesWheelcolors-2"),
            getC("--pc-octavesWheelcolors-3"),
            getC("--pc-octavesWheelcolors-4"),
            getC("--pc-octavesWheelcolors-5"),
            getC("--pc-octavesWheelcolors-6"),
            getC("--pc-octavesWheelcolors-7"),
            getC("--pc-octavesWheelcolors-8"),
            getC("--pc-octavesWheelcolors-9"),
            getC("--pc-octavesWheelcolors-10"),
            getC("--pc-octavesWheelcolors-11"),
            getC("--pc-octavesWheelcolors-12"),
            getC("--pc-octavesWheelcolors-13")
        ],
        blockLabelsWheelcolors: [
            getC("--pc-blockLabelsWheelcolors-0"),
            getC("--pc-blockLabelsWheelcolors-1"),
            getC("--pc-blockLabelsWheelcolors-2"),
            getC("--pc-blockLabelsWheelcolors-3"),
            getC("--pc-blockLabelsWheelcolors-4"),
            getC("--pc-blockLabelsWheelcolors-5"),
            getC("--pc-blockLabelsWheelcolors-6"),
            getC("--pc-blockLabelsWheelcolors-7"),
            getC("--pc-blockLabelsWheelcolors-8"),
            getC("--pc-blockLabelsWheelcolors-9"),
            getC("--pc-blockLabelsWheelcolors-10"),
            getC("--pc-blockLabelsWheelcolors-11")
        ],
        noteValueWheelcolors: [
            getC("--pc-noteValueWheelcolors-0"),
            getC("--pc-noteValueWheelcolors-1")
        ],
        tabsWheelcolors: [getC("--pc-tabsWheelcolors-0"), getC("--pc-tabsWheelcolors-1")],
        numberWheelcolors: [getC("--pc-numberWheelcolors-0"), getC("--pc-numberWheelcolors-1")],
        piemenuBasicundefined: [
            getC("--pc-piemenuBasicundefined-0"),
            getC("--pc-piemenuBasicundefined-1"),
            getC("--pc-piemenuBasicundefined-2")
        ],
        booleanWheelcolors: [getC("--pc-booleanWheelcolors-0"), getC("--pc-booleanWheelcolors-1")],
        piemenuVoicesColors: [
            getC("--pc-piemenuVoicesColors-0"),
            getC("--pc-piemenuVoicesColors-1"),
            getC("--pc-piemenuVoicesColors-2"),
            getC("--pc-piemenuVoicesColors-3"),
            getC("--pc-piemenuVoicesColors-4")
        ],
        intervalNameWheelcolors: [
            getC("--pc-intervalNameWheelcolors-0"),
            getC("--pc-intervalNameWheelcolors-1"),
            getC("--pc-intervalNameWheelcolors-2"),
            getC("--pc-intervalNameWheelcolors-3"),
            getC("--pc-intervalNameWheelcolors-4")
        ],
        intervalWheelcolors: [
            getC("--pc-intervalWheelcolors-0"),
            getC("--pc-intervalWheelcolors-1"),
            getC("--pc-intervalWheelcolors-2"),
            getC("--pc-intervalWheelcolors-3"),
            getC("--pc-intervalWheelcolors-4")
        ],
        modeWheelcolors: [getC("--pc-modeWheelcolors-0"), getC("--pc-modeWheelcolors-1")],
        modeGroupWheelcolors: [
            getC("--pc-modeGroupWheelcolors-0"),
            getC("--pc-modeGroupWheelcolors-1"),
            getC("--pc-modeGroupWheelcolors-2"),
            getC("--pc-modeGroupWheelcolors-3"),
            getC("--pc-modeGroupWheelcolors-4"),
            getC("--pc-modeGroupWheelcolors-5"),
            getC("--pc-modeGroupWheelcolors-6"),
            getC("--pc-modeGroupWheelcolors-7"),
            getC("--pc-modeGroupWheelcolors-8"),
            getC("--pc-modeGroupWheelcolors-9"),
            getC("--pc-modeGroupWheelcolors-10"),
            getC("--pc-modeGroupWheelcolors-11"),
            getC("--pc-modeGroupWheelcolors-12"),
            getC("--pc-modeGroupWheelcolors-13")
        ],
        modePieMenusIfColorPush: getC("--pc-modePieMenusIfColorPush"),
        modePieMenusElseColorPush: getC("--pc-modePieMenusElseColorPush"),
        wheelcolors: [
            getC("--pc-wheelcolors-0"),
            getC("--pc-wheelcolors-1"),
            getC("--pc-wheelcolors-2"),
            getC("--pc-wheelcolors-3"),
            getC("--pc-wheelcolors-4")
        ]
    };

    const themeColorMeta = document.querySelector("meta[name=theme-color]");
    if (themeColorMeta && window.platformColor) {
        themeColorMeta.content = window.platformColor.header;
    }

    return window.platformColor;
};

window.syncPlatformColor = syncPlatformColor;

try {
    syncPlatformColor(activeTheme);
} catch (e) {
    window.platformColor = {};
}

/**
 * @public
 * @param  {Number} x
 * @param  {Number} y
 * @param  {Number} r
 * @param  {Object} event
 * @param  {Number} scale
 * @param  {Object} stage
 * @returns {Object}
 */
let showButtonHighlight = (x, y, r, event, scale, stage) => {
    if (platform.FFOS) return {};
    return showMaterialHighlight(x, y, r, event, scale, stage);
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = { showButtonHighlight };
}
