// Copyright (c) 2014-17 Walter Bender
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
require(['activity/utils']);

var paletteBlocks = null;

const PROTOBLOCKSCALE = 1.0;
const PALETTELEFTMARGIN = 10;


function maxPaletteHeight(menuSize, scale) {
    // Palettes don't start at the top of the screen and the last
    // block in a palette cannot start at the bottom of the screen,
    // hence - 2 * menuSize.

    var h = (windowHeight() * canvasPixelRatio()) / scale - (2 * menuSize);
    return h - (h % STANDARDBLOCKHEIGHT) + (STANDARDBLOCKHEIGHT / 2);
};


function paletteBlockButtonPush(name, arg) {
    var blk = paletteBlocks.makeBlock(name, arg);
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


function Palettes(canvas, refreshCanvas, stage, cellSize, refreshCanvas, trashcan) {
    this.canvas = canvas;
    this.refreshCanvas = refreshCanvas;
    this.stage = stage;
    this.cellSize = cellSize;
    this.halfCellSize = Math.floor(cellSize / 2);
    this.scrollDiff = 0;
    this.refreshCanvas = refreshCanvas;
    this.originalSize = 55;  // this is the original svg size
    this.trashcan = trashcan;
    this.initial_x = 55;
    this.initial_y = 55;
    this.firstTime = true;
    this.background = null;
    this.upIndicator = null;
    this.upIndicatorStatus = false;
    this.downIndicator = null;
    this.downIndicatorStatus = false;
    this.circles = {};
    this.mouseOver = false;
    this.activePalette = null;
    
    if (sugarizerCompatibility.isInsideSugarizer()) {
        storage = sugarizerCompatibility.data;
    } else {
        storage = localStorage;
    }

    // The collection of palettes.
    this.dict = {};
    this.buttons = {};  // The toolbar button for each palette.

    this.visible = true;
    this.scale = 1.0;
    this.x = 0;
    this.y = this.cellSize;

    this.current = DEFAULTPALETTE;

    this.container = new createjs.Container();
    this.container.snapToPixelEnabled = true;
    this.stage.addChild(this.container);

    this.mobile = false;

    this.setMobile = function(mobile) {
        this.mobile = mobile;
        if (mobile) {
            this._hideMenus();
        }
    };

    this.setScale = function(scale) {
        this.scale = scale;

        this._updateButtonMasks();

        for (var i in this.dict) {
            this.dict[i]._resizeEvent();
        }

        if (this.downIndicator != null) {
            this.downIndicator.y = (windowHeight() / scale) - 27;
        }
    };

    // We need access to the macro dictionary because we load them.
    this.setMacroDictionary = function(obj) {
        this.macroDict = obj;
    };

    this.menuScrollEvent = function(direction, scrollSpeed) {
        var keys = Object.keys(this.buttons);

        var diff = direction * scrollSpeed;
        if (this.buttons[keys[0]].y + diff > this.cellSize && direction > 0) {
            this.upIndicator.visible = false;
            this.upIndicatorStatus = this.upIndicator.visible;
            this.refreshCanvas();
            return;
        } else {
            this.upIndicatorStatus = this.upIndicator.visible;
            this.upIndicator.visible = true;
        }

        if (this.buttons[last(keys)].y + diff < windowHeight() / this.scale - this.cellSize && direction < 0) {
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
        }

        this._updateButtonMasks();
        this.refreshCanvas();
    };

    this._updateButtonMasks = function() {
        for (var name in this.buttons) {
            var s = new createjs.Shape();
            s.graphics.r(0, 0, this.cellSize, windowHeight() / this.scale);
            s.x = 0;
            s.y = this.cellSize / 2;
            this.buttons[name].mask = s;
        }
    };
     
    this.hidePaletteIconCircles = function(){
        hideButtonHighlight(this.circles, this.stage);
    };

    this.makePalettes = function(hide) {
        if (this.firstTime) {
            var shape = new createjs.Shape();
            shape.graphics.f('#a2c5d8').r(0, 0, 55, windowHeight()).ef();
            shape.width = 55;
            shape.height = windowHeight();
            this.stage.addChild(shape);
            this.background = shape;
	}

        function __processUpIcon(palettes, name, bitmap, args) {
            bitmap.scaleX = bitmap.scaleY = bitmap.scale = 0.4;
            palettes.stage.addChild(bitmap);
            bitmap.x = 55;
            bitmap.y = 55;
            bitmap.visible = false;
            palettes.upIndicator = bitmap;
		
	    palettes.upIndicator.on('click', function(event) {
                palettes.menuScrollEvent(1, 40);
                palettes.hidePaletteIconCircles();
            });
        };

        function __processDownIcon(palettes, name, bitmap, args) {
            bitmap.scaleX = bitmap.scaleY = bitmap.scale = 0.4;
            palettes.stage.addChild(bitmap);
            bitmap.x = 55;
            bitmap.y = (windowHeight() / palettes.scale) - 27;

	    bitmap.visible = true;
            palettes.downIndicator = bitmap;
		
	    palettes.downIndicator.on('click', function(event) {
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

        var palettes = this;

        function __processButtonIcon(palettes, name, bitmap, args) {
            palettes.buttons[name].addChild(bitmap);
            if (palettes.cellSize != palettes.originalSize) {
                bitmap.scaleX = palettes.cellSize / palettes.originalSize;
                bitmap.scaleY = palettes.cellSize / palettes.originalSize;
            }

            var hitArea = new createjs.Shape();
            hitArea.graphics.beginFill('#FFF').drawEllipse(-palettes.halfCellSize, -palettes.halfCellSize, palettes.cellSize, palettes.cellSize);
            hitArea.x = palettes.halfCellSize;
            hitArea.y = palettes.halfCellSize;
            palettes.buttons[name].hitArea = hitArea;
            palettes.buttons[name].visible = false;

            palettes.dict[name].makeMenu(true);
            palettes.dict[name]._moveMenu(palettes.cellSize, palettes.cellSize);
            palettes.dict[name]._updateMenu(false);
            palettes._loadPaletteButtonHandler(name);
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

        for (var i in this.dict) {
            if (this.dict[i] === this.dict[name]) {
                this.dict[name]._resetLayout();
                this.dict[name].showMenu(true);
                this.dict[name]._showMenuItems(true);
            } else {
                if (this.dict[i].visible) {
                    this.dict[i].hideMenu(true);
                    this.dict[i]._hideMenuItems(false);
                }
            }
        }
    };

    this._showMenus = function() {
        // Show the menu buttons, but not the palettes.
        if (this.mobile) {
            return;
        }

        for (var name in this.buttons) {
            this.buttons[name].visible = true;
        }

        if (this.background != null) {
            this.background.visible = true;
	}

        // If the palette indicators were visible, restore them.
        if (this.upIndicatorStatus) {
            this.upIndicator.visible = true;
        }

        if (this.downIndicatorStatus) {
            this.downIndicator.visible = true;
	}

        this.refreshCanvas();
    };

    this._hideMenus = function() {
        // Hide the menu buttons and the palettes themselves.
        for (var name in this.buttons) {
            this.buttons[name].visible = false;
        }

        for (var name in this.dict) {
            this.dict[name].hideMenu(true);
        }

        if (this.upIndicator != null) {
            this.upIndicator.visible = false;
            this.downIndicator.visible = false;
            this.background.visible = false;
        }

        this.refreshCanvas();
    };

    this.getInfo = function() {
        for (var key in this.dict) {
            console.log(this.dict[key].getInfo());
        }
    };

    this.updatePalettes = function(showPalette) {
        if (showPalette != null) {
            this.makePalettes(false);
            var myPalettes = this;
            setTimeout(function() {
                myPalettes.dict[showPalette]._resetLayout();
                // Show the action palette after adding/deleting new nameddo blocks.
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
            setTimeout(function() {
                that.hide();

                for (var i in that.dict) {
                    if (that.dict[i].visible) {
                        that.dict[i].hideMenu(true);
                        that.dict[i]._hideMenuItems(true);
                    }
                }
            }, 500);
        }
    };

    this.hide = function() {
        this._hideMenus();
        this.visible = false;
    };

    this.show = function() {
        if (this.mobile) {
            this._hideMenus();
            this.visible = false;
        } else {
            this._showMenus();
            this.visible = true;
        }
    };

    this.setBlocks = function(blocks) {
        paletteBlocks = blocks;
    };

    this.add = function(name) {
        this.dict[name] = new Palette(this, name);
        return this;
    };

    this.remove = function(name) {
        if (!(name in this.buttons)) {
            console.log('Palette.remove: Cannot find palette ' + name);
            return;
        }

        this.buttons[name].removeAllChildren();
        var btnKeys = Object.keys(this.dict);
        for (var btnKey = btnKeys.indexOf(name) + 1; btnKey < btnKeys.length; btnKey++) {
            this.buttons[btnKeys[btnKey]].y -= this.cellSize;
        }
        delete this.buttons[name];
        delete this.dict[name];
        this.y -= this.cellSize;
        this.makePalettes(true);
    };

    this.bringToTop = function() {
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

    this.findPalette = function(x, y) {
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
    this._loadPaletteButtonHandler = function(name) {
        var palettes = this;
        var locked = false;
        var scrolling = false;

        var that = this;

        this.buttons[name].on('mousedown', function(event) {
            scrolling = true;
            var lastY = event.stageY;

            palettes.buttons[name].on('pressmove', function(event) {
                if (!scrolling) {
                    return;
                }

                var diff = event.stageY - lastY;
                palettes.menuScrollEvent(diff, 10);
                lastY = event.stageY;
            });

            palettes.buttons[name].on('pressup', function(event) {
                scrolling = false;
            }, null, true);  // once = true
        });

        // A palette button opens or closes a palette.
        this.buttons[name].on('mouseover', function(event) {
            palettes.mouseOver = true;
            var r = palettes.cellSize / 2;
            that.circles = showButtonHighlight(palettes.buttons[name].x + r, palettes.buttons[name].y + r, r, event, palettes.scale, palettes.stage);
        });

        this.buttons[name].on('pressup', function(event) {
            palettes.mouseOver = false;
            hideButtonHighlight(that.circles, palettes.stage);
        });

        this.buttons[name].on('mouseout', function(event) {
            palettes.mouseOver = false;
            hideButtonHighlight(that.circles, palettes.stage);
        });

        this.buttons[name].on('click', function(event) {
            if (locked) {
                return;
            }
            locked = true;

            setTimeout(function() {
                locked = false;
            }, 500);

            palettes.dict[name]._moveMenu(palettes.initial_x, palettes.initial_y);
            palettes.showPalette(name);
            palettes.refreshCanvas();
        });
    };

    this.removeActionPrototype = function(actionName) {
        var blockRemoved = false;
        for (var blk = 0; blk < this.dict['action'].protoList.length; blk++) {
            var actionBlock = this.dict['action'].protoList[blk];
            if (['nameddo', 'namedcalc', 'nameddoArg', 'namedcalcArg'].indexOf(actionBlock.name) !== -1 && (actionBlock.defaults[0] === actionName)) {
                // Remove the palette protoList entry for this block.
                this.dict['action'].remove(actionBlock, actionName);

                // And remove it from the protoBlock dictionary.
                if (paletteBlocks.protoBlockDict['myDo_' + actionName]) {
                    // console.log('DELETING PROTOBLOCKS FOR ACTION ' + actionName);
                    delete paletteBlocks.protoBlockDict['myDo_' + actionName];
                } else if (paletteBlocks.protoBlockDict['myCalc_' + actionName]) {
                    // console.log('deleting protoblocks for action ' + actionName);
                    delete paletteBlocks.protoBlockDict['myCalc_' + actionName];
                } else if (paletteBlocks.protoBlockDict['myDoArg_' + actionName]) {
                    // console.log('deleting protoblocks for action ' + actionName);
                    delete paletteBlocks.protoBlockDict['myDoArg_' + actionName];
                } else if (paletteBlocks.protoBlockDict['myCalcArg_' + actionName]) {
                    // console.log('deleting protoblocks for action ' + actionName);
                    delete paletteBlocks.protoBlockDict['myCalcArg_' + actionName];
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

            var protoBlock = paletteBlocks.protoBlockDict[blkname];
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
            case 'solfege':
                label = i18nSolfege('sol');
                break;
            case 'eastindiansolfege':
                label = 'sargam';
                break;
            case 'notename':
                label = 'G';
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
                    if (blkname === 'storein' && block.defaults[0] === _('box')) {
                        label = _('store in');
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

            if (['do', 'nameddo', 'namedbox', 'namedcalc', 'doArg', 'calcArg', 'nameddoArg', 'namedcalcArg'].indexOf(protoBlock.name) != -1 && label != null && label.length > 8) {
                label = label.substr(0, 7) + '...';
            }

            // Don't display the label on image blocks.
            if (protoBlock.image) {
                label = '';
            }

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
                break;
            case 'nameddo':
                // so the label will fit
                var svg = new SVG();
                svg.init();
                svg.setScale(protoBlock.scale);
                svg.setExpand(30, 0, 0, 0);
                var artwork = svg.basicBlock();
                var docks = svg.docks;
                break;
            default:
                var obj = protoBlock.generator();
                var artwork = obj[0];
                var docks = obj[1];
                break;
            }

            if (protoBlock.disabled) {
                artwork = artwork
                    .replace(/fill_color/g, DISABLEDFILLCOLOR)
                    .replace(/stroke_color/g, DISABLEDSTROKECOLOR)
                    .replace('block_label', label);
            } else {
                artwork = artwork
                    .replace(/fill_color/g,
                         PALETTEFILLCOLORS[protoBlock.palette.name])
                    .replace(/stroke_color/g,
                         PALETTESTROKECOLORS[protoBlock.palette.name])
                    .replace('block_label', label);
            }

            for (var i = 0; i <= protoBlock.args; i++) {
                artwork = artwork.replace('arg_label_' + i, protoBlock.staticLabels[i] || '');
            }

            this.blocks.push({
                blk,
                blkname,
                modname,
                height: STANDARDBLOCKHEIGHT,
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
    var me = this;

    for (var name in this.palettes.dict) {
        this.models[name] = new PaletteModel(this.palettes.dict[name],
                                             this.palettes, name);
    };

    this.update = function () {
        var html = '<div class="back"><h2>' + _('back') + '</h2></div>';
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

        document.querySelector('#popdown-palette .back').addEventListener('click', function () {
            me.popup();
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
                me.popup();
                me.palettes.showPalette(d.querySelector('h2').dataset.name);
            });
        });

        var eles = document.querySelectorAll('#popdown-palette li');
        Array.prototype.forEach.call(eles, function (e) {
            e.addEventListener('click', function (event) {
                me.popup();
                var palette = me.palettes.dict[e.dataset.palettename];
                var container = palette.protoContainers[e.dataset.modname];

                // console.log(e.dataset.blk + ' ' + e.dataset.modname);
                var newBlock = palette._makeBlockFromPalette(palette.protoList[e.dataset.blk], e.dataset.modname, function (newBlock) {
                    // Move the drag group under the cursor.
                    paletteBlocks.findDragGroup(newBlock);
                    for (var i in paletteBlocks.dragGroup) {
                        paletteBlocks.moveBlockRelative(paletteBlocks.dragGroup[i], Math.round(event.clientX / palette.palettes.scale) - paletteBlocks.stage.x, Math.round(event.clientY / palette.palettes.scale) - paletteBlocks.stage.y);
                    }
                    // Dock with other blocks if needed
                    blocks.blockMoved(newBlock);
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

    this.makeMenu = function(createHeader) {
        var palette = this;

        function __processButtonIcon(palette, name, bitmap, args) {
            bitmap.scaleX = bitmap.scaleY = bitmap.scale = 0.8;
            palette.menuContainer.addChild(bitmap);
            palette.palettes.container.addChild(palette.menuContainer);
        };

        function __processCloseIcon(palette, name, bitmap, args) {
            bitmap.scaleX = bitmap.scaleY = bitmap.scale = 0.7;
            palette.menuContainer.addChild(bitmap);
            bitmap.x = paletteWidth - STANDARDBLOCKHEIGHT;
            bitmap.y = 0;

            var hitArea = new createjs.Shape();
            hitArea.graphics.beginFill('#FFF').drawEllipse(-paletteWidth / 2, -STANDARDBLOCKHEIGHT / 2, paletteWidth, STANDARDBLOCKHEIGHT);
            hitArea.x = paletteWidth / 2;
            hitArea.y = STANDARDBLOCKHEIGHT / 2;
            palette.menuContainer.hitArea = hitArea;
            palette.menuContainer.visible = false;

            if (!palette.mouseHandled) {
                palette._loadPaletteMenuHandler();
                palette.mouseHandled = true;
            }
        };        

        function __processUpIcon(palette, name, bitmap, args) {
            bitmap.scaleX = bitmap.scaleY = bitmap.scale = 0.7;
            palette.palettes.stage.addChild(bitmap);
            bitmap.x = palette.menuContainer.x + paletteWidth;
            bitmap.y = palette.menuContainer.y + STANDARDBLOCKHEIGHT;
            __calculateHitArea(bitmap);
            var hitArea = new createjs.Shape();
            bitmap.visible = false;
            palette.upButton = bitmap;

            palette.upButton.on('click', function(event) {
                palette.scrollEvent(STANDARDBLOCKHEIGHT, 10);
            });

        };

        function __processDownIcon(palette, name, bitmap, args) {
            bitmap.scaleX = bitmap.scaleY = bitmap.scale = 0.7;
            palette.palettes.stage.addChild(bitmap);
            bitmap.x = palette.menuContainer.x + paletteWidth;
            bitmap.y = palette._getDownButtonY();
            __calculateHitArea(bitmap);
            palette.downButton = bitmap;

            palette.downButton.on('click', function(event) {
                palette.scrollEvent(-STANDARDBLOCKHEIGHT, 10);
            });
        };

        function __makeFadedDownIcon(palette, name, bitmap, args) {
            bitmap.scaleX = bitmap.scaleY = bitmap.scale = 0.7;
            palette.palettes.stage.addChild(bitmap);
            bitmap.x = palette.menuContainer.x + paletteWidth;
            bitmap.y = palette._getDownButtonY();
            __calculateHitArea(bitmap);
            palette.fadedDownButton = bitmap;
        };

        function __makeFadedUpIcon(palette, name, bitmap, args) {
            bitmap.scaleX = bitmap.scaleY = bitmap.scale = 0.7;
            palette.palettes.stage.addChild(bitmap);
            bitmap.x = palette.menuContainer.x + paletteWidth;
            bitmap.y = palette.menuContainer.y + STANDARDBLOCKHEIGHT;
            __calculateHitArea(bitmap);
            palette.fadedUpButton = bitmap;
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
            palette.menuContainer.addChild(bitmap);

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

        var paletteWidth = MENUWIDTH + (this.columns * 160);
        this.menuContainer.removeAllChildren();

        // Create the menu button
        makePaletteBitmap(this, PALETTEHEADER.replace('fill_color', '#282828').replace('palette_label', toTitleCase(_(this.name))).replace(/header_width/g, paletteWidth), this.name, __processHeader, null);
    };

    this._getDownButtonY = function () {
        var h = maxPaletteHeight(this.palettes.cellSize, this.palettes.scale);
        return h + STANDARDBLOCKHEIGHT;
    };

    this._resizeEvent = function() {
        this.hide();
        this._updateBackground();
        this._updateBlockMasks();

        if (this.downButton !== null) {
            this.downButton.y = this._getDownButtonY();
            this.fadedDownButton.y = this.downButton.y;
        }
    };

    this._updateBlockMasks = function() {
        var h = Math.min(maxPaletteHeight(this.palettes.cellSize, this.palettes.scale), this.y);
        for (var i in this.protoContainers) {
            var s = new createjs.Shape();
            s.graphics.r(0, 0, MENUWIDTH, h);
            s.x = this.background.x;
            s.y = this.background.y;
            this.protoContainers[i].mask = s;
        }
    };

    this._updateBackground = function() {
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
        shape.graphics.f('#949494').r(0, 0, MENUWIDTH, h).ef();
        shape.width = MENUWIDTH;
        shape.height = h;
        this.background.addChild(shape);

        this.background.x = this.menuContainer.x;
        this.background.y = this.menuContainer.y + STANDARDBLOCKHEIGHT;
    };

    this._resetLayout = function() {
        // Account for menu toolbar
        if (this.menuContainer == null) {
            console.log('menuContainer is null');
            return;
        }

        for (var i in this.protoContainers) {
            this.protoContainers[i].y -= this.scrollDiff;
        }

        this.y = this.menuContainer.y + STANDARDBLOCKHEIGHT;
        var items = [];
        // Reverse order
        for (var i in this.protoContainers) {
            items.push(this.protoContainers[i]);
        }
        var n = items.length;
        for (var j = 0; j < n; j++) {
            var i = items.pop();
            i.x = this.menuContainer.x;
            i.y = this.y;
            var bounds = i.getBounds();
            if (bounds != null) {
                // Pack them in a bit tighter
                this.y += bounds.height - (STANDARDBLOCKHEIGHT * 0.1);
            } else {
                // If artwork isn't ready, assume it is of standard
                // size, e.g., and action block.
                this.y += STANDARDBLOCKHEIGHT * 0.9;
            }
        }

        for (var i in this.protoContainers) {
            this.protoContainers[i].y += this.scrollDiff;
        }
    };

    this._updateMenu = function(hide) {
        var palette = this;

        function __calculateBounds(palette, blk, modname, protoListBlk) {
            var bounds = palette.protoContainers[modname].getBounds();
            palette.protoContainers[modname].cache(bounds.x, bounds.y, Math.ceil(bounds.width), Math.ceil(bounds.height));

            var hitArea = new createjs.Shape();
            // Trim the hitArea height slightly to make it easier to
            // select single-height blocks below double-height blocks.
            hitArea.graphics.beginFill('#FFF').drawRect(0, 0, Math.ceil(bounds.width), Math.ceil(bounds.height * 0.75));
            palette.protoContainers[modname].hitArea = hitArea;
            palette._loadPaletteMenuItemHandler(protoListBlk, modname);
            palette.palettes.refreshCanvas();
        };

        function __processBitmap(palette, modname, bitmap, args) {
            var b = args[0];
            var blk = args[1];
            var protoListBlk = args[2];

            if (palette.protoContainers[modname] == undefined) {
                console.log('no protoContainer for ' + modname);
                return;
            }

            palette.protoContainers[modname].addChild(bitmap);
            bitmap.x = PALETTELEFTMARGIN;
            bitmap.y = 0;
            bitmap.scaleX = PROTOBLOCKSCALE;
            bitmap.scaleY = PROTOBLOCKSCALE;
            bitmap.scale = PROTOBLOCKSCALE;

            if (b.image) {
                var image = new Image();
                image.onload = function() {
                    var bitmap = new createjs.Bitmap(image);
                    if (image.width > image.height) {
                        bitmap.scaleX = bitmap.scaleY = bitmap.scale = MEDIASAFEAREA[2] / image.width * (b.scale / 2);
                    } else {
                        bitmap.scaleX = bitmap.scaleY = bitmap.scale = MEDIASAFEAREA[3] / image.height * (b.scale / 2);
                    }
                    palette.protoContainers[modname].addChild(bitmap);
                    bitmap.x = MEDIASAFEAREA[0] * (b.scale / 2);
                    bitmap.y = MEDIASAFEAREA[1] * (b.scale / 2);
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

                this.protoContainers[b.modname].x = this.menuContainer.x;
                this.protoContainers[b.modname].y = this.menuContainer.y + this.y + this.scrollDiff + STANDARDBLOCKHEIGHT;
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
                this.protoContainers[b.modname].x = this.menuContainer.x;
                this.protoContainers[b.modname].y = this.menuContainer.y + this.y + this.scrollDiff + STANDARDBLOCKHEIGHT;
                this.y += Math.ceil(b.height * PROTOBLOCKSCALE);
            }
        }

        this.makeMenu(false);

        if (this.palettes.mobile) {
            this.hide();
        }
    };

    this._moveMenu = function(x, y) {
        // :sigh: race condition on iOS 7.1.2
        if (this.menuContainer == null) return;
        var dx = x - this.menuContainer.x;
        var dy = y - this.menuContainer.y;
        this.menuContainer.x = x;
        this.menuContainer.y = y;
        this._moveMenuItemsRelative(dx, dy);
    };

    this._moveMenuRelative = function(dx, dy) {
        this.menuContainer.x += dx;
        this.menuContainer.y += dy;
        this._moveMenuItemsRelative(dx, dy);
    };

    this.hide = function() {
        this.hideMenu();
    };

    this.show = function() {
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

    this.hideMenu = function() {
        if (this.menuContainer != null) {
            this.menuContainer.visible = false;
            this._hideMenuItems(true);
        }

        this._moveMenu(this.palettes.cellSize, this.palettes.cellSize);
    };

    this.showMenu = function() {
        if (this.palettes.mobile) {
            this.menuContainer.visible = false;
        } else {
            this.menuContainer.visible = true;
        }
    };

    this._hideMenuItems = function(init) {
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

    this._showMenuItems = function(init) {
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

    this._moveMenuItems = function(x, y) {
        for (var i in this.protoContainers) {
            this.protoContainers[i].x = x;
            this.protoContainers[i].y = y;
        }

        if (this.background !== null) {
            this.background.x = x;
            this.background.y = y;
        }
    };

    this._moveMenuItemsRelative = function(dx, dy) {
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

    this.scrollEvent = function(direction, scrollSpeed) {
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
        stage.setChildIndex(this.menuContainer, stage.getNumChildren() - 1);
        this.palettes.refreshCanvas();
        this.count += 1;
    };

    this.getInfo = function() {
        var returnString = this.name + ' palette:';
        for (var thisBlock in this.protoList) {
            returnString += ' ' + this.protoList[thisBlock].name;
        }
        return returnString;
    };

    this.remove = function(protoblock, name) {
        // Remove the protoblock and its associated artwork container.
        // console.log('removing action ' + name);
        var i = this.protoList.indexOf(protoblock);
        if (i !== -1) {
            this.protoList.splice(i, 1);
        }

        for (var i = 0; i < this.model.blocks.length; i++) {
            if (['nameddo', 'nameddoArg', 'namedcalc', 'namedcalcArg'].indexOf(this.model.blocks[i].blkname) !== -1 && this.model.blocks[i].modname === name) {
                this.model.blocks.splice(i, 1);
                break;
            }
        }
        this.palettes.stage.removeChild(this.protoContainers[name]);
        delete this.protoContainers[name];
    };

    this.add = function(protoblock, top) {
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

    this._setupBackgroundEvents = function() {
        var palette = this;
        var scrolling = false;

        this.background.on('mouseover', function(event) {
            palette.palettes.activePalette = palette;
        });

        this.background.on('mouseout', function(event) {
            palette.palettes.activePalette = null;
        });

        this.background.on('mousedown', function(event) {
            scrolling = true;
            var lastY = event.stageY;

            palette.background.on('pressmove', function(event) {
                if (!scrolling) {
                    return;
                }

                var diff = event.stageY - lastY;
                palette.scrollEvent(diff, 10);
                lastY = event.stageY;
            });

            palette.background.on('pressup', function(event) {
                palette.palettes.activePalette = null;
                scrolling = false;
            }, null, true);  // once = true
        });
    };

    // Palette Menu event handlers
    this._loadPaletteMenuHandler =function() {
        // The palette menu is the container for the protoblocks. One
        // palette per palette button.

        var palette = this;
        var locked = false;
        var trashcan = this.palettes.trashcan;
        var paletteWidth = MENUWIDTH + (this.columns * 160);

        this.menuContainer.on('click', function(event) {
            if (Math.round(event.stageX / palette.palettes.scale) > palette.menuContainer.x + paletteWidth - STANDARDBLOCKHEIGHT) {
                palette.hide();
                palette.palettes.refreshCanvas();
                return;
            }

            if (locked) {
                return;
            }
            locked = true;
            setTimeout(function() {
                locked = false;
            }, 500);

            for (var p in palette.palettes.dict) {
                if (palette.name != p) {
                    if (palette.palettes.dict[p].visible) {
                        palette.palettes.dict[p]._hideMenuItems(false);
                    }
                }
            }

            if (palette.visible) {
                palette._hideMenuItems(false);
            } else {
                palette._showMenuItems(false);
            }
            palette.palettes.refreshCanvas();
        });

        this.menuContainer.on('mousedown', function(event) {
            trashcan.show();
            // Move them all?
            var offset = {
                x: palette.menuContainer.x - Math.round(event.stageX / palette.palettes.scale),
                y: palette.menuContainer.y - Math.round(event.stageY / palette.palettes.scale)
            };

            palette.menuContainer.on('pressup', function(event) {
                if (trashcan.overTrashcan(event.stageX / palette.palettes.scale, event.stageY / palette.palettes.scale)) {
                    if (trashcan.isVisible) {
                        palette.hide();
                        palette.palettes.refreshCanvas();
                        // Only delete plugin palettes.
                        if (palette.name === 'myblocks') {
                            palette._promptMacrosDelete();
                        } else if (BUILTINPALETTES.indexOf(palette.name) === -1) {
                            palette._promptPaletteDelete();
                        }
                    }
                }
                trashcan.hide();
            });

            palette.menuContainer.on('mouseout', function(event) {
                if (trashcan.overTrashcan(event.stageX / palette.palettes.scale, event.stageY / palette.palettes.scale)) {
                    if (trashcan.isVisible) {
                        palette.hide();
                        palette.palettes.refreshCanvas();
                    }
                }
                trashcan.hide();
            });

            palette.menuContainer.on('pressmove', function(event) {
                var oldX = palette.menuContainer.x;
                var oldY = palette.menuContainer.y;
                palette.menuContainer.x = Math.round(event.stageX / palette.palettes.scale) + offset.x;
                palette.menuContainer.y = Math.round(event.stageY / palette.palettes.scale) + offset.y;
                palette.palettes.refreshCanvas();
                var dx = palette.menuContainer.x - oldX;
                var dy = palette.menuContainer.y - oldY;
                palette.palettes.initial_x = palette.menuContainer.x;
                palette.palettes.initial_y = palette.menuContainer.y;

                // If we are over the trash, warn the user.
                if (trashcan.overTrashcan(event.stageX / palette.palettes.scale, event.stageY / palette.palettes.scale)) {
                    trashcan.startHighlightAnimation();
                } else {
                    trashcan.stopHighlightAnimation();
                }

                // Hide the menu items while drag.
                palette._hideMenuItems(false);
                palette._moveMenuItemsRelative(dx, dy);
            });
        });
    };

    // Menu Item event handlers
    this._loadPaletteMenuItemHandler = function(protoblk, blkname) {
        // A menu item is a protoblock that is used to create a new block.
        var palette = this;
        var pressupLock = false;
        var pressed = false;
        var moved = false;
        var saveX = this.protoContainers[blkname].x;
        var saveY = this.protoContainers[blkname].y;
        var bgScrolling = false;

        this.protoContainers[blkname].on('mouseover', function(event) {
            palette.palettes.activePalette = palette;
        });

        this.protoContainers[blkname].on('mousedown', function(event) {
            var stage = palette.palettes.stage;
            stage.setChildIndex(palette.protoContainers[blkname], stage.getNumChildren() - 1);

            var h = Math.min(maxPaletteHeight(palette.palettes.cellSize, palette.palettes.scale), palette.palettes.y);
            var clickY = event.stageY/palette.palettes.scale;
            var paletteEndY = palette.menuContainer.y + h + STANDARDBLOCKHEIGHT;

            // if(clickY < paletteEndY)
            palette.protoContainers[blkname].mask = null;

            moved = false;
            pressed = true;
            saveX = palette.protoContainers[blkname].x;
            saveY = palette.protoContainers[blkname].y - palette.scrollDiff;
            var startX = event.stageX;
            var startY = event.stageY;
            var lastY = event.stageY;

            if (palette.draggingProtoBlock) {
                return;
            }

            var mode = window.hasMouse ? MODEDRAG : MODEUNSURE;

            palette.protoContainers[blkname].on('pressmove', function(event) {
                if (mode === MODEDRAG) {
                    // if(clickY < paletteEndY)
                    moved = true;
                    palette.draggingProtoBlock = true;
                    palette.protoContainers[blkname].x = Math.round(event.stageX / palette.palettes.scale) - PALETTELEFTMARGIN;
                    palette.protoContainers[blkname].y = Math.round(event.stageY / palette.palettes.scale);
                    palette.palettes.refreshCanvas();
                    return;
                }

                if (mode === MODESCROLL) {
                    var diff = event.stageY - lastY;
                    palette.scrollEvent(diff, 10);
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

        this.protoContainers[blkname].on('mouseout', function(event) {
            // Catch case when pressup event is missed.
            // Put the protoblock back on the palette...
            palette.palettes.activePalette = null;

            if (pressed && moved) {
                palette._restoreProtoblock(blkname, saveX, saveY + palette.scrollDiff);
                pressed = false;
                moved = false;
            }
        });

        this.protoContainers[blkname].on('pressup', function(event) {
            palette.palettes.activePalette = null;

            if (pressupLock) {
                return;
            } else {
                pressupLock = true;
                setTimeout(function() {
                    pressupLock = false;
                }, 1000);
            }

            palette._makeBlockFromProtoblock(protoblk, moved, blkname, event, saveX, saveY);
        });
    };

    this._restoreProtoblock = function(name, x, y) {
        // Return protoblock we've been dragging back to the palette.
        this.protoContainers[name].x = x;
        this.protoContainers[name].y = y;
        // console.log('restore ' + name);
        this._resetLayout();
    };

    this._promptPaletteDelete = function() {
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

        storage.plugins = preparePluginExports({});
        if (sugarizerCompatibility.isInsideSugarizer()) {
            sugarizerCompatibility.saveLocally();
        }
    };

    this._promptMacrosDelete = function() {
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

    this._makeBlockFromPalette = function(protoblk, blkname, callback) {
        const BUILTINMACROS= ['articulation', 'augmented', 'augmentedx', 'augmented1', 'augmented2', 'augmented4', 'augmented5', 'augmented7','augmented8', 'backward', 'bottle', 'bubbles', 'cat', 'chine', 'clang', 'clap', 'cowbell', 'crash', 'crescendo', 'cricket', 'cup', 'darbuka', 'diminished', 'diminishedx', 'diminished1', 'diminished4', 'diminished5', 'diminished8', 'dividebeatfactor', 'dog', 'drift', 'duck', 'duplicatenotes', 'eighthNote', 'f', 'ff', 'fff', 'fill', 'fingercymbals', 'flat', 'floortom', 'halfNote', 'hihat', 'hollowline', 'invert', 'invert1', 'kick', 'major', 'majorx', 'major2', 'major3', 'major6', 'major7', 'matrix', 'mf', 'minor', 'minorx', 'minor2', 'minor3', 'minor6', 'minor7', 'mp', 'multiplybeatfactor', 'newnote', 'newslur', 'newstaccato', 'newswing', 'newswing2', 'note', 'note1', 'note2', 'note3', 'note4', 'octave', 'oneOf', 'osctime', 'p', 'perfect', 'perfectx', 'perfect1', 'perfect4', 'perfect5', 'perfect8', 'pitchdrummatrix', 'pitchslider', 'pitchstaircase', 'playdrum', 'pluck', 'pp', 'ppp', 'quarterNote', 'rest2', 'rhythm2', 'rhythmicdot', 'rhythmruler', 'ridebell', 'sawtooth', 'setbpm', 'setdrum', 'setkey2', 'setnotevolume2', 'settransposition', 'setturtlename', 'setvoice', 'sharp', 'sine', 'sixteenthNote', 'sixtyfourthNote', 'skipnotes', 'slap', 'slur', 'snare', 'splash', 'square', 'staccato', 'status', 'steppitch', 'stuplet', 'stuplet3', 'stuplet5', 'stuplet7', 'swing', 'tempo', 'thirtysecondNote', 'tie', 'tom', 'tone', 'triangle', 'triangle1', 'tuplet3', 'tuplet4','turtlenote2', 'turtlepitch', 'vibrato', 'wholeNote', 'xturtle', 'yturtle'];
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

        if (protoblk.name !== 'namedbox' && BUILTINMACROS.indexOf(blkname) > -1) {
            moved = true;
            saveX = this.protoContainers[blkname].x;
            saveY = this.protoContainers[blkname].y;
            this._makeBlockFromProtoblock(protoblk, moved, blkname, null, saveX, saveY);
        } else {
            var newBlock = paletteBlockButtonPush(newBlk, arg);
            callback(newBlock);
        }
    };

    this.cleanup = function() {
        this._resetLayout();
        this._updateBlockMasks();
        this.palettes.refreshCanvas();
    };

    this._makeBlockFromProtoblock = function(protoblk, moved, blkname, event, saveX, saveY) {
        var palette = this;

        // Some blocks are expanded on load.
        const ARTICULATIONOBJ = [[0, 'articulation', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 25}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const AUGMENTED1OBJ = [[0, 'augmentedx', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const AUGMENTED2OBJ = [[0, 'augmentedx', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['number', {'value': 2}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const AUGMENTED4OBJ = [[0, 'augmentedx', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['number', {'value': 4}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const AUGMENTED5OBJ = [[0, 'augmentedx', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['number', {'value': 5}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const AUGMENTED7OBJ = [[0, 'augmentedx', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['number', {'value': 7}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const AUGMENTED8OBJ = [[0, 'augmentedx', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['number', {'value': 8}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const AUGMENTEDOBJ = [[0, 'augmentedx', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['number', {'value': 5}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const BACKWARDOBJ = [[0, 'backward', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, 'hidden', 0, 0, [0, null]]];
        const BOTTLEOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('bottle')}], 0, 0, [0]]];
        const BPMOBJ = [[0, 'setbpm', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 90}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const BUBBLESOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('bubbles')}], 0, 0, [0]]];
        const CATOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('cat')}], 0, 0, [0]]];
        const CHINEOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('chine')}], 0, 0, [0]]];
        const CLANGOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('clang')}], 0, 0, [0]]];
        const CLAPOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('clap')}], 0, 0, [0]]];
        const COWBELLOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('cow bell')}], 0, 0, [0]]];
        const CRASHOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('crash')}], 0, 0, [0]]];
        const CRESCENDOOBJ = [[0, 'crescendo', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 5}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const CRICKETOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('cricket')}], 0, 0, [0]]];
        const CUPOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('cup drum')}], 0, 0, [0]]];
        const DARBUKAOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('darbuka drum')}], 0, 0, [0]]];
        const DIMINISHED1OBJ = [[0, 'diminishedx', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const DIMINISHED2OBJ = [[0, 'diminishedx', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['number', {'value': 2}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const DIMINISHED4OBJ = [[0, 'diminishedx', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['number', {'value': 4}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const DIMINISHED5OBJ = [[0, 'diminishedx', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['number', {'value': 5}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const DIMINISHED7OBJ = [[0, 'diminishedx', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['number', {'value': 7}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const DIMINISHED8OBJ = [[0, 'diminishedx', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['number', {'value': 8}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const DIMINISHEDOBJ = [[0, 'diminishedx', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['number', {'value': 5}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const DIVBEATOBJ = [[0, 'dividebeatfactor', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 2}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const DOGOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('dog')}], 0, 0, [0]]];
        const DOTOBJ = [[0, 'rhythmicdot', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, null, 1]], [1, 'hidden', 0, 0, [0, null]]];
        const DRIFTOBJ = [[0, 'drift', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, null, 1]], [1, 'hidden', 0, 0, [0, null]]];
        const DUCKOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('duck')}], 0, 0, [0]]];
        const DUPOBJ = [[0, 'duplicatenotes', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 2}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const EIGHTHOBJ = [[0, 'rhythm2', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, 5]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 8}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
        const FILLOBJ = [[0, 'fill', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, null, 1]], [1, 'hidden', 0, 0, [0, null]]];
        const FINGERCYMBALSOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('finger cymbals')}], 0, 0, [0]]];
        const FLATOBJ = [[0, 'flat', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, null, 1]], [1, 'hidden', 0, 0, [0, null]]];
        const FLOORTOMOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('floor tom tom')}], 0, 0, [0]]];
        const HALFOBJ = [[0, 'rhythm2', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, 5]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 2}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
        const HIHATOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('hi hat')}], 0, 0, [0]]];
        const HOLLOWOBJ = [[0, 'hollowline', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, null, 1]], [1, 'hidden', 0, 0, [0, null]]];
        const INVERTOBJ = [[0, 'invert', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['solfege', {'value': 'sol'}], 0, 0, [0]], [2, ['number', {'value': 4}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const INVERT1OBJ = [[0, 'invert1', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, 3, null, 4]], [1, ['solfege', {'value': 'sol'}], 0, 0, [0]], [2, ['number', {'value': 4}], 0, 0, [0]], [3, ['text', {'value': _('even')}], 0, 0, [0]], [4, 'hidden', 0, 0, [0, null]]];
        const KICKOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('kick drum')}], 0, 0, [0]]];
        const MAJOR2OBJ = [[0, 'majorx', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['number', {'value': 2}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const MAJOR3OBJ = [[0, 'majorx', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['number', {'value': 3}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const MAJOR6OBJ = [[0, 'majorx', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['number', {'value': 6}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const MAJOR7OBJ = [[0, 'majorx', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['number', {'value': 7}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const MAJOROBJ = [[0, 'majorx', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['number', {'value': 3}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const MATRIXOBJ = [[0, ['matrix', {'collapsed': false}], this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 32]], [1, ['pitch', {}], 0, 0, [0, 2, 3, 4]], [2, ['solfege', {'value': 'ti'}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, ['pitch', {}], 0, 0, [1, 5, 6, 7]], [5, ['solfege', {'value': 'la'}], 0, 0, [4]], [6, ['number', {'value': 4}], 0, 0, [4]], [7, ['pitch', {}], 0, 0, [4, 8, 9, 10]], [8, ['solfege', {'value': 'sol'}], 0, 0, [7]], [9, ['number', {'value': 4}], 0, 0, [7]], [10, ['pitch', {}], 0, 0, [7, 11, 12, 13]], [11, ['solfege', {'value': 'mi'}], 0, 0, [10]], [12, ['number', {'value': 4}], 0, 0, [10]], [13, ['pitch', {}], 0, 0, [10, 14, 15, 30]], [14, ['solfege', {'value': 're'}], 0, 0, [13]], [15, ['number', {'value': 4}], 0, 0, [13]], [16, ['rhythm2', {}], 0, 0, [28, 17, 19, 33]], [17, ['number', {'value': 6}], 0, 0, [16]], [18, ['number', {'value': 1}], 0, 0, [19]],[19, 'divide', 0, 0, [16, 18, 20]],[20,['number', {'value': 4}], 0, 0, [19]], [21, ['rhythm2', {}], 0, 0, [33, 22, 24 , null]], [22, ['number', {'value': 1}], 0, 0, [21]], [23, ['number', {'value': 1}], 0, 0, [24]], [24, 'divide', 0, 0, [21, 23, 25]], [25, ['number', {'value':2}], 0, 0, [24]], [26, ['forward', {}], 0, 0, [30, 27, 28]], [27, ['number', {'value': 100}], 0, 0, [26]], [28, ['right', {}], 0, 0, [26, 29, 16]], [29, ['number', {'value': 90}], 0, 0, [28]], [30, ['playdrum', {}], 0, 0, [13, 31, 26]], [31, ['drumname', {'value': _('snare drum')}], 0, 0, [30]], [32, ['hiddennoflow', {}], 0, 0, [0, null]], [33, 'vspace', 0, 0, [16, 21]]];
        const MINOR2OBJ = [[0, 'minorx', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['number', {'value': 2}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const MINOR3OBJ = [[0, 'minorx', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['number', {'value': 3}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const MINOR6OBJ = [[0, 'minorx', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['number', {'value': 6}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const MINOR7OBJ = [[0, 'minorx', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['number', {'value': 7}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const MINOROBJ = [[0, 'minorx', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['number', {'value': 3}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const MODEWIDGETOBJ = [[0, 'modewidget', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 4]], [1, 'setkey2', 0, 0, [0, 2, 3, null]], [2, ['notename', {'value': 'C'}], 0, 0, [1]], [3, ['modename', {'value': getModeName(DEFAULTMODE)}], 0, 0, [1]], [4, 'hiddennoflow', 0, 0, [0, null]]];
        const MULTBEATOBJ = [[0, 'multiplybeatfactor', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 2}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const NEWNOTEOBJ = [[0, 'newnote', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 4, 8]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'pitch', 0, 0, [4, 6, 7, null]], [6, ['solfege', {'value': 'sol'}], 0, 0, [5]], [7, ['number', {'value': 4}], 0, 0, [5]], [8, 'hidden', 0, 0, [0, null]]];
        const NEWSLUROBJ = [[0, 'newslur', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 4, 5]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 16}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, null]], [5, 'hidden', 0, 0, [0, null]]];
        const NEWSTACCATOOBJ = [[0, 'newstaccato', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 4, 5]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 32}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, null]], [5, 'hidden', 0, 0, [0, null]]];
        const NEWSWING2OBJ = [[0, 'newswing2', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 6, 9, 10]], [1, 'hspace', 0, 0, [0, 2]], [2, 'hspace', 0, 0, [1, 3]], [3, 'divide', 0, 0, [2, 4, 5]], [4, ['number', {'value': 1}], 0, 0, [3]], [5, ['number', {'value': 24}], 0, 0, [3]], [6, 'divide', 0, 0, [0, 7, 8]], [7, ['number', {'value': 1}], 0, 0, [6]], [8, ['number', {'value': 8}], 0, 0, [6]], [9, 'vspace', 0, 0, [0, null]], [10, 'hidden', 0, 0, [0, null]]];
        const NEWSWINGOBJ = [[0, 'newswing', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 4, 5]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 16}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, null]], [5, 'hidden', 0, 0, [0, null]]];
        const NOTE1OBJ = [[0, 'newnote', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 4, 8]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'pitch', 0, 0, [4, 6, 7, null]], [6, ['solfege', {'value': 'sol'}], 0, 0, [5]], [7, ['number', {'value': 4}], 0, 0, [5]], [8, 'hidden', 0, 0, [0, null]]];
        const NOTE2OBJ = [[0, 'newnote', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 4, 8]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'pitch', 0, 0, [4, 6, 7, null]], [6, ['notename', {'value': 'G'}], 0, 0, [5]], [7, ['number', {'value': 4}], 0, 0, [5]], [8, 'hidden', 0, 0, [0, null]]];
        const NOTE3OBJ = [[0, 'newnote', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 4, 7]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'hertz', 0, 0, [4, 6, null]], [6, ['number', {'value': 392}], 0, 0, [5]], [7, 'hidden', 0, 0, [0, null]]];
        const NOTE4OBJ = [[0, 'newnote', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 4, 7]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'playdrum', 0, 0, [4, 6, null]], [6, ['drumname', {'value': _(DEFAULTDRUM)}], 0, 0, [5]], [7, 'hidden', 0, 0, [0, null]]];
        const NOTEOBJ = [[0, 'note', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, 5]], [1, ['number', {'value': 8}], 0, 0, [0]], [2, 'pitch', 0, 0, [0, 3, 4, null]], [3, ['solfege', {'value': 'sol'}], 0, 0, [2]], [4, ['number', {'value': 4}], 0, 0, [2]], [5, 'hidden', 0, 0, [0, null]]];
        const OCTAVEOBJ = [[0, 'settransposition', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 4, 5]], [1, 'multiply', 0, 0, [0, 2, 3]], [2, ['number', {'value': 12}], 0, 0, [1]], [3, ['number', {'value': 1}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, null]], [5, 'hidden', 0, 0, [0, null]]];
        const ONEOFOBJ = [[0, 'oneOf',  this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null]], [1, ['solfege', {'value': 'do'}], 0, 0, [0]], [2, ['solfege', {'value': 're'}], 0, 0, [0]]];
        const OSCTIMEOBJ = [[0, 'osctime', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 2, 1, 7]], [1, 'vspace', 0, 0, [0, 5]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1000}], 0, 0, [2]], [4, ['number', {'value': 3}], 0, 0, [2]], [5, 'hertz', 0, 0, [1, 6, null]], [6, ['number', {'value': 392}], 0, 0, [5]], [7, 'hidden', 0, 0, [0, null]]];
        const PERFECT1OBJ = [[0, 'perfectx', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const PERFECT4OBJ = [[0, 'perfectx', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['number', {'value': 4}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const PERFECT5OBJ = [[0, 'perfectx', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['number', {'value': 5}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const PERFECT8OBJ = [[0, 'perfectx', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['number', {'value': 8}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const PERFECTOBJ = [[0, 'perfectx', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['number', {'value': 5}], 0, 0, [0]], [2, ['number', {'value': 0}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const PITCHDRUMMATRIXOBJ = [[0, 'pitchdrummatrix', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 12]], [1, 'pitch', 0, 0, [0, 2, 3, 4]], [2, ['solfege', {'value': 'sol'}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'pitch', 0, 0, [1, 5, 6, 7]], [5, ['solfege', {'value': 'mi'}], 0, 0, [4]], [6, ['number', {'value': 4}], 0, 0, [4]], [7, 'pitch', 0, 0, [4, 8, 9, 10]], [8, ['solfege', {'value': 're'}], 0, 0, [7]], [9, ['number', {'value': 4}], 0, 0, [7]], [10, 'playdrum', 0, 0, [7, 11, null]], [11, ['drumname', {'value': _(DEFAULTDRUM)}], 0, 0, [10]], [12, 'hiddennoflow', 0, 0, [0, null]]];
        const PITCHSLIDEROBJ = [[0, 'pitchslider', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 3]], [1, 'hertz', 0, 0, [0, 2, null]], [2, ['number', {'value': 392}], 0, 0, [1]], [3, 'hiddennoflow', 0, 0, [0, null]]];
        const PITCHSTAIRCASEOBJ = [[0, 'pitchstaircase', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 4]], [1, 'pitch', 0, 0, [0, 2, 3, null]], [2, ['solfege', {'value': 'sol'}], 0, 0, [1]], [3, ['number', {'value': 3}], 0, 0, [1]], [4, 'hiddennoflow', 0, 0, [0, null]]];
        const PLAYDRUMOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _(DEFAULTDRUM)}], 0, 0, [0]]];
        const PLUCKOBJ = [[0, 'pluck', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, null, 1]], [1, 'hidden', 0, 0, [0, null]]];
        const QUARTEROBJ = [[0, 'rhythm2', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, 5]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 4}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
        const RESTOBJ = [[0, 'newnote', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 4, 6]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 8}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'rest2', 0, 0, [4, null]], [6, 'hidden', 0, 0, [0, null]]];
        const RHYTHMOBJ = [[0, 'rhythm2', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, 5]], [1, ['number', {'value': 3}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 4}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
        const RHYTHMRULEROBJ = [[0, 'rhythmruler', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 4, 21]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 1}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'setdrum', 0, 0, [4, 6, 7, 12]], [6, ['drumname', {'value': _('snare drum')}], 0, 0, [5]], [7, 'rhythm2', 0, 0, [5, 8, 9, null]], [8, ['number', {'value': 1}], 0, 0, [7]], [9, 'divide', 0, 0, [7, 10, 11]], [10, ['number', {'value': 1}], 0, 0, [9]], [11, ['number', {'value': 1}], 0, 0, [9]], [12, 'hidden', 0, 0, [5, 13]], [13, 'setdrum', 0, 0, [12, 14, 15, 20]], [14, ['drumname', {'value': _('kick drum')}], 0, 0, [13]], [15, 'rhythm2', 0, 0, [13, 16, 17, null]], [16, ['number', {'value': 1}], 0, 0, [15]], [17, 'divide', 0, 0, [15, 18, 19]], [18, ['number', {'value': 1}], 0, 0, [17]], [19, ['number', {'value': 1}], 0, 0, [17]], [20, 'hidden', 0, 0, [13, null]], [21, 'hiddennoflow', 0, 0, [0, null]]];
        const RIDEBELLOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('ride bell')}], 0, 0, [0]]];
        const SAWTOOTHOBJ = [[0, 'note', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, 4]], [1, ['number', {'value': 8}], 0, 0, [0]], [2, 'sawtooth', 0, 0, [0, 3, null]], [3, ['number', {'value': 440}], 0, 0, [2]], [4, 'hidden', 0, 0, [0, null]]];
        const SETDRUMOBJ = [[0, 'setdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['drumname', {'value': _(DEFAULTDRUM)}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const SETKEYOBJ = [[0, 'setkey2', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null]],  [1, ['notename', {'value': 'C'}], 0, 0, [0]], [2, ['modename', {'value': _('major')}], 0, 0, [0]]];
        const SETTURTLENAMEOBJ = [[0, 'setturtlename', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null]], [1, 'turtlename', 0, 0, [0]], [2, ['text', {'value': 'Mozart'}], 0, 0, [0]]];
        const SETVOICEOBJ = [[0, 'setvoice', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['voicename', {'value': _('violin')}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const SHARPOBJ = [[0, 'sharp', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, null, 1]], [1, 'hidden', 0, 0, [0, null]]];
        const SINEOBJ = [[0, 'note', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, 4]], [1, ['number', {'value': 8}], 0, 0, [0]], [2, 'sine', 0, 0, [0, 3, null]], [3, ['number', {'value': 440}], 0, 0, [2]], [4, 'hidden', 0, 0, [0, null]]];
        const SIXTEENTHOBJ = [[0, 'rhythm2', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, 5]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 16}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
        const SIXTYFOURTHOBJ = [[0, 'rhythm2', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, 5]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 64}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
        const SKIPOBJ = [[0, 'skipnotes', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 2}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const SLAPOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('slap')}], 0, 0, [0]]];
        const SLUROBJ = [[0, 'slur', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 16}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const SNAREOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('snare drum')}], 0, 0, [0]]];
        const SPLASHOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('splash')}], 0, 0, [0]]];
        const SQUAREOBJ = [[0, 'note', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, 4]], [1, ['number', {'value': 8}], 0, 0, [0]], [2, 'square', 0, 0, [0, 3, null]], [3, ['number', {'value': 440}], 0, 0, [2]], [4, 'hidden', 0, 0, [0, null]]];
        const STACCATOOBJ = [[0, 'staccato', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 32}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const STATUSOBJ = [[0, 'status', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 8]], [1, 'hidden', 0, 0, [0, 2]], [2, ['print', {}], 0, 0, [1, 3, 4]], [3, ['key', {}], 0, 0, [2]], [4, ['print', {}], 0, 0, [2, 5, 6]], [5, ['elapsednotes', {}], 0, 0, [4]], [6, ['print', {}], 0, 0, [4, 7, null]], [7, ['notevolumefactor', {}], 0, 0, [6]], [8, 'hiddennoflow', 0, 0, [0, null]]];
        const STEPPITCHOBJ = [[0, 'note', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, 4]], [1, ['number', {'value': 4}], 0, 0, [0]], [2, 'steppitch', 0, 0, [0, 3, null]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, 'hidden', 0, 0, [0, null]]];
        const STUPLETOBJ = [[0,'stuplet', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, 5]], [1, ['number', {'value': 3}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 2}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
        const STUPLET3OBJ = [[0,'stuplet', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, 5]], [1, ['number', {'value': 3}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 2}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
        const STUPLET5OBJ = [[0,'stuplet', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, 5]], [1, ['number', {'value': 5}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 2}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
        const STUPLET7OBJ = [[0,'stuplet', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, 5]], [1, ['number', {'value': 7}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 2}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
        const SWINGOBJ = [[0, 'swing', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 32}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const TEMPOOBJ = [[0, 'tempo', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 3]], [1, 'setmasterbpm', 0, 0, [0, 2, null]], [2, ['number', {'value': 90}], 0, 0, [1]], [3, 'hiddennoflow', 0, 0, [0, null]]]; 
        const THIRTYSECONDOBJ = [[0, 'rhythm2', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, 5]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 32}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
        const TIEOBJ = [[0, 'tie', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, null, 1]], [1, 'hidden', 0, 0, [0, null]]];
        const TOMOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('tom tom')}], 0, 0, [0]]];
        const TONEOBJ = [[0, 'drift', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, 'osctime', 0, 0, [0, 3, 2, null]], [2, 'vspace', 0, 0, [1, 6]], [3, 'divide', 0, 0, [1, 4, 5]], [4, ['number', {'value': 1000}], 0, 0, [3]], [5, ['number', {'value': 3}], 0, 0, [3]], [6, 'hertz', 0, 0, [2, 7, null]], [7, ['number', {'value': 392}], 0, 0, [6]]];
        const TRANSPOBJ = [[0, 'settransposition', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const TRIANGLE1OBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('triangle bell')}], 0, 0, [0]]];
        const TRIANGLEOBJ = [[0, 'note', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, 4]], [1, ['number', {'value': 8}], 0, 0, [0]], [2, 'triangle', 0, 0, [0, 3, null]], [3, ['number', {'value': 440}], 0, 0, [2]], [4, 'hidden', 0, 0, [0, null]]];
        const TUPLETOBJ = [[0,'tuplet3', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 10, 9, 7]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'rhythm2', 0, 0, [9, 3, 4, 8]], [3, ['number', {'value': 3}], 0, 0, [2]], [4, 'divide', 0, 0, [2, 5, 6]], [5, ['number', {'value': 1}], 0, 0, [4]], [6, ['number', {'value': 4}], 0, 0, [4]], [7, 'hidden', 0, 0, [0, null]], [8, 'vspace', 0, 0, [2, null]], [9, 'vspace', 0, 0, [0, 2]], [10, 'divide', 0, 0, [0, 11, 12]], [11, ['number', {'value': 1}], 0, 0, [10]], [12, ['number', {'value': 4}], 0, 0, [10]]];
        const TUPLET4OBJ = [[0,'tuplet4', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 4, 17]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 2}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'rhythm2', 0, 0, [4, 6, 7, 10]], [6, ['number', {'value': 6}], 0, 0, [5]], [7, 'divide', 0, 0, [5, 8, 9]], [8, ['number', {'value': 1}], 0, 0, [7]], [9, ['number', {'value': 16}], 0, 0, [7]], [10, 'vspace', 0, 0, [5, 11]], [11, 'rhythm2', 0, 0, [10, 12, 13, 16]], [12, ['number', {'value': 1}], 0, 0, [11]], [13, 'divide', 0, 0, [11, 14, 15]], [14, ['number', {'value': 1}], 0, 0, [13]], [15, ['number', {'value': 4}], 0, 0, [13]], [16, 'vspace', 0, 0, [11, null]], [17, 'hidden', 0, 0, [0, null]]];
        const TURTLENOTEOBJ = [[0, 'turtlenote2', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, 'turtlename', 0, 0, [0]]];
        const TURTLEPITCHOBJ = [[0, 'turtlepitch', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, 'turtlename', 0, 0, [0]]];
        const VIBRATOOBJ = [[0, ["vibrato", {}], this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 3, 2, 6]], [1, ["number", {"value": 10}], 0, 0, [0]], [2, ["vspace", {}], 0, 0, [0, null]], [3, ["divide", {}], 0, 0, [0, 4, 5]], [4, ["number", {"value": 1}], 0, 0, [3]], [5, ["number", {"value": 16}], 0, 0, [3]], [6, ["hidden", {}], 0, 0, [0, null]]];
        const VOLOBJ = [[0, 'setnotevolume2', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 50}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const VOLOBJ15 = [[0, 'setnotevolume2', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 15}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const VOLOBJ25 = [[0, 'setnotevolume2', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 25}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const VOLOBJ35 = [[0, 'setnotevolume2', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 35}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const VOLOBJ45 = [[0, 'setnotevolume2', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 45}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const VOLOBJ55 = [[0, 'setnotevolume2', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 55}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const VOLOBJ65 = [[0, 'setnotevolume2', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 65}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const VOLOBJ75 = [[0, 'setnotevolume2', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 75}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const VOLOBJ85 = [[0, 'setnotevolume2', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 85}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const WHOLEOBJ = [[0, 'rhythm2', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, 5]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, ['number', {'value': 1}], 0, 0, [2]], [5, 'vspace', 0, 0, [0, null]]];
        const XTURTLEOBJ = [[0, 'xturtle', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, 'turtlename', 0, 0, [0]]];
        const YTURTLEOBJ = [[0, 'yturtle', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, 'turtlename', 0, 0, [0]]];

        const BUILTINMACROS = {
            'articulation': ARTICULATIONOBJ,
            'augmented1': AUGMENTED1OBJ,
            'augmented2': AUGMENTED2OBJ,
            'augmented4': AUGMENTED4OBJ,
            'augmented5': AUGMENTED5OBJ,
            'augmented7': AUGMENTED7OBJ,
            'augmented8': AUGMENTED8OBJ,
            'augmented': AUGMENTEDOBJ,
            'augmentedx': AUGMENTEDOBJ,
            'backward': BACKWARDOBJ,
            'bottle': BOTTLEOBJ,
            'bubbles': BUBBLESOBJ,
            'cat': CATOBJ,
            'chine': CHINEOBJ,
            'clang': CLANGOBJ,
            'clap': CLAPOBJ,
            'cowbell': COWBELLOBJ,
            'crash': CRASHOBJ,
            'crescendo': CRESCENDOOBJ,
            'cricket': CRICKETOBJ,
            'cup': CUPOBJ,
            'darbuka': DARBUKAOBJ,
            'diminished1': DIMINISHED1OBJ,
            'diminished4': DIMINISHED4OBJ,
            'diminished5': DIMINISHED5OBJ,
            'diminished8': DIMINISHED8OBJ,
            'diminished': DIMINISHEDOBJ,
            'diminishedx': DIMINISHEDOBJ,
            'dividebeatfactor': DIVBEATOBJ,
            'dog': DOGOBJ,
            'drift': DRIFTOBJ,
            'duck': DUCKOBJ,
            'duplicatenotes': DUPOBJ,
            'eighthNote': EIGHTHOBJ,
            'fff': VOLOBJ85,
            'ff': VOLOBJ75,
            'fill': FILLOBJ,
            'fingercymbals': FINGERCYMBALSOBJ,
            'flat': FLATOBJ,
            'floortom': FLOORTOMOBJ,
            'f': VOLOBJ65,
            'halfNote': HALFOBJ,
            'hihat': HIHATOBJ,
            'hollowline': HOLLOWOBJ,
            'invert': INVERTOBJ,
            'invert1': INVERT1OBJ,
            'kick': KICKOBJ,
            'major2': MAJOR2OBJ,
            'major3': MAJOR3OBJ,
            'major6': MAJOR6OBJ,
            'major7': MAJOR7OBJ,
            'major': MAJOROBJ,
            'majorx': MAJOROBJ,
            'matrix': MATRIXOBJ,
            'mf': VOLOBJ55,
            'minor2': MINOR2OBJ,
            'minor3': MINOR3OBJ,
            'minor6': MINOR6OBJ,
            'minor7': MINOR7OBJ,
            'minor': MINOROBJ,
            'minorx': MINOROBJ,
            'modewidget': MODEWIDGETOBJ,
            'mp': VOLOBJ45,
            'multiplybeatfactor': MULTBEATOBJ,
            'newnote': NEWNOTEOBJ,
            'newslur': NEWSLUROBJ,
            'newstaccato': NEWSTACCATOOBJ,
            'newswing2': NEWSWING2OBJ,
            'newswing': NEWSWINGOBJ,
            'note1': NOTE1OBJ,
            'note2': NOTE2OBJ,
            'note3': NOTE3OBJ,
            'note4': NOTE4OBJ,
            'note': NOTEOBJ,
            'octave': OCTAVEOBJ,
            'oneOf': ONEOFOBJ,
            'osctime': OSCTIMEOBJ,
            'perfect1': PERFECT1OBJ,
            'perfect4': PERFECT4OBJ,
            'perfect5': PERFECT5OBJ,
            'perfect8': PERFECT8OBJ,
            'perfect': PERFECTOBJ,
            'perfectx': PERFECTOBJ,
            'pitchdrummatrix': PITCHDRUMMATRIXOBJ,
            'pitchslider': PITCHSLIDEROBJ,
            'pitchstaircase': PITCHSTAIRCASEOBJ,
            'playdrum': PLAYDRUMOBJ,
            'pluck': PLUCKOBJ,
            'ppp': VOLOBJ15,
            'pp': VOLOBJ25,
            'p': VOLOBJ35,
            'quarterNote': QUARTEROBJ,
            'rest2': RESTOBJ,
            'rhythm2': RHYTHMOBJ,
            'rhythmicdot': DOTOBJ,
            'rhythmruler': RHYTHMRULEROBJ,
            'ridebell': RIDEBELLOBJ,
            'sawtooth': SAWTOOTHOBJ,
            'setbpm': BPMOBJ,
            'setdrum': SETDRUMOBJ,
            'setkey2': SETKEYOBJ,
            'setnotevolume2': VOLOBJ,
            'settransposition': TRANSPOBJ,
            'setturtlename': SETTURTLENAMEOBJ,
            'setvoice': SETVOICEOBJ,
            'sharp': SHARPOBJ,
            'sine': SINEOBJ,
            'sixteenthNote': SIXTEENTHOBJ,
            'sixtyfourthNote': SIXTYFOURTHOBJ,
            'skipnotes': SKIPOBJ,
            'slap': SLAPOBJ,
            'slur': SLUROBJ,
            'snare': SNAREOBJ,
            'splash': SPLASHOBJ,
            'square': SQUAREOBJ,
            'staccato': STACCATOOBJ,
            'status': STATUSOBJ,
            'steppitch': STEPPITCHOBJ,
            'stuplet': STUPLETOBJ,
            'stuplet3': STUPLET3OBJ,
            'stuplet5': STUPLET5OBJ,
            'stuplet7': STUPLET7OBJ,
            'swing': SWINGOBJ,
            'tempo': TEMPOOBJ,
            'thirtysecondNote': THIRTYSECONDOBJ,
            'tie': TIEOBJ,
            'tom': TOMOBJ,
            'tone': TONEOBJ,
            'triangle1': TRIANGLE1OBJ,
            'triangle': TRIANGLEOBJ,
            'tuplet3': TUPLETOBJ,
            'tuplet4': TUPLET4OBJ,
            'turtlenote2': TURTLENOTEOBJ,
            'turtlepitch': TURTLEPITCHOBJ,
            'vibrato': VIBRATOOBJ,
            'wholeNote': WHOLEOBJ,
            'xturtle': XTURTLEOBJ,
            'yturtle': YTURTLEOBJ,
        };

        function __myCallback (newBlock) {
            // Move the drag group under the cursor.
            paletteBlocks.findDragGroup(newBlock);
            for (var i in paletteBlocks.dragGroup) {
                paletteBlocks.moveBlockRelative(paletteBlocks.dragGroup[i], Math.round(event.stageX / palette.palettes.scale) - paletteBlocks.stage.x, Math.round(event.stageY / palette.palettes.scale) - paletteBlocks.stage.y);
            }
            // Dock with other blocks if needed
            blocks.blockMoved(newBlock);
            paletteBlocks.checkBounds();
        };

        if (moved) {
            moved = false;
            this.draggingProtoBlock = false;

            if (['namedbox', 'nameddo', 'namedcalc', 'namedarg', 'nameddoArg'].indexOf(protoblk.name) === -1 && blkname in BUILTINMACROS) {
                paletteBlocks.loadNewBlocks(BUILTINMACROS[blkname]);
                var thisBlock = paletteBlocks.blockList.length - 1;
                var topBlk = paletteBlocks.findTopBlock(thisBlock);
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
                obj[0][2] = this.protoContainers[blkname].x - paletteBlocks.stage.x;
                obj[0][3] = this.protoContainers[blkname].y - paletteBlocks.stage.y;
                paletteBlocks.loadNewBlocks(obj);

                // Ensure collapse state of new stack is set properly.
                var thisBlock = paletteBlocks.blockList.length - 1;
                var topBlk = paletteBlocks.findTopBlock(thisBlock);
                setTimeout(function() {
                    paletteBlocks.blockList[topBlk].collapseToggle();
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


var blocks = undefined;

function initPalettes(canvas, refreshCanvas, stage, cellSize, refreshCanvas, trashcan, b) {
    // Instantiate the palettes object on first load.
    var palettes = new Palettes(canvas, refreshCanvas, stage, cellSize, refreshCanvas, trashcan);
    for (var i = 0; i < BUILTINPALETTES.length; i++) {
        palettes.add(BUILTINPALETTES[i]);
    }

    // Define some globals.
    palettes.makePalettes(true);
    blocks = b;

    // Give the palettes time to load.
    // We are in no hurry since we are waiting on the splash screen.
    setTimeout(function() {
        palettes.show();
        palettes.bringToTop();
    }, 6000);
    return palettes;
};


const MODEUNSURE = 0;
const MODEDRAG = 1;
const MODESCROLL = 2;
const DECIDEDISTANCE = 20;


function makePaletteBitmap(palette, data, name, callback, extras) {
    // Async creation of bitmap from SVG data
    // Works with Chrome, Safari, Firefox (untested on IE)
    var img = new Image();
    img.onload = function() {
        var bitmap = new createjs.Bitmap(img);
        callback(palette, name, bitmap, extras);
    };

    img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(data)));
};
