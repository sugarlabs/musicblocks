// Copyright (c) 2016-23 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
   global

   _, slicePath
 */

/*
   exported

   getSavedCustomModes, getModeNamesForGroup, getModeLabel,
   getModeNameFromLabel, getModeSliceColors, updateModeWheelItems,
   getModeGroupTitleFont, getModeSliceFont, configureWheel,
   MusicUtilsModeWheel
 */

// var, not const or let: a hoisted var in musicutils.js cannot redeclare a top-level const or let.

if (typeof module !== "undefined" && module.exports) {
    var MusicUtilsConstants =
        (typeof window !== "undefined" && window.MusicUtilsConstants) ||
        (typeof require !== "undefined" ? require("./musicutils-constants") : {});
    var { MODE_PIE_MENUS } = MusicUtilsConstants;
}

/** Custom modes saved by the mode widget; corrupt data yields []. */
var getSavedCustomModes = () => {
    try {
        const customModes = JSON.parse(localStorage.getItem("customModes") || "[]");
        return Array.isArray(customModes)
            ? customModes.filter(m => m && typeof m.name === "string")
            : [];
    } catch (e) {
        return [];
    }
};

/**
 * Builds the fixed 12-slot mode-name list for a group ("custom" padded with blanks).
 * @param {string} grp
 * @param {Array} [customModeNames]
 * @returns {Array}
 */
var getModeNamesForGroup = (grp, customModeNames = []) => {
    if (grp !== "custom") {
        return MODE_PIE_MENUS[grp].slice();
    }
    const names = customModeNames.slice(0, 12);
    while (names.length < 12) {
        names.push(" ");
    }
    return names;
};

/** Display label for a mode (major/ionian and minor/aeolian pairs translated). */
var getModeLabel = modename => {
    switch (modename) {
        case "ionian":
        case "major":
            return `${_("major")} / ${_("ionian")}`;
        case "aeolian":
        case "minor":
            return `${_("minor")} / ${_("aeolian")}`;
        default:
            return modename === " " ? " " : _(modename);
    }
};

/** Inverse of getModeLabel; falls back to the label itself. */
var getModeNameFromLabel = (label, modes) => {
    if (label === `${_("major")} / ${_("ionian")}`) {
        return "major";
    }
    if (label === `${_("minor")} / ${_("aeolian")}`) {
        return "aeolian";
    }
    for (const m of modes) {
        if (_(m) === label) {
            return m;
        }
    }
    return label;
};

/** Per-slice colors: blank slots get emptyColor, real modes filledColor. */
var getModeSliceColors = (modes, colors) =>
    modes.map(modename => (modename === " " ? colors.emptyColor : colors.filledColor));

/** Re-renders a mode-name wheel in place with new labels/colors. */
var updateModeWheelItems = (wheel, labels, colors) => {
    for (let i = 0; i < wheel.navItems.length; i++) {
        const item = wheel.navItems[i];
        item.title = labels[i];
        item.basicNavTitleMax.title = labels[i];
        item.basicNavTitleMin.title = labels[i];
        item.hoverNavTitleMax.title = labels[i];
        item.hoverNavTitleMin.title = labels[i];
        item.selectedNavTitleMax.title = labels[i];
        item.selectedNavTitleMin.title = labels[i];
        item.initNavTitle.title = labels[i];
        item.fillAttr = colors[i];
        item.sliceHoverAttr.fill = colors[i];
        item.slicePathAttr.fill = colors[i];
        item.sliceSelectedAttr.fill = colors[i];
        // refreshWheel() never rewrites text content, so push the label directly.
        if (item.navTitle && typeof item.navTitle.attr === "function") {
            item.navTitle.attr({ text: labels[i] });
        }
    }
    wheel.refreshWheel();
};

/** Group-ring title font, scaled to wheel radius. */
var getModeGroupTitleFont = wheelRadius => `100 ${Math.round(0.08 * wheelRadius)}px sans-serif`;

/** Name-ring label font sized to fit its slice arc. */
var getModeSliceFont = (wheelRadius, sliceCount, labelLen) => {
    const arcPx = (2 * Math.PI * 0.575 * wheelRadius) / sliceCount;
    const size = Math.floor((arcPx * 0.85) / (labelLen * 0.6));
    const minSize = Math.round(0.06 * wheelRadius);
    const maxSize = Math.round(0.12 * wheelRadius);
    const clamped = Math.min(maxSize, Math.max(minSize, size));
    return `100 ${clamped}px sans-serif`;
};

/** Applies shared donut-slice config to a wheelnav instance. */
var configureWheel = (wheel, opts) => {
    wheel.colors = opts.colors;
    wheel.slicePathFunction = slicePath().DonutSlice;
    wheel.slicePathCustom = slicePath().DonutSliceCustomization();
    wheel.slicePathCustom.minRadiusPercent = opts.minRadius;
    wheel.slicePathCustom.maxRadiusPercent = opts.maxRadius;
    if (opts.clickModeRotate !== undefined) {
        wheel.clickModeRotate = opts.clickModeRotate;
    }
    if (opts.selectionPaths) {
        wheel.sliceSelectedPathCustom = wheel.slicePathCustom;
        wheel.sliceInitPathCustom = wheel.slicePathCustom;
    }
    wheel.navAngle = -90;
    wheel.animatetime = 0;
    if (opts.titleRotateAngle !== undefined) {
        wheel.titleRotateAngle = opts.titleRotateAngle;
    }
    if (opts.titleFont !== undefined) {
        wheel.titleFont = opts.titleFont;
    }
};

var MusicUtilsModeWheel = {
    getSavedCustomModes,
    getModeNamesForGroup,
    getModeLabel,
    getModeNameFromLabel,
    getModeSliceColors,
    updateModeWheelItems,
    getModeGroupTitleFont,
    getModeSliceFont,
    configureWheel
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = MusicUtilsModeWheel;
}

if (typeof window !== "undefined") {
    window.MusicUtilsModeWheel = MusicUtilsModeWheel;
}
