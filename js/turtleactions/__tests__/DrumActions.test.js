const setupDrumActions = require('../DrumActions');

describe('setupDrumActions', () => {
    let activity;
    let turtle;
    let targetTurtle;

    beforeAll(() => {
        global.Singer = {
            DrumActions: {},
            processNote: jest.fn(),
        };
        global.DEFAULTDRUM = 'defaultDrum';
        global.DRUMNAMES = { drum1: ['d1', 'drum1'], drum2: ['d2', 'drum2'] };
        global.NOISENAMES = { noise1: ['n1', 'noise1'] };
        global.DEFAULTVOLUME = 100;
        global.last = jest.fn(array => array[array.length - 1]);
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
                setDispatchBlock: jest.fn(),
                setTurtleListener: jest.fn(),
                clearNoteParams: jest.fn(),
                inRhythmRuler: false,
                rhythmRuler: { Drums: [], Rulers: [] },
            },
            errorMsg: jest.fn(),
        };

        targetTurtle = {
            singer: {
                drumStyle: [],
                inNoteBlock: [],
                noteDrums: {},
                synthVolume: {},
                crescendoInitialVolume: {},
                noteBeatValues: {},
                beatFactor: 1,
                pushedNote: false,
            },
        };

        activity.turtles.ithTurtle.mockReturnValue(targetTurtle);
        setupDrumActions(activity);
    });

    it('should return the correct drum name', () => {
        const result = Singer.DrumActions.GetDrumname('d1');
        expect(result).toBe('drum1');

        const result2 = Singer.DrumActions.GetDrumname('unknown');
        expect(result2).toBe(DEFAULTDRUM);
    });

    it('should play a standalone drum sound', () => {
        if (!targetTurtle.singer.noteDrums[1]) targetTurtle.singer.noteDrums[1] = [];
        Singer.DrumActions.playDrum('d1', 0, 1);
        expect(Singer.processNote).toHaveBeenCalledWith(
            activity,
            expect.any(Number), 
            false, 
            expect.anything(), 
            0, 
            expect.any(Function) 
        );
        expect(activity.logo.clearNoteParams).toHaveBeenCalledWith(targetTurtle, 1, []);
        expect(targetTurtle.singer.inNoteBlock).toContain(1);
        expect(targetTurtle.singer.noteDrums[1]).toContain('drum1');
        expect(targetTurtle.singer.pushedNote).toBe(true);
    });
    

    it('should add a drum to an existing note block', () => {
        targetTurtle.singer.inNoteBlock.push(2);
        targetTurtle.singer.noteDrums[2] = [];
        Singer.DrumActions.playDrum('d1', 0, 1);
        expect(targetTurtle.singer.noteDrums[2]).toContain('drum1');
    });

    it('should set the drum style and add a listener', () => {
        Singer.DrumActions.setDrum('d1', 0, 1);
        expect(targetTurtle.singer.drumStyle).toContain('drum1');
        expect(activity.logo.setDispatchBlock).toHaveBeenCalledWith(1, 0, '_setdrum_0');
        expect(activity.logo.setTurtleListener).toHaveBeenCalledWith(0, '_setdrum_0', expect.any(Function));
    });

    it('should map pitch to drum', () => {
        Singer.DrumActions.mapPitchToDrum('d1', 0, 1);
        expect(targetTurtle.singer.drumStyle).toContain('drum1');
        expect(activity.logo.setDispatchBlock).toHaveBeenCalledWith(1, 0, '_mapdrum_0');
        expect(activity.logo.setTurtleListener).toHaveBeenCalledWith(0, '_mapdrum_0', expect.any(Function));
    });

    it('should play noise in a note block', () => {
        targetTurtle.singer.inNoteBlock.push(2);
        targetTurtle.singer.noteDrums[2] = [];
        targetTurtle.singer.noteBeatValues[2] = [];
        Singer.DrumActions.playNoise('n1', 0, 1);
        expect(targetTurtle.singer.noteDrums[2]).toContain('noise1');
        expect(targetTurtle.singer.noteBeatValues[2]).toContain(1);
        expect(targetTurtle.singer.pushedNote).toBe(true);
    });

    it('should throw an error for standalone noise block', () => {
        Singer.DrumActions.playNoise('n1', 0, 1);
        expect(activity.errorMsg).toHaveBeenCalledWith('Noise Block: Did you mean to use a Note block?', 1);
    });
});
