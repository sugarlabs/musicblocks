## <a name="CONTRIBUTING"></a>Contributing

We welcome contributions of all kinds — whether it’s code,
documentation, music, lesson plans, artwork, or ideas. Music Blocks
is a community-driven project, and every meaningful contribution helps
improve the platform for learners and educators around the world.

If you’re new to the project, start by setting up the local
development environment using the guide linked above, then explore
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

Programmers, please follow these general [guidelines for
contributions](https://github.com/sugarlabs/sugar-docs/blob/master/src/contributing.md).

### Before You Push

Run these commands locally before submitting a PR:

```bash
npm run lint              # ESLint
npx prettier --check .    # Formatting
npm test                  # Jest
```

NOTE: Only run ```prettier``` on the files you have modified.

If formatting fails, run `npx prettier --write .` to fix it.

### After your PR is merged

Please note that production deployments of Music Blocks are **manual**.

This means that even after your pull request is merged, your changes may not immediately appear. Your update will become visible after the next official release is deployed.

If your changes are not visible right away, it does **not** indicate a problem with your PR or implementation.

This note is included to prevent contributors from spending time debugging caching or deployment issues unnecessarily.

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
   mailing list. Don't ask silly questions (unless you don't know it is
   silly ;p) before searching it on the web.

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
