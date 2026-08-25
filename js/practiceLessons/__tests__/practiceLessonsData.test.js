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

const fs = require("fs");
const path = require("path");

const FOLDER = path.join(__dirname, "..");
const PROJECTS = path.join(FOLDER, "..", "practice_projects");

const lessons = JSON.parse(fs.readFileSync(path.join(FOLDER, "practiceLessons.json"), "utf8"));
const stylesheet = fs.readFileSync(path.join(FOLDER, "practice.css"), "utf8");

const problems = lessons.problems;
const cases = problems.map(problem => [problem.level, problem]);

const secretHelpAttributes = description =>
    [...description.matchAll(/data-secret-help="([^"]+)"/g)].map(match => match[1]).sort();

describe("practiceLessons.json shape", () => {
    test("every lesson has a distinct level number", () => {
        const levels = problems.map(problem => problem.level);

        expect(new Set(levels).size).toBe(levels.length);
    });

    test("the lessons are listed in the order they are meant to be played", () => {
        const levels = problems.map(problem => problem.level);

        expect(levels).toEqual([...levels].sort((a, b) => a - b));
    });

    test("every island badge referenced by a lesson exists in the theme", () => {
        problems.forEach(problem => {
            if (!problem.bigBadgeId) return;

            expect(lessons.theme.bigBadges[problem.bigBadgeId]).toBeDefined();
        });
    });
});

describe.each(cases)("lesson %i", (level, problem) => {
    test("carries the fields the panel renders", () => {
        expect(typeof problem.title).toBe("string");
        expect(typeof problem.description).toBe("string");
        expect(problem.expected).toBeDefined();
        expect(Array.isArray(problem.journal.learned)).toBe(true);
    });

    test("has badges with unique ids and a criterion each", () => {
        const ids = problem.badges.map(badge => badge.id);

        expect(new Set(ids).size).toBe(ids.length);
        problem.badges.forEach(badge => {
            expect(typeof badge.criterion).toBe("string");
            expect(badge.criterion.length).toBeGreaterThan(0);
        });
    });

    test("every badge icon has artwork in practice.css", () => {
        problem.badges.forEach(badge => {
            expect(stylesheet).toContain(`.level-badge-${badge.iconKey || "discovery"}`);
        });
    });

    test("its extra action buttons and help cards match one for one", () => {
        const buttons = secretHelpAttributes(problem.description);
        const cards = Object.keys(problem.secretHelpCards || {}).sort();

        expect(buttons).toEqual(cards);
    });

    test("every block help card names a block", () => {
        Object.values(problem.secretHelpCards || {}).forEach(card => {
            if (card.type !== "block") return;

            expect(typeof card.blockName).toBe("string");
            expect(card.blockName.length).toBeGreaterThan(0);
        });
    });
});

describe("starter projects", () => {
    const files = fs.readdirSync(PROJECTS).filter(name => name.endsWith(".tb"));

    test("there is at least one starter project", () => {
        expect(files.length).toBeGreaterThan(0);
    });

    test.each(files)("%s is a readable block list", file => {
        const project = JSON.parse(fs.readFileSync(path.join(PROJECTS, file), "utf8"));

        expect(Array.isArray(project)).toBe(true);
        expect(project.length).toBeGreaterThan(0);
    });
});

describe("translations", () => {
    const files = fs
        .readdirSync(FOLDER)
        .filter(name => /^practiceLessons\.[a-z-]+\.json$/.test(name));
    const englishLevels = new Set(problems.map(problem => String(problem.level)));

    test("every language file parses", () => {
        expect(files.length).toBeGreaterThan(0);
    });

    test.each(files)("%s only translates lessons that exist", file => {
        const translation = JSON.parse(fs.readFileSync(path.join(FOLDER, file), "utf8"));

        Object.keys(translation.problems || {}).forEach(level => {
            expect(englishLevels.has(level)).toBe(true);
        });
    });

    // A translated description replaces the English one, so it carries the extra action buttons too.
    test.each(files)("%s keeps every extra action button wired to its help card", file => {
        const translation = JSON.parse(fs.readFileSync(path.join(FOLDER, file), "utf8"));

        Object.entries(translation.problems || {}).forEach(([level, translated]) => {
            if (typeof translated.description !== "string") return;

            const english = problems.find(problem => String(problem.level) === level);

            expect(secretHelpAttributes(translated.description)).toEqual(
                secretHelpAttributes(english.description)
            );
        });
    });

    test.each(files)("%s keeps list translations the same length as the English", file => {
        const translation = JSON.parse(fs.readFileSync(path.join(FOLDER, file), "utf8"));

        Object.entries(translation.problems || {}).forEach(([level, translated]) => {
            const english = problems.find(problem => String(problem.level) === level);

            if (Array.isArray(translated.rewards)) {
                expect(translated.rewards).toHaveLength(english.rewards.length);
            }

            if (Array.isArray(translated.journal?.learned)) {
                expect(translated.journal.learned).toHaveLength(english.journal.learned.length);
            }
        });
    });
});
