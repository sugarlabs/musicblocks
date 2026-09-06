/*
 * Copyright (C) 2026 Sugar Labs
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

describe("Activity Fullscreen and Viewport Resize Handling (Issue #8536)", () => {
    let handleResize;
    let container;
    let canvas;
    let overCanvas;
    let canvasHolder;
    let hideContents;
    let mockRefreshCanvas;
    let mockSetupPaletteMenu;
    let activityInstance;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="canvasHolder">
                <div id="canvasContainer">
                    <canvas id="myCanvas" width="1200" height="900"></canvas>
                </div>
            </div>
            <canvas id="canvas" width="1200" height="900"></canvas>
            <div id="hideContents"></div>
        `;

        container = document.getElementById("canvasContainer");
        canvas = document.getElementById("myCanvas");
        overCanvas = document.getElementById("canvas");
        canvasHolder = document.getElementById("canvasHolder");
        hideContents = document.getElementById("hideContents");

        mockRefreshCanvas = jest.fn();
        mockSetupPaletteMenu = jest.fn();

        // Extract and instantiate the handleResize function from activity.js
        const activityPath = path.resolve(__dirname, "../activity.js");
        const code = fs.readFileSync(activityPath, "utf8");

        // Extract the handleResize function block
        const handleResizeMarker = "function handleResize() {";
        const startIdx = code.indexOf(handleResizeMarker);
        expect(startIdx).not.toBe(-1);

        let endIdx = startIdx + handleResizeMarker.length;
        let braceDepth = 1;
        while (braceDepth > 0 && endIdx < code.length) {
            if (code[endIdx] === "{") braceDepth++;
            else if (code[endIdx] === "}") braceDepth--;
            endIdx++;
        }
        const fnSource = code.substring(startIdx, endIdx);

        // Run in VM with properly scoped references
        const sandbox = {
            document,
            window,
            container,
            canvas,
            overCanvas,
            canvasHolder,
            that: {
                refreshCanvas: mockRefreshCanvas
            }
        };

        vm.createContext(sandbox);
        vm.runInContext(`${fnSource}\nthis.handleResize = handleResize;`, sandbox);
        handleResize = sandbox.handleResize;

        // Reset dimensions
        Object.defineProperty(window, "innerWidth", {
            writable: true,
            configurable: true,
            value: 1024
        });
        Object.defineProperty(window, "innerHeight", {
            writable: true,
            configurable: true,
            value: 768
        });
        Object.defineProperty(window.screen, "width", {
            writable: true,
            configurable: true,
            value: 1920
        });
        Object.defineProperty(window.screen, "height", {
            writable: true,
            configurable: true,
            value: 1080
        });
        Object.defineProperty(document, "hidden", {
            writable: true,
            configurable: true,
            value: false
        });
    });

    test("dynamically resizes container and canvases to 100% viewport in fullscreen mode (1920x1080)", () => {
        // Entering fullscreen on a standard 1080p display
        window.innerWidth = 1920;
        window.innerHeight = 1080;
        window.screen.width = 1920;
        window.screen.height = 1080;

        handleResize();

        // Must not be clamped to legacy 1600x900
        expect(container.style.width).toBe("1920px");
        expect(container.style.height).toBe("1080px");
        expect(canvas.width).toBe(1920);
        expect(canvas.height).toBe(1080);
        expect(overCanvas.width).toBe(1920);
        expect(overCanvas.height).toBe(1080);
        expect(canvasHolder.width).toBe(1920);
        expect(canvasHolder.height).toBe(1080);
        expect(mockRefreshCanvas).toHaveBeenCalled();
    });

    test("dynamically resizes container and canvases to high-resolution viewports (2560x1440 2K)", () => {
        window.innerWidth = 2560;
        window.innerHeight = 1440;
        window.screen.width = 2560;
        window.screen.height = 1440;

        handleResize();

        expect(container.style.width).toBe("2560px");
        expect(container.style.height).toBe("1440px");
        expect(canvas.width).toBe(2560);
        expect(canvas.height).toBe(1440);
        expect(overCanvas.width).toBe(2560);
        expect(overCanvas.height).toBe(1440);
    });

    test("dynamically resizes in standard windowed mode (1366x768)", () => {
        window.innerWidth = 1366;
        window.innerHeight = 768;
        window.screen.width = 1920;
        window.screen.height = 1080;

        handleResize();

        expect(container.style.width).toBe("1366px");
        expect(container.style.height).toBe("768px");
        expect(canvas.width).toBe(1366);
        expect(canvas.height).toBe(768);
        expect(overCanvas.width).toBe(1366);
        expect(overCanvas.height).toBe(768);
    });

    test("skips resize calculations when document is hidden to avoid zero-dimension corruption", () => {
        container.style.width = "1024px";
        container.style.height = "768px";

        document.hidden = true;
        window.innerWidth = 1920;
        window.innerHeight = 1080;

        handleResize();

        // Dimensions should remain unchanged
        expect(container.style.width).toBe("1024px");
        expect(container.style.height).toBe("768px");
        expect(mockRefreshCanvas).not.toHaveBeenCalled();
    });

    test("guards against zero or negative dimensions", () => {
        container.style.width = "1024px";
        container.style.height = "768px";

        window.innerWidth = 0;
        window.innerHeight = 0;

        handleResize();

        expect(container.style.width).toBe("1024px");
        expect(container.style.height).toBe("768px");
        expect(mockRefreshCanvas).not.toHaveBeenCalled();
    });
});
