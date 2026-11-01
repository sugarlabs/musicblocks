# Large workspace benchmark

This opt-in Cypress benchmark measures complete project loading and repeated project replacement in a real Music Blocks browser session. It is separate from Jest and adds no elapsed-time assertions to the regular test suite.

## Run it

Start the development server in one terminal:

```sh
npm run serve:dev
```

Run the benchmark in another terminal:

```sh
npx cypress run --spec cypress/e2e/large-workspace-benchmark.cy.js --env runLargeWorkspaceBenchmark=true
```

Enable the benchmark explicitly when running the full Cypress suite; without
`runLargeWorkspaceBenchmark=true`, this spec is skipped so normal E2E runs do
not spend time measuring large workspaces.

The default run covers 500, 2,000, and 5,000 blocks in both workload shapes, with three measured iterations and one untimed warm-up for each operation. Cypress writes `cypress/downloads/large-workspace-benchmark.json`. A failed or incomplete operation is recorded in the JSON and fails the Cypress spec; there is no performance threshold.

For a quicker check, use a single size and one measured iteration:

```sh
npx cypress run --spec cypress/e2e/large-workspace-benchmark.cy.js --env runLargeWorkspaceBenchmark=true,benchmarkSizes=500,benchmarkIterations=1,replacementIterations=1,benchmarkOutput=cypress/downloads/benchmark-smoke.json
```

`benchmarkSizes` accepts a comma-separated subset of `500,2000,5000`. `benchmarkIterations` controls timed loads; `replacementIterations` controls timed replacements. `benchmarkOutput` is a repository-relative output path. Use the same browser, machine, Cypress version, viewport, and iteration settings when comparing revisions.

## Workloads and timing

The generator emits the normal Music Blocks project block-array format with registered `vspace` blocks:

- `deep-stack` connects the requested blocks into one long parent/child chain.
- `independent-stacks` creates the requested number of unconnected one-block stacks in a deterministic grid.

Each generated project has sequential IDs, reciprocal parent/child connections, stable coordinates, and no random input. Independent stacks use a compact 30-column grid inside the Cypress viewport to avoid repeatedly triggering canvas-bound adjustments. The report records requested and actual block counts plus the generator configuration, including grid spacing. The benchmark loads projects through `blocks.loadNewBlocks` and waits for the loader's token-tagged `finishedLoading`/`loadFailed` events. That completion event follows block creation, stack and dock cleanup, position updates, spatial-grid rebuild, final refresh, and the loader's completion work. A 120-second watchdog turns a missing completion event into an explicit incomplete-load error; it is not used as a timing endpoint.

Replacement alternates the two generated structures at the same block count through `activity.planet.loadProjectFromData`, the application's project replacement API. Timed duration begins immediately before that API call and ends after its project-load completion event. Before each sample, correctness checks compare active block count, block type, and every connection against the expected generated structure.

Lifecycle checks verify that replaced blocks are marked as trashed, cached canvases and block SVG artwork are released, and trash/undo history and stack previews are cleared. Trashed Block instances remain in `blockList` under the application's current lifecycle, so its total length may grow during a run. The benchmark reports active blocks and deterministic cleanup invariants; it does not infer leaks from retained JavaScript objects or depend on garbage-collection timing.

## JSON schema (version 1)

The report has a stable top-level shape:

| Field                        | Meaning                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| `benchmark`, `schemaVersion` | Benchmark identifier and schema version.                                               |
| `revision`                   | Full Git commit hash from the checkout that ran Cypress.                               |
| `environment`                | Cypress/browser versions, OS platform, and browser user-agent/platform when available. |
| `generatedAt`                | ISO timestamp for the report.                                                          |
| `results`                    | One record per workload shape and operation.                                           |

Each result contains `workload` (`structure`, requested and actual counts, block type, seed, grid columns and spacing, and warm-up count), `operation` (`load` or `replacement`), requested/completed iteration counts, individual `elapsedMs`, `medianMs`, `minimumMs`, operation counts, per-iteration `correctness.checks`, and an `errors` array. Summary values are `null` when no iteration completed. A replacement workload additionally names its source and target structures. Failed iterations remain represented by the completed count and error message; they do not receive fabricated durations.

The loader completion events run synchronous finalization before a waiting Promise continuation can proceed. Thus each recorded duration includes the event callback and finalization work, while correctness checks happen after timing stops.

## Comparing revisions

Keep the JSON output from each checkout and compare records with matching workload structure, operation, requested size, browser, OS, iteration counts, and viewport. Compare individual samples and medians together; these are measurements for investigation, not CI pass/fail thresholds. Record machine load and browser mode alongside any conclusions. Do not compare runs from different workload configurations as if they were equivalent.
