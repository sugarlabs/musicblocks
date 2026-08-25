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

const practiceProblems = require("../practiceProblems");
const {
    applyPracticeLessonData,
    applyPracticeTranslation,
    getPracticeLanguage,
    normalizePracticeProblem
} = practiceProblems;

const BIG_BADGE = { id: "echo_island_guardian", label: "Echo Island Guardian" };

const makeTheme = () => ({
    title: "The Lost Melody Islands",
    subtitle: "Quest for the Hidden Treasure",
    intro: "<p>story</p>",
    bigBadges: { echo_island: { ...BIG_BADGE } }
});

const makeData = () => ({
    theme: makeTheme(),
    problems: [
        {
            level: 1,
            title: "The Bridge of Echo Island",
            description: "<p>english</p>",
            bigBadgeId: "echo_island",
            journal: {
                title: "Echo Island",
                island: "Echo Island",
                learned: ["Patterns", "Loops"]
            },
            incomplete: { title: "Still Sleeping", message: "Try again" },
            rewards: ["Fragment #1", "Page #1"],
            badges: [{ id: "bridge_builder", label: "Bridge Builder", shortLabel: "Bridge" }],
            secretHelpCards: { changeOctave: { title: "Change octave" } }
        }
    ]
});

afterEach(() => {
    delete window.i18next;
    delete global.fetch;
});

describe("normalizePracticeProblem", () => {
    test("resolves bigBadgeId into the badge from the theme", () => {
        const result = normalizePracticeProblem(
            { level: 1, bigBadgeId: "echo_island" },
            makeTheme()
        );

        expect(result.bigBadge).toEqual(BIG_BADGE);
        expect(result.bigBadgeId).toBeUndefined();
    });

    test("drops an id that matches no badge rather than inventing one", () => {
        const result = normalizePracticeProblem({ level: 1, bigBadgeId: "nope" }, makeTheme());

        expect(result.bigBadge).toBeUndefined();
        expect(result.bigBadgeId).toBeUndefined();
    });

    test("leaves the original problem untouched", () => {
        const problem = { level: 1, bigBadgeId: "echo_island" };

        normalizePracticeProblem(problem, makeTheme());

        expect(problem.bigBadgeId).toBe("echo_island");
    });
});

describe("applyPracticeLessonData", () => {
    test("exposes the theme and the normalised problems", () => {
        const { PracticeTheme, PracticeProblems } = applyPracticeLessonData(makeData());

        expect(PracticeTheme.title).toBe("The Lost Melody Islands");
        expect(PracticeProblems).toHaveLength(1);
        expect(PracticeProblems[0].bigBadge).toEqual(BIG_BADGE);
    });

    test("falls back to empty defaults when the file has no theme or problems", () => {
        const { PracticeTheme, PracticeProblems } = applyPracticeLessonData({});

        expect(PracticeTheme).toEqual({ title: "", subtitle: "", intro: "", bigBadges: {} });
        expect(PracticeProblems).toEqual([]);
    });

    test("ignores a problems field that is not a list", () => {
        expect(applyPracticeLessonData({ problems: "nope" }).PracticeProblems).toEqual([]);
    });
});

describe("getPracticeLanguage", () => {
    test("defaults to English when no language has been chosen", () => {
        expect(getPracticeLanguage()).toBe("en");
    });

    test("folds every Japanese variant onto one locale", () => {
        window.i18next = { language: "ja-kana" };

        expect(getPracticeLanguage()).toBe("ja");
    });

    test("keeps only the base tag of a regional language", () => {
        window.i18next = { language: "es-MX" };

        expect(getPracticeLanguage()).toBe("es");
    });
});

describe("applyPracticeTranslation", () => {
    test("returns the data untouched when there is no translation", () => {
        const data = makeData();

        expect(applyPracticeTranslation(data, null)).toBe(data);
        expect(data.problems[0].title).toBe("The Bridge of Echo Island");
    });

    test("replaces theme and island badge strings", () => {
        const data = makeData();

        applyPracticeTranslation(data, {
            theme: { title: "Islas", subtitle: "Busqueda", intro: "<p>historia</p>" },
            bigBadges: { echo_island: { label: "Guardian", message: "Desbloqueado" } }
        });

        expect(data.theme.title).toBe("Islas");
        expect(data.theme.bigBadges.echo_island.label).toBe("Guardian");
        expect(data.theme.bigBadges.echo_island.message).toBe("Desbloqueado");
    });

    test("replaces every translatable field on a lesson", () => {
        const data = makeData();

        applyPracticeTranslation(data, {
            problems: {
                1: {
                    title: "El Puente",
                    description: "<p>espanol</p>",
                    journal: { title: "Isla Eco", island: "Isla", completeTitle: "Completado" },
                    incomplete: { title: "Dormido", message: "Intenta" },
                    rewards: ["Fragmento #1", "Pagina #1"],
                    badges: { bridge_builder: { label: "Constructor" } },
                    secretHelpCards: { changeOctave: { title: "Cambiar octava" } }
                }
            }
        });

        const problem = data.problems[0];

        expect(problem.title).toBe("El Puente");
        expect(problem.description).toBe("<p>espanol</p>");
        expect(problem.journal.title).toBe("Isla Eco");
        expect(problem.journal.completeTitle).toBe("Completado");
        expect(problem.incomplete.message).toBe("Intenta");
        expect(problem.rewards).toEqual(["Fragmento #1", "Pagina #1"]);
        expect(problem.badges[0].label).toBe("Constructor");
        expect(problem.secretHelpCards.changeOctave.title).toBe("Cambiar octava");
    });

    test("keeps the English entry wherever a list translation is short", () => {
        const data = makeData();

        applyPracticeTranslation(data, {
            problems: { 1: { rewards: ["Fragmento #1"], journal: { learned: ["Patrones"] } } }
        });

        expect(data.problems[0].rewards).toEqual(["Fragmento #1", "Page #1"]);
        expect(data.problems[0].journal.learned).toEqual(["Patrones", "Loops"]);
    });

    test("ignores an empty translated string rather than blanking the English", () => {
        const data = makeData();

        applyPracticeTranslation(data, { problems: { 1: { title: "" } } });

        expect(data.problems[0].title).toBe("The Bridge of Echo Island");
    });

    test("leaves a lesson alone when the translation has no entry for it", () => {
        const data = makeData();

        applyPracticeTranslation(data, { problems: { 99: { title: "Otro" } } });

        expect(data.problems[0].title).toBe("The Bridge of Echo Island");
    });

    test("survives a translation with no matching badge or help card ids", () => {
        const data = makeData();

        applyPracticeTranslation(data, {
            problems: { 1: { badges: { unknown: { label: "x" } }, secretHelpCards: {} } }
        });

        expect(data.problems[0].badges[0].label).toBe("Bridge Builder");
    });

    test("returns the data unchanged when there is nothing to translate", () => {
        expect(applyPracticeTranslation(null, { theme: {} })).toBeNull();
    });
});

