module.exports = {
    mutate: [
        "js/utils/*.js",
        "js/turtleactions/*.js",
        "!js/utils/__tests__/**",
        "!js/turtleactions/__tests__/**"
    ],
    testRunner: "jest",
    jest: {
        projectType: "custom",
        configFile: "jest.config.js",
        enableFindRelatedTests: true
    },
    coverageAnalysis: "perTest",
    thresholds: { high: 80, low: 60, break: 60 },
    reporters: ["html", "clear-text", "progress"]
};
