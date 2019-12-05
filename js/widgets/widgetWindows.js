window.widgetWindows = {openWindows: {}};

function WidgetWindow(key, title) {
    // Keep a refernce to the object within handlers
    let that = this;
    this._key = key;

    let create = function(base, className, parent) {
        let el = document.createElement(base);
        if (className)
            el.className = className;
        if (parent)
            parent.append(el);
        return el;
    }
    
    let windows = docById('floatingWindows');
    this._frame = create("div", "windowFrame", windows);

    this._drag = create("div", "wfTopBar", this._frame);
    this._handle = create("div", "wfHandle", this._drag);
    
    let closeButton = create("div", "wftButton close", this._drag);
    let rollButton = create("div", "wftButton rollup", this._drag);
    
    let titleEl = create("div", "wftTitle", this._drag);
    titleEl.innerHTML = title;
    
    let maxmin = create("div", "wftButton wftMaxmin", this._drag);

    this._body = create("div", "wfWinBody", this._frame);
    this._toolbar = create("div", "wfbToolbar", this._body);
    this._widget = create("div", "wfbWidget", this._body);


    this._visible = true;
    this._rolled = false;

    this._buttons = [];
    
    // Drag offset for correct positioning
    this._dx = this._dy = 0;
    this._dragging = false;

    // Needed to keep things canvas-relative
    let canvas = docById("myCanvas");

    // Gloval watcher to track the mouse
    document.addEventListener("mousemove", function(e) {
        if (!that._dragging) return;

        let x = e.clientX - that._dx,
            y = e.clientY - that._dy;
        
        that.setPosition(x, y);
    })

    // The handle needs the events bound as it's a sibling of the dragging div
    // not a relative in either direciton.
    this._drag.onmousedown = this._handle.onmousedown = function(e) {
        that._dragging = true;
        that._dx = e.clientX - that._drag.getBoundingClientRect().left;
        that._dy = e.clientY - that._drag.getBoundingClientRect().top;
        e.preventDefault();
    };    
    document.addEventListener("mouseup", function(e) {
        that._dragging = false;            
    });
    
    // Wrapper to allow overloading
    closeButton.onclick = function() {
        that["onclose"]();
    };
    rollButton.onclick = function() {
        if (that._rolled) that.unroll();
        else that.rollup();
    };

    this.addButton = function(icon, iconSize, label) {
        let el = create("div", "wfbtItem", this._toolbar);
        el.innerHTML = '<img src="header-icons/' + icon + '" title="' + label + '" alt="' + label + '" height="' + iconSize + '" width="' + iconSize + '" />';
        that._buttons.push(el);
        return el;
    };
    this.modifyButton = function(index, icon, iconSize, label) {
        that._buttons[index].innerHTML = '<img src="header-icons/' + icon + '" title="' + label + '" alt="' + label + '" height="' + iconSize + '" width="' + iconSize + '" />';
        return that._buttons[index];
    };

    this.getWidgetBody = function() {
        return this._widget;
    }

    this.getDragElement = function() {
        return this._drag;
    }

    this.onclose = function() {
        this.destroy();
    }

    this.destroy = function() {
        this._frame.remove();

        window.widgetWindows.openWindows[this._key] = undefined;
    }

    this.setPosition = function(x, y) {
        this._frame.style.left = x + "px";
        this._frame.style.top = y + "px";

        return this;
    }

    this.sendToCenter = function() {
        let rect = this._frame.getBoundingClientRect();
        let width = rect.right - rect.left;
        let height = rect.bottom - rect.top;
        
        rect = canvas.getBoundingClientRect();
        let cw = rect.right - rect.left;
        let ch = rect.bottom - rect.top;
        
        this.setPosition((cw - width) / 2, (ch - height) / 2);

        return this;
    }

    this.isVisible = function() {
        return this._visible;
    }

    this.clear = function() {
        this._widget.innerHTML = "";
        this._toolbar.innerHTML = "";

        return this;
    }

    this.rollup = function() {
        this._rolled = true;
        this._body.style.display = "none";
        return this;
    }
    this.unroll = function() {
        this._rolled = false;
        this._body.style.display = "flex";
        return this;
    }

    this.requestSize = function(w, h) {
        return this;

        // TODO: Evaluate how much this is actually needed.
        this._frame.style.minWidth = w + "px";
        this._frame.style.minHeight = h + "px";

        return this;
    }
};

window.widgetWindows.windowFor = function(widget, title) {
    let key = undefined;
    // Check for a blockNo attribute
    if (typeof widget.blockNo !== "undefined")
        key = widget.blockNo;
    // Fall back on a sligh hope that widgets are persistent
    else if (typeof widget.___widgetWindowOpenID !== "undefined")
        key = widget.___widgetWindowOpenID;

    if (typeof key === "undefined") {
        // This widget (probably) has never been seen before
        key = Math.random();
        widget.___widgetWindowOpenID = key;
    } 

    if (typeof window.widgetWindows.openWindows[key] === "undefined") {
        let win = new WidgetWindow(key, title).sendToCenter();
        window.widgetWindows.openWindows[key] = win;
    }

    return window.widgetWindows.openWindows[key].unroll();
};
