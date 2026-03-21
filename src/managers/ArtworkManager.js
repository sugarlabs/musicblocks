import * as SVGs from "../assets/svgs.js";
import * as Colors from "../assets/colors.js";
import * as Layout from "../assets/layout.js";

/**
 * ArtworkManager encapsulates the rendering logic for Music Blocks UI elements,
 * such as highlights, palette headers, and button effects.
 * It uses the extracted SVG and color assets.
 */
export class ArtworkManager {
    /**
     * @param {Object} dependencies - Optional dependencies (e.g., for testing)
     */
    constructor(dependencies = {}) {
        this.createjs = dependencies.createjs || window.createjs;
    }

    /**
     * Creates and displays a material highlight effect at the specified position.
     * @param {number} x - The x-coordinate of the highlight position.
     * @param {number} y - The y-coordinate of the highlight position.
     * @param {number} r - The radius of the highlight.
     * @param {Event} event - The event triggering the highlight.
     * @param {number} scale - The scale factor for the stage.
     * @param {createjs.Stage} stage - The stage to display the highlight on.
     * @returns {Object} An object containing two shapes: 'highlight' and 'active'.
     */
    showMaterialHighlight(x, y, r, event, scale, stage) {
        const circles = {
            highlight: new this.createjs.Shape(),
            active: new this.createjs.Shape()
        };

        circles.highlight.graphics.f(Colors.HIGHLIGHTCOLOR || "#FFFFFF").drawCircle(-6, -6, r);
        circles.highlight.alpha = 0.3;
        circles.highlight.x = x;
        circles.highlight.y = y;

        circles.active.graphics.f(Colors.ACTIVECOLOR || "#212121").drawCircle(-6, -6, r);
        circles.active.alpha = 0;

        stage.addChild(circles.highlight, circles.active);

        this.createjs.Tween.get(circles.active)
            .to({
                scaleX: 0.3,
                scaleY: 0.3,
                x: event.rawX / scale,
                y: event.rawY / scale
            })
            .to({ scaleX: 1, scaleY: 1, x: x, y: y }, 200, this.createjs.Ease.circInOut);

        this.createjs.Tween.get(circles.active).to({ alpha: 0.05 }).to({ alpha: 0.3 }, 150);

        return circles;
    }

    /**
     * Hides the button highlight effect.
     * @param {Object} circles - An object containing the highlight and active shapes.
     * @param {createjs.Stage} stage - The stage from which to remove the highlight.
     */
    hideButtonHighlight(circles, stage) {
        if (!circles || circles.active === undefined) {
            return;
        }

        this.createjs.Tween.get(circles.active).to({ alpha: 0 }, 200);
        this.createjs.Tween.get(circles.highlight).to({ alpha: 0 }, 400);

        setTimeout(() => {
            stage.removeChild(circles.active, circles.highlight);
        }, 410);
    }

    /**
     * Hides the palette name display after a certain delay.
     * @param {createjs.Text} palette_text - The palette text to hide.
     * @param {createjs.Stage} stage - The stage from which to remove the palette text.
     */
    hidePaletteNameDisplay(palette_text, stage) {
        if (!palette_text) return;
        setTimeout(() => {
            stage.removeChild(palette_text);
        }, 150);
    }

    // Additional rendering helpers can be added here as needed,
    // e.g., for drawing palette headers, buttons, etc.
}
