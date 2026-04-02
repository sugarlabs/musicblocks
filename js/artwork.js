import * as svgs from "../src/assets/svgs.js";
import * as colors from "../src/assets/colors.js";
import * as layout from "../src/assets/layout.js";
import { ArtworkManager } from "../src/managers/ArtworkManager.js";

const artworkManager = new ArtworkManager();

// Re-export layout constants
export const COLLAPSEBUTTONXOFF = layout.COLLAPSEBUTTONXOFF;
export const COLLAPSEBUTTONYOFF = layout.COLLAPSEBUTTONYOFF;
export const STANDARDBLOCKHEIGHT = layout.STANDARDBLOCKHEIGHT;
export const DEFAULTBLOCKSCALE = layout.DEFAULTBLOCKSCALE;
export const TEXTX = layout.TEXTX;
export const TEXTY = layout.TEXTY;
export const VALUETEXTX = layout.VALUETEXTX;
export const COLLAPSETEXTX = layout.COLLAPSETEXTX;
export const COLLAPSETEXTY = layout.COLLAPSETEXTY;
export const MEDIASAFEAREA = layout.MEDIASAFEAREA;
export const MENUWIDTH = layout.MENUWIDTH;

// Re-export colors
export const FILLCOLORS = colors.FILLCOLORS;
export const STROKECOLORS = colors.STROKECOLORS;
export const HIGHLIGHTCOLOR = colors.HIGHLIGHTCOLOR;
export const ACTIVECOLOR = colors.ACTIVECOLOR;
export const PALETTECOLORS0 = colors.PALETTECOLORS0;
export const PALETTECOLORS = colors.PALETTECOLORS;
export const PALETTEFILLCOLORS = colors.PALETTEFILLCOLORS;
export const PALETTESTROKECOLORS = colors.PALETTESTROKECOLORS;
export const PALETTEHIGHLIGHTCOLORS = colors.PALETTEHIGHLIGHTCOLORS;
export const HIGHLIGHTSTROKECOLORS = colors.HIGHLIGHTSTROKECOLORS;

// Re-export icons and SVGs
export const TURTLESVG =
    typeof _THIS_IS_TURTLE_BLOCKS_ !== "undefined" && _THIS_IS_TURTLE_BLOCKS_
        ? svgs.getTurtleSvg(true)
        : svgs.getTurtleSvg(false);
export const DRUMSVG = svgs.DRUMSVG;
export const EFFECTSVG = svgs.EFFECTSVG;
export const NEXTBUTTON = svgs.NEXTBUTTON;
export const PREVBUTTON = svgs.PREVBUTTON;

// Methods delegated to ArtworkManager
export function showMaterialHighlight() {
    return artworkManager.showMaterialHighlight(...arguments);
}

export function hideButtonHighlight() {
    return artworkManager.hideButtonHighlight(...arguments);
}

export function hidePaletteNameDisplay() {
    return artworkManager.hidePaletteNameDisplay(...arguments);
}

// For backward compatibility with tests and scripts
if (typeof window !== "undefined") {
    window.showMaterialHighlight = showMaterialHighlight;
    window.hideButtonHighlight = hideButtonHighlight;
    window.hidePaletteNameDisplay = hidePaletteNameDisplay;
    window.COLLAPSEBUTTONXOFF = COLLAPSEBUTTONXOFF;
    window.FILLCOLORS = FILLCOLORS;
}
