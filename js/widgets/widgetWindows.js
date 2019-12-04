window.createWidgetWindow = function(title) {
    let create = function(base, className, parent) {
        let el = document.createElement(base);
        if (className)
            el.className = className;
        if (parent)
            parent.append(el);
        return el;
    }
    
    function Window(frame, toolbar, widget, drag, closeButton) {
        this._frame = frame;
        this._toolbar = toolbar;
        this._widget = widget;
        this._drag = drag;

        let that = this;
        closeButton.onclick = function() {
            // Wrapper to allow overloading
            that["onClose"]();
        }

        this.addButton = function(icon, iconSize, label) {
            let el = create("div", "wfbtItem", this._toolbar);
            el.innerHTML = '<img src="header-icons/' + icon + '" title="' + label + '" alt="' + label + '" height="' + iconSize + '" width="' + iconSize + '" />';
            return el;
        };

        this.getWidgetBody = function() {
            return this._widget;
        }

        this.getDragElement = function() {
            return this._drag;
        }

        this.onClose = function() {
            this.destroy();
        }

        this.destroy = function() {
            this._frame.remove();
        }
    }

    let windows = docById('floatingWindows');
    let frame = create("div", "windowFrame", windows);
    frame.setAttribute("draggable", "true");

    let topBar = create("div", "wfTopBar", frame);
    let dragEl = create("div", "wftDrag", topBar);
    let handle = create("div", "wfHandle", topBar);
    
    let closeB = create("div", "wftButton", topBar);
    let rollB = create("div", "wftButton", topBar);
    
    let titleEl = create("div", "wftTitle", topBar);
    titleEl.innerHTML = title;

    let maxmin = create("div", "wftButton wftMaxmin", topBar);

    let winBody = create("div", "wfWinBody", frame);
    let toolbar = create("div", "wfbToolbar", winBody);
    let widget = create("div", "wfbWidget", winBody);

    return new Window(frame, toolbar, widget, dragEl, closeB);
};
