// Copyright (c) 2014-22 Walter Bender
// Copyright (c) Yash Khandelwal, GSoC'15
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

/* exported setupKeyboardController, KeyboardController */

/**
 * Owns keyboard shortcut dispatch for Music Blocks: modifier key handling
 * (Alt/Ctrl/Shift), arrow key navigation, space bar play/stop, copy/paste
 * shortcuts, tempo widget integration, and the current key-code state used
 * by the Keyboard Sensor block.
 *
 * Does NOT own: the DOM elements or subsystems it drives (blocks, turtles,
 * logo, toolbar, palettes) — it only calls into them via the Activity
 * instance, exactly as activity.js did before extraction.
 */
class KeyboardController {
    /**
     * @param {object} activity - The Activity instance.
     */
    constructor(activity) {
        this.activity = activity;
        this._disposed = false;
        this._handleKeyDown = event => this.__keyPressed(event);
        document.addEventListener("keydown", this._handleKeyDown);
    }

    /*
     * Handles keyboard shortcuts in MB
     */
    __keyPressed(event) {
        const activity = this.activity;

        // First, check if the pitch slider is open
        if (window.widgetWindows.isOpen("slider") === true) {
            // If the event is an arrow key, let the PitchSlider handle it
            if (
                event.keyCode === 37 ||
                event.keyCode === 38 ||
                event.keyCode === 39 ||
                event.keyCode === 40
            ) {
                // Simply prevent default behavior here
                // The actual pitch slider handling is done in the PitchSlider class
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
        }

        if (window.widgetWindows.isOpen("JavaScript Editor") === true) return;
        if (!activity.keyboardEnableFlag) {
            return;
        }
        if (document.getElementById("labelDiv").classList.contains("hasKeyboard")) {
            return;
        }
        // Skip hotkeys when value bar is visible (prevents accidental block creation)
        if (activity.printText && activity.printText.classList.contains("show")) {
            return;
        }

        if (activity.keyboardEnableFlag) {
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
        // const BACKSPACE = 8;
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
        // const ALT = 18;
        // const CTRL = 17;
        // const SHIFT = 16;
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
        const pasteEl = activity.paste;
        const wheelDiv = document.getElementById("wheelDiv");
        const disableKeys =
            lilypondModal.style.display === "block" ||
            activity.searchWidget.style.visibility === "visible" ||
            activity.helpfulSearchWidget.style.visibility === "visible" ||
            activity.isInputON ||
            samplerPrompt ||
            planetIframe.style.display === "" ||
            pasteEl.style.visibility === "visible" ||
            wheelDiv.style.display === "" ||
            activity.turtles.running();
        const widgetTitle = document.getElementsByClassName("wftTitle");
        for (let i = 0; i < widgetTitle.length; i++) {
            if (widgetTitle[i].innerHTML === "tempo") {
                activity.inTempoWidget = true;
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
                case 66: // 'B'
                    activity.textMsg("Alt-B " + _("Saving block artwork"));
                    activity.save.saveBlockArtwork();
                    break;
                case 67: // 'C'
                    activity.textMsg("Alt-C " + _("Copy"));
                    activity.blocks.prepareStackForCopy();
                    break;
                case 69: // 'E'
                    activity.textMsg("Alt-E " + _("Erase"));
                    activity._allClear(false);
                    break;
                case 82: {
                    // 'R or ENTER'
                    activity.textMsg("Alt-R " + _("Play"));
                    activity.toolbar.highlightStop(platformColor.stopIconcolor);
                    activity._doFastButton();
                    break;
                }
                case 13: {
                    // Alt+ENTER
                    if (activity.isInputON) return;

                    if (activity.searchWidget.style.visibility === "visible") {
                        return;
                    }
                    if (pasteEl.style.visibility === "visible") {
                        activity.pasted();
                        pasteEl.style.visibility = "hidden";
                        return;
                    }

                    // Check if any widget window is open
                    const hasOpenWidget = Object.values(window.widgetWindows.openWindows).some(
                        w => w
                    );
                    if (activity.turtles.running()) {
                        activity._doHardStopButton();
                    } else if (!hasOpenWidget) {
                        activity.toolbar.highlightStop(platformColor.stopIconcolor);
                        activity._doFastButton();
                    }
                    break;
                }
                case 83: // 'S'
                    activity.textMsg("Alt-S " + _("Stop"));
                    activity.logo.doStopTurtles();
                    break;
                case 86: // 'V'
                    // activity.textMsg("Alt-V " + _("Paste"));
                    activity.blocks.pasteStack();
                    break;
                case 72: // 'H' save block help
                    activity.textMsg("Alt-H " + _("Save block help"));
                    activity._saveHelpBlocks();
                    break;
                case 191:
                    if (
                        event.key === "/" &&
                        !activity.beginnerMode &&
                        disableHorizScrollIcon.style.display === "block"
                    ) {
                        activity.blocksContainer.x += activity.canvas.width / 10;
                        activity.stageDirty = true;
                    }
                // fall through
                case 220:
                    if (
                        event.key === "\\" &&
                        !activity.beginnerMode &&
                        disableHorizScrollIcon.style.display === "block"
                    ) {
                        activity.blocksContainer.x -= activity.canvas.width / 10;
                        activity.stageDirty = true;
                    }
            }
        } else if (event.ctrlKey) {
            switch (event.keyCode) {
                case 90: // 'Z'
                    activity.blocks.undoAction();
                    break;
                case 89: // 'Y'
                    activity.blocks.redoAction();
                    break;
                case V:
                    // activity.textMsg("Ctl-V " + _("Paste"));
                    activity.pasteBox.createBox(activity.turtleBlocksScale, 200, 200);
                    activity.pasteBox.show();
                    pasteEl.style.left =
                        (activity.pasteBox.getPos()[0] + 10) * activity.turtleBlocksScale + "px";
                    pasteEl.style.top =
                        (activity.pasteBox.getPos()[1] + 10) * activity.turtleBlocksScale + "px";
                    pasteEl.focus();
                    pasteEl.style.visibility = "visible";
                    activity.update = true;
                    break;
            }
        } else if (event.shiftKey && !disableKeys) {
            switch (event.keyCode) {
                case SPACE:
                    event.preventDefault();
                    if (activity.turtleContainer.scaleX === 1) {
                        activity.turtles.setStageScale(0.5);
                    } else {
                        activity.turtles.setStageScale(1);
                    }
                    break;
            }
        } else {
            if (pasteEl.style.visibility === "visible" && event.keyCode === RETURN) {
                if (pasteEl.value.length > 0) {
                    activity.pasted();
                }
            } else if (event.keyCode === SPACE) {
                // Check if any widget window is open
                const hasOpenWidget = Object.values(window.widgetWindows.openWindows).some(w => w);
                if (activity.turtles.running()) {
                    event.preventDefault();
                    activity._doHardStopButton();
                } else if (!disableKeys && !hasOpenWidget) {
                    event.preventDefault();
                    activity.toolbar.highlightStop(platformColor.stopIconcolor);
                    activity._doFastButton();
                }
            } else if (!disableKeys) {
                switch (event.keyCode) {
                    case END:
                        activity.textMsg("END " + _("Jumping to the bottom of the page."));
                        activity.blocksContainer.y =
                            -activity.blocks.bottomMostBlock() + activity.canvas.height / 2;
                        activity.stageDirty = true;
                        break;
                    case PAGE_UP:
                        activity.textMsg("PAGE_UP " + _("Scrolling up."));
                        activity.blocksContainer.y += activity.canvas.height / 2;
                        activity.stageDirty = true;
                        break;
                    case PAGE_DOWN:
                        activity.textMsg("PAGE_DOWN " + _("Scrolling down."));
                        activity.blocksContainer.y -= activity.canvas.height / 2;
                        activity.stageDirty = true;
                        break;
                    case DEL:
                        activity.textMsg("DEL " + _("Extracting block"));
                        activity.blocks.extract();
                        break;
                    case KEYCODE_UP:
                        if (activity.inTempoWidget) {
                            activity.logo.tempo.speedUp(0);
                        } else {
                            if (activity.blocks.activeBlock !== null) {
                                activity.textMsg("UP ARROW " + _("Moving block up."));
                                activity.blocks.moveStackRelative(
                                    activity.blocks.activeBlock,
                                    0,
                                    -STANDARDBLOCKHEIGHT / 2
                                );
                                activity.blocks.blockMoved(activity.blocks.activeBlock);
                                activity.blocks.adjustDocks(activity.blocks.activeBlock, true);
                            } else if (activity.palettes.activePalette !== null) {
                                activity.palettes.activePalette.scrollEvent(STANDARDBLOCKHEIGHT, 1);
                            } else {
                                activity.blocksContainer.y += 20;
                            }
                            activity.stageDirty = true;
                        }
                        break;
                    case KEYCODE_DOWN:
                        if (activity.inTempoWidget) {
                            activity.logo.tempo.slowDown(0);
                        } else {
                            if (activity.blocks.activeBlock !== null) {
                                activity.textMsg(`DOWN ARROW ${_("Moving block down.")}`);
                                activity.blocks.moveStackRelative(
                                    activity.blocks.activeBlock,
                                    0,
                                    STANDARDBLOCKHEIGHT / 2
                                );
                                activity.blocks.blockMoved(activity.blocks.activeBlock);
                                activity.blocks.adjustDocks(activity.blocks.activeBlock, true);
                            } else if (activity.palettes.activePalette !== null) {
                                activity.palettes.activePalette.scrollEvent(
                                    -STANDARDBLOCKHEIGHT,
                                    1
                                );
                            } else {
                                activity.blocksContainer.y -= 20;
                            }
                            activity.stageDirty = true;
                        }
                        break;
                    case KEYCODE_LEFT:
                        if (!activity.inTempoWidget) {
                            if (activity.blocks.activeBlock !== null) {
                                activity.textMsg(`LEFT ARROW ${_("Moving block left.")}`);
                                activity.blocks.moveStackRelative(
                                    activity.blocks.activeBlock,
                                    -STANDARDBLOCKHEIGHT / 2,
                                    0
                                );
                                activity.blocks.blockMoved(activity.blocks.activeBlock);
                                activity.blocks.adjustDocks(activity.blocks.activeBlock, true);
                            } else if (activity.scrollBlockContainer) {
                                activity.blocksContainer.x += 20;
                            }
                            activity.stageDirty = true;
                        }
                        break;
                    case KEYCODE_RIGHT:
                        if (!activity.inTempoWidget) {
                            if (activity.blocks.activeBlock !== null) {
                                activity.textMsg(`RIGHT ARROW ${_("Moving block right.")}`);
                                activity.blocks.moveStackRelative(
                                    activity.blocks.activeBlock,
                                    STANDARDBLOCKHEIGHT / 2,
                                    0
                                );
                                activity.blocks.blockMoved(activity.blocks.activeBlock);
                                activity.blocks.adjustDocks(activity.blocks.activeBlock, true);
                            } else if (activity.scrollBlockContainer) {
                                activity.blocksContainer.x -= 20;
                            }
                            activity.stageDirty = true;
                        }
                        break;
                    case HOME:
                        activity.textMsg(`HOME ${_("Jump to home position.")}`);
                        if (activity.palettes.mouseOver) {
                            const dy = Math.max(55 - activity.palettes.buttons["rhythm"].y, 0);
                            activity.palettes.menuScrollEvent(1, dy);
                            activity.palettes.hidePaletteIconCircles();
                        } else if (activity.palettes.activePalette !== null) {
                            activity.palettes.activePalette.scrollEvent(
                                -activity.palettes.activePalette.scrollDiff,
                                1
                            );
                        } else {
                            // Bring all the blocks "home".
                            activity.workspaceLayoutController._findBlocks();
                        }
                        activity.stageDirty = true;
                        break;
                    case TAB:
                        break;
                    case ESC:
                        if (activity.searchWidget.style.visibility === "visible") {
                            activity.textMsg(`ESC ${_("Hide blocks")}`);
                            activity.searchWidget.style.visibility = "hidden";
                        }
                        break;
                    case RETURN: {
                        // Check if any widget window is open
                        const hasOpenWidget = Object.values(window.widgetWindows.openWindows).some(
                            w => w
                        );
                        if (activity.turtles.running()) {
                            event.preventDefault();
                            activity._doHardStopButton();
                        } else if (!disableKeys && !hasOpenWidget) {
                            event.preventDefault();
                            activity.toolbar.highlightStop(platformColor.stopIconcolor);
                            activity._doFastButton();
                        }
                        break;
                    }
                    default:
                        break;
                }
            }

            // Always store current key so as not to mask it from
            // the keyboard block.
            activity.currentKeyCode = event.keyCode;
        }
    }

    /**
     * @returns currentKeyCode
     */
    getCurrentKeyCode() {
        return this.activity.currentKeyCode;
    }

    /*
     * Sets current key code to 0
     */
    clearCurrentKeyCode() {
        this.activity.currentKey = "";
        this.activity.currentKeyCode = 0;
    }

    /**
     * Removes the keyboard listener. Safe to call more than once.
     */
    dispose() {
        if (this._disposed) return;
        this._disposed = true;
        document.removeEventListener("keydown", this._handleKeyDown);
    }
}

const setupKeyboardController = activity => {
    const controller = new KeyboardController(activity);
    activity.keyboardController = controller;
    return controller;
};

if (typeof define === "function" && define.amd) {
    define(function () {
        window.setupKeyboardController = setupKeyboardController;
        return { setupKeyboardController, KeyboardController };
    });
} else if (typeof module !== "undefined" && module.exports) {
    module.exports = { setupKeyboardController, KeyboardController };
}
