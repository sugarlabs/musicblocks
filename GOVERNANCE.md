# Governance

Music Blocks uses area ownership so pull requests reach people who know the
affected part of the project. This helps reviews move without requiring every
decision to go through a single maintainer.

Everyone is welcome to review, test, and ask questions on pull requests. Those
reviews help the project and help contributors learn. To merge a pull request,
GitHub needs an approval from the relevant Area Approver or a Project
Maintainer, along with the required checks.

## Roles

### Project Maintainer

Project Maintainers are responsible for the project as a whole. They appoint
Area Approvers, resolve disagreements, and handle exceptions. They may review,
merge, or close any pull request.

### Area Approver

Area Approvers are trusted contributors for a specific part of the project.
Their approval is required before pull requests in that area can be merged.
They may merge pull requests in their area and close routine stale,
superseded, or out-of-scope pull requests with a short explanation.

### Reviewer

Reviewers are contributors with experience in an area. They review code, test
changes, and help other contributors. Their feedback is useful even when they
are not the person whose approval is required for merge.

### Contributor

Anyone may contribute. Contributors are encouraged to review pull requests,
ask questions, and grow into Reviewer or Area Approver roles over time.

## Pull Request Flow

1. A contributor opens a focused pull request.
2. GitHub requests reviews from the owners of the changed paths.
3. Contributors review, test, and discuss the change.
4. Required checks pass and the relevant Area Approver approves the pull
   request.
5. An Area Approver merges the pull request.

Some pull requests affect more than one area. The relevant Area Approvers
should review those changes. If one file spans multiple areas, its listed
owner gives the required approval and asks the other expert for input when
needed.

If an Area Approver authored a pull request or is unavailable, a Project
Maintainer may handle the pull request as an exception. The Project Maintainer
should leave a short comment explaining the exception.

Disagreements that cannot be resolved within an area should be brought to a
Project Maintainer.

## Routing Examples

| Changed files | Requested review |
| --- | --- |
| `js/blocks/NumberBlocks.js` | Blocks & Runtime |
| `js/blocks/__tests__/NumberBlocks.test.js` | Blocks & Runtime |
| `js/widgets/tempo.js` | UI/UX & Accessibility |
| `js/widgets/__tests__/tempo.test.js` | Tests & CI |
| `planet/js/Publisher.js` | Planet & Project Sharing |
| `.github/workflows/...` | Tests & CI |
| `README.md` | Project Maintainer |
| `js/widgets/tempo.js` and `js/widgets/__tests__/tempo.test.js` | UI/UX & Accessibility and Tests & CI |
| `js/widgets/tempo.js` and `planet/js/Publisher.js` | UI/UX & Accessibility and Planet & Project Sharing |
| `js/widgets/tempo.js` and `README.md` | UI/UX & Accessibility and Project Maintainer |

Feature tests stay with the same technical area when that area already has a
clear code owner, such as Blocks & Runtime or Planet. This keeps source-and-test
changes in those areas from needing an extra approval only because a matching
test changed.

Music and UI code paths request both code review and feedback on classroom
use, music behavior, and child-facing UX.
Tests in those paths go to Tests & CI, so test review is handled by people
maintaining the project's test practice. Tests that would otherwise fall back
to a Project Maintainer also go to Tests & CI. Shared test setup and CI
infrastructure go to Tests & CI.

| Situation | Approval needed for merge |
| --- | --- |
| One area has one Area Approver | Approval from that Area Approver |
| One area has more than one Area Approver | Approval from any one of them |
| A pull request changes files from two areas | Approval from each affected area |
| One file spans more than one area | Approval from its listed owner, with input from the other area when needed |

## Role Growth and Changes

Contributors may become Reviewers after making useful reviews or contributions
in an area over time. Reviewers should understand the area well enough to help
contributors and give practical feedback.

Reviewers may become Area Approvers after showing sound judgment in an area and
a willingness to help move pull requests forward. Area Approvers should
understand how changes in their area affect the rest of the project.

Role changes are made through a pull request that updates
[MAINTAINERS.md](MAINTAINERS.md). Adding or removing an Area Approver also
requires an update to [CODEOWNERS](.github/CODEOWNERS), and repository write
access must be granted before the person is added to CODEOWNERS.

A Project Maintainer approves role changes. It is fine for an area to start
with one Area Approver, but important areas should grow toward at least two
active Area Approvers when contributor capacity allows.

Area Approvers should be reasonably responsive when available. If someone is no
longer active in an area, they may move to emeritus status or be removed from
CODEOWNERS. Emergency access removal may happen immediately and should be
documented in a follow-up pull request.

## GitHub Permissions

GitHub write access applies to the whole repository. GitHub does not limit it
to individual folders. Area Approvers should use merge and close permissions
within their documented areas. Project Maintainers handle exceptions.
