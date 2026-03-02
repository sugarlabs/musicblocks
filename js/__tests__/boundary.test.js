/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Justin Charles
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

global.base64Encode = jest.fn(str => str);
global.createjs = {
    Container: jest.fn(() => ({
        children: [],
        addChild: jest.fn(),
        removeChild: jest.fn(),
        visible: true
    })),
    Bitmap: jest.fn()
};

global.window = {
    btoa: jest.fn(str => Buffer.from(str).toString("base64"))
};

global.BOUNDARY = `
<svg xmlns="http://www.w3.org/2000/svg" width="WIDTH" height="HEIGHT">
    <rect x="X" y="Y" width="DX" height="DY" stroke="stroke_color" fill="none" stroke-width="2"/>
</svg>
`;

const Boundary = require("../boundary");

describe("Boundary Class", () => {
    let stage;
    let boundary;

    beforeEach(() => {
        stage = {
            addChild: jest.fn(),
            setChildIndex: jest.fn()
        };

        boundary = new Boundary(stage);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should initialize with a container and add it to the stage", () => {
        expect(stage.addChild).toHaveBeenCalledWith(boundary._container);
        expect(stage.setChildIndex).toHaveBeenCalledWith(boundary._container, 0);
    });

    it("should call create and destroy methods when setting scale", () => {
        const createSpy = jest.spyOn(boundary, "create");
        const destroySpy = jest.spyOn(boundary, "destroy");

        boundary.setScale(800, 600, 2);

        expect(destroySpy).toHaveBeenCalled();
        expect(createSpy).toHaveBeenCalledWith(800, 600, 2);
    });

    it("should correctly determine if a point is off-screen", () => {
        boundary.create(800, 600, 2);

        expect(boundary.offScreen(50, 50)).toBe(true);
        expect(boundary.offScreen(boundary.x + 1, boundary.y + 1)).toBe(false);
        expect(boundary.offScreen(boundary.x + boundary.dx + 1, boundary.y + boundary.dy + 1)).toBe(
            true
        );
    });

    it("should hide and show the container", () => {
        boundary.hide();
        expect(boundary._container.visible).toBe(false);

        boundary.show();
        expect(boundary._container.visible).toBe(true);
    });

    it("should destroy the first child in the container", () => {
        const childMock = {};
        boundary._container.children.push(childMock);

        boundary.destroy();
        expect(boundary._container.removeChild).toHaveBeenCalledWith(childMock);
    });

    it("should create a boundary with the correct dimensions and add it to the container", () => {
        const mockImage = { onload: null, src: "" };
        const imgMock = jest.spyOn(global, "Image").mockImplementation(() => mockImage);

        boundary.create(800, 600, 2);

        expect(mockImage.onload).not.toBeNull();
        expect(mockImage.src).toContain("data:image/svg+xml;base64,");
        imgMock.mockRestore();
    });
});

describe("offScreen edge cases", () => {
    let stage;
    let boundary;

    beforeEach(() => {
        stage = {
            addChild: jest.fn(),
            setChildIndex: jest.fn()
        };

        boundary = new Boundary(stage);
        boundary.create(800, 600, 1);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should return false for a point exactly at top-left corner (x, y)", () => {
        // offScreen uses strict < and >, so exact boundary is NOT off-screen
        expect(boundary.offScreen(boundary.x, boundary.y)).toBe(false);
    });

    it("should return false for a point exactly at bottom-right corner (x+dx, y+dy)", () => {
        expect(boundary.offScreen(boundary.x + boundary.dx, boundary.y + boundary.dy)).toBe(false);
    });

    it("should return true for a point just left of the boundary", () => {
        expect(boundary.offScreen(boundary.x - 1, boundary.y + 1)).toBe(true);
    });

    it("should return true for a point just above the boundary", () => {
        expect(boundary.offScreen(boundary.x + 1, boundary.y - 1)).toBe(true);
    });

    it("should return true for a point just right of the boundary", () => {
        expect(boundary.offScreen(boundary.x + boundary.dx + 1, boundary.y + 1)).toBe(true);
    });

    it("should return true for a point just below the boundary", () => {
        expect(boundary.offScreen(boundary.x + 1, boundary.y + boundary.dy + 1)).toBe(true);
    });

    it("should return false for the center of the boundary", () => {
        const centerX = boundary.x + boundary.dx / 2;
        const centerY = boundary.y + boundary.dy / 2;
        expect(boundary.offScreen(centerX, centerY)).toBe(false);
    });

    it("should return true for negative coordinates", () => {
        expect(boundary.offScreen(-100, -100)).toBe(true);
    });

    it("should return true for very large coordinates", () => {
        expect(boundary.offScreen(10000, 10000)).toBe(true);
    });

    it("should return false for a point on the left edge", () => {
        expect(boundary.offScreen(boundary.x, boundary.y + boundary.dy / 2)).toBe(false);
    });

    it("should return false for a point on the right edge", () => {
        expect(boundary.offScreen(boundary.x + boundary.dx, boundary.y + boundary.dy / 2)).toBe(
            false
        );
    });

    it("should return false for a point on the top edge", () => {
        expect(boundary.offScreen(boundary.x + boundary.dx / 2, boundary.y)).toBe(false);
    });

    it("should return false for a point on the bottom edge", () => {
        expect(boundary.offScreen(boundary.x + boundary.dx / 2, boundary.y + boundary.dy)).toBe(
            false
        );
    });
});

