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

const ICONSIZE = 32;

class HelpWidget {
    constructor(blocks) {
        this.beginnerBlocks = [];
        this.advancedBlocks = [];
        this.appendedBlockList = [];
        this.index = 0;
        this.isOpen = true;
    
        let widgetWindow = window.widgetWindows.windowFor(this, "help", "help");
        widgetWindow.getWidgetBody().style.overflowY = "auto";
        const canvasHeight = docById("myCanvas").getBoundingClientRect().height;
        widgetWindow.getWidgetBody().style.maxHeight = `${0.75 * canvasHeight}px`;
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();
        widgetWindow.onClose = () => {
            this.isOpen = false;
            this.destroy();
        };
        // Position the widget and make it visible.
        this._helpDiv = document.createElement("div");
    
        // Give the DOM time to create the div.
        setTimeout(() => this._setup(blocks), 0);

        // Position center
        setTimeout(this.widgetWindow.sendToCenter, 50);
    };

    _setup(blocks) {
        let iconSize = ICONSIZE;
        // Which help page are we on?
        let page = 0;

        this._helpDiv.style.width = iconSize * 2 + 425 + "px";
        this._helpDiv.style.backgroundColor = "#e8e8e8";
        // this._helpDiv.style.maxHeight = "100%";
        // this._helpDiv.style.overflowY = "auto";
        this._helpDiv.innerHTML =
            '<div id="right-arrow" class="hover" tabindex="-1"></div><div id="left-arrow" class="hover" tabindex="-1"></div><div id="helpButtonsDiv" tabindex="-1"></div><div id="helpBodyDiv" tabindex="-1"></div>';

        this.widgetWindow.getWidgetBody().append(this._helpDiv);

        let leftArrow, rightArrow;
        if (blocks === null) {
            this.widgetWindow.updateTitle(_("Take a tour"));
            rightArrow = document.getElementById("right-arrow");
            rightArrow.style.display = "block";
            rightArrow.classList.add("hover");

            leftArrow = document.getElementById("left-arrow");
            leftArrow.style.display = "block";
            leftArrow.classList.add("hover");

            let cell = docById("left-arrow");

            cell.onclick = () => {
                page = page - 1;
                if (page < 0) {
                    page = HELPCONTENT.length - 1;
                }

                this._showPage(page);
            };

            cell = docById("right-arrow");

            cell.onclick = () => {
                page = page + 1;
                if (page === HELPCONTENT.length) {
                    page = 0;
                }

                this._showPage(page);
            };
        } else {
            if (blocks.activeBlock.name !== null) {
                let label = blocks.blockList[blocks.activeBlock].protoblock.staticLabels[0];
                this.widgetWindow.updateTitle(_(label));
            }

            rightArrow = document.getElementById("right-arrow");
            rightArrow.style.display = "none";
            rightArrow.classList.remove("hover");

            leftArrow = document.getElementById("left-arrow");
            leftArrow.style.display = "none";
            leftArrow.classList.remove("hover");
        }

        if (blocks === null) {
            // display help menu
            docById("helpBodyDiv").style.height = "325px";
            docById("helpBodyDiv").style.width = "400px";
            this._showPage(0);
        } else {
            // display help for this block
            if (blocks.activeBlock.name !== null) {
                let name = blocks.blockList[blocks.activeBlock].name;

                let advIcon =
                    '<a\
                class="tooltipped"\
                data-toggle="tooltip"\
                title="This block is only available in advance mode"\
                data-position="bottom"\
                ><i\
                    id="advIconText"\
                    class="material-icons md-48"\
                    >star</i\
                ></a\
                >';

                let findIcon =
                    '<a\
            class="tooltipped"\
            data-toggle="tooltip"\
            title="Show Palette containing the block"\
            data-position="bottom"\
            ><i\
            style="margin-right: 10px"\
                id="findIcon"\
                class="material-icons md-48"\
                >search</i\
            ></a\
            >';

                let showPaletteParamater =
                    blocks.blockList[blocks.activeBlock].protoblock.palette.name;
                // Each block's help entry contains a help string, the
                // path of the help svg, an override name for the help
                // svg file, and an optional macro name for generating
                // the help output.
                let message = blocks.blockList[blocks.activeBlock].protoblock.helpString;

                if (message) {
                    let helpBody = docById("helpBodyDiv");
                    helpBody.style.height = "";

                    let body = "";
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
                                if (localStorage.kanaPreference == "kana") {
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

                        body = body + '<p><img src="' + path + "/" + name + '_block.svg"></p>';
                    }

                    body = body + "<p>" + message[0] + "</p>";

                    body +=
                        '<i style="margin-right: 10px" id="loadButton" data-toggle="tooltip" title="Load this block" class="material-icons md-48">get_app</i>';

                    helpBody.innerHTML = body;
                    helpBody.innerHTML += findIcon;

                    if (!blocks.blockList[blocks.activeBlock].protoblock.beginnerModeBlock) {
                        helpBody.innerHTML += advIcon;
                    }

                    let object = blocks.palettes.getProtoNameAndPalette(name);

                    let loadButton = docById("loadButton");
                    if (loadButton !== null) {
                        loadButton.onclick = () => {
                            if (message.length < 4) {
                                // If there is nothing specified, just load the block.
                                console.debug("CLICK: " + name);

                                let protoblk = object[0];
                                let paletteName = object[1];
                                let protoName = object[2];

                                let protoResult = blocks.protoBlockDict.hasOwnProperty(protoName);
                                if (protoResult) {
                                    blocks.palettes.dict[paletteName].makeBlockFromSearch(
                                        protoblk,
                                        protoName,
                                        (newBlock) => {
                                            blocks.moveBlock(newBlock, 100, 100);
                                        }
                                    );
                                }
                            } else if (typeof message[3] === "string") {
                                // If it is a string, load the macro
                                // assocuated with this block
                                let blocksToLoad = getMacroExpansion(message[3], 100, 100);
                                console.debug("CLICK: " + blocksToLoad);
                                blocks.loadNewBlocks(blocksToLoad);
                            } else {
                                // Load the blocks.
                                let blocksToLoad = message[3];
                                console.debug("CLICK: " + blocksToLoad);
                                blocks.loadNewBlocks(blocksToLoad);
                            }
                        };
                    }
                    let findIconMethod = docById("findIcon");

                    findIconMethod.onclick = () => {
                        blocks.palettes.showPalette(object[1]);
                    };
                }
            }
        }

        this.widgetWindow.takeFocus();
    }

