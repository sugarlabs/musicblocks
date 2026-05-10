// Copyright (c) 2026 Music Blocks Contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.

"use strict";

// --- Globals expected by GlobalTag.js ---
global._ = (str) => str;
global.toTitleCase = (str) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

// Inline GlobalTag class (mirrors planet/js/GlobalTag.js)
class GlobalTag {
    constructor(Planet) {
        this.Planet = Planet;
        this.id = null;
        this.name = null;
        this.func = null;
        this.IsDisplayTag = null;
        this.specialTag = null;
        this.tagElement = null;
        this.globalPlanet = Planet.GlobalPlanet;
        this.selected = false;
        this.selectedClass = null;
    }

    render() {
        const tag = document.createElement("div");
        tag.classList.add("chipselect", "cursor");

        if (this.selected) tag.classList.add(this.selectedClass);

        tag.textContent = toTitleCase(_(this.name));

        tag.addEventListener("click", () => {
            this.onTagClick();
        });

        const elementTag = `${this.IsDisplayTag ? "primary" : "more"}chips`;
        document.getElementById(elementTag).appendChild(tag);

        this.tagElement = tag;
    }

    onTagClick() {
        if (this.specialTag && !this.selected)
            this.globalPlanet.selectSpecialTag(this);
        else {
            this.selected ? this.unselect() : this.select();
            this.globalPlanet.refreshTagList();
        }
    }

    select() {
        this.tagElement.classList.add(this.selectedClass);
        this.selected = true;
    }

    unselect() {
        this.tagElement.classList.remove(this.selectedClass);
        this.selected = false;
    }

    init(obj) {
        const Planet = this.Planet;

        if (obj.id !== undefined) {
            this.specialTag = false;
            this.id = obj.id;
            this.name = Planet.TagsManifest[this.id].TagName;
            this.func = null;
            this.IsDisplayTag =
                Planet.TagsManifest[this.id].IsDisplayTag === "1";
            this.selectedClass = "selected";
        } else {
            this.specialTag = true;
            this.IsDisplayTag = true;
            this.id = null;
            this.name = obj.name;
            this.func = obj.func;
            this.selectedClass = "selected-special";
        }

        this.render();
    }
}

// --- Helpers ---

function makePlanet(overrides = {}) {
    return {
        GlobalPlanet: {
            selectSpecialTag: jest.fn(),
            refreshTagList: jest.fn(),
            ...overrides.GlobalPlanet,
        },
        TagsManifest: {
            1: { TagName: "Music", IsDisplayTag: "1" },
            2: { TagName: "Art", IsDisplayTag: "0" },
        },
        ...overrides,
    };
}

function setupDOM() {
    document.body.innerHTML = `
        <div id="primarychips"></div>
        <div id="morechips"></div>
    `;
}

// --- Tests ---

