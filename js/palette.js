// Copyright (c) 2014-18 Walter Bender
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

const PROTOBLOCKSCALE = 1.0;
const PALETTELEFTMARGIN = 10;
const PALETTE_SCALE_FACTOR = 0.5;
const PALETTE_WIDTH_FACTOR = 3;

function maxPaletteHeight(menuSize, scale) {
    // Palettes don't start at the top of the screen and the last
    // block in a palette cannot start at the bottom of the screen,
    // hence - 2 * menuSize.

    // var h = (windowHeight() * canvasPixelRatio()) / scale - (2 * menuSize);
    var h = windowHeight() / scale - (2 * menuSize);
    return h - (h % STANDARDBLOCKHEIGHT) + (STANDARDBLOCKHEIGHT / 2);
};


function paletteBlockButtonPush(blocks, name, arg) {
    var blk = blocks.makeBlock(name, arg);
    return blk;
};


// There are several components to the palette system:
//
// (1) A palette button (in the Palettes.buttons dictionary) is a
// button that envokes a palette; The buttons have artwork associated
// with them: a bitmap and a highlighted bitmap that is shown when the
// mouse is over the button. (The artwork is found in artwork.js.)
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


function Palettes () {
    this.canvas = null;
    this.blocks = null;
    this.refreshCanvas = null;
    this.stage = null;
    this.cellSize = null;
    this.paletteWidth = 55 * PALETTE_WIDTH_FACTOR;
    this.scrollDiff = 0;
    this.originalSize = 55;  // this is the original svg size
    this.trashcan = null;
    this.initial_x = 55 * PALETTE_WIDTH_FACTOR;
    this.initial_y = 55;
    this.firstTime = true;
    this.background = null;
    this.upIndicator = null;
    this.upIndicatorStatus = false;
    this.downIndicator = null;
    this.downIndicatorStatus = true;
    this.circles = {};
    // paletteText is used for the highlighted tooltip
    this.paletteText = new createjs.Text('', '20px Arial', '#ff7700');
    this.mouseOver = false;
    this.activePalette = null;
    this.paletteObject = null;
    this.paletteVisible = false;
    this.pluginsDeleteStatus = false;
    this.visible = true;
    this.scale = 1.0;
    this.mobile = false;
    this.current = DEFAULTPALETTE;
    this.x = null;
    this.y = null;
    this.container = null;
    this.showSearchWidget = null;
    this.hideSearchWidget = null;

    this.pluginMacros = {};  // some macros are defined in plugins

    if (sugarizerCompatibility.isInsideSugarizer()) {
        storage = sugarizerCompatibility.data;
    } else {
        storage = localStorage;
    }

    // The collection of palettes.
    this.dict = {};
    this.buttons = {};  // The toolbar button for each palette.
    this.labels = {};  // The label for each button.

    this.init = function () {
        this.halfCellSize = Math.floor(this.cellSize / 2);
        this.x = 0;
        this.y = this.cellSize / PALETTE_SCALE_FACTOR;

        this.container = new createjs.Container();
        this.container.snapToPixelEnabled = true;
        this.stage.addChild(this.container);
    };

    this.setCanvas = function (canvas) {
        this.canvas = canvas;
        return this;
    };

    this.setStage = function (stage) {
        this.stage = stage;
        return this;
    };

    this.setRefreshCanvas = function (refreshCanvas) {
        this.refreshCanvas = refreshCanvas;
        return this;
    };

    this.setTrashcan = function (trashcan) {
        this.trashcan = trashcan;
        return this;
    };

    this.setSize = function (size) {
        this.cellSize = Math.floor((size * PALETTE_SCALE_FACTOR) + 0.5);
        return this;
    };

    this.setMobile = function (mobile) {
        this.mobile = mobile;
        if (mobile) {
            this._hideMenus();
        }

        return this;
    };

    this.setScale = function (scale) {
        this.scale = scale;

        this._updateButtonMasks();

        for (var i in this.dict) {
            this.dict[i]._resizeEvent();
        }

        if (this.downIndicator != null) {
            this.downIndicator.y = (windowHeight() / scale) - 27;
        }

        return this;
    };

    // We need access to the macro dictionary because we load them.
    this.setMacroDictionary = function (obj) {
        this.macroDict = obj;

        return this;
    };

    this.setSearch = function (show, hide) {
        this.showSearchWidget = show;
        this.hideSearchWidget = hide;
        return this;
    }

    this.getSearchPos = function () {
        return [50 * PALETTE_SCALE_FACTOR, 55];
    };

    this.getPluginMacroExpansion = function (blkname, x, y) {
        console.log(this.pluginMacros[blkname]);
        var obj = this.pluginMacros[blkname];
        if (obj != null) {
            obj[0][2] = x;
            obj[0][3] = y;
        }

        return (obj);
    };

    this.menuScrollEvent = function (direction, scrollSpeed) {
        var keys = Object.keys(this.buttons);
        var diff = direction * scrollSpeed;
        // if (this.buttons[keys[0]].y + diff > this.cellSize && direction > 0) {
        if (this.buttons[keys[0]].y + diff > 55 && direction > 0) {
            this.upIndicator.visible = false;
            this.upIndicatorStatus = this.upIndicator.visible;
            this.refreshCanvas();
            return;
        } else {
            this.upIndicatorStatus = this.upIndicator.visible;
            this.upIndicator.visible = true;
        }

        // if (this.buttons[last(keys)].y + diff < windowHeight() / this.scale - this.cellSize && direction < 0) {
        if (this.buttons[last(keys)].y + diff < windowHeight() / this.scale - 55 && direction < 0) {
            this.downIndicator.visible = false;
            this.downIndicatorStatus = this.downIndicator.visible;
            this.refreshCanvas();
            return;
        } else {
            this.downIndicator.visible = true;
            this.downIndicatorStatus = this.downIndicator.visible;
        }

        this.scrollDiff += diff;

        for (var name in this.buttons) {
            this.buttons[name].y += diff;
            this.buttons[name].visible = true;
            this.labels[name].y += diff;
            this.labels[name].visible = true;
        }

        this._updateButtonMasks();
        this.refreshCanvas();
    };

    this._updateButtonMasks = function () {
        for (var name in this.buttons) {
            var s = new createjs.Shape();
            s.graphics.r(0, 0, this.cellSize, windowHeight() / this.scale);
            s.x = 0;
            s.y = this.cellSize / 2;
            this.buttons[name].mask = s;
        }
    };

    this.hidePaletteIconCircles = function () {
        // paletteText might not be defined yet.
        if (!sugarizerCompatibility.isInsideSugarizer()) {
            hidePaletteNameDisplay(this.paletteText, this.stage);
        }

        hideButtonHighlight(this.circles, this.stage);
    };

    this.getProtoNameAndPalette = function (name) {
        for (var b in this.blocks.protoBlockDict) {
            // Don't return deprecated blocks.
            if (name === this.blocks.protoBlockDict[b].staticLabels[0] && !this.blocks.protoBlockDict[b].hidden) {
                return [b, this.blocks.protoBlockDict[b].palette.name, this.blocks.protoBlockDict[b].name];
            }
        }

        return [null, null, null];
    };

    this.makePalettes = function (hide) {
        if (this.firstTime) {
            var shape = new createjs.Shape();
            shape.graphics.f('#a2c5d8').r(0, 0, this.paletteWidth, windowHeight()).ef();
            shape.width = this.paletteWidth;
            shape.height = windowHeight();
            this.stage.addChild(shape);
            this.background = shape;
        }

        function __processUpIcon(palettes, name, bitmap, args) {
            bitmap.scaleX = bitmap.scaleY = bitmap.scale = 0.4;
            palettes.stage.addChild(bitmap);
            bitmap.x = 55 * PALETTE_WIDTH_FACTOR - 55 * bitmap.scale;
            bitmap.y = 55;
            bitmap.visible = false;
            palettes.upIndicator = bitmap;

            palettes.upIndicator.on('click', function (event) {
                palettes.menuScrollEvent(1, 40);
                palettes.hidePaletteIconCircles();
            });
        };

        function __processDownIcon(palettes, name, bitmap, args) {
            bitmap.scaleX = bitmap.scaleY = bitmap.scale = 0.4;
            palettes.stage.addChild(bitmap);
            bitmap.x = 55 * PALETTE_WIDTH_FACTOR - 55 * bitmap.scale;
            bitmap.y = (windowHeight() / palettes.scale) - 27;

            bitmap.visible = true;
            palettes.downIndicator = bitmap;

            palettes.downIndicator.on('click', function (event) {
                palettes.menuScrollEvent(-1, 40);
                palettes.hidePaletteIconCircles();
            });
        };

        if (this.upIndicator == null && this.firstTime) {
            makePaletteBitmap(this, UPICON.replace('#000000', '#FFFFFF'), 'up', __processUpIcon, null);
        }

        if (this.downbIndicator == null && this.firstTime) {
            makePaletteBitmap(this, DOWNICON.replace('#000000', '#FFFFFF'), 'down', __processDownIcon, null);
        }

        this.firstTime = false;

        // Make an icon/button for each palette

        var that = this;

        function __processButtonIcon(palettes, name, bitmap, args) {
            that.buttons[name].addChild(bitmap);
            if (that.cellSize != that.originalSize) {
                bitmap.scaleX = that.cellSize / that.originalSize;
                bitmap.scaleY = that.cellSize / that.originalSize;
            }

            var hitArea = new createjs.Shape();
            hitArea.graphics.beginFill('#FFF').drawEllipse(0, 0, that.cellSize * PALETTE_WIDTH_FACTOR, that.cellSize);
            that.buttons[name].hitArea = hitArea;
            that.buttons[name].visible = false;

            that.dict[name].makeMenu(true);
            that.dict[name]._moveMenu(that.cellSize, that.cellSize);
            that.dict[name]._updateMenu(false);

            /*add tooltip for palette buttons*/
            that.labels[name] = new createjs.Text(toTitleCase(_(name)), '16px Arial', '#808080');
            var r = that.cellSize / 2;
            that.labels[name].x = that.buttons[name].x + 2.2 * r;
            that.labels[name].y = that.buttons[name].y + r / 2;
            that.stage.addChild(that.labels[name]);

            that._loadPaletteButtonHandler(name);
        };

        for (var name in this.dict) {
            if (name in this.buttons) {
                this.dict[name]._updateMenu(hide);
            } else {
                this.buttons[name] = new createjs.Container();
                this.buttons[name].snapToPixelEnabled = true;
                this.stage.addChild(this.buttons[name]);
                this.buttons[name].x = this.x;
                this.buttons[name].y = this.y + this.scrollDiff;
                this.y += this.cellSize;

                makePaletteBitmap(this, PALETTEICONS[name], name, __processButtonIcon, null);
            }
        }
    };

    this.showPalette = function (name) {
        if (this.mobile) {
            return;
        }

        if (name=='search' && this.showSearchWidget !== null) {
            for (var i in this.dict) {
                if (this.dict[i].visible) {
                    this.dict[i].hideMenu();
                    this.dict[i]._hideMenuItems();
                }
            }

            console.log('searching');
            this.dict[name].visible = true;
            this.showSearchWidget(true);
            return;
        }

        this.hideSearchWidget(true);

        for (var i in this.dict) {
            if (this.dict[i] === this.dict[name]) {
                this.dict[name]._resetLayout();
                this.dict[name].showMenu();
                this.dict[name]._showMenuItems();
            } else {
                if (this.dict[i].visible) {
                    this.dict[i].hideMenu();
                    this.dict[i]._hideMenuItems();
                }
            }
        }
    };

    this._showMenus = function () {
        // Show the menu buttons, but not the palettes.
        if (this.mobile) {
            return;
        }

        for (var name in this.buttons) {
            this.buttons[name].visible = true;
            if (name in this.labels) {
                this.labels[name].visible = true;
            }
        }

        if (this.background != null) {
            this.background.visible = true;
        }

        // If the palette indicators were visible, restore them.
        if (this.upIndicatorStatus) {
            this.upIndicator.visible = true;
        }

        if (this.downIndicatorStatus && this.downIndicator != null) {
            this.downIndicator.visible = true;
        }

        this.refreshCanvas();
    };

    this._hideMenus = function () {
        // Hide the menu buttons and the palettes themselves.
        for (var name in this.buttons) {
            this.buttons[name].visible = false;
            this.labels[name].visible = false;
        }

        for (var name in this.dict) {
            this.dict[name].hideMenu();
        }


        this.hideSearchWidget(true);

        if (this.upIndicator != null) {
            this.upIndicator.visible = false;
            this.downIndicator.visible = false;
            this.background.visible = false;
        }

        this.refreshCanvas();
    };

    this.getInfo = function () {
        for (var key in this.dict) {
            console.log(this.dict[key].getInfo());
        }
    };

    this.updatePalettes = function (showPalette) {
        if (showPalette != null) {
            this.makePalettes(false);
            var myPalettes = this;
            setTimeout(function () {
                myPalettes.dict[showPalette]._resetLayout();
                // Show the action palette after adding/deleting new
                // nameddo blocks.
                myPalettes.dict[showPalette].showMenu();
                myPalettes.dict[showPalette]._showMenuItems();
                myPalettes.refreshCanvas();
            }, 100);
        } else {
            this.makePalettes(true);
            this.refreshCanvas();
        }

        if (this.mobile) {
            var that = this;
            setTimeout(function () {
                that.hide();

                for (var i in that.dict) {
                    if (that.dict[i].visible) {
                        that.dict[i].hideMenu();
                        that.dict[i]._hideMenuItems();
                    }
                }
            }, 500);
        }
    };

    this.hide = function () {
        this._hideMenus();
        this.visible = false;
    };

    this.show = function () {
        if (this.mobile) {
            this._hideMenus();
            this.visible = false;
        } else {
            this._showMenus();
            this.visible = true;
        }
    };

    this.setBlocks = function (blocks) {
        this.blocks = blocks;
        return this;
    };

    this.add = function (name) {
        this.dict[name] = new Palette(this, name);
        return this;
    };

    this.remove = function (name) {
        if (!(name in this.buttons)) {
            console.log('Palette.remove: Cannot find palette ' + name);
            return;
        }

        this.buttons[name].removeAllChildren();
        this.labels[name].removeAllChildren();
        var btnKeys = Object.keys(this.dict);
        for (var btnKey = btnKeys.indexOf(name) + 1; btnKey < btnKeys.length; btnKey++) {
            this.buttons[btnKeys[btnKey]].y -= this.cellSize;
        }
        delete this.buttons[name];
        delete this.labels[name];
        delete this.dict[name];
        this.y -= this.cellSize;
        this.makePalettes(true);
    };

    this.bringToTop = function () {
        // Move all the palettes to the top layer of the stage
        for (var name in this.dict) {
            this.stage.removeChild(this.dict[name].menuContainer);
            this.stage.addChild(this.dict[name].menuContainer);
            for (var item in this.dict[name].protoContainers) {
                this.stage.removeChild(this.dict[name].protoContainers[item]);
                this.stage.addChild(this.dict[name].protoContainers[item]);
            }
            // console.log('in bring to top');
            // this.dict[name]._resetLayout();
        }
        this.refreshCanvas();
    };

    this.findPalette = function (x, y) {
        for (var name in this.dict) {
            var px = this.dict[name].menuContainer.x;
            var py = this.dict[name].menuContainer.y;
            var height = Math.min(maxPaletteHeight(this.cellSize, this.scale), this.dict[name].y);
            if (this.dict[name].menuContainer.visible && px < x &&
                x < px + MENUWIDTH && py < y && y < py + height) {
                return this.dict[name];
            }
        }
        return null;
    };

    // Palette Button event handlers
    this._loadPaletteButtonHandler = function (name) {
        var locked = false;
        var scrolling = false;
        var that = this;

        this.buttons[name].on('mousedown', function (event) {
            scrolling = true;
            var lastY = event.stageY;

            that.buttons[name].removeAllEventListeners('pressmove');
            that.buttons[name].on('pressmove', function (event) {
                if (!scrolling) {
                    return;
                }

                var diff = event.stageY - lastY;
                that.menuScrollEvent(diff, 10);
                lastY = event.stageY;
            });

            that.buttons[name].removeAllEventListeners('pressup');
            that.buttons[name].on('pressup', function (event) {
                scrolling = false;
            }, null, true);  // once = true
        });

        // A palette button opens or closes a palette.
        this.buttons[name].on('mouseover', function (event) {
            document.body.style.cursor = 'pointer';
            that.mouseOver = true;
            var r = that.cellSize / 2;
            that.circles = showButtonHighlight(that.buttons[name].x + r, that.buttons[name].y + r, r, event, that.scale, that.stage);

            /*add tooltip for palette buttons*/
            that.paletteText = new createjs.Text(toTitleCase(_(name)), '16px Arial', 'black');
            that.paletteText.x = that.buttons[name].x + 2.2 * r;
            that.paletteText.y = that.buttons[name].y + r / 2;
            that.stage.addChild(that.paletteText);
        });

        this.buttons[name].on('pressup', function (event) {
            document.body.style.cursor = 'default';
            that.mouseOver = false;
            if (!sugarizerCompatibility.isInsideSugarizer()) {
                hidePaletteNameDisplay(that.paletteText, that.stage);
            }

            hideButtonHighlight(that.circles, that.stage);
        });

        this.buttons[name].on('mouseout', function (event) {
            document.body.style.cursor = 'default';
            that.mouseOver = false;
            if (!sugarizerCompatibility.isInsideSugarizer()) {
                hidePaletteNameDisplay(that.paletteText, that.stage);
            }

            hideButtonHighlight(that.circles, that.stage);
        });

        this.buttons[name].on('click', function (event) {
            if (locked) {
                return;
            }
            locked = true;

            setTimeout(function () {
                locked = false;
            }, 500);

            that.dict[name]._moveMenu(that.initial_x, that.initial_y);
            
            if (!that.dict[name].visible) {
                that.showPalette(name);
            } else {
                that.dict[name].hide();
            }
            that.refreshCanvas();
        });
    };

    this.removeActionPrototype = function (actionName) {
        var blockRemoved = false;
        for (var blk = 0; blk < this.dict['action'].protoList.length; blk++) {
            var actionBlock = this.dict['action'].protoList[blk];
            if (['nameddo', 'namedcalc', 'nameddoArg', 'namedcalcArg'].indexOf(actionBlock.name) !== -1 && (actionBlock.defaults[0] === actionName)) {
                // Remove the palette protoList entry for this block.
                this.dict['action'].remove(actionBlock, actionName);

                // And remove it from the protoBlock dictionary.
                if (this.blocks.protoBlockDict['myDo_' + actionName]) {
                    // console.log('DELETING PROTOBLOCKS FOR ACTION ' + actionName);
                    delete this.blocks.protoBlockDict['myDo_' + actionName];
                } else if (this.blocks.protoBlockDict['myCalc_' + actionName]) {
                    // console.log('deleting protoblocks for action ' + actionName);
                    delete this.blocks.protoBlockDict['myCalc_' + actionName];
                } else if (this.blocks.protoBlockDict['myDoArg_' + actionName]) {
                    // console.log('deleting protoblocks for action ' + actionName);
                    delete this.blocks.protoBlockDict['myDoArg_' + actionName];
                } else if (this.blocks.protoBlockDict['myCalcArg_' + actionName]) {
                    // console.log('deleting protoblocks for action ' + actionName);
                    delete this.blocks.protoBlockDict['myCalcArg_' + actionName];
                }
                this.dict['action'].y = 0;
                blockRemoved = true;
                break;
            }
        }

        // Force an update if a block was removed.
        if (blockRemoved) {
            this.hide();
            this.updatePalettes('action');
            if (this.mobile) {
                this.hide();
            } else {
                this.show();
            }
        }
    };

    return this;
};


