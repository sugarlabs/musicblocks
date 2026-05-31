// Mock HTMLCanvasElement.getContext to suppress jsdom warnings

const mockContext = {
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    closePath: jest.fn(),
    ellipse: jest.fn(),
    arc: jest.fn(),
    drawImage: jest.fn(),
    measureText: jest.fn(() => ({
        width: 0,
        actualBoundingBoxAscent: 0,
        actualBoundingBoxDescent: 0
    })),
    scale: jest.fn(),
    setTransform: jest.fn(),
    save: jest.fn(),
    restore: jest.fn()
};

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    writable: true,
    value: jest.fn(type => {
        // Return null for non-2d contexts
        if (type !== "2d") return null;

        return mockContext;
    })
});

// Global mocks for safe localStorage helpers defined in js/utils/utils.js
global.safeStorageGet = jest.fn((key, fallback) => {
    if (typeof global.localStorage !== "undefined" && global.localStorage !== null) {
        const val = global.localStorage.getItem
            ? global.localStorage.getItem(key)
            : global.localStorage[key];
        if (val !== undefined && val !== null) return val;
    }
    return fallback;
});
global.safeStorageSet = jest.fn((key, value) => {
    if (typeof global.localStorage !== "undefined" && global.localStorage !== null) {
        if (global.localStorage.setItem) {
            global.localStorage.setItem(key, value);
        } else {
            global.localStorage[key] = value;
        }
    }
});
