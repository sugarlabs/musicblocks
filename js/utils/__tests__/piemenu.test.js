/**
 * @license
 * MusicBlocks v3.8.0
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

const mockDonutSlice = () => {};
const mockCustomization = () => ({});
const slicePath = () => ({
    DonutSlice: mockDonutSlice,
    DonutSliceCustomization: mockCustomization
});

global.slicePath = slicePath;

const PieMenuUtils = require("../piemenu");
const { configureWheel, updateWheelItems } = PieMenuUtils;

describe("piemenu utils", () => {
    describe("configureWheel", () => {
        let wheel;

        beforeEach(() => {
            wheel = {};
        });

        it("applies core donut slice configuration, radii, and defaults", () => {
            const colors = ["#ff0000", "#00ff00"];
            configureWheel(wheel, {
                colors,
                minRadius: 0.3,
                maxRadius: 0.8
            });

            expect(wheel.colors).toBe(colors);
            expect(wheel.slicePathFunction).toBe(mockDonutSlice);
            expect(wheel.slicePathCustom.minRadiusPercent).toBe(0.3);
            expect(wheel.slicePathCustom.maxRadiusPercent).toBe(0.8);
            expect(wheel.navAngle).toBe(-90);
            expect(wheel.animatetime).toBe(0);
        });

        it("applies optional clickModeRotate and selectionPaths", () => {
            configureWheel(wheel, {
                colors: [],
                minRadius: 0.2,
                maxRadius: 0.6,
                clickModeRotate: false,
                selectionPaths: true
            });

            expect(wheel.clickModeRotate).toBe(false);
            expect(wheel.sliceSelectedPathCustom).toBe(wheel.slicePathCustom);
            expect(wheel.sliceInitPathCustom).toBe(wheel.slicePathCustom);
        });

        it("applies custom navAngle and animatetime when provided", () => {
            configureWheel(wheel, {
                colors: [],
                minRadius: 0.1,
                maxRadius: 0.5,
                navAngle: 0,
                animatetime: 150
            });

            expect(wheel.navAngle).toBe(0);
            expect(wheel.animatetime).toBe(150);
        });

        it("applies optional titleRotateAngle and titleFont", () => {
            configureWheel(wheel, {
                colors: [],
                minRadius: 0.2,
                maxRadius: 0.7,
                titleRotateAngle: 90,
                titleFont: "100 14px sans-serif"
            });

            expect(wheel.titleRotateAngle).toBe(90);
            expect(wheel.titleFont).toBe("100 14px sans-serif");
        });
    });

    describe("updateWheelItems", () => {
        const createNavItem = () => ({
            title: "initial",
            basicNavTitleMax: { title: "initial" },
            basicNavTitleMin: { title: "initial" },
            hoverNavTitleMax: { title: "initial" },
            hoverNavTitleMin: { title: "initial" },
            selectedNavTitleMax: { title: "initial" },
            selectedNavTitleMin: { title: "initial" },
            initNavTitle: { title: "initial" },
            fillAttr: "initial",
            sliceHoverAttr: { fill: "initial" },
            slicePathAttr: { fill: "initial" },
            sliceSelectedAttr: { fill: "initial" },
            navTitle: { attr: jest.fn() }
        });

        it("propagates labels and colors to all required nav item title and slice states", () => {
            const refreshWheel = jest.fn();
            const wheel = {
                navItems: [createNavItem(), createNavItem()],
                refreshWheel
            };

            const labels = ["Mode 1", "Mode 2"];
            const colors = ["#112233", "#445566"];

            updateWheelItems(wheel, labels, colors);

            for (let i = 0; i < wheel.navItems.length; i++) {
                const item = wheel.navItems[i];
                expect(item.title).toBe(labels[i]);
                expect(item.basicNavTitleMax.title).toBe(labels[i]);
                expect(item.basicNavTitleMin.title).toBe(labels[i]);
                expect(item.hoverNavTitleMax.title).toBe(labels[i]);
                expect(item.hoverNavTitleMin.title).toBe(labels[i]);
                expect(item.selectedNavTitleMax.title).toBe(labels[i]);
                expect(item.selectedNavTitleMin.title).toBe(labels[i]);
                expect(item.initNavTitle.title).toBe(labels[i]);
                expect(item.fillAttr).toBe(colors[i]);
                expect(item.sliceHoverAttr.fill).toBe(colors[i]);
                expect(item.slicePathAttr.fill).toBe(colors[i]);
                expect(item.sliceSelectedAttr.fill).toBe(colors[i]);
                expect(item.navTitle.attr).toHaveBeenCalledWith({ text: labels[i] });
            }

            expect(refreshWheel).toHaveBeenCalledTimes(1);
        });

        it("does not throw when navTitle is missing or attr is not a function", () => {
            const refreshWheel = jest.fn();
            const itemWithoutAttr = createNavItem();
            delete itemWithoutAttr.navTitle;

            const wheel = {
                navItems: [itemWithoutAttr],
                refreshWheel
            };

            expect(() => updateWheelItems(wheel, ["Test"], ["#fff"])).not.toThrow();
            expect(itemWithoutAttr.title).toBe("Test");
            expect(refreshWheel).toHaveBeenCalledTimes(1);
        });
    });

    describe("module exports and browser script loading", () => {
        it("exports configureWheel and updateWheelItems on PieMenuUtils", () => {
            expect(PieMenuUtils.configureWheel).toBe(configureWheel);
            expect(PieMenuUtils.updateWheelItems).toBe(updateWheelItems);
        });

        it("evaluates cleanly in a browser-like script sandbox", () => {
            const source = fs.readFileSync(path.join(__dirname, "..", "piemenu.js"), "utf8");
            const sandbox = {
                slicePath,
                window: {}
            };
            vm.createContext(sandbox);
            vm.runInContext(source, sandbox);

            expect(typeof sandbox.configureWheel).toBe("function");
            expect(typeof sandbox.updateWheelItems).toBe("function");
            expect(sandbox.window.PieMenuUtils).toBeDefined();
            expect(sandbox.window.PieMenuUtils.configureWheel).toBe(sandbox.configureWheel);
            expect(sandbox.window.PieMenuUtils.updateWheelItems).toBe(sandbox.updateWheelItems);
        });
    });
});
