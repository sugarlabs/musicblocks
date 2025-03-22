module.exports = {
    testMatch: ["**/__tests__/**/*.test.js", "**/?(*.)+(spec|test).[jt]s?(x)"],
    clearMocks: true,
    moduleFileExtensions: ["js", "json", "node"],
    testEnvironment: "jsdom",
};
