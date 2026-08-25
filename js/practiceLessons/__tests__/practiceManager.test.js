/**
 * @license
 * Music Blocks v3.0.0
 * Copyright (C) 2026 Walter Bender
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this program. If not, see
 * <https://www.gnu.org/licenses/>.
 */

// PracticeManager reads localStorage and calls _() as it loads, so both exist before the require.
global._ = text => text;

const { PracticeManager } = require("../practiceManager");

const STORAGE_KEY = "mb_practice_levels";
const JOURNAL_STORAGE_KEY = "mb_explorer_journal";

const ISLAND = "echo_island";
const BIG_BADGE = { id: "echo_island_guardian", label: "Echo Island Guardian" };

const makeProblem = (level, overrides = {}) => ({
    level,
    island: ISLAND,
    title: `Lesson ${level}`,
    journal: { title: `Page ${level}`, island: "Echo Island", learned: ["Patterns"] },
    ...overrides
});

const badge = (id, criterion = "completePattern") => ({ id, label: id, criterion });

beforeEach(() => {
    localStorage.clear();
    PracticeManager.progress = {};
    PracticeManager.journal = { version: 1, pages: {}, generalNotes: [] };
});

describe("PracticeManager progress records", () => {
    test("an unseen level is incomplete and holds no badges", () => {
        expect(PracticeManager.getLevelRecord(1)).toEqual({ complete: false, badges: [] });
        expect(PracticeManager.isLevelComplete(1)).toBe(false);
        expect(PracticeManager.getLevelBadges(1)).toEqual([]);
    });

    test("reads the legacy format where a finished level was stored as true", () => {
        PracticeManager.progress[1] = true;

        expect(PracticeManager.getLevelRecord(1)).toEqual({ complete: true, badges: [] });
        expect(PracticeManager.isLevelComplete(1)).toBe(true);
    });

    test("tolerates a record whose badge list is missing or malformed", () => {
        PracticeManager.progress[1] = { complete: true, badges: "not-an-array" };

        expect(PracticeManager.getLevelBadges(1)).toEqual([]);
    });

    test("getBigBadges returns an empty list until an island is finished", () => {
        expect(PracticeManager.getBigBadges()).toEqual([]);

        PracticeManager.progress.bigBadges = ["echo_island_guardian"];

        expect(PracticeManager.getBigBadges()).toEqual(["echo_island_guardian"]);
    });

    test("save writes progress to localStorage", () => {
        PracticeManager.progress[2] = { complete: true, badges: ["a"] };
        PracticeManager.save();

        expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual({
            2: { complete: true, badges: ["a"] }
        });
    });
});

describe("PracticeManager.awardLevelBadges", () => {
    test("awards badges that have not been earned before", () => {
        const problem = makeProblem(1);

        const awarded = PracticeManager.awardLevelBadges(problem, [badge("x"), badge("y")]);

        expect(awarded.map(b => b.id)).toEqual(["x", "y"]);
        expect(PracticeManager.getLevelBadges(1)).toEqual(["x", "y"]);
    });

    test("does not award the same badge twice", () => {
        const problem = makeProblem(1);
        PracticeManager.awardLevelBadges(problem, [badge("x")]);

        const again = PracticeManager.awardLevelBadges(problem, [badge("x")]);

        expect(again).toEqual([]);
        expect(PracticeManager.getLevelBadges(1)).toEqual(["x"]);
    });

    test("persists the award so it survives a reload", () => {
        PracticeManager.awardLevelBadges(makeProblem(1), [badge("x")]);

        expect(JSON.parse(localStorage.getItem(STORAGE_KEY))[1].badges).toEqual(["x"]);
    });
});

