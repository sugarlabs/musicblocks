# Global State Audit - Logo Subsystem

## Purpose

This document audits implicit global state dependencies in the **Logo subsystem** as part of the architectural improvement initiative to reduce global coupling and improve testability.

## Scope

-   **Subsystem**: Logo (`js/logo.js`)
-   **Related Issue**: Audit and Reduce Implicit Global State Usage
-   **Date**: 2026-02-04

## Current Architecture

### Logo Class Dependencies

The Logo class currently depends on a single `activity` object passed to its constructor, which acts as a facade to access multiple subsystems:

```javascript
constructor(activity) {
    this.activity = activity;
    // ... initialization
}
```

### Identified Global Dependencies (via `this.activity`)

#### 1. **Blocks Subsystem** (`this.activity.blocks`)

-   **Usage Count**: ~50+ references
-   **Access Pattern**: `this.activity.blocks.*`
-   **Key Methods Used**:
    -   `blockList` - Direct property access
    -   `unhighlightAll()` - Visual feedback
    -   `bringToTop()` - Z-index management
    -   `showBlocks()` / `hideBlocks()` - Visibility control
    -   `sameGeneration()` - Block relationship queries
    -   `visible` - State query

**Impact**: High - Logo heavily depends on Blocks for execution flow and visual feedback

#### 2. **Turtles Subsystem** (`this.activity.turtles`)

-   **Usage Count**: ~80+ references
-   **Access Pattern**: `this.activity.turtles.*`
-   **Key Methods Used**:
    -   `turtleList` - Direct iteration over turtles
    -   `ithTurtle(index)` - Get specific turtle
    -   `getTurtle(index)` - Get turtle by index
    -   `getTurtleCount()` - Count query
    -   `add()` - Create new turtle
    -   `markAllAsStopped()` - State management

**Impact**: Critical - Logo is the execution engine for turtle commands

#### 3. **Stage** (`this.activity.stage`)

-   **Usage Count**: ~10+ references
-   **Access Pattern**: `this.activity.stage.*`
-   **Key Methods Used**:
    -   `addEventListener()` - Event handling
    -   `removeEventListener()` - Cleanup

**Impact**: Medium - Used for interaction and event handling

#### 4. **UI/Error Handling**

-   **Methods**:
    -   `this.activity.errorMsg()` - Error display
    -   `this.activity.hideMsgs()` - Message management
    -   `this.activity.saveLocally()` - Persistence

**Impact**: Medium - UI feedback and state persistence

#### 5. **Configuration/State**

-   **Properties**:
    -   `this.activity.showBlocksAfterRun` - Boolean flag
    -   `this.activity.onStopTurtle` - Callback
    -   `this.activity.onRunTurtle` - Callback
    -   `this.activity.meSpeak` - Speech synthesis

**Impact**: Low-Medium - Configuration and callbacks

## Dependency Graph

```
Logo
 ├─► Activity (facade)
      ├─► Blocks (execution context, visual feedback)
      ├─► Turtles (command execution, state management)
      ├─► Stage (event handling)
      ├─► ErrorMsg (UI feedback)
      └─► Configuration (flags, callbacks)
```

## Analysis

### Current Problems

1. **Tight Coupling**: Logo cannot be instantiated or tested without a full Activity object
2. **Hidden Dependencies**: The Activity facade obscures what Logo actually needs
3. **Circular Dependencies**: Logo ↔ Activity ↔ Blocks ↔ Turtles creates complex initialization
4. **Testing Difficulty**: Mocking requires recreating entire Activity object graph
5. **Unclear Contracts**: No explicit interface defining what Logo needs from Activity

### Unavoidable Dependencies

Some dependencies are fundamental to Logo's role as the execution engine:

-   **Turtles**: Logo executes turtle commands, so this dependency is core
-   **Blocks**: Logo interprets block programs, so this dependency is core

### Refactorable Dependencies

These could be made explicit or injected:

-   **Stage**: Could be injected as an event bus interface
-   **Error handling**: Could be injected as a logger/error handler interface
-   **Configuration**: Could be passed as a config object
-   **Callbacks**: Could be injected explicitly

## Proposed Refactoring Strategy

### Phase 1: Document Current State ✅

-   Create this audit document
-   Identify all `this.activity.*` references
-   Categorize by subsystem and impact

### Phase 2: Extract Interfaces (Small, Safe Changes)

Create explicit interfaces for Logo's dependencies:

