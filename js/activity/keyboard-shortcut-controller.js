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

/* global _, platformColor, STANDARDBLOCKHEIGHT, disableHorizScrollIcon */

/* exported setupKeyboardShortcutController, KeyboardShortcutController */

class KeyboardShortcutController {
    /**
     * @param {object} activity - The Activity instance.
     */
    constructor(activity) {
        this.activity = activity;
        this.inTempoWidget = false;
    }

    /**
     * Handles keyboard shortcuts in Music Blocks.
     * Called from the document keydown event listener.
     * @param {Event} event - The keyboard event.
     */
    handleKeyEvent(event) {
        const a = this.activity;

        // First, check if the pitch slider is open
        if (window.widgetWindows.isOpen("slider") === true) {
            if (
                event.keyCode === 37 ||
                event.keyCode === 38 ||
                event.keyCode === 39 ||
                event.keyCode === 40
            ) {
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
        }

        if (window.widgetWindows.isOpen("JavaScript Editor") === true) return;
        if (!a.keyboardEnableFlag) {
            return;
        }
        if (document.getElementById("labelDiv").classList.contains("hasKeyboard")) {
            return;
        }
        if (a.printText && a.printText.classList.contains("show")) {
            return;
        }

        if (a.keyboardEnableFlag) {
            if (
                document.getElementById("BPMInput") !== null &&
                document.getElementById("BPMInput").classList.contains("hasKeyboard")
            ) {
                return;
            }
            if (
                document.getElementById("musicratio1") !== null &&
                document.getElementById("musicratio1").classList.contains("hasKeyboard")
            ) {
                return;
            }
            if (
                document.getElementById("musicratio2") !== null &&
                document.getElementById("musicratio2").classList.contains("hasKeyboard")
            ) {
                return;
            }
            if (
                document.getElementById("dissectNumber") !== null &&
                document.getElementById("dissectNumber").classList.contains("hasKeyboard")
            ) {
                return;
            }
            if (
                document.getElementById("timbreName") !== null &&
                document.getElementById("timbreName").classList.contains("hasKeyboard")
            ) {
                return;
            }
        }

        const TAB = 9;
        if (event.keyCode === TAB) {
            const active = document.activeElement;
            const isCanvasOrBody =
                active === document.body ||
                active === document.getElementById("canvas") ||
                active === document.getElementById("myCanvas");
            if (isCanvasOrBody) {
                event.preventDefault();
                return false;
            }
            return;
        }

        const ESC = 27;
        const RETURN = 13;
        const SPACE = 32;
        const HOME = 36;
        const END = 35;
        const PAGE_UP = 33;
        const PAGE_DOWN = 34;
        const KEYCODE_LEFT = 37;
        const KEYCODE_RIGHT = 39;
        const KEYCODE_UP = 38;
        const KEYCODE_DOWN = 40;
        const DEL = 46;
        const V = 86;
        const lilypondModal = document.getElementById("lilypondModal");
        const samplerPrompt = document.getElementById("samplerPrompt");
        const planetIframe = document.getElementById("planet-iframe");
        const pasteEl = a.paste;
        const wheelDiv = document.getElementById("wheelDiv");
        const disableKeys =
            lilypondModal.style.display === "block" ||
            a.searchWidget.style.visibility === "visible" ||
            a.helpfulSearchWidget.style.visibility === "visible" ||
            a.isInputON ||
            samplerPrompt ||
            planetIframe.style.display === "" ||
            pasteEl.style.visibility === "visible" ||
            wheelDiv.style.display === "" ||
            a.turtles.running();
        const widgetTitle = document.getElementsByClassName("wftTitle");
        for (let i = 0; i < widgetTitle.length; i++) {
            if (widgetTitle[i].innerHTML === "tempo") {
                this.inTempoWidget = true;
                break;
            }
        }

        if (
            (event.altKey && !disableKeys) ||
            event.keyCode === 13 ||
            event.key === "/" ||
            event.key === "\\"
        ) {
            switch (event.keyCode) {
                case 66:
                    a.textMsg("Alt-B " + _("Saving block artwork"));
                    a.save.saveBlockArtwork();
                    break;
                case 67:
                    a.textMsg("Alt-C " + _("Copy"));
                    a.blocks.prepareStackForCopy();
                    break;
                case 69:
                    a.textMsg("Alt-E " + _("Erase"));
                    a._allClear(false);
                    break;
                case 82: {
                    a.textMsg("Alt-R " + _("Play"));
                    a.toolbar.highlightStop(platformColor.stopIconcolor);
                    a._doFastButton();
                    break;
                }
                case 13: {
                    if (a.isInputON) return;
                    if (a.searchWidget.style.visibility === "visible") {
                        return;
                    }
                    if (pasteEl.style.visibility === "visible") {
                        a.pasted();
                        pasteEl.style.visibility = "hidden";
                        return;
                    }
                    const hasOpenWidget = Object.values(window.widgetWindows.openWindows).some(
                        w => w
                    );
                    if (a.turtles.running()) {
                        a._doHardStopButton();
                    } else if (!hasOpenWidget) {
                        a.toolbar.highlightStop(platformColor.stopIconcolor);
                        a._doFastButton();
                    }
                    break;
                }
                case 83:
                    a.textMsg("Alt-S " + _("Stop"));
                    a.logo.doStopTurtles();
                    break;
                case 86:
                    a.blocks.pasteStack();
                    break;
                case 72:
                    a.textMsg("Alt-H " + _("Save block help"));
                    a._saveHelpBlocks();
                    break;
                case 191:
                    if (
                        event.key === "/" &&
                        !a.beginnerMode &&
                        disableHorizScrollIcon.style.display === "block"
                    ) {
                        a.blocksContainer.x += a.canvas.width / 10;
                        a.stageDirty = true;
                    }
                // fall through
                case 220:
                    if (
                        event.key === "\\" &&
                        !a.beginnerMode &&
                        disableHorizScrollIcon.style.display === "block"
                    ) {
                        a.blocksContainer.x -= a.canvas.width / 10;
                        a.stageDirty = true;
                    }
            }
        } else if (event.ctrlKey) {
            switch (event.keyCode) {
                case V:
                    a.pasteBox.createBox(a.turtleBlocksScale, 200, 200);
                    a.pasteBox.show();
                    pasteEl.style.left = (a.pasteBox.getPos()[0] + 10) * a.turtleBlocksScale + "px";
                    pasteEl.style.top = (a.pasteBox.getPos()[1] + 10) * a.turtleBlocksScale + "px";
                    pasteEl.focus();
                    pasteEl.style.visibility = "visible";
                    a.update = true;
                    break;
            }
        } else if (event.shiftKey && !disableKeys) {
            switch (event.keyCode) {
                case SPACE:
                    event.preventDefault();
                    if (a.turtleContainer.scaleX === 1) {
                        a.turtles.setStageScale(0.5);
                    } else {
                        a.turtles.setStageScale(1);
                    }
                    break;
            }
        } else {
            if (pasteEl.style.visibility === "visible" && event.keyCode === RETURN) {
                if (pasteEl.value.length > 0) {
                    a.pasted();
                }
            } else if (event.keyCode === SPACE) {
                const hasOpenWidget = Object.values(window.widgetWindows.openWindows).some(w => w);
                if (a.turtles.running()) {
                    event.preventDefault();
                    a._doHardStopButton();
                } else if (!disableKeys && !hasOpenWidget) {
                    event.preventDefault();
                    a.toolbar.highlightStop(platformColor.stopIconcolor);
                    a._doFastButton();
                }
            } else if (!disableKeys) {
                switch (event.keyCode) {
                    case END:
                        a.textMsg("END " + _("Jumping to the bottom of the page."));
                        a.blocksContainer.y = -a.blocks.bottomMostBlock() + a.canvas.height / 2;
                        a.stageDirty = true;
                        break;
                    case PAGE_UP:
                        a.textMsg("PAGE_UP " + _("Scrolling up."));
                        a.blocksContainer.y += a.canvas.height / 2;
                        a.stageDirty = true;
                        break;
                    case PAGE_DOWN:
                        a.textMsg("PAGE_DOWN " + _("Scrolling down."));
                        a.blocksContainer.y -= a.canvas.height / 2;
                        a.stageDirty = true;
                        break;
                    case DEL:
                        a.textMsg("DEL " + _("Extracting block"));
                        a.blocks.extract();
                        break;
                    case KEYCODE_UP:
                        if (this.inTempoWidget) {
                            a.logo.tempo.speedUp(0);
                        } else {
                            if (a.blocks.activeBlock !== null) {
                                a.textMsg("UP ARROW " + _("Moving block up."));
                                a.blocks.moveStackRelative(
                                    a.blocks.activeBlock,
                                    0,
                                    -STANDARDBLOCKHEIGHT / 2
                                );
                                a.blocks.blockMoved(a.blocks.activeBlock);
                                a.blocks.adjustDocks(a.blocks.activeBlock, true);
                            } else if (a.palettes.activePalette !== null) {
                                a.palettes.activePalette.scrollEvent(STANDARDBLOCKHEIGHT, 1);
                            } else {
                                a.blocksContainer.y += 20;
                            }
                            a.stageDirty = true;
                        }
                        break;
                    case KEYCODE_DOWN:
                        if (this.inTempoWidget) {
                            a.logo.tempo.slowDown(0);
                        } else {
                            if (a.blocks.activeBlock !== null) {
                                a.textMsg("DOWN ARROW " + _("Moving block down."));
                                a.blocks.moveStackRelative(
                                    a.blocks.activeBlock,
                                    0,
                                    STANDARDBLOCKHEIGHT / 2
                                );
                                a.blocks.blockMoved(a.blocks.activeBlock);
                                a.blocks.adjustDocks(a.blocks.activeBlock, true);
                            } else if (a.palettes.activePalette !== null) {
                                a.palettes.activePalette.scrollEvent(-STANDARDBLOCKHEIGHT, 1);
                            } else {
                                a.blocksContainer.y -= 20;
                            }
                            a.stageDirty = true;
                        }
                        break;
                    case KEYCODE_LEFT:
                        if (!this.inTempoWidget) {
                            if (a.blocks.activeBlock !== null) {
                                a.textMsg("LEFT ARROW " + _("Moving block left."));
                                a.blocks.moveStackRelative(
                                    a.blocks.activeBlock,
                                    -STANDARDBLOCKHEIGHT / 2,
                                    0
                                );
                                a.blocks.blockMoved(a.blocks.activeBlock);
                                a.blocks.adjustDocks(a.blocks.activeBlock, true);
                            } else if (a.scrollBlockContainer) {
                                a.blocksContainer.x += 20;
                            }
                            a.stageDirty = true;
                        }
                        break;
                    case KEYCODE_RIGHT:
                        if (!this.inTempoWidget) {
                            if (a.blocks.activeBlock !== null) {
                                a.textMsg("RIGHT ARROW " + _("Moving block right."));
                                a.blocks.moveStackRelative(
                                    a.blocks.activeBlock,
                                    STANDARDBLOCKHEIGHT / 2,
                                    0
                                );
                                a.blocks.blockMoved(a.blocks.activeBlock);
                                a.blocks.adjustDocks(a.blocks.activeBlock, true);
                            } else if (a.scrollBlockContainer) {
                                a.blocksContainer.x -= 20;
                            }
                            a.stageDirty = true;
                        }
                        break;
                    case HOME:
                        a.textMsg("HOME " + _("Jump to home position."));
                        if (a.palettes.mouseOver) {
                            const dy = Math.max(55 - a.palettes.buttons["rhythm"].y, 0);
                            a.palettes.menuScrollEvent(1, dy);
                            a.palettes.hidePaletteIconCircles();
                        } else if (a.palettes.activePalette !== null) {
                            a.palettes.activePalette.scrollEvent(
                                -a.palettes.activePalette.scrollDiff,
                                1
                            );
                        } else {
                            a._findBlocks();
                        }
                        a.stageDirty = true;
                        break;
                    case TAB:
                        break;
                    case ESC:
                        if (a.searchWidget.style.visibility === "visible") {
                            a.textMsg("ESC " + _("Hide blocks"));
                            a.searchWidget.style.visibility = "hidden";
                        }
                        break;
                    case RETURN: {
                        const hasOpenWidget = Object.values(window.widgetWindows.openWindows).some(
                            w => w
                        );
                        if (a.turtles.running()) {
                            event.preventDefault();
                            a._doHardStopButton();
                        } else if (!disableKeys && !hasOpenWidget) {
                            event.preventDefault();
                            a.toolbar.highlightStop(platformColor.stopIconcolor);
                            a._doFastButton();
                        }
                        break;
                    }
                    default:
                        break;
                }
            }

            a.currentKeyCode = event.keyCode;
        }
    }
}

/**
 * Attaches a KeyboardShortcutController instance and its public surface
 * to the activity.
 *
 * Called once from the Activity constructor.
 *
 * @param {object} activity - The Activity instance.
 */
const setupKeyboardShortcutController = activity => {
    const controller = new KeyboardShortcutController(activity);
    activity._keyboardShortcutController = controller;

    activity.__keyPressed = event => {
        controller.handleKeyEvent(event);
    };

    activity.getCurrentKeyCode = () => {
        return activity.currentKeyCode;
    };

    activity.clearCurrentKeyCode = () => {
        activity.currentKey = "";
        activity.currentKeyCode = 0;
    };
};

if (typeof define === "function" && define.amd) {
    define(function () {
        window.setupKeyboardShortcutController = setupKeyboardShortcutController;
        return { setupKeyboardShortcutController, KeyboardShortcutController };
    });
} else if (typeof module !== "undefined" && module.exports) {
    module.exports = { setupKeyboardShortcutController, KeyboardShortcutController };
}
