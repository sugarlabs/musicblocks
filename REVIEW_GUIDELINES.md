# Review Guidelines

> Based on discussion [#6925](https://github.com/sugarlabs/musicblocks/discussions/6925).
> This document is a living guide — contributions welcome!


## For Contributors (before opening a PR)
**Before you start**
- Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening your first PR.

**Required checks**
- Rebase on master before requesting review (`git fetch upstream && git rebase upstream/master`).
- Run `npm test` locally and confirm no new test failures are introduced.
- Run `npx prettier --write <changed files>` before pushing.
- Sign off every commit with DCO (`git commit -s`).
- Run regression tests before submitting to catch unintended side effects:
  - Run the full test suite (`npm test`), not just the tests related to your change.
  - If you modified a shared utility function, test each affected module manually.
  - For UI changes, verify that both light and dark themes still work correctly.
  - For block behavior changes, run the browser smoke test and interact with the affected blocks manually.
  - Document the edge cases you tested in the PR description so reviewers know what was covered.

**PR hygiene**
- Keep PRs focused on one concern — don't bundle unrelated fixes together.
- Make sure the PR description matches the actual code changes.
- Include FOSS-compatible license headers at the top of every new file.
- For UI/UX or feature changes, include before-and-after screenshots or a short GIF.
- For performance-related changes, include before-and-after benchmark results with a brief explanation of the impact.

## For Reviewers
- **Run the browser smoke test** (when applicable) — critical for UI changes.
- Run the test suite when block behavior changes are involved.
- Check whether failures are pre-existing or introduced by this PR.
- Verify that mock property names in tests match the source code.
- Thoroughly check folder structure especially for tests — new test files are sometimes created when tests could have been added to existing files instead (e.g. `js/__tests__/` and `js/widgets/__tests__/` are different).
- If the PR description lists regression-testing steps, spot-check that they were actually followed.

  **Security and approval**
- Check for XSS, unsafe URL handling, inline JS issues.
- Write `LGTM` when the code looks good.

## Do's and Don'ts

### Do's ✅
- Mark PRs as **DRAFT** if they are not yet ready to merge but open for early feedback, then convert to ready when complete.
- Keep commits atomic and well-described.
- Reference related issues/discussions in PR description.
- Respond to reviewer comments promptly.
- Add new tests to existing test files where relevant.

### Don'ts ❌
- Don't include unrelated file changes in a PR.
- Don't leave lint or Jest errors unresolved.
- Don't skip rebasing before requesting review.
- Don't create a new test file if an existing one already covers that module.