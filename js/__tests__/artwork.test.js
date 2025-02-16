global._THIS_IS_TURTLE_BLOCKS_ = true;  
const { showMaterialHighlight, hideButtonHighlight, hidePaletteNameDisplay, COLLAPSEBUTTONXOFF, STANDARDBLOCKHEIGHT, FILLCOLORS, TURTLESVG } = require('../artwork');

global.createjs = {
    Shape: jest.fn(() => ({
        graphics: { f: jest.fn().mockReturnThis(), drawCircle: jest.fn().mockReturnThis() },
        alpha: 0,
        x: 0,
        y: 0
    })),
    Tween: {
        get: jest.fn(() => ({
            to: jest.fn().mockReturnThis()
        }))
    },
    Ease: { circInOut: jest.fn() }
};

describe('artwork.js Test Suite', () => {
    let mockStage;

    beforeEach(() => {
        mockStage = {
            addChild: jest.fn(),
            removeChild: jest.fn()
        };
    });

    test('showMaterialHighlight creates highlight and active shapes', () => {
        const event = { rawX: 100, rawY: 100 };
        const scale = 1;
        const result = showMaterialHighlight(50, 50, 10, event, scale, mockStage);
        expect(result).toHaveProperty('highlight');
        expect(result).toHaveProperty('active');
        expect(mockStage.addChild).toHaveBeenCalledWith(result.highlight, result.active);
    });

    test('hideButtonHighlight removes highlight properly', () => {
        jest.useFakeTimers();
        const circles = { highlight: {}, active: {} };
        hideButtonHighlight(circles, mockStage);
        jest.runAllTimers();
        expect(mockStage.removeChild).toBeCalledWith(circles.active, circles.highlight);
        jest.useRealTimers();
    });

    test('hidePaletteNameDisplay removes palette text after delay', () => {
        jest.useFakeTimers();
        const paletteText = {};
        hidePaletteNameDisplay(paletteText, mockStage);
        jest.runAllTimers();
        expect(mockStage.removeChild).toBeCalledWith(paletteText);
        jest.useRealTimers();
    });

    test('Constants are correctly defined', () => {
        expect(typeof COLLAPSEBUTTONXOFF).toBe('number');
        expect(typeof STANDARDBLOCKHEIGHT).toBe('number');
        expect(Array.isArray(FILLCOLORS)).toBe(true);
        expect(typeof TURTLESVG).toBe('string');
    });
});
