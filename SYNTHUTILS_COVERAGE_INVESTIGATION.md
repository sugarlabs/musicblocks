# synthutils.js Test Coverage Investigation Report

**Date**: May 2026  
**Issue**: synthutils.js reports 0% coverage despite having an existing test suite

## Executive Summary

The `synthutils.js` module currently shows **0% code coverage** in Jest/Istanbul reports, despite having tests that validate its functionality. This is **not** a test effectiveness problem but an **instrumentation visibility problem** caused by the testing architecture's use of dynamic code evaluation (`new Function()`).

The tests **do work correctly** and validate behavior, but Jest's code coverage tools cannot track execution paths inside dynamically evaluated code.

## Root Cause Analysis
### Current Testing Architecture

The test suite loads synthutils.js through **runtime code evaluation** rather than standard module instrumentation:

```javascript
// Current approach (synthutils.test.js)
const fs = require("fs");
const path = require("path");

// 1. Read source files as strings
const codeFiles = ["../utils.js", "../musicutils.js", "../synthutils.js", ...];
let wrapperCode = "";
codeFiles.forEach(filePath => {
    const fileCode = fs.readFileSync(path.join(__dirname, filePath), "utf8");
    wrapperCode += `\n${fileCode}`;
});

// 2. Execute dynamically
const wrapper = new Function(`
    // Manual globals injection
    window._ = window._ || function(str) { return str; };
    window.Tone = require("./tonemock.js");
    
    // Execute all code as a string
    ${wrapperCode}
    
    // Extract and return exports
    return { Synth, instruments, ... };
`);
```

