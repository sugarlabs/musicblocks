/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2026 nickhil_verma
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
const { piemenuIntervals } = require("../piemenus");

// Minimal mocks similar to existing piemenus tests
global.docById = jest.fn().mockReturnValue({
    style: { display: "", opacity: "" },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    getBoundingClientRect: jest.fn().mockReturnValue({ x: 0, y: 0 })
});
global.document = { getElementById: global.docById };
global.window = { innerWidth: 1024, addEventListener: jest.fn(), removeEventListener: jest.fn() };

global.wheelnav = jest.fn().mockImplementation(function (div) {
    this.navItems = Array.from({ length: 40 }, () => ({
        title: "",
        enabled: true,
        navItem: { hide: jest.fn(), show: jest.fn() },
        sliceSelectedAttr: {},
        sliceHoverAttr: {},
        titleSelectedAttr: {},
        titleHoverAttr: {}
    }));
    this.selectedNavItemIndex = 0;
    this.colors = [];
    this.raphael = { canvas: {} };
    this.on = jest.fn();
    this.createWheel = jest.fn(labels => {
        if (labels) labels.forEach((l, i) => (this.navItems[i].title = l));
    });
    this.initWheel = jest.fn();
    this.navigateWheel = jest.fn(index => {
        this.selectedNavItemIndex = index;
        if (this.navItems[index] && typeof this.navItems[index].navigateFunction === "function") {
            this.navItems[index].navigateFunction();
        }
    });
    this.removeWheel = jest.fn();
    this.refreshWheel = jest.fn();
    this.setTooltips = jest.fn();
});

global.slicePath = jest.fn().mockReturnValue({
    DonutSlice: jest.fn(),
    DonutSliceCustomization: jest.fn().mockReturnValue({ minRadiusPercent: 0, maxRadiusPercent: 0 })
});

global.platformColor = {
    intervalWheelcolors: ["#fff"],
    intervalNameWheelcolors: ["#fff"],
    exitWheelcolors: ["#000"]
};
global._ = jest.fn(s => s);

// Define INTERVALS so piemenuIntervals can use it
global.INTERVALS = [
    ["perfect", "perfect", [1, 4, 5, 8]],
    ["minor", "minor", [2, 3, 6, 7]],
    ["diminished", "diminished", [2, 3, 4, 5, 6, 7, 8]],
    ["augmented", "augmented", [1, 2, 3, 4, 5, 6, 7, 8]],
    ["major", "major", [2, 3, 6, 7]]
];

describe("piemenuIntervals tab gating", () => {
    let mockBlock;

    beforeEach(() => {
        mockBlock = {
            container: { x: 0, y: 0, setChildIndex: jest.fn(), children: [] },
            blocks: {
                stageClick: false,
                blockScale: 1,
                turtles: { _canvas: { width: 800, height: 600 } }
            },
            activity: {
                canvas: { offsetLeft: 0, offsetTop: 0 },
                blocksContainer: { x: 0, y: 0 },
                getStageScale: () => 1
            },
            connections: [],
            updateCache: jest.fn(),
            text: { text: "" },
            value: ""
        };
        jest.clearAllMocks();
    });

    test("shows only allowed numeric tabs for selected interval", () => {
        // Choose "perfect 1" as selectedInterval
        piemenuIntervals(mockBlock, "perfect 1");

        // interval index for "perfect" is 0; its active tabs are [1,4,5,8]
        // For interval 0, nav item indices are 0*8 + j (j 0..7) -> indices 0..7
        // Allowed j indices: 0,3,4,7
        const allowed = new Set([0, 3, 4, 7]);

        for (let j = 0; j < 8; j++) {
            const nav = mockBlock._intervalWheel.navItems[j];
            if (!nav) continue;
            if (allowed.has(j)) {
                expect(nav.navItem.show).toHaveBeenCalled();
            } else {
                expect(nav.navItem.hide).toHaveBeenCalled();
            }
        }
    });
});
