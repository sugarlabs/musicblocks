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

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const slicePath = () => ({
    DonutSlice: "donut",
    DonutSliceCustomization: () => ({ minRadiusPercent: 0, maxRadiusPercent: 0 })
});

global.slicePath = slicePath;

const piemenu = require("../piemenu");

const readSource = name => fs.readFileSync(path.join(__dirname, "..", name), "utf8");

const makeWheel = () => ({
    colors: null,
    slicePathFunction: null,
    slicePathCustom: null,
    navAngle: null,
    animatetime: null,
    clickModeRotate: undefined,
    titleRotateAngle: undefined,
    titleFont: undefined,
    sliceSelectedPathCustom: undefined,
    sliceInitPathCustom: undefined
});

const makeNavItem = () => ({
    title: null,
    basicNavTitleMax: { title: null },
    basicNavTitleMin: { title: null },
    hoverNavTitleMax: { title: null },
    hoverNavTitleMin: { title: null },
    selectedNavTitleMax: { title: null },
    selectedNavTitleMin: { title: null },
    initNavTitle: { title: null },
    fillAttr: null,
    sliceHoverAttr: { fill: null },
    slicePathAttr: { fill: null },
    sliceSelectedAttr: { fill: null },
    navTitle: { attr: jest.fn() }
});

describe("piemenu", () => {
    it("applies donut-slice config and radii from a wheelnav instance", () => {
        const wheel = makeWheel();
        piemenu.configureWheel(wheel, { colors: ["a", "b"], minRadius: 10, maxRadius: 90 });
        expect(wheel.slicePathFunction).toBe("donut");
        expect(wheel.slicePathCustom.minRadiusPercent).toBe(10);
        expect(wheel.slicePathCustom.maxRadiusPercent).toBe(90);
        expect(wheel.colors).toEqual(["a", "b"]);
    });

    it("applies the optional rotate/selection-path/title/navAngle/animatetime options only when given", () => {
        const wheel = makeWheel();
        piemenu.configureWheel(wheel, {
            colors: [],
            minRadius: 5,
            maxRadius: 95,
            clickModeRotate: false,
            selectionPaths: true,
            titleRotateAngle: 0,
            titleFont: "10px sans-serif",
            navAngle: -90,
            animatetime: 0
        });
        expect(wheel.clickModeRotate).toBe(false);
        expect(wheel.sliceSelectedPathCustom).toBe(wheel.slicePathCustom);
        expect(wheel.sliceInitPathCustom).toBe(wheel.slicePathCustom);
        expect(wheel.titleRotateAngle).toBe(0);
        expect(wheel.titleFont).toBe("10px sans-serif");
        expect(wheel.navAngle).toBe(-90);
        expect(wheel.animatetime).toBe(0);
    });

    it("leaves the optional options, including navAngle and animatetime, untouched when omitted", () => {
        const wheel = makeWheel();
        piemenu.configureWheel(wheel, { colors: [], minRadius: 5, maxRadius: 95 });
        expect(wheel.clickModeRotate).toBeUndefined();
        expect(wheel.sliceSelectedPathCustom).toBeUndefined();
        expect(wheel.titleRotateAngle).toBeUndefined();
        expect(wheel.titleFont).toBeUndefined();
        expect(wheel.navAngle).toBeNull();
        expect(wheel.animatetime).toBeNull();
    });

    it("accepts a navAngle other than -90, for wheels that need a computed rotation", () => {
        const wheel = makeWheel();
        piemenu.configureWheel(wheel, { colors: [], minRadius: 0, maxRadius: 1, navAngle: -7.45 });
        expect(wheel.navAngle).toBe(-7.45);
    });

    it("accepts a non-zero animatetime, for wheels that want an animated transition", () => {
        const wheel = makeWheel();
        piemenu.configureWheel(wheel, { colors: [], minRadius: 0, maxRadius: 1, animatetime: 300 });
        expect(wheel.animatetime).toBe(300);
    });

    it("updates every label/color slot on a wheel and refreshes it", () => {
        const wheel = { navItems: [makeNavItem(), makeNavItem()], refreshWheel: jest.fn() };
        piemenu.updateWheelItems(wheel, ["A", "B"], ["red", "blue"]);
        expect(wheel.navItems[0].title).toBe("A");
        expect(wheel.navItems[1].title).toBe("B");
        expect(wheel.navItems[0].sliceHoverAttr.fill).toBe("red");
        expect(wheel.navItems[1].sliceHoverAttr.fill).toBe("blue");
        expect(wheel.navItems[0].navTitle.attr).toHaveBeenCalledWith({ text: "A" });
        expect(wheel.refreshWheel).toHaveBeenCalled();
    });

    it("skips the navTitle.attr push when a nav item has no navTitle", () => {
        const item = makeNavItem();
        delete item.navTitle;
        const wheel = { navItems: [item], refreshWheel: jest.fn() };
        expect(() => piemenu.updateWheelItems(wheel, ["A"], ["red"])).not.toThrow();
        expect(wheel.refreshWheel).toHaveBeenCalled();
    });

    it("exports every function the file declares", () => {
        const source = readSource("piemenu.js");
        const declared = [...source.matchAll(/^var (\w+) =/gm)]
            .map(match => match[1])
            .filter(name => name !== "PieMenuUtils");
        expect(Object.keys(piemenu).sort()).toEqual(declared.sort());
    });

    describe("loaded as a classic script, the way the browser does", () => {
        const load = () => {
            const sandbox = {
                slicePath,
                window: { btoa: value => Buffer.from(value, "binary").toString("base64") }
            };
            vm.createContext(sandbox);
            vm.runInContext(readSource("piemenu.js"), sandbox, { filename: "piemenu.js" });
            return sandbox;
        };

        it("loads without errors", () => {
            expect(() => load()).not.toThrow();
        });

        it("leaves configureWheel and updateWheelItems visible as bare globals", () => {
            const sandbox = load();
            expect(vm.runInContext("typeof configureWheel", sandbox)).toBe("function");
            expect(vm.runInContext("typeof updateWheelItems", sandbox)).toBe("function");
        });

        it("publishes the module object for the RequireJS shim", () => {
            const sandbox = load();
            const wheel = vm.runInContext(
                `(() => {
                    const wheel = { colors: null, slicePathFunction: null, slicePathCustom: null };
                    window.PieMenuUtils.configureWheel(wheel, { colors: [], minRadius: 0, maxRadius: 100 });
                    return wheel.slicePathFunction;
                })()`,
                sandbox
            );
            expect(wheel).toBe("donut");
        });
    });
});
