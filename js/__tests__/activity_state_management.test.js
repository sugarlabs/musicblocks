/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2026 Music Blocks Contributors
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

/**
 * Tests for Activity State Management Functions
 *
 * These functions are defined inside the Activity constructor as arrow functions.
 * Since we cannot easily load the full Activity class without DOM dependencies,
 * we test the function logic directly by extracting and testing the behavior.
 */

describe("Activity State Management Functions", () => {
    let activity;

    beforeEach(() => {
        // Create a mock activity object with the state management functions
        // implemented according to the actual activity.js source code

        activity = {
            // Internal state
            turtleBlocksScale: 1,
            stageMouseDown: false,
            currentKey: "",
            currentKeyCode: 0,
            stageX: 100,
            stageY: 200,
            toolbarHeight: 40,

            // Mock turtles with coordinate conversion functions
            turtles: {
                screenX2turtleX: screenX => screenX * 2, // Mock conversion
                screenY2turtleY: screenY => screenY * 2 // Mock conversion
            },

            // ================================
            // State Management Functions
            // (Logic extracted from activity.js)
            // ================================

            /**
             * Retrieves the scale of the stage.
             * Source: activity.js lines 2599-2601
             */
            getStageScale: function () {
                return this.turtleBlocksScale;
            },

            /**
             * Retrieves the X coordinate of the stage.
             * Source: activity.js lines 2607-2609
             */
            getStageX: function () {
                return this.turtles.screenX2turtleX(this.stageX / this.turtleBlocksScale);
            },

            /**
             * Retrieves the Y coordinate of the stage.
             * Source: activity.js lines 2615-2619
             */
            getStageY: function () {
                return this.turtles.screenY2turtleY(
                    (this.stageY - this.toolbarHeight) / this.turtleBlocksScale
                );
            },

            /**
             * Retrieves the mouse down state of the stage.
             * Source: activity.js lines 2625-2627
             */
            getStageMouseDown: function () {
                return this.stageMouseDown;
            },

            /**
             * Returns currentKeyCode
             * Source: activity.js lines 3447-3449
             */
            getCurrentKeyCode: function () {
                return this.currentKeyCode;
            },

            /**
             * Clears current key code to 0 and current key to empty string
             * Source: activity.js lines 3454-3457
             */
            clearCurrentKeyCode: function () {
                this.currentKey = "";
                this.currentKeyCode = 0;
            }
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // =========================================
    // getStageScale Tests
    // =========================================
    describe("getStageScale", () => {
        test("should return the turtleBlocksScale value", () => {
            activity.turtleBlocksScale = 1.5;
            expect(activity.getStageScale()).toBe(1.5);
        });

        test("should return default scale of 1", () => {
            activity.turtleBlocksScale = 1;
            expect(activity.getStageScale()).toBe(1);
        });

        test("should return larger scale values", () => {
            activity.turtleBlocksScale = 2.5;
            expect(activity.getStageScale()).toBe(2.5);
        });

        test("should return fractional scale values", () => {
            activity.turtleBlocksScale = 0.75;
            expect(activity.getStageScale()).toBe(0.75);
        });
    });

    // =========================================
    // getStageX Tests
    // =========================================
    describe("getStageX", () => {
        test("should convert stageX to turtle X coordinate", () => {
            activity.stageX = 100;
            activity.turtleBlocksScale = 1;
            // stageX / scale = 100 / 1 = 100, then screenX2turtleX(100) = 200
            expect(activity.getStageX()).toBe(200);
        });

        test("should account for turtleBlocksScale in conversion", () => {
            activity.stageX = 200;
            activity.turtleBlocksScale = 2;
            // stageX / scale = 200 / 2 = 100, then screenX2turtleX(100) = 200
            expect(activity.getStageX()).toBe(200);
        });

        test("should handle zero stageX", () => {
            activity.stageX = 0;
            activity.turtleBlocksScale = 1;
            // 0 / 1 = 0, then screenX2turtleX(0) = 0
            expect(activity.getStageX()).toBe(0);
        });

        test("should handle fractional scale", () => {
            activity.stageX = 50;
            activity.turtleBlocksScale = 0.5;
            // 50 / 0.5 = 100, then screenX2turtleX(100) = 200
            expect(activity.getStageX()).toBe(200);
        });

        test("should call screenX2turtleX with correct argument", () => {
            activity.turtles.screenX2turtleX = jest.fn(x => x * 2);
            activity.stageX = 300;
            activity.turtleBlocksScale = 3;

            activity.getStageX();

            expect(activity.turtles.screenX2turtleX).toHaveBeenCalledWith(100);
        });
    });

    // =========================================
    // getStageY Tests
    // =========================================
    describe("getStageY", () => {
        test("should convert stageY to turtle Y coordinate with toolbar offset", () => {
            activity.stageY = 200;
            activity.toolbarHeight = 40;
            activity.turtleBlocksScale = 1;
            // (stageY - toolbarHeight) / scale = (200 - 40) / 1 = 160
            // screenY2turtleY(160) = 320
            expect(activity.getStageY()).toBe(320);
        });

        test("should account for turtleBlocksScale in Y conversion", () => {
            activity.stageY = 240;
            activity.toolbarHeight = 40;
            activity.turtleBlocksScale = 2;
            // (240 - 40) / 2 = 100, then screenY2turtleY(100) = 200
            expect(activity.getStageY()).toBe(200);
        });

        test("should handle stageY equal to toolbar height", () => {
            activity.stageY = 40;
            activity.toolbarHeight = 40;
            activity.turtleBlocksScale = 1;
            // (40 - 40) / 1 = 0, then screenY2turtleY(0) = 0
            expect(activity.getStageY()).toBe(0);
        });

        test("should handle negative result before conversion", () => {
            activity.stageY = 20;
            activity.toolbarHeight = 40;
            activity.turtleBlocksScale = 1;
            // (20 - 40) / 1 = -20, then screenY2turtleY(-20) = -40
            expect(activity.getStageY()).toBe(-40);
        });

        test("should call screenY2turtleY with correct argument", () => {
            activity.turtles.screenY2turtleY = jest.fn(y => y * 2);
            activity.stageY = 140;
            activity.toolbarHeight = 40;
            activity.turtleBlocksScale = 2;

            activity.getStageY();

            // (140 - 40) / 2 = 50
            expect(activity.turtles.screenY2turtleY).toHaveBeenCalledWith(50);
        });
    });

    // =========================================
    // getStageMouseDown Tests
    // =========================================
    describe("getStageMouseDown", () => {
        test("should return false when mouse is not down", () => {
            activity.stageMouseDown = false;
            expect(activity.getStageMouseDown()).toBe(false);
        });

        test("should return true when mouse is down", () => {
            activity.stageMouseDown = true;
            expect(activity.getStageMouseDown()).toBe(true);
        });
    });

    // =========================================
    // getCurrentKeyCode Tests
    // =========================================
    describe("getCurrentKeyCode", () => {
        test("should return 0 when no key has been pressed", () => {
            activity.currentKeyCode = 0;
            expect(activity.getCurrentKeyCode()).toBe(0);
        });

        test("should return the current key code for letter keys", () => {
            activity.currentKeyCode = 65; // 'A' key
            expect(activity.getCurrentKeyCode()).toBe(65);
        });

        test("should return special key codes", () => {
            activity.currentKeyCode = 32; // Space bar
            expect(activity.getCurrentKeyCode()).toBe(32);
        });

        test("should return function key codes", () => {
            activity.currentKeyCode = 112; // F1 key
            expect(activity.getCurrentKeyCode()).toBe(112);
        });

        test("should return arrow key codes", () => {
            activity.currentKeyCode = 37; // Left arrow
            expect(activity.getCurrentKeyCode()).toBe(37);
        });
    });

    // =========================================
    // clearCurrentKeyCode Tests
    // =========================================
    describe("clearCurrentKeyCode", () => {
        test("should clear currentKey to empty string", () => {
            activity.currentKey = "A";
            activity.currentKeyCode = 65;

            activity.clearCurrentKeyCode();

            expect(activity.currentKey).toBe("");
        });

        test("should clear currentKeyCode to 0", () => {
            activity.currentKey = "Space";
            activity.currentKeyCode = 32;

            activity.clearCurrentKeyCode();

            expect(activity.currentKeyCode).toBe(0);
        });

        test("should clear both currentKey and currentKeyCode simultaneously", () => {
            activity.currentKey = "Enter";
            activity.currentKeyCode = 13;

            activity.clearCurrentKeyCode();

            expect(activity.currentKey).toBe("");
            expect(activity.currentKeyCode).toBe(0);
        });

        test("should handle already cleared state", () => {
            activity.currentKey = "";
            activity.currentKeyCode = 0;

            activity.clearCurrentKeyCode();

            expect(activity.currentKey).toBe("");
            expect(activity.currentKeyCode).toBe(0);
        });
    });
});

/**
 * Tests for setSmallerLargerStatus function
 *
 * This function updates the block size button icons based on whether
 * the current block scale has reached minimum or maximum.
 */
describe("setSmallerLargerStatus", () => {
    // Constants from activity.js
    const BLOCKSCALES = [1, 1.5, 2, 3, 4];
    const DEFAULTBLOCKSCALE = 2;
    const SMALLERBUTTON = "smaller.svg";
    const SMALLERDISABLEBUTTON = "smaller-disabled.svg";
    const BIGGERBUTTON = "bigger.svg";
    const BIGGERDISABLEBUTTON = "bigger-disabled.svg";

    let activity;
    let mockChangeImage;

    beforeEach(() => {
        // Mock changeImage function
        mockChangeImage = jest.fn().mockResolvedValue(undefined);

        // Create mock activity object
        activity = {
            blockscale: 2, // Index into BLOCKSCALES (default: 2)
            smallerContainer: {
                children: [{ src: "" }]
            },
            largerContainer: {
                children: [{ src: "" }]
            },

            /**
             * Sets the status of smaller/larger block icons.
             * Source: activity.js lines 2150-2178
             */
            setSmallerLargerStatus: async function () {
                if (BLOCKSCALES[this.blockscale] < DEFAULTBLOCKSCALE) {
                    await mockChangeImage(
                        this.smallerContainer.children[0],
                        SMALLERBUTTON,
                        SMALLERDISABLEBUTTON
                    );
                } else {
                    await mockChangeImage(
                        this.smallerContainer.children[0],
                        SMALLERDISABLEBUTTON,
                        SMALLERBUTTON
                    );
                }

                if (BLOCKSCALES[this.blockscale] === 4) {
                    await mockChangeImage(
                        this.largerContainer.children[0],
                        BIGGERBUTTON,
                        BIGGERDISABLEBUTTON
                    );
                } else {
                    await mockChangeImage(
                        this.largerContainer.children[0],
                        BIGGERDISABLEBUTTON,
                        BIGGERBUTTON
                    );
                }
            }
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("smaller button icon", () => {
        test("should disable smaller button when scale is below default", async () => {
            // blockscale index 0 = BLOCKSCALES[0] = 1, which is < DEFAULTBLOCKSCALE (2)
            activity.blockscale = 0;

            await activity.setSmallerLargerStatus();

            expect(mockChangeImage).toHaveBeenCalledWith(
                activity.smallerContainer.children[0],
                SMALLERBUTTON,
                SMALLERDISABLEBUTTON
            );
        });

        test("should disable smaller button for scale 1.5", async () => {
            // blockscale index 1 = BLOCKSCALES[1] = 1.5, which is < DEFAULTBLOCKSCALE (2)
            activity.blockscale = 1;

            await activity.setSmallerLargerStatus();

            expect(mockChangeImage).toHaveBeenCalledWith(
                activity.smallerContainer.children[0],
                SMALLERBUTTON,
                SMALLERDISABLEBUTTON
            );
        });

        test("should enable smaller button when scale equals default", async () => {
            // blockscale index 2 = BLOCKSCALES[2] = 2, which is NOT < DEFAULTBLOCKSCALE (2)
            activity.blockscale = 2;

            await activity.setSmallerLargerStatus();

            expect(mockChangeImage).toHaveBeenCalledWith(
                activity.smallerContainer.children[0],
                SMALLERDISABLEBUTTON,
                SMALLERBUTTON
            );
        });

        test("should enable smaller button when scale is above default", async () => {
            // blockscale index 3 = BLOCKSCALES[3] = 3, which is NOT < DEFAULTBLOCKSCALE (2)
            activity.blockscale = 3;

            await activity.setSmallerLargerStatus();

            expect(mockChangeImage).toHaveBeenCalledWith(
                activity.smallerContainer.children[0],
                SMALLERDISABLEBUTTON,
                SMALLERBUTTON
            );
        });
    });

    describe("larger button icon", () => {
        test("should enable larger button when scale is not maximum", async () => {
            // blockscale index 2 = BLOCKSCALES[2] = 2, which is NOT equal to 4
            activity.blockscale = 2;

            await activity.setSmallerLargerStatus();

            expect(mockChangeImage).toHaveBeenCalledWith(
                activity.largerContainer.children[0],
                BIGGERDISABLEBUTTON,
                BIGGERBUTTON
            );
        });

        test("should enable larger button for scale 3", async () => {
            // blockscale index 3 = BLOCKSCALES[3] = 3, which is NOT equal to 4
            activity.blockscale = 3;

            await activity.setSmallerLargerStatus();

            expect(mockChangeImage).toHaveBeenCalledWith(
                activity.largerContainer.children[0],
                BIGGERDISABLEBUTTON,
                BIGGERBUTTON
            );
        });

        test("should disable larger button when scale is maximum (4)", async () => {
            // blockscale index 4 = BLOCKSCALES[4] = 4, which is equal to 4
            activity.blockscale = 4;

            await activity.setSmallerLargerStatus();

            expect(mockChangeImage).toHaveBeenCalledWith(
                activity.largerContainer.children[0],
                BIGGERBUTTON,
                BIGGERDISABLEBUTTON
            );
        });
    });

    describe("combined icon states", () => {
        test("should disable smaller and enable larger at minimum scale", async () => {
            activity.blockscale = 0; // minimum

            await activity.setSmallerLargerStatus();

            // Smaller should be disabled (scale < default)
            expect(mockChangeImage).toHaveBeenNthCalledWith(
                1,
                activity.smallerContainer.children[0],
                SMALLERBUTTON,
                SMALLERDISABLEBUTTON
            );
            // Larger should be enabled (scale !== 4)
            expect(mockChangeImage).toHaveBeenNthCalledWith(
                2,
                activity.largerContainer.children[0],
                BIGGERDISABLEBUTTON,
                BIGGERBUTTON
            );
        });

        test("should enable smaller and disable larger at maximum scale", async () => {
            activity.blockscale = 4; // maximum

            await activity.setSmallerLargerStatus();

            // Smaller should be enabled (scale >= default)
            expect(mockChangeImage).toHaveBeenNthCalledWith(
                1,
                activity.smallerContainer.children[0],
                SMALLERDISABLEBUTTON,
                SMALLERBUTTON
            );
            // Larger should be disabled (scale === 4)
            expect(mockChangeImage).toHaveBeenNthCalledWith(
                2,
                activity.largerContainer.children[0],
                BIGGERBUTTON,
                BIGGERDISABLEBUTTON
            );
        });

        test("should enable both buttons at default scale", async () => {
            activity.blockscale = 2; // default scale

            await activity.setSmallerLargerStatus();

            // Smaller should be enabled (scale >= default)
            expect(mockChangeImage).toHaveBeenNthCalledWith(
                1,
                activity.smallerContainer.children[0],
                SMALLERDISABLEBUTTON,
                SMALLERBUTTON
            );
            // Larger should be enabled (scale !== 4)
            expect(mockChangeImage).toHaveBeenNthCalledWith(
                2,
                activity.largerContainer.children[0],
                BIGGERDISABLEBUTTON,
                BIGGERBUTTON
            );
        });

        test("should call changeImage exactly twice", async () => {
            activity.blockscale = 2;

            await activity.setSmallerLargerStatus();

            expect(mockChangeImage).toHaveBeenCalledTimes(2);
        });
    });
});
