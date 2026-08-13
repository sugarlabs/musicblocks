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
 * --- Why js/utils/musicutils.js is NOT in the default scope -----------------
 *
 * musicutils.js was measured (dry-run instrumentation) to generate 7,391 of
 * the ~9,911 mutants in what was previously a combined scope - i.e. it alone
 * accounts for the vast majority of mutants and, empirically, of runtime.
 *
 * The reason is structural, not incidental: musicutils.js is a flat module
 * with 222 top-level `const`/`let`/`var` declarations (large lookup tables -
 * note names, solfege, key signatures, temperament/EDO tables, colors, etc.),
 * evaluated once at module load. By contrast every file in js/turtleactions/
 * has 0 top-level declarations and piemenu-block-context.js has 1 - those
 * modules are class/method-scoped, so effectively all their mutants are
 * attributable to specific tests.
 *
 * Mutants inside top-level/module-scope code are classified by Stryker as
 * "static" mutants: they run during module load rather than inside a test,
 * so `perTest` coverage analysis cannot narrow down which tests exercise
 * them, and Stryker must re-run the *entire* test suite for each one.
 * Measured on a 94-mutant sample drawn from a musicutils.js constant-table
 * region: 739.46 tests run per mutant on average (essentially the full
 * 781-test suite, every time). Measured on DictActions.js (175 mutants,
 * class/method-scoped, well covered): 7.01 tests run per mutant on average -
 * about two orders of magnitude fewer per mutant, via perTest's normal
 * related-test narrowing. That ~100x per-mutant cost multiplier, applied
 * across musicutils.js's 7,391 mutants, is consistent with the previously
 * observed ~25 hour ETA and is the actual mechanism behind it - not merely
 * mutant *count*.
 *
 * Blanket `ignoreStatic: true` would hide this instead of addressing it (and
 * would silently drop real mutation signal on those tables), so it is
 * deliberately not used here. Instead, musicutils.js is mutated separately,
 * in bounded batches, using Stryker's line-range mutate syntax, e.g.:
 *
 *   npx stryker run --mutate "js/utils/musicutils.js:1-935"
 *
 * Pick ranges deliberately smaller than the whole file so a batch completes
 * in minutes, not hours, and re-run different ranges over time rather than
 * mutating the whole file in one command.
 *
 * --- concurrency / maxTestRunnerReuse ---------------------------------------
 *
 * Stryker's own default concurrency is `os.cpus().length - 1` worker
 * processes. The previous full-scope run reported child test-runner
 * processes terminating with SIGSEGV after ~29 minutes. That crash was not
 * reproduced in this investigation, but the resource math is a plausible
 * contributor: each Node worker's default heap ceiling is several GB, and
 * `cpus - 1` long-lived workers running large instrumented suites in
 * parallel can exceed available memory on common dev/CI machines. Halving
 * the default concurrency and periodically recycling worker processes
 * (`maxTestRunnerReuse`) reduces peak memory pressure and bounds any
 * per-process memory growth over a long run, without changing which mutants
 * run or how they're scored.
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
