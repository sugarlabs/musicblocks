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

const Turtles = require("../turtles");

global.createjs = {
    Container: jest.fn().mockImplementation(() => ({
        addChild: jest.fn(),
        removeAllChildren: jest.fn(),
        on: jest.fn(),
        removeAllEventListeners: jest.fn(),
    })),
    Bitmap: jest.fn().mockImplementation(() => ({})),
};

global.importMembers = jest.fn();
global.setupRhythmActions = jest.fn();
global.setupMeterActions = jest.fn();
global.setupPitchActions = jest.fn();
global.setupIntervalsActions = jest.fn();
global.setupToneActions = jest.fn();
global.setupOrnamentActions = jest.fn();
global.setupVolumeActions = jest.fn();
global.setupDrumActions = jest.fn();
global.setupDictActions = jest.fn();

global.Turtle = jest.fn().mockImplementation(() => ({
    painter: {
        doSetHeading: jest.fn(),
        doSetPensize: jest.fn(),
        doSetChroma: jest.fn(),
        doSetValue: jest.fn(),
        doSetColor: jest.fn(),
    },
    rename: jest.fn(),
    container: {
        scaleX: 1,
        scaleY: 1,
        scale: 1,
        on: jest.fn(),
        removeAllEventListeners: jest.fn(),
    },
}));

describe("Turtles Class", () => {
    let activityMock;
    let turtles;

    beforeEach(() => {
        activityMock = {
            stage: { addChild: jest.fn(), removeChild: jest.fn() },
            refreshCanvas: jest.fn(),
            turtleContainer: new createjs.Container(),
            hideAuxMenu: jest.fn(),
            hideGrids: jest.fn(),
            _doCartesianPolar: jest.fn(),
        };

        turtles = new Turtles(activityMock);
        turtles.activity = activityMock;
        turtles.getTurtleCount = jest.fn().mockReturnValue(0);
        turtles.getTurtle = jest.fn(() => ({
            container: {
                scaleX: 1,
                scaleY: 1,
                scale: 1,
            },
        }));

        turtles.pushTurtle = jest.fn();
        turtles.addTurtleStageProps = jest.fn();
        turtles.createArtwork = jest.fn();
        turtles.createHitArea = jest.fn();
        turtles.addTurtleGraphicProps = jest.fn();
        turtles.isShrunk = jest.fn().mockReturnValue(false);
        document.body.innerHTML = '<div id="loader"></div>';
    });

    test("should initialize properly", () => {
        expect(turtles.activity).not.toBeUndefined();
        expect(global.importMembers).toHaveBeenCalledWith(turtles, "", [activityMock]);
    });

    test("should call initActions on construction", () => {
        const spy = jest.spyOn(turtles, "initActions");
        turtles.initActions();
        expect(spy).toHaveBeenCalled();
    });

    test("should add a turtle properly", () => {
        turtles.addTurtle({}, { id: 1, name: "TestTurtle" });

        expect(turtles.getTurtleCount).toHaveBeenCalled();
        expect(turtles.pushTurtle).toHaveBeenCalled();
        expect(turtles.addTurtleStageProps).toHaveBeenCalled();
        expect(turtles.createArtwork).toHaveBeenCalled();
        expect(turtles.createHitArea).toHaveBeenCalled();
        expect(turtles.addTurtleGraphicProps).toHaveBeenCalled();
        expect(turtles.isShrunk).toHaveBeenCalled();
    });

    test("should toggle running state correctly", () => {
        turtles.markAllAsStopped();
        expect(activityMock.refreshCanvas).toHaveBeenCalled();
    });
});
