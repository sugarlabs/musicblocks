// Copyright (c) 2016-20 Walter Bender
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// This widget displays help about a block or a button.

const HELP_SVG_DATA_PREFIX = "data:image/svg+xml;base64,";

/* global

   _, docById, getMacroExpansion, HELPCONTENT, FirstProjectTutorial,
*/
/*
     Globals locations
     
     - js/utils/utils.js
        _, docById
     
     - js/macros.js
        getMacroExpansion
    
     - js/turtledefs.js
        HELPCONTENT
 */

/*exported HelpWidget*/
class HelpWidget {
    static ICONSIZE = 32;

    /**
     * @param {Activity} activity
     * @param {boolean} useActiveBlock - Show help for the active block
     * @param {number} startPage - Optional starting page index (0-indexed)
     */
    constructor(activity, useActiveBlock, startPage = 0) {
        this.activity = activity;
        this.beginnerBlocks = [];
        this.advancedBlocks = [];
        this.appendedBlockList = [];
        this.index = 0;
        this.isOpen = true;
        this.startPage = startPage;
        this._keydownHandler = null;

        const widgetWindow = window.widgetWindows.windowFor(this, "help", "help", false);
        //widgetWindow.getWidgetBody().style.overflowY = "auto";
        // const canvasHeight = docById("myCanvas").getBoundingClientRect().height;
        widgetWindow.getWidgetBody().style.maxHeight = "70vh";
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();
        widgetWindow.onclose = () => {
            this.isOpen = false;
            if (this._keydownHandler) {
                document.removeEventListener("keydown", this._keydownHandler);
                this._keydownHandler = null;
            }
            widgetWindow.destroy();
            // Trigger the hint only if they were on the first page of the tour
            if (this.index === 0 && typeof this.activity.textMsg === "function") {
                this.activity.textMsg(
                    _(
                        "Start by dragging a block from the left panel and connect it to the Start block."
                    )
                );
            }
        };

        // Position the widget and make it visible.
        this._helpDiv = document.createElement("div");

        // Give the DOM time to create the div.
        setTimeout(() => this._setup(useActiveBlock, this.startPage), 0);

        // Position center
        setTimeout(this.widgetWindow.sendToCenter, 50);
    }

    /**
     * Static method to get the index of the Interface Tour card
     * @returns {number} The index of the tour card
     */
    static getFirstProjectTutorialIndex() {
        if (typeof HELPCONTENT !== "undefined") {
            for (let i = 0; i < HELPCONTENT.length; i++) {
                const title = HELPCONTENT[i][0];
                if (
                    title.includes("Interface Tour") ||
                    title.includes("Build Your First Project") ||
                    title.includes("First Project")
                ) {
                    return i;
                }
            }
        }
        // Default fallback - the tour card is typically at position 3
        return 3;
    }

    /**
     * Static method to open help widget directly at the Interface Tour card
     * @param {Activity} activity
     */
    static openFirstProjectTutorial(activity) {
        const tutorialIndex = HelpWidget.getFirstProjectTutorialIndex();
        return new HelpWidget(activity, false, tutorialIndex);
    }

    /**
     * Whether a help page is the Interface Tour launcher card.
     * @private
     * @param {string} pageTitle
     * @returns {boolean}
     */
    static _isInterfaceTourCard(pageTitle) {
        if (!pageTitle) {
            return false;
        }
        const lower = pageTitle.toLowerCase();
        return (
            pageTitle.includes("Interface Tour") ||
            pageTitle.includes("Build Your First Project") ||
            pageTitle.includes("First Project") ||
            lower.includes("interface tour") ||
            lower.includes("build your first")
        );
    }

