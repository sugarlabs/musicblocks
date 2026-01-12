/**
 * @license
 * MusicBlocks v3.6.2
 * Copyright (C) 2025 Rishi2600
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

const GIFAnimator = require("../gif-animator");

describe("GIFAnimator", () => {
    let animator;

    beforeEach(() => {
        animator = new GIFAnimator();

        // Mock DOM elements
        global.document = {
            createElement: jest.fn(tag => {
                if (tag === "img") {
                    return {
                        src: "",
                        style: { display: "" }
                    };
                }
                if (tag === "canvas") {
                    return {
                        width: 0,
                        height: 0,
                        getContext: jest.fn(() => ({
                            drawImage: jest.fn(),
                            clearRect: jest.fn(),
                            save: jest.fn(),
                            restore: jest.fn(),
                            translate: jest.fn(),
                            rotate: jest.fn()
                        }))
                    };
                }
                return {};
            }),
            body: {
                appendChild: jest.fn(),
                removeChild: jest.fn()
            }
        };

        // Mock requestAnimationFrame and cancelAnimationFrame
        global.requestAnimationFrame = jest.fn(cb => {
            setTimeout(() => cb(Date.now()), 0);
            return 1;
        });
        global.cancelAnimationFrame = jest.fn();

        // Mock Date.now for predictable IDs
        jest.spyOn(Date, "now").mockReturnValue(1234567890);

        // Mock window
        global.window = {};
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
        delete global.document;
        delete global.window;
        delete global.SuperGif;
    });

    describe("constructor", () => {
        it("should initialize with empty animations map", () => {
            expect(animator.animations).toBeInstanceOf(Map);
            expect(animator.animations.size).toBe(0);
        });

        it("should initialize with isRunning as false", () => {
            expect(animator.isRunning).toBe(false);
        });

        it("should initialize frameRequestId as null", () => {
            expect(animator.frameRequestId).toBe(null);
        });

        it("should initialize gifCounter as 0", () => {
            expect(animator.gifCounter).toBe(0);
        });
    });

    describe("isAnimatedGIF", () => {
        it("should return true for valid GIF data URL", () => {
            const gifDataURL =
                "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
            expect(animator.isAnimatedGIF(gifDataURL)).toBe(true);
        });

        it("should return false for PNG data URL", () => {
            const pngDataURL =
                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
            expect(animator.isAnimatedGIF(pngDataURL)).toBe(false);
        });

        it("should return false for JPEG data URL", () => {
            const jpegDataURL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD";
            expect(animator.isAnimatedGIF(jpegDataURL)).toBe(false);
        });

        it("should return false for non-string input", () => {
            expect(animator.isAnimatedGIF(null)).toBe(false);
            expect(animator.isAnimatedGIF(undefined)).toBe(false);
            expect(animator.isAnimatedGIF(123)).toBe(false);
            expect(animator.isAnimatedGIF({})).toBe(false);
        });

        it("should return false for empty string", () => {
            expect(animator.isAnimatedGIF("")).toBe(false);
        });

        it("should return false for regular URL", () => {
            expect(animator.isAnimatedGIF("https://example.com/image.gif")).toBe(false);
        });
    });

    describe("generateGifId", () => {
        it("should generate unique ID with timestamp and counter", () => {
            const id1 = animator.generateGifId();
            expect(id1).toBe("gif_1234567890_0");
        });

        it("should increment counter for each call", () => {
            const id1 = animator.generateGifId();
            const id2 = animator.generateGifId();
            const id3 = animator.generateGifId();

            expect(id1).toBe("gif_1234567890_0");
            expect(id2).toBe("gif_1234567890_1");
            expect(id3).toBe("gif_1234567890_2");
        });

        it("should include gif_ prefix", () => {
            const id = animator.generateGifId();
            expect(id).toMatch(/^gif_/);
        });

        it("should generate different IDs on subsequent calls", () => {
            const ids = new Set();
            for (let i = 0; i < 10; i++) {
                ids.add(animator.generateGifId());
            }
            expect(ids.size).toBe(10);
        });
    });

    describe("createAnimation", () => {
        let mockCanvas;
        let mockSuperGif;
        let mockInternalCanvas;

        beforeEach(() => {
            mockCanvas = {
                getContext: jest.fn(() => ({
                    drawImage: jest.fn(),
                    clearRect: jest.fn(),
                    save: jest.fn(),
                    restore: jest.fn(),
                    translate: jest.fn(),
                    rotate: jest.fn()
                }))
            };

            mockInternalCanvas = {
                width: 100,
                height: 100
            };

            mockSuperGif = {
                load: jest.fn(callback => callback()),
                get_length: jest.fn(() => 10),
                get_canvas: jest.fn(() => mockInternalCanvas),
                move_to: jest.fn(),
                pause: jest.fn()
            };

            // Mock SuperGif as GLOBAL constructor (not window.SuperGif)
            global.SuperGif = jest.fn(() => mockSuperGif);
            global.window.SuperGif = global.SuperGif; // Also set on window for consistency
        });

        it("should return null when SuperGif is not available", async () => {
            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
            delete global.window.SuperGif;

            const result = await animator.createAnimation(
                "data:image/gif;base64,test",
                mockCanvas,
                100,
                100,
                50,
                50,
                0
            );

            expect(result).toBe(null);
            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });

        it("should return null for single-frame GIF", async () => {
            mockSuperGif.get_length.mockReturnValue(1);

            const result = await animator.createAnimation(
                "data:image/gif;base64,test",
                mockCanvas,
                100,
                100,
                50,
                50,
                0
            );

            expect(result).toBe(null);
        });

        it("should create animation and return gifId for multi-frame GIF", async () => {
            const result = await animator.createAnimation(
                "data:image/gif;base64,test",
                mockCanvas,
                100,
                100,
                50,
                50,
                0
            );

            expect(result).toBe("gif_1234567890_0");
            expect(animator.animations.size).toBe(1);
        });

        it("should store animation with correct properties", async () => {
            const gifId = await animator.createAnimation(
                "data:image/gif;base64,test",
                mockCanvas,
                150,
                200,
                75,
                100,
                45
            );

            const animation = animator.animations.get(gifId);
            expect(animation).toBeDefined();
            expect(animation.x).toBe(150);
            expect(animation.y).toBe(200);
            expect(animation.width).toBe(75);
            expect(animation.height).toBe(100);
            expect(animation.rotation).toBe(45);
            expect(animation.currentFrame).toBe(0);
            expect(animation.disposed).toBe(false);
        });

        it("should start animation loop if not already running", async () => {
            expect(animator.isRunning).toBe(false);

            await animator.createAnimation(
                "data:image/gif;base64,test",
                mockCanvas,
                100,
                100,
                50,
                50,
                0
            );

            expect(animator.isRunning).toBe(true);
        });

        it("should create hidden img element", async () => {
            const createElementSpy = jest.spyOn(global.document, "createElement");
            const appendChildSpy = jest.spyOn(global.document.body, "appendChild");

            await animator.createAnimation(
                "data:image/gif;base64,test",
                mockCanvas,
                100,
                100,
                50,
                50,
                0
            );

            expect(createElementSpy).toHaveBeenCalledWith("img");
            expect(appendChildSpy).toHaveBeenCalled();
        });

        it("should handle errors gracefully", async () => {
            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
            mockSuperGif.load.mockImplementation(() => {
                throw new Error("Load failed");
            });

            const result = await animator.createAnimation(
                "data:image/gif;base64,test",
                mockCanvas,
                100,
                100,
                50,
                50,
                0
            );

            expect(result).toBe(null);
            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });
    });

    describe("renderFrame", () => {
        let mockAnimation;
        let mockContext;

        beforeEach(() => {
            mockContext = {
                save: jest.fn(),
                restore: jest.fn(),
                translate: jest.fn(),
                rotate: jest.fn(),
                clearRect: jest.fn(),
                drawImage: jest.fn()
            };

            mockAnimation = {
                canvas: {
                    getContext: jest.fn(() => mockContext)
                },
                gifPlayer: {
                    move_to: jest.fn(),
                    get_canvas: jest.fn(() => ({
                        width: 100,
                        height: 100
                    }))
                },
                x: 200,
                y: 150,
                width: 80,
                height: 60,
                rotation: 30,
                currentFrame: 0
            };
        });

        it("should clear the region before drawing", () => {
            animator.renderFrame(mockAnimation);

            expect(mockContext.clearRect).toHaveBeenCalled();
        });

        it("should move to current frame", () => {
            mockAnimation.currentFrame = 5;
            animator.renderFrame(mockAnimation);

            expect(mockAnimation.gifPlayer.move_to).toHaveBeenCalledWith(5);
        });

        it("should apply translation and rotation transforms", () => {
            animator.renderFrame(mockAnimation);

            expect(mockContext.translate).toHaveBeenCalledWith(200, 150);
            expect(mockContext.rotate).toHaveBeenCalledWith((30 * Math.PI) / 180);
        });

        it("should draw the frame image", () => {
            animator.renderFrame(mockAnimation);

            expect(mockContext.drawImage).toHaveBeenCalled();
        });

        it("should save and restore context state", () => {
            animator.renderFrame(mockAnimation);

            expect(mockContext.save).toHaveBeenCalledTimes(2);
            expect(mockContext.restore).toHaveBeenCalledTimes(2);
        });
    });

    describe("animate", () => {
        let mockAnimation;

        beforeEach(() => {
            mockAnimation = {
                disposed: false,
                lastFrameTime: 0,
                currentFrame: 0,
                frames: 10,
                gifPlayer: {
                    pause: jest.fn(),
                    move_to: jest.fn(),
                    get_canvas: jest.fn(() => ({ width: 100, height: 100 }))
                },
                imgElement: document.createElement("img"),
                canvas: {
                    getContext: jest.fn(() => ({
                        save: jest.fn(),
                        restore: jest.fn(),
                        translate: jest.fn(),
                        rotate: jest.fn(),
                        clearRect: jest.fn(),
                        drawImage: jest.fn()
                    }))
                },
                x: 100,
                y: 100,
                width: 50,
                height: 50,
                rotation: 0
            };

            animator.animations.set("test_gif", mockAnimation);
            animator.isRunning = true;
        });

        it("should not process animations when not running", () => {
            animator.isRunning = false;
            animator.animate(1000);

            expect(global.requestAnimationFrame).not.toHaveBeenCalled();
        });

        it("should initialize lastFrameTime on first call", () => {
            mockAnimation.lastFrameTime = 0;
            animator.animate(1000);

            expect(mockAnimation.lastFrameTime).toBe(1000);
        });

        it("should advance frame after frame delay", () => {
            mockAnimation.lastFrameTime = 1000;
            mockAnimation.currentFrame = 3;

            animator.animate(1200);

            expect(mockAnimation.currentFrame).toBe(4);
        });

        it("should wrap frame counter to 0 after last frame", () => {
            mockAnimation.lastFrameTime = 1000;
            mockAnimation.currentFrame = 9;

            animator.animate(1200);

            expect(mockAnimation.currentFrame).toBe(0);
        });

        it("should remove disposed animations", () => {
            mockAnimation.disposed = true;
            animator.animate(1000);

            expect(animator.animations.size).toBe(0);
            expect(global.document.body.removeChild).toHaveBeenCalled();
        });

        it("should stop running when no animations remain", () => {
            animator.animations.clear();
            animator.animate(1000);

            expect(animator.isRunning).toBe(false);
        });

        it("should request next frame when animations exist", () => {
            mockAnimation.lastFrameTime = 500;
            animator.animate(1000);

            expect(global.requestAnimationFrame).toHaveBeenCalled();
        });
    });

    describe("start", () => {
        it("should set isRunning to true", () => {
            animator.start();
            expect(animator.isRunning).toBe(true);
        });

        it("should request animation frame", () => {
            animator.start();
            expect(global.requestAnimationFrame).toHaveBeenCalled();
        });

        it("should not start if already running", () => {
            animator.isRunning = true;
            animator.frameRequestId = 999;

            animator.start();

            expect(global.requestAnimationFrame).not.toHaveBeenCalled();
        });
    });

    describe("updatePosition", () => {
        let mockAnimation;

        beforeEach(() => {
            mockAnimation = {
                x: 100,
                y: 100,
                rotation: 0,
                disposed: false
            };
            animator.animations.set("test_gif", mockAnimation);
        });

        it("should update position and rotation", () => {
            animator.updatePosition("test_gif", 200, 300, 45);

            expect(mockAnimation.x).toBe(200);
            expect(mockAnimation.y).toBe(300);
            expect(mockAnimation.rotation).toBe(45);
        });

        it("should not update disposed animation", () => {
            mockAnimation.disposed = true;

            animator.updatePosition("test_gif", 200, 300, 45);

            expect(mockAnimation.x).toBe(100);
            expect(mockAnimation.y).toBe(100);
        });

        it("should handle non-existent gifId gracefully", () => {
            expect(() => {
                animator.updatePosition("non_existent", 200, 300, 45);
            }).not.toThrow();
        });
    });

    describe("stopAnimation", () => {
        let mockAnimation;

        beforeEach(() => {
            mockAnimation = {
                disposed: false,
                gifPlayer: { pause: jest.fn() },
                imgElement: {}
            };
            animator.animations.set("test_gif", mockAnimation);
        });

        it("should mark animation as disposed", () => {
            animator.stopAnimation("test_gif");
            expect(mockAnimation.disposed).toBe(true);
        });

        it("should remove animation from map", () => {
            animator.stopAnimation("test_gif");
            expect(animator.animations.has("test_gif")).toBe(false);
        });

        it("should handle non-existent gifId gracefully", () => {
            expect(() => {
                animator.stopAnimation("non_existent");
            }).not.toThrow();
        });
    });

    describe("stopAll", () => {
        beforeEach(() => {
            animator.animations.set("gif1", { disposed: false });
            animator.animations.set("gif2", { disposed: false });
            animator.frameRequestId = 123;
            animator.isRunning = true;
        });

        it("should mark all animations as disposed", () => {
            animator.stopAll();

            animator.animations.forEach(anim => {
                expect(anim.disposed).toBe(true);
            });
        });

        it("should clear animations map", () => {
            animator.stopAll();
            expect(animator.animations.size).toBe(0);
        });

        it("should cancel animation frame", () => {
            animator.stopAll();
            expect(global.cancelAnimationFrame).toHaveBeenCalledWith(123);
        });

        it("should set frameRequestId to null", () => {
            animator.stopAll();
            expect(animator.frameRequestId).toBe(null);
        });

        it("should set isRunning to false", () => {
            animator.stopAll();
            expect(animator.isRunning).toBe(false);
        });
    });

    describe("getActiveCount", () => {
        it("should return 0 when no animations exist", () => {
            expect(animator.getActiveCount()).toBe(0);
        });

        it("should return correct count of active animations", () => {
            animator.animations.set("gif1", {});
            animator.animations.set("gif2", {});
            animator.animations.set("gif3", {});

            expect(animator.getActiveCount()).toBe(3);
        });

        it("should update count after adding animation", () => {
            expect(animator.getActiveCount()).toBe(0);

            animator.animations.set("gif1", {});
            expect(animator.getActiveCount()).toBe(1);
        });

        it("should update count after removing animation", () => {
            animator.animations.set("gif1", {});
            animator.animations.set("gif2", {});
            expect(animator.getActiveCount()).toBe(2);

            animator.animations.delete("gif1");
            expect(animator.getActiveCount()).toBe(1);
        });
    });
});
