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

function HelpWidget() {
    const ICONSIZE = 32;
    var beginnerBlocks = [];
    var advancedBlocks = [];
    var appendedBlockList = [];
    var index = 0;

    this.init = function(blocks) {
        this.isOpen = true;

        var widgetWindow = window.widgetWindows.windowFor(this, "help", "help");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
	widgetWindow.show();

        widgetWindow.onClose = function() {
            that.isOpen = false;
            this.destroy();
        };

        // Position the widget and make it visible.
        this._helpDiv = document.createElement("div");

        // Give the DOM time to create the div.
        var that = this;
        setTimeout(function() {
            that._setup(blocks);
        }, 100);
    };

    this._setup = function(blocks) {
        var iconSize = ICONSIZE;
        // Which help page are we on?
        var page = 0;

        this._helpDiv.style.width = iconSize * 2 + 425 + "px";
        this._helpDiv.style.backgroundColor = "#e8e8e8";
        this._helpDiv.innerHTML =
            '<div id="right-arrow" class="hover" tabindex="-1"></div><div id="left-arrow" class="hover" tabindex="-1"></div><div id="helpButtonsDiv" tabindex="-1"></div><div id="helpBodyDiv" tabindex="-1"></div>';

        this.widgetWindow.getWidgetBody().append(this._helpDiv);

        // Make help div appear in center of screen
        this.widgetWindow.sendToCenter();

        if (blocks === null) {
            var that = this;

            this.widgetWindow.updateTitle(_("Take a tour"));
            var rightArrow = document.getElementById("right-arrow");
            rightArrow.style.display = "block";
            rightArrow.classList.add("hover");

            var leftArrow = document.getElementById("left-arrow");
            leftArrow.style.display = "block";
            leftArrow.classList.add("hover");

            var cell = docById("left-arrow");

            cell.onclick = function() {
                page = page - 1;
                if (page < 0) {
                    page = HELPCONTENT.length - 1;
                }

                that._showPage(page);
            };

            var cell = docById("right-arrow");

            cell.onclick = function() {
                page = page + 1;
                if (page === HELPCONTENT.length) {
                    page = 0;
                }

                that._showPage(page);
            };
        } else {
            if (blocks.activeBlock.name !== null) {
                var label =
                    blocks.blockList[blocks.activeBlock].protoblock
                        .staticLabels[0];
                this.widgetWindow.updateTitle(_(label));
            }

            var rightArrow = document.getElementById("right-arrow");
            rightArrow.style.display = "none";
            rightArrow.classList.remove("hover");

            var leftArrow = document.getElementById("left-arrow");
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
                var name = blocks.blockList[blocks.activeBlock].name;
                // Each block's help entry contains a help string, the
                // path of the help svg, an override name for the help
                // svg file, and an optional macro name for generating
                // the help output.
                var message =
                    blocks.blockList[blocks.activeBlock].protoblock.helpString;
                
                if (message) {
                    var helpBody = docById("helpBodyDiv");
                    helpBody.style.height = "";

                    var body = "";
                    if (message.length > 1) {
                        var path = message[1];
                        // We need to add a case here whenever we add
                        // help artwort support for a new language.
                        // e.g., documentation-es
                        var language = localStorage.languagePreference;
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

                        body =
                            body +
                            '<p><img src="' +
                            path +
                            "/" +
                            name +
                            '_block.svg"></p>';
                    }

                    body = body + "<p>" + message[0] + "</p>";

                    body +=
                        '<img src="header-icons/export-chunk.svg" id="loadButton" width="32" height="32" alt=' +
                        _("Load blocks") +
                        "/>";

                    helpBody.innerHTML = body;

                    var loadButton = docById("loadButton");
                    if (loadButton !== null) {
                        loadButton.onclick = function() {
                            if (message.length < 4) {
                                // If there is nothing specified, just
                                // load the block.
                                console.debug("CLICK: " + name);
                                var obj = blocks.palettes.getProtoNameAndPalette(
                                    name
                                );
                                var protoblk = obj[0];
                                var paletteName = obj[1];
                                var protoName = obj[2];

                                var protoResult = blocks.protoBlockDict.hasOwnProperty(
                                    protoName
                                );
                                if (protoResult) {
                                    blocks.palettes.dict[
                                        paletteName
                                    ].makeBlockFromSearch(
                                        protoblk,
                                        protoName,
                                        function(newBlock) {
                                            blocks.moveBlock(
                                                newBlock,
                                                100,
                                                100
                                            );
                                        }
                                    );
                                }
                            } else if (typeof message[3] === "string") {
                                // If it is a string, load the macro
                                // assocuated with this block
                                var blocksToLoad = getMacroExpansion(
                                    message[3],
                                    100,
                                    100
                                );
                                console.debug("CLICK: " + blocksToLoad);
                                blocks.loadNewBlocks(blocksToLoad);
                            } else {
                                // Load the blocks.
                                var blocksToLoad = message[3];
                                console.debug("CLICK: " + blocksToLoad);
                                blocks.loadNewBlocks(blocksToLoad);
                            }
                        };
                    }
                }
            }
        }

        this.widgetWindow.takeFocus();
    };

    this._showPage = function(page) {
        var helpBody = docById("helpBodyDiv");
        var body = "";
        if (
            [
                _("Welcome to Music Blocks"),
                _("Meet Mr. Mouse!"),
                _("Guide"),
                _("About"),
                _("Congratulations.")
            ].indexOf(HELPCONTENT[page][0]) !== -1
        ) {
            body =
                body + '<p>&nbsp;<img src="' + HELPCONTENT[page][2] + '"></p>';
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
            var link = HELPCONTENT[page][3];
            console.debug(page + " " + link);
            body =
                body +
                '<p><a href="' +
                link +
                '" target="_blank">' +
                HELPCONTENT[page][4] +
                "</a></p>";
        }

        if (
            [
                _("Congratulations.")
            ].indexOf(HELPCONTENT[page][0]) !== -1
        ) {
            var cell = docById("right-arrow");
            var that = this;
            cell.onclick = function() {
                that._prepareBlockList(blocks);
            }
        }

        helpBody.style.color = "#505050";
        helpBody.innerHTML = body;

        this.widgetWindow.takeFocus();
    };

    // Prepare a list of beginner and advanced blocks and cycle through their help

    this._prepareBlockList = function(blocks) {
        for (var key in blocks.protoBlockDict){
            if(blocks.protoBlockDict[key].beginnerModeBlock === true && blocks.protoBlockDict[key].helpString !== undefined && blocks.protoBlockDict[key].helpString.length !== 0) {
                beginnerBlocks.push(key);
            }
        }

        for(var key in blocks.protoBlockDict) {
            if(blocks.protoBlockDict[key].beginnerModeBlock === false && blocks.protoBlockDict[key].helpString !== undefined && blocks.protoBlockDict[key].helpString.length !== 0) {
                advancedBlocks.push(key);
        }
    }

        // Array containing list of all blocks (Beginner blocks first)
        
        appendedBlockList.push(...beginnerBlocks);
        appendedBlockList.push(...advancedBlocks);

        this._blockHelp(blocks.protoBlockDict[appendedBlockList[0]], blocks)

    }

    // Function to display help related to a single block
    // called recursively to cycle through help string of all blocks (Beginner Blocks First)

    this._blockHelp = function(block, blocks) {
        var iconSize = ICONSIZE;
    
        var widgetWindow = window.widgetWindows.windowFor(this, "help", "help");
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
        var cell = docById("right-arrow");
        var that = this;
        cell.onclick = function() {
            if(index !== appendedBlockList.length - 1) {
                index += 1;
        }
            that._blockHelp(blocks.protoBlockDict[appendedBlockList[index]], blocks)
        }

        var cell = docById("left-arrow");
        
        cell.onclick = function() {
            if(index !== 0){
                index -= 1;
            }
            
            that._blockHelp(blocks.protoBlockDict[appendedBlockList[index]], blocks);
        }
        if (block.name !== null) {
                var label =
                    block
                        .staticLabels[0];
                this.widgetWindow.updateTitle(_(label));
            }
    
        // display help menu
        // docById("helpBodyDiv").style.height = "325px";
        // docById("helpBodyDiv").style.width = "400px";
        // this._showPage(0);
    
        if (block.name !== null) {
            var name = block.name;

            var message =
                block.helpString;

            var helpBody = docById("helpBodyDiv");
                helpBody.style.height = "500px";
                helpBody.style.backgroundColor = "#e8e8e8";
            if (message) {
    
                var body = "";
                if (message.length > 1) {
                    var path = message[1];
                    // We need to add a case here whenever we add
                    // help artwort support for a new language.
                    // e.g., documentation-es
                    var language = localStorage.languagePreference;
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
    
                    body =
                        body +
                        '<p><img src="' +
                        path +
                        "/" +
                        name +
                        '_block.svg"></p>';
                }
    
                body = body + "<p>" + message[0] + "</p>";
    
                body +=
                    '<img src="header-icons/export-chunk.svg" id="loadButton" width="32" height="32" alt=' +
                    _("Load blocks") +
                    "/>";
    
                helpBody.innerHTML = body;

                var loadButton = docById("loadButton");
                if (loadButton !== null) {
                    loadButton.onclick = function() {
                        if (message.length < 4) {
                            // If there is nothing specified, just
                            // load the block.
                            console.debug("CLICK: " + name);
                            var obj = blocks.palettes.getProtoNameAndPalette(
                                name
                            );
                            var protoblk = obj[0];
                            var paletteName = obj[1];
                            var protoName = obj[2];
    
                            var protoResult = blocks.protoBlockDict.hasOwnProperty(
                                protoName
                            );
                            if (protoResult) {
                                blocks.palettes.dict[
                                    paletteName
                                ].makeBlockFromSearch(
                                    protoblk,
                                    protoName,
                                    function(newBlock) {
                                        blocks.moveBlock(
                                            newBlock,
                                            100,
                                            100
                                        );
                                    }
                                );
                            }
                        } else if (typeof message[3] === "string") {
                            // If it is a string, load the macro
                            // assocuated with this block
                            var blocksToLoad = getMacroExpansion(
                                message[3],
                                100,
                                100
                            );
                            console.debug("CLICK: " + blocksToLoad);
                            blocks.loadNewBlocks(blocksToLoad);
                        } else {
                            // Load the blocks.
                            var blocksToLoad = message[3];
                            console.debug("CLICK: " + blocksToLoad);
                            blocks.loadNewBlocks(blocksToLoad);
                        }
                    };
                }
            }
        }
    
    this.widgetWindow.takeFocus();
    }
    

    this.showPageByName = function(pageName) {
        for (var i = 0; i < HELPCONTENT.length; i++) {
            if (HELPCONTENT[i].includes(pageName)) {
                this._showPage(i);
            }
        }
    };
}