    _showPage(page) {
        let helpBody = docById("helpBodyDiv");
        let body = "";
        if (
            [
                _("Welcome to Music Blocks"),
                _("Meet Mr. Mouse!"),
                _("Guide"),
                _("About"),
                _("Congratulations.")
            ].indexOf(HELPCONTENT[page][0]) !== -1
        ) {
            body = body + '<p>&nbsp;<img src="' + HELPCONTENT[page][2] + '"></p>';
        } else {
            body =
                body +
                '<p>&nbsp;<img src="' +
                HELPCONTENT[page][2] +
                '"width="64px" height="64px"></p>';
        }
        body = body + "<h1>" + HELPCONTENT[page][0] + "</h1>";
        body = body + "<p>" + HELPCONTENT[page][1] + "</p>";

        if (HELPCONTENT[page].length > 3) {
            let link = HELPCONTENT[page][3];
            console.debug(page + " " + link);
            body =
                body +
                '<p><a href="' +
                link +
                '" target="_blank">' +
                HELPCONTENT[page][4] +
                "</a></p>";
        }

        if ([_("Congratulations.")].indexOf(HELPCONTENT[page][0]) !== -1) {
            let cell = docById("right-arrow");

            cell.onclick = () => {
                this._prepareBlockList(blocks);
            };
        }

        helpBody.style.color = "#505050";
        helpBody.innerHTML = body;

        this.widgetWindow.takeFocus();
    };

    // Prepare a list of beginner and advanced blocks and cycle through their help

    _prepareBlockList(blocks) {
        for (let key in blocks.protoBlockDict) {
            if (
                blocks.protoBlockDict[key].beginnerModeBlock === true &&
                blocks.protoBlockDict[key].helpString !== undefined &&
                blocks.protoBlockDict[key].helpString.length !== 0
            ) {
                this.beginnerBlocks.push(key);
            }
        }

        for (let key in blocks.protoBlockDict) {
            if (
                blocks.protoBlockDict[key].beginnerModeBlock === false &&
                blocks.protoBlockDict[key].helpString !== undefined &&
                blocks.protoBlockDict[key].helpString.length !== 0
            ) {
                this.advancedBlocks.push(key);
            }
        }

        // Array containing list of all blocks (Beginner blocks first)
        
        this.appendedBlockList.push(...this.beginnerBlocks);
        this.appendedBlockList.push(...this.advancedBlocks);

        this._blockHelp(blocks.protoBlockDict[this.appendedBlockList[0]], blocks)

    }

    // Function to display help related to a single block
    // called recursively to cycle through help string of all blocks (Beginner Blocks First)

