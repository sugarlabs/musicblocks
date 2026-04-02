# CI Pipeline Overview – Music Blocks

**Last updated:** March 2026 (based on PR #6152 by @Jenish-1235)  
**Status:** This document reflects the GitHub Actions setup as visible on the `master` branch (default branch). The pipeline is under active review/improvement — check recent commits in `.github/workflows/` for updates.

Music Blocks uses **9 GitHub Actions workflows** to ensure code quality, run tests, enforce PR standards, and handle maintenance tasks. This page explains what each does, when it runs, known limitations, and priority fixes.

## Key Highlights

**What works well:**
- Comprehensive PR testing (Jest unit, Cypress E2E, Lighthouse performance)
- Automatic linting on changed files
- PR category enforcement (blocks merge if missing)
- Security dependency scanning
- Translation file validation

**Current gaps & pain points:**
- No automated deployment / preview environments
- No enforced test coverage or failing builds on low coverage
- Some workflows use outdated actions or incorrect branch names
- Build step (Gulp) not integrated into CI
- Limited browser testing (Chrome only for E2E)

## Active Workflows

All workflows are in `.github/workflows/`

| # | Workflow File              | Main Triggers                          | Purpose                                                                 | Key Notes / Issues |
|---|----------------------------|----------------------------------------|-------------------------------------------------------------------------|---------------------|
| 1 | `node.js.yml`              | push/PR to `master`                    | Smoke test: installs deps (`npm ci`), attempts `npm run build`         | No `build` script exists → build step is no-op; Gulp not used in CI |
| 2 | `linter.yml`               | pull_request (changed JS files)        | Runs ESLint + Prettier only on modified files                          | Does not run on direct pushes to `master` |
| 3 | `pr-jest-tests.yml`        | pull_request (uses `pull_request_target`) | Runs Jest tests, posts results + duration as PR comment               | Uses `npm install` (not `ci`); no coverage enforcement or PR badges |
| 4 | `pr-cypress-e2e.yml`       | push/PR to `master`                    | Cypress E2E tests (basic UI/audio/file ops)                            | Chrome only; single spec file; no video recording; shared state |
| 5 | `lighthouse-ci.yml`        | pull_request / push to `master` (uses `pull_request_target`) | Lighthouse performance audits (avg of 3 runs), posts badges           | Thresholds warn-only (Performance ≥50, A11y/BP/SEO ≥80) → never fails |
| 6 | `security_scan.yml`        | push/PR, manual                        | `npm audit --audit-level=high`                                         | **Critical bug:** Triggers on `main` (not `master`); failures don't block; uses `npm install` |
| 7 | `pr-category-check.yml`    | pull_request (uses `pull_request_target`) | Enforces PR template category checkbox, auto-labels                   | Only workflow that can block merge (good!) |
| 8 | `stale.yml`                | schedule (daily)                       | Marks stale issues/PRs (60 days inactive), closes after +3 days        | Uses outdated `actions/stale@v3` (current is v9+) |
| 9 | `po-to-json-validation.yml`| push (when `.po` files change)         | Validates Python conversion of PO translations to JSON                 | Prevents forgotten JSON regeneration |

## Trigger Summary

| Workflow              | Push to `master` | Pull Request | Scheduled | Manual |
|-----------------------|------------------|--------------|-----------|--------|
| node.js.yml (Smoke)   | Yes              | Yes          | —         | —      |
| linter.yml            | —                | Yes          | —         | —      |
| pr-jest-tests.yml     | —                | Yes*         | —         | —      |
| pr-cypress-e2e.yml    | Yes              | Yes          | —         | —      |
| lighthouse-ci.yml     | Yes              | Yes*         | —         | —      |
| security_scan.yml     | (broken)         | Yes          | —         | Yes    |
| pr-category-check.yml | —                | Yes*         | —         | —      |
| stale.yml             | —                | —            | Daily     | —      |
| po-to-json-validation | Yes**            | —            | —         | —      |

*Uses `pull_request_target` (has write permissions for comments/labels)  
**Only if `.po` files are modified

## Test & Tool Details

- **Jest** (`pr-jest-tests.yml`): Uses jsdom; covers core logic, blocks, widgets, turtle, export; no coverage thresholds enforced
- **Cypress** (`pr-cypress-e2e.yml`): 1400×1000 resolution; Chrome only; one main spec file (`main.cy.js`); video disabled
- **Lighthouse** thresholds (in `lighthouserc.js`): Performance 50+, others 80+ — warn, never fail

## Build & Deployment Notes

- **Gulp** (`gulpfile.mjs`): Exists for transpiling/minifying/compiling → outputs to `dist/`; **never runs in CI** (no `build` script in `package.json`)
- **Docker**: `Dockerfile` present but broken (uses Python server, no deps install, no build step); not used in CI/CD
- **Deployment**: Manual to Sunjammer server; no GitHub Pages / auto-release pipeline

## Priority Fixes

### Critical (fix ASAP)
1. Update `security_scan.yml` trigger from `main` → `master`
2. Integrate Gulp build into smoke / core CI workflow

### High Priority
3. Upgrade `actions/stale@v3` → latest (v9+)
4. Switch `npm install` → `npm ci` in Jest & security workflows
5. Make `npm audit` failures block the security workflow

### Medium / Nice-to-have
6. Enforce minimum test coverage (e.g., fail below 70%)
7. Add coverage report badges/comments to PRs
8. Expand Cypress to Firefox/Edge
9. Convert some Lighthouse thresholds to fail (not just warn)
10. Add preview deployments for PRs (e.g., GitHub Pages per-branch)

## Related Config Files

- `package.json` – scripts & deps
- `.nvmrc` – Node 20
- `jest.config.js`
- `cypress.config.js`
- `eslint.config.mjs`
- `lighthouserc.js`
- `gulpfile.mjs`
- `Dockerfile` (broken)

## How to Keep This Doc Updated

Anyone can help!  
1. Check recent Actions runs: https://github.com/sugarlabs/musicblocks/actions  
2. View workflows: https://github.com/sugarlabs/musicblocks/tree/master/.github/workflows  
3. Comment on or update PR #6152, or open a new one referencing this issue (#6153)  
4. Use `Closes #6153` in PR description to auto-close when merged

Contributions to improve accuracy or add screenshots/examples are very welcome!