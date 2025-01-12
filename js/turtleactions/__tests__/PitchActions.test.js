const setupPitchActions = require('../PitchActions');

describe('setupPitchActions', () => {
    let activity;
    let turtle;
    let targetTurtle;

    beforeAll(() => {
        global.Singer = {
            PitchActions: {},
            processPitch: jest.fn(),
            addScalarTransposition: jest.fn(() => ['C', 4]),
        };
        global.keySignatureToMode = jest.fn(() => ['C', 'major']); 
        global.isCustomTemperament = jest.fn(() => false); 
        global.ACCIDENTALNAMES = ['sharp', 'flat'];
        global.ACCIDENTALVALUES = [1, -1];
        global.NANERRORMSG = 'Not a number error';
        global.NOTESFLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
        global.NOTESSHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        global.NOTESTEP = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
        global.MUSICALMODES = {
            major: [2, 2, 1, 2, 2, 2, 1],
            minor: [2, 1, 2, 2, 1, 2, 2],
        };
        global.FLAT = 'b'; 
        global.SHARP = '#';
        global.nthDegreeToPitch = jest.fn(() => 'C');
        global.pitchToNumber = jest.fn(() => 0);
        global.getStepSizeUp = jest.fn(() => 2);
        global.getStepSizeDown = jest.fn(() => -2);
        global.getNote = jest.fn();
        global.calcOctave = jest.fn(() => 4);
        global.frequencyToPitch = jest.fn(() => ['C', 4, 0]);
        global.numberToPitch = jest.fn(() => ['C', 4]);
        global._ = jest.fn(msg => msg);
    });

    beforeEach(() => {
        activity = {
            turtles: {
                ithTurtle: jest.fn(),
            },
            blocks: {
                blockList: { 1: {} },
            },
            logo: {
                synth: {
                    inTemperament: 'equal',
                    startingPitch: 'C4',
                },
                setDispatchBlock: jest.fn(),
                setTurtleListener: jest.fn(),
            },
            errorMsg: jest.fn(),
        };

        targetTurtle = {
            singer: {
                justCounting: [],
                pitchNumberOffset: 0, 
                currentOctave: 4,
                lastNotePlayed: ['C4', 4],
                inNoteBlock: [],
                lastNotePlayed: null,
                pitchNumberOffset: 0,
                scalarTransposition: 0,
                transposition: 0,
                scalarTranspositionValues: [], 
                transpositionValues: [],
                invertList: [],
            },
        };

        activity.turtles.ithTurtle.mockReturnValue(targetTurtle);
        setupPitchActions(activity);
    });

    it('should play a pitch', () => {
        Singer.PitchActions.playPitch('C', 4, 0, 0, 1);
        expect(Singer.processPitch).toHaveBeenCalledWith(activity, 'C', 4, 0, 0, 1);
    });

    it('should step pitch correctly', () => {
        Singer.PitchActions.stepPitch(2, 0, 1);
        expect(global.Singer.addScalarTransposition).toHaveBeenCalledWith(
            activity.logo,
            0,
            'G',
            4,
            2
        );
    });

    it('should play nth modal pitch', () => {
        const mockTurtle = { singer: { keySignature: 'C major' } };
        activity.turtles.ithTurtle.mockReturnValue(mockTurtle);
    
        Singer.PitchActions.playNthModalPitch(3, 4, 0, 1);
    
        expect(global.keySignatureToMode).toHaveBeenCalledWith('C major');
        expect(global.nthDegreeToPitch).toHaveBeenCalledWith('C major', 3);
        expect(activity.errorMsg).not.toHaveBeenCalled();
    });
    
    
    it('should play pitch number', () => {
        Singer.PitchActions.playPitchNumber(5, 0, 1);
        expect(Singer.processPitch).toHaveBeenCalled();
    });

    it('should play hertz', () => {
        Singer.PitchActions.playHertz(440, 0, 1);
        expect(Singer.processPitch).toHaveBeenCalledWith(activity, 'C', 4, 0, 0, 1);
    });

    it('should set accidental', () => {
        Singer.PitchActions.setAccidental('sharp', 0, 1);
        expect(activity.logo.setDispatchBlock).toHaveBeenCalled();
        expect(activity.logo.setTurtleListener).toHaveBeenCalled();
    });

    it('should set scalar transpose', () => {
        Singer.PitchActions.setScalarTranspose(2, 0, 1);
        expect(activity.logo.setDispatchBlock).toHaveBeenCalled();
        expect(activity.logo.setTurtleListener).toHaveBeenCalled();
    });

    it('should set semitone transpose', () => {
        Singer.PitchActions.setSemitoneTranspose(2, 0, 1);
        expect(activity.logo.setDispatchBlock).toHaveBeenCalled();
        expect(activity.logo.setTurtleListener).toHaveBeenCalled();
    });

    it('should set register', () => {
        Singer.PitchActions.setRegister(5, 0);
        expect(targetTurtle.singer.register).toBe(5);
    });

    it('should invert notes correctly', () => {
        Singer.PitchActions.invert('C', 4, 'even', 0, 1);
        expect(targetTurtle.singer.invertList).toContainEqual(['C', 4, 'even']);
    });

    it('should calculate delta pitch correctly', () => {
        targetTurtle.singer.previousNotePlayed = ['C4'];
        targetTurtle.singer.lastNotePlayed = ['D4'];
        const delta = Singer.PitchActions.deltaPitch('deltapitch', 0);
        expect(delta).toBeDefined();
    });

    it('should return consonant step size', () => {
        const stepSize = Singer.PitchActions.consonantStepSize('up', 0);
        expect(stepSize).toBeDefined();
    });

    it('should set pitch number offset', () => {
        Singer.PitchActions.setPitchNumberOffset('C', 4, 0);
        expect(targetTurtle.singer.pitchNumberOffset).toBeDefined();
    });

    it('should convert number to pitch', () => {
        const pitch = Singer.PitchActions.numToPitch(3, 'pitch', 0);
        expect(pitch).toBe('C');
    });
});
