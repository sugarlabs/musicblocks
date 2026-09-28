/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2014-2026 Walter Bender
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * DOM utility helpers used throughout Music Blocks: element lookups
 * (docById, docByClass, docByName, docBySelector, docByTagName) and a
 * couple of small widget/label helpers (hideDOMLabel, closeWidgets) that
 * are grouped here for the same reason. displayMsg is a legacy no-op that
 * predates the current message/alert system; it's kept alongside these
 * rather than in utils.js because its original implementation was a DOM
 * helper (toggling a message container's visibility) even though it does
 * nothing today. Loaded as a RequireJS dependency of utils/utils and
 * assigned to window globals, matching the utils-logic.js pattern.
 */

/* global _ */

/* exported
   closeWidgets, displayMsg, docByClass, docById, docByName, docBySelector,
   docByTagName, hideDOMLabel, makeKeyboardAccessible, readTextFile,
   downloadTextFile, createSharePopup
*/

const keyboardAccessibleHandlers = new WeakMap();

/**
 * Adds keyboard semantics and activation behavior to a clickable element.
 *
 * @param {HTMLElement} element - The element that should behave as a button.
 * @param {string} [label] - Accessible name for the element.
 * @param {Function} [onActivate] - Optional activation callback for keyboard use.
 * @returns {HTMLElement} The enhanced element.
 */
function makeKeyboardAccessible(element, label, onActivate) {
    if (!element || typeof element.setAttribute !== "function") return element;

    const getAttribute =
        typeof element.getAttribute === "function" ? name => element.getAttribute(name) : () => "";
    const accessibleLabel =
        label ||
        getAttribute("aria-label") ||
        getAttribute("data-tooltip") ||
        getAttribute("title") ||
        element.id;

    element.setAttribute("role", "button");
    element.setAttribute("tabindex", "0");
    if (accessibleLabel) {
        element.setAttribute("aria-label", accessibleLabel);
    }

    const previousHandler = keyboardAccessibleHandlers.get(element);
    if (previousHandler && typeof element.removeEventListener === "function") {
        element.removeEventListener("keydown", previousHandler);
    }

    const keydownHandler = event => {
        if (event.key !== "Enter" && event.key !== " " && event.key !== "Spacebar") return;

        event.preventDefault();
        event.stopPropagation();
        if (typeof onActivate === "function") {
            onActivate(event);
        } else if (typeof element.click === "function") {
            element.click();
        }
    };

    if (typeof element.addEventListener === "function") {
        element.addEventListener("keydown", keydownHandler);
        keyboardAccessibleHandlers.set(element, keydownHandler);
    }

    return element;
}

/**
 * Retrieves a collection of elements by class name.
 * @param {string} classname - The class name to search for.
 * @returns {HTMLCollectionOf<Element>} A collection of elements with the specified class name.
 */
function docByClass(classname) {
    return document.getElementsByClassName(classname);
}

/**
 * Retrieves a collection of elements by tag name.
 * @param {string} tag - The tag name to search for.
 * @returns {NodeList} A collection of elements with the specified tag name.
 */
function docByTagName(tag) {
    return document.getElementsByTagName(tag);
}

/**
 * Retrieves an element by its ID.
 * @param {string} id - The ID of the element to retrieve.
 * @returns {HTMLElement|null} The element with the specified ID, or null if not found.
 */
function docById(id) {
    return document.getElementById(id);
}

/**
 * Retrieves a collection of elements by name.
 * @param {string} name - The name attribute value to search for.
 * @returns {NodeListOf<Element>} A collection of elements with the specified name attribute.
 */
function docByName(name) {
    return document.getElementsByName(name);
}

/**
 * Retrieves the first element that matches a specified CSS selector.
 * @param {string} selector - A CSS selector string.
 * @returns {Element|null} The first element that matches the selector, or null if not found.
 */
function docBySelector(selector) {
    return document.querySelector(selector);
}

/**
 * Hides certain DOM elements related to labels.
 */
function hideDOMLabel() {
    const textLabel = docById("textLabel");
    if (textLabel && textLabel.style) {
        textLabel.style.display = "none";
    }

    const numberLabel = docById("numberLabel");
    if (numberLabel && numberLabel.style) {
        numberLabel.style.display = "none";
    }

    const piemenu = docById("wheelDiv");
    if (piemenu && piemenu.style) {
        piemenu.style.display = "none";
    }
}

/**
 * Displays a message (currently unused).
 * @returns {undefined}
 */
function displayMsg(/*blocks, text*/) {
    /*
    let msgContainer = blocks.msgText.parent;
    msgContainer.visible = true;
    blocks.msgText.text = text;
    msgContainer.updateCache();
    blocks.stage.setChildIndex(msgContainer, blocks.stage.getNumChildren() - 1);
    */
    return;
}

/**
 * Closes all widgets in the window.
 *
 * @returns {void}
 */
function closeWidgets() {
    if (
        window.widgetWindows &&
        window.widgetWindows.openWindows &&
        typeof window.widgetWindows.closeWindow === "function"
    ) {
        const names = Object.keys(window.widgetWindows.openWindows);
        names.forEach(name => window.widgetWindows.closeWindow(name));
    }
}

/**
 * Reads a file through a hidden file input, enforcing the 1 MB import
 * size cap, and hands the text content and File object to the callback.
 * @param {string} inputId - The hidden file input element id.
 * @param {function} callback - Called with (err, data), where data is
 * { text, file }.
 * @returns {void}
 */
function readTextFile(inputId, callback) {
    const fileInput = docById(inputId);
    if (!fileInput) {
        callback(new Error(_("File input not found.")));
        return;
    }

    fileInput.value = "";
    fileInput.onchange = function () {
        const file = fileInput.files[0];
        if (!file) {
            return;
        }

        const MAX_IMPORT_SIZE = 1024 * 1024;
        if (file.size > MAX_IMPORT_SIZE) {
            callback(new Error(_("File too large. Maximum is 1 MB.")));
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            callback(null, { text: e.target.result, file });
        };
        reader.onerror = function () {
            callback(new Error(_("Failed to read file.")));
        };
        reader.readAsText(file);
    };
    fileInput.click();
}

/**
 * Downloads text content as a file via a blob URL and a synthetic anchor
 * click, revoking the URL afterwards.
 * @param {string} content - The file content.
 * @param {string} filename - The download file name.
 * @returns {void}
 */
function downloadTextFile(content, filename) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Builds an export/import popup anchored to a toolbar button. Clicking
 * the button again (existing popup found), choosing an item, or clicking
 * outside closes it.
 * @param {string} popupId - The DOM id for the popup element.
 * @param {Array} items - [label, handler] pairs, one per menu item.
 * @param {HTMLElement} anchor - The button the popup is anchored to.
 * @returns {HTMLElement|null} The popup, or null when toggling closed.
 */
function createSharePopup(popupId, items, anchor) {
    const existing = docById(popupId);
    if (existing) {
        if (existing._closeHandler) {
            document.removeEventListener("mousedown", existing._closeHandler);
        }
        existing.remove();
        return null;
    }

    const popup = document.createElement("div");
    popup.id = popupId;
    popup.style.cssText =
        "position:fixed;z-index:99999;background:var(--color-bg-primary);" +
        "color:var(--color-text-primary);border:1px solid var(--color-border-primary);" +
        "border-radius:var(--radius-md);box-shadow:var(--shadow-md);padding:4px 0;" +
        "min-width:140px;";
    const rect = anchor.getBoundingClientRect();
    popup.style.top = rect.bottom + 4 + "px";
    popup.style.left = rect.left + "px";

    const addItem = (label, handler) => {
        const item = document.createElement("div");
        item.textContent = label;
        item.setAttribute("role", "button");
        item.setAttribute("tabindex", "0");
        item.style.cssText = "padding:6px 16px;cursor:pointer;";
        item.onmouseenter = () => {
            item.style.background = "var(--color-bg-tertiary)";
        };
        item.onmouseleave = () => {
            item.style.background = "";
        };
        item.onclick = () => {
            cleanup();
            handler();
        };
        item.onkeydown = e => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                cleanup();
                handler();
            }
        };
        return item;
    };

    for (const [label, handler] of items) {
        popup.appendChild(addItem(label, handler));
    }
    document.body.appendChild(popup);

    const cleanup = () => {
        popup.remove();
        document.removeEventListener("mousedown", closeHandler);
    };

    const closeHandler = e => {
        if (!popup.contains(e.target)) {
            cleanup();
        }
    };
    popup._closeHandler = closeHandler;
    setTimeout(() => {
        document.addEventListener("mousedown", closeHandler);
    }, 0);
    return popup;
}

