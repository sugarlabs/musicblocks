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

/*
 * Canvas / EaselJS / Block-rendering styling adapter layer.
 *
 * NOTE: tokens.css is the single source of truth for DOM and CSS design tokens.
 * platformstyle.js acts strictly as the canvas and block-rendering adapter layer
 * where HTML5 Canvas / EaselJS APIs require raw colour values. Common values
 * (such as selector and label colors) align with the canonical tokens in tokens.css.
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

const SEMANTIC_PALETTE_COLORS = {
    dark: {
        green: ["#2E7D32", "#1B5E20", "#1B5E20", "#81C784"],
        orangeRhythm: ["#BF360C", "#8C2A0B", "#8C2A0B", "#FF8A65"],
        orangeMeter: ["#BF360C", "#8C2A0B", "#8C2A0B", "#FF8A65"],
        cyan: ["#00838F", "#005662", "#005662", "#4DD0E1"],
        blue: ["#3949AB", "#283593", "#283593", "#7986CB"],
        blueTurtle: ["#3949AB", "#283593", "#283593", "#7986CB"],
        amberBoxes: ["#E65100", "#BF360C", "#BF360C", "#FFB74D"],
        yellowAction: ["#FF8F00", "#FF6F00", "#FF6F00", "#FFE082"],
        yellowMyblocks: ["#FF8F00", "#FF6F00", "#FF6F00", "#FFE082"],
        red: ["#C62828", "#8E0000", "#8E0000", "#FF8A80"],
        pink: ["#AD1457", "#880E4F", "#880E4F", "#F48FB1"],
        purple: ["#7B1FA2", "#4A0072", "#4A0072", "#CE93D8"],
        brown: ["#5D4037", "#3E2723", "#3E2723", "#BCAAA4"],
        olive: ["#827717", "#4B830D", "#4B830D", "#E6EE9C"],
        gray: ["#424242", "#212121", "#212121", "#9E9E9E"]
    },
    light: {
        green: ["#7CD622", "#57AD02", "#57AD02", "#B4EB7D"],
        orangeRhythm: ["#FF8700", "#E86B0E", "#E86B0E", "#FEC092"],
        orangeMeter: ["#FE994F", "#E86B0E", "#E86B0E", "#FEC092"],
        cyan: ["#3EDCDD", "#1DBCBD", "#1DBCBD", "#A1EEEF"],
        blue: ["#92A9FF", "#5370DC", "#5370DC", "#CDD8FF"],
        blueTurtle: ["#92A9FF", "#5370DC", "#5370DC", "#CDD8FF"],
        amberBoxes: ["#FFB900", "#d18600", "#d18600", "#FFD092"],
        yellowAction: ["#F3C800", "#DAAF30", "#DAAF30", "#FFE391"],
        yellowMyblocks: ["#FFBF00", "#DAAF30", "#DAAF30", "#FFE391"],
        red: ["#FF664B", "#EA4326", "#EA4326", "#FFB9E2"],
        pink: ["#FF6EA1", "#FF2C76", "#FF2C76", "#FFCDDF"],
        purple: ["#D97DF5", "#B653D3", "#B653D3", "#EDC6A3"],
        brown: ["#D98A43", "#B7651A", "#B7651A", "#ECC6A4"],
        olive: ["#AABB00", "#748400", "#748400", "#FFE391"],
        gray: ["#C4C4C4", "#A0A0A0", "#A0A0A0", "#D0D0D0"]
    },
    highcontrast: {
        green: ["#00FF00", "#00CC00", "#00CC00", "#66FF66"],
        orangeRhythm: ["#FF8C9E", "#FFB3C1", "#FFD1DC", "#FFB3A7"],
        orangeMeter: ["#FF8C9E", "#FFB3C1", "#FFD1DC", "#FFB3A7"],
        cyan: ["#00FFFF", "#00CCCC", "#00CCCC", "#66FFFF"],
        blue: ["#FF29FF", "#FF8CFF", "#FFB3FF", "#FFD1FF"],
        blueTurtle: ["#FF00FF", "#CC00CC", "#CC00CC", "#FF66FF"],
        amberBoxes: ["#FFFF00", "#CCCC00", "#CCCC00", "#FFFF66"],
        yellowAction: ["#FFFF00", "#CCCC00", "#CCCC00", "#FFFF66"],
        yellowMyblocks: ["#FFFF00", "#CCCC00", "#CCCC00", "#FFFF66"],
        red: ["#FF8C9E", "#FFB3C1", "#FFD1DC", "#FFB3A7"],
        pink: ["#FF29FF", "#FF8CFF", "#FFB3FF", "#FFD1FF"],
        purple: ["#FF29FF", "#FF8CFF", "#FFB3FF", "#FFD1FF"],
        brown: ["#FFFF00", "#CCCC00", "#CCCC00", "#FFFF66"],
        olive: ["#00FF00", "#00CC00", "#00CC00", "#66FF66"],
        gray: ["#FFFFFF", "#CCCCCC", "#CCCCCC", "#FFFFFF"]
    }
};

const PALETTE_CATEGORY_MAP = {
    widgets: "green",
    pitch: "green",
    intervals: "green",
    rhythm: "orangeRhythm",
    meter: "orangeMeter",
    tone: "cyan",
    ornament: "cyan",
    volume: "cyan",
    drum: "cyan",
    graphics: "blue",
    turtle: "blueTurtle",
    pen: "blue",
    ensemble: "blue",
    boxes: "amberBoxes",
    action: "yellowAction",
    myblocks: "yellowMyblocks",
    media: "red",
    number: "pink",
    boolean: "purple",
    flow: "brown",
    heap: "brown",
    dictionary: "brown",
    sensors: "olive",
    extras: "gray",
    program: "gray"
};

/**
 * Builds the paletteColors map for a given theme from semantic palette definitions.
 * @param {string} theme "dark" | "light" | "highcontrast"
 * @returns {Object.<string, string[]>}
 */
