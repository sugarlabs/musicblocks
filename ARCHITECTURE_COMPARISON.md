# Architecture Comparison: Current vs. Proposed

### Characteristics of Current Approach
- **Pros**: Works with global namespaces, browser globals work as-is
- **Cons**: Coverage invisible, instrumenting invisible, harder to debug coverage issues

### Characteristics of Direct Module Approach
- **Pros**: Full coverage visibility, standard Jest patterns, easier debugging
- **Cons**: Requires refactoring, may need global-to-module dependency conversion

## Architecture Comparison Table
| Aspect | Current (Dynamic Eval) | Option 1 (Modules) | Option 2 (Transformer) | Option 3 (Hybrid) |
| **Coverage Visibility** | 0% | ~70% | ~40-60% | ~70% |
| **Instrumentation** | Hidden | Full | Partial | Full |
| **Refactoring Needed** | None | Significant | Minimal | Incremental |
| **Risk Level** | Low | Medium | Low | Low-Medium |
| **Implementation Time** | 0 (current) | 1-2 weeks | 2-5 days | 3 weeks |
| **Module Pattern** | Legacy Script | ES6/CommonJS | Legacy Script | ES6/CommonJS |
| **Mutation Testing** | Not possible | Possible | Limited | Possible |
| **Maintenance** | Moderate | Low | Medium | Low |
| **Long-term Viability** | Poor | Excellent | Fair | Excellent |


### Key Refactoring Tasks
1. **Extract Utility Functions**
   ```javascript
   // FROM: window._ assumed to exist globally
   // TO:   import { _ } from './utils.js'
   ```

2. **Create Module Exports**
   ```javascript
   // FROM: const VOICENAMES = [...]
   //       // Assumed in global scope
   // TO:   module.exports = { VOICENAMES, ... }
   ```

3. **Resolve Circular Dependencies**
   ```javascript
   // If musicutils.js needs VOICENAMES from synthutils.js
   // AND synthutils.js needs functions from musicutils.js
   // → Need to reorganize or use lazy loading
   ```

4. **Update Test Imports**
   ```javascript
   // FROM: (dynamic wrapper that returns Synth)
   // TO:   const { Synth } = require('../synthutils.js')
   ```

## Implementation Checklist by Option
### Option 1: Direct Refactoring
- [ ] Create detailed dependency map
- [ ] Identify circular dependencies
- [ ] Plan export strategy
- [ ] Create feature branch
- [ ] Extract core utilities first
- [ ] Update imports incrementally
- [ ] Verify tests pass at each step
- [ ] Run coverage reporting
- [ ] Code review and merge
- [ ] Document changes

### Option 2: Babel Transformer
- [ ] Create Jest transformer plugin
- [ ] Test transformer with sample
- [ ] Update jest.config.js
- [ ] Verify coverage reports
- [ ] Document transformer purpose
- [ ] Add to CI pipeline

### Option 3: Hybrid Approach
- [ ] **Week 1**: Complete Option 2 checklist (fast partial fix)
- [ ] **Week 2**: Start extracting core modules
- [ ] **Week 3**: Complete Option 1 checklist (full fix)

### Option 4: Documentation
- [ ] Document why dynamic eval exists
- [ ] Create coverage assessment
- [ ] Write future improvement roadmap
- [ ] Share with team
- [ ] Link from test suite comments

## Success Metrics for Each Option
| Option | Primary Metric | Secondary Metrics | Success Threshold |
| **1** | Coverage > 70% | Tests pass, no perf regression | All metrics met |
| **2** | Coverage > 40% | Partial instrumentation visible | Coverage metric met |
| **3** | Coverage > 70% (by week 3) | Incremental improvements | All metrics met |
| **4** | Documentation complete | Team understanding | All metrics met |

## Risk Assessment
### Option 1: Direct Refactoring
- **Risk**: Medium (circular dependencies, breaking changes)
- **Mitigation**: Incremental changes, comprehensive tests, code review
- **Rollback**: Fairly easy (keep old version in git)

### Option 2: Babel Transformer
- **Risk**: Low (isolated, non-breaking)
- **Mitigation**: Test with sample code first
- **Rollback**: Remove jest.config change and transformer

### Option 3: Hybrid Approach
- **Risk**: Low-Medium (phased rollout)
- **Mitigation**: Complete each phase before moving to next
- **Rollback**: Easy per phase

### Option 4: Documentation
- **Risk**: None (documentation only)
- **Mitigation**: N/A
- **Rollback**: N/A

