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

const DomHelpers = require("../dom-helpers.js");
const {
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
    createSharePopup,
    closeSharePopup
} = DomHelpers;

if (typeof global._ === "undefined") {
    global._ = s => s;
}

describe("DOM query helpers", () => {
    let spyGetById;
    let spyGetByClass;
    let spyGetByTag;
    let spyGetByName;
    let spyQuerySelector;

    beforeEach(() => {
        spyGetById = jest.spyOn(document, "getElementById").mockImplementation(() => null);
        spyGetByClass = jest.spyOn(document, "getElementsByClassName").mockImplementation(() => []);
        spyGetByTag = jest.spyOn(document, "getElementsByTagName").mockImplementation(() => []);
        spyGetByName = jest.spyOn(document, "getElementsByName").mockImplementation(() => []);
        spyQuerySelector = jest.spyOn(document, "querySelector").mockImplementation(() => null);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("docById delegates to getElementById and returns its result", () => {
        const element = { id: "test" };
        document.getElementById = jest.fn(() => element);
        expect(docById("test")).toBe(element);
        expect(document.getElementById).toHaveBeenCalledWith("test");
    });

    it("docByClass delegates to getElementsByClassName and returns its result", () => {
        const elements = [{ className: "myClass" }];
        document.getElementsByClassName = jest.fn(() => elements);
        expect(docByClass("myClass")).toBe(elements);
        expect(document.getElementsByClassName).toHaveBeenCalledWith("myClass");
    });

    it("docByTagName delegates to getElementsByTagName and returns its result", () => {
        const elements = [{ tagName: "DIV" }];
        document.getElementsByTagName = jest.fn(() => elements);
        expect(docByTagName("div")).toBe(elements);
        expect(document.getElementsByTagName).toHaveBeenCalledWith("div");
    });

    it("docByName delegates to getElementsByName and returns its result", () => {
        const elements = [{ name: "field" }];
        document.getElementsByName = jest.fn(() => elements);
        expect(docByName("field")).toBe(elements);
        expect(document.getElementsByName).toHaveBeenCalledWith("field");
    });

    it("docBySelector delegates to querySelector and returns its result", () => {
        const element = { matches: "#app > .main" };
        document.querySelector = jest.fn(() => element);
        expect(docBySelector("#app > .main")).toBe(element);
        expect(document.querySelector).toHaveBeenCalledWith("#app > .main");
    });

    it("docById returns null when getElementById finds nothing", () => {
        expect(docById("missing")).toBeNull();
    });
});

describe("hideDOMLabel()", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("hides textLabel, numberLabel, and wheelDiv when they exist", () => {
        const textLabel = { style: { display: "block" } };
        const numberLabel = { style: { display: "block" } };
        const piemenu = { style: { display: "block" } };
        jest.spyOn(document, "getElementById").mockImplementation(id => {
            if (id === "textLabel") return textLabel;
            if (id === "numberLabel") return numberLabel;
            if (id === "wheelDiv") return piemenu;
            return null;
        });
        hideDOMLabel();
        expect(textLabel.style.display).toBe("none");
        expect(numberLabel.style.display).toBe("none");
        expect(piemenu.style.display).toBe("none");
    });

    it("does not throw when elements are missing", () => {
        jest.spyOn(document, "getElementById").mockImplementation(() => null);
        expect(() => hideDOMLabel()).not.toThrow();
    });
});

describe("displayMsg()", () => {
    it("is a no-op that returns undefined", () => {
        expect(displayMsg()).toBeUndefined();
    });
});

describe("closeWidgets()", () => {
    beforeEach(() => {
        window.widgetWindows = {
            openWindows: { RhythmRuler: {}, PhraseMarker: {} },
            closeWindow: jest.fn()
        };
    });

    it("closes every open widget window", () => {
        closeWidgets();
        expect(window.widgetWindows.closeWindow).toHaveBeenCalledWith("RhythmRuler");
        expect(window.widgetWindows.closeWindow).toHaveBeenCalledWith("PhraseMarker");
        expect(window.widgetWindows.closeWindow).toHaveBeenCalledTimes(2);
    });

    it("does not throw when openWindows is empty", () => {
        window.widgetWindows.openWindows = {};
        expect(() => closeWidgets()).not.toThrow();
    });
});

describe("hideDOMLabel() — partial DOM element existence & real DOM interactions", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("hides only textLabel when textLabel is the only element present", () => {
        const textLabel = { style: { display: "block" } };
        jest.spyOn(document, "getElementById").mockImplementation(id =>
            id === "textLabel" ? textLabel : null
        );

        hideDOMLabel();

        expect(textLabel.style.display).toBe("none");
    });

    it("hides only numberLabel when numberLabel is the only element present", () => {
        const numberLabel = { style: { display: "block" } };
        jest.spyOn(document, "getElementById").mockImplementation(id =>
            id === "numberLabel" ? numberLabel : null
        );

        hideDOMLabel();

        expect(numberLabel.style.display).toBe("none");
    });

    it("hides only wheelDiv when wheelDiv is the only element present", () => {
        const piemenu = { style: { display: "block" } };
        jest.spyOn(document, "getElementById").mockImplementation(id =>
            id === "wheelDiv" ? piemenu : null
        );

        hideDOMLabel();

        expect(piemenu.style.display).toBe("none");
    });

    it("works with real JSDOM HTML elements", () => {
        document.body.innerHTML = `
            <div id="textLabel" style="display: block;"></div>
            <div id="numberLabel" style="display: inline;"></div>
            <div id="wheelDiv" style="display: flex;"></div>
        `;

        hideDOMLabel();

        expect(document.getElementById("textLabel").style.display).toBe("none");
        expect(document.getElementById("numberLabel").style.display).toBe("none");
        expect(document.getElementById("wheelDiv").style.display).toBe("none");
    });
});

