# Phase 2 Cloud Sync - Manual Testing Guide

**Server Status**: ✅ Running at http://127.0.0.1:3000  
**Test Date**: February 3, 2026  
**Tested By**: ___________________

---

## 🧪 Pre-Testing Checklist

Before you begin, verify:
- [x] Server is running (`npm run serve`)
- [ ] Browser is open (Chrome/Edge recommended)
- [ ] DevTools are open (F12)
- [ ] Console tab is visible in DevTools

---

## Test 1: Verify Implementation Files Loaded ✅

**Objective**: Confirm all Phase 2 modules are loaded correctly.

### Steps:
1. Open http://127.0.0.1:3000 in your browser
2. Open DevTools (F12)
3. Go to Console tab
4. Type the following commands and check results:

```javascript
// Check if modules are loaded
console.log('WorkspaceStorage:', typeof WorkspaceStorage);
console.log('SyncManager:', typeof SyncManager);
console.log('ConflictResolver:', typeof ConflictResolver);
```

### Expected Results:
```
✅ WorkspaceStorage: function
✅ SyncManager: function
✅ ConflictResolver: function
```

### If you see `undefined`:
❌ Modules not loaded - check `js/loader.js` configuration

**Status**: [ ] PASS  [ ] FAIL

---

## Test 2: Check IndexedDB Initialization 💾

**Objective**: Verify IndexedDB database is created.

### Steps:
1. In DevTools, go to **Application** tab
2. Expand **IndexedDB** in left sidebar
3. Look for `MusicBlocksWorkspace` database

### Expected Results:
```
✅ Database: MusicBlocksWorkspace
  ✅ Object Store: workspace
  ✅ Object Store: metadata
  ✅ Object Store: syncQueue
```

### Check Database Version:
```javascript
// In console:
indexedDB.databases().then(dbs => {
    const mb = dbs.find(db => db.name === 'MusicBlocksWorkspace');
    console.log('Version:', mb ? mb.version : 'Not found');
});
```

**Expected**: Version 2

**Status**: [ ] PASS  [ ] FAIL

---

## Test 3: Workspace Auto-Save 💾

**Objective**: Verify workspace saves to IndexedDB automatically.

### Steps:
1. On Music Blocks canvas, drag and drop a block (e.g., "Forward")
2. Wait 2-3 seconds (debounce period)
3. In DevTools → Application → IndexedDB → MusicBlocksWorkspace → workspace
4. Click on `workspace` object store
5. Look for entry with key: `"current_workspace"`

### Expected Results:
```
✅ Key: "current_workspace"
✅ Value: Contains JSON with your blocks
```

### Check Console for Messages:
```
WorkspaceStorage initialized
Workspace saved to IndexedDB
```

**Status**: [ ] PASS  [ ] FAIL

---

## Test 4: Metadata Tracking 📊

**Objective**: Verify version metadata is stored with timestamps.

### Steps:
1. After adding blocks (from Test 3)
2. In IndexedDB → MusicBlocksWorkspace → metadata
3. Click on `metadata` object store
4. Check the stored entry

### Expected Results:
```
✅ timestamp: [number] (Unix timestamp)
✅ data: [string] (JSON of workspace)
✅ synced: false (initially)
✅ userInitiated: false (autosave)
```

### Verify Timestamp is Recent:
```javascript
// In console:
const db = await indexedDB.open('MusicBlocksWorkspace', 2);
const tx = db.transaction('metadata', 'readonly');
const store = tx.objectStore('metadata');
const request = await store.getAll();
request.onsuccess = () => {
    const metadata = request.result[0];
    const age = Date.now() - metadata.timestamp;
    console.log('Saved', Math.floor(age / 1000), 'seconds ago');
};
```

**Status**: [ ] PASS  [ ] FAIL

---

## Test 5: Sync Manager Initialization 🔄

**Objective**: Verify SyncManager is initialized and running.

### Steps:
1. In Console, type:
```javascript
console.log('Activity exists:', typeof activity);
console.log('SyncManager exists:', typeof activity.syncManager);
console.log('WorkspaceStorage exists:', typeof activity.workspaceStorage);
```

