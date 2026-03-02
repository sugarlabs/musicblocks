# CreateJS Migration Plan (Issue #5971)

## Why

Music Blocks currently depends on CreateJS for canvas stage, display objects, hit areas, and tweening. CreateJS is no longer actively maintained, so we need a controlled migration path that avoids regressions in block editing, turtle graphics, and widgets.

## Current Scope Baseline

Run:

```bash
npm run audit:createjs
```

This generates:

-   `Docs/architecture/createjs-usage-report.md`

Use the report as the baseline dependency map for migration sequencing.

## Migration Strategy

### Phase 1: Audit + Stabilize Seams

1. Keep functionality unchanged.
2. Identify high-impact files and APIs from usage report.
3. Introduce thin renderer abstraction points where safe (Stage, Container, Bitmap, Text, Shape, Tween usage boundaries).

Success criteria:

-   No behavior changes.
-   Dependency map documented and reproducible.

### Phase 2: Dual-Path Adapter Prototype

1. Select one low-risk surface (e.g., message containers or one widget canvas layer).
2. Implement adapter API with current CreateJS backend.
3. Add experimental second backend implementation behind a flag.

Success criteria:

-   Same output for selected surface.
-   No regression in tests/lint.

### Phase 3: Incremental Surface Migration

1. Migrate by domain:
    - UI containers and overlays
    - block rendering interactions
    - turtle/stage animation paths
2. Keep diffs small and benchmark each wave.

Success criteria:

-   Feature parity per migrated domain.
-   Startup/interaction perf does not regress.

### Phase 4: Decommission CreateJS

1. Remove remaining CreateJS imports/shims.
2. Remove compatibility code.
3. Update docs and architecture notes.

Success criteria:

-   No CreateJS runtime dependency in production path.

## Candidate Replacement Targets to Evaluate

-   `PixiJS` (2D renderer, good performance, active ecosystem)
-   `Konva` (canvas scene graph with interaction utilities)
-   `Fabric.js` (object-based canvas API; evaluate for scale/perf needs)

Evaluation criteria:

1. Performance under high object counts (blocks + overlays)
2. Event/hit-testing ergonomics
3. Animation/tween compatibility strategy
4. Bundle size and maintenance cadence
5. Ease of incremental migration

## Immediate Next PRs

1. Add adapter interface draft for Stage/Container/Bitmap/Text/Shape primitives.
2. Move one isolated rendering path behind adapter (no behavior change).
3. Add regression tests for that path.
