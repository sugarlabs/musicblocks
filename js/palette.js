// Copyright (c) 2014-16 Walter Bender
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
// mouse is over the button.
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
    this.originalSize = 55; // this is the original svg size
    this.trashcan = trashcan;
    this.initial_x = 55;
    this.initial_y = 55;
    this.firstTime = true;
    this.upIndicator = null;
    this.downIndicator = null;
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
    this.buttons = {}; // The toolbar button for each palette.

    this.visible = true;
    this.scale = 1.0;
    this.x = 0;
    this.y = this.cellSize;

    this.current = DEFAULTPALETTE;

    this.container = new createjs.Container();
    this.container.snapToPixelEnabled = true;
    this.stage.addChild(this.container);

    this.setScale = function(scale) {
        this.scale = scale;

        this._updateButtonMasks();

        for (var i in this.dict) {
            this.dict[i]._resizeEvent();
        }

        if (this.downIndicator != null) {
            this.downIndicator.y = (windowHeight() * canvasPixelRatio()) / this.scale - 27;
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
            this.refreshCanvas();
            return;
        } else {
            this.upIndicator.visible = true;
        }

        if (this.buttons[last(keys)].y + diff < windowHeight() / this.scale - this.cellSize && direction < 0) {
            this.downIndicator.visible = false;
            this.refreshCanvas();
            return;
        } else {
            this.downIndicator.visible = true;
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
        hideButtonHighlight(circles, this.stage);
    }

    this.makePalettes = function(hide) {
        function __processUpIcon(palettes, name, bitmap, args) {
            bitmap.scaleX = bitmap.scaleY = bitmap.scale = 0.4;
            palettes.stage.addChild(bitmap);
            bitmap.x = 55;
            bitmap.y = 55;
            bitmap.visible = false;
            palettes.upIndicator = bitmap;
        };

        function __processDownIcon(palettes, name, bitmap, args) {
            bitmap.scaleX = bitmap.scaleY = bitmap.scale = 0.4;
            palettes.stage.addChild(bitmap);
            bitmap.x = 55;
            bitmap.y = (windowHeight() * canvasPixelRatio()) / palettes.scale - 27;
            bitmap.visible = true;
            palettes.downIndicator = bitmap;
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
        for (var name in this.buttons) {
            this.buttons[name].visible = true;
        }
        for (var name in this.dict) {
            // this.dict[name].showMenu(true);
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
                myPalettes.dict[showPalette].showMenu();
                myPalettes.dict[showPalette]._showMenuItems();
                myPalettes.refreshCanvas();
            }, 100);
        } else {
            this.makePalettes(true);
            this.refreshCanvas();
        }
    };

    this.hide = function() {
        this._hideMenus();
        this.visible = false;
    };

    this.show = function() {
        this._showMenus();
        this.visible = true;
    };

    this.setBlocks = function(blocks) {
        paletteBlocks = blocks;
    };

    this.add = function(name) {
        this.dict[name] = new Palette(this, name);
        return this;
    };

    this.remove = function(name) {
        console.log(this.buttons);
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
            }, null, true); // once = true
        });

        // A palette button opens or closes a palette.
        this.buttons[name].on('mouseover', function(event) {
            palettes.mouseOver = true;
            var r = palettes.cellSize / 2;
            circles = showButtonHighlight(
                palettes.buttons[name].x + r, palettes.buttons[name].y + r, r,
                event, palettes.scale, palettes.stage);
        });

        this.buttons[name].on('pressup', function(event) {
            palettes.mouseOver = false;
            hideButtonHighlight(circles, palettes.stage);
        });

        this.buttons[name].on('mouseout', function(event) {
            palettes.mouseOver = false;
            hideButtonHighlight(circles, palettes.stage);
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
            var block = this.dict['action'].protoList[blk];
            if (['nameddo', 'namedcalc', 'nameddoArg', 'namedcalcArg'].indexOf(block.name) !== -1 && (block.defaults[0] === actionName || blocks.defaults == undefined)) {
                // Remove the palette protoList entry for this block.
                this.dict['action'].remove(block, actionName);
                console.log('deleting protoblocks for ' + actionName);

                // And remove it from the protoBlock dictionary.
                if (paletteBlocks.protoBlockDict['myDo_' + actionName]) {
                    // console.log('deleting protoblocks for action ' + actionName);
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
            this.show();
        }
    };

    return this;
}


// Kinda a model, but it only keeps a list of SVGs
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
            switch (protoBlock.name) {
            case 'text':
                label = _('text');
                break;
            case 'solfege':
                label = _('sol');
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
                    // Override label for do, storein, and box
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

            if (['do', 'nameddo', 'namedbox', 'namedcalc', 'doArg', 'calcArg', 'nameddoArg', 'namedcalcArg'].indexOf(protoBlock.name) != -1 && label.length > 8) {
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

            // TODO: use ES6 format so there is less "X: X"
            this.blocks.push({
                blk: blk,
                blkname: blkname,
                modname: modname,
                height: STANDARDBLOCKHEIGHT,
                label: label,
                artwork: artwork,
                artwork64: 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(artwork))),
                docks: docks,
                image: block.image,
                scale: block.scale,
                palettename: this.palette.name
            });
        }
    };
}


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
            var icon = PALETTEICONS[name]
                .replace(/#f{3,6}/gi, PALETTEFILLCOLORS[name]);
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
                           {i: icon, n: _(name)});
            html += '<ul>';
            this.models[name].update();
            for (var blk in this.models[name].blocks) {
                html += format('<li title="{label}" \
                                    data-blk="{blk}" \
                                    data-palettename="{palettename}" \
                                    data-modname="{modname}"> \
                                    <img src="{artwork64}" alt="{label}" /> \
                                </li>', this.models[name].blocks[blk]);
            }
            html += '</div>';
        }
        document.querySelector('#popdown-palette').innerHTML = html;

        document.querySelector('#popdown-palette .back')
                .addEventListener('click', function () {
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

            d.querySelector('.popout-button')
             .addEventListener('click', function () {
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

                console.log(e.dataset.blk + ' ' + e.dataset.modname);
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
        };

        var paletteWidth = MENUWIDTH + (this.columns * 160);
        this.menuContainer.removeAllChildren();

        // Create the menu button
        makePaletteBitmap(this, PALETTEHEADER.replace('fill_color', '#282828').replace('palette_label', _(this.name)).replace(/header_width/g, paletteWidth), this.name, __processHeader, null);
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
            }
        }

        for (var i in this.protoContainers) {
            this.protoContainers[i].y += this.scrollDiff;
        }
    };

    this._updateMenu = function(hide) {
        var palette = this;

        function __calculateBounds(palette, blk, modname) {
            var bounds = palette.protoContainers[modname].getBounds();
            palette.protoContainers[modname].cache(bounds.x, bounds.y, Math.ceil(bounds.width), Math.ceil(bounds.height));

            var hitArea = new createjs.Shape();
            // Trim the hitArea height slightly to make it easier to
            // select single-height blocks below double-height blocks.
            hitArea.graphics.beginFill('#FFF').drawRect(0, 0, Math.ceil(bounds.width), Math.ceil(bounds.height * 0.75));
            palette.protoContainers[modname].hitArea = hitArea;

            palette._loadPaletteMenuItemHandler(palette.protoList[blk], modname);
            palette.palettes.refreshCanvas();
        };

        function __processBitmap(palette, modname, bitmap, args) {
            var b = args[0];
            var blk = args[1];

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
                    __calculateBounds(palette, blk, modname);
                };

                image.src = b.image;
            } else {
                __calculateBounds(palette, blk, modname);
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
            }
        }

        this.y = 0;
        this.model.update();
        for (var blk in this.model.blocks) {
            var b = this.model.blocks[blk];
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

                makePaletteBitmap(this, PALETTEFILLER.replace(/filler_height/g, b.height.toString()), b.modname, __processFiller, [b, blk]);
            } else {
                this.protoContainers[b.modname].x = this.menuContainer.x;
                this.protoContainers[b.modname].y = this.menuContainer.y + this.y + this.scrollDiff + STANDARDBLOCKHEIGHT;
                this.y += Math.ceil(b.height * PROTOBLOCKSCALE);
            }
        }

        this.makeMenu(false);
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
        this.showMenu();

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
        this.menuContainer.visible = true;
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
    };;

    this.remove = function(protoblock, name) {
        // Remove the protoblock and its associated artwork container.
        console.log('removing action ' + name);
        var i = this.protoList.indexOf(protoblock);
        if (i !== -1) {
            this.protoList.splice(i, 1);
        }

        for (var i = 0; i < this.model.blocks.length; i++) {
            if (['nameddo', 'nameddoArg', 'namedcalc', 'namedcalcArg'].indexOf(this.model.blocks[i].name) !== -1 && this.model.blocks[i].label === name) {
                console.log(this.model.blocks[i]);
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
            }, null, true); // once = true
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
                    palette.hide();
                    palette.palettes.refreshCanvas();
                    // Only delete plugin palettes.
                    if (palette.name === 'myblocks') {
                        palette._promptMacrosDelete();
                    } else if (BUILTINPALETTES.indexOf(palette.name) === -1) {
                        palette._promptPaletteDelete();
                    }
                }
                trashcan.hide();
            });

            palette.menuContainer.on('mouseout', function(event) {
                if (trashcan.overTrashcan(event.stageX / palette.palettes.scale, event.stageY / palette.palettes.scale)) {
                    palette.hide();
                    palette.palettes.refreshCanvas();
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
                    trashcan.highlight();
                } else {
                    trashcan.unhighlight();
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
        const BUILTINMACROS= ['note', 'rhythmicdot', 'tie', 'dividebeatfactor', 'multiplybeatfactor', 'duplicatenotes', 'skipnotes', 'setbpm', 'drift', 'osctime', 'sharp', 'flat', 'settransposition', 'invert', 'invert2', 'staccato', 'slur', 'swing', 'crescendo', 'setnotevolume2', 'articulation', 'matrix', 'pitchdrummatrix', 'rhythmruler', 'pitchstaircase', 'turtlepitch', 'turtlenote', 'setturtlename', 'wholeNote', 'halfNote', 'quarterNote', 'eighthNote', 'sixteenthNote', 'thirtysecondNote', 'sixtyfourthNote', 'tone', 'rest2', 'tuplet2', 'fill', 'hollowline', 'note2', 'note3', 'note4', 'octave', 'fifths', 'tritone', 'fourths', 'thirds', 'steppitch', 'sine', 'triangle', 'square', 'sawtooth', 'setkey2', 'snare', 'hihat', 'kick', 'tom', 'pluck', 'triangle1', 'slap', 'fingercymbals', 'cup', 'cowbell', 'splash', 'ridebell', 'floortom', 'crash', 'chine', 'dog', 'cat', 'clap', 'bubbles', 'cricket', 'duck', 'bottle', 'clang', 'darbuka', 'setdrum', 'playdrum', 'backward', 'status'];
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

        if(BUILTINMACROS.indexOf(blkname) > -1)
        {
            moved = true;
            saveX = this.protoContainers[blkname].x;
            saveY = this.protoContainers[blkname].y;
            this._makeBlockFromProtoblock(protoblk, moved, blkname, null, saveX, saveY);
        }
        else
        {
            var newBlock = paletteBlockButtonPush(newBlk, arg);
            callback(newBlock);
        }
    };

    this._makeBlockFromProtoblock = function(protoblk, moved, blkname, event, saveX, saveY) {

        var palette = this;

        // Some blocks are expanded on load.
        const NOTEOBJ = [[0, 'note', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, 5]], [1, ['number', {'value': 8}], 0, 0, [0]], [2, 'pitch', 0, 0, [0, 3, 4, null]], [3, ['solfege', {'value': _('la')}], 0, 0, [2]], [4, ['number', {'value': 4}], 0, 0, [2]], [5, 'hidden', 0, 0, [0, null]]];
        const DOTOBJ = [[0, 'rhythmicdot', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, null, 1]], [1, 'hidden', 0, 0, [0, null]]];
        const TIEOBJ = [[0, 'tie', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, null, 1]], [1, 'hidden', 0, 0, [0, null]]];
        const DIVBEATOBJ = [[0, 'dividebeatfactor', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 2}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const MULTBEATOBJ = [[0, 'multiplybeatfactor', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 2}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const DUPOBJ = [[0, 'duplicatenotes', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 2}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const SKIPOBJ = [[0, 'skipnotes', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 2}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const BPMOBJ = [[0, 'setbpm', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 90}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const OSCTIMEOBJ = [[0, 'osctime', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 2, 1, 7]], [1, 'vspace', 0, 0, [0, 5]], [2, 'divide', 0, 0, [0, 3, 4]], [3, ['number', {'value': 1000}], 0, 0, [2]], [4, ['number', {'value': 3}], 0, 0, [2]], [5, 'triangle', 0, 0, [1, 6, null]], [6, ['number', {'value': 440}], 0, 0, [5]], [7, 'hidden', 0, 0, [0, null]]];
        const DRIFTOBJ = [[0, 'drift', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, null, 1]], [1, 'hidden', 0, 0, [0, null]]];
        const SHARPOBJ = [[0, 'sharp', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, null, 1]], [1, 'hidden', 0, 0, [0, null]]];
        const FLATOBJ = [[0, 'flat', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, null, 1]], [1, 'hidden', 0, 0, [0, null]]];
        const TRANSPOBJ = [[0, 'settransposition', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const INVERTOBJ = [[0, 'invert', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['solfege', {'value': _('sol')}], 0, 0, [0]], [2, ['number', {'value': 4}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const INVERT2OBJ = [[0, 'invert2', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null, 3]], [1, ['solfege', {'value': _('sol')}], 0, 0, [0]], [2, ['number', {'value': 4}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
        const STACCATOOBJ = [[0, 'staccato', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 32}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const SLUROBJ = [[0, 'slur', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 32}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const SWINGOBJ = [[0, 'swing', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 32}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const CRESCENDOOBJ = [[0, 'crescendo', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 5}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const VOLOBJ = [[0, 'setnotevolume2', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 50}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const ARTICULATIONOBJ = [[0, 'articulation', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['number', {'value': 25}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const MATRIXOBJ = [[0, 'matrix', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 13]], [1, 'pitch', 0, 0, [0, 2, 3, 4]], [2, ['solfege', {'value': _('sol')}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'pitch', 0, 0, [1, 5, 6, 7]], [5, ['solfege', {'value': _('mi')}], 0, 0, [4]], [6, ['number', {'value': 4}], 0, 0, [4]], [7, 'pitch', 0, 0, [4, 8, 9, 10]], [8, ['solfege', {'value': _('re')}], 0, 0, [7]], [9, ['number', {'value': 4}], 0, 0, [7]], [10, 'rhythm', 0, 0, [7, 11, 12, null]], [11, ['number', {'value': 3}], 0, 0, [10]], [12, ['number', {'value': 4}], 0, 0, [10]], [13, 'hidden', 0, 0, [0, null]]];
        const PITCHDRUMMATRIXOBJ = [[0, 'pitchdrummatrix', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 12]], [1, 'pitch', 0, 0, [0, 2, 3, 4]], [2, ['solfege', {'value': _('sol')}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'pitch', 0, 0, [1, 5, 6, 7]], [5, ['solfege', {'value': _('mi')}], 0, 0, [4]], [6, ['number', {'value': 4}], 0, 0, [4]], [7, 'pitch', 0, 0, [4, 8, 9, 10]], [8, ['solfege', {'value': _('re')}], 0, 0, [7]], [9, ['number', {'value': 4}], 0, 0, [7]], [10, 'playdrum', 0, 0, [7, 11, null]], [11, ['drumname', {'value': _('kick drum')}], 0, 0, [10]], [12, 'hidden', 0, 0, [0, null]]];
        const RHYTHMRULEROBJ = [[0, 'rhythmruler', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 4, 17]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': 1}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'setdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [4, 6, 7, 10]], [6, ['drumname', {'value': getDrumName(DEFAULTDRUM)}], 0, 0, [5]], [7, 'rhythm', 0, 0, [5, 8, 9, null]], [8, ['number', {'value': 1}], 0, 0, [7]], [9, ['number', {'value': 1}], 0, 0, [7]], [10, 'hidden', 0, 0, [5, 11]], [11, 'setdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [10, 12, 13, 16]], [12, ['drumname', {'value': getDrumName(DEFAULTDRUM)}], 0, 0, [11]], [13, 'rhythm', 0, 0, [11, 14, 15, null]], [14, ['number', {'value': 1}], 0, 0, [13]], [15, ['number', {'value': 1}], 0, 0, [13]], [16, 'hidden', 0, 0, [11, null]], [17, 'hidden', 0, 0, [0, null]]];
        const PITCHSTAIRCASEOBJ = [[0, 'pitchstaircase', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 4]], [1, 'pitch', 0, 0, [0, 2, 3, null]], [2, ['solfege', {'value': _('sol')}], 0, 0, [1]], [3, ['number', {'value': 4}], 0, 0, [1]], [4, 'hidden', 0, 0, [0, null]]];
        const TURTLEPITCHOBJ = [[0, 'turtlepitch', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, 'turtlename', 0, 0, [0]]];
        const TURTLENOTEOBJ = [[0, 'turtlenote', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, 'turtlename', 0, 0, [0]]];
        const SETTURTLENAMEOBJ = [[0, 'setturtlename', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null]], [1, 'turtlename', 0, 0, [0]], [2, ['text', {'value': 'Yertle'}], 0, 0, [0]]];
        const WHOLEOBJ = [[0, 'rhythm', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, ['number', {'value': 1}], 0, 0, [0]]];
        const HALFOBJ = [[0, 'rhythm', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, ['number', {'value': 2}], 0, 0, [0]]];
        const QUARTEROBJ = [[0, 'rhythm', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, ['number', {'value': 4}], 0, 0, [0]]];
        const EIGHTHOBJ = [[0, 'rhythm', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, ['number', {'value': 8}], 0, 0, [0]]];
        const SIXTEENTHOBJ = [[0, 'rhythm', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, ['number', {'value': 16}], 0, 0, [0]]];
        const THIRTYSECONDOBJ = [[0, 'rhythm', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, ['number', {'value': 32}], 0, 0, [0]]];
        const SIXTYFOURTHOBJ = [[0, 'rhythm', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, ['number', {'value': 64}], 0, 0, [0]]];
        const TONEOBJ = [[0, 'drift', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, 'osctime', 0, 0, [0, 3, 2, null]], [2, 'vspace', 0, 0, [1, 6]], [3, 'divide', 0, 0, [1, 4, 5]], [4, ['number', {'value': 1000}], 0, 0, [3]], [5, ['number', {'value': 3}], 0, 0, [3]], [6, 'triangle', 0, 0, [2, 7, null]], [7, ['number', {'value': 440}], 0, 0, [6]]];
        const RESTOBJ = [[0, 'note', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null]], [1, ['number', {'value': 8}], 0, 0, [0]], [2, 'rest2', 0, 0, [0, null]]];
        const TUPLETOBJ = [[0, 'tuplet2', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, 3, 6]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, ['number', {'value': 4}], 0, 0, [0]], [3, 'rhythm', 0, 0, [0, 4, 5, null]], [4, ['number', {'value': 3}], 0, 0, [3]], [5, ['number', {'value': 1}], 0, 0, [3]], [6, 'hidden', 0, 0, [0, null]]];
        const FILLOBJ = [[0, 'fill', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, null, 1]], [1, 'hidden', 0, 0, [0, null]]];
        const HOLLOWOBJ = [[0, 'hollowline', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, null, 1]], [1, 'hidden', 0, 0, [0, null]]];
        const NOTE2OBJ = [[0, 'note', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, 5]], [1, ['number', {'value': 8}], 0, 0, [0]], [2, 'pitch', 0, 0, [0, 3, 4, null]], [3, ['notename', {'value': 'A'}], 0, 0, [2]], [4, ['number', {'value': 4}], 0, 0, [2]], [5, 'hidden', 0, 0, [0, null]]];
        const NOTE3OBJ = [[0, 'note', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, 4]], [1, ['number', {'value': 8}], 0, 0, [0]], [2, 'sine', 0, 0, [0, 3, null]], [3, ['number', {'value': 440}], 0, 0, [2]], [4, 'hidden', 0, 0, [0, null]]];
        const NOTE4OBJ = [[0, 'note', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, 4]], [1, ['number', {'value': 8}], 0, 0, [0]], [2, 'playdrum', 0, 0, [0, 3, null]], [3, ['drumname', {'value': _('kick drum')}], 0, 0, [2]], [4, 'hidden', 0, 0, [0, null]]];
        const OCTAVEOBJ = [[0, 'settransposition', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, null]], [1, ['number', {'value': 12}], 0, 0, [0]]];
        const FIFTHSOBJ = [[0, 'interval', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, null]], [1, ['number', {'value': 5}], 0, 0, [0]]];
        const TRITONEOBJ = [[0, 'interval', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, null]], [1, ['number', {'value': 6}], 0, 0, [0]]];
        const FOURTHSOBJ = [[0, 'interval', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, null]], [1, ['number', {'value': 4}], 0, 0, [0]]];
        const THIRDSOBJ = [[0, 'interval', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, null]], [1, ['number', {'value': 3}], 0, 0, [0]]];
        const STEPPITCHOBJ = [[0, 'note', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, 4]], [1, ['number', {'value': 8}], 0, 0, [0]], [2, 'steppitch', 0, 0, [0, 3, null]], [3, ['number', {'value': 1}], 0, 0, [2]], [4, 'hidden', 0, 0, [0, null]]];
        const SINEOBJ = [[0, 'note', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, 4]], [1, ['number', {'value': 8}], 0, 0, [0]], [2, 'sine', 0, 0, [0, 3, null]], [3, ['number', {'value': 440}], 0, 0, [2]], [4, 'hidden', 0, 0, [0, null]]];
        const TRIANGLEOBJ = [[0, 'note', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, 4]], [1, ['number', {'value': 8}], 0, 0, [0]], [2, 'triangle', 0, 0, [0, 3, null]], [3, ['number', {'value': 440}], 0, 0, [2]], [4, 'hidden', 0, 0, [0, null]]];
        const SQUAREOBJ = [[0, 'note', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, 4]], [1, ['number', {'value': 8}], 0, 0, [0]], [2, 'square', 0, 0, [0, 3, null]], [3, ['number', {'value': 440}], 0, 0, [2]], [4, 'hidden', 0, 0, [0, null]]];
        const SAWTOOTHOBJ = [[0, 'note', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, 4]], [1, ['number', {'value': 8}], 0, 0, [0]], [2, 'sawtooth', 0, 0, [0, 3, null]], [3, ['number', {'value': 440}], 0, 0, [2]], [4, 'hidden', 0, 0, [0, null]]];
        const SETKEYOBJ = [[0, 'setkey2', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 2, null]],  [1, ['notename', {'value': 'C'}], 0, 0, [0]], [2, ['modename', {'value': 'Major'}], 0, 0, [0]]];
        const SNAREOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('snare drum')}], 0, 0, [0]]];
        const KICKOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('kick drum')}], 0, 0, [0]]];
        const HIHATOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('hi hat')}], 0, 0, [0]]];
        const TOMOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('tom tom')}], 0, 0, [0]]];
        const TRIANGLE1OBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('triangle bell')}], 0, 0, [0]]];
        const SLAPOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('slap')}], 0, 0, [0]]];
        const DUCKOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('duck')}], 0, 0, [0]]];
        const DARBUKAOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('darbuka drum')}], 0, 0, [0]]];
        const BOTTLEOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('bottle')}], 0, 0, [0]]];
        const CLANGOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('clang')}], 0, 0, [0]]];
        const FINGERCYMBALSOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('finger cymbals')}], 0, 0, [0]]];
        const CUPOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('cup drum')}], 0, 0, [0]]];
        const COWBELLOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('cow bell')}], 0, 0, [0]]];
        const SPLASHOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('splash')}], 0, 0, [0]]];
        const RIDEBELLOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('ride bell')}], 0, 0, [0]]];
        const FLOORTOMOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('floor tom tom')}], 0, 0, [0]]];
        const CRASHOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('crash')}], 0, 0, [0]]];
        const CHINEOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('chine')}], 0, 0, [0]]];
        const DOGOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('dog')}], 0, 0, [0]]];
        const CATOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('cat')}], 0, 0, [0]]];
        const CLAPOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('clap')}], 0, 0, [0]]];
        const BUBBLESOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('bubbles')}], 0, 0, [0]]];
        const CRICKETOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': _('cricket')}], 0, 0, [0]]];
        const PLUCKOBJ = [[0, 'pluck', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, null, 1]], [1, 'hidden', 0, 0, [0, null]]];
        const SETDRUMOBJ = [[0, 'setdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null, 2]], [1, ['drumname', {'value': getDrumName(DEFAULTDRUM)}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        const PLAYDRUMOBJ = [[0, 'playdrum', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, ['drumname', {'value': getDrumName(DEFAULTDRUM)}], 0, 0, [0]]];
        const BACKWARDOBJ = [[0, 'backward', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, null]], [1, 'hidden', 0, 0, [0, null]]];
	const STATUSOBJ = [[0, 'status', this.protoContainers[blkname].x - paletteBlocks.stage.x, this.protoContainers[blkname].y - paletteBlocks.stage.y, [null, 1, 8]], [1, 'hidden', 0, 0, [0, 2]], [2, ["print", {}], 0, 0, [1, 3, 4]], [3, ["key", {}], 0, 0, [2]], [4, ["print", {}], 0, 0, [2, 5, 6]], [5, ["bpmfactor", {}], 0, 0, [4]], [6, ["print", {}], 0, 0, [4, 7, null]], [7, ["notevolumefactor", {}], 0, 0, [6]], [8, 'hidden', 0, 0, [0, null]]];

        const BUILTINMACROS = {'note': NOTEOBJ,
                               'rhythmicdot': DOTOBJ,
                               'tie': TIEOBJ,
                               'dividebeatfactor': DIVBEATOBJ,
                               'multiplybeatfactor': MULTBEATOBJ,
                               'duplicatenotes': DUPOBJ,
                               'skipnotes': SKIPOBJ,
                               'setbpm': BPMOBJ,
                               'drift': DRIFTOBJ,
                               'osctime': OSCTIMEOBJ,
                               'sharp': SHARPOBJ,
                               'flat': FLATOBJ,
                               'settransposition': TRANSPOBJ,
                               'invert': INVERTOBJ,
                               'invert2': INVERT2OBJ,
                               'staccato': STACCATOOBJ,
                               'slur': SLUROBJ,
                               'swing': SWINGOBJ,
                               'crescendo': CRESCENDOOBJ,
                               'setnotevolume2': VOLOBJ,
                               'articulation': ARTICULATIONOBJ,
                               'matrix': MATRIXOBJ,
                               'pitchdrummatrix': PITCHDRUMMATRIXOBJ,
                               'rhythmruler': RHYTHMRULEROBJ,
                               'pitchstaircase': PITCHSTAIRCASEOBJ,
                               'turtlepitch': TURTLEPITCHOBJ,
                               'turtlenote': TURTLENOTEOBJ,
                               'setturtlename': SETTURTLENAMEOBJ,
                               'wholeNote': WHOLEOBJ,
                               'halfNote': HALFOBJ,
                               'quarterNote': QUARTEROBJ,
                               'eighthNote': EIGHTHOBJ,
                               'sixteenthNote': SIXTEENTHOBJ,
                               'thirtysecondNote': THIRTYSECONDOBJ,
                               'sixtyfourthNote': SIXTYFOURTHOBJ,
                               'tone': TONEOBJ,
                               'rest2': RESTOBJ,
                               'tuplet2': TUPLETOBJ,
                               'fill': FILLOBJ,
                               'hollowline': HOLLOWOBJ,
                               'note2': NOTE2OBJ,
                               'note3': NOTE3OBJ,
                               'note4': NOTE4OBJ,
                               'octave': OCTAVEOBJ,
                               'fifths': FIFTHSOBJ,
                               'tritone': TRITONEOBJ,
                               'fourths': FOURTHSOBJ,
                               'thirds': THIRDSOBJ,
                               'steppitch': STEPPITCHOBJ,
                               'sine': SINEOBJ,
                               'triangle': TRIANGLEOBJ,
                               'square': SQUAREOBJ,
                               'sawtooth': SAWTOOTHOBJ,
                               'setkey2': SETKEYOBJ,
                               'snare': SNAREOBJ,
                               'hihat': HIHATOBJ,
                               'kick': KICKOBJ,
                               'tom': TOMOBJ,
                               'pluck': PLUCKOBJ,
                               'triangle1': TRIANGLE1OBJ,
                               'slap': SLAPOBJ,
                               'fingercymbals': FINGERCYMBALSOBJ,
                               'cup': CUPOBJ,
                               'cowbell': COWBELLOBJ,
                               'splash': SPLASHOBJ,
                               'ridebell': RIDEBELLOBJ,
                               'floortom': FLOORTOMOBJ,
                               'crash': CRASHOBJ,
                               'chine': CHINEOBJ,
                               'dog': DOGOBJ,
                               'cat': CATOBJ,
                               'clap': CLAPOBJ,
                               'bubbles': BUBBLESOBJ,
                               'cricket': CRICKETOBJ,
                               'darbuka': DARBUKAOBJ,
                               'clang': CLANGOBJ,
                               'duck': DUCKOBJ,
                               'bottle': BOTTLEOBJ,
                               'setdrum': SETDRUMOBJ,
                               'playdrum': PLAYDRUMOBJ,
                               'backward': BACKWARDOBJ,
                               'status': STATUSOBJ,
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

            if (blkname in BUILTINMACROS) {
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
            this._resetLayout();

            this._updateBlockMasks();
            this.palettes.refreshCanvas();
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
    setTimeout(function() {
        palettes.show();
        palettes.bringToTop();
    }, 2000);
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
