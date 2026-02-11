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

const { Mouse, MusicBlocks } = require("../export.js");
global.importMembers = jest.fn();
global.JSInterface = {
    validateArgs: jest.fn((method, args) => args)
};
global.Painter = {
    prototype: {
        method1: jest.fn(),
        method2: jest.fn()
    }
};

const JSEditor = {
    logConsole: jest.fn()
};
global.JSEditor = JSEditor;

const globalActivity = {
    turtles: {
        getTurtleCount: jest.fn(),
        getTurtle: jest.fn(),
        addTurtle: jest.fn(),
        getIndexOfTurtle: jest.fn(),
        removeTurtle: jest.fn(),
        screenX2turtleX: jest.fn(),
        screenY2turtleY: jest.fn()
    },
    logo: {
        prepSynths: jest.fn(),
        firstNoteTime: null,
        stage: {
            removeEventListener: jest.fn()
        }
    },
    textMsg: jest.fn(),
    stage: {
        dispatchEvent: jest.fn()
    }
};
global.globalActivity = globalActivity;
global.Singer = {
    RhythmActions: {
        getNoteValue: jest.fn()
    },
    MeterActions: {
        setPickup: jest.fn(),
        getWholeNotesPlayed: jest.fn(),
        getBeatCount: jest.fn(),
        getMeasureCount: jest.fn(),
        getBPM: jest.fn(),
        getBeatFactor: jest.fn(),
        getCurrentMeter: jest.fn()
    },
    PitchActions: {
        deltaPitch: jest.fn(),
        consonantStepSize: jest.fn()
    },
    IntervalsActions: {
        setMovableDo: jest.fn(),
        getCurrentKey: jest.fn(),
        getCurrentMode: jest.fn(),
        getModeLength: jest.fn()
    },
    VolumeActions: {
        setPanning: jest.fn(),
        setMasterVolume: jest.fn(),
        masterVolume: 1.0
    }
};

describe("Mouse Class", () => {
    let mouse;
    const mockFlow = jest.fn();

    beforeEach(() => {
        globalActivity.turtles.getTurtleCount.mockReturnValue(1);
        globalActivity.turtles.getTurtle.mockReturnValue({
            id: 1,
            initTurtle: jest.fn(),
            doWait: jest.fn()
        });
        mouse = new Mouse(mockFlow);
    });

    test("should create a new Mouse instance", () => {
        expect(mouse).toBeInstanceOf(Mouse);
        expect(Mouse.MouseList).toContain(mouse);
        expect(Mouse.TurtleMouseMap[1]).toBe(mouse);
    });

    test("should get Mouse from Turtle", () => {
        const turtle = { id: 1 };
        const result = Mouse.getMouseFromTurtle(turtle);
        expect(result).toBe(mouse);
    });

    test("should return null if Turtle is not in map", () => {
        const turtle = { id: 2 };
        const result = Mouse.getMouseFromTurtle(turtle);
        expect(result).toBeNull();
    });

    test("should run the flow", () => {
        mouse.run();
        expect(mouse.turtle.doWait).toHaveBeenCalledWith(0);
        expect(mockFlow).toHaveBeenCalledWith(mouse.MB);
    });
});

