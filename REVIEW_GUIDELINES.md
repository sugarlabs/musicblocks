# Review Guidelines

## For Contributors (before opening a PR)
- Run `npm test` locally — ensure no new test failures are introduced
- Run `npx prettier --write <changed files>` before pushing
- Always rebase on master before requesting review
  (`git fetch upstream && git rebase upstream/master`)
- DCO sign-off is required on every commit (`git commit -s`)
- Keep PRs focused — no unrelated changes
- Check license headers are present where applicable
- PR description should match the actual code changes

## For Reviewers
- Run the test suite when block behavior changes are involved
- Check for pre-existing failures vs PR-introduced ones
- Verify mock property names in tests match source code
- Check for XSS, unsafe URL handling, inline JS issues
- Write `LGTM` when the code is approved

## Contributor Journey
1. Start with small fixes and suggest changes
2. After 8-10 merged PRs, request approval rights
3. With experience, propose performance improvements
   and new features — discuss with mentors first