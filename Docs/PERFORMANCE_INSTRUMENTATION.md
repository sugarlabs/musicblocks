## Startup Performance Instrumentation

This project includes an opt-in startup timing tracker for performance work (issue `#5950`).

### Enable

Use one of these:

1. Query string: open Music Blocks with `?mbPerf=1`
2. Local storage flag (persists across reloads):
    - `localStorage.setItem("mbPerf", "1")`

Disable with:

- Remove query param, and/or
- `localStorage.removeItem("mbPerf")`

### What it records

When enabled, timings are stored in `window.__mbPerf`:

- `marks`: raw timestamp marks
- `measures`: computed durations in milliseconds

Key measures include:

- `loader.total_bootstrap`
- `activity.init_total`
- `activity.init_to_ui_ready`
- `loader_to_activity_init_complete`

### How to read results

Open browser DevTools console after load.

- A summary is printed automatically (`[mbPerf] Startup measures (ms)`).
- You can print again manually:
    - `window.__mbPerf.report()`

### Notes

- Instrumentation is no-op when disabled.
- This is for local profiling and PR benchmarking, not user telemetry.
