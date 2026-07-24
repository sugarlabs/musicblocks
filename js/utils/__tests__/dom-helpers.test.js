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
    beforeEach(() => {
        document.getElementById = jest.fn(() => null);
        document.getElementsByClassName = jest.fn(() => []);
        document.getElementsByTagName = jest.fn(() => []);
        document.getElementsByName = jest.fn(() => []);
        document.querySelector = jest.fn(() => null);
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
    it("hides textLabel, numberLabel, and wheelDiv when they exist", () => {
        const textLabel = { style: { display: "block" } };
        const numberLabel = { style: { display: "block" } };
        const piemenu = { style: { display: "block" } };
        document.getElementById = jest.fn(id => {
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
        document.getElementById = jest.fn(() => null);
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
