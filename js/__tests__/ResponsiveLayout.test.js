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

const ResponsiveLayout = require("../ResponsiveLayout");

describe("ResponsiveLayout", () => {
    let activity;
    let responsiveLayout;
    let changeImageFn;
    let hideDomLabelFn;

    beforeEach(() => {
        Object.defineProperty(window, "innerWidth", {
            configurable: true,
            writable: true,
            value: 500
        });

        changeImageFn = jest.fn();
        hideDomLabelFn = jest.fn();

        activity = {
            _changeBlockVisibility: jest.fn(),
            _findBlocks: jest.fn(),
            _isFirstHomeClick: true,
            toolbarHeight: 40,
            turtleBlocksScale: 1,
            canvas: { width: 800, height: 600 },
            auxToolbar: { style: { display: "none" } },
            blocksContainer: { x: 10, y: 20 },
            homeButtonContainer: {
                children: [{}]
            },
            boundary: {
                hide: jest.fn()
            },
            palettes: {
                updatePalettes: jest.fn()
            },
            blocks: {
                visible: true,
                activeBlock: 123,
                showBlocks: jest.fn(),
                dragGroup: [],
                moveBlockRelative: jest.fn(),
                findDragGroup: jest.fn(function (blockId) {
                    this.dragGroup = [blockId];
                }),
                blockList: {
                    1: {
                        id: 1,
                        name: "start",
                        trash: false,
                        height: 50,
                        width: 80,
                        connections: [null],
                        container: { x: 0, y: 0 }
                    }
                }
            },
            turtles: {
                getTurtleCount: jest.fn(() => 1),
                getTurtle: jest.fn(() => ({
                    painter: {
                        penState: true,
                        doSetXY: jest.fn(),
                        doSetHeading: jest.fn()
                    }
                }))
            }
        };

        responsiveLayout = new ResponsiveLayout(activity, {
            responsiveBreakpointTablet: 768,
            responsiveBreakpointMobile: 600,
            standardBlockHeight: 42,
            changeImageFn,
            goHomeButton: "home-on",
            goHomeFadedButton: "home-off",
            hideDomLabelFn
        });
    });

    test("setHomeContainers updates the home button artwork", () => {
        responsiveLayout.setHomeContainers(true);

        expect(changeImageFn).toHaveBeenCalledWith(
            activity.homeButtonContainer.children[0],
            "home-off",
            "home-on"
        );
    });

    test("findBlocks recenters blocks and toggles the home-click mode", () => {
        const setHomeSpy = jest.spyOn(responsiveLayout, "setHomeContainers");

        responsiveLayout.findBlocks();

        expect(hideDomLabelFn).toHaveBeenCalled();
        expect(activity.blocks.showBlocks).toHaveBeenCalled();
        expect(activity.palettes.updatePalettes).toHaveBeenCalled();
        expect(setHomeSpy).toHaveBeenCalledWith(false);
        expect(activity.boundary.hide).toHaveBeenCalled();
        expect(activity._isFirstHomeClick).toBe(false);

        const turtle = activity.turtles.getTurtle.mock.results[0].value;
        expect(turtle.painter.doSetXY).toHaveBeenCalledWith(0, 0);
        expect(turtle.painter.doSetHeading).toHaveBeenCalledWith(0);
    });

    test("repositionBlocks nudges blocks away from the left edge and rehomes them", () => {
        activity.blocks.blockList = {
            1: {
                id: 1,
                name: "note",
                trash: false,
                width: 60,
                connections: [null],
                container: { x: -20, y: 10 }
            }
        };

        responsiveLayout.repositionBlocks();

        expect(activity.blocks.blockList[1].container.x).toBe(100);
        expect(activity._findBlocks).toHaveBeenCalled();
    });
});
