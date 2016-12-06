define(function () {

    'use strict';

    var palettesGroup = [];

    function getOffset(elem) {
        // Ugly hack to consider the palette margin.
        var style = elem.currentStyle || window.getComputedStyle(elem, '');

        // Remove 'px' from the strings.
        var x = -2 * style.marginLeft.slice(0, -2);
        var y = -1 * style.marginTop.slice(0, -2);

        var rect = elem.getBoundingClientRect();
        x += rect.left;
        y += rect.top;
        return {
            top: y,
            left: x,
            width: rect.width,
            height: rect.height
        };
    }

    var palette = {};

    palette.Palette = function (invoker, primaryText) {
        this.invoker = invoker;
        if (this.invoker.classList.contains("toolbutton")) {
            this.invoker.classList.add("invoker");
        }
        this.primaryText = primaryText;
        var paletteElem;
        var wrapperElem;
        var headerElem;
        var headerSeparatorElem;
        var containerElem;
        var that = this;
        palettesGroup.push(this);

        invoker.addEventListener('click', function (event) {
            if (!that.invoker.classList.contains("toolbutton")) {
                updatePosition(event.x, event.y);
            }
            that.toggle();
        });

        function updatePosition(clickX, clickY) {
            var paletteX;
            var paletteY;

            if (typeof (clickX) !== 'undefined' &&
                typeof (clickY) !== 'undefined') {
                paletteX = clickX;
                paletteY = clickY;
            } else {
                var invokerOffset = getOffset(that.invoker);
                paletteX = invokerOffset.left;
                paletteY = invokerOffset.top;
            }

            paletteElem.style.left = paletteX + "px";
            paletteElem.style.top = paletteY + "px";
        }

        // A palette element can have a header, content, one or both.

        function createPaletteElement() {
            if (paletteElem !== undefined) {
                return;
            }
            paletteElem = document.createElement('div');
            paletteElem.className = "palette";
            paletteElem.style.visibility = "hidden";
            document.body.appendChild(paletteElem);

            if (that.invoker.classList.contains("toolbutton")) {
                var invokerElem = document.createElement('div');
                invokerElem.className = "palette-invoker";
                var style = that.invoker.currentStyle ||
                    window.getComputedStyle(that.invoker, '');
                invokerElem.style.backgroundImage = style.backgroundImage;

                invokerElem.addEventListener('click', function (e) {
                    that.toggle();
                });

                paletteElem.appendChild(invokerElem);

            }

            wrapperElem = document.createElement('div');
            wrapperElem.className = "wrapper";
            paletteElem.appendChild(wrapperElem);

            if (that.primaryText !== undefined) {
                headerElem = document.createElement('div');
                headerElem.className = "header";
                headerElem.innerText = that.primaryText;
                wrapperElem.appendChild(headerElem);
            }

            headerSeparatorElem = document.createElement('hr');
            headerSeparatorElem.className = "header-separator";
            headerSeparatorElem.style.display = "none";
            wrapperElem.appendChild(headerSeparatorElem);

            containerElem = document.createElement('div');
            containerElem.className = "container";
            wrapperElem.appendChild(containerElem);

            updatePosition();
        }

        this.getPalette = function () {
            if (paletteElem === undefined) {
                createPaletteElement();
            }
            return paletteElem;
        };

        this.setContent = function (elementsList) {
            if (paletteElem === undefined) {
                createPaletteElement();
            }

            (function removePreviousContent() {
                for (var i = 0; i < containerElem.children.length; i++) {
                    var child = containerElem.children[i];
                    containerElem.removeChild(child);
                }
            }());

            (function addNewContent() {
                for (var i = 0; i < elementsList.length; i++) {
                    var child = elementsList[i];
                    containerElem.appendChild(child);
                }
            }());

            // The header separator will be visible only if there are
            // both, header and content.
            if (elementsList.length > 0 && this.primaryText !== undefined) {
                headerSeparatorElem.style.display = "block";
            } else {
                headerSeparatorElem.style.display = "none";
            }
        };

        this.isDown = function () {
            return paletteElem === undefined ||
                paletteElem.style.visibility == "hidden";
        };

    };

    palette.Palette.prototype.popUp = function () {
        for (var i = 0; i < palettesGroup.length; i++) {
            var otherPalette = palettesGroup[i];
            if (otherPalette != this) {
                otherPalette.popDown();
            }
        }
        this.getPalette().style.visibility = "visible";
    };

    palette.Palette.prototype.popDown = function () {
        this.getPalette().style.visibility = "hidden";
    };

    palette.Palette.prototype.toggle = function () {
        if (this.isDown()) {
            this.popUp();
        } else {
            this.popDown();
        }
    };

    return palette;

});