### Expected Results:
```
✅ Activity exists: object
✅ SyncManager exists: object
✅ WorkspaceStorage exists: object
```

### Check Sync Status:
```javascript
// Check if periodic sync is running
console.log('Sync timer active:', activity.syncManager._syncTimer !== null);
console.log('Last sync time:', activity.syncManager.lastSyncTime);
```

**Status**: [ ] PASS  [ ] FAIL

---

## Test 6: Offline Detection 📴

**Objective**: Test network status detection.

### Steps:
1. In DevTools → Network tab
2. Check **Offline** checkbox (simulates offline mode)
3. In Console, check:
```javascript
console.log('Is online:', activity.workspaceStorage.isOnline);
```

### Expected Results:
```
✅ Is online: false
```

### Check Console Messages:
```
Network status changed: offline
Sync skipped: already in progress or offline
```

### Re-enable Online:
4. Uncheck **Offline** in Network tab
5. Check console:
```javascript
console.log('Is online:', activity.workspaceStorage.isOnline);
```

### Expected:
```
✅ Is online: true
Network status changed: online
Network restored, attempting sync...
```

**Status**: [ ] PASS  [ ] FAIL

---

## Test 7: Sync Queue (Offline Editing) 🗂️

**Objective**: Verify changes queue when offline.

### Steps:
1. Go offline (DevTools → Network → Offline)
2. Add/modify blocks in workspace
3. Wait 2 seconds
4. Check console for:
```
Sync skipped: already in progress or offline
```

5. Check IndexedDB:
   - workspace should be updated
   - metadata should have `synced: false`

6. Go back online
7. Wait ~30 seconds (or manually trigger):
```javascript
activity.syncManager.syncNow();
```

### Expected Results:
```
✅ Changes saved locally while offline
✅ Sync attempted when back online
✅ Console shows: "Uploading to cloud..."
```

**Status**: [ ] PASS  [ ] FAIL

---

## Test 8: Conflict Detection (Advanced) ⚠️

**Objective**: Create and detect a sync conflict.

### Setup:
This requires simulating different versions. Use this approach:

### Steps:
1. Open Music Blocks
2. Add some blocks (Version A)
3. Open DevTools Console
4. Manually modify metadata timestamp to be old:
```javascript
async function createConflict() {
    const db = await new Promise((resolve) => {
        const request = indexedDB.open('MusicBlocksWorkspace', 2);
        request.onsuccess = () => resolve(request.result);
    });
    
    const tx = db.transaction('metadata', 'readwrite');
    const store = tx.objectStore('metadata');
    const allData = await new Promise((resolve) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
    });
    
    const metadata = allData[0];
    metadata.timestamp = Date.now() - 3600000; // 1 hour ago
    metadata.synced = false; // Mark as unsynced
    
    await new Promise((resolve) => {
        const req = store.put(metadata);
        req.onsuccess = () => resolve();
    });
    
    console.log('Created fake old timestamp to simulate conflict');
}

createConflict();
```

5. Now trigger a sync:
```javascript
activity.syncManager.syncNow();
```

### Expected Results (if cloud has newer version):
```
⚠️ Console: "Conflict detected: both local and cloud have changes"
⚠️ Conflict dialog should appear
```

**Note**: This test requires Planet API to be functional and have a cloud version.

**Status**: [ ] PASS  [ ] FAIL  [ ] SKIPPED (no cloud)

---

## Test 9: Conflict Resolution UI 🎨

**Objective**: Verify conflict dialog appears and functions.

### Steps (if conflict was created in Test 8):
1. Conflict dialog should be visible
2. Verify dialog contains:
   - ✅ Header: "Sync Conflict Detected"
   - ✅ Warning icon (⚠️)
   - ✅ Two options: "Keep Local" and "Keep Cloud"
   - ✅ Timestamps for both versions
   - ✅ Warning message about data loss
   - ✅ Cancel button

3. Test interactions:
   - Click "Keep Local" → Should upload local changes
   - OR Click "Keep Cloud" → Should download cloud version
   - OR Click "Cancel" → Dialog closes, no changes

