module.exports = {
    testMatch: ["**/__tests__/**/*.test.js", "**/?(*.)+(spec|test).[jt]s?(x)"],
    clearMocks: true,
    restoreMocks: true,

    moduleFileExtensions: ["js", "json", "node"],
    testEnvironment: "jsdom",

    setupFilesAfterEnv: ["<rootDir>/test/setupTests.js"],

    collectCoverage: true,
    collectCoverageFrom: [
        "js/**/*.js",
        "!js/__tests__/**",
        "planet/js/**/*.js",
        "!planet/js/__tests__/**"
    ],
    coverageReporters: ["text-summary", "text", "lcov", "json-summary"]
    // No hard-coded coverageThreshold: CI's "Coverage delta vs base" job
    // compares this PR's coverage-summary.json against the base branch's
    // and fails if statements/branches/functions/lines drop, instead of a
    // static floor that needs manual bumps as coverage grows.
};