describe("create dimension calculations", () => {
    let stage;
    let boundary;

    beforeEach(() => {
        stage = {
            addChild: jest.fn(),
            setChildIndex: jest.fn()
        };

        boundary = new Boundary(stage);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should compute correct dimensions at scale 1", () => {
        boundary.create(800, 600, 1);

        expect(boundary.w).toBe(800); // 800 / 1
        expect(boundary.x).toBe(68); // 55 + 13
        expect(boundary.dx).toBe(800 - 136); // w - (110 + 26)

        expect(boundary.h).toBe(600); // 600 / 1
        expect(boundary.y).toBe(68); // 55 + 13
        expect(boundary.dy).toBe(600 - 81); // h - (55 + 26)
    });

    it("should compute correct dimensions at scale 2", () => {
        boundary.create(800, 600, 2);

        expect(boundary.w).toBe(400); // 800 / 2
        expect(boundary.x).toBe(68);
        expect(boundary.dx).toBe(400 - 136);

        expect(boundary.h).toBe(300); // 600 / 2
        expect(boundary.y).toBe(68);
        expect(boundary.dy).toBe(300 - 81);
    });

    it("should compute correct dimensions at scale 0.5", () => {
        boundary.create(800, 600, 0.5);

        expect(boundary.w).toBe(1600); // 800 / 0.5
        expect(boundary.x).toBe(68);
        expect(boundary.dx).toBe(1600 - 136);

        expect(boundary.h).toBe(1200); // 600 / 0.5
        expect(boundary.y).toBe(68);
        expect(boundary.dy).toBe(1200 - 81);
    });

    it("should compute correct dimensions for large canvas", () => {
        boundary.create(1920, 1080, 1);

        expect(boundary.w).toBe(1920);
        expect(boundary.dx).toBe(1920 - 136);
        expect(boundary.h).toBe(1080);
        expect(boundary.dy).toBe(1080 - 81);
    });

    it("should compute correct dimensions for small canvas", () => {
        boundary.create(200, 200, 1);

        expect(boundary.w).toBe(200);
        expect(boundary.dx).toBe(200 - 136);
        expect(boundary.h).toBe(200);
        expect(boundary.dy).toBe(200 - 81);
    });

    it("should have consistent x and y values regardless of scale", () => {
        boundary.create(800, 600, 1);
        const x1 = boundary.x;
        const y1 = boundary.y;

        boundary.create(800, 600, 2);
        expect(boundary.x).toBe(x1);
        expect(boundary.y).toBe(y1);

        boundary.create(800, 600, 0.5);
        expect(boundary.x).toBe(x1);
        expect(boundary.y).toBe(y1);
    });
});

describe("destroy edge cases", () => {
    let stage;
    let boundary;

    beforeEach(() => {
        stage = {
            addChild: jest.fn(),
            setChildIndex: jest.fn()
        };

        boundary = new Boundary(stage);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should not call removeChild when container has no children", () => {
        boundary._container.children = [];

        boundary.destroy();
        expect(boundary._container.removeChild).not.toHaveBeenCalled();
    });

    it("should remove only the first child when container has multiple children", () => {
        const child1 = { id: 1 };
        const child2 = { id: 2 };
        boundary._container.children = [child1, child2];

        boundary.destroy();
        expect(boundary._container.removeChild).toHaveBeenCalledWith(child1);
        expect(boundary._container.removeChild).toHaveBeenCalledTimes(1);
    });

    it("should be safe to call destroy multiple times", () => {
        const child = {};
        boundary._container.children = [child];
        boundary.destroy();

        boundary._container.children = [];
        boundary.destroy();
        // Should not throw
        expect(boundary._container.removeChild).toHaveBeenCalledTimes(1);
    });
});

describe("setScale integration", () => {
    let stage;
    let boundary;

    beforeEach(() => {
        stage = {
            addChild: jest.fn(),
            setChildIndex: jest.fn()
        };

        boundary = new Boundary(stage);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should update dimensions when setScale is called", () => {
        boundary.create(800, 600, 1);
        expect(boundary.w).toBe(800);

        boundary.setScale(800, 600, 2);
        expect(boundary.w).toBe(400);
    });

    it("should destroy old boundary before creating new one", () => {
        const destroySpy = jest.spyOn(boundary, "destroy");
        const createSpy = jest.spyOn(boundary, "create");

        boundary.setScale(1200, 900, 1.5);

        // Verify destroy was called before create using invocation order
        const destroyOrder = destroySpy.mock.invocationCallOrder[0];
        const createOrder = createSpy.mock.invocationCallOrder[0];
        expect(destroyOrder).toBeLessThan(createOrder);
    });
});
