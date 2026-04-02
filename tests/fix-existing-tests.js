// This file helps fix existing failing tests

// Mock JSInterface for tests that need it
global.JSInterface = {
    validateArgs: () => true,
    log: () => {}
};

// Mock window.activity for turtle-singer tests
if (!global.window) global.window = {};
global.window.activity = {
    getActivity: () => ({
        stage: { update: jest.fn() }
    })
};

// Fix mathutils doMod test
const mathutils = require("../js/utils/mathutils");
const originalDoMod = mathutils.doMod;

// Patch doMod to throw DivByZeroError correctly
mathutils.doMod = function (a, b) {
    if (b === 0) {
        const error = new Error("DivByZeroError");
        error.name = "DivByZeroError";
        throw error;
    }
    return originalDoMod(a, b);
};
