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
 * Migration note:
 * These DOM helper functions were extracted from js/utils/utils.js so that
 * document-access utilities live in one place, separate from the pure logic
 * functions in js/utils/utils-logic.js. They are loaded as a RequireJS
 * dependency of utils/utils and assigned to window globals, matching the
 * existing utils-logic.js pattern.
 */

/* exported
   closeWidgets, displayMsg, docByClass, docById, docByName, docBySelector,
   docByTagName, hideDOMLabel
*/

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
    if (textLabel !== null) {
        textLabel.style.display = "none";
    }

    const numberLabel = docById("numberLabel");
    if (numberLabel !== null) {
        numberLabel.style.display = "none";
    }

    const piemenu = docById("wheelDiv");
    if (piemenu !== null) {
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
    const names = Object.keys(window.widgetWindows.openWindows);
    names.forEach(name => window.widgetWindows.closeWindow(name));
}

const DomHelpers = {
    docByClass,
    docByTagName,
    docById,
    docByName,
    docBySelector,
    hideDOMLabel,
    displayMsg,
    closeWidgets
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
}
