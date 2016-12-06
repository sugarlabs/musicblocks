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
