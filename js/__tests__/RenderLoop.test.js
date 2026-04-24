/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2026 Music Blocks contributors
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

const RenderLoop = require("../RenderLoop");

describe("RenderLoop", () => {
    let stage;
    let gifAnimator;
    let createjsRef;
    let frameCallbacks;
    let requestAnimationFrameFn;
    let cancelAnimationFrameFn;
    let nextFrameId;

    const runNextFrame = () => {
        const callback = frameCallbacks.shift();
        if (callback) {
            callback();
        }
    };

    beforeEach(() => {
        stage = {
            update: jest.fn()
        };
        gifAnimator = {
            getActiveCount: jest.fn(() => 0)
        };
        createjsRef = {
            Tween: {
                hasActiveTweens: jest.fn(() => false)
            }
        };
        frameCallbacks = [];
        nextFrameId = 1;
        requestAnimationFrameFn = jest.fn(callback => {
            frameCallbacks.push(callback);
            return nextFrameId++;
        });
        cancelAnimationFrameFn = jest.fn();
    });

    test("marks the stage dirty and redraws on the next frame", () => {
        const renderLoop = new RenderLoop({
            getStage: () => stage,
            getGifAnimator: () => gifAnimator,
            createjsRef,
            requestAnimationFrameFn,
            cancelAnimationFrameFn
        });

        renderLoop.markDirty();
        renderLoop.start();
        runNextFrame();

        expect(stage.update).toHaveBeenCalledTimes(1);
        expect(renderLoop.dirty).toBe(false);
    });

    test("redraws when tweens are active even if the stage is not dirty", () => {
        createjsRef.Tween.hasActiveTweens.mockReturnValue(true);

        const renderLoop = new RenderLoop({
            getStage: () => stage,
            getGifAnimator: () => gifAnimator,
            createjsRef,
            requestAnimationFrameFn,
            cancelAnimationFrameFn
        });

        renderLoop.start();
        runNextFrame();

        expect(stage.update).toHaveBeenCalledTimes(1);
    });

    test("redraws when GIF animations are active", () => {
        gifAnimator.getActiveCount.mockReturnValue(2);

        const renderLoop = new RenderLoop({
            getStage: () => stage,
            getGifAnimator: () => gifAnimator,
            createjsRef,
            requestAnimationFrameFn,
            cancelAnimationFrameFn
        });

        renderLoop.start();
        runNextFrame();

        expect(stage.update).toHaveBeenCalledTimes(1);
    });

    test("stops the loop and cancels the pending animation frame", () => {
        const renderLoop = new RenderLoop({
            getStage: () => stage,
            getGifAnimator: () => gifAnimator,
            createjsRef,
            requestAnimationFrameFn,
            cancelAnimationFrameFn
        });

        renderLoop.start();
        renderLoop.stop();

        expect(cancelAnimationFrameFn).toHaveBeenCalledWith(1);
    });
});
