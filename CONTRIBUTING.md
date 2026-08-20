## <a name="CONTRIBUTING"></a>Contributing

We welcome contributions of all kinds — whether it’s code,
documentation, music, lesson plans, artwork, or ideas. Music Blocks
is a community-driven project, and every meaningful contribution helps
improve the platform for learners and educators around the world.

If you’re new to the project, start by setting up the local
development environment using the guide linked below, then explore
open issues or discussions to find a place to contribute.

- [How to set up a local server](README.md#how-to-set-up-a-local-server)

### Special Notes

Music Blocks is being built from the ground-up, to address several
architectural problems with this run. Since Music Blocks is a fork of
Turtle Blocks JS, musical functionality was added on top of it.
However, music is fundamental to Music Blocks. Besides, the Turtle
Blocks JS started initially with handful of features and was written
without a complex architecture. As Music Blocks was built on top of
that, it became incrementally complex, but the architecture remained
simple, thus resulting in a monolith. Also, the functionality is
tightly coupled with the interface and native client API (Web API).

Keeping these problems in mind, we have considered a foundational
rebuild that will address all these issues, whilst adding buffers for
future additions. Additionally, we will make use of a more elegant
tech-stack to develop and maintain this project given its scale. After
the core is built, we'll be porting features from this application to
it.

Refer to the repository
[**sugarlabs/musicblocks-v4**](https://github.com/sugarlabs/musicblocks-v4)
for more information about the new project &mdash; _Music Blocks 4.0_.

### Tech Stack

Music Blocks is a Web Application and is written using browser
technologies &mdash; `HTML`, `CSS` (`SCSS`), `JavaScript`, `SVG`, etc.

If you're just getting started with development, you may refer to the
following resources:

- [HTML tutorial - w3schools.com](https://www.w3schools.com/html/default.asp)
- [HTML reference - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/HTML)
- [CSS tutorial - w3schools.com](https://www.w3schools.com/css/default.asp)
- [CSS reference - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS)
- [JavaScript tutorial - w3schools.com](https://www.w3schools.com/js/default.asp)
- [JavaScript reference - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

For code contributions, please follow these general [guidelines for
contributions](https://github.com/sugarlabs/sugar-docs/blob/master/src/contributing.md).

### AI guidelines

Follow [AI guidelines for Sugar Labs](https://github.com/sugarlabs/sugar-docs/blob/master/src/contributing.md#ai-guidelines-for-sugar-labs)

AI-assisted development tools (such as GitHub Copilot, ChatGPT, Cursor, Claude,
or similar systems) may be used to support contributions. However, contributors
remain fully responsible for any code they submit.

When using AI tools, please follow these guidelines:

- **Understand the code** - Do not submit code that you do not fully understand.
  Contributors must be able to explain and maintain their changes.
- **Review carefully** - AI-generated code can contain errors, security issues,
  or incorrect assumptions. Always review outputs critically.
- **Follow project conventions** - Ensure that generated code matches the existing
  coding style, architecture, and design patterns used in the repository.
- **Test thoroughly** - AI-assisted changes must pass all project checks. Run
  linting, formatting, and test commands before submitting.
- **Avoid large blind changes** - Large-scale automated modifications should be
  reviewed incrementally and preferably split into smaller, focused pull requests.
- **Licensing awareness** - Ensure that generated content does not introduce
  incompatible licensed material or copied external code without attribution.
- **Architecture awareness** - Prefer small, incremental AI-assisted changes that
  align with existing architecture rather than large structural rewrites.

Mentioning AI assistance in your pull request description is optional but encouraged
for transparency.

#### Using AI/LLM tools for code changes

AI tools such as ChatGPT, Copilot, or other LLMs may assist contributors
in understanding the codebase or drafting code changes. However,
contributors remain fully responsible for the code they submit.

When using AI tools:

- Ensure you understand the generated code before including it in a pull request.
- Verify that the code follows project style and architecture.
- Avoid submitting large AI-generated patches without manual review.
- Run linting, formatting, and tests before submitting changes.
- Ensure the generated code does not introduce licensing issues.

#### AI-assisted pull requests

If AI tools were used while preparing a pull request:

- Clearly review and test all generated changes.
- Keep pull requests small and focused.
- Avoid submitting unrelated modifications suggested by AI.
- Be prepared to explain the reasoning behind the changes during review.

AI tools should assist development, but they should not replace
understanding of the codebase.

### Before You Push

For detailed testing guidance, including the shared test infrastructure and reusable test utilities, see the [Testing Guide](Docs/TESTING.md#shared-test-infrastructure).

Run these commands locally before submitting a PR:

```bash
npm run lint              # ESLint
npx prettier --check .    # Formatting
npm test                  # Jest
```

NOTE: Only run `prettier` on the files you have modified.

If formatting fails, run `npx prettier --write .` to fix it.

### Developer Certificate of Origin (DCO)

Every commit must include a `Signed-off-by` trailer certifying you wrote the
change or otherwise have the right to submit it under the project's license
(see the [Developer Certificate of Origin](https://developercertificate.org/)
for the full text). A CI check enforces this on every pull request.

Add the trailer automatically with the `-s` flag:

```bash
git commit -s -m "docs: add AI contribution guidelines (Related to #XXXX)"
```

Forgot it on a commit that's already made? Fix it with:

```bash
git commit -s --amend                # amends only the last commit
git rebase --signoff master          # adds it to every commit on the branch
```

Then force-push the branch: `git push --force-with-lease`.

### Creating Pull Requests

Follow these steps when contributing:

1.  **Create a new branch**

    ```
    git checkout -b docs/issue-number-short-description
    ```

2.  Make your changes following project guidelines.

3.  Run required checks before pushing:

    ```
    npm run lint
    npx prettier --check .
    npm test
    ```

4.  Commit with clear, descriptive messages:

    ```
    git commit -s -m "docs: add AI contribution guidelines (Related to #XXXX)"
    ```

5.  Push your branch:

    ```
    git push origin branch-name
    ```

6.  **Open a Pull Request:**
    - Use a Conventional Commit title: `<type>: <subject>` (for example,
      `fix: correct drag offset on touch devices`). Allowed types are
      `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `i18n`, `perf`, `refactor`,
      `revert`, `style`, and `test`. The title is linted by
      `pr-title-check.yml`. See [Releases and the Changelog](#releases-and-the-changelog)
      for why this matters when a PR is squash-merged.
    - Link the related issue using `Related to #XXXX` or `Partially addresses #XXXX`.
    - Explain what changed and why.
    - Keep pull requests focused on a single topic or feature.

7.  Respond to review feedback and update your branch as needed.

### Draft Pull Requests

Draft pull requests are for work that is still in progress. Opening
one early is encouraged — it shares your progress, makes your work
visible so others don't duplicate it, and is a good way to ask for
occasional high-level feedback on your direction.

While a PR is in draft, maintainers are not expected to perform a full
code review; feedback, when given, is usually brief and high-level.
Comprehensive review should generally be expected only after the PR is
marked **Ready for Review**.

When you believe your work is complete, tested, and ready for detailed
review, convert the PR from draft to **Ready for Review**. This is the
signal maintainers use to begin a thorough review.

### Review Expectations

Maintainers and reviewers decide when and how to review based on
project priorities and reviewer availability.

- Avoid repeatedly requesting full reviews while a PR is still marked
  as draft.
- Review comments should remain focused on improving the code.

### Respectful Communication

Keep discussions professional, respectful, and focused on the code.

- If there is disagreement about the review process, discuss it calmly
  without personal arguments.
- Avoid confrontational language and assume good intent from everyone
  involved.

### Reviews and Area Ownership

All reviews are welcome. Reviewing pull requests is a good way to help the
project and learn from other contributors.

Some parts of the project have Area Approvers. Their approval, or approval from
a Project Maintainer, is required before a pull request can be merged.

See [GOVERNANCE.md](GOVERNANCE.md) for the review flow and
[MAINTAINERS.md](MAINTAINERS.md) for the current areas and maintainers.

### Keeping Your PR Up-to-Date

Our CI automatically rebases your PR onto the latest `master` whenever
new changes are merged. For this to work on fork PRs, you **must** enable
**"Allow edits from maintainers"** when creating your PR.

> **Note:** This checkbox only grants maintainers push access to the
> _specific branch_ associated with your PR. It does **not** affect
> your fork's other branches or settings.

If your PR develops merge conflicts that can't be auto-resolved, our bot
will label it with `needs-rebase` and comment with step-by-step rebase
instructions.

**Manual rebase (if needed):**

```bash
# Add the upstream remote (one-time setup)
git remote add upstream https://github.com/sugarlabs/musicblocks.git

# Fetch the latest changes and rebase
git fetch upstream
git rebase upstream/master

# Resolve any conflicts in your editor, then:
git add .
git rebase --continue

# Push the updated branch
git push --force-with-lease origin your-branch-name
```

> **Tip:** Enable **"Allow edits from maintainers"** on your PR so
> maintainers and our automation can keep your branch current. This
> setting only applies to the PR branch. Your other branches and
> fork settings are not affected.

### After your PR is merged

Please note that production deployments of Music Blocks are **manual**.

This means that even after your pull request is merged, your changes may not immediately appear. Your update will become visible after the next official release is deployed.

If your changes are not visible right away, it does **not** indicate a problem with your PR or implementation.

This note is included to prevent contributors from spending time debugging caching or deployment issues unnecessarily.

### Releases and the Changelog

[CHANGELOG.md](CHANGELOG.md) is generated, not hand-written. It is
maintained by [release-please](https://github.com/googleapis/release-please)
from the Conventional Commit messages that land on `master` — the same
format already enforced by the `commitlint` job on every PR.

What this means for you as a contributor:

- Write a real Conventional Commit subject. It becomes the changelog
  line verbatim, so `fix(palette): correct drag offset on touch devices`
  reads well and `fix: stuff` does not.
- Only the `feat` changelog section is visible to users in the release notes.
  `fix`, `perf`, `docs`, and `revert` are still valid commit types and still
  required to pass linting, but they are hidden from the user-facing release
  notes so the changelog focuses on what shipped for end users.
  `build`, `chore`, `ci`, `i18n`, `refactor`, `style`, and `test` are also
  valid commit types and are excluded automatically. Two of those are
  deliberate policy rather than housekeeping: **added or changed tests** and
  **pure refactors** are not listed in release notes. A refactor changes no
  behaviour by definition, and tests matter to reviewers rather than to the
  people reading what shipped. Commit them as `test:` / `refactor:` and they
  are excluded automatically.
- Release notes use GitHub's generated changelog notes, so contributor credit is
  included automatically for every merged PR in the release window, even if a
  contributor only opened a single PR. This is generated by the release
  automation and does not require manual editing.
- Hiding a type is not purely cosmetic. release-please skips creating a
  release PR entirely when every commit since the last release is a hidden
  type (it treats the rendered notes being empty as "no user-facing
  changes"). So a stretch of pure refactor or test work will no longer
  open a release PR on its own — which is intended, but worth knowing if
  you are waiting for one to appear.
- Version bumps are computed separately from all of this: `feat` bumps the
  minor, a breaking change bumps the major, and **every other type bumps
  the patch** — including `docs`, `refactor`, `chore`, and `test`. Hidden
  types therefore still influence the version number of a release that is
  going out for other reasons; they just do not print a line.
- A `BREAKING CHANGE:` footer (or a `!` after the type, e.g. `feat!:`)
  triggers a major version bump and its own changelog section.
- Never edit the version sections of `CHANGELOG.md` by hand — the next
  release run would overwrite your changes.
- **Your PR title must also be a Conventional Commit.** If your PR is
  squash-merged, the title becomes the single commit on `master`, and
  that title — not your individual commits — is what the changelog is
  built from. Both are linted: commits by the `commitlint` job in
  `ci.yml`, the title by `pr-title-check.yml`. Renaming a PR re-runs the
  title check, so a red title check clears once you fix the title.

What this means for maintainers:

Pushes to `master` keep a `chore(release): vX.Y.Z` pull request open and
up to date. Nothing is published while it sits there; it just accumulates
entries. Merging it bumps the version in `package.json`, commits the
changelog, tags `vX.Y.Z`, and cuts the GitHub release. Deployment remains
manual, as noted above.

Releases here are infrequent — the tag history averages two to three a
year — so expect that PR to stay open for a long stretch and to grow
large. That is normal: release-please rewrites the same PR on every push
rather than opening new ones. If it is closed, the next push to `master`
recreates it. A long-lived release PR is safe only because
`commit-search-depth` is sized for it; see point 4 below before lowering
that value.

Two things to check when adopting this, and one to clean up later:

1.  **Branch protection.** The release PR is opened by the default
    `GITHUB_TOKEN`, and GitHub does not let a `GITHUB_TOKEN`-driven event
    start other workflow runs — so CI never runs on the release PR. If
    `master` requires status checks to pass, those checks stay pending
    forever and the release PR cannot be merged normally. There is no way
    to express "exempt this one PR": ruleset bypass actors key off who
    performs the merge, and that is a human maintainer, so exempting them
    exempts every PR they touch. The two real options are:
    - Give the action a GitHub App token or PAT, so its PR triggers CI like
      any other. This costs least-privilege but keeps the merge normal.
    - Leave `GITHUB_TOKEN` and have an admin bypass the checks on each
      release. This is the recommended option at any plausible cadence for
      this project: even at one release a month it is twelve admin merges
      a year, which is not worth holding a long-lived PAT to avoid.

    Also note that if `master` has required checks, `pr-title-check.yml`
    should be added to that set — otherwise a bad PR title is advisory
    only and can still be squash-merged, which is the exact failure this
    setup is meant to prevent.

2.  **Post-release steps belong in `release-please.yml`.** The same
    restriction means a workflow triggered by `release: [published]` or
    `push: tags: ['v*']` will never fire for these releases. Build,
    publish, or notify steps must be downstream jobs in that workflow,
    gated on its `release_created` output.
3.  **`last-release-sha` is the adoption commit, not the `v3.7.1` tag.**
    This is deliberate. There are 1,193 commits between `v3.7.1` and the
    adoption point; pointing the floor at the tag would put roughly 487
    entries — including a ~400-line "Bug Fixes" section — into the very
    first release PR, generated from subjects written before anyone knew
    they would become release notes. It would also not work as configured:
    release-please fetches at most `commit-search-depth` commits, which
    defaults to **500**, so a floor 1,193 commits back would never be
    reached without also raising that value.

    The trade-off is that work between `v3.7.1` and adoption appears in
    neither the old GitHub releases nor this changelog. `CHANGELOG.md`
    says so explicitly and points at `git log v3.7.1..` for that window.

    Once the first automated release has landed and its tag exists,
    release-please finds the previous release from the tag and this key
    becomes dead weight and a stale floor — remove it then.

4.  **`commit-search-depth` is raised to 3000, and must stay raised.**
    release-please walks back from `master` fetching at most this many
    commits, looking for the previous release. The default is 500. That
    was historically adequate here — the gaps between `v3.5.3` and
    `v3.7.1` ran 16 to 369 commits — but this repository now moves at
    roughly 210 commits a month, so a six-month release cycle is about
    1,250 commits. At the default, every release would silently truncate.

    "Silently" is the important word. If the walk hits the depth limit
    before finding its anchor, release-please does not warn or fail:

    ```js
    const index = commits.findIndex(commit => commit.sha === lastReleaseSha);
    if (index === -1) {
        return commits; // every commit it managed to fetch
    }
    ```

    You would get a plausible-looking release PR containing several
    hundred commits that belong to an earlier release, with nothing in the
    logs to say so. 3000 covers well over a year at current velocity. If
    the changelog ever looks like it reaches too far back, raise this
    before looking anywhere else.

### License Header

Music Blocks is licensed under the [AGPL](https://www.gnu.org/licenses/agpl-3.0.en.html).
If you add a new file to the Music Blocks code base, please be
sure to include a license header as per below:

```js
/**
 * MusicBlocks v3.6.2 (ADD THE UP-TO-DATE VERSION)
 *
 * @author Walter Bender (MODIFY THE AUTHOR AS NEEDED)
 *
 * @copyright 2025 Walter Bender (MODIFY THE AUTHOR AND YEAR AS NEEDED)
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
```

This header must be added at the top of **all source code files** to ensure compliance
with the project's open-source license.

### Translators

Music Blocks uses
[PO files](https://www.gnu.org/software/gettext/manual/html_node/PO-Files.html)
to maintain translations of the text strings used in the
interface. The PO files are available through an
[interactive website](https://weblate.sugarlabs.org/projects/music-blocks/music-blocks/).

Alternatively, translators can clone the
[git repo](https://github.com/sugarlabs/musicblocks.git), edit the PO files
locally, and make a pull request.

Note that once the PO files are updated, they are compiled into an INI
file, which is the file used by Music Blocks.

### New Contributors

Use the
[discussions](https://github.com/sugarlabs/musicblocks/discussions)
tab at the top of the repository to:

- Ask questions you’re wondering about.
- Share ideas.
- Engage with other community members.

Feel free. But, please don't spam :p.

### Keep in Mind

1. Your contributions need not necessarily have to address any
   discovered issue. If you encounter any, feel free to add a fix through
   a PR, or create a new issue ticket.

2. Use [labels](https://github.com/sugarlabs/musicblocks/labels) on
   your issues and PRs.

3. Please do not spam with many PRs consisting of little changes.

4. If you are addressing a bulk change, divide your commits across
   multiple PRs, and send them one at a time. The fewer the number of
   files addressed per PR, the better.

5. Communicate effectively. Go straight to the point. You don't need
   to address anyone using '_sir_'. Don't write unnecessary comments;
   don't be over-apologetic. There is no superiority hierarchy. Every
   single contribution is welcome, as long as it doesn't spam or distract
   the flow.

6. Write useful, brief commit messages. Add commit descriptions if
   necessary. PR name should speak about what it is addressing and not
   the issue. In case a PR fixes an issue, use `fixes #ticketno` or
   `closes #ticketno` in the PR's comment. Briefly explain what your PR
   is doing.

7. Always test your changes extensively before creating a PR. There's
   no sense in merging broken code. If a PR is a _work in progress
   (WIP)_, convert it to draft. It'll let the maintainers know it isn't
   ready for merging.

8. Read and revise the concepts about programming constructs you're
   dealing with. You must be clear about the behavior of the language or
   compiler/transpiler. See [JavaScript
   docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript).

9. If you have a question, do a _web search_ first. If you don't find
   any satisfactory answer, then ask it in a comment. If it is a general
   question about Music Blocks, please use the new
   [discussions](https://github.com/sugarlabs/musicblocks/discussions)
   tab on top the the repository, or the _Sugar-dev Devel
   <[sugar-devel@lists.sugarlabs.org](mailto:sugar-devel@lists.sugarlabs.org)>_
   mailing list. We also have a
   [matrix channel](https://matrix.to/#/#music-blocks:matrix.org).

10. Work on things that matter. Follow three milestones: `Port Ready`,
    `Migration`, and `Future`. Those tagged `Port Ready` are
    priority. Those tagged with `Migration` will be taken care of during
    or after the foundation rebuild. Feel free to participate in the
    conversation, adding valuable comments. Those tagged with `Future`
    need not be addressed presently.

_Please note there is no need to ask permission to work on an
issue. You should check for pull requests linked to an issue you are
addressing; if there are none, then assume nobody has done
anything. Begin to fix the problem, test, make your commits, push your
commits, then make a pull request. Mention an issue number in the pull
request, but not the commit message. These practices allow the
competition of ideas (Sugar Labs is a meritocracy)._
