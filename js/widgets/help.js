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
    // const BUTTONSIZE = 53;
    const BUTTONSIZE = 82;
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

        var topDiv = document.createElement('div');
        // topDiv.style.position = "absolute";
        // topDiv.style.top = "0";
        topDiv.classList.add('top-wrapper');

        helpDiv.appendChild(topDiv);

        // For the button callbacks
        var that = this;

        if (blocks === null) {
            topDiv.innerHTML = "Take a Tour";
            var rightArrow = document.getElementById("right-arrow");
            rightArrow.style.display = "block";
            rightArrow.classList.add('hover');

            var leftArrow = document.getElementById("left-arrow");
            leftArrow.style.display = "block";
            leftArrow.classList.add('hover');

            var cell = docById("left-arrow");

            cell.onclick=function() {
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
            if (blocks.activeBlock.name === null) {
                helpDiv.style.display = 'none';
            } else {
                var label = blocks.blockList[blocks.activeBlock].protoblock.staticLabels[0];
	    }

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

        var cell = document.createElement('div');
        cell.classList.add('close-button');
        topDiv.appendChild(cell);

        cell.onclick=function() {
            helpDiv.style.display = 'none';
        };

        var dragCell = document.createElement("div");
        dragCell.classList.add('drag-button');
        topDiv.appendChild(dragCell);

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
                var x = e.clientX - (dragCell.getBoundingClientRect().left - helpDiv.getBoundingClientRect().left) - BUTTONSIZE / 2;
                helpDiv.style.left = x + 'px';
                var y = e.clientY - (dragCell.getBoundingClientRect().top - helpDiv.getBoundingClientRect().top) - BUTTONSIZE / 2;
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
			            var language = localStorage.languagePreference;
			            if (language === undefined) {
			                language = navigator.language;
			            }

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
                    helpBody.innerHTML = body;
                } else {
                    helpDiv.style.display = 'none';
                }
            }
        }
    };

    this._showPage = function(page) {
        var helpBody = docById('helpBodyDiv');
        var body = '';
        body = body + '<p>&nbsp;<img src="' + HELPCONTENT[page][2] + '"></p>';
        body = body + '<h1>' + HELPCONTENT[page][0] + '</h1>';
        body = body + '<p>' + HELPCONTENT[page][1] + '</p>';
        
        if (HELPCONTENT[page].length > 3) {
            var link = HELPCONTENT[page][3];
            console.log(page + ' ' + link);
            body = body + '<p><a href="' + link + '" target="_blank">' + HELPCONTENT[page][4] + '</a></p>';
        }
        
    helpBody.style.color = "#505050";
    helpBody.innerHTML = body;
    };

    this.showPageByName = function(pageName) {
        for (var i = 0; i < HELPCONTENT.length; i++) {
            if (HELPCONTENT[i].includes(pageName)) {
                this._showPage(i);
            }
        }
};

    // this._addLabel = function(row, iconSize, label) {
    //     var cell = row.insertCell(-1);
    //     cell.innerHTML = '&nbsp;&nbsp;' + label + '&nbsp;&nbsp;';
    //     cell.style.height = cell.style.width;
    //     cell.style.minHeight = cell.style.height;
    //     cell.style.maxHeight = cell.style.height;
    //     // cell.style.backgroundColor = platformColor.selectorBackground;
    //     cell.style.backgroundColor = '#2196F3';

    //     return cell;
    // };

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
