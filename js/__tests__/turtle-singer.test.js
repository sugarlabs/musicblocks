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
global.last = jest.fn(array => array[array.length - 1]);

const createTurtleMock = () => ({
    turtles: [],
    singer: null,
    synthVolume: { DEFAULTVOICE: [100] },
    inNoteBlock: [0],
    notePitches: { 0: [] },
    noteOctaves: { 0: [] },
    noteCents: { 0: [] },
    noteHertz: { 0: [] }
});

const createActivityMock = turtleMock => ({
    turtles: {
        ithTurtle: jest.fn().mockReturnValue(turtleMock),
        turtleList: [turtleMock]
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
        blockList: {
            mockBlk: {
                connections: [0, 0]
            }
        }
    }
});

const createLogoMock = activityMock => ({
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
    clearNoteParams: jest.fn()
});

describe("Singer Class", () => {
    let turtleMock;
    let activityMock;
    let logoMock;
    let singer;

    beforeEach(() => {
        turtleMock = createTurtleMock();
        turtleMock.singer = new Singer(turtleMock);
        activityMock = createActivityMock(turtleMock);
        logoMock = createLogoMock(activityMock);
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
        expect(logoMock.synth.setVolume).toHaveBeenCalledWith(
            turtleMock,
            "noise1",
            80 / 25,
            "mockBlk"
        );
    });
});

describe("State initialization — note parameters", () => {
    let singer;

    beforeEach(() => {
        const turtleMock = createTurtleMock();
        singer = new Singer(turtleMock);
    });

    test("should initialize scalarTransposition to 0", () => {
        expect(singer.scalarTransposition).toBe(0);
    });

    test("should initialize transposition to 0", () => {
        expect(singer.transposition).toBe(0);
    });

    test("should initialize dotCount to 0", () => {
        expect(singer.dotCount).toBe(0);
    });

    test("should initialize register to 0", () => {
        expect(singer.register).toBe(0);
    });

    test("should initialize defaultNoteValue to 4", () => {
        expect(singer.defaultNoteValue).toBe(4);
    });

    test("should initialize beatFactor to 1", () => {
        expect(singer.beatFactor).toBe(1);
    });

    test("should initialize pitchNumberOffset to 39 (C4)", () => {
        expect(singer.pitchNumberOffset).toBe(39);
    });

    test("should initialize currentOctave to 4", () => {
        expect(singer.currentOctave).toBe(4);
    });

    test("should initialize noteDirection to 0", () => {
        expect(singer.noteDirection).toBe(0);
    });

    test("should initialize lastNotePlayed to null", () => {
        expect(singer.lastNotePlayed).toBeNull();
    });

    test("should initialize previousNotePlayed to null", () => {
        expect(singer.previousNotePlayed).toBeNull();
    });

    test("should initialize noteStatus to null", () => {
        expect(singer.noteStatus).toBeNull();
    });
});

describe("State initialization — time signature and beats", () => {
    let singer;

    beforeEach(() => {
        const turtleMock = createTurtleMock();
        singer = new Singer(turtleMock);
    });

    test("should initialize beatsPerMeasure to 4", () => {
        expect(singer.beatsPerMeasure).toBe(4);
    });

    test("should initialize noteValuePerBeat to 4", () => {
        expect(singer.noteValuePerBeat).toBe(4);
    });

    test("should initialize currentBeat to 0", () => {
        expect(singer.currentBeat).toBe(0);
    });

    test("should initialize currentMeasure to 0", () => {
        expect(singer.currentMeasure).toBe(0);
    });

    test("should initialize pickup to 0", () => {
        expect(singer.pickup).toBe(0);
    });

    test("should initialize bpm as empty array", () => {
        expect(singer.bpm).toEqual([]);
    });

    test("should initialize turtleTime to 0", () => {
        expect(singer.turtleTime).toBe(0);
    });

    test("should initialize previousTurtleTime to 0", () => {
        expect(singer.previousTurtleTime).toBe(0);
    });
});

