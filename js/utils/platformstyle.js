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

const themeName = localStorage.myThemeName || undefined;


window.platform = {
    android: /Android/i.test(navigator.userAgent),
    FF: /Firefox/i.test(navigator.userAgent),
    mobile: /Mobi/i.test(navigator.userAgent),
    tablet: /Tablet/i.test(navigator.userAgent)
};

platform.androidWebkit = platform.android && !platform.FF;
platform.FFOS = platform.FF && (platform.mobile || platform.tablet) && !platform.android;

if (themeName === "darkMode") {
    window.platformColor = {
        textColor : "#E2E2E2",
        blockText: "#E2E2E2",
        dialogueBox:"#1C1C1C",
        strokeColor: "#E2E2E2",
        fillColor: "#F9F9F9",
        blueButton: "#0066FF",
        hoverColor:  "#808080",
        paletteColors: {
            widgets: ["#2E7D32", "#1B5E20", "#388E3C", "#81C784"],
            pitch: ["#2E7D32", "#1B5E20", "#388E3C", "#81C784"],
            rhythm: ["#BF360C", "#8C2A0B", "#D84315", "#FF8A65"],
            meter: ["#BF360C", "#8C2A0B", "#D84315", "#FF8A65"],
            tone: ["#00838F", "#005662", "#0097A7", "#4DD0E1"],
            ornament: ["#00838F", "#005662", "#0097A7", "#4DD0E1"],
            intervals: ["#2E7D32", "#1B5E20", "#388E3C", "#81C784"],
            volume: ["#00838F", "#005662", "#0097A7", "#4DD0E1"],
            drum: ["#00838F", "#005662", "#0097A7", "#4DD0E1"],
            graphics: ["#3949AB", "#283593", "#5E35B1", "#7986CB"],
            turtle: ["#3949AB", "#283593", "#5E35B1", "#7986CB"],
            pen: ["#3949AB", "#283593", "#5E35B1", "#7986CB"],
            boxes: ["#E65100", "#BF360C", "#F57C00", "#FFB74D"],
            action: ["#FF8F00", "#FF6F00", "#FFB300", "#FFE082"],
            media: ["#C62828", "#8E0000", "#E53935", "#FF8A80"],
            number: ["#AD1457", "#880E4F", "#EC407A", "#F48FB1"],
            boolean: ["#7B1FA2", "#4A0072", "#9C27B0", "#CE93D8"],
            flow: ["#5D4037", "#3E2723", "#795548", "#BCAAA4"],
            sensors: ["#827717", "#4B830D", "#C0CA33", "#E6EE9C"],
            extras: ["#424242", "#212121", "#616161", "#9E9E9E"],
            program: ["#424242", "#212121", "#616161", "#9E9E9E"],
            myblocks: ["#FF8F00", "#FF6F00", "#FFB300", "#FFE082"],
            heap: ["#5D4037", "#3E2723", "#795548", "#BCAAA4"],
            dictionary: ["#5D4037", "#3E2723", "#795548", "#BCAAA4"],
            ensemble: ["#3949AB", "#283593", "#5E35B1", "#7986CB"]
        },

        disconnected: "#5C5C5C",
        header: "#1E88E5",
        aux: "#1976D2",
        sub: "#64B5F6",
        doHeaderShadow: !platform.FF,
        rule: "#303030",
        ruleColor: "#303030",
        trashColor: "#757575",
        trashBorder: "#424242",
        trashActive: "#E53935",
        background: "#303030", // Very dark gray
        paletteSelected: "#1E1E1E",
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
        pitchWheelcolors: ["#388E3C", "#4CAF50", "#388E3C", "#008BA3", "#388E3C", "#4CAF50", "#66BB6A"],
        gridWheelcolors: {
            wheel: ["#1C1C1C"],
            selected: {
                fill: "#303030",
                stroke: "#757575"
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
        wheelcolors: ["#757575", "#9E9E9E", "#757575", "#9E9E9E", "#616161"]
    };
} else {
    window.platformColor = {
        textColor : "black",
        blockText: "#282828",
        dialogueBox:"#fff",
        strokeColor: "#E2E2E2",
        fillColor: "#F9F9F9",
        blueButton: "#0066FF",
        hoverColor:  "#E0E0E0",
        paletteColors: {
            widgets: ["#7CD622", "#57AD02", "#77C428", "#B4EB7D"],
            pitch: ["#7CD622", "#57AD02", "#77C428", "#B4EB7D"],
            // rhythm: ["#FE994F", "#E86B0E", "#FF8B2D", "#FEC092"],
            rhythm: ["#FF8700", "#E86B0E", "#FF6600", "#FEC092"],
            meter: ["#FE994F", "#E86B0E", "#FF8B2D", "#FEC092"],
            tone: ["#3EDCDD", "#1DBCBD", "#25C3C0", "#A1EEEF"],
            ornament: ["#3EDCDD", "#1DBCBD", "#25C3C0", "#A1EEEF"],
            intervals: ["#7CD622", "#57AD02", "#77C428", "#B4EB7D"],
            volume: ["#3EDCDD", "#1DBCBD", "#25C3C0", "#A1EEEF"],
            drum: ["#3EDCDD", "#1DBCBD", "#25C3C0", "#A1EEEF"],
            graphics: ["#92A9FF", "#5370DC", "#728FF9", "#CDD8FF"],
            turtle: ["#92A9FF", "#5370DC", "#728FF9", "#CDD8FF"],
            pen: ["#92A9FF", "#5370DC", "#728FF9", "#CDD8FF"],
            // boxes: ["#FFBF00", "#DAAF30", "#DAA926", "#FFE391"],
            boxes: ["#FFB900", "#d18600", "#FFA548", "#FFD092"],
            // action: ["#FFBF00", "#DAAF30", "#DAA926", "#FFE391"],
            action: ["#F3C800", "#DAAF30", "#DAA926", "#FFE391"],
            media: ["#FF664B", "#EA4326", "#FF5942", "#FFB9E2"],
            number: ["#FF6EA1", "#FF2C76", "#FF5293", "#FFCDDF"],
            boolean: ["#D97DF5", "#B653D3", "#C96DF3", "#EDC6A3"],
            flow: ["#D98A43", "#B7651A", "#D68136", "#ECC6A4"],
            // sensors: ["#FF664B", "#EA4326", "#FF5942", "#FFB9E2"],
            sensors: ["#AABB00", "#748400", "#E1F400", "#FFE391"],
            extras: ["#C4C4C4", "#A0A0A0", "#B0B0B0", "#D0D0D0"],
            program: ["#C4C4C4", "#A0A0A0", "#B0B0B0", "#D0D0D0"],
            myblocks: ["#FFBF00", "#DAAF30", "#DAA926", "#FFE391"],
            heap: ["#D98A43", "#B7651A", "#D68136", "#ECC6A4"],
            dictionary: ["#D98A43", "#B7651A", "#D68136", "#ECC6A4"],
            ensemble: ["#92A9FF", "#5370DC", "#728FF9", "#CDD8FF"]
        },

        disconnected: "#C4C4C4", // disconnected block color
        header: platform.FF ? "#4DA6FF" : "#4DA6FF",
        aux: "#1A8CFF",
        sub: "#8CC6FF",
        doHeaderShadow: !platform.FF,
        rule: "#E2E2E2",
        ruleColor: "#E2E2E2",
        trashColor: "#C0C0C0",
        trashBorder: "#808080",
        trashActive: "#FF0000",
        background: "#F9F9F9",
        paletteSelected: "#F3F3F3",
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
        stopIconcolor : "#ea174c",
        hitAreaGraphicsBeginFill: "#FFF",
        orange: "#e37a00", // 5YR
        piemenuBasic: ["#3ea4a3", "#60bfbc", "#1d8989", "#60bfbc", "#1d8989"],
        exitWheelcolors: ["#808080", "#c0c0c0"],
        exitWheelcolors2: ["#808080", "#92a9ff", "#80a080"],
        pitchWheelcolors: ["#77c428", "#93e042", "#77c428", "#5ba900", "#77c428", "#93e042", "#adfd55"],
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
        wheelcolors: ["#808080", "#909090", "#808080", "#909090", "#707070"]
    };
}

document.querySelector("meta[name=theme-color]").content = platformColor.header;

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
