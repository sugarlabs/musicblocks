# Phase 2 — Cloud Sync & Conflict Resolution

**Status**: Implemented ✅  
**Version**: Phase 2.0  
**Date**: February 2026

---

## Overview

Phase 2 enhances Music Blocks with **cloud synchronization** and **intelligent conflict resolution**. Building upon Phase 1's local persistence foundation, users now enjoy seamless synchronization between their local workspace and the Planet (cloud storage), ensuring work is never lost across devices.

---

## Key Features

###  1. **Automatic Cloud Synchronization**
- Workspace automatically syncs to Planet every 30 seconds
- Changes are uploaded when you're online
- Offline changes queue and sync when connection restores
- Background sync using Service Worker API

### 2. **Smart Conflict Detection**
- Detects when both local and cloud versions have changes
- Timestamp-based comparison prevents data loss
- Clear visualization of conflicts

### 3. **Beautiful Conflict Resolution UI**
Beautiful, user-friendly dialog that allows users to:
- View timestamps of local and cloud versions
- Choose to keep local version (uploads to cloud)
- Choose to keep cloud version (downloads locally)
- See clear warnings about data loss



### 4. **Sync Status Indicators**
Real-time UI feedback showing:
- **Syncing**: Rotating cloud icon with "Syncing..." text
- **Synced**: Green checkmark with timestamp ("Synced 2m ago")
- **Error**: Red icon with "Sync failed" message
- **Conflict**: Orange warning icon

### 5. **Network-Aware Behavior**
- Automatically attempts sync when going online
- Gracefully handles offline periods
- Shows network status (online/offline) in toolbar
- No errors or interruptions when offline

---

## Architecture

### Components

#### 1. **WorkspaceStorage.js** (Enhanced from Phase 1)
- Local IndexedDB storage with version tracking
- Metadata store for timestamps and sync status
- Sync queue for pending changes
- Network detection and status updates

**Key Methods:**
```javascript
init()                    // Initialize IndexedDB with versioning
saveWorkspace()          // Save with version metadata
getVersionMetadata()     // Get timestamp and sync status  
markAsSynced()          // Mark version as synced
hasUnsyncedChanges()    // Check if local changes exist
```

#### 2. **SyncManager.js** (New in Phase 2)
- Orchestrates synchronization between local and cloud
- Conflict detection and resolution
- Periodic sync (every 30 seconds)
- Background sync integration

**Key Methods:**
```javascript
init()                   // Start sync manager
syncNow()               // Perform sync immediately
queueSync()             // Queue a sync (debounced)
resolveConflict()       // Handle user's conflict choice
onNetworkRestore()      // Sync when back online
```

#### 3. **ConflictResolver.js** (New in Phase 2)
- User interface for conflict resolution
- Side-by-side comparison of versions
- Interactive resolution workflow

**Key Methods:**
```javascript
show()                  // Display conflict dialog
hide()                  // Close dialog
_onResolve(choice)     // Handle user decision
```

---

## Data Flow

### Normal Sync Flow
```
1. User edits workspace
   ↓
2. WorkspaceStorage.saveWorkspace()
   ↓
3. Saved to IndexedDB with timestamp
   ↓
4. SyncManager.queueSync() triggered
   ↓
5. After 2s debounce, syncNow() called
   ↓
6. Check cloud version timestamp
   ↓
7a. Local newer → Upload to cloud
7b. Cloud newer (no local changes) → Download
7c. Both have changes → Show conflict dialog
```

### Conflict Resolution Flow
```
1. Conflict detected (both modified)
   ↓
2. ConflictResolver.show()
   ↓
3. User sees:
   - Local version (timestamp)
   - Cloud version (timestamp)
   - Warning about data loss
   ↓
4. User chooses:
   a. Keep Local → Upload to cloud
   b. Keep Cloud → Download and overwrite
   c. Cancel → Do nothing
   ↓
5. Sync completes
   ↓
6. UI updated to "Synced"
```

---

## UI Components

### Network Status Indicator
**Location**: Top toolbar, left side  
**States**:
- 🟢 Green `cloud_done`: Online
- 🔴 Red `cloud_off`: Offline

### Sync Status Indicator
**Location**: Top toolbar, next to network status  
**States**:
- 🔵 Blue spinning `sync`: Currently syncing
- 🟢 Green `cloud_done`: Successfully synced
- 🔴 Red `sync_problem`: Sync failed
- 🟠 Orange `warning`: Conflict detected

### Conflict Dialog
**Sections**:
1. **Header**: Warning icon + "Sync Conflict Detected"
2. **Body**:
   - Explanation message
   - Grid of two options (Local vs Cloud)
   - Each shows timestamp and description
3. **Warning Box**: Data loss warning
4. **Footer**: Cancel button

---

## Technical Deports
t Implementation Details

### Storage Schema

**IndexedDB Database**: `MusicBlocksWorkspace` (v2)

**Object Stores**:

1. **workspace** - Current workspace data
   - Key: `"current_workspace"`
   - Value: Serialized workspace JSON

