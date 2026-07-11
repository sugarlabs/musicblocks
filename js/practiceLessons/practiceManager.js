/* exported PracticeManager */

const STORAGE_KEY = "mb_practice_levels";
const JOURNAL_STORAGE_KEY = "mb_explorer_journal";

const getInitialJournal = () => {
    try {
        const stored = JSON.parse(localStorage.getItem(JOURNAL_STORAGE_KEY));
        if (stored && stored.version && stored.pages) {
            if (!Array.isArray(stored.generalNotes)) {
                stored.generalNotes = [];
            }
            return stored;
        }
    } catch (e) {
        console.debug("Explorer Journal storage could not be read", e);
    }

    return { version: 1, pages: {}, generalNotes: [] };
};

const normalizeGeneralNote = note => {
    const artifacts = note.artifacts || {};

    return {
        id: note.id,
        title: note.title || "Untitled Note",
        createdAt: note.createdAt || new Date().toISOString(),
        updatedAt: note.updatedAt || new Date().toISOString(),
        artifacts: {
            notes: Array.isArray(artifacts.notes) ? artifacts.notes : []
        }
    };
};

const PracticeManager = {
    progress: JSON.parse(localStorage.getItem(STORAGE_KEY)) || {},
    journal: (() => {
        const journal = getInitialJournal();
        if (!Array.isArray(journal.generalNotes)) {
            journal.generalNotes = [];
        }
        return journal;
    })(),

    getLevelRecord(level) {
        const record = this.progress[level];

        if (record === true) {
            return { complete: true, badges: [] };
        }

        return {
            complete: !!record?.complete,
            badges: Array.isArray(record?.badges) ? record.badges : []
        };
    },

    save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
    },

    saveJournal() {
        localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(this.journal));
    },

    isLevelComplete(level) {
        return this.getLevelRecord(level).complete;
    },

    getLevelBadges(level) {
        return this.getLevelRecord(level).badges;
    },

    getBigBadges() {
        return Array.isArray(this.progress.bigBadges) ? this.progress.bigBadges : [];
    },

    awardLevelBadges(problem, badges) {
        const record = this.getLevelRecord(problem.level);
        const newBadges = [];

        badges.forEach(badge => {
            if (!record.badges.includes(badge.id)) {
                record.badges.push(badge.id);
                newBadges.push(badge);
            }
        });

        this.progress[problem.level] = record;
        this.save();

        return newBadges;
    },

    completeLevel(problem, badges, allProblems) {
        const record = this.getLevelRecord(problem.level);
        record.complete = true;
        this.progress[problem.level] = record;

        const newBadges = this.awardLevelBadges(problem, badges);
        const newBigBadges = this.awardBigBadges(problem, allProblems);

        return { newBadges, newBigBadges };
    },

    getJournalPage(level) {
        return this.journal.pages[String(level)] || null;
    },

    getJournalPages() {
        return Object.values(this.journal.pages).sort((a, b) => a.level - b.level);
    },

    ensureJournalPage(problem) {
        const key = String(problem.level);
        const now = new Date().toISOString();
        const existing = this.journal.pages[key];

        if (existing) {
            existing.title = problem.journal?.title || problem.title;
            existing.island = problem.journal?.island || problem.island || "";
            existing.learned = Array.isArray(problem.journal?.learned)
                ? problem.journal.learned
                : [];
            existing.updatedAt = existing.updatedAt || now;
            this.journal.pages[key] = this.normalizeJournalPage(existing, problem);
            this.saveJournal();
            return this.journal.pages[key];
        }

        const page = this.normalizeJournalPage(
            {
                id: `lesson-${problem.level}`,
                level: problem.level,
                title: problem.journal?.title || problem.title,
                island: problem.journal?.island || problem.island || "",
                learned: Array.isArray(problem.journal?.learned) ? problem.journal.learned : [],
                completedAt: now,
                updatedAt: now,
                artifacts: {
                    notes: [],
                    drawings: [],
                    stickers: [],
                    badges: [],
                    images: [],
                    audio: [],
                    videos: []
                }
            },
            problem
        );

        this.journal.pages[key] = page;
        this.saveJournal();
        return page;
    },

    normalizeJournalPage(page, problem) {
        // Keep artifact buckets stable so future drawings, stickers, and media can reuse pages.
        const artifacts = page.artifacts || {};

        return {
            id: page.id || `lesson-${problem.level}`,
            level: Number(page.level || problem.level),
            title: page.title || problem.title,
            island: page.island || problem.island || "",
            learned: Array.isArray(page.learned) ? page.learned : [],
            completedAt: page.completedAt || new Date().toISOString(),
            updatedAt: page.updatedAt || new Date().toISOString(),
            artifacts: {
                notes: Array.isArray(artifacts.notes) ? artifacts.notes : [],
                drawings: Array.isArray(artifacts.drawings) ? artifacts.drawings : [],
                stickers: Array.isArray(artifacts.stickers) ? artifacts.stickers : [],
                badges: Array.isArray(artifacts.badges) ? artifacts.badges : [],
                images: Array.isArray(artifacts.images) ? artifacts.images : [],
                audio: Array.isArray(artifacts.audio) ? artifacts.audio : [],
                videos: Array.isArray(artifacts.videos) ? artifacts.videos : []
            }
        };
    },

    saveJournalNote(problem, text, prompt, noteId) {
        const page = this.ensureJournalPage(problem);
        const trimmedText = String(text || "").trim();
        const now = new Date().toISOString();
        const notes = page.artifacts.notes;
        const note = notes.find(item => item.id === noteId) || {
            id: `note-${problem.level}-${now}`,
            type: "text",
            createdAt: now
        };

        note.prompt = prompt || "What surprised you today?";
        note.text = trimmedText;
        note.updatedAt = now;

        if (!notes.includes(note)) {
            notes.push(note);
        }

        page.updatedAt = now;
        this.journal.pages[String(problem.level)] = page;
        this.saveJournal();

        return page;
    },

    deleteJournalNote(problem, noteId) {
        const page = this.getJournalPage(problem.level);
        if (!page) return false;

        const notes = page.artifacts.notes;
        const index = notes.findIndex(item => item.id === noteId);
        if (index === -1) return false;

        notes.splice(index, 1);
        page.updatedAt = new Date().toISOString();
        this.journal.pages[String(problem.level)] = page;
        this.saveJournal();

        return true;
    },

    getGeneralNotes() {
        if (!Array.isArray(this.journal.generalNotes)) {
            this.journal.generalNotes = [];
        }

        return [...this.journal.generalNotes].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
    },

    getGeneralNote(notePageId) {
        return this.getGeneralNotes().find(item => item.id === notePageId) || null;
    },

    createGeneralNote(title, initialText) {
        const now = Date.now();
        const trimmedTitle = String(title || "").trim() || "Untitled Note";
        const trimmedText = String(initialText || "").trim();
        const page = normalizeGeneralNote({
            id: `general-${now}`,
            title: trimmedTitle,
            createdAt: new Date(now).toISOString(),
            updatedAt: new Date(now).toISOString(),
            artifacts: { notes: [] }
        });

        if (trimmedText) {
            page.artifacts.notes.push({
                id: `note-general-${now}`,
                type: "text",
                prompt: "My thought",
                text: trimmedText,
                createdAt: new Date(now).toISOString(),
                updatedAt: new Date(now).toISOString()
            });
        }

        if (!Array.isArray(this.journal.generalNotes)) {
            this.journal.generalNotes = [];
        }

        this.journal.generalNotes.unshift(page);
        this.saveJournal();

        return page;
    },

    updateGeneralNoteTitle(notePageId, title) {
        const page = this.journal.generalNotes?.find(item => item.id === notePageId);
        if (!page) return null;

        page.title = String(title || "").trim() || "Untitled Note";
        page.updatedAt = new Date().toISOString();
        this.saveJournal();

        return page;
    },

    saveGeneralNoteEntry(notePageId, text, noteId) {
        const page = this.journal.generalNotes?.find(item => item.id === notePageId);
        if (!page) return null;

        const trimmedText = String(text || "").trim();
        const now = Date.now();
        const notes = page.artifacts.notes;
        const note = notes.find(item => item.id === noteId) || {
            id: `note-general-${now}`,
            type: "text",
            createdAt: new Date(now).toISOString()
        };

        note.prompt = "My thought";
        note.text = trimmedText;
        note.updatedAt = new Date(now).toISOString();

        if (!notes.includes(note)) {
            notes.push(note);
        }

        page.updatedAt = new Date(now).toISOString();
        this.saveJournal();

        return page;
    },

    deleteGeneralNoteEntry(notePageId, noteId) {
        const page = this.journal.generalNotes?.find(item => item.id === notePageId);
        if (!page) return false;

        const notes = page.artifacts.notes;
        const index = notes.findIndex(item => item.id === noteId);
        if (index === -1) return false;

        notes.splice(index, 1);
        page.updatedAt = new Date().toISOString();
        this.saveJournal();

        return true;
    },

    deleteGeneralNote(notePageId) {
        if (!Array.isArray(this.journal.generalNotes)) return false;

        const index = this.journal.generalNotes.findIndex(item => item.id === notePageId);
        if (index === -1) return false;

        this.journal.generalNotes.splice(index, 1);
        this.saveJournal();

        return true;
    },

    syncCompletedJournalPages(problems) {
        problems.forEach(problem => {
            if (this.isLevelComplete(problem.level)) {
                this.ensureJournalPage(problem);
            }
        });

        return this.getJournalPages();
    },

    awardBigBadges(problem, allProblems) {
        if (!problem.bigBadge || !problem.island) return [];

        const islandLevels = allProblems.filter(level => level.island === problem.island);
        const islandComplete = islandLevels.every(level => this.isLevelComplete(level.level));

        if (!islandComplete) return [];

        const bigBadges = this.getBigBadges();
        if (bigBadges.includes(problem.bigBadge.id)) return [];

        bigBadges.push(problem.bigBadge.id);
        this.progress.bigBadges = bigBadges;
        this.save();

        return [problem.bigBadge];
    }
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = { PracticeManager };
}