    /**
     * @private
     * @param {useActiveBlock} Show help for the active block.
     * @returns {void}
     */
    _setup(useActiveBlock, page) {
        // Which help page are we on?

        this._helpDiv.style.width = 100 + "%";
        // this._helpDiv.style.backgroundColor = "#e8e8e8";

        // this._helpDiv.style.maxHeight = "100%";
        // this._helpDiv.style.overflowY = "auto";

        this._helpDiv.replaceChildren(
            (() => {
                const fragment = document.createDocumentFragment();
                const rightArrow = document.createElement("div");
                rightArrow.id = "right-arrow";
                rightArrow.className = "hover";
                rightArrow.tabIndex = 0;
                rightArrow.setAttribute("role", "button");
                rightArrow.setAttribute("aria-label", _("Next"));

                const leftArrow = document.createElement("div");
                leftArrow.id = "left-arrow";
                leftArrow.className = "hover";
                leftArrow.tabIndex = 0;
                leftArrow.setAttribute("role", "button");
                leftArrow.setAttribute("aria-label", _("Previous"));

                const helpButtonsDiv = document.createElement("div");
                helpButtonsDiv.id = "helpButtonsDiv";
                helpButtonsDiv.tabIndex = -1;

                const helpScrollWrapper = document.createElement("div");
                helpScrollWrapper.id = "helpScrollWrapper";

                const helpBodyDiv = document.createElement("div");
                helpBodyDiv.id = "helpBodyDiv";
                helpBodyDiv.tabIndex = -1;

                helpScrollWrapper.append(helpBodyDiv);
                fragment.append(rightArrow, leftArrow, helpButtonsDiv, helpScrollWrapper);
                return fragment;
            })()
        );
        this.widgetWindow.getWidgetBody().append(this._helpDiv);

        let leftArrow, rightArrow;
        if (!useActiveBlock) {
            if (page === 0) {
                this.widgetWindow.updateTitle(_("Take a tour"));
            } else {
                this.widgetWindow.updateTitle(HELPCONTENT[page][0]);
            }
            rightArrow = document.getElementById("right-arrow");
            rightArrow.style.display = "block";
            rightArrow.classList.add("hover");
            rightArrow.setAttribute("title", _("Next"));
            rightArrow.setAttribute("aria-label", _("Next"));

            leftArrow = document.getElementById("left-arrow");
            leftArrow.style.display = "block";
            leftArrow.classList.add("hover");
            leftArrow.setAttribute("title", _("Previous"));
            leftArrow.setAttribute("aria-label", _("Previous"));

            if (this._keydownHandler) {
                document.removeEventListener("keydown", this._keydownHandler);
            }
            this._keydownHandler = event => {
                if (event.key === "ArrowLeft") {
                    leftArrow.click();
                } else if (event.key === "ArrowRight") {
                    rightArrow.click();
                }
            };
            document.addEventListener("keydown", this._keydownHandler);

            let cell = docById("left-arrow");
            if (page === 0) {
                leftArrow.classList.add("disabled");
            }
            cell.onclick = () => {
                if (page > 0) {
                    page = page - 1;
                    leftArrow.classList.remove("disabled");
                    if (page === 0) {
                        this.widgetWindow.updateTitle(_("Take a tour"));
                    } else {
                        this.widgetWindow.updateTitle(HELPCONTENT[page][0]);
                    }
                    this._showPage(page);
                }
                if (page === 0) {
                    leftArrow.classList.add("disabled");
                }
            };

            cell = docById("right-arrow");

            cell.onclick = () => {
                if (page >= HELPCONTENT.length - 1) {
                    return;
                }

                page = page + 1;
                leftArrow.classList.remove("disabled");

                this.widgetWindow.updateTitle(HELPCONTENT[page][0]);
                this._showPage(page);
            };
        } else {
            if (this.activity.blocks.activeBlock.name !== null) {
                const label =
                    this.activity.blocks.blockList[this.activity.blocks.activeBlock].protoblock
                        .staticLabels[0];
                if (page === 0) {
                    this.widgetWindow.updateTitle(_("Take a tour"));
                } else {
                    this.widgetWindow.updateTitle(HELPCONTENT[page][0]);
                }
            }

            rightArrow = document.getElementById("right-arrow");
            rightArrow.style.display = "none";
            rightArrow.classList.remove("hover");
            rightArrow.setAttribute("title", _("Next"));
            rightArrow.setAttribute("aria-label", _("Next"));

            leftArrow = document.getElementById("left-arrow");
            leftArrow.style.display = "none";
            leftArrow.classList.remove("hover");
            leftArrow.setAttribute("title", _("Previous"));
            leftArrow.setAttribute("aria-label", _("Previous"));
        }

        if (!useActiveBlock) {
            // display help menu
            docById("helpBodyDiv").style.height = "325px";
            docById("helpBodyDiv").style.width = "345px";
            this._showPage(page);
        } else {
            // display help for this block
            if (this.activity.blocks.activeBlock.name !== null) {
                const name = this.activity.blocks.blockList[this.activity.blocks.activeBlock].name;

                const advIcon = `<a class="tooltipped"
                        data-toggle="tooltip"
                        title="This block is only available in advance mode"
                        data-position="bottom">
                      <i id="advIconText" class="material-icons md-48">star</i>
                     </a>
                    `;

                const findIcon = `<a class="tooltipped"
                        data-toggle="tooltip"
                        title="Show Palette containing the block"
                        data-position="bottom">
                      <i style="margin-right: 10px" id="findIcon" class="material-icons md-48">search</i>
                    </a>
                    `;

                // Create a new container which conatains all the icons. IT will be appnded to the helpBodyDiv
                const iconsContainer = document.createElement("div");
                iconsContainer.classList.add("icon-container");
                iconsContainer.replaceChildren(
                    (() => {
                        const findLink = document.createElement("a");
                        findLink.className = "tooltipped";
                        findLink.dataset.toggle = "tooltip";
                        findLink.title = _("Show Palette containing the block");
                        findLink.dataset.position = "bottom";
                        const findIconEl = document.createElement("i");
                        findIconEl.id = "findIcon";
                        findIconEl.className = "material-icons md-48";
                        findIconEl.style.marginRight = "10px";
                        findIconEl.textContent = "search";
                        findLink.append(findIconEl);
                        return findLink;
                    })()
                );

                // Each block's help entry contains a help string, the
                // path of the help svg, an override name for the help
                // svg file, and an optional macro name for generating
                // the help output.

                const message =
                    this.activity.blocks.blockList[this.activity.blocks.activeBlock].protoblock
                        .helpString;

                if (message) {
                    const helpBody = docById("helpBodyDiv");
                    helpBody.style.height = "70vh";

                    const bodyFragment = document.createDocumentFragment();
                    if (message.length > 1) {
                        let path = message[1];
                        // We need to add a case here whenever we add
                        // help artwort support for a new language.
                        // e.g., documentation-es
                        let language = localStorage.languagePreference;
                        if (language === undefined) {
                            language = navigator.language;
                        }

                        switch (language) {
                            case "ja":
                                if (localStorage.kanaPreference === "kana") {
                                    path = path + "-kana";
                                } else {
                                    path = path + "-ja";
                                }
                                break;
                            case "es":
                                path = path + "-es";
                                break;
                            case "pt":
                                path = path + "-pt";
                                break;
                            default:
                                break;
                        }

                        // body = body + '<p><img src="' + path + "/" + name + '_block.svg"></p>';
                        const imageSrc = `Docs/${path}/${name}_block.svg`;
                        const p = document.createElement("p");
                        p.style.width = "100%";
                        const img = document.createElement("img");
                        img.style.maxWidth = "100%";
                        img.src = imageSrc;
                        p.append(img);
                        bodyFragment.append(p);
                    }

                    const messageParagraph = document.createElement("p");
                    const messageParts = message[0].split(/<br\s*\/?>/i);
                    messageParts.forEach((part, index) => {
                        messageParagraph.append(document.createTextNode(part));
                        if (index < messageParts.length - 1) {
                            messageParagraph.append(document.createElement("br"));
                        }
                    });
                    bodyFragment.append(messageParagraph);

                    const loadButtonHTML =
                        '<i style="margin-right: 10px" id="loadButton" data-toggle="tooltip" title="Load this block" class="material-icons md-48">get_app</i>';
                    const loadButton = document.createElement("i");
                    loadButton.id = "loadButton";
                    loadButton.className = "material-icons md-48";
                    loadButton.style.marginRight = "10px";
                    loadButton.dataset.toggle = "tooltip";
                    loadButton.title = _("Load this block");
                    loadButton.textContent = "get_app";
                    iconsContainer.prepend(loadButton);

                    helpBody.append(bodyFragment);

                    if (
                        !this.activity.blocks.blockList[this.activity.blocks.activeBlock].protoblock
                            .beginnerModeBlock
                    ) {
                        iconsContainer.append(
                            (() => {
                                const advLink = document.createElement("a");
                                advLink.className = "tooltipped";
                                advLink.dataset.toggle = "tooltip";
                                advLink.title = _("This block is only available in advance mode");
                                advLink.dataset.position = "bottom";
                                const advIconEl = document.createElement("i");
                                advIconEl.id = "advIconText";
                                advIconEl.className = "material-icons md-48";
                                advIconEl.textContent = "star";
                                advLink.append(advIconEl);
                                return advLink;
                            })()
                        );
                    }

                    // append the icons container to the helpBodyDiv. It contains load, find and adv icons.
                    helpBody.append(iconsContainer);

                    const object = this.activity.blocks.palettes.getProtoNameAndPalette(name);

                    if (loadButton) {
                        loadButton.onclick = () => {
                            if (message.length < 4) {
                                // If there is nothing specified, just load the block.
                                // console.debug("CLICK: " + name);

                                const protoblk = object[0];
                                const paletteName = object[1];
                                const protoName = object[2];

                                const protoResult = Object.prototype.hasOwnProperty.call(
                                    this.activity.blocks.protoBlockDict,
                                    protoName
                                );
                                if (protoResult) {
                                    this.activity.blocks.palettes.dict[
                                        paletteName
                                    ].makeBlockFromSearch(protoblk, protoName, newBlock => {
                                        this.activity.blocks.moveBlock(newBlock, 100, 100);
                                    });
                                }
                            } else if (typeof message[3] === "string") {
                                // If it is a string, load the macro
                                // assocuated with this block
                                const blocksToLoad = getMacroExpansion(
                                    this.activity,
                                    message[3],
                                    100,
                                    100
                                );
                                // console.debug("CLICK: " + blocksToLoad);
                                this.activity.blocks.loadNewBlocks(blocksToLoad);
                            } else {
                                // Load the blocks.
                                const blocksToLoad = message[3];
                                // console.debug("CLICK: " + blocksToLoad);
                                this.activity.blocks.loadNewBlocks(blocksToLoad);
                            }
                        };
                    }
                    const findIconMethod = docById("findIcon");

                    findIconMethod.onclick = () => {
                        this.activity.blocks.palettes.showPalette(object[1]);
                    };
                }
            }
        }

        this.widgetWindow.takeFocus();
    }

