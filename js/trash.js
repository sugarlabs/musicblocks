// Copyright (c) 2014-2021 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// The trashcan is an area at the bottom-right of the screen where stacks of
// blocks can be dragged. Once in the trash area, they are marked as
// trash and hidden. There is a menu button that can be used to
// restore trash.

/* global createjs, platformColor, BORDER, TRASHICON, TRASH_LID_ICON, TRASH_BODY_ICON, last, base64Encode, _ */

/* exported Trashcan */

class Trashcan {
    static TRASHWIDTH = 120;
    static TRASHHEIGHT = 120;

    /**
     * @constructor
     */
    constructor(activity) {
        this.activity = activity;
        this.isVisible = false;
        this._scale = 1;
        this._iconsize = 55; // default value
        this._container = new createjs.Container();
        this._hoverBgShape = null;
        if (typeof createjs !== "undefined" && typeof createjs.Shape === "function") {
            this._hoverBgShape = new createjs.Shape();
            this._hoverBgShape.alpha = 0;
            this._hoverBgShape.visible = false;
            if (
                this.activity &&
                this.activity.trashContainer &&
                typeof this.activity.trashContainer.addChild === "function"
            ) {
                this.activity.trashContainer.addChild(this._hoverBgShape);
            }
        }
        this._borderHighlightBitmap = null;
        this._isHighlightInitialized = false;
        this._inAnimation = false;
        this._animationInterval = null;
        this._highlightPower = 255;
        this._animationLevel = 0;
        this.animationTime = 500;
        this._lidContainer = null;
        this._lidBitmap = null;
        this._bodyBitmap = null;
        this._trashBitmap = null;
        this._lidOriginalX = 0;
        this._lidOriginalY = 0;
        this._resizeTimeout = null;
        this._handleResize = () => {
            clearTimeout(this._resizeTimeout);
            this._resizeTimeout = setTimeout(() => {
                const newWidth = (window.innerWidth / this._scale - Trashcan.TRASHWIDTH) / 2;
                const newHeight = window.innerHeight / this._scale - Trashcan.TRASHHEIGHT;

                if (this.shouldResize(newWidth, newHeight)) {
                    this.updateContainerPosition();
                }
            }, 300);
        };

        this.activity.trashContainer.addChild(this._container);
        if (
            this._hoverBgShape &&
            typeof this.activity.trashContainer.setChildIndex === "function"
        ) {
            this.activity.trashContainer.setChildIndex(this._hoverBgShape, 0);
        } else if (typeof this.activity.trashContainer.setChildIndex === "function") {
            this.activity.trashContainer.setChildIndex(this._container, 0);
        }
        window.addEventListener("resize", this._handleResize);
        this.resizeEvent(1);
        this._makeTrash();
    }

