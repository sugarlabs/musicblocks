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

const BlocksDependencies = require("../BlocksDependencies");

describe("BlocksDependencies", () => {
    let mockActivity;

    beforeEach(() => {
        mockActivity = {
            storage: { save: jest.fn() },
            trashcan: { empty: jest.fn() },
            turtles: { getTurtle: jest.fn() },
            boundary: { check: jest.fn() },
            macroDict: { myMacro: [] },
            palettes: { show: jest.fn() },
            logo: { run: jest.fn() },
            blocksContainer: { add: jest.fn() },
            canvas: document.createElement("canvas"),
            refreshCanvas: jest.fn(),
            errorMsg: jest.fn(),
            setSelectionMode: jest.fn(),
            stopLoadAnimation: jest.fn(),
            setHomeContainers: jest.fn(),
            __tick: jest.fn()
        };
    });

    it("should construct with explicitly provided dependencies", () => {
        const deps = new BlocksDependencies({
            storage: mockActivity.storage,
            trashcan: mockActivity.trashcan,
            turtles: mockActivity.turtles,
            boundary: mockActivity.boundary,
            macroDict: mockActivity.macroDict,
            palettes: mockActivity.palettes,
            logo: mockActivity.logo,
            blocksContainer: mockActivity.blocksContainer,
            canvas: mockActivity.canvas,
            refreshCanvas: mockActivity.refreshCanvas,
            errorMsg: mockActivity.errorMsg,
            setSelectionMode: mockActivity.setSelectionMode,
            stopLoadAnimation: mockActivity.stopLoadAnimation,
            setHomeContainers: mockActivity.setHomeContainers,
            tick: mockActivity.__tick
        });

        expect(deps.storage).toBe(mockActivity.storage);
        expect(deps.trashcan).toBe(mockActivity.trashcan);
        expect(deps.turtles).toBe(mockActivity.turtles);
        expect(deps.boundary).toBe(mockActivity.boundary);
        expect(deps.macroDict).toBe(mockActivity.macroDict);
        expect(deps.palettes).toBe(mockActivity.palettes);
        expect(deps.logo).toBe(mockActivity.logo);
        expect(deps.blocksContainer).toBe(mockActivity.blocksContainer);
        expect(deps.canvas).toBe(mockActivity.canvas);

        deps.refreshCanvas();
        expect(mockActivity.refreshCanvas).toHaveBeenCalled();

        deps.errorMsg("error", "block");
        expect(mockActivity.errorMsg).toHaveBeenCalledWith("error", "block");

        deps.setSelectionMode("mode");
        expect(mockActivity.setSelectionMode).toHaveBeenCalledWith("mode");

        deps.stopLoadAnimation();
        expect(mockActivity.stopLoadAnimation).toHaveBeenCalled();

        deps.setHomeContainers(true);
        expect(mockActivity.setHomeContainers).toHaveBeenCalledWith(true);

        deps.tick();
        expect(mockActivity.__tick).toHaveBeenCalled();
    });

    it("should construct from an Activity object using fromActivity", () => {
        const deps = BlocksDependencies.fromActivity(mockActivity);

        expect(deps.storage).toBe(mockActivity.storage);
        expect(deps.trashcan).toBe(mockActivity.trashcan);
        expect(deps.turtles).toBe(mockActivity.turtles);
        expect(deps.boundary).toBe(mockActivity.boundary);
        expect(deps.macroDict).toBe(mockActivity.macroDict);
        expect(deps.palettes).toBe(mockActivity.palettes);
        expect(deps.logo).toBe(mockActivity.logo);
        expect(deps.blocksContainer).toBe(mockActivity.blocksContainer);
        expect(deps.canvas).toBe(mockActivity.canvas);

        deps.refreshCanvas();
        expect(mockActivity.refreshCanvas).toHaveBeenCalled();

        deps.errorMsg("error", "block");
        expect(mockActivity.errorMsg).toHaveBeenCalledWith("error", "block");

        deps.setSelectionMode("mode");
        expect(mockActivity.setSelectionMode).toHaveBeenCalledWith("mode");

        deps.stopLoadAnimation();
        expect(mockActivity.stopLoadAnimation).toHaveBeenCalled();

        deps.setHomeContainers(true);
        expect(mockActivity.setHomeContainers).toHaveBeenCalledWith(true);

        deps.tick();
        expect(mockActivity.__tick).toHaveBeenCalled();
    });

    it("should identify a valid BlocksDependencies instance", () => {
        const deps = BlocksDependencies.fromActivity(mockActivity);
        expect(BlocksDependencies.isBlocksDependencies(deps)).toBe(true);
        expect(BlocksDependencies.isBlocksDependencies({})).toBe(false);
        expect(BlocksDependencies.isBlocksDependencies(null)).toBe(false);
    });
});
