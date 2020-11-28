// Copyright (c) 2014-19 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// All things related to palettes

const PROTOBLOCKSCALE = 0.75;
const PALETTELEFTMARGIN = Math.floor(10 * PROTOBLOCKSCALE);
const PALETTE_SCALE_FACTOR = 0.5;
const PALETTE_WIDTH_FACTOR = 3;

function paletteBlockButtonPush(blocks, name, arg) {
    let blk = blocks.makeBlock(name, arg);
    return blk;
}

// There are several components to the palette system:
//
// loadPaletteButtonHandler is the event handler for palette buttons.
//
// (2) A menu (in the Palettes.dict dictionary) is the palette
// itself. It consists of a title bar (with an icon, label, and close
// button), and individual containers for each protoblock on the
// menu. There is a background behind each protoblock that is part of
// the palette container.
//
// loadPaletteMenuItemHandler is the event handler for the palette menu.
const NPALETTES = 3;

function Palettes() {
    this.blocks = null;
    this.cellSize = null;
    this.paletteWidth = 55 * PALETTE_WIDTH_FACTOR;
    this.scrollDiff = 0;
    this.originalSize = 55; // this is the original svg size
    this.firstTime = true;
    this.background = null;
    this.mouseOver = false;
    this.activePalette = null;
    this.paletteObject = null;
    this.paletteVisible = false;
    this.pluginsDeleteStatus = false;
    this.visible = true;
    this.scale = 1.0;
    this.mobile = false;
    // Top of the palette
    this.top = 55 + 20 + LEADING;
    this.current = DEFAULTPALETTE;
    this.x = []; // We track x and y for each of the multipalettes
    this.y = [];
    this.showSearchWidget = null;
    this.hideSearchWidget = null;

    this.pluginMacros = {}; // some macros are defined in plugins

    if (sugarizerCompatibility.isInsideSugarizer()) {
        storage = sugarizerCompatibility.data;
    } else {
        storage = localStorage;
    }

    // The collection of palettes.
    this.dict = {};
    this.selectorButtonsOff = []; // Select between palettes
    this.selectorButtonsOn = []; // Select between palettes in their on state
    this.buttons = {}; // The toolbar button for each palette.
    this.labels = {}; // The label for each button.
    this.pluginPalettes = []; // List of palettes not in multipalette list

    this.init = function() {
        this.halfCellSize = Math.floor(this.cellSize / 2);
    };

    this.init_selectors = function() {
        for (let i = 0; i < MULTIPALETTES.length; i++) {
            this._makeSelectorButton(i);
        }
    };

    this.deltaY = function(dy) {
        let curr = parseInt(document.getElementById("palette").style.top);
        document.getElementById("palette").style.top = curr + dy +"px"
    };

    this._makeSelectorButton = function(i) {
        console.debug("makeSelectorButton " + i);

        if (!document.getElementById("palette")){
            let element = document.createElement("div");
            element.setAttribute("id","palette");
            element.setAttribute("class","disable_highlighting");
            element.setAttribute("style",'position: fixed; display: none ; left :0px; top:'+this.top+'px');
            element.innerHTML ='<div style="float: left"><table width ="'+(1.5*this.cellSize)+'px"bgcolor="white"><thead><tr></tr></thead></table><table width ="'+(4.5*this.cellSize)+'px"bgcolor="white"><thead><tr><td style= "width:28px"></tr></thead><tbody></tbody></table></div>'
            document.body.appendChild(element);
        }
            let palette = document.getElementById("palette");
            let tr = palette.children[0].children[0].children[0].children[0];
            let td = tr.insertCell();
            td.width=1.5*this.cellSize;
            td.height=1.5*this.cellSize;
            td.appendChild(makePaletteIcons(PALETTEICONS[MULTIPALETTEICONS[i]]
                .replace(
                    "background_fill_color",
                    platformColor.selectorBackground
                )
                .replace(/stroke_color/g, platformColor.ruleColor)
                .replace(/fill_color/g, platformColor.background)
                ,1.5*this.cellSize
                ,1.5*this.cellSize))
            td.onmouseover = (evt) =>{
                this.showSelection(i,tr);
                this.makePalettes(i);
            }
    };

    this.showSelection = (i,tr) => {
        //selector menu design.
        for (let j = 0; j < MULTIPALETTES.length ; j++) {
            let img;
            if (j === i) {
                img = makePaletteIcons(PALETTEICONS[MULTIPALETTEICONS[j]]
                    .replace(
                        "background_fill_color",
                        platformColor.selectorSelected
                    )
                    .replace(/stroke_color/g, platformColor.ruleColor)
                    .replace(/fill_color/g, platformColor.background)
                    ,this.cellSize
                    ,this.cellSize);
            } else {
                img = makePaletteIcons(PALETTEICONS[MULTIPALETTEICONS[j]]
                    .replace(
                        "background_fill_color",
                        platformColor.selectorBackground
                    )
                    .replace(/stroke_color/g, platformColor.ruleColor)
                    .replace(/fill_color/g, platformColor.background)
                    ,this.cellSize
                    ,this.cellSize);
            }
            tr.children[j].children[0].src= img.src;
        }
    }

    this.setSize = function(size) {
        this.cellSize = Math.floor(size * PALETTE_SCALE_FACTOR + 0.5);
        return this;
    };

    this.setMobile = function(mobile) {
        this.mobile = mobile;
        if (mobile) {
            this._hideMenus();
        }

        return this;
    };

    this.setBlocksContainer= function(bloc) {
        this.blocksContainer = bloc ;
        return this;
    };
    
    // We need access to the macro dictionary because we load them.
    this.setMacroDictionary = function(obj) {
        this.macroDict = obj;
        return this;
    };

    this.setSearch = function(show, hide) {
        this.showSearchWidget = show;
        this.hideSearchWidget = hide;
        return this;
    };

    this.getSearchPos = function() {
        return [this.cellSize, this.top + this.cellSize * 1.75];
    };

    this.getPluginMacroExpansion = function(blkname, x, y) {
        console.debug(this.pluginMacros[blkname]);
        let obj = this.pluginMacros[blkname];
        if (obj != null) {
            obj[0][2] = x;
            obj[0][3] = y;
        }

        return obj;
    };

    this.countProtoBlocks = function(name) {
        // How many protoblocks are in palette name?
        let n = 0;
        for (let b in this.blocks.protoBlockDict) {
            if (this.blocks.protoBlockDict[b].palette !== null &&
                this.blocks.protoBlockDict[b].palette.name === name) {
                n += 1;
            }
        }

        return n;
    };

    this.getProtoNameAndPalette = function(name) {
        for (let b in this.blocks.protoBlockDict) {
            // Don't return deprecated blocks.
            if (name === this.blocks.protoBlockDict[b].name &&
                !this.blocks.protoBlockDict[b].hidden) {
                return [b, this.blocks.protoBlockDict[b].palette.name,
                    this.blocks.protoBlockDict[b].name];
            } else if (name === b && !this.blocks.protoBlockDict[b].hidden) {
                return [b, this.blocks.protoBlockDict[b].palette.name,
                    this.blocks.protoBlockDict[b].name];
            }
        }

        return [null, null, null];
    };

    this.makePalettes = function(i) {
        let palette = docById("palette");
        let listBody = palette.children[0].children[1].children[1];
        listBody.parentNode.removeChild(listBody);
        listBody = palette.children[0].children[1].appendChild(
            document.createElement("tbody"));
        // Make an icon/button for each palette
        this.makeButton("search",
                        makePaletteIcons(PALETTEICONS["search"], this.cellSize,
                                         this.cellSize), listBody);
        for (let name of MULTIPALETTES[i]) {
            if (beginnerMode && SKIPPALETTES.indexOf(name) !== -1) {
                continue;
            }
            if (name ==="myblocks" ) {
                let n = this.countProtoBlocks("myblocks");
                if (n === 0) {
                    continue;
                }
            }
            this.makeButton(name,
                            makePaletteIcons(PALETTEICONS[name], this.cellSize,
                                             this.cellSize), listBody);
        }
    };

    this.makeButton = function (name,icon,listBody){
        let row = listBody.insertRow(-1);
        let img = row.insertCell(-1);
        let label = row.insertCell(-1);
        img.appendChild(icon);
        // Add tooltip for palette buttons
        row.setAttribute("style","width: 126px");
        if (localStorage.kanaPreference === "kana") {
            label.textContent = toTitleCase(_(name)) ;
            label.setAttribute(
                "style", "font-size: 12px; color:platformColor.paletteText");
        } else {
            label.textContent = toTitleCase(_(name)) ;
            label.setAttribute(
                "style", "font-size: 16px; color:platformColor.paletteText");
        }

        this._loadPaletteButtonHandler(name,row);
    };

    this.showPalette = function(name) {
        if (this.mobile) {
            return;
        }

        this.hideSearchWidget(true);
        this.dict[name].showMenu(true);
    };

    this._showMenus = function() {
    };

    this._hideMenus = function() {
        // Hide the menu buttons and the palettes themselves.

        this.hideSearchWidget(true);

        if (docById("PaletteBody")) 
            docById("PaletteBody").parentNode.removeChild(docById("PaletteBody"));
            
    };

    this.getInfo = function() {
        for (let key in this.dict) {
            console.debug(this.dict[key].getInfo());
        }
    };

    this.updatePalettes = function(showPalette) {
        if (showPalette != null) {
            // Show the action palette after adding/deleting new
            // nameddo blocks.
            if (showPalette in this.dict){
                let wasOpen = false;
                if (docById("PaletteBody")) {
                    wasOpen = true;
                }

                this.dict[showPalette].hideMenu();

                if (wasOpen) {
                    this.dict[showPalette].show();
                }
            }
        }
        if (this.mobile) {
            this.hide();
        }
    };

    this.hide = function() {
        docById("palette").style.visibility = "hidden";
    };

    this.show = function() {
        docById("palette").style.visibility = "visible";
    };

    this.setBlocks = function(blocks) {
        this.blocks = blocks;
        return this;
    };

    this.add = function(name) {
        this.dict[name] = new Palette(this, name);
        return this;
    };

    // Palette Button event handlers
    this._loadPaletteButtonHandler = function(name,row) {
        row.onmouseover = (evt) => {
            document.body.style.cursor = "pointer";
        }
        row.onclick = (evt) => {
            if (name == "search") {
                this.showSearchWidget();
            } else {
                this.showPalette(name)
            }
        }
        row.onmouseup = (evt) => {
            document.body.style.cursor = "default";
        }
        row.onmouseleave = (evt) => {
            document.body.style.cursor = "default";
        }

    };

    this.removeActionPrototype = function(actionName) {
        let blockRemoved = false;
        for (let blk = 0; blk < this.dict["action"].protoList.length; blk++) {
            let actionBlock = this.dict["action"].protoList[blk];
            if (["nameddo", "namedcalc", "nameddoArg", "namedcalcArg"].indexOf(
                actionBlock.name) !== -1 &&
                actionBlock.defaults[0] === actionName) {
                // Remove the palette protoList entry for this block.
                this.dict["action"].remove(actionBlock, actionName);

                // And remove it from the protoBlock dictionary.
                if (this.blocks.protoBlockDict["myDo_" + actionName]) {
                    delete this.blocks.protoBlockDict["myDo_" + actionName];
                } else if (this.blocks.protoBlockDict["myCalc_" + actionName]) {
                    delete this.blocks.protoBlockDict["myCalc_" + actionName];
                } else if (this.blocks.protoBlockDict[
                    "myDoArg_" + actionName]) {
                    delete this.blocks.protoBlockDict["myDoArg_" + actionName];
                } else if (this.blocks.protoBlockDict[
                    "myCalcArg_" + actionName]) {
                    delete this.blocks.protoBlockDict[
                        "myCalcArg_" + actionName];
                }
                blockRemoved = true;
                break;
            }
        }

        // Force an update if a block was removed.
        if (blockRemoved) {
            this.updatePalettes("action");
        }
    };

    return this;
}