2. **metadata** - Version metadata
   ```javascript
   {
     timestamp: 1706901234567,  // Unix timestamp
     data: "...",               // Workspace JSON
     synced: false,             // Sync status
     userInitiated: false       // Manual save?
   }
   ```

3. **syncQueue** - Pending sync operations (for future use)
   - Auto-increment keys
   - Indexed by timestamp

### Sync Algorithm

```javascript
async syncNow() {
  // 1. Check online status
  if (!online) return;
  
  // 2. Get local and cloud versions
  localVersion = await getVersionMetadata();
  cloudVersion = await getCloudWorkspace();
  
  // 3. Determine action
  if (!cloudVersion) {
    → Upload local to cloud
  } else if (!hasLocalChanges) {
    → Download cloud (if newer)
  } else if (cloudTime > localTime && hasLocalChanges) {
    → CONFLICT! Show dialog
  } else {
    → Upload local to cloud
  }
}
```

### Conflict Detection Logic

```javascript
// Conflict exists when:
const hasConflict = 
  (cloudTimestamp > localTimestamp) &&  // Cloud is newer
  hasUnsyncedLocalChanges;              // AND local has changes

// Safe to download:
const safeToDownload = 
  (cloudTimestamp > localTimestamp) &&  // Cloud is newer
  !hasUnsyncedLocalChanges;             // AND no local changes

// Safe to upload:
const safeToUpload = 
  (localTimestamp >= cloudTimestamp) || // Local is newer/same
  !cloudVersion;                         // OR no cloud version
```

---

## CSS Styling

All styles in `css/activities.css` under **Phase 2** section:

- `.conflict-dialog-overlay` - Modal overlay with blur
- `.conflict-dialog` - Main dialog container
- `.conflict-header` - Orange gradient header
- `.conflict-options` - Grid layout for choices
- `.conflict-btn` - Styled action buttons
- Animations: `slideUp`, `pulse`, `rotation`

---

## Integration with Existing Code

### Activity.js
Phase 2 modules are loaded via RequireJS:
```javascript
MYDEFINES.push(
  "WorkspaceStorage",
  "SyncManager",
  "ConflictResolver"
);
```

### Planet Integration
SyncManager works with existing Planet API:
- `planet.openCurrentProject()` - Get cloud version
- `planet.saveLocally()` - Upload to cloud
- Seamlessly integrates without breaking changes

---

## Usage Example

```javascript
// Initialize (automatic in Activity init)
const workspaceStorage = new WorkspaceStorage(activity);
await workspaceStorage.init();

const syncManager = new SyncManager(activity, workspaceStorage);
await syncManager.init();

// Save workspace (triggers sync)
await workspaceStorage.saveWorkspace(true); // userInitiated=true

// Sync immediately
await syncManager.syncNow();

// Check sync status
const hasUnsynced = await workspaceStorage.hasUnsyncedChanges();
console.log("Has unsynced changes:", hasUnsynced);
```

---

## Error Handling

### Network Errors
- Gracefully fails when cloud unreachable
- Updates UI to show error state
- Retries on next periodic sync

### Data Corruption
- Try/catch blocks around JSON parsing
- Falls back to empty workspace if corrupted
- Logs errors to console

### IndexedDB Failures
- Catches permission errors
- Provides fallback behavior
- User notified via UI

---

## Future Enhancements (Phase 3+)

- **Merge Strategy**: Intelligent block-level merging
- **Version History**: See and restore previous versions
- **Device Sync**: Sync across multiple devices
- **Offline Editing**: Full collaborative editing
- **PWA Features**: Install as native app

---

## Testing

### Manual Test ing Scenarios

1. **Basic Sync**
   - Edit workspace
   - Wait 2-30 seconds
   - Verify sync status updates

2. **Conflict Creation**
   - Edit on Device A
   - Edit on Device B (same project)
   - Load on one device
   - Should show conflict dialog

3. **Offline Behavior**
   - Disconnect network
   - Edit workspace
   - Reconnect
   - Verify auto-sync

4. **Network Toggle**
   - Toggle online/offline
   - Verify icon updates correctly

---

## Performance Considerations

- **Debounced Sync**: 2-second delay prevents excessive syncs
- **Periodic Interval**: 30 seconds balances freshness and performance
- **Background Sync**: Service Worker handles sync when app closed
- **Lazy Loading**: Conflict dialog created only when needed

---

## Accessibility

- Keyboard navigation in conflict dialog
- Screen reader friendly labels
- Clear visual indicators for all states
- High contrast colors

---

## Browser Compatibility

- **IndexedDB**: All modern browsers (IE 10+)
- **Service Worker**: Chrome 40+, Firefox 44+, Safari 11.1+
- **Background Sync**: Chrome/Edge only (graceful degradation)

---

## Security

- Cloud sync uses existing Planet authentication
- No passwords stored locally
- IndexedDB isolated per origin
- No sensitive data exposed

---

## Conclusion

Phase 2 successfully implements robust cloud synchronization with intelligent conflict resolution. Users can now work confidently across devices, knowing their work is automatically backed up and synchronized, with clear resolution when conflicts arise.

**Next Phase**: Full PWA with installability, multiple workspace management, and enhanced offline capabilities.