```javascript
// LogoDependencies interface
class LogoDependencies {
    constructor({
        blocks, // Blocks subsystem
        turtles, // Turtles subsystem
        stage, // Event bus
        errorHandler, // Error display
        messageHandler, // Message display
        storage, // Persistence
        config, // Configuration
        callbacks // onStop, onRun, etc.
    }) {
        this.blocks = blocks;
        this.turtles = turtles;
        this.stage = stage;
        this.errorHandler = errorHandler;
        this.messageHandler = messageHandler;
        this.storage = storage;
        this.config = config;
        this.callbacks = callbacks;
    }
}
```

### Phase 3: Refactor Constructor (Backward Compatible)

```javascript
constructor(activityOrDeps) {
    // Support both old and new patterns
    if (activityOrDeps.blocks && activityOrDeps.turtles) {
        // New explicit dependencies
        this.deps = activityOrDeps;
    } else {
        // Old activity facade - extract dependencies
        this.deps = new LogoDependencies({
            blocks: activityOrDeps.blocks,
            turtles: activityOrDeps.turtles,
            stage: activityOrDeps.stage,
            errorHandler: activityOrDeps.errorMsg.bind(activityOrDeps),
            // ... etc
        });
    }
}
```

### Phase 4: Bind Dependencies Locally for Readability

To reduce verbosity while maintaining explicit dependency injection, bind commonly-used dependencies as local properties in the constructor:

```javascript
constructor(activityOrDeps) {
    // ... dependency injection setup ...

    // Bind commonly-used dependencies locally for readability
    // This reduces verbosity while maintaining explicit dependency injection
    this.blocks = this.deps.blocks;
    this.turtles = this.deps.turtles;
    this.stage = this.deps.stage;
}
```

This allows using `this.blocks.doSomething()` instead of `this.deps.blocks.doSomething()` throughout the class, while still preserving:

-   **Explicit dependency tracking**: All dependencies are declared in the constructor
-   **Grep-ability**: Can search for `this.blocks` to find all usages
-   **Auditability**: Clear what external dependencies the class uses
-   **No behavior change**: Functionally equivalent to `this.deps.*` access

**Note**: Both `this.deps.*` (maximum audit clarity) and locally bound references (improved readability) are acceptable patterns. Choose based on the specific needs of each subsystem.

### Phase 5: Add Tests

With explicit dependencies, Logo becomes testable:

```javascript
const mockDeps = {
    blocks: createMockBlocks(),
    turtles: createMockTurtles()
    // ... minimal mocks
};
const logo = new Logo(mockDeps);
```

## Benefits

1. **Explicit Contracts**: Clear interface showing what Logo needs
2. **Improved Testability**: Can inject minimal mocks instead of full Activity
3. **Better Documentation**: Dependencies are self-documenting
4. **Reduced Coupling**: Logo depends on interfaces, not concrete Activity
5. **Migration Path**: Backward compatible during transition
6. **Foundation for v4**: Establishes pattern for future architecture

## Risks & Mitigation

### Risk 1: Breaking Changes

**Mitigation**: Use adapter pattern to support both old and new constructors

### Risk 2: Incomplete Refactoring

**Mitigation**: Keep scope limited to Logo subsystem only

### Risk 3: Testing Overhead

**Mitigation**: Create helper functions for common mock setups

## Success Metrics

-   [x] All Logo dependencies explicitly documented
-   [x] Dependency interface created and documented
-   [x] Logo constructor supports explicit dependencies
-   [x] Backward compatibility maintained (both patterns supported)
-   [ ] No behavior changes (existing tests pass) - _needs verification_
-   [x] New unit tests for Logo with mocked dependencies
-   [x] Pattern documented for future subsystems

## Implementation Status

The Logo subsystem has been updated to support the `LogoDependencies` pattern. This implementation is backward-compatible with the existing `Activity` facade.

### Completed

-   [x] Initial audit of global state in Logo subsystem
-   [x] Creation of `LogoDependencies` class
-   [x] Update to `Logo` constructor to support dependency injection
-   [x] Unit tests for `LogoDependencies` pattern

### Planned

-   [ ] Gradual refactoring of internal `this.activity` references
-   [ ] Application of pattern to other core subsystems (Blocks, Turtles)

## References

-   Issue #2767: Identify and/or fix high-level inconsistencies
-   Related work: PhraseMaker widget isolation
-   RequireJS migration considerations

---

**Status**: Phase 3 Complete
**Owner**: @vanshika2720