describe("PracticeManager.completeLevel", () => {
    const allProblems = [makeProblem(1), makeProblem(2)];

    test("marks the level complete and reports the badges it awarded", () => {
        const result = PracticeManager.completeLevel(allProblems[0], [badge("x")], allProblems);

        expect(PracticeManager.isLevelComplete(1)).toBe(true);
        expect(result.newBadges.map(b => b.id)).toEqual(["x"]);
    });

    test("withholds the island badge until every lesson on the island is done", () => {
        const problem = makeProblem(1, { bigBadge: BIG_BADGE });

        const result = PracticeManager.completeLevel(problem, [], allProblems);

        expect(result.newBigBadges).toEqual([]);
        expect(PracticeManager.getBigBadges()).toEqual([]);
    });

    test("awards the island badge when the last lesson on the island is finished", () => {
        PracticeManager.completeLevel(makeProblem(1), [], allProblems);
        const problem = makeProblem(2, { bigBadge: BIG_BADGE });

        const result = PracticeManager.completeLevel(problem, [], allProblems);

        expect(result.newBigBadges).toEqual([BIG_BADGE]);
        expect(PracticeManager.getBigBadges()).toEqual([BIG_BADGE.id]);
    });

    test("does not award the same island badge a second time", () => {
        const problem = makeProblem(2, { bigBadge: BIG_BADGE });
        PracticeManager.completeLevel(makeProblem(1), [], allProblems);
        PracticeManager.completeLevel(problem, [], allProblems);

        const again = PracticeManager.awardBigBadges(problem, allProblems);

        expect(again).toEqual([]);
        expect(PracticeManager.getBigBadges()).toEqual([BIG_BADGE.id]);
    });

    test("a lesson with no island badge never awards one", () => {
        const problem = makeProblem(1, { island: undefined });

        expect(PracticeManager.awardBigBadges(problem, allProblems)).toEqual([]);
    });
});

describe("PracticeManager journal pages", () => {
    test("creates a page seeded from the lesson with every artifact bucket present", () => {
        const page = PracticeManager.ensureJournalPage(makeProblem(3));

        expect(page.id).toBe("lesson-3");
        expect(page.level).toBe(3);
        expect(page.title).toBe("Page 3");
        expect(page.island).toBe("Echo Island");
        expect(page.learned).toEqual(["Patterns"]);
        expect(Object.keys(page.artifacts).sort()).toEqual([
            "audio",
            "badges",
            "drawings",
            "images",
            "notes",
            "stickers",
            "videos"
        ]);
    });

    test("falls back to the lesson title when the journal block omits one", () => {
        const page = PracticeManager.ensureJournalPage({ level: 4, title: "Lesson 4" });

        expect(page.title).toBe("Lesson 4");
        expect(page.island).toBe("");
        expect(page.learned).toEqual([]);
    });

    test("refreshes an existing page without discarding the notes already on it", () => {
        const problem = makeProblem(3);
        PracticeManager.ensureJournalPage(problem);
        PracticeManager.saveJournalNote(problem, "my note", "What surprised you?");

        const updated = PracticeManager.ensureJournalPage(
            makeProblem(3, { journal: { title: "New Title", island: "Echo", learned: ["Loops"] } })
        );

        expect(updated.title).toBe("New Title");
        expect(updated.learned).toEqual(["Loops"]);
        expect(updated.artifacts.notes).toHaveLength(1);
    });

    test("lists pages in level order", () => {
        PracticeManager.ensureJournalPage(makeProblem(3));
        PracticeManager.ensureJournalPage(makeProblem(1));
        PracticeManager.ensureJournalPage(makeProblem(2));

        expect(PracticeManager.getJournalPages().map(p => p.level)).toEqual([1, 2, 3]);
    });

    test("getJournalPage returns null for a lesson with no page", () => {
        expect(PracticeManager.getJournalPage(9)).toBeNull();
    });

    test("syncCompletedJournalPages only creates pages for finished lessons", () => {
        const problems = [makeProblem(1), makeProblem(2)];
        PracticeManager.progress[1] = { complete: true, badges: [] };

        const pages = PracticeManager.syncCompletedJournalPages(problems);

        expect(pages.map(p => p.level)).toEqual([1]);
    });
});

describe("PracticeManager journal notes", () => {
    const problem = makeProblem(3);

    test("saves a note and stores the prompt beside it", () => {
        const page = PracticeManager.saveJournalNote(problem, "  spaced  ", "Why?");

        expect(page.artifacts.notes).toHaveLength(1);
        expect(page.artifacts.notes[0].text).toBe("spaced");
        expect(page.artifacts.notes[0].prompt).toBe("Why?");
    });

    test("uses a default prompt when none is supplied", () => {
        const page = PracticeManager.saveJournalNote(problem, "text");

        expect(page.artifacts.notes[0].prompt).toBe("What surprised you today?");
    });

    test("editing an existing note updates it instead of adding another", () => {
        const first = PracticeManager.saveJournalNote(problem, "first", "Why?");
        const noteId = first.artifacts.notes[0].id;

        const page = PracticeManager.saveJournalNote(problem, "second", "Why?", noteId);

        expect(page.artifacts.notes).toHaveLength(1);
        expect(page.artifacts.notes[0].text).toBe("second");
    });

    test("deletes a note and reports whether anything was removed", () => {
        const page = PracticeManager.saveJournalNote(problem, "text", "Why?");
        const noteId = page.artifacts.notes[0].id;

        expect(PracticeManager.deleteJournalNote(problem, noteId)).toBe(true);
        expect(PracticeManager.getJournalPage(3).artifacts.notes).toEqual([]);
        expect(PracticeManager.deleteJournalNote(problem, noteId)).toBe(false);
    });

    test("deleting from a lesson with no page at all is a no-op", () => {
        expect(PracticeManager.deleteJournalNote(makeProblem(8), "missing")).toBe(false);
    });

    test("persists the journal to localStorage", () => {
        PracticeManager.saveJournalNote(problem, "text", "Why?");

        const stored = JSON.parse(localStorage.getItem(JOURNAL_STORAGE_KEY));

        expect(stored.pages["3"].artifacts.notes[0].text).toBe("text");
    });
});

