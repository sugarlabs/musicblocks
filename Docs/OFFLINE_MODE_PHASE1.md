# Offline Mode Phase 1

## Summary

Phase 1 formalizes Music Blocks' existing local workspace persistence and adds a minimal offline-first user experience. The goal is to keep current work recoverable across refreshes and browser restarts, surface connectivity state in the UI, and align the service worker with the core app shell needed to reopen the workspace.

This phase does not add background sync, cloud conflict resolution, or full installability flows.

## Persistence Model

Music Blocks currently uses two local persistence paths:

1. Planet-backed project persistence uses `localforage`, which stores project data in IndexedDB and keeps both primary and backup copies.
2. Activity session persistence stores the current workspace snapshot in `SESSION*` keys so manual reloads and abrupt tab closes still have a synchronous recovery path.

Together, these layers provide offline-safe local recovery without requiring network access.

## Startup Restore Flow

On startup, the application restores workspace data in this order:

1. Try the current Planet project from local IndexedDB storage.
2. Fall back to the `SESSION*` workspace snapshot for the current project.
3. Start with a blank workspace when neither source contains recoverable data.

This keeps refresh and browser-reopen behavior predictable while preserving the existing "current project" model.

## Autosave Expectations

- A synchronous `SESSION*` snapshot is written during `beforeunload` so manual refreshes still have recoverable data.
- A periodic autosave runs every five minutes while the project is idle.
- Planet-backed saves continue to use local IndexedDB storage when Planet is available.

Phase 1 keeps these behaviors and documents them explicitly rather than changing the storage architecture.

## Connectivity Indicator

The toolbar now includes a small online/offline badge driven by the standard browser `navigator.onLine` API and `online`/`offline` events.

- The indicator updates in real time without reload.
- It is intentionally lightweight and non-blocking.
- It reflects browser connectivity only; it is not a guarantee that every remote endpoint is reachable.

## Service Worker Alignment

The service worker now precaches the core app shell used to boot Music Blocks:

- `index.html`
- the main stylesheet and theme stylesheet
- the startup scripts loaded directly from `index.html`
- manifest and basic shell assets
- loading animation media and logo assets used during startup

Runtime caching is still used for same-origin static assets requested after startup. This is a pragmatic Phase 1 compromise for the current AMD-based loading model.

## Limitations

- First-use offline boot is not guaranteed until the user has loaded the app online at least once.
- Dynamically requested AMD dependencies still rely on runtime caching after they are first fetched.
- Planet cloud browsing and sharing remain network-dependent.
- No background sync or multi-device merge behavior is included in this phase.

## Future Extension Points

Later phases can build on this foundation with:

- explicit sync state and retry queues
- conflict handling for cloud restores
- a generated asset manifest for more complete offline precaching
- installability and broader PWA lifecycle support
