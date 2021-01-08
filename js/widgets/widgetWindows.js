// Copyright (c) 2020 Bottersnike
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*global _, docById*/

/*
     Globals location
     - js/utils/utils.js
         _, docById
 */

window.widgetWindows = { openWindows: {}, _posCache: {} };

class WidgetWindow {
    constructor(key, title) {
        // Keep a refernce to the object within handlers
        this._key = key;
        this._visible = true;
        this._rolled = false;
        this._maximized = false;
        this._savedPos = null;
        this._first = true;

        this._buttons = [];

        // Drag offset for correct positioning
        this._dx = this._dy = 0;
        this._dragging = false;

        const windows = docById("floatingWindows");
        this._frame = this._create("div", "windowFrame", windows);

        this._drag = this._create("div", "wfTopBar", this._frame);
        this._handle = this._create("div", "wfHandle", this._drag);
        // The handle needs the events bound as it's a sibling of the dragging div
        // not a relative in either direciton.
        this._drag.onmousedown = this._handle.onmousedown = (e) => {
            this._dragging = true;
            if (this._maximized) {
                // Perform special repositioning to make the drag feel right when
                // restoring a window from maximized.
                let bcr = this._drag.getBoundingClientRect();
                let dx = (bcr.left - e.clientX) / (bcr.right - bcr.left);
                const dy = bcr.top - e.clientY;

                this.restore();
                this.onmaximize();

                bcr = this._drag.getBoundingClientRect();
                dx *= bcr.right - bcr.left;
                this.setPosition(e.clientX + dx, e.clientY + dy);
            }

            this.takeFocus();

            this._dx = e.clientX - this._drag.getBoundingClientRect().left;
            this._dy = e.clientY - this._drag.getBoundingClientRect().top;
            e.preventDefault();
        };

        const closeButton = this._create("div", "wftButton close", this._drag);
        closeButton.onclick = (e) => {
            this.close();

            e.preventDefault();
            e.stopPropagation();
        };

        const rollButton = this._create("div", "wftButton rollup", this._drag);
        rollButton.onclick = (e) => {
            if (this._rolled) this.unroll();
            else this.rollup();
            this.takeFocus();

            e.preventDefault();
            e.stopPropagation();
        };

        const titleEl = this._create("div", "wftTitle", this._drag);
        titleEl.innerHTML = _(title);
        titleEl.id = key + "WidgetID";

        const maxminButton = this._create("div", "wftButton wftMaxmin", this._drag);
        maxminButton.onclick = maxminButton.onmousedown = (e) => {
            if (this._maximized) this.restore();
            else this.maximize();
            this.takeFocus();
            this.onmaximize();
            e.preventDefault();
            e.stopImmediatePropagation();
        };

        this._maxminIcon = this._create("img", undefined, maxminButton);
        this._maxminIcon.setAttribute("src", "header-icons/icon-expand.svg");

        this._body = this._create("div", "wfWinBody", this._frame);
        this._toolbar = this._create("div", "wfbToolbar", this._body);

        this._widget = this._create("div", "wfbWidget", this._body);
        this._widget.addEventListener("wheel", this._disableScroll, false);
        this._widget.addEventListener("DOMMouseScroll", this._disableScroll, false);


        let language = localStorage.languagePreference;
        if (language === undefined) {
            language = navigator.language;
        }

        console.debug("language setting is " + language);
        // For Japanese, put the toolbar on the top.
        if (language === "ja") {
            this._body.style.flexDirection = "column";
            this._body.style.flexGrow = "1";
            this._toolbar.style.overflowY = "auto";
            this._toolbar.style.width = "100%";
            this._toolbar.style.display = "flex";
            this._toolbar.style.flexShrink = "0";
        }

        // Global watcher to track the mouse
        document.addEventListener("mousemove", (e) => {
            if (!this._dragging) return;

            const x = e.clientX - this._dx,
                y = e.clientY - this._dy;

            this.setPosition(x, y);
        });

        document.addEventListener("mousedown", (e) => {
            if (e.target === this._frame || this._frame.contains(e.target)) {
                this._frame.style.opacity = "1";
                this._frame.style.zIndex = "1";
            } else {
                this._frame.style.opacity = ".7";
                this._frame.style.zIndex = "0";
            }
        });

        document.addEventListener("mouseup", (e) => {
            this._dragging = false;
        });

        if (window.widgetWindows._posCache[this._key]) {
            const _pos = window.widgetWindows._posCache[this._key];
            this.setPosition(_pos[0], _pos[1]);
        }

        this.takeFocus();
    }

    _create = (base, className, parent) => {
        const el = document.createElement(base);
        if (className) el.className = className;
        if (parent) parent.append(el);
        return el;
    }

    _disableScroll = () => {
        // Get the current page scroll position
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        // if any scroll is attempted,
        // set this to the previous value
        window.onscroll = () => {
            window.scrollTo(scrollLeft, scrollTop);
        };
    }

    addInputButton = (initial, parent) => {
        const el = this._create("div", "wfbtItem", parent || this._toolbar);
        el.innerHTML = '<input value="' + initial + '" />';
        return el.querySelector("input");
    }

    addRangeSlider = (initial, parent, min, max, classNm) => {
        const el = this._create("div", "wfbtItem", parent || this._toolbar);
        el.style.height = "250px";
        el.innerHTML =
            '<input type="range" class="' +
            classNm +
            '"  min="' +
            min +
            '" max="' +
            max +
            '" value="' +
            initial +
            '">';
        const slider = el.querySelector("input");
        slider.style = " position:absolute;transform:rotate(270deg);height:10px;width:57%;";
        return slider;
    }

