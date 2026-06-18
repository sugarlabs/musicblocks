/* exported PracticeManager */

const STORAGE_KEY = "mb_practice_levels";

const PracticeManager = {
    progress: JSON.parse(localStorage.getItem(STORAGE_KEY)) || {},

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
