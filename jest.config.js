module.exports = {
    testMatch: ["**/__tests__/**/*.test.js", "**/?(*.)+(spec|test).[jt]s?(x)"],
    clearMocks: true,
    moduleFileExtensions: ["js", "json", "node"],
    testEnvironment: "jsdom",
    collectCoverage: true,
    collectCoverageFrom: [
        "js/**/*.js",
        "!js/__tests__/**",
        "planet/js/**/*.js",
        "!planet/js/__tests__/**"
    ],
    coverageReporters: ["text-summary", "text", "lcov"],
};
