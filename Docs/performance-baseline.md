# Performance Baseline (Issue #5950)

This document defines a repeatable baseline for Music Blocks v3 performance work.

Use it before and after each performance PR so improvements are measurable.

## Scope

Track three areas:

1. Page-load performance
2. Runtime lag on complex projects
3. Memory stability during repeated actions

## Environment Rules

Use the same environment for before/after runs:

- OS and browser version unchanged
- No browser extensions
- Fresh browser profile or Incognito
- Close other heavy apps/tabs
- Same network profile for Lighthouse runs

Record environment details in the report template below.

## 1) Load Baseline (Lighthouse)

### Command

```bash
npm run perf:lhci
```

This uses `lighthouserc.js`.

Record these metrics:

- Performance score
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Total Blocking Time (TBT)
- Speed Index
- Cumulative Layout Shift (CLS)

Also keep the temporary-public-storage report URL if generated.

## 2) Asset Weight Baseline

### Command

```bash
npm run perf:assets
```

Record:

- JS file count (`js/` and `lib/`)
- Total uncompressed size
- Estimated minified size from script output

## 3) Runtime Lag Baseline (Manual)

Use Chrome DevTools Performance panel.

### Scenario

1. Start app locally.
2. Open a known complex project (same project every run).
3. Interact for 30-60 seconds: drag blocks, run/stop playback, open/close one widget.
4. Capture a Performance trace.

Record:

- Total long tasks count (`>50ms`)
- Max long-task duration
- Average FPS in interaction periods

## 4) Memory Baseline (Manual)

Use Chrome DevTools Memory panel + Performance monitor.

### Scenario

1. Load app and wait idle for 30 seconds.
2. Repeat 10 cycles: open widget -> use briefly -> close widget.
3. Repeat 5 cycles: run project -> stop.
4. Take heap snapshots at:
    - initial idle
    - after widget cycles
    - after run/stop cycles

Record:

- JS heap used at each checkpoint
- Detached DOM nodes (if visible)
- Any sustained upward heap trend after GC

## Reporting Template

Copy this section into issue/PR comments.

```md
### Performance Baseline

Environment:

- OS:
- Browser:
- Commit SHA:
- Date:

Load (Lighthouse):

- Performance:
- FCP:
- LCP:
- TBT:
- Speed Index:
- CLS:
- Report URL:

Assets:

- JS files (js/):
- JS files (lib/):
- Total size:
- Estimated minified size:

Runtime Lag:

- Long tasks count:
- Max long task:
- Avg FPS:
- Scenario notes:

Memory:

- Heap initial:
- Heap after widget cycles:
- Heap after run/stop cycles:
- Leak signals:
```

## PR Policy for #5950 Work

Each performance PR should include:

1. Baseline numbers before change
2. Numbers after change (same method/environment)
3. Risk and rollback notes
4. Scope limited to one theme (startup, runtime lag, or memory)
