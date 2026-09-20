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
    closeWidgets
} = DomHelpers;

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

describe("DomHelpers module structure", () => {
    it("exports expected helper methods in object", () => {
        expect(DomHelpers).toHaveProperty("docByClass");
        expect(DomHelpers).toHaveProperty("docByTagName");
        expect(DomHelpers).toHaveProperty("docById");
        expect(DomHelpers).toHaveProperty("docByName");
        expect(DomHelpers).toHaveProperty("docBySelector");
        expect(DomHelpers).toHaveProperty("hideDOMLabel");
        expect(DomHelpers).toHaveProperty("displayMsg");
        expect(DomHelpers).toHaveProperty("closeWidgets");
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
        "closeWidgets"
    ].forEach(name => {
        it(`utils.${name} is the same function as dom-helpers' ${name}`, () => {
            expect(utils[name]).toBe(DomHelpers[name]);
        });
    });
});
