# Offline Mode in Music Blocks

Music Blocks supports an offline mode that allows users to continue working without an active internet connection.

## Features

-   **Persistent Workspace**: Your blocks are automatically saved to your browser's IndexedDB using `WorkspaceStorage`.
-   **Automatic Recovery**: When you reload the page, Music Blocks will attempt to restore your last session if the canvas is empty.
-   **Network Status Detection**: The UI provides feedback on your connection status via the Planet icon.
-   **Service Worker Caching**: Core application assets are cached to allow the app to load while offline.

## Implementation Details

-   **IndexedDB**: The workspace is saved in a database named `MusicBlocksWorkspace`.
-   **Storage Class**: `js/WorkspaceStorage.js` handles all storage logic.
-   **Activity Integration**: Initialized within the main `Activity` class in `js/activity.js`.

## Service Worker

The Service Worker is defined in `sw.js`. It uses `musicblocks-cache-v1` for storage.

To test Service Worker on `localhost`:

1. Run: `localStorage.setItem("ENABLE_SW_LOCAL", "true")`
2. Reload page.