    addSelectorButton = (list, initial, parent) => {
        const el = this._create("div", "wfbtItem", parent || this._toolbar);
        el.innerHTML = '<select value="' + initial + '" />';
        const selector = el.querySelector("select");
        for (const i of list) {
            const newOption = new Option("turtle " + i, i);
            selector.add(newOption);
        }
        return selector;
    }

    addDivider = () => {
        const el = this._create("div", "wfbtHR", this._toolbar);
        return el;
    }

    modifyButton = (index, icon, iconSize, label) => {
        this._buttons[index].innerHTML =
            '<img src="header-icons/' +
            icon +
            '" title="' +
            label +
            '" alt="' +
            label +
            '" height="' +
            iconSize +
            '" width="' +
            iconSize +
            '" />';
        return this._buttons[index];
    }

    close = () => {
        this.onclose();
    }

    // The title may change, as with the Help Widget.
    updateTitle = (title) => {
        const wftTitle = docById(this._key + "WidgetID");
        wftTitle.innerHTML = title;
    }

    takeFocus = () => {
        const windows = docById("floatingWindows");
        const siblings = windows.children;
        for (let i = 0; i < siblings.length; i++) {
            siblings[i].style.zIndex = "0";
            siblings[i].style.opacity = ".7";
        }
        this._frame.style.zIndex = "1";
        this._frame.style.opacity = "1";
    }

    addButton = (icon, iconSize, label, parent) => {
        const el = this._create("div", "wfbtItem", parent || this._toolbar);
        el.innerHTML =
            '<img src="header-icons/' +
            icon +
            '" title="' +
            label +
            '" alt="' +
            label +
            '" height="' +
            iconSize +
            '" width="' +
            iconSize +
            '" />';
        this._buttons.push(el);
        return el;
    }

    sendToCenter = () => {
        const canvas = docById("myCanvas");
        const fRect = this._frame.getBoundingClientRect();
        const cRect = canvas.getBoundingClientRect();

        if (cRect.width === 0 || cRect.height === 0) {
            // The canvas isn't shown so we set some approximate numbers
            this.setPosition(200, 140);
            return this;
        }

        const navHeight = document.querySelector("nav").offsetHeight;
        this.setPosition(
            (cRect.width - fRect.width) / 2,
            (cRect.height - fRect.height + navHeight) / 2
        );

        return this;
    }

    restore = () => {
        this._maxminIcon.setAttribute("src", "header-icons/icon-expand.svg");
        this._maximized = false;

        if (this._savedPos) {
            this._frame.style.left = this._savedPos[0];
            this._frame.style.top = this._savedPos[1];
            this._savedPos = null;
        }
        this._frame.style.width = "auto";
        this._frame.style.height = "auto";
    }

    maximize = () => {
        this._maxminIcon.setAttribute("src", "header-icons/icon-contract.svg");
        this._maximized = true;
        this.unroll();
        this.takeFocus();

        this._savedPos = [this._frame.style.left, this._frame.style.top];
        this._frame.style.width = "100vw";
        this._frame.style.height = "calc(100vh - 64px)";
        this._frame.style.left = "0";
        this._frame.style.top = "64px";
    }

    getWidgetBody = () => {
        return this._widget;
    }

    getDragElement = () => {
        return this._drag;
    }

    onclose = () => {
        this.destroy();
    }

    destroy = () => {
        this._frame.remove();
        window.widgetWindows.openWindows[this._key] = undefined;
    }

    onmaximize = () => {
        return this;
    }

    show = () => {
        this._frame.style.display = "block";
    }

    setPosition = (x, y) => {
        this._frame.style.left = x + "px";
        this._frame.style.top = Math.max(y, 64) + "px";
        window.widgetWindows._posCache[this._key] = [x, Math.max(y, 64)];

        return this;
    }

    isVisible = () => {
        return this._visible;
    }

    clear = () => {
        this._widget.innerHTML = "";
        this._toolbar.innerHTML = "";

        return this;
    }

    rollup = () => {
        this._rolled = true;
        this._body.style.display = "none";
        return this;
    }

    unroll = () => {
        this._rolled = false;
        this._body.style.display = "flex";
        return this;
    }
}

window.widgetWindows.windowFor = (widget, title, saveAs) => {
    let key = undefined;
    // Check for a blockNo attribute
    if (typeof widget.blockNo !== "undefined") key = widget.blockNo;
    // Fall back on the next best thing we have
    else key = saveAs || title;

    if (typeof window.widgetWindows.openWindows[key] === "undefined") {
        const win = new WidgetWindow(key, title).sendToCenter();
        window.widgetWindows.openWindows[key] = win;
    }

    return window.widgetWindows.openWindows[key].unroll();
};

window.widgetWindows.clear = (name) => {
    const win = window.widgetWindows.openWindows[name];
    if (!win) return;
    if (typeof win.onclose === "function") win.onclose();
};

window.widgetWindows.isOpen = (name) => {
    return window.widgetWindows.openWindows[name] ? true : "";
};

window.widgetWindows.hideAllWindows = () => {
    Object.values(window.widgetWindows.openWindows).forEach((win) => {
        if (win !== undefined) win._frame.style.display = "none";
    });
};

window.widgetWindows.hideWindow = (name) => {
    const win = window.widgetWindows.openWindows[name];
    if (!win) return;
    win._frame.style.display = "none";
};

window.widgetWindows.showWindows = () => {
    Object.values(window.widgetWindows.openWindows).forEach((win) => {
        if (win !== undefined) win._frame.style.display = "block";
    });
};
