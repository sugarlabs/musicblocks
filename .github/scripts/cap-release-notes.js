/**
 * MusicBlocks v3.8.0
 *
 * @author Kunal Kumar
 *
 * @copyright 2026 Kunal Kumar
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

/**
 * Keeps a release body under GitHub's 125,000-character limit.
 *
 * With `changelog-type: "github"` the notes list every merged PR, and
 * release-please passes them unchanged to the create-release API. Over the
 * limit that call fails with a 422 ("body is too long"), so neither the
 * release nor its tag gets created (#8889). CHANGELOG.md has no limit and
 * already holds the full list by the time the release PR is merged, so only
 * the release body needs trimming.
 *
 * Large notes never fit in the release PR body (65,536 characters), so
 * release-please stores them in `release-notes.md` on the branch
 * `<release PR head>--release-notes` and reads them back from there when it
 * creates the release. `run()` trims that file just before release-please
 * runs on the merge of the release PR. Smaller notes stay in the PR body and
 * are already under the limit.
 *
 * Trimming drops "What's Changed" entries from the end and keeps the heading,
 * the "New Contributors" section and the "Full Changelog" link, then says how
 * many entries were left out and links CHANGELOG.md.
 */

// GitHub's limit for a release body.
const GITHUB_RELEASE_BODY_LIMIT = 125000;
// Room under the limit, so a small difference in how GitHub counts
// characters can never tip the body over.
const MARGIN = 1000;

const PENDING_LABEL = "autorelease: pending";
const NOTES_FILE = "release-notes.md";

function trimmedNote(count, changelogUrl) {
    const what = count === 1 ? "1 more pull request" : `${count} more pull requests`;
    return `* …and ${what}, listed in [CHANGELOG.md](${changelogUrl}).`;
}

/**
 * Returns the notes unchanged if they fit in `limit`, otherwise drops entries
 * from the end of "What's Changed" until they do.
 *
 * @param {string} notes - one release's notes, as release-please passes them
 * @param {{changelogUrl: string, limit?: number}} options
 * @returns {{notes: string, dropped: number}}
 */
function capNotes(notes, { changelogUrl, limit = GITHUB_RELEASE_BODY_LIMIT - MARGIN }) {
    if (notes.length <= limit) return { notes, dropped: 0 };

    const lines = notes.split("\n");
    const start = lines.indexOf("## What's Changed");
    let end = lines.findIndex((line, i) => i > start && line.startsWith("## "));
    if (end === -1) {
        end = lines.findIndex((line, i) => i > start && line.startsWith("**Full Changelog**"));
    }
    if (end === -1) end = lines.length;

    const entries = [];
    for (let i = start + 1; start !== -1 && i < end; i++) {
        if (lines[i].startsWith("* ")) entries.push(i);
    }

    if (entries.length > 0) {
        const total = entries.length;
        const without = new Set(entries);
        const head = lines.slice(0, entries[0]);
        const tail = lines.slice(entries[entries.length - 1] + 1);
        const kept = [];
        // Lines between entries that aren't entries stay where they are.
        for (let i = entries[0]; i <= entries[entries.length - 1]; i++) {
            if (!without.has(i)) kept.push(lines[i]);
        }

        // Keep as many entries as fit, in their original order.
        const build = n => {
            const shown = entries.slice(0, n).map(i => lines[i]);
            const note = n < total ? [trimmedNote(total - n, changelogUrl)] : [];
            return [...head, ...shown, ...note, ...kept, ...tail].join("\n");
        };
        let lo = 0;
        let hi = total;
        while (lo < hi) {
            const mid = Math.ceil((lo + hi) / 2);
            if (build(mid).length <= limit) lo = mid;
            else hi = mid - 1;
        }
        const capped = build(lo);
        if (capped.length <= limit) return { notes: capped, dropped: total - lo };
    }

    // Unknown layout, or the rest alone is too long: cut at a line break.
    const note = `\n\n* …the rest is in [CHANGELOG.md](${changelogUrl}).`;
    const cut = notes.lastIndexOf("\n", limit - note.length);
    return {
        notes: notes.slice(0, cut > 0 ? cut : limit - note.length) + note,
        dropped: -1
    };
}

