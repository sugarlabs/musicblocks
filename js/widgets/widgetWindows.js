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

/* global _, docById, ManagedTimer */

/*
Globals location
- js/utils/utils.js
_, docById
*/

window.widgetWindows = {
    openWindows: {},
    _posCache: {},
    focused: null,
    draggingWindow: null,
    _shortcutsInitialized: false,
    _globalListenersInitialized: false,
    _handleGlobalKeyDown(e) {
        const focused = window.widgetWindows.focused;
        if (!focused || e.repeat) return; // Guard against no focus or rapid-fire repeat

        // Ignore shortcuts when focus is inside an input, textarea, or contenteditable element
        const activeElement = document.activeElement;
        const isInput =
            activeElement &&
            (activeElement.tagName === "INPUT" ||
                activeElement.tagName === "TEXTAREA" ||
                activeElement.isContentEditable);

        if (isInput) return;

        // Handle Escape (Close)
        if (e.key === "Escape") {
            focused.onclose();
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        // Handle Maximize (Cmd/Ctrl + Shift + M)
        const isModifierActive = e.metaKey || e.ctrlKey;
        if (isModifierActive && e.shiftKey && e.code === "KeyM") {
            if (focused._fullscreenEnabled) {
                if (focused._maximized) {
                    focused._restore();
                    focused.sendToCenter();
                } else {
                    focused._maximize();
                }
                focused.takeFocus();
                focused.onmaximize();
                e.preventDefault();
                e.stopPropagation();
            }
        }
    },
    _initGlobalListeners() {
        if (this._globalListenersInitialized) return;

        this._handleGlobalMouseMove = this._handleGlobalMouseMove.bind(this);
        this._handleGlobalMouseUp = this._handleGlobalMouseUp.bind(this);
        this._handleGlobalMouseDown = this._handleGlobalMouseDown.bind(this);

        document.addEventListener("mouseup", this._handleGlobalMouseUp, true);
        document.addEventListener("mousemove", this._handleGlobalMouseMove, true);
        document.addEventListener("mousedown", this._handleGlobalMouseDown, true);

        this._globalListenersInitialized = true;
    },
    _handleGlobalMouseMove(e) {
        if (this.draggingWindow) {
            this.draggingWindow._docMouseMoveHandler(e);
        }
    },
    _handleGlobalMouseUp(e) {
        if (this.draggingWindow) {
            this.draggingWindow._dragTopHandler(e);
            this.draggingWindow = null;
        }
    },
    _handleGlobalMouseDown(e) {
        const isToolbarInteraction =
            e.target?.closest &&
            (e.target.closest("#toolbars") ||
                e.target.closest("#aux-toolbar") ||
                e.target.closest(".dropdown-content") ||
                e.target.closest(".dropdown-trigger"));

        const windows = Object.values(this.openWindows).filter(win => win !== undefined);
        let focusedAny = false;

        for (let i = 0; i < windows.length; i++) {
            const win = windows[i];
            if (
                e.target === win._frame ||
                win._frame.contains(e.target) ||
                win._fullscreenEnabled ||
                isToolbarInteraction
            ) {
                // Focus this window
                win._frame.style.opacity = "1";
                win._frame.style.zIndex = "10000";
                this.focused = win;
                focusedAny = true;
            } else {
                // Dim other windows
                win._frame.style.opacity = ".7";
                win._frame.style.zIndex = "0";
            }
        }

        if (!focusedAny) {
            this.focused = null;
        }
    }
};

class WidgetWindow {
    /**
     * @param {string} key
     * @param {string} title
     * @param {boolean} fullscreen
     */
    constructor(key, title, fullscreen = true) {
        // Keep a reference to the object within handlers
        this._key = key;
        this._buttons = [];
        this._first = true;
        this._title = title;
        this._visible = true;
        this._rolled = false;
        this._savedPos = null;
        this._maximized = false;
        this._fullscreenEnabled = fullscreen;
        this.timerManager = typeof ManagedTimer !== "undefined" ? new ManagedTimer() : null;

        // Drag offset for correct positioning
        this._dx = this._dy = 0;
        // RAF throttle flag for mousemove performance
        this._rafTicking = false;

        this._createUIelements();
        this._setupLanguage();

        window.widgetWindows._initGlobalListeners();

        if (!window.widgetWindows._shortcutsInitialized) {
            // Use capture phase (true) to ensure global window control shortcuts are handled
            // before individual widgets/blocks can intercept them via stopPropagation().
            window.removeEventListener("keydown", window.widgetWindows._handleGlobalKeyDown, true);
            window.addEventListener("keydown", window.widgetWindows._handleGlobalKeyDown, true);
            window.widgetWindows._shortcutsInitialized = true;
        }

        if (window.widgetWindows._posCache[this._key]) {
            const _pos = window.widgetWindows._posCache[this._key];
            this.setPosition(_pos[0], _pos[1]);
        }

        this.takeFocus();

        this.sendToCenter = this.sendToCenter.bind(this);
    }

    /**
     * @private
     * @param {string} base
     * @param {string} className
     * @param {HTMLElement} parent
     * @returns {HTMLElement}
     */
    _create(base, className, parent) {
        const el = document.createElement(base);
        if (className) el.className = className;
        if (parent) parent.append(el);
        return el;
    }

    /**
     * @private
     * @param {HTMLElement} element
     * @param {string} className
     */
    _toggleClass(element, className) {
        element.classList.toggle(className);
    }

    /**
     * @private
     * @returns {void}
     */
    _createUIelements() {
        const windows = docById("floatingWindows");
        this._frame = this._create("div", "windowFrame", windows);
        this._overlayframe = this._create("div", "windowFrame", windows);
        this._drag = this._create("div", "wfTopBar", this._frame);
        this._drag.style.display = "flex";
        this._drag.style.justifyContent = "space-between";

        if (this._fullscreenEnabled) {
            this._drag.ondblclick = e => {
                this._maximize();
                this.takeFocus();
                this.onmaximize();
                e.preventDefault();
                e.stopImmediatePropagation();
            };
        }
        const closeButton = this._create("div", "wftButton close", this._drag);
        closeButton.title = _("Close");
        closeButton.setAttribute("role", "button");
        closeButton.setAttribute("aria-label", _("Close window"));
        closeButton.setAttribute("tabindex", "0");
        closeButton.onclick = e => {
            this.onclose();
            e.preventDefault();
            e.stopPropagation();
        };

        this._nonclose = this._create("div", "nonclose", this._drag);
        this._nonclose.style.display = "flex";
        this._nonclose.justifyContent = "space-between";
        this._nonclose.style.width = "100%";

        const titleEl = this._create("div", "wftTitle", this._nonclose);
        titleEl.innerHTML = "";
        titleEl.textContent = _(this._title);
        titleEl.id = `${this._key}WidgetID`;

        this._nonclose.onmousedown = e => {
            window.widgetWindows.draggingWindow = this;
            if (this._maximized) {
                // Perform special repositioning to make the drag feel right when
                // restoring a window from maximized.
                let bcr = this._drag.getBoundingClientRect();
                let dx = (bcr.left - e.clientX) / (bcr.right - bcr.left);
                const dy = bcr.top - e.clientY;

                this._restore();
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

        this._nonclosebuttons = this._create("div", "nonclosebuttons", this._nonclose);
        this._nonclosebuttons.style.display = "flex";
        this._rollButton = this._create("div", "wftButton rollup", this._nonclosebuttons);
        const rollButton = this._rollButton;
        rollButton.title = _("Minimize");
        rollButton.setAttribute("role", "button");
        rollButton.setAttribute("aria-label", _("Roll up window"));
        rollButton.setAttribute("tabindex", "0");
        rollButton.onclick = e => {
            if (this._rolled) {
                this.unroll();
            } else {
                this._rollup();
                this._toggleClass(rollButton, "plus");
            }
            this.takeFocus();
            this._frame.style.width = "auto";
            this._frame.style.height = "auto";
            this._frame.style.minHeight = "0px";
            e.preventDefault();
            e.stopPropagation();
        };

        if (this._fullscreenEnabled) {
            const maxminButton = this._create("div", "wftButton wftMaxmin", this._nonclosebuttons);
            maxminButton.setAttribute("role", "button");
            maxminButton.setAttribute("aria-label", _("Maximize window"));
            maxminButton.setAttribute("tabindex", "0");
            maxminButton.onclick = e => {
                if (this._maximized) {
                    this._restore();
                    this.sendToCenter();
                } else {
                    this._maximize();
                }
                this.takeFocus();
                this.onmaximize();
                e.preventDefault();
                e.stopImmediatePropagation();
            };
            this._maxminIcon = this._create("img", undefined, maxminButton);
            this._maxminIcon.setAttribute("src", "header-icons/icon-expand.svg");
        }

        this._body = this._create("div", "wfWinBody", this._frame);
        this._toolbar = this._create("div", "wfbToolbar", this._body);

        this._widget = this._create("div", "wfbWidget", this._body);
        this._widgetWheelHandler = event => {
            const deltaY =
                typeof event.deltaY === "number"
                    ? event.deltaY
                    : typeof event.detail === "number"
                      ? event.detail * 16
                      : 0;
            const deltaX = typeof event.deltaX === "number" ? event.deltaX : 0;

            this._widget.scrollTop += deltaY;
            this._widget.scrollLeft += deltaX;

            if (event.cancelable) {
                event.preventDefault();
            }

            event.stopPropagation();
        };
        this._widget.addEventListener("wheel", this._widgetWheelHandler, {
            passive: false
        });
        this._widget.addEventListener("DOMMouseScroll", this._widgetWheelHandler, {
            passive: false
        });
    }

    /**
     * @private
     * @param {MouseEvent} e
     * @returns {void}
     */
    _docMouseMoveHandler(e) {
        // Throttle using requestAnimationFrame to prevent layout thrashing
        if (this._rafTicking) return;
        this._rafTicking = true;

        requestAnimationFrame(() => {
            if (this._fullscreenEnabled && this._frame.style.top === "64px") {
                this._overlay(true);
            } else {
                this._overlay(false);
            }
            const x = e.clientX - this._dx,
                y = e.clientY - this._dy;

            this.setPosition(x, y);
            this._rafTicking = false;
        });
    }

    _overlay(add) {
        if (add) {
            this._frame.style.zIndex = "10";
            this._overlayframe.style.left = "0";
            this._overlayframe.style.zIndex = "1";
            this._overlayframe.style.top = "64px";
            this._overlayframe.style.width = "100vw";
            this._overlayframe.style.height = "calc(100vh - 64px)";
            this._overlayframe.style.border = "0.25vw solid black";
            this._overlayframe.style.backgroundColor = "var(--overlay-bg)";
        } else {
            this._frame.style.zIndex = "10000";
            this._overlayframe.style.border = "0px";
            this._overlayframe.style.zIndex = "-1";
            this._overlayframe.style.backgroundColor = "transparent";
        }
    }

    /**
     * @private
     * @param {MouseEvent} e
     * @returns {void}
     */
    _dragTopHandler(e) {
        if (this._fullscreenEnabled && this._frame.style.top === "64px" && !this._maximized) {
            this._maximize();
            this.takeFocus();
            this.onmaximize();
            e.preventDefault();
        }
    }

    /**
     * @private
     * @returns {void}
     */
    _setupLanguage() {
        let language = localStorage.languagePreference;
        if (language === undefined) {
            language = navigator.language;
        }

        // For Japanese, put the toolbar on the top.
        if (language === "ja") {
            this._body.style.flexDirection = "column";
            this._body.style.flexGrow = "1";
            this._toolbar.style.overflowY = "auto";
            this._toolbar.style.width = "100%";
            this._toolbar.style.display = "flex";
            this._toolbar.style.flexShrink = "0";
        }
    }

    /**
     * @public
     * @param {string} initial
     * @param {HTMLElement} parent
     * @returns {HTMLElement}
     */
    addInputButton(initial, parent) {
        const el = this._create("div", "wfbtItem", parent || this._toolbar);
        el.innerHTML = "";
        const input = document.createElement("input");
        input.value = initial; // Safe - DOM API escapes automatically
        el.insertAdjacentElement("afterbegin", input);
        return input;
    }

    /**
     * @public
     * @param {number} initial
     * @param {HTMLElement} parent
     * @param {number} min
     * @param {number} max
     * @param {string} classNm
     * @returns {HTMLElement}
     */
    addRangeSlider(initial, parent, min, max, classNm) {
        const el = this._create("div", "wfbtItem", parent || this._toolbar);
        const slider = document.createElement("input");
        slider.type = "range";
        if (classNm) slider.className = classNm; // Safe - DOM API escapes automatically
        slider.min = min;
        slider.max = max;
        slider.value = initial;

        el.style.height = "250px";
        el.insertAdjacentElement("afterbegin", slider);
        slider.style = " position:absolute;transform:rotate(270deg);height:10px;width:250px;";
        return slider;
    }

    /**
     * @deprecated
     */
    addSelectorButton(list, initial, parent) {
        const el = this._create("div", "wfbtItem", parent || this._toolbar);
        const selector = document.createElement("select");
        selector.value = initial;
        el.replaceChildren(selector);
        for (const i of list) {
            const newOption = new Option("turtle " + i, i);
            selector.add(newOption);
        }
        return selector;
    }

    /**
     * @public
     * @returns {HTMLElement}
     */
    addDivider() {
        const el = this._create("div", "wfbtHR", this._toolbar);
        return el;
    }

    /**
     * @public
     * @param {number} index
     * @param {string} icon
     * @param {number} iconSize
     * @param {string} label
     * @returns {HTMLElement}
     */
    modifyButton(index, icon, iconSize, label) {
        const img = document.createElement("img");
        img.src = `header-icons/${icon}`;
        img.title = label;
        img.alt = label;
        img.height = iconSize;
        img.width = iconSize;
        this._buttons[index].replaceChildren(img);
        return this._buttons[index];
    }

    /**
     * @public
     * @returns {void}
     */
    close() {
        this.onclose();
    }

    /**
     * The title may change, as with the Help Widget.
     * @public
     * @returns {void}
     */
    updateTitle(title) {
        const wftTitle = docById(this._key + "WidgetID");
        wftTitle.textContent = title;
    }

    /**
     * @public
     * @returns {void}
     */
    takeFocus() {
        window.widgetWindows.focused = this;
        const windows = docById("floatingWindows");
        const siblings = windows.children;
        for (let i = 0; i < siblings.length; i++) {
            siblings[i].style.zIndex = "0";
            siblings[i].style.opacity = "0.7";
        }

        // When in focus, the zIndex of the help must be the highest. Even greater than the input search display block
        this._frame.style.zIndex = "10000";
        this._frame.style.opacity = "1";
    }

    /**
     * @public
     * @param {*} icon
     * @param {*} iconSize
     * @param {*} label
     * @param {HTMLElement} parent
     * @returns {HTMLElement}
     */
    addButton(icon, iconSize, label, parent) {
        const el = this._create("div", "wfbtItem", parent || this._toolbar);
        const img = document.createElement("img");
        img.src = `header-icons/${icon}`;
        img.title = label;
        img.alt = label;
        img.height = iconSize;
        img.width = iconSize;
        el.replaceChildren(img);
        this._buttons.push(el);
        return el;
    }

    /**
     * @public
     * @returns {WidgetWindow} this
     */
    sendToCenter() {
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

    /**
     * @private
     * @returns {void}
     */
    _restore() {
        this._maxminIcon.setAttribute("src", "header-icons/icon-expand.svg");
        this._maximized = false;

        if (this._savedPos) {
            this._frame.style.left = this._savedPos[0];
            this._frame.style.top = this._savedPos[1];
            this._savedPos = null;
        }
        this._overlay(false);
        this._frame.style.width = "auto";
        this._frame.style.height = "auto";
        this._frame.style.minHeight = "420px";
        this._frame.style.minWidth = "470px";
    }

    /**
     * @private
     * @returns {void}
     */
    _maximize() {
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

    /**
     * @public
     * @returns {HTMLElement}
     */
    getWidgetBody() {
        return this._widget;
    }

    /**
     * @public
     * @returns {HTMLElement}
     */
    getWidgetFrame() {
        return this._frame;
    }

    /**
     * @deprecated
     */
    getDragElement() {
        return this._drag;
    }

    /**
     * @public
     * @returns {void}
     */
    onclose() {
        this.destroy();
    }

    /**
     * @public
     * @returns {void}
     */
    destroy() {
        if (this._widget && this._widgetWheelHandler) {
            this._widget.removeEventListener("wheel", this._widgetWheelHandler, false);
            this._widget.removeEventListener("DOMMouseScroll", this._widgetWheelHandler, false);
        }
        if (this._frame && this._frame.parentElement) {
            this._frame.parentElement.removeChild(this._frame);
        }
        if (this._overlayframe && this._overlayframe.parentElement) {
            this._overlayframe.parentElement.removeChild(this._overlayframe);
        }
        if (window.widgetWindows.focused === this) {
            window.widgetWindows.focused = null;
        }
        if (this.timerManager) {
            this.timerManager.clearAll();
        }
        window.widgetWindows.openWindows[this._key] = undefined;
    }

    /**
     * @public
     * @returns {WidgetWindow} this
     */
    onmaximize() {
        return this;
    }

    /**
     * @public
     * @returns {boolean}
     */
    isMaximized() {
        return this._maximized;
    }

    /**
     * @returns {void}
     */
    show() {
        this._frame.style.display = "block";
    }

    /**
     * @public
     * @param {number} x
     * @param {number} y
     * @returns {WidgetWindow} this
     */
    setPosition(x, y) {
        this._frame.style.left = `${x}px`;
        this._frame.style.top = `${Math.max(y, 64)}px`;
        window.widgetWindows._posCache[this._key] = [x, Math.max(y, 64)];
        return this;
    }

    /**
     * @public
     * @returns {boolean}
     */
    isVisible() {
        return this._visible;
    }

    /**
     * @public
     * @return {WidgetWindow} this
     */
    clear() {
        this._widget.innerHTML = "";
        this._toolbar.innerHTML = "";
        return this;
    }

    /**
     * @public
     * @return {WidgetWindow} this
     *
     * Clears the widget window not the toolbar
     */
    clearScreen() {
        this._widget.innerHTML = "";
        return this;
    }

    /**
     * @private
     * @return {WidgetWindow} this
     */
    _rollup() {
        this._rolled = true;
        this._body.style.display = "none";
        return this;
    }

    /**
     * @public
     * @return {WidgetWindow} this
     */
    unroll() {
        this._rolled = false;
        this._body.style.display = "flex";
        if (this._rollButton && this._rollButton.classList.contains("plus")) {
            this._rollButton.classList.remove("plus");
        }
        return this;
    }
}

/**
 *
 * @param {Object} widget
 * @param {string} title
 * @param {string} saveAs
 * @returns {WidgetWindow} this
 */
window.widgetWindows.windowFor = (widget, title, saveAs, fullscreen) => {
    let key = undefined;
    // Check for a blockNo attribute
    if (typeof widget.blockNo !== "undefined") key = widget.blockNo;
    // Fall back on the next best thing we have
    else key = saveAs || title;

    if (typeof window.widgetWindows.openWindows[key] === "undefined") {
        const win = new WidgetWindow(key, title, fullscreen).sendToCenter();
        window.widgetWindows.openWindows[key] = win;
    }

    return window.widgetWindows.openWindows[key].unroll();
};

/**
 * @deprecated
 */
window.widgetWindows.clear = name => {
    const win = window.widgetWindows.openWindows[name];
    if (!win) return;
    if (typeof win.onclose === "function") win.onclose();
};

/**
 * @public
 * @param {string} name
 * @returns {boolean}
 */
window.widgetWindows.isOpen = name => {
    return window.widgetWindows.openWindows[name] ? true : "";
};

/**
 * @public
 * @returns {void}
 */
window.widgetWindows.hideAllWindows = () => {
    Object.values(window.widgetWindows.openWindows).forEach(win => {
        if (win !== undefined) win._frame.style.display = "none";
    });
    window.widgetWindows.focused = null;
};

/**
 * @public
 * @param {string} name
 */
window.widgetWindows.hideWindow = name => {
    const win = window.widgetWindows.openWindows[name];
    if (!win) return;
    win._frame.style.display = "none";
    if (window.widgetWindows.focused === win) {
        window.widgetWindows.focused = null;
    }
};

/**
 * @returns {void}
 */
window.widgetWindows.showWindows = () => {
    Object.values(window.widgetWindows.openWindows).forEach(win => {
        if (win !== undefined) win._frame.style.display = "block";
    });
};
