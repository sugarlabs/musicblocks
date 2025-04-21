module.exports = {
  testMatch: ["**/__tests__/**/*.test.js", "**/?(*.)+(spec|test).[jt]s?(x)"],
  clearMocks: true,
  moduleFileExtensions: ["js", "json", "node"],
  testEnvironment: "jsdom",
  collectCoverage: true,
  coverageReporters: ["json", "lcov", "text", "clover"],
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "js/**/*.js",
    "!js/lib/**",
    "!js/external/**",
    "!**/node_modules/**"
  ]
};
