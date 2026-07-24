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

/* global _, lazyLoad, HelpWidget, StatsWindow, JSEditor, getMacroExpansion, debugLog, FirstProjectTutorial */

/* exported setupHelpController, HelpController */

class HelpController {
    /**
     * @param {object} activity - The Activity instance.
     */
    constructor(activity) {
        this.activity = activity;
    }

    /*
     * Shows help page
     */
    async showHelp() {
        if (window.widgetWindows?.isOpen("keyboard-shortcuts")) {
            window.widgetWindows.clear("keyboard-shortcuts");
        }
        // Will show welcome page by default.
        await lazyLoad("widgets/help");
        new HelpWidget(this.activity, false);
    }

    /*
     * Shows about page
     */
    async showAboutPage() {
        // Will show welcome page by default.
        await lazyLoad("widgets/help");
        new HelpWidget(this.activity, false);
    }

    /**
     * Toggles display of javaScript editor widget.
     */
    async toggleJSEditor() {
        await lazyLoad([
            "widgets/jseditor",
            "activity/js-export/samples/sample",
            "activity/js-export/export",
            "activity/js-export/interface",
            "activity/js-export/constraints",
            "activity/js-export/ASTutils",
            "activity/js-export/generate",
            "activity/js-export/ast2blocklist",
            "activity/js-export/API/GraphicsBlocksAPI",
            "activity/js-export/API/PenBlocksAPI",
            "activity/js-export/API/RhythmBlocksAPI",
            "activity/js-export/API/MeterBlocksAPI",
            "activity/js-export/API/PitchBlocksAPI",
            "activity/js-export/API/IntervalsBlocksAPI",
            "activity/js-export/API/ToneBlocksAPI",
            "activity/js-export/API/OrnamentBlocksAPI",
            "activity/js-export/API/VolumeBlocksAPI",
            "activity/js-export/API/DrumBlocksAPI",
            "activity/js-export/API/DictBlocksAPI"
        ]);
        new JSEditor(this.activity);
    }

    async showStats() {
        if (!this.activity.statsWindow || !this.activity.statsWindow.isOpen) {
            await lazyLoad("widgets/statistics");
            this.activity.statsWindow = new StatsWindow(this.activity);
        }
    }

    showKeyboardShortcuts() {
        if (window.widgetWindows?.isOpen("help")) {
            window.widgetWindows.clear("help");
        }
        this._showKeyboardShortcuts();
    }

    /**
     * Starts the interface tutorial walkthrough.
     */
    showInteractiveTutorial() {
        if (window.widgetWindows?.isOpen("help")) {
            window.widgetWindows.clear("help");
        }
        if (window.widgetWindows?.isOpen("keyboard-shortcuts")) {
            window.widgetWindows.clear("keyboard-shortcuts");
        }
        if (typeof FirstProjectTutorial !== "undefined") {
            new FirstProjectTutorial(this.activity).start();
        } else {
            console.error("FirstProjectTutorial is not loaded");
        }
    }

    /**
     * Opens the help widget on the Interface Tour card.
     */
    async openFirstProjectTutorial() {
        await lazyLoad("widgets/help");
        HelpWidget.openFirstProjectTutorial(this.activity);
    }

