/* global fetch */
/* exported PracticeProblems, PracticeTheme, loadPracticeLessons */

const PRACTICE_LESSONS_PATH = "js/practiceLessons/practiceLessons.json";
// Translations sit beside the English source and carry display strings only, never lesson logic.
const practiceTranslationPath = language => `js/practiceLessons/practiceLessons.${language}.json`;
// Display strings a translation is allowed to replace, grouped by the shape that holds them.
const TRANSLATABLE_BADGE_KEYS = ["label", "shortLabel", "message"];
const TRANSLATABLE_JOURNAL_KEYS = ["title", "island", "completeTitle"];
const TRANSLATABLE_CARD_KEYS = [
    "title",
    "heading",
    "description",
    "musicHeading",
    "musicDescription"
];

let PracticeTheme = {
    title: "",
    subtitle: "",
    intro: "",
    bigBadges: {}
};
let PracticeProblems = [];
let practiceLessonsLoadPromise = null;
let practiceLessonsLanguage = null;

const normalizePracticeProblem = (problem, theme) => {
    const normalized = Object.assign({}, problem);

    if (normalized.bigBadgeId && theme.bigBadges?.[normalized.bigBadgeId]) {
        normalized.bigBadge = theme.bigBadges[normalized.bigBadgeId];
    }

    delete normalized.bigBadgeId;
    return normalized;
};

const applyPracticeLessonData = data => {
    const theme = data?.theme || {};
    const problems = Array.isArray(data?.problems) ? data.problems : [];

    PracticeTheme = Object.assign(
        {
            title: "",
            subtitle: "",
            intro: "",
            bigBadges: {}
        },
        theme
    );
    PracticeProblems = problems.map(problem => normalizePracticeProblem(problem, PracticeTheme));

    return { PracticeTheme, PracticeProblems };
};

const getPracticeLanguage = () => {
    const language = window.i18next?.language;
    if (!language) return "en";

    // Music Blocks folds every Japanese variant onto one locale before translating.
    return language.startsWith("ja") ? "ja" : language.split("-")[0];
};

const applyTranslatedText = (target, source, keys) => {
    if (!target || !source) return;

    keys.forEach(key => {
        if (typeof source[key] === "string" && source[key]) {
            target[key] = source[key];
        }
    });
};

const translateList = (englishList, translatedList) => {
    if (!Array.isArray(englishList) || !Array.isArray(translatedList)) return englishList;

    return englishList.map((text, index) => translatedList[index] || text);
};

const applyPracticeTranslation = (data, translation) => {
    if (!data || !translation) return data;

    applyTranslatedText(data.theme, translation.theme, ["title", "subtitle", "intro"]);

    Object.entries(translation.bigBadges || {}).forEach(([badgeId, translated]) => {
        applyTranslatedText(data.theme?.bigBadges?.[badgeId], translated, TRANSLATABLE_BADGE_KEYS);
    });

    (data.problems || []).forEach(problem => {
        const translated = translation.problems?.[String(problem.level)];
        if (!translated) return;

        applyTranslatedText(problem, translated, ["title", "description"]);
        applyTranslatedText(problem.journal, translated.journal, TRANSLATABLE_JOURNAL_KEYS);
        applyTranslatedText(problem.incomplete, translated.incomplete, ["title", "message"]);
        problem.rewards = translateList(problem.rewards, translated.rewards);

        if (problem.journal) {
            problem.journal.learned = translateList(
                problem.journal.learned,
                translated.journal?.learned
            );
        }

        (problem.badges || []).forEach(badge => {
            applyTranslatedText(badge, translated.badges?.[badge.id], TRANSLATABLE_BADGE_KEYS);
        });

        Object.entries(problem.secretHelpCards || {}).forEach(([cardKey, card]) => {
            applyTranslatedText(
                card,
                translated.secretHelpCards?.[cardKey],
                TRANSLATABLE_CARD_KEYS
            );
        });
    });

    return data;
};

// A missing or broken translation must never stop the lesson panel from opening.
const fetchPracticeTranslation = language => {
    if (language === "en") return Promise.resolve(null);

    return fetch(practiceTranslationPath(language))
        .then(response => (response.ok ? response.json() : null))
        .catch(() => null);
};

const loadPracticeLessons = () => {
    const language = getPracticeLanguage();

    if (!practiceLessonsLoadPromise || practiceLessonsLanguage !== language) {
        practiceLessonsLanguage = language;
        practiceLessonsLoadPromise = fetch(PRACTICE_LESSONS_PATH)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Unable to load ${PRACTICE_LESSONS_PATH}`);
                }

                return response.json();
            })
            .then(data =>
                fetchPracticeTranslation(language).then(translation =>
                    applyPracticeTranslation(data, translation)
                )
            )
            .then(applyPracticeLessonData)
            .catch(error => {
                practiceLessonsLoadPromise = null;
                console.error("Practice lesson data could not be loaded", error);
                throw error;
            });
    }

    return practiceLessonsLoadPromise;
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        applyPracticeLessonData,
        applyPracticeTranslation,
        getPracticeLanguage,
        loadPracticeLessons,
        normalizePracticeProblem
    };
}
