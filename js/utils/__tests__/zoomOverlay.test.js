// Copyright (c) 2026 Music Blocks contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/**
 * @jest-environment jsdom
 */

const showZoomOverlay = require("../zoomOverlay");

describe("showZoomOverlay", () => {
    beforeEach(() => {
        // Clean up any previously created overlays
        const existing = document.getElementById("zoomOverlay");
        if (existing) {
            existing.remove();
        }

        // Mock setTimeout and clearTimeout
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("should create a new overlay element if one does not exist", () => {
        expect(document.getElementById("zoomOverlay")).toBeNull();

        showZoomOverlay(1);

        const overlay = document.getElementById("zoomOverlay");
        expect(overlay).not.toBeNull();
        expect(overlay.tagName).toBe("DIV");
        expect(overlay.getAttribute("aria-live")).toBe("polite");
        expect(overlay.textContent).toBe("100%");
    });

    it("should reuse the existing overlay element if one exists", () => {
        showZoomOverlay(1.5);
        const overlay1 = document.getElementById("zoomOverlay");

        showZoomOverlay(2);
        const overlay2 = document.getElementById("zoomOverlay");

        // The exact same DOM node should be reused
        expect(overlay1).toBe(overlay2);
        expect(overlay2.textContent).toBe("200%");
    });

    it("should display the correct percentage text based on scale", () => {
        showZoomOverlay(0.25);
        expect(document.getElementById("zoomOverlay").textContent).toBe("25%");

        showZoomOverlay(3.14159);
        expect(document.getElementById("zoomOverlay").textContent).toBe("314%");
    });

    it("should apply correct styling for centering and visibility", () => {
        showZoomOverlay(1);
        const overlay = document.getElementById("zoomOverlay");

        expect(overlay.style.position).toBe("fixed");
        expect(overlay.style.top).toBe("50%");
        expect(overlay.style.left).toBe("50%");
        expect(overlay.style.transform).toBe("translate(-50%, -50%)");
        expect(overlay.style.opacity).toBe("1");
        expect(overlay.style.pointerEvents).toBe("none");
    });

    it("should automatically fade out after 1200ms", () => {
        showZoomOverlay(1);
        const overlay = document.getElementById("zoomOverlay");

        expect(overlay.style.opacity).toBe("1");

        // Advance timers but not fully to the end of timeout
        jest.advanceTimersByTime(1199);
        expect(overlay.style.opacity).toBe("1");

        // Advance beyond 1200ms
        jest.advanceTimersByTime(1);
        expect(overlay.style.opacity).toBe("0");
    });

    it("should reset the fade out timer if called again before fading out", () => {
        showZoomOverlay(1);
        const overlay = document.getElementById("zoomOverlay");

        // Wait 1000ms, then call it again to reset timer
        jest.advanceTimersByTime(1000);
        showZoomOverlay(2);

        // Advance 1000ms more (2000ms total). The original 1200ms timer
        // would have fired but it should be cancelled now.
        jest.advanceTimersByTime(1000);
        expect(overlay.style.opacity).toBe("1");

        // 1200ms after the second call, it should fade out
        jest.advanceTimersByTime(200);
        expect(overlay.style.opacity).toBe("0");
    });
});