describe("loadPracticeLessons", () => {
    const loadFresh = () => {
        let mod;
        jest.isolateModules(() => {
            mod = require("../practiceProblems");
        });
        return mod;
    };

    const jsonResponse = body => ({ ok: true, json: () => Promise.resolve(body) });

    test("loads the English lesson file and exposes the problems", async () => {
        global.fetch = jest.fn(() => Promise.resolve(jsonResponse(makeData())));
        const mod = loadFresh();

        const { PracticeProblems } = await mod.loadPracticeLessons();

        expect(global.fetch).toHaveBeenCalledWith("js/practiceLessons/practiceLessons.json");
        expect(PracticeProblems[0].title).toBe("The Bridge of Echo Island");
    });

    test("overlays the translation for the active language", async () => {
        window.i18next = { language: "es" };
        global.fetch = jest.fn(url =>
            Promise.resolve(
                url.includes(".es.json")
                    ? jsonResponse({ problems: { 1: { title: "El Puente" } } })
                    : jsonResponse(makeData())
            )
        );
        const mod = loadFresh();

        const { PracticeProblems } = await mod.loadPracticeLessons();

        expect(PracticeProblems[0].title).toBe("El Puente");
    });

    test("still opens in English when the translation file is missing", async () => {
        window.i18next = { language: "hi" };
        global.fetch = jest.fn(url =>
            url.includes(".hi.json")
                ? Promise.resolve({ ok: false })
                : Promise.resolve(jsonResponse(makeData()))
        );
        const mod = loadFresh();

        const { PracticeProblems } = await mod.loadPracticeLessons();

        expect(PracticeProblems[0].title).toBe("The Bridge of Echo Island");
    });

    test("still opens in English when the translation request throws", async () => {
        window.i18next = { language: "hi" };
        global.fetch = jest.fn(url =>
            url.includes(".hi.json")
                ? Promise.reject(new Error("offline"))
                : Promise.resolve(jsonResponse(makeData()))
        );
        const mod = loadFresh();

        await expect(mod.loadPracticeLessons()).resolves.toBeDefined();
    });

    test("rejects when the lesson file itself cannot be read", async () => {
        jest.spyOn(console, "error").mockImplementation(() => {});
        global.fetch = jest.fn(() => Promise.resolve({ ok: false }));
        const mod = loadFresh();

        await expect(mod.loadPracticeLessons()).rejects.toThrow(
            "Unable to load js/practiceLessons/practiceLessons.json"
        );
    });

    test("a failed load is not cached, so opening the panel again retries", async () => {
        jest.spyOn(console, "error").mockImplementation(() => {});
        const mod = loadFresh();
        global.fetch = jest.fn(() => Promise.resolve({ ok: false }));
        await expect(mod.loadPracticeLessons()).rejects.toThrow();

        global.fetch = jest.fn(() => Promise.resolve(jsonResponse(makeData())));

        await expect(mod.loadPracticeLessons()).resolves.toBeDefined();
    });

    test("fetches once and reuses the result while the language is unchanged", async () => {
        global.fetch = jest.fn(() => Promise.resolve(jsonResponse(makeData())));
        const mod = loadFresh();

        await mod.loadPracticeLessons();
        await mod.loadPracticeLessons();

        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test("reloads when the learner switches language", async () => {
        global.fetch = jest.fn(() => Promise.resolve(jsonResponse(makeData())));
        const mod = loadFresh();
        await mod.loadPracticeLessons();

        window.i18next = { language: "ja" };
        await mod.loadPracticeLessons();

        expect(global.fetch.mock.calls.some(([url]) => url.includes(".ja.json"))).toBe(true);
    });
});
