// Copyright (c) 2014-21 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
   global

   _, docById, LEADING, DEFAULTPALETTE, MULTIPALETTES, platformColor,
   PALETTEICONS, MULTIPALETTEICONS, SKIPPALETTES, toTitleCase,
   i18nSolfege, NUMBERBLOCKDEFAULT, TEXTWIDTH, STRINGLEN,
   DEFAULTBLOCKSCALE, SVG, DISABLEDFILLCOLOR, DISABLEDSTROKECOLOR,
   PALETTEFILLCOLORS, PALETTESTROKECOLORS, last, getTextWidth,
   STANDARDBLOCKHEIGHT, CLOSEICON, BUILTINPALETTES,
   safeSVG, blockIsMacro, getMacroExpansion
*/

/* exported Palettes, initPalettes */

// All things related to palettes

const PALETTE_SCALE_FACTOR = 0.5;
const PALETTE_WIDTH_FACTOR = 3;

const paletteBlockButtonPush = (blocks, name, arg) => {
    const blk = blocks.makeBlock(name, arg);
    return blk;
};

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

const makePaletteIcons = (data, width, height) => {
    const img = new Image();
    img.src = "data:image/svg+xml;base64," + window.btoa(base64Encode(data));
    if (width) img.width = width;
    if (height) img.height = height;
    return img;
};

class Palettes {
    constructor(activity) {
        this.activity = activity;
        // this.blocks = null;
        this.cellSize = Math.floor(this.activity.cellSize * PALETTE_SCALE_FACTOR + 0.5);
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

        this.pluginMacros = {}; // some macros are defined in plugins

        // The collection of palettes.
        this.dict = {};
        this.selectorButtonsOff = []; // Select between palettes
        this.selectorButtonsOn = []; // Select between palettes in their on state
        this.buttons = {}; // The toolbar button for each palette.
        this.labels = {}; // The label for each button.
        this.pluginPalettes = []; // List of palettes not in multipalette list
    }

    init() {
        this.halfCellSize = Math.floor(this.cellSize / 2);
    }

    init_selectors() {
        for (let i = 0; i < MULTIPALETTES.length; i++) {
            this._makeSelectorButton(i);
        }
    }

    deltaY(dy) {
        // Cache DOM element reference to avoid multiple lookups and forced reflow
        const palette = document.getElementById("palette");
        const curr = parseInt(palette.style.top);
        palette.style.top = curr + dy + "px";
    }

    _makeSelectorButton(i) {
        if (!document.getElementById("palette")) {
            const element = document.createElement("div");
            element.id = "palette";
            element.setAttribute("class", "disable_highlighting");
            element.classList.add("flex-palette");
            element.setAttribute(
                "style",
                "position: absolute; z-index: 1000; left :0px; top:" + this.top + "px"
            );
            element.innerHTML = `<div style="height:fit-content">
                    <table width="${1.5 * this.cellSize}" bgcolor="white">
                        <thead>
                            <tr></tr>
                        </thead>
                    </table>
                    <table width ="${4.5 * this.cellSize}" bgcolor="white">
                        <thead>
                            <tr>
                                <td style= "width:28px"></td>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>`;
            element.childNodes[0].style.border = `1px solid ${platformColor.selectorSelected}`;
            document.body.appendChild(element);
        }

        const tr = docById("palette").children[0].children[0].children[0].children[0];
        const td = tr.insertCell();
        td.width = 1.5 * this.cellSize;
        td.height = 1.5 * this.cellSize;
        td.style.position = "relative";
        td.style.backgroundColor = platformColor.paletteBackground;
        td.appendChild(
            makePaletteIcons(
                PALETTEICONS[MULTIPALETTEICONS[i]]
                    .replace("background_fill_color", platformColor.paletteLabelBackground)
                    .replace(/stroke_color/g, platformColor.strokeColor)
                    .replace(/fill_color/g, platformColor.fillColor),
                1.5 * this.cellSize,
                1.5 * this.cellSize
            )
        );
        const cover = document.createElement("div");
        cover.style.position = "absolute";
        cover.style.zIndex = "10";
        cover.style.top = "0";
        cover.style.width = "100%";
        cover.style.height = "1px";
        cover.style.background = platformColor.paletteLabelBackground;
        td.appendChild(cover);
        td.onmouseover = () => {
            this.showSelection(i, tr);
            this.makePalettes(i);
        };
    }

