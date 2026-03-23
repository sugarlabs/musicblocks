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
    coverageReporters: ["text-summary", "text", "lcov", "json-summary"],
    coverageThreshold: {
        global: {
            statements: 34,
            branches: 29,
            functions: 41,
            lines: 34
        }
    },
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"]
};
