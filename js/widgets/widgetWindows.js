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

window.widgetWindows = { openWindows: {}, _posCache: {} };

function WidgetWindow(key, title) {
    // Keep a refernce to the object within handlers
    this._key = key;

    const create = (base, className, parent) => {
        let el = document.createElement(base);
        if (className) el.className = className;
        if (parent) parent.append(el);
        return el;
    };

    let windows = docById("floatingWindows");
    this._frame = create("div", "windowFrame", windows);

    this._drag = create("div", "wfTopBar", this._frame);
    this._handle = create("div", "wfHandle", this._drag);

    let closeButton = create("div", "wftButton close", this._drag);
    let rollButton = create("div", "wftButton rollup", this._drag);

    let titleEl = create("div", "wftTitle", this._drag);
    titleEl.innerHTML = _(title);
    titleEl.id = key + "WidgetID";

    let maxminButton = create("div", "wftButton wftMaxmin", this._drag);
    this._maxminIcon = create("img", undefined, maxminButton);
    this._maxminIcon.setAttribute("src", "header-icons/icon-expand.svg");

    this._body = create("div", "wfWinBody", this._frame);
    this._toolbar = create("div", "wfbToolbar", this._body);
    this._widget = create("div", "wfbWidget", this._body);

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

    this._visible = true;
    this._rolled = false;
    this._maximized = false;
    this._savedPos = null;
    this._first = true;

    this._buttons = [];

    // Drag offset for correct positioning
    this._dx = this._dy = 0;
    this._dragging = false;

    // Needed to keep things canvas-relative
    let canvas = docById("myCanvas");
    
    // Scrolling in window body .
    // this.top = 0;
    // scrollEvent = function (evt) {
    //     let data = evt.wheelDelta || -evt.detail;
    //     let x = docByClass("wfbWidget")[0];
    //     let l = x.getElementsByTagName("tr").length;
    //     if (data < 0) {
    //         if (x.getElementsByTagName("tr")[this.top] != null) {
    //             x.getElementsByTagName("tr")[this.top].style.display = "none";
    //             this.top = this.top == l ? l : this.top + 1;
    //         }
    //     } else if (data > 0) {
    //         x.getElementsByTagName("tr")[this.top--].style.display = "";
    //         this.top = this.top < 0 ? 0 : this.top;
    //     }
    // };
    const disableScroll = () => {
        // Get the current page scroll position 
        scrollTop =
            window.pageYOffset || document.documentElement.scrollTop;
        scrollLeft =
            window.pageXOffset || document.documentElement.scrollLeft,

            // if any scroll is attempted, 
            // set this to the previous value 
            window.onscroll = ()=> {
                window.scrollTo(scrollLeft, scrollTop);
            };
    }


    this._widget.addEventListener("wheel", disableScroll, false);
    this._widget.addEventListener("DOMMouseScroll", disableScroll, false);
    
    // Global watcher to track the mouse
    document.addEventListener("mousemove", (e)=> {
        if (!this._dragging) return;

        let x = e.clientX - this._dx,
            y = e.clientY - this._dy;

        this.setPosition(x, y);
    });

    document.addEventListener("mousedown", (e)=> {
        if (e.target === this._frame || this._frame.contains(e.target)) {
            this._frame.style.opacity = "1";
            this._frame.style.zIndex = "1";
        } else {
            this._frame.style.opacity = ".7";
            this._frame.style.zIndex = "0";
        }
    });

    // The title may change, as with the Help Widget.
    this.updateTitle = (title) => {
        let wftTitle = docById(this._key + "WidgetID");
        wftTitle.innerHTML = title;
    };

    // The handle needs the events bound as it's a sibling of the dragging div
    // not a relative in either direciton.
    this._drag.onmousedown = this._handle.onmousedown = (e)=> {
        this._dragging = true;
        if (this._maximized) {
            // Perform special repositioning to make the drag feel right when
            // restoring a window from maximized.
            let bcr = this._drag.getBoundingClientRect();
            let dx = (bcr.left - e.clientX) / (bcr.right - bcr.left);
            let dy = bcr.top - e.clientY;

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

    document.addEventListener("mouseup", (e)=> {
        this._dragging = false;
    });

    // Wrapper to allow overloading
    closeButton.onclick = (e)=> {
        this.close();

        e.preventDefault();
        e.stopPropagation();
    };

    rollButton.onclick = (e)=> {
        if (this._rolled) this.unroll();
        else this.rollup();
        this.takeFocus();

        e.preventDefault();
        e.stopPropagation();
    };

    maxminButton.onclick = maxminButton.onmousedown = (e)=> {
        if (this._maximized) this.restore();
        else this.maximize();
        this.takeFocus();
        this.onmaximize();
        e.preventDefault();
        e.stopImmediatePropagation();
    };

    this.takeFocus = ()=> {
        let siblings = windows.children;
        for (let i = 0; i < siblings.length; i++) {
            siblings[i].style.zIndex = "0";
            siblings[i].style.opacity = ".7";
        }
        this._frame.style.zIndex = "1";
        this._frame.style.opacity = "1";
    };

    this.addButton = (icon, iconSize, label, parent) => {
        let el = create("div", "wfbtItem", parent || this._toolbar);
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
    };

    this.addInputButton = (initial, parent) => {
        let el = create("div", "wfbtItem", parent || this._toolbar);
        el.innerHTML = '<input value="' + initial + '" />';
        return el.querySelector("input");
    };

    this.addRangeSlider = (initial, parent, min, max, classNm) => {
        let el = create("div", "wfbtItem", parent || this._toolbar);
        el.style.height = "250px"
        el.innerHTML =   '<input type="range" class="'+classNm+'"  min="'+min+'" max="'+max+'" value="'+initial+'">'
        let slider = el.querySelector("input");
        slider.style = " position:absolute;transform:rotate(270deg);height:10px;width:57%;"
        return slider;
    };

    this.addSelectorButton = (list, initial, parent) => {
        let el = create("div", "wfbtItem", parent || this._toolbar);
        el.innerHTML = '<select value="' + initial + '" />';
        let selector = el.querySelector("select");
        for (let i of list) {
            let newOption = new Option('turtle '+i,i);
            selector.add(newOption);
        }
        return selector;
    };

    this.addDivider = ()=> {
        let el = create("div", "wfbtHR", this._toolbar);
        return el;
    };

    this.modifyButton = (index, icon, iconSize, label) => {
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
    };

    this.getWidgetBody = ()=> {
        return this._widget;
    };

    this.getDragElement = ()=> {
        return this._drag;
    };

    this.onclose = ()=> {
        this.destroy();
    };

    this.destroy = ()=> {
        this._frame.remove();

        window.widgetWindows.openWindows[this._key] = undefined;
    };

    this.onmaximize = ()=> {
        return this;
    };

    this.show = ()=> {
        this._frame.style.display = "block";
    };

    this.setPosition = (x, y) => {
        this._frame.style.left = x + "px";
        this._frame.style.top = Math.max(y, 64) + "px";
        window.widgetWindows._posCache[this._key] = [x, Math.max(y, 64)];

        return this;
    };

    this.sendToCenter = ()=> {
        let fRect = this._frame.getBoundingClientRect();
        let cRect = canvas.getBoundingClientRect();

        if (cRect.width === 0 || cRect.height === 0) {
            // The canvas isn't shown so we set some approximate numbers
            this.setPosition(
                200,
                140
            )
            return this;
        }

        this.setPosition(
            (cRect.width - fRect.width) / 2,
            (cRect.height - fRect.height) / 2
        );

        return this;
    };

    this.isVisible = ()=> {
        return this._visible;
    };

    this.clear = ()=> {
        this._widget.innerHTML = "";
        this._toolbar.innerHTML = "";

        return this;
    };

    this.rollup = ()=> {
        this._rolled = true;
        this._body.style.display = "none";
        return this;
    };

    this.unroll = ()=> {
        this._rolled = false;
        this._body.style.display = "flex";
        return this;
    };

    this.maximize = ()=> {
        this._maxminIcon.setAttribute("src", "header-icons/icon-contract.svg");
        this._maximized = true;
        this.unroll();
        this.takeFocus();

        this._savedPos = [this._frame.style.left, this._frame.style.top];
        this._frame.style.width = "100vw";
        this._frame.style.height = "calc(100vh - 64px)";
        this._frame.style.left = "0";
        this._frame.style.top = "64px";
    };

    this.restore = ()=> {
        this._maxminIcon.setAttribute("src", "header-icons/icon-expand.svg");
        this._maximized = false;

        if (this._savedPos) {
            this._frame.style.left = this._savedPos[0];
            this._frame.style.top = this._savedPos[1];
            this._savedPos = null;
        }
        this._frame.style.width = "auto";
        this._frame.style.height = "auto";
    };

    this.close = ()=> {
        this.onclose();
    };

    if (!!window.widgetWindows._posCache[this._key]) {
        let _pos = window.widgetWindows._posCache[this._key];
        this.setPosition(_pos[0], _pos[1]);
    }
    this.takeFocus();
}

window.widgetWindows.windowFor = (widget, title, saveAs) => {
    let key = undefined;
    // Check for a blockNo attribute
    if (typeof widget.blockNo !== "undefined") key = widget.blockNo;
    // Fall back on the next best thing we have
    else key = saveAs || title;

    if (typeof window.widgetWindows.openWindows[key] === "undefined") {
        let win = new WidgetWindow(key, title).sendToCenter();
        window.widgetWindows.openWindows[key] = win;
    }

    return window.widgetWindows.openWindows[key].unroll();
};

window.widgetWindows.clear = (name) => {
    let win = window.widgetWindows.openWindows[name];
    if (!win) return;
    if (typeof win.onclose === "function") win.onclose();
};

window.widgetWindows.isOpen = (name) => {
    return window.widgetWindows.openWindows[name] ? true : "";
};

window.widgetWindows.hideAllWindows = ()=> {
    Object.values(window.widgetWindows.openWindows).forEach(win => {
        if (win !== undefined) win._frame.style.display = "none";
    });
};

window.widgetWindows.hideWindow = (name) => {
    let win = window.widgetWindows.openWindows[name];
    if (!win) return;
    win._frame.style.display = "none";
};

window.widgetWindows.showWindows = ()=> {
    Object.values(window.widgetWindows.openWindows).forEach(win => {
        if (win !== undefined) win._frame.style.display = "block";
    });
};
