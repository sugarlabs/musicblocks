// Copyright (c) 2026 Sugar Labs
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU Affero General Public License as published by the Free
// Software Foundation, either version 3 of the License, or (at your option) any
// later version.

const {
    BENCHMARK_NAME,
    SCHEMA_VERSION,
    DEFAULT_SIZES,
    makeWorkspace,
    waitForLoad,
    verifyWorkspace,
    makeEnvironment,
    makeResult
} = require("../support/large-workspace-benchmark");

const structures = ["deep-stack", "independent-stacks"];
const configuredSizes = Cypress.env("benchmarkSizes");
const sizes = configuredSizes
    ? String(configuredSizes)
          .split(",")
          .map(value => Number(value.trim()))
    : DEFAULT_SIZES;
const iterations = Number(Cypress.env("benchmarkIterations") || 3);
const replacementIterations = Number(Cypress.env("replacementIterations") || 3);
const outputPath =
    Cypress.env("benchmarkOutput") || "cypress/downloads/large-workspace-benchmark.json";

describe("Large workspace performance benchmark", { retries: 0 }, function () {
    it("measures full project loading and repeated replacement", function () {
        this.timeout(0);
        expect(iterations, "benchmarkIterations must be a positive integer").to.be.greaterThan(0);
        expect(
            replacementIterations,
            "replacementIterations must be a positive integer"
        ).to.be.greaterThan(0);
        expect(sizes, "benchmarkSizes must be one or more supported sizes").to.not.be.empty;
        sizes.forEach(size => expect(DEFAULT_SIZES).to.include(size));

        const results = [];
        let environment;
        let revision;

        cy.visit("http://127.0.0.1:3000");
        cy.waitForAppReady();
        let stableLoadObservations = 0;
        cy.window().should(win => {
            const blocks = win.ActivityContext.getActivity().blocks;
            const fullyLoaded = !blocks.isLoading() && blocks._loadCounter === 0;
            stableLoadObservations = fullyLoaded ? stableLoadObservations + 1 : 0;
            expect(stableLoadObservations, "startup load remains complete").to.be.at.least(3);
        });
        cy.exec("git rev-parse HEAD", { log: false }).then(({ stdout }) => {
            revision = stdout.trim();
        });

        cy.window().then(async win => {
            const activity = win.ActivityContext.getActivity();
            if (!activity || !activity.blocks || !activity.planet) {
                throw new Error(
                    "Music Blocks project loading APIs are unavailable in this browser"
                );
            }
            if (!activity.blocks.protoBlockDict.vspace) {
                throw new Error("The built-in vspace block is unavailable in this runtime");
            }
            environment = makeEnvironment(win);

            for (const requestedBlocks of sizes) {
                for (const structure of structures) {
                    const { project, configuration } = makeWorkspace(requestedBlocks, structure);
                    const errors = [];
                    const checks = [];
                    const loadDurations = [];
                    const loadWorkspace = () => {
                        activity.sendAllToTrash(false, true);
                        return waitForLoad(
                            win,
                            () =>
                                activity.blocks.loadNewBlocks(JSON.parse(JSON.stringify(project))),
                            `load ${structure} ${requestedBlocks}`
                        );
                    };

                    try {
                        await loadWorkspace();
                        const warmup = verifyWorkspace(activity, configuration);
                        checks.push({ phase: "warmup", ...warmup });
                        if (!warmup.passed) throw new Error(warmup.errors.join("; "));
                    } catch (error) {
                        errors.push(`warm-up: ${error.message}`);
                    }

                    for (
                        let iteration = 0;
                        iteration < iterations && errors.length === 0;
                        iteration++
                    ) {
                        try {
                            activity.sendAllToTrash(false, true);
                            const started = win.performance.now();
                            await waitForLoad(
                                win,
                                () =>
                                    activity.blocks.loadNewBlocks(
                                        JSON.parse(JSON.stringify(project))
                                    ),
                                `load ${structure} ${requestedBlocks}, iteration ${iteration + 1}`
                            );
                            loadDurations.push(win.performance.now() - started);
                            const check = verifyWorkspace(activity, configuration);
                            checks.push({ iteration: iteration + 1, ...check });
                            if (!check.passed) throw new Error(check.errors.join("; "));
                        } catch (error) {
                            errors.push(`iteration ${iteration + 1}: ${error.message}`);
                        }
                    }

                    const workload = { ...configuration };
                    results.push(
                        makeResult(workload, "load", iterations, loadDurations, checks, errors)
                    );

                    const replacementDurations = [];
                    const replacementErrors = [];
                    const replacementChecks = [];
                    const replacementConfiguration = makeWorkspace(
                        requestedBlocks,
                        structure === "deep-stack" ? "independent-stacks" : "deep-stack"
                    );
                    const replacementWorkload = {
                        ...workload,
                        warmupIterations: 1,
                        sourceStructure: structure,
                        targetStructure: replacementConfiguration.configuration.structure
                    };

                    try {
                        const before = activeBlocksForLifecycle(activity);
                        await waitForLoad(
                            win,
                            () =>
                                activity.planet.loadProjectFromData(
                                    JSON.parse(JSON.stringify(replacementConfiguration.project))
                                ),
                            `replacement warm-up ${structure} ${requestedBlocks}`
                        );
                        const warmup = verifyReplacement(
                            activity,
                            before,
                            replacementConfiguration.configuration
                        );
                        replacementChecks.push({ phase: "warmup", ...warmup });
                        if (!warmup.passed) throw new Error(warmup.errors.join("; "));
                    } catch (error) {
                        replacementErrors.push(`warm-up: ${error.message}`);
                    }

                    for (
                        let iteration = 0;
                        iteration < replacementIterations && replacementErrors.length === 0;
                        iteration++
                    ) {
                        try {
                            const before = activeBlocksForLifecycle(activity);
                            let started;
                            await waitForLoad(
                                win,
                                () => {
                                    started = win.performance.now();
                                    return activity.planet.loadProjectFromData(
                                        JSON.parse(JSON.stringify(replacementConfiguration.project))
                                    );
                                },
                                `replacement ${structure} ${requestedBlocks}, iteration ${iteration + 1}`
                            );
                            replacementDurations.push(win.performance.now() - started);
                            const check = verifyReplacement(
                                activity,
                                before,
                                replacementConfiguration.configuration
                            );
                            replacementChecks.push({ iteration: iteration + 1, ...check });
                            if (!check.passed) throw new Error(check.errors.join("; "));
                        } catch (error) {
                            replacementErrors.push(`iteration ${iteration + 1}: ${error.message}`);
                        }
                    }

                    results.push(
                        makeResult(
                            replacementWorkload,
                            "replacement",
                            replacementIterations,
                            replacementDurations,
                            replacementChecks,
                            replacementErrors
                        )
                    );
                }
            }
        });

        cy.then(() => ({
            benchmark: BENCHMARK_NAME,
            schemaVersion: SCHEMA_VERSION,
            revision,
            environment,
            generatedAt: new Date().toISOString(),
            results
        })).then(report =>
            cy.writeFile(outputPath, report, { log: false }).then(() => {
                const failures = report.results.filter(result => !result.correctness.passed);
                expect(failures, `Benchmark failed; inspect ${outputPath}`).to.be.empty;
            })
        );
    });
});

