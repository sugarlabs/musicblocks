/**
 * Stryker Mutator configuration.
 *
 * This is an initial, deliberately conservative setup. The mutation scope is
 * limited to modules that already have strong Jest coverage (turtleactions/,
 * musicutils.js, piemenu-block-context.js) so that mutation results carry
 * real signal instead of producing thousands of low-value "no coverage"
 * mutants. Expand `mutate` incrementally as more of the codebase gains
 * dedicated unit tests.
 *
 * Run with: npm run test:mutation
 */
module.exports = {
    $schema: "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
    testRunner: "jest",
    jest: {
        projectType: "custom",
        configFile: "jest.config.js",
        enableFindRelatedTests: true
    },
    mutate: [
        "js/turtleactions/*.js",
        "js/utils/musicutils.js",
        "js/piemenu-block-context.js",
        "!js/turtleactions/**/__tests__/**",
        "!js/utils/**/__tests__/**"
    ],
    coverageAnalysis: "perTest",
    reporters: ["clear-text", "progress"]
};
