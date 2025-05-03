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

global.DEFAULTVOLUME = 100;
global.TARGETBPM = 120;
global.TONEBPM = 60;

const Singer = require("../turtle-singer");

const mockGlobals = {
    getNote: jest.fn().mockReturnValue(["C", 4]),
    isCustomTemperament: jest.fn(),
    getStepSizeUp: jest.fn().mockReturnValue(1),
    numberToPitch: jest.fn().mockReturnValue(["C", 4]),
    pitchToNumber: jest.fn().mockReturnValue(60)
};

global.getNote = mockGlobals.getNote;
global.isCustomTemperament = mockGlobals.isCustomTemperament;
global.getStepSizeUp = mockGlobals.getStepSizeUp;
global.numberToPitch = mockGlobals.numberToPitch;
global.pitchToNumber = mockGlobals.pitchToNumber;
global.last = jest.fn((array) => array[array.length - 1]);


describe("Singer Class", () => {
    let turtleMock;
    let activityMock;
    let logoMock;
    let singer;

    beforeEach(() => {
        turtleMock = {
            turtles: [],
            singer: new Singer(this),
            synthVolume: { DEFAULTVOICE: [100] },
            inNoteBlock: [0],
            notePitches: { 0: [] },
            noteOctaves: { 0: [] },
            noteCents: { 0: [] },
            noteHertz: { 0: [] }
        };

        activityMock = {
            turtles: {
                ithTurtle: jest.fn().mockReturnValue(turtleMock),
                turtleList: [turtleMock],
            },
            logo: {
                synth: {
                    setMasterVolume: jest.fn(),
                    setVolume: jest.fn(),
                    rampTo: jest.fn()
                },
                pitchDrumMatrix: { addRowBlock: jest.fn() },
                notation: { notationInsertTie: jest.fn(), notationRemoveTie: jest.fn() },
                firstNoteTime: null,
                stopTurtle: false,
                inPitchDrumMatrix: false,
                inMatrix: false,
                clearNoteParams: jest.fn(),
                // Add blockList here
                blockList: {
                    mockBlk: {
                        connections: [0, 0]
                    }
                }
            },
        };

        logoMock = {
            activity: activityMock,
            synth: {
                setMasterVolume: jest.fn(),
                setVolume: jest.fn(),
                rampTo: jest.fn(),
                getFrequency: jest.fn(),
                getCustomFrequency: jest.fn()
            },
            inPitchDrumMatrix: false,
            inMatrix: false,
            clearNoteParams: jest.fn(),
        };

        singer = new Singer(turtleMock);
    });

    test("should initialize with correct default values", () => {
        expect(singer.turtle).toBe(turtleMock);
        expect(singer.turtles).toBe(turtleMock.turtles);
        expect(singer.defaultNoteValue).toBe(4);
        expect(singer.register).toBe(0);
        expect(singer.beatFactor).toBe(1);
        expect(singer.currentOctave).toBe(4);
    });

    test("should correctly add scalar transposition", () => {
        const result = Singer.addScalarTransposition(logoMock, turtleMock, "C", 4, 2);
        expect(result).toEqual(["C", 4]);
    });

    test("should correctly calculate scalar distance", () => {
        const result = Singer.scalarDistance(logoMock, turtleMock, 60, 62);
        expect(result).toBeGreaterThan(0);
    });

    test("should correctly calculate inversion", () => {
        const result = Singer.calculateInvert(logoMock, turtleMock, "C", 4);
        expect(result).toBe(0);
    });

    test("should set master volume correctly", () => {
        Singer.setMasterVolume(logoMock, 50, "mockBlk");
        expect(logoMock.synth.setMasterVolume).toHaveBeenCalledWith(50, 0, 0);
    });

    test("should set synth volume correctly", () => {
        Singer.setSynthVolume(logoMock, turtleMock, "noise1", 80, "mockBlk");
        expect(logoMock.synth.setVolume).toHaveBeenCalledWith(turtleMock, "noise1", 80 / 25, "mockBlk");
    });
 
});
