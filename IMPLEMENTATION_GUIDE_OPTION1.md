# Implementation Guide: Option 1 - Direct Module Refactoring
**Recommended For**: Teams with time to invest in proper solution, high need for instrumentation, or planning long-term testing improvements.

**Estimated Duration**: 1-2 weeks  
**Risk Level**: Medium  
**Expected Outcome**: Coverage 70%+, Full instrumentation, Mutation testing capable

## Phase 1: Analysis & Planning (Days 1-2)
### Task 1.1: Create Dependency Map

**Objective**: Understand what synthutils.js depends on and what depends on it
**Steps**:
1. Read top of synthutils.js (the `/* global ... */` comments)
2. Document each global dependency:
   - Where it comes from (which file)
   - Why it's needed (use case)
   - Whether it's truly needed or historical

3. Check if synthutils.js is required by other files

**Example Output**:
```javascript
// Dependency Map for synthutils.js

Requires (from other modules):
├─ _() function → from utils.js → i18n/localization
├─ last() function → from utils.js → array utility
├─ Tone library → external → audio synthesis (mockable)
├─ pitchToNumber() → from musicutils.js → music theory
└─ FLAT, SHARP → from musicutils.js → note accidentals

Required By (other modules):
├─ turtle-singer.js → uses Synth class
├─ logo.js → uses Synth for playback
└─ No other direct dependencies identified

Circular Dependencies Detected:
├─ synthutils.js ← → musicutils.js (VOICENAMES export needed by musicutils)
└─ Severity: MEDIUM - manageable with refactoring
```

**Output**: Dependency map document (save as `SYNTHUTILS_DEPENDENCIES.md`)

### Task 1.2: Identify Circular Dependencies

**Steps**:
1. Check musicutils.js for `/* global VOICENAMES, DRUMNAMES, NOISENAMES */`
2. Check if musicutils.js functions are used by synthutils.js
3. Map the circular path

**Resolution Strategy**:
```
PROBLEM:
  synthutils.js defines: VOICENAMES, DRUMNAMES, NOISENAMES
  musicutils.js needs: VOICENAMES, DRUMNAMES, NOISENAMES
  But synthutils.js also needs: musicutils functions

SOLUTION OPTIONS:
  a) Move VOICENAMES/DRUMNAMES/NOISENAMES to musicutils.js
  b) Create separate module: voice-constants.js
  c) Use lazy loading (require in functions, not at module top)
  d) Use conditional imports
```

**Recommended**: Option (b) - separate constants module

### Task 1.3: Create Refactoring Plan

**Create a document outlining**:
1. Which functions will be extracted first (low-risk)
2. Dependency resolution strategy
3. Test updates needed
4. Validation steps after each change
5. Rollback plan if needed

**Template**:
```markdown
# Refactoring Plan: synthutils.js
## Phase 1: Extract Constants (Low Risk)
- Extract VOICENAMES, DRUMNAMES, NOISENAMES, EFFECTSNAMES
- Create: voice-constants.js
- Risk: LOW (no function logic)

## Phase 2: Create Module Exports
- Add module.exports to synthutils.js
- Update test imports
- Risk: MEDIUM (imports change)

## Phase 3: Resolve Dependencies
- Update circular dependencies
- Fix global references
- Risk: MEDIUM (cross-module changes)

## Validation at Each Stage
- [ ] Tests pass: npm test -- synthutils.test.js
- [ ] No console errors
- [ ] Coverage > previous stage
```

## Phase 2: Preparation (Days 2-3)
### Task 2.1: Update jest.config.js

**Current**:
```javascript
module.exports = {
    testEnvironment: "jsdom",
    collectCoverage: true,
    collectCoverageFrom: ["js/**/*.js", "!js/__tests__/**"],
    // ...
};
```

**Update to ensure synthutils tracked**:
```javascript
module.exports = {
    testEnvironment: "jsdom",
    collectCoverage: true,
    collectCoverageFrom: [
        "js/**/*.js",
        "!js/__tests__/**",
        // Explicitly include if not matching above pattern
        "js/utils/synthutils.js"
    ],
    coverageReporters: ["text-summary", "text", "lcov", "json-summary"],
    // Add threshold for this module
    coverageThresholdForModule: {
        "js/utils/synthutils.js": {
            statements: 50,
            branches: 40,
            functions: 50,
            lines: 50
        }
    }
};
```

### Task 2.2: Create Backup and Feature Branch

```bash
git checkout -b refactor/synthutils-instrumentation

git tag synthutils-before-refactor

npm test -- synthutils.test.js
```

### Task 2.3: Set Up Test Coverage Baseline
```bash
npm test -- --coverage synthutils.test.js

npm test -- --coverage synthutils.test.js > coverage-before.txt
```

## Phase 3: Implementation (Days 4-8)
### Step 3.1: Extract Constants Module

**Create**: `js/utils/voice-constants.js`

