/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const GIFAnimator = require("../gif-animator");

describe("GIFAnimator", () => {
    let animator;
    let mockCanvas;
    let mockCtx;
    let mockSuperGifInstance;

    beforeEach(() => {
        mockCtx = {
            save: jest.fn(),
            restore: jest.fn(),
            translate: jest.fn(),
            rotate: jest.fn(),
            clearRect: jest.fn(),
            drawImage: jest.fn()
        };

        mockCanvas = document.createElement("canvas");
        mockCanvas.getContext = jest.fn(type => {
            if (type === "2d") return mockCtx;
            return null;
        });
        mockSuperGifInstance = {
            load: jest.fn(callback => callback()),
            get_length: jest.fn(() => 5),
            get_canvas: jest.fn(() => document.createElement("canvas")),
            move_to: jest.fn(),
            pause: jest.fn()
        };

        window.SuperGif = jest.fn(() => mockSuperGifInstance);
        jest.useFakeTimers();

        animator = new GIFAnimator();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
        document.body.innerHTML = "";
    });

    test("Constructor initializes default state", () => {
        expect(animator.animations).toBeInstanceOf(Map);
        expect(animator.animations.size).toBe(0);
        expect(animator.isRunning).toBe(false);
    });

    test("isAnimatedGIF correctly identifies GIF data URLs", () => {
        expect(animator.isAnimatedGIF("data:image/gif;base64,AAAA")).toBe(true);
        expect(animator.isAnimatedGIF("data:image/png;base64,AAAA")).toBe(false);
        expect(animator.isAnimatedGIF("not a url")).toBe(false);
    });

    test("generateGifId creates unique IDs", () => {
        const id1 = animator.generateGifId();
        const id2 = animator.generateGifId();
        expect(id1).not.toBe(id2);
        expect(id1).toContain("gif_");
    });

    describe("createAnimation", () => {
        const validGifData =
            "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

        test("successfully creates an animation entry for valid animated GIF", async () => {
            const id = await animator.createAnimation(
                validGifData,
                mockCanvas,
                10,
                10,
                100,
                100,
                0
            );

            expect(window.SuperGif).toHaveBeenCalled();
            expect(mockSuperGifInstance.load).toHaveBeenCalled();
            expect(id).not.toBeNull();
            expect(animator.getActiveCount()).toBe(1);
            expect(animator.isRunning).toBe(true);
        });

        test("returns null and cleans up if GIF has <= 1 frame (static)", async () => {
            mockSuperGifInstance.get_length.mockReturnValue(1);

            const id = await animator.createAnimation(validGifData, mockCanvas, 0, 0, 100, 100, 0);

            expect(id).toBeNull();
            expect(animator.getActiveCount()).toBe(0);
            expect(document.body.querySelectorAll("img").length).toBe(0);
        });

        test("throws error if SuperGif library is missing", async () => {
            delete window.SuperGif;
            const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

            const id = await animator.createAnimation(validGifData, mockCanvas, 0, 0, 100, 100, 0);

            expect(id).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith(
                "Failed to create GIF animation:",
                expect.any(Error)
            );
            consoleSpy.mockRestore();
        });
    });

    describe("renderFrame", () => {
        test("performs correct canvas transformations and drawing", async () => {
            const id = await animator.createAnimation(
                "data:image/gif;",
                mockCanvas,
                50,
                60,
                100,
                100,
                45
            );
            const animation = animator.animations.get(id);
            mockCtx.save.mockClear();
            mockCtx.translate.mockClear();

            animator.renderFrame(animation);
            expect(mockCtx.translate).toHaveBeenCalledWith(50, 60);
            expect(mockCtx.rotate).toHaveBeenCalledWith((45 * Math.PI) / 180);
            expect(mockCtx.clearRect).toHaveBeenCalled();
            expect(mockSuperGifInstance.move_to).toHaveBeenCalledWith(animation.currentFrame);
            expect(mockCtx.drawImage).toHaveBeenCalled();
            expect(mockCtx.restore).toHaveBeenCalledTimes(2);
        });
    });

    describe("Animation Loop (animate)", () => {
        test("advances frames based on time delay", async () => {
            await animator.createAnimation("data:image/gif;", mockCanvas, 0, 0, 100, 100, 0);
            const id = Array.from(animator.animations.keys())[0];
            const animation = animator.animations.get(id);
            const renderSpy = jest.spyOn(animator, "renderFrame");
            jest.advanceTimersByTime(50);
            expect(animation.currentFrame).toBe(0);
            jest.advanceTimersByTime(100);
            expect(animation.currentFrame).toBeGreaterThan(0);
            expect(renderSpy).toHaveBeenCalled();
        });

        test("cleans up disposed animations during loop", async () => {
            const id = await animator.createAnimation(
                "data:image/gif;",
                mockCanvas,
                0,
                0,
                100,
                100,
                0
            );
            const animation = animator.animations.get(id);

            animation.disposed = true;
            animator.animate(performance.now());

            expect(mockSuperGifInstance.pause).toHaveBeenCalled();
            expect(animator.animations.has(id)).toBe(false);
            expect(document.body.querySelectorAll("img").length).toBe(0);
        });
    });

    describe("Control Methods", () => {
        test("updatePosition updates animation coordinates", async () => {
            const id = await animator.createAnimation(
                "data:image/gif;",
                mockCanvas,
                0,
                0,
                100,
                100,
                0
            );

            animator.updatePosition(id, 200, 300, 90);
            const anim = animator.animations.get(id);

            expect(anim.x).toBe(200);
            expect(anim.y).toBe(300);
            expect(anim.rotation).toBe(90);
        });

        test("stopAnimation marks animation as disposed", async () => {
            const id = await animator.createAnimation(
                "data:image/gif;",
                mockCanvas,
                0,
                0,
                100,
                100,
                0
            );
            const anim = animator.animations.get(id);

            animator.stopAnimation(id);
            expect(animator.animations.has(id)).toBe(false);
            expect(anim.disposed).toBe(true);
        });
        test("stopAll clears all animations and stops loop", async () => {
            await animator.createAnimation("data:image/gif;", mockCanvas, 0, 0, 100, 100, 0);
            await animator.createAnimation("data:image/gif;", mockCanvas, 10, 10, 100, 100, 0);

            expect(animator.getActiveCount()).toBe(2);

            animator.stopAll();

            expect(animator.getActiveCount()).toBe(0);
            expect(animator.isRunning).toBe(false);
        });
    });
});