describe("State initialization — BPM and tempo", () => {
    let singer;

    beforeEach(() => {
        const turtleMock = createTurtleMock();
        singer = new Singer(turtleMock);
    });

    test("should initialize duplicateFactor to 1", () => {
        expect(singer.duplicateFactor).toBe(1);
    });

    test("should initialize skipFactor to 1", () => {
        expect(singer.skipFactor).toBe(1);
    });

    test("should initialize skipIndex to 0", () => {
        expect(singer.skipIndex).toBe(0);
    });

    test("should initialize dispatchFactor to 1", () => {
        expect(singer.dispatchFactor).toBe(1);
    });

    test("should initialize drift to 0", () => {
        expect(singer.drift).toBe(0);
    });

    test("should initialize maxLagCorrectionRatio to 0.25", () => {
        expect(singer.maxLagCorrectionRatio).toBe(0.25);
    });
});

describe("State initialization — musical properties", () => {
    let singer;

    beforeEach(() => {
        const turtleMock = createTurtleMock();
        singer = new Singer(turtleMock);
    });

    test("should initialize keySignature to 'C major'", () => {
        expect(singer.keySignature).toBe("C major");
    });

    test("should initialize movable to false (fixed solfege)", () => {
        expect(singer.movable).toBe(false);
    });

    test("should initialize notesPlayed to [0, 1]", () => {
        expect(singer.notesPlayed).toEqual([0, 1]);
    });

    test("should initialize whichNoteToCount to 1", () => {
        expect(singer.whichNoteToCount).toBe(1);
    });

    test("should initialize tallyNotes to 0", () => {
        expect(singer.tallyNotes).toBe(0);
    });

    test("should initialize tie to false", () => {
        expect(singer.tie).toBe(false);
    });

    test("should initialize swingCarryOver to 0", () => {
        expect(singer.swingCarryOver).toBe(0);
    });

    test("should initialize tieCarryOver to 0", () => {
        expect(singer.tieCarryOver).toBe(0);
    });

    test("should initialize glideOverride to 0", () => {
        expect(singer.glideOverride).toBe(0);
    });

    test("should initialize multipleVoices to false", () => {
        expect(singer.multipleVoices).toBe(false);
    });

    test("should initialize inverted to false", () => {
        expect(singer.inverted).toBe(false);
    });

    test("should initialize defaultStrongBeats to false", () => {
        expect(singer.defaultStrongBeats).toBe(false);
    });
});

describe("State initialization — empty arrays and objects", () => {
    let singer;

    beforeEach(() => {
        const turtleMock = createTurtleMock();
        singer = new Singer(turtleMock);
    });

    test("should initialize inNoteBlock as empty array", () => {
        expect(singer.inNoteBlock).toEqual([]);
    });

    test("should initialize instrumentNames as empty array", () => {
        expect(singer.instrumentNames).toEqual([]);
    });

    test("should initialize intervals as empty array", () => {
        expect(singer.intervals).toEqual([]);
    });

    test("should initialize semitoneIntervals as empty array", () => {
        expect(singer.semitoneIntervals).toEqual([]);
    });

    test("should initialize staccato as empty array", () => {
        expect(singer.staccato).toEqual([]);
    });

    test("should initialize glide as empty array", () => {
        expect(singer.glide).toEqual([]);
    });

    test("should initialize swing as empty array", () => {
        expect(singer.swing).toEqual([]);
    });

    test("should initialize voices as empty array", () => {
        expect(singer.voices).toEqual([]);
    });

    test("should initialize backward as empty array", () => {
        expect(singer.backward).toEqual([]);
    });

    test("should initialize invertList as empty array", () => {
        expect(singer.invertList).toEqual([]);
    });

    test("should initialize beatList as empty array", () => {
        expect(singer.beatList).toEqual([]);
    });

    test("should initialize factorList as empty array", () => {
        expect(singer.factorList).toEqual([]);
    });

    test("should initialize oscList as empty object", () => {
        expect(singer.oscList).toEqual({});
    });

    test("should initialize pitchDrumTable as empty object", () => {
        expect(singer.pitchDrumTable).toEqual({});
    });

    test("should initialize synthVolume as empty object", () => {
        expect(singer.synthVolume).toEqual({});
    });
});

describe("State initialization — fill and mode flags", () => {
    let singer;

    beforeEach(() => {
        const turtleMock = createTurtleMock();
        singer = new Singer(turtleMock);
    });

    test("should initialize pushedNote to false", () => {
        expect(singer.pushedNote).toBe(false);
    });

    test("should initialize inDuplicate to false", () => {
        expect(singer.inDuplicate).toBe(false);
    });

    test("should initialize inDefineMode to false", () => {
        expect(singer.inDefineMode).toBe(false);
    });

    test("should initialize suppressOutput to false", () => {
        expect(singer.suppressOutput).toBe(false);
    });
});

