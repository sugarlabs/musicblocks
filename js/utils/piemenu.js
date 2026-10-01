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

   slicePath
 */

/*
   exported

   configureWheel, updateWheelItems, PieMenuUtils
 */

// var, not const or let: a hoisted var in a consuming file cannot redeclare a top-level const or let.

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

/** Re-renders a wheel in place with new item labels/colors. */
var updateWheelItems = (wheel, labels, colors) => {
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

var PieMenuUtils = {
    configureWheel,
    updateWheelItems
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = PieMenuUtils;
}

if (typeof window !== "undefined") {
    window.PieMenuUtils = PieMenuUtils;
}