    _blockHelp(block, blocks) {
        let iconSize = ICONSIZE;

        let widgetWindow = window.widgetWindows.windowFor(this, "help", "help");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        this._helpDiv = document.createElement("div");

        this._helpDiv.style.width = "500px";
        this._helpDiv.style.height = "500px";
        this._helpDiv.style.backgroundColor = "#e8e8e8";
        this._helpDiv.innerHTML =
            '<div id="right-arrow" class="hover" tabindex="-1"></div><div id="left-arrow" class="hover" tabindex="-1"></div><div id="helpButtonsDiv" tabindex="-1"></div><div id="helpBodyDiv" tabindex="-1"></div>';

        this.widgetWindow.getWidgetBody().append(this._helpDiv);
        this.widgetWindow.sendToCenter();
        let cell = docById("right-arrow");
        cell.onclick = () => {
            if(this.index !== this.appendedBlockList.length - 1) {
                this.index += 1;
        }
            this._blockHelp(blocks.protoBlockDict[this.appendedBlockList[this.index]], blocks)
        }

        cell = docById("left-arrow");

        cell.onclick = () => {
            if(this.index !== 0){
                this.index -= 1;
            }
            
            this._blockHelp(blocks.protoBlockDict[this.appendedBlockList[this.index]], blocks);
        }
        if (block.name !== null) {
            let label = block.staticLabels[0];
            this.widgetWindow.updateTitle(_(label));
        }

        // display help menu
        // docById("helpBodyDiv").style.height = "325px";
        // docById("helpBodyDiv").style.width = "400px";
        // this._showPage(0);

        if (block.name !== null) {
            let name = block.name;
            let advIcon =
                '<a\
            class="tooltipped"\
            data-toggle="tooltip"\
            title="This block is only available in advance mode"\
            data-position="bottom"\
            ><i\
                id="advIconText"\
                class="material-icons md-48"\
                >star</i\
            ></a\
        >';

            let findIcon =
                '<a\
            class="tooltipped"\
            data-toggle="tooltip"\
            title="Show Palette containing the block"\
            data-position="bottom"\
            ><i\
            style="margin-right: 10px"\
                id="findIcon"\
                class="material-icons md-48"\
                >search</i\
            ></a\
        >';

            let message = block.helpString;

            let helpBody = docById("helpBodyDiv");
            helpBody.style.height = "500px";
            helpBody.style.backgroundColor = "#e8e8e8";
            if (message) {
                let body = "";
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
                            if (localStorage.kanaPreference == "kana") {
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

                    body = body + '<p><img src="' + path + "/" + name + '_block.svg"></p>';
                }

                body = body + "<p>" + message[0] + "</p>";

                body +=
                    '<i style="margin-right: 10px" id="loadButton" data-toggle="tooltip" title="Load this block" class="material-icons md-48">get_app</i>';

                helpBody.innerHTML = body;
                helpBody.innerHTML += findIcon;

                if (!block.beginnerModeBlock) {
                    helpBody.innerHTML += advIcon;
                }

                let findIconMethod = docById("findIcon");

                findIconMethod.onclick = () => {
                    block.palette.palettes.showPalette(block.palette.name);
                };

                let loadButton = docById("loadButton");
                if (loadButton !== null) {
                    loadButton.onclick = () => {
                        if (message.length < 4) {
                            // If there is nothing specified, just
                            // load the block.
                            console.debug("CLICK: " + name);
                            let obj = blocks.palettes.getProtoNameAndPalette(name);
                            let protoblk = obj[0];
                            let paletteName = obj[1];
                            let protoName = obj[2];

                            let protoResult = blocks.protoBlockDict.hasOwnProperty(protoName);
                            if (protoResult) {
                                blocks.palettes.dict[paletteName].makeBlockFromSearch(
                                    protoblk,
                                    protoName,
                                    (newBlock) => {
                                        blocks.moveBlock(newBlock, 100, 100);
                                    }
                                );
                            }
                        } else if (typeof message[3] === "string") {
                            // If it is a string, load the macro
                            // assocuated with this block
                            let blocksToLoad = getMacroExpansion(message[3], 100, 100);
                            console.debug("CLICK: " + blocksToLoad);
                            blocks.loadNewBlocks(blocksToLoad);
                        } else {
                            // Load the blocks.
                            let blocksToLoad = message[3];
                            console.debug("CLICK: " + blocksToLoad);
                            blocks.loadNewBlocks(blocksToLoad);
                        }
                    };
                }
            }
        }

        this.widgetWindow.takeFocus();
    };

    showPageByName(pageName) {
        for (let i = 0; i < HELPCONTENT.length; i++) {
            if (HELPCONTENT[i].includes(pageName)) {
                this._showPage(i);
            }
        }
    }
}