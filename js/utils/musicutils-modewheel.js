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

   _
 */

/*
   exported

   getSavedCustomModes, getModeNamesForGroup, getModeLabel,
   getModeNameFromLabel, getModeSliceColors,
   getModeGroupTitleFont, getModeSliceFont,
   getTemperamentSliceAngles, sliceAnglesFromRatios,
   enforceMinSliceAngles, applySliceAngles,
   MusicUtilsModeWheel
 */

// var, not const or let: a hoisted var in musicutils.js cannot redeclare a top-level const or let.

if (typeof module !== "undefined" && module.exports) {
    var MusicUtilsConstants =
        (typeof window !== "undefined" && window.MusicUtilsConstants) ||
        (typeof require !== "undefined" ? require("./musicutils-constants") : {});
    var { MODE_PIE_MENUS } = MusicUtilsConstants;
    var MusicUtilsTemperament =
        (typeof window !== "undefined" && window.MusicUtilsTemperament) ||
        (typeof require !== "undefined" ? require("./musicutils-temperament") : {});
    var { getTemperament, getTemperamentRatio, isEquallyTempered, ratioToWheelAngle } =
        MusicUtilsTemperament;
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

/** Per-slice wheelnav angles: slice i spans pitch i-1 to i, slice 0 wrapping the last pitch to the octave. Null for unusable input. */
var sliceAnglesFromRatios = (ratios, octaveRatio = 2) => {
    if (!Array.isArray(ratios) || ratios.length < 2) {
        return null;
    }

    const pitchCount = ratios.length;
    const positions = ratios.map(r => ratioToWheelAngle(r, octaveRatio) - 270);
    // Separate variable, not an in-place -= 360: angles[n-1] also reads
    // positions[n-1], so mutating it would corrupt the last slice.
    const wrappedRoot = positions[pitchCount - 1] - 360;

    const angles = new Array(pitchCount);
    for (let i = 0; i < pitchCount; i++) {
        angles[i] = positions[i] - (i === 0 ? wrappedRoot : positions[i - 1]);
    }
    return angles.every(a => a > 0) ? angles : null;
};

/** Proportional slice angles for a TEMPERAMENT entry, or null to keep equal slices. */
var getTemperamentSliceAngles = (temperamentKey, pitchCount) => {
    if (!Number.isInteger(pitchCount) || pitchCount < 2) {
        return null;
    }
    const entry = getTemperament(temperamentKey);
    if (!entry || !Array.isArray(entry.ratios)) {
        return null;
    }
    if (entry.ratios.length !== pitchCount) {
        return null;
    }
    if (isEquallyTempered(temperamentKey)) {
        return null;
    }
    const octaveRatio = Number(entry.octaveRatio);
    if (!Number.isFinite(octaveRatio) || octaveRatio <= 1) {
        return null;
    }

    const ratios = entry.ratios.map(getTemperamentRatio);
    return sliceAnglesFromRatios(ratios, octaveRatio);
};

/** Raises slices below minDegrees to that floor, absorbing the excess from wider slices. Null for bad input. */
var enforceMinSliceAngles = (sliceAngles, minDegrees) => {
    if (!Array.isArray(sliceAngles) || sliceAngles.length === 0) {
        return null;
    }
    // A floor above 360/n could not be honoured for every slice, so clamp it.
    const floor = Math.min(minDegrees, 360 / sliceAngles.length);
    const raised = sliceAngles.map(width => Math.max(width, floor));
    const excess = raised.reduce((sum, width) => sum + width, 0) - 360;
    // Headroom above the floor always covers the excess (floor <= 360/n), so no
    // slice drops below the floor. When every slice sits on the floor the only
    // excess is float noise and headroom is 0, so skip the division.
    const headroom = raised.reduce((sum, width) => sum + (width - floor), 0);
    if (excess > 0 && headroom > 0) {
        for (let i = 0; i < raised.length; i++) {
            raised[i] -= (excess * (raised[i] - floor)) / headroom;
        }
    }
    return raised;
};

/**
 * Gives a wheel proportional slice widths. Must run after initWheel() and
 * before createWheel(), which bakes sliceAngle into the SVG paths.
 */
var applySliceAngles = (wheel, sliceAngles) => {
    if (
        !Array.isArray(sliceAngles) ||
        !Array.isArray(wheel.navItems) ||
        sliceAngles.length < wheel.navItems.length
    ) {
        return;
    }
    wheel.navItemsContinuous = true;
    for (let i = 0; i < wheel.navItems.length; i++) {
        wheel.navItems[i].sliceAngle = sliceAngles[i];
    }
};

var MusicUtilsModeWheel = {
    getSavedCustomModes,
    getModeNamesForGroup,
    getModeLabel,
    getModeNameFromLabel,
    getModeSliceColors,
    getModeGroupTitleFont,
    getModeSliceFont,
    getTemperamentSliceAngles,
    sliceAnglesFromRatios,
    enforceMinSliceAngles,
    applySliceAngles
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = MusicUtilsModeWheel;
}

if (typeof window !== "undefined") {
    window.MusicUtilsModeWheel = MusicUtilsModeWheel;
}
