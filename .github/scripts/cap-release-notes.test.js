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

const {
    GITHUB_RELEASE_BODY_LIMIT,
    MARGIN,
    capNotes,
    capNotesFile,
    run
} = require("./cap-release-notes");

const URL = "https://github.com/sugarlabs/musicblocks/blob/v3.9.0/CHANGELOG.md";
const LIMIT = GITHUB_RELEASE_BODY_LIMIT - MARGIN;

const entry = n =>
    `* fix: change number ${n} by @someone in https://github.com/sugarlabs/musicblocks/pull/${n}`;

// The layout GitHub's generated notes use, as release-please stores them.
function notes(count, newContributors = 3) {
    const entries = Array.from({ length: count }, (_, i) => entry(i + 1));
    const firsts = Array.from(
        { length: newContributors },
        (_, i) =>
            `* @new${i} made their first contribution in https://github.com/sugarlabs/musicblocks/pull/${i}`
    );
    return [
        "## 3.9.0 (2026-10-26)",
        "",
        "## What's Changed",
        ...entries,
        "",
        "## New Contributors",
        ...firsts,
        "",
        "**Full Changelog**: https://github.com/sugarlabs/musicblocks/compare/v3.8.0...v3.9.0"
    ].join("\n");
}

function notesFile(body) {
    return [
        ":robot: I have created a release *beep* *boop*",
        "---",
        "",
        "",
        "<details><summary>3.9.0</summary>",
        "",
        body,
        "</details>",
        "",
        "---",
        "This PR was generated with [Release Please](https://github.com/googleapis/release-please)."
    ].join("\n");
}

describe("capNotes", () => {
    it("leaves notes under the limit alone", () => {
        const short = notes(10);
        expect(capNotes(short, { changelogUrl: URL })).toEqual({ notes: short, dropped: 0 });
    });

    it("drops entries from the end until the notes fit", () => {
        const long = notes(2000); // ~190k characters
        expect(long.length).toBeGreaterThan(GITHUB_RELEASE_BODY_LIMIT);

        const { notes: capped, dropped } = capNotes(long, { changelogUrl: URL });

        expect(capped.length).toBeLessThanOrEqual(LIMIT);
        expect(dropped).toBeGreaterThan(0);
        expect(capped).toContain(entry(1) + "\n");
        expect(capped).toContain(entry(2000 - dropped) + "\n");
        expect(capped).not.toContain(entry(2000 - dropped + 1) + "\n");
        expect(capped).toContain(
            `* …and ${dropped} more pull requests, listed in [CHANGELOG.md](${URL}).`
        );
    });

    it("keeps the heading, the new contributors and the full changelog link", () => {
        const { notes: capped } = capNotes(notes(2000, 150), { changelogUrl: URL });

        expect(capped.startsWith("## 3.9.0 (2026-10-26)\n\n## What's Changed\n")).toBe(true);
        expect(capped).toContain("## New Contributors\n");
        expect(capped).toContain("@new149 made their first contribution");
        expect(capped.endsWith("compare/v3.8.0...v3.9.0")).toBe(true);
    });

    it("keeps as many entries as fit", () => {
        const { notes: capped, dropped } = capNotes(notes(2000), { changelogUrl: URL });
        const oneMore = entry(2000 - dropped + 1).length + 1;

        expect(capped.length + oneMore).toBeGreaterThan(LIMIT);
    });

    it("says 1 more pull request when only one is left out", () => {
        const title = "a long pull request title ".repeat(10);
        const long = notes(3).replace(/fix: change number (\d+)/g, (m, n) => `${title}${n}`);
        const limit = long.length - 1;

        const { notes: capped, dropped } = capNotes(long, { changelogUrl: URL, limit });

        expect(dropped).toBe(1);
        expect(capped).toContain("* …and 1 more pull request, listed in");
    });

    it("cuts at a line break when the layout isn't the usual one", () => {
        const odd = Array.from({ length: 3000 }, (_, i) => `line ${i} `.repeat(8)).join("\n");

        const { notes: capped } = capNotes(odd, { changelogUrl: URL });

        expect(capped.length).toBeLessThanOrEqual(LIMIT);
        expect(capped.endsWith(`* …the rest is in [CHANGELOG.md](${URL}).`)).toBe(true);
        expect(capped.split("\n\n* …the rest")[0].endsWith(" ")).toBe(true);
    });
});

describe("capNotesFile", () => {
    const urlFor = version => `https://example.test/blob/v${version}/CHANGELOG.md`;

    it("caps only the notes inside <details>", () => {
        const file = notesFile(notes(2000));

        const { text, version, dropped } = capNotesFile(file, urlFor);

        expect(version).toBe("3.9.0");
        expect(dropped).toBeGreaterThan(0);
        expect(text.startsWith(":robot: I have created a release *beep* *boop*\n---\n")).toBe(true);
        expect(text).toContain("<details><summary>3.9.0</summary>\n\n## 3.9.0 (2026-10-26)");
        expect(text).toContain("](https://example.test/blob/v3.9.0/CHANGELOG.md).");
        expect(
            text.endsWith("[Release Please](https://github.com/googleapis/release-please).")
        ).toBe(true);
        const inside = /<details><summary>3\.9\.0<\/summary>\n\n([\s\S]*?)\n<\/details>/.exec(
            text
        )[1];
        expect(inside.length).toBeLessThanOrEqual(LIMIT);
    });

    it("leaves notes it already capped alone", () => {
        const once = capNotesFile(notesFile(notes(2000)), urlFor).text;
        expect(capNotesFile(once, urlFor)).toEqual({ text: once, version: "3.9.0", dropped: 0 });
    });

    it("returns a file that fits unchanged", () => {
        const file = notesFile(notes(10));
        expect(capNotesFile(file, urlFor)).toEqual({ text: file, version: "3.9.0", dropped: 0 });
    });

    it("leaves a file without a release block alone", () => {
        expect(capNotesFile("no details here", urlFor)).toEqual({
            text: "no details here",
            version: null,
            dropped: 0
        });
    });
});

