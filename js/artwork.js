// Copyright (c) 2014-21 Walter Bender
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
   globals createjs
*/

/*
   exported

   showMaterialHighlight, hideButtonHighlight, hidePaletteNameDisplay
*/

const artworkData =
    typeof module !== "undefined" && module.exports
        ? require("./artwork-data")
        : typeof globalThis !== "undefined"
          ? globalThis.ArtworkData || {}
          : {};

const MATERIAL_HIGHLIGHT_COLOR = artworkData.HIGHLIGHTCOLOR || "#FFFFFF";
const MATERIAL_ACTIVE_COLOR = artworkData.ACTIVECOLOR || "#212121";

/**
 * Creates and displays a material highlight effect at the specified position on the stage.
 * @param {number} x - The x-coordinate of the highlight position.
 * @param {number} y - The y-coordinate of the highlight position.
 * @param {number} r - The radius of the highlight.
 * @param {Event} event - The event triggering the highlight.
 * @param {number} scale - The scale factor for the stage.
 * @param {createjs.Stage} stage - The stage to display the highlight on.
 * @returns {Object} An object containing two shapes: 'highlight' and 'active'.
 */
const showMaterialHighlight = (x, y, r, event, scale, stage) => {
    const circles = {
        highlight: new createjs.Shape(),
        active: new createjs.Shape()
    };

    circles.highlight.graphics.f(MATERIAL_HIGHLIGHT_COLOR).drawCircle(-6, -6, r);
    circles.highlight.alpha = 0.3;
    circles.highlight.x = x;
    circles.highlight.y = y;

    circles.active.graphics.f(MATERIAL_ACTIVE_COLOR).drawCircle(-6, -6, r);
    circles.active.alpha = 0;

    stage.addChild(circles.highlight, circles.active);

    createjs.Tween.get(circles.active)
        .to({
            scaleX: 0.3,
            scaleY: 0.3,
            x: event.rawX / scale,
            y: event.rawY / scale
        })
        .to({ scaleX: 1, scaleY: 1, x: x, y: y }, 200, createjs.Ease.circInOut);

    createjs.Tween.get(circles.active).to({ alpha: 0.05 }).to({ alpha: 0.3 }, 150);
    return circles;
};

/**
 * Hides the button highlight effect.
 * @param {Object} circles - An object containing the highlight and active shapes.
 * @param {createjs.Stage} stage - The stage from which to remove the highlight.
 */
const hideButtonHighlight = (circles, stage) => {
    if (circles.active === undefined) {
        return;
    }

    createjs.Tween.get(circles.active).to({ alpha: 0 }, 200);
    createjs.Tween.get(circles.highlight).to({ alpha: 0 }, 400);
    setTimeout(() => {
        stage.removeChild(circles.active, circles.highlight);
    }, 410);
};

/**
 * Hides the palette name display after a certain delay.
 * @param {createjs.Text} paletteText - The palette text to hide.
 * @param {createjs.Stage} stage - The stage from which to remove the palette text.
 */
const hidePaletteNameDisplay = (paletteText, stage) => {
    setTimeout(() => {
        stage.removeChild(paletteText);
    }, 150);
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        showMaterialHighlight,
        hideButtonHighlight,
        hidePaletteNameDisplay,
        COLLAPSEBUTTONXOFF: artworkData.COLLAPSEBUTTONXOFF,
        STANDARDBLOCKHEIGHT: artworkData.STANDARDBLOCKHEIGHT,
        FILLCOLORS: artworkData.FILLCOLORS,
        TURTLESVG: artworkData.TURTLESVG
    };
}