// Kind of a model, but it only keeps a list of SVGs
function PaletteModel(palette, palettes, name) {
    this.palette = palette;
    this.palettes = palettes;
    this.name = name;
    this.blocks = [];

    this.update = function () {
        this.blocks = [];
        for (var blk in this.palette.protoList) {
            var block = this.palette.protoList[blk];
            // Don't show hidden blocks on the menus
            if (block.hidden) {
                continue;
            }

            // Create a proto block for each palette entry.
            var blkname = block.name;
            var modname = blkname;

            switch (blkname) {
                // Use the name of the action in the label
            case 'storein':
                modname = 'store in ' + block.defaults[0];
                var arg = block.defaults[0];
                break;
            case 'storein2':
                modname = 'store in2 ' + block.staticLabels[0];
                var arg = block.staticLabels[0];
                break;
            case 'box':
                modname = block.defaults[0];
                var arg = block.defaults[0];
                break;
            case 'namedbox':
                if (block.defaults[0] === undefined) {
                    modname = 'namedbox';
                    var arg = _('box');
                } else {
                    modname = block.defaults[0];
                    var arg = block.defaults[0];
                }
                break;
            case 'namedarg':
                if (block.defaults[0] === undefined) {
                    modname = 'namedarg';
                    var arg = '1';
                } else {
                    modname = block.defaults[0];
                    var arg = block.defaults[0];
                }
                break;
            case 'nameddo':
                if (block.defaults[0] === undefined) {
                    modname = 'nameddo';
                    var arg = _('action');
                } else {
                    modname = block.defaults[0];
                    var arg = block.defaults[0];
                }
                break;
            case 'nameddoArg':
                if (block.defaults[0] === undefined) {
                    modname = 'nameddoArg';
                    var arg = _('action');
                } else {
                    modname = block.defaults[0];
                    var arg = block.defaults[0];
                }
                break;
            case 'namedcalc':
                if (block.defaults[0] === undefined) {
                    modname = 'namedcalc';
                    var arg = _('action');
                } else {
                    modname = block.defaults[0];
                    var arg = block.defaults[0];
                }
                break;
            case 'namedcalcArg':
                if (block.defaults[0] === undefined) {
                    modname = 'namedcalcArg';
                    var arg = _('action');
                } else {
                    modname = block.defaults[0];
                    var arg = block.defaults[0];
                }
                break;
            }

            var protoBlock = this.palettes.blocks.protoBlockDict[blkname];
            if (protoBlock == null) {
                console.log('Could not find block ' + blkname);
                continue;
            }

            var label = '';
            // console.log(protoBlock.name);
            switch (protoBlock.name) {
            case 'text':
                label = _('text');
                break;
            case 'drumname':
                label = _('drum');
                break;
            case 'solfege':
                label = i18nSolfege('sol');
                break;
            case 'eastindiansolfege':
                label = 'sargam';
                break;
            case 'modename':
                label = _('mode name');
                break;
            case 'invertmode':
                label = _('invert mode');
                break;
            case 'voicename':
                label = _('voice name');
                break;
            case 'temperamentname':
                //TRANS: https://en.wikipedia.org/wiki/Musical_temperament
                label = _('temperament');
                break;
            case 'accidentalname':
                //TRANS: accidental refers to sharps, flats, etc.
                label = _('accidental');
                break;
            case 'notename':
                label = 'G';
                break;
            case 'intervalname':
                label = _('interval name');
                break;
            case 'boolean':
                label = _('true');
                break;
            case 'number':
                label = NUMBERBLOCKDEFAULT.toString();
                break;
            case 'less':
            case 'greater':
            case 'equal':
                // Label should be inside _() when defined.
                label = protoBlock.staticLabels[0];
                break;
            case 'namedarg':
                label = 'arg ' +  arg;
                break;
            default:
                if (blkname != modname) {
                    // Override label for do, storein, box, and namedarg
                    if (blkname === 'storein'  && block.defaults[0] === _('box')) {
                        label = _('store in');
                    } else if (blkname === 'storein2') {
                        if (block.staticLabels[0] === _('store in box')) {
                            label = _('store in box');
                        } else {
                            label = _('store in') + ' ' + block.staticLabels[0];
                        }
                    } else {
                        label = block.defaults[0];
                    }
                } else if (protoBlock.staticLabels.length > 0) {
                    label = protoBlock.staticLabels[0];
                    if (label === '') {
                        if (blkname === 'loadFile') {
                            label = _('open file')
                        } else {
                            label = blkname;
                        }
                    }
                } else {
                    label = blkname;
                }
            }

            if (['do', 'nameddo', 'namedbox', 'namedcalc', 'doArg', 'calcArg', 'nameddoArg', 'namedcalcArg'].indexOf(protoBlock.name) != -1 && label != null) {
                if (getTextWidth(label, 'bold 20pt Sans') > TEXTWIDTH) {  
                    label = label.substr(0, STRINGLEN) + '...';
                }
            }

            // Don't display the label on image blocks.
            if (protoBlock.image) {
                label = '';
            }

            var saveScale = protoBlock.scale;
            protoBlock.scale = DEFAULTBLOCKSCALE;

            // Finally, the SVGs!
            switch (protoBlock.name) {
            case 'namedbox':
            case 'namedarg':
                // so the label will fit
                var svg = new SVG();
                svg.init();
                svg.setScale(protoBlock.scale);
                svg.setExpand(60, 0, 0, 0);
                svg.setOutie(true);
                var artwork = svg.basicBox();
                var docks = svg.docks;
                var height = svg.getHeight();
                break;
            case 'nameddo':
                // so the label will fit
                var svg = new SVG();
                svg.init();
                svg.setScale(protoBlock.scale);
                svg.setExpand(60, 0, 0, 0);
                var artwork = svg.basicBlock();
                var docks = svg.docks;
                var height = svg.getHeight();
                break;
            default:
                var obj = protoBlock.generator();
                var artwork = obj[0];
                var docks = obj[1];
                var height = obj[3];
                break;
            }

            protoBlock.scale = saveScale;

            if (protoBlock.disabled) {
                artwork = artwork
                    .replace(/fill_color/g, DISABLEDFILLCOLOR)
                    .replace(/stroke_color/g, DISABLEDSTROKECOLOR)
                    .replace('block_label', safeSVG(label));
            } else {
                artwork = artwork
                    .replace(/fill_color/g,
                         PALETTEFILLCOLORS[protoBlock.palette.name])
                    .replace(/stroke_color/g,
                         PALETTESTROKECOLORS[protoBlock.palette.name])
                    .replace('block_label', safeSVG(label));
            }

            for (var i = 0; i <= protoBlock.args; i++) {
                artwork = artwork.replace('arg_label_' + i, protoBlock.staticLabels[i] || '');
            }

            this.blocks.push({
                blk,
                blkname,
                modname,
                height: STANDARDBLOCKHEIGHT,
                actualHeight: height,
                label,
                artwork,
                artwork64: 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(artwork))),
                docks,
                image: block.image,
                scale: block.scale,
                palettename: this.palette.name
            });
        }
    };
};