    /**
     * Resolve semantic colors for trash idle and active hover states from tokens.css.
     * @private
     * @returns {{ hoverBorder: string, hoverBg: string, border: string }}
     */
    _getTrashColors() {
        let hoverBorder = "";
        let hoverBg = "";
        let border = "";
        if (
            typeof getComputedStyle !== "undefined" &&
            typeof document !== "undefined" &&
            document.body
        ) {
            const style = getComputedStyle(document.body);
            hoverBorder = style.getPropertyValue("--color-trash-hover-border").trim();
            hoverBg = style.getPropertyValue("--color-trash-hover-bg").trim();
            border = style.getPropertyValue("--color-trash-border").trim();
        }
        const isValidColor = val =>
            Boolean(val && /^(#[0-9a-f]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))$/i.test(val));

        return {
            hoverBorder:
                (isValidColor(hoverBorder) && hoverBorder) ||
                (typeof platformColor !== "undefined" && platformColor.trashActive) ||
                "#ef4444",
            hoverBg: (isValidColor(hoverBg) && hoverBg) || "rgba(239, 68, 68, 0.25)",
            border:
                (isValidColor(border) && border) ||
                (typeof platformColor !== "undefined" && platformColor.trashBorder) ||
                "#666666"
        };
    }

    /**
     * Update delete glow background shape geometry and style.
     * @private
     * @returns {void}
     */
    _updateHoverBg() {
        if (!this._hoverBgShape || !this._hoverBgShape.graphics) {
            return;
        }
        const colors = this._getTrashColors();
        if (typeof this._hoverBgShape.graphics.clear === "function") {
            this._hoverBgShape.graphics.clear();
        }
        if (typeof this._hoverBgShape.graphics.beginFill === "function") {
            this._hoverBgShape.graphics.beginFill(colors.hoverBg);
        }
        if (typeof this._hoverBgShape.graphics.drawRoundRect === "function") {
            this._hoverBgShape.graphics.drawRoundRect(2.5, 2.5, 115, 115, 10);
        } else if (typeof this._hoverBgShape.graphics.drawRect === "function") {
            this._hoverBgShape.graphics.drawRect(2.5, 2.5, 115, 115);
        }
    }

    /**
     * @private
     * @param {boolean} isActive
     * @returns {void}
     */
    _makeBorderHighlight(isActive) {
        const img = new Image();

        img.onload = () => {
            this._borderHighlightBitmap = new createjs.Bitmap(img);
            this._borderHighlightBitmap.scaleX = this.activity.cellSize / this._iconsize;
            this._borderHighlightBitmap.scaleY = this.activity.cellSize / this._iconsize;
            if (!this._isHighlightInitialized) {
                this._container.visible = this.isVisible;
                this._isHighlightInitialized = true;
            } else {
                this._container.removeChildAt(this._container.children.length - 1);
            }

            this._container.addChild(this._borderHighlightBitmap);
            this._borderHighlightBitmap.visible = true;
        };

        const colors = this._getTrashColors();
        let highlightString =
            "rgb(" +
            this._highlightPower +
            "," +
            this._highlightPower +
            "," +
            this._highlightPower +
            ")";
        if (isActive) {
            // When trash is activated, warn the user with red highlight from tokens.css
            highlightString = colors.hoverBorder;
        }

        img.src =
            "data:image/svg+xml;base64," +
            window.btoa(base64Encode(BORDER.replace("stroke_color", highlightString)));
    }

    /**
     * @private
     * @returns {void}
     */
    _makeBorder() {
        const img = new Image();

        img.onload = () => {
            const border = new createjs.Bitmap(img);
            border.scaleX = this.activity.cellSize / this._iconsize;
            border.scaleY = this.activity.cellSize / this._iconsize;
            this._container.addChild(border);
            this._makeBorderHighlight(false);
        };

        const colors = this._getTrashColors();
        img.src =
            "data:image/svg+xml;base64," +
            window.btoa(base64Encode(BORDER.replace("stroke_color", colors.border)));
    }

    /**
     * @private
     * @returns {void}
     */
    _makeTrash() {
        const colors = this._getTrashColors();
        const borderColor = colors.border;

        if (typeof TRASH_LID_ICON !== "undefined" && typeof TRASH_BODY_ICON !== "undefined") {
            const bodyImg = new Image();
            bodyImg.onload = () => {
                const bodyBitmap = new createjs.Bitmap(bodyImg);
                this._iconsize = bodyBitmap.getBounds ? bodyBitmap.getBounds().width : 55;
                const scale = this.activity.cellSize / this._iconsize;
                bodyBitmap.scaleX = scale;
                bodyBitmap.scaleY = scale;
                bodyBitmap.x = ((Trashcan.TRASHWIDTH - this.activity.cellSize) / 2) * scale;
                bodyBitmap.y = ((Trashcan.TRASHHEIGHT - this.activity.cellSize) / 2) * scale;
                this._bodyBitmap = bodyBitmap;

                const lidImg = new Image();
                lidImg.onload = () => {
                    const lidBitmap = new createjs.Bitmap(lidImg);
                    lidBitmap.scaleX = scale;
                    lidBitmap.scaleY = scale;

                    this._lidContainer = new createjs.Container();
                    const hingeX = 15 * scale;
                    const hingeY = 11 * scale;
                    this._lidContainer.regX = hingeX;
                    this._lidContainer.regY = hingeY;
                    this._lidContainer.x = bodyBitmap.x + hingeX;
                    this._lidContainer.y = bodyBitmap.y + hingeY;
                    this._lidOriginalX = this._lidContainer.x;
                    this._lidOriginalY = this._lidContainer.y;

                    this._lidContainer.addChild(lidBitmap);
                    this._lidBitmap = lidBitmap;

                    const trashGroup = new createjs.Container();
                    trashGroup.addChild(bodyBitmap);
                    trashGroup.addChild(this._lidContainer);
                    this._trashBitmap = trashGroup;
                    this._container.addChild(trashGroup);

                    this._makeBorder();
                };
                lidImg.src =
                    "data:image/svg+xml;base64," +
                    window.btoa(base64Encode(TRASH_LID_ICON.replace(/fill_color/g, borderColor)));
            };
            bodyImg.src =
                "data:image/svg+xml;base64," +
                window.btoa(base64Encode(TRASH_BODY_ICON.replace(/fill_color/g, borderColor)));
        } else {
            const img = new Image();
            img.onload = () => {
                const bitmap = new createjs.Bitmap(img);
                this._container.addChild(bitmap);
                this._iconsize = bitmap.getBounds ? bitmap.getBounds().width : 55;
                bitmap.scaleX = this.activity.cellSize / this._iconsize;
                bitmap.scaleY = this.activity.cellSize / this._iconsize;
                bitmap.x = ((Trashcan.TRASHWIDTH - this.activity.cellSize) / 2) * bitmap.scaleX;
                bitmap.y = ((Trashcan.TRASHHEIGHT - this.activity.cellSize) / 2) * bitmap.scaleY;
                this._trashBitmap = bitmap;
                this._makeBorder();
            };

            img.src =
                "data:image/svg+xml;base64," +
                window.btoa(base64Encode(TRASHICON.replace(/fill_color/g, borderColor)));
        }
    }

    /**
     * @public
     * @param {number} scale
     * @returns {void}
     */
    updateContainerPosition() {
        this._container.x =
            window.innerWidth / this._scale - Trashcan.TRASHWIDTH - 2 * this._iconsize;
        this._container.y =
            window.innerHeight / this._scale - Trashcan.TRASHHEIGHT - (5 / 4) * this._iconsize;
        if (this._hoverBgShape) {
            this._hoverBgShape.x = this._container.x;
            this._hoverBgShape.y = this._container.y;
        }
    }

    shouldResize(newWidth, newHeight) {
        return this._container.x !== newWidth || this._container.y !== newHeight;
    }

    resizeEvent(scale) {
        this._scale = scale;
        this.updateContainerPosition();
    }

    /**
     * @public
     * @returns {void}
     */
    hide() {
        if (this._hoverBgShape) {
            this._hoverBgShape.visible = false;
            this._hoverBgShape.alpha = 0;
        }
        createjs.Tween.get(this._container).to({ alpha: 0 }, 200).set({ visible: false });
    }

    /**
     * @public
     * @returns {void}
     */
    show() {
        this.stopHighlightAnimation();
        createjs.Tween.get(this._container)
            .to({ alpha: 0.0, visible: true })
            .to({ alpha: 1.0 }, 200);
    }

    /**
     * Refresh trashcan artwork and colors when the theme changes.
     * @public
     * @returns {void}
     */
    refresh() {
        if (this._inAnimation) {
            this.stopHighlightAnimation();
        }
        if (this._container && typeof this._container.removeAllChildren === "function") {
            this._container.removeAllChildren();
        }
        this._isHighlightInitialized = false;
        this._borderHighlightBitmap = null;
        this._trashBitmap = null;
        this._bodyBitmap = null;
        this._lidBitmap = null;
        this._lidContainer = null;
        if (this._hoverBgShape) {
            this._updateHoverBg();
        }
        this._makeTrash();
    }

    /**
     * @public
     * @returns {void}
     */
    startHighlightAnimation() {
        if (this._inAnimation || !this._isHighlightInitialized) {
            return;
        }

        this._inAnimation = true;
        if (
            this.activity &&
            typeof this.activity.textMsg === "function" &&
            typeof _ === "function"
        ) {
            this.activity.textMsg(_("Release to delete the block."));
        }
        this.isVisible = true;

        if (this._hoverBgShape) {
            this._updateHoverBg();
            this._hoverBgShape.visible = true;
            if (typeof createjs !== "undefined" && createjs.Tween) {
                createjs.Tween.get(this._hoverBgShape, { override: true }).to({ alpha: 1.0 }, 150);
            } else {
                this._hoverBgShape.alpha = 1.0;
            }
        }

        if (this._lidContainer && typeof createjs !== "undefined" && createjs.Tween) {
            createjs.Tween.get(this._lidContainer, { override: true }).to(
                { rotation: -20, y: (this._lidOriginalY ?? 0) - 5 },
                180
            );
        }

        this._makeBorderHighlight(true);
        this._switchHighlightVisibility(true);
    }

    /**
     * @public
     * @returns {void}
     */
    stopHighlightAnimation() {
        if (!this._inAnimation) {
            return;
        }

        clearInterval(this._animationInterval);
        this._inAnimation = false;
        this.isVisible = false;
        this._animationLevel = 0;
        this._highlightPower = 255;

        if (this._hoverBgShape) {
            if (typeof createjs !== "undefined" && createjs.Tween) {
                createjs.Tween.get(this._hoverBgShape, { override: true })
                    .to({ alpha: 0.0 }, 150)
                    .set({ visible: false });
            } else {
                this._hoverBgShape.alpha = 0.0;
                this._hoverBgShape.visible = false;
            }
        }

        if (this._lidContainer && typeof createjs !== "undefined" && createjs.Tween) {
            createjs.Tween.get(this._lidContainer, { override: true }).to(
                { rotation: 0, y: this._lidOriginalY ?? 0 },
                150
            );
        }

        this._makeBorderHighlight(false);
        this._switchHighlightVisibility(false);
    }

    /**
     * @private
     * @returns {void}
     */
    _switchHighlightVisibility(bool) {
        if (!this._container || !this._container.children || this._container.children.length < 2) {
            return;
        }
        const lastChild = last(this._container.children);
        if (lastChild) {
            lastChild.visible = bool;
        }
        if (this._container.children[1]) {
            this._container.children[1].visible = !bool;
        }
        this._container.visible = true;
        if (this.activity && typeof this.activity.refreshCanvas === "function") {
            this.activity.refreshCanvas();
        }
    }

    /**
     * @public
     * @param {number} x - x coordinate
     * @param {number} y - y coordinate
     * @returns {boolean}
     */
    overTrashcan(x, y) {
        const tx = this._container.x;
        const ty = this._container.y;

        if (x < tx) {
            return false;
        } else if (x > tx + Trashcan.TRASHWIDTH) {
            return false;
        }

        if (y < ty) {
            return false;
        }

        if (y > ty + Trashcan.TRASHHEIGHT) {
            return false;
        }

        return true;
    }
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = Trashcan;
}