    /**
     * @private
     * @param {number} page
     * @returns {void}
     */
    _showPage(page) {
        const helpBody = docById("helpBodyDiv");
        helpBody.replaceChildren();
        const totalPages = HELPCONTENT.length;
        const pageCount = `${page + 1}/${totalPages}`;
        const rightArrow = docById("right-arrow");
        const leftArrow = docById("left-arrow");
        const title = HELPCONTENT[page][0];
        const imageSrc = HELPCONTENT[page][2];

        rightArrow.classList.toggle("disabled", page === HELPCONTENT.length - 1);
        leftArrow.classList.toggle("disabled", page === 0);

        // Check if this is the Interface Tour launcher card
        const pageTitle = HELPCONTENT[page][0];
        const isInterfaceTour = HelpWidget._isInterfaceTourCard(pageTitle);

        // Previous HTML content is removed, and new one is generated.
        const bodyFragment = document.createDocumentFragment();
        const imageP = document.createElement("p");
        imageP.append(document.createTextNode("\u00a0"));
        const img = document.createElement("img");
        img.src = imageSrc;
        img.alt = `${title} icon`;

        if (this._isLargeTourImage(title)) {
            img.classList.add("help-tour-image");
        } else if (this._isDetailedTourIcon(title)) {
            img.classList.add("help-tour-detailed-icon");
        } else {
            img.src = this._getHighContrastHelpIconSrc(imageSrc);
            img.classList.add("help-tour-icon");
            if (this._usesHighContrastWhiteFilter(imageSrc)) {
                img.classList.add("help-tour-white-icon");
            }
            img.setAttribute("width", "64px");
            img.setAttribute("height", "64px");
        }
        imageP.append(img);
        bodyFragment.append(imageP);

        const heading = document.createElement("h1");
        heading.classList.add("heading");
        heading.textContent = HELPCONTENT[page][0];
        bodyFragment.append(heading);

        const description = document.createElement("p");
        description.classList.add("description");
        const descParts = HELPCONTENT[page][1].split(/<br\s*\/?>/i);
        descParts.forEach((part, index) => {
            description.append(document.createTextNode(part));
            if (index < descParts.length - 1) {
                description.append(document.createElement("br"));
            }
        });
        bodyFragment.append(description);

        const count = document.createElement("p");
        count.textContent = pageCount;
        bodyFragment.append(count);

        if (HELPCONTENT[page].length > 3) {
            const link = HELPCONTENT[page][3];
            const linkParagraph = document.createElement("p");
            const anchor = document.createElement("a");
            anchor.href = link;
            anchor.target = "_blank";
            anchor.rel = "noopener noreferrer";
            anchor.textContent = HELPCONTENT[page][4];
            linkParagraph.append(anchor);
            bodyFragment.append(linkParagraph);
        }

        // Add Start Tour and Skip buttons for the Interface Tour card
        if (isInterfaceTour) {
            const buttonContainer = document.createElement("div");
            buttonContainer.id = "tutorial-buttons-container";
            buttonContainer.style.cssText =
                "display: flex; flex-direction: row; gap: 12px; margin-top: 20px; " +
                "justify-content: center;";

            const startBtn = document.createElement("button");
            startBtn.id = "start-tutorial-btn";
            startBtn.type = "button";
            startBtn.textContent = "▶ " + _("Start Tour");
            startBtn.style.cssText =
                "padding: 12px 24px; background: #4CAF50; color: white; border: none; " +
                "border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;";

            const skipBtn = document.createElement("button");
            skipBtn.id = "skip-tutorial-btn";
            skipBtn.type = "button";
            skipBtn.textContent = _("Skip") + " →";
            skipBtn.style.cssText =
                "padding: 12px 24px; background: #e0e0e0; color: #505050; border: none; " +
                "border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;";

            buttonContainer.append(startBtn, skipBtn);
            bodyFragment.append(buttonContainer);
        }

        if ([_("Congratulations."), _("Congratulations!")].includes(HELPCONTENT[page][0])) {
            const cell = docById("right-arrow");

            cell.onclick = () => {
                this._prepareBlockList();
            };
        } else {
            const cell = docById("right-arrow");
            const leftArrow = docById("left-arrow");
            cell.onclick = () => {
                if (page >= HELPCONTENT.length - 1) {
                    return;
                }

                page = page + 1;
                leftArrow.classList.remove("disabled");

                this.widgetWindow.updateTitle(HELPCONTENT[page][0]);
                this._showPage(page);
            };
            if (page === 0) {
                leftArrow.classList.add("disabled");
            }
            leftArrow.onclick = () => {
                if (page > 0) {
                    page = page - 1;
                    leftArrow.classList.remove("disabled");
                    if (page === 0) {
                        this.widgetWindow.updateTitle(_("Take a tour"));
                    } else {
                        this.widgetWindow.updateTitle(HELPCONTENT[page][0]);
                    }
                    this._showPage(page);
                }
                if (page === 0) {
                    leftArrow.classList.add("disabled");
                }
            };
        }

        helpBody.style.color = "#505050";
        helpBody.append(bodyFragment);

        // Setup tour button handlers if on Interface Tour page
        if (isInterfaceTour) {
            const startBtn = docById("start-tutorial-btn");
            const skipBtn = docById("skip-tutorial-btn");

            if (startBtn) {
                startBtn.onclick = () => {
                    this.widgetWindow.close();

                    if (typeof FirstProjectTutorial !== "undefined") {
                        const tutorial = new FirstProjectTutorial(this.activity);
                        tutorial.start();
                    } else {
                        console.error("FirstProjectTutorial is not loaded");
                    }
                };
            }

            if (skipBtn) {
                skipBtn.onclick = () => {
                    page = page + 1;
                    if (page >= HELPCONTENT.length) {
                        page = 0;
                    }
                    this.widgetWindow.updateTitle(HELPCONTENT[page][0]);
                    this._showPage(page);
                };
            }
        }

        this.widgetWindow.takeFocus();
    }