// Kind of a model, but it only keeps a list of SVGs
function PaletteModel(palette, palettes, name) {
    this.palette = palette;
    this.palettes = palettes;
    this.name = name;
    this.blocks = [];

    this.update = function() {
        this.blocks = [];
        for (let blk in this.palette.protoList) {
            let block = this.palette.protoList[blk];
            // Don't show hidden blocks on the menus
            // But we still make them.
            // if (block.hidden) {
            //     continue;
            // }

            // Create a proto block for each palette entry.
            this.blocks.push(this.makeBlockInfo(blk, block, block.name,
                                                block.name));
        }
    };
    
    this.makeBlockInfo = function(blk, block, blkname, modname) {
        let arg;
        switch (blkname) {
            // Use the name of the action in the label
        case "storein":
            modname = "store in " + block.defaults[0];
            arg = block.defaults[0];
            break;
        case "storein2":
            modname = "store in2 " + block.staticLabels[0];
            arg = block.staticLabels[0];
            break;
        case "box":
            modname = block.defaults[0];
            arg = block.defaults[0];
            break;
        case "namedbox":
            if (block.defaults[0] === undefined) {
                modname = "namedbox";
                arg = _("box");
            } else {
                modname = block.defaults[0];
                arg = block.defaults[0];
            }
            break;
        case "namedarg":
            if (block.defaults[0] === undefined) {
                modname = "namedarg";
                arg = "1";
            } else {
                modname = block.defaults[0];
                arg = block.defaults[0];
            }
            break;
        case "nameddo":
            if (block.defaults[0] === undefined) {
                modname = "nameddo";
                arg = _("action");
            } else {
                modname = block.defaults[0];
                arg = block.defaults[0];
            }
            break;
        case "nameddoArg":
            if (block.defaults[0] === undefined) {
                modname = "nameddoArg";
                arg = _("action");
            } else {
                modname = block.defaults[0];
                arg = block.defaults[0];
            }
            break;
        case "namedcalc":
            if (block.defaults[0] === undefined) {
                modname = "namedcalc";
                arg = _("action");
            } else {
                modname = block.defaults[0];
                arg = block.defaults[0];
            }
            break;
        case "namedcalcArg":
            if (block.defaults[0] === undefined) {
                modname = "namedcalcArg";
                arg = _("action");
            } else {
                modname = block.defaults[0];
                arg = block.defaults[0];
            }
            break;
        }

        let protoBlock = this.palettes.blocks.protoBlockDict[blkname];
        if (protoBlock === null) {
            console.debug("Could not find block " + blkname);
        }

        let label = "";
        switch (protoBlock.name) {
        case "grid":
            label = _("grid");
            break;
        case "text":
            label = _("text");
            break;
        case "drumname":
            label = _("drum");
            break;
        case "effectsname":
            label = _("effect");
            break;
        case "solfege":
            label = i18nSolfege("sol");
            break;
        case "eastindiansolfege":
            label = _("sargam");
            break;
        case "scaledegree2":
            label = _("scale degree");
            break;
        case "modename":
            label = _("mode name");
            break;
        case "invertmode":
            label = _("invert mode");
            break;
        case "voicename":
            label = _("voice name");
            break;
        case "customNote":
            label = _("custom pitch");
            break;
        case "temperamentname":
            //TRANS: https://en.wikipedia.org/wiki/Musical_temperament
            label = _("temperament");
            break;
        case "accidentalname":
            //TRANS: accidental refers to sharps, flats, etc.
            label = _("accidental");
            break;
        case "notename":
            label = "G";
            break;
        case "intervalname":
            label = _("interval name");
            break;
        case "boolean":
            label = _("true");
            break;
        case "number":
            label = NUMBERBLOCKDEFAULT.toString();
            break;
        case "less":
        case "greater":
        case "equal":
            // Label should be inside _() when defined.
            label = protoBlock.staticLabels[0];
            break;
        case "namedarg":
            label = "arg " + arg;
            break;
        case "outputtools":
            label = _("pitch converter");
            break;
        default:
            if (blkname != modname) {
                // Override label for do, storein, box, and namedarg
                if (blkname === "storein" && block.defaults[0] === _("box")) {
                    label = _("store in");
                } else if (blkname === "storein2") {
                    if (block.staticLabels[0] === _("store in box")) {
                        label = _("store in box");
                    } else {
                        label = _("store in") + " " + block.staticLabels[0];
                    }
                } else {
                    label = block.defaults[0];
                }
            } else if (protoBlock.staticLabels.length > 0) {
                label = protoBlock.staticLabels[0];
                if (label === "") {
                    if (blkname === "loadFile") {
                        label = _("open file");
                    } else {
                        label = blkname;
                    }
                }
            } else {
                label = blkname;
            }
        }

        if (["do",
             "nameddo",
             "namedbox",
             "namedcalc",
             "doArg",
             "calcArg",
             "nameddoArg",
             "namedcalcArg"].indexOf(protoBlock.name) != -1 && label != null) {
            if (getTextWidth(label, "bold 20pt Sans") > TEXTWIDTH) {
                label = label.substr(0, STRINGLEN) + "...";
            }
        }

        // Don't display the label on image blocks.
        if (protoBlock.image) {
            label = "";
        }

        let saveScale = protoBlock.scale;
        protoBlock.scale = DEFAULTBLOCKSCALE;

        // Finally, the SVGs!
        let svg;
        let artwork;
        let docks;
        let height;
        switch (protoBlock.name) {
        case "namedbox":
        case "namedarg":
            // so the label will fit
            svg = new SVG();
            svg.init();
            svg.setScale(protoBlock.scale);
            svg.setExpand(60, 0, 0, 0);
            svg.setOutie(true);
            artwork = svg.basicBox();
            docks = svg.docks;
            height = svg.getHeight();
            break;
        case "nameddo":
            // so the label will fit
            svg = new SVG();
            svg.init();
            svg.setScale(protoBlock.scale);
            svg.setExpand(60, 0, 0, 0);
            artwork = svg.basicBlock();
            docks = svg.docks;
            height = svg.getHeight();
            break;
        default:
            let obj = protoBlock.generator();
            artwork = obj[0];
            docks = obj[1];
            height = obj[3];
            break;
        }

        protoBlock.scale = saveScale;

        if (protoBlock.disabled) {
            artwork = artwork
                .replace(/fill_color/g, DISABLEDFILLCOLOR)
                .replace(/stroke_color/g, DISABLEDSTROKECOLOR)
                .replace("block_label", safeSVG(label));
        } else {
            artwork = artwork
                .replace(/fill_color/g,
                         PALETTEFILLCOLORS[protoBlock.palette.name])
                .replace(/stroke_color/g,
                         PALETTESTROKECOLORS[protoBlock.palette.name])
                .replace("block_label", safeSVG(label));
        }

        for (let i = 0; i <= protoBlock.args; i++) {
            artwork = artwork.replace("arg_label_" + i,
                                      protoBlock.staticLabels[i] || "");
        }

        return {
            blk,
            blkname,
            modname,
            height: STANDARDBLOCKHEIGHT,
            actualHeight: height,
            label,
            artwork,
            artwork64: "data:image/svg+xml;base64," +
                window.btoa(unescape(encodeURIComponent(artwork))),
            docks,
            image: block.image,
            scale: block.scale,
            palettename: this.palette.name,
            hidden: block.hidden
        };
    }
}

