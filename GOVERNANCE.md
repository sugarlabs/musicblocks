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

The role lists can change as contributors take on new responsibilities or step
back from active work. Role changes should be public, lightweight, and based on
visible project work.

### Quick reference

| Role change | Files to edit | Ask for review from | Adds merge authority? |
| --- | --- | --- | --- |
| Add or remove a Reviewer | [MAINTAINERS.md](MAINTAINERS.md) | A Project Maintainer; Area Approvers for the area, if any | No |
| Add or remove an Area Approver | [MAINTAINERS.md](MAINTAINERS.md) and [CODEOWNERS](.github/CODEOWNERS) | A Project Maintainer; other Area Approvers for the area, if any | Yes, after write access and CODEOWNERS are in place |
| Add or remove a Project Maintainer | [MAINTAINERS.md](MAINTAINERS.md); [CODEOWNERS](.github/CODEOWNERS) when ownership changes | Current Project Maintainers not being changed | Yes, for additions |
| Move someone to emeritus | [MAINTAINERS.md](MAINTAINERS.md); [CODEOWNERS](.github/CODEOWNERS) if they are an Area Approver | Use the row above for the role they are leaving | No |

### Making a role-change pull request

A role-change pull request may be opened by the contributor, an Area Approver,
or a Project Maintainer. Keep the pull request focused on the role change.

1. Edit the files listed in the quick reference table.
2. Open a focused pull request with a direct title, such as "Add Reviewer for
   Blocks & Runtime" or "Move Area Approver to emeritus".
3. In the description, name the person, role, area, and whether this is an
   addition, removal, or move to emeritus. For additions, include a few links to
   relevant work, such as reviews, merged pull requests, testing, issue
   discussion, documentation, or community help.
4. For additions, ask the person being added to confirm that they are willing
   to take the role. A short comment such as "I am willing to take this role"
   is enough.
5. Manually request review from the people listed in the quick reference table.

GitHub may only request the owners of the governance files being edited, not
the Area Approvers for the affected area. The pull request author should check
the table above and request those reviewers directly.

### Review and merge

Role-change pull requests use normal GitHub review, not a separate voting
process. They may be merged when the relevant checks are done:

- for additions, the person being added has confirmed that they are willing to
  take the role;
- at least one current Project Maintainer who is not being added or removed has
  approved;
- for Reviewer and Area Approver changes, an Area Approver for that area has
  approved, if the area has one who is not being changed; and
- open concerns from Project Maintainers and relevant Area Approvers have been
  answered.

If the area does not have an Area Approver yet, a Project Maintainer handles
the role change.

### Role notes

Reviewers are listed in [MAINTAINERS.md](MAINTAINERS.md). They do not get merge
authority and are not added to [CODEOWNERS](.github/CODEOWNERS).

Area Approvers are listed in [MAINTAINERS.md](MAINTAINERS.md) and
[CODEOWNERS](.github/CODEOWNERS). Repository write access must be granted before
the CODEOWNERS change becomes active. It is fine for an area to start with one
Area Approver, but important areas should grow toward at least two active Area
Approvers when contributor capacity allows.

Emeritus status records that someone previously held a project role. It does
not make them responsible for reviews, and it does not count as CODEOWNERS
approval. Area Approvers who are unavailable for a long time should be removed
from CODEOWNERS so pull requests do not get blocked.

Emergency access removal may happen immediately and should be documented in a
follow-up pull request.

## GitHub Permissions

GitHub write access applies to the whole repository. GitHub does not limit it
to individual folders. Area Approvers should use merge and close permissions
within their documented areas. Project Maintainers handle exceptions.
