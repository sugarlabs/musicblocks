const JSInterface = {
    validateArgs: jest.fn(),
};
global.JSInterface = JSInterface;
const PenBlocksAPI = require('../PenBlocksAPI')
global.globalActivity = {
    turtles: {
        refreshCanvas: jest.fn(),
    },
    logo: {
        turtles: {
            setBackgroundColor: jest.fn(),
        },
    },
};

describe('PenBlocksAPI', () => {
    let penBlocksAPI;

    beforeEach(() => {
        penBlocksAPI = new PenBlocksAPI();
        penBlocksAPI.turIndex = 1; 
        penBlocksAPI.ENDFLOW = 'end'; 
        penBlocksAPI.runCommand = jest.fn(); 
    });

    test('setColor calls runCommand with validated arguments', () => {
        JSInterface.validateArgs.mockReturnValue([50]);
        penBlocksAPI.setColor(50);
        expect(JSInterface.validateArgs).toHaveBeenCalledWith('setColor', [50]);
        expect(penBlocksAPI.runCommand).toHaveBeenCalledWith('doSetColor', [50]);
    });

    test('setGrey calls runCommand with validated arguments', () => {
        JSInterface.validateArgs.mockReturnValue([30]);
        penBlocksAPI.setGrey(30);
        expect(JSInterface.validateArgs).toHaveBeenCalledWith('setGrey', [30]);
        expect(penBlocksAPI.runCommand).toHaveBeenCalledWith('doSetChroma', [30]);
    });

    test('setShade calls runCommand with validated arguments', () => {
        JSInterface.validateArgs.mockReturnValue([70]);
        penBlocksAPI.setShade(70);
        expect(JSInterface.validateArgs).toHaveBeenCalledWith('setShade', [70]);
        expect(penBlocksAPI.runCommand).toHaveBeenCalledWith('doSetValue', [70]);
    });

    test('setHue calls runCommand with validated arguments', () => {
        JSInterface.validateArgs.mockReturnValue([120]);
        penBlocksAPI.setHue(120);
        expect(JSInterface.validateArgs).toHaveBeenCalledWith('setHue', [120]);
        expect(penBlocksAPI.runCommand).toHaveBeenCalledWith('doSetHue', [120]);
    });

    test('setTranslucency calculates and calls runCommand with validated arguments', () => {
        JSInterface.validateArgs.mockReturnValue([80]);
        penBlocksAPI.setTranslucency(80);
        expect(JSInterface.validateArgs).toHaveBeenCalledWith('setTranslucency', [80]);
        expect(penBlocksAPI.runCommand).toHaveBeenCalledWith('doSetPenAlpha', [1.0 - 80 / 100]);
    });

    test('setPensize calls runCommand with validated arguments', () => {
        JSInterface.validateArgs.mockReturnValue([10]);
        penBlocksAPI.setPensize(10);
        expect(JSInterface.validateArgs).toHaveBeenCalledWith('setPensize', [10]);
        expect(penBlocksAPI.runCommand).toHaveBeenCalledWith('doSetPensize', [10]);
    });

    test('penUp calls runCommand', () => {
        penBlocksAPI.penUp();
        expect(penBlocksAPI.runCommand).toHaveBeenCalledWith('doPenUp');
    });

    test('penDown calls runCommand', () => {
        penBlocksAPI.penDown();
        expect(penBlocksAPI.runCommand).toHaveBeenCalledWith('doPenDown');
    });

    test('fillShape calls commands and refreshCanvas', async () => {
        const flow = jest.fn();
        await penBlocksAPI.fillShape(flow);
        expect(penBlocksAPI.runCommand).toHaveBeenCalledWith('doStartFill');
        expect(flow).toHaveBeenCalled();
        expect(penBlocksAPI.runCommand).toHaveBeenCalledWith('doEndFill');
        expect(global.globalActivity.turtles.refreshCanvas).toHaveBeenCalled();
    });

    test('hollowLine calls commands and refreshCanvas', async () => {
        const flow = jest.fn();
        await penBlocksAPI.hollowLine(flow);
        expect(penBlocksAPI.runCommand).toHaveBeenCalledWith('doStartHollowLine');
        expect(flow).toHaveBeenCalled();
        expect(penBlocksAPI.runCommand).toHaveBeenCalledWith('doEndHollowLine');
        expect(global.globalActivity.turtles.refreshCanvas).toHaveBeenCalled();
    });

    test('fillBackground calls setBackgroundColor', () => {
        penBlocksAPI.fillBackground();
        expect(penBlocksAPI.runCommand).toHaveBeenCalledWith('_anonymous', expect.any(Function));
        const setBackgroundFunc = penBlocksAPI.runCommand.mock.calls[0][1];
        setBackgroundFunc();
        expect(global.globalActivity.logo.turtles.setBackgroundColor).toHaveBeenCalledWith(1);
    });

    test('setFont calls runCommand with validated arguments', () => {
        JSInterface.validateArgs.mockReturnValue(['Arial']);
        penBlocksAPI.setFont('Arial');
        expect(JSInterface.validateArgs).toHaveBeenCalledWith('setFont', ['Arial']);
        expect(penBlocksAPI.runCommand).toHaveBeenCalledWith('doSetFont', ['Arial']);
    });
});