    showSelection(i, tr) {
        //selector menu design.
        for (let j = 0; j < MULTIPALETTES.length; j++) {
            let img;
            if (j === i) {
                img = makePaletteIcons(
                    PALETTEICONS[MULTIPALETTEICONS[j]]
                        .replace("background_fill_color", platformColor.paletteLabelSelected)
                        .replace(/stroke_color/g, platformColor.strokeColor)
                        .replace(/fill_color/g, platformColor.fillColor),
                    this.cellSize,
                    this.cellSize
                );
                tr.children[j].children[1].style.background = platformColor.paletteLabelSelected;
            } else {
                img = makePaletteIcons(
                    PALETTEICONS[MULTIPALETTEICONS[j]]
                        .replace("background_fill_color", platformColor.paletteLabelBackground)
                        .replace(/stroke_color/g, platformColor.strokeColor)
                        .replace(/fill_color/g, platformColor.fillColor),
                    this.cellSize,
                    this.cellSize
                );
                tr.children[j].children[1].style.background = platformColor.paletteLabelBackground;
            }
            tr.children[j].children[0].src = img.src;
        }
    }

    setSize(size) {
        this.cellSize = Math.floor(size * PALETTE_SCALE_FACTOR + 0.5);
        return this;
    }

    setMobile(mobile) {
        this.mobile = mobile;
        if (mobile) {
            this._hideMenus();
        }

        return this;
    }

    setSearch(show, hide) {
        this.activity.showSearchWidget = show;
        this.activity.hideSearchWidget = hide;
        return this;
    }

    getSearchPos() {
        return [this.cellSize, this.top + this.cellSize * 1.75];
    }

    getPluginMacroExpansion(blkname, x, y) {
        const obj = this.pluginMacros[blkname];
        if (obj != null) {
            obj[0][2] = x;
            obj[0][3] = y;
        }

        return obj;
    }

    countProtoBlocks(name) {
        // How many protoblocks are in palette name?
        let n = 0;
        for (const b in this.activity.blocks.protoBlockDict) {
            if (
                this.activity.blocks.protoBlockDict[b].palette !== null &&
                this.activity.blocks.protoBlockDict[b].palette.name === name
            ) {
                n += 1;
            }
        }

        return n;
    }

    getProtoNameAndPalette(name) {
        for (const b in this.activity.blocks.protoBlockDict) {
            // Don't return deprecated blocks.
            if (
                name === this.activity.blocks.protoBlockDict[b].name &&
                !this.activity.blocks.protoBlockDict[b].hidden
            ) {
                return [
                    b,
                    this.activity.blocks.protoBlockDict[b].palette.name,
                    this.activity.blocks.protoBlockDict[b].name
                ];
            } else if (name === b && !this.activity.blocks.protoBlockDict[b].hidden) {
                return [
                    b,
                    this.activity.blocks.protoBlockDict[b].palette.name,
                    this.activity.blocks.protoBlockDict[b].name
                ];
            }
        }

        return [null, null, null];
    }

    makePalettes(i) {
        const palette = docById("palette");
        let listBody = palette.children[0].children[1].children[1];
        listBody.parentNode.removeChild(listBody);
        listBody = palette.children[0].children[1].appendChild(document.createElement("tbody"));
        // Make an icon/button for each palette
        this.makeSearchButton(
            "search",
            makePaletteIcons(PALETTEICONS["search"], this.cellSize, this.cellSize),
            listBody
        );
        for (const name of MULTIPALETTES[i]) {
            if (this.activity.beginnerMode && SKIPPALETTES.includes(name)) {
                continue;
            }
            if (name === "myblocks") {
                if (this.countProtoBlocks("myblocks") === 0) continue;
            }
            this.makeButton(
                name,
                makePaletteIcons(PALETTEICONS[name], this.cellSize, this.cellSize),
                listBody
            );
        }
    }

    makeSearchButton(name, icon, listBody) {
        const row = listBody.insertRow(-1);
        const img = row.insertCell(-1);
        const label = row.insertCell(-1);
        img.appendChild(icon);
        img.style.padding = "4px";
        img.style.boxSizing = "content-box";
        img.style.width = `${this.cellSize}px`;
        img.style.height = `${this.cellSize}px`;
        label.textContent = toTitleCase(_(name));
        label.style.color = platformColor.paletteText;
        row.style.borderBottom = "1px solid #0CAFFF";
        label.style.fontSize = localStorage.kanaPreference === "kana" ? "12px" : "16px";
        label.style.padding = "4px";
        row.style.display = "flex";
        row.style.flexDirection = "row";
        row.style.alignItems = "center";
        row.style.width = "126px";
        row.style.backgroundColor = platformColor.paletteBackground;

        this._loadPaletteButtonHandler(name, row);
    }

    makeButton(name, icon, listBody) {
        const row = listBody.insertRow(-1);
        const img = row.insertCell(-1);
        const label = row.insertCell(-1);
        img.appendChild(icon);
        img.style.padding = "4px";
        img.style.boxSizing = "content-box";
        img.style.width = `${this.cellSize}px`;
        img.style.height = `${this.cellSize}px`;
        label.textContent = toTitleCase(_(name));
        label.style.color = platformColor.paletteText;
        label.style.fontSize = localStorage.kanaPreference === "kana" ? "12px" : "16px";
        label.style.padding = "4px";
        row.style.display = "flex";
        row.style.flexDirection = "row";
        row.style.alignItems = "center";
        row.style.width = "126px";
        row.style.backgroundColor = platformColor.paletteBackground;
        row.addEventListener("mouseover", () => {
            row.style.backgroundColor = platformColor.hoverColor;
        });
        row.addEventListener("mouseout", () => {
            row.style.backgroundColor = platformColor.paletteBackground;
        });

        this._loadPaletteButtonHandler(name, row);
    }

