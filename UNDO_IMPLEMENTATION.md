# Undo/Redo Implementation for Music Blocks

## Overview
This implementation adds comprehensive Undo/Redo functionality to Music Blocks with infinite loop prevention and state comparison optimization.

## Core Components

### 1. UndoManager Class (`js/UndoManager.js`)
- **Purpose**: Manages undo/redo stacks and prevents infinite loops
- **Key Features**:
  - "Mute" pattern to prevent recursive state saving during undo/redo
  - State comparison to avoid duplicate entries
  - Stack size limit (50 items) to prevent memory issues
  - Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y (redo)

### 2. Event Listeners Modified

#### Block Movement (`js/block.js`)
```javascript
// Line 3206-3209: After block movement completion
// Save state for undo after block movement is completed
if (this.activity.undoManager) {
    this.activity.undoManager.pushState();
}
```

#### Value Changes (`js/block.js`)
```javascript
// Line 4666-4669: After label/value changes
// Save state for undo after value change is completed
if (this.activity.undoManager) {
    this.activity.undoManager.pushState();
}
```

#### Block Deletion (`js/blocks.js`)
```javascript
// Line 7003-7006: After block deletion completion
// Save state for undo after block deletion is completed
if (this.activity.undoManager) {
    this.activity.undoManager.pushState();
}
```

#### Keyboard Shortcuts (`js/activity.js`)
```javascript
// Line 3436-3453: Ctrl+Z and Ctrl+Y handlers
case Z:
    // Ctrl+Z for undo
    if (event.ctrlKey || event.metaKey) {
        if (this.undoManager && this.undoManager.undo()) {
            this.textMsg("Ctrl+Z " + _("Undo"));
        }
        event.preventDefault();
    }
    break;
case Y:
    // Ctrl+Y for redo
    if (event.ctrlKey || event.metaKey) {
        if (this.undoManager && this.undoManager.redo()) {
            this.textMsg("Ctrl+Y " + _("Redo"));
        }
        event.preventDefault();
    }
    break;
```

### 3. Integration Points

#### Activity Initialization (`js/activity.js`)
```javascript
// Line 54: Import UndoManager
const UndoManager = require('./UndoManager.js');

// Line 319: Initialize UndoManager
this.undoManager = new UndoManager(this);
```

## Key Features Implemented

### 1. "Mute" Pattern (Infinite Loop Prevention)
- **Problem**: Undo actions themselves trigger state saves
- **Solution**: `isMuted` flag prevents recursive saves during undo/redo
```javascript
// In UndoManager.pushState()
if (this.isMuted) {
    return;
}

// During undo/redo operations
this.isMuted = true;
// Restore state
this.isMuted = false;
```

### 2. State Comparison Optimization
- **Problem**: Duplicate states waste memory
- **Solution**: Compare new state with last saved state
```javascript
if (currentState === this.lastSavedState) {
    return; // Don't save duplicate
}
```

### 3. Memory Management
- **Problem**: Unlimited undo stack causes memory issues
- **Solution**: Limit stack to 50 items
```javascript
if (this.undoStack.length > this.maxStackSize) {
    this.undoStack.shift();
}
```

## Test Scenarios

### 1. The "Note" Test ✅
- **Test**: Change number inside note block
- **Expected**: State saved after value change
- **Implementation**: `_changeLabel()` method in `block.js`

### 2. The Delete Test ✅
- **Test**: Delete large stack and undo
- **Expected**: Entire stack restored
- **Implementation**: `sendStackToTrash()` method in `blocks.js`

### 3. The Memory Test ✅
- **Test**: 20+ undos
- **Expected**: No performance degradation
- **Implementation**: Stack size limit of 50 items

### 4. Infinite Loop Test ✅
- **Test**: Multiple Ctrl+Z presses
- **Expected**: No infinite loops
- **Implementation**: "Mute" pattern with `isMuted` flag

## Files Modified

1. **js/UndoManager.js** (NEW) - Core undo/redo logic
2. **js/activity.js** - Integration and keyboard shortcuts
3. **js/block.js** - Block movement and value change hooks
4. **js/blocks.js** - Block deletion hooks

## Usage

### Keyboard Shortcuts
- **Ctrl+Z** (or Cmd+Z on Mac): Undo
- **Ctrl+Y** (or Cmd+Y on Mac): Redo

### Programmatic Usage
```javascript
// Push current state
activity.undoManager.pushState();

// Undo
activity.undoManager.undo();

// Redo
activity.undoManager.redo();

// Check availability
activity.undoManager.canUndo();
activity.undoManager.canRedo();
```

## Performance Considerations

1. **State Serialization**: Uses existing `prepareExport()` method
2. **Memory Limit**: 50 undo states maximum
3. **State Comparison**: String comparison to avoid duplicates
4. **Mute Pattern**: Prevents recursive saves during undo/redo

## Error Handling

- Graceful fallback if UndoManager not available
- Error logging for debugging
- Automatic unmute on errors
- Stack overflow protection

## Future Enhancements

1. UI buttons for undo/redo
2. Visual indicators for undo/redo availability
3. Configurable stack size
4. Selective undo (specific blocks)
5. Undo history viewer
