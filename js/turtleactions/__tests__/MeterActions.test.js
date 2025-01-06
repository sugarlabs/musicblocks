const setupMeterActions = require('../MeterActions');

describe('setupMeterActions', () => {
    let activity;
    let targetTurtle;

    beforeAll(() => {
        global.Singer = {
            MeterActions: {},
            RhythmActions: {
                getNoteValue: jest.fn(() => 1), 
            },
        };
        global.TONEBPM = 240;
        global.Queue = jest.fn((action, duration, blk) => ({ action, duration, blk }));
        global.last = jest.fn((array) => array[array.length - 1]);
        global._ = jest.fn((msg) => msg);
        global.rationalToFraction = jest.fn((value) => [value * 4, 4]); 
    });
    

    beforeEach(() => {
        activity = {
            turtles: {
                ithTurtle: jest.fn(),
                turtleList: [],
                addTurtle: jest.fn(),
            },
            blocks: {
                blockList: { 1: {} },
            },
            logo: {
                actions: {},
                setDispatchBlock: jest.fn(),
                setTurtleListener: jest.fn(),
                initTurtle: jest.fn(),
                prepSynths: jest.fn(),
                runFromBlockNow: jest.fn(),
                notation: {
                    notationMeter: jest.fn(),
                    notationPickup: jest.fn(),
                },
            },
            errorMsg: jest.fn(),
            stage: {
                dispatchEvent: jest.fn(),
            },
        };

        targetTurtle = {
            singer: {
                beatsPerMeasure: 0,
                noteValuePerBeat: 0,
                beatList: [],
                defaultStrongBeats: false,
                bpm: [],
                notesPlayed: [0, 1],
                pickup: 0,
                drift: 0,
            },
            queue: [],
            parentFlowQueue: [],
            unhighlightQueue: [],
            parameterQueue: [],
        };

        activity.turtles.ithTurtle.mockReturnValue(targetTurtle);

        setupMeterActions(activity);
    });

    it('should set the meter correctly', () => {
        Singer.MeterActions.setMeter(4, 4, 0);
        expect(targetTurtle.singer.beatsPerMeasure).toBe(4);
        expect(targetTurtle.singer.noteValuePerBeat).toBe(1 / 4);
        expect(activity.logo.notation.notationMeter).toHaveBeenCalledWith(0, 4, 1 / 4);
    });

    it('should set the pickup value correctly', () => {
        Singer.MeterActions.setPickup(2, 0);
        expect(targetTurtle.singer.pickup).toBe(2);
        expect(activity.logo.notation.notationPickup).toHaveBeenCalledWith(0, 2);
    });

    it('should set BPM within range', () => {
        Singer.MeterActions.setBPM(120, 0.25, 0, 1);
        expect(targetTurtle.singer.bpm).toContain(120);
    });

    it('should handle BPM below range', () => {
        Singer.MeterActions.setBPM(10, 0.25, 0, 1);
        expect(activity.errorMsg).toHaveBeenCalledWith('1/4 beats per minute must be greater than 30', 1);
        expect(targetTurtle.singer.bpm).toContain(30);
    });

    it('should set the master BPM correctly', () => {
        Singer.MeterActions.setMasterBPM(100, 0.25, 1);
        expect(Singer.masterBPM).toBe(100);
        expect(Singer.defaultBPMFactor).toBe(TONEBPM / 100);
    });

    it('should set a listener for every beat', () => {
        activity.turtles.turtleList = [{ companionTurtle: null }]; 
        activity.turtles.addTurtle = jest.fn();
        activity.logo.prepSynths = jest.fn();
        targetTurtle.id = 0; 
    
        Singer.MeterActions.onEveryBeatDo('testAction', false, null, 0, 1);
    
        expect(activity.turtles.addTurtle).toHaveBeenCalled();
        expect(activity.logo.setTurtleListener).toHaveBeenCalledWith(
            1,
            '__everybeat_1__',
            expect.any(Function)
        );
    });
    
    it('should set a listener for every note', () => {
        Singer.MeterActions.onEveryNoteDo('testAction', false, null, 0, 1);
        expect(activity.logo.setTurtleListener).toHaveBeenCalled();
    });

    it('should calculate the current meter correctly', () => {
        targetTurtle.singer.beatsPerMeasure = 4;
        targetTurtle.singer.noteValuePerBeat = 0.25;
        const meter = Singer.MeterActions.getCurrentMeter(0);
        expect(meter).toBe('4:0.25');
    });

    it('should calculate the BPM correctly', () => {
        targetTurtle.singer.bpm.push(120);
        const bpm = Singer.MeterActions.getBPM(0);
        expect(bpm).toBe(120);
    });

    it('should get the beat factor correctly', () => {
        targetTurtle.singer.noteValuePerBeat = 0.25;
        const factor = Singer.MeterActions.getBeatFactor(0);
        expect(factor).toBe(0.25);
    });

    it('should calculate whole notes played correctly', () => {
        targetTurtle.singer.notesPlayed = [4, 1];
        const wholeNotes = Singer.MeterActions.getWholeNotesPlayed(0);
        expect(wholeNotes).toBe(4);
    });
    
    it('should return the correct meter format', () => {
        targetTurtle.singer.beatsPerMeasure = 4;
        targetTurtle.singer.noteValuePerBeat = 1;
        
        const meter = Singer.MeterActions.getCurrentMeter(0);  
        expect(meter).toBe('4:1');  
    });   
});
