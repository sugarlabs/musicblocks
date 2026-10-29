// Copyright (c) 2026 Sugar Labs
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU Affero General Public License as published by the Free
// Software Foundation, either version 3 of the License, or (at your option) any
// later version.

const BENCHMARK_NAME = "musicblocks-large-workspace";
const SCHEMA_VERSION = 1;
const DEFAULT_SIZES = [500, 2000, 5000];

const makeWorkspace = (requestedBlocks, structure) => {
    if (!DEFAULT_SIZES.includes(requestedBlocks)) {
        throw new Error(`Unsupported requested block count: ${requestedBlocks}`);
    }
    if (!["deep-stack", "independent-stacks"].includes(structure)) {
        throw new Error(`Unsupported workspace structure: ${structure}`);
    }

    const project = [];
    const columns = 30;
    for (let index = 0; index < requestedBlocks; index++) {
        const x = structure === "deep-stack" ? 100 : 100 + (index % columns) * 40;
        const y = structure === "deep-stack" ? 100 : 100 + Math.floor(index / columns) * 5;
        const parent = structure === "deep-stack" && index > 0 ? index - 1 : null;
        const child = structure === "deep-stack" && index < requestedBlocks - 1 ? index + 1 : null;
        project.push([index, "vspace", x, y, [parent, child]]);
    }

    return {
        project,
        configuration: {
            structure,
            requestedBlocks,
            actualBlocks: project.length,
            warmupIterations: 1,
            blockType: "vspace",
            seed: 0,
            columns: structure === "independent-stacks" ? columns : 1,
            columnSpacing: structure === "independent-stacks" ? 40 : 0,
            rowSpacing: structure === "independent-stacks" ? 5 : 0
        }
    };
};

const waitForLoad = (win, startLoad, label) =>
    new Cypress.Promise((resolve, reject) => {
        const { pubsub } = win;
        if (!pubsub || typeof pubsub.on !== "function" || typeof pubsub.off !== "function") {
            reject(new Error("Music Blocks pubsub completion events are unavailable"));
            return;
        }

        let loadToken = null;
        let settled = false;
        const cleanup = () => {
            pubsub.off("finishedLoading", onFinished);
            pubsub.off("loadFailed", onFailed);
            win.clearTimeout(watchdog);
        };
        const finish = (error, payload) => {
            if (settled) return;
            if (loadToken !== null && payload && payload.token !== loadToken) return;
            settled = true;
            cleanup();
            if (error) reject(error);
            else resolve();
        };
        const onFinished = payload => finish(null, payload);
        const onFailed = payload =>
            finish((payload && payload.error) || new Error(`${label} failed`), payload);
        const watchdog = win.setTimeout(
            () => finish(new Error(`${label} did not emit a completion event within 120 seconds`)),
            120000
        );

        pubsub.on("finishedLoading", onFinished);
        pubsub.on("loadFailed", onFailed);
        try {
            loadToken = startLoad();
            if (loadToken === null || loadToken === undefined) {
                loadToken = win.ActivityContext.getActivity().blocks._activeLoadToken;
            }
        } catch (error) {
            finish(error);
        }
    });

const activeBlocks = activity =>
    activity.blocks.blockList
        .map((block, index) => ({ block, index }))
        .filter(item => item.block && !item.block.trash);

const verifyWorkspace = (activity, configuration) => {
    const blocks = activeBlocks(activity);
    const errors = [];
    if (blocks.length !== configuration.actualBlocks) {
        errors.push(`expected ${configuration.actualBlocks} active blocks, found ${blocks.length}`);
    }

    for (let offset = 0; offset < blocks.length; offset++) {
        const { block, index } = blocks[offset];
        if (block.name !== configuration.blockType) {
            errors.push(
                `block ${index} has type ${block.name}, expected ${configuration.blockType}`
            );
            continue;
        }
        const expectedParent =
            configuration.structure === "deep-stack" && offset > 0
                ? blocks[offset - 1].index
                : null;
        const expectedChild =
            configuration.structure === "deep-stack" && offset < blocks.length - 1
                ? blocks[offset + 1].index
                : null;
        if (block.connections[0] !== expectedParent || block.connections[1] !== expectedChild) {
            errors.push(
                `block ${index} connections were [${block.connections[0]}, ${block.connections[1]}], expected [${expectedParent}, ${expectedChild}]`
            );
        }
    }

    return { passed: errors.length === 0, activeBlocks: blocks.length, errors };
};

const summarize = values => {
    if (values.length === 0) return { medianMs: null, minimumMs: null };
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    const medianMs =
        sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
    return { medianMs, minimumMs: sorted[0] };
};

const makeEnvironment = win => {
    const nav = win.navigator;
    return {
        runtime: `Cypress ${Cypress.version}`,
        browser: {
            name: Cypress.browser.name,
            version: Cypress.browser.version
        },
        operatingSystem: Cypress.platform,
        userAgent: nav.userAgent,
        platform: nav.platform
    };
};

const makeResult = (workload, operation, iterations, durationsMs, checks, errors) => ({
    workload,
    operation,
    requestedIterations: iterations,
    completedIterations: durationsMs.length,
    elapsedMs: durationsMs,
    ...summarize(durationsMs),
    operationCounts: {
        projectLoads: operation === "load" ? durationsMs.length : 0,
        projectReplacements: operation === "replacement" ? durationsMs.length : 0,
        blocksLoaded: durationsMs.length * workload.actualBlocks
    },
    correctness: { passed: errors.length === 0 && checks.every(check => check.passed), checks },
    errors
});

module.exports = {
    BENCHMARK_NAME,
    SCHEMA_VERSION,
    DEFAULT_SIZES,
    makeWorkspace,
    waitForLoad,
    verifyWorkspace,
    makeEnvironment,
    makeResult
};