describe("State initialization — effects parameters", () => {
    let singer;

    beforeEach(() => {
        const turtleMock = createTurtleMock();
        singer = new Singer(turtleMock);
    });

    test("should initialize vibratoIntensity as empty array", () => {
        expect(singer.vibratoIntensity).toEqual([]);
    });

    test("should initialize vibratoRate as empty array", () => {
        expect(singer.vibratoRate).toEqual([]);
    });

    test("should initialize distortionAmount as empty array", () => {
        expect(singer.distortionAmount).toEqual([]);
    });

    test("should initialize tremoloFrequency as empty array", () => {
        expect(singer.tremoloFrequency).toEqual([]);
    });

    test("should initialize tremoloDepth as empty array", () => {
        expect(singer.tremoloDepth).toEqual([]);
    });

    test("should initialize panner to null", () => {
        expect(singer.panner).toBeNull();
    });
});

describe("State initialization — crescendo", () => {
    let singer;

    beforeEach(() => {
        const turtleMock = createTurtleMock();
        singer = new Singer(turtleMock);
    });

    test("should initialize inCrescendo as empty array", () => {
        expect(singer.inCrescendo).toEqual([]);
    });

    test("should initialize crescendoDelta as empty array", () => {
        expect(singer.crescendoDelta).toEqual([]);
    });

    test("should initialize crescendoInitialVolume with DEFAULTVOICE at DEFAULTVOLUME", () => {
        expect(singer.crescendoInitialVolume).toEqual({
            DEFAULTVOICE: [100]
        });
    });
});

describe("inNoteBlock behavior", () => {
    let singer;

    beforeEach(() => {
        const turtleMock = createTurtleMock();
        singer = new Singer(turtleMock);
    });

    test("should start with empty inNoteBlock array", () => {
        expect(singer.inNoteBlock).toEqual([]);
        expect(singer.inNoteBlock.length).toBe(0);
    });

    test("should be able to push note block IDs", () => {
        singer.inNoteBlock.push(1);
        expect(singer.inNoteBlock.length).toBe(1);
        expect(singer.inNoteBlock[0]).toBe(1);
    });

    test("should track multiple nested note blocks", () => {
        singer.inNoteBlock.push(1);
        singer.inNoteBlock.push(2);
        expect(singer.inNoteBlock.length).toBe(2);
    });

    test("should be able to pop note block IDs", () => {
        singer.inNoteBlock.push(1);
        singer.inNoteBlock.push(2);
        singer.inNoteBlock.pop();
        expect(singer.inNoteBlock.length).toBe(1);
        expect(singer.inNoteBlock[0]).toBe(1);
    });

    test("should report not in note block when array is empty", () => {
        expect(singer.inNoteBlock.length).toBe(0);
    });

    test("should report in note block when array has entries", () => {
        singer.inNoteBlock.push(5);
        expect(singer.inNoteBlock.length).toBeGreaterThan(0);
    });
});

describe("setMasterVolume edge cases", () => {
    let turtleMock;
    let activityMock;
    let logoMock;

    beforeEach(() => {
        turtleMock = createTurtleMock();
        turtleMock.singer = new Singer(turtleMock);
        activityMock = createActivityMock(turtleMock);
        logoMock = createLogoMock(activityMock);
    });

    test("should clamp volume to 0 when negative", () => {
        Singer.setMasterVolume(logoMock, -10);
        expect(logoMock.synth.setMasterVolume).toHaveBeenCalledWith(0);
    });

    test("should clamp volume to 100 when above 100", () => {
        Singer.setMasterVolume(logoMock, 150);
        expect(logoMock.synth.setMasterVolume).toHaveBeenCalledWith(100);
    });

    test("should pass volume as-is when within range", () => {
        Singer.setMasterVolume(logoMock, 50);
        expect(logoMock.synth.setMasterVolume).toHaveBeenCalledWith(50);
    });

    test("should handle volume of exactly 0", () => {
        Singer.setMasterVolume(logoMock, 0);
        expect(logoMock.synth.setMasterVolume).toHaveBeenCalledWith(0);
    });

    test("should handle volume of exactly 100", () => {
        Singer.setMasterVolume(logoMock, 100);
        expect(logoMock.synth.setMasterVolume).toHaveBeenCalledWith(100);
    });

    test("should push volume to all turtle synthVolumes", () => {
        // setMasterVolume iterates over existing keys in synthVolume
        turtleMock.singer.synthVolume = { DEFAULTVOICE: [100] };
        Singer.setMasterVolume(logoMock, 75);
        expect(turtleMock.singer.synthVolume.DEFAULTVOICE).toContain(75);
    });
});

