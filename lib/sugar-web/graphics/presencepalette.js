/*
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Sugar Labs
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
define(["sugar-web/graphics/palette"], function (palette) {

    'use strict';

    var presencepalette = {};

    presencepalette.PresencePalette = function (invoker, primaryText, menuData) {
        palette.Palette.call(this, invoker, primaryText);

		this.sharedEvent = document.createEvent("CustomEvent");
		this.sharedEvent.initCustomEvent('shared', true, true, {});

		var div = document.createElement('div');
		var txt = document.createElement('span');
		txt.innerHTML = "Private";
		txt.className = 'network-text';
		var hr = document.createElement('hr');
		var privatebutton = document.createElement('button');
		privatebutton.className = 'toolbutton';
		privatebutton.setAttribute('id','private-button');
		privatebutton.onclick = function() {
			that.setShared(false);
		};
		var sharedbutton = document.createElement('button');
		sharedbutton.className = 'toolbutton';
		sharedbutton.setAttribute('id','shared-button');
		sharedbutton.onclick = function() {
			that.setShared(true);
		};
		this.setShared = function(state) {
			if (state) {
				txt.innerHTML = "My neighborhood";
				privatebutton.disabled = true;
				sharedbutton.disabled = true;
				invoker.style.backgroundImage = 'url(lib/sugar-web/graphics/icons/actions/zoom-neighborhood.svg)';
				that.getPalette().childNodes[0].style.backgroundImage = 'url(lib/sugar-web/graphics/icons/actions/zoom-neighborhood.svg)';
				that.getPalette().dispatchEvent(that.sharedEvent);
			} else {
				txt.innerHTML = "Private";
				privatebutton.disabled = false;
				sharedbutton.disabled = false;
			}
		};

		div.appendChild(txt);
		div.appendChild(hr);
		div.appendChild(privatebutton);
		div.appendChild(sharedbutton);
    var usersDiv = document.createElement('div');
    usersDiv.setAttribute("id", "presence-users");
    div.appendChild(usersDiv);

		this.setContent([div]);

        // Pop-down the palette when a item in the menu is clicked.

        this.buttons = div.querySelectorAll('button');
        var that = this;

        function popDownOnButtonClick(event) {
            that.popDown();
        }

        for (var i = 0; i < this.buttons.length; i++) {
			if (this.buttons[i].id == "shared-button")
				this.buttons[i].addEventListener('shared', popDownOnButtonClick);
        }
    };

    var addEventListener = function (type, listener, useCapture) {
        return this.getPalette().addEventListener(type, listener, useCapture);
    };

    presencepalette.PresencePalette.prototype =
        Object.create(palette.Palette.prototype, {
            addEventListener: {
                value: addEventListener,
                enumerable: true,
                configurable: true,
                writable: true
            }
        });
	presencepalette.PresencePalette.prototype.setShared = function(state) {
		this.setShared(state);
	};

    return presencepalette;
});
