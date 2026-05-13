# synthutils.js Coverage Investigation - Quick Reference
## The Issue in One Sentence
**synthutils.js shows 0% coverage not because tests are missing, but because tests use dynamic code evaluation (`new Function()`) which bypasses Jest's coverage instrumentation.**

## Why Current Tests Exist But Show 0% Coverage
```
Source File
    ↓
fs.readFileSync() [reads as string]
    ↓
new Function() [evaluates string at runtime]
    ↓
Tests Run [behavior works]
    ↓
Istanbul Coverage Scan [can't see instrumentation]
    ↓
Coverage Report: 0%
```

## Decision Table: Which Solution?
```
Your Priorities              → Choose This Option
"Fix it properly, ignore    → Option 1: Direct 
 timeline"                      Module Loading
                                (1-2 weeks, full solution)

"Improve coverage soon,     → Option 3: Hybrid Approach
 but minimize risk"            (3 weeks, gradual)

"Get visibility now, fix     → Option 2: Babel Transformer
 structure later"              (2-5 days, partial solution)

"Document the problem,      → Option 4: Documentation
 handle later"                 (1-2 days, future-ready)

"Unsure, need more info"    → Complete Investigation 
                               Checklist below
```

## Investigation Checklist (Do This First)
If you're unsure which direction to go, answer these:

- [ ] Current Priority: How urgent is coverage visibility?
  - [ ] Critical (need this sprint)
  - [ ] Important (next quarter)
  - [ ] Nice-to-have (future improvement)

- [ ] Scope: Is this an isolated issue or broader pattern?
  - [ ] Only synthutils.js affected
  - [ ] Multiple files use this pattern
  - [ ] Entire codebase uses global pattern

- [ ] Feasibility: Can we refactor?
  - [ ] No circular dependencies blocking
  - [ ] Some circular dependencies, but manageable
  - [ ] Heavy interdependencies, risky to refactor

- [ ] Future Plans: Are there related initiatives?
  - [ ] Planned module refactoring
  - [ ] Planned test infrastructure upgrades
  - [ ] No current plans

- [ ] Coverage Goals: What's the real goal?
  - [ ] Accurate coverage reports
  - [ ] Mutation testing capability
  - [ ] Just want to see something >0%
  - [ ] Not sure

## Action Items by Solution
### Option 1: Direct Module Loading (Most Thorough)
```
Week 1:
  - Analyze synthutils.js and dependencies
  - Create refactoring plan
  - Extract independent functions
  
Week 2:
  - Refactor synthutils.js to use exports
  - Update tests to import standard modules
  - Verify all tests still pass
  
Week 3:
  - Clean up compatibility wrappers
  - Run coverage reports
  - Document new module structure
```

### Option 2: Babel Transformer (Quick Win)
```
Day 1-2:
  - Create babel transformer plugin
  - Update jest.config.js
  - Test transformer with sample code
  
Day 3-4:
  - Apply to synthutils test setup
  - Verify coverage improvement
  - Document approach
```

### Option 3: Hybrid Approach (Balanced Risk)
```
Week 1: Extract core utilities (low-risk functions)
Week 2: Refactor to standard modules
Week 3: Verify coverage visibility
```

### Option 4: Documentation (Immediate)
```
Day 1:
  - Document architecture decision
  - Explain why dynamic eval is used
  - Create manual coverage map
  
Day 2:
  - Review with team
  - Create improvement roadmap
```

---

## Key Questions For Team Discussion

1. **Architecture**: "Is the dynamic evaluation approach still necessary, or was it a historical choice?"

2. **Refactoring Risk**: "How comfortable are we refactoring synthutils.js? What could break?"

3. **Priority**: "How important is coverage visibility for this module compared to other work?"

4. **Timeline**: "Do we have time for refactoring, or do we need a quick solution?"

5. **Broader Pattern**: "Is this an isolated issue or part of a larger architectural problem?"

---

## Implementation Order Recommendation

**Start here** (in this order):
1. **Complete Investigation Checklist** (identify constraints)
2. **Team Discussion** (align on priorities)  
3. **Decision Tree** (choose solution)
4. **Create Ticket/PR** (document plan)
5. **Implement** (chosen option)
6. **Verify** (coverage reports, tests passing)
7. **Document** (explain changes, update dev guide)

## Common Misconceptions

"The tests aren't working" → Tests work fine, just not instrumented

"We need to rewrite all tests" → Depends on solution (maybe not)

"Coverage is impossible" → Very fixable with architecture change

"This is high priority" → Depends on your goals (may not be urgent)

## If You Choose Refactoring
### Critical Success Factors
- Map dependencies before starting
- Refactor incrementally (one section at a time)
- Keep tests passing during each step
- Use feature branches
- Get code review for each PR
- Document why each change was made

### Risks to Mitigate
- Circular dependency issues
- Browser global assumptions
- Tone.js integration complexity
- Test environment differences

### Success Metrics
- Coverage > 0% (shows instrumentation working)
- All tests pass (behavior unchanged)
- Coverage increases to ~70%+ (realistic for old code)
- No performance regression

## References & Resources
- [Full Investigation Report](./SYNTHUTILS_COVERAGE_INVESTIGATION.md)
- [Jest Coverage Documentation](https://jestjs.io/docs/configuration#collectcoveragefrom)
- [Dynamic Code Evaluation (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/Function)
- [Istanbul Coverage Tool](https://github.com/istanbuljs/nyc)
- [Babel Plugin Istanbul](https://github.com/istanbuljs/babel-plugin-istanbul)

## Next Steps: What To Do Now
1. **Read** the full investigation report above
2. **Answer** the Investigation Checklist
3. **Discuss** with team using the Decision Table
4. **Choose** your preferred solution approach
5. **Create** a GitHub issue/ticket with the plan
6. **Assign** to someone to start implementation
