/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Justin Charles
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

const JSInterface = {
    validateArgs: jest.fn(),
};
global.JSInterface = JSInterface;
  
global.globalActivity = {
    turtles: {
        ithTurtle: jest.fn(() => ({ name: "defaultDict" })),
    },
};
  
const GraphicsBlocksAPI = require("../GraphicsBlocksAPI");
  
describe("GraphicsBlocksAPI", () => {
    let graphicsBlocksAPI;
  
    beforeEach(() => {
        graphicsBlocksAPI = new GraphicsBlocksAPI();
        graphicsBlocksAPI.turIndex = 0;
        graphicsBlocksAPI.runCommand = jest.fn();
    });
  
    afterEach(() => {
        jest.clearAllMocks();
    });
  
    test("goForward calls runCommand with correct arguments", () => {
        const steps = 5;
        JSInterface.validateArgs.mockReturnValue([steps]);
  
        graphicsBlocksAPI.goForward(steps);
  
        expect(JSInterface.validateArgs).toHaveBeenCalledWith("goForward", [steps]);
        expect(graphicsBlocksAPI.runCommand).toHaveBeenCalledWith("doForward", [steps]);
    });
  
    test("goBackward calls runCommand with correct arguments", () => {
        const steps = 5;
        JSInterface.validateArgs.mockReturnValue([steps]);
  
        graphicsBlocksAPI.goBackward(steps);
  
        expect(JSInterface.validateArgs).toHaveBeenCalledWith("goBackward", [steps]);
        expect(graphicsBlocksAPI.runCommand).toHaveBeenCalledWith("doForward", [-steps]);
    });
  
    test("turnRight calls runCommand with correct arguments", () => {
        const degrees = 90;
        JSInterface.validateArgs.mockReturnValue([degrees]);
  
        graphicsBlocksAPI.turnRight(degrees);
  
        expect(JSInterface.validateArgs).toHaveBeenCalledWith("turnRight", [degrees]);
        expect(graphicsBlocksAPI.runCommand).toHaveBeenCalledWith("doRight", [degrees]);
    });
  
    test("turnLeft calls runCommand with correct arguments", () => {
        const degrees = 90;
        JSInterface.validateArgs.mockReturnValue([degrees]);
  
        graphicsBlocksAPI.turnLeft(degrees);
  
        expect(JSInterface.validateArgs).toHaveBeenCalledWith("turnLeft", [degrees]);
        expect(graphicsBlocksAPI.runCommand).toHaveBeenCalledWith("doRight", [-degrees]);
    });
  
    test("setXY calls runCommand with correct arguments", () => {
        const x = 10;
        const y = 20;
        JSInterface.validateArgs.mockReturnValue([x, y]);
  
        graphicsBlocksAPI.setXY(x, y);
  
        expect(JSInterface.validateArgs).toHaveBeenCalledWith("setXY", [x, y]);
        expect(graphicsBlocksAPI.runCommand).toHaveBeenCalledWith("doSetXY", [x, y]);
    });
  
    test("setHeading calls runCommand with correct arguments", () => {
        const degrees = 90;
        JSInterface.validateArgs.mockReturnValue([degrees]);
  
        graphicsBlocksAPI.setHeading(degrees);
  
        expect(JSInterface.validateArgs).toHaveBeenCalledWith("setHeading", [degrees]);
        expect(graphicsBlocksAPI.runCommand).toHaveBeenCalledWith("doSetHeading", [degrees]);
    });
  
    test("drawArc calls runCommand with correct arguments", () => {
        const degrees = 45;
        const steps = 10;
        JSInterface.validateArgs.mockReturnValue([degrees, steps]);
  
        graphicsBlocksAPI.drawArc(degrees, steps);
  
        expect(JSInterface.validateArgs).toHaveBeenCalledWith("drawArc", [degrees, steps]);
        expect(graphicsBlocksAPI.runCommand).toHaveBeenCalledWith("doArc", [degrees, steps]);
    });
  
    test("drawBezier calls runCommand with correct arguments", () => {
        const x = 15;
        const y = 25;
        JSInterface.validateArgs.mockReturnValue([x, y]);
  
        graphicsBlocksAPI.drawBezier(x, y);
  
        expect(JSInterface.validateArgs).toHaveBeenCalledWith("drawBezier", [x, y]);
        expect(graphicsBlocksAPI.runCommand).toHaveBeenCalledWith("doBezier", [x, y]);
    });
  
    test("setBezierControlPoint1 calls runCommand with correct arguments", () => {
        const x = 5;
        const y = 10;
        JSInterface.validateArgs.mockReturnValue([x, y]);
  
        graphicsBlocksAPI.setBezierControlPoint1(x, y);
  
        expect(JSInterface.validateArgs).toHaveBeenCalledWith("setBezierControlPoint1", [x, y]);
        expect(graphicsBlocksAPI.runCommand).toHaveBeenCalledWith("setControlPoint1", [x, y]);
    });
  
    test("setBezierControlPoint2 calls runCommand with correct arguments", () => {
        const x = 10;
        const y = 15;
        JSInterface.validateArgs.mockReturnValue([x, y]);
  
        graphicsBlocksAPI.setBezierControlPoint2(x, y);
  
        expect(JSInterface.validateArgs).toHaveBeenCalledWith("setBezierControlPoint2", [x, y]);
        expect(graphicsBlocksAPI.runCommand).toHaveBeenCalledWith("setControlPoint2", [x, y]);
    });
  
    test("clear calls runCommand with correct arguments", () => {
        graphicsBlocksAPI.clear();
  
        expect(graphicsBlocksAPI.runCommand).toHaveBeenCalledWith("doClear", [true, true, true]);
    });
  
    test("scrollXY calls runCommand with correct arguments", () => {
        const x = 10;
        const y = 20;
        JSInterface.validateArgs.mockReturnValue([x, y]);
  
        graphicsBlocksAPI.scrollXY(x, y);
  
        expect(JSInterface.validateArgs).toHaveBeenCalledWith("scrollXY", [x, y]);
        expect(graphicsBlocksAPI.runCommand).toHaveBeenCalledWith("doScrollXY", [x, y]);
    });
});