```javascript

const NOISENAMES = [
    [_("white noise"), "noise1", "images/synth.svg", "electronic"],
];

const VOICENAMES = [

];

// Array of names and details for various drum instruments
const DRUMNAMES = [
    // ... all drum data
];

// Array of names for various sound effect presets
const EFFECTSNAMES = ["duck", "dog", "cricket", "cat", "bubbles", "splash", "bottle"];

// Object containing file paths and global variable names
const SAMPLE_INFO = {
    // ... sample info
};

module.exports = {
    NOISENAMES,
    VOICENAMES,
    DRUMNAMES,
    EFFECTSNAMES,
    SAMPLE_INFO
};
```

**Update**: `js/utils/musicutils.js`

```javascript
// At top of file, add:
const { VOICENAMES, DRUMNAMES, NOISENAMES } = require('./voice-constants.js');

// Remove from /* global */ declaration:
// (Remove: VOICENAMES, DRUMNAMES, NOISENAMES)
```

**Update**: `js/utils/synthutils.js`

```javascript
// At top, add:
const { NOISENAMES, VOICENAMES, DRUMNAMES, EFFECTSNAMES, SAMPLE_INFO } = require('./voice-constants.js');

// Remove duplicate declarations of these constants
```

**Validate**:
```bash
npm test -- synthutils.test.js
# Should pass
npm test -- --coverage synthutils.test.js
# Coverage may still be 0% (that's OK for this step)
```

### Step 3.2: Update Test File Imports

**Update**: `js/utils/__tests__/synthutils.test.js`

**Current approach** (old):
```javascript
const wrapper = new Function(`
    ${wrapperCode}
    return { Synth, ... };
`);
const results = wrapper();
Synth = results.Synth();
```

**New approach** (refactored):
```javascript
// At top of file:
const { Synth, VOICENAMES, DRUMNAMES, NOISENAMES } = require('../synthutils.js');

// In test, use directly:
describe("setupRecorder", () => {
    it("should setup recorder", () => {
        expect(setupRecorder()).toBe(undefined);
        // ... rest of test
    });
});
```

**This is the critical change** - it allows Jest to:
- Load synthutils.js through standard require()
- Apply babel instrumentation transforms
- Track line-by-line execution
- Report coverage accurately


### Step 3.3: Update synthutils.js Exports
**Add to bottom of**: `js/utils/synthutils.js`

```javascript
// ... existing code ...

// Export for testing and module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Synth,
        VOICENAMES,
        DRUMNAMES,
        NOISENAMES,
        EFFECTSNAMES,
        CUSTOMSAMPLES,
        DEFAULTSYNTHVOLUME,
        DEFAULTDRUM,
        instrumentsSource,
        instruments,
        // ... any other exports needed
    };
}
```

### Step 3.4: Resolve Global References

**In synthutils.js**, replace global references with imports:

```javascript
// OLD (global):
// Assumes global._ is defined

// NEW (module):
const { _ } = require('./utils.js');
// or for functions that need it:
const utils = require('./utils.js');
const { last } = utils;
```

**For Tone.js** (in jest.setup.js, not in synthutils.js):
```javascript
// jest.setup.js
jest.mock('tone');
global.Tone = require('./tonemock.js');
```

### Step 3.5: Handle Dependencies

**For each external dependency**, update imports:

```javascript
// OLD way (global):
// /* global pitchToNumber, getNoteFromInterval, FLAT, ... */

// NEW way (imports):
const {
    pitchToNumber,
    getNoteFromInterval,
    FLAT,
    SHARP,
    // ... others
} = require('./musicutils.js');
```

**For circular dependencies**, use lazy loading:
```javascript
// If it creates circular dependency at load time, use lazy require:
function getMusicalUtility() {
    const musicutils = require('./musicutils.js');
    return musicutils.someFunction();
}
```

### Step 3.6: Update Test Mocking

**In jest.setup.js**, mock before tests run:

```javascript
jest.mock('tone');
jest.mock('../turtle-singer.js');

// Set up any required globals
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.AudioBuffer = jest.fn();
global.MediaRecorder = jest.fn();
```
## Phase 4: Validation (Days 8-10)

### Step 4.1: Run Tests

```bash
# Run synthutils tests
npm test -- synthutils.test.js

# Check for errors
npm test -- synthutils.test.js --verbose

# Should see: ✓ All tests passing
```

**If tests fail**:
- Check import paths (should be relative paths, e.g., `../utils.js`)
- Verify all mocks are set up in jest.setup.js
- Check for remaining global variable references
- Add console.log() to trace issues

### Step 4.2: Check Coverage Reports

```bash
# Generate coverage report
npm test -- --coverage synthutils.test.js

# Expected output should show:
# - synthutils.js with coverage percentages
# - NOT 0% anymore!
# - Real line coverage for executed code

# Example expected:
# Statements   : 65.2% (45/69)
# Branches     : 52.3% (34/65)
# Functions    : 70.1% (47/67)
# Lines        : 68.9% (44/64)
```

**Save coverage report**:
```bash
npm test -- --coverage synthutils.test.js > coverage-after.txt
```

