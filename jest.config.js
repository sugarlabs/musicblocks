module.exports = {
    testMatch: ["**/__tests__/**/*.test.js", "**/?(*.)+(spec|test).[jt]s?(x)"],
    clearMocks: true,
    moduleFileExtensions: ["js", "json", "node"],
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["./jest.setup.js"],
    collectCoverage: true,
    collectCoverageFrom: [
        "js/**/*.js",
        "!js/vendor/**",
    ],
    coverageReporters: ["text-summary", "text", "lcov"],
};
