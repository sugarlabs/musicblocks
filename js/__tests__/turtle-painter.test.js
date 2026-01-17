/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Om Santosh Suneri
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

const Painter = require("../turtle-painter");
global.WRAP = true;
const mockTurtle = {
    turtles: {
        screenX2turtleX: jest.fn(),
        screenY2turtleY: jest.fn(),
        turtleX2screenX: jest.fn(),
        turtleY2screenY: jest.fn(),
        scale: 1
    },
    activity: { refreshCanvas: jest.fn() },
    container: { x: 0, y: 0, rotation: 0 },
    ctx: {
        beginPath: jest.fn(),
        clearRect: jest.fn(),
        stroke: jest.fn(),
        closePath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        arc: jest.fn(),
        canvas: { width: 800, height: 600 }
    },
    penstrokes: { image: null },
    orientation: 0,
    updateCache: jest.fn(),
    blinking: jest.fn().mockReturnValue(false)
};

describe("Painter Class", () => {
    let painter;

    beforeEach(() => {
        painter = new Painter(mockTurtle);
    });

    describe("Constructor", () => {
        test("should initialize with default values", () => {
            expect(painter._color).toBe(0);
            expect(painter._stroke).toBe(5);
            expect(painter._penDown).toBe(true);
        });
    });

    describe("Setters and Getters", () => {
        test("should set and get color", () => {
            painter.color = 10;
            expect(painter.color).toBe(10);
        });

        test("should set and get stroke", () => {
            painter.stroke = 8;
            expect(painter.stroke).toBe(8);
        });
    });

    describe("Actions", () => {
        test("should move forward", () => {
            painter.doForward(10);
            expect(mockTurtle.activity.refreshCanvas).toHaveBeenCalled();
        });

        test("should turn right", () => {
            painter.doRight(90);
            expect(mockTurtle.orientation).toBe(90);
        });
    });
});