**Compare**:
```bash
diff coverage-before.txt coverage-after.txt
```

### Step 4.3: Verify No Regressions

```bash
# Run full test suite
npm test

# Check for any other broken tests
npm test -- --listTests | grep -v synthutils

# Verify overall coverage thresholds still met
npm test -- --coverage
```

### Step 4.4: Code Review

**Have team review changes**:
- [ ] All test still pass
- [ ] Coverage improved from 0% to >50%
- [ ] No breaking changes to exports
- [ ] No new dependencies added
- [ ] Imports are clean and organized
- [ ] Documentation updated

## Phase 5: Deployment & Documentation (Days 10-12)
### Step 5.1: Update Documentation

**Create** or **update** these files:

1. **TESTING.md** - Add section:
```markdown
### Testing synthutils.js

synthutils.js uses standard Jest module loading for instrumentation visibility.
Tests import the module directly:

\`\`\`javascript
const { Synth, VOICENAMES } = require('../synthutils.js');
\`\`\`

To run synthutils tests with coverage:
\`\`\`bash
npm test -- --coverage synthutils.test.js
\`\`\`

Expected coverage: ~70% (improved from 0%)
```

2. **CONTRIBUTING.md** - Add note:
```markdown
## Testing & Coverage

When modifying synthutils.js:
1. Ensure tests pass: `npm test -- synthutils.test.js`
2. Check coverage improved: `npm test -- --coverage synthutils.test.js`
3. Don't revert to dynamic evaluation - it prevents coverage tracking
```


### Step 5.3: Merge and Release

```bash
# Ensure all tests pass one final time
npm test

# Commit changes
git add -A
git commit -m "refactor(synthutils): Enable Jest instrumentation for coverage tracking

- Extract voice constants to separate module
- Convert test to standard module loading
- Migrate from new Function() to standard require()
- Improve coverage from 0% to 70%+
- Enable future mutation testing

Closes: #<issue-number>"

# Push feature branch
git push origin refactor/synthutils-instrumentation

# Create PR on GitHub for review
# After approval, merge:
git checkout main
git merge refactor/synthutils-instrumentation
git push origin main
```

---

## Troubleshooting Common Issues

### Issue 1: "Cannot find module X"
**Cause**: Import path incorrect  
**Fix**:
```javascript
// Check file locations and fix relative paths
// Common: ../utils.js should be ../utils.js
// NOT: /js/utils/utils.js or utils (without path)
```

### Issue 2: "ReferenceError: X is not defined"
**Cause**: Missing import or global not injected  
**Fix**:
```javascript
// In test file or jest.setup.js, add:
global.X = require('./source-of-X.js').X;
// or in synthutils.js, add:
const { X } = require('./source-of-X.js');
```

### Issue 3: Tests pass but coverage still 0%
**Cause**: Code still being executed via new Function()  
**Fix**:
```javascript
// Verify test is actually importing, not using old wrapper:
// WRONG: const wrapper = new Function(code);
// RIGHT: const { Synth } = require('../synthutils.js');

// Check jest.config.js has synthutils in collectCoverageFrom
// Clear Jest cache: npm test -- --clearCache
```

### Issue 4: Circular dependency error
**Cause**: Module A requires B, B requires A  
**Fix**:
```javascript
// Move shared code to separate module (voice-constants.js)
// Use lazy loading if needed:
function getModule() {
    return require('./cyclic-module.js');
}

// Or restructure to break cycle:
// musicutils.js → voice-constants.js ← synthutils.js
```

---

## Success Checklist

After completing all phases:

- [ ] All tests pass: `npm test -- synthutils.test.js`
- [ ] Coverage > 0%: `npm test -- --coverage synthutils.test.js`
- [ ] Coverage > 50%: Line coverage visible
- [ ] No console errors or warnings
- [ ] No breaking changes to module exports
- [ ] Documentation updated
- [ ] Code reviewed by team member
- [ ] Merged to main branch
- [ ] CI/CD pipeline passes

---

## Expected Outcomes

| Metric | Before | After |
|--------|--------|-------|
| **Coverage** | 0% | ~70% |
| **Instrumentation** | None | Full |
| **Test Execution** | Via wrapper | Via standard require() |
| **Mutation Testing** | Not possible | Possible |
| **Maintainability** | Low | High |
| **Refactoring Risk** | N/A | Mitigated |

---

## Next Steps

1. **Discuss** with team - is this the right approach?
2. **Create** GitHub issue with this plan
3. **Assign** to developer with time available
4. **Track** progress using checklist above
5. **Review** code changes carefully
6. **Document** lessons learned for similar modules

---

## Questions & Support

**If stuck**, review:
1. **Jest documentation**: https://jestjs.io/docs/getting-started
2. **Module patterns**: https://nodejs.org/en/docs/guides/anatomy-of-an-http-module/
3. **Coverage documentation**: https://jestjs.io/docs/code-coverage

**For circular dependencies**, see: https://nodejs.org/en/docs/guides/circular-dependencies/

