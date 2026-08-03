/* global fetch */
/* exported PracticeProblems, PracticeTheme, loadPracticeLessons */

const PRACTICE_LESSONS_PATH = "js/practiceLessons/practiceLessons.json";

let PracticeTheme = {
    title: "",
    subtitle: "",
    intro: "",
    bigBadges: {}
};
let PracticeProblems = [];
let practiceLessonsLoadPromise = null;

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

const loadPracticeLessons = () => {
    if (!practiceLessonsLoadPromise) {
        practiceLessonsLoadPromise = fetch(PRACTICE_LESSONS_PATH)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Unable to load ${PRACTICE_LESSONS_PATH}`);
                }

                return response.json();
            })
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
        loadPracticeLessons,
        normalizePracticeProblem
    };
}
