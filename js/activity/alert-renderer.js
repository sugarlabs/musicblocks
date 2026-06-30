// Copyright (c) 2026 Sugarlabs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* global createjs, MSGBLOCK, base64Encode, NOMICERRORMSG, NOSTRINGERRORMSG,
   EMPTYHEAPERRORMSG, NOSQRTERRORMSG, NOACTIONERRORMSG, NOBOXERRORMSG,
   ZERODIVIDEERRORMSG, NANERRORMSG, NOINPUTERRORMSG */

/* exported setupAlertRenderer, AlertRenderer */

class AlertRenderer {
    /**
     * @param {object} activity - The Activity instance.
     */
    constructor(activity) {
        this.activity = activity;
    }

    /**
     * Creates and adds a message container (either standard or error) on the stage.
     * @param {string} fillColor - Background color.
     * @param {string} strokeColor - Border color.
     * @param {function} callback - Callback received once text is initialized.
     * @param {number} y - Y position on the canvas.
     */
    createMsgContainer(fillColor, strokeColor, callback, y) {
        const activity = this.activity;
        const container = new createjs.Container();
        activity.stage.addChild(container);
        container.x = activity.canvas.width / 2;
        container.y = y;
        container.visible = false;

        const img = new Image();
        const svgData = MSGBLOCK.replace("fill_color", fillColor).replace(
            "stroke_color",
            strokeColor
        );

        img.onload = () => {
            const msgBlock = new createjs.Bitmap(img);
            container.addChild(msgBlock);
            const text = new createjs.Text("your message here", "20px Arial", "#000000");
            container.addChild(text);
            text.textAlign = "center";
            text.textBaseline = "alphabetic";
            text.x = 500;
            text.y = 30;

            const bounds = container.getBounds();
            container.cache(bounds.x, bounds.y, bounds.width, bounds.height);

            const hitArea = new createjs.Shape();
            hitArea.graphics.beginFill("#FFF").drawRect(0, 0, 1000, 42);
            hitArea.x = 0;
            hitArea.y = 0;
            container.hitArea = hitArea;

            container.on("click", () => {
                container.visible = false;
                if (activity.errorMsgArrow !== null) {
                    activity.errorMsgArrow.removeAllChildren();
                }
                activity.update = true;
            });

            callback(text);
            activity.msgText = text;
        };

        img.src = "data:image/svg+xml;base64," + window.btoa(base64Encode(svgData));
    }

    /**
     * Creates and renders error message containers with appropriate artwork.
     */
    createErrorContainers() {
        const ERRORARTWORK = [
            "emptybox",
            "emptyheap",
            "negroot",
            "noinput",
            "zerodivide",
            "notanumber",
            "nostack",
            "notastring",
            "nomicrophone"
        ];
        for (let i = 0; i < ERRORARTWORK.length; i++) {
            const name = ERRORARTWORK[i];
            this.makeErrorArtwork(name);
        }
    }

    /**
     * Renders an error message with appropriate artwork.
     * @param {string} name - The name specifying the SVG to be rendered.
     */
    makeErrorArtwork(name) {
        const activity = this.activity;
        const container = new createjs.Container();
        activity.stage.addChild(container);
        container.x = activity.canvas.width / 2;
        container.y = 80;
        activity.errorArtwork[name] = container;
        activity.errorArtwork[name].name = name;
        activity.errorArtwork[name].visible = false;

        const img = new Image();
        img.onload = () => {
            const artwork = new createjs.Bitmap(img);
            container.addChild(artwork);
            const text = new createjs.Text("", "20px Sans", "#000000");
            container.addChild(text);
            text.x = 70;
            text.y = 10;

            const bounds = container.getBounds();
            container.cache(bounds.x, bounds.y, bounds.width, bounds.height);

            const hitArea = new createjs.Shape();
            hitArea.graphics.beginFill("#FFF").drawRect(0, 0, bounds.width, bounds.height);
            hitArea.x = 0;
            hitArea.y = 0;
            container.hitArea = hitArea;

            container.on("click", () => {
                container.visible = false;
                if (activity.errorMsgArrow !== null && activity.errorMsgArrow !== undefined) {
                    activity.errorMsgArrow.removeAllChildren();
                }
                activity.update = true;
            });
        };

        img.src = "images/" + name + ".svg";
    }

