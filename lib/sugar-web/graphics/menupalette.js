/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2015 Walter Bender
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

define(["sugar-web/graphics/palette",
        "text!sugar-web/graphics/menupalette.html", "mustache"], function (palette, template, mustache) {

    'use strict';

    var menupalette = {};

    menupalette.MenuPalette = function (invoker, primaryText, menuData) {
        palette.Palette.call(this, invoker, primaryText);

		this.selectItemEvent = document.createEvent("CustomEvent");
		this.selectItemEvent.initCustomEvent('selectItem', true, true, {
			'item': undefined	
		});

        var menuElem = document.createElement('ul');
        menuElem.className = "menu";
        menuElem.innerHTML = mustache.render(template, menuData);
        this.setContent([menuElem]);

        // Pop-down the palette when a item in the menu is clicked.

        this.buttons = menuElem.querySelectorAll('button');

        var that = this;

        function popDownOnButtonClick(event) {
            that.selectItemEvent.detail.target = event.target;
            that.getPalette().dispatchEvent(that.selectItemEvent);
            that.popDown();
        }

        for (var i = 0; i < this.buttons.length; i++) {
            this.buttons[i].addEventListener('click', popDownOnButtonClick);
        }
    };

    var addEventListener = function (type, listener, useCapture) {
        return this.getPalette().addEventListener(type, listener, useCapture);
    };

    menupalette.MenuPalette.prototype =
        Object.create(palette.Palette.prototype, {
            addEventListener: {
                value: addEventListener,
                enumerable: true,
                configurable: true,
                writable: true
            }
        });

    return menupalette;
});