### Why Coverage Instruments See 0%
| Step | What Happens | Coverage Impact |
| **Module Load** | `fs.readFileSync()` reads raw source code | No instrumentation yet needed |
| **Dynamic Eval** | `new Function()` executes code at runtime | **Outside Jest instrumentation scope** |
| **Global Injection** | Manually sets `window._`, `window.Tone`, etc. | Runtime globals available |
| **Tests Run** | Tests invoke extracted functions | Tests pass, behavior works |
| **Coverage Analysis** | Istanbul scans for instrumented line traces | **No traces found** (code wasn't loaded via Jest) |

**Key Issue**: Jest's code coverage only tracks execution when code is loaded through:
- `require()` / `import` statements
- Jest module transformers and preprocessors  
- Instrumented test files

It **cannot track** execution inside `new Function()` evaluated code.

## Why This Architecture Exists

The dynamic evaluation approach was likely introduced to accommodate:

1. **Global Namespace Dependencies**
   - synthutils.js depends on globals from musicutils.js, utils.js, etc.
   - These are browser globals (`window.Tone`, `window._`, etc.)
   - Standard Jest module isolation breaks this pattern

2. **Circular Dependencies**
   ```javascript
   // musicutils.js declares it needs
   /*global VOICENAMES, DRUMNAMES, NOISENAMES */ // from synthutils.js
   
   // But synthutils.js may need items from musicutils.js
   // Direct require() would create circular dependency issues
   ```

3. **Legacy Codebase Structure**
   - Original code designed for browser with `<script>` tag loading
   - Global namespace by design
   - No module exports/imports

4. **Browser Environment Requirements**
   - Tone.js library integration
   - Audio context and global state
   - DOM mocking (meta tags, document elements)

## Architecture Decision Framework
### Questions to Resolve

**1. Module Dependency Structure**
- [ ] Can synthutils.js be refactored into smaller, independent modules?
- [ ] What are the actual runtime dependencies (not just declared globals)?
- [ ] How many levels of circular dependencies exist?

**2. Testing Constraints**
- [ ] Are browser globals truly required for functionality or just historical?
- [ ] Can Tone.js mocking be isolated better?
- [ ] Could tests work with standard Jest module loading?

**3. Future Maintenance**
- [ ] How often is synthutils.js modified?
- [ ] Are there plans to modularize the broader codebase?
- [ ] Would mutation testing be valuable for this module?

**4. Instrumentation Trade-offs**
- [ ] Is 0% coverage acceptable given functional tests pass?
- [ ] What's the value of coverage visibility vs. current test effectiveness?
- [ ] Could partial instrumentation be sufficient?

## Potential Solution Approaches
### Option 1: Direct Module Loading (Highest Coverage Impact)

**Approach**: Refactor synthutils.js to use standard ES6 modules/CommonJS exports

**Requirements**:
- Convert synthutils.js to explicit imports/exports
- Mock dependencies in Jest setup
- Refactor global injection pattern

**Pros**:
- Full Istanbul instrumentation
- Trustworthy coverage reports
- Cleaner module isolation
- Enables mutation testing

**Cons**:
- Significant refactoring effort
- Risk of breaking existing functionality
- Requires careful global-to-module-import conversion
- May need to refactor broader codebase

**Estimated Effort**: High (1-2 weeks for thorough refactoring + testing)

### Option 2: Babel/Transform Plugin (Medium Coverage Impact)

**Approach**: Create a custom Jest transformer to instrument code before execution

**Requirements**:
- Write Jest transformer plugin
- Apply babel-plugin-istanbul selectively
- Configure in jest.config.js

**Code Example**:
```javascript
// jest.config.js
module.exports = {
    transform: {
        "^.+\\.js$": ["babel-jest", {
            plugins: ["istanbul"]  // adds coverage instrumentation
        }]
    },
    collectCoverageFrom: ["js/**/*.js"],
    // Ensure wrapper code is also instrumented
    testEnvironment: "jsdom"
};
```

**Pros**:
- Partial coverage visibility
- Minimal code changes needed
- Non-breaking solution
- Relatively quick implementation

**Cons**:
- May not capture all paths if code is assembled as strings
- Complex debugging if instrumentation fails
- Ongoing maintenance of transformer
- Still not as clean as proper modules

**Estimated Effort**: Medium (2-5 days)

### Option 3: Hybrid Approach (Balanced)

**Approach**: Gradually extract core logic to standard modules while keeping wrapper for compatibility

**Phase 1** (Week 1):
- Extract pure utility functions from synthutils.js
- Create synthutils-core.js with no dependencies
- Test and instrument core module independently

**Phase 2** (Week 2):
- Move business logic functions to separate modules
- Refactor tests to use standard imports
- Maintain compatibility wrapper

**Phase 3** (Week 3+):
- Deprecate new Function() approach
- Full module-based architecture

**Pros**:
- Gradual, low-risk approach
- Improves test reliability incrementally
- Allows parallel work
- Full instrumentation eventually

**Cons**:
- Longer timeline to full coverage
- Temporary complexity from two approaches
- Requires careful coordination

**Estimated Effort**: Medium-High (2-3 weeks total, done incrementally)

### Option 4: Documentation-First (Lowest Effort)
**Approach**: Accept current architecture, document it, and establish coverage baseline with alternative metrics

**Implement**:
- Document why dynamic evaluation is necessary
- Create manual coverage map from test cases
- Use branch counting from test descriptions
- Track coverage via custom script

**Pros**:
- Immediate documentation value
- Minimal code changes
- Establishes baseline for future work
- No breaking changes

**Cons**:
- No actual coverage improvement
- Manual maintenance burden
- Doesn't solve instrumentation visibility
- Limits mutation testing capability

**Estimated Effort**: Low (1-2 days)

## Investigation Checklist
Before implementing any solution, gather this information:

- [ ] **Dependency Analysis**
  - [ ] Map all globals required by synthutils.js
  - [ ] Identify circular dependencies
  - [ ] Document runtime-only dependencies vs. buildtime

- [ ] **Test Suite Analysis**
  - [ ] Verify all tests pass currently
  - [ ] Document which tests exercise which code paths
  - [ ] List currently untested functions/branches

- [ ] **Codebase Scope**
  - [ ] How many other files use the dynamic eval pattern?
  - [ ] Is this an island issue or broader pattern?
  - [ ] Are there refactoring projects underway?

- [ ] **Stakeholder Input**
  - [ ] What's the priority for coverage visibility?
  - [ ] Are there plans for synthutils.js modifications?
  - [ ] Would team prefer refactoring or documentation approach?

## Next Steps
### Immediate (This Discussion)
1. Review this analysis with team
2. Answer the investigation checklist questions
3. Use decision tree to determine preferred approach
4. Get buy-in on solution direction

### Short-term (1-2 weeks)
1. Create detailed implementation plan for chosen option
2. Set up branch/feature flags if doing refactoring
3. Begin first phase of implementation
4. Document progress

### Medium-term (1-3 months)
1. Complete implementation of chosen solution
2. Verify coverage reporting is now accurate
3. Update CI/CD pipeline if needed
4. Establish coverage thresholds and goals

## References
- **Istanbul/Nyc Coverage Docs**: [How coverage works](https://github.com/istanbuljs/nyc)
- **Jest Coverage**: [collectCoverageFrom documentation](https://jestjs.io/docs/configuration#collectcoveragefrom)
- **Babel Plugin Istanbul**: [Code instrumentation details](https://github.com/istanbuljs/babel-plugin-istanbul)
- **Module Patterns**: [CommonJS vs ES6 modules in Jest](https://jestjs.io/docs/ecmascript-modules)

## Appendix: Current Test Coverage Snapshot
**Files Analyzed**:
- synthutils.js: ~500+ lines
- synthutils.test.js: ~400+ lines of test code
- Current Coverage: 0% (instrumentation issue, not test quality)
- Test Suite Status: Passing

**Test Categories Observed**:
- setupRecorder: Tests exist
- createDefaultSynth: Tests exist
- _createBuiltinSynth: Tests exist
- _createCustomSynth: Tests exist
- __createSynth: Tests exist
- loadSynth: Tests exist
- trigger: Tests exist
- Various instrument/effect tests: Tests exist
