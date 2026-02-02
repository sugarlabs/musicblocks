# Offline Mode Technical Overview

Music Blocks supports persistent offline storage of your workspace. This ensures that your work is saved even if you lose network connectivity or close the browser without manually saving.

## Core Components

### 1. Workspace Persistence (IndexedDB)
The current state of the workspace (all blocks on the canvas) is automatically saved to the browser's IndexedDB. 
- **Storage Backend**: IndexedDB (using separate database `MusicBlocksWorkspace`)
- **Save Trigger**: The workspace is automatically saved every 5 seconds (auto-save) and whenever major changes occur.
- **Auto-Restore**: When Music Blocks is launched, it checks the local IndexedDB for the last saved workspace and restores it if available.

### 2. Network Detection
Music Blocks monitors the device's connectivity status.
- **Online Status**: Standard operation with access to Planet (cloud) features.
- **Offline Status**: Access to cloud features is disabled, but core block coding and local execution remain fully functional.
- **UI Indicator**: A small indicator in the top-right corner shows the current connectivity status.
  - 🟢 Green: Online
  - 🔴 Red: Offline

### 3. Service Worker
The Service Worker (integrated from previous phases) ensures that the application's assets (JS, CSS, images) are cached locally, allowing the application to load even without an internet connection.

## Data Flow
1. **Workspace Change** -> `Activity.prepareExport()` -> `WorkspaceStorage.saveWorkspace()` -> **IndexedDB**.
2. **App Startup** -> `WorkspaceStorage.loadWorkspace()` -> `Activity.loadNewBlocks()` -> **Canvas Restored**.

## Technical Implementation Details
- **File**: `js/WorkspaceStorage.js`
- **Main Class**: `WorkspaceStorage`
- **Database Name**: `MusicBlocksWorkspace`
- **Object Store**: `workspace`
- **Integration**: Initialized in `Activity.init` (in `js/activity.js`).