    /**
     * @private
     * @param {string} title
     * @returns {boolean}
     */
    _isLargeTourImage(title) {
        return (
            [
                _("Welcome to Music Blocks"),
                _("Meet Mr. Mouse!"),
                _("Guide"),
                _("About"),
                _("Congratulations."),
                _("Congratulations!")
            ].includes(title) || HelpWidget._isInterfaceTourCard(title)
        );
    }

    /**
     * @private
     * @param {string} title
     * @returns {boolean}
     */
    _isDetailedTourIcon(title) {
        return [
            _("Tab Navigation"),
            _("Contextual Menu for Blocks"),
            _("Contextual Menu for Canvas")
        ].includes(title);
    }

    /**
     * @private
     * @param {string} src
     * @returns {string}
     */
    _getHighContrastHelpIconSrc(src) {
        if (
            !document.body.classList.contains("highcontrast") ||
            !src.startsWith(HELP_SVG_DATA_PREFIX)
        ) {
            return src;
        }

        try {
            const svg = this._decodeSvgData(src.slice(HELP_SVG_DATA_PREFIX.length));
            const highContrastSvg = svg
                .replace(/fill-opacity\s*:\s*0\.[0-9]+/g, "fill-opacity:1")
                .replace(/stroke-opacity\s*:\s*0\.[0-9]+/g, "stroke-opacity:1")
                .replace(/opacity\s*:\s*0\.[0-9]+/g, "opacity:1")
                .replace(/fill-opacity="0\.[0-9]+"/g, 'fill-opacity="1"')
                .replace(/stroke-opacity="0\.[0-9]+"/g, 'stroke-opacity="1"')
                .replace(/opacity="0\.[0-9]+"/g, 'opacity="1"');
            return HELP_SVG_DATA_PREFIX + this._encodeSvgData(highContrastSvg);
        } catch (e) {
            return src;
        }
    }