function PopdownPalette(palettes) {
    this.palettes = palettes;
    this.models = {};

    for (var name in this.palettes.dict) {
        this.models[name] = new PaletteModel(this.palettes.dict[name],
                                             this.palettes, name);
    };

    this.update = function () {
        var html = '<div>' + _('Click to select a block.') + '</div><div class="back"><h2>' + _('back') + '</h2></div>';
        for (var name in this.models) {
            html += '<div class="palette">';
            var icon = PALETTEICONS[name].replace(/#f{3,6}/gi, PALETTEFILLCOLORS[name]);
            //.TRANS: popout: to detach as a separate window
            html += format('<h2 data-name="{n}"> \
                                {i}<span>{n}</span> \
                                <img class="hide-button" src="header-icons/hide.svg" \
                                     alt="{' + _('hide') + '}" \
                                     title="{' + _('hide') + '}" /> \
                                <img class="show-button" src="header-icons/show.svg" \
                                     alt="{' + _('show') + '}" \
                                     title="{' + _('show') + '}" /> \
                                <img class="popout-button" src="header-icons/popout.svg" \
                                     alt="{' + _('popout') + '}" \
                                     title="{' + _('popout') + '}" /> \
                            </h2>',
                           {i: icon, n: toTitleCase(_(name))});
            html += '<ul>';
            this.models[name].update();

            var blocks = this.models[name].blocks;
            if (BUILTINPALETTES.indexOf(name) > -1)
                blocks.reverse();

            for (var blk in blocks) {
                html += format('<li title="{label}" \
                                    data-blk="{blk}" \
                                    data-palettename="{palettename}" \
                                    data-modname="{modname}"> \
                                    <img src="{artwork64}" alt="{label}" /> \
                                </li>', blocks[blk]);
            }
            html += '</div>';
        }
        document.querySelector('#popdown-palette').innerHTML = html;

        var that = this;

        document.querySelector('#popdown-palette .back').addEventListener('click', function () {
            that.popup();
        });

        var eles = document.querySelectorAll('#popdown-palette > .palette');
        Array.prototype.forEach.call(eles, function (d) {
            d.querySelector('h2').addEventListener('click', function () {
                if (d.classList.contains('show')) {
                    d.classList.remove('show');
                } else {
                    d.classList.add('show');
                }
            });

            d.querySelector('.popout-button').addEventListener('click', function () {
                that.popup();
                that.palettes.showPalette(d.querySelector('h2').dataset.name);
            });
        });

        var eles = document.querySelectorAll('#popdown-palette li');
        Array.prototype.forEach.call(eles, function (e) {
            e.addEventListener('click', function (event) {
                that.popup();
                var palette = that.palettes.dict[e.dataset.palettename];
                var container = palette.protoContainers[e.dataset.modname];

                // console.log(e.dataset.blk + ' ' + e.dataset.modname);
                var newBlock = palette._makeBlockFromPalette(palette.protoList[e.dataset.blk], e.dataset.modname, function (newBlock) {
                    // Move the block and the drag group.
                    that.palettes.blocks._moveBlock(newBlock, 75 - that.palettes.blocks.stage.x, 75 - that.palettes.blocks.stage.y);
                    that.palettes.blocks.findDragGroup(newBlock);
                    for (var i in that.palettes.blocks.dragGroup) {
                        that.palettes.blocks.moveBlockRelative(that.palettes.blocks.dragGroup[i], 0, 0);

                    }
                });
            });
        });
    };

    this.popdown = function () {
        this.update();
        document.querySelector('#popdown-palette').classList.add('show');
    };

    this.popup = function () {
        document.querySelector('#popdown-palette').classList.remove('show');
    };
};

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
    this.scrollDiff = 0
    this.y = 0;
    this.size = 0;
    this.columns = 0;
    this.draggingProtoBlock = false;
    this.mouseHandled = false;
    this.upButton = null;
    this.downButton = null;
    this.fadedUpButton = null;
    this.fadedDownButton = null;
    this.count = 0;

    this.makeMenu = function (createHeader) {
        var that = this;

        function __processButtonIcon(palette, name, bitmap, args) {
            bitmap.scaleX = bitmap.scaleY = bitmap.scale = 0.6;
            that.menuContainer.addChild(bitmap);
            that.palettes.container.addChild(that.menuContainer);
        };

        function __processCloseIcon(palette, name, bitmap, args) {
            bitmap.scaleX = bitmap.scaleY = bitmap.scale = 0.5;
            that.menuContainer.addChild(bitmap);
            bitmap.x = paletteWidth - STANDARDBLOCKHEIGHT * 2 / 3;
            bitmap.y = 0;

            // Define the hit area for the entire header area; the
            // left half is for draggging, the right half is for the
            // close button.
            var hitArea = new createjs.Shape();
	    hitArea.graphics.beginFill('#FFF').drawEllipse(0, 0, paletteWidth, STANDARDBLOCKHEIGHT / 2);
            hitArea.x = 0;
            hitArea.y = 0;
            that.menuContainer.hitArea = hitArea;
            that.menuContainer.visible = false;

            if (!that.mouseHandled) {
                that._loadPaletteMenuHandler();
                that.mouseHandled = true;
            }
        };

        function __processUpIcon(palette, name, bitmap, args) {
            bitmap.scaleX = bitmap.scaleY = bitmap.scale = 0.7;
            that.palettes.stage.addChild(bitmap);
            bitmap.x = that.menuContainer.x + paletteWidth;
            bitmap.y = that.menuContainer.y + STANDARDBLOCKHEIGHT;
            __calculateHitArea(bitmap);
            var hitArea = new createjs.Shape();
            bitmap.visible = false;
            that.upButton = bitmap;

            that.upButton.on('click', function (event) {
                that.scrollEvent(STANDARDBLOCKHEIGHT, 10);
            });

        };

        function __processDownIcon(palette, name, bitmap, args) {
            bitmap.scaleX = bitmap.scaleY = bitmap.scale = 0.7;
            that.palettes.stage.addChild(bitmap);
            bitmap.x = that.menuContainer.x + paletteWidth;
            bitmap.y = that._getDownButtonY() - STANDARDBLOCKHEIGHT;
            __calculateHitArea(bitmap);
            that.downButton = bitmap;

            that.downButton.on('click', function (event) {
                that.scrollEvent(-STANDARDBLOCKHEIGHT, 10);
            });
        };

        function __makeFadedDownIcon(palette, name, bitmap, args) {
            bitmap.scaleX = bitmap.scaleY = bitmap.scale = 0.7;
            that.palettes.stage.addChild(bitmap);
            bitmap.x = that.menuContainer.x + paletteWidth;
            bitmap.y = that._getDownButtonY();
            __calculateHitArea(bitmap);
            that.fadedDownButton = bitmap;

            that.fadedDownButton.on('click', function (event) {
            });
        };

        function __makeFadedUpIcon(palette, name, bitmap, args) {
            bitmap.scaleX = bitmap.scaleY = bitmap.scale = 0.7;
            that.palettes.stage.addChild(bitmap);
            bitmap.x = that.menuContainer.x + paletteWidth;
            bitmap.y = that.menuContainer.y + STANDARDBLOCKHEIGHT;
            __calculateHitArea(bitmap);
            that.fadedUpButton = bitmap;

            that.fadedUpButton.on('click', function (event) {
            });
        };

        function __calculateHitArea(bitmap) {
            var hitArea = new createjs.Shape();
            hitArea.graphics.beginFill('#FFF').drawRect(0, 0, STANDARDBLOCKHEIGHT, STANDARDBLOCKHEIGHT);
            hitArea.x = 0;
            hitArea.y = 0;
            bitmap.hitArea = hitArea;
            bitmap.visible = false;
        };

        function __processHeader(palette, name, bitmap, args) {
            that.menuContainer.addChild(bitmap);

            makePaletteBitmap(palette, DOWNICON, name, __processDownIcon, null);
            makePaletteBitmap(palette, FADEDDOWNICON, name, __makeFadedDownIcon, null);
            makePaletteBitmap(palette, FADEDUPICON, name, __makeFadedUpIcon, null);
            makePaletteBitmap(palette, UPICON, name, __processUpIcon, null);
            makePaletteBitmap(palette, CLOSEICON, name, __processCloseIcon, null);
            makePaletteBitmap(palette, PALETTEICONS[name], name, __processButtonIcon, null);
        };

        if (this.menuContainer == null) {
            this.menuContainer = new createjs.Container();
            this.menuContainer.snapToPixelEnabled = true;
        }

        if (!createHeader) {
            return;
        }

        var paletteWidth = MENUWIDTH + this._getOverflowWidth();
        this.menuContainer.removeAllChildren();

        // Create the menu button
        makePaletteBitmap(this, PALETTEHEADER.replace('fill_color', '#282828').replace('palette_label', toTitleCase(_(this.name))).replace(/header_width/g, paletteWidth), this.name, __processHeader, null);
    };

    this._getDownButtonY = function () {
        var h = maxPaletteHeight(this.palettes.cellSize, this.palettes.scale);
        return h + STANDARDBLOCKHEIGHT / 2;
    };

    this._resizeEvent = function () {
        this.hide();
        this._updateBackground();
        this._updateBlockMasks();

        if (this.downButton !== null) {
            this.downButton.y = this._getDownButtonY();
            this.fadedDownButton.y = this.downButton.y;
        }
    };

    this._updateBlockMasks = function () {
        var h = Math.min(maxPaletteHeight(this.palettes.cellSize, this.palettes.scale), this.y);
        var w = MENUWIDTH + this._getOverflowWidth();
        for (var i in this.protoContainers) {
            var s = new createjs.Shape();
            s.graphics.r(0, 0, w, h);
            s.x = this.background.x;
            s.y = this.background.y;
            this.protoContainers[i].mask = s;
        }
    };

    this._getOverflowWidth = function() {
        var maxWidth = 0;
        for(var i in this.protoList) {
            maxWidth = Math.max(maxWidth, this.protoList[i].textWidth);
        }
        return (maxWidth  > 100 ? maxWidth - 30 : 0);
    }

    this._updateBackground = function () {
        if (this.menuContainer == null) {
            return;
        }

        if (this.background !== null) {
            this.background.removeAllChildren();
        } else {
            this.background = new createjs.Container();
            this.background.snapToPixelEnabled = true;
            this.background.visible = false;
            this.palettes.stage.addChild(this.background);
            this._setupBackgroundEvents();
        }

        // Since we don't always add items at the end, the dependency
        // on this.y is unrelable. Easy workaround is just to always
        // extend the palette to the bottom.

        // var h = Math.min(maxPaletteHeight(this.palettes.cellSize, this.palettes.scale), this.y);
        var h = maxPaletteHeight(this.palettes.cellSize, this.palettes.scale);

        var shape = new createjs.Shape();
        shape.graphics.f('#949494').r(0, 0, MENUWIDTH + this._getOverflowWidth(), h).ef();
        shape.width = MENUWIDTH + this._getOverflowWidth();
        shape.height = h;
        this.background.addChild(shape);

        this.background.x = this.menuContainer.x;
        this.background.y = this.menuContainer.y + STANDARDBLOCKHEIGHT / 2;
    };

    this._resetLayout = function () {
        // Account for menu toolbar
        if (this.menuContainer == null) {
            console.log('menuContainer is null');
            return;
        }

        for (var i in this.protoContainers) {
            this.protoContainers[i].y -= this.scrollDiff;
        }

        this.y = this.menuContainer.y + 40;  // STANDARDBLOCKHEIGHT / 2;
        var items = [];
        var heights = [];
        // Reverse order
        for (var i in this.protoContainers) {
            items.push(this.protoContainers[i]);
            heights.push(this.protoHeights[i]);
        }

        var n = items.length;
        for (var j = 0; j < n; j++) {
            var i = items.pop();
            var h = heights.pop();
            i.x = this.menuContainer.x;
            if (h == undefined) {
                h = STANDARDBLOCKHEIGHT;
            }

            i.y = this.y;
            this.y += h + (STANDARDBLOCKHEIGHT * 0.1);
        }

        for (var i in this.protoContainers) {
            this.protoContainers[i].y += this.scrollDiff;
        }
    };

    this._updateMenu = function (hide) {
        var that = this;

        function __calculateBounds(palette, blk, modname, protoListBlk) {
            var bounds = that.protoContainers[modname].getBounds();
            that.protoContainers[modname].cache(bounds.x, bounds.y, Math.ceil(bounds.width), Math.ceil(bounds.height));

            var hitArea = new createjs.Shape();
            // Trim the hitArea height slightly to make it easier to
            // select single-height blocks below double-height blocks.
            hitArea.graphics.beginFill('#FFF').drawRect(0, 0, Math.ceil(bounds.width), Math.ceil(bounds.height * 0.75));
            that.protoContainers[modname].hitArea = hitArea;
            that._loadPaletteMenuItemHandler(protoListBlk, modname);
            that.palettes.refreshCanvas();

            for (var b in that.model.blocks) {
                if (that.model.blocks[b].modname === modname) {
                    if (that.protoHeights[modname] == undefined) {
                        // console.log('assigning height to ' + modname);
                        that.protoHeights[modname] = that.model.blocks[b].actualHeight;
                    }
                }
            }
        };

        function __processBitmap(palette, modname, bitmap, args) {
            var b = args[0];
            var blk = args[1];
            var protoListBlk = args[2];

            if (that.protoContainers[modname] == undefined) {
                console.log('no protoContainer for ' + modname);
                return;
            }

            that.protoContainers[modname].addChild(bitmap);
            bitmap.x = PALETTELEFTMARGIN;
            bitmap.y = 0;
            bitmap.scaleX = PROTOBLOCKSCALE;
            bitmap.scaleY = PROTOBLOCKSCALE;
            bitmap.scale = PROTOBLOCKSCALE;

            if (b.image) {
                var image = new Image();
                image.onload = function () {
                    var bitmap = new createjs.Bitmap(image);
                    if (image.width > image.height) {
                        bitmap.scaleX = bitmap.scaleY = bitmap.scale = MEDIASAFEAREA[2] / image.width * (b.scale / 2);
                    } else {
                        bitmap.scaleX = bitmap.scaleY = bitmap.scale = MEDIASAFEAREA[3] / image.height * (b.scale / 2);
                    }
                    that.protoContainers[modname].addChild(bitmap);
                    bitmap.x = Math.floor((MEDIASAFEAREA[0] * (b.scale / 2)) + 0.5);
                    
                    bitmap.y = Math.floor((MEDIASAFEAREA[1] * (b.scale / 2)) + 0.5);
                    __calculateBounds(palette, blk, modname, protoListBlk);
                };

                image.src = b.image;
            } else {
                __calculateBounds(palette, blk, modname, protoListBlk);
            }
        };

        function __processFiller(palette, modname, bitmap, args) {
            var b = args[0];
            makePaletteBitmap(palette, b.artwork, b.modname, __processBitmap, args);
        };

        if (this.menuContainer == null) {
            this.makeMenu(true);
        } else {
            // Hide the menu while we update.
            if (hide) {
                this.hide();
            } else if (this.palettes.mobile) {
                this.hide();
            }
        }

        this.y = 0;
        this.model.update();

        var blocks = this.model.blocks;
        if (BUILTINPALETTES.indexOf(name) == -1)
            blocks.reverse();

        for (var blk in blocks) {
            var b = blocks[blk];
            if (!this.protoContainers[b.modname]) {
                // create graphics for the palette entry for this block
                this.protoContainers[b.modname] = new createjs.Container();
                this.protoContainers[b.modname].snapToPixelEnabled = true;

                this.protoContainers[b.modname].x = Math.floor(this.menuContainer.x + 0.5);
                this.protoContainers[b.modname].y = Math.floor(this.menuContainer.y + this.y + this.scrollDiff + STANDARDBLOCKHEIGHT + 0.5);
                this.palettes.stage.addChild(this.protoContainers[b.modname]);
                this.protoContainers[b.modname].visible = false;

                this.size += Math.ceil(b.height * PROTOBLOCKSCALE);
                this.y += Math.ceil(b.height * PROTOBLOCKSCALE);
                this._updateBackground();

                // Since the protoList might change while this block
                // is being created, we cannot rely on blk to be the
                // proper index, so pass the entry itself as an
                // argument.
                makePaletteBitmap(this, PALETTEFILLER.replace(/filler_height/g, b.height.toString()), b.modname, __processFiller, [b, blk, this.protoList[blk]]);
            } else {
                this.protoContainers[b.modname].x = Math.floor(this.menuContainer.x + 0.5);
                this.protoContainers[b.modname].y = Math.floor(this.menuContainer.y + this.y + this.scrollDiff + STANDARDBLOCKHEIGHT + 0.5);
                this.protoHeights[b.modname] = b.actualHeight;
                this.y += Math.ceil(b.actualHeight * PROTOBLOCKSCALE);
            }
        }

        this.makeMenu(false);

        if (this.palettes.mobile) {
            this.hide();
        }
    };

    this._moveMenu = function (x, y) {
        // :sigh: race condition on iOS 7.1.2
        if (this.menuContainer === null) {
	    return;
	}

        var dx = x - this.menuContainer.x;
        var dy = y - this.menuContainer.y;
        this.menuContainer.x = x;
        this.menuContainer.y = y;
        this._moveMenuItemsRelative(dx, dy);
    };

    this._moveMenuRelative = function (dx, dy) {
        this.menuContainer.x += dx;
        this.menuContainer.y += dy;
        this._moveMenuItemsRelative(dx, dy);
    };

    this.hide = function () {
        this.hideMenu();
    };

    this.show = function () {
        if (this.palettes.mobile) {
            this.hideMenu();
        } else {
            this.showMenu();
        }

        for (var i in this.protoContainers) {
            this.protoContainers[i].visible = true;
        }
        this._updateBlockMasks();
        if (this.background !== null) {
            this.background.visible = true;
        }
    };

    this.hideMenu = function () {
        if (this.name === 'search' && this.palettes.hideSearchWidget !== null) {
            this.palettes.hideSearchWidget(true);
        }

        this.palettes.paletteVisible = false;
        if (this.menuContainer != null) {
            this.menuContainer.visible = false;
            this._hideMenuItems();
        }

        this.palettes.pluginsDeleteStatus = false;
        this._moveMenu(this.palettes.cellSize, this.palettes.cellSize);
    };

    this.showMenu = function () {
        this.palettes.paletteVisible = true;
        if (this.palettes.mobile) {
            this.menuContainer.visible = false;
        } else {
            this.menuContainer.visible = true;
        }

        if (BUILTINPALETTES.indexOf(this.name) === -1) {
            this.palettes.pluginsDeleteStatus = true;
            this.palettes.paletteObject = this;
        } else {
            this.palettes.pluginsDeleteStatus = false;
        }
    };

    this._hideMenuItems = function () {
        if (this.name === 'search' && this.palettes.hideSearchWidget !== null) {
            this.palettes.hideSearchWidget(true);
        }

        for (var i in this.protoContainers) {
            this.protoContainers[i].visible = false;
        }

        if (this.background !== null) {
            this.background.visible = false;
        }

        if (this.fadedDownButton != null) {
            this.upButton.visible = false;
            this.downButton.visible = false;
            this.fadedUpButton.visible = false;
            this.fadedDownButton.visible = false;
        }

        this.visible = false;
    };

    this._showMenuItems = function () {
        if (this.scrollDiff === 0) {
            this.count = 0;
        }

        for (var i in this.protoContainers) {
            this.protoContainers[i].visible = true;
        }

        this._updateBlockMasks();
        if (this.background !== null) {
            this.background.visible = true;
        }

        // Use scroll position to determine visibility
        this.scrollEvent(0, 10);
        this.visible = true;
    };

    this._moveMenuItems = function (x, y) {
        for (var i in this.protoContainers) {
            this.protoContainers[i].x = x;
            this.protoContainers[i].y = y;
        }

        if (this.background !== null) {
            this.background.x = x;
            this.background.y = y;
        }
    };

    this._moveMenuItemsRelative = function (dx, dy) {
        for (var i in this.protoContainers) {
            this.protoContainers[i].x += dx;
            this.protoContainers[i].y += dy;
        }

        if (this.background !== null) {
            this.background.x += dx;
            this.background.y += dy;
        }

        if (this.fadedDownButton !== null) {
            this.upButton.x += dx;
            this.upButton.y += dy;
            this.downButton.x += dx;
            this.downButton.y += dy;
            this.fadedUpButton.x += dx;
            this.fadedUpButton.y += dy;
            this.fadedDownButton.x += dx;
            this.fadedDownButton.y += dy;
        }
    };

    this.scrollEvent = function (direction, scrollSpeed) {
        var diff = direction * scrollSpeed;
        var h = Math.min(maxPaletteHeight(this.palettes.cellSize, this.palettes.scale), this.y);

        if (this.y < maxPaletteHeight(this.palettes.cellSize, this.palettes.scale)) {
            this.upButton.visible = false;
            this.downButton.visible = false;
            this.fadedUpButton.visible = false;
            this.fadedDownButton.visible = false;
            return;
        }

        if (this.scrollDiff + diff > 0 && direction > 0) {
            var dy = -this.scrollDiff;
            if (dy === 0) {
                this.downButton.visible = true;
                this.upButton.visible = false;
                this.fadedUpButton.visible = true;
                this.fadedDownButton.visible = false;
                return;
            }

            this.scrollDiff += dy;
            this.fadedDownButton.visible = false;
            this.downButton.visible = true;

            for (var i in this.protoContainers) {
                this.protoContainers[i].y += dy;
                this.protoContainers[i].visible = true;

                if (this.scrollDiff === 0) {
                    this.downButton.visible = true;
                    this.upButton.visible = false;
                    this.fadedUpButton.visible = true;
                    this.fadedDownButton.visible = false;
                }
            }
        } else if (this.y + this.scrollDiff + diff < h && direction < 0) {
            var dy = -this.y + h - this.scrollDiff;
            if (dy === 0) {
                this.upButton.visible = true;
                this.downButton.visible = false;
                this.fadedDownButton.visible = true;
                this.fadedUpButton.visible = false;
                return;
            }

            this.scrollDiff += -this.y + h - this.scrollDiff;
            this.fadedUpButton.visible = false;
            this.upButton.visible = true;

            for (var i in this.protoContainers) {
                this.protoContainers[i].y += dy;
                this.protoContainers[i].visible = true;
            }

            if(-this.y + h - this.scrollDiff === 0) {
                this.upButton.visible   = true;
                this.downButton.visible = false;
                this.fadedDownButton.visible = true;
                this.fadedUpButton.visible = false;
            }

        } else if (this.count === 0) {
            this.fadedUpButton.visible = true;
            this.fadedDownButton.visible = false;
            this.upButton.visible = false;
            this.downButton.visible = true;
        } else {
            this.scrollDiff += diff;
            this.fadedUpButton.visible = false;
            this.fadedDownButton.visible = false;
            this.upButton.visible = true;
            this.downButton.visible = true;

            for (var i in this.protoContainers) {
                this.protoContainers[i].y += diff;
                this.protoContainers[i].visible = true;
            }
        }

        this._updateBlockMasks();
        var stage = this.palettes.stage;
        stage.setChildIndex(this.menuContainer, stage.children.length - 1);
        this.palettes.refreshCanvas();
        this.count += 1;
    };

    this.getInfo = function () {
        var returnString = this.name + ' palette:';
        for (var thisBlock in this.protoList) {
            returnString += ' ' + this.protoList[thisBlock].name;
        }
        return returnString;
    };

    this.remove = function (protoblock, name) {
        // Remove the protoblock and its associated artwork container.
        var i = this.protoList.indexOf(protoblock);
        if (i !== -1) {
            this.protoList.splice(i, 1);
        }

        for (var i = 0; i < this.model.blocks.length; i++) {
            if (['nameddo', 'nameddoArg', 'namedcalc', 'namedcalcArg'].indexOf(this.model.blocks[i].blkname) !== -1 && this.model.blocks[i].modname === name) {
                this.model.blocks.splice(i, 1);
                break;
            } else if (['storein'].indexOf(this.model.blocks[i].blkname) !== -1 && this.model.blocks[i].modname === _('store in') + ' ' + name) {
                this.model.blocks.splice(i, 1);
                break;
            }
        }

        this.palettes.stage.removeChild(this.protoContainers[name]);
        delete this.protoContainers[name];
    };

    this.add = function (protoblock, top) {
        // Add a new palette entry to the end of the list (default) or
        // to the top.
        if (this.protoList.indexOf(protoblock) === -1) {
            if (top === undefined) {
                this.protoList.push(protoblock);
            } else {
                this.protoList.splice(0, 0, protoblock);
            }
        }
        return this;
    };

    this._setupBackgroundEvents = function () {
        var that = this;
        var scrolling = false;

        // Ensure we don't end up with duplicate event handlers.
        this.background.removeAllEventListeners('mouseover');
        this.background.removeAllEventListeners('mouseout');
        this.background.removeAllEventListeners('mousedown');

        this.background.on('mouseover', function (event) {
            that.palettes.activePalette = that;
        });

        this.background.on('mouseout', function (event) {
            that.palettes.activePalette = null;
        });

        this.background.on('mousedown', function (event) {
            scrolling = true;
            var lastY = event.stageY;

            that.background.removeAllEventListeners('pressmove');
            that.background.on('pressmove', function (event) {
                if (!scrolling) {
                    return;
                }

                var diff = event.stageY - lastY;
                that.scrollEvent(diff, 10);
                lastY = event.stageY;
            });

            that.background.removeAllEventListeners('pressup');
            that.background.on('pressup', function (event) {
                that.palettes.activePalette = null;
                scrolling = false;
            }, null, true);  // once = true
        });
    };

    // Palette Menu event handlers
    this._loadPaletteMenuHandler = function () {
        // The palette menu is the container for the protoblocks. One
        // palette per palette button.

        var that = this;
        var locked = false;
        var trashcan = this.palettes.trashcan;
        var paletteWidth = MENUWIDTH + this._getOverflowWidth();

        this.menuContainer.on('click', function (event) {
            if (Math.round(event.stageX / that.palettes.scale) > that.menuContainer.x + paletteWidth - STANDARDBLOCKHEIGHT) {
                that.hide();
                that.palettes.refreshCanvas();
                return;
            }

            if (locked) {
                return;
            }
            locked = true;
            setTimeout(function () {
                locked = false;
            }, 500);

            for (var p in that.palettes.dict) {
                if (that.name != p) {
                    if (that.palettes.dict[p].visible) {
                        that.palettes.dict[p]._hideMenuItems();
                    }
                }
            }

            if (that.visible) {
                that._hideMenuItems();
            } else {
                that._showMenuItems();
            }
            that.palettes.refreshCanvas();
        });

        this.menuContainer.on('mouseover', function(event) {
            document.body.style.cursor = 'pointer';
        });

        this.menuContainer.on('mouseout', function(event) {
            document.body.style.cursor = 'default';
        });

        this.menuContainer.on('mousedown', function (event) {
            // Move them all?
            var offset = {
                x: that.menuContainer.x - Math.round(event.stageX / that.palettes.scale),
                y: that.menuContainer.y - Math.round(event.stageY / that.palettes.scale)
            };

            that.menuContainer.removeAllEventListeners('pressmove');
            that.menuContainer.on('pressmove', function (event) {
                var oldX = that.menuContainer.x;
                var oldY = that.menuContainer.y;
                that.menuContainer.x = Math.round(event.stageX / that.palettes.scale) + offset.x;
                that.menuContainer.y = Math.round(event.stageY / that.palettes.scale) + offset.y;
                that.palettes.refreshCanvas();
                var dx = that.menuContainer.x - oldX;
                var dy = that.menuContainer.y - oldY;
                that.palettes.initial_x = that.menuContainer.x;
                that.palettes.initial_y = that.menuContainer.y;

                // Hide the menu items while drag.
                that._hideMenuItems();
                that._moveMenuItemsRelative(dx, dy);
            });
        });
    };

    // Menu Item event handlers
    this._loadPaletteMenuItemHandler = function (protoblk, blkname) {
        // A menu item is a protoblock that is used to create a new block.
        var that = this;
        var pressupLock = false;
        var pressed = false;
        var moved = false;
        var saveX = this.protoContainers[blkname].x;
        var saveY = this.protoContainers[blkname].y;
        var bgScrolling = false;

        this.protoContainers[blkname].on('mouseover', function (event) {
            document.body.style.cursor = 'pointer';
            that.palettes.activePalette = that;
        });

        this.protoContainers[blkname].on('mousedown', function (event) {
            var stage = that.palettes.stage;
            stage.setChildIndex(that.protoContainers[blkname], stage.children.length - 1);

            var h = Math.min(maxPaletteHeight(that.palettes.cellSize, that.palettes.scale), that.palettes.y);
            var clickY = event.stageY/that.palettes.scale;
            var paletteEndY = that.menuContainer.y + h + STANDARDBLOCKHEIGHT;

            // if(clickY < paletteEndY)
            that.protoContainers[blkname].mask = null;

            moved = false;
            pressed = true;
            saveX = that.protoContainers[blkname].x;
            saveY = that.protoContainers[blkname].y - that.scrollDiff;
            var startX = event.stageX;
            var startY = event.stageY;
            var lastY = event.stageY;

            if (that.draggingProtoBlock) {
                return;
            }

            var mode = window.hasMouse ? MODEDRAG : MODEUNSURE;

            that.protoContainers[blkname].removeAllEventListeners('pressmove');
            that.protoContainers[blkname].on('pressmove', function (event) {
                if (mode === MODEDRAG) {
                    // if(clickY < paletteEndY)
                    moved = true;
                    that.draggingProtoBlock = true;
                    that.protoContainers[blkname].x = Math.round(event.stageX / that.palettes.scale) - PALETTELEFTMARGIN;
                    that.protoContainers[blkname].y = Math.round(event.stageY / that.palettes.scale);
                    that.palettes.refreshCanvas();
                    return;
                }

                if (mode === MODESCROLL) {
                    var diff = event.stageY - lastY;
                    that.scrollEvent(diff, 10);
                    lastY = event.stageY;
                    return;
                }

                var xd = Math.abs(event.stageX - startX);
                var yd = Math.abs(event.stageY - startY);
                var diff = Math.sqrt(xd * xd + yd * yd);
                if (mode === MODEUNSURE && diff > DECIDEDISTANCE) {
                    mode = yd > xd ? MODESCROLL : MODEDRAG;
                }
            });
        });

        this.protoContainers[blkname].on('mouseout', function (event) {
            // Catch case when pressup event is missed.
            // Put the protoblock back on the palette...
            document.body.style.cursor = 'default';
            that.palettes.activePalette = null;

            if (pressed && moved) {
                that._restoreProtoblock(blkname, saveX, saveY + that.scrollDiff);
                pressed = false;
                moved = false;
            }
        });

        this.protoContainers[blkname].on('pressup', function (event) {
            document.body.style.cursor = 'default';
            that.palettes.activePalette = null;

            if (pressupLock) {
                return;
            } else {
                pressupLock = true;
                setTimeout(function () {
                    pressupLock = false;
                }, 1000);
            }

            that._makeBlockFromProtoblock(protoblk, moved, blkname, event, saveX, saveY);
        });
    };

    this._restoreProtoblock = function (name, x, y) {
        // Return protoblock we've been dragging back to the palette.
        this.protoContainers[name].x = x;
        this.protoContainers[name].y = y;
        // console.log('restore ' + name);
        this._resetLayout();
    };

    this._promptPaletteDelete = function () {
        var msg = 'Do you want to remove all "%s" blocks from your project?'.replace('%s', this.name)
        if (!confirm(msg)) {
            return;
        }

        this.palettes.remove(this.name);

        delete pluginObjs['PALETTEHIGHLIGHTCOLORS'][this.name];
        delete pluginObjs['PALETTESTROKECOLORS'][this.name];
        delete pluginObjs['PALETTEFILLCOLORS'][this.name];
        delete pluginObjs['PALETTEPLUGINS'][this.name];

        if ('GLOBALS' in pluginObjs) {
            delete pluginObjs['GLOBALS'][this.name];
        }

        if ('IMAGES' in pluginObjs) {
            delete pluginObjs['IMAGES'][this.name];
        }

        if ('ONLOAD' in pluginObjs) {
            delete pluginObjs['ONLOAD'][this.name];
        }

        if ('ONSTART' in pluginObjs) {
            delete pluginObjs['ONSTART'][this.name];
        }

        if ('ONSTOP' in pluginObjs) {
            delete pluginObjs['ONSTOP'][this.name];
        }

        for (var i = 0; i < this.protoList.length; i++) {
            var name = this.protoList[i].name;
            delete pluginObjs['FLOWPLUGINS'][name];
            delete pluginObjs['ARGPLUGINS'][name];
            delete pluginObjs['BLOCKPLUGINS'][name];
        }

        // FIXME: We really only want to remove macros associated with
        // this palette.
        if ('MACROPLUGINS' in pluginObjs) {
            for (name in pluginObjs['MACROPLUGINS']) {
                      delete pluginObjs['MACROPLUGINS'][name];
            }
        }

        storage.plugins = preparePluginExports({});
        if (sugarizerCompatibility.isInsideSugarizer()) {
            sugarizerCompatibility.saveLocally();
        }

        this.menuContainer.visible = false;
        this._hideMenuItems();
    };

    this._promptMacrosDelete = function () {
        var msg = 'Do you want to remove all the stacks from your custom palette?';
        if (!confirm(msg)) {
            return;
        }

        for (var i = 0; i < this.protoList.length; i++) {
            var name = this.protoList[i].name;
            delete this.protoContainers[name];
            this.protoList.splice(i, 1);
        }

        this.palettes.updatePalettes('myblocks');
        storage.macros = prepareMacroExports(null, null, {});

        if (sugarizerCompatibility.isInsideSugarizer()) {
            sugarizerCompatibility.saveLocally();
        }
    };

    this.makeBlockFromSearch = function (protoblk, blkname, callback) {
        this._makeBlockFromPalette(protoblk, blkname, callback);
    };

    this._makeBlockFromPalette = function (protoblk, blkname, callback) {
        if (protoblk == null) {
            console.log('null protoblk?');
            return;
        }

        switch (protoblk.name) {
        case 'do':
            blkname = 'do ' + protoblk.defaults[0];
            var newBlk = protoblk.name;
            var arg = protoblk.defaults[0];
            break;
        case 'storein':
            // Use the name of the box in the label
            blkname = 'store in ' + protoblk.defaults[0];
            var newBlk = protoblk.name;
            var arg = protoblk.defaults[0];
            break;
        case 'storein2':
            // Use the name of the box in the label
            console.log('storein2' + ' ' + protoblk.defaults[0] + ' ' + protoblk.staticLabels[0]);
            blkname = 'store in2 ' + protoblk.defaults[0];
            var newBlk = protoblk.name;
            var arg = protoblk.staticLabels[0];
            break;
        case 'box':
            // Use the name of the box in the label
            blkname = protoblk.defaults[0];
            var newBlk = protoblk.name;
            var arg = protoblk.defaults[0];
            break;
        case 'namedbox':
            // Use the name of the box in the label
            if (protoblk.defaults[0] === undefined) {
                blkname = 'namedbox';
                var arg = _('box');
            } else {
                console.log(protoblk.defaults[0]);
                blkname = protoblk.defaults[0];
                var arg = protoblk.defaults[0];
            }
            var newBlk = protoblk.name;
            break;
        case 'namedarg':
            // Use the name of the arg in the label
            if (protoblk.defaults[0] === undefined) {
                blkname = 'namedarg';
                var arg = '1';
            } else {
                blkname = protoblk.defaults[0];
                var arg = protoblk.defaults[0];
            }
            var newBlk = protoblk.name;
            break;
        case 'nameddo':
            // Use the name of the action in the label
            if (protoblk.defaults[0] === undefined) {
                blkname = 'nameddo';
                var arg = _('action');
            } else {
                blkname = protoblk.defaults[0];
                var arg = protoblk.defaults[0];
            }
            var newBlk = protoblk.name;
            break;
        case 'nameddoArg':
            // Use the name of the action in the label
            if (protoblk.defaults[0] === undefined) {
                blkname = 'nameddoArg';
                var arg = _('action');
            } else {
                blkname = protoblk.defaults[0];
                var arg = protoblk.defaults[0];
            }
            var newBlk = protoblk.name;
            break;
        case 'namedcalc':
            // Use the name of the action in the label
            if (protoblk.defaults[0] === undefined) {
                blkname = 'namedcalc';
                var arg = _('action');
            } else {
                blkname = protoblk.defaults[0];
                var arg = protoblk.defaults[0];
            }
            var newBlk = protoblk.name;
            break;
        case 'namedcalcArg':
            // Use the name of the action in the label
            if (protoblk.defaults[0] === undefined) {
                blkname = 'namedcalcArg';
                var arg = _('action');
            } else {
                blkname = protoblk.defaults[0];
                var arg = protoblk.defaults[0];
            }
            var newBlk = protoblk.name;
            break;
        default:
            var newBlk = blkname;
            var arg = '__NOARG__';
            break;
        }

        var lastBlock = this.palettes.blocks.blockList.length;

        if (['namedbox', 'nameddo', 'namedcalc', 'nameddoArg', 'namedcalcArg'].indexOf(protoblk.name) === -1 && blockIsMacro(blkname)) {
            moved = true;
            saveX = this.protoContainers[blkname].x;
            saveY = this.protoContainers[blkname].y;
            this._makeBlockFromProtoblock(protoblk, moved, blkname, null, saveX, saveY);
            callback(lastBlock);
        } else if (['namedbox', 'nameddo', 'namedcalc', 'nameddoArg', 'namedcalcArg'].indexOf(protoblk.name) === -1 && blkname in this.palettes.pluginMacros) {
            moved = true;
            saveX = this.protoContainers[blkname].x;
            saveY = this.protoContainers[blkname].y;
            this._makeBlockFromProtoblock(protoblk, moved, blkname, null, saveX, saveY);
            callback(lastBlock);

        } else {
            var newBlock = paletteBlockButtonPush(this.palettes.blocks, newBlk, arg);
            callback(newBlock);
        }
    };

    this.cleanup = function () {
        this._resetLayout();
        this._updateBlockMasks();
        this.palettes.refreshCanvas();
    };

    this._makeBlockFromProtoblock = function (protoblk, moved, blkname, event, saveX, saveY) {
        var that = this;

        function __myCallback (newBlock) {
            // Move the drag group under the cursor.
            that.palettes.blocks.findDragGroup(newBlock);
            for (var i in that.palettes.blocks.dragGroup) {
		that.palettes.blocks.moveBlockRelative(that.palettes.blocks.dragGroup[i], Math.round(event.stageX / that.palettes.scale) - that.palettes.blocks.stage.x, Math.round(event.stageY / that.palettes.scale) - that.palettes.blocks.stage.y);
            }
            // Dock with other blocks if needed
            that.palettes.blocks.blockMoved(newBlock);
            that.palettes.blocks.checkBounds();
        };

        if (moved) {
            moved = false;
            this.draggingProtoBlock = false;

            var macroExpansion = null;
            if (['namedbox', 'nameddo', 'namedcalc', 'nameddoArg', 'namedcalcArg'].indexOf(protoblk.name) === -1) {
                var macroExpansion = getMacroExpansion(blkname, this.protoContainers[blkname].x - this.palettes.blocks.stage.x, this.protoContainers[blkname].y - this.palettes.blocks.stage.y);
                if (macroExpansion === null) {
                    // Maybe it is a plugin macro?
                    if (blkname in this.palettes.pluginMacros) {
                        var macroExpansion = this.palettes.getPluginMacroExpansion(blkname, this.protoContainers[blkname].x - this.palettes.blocks.stage.x, this.protoContainers[blkname].y - this.palettes.blocks.stage.y);
                    }
                }
            }

            if (macroExpansion != null) {
                this.palettes.blocks.loadNewBlocks(macroExpansion);
                var thisBlock = this.palettes.blocks.blockList.length - 1;
                var topBlk = this.palettes.blocks.findTopBlock(thisBlock);
            } else if (this.name === 'myblocks') {
                // If we are on the myblocks palette, it is a macro.
                var macroName = blkname.replace('macro_', '');

                // We need to copy the macro data so it is not overwritten.
                var obj = [];
                for (var b = 0; b < this.palettes.macroDict[macroName].length; b++) {
                    var valueEntry = this.palettes.macroDict[macroName][b][1];
                    var newValue = [];
                    if (typeof(valueEntry) === 'string') {
                        newValue = valueEntry;
                    } else if (typeof(valueEntry[1]) === 'string') {
                        if (valueEntry[0] === 'number') {
                            newValue = [valueEntry[0], Number(valueEntry[1])];
                        } else {
                            newValue = [valueEntry[0], valueEntry[1]];
                        }
                    } else if (typeof(valueEntry[1]) === 'number') {
                        if (valueEntry[0] === 'number') {
                            newValue = [valueEntry[0], valueEntry[1]];
                        } else {
                            newValue = [valueEntry[0], valueEntry[1].toString()];
                        }
                    } else {
                        if (valueEntry[0] === 'number') {
                            newValue = [valueEntry[0], Number(valueEntry[1]['value'])];
                        } else {
                            newValue = [valueEntry[0], {'value': valueEntry[1]['value']}];
                        }
                    }

                    var newBlock = [this.palettes.macroDict[macroName][b][0],
                                    newValue,
                                    this.palettes.macroDict[macroName][b][2],
                                    this.palettes.macroDict[macroName][b][3],
                                    this.palettes.macroDict[macroName][b][4]];
                    obj.push(newBlock);
                }

                // Set the position of the top block in the stack
                // before loading.
                obj[0][2] = this.protoContainers[blkname].x - this.palettes.blocks.stage.x;
                obj[0][3] = this.protoContainers[blkname].y - this.palettes.blocks.stage.y;
                this.palettes.blocks.loadNewBlocks(obj);

                // Ensure collapse state of new stack is set properly.
                var thisBlock = this.palettes.blocks.blockList.length - 1;
                var topBlk = this.palettes.blocks.findTopBlock(thisBlock);
                setTimeout(function () {
                    this.palettes.blocks.blockList[topBlk].collapseToggle();
                }, 500);
            } else {
                var newBlock = this._makeBlockFromPalette(protoblk, blkname, __myCallback, newBlock);
            }

            // Put the protoblock back on the palette...
            this.cleanup();
        }
    };

    return this;
};

function initPalettes (palettes) {
    // Instantiate the palettes object on first load.

    for (var i = 0; i < BUILTINPALETTES.length; i++) {
        palettes.add(BUILTINPALETTES[i]);
    }

    palettes.makePalettes(true);

    // Give the palettes time to load.
    // We are in no hurry since we are waiting on the splash screen.
    setTimeout(function () {
        palettes.show();
        palettes.bringToTop();
    }, 6000);
};


const MODEUNSURE = 0;
const MODEDRAG = 1;
const MODESCROLL = 2;
const DECIDEDISTANCE = 20;


function makePaletteBitmap(palette, data, name, callback, extras) {
    // Async creation of bitmap from SVG data
    // Works with Chrome, Safari, Firefox (untested on IE)
    var img = new Image();
    img.onload = function () {
        var bitmap = new createjs.Bitmap(img);
        callback(palette, name, bitmap, extras);
    };

    img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(data)));
};
