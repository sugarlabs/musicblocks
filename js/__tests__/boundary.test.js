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

global.base64Encode = jest.fn((str) => str);
global.createjs = {
    Container: jest.fn(() => ({
        children: [],
        addChild: jest.fn(),
        removeChild: jest.fn(),
        visible: true,
    })),
    Bitmap: jest.fn(),
};

global.window = {
    btoa: jest.fn((str) => Buffer.from(str).toString("base64")),
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
            setChildIndex: jest.fn(),
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
        expect(boundary.offScreen(boundary.x + boundary.dx + 1, boundary.y + boundary.dy + 1)).toBe(true);
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