    /**
     * @private
     * @param {string} src
     * @returns {boolean}
     */
    _usesHighContrastWhiteFilter(src) {
        if (
            !document.body.classList.contains("highcontrast") ||
            !src.startsWith(HELP_SVG_DATA_PREFIX)
        ) {
            return false;
        }

        try {
            return !this._hasVisibleWhiteSvgDetail(
                this._decodeSvgData(src.slice(HELP_SVG_DATA_PREFIX.length))
            );
        } catch (e) {
            return true;
        }
    }

    /**
     * @private
     * @param {string} svg
     * @returns {boolean}
     */
    _hasVisibleWhiteSvgDetail(svg) {
        const whiteElements =
            svg.match(/<[^>]*(?:fill|stroke)\s*[:=]\s*["']?#(?:fff|ffffff)\b[^>]*>/gi) || [];

        return whiteElements.some(
            element =>
                !/(?:opacity|fill-opacity|stroke-opacity)\s*[:=]\s*["']?0(?:[;"'\s>]|$)/i.test(
                    element
                )
        );
    }

    /**
     * @private
     * @param {string} encodedSvg
     * @returns {string}
     */
    _decodeSvgData(encodedSvg) {
        return window.atob(encodedSvg);
    }

    /**
     * @private
     * @param {string} svg
     * @returns {string}
     */
    _encodeSvgData(svg) {
        return window.btoa(svg);
    }

    /**
     * Prepare a list of beginner and advanced blocks and cycle through their help
     * @private
     * @returns {void}
     */
    _prepareBlockList() {
        for (const key in this.activity.blocks.protoBlockDict) {
            if (
                this.activity.blocks.protoBlockDict[key].beginnerModeBlock === true &&
                this.activity.blocks.protoBlockDict[key].helpString !== undefined &&
                this.activity.blocks.protoBlockDict[key].helpString.length !== 0
            ) {
                this.beginnerBlocks.push(key);
            }
        }

        for (const key in this.activity.blocks.protoBlockDict) {
            if (
                this.activity.blocks.protoBlockDict[key].beginnerModeBlock === false &&
                this.activity.blocks.protoBlockDict[key].helpString !== undefined &&
                this.activity.blocks.protoBlockDict[key].helpString.length !== 0
            ) {
                this.advancedBlocks.push(key);
            }
        }

        // Array containing list of all blocks (Beginner blocks first)

        this.appendedBlockList.push(...this.beginnerBlocks);
        this.appendedBlockList.push(...this.advancedBlocks);

        this._blockHelp(this.activity.blocks.protoBlockDict[this.appendedBlockList[0]]);
    }

    /**
     * Function to display help related to a single block
     * called recursively to cycle through help string of all blocks (Beginner Blocks First)
     * @private
     * @param {ProtoBlock} block
     * @returns {void}
     */
    _blockHelp(block) {
        if (!block) return;
        const widgetWindow = window.widgetWindows.windowFor(this, "help", "help");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        this._helpDiv = document.createElement("div");

        //this._helpDiv.style.width = "500px";
        this._helpDiv.style.height = "70vh";
        // this._helpDiv.style.backgroundColor = "#e8e8e8";

        this._helpDiv.replaceChildren(
            (() => {
                const fragment = document.createDocumentFragment();
                const rightArrow = document.createElement("div");
                rightArrow.id = "right-arrow";
                rightArrow.className = "hover";
                rightArrow.tabIndex = 0;
                rightArrow.setAttribute("role", "button");
                rightArrow.setAttribute("aria-label", _("Next"));

                const leftArrow = document.createElement("div");
                leftArrow.id = "left-arrow";
                leftArrow.className = "hover";
                leftArrow.tabIndex = 0;
                leftArrow.setAttribute("role", "button");
                leftArrow.setAttribute("aria-label", _("Previous"));

                const helpButtonsDiv = document.createElement("div");
                helpButtonsDiv.id = "helpButtonsDiv";
                helpButtonsDiv.tabIndex = -1;

                const helpScrollWrapper = document.createElement("div");
                helpScrollWrapper.id = "helpScrollWrapper";

                const helpBodyDiv = document.createElement("div");
                helpBodyDiv.id = "helpBodyDiv";
                helpBodyDiv.tabIndex = -1;

                helpScrollWrapper.append(helpBodyDiv);
                fragment.append(rightArrow, leftArrow, helpButtonsDiv, helpScrollWrapper);
                return fragment;
            })()
        );

        this.widgetWindow.getWidgetBody().append(this._helpDiv);
        let cell = docById("right-arrow");
        const rightArrow = docById("right-arrow");
        const leftArrow = docById("left-arrow");

        if (this._keydownHandler) {
            document.removeEventListener("keydown", this._keydownHandler);
        }
        this._keydownHandler = event => {
            if (event.key === "ArrowLeft") {
                leftArrow.click();
            } else if (event.key === "ArrowRight") {
                rightArrow.click();
            }
        };
        document.addEventListener("keydown", this._keydownHandler);

        if (this.index === this.appendedBlockList.length - 1) {
            rightArrow.classList.add("disabled");
        }
        cell.onclick = () => {
            if (this.index !== this.appendedBlockList.length - 1) {
                this.index += 1;
            }
            this._blockHelp(
                this.activity.blocks.protoBlockDict[this.appendedBlockList[this.index]]
            );
        };

        cell = docById("left-arrow");

        cell.onclick = () => {
            if (this.index === 0) {
                const widgetWindow = window.widgetWindows.windowFor(this, "help", "help");
                this.widgetWindow = widgetWindow;
                widgetWindow.clear();
                this._helpDiv = document.createElement("div");
                this._setup(false, HELPCONTENT.length - 1);
            } else {
                this.index -= 1;
                this._blockHelp(
                    this.activity.blocks.protoBlockDict[this.appendedBlockList[this.index]]
                );
            }
        };
        if (block.name !== null) {
            const label = block.staticLabels[0];
            this.widgetWindow.updateTitle(_(label));
        }

        if (block.name !== null) {
            const name = block.name;

            const iconsContainer = document.createElement("div");
            iconsContainer.classList.add("icon-container");

            const findLink = document.createElement("a");
            findLink.className = "tooltipped";
            findLink.dataset.toggle = "tooltip";
            findLink.title = _("Show Palette containing the block");
            findLink.dataset.position = "bottom";
            const findIconEl = document.createElement("i");
            findIconEl.id = "findIcon";
            findIconEl.className = "material-icons md-48";
            findIconEl.style.marginRight = "10px";
            findIconEl.textContent = "search";
            findLink.append(findIconEl);
            iconsContainer.append(findLink);

            const message = block.helpString;

            const helpBody = docById("helpBodyDiv");
            helpBody.style.height = "70vh";
            // helpBody.style.backgroundColor = "#e8e8e8";
            if (message) {
                const bodyFragment = document.createDocumentFragment();
                if (message.length > 1) {
                    let path = message[1];
                    // We need to add a case here whenever we add
                    // help artwort support for a new language.
                    // e.g., documentation-es
                    let language = localStorage.languagePreference;
                    if (language === undefined) {
                        language = navigator.language;
                    }

                    switch (language) {
                        case "ja":
                            if (localStorage.kanaPreference === "kana") {
                                path = path + "-kana";
                            } else {
                                path = path + "-ja";
                            }
                            break;
                        case "es":
                            path = path + "-es";
                            break;
                        case "pt":
                            path = path + "-pt";
                            break;
                        default:
                            break;
                    }

                    const imageSrc = `Docs/documentation/${name}_block.svg`;
                    const figure = document.createElement("figure");
                    figure.classList.add("blockImage-wrapper");
                    const img = document.createElement("img");
                    img.classList.add("blockImage");
                    img.src = imageSrc;
                    figure.append(img);
                    bodyFragment.append(figure);
                }

                const messageParagraph = document.createElement("p");
                messageParagraph.classList.add("message");
                const messageParts = message[0].split(/<br\s*\/?>/i);
                messageParts.forEach((part, index) => {
                    messageParagraph.append(document.createTextNode(part));
                    if (index < messageParts.length - 1) {
                        messageParagraph.append(document.createElement("br"));
                    }
                });
                bodyFragment.append(messageParagraph);
                helpBody.append(bodyFragment);

                const loadButton = document.createElement("i");
                loadButton.id = "loadButton";
                loadButton.className = "material-icons md-48";
                loadButton.style.marginRight = "10px";
                loadButton.dataset.toggle = "tooltip";
                loadButton.title = _("Load this block");
                loadButton.textContent = "get_app";
                iconsContainer.prepend(loadButton);

                if (!block.beginnerModeBlock) {
                    const advLink = document.createElement("a");
                    advLink.className = "tooltipped";
                    advLink.dataset.toggle = "tooltip";
                    advLink.title = _("This block is only available in advance mode.");
                    advLink.dataset.position = "bottom";
                    const advIconEl = document.createElement("i");
                    advIconEl.id = "advIconText";
                    advIconEl.className = "material-icons md-48";
                    advIconEl.textContent = "star";
                    advLink.append(advIconEl);
                    iconsContainer.append(advLink);
                }

                // append the iconsContainer to the helpBodyDiv
                helpBody.append(iconsContainer);

                const findIconMethod = docById("findIcon");

                findIconMethod.onclick = () => {
                    block.palette.palettes.showPalette(block.palette.name);
                };

                if (loadButton !== null) {
                    loadButton.onclick = () => {
                        if (message.length < 4) {
                            // If there is nothing specified, just
                            // load the block.
                            // console.debug("CLICK: " + name);
                            const obj = this.activity.blocks.palettes.getProtoNameAndPalette(name);
                            const protoblk = obj[0];
                            const paletteName = obj[1];
                            const protoName = obj[2];

                            const protoResult = Object.prototype.hasOwnProperty.call(
                                this.activity.blocks.protoBlockDict,
                                protoName
                            );
                            if (protoResult) {
                                this.activity.blocks.palettes.dict[paletteName].makeBlockFromSearch(
                                    protoblk,
                                    protoName,
                                    newBlock => {
                                        this.activity.blocks.moveBlock(newBlock, 100, 100);
                                    }
                                );
                            }
                        } else if (typeof message[3] === "string") {
                            // If it is a string, load the macro
                            // assocuated with this block
                            const blocksToLoad = getMacroExpansion(
                                this.activity,
                                message[3],
                                100,
                                100
                            );
                            // console.debug("CLICK: " + blocksToLoad);
                            this.activity.blocks.loadNewBlocks(blocksToLoad);
                        } else {
                            // Load the blocks.
                            const blocksToLoad = message[3];
                            // console.debug("CLICK: " + blocksToLoad);
                            this.activity.blocks.loadNewBlocks(blocksToLoad);
                        }
                    };
                }
            }
        }

        this.widgetWindow.takeFocus();
    }

    /**
     * @deprecated
     */
    showPageByName(pageName) {
        for (let i = 0; i < HELPCONTENT.length; i++) {
            if (HELPCONTENT[i].includes(pageName)) {
                this._showPage(i);
            }
        }
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = HelpWidget;
}