    /**
     * Displays a text message visually on the screen.
     * @param {string|HTMLElement|DocumentFragment} msg - The message to display.
     */
    showTextMsg(msg) {
        const activity = this.activity;
        if (activity.msgText === null) {
            return;
        }

        activity.printText.classList.add("show");

        // Clean container to avoid appending duplicate messages
        activity.printTextContent.replaceChildren();

        if (typeof msg === "string") {
            if (msg.includes("<a") && msg.includes("</a>")) {
                // Safe parser for reload link
                try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(msg, "text/html");
                    const link = doc.querySelector("a");
                    if (link) {
                        const safeLink = document.createElement("a");
                        safeLink.href = "#";
                        safeLink.className = link.className || "language-link";
                        safeLink.textContent = link.textContent;
                        safeLink.style.cursor = "pointer";

                        // Copy hover styles programmatically to avoid inline scripts
                        safeLink.addEventListener("mouseover", () => {
                            safeLink.style.opacity = 0.5;
                        });
                        safeLink.addEventListener("mouseout", () => {
                            safeLink.style.opacity = 1;
                        });

                        activity.printTextContent.appendChild(safeLink);
                    } else {
                        activity.printTextContent.textContent = msg;
                    }
                } catch (e) {
                    activity.printTextContent.textContent = msg;
                }
            } else {
                activity.printTextContent.textContent = msg;
            }
        } else if (msg instanceof HTMLElement || msg instanceof DocumentFragment) {
            activity.printTextContent.appendChild(msg);
        }
    }

    /**
     * Hides the text message visually from the screen.
     */
    hideTextMsg() {
        const activity = this.activity;
        if (activity.printText) {
            activity.printText.classList.remove("show");
        }
    }

    /**
     * Displays an error message visually on the screen, drawing links or artwork if needed.
     * @param {string} msg - The error message identifier or text.
     * @param {string} [blk] - Block ID associated with the error.
     * @param {string} [text] - Supplemental text for the error.
     */
    showErrorMsg(msg, blk, text) {
        const activity = this.activity;
        if (activity.errorMsgText === null) {
            return;
        }

        activity.errorMsgText.parent.visible = true;
        if (
            blk !== undefined &&
            blk !== null &&
            blk in activity.blocks.blockList &&
            !activity.blocks.blockList[blk].collapsed
        ) {
            const fromX = activity.canvas.width / 2;
            const fromY = 128;
            const toX = activity.blocks.blockList[blk].container.x + activity.blocksContainer.x;
            const toY = activity.blocks.blockList[blk].container.y + activity.blocksContainer.y;

            if (activity.errorMsgArrow === null) {
                activity.errorMsgArrow = new createjs.Container();
                activity.stage.addChild(activity.errorMsgArrow);
            }

            const line = new createjs.Shape();
            activity.errorMsgArrow.addChild(line);
            line.graphics
                .setStrokeStyle(4)
                .beginStroke("#ff0031")
                .moveTo(fromX, fromY)
                .lineTo(toX, toY);
            activity.stage.setChildIndex(
                activity.errorMsgArrow,
                activity.stage.children.length - 1
            );

            const angle = (Math.atan2(toX - fromX, fromY - toY) / Math.PI) * 180;
            const head = new createjs.Shape();
            activity.errorMsgArrow.addChild(head);
            head.graphics
                .setStrokeStyle(4)
                .beginStroke("#ff0031")
                .moveTo(-10, 18)
                .lineTo(0, 0)
                .lineTo(10, 18);
            head.x = toX;
            head.y = toY;
            head.rotation = angle;
        }

        switch (msg) {
            case NOMICERRORMSG:
                activity.errorArtwork["nomicrophone"].visible = true;
                activity.stage.setChildIndex(
                    activity.errorArtwork["nomicrophone"],
                    activity.stage.children.length - 1
                );
                break;
            case NOSTRINGERRORMSG:
                activity.errorArtwork["notastring"].visible = true;
                activity.stage.setChildIndex(
                    activity.errorArtwork["notastring"],
                    activity.stage.children.length - 1
                );
                break;
            case EMPTYHEAPERRORMSG:
                activity.errorArtwork["emptyheap"].visible = true;
                activity.stage.setChildIndex(
                    activity.errorArtwork["emptyheap"],
                    activity.stage.children.length - 1
                );
                break;
            case NOSQRTERRORMSG:
                activity.errorArtwork["negroot"].visible = true;
                activity.stage.setChildIndex(
                    activity.errorArtwork["negroot"],
                    activity.stage.children.length - 1
                );
                break;
            case NOACTIONERRORMSG:
                if (text === null) {
                    text = "foo";
                }

                activity.errorArtwork["nostack"].children[1].text = text;
                activity.errorArtwork["nostack"].visible = true;
                activity.errorArtwork["nostack"].updateCache();
                activity.stage.setChildIndex(
                    activity.errorArtwork["nostack"],
                    activity.stage.children.length - 1
                );
                break;
            case NOBOXERRORMSG:
                if (text === null) {
                    text = "foo";
                }

                activity.errorArtwork["emptybox"].children[1].text = text;
                activity.errorArtwork["emptybox"].visible = true;
                activity.errorArtwork["emptybox"].updateCache();
                activity.stage.setChildIndex(
                    activity.errorArtwork["emptybox"],
                    activity.stage.children.length - 1
                );
                break;
            case ZERODIVIDEERRORMSG:
                activity.errorArtwork["zerodivide"].visible = true;
                activity.stage.setChildIndex(
                    activity.errorArtwork["zerodivide"],
                    activity.stage.children.length - 1
                );
                break;
            case NANERRORMSG:
                activity.errorArtwork["notanumber"].visible = true;
                activity.stage.setChildIndex(
                    activity.errorArtwork["notanumber"],
                    activity.stage.children.length - 1
                );
                break;
            case NOINPUTERRORMSG:
                activity.errorArtwork["noinput"].visible = true;
                activity.stage.setChildIndex(
                    activity.errorArtwork["noinput"],
                    activity.stage.children.length - 1
                );
                break;
            default:
                activity.errorText.classList.add("show");
                activity.errorTextContent.textContent = msg;
                break;
        }
        activity.refreshCanvas();
    }

    /**
     * Hides the error message visually from the screen.
     */
    hideErrorMsg() {
        this.hideAlertUI();
    }

    /**
     * Hides alert-related UI elements (DOM & canvas nodes).
     */
    hideAlertUI() {
        const activity = this.activity;
        if (
            activity.errorMsgText === null ||
            activity.msgText === null ||
            activity.errorText === undefined ||
            activity.printText === undefined
        ) {
            return;
        }

        activity.errorMsgText.parent.visible = false;
        activity.errorText.classList.remove("show");
        this.hideArrows();

        activity.msgText.parent.visible = false;
        activity.printText.classList.remove("show");
        for (const i in activity.errorArtwork) {
            activity.errorArtwork[i].visible = false;
        }

        activity.refreshCanvas();
    }

    /**
     * Hides error arrows.
     */
    hideArrows() {
        const activity = this.activity;
        if (activity.errorMsgArrow !== null) {
            activity.errorMsgArrow.removeAllChildren();
            activity.refreshCanvas();
        }
    }
}

/**
 * Attaches an AlertRenderer instance to the activity.
 * @param {object} activity - The Activity instance.
 */
const setupAlertRenderer = activity => {
    const renderer = new AlertRenderer(activity);
    activity.alertRenderer = renderer;

    activity._createMsgContainer = (fillColor, strokeColor, callback, y) =>
        renderer.createMsgContainer(fillColor, strokeColor, callback, y);
    activity._createErrorContainers = () => renderer.createErrorContainers();
    activity._makeErrorArtwork = name => renderer.makeErrorArtwork(name);
    activity._hideAlertUI = () => renderer.hideAlertUI();
    activity._hideArrows = () => renderer.hideArrows();
};

if (typeof define === "function" && define.amd) {
    define(function () {
        window.setupAlertRenderer = setupAlertRenderer;
        window.AlertRenderer = AlertRenderer;
        return { setupAlertRenderer, AlertRenderer };
    });
} else if (typeof module !== "undefined" && module.exports) {
    module.exports = { setupAlertRenderer, AlertRenderer };
}