describe("PracticeManager general notes", () => {
    test("creates a note with a title and an opening entry", () => {
        const page = PracticeManager.createGeneralNote("Ideas", "first thought");

        expect(page.title).toBe("Ideas");
        expect(page.artifacts.notes).toHaveLength(1);
        expect(page.artifacts.notes[0].text).toBe("first thought");
    });

    test("an untitled note is given a default name and stays empty", () => {
        const page = PracticeManager.createGeneralNote("   ", "   ");

        expect(page.title).toBe("Untitled Note");
        expect(page.artifacts.notes).toEqual([]);
    });

    test("lists notes with the most recently updated first", () => {
        const older = PracticeManager.createGeneralNote("Older");
        const newer = PracticeManager.createGeneralNote("Newer");
        older.updatedAt = "2020-01-01T00:00:00.000Z";
        newer.updatedAt = "2026-01-01T00:00:00.000Z";

        expect(PracticeManager.getGeneralNotes().map(n => n.title)).toEqual(["Newer", "Older"]);
    });

    test("finds a note by id and returns null for an unknown one", () => {
        const page = PracticeManager.createGeneralNote("Ideas");

        expect(PracticeManager.getGeneralNote(page.id).title).toBe("Ideas");
        expect(PracticeManager.getGeneralNote("nope")).toBeNull();
    });

    test("renames a note, falling back to the default name when blank", () => {
        const page = PracticeManager.createGeneralNote("Ideas");

        expect(PracticeManager.updateGeneralNoteTitle(page.id, "Better").title).toBe("Better");
        expect(PracticeManager.updateGeneralNoteTitle(page.id, "  ").title).toBe("Untitled Note");
        expect(PracticeManager.updateGeneralNoteTitle("nope", "x")).toBeNull();
    });

    test("adds and then edits an entry inside a note", () => {
        const page = PracticeManager.createGeneralNote("Ideas");

        const added = PracticeManager.saveGeneralNoteEntry(page.id, "one");
        const noteId = added.artifacts.notes[0].id;
        const edited = PracticeManager.saveGeneralNoteEntry(page.id, "two", noteId);

        expect(edited.artifacts.notes).toHaveLength(1);
        expect(edited.artifacts.notes[0].text).toBe("two");
        expect(PracticeManager.saveGeneralNoteEntry("nope", "x")).toBeNull();
    });

    test("deletes an entry and then the whole note", () => {
        const page = PracticeManager.createGeneralNote("Ideas", "text");
        const noteId = page.artifacts.notes[0].id;

        expect(PracticeManager.deleteGeneralNoteEntry(page.id, noteId)).toBe(true);
        expect(PracticeManager.deleteGeneralNoteEntry(page.id, noteId)).toBe(false);
        expect(PracticeManager.deleteGeneralNoteEntry("nope", noteId)).toBe(false);
        expect(PracticeManager.deleteGeneralNote(page.id)).toBe(true);
        expect(PracticeManager.deleteGeneralNote(page.id)).toBe(false);
    });
});

describe("PracticeManager journal storage recovery", () => {
    const loadFresh = () => {
        let mod;
        jest.isolateModules(() => {
            mod = require("../practiceManager");
        });
        return mod.PracticeManager;
    };

    test("falls back to an empty journal when stored data is not valid JSON", () => {
        localStorage.setItem(JOURNAL_STORAGE_KEY, "{not json");

        const manager = loadFresh();

        expect(manager.journal.pages).toEqual({});
        expect(manager.journal.generalNotes).toEqual([]);
    });

    test("adds the general notes list to a journal saved before that feature existed", () => {
        localStorage.setItem(
            JOURNAL_STORAGE_KEY,
            JSON.stringify({ version: 1, pages: { 1: { level: 1 } } })
        );

        const manager = loadFresh();

        expect(manager.journal.generalNotes).toEqual([]);
        expect(manager.journal.pages["1"]).toEqual({ level: 1 });
    });
});
