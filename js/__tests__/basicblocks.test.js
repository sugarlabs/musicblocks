const { initBasicProtoBlocks, BACKWARDCOMPATIBILIYDICT } = require('../basicblocks');

const mockActivity = {
    blocks: {
        palettes: {},
        protoBlockDict: {
            block1: { palette: { add: jest.fn() } },
            block2: { palette: { add: jest.fn() } },
            blockWithoutPalette: {}
        }
    },
    palettes: {},
};

const setupFunctions = [
    'setupRhythmBlockPaletteBlocks', 'setupRhythmBlocks', 'setupMeterBlocks',
    'setupPitchBlocks', 'setupIntervalsBlocks', 'setupToneBlocks',
    'setupOrnamentBlocks', 'setupVolumeBlocks', 'setupDrumBlocks',
    'setupWidgetBlocks', 'setupFlowBlocks', 'setupNumberBlocks',
    'setupActionBlocks', 'setupBoxesBlocks', 'setupBooleanBlocks',
    'setupHeapBlocks', 'setupDictBlocks', 'setupExtrasBlocks',
    'setupProgramBlocks', 'setupGraphicsBlocks', 'setupPenBlocks',
    'setupMediaBlocks', 'setupSensorsBlocks', 'setupEnsembleBlocks'
];

setupFunctions.forEach(fnName => {
    global[fnName] = jest.fn();
});

describe('initBasicProtoBlocks', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should assign palettes to activity.blocks.palettes', () => {
        initBasicProtoBlocks(mockActivity);
        expect(mockActivity.blocks.palettes).toBe(mockActivity.palettes);
    });

    it('should call all setup functions with activity', () => {
        initBasicProtoBlocks(mockActivity);
        setupFunctions.forEach(fnName => {
            expect(global[fnName]).toHaveBeenCalledWith(mockActivity);
        });
    });

    it('should add blocks with palettes to their respective palettes', () => {
        initBasicProtoBlocks(mockActivity);

        expect(mockActivity.blocks.protoBlockDict.block1.palette.add).toHaveBeenCalledWith(
            mockActivity.blocks.protoBlockDict.block1
        );
        expect(mockActivity.blocks.protoBlockDict.block2.palette.add).toHaveBeenCalledWith(
            mockActivity.blocks.protoBlockDict.block2
        );
        expect(mockActivity.blocks.protoBlockDict.blockWithoutPalette.palette).toBeUndefined();
    });
});

describe('BACKWARDCOMPATIBILIYDICT', () => {
    it('should be defined and not empty', () => {
        expect(BACKWARDCOMPATIBILIYDICT).toBeDefined();
        expect(Object.keys(BACKWARDCOMPATIBILIYDICT).length).toBeGreaterThan(0);
    });

    it('should correctly map old block names to new block names', () => {
        expect(BACKWARDCOMPATIBILIYDICT.fullscreen).toBe('vspace');
        expect(BACKWARDCOMPATIBILIYDICT.seth).toBe('setheading');
        expect(BACKWARDCOMPATIBILIYDICT.random2).toBe('random');
    });
});
