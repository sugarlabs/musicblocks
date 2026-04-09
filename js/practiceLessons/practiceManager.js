/* exported PracticeManager */

const STORAGE_KEY = "mb_practice_levels";

const PracticeManager = {
    progress: JSON.parse(localStorage.getItem(STORAGE_KEY)) || {},

    isLevelComplete(level) {
        return !!this.progress[level];
    },

    completeLevel(problem) {
        this.progress[problem.level] = true;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
    }
};