### Expected Results:
```
✅ Dialog is styled correctly
✅ Buttons are clickable
✅ Choosing an option resolves conflict
✅ Sync status updates to "Synced" after resolution
```

**Status**: [ ] PASS  [ ] FAIL  [ ] SKIPPED

---

## Test 10: Periodic Sync (30 seconds) ⏰

**Objective**: Verify automatic sync happens every 30 seconds.

### Steps:
1. Make a change to workspace
2. Note the current time
3. Wait 30 seconds without touching anything
4. Watch console for sync messages

### Expected Results:
```
⏰ At ~30 seconds: "Uploading to cloud..." OR "Sync skipped..."
✅ Periodic sync is working
```

### Verify Timer:
```javascript
// Check sync interval
console.log('Sync interval:', activity.syncManager.syncInterval / 1000, 'seconds');
```

**Expected**: 30 seconds

**Status**: [ ] PASS  [ ] FAIL

---

## Test 11: Debounced Sync (2 seconds) ⚡

**Objective**: Verify sync doesn't happen immediately but after 2s delay.

### Steps:
1. Add a block
2. Immediately check console (within 0.5 seconds)
3. Wait 2 seconds
4. Check console again

### Expected Results:
```
⏱️ 0-1.9 seconds: No sync message
⏱️ At ~2 seconds: "Uploading to cloud..."
✅ Debounce is working
```

**Status**: [ ] PASS  [ ] FAIL

---

## Test 12: Error Handling 🐛

**Objective**: Verify graceful error handling.

### Steps:
1. Simulate a planet API error (if possible):
```javascript
// Temporarily break Planet API
const originalPlanet = activity.planet;
activity.planet = null;

// Try to sync
activity.syncManager.syncNow();

// Restore
activity.planet = originalPlanet;
```

### Expected Results:
```
❌ Console: "Sync failed: ..."
✅ No app crash
✅ Error is logged, not thrown
```

**Status**: [ ] PASS  [ ] FAIL

---

## 🎨 Visual Checks (If UI Elements Implemented)

### Network Status Indicator
- [ ] Icon visible in toolbar
- [ ] Shows green when online
- [ ] Shows red when offline
- [ ] Updates in real-time

### Sync Status Indicator
- [ ] Icon visible in toolbar
- [ ] Shows "Syncing..." with rotating icon
- [ ] Shows "Synced Xm ago" when done
- [ ] Shows "Sync failed" on error
- [ ] Shows "Conflict detected" if conflict exists

### Conflict Dialog
- [ ] Beautiful modal overlay
- [ ] Centered on screen
- [ ] Styled with gradient header
- [ ] Buttons have hover effects
- [ ] Accessible (keyboard navigation works)

---

## 📊 Test Results Summary

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Modules Loaded | [ ] | |
| 2 | IndexedDB Init | [ ] | |
| 3 | Auto-Save | [ ] | |
| 4 | Metadata | [ ] | |
| 5 | SyncManager Init | [ ] | |
| 6 | Offline Detection | [ ] | |
| 7 | Sync Queue | [ ] | |
| 8 | Conflict Detection | [ ] | |
| 9 | Conflict UI | [ ] | |
| 10 | Periodic Sync | [ ] | |
| 11 | Debounced Sync | [ ] | |
| 12 | Error Handling | [ ] | |

**Overall Status**: _____________________

---

## 🐛 Issues Found

List any bugs or issues discovered:

1. ___________________________________________
2. ___________________________________________
3. ___________________________________________

---

## ✅ Sign-Off

**Tester**: ___________________  
**Date**: ___________________  
**Phase 2 Ready for Release**: [ ] YES  [ ] NO (see issues)

---

## 📸 Screenshots to Capture

Please capture and attach:
1. Main workspace with blocks
2. DevTools Console showing sync messages
3. IndexedDB browser showing MusicBlocksWorkspace
4. Network tab showing offline mode
5. Conflict dialog (if triggered)
6. Status indicators in toolbar (if implemented)

---

**Happy Testing! 🎵✨**