describe("setSynthVolume edge cases", () => {
    let turtleMock;
    let logoMock;

    beforeEach(() => {
        turtleMock = createTurtleMock();
        turtleMock.singer = new Singer(turtleMock);
        const activityMock = createActivityMock(turtleMock);
        logoMock = createLogoMock(activityMock);
    });

    test("should divide noise1 volume by 25", () => {
        Singer.setSynthVolume(logoMock, turtleMock, "noise1", 100, "blk");
        expect(logoMock.synth.setVolume).toHaveBeenCalledWith(turtleMock, "noise1", 4, "blk");
    });

    test("should divide noise2 volume by 25", () => {
        Singer.setSynthVolume(logoMock, turtleMock, "noise2", 50, "blk");
        expect(logoMock.synth.setVolume).toHaveBeenCalledWith(turtleMock, "noise2", 2, "blk");
    });

    test("should divide noise3 volume by 25", () => {
        Singer.setSynthVolume(logoMock, turtleMock, "noise3", 75, "blk");
        expect(logoMock.synth.setVolume).toHaveBeenCalledWith(turtleMock, "noise3", 3, "blk");
    });

    test("should pass full volume for non-noise synths", () => {
        Singer.setSynthVolume(logoMock, turtleMock, "piano", 80, "blk");
        expect(logoMock.synth.setVolume).toHaveBeenCalledWith(turtleMock, "piano", 80, "blk");
    });

    test("should clamp negative volume to 0", () => {
        Singer.setSynthVolume(logoMock, turtleMock, "piano", -20, "blk");
        expect(logoMock.synth.setVolume).toHaveBeenCalledWith(turtleMock, "piano", 0, "blk");
    });

    test("should clamp volume above 100 to 100", () => {
        Singer.setSynthVolume(logoMock, turtleMock, "piano", 200, "blk");
        expect(logoMock.synth.setVolume).toHaveBeenCalledWith(turtleMock, "piano", 100, "blk");
    });
});

describe("Musical state mutability", () => {
    let singer;

    beforeEach(() => {
        const turtleMock = createTurtleMock();
        singer = new Singer(turtleMock);
    });

    test("should allow updating keySignature", () => {
        singer.keySignature = "G major";
        expect(singer.keySignature).toBe("G major");
    });

    test("should allow updating beatsPerMeasure", () => {
        singer.beatsPerMeasure = 3;
        expect(singer.beatsPerMeasure).toBe(3);
    });

    test("should allow updating noteValuePerBeat", () => {
        singer.noteValuePerBeat = 8;
        expect(singer.noteValuePerBeat).toBe(8);
    });

    test("should allow updating currentBeat", () => {
        singer.currentBeat = 2;
        expect(singer.currentBeat).toBe(2);
    });

    test("should allow updating currentMeasure", () => {
        singer.currentMeasure = 5;
        expect(singer.currentMeasure).toBe(5);
    });

    test("should allow toggling tie", () => {
        singer.tie = true;
        expect(singer.tie).toBe(true);
        singer.tie = false;
        expect(singer.tie).toBe(false);
    });

    test("should allow updating register", () => {
        singer.register = 2;
        expect(singer.register).toBe(2);
    });

    test("should allow pushing to bpm array", () => {
        singer.bpm.push(120);
        expect(singer.bpm).toEqual([120]);
        singer.bpm.push(90);
        expect(singer.bpm).toEqual([120, 90]);
    });

    test("should allow pushing instruments", () => {
        singer.instrumentNames.push("piano");
        singer.instrumentNames.push("violin");
        expect(singer.instrumentNames).toEqual(["piano", "violin"]);
    });

    test("should allow updating scalarTransposition", () => {
        singer.scalarTransposition = 3;
        expect(singer.scalarTransposition).toBe(3);
    });

    test("should allow updating transposition", () => {
        singer.transposition = -2;
        expect(singer.transposition).toBe(-2);
    });

    test("should allow updating duplicateFactor", () => {
        singer.duplicateFactor = 3;
        expect(singer.duplicateFactor).toBe(3);
    });
});
