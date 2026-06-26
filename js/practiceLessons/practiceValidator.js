/* exported PracticeValidator */

function getActivity() {
    if (window.ActivityContext && typeof window.ActivityContext.getActivity === "function") {
        try {
            const activity = window.ActivityContext.getActivity();
            if (activity?.blocks) {
                return activity;
            }
        } catch (e) {
            // Activity may not be initialized yet.
        }
    }

    return null;
}

const PracticeValidator = {
    validate(problem) {
        if (!problem?.expected?.pattern) return false;

        return this.validatePattern(problem.expected.pattern);
    },

    validatePattern(expectedPattern) {
        const sequence = this.getCurrentSequence();
        return this.matchesPattern(sequence, expectedPattern);
    },

    matchesPattern(sequence, expectedPattern) {
        if (JSON.stringify(sequence) === JSON.stringify(expectedPattern)) {
            return true;
        }

        if (sequence.length !== expectedPattern.length) return false;

        const expectedToActual = {};
        const actualToExpected = {};

        for (let i = 0; i < expectedPattern.length; i++) {
            const expected = expectedPattern[i];
            const actual = sequence[i];

            if (!actual) return false;

            if (expectedToActual[expected] && expectedToActual[expected] !== actual) {
                return false;
            }

            if (actualToExpected[actual] && actualToExpected[actual] !== expected) {
                return false;
            }

            expectedToActual[expected] = actual;
            actualToExpected[actual] = expected;
        }

        return true;
    },

    getCurrentSequence() {
        const blockList = this.getBlockList();
        const startBlock = Object.values(blockList).find(
            block => block?.name === "start" && !block.trash
        );
        if (!startBlock) return [];

        return this.extractPatternSequence(startBlock.connections?.[1], blockList);
    },

    assessBadges(problem) {
        if (!Array.isArray(problem?.badges)) return [];

        return problem.badges.filter(badge => this.hasBadgeEvidence(problem, badge.criterion));
    },

    hasBadgeEvidence(problem, criterion) {
        switch (criterion) {
            case "completePattern":
                return this.validate(problem);
            case "renamedChunks":
                return this.hasRenamedChunks(problem.expected?.chunkNames);
            case "changedOctave":
                return this.hasChangedPitchOctave(problem.expected?.octaves);
            case "usedTranspose":
                return this.hasConnectedBlockNamed([
                    "settransposition",
                    "setscalartransposition",
                    "setratio",
                    "octave"
                ]);
            case "createdVariation":
                return this.hasCreatedVariation(problem.expected?.pattern);
            default:
                return false;
        }
    },

    extractPatternSequence(startId, blockList) {
        const sequence = [];
        let currentId = this.unwrapHiddenFlow(startId, blockList);
        let guard = 0;

        while (currentId && guard < 100) {
            const block = blockList[currentId];
            if (!block || block.trash) break;

            if (block.name === "nameddo") {
                const actionName = block.overrideName || block.privateData || block.value;
                if (actionName) {
                    sequence.push(actionName);
                }
            } else if (block.name === "repeat") {
                const timesId = block.connections?.[1];
                const times = Number(blockList[timesId]?.value) || 1;
                const body = this.extractPatternSequence(block.connections?.[2], blockList);

                for (let i = 0; i < times; i++) {
                    sequence.push(...body);
                }
            }

            currentId = this.getNextFlowId(block, blockList);
            guard++;
        }

        return sequence;
    },

    hasRenamedChunks(chunkNames) {
        if (!Array.isArray(chunkNames)) return false;

        const originalNames = new Set(chunkNames);
        const blockList = this.getBlockList();

        return Object.values(blockList).some(block => {
            if (!block || block.trash || block.name !== "action") return false;

            const label = this.getActionName(block, blockList);
            return label && !originalNames.has(label);
        });
    },

    getActionName(actionBlock, blockList) {
        const labelId = actionBlock.connections?.[1];
        const labelBlock = blockList[labelId];

        return labelBlock?.value || labelBlock?.privateData || labelBlock?.overrideName || "";
    },

    hasChangedPitchOctave(expectedOctaves) {
        if (Array.isArray(expectedOctaves)) {
            const currentOctaves = this.getPitchOctaves();
            const baselineOctaves = [...expectedOctaves].sort((a, b) => a - b);
            return JSON.stringify(currentOctaves) !== JSON.stringify(baselineOctaves);
        }

        return this.getPitchOctaves().some(octave => octave !== 4);
    },

    getPitchOctaves() {
        const blockList = this.getBlockList();
        const octaves = [];

        Object.values(blockList).forEach(block => {
            if (!block || block.trash || block.name !== "pitch") return;

            const octaveId = block.connections?.[2];
            const octaveBlock = blockList[octaveId];

            if (octaveBlock?.name === "number") {
                octaves.push(Number(octaveBlock.value));
            }
        });

        return octaves.sort((a, b) => a - b);
    },

    hasBlockNamed(names) {
        const blockNames = new Set(names);
        const blockList = this.getBlockList();

        return Object.values(blockList).some(
            block => block && !block.trash && blockNames.has(block.name)
        );
    },

    hasConnectedBlockNamed(names) {
        const blockNames = new Set(names);
        const blockList = this.getBlockList();

        return Object.values(blockList).some(
            block =>
                block &&
                !block.trash &&
                blockNames.has(block.name) &&
                block.connections?.[0] !== null &&
                block.connections?.[0] !== undefined
        );
    },

    hasCreatedVariation(expectedPattern) {
        if (!Array.isArray(expectedPattern)) return false;

        const sequence = this.getCurrentSequence();
        if (sequence.length <= expectedPattern.length) return false;

        return this.matchesPattern(sequence.slice(0, expectedPattern.length), expectedPattern);
    },

    getBlockList() {
        const activity = getActivity();
        return activity?.blocks?.blockList || {};
    },

    getNextFlowId(block, blockList) {
        if (!block?.connections?.length) return null;

        return this.unwrapHiddenFlow(block.connections[block.connections.length - 1], blockList);
    },

    unwrapHiddenFlow(blockId, blockList) {
        let currentId = blockId;
        let guard = 0;

        while (currentId && guard < 20) {
            const block = blockList[currentId];
            if (!block || block.trash || block.name !== "hidden") {
                return currentId;
            }

            currentId = block.connections?.[1];
            guard++;
        }

        return currentId || null;
    }
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = { PracticeValidator };
}
