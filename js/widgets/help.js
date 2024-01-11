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

/* global

   _, docById, getMacroExpansion, HELPCONTENT,
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
     */
    constructor(activity, useActiveBlock) {
        this.activity = activity;
        this.beginnerBlocks = [];
        this.advancedBlocks = [];
        this.appendedBlockList = [];
        this.index = 0;
        this.isOpen = true;
        this.is_dragging=false;

        const widgetWindow = window.widgetWindows.windowFor(this, "help", "help", false);
       //widgetWindow.getWidgetBody().style.overflowY = "auto";
        // const canvasHeight = docById("myCanvas").getBoundingClientRect().height;
        widgetWindow.getWidgetBody().style.maxHeight = "70vh";
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();
        widgetWindow.onclose = () => {
            this.isOpen = false;
            document.onkeydown = activity.__keyPressed ; 
            widgetWindow.destroy();
        };

        // Position the widget and make it visible.
        function startDragging(e) {
            console.log(e.target.id);
            if (e.target.id === 'help') {
                const help = document.getElementById('help');
        
                this.isDragging = true;
                offsetX = e.clientX - e.target.getBoundingClientRect().left;
                offsetY = e.clientY - e.target.getBoundingClientRect().top;
        
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', stopDragging);
            }
        }
        
        function handleMouseMove(e) {
            if (this.isDragging) {
                const help = document.getElementById('help');
                help.style.left = e.clientX - offsetX + 'px';
                help.style.top = e.clientY - offsetY + 'px';
            }
        }
        
        function stopDragging() {
            this.isDragging = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', stopDragging);
        }
        // Give the DOM time to create the div.
        setTimeout(() => this._setup(useActiveBlock, 0), 0);

        // Position center
        setTimeout(this.widgetWindow.sendToCenter, 50);
        this._helpDiv.addEventListener('dblclick', startDragging);
    }

    /**
     * @private
     * @param {useActiveBlock} Show help for the active block.
     * @returns {void}
     */
    _setup(useActiveBlock, page) {
        // Which help page are we on?

        this._helpDiv.style.width = 100 +"%";
        this._helpDiv.style.backgroundColor = "#e8e8e8";

        // this._helpDiv.style.maxHeight = "100%";
        // this._helpDiv.style.overflowY = "auto";
        
        const innerHTML = `
                    <div id="right-arrow" class="hover" tabindex="-1"></div>
                    <div id="left-arrow" class="hover" tabindex="-1"></div>
                    <div id="helpButtonsDiv" tabindex="-1"></div>
                    <div id="helpBodyDiv" tabindex="-1"></div>
                         `;

        this._helpDiv.insertAdjacentHTML("afterbegin", innerHTML) ;
        this.widgetWindow.getWidgetBody().append(this._helpDiv);


        let leftArrow, rightArrow;
        if (!useActiveBlock) {
            if (page == 0) {
                this.widgetWindow.updateTitle("TAKE A TOUR");
            }
            else {
                this.widgetWindow.updateTitle(HELPCONTENT[page][0]);
            }
            rightArrow = document.getElementById("right-arrow");
            rightArrow.style.display = "block";
            rightArrow.classList.add("hover");

            leftArrow = document.getElementById("left-arrow");
            leftArrow.style.display = "block";
            leftArrow.classList.add("hover");
            
            document.onkeydown = function handleArrowKeys(event) {
                if (event.key === 'ArrowLeft') {
                    leftArrow.click(); 
                } else if (event.key === 'ArrowRight') {
                    rightArrow.click(); 
                }
            } ;

            let cell = docById("left-arrow");
            if (page === 0){
                leftArrow.classList.add('disabled');
            }
            cell.onclick = () => {
                    if (page > 0){
                        page = page - 1;
                        leftArrow.classList.remove('disabled');
                        if (page == 0) {
                            this.widgetWindow.updateTitle("TAKE A TOUR");
                        }
                        else {
                            this.widgetWindow.updateTitle(HELPCONTENT[page][0]);
                        }
                        this._showPage(page);
                    }
                    if (page === 0){
                        leftArrow.classList.add('disabled');
                    }
            };

            cell = docById("right-arrow");

            cell.onclick = () => {
                page = page + 1;
                leftArrow.classList.remove('disabled');
                if (page === HELPCONTENT.length) {
                    page = 0;
                }
                if (page == 0) {
                    this.widgetWindow.updateTitle("TAKE A TOUR");
                }
                else {
                    this.widgetWindow.updateTitle(HELPCONTENT[page][0]);
                }
                this._showPage(page);
            };
        } else {
            if (this.activity.blocks.activeBlock.name !== null) {
                const label = this.activity.blocks.blockList[this.activity.blocks.activeBlock]
                    .protoblock.staticLabels[0];
                    if (page == 0) {
                        this.widgetWindow.updateTitle("TAKE A TOUR");
                    }
                    else {
                        this.widgetWindow.updateTitle(HELPCONTENT[page][0]);
                    }
            }

            rightArrow = document.getElementById("right-arrow");
            rightArrow.style.display = "none";
            rightArrow.classList.remove("hover");

            leftArrow = document.getElementById("left-arrow");
            leftArrow.style.display = "none";
            leftArrow.classList.remove("hover");
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

                const advIcon =
                    `<a class="tooltipped"
                        data-toggle="tooltip"
                        title="This block is only available in advance mode"
                        data-position="bottom">
                      <i id="advIconText" class="material-icons md-48">star</i>
                     </a>
                    `;

                const findIcon =
                    `<a class="tooltipped"
                        data-toggle="tooltip"
                        title="Show Palette containing the block"
                        data-position="bottom">
                      <i style="margin-right: 10px" id="findIcon" class="material-icons md-48">search</i>
                    </a>
                    `;

                // Create a new container which conatains all the icons. IT will be appnded to the helpBodyDiv
                const iconsContainer = document.createElement("div") ;
                iconsContainer.classList.add("icon-container") ;
                iconsContainer.insertAdjacentHTML("afterbegin", findIcon) ;

                // Each block's help entry contains a help string, the
                // path of the help svg, an override name for the help
                // svg file, and an optional macro name for generating
                // the help output.
                
                const message = this.activity.blocks.blockList[this.activity.blocks.activeBlock]
                    .protoblock.helpString;

                if (message) {
                    const helpBody = docById("helpBodyDiv");
                    helpBody.style.height = "70vh";

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

                        // body = body + '<p><img src="' + path + "/" + name + '_block.svg"></p>';
                        const imageSrc = `${path}/${name}_block.svg` ;
                        body += `<figure style="width:100%;"><img style="max-width:100%;" src=${imageSrc}></figure>`;
                    }

                    body += `<p>${message[0]}</p>`;

                    const loadButtonHTML = '<i style="margin-right: 10px" id="loadButton" data-toggle="tooltip" title="Load this block" class="material-icons md-48">get_app</i>';
                    iconsContainer.insertAdjacentHTML("afterbegin",loadButtonHTML);

                    helpBody.insertAdjacentHTML("afterbegin", body) ;

                    if (
                        !this.activity.blocks.blockList[this.activity.blocks.activeBlock].protoblock
                            .beginnerModeBlock
                    ) {
                        iconsContainer.insertAdjacentHTML("beforeend", advIcon) ;
                    }

                    // append the icons container to the helpBodyDiv. It contains load, find and adv icons. 
                    helpBody.append(iconsContainer) ;

                    const object = this.activity.blocks.palettes.getProtoNameAndPalette(name);

                    const loadButton = docById("loadButton");
                    if (loadButton !== null) {
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
                                    ].makeBlockFromSearch(protoblk, protoName, (newBlock) => {
                                        this.activity.blocks.moveBlock(newBlock, 100, 100);
                                    });
                                }
                            } else if (typeof message[3] === "string") {
                                // If it is a string, load the macro
                                // assocuated with this block
                                const blocksToLoad = getMacroExpansion(message[3], 100, 100);
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
        helpBody.innerHTML = "" ;

        // Previous HTML content is removed, and new one is generated. 
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
            // body = body + '<p>&nbsp;<img src="' + HELPCONTENT[page][2] + '"></p>';
            body = `<figure>&nbsp;<img src=" ${HELPCONTENT[page][2]}"></figure>` ;
        } else {
            body = `<figure>&nbsp;<img src=" ${HELPCONTENT[page][2]}" width="64px" height="64px"></figure>` ;
        }
        
        const helpContentHTML =
        `<h1 class="heading">${HELPCONTENT[page][0]}</h1> 
         <p class ="description">${HELPCONTENT[page][1]}</p>
        ` ;
        
        body += helpContentHTML ;

        if (HELPCONTENT[page].length > 3) {
            const link = HELPCONTENT[page][3];
            // console.debug(page + " " + link);
            body += `<p><a href="${link}" target="_blank">${HELPCONTENT[page][4]}</a></p>` ;
        }

        if ([_("Congratulations.")].indexOf(HELPCONTENT[page][0]) !== -1) {
            const cell = docById("right-arrow");

            cell.onclick = () => {
                this._prepareBlockList();
            };
        }
        else{
            const cell = docById("right-arrow");
            let leftArrow = docById("left-arrow");
            cell.onclick = () => {
                page = page + 1;
                leftArrow.classList.remove('disabled');
                if (page === HELPCONTENT.length) {
                    page = 0;
                }
                if (page == 0) {
                    this.widgetWindow.updateTitle("TAKE A TOUR");
                }
                else {
                    this.widgetWindow.updateTitle(HELPCONTENT[page][0]);
                }
                this._showPage(page);
            };
            if (page === 0){
                leftArrow.classList.add('disabled');
            }
            leftArrow.onclick = () => {
                    if (page > 0){
                        page = page - 1;
                        leftArrow.classList.remove('disabled');
                        if (page == 0) {
                            this.widgetWindow.updateTitle("TAKE A TOUR");
                        }
                        else {
                            this.widgetWindow.updateTitle(HELPCONTENT[page][0]);
                        }
                        this._showPage(page);
                    }
                    if (page === 0){
                        leftArrow.classList.add('disabled');
                    }
            };
        }

        helpBody.style.color = "#505050";
        helpBody.insertAdjacentHTML("afterbegin", body) ;


        this.widgetWindow.takeFocus();
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
        let old_left=this._helpDiv.style.left;
        let old_top=this._helpDiv.top;
        const widgetWindow = window.widgetWindows.windowFor(this, "help", "help");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        this._helpDiv = document.createElement("div");   

        //this._helpDiv.style.width = "500px";
        this._helpDiv.style.height = "70vh";
        this._helpDiv.style.backgroundColor = "#e8e8e8";
        
        const helpDivHTML =
            '<div id="right-arrow" class="hover" tabindex="-1"></div><div id="left-arrow" class="hover" tabindex="-1"></div><div id="helpButtonsDiv" tabindex="-1"></div><div id="helpBodyDiv" tabindex="-1"></div>';
        this._helpDiv.insertAdjacentHTML("afterbegin", helpDivHTML) ;
        this._helpDiv.style.left=old_left;
        this._helpDiv.style.top=old_top;
        function startDragging(e) {
            console.log(e.target.id);
            if (e.target.id === 'help') {
                this.isDragging = true;
                offsetX = e.clientX - e.target.getBoundingClientRect().left;
                offsetY = e.clientY - e.target.getBoundingClientRect().top;
        
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', stopDragging);
            }
        }
        function handleMouseMove(e) {
            if (this.isDragging) {
                const help = document.getElementById('help');
                help.style.left = e.clientX - offsetX + 'px';
                help.style.top = e.clientY - offsetY + 'px';
            }
        }
        
        function stopDragging() {
            this.isDragging = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', stopDragging);
        }
        
        this._helpDiv.addEventListener('dblclick', startDragging);

        this.widgetWindow.getWidgetBody().append(this._helpDiv);
        let cell = docById("right-arrow");
        let rightArrow = docById("right-arrow");
        let leftArrow = docById("left-arrow");

        document.onkeydown = function handleArrowKeys(event) {
            if (event.key === 'ArrowLeft') {
                leftArrow.click(); 
            } else if (event.key === 'ArrowRight') {
                rightArrow.click(); 
            }
        };

        if(this.index == this.appendedBlockList.length - 1)
        {
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
            if (this.index == 0) {
                const widgetWindow = window.widgetWindows.windowFor(this, "help", "help");
                this.widgetWindow = widgetWindow;
                widgetWindow.clear();
                this._helpDiv = document.createElement("div");
                this._setup(false, HELPCONTENT.length-1);
            }
            else {
             this.index -= 1;
             this._blockHelp (
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
           
            const advIcon =
                `<a class="tooltipped"
                    data-toggle="tooltip"
                    title="This block is only available in advance mode"
                    data-position="bottom">
                     <i id="advIconText"
                        class="material-icons md-48">star
                     </i>
                 </a>
                `;

            const findIcon =
                `<a class="tooltipped"
                    data-toggle="tooltip"
                    title="Show Palette containing the block"
                    data-position="bottom">
                    <i style="margin-right: 10px"
                        id="findIcon"
                        class="material-icons md-48">search
                    </i>
                 </a>
                `;

            const iconsContainer = document.createElement("div");
            iconsContainer.classList.add("icon-container") ;

            const message = block.helpString;

            const helpBody = docById("helpBodyDiv");
            helpBody.style.height = "70vh";
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

                    const imageSrc = `documentation/${name}_block.svg` ;
                    body += `<figure class="blockImage-wrapper"><img class="blockImage" src="${imageSrc}"></figure>` ;
                }

                body += `<p class="message">${message[0]}</p>` ;
                helpBody.insertAdjacentHTML("afterbegin", body) ;

                const loadIconHTML =
                    '<i style="margin-right: 10px" id="loadButton" data-toggle="tooltip" title="Load this block" class="material-icons md-48">get_app</i>';
                
                iconsContainer.insertAdjacentHTML("afterbegin", loadIconHTML) ;
                iconsContainer.insertAdjacentHTML("beforeend", findIcon) ;

                if (!block.beginnerModeBlock) {
                    iconsContainer.insertAdjacentHTML("beforeend", advIcon) ;
                }

                // append the iconsContainer to the helpBodyDiv 
                helpBody.append(iconsContainer) ;

                const findIconMethod = docById("findIcon");

                findIconMethod.onclick = () => {
                    block.palette.palettes.showPalette(block.palette.name);
                };

                const loadButton = docById("loadButton");
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
                                    (newBlock) => {
                                        this.activity.blocks.moveBlock(newBlock, 100, 100);
                                    }
                                );
                            }
                        } else if (typeof message[3] === "string") {
                            // If it is a string, load the macro
                            // assocuated with this block
                            const blocksToLoad = getMacroExpansion(message[3], 100, 100);
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