describe("MusicBlocks Class", () => {
    let musicBlocks;
    let mouse;

    beforeEach(() => {
        globalActivity.turtles.getTurtleCount.mockReturnValue(1);
        globalActivity.turtles.getTurtle.mockReturnValue({
            id: 1,
            initTurtle: jest.fn(),
            doWait: jest.fn(),
            container: { x: 10, y: 20 }
        });
        mouse = new Mouse(jest.fn());
        mouse.run = jest.fn();
        musicBlocks = new MusicBlocks(mouse);
    });

    test("should create a new MusicBlocks instance", () => {
        expect(musicBlocks).toBeInstanceOf(MusicBlocks);
        expect(musicBlocks.mouse).toBe(mouse);
        expect(musicBlocks.turtle).toBe(mouse.turtle);
    });

    test("should run all mice", () => {
        Mouse.MouseList.push(mouse);
        MusicBlocks.run();
        expect(globalActivity.logo.prepSynths).toHaveBeenCalled();
        expect(mouse.run).toHaveBeenCalled();
    });

    test("should handle ENDFLOW", async () => {
        const result = await musicBlocks.ENDFLOW;
        expect(result).toBeUndefined();
    });

    test("should handle ENDFLOWCOMMAND", async () => {
        musicBlocks.turtle.waitTime = 100;
        musicBlocks.turtle.doWait = jest.fn();
        musicBlocks.listeners.push("testSignal");

        await musicBlocks.ENDFLOWCOMMAND;
        expect(globalActivity.stage.dispatchEvent).toHaveBeenCalledWith("testSignal");
        expect(musicBlocks.turtle.doWait).toHaveBeenCalledWith(0);
    });

    test("should handle ENDMOUSE and remove mouse from list", async () => {
        Mouse.MouseList = [mouse];
        Mouse.AddedTurtles = [];
        await musicBlocks.ENDMOUSE;
        expect(Mouse.MouseList).not.toContain(mouse);
    });

    test("should call init(false) when last mouse ends", async () => {
        Mouse.MouseList = [mouse];
        Mouse.AddedTurtles = [];
        await musicBlocks.ENDMOUSE;
        expect(MusicBlocks.isRun).toBe(false);
    });

    test("should print a message", () => {
        musicBlocks.print("test message");
        expect(JSEditor.logConsole).toHaveBeenCalled();
        expect(globalActivity.textMsg).toHaveBeenCalledWith("test message");
    });

    test("should handle undefined message", () => {
        musicBlocks.print(undefined);
        expect(globalActivity.textMsg).toHaveBeenCalledWith("undefined");
    });

    test("should handle null message", () => {
        musicBlocks.print(null);
        expect(globalActivity.textMsg).toHaveBeenCalledWith("null");
    });

    test("should get X coordinate", () => {
        globalActivity.turtles.screenX2turtleX.mockReturnValue(10);
        expect(musicBlocks.X).toBe(10);
    });

    test("should get Y coordinate", () => {
        globalActivity.turtles.screenY2turtleY.mockReturnValue(20);
        expect(musicBlocks.Y).toBe(20);
    });

    test("should get HEADING", () => {
        musicBlocks.turtle.orientation = 90;
        expect(musicBlocks.HEADING).toBe(90);
    });

    test("should get PENSIZE", () => {
        musicBlocks.turtle.painter = { stroke: 5 };
        expect(musicBlocks.PENSIZE).toBe(5);
    });

    test("should get COLOR", () => {
        musicBlocks.turtle.painter = { color: "red" };
        expect(musicBlocks.COLOR).toBe("red");
    });

    test("should get SHADE", () => {
        musicBlocks.turtle.painter = { value: 50 };
        expect(musicBlocks.SHADE).toBe(50);
    });

    test("should get GREY", () => {
        musicBlocks.turtle.painter = { chroma: 75 };
        expect(musicBlocks.GREY).toBe(75);
    });

    test("should get NOTEVALUE", () => {
        Singer.RhythmActions.getNoteValue.mockReturnValue(1);
        expect(musicBlocks.NOTEVALUE).toBe(1);
    });

    describe("PICKUP setter", () => {
        beforeEach(() => {
            Singer.MeterActions.setPickup.mockClear();
        });

        test("should set PICKUP with positive value", () => {
            musicBlocks.PICKUP = 2;
            expect(Singer.MeterActions.setPickup).toHaveBeenCalledWith(2, musicBlocks.turIndex);
        });

        test("should clamp negative PICKUP value to 0", () => {
            musicBlocks.PICKUP = -5;
            expect(Singer.MeterActions.setPickup).toHaveBeenCalledWith(0, musicBlocks.turIndex);
        });

        test("should allow PICKUP value of 0", () => {
            musicBlocks.PICKUP = 0;
            expect(Singer.MeterActions.setPickup).toHaveBeenCalledWith(0, musicBlocks.turIndex);
        });
    });

    test("should get WHOLENOTESPLAYED", () => {
        Singer.MeterActions.getWholeNotesPlayed.mockReturnValue(4);
        expect(musicBlocks.WHOLENOTESPLAYED).toBe(4);
    });

    test("should get BEATCOUNT", () => {
        Singer.MeterActions.getBeatCount.mockReturnValue(16);
        expect(musicBlocks.BEATCOUNT).toBe(16);
    });

    test("should get MEASURECOUNT", () => {
        Singer.MeterActions.getMeasureCount.mockReturnValue(4);
        expect(musicBlocks.MEASURECOUNT).toBe(4);
    });

    test("should get BPM", () => {
        Singer.MeterActions.getBPM.mockReturnValue(120);
        expect(musicBlocks.BPM).toBe(120);
    });

    test("should get BEATFACTOR", () => {
        Singer.MeterActions.getBeatFactor.mockReturnValue(1.5);
        expect(musicBlocks.BEATFACTOR).toBe(1.5);
    });

    test("should get CURRENTMETER", () => {
        Singer.MeterActions.getCurrentMeter.mockReturnValue("4/4");
        expect(musicBlocks.CURRENTMETER).toBe("4/4");
    });

    test("should get SCALARCHANGEINPITCH", () => {
        Singer.PitchActions.deltaPitch.mockReturnValue(2);
        expect(musicBlocks.SCALARCHANGEINPITCH).toBe(2);
    });

    test("should get CHANGEINPITCH", () => {
        Singer.PitchActions.deltaPitch.mockReturnValue(1);
        expect(musicBlocks.CHANGEINPITCH).toBe(1);
    });

    test("should get SCALARSTEPUP", () => {
        Singer.PitchActions.consonantStepSize.mockReturnValue(1);
        expect(musicBlocks.SCALARSTEPUP).toBe(1);
    });

    test("should get SCALARSTEPDOWN", () => {
        Singer.PitchActions.consonantStepSize.mockReturnValue(-1);
        expect(musicBlocks.SCALARSTEPDOWN).toBe(-1);
    });

    test("should set MOVABLEDO", () => {
        musicBlocks.MOVABLEDO = true;
        expect(Singer.IntervalsActions.setMovableDo).toHaveBeenCalledWith(
            true,
            musicBlocks.turIndex
        );
    });

    test("should get CURRENTKEY", () => {
        Singer.IntervalsActions.getCurrentKey.mockReturnValue("C");
        expect(musicBlocks.CURRENTKEY).toBe("C");
    });

    test("should get CURRENTMODE", () => {
        Singer.IntervalsActions.getCurrentMode.mockReturnValue("major");
        expect(musicBlocks.CURRENTMODE).toBe("major");
    });

    test("should get MODELENGTH", () => {
        Singer.IntervalsActions.getModeLength.mockReturnValue(7);
        expect(musicBlocks.MODELENGTH).toBe(7);
    });

    test("should set PANNING", () => {
        musicBlocks.PANNING = 0.5;
        expect(Singer.VolumeActions.setPanning).toHaveBeenCalledWith(0.5, musicBlocks.turIndex);
    });

    test("should set MASTERVOLUME", () => {
        musicBlocks.MASTERVOLUME = 0.8;
        expect(Singer.VolumeActions.setMasterVolume).toHaveBeenCalledWith(
            0.8,
            musicBlocks.turIndex
        );
    });

    test("should get MASTERVOLUME", () => {
        expect(musicBlocks.MASTERVOLUME).toBe(1.0);
    });

    describe("runCommand", () => {
        beforeEach(() => {
            musicBlocks.turtle.waitTime = 0;
            musicBlocks.turtle.doWait = jest.fn();
            MusicBlocks._methodList = {};
        });

        test("should execute _anonymous command with callback", async () => {
            const callback = jest.fn();
            await musicBlocks.runCommand("_anonymous", callback);
            expect(callback).toHaveBeenCalled();
        });

        test("should handle _anonymous command with undefined args", async () => {
            const result = await musicBlocks.runCommand("_anonymous", undefined);
            expect(result).toBeUndefined();
        });

        test("should call method from _methodList with args", async () => {
            const mockMethod = jest.fn().mockReturnValue("result");
            global.TestActions = { testMethod: mockMethod };
            MusicBlocks._methodList["TestActions"] = ["testMethod"];

            await musicBlocks.runCommand("testMethod", ["arg1", "arg2"]);
            expect(mockMethod).toHaveBeenCalledWith("arg1", "arg2");
        });

        test("should call method with no args when args is empty array", async () => {
            const mockMethod = jest.fn().mockReturnValue(42);
            global.TestActions = { noArgMethod: mockMethod };
            MusicBlocks._methodList["TestActions"] = ["noArgMethod"];

            const result = await musicBlocks.runCommand("noArgMethod", []);
            expect(mockMethod).toHaveBeenCalledWith();
            expect(result).toBe(42);
        });

        test("should reset turtle waitTime to 0 after command", async () => {
            musicBlocks.turtle.waitTime = 500;
            await musicBlocks.runCommand("_anonymous", undefined);
            expect(musicBlocks.turtle.doWait).toHaveBeenCalledWith(0);
        });

        test("should use Painter when className is Painter", async () => {
            const mockPainterMethod = jest.fn().mockReturnValue("painted");
            musicBlocks.turtle.painter = { draw: mockPainterMethod };
            MusicBlocks._methodList["Painter"] = ["draw"];

            const result = await musicBlocks.runCommand("draw", []);
            expect(mockPainterMethod).toHaveBeenCalled();
            expect(result).toBe("painted");
        });
    });
});
