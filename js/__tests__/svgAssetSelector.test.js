/**
 * MusicBlocks v3.4.1
 *
 * @author Sapnil Biswas
 *
 * @copyright 2026 Music Blocks contributors
 *
 * @license
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

const { openSvgAssetSelector } = require("../svgAssetSelector");

describe("svgAssetSelector", () => {
    let originalFetch;

    beforeEach(() => {
        // Clear DOM
        document.body.innerHTML = "";

        // Mock fetch for svgAssets.json
        originalFetch = global.fetch;
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () =>
                    Promise.resolve({
                        svgs: [
                            { name: "Test Icon 1", path: "assets/test1.svg" },
                            { name: "Test Icon 2", path: "assets/test2.svg" }
                        ]
                    })
            })
        );

        // Mock requestAnimationFrame
        jest.spyOn(window, "requestAnimationFrame").mockImplementation(cb => {
            cb();
        });
    });

    afterEach(() => {
        global.fetch = originalFetch;
        jest.restoreAllMocks();
    });

    it("should render the modal with built-in images when fetch succeeds", async () => {
        const onSelect = jest.fn();
        const onUpload = jest.fn();

        openSvgAssetSelector(onSelect, onUpload);

        // Wait for fetch to complete and DOM to update
        await new Promise(process.nextTick);

        const overlay = document.getElementById("svgAssetSelectorOverlay");
        expect(overlay).toBeTruthy();

        const grid = document.querySelector(".svg-selector-grid");
        expect(grid).toBeTruthy();

        const items = document.querySelectorAll(".svg-asset-item");
        expect(items.length).toBe(2);
        expect(items[0].querySelector(".asset-name").textContent).toBe("Test Icon 1");
    });

    it("should handle fetch errors gracefully and trigger onUploadFromDevice fallback", async () => {
        global.fetch = jest.fn(() => Promise.reject(new Error("Network Error")));

        // Suppress console.error for this test
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        const onSelect = jest.fn();
        const onUpload = jest.fn();

        openSvgAssetSelector(onSelect, onUpload);

        await new Promise(process.nextTick);

        expect(consoleSpy).toHaveBeenCalledWith("Failed to load SVG assets:", expect.any(Error));
        expect(onUpload).toHaveBeenCalled();

        consoleSpy.mockRestore();
    });

    it("should switch tabs correctly", async () => {
        openSvgAssetSelector(jest.fn(), jest.fn());
        await new Promise(process.nextTick);

        const tabBuiltIn = document.getElementById("svgTabBuiltIn");
        const tabUpload = document.getElementById("svgTabUpload");
        const gridContainer = document.getElementById("svgGridPanel");
        const uploadPanel = document.getElementById("svgUploadPanel");

        expect(tabBuiltIn.classList.contains("active")).toBe(true);
        expect(uploadPanel.style.display).toBe("none");

        // Click Upload tab
        tabUpload.click();

        expect(tabUpload.classList.contains("active")).toBe(true);
        expect(tabBuiltIn.classList.contains("active")).toBe(false);
        expect(gridContainer.style.display).toBe("none");
        expect(uploadPanel.style.display).toBe("");

        // Click Built-in tab again
        tabBuiltIn.click();

        expect(tabBuiltIn.classList.contains("active")).toBe(true);
        expect(gridContainer.style.display).toBe("");
    });
});
