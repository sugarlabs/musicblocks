const setupToneActions = require('../ToneActions');

describe('setupToneActions', () => {
    let activity;
    let targetTurtle;

    beforeAll(() => {
        global.Singer = {
            ToneActions: {},
        };
        global.instrumentsEffects = {
            0: {
                'default-voice': {
                    vibratoActive: false,
                    vibratoIntensity: [],
                    vibratoFrequency: 0,
                },
            },
        };
        global.VOICENAMES = {
            Piano: ['piano', 'grand-piano'],
            Violin: ['violin', 'acoustic-violin'],
        };
        global.CUSTOMSAMPLES = {};
        global.DEFAULTVOICE = 'default-voice';
        global.last = jest.fn(array => array[array.length - 1]);
        global._ = jest.fn(msg => msg); 
        global.instrumentsEffects = {};
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
                synth: {
                    loadSynth: jest.fn(),
                    createSynth: jest.fn(),
                },
                phraseMaker: {
                    _instrumentName: null,
                },
                notation: {
                    notationSwing: jest.fn(),
                    notationVoices: jest.fn(),
                    notationBeginHarmonics: jest.fn(), 
                    notationEndHarmonics: jest.fn(),
                },
                timbre: {
                    instrumentName: 'default-voice',
                    FMSynthParams: [],
                    AMSynthParams: [],
                    duoSynthParams: [],
                    osc: [], 
                    fmSynthParamvals: {},
                    amSynthParamvals: {},
                    duoSynthParamVals: {},
                    FMSynthesizer: [],
                    AMSynthesizer: [],
                    duoSynthesizer: [],
                    vibratoEffect: [],
                    vibratoParams: [], 
                },
                inTimbre: true, 
                stopTurtle: false,
            },
            errorMsg: jest.fn(),
        };

        targetTurtle = {
            singer: {
                instrumentNames: [],
                synthVolume: { 'default-voice': [1] },
                crescendoInitialVolume: { 'default-voice': [1] },
                vibratoIntensity: [],
                vibratoRate: [],
                chorusRate: [],
                delayTime: [],
                chorusDepth: [],
                rate: [],
                octaves: [],
                baseFrequency: [],
                tremoloFrequency: [],
                tremoloDepth: [],
                distortionAmount: [],
                inHarmonic: [],
                partials: [],
            },
        };

        global.instrumentsEffects = {
            0: {
                'default-voice': {
                    vibratoActive: false,
                    vibratoIntensity: [],
                    vibratoFrequency: [],
                },
            },
        };
        activity.turtles.ithTurtle.mockReturnValue(targetTurtle);
        setupToneActions(activity);
    });

    it('should set timbre correctly', () => {
        Singer.ToneActions.setTimbre('piano', 0, 1);
        expect(targetTurtle.singer.instrumentNames).toContain('grand-piano');
        expect(activity.logo.synth.loadSynth).toHaveBeenCalledWith(0, 'grand-piano');
    });

    it('should handle custom sample timbres correctly', () => {
        const customSample = ['custom1', 'sample1', 'sample2', 'sample3'];
        Singer.ToneActions.setTimbre(customSample, 0, 1);
        expect(global.CUSTOMSAMPLES['customsample_custom1']).toEqual(['sample1', 'sample2', 'sample3']);
        expect(targetTurtle.singer.instrumentNames).toContain('customsample_custom1');
    });

    it('should apply vibrato correctly', () => {
        const intensity = 50;
        const rate = 10;
        const blk = 1;
    
        Singer.ToneActions.doVibrato(intensity, rate, 0, blk);
    
        expect(targetTurtle.singer.vibratoIntensity).toContain(intensity / 100);
        expect(targetTurtle.singer.vibratoRate).toContain(1 / rate);
        expect(activity.logo.timbre.vibratoEffect).toContain(blk); // Ensure vibratoEffect is updated
        expect(activity.logo.timbre.vibratoParams).toContain(intensity); // Ensure vibratoParams is updated
        expect(global.instrumentsEffects[0]['default-voice'].vibratoActive).toBe(true); // Ensure vibratoActive is true
    });

    it('should show error for invalid vibrato intensity', () => {
        Singer.ToneActions.doVibrato(150, 5, 0, 1);
        expect(activity.errorMsg).toHaveBeenCalledWith('Vibrato intensity must be between 1 and 100.', 1);
        expect(activity.logo.stopTurtle).toBe(true);
    });

    it('should apply chorus effect correctly', () => {
        Singer.ToneActions.doChorus(1.5, 20, 50, 0, 1);
        expect(targetTurtle.singer.chorusRate).toContain(1.5);
        expect(targetTurtle.singer.delayTime).toContain(20);
        expect(targetTurtle.singer.chorusDepth).toContain(0.5);
    });

    it('should apply phaser effect correctly', () => {
        Singer.ToneActions.doPhaser(2, 3, 100, 0, 1);
        expect(targetTurtle.singer.rate).toContain(2);
        expect(targetTurtle.singer.octaves).toContain(3);
        expect(targetTurtle.singer.baseFrequency).toContain(100);
    });

    it('should apply tremolo effect correctly', () => {
        Singer.ToneActions.doTremolo(5, 50, 0, 1);
        expect(targetTurtle.singer.tremoloFrequency).toContain(5);
        expect(targetTurtle.singer.tremoloDepth).toContain(0.5);
    });

    it('should apply distortion effect correctly', () => {
        Singer.ToneActions.doDistortion(50, 0, 1);
        expect(targetTurtle.singer.distortionAmount).toContain(0.5);
    });
    
    it('should apply harmonic effect correctly', () => {
        const blk = 1;
        const harmonic = 2; // Adjust the harmonic to match the expected output
    
        Singer.ToneActions.doHarmonic(harmonic, 0, blk);
    
        expect(activity.logo.notation.notationBeginHarmonics).toHaveBeenCalledWith(0); // Verify the harmonics start
        expect(targetTurtle.singer.partials).toHaveLength(1);
        expect(targetTurtle.singer.partials[0]).toEqual([0, 0, 1]); // Ensure harmonics array matches expected output
    });
    
    
    

    it('should define FM synth correctly', () => {
        Singer.ToneActions.defFMSynth(10, 0, 1);
        expect(activity.logo.timbre.FMSynthParams).toContain(10);
    });

    it('should define AM synth correctly', () => {
        Singer.ToneActions.defAMSynth(5, 0, 1);
        expect(activity.logo.timbre.AMSynthParams).toContain(5);
    });

    it('should define Duo synth correctly', () => {
        Singer.ToneActions.defDuoSynth(10, 20, 0, 1);
        expect(activity.logo.timbre.duoSynthParams).toContain(10);
        expect(activity.logo.timbre.duoSynthParams).toContain(0.2);
    });
});
