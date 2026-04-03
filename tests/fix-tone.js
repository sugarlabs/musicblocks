// tests/fix-tone.js - Mock JSInterface for Tone tests

// Mock JSInterface globally
global.JSInterface = {
    validateArgs: jest.fn().mockReturnValue(true),
    log: jest.fn()
};

console.log("✅ Tone test fixes applied");