describe("DOM query helpers — real JSDOM element selection", () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="header" class="active title" name="header-name">Header</div>
            <span class="active" name="span-name">Span 1</span>
            <span class="active" name="span-name">Span 2</span>
        `;
    });

    it("docById retrieves actual DOM element by ID", () => {
        const header = docById("header");
        expect(header).not.toBeNull();
        expect(header.textContent).toBe("Header");
    });

    it("docByClass retrieves elements matching class name", () => {
        const activeElems = docByClass("active");
        expect(activeElems.length).toBe(3);
    });

    it("docByTagName retrieves elements by tag name", () => {
        const spans = docByTagName("span");
        expect(spans.length).toBe(2);
    });

    it("docByName retrieves elements matching name attribute", () => {
        const namedElems = docByName("span-name");
        expect(namedElems.length).toBe(2);
    });

    it("docBySelector retrieves element by query selector", () => {
        const firstActiveSpan = docBySelector("span.active");
        expect(firstActiveSpan).not.toBeNull();
        expect(firstActiveSpan.textContent).toBe("Span 1");
    });
});

describe("closeWidgets() — edge cases", () => {
    it("handles multiple widgets and verifies each closeWindow invocation", () => {
        const closeWindowMock = jest.fn();
        window.widgetWindows = {
            openWindows: {
                tempo: {},
                volume: {},
                pitch: {}
            },
            closeWindow: closeWindowMock
        };

        closeWidgets();

        expect(closeWindowMock).toHaveBeenCalledTimes(3);
        expect(closeWindowMock).toHaveBeenNthCalledWith(1, "tempo");
        expect(closeWindowMock).toHaveBeenNthCalledWith(2, "volume");
        expect(closeWindowMock).toHaveBeenNthCalledWith(3, "pitch");
    });
});

describe("makeKeyboardAccessible()", () => {
    afterEach(() => {
        document.body.innerHTML = "";
    });

    it("returns null or invalid inputs unmodified", () => {
        expect(makeKeyboardAccessible(null)).toBeNull();
        expect(makeKeyboardAccessible(undefined)).toBeUndefined();
        const nonElement = { foo: "bar" };
        expect(makeKeyboardAccessible(nonElement)).toBe(nonElement);
    });

    it("sets role='button' and tabindex='0' on target element", () => {
        const button = document.createElement("div");
        makeKeyboardAccessible(button);
        expect(button.getAttribute("role")).toBe("button");
        expect(button.getAttribute("tabindex")).toBe("0");
    });

    it("sets explicit aria-label when passed as argument", () => {
        const button = document.createElement("div");
        makeKeyboardAccessible(button, "Play Button");
        expect(button.getAttribute("aria-label")).toBe("Play Button");
    });

    it("uses existing aria-label attribute when label argument is omitted", () => {
        const button = document.createElement("div");
        button.setAttribute("aria-label", "Existing Label");
        makeKeyboardAccessible(button);
        expect(button.getAttribute("aria-label")).toBe("Existing Label");
    });

    it("falls back to data-tooltip attribute when label is omitted", () => {
        const button = document.createElement("div");
        button.setAttribute("data-tooltip", "Tooltip Text");
        makeKeyboardAccessible(button);
        expect(button.getAttribute("aria-label")).toBe("Tooltip Text");
    });

    it("falls back to title attribute when data-tooltip is absent", () => {
        const button = document.createElement("div");
        button.setAttribute("title", "Hover Title");
        makeKeyboardAccessible(button);
        expect(button.getAttribute("aria-label")).toBe("Hover Title");
    });

    it("falls back to element id when other labels are absent", () => {
        const button = document.createElement("div");
        button.id = "my-action-btn";
        makeKeyboardAccessible(button);
        expect(button.getAttribute("aria-label")).toBe("my-action-btn");
    });

    it("does not set aria-label when no label sources are available", () => {
        const button = document.createElement("div");
        makeKeyboardAccessible(button);
        expect(button.hasAttribute("aria-label")).toBe(false);
    });

    it("triggers onActivate callback when Enter, Space, or Spacebar is pressed", () => {
        const button = document.createElement("div");
        const onActivate = jest.fn();
        makeKeyboardAccessible(button, "Action", onActivate);

        ["Enter", " ", "Spacebar"].forEach(key => {
            const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
            const preventDefaultSpy = jest.spyOn(event, "preventDefault");
            const stopPropSpy = jest.spyOn(event, "stopPropagation");
            button.dispatchEvent(event);

            expect(preventDefaultSpy).toHaveBeenCalled();
            expect(stopPropSpy).toHaveBeenCalled();
            expect(onActivate).toHaveBeenCalledWith(event);
        });
    });

    it("delegates to element.click() when onActivate is not provided", () => {
        const button = document.createElement("div");
        button.click = jest.fn();
        makeKeyboardAccessible(button);

        const event = new KeyboardEvent("keydown", {
            key: "Enter",
            bubbles: true,
            cancelable: true
        });
        button.dispatchEvent(event);

        expect(button.click).toHaveBeenCalled();
    });

    it("ignores non-activation keys like Escape or Tab", () => {
        const button = document.createElement("div");
        const onActivate = jest.fn();
        makeKeyboardAccessible(button, "Action", onActivate);

        ["Escape", "Tab", "ArrowDown", "a"].forEach(key => {
            const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
            const preventDefaultSpy = jest.spyOn(event, "preventDefault");
            button.dispatchEvent(event);

            expect(preventDefaultSpy).not.toHaveBeenCalled();
            expect(onActivate).not.toHaveBeenCalled();
        });
    });

    it("replaces previous handler when called multiple times on the same element", () => {
        const button = document.createElement("div");
        const firstHandler = jest.fn();
        const secondHandler = jest.fn();

        makeKeyboardAccessible(button, "Action", firstHandler);
        makeKeyboardAccessible(button, "Action", secondHandler);

        const event = new KeyboardEvent("keydown", {
            key: "Enter",
            bubbles: true,
            cancelable: true
        });
        button.dispatchEvent(event);

        expect(firstHandler).not.toHaveBeenCalled();
        expect(secondHandler).toHaveBeenCalled();
    });

    it("handles elements where getAttribute is missing", () => {
        const element = {
            setAttribute: jest.fn(),
            id: "plain-id"
        };
        const result = makeKeyboardAccessible(element);
        expect(result).toBe(element);
        expect(element.setAttribute).toHaveBeenCalledWith("role", "button");
        expect(element.setAttribute).toHaveBeenCalledWith("tabindex", "0");
        expect(element.setAttribute).toHaveBeenCalledWith("aria-label", "plain-id");
    });
});

describe("readTextFile()", () => {
    let container;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
    });

    afterEach(() => {
        if (container.parentNode) {
            container.parentNode.removeChild(container);
        }
        jest.restoreAllMocks();
    });

    it("calls callback with error if input element is not found", () => {
        const callback = jest.fn();
        readTextFile("nonexistent-file-input", callback);
        expect(callback).toHaveBeenCalledWith(expect.any(Error));
        expect(callback.mock.calls[0][0].message).toBe("File input not found.");
    });

    it("resets file input value and triggers click", () => {
        const input = document.createElement("input");
        input.id = "file-input-test";
        input.type = "file";
        input.value = "";
        input.click = jest.fn();
        container.appendChild(input);

        const callback = jest.fn();
        readTextFile("file-input-test", callback);

        expect(input.value).toBe("");
        expect(input.click).toHaveBeenCalled();
        expect(typeof input.onchange).toBe("function");
    });

    it("returns early on change when no file is selected", () => {
        const input = document.createElement("input");
        input.id = "empty-file-input";
        input.type = "file";
        input.click = jest.fn();
        container.appendChild(input);

        const callback = jest.fn();
        readTextFile("empty-file-input", callback);

        Object.defineProperty(input, "files", { value: [], configurable: true });
        input.onchange();

        expect(callback).not.toHaveBeenCalled();
    });

    it("calls callback with error when file exceeds 1 MB limit", () => {
        const input = document.createElement("input");
        input.id = "large-file-input";
        input.type = "file";
        input.click = jest.fn();
        container.appendChild(input);

        const callback = jest.fn();
        readTextFile("large-file-input", callback);

        const largeFile = { size: 1024 * 1024 + 1, name: "large.txt" };
        Object.defineProperty(input, "files", { value: [largeFile], configurable: true });
        input.onchange();

        expect(callback).toHaveBeenCalledWith(expect.any(Error));
        expect(callback.mock.calls[0][0].message).toBe("File too large. Maximum is 1 MB.");
    });

    it("reads file content and invokes callback on success", () => {
        const input = document.createElement("input");
        input.id = "valid-file-input";
        input.type = "file";
        input.click = jest.fn();
        container.appendChild(input);

        const callback = jest.fn();
        readTextFile("valid-file-input", callback);

        const validFile = { size: 500, name: "sample.txt" };
        Object.defineProperty(input, "files", { value: [validFile], configurable: true });

        const mockReader = {
            readAsText: jest.fn(function () {
                this.onload({ target: { result: "project data payload" } });
            }),
            onload: null,
            onerror: null
        };
        const origFileReader = global.FileReader;
        global.FileReader = jest.fn(() => mockReader);

        input.onchange();

        expect(mockReader.readAsText).toHaveBeenCalledWith(validFile);
        expect(callback).toHaveBeenCalledWith(null, {
            text: "project data payload",
            file: validFile
        });

        global.FileReader = origFileReader;
    });

    it("calls callback with error when file reading fails", () => {
        const input = document.createElement("input");
        input.id = "error-file-input";
        input.type = "file";
        input.click = jest.fn();
        container.appendChild(input);

        const callback = jest.fn();
        readTextFile("error-file-input", callback);

        const validFile = { size: 500, name: "sample.txt" };
        Object.defineProperty(input, "files", { value: [validFile], configurable: true });

        const mockReader = {
            readAsText: jest.fn(function () {
                this.onerror();
            }),
            onload: null,
            onerror: null
        };
        const origFileReader = global.FileReader;
        global.FileReader = jest.fn(() => mockReader);

        input.onchange();

        expect(callback).toHaveBeenCalledWith(expect.any(Error));
        expect(callback.mock.calls[0][0].message).toBe("Failed to read file.");

        global.FileReader = origFileReader;
    });
});

describe("downloadTextFile()", () => {
    let origCreateObjectURL;
    let origRevokeObjectURL;

    beforeEach(() => {
        origCreateObjectURL = URL.createObjectURL;
        origRevokeObjectURL = URL.revokeObjectURL;
        URL.createObjectURL = jest.fn(() => "blob:fake-url-123");
        URL.revokeObjectURL = jest.fn();
    });

    afterEach(() => {
        URL.createObjectURL = origCreateObjectURL;
        URL.revokeObjectURL = origRevokeObjectURL;
    });

    it("creates a blob, triggers synthetic download click, and cleans up URL", () => {
        const appendChildSpy = jest.spyOn(document.body, "appendChild");
        const removeChildSpy = jest.spyOn(document.body, "removeChild");

        downloadTextFile("music blocks project code", "test-project.txt");

        expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
        expect(appendChildSpy).toHaveBeenCalled();
        const appendedLink = appendChildSpy.mock.calls[0][0];
        expect(appendedLink.tagName).toBe("A");
        expect(appendedLink.href).toBe("blob:fake-url-123");
        expect(appendedLink.download).toBe("test-project.txt");
        expect(removeChildSpy).toHaveBeenCalledWith(appendedLink);
        expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:fake-url-123");
    });
});

describe("createSharePopup()", () => {
    const anchor = {
        getBoundingClientRect: () => ({ left: 100, bottom: 200 })
    };

    afterEach(() => {
        document.body.innerHTML = "";
        jest.restoreAllMocks();
    });

    it("creates, positions, and populates the popup menu", () => {
        const itemHandler = jest.fn();
        const popup = createSharePopup("sharePopupTest", [["Export ABC", itemHandler]], anchor);

        expect(popup).not.toBeNull();
        expect(popup.id).toBe("sharePopupTest");
        expect(popup.style.top).toBe("204px");
        expect(popup.style.left).toBe("100px");
        expect(document.getElementById("sharePopupTest")).toBe(popup);

        const items = popup.children;
        expect(items.length).toBe(1);
        expect(items[0].textContent).toBe("Export ABC");
        expect(items[0].getAttribute("role")).toBe("button");
        expect(items[0].getAttribute("tabindex")).toBe("0");
    });

    it("toggles closed when called again with the same popup ID", () => {
        const itemHandler = jest.fn();
        const popup = createSharePopup("togglePopupTest", [["Export MIDI", itemHandler]], anchor);
        expect(popup).not.toBeNull();

        const toggledResult = createSharePopup(
            "togglePopupTest",
            [["Export MIDI", itemHandler]],
            anchor
        );
        expect(toggledResult).toBeNull();
        expect(document.getElementById("togglePopupTest")).toBeNull();
    });

    it("updates item styling on mouseenter and mouseleave", () => {
        const popup = createSharePopup("hoverPopupTest", [["Item 1", jest.fn()]], anchor);
        const item = popup.children[0];

        item.onmouseenter();
        expect(item.style.background).toBe("var(--color-bg-tertiary)");

        item.onmouseleave();
        expect(item.style.background).toBe("");
    });

    it("executes handler and cleans up on item click", () => {
        const itemHandler = jest.fn();
        const popup = createSharePopup("clickItemTest", [["Action", itemHandler]], anchor);
        const item = popup.children[0];

        item.onclick();

        expect(itemHandler).toHaveBeenCalled();
        expect(document.getElementById("clickItemTest")).toBeNull();
    });

    it("executes handler and cleans up on item Enter and Space keydown", () => {
        ["Enter", " "].forEach(key => {
            const itemHandler = jest.fn();
            const popup = createSharePopup("keyItemTest", [["Action", itemHandler]], anchor);
            const item = popup.children[0];

            const event = {
                key,
                preventDefault: jest.fn()
            };
            item.onkeydown(event);

            expect(event.preventDefault).toHaveBeenCalled();
            expect(itemHandler).toHaveBeenCalled();
            expect(document.getElementById("keyItemTest")).toBeNull();
        });
    });

    it("does not execute handler on unrelated keys like Escape or Tab", () => {
        const itemHandler = jest.fn();
        const popup = createSharePopup("unrelatedKeyTest", [["Action", itemHandler]], anchor);
        const item = popup.children[0];

        const event = {
            key: "Escape",
            preventDefault: jest.fn()
        };
        item.onkeydown(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(itemHandler).not.toHaveBeenCalled();
        expect(document.getElementById("unrelatedKeyTest")).not.toBeNull();
    });

    it("closes popup when clicking outside the popup", () => {
        const popup = createSharePopup("outsideClickTest", [["Action", jest.fn()]], anchor);
        expect(document.getElementById("outsideClickTest")).toBe(popup);

        const outsideTarget = document.createElement("div");
        document.body.appendChild(outsideTarget);

        const mousedownEvent = new MouseEvent("mousedown", { bubbles: true });
        Object.defineProperty(mousedownEvent, "target", { value: outsideTarget });
        document.dispatchEvent(mousedownEvent);

        expect(document.getElementById("outsideClickTest")).toBeNull();
    });

    it("keeps popup open when clicking inside the popup", () => {
        const popup = createSharePopup("insideClickTest", [["Action", jest.fn()]], anchor);
        const insideTarget = popup.children[0];

        const mousedownEvent = new MouseEvent("mousedown", { bubbles: true });
        Object.defineProperty(mousedownEvent, "target", { value: insideTarget });
        document.dispatchEvent(mousedownEvent);

        expect(document.getElementById("insideClickTest")).toBe(popup);
    });
});

describe("closeSharePopup()", () => {
    const anchor = { getBoundingClientRect: () => ({ left: 0, bottom: 0 }) };

    afterEach(() => {
        document.body.innerHTML = "";
        jest.restoreAllMocks();
    });

    it("removes an open popup and unregisters its mousedown listener", () => {
        createSharePopup("testSharePopup", [["Item", jest.fn()]], anchor);
        const popup = document.getElementById("testSharePopup");
        expect(popup).not.toBeNull();
        const handler = popup._closeHandler;
        const removeSpy = jest.spyOn(document, "removeEventListener");

        closeSharePopup("testSharePopup");

        expect(document.getElementById("testSharePopup")).toBeNull();
        expect(removeSpy).toHaveBeenCalledWith("mousedown", handler);
    });

    it("safely handles non-existent popup ID without error", () => {
        expect(() => closeSharePopup("nonExistentPopup")).not.toThrow();
    });

    it("safely removes element even if _closeHandler is not set", () => {
        const manualPopup = document.createElement("div");
        manualPopup.id = "manualPopup";
        document.body.appendChild(manualPopup);

        closeSharePopup("manualPopup");
        expect(document.getElementById("manualPopup")).toBeNull();
    });
});

describe("DomHelpers module structure", () => {
    it("exports all expected helper methods in object", () => {
        expect(DomHelpers).toHaveProperty("docByClass");
        expect(DomHelpers).toHaveProperty("docByTagName");
        expect(DomHelpers).toHaveProperty("docById");
        expect(DomHelpers).toHaveProperty("docByName");
        expect(DomHelpers).toHaveProperty("docBySelector");
        expect(DomHelpers).toHaveProperty("hideDOMLabel");
        expect(DomHelpers).toHaveProperty("displayMsg");
        expect(DomHelpers).toHaveProperty("closeWidgets");
        expect(DomHelpers).toHaveProperty("makeKeyboardAccessible");
        expect(DomHelpers).toHaveProperty("readTextFile");
        expect(DomHelpers).toHaveProperty("downloadTextFile");
        expect(DomHelpers).toHaveProperty("createSharePopup");
        expect(DomHelpers).toHaveProperty("closeSharePopup");
    });
});

describe("compatibility export via utils.js", () => {
    // utils.js re-exports these helpers (`...DomHelpers` in its own
    // module.exports) so existing `require("../utils")` consumers keep
    // working. Assert identity, not just equivalence, so a future change
    // that accidentally re-implements rather than re-exports gets caught.
    const utils = require("../utils.js");

    [
        "docById",
        "docByClass",
        "docByTagName",
        "docByName",
        "docBySelector",
        "hideDOMLabel",
        "displayMsg",
        "closeWidgets",
        "makeKeyboardAccessible",
        "readTextFile",
        "downloadTextFile",
        "createSharePopup",
        "closeSharePopup"
    ].forEach(name => {
        it(`utils.${name} is the same function as dom-helpers' ${name}`, () => {
            expect(utils[name]).toBe(DomHelpers[name]);
        });
    });
});
