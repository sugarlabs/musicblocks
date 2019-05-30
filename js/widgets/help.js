// Copyright (c) 2016-18 Walter Bender
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// This widget displays help about a block or a button.


function HelpWidget () {
    const BUTTONDIVWIDTH = 476;  // 8 buttons 476 = (55 + 4) * 8
    const BUTTONSIZE = 53;
    const ICONSIZE = 32;
    const HELPWIDTH = 400;
    const HELPHEIGHT = 600;

    this.init = function (blocks) {
        var w = window.innerWidth;
        var iconSize = ICONSIZE;

        var canvas = docById('myCanvas');

        // help page
        var page = 0;

        // Position the widget and make it visible.
        var helpDiv = docById('helpDiv');
        helpDiv.style.display = '';
        helpDiv.style.visibility = 'visible';
        helpDiv.setAttribute('draggable', 'true');
        helpDiv.style.left = '200px';
        helpDiv.style.top = '150px';

        // The widget buttons
        var widgetButtonsDiv = docById('helpButtonsDiv');
        widgetButtonsDiv.style.display = 'inline';
        widgetButtonsDiv.style.visibility = 'visible';
        widgetButtonsDiv.style.width = BUTTONDIVWIDTH;
        widgetButtonsDiv.innerHTML = '<table cellpadding="0px" id="helpButtonTable"></table>';

        var buttonTable = docById('helpButtonTable');
        var header = buttonTable.createTHead();
        var row = header.insertRow(0);

        // For the button callbacks
        var that = this;

        if (blocks === null) {
            var cell = this._addButton(row, 'up.svg', ICONSIZE, _('Previous page'));

            cell.onclick=function() {
                page = page - 1;
                if (page < 0) {
                    page = HELPCONTENT.length - 1;
                }

                that._showPage(page);
            };

            cell.onmouseover=function() {
                this.style.backgroundColor = platformColor.selectorSelected;
            };

            cell.onmouseout=function() {
                this.style.backgroundColor = platformColor.selectorBackground;
            };

            var cell = this._addButton(row, 'down.svg', ICONSIZE, _('Next page'));

            cell.onclick=function() {
                page = page + 1;
                if (page === HELPCONTENT.length) {
                    page = 0;
                }

                that._showPage(page);
            };

            cell.onmouseover=function() {
                this.style.backgroundColor = platformColor.selectorSelected;
            };

            cell.onmouseout=function() {
                this.style.backgroundColor = platformColor.selectorBackground;
            };
        } else {
            if (blocks.activeBlock.name === null) {
                helpDiv.style.display = 'none';
            } else {
                var label = blocks.blockList[blocks.activeBlock].protoblock.staticLabels[0];
            }

<<<<<<< HEAD
            // var cell = this._addLabel(row, ICONSIZE, label);
            topDiv.innerHTML = label;
            var rightArrow = document.getElementById("right-arrow");
            // rightArrow.style.opacity = "0";
            rightArrow.style.display = "none";
            rightArrow.classList.remove('hover');

            var leftArrow = document.getElementById("left-arrow");
            // leftArrow.style.opacity = "0";
            leftArrow.style.display = "none";
            leftArrow.classList.remove('hover');
        }
=======
            var cell = this._addLabel(row, ICONSIZE, label);
	}
>>>>>>> fd4213781a3e53989d4fe40ef6348b89fd3a67b4

        var cell = this._addButton(row, 'close-button.svg', ICONSIZE, _('Close'));

        cell.onclick=function() {
            helpDiv.style.display = 'none';
        };

        cell.onmouseover=function() {
            this.style.backgroundColor = platformColor.selectorSelected;
        };

        cell.onmouseout=function() {
            this.style.backgroundColor = platformColor.selectorBackground;
        };

        // We use this cell as a handle for dragging.
        var dragCell = this._addButton(row, 'grab.svg', ICONSIZE, _('Drag'));
        dragCell.style.cursor = 'move';

        this._dx = dragCell.getBoundingClientRect().left - helpDiv.getBoundingClientRect().left;
        this._dy = dragCell.getBoundingClientRect().top - helpDiv.getBoundingClientRect().top;
        this._dragging = false;
        this._target = false;
        this._dragCellHTML = dragCell.innerHTML;

        dragCell.onmouseover = function(e) {
            // In order to prevent the dragged item from triggering a
            // browser reload in Firefox, we empty the cell contents
            // before dragging.
            dragCell.innerHTML = '';
        };

        dragCell.onmouseout = function(e) {
            if (!that._dragging) {
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        canvas.ondragover = function(e) {
            e.preventDefault();
        };

        canvas.ondrop = function(e) {
            if (that._dragging) {
                that._dragging = false;
                var x = e.clientX - (dragCell.getBoundingClientRect().left - helpDiv.getBoundingClientRect().left) - BUTTONSIZE/2;
                helpDiv.style.left = x + 'px';
                var y = e.clientY - (dragCell.getBoundingClientRect().top - helpDiv.getBoundingClientRect().top) - BUTTONSIZE/2;
                helpDiv.style.top = y + 'px';
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        helpDiv.ondragover = function(e) {
            e.preventDefault();
        };

        helpDiv.ondrop = function(e) {
            if (that._dragging) {
                that._dragging = false;
                var x = e.clientX - (dragCell.getBoundingClientRect().left - helpDiv.getBoundingClientRect().left) - BUTTONSIZE/2;
                helpDiv.style.left = x + 'px';
                var y = e.clientY - (dragCell.getBoundingClientRect().top - helpDiv.getBoundingClientRect().top) - BUTTONSIZE/2;
                helpDiv.style.top = y + 'px';
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        helpDiv.onmousedown = function(e) {
            that._dragging = true;
            that._target = e.target;
        };

        helpDiv.ondragstart = function(e) {
            if (dragCell.contains(that._target)) {
                e.dataTransfer.setData('text/plain', '');
            } else {
                e.preventDefault();
            }
        };

        if (blocks === null) {
            // display help menu
            this._showPage(0);
        } else {
            // display help for this block
            if (blocks.activeBlock.name === null) {
                helpDiv.style.display = 'none';
            } else {
                var name = blocks.blockList[blocks.activeBlock].name;

                if (name in BLOCKHELP) {
                    var helpBody = docById('helpBodyDiv');

                    body = '';
                    if (BLOCKHELP[name].length > 1) {
                        var path = BLOCKHELP[name][1];
                        // We need to add a case here whenever we add
                        // help artwort support for a new language.
                        // e.g., documentation-es
<<<<<<< HEAD
                        var language = localStorage.languagePreference;
                        if (language === undefined) {
                            language = navigator.language;
                        }
=======
			var language = localStorage.languagePreference;
			if (language === undefined) {
			    language = navigator.language;
			}
>>>>>>> fd4213781a3e53989d4fe40ef6348b89fd3a67b4

                        switch(language) {
                        case 'ja':
                            if (localStorage.kanaPreference == 'kana') {
                                path = path + '-kana';
                            } else {
                                path = path + '-ja';
                            }
                            break;
                        case 'es':
                            path = path + '-es';
                            break;
                        default:
                            break;
                        }

                        body = body + '<p><img src="' + path + '/' + BLOCKHELP[name][2] + '"></p>';
                    }

                    body = body + '<p>' + BLOCKHELP[name][0] + '</p>';

                    body += '<img src="header-icons/export-chunk.svg" id="loadButton" width="32" height="32" alt=' + _('Load blocks') + '/>';

                    helpBody.innerHTML = body;

                    var loadButton = docById('loadButton');
                    if (loadButton !== null) {
                        loadButton.onclick = function() {
                            if (BLOCKHELP[name].length < 4) {
                                // If there is nothing specified, just
                                // load the block.
                                console.log('CLICK: ' + name);
                                var obj = blocks.palettes.getProtoNameAndPalette
(name);
                                var protoblk = obj[0];
                                var paletteName = obj[1];
                                var protoName = obj[2];

                                var protoResult = blocks.protoBlockDict.hasOwnProperty(protoName);
                                if (protoResult) {
                                    blocks.palettes.dict[paletteName].makeBlockFromSearch(protoblk, protoName, function (newBlock) {
                                        blocks.moveBlock(newBlock, 100, 100);
                                    });
                                }
                            } else if (typeof(BLOCKHELP[name][3]) === 'string') {
                                // If it is a string, load the macro
                                // assocuated with this block
                                var blocksToLoad = getMacroExpansion(BLOCKHELP[name][3], 100, 100);
                                console.log('CLICK: ' + blocksToLoad);
                                blocks.loadNewBlocks(blocksToLoad);
                            } else {
                                // Load the blocks.
                                var blocksToLoad = BLOCKHELP[name][3];
                                console.log('CLICK: ' + blocksToLoad);
                                blocks.loadNewBlocks(blocksToLoad);
                            }
                        };
                    }
                } else {
                    helpDiv.style.display = 'none';
                }
            }
        }
    };

    this._showPage = function(page) {
        var helpBody = docById('helpBodyDiv');
        var body = '';
        if ([_('Welcome to Music Blocks'), _('Meet Mr. Mouse!'), _('Guide'), _('About'), _('Congratulations.')].indexOf(HELPCONTENT[page][0]) !== -1) {
            body = body + '<p>&nbsp;<img src="' + HELPCONTENT[page][2] + '"></p>';
        } else {
            body = body + '<p>&nbsp;<img src="' + HELPCONTENT[page][2] + '"width="64px" height="64px"></p>';
        }
        body = body + '<h1>' + HELPCONTENT[page][0] + '</h1>';
        body = body + '<p>' + HELPCONTENT[page][1] + '</p>';

        if (HELPCONTENT[page].length > 3) {
            var link = HELPCONTENT[page][3];
	    console.log(page + ' ' + link);
            body = body + '<p><a href="' + link + '" target="_blank">' + HELPCONTENT[page][4] + '</a></p>';
        }

    helpBody.innerHTML = body;
    };

    this.showPageByName = function(pageName) {
        for (var i = 0; i < HELPCONTENT.length; i++) {
            if (HELPCONTENT[i].includes(pageName)) {
                this._showPage(i);
            }
        }
};

    this._addButton = function(row, icon, iconSize, label) {
        var cell = row.insertCell(-1);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/' + icon + '" title="' + label + '" alt="' + label + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
        cell.style.width = BUTTONSIZE + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = cell.style.width;
        cell.style.minHeight = cell.style.height;
        cell.style.maxHeight = cell.style.height;
        cell.style.backgroundColor = platformColor.selectorBackground;

        cell.onmouseover=function() {
            this.style.backgroundColor = platformColor.selectorSelected;
        }

        cell.onmouseout=function() {
            this.style.backgroundColor = platformColor.selectorBackground;
        }

        return cell;
    };

    this._addLabel = function(row, iconSize, label) {
        var cell = row.insertCell(-1);
        cell.innerHTML = '&nbsp;&nbsp;' + label + '&nbsp;&nbsp;';
        cell.style.height = cell.style.width;
        cell.style.minHeight = cell.style.height;
        cell.style.maxHeight = cell.style.height;
        cell.style.backgroundColor = platformColor.selectorBackground;

        return cell;
    };

    this.hide = function () {
        docById('helpDiv').style.visibility = 'hidden';
        docById('helpButtonsDiv').style.visibility = 'hidden';

        for (var i = 0; i < this.BPMs.length; i++) {
            docById('helpCanvas' + i).style.visibility = 'hidden';
        }

        if (this._intervalID != null) {
            clearInterval(this._intervalID);
        }
    }
};
