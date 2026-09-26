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
        "!js/js-export/ast2blocks.config.js",
        "planet/js/**/*.js",
        "!planet/js/__tests__/**"
    ],
    coverageReporters: ["text-summary", "text", "lcov", "json-summary"]
    // No hard-coded coverageThreshold here: .github/workflows/coverage-delta.yml
    // runs Jest on both the base branch and the PR head, then compares the
    // coverage-summary.json output. The workflow fails the PR if statements,
    // branches, functions, or lines drop — no static floor to manually bump.
};
