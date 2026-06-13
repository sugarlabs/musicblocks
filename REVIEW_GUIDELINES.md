# Review Guidelines

> Based on discussion [#6925](https://github.com/sugarlabs/musicblocks/discussions/6925).
> This document is a living guide — contributions welcome!


## For Contributors (before opening a PR)
- Run `npm test` locally — ensure no new test failures are introduced
- Run `npx prettier --write <changed files>` before pushing
- Always rebase on master before requesting review
  (`git fetch upstream && git rebase upstream/master`)
- Keep PRs focused — **one concern per PR**, don't bundle 
  unrelated fixes together
- Check license headers are present at the top of every new file
- PR description should match the actual code changes
- Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening your first PR
- For UI/UX or feature changes, include before-and-after screenshots 
  or a short GIF demonstrating the change
- For performance-related changes, provide before-and-after benchmark 
  results or screenshots of relevant metrics with a brief explanation 
  of the measurable impact

## For Reviewers
- **Run the browser smoke test** (when applicable) — critical for UI changes
- Run the test suite when block behavior changes are involved
- Check for pre-existing failures vs PR-introduced ones
- Verify mock property names in tests match source code
- Thoroughly check folder structure especially for tests —
  new test files are sometimes created when tests could have 
  been added to existing files instead
  (e.g. `js/__tests__/` and `js/widgets/__tests__/` are different)
- Check for XSS, unsafe URL handling, inline JS issues
- Write `LGTM` when the code looks good

## Do's and Don'ts
### Do's ✅
- Keep commits atomic and well-described
- Reference related issues/discussions in PR description
- Respond to reviewer comments promptly
- Add new tests to existing test files where possible

### Don'ts ❌
- No unrelated file changes in a PR
- No lint or Jest errors
- Don't forget to rebase before requesting review
- Don't create a new test file if an existing one covers that module

## Contributor Journey
1. Start with small fixes and suggest changes
2. After 8-10 merged PRs, request approval rights
3. With experience, propose performance improvements
   and new features — discuss with mentors first