    /**
     * @private
     */
    _showKeyboardShortcuts() {
        const platformKeys = (windowsKeys, macKeys = windowsKeys) =>
            `${_("Windows/Linux")}: ${windowsKeys}\n${_("Mac")}: ${macKeys}`;

        const shortcutSections = [
            {
                title: _("Workspace"),
                items: [
                    {
                        keys: platformKeys("Alt + R", "Option + R"),
                        action: _("Play project")
                    },
                    {
                        keys: platformKeys("Alt + S", "Option + S"),
                        action: _("Stop project")
                    },
                    {
                        keys: platformKeys("Alt + Enter", "Option + Enter"),
                        action: _("Play or stop depending on the current state")
                    },
                    {
                        keys: platformKeys("Space", "Space"),
                        action: _("Play or stop when no text input or widget is active")
                    },
                    {
                        keys: platformKeys("Shift + Space", "Shift + Space"),
                        action: _("Toggle stage scale")
                    },
                    {
                        keys: platformKeys("Home", "Home"),
                        action: _("Jump to home position")
                    },
                    {
                        keys: platformKeys("End", "End"),
                        action: _("Jump to the bottom of the workspace")
                    },
                    {
                        keys: platformKeys("Page Up", "Page Up"),
                        action: _("Scroll workspace up")
                    },
                    {
                        keys: platformKeys("Page Down", "Page Down"),
                        action: _("Scroll workspace down")
                    },
                    {
                        keys: platformKeys("Esc", "Esc"),
                        action: _("Hide block search when it is open")
                    }
                ]
            },
            {
                title: _("Editing"),
                items: [
                    {
                        keys: platformKeys("Alt + C", "Option + C"),
                        action: _("Copy selected stack.")
                    },
                    {
                        keys: platformKeys("Alt + V", "Option + V"),
                        action: _("Paste previous stack.")
                    },
                    {
                        keys: platformKeys("Ctrl + V", "Control + V"),
                        action: _("Open the JSON paste box.")
                    },
                    {
                        keys: platformKeys("Enter", "Enter"),
                        action: _("Paste JSON when the paste box is focused.")
                    },
                    {
                        keys: platformKeys("Delete", "Delete"),
                        action: _("Extract the active block.")
                    },
                    {
                        keys: platformKeys("Alt + E", "Option + E"),
                        action: _("Clear workspace.")
                    },
                    {
                        keys: platformKeys("Alt + B", "Option + B"),
                        action: _("Save block artwork.")
                    },
                    {
                        keys: platformKeys("Alt + H", "Option + H"),
                        action: _("Save block help.")
                    }
                ]
            },
            {
                title: _("Navigation"),
                items: [
                    {
                        keys: platformKeys("Tab / Shift + Tab", "Tab / Shift + Tab"),
                        action: _("Move focus between the toolbar, palettes, and workspace.")
                    },
                    {
                        keys: platformKeys(_("Arrow keys"), _("Arrow keys")),
                        action: _(
                            "Move the active block, scroll palettes, adjust the tempo widget, or pan the workspace depending on context."
                        )
                    },
                    {
                        keys: platformKeys("/", "/"),
                        action: _("Pan workspace right when horizontal scrolling is enabled.")
                    },
                    {
                        keys: platformKeys("\\", "\\"),
                        action: _("Pan workspace left when horizontal scrolling is enabled.")
                    }
                ]
            },
            {
                title: _("Toolbar"),
                items: [
                    {
                        keys: platformKeys(
                            _("Arrow Left / Arrow Right"),
                            _("Arrow Left / Arrow Right")
                        ),
                        action: _("Move focus within the current toolbar.")
                    },
                    {
                        keys: platformKeys(_("Arrow Up / Arrow Down"), _("Arrow Up / Arrow Down")),
                        action: _("Move focus between main and auxiliary toolbars.")
                    },
                    {
                        keys: platformKeys("Enter", "Enter"),
                        action: _("Activate the focused toolbar button.")
                    },
                    {
                        keys: platformKeys("Esc", "Esc"),
                        action: _("Exit toolbar keyboard navigation.")
                    }
                ]
            },
            {
                title: _("Widget Windows"),
                items: [
                    {
                        keys: platformKeys("Esc", "Esc"),
                        action: _("Close the focused widget window.")
                    },
                    {
                        keys: platformKeys("Ctrl + Shift + M", "Command + Shift + M"),
                        action: _("Maximize or restore the focused widget window.")
                    }
                ]
            },
            {
                title: _("Help and Pitch Slider"),
                items: [
                    {
                        keys: platformKeys(
                            _("Arrow Left / Arrow Right"),
                            _("Arrow Left / Arrow Right")
                        ),
                        action: _("Move between help pages when Help is open.")
                    },
                    {
                        keys: platformKeys(_("Arrow keys"), _("Arrow keys")),
                        action: _("Adjust pitch by semitone when Pitch Slider is open.")
                    }
                ]
            }
        ];

        const widgetWindow = window.widgetWindows.windowFor(
            this.activity,
            _("Keyboard shortcuts"),
            "keyboard-shortcuts",
            true
        );
        widgetWindow.clear();
        widgetWindow.show();

        const widgetBody = widgetWindow.getWidgetBody();
        widgetBody.className = "wfbWidget keyboard-shortcuts-widget";
        widgetBody.style.padding = "0";
        widgetBody.style.display = "block";
        widgetBody.style.height = "min(72vh, 680px)";
        widgetBody.style.width = "min(68vw, 760px)";
        widgetBody.style.maxWidth = "100%";
        widgetBody.style.overflow = "hidden";

        const wrapper = document.createElement("div");
        wrapper.className = "keyboard-shortcuts-panel";

        const intro = document.createElement("div");
        intro.className = "keyboard-shortcuts-hero";
        const titleDiv = document.createElement("div");
        titleDiv.className = "keyboard-shortcuts-hero-title";
        titleDiv.textContent = _("Keyboard shortcuts");

        const copyDiv = document.createElement("div");
        copyDiv.className = "keyboard-shortcuts-hero-copy";
        copyDiv.textContent = _(
            "Shortcuts are context-sensitive. Some only work when a related panel, widget, or mode is active. Windows/Linux and Mac equivalents are shown together."
        );

        intro.appendChild(titleDiv);
        intro.appendChild(copyDiv);
        wrapper.appendChild(intro);

        shortcutSections.forEach(section => {
            const sectionCard = document.createElement("section");
            sectionCard.className = "keyboard-shortcuts-section";

            const heading = document.createElement("div");
            heading.textContent = section.title;
            heading.className = "keyboard-shortcuts-section-title";
            sectionCard.appendChild(heading);

            section.items.forEach(item => {
                const row = document.createElement("div");
                row.className = "keyboard-shortcuts-row";

                const key = document.createElement("div");
                key.textContent = item.keys;
                key.className = "keyboard-shortcuts-key";

                const action = document.createElement("div");
                action.textContent = item.action;
                action.className = "keyboard-shortcuts-action";

                row.appendChild(key);
                row.appendChild(action);
                sectionCard.appendChild(row);
            });

            wrapper.appendChild(sectionCard);
        });

        widgetBody.appendChild(wrapper);
        widgetWindow.sendToCenter();
        requestAnimationFrame(() => widgetWindow.sendToCenter());
    }

