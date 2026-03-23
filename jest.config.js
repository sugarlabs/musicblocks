module.exports = {
    testMatch: ["**/__tests__/**/*.test.js", "**/?(*.)+(spec|test).[jt]s?(x)"],
    clearMocks: true,
    restoreMocks: true,

    moduleFileExtensions: ["js", "json", "node"],
    testEnvironment: "jsdom",

    setupFilesAfterEnv: ["<rootDir>/test/setupTests.js"],

    collectCoverage: true,
    collectCoverageFrom: ["js/**/*.js", "!js/vendor/**"],
    coverageReporters: ["text-summary", "text", "lcov"]
};
