<!--
Music Blocks
Copyright (C) 2026 Sugar Labs

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
-->

# Continuous Integration Pipeline

Music Blocks uses GitHub Actions to check code quality, run tests, validate
pull requests, maintain repository metadata, and support releases. The
workflow definitions are in [`.github/workflows/`](../.github/workflows/).

This page describes the workflows currently present on `master`. When a
workflow changes, update this document in the same pull request whenever
possible.

**Related issue:** [#6153](https://github.com/sugarlabs/musicblocks/issues/6153)

**Last verified:** 2026-08-20 against `master` at commit `e0f443758`.

There are currently 11 workflow files.

## Workflows

| Workflow                                                                      | Main triggers                                                                    | Purpose                                                                                                                                                                                          |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`ci.yml`](../.github/workflows/ci.yml)                                       | Push or pull request targeting `master`                                          | Main CI: commit-message linting, changed-JavaScript lint and format checks, Node 20/22 dependency/build jobs, Jest with coverage, Cypress E2E tests, and a production-dependency security audit. |
| [`auto-rebase.yml`](../.github/workflows/auto-rebase.yml)                     | Push to `master`; manual dispatch                                                | Attempts to rebase eligible open pull requests onto the latest `master`. Pull requests marked `no-rebase`, `wip`, or `do-not-merge` are excluded.                                                |
| [`conflict-check.yml`](../.github/workflows/conflict-check.yml)               | Completion of the auto-rebase workflow; pull-request synchronization             | Applies the `needs-rebase` label and reports when a pull request still has merge conflicts after auto-rebase.                                                                                    |
| [`dco-check.yml`](../.github/workflows/dco-check.yml)                         | Pull request opened, reopened, or synchronized against `master`                  | Verifies that every non-merge commit contains a `Signed-off-by:` trailer.                                                                                                                        |
| [`label-sync.yml`](../.github/workflows/label-sync.yml)                       | Push to `master` when label definitions or this workflow change; manual dispatch | Synchronizes repository labels from [`.github/labels.yml`](../.github/labels.yml).                                                                                                               |
| [`lighthouse-ci.yml`](../.github/workflows/lighthouse-ci.yml)                 | Pull request opened, reopened, or synchronized; push to `master`                 | Runs Lighthouse audits for desktop and mobile profiles, comments results on pull requests, and uploads reports.                                                                                  |
| [`po-to-json-validation.yml`](../.github/workflows/po-to-json-validation.yml) | Push or pull request changing `po/**/*.po`                                       | Converts changed translation files and fails if the generated files in `locales/` are not committed.                                                                                             |
| [`pr-category-check.yml`](../.github/workflows/pr-category-check.yml)         | Pull request opened, edited, reopened, or synchronized                           | Requires a pull-request category checkbox and applies category, size, and area labels.                                                                                                           |
| [`pr-title-check.yml`](../.github/workflows/pr-title-check.yml)               | Pull request opened, edited, reopened, or synchronized against `master`          | Checks the pull-request title against the repository’s Conventional Commit rules.                                                                                                                |
| [`release-please.yml`](../.github/workflows/release-please.yml)               | Push to `master`; manual dispatch                                                | Maintains the release pull request and changelog with Release Please. When a release is created, it reports the released version; production deployment remains manual.                          |
| [`stale.yml`](../.github/workflows/stale.yml)                                 | Daily schedule; manual dispatch                                                  | Marks pull requests stale after 60 days without activity and closes them three days later. Issues are not managed by this workflow.                                                              |

## Pull-request checks

For a normal pull request targeting `master`, the main checks are:

1. `ci.yml` checks commits, changed JavaScript files, the build matrix, Jest,
   Cypress, and production dependencies.
2. `pr-title-check.yml` validates the pull-request title.
3. `dco-check.yml` validates commit sign-offs.
4. `pr-category-check.yml` validates the PR template and applies labels.
5. `lighthouse-ci.yml` runs desktop and mobile performance audits.
6. `conflict-check.yml` reports a conflict when automatic rebasing cannot
   make the branch mergeable.
7. `po-to-json-validation.yml` runs only when a pull request changes a PO
   translation file.

