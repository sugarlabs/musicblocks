/**
 * Stryker Mutator configuration.
 *
 * This is an initial, deliberately conservative setup. The mutation scope is
 * limited to modules that already have strong Jest coverage (turtleactions/,
 * piemenu-block-context.js) so that mutation results carry real signal
 * instead of producing thousands of low-value "no coverage" mutants. Expand
 * `mutate` incrementally as more of the codebase gains dedicated unit tests.
 *
 * Run with: npm run test:mutation
 *
 * The default mutation scope intentionally excludes musicutils.js.
 *
 * musicutils.js contains many module-level lookup tables that produce static
 * mutants. These cannot benefit from perTest test selection and make an
 * unbounded mutation run impractical.
 *
 * Mutate musicutils.js separately using bounded line ranges, for example:
 *
 *   npx stryker run --mutate "js/utils/musicutils.js:1-935"
 *
 * The default concurrency is limited to half the available CPUs to reduce
 * memory pressure during mutation runs. Test-runner processes are recycled
 * periodically to bound long-running worker memory usage.
 */
const os = require("os");

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
        "js/piemenu-block-context.js",
        "!js/turtleactions/**/__tests__/**"
    ],
    coverageAnalysis: "perTest",
    concurrency: Math.max(1, Math.floor(os.cpus().length / 2)),
    maxTestRunnerReuse: 50,
    reporters: ["clear-text", "progress"]
};