    showPalette(name) {
        if (this.mobile) {
            return;
        }
        // In order to open the search widget and palette menu simultaneously
        // this.activity.hideSearchWidget(true);
        this.dict[name].showMenu(true);
        this.activePalette = name; // used to delete plugins
    }

    _showMenus() {}

    _hideMenus() {
        // Hide the menu buttons and the palettes themselves.

        this.activity.hideSearchWidget(true);

        if (docById("PaletteBody"))
            docById("PaletteBody").parentNode.removeChild(docById("PaletteBody"));
    }

    getInfo() {
        for (const key in this.dict) {
            // eslint-disable-next-line no-console
            console.debug(this.dict[key].getInfo());
        }
    }

    updatePalettes(showPalette) {
        if (showPalette != null) {
            // Show the action palette after adding/deleting new
            // nameddo blocks.
            if (showPalette in this.dict) {
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
    }

    hide() {
        docById("palette").style.visibility = "hidden";
    }

    show() {
        docById("palette").style.visibility = "visible";
    }

    clear() {
        try {
            // First hide all palettes
            for (const name in this.dict) {
                if (this.dict.hasOwnProperty(name)) {
                    const palette = this.dict[name];
                    if (palette && typeof palette.hideMenu === "function") {
                        palette.hideMenu();
                    }
                }
            }

            // Remove the palette DOM element if it exists
            const paletteElement = docById("palette");
            if (paletteElement) {
                paletteElement.parentNode.removeChild(paletteElement);
            }

            // Clear the dictionary and reset state
            this.dict = {};
            this.visible = false;
            this.activePalette = null;
            this.paletteObject = null;

            // Recreate the palette using the original initialization code
            const element = document.createElement("div");
            element.id = "palette";
            element.setAttribute("class", "disable_highlighting");
            element.classList.add("flex-palette");
            element.setAttribute(
                "style",
                `position: fixed; z-index: 1000; left: 0px; top: ${
                    60 + this.top
                }px; overflow-y: auto;`
            );
            element.innerHTML = `<div style="height:fit-content">
                    <table width="${1.5 * this.cellSize}" bgcolor="white">
                        <thead>
                            <tr></tr>
                        </thead>
                    </table>
                    <table width="${4.5 * this.cellSize}" bgcolor="white">
                        <thead>
                            <tr>
                                <td style= "width:28px"></td>
                            </tr>
                        </thead>
                        <tbody>
                        </tbody>
                    </table>
                </div>`;
            element.childNodes[0].style.border = `1px solid ${platformColor.selectorSelected}`;
            document.body.appendChild(element);
        } catch (e) {
            console.error("Error clearing palettes:", e);
        }
    }

    setBlocks(blocks) {
        this.blocks = blocks;
        return this;
    }

    add(name) {
        // eslint-disable-next-line no-use-before-define
        this.dict[name] = new Palette(this, name);
        return this;
    }

    // Palette Button event handlers
    _loadPaletteButtonHandler(name, row) {
        let timeout;

        row.onmouseover = () => {
            if (name === "search") {
                document.body.style.cursor = "text";
            } else {
                document.body.style.cursor = "pointer";
                clearTimeout(timeout);
                timeout = setTimeout(() => this.showPalette(name), 400);
            }
        };

        row.onmouseout = () => clearTimeout(timeout);

        row.onclick = () => {
            if (name == "search") {
                this._hideMenus();
                this.activity.showSearchWidget();
            } else {
                this.showPalette(name);
            }
        };

        row.onmouseup = () => {
            document.body.style.cursor = "default";
        };

        row.onmouseleave = () => {
            document.body.style.cursor = "default";
        };
    }

    removeActionPrototype(actionName) {
        let blockRemoved = false;
        for (let blk = 0; blk < this.dict["action"].protoList.length; blk++) {
            const actionBlock = this.dict["action"].protoList[blk];
            if (
                ["nameddo", "namedcalc", "nameddoArg", "namedcalcArg"].indexOf(actionBlock.name) !==
                    -1 &&
                actionBlock.defaults[0] === actionName
            ) {
                // Remove the palette protoList entry for this block.
                this.dict["action"].remove(actionBlock, actionName);

                // And remove it from the protoBlock dictionary.
                if (this.activity.blocks.protoBlockDict["myDo_" + actionName]) {
                    delete this.activity.blocks.protoBlockDict["myDo_" + actionName];
                } else if (this.activity.blocks.protoBlockDict["myCalc_" + actionName]) {
                    delete this.activity.blocks.protoBlockDict["myCalc_" + actionName];
                } else if (this.activity.blocks.protoBlockDict["myDoArg_" + actionName]) {
                    delete this.activity.blocks.protoBlockDict["myDoArg_" + actionName];
                } else if (this.activity.blocks.protoBlockDict["myCalcArg_" + actionName]) {
                    delete this.activity.blocks.protoBlockDict["myCalcArg_" + actionName];
                }
                blockRemoved = true;
                break;
            }
        }

        // Force an update if a block was removed.
        if (blockRemoved) {
            this.updatePalettes("action");
        }
    }
}

// Kind of a model, but it only keeps a list of SVGs
class PaletteModel {
    constructor(palette, palettes, name) {
        this.palette = palette;
        this.palettes = palettes;
        this.activity = palettes.activity;
        this.name = name;
        this.blocks = [];
    }

    update() {
        this.blocks = [];
        for (const blk in this.palette.protoList) {
            const block = this.palette.protoList[blk];
            // Don't show hidden blocks on the menus
            // But we still make them.
            // if (block.hidden) {
            //     continue;
            // }

            // Create a proto block for each palette entry.
            this.blocks.push(this.makeBlockInfo(blk, block, block.name, block.name));
        }
    }

    makeBlockInfo(blk, block, blkname, modname) {
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

        const protoBlock = this.activity.blocks.protoBlockDict[blkname];

        if (protoBlock === null) {
            return;
        }

        let label = "";
        switch (protoBlock.name) {
            case "grid":
                label = _("Grid").toLowerCase();
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

        if (
            [
                "do",
                "nameddo",
                "namedbox",
                "namedcalc",
                "doArg",
                "calcArg",
                "nameddoArg",
                "namedcalcArg"
            ].indexOf(protoBlock.name) != -1 &&
            label != null
        ) {
            if (getTextWidth(label, "bold 20pt Sans") > TEXTWIDTH) {
                label = label.substr(0, STRINGLEN) + "...";
            }
        }

        // Don't display the label on image blocks.
        if (protoBlock.image) {
            label = "";
        }

        const saveScale = protoBlock.scale;
        protoBlock.scale = DEFAULTBLOCKSCALE;

        // Finally, the SVGs!
        let svg;
        let artwork;
        let docks;
        let height;
        switch (protoBlock.name) {
            case "namedbox":
            case "namedarg":
                // So the label will fit...
                svg = new SVG();
                svg.setScale(protoBlock.scale);
                svg.setExpand(60, 0, 0, 0);
                svg.setOutie(true);
                artwork = svg.basicBox();
                docks = svg.docks;
                height = svg.getHeight();
                break;
            case "nameddo":
                // So the label will fit...
                svg = new SVG();
                svg.setScale(protoBlock.scale);
                svg.setExpand(60, 0, 0, 0);
                artwork = svg.basicBlock();
                docks = svg.docks;
                height = svg.getHeight();
                break;
            default:
                // eslint-disable-next-line no-case-declarations
                const obj = protoBlock.generator();
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
                .replace(/fill_color/g, PALETTEFILLCOLORS[protoBlock.palette.name])
                .replace(/stroke_color/g, PALETTESTROKECOLORS[protoBlock.palette.name])
                .replace("block_label", safeSVG(label));
        }

        for (let i = 0; i <= protoBlock.args; i++) {
            artwork = artwork.replace("arg_label_" + i, protoBlock.staticLabels[i] || "");
        }

        return {
            blk,
            blkname,
            modname,
            height: STANDARDBLOCKHEIGHT,
            actualHeight: height,
            label,
            artwork,
            artwork64: "data:image/svg+xml;base64," + window.btoa(base64Encode(artwork)),
            docks,
            image: block.image,
            scale: block.scale,
            palettename: this.palette.name,
            hidden: block.hidden
        };
    }
}

// Define objects for individual palettes.
class Palette {
    constructor(palettes, name) {
        this.palettes = palettes;
        this.activity = palettes.activity;
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
        this._outsideClickListener = null;
    }

    hide() {
        this.hideMenu();
    }

    show() {
        this.showMenu(true);
    }

    hideMenu() {
        docById(
            "palette"
        ).childNodes[0].style.borderRight = `1px solid ${platformColor.selectorSelected}`;
        if (this._outsideClickListener) {
            document.removeEventListener("click", this._outsideClickListener);
            this._outsideClickListener = null;
        }
        this._hideMenuItems();
    }

    showMenu(createHeader) {
        const palDiv = docById("palette");
        palDiv.childNodes[0].style.borderRight = "0";
        if (docById("PaletteBody")) palDiv.removeChild(docById("PaletteBody"));
        const palBody = document.createElement("table");
        palBody.id = "PaletteBody";
        const palBodyHeight = window.innerHeight - this.palettes.top - this.palettes.cellSize - 26;

        // palBody.innerHTML = `<thead></thead><tbody style = "display: block; height: ${palBodyHeight}px; overflow: auto; overflow-x: hidden;" id="PaletteBody_items" class="PalScrol"></tbody>`;

        palBody.insertAdjacentHTML(
            "afterbegin",
            `<thead></thead><tbody style = "display: block;   width: 100% ; height:auto ; max-height: ${palBodyHeight}px;  overflow: auto; overflow-x: hidden;" id="PaletteBody_items" class="PalScrol"></tbody>`
        );

        palBody.style.minWidth = "180px";
        palBody.style.background = platformColor.paletteBackground;
        palBody.style.float = "left";

        palBody.style.border = `1px solid ${platformColor.selectorSelected}`;
        [palBody.childNodes[0], palBody.childNodes[1]].forEach(item => {
            item.style.boxSizing = "border-box";
            item.style.padding = "8px";
        });
        palDiv.appendChild(palBody);

        this.menuContainer = palBody;

        if (createHeader) {
            let header = this.menuContainer.children[0];
            header = header.insertRow();
            header.style.backgroundColor = platformColor.paletteLabelBackground;
            header.innerHTML =
                '<td style ="width: 100%; height: 42px; box-sizing: border-box; display: flex; flex-direction: row; align-items: center; justify-content: space-between;"></td>';
            header = header.children[0];
            header.style.padding = "8px";

            const labelImg = makePaletteIcons(
                PALETTEICONS[this.name],
                this.palettes.cellSize,
                this.palettes.cellSize
            );
            labelImg.style.borderRadius = "4px";
            labelImg.style.padding = "2px";
            labelImg.style.backgroundColor = platformColor.paletteBackground;
            header.appendChild(labelImg);

            const label = document.createElement("span");
            label.textContent = toTitleCase(_(this.name));
            label.style.fontWeight = "bold";
            label.style.color = platformColor.textColor;
            header.appendChild(label);

            const closeDownImg = document.createElement("span");
            closeDownImg.style.height = `${this.palettes.cellSize}px`;
            const closeImg = makePaletteIcons(
                CLOSEICON.replace("fill_color", platformColor.selectorSelected),
                this.palettes.cellSize,
                this.palettes.cellSize
            );
            closeImg.onclick = () => this.hideMenu();
            closeImg.onmouseover = () => (document.body.style.cursor = "pointer");
            closeImg.onmouseleave = () => (document.body.style.cursor = "default");
            closeDownImg.appendChild(closeImg);
            header.appendChild(closeDownImg);
        }

        this._showMenuItems();

        // Close palette menu on outside click
        // Remove any existing outside-click listener
        if (this._outsideClickListener) {
            document.removeEventListener("click", this._outsideClickListener);
            this._outsideClickListener = null;
        }

        this._outsideClickListener = event => {
            if (this.menuContainer && this.menuContainer.contains(event.target)) {
                return;
            }

            this.hideMenu();
            document.removeEventListener("click", this._outsideClickListener);
            this._outsideClickListener = null;
        };
        // Delay attachment to avoid capturing the opening click
        setTimeout(() => {
            document.addEventListener("click", this._outsideClickListener);
        }, 0);
    }

    _hideMenuItems() {
        if (this.name === "search" && this.activity.hideSearchWidget !== null) {
            this.activity.hideSearchWidget(true);
        }
        if (docById("PaletteBody")) docById("palette").removeChild(docById("PaletteBody"));
    }

    _showMenuItems() {
        this.model.update();
        const paletteList = docById("PaletteBody_items");

        const blocks = this.model.blocks;
        blocks.reverse();
        const protoListScope = [...this.protoList];
        if (last(blocks).blkname != last(protoListScope).name) protoListScope.reverse();
        for (const blk in blocks) {
            const b = blocks[blk];

            if (b.hidden) {
                continue;
            }
            const itemRow = paletteList.insertRow();
            const itemCell = itemRow.insertCell();
            let img = makePaletteIcons(b.artwork);

            if (b.image) {
                if (["media", "camera", "video"].includes(b.blkname)) {
                    // Use artwork.js strings as images for:
                    // cameraPALETTE, videoPALETTE, mediaPALETTE
                    img = makePaletteIcons(eval(b.blkname + "PALETTE"));
                } else {
                    // or use the plugin image...
                    img = makePaletteIcons(this.activity.pluginsImages[b.blkname]);
                }
            }

            img.onmouseover = () => (document.body.style.cursor = "pointer");
            img.onmouseleave = () => (document.body.style.cursor = "default");

            // Image Drag initiates a browser defined drag, which needs to be stopped.
            img.ondragstart = () => false;

            const down = event => {
                // (1) prepare to moving: make absolute and on top by z-index
                const posit = img.style.position;
                const zInd = img.style.zIndex;
                img.style.position = "absolute";
                img.style.zIndex = 1000;

                // move it out of any current parents directly into body
                // to make it positioned relative to the body
                document.body.appendChild(img);

                // centers the img at (pageX, pageY) coordinates
                const moveAt = (pageX, pageY) => {
                    img.style.left = pageX - img.offsetWidth / 2 + "px";
                    img.style.top = pageY - img.offsetHeight / 2 + "px";
                };

                const onMouseMove = e => {
                    e.preventDefault();
                    let x, y;
                    if (e.type === "touchmove") {
                        x = e.touches[0].clientX;
                        y = e.touches[0].clientY;
                    } else {
                        x = e.pageX;
                        y = e.pageY;
                    }
                    moveAt(x, y);
                };
                onMouseMove(event);

                document.addEventListener("touchmove", onMouseMove, { passive: false });
                document.addEventListener("mousemove", onMouseMove);

                const that = this;
                const up = event => {
                    document.body.style.cursor = "default";
                    document.removeEventListener("mousemove", onMouseMove);
                    document.removeEventListener("touchmove", onMouseMove);
                    img.onmouseup = null;
                    img.ontouchend = null;

                    const x = parseInt(img.style.left);
                    const y = parseInt(img.style.top);

                    img.style.position = posit;
                    img.style.zIndex = zInd;
                    document.body.removeChild(img);
                    itemCell.appendChild(img);

                    // if (!x || !y) return;

                    that._makeBlockFromProtoblock(
                        protoListScope[blk],
                        true,
                        b.modname,
                        event,
                        (x || that.activity.blocksContainer.x + 100) -
                            that.activity.blocksContainer.x,
                        (y || that.activity.blocksContainer.y + 100) -
                            that.activity.blocksContainer.y
                    );
                };

                img.ontouchend = up;
                img.onmouseup = up;
            };

            img.ontouchstart = down;
            img.onmousedown = down;

            itemCell.style.width = `${img.width}px`;
            itemCell.style.paddingRight = `${this.palettes.cellSize}px`;
            itemCell.appendChild(img);
        }

        if (this.palettes.mobile) {
            this.hide();
        }
    }

    setupGrabScroll(paletteList) {
        let posY, top;

        const mouseUpGrab = () => {
            // paletteList.onmousemove = null;
            document.body.style.cursor = "default";
        };

        const mouseMoveGrab = event => {
            const dy = event.clientY - posY;
            paletteList.scrollTop = top - dy;
            document.body.style.cursor = "grabbing";
        };

        const mouseDownGrab = event => {
            posY = event.clientY;
            top = paletteList.scrollTop;

            paletteList.onmousemove = mouseMoveGrab;
            paletteList.onmouseup = mouseUpGrab;
            paletteList.onmouseleave = mouseUpGrab;
        };

        paletteList.onmousedown = mouseDownGrab;
    }

    getInfo() {
        let returnString = this.name + " palette:";
        for (const thisBlock in this.protoList) {
            returnString += " " + this.protoList[thisBlock].name;
        }
        return returnString;
    }

    remove(protoblock, name) {
        // Remove the protoblock and its associated artwork container.
        const i = this.protoList.indexOf(protoblock);
        if (i !== -1) {
            this.protoList.splice(i, 1);
        }

        for (let i = 0; i < this.model.blocks.length; i++) {
            if (
                ["nameddo", "nameddoArg", "namedcalc", "namedcalcArg"].includes(
                    this.model.blocks[i].blkname
                ) &&
                this.model.blocks[i].modname === name
            ) {
                this.model.blocks.splice(i, 1);
                break;
            } else if (
                ["storein"].includes(this.model.blocks[i].blkname) &&
                this.model.blocks[i].modname === _("store in") + " " + name
            ) {
                this.model.blocks.splice(i, 1);
                break;
            }
        }
    }

    add(protoblock, top) {
        // Add a new palette entry to the end of the list (default) or
        // to the top.
        if (!this.protoList.includes(protoblock)) {
            if (top) this.protoList.push(protoblock);
            else this.protoList.push(protoblock);
        }
        return this;
    }

    makeBlockFromSearch(protoblk, blkname, callback) {
        this._makeBlockFromPalette(protoblk, blkname, callback);
        this.activity.hideSearchWidget();
    }

    _makeBlockFromPalette(protoblk, blkname, callback) {
        if (protoblk === null) {
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

        const lastBlock = this.activity.blocks.blockList.length;

        if (
            !["namedbox", "nameddo", "namedcalc", "nameddoArg", "namedcalcArg"].includes(
                protoblk.name
            ) &&
            blockIsMacro(this.activity, blkname)
        ) {
            this._makeBlockFromProtoblock(protoblk, true, blkname, null, 100, 100);
            callback(lastBlock);
        } else if (
            !["namedbox", "nameddo", "namedcalc", "nameddoArg", "namedcalcArg"].includes(
                protoblk.name
            ) &&
            blkname in this.palettes.pluginMacros
        ) {
            this._makeBlockFromProtoblock(protoblk, true, blkname, null, 100, 100);
            callback(lastBlock);
            return lastBlock;
        } else {
            const newBlock = paletteBlockButtonPush(this.activity.blocks, newBlk, arg);
            callback(newBlock);
            return newBlock;
        }
    }

    _makeBlockFromProtoblock(protoblk, moved, blkname, event, saveX, saveY) {
        let newBlock;
        const __myCallback = newBlock => {
            // Move the drag group under the cursor.
            this.activity.blocks.findDragGroup(newBlock);
            for (const i in this.activity.blocks.dragGroup) {
                this.activity.blocks.moveBlockRelative(
                    this.activity.blocks.dragGroup[i],
                    saveX,
                    saveY
                );
            }
            // Dock with other blocks if needed
            this.activity.blocks.blockMoved(newBlock);
            this.activity.blocks.checkBounds();
        };

        if (moved) {
            moved = false;
            this.draggingProtoBlock = false;

            let macroExpansion = null;

            if (protoblk.name === "status") {
                // Check if a status block already exists
                for (let blk = 0; blk < this.activity.blocks.blockList.length; blk++) {
                    const block = this.activity.blocks.blockList[blk];
                    if (block.name === "status" && !block.trash) {
                        return;
                    }
                }

                if (this.activity.logo.statusMatrix === null) {
                    this.activity.logo.statusMatrix = new StatusMatrix();
                }
                // Clear existing status fields
                if (this.activity.logo.statusFields) {
                    this.activity.logo.statusFields = [];
                }

                // Find all status variables in blockList and add them to status fields
                const statusVariables = [
                    "modelength",
                    "deltapitch2",
                    "deltapitch",
                    "currentkey",
                    "currentmode",
                    "x",
                    "y",
                    "grey",
                    "shade",
                    "pensize",
                    "color",
                    "elapsednotes",
                    "beatfactor",
                    "notevalue",
                    "beatvalue",
                    "measurevalue",
                    "bpmfactor",
                    "currentpitch"
                ];

                const foundVariables = [];
                const foundTypes = new Set();
                for (let blk = 0; blk < this.activity.blocks.blockList.length; blk++) {
                    const block = this.activity.blocks.blockList[blk];
                    if (!block.trash) {
                        for (const blockType of statusVariables) {
                            if (block.name === blockType && !foundTypes.has(blockType)) {
                                if (this.activity.logo.statusFields) {
                                    this.activity.logo.statusFields.push([blk, blockType]);
                                }
                                foundVariables.push([blk, blockType]);
                                foundTypes.add(blockType);
                                break;
                            }
                        }
                    }
                }

                // Find all box blocks and add them to status fields
                const boxBlocks = [];
                const boxNames = new Set();
                for (let blk = 0; blk < this.activity.blocks.blockList.length; blk++) {
                    const block = this.activity.blocks.blockList[blk];
                    if (
                        block.name === "namedbox" &&
                        !block.trash &&
                        block.overrideName &&
                        !boxNames.has(block.overrideName)
                    ) {
                        if (this.activity.logo.statusFields) {
                            this.activity.logo.statusFields.push([blk, "namedbox"]);
                        }
                        boxBlocks.push(blk);
                        boxNames.add(block.overrideName);
                    }
                }

                // Create base status block structure
                const statusBlocks = [
                    [0, "status", saveX, saveY, [null, 1, 2]],
                    [
                        1,
                        "hidden",
                        0,
                        0,
                        [0, foundVariables.length > 0 || boxBlocks.length > 0 ? 3 : null]
                    ],
                    [2, "hiddennoflow", 0, 0, [0, null]]
                ];

                // Add variables and boxes to status block
                let lastBlockIndex = 2;
                let lastConnection = 1; // Start from the hidden block

                // Add variables first
                for (let i = 0; i < foundVariables.length; i++) {
                    const [blockId, blockType] = foundVariables[i];
                    const block = activity.blocks.blockList[blockId];
                    const isLastVar = i === foundVariables.length - 1;
                    const hasBoxes = boxBlocks.length > 0;

                    statusBlocks.push([
                        lastBlockIndex + 1,
                        "print",
                        0,
                        0,
                        [
                            lastConnection,
                            lastBlockIndex + 2,
                            !isLastVar || hasBoxes ? lastBlockIndex + 3 : null
                        ]
                    ]);
                    lastConnection = lastBlockIndex + 1;

                    // Add variable value block
                    statusBlocks.push([
                        lastBlockIndex + 2,
                        [blockType, { value: block.value }],
                        0,
                        0,
                        [lastBlockIndex + 1]
                    ]);
                    lastBlockIndex += 2;
                }

                // Then add box blocks
                for (let i = 0; i < boxBlocks.length; i++) {
                    const boxBlockId = boxBlocks[i];
                    const boxBlock = activity.blocks.blockList[boxBlockId];

                    statusBlocks.push([
                        lastBlockIndex + 1,
                        "print",
                        0,
                        0,
                        [
                            lastConnection,
                            lastBlockIndex + 2,
                            i < boxBlocks.length - 1 ? lastBlockIndex + 3 : null
                        ]
                    ]);
                    lastConnection = lastBlockIndex + 1;

                    // Add box value block
                    statusBlocks.push([
                        lastBlockIndex + 2,
                        ["namedbox", { value: boxBlock.overrideName }],
                        0,
                        0,
                        [lastBlockIndex + 1]
                    ]);
                    lastBlockIndex += 2;
                }

                macroExpansion = statusBlocks;

                // Initialize the status matrix
                this.activity.logo.statusMatrix.init(this.activity);

                // Set up the status matrix to update periodically
                this.activity.logo.inStatusMatrix = false;

                // Update the status display
                this.activity.logo.statusMatrix.updateAll();
            } else if (
                !["namedbox", "nameddo", "namedcalc", "nameddoArg", "namedcalcArg"].includes(
                    protoblk.name
                )
            ) {
                macroExpansion = getMacroExpansion(this.activity, blkname, saveX, saveY);
                if (macroExpansion === null) {
                    // Maybe it is a plugin macro?
                    if (blkname in this.palettes.pluginMacros) {
                        macroExpansion = this.palettes.getPluginMacroExpansion(
                            blkname,
                            saveX,
                            saveY
                        );
                    }
                }
            }

            if (macroExpansion !== null) {
                this.activity.blocks.loadNewBlocks(macroExpansion);
                const thisBlock = this.activity.blocks.blockList.length - 1;
                const topBlk = this.activity.blocks.findTopBlock(thisBlock);
                // Ensure that the newly created block is not under
                // the palette.
                if (
                    this.activity.blocks.blockList[topBlk].container.x <
                    this.activity.palettes.paletteWidth * 2
                ) {
                    this.activity.blocks.moveBlock(
                        topBlk,
                        this.activity.palettes.paletteWidth * 2,
                        this.activity.blocks.blockList[topBlk].container.y
                    );
                }
            } else if (this.name === "myblocks") {
                // If we are on the myblocks palette, it is a macro.
                const macroName = blkname.replace("macro_", "");

                // We need to copy the macro data so it is not overwritten.
                const obj = [];
                for (let b = 0; b < this.activity.macroDict[macroName].length; b++) {
                    const valueEntry = this.activity.macroDict[macroName][b][1];
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
                            newValue = [valueEntry[0], valueEntry[1].toString()];
                        }
                    } else {
                        if (valueEntry[0] === "number") {
                            newValue = [valueEntry[0], Number(valueEntry[1]["value"])];
                        } else {
                            newValue = [valueEntry[0], { value: valueEntry[1]["value"] }];
                        }
                    }

                    newBlock = [
                        this.activity.macroDict[macroName][b][0],
                        newValue,
                        this.activity.macroDict[macroName][b][2],
                        this.activity.macroDict[macroName][b][3],
                        this.activity.macroDict[macroName][b][4]
                    ];
                    obj.push(newBlock);
                }

                // Set the position of the top block in the stack
                // before loading.
                obj[0][2] = saveX;
                obj[0][3] = saveY;
                this.activity.blocks.loadNewBlocks(obj);

                const thisBlock = this.activity.blocks.blockList.length - 1;
                const topBlk = this.activity.blocks.findTopBlock(thisBlock);
                // Ensure that the newly created block is not under
                // the palette.
                if (
                    this.activity.blocks.blockList[topBlk].container.x <
                    this.activity.palettes.paletteWidth * 2
                ) {
                    this.activity.blocks.moveBlock(
                        topBlk,
                        this.activity.palettes.paletteWidth * 2,
                        this.activity.blocks.blockList[topBlk].container.y
                    );
                }
                // Ensure collapse state of new stack is set properly.
                setTimeout(() => {
                    this.activity.blocks.blockList[topBlk].collapseToggle();
                }, 500);
            } else {
                newBlock = this._makeBlockFromPalette(protoblk, blkname, __myCallback);
                // Ensure that the newly created block is not under
                // the palette.
                if (
                    this.activity.blocks.blockList[newBlock].container.x <
                    this.activity.palettes.paletteWidth * 2
                ) {
                    this.activity.blocks.moveBlock(
                        newBlock,
                        this.activity.palettes.paletteWidth * 2,
                        this.activity.blocks.blockList[newBlock].container.y
                    );
                }
            }
        }
    }
}

const initPalettes = async palettes => {
    // Instantiate the palettes object on first load.

    for (let i = 0; i < BUILTINPALETTES.length; i++) {
        palettes.add(BUILTINPALETTES[i]);
    }

    palettes.init_selectors();
    palettes.makePalettes(0);

    palettes.show();
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = { Palettes, initPalettes };
}