    saveHelpBlocks() {
        // Save the artwork for every help block.
        const blockHelpList = [];
        for (const key in this.activity.blocks.protoBlockDict) {
            if (
                this.activity.blocks.protoBlockDict[key].helpString !== undefined &&
                this.activity.blocks.protoBlockDict[key].helpString.length !== 0
            ) {
                blockHelpList.push(key);
            }
        }

        let i = 0;
        for (const name of blockHelpList) {
            this._saveHelpBlock(name, i * 2000);
            i++;
        }
        this.activity.sendAllToTrash(true, true);
    }

    /**
     * Saves the artwork for an individual help block.
     * The process involves clearing the block list, generating the help blocks,
     * and saving them as SVG files.
     *
     * @private
     * @param {string} name - The name of the help block.
     * @param {number} delay - The delay before executing the save process (in milliseconds).
     */
    _saveHelpBlock(name, delay) {
        // Save the artwork for an individual help block.
        // (1) clear the block list
        // (2) generate the help blocks
        // (3) save the blocks as svg

        const that = this.activity;
        setTimeout(() => {
            that.sendAllToTrash(false, true);
            setTimeout(() => {
                const message = that.blocks.protoBlockDict[name].helpString;
                if (message.length < 4) {
                    // If there is nothing specified, just load the block.
                    const obj = that.palettes.getProtoNameAndPalette(name);
                    const protoblk = obj[0];
                    const paletteName = obj[1];
                    const protoName = obj[2];

                    if (that.blocks.protoBlockDict.hasOwnProperty(protoName)) {
                        that.palettes.dict[paletteName].makeBlockFromSearch(
                            protoblk,
                            protoName,
                            newBlock => {
                                that.blocks.moveBlock(newBlock, 0, 0);
                            }
                        );
                    }
                } else if (typeof message[3] === "string") {
                    // If it is a string, load the macro associated with this block.
                    const blocksToLoad = getMacroExpansion(that, message[3], 0, 0);
                    that.blocks.loadNewBlocks(blocksToLoad);
                } else {
                    // Load the block.
                    const blocksToLoad = message[3];
                    that.blocks.loadNewBlocks(blocksToLoad);
                }

                setTimeout(() => {
                    debugLog("Saving help artwork: " + name + "_block.svg");
                    const svg = "data:image/svg+xml;utf8," + that.printBlockSVG();
                    that.save.download("svg", svg, name + "_block.svg");
                }, 500);
            }, 500);
        }, delay + 1000);
    }
}

/**
 * Creates a HelpController and attaches it, plus delegation stubs,
 * to the activity so external callers continue to work unchanged.
 * @param {object} activity - The Activity instance.
 */
const setupHelpController = activity => {
    const controller = new HelpController(activity);
    activity.helpController = controller;

    activity.showHelp = (...args) => controller.showHelp(...args);
    activity.showAboutPage = (...args) => controller.showAboutPage(...args);
    activity.showKeyboardShortcuts = (...args) => controller.showKeyboardShortcuts(...args);
    activity.showInteractiveTutorial = (...args) => controller.showInteractiveTutorial(...args);
    activity.openFirstProjectTutorial = (...args) => controller.openFirstProjectTutorial(...args);
    activity.toggleJSWindow = (...args) => controller.toggleJSEditor(...args);
    activity.doAnalytics = (...args) => controller.showStats(...args);
    activity._saveHelpBlocks = (...args) => controller.saveHelpBlocks(...args);

    return controller;
};

// All browser execution goes through RequireJS (AMD). The module.exports branch
// is present solely for Jest/Node test environments and is never exercised at
// runtime in the browser.
if (typeof define === "function" && define.amd) {
    define(function () {
        window.setupHelpController = setupHelpController;
        return { setupHelpController, HelpController };
    });
} else if (typeof module !== "undefined" && module.exports) {
    // Jest / Node environment
    module.exports = { setupHelpController, HelpController };
}