var DomHelpers = {
    docByClass,
    docByTagName,
    docById,
    docByName,
    docBySelector,
    hideDOMLabel,
    displayMsg,
    closeWidgets,
    makeKeyboardAccessible,
    readTextFile,
    downloadTextFile,
    createSharePopup
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = DomHelpers;
}

// Only attach these functions to `window` when running as a plain browser
// script (no CommonJS module system). In Node/Jest, code that needs them
// gets them via `require("./dom-helpers")` (directly, or re-exported from
// utils.js) instead — unconditionally assigning to `window`/`global` here
// would clobber `global.docById`-style mocks that tests set up before
// requiring the module under test.
if (typeof window !== "undefined" && (typeof module === "undefined" || !module.exports)) {
    window.DomHelpers = DomHelpers;
    window.docByClass = docByClass;
    window.docByTagName = docByTagName;
    window.docById = docById;
    window.docByName = docByName;
    window.docBySelector = docBySelector;
    window.hideDOMLabel = hideDOMLabel;
    window.displayMsg = displayMsg;
    window.closeWidgets = closeWidgets;
    window.makeKeyboardAccessible = makeKeyboardAccessible;
    window.readTextFile = readTextFile;
    window.downloadTextFile = downloadTextFile;
    window.createSharePopup = createSharePopup;
}
