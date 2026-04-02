# CI Pipeline Documentation

Last updated: March 2026 by @Jenish-1235

## What's Here

Music Blocks has 9 GitHub Actions workflows that handle code quality checks. This doc explains what each one does, how they're triggered, and what needs fixing.

**What works:**
- Tests run on PRs (Jest, Cypress, Lighthouse)
- Linting catches style issues
- Security scans check dependencies
- PRs need to be categorized

**What's missing:**
- No automated deployments
- No release process
- Docker setup is broken
- No preview environments for testing PRs

---

## The Workflows

### 1. Smoke Test (`node.js.yml`)

Runs on: Push to master, PRs to master  
Tests: Node 20.x and 22.x

Basic sanity check - installs dependencies with `npm ci` and tries to run `npm run build --if-present`. 

**Problem:** There's no `build` script in package.json, so the build step doesn't actually do anything. The Gulp build system exists but CI never uses it.

### 2. Linting (`linter.yml`)

Runs on: PRs only

Checks ESLint and Prettier on changed JavaScript files. Only looks at files you modified, not the whole codebase. Doesn't run on direct pushes to master.

### 3. Jest Tests (`pr-jest-tests.yml`)

Runs on: PRs (uses `pull_request_target`)  
Permission: Can write comments and labels

Runs all test files and posts results as a comment on your PR. Shows pass/fail and test duration.

**Issues:**
- Uses `npm install` instead of `npm ci`
- No coverage requirements - PRs can merge with 0% coverage
- Coverage data isn't posted to PRs

### 4. Cypress E2E (`pr-cypress-e2e.yml`)

Runs on: PRs and pushes to master

Browser tests using Cypress. Only has one test file right now (`cypress/e2e/main.cy.js`) that checks basic UI stuff - loading, audio controls, toolbar buttons, file operations.

**Limitations:**
- Chrome only
- Test isolation is off - tests share state
- No video recording in CI

### 5. Lighthouse (`lighthouse-ci.yml`)

Runs on: PRs and pushes to master (uses `pull_request_target`)

Performance audit. Runs 3 times and averages the scores. Posts results as a comment with those colored badges.

Current thresholds (see `lighthouserc.js`):
- Performance: 50+
- Accessibility: 80+
- Best Practices: 80+
- SEO: 80+

**Catch:** All thresholds are set to "warn" only - they never actually fail the build.

### 6. Security Scan (`security_scan.yml`)

Runs on: Push to main (?), PRs, manual trigger

Just runs `npm audit --audit-level=high`.

**BUG:** Triggers on push to `main` branch, but our default branch is `master`. So it never runs on actual merges to master. Also uses `npm install` instead of `npm ci`, and audit failures don't actually fail the workflow.

### 7. PR Category Check (`pr-category-check.yml`)

Runs on: PR open/edit/sync (uses `pull_request_target`)

Makes sure you checked one of the category boxes in the PR template (Bug Fix, Feature, Performance, etc.). Fails if you didn't check anything. Auto-creates labels and applies them.

This is the only workflow that can actually block a merge based on PR metadata.

### 8. Stale PR Cleanup (`stale.yml`)

Runs: Daily at 7:30 PM UTC

Marks PRs stale after 60 days of inactivity, closes them after 3 more days.

**Note:** Uses `actions/stale@v3` which is pretty old (v9 is current).

### 9. Translation Sync (`po-to-json-validation.yml`)

Runs on: Push (only if `.po` files changed)

Runs the Python script that converts translation files. Fails if you committed `.po` changes but forgot to regenerate the JSON files.

---

## When Things Run

| Workflow | Push to master | PR | Scheduled | Manual |
|----------|:--------------:|:--:|:---------:|:------:|
| Smoke Test | Yes | Yes | - | - |
| Linting | - | Yes | - | - |
| Jest | - | Yes* | - | - |
| Cypress | Yes | Yes | - | - |
| Lighthouse | Yes | Yes* | - | - |
| Security | (broken) | Yes | - | Yes |
| PR Category | - | Yes* | - | - |
| Stale Cleanup | - | - | Daily | Yes |
| Translation | Yes** | - | - | - |

\* Uses `pull_request_target` (runs with write permissions)  
\*\* Only when `.po` files change

---

## Action Versions

Everything's up to date except:

- `actions/stale` is on v3, latest is v9 (3 major versions behind)

Everything else (checkout@v4, setup-node@v4, etc.) is current.

---

## Test Setup

**Jest:**
- Uses jsdom for browser simulation
- Covers core logic, blocks, widgets, turtle actions, export functionality
- No coverage thresholds set

**Cypress:**
- Just one spec file for now
- Runs at 1400x1000 resolution
- Chrome only
- Video recording disabled to save CI time

---

## Build System

**Gulp:** We have a `gulpfile.mjs` with tasks for transpiling JS, minifying CSS, compiling Sass. Outputs to `dist/`. But CI never runs it because there's no `build` script in package.json.

**Express:** The `index.js` server has different caching rules for dev vs production. In production it caches for 1 hour with ETags.

**Docker:** There's a `dockerfile` but it's broken - uses Python's http.server instead of Node, doesn't install dependencies, doesn't build anything. Not used anywhere.

---

## What Needs Fixing

**Critical:**
1. Security workflow triggers on wrong branch (`main` vs `master`)
2. Gulp build never runs in CI

**Should fix soon:**
3. Update stale action to v9
4. Sync package.json version (shows 3.4.1, latest tag is 3.7.1)
5. Use `npm ci` instead of `npm install` in Jest and security workflows

**Nice to have:**
6. Make security audit actually fail on vulnerabilities
7. Enforce coverage thresholds
8. Add coverage reports to PR comments
9. Test in Firefox and Edge, not just Chrome
10. Make some Lighthouse thresholds fail builds (not just warn)

---

## Config Files Reference

- `package.json` - Dependencies and scripts
- `.nvmrc` - Node version (20)
- `jest.config.js` - Test config
- `cypress.config.js` - E2E test config
- `eslint.config.mjs` - Linting rules
- `lighthouserc.js` - Performance thresholds
- `gulpfile.mjs` - Build tasks
- `dockerfile` - Container setup (currently broken)

---

## Terms

- **CI** - Continuous Integration (automated testing)
- **CD** - Continuous Deployment (automated releases)
- **E2E** - End-to-end testing in actual browsers
- **`pull_request_target`** - Special trigger that gives workflows write access (needed for commenting on PRs)
- **Sunjammer** - The Sugar Labs server where Music Blocks is currently deployed manually