describe("run", () => {
    const SHA = "abc123";

    function setup({ prs, fileText }) {
        const github = {
            rest: {
                pulls: { list: jest.fn().mockResolvedValue({ data: prs }) },
                repos: {
                    getContent: jest.fn().mockResolvedValue({
                        data: { content: Buffer.from(fileText || "").toString("base64"), sha: "f1" }
                    }),
                    createOrUpdateFileContents: jest.fn().mockResolvedValue({})
                }
            }
        };
        const context = {
            repo: { owner: "sugarlabs", repo: "musicblocks" },
            sha: SHA,
            serverUrl: "https://github.com"
        };
        const core = { info: jest.fn(), notice: jest.fn(), warning: jest.fn() };
        return { github, context, core };
    }

    const releasePr = body => ({
        number: 9012,
        merged_at: "2026-11-01T00:00:00Z",
        labels: [{ name: "autorelease: pending" }],
        head: { ref: "release-please--branches--master" },
        body
    });
    const OVERFLOW =
        "This release is too large to preview in the pull request body. View the full release notes here: https://github.com/sugarlabs/musicblocks/blob/release-please--branches--master--release-notes/release-notes.md";

    it("does nothing when no merged release PR is waiting", async () => {
        const args = setup({
            prs: [{ ...releasePr(OVERFLOW), labels: [] }],
            fileText: notesFile(notes(2000))
        });
        await run(args);
        expect(args.github.rest.repos.getContent).not.toHaveBeenCalled();
        expect(args.github.rest.repos.createOrUpdateFileContents).not.toHaveBeenCalled();
    });

    it("ignores a release PR that isn't merged", async () => {
        const args = setup({
            prs: [{ ...releasePr(OVERFLOW), merged_at: null }],
            fileText: notesFile(notes(2000))
        });
        await run(args);
        expect(args.github.rest.repos.createOrUpdateFileContents).not.toHaveBeenCalled();
    });

    it("does nothing when the notes are in the PR body", async () => {
        const args = setup({ prs: [releasePr(notesFile(notes(10)))] });
        await run(args);
        expect(args.github.rest.repos.getContent).not.toHaveBeenCalled();
        expect(args.github.rest.repos.createOrUpdateFileContents).not.toHaveBeenCalled();
    });

    it("leaves overflowed notes that fit alone", async () => {
        const args = setup({ prs: [releasePr(OVERFLOW)], fileText: notesFile(notes(800)) });
        await run(args);
        expect(args.github.rest.repos.getContent).toHaveBeenCalledWith(
            expect.objectContaining({
                path: "release-notes.md",
                ref: "release-please--branches--master--release-notes"
            })
        );
        expect(args.github.rest.repos.createOrUpdateFileContents).not.toHaveBeenCalled();
    });

    it("warns instead of skipping quietly when the notes file has an unexpected layout", async () => {
        const args = setup({ prs: [releasePr(OVERFLOW)], fileText: "x".repeat(130000) });

        await run(args);

        expect(args.github.rest.repos.createOrUpdateFileContents).not.toHaveBeenCalled();
        expect(args.core.warning).toHaveBeenCalledTimes(1);
        expect(args.core.warning.mock.calls[0][0]).toContain("130000 characters");
        expect(args.core.info).not.toHaveBeenCalledWith(expect.stringContaining("fit"));
    });

    it("writes the capped notes back where release-please reads them", async () => {
        const args = setup({ prs: [releasePr(OVERFLOW)], fileText: notesFile(notes(2000)) });

        await run(args);

        const write = args.github.rest.repos.createOrUpdateFileContents;
        expect(write).toHaveBeenCalledTimes(1);
        const params = write.mock.calls[0][0];
        expect(params).toMatchObject({
            owner: "sugarlabs",
            repo: "musicblocks",
            path: "release-notes.md",
            branch: "release-please--branches--master--release-notes",
            sha: "f1"
        });
        const text = Buffer.from(params.content, "base64").toString("utf8");
        expect(text).toContain(
            "](https://github.com/sugarlabs/musicblocks/blob/v3.9.0/CHANGELOG.md)."
        );
        const inside = /<details><summary>3\.9\.0<\/summary>\n\n([\s\S]*?)\n<\/details>/.exec(
            text
        )[1];
        expect(inside.length).toBeLessThanOrEqual(LIMIT);
        expect(args.core.notice).toHaveBeenCalled();
    });
});
