
const JSInterface = {
    validateArgs: jest.fn(),
};
global.JSInterface = JSInterface;
const MeterBlocksAPI = require('../MeterBlocksAPI');
const Singer = { MeterActions: { getNotesPlayed: jest.fn() } };
global.Singer = Singer;

describe('MeterBlocksAPI', () => {
    let meterBlocksAPI;

    beforeEach(() => {
        meterBlocksAPI = new MeterBlocksAPI();
        meterBlocksAPI.turIndex = 1;
        meterBlocksAPI.ENDFLOWCOMMAND = 'end';
        meterBlocksAPI.runCommand = jest.fn();
    });

    test('setMeter calls runCommand with validated arguments', () => {
        JSInterface.validateArgs.mockReturnValue([4, 4]);
        meterBlocksAPI.setMeter(4, 4);
        expect(JSInterface.validateArgs).toHaveBeenCalledWith('setMeter', [4, 4]);
        expect(meterBlocksAPI.runCommand).toHaveBeenCalledWith('setMeter', [4, 4, 1]);
    });

    test('setBPM calls runCommand with validated arguments', () => {
        JSInterface.validateArgs.mockReturnValue([120, 4]);
        meterBlocksAPI.setBPM(120, 4);
        expect(JSInterface.validateArgs).toHaveBeenCalledWith('setBPM', [120, 4]);
        expect(meterBlocksAPI.runCommand).toHaveBeenCalledWith('setBPM', [120, 4, 1]);
    });

    test('setMasterBPM calls runCommand with validated arguments', () => {
        JSInterface.validateArgs.mockReturnValue([100, 4]);
        meterBlocksAPI.setMasterBPM(100, 4);
        expect(JSInterface.validateArgs).toHaveBeenCalledWith('setMasterBPM', [100, 4]);
        expect(meterBlocksAPI.runCommand).toHaveBeenCalledWith('setMasterBPM', [100, 4]);
    });

    test('onEveryNoteDo calls runCommand with validated arguments', () => {
        const action = jest.fn();
        JSInterface.validateArgs.mockReturnValue([action]);
        meterBlocksAPI.onEveryNoteDo(action);
        expect(JSInterface.validateArgs).toHaveBeenCalledWith('onEveryNoteDo', [action]);
        expect(meterBlocksAPI.runCommand).toHaveBeenCalledWith('onEveryNoteDo', [action, null, null, 1]);
    });

    test('onEveryBeatDo calls runCommand with validated arguments', () => {
        const action = jest.fn();
        JSInterface.validateArgs.mockReturnValue([action]);
        meterBlocksAPI.onEveryBeatDo(action);
        expect(JSInterface.validateArgs).toHaveBeenCalledWith('onEveryBeatDo', [action]);
        expect(meterBlocksAPI.runCommand).toHaveBeenCalledWith('onEveryBeatDo', [action, null, null, 1]);
    });

    test('onStrongBeatDo calls runCommand with validated arguments', () => {
        const action = jest.fn();
        JSInterface.validateArgs.mockReturnValue([2, action]);
        meterBlocksAPI.onStrongBeatDo(2, action);
        expect(JSInterface.validateArgs).toHaveBeenCalledWith('onStrongBeatDo', [2, action]);
        expect(meterBlocksAPI.runCommand).toHaveBeenCalledWith('onStrongBeatDo', [2, action, null, null, 1]);
    });

    test('onWeakBeatDo calls runCommand with validated arguments', () => {
        const action = jest.fn();
        JSInterface.validateArgs.mockReturnValue([action]);
        meterBlocksAPI.onWeakBeatDo(action);
        expect(JSInterface.validateArgs).toHaveBeenCalledWith('onWeakBeatDo', [action]);
        expect(meterBlocksAPI.runCommand).toHaveBeenCalledWith('onWeakBeatDo', [action, null, null, 1]);
    });

    test('setNoClock calls runCommand and awaits flow', async () => {
        const flow = jest.fn();
        JSInterface.validateArgs.mockReturnValue([flow]);
        await meterBlocksAPI.setNoClock(flow);
        expect(JSInterface.validateArgs).toHaveBeenCalledWith('setNoClock', [flow]);
        expect(meterBlocksAPI.runCommand).toHaveBeenCalledWith('setNoClock', [1]);
        expect(flow).toHaveBeenCalled();
    });

    test('getNotesPlayed calls Singer.MeterActions.getNotesPlayed with validated arguments', () => {
        JSInterface.validateArgs.mockReturnValue([4]);
        meterBlocksAPI.getNotesPlayed(4);
        expect(JSInterface.validateArgs).toHaveBeenCalledWith('getNotesPlayed', [4]);
        expect(Singer.MeterActions.getNotesPlayed).toHaveBeenCalledWith(4, 1);
    });
});