function buildPaletteColors(theme) {
    const paletteSet = SEMANTIC_PALETTE_COLORS[theme];
    const colors = {};
    for (const [palette, category] of Object.entries(PALETTE_CATEGORY_MAP)) {
        colors[palette] = paletteSet[category];
    }
    return colors;
}

const platformThemes = {
    dark: {
        textColor: "#E2E2E2",
        blockText: "#FFFFFF",
        dialogueBox: "#1C1C1C",
        strokeColor: "#E2E2E2",
        fillColor: "#F9F9F9",
        blueButton: "#0066FF",
        blueButtonHover: "#023a76",
        blueButtonText: "white",
        cancelButton: "#f1f1f1",
        cancelButtonHover: "#afafaf",
        headingColor: "#0066ff",
        hoverColor: "#808080",
        widgetButton: "#225A91",
        widgetButtonSelect: "#979797",
        widgetBackground: "#454545",
        paletteColors: buildPaletteColors("dark"),

        disconnected: "#5C5C5C",
        header: "#1E88E5",
        ruleColor: "#303030",
        trashBorder: "#424242",
        trashActive: "#E53935",
        background: "#303030", // Very dark gray
        paletteBackground: "#1C1C1C",
        paletteLabelBackground: "#022363",
        paletteLabelSelected: "#01143b",
        paletteText: "#BDBDBD",
        rulerHighlight: "#FFEB3B",
        selectorBackground: "#64B5F6",
        selectorSelected: "#1E88E5",
        labelColor: "#BDBDBD",
        lyricsLabelBackground: "#C7225D",
        lyricsInputBackground: "#D15A84",
        tupletBackground: "#424242",
        drumBackground: "#00ACC1",
        pitchBackground: "#4CAF50",
        graphicsBackground: "#7986CB",
        drumLabelBackground: "#008BA3",
        pitchLabelBackground: "#388E3C",
        graphicsLabelBackground: "#5C6BC0",
        rhythmcellcolor: "#303030",
        stopIconcolor: "#D50000",
        hitAreaGraphicsBeginFill: "#121212",
        orange: "#FB8C00", // 5YR
        piemenuBasic: ["#00ACC1", "#4CAF50", "#008BA3", "#4CAF50", "#008BA3"],
        exitWheelcolors: ["#757575", "#BDBDBD"],
        exitWheelcolors2: ["#757575", "#7986CB", "#4CAF50"],
        pitchWheelcolors: [
            "#388E3C",
            "#4CAF50",
            "#388E3C",
            "#008BA3",
            "#388E3C",
            "#4CAF50",
            "#66BB6A"
        ],
        gridWheelcolors: {
            wheel: ["#D6D6D6"],
            selected: {
                fill: "#858585",
                stroke: "#777"
            }
        },
        drumWheelcolors: ["#008BA3", "#00ACC1"],
        graphicWheelcolors: ["#7986CB", "#5C6BC0"],
        accidentalsWheelcolors: ["#388E3C", "#4CAF50", "#388E3C", "#008BA3", "#388E3C"],
        accidentalsWheelcolorspush: "#424242",
        octavesWheelcolors: [
            "#FFCDD2",
            "#EF9A9A",
            "#FFCDD2",
            "#EF9A9A",
            "#FFCDD2",
            "#EF9A9A",
            "#FFCDD2",
            "#EF9A9A",
            "#424242",
            "#424242",
            "#424242",
            "#424242",
            "#424242",
            "#424242"
        ],
        blockLabelsWheelcolors: [
            "#FFCDD2",
            "#EF9A9A",
            "#FFCDD2",
            "#EF9A9A",
            "#FFCDD2",
            "#EF9A9A",
            "#FFCDD2",
            "#EF9A9A",
            "#FFCDD2",
            "#EF9A9A",
            "#FFCDD2",
            "#EF9A9A"
        ],
        noteValueWheelcolors: ["#FFCDD2", "#EF9A9A"],
        tabsWheelcolors: ["#FFCDD2", "#EF9A9A"],
        numberWheelcolors: ["#FFCDD2", "#EF9A9A"],
        piemenuBasicundefined: ["#388E3C", "#4CAF50", "#008BA3"],
        booleanWheelcolors: ["#C5CAE9", "#9FA8DA"],
        piemenuVoicesColors: ["#00ACC1", "#4CAF50", "#008BA3", "#4CAF50", "#008BA3"],
        intervalNameWheelcolors: ["#388E3C", "#4CAF50", "#388E3C", "#008BA3", "#4CAF50"],
        intervalWheelcolors: ["#388E3C", "#4CAF50", "#388E3C", "#008BA3", "#4CAF50"],
        modeWheelcolors: ["#388E3C", "#4CAF50"],
        modeGroupWheelcolors: [
            "#FFCDD2",
            "#EF9A9A",
            "#FFCDD2",
            "#EF9A9A",
            "#FFCDD2",
            "#EF9A9A",
            "#FFCDD2",
            "#EF9A9A",
            "#424242",
            "#424242",
            "#424242",
            "#424242",
            "#424242",
            "#424242"
        ],
        modePieMenusIfColorPush: "#66BB6A",
        modePieMenusElseColorPush: "#81C784",
        wheelcolors: ["#424242", "#616161", "#424242", "#616161", "#424242"]
    },
    light: {
        textColor: "black",
        blockText: "#282828",
        dialogueBox: "#fff",
        strokeColor: "#E2E2E2",
        fillColor: "#F9F9F9",
        blueButton: "#0066FF",
        blueButtonHover: "#023a76",
        blueButtonText: "white",
        cancelButton: "#f1f1f1",
        cancelButtonHover: "#afafaf",
        headingColor: "#0066ff",
        hoverColor: "#E0E0E0",
        widgetBackground: "#ccc",
        widgetButton: "#8cc6ff",
        widgetButtonSelect: "#C8C8C8",
        paletteColors: buildPaletteColors("light"),

        disconnected: "#C4C4C4", // disconnected block color
        header: "#4DA6FF",
        ruleColor: "#E2E2E2",
        trashBorder: "#808080",
        trashActive: "#FF0000",
        background: "#F9F9F9",
        paletteBackground: "#FFFFFF",
        paletteLabelBackground: "#8CC6FF",
        paletteLabelSelected: "#1A8CFF",
        paletteText: "#666666",
        rulerHighlight: "#FFBF00",
        selectorBackground: "#8CC6FF",
        selectorSelected: "#1A8CFF",
        labelColor: "#a0a0a0",
        lyricsLabelBackground: "#FF2B77",
        lyricsInputBackground: "#FF6EA1",
        tupletBackground: "#c0c0c0",
        drumBackground: "#3EDCDD",
        pitchBackground: "#7CD622",
        graphicsBackground: "#92A9FF",
        drumLabelBackground: "#25C3C0",
        pitchLabelBackground: "#77C428",
        graphicsLabelBackground: "#728FF9",
        rhythmcellcolor: "#c8c8c8",
        stopIconcolor: "#ea174c",
        hitAreaGraphicsBeginFill: "#FFF",
        orange: "#e37a00", // 5YR
        piemenuBasic: ["#3ea4a3", "#60bfbc", "#1d8989", "#60bfbc", "#1d8989"],
        exitWheelcolors: ["#808080", "#c0c0c0"],
        exitWheelcolors2: ["#808080", "#92a9ff", "#80a080"],
        pitchWheelcolors: [
            "#77c428",
            "#93e042",
            "#77c428",
            "#5ba900",
            "#77c428",
            "#93e042",
            "#adfd55"
        ],
        gridWheelcolors: {
            wheel: ["#ffffff"],
            selected: {
                fill: "#dedede",
                stroke: "#a3a3a3"
            }
        },
        drumWheelcolors: ["#1fadae", "#3edcdd"],
        graphicWheelcolors: ["#92a9ff", "#728ff9"],
        accidentalsWheelcolors: ["#77c428", "#93e042", "#77c428", "#5ba900", "#77c428"],
        accidentalsWheelcolorspush: "#c0c0c0",
        octavesWheelcolors: [
            "#ffb2bc",
            "#ffccd6",
            "#ffb2bc",
            "#ffccd6",
            "#ffb2bc",
            "#ffccd6",
            "#ffb2bc",
            "#ffccd6",
            "#c0c0c0",
            "#c0c0c0",
            "#c0c0c0",
            "#c0c0c0",
            "#c0c0c0",
            "#c0c0c0"
        ],
        blockLabelsWheelcolors: [
            "#ffb2bc",
            "#ffccd6",
            "#ffb2bc",
            "#ffccd6",
            "#ffb2bc",
            "#ffccd6",
            "#ffb2bc",
            "#ffccd6",
            "#ffb2bc",
            "#ffccd6",
            "#ffb2bc",
            "#ffccd6"
        ],
        noteValueWheelcolors: ["#ffb2bc", "#ffccd6"],
        tabsWheelcolors: ["#ffb2bc", "#ffccd6"],
        numberWheelcolors: ["#ffb2bc", "#ffccd6"],
        piemenuBasicundefined: ["#77c428", "#93e042", "#5ba900"],
        booleanWheelcolors: ["#d3cf76", "#b8b45f"],
        piemenuVoicesColors: ["#3ea4a3", "#60bfbc", "#1d8989", "#60bfbc", "#1d8989"],
        intervalNameWheelcolors: ["#77c428", "#93e042", "#77c428", "#5ba900", "#93e042"],
        intervalWheelcolors: ["#77c428", "#93e042", "#77c428", "#5ba900", "#93e042"],
        modeWheelcolors: ["#77c428", "#93e042"],
        modeGroupWheelcolors: [
            "#ffb2bc",
            "#ffccd6",
            "#ffb2bc",
            "#ffccd6",
            "#ffb2bc",
            "#ffccd6",
            "#ffb2bc",
            "#ffccd6",
            "#c0c0c0",
            "#c0c0c0",
            "#c0c0c0",
            "#c0c0c0",
            "#c0c0c0",
            "#c0c0c0"
        ],
        modePieMenusIfColorPush: "#4b8b0e",
        modePieMenusElseColorPush: "#66a62d",
        wheelcolors: ["#424242", "#616161", "#424242", "#616161", "#424242"]
    },
    highcontrast: {
        textColor: "#FFFFFF",
        blockText: "#000000",
        dialogueBox: "#000000",
        strokeColor: "#FFFFFF",
        fillColor: "#FFFFFF",
        blueButton: "#00FFFF",
        blueButtonHover: "#00CCCC",
        blueButtonText: "black",
        cancelButton: "#FFFFFF",
        cancelButtonHover: "#CCCCCC",
        headingColor: "#ffff00",
        hoverColor: "#666666",
        widgetBackground: "#000000",
        widgetButton: "#00FFFF",
        widgetButtonSelect: "#FFFFFF",
        paletteColors: buildPaletteColors("highcontrast"),

        disconnected: "#666666",
        header: "#00FFFF",
        ruleColor: "#FFFFFF",
        trashBorder: "#FFFFFF",
        trashActive: "#FF0000",
        background: "#000000",
        paletteBackground: "#000000",
        paletteLabelBackground: "#000080",
        paletteLabelSelected: "#0000FF",
        paletteText: "#FFFFFF",
        rulerHighlight: "#FFFF00",
        selectorBackground: "#00FFFF",
        selectorSelected: "#00CCCC",
        labelColor: "#FFFFFF",
        lyricsLabelBackground: "#FF00FF",
        lyricsInputBackground: "#FF66FF",
        tupletBackground: "#333333",
        drumBackground: "#00FFFF",
        pitchBackground: "#00FF00",
        graphicsBackground: "#FF00FF",
        drumLabelBackground: "#00CCCC",
        pitchLabelBackground: "#00CC00",
        graphicsLabelBackground: "#CC00CC",
        rhythmcellcolor: "#333333",
        stopIconcolor: "#FF0000",
        hitAreaGraphicsBeginFill: "#000000",
        orange: "#FF8800",
        piemenuBasic: ["#00FFFF", "#00FF00", "#00CCCC", "#00FF00", "#00CCCC"],
        exitWheelcolors: ["#FFFFFF", "#CCCCCC"],
        exitWheelcolors2: ["#FFFFFF", "#FF00FF", "#00FF00"],
        pitchWheelcolors: [
            "#00CC00",
            "#00FF00",
            "#00CC00",
            "#009900",
            "#00CC00",
            "#00FF00",
            "#33FF33"
        ],
        gridWheelcolors: {
            wheel: ["#FFFFFF"],
            selected: {
                fill: "#dedede",
                stroke: "#000000"
            }
        },
        drumWheelcolors: ["#00CCCC", "#00FFFF"],
        graphicWheelcolors: ["#FF00FF", "#CC00CC"],
        accidentalsWheelcolors: ["#00CC00", "#00FF00", "#00CC00", "#009900", "#00CC00"],
        accidentalsWheelcolorspush: "#333333",
        octavesWheelcolors: [
            "#FF6666",
            "#FFCCCC",
            "#FF6666",
            "#FFCCCC",
            "#FF6666",
            "#FFCCCC",
            "#FF6666",
            "#FFCCCC",
            "#333333",
            "#333333",
            "#333333",
            "#333333",
            "#333333",
            "#333333"
        ],
        blockLabelsWheelcolors: [
            "#FF6666",
            "#FFCCCC",
            "#FF6666",
            "#FFCCCC",
            "#FF6666",
            "#FFCCCC",
            "#FF6666",
            "#FFCCCC",
            "#FF6666",
            "#FFCCCC",
            "#FF6666",
            "#FFCCCC"
        ],
        noteValueWheelcolors: ["#FF6666", "#FFCCCC"],
        tabsWheelcolors: ["#FF6666", "#FFCCCC"],
        numberWheelcolors: ["#FF6666", "#FFCCCC"],
        piemenuBasicundefined: ["#00CC00", "#00FF00", "#009900"],
        booleanWheelcolors: ["#FFFF66", "#FFFFCC"],
        piemenuVoicesColors: ["#00FFFF", "#00FF00", "#00CCCC", "#00FF00", "#00CCCC"],
        intervalNameWheelcolors: ["#00CC00", "#00FF00", "#00CC00", "#009900", "#00FF00"],
        intervalWheelcolors: ["#00CC00", "#00FF00", "#00CC00", "#009900", "#00FF00"],
        modeWheelcolors: ["#00CC00", "#00FF00"],
        modeGroupWheelcolors: [
            "#FF6666",
            "#FFCCCC",
            "#FF6666",
            "#FFCCCC",
            "#FF6666",
            "#FFCCCC",
            "#FF6666",
            "#FFCCCC",
            "#333333",
            "#333333",
            "#333333",
            "#333333",
            "#333333",
            "#333333"
        ],
        modePieMenusIfColorPush: "#009900",
        modePieMenusElseColorPush: "#33FF33",
        wheelcolors: ["#424242", "#616161", "#424242", "#616161", "#424242"]
    }
};

window.platformThemes = platformThemes;

// Detect system theme preference
const getSystemThemePreference = () => {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
    }
    return "light";
};

// Use stored preference, or fallback to system preference
const activeTheme = themePreference || getSystemThemePreference();

// Set platformColor based on active theme
if (platformThemes[activeTheme]) {
    window.platformColor = platformThemes[activeTheme];
} else {
    window.platformColor = platformThemes["light"];
}

const _themeMeta = document.querySelector("meta[name=theme-color]");
if (_themeMeta) _themeMeta.content = platformColor.header;

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
    module.exports = {
        showButtonHighlight,
        platformThemes,
        platformColor: window.platformColor,
        SEMANTIC_PALETTE_COLORS,
        PALETTE_CATEGORY_MAP,
        buildPaletteColors
    };
}
