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

describe("PasteBox", () => {

    const _Image = global.Image;
    const _window = global.window;
    const _createjs = global.createjs;
    const _docById = global.docById;
    const _base64Encode = global.base64Encode;

    afterAll(() => {
        global.Image = _Image;
        global.window = _window;
        global.createjs = _createjs;
        global.docById = _docById;
        global.base64Encode = _base64Encode;
    });

    describe("constructor / hide / show / getPos", () => {
        let pasteBox, mockActivity, mockDocById;

        beforeEach(() => {
            mockActivity = {
                stage: { addChild: jest.fn() },
                refreshCanvas: jest.fn(),
                pasted: jest.fn(),
            };
            mockDocById = jest.fn();
            global.docById = mockDocById;
            global.base64Encode = jest.fn((x) => x);
            global.window = { btoa: jest.fn((x) => x) };

            pasteBox = new PasteBox(mockActivity);
        });

        it("should initialize with the correct default values", () => {
            expect(pasteBox.activity).toBe(mockActivity);
            expect(pasteBox._container).toBeNull();
            expect(pasteBox.save).toBeNull();
            expect(pasteBox.close).toBeNull();
            expect(pasteBox._scale).toBe(1);
        });

        it("should hide the container and clear the paste element", () => {
            pasteBox._container = { visible: true };
            mockDocById.mockReturnValue({
                value: "foo",
                style: { visibility: "visible" },
            });

            pasteBox.hide();

            expect(pasteBox._container.visible).toBe(false);
            expect(mockActivity.refreshCanvas).toHaveBeenCalled();
            expect(mockDocById).toHaveBeenCalledWith("paste");
            expect(mockDocById("paste").value).toBe("");
            expect(mockDocById("paste").style.visibility).toBe("hidden");
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
            pasteBox._container = { x: 12, y: 34 };
            expect(pasteBox.getPos()).toEqual([12, 34]);
        });
    });

    describe("createBox()", () => {
        let pasteBox, mockActivity;

        beforeEach(() => {
            mockActivity = {
                stage: { addChild: jest.fn() },
                refreshCanvas: jest.fn(),
                pasted: jest.fn(),
            };
            global.base64Encode = jest.fn((x) => x);
            global.window = { btoa: jest.fn((x) => x) };
            pasteBox = new PasteBox(mockActivity);
        });

        it("should create a container and add it to the stage", () => {
            const mockContainer = { addChild: jest.fn(), x: 0, y: 0, visible: false };
            global.createjs = {
                Container: jest.fn(() => mockContainer),
                Bitmap: jest.fn(),
                Shape: jest.fn(),
            };

            jest.spyOn(pasteBox, "_makeBoxBitmap");

            pasteBox.createBox(2, 10, 20);

            expect(pasteBox._scale).toBe(2);
            expect(global.createjs.Container).toHaveBeenCalled();
            expect(mockActivity.stage.addChild).toHaveBeenCalledWith(mockContainer);
            expect(mockContainer.x).toBe(10);
            expect(mockContainer.y).toBe(20);
            expect(pasteBox._makeBoxBitmap).toHaveBeenCalledWith(
                expect.any(String),
                "box",
                expect.any(Function),
                null
            );
        });

        it("should create a bitmap from SVG data and call the callback", () => {
            const mockContainer = {
                addChild: jest.fn(),
                x: 0,
                y: 0,
                visible: false,
                getBounds: jest.fn(() => ({ x: 0, y: 0, width: 300, height: 55 })),
                on: jest.fn(),
                hitArea: null,
            };

            const mockBitmap = { type: "BITMAP" };

            global.createjs = {
                Container: jest.fn(() => mockContainer),
                Bitmap: jest.fn(() => mockBitmap),
                Shape: jest.fn(() => ({
                    graphics: {
                        beginFill: jest.fn().mockReturnThis(),
                        drawRect: jest.fn().mockReturnThis(),
                    },
                })),
            };

            const img = { onload: null, src: "" };
            global.Image = jest.fn(() => img);

            pasteBox = new PasteBox(mockActivity);
            pasteBox.createBox(1, 0, 0);

            expect(img.onload).toBeInstanceOf(Function);
            img.onload();

            expect(mockContainer.addChild).toHaveBeenCalledWith(mockBitmap);
            expect(mockContainer.visible).toBe(true);
            expect(mockActivity.refreshCanvas).toHaveBeenCalled();
        });
    });

    describe("_loadClearContainerHandler click‐handler", () => {
        let pasteBox, mockActivity, handler;

        beforeEach(() => {
            mockActivity = { pasted: jest.fn(), refreshCanvas: jest.fn() };
            global.docById = jest.fn().mockReturnValue({
                value: "",
                style: { visibility: "visible" },
            });

            global.createjs = {
                Shape: jest.fn(() => ({
                    graphics: {
                        beginFill: jest.fn().mockReturnThis(),
                        drawRect: jest.fn().mockReturnThis(),
                    },
                })),
            };

            pasteBox = new PasteBox(mockActivity);
            pasteBox._scale = 1;
            pasteBox._container = {
                getBounds: jest.fn(() => ({ x: 0, y: 0, width: 300, height: 55 })),
                on: jest.fn((evt, cb) => { handler = cb; }),
                hitArea: null,
                x: 200,
                y: 0,
                visible: true,
            };

            pasteBox._loadClearContainerHandler();
        });

        it("should set up the click handler for the container", () => {
            expect(pasteBox._container.on).toHaveBeenCalledWith("click", expect.any(Function));
        });

        it("calls pasted() + hide() when clicking in paste area", () => {
            handler({ stageX: 410, stageY: 25 });
            expect(mockActivity.pasted).toHaveBeenCalled();
            expect(pasteBox._container.visible).toBe(false);
            expect(mockActivity.refreshCanvas).toHaveBeenCalled();
            expect(global.docById).toHaveBeenCalledWith("paste");
        });

        it("only calls hide() when clicking in close area", () => {
            handler({ stageX: 460, stageY: 10 });
            expect(mockActivity.pasted).not.toHaveBeenCalled();
            expect(pasteBox._container.visible).toBe(false);
            expect(mockActivity.refreshCanvas).toHaveBeenCalled();
            expect(global.docById).toHaveBeenCalledWith("paste");
        });

        it("does nothing when clicking outside both areas", () => {
            handler({ stageX: 300, stageY: 60 });
            expect(mockActivity.pasted).not.toHaveBeenCalled();
            expect(mockActivity.refreshCanvas).not.toHaveBeenCalled();
            expect(pasteBox._container.visible).toBe(true);
        });

        it("debounces rapid clicks in paste area", () => {
            jest.useFakeTimers();

            handler({ stageX: 410, stageY: 25 });
            handler({ stageX: 410, stageY: 25 });
            jest.advanceTimersByTime(500);
            handler({ stageX: 410, stageY: 25 });

            expect(mockActivity.pasted).toHaveBeenCalledTimes(2);
            jest.useRealTimers();
        });
    });
});