const activeBlocksForLifecycle = activity =>
    activity.blocks.blockList
        .map((block, index) => ({ block, index }))
        .filter(item => item.block && !item.block.trash);

const verifyReplacement = (activity, previousBlocks, configuration) => {
    const check = verifyWorkspace(activity, configuration);
    const oldBlocksTrashed = previousBlocks.every(({ block }) => block.trash === true);
    const oldResourcesReleased = previousBlocks.every(
        ({ block, index }) =>
            (!block.container || !block.container.cacheCanvas) &&
            !Object.prototype.hasOwnProperty.call(activity.blocks.blockArt, index) &&
            !Object.prototype.hasOwnProperty.call(activity.blocks.blockCollapseArt, index)
    );
    const historyCleared =
        activity.blocks.trashStacks.length === 0 &&
        activity.blocks.actionHistory.length === 0 &&
        activity.blocks.redoActionHistory.length === 0 &&
        Object.keys(activity.blocks.trashPreviews).length === 0;

    check.lifecycle = { oldBlocksTrashed, oldResourcesReleased, historyCleared };
    check.passed = check.passed && oldBlocksTrashed && oldResourcesReleased && historyCleared;
    if (!oldBlocksTrashed) check.errors.push("one or more replaced blocks remained active");
    if (!oldResourcesReleased) {
        check.errors.push("one or more replaced blocks retained cached canvas or SVG art");
    }
    if (!historyCleared) {
        check.errors.push("project replacement retained trash/undo history or previews");
    }
    return check;
};
