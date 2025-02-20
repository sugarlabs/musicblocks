const setupVolumeActions = require('../VolumeActions');

describe('setupVolumeActions', () => {
    let activity;
    let targetTurtle;

    beforeAll(() => {
        global.Singer = {
            VolumeActions: {},
            setSynthVolume: jest.fn(),
            setMasterVolume: jest.fn(),
            masterVolume: [],
        };
        global.instruments = {
            0: { synth1: { connect: jest.fn() } }, 
        };
        global.Tone = {
            Panner: jest.fn(() => ({
                toDestination: jest.fn(),
                pan: { value: 0 },
            })),
        }; 
        global.last = jest.fn(array => array[array.length - 1]);
        global._ = jest.fn(msg => msg);
        global.VOICENAMES = {};
        global.DRUMNAMES = {};
        global.DEFAULTVOLUME = 50;
        global.DEFAULTVOICE = 'default';
    });

    beforeEach(() => {
        activity = {
            turtles: {
                ithTurtle: jest.fn(),
                singer: {
                    synthVolume: { default: [DEFAULTVOLUME] }, 
                    crescendoInitialVolume: { default: [DEFAULTVOLUME] }, 
                    crescendoDelta: [],
                    inCrescendo: [],
                    instrumentNames: [],
                    suppressOutput: false,
                    justCounting: [],
                    panner: new Tone.Panner(),
                },
            },
            blocks: {
                blockList: { 1: {} },
            },
            logo: {
                setDispatchBlock: jest.fn(),
                setTurtleListener: jest.fn(),
                synth: {
                    loadSynth: jest.fn(),
                },
                notation: {
                    notationBeginArticulation: jest.fn(),
                    notationEndArticulation: jest.fn(),
                    notationEndCrescendo: jest.fn(),
                },
            },
            errorMsg: jest.fn(),
        };

        targetTurtle = {
            singer: {
                synthVolume: { default: [DEFAULTVOLUME] }, 
                crescendoInitialVolume: { default: [DEFAULTVOLUME] },
                synthVolume: {},
                crescendoDelta: [],
                crescendoInitialVolume: {},
                inCrescendo: [],
                instrumentNames: [],
                suppressOutput: false,
                justCounting: [],
                panner: new Tone.Panner(),
            },
        };

        activity.turtles.ithTurtle.mockReturnValue(targetTurtle);
        setupVolumeActions(activity);
    });

    it('should set master volume correctly', () => {
        Singer.VolumeActions.setMasterVolume(80, 0, 1);
        expect(Singer.masterVolume).toContain(80);
        expect(Singer.setMasterVolume).toHaveBeenCalledWith(activity.logo, 80);
    });

    it('should handle out-of-range master volume', () => {
        Singer.VolumeActions.setMasterVolume(120, 0, 1);
        expect(Singer.masterVolume).toContain(100);
        expect(activity.errorMsg).not.toHaveBeenCalled();

        Singer.VolumeActions.setMasterVolume(-10, 0, 1);
        expect(Singer.masterVolume).toContain(0);
        expect(activity.errorMsg).toHaveBeenCalledWith(_('Setting volume to 0.'), 1);
    });

    it('should set synth volume correctly', () => {
        targetTurtle.singer.synthVolume['default'] = [DEFAULTVOLUME];
        Singer.VolumeActions.setSynthVolume('default', 70, 0);

        expect(targetTurtle.singer.synthVolume['default']).toContain(70);
        expect(Singer.setSynthVolume).toHaveBeenCalledWith(activity.logo, 0, 'default', 70);
    });

    it('should apply crescendo correctly', () => {
        // Ensure initial values are correctly set
        targetTurtle.singer.synthVolume['default'] = [DEFAULTVOLUME];
        targetTurtle.singer.crescendoInitialVolume['default'] = [DEFAULTVOLUME];
    
        // Call the crescendo function
        Singer.VolumeActions.doCrescendo('crescendo', 10, 0, 1);
    
        // Assert the updates to synthVolume
        expect(targetTurtle.singer.synthVolume['default']).toHaveLength(2);
        expect(targetTurtle.singer.synthVolume['default'][1]).toBe(DEFAULTVOLUME);
    
        // Assert the updates to crescendoInitialVolume
        expect(targetTurtle.singer.crescendoInitialVolume['default']).toHaveLength(2);
        expect(targetTurtle.singer.crescendoInitialVolume['default'][1]).toBe(DEFAULTVOLUME);
    
        // Assert other properties
        expect(targetTurtle.singer.crescendoDelta).toContain(10);
        expect(activity.logo.setTurtleListener).toHaveBeenCalled();
    });
    
    
    it('should set panning correctly', () => {
        Singer.VolumeActions.setPanning(50, 0);
        expect(targetTurtle.singer.panner.pan.value).toBe(0.5); 
        expect(Tone.Panner).toHaveBeenCalled();
    });

    it('should retrieve the correct master volume', () => {
        Singer.masterVolume.push(60);

        expect(Singer.VolumeActions.masterVolume).toBe(60);
    });

    it('should retrieve the correct synth volume', () => {
        targetTurtle.singer.synthVolume['default'] = [DEFAULTVOLUME, 70];

        const volume = Singer.VolumeActions.getSynthVolume('default', 0);
        expect(volume).toBe(70);
    });
});