The workflows that execute pull-request code use the `pull_request` event
rather than `pull_request_target`. For pull requests from forks, GitHub does
not provide repository secrets and restricts the token available to the job.
Permissions are still workflow-specific: for example,
`lighthouse-ci.yml` executes pull-request code and requests
`pull-requests: write` and `issues: write` so it can publish results. That
permission boundary should be reviewed whenever the workflow changes.

The metadata-only workflows that need to write labels use
`pull_request_target`; they read pull-request metadata and do not check out
or execute fork code.

## Main CI details

### Commit and source checks

The `ci` workflow runs on Node.js 22 for most checks:

- `commitlint` checks all pull-request commits against the base commit.
- `lint` runs ESLint and Prettier only on changed `.js` and `.mjs` files.
- `build` installs dependencies and invokes `npm run build --if-present` on
  Node.js 20 and 22.

### Jest and coverage

The test job runs:

```bash
npm test -- --coverage --ci
```

Jest enforces the global minimums in [`jest.config.js`](../jest.config.js):

| Metric     | Minimum |
| ---------- | ------: |
| Statements |     34% |
| Branches   |     29% |
| Functions  |     41% |
| Lines      |     34% |

Coverage is uploaded to Codecov when a token is available. Codecov upload
failures do not fail the job, while the Jest thresholds still apply to every
pull request.

### Cypress

The E2E job installs dependencies, starts Music Blocks with `npm start`, waits
for `http://127.0.0.1:3000`, and runs Cypress in Chrome. Video recording is
disabled. Screenshots are uploaded when the job fails.

### Security audit

The security job runs:

```bash
npm audit --omit=dev --audit-level=high
```

It audits production dependencies at the high-severity threshold.

## Lighthouse details

`lighthouse-ci.yml` runs three Lighthouse measurements for each of the
desktop and mobile profiles. The configured assertions are warnings rather
than errors, so a score below the configured target is reported but does not
itself fail the workflow.

The current warning targets are:

- Performance: at least 0.5
- Accessibility: at least 0.8
- Best practices: at least 0.8
- SEO: at least 0.8

The detailed timing thresholds and mobile emulation settings are maintained in
[`lighthouserc.js`](../lighthouserc.js).

## Known limitations and follow-up work

These observations come from the current configuration. They are follow-up
items rather than claims that the workflows are currently failing.

| Priority      | Observation                                                                                                 | Impact                                                                                             | Suggested next step                                                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| High          | `lighthouse-ci.yml` executes pull-request code while requesting `pull-requests: write` and `issues: write`. | A code-executing workflow has more permission than the other read-only CI jobs.                    | Review whether comment publication can be isolated into a separate trusted job or reduced to the minimum required permissions.      |
| Medium        | The build job runs `npm run build --if-present`, but `package.json` does not define a `build` script.       | The job installs dependencies but currently performs no real build or application smoke test.      | Add a supported build command, or rename/rework the job so its checks match its purpose.                                            |
| Medium        | Lighthouse assertions are warning-only.                                                                     | Performance, accessibility, best-practice, and SEO regressions do not block CI.                    | Agree on stable thresholds and convert selected assertions to errors.                                                               |
| Low           | Cypress currently runs in Chrome only.                                                                      | Firefox, Edge, and other browser-specific regressions are not covered.                             | Add another browser to the matrix if the additional CI time is acceptable.                                                          |
| Low           | Codecov upload is optional for fork pull requests because repository secrets are unavailable there.         | Fork PRs still receive Jest threshold enforcement but may not receive a PR-vs-base Codecov report. | Keep the current behavior documented, or evaluate a tokenless/report-only upload strategy.                                          |
| Informational | Release deployment is intentionally manual.                                                                 | Releases are tagged and reported, but deployment is not automated.                                 | If deployment policy changes, add build, publish, or deployment steps to the release workflow with explicit permissions and review. |

## Keeping this page current

When adding, removing, or changing a workflow:

1. Update the workflow table and trigger descriptions above.
2. Update the pull-request flow if the required checks change.
3. Re-check referenced scripts and configuration files such as
   `package.json`, `jest.config.js`, and `lighthouserc.js`.
4. Re-check workflow permissions when a workflow starts executing new code or
   publishing new information.
5. Update the verification date and commit near the top of this page.
6. Mention documentation updates in the workflow change’s pull request.

The source of truth is always the workflow file itself. This document is a
contributor-friendly summary and should not replace reading a workflow before
modifying it.