/**
 * Caps the notes inside the `<details>` block of release-please's
 * release-notes.md, leaving its header, footer and markup as they are.
 *
 * @param {string} text - the file's contents
 * @param {(version: string) => string} changelogUrlFor
 * @returns {{text: string, version: string|null, dropped: number}}
 */
function capNotesFile(text, changelogUrlFor) {
    const match = /<details><summary>([^<]*)<\/summary>\n\n([\s\S]*?)\n<\/details>/.exec(text);
    if (!match) return { text, version: null, dropped: 0 };

    const [block, summary, notes] = match;
    // The summary is "<component> <version>" or just "<version>".
    const version = summary.trim().split(/\s+/).pop();
    const capped = capNotes(notes, { changelogUrl: changelogUrlFor(version) });
    if (capped.dropped === 0) return { text, version, dropped: 0 };

    const replaced = block.replace(notes, () => capped.notes);
    return {
        text: text.slice(0, match.index) + replaced + text.slice(match.index + block.length),
        version,
        dropped: capped.dropped
    };
}

/**
 * Runs from actions/github-script before release-please on a push to master.
 * Like release-please, it looks for a merged release PR still labelled
 * "autorelease: pending", so a release that failed to publish is capped on
 * the next push too. Does nothing unless that PR's notes overflowed into
 * release-notes.md and are too long for a release body. Capping is
 * idempotent: notes that already fit are left alone.
 */
async function run({ github, context, core }) {
    const { owner, repo } = context.repo;

    const { data: prs } = await github.rest.pulls.list({
        owner,
        repo,
        state: "closed",
        sort: "updated",
        direction: "desc",
        per_page: 25
    });
    const release = prs.find(
        pr => pr.merged_at && pr.labels.some(label => label.name === PENDING_LABEL)
    );
    if (!release) {
        core.info("No merged release PR is waiting to be released; nothing to cap.");
        return;
    }
    if (!(release.body || "").includes(NOTES_FILE)) {
        core.info(`#${release.number} keeps its notes in the PR body, which is under the limit.`);
        return;
    }

    const branch = `${release.head.ref}--release-notes`;
    const { data: file } = await github.rest.repos.getContent({
        owner,
        repo,
        path: NOTES_FILE,
        ref: branch
    });
    const text = Buffer.from(file.content, "base64").toString("utf8");

    const changelogUrlFor = version =>
        `${context.serverUrl}/${owner}/${repo}/blob/v${version}/CHANGELOG.md`;
    const capped = capNotesFile(text, changelogUrlFor);
    if (capped.version === null) {
        // release-please changed how it stores the notes. Say so loudly rather
        // than skip quietly, since a long release would then fail to publish.
        core.warning(
            `${NOTES_FILE} on ${branch} has no <details><summary>VERSION</summary> block, so ` +
                `the release body was not checked or trimmed (${text.length} characters). ` +
                `If it is over ${GITHUB_RELEASE_BODY_LIMIT}, creating the release will fail.`
        );
        return;
    }
    if (capped.dropped === 0) {
        core.info(`Release notes for ${capped.version || "this release"} fit; nothing to cap.`);
        return;
    }

    await github.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: NOTES_FILE,
        branch,
        sha: file.sha,
        message: `chore: cap the ${capped.version} release body below GitHub's limit`,
        content: Buffer.from(capped.text, "utf8").toString("base64")
    });
    core.notice(
        `Capped the ${capped.version} release body: ` +
            (capped.dropped > 0
                ? `left out ${capped.dropped} entries, which stay in CHANGELOG.md.`
                : "cut at a line break; the full notes stay in CHANGELOG.md.")
    );
}

module.exports = {
    GITHUB_RELEASE_BODY_LIMIT,
    MARGIN,
    capNotes,
    capNotesFile,
    run
};