describe("GlobalTag", () => {
    beforeEach(() => {
        setupDOM();
    });

    describe("constructor", () => {
        test("initialises all properties to null/false defaults", () => {
            const planet = makePlanet();
            const tag = new GlobalTag(planet);

            expect(tag.Planet).toBe(planet);
            expect(tag.id).toBeNull();
            expect(tag.name).toBeNull();
            expect(tag.func).toBeNull();
            expect(tag.IsDisplayTag).toBeNull();
            expect(tag.specialTag).toBeNull();
            expect(tag.tagElement).toBeNull();
            expect(tag.globalPlanet).toBe(planet.GlobalPlanet);
            expect(tag.selected).toBe(false);
            expect(tag.selectedClass).toBeNull();
        });
    });

    describe("init — regular tag (obj.id defined)", () => {
        test("sets correct properties for a display tag (IsDisplayTag=1)", () => {
            const planet = makePlanet();
            const tag = new GlobalTag(planet);
            tag.init({ id: 1 });

            expect(tag.specialTag).toBe(false);
            expect(tag.id).toBe(1);
            expect(tag.name).toBe("Music");
            expect(tag.func).toBeNull();
            expect(tag.IsDisplayTag).toBe(true);
            expect(tag.selectedClass).toBe("selected");
        });

        test("sets IsDisplayTag=false when manifest value is not '1'", () => {
            const planet = makePlanet();
            const tag = new GlobalTag(planet);
            tag.init({ id: 2 });

            expect(tag.IsDisplayTag).toBe(false);
        });

        test("renders tag into #primarychips for display tags", () => {
            const planet = makePlanet();
            const tag = new GlobalTag(planet);
            tag.init({ id: 1 });

            const container = document.getElementById("primarychips");
            expect(container.children.length).toBe(1);
            expect(container.children[0].textContent).toBe("Music");
        });

        test("renders tag into #morechips for non-display tags", () => {
            const planet = makePlanet();
            const tag = new GlobalTag(planet);
            tag.init({ id: 2 });

            const container = document.getElementById("morechips");
            expect(container.children.length).toBe(1);
        });
    });

    describe("init — special tag (obj.id undefined)", () => {
        test("sets correct properties for a special tag", () => {
            const planet = makePlanet();
            const tag = new GlobalTag(planet);
            const fn = jest.fn();
            tag.init({ name: "All Projects", func: fn });

            expect(tag.specialTag).toBe(true);
            expect(tag.IsDisplayTag).toBe(true);
            expect(tag.id).toBeNull();
            expect(tag.name).toBe("All Projects");
            expect(tag.func).toBe(fn);
            expect(tag.selectedClass).toBe("selected-special");
        });

        test("renders special tag into #primarychips", () => {
            const planet = makePlanet();
            const tag = new GlobalTag(planet);
            tag.init({ name: "My Projects", func: jest.fn() });

            const container = document.getElementById("primarychips");
            expect(container.children.length).toBe(1);
        });
    });

    describe("render", () => {
        test("tag element has chipselect and cursor classes", () => {
            const planet = makePlanet();
            const tag = new GlobalTag(planet);
            tag.init({ id: 1 });

            expect(tag.tagElement.classList.contains("chipselect")).toBe(true);
            expect(tag.tagElement.classList.contains("cursor")).toBe(true);
        });

        test("adds selectedClass to element when selected=true before render", () => {
            const planet = makePlanet();
            const tag = new GlobalTag(planet);
            tag.selected = true;
            tag.selectedClass = "selected";
            // manually set name/IsDisplayTag so render() works
            tag.name = "Music";
            tag.IsDisplayTag = true;
            tag.render();

            expect(tag.tagElement.classList.contains("selected")).toBe(true);
        });

        test("does not add selectedClass when selected=false", () => {
            const planet = makePlanet();
            const tag = new GlobalTag(planet);
            tag.init({ id: 1 });

            expect(tag.tagElement.classList.contains("selected")).toBe(false);
        });
    });

    describe("select / unselect", () => {
        test("select adds selectedClass and sets selected=true", () => {
            const planet = makePlanet();
            const tag = new GlobalTag(planet);
            tag.init({ id: 1 });
            tag.select();

            expect(tag.selected).toBe(true);
            expect(tag.tagElement.classList.contains("selected")).toBe(true);
        });

        test("unselect removes selectedClass and sets selected=false", () => {
            const planet = makePlanet();
            const tag = new GlobalTag(planet);
            tag.init({ id: 1 });
            tag.select();
            tag.unselect();

            expect(tag.selected).toBe(false);
            expect(tag.tagElement.classList.contains("selected")).toBe(false);
        });
    });

    describe("onTagClick", () => {
        test("calls selectSpecialTag for unselected special tag", () => {
            const planet = makePlanet();
            const tag = new GlobalTag(planet);
            tag.init({ name: "All Projects", func: jest.fn() });

            tag.onTagClick();

            expect(planet.GlobalPlanet.selectSpecialTag).toHaveBeenCalledWith(tag);
            expect(planet.GlobalPlanet.refreshTagList).not.toHaveBeenCalled();
        });

        test("does not call selectSpecialTag when special tag is already selected", () => {
            const planet = makePlanet();
            const tag = new GlobalTag(planet);
            tag.init({ name: "All Projects", func: jest.fn() });
            tag.selected = true;

            tag.onTagClick();

            expect(planet.GlobalPlanet.selectSpecialTag).not.toHaveBeenCalled();
            expect(planet.GlobalPlanet.refreshTagList).toHaveBeenCalled();
        });

        test("selects an unselected regular tag and refreshes tag list", () => {
            const planet = makePlanet();
            const tag = new GlobalTag(planet);
            tag.init({ id: 1 });

            tag.onTagClick();

            expect(tag.selected).toBe(true);
            expect(planet.GlobalPlanet.refreshTagList).toHaveBeenCalled();
        });

        test("unselects a selected regular tag and refreshes tag list", () => {
            const planet = makePlanet();
            const tag = new GlobalTag(planet);
            tag.init({ id: 1 });
            tag.select();

            tag.onTagClick();

            expect(tag.selected).toBe(false);
            expect(planet.GlobalPlanet.refreshTagList).toHaveBeenCalled();
        });

        test("click event on tagElement triggers onTagClick", () => {
            const planet = makePlanet();
            const tag = new GlobalTag(planet);
            tag.init({ id: 1 });

            const spy = jest.spyOn(tag, "onTagClick");
            tag.tagElement.click();

            expect(spy).toHaveBeenCalled();
        });
    });
});