window.widgetWindows = { openWindows: {}, _posCache: {} };

function WidgetWindow(key, title) {
    // Keep a refernce to the object within handlers
    let that = this;
    this._key = key;

    let create = function(base, className, parent) {
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

    var language = localStorage.languagePreference;
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

    // Global watcher to track the mouse
    document.addEventListener("mousemove", function(e) {
        if (!that._dragging) return;

        let x = e.clientX - that._dx,
            y = e.clientY - that._dy;

        that.setPosition(x, y);
    });

    document.addEventListener("mousedown", function(e) {
        if (e.target === that._frame || that._frame.contains(e.target)) {
            that._frame.style.opacity = "1";
            that._frame.style.zIndex = "1";
        } else {
            that._frame.style.opacity = ".7";
            that._frame.style.zIndex = "0";
        }
    });

    // The title may change, as with the Help Widget.
    this.updateTitle = function(title) {
        var wftTitle = docById(this._key + "WidgetID");
        wftTitle.innerHTML = title;
    };

    // The handle needs the events bound as it's a sibling of the dragging div
    // not a relative in either direciton.
    this._drag.onmousedown = this._handle.onmousedown = function(e) {
        that._dragging = true;
        if (that._maximized) {
            // Perform special repositioning to make the drag feel right when
            // restoring a window from maximized.
            let bcr = that._drag.getBoundingClientRect();
            let dx = (bcr.left - e.clientX) / (bcr.right - bcr.left);
            let dy = bcr.top - e.clientY;

            that.restore();
            that.onmaximize();

            bcr = that._drag.getBoundingClientRect();
            dx *= bcr.right - bcr.left;
            that.setPosition(e.clientX + dx, e.clientY + dy);
        }

        that.takeFocus();

        that._dx = e.clientX - that._drag.getBoundingClientRect().left;
        that._dy = e.clientY - that._drag.getBoundingClientRect().top;
        e.preventDefault();
    };

    document.addEventListener("mouseup", function(e) {
        that._dragging = false;
    });

    // Wrapper to allow overloading
    closeButton.onclick = function(e) {
        that.close();

        e.preventDefault();
        e.stopPropagation();
    };

    rollButton.onclick = function(e) {
        if (that._rolled) that.unroll();
        else that.rollup();
        that.takeFocus();

        e.preventDefault();
        e.stopPropagation();
    };

    maxminButton.onclick = maxminButton.onmousedown = function(e) {
        if (that._maximized) that.restore();
        else that.maximize();
        that.takeFocus();
        that.onmaximize();
        e.preventDefault();
        e.stopImmediatePropagation();
    };

    this.takeFocus = function() {
        let siblings = windows.children;
        for (let i = 0; i < siblings.length; i++) {
            siblings[i].style.zIndex = "0";
            siblings[i].style.opacity = ".7";
        }
        this._frame.style.zIndex = "1";
        this._frame.style.opacity = "1";
    };

    this.addButton = function(icon, iconSize, label, parent) {
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

    this.addInputButton = function(initial, parent) {
        let el = create("div", "wfbtItem", parent || this._toolbar);
        el.innerHTML = '<input value="' + initial + '" />';
        return el.querySelector("input");
    };

    this.addDivider = function() {
        let el = create("div", "wfbtHR", this._toolbar);
        return el;
    };

    this.modifyButton = function(index, icon, iconSize, label) {
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

    this.getWidgetBody = function() {
        return this._widget;
    };

    this.getDragElement = function() {
        return this._drag;
    };

    this.onclose = function() {
        this.destroy();
    };

    this.destroy = function() {
        this._frame.remove();

        window.widgetWindows.openWindows[this._key] = undefined;
    };

    this.onmaximize = function() {
        return this;
    };

    this.setPosition = function(x, y) {
        this._frame.style.left = x + "px";
        this._frame.style.top = Math.max(y, 64) + "px";
        window.widgetWindows._posCache[this._key] = [x, Math.max(y, 64)];

        return this;
    };

    this.sendToCenter = function() {
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

    this.isVisible = function() {
        return this._visible;
    };

    this.clear = function() {
        this._widget.innerHTML = "";
        this._toolbar.innerHTML = "";

        return this;
    };

    this.rollup = function() {
        this._rolled = true;
        this._body.style.display = "none";
        return this;
    };

    this.unroll = function() {
        this._rolled = false;
        this._body.style.display = "flex";
        return this;
    };

    this.maximize = function() {
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

    this.restore = function() {
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

    this.close = function() {
        this.onclose();
    };

    if (!!window.widgetWindows._posCache[this._key]) {
        let _pos = window.widgetWindows._posCache[this._key];
        this.setPosition(_pos[0], _pos[1]);
    }
    this.takeFocus();
}

window.widgetWindows.windowFor = function(widget, title, saveAs) {
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

window.widgetWindows.clear = function(name) {
    let win = window.widgetWindows.openWindows[name];
    if (!win) return;
    if (typeof win.onclose === "function") win.onclose();
};

window.widgetWindows.isOpen = function(name) {
    return window.widgetWindows.openWindows[name] ? true : "";
};

window.widgetWindows.hideWindows = function(name) {
    Object.values(window.widgetWindows.openWindows).forEach(win => {
        if (win !== undefined) win._frame.style.display = "none";
    });
};

window.widgetWindows.showWindows = function(name) {
    Object.values(window.widgetWindows.openWindows).forEach(win => {
        if (win !== undefined) win._frame.style.display = "block";
    });
};
