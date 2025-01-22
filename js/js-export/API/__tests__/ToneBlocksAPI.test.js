const JSInterface = {
    validateArgs: jest.fn(),
};
global.JSInterface = JSInterface;
const ToneBlocksAPI = require('../ToneBlocksAPI');
global.MusicBlocks = { BLK: 'mockBlock' };

describe('ToneBlocksAPI', () => {
    let toneBlocksAPI;

    beforeEach(() => {
        toneBlocksAPI = new ToneBlocksAPI();
        toneBlocksAPI.turIndex = 1; 
        toneBlocksAPI.ENDFLOWCOMMAND = 'end';
        toneBlocksAPI.runCommand = jest.fn(); 
    });

    test('setInstrument calls runCommand with validated arguments', async () => {
        const mockFlow = jest.fn();
        JSInterface.validateArgs.mockReturnValue(['piano', mockFlow]);

        const result = await toneBlocksAPI.setInstrument('piano', mockFlow);

        expect(JSInterface.validateArgs).toHaveBeenCalledWith('setInstrument', ['piano', mockFlow]);
        expect(toneBlocksAPI.runCommand).toHaveBeenCalledWith('setTimbre', ['piano', toneBlocksAPI.turIndex]);
        expect(mockFlow).toHaveBeenCalled();
        expect(result).toBe(toneBlocksAPI.ENDFLOWCOMMAND);
    });

    test('doVibrato calls runCommand with validated arguments', async () => {
        const mockFlow = jest.fn();
        JSInterface.validateArgs.mockReturnValue([0.5, 2, mockFlow]);

        const result = await toneBlocksAPI.doVibrato(0.5, 2, mockFlow);

        expect(JSInterface.validateArgs).toHaveBeenCalledWith('doVibrato', [0.5, 2, mockFlow]);
        expect(toneBlocksAPI.runCommand).toHaveBeenCalledWith('doVibrato', [0.5, 2, toneBlocksAPI.turIndex]);
        expect(mockFlow).toHaveBeenCalled();
        expect(result).toBe(toneBlocksAPI.ENDFLOWCOMMAND);
    });

    test('doChorus calls runCommand with validated arguments', async () => {
        const mockFlow = jest.fn();
        JSInterface.validateArgs.mockReturnValue([1.2, 0.3, 0.7, mockFlow]);

        const result = await toneBlocksAPI.doChorus(1.2, 0.3, 0.7, mockFlow);

        expect(JSInterface.validateArgs).toHaveBeenCalledWith('doChorus', [1.2, 0.3, 0.7, mockFlow]);
        expect(toneBlocksAPI.runCommand).toHaveBeenCalledWith('doChorus', [1.2, 0.3, 0.7, toneBlocksAPI.turIndex]);
        expect(mockFlow).toHaveBeenCalled();
        expect(result).toBe(toneBlocksAPI.ENDFLOWCOMMAND);
    });

    test('doPhaser calls runCommand with validated arguments', async () => {
        const mockFlow = jest.fn();
        JSInterface.validateArgs.mockReturnValue([0.8, 2, 440, mockFlow]);

        const result = await toneBlocksAPI.doPhaser(0.8, 2, 440, mockFlow);

        expect(JSInterface.validateArgs).toHaveBeenCalledWith('doPhaser', [0.8, 2, 440, mockFlow]);
        expect(toneBlocksAPI.runCommand).toHaveBeenCalledWith('doPhaser', [0.8, 2, 440, toneBlocksAPI.turIndex]);
        expect(mockFlow).toHaveBeenCalled();
        expect(result).toBe(toneBlocksAPI.ENDFLOWCOMMAND);
    });

    test('doTremolo calls runCommand with validated arguments', async () => {
        const mockFlow = jest.fn();
        JSInterface.validateArgs.mockReturnValue([4, 0.5, mockFlow]);

        const result = await toneBlocksAPI.doTremolo(4, 0.5, mockFlow);

        expect(JSInterface.validateArgs).toHaveBeenCalledWith('doTremolo', [4, 0.5, mockFlow]);
        expect(toneBlocksAPI.runCommand).toHaveBeenCalledWith('doTremolo', [4, 0.5, toneBlocksAPI.turIndex]);
        expect(mockFlow).toHaveBeenCalled();
        expect(result).toBe(toneBlocksAPI.ENDFLOWCOMMAND);
    });

    test('doDistortion calls runCommand with validated arguments', async () => {
        const mockFlow = jest.fn();
        JSInterface.validateArgs.mockReturnValue([0.8, mockFlow]);

        const result = await toneBlocksAPI.doDistortion(0.8, mockFlow);

        expect(JSInterface.validateArgs).toHaveBeenCalledWith('doDistortion', [0.8, mockFlow]);
        expect(toneBlocksAPI.runCommand).toHaveBeenCalledWith('doDistortion', [0.8, toneBlocksAPI.turIndex]);
        expect(mockFlow).toHaveBeenCalled();
        expect(result).toBe(toneBlocksAPI.ENDFLOWCOMMAND);
    });

    test('doHarmonic calls runCommand with validated arguments', async () => {
        const mockFlow = jest.fn();
        JSInterface.validateArgs.mockReturnValue([3, mockFlow]);

        const result = await toneBlocksAPI.doHarmonic(3, mockFlow);

        expect(JSInterface.validateArgs).toHaveBeenCalledWith('doHarmonic', [3, mockFlow]);
        expect(toneBlocksAPI.runCommand).toHaveBeenCalledWith('doHarmonic', [3, toneBlocksAPI.turIndex, MusicBlocks.BLK]);
        expect(mockFlow).toHaveBeenCalled();
        expect(result).toBe(toneBlocksAPI.ENDFLOWCOMMAND);
    });
});