// Define objects for individual palettes.
function Palette(palettes, name) {
    this.palettes = palettes;
    this.name = name;
    this.model = new PaletteModel(this, palettes, name);
    this.visible = false;
    this.menuContainer = null;
    this.protoList = [];
    this.protoContainers = {};
    this.protoHeights = {};
    this.background = null;
    this.size = 0;
    this.columns = 0;
    this.draggingProtoBlock = false;
    this.mouseHandled = false;
    this.upButton = null;
    this.downButton = null;
    this.fadedUpButton = null;
    this.fadedDownButton = null;
    this.count = 0;

    this.hide = function() {
        this.hideMenu();
    };

    this.show = function() {
        this.showMenu(true);
    };

    this.hideMenu = function() {
        this._hideMenuItems();
    };

    this.showMenu = function(createHeader) {
        
        let palDiv = docById("palette");
        if (docById("PaletteBody"))
            palDiv.removeChild(docById("PaletteBody"));
        let x = document.createElement("table");
        x.setAttribute("id","PaletteBody")
        x.setAttribute("bgcolor","white");
        x.setAttribute("style","float: left");
        x.innerHTML= '<thead></thead><tbody style = "display: block; height: '+(window.innerHeight-this.palettes.top-this.palettes.cellSize-15)+'px; overflow: auto;" id ="PaletteBody_items" class="PalScrol"></tbody>'
        palDiv.appendChild(x)

        let buttonContainers = document.createDocumentFragment();
        let down = makePaletteIcons(DOWNICON,15,15);
        down.style.position = "relative";
        down.style.left = "-10px";
        down.style.top = (window.innerHeight-this.palettes.top-this.palettes.cellSize-20)+"px";
        buttonContainers.appendChild(down);

        this.menuContainer=x ;
        docById("PaletteBody_items").onscroll = () => {
            let list = docById("PaletteBody_items");
            if( list.scrollTop >= (list.scrollHeight - list.offsetHeight)){
                down.style.visibility = "hidden";
            } else {
                down.style.visibility = "visible";
            }
        }

        if (createHeader) {
            let header = this.menuContainer.children[0];
            header = header.insertRow();
            header.style.background = platformColor.selectorSelected;
            header.innerHTML='<td style ="width: 10px ;height: 42px"></td>';
            header = header.children[0];
            let closeImg = makePaletteIcons(
                CLOSEICON.replace("fill_color", platformColor.selectorSelected),
                this.palettes.cellSize,
                this.palettes.cellSize,
            );
            closeImg.onclick = () => {
                palDiv.removeChild(x);
            }
            let labelImg = makePaletteIcons(
                PALETTEICONS[name],
                this.palettes.cellSize,
                this.palettes.cellSize,
            );
            closeImg.onmouseover = (evt) => {
                document.body.style.cursor = "pointer";
            }
            closeImg.onmouseleave = (evt) => {
                document.body.style.cursor = "default";
            }
            header.appendChild(labelImg);

            let label = document.createElement("span");
            label.textContent = toTitleCase(_(this.name));
            header.appendChild(label);

            let closeDownImg = document.createElement("span");
            closeDownImg.appendChild(closeImg);
            closeDownImg.appendChild(buttonContainers) ;
            closeDownImg.style = "float: right;";

            header.appendChild(closeDownImg)
        }

        this._showMenuItems();
    };

    this._hideMenuItems = function() {
        if (this.name === "search" && this.palettes.hideSearchWidget !== null) {
            this.palettes.hideSearchWidget(true);
        }
        if (docById("PaletteBody"))
            docById("palette").removeChild(docById("PaletteBody"));        
    };

    this._showMenuItems = function() {

        this.model.update();
        let paletteList = docById("PaletteBody_items");
        let padding = paletteList.insertRow();
        padding.style.height = "7px";

        this.setupGrabScroll(paletteList);

        let blocks = this.model.blocks;
        blocks.reverse();
        let protoListScope = [...this.protoList] ;
        if (last(blocks).blkname != last(protoListScope).name)
            protoListScope.reverse();
        for (let blk in blocks) {
            let b = blocks[blk];

            if (b.hidden) {
                continue;
            }
            let itemRow = paletteList.insertRow();
            let itemCell = itemRow.insertCell();
            let right = itemRow.insertCell()
            right.innerHTML ="&emsp;&emsp;&emsp;"
            let that = this ;
            let img = makePaletteIcons(
                b.artwork
            );

            // Use artwork.js strings as images for:
            // cameraPALETTE, videoPALETTE, mediaPALETTE
            if (b.image){
                img = makePaletteIcons(eval(b.blkname+"PALETTE"));
            }

            img.onmouseover = (evt) => {
                document.body.style.cursor = "pointer";
            }

            img.onmouseleave = (evt) => {
                document.body.style.cursor = "default";
            }

            // Image Drag initiates a browser defined drag,
            // which needs to be stoped.
            img.ondragstart = function() {
                return false;
            };

            let down = function(event){
                // (1) prepare to moving: make absolute and on top by z-index
                let posit = img.style.position ; 
                let zInd = img.style.zIndex ; 
                img.style.position = 'absolute';
                img.style.zIndex = 1000;

                // move it out of any current parents directly into body
                // to make it positioned relative to the body
                document.body.appendChild(img);
                
                // centers the img at (pageX, pageY) coordinates
                moveAt = (pageX, pageY) => {
                    img.style.left = pageX - img.offsetWidth / 2 + 'px';
                    img.style.top = pageY - img.offsetHeight / 2 + 'px';
                }
                
                let onMouseMove = (e) => {
                    let x, y;
                    if (e.type === "touchmove"){
                        x = e.touches[0].clientX;
                        y = e.touches[0].clientY;
                    } else {
                        x = e.pageX;
                        y = e.pageY;
                    }
                    moveAt(x, y);
                }
                onMouseMove(event)
                
                document.addEventListener('touchmove', onMouseMove);
                document.addEventListener('mousemove', onMouseMove);
                
                let up = function (event) {
                    document.body.style.cursor = "default";
                    document.removeEventListener('mousemove', onMouseMove);
                    img.onmouseup = null;

                    let x, y;
                    x = parseInt (img.style.left);
                    y = parseInt (img.style.top);
                    
                    img.style.position = posit;
                    img.style.zIndex = zInd;
                    document.body.removeChild(img);
                    itemCell.appendChild(img);
                    
                    if (!x || !y) return;

                    that._makeBlockFromProtoblock(
                        protoListScope[blk],
                        true,
                        b.modname,
                        event,
                        x - that.palettes.blocksContainer.x,
                        y - that.palettes.blocksContainer.y
                    );
                };

                img.ontouchend = up;                  
                img.onmouseup = up;
            };

            img.ontouchstart = down;
            img.onmousedown = down;
                
            itemCell.setAttribute("style","width: "+img.width+"px ");
            itemCell.appendChild(img)
        }

        if (this.palettes.mobile) {
            this.hide();
        }

    };

    this.setupGrabScroll = (paletteList) => {
        let posY,top;
            
        let mouseUpGrab = (evt) => {        
            paletteList.onmousemove= null ;
            document.body.style.cursor = "default";
        };
        let mouseMoveGrab = (evt) => {
            let dy = evt.clientY - posY;
            paletteList.scrollTop = top - dy;
            document.body.style.cursor = "grabbing";
        };
        let mouseDownGrab = (evt) => {
            posY = evt.clientY
            top = paletteList.scrollTop;

            paletteList.onmousemove =  mouseMoveGrab;
            paletteList.onmouseup =  mouseUpGrab;
            paletteList.onmouseleave =  mouseUpGrab;
        };
        paletteList.onmousedown = mouseDownGrab;
    }

    this.getInfo = function() {
        let returnString = this.name + " palette:";
        for (let thisBlock in this.protoList) {
            returnString += " " + this.protoList[thisBlock].name;
        }
        return returnString;
    };

    this.remove = function(protoblock, name) {
        // Remove the protoblock and its associated artwork container.
        let i = this.protoList.indexOf(protoblock);
        if (i !== -1) {
            this.protoList.splice(i, 1);
        }

        for (let i = 0; i < this.model.blocks.length; i++) {
            if (["nameddo", "nameddoArg", "namedcalc", "namedcalcArg"].indexOf(
                    this.model.blocks[i].blkname) !== -1 &&
                this.model.blocks[i].modname === name) {
                this.model.blocks.splice(i, 1);
                break;
            } else if (
                ["storein"].indexOf(this.model.blocks[i].blkname) !== -1 &&
                this.model.blocks[i].modname === _("store in") + " " + name) {
                this.model.blocks.splice(i, 1);
                break;
            }
        }

    };

    this.add = function(protoblock, top) {
        // Add a new palette entry to the end of the list (default) or
        // to the top.
        if (this.protoList.indexOf(protoblock) === -1) {
            if (top)this.protoList.push(protoblock);
            else this.protoList.push(protoblock);
        }
        return this;
    };

    this.makeBlockFromSearch = function(protoblk, blkname, callback) {
        this._makeBlockFromPalette(protoblk, blkname, callback);
        this.palettes.hideSearchWidget();
    };

    this._makeBlockFromPalette = function(protoblk, blkname, callback) {
        if (protoblk === null) {
            console.debug("null protoblk?");
            return;
        }

        let newBlk;
        let arg;
        switch (protoblk.name) {
        case "do":
            blkname = "do " + protoblk.defaults[0];
            newBlk = protoblk.name;
            arg = protoblk.defaults[0];
            break;
        case "storein":
            // Use the name of the box in the label
            blkname = "store in " + protoblk.defaults[0];
            newBlk = protoblk.name;
            arg = protoblk.defaults[0];
            break;
        case "storein2":
            // Use the name of the box in the label
            console.debug("storein2" + " " + protoblk.defaults[0] + " " +
                          protoblk.staticLabels[0]);
            blkname = "store in2 " + protoblk.defaults[0];
            newBlk = protoblk.name;
            arg = protoblk.staticLabels[0];
            break;
        case "box":
            // Use the name of the box in the label
            blkname = protoblk.defaults[0];
            newBlk = protoblk.name;
            arg = protoblk.defaults[0];
            break;
        case "namedbox":
            // Use the name of the box in the label
            if (protoblk.defaults[0] === undefined) {
                blkname = "namedbox";
                arg = _("box");
            } else {
                console.debug(protoblk.defaults[0]);
                blkname = protoblk.defaults[0];
                arg = protoblk.defaults[0];
            }
            newBlk = protoblk.name;
            break;
        case "namedarg":
            // Use the name of the arg in the label
            if (protoblk.defaults[0] === undefined) {
                blkname = "namedarg";
                arg = "1";
            } else {
                blkname = protoblk.defaults[0];
                arg = protoblk.defaults[0];
            }
            newBlk = protoblk.name;
            break;
        case "nameddo":
            // Use the name of the action in the label
            if (protoblk.defaults[0] === undefined) {
                blkname = "nameddo";
                arg = _("action");
            } else {
                blkname = protoblk.defaults[0];
                arg = protoblk.defaults[0];
            }
            newBlk = protoblk.name;
            break;
        case "nameddoArg":
            // Use the name of the action in the label
            if (protoblk.defaults[0] === undefined) {
                blkname = "nameddoArg";
                arg = _("action");
            } else {
                blkname = protoblk.defaults[0];
                arg = protoblk.defaults[0];
            }
            newBlk = protoblk.name;
            break;
        case "namedcalc":
            // Use the name of the action in the label
            if (protoblk.defaults[0] === undefined) {
                blkname = "namedcalc";
                arg = _("action");
            } else {
                blkname = protoblk.defaults[0];
                arg = protoblk.defaults[0];
            }
            newBlk = protoblk.name;
            break;
        case "namedcalcArg":
            // Use the name of the action in the label
            if (protoblk.defaults[0] === undefined) {
                blkname = "namedcalcArg";
                arg = _("action");
            } else {
                blkname = protoblk.defaults[0];
                arg = protoblk.defaults[0];
            }
            newBlk = protoblk.name;
            break;
        case "outputtools":
            if (protoblk.defaults[0] === undefined) {
                blkname = "outputtools";
                arg = "letter class";
            } else {
                blkname = protoblk.defaults[0];
                arg = protoblk.defaults[0];
            }
            newBlk = protoblk.name;
            break;
        default:
            if (blkname === "nameddo") {
                arg = _("action");
            } else {
                arg = "__NOARG__";
            }

            newBlk = blkname;
            break;
        }

        let lastBlock = this.palettes.blocks.blockList.length;

        if (["namedbox",
             "nameddo",
             "namedcalc",
             "nameddoArg",
             "namedcalcArg"].indexOf(protoblk.name) === -1 &&
            blockIsMacro(blkname)) {
            this._makeBlockFromProtoblock(
                protoblk,
                true,
                blkname,
                null,
                100,
                100
            );
            callback(lastBlock);
        } else if (["namedbox",
                    "nameddo",
                    "namedcalc",
                    "nameddoArg",
                    "namedcalcArg"].indexOf(protoblk.name) === -1 &&
                   blkname in this.palettes.pluginMacros) {
            this._makeBlockFromProtoblock(
                protoblk,
                true,
                blkname,
                null,
                100,
                100
            );
            callback(lastBlock);
        } else {
            let newBlock = paletteBlockButtonPush(
                this.palettes.blocks,
                newBlk,
                arg
            );
            callback(newBlock);
        }
    };

    this._makeBlockFromProtoblock = function(
        protoblk, moved, blkname, event, saveX, saveY) {
        let that = this;
        let newBlock;

        function __myCallback(newBlock) {
            // Move the drag group under the cursor.
            that.palettes.blocks.findDragGroup(newBlock);
            for (let i in that.palettes.blocks.dragGroup) {
                that.palettes.blocks.moveBlockRelative(
                    that.palettes.blocks.dragGroup[i], saveX, saveY);
            }
            // Dock with other blocks if needed
            that.palettes.blocks.blockMoved(newBlock);
            that.palettes.blocks.checkBounds();
        }

        if (moved) {
            moved = false;
            this.draggingProtoBlock = false;

            let macroExpansion = null;
            if (["namedbox",
                 "nameddo",
                 "namedcalc",
                 "nameddoArg",
                 "namedcalcArg"].indexOf(protoblk.name) === -1) {
                macroExpansion = getMacroExpansion(blkname, saveX, saveY);
                if (macroExpansion === null) {
                    // Maybe it is a plugin macro?
                    if (blkname in this.palettes.pluginMacros) {
                        macroExpansion = this.palettes.getPluginMacroExpansion(
                            blkname, saveX, saveY);
                    }
                }
            }

            if (macroExpansion !== null) {
                this.palettes.blocks.loadNewBlocks(macroExpansion);
                let thisBlock = this.palettes.blocks.blockList.length - 1;
                let topBlk = this.palettes.blocks.findTopBlock(thisBlock);
            } else if (this.name === "myblocks") {
                // If we are on the myblocks palette, it is a macro.
                let macroName = blkname.replace("macro_", "");

                // We need to copy the macro data so it is not overwritten.
                let obj = [];
                for (let b = 0; b < this.palettes.macroDict[macroName].length;
                     b++) {
                    let valueEntry = this.palettes.macroDict[macroName][b][1];
                    let newValue = [];
                    if (typeof valueEntry === "string") {
                        newValue = valueEntry;
                    } else if (typeof valueEntry[1] === "string") {
                        if (valueEntry[0] === "number") {
                            newValue = [valueEntry[0], Number(valueEntry[1])];
                        } else {
                            newValue = [valueEntry[0], valueEntry[1]];
                        }
                    } else if (typeof valueEntry[1] === "number") {
                        if (valueEntry[0] === "number") {
                            newValue = [valueEntry[0], valueEntry[1]];
                        } else {
                            newValue = [valueEntry[0],
                                        valueEntry[1].toString()];
                        }
                    } else {
                        if (valueEntry[0] === "number") {
                            newValue = [valueEntry[0],
                                Number(valueEntry[1]["value"])];
                        } else {
                            newValue = [valueEntry[0],
                                        {value: valueEntry[1]["value"]}];
                        }
                    }

                    newBlock = [
                        this.palettes.macroDict[macroName][b][0],
                        newValue,
                        this.palettes.macroDict[macroName][b][2],
                        this.palettes.macroDict[macroName][b][3],
                        this.palettes.macroDict[macroName][b][4]
                    ];
                    obj.push(newBlock);
                }

                // Set the position of the top block in the stack
                // before loading.
                obj[0][2] = saveX
                obj[0][3] = saveY
                this.palettes.blocks.loadNewBlocks(obj);

                // Ensure collapse state of new stack is set properly.
                let thisBlock = this.palettes.blocks.blockList.length - 1;
                let topBlk = this.palettes.blocks.findTopBlock(thisBlock);
                setTimeout(function() {
                    this.palettes.blocks.blockList[topBlk].collapseToggle();
                }, 500);
            } else {
                newBlock = this._makeBlockFromPalette(
                    protoblk, blkname, __myCallback);
            }
        }
    };

    return this;
}

async function initPalettes(palettes) {
    // Instantiate the palettes object on first load.

    for (let i = 0; i < BUILTINPALETTES.length; i++) {
        palettes.add(BUILTINPALETTES[i]);
    }

    palettes.init_selectors();
    palettes.makePalettes(0);
    console.debug("Time to show the palettes.");
    palettes.show();
}

const MODEUNSURE = 0;
const MODEDRAG = 1;
const MODESCROLL = 2;
const DECIDEDISTANCE = 20;

function makePaletteIcons(data,width,height)  {
    let img = new Image();
    img.src =
    "data:image/svg+xml;base64," +
    window.btoa(unescape(encodeURIComponent(data)));
    if (width)img.width=width;
    if (height)img.height=height;
    return img 
}
