// Copyright (c) 2026 Harihara Vardhan
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

"use strict";

const GitTutorial = require("../gitTutorial");

describe("GitTutorial - 4-Step Interactive Guide", () => {
    let mockActivity;

    beforeAll(() => {
        window.HTMLMediaElement.prototype.play = jest.fn(() => Promise.resolve());
        window.HTMLMediaElement.prototype.pause = jest.fn();
    });

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="toolbars"></div>
        `;

        mockActivity = {
            gitDropdownUI: {
                _showCreateFlow: jest.fn(),
                _showCommitFlow: jest.fn(),
                _showHistoryPanel: jest.fn()
            },
            planet: {
                openPlanet: jest.fn()
            }
        };
    });

    afterEach(() => {
        GitTutorial.close();
    });

    test("open() mounts tutorial overlay to the document body", () => {
        GitTutorial.open(mockActivity);

        const overlay = document.getElementById("git-tutorial-overlay");
        expect(overlay).not.toBeNull();

        const activeStep = overlay.querySelector("#gt-step-0");
        expect(activeStep).not.toBeNull();
        expect(activeStep.querySelector(".gt-chip").textContent).toContain("Track my project");
    });

    test("close() removes tutorial overlay from document", () => {
        GitTutorial.open(mockActivity);
        expect(document.getElementById("git-tutorial-overlay")).not.toBeNull();

        GitTutorial.close();
        expect(document.getElementById("git-tutorial-overlay")).toBeNull();
    });

    test("navigates through all 4 steps using Next and Back buttons", () => {
        GitTutorial.open(mockActivity);

        const nextBtn = document.getElementById("gt-next-btn");
        const backBtn = document.getElementById("gt-back-btn");

        // Step 1 -> Step 2
        nextBtn.click();
        const step1 = document.getElementById("gt-step-1");
        expect(step1.getAttribute("aria-hidden")).toBe("false");
        expect(step1.querySelector(".gt-chip").textContent).toContain("Mark this moment");

        // Step 2 -> Step 3
        nextBtn.click();
        const step2 = document.getElementById("gt-step-2");
        expect(step2.getAttribute("aria-hidden")).toBe("false");
        expect(step2.querySelector(".gt-chip").textContent).toContain("Time travel");

        // Step 3 -> Step 4
        nextBtn.click();
        const step3 = document.getElementById("gt-step-3");
        expect(step3.getAttribute("aria-hidden")).toBe("false");
        expect(step3.querySelector(".gt-chip").textContent).toContain("Remix from Planet");
        expect(nextBtn.textContent).toContain("Done");

        // Step 4 -> Step 3 (Back)
        const prevBtn = document.getElementById("gt-prev");
        prevBtn.click();
        expect(document.getElementById("gt-step-2").getAttribute("aria-hidden")).toBe("false");
    });

    test("clicking Done on the last step closes the tutorial", () => {
        GitTutorial.open(mockActivity);

        const nextBtn = document.getElementById("gt-next-btn");

        // Advance to step 4
        nextBtn.click();
        nextBtn.click();
        nextBtn.click();

        // Click Done
        nextBtn.click();
        expect(document.getElementById("git-tutorial-overlay")).toBeNull();
    });

    test("navigates using step indicator dots", () => {
        GitTutorial.open(mockActivity);

        const dots = document.querySelectorAll(".gt-dot");
        expect(dots.length).toBe(4);

        // Click step 3 dot (index 2: Time travel)
        dots[2].click();
        expect(document.getElementById("gt-step-2").getAttribute("aria-hidden")).toBe("false");

        // Click step 1 dot (index 0: Track my project)
        dots[0].click();
        expect(document.getElementById("gt-step-0").getAttribute("aria-hidden")).toBe("false");
    });

    test("Escape key closes the tutorial", () => {
        GitTutorial.open(mockActivity);
        expect(document.getElementById("git-tutorial-overlay")).not.toBeNull();

        // Dispatch Escape keydown
        const escEvent = new KeyboardEvent("keydown", { key: "Escape" });
        document.dispatchEvent(escEvent);

        expect(document.getElementById("git-tutorial-overlay")).toBeNull();
    });
});
