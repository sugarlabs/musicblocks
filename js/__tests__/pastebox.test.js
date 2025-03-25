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

const PasteBox = require("../pastebox");

const mockActivity = {
    stage: {
        addChild: jest.fn(),
    },
    refreshCanvas: jest.fn(),
};

const mockDocById = jest.fn();
global.docById = mockDocById;

const mockCreatejs = {
    Container: jest.fn(() => ({
        addChild: jest.fn(),
        getBounds: jest.fn(() => ({
            x: 0,
            y: 0,
            width: 100,
            height: 50,
        })),
        on: jest.fn(),
    })),
    Shape: jest.fn(() => ({
        graphics: {
            beginFill: jest.fn().mockReturnThis(),
            drawRect: jest.fn().mockReturnThis(),
        },
    })),
    Bitmap: jest.fn(),
};
global.createjs = mockCreatejs;

global.base64Encode = jest.fn((data) => data);

describe("PasteBox Class", () => {
    let pasteBox;

    beforeEach(() => {
        jest.clearAllMocks();
        pasteBox = new PasteBox(mockActivity);
    });

    it("should initialize with the correct default values", () => {
        expect(pasteBox.activity).toBe(mockActivity);
        expect(pasteBox._container).toBe(null);
        expect(pasteBox.save).toBe(null);
        expect(pasteBox.close).toBe(null);
        expect(pasteBox._scale).toBe(1);
    });

    it("should hide the container and clear the paste element", () => {
        pasteBox._container = { visible: true };
        mockDocById.mockReturnValue({
            value: "",
            style: { visibility: "visible" },
        });

        pasteBox.hide();

        expect(pasteBox._container.visible).toBe(false);
        expect(mockActivity.refreshCanvas).toHaveBeenCalled();
        expect(mockDocById).toHaveBeenCalledWith("paste");
        expect(mockDocById("paste").value).toBe("");
        expect(mockDocById("paste").style.visibility).toBe("hidden");
    });

    it("should create a container and add it to the stage", () => {
        pasteBox.createBox(2, 100, 200);

        expect(pasteBox._scale).toBe(2);
        expect(mockCreatejs.Container).toHaveBeenCalled();
        expect(mockActivity.stage.addChild).toHaveBeenCalledWith(pasteBox._container);
        expect(pasteBox._container.x).toBe(100);
        expect(pasteBox._container.y).toBe(200);
    });

    it("should make the container visible and show the paste element", () => {
        pasteBox._container = { visible: false };
        mockDocById.mockReturnValue({ style: { visibility: "hidden" } });

        pasteBox.show();

        expect(pasteBox._container.visible).toBe(true);
        expect(mockActivity.refreshCanvas).toHaveBeenCalled();
        expect(mockDocById).toHaveBeenCalledWith("paste");
        expect(mockDocById("paste").style.visibility).toBe("visible");
    });

    it("should return the position of the container", () => {
        pasteBox._container = { x: 150, y: 250 };
        const position = pasteBox.getPos();

        expect(position).toEqual([150, 250]);
    });

    it("should set up the click handler for the container", () => {
        const mockBounds = { x: 0, y: 0, width: 100, height: 50 };
        pasteBox._container = {
            getBounds: jest.fn().mockReturnValue(mockBounds),
            hitArea: null,
            on: jest.fn(),
        };

        pasteBox._loadClearContainerHandler();

        expect(mockCreatejs.Shape).toHaveBeenCalled();
        expect(pasteBox._container.getBounds).toHaveBeenCalled();
        expect(pasteBox._container.on).toHaveBeenCalledWith("click", expect.any(Function));
    });

    it("should create a bitmap from SVG data and call the callback", () => {
        const mockCallback = jest.fn();
        const mockImg = { onload: null };
        jest.spyOn(global, "Image").mockImplementation(() => mockImg);

        pasteBox._makeBoxBitmap("data", "box", mockCallback, null);

        mockImg.onload();

        expect(global.base64Encode).toHaveBeenCalledWith("data");
        expect(mockCreatejs.Bitmap).toHaveBeenCalled();
        expect(mockCallback).toHaveBeenCalled();
    });
});
